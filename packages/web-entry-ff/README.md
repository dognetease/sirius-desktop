<p align="center">
  <a href="https://www.gatsbyjs.com/?utm_source=starter&utm_medium=readme&utm_campaign=minimal-starter">
    <img alt="Gatsby" src="https://www.gatsbyjs.com/Gatsby-Monogram.svg" width="60" />
  </a>
</p>
<h1 align="center">
  web-entry-ff：外贸通web化项目
</h1>

# 本地启动electron 调试开发
1. 最外层 clean
2. api prepare:electron:mac 
3. api start:electron
4. web start:electron
5. electron prepare:mac
5. electron dev

# 初次启动
1. yarn install
2. yarn start

# 开启electron devtools
1. api.systemApi.winMap  找到对应 winId 一个一个试
2. electronLib.windowManage.toggleDevTools(winId)

# pro环境下打开主窗口 devtools
com + shift + option + i

# 小技巧
如果api更改了，web项目已经启动了，想更改api代码，可在web下执行命令： yarn workspace web build:api

# 🚀 web化项目独立配置
1. 启动命令：`yarn workspace web-entry-ff start:webedm`
2. 打包相关配置：
  - sirius-desktop/packages/support/src/def.ts
  - 关注`webedm_test`和`webedm_prod`
3. nginx请求转发相关配置：
  - 测试环境：`sirius-desktop/server-conf/nginx-webedm_test-conf`
  - 线上环境：`sirius-desktop/server-conf/nginx-webedm_prod-conf`
4. gatsby配置
  - `packages/web-entry-ff/gatsby-config.js`
  - 开发环境：`webedm_test: 'https://waimao-test1.cowork.netease.com'`
5. 构建命令：
  - 打包测试环境：`yarn bundle:webwm:test`
  - 打包线上环境：`yarn bundle:webwm:prod`
