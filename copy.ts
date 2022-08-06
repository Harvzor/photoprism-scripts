import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

const photosPath = '/media/harvey/data/Images/Life/main/'
const sidecarPath = '/media/harvey/data/Images/PhotoPrism/storage/sidecar/'

/*
TakenAt: 2003-07-11T14:08:33Z
TakenSrc: meta
UID: pra8dk339xe61swy
Type: video
Title: Seashore / 2003
OriginalName: random-video/Bike/Vietnam 2017/desktop maybe/test/VIDO0018
Year: 2003
Month: 7
Day: 11
Quality: 3
Favourite: true
Private: true
Details:
  Keywords: bike, brown, desktop, maybe, random, seashore, test, video, vietnam
CreatedAt: 2022-04-12T14:28:51Z
UpdatedAt: 2022-08-05T18:06:59.585384018Z
DeletedAt: 2022-08-05T18:06:59.585384018Z
*/
export interface SidecarFile {
    TakenAt:      Date;
    TakenSrc:     string;
    UID:          string;
    Type:         string;
    Title:        string;
    OriginalName: string;
    Year:         number;
    Month:        number;
    Day:          number;
    Quality:      number;
    Favourite:    boolean;
    Private:      boolean;
    Details:      SideCarFileDetails;
    CreatedAt:    Date;
    UpdatedAt:    Date;
    DeletedAt:    Date;
}

export interface SideCarFileDetails {
    Keywords: string;
}

const search = async function(folder: string): Promise<string[]> {
    const paths: string[] = [];

    try {
        const filesOrFolderNames = await fs.promises.readdir(folder);
        for (const fileOrFolderName of filesOrFolderNames) {
            let fileOrFolderPath = path.join(folder, fileOrFolderName);
            const stat = await fs.promises.stat(fileOrFolderPath);

            if (stat.isFile()) {
                if (path.extname(fileOrFolderName) === '.yml')
                    if (matches(fileOrFolderPath))
                        paths.push(fileOrFolderPath)
            } else if (stat.isDirectory()) {
                await search(fileOrFolderPath);
            }
        }
    } catch (err) {
        console.error(err);
    }

    return paths;
};

const matches = function(yamlFilePath: string): boolean {
    try {
        const doc = yaml.load(fs.readFileSync(yamlFilePath, 'utf8')) as SidecarFile;

        if (doc.Private) {
            return true;
        }

        return false;
    } catch (e) {
        console.log(e);

        throw e;
    }
}

const findImagePaths = async function(paths: string[]): Promise<string[]> {
    const result: string[] = [];

    for (const yamlPath of paths) {
        if (!yamlPath.startsWith(sidecarPath))
            throw 'path doens\'t start correctly';

        console.log(yamlPath);

        // This file doesn't exist.
        const imageLocationPath = path.join(photosPath, yamlPath.substring(sidecarPath.length))

        console.log(imageLocationPath);

        // But the file should be in this dir.
        const imageLocationDir = path.dirname(imageLocationPath);
        const potentialMatches = await fs.promises.readdir(imageLocationDir);
        for (const potentialMatch of potentialMatches) {
            const stat = await fs.promises.stat(path.join(imageLocationDir, potentialMatch));

            if (stat.isDirectory())
                continue;

            // console.log(yamlPath, potentialMatch);

            // If the file name matches.
            if (path.basename(yamlPath).split('.')[0] === potentialMatch.split('.')[0]) {
                result.push(path.join(imageLocationDir, potentialMatch));
            }
        }
    }

    return result;
};

const moveImages = async function(imagePaths: string[]) {
    const targetDir = path.join(photosPath, 'private');

    for (const imagePath of imagePaths) {
        // No need to move as the file is already there.
        if (path.dirname(imagePath) === targetDir)
            continue;

        await fs.promises.rename(imagePath, path.join(targetDir, path.basename(imagePath)));
    }
}:

const yamlPaths = await search(sidecarPath);

const imagePaths = await findImagePaths(yamlPaths);

// moveImages(imagePaths);
