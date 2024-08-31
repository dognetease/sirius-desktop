import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
// import babel from '@rollup/plugin-babel';
// import clear from 'rollup-plugin-clear';
// import typescript from '@rollup/plugin-typescript'
import typescript from 'rollup-plugin-typescript2';
// import copy from 'rollup-plugin-copy';
// import json from '@rollup/plugin-json';
// import dts from 'rollup-plugin-dts';
import ts from 'typescript';
// import { DEFAULT_EXTENSIONS as DEFAULT_BABEL_EXTENSIONS } from '@babel/core';

export default {
  external: ['electron', 'fs-extra', 'got'],
  input: 'src/lib/index.ts',
  output: {
    file: 'dist/electron/lib/index.js',
    format: 'cjs',
  },
  plugins: [
    // json(),
    // nodePolyfills(),
    resolve({
      preferBuiltins: true,
      browser: false,
      mainFields: ['module', 'main', 'browser'],
    }),
    commonjs({
      browser: false,
      include: ['node_modules/**/*', '../../node_modules/**/*'],
    }),
    typescript({
      typescript: ts,
      tsconfig: 'tsconfig.json',
      tsconfigDefaults: {
        exclude: [
          // all TS test files, regardless whether co-located or in test/ etc
          '**/*.spec.ts',
          '**/*.test.ts',
          '**/*.spec.tsx',
          '**/*.test.tsx',
          // TS defaults below
          'node_modules',
          'bower_components',
          'jspm_packages',
          'dist',
          'src/main/**/*.ts',
        ],
        compilerOptions: {
          sourceMap: false,
          declaration: false,
          jsx: 'react',
        },
      },
      tsconfigOverride: {
        compilerOptions: {
          // TS -> esnext, then leave the rest to babel-preset-env
          target: 'esnext',
        },
      },
      check: true,
      useTsconfigDeclarationDir: true,
    }),
    // babel({
    //   exclude: 'node_modules/**',
    //   extensions: [...DEFAULT_BABEL_EXTENSIONS, 'ts', 'tsx'],
    //   passPerPreset: true,
    //   sourceMaps: true,
    //   babelHelpers: 'bundled',
    //   presets: [
    //     [
    //       "@babel/preset-env",
    //       {
    //         useBuiltIns: "entry" ,
    //         corejs: { version: "3.8", proposals: true },
    //         modules:"auto"
    //       }
    //     ],
    //   ],
    // }),
  ],
};
