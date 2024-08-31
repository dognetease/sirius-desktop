/* eslint-disable object-shorthand */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const env = require('env_def');
const webpack = require('webpack');

const srcFolder = path.resolve(__dirname, 'src/');

// const bkInitFileName = 'index.html';

const profile = env.config('profile');
const isEdm = profile && profile.includes('edm');
const isLingXi = !isEdm;
const isWeb = env.config('build_for') === 'web';
const isElectron = env.config('build_for') === 'electron';
const TerserPlugin = require('terser-webpack-plugin');
// const { LingXiResolvePlugin } = require('../web/build-components/lingxi-plugin');

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
        },
      ],
    ],
  },
};

const tsLoader = {
  loader: 'ts-loader',
};

const tsxLoaders = isElectron ? [tsLoader] : [babelLoader, tsLoader];
const isProd = env.config('stage') === 'prod';
// webpack 配置
const outputHtmlPath = path.resolve(__dirname, './dist/');
console.log('output path', outputHtmlPath);
const hostMap = {
  local: 'https://sirius-desktop-web2.cowork.netease.com',
  // local: 'https://lingxi.office.163.com',
  prod: 'https://lingxi.office.163.com',
  prev: 'https://sirius-desktop-web-pre.lx.netease.com',
  test: 'https://sirius-desktop-web.cowork.netease.com',
  test1: 'https://sirius-desktop-web2.cowork.netease.com',
  edm_test1: 'https://sirius-desktop-web2.cowork.netease.com',
  // test1: 'https://lingxi.office.163.com',
  // test1: 'https://sirius-desktop-web.cowork.netease.com',
  test2: 'https://sirius-desktop-web2.cowork.netease.com',
  // webmail_prod: 'https://lingxi.office.163.com',
  webmail_prod: 'https://sirius-desktop-web.cowork.netease.com',
  test_prod: 'https://lingxi.office.163.com',
  edm_test: 'https://waimao.cowork.netease.com',
  edm_dev: 'https://waimao-dev.cowork.netease.com',
  edm_prev: 'https://waimao.office.163.com',
};
const target = hostMap[profile];
console.log('target', target);
module.exports = {
  mode: isProd ? 'production' : 'development',
  devtool: isProd ? 'none' : 'source-map',
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
  entry: {
    testPage: path.resolve(__dirname, 'src/auto_test_main.ts'),
  },
  // 输出到../web-ui/api_dist/目录下，文件名为bg-[name]-[contenthash:8].bundle.js
  output: {
    path: outputHtmlPath,
    filename: 'bg-[name]-[contenthash:8].bundle.js',
  },
  // 需要解析ts和tsx文件，使用babel-loader和ts-loader，需要解析txt文件，使用raw-loader
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
    // 后台页面的html插件，对应的html模板是background_worker.html
    new HtmlWebpackPlugin({
      title: 'api测试页面',
      filename: './index.html',
      template: '../web-ui/static_template/background_worker.html',
      chunks: ['testPage'],
    }),
    // 后台个人账号的html插件，对应的html模板是background_worker.html
    // new HtmlWebpackPlugin({
    //   title: '后台个人账号',
    //   filename: './account-bg.html',
    //   template: '../web-ui/static_template/background_worker.html',
    //   chunks: ['accountBg'],
    // }),
    new webpack.DefinePlugin(defines),
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /zh-cn/),
  ],
  resolve: {
    mainFields: ['browser', 'module', 'main'],
    symlinks: true,
    // 解析路径别名，api，和根目录下几个文件
    alias: {
      '@/api': path.join(srcFolder, 'api'),
      '@/config$': path.join(srcFolder, 'config.ts'),
      '@/const$': path.join(srcFolder, 'const.ts'),
      '@/urlConfig': path.join(srcFolder, 'urlConfig'),
    },
    modules: ['node_modules', '../../node_modules'],
    extensions: ['.ts', '.mjs', '.js', '.jsx', '.wasm', '.json', '.tsx', '.ts', '.js', '.json', '.jsx'],
    // plugins: [...(isLingXi ? [new LingXiResolvePlugin({ stage: 'build-ApiAlone' })] : [])],
  },
  // 添加devserver配置，解决跨域问题
  devServer: {
    contentBase: outputHtmlPath,
    disableHostCheck: true,
    // static: {
    //   contentBase: outputHtmlPath,
    //   serveIndex: true,
    // },
    compress: true,
    port: 9000,
    headers: {
      // 'Access-Control-Allow-Origin': '*', // 允许访问的域名
      Origin: 'https://lingxi.office.163.com/',
      Host: target.replace('https://', ''),
    },
    // open: true,
    // 添加转发规则
    proxy: {
      '/': {
        context: () => true,
        target: target,
        bypass(req /* , res, proxyOptions */) {
          // console.log('visit ', req.url);
          const { url } = req;
          const start = url.indexOf('//') > 0 ? url.indexOf('//') + 2 : 0;
          let end = url.length;
          if (url.indexOf('?', start) >= 0) {
            end = url.indexOf('?', start);
          } else {
            end = url.indexOf('#', start);
          }
          const path = url.substring(start, end);
          console.log('visit ', req.url, path);
          if (path === '/') {
            console.log('Skipping proxy for browser request.');
            return '/index.html';
          }
          if (path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.gif')) {
            console.log('Skipping proxy for browser static resource requests.');
            return path;
          }
          return undefined;
        },
        onProxyReq: (proxyReq, req, res) => {
          console.log(`Proxying request to ${req.url}`);
        },
        onProxyRes: (proxyRes, req, res) => {
          console.log(`Proxying response with status ${proxyRes.statusCode}`);
        },
        // 设置cookie domain
        // cookieDomainRewrite: function (domain) {
        //   return 'localhost';
        // },
        cookieDomainRewrite: '',
        changeOrigin: true,
        logLevel: 'debug',
      },
    },
  },
  optimization: {
    usedExports: true,
  },
};
