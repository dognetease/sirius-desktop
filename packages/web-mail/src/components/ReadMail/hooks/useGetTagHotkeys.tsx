/**
 * 用于获取本地的标签存储快捷键
 */

import { useEffect, useState } from 'react';
import { getHKFromLocalByAccount } from '@web-mail/util';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';

const useGetTagHotkeys = (account: string) => {
  const [hkMap, setHkMap] = useState<Record<string, string>>({});

  /**
   * 重载邮件标签快捷键
   */
  useMsgRenderCallback('mailMenuOper', ev => {
    const { eventStrData } = ev;
    if (eventStrData === 'reloadHotKey') {
      // 从本地读取快捷键
      setHkMap(getHKFromLocalByAccount(account));
    }
  });

  // 初始化的时候，请标签
  useEffect(() => {
    setHkMap(getHKFromLocalByAccount(account));
  }, [account]);

  return hkMap;
};

export default useGetTagHotkeys;
