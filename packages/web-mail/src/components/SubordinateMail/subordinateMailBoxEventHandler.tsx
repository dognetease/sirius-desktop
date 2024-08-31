import React, { useEffect, useMemo } from 'react';
import { apiHolder as api, apis, DataTrackerApi, locationHelper, MailApi, SystemEvent } from 'api';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { tabId, tabType } from '@web-common/state/reducer/mailTabReducer';
import { syncSubordinateTimer } from '@web-mail/state/slice/subordinateMailReducer/thunks/mailBoxThunks_sd';
import { actions as mailTabActions } from '@web-common/state/reducer/mailTabReducer';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { useState2SubordinateSlice } from '@web-mail/hooks/useState2SliceRedux';

const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const loggerApi: DataTrackerApi = api.api.requireLogicalApi(apis.loggerApiImpl) as DataTrackerApi;

type refreshEmailListParam = {
  noCache?: boolean;
  showLoading?: boolean;
  accountId: string;
};

const SubordinateMailBoxEventHandler: React.FC = () => {
  const dispatch = useAppDispatch();

  /**
   * redux 状态
   */
  const currentTabId = useAppSelector(state => state.mailTabReducer.currentTab.id);
  const currentTabType = useAppSelector(state => state.mailTabReducer.currentTab.type);

  const sliceId = useMemo(() => {
    let id = currentTabId;
    if (currentTabType !== tabType.subordinate) {
      id = tabId.subordinate;
    }
    return id;
  }, [currentTabId, currentTabType]);

  // 已读未读、红旗，标签等状态修改是否展示toast
  const [, setHideMessage] = useState2RM('hideMessage', 'doUpdateMsgHideMessage');

  /**
   * redux - slice
   */
  const [selectedMail] = useState2SubordinateSlice('selectedMailId', undefined, sliceId);
  // 邮件列表-选中的邮件 id list
  const [, setActiveIds] = useState2SubordinateSlice('activeIds', undefined, sliceId);
  // 收信按钮-loading状态
  const [, setRefreshBtnLoading] = useState2SubordinateSlice('refreshBtnLoading', undefined, sliceId);
  // 邮件列表-文件夹-树形结构-list
  const [treeList] = useState2SubordinateSlice('customerTreeList', undefined, sliceId);

  /**
   * 衍生状态
   */
  // 『客户』Tab
  const isSdTab = useMemo(() => currentTabId === tabId.subordinate, [currentTabId]);

  // 刷新文件夹
  const refreshFolderHandler = (showLoading = false) => {
    dispatch(Thunks.refreshFolder_sd({ showLoading, sliceId }));
  };

  const showSdTab = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'COLLEAGUE_EMAIL', 'VIEW'));

  // 综合判断是否展示下属邮件tab
  useEffect(() => {
    const hasSd = treeList && treeList.length && treeList[0]?.children && treeList[0]?.children.length;
    const showTab = showSdTab && hasSd;
    dispatch(mailTabActions.configSdTab(!!showTab));
    loggerApi.track('show_subordinate_mail_tab', { showSdTab, hasSd });
  }, [showSdTab, treeList]);

  // 处理邮件相关的消息变化
  const handleMailChange = (ev: SystemEvent) => {
    if (!isSdTab) {
      return;
    }
    try {
      const { eventStrData } = ev;
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
        refreshFolderHandler();
      } else if (eventStrData == 'refreshFolder') {
        if (locationHelper.testPathMatch('/')) {
          refreshFolderHandler();
        }
      } else if (eventStrData == 'syncFolder') {
        if (locationHelper.testPathMatch('/')) {
          refreshFolderHandler();
        }
      } else if (eventStrData == 'showDescChange' || eventStrData == 'showAttachmentChange') {
        // 摘要和附件显示变化
        refreshEmailList({ accountId: '' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 处理客户列表的消息变化
  const handleColleagueEdmNotify = () => {
    setRefreshBtnLoading(false);
    refreshFolderHandler();
    refreshMailContent();
    syncSubordinateTimer.cancelSyncRace();
  };

  const refreshMailContent = () => {
    if (selectedMail.id) {
      mailApi.doGetTpMailContent(
        {
          mid: selectedMail.id,
        },
        true
      );
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
        type: 'subordinate',
        sliceId,
      })
    );
  };

  /**
   * 全局消息处理
   */
  // 处理邮件状态对反向变化消息
  useMsgRenderCallback('mailChanged', handleMailChange);

  // 下属列表同步更新完成
  useMsgRenderCallback('colleagueEdmNotify', handleColleagueEdmNotify);

  // 监听红旗邮件的状态变化
  useMsgRenderCallback('mailStatesChanged', ev => {
    if (!isSdTab) {
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

  return <></>;
};

export default SubordinateMailBoxEventHandler;
