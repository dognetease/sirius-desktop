import { setHttpConfig, setUpL2cConf } from '@lxunit/app-l2c-crm';
import { config } from 'env_def';

// 统一 setUpL2cConf 和 setHttpConfig
const isWeb = config('build_for') === 'web';
const host: string = isWeb ? '' : (config('host') as string);
const stage = config('stage');

setUpL2cConf({
  isProduction: stage === 'prod',
});
// 临时解决
setHttpConfig({
  httpHost: host,
} as any);

console.log('uni-drawer-init');

// 其余相关的 source2TrackerModule 等不在这里导出，这里只针对 7 个抽屉组件和 showUniDrawer 方法，方便统一调用上面的方法
export {
  showUniDrawer,
  UniDrawerBusinessCreate,
  UniDrawerBusinessDetail,
  UniDrawerContactDetail,
  UniDrawerCustomerDetail,
  UniDrawerCustomerView,
  UniDrawerLeadsDetail,
  UniDrawerLeadsView,
  UniDrawerContactView,
  MarketingStatistics,
} from '@lxunit/app-l2c-crm';
