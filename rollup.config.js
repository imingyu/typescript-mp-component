/* eslint-disable @typescript-eslint/no-require-imports */
const { babel } = require('@rollup/plugin-babel');
const RollupReplace = require('@rollup/plugin-replace');
const swc = require('unplugin-swc');
const copy = require('rollup-plugin-copy');
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

const pkgJSON = JSON.parse(readFileSync(path.resolve(__dirname, './package.json'), 'utf8'));

module.exports = {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/cjs/index.js',
            format: 'cjs',
            sourcemap: true
        },
        {
            file: 'dist/esm/index.js',
            format: 'esm',
            sourcemap: true
        }
    ],
    plugins: [
        swc.default.rollup({
            tsconfigFile: './tsconfig.json'
        }),
        RollupReplace({
            delimiters: ['', ''],
            values: {
                VERSION: pkgJSON.version
            },
            preventAssignment: true
        }),
        babel({
            extensions: ['.js'],
            presets: [
                [
                    '@babel/env',
                    {
                        targets: {
                            chrome: 53,
                            android: 6,
                            ios: 10
                        }
                    }
                ]
            ],
            babelHelpers: 'inline'
        }),
        copy({
            targets: [
                {
                    src: 'README.md',
                    dest: 'dist'
                },
                {
                    src: 'LICENSE',
                    dest: 'dist'
                },
                {
                    src: 'package.json',
                    dest: 'dist'
                }
            ]
        }),
        {
            name: 'buildDoneExecScript',
            closeBundle() {
                delete pkgJSON.devDependencies;
                writeFileSync(path.resolve(__dirname, './dist/package.json'), JSON.stringify(pkgJSON, null, 4), 'utf8');
            }
        }
    ]
};
