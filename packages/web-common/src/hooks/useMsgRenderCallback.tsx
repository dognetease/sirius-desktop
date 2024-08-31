/**
 * 功能：注册监听消息，执行对应的callback，callback中可以访问最新的state
 * warn:由于react的渲染机制，会导致快速触发的两个时间合并，只set最后一个state
 * 这对于有副作用的msg是不可接受的，所以采用队列机制确保依次执行
 * 这可能会拖慢执行渲染速度,如果消息callback中没有访问state的需求，请使用useMsgCallback
 * changelog:
 *  2023.4.23: 修改调用机制
 */

/**
 * ex:监听邮件标签的改变消息
 * cosnt [state,setState] = useState(true)
 * useMsgRenderCallback('onMailTagList', (e) => {
 *  //注意：与useMsgCallback 不同，此处是可以访问state的
 *  const { eventData } = e;
 *  if(state){
 *    doUpdateMailTagList(eventData);
 *  }
 * });
 */

import { useState, useEffect } from 'react';
import { apiHolder, SystemEventTypeNames, SystemEvent } from 'api';
import useCreateCallbackForEvent from './useCreateCallbackForEvent';

type CallBack = (e: SystemEvent) => void;
const eventApi = apiHolder.api.getEventApi();

const useMsgRenderCallback = (eventName: SystemEventTypeNames, callback: CallBack) => {
  // const [taskList, setTaskList] = useState<SystemEvent[]>([]);
  const callbackRef = useCreateCallbackForEvent(callback);
  // 循环调用直到任务队列清空
  // useEffect(() => {
  //   if (taskList && taskList.length) {
  //     const event = taskList.shift();
  //     /**
  //      * 事件有useEffect触发，所以callback中的setState是合并渲染的
  //      */
  //      event && callback && callback(event);
  //     setTaskList([...taskList]);
  //   }
  // }, [taskList]);

  // 消息监听
  useEffect(() => {
    const id = eventApi.registerSysEventObserver(eventName, {
      func: e => {
        // setTaskList(list => [...list, e]);
        callbackRef(e);
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver(eventName, id);
    };
  }, []);
};

export default useMsgRenderCallback;
