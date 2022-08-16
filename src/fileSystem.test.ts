import { jest } from '@jest/globals'

jest.doMock('fs')
jest.doMock('fs/promises')

// https://github.com/kulshekhar/ts-jest/issues/3206

import * as fs from 'fs/promises'
import { vol } from 'memfs'

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
        vol.reset()
    })

    test('asd', async () => {
        // await vol.promises.mkdir('./test/')
        // await vol.promises.writeFile('./test/test.jpg', '')
        await fs.mkdir('./test/')
        await fs.writeFile('./test/test.jpg', '')

        const foundPaths = await recursiveSearch('./test/')

        expect(foundPaths).toBe('./test/test.jpg')
    })
})