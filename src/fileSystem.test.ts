import { removeExtension, } from "./fileSystem"

test('adds 1 + 2 to equal 3', () => {
    expect(removeExtension('./path/to/file.png')).toBe('./path/to/file')
})

// test('1', () => {
//     expect(1).toBe(1)
// })
