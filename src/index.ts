import inquirer from 'inquirer'

import {
    recursiveSearch,
    findImagesAndMoveToTarget,
    findOrphanedYamlFiles,
    moveFilesWithPrompt,
    renameMediaFilesWithPrompt,
    organiseMedia,
    findImagePaths,
} from './fileSystem'
import { sidecarPath, sidecarLostAndFoundPath, originalsPath, } from './config'
import { SidecarFile, } from './types/sidecarFile'

const logIndexReminder = function() {
    console.log(`Remember to index again in PhotoPrism!`)
}

const imageMoverUi = async function() {
    const choices = [
        'Move private media files to private folder',
        'Move archived media files to archived folder',
        'Find orphan sidecar files',
        'Organise media files and sidecar files into folders (ignoring private/archived)',
        'Rename media files and sidecar files',
    ]

    return inquirer
        .prompt({
            name: 'select',
            message: 'Select an option:',
            type: 'list',
            choices: choices,
        })
        .then(async answers => {
            const yamlPaths = await recursiveSearch(sidecarPath, ['.yml'])
            console.log(`Found ${yamlPaths.length} YAML files in ${sidecarPath}`)

            switch(answers.select) {
                case choices[0]:
                    await findImagesAndMoveToTarget(yamlPaths, 'private', (file: SidecarFile) => file.Private === true)
                    logIndexReminder()
                    break;
                case choices[1]:
                    await findImagesAndMoveToTarget(yamlPaths, 'archived', (file: SidecarFile) => file.DeletedAt !== undefined)
                    logIndexReminder()
                    break;
                case choices[2]:
                    const orphanedYamlFiles = await findOrphanedYamlFiles(yamlPaths)
                    await moveFilesWithPrompt(orphanedYamlFiles, sidecarLostAndFoundPath, sidecarPath)
                    logIndexReminder()
                    break;
                case choices[3]:
                    const releventYamlFiles = await organiseMedia(yamlPaths)
                    const releventImagePaths = await findImagePaths(releventYamlFiles)

                    await moveFilesWithPrompt(releventImagePaths, originalsPath, originalsPath)

                    logIndexReminder()
                    break;
                case choices[4]:
                    await renameMediaFilesWithPrompt(yamlPaths)
                    logIndexReminder()
                    break;
                default:
                    throw 'Unhandled input'
            }   
        })
}

const main = async function() {
    const choices = [
        'Move media files',
    ]

    inquirer
        .prompt({
            name: 'select',
            message: 'Select an option:',
            type: 'list',
            choices: choices,
        })
        .then(async answers => {
            switch(answers.select) {
                case choices[0]:
                    await imageMoverUi()
                    break;
                default:
                    throw 'Unhandled input'
            }   

            await main()
        })
}

main()
    .then(text => {
    })
    .catch(err => {
    });
