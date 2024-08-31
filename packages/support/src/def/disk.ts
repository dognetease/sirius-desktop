export default {
  listDir: '/edisk/api/biz/dir/list',
  listDirP: '/edisk/api/biz/personal/dir/list',
  listFile: '/edisk/api/biz/file/list',
  listFileP: '/edisk/api/biz/personal/file/list',
  listContent: '/edisk/api/biz/dir/getDirAndFileList',
  listContentP: '/edisk/api/biz/personal/dir/getDirAndFileList',
  listContentPS: '/edisk/api/biz/cooperate/share/getDirAndFileList',
  listContentNumber: '/edisk/api/biz/dir/getDirAndFileCount',
  listContentNumberP: '/edisk/api/biz/personal/dir/getDirAndFileCount',
  listContentNumberPS: '/edisk/api/biz/personal/dir/getDirAndFileCount',
  batchZipDownload: '/edisk/api/biz/cooperate/share/batchZipDownload',
  batchZipDownloadP: '/edisk/api/biz/cooperate/share/batchZipDownload',
  batchZipDownloadPS: '/edisk/api/biz/cooperate/share/batchZipDownload',
  getDirDetail: '/edisk/api/biz/dir/getDirDetail',
  getDirDetailP: '/edisk/api/biz/personal/dir/getDirDetail',
  getDirDetailPS: '/edisk/api/biz/cooperate/share/getDirDetail',
  getUploadToken: '/edisk/api/biz/file/getUploadToken',
  getUploadTokenP: '/edisk/api/biz/personal/file/getUploadToken',
  getUploadTokenPS: '/edisk/api/biz/personal/file/getUploadToken',
  getUploadTokenCA: '/edisk/api/biz/attachment/getUploadToken',
  renewUploadToken: '/edisk/api/biz/file/modifyUploadContext',
  renewUploadTokenP: '/edisk/api/biz/personal/file/modifyUploadContext',
  renewUploadTokenPS: '/edisk/api/biz/personal/file/modifyUploadContext',
  getRootDir: '/edisk/api/biz/dir/getRootDirInfo',
  getRootDirP: '/edisk/api/biz/personal/dir/getRootDirInfo',
  getRootDirPS: '/edisk/api/biz/personal/dir/getRootDirInfo',
  getRootDirCA: '/edisk/api/biz/attachment/getRootDirInfo',
  getFileDetail: '/edisk/api/biz/file/getFileDetail',
  getFileDetailP: '/edisk/api/biz/personal/file/getFileDetail',
  getFileDetailPS: '/edisk/api/biz/cooperate/share/getFileDetail',
  delResource: '/edisk/api/biz/dir/deleteResource',
  delResourceP: '/edisk/api/biz/personal/dir/deleteResource',
  delResourcePS: '/edisk/api/biz/personal/dir/deleteResource',
  createFolder: '/edisk/api/biz/dir/mkDir',
  createFolderP: '/edisk/api/biz/personal/dir/mkDir',
  createFolderPS: '/edisk/api/biz/personal/dir/mkDir',
  moveResource: '/edisk/api/biz/dir/mvDirAndFile',
  moveDir: '/edisk/api/biz/dir/move',
  addAttachmentPersonalAsNormal: '/edisk/api/biz/personal/getFileInternalUrls',
  addAttachmentPersonalAsCloud: '/edisk/api/biz/personal/addAsCloudAttachments',
  addAttachmentEntAsNormal: '/edisk/api/biz/qiye/getFileInternalUrls',
  addAttachmentEntAsCloud: '/edisk/api/biz/qiye/addAsCloudAttachments',
  getDirList: '/edisk/api/biz/dir/getDirList',
  getDirListP: '/edisk/api/biz/personal/dir/getDirList',
  moveResourceP: '/edisk/api/biz/personal/dir/mvDirAndFile',
  moveResourcePS: '/edisk/api/biz/personal/dir/mvDirAndFile',
  searchResource: '/edisk/api/biz/dir/searchDirAndFileList',
  searchResourceP: '/edisk/api/biz/personal/dir/searchDirAndFileList',
  searchResourcePS: '/edisk/api/biz/personal/dir/searchDirAndFileList',
  downloadNSFile: '/edisk/api/biz/file/download',
  downloadNSFileP: '/edisk/api/biz/personal/file/download',
  downloadNSFilePS: '/edisk/api/biz/cooperate/share/download',
  previewNSFile: '/edisk/api/biz/file/preview',
  previewNSFileP: '/edisk/api/biz/personal/file/preview',
  previewNSFilePS: '/edisk/api/biz/cooperate/share/preview',
  renameNSFile: '/edisk/api/biz/file/renameFile',
  renameNSFileP: '/edisk/api/biz/personal/file/renameFile',
  renameNSFilePS: '/edisk/api/biz/personal/file/renameFile',
  updateNSFileDes: '/edisk/api/biz/file/modifyFileDesc',
  updateNSFileDesP: '/edisk/api/biz/personal/file/modifyFileDesc',
  updateNSFileDesPS: '/edisk/api/biz/personal/file/modifyFileDesc',
  renameNSFolder: '/edisk/api/biz/dir/renameDir',
  renameNSFolderP: '/edisk/api/biz/personal/dir/renameDir',
  renameNSFolderPS: '/edisk/api/biz/personal/dir/renameDir',
  updateNSFolderDes: '/edisk/api/biz/dir/modifyDirDesc',
  updateNSFolderDesP: '/edisk/api/biz/personal/dir/modifyDirDesc',
  updateNSFolderDesPS: '/edisk/api/biz/personal/dir/modifyDirDesc',
  uploadNSFinish: '/edisk/api/biz/file/finishUpload',
  uploadNSFinishP: '/edisk/api/biz/personal/file/finishUpload',
  uploadNSFinishPS: '/edisk/api/biz/personal/file/finishUpload',
  clearNSFolder: '/edisk/api/biz/dir/clearDir',
  clearNSFolderP: '/edisk/api/biz/personal/dir/clearDir',
  clearNSFolderPS: '/edisk/api/biz/personal/dir/clearDir',
  delNSItems: '/edisk/api/biz/dir/delDirsOrFiles',
  delNSItemsP: '/edisk/api/biz/personal/dir/delDirsOrFiles',
  delNSItemsPS: '/edisk/api/biz/personal/dir/delDirsOrFiles',
  initPersonalSpace: '/edisk/api/biz/personal/space/checkSpace',
  getDirPathInfoUsingGET: '/edisk/api/biz/dir/getDirParentPath',
  getDirPathInfoUsingGETPS: '/edisk/api/biz/personal/dir/getDirParentPath',
  getDirPathInfoUsingGETP: '/edisk/api/biz/personal/dir/getDirParentPath',
  isLockEnabledUsingGET: '/edisk/api/biz/personal/isLockEnabled',
  getNSEntRootAuthInfo: '/edisk/api/biz/dir/getSpaceRootAuth',
  getNSEntAuthInfo: '/edisk/api/biz/dir/getDirAuth',
  createFile: '/edisk/api/biz/file/create',
  createFileP: '/edisk/api/biz/personal/file/create',
  // 邮件附件转到个人空间
  saveMailAttachment: '/edisk/api/biz/personal/asyncSaveMailAttachment',
  // 云附件
  getCloudAttList: '/edisk/api/biz/attachment/getFiles',
  renewAttachments: '/edisk/api/biz/attachment/renew',
  getExpiringFileCount: '/edisk/api/biz/attachment/getExpiringFileCount',
  delCloudAtt: '/edisk/api/biz/attachment/delete',
  downloadCloudAtt: '/edisk/api/biz/attachment/download',
  finishUploadAtt: '/edisk/api/biz/attachment/finishUpload',
  doDeleteCloudAtt: '/edisk/api/biz/attachment/delete',
  saveCloudAttachment: '/edisk/api/biz/personal/saveCloudAttachment',
  previewCloudAtt: '/edisk/api/biz/attachment/preview',
  // 最近使用接口
  getNSRecentlyList: '/edisk/api/biz/recently/getRecentlyUseList',
  getUseRecordDownloadUrl: '/edisk/api/biz/recently/getUseRecordDownloadUrl',
  deleteUseRecord: '/edisk/api/biz/recently/deleteUseRecord',
  // 外部分享相关
  getNSExtDirContentList: '/edisk/api/biz/external/dir/getDirAndFileList',
  getNSExtFileContent: '/edisk/api/biz/external/file/detail',
  getNSExtFileDownload: '/edisk/api/biz/external/file/download',
  getNSExtFilePreview: '/edisk/api/biz/external/file/preview',
  addNSExtShare: '/edisk/api/biz/external/share/addShare',
  // upload上传接口
  uploadFile: '/cowork/api/biz/upload/uploadFile',
  // 空间搜索接口
  searchDirAndFileList: '/edisk/api/biz/search/searchDirAndFileList',
  /** 空间分享相关* */
  addNSCollaborator: '/edisk/api/biz/cooperate/share/addCollaborators',
  deleteNSShare: '/edisk/api/biz/cooperate/share/deleteShared',
  deleteNSShareWithMe: '/edisk/api/biz/cooperate/share/deleteShareWithMe',
  getNSShareLink: '/edisk/api/biz/cooperate/share/getShareLinkInfo',
  listNSCollaborator: '/edisk/api/biz/cooperate/share/getCollaborators',
  listNSShare: '/edisk/api/biz/cooperate/share/listShared',
  listNSShareWithMe: '/edisk/api/biz/cooperate/share/listShareWithMe',
  removeNSCollaborator: '/edisk/api/biz/cooperate/share/deleteCollaborators',
  updateNSCollaborator: '/edisk/api/biz/cooperate/share/modifyUserRole',
  updateNSShareType: '/edisk/api/biz/cooperate/share/modifyShareType',
  checkShareAuth: '/edisk/api/biz/cooperate/share/checkAndUpdateAuth',
  /**
   * 空间外部分享相关
   * */
  getNSExternalShareLink: '/edisk/api/biz/external/share/addShare',
  getNSExternalShareStatistic: '/edisk/api/biz/external/share/statistic',
  getNSExternalShareList: '/edisk/api/biz/external/share/shareList',
  getNSExternalShareInteractDetail: '/edisk/api/biz/external/share/interactDetail',
  modifyNSExternalShareLink: '/edisk/api/biz/external/share/modify',
  modifyNSExternalShareLinkStatus: '/edisk/api/biz/external/share/modifyStatus',

  /* 转为在线文档 */
  // 附件转为在线文档
  covertMailAttachment2Doc: '/edisk/api/biz/personal/covertMailAttachment2Doc',
  getMailAttachmentDocCovertStatus: '/edisk/api/biz/personal/getMailAttachmentDocCovertStatus',

  /** 回收站 * */
  getPersonalRecycleList: '/edisk/api/biz/personal/recycle/listRecords',
  getRecycleList: '/edisk/api/biz/recycle/listRecords',
  getPersonalRecoverDirs: '/edisk/api/biz/personal/dir/listForOperation',
  getRecoverDirs: '/edisk/api/biz/dir/listForOperation',
  deleteDirOrFileList: '/edisk/api/biz/dir/deleteDirOrFileList',
  deletePersonalDirOrFileList: '/edisk/api/biz/personal/dir/deleteDirOrFileList',
  deleteRecyRecordCompletely: '/edisk/api/biz/recycle/deleteRecords', // 企业空间彻底删除
  deleteRecyPersonalRecordCompletely: '/edisk/api/biz/personal/recycle/deleteRecords', // 个人空间彻底删除
  recoverPersonalRecords: '/edisk/api/biz/personal/recycle/recoverRecords',
  recoverRecords: '/edisk/api/biz/recycle/recoverRecords',

  /** 网盘 收藏 */
  addFavorite: '/edisk/api/biz/star/add',
  removeFavorite: '/edisk/api/biz/star/remove',
  getFavoriteList: '/edisk/api/biz/star/list',
  renameNSFileFA: '/edisk/api/biz/cooperate/share/renameFile',
  renameNSFolderFA: '/edisk/api/biz/cooperate/share/renameDir',

  // upload上传接口
  // uploadFile: "/cowork/api/biz/upload/uploadFile",
  uploadMailAttachment: '/upxmail/',
  // 导入在线文档到企业网盘
  importDoc: '/biz/api/biz/file/importDoc',
  checkConvertTask: '/biz/api/biz/file/checkConvertTask',
  // 导入在线文档到个人网盘
  importPersonalDoc: '/biz/api/biz/personal/file/importDoc',
  checkPersonalConvertTask: '/biz/api/biz/personal/file/checkConvertTask',
  // 把网盘文件转为在线文档
  convertFile2Doc: '/biz/api/biz/file/convert2Doc',
  convertPersonalFile2Doc: '/biz/api/biz/personal/file/convert2Doc',
  /* 云附件上传 */
  // 获取云附件上传 token
  uploadAttachmentLegacyToken: '/biz/api/biz/attachment/getUploadToken',
  // 上传完成
  uploadAttachmentLegacyFinished: '/biz/api/biz/attachment/finishUpload',
  // 更新断点续传上下文
  modifyUploadContext: '/biz/api/biz/attachment/modifyUploadContext',
  // 云附件删除
  deleteCloudAttachment: '/biz/api/biz/attachment/delete',

  // 获取文档 模板list
  getDocTemplateList: '/biz/api/biz/doc/list-templates',
  // 单个模版创建
  createTemplate: '/biz/api/biz/doc/create-template',
  // 单个模版删除
  deleteTemplate: '/biz/api/biz/doc/delete-template',
  // 检查有哪些文件类型可以创建 - 针对 unitable（上线后只有内测的用户可以新建unitable）
  queryCreateType: '/biz/api/biz/doc/query-create-type',

  // 在个人空间-通过模版创建协同文档
  createPersonalDocByTemplate: '/biz/api/biz/personal/file/createByTemplate',
  // 在企业空间-通过模板创建协同文档
  createDocByTemplate: '/biz/api/biz/file/createByTemplate',

  /* 公告相关 */
  getNewUserAnnouncement: '/biz/api/biz/operation/new-user-announcement',
  operateAnnouncement: '/biz/api/biz/operation/operate-announcement',

  /* 文档权限 */
  // 获取权限申请信息
  getApplyInfo: '/biz/api/biz/apply/getApplyInfo',
  // 获取权限申请状态
  getApplyStatus: '/biz/api/biz/apply/queryStatus',
  // 申请权限
  applyAuth: '/biz/api/biz/apply/applyAuth',

  /* 云文档通知 */
  // 获取通知
  getAnnouncement: '/biz/api/biz/operation/get-announcement',
  // 操作通知[重复]
  // operateAnnouncement: '/biz/api/biz/operation/operate-announcement',

  /* nps反馈 */
  feedBackNps: '/biz/api/biz/operation/feed-back',

  /** ----------------------应用中心相关接口--------------------------*/
  /** 是否展示应用中心入口 */
  appIsEnable: '/biz/api/biz/app/isEnable',
  /** 获取周报日报应用相关用户权限及前置访问的信息 */
  getUserApp: '/biz/api/biz/app/getUserApp',

  getLinkInfo: '/others/api/biz/link/info',
  /* 批量解析url */
  getLinkInfoBatch: '/others/api/biz/link/infos',

  /** ----------------------unitable crm 相关接口--------------------------*/
  getUniTradeURL: '/cospread/uni/api/integration/trade/getUrl',
  getNewUniTradeURL: '/cospread/uni/api/integration/trade/getUniUrl',
  getUniFieldMapping: '/cospread/uni/api/integration/trade/getFieldMapping',
  getUniCustomerId: '/customer/api/biz/uni/transfer/to_uni_record_id',
  /** 外贸 获取 uni id 和外贸id 字段mapping */
  getFieldMapping: '/cospread/uni/api/integration/trade/getFieldMapping',
};
