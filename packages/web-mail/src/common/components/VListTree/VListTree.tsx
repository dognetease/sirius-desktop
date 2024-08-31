import React, { useState, useEffect, useMemo, MouseEvent, CSSProperties, ReactNode, useCallback, useRef } from 'react';
import CardList from '../vlist/CardList/CardList';
import { TreeDataNode } from 'antd';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import { treeDFS } from '../../../util';
import { stringMap, CardGroupDecorateRender } from '../../../types';
import VListTreeCard from './VListTreeCard';
import useThrottleForEvent from '../../../hooks/useThrottleForEvent';
import useDebounceForEvent from '../../../hooks/useDebounceForEvent';
import useStateRef from './useStateRef';

interface VlistTreeProps {
  /**
   * 默认展开所有 - 未实现
   */
  defaultExpandAll?: boolean;
  /**
   * 默认展开的key - 未实现
   */
  defaultExpandedKeys?: string[];
  /**
   * realSize
   * 当元素充不满一屏的时候，是否使用真是高度
   */
  realSize?: boolean;
  /**
   * 固定高度，不传则自动测量，占满父元素高度
   */
  height?: number;
  /**
   * 固定宽度，不传则自动测量
   */
  width?: number;
  /**
   * 节点自定义图标 - 未实现
   */
  icon?: ReactNode | (() => ReactNode);
  /**
   *  添加在 Tree 最外层的 className
   */
  rootClassName?: string;
  /**
   * 添加在 Tree 最外层的 style
   */
  rootStyle?: CSSProperties;
  /**
   * 受控）设置展开的树节点
   */
  expandedKeys?: string[];
  /**
   * treeNodes 数据，（key 在整个树范围内唯一）
   */
  treeData?: TreeDataNode[];
  /**
   * 距离顶部的高度 （受控）
   * todo: 存在防抖事件不一致导致的抖动
   */
  scrollTop?: number;
  /**
   * 是否还有更多
   */
  hasMore: boolean;
  /**
   * （受控）设置选中的树节点
   */
  selectedKeys: string[];
  /**
   * 展开/收起节点时触发
   */
  onExpand?: (expandedKeys: string[], config: { expanded: boolean; node: TreeDataNode }) => void;
  /**
   * 响应右键点击
   */
  onRightClick?: (config: { event: MouseEvent; node: TreeDataNode }) => void;
  /**
   * 点击树节点触发
   */
  onSelect?: (selectedKeys: string[], config: { selected: boolean; node: TreeDataNode; event: MouseEvent }) => void;
  /**
   * 滚动的时候触发
   */
  onScroll?: (scrollTop: number) => void;
  /**
   * 获取更多节点
   */
  onLoadMoreNode?: (start: number, nodeParent?: TreeDataNode | null) => Promise<boolean>;
  /**
   * 通用的title渲染函数
   */
  titleRender?: (data: TreeDataNode) => React.ReactElement | undefined;
  /**
   * 节点的异步加载
   */
  loadData?: (data: TreeDataNode) => Promise<boolean>;
  /**
   * 分割装饰
   */
  cardGroupDecorate?: CardGroupDecorateRender<TreeDataNode>[];
}

type booleanMap = { [key: string]: boolean };
const TreeCardHeight = 36;
const TreeCardMargin = 0;

/**
 * 根据st计算当期下边界处于哪个卡片上
 */

const getListIndexByStBottom = (st: number, listHeight: number = 0) => {
  let index = 0;
  try {
    index = Math.ceil((st + listHeight) / (TreeCardHeight + TreeCardMargin));
  } catch (e) {
    console.error('[Error:listHasMore]', e);
  }
  return index;
};

/**
 * 获取卡片高度
 */
const getCardHeight = () => {
  return TreeCardHeight;
};

const VListTree: React.FC<VlistTreeProps> = props => {
  const {
    onLoadMoreNode,
    width,
    height,
    treeData,
    icon,
    expandedKeys,
    onExpand,
    hasMore = false,
    scrollTop,
    rootClassName,
    rootStyle,
    selectedKeys,
    onRightClick,
    onSelect,
    titleRender,
    loadData,
    onScroll,
    cardGroupDecorate,
    realSize = false,
  } = props;
  /**
   * 内部状态
   */

  /**
   * 计算从treeData计算出来的中间数据
   */
  const treeDataSubState = useMemo<{
    key2NodeMap: { [key: string]: TreeDataNode };
    rootIdList: string[];
    key2ConfigMap: { [key: string]: { deep: number; parent: TreeDataNode | null } };
  }>(() => {
    const key2NodeMap: stringMap = {};
    const idList: string[] = [];
    const key2ConfigMap: stringMap = {};
    if (treeData && treeData.length) {
      treeDFS(treeData, (node: TreeDataNode, config) => {
        if (node) {
          let parent = null;
          if (config?.path && config?.path?.length > 1) {
            parent = config?.path[config?.path.length - 2];
          }
          key2NodeMap[node?.key] = node;
          key2ConfigMap[node?.key] = {
            deep: config?.deep,
            //计算并缓存parentNode
            parent,
          };
        }
      });
      treeData?.forEach(item => {
        idList.push(item?.key + '');
      });
    }
    return {
      rootIdList: idList,
      key2NodeMap: key2NodeMap,
      key2ConfigMap: key2ConfigMap,
    };
  }, [treeData]);

  /**
   * 节点key到node的map
   */
  const { key2NodeMap } = treeDataSubState;
  /**
   * 默认以及节点的idList
   */
  const { rootIdList } = treeDataSubState;

  /**
   * 缓存组件内部的节点配置信息
   */
  const { key2ConfigMap } = treeDataSubState;

  /**
   * 内部scrollTop缓存
   */
  const [_scrollTop, _setScrollTop] = useState(0);

  const _stRef = useStateRef(_scrollTop);
  /**
   * 内部的展开key
   */
  const [_expandedKeys, _setExpandedKeys] = useState<string[]>([]);
  /**
   * 节点的异步子节点加载状态： idMap
   */
  const [nodeLoadingStateMap, setNodeLoadingStateMap] = useState<{ [key: string]: boolean }>({});
  /**
   * 列表是否在加载中
   */
  const [listIsLoading, setListIsLoading] = useState<boolean>(false);

  const listIsLoadingRef = useRef<boolean>(listIsLoading);
  /**
   * 列表当前截取偏移index（从当前底边节点的父节点的最后一个子节点开始截取，以触发列表加载边界）
   */
  const [splitKey, setSplitKey] = useState<string | number | null>(null);
  /**
   * 是否使用自动测量
   */
  const autoSize = useMemo(() => {
    return width == null && height == null;
  }, [width, height]);

  /**
   * 是否开启节点异步加载
   */
  const asyncLoad = useMemo(() => {
    return !!loadData;
  }, [loadData]);
  /**
   * 记录内部节点的展开状态
   */
  const _nodeKeyExpandMap = useMemo(() => {
    const map: booleanMap = {};
    if (_expandedKeys) {
      // 生成节点展开map信息
      if (_expandedKeys && _expandedKeys.length) {
        _expandedKeys.forEach(item => {
          if (item != null) {
            map[item] = true;
          }
        });
      }
    }
    return map;
  }, [_expandedKeys]);

  /**
   * selectedKeys 生成key
   */
  const selectedKeysKey = useMemo(() => {
    return selectedKeys?.join(',');
  }, [selectedKeys]);

  /**
   * 选中的节点缓存map
   */
  const selectKeyMap = useMemo(() => {
    const map: booleanMap = {};
    if (selectedKeys && selectedKeys.length) {
      selectedKeys.forEach((item: string) => {
        map[item] = true;
      });
    }
    return map;
  }, [selectedKeysKey]);

  /**
   * 记录节点的展开状态
   */
  const nodeKeyExpandMap = useMemo(() => {
    const map: booleanMap = {};
    if (expandedKeys) {
      // 生成节点展开map信息
      expandedKeys.forEach(item => {
        if (item != null) {
          map[item] = true;
        }
      });
    }
    return map;
  }, [expandedKeys]);

  /**
   * 当前使用的nodekeyexpandMap
   */
  const curNodeKeyExpandMap = useMemo(() => {
    return expandedKeys ? nodeKeyExpandMap : _nodeKeyExpandMap;
  }, [expandedKeys, nodeKeyExpandMap, _nodeKeyExpandMap]);

  /**
   * 递归展开列表
   */
  const flatNodeList = useCallback(
    (key: string): string[] => {
      if (key && key2NodeMap[key]) {
        const node = key2NodeMap[key];
        if (node && node?.children && node?.children?.length) {
          const keyList = [];
          const children = node?.children;
          for (let i = 0; i < children.length; i++) {
            const nodeKey = children[i]?.key + '';
            keyList.push(nodeKey);
            if (curNodeKeyExpandMap[nodeKey]) {
              keyList.push(...flatNodeList(nodeKey));
            }
          }
          return keyList;
        }
      }
      return [];
    },
    [key2NodeMap, curNodeKeyExpandMap]
  );

  /**
   * 逻辑列表-根据展开项目，决定的需要展示的逻辑列表
   * 展开想项目中key2id的map
   */
  const [showKeyList, showKey2Index] = useMemo(() => {
    const list = [];
    const key2IndexMap: stringMap = {};
    for (let i = 0; i < rootIdList.length; i++) {
      const nodeKey = rootIdList[i];
      list.push(nodeKey);
      // 如果当前节点是展开的
      if (curNodeKeyExpandMap[nodeKey]) {
        list.push(...flatNodeList(nodeKey));
      }
    }
    if (list && list.length) {
      list.forEach((key, index) => (key2IndexMap[key] = index));
    }
    return [list, key2IndexMap];
  }, [rootIdList, flatNodeList, curNodeKeyExpandMap]);

  /**
   * 多级分页功能开启后-逻辑上的展示列表
   */
  const resKeyList = useMemo(() => {
    if (splitKey != null) {
      const splitIndex = showKey2Index[splitKey];
      if (splitIndex != null) {
        return showKeyList.slice(0, splitIndex + 1);
      }
    }
    return showKeyList;
  }, [showKeyList, splitKey, showKey2Index]);

  /**
   * 本地和props经过融合过后的st,以props为高优先级
   */
  const mgScrollTop = useMemo(() => {
    if (scrollTop != null) {
      return scrollTop;
    }
    return _scrollTop;
  }, [_scrollTop, scrollTop]);

  /**
   * 处理卡片折叠展开
   */

  const handleCardExpand = useCallback(
    (key: string, data: TreeDataNode, expanded: boolean) => {
      const logicExpandKeys = expandedKeys || _expandedKeys;
      let resKey: string[] = [];
      // 调用外部方法
      if (expanded) {
        resKey = [...(logicExpandKeys ? logicExpandKeys : []), key];
      } else {
        resKey = [...(logicExpandKeys ? logicExpandKeys.filter(item => item != key) : [])];
      }
      onExpand &&
        onExpand(resKey, {
          expanded,
          node: data,
        });
      // 如果外部没有传入expandedKeys, 同步使用内部_expandedKeys
      if (!expandedKeys) {
        _setExpandedKeys(resKey);
      }
    },
    [expandedKeys, _expandedKeys, onExpand]
  );

  /**
   * 处理卡片的右键事件
   */
  const handleCardRightClick = useCallback(
    (event: React.MouseEvent, data: TreeDataNode) => {
      onRightClick &&
        onRightClick({
          node: data,
          event,
        });
    },
    [onRightClick]
  );

  /**
   * 处理卡片的点击事件
   */
  const handleCardClick = useCallback(
    (key: string, event: React.MouseEvent, data: TreeDataNode) => {
      onSelect &&
        onSelect([key], {
          selected: true,
          node: data,
          event,
        });
    },
    [onSelect]
  );

  /**
   * 处理卡片的加载事件
   */
  const handleCardLoadChildren = useCallback(
    (node: TreeDataNode) => {
      // 设置节点加载状态
      const key = node?.key;
      setNodeLoadingStateMap(map => {
        return { ...map, [key + '']: true };
      });
      // 请求外部加载
      if (loadData) {
        const p = loadData(node);
        if (p?.then) {
          p.then(res => {
            // 展开节点, 如果处于分页加载中，屏蔽该操作，| 换key后不需要阻塞了
            // if (!listIsLoadingRef.current) {
            setNodeLoadingStateMap(map => {
              return {
                ...map,
                [key + '']: false,
              };
            });
            handleCardExpand(key + '', node, true);
            // }
          }).catch(() => {
            setNodeLoadingStateMap(map => {
              return {
                ...map,
                [key + '']: false,
              };
            });
          });
        } else {
          console.warn('[VlistTree]: loadData 方法必须返回Promise');
        }
      }
    },
    [loadData, handleCardExpand]
  );

  /**
   * 处理分页加载功能
   */
  const overPageCheck = useCallback(
    (st: number) => {
      // 根据当前st计算对应数据的index, 向上取整
      let index = getListIndexByStBottom(st, height);
      const curNodeKey = showKeyList[index];
      // 获取父节点
      const nodeConfig = key2ConfigMap[curNodeKey];
      const parentNode = nodeConfig?.parent;

      // 如果列表已经处于分页加载中，则不走后续流程
      if (listIsLoadingRef.current) {
        return false;
      }

      // 如果父节点-不存在更多子节点，则不走后续流程
      if (parentNode) {
        if (!parentNode?.hasMore) {
          return false;
        }
      } else if (!hasMore) {
        // 如果是一级节点
        return false;
      }

      //检测当前节点的分页状态，触发列表的分页
      if (parentNode) {
        // 如果是普通节点
        const children = parentNode.children;
        if (children && children.length) {
          // 获取当期那级节点的最后一个
          const aimNodeKey = children[children.length - 1]?.key;
          // 根据末尾节点的index，截取
          // let lastChildrenIndex = null;
          // for (let i = index; i < showKeyList.length; i++) {
          //   if (showKeyList[i] == aimNodeKey) {
          //     lastChildrenIndex = i;
          //     break;
          //   }
          // }
          // // 设置截取边界
          // setSplitOffset(lastChildrenIndex);
          setSplitKey(aimNodeKey);
        }
      } else {
        // 如果是根节点, 不需要截取
        setSplitKey(null);
      }
    },
    [showKeyList, key2ConfigMap, hasMore]
  );

  const throttleOverPageCheck = useThrottleForEvent(overPageCheck, 500);
  // const _throttleSetSt = useThrottleForEvent(_setScrollTop, 200);

  const debounceSetSt = useDebounceForEvent(({ scrollTop }) => _setScrollTop(scrollTop), 500);

  /**
   * 处理列表滑动事件
   */
  const handleScroll = useCallback(
    ({ scrollTop: st }) => {
      throttleOverPageCheck(st);
      onScroll && onScroll(st);
      debounceSetSt(st);
    },
    [onScroll]
  );

  /**
   * 获取Node展示卡片
   */
  const getVlistCard = useCallback(
    cardProps => {
      const { data: nodeKey } = cardProps;
      const node = key2NodeMap[nodeKey];
      const isLoading = !!nodeLoadingStateMap[nodeKey];
      const isLeaf = node?.isLeaf;
      const children = node?.children;
      let showExpand = !!children?.length;
      if (asyncLoad) {
        showExpand = !isLeaf;
      }
      return (
        <VListTreeCard
          data={node}
          icon={icon}
          showExpand={showExpand}
          deep={key2ConfigMap[nodeKey]?.deep}
          expand={!!curNodeKeyExpandMap[nodeKey]}
          isLoading={isLoading}
          onExpand={(expand: boolean) => {
            // 如果列表在分页加载中，屏蔽开合操作
            // if (!listIsLoadingRef.current) {
            if (asyncLoad && !children?.length && expand) {
              handleCardLoadChildren(node);
            } else {
              handleCardExpand(nodeKey, node, expand);
            }
            // }
          }}
          onRightClick={handleCardRightClick}
          onClick={(event: React.MouseEvent, data: TreeDataNode) => {
            handleCardClick(nodeKey, event, data);
          }}
          active={!!selectKeyMap[nodeKey]}
          titleRender={titleRender}
        ></VListTreeCard>
      );
    },
    [key2NodeMap, nodeLoadingStateMap, asyncLoad, key2ConfigMap, curNodeKeyExpandMap, icon, selectKeyMap]
  );

  /**
   *  邮件是否加载更多
   *
   */
  const listHasMore = useMemo(() => {
    const st = _stRef.current || 0;
    // 计算底边当前压在哪个卡片上
    let index = getListIndexByStBottom(st, height);
    const curNodeKey = showKeyList[index];
    // 获取父节点
    const nodeConfig = key2ConfigMap[curNodeKey];
    const parentNode = nodeConfig?.parent;
    if (parentNode) {
      return !!parentNode?.hasMore ? showKeyList?.length + 1 : 0;
    } else {
      return hasMore ? showKeyList?.length + 1 : 0;
    }
  }, [hasMore, showKeyList, key2ConfigMap]);

  /**
   * 获取当前处于列表加载线的元素父节点
   */
  const getParentNodeByStLine = useCallback(() => {
    try {
      const st = _stRef.current || 0;
      if (st != null) {
        // 计算底边当前压在哪个卡片上
        let index = getListIndexByStBottom(st, height);
        const curNodeKey = showKeyList[index];
        const nodeConfig = key2ConfigMap[curNodeKey];
        const parentNode = nodeConfig?.parent;
        return parentNode;
      }
    } catch (e) {
      console.error('[Error:getParentNodeByStLine]', e);
      return null;
    }
  }, [showKeyList]);

  /**
   * 处理列表的加载更多时间
   */
  const handleListLoadMore = useCallback(
    (start: number) => {
      // 标记列表加载状态
      setListIsLoading(true);
      listIsLoadingRef.current = true;
      if (onLoadMoreNode) {
        // 获取当前在st下的
        const pNode = getParentNodeByStLine() || null;
        return onLoadMoreNode(start, pNode)?.finally(() => {
          // 当前节点并未结束，切割点直接置空是否是不对的, 似乎也没有什么好办法，能直接拿到,数量或者便宜，这样会出现一次重新切割的抖动。
          // 现在看对性能的影响有限
          setSplitKey(null);
          setListIsLoading(false);
          listIsLoadingRef.current = false;
        });
      }
      return Promise.resolve();
    },
    [onLoadMoreNode, getParentNodeByStLine]
  );

  /**
   * 虚拟线性列表
   */
  const getVList = useCallback(
    (_width: number, _height: number) => {
      let logicHeight = _height;
      if (realSize && resKeyList) {
        const length = resKeyList?.length || 0;
        const realHeight = length * getCardHeight();
        if (realHeight < _height) {
          // 10px为便宜，这种计算比较粗略，没有考虑列表有装饰的高度
          logicHeight = realHeight + 10;
        }
      }
      return (
        <CardList<string>
          className={rootClassName}
          style={rootStyle}
          // 宽度自动测量
          width={_width}
          // 有外部传入高度，则使用外部高度
          height={logicHeight}
          initLoadMore={false}
          onLoadMore={handleListLoadMore}
          // 卡片高度
          rowHeight={getCardHeight}
          // 卡片数据
          data={resKeyList}
          // 卡片渲染函数
          card={getVlistCard}
          // 获取id的方法
          getUniqKey={(index, key) => key}
          // 节点总数
          total={listHasMore}
          scrollTop={mgScrollTop}
          onScroll={handleScroll}
          cardMargin={TreeCardMargin}
          cardGroupDecorate={cardGroupDecorate}
          noMoreRender={() => <></>}
        />
      );
    },
    [rootClassName, realSize, rootStyle, handleListLoadMore, getCardHeight, resKeyList, getVlistCard, listHasMore, handleScroll, mgScrollTop, cardGroupDecorate]
  );

  /**
   **************************************************** useEffect *********************************************
   */

  /**
   * 处理列表数据的变化，只做状态校对， 条件更新，只能在useEffect中实现了
   *
   */
  useEffect(() => {
    // 如果treeData为空，重置st
    if (treeData == null || treeData.length == 0) {
      _setScrollTop(0);
    }
    // 同步，对齐节点的 异步加载状态
    if (nodeLoadingStateMap) {
      const key2NodeMap: stringMap = {};
      for (let i in nodeLoadingStateMap) {
        // 如果发现节点中不存在对应的key,去除这一项记录
        if (!key2NodeMap[i + '']) {
          nodeLoadingStateMap[i + ''] = false;
        }
      }
      setNodeLoadingStateMap({ ...nodeLoadingStateMap });
    }
  }, [treeData]);

  /**
   * 处理树的展开
   */
  useEffect(() => {
    // 同步，出来外部expand和内部expand的变化
    if (expandedKeys && _expandedKeys && _expandedKeys.length) {
      // 只有当外部expand没有，现在有的时候，就重置内部_expandedKeys
      _setExpandedKeys([]);
    }
  }, [expandedKeys]);

  /**
   * 默认的
   */

  return autoSize ? (
    <div style={{ width: '100%', height: '100%' }}>
      <AutoSizer>{({ height, width }) => getVList(width, height)}</AutoSizer>
    </div>
  ) : (
    useMemo(() => {
      return getVList(width as number, height as number);
    }, [width, height, getVList])
  );
};

export default VListTree;
