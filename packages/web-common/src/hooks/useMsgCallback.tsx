/**
 * 功能：消息回调的语法糖，仅为了屏蔽每次都要注册和释放消息的繁琐写法，callback中无法访问最新的state
 * warn: 如果需要访问state,请使用useMsgRenderCallback
 */

/**
 * ex:监听邮件标签的改变消息
 * useMsgCallback('onMailTagList', (e) => {
 *  //注意：接收到的数据可以设置到state中，由于闭包的原因无法访问state中的变量
 *  const { eventData } = e;
 *  doUpdateMailTagList(eventData);
 * });
 */

import { useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { apiHolder as api, SystemEventTypeNames, SystemEvent } from 'api';

type CallBack = (e: SystemEvent) => void;
const eventApi = api.api.getEventApi();

const useMsgCallback = (eventName: SystemEventTypeNames, callback: CallBack) => {
  // 消息监听
  useEffect(() => {
    const id = eventApi.registerSysEventObserver(eventName, {
      func: e => {
        /**
         * 批量合并，防止异步请求中的多次渲染
         */
        unstable_batchedUpdates(() => {
          callback && callback(e);
        });
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver(eventName, id);
    };
  }, []);
};

export default useMsgCallback;
