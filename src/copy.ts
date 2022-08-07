import * as yaml from 'js-yaml'
import * as fs from 'fs'
import * as path from 'path'
import { SidecarFile } from './types/SidecarFile'

const originalsPath = '/media/harvey/data/Images/Life/main/'
const storagePath = '/media/harvey/data/Images/PhotoPrism/storage/'

// const originalsPath = '/media/harvey/data/Dev/Tech/Node/photoprism-scripts/data/originals/'
// const storagePath = '/media/harvey/data/Dev/Tech/Node/photoprism-scripts/data/storage/'

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

        // Assuming that the image exists in the same folder structure as the sidecar?
        const imageLocationDir = path.dirname(
            path.join(
                originalsPath,
                yamlPath.substring(sidecarPath.length)
            )
        )

        const potentialMatches = await fs.promises.readdir(imageLocationDir)
        let matchesFound = 0
        for (const potentialMatch of potentialMatches) {
            const stat = await fs.promises.stat(path.join(imageLocationDir, potentialMatch))

            if (stat.isDirectory())
                continue

            // If the file name matches.
            // Could also match multiple times if the image is a burst, such as '20210717_163906_1BF7A639.00002.jpg'.
            // If a burst is detected, there will only be one YAML file called ''20210717_163906_1BF7A639.yml'.

            // BUG:
            // The name might also not match, example being `20160110_101506_EFAD56D8.yml` not matching name or location
            // of `2016-01-10T10_15_06_20160110_101506.jpg`. YAML file says OriginalName is `20160110_101506` though.
            if (path.basename(yamlPath).split('.')[0] === potentialMatch.split('.')[0]) {
                result.push(path.join(imageLocationDir, potentialMatch))
                matchesFound++
            }
        }

        if (matchesFound == 0)
            throw 'Image not found for YAML.'
    }

    return result
}

/**
 * @param  {string[]} imagePaths Full image paths.
 * @param  {string} targetFolder The name of the folder which the images should be moved to.
 */
const moveImages = async function(imagePaths: string[], targetFolder: string) {
    const targetDir = path.join(originalsPath, targetFolder)

    if (!fs.existsSync(targetDir)) {
        console.log(`Target folder does not exist, creating ${targetDir}`)
        await fs.promises.mkdir(targetDir)
    }

    for (const imagePath of imagePaths) {
        // No need to move as the file is already there.
        if (path.dirname(imagePath) === targetDir)
            continue

        const newImagePath = path.join(targetDir, path.basename(imagePath))

        console.log(`Moving image/video from ${imagePath} to ${newImagePath}`)

        // await fs.promises.rename(imagePath, newImagePath)
    }
}

const yamlPaths = await recursiveSearchSidecar(sidecarPath)

console.log(`Found ${yamlPaths.length} YAML files in ${sidecarPath}`)

const moveEm = async function(yamlPaths: string[], folderName: string, func: Function) {
    const matchingYamlPaths = yamlPaths
        .filter(x => func(readYamlFile(x)))

    console.log(`Found ${matchingYamlPaths.length} YAML files that belong to ${folderName}`)
    const matchingImagePaths = await findImagePaths(matchingYamlPaths)
    console.log(`Found ${matchingImagePaths.length} image/video files that belong to ${folderName}`)

    // Actually not a good check since burst images can find multiples (many images to one YAML).
    if (matchingYamlPaths.length > matchingImagePaths.length) {
        console.log(`That means there's ${matchingYamlPaths.length - matchingImagePaths.length} images/videos missing?`)
    }

    await moveImages(matchingImagePaths, folderName)
}

await moveEm(yamlPaths, 'private', (file: SidecarFile) => file.Private === true)
