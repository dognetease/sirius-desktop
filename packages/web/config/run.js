const { runParse } = require('./jscodeshift');
const path = require('path');
const { getAllPaths } = require('./transform-util');
// const paths = require('../paths.json');
// console.log(getAllPaths('/Users/zhangbinbinb28199/workspace/code/sirius-desktop/sirius-desktop/packages/web-edm/src'));
// const blackList = ['/Users/zhangbinbinb28199/workspace/code/sirius-desktop/sirius-desktop/packages/web-edm/src/detail/detailV2.tsx'];
// const paths = getAllPaths('/Users/lvxinb29609/work/sirius-desktop', blackList);
// console.log(paths);
// runParse(paths);
runParse([
  // '/Users/lvxinb29609/work/sirius-desktop/packages/web-sns-marketing',
  path.resolve(__dirname, '../../web-entry-wm/src/layouts/WmMain/views/v2/dropMenu.tsx'),
  path.resolve(__dirname, '../../web-common/src/components/PinnedMenu/components/pinnedMenuDrawer/pinnedMenuDrawer.tsx'),
  // path.resolve(__dirname, '../../web-common/src/components/FloatToolButton/index.tsx'),
  // path.resolve(__dirname, '../src/pages/index.tsx'),
  // path.resolve(__dirname, '../src/pages/index.tsx'),
  // path.resolve(__dirname, '../../web-entry-wm/src/layouts/config'),
  // path.resolve(__dirname, '../../web-entry-wm/src/layouts/WmMain/views/userMenu.tsx'),
  // path.resolve(__dirname, '../../web-common/src/components/UI/Avatar/avatar.tsx'),
  // path.resolve(__dirname, '../../web/src/components/Layout/SceneAggregation'),
  // path.resolve(__dirname, '../../web-site/src/index.tsx'),
  // path.resolve(__dirname, '../../web/src/components/Layout/EnterpriseSetting/index.tsx'),
  // path.resolve(__dirname , '../../web-entry-wm/src/layouts/WmMain'),
  // '/Users/lvxinb29609/work/sirius-desktop/packages/web-sns-marketing',
  // '/Users/lvxinb29609/work/sirius-desktop/packages/web/src/components/Layout/SNS',
  // '/Users/lvxinb29609/work/sirius-desktop/packages/web-edm/src/addressBook',
  // '/Users/lvxinb29609/work/sirius-desktop/packages/web-common/src/components/AIFloatButton',
  // '/Users/lvxinb29609/work/sirius-desktop/packages/web/src/components/Layout/Worktable',
  '/Users/lvxinb29609/work/sirius-desktop/packages/web-sns-im/src',
]);
