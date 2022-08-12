import inquirer from 'inquirer'

import { recursiveSearch, findImagesAndMoveToTarget, findOrphanedYamlFiles, moveFilesWithPrompt, renameFilesWithPrompt, } from './fileSystem'
import { sidecarPath, sidecarLostAndFoundPath, } from './config'
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
                    console.error('Option not available yet')
                    break;
                case choices[4]:
                    await renameFilesWithPrompt(yamlPaths)
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

await main()
