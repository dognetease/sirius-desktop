import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
// import babel from '@rollup/plugin-babel';
import clear from 'rollup-plugin-clear';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import json from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';
import strip from 'rollup-plugin-strip';
import backEnv from 'rollup-plugin-baked-env';
import { config } from 'env_def';
import { uglify } from 'rollup-plugin-uglify';

const stage = config('stage');
console.log(`build stage: ${stage}`);
const isProdBuild = stage === 'prod';
console.log('isProdBuild: ', isProdBuild);

const simpleEnvObj = {
  version: config('version'),
  versionTime: config('versionTime'),
  stage: config('stage'),
  host: config('host'),
  domain: config('domain'),
  domesticHost: config('domesticHost'),
  commonApiHost: config('commonApiHost'),
  commonMailHost: config('commonMailHost'),
  profile: config('profile'),
  docHost: config('docHost'),
  webMailHZHost: config('webMailHZHost'),
  webMailBJHost: config('webMailBJHost'),
  attaPreviewHost: config('attaPreviewHost'),
  corpHost: config('corpHost'),
  productName: config('productName'),
  bkPage: config('bkPage'),
};

const buildPluginArr = isProdBuild
  ? [
      uglify(),
      strip({
        include: '**/*.ts',
        debugger: true,
        sourceMap: false,
      }),
    ]
  : [];

const extensions = ['.ts', '.js', '.tsx'];
const { compileType } = process.env;
const compileConfig = {
  // electron main
  main: {
    external: ['electron', 'fs-extra', 'adm-zip', 'electron-updater', 'electron-log'],
    preserveEntrySignatures: false,
    input: 'src/main/index.ts',
    output: {
      dir: 'dist/electron/',
      format: 'cjs',
    },
    plugins: [
      backEnv(simpleEnvObj, {
        moduleName: 'envDef',
        preferConst: true,
        compact: false,
      }),
      ...buildPluginArr,
      copy({
        targets: [
          { src: 'src/static/*', dest: 'dist/electron/static' },
          { src: 'src/preload.js', dest: 'dist/electron' },
          { src: '../web/public/*', dest: 'dist/electron/web' },
          { src: '../web-ui/api_dist/*', dest: 'dist/electron/web' },
          { src: '../web-ui/worker_runner/*', dest: 'dist/electron/' },
        ],
      }),
      nodeResolve({ mainFields: ['module', 'main', 'browser'] }),
      typescript({
        lib: ['es5', 'es6', 'dom'],
        target: 'esnext',
        noEmitOnError: true,
        exclude: ['src/lib/**/*'],
        removeComments: true,
      }),
      json(),
      commonjs({
        extensions,
      }),
      // babel({
      //     babelHelpers: "bundled",
      //     extensions
      // }),
    ],
  },
  // web lib
  lib: {
    external: ['electron', 'fs-extra'],
    input: 'src/lib/index.ts',
    output: {
      file: 'dist/electron/lib/index.js',
      format: 'cjs',
    },
    plugins: [
      backEnv(simpleEnvObj, {
        moduleName: 'envDef',
        preferConst: true,
        compact: false,
      }),
      ...buildPluginArr,
      nodeResolve({ mainFields: ['module', 'main', 'browser'] }),
      typescript({
        lib: ['es5', 'es6', 'dom'],
        target: 'esnext',
        noEmitOnError: true,
        exclude: ['src/main/**/*'],
        removeComments: true,
      }),

      // json(),
      // commonjs({
      //     extensions
      // }),
      // babel({
      //     babelHelpers: "bundled",
      //     extensions
      // }),
    ],
  },
  // 生成d.ts
  bundle: {
    input: 'src/lib/index.ts',
    output: [
      {
        file: '../env/src/gen/bundle.d.ts',
        format: 'es',
      },
      // {
      //   file: '../web/src/gen/bundle.d.ts',
      //   format: 'es'
      // }
    ],
    plugins: [dts()],
  },
};
let compileArr = [];
if (compileType === 'all' || !compileType) {
  const { main } = compileConfig;
  main.plugins.unshift(
    clear({
      targets: ['dist/electron/'],
    })
  );
  compileArr = [main, compileConfig.lib];
} else {
  compileArr.push(compileConfig[compileType]);
}
export default compileArr;
