import { ResponseData, ApiResponse } from '@/api/data/http';
import { urlStore, apis } from '@/config';
import { mailBoxOfVirus } from './mail_action_store_model';
import type { MailBoxConf } from './mail_action_store_model';
import { api } from '@/api/api';
import { MailAbstractHandler } from './mail_abs_handler';
import { MailTag, createUserFolderParams } from '@/api/logical/mail';

import { CORP_FOLDER_ERRCODE_MAP, CORP_DEFAULT_ERROR_MSG, NETEASE_DOMAIN_ARR, FEATURE_NAME_TO_NETEASE_WEB_URL } from './corp/const';

import { HtmlApi } from '@/api/data/html';
import { StringMap } from '@/api/commonModel';

const systemApi = api.getSystemApi();

// corpMail的接口调用方式和HMail不同，需要把方法映射到不同的url
export class MailFuncToCorpMailUrlMap {
  listFolder = urlStore.get('corpMailGetAllFolders'); // 获取文件夹

  listItem = urlStore.get('corpMailListMessages'); // 获取邮件列表

  listContent = urlStore.get('corpMailReadMessage'); // 获取邮件详情

  getContentByIds = urlStore.get('corpMailGetMessageIfnos'); // 获取邮件信息

  postMail = urlStore.get('corpMailComponse'); // 写信

  cancelDeliver = urlStore.get('corpMailCancel'); // 取消写信

  immediateDeliver = urlStore.get('corpMailImmediateDeliver'); // 立即发送

  checkPostMail = urlStore.get('corpMailListDeliverHistory'); // 查询发信状态

  withdrawSending = urlStore.get('corpMailRecallMessage'); // 撤回邮件

  getTaglist = urlStore.get('corpMailListTags'); // 获取tagList

  getAttr = urlStore.get('corpMailGetUserAttrs'); // 获取用户属性

  updateMail = urlStore.get('corpMailUpdateMessageInfos'); // 设置邮件属性

  deleteMail = urlStore.get('corpMailDeleteMail'); // 删除邮件

  searchMail = urlStore.get('corpMailSearchMessages'); // 搜索邮件

  replyMail = urlStore.get('corpMailReplyMail'); // 回复邮件

  forwardMail = urlStore.get('corpMailForwardMessages'); // 转发邮件

  uploadPrepare = urlStore.get('corpMailUploadPrepare'); // 上传准备

  upload = urlStore.get('corpMailUpload'); // 上传文件

  setAttr = urlStore.get('corpMailSetUserAttrs'); // 设置属性

  markAllMail = urlStore.get('corpMailMarkSeen'); // 标记已读

  emptyFolder = urlStore.get('corpMailEmptyFolder'); // 清空文件夹

  editDraft = urlStore.get('corpMailRestoreDraft'); // 编辑草稿

  editMail = urlStore.get('corpMailEditMessage'); // 编辑未发送成功邮件

  getSignature = urlStore.get('corpMailGetSign'); // 获取用户签名

  createSignature = urlStore.get('corpMailCreateSign'); // 创建用户签名

  deleteSignature = urlStore.get('corpMailDeleteSign'); // 删除用户签名

  updateSignature = urlStore.get('corpMailUpdateSign'); // 更新签名

  aliasAccount = urlStore.get('corpMailGetAlias'); // 别名列表

  manageTag = urlStore.get('corpMailManageTags'); //

  updateMessageTags = urlStore.get('corpMailUpdateMessageTags'); //

  updateThreadTags = urlStore.get('corpMailUpdateMessageTags'); //

  threadMail = urlStore.get('corpMailListThreads'); // 会话模式列表

  threadMailDetail = urlStore.get('corpMailGetThreadMessageInfos'); // 聚合模式邮件详情

  getMailPart = urlStore.get('corpMailGetMessageData'); // 获取邮件中嵌套部分数据，用于展示，图片附件预览也是用此接口，预览

  downloadTmpAttachment = urlStore.get('corpMailGetTmpAttachment'); // 写信页附件

  cancelCompose = urlStore.get('corpMailCancelCompose'); // 取消写信

  createUserFolder = urlStore.get('corpCreateUserFolder'); // 新建文件夹

  updateUserFolder = urlStore.get('corpUpdateUserFolder'); // 更新文件夹

  deleteUserFolder = urlStore.get('corpDeleteUserFolder'); // 删除文件夹

  getFolderStat = urlStore.get('corpStatsFolder'); // 获取文件夹统计信息

  threadMailList = urlStore.get('corpMailListThreads'); // 聚合模式列表

  threadMailInfoDetail = urlStore.get('corpMailGetMessageIfnos'); // 聚合模式邮件详情
}

export const mailFuncToCorpMailUrlMap = new MailFuncToCorpMailUrlMap();

/**
 * 通过funcName和mailMode来获取url
 * @param key
 * @param isCorpMailMode
 * @returns
 */
export function getUrlByMailFuncName(funcName: string): string {
  const result = mailFuncToCorpMailUrlMap[funcName as keyof MailFuncToCorpMailUrlMap];
  return result || '';
}

/**
 * 通过URL来获得pathname
 * @param url
 * @returns
 */
function getPathNameOfUrl(url: string): string {
  const urlObj = new URL(url);
  return urlObj.pathname;
}

export interface CorpMailFolerItem {
  id: number;
  name: string;
  flags: {
    system: boolean;
    [k: string]: boolean;
  };
  children?: Array<CorpMailFolerItem>;
  stats?: { [k: string]: number | string };
}

export interface HMailFolderItem extends CorpMailFolerItem {
  stats: { [k: string]: number | string };
}

export type CorpMailListItem = {
  id: string;
  fid: number;
  size: number;
  form: string;
  to: string;
  subject: string;
  sentDate: number;
  priority: number;
  backgroundColor: number;
  antiVirusStatus: string;
  label0: number;
  flags: { [k: string]: boolean };
  summary: string;
  attachments?: Array<Record<string, any>>;
};

const corpMailFolderIdToMailBoxConfMap: { [k: number]: MailBoxConf } = {
  6: mailBoxOfVirus,
};

/**
 *
 * @param item
 */
function getHMailFolderItemByCorpMailFolder(item: CorpMailFolerItem, parent = 0): HMailFolderItem {
  const newItem = Object.assign(item, { parent });
  if (!newItem.stats) {
    newItem.stats = {};
  }

  // 个别系统文件夹id在两个邮件系统不同，需要映射到不同的id
  const mailConf = corpMailFolderIdToMailBoxConfMap[newItem.id];
  if (mailConf) {
    newItem.id = mailConf.id;
  }
  return newItem as HMailFolderItem;
}

// 遍历嵌套的邮箱文件夹来flat数组
function traversalNestedFolder(folderItem: CorpMailFolerItem, result: Array<CorpMailFolerItem>): void {
  const childrenOfFolderItem = folderItem.children || [];

  childrenOfFolderItem.forEach(childItem => {
    const newItem = getHMailFolderItemByCorpMailFolder(childItem, folderItem.id);
    result.push(newItem);
    traversalNestedFolder(newItem, result);
  });
}

/**
 *
 * @param res
 * @returns
 */
function getCorpResponseDataFromResponse(res: ResponseData): any {
  return res?.data?.data?.result;
}

/**
 * 转换邮箱文件夹
 * @param res
 * @returns
 */
function transformFolders(res: ResponseData): ResponseData {
  const resData = res?.data;
  const mailFolderArr = (getCorpResponseDataFromResponse(res) || []) as Array<CorpMailFolerItem>;
  const nestedFolders: Array<CorpMailFolerItem> = [];
  const hMailFolderArr = mailFolderArr.map((item: CorpMailFolerItem) => {
    const newItem = getHMailFolderItemByCorpMailFolder(item);
    // 有children需要打平文件夹
    if (newItem.children && newItem.children.length) {
      traversalNestedFolder(newItem, nestedFolders);
    }
    return newItem;
  });

  resData.var = [...hMailFolderArr, ...nestedFolders];

  return res;
}

function transformMailList(res: ResponseData): ResponseData {
  const resData = res?.data;
  const mailList = (getCorpResponseDataFromResponse(res) || []) as Array<CorpMailListItem>;
  const hMailList = mailList.map(mailItem => {
    const newItem = {
      attachments: [],
      recallable: false,
      encpwd: null,
      modifiedDate: null,
      receivedDate: null,
      ...mailItem,
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    newItem.modifiedDate = newItem.modifiedDate || mailItem.sentDate;
    return newItem;
  });
  resData.var = hMailList;
  resData.total = resData?.data?.total || mailList.length;
  return res;
}

export type CorpMailAttachment = {
  id: number;
  contentType: string;
  filename: string;
  estimateSize: number;
  encoding: string;
  contentOffset: number;
  contentLength: number;
};

export type CorpMailContent = {
  subject: string;
  sentDate: number;
  form: Array<string>;
  to: Array<string>;
  priority: number;
  flags: { [t: string]: boolean };
  requestReadReceipt: boolean;
  isManualDisposition: boolean;
  headers: {
    Sender: Array<string>;
  };
  html: {
    id: number;
    contentType: string;
    content: string;
    estimateSize: number;
    contentOffset: number;
    contentLength: number;
  };
  attachments: Array<CorpMailAttachment>;
};

function transformMailItem(res: ResponseData): ResponseData {
  const resData = res?.data;
  const corpMailContent = getCorpResponseDataFromResponse(res) as CorpMailContent;

  const hmalilFormatmailContent = { ...corpMailContent };
  if (hmalilFormatmailContent?.html?.content.length) {
    hmalilFormatmailContent.html.content = hmalilFormatmailContent.html.content.replace(/_src=/gi, 'src=');
    hmalilFormatmailContent.html.content = hmalilFormatmailContent.html.content.replace(/_href=/gi, 'href=');
  }
  resData.var = hmalilFormatmailContent;
  return res;
}

export interface corpSignItem {
  content: string;
  id: number;
  isDefault: boolean;
  name: string;
  isHtml: boolean;
  appProperties: null | { [k: string]: boolean };
}

/**
 * 转换签名
 * @param res
 * @returns
 */
function transformSignatures(res: ResponseData): ResponseData {
  const resData = res?.data;
  const currentUser = systemApi.getCurrentUser();
  const signatureList: Array<corpSignItem> = getCorpResponseDataFromResponse(res) || [];
  resData.data = signatureList.map(item => {
    const newItem = {
      signId: item.id,
      signInfoDTO: {
        signId: item.id,
        profilePhoto: '',
        name: currentUser?.nickName,
        position: '',
        companyName: currentUser?.company,
        emailAddr: currentUser?.id,
        phoneNo: '',
        addr: '',
        isSetDefault: item.isDefault,
        signTemplateUrl: '',
        signTemplateId: '',
        showAppVipTag: false,
        signName: '',
        userAddItem: null,
      },
      isFromApp: true,
      divContent: item.content,
      htmlContent: '',
    };
    return newItem;
  });
  return res;
}

function transformForwardMail(res: ResponseData): ResponseData {
  const resData = res?.data;
  const composeInfo = getCorpResponseDataFromResponse(res)?.compose;
  resData.data.var = composeInfo;
  return res;
}

function transformMailInfos(res: ResponseData): ResponseData {
  const resData = res?.data;
  const corpMailInfoArr = getCorpResponseDataFromResponse(res) || [];
  const newMailInfos = corpMailInfoArr;
  resData.var = newMailInfos;
  delete resData.data;
  return res;
}

function transformTagsManage(res: ResponseData): ResponseData {
  return res;
}

function transformTagList(res: ResponseData): ResponseData {
  const resData = res?.data;
  const tagList = getCorpResponseDataFromResponse(res) || [];
  tagList.forEach((tagItem: MailTag) => {
    const tagId = tagItem[0];
    const tagAttrs = tagItem[1];

    if (tagAttrs) {
      tagAttrs.tagId = tagId;
      tagAttrs.color = Number.parseInt(tagAttrs.color?.toString(), 10);
      if (tagAttrs.name) {
        tagItem[0] = tagAttrs.name;
      }
      if (tagAttrs.alias) {
        tagItem[0] = tagAttrs.alias;
      }
    }
  });
  resData.var = tagList;
  delete resData.data;
  return res;
}

function transformMailCompose(res: ResponseData): ResponseData {
  const resData = res?.data;
  const result = getCorpResponseDataFromResponse(res);
  delete resData.result;
  resData.var = result;
  return res;
}

function transformPreUpload(res: ResponseData): ResponseData {
  const resData = res?.data;
  const corpData = getCorpResponseDataFromResponse(res);
  const newData = { ...corpData };
  delete resData.result;
  resData.var = newData;
  return res;
}

function transformResultToVar(res: ResponseData): ResponseData {
  const resData = res?.data;
  const result = getCorpResponseDataFromResponse(res);
  resData.var = result;
  return res;
}

function transformThreadList(res: ResponseData): void {
  transformResultToVar(res);
  const list = res?.data?.var || [];
  list.forEach((item: any) => {
    const fromStr = item?.from || '';
    // 聚合模式下的corpMail会带有 - 或 + 前缀
    item!.from = fromStr.replace(/^"(-|\+)/, '"');
    item.threadMessageCount = item.threadMessageIds?.length || 1;
    item.convFids = [item.fid];
    item.receivedDate = item.sentDate;
    item.modifiedDate = item.sentDate;
    item.convId = 'CORP_MAIL_CONV_ID';
    item.isThread = true;
  });
  res.data.total = res?.data?.data.total;
  res.data.building = false;
}

function transformRecallResult(res: ResponseData): void {
  transformResultToVar(res);
  const recallResult = res.data.var;
  res.data.var = { recallResult };
}

function transformSearchResult(res: ResponseData): void {
  transformResultToVar(res);
  res.data.groupings = res?.data?.data?.groupings;
}

function getCorpFolderErrMsgByCode(code: string): string {
  return CORP_FOLDER_ERRCODE_MAP[code] || CORP_DEFAULT_ERROR_MSG;
}

function transformCorpRelatedMailList(res: ResponseData): void {
  const result = getCorpResponseDataFromResponse(res) || {};
  const resData = res.data.data;
  resData.emailInfoList = result.emailInfoList || [];
}

/**
 * 将response做原地转换，corpMail的响应转为hMail的模式
 * @param res
 */
export function corpMailTransformResponse(res: ApiResponse): ApiResponse {
  const url = res.config.url as string;
  const urlPathName = getPathNameOfUrl(url);
  // 只处理corp-mailpath下的
  if (!urlPathName.includes('corp-mail/')) {
    return res;
  }
  const pathNameWithoutPrefix = urlPathName.replace(/^\/corp-mail\/mail\/api\//, '');

  if (res?.data?.success) {
    res!.data!.code = MailAbstractHandler.sOk;
  } else {
    // 不成功的时候，message的内容为errorCode
    res!.data!.code = res?.data?.message;
  }

  switch (pathNameWithoutPrefix) {
    case 'mail/folders':
      transformFolders(res);
      break;
    case 'mail/messages':
      transformMailList(res);
      break;
    case 'mail/message':
      transformMailItem(res);
      break;
    case 'mail/signatures':
      transformSignatures(res);
      break;
    case 'mail/messages/forward':
      transformForwardMail(res);
      break;
    case 'mail/message/infos':
      transformMailInfos(res);
      break;
    case 'mail/tags/manage':
      transformTagsManage(res);
      break;
    case 'mail/tags':
      transformTagList(res);
      break;
    case 'mail/compose':
      transformMailCompose(res);
      break;
    case 'mail/upload/prepare':
      transformPreUpload(res);
      break;
    case 'mail/threads':
      transformThreadList(res);
      break;
    case 'mail/message/recall':
      transformRecallResult(res);
      break;
    case 'mail/search':
      transformSearchResult(res);
      break;
    case 'mail/exchange/emailList':
      transformCorpRelatedMailList(res);
      break;
    default:
      transformResultToVar(res);
  }

  return res;
}

/**
 * 获取corp云端搜索的group相关的信息
 * @param total
 */
function getAllResultGroupInfo(total: number) {
  return {
    all: [{ val: -3, cnt: total }],
  };
}
const httpImpl = api.getDataTransApi();

function transformCorpCreateUserFolderParams(items: createUserFolderParams[]): createUserFolderParams[] {
  if (!items || !items.length) return [];
  items.forEach(item => {
    if (!item.keepPeriod) {
      // 默认不清理
      item.keepPeriod = -1;
    }
  });

  return items;
}

function buildUrlForCorpMail(key: keyof MailFuncToCorpMailUrlMap, additionalParam?: StringMap): string {
  let url = getUrlByMailFuncName(key);
  if (!url) {
    // 没有对应的方法，返回空字符串
    url = '';
    return url;
  }
  // 27 多账号改造注释 和唯一使用的地方冲突
  // const currentUser = systemApi.getCurrentUser();
  // const params = { sid: currentUser?.sessionId, ...(additionalParam || {}) };

  const params = { ...(additionalParam || {}) };
  return httpImpl.buildUrl(url, params);
}

const htmlApi = api.requireLogicalApi(apis.htmlApi) as unknown as HtmlApi;

function handleCorpSignatureEl(item: Element): void {
  if (!item) return;
  const imgs = item.querySelectorAll('img');
  imgs.forEach(imgEl => {
    const originSrc = imgEl.getAttribute('src') as string;
    if (originSrc.includes('/coremail') && (originSrc.includes('func=user:proxyGet') || originSrc.includes('user%3AproxyGet'))) {
      const searchInfo = htmlApi.parseUrlQuery(originSrc);
      imgEl.setAttribute('src', decodeURIComponent(searchInfo.url));
    }
  });
}

function getIsNeteaseMailUser(): boolean {
  const currentUser = systemApi.getCurrentUser();
  if (!currentUser) return false;
  const { domain } = currentUser;
  return NETEASE_DOMAIN_ARR.includes(domain);
}

function getWebUrlByFeatureName(featureName: string): string {
  if (!featureName) return '';
  const isNeteaseMailUser = getIsNeteaseMailUser();
  if (!isNeteaseMailUser) {
    return '';
  }
  const urlInfo = FEATURE_NAME_TO_NETEASE_WEB_URL[featureName];
  if (!urlInfo) {
    return '';
  }
  const currentUser = systemApi.getCurrentUser();
  if (currentUser) {
    const hasQueryString = urlInfo.baseUrl?.includes('?');
    return `${urlInfo.baseUrl}${hasQueryString ? '&' : '?'}sid=${currentUser.sessionId}#${urlInfo.hash}`;
  }
  return '';
}

// 申请解禁 可指定账号
function applyUnban(accountMsg?: { account: string }) {
  try {
    const mainAccountEmail = systemApi.getMainAccount1().email;
    const unbanAccount = accountMsg?.account || mainAccountEmail;
    const unbanUrl = `https://fbhz.qiye.163.com/static/feedback/#/blackuser/${unbanAccount}`;
    systemApi.openNewWindow(unbanUrl, false);
  } catch (error) {
    console.log('申请解禁失败', error);
  }
}

export default {
  corpMailTransformResponse,
  getUrlByMailFuncName,
  getAllResultGroupInfo,
  transformCorpCreateUserFolderParams,
  getCorpFolderErrMsgByCode,
  buildUrlForCorpMail,
  handleCorpSignatureEl,
  getIsNeteaseMailUser,
  getWebUrlByFeatureName,
  applyUnban,
};
