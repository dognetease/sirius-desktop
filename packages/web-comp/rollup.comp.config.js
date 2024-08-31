import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import svgr from '@svgr/rollup';
import alias from '@rollup/plugin-alias';
import postcss from 'rollup-plugin-postcss';
import svg from 'rollup-plugin-svg';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';

const plugins = [
  replace({
    'process.env.BUILD_ENV': JSON.stringify(process.env.BUILD_ENV),
  }),
  svg(),
  svgr(),
  resolve(),
  json(),
  typescript({ tsconfig: './tsconfig.comp.json' }),
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
    minimize: true,
    extract: 'index.css',
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
  input: `./src/${name}/index.tsx`,
  output: {
    name: `lxui-${name}`,
    file: `comp-dist/${name}.js`,
    format: 'umd',
    exports: 'named',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    plugins: [terser()],
  },
  plugins,
  external: ['react', 'react-dom', 'antd', '@ant-design/icons', 'react-resizable', 'api', '@sirius/icons', 'moment'],
}));

const indexConfig = {
  input: './src/index-comp.ts',
  output: {
    name: 'lxui',
    file: 'comp-dist/index.js',
    format: 'umd',
    exports: 'named',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    plugins: [terser()],
  },
  plugins,
  external: ['react', 'react-dom', 'antd', '@ant-design/icons', 'react-resizable', 'api', '@sirius/icons', 'moment'],
};

export default [indexConfig, ...jsConfigs];
