/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import { config as conf } from 'env_def';
console.log('----using html env:' + process.env.BUILD_FOR);
console.log('----using process:', process.env.NODE_ENV === 'development');
const forElectron = true;
const inElectron = forElectron;
const isEdm = () => conf('profile').includes('edm');
const isWin = true;
const env = conf('stage');
const isDev = env === 'local' || process.env.NODE_ENV === 'development';

const configEnv = require('./../config/env');
const SUB_PATH = configEnv.contextPath;

console.log('env variable', env, isDev, SUB_PATH);
console.info('---------------------from html page------------------');
console.log('forElectron', forElectron);
console.log('isElectron', inElectron);
export default function HTML(props) {
  if (!props.postBodyComponents) {
    props.postBodyComponents = [];
  }
  console.log('page props', props);
  let propsHeadComponents = props.headComponents;
  let dataHref = '';
  if (propsHeadComponents) {
    const blackHeadComonentKeys = ['generator-', 'gatsby-plugin-manifest-icon-', 'gatsby-plugin-manifest-link', 'gatsby-plugin-manifest-apple-touch-icon'];
    propsHeadComponents = propsHeadComponents.filter(component => {
      if (component && component.type === 'style' && component.props) {
        const isGlobalCss = component.props.id === 'gatsby-global-css';
        if (isGlobalCss) {
          dataHref = component.props['data-href'];
          return false;
        }
      }
      if (forElectron) {
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
      }

      return true;
    });
  }

  const postBodyComponents = props.postBodyComponents || [];
  if (postBodyComponents && postBodyComponents.length) {
    if (forElectron) {
      postBodyComponents.forEach(component => {
        if (component.type === 'script' && component.props && component.props.async) {
          delete component.async;
        }
      });
    }
  }

  return (
    <html lang="zh" {...props.htmlAttributes}>
      <head>
        <meta name="renderer" content="webkit" />
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
        {!isDev && !forElectron ? <script src={SUB_PATH + '/snapshot-umd.js'} /> : null}
        {dataHref && <link rel="stylesheet" href={dataHref} type="text/css" />}
        {isDev ? <script src={SUB_PATH + '/dev-script.js'} /> : null}
        {!isDev && !forElectron ? <script src={SUB_PATH + '/sw-main.js'} /> : null}
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
        {isWin ? (
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
        {propsHeadComponents}
      </head>
      <body {...props.bodyAttributes}>
        {props.preBodyComponents}
        <div key="body" id="___gatsby" dangerouslySetInnerHTML={{ __html: props.body }} />
        <div className={'sirius-loading' + (isEdm() ? '-edm' : '')} id="sirius-root-loading" />
        <div className="sirius-app-loading" id="sirius-app-loading">
          <i className="sirius-app-loading-icon" />
          <span className="sirius-app-loading-label">加载中...</span>
        </div>
        <script src={SUB_PATH + '/DATracker_Init.js?v=' + conf('version')} />
        {postBodyComponents}
        {env === 'local' ? <script key="socket.io" type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/socket.io/0.9.11/socket.io.min.js" /> : null}
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
