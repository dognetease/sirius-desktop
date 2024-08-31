import { useEffect } from 'react';
import { apiHolder, EventApi, ObFunction, PopUpMessageInfo, SystemEvent, ObObject, SystemEventTypeNames } from 'api';
// import type { ObObject, SystemEventTypeNames } from 'api/src';
import Alert, { AlertFuncProps } from '@web-common/components/UI/Alert/Alert';
import Toast from '@web-common/components/UI/Message/SiriusMessage';

/**
 * @param name
 * @param callback
 * @param preHandler obFuc 业务传入的前置逻辑，preHandler执行返回true或者false，false表明还需要执行接下里的通用逻辑
 */
const useCommonErrorEvent = (name?: string, callback?: (ev: SystemEvent) => void, preHandler?: (ev: SystemEvent) => boolean) => {
  const eventApi = apiHolder.api.getEventApi() as EventApi;

  useEffect(() => {
    // let id;
    // if (type !== 'addAccount')
    const obFuc = (ev: SystemEvent) => {
      if (ev && ev.eventData) {
        if (callback) {
          callback(ev);
        } else {
          const data = ev.eventData as PopUpMessageInfo;

          if (preHandler) {
            const isComplete = preHandler(ev);
            if (isComplete) {
              return;
            }
          }

          if (data.popupType && data.popupType === 'window') {
            if (data.popupLevel && data.popupLevel in Alert) {
              const params = {
                content: data.title,
                onOk: e => {
                  if (data.confirmCallback) {
                    data.confirmCallback(e);
                  }
                  eventApi.confirmEvent(ev);
                  al.destroy();
                },
                onCancel: e => {
                  if (data.cancelCallback) {
                    data.cancelCallback(e);
                  }
                  eventApi.confirmEvent(ev);
                  al.destroy();
                },
              } as AlertFuncProps;
              if (data.title) {
                params.content = data.title;
              }
              if (data.content) {
                params.content = data.content;
                params.title = data.title;
              }
              if (data.btnConfirmTxt) {
                params.okText = data.btnConfirmTxt;
              }
              const al = Alert[data.popupLevel](params);
            }
          } else if (data.popupType && data.popupType === 'toast') {
            // if(data.popupType && data.popupType==="toast"){
            if (data.popupLevel && data.popupLevel in Toast) {
              // @ts-ignore
              Toast[data.popupLevel]({
                content: data.title,
                duration: data.duration || 3,
                onClose: () => {
                  eventApi.confirmEvent(ev);
                },
              });
            }
          }
          // else if (data.popupType && ( data.popupType === 'loading' || data.popupType === 'finish' )) {
          //   Toast.loading({
          //     key: data.title,
          //     content: data.content,
          //     duration: data.popupType === 'finish' ? 0.5 : 30,
          //   });
          //   eventApi.confirmEvent(ev);
          // }
          // }
        }
      }
    };
    const id = eventApi.registerSysEventObserver('error', {
      name: name || 'commonErrorOb-' + (Date.now() % 1000000),
      func: obFuc,
    });
    return () => {
      if (id) {
        eventApi.unregisterSysEventObserver('error', id);
      }
    };
  }, []);
};

/**
 * 这个函数有bug，对象的方式传递obFunc，会导致registerSysEventObserver内部判断逻辑跳过对name属性的生成，导致返回一样的id
 * 建议该用useGlobalEventObserver
 */
const useEventObserver = (eventId: SystemEventTypeNames, obFunc: ObObject) => {
  const eventApi = apiHolder.api.getEventApi() as EventApi;
  useEffect(() => {
    const id = eventApi.registerSysEventObserver(eventId, obFunc);
    return () => {
      eventApi.unregisterSysEventObserver(eventId, id);
    };
  }, []);
};

const useGlobalEventObserver = (eventId: SystemEventTypeNames, func: ObFunction) => {
  const eventApi = apiHolder.api.getEventApi() as EventApi;
  useEffect(() => {
    const id = eventApi.registerSysEventObserver(eventId, { func });
    return () => {
      eventApi.unregisterSysEventObserver(eventId, id);
    };
  }, []);
};

export { useCommonErrorEvent, useEventObserver, useGlobalEventObserver };
