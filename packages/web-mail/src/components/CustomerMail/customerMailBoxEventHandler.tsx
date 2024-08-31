import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { apiHolder as api, apis, CustomerMapChangeEvent, DataTrackerApi, locationHelper, MailApi, SystemEvent } from 'api';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { actions as mailTabActions, tabId, tabType } from '@web-common/state/reducer/mailTabReducer';
// import { syncCustomerTimer } from '@web-mail/state/slice/customerMailReducer/thunks/mailBoxThunks_cm';

import { setCurrentAccount } from '@web-mail/util';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { useState2CustomerSlice } from '@web-mail/hooks/useState2SliceRedux';
import { doUpdateMyCustomerListSort } from '@web-common/state/reducer/contactReducer';
import { debounce } from 'lodash';

const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
// const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const loggerApi: DataTrackerApi = api.api.requireLogicalApi(apis.loggerApiImpl) as DataTrackerApi;

type refreshEmailListParam = {
  noCache?: boolean;
  showLoading?: boolean;
  accountId: string;
};

const CustomerMailBoxEventHandler: React.FC = () => {
  const dispatch = useAppDispatch();
  // const reducer = useActions(MailActions);

  /**
   * redux 状态
   */
  const currentTabId = useAppSelector(state => state.mailTabReducer.currentTab.id);
  const currentTabType = useAppSelector(state => state.mailTabReducer.currentTab.type);

  const sliceId = useMemo(() => {
    let id = currentTabId;
    if (currentTabType !== tabType.customer) {
      id = tabId.readCustomer;
    }
    return id;
  }, [currentTabId, currentTabType]);

  // 当前选中的模块
  const curActiveKey = useAppSelector(state => state.globalReducer.activeKey);
  // 邮件仓库
  const mailEntities = useAppSelector(state => state.mailReducer.mailEntities);
  // 已读未读、红旗，标签等状态修改是否展示toast
  const [, setHideMessage] = useState2RM('hideMessage', 'doUpdateMsgHideMessage');
  // 未读数map
  const [unReadMap] = useState2RM('unReadMap_cm');
  // 搜索类型
  const [mailSearching, setMailSearching] = useState2CustomerSlice('mailSearching');
  // 是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
  // 客户列表-搜索的关键词
  const [searchValue] = useState2CustomerSlice('searchValue');
  // 搜索列表-文件夹-树形结构-分页大小
  const [searchTreeListPageSize] = useState2CustomerSlice('searchTreeListPageSize');
  // 分栏通栏
  // const [configMailLayout] = useState2RM('configMailLayout', 'doUpdateConfigMailLayout');
  // const isLeftRight = useMemo(() => configMailLayout === '1', [configMailLayout]);

  /**
   * redux - slice
   */
  // 刷新按钮-loading状态
  // const [, setRefreshBtnLoading] = useState2CustomerSlice('refreshBtnLoading', undefined, sliceId);
  const [selectedMail] = useState2CustomerSlice('selectedMailId', undefined, sliceId);
  // 邮件列表-文件夹-树形结构-list
  // const [treeList] = useState2CustomerSlice('customerTreeList', undefined, sliceId);
  // 邮件列表-选中的邮件 id list
  const [, setActiveIds] = useState2CustomerSlice('activeIds', undefined, sliceId);

  /**
   * 衍生状态
   */
  // 『客户』Tab
  const isCustomerTab = useMemo(() => currentTabId === tabId.readCustomer, [currentTabId]);

  // 刷新文件夹
  const refreshFolderHandler = async (limit?: number, showLoading = false) => {
    if (isSearching) {
      // 刷新搜索客户列表
      dispatch(Thunks.doSearchCustomers_useMailPlusApi({ query: searchValue, pageSize: searchTreeListPageSize, pageNum: 1, sliceId }));
    } else {
      // 刷新客户列表
      await dispatch(Thunks.loadCustomerList_cm({ showLoading, limit, sliceId, refresh: true }));
      // 刷新邮件列表
      dispatch(Thunks.loadMailList_edm({ noCache: false, showLoading, accountId: '', sliceId, type: 'customer' }));
    }
  };

  // 通栏和三栏切换的时候，取消邮件列表的多选状态
  // useEffect(() => {
  //   // reducer,对同类型的所有activeId进行处理，置空
  //   dispatch(reducer.clearAllCustomerMailActiveIds({}));
  // }, [isLeftRight]);

  const init = useRef(false);

  const refreshPageDebounce = useCallback(
    debounce(
      sliceId => {
        console.log('refreshPageDebounce fired');
        dispatch(Thunks.refreshPage_cm({ sliceId }));
      },
      5 * 60 * 1000,
      { leading: true }
    ),
    []
  );

  // 切回了邮件模块
  useEffect(() => {
    if (curActiveKey === 'mailbox') {
      if (init.current) {
        setTimeout(() => {
          refreshPageDebounce(sliceId);
        }, 1000);
      } else {
        init.current = true;
      }
    }
  }, [curActiveKey]);

  useEffect(() => {
    if (isCustomerTab) {
      // 更新未初始化完成的客户的未读数
      const customerIds = Object.keys(unReadMap.customerMap).filter(id => unReadMap.customerMap[id] && !unReadMap.customerMap[id].initialized);
      getUnRead(customerIds);
    }
  }, [curActiveKey]);

  const showCustomerTab = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CONTACT_EMAIL', 'VIEW'));

  useEffect(() => {
    dispatch(mailTabActions.configCustomerTab(showCustomerTab));
    loggerApi.track('show_customer_mail_tab', { showCustomerTab });
    if (showCustomerTab) {
      // 预热更新
      getUnRead();
    }
  }, [showCustomerTab]);

  // 处理邮件相关的消息变化
  const handleMailChange = (ev: SystemEvent) => {
    if (!isCustomerTab) {
      return;
    }
    try {
      const { eventStrData, eventData } = ev;
      if (eventStrData === 'data') {
        // TODO：客户模块下新邮件的插入暂时没做
        // if (locationHelper.testPathMatch('/')) {
        //   const { fid } = eventData;
        //   // 判断推动的邮件是否属于当前文件夹
        //   if (fid && fid?.has(selectedKeys.id)) {
        //     // 拉取当前文件夹最新的邮件-插入新邮件到列表头部
        //     dispatch(Thunks.pullLastMail());
        //   }
        // }
      } else if (eventStrData == 'refresh') {
        refreshEmailList({ noCache: true, accountId: '' });
        refreshFolderHandler(30);
      } else if (eventStrData == 'refreshFolder') {
        if (locationHelper.testPathMatch('/')) {
        }
      } else if (eventStrData == 'syncFolder') {
        if (locationHelper.testPathMatch('/')) {
        }
      } else if (eventStrData == 'refreshCustomer') {
        // 当客户列表有新邮件来的时候，
        const { senderIdList, receiverIdList, type } = eventData || {};
        // 刷新客户列表
        if (['all', 'list'].includes(type)) {
          doUpdateMyCustomerListSort(senderIdList);
        }
        // 刷新未读数
        if (['all', 'unread'].includes(type)) {
          setTimeout(() => {
            getUnRead([...senderIdList, ...receiverIdList]);
          }, 1000);
        }
        // 刷新客户邮件
        if (['all', 'mail'].includes(type)) {
          dispatch(Thunks.pullLastMail_cm({ sliceId }));
          refreshMailContent();
        }
        // // 修改客户列表，把新来的邮件写回列表
        // reducer.appendNewCustomerMail_cm(customerData);
      }
      // else if (eventStrData == 'syncCustomerList') {
      //   TODO // 同步邮件客户列表
      //   if (treeList && treeList.length) {
      //     dispatch(
      //       Thunks.syncCustomerList_cm({
      //         limit: treeList?.length,
      //         sliceId,
      //       })
      //     );
      //   }
      // }
    } catch (e) {
      console.error(e);
    }
  };

  // 处理客户列表的消息变化
  // const handleContactEdmNotify = useCallback(
  //   (ev: SystemEvent) => {
  //     const isSyncing = contactApi.getContactSyncState('customer');
  //     console.log('handleContactEdmNotify', ev.eventData, 'isSyncing', isSyncing);
  //     if (ev.eventStrData === 'notifyAll' && ev.eventData?.type === 'customer' && !isSyncing) {
  //       setRefreshBtnLoading(false);
  //       if (Array.isArray(ev.eventData?.contactList) && ev.eventData?.contactList.length > 0) {
  //         refreshFolderHandler();
  //         refreshMailContent();
  //       }
  //       syncCustomerTimer.cancelSyncRace();
  //     }
  //   },
  //   [selectedMail, mailEntities]
  // );

  const refreshMailContent = () => {
    if (selectedMail.id) {
      if (mailEntities && mailEntities[selectedMail.id]?.isTpMail) {
        // setCurrentAccount();
        mailApi.doGetTpMailContent({ mid: selectedMail.id }, true).catch();
      } else {
        // setCurrentAccount();
        mailApi.doGetMailContent(selectedMail.id, false, true, undefined, { noContactRace: true }).catch();
      }
    }
  };

  // 刷新邮件列表
  const refreshEmailList: (param?: refreshEmailListParam) => void = (param = {} as refreshEmailListParam) => {
    const { noCache = false, showLoading = true, accountId } = param;
    dispatch(
      Thunks.loadMailList_edm({
        noCache,
        showLoading,
        accountId,
        sliceId,
        type: 'customer',
      })
    );
  };

  /**
   * 请求页签未读数（预热）
   */
  useEffect(() => {
    getUnRead();
  }, []);

  // 获取未读数
  const getUnRead = async (customerIds?: string[]) => dispatch(Thunks.getUnread_cm({ customerIds }));

  const handlerCustomerMapChange = async (e: SystemEvent) => {
    const eventData = e.eventData as CustomerMapChangeEvent;
    if (eventData.target === 'myCustomerList') {
      refreshFolderHandler(undefined, false);
    }
  };

  /**
   * 全局消息处理
   */
  // 处理邮件状态对反向变化消息
  useMsgRenderCallback('mailChanged', handleMailChange);

  // 监听红旗邮件的状态变化
  useMsgRenderCallback('mailStatesChanged', ev => {
    if (!isCustomerTab) {
      return;
    }
    try {
      if (ev && !ev.isStick) {
        const { eventStrData, eventData = {} } = ev;
        const { hideMessage: _hideMessage } = eventData;
        setHideMessage(!!_hideMessage);
        if (eventStrData === 'clearCheckedMails') {
          setActiveIds([]);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
  });

  // 处理客户联系人列表变化的消息
  useMsgRenderCallback('customerMapChangeNotify', handlerCustomerMapChange);

  // 处理邮件状态对反向变化消息
  // useMsgRenderCallback('mailChanged', ev => {
  //   try {
  //     const { eventStrData, eventData } = ev;
  //     if (eventStrData == 'refreshCustomerUnread') {
  //       const { customerIds } = eventData;
  //       getUnRead(customerIds);
  //     } else if (eventStrData == 'refreshCustomerMail') {
  //       dispatch(Thunks.pullLastMail_cm({ sliceId }));
  //     }
  //   } catch (e) {
  //     console.error(e);
  //   }
  // });

  return <></>;
};

export default CustomerMailBoxEventHandler;
