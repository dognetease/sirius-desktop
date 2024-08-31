import { EventEmitter } from 'events';
import { NIMEventOptions } from '../../../api/logical/im';

/**
 * nim的初始化是一个异步的过程.
 * 为了降低用户成本,用户只需要订阅业务事件,不需要关心nim是否inited
 * 所以设置一个临时的订阅发布实例,在初始化之前将事件临时挂载到次实例上
 * 等初始化完成之后 再将数据更新到nim实例上去
 */
interface NIMEventApi {
  [key: string]: Function;
}

export class NIMEventManager extends EventEmitter {
  private eventNameSet: Set<string> = new Set();

  constructor() {
    super();
    this.setMaxListeners(99999);
  }

  /**
   * todo:重新封装event函数，
   * 因为nim是一个单例模式,同一个事件监听只能添加一个。如果有两个模块要监听就GG
   * 所以如果有两个业务模块监听的话就把他们的回调合并到一块
   */
  repackageEvent(eventName: keyof NIMEventOptions, callback: (...args: any[]) => void) {
    this.eventNameSet.add(eventName);
    // 暂时先不处理这块的逻辑 直接绑定上完事
    this.on(eventName, callback);
    console.warn('eventsCount:', eventName, this.listenerCount(eventName));
    return callback;
  }

  getAllEvents() {
    const allEventsMap: NIMEventApi = {};
    (Array.from(this.eventNameSet) as string[]).forEach(name => {
      allEventsMap[name] = this.listeners(name)[0];
    });
    return allEventsMap;
  }

  cleanAllEvents() {}

  removeEvent() {}
}

export const imSession = new NIMEventManager();
