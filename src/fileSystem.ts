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
 * @param  {string[]} imagePaths Full image paths.
 * @param  {string} targetFolder The name of the folder which the images should be moved to.
 */
const moveImages = async function(imagePaths: string[], targetFolder: string) {
    const choices = [
        'Move',
        'Don\'t move',
        'Move all (auto)',
    ]
    let auto = false

    const move = function(oldImagePath: string, newImagePath: string) {
        // await fs.promises.rename(imagePath, newImagePath)
    }

    const targetDir = path.join(originalsPath, targetFolder)

    if (!fs.existsSync(targetDir)) {
        console.log(`Target folder does not exist, creating ${targetDir}`)
        await fs.promises.mkdir(targetDir)
    }

    const imagePathsThatNeedMoving = imagePaths
        // No need to move as the file is already there.
        .filter(imagePath => path.dirname(imagePath) != targetDir)

    console.log(`Found ${imagePathsThatNeedMoving.length} images that need moving`)

    let i = 1
    for (const oldImagePath of imagePathsThatNeedMoving) {
        const newImagePath = path.join(targetDir, path.basename(oldImagePath))

        console.log(`---`)
        console.log(`${i}/${imagePathsThatNeedMoving.length}`)
        console.log(`Move media file`)
        console.log(`| from ${oldImagePath}`)
        console.log(`| to   ${newImagePath}`)

        if (auto) {
            move(oldImagePath, newImagePath)
        } else {
            await inquirer
                .prompt({
                    name: 'select',
                    message: `Move media file?`,
                    type: 'list',
                    choices: choices,
                })
                .then(answers => {
                    switch(answers.select) {
                        case choices[0]:
                            move(oldImagePath, newImagePath)
                            break;
                        case choices[1]:
                            console.log(`NOT moving image/video from ${oldImagePath} to ${newImagePath}`)
                            break;
                        case choices[2]:
                            auto = true
                            move(oldImagePath, newImagePath)
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

    await moveImages(matchingImagePaths, targetFolderName)
}
