// import replace from '@rollup/plugin-replace';
// import {RollupOptions} from 'rollup';
import dts from 'rollup-plugin-dts';
// import { ModuleResolutionKind } from 'typescript';

const bundle = {
  external: ['env_def'],
  input: 'src/lib/index.ts',
  output: [
    {
      file: '../env/src/gen/bundle.d.ts',
      format: 'es',
    },
    // {
    //   file: '../web/src/gen/bundle.d.ts',
    //   format: 'es',
    // },
  ],
  plugins: [
    dts({
      // respectExternal: true,
    }),
  ],
};

export default bundle;
