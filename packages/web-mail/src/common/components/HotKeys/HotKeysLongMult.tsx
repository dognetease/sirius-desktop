/* eslint-disable max-statements */
/*
 * 邮件列表的快捷键操作 - 带卡片勾选，多选状态外置
 * 所有标志全部存储邮件id，因为邮件列表属于随时变动的列表，index会偏移
 * 列表操作的转移图 参考： https://www.processon.com/diagraming/610270d5e401fd7e998580d8
 * 快捷键设计方案：参考 企业空间-技术文档-邮件-快捷键设计
 */

/**
 * todo: 各种方法需要用处理，方式列表其他属性变化导致的快捷键功能重新渲染。
 * todo：快捷键需要返回对应的类型信息
 */
import React, { useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { HotKeys } from '../../library/HotKeys/react-hotkeys';
import { CardListComProps, stringMap } from '../../../types';
import useCreateCallbackForEvent from '../../../hooks/useCreateCallbackForEvent';
import useDebounceForEvent from '../../../hooks/useDebounceForEvent';
import useThrottleForEvent from '../../../hooks/useThrottleForEvent';
import { LIST_MODEL } from '../../constant';

// export enum LIST_MODEL {
//   INIT = 'INIT',
//   SINGLE = 'SINGLE',
//   MULTIPLE = 'MULTIPE'
// }

export enum ListHotKey {
  KEY_UP = 'KEY_UP',
  KEY_DOWN = 'KEY_DOWN',
  KEY_DELETE = 'KEY_DELETE',
  SHIFT_KEY_UP = 'SHIFT_KEY_UP',
  SHIFT_KEY_DOWN = 'SHIFT_KEY_DOWN',
  COMMAND_A = 'COMMAND_A',
  COMMAND_R = 'COMMAND_R',
  ENTER = 'ENTER',
}

export const keyMap = {
  [ListHotKey.KEY_UP]: 'up',
  [ListHotKey.KEY_DOWN]: 'down',
  [ListHotKey.KEY_DELETE]: ['ctrl+d'],
  [ListHotKey.SHIFT_KEY_UP]: 'shift+up',
  [ListHotKey.SHIFT_KEY_DOWN]: 'shift+down',
  [ListHotKey.COMMAND_A]: ['command+a', 'control+a', 'ctrl+a'],
  [ListHotKey.COMMAND_R]: ['command+r', 'ctrl+r'],
  [ListHotKey.ENTER]: 'enter',
};

interface HotKeyList {
  onSelect: (key: string) => void;
  [key: string]: any;
}
const defaultGetUniqKey = (index: number) => index + '';
const defaultRowHeight = (index: number) => 20;

const HotKey = (ListCom: React.FC<any>, CustomEventOrign?: React.FC<any>) =>
  forwardRef((props: CardListComProps<any>, ref: React.Ref<any>) => {
    const {
      data = [],
      getUniqKey = defaultGetUniqKey,
      activeId = [],
      onSelect,
      onUnSelect,
      onActive,
      onActiveInWindow,
      onListModelChange,
      onDelete,
      onContextMenu,
      selectModel = LIST_MODEL.INIT,
      // 快捷键功能是否开启
      hkDisabled = false,
      beforeSelected,
    } = props;

    useEffect(() => {
      refListModel.current = selectModel;
    }, [selectModel]);

    // 列表的模式  初始态 单选态  多选态
    // const [listModel, _setListModel] = useState(model);
    // 列表模式的引用，与listModel同步变化
    const refListModel = useRef(selectModel);
    // shift组选键的开始位置邮件id 默认初始化为第一个
    const [shiftActiveId, setShiftActiveId] = useState(null);
    // shift组选键 操作 游标- 邮件id
    const [shiftCurId, setShiftCurId] = useState(null);
    // 选中的ids
    // const [activeId, setActiveIds] = useState<string[]>([])
    const _activeIds = useRef<any[]>([]);

    // mailid 到 index 的快速转换
    const [mailId2ListIndexMap, setId2IndexMap] = useState(new Map());
    // 激活id的map  用于快速查看id是否处于激活
    // const [activeIdsMap, setActiveIdsMap] = useState(new Map())
    const activeIdsMap = useRef<any>(new Map());
    // 子组件方法-滚动显示指定的项
    // const listScrollFnRef = useRef(index => { });
    /**
     * 存储列表项，递增高度的和
     * key：邮件的index
     * value：从第一封邮件到当前邮件的前一份邮件所有高度之和，包括两封邮件直接的边距
     */
    const [preMailSumHeightMap, setPreMailSumHeight] = useState(new Map());

    // dateItem2key map
    const [dataItem2keyMap, setDateItem2keyMap] = useState(new Map());

    const listRef = useRef();

    // 获取列表的第一个连续选中组
    const findFirstIdGroup = () => {
      return [];
    };

    useEffect(() => {
      if (activeId != null && Array.isArray(activeId)) {
        // 判断activeIds是否严格一致,不严格一致才进行同步
        if (!(activeId.length === _activeIds.current.length && activeId.every(id => idIsActive(id)))) {
          // 根据activeIds的内容，有很多状态
          // 如果为空，则整体重置
          if (activeId.length == 0) {
            reset();
            // onListModelChange && onListModelChange(LIST_MODEL.INIT);
          } else {
            /*
             *  先实行简单策略- 仅保证功能流程的正常执行
             *  如果需要更好的体验，则需要更精细的融合策略
             */
            _activeIds.current = activeId;
            if (activeId.length == 1) {
              /**
               * 部分操作后选中焦点的转移，快捷键内部指针也得跟随
               * 状态机置为单选模式
               */
              setShiftActiveId(activeId[0]);
              setShiftCurId(activeId[0]);
              if (selectModel && selectModel === LIST_MODEL.MULTIPLE) {
                setListModel(LIST_MODEL.SINGLE);
              }
              // onListModelChange && onListModelChange(LIST_MODEL.SINGLE);
            } else {
              if (selectModel && selectModel != LIST_MODEL.MULTIPLE) {
                setListModel(LIST_MODEL.MULTIPLE);
              }
              // onListModelChange && onListModelChange(LIST_MODEL.MULTIPLE);
              /**
               * 对于外部的状态变化，不再做精细的shiftActiveId 和 shiftCurId 位置顺序判断
               * 简单策略： shiftActiveId  和 shiftCurId 对齐到第一个组选块中
               */
              const group = findFirstIdGroup();
              if (group && group.length) {
                const start = group[0];
                const end = group[group.length - 1];
                setShiftActiveId(start);
                setShiftCurId(end);
              }
            }
          }

          // 其他情况应该会很少遇到，等遇到的时候再处理
          // 如果不为空，但不一致，说明想主动改变，则根据数量进行区分
          // 如果数量大于一，多选，重建对应的状态，map，对焦点进行妥善的处理
          // 如果等于已，单选，焦点问题就很好处理了

          // 同步_activeIds, activeIdMap
          _activeIds.current = activeId;
          activeIdsMap.current.clear();
          setActiveIdsMap(map => {
            activeId.forEach(id => {
              map.set(id, true);
            });
            return map;
          });
        }
      }
    }, [activeId]);

    /*
     * 辅助函数
     */

    /**
     *  模式设置proxy
     *  解决listModel 在快速操作下可能出现的不同步，造成凭空多选的错误状态
     */
    const setListModel = model => {
      refListModel.current = model;
      // 抛出模式改变
      onListModelChange && onListModelChange(model, _activeIds?.current);
      // _setListModel(model);
    };

    // id到列表index转换
    const id2Index = id => mailId2ListIndexMap.get(id);

    // 判断id是否激活
    const idIsActive = id => {
      if (_activeIds.current && _activeIds.current.length) {
        // return !!activeIdsMap.current.get(id);
        return _activeIds.current.includes(id);
      }
      return false;
    };

    // 设置activeIds
    const setActiveIds = ids => {
      if (Array.isArray(ids)) {
        _activeIds.current = ids;
      } else if (ids) {
        _activeIds.current = ids(_activeIds.current);
      }
    };

    const setActiveIdsMap = map => {
      if (map instanceof Map) {
        activeIdsMap.current = map;
      } else if (map) {
        activeIdsMap.current = map(activeIdsMap.current);
      }
    };

    /*
     *  功能
     */

    // 状态重置
    const reset = () => {
      setListModel(LIST_MODEL.INIT);

      setActiveIds([]);
      setActiveIdsMap(new Map());
      if (data && data.length) {
        const id = dataItem2keyMap.get(data[0]);
        setShiftActiveId(id);
        setShiftCurId(id);
      } else {
        setShiftActiveId(null);
        setShiftCurId(null);
      }
    };

    // 清空选中状态
    const clearActive = () => {
      setActiveIds([]);
      setActiveIdsMap(new Map());
    };

    // 删除已激活的id
    const deleteActiveId: (id: string | string[]) => any = id => {
      if (typeof id === 'string') {
        if (idIsActive(id)) {
          setActiveIds(ids => ids.filter(mailId => mailId != id));
          setActiveIdsMap(map => {
            map.delete(id);
            return map;
          });
        }
      } else if (Array.isArray(id)) {
        const ids = id.filter(mailId => idIsActive(mailId));
        if (ids && ids.length) {
          setActiveIds(_activeIds => _activeIds.filter(mailId => !ids.includes(mailId)));
          setActiveIdsMap(map => {
            ids.forEach(mailId => {
              map.delete(mailId);
            });
            return map;
          });
        }
      }
    };

    // 添加单个id
    const addSingleActiveId: (id: string) => any = id => {
      if (typeof id === 'string') {
        if (idIsActive(id)) return null;
        setActiveIds([id]);
        // 设置选中map
        setActiveIdsMap(map => {
          map.set(id, true);
          return map;
        });
      }
    };

    // 添加多选id
    const addActiveId: (id: string | string[]) => any = id => {
      if (typeof id === 'string') {
        if (idIsActive(id)) return null;
        setActiveIds(ids => [...ids, id]);
        // 设置选中map
        setActiveIdsMap(map => {
          map.set(id, true);
          return map;
        });
      } else if (Array.isArray(id)) {
        const ids = id.filter(id => !idIsActive(id));
        if (!ids.length) return null;
        setActiveIds(_ids => [..._ids, ...ids]);
        setActiveIdsMap(map => {
          ids.forEach(id => {
            map.set(id, true);
          });
          return map;
        });
      }
    };

    // 列表滚动到制定位置
    // todo: 删除原有的列表定位方法，替换为上部定位和下部定位
    // const listScrollTo = (index: number) => {
    //   listScrollFnRef.current && listScrollFnRef.current(index);
    // };

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
      // // 如果是超出列表窗口上边界
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

    /*
     *  事件
     */

    const handleItemSelect = (ids: string[], param_activeIds, curId) => {
      if (beforeSelected) {
        const customActiveIds = beforeSelected(ids, param_activeIds, curId);
        _activeIds.current = customActiveIds;
        onSelect && onSelect(ids, customActiveIds, curId);
      } else {
        onSelect && onSelect(ids, param_activeIds, curId);
      }
    };

    const handleItenUnSelect = (ids: string[], param_activeIds, curId) => {
      if (beforeSelected) {
        const customActiveIds = beforeSelected(ids, param_activeIds, curId);
        _activeIds.current = customActiveIds;
        onUnSelect && onUnSelect(ids, customActiveIds, curId);
      } else {
        onUnSelect && onUnSelect(ids, param_activeIds, curId);
      }
    };

    const handleItemonContextmenu = (key, mail, index, event) => {
      onContextMenu && onContextMenu(key, mail, index, event);
    };

    const handleItemActive = id => {
      const index = id2Index(id);
      const _data = data[index];
      onActive && onActive(id, index, _data, _activeIds.current);
    };

    const handleItemDelete = ids => {
      onDelete && onDelete(ids);
    };

    // const debouceHandleItemActive = handleItemActive;
    // useCallback(debounce(handleItemActive, 700), [handleItemActive]);

    // const handleListModelChange = mailList => {
    //   onListModelChange && onListModelChange(refListModel.current);
    // };

    // 监听list的created以获取某些功能
    // const handleListCreated = fnMap => {
    //   const { scrollTo = index => { } } = fnMap;
    //   listScrollFnRef.current = scrollTo;
    //   onCreated && onCreated(fnMap);
    // };

    const modelOperMap = {
      [LIST_MODEL.INIT]: {
        handleChecked: (item, checked) => {
          const id = dataItem2keyMap.get(item);
          if (checked) {
            clearActive();
            addActiveId(id);
            setShiftActiveId(id);
            setShiftCurId(id);
            handleItemSelect([id], _activeIds.current, id);
            setListModel(LIST_MODEL.MULTIPLE);
            // handleItemActive(id);
          } else {
            // 初始状态unchecked无意义
          }
        },
        handleClick: item => {
          const id = dataItem2keyMap.get(item);
          // 只触发激活，不触发选中
          // setListModel(LIST_MODEL.SINGLE);
          // addSingleActiveId(id);
          // setShiftActiveId(id);
          // handleItemSelect([id], _activeIds.current, id);
          handleItemActive(id);
          // setShiftCurId(id);
        },
        handleShiftClick: item => {
          const id = dataItem2keyMap.get(item);
          const curIndex = id2Index(id);
          const ids: string[] = [];
          if (data && data.length) {
            for (let i = 0; i <= curIndex; i++) {
              const dateItem = data[i];
              const itemId = dataItem2keyMap.get(dateItem);
              ids.push(itemId);
            }
          }
          addActiveId(ids);
          handleItemSelect(ids, _activeIds.current, id);
          setShiftCurId(id);
          if (curIndex > 0) {
            setListModel(LIST_MODEL.MULTIPLE);
          } else {
            setListModel(LIST_MODEL.SINGLE);
            handleItemActive(id);
          }
        },
        handleComClick: (item, index) => {
          const id = dataItem2keyMap.get(item);
          handleItemActive(id);
          addActiveId(id);
          setShiftActiveId(id);
          handleItemSelect([id], _activeIds.current, id);
          setListModel(LIST_MODEL.SINGLE);
        },
        // handleKeyUp: () => {
        //   // 上键无意义
        // },
        handleKeyDown: () => {
          if (data && data.length) {
            const id = dataItem2keyMap.get(data[0]);
            setListModel(LIST_MODEL.SINGLE);
            clearActive();
            addActiveId(id);
            setShiftActiveId(id);
            handleItemSelect([id], _activeIds.current, id);
            // handleItemActive(id);
            setShiftCurId(id);
          }
        },
        handleKeyShiftUp: () => {
          // 无意义
        },
        handleKeyShiftDown: () => {
          const curIndex = 0;
          if (data && data.length) {
            const id = dataItem2keyMap.get(data[curIndex]);

            addActiveId(id);
            handleItemActive(id);
            handleItemSelect(id, _activeIds.current, id);
            setShiftCurId(id);
          }
          setListModel(LIST_MODEL.SINGLE);
        },
        handleKeyCommandA: () => {
          if (data && data.length) {
            const ids = data.map(item => dataItem2keyMap.get(item));
            addActiveId(ids);
            setShiftActiveId(ids[0]);
            handleItemSelect(ids, _activeIds.current, []);
            setShiftCurId(ids[ids.length - 1]);
            setListModel(LIST_MODEL.MULTIPLE);
          }
        },
        handleKeyDelete: () => {
          // 理论上该状态下应该没有选中的邮件
          // 处理意外情况
          if (_activeIds && _activeIds.current && _activeIds.current.length) {
            const idList = _activeIds.current;
            handleItemDelete && handleItemDelete([...idList]);
          }
        },
      },
      [LIST_MODEL.SINGLE]: {
        handleChecked: (item, checked) => {
          const id = dataItem2keyMap.get(item);
          if (checked) {
            clearActive();
            addActiveId(id);
            setShiftActiveId(id);
            setShiftCurId(id);
            handleItemSelect([id], _activeIds.current, id);
            setListModel(LIST_MODEL.MULTIPLE);
          } else {
            // 单选态无理论上无取消，如果有，一定是状态不对
          }
        },
        handleClick: mail => {
          const id = dataItem2keyMap.get(mail);
          // setListModel(LIST_MODEL.SINGLE);
          // clearActive();
          // addSingleActiveId(id);
          // setShiftActiveId(id);
          // handleItemSelect([id], _activeIds.current, id);
          handleItemActive(id);
          // setShiftCurId(id);
        },
        handleShiftClick: mail => {
          const id = dataItem2keyMap.get(mail);
          const curIndex = id2Index(id);
          const startIndex = id2Index(shiftActiveId);
          const ids: string[] = [];
          const start = startIndex < curIndex ? startIndex : curIndex;
          const end = curIndex > startIndex ? curIndex : startIndex;
          // 范围选中
          if (data && data.length) {
            for (let i = start; i <= end; i++) {
              const mail = data[i];
              ids.push(dataItem2keyMap.get(mail));
            }
          }
          addActiveId(ids);
          handleItemSelect(ids, _activeIds.current, id);
          setShiftCurId(id);
          setListModel(LIST_MODEL.MULTIPLE);
        },
        handleComClick: mail => {
          const id = dataItem2keyMap.get(mail);
          if (idIsActive(id)) {
            if (data.length > 1 && _activeIds.current.length > 1) {
              deleteActiveId(id);
              setShiftActiveId(id);
              handleItenUnSelect([id], _activeIds.current, id);
              setListModel(LIST_MODEL.MULTIPLE);
            }
          } else {
            addActiveId(id);
            setShiftActiveId(id);
            handleItemSelect([id], _activeIds.current, id);
            setListModel(LIST_MODEL.MULTIPLE);
          }
          setShiftCurId(id);
        },
        handleKeyUp: () => {
          if (shiftActiveId) {
            const index = id2Index(shiftActiveId);
            if (index >= 1) {
              const mail = data[index - 1];
              const id = dataItem2keyMap.get(mail);
              clearActive();
              setListModel(LIST_MODEL.SINGLE);
              setActiveIds([id]);
              setShiftActiveId(id);
              handleItemSelect([id], _activeIds.current, id);
              setShiftCurId(id);
              // handleItemActive(id);
              listScrollToTop(index - 1);
            }
          }
        },
        handleKeyDown: () => {
          if (shiftActiveId) {
            const index = id2Index(shiftActiveId);
            if (index < data.length - 1) {
              const mail = data[index + 1];
              const id = dataItem2keyMap.get(mail);
              if (mail && id) {
                clearActive();
                setListModel(LIST_MODEL.SINGLE);
                setActiveIds([id]);
                setShiftActiveId(id);
                handleItemSelect([id], _activeIds.current, id);
                // handleItemActive(id);
                setShiftCurId(id);
                listScrollToBottom(index + 1);
              }
            }
          }
        },
        handleKeyShiftUp: () => {
          const index = id2Index(shiftActiveId);
          if (index != null && index - 1 > 0) {
            const mailId = dataItem2keyMap.get(data[index - 1]);
            addActiveId(mailId);
            handleItemSelect(mailId, _activeIds.current, mailId);
            setShiftCurId(mailId);
            listScrollToTop(index - 1);
            setListModel(LIST_MODEL.MULTIPLE);
          }
        },
        handleKeyShiftDown: () => {
          const index = id2Index(shiftActiveId);
          if (index != null && index + 1 < data.length - 1) {
            const mailId = dataItem2keyMap.get(data[index + 1]);
            addActiveId(mailId);
            handleItemSelect(mailId, _activeIds.current, mailId);
            setShiftCurId(mailId);
            listScrollToBottom(index + 1);
            setListModel(LIST_MODEL.MULTIPLE);
          }
        },
        handleKeyCommandA: () => {
          if (data && data.length) {
            const ids = data.map(item => dataItem2keyMap.get(item));
            addActiveId(ids);
            setShiftActiveId(ids[0]);
            handleItemSelect(ids, _activeIds.current, []);
            setShiftCurId(ids[ids.length - 1]);
            setListModel(LIST_MODEL.MULTIPLE);
          }
        },
        handleKeyDelete: () => {
          if (_activeIds && _activeIds.current && _activeIds.current.length) {
            const idList = _activeIds.current;
            handleItemDelete && handleItemDelete([...idList]);
          }
        },
      },
      [LIST_MODEL.MULTIPLE]: {
        handleChecked: (item, checked) => {
          const id = dataItem2keyMap.get(item);
          if (checked) {
            addActiveId(id);
            setShiftActiveId(id);
            setShiftCurId(id);
            handleItemSelect([id], _activeIds.current, id);
            setListModel(LIST_MODEL.MULTIPLE);
          } else if (idIsActive(id)) {
            // 如果是最后一个多选的项目
            if (_activeIds.current.length <= 1) {
              addActiveId(id);
              setShiftActiveId(id);
              setShiftCurId(id);
              handleItemSelect([id], _activeIds.current, id);
              // handleItemActive(id);
              setListModel(LIST_MODEL.SINGLE);
            } else {
              // todo: 代码重复需要重构
              if (data.length > 1 && _activeIds.current.length > 1) {
                deleteActiveId(id);
                // setShiftActiveId(id);
                // setShiftCurId(id);
                handleItenUnSelect([id], _activeIds.current, id);
                // 边界条件- 当一个选中区域全部被command+单击取消后，shiftActiveId焦点悬空，需要按照规则进行排布
                // 规则：首先由当前选重点向下查找，找到第一个激活的邮件id作为shiftActiveId
                // 如果下方没有激活  则向上查找，
                // 如果都没有，则shiftActiveId 为初始值
                const index = id2Index(id);
                const top = index - 1 >= 0 ? index - 1 : 0;
                const bottom = index + 1 <= data.length - 1 ? index + 1 : data.length - 1;
                if (!idIsActive(id2Index(top)) && !idIsActive(id2Index(bottom))) {
                  if (_activeIds.current.length == 0) {
                    setShiftActiveId(dataItem2keyMap.get(data[0]));
                    setShiftCurId(dataItem2keyMap.get(data[0]));
                    return;
                  }
                  // 向下查找
                  for (let i = index; i < data.length; i++) {
                    const _id = dataItem2keyMap.get(data[i]);
                    if (idIsActive(_id)) {
                      setShiftActiveId(_id);
                      // 继续查找边界,设置shiftcur游标
                      for (let n = i; n < data.length; n++) {
                        const _id = dataItem2keyMap.get(data[n]);
                        if (!idIsActive(_id)) {
                          if (n - 1 >= 0) {
                            setShiftCurId(dataItem2keyMap.get(data[n - 1]));
                          }
                          return;
                        }
                      }
                      return;
                    }
                  }
                  // 向上查找
                  for (let i = index; i >= 0; i--) {
                    const _id = dataItem2keyMap.get(data[i]);
                    if (idIsActive(_id)) {
                      setShiftActiveId(_id);
                      // 继续查找边界,设置shiftcur游标
                      for (let n = i; n >= 0; n--) {
                        const _id = dataItem2keyMap.get(data[n]);
                        if (!idIsActive(_id)) {
                          if (n + 1 < data.length) {
                            setShiftCurId(dataItem2keyMap.get(data[n + 1]));
                          }
                          return;
                        }
                      }
                      return;
                    }
                  }
                }
                setListModel(LIST_MODEL.MULTIPLE);
              }
            }
          }
        },
        handleClick: mail => {
          const id = dataItem2keyMap.get(mail);
          // setListModel(LIST_MODEL.SINGLE);
          // clearActive();
          // addActiveId(id);
          // setShiftActiveId(id);
          // handleItemSelect([id], _activeIds.current, id);
          handleItemActive(id);
          // setShiftCurId(id);
        },
        handleShiftClick: mail => {
          let curIndex = id2Index(shiftCurId);
          const startIndex = id2Index(shiftActiveId);
          let direction = curIndex >= startIndex;
          let start = direction ? startIndex : curIndex;
          let end = direction ? curIndex : startIndex;
          const activeIdList: string[] = [];
          let _shiftCurId = dataItem2keyMap.get(mail);
          // 取消激活状态的idlist
          const unActiveList: string[] = [];

          // shift的选中与取消机制
          if (shiftCurId) {
            for (let i = start; i <= end; i++) {
              const mail = data[i];
              unActiveList.push(dataItem2keyMap.get(mail));
            }
          }
          curIndex = id2Index(dataItem2keyMap.get(mail));
          direction = curIndex >= startIndex;
          start = startIndex < curIndex ? startIndex : curIndex;
          end = curIndex > startIndex ? curIndex : startIndex;
          // 范围选中
          if (data && data.length) {
            for (let i = start; i <= end; i++) {
              const mail = data[i];
              activeIdList.push(dataItem2keyMap.get(mail));
            }
          }

          // 接壤的游标扩散
          if (direction) {
            if (curIndex + 1 < data.length && idIsActive(dataItem2keyMap.get(data[curIndex + 1]))) {
              for (let i = curIndex + 1; i < data.length; i++) {
                const id = dataItem2keyMap.get(data[i]);
                if (idIsActive(id)) {
                  _shiftCurId = id;
                  continue;
                }
                break;
              }
            }
          } else if (curIndex - 1 < data.length && idIsActive(dataItem2keyMap.get(data[curIndex - 1]))) {
            for (let i = curIndex - 1; i >= 0; i--) {
              const id = dataItem2keyMap.get(data[i]);
              if (idIsActive(id)) {
                _shiftCurId = id;
                continue;
              }
              break;
            }
          }

          // 叠压的联动取消
          if (idIsActive(dataItem2keyMap.get(mail))) {
            if (direction) {
              if (curIndex + 1 < data.length && idIsActive(dataItem2keyMap.get(data[curIndex + 1]))) {
                for (let i = curIndex + 1; i < data.length; i++) {
                  const id = dataItem2keyMap.get(data[i]);
                  if (idIsActive(id)) {
                    unActiveList.push(id);
                    continue;
                  }
                  break;
                }
              }
            } else if (curIndex - 1 >= 0 && idIsActive(dataItem2keyMap.get(data[curIndex - 1]))) {
              for (let i = curIndex - 1; i >= 0; i--) {
                const id = dataItem2keyMap.get(data[i]);
                if (idIsActive(id)) {
                  unActiveList.push(id);
                  continue;
                }
                break;
              }
            }
          }

          deleteActiveId(unActiveList);
          addActiveId(activeIdList);
          handleItemSelect(activeIdList, _activeIds.current, _shiftCurId);
          setShiftCurId(_shiftCurId);
          setListModel(LIST_MODEL.MULTIPLE);
        },
        handleComClick: mail => {
          const id = dataItem2keyMap.get(mail);

          // 已经激活的的则取消
          if (idIsActive(id)) {
            if (data.length > 1 && _activeIds.current.length > 1) {
              deleteActiveId(id);
              // setShiftActiveId(id);
              // setShiftCurId(id);
              handleItenUnSelect([id], _activeIds.current, id);
              // 边界条件- 当一个选中区域全部被command+单击取消后，shiftActiveId焦点悬空，需要按照规则进行排布
              // 规则：首先由当前选重点向下查找，找到第一个激活的邮件id作为shiftActiveId
              // 如果下方没有激活  则向上查找，
              // 如果都没有，则shiftActiveId 为初始值
              const index = id2Index(id);
              const top = index - 1 >= 0 ? index - 1 : 0;
              const bottom = index + 1 <= data.length - 1 ? index + 1 : data.length - 1;
              if (!idIsActive(id2Index(top)) && !idIsActive(id2Index(bottom))) {
                if (_activeIds.current.length == 0) {
                  setShiftActiveId(dataItem2keyMap.get(data[0]));
                  setShiftCurId(dataItem2keyMap.get(data[0]));
                  return;
                }
                // 向下查找
                for (let i = index; i < data.length; i++) {
                  const _id = dataItem2keyMap.get(data[i]);
                  if (idIsActive(_id)) {
                    setShiftActiveId(_id);
                    // 继续查找边界,设置shiftcur游标
                    for (let n = i; n < data.length; n++) {
                      const _id = dataItem2keyMap.get(data[n]);
                      if (!idIsActive(_id)) {
                        if (n - 1 >= 0) {
                          setShiftCurId(dataItem2keyMap.get(data[n - 1]));
                        }
                        return;
                      }
                    }
                    return;
                  }
                }
                // 向上查找
                for (let i = index; i >= 0; i--) {
                  const _id = dataItem2keyMap.get(data[i]);
                  if (idIsActive(_id)) {
                    setShiftActiveId(_id);
                    // 继续查找边界,设置shiftcur游标
                    for (let n = i; n >= 0; n--) {
                      const _id = dataItem2keyMap.get(data[n]);
                      if (!idIsActive(_id)) {
                        if (n + 1 < data.length) {
                          setShiftCurId(dataItem2keyMap.get(data[n + 1]));
                        }
                        return;
                      }
                    }
                    return;
                  }
                }
              }
              setListModel(LIST_MODEL.MULTIPLE);
            }
          } else {
            addActiveId(id);
            setShiftActiveId(id);
            setShiftCurId(id);
            handleItemSelect([id], _activeIds.current, id);
            setListModel(LIST_MODEL.MULTIPLE);
          }
        },
        handleKeyUp: () => {
          if (shiftActiveId) {
            const index = id2Index(shiftActiveId);
            if (index > 1) {
              const mail = data[index - 1];
              const id = dataItem2keyMap.get(mail);
              clearActive();
              setListModel(LIST_MODEL.SINGLE);
              setActiveIds([id]);
              setShiftActiveId(id);
              handleItemSelect([id], _activeIds.current, id);
              setShiftCurId(id);
              // handleItemActive(id);
              listScrollToTop(index - 1);
            }
          }
        },
        handleKeyDown: () => {
          if (shiftActiveId) {
            const index = id2Index(shiftActiveId);
            if (index < data.length - 1) {
              const mail = data[index + 1];
              const id = dataItem2keyMap.get(mail);
              if (mail && id) {
                clearActive();
                setListModel(LIST_MODEL.SINGLE);
                setActiveIds([id]);
                setShiftActiveId(id);
                handleItemSelect([id], _activeIds.current, id);
                setShiftCurId(id);
                // handleItemActive(id);
                listScrollToBottom(index + 1);
              }
            }
          }
        },
        handleKeyShiftUp: () => {
          const index = shiftCurId ? id2Index(shiftCurId) : id2Index(shiftActiveId);
          const direction = index > id2Index(shiftActiveId);
          listScrollToTop(index - 1);
          // 通过方向判断到底是添加还是取消项
          if (direction) {
            if (index != null && index >= 0) {
              const mailId = dataItem2keyMap.get(data[index]);
              // 取消已经选中的项目
              deleteActiveId(mailId);
              handleItenUnSelect([mailId], _activeIds.current, mailId);
              if (index - 1 >= 0) {
                setShiftCurId(dataItem2keyMap.get(data[index - 1]));
              } else {
                setShiftCurId(mailId);
              }
            }
          } else if (index != null && index - 1 >= 0) {
            let mailId = dataItem2keyMap.get(data[index - 1]);
            // 如果上一项已经被选中，则融合
            if (idIsActive(mailId) && index - 2 >= 0) {
              for (let i = index - 2; i >= 0; i--) {
                const _mailId = dataItem2keyMap.get(data[i]);
                if (!idIsActive(_mailId)) {
                  mailId = _mailId;
                  break;
                }
              }
            }
            addActiveId(mailId);
            handleItemSelect(mailId, _activeIds.current, mailId);
            setShiftCurId(mailId);
          }
          setListModel(LIST_MODEL.MULTIPLE);
        },
        handleKeyShiftDown: () => {
          const index = id2Index(shiftCurId);
          const direction = index >= id2Index(shiftActiveId);
          listScrollToBottom(index + 1);
          if (direction) {
            if (index != null && index + 1 < data.length) {
              const mailId = dataItem2keyMap.get(data[index + 1]);
              let nextMailId = null;
              // 如果next项已经被选中，则融合
              for (let i = index + 2; i < data.length; i++) {
                const _mailId = dataItem2keyMap.get(data[i]);
                if (_mailId && idIsActive(_mailId)) {
                  nextMailId = _mailId;
                  continue;
                }
                break;
              }
              addActiveId(mailId);
              handleItemSelect(mailId, _activeIds.current, mailId);
              setShiftCurId(nextMailId || mailId);
            }
          } else if (index != null && index <= data.length - 1) {
            const mailId = dataItem2keyMap.get(data[index]);
            // 取消已经选中的项目
            deleteActiveId(mailId);
            handleItenUnSelect([mailId], _activeIds.current, mailId);
            if (index + 1 <= data.length - 1) {
              setShiftCurId(dataItem2keyMap.get(data[index + 1]));
            } else {
              setShiftCurId(mailId);
            }
          }
          setListModel(LIST_MODEL.MULTIPLE);
        },
        handleKeyCommandA: () => {
          if (data && data.length) {
            const ids = data.map(item => dataItem2keyMap.get(item));
            addActiveId(ids);
            setShiftActiveId(ids[0]);
            handleItemSelect(ids, _activeIds.current, []);
            setShiftCurId(ids[ids.length - 1]);
            setListModel(LIST_MODEL.MULTIPLE);
          }
        },
        handleKeyDelete: () => {
          if (_activeIds && _activeIds.current && _activeIds.current.length) {
            const idList = _activeIds.current;
            handleItemDelete && handleItemDelete([...idList]);
          }
        },
      },
    };

    const handleItemSelected = (key, dataItem, index, event) => {
      // 对点击的组合键进行判断
      const { altKey, metaKey, ctrlKey, shiftKey } = event || {};
      const logicCtrlKey = metaKey || ctrlKey || altKey;
      if (logicCtrlKey) {
        handleComClick(event, index);
      } else if (shiftKey) {
        handleShiftClick(event, index);
      } else {
        handleClick(event, index);
      }
    };

    const handleItemChecked = (checked: boolean, key, dataItem, index, event) => {
      const mail = data[index];
      const fn = modelOperMap[refListModel.current].handleChecked;
      fn && fn(mail, checked, index);
    };

    const onItemContentMenuProxy = (key, mail, index, event) => {
      if (mail) {
        const id = dataItem2keyMap.get(mail);
        // 若果mail属于选中的ids，则批量操作
        if (idIsActive(id)) {
          const mailList = _activeIds.current.map(id => data[id2Index(id)]);
          handleItemonContextmenu(key, mailList, index, event);
          return;
        } else {
          // if (refListModel.current == LIST_MODEL.MULTIPLE) {
          //   // 如果是单个邮件 && 处于多选模式下，则退出
          //   setListModel(LIST_MODEL.SINGLE);
          //   clearActive();
          //   addActiveId(id);
          //   setShiftActiveId(id);
          //   handleItemSelect([id], _activeIds.current);
          //   handleItemActive(id);
          //   setShiftCurId(id);
          // } else {
          //   clearActive();
          //   addActiveId(id);
          //   handleItemSelect([id], _activeIds.current);
          //   setShiftCurId(id);
          //   setShiftActiveId(id);
          //   // 延迟激活方式卡顿
          //   setTimeout(() => {
          //     handleItemActive(id);
          //   }, 600);
          // }
          handleItemonContextmenu(key, mail, index, event);
        }
      }
    };

    const handleClick = (e, index) => {
      const mail = data[index];
      const fn = modelOperMap[refListModel.current].handleClick;
      fn && fn(mail, index);
    };

    // com|alt|ctrl + 单击
    const handleComClick = (e, index) => {
      if (hkDisabled) {
        return false;
      }
      const mail = data[index];
      const fn = modelOperMap[refListModel.current].handleComClick;
      fn && fn(mail, index);
    };

    // shift + 单击
    const handleShiftClick = (e, index) => {
      if (hkDisabled) {
        return false;
      }
      const mail = data[index];
      const fn = modelOperMap[refListModel.current].handleShiftClick;
      fn && fn(mail, index);
    };

    // 上键
    const handleKeyUp = e => {
      if (hkDisabled) {
        return false;
      }
      e.preventDefault();
      // 该模式下午上下键
      const fn = modelOperMap[refListModel.current].handleKeyUp;
      fn && fn();
    };
    // 下键
    const handleKeyDown = e => {
      if (hkDisabled) {
        return false;
      }
      e.preventDefault();

      const fn = modelOperMap[refListModel.current].handleKeyDown;
      fn && fn();
    };

    // shift+up
    const handleKeyShiftUp = e => {
      if (hkDisabled) {
        return false;
      }
      e.preventDefault();

      const fn = modelOperMap[refListModel.current].handleKeyShiftUp;
      fn && fn();
    };

    // shift+down
    const handleKeyShiftDown = e => {
      if (hkDisabled) {
        return false;
      }
      e.preventDefault();

      const fn = modelOperMap[refListModel.current].handleKeyShiftDown;
      fn && fn();
    };

    // Command + a
    const handleKeyCommandA = e => {
      if (hkDisabled) {
        return false;
      }
      e.preventDefault();

      const fn = modelOperMap[refListModel.current].handleKeyCommandA;
      !e.repeat && fn && fn();
    };

    // delete
    const handleKeyDelete = e => {
      if (hkDisabled) {
        return false;
      }
      e.preventDefault();

      const fn = modelOperMap[refListModel.current].handleKeyDelete;
      !e.repeat && fn && fn();
    };

    const handleKeyCommandR = e => {
      if (hkDisabled) {
        return false;
      }
      e.preventDefault();
      if (!e.repeat && onActiveInWindow) {
        onActiveInWindow(activeId);
      }
    };

    const handleKeyEnter = e => {
      if (hkDisabled) {
        return false;
      }
      e.preventDefault();
      if (!e.repeat && onActive) {
        if (activeId && activeId.length == 1) {
          handleItemActive(activeId[0]);
        }
      }
    };

    const throttleHandleKeyUp = useCreateCallbackForEvent(handleKeyUp);

    const throttleHandleKeyDown = useCreateCallbackForEvent(handleKeyDown);

    const throttleHandleKeyShiftUp = useCreateCallbackForEvent(handleKeyShiftUp);

    const throttleHandleKeyShiftDown = useCreateCallbackForEvent(handleKeyShiftDown);

    const refHandleKeyCommandA = useCreateCallbackForEvent(handleKeyCommandA);
    // useThrottleForEvent 会倒是事件异步调用，preventDefault无效
    const throttleHandleKeyDelete = useThrottleForEvent(handleKeyDelete, 800);
    const debouceHandleCommandR = useDebounceForEvent(handleKeyCommandR, 800);

    const throttleHandleEnter = useCreateCallbackForEvent(handleKeyEnter);

    const listHotKeyHandler = {
      [ListHotKey.KEY_UP]: throttleHandleKeyUp,
      [ListHotKey.KEY_DOWN]: throttleHandleKeyDown,
      [ListHotKey.SHIFT_KEY_UP]: throttleHandleKeyShiftUp,
      [ListHotKey.SHIFT_KEY_DOWN]: throttleHandleKeyShiftDown,
      [ListHotKey.COMMAND_A]: refHandleKeyCommandA,
      [ListHotKey.KEY_DELETE]: throttleHandleKeyDelete,
      [ListHotKey.COMMAND_R]: debouceHandleCommandR,
      [ListHotKey.ENTER]: throttleHandleEnter,
    };

    /*
     * effect
     */

    // 在列表有数据的时候初始化shift键的开始位置
    useEffect(() => {
      if (data && data.length && ((activeId && activeId.length === 0) || !shiftCurId || !shiftActiveId)) {
        const id = getUniqKey(0, data[0]);
        setShiftActiveId(id);
        setShiftCurId(id);
      }
    }, [data]);

    // 每当邮件列表改变的时候存储id->index 的映射
    // 计算邮件高度的递增和
    useEffect(() => {
      /**
       * todo: 数据源变化的时候，保持选中和内部状态的同步
       */
      // const curDataSize = mailId2ListIndexMap.size;
      // if (curDataSize !== data.length ) {
      // 判断当前选中的id是否还都在列表中，如果有不在的，去掉activeid
      // 同步外部，active的变化
      // 该逻辑职责应该在外部实现，快捷键本身不应该触发该事件
      // const idList: string[] = [];
      // data.forEach((item, index) => {
      //   const id = getUniqKey(index, item);
      //   if (idIsActive(id)) {
      //     idList.push(id)
      //   }
      // })
      // if (idList.length !== activeId.length) {
      //   handleItemSelect(idList, idList, [])
      // }
      // }
      /**
       * 重新生成缓存数据
       */
      mailId2ListIndexMap.clear();
      dataItem2keyMap.clear();
      data.forEach((item, index) => {
        const id = getUniqKey(index, item);
        mailId2ListIndexMap.set(id, index);
        dataItem2keyMap.set(item, id);
      });
      setId2IndexMap(mailId2ListIndexMap);
      setDateItem2keyMap(dataItem2keyMap);
    }, [data]);

    // 抛出输入模式
    // useEffect(() => {
    //   onListModelChange && onListModelChange(listModel);
    // }, [listModel]);

    // 转换list的ref
    useImperativeHandle(
      ref,
      () => {
        return listRef.current;
      },
      [listRef]
    );

    const HotKeyEventOrigin = CustomEventOrign || HotKeys;

    return (
      <HotKeyEventOrigin keyMap={keyMap} handlers={listHotKeyHandler}>
        <ListCom
          ref={listRef}
          {...props}
          onSelect={handleItemSelected}
          onContextMenu={onItemContentMenuProxy}
          onChecked={handleItemChecked}
          // onCreated={handleListCreated}
          selectIsCapture={true}
        />
      </HotKeyEventOrigin>
    );
  });
export default HotKey;
