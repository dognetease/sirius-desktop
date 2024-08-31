// 此处记录登录页埋点
import { apis, apiHolder, DataTrackerApi, PerformanceApi, apiHolder as api } from 'api';
import { getIn18Text } from 'api';
const performanceApi: PerformanceApi = api.api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
enum EVENT_ID {
  LOGIN_PAGE_VIEW = 'pcLogin_view_LoginDetailPage',
  LOGIN_PAGE_CLICK = 'pcLogin_click_login_loginPage', // 登录页-点击登录按钮
}
type pageSourceType = 'doc' | 'sheet' | 'file' | '原始启动登录页' | '账号管理-添加账号登录页' | 'H5启动登录页';
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const getPageSourceInfo = (originPageSource: pageSourceType) => {
  let fileid: string | undefined;
  let pageSource = originPageSource;
  if (pageSource === getIn18Text('YUANSHIQIDONGDENG')) {
    // 此场景下如果是 'doc' | 'sheet' | 'file' 做细分
    // doc: #/doc/#id=19000000653969
    // sheet: #/sheet/#id=19000000653969
    // file: #/share/#id=19000000653969
    const hash = decodeURIComponent(window.location.hash);
    if (hash) {
      const isDoc = /^#\/?(?:doc)/i.test(hash);
      const isSheet = /^#\/?(?:sheet)/i.test(hash);
      const isFile = /^#\/?(?:share)\/#.*type=file/i.test(hash);
      if (isDoc) pageSource = 'doc';
      if (isSheet) pageSource = 'sheet';
      if (isFile) pageSource = 'file';
      // get fileID
      const res = /^#\/.*\/#.*id=(\w*)/.exec(hash);
      if (res && res[1]) {
        fileid = res[1];
      }
    }
  }
  return {
    fileid,
    pageSource,
  };
};
export const doLoginPageViewDataTrack = (pageSource: pageSourceType | string) => {
  trackerApi.track(EVENT_ID.LOGIN_PAGE_VIEW, { ...getPageSourceInfo(pageSource as pageSourceType) });
};
export const doLoginPageClickDataTrack = (
  pageSource: pageSourceType | string,
  loginResult: 'true' | 'false',
  loginFalseReason?: string,
  type?: 'email' | 'mobile' | 'qrcode'
) => {
  trackerApi.track(EVENT_ID.LOGIN_PAGE_CLICK, {
    type: type || 'email',
    loginResult,
    loginFalseReason,
    ...getPageSourceInfo(pageSource as pageSourceType),
  });
};
