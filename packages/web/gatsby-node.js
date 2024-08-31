/* eslint-disable max-len */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable max-statements */
/* eslint-disable no-console */
const path = require('path');
const { config: envDefConfig } = require('env_def');
const { DefinePlugin } = require('webpack');

const {
  removeOptimizationMinifyCssSvgo,
  setupConfLoaderSourcemap,
  setUrlLoaderOptions,
  useStyleLoaderReplaceMiniCssExtract,
  changeFileLoaderLimit,
  logOneLine,
  handleMarkdownRemark,
  addConditionalLoader,
  writeStageLog,
  getPublicPath,
  getResolveFallback,
  getExternals,
  getResolveAlias,
  getConfigFolderWritePath,
  logWebPackConfigToFile,
  getLoader,
  getPlugin,
  getDevTool,
  getMode,
  getCache,
} = require('./gatsby-common');

// 翻译相关脚本
// const { transformer } = require('./config/ts-transformer');

// 删除ssr
const ssrRemoveUtils = require('./build-components/ssr-remove/add-ssr-remove');
const lingxiPlugins = require('./build-components/lingxi-plugin');

const isFastBuildWeb = process.env.FASE_DEV_WEB && process.env.FASE_DEV_WEB.toString() === 'true';
const isFastBuildEdmMail = process.env.FAST_EDMMAIL && process.env.FAST_EDMMAIL.toString() === 'true';
const isFastBuildEdmData = process.env.FAST_EDMDATA && process.env.FAST_EDMDATA.toString() === 'true';
const isFastBuildEdmYingXiao = process.env.FAST_EDMYINGXIAO && process.env.FAST_EDMYINGXIAO.toString() === 'true';
const isFastUni = process.env.FAST_UNI && process.env.FAST_UNI.toString() === 'true';
const useMemoryCache = process.env.cacheType && process.env.cacheType === 'memory';

const profile = envDefConfig('profile');
const isEdm = profile && profile.includes('edm');
const isLingXi = !isEdm;
const isAutoTestProfile = ['test'].includes(profile);

const env = envDefConfig('stage'); // 'dev'; // config('stage');
const isWeb = envDefConfig('build_for') === 'web';
const isElectron = envDefConfig('build_for') === 'electron';
const isProd = env === 'prod';

const shouldBuildApiAlone = false;
// 是否使用BundleAnalyzerPlugin
const shouldUseBundleAnalyzer = false;
// 是否限制base64 file的大小
const shouldLimitFileSize = true;
// 是否添加loader
const shouldAddConditionLoader = true;
// 是否写入webpack 配置
const enableWriteConfigPath = true;
// 打开移除testId
const enableRemoveTestId = false;

const defines = {
  'process.env.BUILD_ISLINGXI': JSON.stringify(!!isLingXi),
  'process.env.BUILD_ISEDM': JSON.stringify(!!isEdm),
  'process.env.BUILD_ISWEB': JSON.stringify(!!isWeb),
  'process.env.BUILD_ISELECTRON': JSON.stringify(!!isElectron),
  'process.env.BUILD_ISPREVIEWPAGE': JSON.stringify(false),
};

console.log(
  `profile: ${profile}\n`,
  `env.stage: ${env}\n`,
  `isFastBildWeb: ${isFastBuildWeb}\n`,
  `isFastBuildEdmMail: ${isFastBuildEdmMail}\n`,
  `isFastBuildEdmData: ${isFastBuildEdmData}\n`,
  `isFastBuildEdmYingXiao: ${isFastBuildEdmYingXiao}\n`,
  'build defines is : \n',
  defines
);

process.on('uncaughtException', err => {
  // Handle the error safely
  console.log('gatsby-node-uncaughtException', err);
  process.exit(1);
});

exports.onCreateNode = args => {
  if (args.node.internal.type === 'MarkdownRemark') {
    handleMarkdownRemark(args);
  }
};

/**
 * 目前还没有找到方法保证externals配置只在客户端环境的时候配置
 * PS:理论上来说客户端配置和服务端配置应该是可以分别配置
 */
exports.onCreateWebpackConfig = ({
  stage,
  // rules,
  loaders,
  plugins,
  actions,
  getConfig,
}) => {
  writeStageLog(stage);
  const isBuildHTML = ['build-html', 'develop-html'].includes(stage);
  const isBuildProdHTML = stage === 'build-html';
  const isBuildDev = stage && stage.includes('develop');
  const cache = getCache({
    useCache: isBuildDev,
    useMemory: useMemoryCache,
  });
  const webpackConfig = {
    mode: getMode(),
    devtool: isBuildDev ? 'eval-nosources-cheap-source-map' : getDevTool(),
    output: {
      libraryTarget: 'commonjs',
    },
    cache,
    stats: 'none',
    resolve: {
      mainFields: ['browser', 'module', 'main'],
      extensions: ['.ts', '.js', '.json', '.jsx'],
      fallback: getResolveFallback(),
      plugins: [
        new lingxiPlugins.LingXiResolvePlugin({
          stage,
          isFastBuildWeb,
          isFastBuildEdmMail,
          isLingXi,
          isEdm,
          isWeb,
          isFastBuildEdmData,
          isFastBuildEdmYingXiao,
          isFastUni,
        }),
      ],
      alias: {
        ...(shouldBuildApiAlone && isFastBuildWeb && !isFastBuildEdmData
          ? {}
          : {
            api: path.join(__dirname, '../api/src/index.ts'),
          }),
        ...getResolveAlias(),
      },
    },
    optimization: isBuildDev
      ? {
        splitChunks: false,
      }
      : {},
    module: {
      unsafeCache: isBuildDev,
      rules: [getLoader('tsLoader', true, isProd && enableRemoveTestId), getLoader('sourceMap', isEdm), getLoader('removeComments', true)],
      parser: {
        javascript: {
          exportsPresence: 'warn',
        },
      },
    },
    plugins: [
      new DefinePlugin(defines),
      ...getPlugin('BundleAnalyzer', shouldUseBundleAnalyzer),
      ...getPlugin('Process', stage === 'build-javascript' || stage === 'develop', plugins),
      ...getPlugin('FastBuildWatch', isFastBuildWeb && shouldBuildApiAlone, stage),
      // ...getPlugin('LxSentryCli', false),
      // ...getPlugin('EdmSentryCli', isEdm && (env === 'prev' || env === 'prod')),
    ],
    externals: getExternals(isBuildHTML, shouldBuildApiAlone),
    externalsPresets: {
      node: isBuildProdHTML,
    },
    stats: {
      warnings: false,
    },
  };
  actions.setWebpackConfig(webpackConfig);
  const conf = getConfig();
  // 更换output的publicPath
  if (envDefConfig('contextPath')) {
    conf.output.publicPath = envDefConfig('contextPath') + '/';
  }
  // 去除ssr
  if (isBuildProdHTML) {
    const cacheEntryPath = path.join(getPublicPath(), '../.cache/static-entry.js');
    logOneLine('cacheEntryPath:', cacheEntryPath);
    ssrRemoveUtils.ignoreBuildSSRPages(cacheEntryPath);
  }
  // #region 处理已经配置的loader
  // 为了能加载出crm的源码尝试做出的更改,不知道有无副作用
  if (!isBuildDev && isEdm && profile !== 'edm_test_prod') {
    setupConfLoaderSourcemap(conf);
  }
  if (shouldLimitFileSize) {
    changeFileLoaderLimit(conf, 1024);
  }
  // 处理url-loader esmodules: false;
  setUrlLoaderOptions(conf, loaders);
  if (isBuildDev) {
    useStyleLoaderReplaceMiniCssExtract(conf, loaders);
  }
  if (shouldAddConditionLoader) {
    addConditionalLoader(conf, {
      loader: 'js-conditional-compile-loader',
      options: {
        BUILDISDEV: isBuildDev,
        FASTBUILDDEV: isFastBuildWeb,
        ISLINGXI: isLingXi,
        ISEDM: isEdm,
        USELAZYLOAD: isEdm && !isBuildDev,
        NOUSELAZYLOAD: !(isEdm && !isBuildDev),
      },
    });
  }
  // #endregion 处理已经配置的loader

  // 处理移除svgo配置
  if (stage === 'build-javascript') {
    removeOptimizationMinifyCssSvgo(conf);
  }

  // 输出webpack 配置
  if (enableWriteConfigPath) {
    logWebPackConfigToFile(`${getConfigFolderWritePath()}/config-${stage}-${new Date().getTime()}.json`, conf);
  }
  // 重新用覆盖形式替换webpack
  actions.replaceWebpackConfig(conf);
};

exports.onCreateBabelConfig = ({ actions }) => {
  // console.log('in babel config callback ', actions, pluginOptions);
  actions.setBabelPlugin({
    name: 'babel-plugin-import',
    options: {
      libraryName: 'antd',
      style: () => false,
    },
  });
  actions.setBabelPlugin({
    name: 'babel-plugin-import',
    options: {
      libraryName: '@sirius/icons',
      libraryDirectory: 'esm/components',
      camel2DashComponentName: false,
      style: false,
    },
  });
  actions.setBabelPlugin({
    name: 'babel-plugin-minify-dead-code-elimination',
  });
  if (!isAutoTestProfile && (env === 'dev' || env === 'test' || env === 'local' || env === 'prev')) {
    // console.log('babel no change for ', env);
  } else {
    const pluginSettings = {
      name: 'babel-plugin-transform-remove-console',
      options: {
        exclude: ['error'],
      },
    };
    actions.setBabelPlugin(pluginSettings);
  }
  return null;
};

exports.onCreatePage = ({ page, actions }) => {
  const { deletePage } = actions;
  if (page.path.includes('/compDoc/')) {
    deletePage(page);
  }
  if (isLingXi) {
    const lingxiList = [
      '/compDoc/',
      '/imgPreviewPage/',
      '/marketingDataViewer/',
      '/customerPreview/',
      '/openSeaPreview/',
      '/opportunityPreview/',
      '/personalWhatsapp/',
      '/strangerMails/',
      '/update/',
      '/cluePreview/',
    ];
    if (lingxiList.includes(page.path)) deletePage(page);
    if (isFastBuildWeb) {
      // if (page.path !== '/login/' && page.path !== '/' && page.path !== 'password_reset') {
      //   deletePage(page);
      // }
    }
  }
};
