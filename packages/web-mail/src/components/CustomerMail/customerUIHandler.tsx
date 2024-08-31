import React, { useEffect, useMemo } from 'react';
import { MailEntryModel, apiHolder as api, SystemApi } from 'api';
import useMailStore from '@web-mail/hooks/useMailStoreRedux';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { LIST_MODEL } from '@web-mail/common/constant';
import { useState2CustomerSlice } from '@web-mail/hooks/useState2SliceRedux';
import { tabId, tabType } from '@web-common/state/reducer/mailTabReducer';
// import { syncCustomerTimer } from '@web-mail/state/slice/customerMailReducer/thunks/mailBoxThunks_cm';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { useCanUpdate } from '@web-mail/hooks/useCanUpdate';
import { loadEdmMailListParam } from '@web-mail/types';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';

// import { getPrivilegeAsync } from '@web-common/state/reducer/privilegeReducer';
const eventApi = api.api.getEventApi();
const systemApi = api.api.getSystemApi() as SystemApi;

const CustomerUIEventHandler: React.FC<{ sliceId: string }> = props => {
  // sliceId 只能是customer相关tab的id
  const { sliceId } = props;
  const dispatch = useAppDispatch();
  const canUpdateRef = useCanUpdate(sliceId);

  // const isFirstSwitchTab = useRef<boolean>(true);

  // 邮件列表
  const [mailDataList] = useMailStore('mailDataList', undefined, sliceId, 'customer');
  /**
   * redux - slice
   */
  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2CustomerSlice('mailSearching', undefined, sliceId);
  // 搜索列表-文件夹-选中的key
  const [selectedSearchKeys] = useState2CustomerSlice('selectedSearchKeys', undefined, sliceId);
  // 邮件列表-文件夹-选中的key
  const [selectedKeys] = useState2CustomerSlice('selectedKeys', undefined, sliceId);
  // 邮件列表-选中的邮件 id list
  const [activeIds, setActiveIds] = useState2CustomerSlice('activeIds', undefined, sliceId);
  // 邮件列表-上部-二级tab选中
  const [selected] = useState2CustomerSlice('mailListStateTab', undefined, sliceId);
  // 搜索列表-上部-二级tab选中
  const [searchSelected] = useState2CustomerSlice('searchListStateTab', undefined, sliceId);
  const [, setListModel] = useState2CustomerSlice('defaultMailListSelectedModel', undefined, sliceId);
  // 当前选中的模块
  // const curActiveKey = useAppSelector(state => state.globalReducer.activeKey);
  const currentTabId = useAppSelector(state => state.mailTabReducer.currentTab.id);
  const currentTabType = useAppSelector(state => state.mailTabReducer.currentTab.type);
  const isCustomerTab = useMemo(() => currentTabId === tabId.readCustomer || currentTabType === tabType.customer, [currentTabId, currentTabType]);

  const [, setRefreshBtnLoading] = useState2CustomerSlice('refreshBtnLoading', undefined, sliceId);

  // 当前邮件视图模式,通栏视图不展示批量操作
  const [configMailLayout] = useState2RM('configMailLayout');
  // 是否通栏布局
  const isColumnLayout = useMemo(() => +configMailLayout === 2, [configMailLayout]);

  // 保证初始化在切换到客户Tab下时执行一次
  // const initDone = useRef(false);

  // 刷新文件夹
  const refreshFolderHandler = (showLoading = false) => dispatch(Thunks.loadCustomerList_cm({ showLoading, limit: 30, sliceId }));

  // 初始化
  useEffect(() => {
    // 切回了邮件模块
    if (isCustomerTab) {
      if (canUpdateRef.current) {
        setRefreshBtnLoading(true);
        refreshFolderHandler(true);
        //
        // let times = 2 * 1000;
        // if (isFirstSwitchTab.current) {
        //   times = 5 * 1000;
        //   isFirstSwitchTab.current = false;
        // }
        // // 延迟 10 s开始同步全量客户，让我的客户列表尽早展示
        // setTimeout(() => {
        //   dispatch(getPrivilegeAsync())
        //     .then(() => {
        //       refreshFolderHandler();
        //       return syncCustomerTimer
        //         .startSyncRace(() => setRefreshBtnLoading(false))
        //         .then((res: any) => {
        //           if (res?.syncFinish) {
        //             setRefreshBtnLoading(false);
        //           }
        //           if (res?.error) {
        //             console.error('sync error', res?.error);
        //           }
        //         })
        //         .catch(() => {});
        //     })
        //     .catch(error => {
        //       console.error('getPrivilegeAsync error', error);
        //     });
        // }, times);
      }
    }
  }, [currentTabId]);

  // 通栏下切换到邮箱主页签或者客户主页签，则收起右侧边栏
  useEffect(() => {
    if (isColumnLayout && (currentTabType === tabType.customer || currentTabType === tabType.readMain)) {
      if (systemApi.inEdm()) {
        eventApi.sendSysEvent({
          eventName: 'mailMenuOper',
          eventStrData: 'headerCardVisible',
          eventData: { hide: true },
        });
      }
    }
  }, [isColumnLayout, currentTabType]);
  /**
   * 衍生状态
   */
  // 邮件-搜索-是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);

  // 列表变化的时候，同步一下activeIds
  useEffect(() => {
    if (canUpdateRef.current) {
      if (isSearching) {
        // TODO 搜索列表页需要
      } else {
        const res = (activeIds as string[]).filter(item => !!(mailDataList as MailEntryModel[]).find(mail => mail.entry.id == item));
        if (res.length != activeIds.length) {
          setActiveIds(res);
        }
      }
    }
  }, [mailDataList, isSearching]);

  // 在页签创建后，请求默认列表
  useEffect(() => {
    if (canUpdateRef.current && (!mailDataList || mailDataList.length == 0)) {
      const params: loadEdmMailListParam = {
        noCache: isSearching,
        startIndex: 0,
        type: 'customer',
        sliceId,
      };
      dispatch(Thunks.loadMailList_edm(params));
    }
  }, [selectedKeys?.id]);

  // 列表多选态外部打破
  useEffect(() => {
    if (!canUpdateRef.current) {
      setActiveIds([]);
      setListModel(LIST_MODEL.INIT);
    }
  }, [isSearching, selectedKeys, selected, searchSelected, selectedSearchKeys]);

  return <></>;
};

export default CustomerUIEventHandler;
