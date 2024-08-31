import React, { useCallback, useEffect, useRef } from 'react';
import { WaMessageType, apiHolder } from 'api';
import { TongyongJiantou1Zuo } from '@sirius/icons';
// import SiriusDrawer from '@web-common/components/UI/SiriusDrawer';
import SiriusDrawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
import { makeStageUrl } from '../utils';
import { DrawerProps } from 'antd/lib/drawer';
import cls from 'classnames';
import style from './index.module.scss';

const { isMac } = apiHolder.env;
const systemApi = apiHolder.api.getSystemApi();

interface ChatProps extends DrawerProps {
  waMsgType?: WaMessageType;
  chatId: string;
  userId: string;
  messageId: string;
  deleted: boolean; // deleted true-查询删除消息，false-不查询删除消息
  visible: boolean;
  onClose: () => void; // 关闭按钮
  goBack?: () => void; // 返回按钮
  title: string;
}

export const ChatHistoryDrawer = (props: ChatProps) => {
  const { visible, onClose, messageId, chatId, userId, waMsgType, goBack, title, deleted, ...rest } = props;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isWindows = systemApi.isElectron() && !isMac;

  // 获取数据，并分发给子容器
  const getDataForMessenger = useCallback(() => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'toggleData',
          messageId,
          chatId,
          userId,
          deleted,
          waMsgType,
        },
        '*'
      );
    } catch (error) {
      console.log(error);
    }
  }, [messageId, chatId, userId, deleted, waMsgType]);

  const getMessage = useCallback(
    (event: { data: { event_id: string; data: any } }) => {
      console.log('准备分发数据', event.data);
      if (event.data.event_id === 'get_load_status') {
        console.log('获取消息', event.data.data);
        getDataForMessenger();
      }
    },
    [getDataForMessenger]
  );

  useEffect(() => {
    window.addEventListener('message', getMessage);
    return () => {
      window.removeEventListener('message', getMessage);
    };
  }, [getMessage]);

  return (
    <SiriusDrawer
      destroyOnClose
      title={goBack ? <TongyongJiantou1Zuo style={{ fontSize: 20, cursor: 'pointer' }} onClick={goBack} /> : <span>{title}</span>}
      visible={visible}
      closable
      onClose={onClose}
      className={cls(style.chatDrawer, {
        [style.desktop]: isWindows,
      })}
      drawerStyle={{ top: 54 }}
      {...rest}
    >
      <div className={style.drawerBody}>
        <iframe ref={iframeRef} width="100%" height="100%" src={makeStageUrl(['waMessenger'])} onLoad={getDataForMessenger} frameBorder="0" />
      </div>
    </SiriusDrawer>
  );
};
