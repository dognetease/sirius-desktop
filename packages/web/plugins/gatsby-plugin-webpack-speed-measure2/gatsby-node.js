const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

exports.onCreateWebpackConfig = ({ stage, getConfig, actions }, options) => {
  if (options.disable) return;
  const webpackConfig = getConfig();
  console.log('SMP webpackConfig');
  console.dir(webpackConfig.module.rules, {
    depth: 10,
  });
  const configWithTimeMeasures = new SpeedMeasurePlugin({
    ...options,
    outputFormat: 'json',
    outputTarget: 'smp.json',
  }).wrap(webpackConfig);
  configWithTimeMeasures.plugins.push(new MiniCssExtractPlugin({}));
  actions.replaceWebpackConfig(configWithTimeMeasures);
  // if (process.env.NODE_ENV && stage === 'build-javascript') {
  //   const smp = new SpeedMeasurePlugin(options);
  //   actions.replaceWebpackConfig(smp.wrap(getConfig()));
  // }
};
