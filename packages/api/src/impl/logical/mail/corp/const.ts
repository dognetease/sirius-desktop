import { StringMap } from '@/api/commonModel';

export const CORP_FOLDER_ERRCODE_MAP: StringMap = {
  FA_FORBIDDEN: '操作不允许',
  FA_HAS_CHILD: '有子文件夹，不允许删除',
  FA_OVERFLOW: '超过最大文件夹个数限制',
  FA_PARENT_NOT_FOUND: '找不到指定的父文件夹',
  FA_NAME_EXISTS: '文件夹名称重复',
  FA_NAME_INVALID: '非法文件夹名称',
  FA_ID_NOT_FOUND: '找不到指定的文件夹',
  FA_INVALID_PARENT: '父文件夹不合法',
};

export const CORP_DEFAULT_ERROR_MSG = '服务器错误，请稍后重试';

// corp的聚合模式下提取mailId的reg。
export const CORP_MAILID_SPLIT_REG = /--\d+$/;

const NETEASE_WEB_MAIL_INDEX = 'https://corp.netease.com/coremail/XT6/index.jsp';
const NETEASE_CORP_DOMAIN = 'corp.netease.com';
const NETEASE_MESG_CORP_DOMAIN = 'mesg.netease.com';

export const NETEASE_DOMAIN_ARR = [NETEASE_CORP_DOMAIN, NETEASE_MESG_CORP_DOMAIN];

export interface WebUrlInfo {
  baseUrl: string;
  hash: string;
  sid?: string;
}

export const FEATURE_NAME_TO_NETEASE_WEB_URL: { [k: string]: WebUrlInfo } = {
  'options.MailFilterModule': {
    baseUrl: NETEASE_WEB_MAIL_INDEX,
    hash: 'setting.filter.letter',
  },
  'options.FolderTagModule': {
    baseUrl: NETEASE_WEB_MAIL_INDEX,
    hash: 'setting.folder.folder',
  },
  'options.AntiSpamModule': {
    baseUrl: NETEASE_WEB_MAIL_INDEX,
    hash: 'setting.security.blacklist',
  },
  'options.BindPhone': {
    baseUrl: NETEASE_WEB_MAIL_INDEX,
    hash: 'setting.security.twofactorauth',
  },
  // 安全提醒
  mailLoginother: {
    baseUrl: NETEASE_WEB_MAIL_INDEX,
    hash: 'setting.advance.loginnotification',
  },
  // 客户端设置
  authCode: {
    baseUrl: NETEASE_WEB_MAIL_INDEX,
    hash: 'setting.advance.mua',
  },
};
