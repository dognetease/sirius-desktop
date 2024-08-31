import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { HotKeys } from '../../library/HotKeys/react-hotkeys';
import { CardListComProps, stringMap } from '../../../types';
import useCreateCallbackForEvent from '../../../hooks/useCreateCallbackForEvent';

export enum ListHotKey {
  KEY_UP = 'KEY_UP',
  KEY_DOWN = 'KEY_DOWN',
}

export const keyMap = {
  [ListHotKey.KEY_UP]: 'up',
  [ListHotKey.KEY_DOWN]: 'down',
};

interface HotKeyList {
  onSelect: (key: string) => void;
  [key: string]: any;
}
const defaultGetUniqKey = (index: number) => index + '';
const defaultRowHeight = (index: number) => 20;

const SimpleHotKey = (ListCom: React.FC<any>, CustomEventOrign?: React.FC<any>) => (props: CardListComProps<any>) => {
  const {
    data = [],
    getUniqKey = defaultGetUniqKey,
    activeId,
    onSelect,
    onScroll,
    listHeight,
    scrollTop,
    // todo: 快捷键滚动的高度计算还有问题，需要修改
    topExtraData,
    cardGroupDecorate,
    cardMargin = 0,
    rowHeight = defaultRowHeight,
  } = props;

  /**
   * 存储列表项，递增高度的和
   * key：邮件的index
   * value：从第一封邮件到当前邮件的前一份邮件所有高度之和，包括两封邮件直接的边距
   */
  // const [preMailSumHeightMap, setPreMailSumHeight] = useState(new Map());
  const [key2IndexMap, setKey2IndexMap] = useState<stringMap>({});
  const [index2KeyMap, setIndex2KeyMap] = useState<stringMap>({});

  const listRef = useRef();

  // 检测邮件是否超出列表视窗上边界
  // const checkOverTop = (index: number): boolean => preMailSumHeightMap.get(index) < scrollTop;

  // // 检测邮件是否超出列表视窗下边界
  // const checkOverBottom = (index: number): boolean => preMailSumHeightMap.get(index) + rowHeight(data[index]) > scrollTop + listHeight;

  // 定位邮件到列表顶部
  const listScrollToTop = (index: number) => {
    // 定位和滚动是列表的职责，不应该在快捷键中实现
    if (listRef && listRef.current) {
      const { scrollToTop, srollToBottom } = listRef.current;
      scrollToTop(index);
    }
    // if (checkOverBottom(index)) {
    //   listScrollToBottom(index);
    //   return;
    // }
    // if (checkOverTop(index)) {
    //   const st = preMailSumHeightMap.get(index) || 0;
    //   onScroll
    //     && onScroll({
    //       scrollTop: st
    //     });
    // }
  };

  // 定位邮件到列表底部
  const listScrollToBottom = (index: number) => {
    if (listRef && listRef.current) {
      const { scrollToTop, srollToBottom } = listRef.current;
      srollToBottom(index);
    }
    // 如果是超出列表窗口上边界
    // if (checkOverTop(index)) {
    //   listScrollToTop(index);
    //   return;
    // }
    // if (checkOverBottom(index)) {
    //   const st = preMailSumHeightMap.get(index) - listHeight + rowHeight(data[index]) + 24;
    //   onScroll
    //     && onScroll({
    //       scrollTop: st
    //     });
    // }
  };

  // 上键
  const handleKeyUp = (e: React.KeyboardEvent) => {
    e.preventDefault();
    if (data && data.length) {
      let activeKey = '';
      let index = 0;
      if (activeId && activeId[0]) {
        activeKey = activeId[0];
        if (key2IndexMap[activeKey] != null) {
          index = key2IndexMap[activeKey];
        } else {
          index = data.length - 1;
        }
      } else {
        activeKey = getUniqKey(data.length - 1, data[data.length - 1]);
        index = data.length;
      }
      if (index != null && index >= 1) {
        const dataItem = data[index - 1];
        const key = getUniqKey(index - 1, dataItem);
        onSelect && onSelect([key], dataItem, index, e);
        listScrollToTop(index - 1);
      }
    }
  };
  // 下键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    if (data && data.length) {
      let activeKey = '';
      let index = 0;
      if (activeId && activeId[0]) {
        activeKey = activeId[0];
        if (key2IndexMap[activeKey] != null) {
          index = key2IndexMap[activeKey];
        } else {
          index = 0;
        }
      } else {
        activeKey = getUniqKey(0, data[0]);
        index = -1;
      }
      if (index != null && index < data.length - 1) {
        const dataItem = data[index + 1];
        const key = getUniqKey(index + 1, dataItem);
        onSelect && onSelect([key], dataItem, index, e);
        listScrollToBottom(index + 1);
      }
    }
  };

  const handleKeyUpFE = useCreateCallbackForEvent(handleKeyUp);
  const handleKeyDownFE = useCreateCallbackForEvent(handleKeyDown);
  const listHotKeyHandler = {
    [ListHotKey.KEY_UP]: handleKeyUpFE,
    [ListHotKey.KEY_DOWN]: handleKeyDownFE,
  };

  const HotKeyEventOrigin = CustomEventOrign || HotKeys;

  // 请求key到index的映射
  useEffect(() => {
    let key2Index: stringMap = {};
    let index2Key: stringMap = {};
    // // preMailSumHeightMap.clear();
    // let preHeight = 0;
    if (data) {
      data.forEach((item, index) => {
        const key = getUniqKey(index, item);
        key2Index[key] = index;
        index2Key[index] = key;
        // preMailSumHeightMap.set(index, preHeight);
        // preHeight += rowHeight(item) + cardMargin;
      });
    }
    setIndex2KeyMap(index2Key);
    setKey2IndexMap(key2Index);
    // setPreMailSumHeight(preMailSumHeightMap);
  }, [data]);

  return (
    <HotKeyEventOrigin keyMap={keyMap} handlers={listHotKeyHandler}>
      <ListCom ref={listRef} {...props} />
    </HotKeyEventOrigin>
  );
};
export default SimpleHotKey;
