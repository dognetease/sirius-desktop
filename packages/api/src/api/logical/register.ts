import { Api } from '../_base/api';
import { MobileAccountInfo } from '@/api/logical/account';

export interface RegisterBaseParams {
  mobile: string;
  code: string;
  needGetBindAccount?: boolean;
  source?: string;
}

export interface RegisterParams extends RegisterBaseParams {
  corpName: string; // 团队名称
  domainPrefix: string; // 域名前缀，即用户填写的团队域名
  adminName: string; // 个人名称
  adminAccount: string; // 个人账号即@前面的部分
  selfDomain: string; // 已有的域名
}

export interface RegisterCommonRes {
  success: boolean;
  code?: number;
  message?: string;
}

export interface ISubmitResult extends RegisterCommonRes {
  sid?: string;
}

export interface ValidateCodeRes extends RegisterCommonRes {
  data?: MobileAccountInfo[];
  isRegister?: boolean;
  adminAccount?: string; // 在新外贸web端，跳过后两个注册步骤时会返回
  domain?: string; // 在新外贸web端，跳过后两个注册步骤时会返回
}

export interface DomainParams extends RegisterBaseParams {
  domainPrefix: string;
  corpName: string; // 团队名称
}

export interface RegisterApi extends Api {
  name: string;

  doValidateCode(params: RegisterBaseParams): Promise<ValidateCodeRes>;

  doCheckDomain(params: DomainParams): Promise<RegisterCommonRes>;

  doSubmit(params: RegisterParams): Promise<ISubmitResult>;

  getRegisterDemandList(): Promise<Array<IDemandItem>>;

  getMailDomainInfo(params: IMailDomainInfoParams): Promise<IMailDomainInfoResponse>;

  addRegisterAppendDemand(params: IAppendDemandParams): Promise<RegisterCommonRes>;
}

export interface IDemandItem {
  id: number;
  name: string;
}

export interface IAppendDemandParams {
  sid: string;
  userDemand: string;
}

export interface IMailDomainInfoParams {
  adminName: string;
  corpName: string;
  mobile: string;
}

export interface IMailDomainInfo {
  adminAccount: string;
  domainPrefix: string;
}

export interface IMailDomainInfoResponse {
  success: boolean;
  msg?: string;
  data: IMailDomainInfo | null;
}
