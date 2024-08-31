/* eslint-disable max-statements */
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { MailEntryModel, MailEmoticonInfoModel, TranslatStatusInfo, apis, apiHolder as api, MailApi as MailApiType, inWindow } from 'api';
import { BackTop } from 'antd';
import classnames from 'classnames';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { MailStatus, OpenRecordData, getMailContentText, setCurrentAccount, systemIsWindow } from '../../util';
import './index.scss';
import Header from './Header';
import Content, { ContentRef } from './content/Content';
import Toobar from './Toobar';
import ReplyWrap from './ReplyWrap';
import { mailIdChangeRecord } from '../../types';
import useDebounceLocalData from '../../hooks/useDebounceLocalData';
import ContentTips from './ContentTips';
import { FeatureConfig } from '../../types';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import Measure from 'react-measure';
import ContentSearch from './ContentSearch';
import { ReactComponent as BackToTopNew } from '@/images/icons/back_to_top_new.svg';
// import { useWhyDidYouUpdate } from 'ahooks';
import styles from './index.module.scss';
import debounce from 'lodash/debounce';
import useGetUniqueFn from '@web-mail/hooks/useGetUniqueFn';
import useCreateCallbackForEvent from '@web-mail/hooks/useCreateCallbackForEvent';
import { MAIL_MENU_ITEM } from '@web-mail/common/constant';
import { getParameterByName } from '@web-common/utils/utils';
import EdmReplyMark from './EdmReplyMark';
import useGetReadStatus from '@web-mail/components/ReadMail/hooks/useGetReadStatus';

import { Thunks } from '@web-common/state/reducer/mailReducer';

interface Props {
  sliceId: string;
  // handleWithDraw(mid: string): void;
  // refreshData(): void;
  // id: string;
  content: MailEntryModel;
  // listData?: MailStatus;
  openRecordData?: OpenRecordData;
  // getMailReadDetail?: (content: MailEntryModel) => void;
  readOnly?: boolean;
  isUpDown?: boolean;
  searchInputVisible: boolean;
  setSearchInputVisible: React.Dispatch<boolean>;
  mailIdChangeRecord?: { current: mailIdChangeRecord | null };
  translateInfo: TranslatStatusInfo;
  handleTranslateLang(value: string): void;
  featureConfig?: FeatureConfig;
  forceUpdate?: number;
  unlockMail?: (unlockCont: MailEntryModel) => void;
  source?: string;
}

const SingleMail: React.FC<Props> = props => {
  const {
    // handleWithDraw,
    // refreshData,
    content,
    // listData,
    // openRecordData,
    // getMailReadDetail,
    readOnly = false,
    mailIdChangeRecord,
    translateInfo,
    handleTranslateLang,
    featureConfig,
    sliceId,
    isUpDown,
    searchInputVisible,
    setSearchInputVisible,
    forceUpdate,
    unlockMail,
  } = props;

  const MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApiType;
  const dispatch = useAppDispatch();
  const contentRef = useRef<ContentRef[]>([]);
  const mailContentRef = useRef<HTMLDivElement>(null);
  const mailListResizeProcessing = useAppSelector(state => state.mailReducer.mailListResizeProcessing);
  const [emoticonInfo, setEmoticonInfo] = useState<MailEmoticonInfoModel>(); // 是否参与点赞
  const [iframeWidth, setIframeWidth] = useState<number>(0);
  const [searchIndex, setSearchIndex] = useState(-1);
  const [searchCount, setSearchCount] = useState(0);
  const currentSearchState = useRef({
    index: -1,
    count: 0,
    text: '',
    matchCase: false, // 是否区分大小写
    wholeWord: false, // 是否需要整个单词匹配
    inSelection: false, // 是否在选中文本中搜索
  });
  const [width, setWidth] = useState<number | null>();
  // 1.20之前有这么一个问题 读信框拉大 iframe设置的width是100% 所以iframe的width变大，
  // 滚动条靠 .mail-read-content > div 撑开，但是这个dom的minWidth依赖iframe宽度 minWidth: iframeWidth ? iframeWidth + 40
  // 这样就会导致此dom的minwidth只能变大不会变小，这样读信时初始化没有滚动条但是拉大再拉回原来的宽度就会出滚动条
  // 但是此dom的 minWidth 又不能不依赖iframewidth 因为可能存在读信内容超厂超过此dom的width，如果没有这个依赖就没有滚动条，部分信件内容就看不到了
  // 解决方案，保存iframeWidth的初始值initMinWidth，此dom minWidth: iframeWidth+40 > initMinWidth ? initMinWidth : 100%(width)
  const [initMinWidth, setInitMinWidth] = useState(0);

  // 是否展示邮件-信头
  const [showMailHead, setShowMailHead] = useState(false);

  // 本地的content缓存,邮件正文快速切换优化, 当有邮件正文的时候，绕过本次防抖
  const localContent = useDebounceLocalData<MailEntryModel>(content, {
    exception: data => !!data?.entry?.content?.content,
  });

  const mid = localContent?.entry?.id;
  const mailContent = localContent?.entry?.content?.content;

  useEffect(() => {
    if (mid && mailContent) {
      dispatch(Thunks.doGetCurrentMailLang({ mid }));
    }
  }, [mid, mailContent]);

  // useWhyDidYouUpdate('SingleMail', { ...props, mailListResizeProcessing, emoticonInfo, iframeWidth , width, localContent});

  const handleEmoticon = useCallback((data: MailEmoticonInfoModel) => {
    setEmoticonInfo(data);
  }, []);

  const handleIframeWidthChange = useCallback((width: number) => {
    setIframeWidth(width);
  }, []);

  /**
   * 必须写在依赖项中，不可转为ref使用
   */
  const handleGetThumbUpInfo = useGetUniqueFn(
    data => {
      setEmoticonInfo(data);
    },
    [localContent?.id]
  );

  const getThumbUpInfo = useCallback(
    debounce((mid: string, tid = '', _account = '') => {
      MailApi.getThumbUpInfo(mid, tid, undefined, _account)
        .then(data => {
          handleGetThumbUpInfo(data);
          // if (!isMountedRef.current) {
          //   return;
          // }
          // if (midRef.current === mid) {
          //   setEmoticonInfo(data)
          // } else {
          //   console.warn('setEmoticonInfo id 不一致')
          // }
        })
        .catch(err => {
          setEmoticonInfo({} as MailEmoticonInfoModel);
          console.error('setEmoticonInfo error', err);
        });
    }, 1000),
    [handleGetThumbUpInfo]
  );
  const getThumbUpInfoRef = useCreateCallbackForEvent(getThumbUpInfo);

  // id切换的时候重置外部测量的宽度，否则读信页的宽度只会增加，不会减少
  useEffect(() => {
    setIframeWidth(0);
    currentSearchState.current.index = -1;
    currentSearchState.current.count = 0;
    currentSearchState.current.text = '';
    setSearchIndex(-1);
    setSearchCount(0);
    setSearchInputVisible(false);
    setShowMailHead(false);
  }, [localContent?.id]);

  useMsgRenderCallback('mailMenuOper', ev => {
    if (ev?.eventStrData == 'searchInContent') {
      setSearchInputVisible(true);
    }
  });

  useEffect(() => {
    // isMountedRef.current = true;
    setEmoticonInfo({} as MailEmoticonInfoModel);
    // setCurrentAccount(localContent?._account);
    // midRef.current = localContent.id;
    getThumbUpInfoRef(localContent.id, localContent.entry.tid, localContent?._account);
    // MailApi.getThumbUpInfo(localContent.id, localContent.entry.tid || '').then(data => {
    //   if (midRef.current === localContent.id) {
    //     setEmoticonInfo(data)
    //   } else {
    //     console.warn('zzzzzzzh id 不一致')
    //   }
    // }).catch(err => {
    //   setEmoticonInfo({} as MailEmoticonInfoModel);
    //   console.error('setEmoticonInfo error', err)
    // })
    setIframeWidth(0);

    // return () => {
    //   isMountedRef.current = false;
    // }
  }, [localContent?.id]);

  // 邮件阅读状态相关业务
  const { openRecordData, setOpenRecordData, readStatus, setReadStatus, debounceGetStatusOrDetail, getStatusOrDetail, getMailReadDetail } = useGetReadStatus(content);

  // 请求邮件的阅读状态与
  useEffect(() => {
    setOpenRecordData({ count: 0, records: [] });
    debounceGetStatusOrDetail(localContent);
  }, [localContent?.id]);

  const refreshData = useCreateCallbackForEvent(() => {
    const id = localContent?.id;
    if (!id) return;
    getStatusOrDetail(localContent);
  });
  // 是否展示
  const hideToolbarElement = useMemo(() => {
    // 只读邮件 || 上下布局 并且 不是第三方邮件
    return (readOnly || isUpDown) && !content?.isTpMail;
  }, [readOnly, isUpDown, content?.isTpMail]);

  const ToobarElement = useMemo(() => {
    return (
      <Toobar
        content={localContent}
        listData={readStatus}
        // handleWithDraw={handleWithDraw}
        showMailDiscuss={!!(featureConfig?.mailDiscuss && !localContent?.localFilePath)}
        showMailHead={showMailHead}
        onShowMailHeadChange={setShowMailHead}
      />
    );
  }, [localContent, readStatus, featureConfig, showMailHead]);

  const HeaderElement = useMemo(() => {
    return (
      <Header
        sliceId={sliceId}
        content={content}
        listData={readStatus}
        // handleWithDraw={handleWithDraw}
        readOnly={readOnly || !!content?.localFilePath}
        showMailDiscuss={featureConfig?.mailDiscuss}
        mailTagCloseAble={featureConfig?.mailTagIsCloseAble}
        menu={[
          {
            key: MAIL_MENU_ITEM.EMAIL_HEADER,
            name: mail => {
              return showMailHead ? '查看邮件' : '查看信头';
            },
            onClick: mails => {
              setShowMailHead(!showMailHead);
            },
          },
        ]}
      />
    );
  }, [content, readStatus, readOnly, featureConfig, showMailHead]);

  // todo: 注意id的随动问题
  const ContentElement = useMemo(() => {
    return (
      <Content
        ref={re => {
          if (re) {
            contentRef.current[0] = re;
          }
        }}
        content={localContent}
        isrcl={readStatus?.isrcl}
        mailIdChangeRecord={mailIdChangeRecord}
        readOnly={readOnly || !!localContent?.localFilePath}
        onIframeWidthChange={handleIframeWidthChange}
        onIframeInitMinWidth={setInitMinWidth}
        featureConfig={featureConfig}
        forceUpdate={forceUpdate}
      />
    );
  }, [localContent, readStatus?.isrcl, readOnly, featureConfig, forceUpdate]);

  // todo: 问题同上
  const ReplyElement = useMemo(() => {
    return <ReplyWrap content={localContent} mid={localContent?.id} emoticonInfo={emoticonInfo} handleEmoticon={handleEmoticon} />;
  }, [localContent?.id, emoticonInfo, handleEmoticon]);

  // 邮件tips业务
  const ContentTipsElement = useMemo(() => {
    return (
      <ContentTips
        listData={readStatus}
        openRecordData={openRecordData}
        getMailReadDetail={getMailReadDetail}
        refreshData={refreshData}
        emoticonInfo={emoticonInfo}
        handleEmoticon={handleEmoticon}
        content={localContent}
        translateInfo={translateInfo}
        handleTranslateLang={handleTranslateLang}
        featureConfig={featureConfig}
        forceUpdate={forceUpdate}
        unlockMail={unlockMail}
        style={{ margin: '16px 0 ' }}
        showMailHead={showMailHead}
        onShowMailHeadChange={setShowMailHead}
      />
    );
  }, [localContent, readStatus, openRecordData, refreshData, emoticonInfo, handleEmoticon, translateInfo, handleTranslateLang, featureConfig, forceUpdate, showMailHead]);

  const [mailReadContentClassNames] = useState(() => {
    return systemIsWindow() ? 'mail-read-content-inwin' : 'mail-read-content';
    // return process.env.BUILD_ISELECTRON && inWindow() && !window.electronLib.env.isMac?'mail-read-content':'mail-read-content-inwin'
  });

  const searchContent = useCallback((keyword: string, forward = true) => {
    if (contentRef.current && contentRef.current[0]) {
      const searchFind = (contentRef.current[0].getIframeRef().current?.contentWindow as any)?.searchFind;
      typeof searchFind === 'function' && searchFind(currentSearchState.current, keyword, forward);
      setSearchIndex(currentSearchState.current.index);
      setSearchCount(currentSearchState.current.count);
    }
  }, []);

  return (
    <>
      <Measure
        bounds
        onResize={contentRect => {
          setWidth(contentRect.bounds?.width);
        }}
      >
        {({ measureRef }) => (
          <div ref={measureRef} className="mail-read-content-wrap single-mail-warp">
            {/* 一个透明的遮罩 在邮件列表页滑动改变大小时出现 以防止鼠标移入读信iframe后造成事件传递异常 导致邮件列表resize异常 */}
            {mailListResizeProcessing && <div className="mail-read-content-mask" />}
            {hideToolbarElement ? <></> : ToobarElement}
            <div className={mailReadContentClassNames} ref={mailContentRef}>
              <div style={{ minWidth: iframeWidth && iframeWidth + 40 > initMinWidth ? initMinWidth + 40 - 12 : width ? width - 12 : '100%', width: '100%' }}>
                {
                  // width -12 是为了单封模式下，防止出现无用的横向滚动条
                }
                <div style={{ width: width ? width - 12 : '100%', position: 'sticky', left: 0, top: 0, zIndex: 1 }}>
                  <ContentSearch
                    index={searchIndex}
                    count={searchCount}
                    searchInputVisible={searchInputVisible}
                    setSearchInputVisible={setSearchInputVisible}
                    searchContent={searchContent}
                  />
                </div>

                <div style={{ position: 'sticky', left: 0, width: width ? width - 12 : '100%' }}>
                  {readOnly ? <div style={{ height: 20 }}></div> : <></>}
                  {isUpDown ? <div style={{ height: 8 }}></div> : <></>}
                  {HeaderElement}
                  {localContent?.localFilePath ? <></> : readOnly ? <EdmReplyMark content={content} directSecond={true} /> : ContentTipsElement}
                </div>
                {ContentElement}
                <BackTop visibilityHeight={200} target={() => mailContentRef.current || window} className="read-mail-back-top-icon" data-test-id="read-backtop">
                  <BackToTopNew />
                </BackTop>
              </div>
              {isUpDown && <div className={classnames(styles.updownReplay)}>{ReplyElement}</div>}
            </div>
            {readOnly || isUpDown || localContent?.localFilePath ? <></> : ReplyElement}
          </div>
        )}
      </Measure>
    </>
  );
};
export default SingleMail;
