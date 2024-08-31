import React, { useEffect, useRef, useCallback, useMemo, useImperativeHandle } from 'react';
import './index.scss';
import { apiHolder as api, inWindow, MailEntryModel, SystemApi, apis, DataTrackerApi, locationHelper, MailConfApi } from 'api';
import MailCardList from '../../common/components/vlist/MailCardList/MailCardList';
import MailCard from '../../common/components/vlistCards/MailCard/MailCard';
import { CardGroupDecorateRender, MailCardComProps, CardGroupDecorateRenderResult } from '../../types';
import { CardOperRedFlag } from '../../common/components/vlistCards/MailCard/defaultComs';
import ListLoading from '../../common/components/ListLoading/index';
// import listHokKeysHoc from '../ListHotKeys/listHotKeysHoc';
import HotKeys from '../../common/components/HotKeys/HotKeysMult';
import { ModuleHotKeyEvent } from '../ListHotKeys/moduleHotKey';
import { folderIdIsContact, getMailKey, isMainAccount, scanMailsSetTimeGradients, systemIsWindow } from '../../util';
import useState2RM from '../../hooks/useState2ReduxMock';
import { LIST_MODEL, TASK_MAIL_STATUS } from '../../common/constant';
import { getCardHeight } from '@web-mail/utils/mailCardUtil';
import { useAppSelector, RootState } from '@web-common/state/createStore';
import { createSelector } from '@reduxjs/toolkit';
import { isMailDiff } from '@web-mail/utils/mailCompare';
import { renderContacts } from '@web-mail/common/components/vlistCards/MailCard/defaultComs';
import { FLOLDER } from '@web-mail/common/constant';
import lodash from 'lodash';

const eventApi = api.api.getEventApi();
const systemApi: SystemApi = api.api.getSystemApi();
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
// // 扩展邮件列表为全局事件快捷键列表
// const ListHotKeys = HotKeys(MailCardList, ModuleHotKeyEvent);
// import { useWhyDidYouUpdate } from 'ahooks';
import { getIn18Text } from 'api';

const VoidCom = () => <></>;
const defaultList: any[] = [];
const defaultCallback = () => {};

const MailList: React.FC<any> = (props, ref) => {
  const {
    // 事件
    onContextMenu,
    onDragStart,
    onDragEnd,
    onDoubleClick,
    onActiveInWindow,
    hkDisabled,
    onSelect,
    onUnSelect,
    beforeSelected,
    onActive,
    cardFromTitle = null,
    customerLabelAfter = null,
    // 外部参数
    data,
    loadMoreRows,
    rowCount,
    listHeight,
    listWidth,
    scrollTop,
    listLoading,
    notice,
    tagName,
    isSearching,
    // 选中的ids
    activeId = defaultList,
    refreshPage,
    topExtraData = defaultList,
    showGroupDecorate = true,
    showCheckbox = true,
    total,
    batchSize,
    threshold,
    scrollingResetTimeInterval,
    overscanRowCount,
    pullRefreshLoadingHeight,
    loadMoreLoadingHeight,
    rowHeight,
    onScroll,
    noMoreRender,
    pullRefreshRender,
    loadMoreLoadingRender,
    noRowsRenderer,
    onPullRefresh,
    onLoadMore,
    loadMoreLoadingFailRender,
    // 列表是否重渲染
    listFouceRender,
    onDelete,
    // 邮件卡片的详情
    mailCardSummary,
    useRealList = false,
    // 列表的快捷键模式
    listModel = LIST_MODEL.INIT,
    onListModelChange,
    /**
     * 部分业务属性-因为量少，直接传入做业务判断，等量多了之后对应业务做整体提升
     */
    // 邮件列表-上部-二级tab选中
    selected,
    // 去任务邮件的点击处理事件
    // goTaskMailBox = defaultCallback,
    // 选中的文件夹
    selectedKeys,

    forceShowAttachment = false,
    realListPager = null,
    realListClassName = '',
    onRealListScroll,
    isRefresh,
    onContentInsufficientHeight,
    /**
     * 邮件数据源融合配置
     */
    MailMergeConfig,
  } = props;
  // const [selectedKeys, setSelectedKeys] = useState2RM('selectedKeys', 'doUpdateSelectedKey');

  // 外贸下不需要这个状态
  // const [taskMailListStateTab, doUpdateTaskMailListStateTab] = useState2RM('taskMailListStateTab', 'doUpdateTaskMailListStateTab');
  // 邮件列表-上部-二级tab选中
  // const [selected] = useState2RM('mailListStateTab', 'doUpdateMailListStateTab');
  const isCorpMail = useMemo(() => {
    return systemApi.getIsCorpMailMode();
  }, []);
  // const [listModel, setListModel] = useState2RM('defaultMailListSelectedModel', 'doUpdateMailListSelectedModel');
  // 是否展示头像的配置
  const [showAvator, setShowAvator] = useState2RM('configMailListShowAvator', 'doUpdateConfigMailListShowAvator');

  // useWhyDidYouUpdate('MailList', { ...props, selectedKeys, selected, isCorpMail, listModel , showAvator, MailFolderTreeMap});

  // scrollTop本地缓存
  const scrollTopRef = useRef(0);

  // todo：为什么要在业务组件中初始化redux
  useEffect(() => {
    // api获取是否展示头像，并设置一次
    const avator = mailConfApi.getMailShowAvator();
    setShowAvator(avator);
  }, []);

  /**
   * 扩展邮件列表为全局事件快捷键列表
   * warn: 由于现在存在通栏和三栏，快捷键模块的创建只能在组件中，这样才能竞争注册邮件的默认快捷键转发
   * warn: maillist 和 mailListLong 俩组件互斥不能共存
   */
  const ListHotKeys = useMemo(() => HotKeys(MailCardList, ModuleHotKeyEvent), []);

  // 判断是否支持拖拽
  const listCanDrag = useCallback(() => {
    if (isSearching) {
      return false;
    }
    const fid = selectedKeys.id;
    const staticForbidRule = [FLOLDER.DRAFT, FLOLDER.WAITINGISSUE, FLOLDER.READYISSUE];
    const res = !staticForbidRule.some(item => item === fid);
    return res;
  }, [isSearching, selectedKeys?.id]);

  // 判断具体的某个邮件是否支持拖拽
  const mailCanDrag = useCallback(mail => {
    if (mail) {
      const { taskInfo } = mail;
      // 没有完成的任务邮件不允许拖拽
      return taskInfo?.status !== TASK_MAIL_STATUS.PROCESSING;
    }
    return true;
  }, []);

  /**
   * 点击列表中的红旗标记
   */
  const handleReadFlagClick = useCallback((data: MailEntryModel) => {
    const { mark, threadMessageIds, id } = data.entry || {};
    eventApi.sendSysEvent({
      eventName: 'mailStatesChanged',
      eventData: {
        mark: mark === 'none',
        id: isCorpMail && threadMessageIds && threadMessageIds.length ? threadMessageIds : id,
        type: 'redFlag',
      },
      _account: data._account,
      eventStrData: mark === 'none' ? 'mark' : 'unmark',
    });
  }, []);

  // 红旗附加操作
  const CardOperRedFlagWrap = useCallback(
    (_props: MailCardComProps) => (
      <span
        onClick={e => {
          e.stopPropagation();
          handleReadFlagClick(_props.data);
        }}
      >
        <CardOperRedFlag {..._props} />
      </span>
    ),
    [handleReadFlagClick]
  );

  /**
   * 邮件卡片混合业务数据
   * warn: MailMergeConfig没有包含在依赖项中，因为现在的业务，其功能是固定的，跟随isSearching 变化的
   * 后续有变化需要注意同步修改
   */
  const CustomMailCard = useCallback(
    (_props: MailCardComProps) => {
      const key = selectedKeys && selectedKeys.id;
      const showReadFlag = !(key === FLOLDER.DELETED || key === FLOLDER.SPAM);
      const isTask = _props?.data?.taskId != null;
      const isTpMail = _props?.data?.isTpMail;
      const isShowCheckBox = typeof showCheckbox == 'function' ? showCheckbox(_props?.data) : showCheckbox;

      // 数据获取函数
      const excludeKeyMap = useCallback((state: RootState) => state.mailReducer.mailExcludeKeyMap, []);
      const mailStore = useCallback((state: RootState) => state.mailReducer.mailEntities, []);

      // 获取数据源的时候进行融合
      const mailSelector = useMemo(
        () =>
          createSelector([mailStore, excludeKeyMap], (store, excludeMap) => {
            const id = _props?.data?.entry?.id;
            const mail = id ? store[id] : null;
            if (MailMergeConfig && MailMergeConfig.key && MailMergeConfig.exclude && MailMergeConfig.exclude.length) {
              const res = mail
                ? {
                    ...mail,
                    entry: {
                      ...mail.entry,
                    },
                  }
                : {};
              MailMergeConfig.exclude.forEach(path => {
                lodash.set(res, path, lodash.get(excludeMap, [MailMergeConfig.key, id].join('.') + path));
              });
              return res;
            } else {
              return mail;
            }
          }),
        [_props?.data?.entry?.id]
      );

      /**
       * 从正常的数据源获取邮件详情
       */
      const defaultSelecter = useCallback(
        state => {
          if (state?.mailReducer?.mailEntities) {
            return state?.mailReducer?.mailEntities[_props?.data?.entry?.id];
          }
        },
        [_props?.data?.entry?.id]
      );

      // 搜索下走融合数据源
      const data = useAppSelector(isSearching ? mailSelector : defaultSelecter, (old, newValue) => {
        return !isMailDiff(old as MailEntryModel, newValue as MailEntryModel);
      });
      return (
        <MailCard
          {..._props}
          forceShowAttachment={forceShowAttachment}
          data={data || _props?.data}
          from={cardFromTitle}
          customerLabelAfter={customerLabelAfter}
          summary={mailCardSummary}
          summaryExtra={showReadFlag && !isTask && !isTpMail ? CardOperRedFlagWrap : isTpMail ? null : VoidCom}
          hideTag={tagName}
          isMultiple={listModel == LIST_MODEL.MULTIPLE}
          showCheckbox={isShowCheckBox}
          // 外贸通并且展示头像的时候，需要hover功能
          hoverCheckbox={systemApi.inEdm() && showAvator}
          showAvator={showAvator}
        />
      );
    },
    [selectedKeys?.id, tagName, listModel, cardFromTitle, mailCardSummary, showAvator, showCheckbox, CardOperRedFlagWrap, isSearching]
  );

  // 邮件拖拽逻辑
  const defaultOnMailDrag = useCallback(
    (event: React.DragEvent, item: MailEntryModel) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('accountId', `${item?._account}`);
      // 当前邮件是否为聚合邮件
      event.dataTransfer.setData('isThread', `${item?.isThread}`);
      if (activeId.includes(item.entry.id)) {
        event.dataTransfer.setData('text', activeId);
      } else {
        event.dataTransfer.setData('text', item.entry.id);
      }
    },
    [activeId]
  );

  // 处理邮件开始拖拽
  const handleMailDragStart = useCallback(
    (event: React.DragEvent, item: MailEntryModel, index: number) => {
      defaultOnMailDrag(event, item);
      onDragStart && onDragStart(event, item, index);
    },
    [onDragStart, defaultOnMailDrag]
  );

  // 去任务邮件
  // const goTaskMailBox = useCallback(() => {
  //   trackApi.track('pcMail_click_moreTaskMail_mailListPage');
  //   setSelectedKeys({
  //     id: -9
  //   });
  //   doUpdateTaskMailListStateTab(getIn18Text('JINXINGZHONG'));
  // },[]);
  // const shouldUseRealList = useShouldUseRealList();
  // const realListCurrentPage = useAppSelector(state => state.mailReducer.realListCurrentPage);

  // 任务邮件装饰-列表中的横向分割
  // const taskMailGroupDecorate: CardGroupDecorateRender<MailEntryModel> = useMemo(()=>{
  //   const isTaskFlolder = selectedKeys?.id === FLOLDER.TASK;
  //   const wordSeparator = inWindow() && window.systemLang === 'en' ? ' ' : '';
  //   const realListNoTask = realListCurrentPage!==1 && shouldUseRealList;
  //   return (data:  MailEntryModel[], index: number) => {
  //     if (data && data.length > 0 && !isTaskFlolder && !realListNoTask ) {
  //       let taskSum = 0;
  //       let hasTask = false;
  //       for (let i = 0; i < data.length; i++) {
  //         if (data[i].entry.taskTop) {
  //           taskSum += 1;
  //           hasTask = true;
  //         } else {
  //           break;
  //         }
  //       }
  //       if (hasTask && data[0]?.entry?.taskNum && data[0]?.entry?.taskNum > 0) {
  //         const res: CardGroupDecorateRenderResult = {
  //           element: (
  //             <div className="mail-list-topline" onClick={goTaskMailBox}>
  //               {data[0].entry.taskNum &&
  //                 (data[0].entry.taskNum <= 2 ? (
  //                   <span>{getIn18Text('YISHANGWEIJINXING')}</span>
  //                 ) : (
  //                   <span className="mail-list-topline-more">
  //                     {getIn18Text('HAIYOU')}
  //                     {wordSeparator}
  //                     {data[0].entry.taskNum - 2}
  //                     {wordSeparator}
  //                     {getIn18Text('GERENWU')}
  //                   </span>
  //                 ))}
  //             </div>
  //           ),
  //           index: taskSum - 1,
  //           height: 49
  //         };
  //         return res;
  //       }
  //     }
  //     return null;
  //   };
  // },[selectedKeys?.id, shouldUseRealList, realListCurrentPage ])

  // 置顶邮件-列表装饰
  const topMailGroupDecorate: CardGroupDecorateRender<MailEntryModel> = useMemo(() => {
    return (data, preIndex) => {
      if (data && data.length) {
        let topSum = 0;
        let hasTop = false;
        for (let i = preIndex; i < data.length; i++) {
          if (data[i].entry.top) {
            topSum += 1;
            hasTop = true;
          } else {
            break;
          }
        }
        if (hasTop) {
          return {
            element: (
              <div className="mail-list-topline">
                <span>{getIn18Text('YISHANGWEIZHIDING')}</span>
              </div>
            ),
            index: preIndex + topSum - 1,
            height: 49,
          };
        }
      }
      return null;
    };
  }, []);

  // 按照发件人排序-分割线
  const mailSenderGroupDecorate: CardGroupDecorateRender<MailEntryModel> = useMemo(() => {
    return (data, preIndex) => {
      try {
        if (data && data.length) {
          const decorateList: CardGroupDecorateRenderResult[] = [];
          let start = renderContacts(data[preIndex]);
          let startIndex = preIndex;
          for (let i: number = preIndex + 1; i < data.length; i++) {
            if (renderContacts(data[i]) != start || i == data.length - 1) {
              decorateList.push({
                element: (
                  <div className="mail-list-item-top-time">
                    {start} ({i - startIndex})
                  </div>
                ),
                index: startIndex,
                height: 27,
                position: 'top',
                fixed: {
                  height: 27 + 5,
                },
              });
              // 重置起始记录
              start = renderContacts(data[i]);
              startIndex = i;
            }
          }
          // 处理末尾只有1个发件人的边界情况
          if (startIndex == data.length - 1 && start != renderContacts(data[data.length - 1])) {
            decorateList.push({
              element: <div className="mail-list-item-top-time">{start} (1)</div>,
              index: startIndex,
              height: 27,
              position: 'top',
              fixed: {
                height: 27 + 5,
              },
            });
          }
          return decorateList;
        }
      } catch (e) {
        console.error('[mailSenderGroupDecorate Error]', e);
        return null;
      }
      return null;
    };
  }, []);

  /**
   * 邮件列表的 装饰,在指定邮件卡片的前后者后面，渲染自定义的结构来实现业务功能
   */
  const mailGroupDecorate = useMemo(() => {
    const isTaskFlolder = selectedKeys?.id === FLOLDER.TASK;
    let list: CardGroupDecorateRender<MailEntryModel>[] = [];

    // 只在主账号下展示
    // if (isMainAccount(selectedKeys?.accountId)) {
    //    // 任务邮件
    //    list.push(taskMailGroupDecorate);
    // }

    // 屏蔽虚拟文件夹
    const isVirtualFolder = Number.isInteger(selectedKeys?.id) ? selectedKeys?.id < 0 : false;

    // 置顶
    if (selected == 'ALL' && !folderIdIsContact(selectedKeys?.id) && !isVirtualFolder) {
      list.push(topMailGroupDecorate);
    }

    // 只在主账号下展示, 顺序相关，不要合并
    if (isMainAccount(selectedKeys?.accountId)) {
      // 按照发件人分组分割
      if (['ORDER_BY_SENDER_CAPITAL_DESC', 'ORDER_BY_SENDER_CAPITAL_ASC', 'ORDER_BY_RECEIVER_CAPITAL_DESC', 'ORDER_BY_RECEIVER_CAPITAL_ASC'].includes(selected)) {
        list.push(mailSenderGroupDecorate);
      }
    }

    // 邮件列表的按照时间进行分割 - 仅支持时间排布为时间正序的
    if (!isTaskFlolder && (selected == 'ORDER_BY_DATE_ASC' || selected == 'ALL' || selected == 'REDFLAG' || selected == 'UNREAD')) {
      list.push((data: MailEntryModel[], fromIndex: number = 0) => {
        const timeHashes = scanMailsSetTimeGradients(data, fromIndex);
        return timeHashes;
      });
    }
    return list;
  }, [selectedKeys?.id, selectedKeys?.accountId, selected]);

  const listRef = useRef();
  // st对比，如果值不一样，转命令式的调动
  // todo： 如果外部节流的话，时间不同步，可能会造成对比不一致的情况，现在看了看所有指令主动触发的只有 = 0 这个情况。可以更特殊处理
  useEffect(() => {
    if (scrollTop == 0 && scrollTop != scrollTopRef.current) {
      listRef.current?.scrollToPosition(scrollTop);
      scrollTopRef.current = scrollTop;
    }
  }, [scrollTop]);

  const getCardItemHeight = (data: MailEntryModel) => {
    return getCardHeight(data, forceShowAttachment);
  };

  const ListElement = useMemo(() => {
    return (
      <ListHotKeys
        // props 需要干掉，这种方式太蛋疼了
        // {...props}
        onSelect={onSelect}
        onUnSelect={onUnSelect}
        onActive={onActive}
        beforeSelected={beforeSelected}
        hkDisabled={hkDisabled}
        onActiveInWindow={onActiveInWindow}
        ref={listRef}
        className={`${systemIsWindow() ? 'u-vlist-win' : 'u-vlist'}`}
        containerStyle={{
          marginTop: selectedKeys && selectedKeys.id === FLOLDER.DEFAULT && notice ? 0 : '12px',
        }}
        style={
          inWindow() && !locationHelper.isMainPage()
            ? {
                overflowX: 'hidden',
                height: '95vh',
              }
            : {
                overflowX: 'hidden',
              }
        }
        height={listHeight}
        card={CustomMailCard}
        rowHeight={getCardItemHeight}
        width={listWidth}
        onLoadMore={start => loadMoreRows({ startIndex: start })}
        scrollTop={scrollTop}
        batchSize={100}
        threshold={500}
        cardMargin={1}
        useRealList={useRealList}
        realListPager={realListPager}
        realListClassName={realListClassName}
        onRealListScroll={onRealListScroll}
        data={data}
        total={rowCount}
        getUniqKey={getMailKey}
        onPullRefresh={refreshPage}
        activeId={activeId}
        isRefresh={isRefresh}
        onDoubleClick={(keys, data, index, event) => {
          onDoubleClick && onDoubleClick(data, index, event);
        }}
        onContextMenu={(keys, data, index, event) => {
          onContextMenu && onContextMenu(keys, data, index, event);
        }}
        draggable={listCanDrag() && mailCanDrag}
        onDragStart={(e, data, index) => {
          handleMailDragStart(e, data, index);
        }}
        onDragEnd={onDragEnd}
        onScroll={arg => {
          scrollTopRef.current = arg?.scrollTop;
          onScroll && onScroll(arg);
        }}
        cardGroupDecorate={showGroupDecorate ? mailGroupDecorate : null}
        topExtraData={isMainAccount(selectedKeys.accountId) ? topExtraData : null}
        selectModel={listModel}
        onListModelChange={(model: LIST_MODEL, activeIds: string[]) => {
          if (selectedKeys.id == FLOLDER.TASK) {
            if (model === LIST_MODEL.INIT) {
              onListModelChange && onListModelChange(model);
            }
          } else {
            if (model === LIST_MODEL.INIT) {
              onListModelChange && onListModelChange(model);
            } else if (activeIds && activeIds?.length > 0) {
              onListModelChange && onListModelChange(model);
            }
          }
        }}
        isMultiple={listModel == LIST_MODEL.MULTIPLE}
        scrollingResetTimeInterval={scrollingResetTimeInterval}
        overscanRowCount={overscanRowCount}
        pullRefreshLoadingHeight={pullRefreshLoadingHeight}
        loadMoreLoadingHeight={loadMoreLoadingHeight}
        noMoreRender={noMoreRender}
        pullRefreshRender={pullRefreshRender}
        loadMoreLoadingRender={loadMoreLoadingRender}
        noRowsRenderer={noRowsRenderer}
        loadMoreLoadingFailRender={loadMoreLoadingFailRender}
        listFouceRender={listFouceRender}
        onDelete={onDelete}
        onContentInsufficientHeight={onContentInsufficientHeight}
      />
    );
  }, [
    // todo: 历史遗留的业务属性
    notice,

    onSelect,
    onUnSelect,
    onActive,
    beforeSelected,
    hkDisabled,
    onActiveInWindow,

    data,
    selectedKeys,
    listHeight,
    listWidth,
    CustomMailCard,
    getCardHeight,
    loadMoreRows,
    rowCount,
    getMailKey,
    refreshPage,
    activeId,
    onDoubleClick,
    onContextMenu,
    listCanDrag,
    mailCanDrag,
    handleMailDragStart,
    showGroupDecorate,
    mailGroupDecorate,
    topExtraData,
    listModel,
    onDragEnd,

    total,
    batchSize,
    threshold,
    scrollingResetTimeInterval,
    overscanRowCount,
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
    listFouceRender,
    onDelete,
    useRealList,
    onListModelChange,
    isRefresh,
    onContentInsufficientHeight,
  ]);

  const currentPageSize = useAppSelector(state => state.mailReducer.realListCurrentPageSize);

  useImperativeHandle(ref, () => listRef.current, []);

  return (
    <div className={'mail-list' + (!useRealList ? ' sirius-no-drag' : '')}>
      {ListElement}
      {useMemo(() => {
        return listLoading && <ListLoading loading={listLoading} isUseRealList={useRealList} pageSize={currentPageSize} />;
      }, [listLoading, currentPageSize, useRealList])}
    </div>
  );
};
export default React.forwardRef(MailList);
