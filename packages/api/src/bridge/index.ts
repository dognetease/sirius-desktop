import lodashGet from 'lodash/get';
import { BridgeTaskPriority } from './interface/common';
import { ModuleApiProxyConfig, winWorkerEnv, ProxyTarget } from './interface/apiProxyConfig';
import { api as masterApi } from '@/api/api';
import { apis, inWindow, isElectron } from '@/config';
import { Api } from '@/api/_base/api';
import { MasterBridge } from './interface/proxy';
import { WorkerBridge } from './interface/register';
import { AccountApi } from '@/api/logical/account';
import bridgeProxyConfigList from './config/config';
import { workerBridgeInstance } from './instance/workerBridge';
import { masterBridgeInstance } from './instance/masterBridge';
import interceptorConfigMap from './interceptors/index';
import { SystemEvent } from '@/api/data/event';
import { CustomError } from './config/bridgeError';

const getWinEnv: () => winWorkerEnv = () => {
  if (!inWindow()) {
    return 'frontPage';
  }

  if (window.isAccountBg) {
    return 'accountBg';
  }
  if (window.isBridgeWorker) {
    return 'dataBg';
  }
  return 'frontPage';
};

// register逻辑可能执行了两次(之后定位原因) 所以代理这里要加一个锁
const proxyInitLockMap: Map<string, boolean> = new Map();

/**
 * 在前台页面初始化代理拦截配置
 * @param bridgeInstance {BridgeApi} bridge实例
 * @param configList {ModuleApiProxyConfig[]} 各个模块配置列表
 * @returns
 */
const initBridgeProxyConfig: (masterDriver: MasterBridge, configItem: ModuleApiProxyConfig) => void = (masterDriver, configItem) => {
  if (proxyInitLockMap.get(`${configItem.namespace}-proxy`)) {
    return;
  }
  proxyInitLockMap.set(`${configItem.namespace}-proxy`, true);

  const currentEnv = getWinEnv();

  const systemApi = masterApi.getSystemApi();
  const accountApi = masterApi.requireLogicalApi(apis.accountApiImpl) as unknown as AccountApi;

  // 如果是数据后台页面不执行代理拦截
  if (currentEnv === 'dataBg' || !inWindow()) {
    return;
  }

  const { apis: apiNames, target: targetCallback, namespace, proxyTarget: moduleProxyTarget, priorityConfig: modulePriorityConfig } = configItem;

  // 先只实现代理同名方法逻辑
  if (!Array.isArray(apiNames) || apiNames.length === 0) {
    return;
  }

  const target = targetCallback();

  const masterAccount: string =
    window.isAccountBg && isElectron()
      ? systemApi.md5(lodashGet(systemApi.getMainAccount(), 'email', ''), true)
      : lodashGet(systemApi.getCurrentUser(), 'accountMd5', '');

  // todo: 做一个监听执行二次监听
  if (!masterAccount || !masterAccount.length) {
    return;
  }

  // 实现代理
  apiNames.forEach(apiConfig => {
    const apiname = typeof apiConfig === 'string' ? apiConfig : apiConfig.key;
    // const excuteApiname = typeof apiConfig === 'string' ? apiConfig : apiConfig.funcname || apiConfig.key;
    const proxyTarget: ProxyTarget = lodashGet(apiConfig, 'proxyTarget', moduleProxyTarget);

    const enableProxy = lodashGet(apiConfig, 'enableProxy', true);
    // 如果配置了禁用代理 直接跳过
    if (enableProxy === false) {
      return;
    }

    // 保存原有调用
    const originMethod = target[apiname as keyof Api] as Api[keyof Api] & Record<string, (...args: unknown[]) => unknown>;

    if (typeof originMethod !== 'function' || !masterDriver) {
      return;
    }

    // 设置任务优先级 priorityConfig
    const priorityConfig: [BridgeTaskPriority, number] = lodashGet(apiConfig, 'priorityConfig', modulePriorityConfig);
    if (Array.isArray(priorityConfig) && priorityConfig.length > 0) {
      masterDriver.configureApiPriority(
        {
          namespace,
          apiname,
        },
        ...priorityConfig
      );
    }

    const winType = getWinEnv();

    if (typeof apiConfig !== 'string' && typeof apiConfig.backup === 'function') {
      masterDriver.interceptors.response.use(
        {
          type: 'error',
          namespace: [namespace, apiname].join('.'),
          async resolve(res) {
            return res;
          },
          reject: ((_namespace, _apiname) => async (error: CustomError) => {
            const _errNamepsace = lodashGet(error, 'config.namespace', '');
            const _errApiName = lodashGet(error, 'config.apiname', '');
            if (_errNamepsace !== _namespace || _errApiName !== _apiname) {
              throw error;
            }
            return apiConfig.backup!(error);
          })(namespace, apiname),
        },
        'high'
      );
    }

    // 保存原有调用
    // eslint-disable-next-line
    // @ts-ignore
    target[`_$${apiname}` as keyof Api] = originMethod;

    // @todo:实现绑定
    // eslint-disable-next-line
    // @ts-ignore
    target[apiname as keyof Api] = new Proxy(originMethod, {
      apply(func, context, args) {
        // @todo:判断当前发送请求的账号是否是主账号
        const _account = accountApi.getCurrentAccount()?.email || '';
        const globalAccount = _account && _account.length ? systemApi.md5(_account, true) : masterAccount;
        const isMainAccount = globalAccount === masterAccount;

        // 清除设置
        accountApi.setCurrentAccount({ email: '' });
        const targetWin = proxyTarget(winType, isMainAccount, isElectron() ? 'electron' : 'web');

        // 如果不允许代理到任何窗口||数据后台 使用默认方法
        if (targetWin === null || targetWin === 'accountBg') {
          // eslint-disable-next-line
          // @ts-ignore
          return func.apply(context, args);
        }

        // 如果当前这次调用被临时禁用了 直接调用原始方法
        if (!masterDriver.getBridgeTempStatus()) {
          masterDriver.enableBridgeOnce();
          // eslint-disable-next-line
          // @ts-ignore
          return func.apply(context, args);
        }

        const md5Email = masterAccount;

        return masterDriver.requestData(
          {
            namespace,
            apiname,
            args,
          },
          md5Email
        );
      },
    });
  });
};
/**
 * 在后台页面初始化代理实现配置
 * @param bridgeInstance {BridgeApi} bridge实例
 * @param configList {ModuleApiProxyConfig[]} 各个模块配置列表
 * @returns
 */
const initBridgeRegisterConfig: (workerDriver: WorkerBridge, configItem: ModuleApiProxyConfig) => void = (workerDriver, configItem) => {
  if (proxyInitLockMap.get(`${configItem.namespace}-register`)) {
    return;
  }
  proxyInitLockMap.set(`${configItem.namespace}-register`, true);
  const currentEnv = getWinEnv();
  if (currentEnv === 'frontPage' || !inWindow()) {
    return;
  }

  const { apis, target: targetCallback, namespace } = configItem;

  // 先只实现代理同名方法逻辑
  if (!Array.isArray(apis) || apis.length === 0) {
    return;
  }
  // 注册调用方法
  const target = targetCallback();

  apis.forEach(_api => {
    if (typeof _api === 'string' || lodashGet(_api, 'funcname.length', 0) <= 0) {
      return;
    }
    workerDriver.registerResponseCMD(namespace, _api!.key, args => {
      console.log('[bridge]detail.recept', namespace, _api, location.pathname);
      // eslint-disable-next-line
      // @ts-ignore
      return target[_api!.funcname](...args);
    });
  });

  workerDriver.registerCommonCMD(namespace, (apiname, args) =>
    // 执行调用
    // eslint-disable-next-line
    // @ts-ignore
    target[apiname](...args)
  );
};

export const bridgeInit = () => {
  if (!inWindow() || process.env.BUILD_ISWEB) {
    return;
  }

  // 主动监听账号后台关闭逻辑
  const systemApi = masterApi.getSystemApi();
  const eventApi = masterApi.getEventApi();
  if (lodashGet(systemApi.getCurrentUser(), 'accountMd5.length', 0) === 0) {
    const eid = eventApi.registerSysEventObserver('storeUserChangeEvent', {
      func: () => {
        const len = lodashGet(systemApi.getCurrentUser(), 'accountMd5.length', 0);
        if (len > 0) {
          eventApi.unregisterSysEventObserver('storeUserChangeEvent', eid);
          bridgeInit();
        }
      },
    });
    return;
  }

  if (!masterBridgeInstance || !workerBridgeInstance) {
    return;
  }

  bridgeProxyConfigList.forEach(implBridgeProxyConfig => {
    initBridgeProxyConfig(masterBridgeInstance!, implBridgeProxyConfig);
    initBridgeRegisterConfig(workerBridgeInstance!, implBridgeProxyConfig);
  });

  Object.values(interceptorConfigMap)
    .flat()
    .forEach(Interceptor => {
      const interceptor = new Interceptor([masterBridgeInstance!.interceptors.request, masterBridgeInstance!.interceptors.response]);
      console.log('[bridge]interceptorloaded', interceptor);
    });

  masterBridgeInstance?.createSubPageInWeb();

  // workerBridge需要控制初始化执行的时机 因为他需要主动去拉任务
  workerBridgeInstance?.init();

  if (process.env.BUILD_ISELECTRON && systemApi.isMainWindow()) {
    masterApi.getEventApi().registerSysEventObserver('SubAccountWindowClosed', {
      func: async (ev: SystemEvent<Record<'mainAccount' | 'subAccount', string> & { webId: number }>) => {
        // 如果是无效的email
        if (lodashGet(ev, 'eventData.subAccount.length', 0) === 0 || lodashGet(ev, 'eventData.webId.length', 0) === 0) {
          return;
        }

        const { subAccount: closedEmail, webId } = ev.eventData!;

        const accountApi = masterApi.requireLogicalApi(apis.accountApiImpl) as unknown as AccountApi;
        const accountList = await accountApi.getSubAccounts({ expired: false });
        const isValidSubAccount = accountList.map(item => item.id).includes(closedEmail);
        // 如果关闭账号不是有效子账号 跳过
        if (!isValidSubAccount) {
          return;
        }
        masterBridgeInstance!.removeBridgeWin(webId);
      },
    });
  }
};

if (inWindow()) {
  window.bridgeApi = {
    master: masterBridgeInstance!,
    worker: workerBridgeInstance!,
  };
}
