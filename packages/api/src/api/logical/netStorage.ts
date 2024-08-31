import { Api, PopUpMessageInfo } from '../_base/api';
import { ApiRequestConfig } from '../data/http';
// import { PopUpMessageInfo } from '../data/event';

// 企业空间 个人空间 与我分享
export type NetStorageType = 'ent' | 'personal' | 'personalShare' | 'cloudAtt' | 'favorites' | 'normalAtt';
export interface ResponseDiskVolume {
  sizeLimit: number;
  spaceId: number;
  totalSize: number;
  type: NetStorageType;
}
export interface RequestRecoverRecordParams {
  type: NetStorageType;
  recordId: number;
  targetDirId?: number;
}
export type NSPrivilegeInfo = {
  privilegeId: number;
  privilegeName: string;
};
export type NSRoleInfo = {
  roleId: number;
  roleName: string;
};

export type AddDiskFileToAttRes = {
  id?: number;
  identity?: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  expired?: number;
  isCloud: boolean;
};

export type NSNormalAttachmentResult = {
  id: number;
  internalUrl: string;
  fileName: string;
  size: number;
};

export type NSCloudAttachmentResult = {
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  identity: string;
  expireTime: number;
};

export interface NSAuthority {
  privilegeInfos: NSPrivilegeInfo[];
  roleInfos: NSRoleInfo[];
}

export type RequestNSDirMove = {
  resourceId: number;
  resourceType: string;
  tarDirId: number;
};
// export interface NSShareAuthority {
//   roleInfos: NSRoleInfo[];
// }

type CommonNSFolderContentPart = {
  authorityDetail: NSAuthority;
  roleArr?: NSRoleInfo[];
  hasExternalShared: boolean; // 是否有外部分享
  createTime: string;
  createUserId: number;
  createUserName: string;
  createUserNickName: string;
  description: string;
  extensionType: string;
  id: number;
  modifyUserId: number;
  modifyUserName: string;
  modifyUserNickName: string;
  name: string;
  parentId: number;
  parentName: string;
  path: string;
  pathName: string;
  updateTime: string;
};

export type NSDirContent = CommonNSFolderContentPart & {
  fileCount: number;
  hasSubDir: true;
  level: number;
  sizeLimit: number;
  spaceId: number;
  totalSize: number;
  starred: boolean;
};
// type NSFileType = 'file' | 'excel' | 'doc';
export type NSFileContent = CommonNSFolderContentPart & {
  md5: string;
  nosKey: string;
  size: number;
  fileType: NSFileType;
  starred: boolean;
  expireTime?: number; // 过期时间
};

export interface RequestList {
  page: number;
  pageSize: number;
}
export interface RequestRecycleList extends RequestList {
  type: string;
}

// 请求文件夹/目录
export interface ReqListDir {
  type: NetStorageType;
  // 父 dirId，-1 表示查顶层
  parentDirId: number;
  sort?: 'letter' | 'updateTime';
  spaceId?: number;
}

export interface ReqListFile {
  type: NetStorageType;
  page: number;
  pageSize: number;
  parentDirId: number;
  spaceId?: number;
}

export interface ReqGetCloudAttList {
  page: number;
  pageSize: number;
  isDescendingExpireOrder?: boolean;
}

export interface ReqRenewAttachments {
  identities: string[];
}

// 云附件
export interface CloudAtt {
  downloadUrl: string;
  expireTime: string | number;
  fileName: string;
  fileSize: number;
  fileType: string;
  identity: string;
}

export interface ResGetCloudAttList {
  cloudAttachments: CloudAtt[];
  totalCount: number;
}

/**
 * 文件恢复目录请求参数
 *
 */
export interface RequestRecoverDirParams {
  type: string;
  parentDirId: number;
  sort?: string;
  spaceId?: number;
}

export interface RequestFavoriteParams {
  resourceId: number;
  resourceType: ResourceType;
}
export interface RequestNSFolderContent {
  spaceId?: number;
  type: NetStorageType;
  dirId: number;
  isDesc?: boolean;
  needAuthorityInfo?: boolean;
  page?: number;
  pageSize?: number;
  sort?: 'createTime' | 'updateTime';
}

export interface RequestNSItemSearch {
  type: NetStorageType;
  key: string;
  isDesc?: boolean;
  page?: number;
  pageSize?: number;
  sort?: 'createTime' | 'updateTime';
}

export interface ResponseNSFolderNumberContent {
  dirTotalCount: number;
  fileTotalCount: number;
  dirId?: number;
  spaceId?: number;
  returnTag?: string;
}

export interface ResponseNSFolderContent extends ResponseNSFolderNumberContent {
  dirList: NSDirContent[];
  fileList: NSFileContent[];
  page: number;
  pageSize: number;
}

export interface RequestNSCommonId {
  dirId?: number;
  fileId?: number;
  spaceId?: number;
}

export interface RequestNSCommonFolderId extends RequestNSCommonId {
  type: NetStorageType;
  needVolume?: boolean;
}

export interface RequestBatchDeleteItem {
  type: NetStorageType;
  dirIds: number[];
  fileIds: number[];
}

/**
 * 彻底删除参数
 */
export interface RequestDeleteDirOrFiles {
  type: NetStorageType;
  recordIds: number[];
}
export interface ReqDoDeleteCloudAtt {
  identity: string;
}

export interface ReqPreivewCloudAtt {
  identity: string;
}

export interface ReqGetAllAuthorities {
  productId: string;
  productVersionId: string;
  orgId?: string;
  accId?: string;
}

export interface ReqDownloadCloudAtt {
  identity: string;
}

export interface ResDownloadCloudAtt {}

export interface ReqSaveCloudAttachment {
  identity: string;
}

export interface ResSaveCloudAttachment {
  code: number;
  message: string;
  success: boolean;
}

export interface RequestNSUploadInfo extends RequestNSCommonFolderId {
  fileName: string;
  fileSize: number;
  md5?: string;
  context?: string;
  nosKey?: string;
}

export interface ResponseNSUploadInfo {
  bucketName: string;
  context: string;
  fileId: number;
  new: boolean;
  nosKey: string;
  token: string;
}

export interface RequestNSUpdateInfo extends RequestNSCommonFolderId {
  /**
   * 要更新的文件名
   */
  itemName?: string;
  /**
   * 要更新的备注
   */
  description?: string;
}

export interface RequestMailAttachmentSaveInfo extends RequestNSCommonFolderId {
  // 文件名称
  fileName: string;
  // 文件大小
  fileSize: number;
  // 邮件 id
  mid: string;

  host?: string;

  part?: string;
}

export interface RequestNSFolderCreateInfo extends RequestNSCommonFolderId {
  /**
   * 文件夹名称
   */
  folderName: string;
}

export interface RequestNSItemMoveInfo extends RequestNSCommonFolderId {
  /**
   * 目标文件夹id
   */
  distFolder: number;
  dirList?: number[];
  fileList?: number[];
}

export interface RequestNSFolderDeleteInfo extends RequestNSCommonFolderId {
  /**
   * 删除类型：文件 ， 文件夹， 子文件夹及文件
   */
  delType: 'file' | 'folder' | 'sub';
}

export type FileUrlMode = 'download' | 'preview';
/**
 类型: FILE 文件， DIRECTORY 文件夹
 */
export type ResourceType = 'FILE' | 'DIRECTORY';

export interface ResourceIdPart {
  resourceId: number;
  resourceType: ResourceType;
  spaceId?: number;
}

/**
 * 账户类型 DEPARTMENT 部门， EMPLOYEE 普通用户, GROUP 群组
 */
export type OperatorType = 'DEPARTMENT' | 'EMPLOYEE' | 'GROUP';

export interface OperatorPart {
  operatorId: string;
  operatorType: OperatorType;
}

/**
 * 用户角色，OWNER(所有者), ROLE_ADMIN(管理员), ROLE_USER_EDIT(可编辑), ROLE_USER_UPLOAD(普通用户上传), ROLE_USER_DOWNLOAD(普通用户下载), ROLE_USER_UPDOWN(上传下载), ROLE_USER_SHOW(普通用户查看)
 */
export type RoleType = 'OWNER' | 'ROLE_ADMIN' | 'ROLE_USER_EDIT' | 'ROLE_USER_UPLOAD' | 'ROLE_USER_DOWNLOAD' | 'ROLE_USER_UPDOWN' | 'ROLE_USER_SHOW';

export type ExternalRoleType = 'ROLE_USER_SHOW' | 'ROLE_USER_DOWNLOAD';

export type ExternalShareStatus = 'VALID' | 'EXPIRE' | 'DISABLE';

export type ExternalShareModifyStatus = 'VALID' | 'DELETE' | 'DISABLE';

export interface RequestAddCollaborator extends ResourceIdPart {
  userRole: RoleType;
  operators: OperatorPart[];
  needIMNotify: boolean;
}

export interface RequestRemoveCollaborator extends ResourceIdPart, OperatorPart {}

export interface RequestUpdateCollaborator extends ResourceIdPart, OperatorPart {
  role: RoleType;
}

export interface RequestListCollaborator extends ResourceIdPart {
  page: number;
  pageSize: number;
}

type Role = {
  roleId: number;
  roleName: RoleType;
};

export interface NSCollaborator {
  operator: OperatorPart;
  role: Role;
}

export interface ResponseNSList {
  page: number;
  pageSize: number;
  totalCount: number;
}
export interface ResponsePageList {
  page: number;
  pageSize: number;
  fileTotleCount: number;
}
export interface ResponseNSCollaborator extends ResponseNSList {
  collaborators: NSCollaborator[];
}

export interface RequestNSListShareItem {
  page: number;
  pageSize: number;
  /** true表示我分享的，false表示分享给我的 */
  forMe: boolean;
}

export type ShareType = 'SPACE_ADMIN' | 'SPACE_USER_SHOW' | 'SPACE_NO_PERMISSION';

export interface RequestUpdateShareType extends ResourceIdPart {
  shareType: ShareType;
}

export interface RequestCheckShareAuth extends ResourceIdPart {
  ref?: string;
}

export interface ResponseCheckShareAuth {
  roleInfos: NSRoleInfo[];
}

export interface ResponseSharedData {
  data: Array<ResponseSharedItem>;
  total: number;
  page: number;
  size: number;
}

export interface ResponseSharedItem {
  bizCode: number;
  createTime: string;
  creatorId: number;
  creatorName: string;
  recordId: number;
  resourceId: number;
  resourceName: string;
  resourceParentId: number;
  resourceSize: number;
  resourceType: ResourceType;
  roles: Role[];
  shareTime: string;
  updateTime: string;
  roleArr?: NSRoleInfo[];
}

export interface ResponseRecycleItem {
  createTime: string;
  createUserId: number;
  createUserName: string;
  deleteTime: string;
  description: string;
  expireTime: string;
  extensionType: string;
  fileId: number;
  id: number;
  md5: string;
  modifyUserId: number;
  modifyUserName: string;
  resourceName: string;
  nosKey: string;
  patentId: number;
  resourceSize: number;
  spaceId: number;
  updateTime: string;
  subResourceCount: number;
}

export interface ResponseFavoriteItem {
  bizCode: string;
  createTime: string;
  creatorId: number;
  creatorName: string;
  extensionType: string;
  fileType: string;
  hasExternalShared: true;
  identity: string;
  recordTime: string;
  resourceId: number;
  resourceName: string;
  resourceParentId: number;
  resourceSize: number;
  resourceType: string;
  roles: [
    {
      roleId: number;
      roleName: string;
    }
  ];
  spaceId: number;
  updateTime: string;
  useRecordId: number;
}

export interface RecoverDir {
  authority: {
    privilegeInfos: [
      {
        privilegeId: number;
        privilegeName: string;
      }
    ];
    roleInfos: [
      {
        roleId: number;
        roleName: string;
      }
    ];
  };
  createTime: string;
  createUserId: number;
  description: string;
  externalShared: boolean;
  hasSub: boolean;
  id: number;
  name: string;
  parentId: number;
  path: string;
  spaceId: number;
  updateTime: string;
}
export interface ResponseAuthReturn {
  roleInfos: Role[];
}

export type RequestGetShareLink = ResourceIdPart;

export interface ExternalShareLinkValidPeriod {
  interval?: {
    endTime: number;
    startTime: number;
  };
  intervalType: 'RELATIVE' | 'ABSOLUTE';
  period?: number; // 当 intervalType 为 RELATIVE 时传此值，全部传-1
}

export type ExternalShareInteractType = 'VIEW' | 'DOWNLOAD';

export interface RequestGetExternalShareLink extends ResourceIdPart {
  receiver: string;
  role: ExternalRoleType;
  validPeriod: ExternalShareLinkValidPeriod;
}

export interface RequestGetExternalShareStatistic {
  period: number;
}

export interface RequestGetExternalShareList {
  createTime: ExternalShareLinkValidPeriod;
  page: number;
  pageSize: number;
  searchKey: string;
  visitTime: ExternalShareLinkValidPeriod;
}

export interface RequestGetExternalShareInteractDetail {
  interactType: ExternalShareInteractType;
  page: number;
  pageSize: number;
  shareIdentity: string;
  visitTime: ExternalShareLinkValidPeriod;
}

export interface RequestModifyNSExternalShareLink {
  shareIdentity: string;
  role: ExternalRoleType;
  interval: ExternalShareLinkValidPeriod;
}

export interface RequestModifyNSExternalShareLinkStatus {
  shareIdentity: string;
  status: ExternalShareModifyStatus;
}

export interface ResponseShareLink {
  availableShareTypes: Role[];
  shareType: Role;
  shareUrl: string;
}

export interface ResponseExternalShareLink {
  shareTime: string;
  expireTime: string;
  fileType: 'file' | 'doc' | 'excel';
  resourceId: number;
  resourceType: 'FILE' | 'DIRECTORY';
  receiver: string;
  resourceName: string;
  role: ExternalRoleType;
  shareIdentity: string;
  status: 'VALID' | 'EXPIRE' | 'DISABLE';
  validPeriod: ExternalShareLinkValidPeriod;
}

export interface ResponseExternalShareStatistic {
  downloadCounts: number; // 下载次数
  readCounts: number; // 阅读次数
  shareUrlCounts: number; // 外部分享有效链接数
}

export interface ResponseExternalShareList {
  shareDetails: ExternalShareDetail[];
  totalDownloadCounts: number; // 合计下载次数
  totalShareUrlCounts: number; // 合计链接总数
  totalVisitCounts: number; // 合计阅读次数
}

export interface ResponseExternalShareInteractDetail {
  details: Array<{
    browser: string;
    os: string;
    device: string; // 设备类型
    time: number; // 时间
  }>;
  totalCount: number; // 总条数
}

export interface ExternalShareDetail {
  downloadCounts: number; // 下载次数
  visitCounts: number; // 访问次数
  expireTime: number; // 链接过期时间
  receiver: string; // 外部分享接收人
  resourceId: number;
  resourceType: 'FILE' | 'DIRECTORY';
  fileType: 'file' | 'doc' | 'excel';
  resourceName: string; // 分享资料名
  role: ExternalRoleType; // 外部链接分享的权限 ROLE_USER_DOWNLOAD(下载), ROLE_USER_SHOW(查看)
  shareIdentity: string; // 外部分享链接标识
  status: ExternalShareStatus; // 链接状态：VALID 有效，EXPIRE 过期， DISABLE 被禁用
  validPeriod: ExternalShareLinkValidPeriod; // 链接有效天数，由创建是设定
}

type ResponseBatchReturnItem = {
  code: number;
  id: number;
  message: string;
  name: string;
  type: string;
};

export interface ResponseBatchReturn {
  code: number;
  data?: {
    failInfo?: ResponseBatchReturnItem[];
  };
  message: string;
}

export interface ResDoDeleteCloudAtt {
  code: number;
  data: boolean;
  message: string;
  success: boolean;
}

export interface ResponsePersonalStorageInit {
  bizCode: string;
  bizId: number;
  spaceId: number;
}

// interface ResponseIsLockEnabledUsingGET {
//   data: boolean;
// }

interface ResponseGetDirPathInfoUsingGETItem {
  dirId: number;
  dirName: string;
}

export interface ResponseGetDirPathInfoUsingGET {
  itemList: ResponseGetDirPathInfoUsingGETItem[];
}

export interface RequestgetDirPathInfoUsingGET {
  dirId: number;
  type: NetStorageType;
}

export interface RequestBatchZipDownload {
  type: NetStorageType;
  parentId: number;
  dirIds?: number[];
  fileIds?: number[];
}

export interface ResponseBatchZipDownload {
  [key: string]: any;
}

export interface RequestDirAndFileSearch {
  key: string;
  page: number;
  pageSize: number;
}

export type NSFileDetail = CommonNSFolderContentPart & {
  bizCode: string; // 个人空间PERSONAL 企业空间QIYE
  identity: string;
  searchDetailType: string; // 文件夹: DIRECTORY 企业空间: FILE
  size: number;
  fileType: NSFileType; // file 普通文件 excel 协同表格 doc 协同文档
  updateTimestamp: number;
};

export interface NSSearchResult {
  detailList: NSFileDetail[];
  page: number;
}
// TODO: 补充 Unitable 类型
export type NSCreateFileType = 'doc' | 'excel' | 'unitable';
export type NSFileType = NSCreateFileType | 'file';

export interface RequestNSFileCreateInfo {
  type: NetStorageType;
  dirId: number;
  fileName: string; //
  fileType?: NSCreateFileType;
}

export interface NSRecentlyUseRecord extends ResponseSharedItem {
  extensionType: string;
  fileType?: NSCreateFileType;
  useRecordId: number;
}

export interface ResponseNSRecently extends ResponseNSList {
  recentlyUseRecords: NSRecentlyUseRecord[];
}
export interface ResponseNSRecycle extends ResponseNSList {
  records: ResponseRecycleItem[];
}
export interface ResponseNSFavorites extends ResponseNSList {
  starRecords: ResponseFavoriteItem[];
}
export interface ResListDir {
  list: NSDirContent[];
  count: number;
}

export interface ResListFile {
  list: NSFileContent[];
  lastPage: boolean;
}

export interface ReqFinishUploadAtt {
  fileId: number;
  nosKey: string;
  fileSize?: number;
}

export type ResFinishUploadAtt = CloudAtt;

export interface ResponseNSRecycle extends ResponsePageList {
  recycleFileInfoList: ResponseRecycleItem[];
}
export interface ResponseNSRecoverDirs {
  count: number;
  list: RecoverDir[];
}
export interface RequestNSRecordDelete {
  useRecordId: number;
}

export interface RequestAnonymousBase {
  shareIdentity: string;
}

export interface RequestAnonymousDirList extends RequestAnonymousBase {
  dirId: number;
  page: number;
  pageSize: number;
}

export interface RequestAnonymousFileInfo extends RequestAnonymousBase {
  fileId: number;
}

export type ResponseAnonymousDirInfo = {
  dirId: number;
  dirName: string;
  size: number;
};

export interface ResponseAnonymousDirList {
  currentDirName: string;
  dirTotalCount: number;
  dirList: ResponseAnonymousDirInfo[];
  fileTotalCount: number;
  fileList: ResponseAnonymousFileInfo[];
  role: RoleType;
  shareTime: string;
  shareUserName: string;
}

export interface ResponseAnonymousFileInfo {
  fileId: number;
  fileName: string;
  role: RoleType;
  fileType: NSFileType;
  identity?: string;
  size: number;
  shareIdentity: string;
  extensionType?: string;
  shareTime?: number;
}

export interface RequestAddAnonymousShare {
  receiver: string;
  resourceId: number;
  resourceType: ResourceType;
  role: RoleType;
  validPeriod: {
    interval?: {
      endTime: number;
      startTime: number;
    };
    intervalType: 'RELATIVE' | 'ABSOLUTE';
    period: number;
  };
}

export interface ResourceIdPair {
  resourceId: string;
  resourceType: ResourceType;
}

export type RequestGetApplyInfo = ResourceIdPair;

export interface ResponseGetApplyInfo {
  // 审批人id
  approveUserId: string;
  // 审批人名称
  approveUserName: string;
  // 文件或者文件夹id
  resourceId: string;
  // 文件夹或文件名称
  resourceName: string;
  resourceType: ResourceType;
  // 申请信息
  applyInfo?: ResponseGetApplyStatus;
}

export enum ClientTypeEnum {
  DESK_TOP = 'DESK_TOP', // 桌面端 和 桌面web端
  ANDROID = 'ANDROID', // 安卓
  IOS = 'IOS', // IOS
  JS = 'JS', // 详情页评论
}
export enum AnnouncementTypeEnum {
  TIPS = 'tips', // 小技巧
  NPS_SCORE = 'nps_score', // nps打分
  NPS_YES_OR_NO = 'nps_yes_or_no', // nps点赞和踩
  NEW_USE = 'new_use', // 新用户通知
  ACTIVITY = 'activity', // 活动通知
  SYSTEM_MAINTAIN = 'system_maintain', // 系统维护
  FEATURE = 'feature', // 新功能通知
}
export enum AnnouncementOperateTypeEnum {
  CLOSE = 'CLOSE', // 关闭
  SEEN = 'SEEN', // 我知道了
  STOP_REMIND = 'STOP_REMIND', // 不再提示
  CLICK_LINK = 'CLICK_LINK', // 点击链接
}
export interface RequestGetNewUserAnnouncement {
  clientType: ClientTypeEnum; // 客户端类型
  clientVersion: string; // 客户端版本号，180，181，190。js类型传js版本号
}
export interface ResponseGetNewUserAnnouncement {
  id: number; // 通知id
  type: AnnouncementTypeEnum; // 通知类型
  content: string; // 通知详情，参照灵犀站的结构。 新用户通知，nps的通知内容本期(170x版本)在前端写死，服务端只给个type
}

export interface RequestOperateAnnouncement {
  announcementId: number;
  operateType: AnnouncementOperateTypeEnum;
}
export type ResponseOperateAnnouncement = boolean;

export interface ResponseAppIsEnable {
  enable: boolean;
}
export interface ParamsGetUserApp {
  appId: string;
}

export interface ParamsGetUniTradeURL {
  type: 'GRID' | 'RECORD' | 'APP';
  resourceLabel: string;
  prefill?: string;
  recordId?: string;
}

export type ResponseGetUniTradeURL = string;

export interface ResponseGetUniCustomerId {
  uni_record_id: string;
  company_id: number;
}
export interface ResponseGetNewUniTradeURL {
  url: string;
  prefillValue: {
    defaultValue: Record<string, string>;
    linkedTableValue: Record<string, Record<string, string>[]>;
  };
  targetFields: Array<{ uniFieldId: string; relatedFieldList?: Array<{ uniFieldId: string }> }>;
}

export interface ResponseFieldMapping {
  tableKey: string;
  fieldMappings: {
    name: string;
    tradeField: string;
    uniFieldId: string;
  }[];
}
export interface ParamsGetFieldMapping {
  table: 'PRODUCT' | 'CUSTOMER';
}

export type ResponseGetFieldMapping = {
  tableKey: string;
  fieldMappings: Array<{
    name: string;
    tradeField: string;
    uniFieldId: string;
  }>;
}[];

export interface UserAppUnitableInfo {
  identity: string;
  appId: string;
  tableId: string;
  views: {
    grid: {
      viewId: string;
      shareId: null;
    };
    form: {
      viewId: string;
      shareId: string;
    };
  };
}
export interface ResponseGetUserApp {
  appId: string;
  appName: string;
  userId: string;
  username: string;
  permission: 'NO_PERMISSION' | 'VIEW' | 'EDIT';
  config: {
    unitables: {
      daily?: UserAppUnitableInfo;
      weekly?: UserAppUnitableInfo;
    };
  };
}
/**
 * 单个模块类型描述
 */
export interface Template {
  docType: string;
  id: number;
  previewImageUrl: string;
  title: string;
}

/**
 * 模板库 模板list数据
 */
export interface ResponseGetTemplateList {
  myTemplates: Template[];
  hotTemplates: Template[];
  recommendTemplates: {
    categoryCode: number;
    categoryName: string;
    templates: Template[];
  }[];
}

/**
 * 创建模板 接口入参
 */
export interface ParamsCreateTemplate {
  identity: string; // identity
  previewImageUrl: string; // 模板预览图片
  title: string; // title
}
/**
 * 创建模板 接口出参
 */
export type ResponseCreateTemplate = boolean;

/**
 * 删除模板 接口如参
 */
export interface ParamsDeleteTemplate {
  templateId: number;
}
/**
 * 删除模板 接口出参
 */
export type ResponseDeleteTemplate = boolean;

/** https://edisk-test2.qiye.163.com/doc.html#/default/personal-file-controller/createByTemplateUsingPOST_1 */

/**
 * 个人空间/企业空间 通过模板创建协同文档 接口入参
 */
export interface ParamsFileCreateByTemplate {
  dirId: number;
  fileName: string;
  fileType: 'doc' | 'excel';
  templateId: number;
}
/**
 * 个人空间/企业空间 通过模版创建协同文档 接口出参
 */

export interface FileInfo {
  authorityDetail?: AuthorityDetail;
  createTime?: string;

  /** @format int64 */
  createUserId?: number;
  createUserName?: string;
  createUserNickName?: string;
  description?: string;
  extensionType?: string;

  /** 类型：file 普通文件, excel 协同表格, doc 协同文档 */
  fileType?: string;

  /** 是否外部分享 */
  hasExternalShared?: boolean;

  /** @format int64 */
  id?: number;
  identity?: string;
  md5?: string;

  /** @format int64 */
  modifyUserId?: number;
  modifyUserName?: string;
  modifyUserNickName?: string;
  name?: string;
  nosKey?: string;

  /** @format int64 */
  parentId?: number;
  parentName?: string;
  path?: string;
  pathName?: string;

  /** @format int64 */
  size?: number;

  /** @format int64 */
  spaceId?: number;
  updateTime?: string;
}
export interface PrivilegeInfo {
  /** @format int64 */
  privilegeId?: number;
  privilegeName?: string;
}

export interface RoleInfo {
  /** @format int64 */
  roleId?: number;
  roleName?: string;
}

export interface AuthorityDetail {
  privilegeInfos?: PrivilegeInfo[];
  roleInfos?: RoleInfo[];
}

export interface RequestGetApplyStatus {
  applyId: string;
}

export interface ResponseGetApplyStatus {
  applyRole: string;
  applyId: string;
  status: string;
}

// ROLE_ADMIN(管理员), ROLE_USER_DOWNLOAD(普通用户下载), ROLE_USER_SHOW(普通用户查看)， ROLE_USER_EDIT(编辑)
export type ApplyRole = 'ROLE_ADMIN' | 'ROLE_USER_DOWNLOAD' | 'ROLE_USER_SHOW' | 'ROLE_USER_EDIT';

export interface RequestApplyAuth extends ResourceIdPair {
  // 附加信息
  applyMsg: string;
  // 用户角色
  applyRole: ApplyRole;
  // 审批人id
  approveUserId: string;
}

export type ResponseApplyAuth = boolean;

// DESK_TOP: 桌面端和桌面端web, JS: 详情页、评论
export type AnnouncementClientType = 'DESK_TOP' | 'ANDROID' | 'IOS' | 'JS';
// LIST 列表页; DOC 在线文档详情页; EXCEL 在线表格详情页; COMMENT 评论; COSPREAD_DETAIL 在线文档和表格的详情页
export type AnnouncementTarget = 'LIST' | 'DOC' | 'EXCEL' | 'COMMENT' | 'COSPREAD_DETAIL';
// tips, 小技巧; nps_score, nps打分; nps_yes_or_no, nps点赞和踩; new_user,新用户通知; activity, 活动通知; system_maintain, 系统维护; feature 新功能通知
export type AnnouncementType = 'tips' | 'nps_score' | 'nps_yes_or_no' | 'new_user' | 'activity' | 'system_maintain' | 'feature';
export interface RequestGetAnnouncement {
  clientType: AnnouncementClientType;
  clientVersion: string;
  target: AnnouncementTarget;
}
export interface ResponseGetAnnouncement {
  id: number;
  type: AnnouncementType;
  content: string;
}

export interface RequestFeedBackNps {
  announcementId: number;
  feedBack: string;
}

export interface ReqGetLinkInfoBatch {
  linkUrls: string[];
}

export interface ReqGetLinkInfo {
  linkUrl: string;
}
export interface ResGetLinkInfoBatch {}

export interface ResGetLinkInfo {}

export type ResponseFeedBackNps = boolean;

/**
 * 空间分享API
 */
export interface NetStorageShareApi extends Api {
  /**
   * 添加协作者
   * http://edisk-test2.qiye.163.com/doc.html#/default/common-share-controller/addCollaboratorsUsingPOST
   * @param req
   */
  addNSCollaborator(req: RequestAddCollaborator): Promise<PopUpMessageInfo>;

  /**
   * 移除协作者
   * http://edisk-test2.qiye.163.com/doc.html#/default/common-share-controller/deleteCollaboratorsUsingPOST
   * @param req
   */
  removeNSCollaborator(req: RequestRemoveCollaborator): Promise<PopUpMessageInfo>;

  /**
   * 列出协作者
   * http://edisk-test2.qiye.163.com/doc.html#/default/common-share-controller/getCollaboratorsUsingGET
   * @param req
   */
  listNSCollaborator(req: RequestListCollaborator): Promise<ResponseNSCollaborator>;

  /**
   * 更新协作者角色
   * http://edisk-test2.qiye.163.com/doc.html#/default/common-share-controller/modifyUserRoleUsingPOST
   * @param req
   */
  updateNSCollaborator(req: RequestUpdateCollaborator): Promise<PopUpMessageInfo>;

  /**
   * 获取分享列表
   * forme 区分
   * http://edisk-test2.qiye.163.com/doc.html#/default/common-share-controller/listShareWithMeUsingGET
   * http://edisk-test2.qiye.163.com/doc.html#/default/common-share-controller/listSharedUsingGET
   *
   */
  listNSShare(req: RequestNSListShareItem): Promise<ResponseSharedData>;

  /**
   * 获取分享链接
   * http://edisk-test2.qiye.163.com/doc.html#/default/common-share-controller/getShareLinkInfoUsingGET
   */
  getNSShareLink(req: RequestGetShareLink): Promise<ResponseShareLink>;

  /**
   * 外部分享链接创建
   */
  getNSExternalShareLink(req: RequestGetExternalShareLink): Promise<ResponseExternalShareLink>;

  /**
   * 外部分享链接互动统计总览
   */
  getNSExternalShareStatistic(req: RequestGetExternalShareStatistic): Promise<ResponseExternalShareStatistic>;

  /**
   * 外部分享链接列表
   */
  getNSExternalShareList(req: Partial<RequestGetExternalShareList>): Promise<ResponseExternalShareList>;

  /**
   * 外部分享链接详情
   */
  getNSExternalShareInteractDetail(req: Partial<RequestGetExternalShareInteractDetail>): Promise<ResponseExternalShareInteractDetail>;

  /**
   * 外部分享链接修改
   * @param req
   */
  modifyNSExternalShareLink(req: RequestModifyNSExternalShareLink): Promise<boolean>;

  /**
   * 外部分享链接状态修改
   * @param req
   */
  modifyNSExternalShareLinkStatus(req: RequestModifyNSExternalShareLinkStatus): Promise<boolean>;

  /**
   * 移除分享资源
   * forme 区分
   * http://edisk-test2.qiye.163.com/doc.html#/default/common-share-controller/deleteSharedUsingPOST
   * http://edisk-test2.qiye.163.com/doc.html#/default/common-share-controller/deleteShareWithMeUsingPOST
   * @param recordId 分享列表中的recordId，唯一标识分享
   * @param forMe true表示删除我分享的，false表示删除分享给我的
   */
  deleteNSShare(recordId: number, forMe: boolean): Promise<PopUpMessageInfo>;

  /**
   * 更新分享类型
   * http://edisk-test2.qiye.163.com/doc.html#/default/common-share-controller/modifyShareTypeUsingPOST
   * @param req
   */
  updateNSShareType(req: RequestUpdateShareType): Promise<PopUpMessageInfo>;

  /**
   * 检查并更新权限
   * http://edisk-test2.qiye.163.com/doc.html#/default/common-share-controller/checkAndUpdateAuthUsingPOST
   * @param req
   */
  checkShareAuth(req: RequestCheckShareAuth): Promise<ResponseCheckShareAuth>;

  /**
   * 查看匿名分享文件夹信息
   * @param req
   */
  checkAnonymousDirList(req: RequestAnonymousDirList): Promise<ResponseAnonymousDirList>;

  /**
   * 查看匿名分享文件详情
   * @param req
   */
  checkAnonymousFileInfo(req: RequestAnonymousFileInfo): Promise<ResponseAnonymousFileInfo>;

  /**
   * 下载匿名分享文件
   */
  downloadAnonymousFileInfo(req: RequestAnonymousFileInfo): Promise<PopUpMessageInfo>;

  /**
   * 预览匿名分享文件
   * @param req
   */
  previewAnonymousFileInfo(req: RequestAnonymousFileInfo): Promise<PopUpMessageInfo>;

  /**
   * 添加到外部分享
   */
  addAnonymousShareContent(req: RequestAddAnonymousShare): Promise<any>;
}

/**
 * 空间文件管理API
 */
export interface NetStorageApi extends Api {
  doNSMoveDir(params: RequestNSDirMove): Promise<any>;

  getDirList(params: RequestNSFolderContent): Promise<any>;

  /**
   * 添加个人网盘文件为普通附件
   * @param params
   */
  doAddAttachmentPersonalAsNormal(ids: number[], _account?: string): Promise<AddDiskFileToAttRes[]>;
  doAddAttachmentPersonalAsCloud(ids: number[], _account?: string): Promise<AddDiskFileToAttRes[]>;
  doAddAttachmentEntAsNormal(ids: number[], _account?: string): Promise<AddDiskFileToAttRes[]>;
  doAddAttachmentEntAsCloud(ids: number[], _account?: string): Promise<AddDiskFileToAttRes[]>;

  saveMailAttachment(fileInfo: RequestMailAttachmentSaveInfo): Promise<any>;

  /**
   * 获取空间容量，type不传获取全部空间容量
   * @param type 需要查询的空间类型
   */
  doGetNSVolume(type?: NetStorageType[]): Promise<ResponseDiskVolume[]>;

  listDir(params: ReqListDir): Promise<ResListDir>;

  listFile(params: ReqListFile): Promise<ResListFile>;

  getCloudAttList(params: ReqGetCloudAttList): Promise<ResGetCloudAttList>;

  renewAttachments(params: ReqRenewAttachments): Promise<boolean>;

  getExpiringFileCount(): Promise<number>;
  /**
   * 空间文件或文件夹重命名
   * @param req
   */
  renameNSFile(req: RequestNSUpdateInfo): Promise<any>;

  /**
   *
   * 直接打包下载
   * @param {RequestBatchZipDownload} req
   * @memberof NetStorageApi
   */
  doBatchZipDownload(req: RequestBatchZipDownload): void | string;

  /**
   * 获取空间指定文件夹下的文件夹和文件列表,
   * @param req 如不传入 dirId，则获取根目录
   */
  doListNSContent(req: RequestNSFolderContent, options?: ApiRequestConfig): Promise<ResponseNSFolderContent>;

  /**
   * 获取文件夹下文件数目及文件夹数目统计数据
   * @param req
   */
  doGetNSFolderSubContentNumber(req: RequestNSCommonFolderId): Promise<ResponseNSFolderNumberContent>;

  /**
   * 获取特定企业空间的授权信息
   * @param dirId 文件夹id，不传则查询根目录权限
   */
  doGetNSEntFolderAuthInfo(dirId?: number): Promise<NSAuthority>;

  /**
   * 获取特定文件夹详情
   * @param req
   */
  doGetNSFolderInfo(req: RequestNSCommonFolderId): Promise<NSDirContent>;

  /**
   * 获取文件信息
   * @param req
   */
  doGetNSFileInfo(req: RequestNSCommonFolderId): Promise<NSFileContent>;

  /**
   * 搜索文件或文件夹
   * @param req
   */
  doNSResourceSearch(req: RequestNSItemSearch): Promise<ResponseNSFolderContent>;

  /**
   * 获取下载URL
   * @param req
   * @param mode 获取的url模式，用于预览或下载
   */
  doGetNSDownloadInfo(req: RequestNSCommonFolderId, mode?: FileUrlMode): Promise<PopUpMessageInfo>;

  /**
   * 获取上传token
   * @param req 上传文件请求，忽略context，nskey等信息
   */
  doGetNSUploadInfo(req: RequestNSUploadInfo, config?: ApiRequestConfig): Promise<ResponseNSUploadInfo>;

  /**
   * 上传完毕通知服务端
   * @param req
   */
  doSetNSUploadFinish(req: RequestNSUploadInfo): Promise<NSFileContent>;

  /**
   * 更新文件或文件夹的
   * 名称或备注或两者
   * @param req 如传入fileId则更新文件数据，否则只传入dirId则更新文件夹信息
   */
  doUpdateNSResource(req: RequestNSUpdateInfo): Promise<PopUpMessageInfo>;

  /**
   * 初始化空间
   * http://edisk-test2.qiye.163.com/doc.html#/default/personal-space-controller/checkSpaceUsingGET
   */
  initPersonalSpace(): Promise<ResponsePersonalStorageInit>;

  /**
   * 面包屑数据
   * http://edisk-test2.qiye.163.com/doc.html#/default/directory-controller/getDirPathInfoUsingGET
   */
  getDirPathInfoUsingGET(req: RequestgetDirPathInfoUsingGET): Promise<ResponseGetDirPathInfoUsingGET>;

  /**
   * 个人空间是否上锁
   * http://edisk-test2.qiye.163.com/doc.html#/default/for-mail-controller/isLockEnabledUsingGET
   */
  isLockEnabledUsingGET(): Promise<boolean>;

  // /**
  //  * 更新文件夹名或备注或两者
  //  * @param req
  //  */
  // doUpdateNSFolder(req: RequestNSUpdateInfo): Promise<PopUpMessageInfo>;

  /**
   * 创建文件夹
   * @param req
   */
  doCreateFolder(req: RequestNSFolderCreateInfo): Promise<NSDirContent>;

  /**
   * 删除文件或文件夹，
   * @param req 如删除文件，则需要额外提供fileId
   */
  doDeleteItem(req: RequestNSFolderDeleteInfo): Promise<PopUpMessageInfo>;

  /**
   * 批量删除文件夹
   * @param req
   */
  doDeleteItems(req: RequestBatchDeleteItem): Promise<ResponseBatchReturn>;

  /**
   * 移动文件或文件夹
   * @param req
   */
  doMoveNSItem(req: RequestNSItemMoveInfo): Promise<PopUpMessageInfo>;

  /**
   * 更新上传信息
   * @param req
   */
  doUpdateUploadNSInfo(req: RequestNSUploadInfo): Promise<PopUpMessageInfo>;

  /**
   * 搜索空间文件及文件夹
   * @param req
   */
  doSearchDirAndFileList(req: RequestDirAndFileSearch): Promise<NSSearchResult>;

  /**
   * 新建协同文档
   * @param req
   */
  doCreateFile(req: RequestNSFileCreateInfo): Promise<NSFileDetail>;

  /**
   * 获取最近使用记录
   * @param req
   */
  listNSRecently(req: RequestList, options?: ApiRequestConfig): Promise<ResponseNSRecently>;

  /**
   * 移除使用记录
   * @param req
   */
  deleteNSRecord(req: RequestNSRecordDelete): Promise<PopUpMessageInfo>;

  /**
   * 使用记录下载
   * @param req
   */
  getNSRecordDownloadUrl(req: RequestNSCommonId): Promise<PopUpMessageInfo>;

  /**
   * 获取回收站列表
   * @param req type: personal| enterprise
   */
  getRecycleList(req: RequestRecycleList): Promise<ResponseNSRecycle>;

  /**
   * 获取恢复目录树列表
   * @param req
   */
  getRecoverDirs(req: RequestRecoverDirParams): Promise<ResponseNSRecoverDirs>;

  /**
   * 网盘删除文件或者文件夹
   */
  deleteDirOrFileList(req: RequestBatchDeleteItem): Promise<PopUpMessageInfo>;

  /**
   * 回收站彻底删除文件（夹）
   * @param req
   */
  deleteRecyRecordCompletely(req: RequestDeleteDirOrFiles): Promise<any>;

  /**
   * 回收站恢复文件
   * @param req
   */
  recoverRecords(req: RequestRecoverRecordParams): Promise<any>;

  /**
   * 获取新用户首次进入云文档时的通知信息
   * @param req
   */
  getNewUserAnnouncement(req?: RequestGetNewUserAnnouncement): Promise<ResponseGetNewUserAnnouncement>;

  /**
   * 提交用户对通知窗口的操作情况
   * @param req
   */
  operateAnnouncement(req: RequestOperateAnnouncement): Promise<ResponseOperateAnnouncement>;
  /*
   * 获取模版库-模版list
   */
  getDocTemplateList(): Promise<ResponseGetTemplateList>;
  /**
   * 单个模板创建
   */
  createTemplate(req: ParamsCreateTemplate): Promise<ResponseCreateTemplate>;
  /**
   * 单个模版删除
   */
  deleteTemplate(req: ParamsDeleteTemplate): Promise<ResponseDeleteTemplate>;
  /**
   * 检查是否能创建 unitable 类型的文件
   */
  checkCreateUnitableAvailable(): Promise<boolean>;
  /**
   * 在个人空间-通过模版创建协同文档
   */
  createPersonalDocByTemplate(req: ParamsFileCreateByTemplate): Promise<FileInfo>;
  /**
   * 在企业空间-通过模板创建协同文档
   */
  createDocByTemplate(req: ParamsFileCreateByTemplate): Promise<FileInfo>;
  /**
   * 是否展示应用中心入口
   */
  appIsEnable(): Promise<ResponseAppIsEnable>;
  /**
   * 获取周报日报应用相关用户权限及前置访问的信息
   */
  getUserApp(req: ParamsGetUserApp): Promise<ResponseGetUserApp>;

  /**
   * 获取外贸iframe url（主应用页面、grid选择器页面、detail详情页面）
   */
  getUniTradeURL(req: ParamsGetUniTradeURL): Promise<ResponseGetUniTradeURL>;
  /** 获取uni 字段 和 外贸 crm 字段 字段映射关系 */
  getFieldMapping(res: ParamsGetFieldMapping): Promise<ResponseGetFieldMapping>;

  /**
   * 获取外贸iframe url（主应用页面、grid选择器页面、detail详情页面）
   */
  getNewUniTradeURL(req: ParamsGetUniTradeURL): Promise<ResponseGetNewUniTradeURL>;
  /**
   * 获取外贸和uni的字段映射
   */
  getUniFieldMapping(req: { table: string }): Promise<ResponseFieldMapping[]>;
  /**
   * 根据外贸老客户id获取对应的uni新客户id
   */
  getUniCustomerId(req: number[]): Promise<ResponseGetUniCustomerId[]>;
  /**
   * 获取权限申请信息
   * @param req
   */
  getApplyInfo(req: RequestGetApplyInfo): Promise<ResponseGetApplyInfo>;

  /**
   * 获取权限申请状态
   * @param req
   */
  getApplyStatus(req: RequestGetApplyStatus): Promise<ResponseGetApplyStatus>;

  /**
   * 申请权限
   * @param req
   */
  applyAuth(req: RequestApplyAuth): Promise<ResponseApplyAuth>;

  /**
   * 预览云附件
   * @param req
   */
  previewCloudAtt(req: ReqPreivewCloudAtt): Promise<any>;

  /**
   * 获取所有权限
   * @param req
   */
  doGetAllAuthorities(req: ReqGetAllAuthorities): Promise<any>;

  /**
   *  添加收藏
   * @param req
   */
  addFavorite(req: RequestFavoriteParams): Promise<any>;

  /**
   * 移除收藏
   * @param req
   */
  removeFavorite(req: RequestFavoriteParams): Promise<any>;

  /**
   * 云文档获取通知
   * @param req
   */
  getAnnouncement(req: RequestGetAnnouncement): Promise<ResponseGetAnnouncement>;

  /**
   * nps反馈
   * @param req
   */
  feedBackNps(req: RequestFeedBackNps): Promise<ResponseFeedBackNps>;

  /**
   * 批量解析url
   * @param req
   */
  getLinkInfoBatch(req: ReqGetLinkInfoBatch): Promise<ResGetLinkInfoBatch>;

  /**
   * 解析url
   * @param req
   */
  getLinkInfo(req: ReqGetLinkInfo): Promise<ResGetLinkInfo>;

  /**
   * 获取收藏列表
   * @param req
   */
  getFavoriteList(req: RequestList): Promise<ResponseNSFavorites>;

  /**
   * 获取往来附件预览链接
   * @param params
   */
  getFilePreviewUrl(url: string): Promise<any>;
}
