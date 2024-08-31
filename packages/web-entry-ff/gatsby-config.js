/* eslint-disable */
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');
const envDef = require('env_def');

let pages = ['login.tsx', 'launch.tsx'];
try {
  fs.accessSync('../web/config/fast_build/ignore-module.json');
  const res = require('../web/config/fast_build/ignore-module.json');
  pages = [...pages, ...res.pages];
} catch (err) {}

process.on('uncaughtException', ex => {
  console.error('gatsby-config uncaughtException', ex);
  process.exit(1);
});
const domainPattern = /Domain=([a-zA-Z0-9\-._]+);/i;

const { config, ignoreLoginPath } = envDef;
console.log('host', config('host'));

const parentPath = path.resolve(__dirname, '../web/src');
console.log('cur dir', parentPath);
const alias = {};

fs.readdirSync(parentPath).forEach(dir => {
  if (fs.statSync(path.resolve(parentPath, dir)).isDirectory()) {
    alias[`@/${dir}`] = path.join(__dirname, `../web/src/${dir}`);
  }
});

console.log('common dir', alias);
// const env = 'prod';
const env = config('profile');
const productName = config('productName') || '网易灵犀办公';
console.log('productName', productName);
const isEdm = productName.includes('外贸');

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
  webmail_prod: 'https://mailh.qiye.163.com',
  test_prod: 'https://lingxi.office.163.com',
  edm_test: 'https://waimao.cowork.netease.com',
  webedm_test: 'https://waimao.cowork.netease.com',
  edm_dev: 'https://waimao-dev.cowork.netease.com',
  edm_prev: 'https://waimao.office.163.com',
};
const target = hostMap[env];
console.warn('-----------use proxy host--------------\n', target);

function handleEntryProxyRes(res, req, result, logContent) {
  const proxyRes = res;
  const cookies = proxyRes.headers['set-cookie'];
  if (logContent) {
    console.log('[request-debug]', req.url, '->', res.url);
    console.log('[request-debug]', result && result.body && JSON.stringify(result.body));
  }
  // console.log("get cookie:",cookies);
  if (cookies) {
    const newCookie = cookies.map(function (cookie) {
      if (domainPattern.test(cookie)) {
        const domain = envDef.config('domain');
        const replace = cookie.replace(domainPattern, 'Domain=' + domain + ';');
        console.log('transfer to ' + replace + ' current domain =' + domain);
        return replace;
      }
      return cookie;
    });
    // rewite set-cookie header
    delete proxyRes.headers['set-cookie'];
    proxyRes.headers['set-cookie'] = newCookie;
  }
}

// const pathPrefix = config('contextPath') || '';
const pathPrefix = '';

// const smartMailBoxHost = 'http://sirius-dev1.qiye.163.com/';
// 'https://sirius-contact.qiye.163.com
// edm 营销快捷启动
const edm_dev_fast_conf =
  process.env.EDM_FAST === 'true'
    ? [
        {
          resolve: `gatsby-plugin-page-creator`,
          options: {
            path: `${__dirname}/src/pages-yingxiao`,
            ignore: {
              patterns: [
                // '**/*',
                '!(index.tsx)',
              ],
            },
          },
        },
        {
          resolve: `gatsby-plugin-page-creator`,
          options: {
            path: `${__dirname}/src/pages`,
            ignore: {
              patterns: [
                // '**/*',
                `!(${pages.join('|')})`,
              ],
            },
          },
        },
      ]
    : [];
let exportsContent = {
  flags: {
    DEV_SSR: false,
    FAST_DEV: true,
    PRESERVE_WEBPACK_CACHE: false,
  },
  siteMetadata: {
    title: '灵犀办公',
    'sirius-url': config('host'),
  },
  pathPrefix,
  // assetPrefix: assetPrefix,
  plugins: [
    'gatsby-plugin-styled-components',
    {
      resolve: `gatsby-plugin-sass`,
      options: {
        additionalData: '@import "../web-common/src/styles/common.scss";',
        postCssPlugins: [require('postcss-custom-properties')()],
        cssLoaderOptions: {
          esModule: false,
          modules: {
            namedExport: false,
          },
        },
      },
    },
    // 'gatsby-plugin-sass',
    // 'gatsby-plugin-less',
    'gatsby-plugin-svgr',
    'gatsby-plugin-react-helmet',
    {
      resolve: 'gatsby-plugin-portal',
      options: {
        key: 'sirius-portal',
        id: 'sirius-portal',
      },
    },
    // {
    //   resolve: 'gatsby-plugin-manifest',
    //   options: {
    //     name: productName,
    //     short_name: productName,
    //     start_url: '/',
    //     display: 'standalone',
    //     icon: isEdm ? 'src/images/favicon_edm.png' : 'src/images/favicon.png',
    //   },
    // },
    {
      resolve: 'gatsby-plugin-alias-imports',
      options: {
        alias,
      },
    },
    // 'gatsby-plugin-mdx',
    // webpack耗时测量工具，需要时开启
    // 'gatsby-plugin-webpack-speed-measure2',
    // 动态创建入口
    ...edm_dev_fast_conf,
  ],
  // developMiddleware: app => {
  //
  // },
  // https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/X-Frame-Options
  // app.use((req, res, next) => {
  //   res.set('X-Frame-Options', 'SAMEORIGIN');
  //   next();
  // });
  developMiddleware: app => {
    app.use(
      '/bgAccount/',
      createProxyMiddleware({
        target: 'http://127.0.0.1:8080',
        secure: false,
        pathRewrite: {
          '/bgAccount/': '',
        },
      })
    );
    app.use(
      '/static_html/',
      createProxyMiddleware({
        target: 'http://127.0.0.1:8080',
        secure: false,
      })
    );
    app.use(
      '/DATracker',
      createProxyMiddleware({
        target: 'http://127.0.0.1:8080',
        secure: false,
      })
    );
    app.use(
      '/',
      createProxyMiddleware(
        pathname => {
          if (pathname === '/') return false;
          const needFilter = [
            ...ignoreLoginPath,
            '/#',
            '/index.html',
            '/attachment',
            '/readMail',
            '/sheet',
            '/share',
            '/unitable',
            '/doc',
            '/strangerMail',
            '/jump',
            '/old',
            '/marketingDataViewer',
            '/readOnlyUniversal',
            '/uniTabsPreview',
            '/personalWhatsapp',
          ].some(item => pathname.startsWith(item));
          return !needFilter;
        },
        {
          changeOrigin: true,
          target,
          onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res, true),
        }
      )
    );
  },
};

// if (env === 'webedm_pre') {
//   exportsContent = {
//     ...exportsContent,
//     assetPrefix: `https://waimao-pre-cdn.office.163.com`,
//   };
// }

if (env === 'webedm_prod') {
  exportsContent = {
    ...exportsContent,
    assetPrefix: `https://waimao-cdn.office.163.com`,
  };
}

module.exports = exportsContent;
