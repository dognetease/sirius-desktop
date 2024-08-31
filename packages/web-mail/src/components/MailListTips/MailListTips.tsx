/**
 * 邮件列表-顶部-提示栏-容器组件
 * 用于容纳在邮件列表顶部的提示栏业务
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { mailLogicStateIsMerge, getTreeStatesByAccount, folderIdIsContact } from '@web-mail/util';
import { getIn18Text, inWindow } from 'api';
import { KEEP_PERIOS, FLOLDER } from '@web-mail/common/constant';
import AutoReplyTips from './AutoReplyTips';
import PaidGuideTip from '@web-mail/components/PaidGuideModal/paidGuideTip';
import UnfinishedDraftMailEntry from '@web-mail/components/MailColumnEntry/unfinishedDraftMailEntry/unfinishedDraftMailEntry';
import CloudMailSearchEntry from '@web-mail/components/MailColumnEntry/cloudMailSearchEntry/cloudMailSearchEntry';
import ErrorBoundary from '@web-common/hooks/ErrorBoundary';
import MailNoticeNum from './MailNoticeNum';

interface MailListTipsProps {}

const MailListTips: React.FC<MailListTipsProps> = (props: MailListTipsProps) => {
  // 列表顶部业务在邮件尝试错误捕获ref
  const customerTipsRef = useRef();
  // 是否展示星标联系人是否在构建中-tip
  const [showStarContactBuildingTip] = useState2RM('showStarContactBuildingTip');
  // 选中的文件夹
  const [selectedKeys] = useState2RM('selectedKeys');
  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2RM('mailSearching');
  // 邮件-搜索-是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
  // 是否展示聚合邮件-构建中-tip
  const [showThreadBuildingTip] = useState2RM('showThreadBuildingTip');
  // 判断是否属于逻辑聚合模式
  const isMerge = useMemo(() => mailLogicStateIsMerge(selectedKeys?.id, selectedKeys?.accountId, isSearching), [selectedKeys, isSearching]);
  // 邮件文件夹相关状态map
  const [mailTreeStateMap] = useState2RM('mailTreeStateMap');

  // 星标联系人是否在构建中
  const logicshowStarContactBuildingTip = useMemo(() => {
    return showStarContactBuildingTip && folderIdIsContact(selectedKeys?.id) && !isSearching;
  }, [showStarContactBuildingTip, selectedKeys?.id, isSearching]);

  /**
   * 星标联系人的构建中-tip
   */
  const StarContactBuildingTip = useMemo(() => {
    return logicshowStarContactBuildingTip ? <div className="u-alert">{getIn18Text('WANGLAIYOUJIANBUILDTIP')}</div> : <></>;
  }, [logicshowStarContactBuildingTip]);

  /**
   * 聚合邮件构建中tip
   */
  const ThreadMailBuildingTip = useMemo(() => {
    return isMerge && showThreadBuildingTip ? <div className="u-alert">{getIn18Text('JUHEYOUJIANSHU')}</div> : <></>;
  }, [showThreadBuildingTip, isMerge]);

  // 获取当前目录的过期时间
  const getKeepPeriodByFolderId = useCallback(
    (folderId: number): number => {
      const treeMap = getTreeStatesByAccount(mailTreeStateMap, selectedKeys.accountId)?.MailFolderTreeMap;
      if (treeMap) {
        const folderItem = treeMap[folderId + ''];
        const folderKeepPeriod = folderItem?.entry?.keepPeriod;
        if (!folderKeepPeriod) {
          return KEEP_PERIOS;
        }
        return folderKeepPeriod;
      }
      return KEEP_PERIOS;
    },
    [mailTreeStateMap, selectedKeys?.accountId]
  );
  /**
   * 广告邮件提示
   */
  const AdFolderTip = useMemo(() => {
    return inWindow() && !isSearching && selectedKeys && selectedKeys.id == FLOLDER.ADVITISE ? (
      <div className="u-alert">{getIn18Text('GUANGGAOYOUJIANTIANHZDSCYKQZDLJ', { day: getKeepPeriodByFolderId(FLOLDER.ADVITISE) })}</div>
    ) : null;
  }, [isSearching, selectedKeys.id]);

  /**
   * 草稿箱提示
   */
  const SpamFolderTip = useMemo(() => {
    return !isSearching && selectedKeys && selectedKeys.id == FLOLDER.SPAM ? (
      <div className="u-alert">{getIn18Text('LAJIYOUJIANTIANHZDSC(YKQZDLJ)', { day: getKeepPeriodByFolderId(FLOLDER.SPAM) })}</div>
    ) : null;
  }, [isSearching, selectedKeys?.id]);

  /**
   * 删除文件夹提示
   */
  const DeleteFolderTip = useMemo(() => {
    return !isSearching && selectedKeys && selectedKeys.id == FLOLDER.DELETED ? (
      <div className="u-alert">{getIn18Text('YISHANCHUYOUJIANTHZDCDSC', { day: getKeepPeriodByFolderId(FLOLDER.DELETED) })}</div>
    ) : null;
  }, [isSearching, selectedKeys?.id]);

  /**
   * 文件夹切换或者有换标的时候，尝试恢复报错的业务组件
   */
  useEffect(() => {
    if (customerTipsRef?.current?.reset) {
      customerTipsRef?.current?.reset();
    }
  }, [selectedKeys]);

  return (
    <ErrorBoundary errorVisiable={false} ref={customerTipsRef} name="mailList-tips-wrap">
      {/** 自动回复提示 */}
      <AutoReplyTips />
      {/** 已删除提示 */}
      {DeleteFolderTip}
      {/** 草稿箱提示 */}
      {SpamFolderTip}
      {/** 广告邮件提示 */}
      {AdFolderTip}
      {/** 聚合邮件-构建ing */}
      {ThreadMailBuildingTip}
      {/** 星标联系人-构建ing */}
      {StarContactBuildingTip}
      {/* 云端邮件入口 */}
      <CloudMailSearchEntry />
      {/* 未保存草稿 */}
      {<UnfinishedDraftMailEntry />}
      {/* 免费版收件箱引导下单 */}
      <PaidGuideTip />
      {/* 新邮件提醒 */}
      <MailNoticeNum></MailNoticeNum>
    </ErrorBoundary>
  );
};

export default MailListTips;
