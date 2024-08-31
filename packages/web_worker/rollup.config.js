import { terser } from 'rollup-plugin-terser';
import { DEFAULT_EXTENSIONS as DEFAULT_BABEL_EXTENSIONS } from '@babel/core';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
// import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve'; // DEFAULTS as RESOLVE_DEFAULTS,
import sourceMaps from 'rollup-plugin-sourcemaps';
// import typescript from 'rollup-plugin-typescript2';
import typescript from '@rollup/plugin-typescript';
import ts from 'typescript';
// import {RollupOptions} from 'rollup';

const conf = {
  input: 'src/db/dbHandle.ts',
  output: {
    file: 'dist/db.bundle.min.js',
    format: 'iife',
    name: 'db',
    plugins: [],
    sourcemap: true,
    globals: {
      axios: 'axios',
      'crypto-js': 'cryptoJs',
      'tiny-pinyin': 'pinyin',
      lovefield: 'lf',
      crypto: 'crypto',
    },
  },
  plugins: [
    json(),
    resolve({
      preferBuiltins: true,
      browser: true,
      mainFields: ['module', 'main', 'browser'],
    }),
    commonjs({
      browser: true,
      include: ['node_modules/**/*', '../../node_modules/**/*'],
    }),
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
            useBuiltIns: 'usage',
            loose: true,
          },
        ],
      ],
    }),
    sourceMaps(),
    terser({
      output: {
        comments: false,
        beautify: true,
      },
      compress: {
        keep_infinity: true,
        pure_getters: true,
        passes: 10,
      },
      ecma: 5,
      toplevel: false,
      warnings: true,
    }),
  ],
};

export default conf;
