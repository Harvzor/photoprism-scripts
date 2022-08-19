import inquirer from 'inquirer'
import { env } from 'process'
import dotenv from 'dotenv'

import {
    recursiveSearch,
    findMediaFilesAndMoveToTarget,
    findOrphanedYamlFiles,
    moveFilesToTargetWithPrompt,
    renameMediaFilesWithPrompt,
    organiseMedia,
    findMediaPaths,
} from './fileSystem'
import { SidecarFile, } from './types/sidecarFile'
import * as logger from './logger'

dotenv.config()

const logIndexReminder = () => {
    logger.log(`Remember to index again in PhotoPrism!`)
}

const imageMoverUi = async () => {
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
            const yamlPaths = await recursiveSearch(env.SIDECAR_PATH, ['.yml'])
            logger.log(`Found ${yamlPaths.length} YAML files in ${env.SIDECAR_PATH}`)

            switch(answers.select) {
                case choices[0]:
                    await findMediaFilesAndMoveToTarget(yamlPaths, 'private', (file: SidecarFile) => file.Private === true)
                    logIndexReminder()
                    break;
                case choices[1]:
                    await findMediaFilesAndMoveToTarget(yamlPaths, 'archived', (file: SidecarFile) => file.DeletedAt !== undefined)
                    logIndexReminder()
                    break;
                case choices[2]:
                    const orphanedYamlFiles = await findOrphanedYamlFiles(yamlPaths)
                    await moveFilesToTargetWithPrompt(orphanedYamlFiles, env.SIDECAR_LOST_AND_FOUND_PATH, env.SIDECAR_PATH)
                    logIndexReminder()
                    break;
                case choices[3]:
                    const releventYamlFiles = await organiseMedia(yamlPaths)
                    const releventImagePaths = await findMediaPaths(releventYamlFiles)

                    await moveFilesToTargetWithPrompt(releventImagePaths, env.ORIGINALS_PATH, env.ORIGINALS_PATH)

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

const main = async () => {
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
