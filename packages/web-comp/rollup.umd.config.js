import terser from '@rollup/plugin-terser';
import basicConfig from './rollup.base.config';

const config = {
  ...basicConfig,
  output: [
    {
      name: 'lxui',
      file: 'dist/index.umd.js',
      format: 'umd',
      exports: 'named',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
      plugins: [terser()],
    },
  ],
  plugins: [...basicConfig.plugins],
  external: ['react', 'react-dom', 'rc-motion', 'rc-resize-observer', 'rc-trigger'],
};
export default config;
