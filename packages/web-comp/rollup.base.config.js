import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import svgr from '@svgr/rollup';
import alias from '@rollup/plugin-alias';
import postcss from 'rollup-plugin-postcss';
import svg from 'rollup-plugin-svg';

const config = {
  input: './src/index.ts',
  plugins: [
    svg(),
    svgr(),
    resolve(),
    json(),
    typescript({ tsconfig: './tsconfig.ui.json' }),
    alias({
      resolve: ['.tsx', '.ts', '.scss'],
      entries: {
        '../styles/export.module.scss': '../variables',
        '@web-common': '../web-common/src',
        '@': '../web/src',
      },
    }),
    commonjs(),
    postcss({
      modules: false,
      extract: 'index.css',
    }),
  ],
};
export default config;
