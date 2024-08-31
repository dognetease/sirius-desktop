/**
 * 虚拟卡片列表
 * 列表的滚动方法，定位，由列表自行实现
 */
import React, { useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { CardListComProps, RowRenderer, stringMap, CardGroupDecorateRenderResult } from '../../../../types';
import { CellMeasurer, CellMeasurerCache, List } from '../../../library/LinearList/refresh-virtualized';
import useSyncSingleAndDoubleClick from '@web-common/hooks/useSyncDoubleClick';
import useCreateCallbackForEvent from '../../../../hooks/useCreateCallbackForEvent';
import { debounce, throttle } from 'lodash';
import './cardList.scss';
import { useUpdateEffect } from 'ahooks';
import useStateRef from '@web-mail/hooks/useStateRef';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';

const defaultCardCom = () => <></>;
const defaultGetUniqKey = (index: number) => index + '';
const defaultCardWrap = (props: any) => <div {...props} />;
const defaultArray: any[] = [];

const SCROLL_OVER_CLASSNAME = 'cardlist-scroll-over';

interface index2ElementMap {
  [index: number]: {
    top: CardGroupDecorateRenderResult[];
    bottom: CardGroupDecorateRenderResult[];
  };
}

function CardList<T>(props: CardListComProps<T>, ref: React.Ref<any>) {
  const {
    height,
    width,
    total,
    rowHeight,
    onScroll,
    activeId,
    cardMargin = 1,
    data,
    card: CardCom = defaultCardCom,
    cardWrap: CardWrap = defaultCardWrap,
    getUniqKey = defaultGetUniqKey,
    cardGroupDecorate,
    onSelect,
    onDoubleClick,
    onContextMenu,
    topExtraData = defaultArray,
    // 是否是多选模式
    isMultiple = false,
    onChecked,
    // 点击事件是否在捕获阶段
    selectIsCapture = false,
    scrollTop,
    batchSize,
    threshold,
    containerStyle,
    className,
    overscanRowCount,
    pullRefreshLoadingHeight,
    loadMoreLoadingHeight,
    noMoreRender,
    pullRefreshRender,
    loadMoreLoadingRender,
    noRowsRenderer,
    onPullRefresh,
    onLoadMore,
    loadMoreLoadingFailRender,
    initLoadLoadingFailRender,
    listFouceRender,
    useRealList = false,
    realListPager = null,
    realListClassName = '',
    onRealListScroll,
    isRefresh,
    onContentInsufficientHeight,
  } = props;

  const listref = useRef(null);
  // 当前fixed的元素
  const [fixDec, setFixDec] = useState<CardGroupDecorateRenderResult>();
  // 防止scrollTop频繁变化对性能的影响
  const scrollTopRef = useRef(0);
  // st对比，如果值不一样，转命令式的调动
  // todo： 如果外部节流的话，时间不同步，可能会造成对比不一致的情况，现在看了看所有指令主动触发的只有 = 0 这个情况。可以更特殊处理
  useEffect(() => {
    if (scrollTop == 0 && scrollTop != scrollTopRef.current) {
      listref.current?.scrollToPosition(scrollTop);
      scrollTopRef.current = scrollTop;
    }
  }, [scrollTop]);
  /**
   *  激活idMap
   */
  const activeIdMap = useMemo(() => {
    if (activeId && activeId.length) {
      const map: stringMap = {};
      activeId.forEach(item => {
        map[item] = !0;
      });
      return map;
    } else {
      return {};
    }
  }, [activeId]);

  // useEffect(()=>{
  //   setTimeout(()=>{
  //     listref.current?.recomputeGridSize();
  //   },0)
  // },[listFouceRender])

  /**
   * 卡片的装饰
   * 所有设置了fixed的卡片装饰列表,有序排列，按照在列表中的顺序排序
   * 现在在逻辑上只支持了卡片的顶部装饰（应为高度计算只计算了上边沿）
   * 且没有考虑一个卡片有多个装饰设置了fixed的情况。待后续有需求了扩展。
   */
  const [decorates, fixedList] = useMemo(() => {
    if (cardGroupDecorate && cardGroupDecorate.length) {
      // console.log('[FolderTree] 选择文件夹 渲染邮件列表+装饰器 start:', Date.now());
      // 装饰器映射
      const map: index2ElementMap = {};
      const fixedDecList: CardGroupDecorateRenderResult[] = [];
      const list: number[] = [];
      cardGroupDecorate.forEach((fn, cgIndex) => {
        const prev = cgIndex < 0 ? null : list[list.length - 1];
        const prevIndex = prev || 0;
        const decorateRenderResult = fn(data, prevIndex);
        if (decorateRenderResult) {
          // 数组类型的装饰器
          if (Array.isArray(decorateRenderResult)) {
            decorateRenderResult.forEach(decorate => {
              const { index, fixed } = decorate;
              if (fixed) {
                // 需要扩展多个装饰器都要漂浮的问题，现在可以只考虑支持一个，只简单考虑top的问题
                fixedDecList.push(decorate);
              }
              list.push(index + 1);
              if (map[index]) {
                decorate?.position == 'top' ? map[index]?.top?.push(decorate) : map[index]?.bottom?.push(decorate);
              } else {
                map[index] = {
                  top: [],
                  bottom: [],
                };
                decorate?.position == 'top' ? map[index]?.top?.push(decorate) : map[index]?.bottom?.push(decorate);
              }
            });
            // 对象类型
          } else {
            const { index, fixed } = decorateRenderResult;
            // 计算是否需要漂浮
            if (fixed) {
              // 需要扩展多个装饰器都要漂浮的问题，现在可以只考虑支持一个，只简单考虑top的问题
              fixedDecList.push(decorateRenderResult);
            }
            list.push(index + 1);
            if (map[index]) {
              decorateRenderResult?.position == 'top' ? map[index]?.top?.push(decorateRenderResult) : map[index]?.bottom?.push(decorateRenderResult);
            } else {
              map[index] = {
                top: [],
                bottom: [],
              };
              decorateRenderResult?.position == 'top' ? map[index]?.top?.push(decorateRenderResult) : map[index]?.bottom?.push(decorateRenderResult);
            }
          }
        }
      });
      fixedDecList.sort((pre, cur) => pre.index - cur.index);
      setTimeout(() => {
        throttleScanFixedDec(scrollTopRef.current);
      }, 0);
      // console.log('[FolderTree] 选择文件夹 渲染邮件列表+装饰器 End:', data, Date.now());
      return [map, fixedDecList];
    }
    return [{}, []];
  }, [data, cardGroupDecorate]);

  /**
   * 列表顶部的-额外区域，根据配置合并内部参数
   */
  const localTopExtraData = useMemo(() => {
    if (!topExtraData || topExtraData.length === 0) {
      return [];
    } else {
      let localData = topExtraData.map(item => {
        return {
          ...item,
          height: item.height + cardMargin,
        };
      });
      // console.log('[FolderTree] 选择文件夹 渲染邮件列表 + 重新计算高度:', localData, Date.now());
      // 重新计算位置-无法避免
      setTimeout(() => {
        topExtraData.forEach((_, index) => {
          if (listref && listref.current) {
            listref.current?.recomputeRowHeights(index);
          }
        });
      }, 0);
      return localData;
    }
  }, [topExtraData]);

  // // 卡片高度计算
  const getCardHeight = useCallback(
    (params: { index: number }) => {
      const { index } = params;
      const cardData = data[index];
      let decorateHeight = 0;
      if (decorates[index]) {
        decorates[index]?.top?.forEach(item => {
          decorateHeight += item.height;
        });
        decorates[index]?.bottom?.forEach(item => {
          decorateHeight += item.height;
        });
      }
      return rowHeight(cardData) + cardMargin + decorateHeight;
    },
    [rowHeight, cardMargin, decorates, data, listFouceRender]
  );

  /**
   * 计算列表的递增和
   */
  const preMailSumHeightMap = useMemo(() => {
    // console.log('[FolderTree] 选择文件夹 渲染邮件列表+计算邮件高度 start:', Date.now());
    let preHeight = 0;
    const map: stringMap = {};
    // 同于额外渲染区域的高度
    localTopExtraData.forEach(item => {
      preHeight += item.height;
    });
    data.forEach((item, index) => {
      map[index] = preHeight;
      preHeight += getCardHeight({ index });
    });
    return map;
  }, [data, localTopExtraData, getCardHeight]);

  // 转换为ref调用
  const preMailSumHeightMapRef = useStateRef(preMailSumHeightMap);
  const dataRef = useStateRef(data);

  // 邮件列表是否出现滚动条
  const listScrollIsOver = useMemo(() => {
    try {
      if (data && data.length) {
        const sumHeight = preMailSumHeightMap[data.length - 1];
        return sumHeight > height;
      }
    } catch (e) {
      console.error('[error cardList OverScreen]', e);
    }
    return false;
  }, [data?.length, preMailSumHeightMap, height]);

  /**
   * 虚拟列表的缓存优化
   */
  const measureCache = useMemo(
    () =>
      new CellMeasurerCache({
        fixedWidth: true,
        minHeight: 70,
      }),
    [data, listFouceRender]
  );

  // 单击
  const handleClick = useCallback(
    (cardData: T, index: number, e: React.MouseEvent) => {
      e?.persist();
      onSelect && onSelect([getUniqKey(index, cardData)], cardData, index, e);
    },
    [onSelect, getUniqKey]
  );

  // 双击
  const handleDoubleClick = useCallback(
    (cardData: T, index: number, e: React.MouseEvent) => {
      e?.persist();
      onDoubleClick && onDoubleClick([getUniqKey(index, cardData)], cardData, index, e);
    },
    [onDoubleClick, getUniqKey]
  );

  // 卡片点击代理，判断到底是单击还是双击
  const listItemClickProxy = useCallback(useSyncSingleAndDoubleClick(handleClick, handleDoubleClick, 200), []);

  // 卡片的点击
  const handleCardClick = useCallback(
    (cardData: T, index: number, e: React.MouseEvent): void => {
      e?.persist();
      listItemClickProxy(getUniqKey(index, cardData), cardData, index, e);
    },
    [listItemClickProxy, getUniqKey]
  );

  // 卡片捕获阶段的点击事件
  const handleCardClickCapture = useCallback(
    (cardData: T, index: number, e: React.MouseEvent): void => {
      if (selectIsCapture && (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey)) {
        e?.stopPropagation();
        e?.persist();
        listItemClickProxy(getUniqKey(index, cardData), cardData, index, e);
      }
    },
    [listItemClickProxy, getUniqKey]
  );

  // 右键
  const handleContextMenu = useCallback(
    (cardData: T, index: number, e: React.MouseEvent) => {
      e?.persist();
      onContextMenu && onContextMenu([getUniqKey(index, cardData)], cardData, index, e);
    },
    [onContextMenu, getUniqKey]
  );

  // 勾选
  const handleCardChecked = useCallback(
    (checked: boolean, cardData: T, index: number, e: React.MouseEvent): void => {
      e?.persist();
      onChecked && onChecked(checked, [getUniqKey(index, cardData)], cardData, index, e);
    },
    [onChecked, getUniqKey]
  );

  // 节流计算fixedDec的位置
  const throttleScanFixedDec = useCallback(
    throttle(
      scrollTop => {
        let aimDec;
        fixedList.forEach(item => {
          if (item) {
            // 获得目标卡片上边沿的累积边距
            let aimSt = preMailSumHeightMap[item.index];
            // 距离顶部50px以内不触发漂浮
            if (aimSt <= 50) {
              aimSt = 50;
            }
            if (scrollTop >= aimSt) {
              aimDec = item;
            }
          }
        });
        setFixDec(aimDec);
      },
      300,
      {
        trailing: true,
        leading: true,
      }
    ),
    [fixedList, preMailSumHeightMap]
  );

  // 滚动
  const handleOnListScroll = useCallback(
    arg => {
      // 判断类型
      const { scrollTop } = arg || {};
      scrollTopRef.current = scrollTop;
      // 根据位置，查询是否有对应的卡片或者渲染器。
      throttleScanFixedDec(scrollTop);
      onScroll && onScroll(arg);
    },
    [throttleScanFixedDec, onScroll]
  );

  const RealRowRender = useCallback(
    ({ index }) => {
      const cardData = data[index];
      const cardIsActive = !!activeIdMap[getUniqKey(index, cardData)];
      const cardIsChecked = isMultiple && cardIsActive;
      return (
        <div className="mail-real-list-item" style={{ margin: `${cardMargin ? cardMargin + 'px' : ''} 0` }}>
          {(decorates && decorates[index] && decorates[index]?.top?.map(item => item.element)) || <></>}
          <CardWrap
            data={cardData}
            index={index}
            onClick={e => handleCardClick(cardData, index, e)}
            //@ts-ignore
            onClickCapture={e => handleCardClickCapture(cardData, index, e)}
            onContextMenu={e => handleContextMenu(cardData, index, e)}
          >
            <CardCom
              active={!!activeIdMap[getUniqKey(index, cardData)]}
              checked={cardIsChecked}
              data={cardData}
              // width  不可包含到useCallback的依赖中
              width={width}
              onChecked={(checked: boolean, e: React.MouseEvent) => {
                handleCardChecked(checked, cardData, index, e);
              }}
            />
          </CardWrap>
          {(decorates && decorates[index] && decorates[index]?.bottom?.map(item => item.element)) || <></>}
        </div>
      );
    },
    [data, activeIdMap, getUniqKey, isMultiple, decorates, handleCardClick, handleCardClickCapture, handleContextMenu, handleCardChecked, CardCom]
  );

  // 卡片的渲染函数
  const rowRendere: RowRenderer = useCallback(
    ({ index, key, style, parent }) => {
      const cardData = data[index];
      const cardIsActive = !!activeIdMap[getUniqKey(index, cardData)];
      const cardIsChecked = isMultiple && cardIsActive;
      return (
        <CellMeasurer cache={measureCache} columnIndex={0} key={key} parent={parent} rowIndex={index}>
          <div key={key} style={style}>
            {(decorates && decorates[index] && decorates[index]?.top?.map(item => item.element)) || <></>}
            <CardWrap
              data={cardData}
              index={index}
              onClick={e => handleCardClick(cardData, index, e)}
              onClickCapture={e => handleCardClickCapture(cardData, index, e)}
              onContextMenu={e => handleContextMenu(cardData, index, e)}
            >
              <CardCom
                active={!!activeIdMap[getUniqKey(index, cardData)]}
                checked={cardIsChecked}
                data={cardData}
                // width  不可包含到useCallback的依赖中
                width={width}
                onChecked={(checked: boolean, e: React.MouseEvent) => {
                  handleCardChecked(checked, cardData, index, e);
                }}
              />
            </CardWrap>
            {(decorates && decorates[index] && decorates[index]?.bottom?.map(item => item.element)) || <></>}
          </div>
        </CellMeasurer>
      );
    },
    [data, activeIdMap, getUniqKey, isMultiple, decorates, handleCardClick, handleCardClickCapture, handleContextMenu, handleCardChecked, CardCom]
  );

  /**
   * 列表滚动到相关
   */

  // 检测邮件是否超出列表视窗上边界
  const checkOverTop = useCallback((index: number): boolean => preMailSumHeightMap[index] <= scrollTopRef.current, [preMailSumHeightMap]);

  // 检测邮件是否超出列表视窗下边界
  const checkOverBottom = useCallback(
    (index: number): boolean => preMailSumHeightMap[index] + rowHeight(data[index]) > scrollTopRef.current + height,
    [preMailSumHeightMap, height]
  );

  // 定位邮件到列表顶部
  const listScrollToTop = useCallback(
    (index: number) => {
      if (checkOverBottom(index)) {
        listScrollToBottomRef(index);
        return;
      }
      if (checkOverTop(index)) {
        const st = preMailSumHeightMap[index] || 0;
        listref.current?.scrollToPosition(st);
        onScroll &&
          onScroll({
            scrollTop: st,
          });
      }
    },
    [checkOverBottom, checkOverTop, onScroll, preMailSumHeightMap]
  );

  // 定位邮件到列表底部
  const listScrollToBottom = useCallback(
    (index: number) => {
      // 如果是超出列表窗口上边界
      if (checkOverTop(index)) {
        listScrollToTopRef(index);
        return;
      }
      if (checkOverBottom(index)) {
        const st = preMailSumHeightMap[index] - height + rowHeight(data[index]) + 24;
        listref.current?.scrollToPosition(st);
        onScroll &&
          onScroll({
            scrollTop: st,
          });
      }
    },
    [checkOverBottom, checkOverTop, onScroll, preMailSumHeightMap, rowHeight, height]
  );

  // 滚动到列表的某些位置
  // todo： 改动触发时间
  const scrollToPosition = useCallback(
    debounce(scrollTop => {
      if (listref && listref.current) {
        listref.current?.scrollToPosition(scrollTop);
      }
    }, 300),
    []
  );

  // 转换为引用，已通过外部ref调用
  const listScrollToTopRef = useCreateCallbackForEvent(listScrollToTop);
  const listScrollToBottomRef = useCreateCallbackForEvent(listScrollToBottom);
  const listScrollToPositionRef = useCreateCallbackForEvent(scrollToPosition);

  // 自定义ref
  useImperativeHandle(
    ref,
    () => ({
      scrollToTop: listScrollToTopRef,
      srollToBottom: listScrollToBottomRef,
      scrollToPosition: listScrollToPositionRef,
    }),
    [listScrollToTopRef, listScrollToBottomRef]
  );

  // 邮件装饰fixed
  const fixedDecElement = useMemo(() => {
    if (!fixDec) {
      return <></>;
    }
    const fixedConfigIsObj = typeof fixDec?.fixed === 'object';
    const decStyle = fixedConfigIsObj ? fixDec?.fixed?.style || {} : {};
    const decHeight = fixedConfigIsObj ? fixDec?.fixed?.height : fixDec?.height;
    const devElement = fixedConfigIsObj ? fixDec?.element : fixDec?.fixed?.element;

    return (
      <div className="cardlist-fixed-top-wrap" hidden={!fixDec} style={{ height: decHeight, ...decStyle }}>
        {devElement}
      </div>
    );
  }, [fixDec]);

  useEffect(() => {
    if (useRealList) {
      if (listref && listref.current && !listref.current.scrollToPosition) {
        //@todo 实现实体列表的scroll
        listref.current.scrollToPosition = (scrollTop: number) => {
          onRealListScroll && onRealListScroll(scrollTop);
        };
      }
    }
  }, [useRealList]);

  // 处理列表内容高度不足事件 - 1s的防抖
  const handleContentInsufficientHeight = useDebounceForEvent(
    () => {
      if (onContentInsufficientHeight && typeof onContentInsufficientHeight == 'function') {
        onContentInsufficientHeight();
      }
    },
    1000,
    {
      leading: false,
    }
  );

  /**
   * 在列表高度变化的时候，检测高度是否符合变化 - 在初始化的时候不执行
   * 对data来源测触发，单位之间的最大次数限制，直到外源性的data.length 变化
   */
  const sumDataLengthChange = useRef(0);
  const maxDataLengthChange = 3;
  useUpdateEffect(() => {
    try {
      if (preMailSumHeightMapRef.current && dataRef.current) {
        const length = dataRef.current?.length;
        if (length) {
          const maxContentHeight = preMailSumHeightMapRef.current[length - 1];
          // 如果邮件的内容不满1屏幕，则触发通知
          if (maxContentHeight < height && sumDataLengthChange.current < maxDataLengthChange) {
            handleContentInsufficientHeight();
          }
        }
        // 总数增加
        sumDataLengthChange.current += 1;
        // 如果检测到列表重置，重置计数
        if (length == 0) {
          sumDataLengthChange.current = 0;
        }
      }
    } catch (e) {
      console.error('[error cardList OverScreen]', e);
    }
  }, [height, data?.length]);

  /**
   * 渲染到列表上的className
   */

  const localClassName = useMemo(() => {
    try {
      if (className) {
        if (typeof className == 'string') {
          return className + '  ' + (listScrollIsOver ? SCROLL_OVER_CLASSNAME : '');
        } else if (typeof className == 'object') {
          return { ...(className as Object), [SCROLL_OVER_CLASSNAME]: listScrollIsOver };
        }
      }
    } catch (e) {
      console.error('[error cardList OverScreen]', e);
    }
    return listScrollIsOver ? SCROLL_OVER_CLASSNAME : '';
  }, [className, listScrollIsOver]);

  const RealRowRenderRef = useCreateCallbackForEvent(RealRowRender);

  const ListElement = useMemo(() => {
    return useRealList ? (
      <div className={realListClassName} ref={listref} style={{ width: '100%', padding: '5px 0' }}>
        {data.map((_, inx) => {
          return RealRowRenderRef({ index: inx });
        })}
        {realListPager}
      </div>
    ) : (
      <List
        // eslint-disable-next-line react/jsx-props-no-spreading
        ref={listref}
        // {...props}
        data={data}
        isRefresh={isRefresh}
        // 控制列表在数据变化的时候，保持某个条目的可见性
        // 在列表st受控的情况下不需要下面这条
        // 为了性能，取消了st受控，这会有导致在列表条目突变的时候st异常突变。
        scrollToIndex={scrollTop == 0 ? 0 : -1}
        width={width}
        total={total}
        rowHeight={getCardHeight}
        height={height}
        onScroll={handleOnListScroll}
        rowRenderer={rowRendere}
        initLoadMore={false}
        topExtraData={localTopExtraData}
        // 预渲染20个，以提升滑动性能
        overscanRowCount={20}
        // 减少渲染次数
        scrollingResetTimeInterval={300}
        // st使用半受控同步
        defaultScrollTop={scrollTop}
        batchSize={batchSize}
        threshold={threshold}
        containerStyle={containerStyle}
        className={localClassName}
        pullRefreshLoadingHeight={pullRefreshLoadingHeight}
        loadMoreLoadingHeight={loadMoreLoadingHeight}
        noMoreRender={noMoreRender}
        pullRefreshRender={pullRefreshRender}
        loadMoreLoadingRender={loadMoreLoadingRender}
        noRowsRenderer={noRowsRenderer}
        onPullRefresh={onPullRefresh}
        onLoadMore={onLoadMore}
        loadMoreLoadingFailRender={loadMoreLoadingFailRender}
        initLoadLoadingFailRender={initLoadLoadingFailRender}
      />
    );
  }, [
    data,
    width,
    height,
    total,
    batchSize,
    threshold,
    containerStyle,
    localClassName,
    overscanRowCount,
    topExtraData,
    pullRefreshLoadingHeight,
    loadMoreLoadingHeight,
    // rowHeight,
    onScroll,
    noMoreRender,
    pullRefreshRender,
    loadMoreLoadingRender,
    noRowsRenderer,
    onPullRefresh,
    onLoadMore,
    loadMoreLoadingFailRender,
    initLoadLoadingFailRender,
    rowRendere,
    useRealList,
    isRefresh,
  ]);

  return (
    <div className="cardlist-wrap">
      {ListElement}
      {fixedDecElement}
    </div>
  );
}

export default forwardRef(CardList);
