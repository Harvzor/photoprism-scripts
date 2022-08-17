import { jest } from '@jest/globals'
import * as fs from 'fs'
import { vol } from 'memfs'

jest.mock('fs')
jest.mock('fs/promises')

import {
    recursiveSearch,
    removeExtension,
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
        // vol.reset()
    })

    test('asd', async () => {
        await fs.promises.mkdir('/test/')
        await fs.promises.writeFile('/test/test.jpg', '')

        const foundPaths = await recursiveSearch('/test/')

        expect(foundPaths[0]).toBe('/test/test.jpg')
    })
})