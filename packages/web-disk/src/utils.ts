import {
  apiHolder,
  apis,
  ExternalShareLinkValidPeriod,
  MailApi,
  NSDirContent,
  NSFileContent,
  // NSFileDetail,
  conf,
  inWindow,
  locationHelper,
  MailConfApi,
  SystemApi /*CloudAtt*/,
} from 'api';
import dayjs from 'dayjs';
import { getIn18Text } from 'api';
import { getLingXiEntryHost } from '@web-common/utils/utils';
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const systemApi: SystemApi = apiHolder.api.getSystemApi();
const mailConfApi: MailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
const contextPath = conf('contextPath') as string;
// 权限value转成string[]
export const formatAuthTexts = (
  roleInfos:
    | {
        roleId: number;
        roleName: string;
      }[]
    | null
): string[] => {
  // 没有roleInfos的为个人空间... 后期最好加上标志 用字段来匹配略坑。。
  if (!Array.isArray(roleInfos)) {
    return ['Master'];
  }
  if (!roleInfos.length) {
    return ['Empty'];
  }
  const roleList = roleInfos.map(item => item.roleName);
  return roleList.join('/').split('/');
};
// 移动至模块获取权使用
export const computeAuthWeight = (authList: string[]) => {
  const authMap = new Map([
    [getIn18Text('CHAKAN'), 0],
    [getIn18Text('GUANLI'), 2 + 1],
    [getIn18Text('SHANGCHUAN'), 1],
    [getIn18Text('XIAZAI'), 0],
    ['Master', 4 + 2 + 1],
    ['Empty', 0],
  ]);
  const weightValue = authList.reduce((total, cur: string) => {
    const curWeight = authMap.has(cur) ? (authMap.get(cur) as number) : 0;
    return total | curWeight;
  }, 0);
  return weightValue;
};
/**
 * 检查是否有操作权限
 * @param item  单条文件记录
 * @param action 操作
 * @returns
 */
export const checkActionAuth = (item: NSDirContent | NSFileContent, action: 'rename' | 'delete' | 'move' | 'detail' | 'download') => {
  const isDir = item.extensionType === 'dir';
  // 个人空间authorityDetail为null，拥有全部权限
  if (item?.authorityDetail === null) return true;
  // 企业空间拥有authorityDetail，主页与与我分享拥有roles
  const privileges = item?.authorityDetail?.privilegeInfos || item?.roles;
  if (action == 'detail') return privileges?.length > 0;
  const hasAuth = privileges?.some(({ privilegeName }) => {
    switch (action) {
      case 'rename':
        return isDir ? privilegeName === getIn18Text('ZHONGMINGMINGWENJIAN11') : privilegeName === getIn18Text('ZHONGMINGMINGWENJIAN');
      case 'download':
        /** todo checkdownload auth */
        return isDir ? false : privilegeName === getIn18Text('XIAZAI');
      default:
        return false;
    }
  });
  return hasAuth;
};
// 格式化权限
// mode simple 简写模式
export const formatAuthority = (roleInfos, type, mode = '') => {
  if (!Array.isArray(roleInfos)) return '';
  const resAry = roleInfos
    .reduce((pre: any, cur: any) => {
      let item = cur.roleName;
      if (item === '管理') {
        item = mode == 'simple' ? '管理者' : '查看/上传/下载/编辑/管理';
      }
      if (item === '编辑') {
        item = mode == 'simple' ? '可编辑' : '查看/上传/下载/编辑';
      }
      return pre.concat(item.split('/'));
    }, [])
    .filter((item: any) => {
      if (type && type !== 'dir' && item === '上传') {
        return false;
      }
      return true;
    });
  // 4. 如果有下载 就加上查看
  if (resAry.some((item: any) => item === '下载')) {
    resAry.unshift('查看');
  }
  // 5.去重 可能存在 查看/上传/下载/管理  和  查看/下载  需要去重
  return [...new Set(resAry)].join('/');
};
export const calcPrivilege = (roleInfos): CoactorPrivilege => {
  if (!Array.isArray(roleInfos)) return getIn18Text('KECHAKAN');
  const roleNames = roleInfos.map(item => item.roleName);
  if (roleNames.includes(getIn18Text('GUANLI'))) {
    return getIn18Text('GUANLIZHE');
  }
  if (roleNames.includes(getIn18Text('BIANJI'))) {
    return getIn18Text('KEBIANJI');
  }
  if ((roleNames.includes(getIn18Text('SHANGCHUAN')) && roleNames.includes(getIn18Text('XIAZAI'))) || roleNames.includes(getIn18Text('SHANGCHUAN/XIAZAI'))) {
    return getIn18Text('KECHAKAN/SHANG');
  }
  if (roleNames.includes(getIn18Text('SHANGCHUAN'))) {
    return getIn18Text('KESHANGCHUAN');
  }
  if (roleNames.includes(getIn18Text('XIAZAI'))) {
    return getIn18Text('KECHAKAN/XIA');
  }
  return getIn18Text('KECHAKAN');
};
/**
 * @description: 2020年10月11日 下午3:46
 * @param {string} date
 * @return {*}
 */
export const timeFormatTwo = (date: string | number, useServerTimeZone: boolean) => {
  if (!date) return '';
  if (typeof date === 'string') date = date.replace(/-/g, '/');
  const timeZone = mailConfApi.getTimezone();
  const formdate = new Date(systemApi.getDateByTimeZone(date, timeZone, useServerTimeZone));
  const hours = formdate.getHours() % 12;
  const hoursText = formdate.getHours() > 12 ? getIn18Text('XIAWU') : getIn18Text('SHANGWU');
  const minutes = formdate.getMinutes() > 9 ? formdate.getMinutes() : '0' + formdate.getMinutes();
  return `${formdate.getFullYear()}年${formdate.getMonth() + 1}月${formdate.getDate()}日 ${hoursText}${hours || 12}:${minutes}`;
};
export const getTrail = name => {
  if (!name) return '';
  const splitName = name.split('.');
  if (splitName.length > 1) {
    return splitName[splitName.length - 1];
  }
  return getIn18Text('WEIZHI');
};
/** 空间文件分享链接规格化 */
export const normalizeShareUrl = (url: string) => (url.indexOf('http') === 0 ? url : `https://${url}`);
export const getFileType = (file: NSFileContent): string => {
  if (file.fileType === 'excel') {
    return getIn18Text('XIETONGBIAOGE');
  }
  if (file.fileType === 'doc') {
    return getIn18Text('XIETONGWENDANG');
  }
  if (file.fileType === 'unitable') {
    return 'Unitable';
  }
  return getTrail(file.name).toUpperCase();
};
export const isImage = (file: NSFileContent): boolean => {
  let _isImage = false;
  switch (file.extensionType?.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
    case 'png':
    case 'gif':
      _isImage = true;
      break;
  }
  return _isImage;
};
export type FileIconParam = {
  name?: string;
  fileName?: string;
  fileType?: string;
};
// 获取icon需要的type
export const getFileIcon = (file: FileIconParam): string => {
  const { name, fileName, fileType } = file;
  const theName = name || fileName;
  if (fileType === 'excel') {
    return 'lxxls';
  }
  if (fileType === 'doc') {
    return 'lxdoc';
  }
  if (fileType === 'unitable') {
    return 'lxunitable';
  }
  return getTrail(theName).toLowerCase();
};
export const getShareLink = (item: ExternalShareLinkDetail): string => {
  const host = window && window.electronLib ? conf('host') : `https://${locationHelper.getHost()}` || 'https://su-desktop-web.cowork.netease.com:8000';
  const isDir = item.resourceType === 'DIRECTORY';
  return host + contextPath + `/share_anonymous/#type=${item.resourceType}&shareIdentity=${item.shareIdentity}&${isDir ? 'dirId' : 'fileId'}=${item.resourceId}`;
};
export const sendShareLinkMail = (item: ExternalShareLinkDetail) => {
  const link = getShareLink(item);
  const { resourceName, shareTime, validPeriod } = item;
  let validPeriodDate = '';
  if (validPeriod.intervalType === 'RELATIVE') {
    if (validPeriod.period === -1) {
      validPeriodDate = getIn18Text('YONGJIU');
    } else {
      validPeriodDate = validPeriod.period + getIn18Text('TIAN');
    }
  } else {
    validPeriodDate = simpleFormatTime(validPeriod.interval!.startTime, true) + '-' + simpleFormatTime(validPeriod.interval!.endTime, true);
  }
  mailApi.callWriteLetterFunc({
    mailType: 'common',
    withoutPlaceholder: true,
    writeType: 'common',
    originContent: `<p>分享资料：${resourceName}</p><p>分享时间：${simpleFormatTime(
      shareTime
    )}</p><p>有效期：${validPeriodDate}</p><p>分享链接：<a href=${link} target="_blank">${link}</a></p>`,
  });
};
export const simpleFormatTime = (time?: string | number | Date, endOfDay?: boolean, useServerTimezone?: boolean) => {
  // const now = dayjs();
  // const timeDayjs = dayjs(time);
  const timeZone = mailConfApi.getTimezone();
  const now = dayjs(systemApi.getDateByTimeZone(new Date(), timeZone));
  const _time = time ? systemApi.getDateByTimeZone(time, timeZone, useServerTimezone) : time;
  const timeDayjs = dayjs(_time);

  const sameYear = now.year() === timeDayjs.year();
  return dayjs(_time).format(
    `${sameYear ? getIn18Text('MYUEDRI') : getIn18Text('YYYYNIAN')}${
      endOfDay ? '' : ` ${timeDayjs.format('A') === 'PM' ? getIn18Text('XIAWU') : getIn18Text('SHANGWU')}h:mm`
    }`
  );
};
/**
 * 计算剩余时间 例如 29天4小时
 * 剩余有限期显示最多30天
 * >=1天，显示X天X小时（1天24小时显示为2天）；
 * >=1小时且<1天，显示X小时；
 * >=1分且<1小时，显示X分；
 * 小于1分钟，显示X秒
 * @param startTime 开始时间， 时间戳或标准时间格式
 * @param endTime 结束时间，时间戳或标准时间格式
 * @returns 3天2小时
 */
export const remainderDateFormat = (startTime: string | number, endTime: string | number): string => {
  try {
    const timeZone = mailConfApi.getTimezone();
    const _endTime = dayjs(systemApi.getDateByTimeZone(endTime, timeZone));
    const _startTime = dayjs(systemApi.getDateByTimeZone(startTime, timeZone));
    const days = _endTime.diff(_startTime, 'd');
    const hours = _endTime.diff(_startTime, 'h');
    const minutes = _endTime.diff(_startTime, 'm');
    const seconds = _endTime.diff(_startTime, 's');
    let res = days >= 1 ? `${days}天` : '';
    res += hours % 24 >= 1 ? `${hours % 24}小时` : '';
    res += minutes % 60 >= 1 && days < 1 ? `${minutes % 60}分钟` : '';
    res += seconds < 60 ? `${seconds}秒` : '';
    return res;
  } catch (error) {
    return '';
  }
};
export type CoactorPrivilege = '可查看' | '可上传' | '可查看/下载' | '可查看/上传/下载' | '可编辑' | '管理者';
export type externalCoactorPrivilege = '可查看' | '可查看/下载';
export interface ExternalShareLinkDetail {
  resourceId: number;
  resourceType: 'FILE' | 'DIRECTORY';
  resourceName: string;
  shareTime: string;
  shareIdentity: string;
  validPeriod: ExternalShareLinkValidPeriod;
}
// max convert file size
// the same file will display different MB size (windows-1024*1024, mac-1000*1000)
// but the bytes size is same
export const CONVERT_MAX_SIZE = inWindow() && window.navigator.userAgent.match(/windows nt/i) ? 200 * 1024 * 1024 : 200 * 1000 * 1000;
export const MB_SIZE = inWindow() && window.navigator.userAgent.match(/windows nt/i) ? 1024 * 1024 : 1000 * 1000;
export function getConvertFileType(fileType: string): 'doc' | 'sheet' | '' {
  if (fileType === 'docx') {
    return 'doc';
  }
  if (['xls', 'xlsx', 'csv'].includes(fileType)) {
    return 'sheet';
  }
  return '';
}

// 外贸文档跳转
export const edmJump = (shareUrl: string) => {
  const curUserInfo = systemApi.getCurrentUser();
  if (!curUserInfo) {
    systemApi.openNewWindow(shareUrl);
    return;
  }
  let toUrl = encodeURIComponent(shareUrl);
  let fromUrl = encodeURIComponent(window.location.href);
  const search = `toUrl=${toUrl}&jumpType=0&jumpMode=jumpOut&sid=${curUserInfo.sessionId}&uid=${curUserInfo.id}&fromUrl=${fromUrl}`;
  const jumpUrl = getLingXiEntryHost() + 'jump/?' + search;
  console.log('jumpUrl', jumpUrl, curUserInfo);
  systemApi.openNewWindow(jumpUrl);
};
