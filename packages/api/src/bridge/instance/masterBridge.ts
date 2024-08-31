import lodashGet from 'lodash/get';
import { SupportNamespaces, BridgeTaskPriority, BRIDGE_RESPONSE_TYPE, BRIDGE_RESPONSE_CODE } from '../interface/common';
import { MasterBridge, DispatchTaskRequestContent } from '../interface/proxy';
import { CustomError } from '../config/bridgeError';
import { inWindow, isElectron } from '@/config';
import { MasterDriverManage } from '../interface/webMasterDriver';
import { Interceptor } from './interceptor';
import { SystemApi } from '@/api/system/system';
import { api as masterApi } from '@/api/api';

import { SequenceHelper } from '@/api/commonModel';
import { InterceptorRequestConfig, InterceptorResponseConfig } from '../interface/interceptor';
import { MasterBridgeEngine as WebMasterBridgeEngine } from '../webdriver/webMasterEngine';
import { MainBridgeEngine as WebMainBridgeEngine } from '../webdriver/bridgeMainDriver';
import { isSupportNativeProxy } from '@/api/util';
import { getIsLoginPage } from '../../utils/isLocPage';

/**
 * MasterBridgeApi:数据请求层API 对window.electronLib.masterBridgeManage的封装
 * 之后的iframe的封装也放到这里
 */
export class MasterBridgeApi implements MasterBridge {
  private engine: MasterDriverManage | null = null;

  // private bridgeWebInstance: MasterBridgeManage | null = null;

  interceptors = {
    request: new Interceptor<InterceptorRequestConfig>('request'),
    response: new Interceptor<InterceptorResponseConfig>('response'),
  };

  // 当前页面是否禁用DB
  private bridgeEnableUse = true;

  private sequenceHelper = new SequenceHelper();

  private systemApi: SystemApi;

  private webMainBridgeEngine: WebMainBridgeEngine | null = null;

  private bridgeTempEnableUse = true;

  constructor() {
    this.systemApi = masterApi.getSystemApi();
    if (!isSupportNativeProxy) {
      return;
    }
    this.init();
  }

  private init() {
    // 非window环境OR在后台页面(后台任务走调度这个逻辑暂时先不做)
    if (!inWindow() || window.isBridgeWorker) {
      return;
    }

    if (isElectron()) {
      const isLowMemoryMode = this.systemApi.getIsLowMemoryModeSync();
      if (isLowMemoryMode && !window.isAccountBg) {
        this.bridgeEnableUse = false;
      }
      this.engine = Object.assign(window.electronLib.masterBridgeManage, {
        // eslint-disable-next-line
        // @ts-ignore
        addWinEvent(name: string, callback) {
          console.warn('[bridge]electron暂不支持event事件 请使用eventApi', name, callback);
        },
        removeWinEvent(name: string) {
          console.warn('[bridge]electron暂不支持event事件 请使用eventApi', name);
        },
        broadcast2AllWin() {
          console.warn('[bridge]electron暂不支持event事件 请使用eventApi.broadcast2AllWin');
        },
      });
    } else if (getIsLoginPage()) {
    } else {
      this.engine = new WebMasterBridgeEngine();
      this.webMainBridgeEngine = new WebMainBridgeEngine();
    }

    this.addDefaultInterceptor();
  }

  createSubPageInWeb() {
    if (!this.webMainBridgeEngine) {
      return;
    }
    console.log('[1.25]小版本跳过创建页面');
    // this.webMainBridgeEngine.createSubPage();
  }

  removeSubPageInWeb() {
    if (!this.webMainBridgeEngine) {
      return;
    }
    this.webMainBridgeEngine.removeSubPage();
  }

  // 添加默认拦截器
  addDefaultInterceptor() {
    // 添加一个判断当前窗口是否可用后台的拦截器
    this.interceptors.request.use({
      resolve: config => {
        if (this.getBgFuncStatus4CurrentPage()) {
          return Promise.resolve(config);
        }
        throw new CustomError(BRIDGE_RESPONSE_TYPE.REJECT_BRIDGE_BY_CURPAGE, {
          code: BRIDGE_RESPONSE_CODE.REJECT_BRIDGE_BY_CURPAGE,
          config,
        });
      },
    });
  }

  // 防止不同页面的seqNo重复
  private randomMarkNo = `${Math.random()}`.replace('.', '');

  private getSeqNo(namespace: SupportNamespaces, prefixSeqNo: string) {
    return [prefixSeqNo, namespace, this.randomMarkNo, this.sequenceHelper.next()].join('-');
  }

  async requestData(
    params: {
      namespace: SupportNamespaces;
      apiname: string;
      args: unknown[];
    },
    _account = ''
  ) {
    const { namespace, apiname, args } = params;

    const account = typeof _account === 'string' && _account.length ? _account : lodashGet(this.systemApi.getCurrentUser(), 'accountMd5', '');

    const seqNo = this.getSeqNo(namespace, account);
    try {
      // 先调用request拦截器列表(拦截器可以修改args信息 但是不可以修改别的信息)
      const configParams: DispatchTaskRequestContent & { seqNo: string } = Object.freeze({
        namespace,
        apiname,
        args,
        seqNo,
        account,
      });

      const config = (await this.interceptors.request.excute(Promise.resolve(configParams), ns => ['common', namespace].includes(ns))) as DispatchTaskRequestContent & {
        seqNo: string;
      };

      const _request = this.engine?.dispatchTask(config, seqNo);
      const res = (await _request) as { data: unknown; duration: number[] };
      // 调用response拦截器
      await this.interceptors.response.excute(
        Promise.resolve({
          data: res.data,
          duration: Object.freeze(res.duration),
          ackNo: seqNo,
          config: Object.freeze(config),
        } as unknown as InterceptorResponseConfig),
        ns => ['common', namespace].includes(ns)
      );
      return res.data;
    } catch (ex) {
      // @todo:将错误列表转换成MyCustomError
      // 因为调用bridge产生的错误有可能没有taskConfig信息
      const errorMsg = lodashGet(ex as CustomError, 'message', typeof ex === 'string' ? ex : BRIDGE_RESPONSE_TYPE.BRIDGE_ERROR);
      const errorCode = lodashGet(ex as CustomError, 'code', BRIDGE_RESPONSE_CODE.BRIDGE_ERROR);
      const errorDuration = lodashGet(ex as CustomError, 'duration', undefined);

      const customError = new CustomError(errorMsg, {
        code: errorCode,
        duration: errorDuration,
        config: {
          namespace,
          apiname,
          args,
          account,
        },
      });
      // 调用response拦截器
      // todo: 这里执行的时候需要过滤resolve,只执行reject就行了
      return this.interceptors.response.excute(
        Promise.reject(customError),
        (ns, type) => (ns === 'common' || [namespace, apiname].join('.').includes(ns)) && type === 'error'
      );
    }
  }

  async flush(accountId: string) {
    if (isElectron()) {
      this.engine?.flush(accountId);
    }
  }

  configureApiPriority(taskInfo: Omit<DispatchTaskRequestContent, 'args' | 'account'>, priority: BridgeTaskPriority, overtime: number) {
    if (isElectron()) {
      return this.engine?.configureApiPriority(taskInfo, priority, overtime);
    }
    return Promise.resolve(true);
  }

  getConfigureTaskPriority() {
    if (isElectron()) {
      return this.engine?.getConfigureTaskPriority();
    }
    return Promise.resolve({});
  }

  // @todo:在/#setting下需要保证当前模块不可使用DB(不同token) 但是其他模块仍然需要正常使用DB
  forbiddenBbWin4CurrPage() {
    this.bridgeEnableUse = false;
  }

  enableBbWin4CurrPage() {
    this.bridgeEnableUse = true;
  }

  getBgFuncStatus4CurrentPage() {
    return this.bridgeEnableUse;
  }

  removeBridgeWin(webId: number) {
    if (isElectron()) {
      return this.engine!.removeBridgeWin(webId);
    }
    return Promise.resolve(true);
  }

  checkBgAlive(account: string) {
    if (isElectron()) {
      return this.engine!.checkBgAlive(account);
    }
    return Promise.resolve(true);
  }

  // 订阅后台事件
  addWinEvent(eventName: string, callback: (param: unknown) => void) {
    if (isElectron()) {
      return;
    }
    this.engine!.addWinEvent(eventName, callback);
  }

  removeWinEvent(eventName: string, eventId?: string) {
    if (isElectron()) {
      return;
    }
    this.engine!.removeWinEvent(eventName, eventId);
  }

  broadcast2AllWin() {}

  forbiddenBridgeOnce() {
    this.bridgeTempEnableUse = false;
  }

  enableBridgeOnce() {
    this.bridgeTempEnableUse = true;
  }

  getBridgeTempStatus() {
    return this.bridgeTempEnableUse;
  }
}

export const masterBridgeInstance = isSupportNativeProxy ? new MasterBridgeApi() : null;
