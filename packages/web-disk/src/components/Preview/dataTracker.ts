import { apis, platform, apiHolder, DataTrackerApi } from 'api';
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
/**
 * 灵犀办公引导页 展示&点击 埋点
 */
export const outsideGuidepageReport = (operatype: 'show' | 'go', fileId: number) => {
  trackerApi.track('h5_outside_guidepage', {
    operatype: operatype,
    pageSource: 'file',
    linktype: /\/share_anonymous\b/.test(window.location.href) ? 'external' : 'internal',
    platform: platform.isMobile() ? 'h5' : 'web',
    app: platform.getMobileApp(),
    fileid: fileId,
  });
};
/**
 * 普通文件不可预览提示缺省图 展示&点击 埋点
 * @param operatype
 */
export const noPreviewReport = (operatype: 'show' | 'download', fileExt: string) => {
  trackerApi.track('pc_disk_NoPreview', {
    operatype: operatype,
    fileType: fileExt,
    platform: platform.isMobile() ? 'h5' : 'web',
    app: platform.getMobileApp(),
  });
};
