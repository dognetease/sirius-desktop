const path = require('path');
const env = require('env_def');
const webpack = require('webpack');

const srcFolder = path.resolve(__dirname, 'src/');
const profile = env.config('profile');
const isEdm = profile && profile.includes('edm');
const isLingXi = !isEdm;
const isWeb = env.config('build_for') === 'web';
const isElectron = env.config('build_for') === 'electron';
const fs = require('fs');

const isEdmWeb = process.env.API_TARGET && process.env.API_TARGET.toString() === 'EDM';

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

const defines = {
  'process.env.BUILD_ISLINGXI': JSON.stringify(!!isLingXi),
  'process.env.BUILD_ISEDM': JSON.stringify(!!isEdm),
  'process.env.BUILD_ISWEB': JSON.stringify(!!isWeb),
  'process.env.BUILD_ISELECTRON': JSON.stringify(!!isElectron),
};

console.log('--build folder and defines --!!', srcFolder, defines);

const tsLoader = {
  loader: 'ts-loader',
  options: {
    reportFiles: ['!src/account_bg_main.ts', '!src/main.ts', '!src/index_bk_init.ts'],
    onlyCompileBundledFiles: true,
    compilerOptions: {
      declaration: false,
      declarationDir: undefined,
    },
  },
};

const outputIndexFileName = 'dev-api-index.js';

const baseOutPath = isEdmWeb ? path.resolve(__dirname, './../web-entry-wm/public/') : path.resolve(__dirname, './../web/public/');

class FastBuildApiPlugin {
  constructor() {
    this.hasReportSuccess = false;
    this.hasReportFail = false;
  }

  apply(compiler) {
    compiler.hooks.entryOption.tap('FastBuildApiPlugin-entryOption', () => {
      console.log('[FastBuildApiPlugin] building....');
      const bundleDelFile = path.resolve(__dirname, './src/gen/bundle.d.ts');
      if (fs.existsSync(bundleDelFile)) {
        fs.unlinkSync(bundleDelFile);
      }
    });

    compiler.hooks.assetEmitted.tap('FastBuildApiPlugin-assetEmitted', (file, info) => {
      console.log('[FastBuildApiPlugin] assetEmitted');
      const isApiDevIndexFile = file && file.toString().includes(outputIndexFileName);
      if (!isApiDevIndexFile) {
        return;
      }
      if (this.hasReportSuccess) {
        return;
      }
      this.hasReportSuccess = true;
      const distFolderPath = path.resolve(__dirname, './dist');
      if (!fs.existsSync(distFolderPath)) {
        fs.mkdirSync(distFolderPath);
      }
      fs.copyFileSync(path.join(baseOutPath, '/' + outputIndexFileName), path.resolve(__dirname, './dist/index.js'));
      console.log(`cpoy dev-api-index.js to index.js`);
      process.send &&
        process.send({
          type: 'buildSuccess',
        });
    });

    compiler.hooks.failed.tap('FastBuildApiPlugin-buildfailed', err => {
      console.error('[FastBuildApiPlugin]buildfailed', err);
      if (this.hasReportFail) {
        return;
      }
      this.hasReportFail = true;
      process.send &&
        process.send({
          type: 'buildfailed',
          err,
        });
    });
  }
}

const tsxLoaders = [tsLoader];
const isProd = false;

module.exports = {
  watch: true,
  mode: isProd ? 'production' : 'development',
  devtool: 'none',
  entry: {
    main: path.resolve(__dirname, 'src/index.ts'),
  },
  output: {
    path: baseOutPath,
    filename: outputIndexFileName,
    libraryTarget: 'umd',
    library: 'siriusDesktopApi',
    globalObject: 'this',
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
  plugins: [new webpack.DefinePlugin(defines), new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /zh-cn/), new FastBuildApiPlugin()],
  resolve: {
    mainFields: ['browser', 'module', 'main'],
    symlinks: true,
    alias: {
      '@/api': path.join(srcFolder, 'api'),
      '@/config$': path.join(srcFolder, 'config.ts'),
      '@/const$': path.join(srcFolder, 'const.ts'),
      '@/urlConfig': path.join(srcFolder, 'urlConfig'),
    },
    modules: ['node_modules', '../../node_modules'],
    extensions: ['.ts', '.mjs', '.js', '.jsx', '.wasm', '.json', '.tsx', '.ts', '.js', '.json', '.jsx'],
  },
  // 添加devserver配置，解决跨域问题
  devServer: {
    contentBase: baseOutPath,
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
        // context: () => true,
        target,
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
            return '/api_data_init.html';
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
