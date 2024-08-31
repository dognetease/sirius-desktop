import { stringMap, CommonMailMenuConfig, DefaultMailMenuConfigMap, MailMenuIsShowCallBack, MailMenuOnClickCallBack } from '../../../types';
import { MailEntryModel } from 'api';
import { FLOLDER, TASK_MAIL_STATUS } from '../../constant';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
import { getMailFromMails } from '@web-mail/util';

const isFn = (params: any) => {
  return typeof params === 'function';
};
type MailMenuConfigCallback = (mail: MailEntryModel, parms?: any) => any;
type MailMenuConfigItem = boolean | string | number | object | MailMenuConfigCallback;
// 混合方法
const mergeCallback = (userConfig: any, defaultConfig: any) => {
  if (userConfig != null) {
    if (isFn(userConfig)) {
      if (isFn(defaultConfig)) {
        return (mail: MailEntryModel) => {
          const _userConfig = userConfig as MailMenuConfigCallback;
          return _userConfig(mail, defaultConfig);
        };
      } else {
        return (mail: MailEntryModel) => {
          const _userConfig = userConfig as MailMenuConfigCallback;
          return _userConfig(mail, () => defaultConfig);
        };
      }
    } else {
      return userConfig;
    }
  }
  return defaultConfig;
};
// 提取&混合基础菜单设置
export const findAndMergeDefaultMenuConfig = (cutConfig: CommonMailMenuConfig[], defaultConfig: DefaultMailMenuConfigMap) => {
  let configList: CommonMailMenuConfig[] = [];
  cutConfig.forEach(item => {
    if (item) {
      const { key } = item;
      const config = defaultConfig[key] as CommonMailMenuConfig;
      configList.push(mergeMenuItemConfig(item, config));
    }
  });
  return configList;
};
// 混合单个菜单配置项
export const mergeMenuItemConfig = (userCofig: CommonMailMenuConfig, baseConfig: CommonMailMenuConfig): CommonMailMenuConfig => {
  if (!userCofig && baseConfig) {
    return baseConfig;
  }
  if (!baseConfig && userCofig) {
    return userCofig;
  }
  let res = {
    ...baseConfig,
    ...userCofig,
  };
  // todo：需要代理的属性，可能还不止下面几项
  res['show'] = mergeCallback(userCofig.show, baseConfig.show);
  res['onClick'] = mergeCallback(userCofig.onClick, baseConfig.onClick);
  return res;
};
/**
 * 邮件菜单的混合方法
 * 功能： 保持baseConfig的结构，将userCofig中的配置项附加到baseConfig中
 * 注意： 会层序遍历userCofig，也会层序修改baseConfig
 * 注意： 限制最大递归次数1000，防止循环引用导致的死循环
 * 注意： 会返回一个新的配置对象，不会修改原有的配置对象
 */
const Max = 1000;
const scanConfig = (
  config: CommonMailMenuConfig[],
  callBack: (parms: CommonMailMenuConfig) => CommonMailMenuConfig,
  getEnd: () => boolean = () => true
): CommonMailMenuConfig[] => {
  if (config && config?.length) {
    return config.map(item => {
      if (item) {
        if (item?.subMenus && Array.isArray(item?.subMenus) && getEnd()) {
          const res = scanConfig(item?.subMenus, callBack, getEnd);
          return callBack({
            ...item,
            subMenus: res,
          });
        }
        return callBack(item);
      }
      return item;
    });
  }
  return [];
};

export const mergeMenuConfig = (userCofig: CommonMailMenuConfig[] = [], baseConfig: CommonMailMenuConfig[] = []) => {
  const userMenuMap: stringMap = {};
  let res = baseConfig;
  try {
    const userCofigQueue = [...userCofig];
    let count = 0;
    // 层序展开userCofig
    while (userCofigQueue.length) {
      if (count >= Max) {
        console.error('mergeMenuConfig error: userCofig has circular reference', 'Max:', Max);
        break;
      }
      const task = userCofigQueue.shift();
      if (task && task.key != null) {
        userMenuMap[task.key] = task;
        if (task?.subMenus && Array.isArray(task?.subMenus)) {
          task?.subMenus.forEach(item => {
            if (item.key != null) {
              userCofigQueue.push(item);
            }
          });
        }
      }
      count++;
    }
    // 层序遍历目标配置并合并
    count = 0;
    res = scanConfig(
      baseConfig,
      (item: CommonMailMenuConfig) => {
        if (item.key != null) {
          if (userMenuMap[item.key]) {
            const userMenuItem = userMenuMap[item.key];
            return mergeMenuItemConfig(userMenuItem, item);
          }
        }
        count++;
        return item;
      },
      () => {
        if (count >= Max) {
          console.error('mergeMenuConfig error: userCofig has circular reference', 'Max:', Max);
          return false;
        }
        return true;
      }
    );
  } catch (e) {
    console.error('mergeMenuConfig error:', e);
    return baseConfig;
  }
  return res;
};
/**
 * 简单的参数融合，只融合不新增
 * todo: 参数需要按结构，按层级合并新增
 */
export const mergeMenuConfigSimple = (userCofig: CommonMailMenuConfig[], baseConfig: CommonMailMenuConfig[]) => {
  const userMenuMap: stringMap = {};
  userCofig.forEach(item => {
    if (item.key != null) {
      userMenuMap[item.key] = item;
    }
  });

  const localData: CommonMailMenuConfig[] = baseConfig.map(item => {
    if (item.key != null) {
      if (userMenuMap[item.key]) {
        const userMenuItem = userMenuMap[item.key];
        return mergeMenuItemConfig(userMenuItem, item);
      }
    }
    return {
      ...item,
    };
  });
  return localData;
};
// 判断是否属于特定的文件夹
export const getShowByFolder = (mail: MailEntryModel, list: FLOLDER[]) => {
  const { folder } = mail?.entry || {};
  if (folder && list && list.length) {
    return list.some(item => item === folder);
  }
  return false;
};
// 屏蔽进行中的任务邮件的展示
export const taskMailMenuShow = (mails: MailEntryModel | MailEntryModel[], defaultShow?: MailMenuIsShowCallBack) => {
  const mail = getMailFromMails(mails);
  const { taskInfo } = mail;
  // 任务邮件不展示
  if (taskInfo?.status === TASK_MAIL_STATUS.PROCESSING) {
    return false;
  }
  return !!defaultShow ? defaultShow(mail) : true;
};
// 拦截任务邮件的被屏蔽的操作
export const proxyTaskMailClick = (mails: MailEntryModel | MailEntryModel[], defaultClick?: MailMenuOnClickCallBack) => {
  const mail = getMailFromMails(mails);
  const { taskId, taskInfo } = mail;
  // 任务邮件不展示
  if (taskId && taskInfo && taskInfo?.status === TASK_MAIL_STATUS.PROCESSING) {
    message.info({ content: getIn18Text('WEIWANCHENGDEREN') });
    return false;
  }
  return defaultClick && defaultClick(mail);
};

// promise的超时包装
export const timeOutRequest = (task: Promise<any>, timeout: number): Promise<any> => {
  const timeoutTask = new Promise((_, j) => {
    setTimeout(() => {
      j();
    }, timeout);
  });
  return Promise.race([task, timeoutTask]);
};
