import { apis, ContactInfoType, ContactModel, NIMApi, apiHolder, HtmlApi, IMMessage, SystemApi } from 'api';
import { emojiSourceMap, emojiList } from '../common/emojiList';
// import { UIContactModel } from '../../Contacts/data';
const nimApi = apiHolder.api.requireLogicalApi(apis.imApiImpl) as NIMApi;
const htmlApi = apiHolder.api.requireLogicalApi(apis.htmlApi) as HtmlApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
export const LINGXI_IM_TEAM_DEFAULT_NAME = 'LINGXI_IM_TEAM_DEFAULT_NAME_c1c50e13';
export const EMOJI_TAG_REGEXP = new RegExp('\\[[^\\[\\]]+\\]', 'g');
import { ERROR_FALLBACK as _ERROR_FALLBACK } from './const';

export const TEAM_AUTH_EXPLAIN = {
  teamAvatar: ['owner', 'manager', 'normal'],
  teamNameIntro: ['owner', 'manager', 'normal'],
  teamAnnouncement: ['owner', 'manager', 'normal'],
};

export const ERROR_FALLBACK = _ERROR_FALLBACK;

export const base64ConvertFile = (base64Data: string) => {
  // 64转file
  if (typeof base64Data !== 'string') {
    return;
  }
  const arr = base64Data.split(',');
  const type = arr[0].match(/:(.*?);/)[1];
  const fileExt = type.split('/')[1];
  // 过滤换行符，否则可能是无效的base64字符串
  const bstr = atob(arr[1].replace(/\s/g, ''));
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n >= 0) {
    u8arr[n] = bstr.charCodeAt(n);
    n -= 1;
  }
  return new File([u8arr], 'image.' + fileExt, { type });
};

export const filterContactListByYunxin = (list: ContactModel[]) => filterContactListByType(list, 'yunxin');

export const filterContactListByType = (list: ContactModel[], type: ContactInfoType): ContactModel[] => {
  if (!list?.length) {
    return [];
  }
  const res: ContactModel[] = [];
  list.forEach(item => {
    const { contact, contactInfo } = item;
    const info = contactInfo.filter(info => info.contactItemType === type);
    if (info.length) {
      res.push({
        contact,
        contactInfo: info,
      });
    }
  });
  return res;
};

export const getTeamName = (teamDetail: any): string => nimApi!.getTeamName(teamDetail);

export const parseValue = (str: string) => {
  try {
    const obj = JSON.parse(str);
    return obj.text || '';
  } catch (_) {
    return str;
  }
};

export const renderMsgContent = (unSafeMsg: string) => {
  const safeMsg = htmlApi.encodeHtml(unSafeMsg);
  return safeMsg.replace(EMOJI_TAG_REGEXP, item => {
    const emojiName = emojiList.get(item);
    const emojiUrl = emojiSourceMap[emojiName];
    if (emojiUrl) {
      return `<img src=${emojiUrl} width=20 height=20 alt=${item} />`;
    }
    return item;
  });
};

// 获取消息类型，msg消息对象，type对比类型
export const judgeMsgType = (msg: IMMessage, typeStr: string, type: number) => {
  let typeCorrect = false;
  try {
    typeCorrect = JSON.parse(msg.content || '{}')[typeStr] === type;
  } catch (e) {}
  return typeCorrect;
};

// 获取IM回复弹窗距离顶部高度，先集中到这里（可优化）
export const getDistanceFromTop = () => {
  const inElectron = systemApi.isElectron();
  const isEdmWeb = systemApi.inEdm() && !inElectron;
  const isInWinElectron = inElectron && /windows/i.test(navigator.userAgent);
  // windows桌面端
  if (isInWinElectron) {
    return 88;
  }
  // 外贸web
  if (isEdmWeb) {
    return 110;
  }
  // 其他web
  if (!inElectron) {
    return 102;
  }
  // mac桌面端
  return 56;
};

// 获取IM群@人联想弹窗距离顶部高度（可优化）
// 以windows中顶部高度88为准，计算方式：总高度 - editor高度 - 顶部高度 - 间距，与原412高度取较小值
export const getImTeamDistanceFromTop = (editWindowHeight: number | undefined) => {
  // 窗口高度
  const curWinHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  if (!curWinHeight || !editWindowHeight) {
    return 'none';
  }
  // 顶部通用高度
  const distanceFromTop = getDistanceFromTop();
  // 8是@人联想弹窗距离输入框的间距，48是群顶部群内邮件提示的高度，无法获取当前群是否有群内邮件提示，直接按有处理
  const actualDistance = distanceFromTop + 8 + 48;
  return Math.min(curWinHeight - editWindowHeight - actualDistance, 412);
};
