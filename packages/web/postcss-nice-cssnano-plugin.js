const cssnanoPresetAdvanced = require('cssnano-preset-advanced');
const postcss = require('postcss');
const cssnano = require('cssnano');
const path = require('path');

const niceCssnano = postcss.plugin(
  'postcss-nice-cssnano',
  () => root =>
    new Promise((resolve, reject) => {
      try {
        // const currentDir = process.cwd();
        let filePath = path.normalize(root.source.input.file);
        if (!filePath) {
          filePath = '';
        }
        if (filePath.indexOf('@lxunit') !== -1) {
          resolve();
        } else {
          postcss([cssnano({ preset: cssnanoPresetAdvanced })])
            .process(root, {
              from: undefined,
            })
            .then(() => resolve())
            .catch(() => reject());
        }
      } catch (e) {
        reject(e);
      }
    })
);

module.exports = niceCssnano;
