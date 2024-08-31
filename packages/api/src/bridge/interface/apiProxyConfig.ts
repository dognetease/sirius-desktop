import { Api } from '@/api/_base/api';
import { BridgeTaskPriority, SupportNamespaces } from './common';
import { CustomError } from '../config/bridgeError';

// 通用信息的代理都放到这个里面

// 当前窗口类型 frontPage-前台页面 accountBg-账号后台页面 dataBg-数据后台页面
export type winWorkerEnv = 'frontPage' | 'accountBg' | 'dataBg';

export type ProxyTarget = (page: winWorkerEnv, isMainAccount: boolean, env?: 'electron' | 'web' | 'server') => Exclude<winWorkerEnv, 'frontPage'> | null | 'self';

// 各个模块API拦截代理配置
export type ModuleApiProxyApiConfig =
  | string
  | {
      key: string;
      // 方法级别的代理规则
      proxyTarget?: ProxyTarget;
      priorityConfig?: [BridgeTaskPriority, number];
      enableUpdateArgs?: boolean;
      // 代理到相同模块的另外一个方法上去(入参和返回都要保持一致)
      funcname?: string;
      backup?: (err: CustomError) => Promise<unknown>;
      enableProxy?: boolean;
    };
export interface ModuleApiProxyConfig {
  /**
   * @name:被代理的对象
   */
  target: () => Api;
  /**
   * @name:生成任务seq固定前缀的规则
   * @description: 增加这个配置的背景原因(2022-08-17) 在主进程里面需要通过account来区分任务要push到哪个session窗口处理。但是db操作要统一push到数据后台 其他操作要统一push到账号后台，不能通过代码一概而论所以要增加一个配置
   */
  // generateSeqPrefix():Promise<string>;
  /**
   * @name:被代理模块的命名空间
   */
  namespace: SupportNamespaces;
  /**
   * @name:代理的方法配置
   * @description: (有两种代理方法:一种是直接代理到目标对象的同名方法上——已实现 另外一种是直接代理的另外一个方法名上——未实现)
   */
  apis: ModuleApiProxyApiConfig[];
  proxyTarget: ProxyTarget;
  /**
   * @name:优先级配置
   */
  priorityConfig?: [BridgeTaskPriority, number];
  /**
   * @name:是否允许修改参数
   */
  enableUpdateArgs?: boolean;
  enableProxy?: boolean;
}
