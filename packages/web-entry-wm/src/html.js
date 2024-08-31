/* eslint-disable react/no-danger */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import { config as conf } from 'env_def';
// import { Helmet } from 'react-helmet';
// import { withPrefix } from 'gatsby';
// import Safe from "react-safe"
// const systemApi = apiHolder.api.getSystemApi();
// const inElectron = systemApi.isElectron();
console.log('----using html env:' + process.env.BUILD_FOR);
console.log('----using process:', process.env.NODE_ENV === 'development');
const forElectron = conf('build_for') === 'electron';
const profile = conf('profile');
const inElectron = forElectron;
const isEdm = () => conf('profile').includes('edm');
const isWebmail = () => conf('profile').startsWith('webmail');
const isBuildingEdm = isEdm();
const isBuildingWebmail = isWebmail();
const isWin = conf('os') === 'win';
const env = conf('stage');
const isDev = env === 'local' || process.env.NODE_ENV === 'development';
// const versionTime = config('versionTime');

// const SUB_PATH = conf('contextPath') || '';

let SUB_PATH = '';

// if (profile === 'webedm_pre') {
//   SUB_PATH = 'https://waimao-pre-cdn.office.163.com';
// }

if (profile === 'webedm_prod') {
  SUB_PATH = 'https://waimao-cdn.office.163.com';
}
console.log('env variable', env, isDev, SUB_PATH);
console.info('---------------------from html page------------------');
console.log('forElectron', forElectron);
console.log('isElectron', inElectron);
const versionTime = conf('versionTime');
const version = conf('version');
export default function HTML(props) {
  // eslint-disable-next-line react/destructuring-assignment
  if (!props.postBodyComponents) {
    props.postBodyComponents = [];
  }
  console.log('page props', props);
  let propsHeadComponents = props.headComponents;
  let dataHref = '';
  if (propsHeadComponents) {
    const blackHeadComonentKeys = ['generator-', 'gatsby-plugin-manifest-link', 'gatsby-plugin-manifest-apple-touch-icon', 'gatsby-plugin-manifest-icon-'];
    // lingxi.office.163.com 保留icon
    if (!forElectron && !isBuildingWebmail) {
      blackHeadComonentKeys.pop();
    }
    propsHeadComponents = propsHeadComponents.filter(component => {
      if (component && component.type === 'style' && component.props) {
        const isGlobalCss = component.props.id === 'gatsby-global-css';
        if (isGlobalCss) {
          dataHref = component.props['data-href'];
          return false;
        }
      }
      const componentKey = component.key;
      const isBlackKey = blackHeadComonentKeys.some(blackKey => {
        if (componentKey && componentKey.includes && componentKey.includes(blackKey)) {
          return true;
        }
      });
      if (isBlackKey) {
        return false;
      }

      if (component.type === 'link' && component.props && component.props.rel === 'preload') {
        return false;
      }

      return true;
    });
  }

  const postBodyComponents = props.postBodyComponents || [];
  if (postBodyComponents && postBodyComponents.length) {
    postBodyComponents.forEach(component => {
      if (component.type === 'script' && component.props && component.props.async) {
        delete component.props.async;
      }
    });
  }

  if (process.env.NODE_ENV === 'production') {
    for (const component of props.headComponents) {
      if (component.type === 'style') {
        const index = props.headComponents.indexOf(component);
        const link = <link rel="stylesheet" href={component.props['data-href']} />;
        props.headComponents.splice(index, 1, link);
      }
    }
  }

  // const SUB_PATH = conf('contextPath') || '';
  return (
    <html lang="zh" {...props.htmlAttributes}>
      <head>
        <meta name="renderer" content="webkit" />
        <link rel="shortcut icon" href={SUB_PATH + '/favicon_edm.png'} type="image/x-icon" />
        <script
          dangerouslySetInnerHTML={{
            __html: `var pageInitTime = new Date().getTime();
            var global_inWindow = typeof window !== 'undefined';
            try {
              if(global_inWindow && console) {
                var useragentLowerCase = navigator.userAgent.toLowerCase();
                var reg = new RegExp('chrome/([\\\\d]+)');
                var match = useragentLowerCase.match(reg);
                if(match && match[1]){
                  var chromeVersion = parseInt && typeof parseInt === 'function' ? parseInt(match[1]): Number.parseInt(match[1]);
                  if(chromeVersion < 90) {
                    console.log = function(){};
                    console.warn = function(){};
                    console.info = function(){};
                  }
                }
              }
              var uaStr = navigator.userAgent;
              if(uaStr) {
                if(new RegExp('mac os x','i').test(uaStr)) {
                  var styleEl = document.createElement('style');
                  styleEl.innerHTML = "* {font-family: '苹方-简,sans-serif';}"
                  if(document&&document.head){
                    document.head.appendChild(styleEl);
                  }
                }
              }
            } catch(ex) {
              console.error(ex);
            }

            window.featureSupportInfo = {
              supportNativeProxy: typeof Proxy !== 'undefined' && Proxy.toString().indexOf('[native code]') !== -1 ? true : false,
              supportCrypto: global_inWindow && window.crypto && window.crypto.getRandomValues ? true : false
            }
            `,
          }}
        />
        {!isDev && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){
               function getLangFromUrl(){
                 try {
                   if(URLSearchParams) {
                     var searchInfo = new URLSearchParams(window.location.search);
                     return searchInfo.get('lang-str') || '';
                   }
                 } catch(ex) {
                  console.error(ex);
                 }
                 return '';
               }
               var defaultLang = 'zh';
               var langStr = localStorage ? localStorage.getItem('system_language') || getLangFromUrl() || defaultLang : defaultLang;
               if(langStr) {
                  window.systemLang = langStr;
                  document.write('<script src="${SUB_PATH}/lang/'+ langStr +'.js${!forElectron ? `?q=${versionTime}` : ''}"><\\/script>')
               }
            })()`,
            }}
          />
        )}
        {/* device_check 移动端直接拦截 展示不支持 */}
        <script src={SUB_PATH + '/lx-device-check.js'} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
          if (device && device.mobile()) {
            if (window.location.pathname === '/login/') {
              window.location.href = '/mlogin/' + window.location.search || '';
            } else if (window.location.pathname !== '/mlogin/') {
              window.location.href = '/static_html/not_support_h5.html';
            }
          }
          `,
          }}
        />
        {!isDev && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){
               function getLangFromUrl(){
                 try {
                   if(URLSearchParams) {
                     var searchInfo = new URLSearchParams(window.location.search);
                     return searchInfo.get('lang-str') || '';
                   }
                 } catch(ex) {
                  console.error(ex);
                 }
                 return '';
               }
               var defaultLang = 'zh';
               var langStr = localStorage ? localStorage.getItem('system_language') || getLangFromUrl() || defaultLang : defaultLang;
               if(langStr) {
                  window.systemLang = langStr;
                  document.write('<script src="${SUB_PATH}/lang/'+ langStr +'.js${!forElectron ? `?q=${versionTime}` : ''}"><\\/script>')
               }
            })()`,
            }}
          />
        )}
        {isDev ? <script src={SUB_PATH + '/dev-api-index.js'} /> : null}
        {isDev ? <script src={SUB_PATH + '/dev-script.js'} /> : null}
        {!isDev && !forElectron ? <script src={SUB_PATH + '/snapshot-umd.js'} /> : null}

        <script src={SUB_PATH + '/global-script-2023-11-05.js'} />
        {/* {lib style} */}
        {/* <link rel="preconnect" href="https://nos.netease.com/" crossOrigin />
        <link rel="dns-prefetch" href="https://nos.netease.com/" /> */}
        <link rel="stylesheet" href={SUB_PATH + '/global-style-2023-12-21.css'} type="text/css" />
        {/** todo 根据是否是暗黑模式做动态载入ant-dark.css， */}
        {!isEdm && <link rel="stylesheet" href={SUB_PATH + '/ant-dark-2023-09-18.css'} type="text/css" />}
        {!isDev && !forElectron ? <script src={'/sw-main.js' + '?t=' + versionTime} /> : null}
        {dataHref && <link rel="stylesheet" href={dataHref} type="text/css" />}
        {/* {snapshot-umd} */}
        {/* {!isDev && !forElectron ? <script src='https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/11/24/cfecf19fb26446f2ab8a6795cb4c005c.js' /> : null} */}
        {forElectron ? (
          <style
            type="text/css"
            dangerouslySetInnerHTML={{
              __html: `
@font-face {
    font-family: 'Source Han Sans';
    src: url('${SUB_PATH}/思源黑体.TTF');
    }
@font-face {
    font-family: 'lucida grande';
    src: url('${SUB_PATH}/LucidaGrande.otf');
    }
@font-face {
    font-family: 'uverdana';
    src: url('${SUB_PATH}/uverdana.ttf');
    }
@font-face {
    font-family: 'simhei';
    src: url('${SUB_PATH}/黑体.TTF');
    }
@font-face {
    font-family: 'menlo';
    src: url('${SUB_PATH}/menlo-regular.ttf');
    }
@font-face {
    font-family: 'verdana';
    src: url('${SUB_PATH}/verdana.ttf');
    }
@font-face {
    font-family: 'geneva';
    src: url('${SUB_PATH}/verdana.ttf');
    }
@font-face {
    font-family:'KaiTi';
    src: url('${SUB_PATH}/楷体.ttf');
    }
`,
            }}
          />
        ) : null}
        {true ? (
          <style
            type="text/css"
            dangerouslySetInnerHTML={{
              __html: `* {
    font-family: '思源黑体,sans-serif';
}`,
            }}
          />
        ) : (
          <style
            type="text/css"
            dangerouslySetInnerHTML={{
              __html: `* {
    font-family: '苹方-简,sans-serif';
}`,
            }}
          />
        )}
        <meta charSet="utf-8" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1,maximum-scale=1,shrink-to-fit=no,user-scalable=no" />
        {/* <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" /> */}
        {/* 只在web下加载 */}
        {/* {!forElectron ? <link rel="preload" href={SUB_PATH + '/api_data_init.html'} as="document" /> : null} */}
        {/* <link rel="preload" href={SUB_PATH + '/NIM_Web_SDK_v8.11.3.js?t=20220221'} as="script" /> */}
        {propsHeadComponents}
      </head>
      <body {...props.bodyAttributes}>
        {props.preBodyComponents}
        <div key="body" id="___gatsby" dangerouslySetInnerHTML={{ __html: props.body }} />
        <div className={'sirius-loading' + (isBuildingEdm ? '-edm' : '')} id="sirius-root-loading" />
        <div className="sirius-app-loading" id="sirius-app-loading">
          <i className="sirius-app-loading-icon" />
          <span className="sirius-app-loading-label">加载中...</span>
        </div>

        {/* <script src={SUB_PATH + '/NIM_Web_SDK_v8.11.3.js?t=20220221'} /> */}
        {/* <script src={env === 'prod' ? `/lovefield.min.js` : `/lovefield.js`}></script> */}
        {/* <script src="/DATracker.globals.1.6.12.8.js"></script> */}
        {/* <script src="/api/dist/index.js" /> */}
        <script src={SUB_PATH + '/DATracker_Init.js?v=' + version} />
        {/* <script src="/kf_init.js" /> */}
        {postBodyComponents}
        {env === 'local' ? <script key="socket.io" type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/socket.io/0.9.11/socket.io.min.js" /> : null}
        {/* 只在web下加载 */}
        {/* {!forElectron ? <iframe className="bg-win" id="bg_win" src={SUB_PATH + '/api_data_init.html'} title={process.env.includeIframe} /> : null} */}
        {isBuildingEdm ? <script src={SUB_PATH + '/nps_init.js'} /> : null}
      </body>
    </html>
  );
}

HTML.propTypes = {
  htmlAttributes: PropTypes.object,
  headComponents: PropTypes.array,
  bodyAttributes: PropTypes.object,
  preBodyComponents: PropTypes.array,
  body: PropTypes.string,
  postBodyComponents: PropTypes.array,
};
