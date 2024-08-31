const DeclarationBundlerPlugin = require('../web/build-components/webpack-type-bundle-plugin');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: './dist/bundle.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.webpack.js', '.web.js', '.js'],
  },
  module: {
    rules: [{ test: /\.ts(x?)$/, loader: 'ts-loader' }],
  },
  plugins: [
    new DeclarationBundlerPlugin({
      moduleName: 'api.lingxi.com',
      out: './builds/bundle.d.ts',
    }),
  ],
};
