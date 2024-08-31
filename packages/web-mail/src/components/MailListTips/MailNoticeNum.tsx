/**
 * 邮件列表-顶部-提示栏-容器组件
 * 用于容纳在邮件列表顶部的提示栏业务
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { isMainAccount, mailConfigStateIsMerge } from '@web-mail/util';
import { getIn18Text, SystemEvent } from 'api';
import { FLOLDER } from '@web-mail/common/constant';
import useShouldUseRealList from '@web-mail/hooks/useShouldUseRealList';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';

interface props {}

const MailNoticeNum: React.FC<props> = (props: props) => {
  // const { onClick } = props;
  // 选中的文件夹
  const [selectedKeys] = useState2RM('selectedKeys');
  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2RM('mailSearching');
  // 邮件-搜索-是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
  // 新邮件提醒
  const [isNoticeNum, setIsNoticeNum] = useState2RM('noticeNum');
  // 是否使用实体列表
  const shouldUseRealList = useShouldUseRealList();
  // 实体分页当前页
  const [currentPage, setCurrentPage] = useState2RM('realListCurrentPage', 'doUpdateRealListPage');
  // 邮件列表宽高设置
  const [, setScrollTop] = useState2RM('scrollTop');

  // 任务邮件 展示tab
  // const taskMailBoxTab = useMemo(() => selectedKeys.id == FLOLDER.TASK && !isSearching && isMainAccount(selectedKeys.accountId), [selectedKeys, isSearching]);

  // 是否展示tab
  const filterShowFlag = useMemo(() => {
    // 邮件标签-没有筛选项
    if (selectedKeys.id === FLOLDER.TAG) {
      return false;
    }
    const excludedFolders = [FLOLDER.SENT, FLOLDER.REDFLAG, FLOLDER.TAG, FLOLDER.DRAFT, FLOLDER.DELETED, FLOLDER.SPAM];
    return selectedKeys && !excludedFolders.includes(selectedKeys?.id);
  }, [isSearching, selectedKeys?.id]);

  const handleNewMailBarClick = useCallback(() => {
    setIsNoticeNum(0);
    // 列表st因为性能优化不再受控，只接受为0的回到顶部操作
    // 滑动到制定邮件下方
    // const topHeight = getTopMailSumHeight(mailList);
    if (!shouldUseRealList || (shouldUseRealList && currentPage === 1)) {
      setScrollTop(0);
    }
    if (shouldUseRealList && currentPage > 1) {
      //@ts-ignore
      setCurrentPage({ page: 1 });
    }
  }, []);

  /**
   * 当文件夹变化的时候，清除新邮件提醒
   */
  useEffect(() => {
    setIsNoticeNum(0);
  }, [selectedKeys?.id + (selectedKeys?.accountId || '')]);

  // 当邮件模式变化的收，也清楚新邮件提醒
  useMsgRenderCallback('mailChanged', (ev: SystemEvent) => {
    const { eventStrData } = ev;
    if (eventStrData == 'mailMergeModelChange') {
      setIsNoticeNum(0);
    }
  });

  return filterShowFlag && !isSearching && isNoticeNum > 0 ? (
    <div className="m-list-num" onClick={handleNewMailBarClick}>
      {getIn18Text('FENGXINYOUJIAN', { count: isNoticeNum })}
    </div>
  ) : (
    <></>
  );
};

export default MailNoticeNum;
