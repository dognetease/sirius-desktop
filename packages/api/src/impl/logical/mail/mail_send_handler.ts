/* eslint-disable max-len */
/* eslint-disable max-statements */
/* eslint-disable max-params */
/* eslint-disable no-nested-ternary */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable max-lines */
import { config } from 'env_def';
import lodashGet from 'lodash/get';
import {
  ActionStore,
  IMailRecpErrMap,
  mailBoxOfSent,
  MailRecpErrMap,
  RequestAttachmentUpload,
  RequestComposeMail,
  RequestComposePraiseMail,
  RequestComposeTaskMail,
  RequestComposeMailAttachment,
  ResponseComposeMail,
  ResponseMailUploadCloud,
  ResponsePieceUploadMailAttachment,
  ResponseUploadedAttachment,
  ResponseVarModel,
  AttachmentFromServerModel,
  RequestComposeMailAttrs,
  SubActionsType,
} from './mail_action_store_model';
import { MailModelHandler } from './mail_entry_helper';
import { MailContactHandler } from './mail_obtain_contact_helper';
import { MailContentHandler } from './mail_content_handler';
import { MailAbstractHandler, xMailerExt } from './mail_abs_handler';
import {
  MailEntryModel,
  MailFileAttachModel,
  MailSendErrMsgInfo,
  MailSendOperation,
  UploadAttachmentFlag,
  WriteMailInitModelParams,
  MailEmoticonInfoModel,
  EmoticonCreateModel,
  InvolvedRecordsModel,
  WriteLetterPropType,
  ResponseMailUploadCloudToken,
  MailConfigQuickSettingModel,
  DoCancelDeliverParams,
  DeleteAttachmentRes,
  DoUploadAttachmentParams,
  MailConfigDefaultCCBCCModel,
  AuthCodeDesc,
  DoImmediateDeliverParams,
  ReUploadInfo,
  RespDoTransferAtts,
  GuessUserSettingModel,
} from '@/api/logical/mail';
import { PopUpMessageInfo } from '@/api/_base/api';
import { ApiResponse, constHttpCanceledToken, LoaderActionConf, ResponseData } from '@/api/data/http';
import { StringMap } from '@/api/commonModel';
import { FileAttachModel, FileSourceType, UploadPieceHandler, CloudUploaderCommonArgs } from '@/api/system/fileLoader';
import { ErrMsgCodeMap, ErrMsgType } from '@/api/errMap';
import { MailOperationHandler } from './mail_operation_handler';
import { util, wait } from '@/api/util';
import systemApi from '../../api_system/system_impl';
import { MailContentDbHelper } from '@/impl/logical/mail/mail_content_db_handler';
import { StoredLock, StoredSequence } from '@/api/data/store';
import { mailPerfTool } from '@/api/util/mail_perf';
import { AccountApi } from '@/api/logical/account';
import { api } from '@/api/api';
import { apis, getUrlFinal, inWindow } from '@/config';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { MailDraftApi } from '@/api/logical/mail_draft';
import { PerformanceApi } from '@/api/system/performance';
import { ProductAuthApi, ProductAuthorityFeature } from '@/api/logical/productAuth';
import { getIn18Text } from '@/api/utils';
import { IMailClientConfig } from '@/api/logical/login';

type MailComposeType = RequestComposeMail | RequestComposePraiseMail | RequestComposeTaskMail;

// 修改上下文参数
interface ModifyUploadContextParams {
  context: string;
  dirId?: number;
  fileId: number;
  nosKey: string;
  fileSize: number;
}

interface PrecheckParams {
  cid?: string;
  element?: MailEntryModel;
  attach: File | undefined;
  uploadWay: 'normal' | 'cloud';
  _account?: string;
}

type AttrObj = {
  id: number;
  purpose?: 'addAtt' | 'deleteAtt' | '';
  attachment?: MailFileAttachModel;
};

type DoSaveTempParams = {
  content: MailEntryModel;
  saveDraft?: boolean;
  auto?: boolean;
  attrObj?: AttrObj;
  _account?: string;
  callPurpose?: string;
};

type DoGenerateNewMailParams = {
  content: MailEntryModel;
  generateAccount?: string;
  withCloudAtt?: boolean; // 是否带着云附件重生
  latestedCont?: string; // 自带最新内容
};

/**
 * 信件发送相关操作
 */
export class MailSendHandler extends MailOperationHandler {
  attachmentInsertPos = '<i class="tmp-for-cloud-upload-replacement" style="">&nbsp;</i>';

  readonly concurrentUpload: number = 3;

  sequence: StoredSequence;

  accountApi: AccountApi;

  dataTrackApi: DataTrackerApi;

  performanceApi: PerformanceApi;

  draftApi: MailDraftApi;

  productAuthApi: ProductAuthApi;

  static readonly mailAttachmentUploadHost: string = config('mailAttachmentUploadHost') as string;

  sliceLen: number = 1 * 1024 * 1024;

  // eslint-disable-next-line no-useless-constructor
  constructor(actions: ActionStore, modelHandler: MailModelHandler, contactHandler: MailContactHandler, mailDbHandler: MailContentDbHelper, subActions?: SubActionsType) {
    // action改造
    super(actions, modelHandler, contactHandler, mailDbHandler, subActions);
    this.sequence = this.storeApi.getSeqHelper('attachment-upload', 0);
    this.accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
    this.dataTrackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
    this.draftApi = api.requireLogicalApi(apis.mailDraftApiImpl) as MailDraftApi;
    this.performanceApi = api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
    this.productAuthApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
  }

  /**
   * 整体构建附件思路 ：
   * continue 可以传入新的未知附件，包括 -1 为id的待上传附件
   * save 和 deliver 传入未知attachmentId的附件会报错，故去除掉已经delete的附件以及-1类型的附件
   * 此外，同名附件上传多次后会重复，故需要上传前进行去重处理
   * 云附件需要在发送前构建成最终html数据，其他情况不处理
   * @param content
   * @param attachments
   * @param operation
   * @param auto
   * @private
   */
  private buildAttachmentReq(content: MailEntryModel, attachments: RequestComposeMailAttachment[], operation: MailSendOperation, auto?: boolean, purpose?: string) {
    const html = content.entry.content.content;
    let attachmentHtml = '';
    const originAtta = content.entry.attachment;
    let attachmentSendStr = '';
    (Array.isArray(originAtta) ? originAtta : [originAtta]).forEach(it => {
      attachmentSendStr += JSON.stringify(it, (_: string, v: any) => {
        if (v instanceof File) {
          // console.log('file not stringify '+k);
          return undefined;
        }
        return v;
      });
    });

    console.log('[mail-send] send attachment :', attachmentSendStr, auto);
    this.loggerApi.track('mail_attachment_will_send', {
      attachment: attachmentSendStr,
      auto,
    });
    if (!originAtta || originAtta.length === 0) {
      return;
    }

    originAtta.forEach(it => {
      if (it.type === 'url') {
        // if (it.deleted === undefined || !it.deleted || operation !== 'deliver') {
        // 内联附件 状态同步 SIRIUS-3304 1.23.0
        // 以前有个判断 operation === 'continue' it.deleted === undefined  it.deleted === false
        // 只有这三种情况才在发信的时候带上，但是这样会将it.deleted === true的漏掉 导致页面删除的附件发信的时候还是带上了
        attachments.push({
          id: it.id,
          name: it.fileName,
          // displayName: it.fileName,
          inlined: it.inlined,
          // type: it.type=='upload',
          deleted: it.deleted,
          // type: 'internal',
        });
        // }
      } else if (it.type === 'fromInternalMail') {
        const id = it?.fromServer ? it.id : -1;
        if ((it.deleted === undefined || !it.deleted) && operation === 'continue' && id === -1 && it.midOfSourceMail && it.partOfSourceMail) {
          attachments.push({
            // id,
            name: it.fileName,
            displayName: it.fileName,
            size: it.fileSize,
            // displayName: it.fileName,
            inlined: it.inlined || false,
            type: 'internal',
            _mid: it.midOfSourceMail || '',
            _part: it.partOfSourceMail || 0,
          });
        } else if (id > 0 && operation === 'continue') {
          attachments.push({
            id,
            inlined: it.inlined || false,
            deleted: it.deleted || false,
          });
        } else if (id > 0 && it.deleted && operation !== 'continue') {
          attachments.push({
            id,
            inlined: it.inlined || false,
            deleted: it.deleted || false,
          });
        }
      } else if (it.type === 'internal' || it.type === 'upload') {
        // 删除附件无需ready
        if (it.id && it.idFilled && (it.ready || purpose === 'deleteAtt')) {
          // if (operation === 'continue') {
          attachments.push({
            id: it.id,
            name: it.fileName,
            displayName: it.fileName,
            inlined: it.type === 'internal',
            // type: it.type=='upload',
            deleted: it.deleted,
          });
          // } else if (it.deleted === undefined || !it.deleted) {
          //   attachments.push({
          //     id: it.id,
          //     name: it.fileName,
          //     displayName: it.fileName,
          //     inlined: it.type === 'internal',
          //     // type: it.type=='upload',
          //     deleted: it.deleted,
          //   });
          // }
        }
      } else if (it.type === 'netfolder' || it.type === 'trs') {
        // 一般情况下continue不带云附件，除重生情况外
        if (it.fileUrl && it.ready && !it.deleted && (operation !== 'continue' || purpose === 'generateWithCloud') /* && !it.contentFilled */) {
          const downloadText = this.buildDownloadCardHTML(it);
          attachmentHtml += downloadText;
          // it.contentFilled = true;
        }
      } else if (it.type === 'netUrl') {
        const id = it?.fromServer ? it.id : -1;
        // 初始的云文档附件无id，使用continu发送获取id
        // continue可以删除有id的附件
        // 正式发送时，仅发送有id且非delete的附件
        if ((it.deleted === undefined || !it.deleted) && operation === 'continue' && id === -1) {
          attachments.push({
            id,
            name: it.fileUrl,
            displayName: it.fileName,
            size: it.fileSize,
            // displayName: it.fileName,
            inlined: it.inlined || false,
            type: 'url',
            mode: 'copy_opt',
            deleted: it.deleted || false,
          });
        } else if (id > 0 && operation === 'continue') {
          attachments.push({
            id,
            inlined: it.inlined || false,
            deleted: it.deleted || false,
          });
        } else if (id > 0 && it.deleted && operation !== 'continue') {
          attachments.push({
            id,
            inlined: it.inlined || false,
            deleted: it.deleted || false,
          });
        }
      }
    });
    if (attachmentHtml.length > 0) {
      // html = html.replace(this.attachmentInsertPos, attachmentHtml);
      attachmentHtml = `
<div id="divNeteaseSiriusCloudAttach"
     style="clear: both; margin-top: 1px; margin-bottom: 1px;font-family: verdana,Arial,Helvetica,sans-serif;
     border: 1px solid rgba(238, 238, 239, 1);box-shadow: 0px 5px 15px rgba(203, 205, 210, 0.3);border-radius: 12px;color: #262A33;"
     >
    <div style="font-size: 13px; padding: 12px 0px 12px 0px; line-height: 16px;border-bottom: 1px solid #ECECED;">
        <b style="padding-left: 12px;">灵犀办公云附件</b>
    </div>
    ${attachmentHtml}
</div>
        `;
      // content.entry.content.content = html + attachmentHtml;
      content.entry.content.content = this.htmlApi.mergeHtmlStr(html, attachmentHtml);
    }
  }

  private buildDownloadCardHTML(it: MailFileAttachModel) {
    const expiredDate = it.expired ? new Date(it.expired) : undefined;
    const fileSize = Number(it.fileSize / 1000 / 1000).toFixed(2) + 'M';
    const expiredStr = expiredDate ? util.dateFormat(expiredDate) : getIn18Text('WUQIXIAN');
    return `
     <div style="background: #fff; padding: 0px 12px;border-radius: 12px;position: relative;">
     <div style="width: 24px;position: absolute;height: 40px;left:16px;top:4px;">
     <a href="${it.fileUrl}" style="text-underline: none;">
     <img width="24px" height="24px"
     src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/06/22/ca9bd44fe5cb439f99b8507c9c0d626d.png"
     border="0" title="云附件">
     </a>
     </div>
     <div style="padding-right: 32px;margin-left: 30px; border-bottom: 1px solid rgba(38, 42, 51, 0.08);margin-top: 16px;padding-bottom: 16px;">
     <div style="margin-left: 4px;">
     <div style="padding: 1px; font-size: 14px; line-height: 14px;">
     <a style=" text-decoration: none;color: #262A33;display: block" href="${it.fileUrl}"
     target="_blank"
     rel="noopener"
     download="${it.fileUrl}">
     ${it.fileName}
     </a>
     </div>
     <div style="padding: 1px;color: #262A33;opacity: 0.4;font-size: 12px;margin-top: 4px;">
     ${fileSize}&nbsp;|&nbsp;过期时间：${expiredStr}
     </div>
     </div>
     </div>
     <a class="divNeteaseSiriusCloudAttachItem" href="${it.fileUrl}"
     download="${it.fileUrl}" file-name="${it.fileName}" file-size="${it.fileSize}" expired="${it.expired}" 
     file-type="${it.fileType}" file-mime="${it.fileMime}"
     id="${it.id}" file-id="${it.cloudIdentity}"
     style="text-decoration: none;display: block; font-size: 12px; line-height: 12px;position: absolute;right: 16px;top:50%;margin-top: -14px;color:#386EE7">下载</a>
     </div>
     `;
    /**
     return `
     <div style='background: #fff; padding: 12px;border-radius: 12px;position: relative;'>
     <div style='width: 36px;position: absolute;height: 40px;left:12px;top:50%;margin-top: -20px;' >
     <a href='${it.fileUrl}'>
     <img width='36px' height='36px'
     src='https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/06/22/ca9bd44fe5cb439f99b8507c9c0d626d.png'
     border='0' title='云附件'>
     </a>
     </div>
     <div style='padding: 1px;margin-right: 24px;margin-left: 50px;'>
     <div style='margin-left: 4px;'>
     <div style='padding: 1px; font-size: 14px; line-height: 14px;'>
     <a style=' text-decoration: none;color: #262A33;display: block' href='${it.fileUrl}' target='_blank'
     rel='noopener'
     download='${it.fileUrl}'>
     ${it.fileName}
     </a>
     </div>
     <div style='padding: 1px;color: #bbb;opacity: 0.4;font-size: 12px;' >
     ${fileSize}&nbsp;|&nbsp;过期时间：${expiredStr}
     </div>
     </div>
     </div>
     <a class='divNeteaseSiriusCloudAttachItem' href='${it.fileUrl}'
     download='${it.fileUrl}' file-name='${encodeURIComponent(
        it.fileName)}' file-size='${it.fileSize}' expired='${it.expired}' file-type='${it.fileType}'
     style=' text-decoration: none;display: block; font-size: 12px; line-height: 12px;position: absolute;right: 12px;top:50%;margin-top: -6px' >下载</a>
     </div>
     `;
     * */
  }

  async getThumbUpInfo(mid: string, tid?: string, page = 1, _account?: string): Promise<MailEmoticonInfoModel> {
    const contextUrl = this.systemApi.getUrl('getThumbUpInfo');
    const result = await this.impl
      .get(
        contextUrl,
        {
          email_mid: mid,
          email_tid: tid,
          type: 1,
          page,
          size: 20,
        },
        {
          _account,
        }
      )
      .then(this.unpackData.bind(this))
      .then((res: ResponseData) => {
        if (res.code === 0) {
          // let {involvedRecords} = res.data
          res = this.handleCurrentThumbOrder(res, _account);
          console.log('res.data=======', res.data);
          return res.data;
        }
        return Promise.reject(new Error('请求未成功'));
      })
      .catch(() => Promise.reject(new Error('request failed')));
    return result;
    // return Promise.reject(new Error('request failed'));
  }

  private handleCurrentThumbOrder(res: ResponseData, _account?: string) {
    // const currentUser = this.systemApi.getCurrentUser();
    let tmp;
    if (res.data.involvedRecords && res.data.involvedRecords.length > 0) {
      res.data.involvedRecords.forEach((record: InvolvedRecordsModel, i: number) => {
        if (record.acc_email === _account) {
          tmp = record;
          res.data.involvedRecords.splice(i, 1);
        }
      });
    }
    if (tmp) {
      res.data.involvedRecords = [tmp, ...res.data.involvedRecords];
    }
    return res;
  }

  async setThumbUpCreate(params: EmoticonCreateModel): Promise<MailEmoticonInfoModel> {
    const contextUrl = this.systemApi.getUrl('setThumbUpCreate');
    const result = await this.impl
      .post(contextUrl, params, { _account: params._account })
      .then(this.unpackData.bind(this))
      .then((res: ResponseData) => {
        if (res.code === 0) {
          res = this.handleCurrentThumbOrder(res);
          return res.data;
        }
        return Promise.reject(new Error('request failed'));
      })
      .catch(e => {
        console.warn('thumbUp error', e);
        Promise.reject(new Error('request failed'));
      });
    return result;
  }

  // 获取快捷配置
  async getMailConfig(): Promise<MailConfigQuickSettingModel> {
    const contextUrl = this.systemApi.getUrl('getMailConfig');
    const result = await this.impl
      .get(contextUrl, {})
      .then(this.unpackData.bind(this))
      .then((res: ResponseData) => {
        if (res.code === 0) {
          return res.data as MailConfigQuickSettingModel;
        }
        return Promise.reject(new Error('请求未成功'));
      })
      .catch(() => Promise.reject(new Error('getMailConfig request failed')));
    return result;
  }

  // 设置快捷设置
  async setMailConfig(params: MailConfigQuickSettingModel): Promise<boolean> {
    const contextUrl = this.systemApi.getUrl('setMailConfig');
    const result = await this.impl
      .post(contextUrl, params, { contentType: 'json' })
      .then(this.unpackData.bind(this))
      .then((res: ResponseData) => {
        if (res.code === 0) {
          return true;
        }
        return false;
      })
      .catch(e => {
        console.warn('setMailConfig error', e);
        return false;
      });
    return result;
  }

  // 获取默认抄送密送人
  async getDefaultCCBCC(): Promise<MailConfigDefaultCCBCCModel> {
    const contextUrl = this.systemApi.getUrl('getDefaultCCBCC');
    const result = await this.impl
      .get(contextUrl, {})
      .then(this.unpackData.bind(this))
      .then((res: ResponseData) => {
        if (res.code === 0) {
          return res.data as MailConfigDefaultCCBCCModel;
        }
        return Promise.reject(false);
      })
      .catch(() => Promise.reject(new Error('getDefaultCCBCC request failed')));
    return result;
  }

  // 设置默认抄送密送人
  async setDefaultCCBCC(params: MailConfigDefaultCCBCCModel): Promise<boolean> {
    const contextUrl = this.systemApi.getUrl('setDefaultCCBCC');
    const result = await this.impl
      .post(contextUrl, params, { contentType: 'json' })
      .then(this.unpackData.bind(this))
      .then((res: ResponseData) => {
        if (res.code === 0) {
          return true;
        }
        return false;
      })
      .catch(e => {
        console.warn('setDefaultCCBCC error', e);
        return false;
      });
    return result;
  }

  // 触发邮件收信插队
  async triggerReceive(params: { folderId: number; _account?: string }): Promise<boolean> {
    const contextUrl = this.systemApi.getUrl('triggerReceive');
    const reqParams = { ...params };
    delete reqParams._account;
    const result = await this.impl
      .post(contextUrl, reqParams, { contentType: 'json', _account: params._account || '' })
      .then(this.unpackData.bind(this))
      .then((res: ResponseData) => {
        if (res.code === 0) {
          return true;
        }
        return false;
      })
      .catch(e => {
        console.warn('triggerReceive error', e);
        return false;
      });
    return result;
  }

  async getAuthCodeDesc(): Promise<AuthCodeDesc[]> {
    const contextUrl = this.systemApi.getUrl('getAuthCodeDesc');
    const result = await this.impl
      .post(contextUrl, undefined, { contentType: 'json' })
      .then(this.unpackData.bind(this))
      .then((res: ResponseData) => {
        if (res.code === 0) {
          return res.data?.authCodeDesc as AuthCodeDesc[];
        }
        return [];
      })
      .catch(e => {
        console.warn('triggerReceive error', e);
        return [];
      });
    return result;
  }

  async guessUserSetting(email: string): Promise<GuessUserSettingModel | null> {
    const contextUrl = this.systemApi.getUrl('guessUserSetting');
    try {
      const result = await this.impl.post(contextUrl, { email }, { contentType: 'json' });
      const res = this.unpackData(result);
      if (res.code === 0 && res.data) {
        return res.data;
      }
    } catch (error) {
      console.error('[mail_send_handler] guessUserSetting', error);
    }
    return null;
  }

  async updateDisplayEmail(params: { bindEmail: string; bindUserName: string }): Promise<void> {
    const contextUrl = this.systemApi.getUrl('updateDisplayEmail');
    const result = await this.impl
      .post(contextUrl, params, { contentType: 'json' })
      .then(this.unpackData.bind(this))
      .then((res: ResponseData) => {
        if (res.code === 0) {
          return res.data;
        }
      })
      .catch(e => {
        console.warn('triggerReceive error', e);
      });
    return result;
  }

  async getDisplayName(emailList: string[]): Promise<{ bindUserDetail: any[] }> {
    const contextUrl = this.systemApi.getUrl('getDisplayName');
    const result = await this.impl
      .post(
        contextUrl,
        {
          bindEmail: emailList,
        },
        { contentType: 'json' }
      )
      .then(this.unpackData.bind(this))
      .then((res: ResponseData) => {
        if (res.code === 0) {
          return res.data;
        }
        return { bindUserDetail: [] };
      })
      .catch(e => {
        console.warn('triggerReceive error', e);
        return { bindUserDetail: [] };
      });
    return result;
  }

  async doDeleteAttachment(params: {
    cid: string;
    realId?: number;
    attachId: number | string;
    attachmentObj?: MailFileAttachModel;
    _account?: string;
  }): Promise<DeleteAttachmentRes> {
    const { cid, realId, attachId, attachmentObj, _account } = params;
    const lockName = MailAbstractHandler.COMMON_DEL_ATTACHMENT_LOCK_NAME + '-' + cid;
    const deleteLock = this.storeApi.getLock(lockName, this.delLockExpiredTime, false, true);
    try {
      await deleteLock.lock();
      const element = await this.modelHandler.loadEntryFromStore(cid);
      if (!element) {
        return Promise.reject(new Error('mail not exist'));
      }
      if (!element.entry.attachment) {
        return Promise.reject(new Error('attachments not exist'));
      }
      let fileAttachModels = null;
      // api层唯一值
      if (realId) {
        fileAttachModels = element.entry?.attachment?.filter(it => it?.realId === realId);
      }
      if (!fileAttachModels) {
        // 旧的写法先不去除用作兜底
        fileAttachModels = element.entry?.attachment?.filter(it => it?.id === attachId || it?.realId === attachId || it?.docId === attachId);
      }
      const attachment = attachmentObj || (fileAttachModels ? fileAttachModels[0] : undefined);
      if (!attachment) {
        return Promise.reject(new Error('attachment not exist'));
      }
      const { fileName, fileSize } = attachment;
      // 打点基本属性
      const baseAttrs = { cid, fileName, fileSize, statSubKey: this.systemApi.md5(`${fileName}---${fileSize}`) };
      this.dataTrakerApi.track('mail_attachment_delete_time', { ...baseAttrs });
      this.loggerApi.track('mail_delete_attachment', { id: element._id, attachment });
      // 删除时存储被删除的附件id
      attachment.deleted = true;
      attachment.ready = false;
      this.calculateAttachmentTotalSize(element);
      if (attachment.ready) {
        element.newUploadedAttachment && (element.newUploadedAttachment -= 1);
      }
      await this.modelHandler.saveEntryToStore(element, undefined, [attachment]);
      const continueFun: (retry: number) => Promise<MailEntryModel> = async (retry: number) => {
        try {
          return this.doSaveTemp({ content: element, saveDraft: false, _account, attrObj: { id: attachment.id, purpose: 'deleteAtt' } });
        } catch (e) {
          console.error('[mail add attachment]', e);
          if (retry > 0) {
            await wait(500);
            return continueFun(retry - 1);
          }
          return Promise.reject(getIn18Text('WUFASHANCHUFUJIAN'));
        }
      };
      // 需要continue处理
      if (['internal', 'upload', 'url', 'netUrl', 'fromInternalMail'].includes(attachment.type)) {
        return continueFun(2)
          .then(() => ({ success: true, code: '', title: '' }))
          .catch(err => {
            console.error('common attachment delete error', err);
            const { code, title } = err;
            this.dataTrakerApi.track('mail_attachment_delete_error', {
              ...baseAttrs,
              reason: JSON.stringify(err),
            });
            // attachment.deleted = false;
            return { success: false, code: code || '', title: title || '' };
          });
      }
      // 下面几种类型无需走接口
      if (attachment.type === 'netfolder') {
        return { success: true };
      }
      if (attachment.type === 'trs') {
        return { success: true };
      }
      const errorReason = 'not supported type ' + attachment.type;
      this.dataTrakerApi.track('mail_attachment_delete_error', {
        ...baseAttrs,
        reason: errorReason,
      });
      return Promise.reject(new Error(errorReason));
    } finally {
      try {
        deleteLock.unlock();
      } catch (e) {
        console.error(e);
      }
    }
  }

  // 等待中的附件 移除锁
  doAbortAttachment(id: string) {
    try {
      const lock = this.lockMap.get(id);
      if (lock) {
        lock?.abortWaitItem(id);
        return { success: true };
      }
      return { success: false, message: getIn18Text('QUXIAOSHIBAI，ZHAOBU') };
    } catch (error) {
      console.log('doAbortAttachment error', error);
      return { success: false, message: getIn18Text('QUXIAOSHIBAI') };
    }
  }

  async doAddAttachment(cid: string, attachOrigin: MailFileAttachModel[], flag: UploadAttachmentFlag | undefined, _account?: string): Promise<MailFileAttachModel[]> {
    // 使用最后一个参数_account
    let element: MailEntryModel = await this.modelHandler.loadEntryFromStore(cid, _account);
    // 获取到 composeId
    if (!element._id) {
      await this.doSaveTemp({ content: element, saveDraft: false, _account });
      element = await this.modelHandler.loadEntryFromStore(cid, _account);
    }
    if (!element) {
      return Promise.reject(getIn18Text('WUFAZHAODAODUIYINGYOU'));
    }
    const mailLimit = this.mailConfApi.getMailLimit({ _account });
    const total = attachOrigin.reduce((totalSize, attach) => totalSize + attach.fileSize, 0);
    // totalCloudAttachmentSize 云，整体超过16
    if (total + (element.totalCloudAttachmentSize || 0) > MailContentHandler.MAX_ATTACHMENT_ALLOWED_SIZE) {
      this.eventApi.sendSysEvent({
        eventSeq: 0,
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          popupType: 'toast',
          popupLevel: 'warn',
          // 单个云附件大小不能超过5G，且邮件附件总大小不能超过 16G
          title: getIn18Text('DANGEYUNFUJIANDAXIAO'),
          code: 'needCloudUpload',
        } as PopUpMessageInfo,
        auto: true,
      });
      return Promise.reject(getIn18Text('DANGEYUNFUJIANDAXIAO'));
    }
    // totalSize 本地， 本地附件方式添加，超过本地附件总大小限制
    if (!flag?.usingCloud && total + (element.totalSize || 0) > mailLimit.upload_total_size) {
      const overText = getIn18Text('PUTONGFUJIANZONGDAXIAO') + Math.floor(mailLimit.upload_total_size / 1024 / 1024) + 'M';
      const curSendVersionId = await this.productAuthApi.asyncGetProductVersionId({ _account });
      if (curSendVersionId === 'free') {
        this.eventApi.sendSysEvent({
          eventName: 'upgradeVersion',
          eventData: { cid },
        });
        return Promise.reject(overText);
      }
      this.eventApi.sendSysEvent({
        eventSeq: 0,
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          popupType: 'toast',
          popupLevel: 'warn',
          title: overText,
          code: 'needCloudUpload',
        } as PopUpMessageInfo,
        auto: true,
      });
      return Promise.reject(overText);
    }
    // 挨个校验 大小是否合法
    let fileSizeIllegal = false;
    let illegalItem: MailFileAttachModel | undefined;
    const attachments: MailFileAttachModel[] = [];
    attachOrigin.forEach(it => {
      if (it.fileSize > MailContentHandler.MAX_SINGLE_ATTACHMENT_ALLOWED_SIZE || (!flag?.usingCloud && it.fileSize > mailLimit.upload_size)) {
        fileSizeIllegal = true;
        illegalItem = it;
        return;
      }
      const attach = { ...it };
      element.newUploadedAttachment = element.newUploadedAttachment ? element.newUploadedAttachment + 1 : 1;
      if (element.attachmentOffset === undefined) {
        element.attachmentOffset = 0;
      }
      attach.inlined = flag?.inline || false;
      attach.idFilled = true;
      attach.deleted = false;
      attach.ready = true;
      attach.realId = this.generateRndId();
      attach.cloudAttachment = !!flag?.usingCloud;
      // 后期优化
      attach.fileType = this.handleAttachmentType('', attach?.name || '');
      //  从网盘中选中添加的附件为此类型 'netUrl'
      //  中转站文件* 从网盘中选中添加的云附件为此类型 'trs'
      //  从往来邮件中添加的附件为'fromInternalMail'
      if (attach.type !== 'fromInternalMail') {
        attach.type = flag?.usingCloud ? 'trs' : 'netUrl';
      } /* else {
        attach.type = "fromInternalMail"
      } */
      attach.docId = it.id || attach.realId;
      // element.entry.attachment?.push(attach);
      attachments.push(attach);
      this.calculateAttachmentTotalSize(element);
    });
    // 单个 尺寸不合法
    if (fileSizeIllegal && illegalItem) {
      this.eventApi.sendSysEvent({
        eventSeq: 0,
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          popupType: 'toast',
          popupLevel: 'warn',
          title: getIn18Text('FUJIAN:') + illegalItem.fileName + getIn18Text('GUODA，WUFATIANJIA'),
          // content: content,
          code: 'needCloudUpload',
        } as PopUpMessageInfo,
        auto: true,
      });
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject(getIn18Text('FUJIAN:') + illegalItem.fileName + getIn18Text('GUODA，WUFATIANJIA'));
    }
    try {
      await this.modelHandler.saveEntryToStore(element, undefined, attachments);
      const continueFun = async (retry: number) => {
        try {
          element = await this.doSaveTemp({ content: element, saveDraft: false, _account });
        } catch (e) {
          console.error('[mail add attachment]', e);
          if (retry > 0) {
            await wait(500);
            await continueFun(retry - 1);
          } else {
            return Promise.reject(e);
          }
        }
      };
      await continueFun(2);
      const retuRes = element.entry.attachment || [];
      retuRes.forEach(atta => {
        atta.file && delete atta.file;
      });
      return retuRes;
    } catch (e) {
      console.error('[mail attachment] add attachment failed', e);
      return Promise.reject('add attachment error');
    }
  }

  // 附件上传前置校验
  async attachmentUploadPreCheck(preCheckParams: PrecheckParams) {
    const { cid, element, attach, uploadWay, _account } = preCheckParams;
    if (!systemApi.isNetworkAvailable()) {
      return { success: false, reason: getIn18Text('WANGLUOYICHANG') };
    }

    if (!attach || attach.size === 0) {
      return { success: false, reason: getIn18Text('FUJIANFEIFA') };
    }
    let mailModel: MailEntryModel | null = null;
    if (element) {
      mailModel = element;
    } else if (cid) {
      mailModel = await this.modelHandler.loadEntryFromStore(cid, _account);
    }
    if (!mailModel) return { success: false, reason: getIn18Text('QINGCHUANRUYOUJIANmo') };

    // 本地转为云附件
    let transformToCloud = false;

    const cloudAttConfig = this.productAuthApi.getAuthConfig(ProductAuthorityFeature.ORG_SETTING_BIG_ATTACH_SHOW);
    // 本地 + 内联
    this.calculateAttachmentTotalSize(mailModel);
    const { totalSize } = mailModel;
    const mailLimit = this.mailConfApi.getMailLimit({ _account });
    // 本地附件 校验
    const curSendVersionId = await this.productAuthApi.asyncGetProductVersionId({ _account });
    if (uploadWay === 'normal') {
      // 单个超过 本地附件最大限制
      if (attach.size > mailLimit.upload_size) {
        const overText = getIn18Text('WENJIANGUODA，PTFJBNCG') + Math.floor(mailLimit.upload_size / 1024 / 1024) + 'M';
        // 支持云附件 自动转换
        if (cloudAttConfig?.show) {
          transformToCloud = true;
        } else {
          if (curSendVersionId === 'free') {
            return { success: false, reason: 'free_version_attachment_size_overflow' };
          }
          return { success: false, reason: overText };
        }
      }
      // 整体超过 本地附件总大小限制
      if (attach.size + totalSize > mailLimit.upload_total_size) {
        if (cloudAttConfig?.show) {
          transformToCloud = true;
        } else {
          if (curSendVersionId === 'free') {
            return { success: false, reason: 'free_version_total_size_overflow' };
          }
          return { success: false, reason: getIn18Text('BENDEFUJIANZONGDAXIAO') };
        }
      }
    }
    // 校验后的上传方式
    const uploadWayAfterCk = uploadWay === 'cloud' || transformToCloud ? 'cloud' : 'normal';
    // 云附件 校验 (包括被迫转为云附件)
    if (uploadWayAfterCk === 'cloud') {
      if (attach.size > MailContentHandler.MAX_SINGLE_ATTACHMENT_ALLOWED_SIZE) {
        return { success: false, reason: getIn18Text('PUTONGYUNFUJIANDAXIAO') };
      }
      if (attach.size + (mailModel.totalCloudAttachmentSize || 0) > MailContentHandler.MAX_ATTACHMENT_ALLOWED_SIZE) {
        return { success: false, reason: getIn18Text('YUNFUJIANZONGDAXIAOCHAO') };
      }
    }
    return { success: true, uploadWayAfterCk, transformToCloud };
  }

  /**
   * https://su-desktop-web.cowork.netease.com:8000/js6/s?func=upload%3AdirectData&sid=50IA5Cy8CD19LF*C8CAfLRtxjfSHibzS
   * &p=sirius&composeId=37df51fe95db4836bc287e5adb09992f&attachmentId=11&offset=undefined&p=sirius
   * &_deviceId=4f0cabf6a5e127bebf6668539d73f456&_device=chrome&_systemVersion=10.15.6&_system=web&_manufacturer=chrome&_deviceName=chrome%2092.0.4515.159
   * @param cid
   * @param attach
   * @param uploader
   * @param inline
   */
  // eslint-disable-next-line max-statements
  async doUploadAttachment(params: DoUploadAttachmentParams): Promise<MailFileAttachModel> {
    const { cid, flag, realId } = params;
    let { attach, uploader } = params;
    const { usingCloud, inline: flagInline = false, _account } = flag || {};

    // 打点前置逻辑
    // 本地路径 获取文件
    let attachPath = '';
    // @ts-ignore
    if (typeof attach === 'string' || (typeof attach === 'object' && typeof attach.electronFullPath === 'string')) {
      // @ts-ignore
      attachPath = typeof attach === 'string' ? attach : attach.electronFullPath;
      const localfile = await window.electronLib.fsManage.readFile(attachPath);
      const sep = window.electronLib.env.isMac ? '/' : '\\';
      // file对象
      attach = new File([localfile], attachPath.split(sep).pop() as string);
    }
    const { name: fileName, size: fileSize } = (attach || {}) as File;
    // 打点基本属性
    const baseAttrs = {
      cid,
      fileName,
      fileSize,
      uploadType: flagInline ? 'inline' : usingCloud ? 'cloud' : 'normal',
    };
    // 性能打点基本key
    const keys = {
      statKey: 'mail_attachment_upload_times',
      statSubKey: this.systemApi.md5(`${fileName}---${fileSize}`),
    };

    let element: MailEntryModel = await this.modelHandler.loadEntryFromStore(cid, _account);

    // 邮件校验
    if (!element) {
      const reason = getIn18Text('WUFAZHAODAODUIYINGYOU');
      this.dataTrakerApi.track('mail_attachment_upload_error', { ...baseAttrs, reason });
      return Promise.reject(reason);
    }

    // 附件校验
    const checkRes = await this.attachmentUploadPreCheck({ element, attach, uploadWay: usingCloud ? 'cloud' : 'normal', _account });
    const { success: checkSuc, reason: ckReason, uploadWayAfterCk, transformToCloud } = checkRes;
    // 校验不通过
    if (!checkSuc) {
      this.dataTrakerApi.track('mail_attachment_upload_error', { ...baseAttrs, reason: ckReason || '' });
      return Promise.reject(ckReason || '');
    }

    // 强制加入_account用于后续上传流程
    if (uploader) {
      uploader = {
        ...uploader,
        noErrorMsgEmit: true,
        _account,
      };
    } else {
      uploader = {
        noErrorMsgEmit: true,
        _account,
      };
    }
    // 获取到 composeId
    if (!element._id) {
      if (flag?._account) {
        await this.doSaveTemp({ content: { ...element, _account: flag._account }, saveDraft: false, _account });
      } else {
        await this.doSaveTemp({ content: element, saveDraft: false, _account });
      }
      element = await this.modelHandler.loadEntryFromStore(cid, _account);
    }

    if (!Array.isArray(element?.entry?.attachment)) {
      element.entry.attachment = [];
    }
    const fileSourceKey = this.systemApi.md5(attach.name, true) + '|' + attach.size + '|' + attach.lastModified;
    // 性能记录
    const recordType = uploadWayAfterCk === 'cloud' ? 'cloud' : 'common';
    const fileType = this.handleAttachmentType(attach.type, attach.name);
    const attachItem = {
      // 支持ui层传入
      realId: realId || this.generateRndId(),
      // api层的id
      id: -1,
      fileSize: attach.size,
      fileMime: attach.type,
      fileType,
      file: attach,
      fileName: attach.name,
      type: !flagInline ? (uploadWayAfterCk === 'cloud' ? 'netfolder' : 'upload') : 'internal',
      deleted: false,
      ready: false,
      idFilled: false,
      fileSourceKey,
      fileSourceType: FileSourceType.uploadMail,
    } as MailFileAttachModel;

    element.newUploadedAttachment = element.newUploadedAttachment ? element.newUploadedAttachment + 1 : 1;

    // 内联附件暂时不记录
    const toRecord = !flagInline;
    if (toRecord) {
      mailPerfTool.attachmentTransfer('upload', recordType, 'start');
    }

    if (element.attachmentOffset === undefined) {
      element.attachmentOffset = 0;
    }

    // 被迫转为云附件
    if (transformToCloud) {
      this.eventApi.sendSysEvent({
        eventName: 'attachToCloud',
        eventData: {
          attachItem,
        },
      });
    }

    try {
      // 开始上传 性能打点
      this.performanceApi.time({
        ...keys,
        params: {
          ...baseAttrs,
        },
      });
      const res = await this.uploadInternalCallLock(element, attachItem, uploader);
      try {
        this.performanceApi.timeEnd({
          ...keys,
          params: {
            ...baseAttrs,
            uploadSize: fileSize - (res?.originOffset || 0),
          },
        });
      } catch (error) {
        console.log('mail_attachment_upload_times error', error);
      }
      res.attachPath = attachPath;
      if (toRecord) {
        mailPerfTool.attachmentTransfer('upload', recordType, 'end', {
          result: 'success',
          fileSize: attach.size,
          fileType,
        });
      }
      const retuRes = { ...res };
      retuRes.file && delete retuRes.file;
      return retuRes;
    } catch (e: any) {
      // 单个邮件超限
      if (e === 'free_version_attachment_size_overflow') {
        return Promise.reject(e);
      }
      // 总量超限
      if (e === 'free_version_attachment_total_size_overflow') {
        return Promise.reject(e);
      }
      if (toRecord) {
        mailPerfTool.attachmentTransfer('upload', recordType, 'end', {
          result: (e as PopUpMessageInfo)?.code === 'user.cancel' ? 'cancel' : 'fail',
          fileSize: attach.size,
          fileType,
        });
      }

      // 用户取消不上报的场景
      if ((e as PopUpMessageInfo)?.code === 'user.cancel' || e === '用户取消' || (e?.name === 'Error' && e?.message === '用户取消')) {
        return Promise.reject('用户取消');
      }

      // 以 new Error('xxxxx') 形式 直接抛出Error
      if (e?.name === 'Error' && e?.message) {
        this.dataTrakerApi.track('mail_attachment_upload_error', {
          ...baseAttrs,
          reason: e.message || '上传失败',
          code: '',
        });
      }

      // 以 Promise.reject() 形式 返回
      // 直接返回字符串
      if (typeof e === 'string') {
        this.dataTrakerApi.track('mail_attachment_upload_error', {
          ...baseAttrs,
          reason: e || '上传失败',
          code: '',
        });
      }

      // title code 为标准返回结构
      if (e?.title) {
        this.dataTrakerApi.track('mail_attachment_upload_error', {
          ...baseAttrs,
          reason: e?.title || '上传失败',
          code: e.code || '',
        });
      }

      // 其他 层级很深 无法统一 统一处理
      try {
        this.dataTrakerApi.track('mail_attachment_upload_error', {
          ...baseAttrs,
          reason: JSON.stringify(e),
          code: e?.code,
        });
      } catch (error) {
        console.log('统一打点失败', error);
      }

      if (e?.title === 'A requested file or directory could not be found at the time an operation was processed.') {
        // TODO:不应该用title的文案作为判断的标准，应该使用code，但是code在代码执行中被篡改了，临时用title判断
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject(getIn18Text('SHANGCHUANSHIBAI，FUJIAN'));
      }

      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject(getIn18Text('SHANGCHUANFUJIANCHUXIANCUO'));
    }
  }

  lockMap = new Map();

  lockExpiredTIme = 20 * 60 * 1000 + 10;

  delLockExpiredTime = 30 * 1000 + 5;

  getLockName(elementId: string | undefined, attachItemType: string) {
    const lockName = MailAbstractHandler.COMMON_ATTACHMENT_LOCK_NAME + '-' + elementId + '-' + (attachItemType === 'netfolder' ? 0 : 1); // + (attachItemType === 'netfolder' ? ((this.sequence.next() || 0) % 2) + 1 : '');
    return lockName;
  }

  // 以锁的方式上传
  private async uploadInternalCallLock(element: MailEntryModel, attachItem: MailFileAttachModel, uploader?: LoaderActionConf) {
    const { realId, type: attachItemType } = attachItem;
    // 云附件用01锁，本地附件用单锁
    const lockName = this.getLockName(element._id, attachItemType);
    const uploadLock = this.storeApi.getLock(lockName, this.lockExpiredTIme, false, true);
    const lockEventId = realId ? realId + '' : '';
    this.lockMap.set(lockEventId, uploadLock);
    // 锁上
    await uploadLock.lock(lockEventId);
    const res = await this.uploadInternalCall(element, attachItem, uploader, uploadLock, lockEventId);
    return res;
  }

  // eslint-disable-next-line max-params, max-len
  private async uploadInternalCall(element: MailEntryModel, attachItem: MailFileAttachModel, uploader?: LoaderActionConf, uploadLock?: StoredLock, lockEventId?: string) {
    console.log('uploadInternalCall', element);
    const { _account } = uploader || {};
    attachItem.fileSourceKey = `${attachItem.fileSourceKey};${element._id}`;
    // 校验
    const checkRes = await this.attachmentUploadPreCheck({
      cid: element?.cid,
      attach: attachItem?.file,
      uploadWay: attachItem.type === 'netfolder' ? 'cloud' : 'normal',
      _account,
    });
    const { success: checkSuc, reason: ckReason, uploadWayAfterCk, transformToCloud } = checkRes;
    // 校验不通过
    if (!checkSuc) {
      uploadLock?.unlock();
      this.lockMap.delete(lockEventId);
      return Promise.reject(ckReason || '');
    }
    // 被迫转为云附件
    if (transformToCloud) {
      this.eventApi.sendSysEvent({
        eventName: 'attachToCloud',
        eventData: {
          attachItem,
        },
      });
    }

    // 修正一下type
    if (attachItem.type !== 'internal') {
      attachItem.type = uploadWayAfterCk === 'cloud' ? 'netfolder' : 'upload';
    }

    // 本地上传
    // 普通本地上传的附件 内部附件, 如邮件html内嵌的image
    if (attachItem.type === 'internal' || uploadWayAfterCk === 'normal') {
      try {
        await this.uploadAttachment(element, attachItem, uploader);
        return attachItem;
      } catch (e) {
        if (typeof e === 'object' && e && (e as any).code === 'storedLockTimeout') {
          this.markUploadFailed(attachItem);
          await this.doSaveCancelUploadResult(element, attachItem, true);
          this.dataTrakerApi.track('occur_mailAttachmentUpload_Failed', {
            size: attachItem.fileSize,
            reason: 'exception:' + (e && (e as any).code ? (e as any).code : ''),
          });
        }
        throw e;
      } finally {
        uploadLock?.unlock();
        this.lockMap.delete(lockEventId);
      }
    } else {
      // 云附件方式上传
      try {
        await this.uploadAttachmentLegacy(element, attachItem, uploader as UploadPieceHandler);
        return attachItem;
      } catch (e) {
        if (typeof e === 'object' && e && (e as any).code === 'storedLockTimeout') {
          this.markUploadFailed(attachItem);
          await this.doSaveCancelUploadResult(element, attachItem, true);
          this.dataTrakerApi.track('occur_mailAttachmentUpload_Failed', {
            size: attachItem.fileSize,
            reason: 'exception:' + (e && (e as any).code ? (e as any).code : ''),
          });
        }
        throw e;
      } finally {
        uploadLock?.unlock();
        this.lockMap.delete(lockEventId);
      }
    }
  }

  // 上传云附件
  async uploadAttachmentLegacy(content: MailEntryModel, item: MailFileAttachModel, uploader?: UploadPieceHandler): Promise<MailEntryModel> {
    // 前置校验
    if (!content._id) throw new Error('call saveTemp first');
    if (!content.entry || !content.entry.attachment || !item) throw new Error('no attachment found');
    if (!item.file) throw new Error('no attachment file set');

    let canceled = false;
    const attachment = item;
    const { fileSize: attFileSize } = attachment;
    const { _account } = uploader || {};

    // 上传全流程公共参数
    let cloudUploaderCommonArgs = {
      fileId: 0,
      nosKey: '',
      token: '',
      offset: 0,
      context: '',
    };

    // Step1
    // 获取uploadtoken
    const qrPromise = this.impl.get(
      this.systemApi.getUrl('uploadAttachmentLegacyToken'),
      {
        fileName: item.fileName,
        fileSize: item.fileSize,
        md5: item.fileMd5 || this.systemApi.md5(item.fileName),
      },
      {
        cachePolicy: 'noCache',
        contentType: 'form',
        responseType: 'text',
        expectedResponseType: 'json',
        _account,
      }
    );

    return qrPromise
      .then(this.unpackData.bind(this))
      .then(async (qrRs: ResponseData<ResponseMailUploadCloudToken>) => {
        // 邮件过期
        if ((qrRs.code === 'FA_COMPOSE_NOT_FOUND' || qrRs.code === 'FA_ID_NOT_FOUND') && inWindow() && !window.isAccountBg) {
          this.eventApi.sendSysEvent({
            eventName: 'mailStoreRefresh',
            eventStrData: 'resetMailWithDraft',
            eventData: { cid: content.cid },
          });
        }
        if (!qrRs || !qrRs.data || qrRs.code !== 0) return this.handleUploadLegencyError(qrRs);
        const { new: new1, context, bucketName, nosKey, fileId, token } = qrRs.data;
        cloudUploaderCommonArgs = {
          ...cloudUploaderCommonArgs,
          fileId,
          nosKey,
          token,
          context,
        };
        attachment.idFilled = true;
        attachment.id = fileId;
        const uploadUrl = `${MailSendHandler.mailAttachmentUploadHost}${bucketName}/${nosKey}`;
        // debugger;
        await this.modelHandler.saveEntryToStore(content, undefined, [attachment]).then();

        // 断点续传
        if (new1 === false && context) {
          // 获取偏移量
          const offsetUrl = `${MailSendHandler.mailAttachmentUploadHost}${bucketName}/${nosKey}?uploadContext&context=${context}&version=1.0`;
          const offsetRes = await this.impl.get(
            offsetUrl,
            {},
            {
              headers: { 'x-nos-token': token },
              _account,
            }
          );
          const { status, data: offsetData } = offsetRes;
          if (status === 200 && offsetData) {
            const { offset } = offsetData;
            cloudUploaderCommonArgs = {
              ...cloudUploaderCommonArgs,
              offset,
            };
            uploader = this.buildAttachmentSliceUploader(uploader, item, { offset }, qrRs.data);
            // 上传
            return this.uploadFile(uploadUrl, attachment, uploader, true);
          }
          throw new Error('[mail-send] getUploadContext failed');
        }

        this.calculateAttachmentTotalSize(content);
        uploader = this.buildAttachmentSliceUploader(uploader, item, { offset: 0 }, qrRs.data);
        // 首次分片回调
        uploader.firstUploadAction = data => {
          const { context: pieceContext } = data;
          // 调用修改上下文接口
          this.modifyContext(
            {
              context: pieceContext,
              fileId,
              nosKey,
              fileSize: attFileSize,
            },
            _account
          );
        };

        // 开传
        return this.uploadFile(uploadUrl, attachment, uploader, true);
      })
      .then(res => {
        canceled = !!res.config.canceled;
        return res;
      })
      .then((res: ApiResponse<ResponseMailUploadCloud>) => {
        console.log('[mail-send] uploadAttachmentLegacy result for cloud ', res, canceled);
        // 如果上传都成功的话，需要调用『确认上传完成』的接口
        if (res && res.status === 200 && !canceled) {
          return this.impl
            .post(
              this.systemApi.getUrl('uploadAttachmentLegacyFinished'),
              {
                fileId: cloudUploaderCommonArgs.fileId,
                nosKey: cloudUploaderCommonArgs.nosKey,
                fileSize: attachment.fileSize,
              },
              { _account }
            )
            .then((res: ApiResponse<ResponseMailUploadCloud>) => {
              attachment.uploadOffset = uploader ? uploader.offset : 0;
              attachment.uploadContext = uploader ? uploader.context : '';
              if (res.data && res.data.data && res.status === 200) {
                if (res.data.data.identity) {
                  attachment.cloudIdentity = String(res.data.data.identity || '');
                }

                attachment.expired = res.data.data.expireTime;
                attachment.ready = true;
                attachment.deleted = false;
                attachment.filePreviewUrl = res.data.data.downloadUrl ? '' : undefined;
                attachment.fileUrl = res.data.data.downloadUrl;
                return this.modelHandler.saveEntryToStore(content, undefined, [attachment]).then(() => content);
              }
              return this.uploadAttachmentLegacyFail(attachment, content, uploader!, res);
            })
            .catch(() => this.uploadAttachmentLegacyFail(attachment, content, uploader!, res));
        }
        return this.uploadAttachmentLegacyFail(attachment, content, uploader!, res);
      })
      .catch(reason => {
        this.markUploadFailed(attachment);
        // 入库保存进度
        attachment.uploadOffset = uploader ? uploader.offset : 0;
        attachment.uploadContext = uploader ? uploader.context : '';
        const exist = Array.isArray(content.entry.attachment) ? content.entry.attachment.find(v => v.id === attachment.id) : null;
        if (!exist) {
          content.entry.attachment!.push(attachment);
        }
        console.log('[mail-send] uploadAttachmentLegacy failed:', reason, typeof reason, attachment);
        // 格式过时
        if (reason?.data?.message) {
          this.doSaveCancelUploadResult(content, attachment);
          this.eventApi.sendSysEvent({
            eventName: 'error',
            eventLevel: 'error',
            eventStrData: '',
            eventData: {
              popupType: 'toast',
              popupLevel: 'info',
              title: reason?.data?.message,
              content: '',
              code: 'PARAM.ERR',
            } as PopUpMessageInfo,
            eventSeq: 0,
          });
          // 被动取消
          // eslint-disable-next-line prefer-promise-reject-errors
          return Promise.reject({
            title: `${reason?.data?.message}`,
            code: 'user.cancel',
          } as PopUpMessageInfo);
        }

        if (reason?.data?.data?.message) {
          this.doSaveCancelUploadResult(content, attachment);
          this.eventApi.sendSysEvent({
            eventName: 'error',
            eventLevel: 'error',
            eventStrData: '',
            eventData: {
              popupType: 'toast',
              popupLevel: 'info',
              title: reason?.data?.data?.message,
              content: '',
              code: 'PARAM.ERR',
            } as PopUpMessageInfo,
            eventSeq: 0,
          });
          // eslint-disable-next-line prefer-promise-reject-errors
          return Promise.reject({
            title: `${reason?.data?.data?.message}`,
            code: 'user.cancel',
          } as PopUpMessageInfo);
        }

        if (reason?.data?.errMsg) {
          this.doSaveCancelUploadResult(content, attachment, true);
          // eslint-disable-next-line prefer-promise-reject-errors
          return Promise.reject({
            title: `${reason?.data?.errMsg}`,
            code: reason?.data?.errCode || '',
          } as PopUpMessageInfo);
        }
        if (reason?.message && typeof reason.message === 'string' && reason.message.startsWith(constHttpCanceledToken)) {
          this.doSaveCancelUploadResult(content, attachment);
          this.dataTrakerApi.track('occur_mailAttachmentUpload_Failed', {
            size: attachment.fileSize,
            reason: 'userCancel',
          });
          // 主动取消
          return Promise.reject({
            title: '用户取消',
            code: 'user.cancel',
          } as PopUpMessageInfo);
        }
        this.doSaveCancelUploadResult(content, attachment, true);
        this.dataTrakerApi.track('occur_mailAttachmentUpload_Failed', {
          size: attachment.fileSize,
          reason: 'exception:' + (reason && reason.code ? reason.code : ''),
        });
        return Promise.reject(this.commonCatch(reason));
      });
  }

  // 更新直传断点续传上下文
  async modifyContext(params: ModifyUploadContextParams, _account?: string) {
    const { context, fileId, nosKey, fileSize } = params;
    const modUploadContextUrl = this.systemApi.getUrl('modifyUploadContext');
    const res = await this.impl.post(
      modUploadContextUrl,
      {
        context,
        fileId,
        nosKey,
        fileSize,
      },
      { _account }
    );
    return res;
  }

  private handleUploadLegencyError(qrRs: ResponseData<any>) {
    return Promise.reject(this.getErrMsg(qrRs.code) || qrRs.ret?.message || '上传失败，请稍后尝试');
  }

  // 上传云文档如果失败了的话
  async uploadAttachmentLegacyFail(attachment: MailFileAttachModel, content: MailEntryModel, uploader: UploadPieceHandler, res: ResponseData<any>) {
    this.markUploadFailed(attachment);

    // 如果已经在附件列表中了，那么就更新就行了
    const current = Array.isArray(content.entry.attachment) ? content.entry.attachment.find(v => v.id === attachment.id) : null;
    if (current) {
      current.uploadOffset = uploader ? uploader.offset : 0;
      current.uploadContext = uploader ? uploader.context : '';
      this.doSaveCancelUploadResult(content, current, true);
      await this.modelHandler.saveEntryToStore(content, undefined, [current]);
    } else {
      attachment.uploadOffset = uploader ? uploader.offset : 0;
      attachment.uploadContext = uploader ? uploader.context : '';
      content.entry.attachment!.push(attachment);
      this.doSaveCancelUploadResult(content, attachment, true);
      await this.modelHandler.saveEntryToStore(content, undefined, [attachment]);
    }
    return this.handleUploadLegencyError(res);
  }

  buildAttachmentSliceUploader(
    // requestConfig + 进度
    uploader: LoaderActionConf | undefined,
    // 附件
    item: MailFileAttachModel,
    cloudUploaderCommonArgs: CloudUploaderCommonArgs,
    qrs: ResponseMailUploadCloudToken
  ) {
    if (!uploader) {
      throw new Error('参数有误');
    }
    const pu: UploadPieceHandler = uploader as UploadPieceHandler;

    // 初始化参数
    pu.headers = {
      'x-nos-token': qrs.token,
    };
    pu.responseType = 'text';
    pu.contentType = 'stream';
    pu.expectedResponseType = 'json';
    pu.sliceSize = this.sliceLen;
    pu.offset = cloudUploaderCommonArgs.offset || 0;
    pu.status = 'start';
    pu.token = qrs.token;
    pu.context = item.idFilled ? qrs.context : '';

    // 递归调用进行分片上传
    pu.nextUploader = res => {
      const canceled = !!res.config.canceled;
      if (canceled) {
        return undefined;
      }
      // 上传成功
      if (res.data && +res.status === 200) {
        const isComplete = pu.offset >= item.file!.size;
        if (isComplete) {
          return undefined;
        }
        pu.offset = res.data.offset || 0;
        pu.context = res.data.context || '';
        const data: ResponsePieceUploadMailAttachment = res.data as ResponsePieceUploadMailAttachment;
        item.id = data.ret?.fid || item.id;

        if (data.var && data.var.exist) {
          return undefined;
        }
        pu.offset = data.offset;
        return pu;
      }
      return undefined;
    };
    return pu;
  }

  // private async buildUploadCloudAttachmentUrl() {
  //   const map = await this.systemApi.doGetCookies();
  //   const authHeaders = {
  //     'Mail-Upload-cmc': map.Coremail,
  //     'Mail-Upload-urs': map.QIYE_SESS,
  //     // 'Sec-Fetch-Dest': 'empty',
  //     // 'Sec-Fetch-Mode': 'cors',
  //     // 'Sec-Fetch-Site': 'same-site',
  //     Accept: '*/*',
  //   };
  //   let mapElement = map.qiye_mail_upx;
  //   if (mapElement && mapElement.length > 0 && mapElement.indexOf('|') > 0) {
  //     const urls = mapElement.split('|');
  //     mapElement = urls[0];
  //   }
  //   // const urlHost = (mapElement || 'uphz1.qiye.163.com').replace(/\./ig, '_');
  //   // const url = this.systemApi.getUrl('uploadMailAttachment') + '/' + urlHost;
  //   let urlHost = '';
  //   let url = '';
  //   if (this.systemApi.isElectron()) {
  //     urlHost = 'https://' + (
  //       mapElement || 'uphz.qiye.163.com'
  //     );
  //     url = urlHost + '/upxmail/upload';
  //   } else {
  //     urlHost = (
  //       mapElement || 'uphz1.qiye.163.com'
  //     ).replace(/\./ig, '_');
  //     url = this.systemApi.getUrl('uploadMailAttachment') + '/' + urlHost;
  //   }
  //   return { url, authHeaders };
  // }

  // eslint-disable-next-line max-params
  async uploadAttachment(
    content: MailEntryModel,
    item: MailFileAttachModel,
    uploader?: LoaderActionConf,
    retry?: boolean
  ): Promise<MailEntryModel | ResponseData<ResponseUploadedAttachment>> {
    console.log('[mail-send][upload mail attachment uploadAttachment]', content, item, retry);
    if (!content._id) {
      throw new Error('call saveTemp first');
    }
    if (!content.entry || !content.entry.attachment || !item) {
      throw new Error('no attachment found');
    }
    const attachment = item;
    const { _account } = uploader || {};
    if (!attachment.file) {
      throw new Error('no attachment file set');
    }
    const key = 'uploadPrepare';
    const additionalParam = _account ? this.getAccountSession(_account) : undefined;
    const preUrl = this.buildUrl(key, additionalParam, !!additionalParam?._session);
    const req: RequestAttachmentUpload = {
      attachmentId: attachment.id,
      composeId: content._id || '',
      contentType: attachment.fileMime || '',
      fileName: attachment.fileName,
      offset: content.attachmentOffset || 0,
      size: attachment.fileSize,
    };
    const conf = this.getConfigForHttp(key, {
      data: req,
      url: preUrl,
      contentType: 'json',
      _account,
    });
    console.log('uploadAttachment getConfigForHttp', conf, _account, additionalParam);
    const result = await this.impl.post(preUrl, req, conf);
    this.loggerApi.track('upload_attachment_prepare_result', { attachmentId: attachment.id, retry, result });
    const res: ResponseData<ResponseUploadedAttachment> = this.unpackData(result);
    if (retry) return res;
    this.loggerApi.track('upload_attachment_prepare_afterretry_res', { attachmentId: attachment.id, retry, res });
    // 上传附件发现信件已经失效(比如打开一封信放置一晚再回来编写)
    // 触发使用草稿替代现在的邮件，保证附件可上传可发送
    if ((res.code === 'FA_COMPOSE_NOT_FOUND' || res.code === 'FA_ID_NOT_FOUND') && inWindow() && !window.isAccountBg) {
      this.loggerApi.track('upload_attachment_fail', { trigger: 'resetMailWithDraftStart', content: JSON.stringify(content) });
      this.eventApi.sendSysEvent({
        eventName: 'mailStoreRefresh',
        eventStrData: 'resetMailWithDraft',
        eventData: { cid: content.cid },
      });
      return Promise.reject(res.code);
    }
    const curSendVersionId = await this.productAuthApi.asyncGetProductVersionId({ _account });
    // 免费版溢出特殊处理
    if (curSendVersionId === 'free') {
      if (res.code === 'FA_OVERFLOW' && res.overflowReason === 'pref_smtp_max_send_mail_size') {
        return Promise.reject('free_version_total_size_overflow');
      }
      if (res.code === 'FA_UPLOAD_SIZE_EXCEEDED') {
        return Promise.reject('free_version_attachment_size_overflow');
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const handleRes = async (res: ResponseData<ResponseUploadedAttachment>) => {
      if (res.code === MailContentHandler.sOk) {
        // 为了修改附件多选上传出现报错弹窗，出现报错窗口临时注销1368行到1375xufa的代码
        // xufa 的这个代码是为了解决 附件上传中点击取消，保存草稿时会报错，后面xufa再用其他方式解决
        attachment.idFilled = !!res?.var?.attachmentId;
        attachment.id = res?.var?.attachmentId || attachment.id;
        this.calculateAttachmentTotalSize(content);
        // content.entry.attachment?.push(attachment);
        // eslint-disable-next-line no-param-reassign
        // content.entry.attachmentCount += 1;
        await this.modelHandler.saveEntryToStore(content, undefined, [attachment]);
        // content.newUploadedAttachment=content.newUploadedAttachment?content.newUploadedAttachment++:1;
        return this.callUploadApi(uploader, attachment, content);
      }
      this.markUploadFailed(attachment);
      return Promise.reject(this.getErrMsg(res.code));
    };
    return handleRes(res);
  }

  private callUploadApi(uploader: undefined | LoaderActionConf, attachment: MailFileAttachModel, content: MailEntryModel) {
    console.log('[mail-send][upload mail attachment callUploadApi]', content);
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    const { _account } = uploader || {};
    let additionalParam: any = {
      composeId: content._id || '',
      attachmentId: attachment.id + '',
      offset: isCorpMail ? '0' : String(content.attachmentOffset || 0),
    };
    if (_account) {
      additionalParam = {
        ...this.getAccountSession(_account),
        ...additionalParam,
      };
    }
    console.log('callUploadApi additionalParam', additionalParam);

    const url = this.buildUrl('upload', additionalParam, !!additionalParam._session, _account);
    let canceled = false;
    let agentNode: string | null = null;
    return this.uploadFile(url, attachment, uploader)
      .then(res => {
        const { config } = res;
        canceled = !!res.config.canceled;
        // 主窗口代理子窗口请求
        agentNode = config.agentNode || null;
        // 这个链接地址并不可靠 得手动拼接
        return res;
      })
      .then(this.unpackData.bind(this))
      .then((res: ResponseData<ResponseUploadedAttachment>) => {
        if (res.code === MailContentHandler.sOk) {
          attachment.id = res.var?.attachmentId || attachment.id;
          attachment.contentId = res.var?.composeId;
          if (!canceled) {
            attachment.ready = true;
            attachment.deleted = false;
            content._account = content._account || _account;
            // 构建下载链接（应该是用于上传桌面端的预览）
            attachment.fileUrl = this.buildUploadedAttachmentDownloadUrl(
              content,
              attachment.id,
              undefined,
              _account ? this.systemApi.getSessionNameOfSubAccount(_account) : '',
              agentNode
            );
            content.entry.attachment = content.entry.attachment?.map(item => {
              if (item.realId === attachment.realId) return attachment;
              return item;
            });
            // content.entry.attachment!.push(attachment);
            this.calculateAttachmentTotalSize(content);
            return this.doSaveTemp({ content, saveDraft: false, _account, attrObj: { id: attachment.id, attachment, purpose: 'addAtt' } })
              .then(() => this.modelHandler.saveEntryToStore(content, undefined, [attachment]))
              .then(() => content);
          }
          this.markUploadFailed(attachment);
          // content.entry.attachment!.push(attachment);
          content.entry.attachment = content.entry.attachment?.map(item => {
            if (item.realId === attachment.realId) return attachment;
            return item;
          });
          return this.doSaveCancelUploadResult(content, attachment).then(() => content);
        }
        this.markUploadFailed(attachment);
        content.entry.attachment = content.entry.attachment?.map(item => {
          if (item.realId === attachment.realId) return attachment;
          return item;
        });
        // content.entry.attachment!.push(attachment);
        return Promise.reject(this.getErrMsg(res.code));
      })
      .catch(async reason => {
        this.markUploadFailed(attachment);
        // content.entry.attachment!.push(attachment);
        content.entry.attachment = content.entry.attachment?.map(item => {
          if (item.realId === attachment.realId) return attachment;
          return item;
        });
        console.log('[mail-send] upload failed:', reason, typeof reason, attachment, content.cid);
        if (reason && reason.message && typeof reason.message === 'string' && reason.message.startsWith(constHttpCanceledToken)) {
          await this.doSaveCancelUploadResult(content, attachment);
          this.dataTrakerApi.track('occur_mailAttachmentUpload_Failed', {
            size: attachment.fileSize,
            reason: 'userCancel',
          });
          return Promise.reject({
            title: '用户取消',
            code: 'user.cancel',
          } as PopUpMessageInfo);
        }
        if (content.cid && attachment.idFilled) {
          try {
            await this.doDeleteAttachment({ cid: content.cid, realId: attachment.realId, attachId: attachment.id, attachmentObj: undefined, _account });
          } catch (error) {
            console.log('上传删除失败', error);
          }
        }
        this.dataTrakerApi.track('occur_mailAttachmentUpload_Failed', {
          size: attachment.fileSize,
          reason: 'exception:' + (reason && reason.code ? reason.code : ''),
        });
        return Promise.reject(this.commonCatch(reason));
      });
  }

  private uploadFile(url: string, content: FileAttachModel, uploader: undefined | LoaderActionConf, byPiece?: boolean): Promise<any> {
    return byPiece ? this.fileApi.uploadPieceByPiece(url, content, uploader as UploadPieceHandler) : this.fileApi.upload(url, content, uploader);
  }

  private async doSaveCancelUploadResult(content: MailEntryModel, attachment: MailFileAttachModel, noDelete?: boolean) {
    if (content.cid && attachment.idFilled && attachment.id && !noDelete) {
      try {
        await this.doDeleteAttachment({ cid: content.cid, realId: attachment.realId, attachId: attachment.id, attachmentObj: undefined, _account: content._account });
      } catch (error) {
        console.warn('doSaveCancelUploadResult error', error);
      }
    } else {
      if (content.newUploadedAttachment !== undefined && content.newUploadedAttachment > 0) {
        content.newUploadedAttachment -= 1;
      } else {
        content.newUploadedAttachment = 0;
      }
      this.calculateAttachmentTotalSize(content);
    }
  }

  private markUploadFailed(attachment: MailFileAttachModel) {
    attachment.ready = false;
    attachment.deleted = true;
  }

  // eslint-disable-next-line max-params
  buildUploadedAttachmentDownloadUrl(content: MailEntryModel, attachId: number, cloudAdditional?: ResponseMailUploadCloud, _session?: string, agentNode?: string | null) {
    const { _account } = content;
    if (!cloudAdditional) {
      let sessionId = '';
      if (_account) {
        const result = this.getAccountSession(_account);
        _session = _session || result._session;
        sessionId = result.sid;
      } else {
        const currentUser = this.systemApi.getCurrentUser(_account);
        if (!currentUser) {
          return ''; // TODO: replace with a warning pic
        }
        sessionId = currentUser.sessionId;
      }
      // 主窗口代理 根据节点得出完整地址
      if (_session) {
        const preUrl = this.buildUrl(
          'downloadTmpAttachment',
          {
            ...{
              sid: sessionId || '',
              composeId: content._id || '',
              attachId: attachId + '',
            },
            ...{ _session },
          },
          undefined,
          _account
        );
        return getUrlFinal(preUrl, agentNode || 'hz');
      }
      return this.buildUrl(
        'downloadTmpAttachment',
        {
          ...{
            sid: sessionId || '',
            composeId: content._id || '',
            attachId: attachId + '',
          },
        },
        undefined,
        _account
      );
    }
    // "http://fs.qiye.163.com/fs/display/?p=X-NETEASE-HUGE-ATTACHMENT
    // &file=iQ1wm60-iGe9IRvoE_KytmBAHoZUMjSSWRis71cCuWe-vDzvKzbKknXZlLk0eDpRCopFNoKGLojJ0ZH_b-wDQQ
    // &title=%E6%88%90%E5%91%98%E6%94%B6%E5%8F%91%E6%9D%83%E9%99%90.pdf"
    return this.impl.buildUrl('http://fs.qiye.163.com/fs/display/', {
      p: 'X-NETEASE-HUGE-ATTACHMENT',
      file: cloudAdditional.url,
      title: cloudAdditional.fileName,
      _account,
    });
  }

  calculateAttachmentTotalSize(element: MailEntryModel) {
    if (element.entry.attachment && element.entry.attachment.length > 0) {
      let ret = 0;
      let clRet = 0;
      let offset = 0;
      element.entry.attachment.forEach(it => {
        if (it.idFilled && !it.deleted) {
          if (it.type === 'netfolder' || it.type === 'trs') {
            clRet += it.fileSize;
          } else if (it.type === 'internal' || it.type === 'upload' || it.type === 'netUrl' || it.type === 'fromInternalMail') {
            ret += it.fileSize;
          }
          if (it.ready) {
            offset += it.fileSize;
          }
        }
        // 转发/重新编辑 自带附件（不包括云）
        else if (it.type === 'url') {
          ret += it.fileSize || 0;
        }
      });
      element.totalSize = ret;
      element.totalCloudAttachmentSize = clRet;
      element.attachmentOffset = offset;
      return ret;
    }
    return 0;
  }

  async doCancelCompose(cid: string, deleteDraft?: boolean, _account?: string): Promise<string> {
    if (!cid) {
      return Promise.resolve('param wrong');
    }
    const entryFromStore = await this.modelHandler.loadEntryFromStore(cid, _account);
    if (entryFromStore && entryFromStore._id) {
      const additionalParam = entryFromStore._account ? this.getAccountSession(entryFromStore._account) : undefined;
      const key = 'cancelCompose';

      const url = this.buildUrl(key, additionalParam, !!additionalParam?._session);
      const data = {
        ids: [entryFromStore._id],
        deleteDraft,
      };
      return this.impl
        .post(url, data, this.getConfigForHttp(key, { url, data, _account }))
        .then(this.unpackData.bind(this))
        .then(res => {
          if (res.code === MailContentHandler.sOk) {
            this.modelHandler.clearEntryFromStore(cid, entryFromStore._id, _account);
            return '';
          }
          const errMsg = this.getErrMsg(res.code);
          errMsg.popupType = 'ignore';
          return Promise.reject(errMsg);
        });
    }
    return Promise.resolve('not exist');
  }

  doFastSend(content: WriteMailInitModelParams): Promise<MailEntryModel> {
    return this.initModel(content).then((res: MailEntryModel) => this.doSendMail(res));
  }

  filterAttachments(arr: RequestComposeMailAttachment[]): RequestComposeMailAttachment[] {
    const res: RequestComposeMailAttachment[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const file of arr) {
      const hasRepeat = res?.some(f => f.displayName === file.displayName && f.size === file.size && f.type === file.type);
      if (!hasRepeat) {
        res.push(file);
      }
    }
    return res;
  }

  // 本地存草稿（UI发起全流程）
  async doSaveDraftLocal(content: MailEntryModel): Promise<void> {
    const { cid, _account } = content;
    if (!cid) return;
    // 非主账号 不入 未完成表
    if (_account && _account !== this.systemApi.getMainAccount1().email) return;
    try {
      // 版本号
      const draftVersionId = `${cid}-${new Date().getTime()}`;

      // 过滤邮件正文中的上传失败的内联图片和错误提示
      content = this.modelHandler.unFreezeObject(content);
      content.entry.content.content = this.modelHandler.delImgFailedUpload(content.entry.content.content);

      const contentClone = { ...content, draftVersionId };
      // 与cache整合存入
      // 删除过期草稿
      await this.modelHandler.mergeStoreUnfinishedMail(contentClone, true);
    } catch (error) {
      console.log('存草稿入本地失败', error);
    }
  }

  async doSaveTemp(params: DoSaveTempParams): Promise<MailEntryModel> {
    const { saveDraft, auto, attrObj, _account, callPurpose } = params;
    const targetActions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    // 校验存草稿间距
    if (auto && targetActions && saveDraft && Date.now() - targetActions.lastSaveTmpTimestamp < 5 * 1000) {
      return Promise.reject(new Error('存草稿过于频繁'));
    }
    let { content: _content } = params;
    let deleteLock;
    try {
      if (saveDraft) {
        const lockName = MailAbstractHandler.COMMON_DEL_ATTACHMENT_LOCK_NAME + '-' + _content.cid;
        deleteLock = this.storeApi.getLock(lockName, this.delLockExpiredTime, false, true);
        await deleteLock.lock();
      }
      // 过滤邮件正文中的上传失败的内联图片和错误提示
      _content = this.modelHandler.unFreezeObject(_content);
      _content.entry.content.content = this.modelHandler.delImgFailedUpload(_content.entry.content.content);
      // 本地存储
      // 更新 DB，返回最新 content
      let contenttmp = this.modelHandler.syncAndUpdateLocalContentInMemory(_content);
      if (!contenttmp) {
        contenttmp = await this.modelHandler.syncAndUpdateLocalContent(_content);
      } else {
        this.modelHandler.saveEntryToStore(contenttmp).then();
      }
      const content = contenttmp as MailEntryModel;
      const key = 'postMail';
      let additionalParam = saveDraft ? MailContentHandler.composeUrlParam.save : undefined;
      if (content._account) {
        additionalParam = {
          ...this.getAccountSession(content._account),
          ...(saveDraft ? MailContentHandler.composeUrlParam.save : {}),
        };
      }
      const url = this.buildUrl(key, additionalParam, !!additionalParam?._session);
      const operation = saveDraft ? 'save' : 'continue';
      const purpose = callPurpose || attrObj?.purpose || '';
      const req: MailComposeType = this.buildMailSendRequest({ content, operation, auto, purpose, attrObj });
      content.entry.sendStatus = 'sending';
      console.log('[mail-send] save tmp mail:', url, req);

      // 云附件上传接口返回的id是string，需要转化为int
      // req.attrs.attachments?.forEach(it => {it.id = typeof it.id === 'number' ? it.id :  parseInt(it.id)});
      // 移动去除多余附件逻辑到 html parse
      // this.buildFilterAttachment(req);
      // 附件处理逻辑均移动至 buildAttachmentReq
      // if (saveDraft) {
      //   req.attrs.attachments = req.attrs.attachments?.filter(item => item.id !== -1);
      // }
      // const res = this.filterAttachments(req.attrs.attachments || []);
      // req.attrs.attachments = res;
      return this.impl
        .post(url, req, { ...this.getConfigForHttp(key, { data: req, url }), _account: content._account })
        .then(this.unpackData.bind(this))
        .then(async (res: ResponseData) => {
          const re = res as ResponseComposeMail;
          if (res.code === MailContentHandler.sOk) {
            if (re.draftId) {
              content.draftId = re.draftId;
              content.newUploadedAttachment = 0;
            }
            content._id = typeof re?.var === 'string' ? res?.var : res?.var?.id;
            if (typeof res.var !== 'string') {
              const reponseMailModel = res?.var as ResponseVarModel;
              const _attachments = reponseMailModel.attachments;
              // 写信前校验
              if (callPurpose === 'sendCheck') {
                const checkPass = this.doMailAttachmentCheckFull(_attachments, content);
                content.checkPass = checkPass;
                return content;
              }
              content.entry.attachment = content.entry.attachment?.map(it => this.handleAttachmentFromServer(it, _attachments));
            }
            content.entry.sendStatus = 'saved';
            if (saveDraft && auto && targetActions) targetActions.lastSaveTmpTimestamp = Date.now();
            return this.modelHandler.saveEntryToStore(content).then(() => content);
          }
          if (content) {
            try {
              const attSize = content.entry.attachment?.filter(file => file.inlined).reduce((prev, next) => prev + (next.fileSize || 0), 0);
              this.dataTrackApi.track('pc_mail_send_error', {
                mailSize: content.totalSize,
                attSize,
                msg: re.message || re.msgCodeDesc || '',
                composeId: content.cid,
                code: re.code,
                _account,
              });
            } catch (error) {
              console.log(error);
            }
          }
          content.entry.sendStatus = 'sentFailed';

          return this.modelHandler.saveEntryToStore(content).then(() => Promise.reject(res.code));
        })
        .catch(ex => {
          content.entry.sendStatus = 'sentFailed';
          if (ex === 'FA_COMPOSE_NOT_FOUND' || ex === 'FA_ID_NOT_FOUND') {
            return Promise.reject(ex);
          }
          return this.modelHandler.saveEntryToStore(content).then(() => Promise.reject(auto ? 'failed' : this.commonCatch(ex)));
        })
        .finally(() => {
          const { cid, draftId, _account } = content;
          if (cid && content.entry.sendStatus !== 'sentFailed') {
            // 存入ComposeTable
            if (saveDraft) {
              // 非主账号不入
              if (_account && _account !== this.systemApi.getMainAccount1().email) return;
              // 版本号
              const draftVersionId = `${cid}-${new Date().getTime()}`;
              const contentClone = { ...content, draftVersionId };
              // 存入未完成表
              // 主账号独有
              this.modelHandler.saveEntryToUnfinishedMail(contentClone, true).then(() => (draftId ? this.modelHandler.coverDraft(cid, draftId) : Promise.resolve()));
            }
          }
        });
    } finally {
      if (saveDraft) {
        try {
          deleteLock && deleteLock.unlock();
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  // 生成新的信
  async doGenerateNewMail(params: DoGenerateNewMailParams): Promise<MailEntryModel> {
    const { content, generateAccount, withCloudAtt, latestedCont } = params;
    const key = 'postMail';
    content._account = generateAccount;
    if (latestedCont) content.entry.content.content = latestedCont;
    const additionalParam = this.getAccountSession(generateAccount || '');
    const url = this.buildUrl(key, additionalParam, !!additionalParam?._session);
    const req: MailComposeType = this.buildMailSendRequest({ content, operation: 'continue', purpose: withCloudAtt ? 'generateWithCloud' : '' });
    content.entry.sendStatus = 'sending';
    return this.impl
      .post(url, req, { ...this.getConfigForHttp(key, { data: req, url }), _account: generateAccount })
      .then(this.unpackData.bind(this))
      .then(async (res: ResponseData) => {
        const re = res as ResponseComposeMail;
        if (res.code === MailContentHandler.sOk) {
          content._id = typeof re?.var === 'string' ? res?.var : res?.var?.id;
          content.entry.sendStatus = 'saved';
          return content;
        }
        return Promise.reject(res.code);
      })
      .catch(ex => {
        content.entry.sendStatus = 'sentFailed';
        return Promise.reject(this.commonCatch(ex));
      });
  }

  // 生成新的信
  async doGetLatestedDraftId(params: { content: MailEntryModel; oldCid: string }): Promise<string> {
    const { content, oldCid } = params;
    const key = 'postMail';
    let additionalParam = MailContentHandler.composeUrlParam.save;
    if (content._account) {
      additionalParam = {
        ...this.getAccountSession(content._account),
        ...MailContentHandler.composeUrlParam.save,
      };
    }
    const url = this.buildUrl(key, additionalParam, !!additionalParam?._session);
    const oldContent = await this.modelHandler.loadEntryFromStore(oldCid);
    // 临时占用旧信的云附件
    content.entry.attachment = (oldContent.entry.attachment || []).filter(att => att.cloudAttachment === true || att.type === 'netfolder');
    const req: MailComposeType = this.buildMailSendRequest({ content, operation: 'save', auto: true, purpose: 'forcesave' });
    return this.impl
      .post(url, req, { ...this.getConfigForHttp(key, { data: req, url }), _account: content._account })
      .then(this.unpackData.bind(this))
      .then(async (res: ResponseData) => {
        const re = res as ResponseComposeMail;
        if (res.code === MailContentHandler.sOk) {
          if (re.draftId) {
            return re.draftId as string;
          }
          return Promise.reject('获取草稿id失败');
        }
        return Promise.reject('获取草稿id失败');
      })
      .catch(ex => {
        console.log('doGetLatestedDraftId error', ex);
        return Promise.reject('获取草稿id失败');
      });
  }

  private handleAttachmentFromServer(item: MailFileAttachModel, _attachments: AttachmentFromServerModel[]) {
    // 处理普通url附件，使用url上传, 对应类型 neturl
    const target = _attachments?.find(({ name }) => name === item.fileUrl);
    if (target) {
      return { ...item, id: target.id, fromServer: true };
    }
    const ntarget = _attachments?.find(({ id }) => id === item.id);
    if (ntarget) {
      return {
        ...item,
        serverDel: ntarget.deleted,
        fromServer: true,
      };
    }
    // 处理往来附件，使用_part, _mid 上传，对应fromInternalMail
    const mtarget = _attachments?.find(({ _mid, _part }) => _mid === item.midOfSourceMail && _part === String(item.partOfSourceMail));
    if (mtarget) {
      return {
        ...item,
        id: mtarget.id,
        serverDel: mtarget.deleted,
        fromServer: true,
      };
    }
    return item;
  }

  private async doCheckSendMailContent(_con: MailEntryModel): Promise<{ checkResult: boolean; content: MailEntryModel; errCode?: string }> {
    let contenttmp = this.modelHandler.syncAndUpdateLocalContentInMemory(_con);
    try {
      if (!contenttmp) {
        contenttmp = await this.modelHandler.syncAndUpdateLocalContent(_con);
      } else {
        this.modelHandler.saveEntryToStore(contenttmp).then();
      }
    } catch (e) {
      console.error('check mail send error ', e);
      return { checkResult: false, content: _con };
    }
    const con = contenttmp as MailEntryModel;
    // if (!con.entry.attachment || con.entry.attachment.length === 0) return { checkResult: true, content: con };
    let result;
    try {
      result = await this.doSaveTemp({ content: con, saveDraft: false, auto: false, _account: con._account, callPurpose: 'sendCheck' });
    } catch (e: any) {
      return { checkResult: false, content: con, errCode: e };
    }
    // 是否存在校验失败的附件
    const checkResult = result?.checkPass || false;
    if (checkResult) {
      return { checkResult, content: con };
    }
    return { checkResult, content: con, errCode: 'MAIL_STATUS_ERROR' };
  }

  // 重新上传写信
  private async reSend(content: MailEntryModel, isSubAccount?: boolean, isConference?: boolean) {
    const { _account } = content;
    // const attachment = content.entry.attachment ? [...content.entry.attachment].filter(_ => !_.deleted) : [];
    // 会议邀请
    if (isConference) {
      // 只有会议
      // content.entry.attachment = []; // 删除附件
      // delete content._id;
      // await this.modelHandler.saveEntryToStoreNomerge(content, content.cid); // 更新DB
      // try {
      //   content.resend = true;
      //   const _content = await this.doSaveTemp({ content, _account: content._account }); // continue 重新生成 composeId
      return { content, icsReupload: true };
      // } catch (e) {
      //   return Promise.reject(new Error('resend fail'));
      // }
    }

    // 纯文本邮件，自动重试，最多重试三次
    // if (attachment.length === 0) {
    //   // 账号切换 无附件 重传
    //   // eslint-disable-next-line no-unused-expressions
    //   isSubAccount && this.dataTrakerApi.track('pcMail_switchSender_writeMailPage_agent', { attachmentReload: 1, _account });
    //   if (content && (!content.handleTime || content.handleTime < 3)) {
    //     content.handleTime = (content.handleTime || 0) + 1;
    //     content.resend = true;
    //     try {
    //       await wait(500);
    //       const newContent = await this.doGenerateNewMail({ content, generateAccount: content._account });
    //       this.loggerApi.track('write_letter_request_before_doSendMail', { newContent, _account });
    //       await this.doSendMail(newContent);
    //       return { content: newContent };
    //     } catch (err) {
    //       return Promise.reject(new Error('resend fail'));
    //     }
    //   }
    //   return Promise.reject(new Error('resend fail'));
    // }
    // 账号切换 有附件 重传
    // eslint-disable-next-line no-unused-expressions
    isSubAccount && this.dataTrakerApi.track('pcMail_switchSender_writeMailPage_agent', { attachmentReload: 2, _account });

    // 已废弃
    // 有附件或者内联图片的回复转发在web端不能重试，因为web无法实现静默下载
    // const writeType = ['forward', 'forwardAsAttach', 'reply', 'replyAll', 'replyWithAttach', 'replyAllWithAttach', 'editDraft'];
    // if (!this.systemApi.isElectron() && content.entry.writeLetterProp && writeType.includes(content.entry.writeLetterProp)) {
    //   return Promise.reject();
    // }

    // 存在内联图片、附件，通知UI层，用户重新点击上传附件重试
    // content.resend = true;
    // content.entry.attachment = []; // 删除附件
    // delete content._id;
    // 下面两秒的处理是为了保证更新准确
    // await wait(2000).then(() => this.modelHandler.saveEntryToStoreNomerge(content, content.cid)); // 更新DB
    // await this.modelHandler.saveEntryToStoreNomerge(content, content.cid); // 更新DB
    // await this.modelHandler.syncAndUpdateLocalContent(content, true); // 更新DB
    // try {
    //   content.resend = true;
    //   const _content = await this.doSaveTemp({content}); // continue 重新生成 composeId
    //   return { content: _content, attReupload: true };
    // } catch (e) {
    //   return Promise.reject(new Error('resend fail'));
    // }
    return { content, attReupload: true };
  }

  // 用旧信生成新的信
  async doReSendInitMail(cid: string, resendAccount?: string, withCloudAtt?: boolean, latestedCont?: string): Promise<MailEntryModel> {
    // 取到content (旧cid)
    const content = await this.modelHandler.loadEntryFromStore(cid);
    const generateAccount = resendAccount || '';
    // 旧信content附件与id
    if (withCloudAtt) {
      content.entry.attachment = (content.entry.attachment || []).filter(att => att.cloudAttachment === true || att.type === 'netfolder');
    } else {
      content.entry.attachment = [];
    }
    delete content._id;
    content._account = generateAccount;
    // 存储
    // await this.modelHandler.saveEntryToStoreNomerge(content, content.cid); // 更新DB
    try {
      // 开启重传
      content.resend = true;
      // 旧的content，用新的_account，生成新的服务端资源
      const newContent = await this.doGenerateNewMail({ content, generateAccount, withCloudAtt, latestedCont });
      // 结束重传
      newContent.resend = false;
      // 生成新的cid
      newContent.cid = this.sequence.nextOne(generateAccount);
      // 无用的数据删除掉
      delete newContent.draftId;
      delete newContent.mailFormClickWriteMail;
      // 存入cache与DB
      await this.modelHandler.saveEntryToStore(newContent);
      return newContent;
    } catch (e) {
      return Promise.reject(new Error('resend fail'));
    }
  }

  async doGetExcludeAttIds(cid: string, latestedCont: string): Promise<string[]> {
    // 取到content (旧cid)
    const content = await this.modelHandler.loadEntryFromStore(cid);
    if (latestedCont) content.entry.content.content = latestedCont;
    let excludInineAtt: string[] = [];
    try {
      if (content.entry.attachment && content.entry.attachment.length > 0) {
        // 获取删除了的内联附件
        const conf: Map<string, any> = new Map<string, any>([['mailModel', content]]);
        content.entry.content.content = this.modelHandler.getTransferHtml(content.entry.content, 'sendMail', true, conf);
        content.entry.attachment.forEach(it => {
          if (it.id && (it.inlined || it.type === 'internal')) {
            // 正文中删除的图片附件 或 转发等从服务度来的附件
            if (!conf.get('img-' + it.id)) {
              excludInineAtt = [...excludInineAtt, it.id + ''];
            }
          }
        });
      }
      return excludInineAtt;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // 批量重传附件
  async doTransferAtts(params: ReUploadInfo): Promise<RespDoTransferAtts> {
    console.log('doTransferAtts', params);
    const key = 'transferAttachment';
    const url = this.systemApi.getUrl(key);
    const data = params;
    return this.impl
      .post(url, data, { contentType: 'json', timeout: 30 * 60 * 1000 })
      .then(this.unpackData.bind(this))
      .then(async (res: ResponseData) => {
        if (res?.success && res.data) {
          return res.data as RespDoTransferAtts;
        }
        return Promise.reject(res.message || '重传失败');
      })
      .catch(reason => Promise.reject(this.commonCatch(reason)));
  }

  doSendMail(con: MailEntryModel): Promise<MailEntryModel> {
    let content: MailEntryModel | undefined;
    const { _account, conference } = con;
    // 是否是子账号
    const isSubAccount = con?.optSender?.isSubAccount || false;
    // 发信前校验 调用continue
    return this.doCheckSendMailContent(con)
      .then(async res => {
        console.log('doCheckSendMailContent', res);
        const { checkResult, errCode } = res;
        let { content } = res;
        // 失效
        if (errCode === 'FA_COMPOSE_NOT_FOUND' || errCode === 'FA_ID_NOT_FOUND') {
          try {
            const reSendRes = await this.reSend(content, isSubAccount, !!conference);
            content = reSendRes.content;
            if (reSendRes.attReupload) {
              // 是否需要上传附件
              let needUploadAtt = false;
              // 存在附件
              if (reSendRes?.content?.entry?.attachment && reSendRes?.content?.entry?.attachment?.length > 0) {
                // 排除全部被删除的情况
                if (!reSendRes?.content?.entry?.attachment?.every(item => item.deleted === true)) {
                  needUploadAtt = true;
                }
              }
              if (!needUploadAtt) {
                return Promise.reject('FA_MTA_RETRY_SILENT');
              }
              return Promise.reject('FA_MTA_RETRY');
            }
            if (reSendRes.icsReupload) {
              return Promise.reject('FA_MTA_ICSRETRY');
            }
            return content;
          } catch (e) {
            return Promise.reject(errCode);
          }
        }
        if (errCode === 'MAIL_STATUS_ERROR') {
          return Promise.reject('MAIL_STATUS_ERROR');
        }
        // 正常
        if (!errCode) {
          // 子账号发出成功
          isSubAccount && this.dataTrackApi.track('pcMail_switchSender_writeMailPage_agent', { attachmentReload: 0, _account });
        }
        if (!checkResult) {
          this.loggerApi.track('write_letter_request_doSendMail_error1', { res });
          // const { errCode } = res;
          // // 503 网络超时
          // if((errCode as any)?.code === 'NETWORK.ERR.TIMEOUT') {
          //   return Promise.reject(new Error('网络超时'));
          // }
          const failedAttachment = con.entry.attachment?.filter(it => it.mailCheckResult && !it.mailCheckResult.pass);
          const names =
            failedAttachment && failedAttachment.length > 0 ? failedAttachment.reduce((pre, item) => pre + '  ' + item.name, getIn18Text('FUJIAN')) : undefined;
          if (names) {
            this.eventApi.sendSysEvent({
              eventSeq: 0,
              eventName: 'error',
              eventLevel: 'error',
              eventStrData: '',
              eventData: {
                popupType: 'window',
                popupLevel: 'error',
                title: getIn18Text('TISHI'),
                content: names + getIn18Text('WEISHANGCHUANWANCHENG，QING'),
                code: 'attachment_upload_uncompleted',
              } as PopUpMessageInfo,
            });
            return Promise.reject(new Error('mail check failed'));
          }
        }
        return content;
      })
      .then(async (newCon: MailEntryModel) => {
        content = newCon;
        await this.modelHandler.saveEntryToStore(con);
        const key = 'postMail';
        content.praiseLetter = con.praiseLetter;
        content.task = con.task;
        let url;
        // 表扬信
        if (con.praiseLetter) {
          url = this.buildPriaseUrl(key, MailContentHandler.composeUrlParam.deliver, con._account);
        } else if (content.task) {
          // 任务邮件
          url = this.buildCreateTaskUrl(
            key,
            {
              ...MailContentHandler.composeUrlParam.deliver,
            },
            con._account
          );
        } else {
          let additionalParam = MailContentHandler.composeUrlParam.deliver;
          if (con._account) {
            additionalParam = {
              ...this.getAccountSession(con._account),
              ...MailContentHandler.composeUrlParam.deliver,
            };
          }
          // 加密邮件
          if (content.setEncrypt) {
            additionalParam = {
              ...additionalParam,
              ...{ encrypt: '1', cl_send: '2' },
            };
          }
          url = this.buildUrl(key, additionalParam, !!additionalParam._session, _account);
        }
        const req: RequestComposeMail | RequestComposePraiseMail | RequestComposeTaskMail = this.buildMailSendRequest({
          content,
          operation: content.scheduleDate ? 'schedule' : 'deliver',
          auto: undefined,
          purpose: undefined,
          pureText: con.status?.puretext,
        });
        // 如果有云附件则添加入参flagLinkAttached = true
        if (con.entry.linkAttached) {
          req.flagLinkAttached = true;
        }
        console.log('[mail-send] send mail:', req);
        this.loggerApi.track('write_letter_request', { req });
        content.entry.sendStatus = 'sending';
        content.entry.folder = mailBoxOfSent.id;
        // 获取节点
        const currentNode = this.storeApi.getCurrentNode(_account);
        const headers = {
          'MAIL-SERVER-LOCATION': currentNode,
          'MAIL-SERVER-TYPE': 'QIYE_MAIL',
        };
        return this.impl.post(url, req, {
          ...this.getConfigForHttp(key, {
            url,
            data: req,
            headers,
            timeout: 90 * 1000,
          }),
          _account: con._account,
        });
      })
      .then(this.unpackData.bind(this))
      .then(async (res: ResponseData) => {
        try {
          const cloneRes = JSON.parse(JSON.stringify(res));
          if (cloneRes?.var?.content) {
            cloneRes.var.content = cloneRes.var.content.match(/<img.*?>/g);
          }
          // 目前的log百分百会被过滤，因为太长了，所以邮件正文中只留下图片到log
          this.loggerApi.track('write_letter_response', { cloneRes });
        } catch (error) {
          this.loggerApi.track('write_letter_response_tryerror', { error });
        }
        if (!content) {
          return Promise.reject(new Error('unknown error ,content is undefined'));
        }
        const re = res as ResponseComposeMail;
        if (res.code === MailContentHandler.sOk) {
          if (re.savedSent && re.savedSent.mid) {
            content.id = re.savedSent.mid;
          }
          content._id = res?.var?.id || (res?.var as string);
          content.entry.sendStatus = 'sent';
          content.errMsg = undefined;
          content.entry.tid = res.tid;
          content.entry.attachment?.forEach(attachment => {
            attachment.file && delete attachment.file;
          });
          content.sentTInfo = re.sentTInfo;
          // 发信成功同步一次远端
          try {
            this.doGetMailContent(content.id, { noCache: true, _account: content._account || '' });
          } catch (error) {
            console.log('doGetMailContent error', error);
          }
          return content;
        }
        if (re.code === 'FA_COMPOSE_NOT_FOUND' || re.code === 'FA_ID_NOT_FOUND') {
          try {
            const reSendRes = await this.reSend({ ...content, conference: con.conference }, isSubAccount, !!conference);
            content = reSendRes.content;
            if (reSendRes.attReupload) {
              if (!reSendRes?.content?.entry?.attachment || reSendRes.content.entry.attachment.length === 0) {
                return Promise.reject('FA_MTA_RETRY_SILENT');
              }
              return Promise.reject('FA_MTA_RETRY');
            }
            if (reSendRes.icsReupload) {
              return Promise.reject('FA_MTA_ICSRETRY');
            }
            return content;
          } catch (e) {
            return Promise.reject(re.code);
          }
        }
        content.entry.sendStatus = 'sentFailed';
        const msgItem = this.buildSendMailErr(re);
        if (msgItem) {
          content.errMsg = {
            code: re.code as string,
            msg: ErrMsgCodeMap[re.code as ErrMsgType],
            msgItem,
          };
          return content;
        }
        if (content) {
          try {
            const attSize = content.entry.attachment?.filter(file => file.inlined).reduce((prev, next) => prev + (next.fileSize || 0), 0);
            this.dataTrackApi.track('pc_mail_save_error', {
              mailSize: content.totalSize,
              attSize,
              msg: re.message || re.msgCodeDesc || '',
              composeId: content.cid,
              code: re.code,
              _account,
            });
          } catch (error) {
            console.log(error);
          }
        }
        // ${re.code}${re.mtaCode} 有些错误key 是组合 例如 FA_MTA_REJECTED5510
        // 1.18需求 发信拒绝要有明确理由
        return Promise.reject(
          this.commonCatch(`${re.code}${re.mtaCode || ''}`, re.message || re.msgCodeDesc || '', {
            account: con._account || '',
            overflowReason: re.overflowReason,
          })
        );
      })
      .catch(async reason => {
        content && (content.entry.sendStatus = content.entry.sendStatus || 'sentNetworkFailed');
        if (reason === 'FA_MTA_RETRY' || reason === 'FA_MTA_RETRY_SILENT' || reason === 'FA_MTA_ICSRETRY') {
          return Promise.reject(reason);
        }
        const curSendVersionId = await this.productAuthApi.asyncGetProductVersionId({ _account: _account || '' });
        // 免费版溢出特殊处理
        if (curSendVersionId === 'free') {
          if (reason === 'FA_OVERFLOW' && reason.overflowReason === 'pref_smtp_max_send_mail_size') {
            return Promise.reject('free_version_total_size_overflow');
          }
          if (reason === 'FA_UPLOAD_SIZE_EXCEEDED') {
            return Promise.reject('free_version_attachment_size_overflow');
          }
        }
        if (reason === 'MAIL_STATUS_ERROR') {
          return Promise.reject(reason);
        }
        if (content?.cid) {
          this.modelHandler.saveEntryToStore(content);
        }
        return Promise.reject(this.commonCatch(reason));
      });
  }

  // 取消发信（主账号功能）
  async doCancelDeliver(params: DoCancelDeliverParams): Promise<any> {
    const key = 'cancelDeliver';
    const url = this.buildUrl(key, { action: 'cancelDeliver' });
    const data = params;
    return this.impl
      .post(url, data, this.getConfigForHttp(key, { data, url }))
      .then(this.unpackData.bind(this))
      .then(async (res: ResponseData) => {
        const { code, message } = res;
        if (code === MailContentHandler.sOk) {
          return { success: true };
        }
        return Promise.reject(this.commonCatch(code, message || ''));
      })
      .catch(reason => Promise.reject(this.commonCatch(reason)));
  }

  // 立即发信（主账号功能）
  async doImmediateDeliver(params: DoImmediateDeliverParams): Promise<any> {
    const key = 'immediateDeliver';
    const url = this.buildUrl(key, { action: 'immediateDeliver' });
    const data = params;
    return this.impl
      .post(url, data, this.getConfigForHttp(key, { data, url }))
      .then(this.unpackData.bind(this))
      .then(async (res: ResponseData) => {
        const { code, message } = res;
        if (code === MailContentHandler.sOk) {
          return { success: true };
        }
        return Promise.reject(this.commonCatch(code, message || ''));
      })
      .catch(reason => Promise.reject(this.commonCatch(reason)));
  }

  mailRecptErrMap: StringMap = {
    MTA5104: '该邮箱被停用',
    MTA5106: '该邮箱无法收取邮件',
    MTA5107: '该邮箱不存在',
    MTA5103: '外部邮箱，您无权限外发邮件',
    MTA5101: '外部邮箱，您无权限外发邮件',
  };

  private buildSendmailErrorForCorp(res: ResponseComposeMail): MailSendErrMsgInfo[] | undefined {
    const result = [] as MailSendErrMsgInfo[];
    if (res.code === 'FA_MTA_RCPT_ERROR') {
      const errorRepts = res?.data?.errorRcpts || {};
      Object.keys(errorRepts).forEach((email: string) => {
        const errorCode = errorRepts[email] as string;
        const errorMsg = this.mailRecptErrMap[errorCode];
        if (errorCode && errorMsg) {
          result.push({
            code: errorCode,
            email,
            reason: errorMsg,
          });
        }
      });
    }
    return result && result.length ? result : undefined;
  }

  private buildSendMailErr(res: ResponseComposeMail): MailSendErrMsgInfo[] | undefined {
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    // corp的错误码需要单独处理
    if (isCorpMail) {
      return this.buildSendmailErrorForCorp(res);
    }

    if (res.errorRcpts && typeof res.errorRcpts === 'object') {
      const ret: MailSendErrMsgInfo[] = [];
      // for (const errorRcptsKey in res.errorRcpts)
      if (res && res.errorRcpts && typeof res.errorRcpts === 'object') {
        Object.keys(res.errorRcpts).forEach(it => {
          const errorRcptsKey = it as keyof IMailRecpErrMap;
          const arr = res.errorRcpts as {
            [k in keyof IMailRecpErrMap]: string[];
          };
          if (res.errorRcpts && errorRcptsKey && Object.prototype.hasOwnProperty.apply(res.errorRcpts, [errorRcptsKey]) && arr[errorRcptsKey]) {
            const item: string[] = arr[errorRcptsKey];
            item.forEach(it => {
              ret.push({
                code: errorRcptsKey,
                email: it,
                reason: MailRecpErrMap[errorRcptsKey],
              });
            });
          }
        });
      }
      return ret;
    }
    if (typeof res.errorRcpts === 'string') {
      return [
        {
          code: res.errorRcpts,
          email: '[未知邮箱]',
          reason: this.mailRecptErrMap[res.errorRcpts],
        },
      ];
    }
    return undefined;
  }

  private buildMailSendRequest(params: {
    content: MailEntryModel;
    operation: MailSendOperation;
    auto?: boolean;
    purpose?: string;
    pureText?: boolean;
    attrObj?: AttrObj;
  }): MailComposeType {
    const { operation, auto, purpose, pureText, attrObj } = params;
    const { content } = params;
    console.log('[mail-send] build send mail:', content, operation);
    const attatchment: RequestComposeMailAttachment[] = [];
    const contactReq = this.buildToContactReq(content);
    const user = this.systemApi.getCurrentUser(content._account);
    if (!user) {
      this.eventApi.sendSimpleSysEvent('logout');
      throw new Error('not login , why?');
    }
    let finalAccount = '';
    // 左下角选择账号
    const { aliasSender } = content;
    // 选择以那个账号发送
    const aliasSenderName = aliasSender?.nickName || aliasSender?.name;
    // 桌面端 多账号
    if (content._account) {
      // 判断 选择账号 是否为 发送账号的别名
      if (aliasSender && aliasSender.mailEmail === content._account) {
        finalAccount = this.buildEmailStr(aliasSender?.id, aliasSenderName);
      } else {
        finalAccount = this.buildEmailStr(content._account);
      }
    } else {
      // web 或 桌面端非多账号
      // 存在别名 取别名 否则 用当前用户
      finalAccount = aliasSender ? this.buildEmailStr(aliasSender.id, aliasSenderName) : this.buildEmailStr(user.id, user.nickName);
    }
    // 删除附件只传附件参数
    if (purpose === 'deleteAtt' && attrObj) {
      return {
        id: content._id,
        action: 'continue',
        attrs: {
          attachments: [
            {
              id: attrObj.id,
              deleted: true,
            },
          ],
          account: finalAccount,
        } as RequestComposeMailAttrs,
        delayTime: 0,
        mailTrace: false,
        returnInfo: true,
        xMailerExt,
      };
    }
    // 添加附件只传添加附件参数
    if (purpose === 'addAtt' && attrObj) {
      return {
        id: content._id,
        action: 'continue',
        attrs: {
          attachments: [
            {
              id: attrObj.id,
              deleted: false,
              inlined: attrObj.attachment?.type === 'internal', // it.type === 'internal'
            },
          ],
          account: finalAccount,
        } as RequestComposeMailAttrs,
        delayTime: 0,
        mailTrace: false,
        returnInfo: true,
        xMailerExt,
      };
    }
    // 发信前校验不用带附件
    if (purpose === 'sendCheck') {
      return {
        id: content._id,
        action: 'continue',
        attrs: {
          account: finalAccount,
        } as RequestComposeMailAttrs,
        delayTime: 0,
        mailTrace: false,
        returnInfo: true,
        xMailerExt,
      };
    }
    // 重置前强制保存草稿 不带content和attachment
    if (purpose === 'resetSaveDraft') {
      return {
        id: content._id,
        action: 'save',
        attrs: {
          account: finalAccount,
        } as RequestComposeMailAttrs,
        delayTime: 0,
        mailTrace: false,
        returnInfo: true,
        xMailerExt,
      };
    }

    const conf: Map<string, any> = new Map<string, any>([['mailModel', content]]);
    const someCloudAttach = content.entry.attachment?.some(attach => attach.cloudIdentity);
    const needHtml = pureText !== true || someCloudAttach;
    content.entry.content.content = this.modelHandler.getTransferHtml(content.entry.content, 'sendMail', needHtml, conf);
    console.log('[mail-send] got mail content conf : ', conf);

    // 附件相关 start
    if (content.entry.attachment && content.entry.attachment.length > 0) {
      // 检查内联附件
      Object.keys(conf).forEach(it => {
        if (it.startsWith('img-')) {
          const url = conf.get(it);
          const composeId = new URL(url).searchParams?.get('composeId');
          if (composeId !== content._id && content._id !== undefined) {
            const find = content.entry.attachment?.find(att => 'img-' + att.id === it);
            if (find) {
              this.eventApi.sendSysEvent({
                eventName: 'error',
                eventLevel: 'error',
                eventStrData: '',
                eventData: {
                  popupType: 'toast',
                  popupLevel: 'info',
                  title: getIn18Text('FUJIAN：') + find.fileName + getIn18Text('KENENGCUNZAISHANGCHUANCUO'),
                  content: '',
                  code: 'PARAM.ERR',
                } as PopUpMessageInfo,
                eventSeq: 0,
              });
            }
          }
        }
      });
      content.entry.attachment.forEach(it => {
        if (it.id && (it.inlined || (it.fromServer && it.type === 'internal'))) {
          // 正文中删除的图片附件 或 转发等从服务度来的附件
          if (!conf.get('img-' + it.id)) {
            it.deleted = true;
          } else {
            it.deleted = false;
          }
        }
      });
      // 请求发送前自校验
      content.entry.attachment.forEach(it => {
        if (!it.deleted && !it.ready) {
          this.loggerApi.track('write_mail_param_not_all_attachment_uploaded', content);
          this.dataTrackApi.track('write_mail_param_not_all_attachment_uploaded', { attId: it.id });
          this.eventApi.sendSysEvent({
            eventSeq: 0,
            eventName: 'error',
            eventLevel: 'error',
            eventStrData: '',
            eventData: {
              popupType: 'window',
              popupLevel: 'error',
              title: getIn18Text('TISHI'),
              content: getIn18Text('FUJIAN') + it.fileName + getIn18Text('WEISHANGCHUANWANCHENG，QING'),
              code: 'attachment_upload_uncompleted',
            } as PopUpMessageInfo,
            auto: true,
          });
          throw new Error('not completed');
        }
      });
      // 构建附件请求
      this.buildAttachmentReq(content, attatchment, operation, auto, purpose);
    }
    // 附件相关 end

    // 重置前强制保存草稿 不带content和attachment
    if (purpose === 'forcesave') {
      return {
        id: content._id,
        action: 'save',
        attrs: {
          account: finalAccount,
          content: content.entry.content.content,
        } as RequestComposeMailAttrs,
        delayTime: 0,
        mailTrace: false,
        returnInfo: true,
        xMailerExt,
      };
    }

    let to = contactReq.to && contactReq.to.length > 0 ? contactReq.to.map(item => item.emailStr) : [];
    let cc = contactReq.cc && contactReq.cc.length > 0 ? contactReq.cc.map(item => item.emailStr) : [];
    let bcc = contactReq.bcc && contactReq.bcc.length > 0 ? contactReq.bcc.map(item => item.emailStr) : [];

    if (content.isOneRcpt) {
      to = to.concat(cc, bcc);
      cc = [];
      bcc = [];
    }

    let noticeSenderReceivers: string[] = [];
    // 主账号独有
    // 开启已读提醒
    if (content.senderReceivers) {
      // 外域是否通知
      let noticeOuterDomain = false;
      // 尊享版且开启企业外邮件阅读状态追踪 才通知内域
      if (this.productAuthApi.doGetProductVersionId() === 'sirius') {
        const stateTrack = this.storeApi.getSync('stateTrack').data;
        if (stateTrack !== 'OFF') {
          noticeOuterDomain = true;
        }
      }

      // 不通知外域，剔除
      if (!noticeOuterDomain) {
        // 内域列表
        const domainList = lodashGet(this.systemApi.getCurrentUser(content?._account), 'prop.domainList', []);
        [...(contactReq?.to?.length ? contactReq.to : []), ...(contactReq?.cc?.length ? contactReq.cc : []), ...(contactReq?.bcc?.length ? contactReq.bcc : [])].forEach(
          item => {
            const { email, emailStr } = item;
            const suffix = email.split('@')[1];
            if (suffix && domainList.includes(suffix)) {
              noticeSenderReceivers.push(emailStr);
            }
          }
        );
      } else {
        noticeSenderReceivers = to.concat(cc, bcc);
      }
    }

    let delayTime = 0;
    // 发信 获取可撤销时间 全局
    if (operation === 'deliver') {
      const sendRevokeRes = this.storeApi.getSync('sendRevoke');
      if (!!sendRevokeRes.suc && sendRevokeRes.data === 'ON') {
        const sendRevokeInRes = this.storeApi.getSync('sendRevokeIn');
        if (!!sendRevokeInRes && sendRevokeInRes.data) {
          delayTime = Number(sendRevokeInRes.data);
        }
      }
    }

    // 定时发送相关
    let scheduleDate;
    let clientTimeZone;
    if (operation === 'schedule') {
      scheduleDate = content?.scheduleDate;
      clientTimeZone = content?.scheduleDateTimeZone;
    }

    // 域外状态追踪
    let mailTrace = false;
    // only发信
    if (operation && ['deliver', 'schedule'].includes(operation)) {
      // 尊享版
      if (this.productAuthApi.doGetProductVersionId() === 'sirius') {
        // 默认打开
        mailTrace = true;
        const stateTrack = this.storeApi.getSync('stateTrack').data;
        // 设置关闭
        if (stateTrack === 'OFF') {
          mailTrace = false;
        }
      }
    }

    const compose = {
      delayTime,
      returnInfo: true,
      action: operation,
      /** 开启外域邮件追踪 */
      mailTrace,
      // 定时发送时区
      ...(clientTimeZone ? { clientTimeZone } : {}),
      attrs: {
        subject: content.entry.title,
        requestReadReceipt: content.requestReadReceipt,
        to,
        cc,
        bcc,
        content: content.entry.content.content,
        attachments: attatchment,
        account: finalAccount,
        isHtml: !pureText || someCloudAttach,
        saveSentCopy: true,
        showOneRcpt: content.isOneRcpt,
        scheduleDate,
      },
      noticeSenderReceivers,
      xMailerExt,
      id: content._id,
    } as RequestComposeMail;
    if (content?.entry?.priority) {
      compose.attrs.priority = content.entry.priority;
    }
    // 加密邮件相关
    if (content?.setEncrypt) {
      compose.encryptPassword = content.entry.encpwd;
      compose.savePassword = content.savePassword || false;
    }
    let ret;
    if (content.praiseLetter) {
      // 如果是表扬信则把原参数放在compose字段下
      ret = {
        compose,
        praiseLetter: content.praiseLetter,
        id: content._id,
      };
    } else if (content.task) {
      // 任务邮件
      const fromMap: { [key in WriteLetterPropType]: string } = {
        common: 'empty',
        reply: 'reply',
        replyAll: 'reply',
        replyWithAttach: 'reply',
        replyAllWithAttach: 'reply',
        forward: 'forward',
        editDraft: 'draft',
        edit: 'draft',
        forwardAsAttach: 'empty',
      };
      let from = 'empty';
      if (content.entry.writeLetterProp) {
        from = fromMap[content.entry.writeLetterProp];
      }
      ret = {
        compose,
        task: content.task,
        from,
      };
    } else {
      ret = compose;
    }
    if (content.resend) {
      delete ret.id;
    }

    this.loggerApi.track('write_mail_param', {
      subject: content.entry.title,
      requestReadReceipt: content.requestReadReceipt,
      to,
      cc,
      bcc,
      content: content.entry.content.content.length,
      attachments: attatchment.length,
      account: finalAccount,
      isHtml: !pureText || someCloudAttach,
      saveSentCopy: true,
      showOneRcpt: content.isOneRcpt,
      scheduleDate,
    });

    return ret;
  }

  private buildToContactReq(content: MailEntryModel): { [k: string]: { [k: string]: string }[] } {
    const { receiver } = content;
    const ret: { [k: string]: { [k: string]: string }[] } = {};
    receiver.forEach(it => {
      const element = it.mailMemberType || 'to';
      let list = ret[element];
      if (!list) {
        list = [];
      }
      const email = it.contactItem.contactItemVal;
      const name = it.contact.contact.contactName;
      const emailStr = this.buildEmailStr(email, name);
      list.push({ email, name, emailStr });
      ret[element] = list;
    });
    return ret;
  }

  /** 存草稿、发送，过滤邮件正文已经删除的图片附件
   * @deprecated
   * @param req
   */
  buildFilterAttachment(req: RequestComposeMail) {
    const { attrs } = req;
    const { content } = req.attrs;
    const attachIdList: number[] = [];
    content?.replace(/attachId=([0-9]+)/g, (_, p1) => {
      attachIdList.push(parseInt(p1, 10));
      return '';
    });
    // inlined：邮件正文插入的图片而非上传的图片附件
    attrs.attachments = attrs.attachments?.map(it => {
      if (it.inlined && it.id && attachIdList.indexOf(it.id) === -1) {
        it.deleted = true;
      }
      return it;
    });
  }

  private buildEmailStr(email: string, name?: string): string {
    if (!email) {
      return '';
    }
    return name ? `"${name}" <${email}>` : email;
  }

  // 附件 远端 本地 对比校验 (就删除状态)
  // private doMailAttachmentCheck(_attachments: AttachmentFromServerModel[], content: MailEntryModel) {
  //   // 本地没有 作罢
  //   if (!content.entry?.attachment || content.entry.attachment.length === 0) return;
  //   content.entry.attachment.forEach(it => {
  //     //  非已删除 非本地云附件 从网盘中选择云附件
  //     if (!it.deleted && it.type !== 'trs' && it.type !== 'netfolder') {
  //       const attFromServer = _attachments?.find(item => item.id === it.id);
  //       // 找不到 或者 远端已删除本地未删除
  //       if (!attFromServer || (attFromServer.deleted && !it.deleted)) {
  //         it.mailCheckResult = {
  //           attachmentId: it.id,
  //           pass: false,
  //           failReason: '服务器未保存该附件',
  //         };
  //       }
  //     }
  //   });
  // }

  // 附件 远端 本地 对比校验 (全部校验)
  private doMailAttachmentCheckFull(_attachments: AttachmentFromServerModel[], content: MailEntryModel) {
    const localAttachments = content.entry?.attachment || [];
    let checkPass = true;
    console.log('doMailAttachmentCheckFull before', localAttachments, _attachments);
    // 遍历本地附件
    localAttachments.forEach(it => {
      const ckRes = { attachmentId: it.id, name: it.name };
      // 非本地云附件 从网盘中选择云附件 (云附件无法校验)
      if (it.type !== 'trs' && it.type !== 'netfolder') {
        const attFromServer = (_attachments || [])?.find(item => item.id == it.id);
        if (!attFromServer) {
          checkPass = false;
          it.mailCheckResult = { ...ckRes, pass: false, failReason: getIn18Text('FUWUQIWEIBAOCUNGAI') };
        } else if (it.deleted && !attFromServer.deleted) {
          checkPass = false;
          it.mailCheckResult = { ...ckRes, pass: false, failReason: getIn18Text('BENDESHANCHUYUANDUANWEI') };
        } else if (!it.deleted && attFromServer.deleted) {
          checkPass = false;
          it.mailCheckResult = { ...ckRes, pass: false, failReason: getIn18Text('BENDEWEISHANCHUYUANDUAN') };
        } else {
          it.mailCheckResult = { ...ckRes, pass: true };
        }
      } else {
        it.mailCheckResult = { ...ckRes, pass: true };
      }
    });

    // 校验远端
    (_attachments || []).forEach(it => {
      const { id } = it;
      const localAtt = (localAttachments || []).find(item => item.id == id);
      // 本地缺损附件
      if (!localAtt) {
        checkPass = false;
      }
    });
    // 检查未通过
    if (!checkPass) {
      this.loggerApi.track('send_mail_check_fail', { local: localAttachments, remote: _attachments });
    }
    console.log('doMailAttachmentCheckFull after', localAttachments, checkPass);
    return checkPass;
  }
}
