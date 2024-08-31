import { config } from 'env_def';
import type { EmailAccountDomainInfo } from '@/api/_base/api';
import type { ResponseData } from '@/api/data/http';
import { ErrMsgCodeMap, ErrMsgType } from '@/api/errMap';

/**
 * 检查accountDomainInfo是否合法
 * @param accountDomainInfo accountDomainInfo
 * @returns
 */
function checkAccountAndDomain(accountDomainInfo: EmailAccountDomainInfo): boolean {
  if (!accountDomainInfo || !accountDomainInfo.account || !accountDomainInfo.domain) {
    return false;
  }
  return true;
}

/**
 *
 * @returns email输入错误信息
 */
function getInputEmailErrorMsg(): string {
  return getErrorMsgByErrorCode('ERR.LOGIN.ILLEGALINPUT');
}

/**
 * 根据错误码获取错误信息
 * @param errCode
 * @returns
 */
function getErrorMsgByErrorCode(errCode: ErrMsgType): string {
  return ErrMsgCodeMap[errCode];
}

/**
 *
 * @param mailCode 邮件模式枚举值
 * @returns 邮件模式字符串值
 */
function getMailModeValByMailModeCode(mailCode: string): string {
  const codeToConfigKey: { [k: string]: string } = {
    hm: 'mail_mode_HMail', // hMail的版本
    cm: 'mail_mode_corpMail',
  };
  const configKey = codeToConfigKey[mailCode] as string;
  return config(configKey) as string;
}

/**
 *
 * @returns 获取默认的邮件模式
 */
function getDefaulaMailModeVal(): string {
  return config('default_mail_mode') as string;
}

/**
 * 获取企业邮MailMode Val
 * @returns
 */
function getCorpMailModeVal(): string {
  return config('mail_mode_corpMail') as string;
}

/**
 * 获取企业邮MailMode val
 * @returns
 */
function getHMailModeVal(): string {
  return config('mail_mode_HMail') as string;
}

/**
 * 通过PreloginCheck的接口响应返回maimMode
 */
export function getMaiModeFromPreLoginResponse(res: ResponseData): string {
  if (String(res.code) !== '200') {
    return getDefaulaMailModeVal();
  }
  const resData = res.data || {};
  const mailSys = resData?.sys || 'hm';
  return getMailModeValByMailModeCode(mailSys);
}

/**
 * 是否是corpMailMode
 * @param mailModeVal
 * @returns
 */
export function getIsCorpMailMode(mailModeVal: string): boolean {
  return mailModeVal === getCorpMailModeVal();
}

export default {
  getMaiModeFromPreLoginResponse,
  getIsCorpMailMode,
  getCorpMailModeVal,
  getHMailModeVal,
  getDefaulaMailModeVal,
  checkAccountAndDomain,
  getInputEmailErrorMsg,
};
