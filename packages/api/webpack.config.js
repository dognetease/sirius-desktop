const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const env = require('env_def');
const webpack = require('webpack');

const srcFolder = path.resolve(__dirname, 'src/');

const bkInitFileName = env.config('bkPage');

const profile = env.config('profile');
const isEdm = profile && profile.includes('edm');
const isLingXi = !isEdm;
const isWeb = env.config('build_for') === 'web';
const isElectron = env.config('build_for') === 'electron';
// console.log('--@@@@build folder and defines --!!', env.config('build_for'));
const TerserPlugin = require('terser-webpack-plugin');
const { LingXiResolvePlugin } = require('../web/build-components/lingxi-plugin');

const defines = {
  'process.env.BUILD_ISLINGXI': JSON.stringify(!!isLingXi),
  'process.env.BUILD_ISEDM': JSON.stringify(!!isEdm),
  'process.env.BUILD_ISWEB': JSON.stringify(!!isWeb),
  'process.env.BUILD_ISELECTRON': JSON.stringify(!!isElectron),
};
console.log('--build folder and defines --!!', srcFolder, defines);
const babelLoader = {
  loader: 'babel-loader',
  options: {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            ie: 11,
            chrome: 49,
          },
          useBuiltIns: 'usage',
          corejs: 3,
        },
      ],
    ],
  },
};

const tsLoader = {
  loader: 'ts-loader',
  options: {
    transpileOnly: true,
  },
};

const tsxLoaders = isElectron ? [tsLoader] : [babelLoader, tsLoader];
const isProd = env.config('stage') === 'prod';

module.exports = {
  mode: isProd ? 'production' : 'development',
  devtool: isProd ? false : 'source-map',
  ...(isProd
    ? {
        optimization: {
          minimize: true,
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                compress: {
                  pure_funcs: ['console.log', 'console.info', 'console.warn'],
                  drop_debugger: true,
                },
              },
            }),
          ],
        },
      }
    : {}),
  // entry: path.resolve(__dirname, 'src/index.ts'),
  entry: {
    bkInit: path.resolve(__dirname, 'src/main.ts'),
    accountBg: path.resolve(__dirname, 'src/account_bg_main.ts'),
  },
  output: {
    path: path.resolve(__dirname, '../web-ui/api_dist/'),
    filename: 'bg-[name]-[contenthash:8].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: tsxLoaders,
        exclude: /node_modules/,
      },
      {
        test: /\.txt$/,
        use: 'raw-loader',
      },
    ],
  },
  plugins: [
    // new HtmlWebpackPlugin({
    //   title: '后台data页面A',
    //   filename: '../../web-entry-wm/public/' + bkInitFileName,
    //   template: '../web-ui/static_template/background_worker.html',
    //   chunks: ['bkInit']
    // }),
    new HtmlWebpackPlugin({
      title: '后台data页面A',
      filename: './' + bkInitFileName,
      template: '../web-ui/static_template/background_worker.html',
      chunks: ['bkInit'],
    }),
    new HtmlWebpackPlugin({
      title: '后台个人账号',
      filename: './account-bg.html',
      template: '../web-ui/static_template/background_worker.html',
      chunks: ['accountBg'],
    }),
    new webpack.DefinePlugin(defines),
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /zh-cn/),
  ],
  resolve: {
    mainFields: ['browser', 'module', 'main'],
    symlinks: true,
    fallback: {
      assert: require.resolve('assert/'),
      buffer: require.resolve('buffer/'),
      crypto: require.resolve('crypto-browserify'),
      path: require.resolve('path-browserify'),
      fs: false,
      url: require.resolve('url/'),
      util: require.resolve('util/'),
      os: require.resolve('os-browserify/browser'),
      stream: require.resolve('stream-browserify'),
      https: require.resolve('https-browserify'),
      http: require.resolve('stream-http'),
      tty: require.resolve('tty-browserify'),
      zlib: require.resolve('browserify-zlib'),
    },
    alias: {
      '@/api': path.join(srcFolder, 'api'),
      '@/config$': path.join(srcFolder, 'config.ts'),
      '@/const$': path.join(srcFolder, 'const.ts'),
      '@/urlConfig': path.join(srcFolder, 'urlConfig'),
      '@reach/router': '@gatsbyjs/reach-router',
    },
    modules: ['node_modules', '../../node_modules'],
    extensions: ['.ts', '.mjs', '.js', '.jsx', '.wasm', '.json', '.tsx', '.ts', '.js', '.json', '.jsx'],
    plugins: [...(isLingXi ? [new LingXiResolvePlugin({ stage: 'build-ApiAlone' })] : [])],
  },
  optimization: {
    usedExports: true,
  },
};
