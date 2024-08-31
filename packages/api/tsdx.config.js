// import resolve, {
//     DEFAULTS as RESOLVE_DEFAULTS,
// } from '@rollup/plugin-node-resolve';
const resolve = require('@rollup/plugin-node-resolve');

const options = {};
console.log('load customer build config');
// import {config as conf} from "./src/gen/env";

module.exports = {
  // This function will run for each entry/format/env combination
  rollup(config, options) {
    // if (conf('stage') !== 'prod') {
    options.sourceMap = true;
    options.inlineSources = true;
    // }
    // console.log(config);
    config.output.globals = {
      axios: 'axios',
      'crypto-js': 'cryptoJs',
      'tiny-pinyin': 'pinyin',
      lovefield: 'lf',
      // "api":"api"
      electronLib: 'electronLib',
      fs: 'fs',
    };
    config.plugins = config.plugins.map(it => {
      if (it.name !== 'sourcemaps') {
        return it;
      }
      // if (conf('stage') !== 'prod') {
      //
      // }
    });
    console.log('rollup options:', options);
    console.log('rollup config:', config);
    // if(conf('stage')!='prod') {
    //
    // }
    // console.log(config.external.toString());
    // config.external = (id) => {
    //     console.log("check import of " + id);
    //     return false;
    // }
    //
    // for (let i in config.plugin) {
    //     let item = config.plugin[i];
    //     if (item.name === 'node-resolve') {
    //         config.plugin[i] = resolve(
    //             {
    //                 browser: true,
    //                 mainFields: ["module", "main", "browser"]
    //             }
    //         );
    //         console.log("exchange item "+i);
    //     }
    // }
    // config.ex
    return config; // always return a config.
  },
};
