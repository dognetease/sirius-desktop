import { apiHolder as api, apis, MailConfApi, ProductAuthApi, SystemApi, inWindow } from 'api';
import { getIn18Text } from 'api';

const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const productAuthApi = api.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const isEnLang = inWindow() && window.systemLang === 'en';
const userInfo = systemApi.getCurrentUser();
const newHost = mailConfApi.getNewWebMailHost();
const sid = userInfo?.sessionId;
const uid = userInfo?.id;
const hl = isEnLang ? 'en_US' : 'zh_CN';

export const webMailSettingConfig = {
  recover: {
    url: `${newHost}/static/commonweb/index.html?hl=${hl}&ver=js6&fontface=none&style=7&lang=ch&skin=skyblue&color=003399&sid=${sid}&uid=${uid}&host=${newHost}#/recover`,
    params: { subModName: 'mailRecover', link: 'recover' },
  },
  inquire: {
    url: newHost + '/rdmailquery/main.ftl?sid=' + sid,
  },
  forwarding: {
    url: `${newHost}/static/commonweb/index.html?hl=${hl}&ver=js6&fontface=none&style=12&lang=ch&skin=skyblue&color=003399&sid=${sid}&uid=${uid}&host=${newHost}#/autoforward`,
  },
};

// 锚点相关的配置
export const ANCHOR_ID_MAP = {
  COMMON: 'COMMON',
  COMMON_DISPLAY_MODE: 'COMMON_DISPLAY_MODE',
  COMMON_MAIL_VIEW: 'COMMON_MAIL_VIEW',
  COMMON_LIST_DENSITY: 'COMMON_LIST_DENSITY',
  COMMON_MAIL_DISPLAY: 'COMMON_MAIL_DISPLAY',
  COMMON_SAFE_REMIND: 'COMMON_SAFE_REMIND',
  COMMON_AUTOMATIC_ADD: 'COMMON_AUTOMATIC_ADD',
  COMMON_READ_MARK: 'COMMON_READ_MARK',
  COMMON_SUBJECT_PREFIX: 'COMMON_SUBJECT_PREFIX',
  COMMON_REPLY_DIVIDER: 'COMMON_REPLY_DIVIDER',
  COMMON_REPLY_FORWARD_CLOSE: 'COMMON_REPLY_FORWARD_CLOSE',
  MAIN: 'MAIN',
  MAIN_MAIL_CLASSIFY: 'MAIN_MAIL_CLASSIFY',
  MAIN_MAIL_SIGN: 'MAIN_MAIL_SIGN',
  MAIN_MAIL_DEFAULT_CC: 'MAIN_MAIL_DEFAULT_CC',
  MAIN_MAIL_REVOCATION: 'MAIN_MAIL_REVOCATION',
  MAIN_MAIL_STATE_TRACK: 'MAIN_MAIL_STATE_TRACK',
  MAIN_MAIL_TEMPLATE: 'MAIN_MAIL_TEMPLATE',
  MAIN_AUTO_REPLY: 'MAIN_AUTO_REPLY',
  MAIN_AUTO_FORWARD: 'MAIN_AUTO_FORWARD',
  MAIN_BLACKLIST: 'MAIN_BLACKLIST',
  MAIN_MAIL_RECOVER: 'MAIN_MAIL_RECOVER',
  MAIN_SELF_QUERY: 'MAIN_SELF_QUERY',
  MAIN_FANLANJI: 'MAIN_FANLANJI',
  OTHER: 'OTHER',
  OTHER_MAIL_CHECK: 'OTHER_MAIL_CHECK',
  OTHER_MAIL_NICKNAME: 'OTHER_MAIL_NICKNAME',
  OTHER_MAIL_PROTOCOL: 'OTHER_MAIL_PROTOCOL',
  OTHER_MAIL_SIGN: 'OTHER_MAIL_SIGN',
  OTHER_MAIL_TEMPLATE: 'OTHER_MAIL_TEMPLATE',
  MAIL_ENCODING: 'MAIL_ENCODING',
  OTHER_MAIL_ALIASNAME: 'OTHER_MAIL_ALIASNAME',
};

// 锚点项配置
export const ANCHOR_LIST = [
  {
    id: ANCHOR_ID_MAP.COMMON,
    title: getIn18Text('TONGYONG'),
    items: [
      {
        id: ANCHOR_ID_MAP.COMMON_DISPLAY_MODE,
        title: getIn18Text('ZHANSHIMOSHI'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.COMMON_MAIL_VIEW,
        title: getIn18Text('YOUJIANSHITU'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.COMMON_LIST_DENSITY,
        title: getIn18Text('mailTightness'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.COMMON_MAIL_DISPLAY,
        title: getIn18Text('YOUJIANLIEBIAOZHAN'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.COMMON_SAFE_REMIND,
        title: getIn18Text('MOSHENGRENLAIXIN11'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.COMMON_AUTOMATIC_ADD,
        title: getIn18Text('FAXINHOUZIDONG'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.COMMON_READ_MARK,
        title: getIn18Text('MAIL_AUTO_MARKREADTITLE'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.COMMON_SUBJECT_PREFIX,
        title: getIn18Text('HUIFU/ZHUANFA'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.COMMON_REPLY_DIVIDER,
        title: getIn18Text('HUIFU/ZHUANFAYJSYWSFDFGX'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.COMMON_REPLY_FORWARD_CLOSE,
        title: getIn18Text('HUIFU/ZHUANFAYJSSFGBYDXY'),
        show: () => true,
      },
    ],
  },
  {
    id: ANCHOR_ID_MAP.MAIN,
    title: getIn18Text('ZHUYOUXIANG'),
    items: [
      {
        id: ANCHOR_ID_MAP.MAIN_MAIL_CLASSIFY,
        title: getIn18Text('LAIXINFENLEI'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.MAIN_MAIL_SIGN,
        title: getIn18Text('YOUJIANQIANMING'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.MAIN_MAIL_DEFAULT_CC,
        title: getIn18Text('XIEXINMORENCHAOSR/MSR'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.MAIN_MAIL_REVOCATION,
        title: getIn18Text('FAXINHOUCHEXIAO'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.MAIN_MAIL_STATE_TRACK,
        title: getIn18Text('YOUJIANZHUANGTAIZUIZONG'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.MAIN_MAIL_TEMPLATE,
        title: getIn18Text('YOUJIANMOBAN'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.MAIN_AUTO_REPLY,
        title: getIn18Text('ZIDONGHUIFU'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.MAIN_AUTO_FORWARD,
        title: getIn18Text('ZIDONGZHUANFA'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.MAIL_ENCODING,
        title: getIn18Text('YOUJIANBIANMA'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.MAIN_FANLANJI,
        title: getIn18Text('FANLAJI'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.MAIN_BLACKLIST,
        title: getIn18Text('HEIBAIMINGDAN'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.MAIN_MAIL_RECOVER,
        title: getIn18Text('YOUJIANHUIFU'),
        show: () => true,
      },
      {
        id: ANCHOR_ID_MAP.MAIN_SELF_QUERY,
        title: getIn18Text('ZIZHUCHAXUN'),
        show: () => (isEnLang ? false : true),
      },
    ],
  },
  {
    id: ANCHOR_ID_MAP.OTHER,
    title: getIn18Text('QITAYOUXIANG'),
    show: isShow => isShow,
    items: [
      {
        id: ANCHOR_ID_MAP.OTHER_MAIL_ALIASNAME,
        title: getIn18Text('YOUXIANGMINGCHENG'),
        show: data => true,
      },
      {
        id: ANCHOR_ID_MAP.OTHER_MAIL_CHECK,
        title: getIn18Text('XUANZEYOUXIANG'),
        show: data => true,
      },
      {
        id: ANCHOR_ID_MAP.OTHER_MAIL_NICKNAME,
        title: getIn18Text('FAXINNICHENG'),
        show: data => data.length > 0,
      },
      {
        id: ANCHOR_ID_MAP.OTHER_MAIL_PROTOCOL,
        title: getIn18Text('YOUXIANGXIEYI'),
        show: data => data.length > 0,
      },
      {
        id: ANCHOR_ID_MAP.OTHER_MAIL_SIGN,
        title: getIn18Text('YOUJIANQIANMING'),
        show: data => data.length > 0,
      },
      {
        id: ANCHOR_ID_MAP.OTHER_MAIL_TEMPLATE,
        title: getIn18Text('YOUJIANMOBAN'),
        show: data => data.length > 0,
      },
    ],
  },
];
