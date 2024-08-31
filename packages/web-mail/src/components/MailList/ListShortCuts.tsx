/*
 * 邮件列表的快捷键操作
 * 所有标志全部存储邮件id，因为邮件列表属于随时变动的列表，index会偏移
 * 列表操作的转移图 参考： https://www.processon.com/diagraming/610270d5e401fd7e998580d8
 * 快捷键设计方案：参考 企业空间-技术文档-邮件-快捷键设计
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { KeyMap } from '../../common/library/HotKeys/react-hotkeys';
import { getMailListRowHeight } from '../../util';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
enum LIST_MODEL {
  INIT = 'INIT',
  SINGLE = 'SINGLE',
  MULTIPLE = 'MULTIPE',
}
enum ListHotKey {
  KEY_UP,
  KEY_DELETE,
  KEY_DOWN,
  SHIFT_KEY_UP,
  SHIFT_KEY_DOWN,
  COMMAND_A,
}

const keyMap: KeyMap = {
  [ListHotKey.KEY_UP]: 'up',
  [ListHotKey.KEY_DELETE]: ['ctrl+d'],
  [ListHotKey.KEY_DOWN]: 'down',
  [ListHotKey.SHIFT_KEY_UP]: 'shift+up',
  [ListHotKey.SHIFT_KEY_DOWN]: 'shift+down',
  [ListHotKey.COMMAND_A]: ['command+a', 'control+a', 'ctrl+a'],
};

const ListShortCuts: React.FC<any> = props => {
  const {
    ListElement,
    mailDataList,
    onItemSelected,
    onItemUnSelected,
    onItemActive,
    onItemContextmenu,
    onListModelChange,
    onItemDelete,
    activeIds,
    onCreated,
    scrollTop,
    onScroll,
    listHeight,
  } = props;

  // 列表的模式  初始态 单选态  多选态
  const [listModel, _setListModel] = useState(LIST_MODEL.INIT);
  // 列表模式的引用，与listModel同步变化
  const refListModel = useRef(LIST_MODEL.INIT);
  // shift组选键的开始位置邮件id 默认初始化为第一个
  const [shiftActiveId, setShiftActiveId] = useState(null);
  // shift组选键 操作 游标- 邮件id
  const [shiftCurId, setShiftCurId] = useState(null);
  // 选中的ids
  // const [activeIds, setActiveIds] = useState<string[]>([])
  const _activeIds = useRef<any[]>([]);

  // mailid 到 index 的快速转换
  const [mailId2ListIndexMap, setId2IndexMap] = useState(new Map());
  // 激活id的map  用于快速查看id是否处于激活
  // const [activeIdsMap, setActiveIdsMap] = useState(new Map())
  const activeIdsMap = useRef<any>(new Map());
  // 子组件方法-滚动显示指定的项
  const listScrollFnRef = useRef(index => {});
  /**
   * 存储列表项，递增高度的和
   * key：邮件的index
   * value：从第一封邮件到当前邮件的前一份邮件所有高度之和，包括两封邮件直接的边距
   */
  const [preMailSumHeightMap, setPreMailSumHeight] = useState(new Map());

  useEffect(() => {
    if (activeIds != null && Array.isArray(activeIds)) {
      // 判断activeIds是否严格一致,不严格一致才进行同步
      if (!(activeIds.length === _activeIds.current.length && activeIds.every(id => idIsActive(id)))) {
        // 根据activeIds的内容，有很多状态
        // 如果为空，则整体重置
        if (activeIds.length === 0) {
          reset();
          onListModelChange && onListModelChange(LIST_MODEL.INIT);
        } else {
          /*
           *  先实行简单策略- 仅保证功能流程的正常执行
           *  如果需要更好的体验，则需要更精细的融合策略
           */
          if (id2Index(shiftActiveId) == null || id2Index(shiftCurId) == null) {
            // 如果初始节点邮件消失,则简单设置为第一个选中的邮件id
            setShiftActiveId(activeIds[0]);
            setShiftCurId(activeIds[0]);
          }
        }

        // 其他情况应该会很少遇到，等遇到的时候再处理
        // 如果不为空，但不一致，说明想主动改变，则根据数量进行区分
        // 如果数量大于一，多选，重建对应的状态，map，对焦点进行妥善的处理
        // 如果等于已，单选，焦点问题就很好处理了
      }
    }
  }, [activeIds]);

  /*
   * 辅助函数
   */

  /**
   *  模式设置proxy
   *  解决listModel 在快速操作下可能出现的不同步，造成凭空多选的错误状态
   */
  const setListModel = model => {
    refListModel.current = model;
    _setListModel(model);
  };

  // id到列表index转换
  const id2Index = id => mailId2ListIndexMap.get(id);

  // 判断id是否激活
  const idIsActive = id => {
    if (_activeIds.current && _activeIds.current.length) {
      return !!activeIdsMap.current.get(id);
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
    if (mailDataList && mailDataList.length) {
      const id = mailDataList[0]?.entry?.id;
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
  const checkOverTop = (index: number): boolean => preMailSumHeightMap.get(index) < scrollTop;

  // 检测邮件是否超出列表视窗下边界
  const checkOverBottom = (index: number): boolean => preMailSumHeightMap.get(index) + getMailListRowHeight(mailDataList[index]) > scrollTop + listHeight;

  // 定位邮件到列表顶部
  const listScrollToTop = (index: number) => {
    if (checkOverBottom(index)) {
      listScrollToBottom(index);
      return;
    }
    if (checkOverTop(index)) {
      const st = preMailSumHeightMap.get(index) || 0;
      onScroll &&
        onScroll({
          scrollTop: st,
        });
    }
  };

  // 定位邮件到列表底部
  const listScrollToBottom = (index: number) => {
    // 如果是超出列表窗口上边界
    if (checkOverTop(index)) {
      listScrollToTop(index);
      return;
    }
    if (checkOverBottom(index)) {
      const st = preMailSumHeightMap.get(index) - listHeight + getMailListRowHeight(mailDataList[index]) + 24;
      onScroll &&
        onScroll({
          scrollTop: st,
        });
    }
  };

  /*
   *  事件
   */

  const handleItemSelect = (ids: string[], _activeIds) => {
    onItemSelected && onItemSelected(ids, _activeIds);
  };

  const handleItenUnSelect = (ids: string[], _activeIds) => {
    onItemUnSelected && onItemUnSelected(ids, _activeIds);
  };

  const handleItemonContextmenu = mailList => {
    onItemContextmenu && onItemContextmenu(mailList);
  };

  const handleItemActive = id => {
    const index = id2Index(id);
    onItemActive && onItemActive(id, index, _activeIds.current);
  };

  const handleItemDelete = ids => {
    onItemDelete && onItemDelete(ids);
  };

  // const debouceHandleItemActive = handleItemActive;
  // useCallback(debounce(handleItemActive, 700), [handleItemActive]);

  // const handleListModelChange = mailList => {
  //   onListModelChange && onListModelChange(refListModel.current);
  // };

  // 监听list的created以获取某些功能
  const handleListCreated = fnMap => {
    const { scrollTo = index => {} } = fnMap;
    listScrollFnRef.current = scrollTo;
    onCreated && onCreated(fnMap);
  };

  const modelOperMap = {
    [LIST_MODEL.INIT]: {
      handleClick: mail => {
        const { id } = mail.entry;
        setListModel(LIST_MODEL.SINGLE);
        addSingleActiveId(id);
        setShiftActiveId(id);
        handleItemSelect([id], _activeIds.current);
        handleItemActive(id);
        setShiftCurId(id);
      },
      handleShiftClick: mail => {
        const curIndex = id2Index(mail.entry.id);
        if (curIndex > 0) {
          setListModel(LIST_MODEL.MULTIPLE);
        } else {
          setListModel(LIST_MODEL.SINGLE);
          handleItemActive(mail.entry.id);
        }
        const ids: string[] = [];
        if (mailDataList && mailDataList.length) {
          for (let i = 0; i <= curIndex; i++) {
            const mail = mailDataList[i];
            ids.push(mail.entry.id);
          }
        }
        addActiveId(ids);
        handleItemSelect(ids, _activeIds.current);
        setShiftCurId(mail.entry.id);
      },
      handleComClick: mail => {
        const { id } = mail.entry;
        setListModel(LIST_MODEL.SINGLE);
        handleItemActive(id);
        addActiveId(id);
        setShiftActiveId(id);
        handleItemSelect([id], _activeIds.current);
      },
      handleKeyUp: () => {
        // 上键无意义
      },
      handleKeyDown: () => {
        if (mailDataList && mailDataList.length) {
          const { id } = mailDataList[0].entry;
          setListModel(LIST_MODEL.SINGLE);
          clearActive();
          addActiveId(id);
          setShiftActiveId(id);
          handleItemSelect([id], _activeIds.current);
          handleItemActive(id);
          setShiftCurId(id);
        }
      },
      handleKeyShiftUp: () => {
        // 无意义
      },
      handleKeyShiftDown: () => {
        setListModel(LIST_MODEL.SINGLE);
        const curIndex = 0;
        if (mailDataList && mailDataList.length) {
          const id = mailDataList[curIndex]?.entry?.id;
          addActiveId(id);
          handleItemActive(id);
          handleItemSelect(id, _activeIds.current);
          setShiftCurId(id);
        }
      },
      handleKeyCommandA: () => {
        if (mailDataList && mailDataList.length) {
          const ids = mailDataList.map(item => item.entry.id);
          setListModel(LIST_MODEL.MULTIPLE);
          addActiveId(ids);
          setShiftActiveId(ids[0]);
          handleItemSelect(ids, _activeIds.current);
          setShiftCurId(ids[ids.length - 1]);
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
      handleClick: mail => {
        const { id } = mail.entry;
        setListModel(LIST_MODEL.SINGLE);
        clearActive();
        addSingleActiveId(id);
        setShiftActiveId(id);
        handleItemSelect([id], _activeIds.current);
        handleItemActive(id);
        setShiftCurId(id);
      },
      handleShiftClick: mail => {
        setListModel(LIST_MODEL.MULTIPLE);
        const curIndex = id2Index(mail.entry.id);
        const startIndex = id2Index(shiftActiveId);
        const ids: string[] = [];
        const start = startIndex < curIndex ? startIndex : curIndex;
        const end = curIndex > startIndex ? curIndex : startIndex;
        // 范围选中
        if (mailDataList && mailDataList.length) {
          for (let i = start; i <= end; i++) {
            const mail = mailDataList[i];
            ids.push(mail.entry.id);
          }
        }
        addActiveId(ids);
        handleItemSelect(ids, _activeIds.current);
        setShiftCurId(mail.entry.id);
      },
      handleComClick: mail => {
        const { id } = mail.entry;
        if (idIsActive(id)) {
          if (mailDataList.length > 1 && _activeIds.current.length > 1) {
            setListModel(LIST_MODEL.MULTIPLE);
            deleteActiveId(id);
            setShiftActiveId(id);
            handleItenUnSelect([id], _activeIds.current);
          }
        } else {
          setListModel(LIST_MODEL.MULTIPLE);
          addActiveId(id);
          setShiftActiveId(id);
          handleItemSelect([id], _activeIds.current);
        }
        setShiftCurId(id);
      },
      handleKeyUp: () => {
        if (shiftActiveId) {
          const index = id2Index(shiftActiveId);
          if (index >= 1) {
            const mail = mailDataList[index - 1];
            const { id } = mail.entry;
            clearActive();
            setListModel(LIST_MODEL.SINGLE);
            setActiveIds([id]);
            setShiftActiveId(id);
            handleItemSelect([id], _activeIds.current);
            setShiftCurId(id);
            handleItemActive(id);
            listScrollToTop(index - 1);
          }
        }
      },
      handleKeyDown: () => {
        if (shiftActiveId) {
          const index = id2Index(shiftActiveId);
          if (index < mailDataList.length - 1) {
            const mail = mailDataList[index + 1];
            const id = mail?.entry?.id;
            if (mail && id) {
              clearActive();
              setListModel(LIST_MODEL.SINGLE);
              setActiveIds([id]);
              setShiftActiveId(id);
              handleItemSelect([id], _activeIds.current);
              handleItemActive(id);
              setShiftCurId(id);
              listScrollToBottom(index + 1);
            }
          }
        }
      },
      handleKeyShiftUp: () => {
        const index = id2Index(shiftActiveId);
        if (index != null && index - 1 > 0) {
          setListModel(LIST_MODEL.MULTIPLE);
          const mailId = mailDataList[index - 1]?.entry?.id;
          addActiveId(mailId);
          handleItemSelect(mailId, _activeIds.current);
          setShiftCurId(mailId);
          listScrollToTop(index - 1);
        }
      },
      handleKeyShiftDown: () => {
        const index = id2Index(shiftActiveId);
        if (index != null && index + 1 < mailDataList.length - 1) {
          setListModel(LIST_MODEL.MULTIPLE);
          const mailId = mailDataList[index + 1]?.entry?.id;
          addActiveId(mailId);
          handleItemSelect(mailId, _activeIds.current);
          setShiftCurId(mailId);
          listScrollToBottom(index + 1);
        }
      },
      handleKeyCommandA: () => {
        if (mailDataList && mailDataList.length) {
          const ids = mailDataList.map(item => item.entry.id);
          setListModel(LIST_MODEL.MULTIPLE);
          addActiveId(ids);
          setShiftActiveId(ids[0]);
          handleItemSelect(ids, _activeIds.current);
          setShiftCurId(ids[ids.length - 1]);
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
      handleClick: mail => {
        const { id } = mail.entry;
        setListModel(LIST_MODEL.SINGLE);
        clearActive();
        addActiveId(id);
        setShiftActiveId(id);
        handleItemSelect([id], _activeIds.current);
        handleItemActive(id);
        setShiftCurId(id);
      },
      handleShiftClick: mail => {
        setListModel(LIST_MODEL.MULTIPLE);
        let curIndex = id2Index(shiftCurId);
        const startIndex = id2Index(shiftActiveId);
        let direction = curIndex >= startIndex;
        let start = direction ? startIndex : curIndex;
        let end = direction ? curIndex : startIndex;
        const activeIdList: string[] = [];
        let _shiftCurId = mail.entry.id;
        // 取消激活状态的idlist
        const unActiveList: string[] = [];

        // shift的选中与取消机制
        if (shiftCurId) {
          for (let i = start; i <= end; i++) {
            const mail = mailDataList[i];
            unActiveList.push(mail.entry.id);
          }
        }
        curIndex = id2Index(mail.entry.id);
        direction = curIndex >= startIndex;
        start = startIndex < curIndex ? startIndex : curIndex;
        end = curIndex > startIndex ? curIndex : startIndex;
        // 范围选中
        if (mailDataList && mailDataList.length) {
          for (let i = start; i <= end; i++) {
            const mail = mailDataList[i];
            activeIdList.push(mail.entry.id);
          }
        }

        // 接壤的游标扩散
        if (direction) {
          if (curIndex + 1 < mailDataList.length && idIsActive(mailDataList[curIndex + 1]?.entry?.id)) {
            for (let i = curIndex + 1; i < mailDataList.length; i++) {
              const id = mailDataList[i]?.entry?.id;
              if (idIsActive(id)) {
                _shiftCurId = id;
                continue;
              }
              break;
            }
          }
        } else if (curIndex - 1 < mailDataList.length && idIsActive(mailDataList[curIndex - 1]?.entry?.id)) {
          for (let i = curIndex - 1; i >= 0; i--) {
            const id = mailDataList[i]?.entry?.id;
            if (idIsActive(id)) {
              _shiftCurId = id;
              continue;
            }
            break;
          }
        }

        // 叠压的联动取消
        if (idIsActive(mail.entry.id)) {
          if (direction) {
            if (curIndex + 1 < mailDataList.length && idIsActive(mailDataList[curIndex + 1]?.entry?.id)) {
              for (let i = curIndex + 1; i < mailDataList.length; i++) {
                const id = mailDataList[i]?.entry?.id;
                if (idIsActive(id)) {
                  unActiveList.push(id);
                  continue;
                }
                break;
              }
            }
          } else if (curIndex - 1 >= 0 && idIsActive(mailDataList[curIndex - 1]?.entry?.id)) {
            for (let i = curIndex - 1; i >= 0; i--) {
              const id = mailDataList[i]?.entry?.id;
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
        handleItemSelect(activeIdList, _activeIds.current);
        setShiftCurId(_shiftCurId);
      },
      handleComClick: mail => {
        const { id } = mail.entry;
        // 已经激活的的则取消
        if (idIsActive(id)) {
          if (mailDataList.length > 1 && _activeIds.current.length > 1) {
            setListModel(LIST_MODEL.MULTIPLE);
            deleteActiveId(id);
            // setShiftActiveId(id);
            // setShiftCurId(id);
            handleItenUnSelect([id], _activeIds.current);
            // 边界条件- 当一个选中区域全部被command+单击取消后，shiftActiveId焦点悬空，需要按照规则进行排布
            // 规则：首先由当前选重点向下查找，找到第一个激活的邮件id作为shiftActiveId
            // 如果下方没有激活  则向上查找，
            // 如果都没有，则shiftActiveId 为初始值
            const index = id2Index(id);
            const top = index - 1 >= 0 ? index - 1 : 0;
            const bottom = index + 1 <= mailDataList.length - 1 ? index + 1 : mailDataList.length - 1;
            if (!idIsActive(id2Index(top)) && !idIsActive(id2Index(bottom))) {
              if (_activeIds.current.length == 0) {
                setShiftActiveId(mailDataList[0].entry.id);
                setShiftCurId(mailDataList[0].entry.id);
                return;
              }
              // 向下查找
              for (let i = index; i < mailDataList.length; i++) {
                const _id = mailDataList[i].entry.id;
                if (idIsActive(_id)) {
                  setShiftActiveId(_id);
                  // 继续查找边界,设置shiftcur游标
                  for (let n = i; n < mailDataList.length; n++) {
                    const _id = mailDataList[n].entry.id;
                    if (!idIsActive(_id)) {
                      if (n - 1 >= 0) {
                        setShiftCurId(mailDataList[n - 1].entry.id);
                      }
                      return;
                    }
                  }
                  return;
                }
              }
              // 向上查找
              for (let i = index; i >= 0; i--) {
                const _id = mailDataList[i].entry.id;
                if (idIsActive(_id)) {
                  setShiftActiveId(_id);
                  // 继续查找边界,设置shiftcur游标
                  for (let n = i; n >= 0; n--) {
                    const _id = mailDataList[n].entry.id;
                    if (!idIsActive(_id)) {
                      if (n + 1 < mailDataList.length) {
                        setShiftCurId(mailDataList[n + 1].entry.id);
                      }
                      return;
                    }
                  }
                  return;
                }
              }
            }
          }
        } else {
          setListModel(LIST_MODEL.MULTIPLE);
          addActiveId(id);
          setShiftActiveId(id);
          setShiftCurId(id);
          handleItemSelect([id], _activeIds.current);
        }
      },
      handleKeyUp: () => {
        if (shiftActiveId) {
          const index = id2Index(shiftActiveId);
          if (index > 1) {
            const mail = mailDataList[index - 1];
            const { id } = mail.entry;
            clearActive();
            setListModel(LIST_MODEL.SINGLE);
            setActiveIds([id]);
            setShiftActiveId(id);
            handleItemSelect([id], _activeIds.current);
            setShiftCurId(id);
            handleItemActive(id);
            listScrollToTop(index - 1);
          }
        }
      },
      handleKeyDown: () => {
        if (shiftActiveId) {
          const index = id2Index(shiftActiveId);
          if (index < mailDataList.length - 1) {
            const mail = mailDataList[index + 1];
            const id = mail?.entry?.id;
            if (mail && id) {
              clearActive();
              setListModel(LIST_MODEL.SINGLE);
              setActiveIds([id]);
              setShiftActiveId(id);
              handleItemSelect([id], _activeIds.current);
              setShiftCurId(id);
              handleItemActive(id);
              listScrollToBottom(index + 1);
            }
          }
        }
      },
      handleKeyShiftUp: () => {
        const index = shiftCurId ? id2Index(shiftCurId) : id2Index(shiftActiveId);
        const direction = index > id2Index(shiftActiveId);
        listScrollToTop(index - 1);
        setListModel(LIST_MODEL.MULTIPLE);
        // 通过方向判断到底是添加还是取消项
        if (direction) {
          if (index != null && index >= 0) {
            const mailId = mailDataList[index]?.entry?.id;
            // 取消已经选中的项目
            deleteActiveId(mailId);
            handleItenUnSelect([mailId], _activeIds.current);
            if (index - 1 >= 0) {
              setShiftCurId(mailDataList[index - 1]?.entry?.id);
            } else {
              setShiftCurId(mailId);
            }
          }
        } else if (index != null && index - 1 >= 0) {
          let mailId = mailDataList[index - 1]?.entry?.id;
          // 如果上一项已经被选中，则融合
          if (idIsActive(mailId) && index - 2 >= 0) {
            for (let i = index - 2; i >= 0; i--) {
              const _mailId = mailDataList[i].entry.id;
              if (!idIsActive(_mailId)) {
                mailId = _mailId;
                break;
              }
            }
          }
          addActiveId(mailId);
          handleItemSelect(mailId, _activeIds.current);
          setShiftCurId(mailId);
        }
      },
      handleKeyShiftDown: () => {
        const index = id2Index(shiftCurId);
        const direction = index >= id2Index(shiftActiveId);
        listScrollToBottom(index + 1);
        setListModel(LIST_MODEL.MULTIPLE);
        if (direction) {
          if (index != null && index + 1 < mailDataList.length) {
            const mailId = mailDataList[index + 1]?.entry?.id;
            let nextMailId = null;
            // 如果next项已经被选中，则融合
            for (let i = index + 2; i < mailDataList.length; i++) {
              const _mailId = mailDataList[i]?.entry?.id;
              if (_mailId && idIsActive(_mailId)) {
                nextMailId = _mailId;
                continue;
              }
              break;
            }
            addActiveId(mailId);
            handleItemSelect(mailId, _activeIds.current);
            setShiftCurId(nextMailId || mailId);
          }
        } else if (index != null && index <= mailDataList.length - 1) {
          const mailId = mailDataList[index]?.entry?.id;
          // 取消已经选中的项目
          deleteActiveId(mailId);
          handleItenUnSelect([mailId], _activeIds.current);
          if (index + 1 <= mailDataList.length - 1) {
            setShiftCurId(mailDataList[index + 1]?.entry?.id);
          } else {
            setShiftCurId(mailId);
          }
        }
      },
      handleKeyCommandA: () => {
        if (mailDataList && mailDataList.length) {
          const ids = mailDataList.map(item => item.entry.id);
          setListModel(LIST_MODEL.MULTIPLE);
          addActiveId(ids);
          setShiftActiveId(ids[0]);
          handleItemSelect(ids, _activeIds.current);
          setShiftCurId(ids[ids.length - 1]);
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

  const handleItemSelected = (index, event) => {
    // 对点击的组合键进行判断

    const { altKey, metaKey, ctrlKey, shiftKey } = event;
    const logicCtrlKey = metaKey || ctrlKey || altKey;
    if (logicCtrlKey) {
      handleComClick(event, index);
    } else if (shiftKey) {
      handleShiftClick(event, index);
    } else {
      handleClick(event, index);
    }
  };

  const onItemContentMenuProxy = (mail, index) => {
    if (mail) {
      const { id } = mail.entry;
      // 若果mail属于选中的ids，则批量操作
      if (idIsActive(id)) {
        const mailList = _activeIds.current.map(id => mailDataList[id2Index(id)]);
        handleItemonContextmenu(mailList);
      } else {
        if (refListModel.current == LIST_MODEL.MULTIPLE) {
          // 如果是单个邮件 && 处于多选模式下，则退出
          setListModel(LIST_MODEL.SINGLE);
          clearActive();
          addActiveId(id);
          setShiftActiveId(id);
          handleItemSelect([id], _activeIds.current);
          handleItemActive(id);
          setShiftCurId(id);
        } else {
          clearActive();
          addActiveId(id);
          handleItemSelect([id], _activeIds.current);
          setShiftCurId(id);
          setShiftActiveId(id);
          // 延迟激活方式卡顿
          setTimeout(() => {
            handleItemActive(id);
          }, 600);
        }
        handleItemonContextmenu(mailDataList[id2Index(id)]);
      }
    }
  };

  const handleClick = (e, index) => {
    const mail = mailDataList[index];
    const fn = modelOperMap[refListModel.current].handleClick;
    fn && fn(mail);
  };

  // com|alt|ctrl + 单击
  const handleComClick = (e, index) => {
    const mail = mailDataList[index];
    const fn = modelOperMap[refListModel.current].handleComClick;
    fn && fn(mail);
  };

  // shift + 单击
  const handleShiftClick = (e, index) => {
    const mail = mailDataList[index];
    const fn = modelOperMap[refListModel.current].handleShiftClick;
    fn && fn(mail);
  };

  // 上键
  const handleKeyUp = e => {
    e.preventDefault();

    const fn = modelOperMap[refListModel.current].handleKeyUp;
    fn && fn();
  };
  // 下键
  const handleKeyDown = e => {
    e.preventDefault();

    const fn = modelOperMap[refListModel.current].handleKeyDown;
    fn && fn();
  };

  // shift+up
  const handleKeyShiftUp = e => {
    e.preventDefault();

    const fn = modelOperMap[refListModel.current].handleKeyShiftUp;
    fn && fn();
  };

  // shift+down
  const handleKeyShiftDown = e => {
    e.preventDefault();

    const fn = modelOperMap[refListModel.current].handleKeyShiftDown;
    fn && fn();
  };

  // Command + a
  const handleKeyCommandA = e => {
    e.preventDefault();

    const fn = modelOperMap[refListModel.current].handleKeyCommandA;
    fn && fn();
  };

  // delete
  const handleKeyDelete = e => {
    e.preventDefault();

    // 先注释掉，1.80
    // const fn = modelOperMap[refListModel.current].handleKeyDelete;
    // fn && fn();
  };

  const listHotKeyHandler = {
    [ListHotKey.KEY_UP]: handleKeyUp,
    [ListHotKey.KEY_DOWN]: handleKeyDown,
    [ListHotKey.SHIFT_KEY_UP]: handleKeyShiftUp,
    [ListHotKey.SHIFT_KEY_DOWN]: handleKeyShiftDown,
    [ListHotKey.COMMAND_A]: handleKeyCommandA,
    [ListHotKey.KEY_DELETE]: handleKeyDelete,
  };

  useMsgRenderCallback('mailListKeyBoard', event => {
    const { eventStrData, eventData } = event;
    if (listHotKeyHandler[eventStrData]) {
      listHotKeyHandler[eventStrData](eventData);
    }
  });

  /*
   * effect
   */

  // 在列表有数据的时候初始化shift键的开始位置
  useEffect(() => {
    if (mailDataList && mailDataList.length && ((activeIds && activeIds.length === 0) || !shiftCurId || !shiftActiveId)) {
      const id = mailDataList[0]?.entry?.id;
      setShiftActiveId(id);
      setShiftCurId(id);
    }
  }, [mailDataList]);

  // 存储Id
  // useEffect(() => {
  //   activeIdsMap.clear()
  //   if (activeIds && activeIds.length) {
  //     activeIds.forEach(item => {
  //       activeIdsMap.set(item, true)
  //     })
  //   }
  //   setActiveIdsMap(activeIdsMap)
  // }, [activeIds])

  // 每当邮件列表改变的时候存储id->index 的映射
  // 计算邮件高度的递增和
  useEffect(() => {
    mailId2ListIndexMap.clear();
    preMailSumHeightMap.clear();
    let preHeight = 0;
    mailDataList.forEach((item, index) => {
      mailId2ListIndexMap.set(item.entry.id, index);
      preMailSumHeightMap.set(index, preHeight);
      preHeight += getMailListRowHeight(item);
    });
    setId2IndexMap(mailId2ListIndexMap);
    setPreMailSumHeight(preMailSumHeightMap);
  }, [mailDataList]);

  // 抛出输入模式
  useEffect(() => {
    onListModelChange && onListModelChange(listModel);
  }, [listModel]);

  return (
    <div>
      {/* <HotKeys keyMap={keyMap} handlers={listHotKeyHandler} > */}
      <ListElement
        activeIds={_activeIds.current}
        {...props}
        onItemSelected={handleItemSelected}
        onItemContextmenu={onItemContentMenuProxy}
        onCreated={handleListCreated}
        _activeIdsMap={activeIdsMap.current}
        _mailId2ListIndexMap={mailId2ListIndexMap}
      />
      {/* </HotKeys> */}
    </div>
  );
};

export default ListShortCuts;
