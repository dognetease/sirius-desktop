/* eslint-disable max-statements */
const { createProxyMiddleware } = require('http-proxy-middleware');
const envDef = require('env_def');
// const config = require("dotenv").config({
//     path: '.env.${process.env.NODE_ENV}',
// });
// console.log(envDef);
// console.log(process.env.ACTIVE_ENV, process.env.BUILD_FOR);
process.on('uncaughtException', ex => {
  console.log(ex);
});
const domainPattern = /Domain=([a-zA-Z0-9\-._]+);/i;
// eslint-disable-next-line import/no-extraneous-dependencies
const path = require('path');
const fs = require('fs');

const { config } = envDef;
const parentPath = path.resolve(__dirname, 'src');
console.log('cur dir', parentPath);
const alias = {};

fs.readdirSync(parentPath).forEach(dir => {
  if (fs.statSync(path.resolve(__dirname, 'src', dir)).isDirectory()) {
    alias[`@/${dir}`] = `src/${dir}`;
  }
});
// alias[`@web-disk`] = path.resolve(__dirname,'./../web-disk/src');
// alias[`@web-schedule`] = path.resolve(__dirname,'./../web-schedule/src');

console.log('common dir', alias);

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

const defaultOption = {
  changeOrigin: true,
  onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
};
/**
 *
 * @param { ProxyConfig } configItem 代理配置对象
 * @return 返回ProxyMiddlewareOption配置对象
 */
function getProxyMiddlewareOptionByConfig(proxyConfig) {
  if (!proxyConfig || !proxyConfig.proxyPath || !proxyConfig.target) {
    throw new Error('"proxyConfig" || "proxyConfig.proxyPath" || "proxyConfig.target" is null or empty!');
  }

  const result = { ...defaultOption, ...proxyConfig };
  // 删除代理路径字段，不需要
  delete result.proxyPath;
  return result;
}

const needMailDebug = false; // 需要更改邮件转发改这里
const mailHost = needMailDebug ? 'https://maildev.qiye.163.com/' : 'https://mail.qiye.163.com/';
const mailHzHost = needMailDebug ? 'https://maildev.qiye.163.com/' : 'https://mailhz.qiye.163.com/';
const entryHost = needMailDebug ? 'https://entrydev.qiye.163.com/' : 'http://entry.qiye.163.com/';
const entryHzHost = needMailDebug ? 'https://entrydev.qiye.163.com/' : 'http://entryhz.qiye.163.com/';

const needImInTestEnv = config('NIMSID').startsWith('13af9e'); // 更改build_env.ts中的云信id就可以直接切换测试和线上环境

const serverEnv = needImInTestEnv ? 'test' : 'prod';
// const serverEnv = 'prod';
// const serverEnv = 'local';
const imHost = needImInTestEnv ? 'http://sirius-im-test.qiye.163.com/' : 'http://sirius-im.qiye.163.com/';
let contactHost = 'http://sirius-contact-dev.qiye.163.com/';
// let contactHost = 'http://sirius-dev1.qiye.163.com/';
if (serverEnv === 'test') {
  contactHost = 'http://sirius-contact-test.qiye.163.com/';
}
if (serverEnv === 'prod') {
  contactHost = 'http://sirius-contact.qiye.163.com/';
}
const nContactHost = needImInTestEnv ? 'https://sirius-recent-contacts-test.qiye.163.com/' : 'https://sirius-recent-contacts.qiye.163.com/';

const enhanceHost = needImInTestEnv ? 'https://sirius-test1.qiye.163.com/' : 'https://sirius.qiye.163.com/';

const needEdistInTestEnv = false; // 需要更改网盘的转发改这里
const edistHost = needEdistInTestEnv ? 'https://edisk-test.qiye.163.com/' : 'https://edisk.qiye.163.com/';
const needPrivilegeInTestEnv = true;
const privilegeHost = needPrivilegeInTestEnv ? 'https://sirius-product-privilege.cowork.netease.com/' : 'https://sirius-product-privilege.qiye.163.com/';
const othersInTestEnv = false;
const othersHost = othersInTestEnv ? 'https://sirius-others-test.qiye.163.com/' : 'https://sirius-others.qiye.163.com/';

const needQyServicesInTestEnv = false;
const qyServicesHost = needQyServicesInTestEnv ? 'http://59.111.229.252/' : 'https://services.qiye.163.com/';

const smartMailBoxHost = 'http://sirius-contact-test.qiye.163.com/';
// const smartMailBoxHost = 'http://sirius-dev1.qiye.163.com/';
// 'https://sirius-contact.qiye.163.com

const exportsContent = {
  // flags: {
  //   DEV_WEBPACK_CACHE: true,
  //   FAST_DEV: true,
  //   FAST_REFRESH: true
  // },
  siteMetadata: {
    title: '灵犀办公',
    'sirius-url': config('host'),
  },
  plugins: [
    'gatsby-plugin-styled-components',
    'gatsby-plugin-sass',
    'gatsby-plugin-less',
    'gatsby-plugin-svgr',
    'gatsby-plugin-react-helmet',
    {
      resolve: 'gatsby-plugin-portal',
      options: {
        key: 'sirius-portal',
        id: 'sirius-portal',
      },
    },
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: '网易灵犀办公',
        short_name: '网易灵犀办公',
        start_url: '/',
        //   background_color: '#f7f0eb',
        //   theme_color: '#a2466c',
        display: 'standalone',
        icon: 'src/images/favicon.png',
      },
    },
    // {
    //     resolve: 'gatsby-plugin-react-redux',
    //     options: {
    //         pathToCreateStoreModule: './src/state/createStore',
    //         serialize: {
    //             space: 0,
    //             isJSON: true,
    //             unsafe: false,
    //             ignoreFunction: true,
    //         },
    //         cleanupOnClient: true,
    //         windowKey: '__PRELOADED_STATE__',
    //     },
    // },
    {
      resolve: 'gatsby-plugin-alias-imports',
      options: {
        alias,
      },
    },
  ],
  // eslint-disable-next-line max-statements
  developMiddleware: app => {
    app.use(
      '/cowork/api',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'http://sirius-contact-test.qiye.163.com/',
        target: contactHost,
        // target: "http://sirius-contact-test.cowork.netease.com/", //此域名废弃
        pathRewrite: {
          '/cowork/api': '/api',
          // '/cowork/api': '/contact/api'
        },
        // onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res, true)
      })
    );
    app.use(
      '/smartmailbox/api',
      createProxyMiddleware({
        changeOrigin: true,
        target: smartMailBoxHost,
        pathRewrite: {
          '/smartmailbox/api': '/api',
          // '/smartmailbox/api': '/contact/api'
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res, true),
      })
    );
    app.use(
      '/recent/api',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'http://sirius-contact-test.qiye.163.com/',
        target: nContactHost,
        // target: "http://sirius-contact-test.cowork.netease.com/", //此域名废弃
        pathRewrite: {
          '/recent/api': '/api',
        },
      })
    );
    app.use(
      '/translate/',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://sirius-test1.qiye.163.com/',
        target: 'https://openapi.youdao.com/',
        pathRewrite: {
          '/translate/api': '/api',
          '/translate/translate_html': '/translate_html',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res, true),
      })
    );
    app.use(
      '/mail-enhance/',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://sirius-test1.qiye.163.com/',
        target: 'https://sirius.qiye.163.com/',
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res, true),
      })
    );

    app.use(
      '/im/api',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'http://sirius-im-test.qiye.163.com/',
        target: imHost,
        pathRewrite: {
          '/im/api': '/api',
        },
        onProxyRes: (proxyRes, req, res) => {
          console.log(req, res, proxyRes);
        },
      })
    );
    app.use(
      '/others/api',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://sirius-others.qiye.163.com',
        target: 'https://sirius-others-test.qiye.163.com',
        pathRewrite: {
          '/others/api': '/api',
        },
        onProxyRes: (proxyRes, req, res) => {
          console.log(req, res, proxyRes);
        },
      })
    );
    app.use(
      '/domain',
      createProxyMiddleware({
        changeOrigin: true,
        target: entryHzHost,
        // target: 'http://entryhz.qiye.163.com/',
        pathRewrite: {
          // "/cowork/api": "/api",
        },
        // set-cookie: pass_2fa=UfU7cBu76LC1rBXqIYdt53RFwVHM2l7gsTd7KbCSFT4yZeM4XaxL8UteDqCAmyHY; Domain=.qiye.163.com;
        // Expires=Sun, 11-Apr-2021 15:30:13 GMT; Path=/ set-cookie:
        // QIYE_SESS=8.WoT0PAi_2bVFqMT7wmF8nzTbX8iu7G7C3wqjKHIMNVfHBAEoG7s3U2rsMCG2PeWlRxvE9pMs66E8hV0iu1eEfDyWZfpVviVPZAzLiSo
        // _zm6elSWSCAOdGpHjOr4aMZVRoM4P5nVO2XyOfgJPgCi5GLDlHUabveP5SIkim.E6a;Domain=.qiye.163.com;Path=/
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res, true),
      })
    );
    app.use(
      '/bjdomain',
      createProxyMiddleware({
        changeOrigin: true,
        target: entryHost,
        // target: 'http://entry.qiye.163.com/',
        pathRewrite: {
          '/bjdomain': '/domain',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/edisk/api',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://edisk-test2.qiye.163.com/',
        target: edistHost,
        pathRewrite: {
          '/edisk/api': '/api',
        },
      })
    );

    app.use(
      '/biz/api',
      createProxyMiddleware({
        changeOrigin: true,
        target: edistHost,
        // target: 'https://edisk-test.qiye.163.com/',
        pathRewrite: {
          '/biz/api': '/api',
        },
      })
    );
    // app.use(
    //     "/edisk-test/api",
    //     createProxyMiddleware({
    //         changeOrigin: true,
    //         target: "http://edisk-test.qiye.163.com/",
    //         pathRewrite: {
    //             "/edisk-test/api": "/api",
    //         },
    //     }),
    // );
    app.use(
      '/entry/',
      createProxyMiddleware({
        changeOrigin: true,
        target: entryHzHost,
        // target: 'http://entryhz.qiye.163.com/',
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/bjentry/',
      createProxyMiddleware({
        changeOrigin: true,
        target: entryHost,
        // target: 'http://entry.qiye.163.com/',
        pathRewrite: {
          '/bjentry/': '/entry/',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/meeting/api',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'https://sirius-meeting.qiye.163.com/',
        pathRewrite: {
          '/meeting/api': '/api',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/schedulemanager/',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://mailhz.qiye.163.com/',
        target: mailHzHost,
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/bjschedulemanager/',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://mail.qiye.163.com/',
        target: mailHost,
        pathRewrite: {
          '/bjschedulemanager/': '/schedulemanager/',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/atthview/',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://mailhz.qiye.163.com/',
        target: mailHzHost,
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/bjatthview/',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://mail.qiye.163.com/',
        target: mailHost,
        pathRewrite: {
          '/bjatthview/': '/atthview/',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/js6/',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://mailhz.qiye.163.com/',
        target: mailHzHost,
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res, true),
      })
    );
    app.use(
      '/bjjs6/',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://mail.qiye.163.com/',
        target: mailHost,
        pathRewrite: {
          '/bjjs6/': '/js6/',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/rdmailquery/',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://mailhz.qiye.163.com/',
        target: mailHzHost,
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/bjrdmailquery/',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://mail.qiye.163.com/',
        target: mailHost,
        pathRewrite: {
          '/bjrdmailquery/': '/rdmailquery/',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/qiyepush/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'https://qiyepushhz.qiye.163.com/',
        // target: "http://10.200.217.236/",
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/bjqiyepush/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'https://qiyepush.qiye.163.com/',
        // target: "http://10.200.217.236/",
        pathRewrite: {
          '/bjqiyepush/': '/qiyepush/',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/preview/preview.do',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://mailhz.qiye.163.com/',
        target: mailHzHost,
        // target: "http://10.200.217.236/",
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/bjpreview/preview.do',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://mail.qiye.163.com/',
        target: mailHost,
        // target: "http://10.200.217.236/",
        pathRewrite: {
          '/bjpreview/preview.do': '/preview/preview.do',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/mailpreview/api',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://file-preview.qiye.163.com/',
        target: 'http://file-preview-test.qiye.163.com/',
        pathRewrite: {
          '/mailpreview/api': '/api',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    // app.use('/upxmail/',
    //     createProxyMiddleware({
    //         changeOrigin: true,
    //         target: "https://uphz1.qiye.163.com/",
    //         // target: "http://10.200.217.236/",
    //         // pathRewrite: {
    //         //     "/bjpreview/preview.do": "/preview/preview.do",
    //         // },
    //         onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req,
    //             res),
    //     }),
    // );
    app.use(
      '/upxmail/uphz_qiye_163_com/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'https://uphz.qiye.163.com/',
        // target: "http://10.200.217.236/",
        pathRewrite: {
          '/upxmail/uphz_qiye_163_com': '/upxmail/upload',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/upxmail/hwhzup_qiye_163_com/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'https://hwhzup.qiye.163.com/',
        // target: "http://10.200.217.236/",
        pathRewrite: {
          '/upxmail/hwhzup_qiye_163_com': '/upxmail/upload',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/upxmail/tup1_qiye_163_com/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'http://tup1.qiye.163.com/',
        // target: "http://10.200.217.236/",
        pathRewrite: {
          '/upxmail/tup1_qiye_163_com': '/upxmail/upload',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/upxmail/tup2_qiye_163_com/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'http://tup2.qiye.163.com/',
        // target: "http://10.200.217.236/",
        pathRewrite: {
          '/upxmail/tup2_qiye_163_com': '/upxmail/upload',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/upxmail/cup1_qiye_163_com/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'http://cup1.qiye.163.com/',
        // target: "http://10.200.217.236/",
        pathRewrite: {
          '/upxmail/cup1_qiye_163_com': '/upxmail/upload',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/upxmail/cup2_qiye_163_com/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'http://cup2.qiye.163.com/',
        // target: "http://10.200.217.236/",
        pathRewrite: {
          '/upxmail/cup2_qiye_163_com': '/upxmail/upload',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/upxmail/hwup_qiye_163_com/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'https://hwup.qiye.163.com/',
        // target: "http://10.200.217.236/",
        pathRewrite: {
          '/upxmail/hwup_qiye_163_com': '/upxmail/upload',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/commonweb/',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://mailhz.qiye.163.com/',
        // target: mailHzHost,
        target: 'http://mailhz.qiye.163.com/',
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/bjcommonweb/',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://mail.qiye.163.com/',
        target: mailHost,
        pathRewrite: {
          '/bjcommonweb/': '/commonweb/',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/redirectApi/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'https://sirius-redirect.cowork.netease.com/',
        pathRewrite: {
          '/redirectApi/': '/',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/customer/api',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'http://sirius-customer-test.qiye.163.com/',
        pathRewrite: {
          '/customer/': '/',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/config/api',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'http://sirius-config-test.qiye.163.com/',
        target: 'http://sirius-config.qiye.163.com/',
        pathRewrite: {
          '/config/': '/',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    // http://4b335c7f6fd540d195b01ed09c15d792@sentry.lx.netease.com//7
    app.use(
      '//7/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'http://4b335c7f6fd540d195b01ed09c15d792@sentry.lx.netease.com/',
        // pathRewrite: {
        //     '/config/': '/',
        // },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '//9/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'http://4b335c7f6fd540d195b01ed09c15d792@sentry.lx.netease.com/',
        // pathRewrite: {
        //     '/config/': '/',
        // },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/device/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'https://sirius-push.qiye.163.com/',
        pathRewrite: {
          '/device/': '/',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/device/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'https://sirius-push.qiye.163.com/',
        pathRewrite: {
          '/device/': '/',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/qiyeurs',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://mailhz.qiye.163.com/',
        target: mailHzHost,
        // target: "http://10.200.217.236/",
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res, true),
      })
    );
    app.use(
      '/bjqiyeurs',
      createProxyMiddleware({
        changeOrigin: true,
        // target: 'https://mail.qiye.163.com/',
        target: mailHost,
        // target: "http://10.200.217.236/",
        pathRewrite: {
          '/bjqiyeurs/': '/qiyeurs/',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res, true),
      })
    );
    app.use(
      '/personal-signature/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'https://sirius-test1.qiye.163.com/',
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res, true),
      })
    );
    // https://mail.qiye.163.com
    app.use(
      '/mailTemplateApi/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'http://sirius-mail-template.qiye.163.com/',
        // target: 'http://sirius-mail-template-test.cowork.netease.com/',
        pathRewrite: {
          '/mailTemplateApi/': '/',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/todo',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'https://sirius.qiye.163.com/',
        // target: 'http://sirius-todo.lx-i.netease.com',
        pathRewrite: {
          '/todo/': '/todo/',
        },
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/privilege/api/',
      createProxyMiddleware({
        changeOrigin: true,
        target: privilegeHost,
        pathRewrite: {
          '/privilege/api': '/api',
        },
      })
    );

    app.use(
      '/service',
      createProxyMiddleware({
        changeOrigin: true,
        target: qyServicesHost,
        onProxyRes: (proxyRes, req, res) => handleEntryProxyRes(proxyRes, req, res),
      })
    );
    app.use(
      '/others/api/',
      createProxyMiddleware({
        changeOrigin: true,
        target: othersHost,
        pathRewrite: {
          '/others/api': '/api',
        },
      })
    );
    app.use(
      '/praise-mail/',
      createProxyMiddleware({
        changeOrigin: true,
        target: 'https://sirius.qiye.163.com',
        pathRewrite: {
          '/praise-mail/': '/',
        },
      })
    );

    // https://sirius-mail-template-test.cowork.netease.com/

    // #region corp mail相关接口
    const corpProxyConfigs = [
      {
        proxyPath: '/corp-mail/',
        target: 'https://sirius-test1.qiye.163.com',
        pathRewrite: {
          '/corp-mail/': '/',
          // '/corp-mail/': '/bind_hosts/',
        },
      },
    ];

    corpProxyConfigs.forEach(configItem => {
      try {
        const proxyOption = getProxyMiddlewareOptionByConfig(configItem);
        app.use(configItem.proxyPath, createProxyMiddleware(proxyOption));
      } catch (ex) {
        console.error(ex);
      }
    });
    // #endregion
  },
};

if (config('stage') === 'prod' || config('stage') === 'prev') {
}
module.exports = exportsContent;
