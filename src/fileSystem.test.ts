import { jest } from '@jest/globals'
import { fs, vol } from 'memfs'
let env = process.env
// import { env } from 'process'

jest.mock('./logger')
jest.mock('fs')
jest.mock('fs/promises')

import {
    recursiveSearch,
    removeExtension,
    readYamlFile,
    findMediaPath,
    moveFilesWithPrompt,
    findOrphanedYamlFiles,
} from "./fileSystem"

describe(removeExtension, () => {
    test('png image', () => {
        expect(removeExtension('file.png')).toBe('file')
    })

    test('relative path', () => {
        expect(removeExtension('./path/to/file.png')).toBe('./path/to/file')
    })

    test('absolute path', () => {
        expect(removeExtension('/path/to/file.png')).toBe('/path/to/file')
    })

    test('no extension', () => {
        expect(removeExtension('file')).toBe('file')
    })

    test('2 extensions', () => {
        expect(removeExtension('file.png.zip')).toBe('file.png')
    })
})

describe(recursiveSearch, () => {
    beforeEach(() => {
        vol.reset()
    })

    test('find images', async () => {
        vol.fromJSON({
            './foo.jpg': '',
            './bar/baz.png': '',
        }, '/app');

        const foundPaths = await recursiveSearch('/app/')

        expect(foundPaths.length).toBe(2)
        expect(foundPaths[1]).toBe('/app/foo.jpg')
        expect(foundPaths[0]).toBe('/app/bar/baz.png')
    })

    test('filter', async () => {
        vol.fromJSON({
            './foo.jpg': '',
            './bar.png': '',
        }, '/app');

        const foundPaths = await recursiveSearch('/app/', ['.png'])

        expect(foundPaths.length).toBe(1)
        expect(foundPaths[0]).toBe('/app/bar.png')
    })
})

describe(readYamlFile, () => {
    beforeEach(() => {
        vol.reset()
    })

    test('find images', async () => {
        vol.fromJSON({
            './foo.yml': `TakenAt: 2016-01-10T10:15:06Z
TakenSrc: meta
UID: pr9tsib2qf7dfegc
Type: image
Title: Long Crendon / United Kingdom / 2016
Description: 4 N5 O0.00 Y0.50 C4.50 YT1 CT3 S300   FM0   FC111111111:zzzzzz0 b1f8
  078043874441663838014c0 bac102 e91fba1e40 cb1f7a1de3 ad1f4b1d71 8f1f551c71 d71f031bfe
  e01fb11d22 e91fd21d1b f21fbf1cf9 fb201d1d6810420771d4b fb208a1dd8
DescriptionSrc: meta
Private: true
TimeZone: Europe/London
PlaceSrc: estimate
Year: 2016
Month: 1
Day: 10
ISO: 2200
Exposure: 1/10
FNumber: 1.8
FocalLength: 4
Quality: 3
Details:
  Keywords: grey, main
  Notes: 4 N5 O0.00 Y0.50 C4.50 YT1 CT3 S300   FM0   FC111111111:zzzzzz0 b1f8 078043874441663838014c0
    bac102 e91fba1e40 cb1f7a1de3 ad1f4b1d71 8f1f551c71 d71f031bfe e01fb11d22 e91fd21d1b
    f21fbf1cf9 fb201d1d6810420771d4b fb208a1dd8
  NotesSrc: meta
CreatedAt: 2022-04-04T17:27:47Z
UpdatedAt: 2022-08-05T18:13:53.532791426Z`
        }, '/app');

        const data = await readYamlFile('/app/foo.yml')

        expect(data.TakenAt).toEqual(new Date('2016-01-10T10:15:06Z'))
    })
})

describe(findMediaPath, () => {
    const envBackup = env

    beforeEach(() => {
        jest.resetModules()
        vol.reset()
        env.ORIGINALS_PATH = '/app/originals/'
        env.SIDECAR_PATH = '/app/storage/sidecar/'
    })

    afterEach(() => {
        env = envBackup
    })

    test('find single', async() => {
        vol.fromJSON({
            './storage/sidecar/foo.yml': '',
            './originals/foo.png': '',
        }, '/app');

        const mediaPath = await findMediaPath('/app/storage/sidecar/foo.yml')

        expect(mediaPath.length).toBe(1)
        expect(mediaPath[0]).toBe('/app/originals/foo.png')
    })

    test('find in folders', async() => {
        vol.fromJSON({
            './storage/sidecar/subdir/foo.yml': '',
            './originals/subdir/foo.png': '',
        }, '/app');

        const mediaPath = await findMediaPath('/app/storage/sidecar/subdir/foo.yml')

        expect(mediaPath.length).toBe(1)
        expect(mediaPath[0]).toBe('/app/originals/subdir/foo.png')
    })

    test('find stack', async() => {
        vol.fromJSON({
            './storage/sidecar/foo.yml': '',
            './originals/foo.png': '',
            './originals/foo.jpg': '',
        }, '/app');

        const mediaPath = await findMediaPath('/app/storage/sidecar/foo.yml')

        expect(mediaPath.length).toBe(2)
        expect(mediaPath[0]).toBe('/app/originals/foo.jpg')
        expect(mediaPath[1]).toBe('/app/originals/foo.png')
    })

    test('do not find', async() => {
        vol.fromJSON({
            './storage/sidecar/foo.yml': '',
            './originals/subdir/foo.png': '',
        }, '/app');

        const mediaPath = await findMediaPath('/app/storage/sidecar/foo.yml')

        expect(mediaPath.length).toBe(0)
    })
})

describe(moveFilesWithPrompt, () => {
    beforeEach(() => {
        vol.reset()
    })

    test('move single', async() => {
        vol.fromJSON({
            './foo.png': '',
        }, '/app');

        await moveFilesWithPrompt(['/app/foo.png'], '/app/target/', undefined, true)

        await expect(vol.promises.access('/app/foo.png')).rejects.toThrow()
        await expect(vol.promises.access('/app/target/foo.png')).resolves.not.toThrow()
    })

    test('move many', async() => {
        vol.fromJSON({
            './foo.png': '',
            './bar.jpg': '',
        }, '/app');

        await moveFilesWithPrompt(['/app/foo.png', '/app/bar.jpg'], '/app/target/', undefined, true)

        await expect(vol.promises.access('/app/foo.png')).rejects.toThrow()
        await expect(vol.promises.access('/app/bar.jpg')).rejects.toThrow()
        await expect(vol.promises.access('/app/target/foo.png')).resolves.not.toThrow()
        await expect(vol.promises.access('/app/target/bar.jpg')).resolves.not.toThrow()
    })

    test('move from folder', async() => {
        vol.fromJSON({
            './subdir/foo.png': '',
        }, '/app');

        await moveFilesWithPrompt(['/app/subdir/foo.png'], '/app/target/', undefined, true)

        await expect(vol.promises.access('/app/subdir/foo.png')).rejects.toThrow()
        await expect(vol.promises.access('/app/target/foo.png')).resolves.not.toThrow()
    })

    test('do not move', async() => {
        vol.fromJSON({
            './foo.png': '',
        }, '/app');

        // Extension is different.
        await expect(moveFilesWithPrompt(['/app/foo.jpg'], '/app/target/', undefined, true)).rejects.toThrowError()

        // File shouldn't have moved.
        await expect(vol.promises.access('/app/foo.png')).resolves.not.toThrow()
        // New file should not have been created.
        await expect(vol.promises.access('/app/target/foo.png')).rejects.toThrow()
    })
})

describe(findOrphanedYamlFiles, () => {
    const envBackup = env

    beforeEach(() => {
        jest.resetModules()
        vol.reset()
        env.ORIGINALS_PATH = '/app/originals/'
        env.SIDECAR_PATH = '/app/storage/sidecar/'
    })

    afterEach(() => {
        env = envBackup
    })

    test('find none', async() => {
        vol.fromJSON({
            './originals/foo.png': '',
            './storage/sidecar/foo.yml': '',
        }, '/app');

        const orphanedYamlFiles = await findOrphanedYamlFiles(['/app/storage/sidecar/foo.yml'])

        expect(orphanedYamlFiles.length).toBe(0)
    })

    test('find one', async() => {
        vol.fromJSON({
            // Image has different name.
            './originals/foo.png': '',
            './storage/sidecar/subdir/bar.yml': '',
        }, '/app');

        const orphanedYamlFiles = await findOrphanedYamlFiles(['/app/storage/sidecar/subdir/bar.yml'])

        expect(orphanedYamlFiles.length).toBe(1)
        expect(orphanedYamlFiles[0]).toBe('/app/storage/sidecar/subdir/bar.yml')
    })
})
