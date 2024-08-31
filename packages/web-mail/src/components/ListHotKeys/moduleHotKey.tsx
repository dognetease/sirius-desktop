import React, { useEffect, useMemo, useRef, useState, useCallback, useContext } from 'react';
import useModuleHotKeys from '../../hooks/useModuleHotKeys';
import { keyMap } from './listHotKeysHoc';
import { systemIsMac } from '@web-mail/util';

import {
  apiHolder as api,
  apis,
  ContactModel,
  DataStoreApi,
  DataTrackerApi,
  MailApi,
  AccountApi,
  EntityContactItem,
  EntityContact,
  MailAliasAccountModel,
  MailSignatureApi,
  PerformanceApi,
  ProductAuthorityFeature,
  ContactAndOrgApi,
  MailConfApi,
  SensitiveWord,
} from 'api';
const eventApi = api.api.getEventApi();
// 是否是mac系统
const isMac = systemIsMac();

interface Props {
  // keyMap: any;
  handlers?: object;
}

export const MailModuleHKContent = React.createContext();

export const ModuleHotKeyEvent: React.FC<Props> = props => {
  const { handlers } = props;

  const { setListHk } = useContext(MailModuleHKContent);
  const refFlag = useRef(false);

  useEffect(() => {
    if (!refFlag.current) {
      refFlag.current = true;
      setListHk && setListHk(handlers);
    }
  }, [handlers]);

  return <div>{props.children}</div>;
};

export const ModuleHotKey: React.FC<Props> = props => {
  // 根据当前模块的路由，生成对应的模块级快捷键组件
  const HotKeys = useModuleHotKeys('mailbox');

  const [listHotKeyHandler, setListHotKeyHandler] = useState();

  const [TagHotKeyHandler, setTagHotKeyHandler] = useState({});

  const handleSetHkHandler = useCallback((handler: object): void => {
    setListHotKeyHandler(handler);
  }, []);

  const handleSetTagHkHandler = useCallback((handler: object): void => {
    setTagHotKeyHandler(handler);
  }, []);

  const mergeHandler = useMemo(() => {
    return {
      ...(listHotKeyHandler || {}),
      ...(TagHotKeyHandler || {}),
      sendMail: e => {
        /**
         * 解决基础库的问题，拦截不准确的触发
         */
        if (e.key === 'Enter') {
          eventApi.sendSysEvent({
            eventName: 'mailMenuOper',
            eventData: {},
            eventStrData: 'sendMail',
          });
        }
      },
    };
  }, [listHotKeyHandler, TagHotKeyHandler]);

  const mergeKeyMap = useMemo(() => {
    const map = {};
    for (let i in TagHotKeyHandler) {
      // 必须转换为小写，才能正确执行
      map[i] = i.toLowerCase();
    }
    return {
      ...keyMap,
      ...map,
      sendMail: isMac ? 'enter+meta' : 'enter+ctrl',
    };
  }, [TagHotKeyHandler]);

  return (
    <MailModuleHKContent.Provider
      value={{
        setListHk: handleSetHkHandler,
        setTagHk: handleSetTagHkHandler,
      }}
    >
      <HotKeys keyMap={mergeKeyMap} handlers={mergeHandler} allowChanges style={{ width: '100%' }}>
        {props.children}
      </HotKeys>
    </MailModuleHKContent.Provider>
  );
};

export default ModuleHotKey;
