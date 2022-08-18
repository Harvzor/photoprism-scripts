import { jest } from '@jest/globals'
import { vol } from 'memfs'
import { env } from 'process'

jest.mock('fs')
jest.mock('fs/promises')

import {
    recursiveSearch,
    removeExtension,
    readYamlFile,
    findMediaPath,
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
    beforeEach(() => {
        vol.reset()
        env.ORIGINALS_PATH = '/app/originals/'
        env.SIDECAR_PATH = '/app/storage/sidecar/'
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
