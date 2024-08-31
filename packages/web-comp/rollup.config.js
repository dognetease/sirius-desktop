import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import url from '@rollup/plugin-url';
import svgr from '@svgr/rollup';
import alias from '@rollup/plugin-alias';
// const packageJson = require("./package.json");
import packageJson from './package.json';

export default {
  input: './src/index.ts',
  plugins: [
    url(),
    svgr(),

    typescript({
      // exclude: "node_modules/**",
      tsconfig: './tsconfig.ui.json',
      // include:[
      // './src/index.ts'
      // ],
      // typescript: require("typescript")
    }),
    postcss({
      extract: false,
      modules: true,
    }),
    alias({
      resolve: ['.tsx', '.ts', '.scss'],
      entries: {
        '@web-common': '../../web-common/src/',
      },
    }),
  ],
  output: [
    // {
    //   format: "umd",
    //   file: "lib/bundle.umd.js",
    //   name: 'web_common',
    //   sourcemap: true
    // },
    {
      format: 'es',
      dir: 'es',
      // file: packageJson.module,
      // sourcemap: true
    },
    // {
    //   format: "cjs",
    //   file: "lib/bundle.cjs.js",
    //   sourcemap: true
    // }
  ],
};
