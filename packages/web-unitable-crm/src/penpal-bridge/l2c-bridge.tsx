import { registerSiriusBridgeApi } from '@lxunit/app-l2c-crm';

import { WaimaoAppMethodsForUnitableCRM } from '@lxunit/bridge-types';
import { readEmailDetail, replyEmail, transEmail, createAuthorization } from '@/components/Layout/Customer/components/emailList/uniIndex';
import { previewNosFile } from '@/components/Layout/Customer/components/moments/upload';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import store from '@web-common/state/createStore';
import { SitePagesUrl, navigateToSitePages } from '@web-common/utils/navigateToSitePages';

import { contactOneKeyMarketing, contactMarketingHosting, openProductEdmTemplateEmail, sendProductEmail, marketingDetail } from '../api/helper';
import { contactBridgeApiImpl } from './contact-impl';
import { siriusEmailBridgeImpl } from './email-impl';
import { systemBridgeApiImpl } from './system-impl';
import { dataTrackerApi, errorReportApi, productAuthApi } from '../api/index';
import { showAuthInfo } from './components/email-auth-modal';
import { DataTrackerApi, ErrorReportApi } from 'api';
export interface HandlerData {
  action: 'send-email' | 'one-key-marketing' | 'product-send-email' | 'product-one-key-marketing' | 'contact-one-key-marketing';
  payload: {
    allSelected?: boolean; // 是否全选，暂时用不上，外贸侧的弹框自己处理全选
    totalCount?: number; // 所有数据的个数
    filter?: string; // 筛选条件，全选场景需要使用; 外贸侧可以不用理解Filter类型，仅在获取数据时做透传
    tableId: string;
    recordIds: string[]; // 当前所选的记录Id, 外贸侧根据该id去uni查询具体数据
    records: any[];
  };
}
export const contactApiMethods = {
  ...contactBridgeApiImpl,
};
export const assignContactApiMethods = (methods: Partial<WaimaoAppMethodsForUnitableCRM['contactApi']>) => {
  Object.assign(contactApiMethods, methods);
};

export const unitableApiMethods: WaimaoAppMethodsForUnitableCRM['unitableApi'] = {
  sendEmailProduct(data) {
    return sendProductEmail(data);
  },
  oneKeyMarketingProduct(data, backUrl?: string) {
    return openProductEdmTemplateEmail(data, backUrl);
  },
  oneKeyMarketingContact(params: { emailList: any[]; submitAfterHandle?: () => void; backUrl?: string }) {
    return contactOneKeyMarketing(params);
  },
  marketingHostingContact(params: { emailList: any[]; submitAfterHandle?: () => void; backUrl?: string }) {
    return contactMarketingHosting(params);
  },

  goMarketingDetail(params: { emailKey: string; backUrl?: string }) {
    return marketingDetail(params);
  },
  /** 预览邮件详情页 */
  readEmailDetail(data) {
    readEmailDetail(data);
    console.log('customEventHandle handle called', data);
  },
  /** 回复邮件 */
  replyEmail(data) {
    replyEmail(data);
    console.log('customEventHandle handle called', data);
  },
  /** 转发邮件 */
  transEmail(data) {
    transEmail(data);
    console.log('customEventHandle handle called', data);
  },
  // /** 申请权限邮件 */
  // createAuthorization(data) {
  //     console.log('customEventHandle handle called', data);
  //     createAuthorization(data, (isUpdate: boolean) => { _this.state.resoloveFun(isUpdate)});
  //     return new Promise((resolve) => {
  //         _this.setState({
  //             resoloveFun: resolve
  //         })
  //     })
  // },
  /** 申请权限邮件 */
  createAuthorization(data) {
    let resoloveFun: undefined | ((bool: boolean) => void);
    console.log('customEventHandle handle called', data);
    createAuthorization(data, (isUpdate: boolean) => {
      resoloveFun && resoloveFun(isUpdate);
    });
    return new Promise(resolve => {
      resoloveFun = resolve;
    });
  },
  showAuthInfo,
  /** 查看权限申请状态 */
  // showAuthInfo(contactEmails) {
  //     _this.setState({
  //         authorization: true,
  //         contactEmails: contactEmails
  //     })
  //     console.log('customEventHandle handle called', contactEmails);
  // },
  /** 查看海关数据详情页 xxxxxxxxxxxx*/
  // customsDetail(data) {
  //     _this.handleCustomsDetail(data, 0);
  //     console.log('customEventHandle handle called', data);
  // },
  /** 跟进动态附件 */
  showAppendix(data) {
    previewNosFile(data?.document_id, data?.condition, data?.company_id);
    console.log('customEventHandle handle called', data);
  },
  /** whatsapp图片预览 */
  previewImage(data) {
    ImgPreview.preview(data);
  },

  getSiriusVisibleMenuLabels() {
    return store.getState().privilegeReducer.visibleMenuLabels;
  },
  // 模块权限
  getSiriusModulesPermission() {
    return store.getState().privilegeReducer.modules;
  },
  // 角色权限
  getSiriusRolesPermission() {
    return {
      roles: store.getState().privilegeReducer.roles,
      roleList: store.getState().privilegeReducer.roleList,
    };
  },
  getProductVersion() {
    return store.getState().privilegeReducer.version;
  },
  companyChange() {
    console.log('companyChange');
  },
  // /**获取往来邮件 未读气泡提醒*/
  // getRegularCustomerMenuData(){
  //     return self.props.regularMenuData;
  // },

  changePageMode() {},

  // 跳转建站多语言翻译页面
  goWebSiteTranslatePage(params: { productId: string }) {
    const { productId } = params;
    const url = `${SitePagesUrl.productEditPage}?productId=${productId}`;
    // console.log('goWebSiteTranslatePage--', url);
    navigateToSitePages(url);
  },

  // 地址簿迁移是否结束
  isAddressMigrateToCrmDone() {
    return productAuthApi.getABSwitchSync('address_transfer2_crm_done');
  },
};

export const assingUnitableApiMethods = (methods: Partial<WaimaoAppMethodsForUnitableCRM['unitableApi']>) => {
  Object.assign(unitableApiMethods, methods);
};
const methods: WaimaoAppMethodsForUnitableCRM & { dataTrackerApi: DataTrackerApi; errorReportApi: ErrorReportApi } = {
  contactApi: contactApiMethods as unknown as WaimaoAppMethodsForUnitableCRM['contactApi'],
  systemApi: systemBridgeApiImpl,
  emailApi: siriusEmailBridgeImpl,
  unitableApi: unitableApiMethods,
  dataTrackerApi: dataTrackerApi,
  errorReportApi: errorReportApi,
};
registerSiriusBridgeApi(methods);
