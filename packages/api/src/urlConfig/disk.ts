import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class DiskUrl {
  /**
   * 空间分享接口
   */
  addNSCollaborator: string = (host + config('addNSCollaborator')) as string;

  deleteNSShare: string = (host + config('deleteNSShare')) as string;

  deleteNSShareWithMe: string = (host + config('deleteNSShareWithMe')) as string;

  getNSShareLink: string = (host + config('getNSShareLink')) as string;

  listNSCollaborator: string = (host + config('listNSCollaborator')) as string;

  listNSShare: string = (host + config('listNSShare')) as string;

  listNSShareWithMe: string = (host + config('listNSShareWithMe')) as string;

  removeNSCollaborator: string = (host + config('removeNSCollaborator')) as string;

  updateNSCollaborator: string = (host + config('updateNSCollaborator')) as string;

  updateNSShareType: string = (host + config('updateNSShareType')) as string;

  checkShareAuth: string = (host + config('checkShareAuth')) as string;

  /**
   * 回收站
   */
  getRecycleList: string = (host + config('getRecycleList')) as string;

  getPersonalRecycleList: string = (host + config('getPersonalRecycleList')) as string;

  getRecoverDirs: string = (host + config('getRecoverDirs')) as string;

  getPersonalRecoverDirs: string = (host + config('getPersonalRecoverDirs')) as string;

  deleteDirOrFileList: string = (host + config('deleteDirOrFileList')) as string;

  deletePersonalDirOrFileList: string = (host + config('deletePersonalDirOrFileList')) as string;

  deleteRecyRecordCompletely: string = (host + config('deleteRecyRecordCompletely')) as string;

  deleteRecyPersonalRecordCompletely: string = (host + config('deleteRecyPersonalRecordCompletely')) as string;

  recoverRecords: string = (host + config('recoverRecords')) as string;

  recoverPersonalRecords: string = (host + config('recoverPersonalRecords')) as string;

  /**
   * 网盘收藏
   */
  addFavorite: string = (host + config('addFavorite')) as string;

  removeFavorite: string = (host + config('removeFavorite')) as string;

  getFavoriteList: string = (host + config('getFavoriteList')) as string;

  renameNSFileFA: string = (host + config('renameNSFileFA')) as string;

  renameNSFolderFA: string = (host + config('renameNSFolderFA')) as string;

  /**
   * 空间外部分享接口
   */
  getNSExternalShareLink: string = (host + config('getNSExternalShareLink')) as string;

  getNSExternalShareStatistic: string = (host + config('getNSExternalShareStatistic')) as string;

  getNSExternalShareList: string = (host + config('getNSExternalShareList')) as string;

  getNSExternalShareInteractDetail: string = (host + config('getNSExternalShareInteractDetail')) as string;

  modifyNSExternalShareLink: string = (host + config('modifyNSExternalShareLink')) as string;

  modifyNSExternalShareLinkStatus: string = (host + config('modifyNSExternalShareLinkStatus')) as string;

  /**
   * 空间接口
   */

  listDir: string = host + config('listDir');

  listDirP: string = host + config('listDirP');

  listFile: string = host + config('listFile');

  listFileP: string = host + config('listFileP');

  // 云附件
  getCloudAttList: string = host + config('getCloudAttList');

  renewAttachments: string = host + config('renewAttachments');

  getExpiringFileCount: string = host + config('getExpiringFileCount');

  finishUploadAtt: string = host + config('finishUploadAtt');

  doDeleteCloudAtt: string = host + config('doDeleteCloudAtt');

  downloadCloudAtt: string = host + config('downloadCloudAtt');

  saveCloudAttachment: string = host + config('saveCloudAttachment');

  previewCloudAtt: string = host + config('previewCloudAtt');
  // ----

  listNSContent: string = host + config('listContent');

  listNSContentP: string = host + config('listContentP');

  listNSContentPS: string = host + config('listContentPS');

  batchZipDownload: string = host + config('batchZipDownload');

  batchZipDownloadP: string = host + config('batchZipDownloadP');

  batchZipDownloadPS: string = host + config('batchZipDownloadPS');

  listNSContentNumber: string = host + config('listContentNumber');

  listNSContentNumberP: string = host + config('listContentNumberP');

  listNSContentNumberPS: string = host + config('listContentNumberPS');

  getNSDirDetail: string = host + config('getDirDetail');

  getNSDirDetailP: string = host + config('getDirDetailP');

  getNSDirDetailPS: string = host + config('getDirDetailPS');

  getNSDirDetailFA: string = host + config('getDirDetailPS');

  getNSUploadToken: string = host + config('getUploadToken');

  getNSUploadTokenP: string = host + config('getUploadTokenP');

  getNSUploadTokenPS: string = host + config('getUploadTokenPS');

  getNSUploadTokenCA: string = host + config('getUploadTokenCA');

  renewNSUploadToken: string = host + config('renewUploadToken');

  renewNSUploadTokenP: string = host + config('renewUploadTokenP');

  renewNSUploadTokenPS: string = host + config('renewUploadTokenPS');

  getRootDir: string = host + config('getRootDir');

  getRootDirP: string = host + config('getRootDirP');

  getRootDirPS: string = host + config('getRootDirPS');

  getRootDirCA: string = host + config('getRootDirCA');

  getNSFileDetail: string = host + config('getFileDetail');

  getNSFileDetailP: string = host + config('getFileDetailP');

  getNSFileDetailPS: string = host + config('getFileDetailPS');

  getNSFileDetailFA: string = host + config('getFileDetailPS');

  delNSResource: string = host + config('delResource');

  delNSResourceP: string = host + config('delResourceP');

  delNSResourcePS: string = host + config('delResourcePS');

  createNSFolder: string = host + config('createFolder');

  createNSFolderP: string = host + config('createFolderP');

  createNSFolderPS: string = host + config('createFolderPS');

  addAttachmentPersonalAsNormal: string = host + config('addAttachmentPersonalAsNormal');

  addAttachmentPersonalAsCloud: string = host + config('addAttachmentPersonalAsCloud');

  addAttachmentEntAsNormal: string = host + config('addAttachmentEntAsNormal');

  addAttachmentEntAsCloud: string = host + config('addAttachmentEntAsCloud');

  // 获取下一级文件列表
  getDirList: string = host + config('getDirList');

  getDirListP: string = host + config('getDirListP');

  moveNSResource: string = host + config('moveResource');

  moveNSDir: string = host + config('moveDir');

  moveNSResourceP: string = host + config('moveResourceP');

  moveNSResourcePS: string = host + config('moveResourcePS');

  searchResource: string = host + config('searchResource');

  searchResourceP: string = host + config('searchResourceP');

  searchResourcePS: string = host + config('searchResourcePS');

  downloadNSFile: string = host + config('downloadNSFile');

  downloadNSFileP: string = host + config('downloadNSFileP');

  downloadNSFilePS: string = host + config('downloadNSFilePS');

  downloadNSFileFA: string = host + config('downloadNSFilePS');

  previewNSFile: string = host + config('previewNSFile');

  previewNSFileP: string = host + config('previewNSFileP');

  previewNSFilePS: string = host + config('previewNSFilePS');

  renameNSFile: string = host + config('renameNSFile');

  renameNSFileP: string = host + config('renameNSFileP');

  renameNSFilePS: string = host + config('renameNSFilePS');

  updateNSFileDes: string = host + config('updateNSFileDes');

  updateNSFileDesP: string = host + config('updateNSFileDesP');

  updateNSFileDesPS: string = host + config('updateNSFileDesPS');

  renameNSFolder: string = host + config('renameNSFolder');

  renameNSFolderP: string = host + config('renameNSFolderP');

  renameNSFolderPS: string = host + config('renameNSFolderPS');

  updateNSFolderDes: string = host + config('updateNSFolderDes');

  updateNSFolderDesP: string = host + config('updateNSFolderDesP');

  updateNSFolderDesPS: string = host + config('updateNSFolderDesPS');

  uploadNSFinish: string = host + config('uploadNSFinish');

  uploadNSFinishP: string = host + config('uploadNSFinishP');

  uploadNSFinishPS: string = host + config('uploadNSFinishPS');

  clearNSFolder: string = host + config('clearNSFolder');

  clearNSFolderP: string = host + config('clearNSFolderP');

  clearNSFolderPS: string = host + config('clearNSFolderPS');

  delNSItems: string = host + config('delNSItems');

  delNSItemsP: string = host + config('delNSItemsP');

  delNSItemsPS: string = host + config('delNSItemsPS');

  initPersonalSpace: string = host + config('initPersonalSpace');

  getDirPathInfoUsingGET: string = host + config('getDirPathInfoUsingGET');

  getDirPathInfoUsingGETP: string = host + config('getDirPathInfoUsingGETP');

  getDirPathInfoUsingGETPS: string = host + config('getDirPathInfoUsingGETPS');

  isLockEnabledUsingGET: string = host + config('isLockEnabledUsingGET');

  getNSEntRootAuthInfo: string = host + config('getNSEntRootAuthInfo');

  getNSEntAuthInfo: string = host + config('getNSEntAuthInfo');

  createFile: string = host + config('createFile');

  createFileP: string = host + config('createFileP');

  getNSRecentlyList: string = host + config('getNSRecentlyList');

  getUseRecordDownloadUrl: string = host + config('getUseRecordDownloadUrl');

  deleteUseRecord: string = host + config('deleteUseRecord');

  getNSExtDirContentList: string = host + config('getNSExtDirContentList');

  getNSExtFileContent: string = host + config('getNSExtFileContent');

  getNSExtFileDownload: string = host + config('getNSExtFileDownload');

  getNSExtFilePreview: string = host + config('getNSExtFilePreview');

  addNSExtShare: string = host + config('addNSExtShare');

  // 文件上传接口
  uploadFile: string = host + config('uploadFile');

  // 空间搜索接口
  searchDirAndFileList: string = host + config('searchDirAndFileList');

  uploadMailAttachment: string = host + config('uploadMailAttachment');

  getUrlWithTicket: string = host + config('getUrlWithTicket');

  jumpUrl: string = host + config('jumpUrl');

  setData: string = host + config('setData');

  getData: string = host + config('getData');

  // 转为在线文档，目前仅包含邮件附件
  covertMailAttachment2Doc: string = (host + config('covertMailAttachment2Doc')) as string;

  getMailAttachmentDocCovertStatus: string = (host + config('getMailAttachmentDocCovertStatus')) as string;

  importDoc: string = (host + config('importDoc')) as string;

  checkConvertTask: string = (host + config('checkConvertTask')) as string;

  importPersonalDoc: string = (host + config('importPersonalDoc')) as string;

  checkPersonalConvertTask: string = (host + config('checkPersonalConvertTask')) as string;

  convertFile2Doc: string = (host + config('convertFile2Doc')) as string;

  convertPersonalFile2Doc: string = (host + config('convertPersonalFile2Doc')) as string;

  // 邮件附件转存个人空间
  saveMailAttachment: string = (host + config('saveMailAttachment')) as string;

  /* 云附件上传 */
  // 获取云附件上传 token
  uploadAttachmentLegacyToken: string = (host + config('uploadAttachmentLegacyToken')) as string;

  // 上传完成
  uploadAttachmentLegacyFinished: string = (host + config('uploadAttachmentLegacyFinished')) as string;

  // 更新断点续传上下文
  modifyUploadContext: string = (host + config('modifyUploadContext')) as string;

  // 云附件删除
  deleteCloudAttachment: string = (host + config('deleteCloudAttachment')) as string;

  // 获取文档模板
  getDocTemplateList: string = (host + config('getDocTemplateList')) as string;

  // 单个模版创建
  createTemplate: string = (host + config('createTemplate')) as string;

  // 单个模版删除
  deleteTemplate: string = (host + config('deleteTemplate')) as string;

  // 在个人空间-通过模版创建协同文档
  createPersonalDocByTemplate: string = (host + config('createPersonalDocByTemplate')) as string;

  // 在企业空间-通过模板创建协同文档
  createDocByTemplate: string = (host + config('createDocByTemplate')) as string;

  // 检查有哪些文件类型可以创建 - 针对 unitable（上线后只有内测的用户可以新建unitable）
  queryCreateType: string = (host + config('queryCreateType')) as string;

  /** ----------------------应用中心相关接口--------------------------*/
  /** 是否展示应用中心入口 */
  appIsEnable: string = (host + config('appIsEnable')) as string;

  /** 获取周报日报应用相关用户权限及前置访问的信息 */
  getUserApp: string = (host + config('getUserApp')) as string;

  /** 获取外贸iframe url（主应用页面、grid选择器页面、detail详情页面） */
  getUniTradeURL: string = (host + config('getUniTradeURL')) as string;

  getNewUniTradeURL: string = (host + config('getNewUniTradeURL')) as string;

  getUniFieldMapping: string = (host + config('getUniFieldMapping')) as string;

  getUniCustomerId: string = (host + config('getUniCustomerId')) as string;

  /** 获取 uni 数据表字段id 和 外贸 id  */
  getFieldMapping: string = (host + config('getFieldMapping')) as string;

  // 获取权限申请信息
  getApplyInfo: string = (host + config('getApplyInfo')) as string;

  // 获取权限申请状态
  getApplyStatus: string = (host + config('getApplyStatus')) as string;

  // 申请权限
  applyAuth: string = (host + config('applyAuth')) as string;

  // 获取新用户首次进入云文档时的通知信息
  getNewUserAnnouncement: string = (host + config('getNewUserAnnouncement')) as string;

  // 提交用户对通知窗口的操作情况
  operateAnnouncement: string = (host + config('operateAnnouncement')) as string;

  // 云文档获取通知
  getAnnouncement: string = (host + config('getAnnouncement')) as string;

  // nps反馈
  feedBackNps: string = (host + config('feedBackNps')) as string;

  // 批量解析url
  getLinkInfoBatch: string = (host + config('getLinkInfoBatch')) as string;

  getLinkInfo: string = (host + config('getLinkInfo')) as string;
}
export type DiskUrlKeys = keyof DiskUrl;
const urlConfig = new DiskUrl();
const urlsMap = new Map<DiskUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as DiskUrlKeys, urlConfig[item as DiskUrlKeys]);
});
export default urlsMap;
