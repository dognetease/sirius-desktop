import { config } from 'env_def';
import {
  FileUrlMode,
  NetStorageApi,
  NetStorageType,
  NSAuthority,
  NSDirContent,
  NSFileContent,
  NSFileDetail,
  NSSearchResult,
  RequestBatchDeleteItem,
  RequestBatchZipDownload,
  RequestDirAndFileSearch,
  RequestgetDirPathInfoUsingGET,
  RequestList,
  ReqListDir,
  ReqListFile,
  RequestRecycleList,
  RequestNSCommonFolderId,
  RequestNSCommonId,
  RequestNSDirMove,
  RequestNSFileCreateInfo,
  RequestNSFolderContent,
  RequestNSFolderCreateInfo,
  RequestNSFolderDeleteInfo,
  RequestNSItemMoveInfo,
  RequestNSItemSearch,
  RequestNSRecordDelete,
  RequestNSUpdateInfo,
  RequestNSUploadInfo,
  ResourceIdPart,
  RequestGetApplyInfo,
  RequestGetApplyStatus,
  RequestApplyAuth,
  ResponseBatchReturn,
  ResponseDiskVolume,
  ResponseGetDirPathInfoUsingGET,
  ResponseNSFolderContent,
  ResponseNSFolderNumberContent,
  ResponseNSRecently,
  ResponseNSRecycle,
  ResponseNSUploadInfo,
  ResListDir,
  ResListFile,
  ReqGetCloudAttList,
  ResGetCloudAttList,
  ReqDoDeleteCloudAtt,
  ResFinishUploadAtt,
  ReqFinishUploadAtt,
  ReqDownloadCloudAtt,
  ResDownloadCloudAtt,
  ReqPreivewCloudAtt,
  ReqSaveCloudAttachment,
  ResSaveCloudAttachment,
  RequestRecoverDirParams,
  ResponseNSRecoverDirs,
  NSNormalAttachmentResult,
  NSCloudAttachmentResult,
  RequestDeleteDirOrFiles,
  RequestRecoverRecordParams,
  ResponseGetApplyInfo,
  ResponseGetApplyStatus,
  ResponseApplyAuth,
  ResDoDeleteCloudAtt,
  NSRecentlyUseRecord,
  RequestGetNewUserAnnouncement,
  RequestOperateAnnouncement,
  ResponseGetNewUserAnnouncement,
  ResponseOperateAnnouncement,
  ClientTypeEnum,
  ResponseGetTemplateList,
  ParamsCreateTemplate,
  ResponseCreateTemplate,
  ParamsDeleteTemplate,
  ResponseDeleteTemplate,
  ParamsFileCreateByTemplate,
  FileInfo,
  RequestGetAnnouncement,
  ResponseGetAnnouncement,
  RequestFeedBackNps,
  ResponseFeedBackNps,
  RequestMailAttachmentSaveInfo,
  RequestFavoriteParams,
  ResponseNSFavorites,
  ReqGetAllAuthorities,
  ReqGetLinkInfoBatch,
  ResGetLinkInfoBatch,
  ReqGetLinkInfo,
  ResGetLinkInfo,
  ResponseAppIsEnable,
  ParamsGetUserApp,
  ResponseGetUserApp,
  AddDiskFileToAttRes,
  ParamsGetUniTradeURL,
  ResponseGetUniTradeURL,
  ResponseGetNewUniTradeURL,
  ResponseFieldMapping,
  ResponseGetUniCustomerId,
  ParamsGetFieldMapping,
  ResponseGetFieldMapping,
  ReqRenewAttachments,
} from '../../../api/logical/netStorage';
import { EventApi } from '../../../api/data/event';
import { apis, URLKey } from '../../../config';
import { Api, ApiLifeCycleEvent, PopUpMessageInfo } from '../../../api/_base/api';
import { api } from '../../../api/api';
import { ApiRequestConfig, ApiResponse, DataTransApi, ResponseData } from '../../../api/data/http';
import { SystemApi } from '../../../api/system/system';
import { ErrMsgCodeMap, ErrMsgType, ErrResult } from '../../../api/errMap';
import { StringMap, StringTypedMap } from '../../../api/commonModel';

// 管理者权限
const masterAuthority = { roleId: 100, roleName: '管理' };

class ActionStore {
  uploadInfo: StringTypedMap<ResponseNSUploadInfo>;

  constructor() {
    this.uploadInfo = {};
  }
}

class NetStorageImpl implements NetStorageApi {
  private static defaultErrInfo: PopUpMessageInfo = {
    popupType: 'window',
    title: ErrMsgCodeMap['SERVER.ERR'],
    code: 'SERVER.ERR',
  };

  name: string;

  httpApi: DataTransApi;

  systemApi: SystemApi;

  eventApi: EventApi;

  actions: ActionStore;

  constructor() {
    this.name = apis.netStorageImpl;
    this.httpApi = api.getDataTransApi();
    this.systemApi = api.getSystemApi();
    this.eventApi = api.getEventApi();
    this.actions = new ActionStore();
  }

  getFilePreviewUrl(url: string): Promise<any> {
    return this.httpApi.get(url).then(res => this.unpackRes(res));
  }

  getLinkInfo(req: ReqGetLinkInfo): Promise<ResGetLinkInfo> {
    return this.httpApi.get(this.systemApi.getUrl('getLinkInfo'), req, { contentType: 'form' }).then(res => this.unpackRes(res));
  }

  addFavorite(req: RequestFavoriteParams): Promise<any> {
    const url = this.systemApi.getUrl('addFavorite');
    return this.httpApi.post(url, req, { noErrorMsgEmit: true }).then(res => this.unpackRes(res));
  }

  removeFavorite(req: RequestFavoriteParams): Promise<any> {
    const url = this.systemApi.getUrl('removeFavorite');
    return this.httpApi.post(url, req, { noErrorMsgEmit: true }).then(res => this.unpackRes(res));
  }

  getFavoriteList(req: RequestList): Promise<ResponseNSFavorites> {
    const url = this.systemApi.getUrl('getFavoriteList');
    return this.httpApi.get(url, req).then(res => this.unpackRes(res));
  }

  recoverRecords(req: RequestRecoverRecordParams): Promise<any> {
    let url = '';
    switch (req.type) {
      case 'ent':
        url = this.systemApi.getUrl('recoverRecords');
        break;
      case 'personal':
        url = this.systemApi.getUrl('recoverPersonalRecords');
        break;
      default:
        break;
    }
    return this.httpApi.post(url, req, { noErrorMsgEmit: true });
  }

  deleteDirOrFileList(req: RequestBatchDeleteItem): Promise<PopUpMessageInfo<any>> {
    let url = '';
    switch (req.type) {
      case 'ent':
        url = this.systemApi.getUrl('deleteDirOrFileList');
        break;
      case 'personal':
        url = this.systemApi.getUrl('deletePersonalDirOrFileList');
        break;
      default:
        break;
    }
    return this.httpApi.post(url, req).then(res => {
      const { code, message } = this.unpackRes(res);
      return {
        code,
        title: message,
      } as PopUpMessageInfo;
    });
  }

  deleteRecyRecordCompletely(req: RequestDeleteDirOrFiles): Promise<any> {
    let url = '';
    switch (req.type) {
      case 'ent':
        url = this.systemApi.getUrl('deleteRecyRecordCompletely');
        break;
      case 'personal':
        url = this.systemApi.getUrl('deleteRecyPersonalRecordCompletely');
        break;
      default:
        break;
    }
    return this.httpApi.post(url, req, { contentType: 'json' });
  }

  getRecoverDirs(req: RequestRecoverDirParams): Promise<ResponseNSRecoverDirs> {
    let url = '';
    switch (req.type) {
      case 'personal':
        url = this.systemApi.getUrl('getPersonalRecoverDirs');
        break;
      case 'ent':
        url = this.systemApi.getUrl('getRecoverDirs');
        break;
      default:
        break;
    }
    // delete req.type;
    return this.httpApi.get(url, req).then(res => this.unpackRes(res));
  }

  afterInit?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  afterLoadFinish?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  beforeLogout?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  onFocus?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  onBlur?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  onPathChange?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  init(): string {
    return this.name;
  }

  doCreateFolder(req: RequestNSFolderCreateInfo): Promise<NSDirContent> {
    const url = this.getUrl(req.type, 'createNSFolder');
    return this.httpApi
      .post(url, {
        dirName: req.folderName,
        parentDirId: req.dirId,
      })
      .then(res => {
        const data = this.unpackRes(res);
        return data;
      });
  }

  doDeleteItem(req: RequestNSFolderDeleteInfo): Promise<PopUpMessageInfo> {
    let url;
    let data: ResourceIdPart | { dirId: number } | undefined;
    if (req.delType == 'folder' && req.dirId) {
      url = this.getUrl(req.type, 'delNSResource');
      data = {
        resourceId: req.dirId,
        resourceType: 'DIRECTORY',
      };
    } else if (req.delType == 'sub' && req.dirId) {
      url = this.getUrl(req.type, 'clearNSFolder');
      data = { dirId: req.dirId };
    } else if (req.delType == 'file' && req.fileId) {
      url = this.getUrl(req.type, 'delNSResource');
      data = {
        resourceId: req.fileId,
        resourceType: 'FILE',
      };
    } else {
      return Promise.reject('参数非法');
    }
    return this.httpApi.post(url, data).then(res => {
      const { code, message } = this.unpackRes(res);
      return {
        code,
        title: message,
      } as PopUpMessageInfo;
    });
  }

  doDeleteItems(req: RequestBatchDeleteItem): Promise<ResponseBatchReturn> {
    let url = '';
    // 企业和个人使用回收站删除接口，老接口不再使用
    switch (req.type) {
      case 'ent':
        url = this.systemApi.getUrl('deleteDirOrFileList');
        break;
      case 'personal':
        url = this.systemApi.getUrl('deletePersonalDirOrFileList');
        break;
      default:
        url = this.getUrl(req.type, 'delNSItems');
        break;
    }

    return this.httpApi.post(url, req, { contentType: 'json' }).then(res => {
      const unpackRes = this.unpackRes(res, true);
      return unpackRes;
    });
  }

  doDeleteCloudAtt(req: ReqDoDeleteCloudAtt): Promise<ResDoDeleteCloudAtt> {
    const url = this.systemApi.getUrl('doDeleteCloudAtt');
    // 整理云附件字段
    // function dealAtts(atts) {
    //   return atts.map(item => {
    //     item.name = item.fileName;
    //     delete item.fileName;
    //     return item;
    //   });
    // }
    return this.httpApi.post(url, req, { contentType: 'form' }).then(res => {
      const unpackRes = this.unpackRes(res, true);
      return unpackRes;
    });
  }

  previewCloudAtt(req: ReqPreivewCloudAtt): Promise<any> {
    const url = this.systemApi.getUrl('previewCloudAtt');
    return this.httpApi.get(url, req).then(res => this.unpackRes(res));
  }

  doGetAllAuthorities(req: ReqGetAllAuthorities): Promise<any> {
    const url = this.systemApi.getUrl('getAllAuthorities');
    return this.httpApi.get(url, req).then(res => this.unpackRes(res));
  }

  downloadCloudAtt(req: ReqDownloadCloudAtt): Promise<ResDownloadCloudAtt> {
    const url = this.systemApi.getUrl('downloadCloudAtt');
    return this.httpApi.post(url, req, { contentType: 'form' }).then(res => {
      const unpackRes = this.unpackRes(res, true);
      return unpackRes;
    });
  }

  saveCloudAttachment(req: ReqSaveCloudAttachment): Promise<ResSaveCloudAttachment> {
    const url = this.systemApi.getUrl('saveCloudAttachment');
    return this.httpApi.post(url, req, { contentType: 'form', noErrorMsgEmit: true }).then(res => {
      const unpackRes = this.unpackRes(res, true);
      return unpackRes;
    });
  }

  doGetNSDownloadInfo(req: RequestNSCommonFolderId, mode?: FileUrlMode): Promise<PopUpMessageInfo> {
    const url = this.getUrl(req.type, mode == 'download' ? 'downloadNSFile' : 'previewNSFile');
    return this.httpApi.get(url, req).then(
      res =>
        // const { code, message, data} = this.unpackRes(res);
        ({
          // code,
          // title: message,
          data: res.data,
        } as PopUpMessageInfo)
    );
  }

  doGetNSEntFolderAuthInfo(dirId?: number): Promise<NSAuthority> {
    console.log('[disk] get dir auth info ', dirId);
    const url = this.systemApi.getUrl(dirId === undefined ? 'getNSEntRootAuthInfo' : 'getNSEntAuthInfo');
    return this.httpApi.get(url, { dirId }).then(res => {
      const unpackRes = this.unpackRes(res);
      return unpackRes;
    });
  }

  doGetNSFileInfo(req: RequestNSCommonFolderId): Promise<NSFileContent> {
    const url = this.getUrl(req.type, 'getNSFileDetail');
    return this.httpApi.get(url, req).then(res => {
      const finalRes = this.unpackRes(res);
      finalRes.roleArr = req.type === 'personal' ? [masterAuthority] : finalRes?.authorityDetail?.roleInfos || [];
      return finalRes;
    });
  }

  // 这块必须得拆！！
  doGetNSFolderInfo(req: RequestNSCommonFolderId): Promise<NSDirContent> {
    const url = !req.dirId ? this.getUrl(req.type, 'getRootDir') : this.getUrl(req.type, 'getNSDirDetail');
    if (!req.dirId && typeof req.needVolume === 'undefined') {
      req.needVolume = true;
    }
    return this.httpApi
      .get(url, req, { cachePolicy: 'refresh' })
      .then(res => {
        const unpackRes = { ...this.unpackRes(res, false, true) };
        // 请求根目录信息(根目录返回dirId，一般文件夹返回id)
        if (!req.dirId && unpackRes && unpackRes.dirId && unpackRes.dirName) {
          unpackRes.id = unpackRes.dirId;
          unpackRes.name = unpackRes.dirName;
          if (unpackRes.diskVolume) {
            unpackRes.sizeLimit = unpackRes.diskVolume.sizeLimit;
            unpackRes.spaceId = unpackRes.diskVolume.spaceId;
            unpackRes.totalSize = unpackRes.diskVolume.totalSize;
          }
        }
        unpackRes.roleArr = req.type === 'personal' ? [masterAuthority] : unpackRes?.authorityDetail?.roleInfos || [];
        return unpackRes;
      })
      .catch(err => Promise.reject(err));
  }

  doGetNSFolderSubContentNumber(req: RequestNSCommonFolderId): Promise<ResponseNSFolderNumberContent> {
    const url = this.getUrl(req.type, 'listNSContentNumber');
    return this.httpApi.get(url, req).then(res => this.unpackRes(res));
  }

  doUpdateUploadNSInfo(req: RequestNSUploadInfo): Promise<PopUpMessageInfo> {
    const url = this.getUrl(req.type, 'renewNSUploadToken');
    return this.httpApi.post(url, req).then(res => {
      const { code, message } = this.unpackRes(res);
      return {
        code,
        title: message,
      } as PopUpMessageInfo;
    });
  }

  doGetNSUploadInfo(req: RequestNSUploadInfo, config = { timeout: 60000 * 2 }): Promise<ResponseNSUploadInfo> {
    if (!req || !req.fileName || !req.dirId) return Promise.reject('参数有误，请验证后再试');
    // const key: string = req.dirId + '-' + req.fileName + '-' + req.fileSize;
    // let renew = false;
    const url = this.getUrl(req.type, 'getNSUploadToken');
    // let uploadInfo: ResponseNSUploadInfo | undefined = undefined;
    // if (key in this.actions.uploadInfo && this.actions.uploadInfo[key]) {
    //   uploadInfo = this.actions.uploadInfo[key];
    //   req.nosKey = uploadInfo.nosKey;
    //   req.context = uploadInfo.context;
    //   req.fileId = uploadInfo.fileId;
    //   url = this.getUrl(req.type, 'renewNSUploadToken');
    //   renew = true;
    // }
    return this.httpApi.get(url, req, config).then(res => {
      const unpackRes = this.unpackRes(res);
      return unpackRes;
    });
  }

  doGetNSVolume(type?: NetStorageType[]): Promise<ResponseDiskVolume[]> {
    // console.log(type);
    return Promise.reject(type);
  }

  doBatchZipDownload(req: RequestBatchZipDownload): void | string {
    const url = this.getUrl(req.type, 'batchZipDownload');
    const reqUrl = this.httpApi.buildUrl(url, req);
    if (this.systemApi.isElectron()) {
      return reqUrl;
    }
    this.systemApi.webDownloadLink(reqUrl);
  }

  doListNSContent(req: RequestNSFolderContent, options?: ApiRequestConfig): Promise<ResponseNSFolderContent> {
    const url = this.getUrl(req.type, 'listNSContent');
    return this.httpApi
      .get(url, req, {
        contentType: 'form',
        cachePolicy: 'refresh',
        noEnqueue: !!options?.noEnqueue,
      })
      .then(res => {
        // 将当前的id作为返回标记
        if (res?.data?.data) {
          (res.data.data as any).returnTag = req.dirId;
        }
        const finalRes = this.unpackRes(res);
        if (finalRes?.dirList?.length) {
          finalRes.dirList = finalRes.dirList.map((item: NSDirContent) => {
            // 个人空间 都为管理者 管理者权限为100
            if (req.type === 'personal') return { ...item, roleArr: [masterAuthority] };
            return { ...item, roleArr: item?.authorityDetail?.roleInfos || [] };
          });
        }
        if (finalRes?.fileList?.length) {
          finalRes.fileList = finalRes.fileList.map((item: NSDirContent) => {
            // 个人空间 都为管理者 管理者权限为100
            if (req.type === 'personal') return { ...item, roleArr: [masterAuthority] };
            return { ...item, roleArr: item?.authorityDetail?.roleInfos || [] };
          });
        }
        return finalRes;
      });
  }

  doMoveNSItem(req: RequestNSItemMoveInfo): Promise<PopUpMessageInfo> {
    const url = this.getUrl(req.type, 'moveNSResource');
    const data: { tarDirId: number; dirList: number[]; fileList: number[] } = {
      tarDirId: req.distFolder,
      dirList: [],
      fileList: [],
    };
    if (req.dirList && req.dirList.length > 0) {
      data.dirList = req.dirList;
    } else if (req.dirId) {
      data.dirList.push(req.dirId);
    }
    if (req.fileList && req.fileList.length > 0) {
      data.fileList = req.fileList;
    } else if (req.fileId) {
      data.fileList.push(req.fileId);
    }
    return this.httpApi.post(url, data).then(res => {
      const { code, message } = this.unpackRes(res);
      return {
        code,
        title: message,
      } as PopUpMessageInfo;
    });
  }

  // 移动文件夹@autor:郭超
  async doNSMoveDir(req: RequestNSDirMove): Promise<any> {
    const url = this.getUrl('ent', 'moveNSDir');
    return this.httpApi.post(url, req, {
      noErrorMsgEmit: true,
    });
  }

  /** 添加个人网盘文件为普通附件 */
  async doAddAttachmentPersonalAsNormal(ids: number[], _account?: string): Promise<AddDiskFileToAttRes[]> {
    const url = this.systemApi.getUrl('addAttachmentPersonalAsNormal');
    return this.httpApi
      .get(
        url,
        { id: ids },
        {
          noErrorMsgEmit: true,
          _account,
        }
      )
      .then(res => {
        const data: NSNormalAttachmentResult[] = this.unpackRes(res);
        return data.map(({ fileName, internalUrl, size, id }) => ({
          id,
          fileName,
          fileSize: size,
          // "http://edisk-cdn.office.163.com/disk%2F2021%2F12%2F01%2F549f7655661b44659148db044c763cb1.jpeg?Signature=6wVqhId5nbUaiTbxyudPNVTPVJZmIuTs7nK5HxmzG%2Bw%3D&Expires=1693370701&NOSAccessKeyId=c13174d8c5e24f68ac17df16f7a0aab7&download=%E7%A2%A7%E6%B8%B8%E6%9D%91.jpeg&filename=%E7%A2%A7%E6%B8%B8%E6%9D%91.jpeg"
          fileUrl: internalUrl,
          isCloud: false,
        }));
      });
  }

  /** 添加企业网盘文件为普通附件 */
  async doAddAttachmentEntAsNormal(ids: number[], _account?: string): Promise<AddDiskFileToAttRes[]> {
    const url = this.systemApi.getUrl('addAttachmentEntAsNormal');
    return this.httpApi
      .get(
        url,
        { id: ids },
        {
          noErrorMsgEmit: true,
          _account,
        }
      )
      .then(res => {
        const data: NSNormalAttachmentResult[] = this.unpackRes(res);
        return data.map(({ fileName, internalUrl, size, id }) => ({
          id,
          fileName,
          fileSize: size,
          fileUrl: internalUrl,
          isCloud: false,
        }));
      });
  }

  /** 添加个人网盘文件为云附件 */
  async doAddAttachmentPersonalAsCloud(ids: number[], _account?: string): Promise<AddDiskFileToAttRes[]> {
    const url = this.systemApi.getUrl('addAttachmentPersonalAsCloud');
    return this.httpApi
      .post(
        url,
        { id: ids },
        {
          noErrorMsgEmit: true,
          _account,
        }
      )
      .then(res => {
        const data: NSCloudAttachmentResult[] = this.unpackRes(res);
        return data.map(({ fileName, expireTime, downloadUrl, fileSize, identity }, idx) => ({
          fileName,
          fileSize,
          fileUrl: downloadUrl,
          identity,
          expired: expireTime,
          isCloud: true,
          id: idx,
        }));
      });
  }

  /** 添加企业网盘文件为云附件 */
  async doAddAttachmentEntAsCloud(ids: number[], _account?: string): Promise<AddDiskFileToAttRes[]> {
    const url = this.systemApi.getUrl('addAttachmentEntAsCloud');
    return this.httpApi
      .post(
        url,
        { id: ids },
        {
          noErrorMsgEmit: true,
          _account,
        }
      )
      .then(res => {
        const data: NSCloudAttachmentResult[] = this.unpackRes(res);
        return data.map(({ fileName, expireTime, downloadUrl, fileSize, identity }, idx) => ({
          fileName,
          fileSize,
          fileUrl: downloadUrl,
          identity,
          expired: expireTime,
          isCloud: true,
          id: idx,
        }));
      });
  }

  // 获取下一级文件目录 @autor:郭超
  getDirList(req: RequestNSFolderContent) {
    const url = this.getUrl(req.type, 'getDirList');
    return this.httpApi.get(url, req, { cachePolicy: 'refresh' }).then(res => this.unpackRes(res));
  }

  doNSResourceSearch(req: RequestNSItemSearch): Promise<ResponseNSFolderContent> {
    const url = this.getUrl(req.type, 'searchResource');
    return this.httpApi.get(url, req).then(res => this.unpackRes(res));
  }

  doSetNSUploadFinish(req: RequestNSUploadInfo): Promise<NSFileContent> {
    const url = this.getUrl(req.type, 'uploadNSFinish');
    return this.httpApi.get(url, req).then(res => this.unpackRes(res));
  }

  finishUploadAtt(req: ReqFinishUploadAtt): Promise<ResFinishUploadAtt> {
    const url = this.systemApi.getUrl('finishUploadAtt');
    return this.httpApi.post(url, req, { contentType: 'form' }).then(res => this.unpackRes(res));
  }

  initPersonalSpace() {
    return this.httpApi.get(this.systemApi.getUrl('initPersonalSpace'), {}).then(res => this.unpackRes(res));
  }

  getDirPathInfoUsingGET(req: RequestgetDirPathInfoUsingGET): Promise<ResponseGetDirPathInfoUsingGET> {
    const url = this.getUrl(req.type, 'getDirPathInfoUsingGET');
    return this.httpApi.get(url, req, { cachePolicy: 'refresh' }).then(res => this.unpackRes(res));
  }

  isLockEnabledUsingGET() {
    return this.httpApi.get(this.systemApi.getUrl('isLockEnabledUsingGET'), {}).then(res => this.unpackRes(res));
  }

  /**
   *
   * @returns 邮件附件存个人网盘
   */
  saveMailAttachment(fileInfo: RequestMailAttachmentSaveInfo) {
    const user = this.systemApi.getCurrentUser();
    const userInfo = {
      sid: user?.sessionId,
      uid: user?.id,
    };
    return this.httpApi.post(this.systemApi.getUrl('saveMailAttachment'), {}, { params: { ...fileInfo, ...userInfo }, noErrorMsgEmit: true }).then(res => res?.data);
  }

  doUpdateNSResource(req: RequestNSUpdateInfo): Promise<PopUpMessageInfo> {
    if (!req || (!req.description && !req.itemName) || req.dirId) return Promise.reject('参数不足');
    const renamePromise = req.itemName
      ? this.renameNSFile(req)
      : Promise.resolve({
          code: '0',
          title: '',
        } as PopUpMessageInfo);
    const updateFilePromise = req.description
      ? this.updateNSFileDes(req)
      : Promise.resolve({
          code: '0',
          title: '',
        } as PopUpMessageInfo);
    return Promise.all([renamePromise, updateFilePromise]).then(
      (res: [PopUpMessageInfo, PopUpMessageInfo]) =>
        ({
          code: res[0].code == '0' ? res[1].code : res[0].code,
          title: res[0].title ? res[0].title : res[1].title,
        } as PopUpMessageInfo)
    );
  }

  renameNSFile(req: RequestNSUpdateInfo): Promise<PopUpMessageInfo> {
    const { type, dirId, fileId, itemName } = req;
    const url = this.getUrl(req.type, req.fileId ? 'renameNSFile' : 'renameNSFolder');
    const data: StringMap = {};

    data.type = type;
    data.dirId = String(dirId);
    if (req.fileId) {
      data.fileName = itemName || '_';
      data.fileId = String(fileId);
    } else {
      data.newDirName = itemName || '_';
    }
    // if (type === 'favorites') {
    const _req = this.httpApi.post(url, data);
    // } else {
    //   _req = this.httpApi.put(url, data);
    // }

    return _req.then(res => {
      const { code, message } = this.unpackRes(res);
      return {
        code,
        title: message,
      } as PopUpMessageInfo;
    });
  }

  updateNSFileDes(req: RequestNSUpdateInfo): Promise<PopUpMessageInfo> {
    const url = this.getUrl(req.type, req.fileId ? 'updateNSFileDes' : 'updateNSFolderDes');
    const data: StringMap = {};
    if (req.fileId) {
      data.description = req.itemName || '_';
      data.fileId = String(req.fileId);
      data.dirId = String(req.dirId);
    } else {
      data.dirId = String(req.dirId);
      data.description = req.itemName || '_';
    }
    return this.httpApi.post(url, data).then(res => {
      const { code, message } = this.unpackRes(res);
      return {
        code,
        title: message,
      } as PopUpMessageInfo;
    });
  }

  doSearchDirAndFileList(req: RequestDirAndFileSearch): Promise<NSSearchResult> {
    return this.httpApi.get(this.systemApi.getUrl('searchDirAndFileList'), req).then(res => this.unpackRes(res));
  }

  doCreateFile(req: RequestNSFileCreateInfo): Promise<NSFileDetail> {
    const url = this.getUrl(req.type, 'createFile');
    return this.httpApi.post(url, req).then(res => {
      const unpackRes = this.unpackRes(res);
      return unpackRes;
    });
  }

  listNSRecently(req: RequestList, options?: ApiRequestConfig): Promise<ResponseNSRecently> {
    return this.httpApi
      .get(this.systemApi.getUrl('getNSRecentlyList'), req, {
        cachePolicy: 'refresh',
        noEnqueue: !!options?.noEnqueue,
      })
      .then(res => {
        const finalRes = this.unpackRes(res);
        if (!finalRes.recentlyUseRecords) return finalRes;
        finalRes.recentlyUseRecords = finalRes.recentlyUseRecords.map((item: NSRecentlyUseRecord) => ({ ...item, roleArr: item?.roles || [] }));
        return finalRes;
      });
  }

  getPersonalRecycleList(req: RequestList): Promise<ResponseNSRecycle> {
    return this.httpApi.get(this.systemApi.getUrl('getPersonalRecycleList'), req).then(res => this.unpackRes(res));
  }

  getRecycleList(req: RequestRecycleList): Promise<ResponseNSRecycle> {
    let url = '';
    switch (req.type) {
      case 'personal':
        url = this.systemApi.getUrl('getPersonalRecycleList');
        break;
      case 'ent':
        url = this.systemApi.getUrl('getRecycleList');
        break;
    }
    // delete req.type;
    return this.httpApi.get(url, req).then(res => this.unpackRes(res));
  }

  listDir(req: ReqListDir): Promise<ResListDir> {
    const url = this.getUrl(req.type, 'listDir');
    return this.httpApi.get(url, req, { contentType: 'form' }).then(res => {
      const finalRes = this.unpackRes(res);
      if (!finalRes?.list?.length) return finalRes;
      finalRes.list = finalRes.list.map((item: NSDirContent) => {
        // 个人空间 都为管理者 管理者权限为100
        if (req.type === 'personal') return { ...item, roleArr: [masterAuthority] };
        return { ...item, roleArr: item?.authorityDetail?.roleInfos || [] };
      });
      return finalRes;
    });
  }

  listFile(req: ReqListFile): Promise<ResListFile> {
    const url = this.getUrl(req.type, 'listFile');
    return this.httpApi.get(url, req, { contentType: 'form' }).then(res => {
      const finalRes = this.unpackRes(res);
      if (!finalRes?.list?.length) return finalRes;
      finalRes.list = finalRes.list.map((item: NSFileContent) => {
        // 个人空间 都为管理者 管理者权限为100
        if (req.type === 'personal') return { ...item, roleArr: [masterAuthority] };
        return { ...item, roleArr: item?.authorityDetail?.roleInfos || [] };
      });
      return finalRes;
    });
  }

  async getCloudAttList(req: ReqGetCloudAttList): Promise<ResGetCloudAttList> {
    return this.httpApi.get(this.systemApi.getUrl('getCloudAttList'), req).then(res => this.unpackRes(res));
  }

  async renewAttachments(req: ReqRenewAttachments): Promise<boolean> {
    return this.httpApi.post(this.systemApi.getUrl('renewAttachments'), req, { contentType: 'json' }).then(res => this.unpackRes(res));
  }

  async getExpiringFileCount(): Promise<number> {
    return this.httpApi.get(this.systemApi.getUrl('getExpiringFileCount')).then(res => this.unpackRes(res));
  }

  deleteNSRecord(req: RequestNSRecordDelete): Promise<PopUpMessageInfo> {
    return this.httpApi.post(this.systemApi.getUrl('deleteUseRecord'), req).then(res => this.unpackRes(res));
  }

  getNSRecordDownloadUrl(req: RequestNSCommonId): Promise<PopUpMessageInfo> {
    return this.httpApi.get(this.systemApi.getUrl('getUseRecordDownloadUrl'), req).then(res => this.unpackRes(res));
  }

  // 获取新用户首次进入云文档时的通知信息
  getNewUserAnnouncement(req?: RequestGetNewUserAnnouncement): Promise<ResponseGetNewUserAnnouncement> {
    const data = req || {
      clientType: ClientTypeEnum.DESK_TOP,
      clientVersion: config('version'),
    };
    return this.httpApi.get(this.systemApi.getUrl('getNewUserAnnouncement'), data).then(res => this.unpackRes(res));
  }

  // 提交用户对通知窗口的操作情况
  operateAnnouncement(req: RequestOperateAnnouncement): Promise<ResponseOperateAnnouncement> {
    return this.httpApi.post(this.systemApi.getUrl('operateAnnouncement'), req, { contentType: 'json' }).then(res => this.unpackRes(res));
  }

  /**
   * 获取模板库 - 模板lis数据
   * @returns
   */
  getDocTemplateList(): Promise<ResponseGetTemplateList> {
    return this.httpApi.get(this.systemApi.getUrl('getDocTemplateList')).then(res => this.unpackRes(res));
  }

  /**
   * 单个模板创建
   */
  createTemplate(req: ParamsCreateTemplate): Promise<ResponseCreateTemplate> {
    return this.httpApi.post(this.systemApi.getUrl('createTemplate'), req).then(res => this.unpackRes(res));
  }

  /**
   * 单个模版删除
   */
  deleteTemplate(req: ParamsDeleteTemplate): Promise<ResponseDeleteTemplate> {
    return this.httpApi.delete(this.systemApi.getUrl('deleteTemplate'), req).then(res => this.unpackRes(res));
  }

  /**
   * 检查是否能创建 unitable 类型的文件
   */
  checkCreateUnitableAvailable(): Promise<boolean> {
    return this.httpApi
      .get(this.systemApi.getUrl('queryCreateType'))
      .then(res => this.unpackRes(res))
      .then(res => res && res.unitable);
  }

  /** 是否展示应用中心入口 */
  appIsEnable(): Promise<ResponseAppIsEnable> {
    return this.httpApi.get(this.systemApi.getUrl('appIsEnable')).then(res => this.unpackRes(res));
  }

  /** 获取周报日报应用相关用户权限及前置访问的信息 */
  getUserApp(req: ParamsGetUserApp): Promise<ResponseGetUserApp> {
    return this.httpApi.get(this.systemApi.getUrl('getUserApp'), req).then(res => this.unpackRes(res));
  }

  /**
   * 获取外贸iframe url（主应用页面、grid选择器页面、detail详情页面）
   */
  getUniTradeURL(req: ParamsGetUniTradeURL): Promise<ResponseGetUniTradeURL> {
    return this.httpApi.post(this.systemApi.getUrl('getUniTradeURL'), req).then(res => this.unpackRes(res));
  }

  getNewUniTradeURL(req: ParamsGetUniTradeURL): Promise<ResponseGetNewUniTradeURL> {
    return this.httpApi.post(this.systemApi.getUrl('getNewUniTradeURL'), req).then(res => this.unpackRes(res));
  }

  getUniCustomerId(req: number[]): Promise<ResponseGetUniCustomerId[]> {
    return this.httpApi.post(this.systemApi.getUrl('getUniCustomerId'), req, { contentType: 'json' }).then(res => this.unpackRes(res));
  }

  getUniFieldMapping(req: { table: string }): Promise<ResponseFieldMapping[]> {
    return this.httpApi.get(this.systemApi.getUrl('getUniFieldMapping'), req).then(res => this.unpackRes(res));
  }

  /**
   * 获取uni 数据表字段id 和 外贸侧 字段id 的映射关系
   */
  getFieldMapping(req: ParamsGetFieldMapping): Promise<ResponseGetFieldMapping> {
    return this.httpApi.get(this.systemApi.getUrl('getFieldMapping'), req).then(res => this.unpackRes(res));
  }

  /**
   * 在个人空间-通过模版创建协同文档
   */
  createPersonalDocByTemplate(req: ParamsFileCreateByTemplate): Promise<FileInfo> {
    return this.httpApi.post(this.systemApi.getUrl('createPersonalDocByTemplate'), req).then(res => this.unpackRes(res));
  }

  /**
   * 在企业空间-通过模板创建协同文档
   */
  createDocByTemplate(req: ParamsFileCreateByTemplate): Promise<FileInfo> {
    return this.httpApi.post(this.systemApi.getUrl('createDocByTemplate'), req).then(res => this.unpackRes(res));
  }

  // 获取文档的权限申请信息
  getApplyInfo(req: RequestGetApplyInfo): Promise<ResponseGetApplyInfo> {
    return this.httpApi.get(this.systemApi.getUrl('getApplyInfo'), req).then(res => this.unpackRes(res));
  }

  // 获取文档的权限申请状态
  getApplyStatus(req: RequestGetApplyStatus): Promise<ResponseGetApplyStatus> {
    return this.httpApi.get(this.systemApi.getUrl('getApplyStatus'), req).then(res => this.unpackRes(res));
  }

  // 获取文档的权限申请状态
  applyAuth(req: RequestApplyAuth): Promise<ResponseApplyAuth> {
    return this.httpApi.post(this.systemApi.getUrl('applyAuth'), req, { contentType: 'json' }).then(res => this.unpackRes(res));
  }

  // 云文档获取通知
  getAnnouncement(req: RequestGetAnnouncement): Promise<ResponseGetAnnouncement> {
    return this.httpApi.get(this.systemApi.getUrl('getAnnouncement'), req).then(res => this.unpackRes(res));
  }

  // nps反馈
  feedBackNps(req: RequestFeedBackNps): Promise<ResponseFeedBackNps> {
    return this.httpApi.post(this.systemApi.getUrl('feedBackNps'), req, { contentType: 'json' }).then(res => this.unpackRes(res));
  }

  // 批量解析url
  getLinkInfoBatch(req: ReqGetLinkInfoBatch): Promise<ResGetLinkInfoBatch> {
    return this.httpApi.post(this.systemApi.getUrl('getLinkInfoBatch'), req, { contentType: 'form' }).then(res => this.unpackRes(res));
  }

  // doUpdateNSFolder(req: RequestNSUpdateInfo): Promise<PopUpMessageInfo> {
  //   console.log(req);
  //   return Promise.reject(undefined);
  // }
  //
  // renameFolder(req: RequestNSUpdateInfo) {
  //   return Promise.resolve({ success: undefined });
  // }
  //
  // updateFolderDes(req: RequestNSUpdateInfo) {
  //   return Promise.resolve({ success: undefined });
  // }

  private getUrl(type: NetStorageType, key: URLKey) {
    const typeKeyMap = {
      ent: key,
      personalShare: key + 'PS',
      personal: key + 'P',
      cloudAtt: key + 'CA',
      favorites: key + 'FA',
    } as Record<NetStorageType, URLKey>;
    const urlKey = typeKeyMap[type] || key;
    return this.systemApi.getUrl(urlKey as URLKey);
  }

  private unpackRes(res: ApiResponse, returnWhole?: boolean, returnErrorAsIs?: boolean) {
    console.log('[disk] from network:', res);
    // 完整返回 包括success code 等
    if (returnWhole) {
      return res.data;
    }
    if (res && res.data && res.data.success) {
      return res.data.data;
    }
    if (res && res.data) {
      if (returnErrorAsIs) return res.data;
      return this.getNSErrMsg(res.data);
    }
    return Promise.reject(NetStorageImpl.defaultErrInfo);
  }

  public commonCatch(reason: any): PopUpMessageInfo {
    console.warn('[disk] error :', reason);
    if (reason instanceof Error) return this.getErrMsg(reason.message);
    if (typeof reason === 'string') return this.getErrMsg(reason);

    return NetStorageImpl.defaultErrInfo;
  }

  private getNSErrMsg(err: ResponseData): PopUpMessageInfo {
    if (err && err.code) {
      return this.getErrMsg(err.code);
    }
    return {
      code: err.code === undefined ? '' : err.code + '',
      title: err.message || ErrMsgCodeMap.UNKNOWN_ERR,
    };
  }

  private getErrMsg(errMsg: string | number | undefined, defaultMsg?: string): PopUpMessageInfo {
    if (errMsg) {
      const messageInfo = ErrResult[errMsg];
      if (messageInfo) {
        if ((messageInfo.popupType && messageInfo.popupType == 'window') || messageInfo.popupType == 'toast') {
          this.eventApi.sendSysEvent({
            eventName: 'error',
            eventLevel: 'error',
            eventStrData: '',
            eventData: messageInfo,
            eventSeq: 0,
          });
        }
        return messageInfo;
      }
      if (errMsg in ErrMsgCodeMap) {
        return {
          title: ErrMsgCodeMap[errMsg as ErrMsgType] as string,
          code: errMsg + '',
        };
      }
    }
    return {
      title: (errMsg ? errMsg + '' : undefined) || defaultMsg || ErrMsgCodeMap.UNKNOWN_ERR,
      code: 'UNKNOWN_ERR',
    };
  }

  afterLogin() {
    this.actions = new ActionStore();
    return this.name;
  }
}

const netStorageImpl: Api = new NetStorageImpl();
api.registerLogicalApi(netStorageImpl);
export default netStorageImpl;
