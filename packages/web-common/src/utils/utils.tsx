import React, { useCallback } from 'react';
import { Modal } from 'antd';
import InfoCircleFilled from '@ant-design/icons/InfoCircleFilled';
import {
  apis,
  api,
  resultObject,
  ProductAuthApi,
  DataTrackerApi,
  ProductAuthorityFeatureKey,
  AuthorityConfig,
  StoreData,
  inWindow,
  util,
  SiteApi,
  environment,
} from 'api';
import { config } from 'env_def';
import { getIn18Text } from 'api';
import { useAppSelector } from '@web-common/state/createStore';
import toast from '@web-common/components/UI/Message/SiriusMessage';

const productAuthApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const trackerApi = api.requireLogicalApi('dataTrackerApiImp') as DataTrackerApi;
const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const eventApi = api.getEventApi();
const systemApi = api.getSystemApi();
export interface DialogProps {
  title?: string;
  content?: string;
}
export const showDialog = ({ title, content }: DialogProps) => {
  Modal.warning({
    icon: [<InfoCircleFilled style={{ color: title ? '#F74F4F' : '#386EE7', marginRight: '9px' }} />],
    title: title || getIn18Text('TISHI'),
    content,
    okText: getIn18Text('ZHIDAOLE'),
    width: '480px',
    className: 'sirius',
    centered: true,
  });
};
export const HTMLDecode = (text: string) => {
  let temp: any = document.createElement('div');
  temp.innerHTML = text;
  const output = temp.innerText || temp.textContent;
  temp = null;
  return output;
};
export { base64DecToArr } from './image';
/**
 * 截断字符串，按字符的字节数计算长度，英文字母及半角符号长度为1，汉字等字符长度为2
 * @example truncate('中文123', 3) => '中文12'
 * @example truncate('abcdef', 2) => 'abcd'
 * @param val 要截断的字符串
 * @param len 截断长度，需要展示的双字节长度
 * @returns
 */
export const truncate = (val: string = '', len: number, ellipsis?: string) => {
  let str = '';
  let n = 0;
  len *= 2;
  for (const char of val) {
    n += (char.codePointAt(0) || 0) > 256 ? 2 : 1;
    if (n === len) {
      str += char;
      break;
    } else if (n > len) {
      break;
    }
    str += char;
  }
  return str !== val ? str + (ellipsis || '') : str;
};
/**
 * 截断字符串，超出指定长度中间部分展示"..."
 * @example truncateMiddle('中文123', 1, 2) => '中...123'
 * @example truncateMiddle('中文123', 2, 2) => '中文123'
 * @param val 要截断的字符串
 * @param preLen 截断后的字符串前半段展示长度
 * @param postLen 截断后的字符串后半段展示长度
 * @returns
 */
export const truncateMiddle = (val: string = '', preLen: number, postLen: number) => {
  let n = 0;
  for (const char of val) {
    n += (char.codePointAt(0) || 0) > 256 ? 2 : 1;
  }
  if (n > (preLen + postLen) * 2) {
    const reversed = val.split('').reverse().join('');
    return `${truncate(val, preLen)}...${truncate(reversed, postLen).split('').reverse().join('')}`;
  }
  return val;
};
export const parseShareUrlParams = (hash: string) => {
  try {
    const params: resultObject = {};
    hash
      .replace('#', '')
      .split('&')
      .forEach(param => {
        const [key, value] = param.split('=');
        if (key === 'type') {
          params[key] = value === 'file' ? 'FILE' : 'DIRECTORY';
        } else if (key === 'from') {
          if (value === 'QIYE') {
            params[key] = 'ent';
          } else if (value === 'PERSONAL') {
            params[key] = 'personalShare';
          }
        } else if (key === 'id' || key === 'parentResourceId') {
          params[key] = +value;
        } else {
          params[key] = value;
        }
      });
    return params;
  } catch (error) {
    trackerApi.track('pc_disk_view_error', {
      type: 'parseShareUrlParams',
      hash,
    });
  }
  return {};
};
export const parseUrlObjectParams = (hash: string) => {
  const params: resultObject = {};
  hash
    .replace('#', '')
    .split('&')
    .forEach(param => {
      const [key, value] = param.split('=');
      params[key] = value;
    });
  return params;
};
export const getParameterByName = (name: string, url = location.href) => {
  try {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return safeDecodeURIComponent(results[2].replace(/\+/g, ' '));
  } catch (error) {
    trackerApi.track('pc_disk_view_error', {
      type: 'getParameterByName',
      url,
      error,
    });
  }
  return '';
};
export const downloadFileInBrowser = (url: string) => {
  const eleLink = document.createElement('a');
  eleLink.download = 'dl';
  eleLink.style.display = 'none';
  eleLink.href = url;
  document.body.appendChild(eleLink);
  eleLink.click();
  document.body.removeChild(eleLink);
};
// 待迁移
/**
 * 根据邮件id判断邮件的类型
 */
export const idIsTreadMail = (id: string): boolean => {
  if (id) {
    try {
      const mailIdReg = /\d+/;
      const [realId] = id.split('--') || [''];
      const [res] = mailIdReg.exec(realId) || [null];
      if (res && res.length === realId.length) {
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }
  return false;
};
/**
 * 获取权限信息
 */
export const getAuthConfig = (key: ProductAuthorityFeatureKey): AuthorityConfig | null => {
  return productAuthApi.getAuthConfig(key);
};

// 判断是否有某个权限
export const getIfHaveAuth = (key: ProductAuthorityFeatureKey): boolean => {
  if (key) {
    const config = productAuthApi.getAuthConfig(key);
    if (config && config.show) {
      return true;
    }
  }
  return false;
};
/**
 * 根据权限决定某个组件是否展示
 */
export const comIsShowByAuth = (key: ProductAuthorityFeatureKey, com: ((config: AuthorityConfig) => React.ReactElement) | React.ReactElement): React.ReactElement => {
  if (key && com) {
    const config = productAuthApi.getAuthConfig(key);
    if (config && config.show) {
      if (typeof com === 'function') {
        return com(config);
      } else {
        return com;
      }
    }
  }
  return <></>;
};

export const getValidStoreWidth = (storeData: StoreData) => {
  if (storeData.suc && storeData.data && /^\d+$/.test(storeData.data)) {
    return Number(storeData.data);
  }
  return 0;
};

export class FetchLock {
  fetchId = 0;

  setFetchId() {
    this.fetchId += 1;
    return this.fetchId;
  }

  getFetchId() {
    return this.fetchId;
  }
}

export const getJumpType = (page = 'acquisition') => {
  const CONFIG: Record<string, number> = {
    acquisition: 1, // 外贸获客
    customsBigData: 2, // 海关数据
    mailMarketing: 3, // 邮件营销
    website: 4, // 外贸建站
    mediaMarketing: 5, // 社媒营销
    globalSearch: 6, // 弹窗立即使用（to全球搜）
    mailHLogin: 7, // 从mailH登录后跳转过来
  };
  return CONFIG[page] || CONFIG.acquisition;
};

export const getJumpOutRedirectUrl = (sid?: string, page?: string) => {
  if (!inWindow() || !sid) {
    return '';
  }
  const query = `jumpMode=jumpOut&jumpType=${getJumpType(page)}&sid=${sid}&from=${window.location.href}`;
  const host = getWaimaoTrailEntryHost();
  const url = window.location.hash.includes('static/sirius-web') ? `static/sirius-web/jump/?${query}` : `jump/?${query}`;
  return host + encodeURIComponent(url);
};

export const getWaimaoTrailEntryHost = () => {
  const stage = config('stage') as string;
  const isProd = ['prod', 'prev'].includes(stage);

  const waimaoTrailEntry = {
    test: 'https://waimao-trial.cowork.netease.com/',
    prod: 'https://waimao-trial.office.163.com/',
  };
  return waimaoTrailEntry[isProd ? 'prod' : 'test'];
};

export const getLingXiEntryHost = () => {
  const stage = config('stage') as string;
  const isProd = ['prod', 'prev'].includes(stage);

  const lingXiEntry = {
    test: 'https://sirius-desktop-web.cowork.netease.com/',
    prod: 'https://lingxi.office.163.com/',
  };
  return lingXiEntry[isProd ? 'prod' : 'test'];
};

export const getWaimaoTrailJumpUrl = (code: string, redirectUrl: string) => {
  const host = getWaimaoTrailEntryHost();
  const path = 'it-others/api/pub/login/jump/';
  return `${host}${path}?code=${code}&redirectUrl=${redirectUrl}`;
};

export const isWebmail = () => {
  if (!inWindow() || !config('profile')) {
    return false;
  }
  return config('profile').toString().includes('webmail');
};

export const refreshPage = () => {
  systemApi.switchLoading(true);
  util.reload();
};

export const sendLogout = () => {
  setTimeout(() => {
    eventApi.sendSysEvent({
      eventName: 'logout',
      eventData: {
        jumpTo: 'login',
        clearCookies: false,
      },
    });
  }, 500);
};

export const setLoginBlock = (isBlock: boolean) => {
  eventApi.sendSysEvent({
    eventName: 'loginBlock',
    eventData: isBlock,
    eventSeq: 0,
  });
};

export const openWebUrlWithLoginCode = (url: string) => {
  if (systemApi.isElectron()) {
    const webHost = config('host') as string;
    siteApi
      .genLoginCode()
      .then(code => {
        systemApi.openNewWindow(`${webHost}/site/api/pub/login/jump?code=${code}&redirectUrl=${encodeURIComponent(url)}`, false);
      })
      .catch(e => {
        console.error(e);
        systemApi.openNewWindow(url, false);
      });
  } else {
    window.open(url, '_blank');
  }
};

export type QueueItem = (...args: any[]) => Promise<any>;

// 整了个队列
export const requestInQueue = (): ((request: QueueItem) => void) => {
  let running = false;
  const requestQueue: QueueItem[] = [];
  const start = (request: QueueItem) => {
    requestQueue.push(request);
    run();
  };
  const run = () => {
    if (running) {
      return;
    }
    running = true;
    const current = requestQueue.shift();
    if (current) {
      current().finally(() => {
        running = false;
        run();
      });
    } else {
      running = false;
    }
  };
  return start;
};

/**
 * 有安全兜底的decodeURIComponent，防止decodeURIComponent报错
 * 在报错的时候，原样返回参数
 */
export const safeDecodeURIComponent = (str: string) => {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    console.error('[Error safeDecodeURIComponent]', e);
  }
  return str;
};

/**
 * 比较新旧版本
 * @param prev 1.331.3
 * @param next 1.332.1
 * @return 1: prev > next
 * @return 0: prev === next
 * @return -1: prev < next
 */
export const compareWmVersion = (prev: string, next: string): number => {
  const prevVersion = prev.split('.');
  const nextVersion = next.split('.');

  if (prevVersion.length !== 3 || nextVersion.length !== 3) {
    throw new Error('compareWmVersion error');
  }

  if (prev === next) {
    return 0;
  }

  for (let i = 0; i < prevVersion.length; i++) {
    if (prevVersion[i] !== nextVersion[i]) {
      return prevVersion[i] > nextVersion[i] ? 1 : -1;
    }
  }

  return 0;
};

export const getOfficialWebsiteHost = () => (config('officialWebsiteHost') as string) || 'https://waimao.163.com';

export const getHelpCenterHost = () => (config('helpCenterHost') as string) || 'https://waimao.office.163.com';

export const openHelpCenter = (url = '') => {
  if (url && url.startsWith('http')) {
    systemApi.openWaimaoUrlWithLoginInfo(url);
  } else {
    const host = getHelpCenterHost();
    systemApi.openWaimaoUrlWithLoginInfo(`${host}/helpCenter${url && url.startsWith('/') ? url : '/' + url}`);
  }
};

export const useOpenHelpCenter = () => {
  const version = useAppSelector(state => state.privilegeReducer.version);

  return useCallback(
    (url?: string) => {
      if (version === 'FREE') {
        toast.warn('您使用的是体验版，无法查看知识中心，请联系商务同事购买外贸通正式版本');
        return;
      }

      if (version === 'FASTMAIL_EXPIRED') {
        toast.warn('您购买的外贸通已过期，无法查看帮助中心，请联系商务同事续费以方便查看知识中心');
        return;
      }

      return openHelpCenter(url);
    },
    [version]
  );
};
