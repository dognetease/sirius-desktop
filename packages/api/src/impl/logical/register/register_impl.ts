import { config } from 'env_def';
import { apis } from '@/config';
import { Api } from '@/api/_base/api';
import { api } from '@/api/api';
import { EventApi } from '@/api/data/event';
import { SystemApi } from '@/api/system/system';
import { DataStoreApi } from '@/api/data/store';
import {
  DomainParams,
  RegisterApi,
  RegisterCommonRes,
  RegisterParams,
  RegisterBaseParams,
  ValidateCodeRes,
  IDemandItem,
  IAppendDemandParams,
  IMailDomainInfoParams,
  IMailDomainInfoResponse,
  IMailDomainInfo,
  ISubmitResult,
} from '@/api/logical/register';
import { DataTransApi } from '@/api/data/http';
import { AccountApi } from '@/api/logical/account';
import { LoginApi } from '@/api/logical/login';

// const forElectron = config('build_for') === 'electron';

class RegisterApiImp implements RegisterApi {
  name: string;

  eventApi: EventApi;

  systemApi: SystemApi;

  storeApi: DataStoreApi;

  httpApi: DataTransApi;

  accountApi: AccountApi;

  loginApi: LoginApi;

  isReady = false;

  isInited = false;

  version: string = config('version') as string;

  constructor() {
    this.name = apis.registerApiImpl;
    this.eventApi = api.getEventApi();
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
    this.httpApi = api.getDataTransApi();
    this.accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
    this.loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
  }

  /**
   * 获取当前用户的email
   * */
  getEmail() {
    const user = this.systemApi.getCurrentUser();
    return user?.id;
  }

  async doValidateCode(params: RegisterBaseParams) {
    let res: ValidateCodeRes = {
      success: false,
    };
    try {
      const url = this.httpApi.buildUrl(this.systemApi.getUrl('registerValidateCode'), { ...params });
      const { data } = await this.httpApi.post(url);
      const { code, msg: message, data: info } = data || {};
      if (String(code) === '200') {
        res = {
          success: true,
          isRegister: false,
          adminAccount: info?.adminAccount,
          domain: info?.domain,
        };
      } else if (String(code) === '6020') {
        if (params.needGetBindAccount === undefined || params.needGetBindAccount) {
          const { success, data: accountList, message: loginErrorMsg } = await this.loginApi.doMobileVerifyCode(params.code);
          if (success) {
            res = {
              success: true,
              isRegister: true,
              data: accountList,
            };
          } else {
            res = {
              success: false,
              message: loginErrorMsg,
            };
          }
        } else {
          res = {
            success: true,
            isRegister: true,
            data: [],
          };
        }
      } else {
        res = {
          success: false,
          message,
        };
      }
    } catch (e) {
      console.error('[register_impl] validateCode error', e);
      res = {
        success: false,
      };
    }
    return res;
  }

  async getRegisterDemandList(): Promise<Array<IDemandItem>> {
    try {
      const url = this.systemApi.getUrl('registerDemandList');
      const { data } = await this.httpApi.get(url);
      if (String(data?.code) === '200') {
        return data?.data.demandList as Array<IDemandItem>;
      }
      return [];
    } catch (ex) {
      console.error('getRegisterDemandList error', ex);
      return [];
    }
    return [];
  }

  async getMailDomainInfo(params: IMailDomainInfoParams) {
    const res: IMailDomainInfoResponse = {
      success: false,
      msg: '',
      data: null,
    };
    try {
      const url = this.systemApi.getUrl('registerMailDomainInfo');
      const { data } = await this.httpApi.post(url, params);
      const { code, msg: message } = data || {};
      if (String(code) === '200') {
        const unusedName = data?.data?.unusedName;
        if (unusedName) {
          res.success = true;
          res.data = unusedName as IMailDomainInfo;
        }
      } else {
        res.msg = message as string;
      }
    } catch (ex) {
      console.error('getMailDomainInfo error', ex);
    }
    return res;
  }

  async addRegisterAppendDemand(params: IAppendDemandParams) {
    const res: RegisterCommonRes = {
      success: false,
    };
    try {
      const url = this.systemApi.getUrl('registerAppendDemand');
      const { data } = await this.httpApi.post(url, params);
      const { code, msg: message } = data || {};
      if (String(code) === '200') {
        res.success = true;
      } else {
        res.message = message;
      }
    } catch (ex) {
      console.error('addRegisterAppendDemand error', ex);
    }
    return res;
  }

  async doCheckDomain(params: DomainParams) {
    let res: RegisterCommonRes = {
      success: false,
    };
    try {
      const url = this.httpApi.buildUrl(this.systemApi.getUrl('registerCheckDomain'), { domainSuffix: 'ntesmail.com', ...params });
      const { data } = await this.httpApi.get(url);
      const { code, msg: message } = data || {};
      if (String(code) === '200') {
        res = {
          success: true,
        };
      } else {
        res = {
          success: false,
          message,
        };
      }
    } catch (e) {
      console.error('[register_impl] checkDomain error', e);
      res = {
        success: false,
        message: (e as Error).message,
      };
    }
    return res;
  }

  async doSubmit(params: RegisterParams) {
    let res: ISubmitResult = {
      success: false,
      sid: '',
    };
    try {
      const source = window && window.electronLib ? 'lx_desktop' : 'lx_web';
      const url = this.httpApi.buildUrl(this.systemApi.getUrl('registerSubmit'), { source, domainSuffix: 'ntesmail.com', ...params });
      const { data } = await this.httpApi.post(url);
      const { code, msg: message } = data || {};
      if (String(code) === '200') {
        res.success = true;
        res.sid = data?.data?.sid;
      } else {
        res = {
          success: false,
          message,
          code: code as number,
        };
      }
    } catch (e) {
      console.error('[register_impl] submit error', e);
      res = {
        success: false,
        message: (e as Error).message,
      };
    }
    return res;
  }

  init(): string {
    return this.name;
  }

  afterInit(): string {
    console.warn('[register_impl] afterInit');
    return this.name;
  }

  afterLogin(): string {
    return this.name;
  }

  beforeLogout(): string {
    return this.name;
  }
}

const impl: Api = new RegisterApiImp();
api.registerLogicalApi(impl);
export default impl;
