const { run: jscodeshift } = require('jscodeshift/src/Runner');
const path = require('path');
const colors = require('colors');
const { collectPath } = require('./transform-util');

const options = {
  // dry: true, // 测试运行，不对源码进行修改
  print: false,
  verbose: 1,
  // ...
};
const transformPath = path.resolve(__dirname, './ts-transformer.v2.js');

module.exports = function (source) {
  if (source.includes('ignore-translate-transform')) {
    return source;
  }

  const filepath = this.resourcePath;

  if (
    (path.extname(filepath).includes('ts') || // 解析ts
      // && (
      //   /\/sirius-desktop\/packages\/web-edm\/src\/addressBook\//.test(filepath)
      // )
      path.extname(filepath).includes('tsx')) &&
    // && !filepath.includes('packages/api') // api 中的中文先不做处理
    // && !filepath.includes('FeedBack/feedbackContent.tsx')
    // && filepath.includes('packages/web-common/src/utils/constant.ts')
    // && ![ // 黑名单
    //   'packages/api',
    //   '/FeedBack/',
    //   'ErrorBoundary.tsx',
    //   'packages/web-common/src/utils/constant.ts',
    //   'webmail_impl.ts',
    //   'welcome_guide',
    //   'Avatar',
    //   'LxEditor',
    //   'comp_preview',
    //   'MultAccountsLoginModal',
    //   'packages/web-common/src/components/UI/Button',
    //   'web-im/src/common/timeline.tsx',
    //   'packages/web-mail/src/util.tsx',
    // //   'packages/web-schedule/src/components',
    // ].some(item => filepath.includes(item))
    // 白名单
    ['sirius-desktop/packages/web-edm/src'].some(item => filepath.includes(item))
  ) {
    // 执行完成之后，会立马把源文件替换掉
    collectPath(filepath);
  }
  return source;
};
