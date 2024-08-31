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
import replace from '@rollup/plugin-replace';

function createCssAndIndexFile() {
  return {
    name: 'createCssAndIndexFile',
    //     generateBundle() {
    //       this.emitFile({
    //         name: 'index.css',
    //         fileName: 'index.css',
    //         type: 'asset',
    //         source: `@import "./global.css";
    // @import "./comp.css";
    //         `,
    //       });
    //     },
    generateBundle() {
      this.emitFile({
        name: 'index.css',
        fileName: 'index.css',
        type: 'asset',
        source: `@import "./global.css";`,
      });
    },
  };
}

const plugins = [
  replace({
    'antd/lib/locale/zh_CN': 'antd/lib/locale/zh_CN',
    'antd/lib/input/TextArea': '../types/input',
    'antd/lib/radio/radioButton': '../types/radio',
    'antd/lib/checkbox/Group': '../types/checkbox',
    'antd/lib/date-picker': '../types/datepicker',
    'antd/es/table': '../types/table',
    'antd/lib/': '../types/',
    'process.env.BUILD_ENV': JSON.stringify(process.env.BUILD_ENV),
  }),
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
    inject: { insertAt: 'top' },
    // modules: false,
    // minimize: true,
    // extract: 'comp.css',
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
  'SiriusDrawer-ui',
  'Cascader',
  'Radio',
  'Checkbox',
  'Switch',
  'TimePicker',
  'DatePicker',
  'Input',
  'Select',
  'SiriusModal-ui',
  'Tooltip',
];

const jsConfigs = comp.map(name => {
  const input = `./src/${name}/index.tsx`;
  let fileName = name;
  if (name === 'SiriusDrawer-ui') {
    fileName = 'SiriusDrawer';
  }
  if (name === 'SiriusModal-ui') {
    fileName = 'SiriusModal';
  }
  return {
    input,
    output: {
      name: `lxui-${fileName}`,
      file: `ui-dist/${fileName}.js`,
      format: 'umd',
      exports: 'named',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
      plugins: [terser()],
    },
    plugins,
    external: ['react', 'react-dom', 'rc-motion', 'rc-resize-observer', 'rc-trigger', 'moment', 'rc-cascader'],
  };
});

const indexConfig = {
  input: './src/index-ui.ts',
  output: {
    name: 'lxui',
    file: 'ui-dist/index.js',
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
      targets: [{ src: './src/styles/comp-global.css', dest: 'ui-dist', rename: 'global.css' }],
    }),
  ]),
  external: ['react', 'react-dom', 'rc-motion', 'rc-resize-observer', 'rc-trigger', 'moment', 'rc-cascader'],
};

export default [indexConfig, ...jsConfigs];
