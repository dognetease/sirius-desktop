import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import svgr from '@svgr/rollup';
import alias from '@rollup/plugin-alias';
import postcss from 'rollup-plugin-postcss';
import svg from 'rollup-plugin-svg';
import copy from 'rollup-plugin-copy';
import terser from '@rollup/plugin-terser';

function createCssAndIndexFile() {
  return {
    name: 'createCssAndIndexFile',
    generateBundle() {
      this.emitFile({
        name: 'index.css',
        fileName: 'index.css',
        type: 'asset',
        source: `@import "./global.css";
@import "./comp.css";
        `,
      });
    },
  };
}

const plugins = [
  svg(),
  svgr(),
  resolve(),
  json(),
  typescript({ tsconfig: './tsconfig.ui.json' }),
  alias({
    resolve: ['.tsx', '.ts', '.scss'],
    entries: {
      '@web-common/styles/export.module.scss': '../variables',
      '@web-common': '../web-common/src',
      '@': '../web/src',
    },
  }),
  commonjs(),
  postcss({
    modules: false,
    minimize: true,
    extract: 'comp.css',
  }),
];

const comp = [
  'Button',
  'Divider',
  'SiriusBadge',
  'Tag',
  'Pagination',
  'Breadcrumb',
  'PageHeader',
  'SiriusSteps',
  'Table',
  'Tabs',
  'SiriusDrawer',
  'Cascader',
  'Radio',
  'Checkbox',
  'Switch',
  'TimePicker',
  'DatePicker',
  'Input',
  'Select',
  'SiriusModal',
  'Tooltip',
];

const jsConfigs = comp.map(name => ({
  input: `./src/components/UI/${name}/index.tsx`,
  output: {
    name: `lxui-${name}`,
    file: `dist/${name}.js`,
    format: 'umd',
    exports: 'named',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    plugins: [terser()],
  },
  plugins,
  external: ['react', 'react-dom', 'rc-motion', 'rc-resize-observer', 'rc-trigger', 'moment'],
}));

const indexConfig = {
  input: './src/components/UI/index.ts',
  output: {
    name: 'lxui',
    file: 'dist/index.js',
    format: 'umd',
    exports: 'named',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    plugins: [terser()],
  },
  plugins: plugins.concat([
    createCssAndIndexFile(),
    copy({
      copyOnce: true,
      targets: [{ src: './src/styles/comp-global.css', dest: 'dist', rename: 'global.css' }],
    }),
  ]),
  external: ['react', 'react-dom', 'rc-motion', 'rc-resize-observer', 'rc-trigger', 'moment'],
};

export default [indexConfig, ...jsConfigs];
