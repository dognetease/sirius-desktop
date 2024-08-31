// 邮件列表顶部的tab切换效果，从index中抽离出来
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useState2RM from '../../hooks/useState2ReduxMock';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { useAppDispatch, useActions, MailActions } from '@web-common/state/createStore';
import classnames from 'classnames';
import { getTreeStatesByAccount, isMainAccount, mailConfigStateIsMerge, mailLogicStateIsMerge, treeDFS } from '../../util';
import { apiHolder, apis, DataTrackerApi, MailConfApi } from 'api';
import MailMultOperation from './MailMultOperation';
import { FLOLDER, LIST_MODEL, unReadStr } from '../../common/constant';
import FilterTabPlus from './filterTabPlus';
// import UnfinishedDraftMailEntry from './unfinishedDraftMailEntry/unfinishedDraftMailEntry';
// import CloudMailSearchEntry from './cloudMailSearchEntry/cloudMailSearchEntry';
// import PaidGuideTip from '../PaidGuideModal/paidGuideTip';
// import { getIn18Text } from 'api';
// import ErrorBoundary from '@web-common/hooks/ErrorBoundary';
import FilterTabEdmLong from './filterTabPlusEdmLong';

const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
// const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
interface FilterTabProps {
  // handleClickNew: () => void;
}

const FilterTab: React.FC<any> = (props: FilterTabProps) => {
  // const { handleClickNew } = props;
  const dispatch = useAppDispatch();
  const reducer = useActions(MailActions);
  // 引入redux数据
  // 邮件文件夹相关状态map
  const [mailTreeStateMap] = useState2RM('mailTreeStateMap');
  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2RM('mailSearching', 'doUpdateMailSearching');
  // 邮件-搜索-是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
  // 搜索列表-上部-二级tab选中
  const [, setSearchSelected] = useState2RM('', 'doUpdateSearchListStateTab');
  // 邮件列表-上部-二级tab选中
  const [, setSelected] = useState2RM('', 'doUpdateMailListStateTab');
  const [selectedKeys] = useState2RM('selectedKeys');
  const [configMailLayout] = useState2RM('configMailLayout', 'doUpdateConfigMailLayout');
  const isLong = useMemo(() => configMailLayout === '2', [configMailLayout]);
  // // 新邮件提醒
  // const [isNoticeNum] = useState2RM('noticeNum');
  // 未读邮件数
  const [unRead, setUnRead] = useState(0);
  // 是否点击批量操作取消按钮
  const [clickCancel, setClickCancel] = useState(false);
  // // 列表顶部业务在邮件尝试错误捕获ref
  // const customerTipsRef = useRef();
  // 是否是聚合模式
  const isMerge = () => mailLogicStateIsMerge(selectedKeys.id, selectedKeys.accountId, isSearching);
  // 快捷键状态
  const [listModel] = useState2RM('defaultMailListSelectedModel');
  // // 任务邮件 展示tab
  const taskMailBoxTab = useMemo(() => selectedKeys.id == FLOLDER.TASK && !isSearching && isMainAccount(selectedKeys.accountId), [selectedKeys, isSearching]);
  // // 未保持草稿 是否展示
  // const unfinishedDraftTab = useMemo(() => selectedKeys.id == FLOLDER.DRAFT && isMainAccount(selectedKeys.accountId), [selectedKeys]);
  // 稍后处理 展示tab
  const deferBoxTab = useMemo(() => selectedKeys.id == FLOLDER.DEFER && !isSearching && isMainAccount(selectedKeys.accountId), [selectedKeys, isSearching]);

  // // 是否展示tab，jjwtodo：这里的17因为添加了更多的更多的文件夹（审核，未审核，订阅，隔离），是否应该改为100
  const filterShowFlag = useMemo(() => {
    // const searchingSelectedKey = (selectedSearchKeys[mailSearchAccount]?.folder || FLOLDER.SEARCH_ALL_RESULT);
    // return isSearching ?
    //   searchingSelectedKey && (searchingSelectedKey == FLOLDER.SEARCH_ALL_RESULT || searchingSelectedKey == FLOLDER.DEFAULT || +searchingSelectedKey >= 17) :
    //   selectedKeys && (selectedKeys.id == FLOLDER.DEFAULT || +selectedKeys.id >= 17)
    // 1.15版本，搜索模式下tab不展示
    // if (isSearching) {
    //   return false;
    // }
    // 邮件标签-没有筛选项
    if (selectedKeys.id === FLOLDER.TAG) {
      return false;
    }
    // 聚合模式下，走聚合模式的tab展示规则
    if (mailConfigStateIsMerge()) {
      return (
        selectedKeys && selectedKeys.id !== FLOLDER.SENT && selectedKeys.id !== FLOLDER.REDFLAG && selectedKeys.id !== FLOLDER.TAG && selectedKeys.id !== FLOLDER.DRAFT
      );
    } else {
      return selectedKeys && selectedKeys.id;
    }
  }, [isSearching, selectedKeys?.id, taskMailBoxTab, deferBoxTab]);

  const clickItem = useCallback(
    item => {
      if (filterShowFlag) {
        clickTab(item);
      } else if (taskMailBoxTab) {
        clickTaskTab(item);
      } else if (deferBoxTab) {
        clickDeferTab(item);
      }
    },
    [filterShowFlag, taskMailBoxTab, deferBoxTab, isSearching]
  );

  // 点击批量操作取消
  const handleCancel = () => {
    setClickCancel(true);
    setTimeout(() => {
      setClickCancel(false);
    }, 1000);
  };

  // 统计未读邮件tabs中的邮件数量
  useEffect(() => {
    // 如果展示tab，才计算未读数
    if (filterShowFlag && !isSearching) {
      const treeList = getTreeStatesByAccount(mailTreeStateMap, selectedKeys.accountId)?.mailFolderTreeList || [];
      if (treeList && treeList.length) {
        const map = {};
        treeDFS(
          treeList,
          (item: {
            entry: {
              mailBoxId: string | number;
            };
          }) => {
            map[item.entry.mailBoxId] = item;
          }
        );
        setUnread(map);
      }
    }
  }, [selectedKeys, mailTreeStateMap, isSearching, filterShowFlag]);

  // /**
  //  * 文件夹切换或者有换标的时候，尝试恢复报错的业务组件
  //  */
  // useEffect(() => {
  //   if (customerTipsRef?.current?.reset) {
  //     customerTipsRef?.current?.reset();
  //   }
  // }, [selectedKeys]);

  // 刷新邮件列表
  const refreshEmailList: (param: any) => void = (param = {}) => {
    const { noCache = false, showLoading = true } = param;
    dispatch(
      Thunks.refreshMailList({
        noCache,
        showLoading,
      })
    );
  };
  // refreshEmailList 的 ref
  const RefrefreshEmailList = useRef(refreshEmailList);
  RefrefreshEmailList.current = refreshEmailList;

  // 邮件全标记已读
  const handleAllRead = () => {
    dispatch(
      reducer.updateAllReadLoading({
        accountId: selectedKeys.accountId,
        folderId: selectedKeys.id,
        loading: true,
      })
    );
    return dispatch(
      Thunks.doActiveFolderAllRead({
        folderId: selectedKeys.id,
        isThread: isMerge(),
        accountId: selectedKeys.accountId,
      })
    )
      .unwrap()
      .finally(() => {
        dispatch(
          reducer.updateAllReadLoading({
            accountId: selectedKeys.accountId,
            folderId: selectedKeys.id,
            loading: false,
          })
        );
      });
  };

  // 邮件待办 全标已处理
  // const handleAllDefer = () => {
  //   dispatch(
  //     Thunks.doActiveAllReadDefer({
  //       folderId: selectedKeys.id,
  //       deferTime: selected === 'DEFER' ? `:${moment().format('YYYYMMDD')}` : undefined
  //     })
  //   );
  // };

  // 设置二级标签的未读数量
  const setUnread = (argMap?: any) => {
    const curTreeMap = getTreeStatesByAccount(mailTreeStateMap, selectedKeys.accountId)?.MailFolderTreeMap || {};
    const map = argMap || curTreeMap;
    let unread = 0;
    if (isMerge()) {
      unread = map[selectedKeys.id]?.entry?.threadMailBoxCurrentUnread;
    } else {
      unread = map[selectedKeys.id]?.entry?.mailBoxCurrentUnread;
    }
    setUnRead(unread);
  };
  // 优先，提示内容
  // const toolTipTitle = (
  //   <div style={{ fontSize: 12, margin: '2px 4px' }}>
  //     <div>{getIn18Text("1. LIANXI")}</div>
  //     <div style={{ marginTop: '10px' }}>{getIn18Text("2. LIANXI")}</div>
  //     <div style={{ marginTop: '10px' }}>{getIn18Text("3. LIANXI")}</div>
  //   </div>);
  // 渲染item
  // const renderItem = (item: { type: any; title: any; }) => {
  //   let dom;
  //   // 17版本智能模式下线
  //   // const active = item.type == (isSearching ? searchSelected : selected);
  //   // if (item.type === 'PREFERRED') {
  //   //   dom = (<>
  //   //     <span className="first-icon">{active ? <ReadListIcons.PreferredActiveSvg /> : <ReadListIcons.PreferredSvg />}</span>
  //   //     <Tooltip title={toolTipTitle} placement="bottom" trigger="hover" arrowPointAtCenter autoAdjustOverflow overlayStyle={{ maxWidth: '272px' }}>
  //   //       <QuestionCircleOutlined style={{ fontSize: 12, color: active ? '#ffffff' : '#a8aaad' }} />
  //   //     </Tooltip>
  //   //   </>);
  //   // }
  //   if (item.type === 'UNREAD') {
  //     dom = `${unReadStr}${showUnRead && unRead > 0 ? ' ' + unRead : ''}`;
  //   }
  //   else {
  //     dom = item.title;
  //   }
  //   return dom;
  // };
  // 点击tab
  const clickTab = async (item: any) => {
    if (isSearching) {
      setSearchSelected(item.type);
      refreshEmailList({});
    } else {
      setSelected(item.type);
      // 非搜索下打点
      try {
        // const temp = await mailConfApi.getIntBoxDefaultDisplayList();
        const folder_type = selectedKeys.id === 1 ? '系统收件箱' : selectedKeys.id >= 100 ? '自定义文件名' : '其他文件夹';
        // const original_display = temp ? '优先处理' : '全部邮件';
        const display_mode = isMerge() ? '聚合' : '普通';
        const classification = item.type === 'ALL' ? '全部邮件' : item.title;
        trackerApi.track('pc_intelligent_display_sort_pv', {
          folder_type,
          // original_display,
          classification,
          display_mode,
        });
      } catch (error) {}
    }
  };
  const clickTaskTab = (item: any) => {
    setSelected(item.type);
    try {
      trackerApi.track('pcMail_switchTab_taskMailList_mailListPage', {
        tabName: item.title,
      });
    } catch (error) {}
  };
  const clickDeferTab = (item: any) => {
    setSelected(item.type);
  };
  // 返回dom
  return (
    <>
      {/* 顶部tab */}
      {
        <>
          {
            // 外贸通，通栏下筛选UI不同，单独处理
            process.env.BUILD_ISEDM && isLong ? (
              <FilterTabEdmLong
                hiddenFilter={!filterShowFlag}
                unread={unRead}
                clickItem={clickItem}
                handleAllRead={handleAllRead}
                isMerge={isMerge}
                operElement={
                  <div
                    style={{ height: '100%' }}
                    className={classnames(['m-list-operation-new'], {
                      ['m-list-operation1-new']: true,
                      ['m-list-operation100-new']: listModel == LIST_MODEL.MULTIPLE,
                      ['m-list-cancel-new']: clickCancel,
                    })}
                  >
                    <MailMultOperation cancelFn={handleCancel} />
                  </div>
                }
              />
            ) : (
              <FilterTabPlus
                hiddenFilter={!filterShowFlag}
                unread={unRead}
                clickItem={clickItem}
                handleAllRead={handleAllRead}
                isMerge={isMerge}
                operElement={
                  <div
                    style={{ height: '100%' }}
                    className={classnames(['m-list-operation-new'], {
                      ['m-list-operation1-new']: true,
                      ['m-list-operation100-new']: listModel == LIST_MODEL.MULTIPLE,
                      ['m-list-cancel-new']: clickCancel,
                    })}
                  >
                    <MailMultOperation cancelFn={handleCancel} />
                  </div>
                }
              />
            )
          }
          {/* <FilterTabCompontent list={list} clickItem={clickItem} selectedType={selectedType} suffix={suffix} /> */}
          {/** todo: 下面的功能也需要迁移走 */}
          {/* {filterShowFlag && !isSearching
            ? isNoticeNum > 0 && (
                <div className="m-list-num" onClick={handleClickNew}>
                  {getIn18Text('FENGXINYOUJIAN', { count: isNoticeNum })}
                </div>
              )
            : ''} */}
        </>
      }
      {/** todo: 下面的入口需要迁移走 */}
      {/* <ErrorBoundary errorVisiable={false} ref={customerTipsRef} name="mailList-customer-tips"> */}
      {/* 云端邮件入口 */}
      {/* <CloudMailSearchEntry /> */}
      {/* 未保存草稿 */}
      {/* {unfinishedDraftTab && <UnfinishedDraftMailEntry />} */}
      {/* 免费版收件箱引导下单 */}
      {/* <PaidGuideTip /> */}
      {/* </ErrorBoundary> */}
    </>
  );
};
export default FilterTab;
