import React from 'react';

const NpmDoc = () => {
  return (
    <div style={{ padding: '15px' }}>
      <h2>npm 包安装</h2>
      <p>如果是非灵犀项目，想要使用通用组件库，可以安装 @lingxi-common-component/sirius-ui </p>
      <h4>安装前需要设置 npm 源</h4>
      <p>alias nenpm='cnpm --registry=http://rnpm.hz.netease.com/ --registryweb=http://npm.hz.netease.com/ --cache=$HOME/.nenpm/.cache --userconfig=$HOME/.nenpmrc'</p>
      <h4>.npmrc 配置：</h4>
      <p>@lingxi-common-component:registry=http://rnpm.hz.netease.com</p>
      <h4> 或 .yarnrc</h4>
      <p>"@lingxi-common-component:registry" "http://rnpm.hz.netease.com"</p>
      <h4>安装</h4>
      <p>yarn add @lingxi-common-component/sirius-ui</p>
    </div>
  );
};

export default NpmDoc;
