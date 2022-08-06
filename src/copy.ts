import * as yaml from 'js-yaml'
import * as fs from 'fs'
import * as path from 'path'
import blessed from 'blessed'
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

    if (matchingYamlPaths.length > matchingImagePaths.length) {
        console.log(`That means there's ${matchingYamlPaths.length - matchingImagePaths.length} images/videos missing?`)
    }

    await moveImages(matchingImagePaths, folderName)
}

const program = blessed.program();

// Create a screen object.
const screen = blessed.screen({
    smartCSR: true
})

screen.title = 'my window title';

// Create a box perfectly centered horizontally and vertically.
// const box = blessed.box({
//   top: 'center',
//   left: 'center',
//   width: '50%',
//   height: '50%',
//   content: 'Hello {bold}world{/bold}!',
//   tags: true,
//   border: {
//     type: 'line'
//   },
//   style: {
//     fg: 'white',
//     bg: 'magenta',
//     border: {
//       fg: '#f0f0f0'
//     },
//     hover: {
//       bg: 'green'
//     }
//   }
// });

// screen.append(box);

const form = blessed.form({
  parent: screen,
  keys: true,
  left: 0,
  top: 0,
  width: 30,
  height: 4,
  bg: 'green',
  content: 'Submit or cancel?'
});

const radioSet = blessed.radioset({
    parent: form,
})

const privateRadio = blessed.radiobutton({
    parent: radioSet,
    text: 'Private',
})

const archivedRadio = blessed.radiobutton({
    parent: radioSet,
    top: 2,
    text: 'Archived',
})

privateRadio.on('check', async function() {
    form.detach()
    screen.render()

    // Create a box perfectly centered horizontally and vertically.
    var box = blessed.box({
        parent: screen,
        top: 'center',
        left: 'center',
        width: '100%',
        height: '100%',
        content: 'Hello {bold}world{/bold}!',
        tags: true,
        border: {
            type: 'line'
        },
        style: {
            fg: 'white',
            bg: 'magenta',
            border: {
                fg: '#f0f0f0'
            },
        }
    });

    // If box is focused, handle `enter`/`return` and give us some more content.
    box.key('enter', function(ch, key) {
        box.insertLine(1, 'foo');
        box.insertLine(1, 'bar');
        screen.render();
    });

    screen.render()

    await moveEm(yamlPaths, 'private', (file: SidecarFile) => file.Private === true)
});

archivedRadio.on('check', async function() {
    form.detach()
    screen.render()
    await moveEm(yamlPaths, 'archived', (file: SidecarFile) => file.DeletedAt !== undefined)
});


screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

// Append our box to the screen.

screen.render()
