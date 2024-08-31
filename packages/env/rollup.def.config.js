// import replace from '@rollup/plugin-replace';
// import {RollupOptions} from 'rollup';
import dts from 'rollup-plugin-dts';
import { ModuleResolutionKind } from 'typescript';

const bundle = {
  input: 'src/index_def.d.ts',
  output: [
    {
      file: './dist/index.d.ts',
      format: 'es',
    },
    // {
    //     file: "../web/src/gen/api.d.ts",
    //     format: "es",
    //     globals: {
    //         "axios": "axios",
    //         "crypto-js": "cryptoJs",
    //         "tiny-pinyin": "pinyin",
    //         "lovefield": "lf",
    //         "crypto": "crypto",
    //         "electron":"Electron"
    //     }
    // }
  ],
  plugins: [
    dts({
      respectExternal: false,
      compilerOptions: {
        moduleResolution: ModuleResolutionKind.NodeJs,
        skipLibCheck: true,
      },
    }),
  ],
};

export default bundle;
