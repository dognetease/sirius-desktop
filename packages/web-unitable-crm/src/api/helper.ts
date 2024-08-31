import React from 'react';
import { navigate } from '@reach/router';
import { routeMenu } from '@lxunit/app-l2c-crm';
import { setTemplateContent } from '@web-edm/mailTemplate/template-util';
import { getProductsHtml } from '@web-edm/components/editor/template';
import { getDetailPath, getAiHostingDetailPath } from '@web-edm/components/MarketingDataPreview/util';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { diskApi, mailApi, loggerApi } from './index';
import { inWindow, apiHolder, apis, EdmSendBoxApi } from 'api';
import { OneKeyMarketingParams } from '@lxunit/bridge-types';
import Confirm from '@/components/Layout/Customer/components/confirm/confirm';
import { getSendCount } from '@/components/Layout/Customer/components/hooks/useEdmSendCount';

const systemApi = apiHolder.api.getSystemApi();
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

function getUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const coProductTemplateContet = async (list: any[]): Promise<{ success: true; htmlContent: string } | { success: false }> => {
  const isOk = list.every(item => {
    try {
      return item.pictures && item.pictures[0] && item.pictures[0].url;
    } catch (error) {
      return false;
    }
  });

  if (!isOk) {
    Toast.info({
      content: '请添加图片，确保邮件中的信息完整',
    });
    return {
      success: false,
    };
  }

  // 生成html代码
  const htmlContent = getProductsHtml(0, list, ['product_name_en'], {}, 120);
  const content = htmlContent.replace(/\r\n/g, '').replace(/\n/g, '');
  return {
    success: true,
    htmlContent: content,
  };
};

/**
 * 产品营销邮件
 * @param list
 */
export const openProductEdmTemplateEmail = async (list: any[], backUrl: string = '') => {
  const res = await coProductTemplateContet(list);

  if (res.success === false) {
    return;
  }
  setTemplateContent(res.htmlContent);
  try {
    navigate(`#edm?page=write&from=uniTemplate&back=${encodeURIComponent('#/unitable-crm' + backUrl)}`);
  } catch (error) {
    console.error(error);
  }
};

export const contactOneKeyMarketing = async (params: { emailList: any[]; submitAfterHandle?: () => void; backUrl?: string }) => {
  const { emailList, submitAfterHandle, backUrl } = params;
  submitAfterHandle?.();
  const back = backUrl ? encodeURIComponent(`#/unitable-crm${backUrl}`) : '';
  getSendCount({ emailList, from: 'customer', back });
};

export const contactMarketingHosting = async (params: { emailList: any[]; submitAfterHandle?: () => void; backUrl?: string }) => {
  const { emailList, submitAfterHandle, backUrl } = params;
  submitAfterHandle?.();
  const back = backUrl ? encodeURIComponent(`#/unitable-crm${backUrl}`) : '';
  // TODO 调用营销hook
};

export const marketingDetail = async (params: { emailKey: string; submitAfterHandle?: () => void; backUrl?: string; detailType?: string; from?: string }) => {
  const { emailKey, submitAfterHandle, backUrl, detailType, from } = params;
  submitAfterHandle?.();
  try {
    if (detailType === 'aiHosting') {
      let navUrl = `${getAiHostingDetailPath()}&planId=${emailKey}`;
      navUrl = from ? `${navUrl}&from=${from}` : navUrl;
      navUrl = backUrl ? `${navUrl}&back=${backUrl}` : navUrl;
      navigate(navUrl);
    } else {
      navigate(`${getDetailPath()}&detailId=${emailKey}&back=${backUrl}&from=customer`);
    }
  } catch (error) {
    console.error('goMarketingDetail', error);
  }
};

/**
 * 打开邮件（初始化邮件内容）
 * @param list
 */
export const sendProductEmail = async (list: any[]) => {
  const res = await coProductTemplateContet(list);
  if (res.success === false) {
    return;
  }
  mailApi.doWriteMailFromLink([], '', res.htmlContent);
};

/**
 * 返回当前的URL hash
 * @returns
 */
export const getUrlHash = (): string => {
  try {
    return window.location.hash ?? '';
  } catch (error) {
    return '';
  }
};
/**
 * 获取当前系统语言
 * zh 中文
 * en 英文
 * @returns
 */
export const getSystemLanguage = (): 'zh' | 'en' => {
  try {
    return window.systemLang || 'zh';
  } catch (error) {
    return 'zh';
  }
};

function add0(m: number) {
  return m < 10 ? '0' + m : m;
}
export const getTimestamp = () => {
  var time = new Date();
  var y = time.getFullYear();
  var m = time.getMonth() + 1;
  var d = time.getDate();
  var h = time.getHours();
  var mm = time.getMinutes();
  var s = time.getSeconds();
  var ms = time.getMilliseconds();
  return y + '-' + add0(m) + '-' + add0(d) + ' ' + add0(h) + ':' + add0(mm) + ':' + add0(s) + ' ' + ms;
};
/**
 * 写入日志
 * @param content
 */
export const writeLog = (content: any, label?: string) => {
  try {
    let href = '';
    if (inWindow()) {
      href = location.pathname + location.search + location.hash;
    }
    loggerApi.track('uni_log', {
      // 当前url
      href,
      label,
      content,
    });
  } catch (e) {
    console.log(e);
  }
};
/**
 * 包装mehods所有的方法，增加执行前和执行后的日志
 * @param methods
 * @param prefix
 * @returns
 */
export const wrapLogToMethods = <T>(methods: T, prefix?: string): T => {
  const flattenedMethods: any = {};
  Object.keys(methods as any).forEach(key => {
    const value = (methods as any)[key];
    if (typeof value === 'object') {
      // Recurse into any nested children.
      Object.assign(flattenedMethods, {
        [key]: wrapLogToMethods(value as any, `${prefix ?? ''}${key} `),
      });
    }

    if (typeof value === 'function') {
      // If we've found a method, expose it.
      flattenedMethods[key] = (...args: any[]) => {
        const uid = getUuid();
        writeLog(args, `bridge方法调用：${prefix ?? ''}${key} started, trackId: ${uid}`);
        const r = (methods as any)[key](...args);
        if (r && r.then && r.catch) {
          return r
            .then((res: any) => {
              writeLog(res, `bridge方法调用：${prefix ?? ''}${key} successed, trackId: ${uid}`);
              return res;
            })
            .catch((err: any) => {
              writeLog(err, `bridge方法调用：${prefix ?? ''}${key} failed, trackId: ${uid}`);
              return Promise.reject(err);
            });
        }
        {
          writeLog(r, `bridge方法调用：${prefix ?? ''}${key} successed, trackId: ${uid}`);
          return r;
        }
      };
    }
  });
  return flattenedMethods;
};

/**
 * 包装异步请求
 * @param promise
 * @param label
 */
export const wrapAsyncHttpRequest = <T extends unknown>(promise: Promise<T>, label?: string): Promise<T> => {
  const date = Date.now();
  const asyncTrackID = getUuid();
  writeLog({ asyncTrackID }, label + '开始调用');
  return promise
    .then(res => {
      writeLog({ response: res, duration: Date.now() - date, asyncTrackID }, label + '调用成功');
      return Promise.resolve(res);
    })
    .catch((err: Error) => {
      writeLog(
        {
          error: err,
          errorMessage: err.message,
          errorName: err.name,
          duration: Date.now() - date,
          asyncTrackID,
        },
        label + '调用失败'
      );
      return Promise.reject(err);
    });
};

export const useReactComponentLog = (label: string) => {
  React.useEffect(() => {
    writeLog('', `${label} useEffect 初始化`);
    return () => {
      writeLog('', `${label} useEffect 销毁`);
    };
  }, []);
};
/**
 * uni crm 的路由前缀 标记 （注意不带/）
 */
export const unitableRoutePrefix = 'unitable-crm';
/**
 * uni crm 路由path前缀（带着/）
 */
export const unitableRouteHashPrefix = `/${unitableRoutePrefix}`;
/**
 * 去掉crm路由前缀，返回不带前缀的crm路由
 * @param hash
 * @param removeQuery 是否去掉query 默认为true,去掉query参数
 * @returns
 */
export const getCrmPathWithoutPrefix = (hash: string, removeQuery = true) => {
  let nextHash = hash.replace(/^#?\/?unitable-crm/, '');
  nextHash = nextHash.startsWith('/') ? nextHash : '/' + nextHash;
  if (removeQuery) {
    return nextHash.replace(/\?.*/, '');
  }
  return nextHash;
};
/**
 * uni crm的路由以#unitable
 * 由于l2c crm的内部的hash路由是以#/unitable-crm开头的
 * 因此需要拼接成正确的l2c crm 内部路由地址
 * @param hash
 */
export const getUnitableCrmHash = (hash: string) => {
  const nextHash = getCrmPathWithoutPrefix(hash, false);
  return '#/unitable-crm' + nextHash;
};

/**
 * true 表示当前路由是crm路由前缀
 * @param currentHash
 * @returns
 */
export const isMatchUnitableCrmHash = (currentHash: string | undefined) => {
  if (currentHash) {
    return /^#?\/?unitable-crm/.test(currentHash);
  }
  return false;
};
/**
 * 跳转到l2c模块线索列表页
 */
export const navigateToLeadPage = (params: { view: 'all' | 'my' } = { view: 'my' }) => {
  const { view } = params;
  window.location.hash = `#/unitable-crm${routeMenu['lead']['path']}?activeTab=${view}`;
};
/**
 * 跳转到l2c模块本地产品列表页
 */
export const navigateToProductPage = () => {
  window.location.hash = '#/unitable-crm' + routeMenu['localProduct']['path'];
};
/**
 * 跳转到l2c客户表
 */
export const navigateToCustomerPage = (params: { view: 'all' | 'my'; filter?: any; groupId?: string } = { view: 'my' }, openNewWindow = false) => {
  const { view, filter, groupId } = params;
  let url = `#/unitable-crm${routeMenu['custom']['path']}?&activeTab=${view}`;
  if (filter) {
    url += `&filter=${encodeURIComponent(JSON.stringify(filter))}`;
  }
  if (groupId) {
    url += `&groupId=${groupId}`;
  }
  if (openNewWindow) {
    systemApi.openNewWindow(url);
  } else {
    window.location.hash = url;
  }
};

type CacheProps = Partial<Pick<OneKeyMarketingParams, 'getContactList' | 'submitAfterHandle'>>;
export const contactListCache: CacheProps = {};

export const setContactListRequest = (params: CacheProps) => {
  contactListCache.getContactList = params.getContactList;
  contactListCache.submitAfterHandle = params.submitAfterHandle;
};
