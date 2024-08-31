import React from 'react';
import { config as conf } from 'env_def';
import wrapWithProvider from './wrap-with-provider';
const forElectron = conf('build_for') === 'electron';

export const wrapRootElement = wrapWithProvider;
const SUB_PATH = conf('contextPath') || '';
process.on('uncaughtException', function (err) {
  // Handle the error safely
  console.log(err);
});
const wrapContent = ({ setHeadComponents, setBodyAttributes }, pluginOptions) => {
  console.log('!!!!!! use ssr !!!!!!', pluginOptions);
  if (!forElectron) {
    setHeadComponents([
      React.createElement('script', {
        key: 'errorReportJumpPage',
        src: SUB_PATH + '/errr_report_jump_page.js?t=' + new Date().getTime(),
        type: 'text/javascript',
        async: true,
      }),
    ]);
  }
};
// const apis = {
//   onPreRenderHTML: (_, props) => {
//     console.log('ssr doing jobs : ', props);
//   },
//   onRenderBody: wrapContent,
// };
export const onPreRenderHTML = (_, props) => {
  console.log('ssr doing jobs : ', props);
};
export const onRenderBody = wrapContent;
