import type { User } from '@/api/_base/api';
import type { ResponseLoginData } from '@/api/logical/login';
import { api } from '@/api/api';

const systemApi = api.getSystemApi();

/**
 * 获取通用的请求参数
 * @returns
 */
async function getRequestParamsAsync({ sid, account, domain, deviceId }: { sid: string; account: string; domain: string; deviceId: string }) {
  const deviceInfo = await systemApi.getDeviceInfo();
  const res = {
    passtype: 2, // 明文，暂时只支持明文
    support_verify_code: 0, // 支持验证码
    account_name: account,
    domain,
    sid,
    ...deviceInfo,
  };
  res._deviceId = deviceId;
  return res;
}

function getNewImgVerifyCodeUrl(param: { baseUrl: string; accountName: string; accountDomain: string; sid: string }): string {
  const { baseUrl } = param;
  const ts = new Date().getTime();
  // @todo 最好调用通用方法
  let res = `${baseUrl}?account_name=${decodeURIComponent(param.accountName)}`;
  res += `&domain=${decodeURIComponent(param.accountDomain)}`;
  res += `&sid=${decodeURIComponent(param.sid)}`;
  res += `&ts=${decodeURIComponent(String(ts))}`;
  return res;
}

/**
 * 获取corp renewsid的接口需要的签名
 * @param accessToken
 * @param accessSecret
 * @param timestamp
 */

export function getSignForCorpRenewSid(accessToken: string, accessSecret: string, timestamp: string): string {
  const strPartArr = [`accessToken=${encodeURIComponent(accessToken)}`, `timestamp=${encodeURIComponent(timestamp)}`, `secret=${encodeURIComponent(accessSecret)}`];
  const signStr = strPartArr.join('&');
  return systemApi.sha1(signStr, true);
}

interface ICorpSignInfoForReLogin {
  accessToken: string;
  accessSecret: string;
  timeStamp: number | string;
}

function getSignForReLogin(param: ICorpSignInfoForReLogin): string {
  const { accessSecret, accessToken, timeStamp } = param;
  const arr = [];
  arr.push(`accessToken=${encodeURIComponent(accessToken)}`);
  arr.push(`timestamp=${encodeURIComponent(timeStamp)}`);
  arr.push(`secret=${encodeURIComponent(accessSecret)}`);
  return systemApi.sha1(arr.join('&'), true);
}

export function getCorpAutoLoginParams(user: User | undefined) {
  const userProp = user?.prop;
  return {
    accountName: user?.accountName as string,
    domain: user?.domain as string,
    sessionId: user?.sessionId as string,
    accessToken: userProp?.accessToken as string,
    accessSecret: userProp?.accessSecret as string,
  };
}

/**
 * 从User信息中构造ResponseLoginData
 * @param user
 */
export function getResponseLoginDataFromUser(user: User): ResponseLoginData {
  const result: ResponseLoginData = {};
  result.uid = user.id;
  result.nickname = user.nickName;
  result.sid = user.sessionId;
  result.orgName = user.company;
  result.cookieName = user.cnName;
  const userProp = user.prop;
  result.accessToken = userProp?.accessToken as string;
  result.accessSecret = userProp?.accessSecret as string;
  return result;
}

export function getReLoginParams(user: User) {
  const ts = Math.floor(new Date().getTime() / 1000);
  const userProp = user.prop || {};

  const signInfo: ICorpSignInfoForReLogin = {
    accessSecret: userProp.accessSecret as string,
    accessToken: userProp.accessToken as string,
    timeStamp: ts,
  };
  const res = {
    accessToken: userProp.accessToken,
    timestamp: ts,
    signature: getSignForReLogin(signInfo),
  };
  return res;
}

const CONSTANTS = {
  CORP_DEFAULT_PASSWORD: 'corpDefaultPsassWord',
  CORP_API_SUCCESS_CODE: '200',
  // 暂时在客户端判断
  NETEASE_CORP_DOMAIN: 'corp.netease.com',
  NETEASE_MESG_CORP_DOMAIN: 'mesg.corp.netease.com',
  NETEASE_RESET_PWD_URL: 'https://reg.netease.com/corpMail/resetPwd.jsp',
  NETEASE_WEB_HOST: 'https://corp.netease.com',
};

function getIsNeteaseDomain(domain: string): boolean {
  if (!domain) return false;
  const neteaseDomainArr = [CONSTANTS.NETEASE_CORP_DOMAIN, CONSTANTS.NETEASE_MESG_CORP_DOMAIN];
  return neteaseDomainArr.includes(domain);
}

export default {
  getRequestParamsAsync,
  getNewImgVerifyCodeUrl,
  getSignForCorpRenewSid,
  getCorpAutoLoginParams,
  getResponseLoginDataFromUser,
  getReLoginParams,
  CONSTANTS,
  getIsNeteaseDomain,
};
