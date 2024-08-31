/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
const SentryCliPlugin = require('@sentry/webpack-plugin');

const fs = require('fs-extra');
const path = require('path');
const colors = require('colors');
const { config: envDefConfig } = require('env_def');

const { createFilePath } = require('gatsby-source-filesystem');
// 分析bundle大小需要，别删除
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
// 删除test-id
const removeTestIdTransformer = require('./build-components/remove-test-id');
const FastBuildWatchPlugin = require('./build-components/fast-build-plugin');

const { outputFile, outputJson } = require('./config/transform-util');

const env = envDefConfig('stage');
const isProd = env === 'prod';
const profile = envDefConfig('profile');
const isEdm = profile && profile.includes('edm');
const isLingXi = !isEdm;

const isFastBuildWeb = process.env.FASE_DEV_WEB && process.env.FASE_DEV_WEB.toString() === 'true';
const isFastBuildEdmMail = process.env.FAST_EDMMAIL && process.env.FAST_EDMMAIL.toString() === 'true';
const isFastBuildEdmData = process.env.FAST_EDMDATA && process.env.FAST_EDMDATA.toString() === 'true';
const isFastBuildEdmYingXiao = process.env.FAST_EDMYINGXIAO && process.env.FAST_EDMYINGXIAO.toString() === 'true';

const setRuleOptions = rule => {
  if (rule.test) {
    if (rule.use && rule.use.length) {
      rule.use.forEach(loader => {
        const { options } = loader;
        if (options && options.sourceMap === false) {
          options.sourceMap = true;
        }
        if (options && options.sourceMaps === false) {
          options.sourceMaps = true;
        }
      });
    }
  } else if (rule.oneOf && Array.isArray(rule.oneOf)) {
    rule.oneOf.forEach(rule => {
      setRuleOptions(rule);
    });
  }
};
/**
 * production 模式下，css处理的一些loader 的sourcemap为false,这就造成无法生成js.map文件，因此
 * 遍历loader 更新sourcemap 为true
 * @param {*} conf
 */
const setupConfLoaderSourcemap = conf => {
  conf.module.rules.forEach(rule => {
    setRuleOptions(rule);
  });
};

const setupConfOutput = conf => {};

const changeFileLoaderLimit = (webpackConfig, fileSizeLimt = 1024) => {
  webpackConfig.module.rules.forEach(ruleItem => {
    try {
      const testStr = String(ruleItem.test);
      if (testStr === '/\\.svg$/') {
        if (ruleItem.use.length > 1) {
          ruleItem.use[1].options.limit = fileSizeLimt;
        } else if (ruleItem.use.length === 1) {
          ruleItem.use[0].options.limit = fileSizeLimt;
        }
        if (ruleItem.issuer && ruleItem.issuer.test) {
          ruleItem.issuer = ruleItem.issuer.test;
        }
      }
      if (testStr === '/\\.(ico|jpg|jpeg|png|gif|webp|avif)(\\?.*)?$/') {
        ruleItem.use[0].options.limit = fileSizeLimt;
      }
    } catch (ex) {
      console.error(ex);
    }
  });
};

const removeOptimizationMinifyCssSvgo = webpackConfig => {
  try {
    const { minimizer } = webpackConfig.optimization;
    const minifyCss = minimizer[1];
    const { minimizerOptions } = minifyCss.options;
    minimizerOptions.preset = ['default'];
  } catch (e) {
    console.error('removeSvgo error', e);
  }
};

const isRegEqual = (pre, cur) => pre.source === cur.source;

const setUrlLoaderOptions = (conf, loaders) => {
  const urlLoader = loaders.url().loader;

  conf.module.rules.forEach(rule => {
    if (!Array.isArray(rule.oneOf)) {
      const loader = Array.isArray(rule.use) ? rule.use[0].loader : undefined;
      if (loader && loader === urlLoader) {
        rule.use[0].options.esModule = false;
      }
    }
  });
};

const useStyleLoaderReplaceMiniCssExtract = (conf, loaders) => {
  const miniCssExtractLoader = loaders.miniCssExtract().loader;
  const styleRule = loaders.style();

  conf.module.rules.forEach(rule => {
    if (Array.isArray(rule.oneOf)) {
      rule.oneOf.forEach(_rule => {
        const loader = Array.isArray(_rule.use) ? _rule.use[0].loader : undefined;
        if (loader && loader === miniCssExtractLoader) {
          _rule.use[0] = styleRule;
        }
      });
    } else {
      const loader = Array.isArray(rule.use) ? rule.use[0] : undefined;
      if (loader && loader === miniCssExtractLoader) {
        rule.use[0] = styleRule;
      }
    }
  });
};

const addConditionalLoader = (webpackConfig, conditionLoader) => {
  webpackConfig.module.rules.forEach(ruleItem => {
    try {
      const testStr = String(ruleItem.test);
      const isTsFile = testStr === '/\\.tsx?$/';
      if (testStr === '/\\.(js|mjs|jsx)$/' || isTsFile) {
        // ruleItem.include = [path.resolve(__dirname, 'src'), path.resolve(__dirname, '../api/src')];
        const ruleUseOld = ruleItem.use;
        if (Array.isArray(ruleUseOld)) {
          ruleItem.use.push(conditionLoader);
        } else {
          ruleItem.use = [ruleUseOld, conditionLoader];
        }
      }
    } catch (ex) {
      console.error(ex);
    }
  });
};

const logWebPackConfigToFile = (fileNamePath, webpackConfig) => {
  // 正则无法使用JSON.stringify序列化，需要先转换为String
  webpackConfig.module.rules.forEach(ruleItem => {
    ruleItem.testStr = String(ruleItem.test);
  });
  fs.writeFileSync(fileNamePath, JSON.stringify(webpackConfig));
  webpackConfig.module.rules.forEach(ruleItem => {
    delete ruleItem.testStr;
  });
};

const getPublicPath = () => {
  if (profile.includes('webedm')) {
    return path.join(__dirname, '../web-entry-wm/public');
  }
  if (profile.includes('ffmsedm')) {
    return path.join(__dirname, '../web-entry-ff/public');
  }
  return path.join(__dirname, './public');
};

const getConfigFolderWritePath = () => {
  const writeFolder = getPublicPath();
  if (!fs.existsSync(writeFolder)) {
    fs.mkdir(writeFolder);
  }
  return writeFolder;
};

const writeStageLog = stage => {
  const filePath = path.join(getPublicPath(), new Date().getTime() + '-stageTime.txt');
  fs.writeFileSync(filePath, `Stage is ${stage}, time is ${new Date().toLocaleString()}.\n`, { flag: 'a' });
};

const logOneLine = (log, number = 20) => {
  console.log('-'.repeat(number));
  console.log(log);
  console.log('-'.repeat(number));
};

const handleMarkdownRemark = ({ actions, node, getNode }) => {
  const { createNodeField } = actions;
  const value = createFilePath({
    node,
    getNode,
  });
  createNodeField({
    name: 'slug',
    node,
    value,
  });
};

const getResolveFallback = () => ({
  assert: require.resolve('assert/'),
  buffer: require.resolve('buffer/'),
  crypto: require.resolve('crypto-browserify'),
  path: require.resolve('path-browserify'),
  url: require.resolve('url/'),
  util: require.resolve('util/'),
  os: require.resolve('os-browserify/browser'),
  stream: require.resolve('stream-browserify'),
  https: require.resolve('https-browserify'),
  http: require.resolve('stream-http'),
  tty: require.resolve('tty-browserify'),
  zlib: require.resolve('browserify-zlib'),
  querystring: require.resolve('querystring-es3'),
  constants: require.resolve('constants-browserify'),
  fs: false,
});

const getResolveAlias = (mergeData = {}) => ({
  '@/gen': path.join(__dirname, '../api/src/gen'),
  '@/config': path.join(__dirname, '../api/src/config'),
  '@/const': path.join(__dirname, '../api/src/const'),
  '@/urlConfig': path.join(__dirname, '../api/src/urlConfig'),
  '@/util': path.join(__dirname, '../api/src/util'),
  '@/api': path.join(__dirname, '../api/src/api'),
  '@web': path.join(__dirname, '../web/src'),
  '@web-edm': path.join(__dirname, '../web-edm/src'),
  '@web-disk': path.join(__dirname, '../web-disk/src'),
  '@web-im': path.join(__dirname, '../web-im/src'),
  '@web-schedule': path.join(__dirname, '../web-schedule/src'),
  '@web-mail': path.join(__dirname, '../web-mail/src'),
  '@web-mail-write': path.join(__dirname, '../web-mail-write/src'),
  '@web-entry-wm': path.join(__dirname, '../web-entry-wm/src'),
  '@web-entry-ff': path.join(__dirname, '../web-entry-ff/src'),
  '@web-unitable-crm': path.join(__dirname, '../web-unitable-crm/src'),
  '@web-contact': path.join(__dirname, '../web-contact/src'),
  '@web-apps': path.join(__dirname, '../web-apps/src'),
  '@web-account': path.join(__dirname, '../web-account/src'),
  '@web-setting': path.join(__dirname, '../web-setting/src'),
  '@web-site': path.join(__dirname, '../web-site/src'),
  '@web-common': path.join(__dirname, '../web-common/src'),
  '@web-sns-marketing': path.join(__dirname, '../web-sns-marketing/src'),
  '@web-materiel': path.join(__dirname, '../web-materiel/src'),
  '@web-sns-im': path.join(__dirname, '../web-sns-im/src/index.ts'),
  '~@sirius-desktop': path.join(__dirname, '../..'),
  jose: path.join(__dirname, '../../node_modules/jose/dist/browser/index.js'),
  ...mergeData,
});

/**
 * 增加sentry插件用于上传sourcemap文件
 * @param {*} conf
 */
const getEdmSentryPlugin = () => {
  const p = new SentryCliPlugin({
    include: './public',
    authToken: '71eeb0c720424d07b51c630fa8cb052d3212f53484084e67882399c92b87d574',
    url: 'https://sentry2.lx.netease.com/',
    org: 'lingxi',
    project: 'sirius-web',
    urlPrefix: '~/',
  });
  return p;
};

const getLxSentryPlugin = () => {
  const plugin = new SentryCliPlugin({
    org: 'lingxi',
    dist: env,
    project: 'sirius-electron',
    ignoreFile: '.gitignore',
    include: './public',
    urlPrefix: '~',
    rewrite: true,
    ignore: [
      'webpack.config.js',
      'node_modules/@sentry',
      'node_modules/source-map-loader',
      'node_modules/@typescript-eslint',
      'node_modules',
      'NIM_Web_Chatroom_v8.9.0.js',
      'NIM_Web_NIM_v8.7.2.js',
      'NIM_Web_NIM_v8.9.0.js',
      'NIM_Web_SDK_v8.11.3.js',
    ],
    // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
    // and need `project:releases` and `org:read` scopes
    authToken: '3aa9540d344b44f2a7a6a805ce935a0aff0d7792c0964c5e89b46bf75d014b71',
    release: envDefConfig('version'),
    // deleteAfterCompile: true
  });
  return plugin;
};

const getCustomerPlugin1 = enable => {
  if (enable) {
    return [
      (_this, compiler) => {
        _this.hooks.done.tap('done', stats => {
          // 编译完成之后执行
          if (stats.compilation.errors.length > 0 && !process.argv.includes('--watch')) {
            // 存在并且不能别监听
            console.log(colors.red(stats.compilation.errors));
            // process.exit(1);
          }
          // 编译成功
          console.log(colors.bgRed('compiled success!'));
          outputJson();
          // outputFile();
        });
      },
    ];
  }
  return [];
};

const loaderMap = {
  sourceMap: () => ({
    test: /\.js$/,
    enforce: 'pre',
    use: ['source-map-loader'],
    include: /node_modules\/@lxunit\/app-l2c-crm/,
  }),
  tsLoader: useRemoveTestId => ({
    test: /\.tsx?$/,
    use: [
      {
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          getCustomTransformers: () => ({
            // 暂时屏蔽调，下期放开
            before: useRemoveTestId ? [removeTestIdTransformer.createRemoveTestIdTransformer()] : [],
          }),
        },
      },
    ],
  }),
  removeComments: () => ({
    test: /renderContainer\.tsx$/,
    use: [
      {
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          compilerOptions: {
            removeComments: false,
          },
        },
      },
    ],
  }),
};

const pluginMap = {
  BundleAnalyzer: () =>
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      analyzerPort: 'auto',
      reportFilename: './public/report-' + new Date().getTime() + '.html',
    }),
  // LxSentryCli: getLxSentryPlugin,
  // EdmSentryCli: getEdmSentryPlugin,
  Process: plugins => plugins.provide({ process: 'process/browser' }),
  FastBuildWatch: stage => new FastBuildWatchPlugin({ stage }),
};

const getLoader = (loaderName, enable, params) => {
  if (enable) {
    const fn = loaderMap[loaderName];
    if (fn) {
      return fn(params);
    }
  }
  return {};
};

const getPlugin = (pluginName, enable, plugins) => {
  if (enable) {
    const fn = pluginMap[pluginName];
    if (fn) {
      return [fn(plugins)];
    }
  }
  return [];
};

const getMode = () => {
  if (isProd) {
    return 'production';
  }
  return 'development';
};

const getDevTool = () => {
  if (isProd) {
    if (isEdm) {
      return 'source-map';
    }
    // if (isEdm) {
    //   return profile === 'edm_test_prod' ? 'hidden-source-map' : 'source-map';
    // }
    return envDefConfig('debug') === 'true' ? 'source-map' : 'hidden-source-map';
  }
  return 'source-map';
};

const getCache = (options = {}) => {
  if (!options.useCache) {
    return false;
  }
  if (options.useMemory) {
    return true;
  }
  return {
    type: 'filesystem',
    compression: 'gzip',
    maxMemoryGenerations: 1,
  };
};

const getExternals = (isBuildHTML, shouldBuildApiAlone) => ({
  'rxjs/operators': isBuildHTML
    ? {
        commonjs: 'rxjs/operators',
        commonjs2: 'rxjs/operators',
        root: 'rxjsOperators',
      }
    : 'rxjsOperators',
  rxjs: 'rxjs',
  ...(shouldBuildApiAlone && isFastBuildWeb && !isFastBuildEdmData
    ? {
        api: isBuildHTML
          ? {
              commonjs: 'api',
              commonjs2: 'api',
              root: 'siriusDesktopApi',
            }
          : 'siriusDesktopApi',
      }
    : {}),
  'crypto-js': isBuildHTML
    ? {
        commonjs: 'crypto-js',
        commonjs2: 'crypto-js',
      }
    : 'CryptoJS',
  moment: 'moment',
  rrule: 'rrule',
  ...(isLingXi
    ? {
        echarts: 'echarts',
      }
    : {}),
  ...(!isBuildHTML
    ? {
        '@sentry/browser': 'Sentry',
        '@sentry/tracing': 'Sentry',
        axios: 'axios',
        // 'crypto-js': {
        //   commonjs: 'crypto-js',
        //   commonjs2: 'crypto-js'
        // },
        overlayscrollbars: 'OverlayScrollbars',
        lokijs: 'loki',
        dexie: 'Dexie',
      }
    : {}),
});

module.exports = {
  // 处理 markdown remark
  handleMarkdownRemark,
  // 更改loader 配置
  changeFileLoaderLimit,
  setupConfLoaderSourcemap,
  addConditionalLoader,
  setUrlLoaderOptions,
  useStyleLoaderReplaceMiniCssExtract,
  // 移除压缩css中的svgo配置
  removeOptimizationMinifyCssSvgo,
  // 用来写日志方法
  writeStageLog,
  getConfigFolderWritePath,
  logWebPackConfigToFile,
  logOneLine,
  // 获取配置
  getLoader,
  getPlugin,
  getResolveFallback,
  getResolveAlias,
  getDevTool,
  getMode,
  getExternals,
  getPublicPath,
  getCache,
};
