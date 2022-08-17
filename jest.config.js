/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    // preset: 'ts-jest/presets/default-esm',
    // globals: {
    //   'ts-jest': {
    //     useESM: true,
    //   },
    // },
    coverageReporters: [
      "json-summary", 
    ],
};