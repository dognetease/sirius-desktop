/* eslint-disable react/no-array-index-key */
/* eslint-disable max-statements */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Collapse, Tooltip, Pagination, BackTop } from 'antd';
import classNames from 'classnames';
import {
  apiHolder as api,
  apis,
  MailEntryModel,
  MailConfApi,
  MailOperationType,
  SystemApi,
  inWindow,
  MailApi,
  MailEmoticonInfoModel,
  apiHolder,
  HtmlApi,
  TranslatStatusInfo,
} from 'api';
import MailTag from '../MailTag/MailTag';
import { MailStatus, formatDigitalTime, getTreeStatesByAccount } from '../../util';
import './index.scss';
import Header from './Header';
import Content, { ContentRef } from './content/Content';
import Toobar from './Toobar';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import ReplyWrap from './ReplyWrap';
import { useAppSelector } from '@web-common/state/createStore';
import TitleWithContextMenu from './component/TitleContextMenu/TitleWithContextMenu';
import IconCard from '@web-common/components/UI/IconCard';
import { FeatureConfig, mailIdChangeRecord } from '../../types';
import useDebounceLocalData from '../../hooks/useDebounceLocalData';
import ContentTips from './ContentTips';
import ContentSearch from './ContentSearch';
import { ReactComponent as BackToTopNew } from '@/images/icons/back_to_top_new.svg';
// import { useWhyDidYouUpdate } from 'ahooks';
const { Panel } = Collapse;
const mailManagerApi = api.api.requireLogicalApi('mailConfApiImpl') as unknown as MailConfApi;
const eventApi = api.api.getEventApi();
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
// import HorizontalScrollBar from './scrollBar';
// import useThrottleForEvent from '../../hooks/useThrottleForEvent';
import { getIn18Text } from 'api';

interface Props {
  content: MailEntryModel;
  sliceId: string;
  translateInfo: TranslatStatusInfo;
  mailIdChangeRecord?: { current: mailIdChangeRecord | null };
  listData?: MailStatus;
  isUpDown?: boolean;
  readOnly?: boolean;
  searchInputVisible: boolean;
  setSearchInputVisible: React.Dispatch<boolean>;
  featureConfig?: FeatureConfig;
  handleTranslateLang(value: string): void;
  refreshData(): void;
  handleRemark(mark: boolean, mid: string | string[], type: MailOperationType, isThread?: boolean): void;
  // handleWithDraw(mid: string): void;
}
const MergeMail: React.FC<Props> = props => {
  const {
    refreshData,
    readOnly = false,
    sliceId,
    listData,
    content,
    translateInfo,
    mailIdChangeRecord,
    featureConfig,
    handleTranslateLang,
    handleRemark,
    // handleWithDraw,
    isUpDown,
  } = props;

  const systemApi = api.api.getSystemApi() as SystemApi;
  const htmlApi = apiHolder.api.requireLogicalApi(apis.htmlApi) as HtmlApi;
  const contentRef = useRef<ContentRef[]>([]);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  // const [emotionInfoMap, setEmotionInfoMap] = useState<Map<string, MailEmoticonInfoModel>>(new Map());
  // 本地的content缓存,邮件正文快速切换优化, 当有邮件正文的时候，绕过本次防抖
  const localContent = useDebounceLocalData<MailEntryModel>(content, {
    exception: data => !!data?.entry?.content?.content,
  });

  const [activeKey, setActiveKey] = useState<string[]>([]);

  const [emoticonInfo, setEmoticonInfo] = useState<MailEmoticonInfoModel>(); // 是否参与点赞

  // const mailTagListStore = useAppSelector(state => state.mailReducer.mailTagList);
  const mailTreeStateMap = useAppSelector(state => state.mailReducer.mailTreeStateMap);

  const mailTagListStore = useMemo(() => {
    const folderState = getTreeStatesByAccount(mailTreeStateMap, content?._account || '');
    if (folderState && folderState?.mailTagList) {
      return folderState?.mailTagList;
    }
    return [];
  }, [mailTreeStateMap, content?._account]);
  const [searchIndex, setSearchIndex] = useState(-1);
  const currentSearchState = useRef({
    index: -1,
    count: 0,
    text: '',
    matchCase: false, // 是否区分大小写
    wholeWord: false, // 是否需要整个单词匹配
    inSelection: false, // 是否在选中文本中搜索
  });

  // const [scrollLeft,setSL] = useState(0);
  // const [scrollWidth, setSW]  = useState(1536);

  useEffect(() => {
    setActiveKey([content?.entry?.id]);
  }, [content?.entry?.id]);

  // useWhyDidYouUpdate('MergeMail', { ...props, localContent, emotionInfoMap, preActiveKey, mailEditShow });

  const handleEmoticon = (data: MailEmoticonInfoModel, mid: string) => {
    setEmoticonInfo(data);
  };

  const ToobarElement = useMemo(() => {
    return <Toobar content={localContent} listData={listData} btnTheme="light" />;
  }, [localContent, listData]);

  const handleDeleteTag = useCallback((tagName: string, _mailList: MailEntryModel[]) => {
    const ids = _mailList.map(_ => _.entry.id);
    eventApi.sendSysEvent({
      eventName: 'mailTagChanged',
      eventData: {
        tagNames: [tagName],
        mailList: ids,
        // isThread: isThreadMail
      },
      eventStrData: 'untag',
    });
  }, []);

  // 标签组件
  const TagElement = useMemo(() => {
    const showTag = !localContent?.isTpMail;
    return showTag ? (
      <div className="mail-group-tag-warp">
        {localContent?.tags?.map(item => (
          <MailTag
            className="tag"
            closeable={!readOnly && featureConfig?.mailTagIsCloseAble}
            color={mailManagerApi.getTagColor(item)}
            onClose={() => {
              handleDeleteTag(item, [localContent]);
            }}
          >
            {item}
          </MailTag>
        ))}
      </div>
    ) : (
      <></>
    );
  }, [localContent, readOnly, mailTagListStore]);

  const account = localContent?._account || systemApi.getCurrentUser()?.id;

  const ReplyElement = useMemo(() => {
    return <ReplyWrap mid={localContent?.id} content={localContent} emoticonInfo={emoticonInfo} handleEmoticon={handleEmoticon} />;
  }, [localContent?.id, emoticonInfo, handleEmoticon]);

  const MailContentElement = useMemo(() => {
    return (
      <div className="mail-group-wrap">
        <Collapse ghost onChange={setActiveKey} activeKey={activeKey}>
          <Panel
            showArrow={false}
            header={
              activeKey.includes(localContent.entry.id) ? (
                <Header
                  // 聚合模式下的head按照聚合展示
                  sliceId={sliceId}
                  content={localContent}
                  listData={listData}
                  // handleWithDraw={handleWithDraw}
                  readOnly={readOnly || localContent?.localFilePath}
                  showMailDiscuss={featureConfig?.mailDiscuss}
                  mailTagCloseAble={featureConfig?.mailTagIsCloseAble}
                  showTag={false}
                  showTitle={false}
                />
              ) : (
                <div className="u-item-block">
                  <AvatarTag
                    size={32}
                    contactId={localContent?.sender?.contact?.contact?.id}
                    user={{
                      color: localContent?.sender?.contact?.contact?.color,
                      name: localContent?.sender?.contact?.contact?.contactName,
                      avatar: localContent?.sender?.contact?.contact?.avatar,
                    }}
                  />
                  <div className="u-item-block-content" style={{ width: localContent.taskId ? '50px' : '82px', marginRight: localContent.taskId ? '4px' : '16px' }}>
                    <div className="u-item-block-read" hidden={localContent.entry.readStatus === 'read'} />
                    {localContent.entry.suspiciousSpam && (
                      <div className="u-item-block-suspicious">
                        <ReadListIcons.SuspiciousSvg />
                      </div>
                    )}
                    {typeof localContent.entry.priority === 'number' && localContent.entry.priority < 2 && (
                      <Tooltip title={getIn18Text('JINJIYOUJIAN')} placement="top">
                        <div className="u-item-block-alarm">
                          <IconCard type="alarm" />
                        </div>
                      </Tooltip>
                    )}
                    {account === localContent?.sender?.contact?.contact?.accountName ? getIn18Text('WO') : localContent?.sender?.contact?.contact?.contactName}
                  </div>
                  <span className="u-item-block-task" hidden={!localContent.taskId}>
                    {getIn18Text('RENWU')}
                  </span>
                  <div className="u-item-block-text">{localContent?.entry?.brief ? htmlApi.decodeHtml(localContent?.entry?.brief.trim()) : ''}</div>
                  <div className="u-item-block-svg">
                    {localContent?.entry?.eTeamType === 1 && <IconCard type="chat" />}
                    {localContent.entry.attachmentCount && localContent.entry.attachmentCount > 0 ? <ReadListIcons.AttachSvgLarge /> : ''}
                    {localContent.entry.mark === 'redFlag' ? (
                      <span
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={e => {
                          e.stopPropagation();
                          !readOnly && handleRemark(false, localContent?.id, 'redFlag');
                        }}
                      >
                        <ReadListIcons.RedFlagSvg />
                      </span>
                    ) : (
                      <span
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={e => {
                          e.stopPropagation();
                          !readOnly && handleRemark(true, localContent?.id, 'redFlag');
                        }}
                        className="flag"
                      >
                        <ReadListIcons.FlagSvg />
                      </span>
                    )}
                  </div>
                  <div className="u-item-block-time">{formatDigitalTime(localContent?.entry.sendTime)}</div>
                </div>
              )
            }
            key={localContent.entry.id}
          >
            {readOnly ? (
              <></>
            ) : (
              <ContentTips
                listData={listData}
                refreshData={refreshData}
                emoticonInfo={emoticonInfo}
                handleEmoticon={handleEmoticon}
                content={localContent}
                featureConfig={featureConfig}
                handleTranslateLang={handleTranslateLang}
                translateInfo={translateInfo}
              />
            )}

            <Content
              ref={re => {
                if (re) {
                  contentRef.current = re;
                }
              }}
              showWrap={true}
              content={localContent}
              listData={listData}
              mailIdChangeRecord={mailIdChangeRecord}
              readOnly={readOnly || localContent?.localFilePath}
              // onIframeWidthChange={setSW}
              // scrollLeft={scrollLeft}
              // setScrollLeft={st => {
              //   setSL(st);
              // }}
            />
            {readOnly || !isUpDown ? (
              <></>
            ) : (
              <ReplyWrap content={localContent} mid={localContent?.entry?.id} nofix={false} handleEmoticon={handleEmoticon} emoticonInfo={emoticonInfo} />
            )}
          </Panel>
        </Collapse>
      </div>
    );
  }, [listData, localContent, activeKey, readOnly, featureConfig, emoticonInfo, handleTranslateLang]);

  // 只读邮件-顶部填充块-只读条件下顶部操作栏消失，需要防止位置贴顶
  const readOnlyTopEmpty = useMemo(() => {
    return readOnly ? <div style={{ height: 20 }}></div> : <></>;
  }, [readOnly]);

  // const setSLThrottle = useThrottleForEvent(setSL, 300);

  const MailTitle = useMemo(() => {
    return content.entry && content.entry.title ? (
      <>
        <b>{htmlApi.decodeHtml(content.entry.title.trim())}</b>
        {getIn18Text('DESUOYOUYOUJIAN')}
      </>
    ) : (
      getIn18Text('WUZHUTI')
    );
  }, [content?.entry?.title]);

  const searchContent = (keyword: string, forward = true) => {
    if (contentRef.current) {
      const searchFind = contentRef.current.getIframeRef().current?.contentWindow?.searchFind;
      typeof searchFind === 'function' && searchFind(currentSearchState.current, keyword, forward);
      setSearchIndex(currentSearchState.current.index);
    }
  };

  return (
    <div className="u-block thread-mail-warp">
      {readOnly || isUpDown ? <></> : ToobarElement}
      <ContentSearch index={searchIndex} count={currentSearchState.current?.count} searchContent={searchContent} />
      <div
        className={classNames({
          'u-block-content': true,
          'u-block-content-updown': isUpDown,
          'u-block-content-merge': true,
        })}
        ref={contentScrollRef}
      >
        {readOnlyTopEmpty}
        <TitleWithContextMenu className="u-block-title">
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          {MailTitle}
          {/* {content.entry.threadMessageIds && content.entry.threadMessageIds.length > 1 ? `(${content.entry.threadMessageIds.length})` : ''} */}
        </TitleWithContextMenu>
        {TagElement}
        {MailContentElement}
        <BackTop visibilityHeight={200} target={() => contentScrollRef.current || window} className="read-mail-back-top-icon">
          <BackToTopNew />
        </BackTop>
      </div>
      {readOnly || isUpDown || localContent?.localFilePath ? <></> : ReplyElement}
      {/* <HorizontalScrollBar scrollLeft={scrollLeft} scrollWidth={scrollWidth} onScroll={setSL}/> */}
    </div>
  );
};
export default MergeMail;
