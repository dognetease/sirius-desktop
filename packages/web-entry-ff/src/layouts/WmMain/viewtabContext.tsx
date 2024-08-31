import React, { createContext, useContext, useState } from 'react';
import { nanoid } from '../utils/nanoId';
import { TabItemProps } from './viewTab';

const defaultTabList: TabItemProps[] = [
  {
    id: nanoid(),
    path: '#mailbox?page=mailbox',
    title: '邮件管理',
    isActive: true,
    isCached: false,
  },
];

type viewTabDataType = [TabItemProps[], React.Dispatch<React.SetStateAction<TabItemProps[]>>];

const ViewtabContext = createContext({});

export const useTabContext = () => useContext(ViewtabContext) as viewTabDataType;

export const ViewtabCtxProvider = ({ children }) => {
  // const defaultTab = useState(defaultTabList); // [myCtxState, setMyCtxState]
  let [tabList, setTablist] = useState(defaultTabList);
  return <ViewtabContext.Provider value={[tabList, setTablist]}>{children}</ViewtabContext.Provider>;
};

export { defaultTabList, ViewtabContext };
