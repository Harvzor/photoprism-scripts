import { removeExtension, } from "./fileSystem"

test('removeExtension - png image', () => {
    expect(removeExtension('file.png')).toBe('file')
})

test('removeExtension - relative path', () => {
    expect(removeExtension('./path/to/file.png')).toBe('./path/to/file')
})

test('removeExtension - absolute path', () => {
    expect(removeExtension('/path/to/file.png')).toBe('/path/to/file')
})

test('removeExtension - no extension', () => {
    expect(removeExtension('file')).toBe('file')
})

test('removeExtension - 2 extensions', () => {
    expect(removeExtension('file.png.zip')).toBe('file.png')
})
