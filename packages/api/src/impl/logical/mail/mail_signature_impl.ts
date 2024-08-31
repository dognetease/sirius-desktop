import { decode as decodeHtml } from 'html-entities';
import {
  AddCustomizeSignReq,
  AddSignReq,
  AddSignRes,
  MailSignatureApi,
  SetDefaultReq,
  SignCommonRes,
  SignDetail,
  SignListReq,
  SignPreviewReq,
  SignPreviewRes,
  SignTemplate,
  SignTemplateAndProfile,
  UpdateCustomizeSignReq,
  UpdateSignReq,
  UploadSignAvatarRes,
} from '@/api/logical/mail_signature';
import { apis } from '@/config';
import { SystemApi } from '@/api/system/system';
import { DataTransApi, ResponseData } from '@/api/data/http';
import { api } from '@/api/api';
import { Api, resultObject } from '@/api/_base/api';
import { DataStoreApi } from '@/api/data/store';
import { MailConfApi, ResponseSignature, WriteLetterPropType } from '@/api/logical/mail';
import { HtmlApi } from '@/api/data/html';
import { DbApiV2, DBList } from '@/api/data/new_db';
import { EventApi } from '@/api/data/event';

// import { HtmlApi, MailConfApi, ResponseSignature } from '../../..';

class MailSignatureImplApi implements MailSignatureApi {
  name: string;

  private systemApi: SystemApi;

  eventApi: EventApi;

  private http: DataTransApi;

  private storeApi: DataStoreApi;

  private mailConfApi: MailConfApi;

  private htmlApi: HtmlApi;

  private readonly DBApi: DbApiV2;

  private dbName: DBList = 'mail_new';

  private signatureTableName = 'signature';

  constructor() {
    this.name = apis.mailSignatureImplApi;
    this.systemApi = api.getSystemApi();
    this.http = api.getDataTransApi();
    this.DBApi = api.getNewDBApi();
    this.storeApi = api.getDataStoreApi();
    this.mailConfApi = api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
    this.htmlApi = api.requireLogicalApi(apis.htmlApi) as HtmlApi;
    this.eventApi = api.getEventApi();
  }

  init(): string {
    return this.name;
  }

  afterInit() {
    this.DBApi.initDb(this.dbName);
    return this.name;
  }

  getSid(_account?: string) {
    const user = this.systemApi.getCurrentUser(_account);
    return user?.sessionId || '';
  }

  getCharAvatar(name: string) {
    if (typeof name !== 'string' || !name || !name.trim()) {
      return name;
    }

    let resChar;
    try {
      name = name.trim();
      const charList = [...name];
      resChar = charList[0];
      const hasCharacter = /[\u4e00-\u9fa5]/.test(name);
      if (hasCharacter) {
        resChar = charList.slice(-2).join('');
      }
      if (resChar.length === 1 && /[a-z]/.test(resChar)) {
        resChar = resChar.toLocaleUpperCase();
      }
    } catch (e) {
      console.warn(e);
    }
    return resChar;
  }

  getName(_account?: string) {
    const user = this.systemApi.getCurrentUser(_account);
    return this.getCharAvatar(user?.nickName || user?.accountName || '');
  }

  transUserAddItemToArray(info: any) {
    const userAddItem = info?.signInfoDTO?.userAddItem;
    if (userAddItem) {
      const res: Array<undefined | any> = [];
      const list: Array<any> = [];
      Object.keys(userAddItem).forEach(item => {
        const index = item.split('key')[1];
        if (index !== undefined) {
          res[Number(index)] = userAddItem[item];
        } else {
          list.push(userAddItem[item]);
        }
      });
      info.signInfoDTO.userAddItem = res.filter(item => item !== undefined).concat(list);
    }
    return info;
  }

  transUserAddItemToMap(info: any) {
    if (info.userAddItem) {
      info.userAddItem = info.userAddItem.reduce((obj: resultObject, cur: string, index: number) => {
        obj['key' + index] = cur;
        return obj;
      }, {});
    }
    return info;
  }

  async handlePromise<T>(promise: Promise<any>, handleData?: (data: T) => T): Promise<SignCommonRes<T>> {
    try {
      const res = await promise;
      const data = res.data as ResponseData<any>;
      return this.getCommonRes<T>(data, handleData);
    } catch (e) {
      return {
        success: false,
      };
    }
  }

  getCommonRes<T>(resData?: ResponseData<any>, handleData?: (data: T) => T) {
    if (resData?.success && resData.data) {
      let { data } = resData;
      if (handleData) {
        data = handleData(data);
      }
      return {
        data,
        success: true,
      };
    }
    return {
      success: false,
      message: resData?.message,
    };
  }

  async doGetSignList(params: SignListReq, _account?: string): Promise<SignCommonRes<SignDetail[]>> {
    const url = this.systemApi.getUrl('getSignList');
    const sid = this.getSid(_account);
    const { data, suc } = await this.storeApi.get('isFirstGet', { _account });
    const defaultParams = {
      sid,
      isFirstGet: suc && data === 'true',
      needHtmlContent: false,
    };
    params = params ? Object.assign(params, defaultParams) : defaultParams;
    const res = await this.handlePromise<SignDetail[]>(this.http.get(url, { ...params }, { _account }), sigData =>
      sigData.map(item => this.transUserAddItemToArray(item))
    );
    if (res.success) {
      this.storeApi.put('isFirstGet', 'true', { _account });
    }
    return res;
  }

  async doGetDefaultSignInDb(writeType?: WriteLetterPropType, _account?: string): Promise<ResponseSignature> {
    let personalType = 'common';
    if (['replyWithAttach', 'replyAllWithAttach', 'reply', 'replyAll'].includes(writeType || '')) {
      personalType = 'reply';
    }
    if (['forward'].includes(writeType || '')) {
      personalType = 'forward';
    }
    const currentUser = this.systemApi.getCurrentUser(_account);
    const email = currentUser?.id || '';
    const result = (await this.DBApi.getById(
      {
        tableName: this.signatureTableName,
        dbName: this.dbName,
      },
      `${email}_${personalType}_ent`
    )) as ResponseSignature;
    if (result) {
      return {
        content: result.content,
        enable: true,
      };
    }
    return {
      content: '',
      enable: false,
    };
  }

  async doGetDefaultSignInServer(writeType?: WriteLetterPropType, _account?: string): Promise<ResponseSignature> {
    const personal = this.doGetSignList({}, _account);
    // corpMail暂时没有该功能
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    const ent = isCorpMail ? Promise.resolve({ content: '', isDefault: false, enable: false }) : this.mailConfApi.getEntSignature(false, _account);

    return Promise.all([personal, ent])
      .then(async r => {
        const defaultSigModel = r[0]?.data?.find(item => {
          if (['replyWithAttach', 'replyAllWithAttach', 'reply', 'replyAll'].includes(writeType || '')) {
            return item.signInfoDTO.defaultItem.reply;
          }
          if (['forward'].includes(writeType || '')) {
            return item.signInfoDTO.defaultItem.forward;
          }
          return item.signInfoDTO.defaultItem.compose;
        });
        let resContent = defaultSigModel?.divContent ? `<div class="mail-signature">${defaultSigModel?.divContent}</div>` : '';
        if (r[1] && r[1].content) {
          r[1].content = `<div class="mail-signature-ent">${decodeHtml(r[1].content, { level: 'html5' }) || ''}</div>`;
          const s = r[1].isDefault ? this.htmlApi.mergeHtmlStr(resContent, r[1].content) : this.htmlApi.mergeHtmlStr(r[1].content, resContent);
          resContent = r[1].enable ? s : resContent;
        }
        const defaultSignChange = await this.defaultSignDiffs(resContent, writeType, _account);
        return {
          enable: true,
          defaultSignChange,
          content: resContent,
          personalSignList: r[0]?.data,
        } as ResponseSignature;
      })
      .catch(
        () =>
          ({
            content: '',
            enable: false,
          } as ResponseSignature)
      );
  }

  async defaultSignDiffs(content: string, writeType?: WriteLetterPropType, _account?: string) {
    let personalType = 'common';
    if (['replyWithAttach', 'replyAllWithAttach', 'reply', 'replyAll'].includes(writeType || '')) {
      personalType = 'reply';
    }
    if (['forward'].includes(writeType || '')) {
      personalType = 'forward';
    }
    const dbResult = await this.doGetDefaultSignInDb(writeType, _account);
    if (dbResult.content !== content) {
      // 更新数据库
      const currentUser = this.systemApi.getCurrentUser(_account);
      const email = currentUser?.id || '';
      this.DBApi.put(
        {
          tableName: this.signatureTableName,
          dbName: this.dbName,
        },
        {
          // id是${账号_类型type_signId)，方便后期统一将个人签名和企业签名存入本地库
          // 因为默认签名是企业签名和个人签名拼接的，所有没有signId，所以id为email_personalType_ent
          id: `${email}_${personalType}_ent`,
          type: `${email}_${personalType}_ent`,
          signId: undefined,
          content,
        }
      ).then();
      return true;
    }
    return false;
  }

  async doGetDefaultSign(noCache?: boolean, writeType?: WriteLetterPropType, _account?: string): Promise<ResponseSignature> {
    // const promise = this.doGetDefaultSignInServer();
    if (noCache) {
      return this.doGetDefaultSignInServer(writeType, _account);
    }
    const dbResult = await this.doGetDefaultSignInDb(writeType, _account);
    if (dbResult && dbResult.enable) {
      // 本地数据库中有数据
      return dbResult;
    }
    // 调用服务端接口
    return this.doGetDefaultSignInServer(writeType, _account);
  }

  doGetSignDetail(id: number): Promise<SignCommonRes<SignDetail>> {
    const url = this.systemApi.getUrl('getSignDetail');
    return this.handlePromise<SignDetail>(this.http.get(url, { id }), data => this.transUserAddItemToArray(data));
  }

  doGetSignTemplateAndProfile(avatarDisplayName?: string, _account?: string): Promise<SignCommonRes<SignTemplateAndProfile>> {
    avatarDisplayName = avatarDisplayName || this.getName(_account);
    const url = this.systemApi.getUrl('getSignTemplateAndProfile');
    return this.handlePromise<SignTemplateAndProfile>(this.http.get(url, { avatarDisplayName }, { _account }));
  }

  async doGetSignPreview(params: SignPreviewReq, _account?: string): Promise<SignCommonRes<SignPreviewRes>> {
    const url = this.systemApi.getUrl('getSignPreview');
    const { signInfo } = params;
    if (!signInfo.profilePhoto) {
      const res = await this.doGetSignTemplateAndProfile(undefined, _account);
      if (res.success && res.data?.profile) {
        signInfo.profilePhoto = res.data?.profile;
      } else {
        return {
          success: false,
        };
      }
    }
    params.signInfo = this.transUserAddItemToMap(signInfo);
    return this.handlePromise<SignPreviewRes>(this.http.post(url, params, { contentType: 'json', ...{ _account } }));
  }

  async doAddSign(params: AddSignReq & AddCustomizeSignReq, _account?: string): Promise<SignCommonRes<AddSignRes>> {
    let url = '';
    if (params.rtxContent) {
      url = this.systemApi.getUrl('addCustomizeSign');
    } else {
      url = this.systemApi.getUrl('addSign');
      if (!params.profilePhoto) {
        const res = await this.doGetSignTemplateAndProfile(undefined, _account);
        if (res.success && res.data?.profile) {
          params.profilePhoto = res.data?.profile;
        } else {
          return {
            success: false,
          };
        }
      }
      params = this.transUserAddItemToMap(params);
    }
    return this.handlePromise<AddSignRes>(this.http.post(url, params, { contentType: 'json', ...{ _account } }));
  }

  doSetDefaultSign(params: SetDefaultReq, _account?: string): Promise<SignCommonRes> {
    const url = this.systemApi.getUrl('setDefaultSign');
    return this.handlePromise<undefined>(this.http.post(url, params, { contentType: 'json', ...{ _account } }));
  }

  doUpdateSign(params: UpdateSignReq & UpdateCustomizeSignReq, _account?: string): Promise<SignCommonRes<SignDetail>> {
    let url = '';
    let handle;
    if (params.rtxContent) {
      url = this.systemApi.getUrl('updateCustomizeSign');
    } else {
      url = this.systemApi.getUrl('updateSign');
      params = this.transUserAddItemToMap(params);
      handle = (data: SignDetail) => this.transUserAddItemToArray(data);
    }
    return this.handlePromise<SignDetail>(this.http.post(url, params, { contentType: 'json', ...{ _account } }), handle);
  }

  doDeleteSign(signId: number, _account: string): Promise<SignCommonRes> {
    const url = this.http.buildUrl(this.systemApi.getUrl('delSign'), { signId });
    return this.handlePromise<undefined>(this.http.post(url, {}, { _account }));
  }

  doUploadSignAvatar(file: File): Promise<SignCommonRes<UploadSignAvatarRes>> {
    const url = this.systemApi.getUrl('uploadSignAvatar');
    const fileFormData = new FormData();
    fileFormData.append('picFile', file);
    return this.handlePromise<UploadSignAvatarRes>(
      this.http.post(url, fileFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        contentType: 'stream',
      })
    );
  }

  doGetSignTemplate(): Promise<SignCommonRes<SignTemplate[]>> {
    const url = this.systemApi.getUrl('getSignTemplate');
    return this.handlePromise<SignTemplate[]>(this.http.get(url));
  }
}

const mailSignatureImplApi: Api = new MailSignatureImplApi();

api.registerLogicalApi(mailSignatureImplApi);

export default mailSignatureImplApi;
