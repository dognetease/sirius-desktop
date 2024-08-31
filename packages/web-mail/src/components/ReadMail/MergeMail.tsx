/* eslint-disable react/no-array-index-key */
/* eslint-disable max-statements */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Collapse, Pagination, BackTop, Dropdown, Menu } from 'antd';
import classNames from 'classnames';
import { apiHolder as api, apis, MailEntryModel, MailConfApi, MailOperationType, SystemApi, MailApi, apiHolder, HtmlApi, TranslatStatusInfo } from 'api';
import MailTag from '../MailTag/MailTag';
import { ReactComponent as FilterCheckedIcon } from '@/images/icons/filter_checked.svg';
import { changeContentByLocal, systemIsWindow } from '../../util';
import './index.scss';
import Toobar from './Toobar';
import { useAppSelector } from '@web-common/state/createStore';
import TitleWithContextMenu from './component/TitleContextMenu/TitleWithContextMenu';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { MergeMailLoading } from './component/Loadings';
import { THREAD_MAIL_PAGE_SIZE } from '../../common/constant';
import useDebounceLocalData from '../../hooks/useDebounceLocalData';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { TreadMailPageConfig, FeatureConfig } from '../../types';
import ContentSearch from './ContentSearch';
import { ReactComponent as BackToTopNew } from '@/images/icons/back_to_top_new.svg';
// import { useWhyDidYouUpdate } from 'ahooks';
import { getIn18Text } from 'api';
import { useContactModelNames } from '@web-common/hooks/useContactModel';
const mailManagerApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const eventApi = api.api.getEventApi();
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
import { ReactComponent as ArrowDown } from '@/images/icons/arrow-down.svg';
import MergePanelMail from './MergePanelMail';
interface Props {
  handleDelete(mid: string | undefined, isThread?: boolean, params?: object): void;
  handleRemark(mark: boolean, mid: string | string[], type: MailOperationType, isThread?: boolean): void;
  onChangeMail(keys: string | string[]): void;
  id: string;
  isMerge?: boolean;
  activeKey: string[];
  content: MailEntryModel;
  isUpDown?: boolean;
  mailList: MailEntryModel[];
  readOnly?: boolean;
  threadPageConfig: TreadMailPageConfig;
  onPageChange: (page: number, pageSize?: number) => void;
  searchInputVisible: boolean;
  setSearchInputVisible: React.Dispatch<boolean>;
  featureConfig?: FeatureConfig;
  translateInfoMidMap: { [key: string]: TranslatStatusInfo };
  handleTranslateLang(value: string): void;
  forceUpdate?: number;
  ContentMeasurement: any;
  unlockMail?: (unlockCont: MailEntryModel) => void;
  onOrderChange?: (key: string) => void;
  mergeMailOrderDesc?: boolean;
}
const MergeMail: React.FC<Props> = props => {
  const {
    handleDelete,
    handleRemark,
    onChangeMail,
    searchInputVisible,
    setSearchInputVisible,
    id,
    activeKey,
    content,
    mailList,
    readOnly = false,
    threadPageConfig,
    onPageChange,
    featureConfig,
    handleTranslateLang,
    translateInfoMidMap,
    isUpDown,
    forceUpdate,
    ContentMeasurement,
    VrticalScrollWrapComponent,
    HorizontalScrollWrapComponent,
    setContentWidth,
    vScrolling,
    unlockMail,
    onOrderChange,
    mergeMailOrderDesc,
  } = props;
  const systemApi = api.api.getSystemApi() as SystemApi;
  const htmlApi = apiHolder.api.requireLogicalApi(apis.htmlApi) as HtmlApi;
  const contentRef = useRef<ContentRef[]>([]);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [searchIndex, setSearchIndex] = useState(-1);
  const [searchCount, setSearchCount] = useState(0);
  const currentSearchState = useRef({
    index: -1,
    count: 0,
    text: '',
    matchCase: false, // 是否区分大小写
    wholeWord: false, // 是否需要整个单词匹配
    inSelection: false, // 是否在选中文本中搜索
    firstFind: false,
    openIframeKeys: [] as string[], // 聚合邮件中展开的邮件 为了和activeKey 对比
    merge: true, // 聚合邮件搜索
  });
  const localContent = useDebounceLocalData<MailEntryModel>(content, {
    exception: data => !!data?.entry?.content?.content,
  });
  // useWhyDidYouUpdate('MergeMail', { ...props, localContent, emotionInfoMap, preActiveKey, mailEditShow });

  // 是否展示邮件-信头
  const [showMailHeadMap, setShowMailHeadMap] = useState<{ [key: string]: boolean }>({});

  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  const inWindows = useMemo(() => systemIsWindow(), []);

  useEffect(() => {
    currentSearchState.current.index = -1;
    currentSearchState.current.count = 0;
    currentSearchState.current.text = '';
    currentSearchState.current.firstFind = true;
    currentSearchState.current.openIframeKeys = [];
    setSearchCount(0);
    setSearchIndex(-1);
    setSearchInputVisible(false);
    setShowMailHeadMap({});
  }, [id]);

  useMsgRenderCallback('mailMenuOper', ev => {
    if (ev?.eventStrData == 'searchInContent') {
      setSearchInputVisible(true);
    }
  });

  /**
   * 删除聚合邮件中的单封邮件
   */
  const handleSignlDelete = useCallback(
    (mailId: string) => {
      // 特殊处理，当聚合邮件只有一封的时候，就算是选择删除单封邮件，也得删除整个会话
      if (mailList.length <= 1) {
        handleDelete &&
          handleDelete(id, true, {
            threadId: id,
            showLoading: false,
            showGlobalLoading: true,
          });
      } else {
        // 展示loading
        const messageKey = id + '';
        message.loading({ content: getIn18Text('YOUJIANSHANCHUZHONG'), duration: 30, key: messageKey });
        // setCurrentAccount();
        mailApi
          .doDeleteMail({ fid: content?.entry?.folder, id: mailId })
          .then(res => {
            if (res && res.succ) {
              /**
               * 删除聚合邮件中的单封邮件成功后
               * 需要重新查询进行对比
               */
              message.success({
                content: getIn18Text('YOUJIANSHANCHUCHENG'),
                duration: 2,
                key: messageKey,
              });
            }
          })
          .catch(() => {
            message.error({ content: getIn18Text('YOUJIANSHANCHUSHI'), duration: 2, key: messageKey });
          });
      }
    },
    [mailList]
  );
  // todo: handleWithDraw会击穿优化
  const ToobarElement = useMemo(() => {
    return <Toobar content={content} mailList={mailList} btnTheme="light" />;
  }, [localContent, mailList]);
  const handleDeleteTag = (tagName: string, _mailList: MailEntryModel[]) => {
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
  };
  // 标签组件
  const TagElement = useMemo(() => {
    const showTag = !localContent?.isTpMail;
    return showTag ? (
      <div className="mail-group-tag-warp" data-test-id="mail-thread-tag">
        {localContent?.tags?.map(item => (
          <MailTag
            className="tag"
            closeable={!readOnly && featureConfig?.mailTagIsCloseAble}
            color={mailManagerApi.getTagColor(item, true)}
            style={{ color: mailManagerApi.getTagFontColor(item) }}
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
  }, [localContent, readOnly]);

  const senderContactMap = useContactModelNames({
    emails: (mailList || [])
      .filter(item => {
        if (item && item.sender && item.sender.contact && item.sender.contact.contact) {
          return true;
        }
        return false;
      })
      .map(item => {
        return item.sender.contact.contact.accountName;
      }),
    _account: content?._account || systemApi.getCurrentUser()?.id,
  });

  const MailContentElement = useMemo(() => {
    return (
      <div className="mail-group-wrap" hidden={!mailList || mailList.length <= 0}>
        <Collapse activeKey={activeKey} ghost onChange={onChangeMail} defaultActiveKey={mailList && mailList.length ? [mailList[0]?.entry?.id] : []}>
          {mailList.map((_item, key) => {
            let item = _item;
            // 用于展示的附件总数
            let showAttachCount = 0;
            if (item?.entry?.attachment?.length) {
              item?.entry?.attachment.forEach(att => {
                if (!att.inlined) {
                  showAttachCount++;
                }
              });
            }
            // 用于处理聚合邮件的邮件翻译功能
            if (_item && _item.entry.langType && _item.entry.langListMap) {
              try {
                const langListMap = _item.entry.langListMap;
                const langType = _item.entry.langType;
                const result = langListMap[langType];
                if (result) {
                  item = changeContentByLocal(langType, result, item);
                }
              } catch (e) {
                console.error('[Error mergeMail translate]', e);
                item = _item;
              }
            }
            return (
              <MergePanelMail
                key={item.entry.id}
                activeKey={activeKey}
                handleSignlDelete={handleSignlDelete}
                // handleWithDraw={handleWithDraw}
                readOnly={readOnly}
                featureConfig={featureConfig}
                senderContactMap={senderContactMap}
                showAttachCount={showAttachCount}
                handleRemark={handleRemark}
                ckey={key}
                // listData={listData}
                // refreshData={refreshData}
                handleTranslateLang={handleTranslateLang}
                translateInfoMidMap={translateInfoMidMap}
                unlockMail={unlockMail}
                forceUpdate={forceUpdate}
                vScrolling={vScrolling}
                setContentWidth={setContentWidth}
                HorizontalScrollWrapComponent={HorizontalScrollWrapComponent}
                replayFixed={mailList.length > 0}
                content={item}
                forceUpdate={forceUpdate}
              ></MergePanelMail>
            );
          })}
        </Collapse>
      </div>
    );
  }, [
    mailList,
    activeKey,
    readOnly,
    featureConfig,
    handleTranslateLang,
    translateInfoMidMap,
    forceUpdate,
    HorizontalScrollWrapComponent,
    vScrolling,
    showMailHeadMap,
    forceUpdate,
    Object.keys(senderContactMap).length,
  ]);

  // loading组件
  const LoadingElement = useMemo(() => {
    const list = (isCorpMail ? localContent.entry.threadMessageIds : new Array<any>(threadPageConfig.pageSize)) || [];
    return mailList && mailList.length > 0 ? (
      <></>
    ) : (
      <div className="mail-group-wrap">
        {list.map(() => (
          <MergeMailLoading />
        ))}
      </div>
    );
  }, [localContent, mailList, isCorpMail]);

  // 聚合邮件分页-到底提示
  const NoMoreElement = useMemo(() => {
    if (!isCorpMail) {
      const firstPageShowRule = threadPageConfig.total <= threadPageConfig.pageSize && threadPageConfig.current == 1;
      const lastPageShowRule =
        mailList && mailList.length <= threadPageConfig.pageSize && threadPageConfig.current == Math.ceil(threadPageConfig.total / threadPageConfig.pageSize);
      if (firstPageShowRule || lastPageShowRule) {
        return (
          <div data-test-id="mail-thread-no-more" className="mail-content-no-more">
            {getIn18Text('WUGENGDUOYOUJIAN')}
          </div>
        );
      }
    }
    return <></>;
  }, [isCorpMail, threadPageConfig, mailList]);

  // 聚合邮件分页
  const ThreadPaginationElement = useMemo(() => {
    if (!isCorpMail && threadPageConfig.total > threadPageConfig.pageSize) {
      return (
        <div className="mail-content-pagination-wrap" data-test-id="mail-thread-pager">
          <Pagination
            showSizeChanger={false}
            current={threadPageConfig.current}
            defaultCurrent={1}
            defaultPageSize={THREAD_MAIL_PAGE_SIZE}
            total={threadPageConfig.total}
            pageSize={threadPageConfig.pageSize}
            onChange={(page, pageSize) => {
              onPageChange && onPageChange(page, pageSize);
            }}
          />
          <div className="pagination-info">{getIn18Text('TIAO/YE', { count: THREAD_MAIL_PAGE_SIZE })}</div>
        </div>
      );
    }
    return <></>;
  }, [isCorpMail, threadPageConfig, onPageChange]);

  // 只读邮件-顶部填充块-只读条件下顶部操作栏消失，需要防止位置贴顶
  const readOnlyTopEmpty = useMemo(() => {
    return readOnly ? <div style={{ height: 20 }}></div> : <></>;
  }, []);

  const searchContent = (keyword: string, forward = true) => {
    if (
      currentSearchState.current.text !== keyword ||
      currentSearchState.current.openIframeKeys.length !== activeKey.length ||
      currentSearchState.current.openIframeKeys.some(c => !activeKey.includes(c))
    ) {
      // 如果展开的邮件有变化，需要重新开始搜索
      currentSearchState.current.index = -1;
      currentSearchState.current.count = 0;
      // 连续两次 text 一样 searchFind就会走 next。这样就不能收集到所有的命中
      // 需要一个 firstFind 表示 告诉 searchFind 虽然text一样但是不走next activeKey
      currentSearchState.current.firstFind = true;
      currentSearchState.current.openIframeKeys = [];
    }

    if (contentRef.current) {
      // contentRef.current 有缓存的page但是是折叠状态
      // contentRef.current可能存在length位4 索引0 3有值，其他位undefined
      const openPages = contentRef.current.filter(item => item && activeKey.includes(item.key));
      let nextIndex = null;
      for (let i = 0; i < openPages.length; i++) {
        const item = openPages[i];
        if (currentSearchState.current.firstFind) currentSearchState.current.openIframeKeys.push(item.key || '');
        const searchFind = item.getIframeRef().current?.contentWindow?.searchFind;
        const index = typeof searchFind === 'function' && searchFind(currentSearchState.current, keyword, forward);
        if (index !== undefined) nextIndex = index;
      }
      currentSearchState.current.firstFind = false;
      if (nextIndex !== null) {
        currentSearchState.current.index = nextIndex;
        setSearchIndex(nextIndex);
        setSearchCount(currentSearchState.current.count);
      }
    }
  };

  const handleMenuClick = e => {
    const key = e.key;
    onOrderChange && onOrderChange(key);
  };

  return (
    <VrticalScrollWrapComponent className={`u-block ${inWindows ? 'u-block-win' : ''} thread-mail-warp`} style={{ marginRight: '1px' }} ref={contentScrollRef}>
      <ContentMeasurement>
        {readOnly || isUpDown ? <></> : ToobarElement}
        <ContentSearch
          searchInputVisible={searchInputVisible}
          setSearchInputVisible={setSearchInputVisible}
          index={searchIndex}
          count={searchCount}
          searchContent={searchContent}
        />
        <div
          className={classNames({
            'u-block-content': true,
            'u-block-content-updown': isUpDown,
            'u-block-content-merge': true,
          })}
        >
          {readOnlyTopEmpty}
          <div className="merge-mail-title-wrap">
            <TitleWithContextMenu className="u-block-title">
              {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
              {content.entry && content.entry.title ? (
                <>
                  <b data-test-id="mail-thread-title">{htmlApi.decodeHtml(content.entry.title.trim())}</b>
                  {getIn18Text('DESUOYOUYOUJIAN')}
                </>
              ) : (
                getIn18Text('WUZHUTI')
              )}
              {content.entry.threadMessageIds && content.entry.threadMessageIds.length > 1 ? `(${content.entry.threadMessageIds.length})` : ''}
            </TitleWithContextMenu>
            <div className="mt-oper-warp">
              <div className="mt-sort">
                <Dropdown
                  trigger={['click']}
                  overlayClassName="mt-sort-menu-warp"
                  overlay={
                    <Menu selectedKeys={[mergeMailOrderDesc ? 'desc' : 'other']} selectable onClick={handleMenuClick}>
                      <Menu.Item key="desc">
                        <span style={{ marginRight: '10px' }}>{getIn18Text('SHIJIANYOUJINDAOY')}</span>
                        {mergeMailOrderDesc ? <FilterCheckedIcon /> : <></>}
                      </Menu.Item>
                      <Menu.Item key="other">
                        <span style={{ marginRight: '10px' }}>{getIn18Text('SHIJIANYOUYUANDAOJ')}</span>
                        {mergeMailOrderDesc ? <></> : <FilterCheckedIcon />}
                      </Menu.Item>
                    </Menu>
                  }
                >
                  <span>
                    {getIn18Text('YOUJIANPAIXU')} <ArrowDown />
                  </span>
                </Dropdown>
              </div>
            </div>
          </div>
          {TagElement}
          {MailContentElement}
          {LoadingElement}
          {NoMoreElement}
          {ThreadPaginationElement}
          <BackTop visibilityHeight={200} target={() => contentScrollRef.current || window} className="read-mail-back-top-icon" data-test-id="read-backtop">
            <BackToTopNew />
          </BackTop>
        </div>
      </ContentMeasurement>
    </VrticalScrollWrapComponent>
  );
};
export default MergeMail;
