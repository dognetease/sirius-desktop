import React, { useEffect, useMemo } from 'react';
import { MailEntryModel } from 'api';
import useMailStore from '@web-mail/hooks/useMailStoreRedux';
import { LIST_MODEL } from '@web-mail/common/constant';
import { useState2SubordinateSlice } from '@web-mail/hooks/useState2SliceRedux';
import { useCanUpdate } from '@web-mail/hooks/useCanUpdate';
import { syncSubordinateTimer } from '@web-mail/state/slice/subordinateMailReducer/thunks/mailBoxThunks_sd';
import { tabId } from '@web-common/state/reducer/mailTabReducer';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { Thunks } from '@web-common/state/reducer/mailReducer';

const SubordinateUIEventHandler: React.FC<{ sliceId: string }> = props => {
  // sliceId 只能是subordinate相关tab的id
  const { sliceId } = props;
  const dispatch = useAppDispatch();

  const canUpdateRef = useCanUpdate(sliceId);

  // 邮件列表
  const [mailDataList] = useMailStore('mailDataList', undefined, sliceId, 'subordinate');

  /**
   * redux - slice
   */
  // 当前选中的模块
  const curActiveKey = useAppSelector(state => state.globalReducer.activeKey);
  const currentTabId = useAppSelector(state => state.mailTabReducer.currentTab.id);
  // 邮件列表-文件夹-选中的key
  const [selectedKeys] = useState2SubordinateSlice('selectedKeys', undefined, sliceId);
  // 邮件列表-选中的邮件 id list
  const [activeIds, setActiveIds] = useState2SubordinateSlice('activeIds', undefined, sliceId);
  // 邮件列表-上部-二级tab选中
  const [selected] = useState2SubordinateSlice('mailListStateTab', undefined, sliceId);
  // 搜索列表-上部-二级tab选中
  const [, setListModel] = useState2SubordinateSlice('defaultMailListSelectedModel', undefined, sliceId);
  // 收信按钮-loading状态
  const [, setRefreshBtnLoading] = useState2SubordinateSlice('refreshBtnLoading', undefined, sliceId);

  // 『下属』Tab
  const isSdTab = useMemo(() => currentTabId === tabId.subordinate, [currentTabId]);

  // 刷新文件夹
  const refreshFolderHandler = (showLoading = false) => {
    dispatch(Thunks.refreshFolder_sd({ showLoading, sliceId }));
  };

  // 初始化
  useEffect(() => {
    if (curActiveKey === 'mailbox') {
      if (isSdTab) {
        setRefreshBtnLoading(true);
      }
      syncSubordinateTimer.startSyncRace(() => setRefreshBtnLoading(false)).catch(() => {});
      // 刷新下属列表
      refreshFolderHandler();
    }
  }, [currentTabId, isSdTab, curActiveKey]);

  // 列表变化的时候，同步一下activeIds
  useEffect(() => {
    if (canUpdateRef.current) {
      const res = (activeIds as string[]).filter(item => !!(mailDataList as MailEntryModel[]).find(mail => mail.entry.id == item));
      if (res.length != activeIds.length) {
        setActiveIds(res);
      }
    }
  }, [mailDataList]);

  // 列表多选态外部打破
  useEffect(() => {
    if (canUpdateRef.current) {
      setActiveIds([]);
      setListModel(LIST_MODEL.INIT);
    }
  }, [selectedKeys, selected]);

  return <></>;
};

export default SubordinateUIEventHandler;
