import React, { useEffect, useMemo, useRef, useState, useCallback, useContext } from 'react';
import useModuleHotKeys from '../hooks/useModuleHotKeys';
import { keyMap } from '../common/components/HotKeys/HotKeys';

interface Props {
  // keyMap: any;
  handlers: object;
}

const MailModuleHKContent = React.createContext();

export const ModuleHotKeyEvent: React.FC<Props> = props => {
  const { handlers } = props;

  const setHkHandler = useContext(MailModuleHKContent);
  const refFlag = useRef(false);

  useEffect(() => {
    if (!refFlag.current) {
      refFlag.current = true;
      setHkHandler && setHkHandler(handlers);
    }
  }, [handlers]);

  return <div>{props.children}</div>;
};

export const ModuleHotKey: React.FC<Props> = props => {
  // 根据当前模块的路由，生成对应的模块级快捷键组件
  const HotKeys = useModuleHotKeys('strangerMails');

  const [listHotKeyHandler, setListHotKeyHandler] = useState();

  const handleSetHkHandler = useCallback((handler: object): void => {
    setListHotKeyHandler(handler);
  }, []);

  return (
    <MailModuleHKContent.Provider value={handleSetHkHandler}>
      <HotKeys keyMap={keyMap} handlers={listHotKeyHandler} allowChanges style={{ width: '100%' }}>
        {props.children}
      </HotKeys>
    </MailModuleHKContent.Provider>
  );
};

export default ModuleHotKey;
