const path = require('path');
// const HtmlWebpackPlugin = require('html-webpack-plugin');

const srcFolder = path.resolve(__dirname, 'src/');
console.log('[build folder]!!', srcFolder);
module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src/index.ts'),
  output: {
    path: path.resolve(__dirname, '../web-ui/static_html/assets'),
    filename: 'index.bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.txt$/,
        use: 'raw-loader',
      },
      // {
      //   test: /\.js$/,
      //   use: [{ loader: 'file-loader?name=i[hash:32].[ext]' }]
      // },
    ],
  },
  plugins: [
    // new HtmlWebpackPlugin({
    //   title: 'api执行页面',
    //   filename: '../api.html'
    // }),
  ],
  // externals: {
  //   env_def: 'env',
  // },
  resolve: {
    mainFields: ['browser', 'module', 'main'],
    symlinks: true,
    // alias: {
    //
    // },
    modules: ['node_modules', '../../node_modules'],
    extensions: ['.ts', '.mjs', '.js', '.jsx', '.wasm', '.json', '.tsx', '.ts', '.js', '.json', '.jsx'],
  },
};
