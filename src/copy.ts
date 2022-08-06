import * as yaml from 'js-yaml'
import * as fs from 'fs'
import * as path from 'path'
import { SidecarFile } from './types/SidecarFile'

// const originalsPath = '/media/harvey/data/Images/Life/main/'
// const storagePath = '/media/harvey/data/Images/PhotoPrism/storage/'

const originalsPath = '/media/harvey/data/Dev/Tech/Node/photoprism-scripts/data/originals/'
const storagePath = '/media/harvey/data/Dev/Tech/Node/photoprism-scripts/data/storage/'

const sidecarPath = path.join(storagePath, 'sidecar/')

/**
 * Find YAML files in the sidecar dir.
 * @param  {string} folder
 */
const recursiveSearchSidecar = async function(folder: string): Promise<string[]> {
    let paths: string[] = []

    try {
        const filesOrFolderNames = await fs.promises.readdir(folder)
        for (const fileOrFolderName of filesOrFolderNames) {
            let fileOrFolderPath = path.join(folder, fileOrFolderName)
            const stat = await fs.promises.stat(fileOrFolderPath)

            if (stat.isFile()) {
                if (path.extname(fileOrFolderName) === '.yml')
                    paths.push(fileOrFolderPath)
            } else if (stat.isDirectory()) {
                paths = paths.concat(await recursiveSearchSidecar(fileOrFolderPath))
            }
        }
    } catch (err) {
        console.error(err)
    }

    return paths
}

const readYamlFile = function(yamlFilePath: string): SidecarFile{
    try {
        const doc = yaml.load(fs.readFileSync(yamlFilePath, 'utf8')) as SidecarFile 

        return doc
    } catch (e) {
        console.log(e)

        throw e
    }
}

const findImagePaths = async function(paths: string[]): Promise<string[]> {
    const result: string[] = []

    for (const yamlPath of paths) {
        if (!yamlPath.startsWith(sidecarPath))
            throw 'path doens\'t start correctly'

        // This file doesn't exist.
        const imageLocationPath = path.join(originalsPath, yamlPath.substring(sidecarPath.length))

        // But the file should be in this dir.
        const imageLocationDir = path.dirname(imageLocationPath)
        const potentialMatches = await fs.promises.readdir(imageLocationDir)
        for (const potentialMatch of potentialMatches) {
            const stat = await fs.promises.stat(path.join(imageLocationDir, potentialMatch))

            if (stat.isDirectory())
                continue

            // If the file name matches.
            if (path.basename(yamlPath).split('.')[0] === potentialMatch.split('.')[0]) {
                result.push(path.join(imageLocationDir, potentialMatch))
            }
        }
    }

    return result
}
/**
 * @param  {string[]} imagePaths Full image paths.
 * @param  {string} targetFolder The name of the folder which the images should be moved to.
 */
const moveImages = async function(imagePaths: string[], targetFolder: string) {
    const targetDir = path.join(originalsPath, targetFolder)

    if (!fs.existsSync(targetDir))
        await fs.promises.mkdir(targetDir)

    for (const imagePath of imagePaths) {
        // No need to move as the file is already there.
        if (path.dirname(imagePath) === targetDir)
            continue

        await fs.promises.rename(imagePath, path.join(targetDir, path.basename(imagePath)))
    }
}

const yamlPaths = await recursiveSearchSidecar(sidecarPath)

console.log(yamlPaths)

const privateYamlPaths = yamlPaths
    .filter(x => readYamlFile(x).Private)
console.log('private', privateYamlPaths)
const privateImagePaths = await findImagePaths(privateYamlPaths)
console.log(privateImagePaths)
moveImages(privateImagePaths, 'private')

const archivedYamlPaths = yamlPaths
    .filter(x => readYamlFile(x).DeletedAt !== undefined)
console.log('archived', archivedYamlPaths)
const archivedImagePaths = await findImagePaths(archivedYamlPaths)
console.log(archivedImagePaths)
moveImages(archivedImagePaths, 'archived')
