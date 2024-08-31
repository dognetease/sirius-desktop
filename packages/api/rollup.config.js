// import { terser } from 'rollup-plugin-terser';
import cleanup from 'rollup-plugin-cleanup';
import { DEFAULT_EXTENSIONS as DEFAULT_BABEL_EXTENSIONS } from '@babel/core';

import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';

// import typescript from 'rollup-plugin-typescript2';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import typescript from '@rollup/plugin-typescript';
import ts from 'typescript';

const conf = {
  input: 'src/main.ts',
  output: [
    {
      file: './dist/index.js',
      format: 'umd',
      name: 'api',
      plugins: [],
      sourcemap: true,
      globals: {
        axios: 'axios',
        'crypto-js': 'cryptoJs',
        'tiny-pinyin': 'pinyin',
        lovefield: 'lf',
        crypto: 'crypto',
        lf: 'lf',
        env_def: 'env_def',
      },
    },
  ],
  external: ['env_def'],
  watch: {
    include: 'src/**',
  },
  // external: ['lodash', /@babel\/runtime/],
  plugins: [
    json(),
    nodePolyfills(),
    typescript({
      typescript: ts,
      tsconfig: 'tsconfig.json',
      // tsconfigDefaults: {
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
      ],
      // compilerOptions: {
      //   sourceMap: true,
      //   declaration: true,
      //   jsx: 'react',
      // },
      // },
      // tsconfigOverride: {
      //   compilerOptions: {
      //     // TS -> esnext, then leave the rest to babel-preset-env
      //     target: 'esnext',
      //
      //   },
      // },
      // check: true,
      // useTsconfigDeclarationDir: true,
    }),
    resolve({
      preferBuiltins: true,
      browser: true,
      mainFields: ['module', 'main', 'browser'],
    }),
    commonjs({
      browser: true,
      include: ['node_modules/**/*', '../../node_modules/**/*'],
      ignoreDynamicRequires: true,
      ignoreGlobal: true,
      ignore: id => id === 'env_def',
    }),
    babel({
      exclude: 'node_modules/**',
      extensions: [...DEFAULT_BABEL_EXTENSIONS, 'ts', 'tsx'],
      passPerPreset: true,
      sourceMaps: true,
      babelHelpers: 'bundled',
      presets: [
        [
          '@babel/preset-env',
          {
            useBuiltIns: 'entry',
            corejs: {
              version: '3.18',
              proposals: true,
            },
            modules: 'auto',
          },
        ],
      ],
    }),
    cleanup({
      comments: 'none',
      sourcemap: false,
      extensions: ['jx', 'ts', 'tsx'],
    }),
    // createApiVersionPlugin(),
    // // sourceMaps(),
    // terser({
    //   output: {
    //     comments: false,
    //     beautify: true
    //   },
    //   compress: {
    //     keep_infinity: true,
    //     pure_getters: true,
    //     passes: 10,
    //   },
    //   ecma: 5,
    //   toplevel: false,
    //   warnings: true,
    // }),
  ],
};

export default conf;
