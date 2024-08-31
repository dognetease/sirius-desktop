import moment from 'moment';
import capitalize from 'lodash/capitalize';
import { config, CreateWindowRes } from 'env_def';
import cloneDeep from 'lodash/cloneDeep';
import dayjs from 'dayjs';
import {
  ActionStore,
  mailBoxOfDeleted,
  mailBoxOfSpam,
  RequestComposeMailAttachment,
  RequestComposeMailAttrs,
  RequestExportGroupMailAsZip,
  RequestExportMailAsEml,
  RequestModifyMail,
  ResponseAttachment,
  ResponseDeliverStatus,
  ResponseWithDrawResult,
  ContactProcessingItem,
  mailUnfinishedMailTable,
  SubActionsType,
} from './mail_action_store_model';

import { MailModelHandler } from './mail_entry_helper';
import { MailContactHandler } from './mail_obtain_contact_helper';
import { MailContentHandler } from './mail_content_handler';
import {
  MailBoxEntryContactInfoModel,
  MailDeliverStatus,
  MailDeliverStatusItem,
  MailEntryInfo,
  MailEntryModel,
  MailModelEntries,
  MailOperationStatus,
  MailOperationType,
  MailPerferedOpType,
  ParsedContact,
  ResponseSignature,
  updateThreadMailStateParam,
  WriteLetterPropType,
  WriteMailInitModelParams,
  TranslatResModel,
  GrammarResponse,
  MemberType,
  MailDeferParams,
  RequestMailTagRequest,
  DelMailParams,
  MoveMailParams,
  MailFileAttachModel,
  updateMessageInfosParams,
  MarkPayload,
  DoWriteMailPayload,
  AccountTokensType,
  MailContentLangResModel,
} from '@/api/logical/mail';
import { DeviceInfo } from '@/api/system/system';
import { DataStoreApi } from '@/api/data/store';
import { CommonBatchResult, ContactModel, PopUpMessageInfo } from '@/api/_base/api';
import { ApiResponse, ResponseData } from '@/api/data/http';
// import { StringMap, StringTypedMap } from '@/api/commonModel';
import { StringTypedMap } from '@/api/commonModel';
import { SystemEvent } from '@/api/data/event';
import { MailSearchHandler } from './mail_search_handler';
import { api } from '@/api/api';
import { apis } from '@/config';
import { MailContentDbHelper } from '@/impl/logical/mail/mail_content_db_handler';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { EmailListPriority } from '@/api/logical/mail_stranger';
import { locationHelper } from '@/api/util/location_helper';
import { ContactApi, OrgApi } from '@/api/logical/contactAndOrg';
import { MailAliasAccountModel } from '@/api/logical/account';
import { MailAbstractHandler } from './mail_abs_handler';
import { getIn18Text } from '@/api/utils';

// const accountApi = api.requireLogicalApi(apis.accountApiImpl) as unknown as AccountApi;
const trackApi: DataTrackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

// import { StoredLock } from '../../../api/data/store';
/**
 * 信件除发送其他操作
 */
export class MailOperationHandler extends MailSearchHandler {
  dataTracker: DataTrackerApi;

  storeApi: DataStoreApi;

  defaultStyle = '';

  readonly concurrentUpload: number = 3;

  contactApi: ContactApi & OrgApi;

  // eslint-disable-next-line no-useless-constructor
  constructor(actions: ActionStore, modelHandler: MailModelHandler, contactHandler: MailContactHandler, mailDbHandler: MailContentDbHelper, subActions?: SubActionsType) {
    // action改造
    super(actions, modelHandler, contactHandler, mailDbHandler, subActions);
    this.dataTracker = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
    this.storeApi = api.getDataStoreApi();
    this.contactApi = api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
  }

  // eslint-disable-next-line max-params
  async doReplayMail(
    id: string,
    all?: boolean,
    noPopup?: boolean,
    additionalContent?: string,
    isThread?: boolean,
    _account?: string,
    owner?: string
  ): Promise<WriteMailInitModelParams> {
    let writeId = id;
    if (isThread) {
      writeId = await this.mailDbHanlder.getFirstMessageFromThreadMail(id, _account);
    }
    console.log('[mail] reply mail ' + writeId, all);
    const writeType = all ? 'replyAll' : 'reply';
    const params: WriteMailInitModelParams = {
      id: writeId,
      writeType: writeType as WriteLetterPropType,
      mailType: 'common',
      originContent: additionalContent,
      _account,
      owner,
    };
    if (!noPopup) {
      return this.callWriteLetterFunc(params);
    }
    return params;
  }

  doReplayMailWithAttach(id: string, all?: boolean, noPopup?: boolean, additionalContent?: string, _account?: string, owner?: string): WriteMailInitModelParams {
    console.log('[mail] replyWithAttach mail ' + id, all);
    const writeType = all ? 'replyAllWithAttach' : 'replyWithAttach';
    const params: WriteMailInitModelParams = {
      id,
      writeType: writeType as WriteLetterPropType,
      mailType: 'common',
      originContent: additionalContent,
      _account,
      owner,
    };
    if (!noPopup) {
      return this.callWriteLetterFunc(params);
    }
    return params;
  }

  // eslint-disable-next-line max-params
  async doForwardMail(
    id: string,
    payload?: {
      noPopup?: boolean;
      additionalContent?: string;
      isThread?: boolean;
      asAttach?: boolean;
      asAttachIds?: string[];
      _account?: string;
      owner?: string;
      title?: string;
    }
  ): Promise<WriteMailInitModelParams> {
    const { noPopup, additionalContent, isThread, asAttach, asAttachIds, _account, owner, title } = payload || {};
    let forwardId = id;
    if (isThread && !asAttachIds) {
      forwardId = await this.mailDbHanlder.getFirstMessageFromThreadMail(id, _account);
    }
    console.log('[mail] forward mail ' + forwardId, isThread);
    const writeType = !asAttach ? 'forward' : 'forwardAsAttach';
    const params: WriteMailInitModelParams = {
      id: forwardId,
      asAttachIds,
      writeType: writeType as WriteLetterPropType,
      mailType: 'common',
      originContent: additionalContent,
      _account,
      owner,
      title,
    };
    if (!noPopup) {
      return this.callWriteLetterFunc(params);
    }
    return params;
  }

  async doEditMail(id: string, payload?: DoWriteMailPayload): Promise<WriteMailInitModelParams> {
    const { noPopup, draft, isThread, _account } = payload || {};
    let editId = id;
    if (isThread) {
      editId = await this.mailDbHanlder.getFirstMessageFromThreadMail(id, _account);
    }
    console.log('[mail] edit mail ' + editId, isThread);
    const params: WriteMailInitModelParams = {
      id,
      writeType: draft ? 'editDraft' : 'edit',
      mailType: draft ? 'common' : 'draft',
      _account,
    };
    if (!noPopup) {
      return this.callWriteLetterFunc(params);
    }
    return params;
  }

  doExportMailAsEml(mid: string, fileName: string, dialogConfirmText?: string, _account?: string) {
    const fullFileName = this.systemApi.isElectron() && window.electronLib ? `${fileName}.eml` : fileName;
    const isSubAccount = this.mailConfApi.isSubAccount(_account);
    const _token = this.mailConfApi.accountTokens.find((token: AccountTokensType) => token.account === _account)?.token || '';
    console.log('[mail] mail export as eml ', mid, fullFileName);
    const currentUser = this.systemApi.getCurrentUser(_account);
    let urlBase = this.systemApi.getAccountUrl('mailDownload', _account);
    // 单独邮件导出
    const req: RequestExportMailAsEml = {
      action: 'download_eml',
      l: 'read',
      mode: 'download',
      sid: currentUser?.sessionId || '',
      mid,
    };
    if (isSubAccount && !this.systemApi.isElectron()) {
      req._token = _token;
      urlBase = this.systemApi.getAccountUrl('mailDownloadProxy', _account);
    }
    const url = this.impl.buildUrl(urlBase, req, { _account });
    return this.fileApi.saveDownload({ fileUrl: url, fileName: fullFileName, dialogConfirmText }, { _account });
  }

  doExportGroupMailAsZip(ids: string[], fileName: string, dialogConfirmText?: string, _account?: string) {
    const fullFileName = this.systemApi.isElectron() && window.electronLib ? `${fileName}.zip` : fileName;
    const midParams = ids.reduce((total, current) => {
      total += `&mid=${current}`;
      return total;
    }, '');
    console.log('group mail export as zip', midParams);
    const currentUser = this.systemApi.getCurrentUser(_account);
    let urlBase = this.systemApi.getAccountUrl('mailOperation', _account);
    // 打包邮件导出
    const req: RequestExportGroupMailAsZip = {
      sid: currentUser?.sessionId || '',
      func: 'mbox:packMessages',
    };
    if (this.mailConfApi.isSubAccount(_account) && !this.systemApi.isElectron()) {
      const _token = this.mailConfApi.accountTokens.find((token: AccountTokensType) => token.account === _account)?.token || '';
      urlBase = '/commonweb/proxy' + urlBase;
      req._token = _token;
    }

    const url = this.impl.buildUrl(urlBase, req, { _account }) + midParams;
    console.log('group mail export as zip', url, fileName);
    return this.fileApi.saveDownload({ fileUrl: url, fileName: fullFileName, dialogConfirmText }, { _account });
  }
  async doDeleteMail({ fid, id, isThread, _account }: DelMailParams): Promise<CommonBatchResult> {
    // 清空一下邮件搜索的缓存
    this.doClearSearchCache(_account);

    if (!id) {
      return this.deleteMailInFolder(fid, _account);
    }
    if (id && fid === mailBoxOfDeleted.id) {
      const ids = typeof id === 'string' ? [id] : id;

      if (isThread) {
        const threadResult = await this.mailDbHanlder.getThreadMessageByThreadIds(ids, _account);
        if (threadResult && threadResult.threadMessages.length > 0) {
          const threadMessageIds = threadResult.threadMessages.map(v => v.mid);
          ids.push(...threadMessageIds);
        }
      }

      const key = 'deleteMail';
      const additionalParam = _account ? this.getAccountSession(_account) : undefined;
      const data = { ids };
      const url = this.buildUrl(key, additionalParam, !!additionalParam?._session, _account);
      return this.impl
        .post(url, data, this.getConfigForHttp(key, { url, data, _account }))
        .then(this.unpackData.bind(this))
        .then(res => {
          if (res.code === MailContentHandler.sOk) {
            return {
              succ: true,
            };
          }
          return Promise.reject(this.getErrMsg(res.code));
        });
    }

    if (id) {
      return this.doMoveMail({
        id,
        fid: mailBoxOfDeleted.id,
        isThread,
        needFilter: false,
        _account,
      });
    }

    throw new Error('参数错误');
  }

  private deleteMailInFolder(fid: number, _account?: string): Promise<CommonBatchResult> {
    const key = 'emptyFolder';
    const additionalParam = _account ? this.getAccountSession(_account) : undefined;
    const url = this.buildUrl(key, additionalParam, !!additionalParam?._session, _account);
    const data = { id: fid };
    return this.impl
      .post(url, data, this.getConfigForHttp(key, { url, data, _account }))
      .then(this.unpackData.bind(this))
      .then(res => {
        if (res.code === MailContentHandler.sOk) {
          return { succ: true };
        }
        return Promise.reject(this.getErrMsg(res.code));
      });
  }

  // 给邮件打标签
  async updateMessageTags(params: RequestMailTagRequest, isThread?: boolean, _account?: string) {
    const key = isThread ? 'updateThreadTags' : 'updateMessageTags';
    const url = this.buildUrl(key, undefined, undefined, _account);
    if (isThread) {
      params.ids = params.ids.filter(v => !v.includes('--'));
    }
    try {
      const ret = await this.impl.post(url, params, this.getConfigForHttp(key, { url, _account }));
      this.unpackData(ret);
      if (ret.status !== 200 || ret.data?.code !== 'S_OK') {
        return Promise.reject(new Error(ret.data?.message || '操作失败'));
      }
      return Promise.resolve('');
    } catch (e) {
      return Promise.reject(new Error((e as ApiResponse).data?.message || '操作失败'));
    }
  }

  async updateMessageInfos(item: updateMessageInfosParams, _account?: string): Promise<boolean> {
    try {
      const urlKey = 'updateMessageInfos';
      const url = this.buildUrl(urlKey, undefined, undefined, _account);
      const dt = {
        ...item,
      };
      const apiRet = await this.impl.post(
        url,
        dt,
        this.getConfigForHttp(urlKey, {
          url,
          data: item,
          method: 'post',
          _account,
        })
      );
      if (apiRet?.data?.code === MailAbstractHandler.sOk) {
        return Promise.resolve(true);
      }
      return Promise.reject();
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async doMarkMail(conf: {
    mark: boolean;
    id: string[] | string;
    type: MailOperationType;
    isThread?: boolean;
    needFilter?: boolean;
    deferParams?: MailDeferParams;
    payload?: MarkPayload;
    _account?: string;
  }): Promise<CommonBatchResult> {
    const { mark, id, type, isThread = false, needFilter = false, deferParams, payload = {}, _account } = conf;
    console.log('[mail] mark mail network ' + id, mark, type);
    const ids = typeof id === 'string' ? [id] : id;
    const req: RequestModifyMail = {
      ids,
      attrs: {},
      isThread,
      needFilter,
    };
    if (type === 'requestReadReceiptLocal') {
      return Promise.resolve({ succ: true });
    }
    if (type === 'memo') {
      const res = await this.updateMessageInfos(
        {
          ids: [ids[0]],
          attrs: {
            memo: payload.memo || '',
          },
        },
        _account
      );
      return Promise.resolve({ succ: res === true });
    }
    switch (type) {
      case 'read':
        req.attrs.flags = { read: mark };
        break;
      case 'top':
        req.attrs.flags = { top: mark };
        break;
      case 'redFlag':
        req.attrs.label0 = mark ? 1 : 0;
        if (isThread) {
          if (req.attrs.flags) {
            req.attrs.flags = {
              ...req.attrs.flags,
              flagged: true,
            };
          } else {
            req.attrs.flags = { flagged: mark };
          }
        }
        break;
      case 'preferred':
        req.attrs.preferred = mark ? 0 : -1;
        break;
      case 'spam':
        req.reportType = mark ? 'spam' : 'notspam';
        req.attrs.fid = mailBoxOfSpam.id;
        break;
      case 'defer':
        req.attrs.flags = { deferHandle: mark };
        if (mark) {
          const deferTime = deferParams?.deferTime && deferParams?.deferTime > 0 ? deferParams?.deferTime : undefined;
          req.attrs.defer = deferTime ? moment(deferTime).format('YYYY-MM-DD HH:mm:ss') : '';
          req.attrs.deferNotice = deferParams?.deferNotice || false;
        }
        break;
      default:
        throw new Error('接口请求有误');
    }
    return this.modifyMail(req, _account);
    // 通知进行文件夹远程更新比对
    // await this.modelHandler.calFolderUnread();
    // return res;
  }

  doMoveMail({ id, fid, isThread, needFilter, _account }: MoveMailParams): Promise<CommonBatchResult> {
    // 清空一下邮件搜索的缓存
    this.doClearSearchCache(_account);

    return this.modifyMail(
      {
        ids: typeof id === 'string' ? [id] : id,
        attrs: {
          fid,
        },
        isThread,
        needFilter,
        _account,
      },
      _account
    );
  }

  /**
   * 完全信任邮件，抹除可疑标识
   * @param id
   * @returns
   */
  doCompleteTrustMail(id: string | string[]): Promise<CommonBatchResult> {
    return this.modifyMail({
      ids: typeof id === 'string' ? [id] : id,
      attrs: {
        flags: {
          suspiciousSpam: false,
        },
      },
    });
  }

  /**
   * 举报或信任邮件
   * @param id
   * @param fid
   * @param spamType
   * @param isTread
   * @returns
   */
  doReportOrTrustMail(id: string | string[], fid: number, spamType?: string, isTread?: boolean, _account?: string): Promise<CommonBatchResult> {
    if (isTread) {
      return Promise.reject(new Error('Not Support Report Or Trust Thread Mail'));
    }
    return this.modifyMail(
      {
        ids: typeof id === 'string' ? [id] : id,
        attrs: {
          fid,
        },
        isThread: isTread,
        reportType: spamType !== undefined ? 'spam' : 'notspam',
        spamType,
      },
      _account
    );
  }

  async modifyMail(req: RequestModifyMail, _account?: string): Promise<CommonBatchResult> {
    if (req.needFilter) {
      await this.filterRequest(req);
    }
    if (!req.ids || req.ids.length === 0) {
      return Promise.resolve({
        succ: true,
      });
    }
    // corp不支持该模式
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    if (!isCorpMail && req.isThread) {
      // 挂载账号不支持聚合模式
      req._account = undefined;
      const url = this.buildUrl('updateThreadInfo', undefined, undefined, _account);
      const threadReq: updateThreadMailStateParam = this.buildThreadMailUpdateReq(req);
      return this.impl
        .post(url, threadReq, {
          url,
          cachePolicy: 'noCache',
          contentType: 'json',
        })
        .then(this.unpackData.bind(this))
        .then(res => {
          if (res.code === MailContentHandler.sOk) {
            return {
              succ: true,
            };
          }
          return Promise.reject(new Error(res?.code + ''));
        });
    }
    const key = 'updateMail';
    let additionalParam;
    if (req._account) {
      additionalParam = this.getAccountSession(req._account);
    }
    if (_account) {
      additionalParam = this.getAccountSession(_account);
    }
    const url = this.buildUrl(key, additionalParam, !!additionalParam?._session, _account);
    req.isThread = undefined;
    return this.impl
      .post(
        url,
        req,
        this.getConfigForHttp(key, {
          url,
          data: req,
          noErrorMsgEmit: true,
          _account,
        })
      )
      .then(this.unpackData.bind(this))
      .then(res => {
        if (res.code === MailContentHandler.sOk) {
          return {
            succ: true,
          };
        }
        return Promise.reject(new Error(res?.code + ''));
      });
  }

  buildThreadMailUpdateReq(req: RequestModifyMail): updateThreadMailStateParam {
    // 去除了本地构造的 id--fid 形式的 id
    const baseReq = { ids: req.ids.filter(id => !id.includes('--')) };
    const attrs: updateThreadMailStateParam['attrs'] = {};
    if (req.attrs.fid !== undefined) {
      attrs.fid = req.attrs.fid;
    }
    if (req.attrs.label0 !== undefined) {
      attrs.label0 = req.attrs.label0;
    }
    if (req.attrs.flags !== undefined) {
      attrs.flags = req.attrs.flags;
    }
    return { ...baseReq, attrs };
  }

  private async filterRequest(req: RequestModifyMail) {
    const result = await this.doListMailBoxEntities(
      {
        mids: req.ids,
        count: req.ids.length,
        ignoreContact: true,
        checkType: req.isThread ? 'checkThread' : 'normal',
        _account: req._account,
      },
      true
    );
    const res: MailEntryModel[] = Array.isArray(result) ? result : (result as MailModelEntries).data;
    const map: StringTypedMap<MailEntryInfo> = {};
    res.forEach(it => {
      map[it.id] = it.entry;
    });
    req.ids = req.ids.filter(it => {
      if (map[it]) {
        if (req.attrs.label0 !== undefined) {
          return req.attrs.label0 === 1 ? map[it].mark !== 'redFlag' : map[it].mark === 'redFlag';
        }
        if (req.attrs.fid) {
          return req.attrs !== map[it].folder;
        }
        if (req.attrs.flags?.read !== undefined) {
          return req.attrs.flags.read ? map[it].readStatus === 'unread' : map[it].readStatus === 'read';
        }
      }
      return false;
    });
  }

  static TypeIdxMap: Map<string, number> = new Map<string, number>([
    ['to', 0],
    ['cc', 1],
    ['bcc', 2],
  ]);

  genMailWrapper(content: MailEntryModel, forward?: boolean): { start: string; end: string } {
    const sender = this.buildEmailContent(content.sender.contactItem.contactItemVal, content.sender.contact.contact.contactName);

    const receiver = content.receiver.reduce(
      (prs, cur) => {
        const idx = MailOperationHandler.TypeIdxMap.get(cur.mailMemberType) || 0;
        //   cur.mailMemberType === 'to' ? 0 : (
        //   cur.mailMemberType === 'cc' ? 1 : 2
        // );
        const pr = prs[idx];
        const s = pr + (pr.length === 0 ? '' : ' , ') + this.buildEmailContent(cur.contactItem.contactItemVal, cur.contact.contact.contactName);
        prs[idx] = s;
        return prs;
      },
      ['', '', '']
    );
    const quoteId = forward ? 'isForwardContent' : 'isReplyContent';
    // 如果是作为附件转发，就将回复的整体内容隐藏掉
    const startStr = content.entry.writeLetterProp === 'forwardAsAttach' ? '<div class="pre-mail-content" style=\'display:none\'>' : '<div class="pre-mail-content">';
    // let startStr = ''
    const nReplayMap = this.mailConfApi.getConfigByNreplay();

    const timeZone = this.mailConfApi.getTimezone();
    const sendTime = dayjs(this.systemApi.getDateByTimeZone(content?.entry.sendTime || 0, timeZone, true)).format('YYYY-MM-DD HH:mm:ss');

    const systemTimezone = this.systemApi.getSystemTimeZone();
    const suffix = systemTimezone?.value ? `(${systemTimezone.value})` : '';
    const defaultSeparateLine = this.storeApi.getSync('defaultSeparateLine').data || '0';
    let blockquoteStyle = 'PADDING-LEFT: 1ex; BORDER-LEFT: #ccc 1px solid; margin: 0;';
    if (defaultSeparateLine === '0') blockquoteStyle = 'margin: 0;';
    return {
      // 不要用模板字符串，因为模板字符串折行会用<br />，但是编辑器里面的折行都是 <div></div>。 这样放到编辑器后，编辑器会格式化数据，导致内容之间空格很大
      start:
        startStr +
        this.contentBlockLine(3) +
        "<div id='" +
        quoteId +
        "' style='" +
        blockquoteStyle +
        "'>" +
        "<div style='color: #7d8085'>" +
        (forward ? nReplayMap.fw : nReplayMap.original) +
        ':</div>' +
        "<ul style='color: #7d8085; font-size:12px; padding-left: 20px'>" +
        '<li>' +
        nReplayMap.from +
        '：' +
        sender +
        '</li>' +
        '<li>' +
        nReplayMap.date +
        '：' +
        sendTime +
        suffix +
        '</li>' +
        '<li>' +
        nReplayMap.to +
        '：' +
        (receiver[0] ? receiver[0] : '') +
        '</li>' +
        '<li>' +
        nReplayMap.cc +
        '：' +
        (receiver[1] ? receiver[1] : '') +
        '</li>' +
        '<li>' +
        nReplayMap.subject +
        '：' +
        content.entry.title +
        '</li>' +
        '</ul>',
      end: '</div></div>',
    };
  }

  async handleRepliedResp(res: ResponseData<RequestComposeMailAttrs>, content: MailEntryModel) {
    const { _account, isTpMail, owner } = content;
    if (res.code === MailContentHandler.sOk) {
      const con = res.var?.content || content.entry.content.content;
      content.entry.content = {
        content: con,
        contentId: '',
        contentLen: con.length,
      };
      content.entry.title = res.var?.subject || content.entry.title;
      content._id = res.var?.id;
      if (res.var?.attachments) {
        const attachments = this.transAttachmentToResponseAttachment(res.var?.attachments);
        attachments?.forEach((it: ResponseAttachment) => {
          it._account = content._account;
        });
        const MailFileAttach =
          this.handleAttachment(attachments, content.id, {
            forWrite: true,
            isTpMail,
            owner,
          }) || [];
        // const MailFileAttach = this.handleAttachment({ attachments, mid: content.id, forWrite: true, _account }) || [];
        // 转发，再次编辑：在写信页邮件附件要支持预览，但是filePreviewUrl需要是原始的url，新的filePreviewUrl因为id问题，无法下载，也就无法预览
        // TODO：替换filePreviewUrl依赖于MailFileAttach和attachments这两个数组附件需要保持一样的顺序，否则替换不生效，但是没有标识可以一一对应，但目前数据上看数组的顺序可以保证一致
        MailFileAttach.forEach((_, index) => {
          if (content.entry.attachment && _?.fileName === content.entry.attachment[index]?.fileName && content.entry.attachment[index]?.filePreviewUrl) {
            _.filePreviewUrl = content.entry.attachment[index].filePreviewUrl;
          }
        });
        content.entry.attachment = MailFileAttach;
      }
      if (content.entry.writeLetterProp === 'reply' || content.entry.writeLetterProp === 'replyAll') {
        // 只保留内联附件
        content.entry.attachment = (content.entry.attachment || []).filter((att: MailFileAttachModel) => att?.inlined === true);
      }
      // 设置优先级
      if (res.var?.priority || res.var?.priority === 0) {
        content.entry.priority = res.var?.priority;
      }

      const user = this.systemApi.getCurrentUser(_account);
      if (!user) {
        this.eventApi.sendSimpleSysEvent('logout');
        throw new Error('not login , why?');
      }

      // 处理收件人
      // 获取当前账号以及别名邮箱及子账号
      const currentUserMailList = this.getCurrentUserMailList({ _account });
      // 当前发信人
      const senderMail = content?.sender?.contact?.contact?.accountName;
      // 邮件类型是否是回复全部
      const isReplyAll = content.entry.writeLetterProp === 'replyAll' || content.entry.writeLetterProp === 'replyAllWithAttach';
      // 如果类型为【全部回复】，并且发件人是自己，则无需处理，保持 content 中的 receiver
      // 否则，依据接口返回数据，整合receiver
      if (!(isReplyAll && currentUserMailList.has(senderMail))) {
        const receiver: MailBoxEntryContactInfoModel[] = [];
        const contacts: MailBoxEntryContactInfoModel[] = content.receiver.concat(content.sender);
        const memberType: MemberType[] = ['to', 'cc', 'bcc'];
        // 不存在的联系人
        const notExistMails: { [k: string]: any[] } = {
          to: [],
          cc: [],
          bcc: [],
        };
        memberType.forEach((type: MemberType) => {
          let rev;
          if (res.var) {
            rev = res.var[type as keyof typeof res.var];
          }
          if (rev) {
            (rev as string[]).forEach((_user: string) => {
              if (_user) {
                const ret = {
                  origin: [_user],
                  parsed: [],
                  type,
                } as ContactProcessingItem;
                // 解析
                const email: ContactProcessingItem = this.contactHandler.handleEmailListStringToParsedContent(_user, ret);
                if (email.parsed.length) {
                  const emailStr = email.parsed[0].email;
                  for (let i = 0; i < contacts.length; i++) {
                    if (contacts[i].contact.contact.accountName === emailStr) {
                      const onConcat = cloneDeep(contacts[i]);
                      onConcat.mailMemberType = type;
                      receiver.push(onConcat);
                      break;
                    } else if (i === contacts.length - 1) {
                      notExistMails[type].push(emailStr);
                    }
                  }
                }
              }
            });
          }
        });

        const emails = [...notExistMails.to, ...notExistMails.cc, ...notExistMails.bcc];
        const emailRes = await this.contactApi.doGetContactByEmailFilter({ emails, _account });
        const emailsMap = {
          to: notExistMails.to,
          cc: notExistMails.cc,
          bcc: notExistMails.bcc,
        };
        Object.keys(emailsMap).forEach(mailType => {
          notExistMails[mailType].forEach(emailKey => {
            const model = emailRes[emailKey];
            if (model) {
              receiver.push(this.contactHandler.transContactModel2MailContactModel(model, mailType as MemberType));
            } else {
              receiver.push(
                this.buildRawContactItem(
                  {
                    item: '',
                    email: emailKey,
                    name: '',
                    type: mailType as MemberType,
                  },
                  _account
                )
              );
            }
          });
        });
        // 如果类型为【全部回复】且收件人或者抄送人是当前用户需要过滤当前用户
        if (isReplyAll) {
          const _receiver: MailBoxEntryContactInfoModel[] = [];
          receiver.forEach(item => {
            const email = item?.contact?.contact?.displayEmail || item?.contact?.contact?.accountName;
            const needFilterMyMail = currentUserMailList.has(email);
            if (!needFilterMyMail) {
              _receiver.push(item);
            }
          });
          // eslint-disable-next-line no-param-reassign
          content.receiver = _receiver;
        } else {
          // eslint-disable-next-line no-param-reassign
          content.receiver = receiver;
        }
      }

      return content;
    }
    return Promise.reject(this.getErrMsg(res.code));
  }

  /**
   * 获取当前的账号的邮箱集合
   * @param params
   * @params current 当前账号
   * @params alias 当前别名账号
   * @returns set<string> 去重复的邮箱集合
   */
  getCurrentUserMailList(params?: { current?: boolean; alias?: boolean; _account?: string }): Set<string> {
    // current 是否加上当前账号
    // alias 是否加上当前账号的别名邮箱
    const { current = true, alias = true, _account } = params || {};
    const currentUser = this.systemApi.getCurrentUser(_account);
    // 当前用户id
    const currentUserMail = current && currentUser?.id ? [currentUser?.id] : [];
    // 当前用户别名
    const currentUserAliasMail = alias && currentUser?.prop?.accountAlias ? currentUser?.prop?.accountAlias : [];

    // 下面只针对子账号
    // 挂载子账号：getCurrentUser 返回的邮箱是 XXXX.third.0@office.163.com 不是真实邮箱地址，需要 getCurrentAgentAccount 获取真实邮箱
    // 此方法是为了获取原生email 使用子窗口 已废弃
    // const agent = this.systemApi.getCurrentAgentAccount(_account);
    const agent = _account && this.accountApi.getAgentEmailByEmail(_account);
    const agentEmail = agent ? [agent] : [];
    return new Set<string>([...currentUserMail, ...currentUserAliasMail, ...agentEmail]);
  }

  requestForward(content: MailEntryModel): Promise<MailEntryModel> {
    const { _account } = content;
    const wrapper = this.genMailWrapper(content, true);
    const key = 'forwardMail';
    const url = this.buildUrl(key, undefined, undefined, _account);
    const data = {
      mode: 'quote',
      attrs: {
        subject: this.mailConfApi.getForwardStyle(content.entry.title) + content.entry.title,
      } as RequestComposeMailAttrs,
      ids: [content.id],
      quoteHTMLStart: wrapper.start,
      quoteHTMLEnd: wrapper.end,
    };
    return this.impl
      .post(url, data, { ...this.getConfigForHttp(key, { data, url }), _account })
      .then(this.unpackData.bind(this))
      .then(res => this.handleRepliedResp(res, content));
  }
  // 下属邮件转发
  subRequestForward(content: MailEntryModel): Promise<MailEntryModel> {
    const { _account, owner } = content;
    const wrapper = this.genMailWrapper(content, true);
    const key = 'forwardMail';
    const node = this.systemApi.getCurrentNode();
    const url = this.buildUrl(key, { followee: owner || '', node }, undefined, _account, 'getSubMailNew');
    const data = {
      mode: 'quote',
      attrs: {
        subject: this.mailConfApi.getForwardStyle(content.entry.title) + content.entry.title,
      } as RequestComposeMailAttrs,
      ids: [content.id],
      quoteHTMLStart: wrapper.start,
      quoteHTMLEnd: wrapper.end,
    };
    return this.impl
      .post(url, data, { ...this.getConfigForHttp(key, { data, url }), _account })
      .then(this.unpackSubData.bind(this))
      .then(res => this.handleRepliedResp(res, content));
  }

  requestForwardAsAttach(content: MailEntryModel): Promise<MailEntryModel> {
    const { _account, entry } = content;
    const { id, asAttachIds } = entry;
    // 将内容设为空+title加上转发
    content.entry.content.content = '';
    content.entry.title = this.mailConfApi.getForwardStyle(content.entry.title) + content.entry.title;
    const currentUser = this.systemApi.getCurrentUser(_account);
    const urlBase = this.systemApi.getAccountUrl('mailOperation', _account);
    const req = {
      action: 'forward',
      l: 'read',
      sid: currentUser?.sessionId || '',
      func: 'mbox:forwardMessages',
    };
    const data = {
      mode: 'attach',
      attrs: {
        // subject: this.mailConfApi.getForwardStyle(content.entry.title) + content.entry.title,
        account: `${currentUser?.id}`,
        isHtml: true,
        content: '',
      },
      ids: asAttachIds || [id],
      supportTNEF: true,
    };
    const url = this.impl.buildUrl(urlBase, req);
    return this.impl
      .post(url, data, this.getConfigForHttp('forwardMail', { data, url, _account }))
      .then(this.unpackData.bind(this))
      .then(res => this.handleRepliedResp(res, content))
      .then((content: MailEntryModel) => {
        content.entry.title = this.mailConfApi.getForwardStyle(content.entry.title) + content.entry.title;
        return content;
      });
  }

  // 下属邮件，作为附件转发
  subRequestForwardAsAttach(content: MailEntryModel): Promise<MailEntryModel> {
    const { _account, entry, owner } = content;
    const { id, asAttachIds } = entry;
    // 将内容设为空+title加上转发
    content.entry.content.content = '';
    content.entry.title = this.mailConfApi.getForwardStyle(content.entry.title) + content.entry.title;
    const currentUser = this.systemApi.getCurrentUser(_account);
    const urlBase = this.systemApi.getAccountUrl('getSubMailNew', _account);
    const node = this.systemApi.getCurrentNode();
    const req = {
      action: 'forward',
      l: 'read',
      sid: currentUser?.sessionId || '',
      func: 'mbox:forwardMessages',
      followee: owner || '', // 下属邮件的账号，通过followee传递
      node,
    };
    const data = {
      mode: 'attach',
      attrs: {
        // subject: this.mailConfApi.getForwardStyle(content.entry.title) + content.entry.title,
        account: `${currentUser?.id}`,
        isHtml: true,
        content: '',
        subject: content.entry.title,
      },
      ids: asAttachIds ? asAttachIds : [id],
      supportTNEF: true,
    };
    const url = this.impl.buildUrl(urlBase, req);
    return this.impl
      .post(url, data, this.getConfigForHttp('forwardMail', { data, url, _account }))
      .then(this.unpackSubData.bind(this))
      .then(res => this.handleRepliedResp(res, content))
      .then((content: MailEntryModel) => {
        content.entry.title = this.mailConfApi.getForwardStyle(content.entry.title) + content.entry.title;
        return content;
      });
  }

  // 原信转发
  requestDelivery(id: string, bcc: string[], _account: string): Promise<boolean> {
    const key = 'forwardMail';
    const url = this.buildUrl(key, undefined, undefined, _account);
    const data = {
      mode: 'transmit',
      attrs: {
        bcc,
        saveSentCopy: true,
        account: _account,
      },
      ids: [id],
      returnInfo: false,
      action: 'deliver',
    };
    return this.impl
      .post(url, data, this.getConfigForHttp(key, { data, url, _account }))
      .then(this.unpackData.bind(this))
      .then(res => {
        if (res && res.code === (MailAbstractHandler.sOk || MailAbstractHandler.SuccessCode)) {
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      })
      .catch(err => {
        console.log('[mail] requestDelivery failed:', err);
        return Promise.reject(err);
      });
  }

  requestReply(content: MailEntryModel, all: boolean, withAttachments?: boolean): Promise<MailEntryModel> {
    const { _account } = content;
    const wrapper = this.genMailWrapper(content);
    const key = 'replyMail';
    const url = this.buildUrl(key, undefined, undefined, _account);
    let data: any = {
      mode: 'quote',
      attrs: {
        subject: this.mailConfApi.getReplayStyle(content.entry.title) + content.entry.title,
      } as RequestComposeMailAttrs,
      id: content.id,
      toAll: all,
      withAttachments: !!withAttachments,
      quoteHTMLStart: wrapper.start,
      quoteHTMLEnd: wrapper.end,
    };
    // 加密邮件的回复
    if (content.isDecrypted && content.entry.encpwd) {
      data = {
        ...data,
        decryptPassword: content.entry.encpwd || '',
      };
    }
    return this.impl
      .post(url, data, { ...this.getConfigForHttp(key, { data, url }), _account })
      .then(this.unpackData.bind(this))
      .then(res => this.handleRepliedResp(res, content));
  }

  // 下属邮件回复
  subRequestReply(content: MailEntryModel, all: boolean, withAttachments?: boolean): Promise<MailEntryModel> {
    const { _account, owner } = content;
    const wrapper = this.genMailWrapper(content);
    const key = 'replyMail';
    const node = this.systemApi.getCurrentNode();
    const url = this.buildUrl(key, { followee: owner || '', node }, undefined, _account, 'getSubMailNew');
    let data: any = {
      mode: 'quote',
      attrs: {
        subject: this.mailConfApi.getReplayStyle(content.entry.title) + content.entry.title,
      } as RequestComposeMailAttrs,
      id: content.id,
      toAll: all,
      withAttachments: !!withAttachments,
      quoteHTMLStart: wrapper.start,
      quoteHTMLEnd: wrapper.end,
    };
    // 加密邮件的回复
    if (content.isDecrypted && content.entry.encpwd) {
      data = {
        ...data,
        decryptPassword: content.entry.encpwd || '',
      };
    }
    return this.impl
      .post(url, data, { ...this.getConfigForHttp(key, { data, url }), _account })
      .then(this.unpackSubData.bind(this))
      .then(res => this.handleRepliedResp(res, content));
  }

  requestEdit(mailContentModel: MailEntryModel, draft: boolean): Promise<MailEntryModel> {
    const { _account } = mailContentModel;
    const key = draft ? 'editDraft' : 'editMail';
    const url = this.buildUrl(key, undefined, undefined, _account);
    const data = { id: mailContentModel.id };
    return this.impl
      .post(
        url,
        data,
        this.getConfigForHttp(key, {
          data,
          url,
          _account,
        })
      )
      .then(this.unpackData.bind(this))
      .then((res: ResponseData<RequestComposeMailAttrs>) => this.handleRepliedResp(res, mailContentModel));
  }
  contentBlockLine(num: number): string {
    const alignMap = {
      JustifyLeft: 'left',
      JustifyCenter: 'center',
      JustifyRight: 'right',
      JustifyFull: 'justify',
    };
    let defaultFontFamily = this.storeApi.getSync('defaultFontFamily').data;
    defaultFontFamily = defaultFontFamily || 'Source Han Sans';
    const defaultFontFamilyStyle = `font-family:${defaultFontFamily};`;
    let defaultFontSize = this.storeApi.getSync('defaultFontSize').data || '14px';
    if (!/px$/.test(defaultFontSize)) {
      // 28修改后，defaultFontSize是数字
      defaultFontSize += 'px';
    }
    const defaultFontSizeStyle = `font-size:${defaultFontSize};`;
    const defaultFontColor = this.storeApi.getSync('defaultColor').data;
    const defaultAlign = this.storeApi.getSync('defaultAlign').data as keyof typeof alignMap | undefined;
    const defaultFontColorStyle = defaultFontColor ? `color:${defaultFontColor};` : '';
    const defaultAlignStyle = defaultAlign ? `text-align:${alignMap[defaultAlign]};` : '';
    let defaultLineHeight = this.storeApi.getSync('defaultLineHeight').data;
    defaultLineHeight = defaultLineHeight || '1.5';
    const defaultLineHeightStyle = `line-height:${defaultLineHeight};`;
    this.defaultStyle = `${defaultFontFamilyStyle}${defaultFontSizeStyle}${defaultLineHeightStyle}
      ${defaultFontColorStyle}${defaultAlignStyle}`;
    let res = '';
    for (let i = 0; i < num; i++) {
      res += `<div style='${this.defaultStyle}' data-mce-style='${this.defaultStyle}'><br></div>`;
    }
    return res;
  }

  initModel(param: WriteMailInitModelParams): Promise<MailEntryModel> {
    console.log('[mail]******** call init model:', param);
    const { extraData, _account, owner } = param;
    const contractItemByEmail =
      param.contact && param.contact.length > 0 ? this.contactHandler.getContractItemByEmail(param.contact, 'to', _account) : Promise.resolve([]);
    const ccContactItemByEmail =
      param.ccContact && param.ccContact.length > 0 ? this.contactHandler.getContractItemByEmail(param.ccContact, 'cc', _account) : Promise.resolve([]);
    const signaturePromise =
      param.writeType !== 'editDraft' && param.writeType !== 'edit' /* && param.writeType !== 'forwardAsAttach' */
        ? this.mailSigApi.doGetDefaultSign(false, param.writeType, _account)
        : Promise.resolve({ enable: false, content: '' });
    // 新建
    if (!param.id) {
      // 获取空白model
      const mailContentModel = this.buildEmptyMailEntryModel(param);
      return Promise.all([contractItemByEmail, ccContactItemByEmail, signaturePromise]).then(
        (r: [MailBoxEntryContactInfoModel[], MailBoxEntryContactInfoModel[], ResponseSignature]) => {
          const res = r[0] as MailBoxEntryContactInfoModel[];
          const resCC = r[1] as MailBoxEntryContactInfoModel[];
          const sig = r[2] as ResponseSignature;
          res.forEach(it => {
            if (it && it.contactItem.contactItemVal && it.contactItem.contactItemVal.length > 0) {
              mailContentModel.receiver.push(it);
            }
          });
          resCC.forEach(it => {
            if (it && it.contactItem.contactItemVal && it.contactItem.contactItemVal.length > 0) {
              mailContentModel.receiver.push(it);
            }
          });
          if (sig && sig.enable) {
            let contentCombine = this.contentBlockLine(4);
            // 邮件本身有内容开头处加空行
            if (sig.content) {
              contentCombine += sig.content;
            }
            mailContentModel.entry.content.content = this.htmlApi.mergeHtmlStr(mailContentModel.entry.content.content, contentCombine);
          }
          // 将定制签名的A标签替换 handleSignatureTag()
          // const readMail = true; // 读信
          // const needHtml = false; // 不需要包裹html标签
          // const conf:Map<string, any> = new Map<string, any>([['mailModel', mailContentModel]]);
          // this.modelHandler.getTransferHtml(mailContentModel.entry.content, 'writeLetterSinceNon', false/* 不需要包裹html标签 */, conf);
          console.log('[mail]***** write mail model:', mailContentModel);
          // _account 现流程是必须的 兜底
          if (!mailContentModel._account) {
            mailContentModel._account = _account || '';
          }
          return mailContentModel;
        }
      );
    }
    // 作为附件转发，下属邮件作为附件转发，这种类型直接构建邮件
    // 是否下属邮件
    const isTpmail = !!owner;
    return (
      (
        ['forwardAsAttach'].some(writeType => writeType === param.writeType)
          ? Promise.resolve(this.buildEmptyMailEntryModel(param))
          : isTpmail
          ? this.mailApi.doGetTpMailContent({ mid: param.id, owner })
          : this.mailApi.getMailContentInDb(param.id, false, _account)
      )
        .then(re => {
          if (re) {
            return re;
          }
          return this.doGetMailContent(param.id!, { _account });
        })
        .catch(reason => {
          console.warn(reason);
          return this.doGetMailContent(param.id!, { _account });
        })
        // 这个content 一定会有正确的_account
        .then((originModel: MailEntryModel) => {
          let mailContentModel = originModel;
          if (param.writeType === 'editDraft') {
            try {
              mailContentModel = cloneDeep(originModel);
            } catch (error) {
              console.error('[mail] cloneDeep error:', error);
              mailContentModel = originModel;
            }
          }
          // 如果显式的配置了不展示placeholder，则直接设置不展示
          if (param.withoutPlaceholder) {
            mailContentModel.entry.withoutPlaceholder = param.withoutPlaceholder;
          }
          if (mailContentModel?.isEncryptedMail && param.writeType?.includes('reply')) {
            // 如果是加密邮件，优先获取解密后的内容（如果缓存中存在的话）
            return this.mailApi.insertDecryptedContent(mailContentModel, mailContentModel.id);
          }
          return mailContentModel;
        })
        .then((mailContentModel: MailEntryModel) => {
          console.log('initModel mailContentModel', mailContentModel);

          mailContentModel.entry.writeLetterProp = param.writeType;
          mailContentModel.entry.title = this.htmlApi.decodeHtml(mailContentModel.entry.title);
          let mailEntryModelPromise;
          if (param.writeType === 'forward') {
            mailEntryModelPromise = isTpmail ? this.subRequestForward(mailContentModel) : this.requestForward(mailContentModel);
          } else if (param.writeType === 'forwardAsAttach') {
            mailEntryModelPromise = isTpmail ? this.subRequestForwardAsAttach(mailContentModel) : this.requestForwardAsAttach(mailContentModel);
          } else if (param.writeType === 'reply') {
            mailEntryModelPromise = isTpmail ? this.subRequestReply(mailContentModel, false) : this.requestReply(mailContentModel, false);
          } else if (param.writeType === 'replyAll') {
            mailEntryModelPromise = isTpmail ? this.subRequestReply(mailContentModel, true) : this.requestReply(mailContentModel, true);
          } else if (param.writeType === 'replyWithAttach') {
            mailEntryModelPromise = isTpmail ? this.subRequestReply(mailContentModel, false, true) : this.requestReply(mailContentModel, false, true);
          } else if (param.writeType === 'replyAllWithAttach') {
            mailEntryModelPromise = isTpmail ? this.subRequestReply(mailContentModel, true, true) : this.requestReply(mailContentModel, true, true);
          } else if (param.writeType === 'edit') {
            mailEntryModelPromise = this.requestEdit(mailContentModel, false);
          } else if (param.writeType === 'editDraft') {
            mailEntryModelPromise = this.requestEdit(mailContentModel, true);
          } else {
            mailEntryModelPromise = Promise.resolve(mailContentModel);
          }
          return Promise.all([mailEntryModelPromise, contractItemByEmail, signaturePromise]);
        })
        .then(async (rs: [MailEntryModel, MailBoxEntryContactInfoModel[], ResponseSignature]) => {
          console.log('[mail]***** write mail model:', rs);
          let mailContentModel = rs[0] as MailEntryModel;
          const res = rs[1] as MailBoxEntryContactInfoModel[];
          const sig = rs[2] as ResponseSignature;
          let { content } = mailContentModel.entry.content;
          // 过滤存在的 'paste-img-title' 'paste-img-reload' 未完成上传的图片的标识
          // 可能是我们这发不出去然后复制到其他端发出去了，然后我们收到的内容带这些
          if (content.includes('paste-img-title') || content.includes('paste-img-reload')) {
            content = content.replace(/paste-img-((title)|(reload))/g, '');
          }
          mailContentModel.entry.content.isHtml = true;
          // 拼接签名
          if (sig && sig.enable && param.writeType !== 'editDraft' && param.writeType !== 'edit' /* && param.writeType !== 'forwardAsAttach' */) {
            // content = `<div></div><div></div>${this.attachmentInsertPos}${(sig.content)}<div></div>` + content;
            content = this.htmlApi.mergeHtmlStr(`${this.contentBlockLine(4)}${sig.content}`, content);
          }
          // 套壳子
          const con = this.buildInitContent(param);
          content = this.htmlApi.mergeHtmlStr(con, content);

          mailContentModel.entry.content.content = content;
          mailContentModel.entry.writeLetterProp = param?.writeType;
          const user = this.systemApi.getCurrentUser(_account);
          if (!user) {
            this.eventApi.sendSimpleSysEvent('logout');
            throw new Error('not login , why?');
          }
          // 在回复 回复全部的场景中使用表扬邮件
          // 如果sender没有 sender.contact.contact.id 就会发信失败

          // 初始化默认发件人，1.24之前是在写信页面处理的，最终到 dosendmail 方法里的content.aliasSender
          // 24发现的线上问题是，读信快捷回复没用使用默认发件人发信 原因就是没有走写信页面的初始化
          // 可以在快捷回复的入口处除了，也可以在此处集中处理
          // 只处理主账号的 只有主账号的 主邮箱和别名邮箱可以被设置为默认邮箱
          // 主账号
          const mainAndAliaAccounts: MailAliasAccountModel[] = await this.mailConfApi.getMailSenderInfo();
          // 主账号的默认发件人邮箱
          const defAccount = mainAndAliaAccounts.find(item => item.isDefault);
          // 主账号的主邮箱
          const mainAccount = mainAndAliaAccounts.find(item => item.isMainEmail);
          // 只有主账号才处理
          if (mainAccount?.id === user?.id && defAccount) {
            mailContentModel.aliasSender = {
              name: '',
              id: defAccount.id,
              nickName: defAccount.senderName,
              mailEmail: defAccount.mailEmail,
              domain: '',
            };
          }
          mailContentModel.sender = this.buildRawContactItem(
            {
              item: '',
              name: user?.nickName || ' ',
              email: user?.id || '',
              type: '',
              id: user?.contact?.contact?.id,
            },
            _account
          );
          if (res && res.length > 0) {
            res.forEach(it => {
              if (it && it.contactItem.contactItemVal && it.contactItem.contactItemVal.length > 0) {
                mailContentModel.receiver.push(it);
              }
            });
          }

          mailContentModel.originMailId = param.id;
          await this.modelHandler.handleMailContentReplace(mailContentModel, 'writeLetterSinceExist', param.writeType);
          // 作为附件转发
          if (param.writeType === 'forwardAsAttach') {
            this.modelHandler.saveEntryToStore(mailContentModel, undefined, mailContentModel?.entry?.attachment || undefined);
          } else {
            mailContentModel = this.modelHandler.updateLocalContent(mailContentModel);
          }
          console.log('[mail]***** final write mail model:', mailContentModel, param?.writeType);
          // 与本地草稿进行对比整合(主账号独有)
          if (param?.writeType === 'editDraft' && extraData && extraData?.draftVersionId) {
            const mergedModel = await this.localDraftMerge(extraData.draftVersionId as string, mailContentModel);
            return mergedModel;
          }
          // _account 现流程是必须的 兜底
          if (!mailContentModel._account) {
            mailContentModel._account = _account || '';
          }
          return mailContentModel;
        })
        .catch(reason => Promise.reject(this.commonCatch(reason)))
    );
  }

  async localDraftMerge(draftVersionId: string, remoteModel: MailEntryModel) {
    const curDraft = await this.db.getById(mailUnfinishedMailTable, draftVersionId);
    console.log('curDraftcurDraft', curDraft, remoteModel);
    // 在远端的基础上改
    // 正文 发信收信人 以本地为主
    // 附件以远端为主，远端不存在则不予以复原

    const newModel = { ...remoteModel };

    const {
      cid,
      entry: { content: draftContent, title: draftTitle, attachment: draftAttachment },
      sender: draftSender,
      receiver: draftReceiver,
    } = curDraft as MailEntryModel;

    const {
      entry: { content: remoteContent, attachment: remoteAttachment },
    } = remoteModel;

    // 内联附件
    const finalAttachment: MailFileAttachModel[] = remoteAttachment || [];
    let finalContent = draftContent.content || '';
    try {
      // 本地草稿存在内联附件
      if (draftContent.content && remoteContent.content) {
        if (/data-timedate="\d+"/g.test(draftContent.content)) {
          const parser1 = new DOMParser();
          const doc1 = parser1.parseFromString(draftContent.content, 'text/html');
          const allImg1 = doc1.getElementsByTagName('img');

          const parser2 = new DOMParser();
          const doc2 = parser2.parseFromString(remoteContent.content, 'text/html');
          const allImg2 = doc2.getElementsByTagName('img');
          Array.from(allImg1).forEach((item1, index1) => {
            const {
              dataset: { timedate },
            } = item1;
            if (timedate) {
              const findImg = Array.from(allImg2).find(item2 => item2?.dataset?.timedate === timedate);
              if (findImg) {
                doc1.getElementsByTagName('img')[index1].src = findImg.src;
              }
            }
          });
          finalContent = doc1.documentElement.innerHTML;
        }
      }
    } catch (error) {
      console.log('内联附件替换失败', error);
      // 用远端兜底
      finalContent = remoteContent.content || '';
    }

    // 不可恢复数目
    // 本地草稿可能存储deleted为true的数据
    const filteredDraftAttachment = (draftAttachment || []).filter(item => {
      const { deleted, type, fileStatus } = item;
      // 已删除
      if (deleted) return false;
      // 上传类型但未上传完成
      if (type === 'upload' && fileStatus !== 'uploaded') return false;
      return true;
    });
    const unableRecoverAttCount = filteredDraftAttachment.length - finalAttachment.length;

    return {
      ...newModel,
      // 正文 发信/收信人等 以本地为主
      sender: draftSender,
      receiver: draftReceiver,
      entry: {
        ...newModel.entry,
        content: { ...draftContent, content: finalContent },
        title: draftTitle,
        attachment: finalAttachment,
        attachmentCount: finalAttachment.length,
      },
      unableRecoverAttCount: unableRecoverAttCount > 0 ? unableRecoverAttCount : 0,
      recoverCid: cid,
    };
  }

  // buildCloudAttMailEntryModel(param: WriteMailInitModelParams) {
  //   const signaturePromise = this.mailSigApi.doGetDefaultSign();
  //   const mailContentModel = this.buildEmptyMailEntryModel(param);
  //   // if (contractItemByEmail) {
  //   return signaturePromise.then(
  //     (sig: ResponseSignature) => {
  //       if (sig && sig.enable) {
  //         // mailContentModel.entry.content.content += `<div></div><div></div>${(sig.content)}`;
  //
  //         let contentCombine = ''; // content为空的时候需要有placeholder，不能有两个div做空行
  //         // 邮件本身有内容开头处加空行
  //         if (sig.content) {
  //           contentCombine = `<div></div><div></div>${(
  //             sig.content
  //           )}`;
  //         }
  //         mailContentModel.entry.content.content = this.htmlApi.mergeHtmlStr(
  //           mailContentModel.entry.content.content, contentCombine,
  //         );
  //       }
  //
  //       // 将定制签名的A标签替换 handleSignatureTag()
  //       const readMail = true; // 读信
  //       const needHtml = false; // 不需要包裹html标签
  //       this.modelHandler.getTransferHtml(mailContentModel.entry.content, readMail, needHtml);
  //       return mailContentModel;
  //     },
  //   );
  // }
  //

  // private handleSendMailContactInitModel(
  //   writeType: WriteLetterPropType,
  //   mailContentModel: MailEntryModel,
  // ) {
  //   if (writeType === 'common' || writeType === 'forward' || writeType === 'forwardAsAttach') {
  //     mailContentModel.receiver = [];
  //   } else if (writeType === 'reply' || writeType === 'replyWithAttach') {
  //     mailContentModel.sender.mailMemberType = 'to';
  //     mailContentModel.receiver = [mailContentModel.sender];
  //   } else if (writeType === 'replyAll' || writeType === 'replyAllWithAttach') {
  //     // const currentUser = this.systemApi.getCurrentUser();
  //     const { sender } = mailContentModel;
  //     const user = this.systemApi.getCurrentUser();
  //     if (!user) {
  //       this.eventApi.sendSimpleSysEvent('logout');
  //       throw new Error('not login , why?');
  //     }
  //     // 2021.9.33 mailContentModel.receiver 新增一项过滤条件：过滤掉自己(it.contactItem.contactItemVal !== user.id)
  //     mailContentModel.receiver = mailContentModel.receiver.filter(
  //       it => it.mailMemberType !== 'bcc' && it.contactItem.contactItemVal && it.contactItem.contactItemVal !== sender.contactItem.contactItemVal
  //         && it.contactItem.contactItemVal !== user.id,
  //     ).map(it => {
  //       if (it.mailMemberType === 'to') {
  //         it.mailMemberType = 'cc';
  //       }
  //       return it;
  //     });
  //     sender.mailMemberType = 'to';
  //     mailContentModel.receiver.push(mailContentModel.sender);
  //     const map: StringMap = {};
  //     if (mailContentModel.receiver.length > 1) {
  //       mailContentModel.receiver = mailContentModel.receiver.filter(
  //         it => {
  //           // if (it.contactItem.contactItemVal === currentUser?.id) {
  //           //   return false;
  //           // }
  //           if (it.contactItem.contactItemVal === sender.contactItem.contactItemVal && it !== sender) {
  //             return false;
  //           }
  //           if (map[it.contactItem.contactItemVal]) {
  //             return false;
  //           }
  //           map[it.contactItem.contactItemVal] = '';
  //           return true;
  //         },
  //       );
  //     }
  //   }
  // }

  private buildEmailContent(email: string, name?: string): string {
    if (!email) {
      return '';
    }
    return name ? `${name}&lt;<a href="mailto:${email}">${email}</a>&gt;` : email;
  }

  doWriteMailToContact(contact?: string[], _account?: string): WriteMailInitModelParams {
    const params: WriteMailInitModelParams = {
      contact: contact || [],
      writeType: 'common',
      mailType: 'common',
      _account,
    };
    return this.callWriteLetterFunc(params);
    // throw new Error("not implemented");
  }

  doWriteMailFromLink(contact: string[], title: string, originContent: string, _account?: string): WriteMailInitModelParams {
    const params: WriteMailInitModelParams = {
      contact: contact || [],
      title: title || '',
      originContent: originContent || '',
      withoutPlaceholder: !!originContent,
      writeType: 'common',
      mailType: 'common',
      _account,
    };
    return this.callWriteLetterFunc(params);
  }

  // 给客服写信
  async doWriteMailToServer(): Promise<void> {
    const deviceInfo = await api.getSystemApi().getDeviceInfo();
    // V${deviceInfo._systemVersion}
    const title = `【问题反馈】网易灵犀${capitalize(deviceInfo._system)}端${config('version')}`;
    const originContent = await this.getMailCont(deviceInfo);
    const contact = ['kf@office.163.com']; // 客服
    const ccContact = ['feedback_desktop@office.163.com']; // 灵犀项目组
    const params: WriteMailInitModelParams = {
      title,
      contact,
      ccContact,
      originContent,
      writeType: 'common',
      mailType: 'common',
      extraOperate: 'questionApply',
    };
    this.callWriteLetterFunc(params);
  }

  async doWriteMailToWaimaoServer(): Promise<void> {
    const deviceInfo = await api.getSystemApi().getDeviceInfo();
    // V${deviceInfo._systemVersion}
    const title = `【问题反馈】网易外贸通${capitalize(deviceInfo._system)}端${config('version')}`;
    const originContent = await this.getMailCont(deviceInfo);
    const contact = ['kf@office.163.com']; // 客服
    const ccContact = ['feedback_waimao@office.163.com']; // 灵犀项目组
    const params: WriteMailInitModelParams = {
      title,
      contact,
      ccContact,
      originContent,
      writeType: 'common',
      mailType: 'common',
      extraOperate: 'questionApply',
    };
    this.callWriteLetterFunc(params);
  }

  // 邮件主体
  async getMailCont(deviceInfo: DeviceInfo): Promise<string> {
    const getNetCond = async (): Promise<string> => {
      if (window?.electronLib?.appManage) {
        const path = (config('host') || '') as string;
        const host = new URL(path).hostname;
        try {
          const res = await window.electronLib.appManage.getNetState(host);
          const post = {
            host,
            electron_online: navigator.onLine,
            dns_lookup_v4: res[0],
            dns_lookup_v6: res[1],
            dns_resolveAny: res[2],
            traceroute: res[3],
          };
          return JSON.stringify(post);
        } catch (error) {
          return '';
        }
      }
      return '';
    };
    const currentUser = this.systemApi.getCurrentUser();
    const netCond: string = await getNetCond();
    return `您好，请填写以下信息，能帮助我们更快的了解您的困扰<br/><br/>
      <strong>问题说明（可包含截图）：</strong><br/><br/>
      <strong>复现步骤：</strong><br/><br/>
      <strong>账号名：</strong>${currentUser?.id}<br/><br/>
      <strong>问题发生时间点：</strong>一分钟前？<br/><br/>
      以下信息能帮助我们了解问题<strong>（请勿删除）：</strong><br/>
      设备信息：<br/>${JSON.stringify(deviceInfo)}<br/>
      构建信息：<br/>${config('version') + '-' + config('versionTime')}<br/>
      ${netCond ? `网络监控：<br/>${JSON.stringify(netCond)}` : ''}
    `;
  }

  doMarkMailPerferred(email: string[], priority: EmailListPriority, op: MailPerferedOpType, _account?: string): Promise<CommonBatchResult> {
    const key = 'markPreferred';
    const url = this.buildUrl(key, undefined, undefined, _account);
    const data = { email, priority, op };
    return this.impl
      .post(url, data, this.getConfigForHttp(key, { data, url, _account }))
      .then(this.unpackData.bind(this))
      .then(res => {
        if (res.code === MailContentHandler.sOk) {
          return {
            succ: true,
          };
        }
        return Promise.reject(this.getErrMsg(res.code));
      });
  }

  doMarkMailInfFolder(mark: boolean, fid: number, isTread = false, _account?: string): Promise<CommonBatchResult> {
    const key = 'markAllMail';
    const url = this.buildUrl(key, undefined, undefined, _account);
    const data = isTread ? { fid, read: mark, threads: isTread } : { fid, read: mark };
    return this.impl
      .post(url, data, { ...(this.getConfigForHttp(key, { data, url }) || {}), _account })
      .then(this.unpackData.bind(this))
      .then(res => {
        if (res.code === MailContentHandler.sOk) {
          return {
            succ: true,
          };
        }
        return Promise.reject(this.getErrMsg(res.code));
      });
  }

  // 无引用
  doGetAllComposingMailId(): number[] {
    // 废弃？
    const ids: number[] = [];
    this.actions.writingMailIds.forEach(it => {
      ids.push(parseInt(it.replace(MailModelHandler.mailPrefix, ''), 10));
    });
    return ids;
  }

  doWithdrawMail(mid: string, tid?: string, _account?: string): Promise<MailDeliverStatus> {
    console.log('[mail] withdraw mail for' + mid, tid);
    const key1 = 'withdrawSending';
    const url = this.buildUrl(key1, { action: 'recallMessage' }, undefined, _account);
    const data2 = tid ? { mid, tid } : { mid };
    return this.impl
      .post(url, data2, { ...(this.getConfigForHttp(key1, { url, data: data2 }) || {}), _account })
      .then(this.unpackData.bind(this))
      .then((res: ResponseData<ResponseWithDrawResult>) => {
        const key = 'checkPostMail';
        const url = this.buildUrl(key, undefined, undefined, _account);
        const data1 = { mid };
        if (res.code === 'FA_UNSUPPORT_RECALL') {
          this.eventApi.sendSysEvent({
            eventName: 'error',
            eventLevel: 'error',
            eventStrData: '',
            eventData: {
              popupType: 'toast',
              popupLevel: 'info',
              title: getIn18Text('CHEHUISHIBAI！CHEHUI'),
              content: getIn18Text('CIYOUJIANWUFABEICHE'),
              code: 'PARAM.ERR',
            } as PopUpMessageInfo,
            eventSeq: 0,
          });
          // eslint-disable-next-line prefer-promise-reject-errors
          return Promise.reject(getIn18Text('CHEHUISHIBAI！CHEHUI'));
        }
        const apiResponsePromise = this.impl.post(url, data1, this.getConfigForHttp(key, { url, data: data1 }));
        return apiResponsePromise.then(this.unpackData.bind(this)).then((status: ResponseData<ResponseDeliverStatus[]>) => {
          if (status.code === 'FA_MAIL_NOT_FOUND') {
            this.eventApi.sendSysEvent({
              eventName: 'error',
              eventLevel: 'error',
              eventStrData: '',
              eventData: {
                popupType: 'toast',
                popupLevel: 'info',
                title: getIn18Text('CHEHUISHIBAI'),
                content: getIn18Text('YOUJIANBUCUNZAI，WU'),
                code: 'PARAM.ERR',
              } as PopUpMessageInfo,
              eventSeq: 0,
            });
            // eslint-disable-next-line prefer-promise-reject-errors
            return Promise.reject('邮件不存在，无法撤回');
          }
          if (status.code === 'FA_UNSUPPORT_RECALL') {
            this.eventApi.sendSysEvent({
              eventName: 'error',
              eventLevel: 'error',
              eventStrData: '',
              eventData: {
                popupType: 'toast',
                popupLevel: 'info',
                title: getIn18Text('CHEHUISHIBAI'),
                content: getIn18Text('CIYOUJIANWUFABEICHE'),
                code: 'PARAM.ERR',
              } as PopUpMessageInfo,
              eventSeq: 0,
            });
            // eslint-disable-next-line prefer-promise-reject-errors
            return Promise.reject('此邮件无法被撤回，可能原因为该邮件暂未发送成功');
          }
          if (status.code === 'FA_MAIL_EXPIRED') {
            this.eventApi.sendSysEvent({
              eventName: 'error',
              eventLevel: 'error',
              eventStrData: '',
              eventData: {
                popupType: 'toast',
                popupLevel: 'info',
                title: getIn18Text('CHEHUISHIBAI'),
                content: getIn18Text('YOUJIANYICHAOGUOKECHA'),
                code: 'PARAM.ERR',
              } as PopUpMessageInfo,
              eventSeq: 0,
            });
            // eslint-disable-next-line prefer-promise-reject-errors
            return Promise.reject('邮件已超过可查询撤回状态时间');
          }
          if (status.code === MailOperationHandler.sOk) {
            if (res && res.code === MailContentHandler.sOk && res.var) {
              const result: MailDeliverStatus = {
                status: res.code as MailOperationStatus,
                detail: [],
                tid: tid || '',
              };
              const data = res.var.recallresult;
              const contactList: string[] = [];
              if (data) {
                // for (const i in data)
                Object.keys(data).forEach(i => {
                  if (i && Object.prototype.hasOwnProperty.apply(data, [i]) && typeof data[i] === 'number') {
                    contactList.push(i);
                    result.detail.push({
                      result: data[i] as number,
                      email: i,
                      mid,
                    } as MailDeliverStatusItem);
                  }
                });
              }
              return this.contactHandler
                .getContractItemByEmail(contactList, '')
                .then((ret: MailBoxEntryContactInfoModel[]) => {
                  // console.log(ret);
                  const contactMap: StringTypedMap<ContactModel> = {};
                  if (ret && ret.length > 0) {
                    ret.forEach(it => {
                      contactMap[it.contactItem.contactItemVal] = it.contact;
                    });
                  }

                  result.detail.forEach(it => {
                    it.contact = contactMap[it.email];
                    if (it.contact) {
                      it.contactName = it.contact.contact.contactName;
                      it.avatar = it.contact.contact.avatar || it.contact.contact.contactLabel;
                    }
                  });
                  return result;
                })
                .catch(reason => {
                  console.warn(reason);
                  return result;
                });
            }
            return Promise.reject(this.getMailErrMsg(res));
          }
          // eslint-disable-next-line prefer-promise-reject-errors
          return Promise.reject('未知发送状态');
        });
      });
  }
  callWriteLetterFunc(params: WriteMailInitModelParams): WriteMailInitModelParams {
    const { writeWay, optSenderStr, id: originId, writeType, _account } = params;
    // 取主账号
    const targetActions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
    })?.val;
    const isInSubWindow = !locationHelper.isMainPage();
    const inElectron = this.systemApi.isElectron() && window.electronLib;
    // 埋点是否得更换？
    this.dataTracker.track('pcMail_view_writeMailPage');

    // 非主界面 借助 主界面触发 曲线调用写信
    if (inElectron && isInSubWindow) {
      // 桌面端
      /** 非主窗口=>主窗口=>写信窗口   */
      this.eventApi.sendSysEvent({
        eventName: 'openWritePageFromMain',
        eventData: params, // 包含_account
        eventSeq: -1,
        eventStrData: '',
        _account,
      } as SystemEvent);
      return {};
    }

    // 开始
    this.eventApi.sendSysEvent({
      eventName: 'writePageDataExchange',
      eventData: params,
      eventStrData: 'start',
    } as SystemEvent);

    // 数据初始化
    // 原有的无用_account作为传递参数
    if (params.appointAccount) {
      // accountApi.setCurrentAccount({ email: params.appointAccount });
      params._account = params.appointAccount;
    }
    if (params.mailFormClickWriteMail) {
      // accountApi.setCurrentAccount({ email: params.mailFormClickWriteMail });
      params._account = params.mailFormClickWriteMail;
    }
    trackApi.track('callWriteLetterFunc_params', {
      params: JSON.stringify(params),
    });
    const initModelPromise = this.mailApi.initModel(params);

    // 桌面端 指定以新窗口方式创建
    if (inElectron && writeWay === 'newWin') {
      const createWindowResPromise = this.systemApi.createWindow({ type: 'writeMail', manualShow: false });
      Promise.all([createWindowResPromise, initModelPromise]).then((result: [CreateWindowRes, MailEntryModel]) => {
        const res0 = { ...result[0] };
        const res1 = { ...result[1] };
        console.log('[mail] ******** write mail init model && create window return', result);
        if (res0 && res0.webId !== undefined) {
          if (MailContentHandler.debugMailPopWindow) {
            window.electronLib.windowManage.toggleDevTools(res0.winId);
          }
          const hintId = String(Date.now());
          res1.extData = res1.extData ? { ...res1.extData, hintId } : { hintId };
          res1.optSenderStr = optSenderStr || '';
          if (targetActions) targetActions.mailParamMap[res0.webId] = res1;
          // 窗口已经有了 复用就行 向指定目标
          if (targetActions && targetActions.paramDispatched.has(res0.webId)) {
            this.sendDataToWritePage(res1, res0.webId, params);
          }
        }
      });
    } else if (!this.systemApi.isInWebWorker()) {
      // 一般情况 创建新标签 而不是新窗口
      console.log('[mail] send write mail event', params);
      const timestamp = String(new Date().getTime());
      this.eventApi.sendSysEvent({
        eventName: 'preCreateWriteTab',
        eventData: {
          tabTempId: timestamp,
          originId,
          writeType,
          _account: params._account,
        },
      } as SystemEvent);
      initModelPromise
        .then((res: MailEntryModel) => {
          res.optSenderStr = optSenderStr || '';
          this.sendDataToWritePage(
            {
              ...res,
              tabTempId: timestamp,
            },
            null,
            params
          );
        })
        .catch(error => {
          console.log('initModelError', error);
          this.eventApi.sendSysEvent({
            eventName: 'destoryWriteTab',
            eventData: {
              tabTempId: timestamp,
              originId,
              writeType,
            },
          } as SystemEvent);
        });
    }
    return params;
  }

  // 发送写信数据 - 数据初始化 initData
  // maildata 指定窗口 造信参数
  sendDataToWritePage(eventData: MailEntryModel, eventTarget: number | null, params: unknown) {
    this.eventApi
      .sendSysEvent({
        eventName: 'writePageDataExchange',
        eventData,
        eventStrData: 'initData',
        eventTarget: eventTarget ? String(eventTarget) : undefined,
        _account: (params as WriteMailInitModelParams)?._account || '',
      })
      ?.then(() => {
        console.log('写信初始化数据发送成功');
      })
      ?.catch(ex => {
        console.error(ex);
        this.errReportApi.doReportMessage({
          error: '写信数据发送失败：' + ex.message,
          data: params,
          id: eventData,
        });
      });
  }

  doSaveMailInitParamLocal(content: WriteMailInitModelParams): void {
    this.modelHandler.saveInitModelToStore(content);
  }

  doLoadMailInitParamLocal(mid: string): WriteMailInitModelParams | undefined {
    return this.modelHandler.loadInitModelToStore(mid);
  }

  doSaveMailLocal(content: MailEntryModel) {
    this.modelHandler.saveEntryToStore(content).then();
  }

  doGetReplayContentModel(content: WriteMailInitModelParams): Promise<MailEntryModel> {
    if (!content || !content.id || !content.writeType) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject('调用需要提供邮件id和发信类型');
    }
    return this.mailApi.initModel(content);
    // return this.mailApi.doGetMailContent(content.id, true).then(res => {
    //   this.handleSendMailContactInitModel(content.writeType || 'replyAll', res);
    //   return res;
    // });
  }

  buildRawContactItem(item: ParsedContact, _account?: string): MailBoxEntryContactInfoModel {
    return this.contactHandler.buildRawContactItem(item, _account);
  }

  private transAttachmentToResponseAttachment(attachments: RequestComposeMailAttachment[] | undefined): ResponseAttachment[] {
    const ret: ResponseAttachment[] = [];
    if (attachments && attachments.length > 0) {
      attachments.forEach(it => {
        ret.push({
          id: it.id,
          inlined: it.inlined,
          filename: it.displayName || it.name,
          contentLength: it.size,
        } as ResponseAttachment);
      });
    }
    return ret;
  }

  // 一键翻译
  async getTranslateContent(content: string, from: string, to: string, _account?: string): Promise<TranslatResModel> {
    const url = this.systemApi.getUrl('getTranslateContentByHtml');
    // let data = this.setTranslateData(content, from, to)
    const paramData = { q: content, from, to };
    console.log('getTranslateContent======data', paramData);
    const { data } = await this.impl.post(url, paramData, { dataType: 'jsonp', _account });

    if (data && data.code === 0 && data.data.translation[0]) {
      try {
        data.data.translation[0] = data.data.translation[0].replace(/nextSibling/g, 'nextElementSibling');
      } catch {
        console.log('translation=replace=defeated');
      }
    }
    return data as TranslatResModel;
    // return this.impl.post(url, paramData, { dataType: 'jsonp' }).then(res => res.data as TranslatResModel);
  }

  // 检测是邮件内容是什么语言
  async detectMailContentLang(content: string): Promise<MailContentLangResModel | null> {
    const url = this.systemApi.getUrl('detectMailContentLang');
    try {
      const { data } = await this.impl.post(
        url,
        {
          content,
        },
        { contentType: 'json' }
      );

      if (data && data.code === 0 && data.data) {
        return data.data as MailContentLangResModel;
      }
    } catch (error) {
      console.error('[mail_impl] detectMailContentLang error', error);
      return {
        detected: true,
        lang: 'en',
      };
    }

    return {
      detected: false,
      lang: '',
    };
  }

  // 英文文本纠错
  async getEnglishGrammar(content: string, _account?: string): Promise<GrammarResponse | null> {
    const url = this.systemApi.getUrl('getEnglishGrammar');
    const paramData = { q: content, grade: 'default' };
    const { data } = await this.impl.post(url, paramData, { contentType: 'json', _account });
    if (data && data.code === 0) {
      return JSON.parse(data?.data) as GrammarResponse;
    }
    return null;
  }

  async syncTranslateContentToDb(mid: string, langType: string, conditions?: string, _account?: string): Promise<boolean> {
    return this.mailDbHanlder.syncTranslateContentToDb(mid, langType, conditions, _account);
  }

  async syncContentLangToDb(mid: string, originLang: string, _account?: string): Promise<boolean> {
    return this.mailDbHanlder.syncContentLangToDb(mid, originLang, _account);
  }
}
