/*
 * 获取模块级别的快捷键根节点，自动与系统快捷键消息做桥接。
 *
 */
import React, { useRef, useCallback } from 'react';
import { HotKeys, configure } from '../common/library/HotKeys/react-hotkeys';
import useMsgCallback from '@web-common/hooks/useMsgCallback';

configure({
  ignoreRepeatedEventsWhenKeyHeldDown: false,
});

const useModuleHotKeys = (routerName: string) => {
  const eventForward = useRef(null);

  useMsgCallback('keyboard', event => {
    const curRouter = window.location.hash;
    /**
     * 符合当前路由，切焦点处于空置状态才进行转发
     * 焦点在web中，空置 = 处于body元素
     * 在electron中： 空置 = 处于gatsby添加的最外层元素上，如果gatsby被替换，该判断需要同步修改
     */

    const activeElement = document.activeElement;
    if (`#${routerName}` === curRouter && (activeElement === document.body || activeElement === document.getElementById('gatsby-focus-wrapper'))) {
      eventForward.current && eventForward.current(event.eventData);
    }
  });

  const ModuleHK = useCallback(
    props => (
      <HotKeys
        id="mailboxhotkey"
        {...{ ...props, children: undefined }}
        getEventForward={callback => {
          eventForward.current = callback;
        }}
      >
        {props.children}
      </HotKeys>
    ),
    []
  );

  return ModuleHK;
};

export default useModuleHotKeys;
