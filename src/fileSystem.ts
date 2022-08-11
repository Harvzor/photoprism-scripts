import * as yaml from 'js-yaml'
import * as fs from 'fs'
import * as path from 'path'
import inquirer from 'inquirer'

import { originalsPath, sidecarPath, } from './config'
import { SidecarFile, } from './types/sidecarFile'

/**
 * Find files matching the extension name.
 * @param  {string} folder
 * @param  {string} extensionNames Naming including leading dot, example: .yml
 */
export const recursiveSearch = async function(folder: string, extensionNames?: string[]): Promise<string[]> {
    let paths: string[] = []

    try {
        const filesOrFolderNames = await fs.promises.readdir(folder)
        for (const fileOrFolderName of filesOrFolderNames) {
            let fileOrFolderPath = path.join(folder, fileOrFolderName)
            const stat = await fs.promises.stat(fileOrFolderPath)

            if (stat.isFile()) {
                if (extensionNames == undefined || extensionNames.some(x => x == path.extname(fileOrFolderName)))
                    paths.push(fileOrFolderPath)
            } else if (stat.isDirectory()) {
                paths = paths.concat(await recursiveSearch(fileOrFolderPath, extensionNames))
            }
        }
    } catch (err) {
        console.error(err)
    }

    return paths
}

/**
 * Get the contents of a YAML file.
 */
const readYamlFile = function(yamlFilePath: string): SidecarFile{
    try {
        const doc = yaml.load(fs.readFileSync(yamlFilePath, 'utf8')) as SidecarFile 

        return doc
    } catch (e) {
        console.error(e)

        throw e
    }
}

const findImagePath = async function(yamlPath: string): Promise<string[]> {
    const result: string[] = []

    if (!yamlPath.startsWith(sidecarPath))
        throw 'path doens\'t start correctly'

    // Assuming that the image exists in the same folder structure as the sidecar.
    const imageLocationDir = path.dirname(
        path.join(
            originalsPath,
            yamlPath.substring(sidecarPath.length)
        )
    )

    try {
        // Check if the target dir exists.
        await fs.promises.access(imageLocationDir)

        const potentialMatches = await fs.promises.readdir(imageLocationDir)
        let matchesFound = 0
        for (const potentialMatch of potentialMatches) {
            const stat = await fs.promises.stat(path.join(imageLocationDir, potentialMatch))

            if (stat.isDirectory())
                continue

            // If the file name matches.
            // Could also match multiple times if the image is a burst, such as '20210717_163906_1BF7A639.00002.jpg'.
            // If a burst is detected, there will only be one YAML file called ''20210717_163906_1BF7A639.yml'.
            if (path.basename(yamlPath).split('.')[0] === potentialMatch.split('.')[0]) {
                result.push(path.join(imageLocationDir, potentialMatch))
                matchesFound++
            }
        }

        // // Somehow I have YAML files which are orphaned.
        // if (matchesFound == 0)
        //     console.error(`No image found for ${yamlPath}`)
    } catch {
        // Folder does not exist.
        // YAMLs are orphans.
    }

    return result
}

const findImagePaths = async function(yamlPaths: string[]): Promise<string[]> {
    let result: string[] = []

    for (const yamlPath of yamlPaths) {
        result = result.concat(await findImagePath(yamlPath))
    }

    return result
}

/**
 * @param  {string[]} filePaths Full paths.
 * @param  {string} targetDir Base path of where the files should be moved.
 * @param  {string?} oldDir If defined, the the file will be moved from the old path, but retain the structure excluding the oldDir.
 */
export const moveFilesWithPrompt = async function(filePaths: string[], targetDir: string, oldDir?: string) {
    const choices = [
        'Move',
        'Don\'t move',
        'Move all (auto)',
    ]
    let auto = false

    const move = function(oldImagePath: string, newImagePath: string) {
        // await fs.promises.rename(imagePath, newImagePath)
    }

    if (!fs.existsSync(targetDir)) {
        console.log(`Target folder does not exist, creating ${targetDir}`)
        await fs.promises.mkdir(targetDir)
    }

    const filePathsThatNeedMoving = filePaths
        // No need to move as the file is already there.
        .filter(filePath => path.dirname(filePath) != targetDir)

    console.log(`Found ${filePathsThatNeedMoving.length} files that need moving`)

    let i = 1
    for (const oldFilePath of filePathsThatNeedMoving) {
        const newFilePath = path.join(
            targetDir,
            oldDir
                ? path.dirname(
                    // oldFilePath may be: photoprism-test/data/storage/sidecar/example/IMG_20220804_113018.yml
                    // so strip photoprism-test/data/storage/sidecar/ to get just example/IMG_20220804_113018.yml
                    oldFilePath.replace(oldDir, '')
                )
                : '',
            path.basename(oldFilePath)
        )

        console.log(`---`)
        console.log(`${i}/${filePathsThatNeedMoving.length}`)
        console.log(`Move file`)
        console.log(`| from ${oldFilePath}`)
        console.log(`| to   ${newFilePath}`)

        if (auto) {
            move(oldFilePath, newFilePath)
        } else {
            await inquirer
                .prompt({
                    name: 'select',
                    message: `Move file?`,
                    type: 'list',
                    choices: choices,
                })
                .then(answers => {
                    switch(answers.select) {
                        case choices[0]:
                            move(oldFilePath, newFilePath)
                            break;
                        case choices[1]:
                            console.log(`NOT moving file from ${oldFilePath} to ${newFilePath}`)
                            break;
                        case choices[2]:
                            auto = true
                            move(oldFilePath, newFilePath)
                            break;
                        default:
                            throw 'Unhandled input'
                    }   
                })
        }

        i++
    }

    console.log(`---`)
    console.log(`Finished moving files`)
    console.log(`---`)
}

export const findOrphanedYamlFiles = async function(yamlPaths: string[]): Promise<string[]> {
    const orphanYamlPaths = []
    const mediaFiles = await recursiveSearch(originalsPath)

    console.log(`Found ${mediaFiles.length} files in ${originalsPath}`)

    for (let yamlPath of yamlPaths) {
        // If the file name matches.
        // Could also match multiple times if the image is a burst, such as '20210717_163906_1BF7A639.00002.jpg'.
        // If a burst is detected, there will only be one YAML file called ''20210717_163906_1BF7A639.yml'.
        if (!mediaFiles.some(mediaFile => path.basename(yamlPath).split('.')[0] === path.basename(mediaFile).split('.')[0])) {
            orphanYamlPaths.push(yamlPath)
            console.log(yamlPath)
        }
    }

    return orphanYamlPaths
}

export const findImagesAndMoveToTarget = async function(yamlPaths: string[], targetFolderName: string, filterFunction: Function) {
    const matchingYamlPaths = yamlPaths
        .filter(x => filterFunction(readYamlFile(x)))

    console.log(`Found ${matchingYamlPaths.length} YAML files that belong to ${targetFolderName}`)
    const matchingImagePaths = await findImagePaths(matchingYamlPaths)
    console.log(`Found ${matchingImagePaths.length} image/video files that belong to ${targetFolderName}`)

    // Actually not a good check since burst images can find multiples (many images to one YAML).
    if (matchingYamlPaths.length > matchingImagePaths.length) {
        console.error(`That means there's ${matchingYamlPaths.length - matchingImagePaths.length} images/videos missing?`)
    }

    await moveFilesWithPrompt(matchingImagePaths, path.join(originalsPath, targetFolderName))
}
