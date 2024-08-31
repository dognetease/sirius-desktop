/* eslint-disable no-nested-ternary */
/* eslint-disable max-params */
/* eslint-disable max-statements */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { message, Button } from 'antd';
import {
  apis,
  apiHolder as api,
  MailApi as MailApiType,
  MailEntryModel,
  EventApi,
  MailOperationType,
  SystemApi,
  SystemEvent,
  mailPerfTool,
  inWindow,
  TranslatStatusInfo,
  DataTrackerApi,
  MailDeliverStatusItem,
  ContactModel,
  DataStoreApi,
  ProductAuthApi,
  ContactType,
  MailConfApi,
  AccountApi,
  MailSettingKeys,
} from 'api';
import cloneDeep from 'lodash/cloneDeep';
import lodashGet from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import {
  formatReadStatus,
  MailStatus,
  filterSysMailTag,
  setCurrentAccount,
  isMainAccount,
  combineContent,
  changeContentByLocal,
  splitContent,
  MailItemStatus,
  systemIsWindow,
  OpenRecordData,
  OpenRecord,
} from '../../util';
import { FLOLDER, THREAD_MAIL_PAGE_SIZE } from '@web-mail/common/constant';
import './index.scss';
import AttachmentPreview from '../AttachmentPreview';
import Alert from '@web-common/components/UI/Alert/Alert';
// import StatusModal from '../StatusModal';
import MergeMail from './MergeMail';
import SingleMail from './SingleMail';
// import SingleCardMail from './SingleCardMail';
import MailDetailLoading from './component/Loadings';
import { useAppSelector, useActions, useAppDispatch } from '@web-common/state/createStore';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { MailActions } from '@web-common/state/reducer';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import useGetUniqReqWrap, { userCallback, ERROR_REQUEST_CANCLE } from '@web-common/hooks/useGetUniqReqWrap';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { getParameterByName, idIsTreadMail } from '@web-common/utils/utils';
import { debounce } from 'lodash';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { mailIdChangeRecord, TreadMailPageConfig } from '../../types';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import { FeatureConfig } from '../../types';
import useMailStoreState from '@web-mail/hooks/useMailStoreState';
import useMailStore from '@web-mail/hooks/useMailStoreRedux';
import { TASK_MAIL_STATUS } from '../../common/constant';
// import { useWhyDidYouUpdate } from 'ahooks';
import useStateRef from '@web-mail/hooks/useStateRef';
// import { useDebounceEffect, useUpdateEffect } from 'ahooks';
import { HotKeys } from '@web-mail/common/library/HotKeys/react-hotkeys';
// import useMailStateChange from '@web-mail/hooks/useMailStateChange';
import { getIn18Text } from 'api';
import useFixedScroolBar from './useFixedScrollBar';
import HorizontalScrollBar from './scrollBar';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';

/**
 * 邮件正文的加载状态枚举
 */
enum MAIL_LOAD_STATUS {
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  LOADING = 'LOADING',
  EMPTY = 'EMPTY',
}

export enum ListHotKey {
  COMMAND_F = 'COMMAND_F',
}

export const keyMap = {
  [ListHotKey.COMMAND_F]: ['command+f', 'ctrl+f'],
};

type ElementRender = React.ReactElement | (() => React.ReactElement | null | undefined | void);

type FailRenderProps = {
  error: string | null | undefined;
  retry: () => void;
};

type getSignContent = typeof MailApi.doGetMailContent;
type ThreadContentReqParams = {
  desc?: boolean;
  start?: number;
  limit?: number;
};
interface Props {
  sliceId: string;
  mailId:
    | string
    | {
        id: string;
        account: string;
      };
  // 窗口打开来源
  from?: string;
  // 是否是新窗口打开
  openInNewWindow?: boolean;
  // 临时内容，用于快速切换，通常不包含正文信息
  tempContent?: MailEntryModel;
  // 是否只读 - 只读模式没有任何交互性操作
  readOnly?: boolean;
  // 是否上下分栏
  isUpDown?: boolean;
  /**
   * 获取详情的接口
   * todo: 因为消息同步的存在，当前版本采用外部传入接口的方式调用，后续需要将数据的请求与显示分开
   */
  getSignMailContent?: getSignContent;
  // 邮件的自定义空状态展示
  emptyRender?: ElementRender;
  // 邮件的自定义loading展示
  loadingRender?: ElementRender;
  // 自定义的失败显示状态
  failRender?: React.ReactElement | ((param: FailRenderProps) => React.ReactElement);
  /**
   * 读信页功能开关配置
   * 读信页在不同的场景下，有不屏蔽不同功能的需求
   * 如果有类似需求，在FeatureConfig中添加对应的功能字段，横向拓展
   */
  featureConfig?: FeatureConfig;
  /**
   * 请求包装器
   */
  requestUniqWrap?: ((...params: any) => Promise<any>) | ((callback: userCallback) => (...params: any) => Promise<any>);
  /**
   * 侧边栏详情
   */
  asideContactModel?: ContactModel;
  contactType?: ContactType;
  // 打开来源模块
  source?: string;
}
const MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApiType;
const systemApi = api.api.getSystemApi() as SystemApi;
const eventApi: EventApi = api.api.getEventApi() as unknown as EventApi;
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const productAuthApi = api.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const storeApi: DataStoreApi = api.api.getDataStoreApi();
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

// 聚合邮件翻页默认参数
const DefaultThreadPageConfig: TreadMailPageConfig = {
  current: 1,
  pageSize: THREAD_MAIL_PAGE_SIZE,
  total: 0,
};

const defaultFeatureConfig = {
  mailDiscuss: true,
  relatedMail: true,
  mailTagIsCloseAble: true,
  readStatus: true,
};

const ReadMail: React.FC<Props> = (props: Props) => {
  const {
    mailId, // 非聚合模式下id为邮件mid，聚合模式下id为聚合id
    from,
    openInNewWindow = false,
    tempContent,
    readOnly = false,
    isUpDown,
    emptyRender,
    failRender,
    loadingRender,
    getSignMailContent,
    featureConfig = defaultFeatureConfig,
    requestUniqWrap,
    // asideContactModel,
    contactType,
    sliceId,
    source = 'normal',
  } = props;
  const mailAccount = useMemo(() => {
    return typeof mailId === 'string' ? '' : mailId?.account;
  }, [mailId]);
  const id: string = useMemo(() => {
    return typeof mailId === 'string' ? mailId : mailId?.id;
  }, [mailId]);
  const idRef = useStateRef(id);
  const localFeatureConfig = useMemo(() => {
    return { ...defaultFeatureConfig, ...featureConfig };
  }, [featureConfig]);
  const [content, setContent] = useMailStoreState<MailEntryModel>(null, false);
  const contentRef = useStateRef(content);
  // const [modalVisible, setModalVisible] = useState(false);
  // const [groupTags, setGroupTags] = useState<string[]>([]);
  const [readStatus, setReadStatus] = useState<MailStatus>();
  const [openRecordData, setOpenRecordData] = useState<OpenRecordData>();
  const [activeKey, setActiveKey] = useState<string[]>([]);
  const [mailList, _setMailList] = useMailStore('readMailChildMailList');
  const mailListRef = useStateRef(mailList);

  const shouldAutoReadMail = mailConfApi.getShouldAutoReadMailSync();
  const setMailList = useCreateCallbackForEvent(list => {
    if (!(isEmpty(mailList) && isEmpty(list))) {
      _setMailList(list);
    }
  });
  //  useMailStoreState([]); // 当前态 邮件列表
  // const [updated, setUpdated] = useState<boolean>(false);
  // 邮件正文加载性能开始事件记录
  const mailIdChangeRecord = useRef<mailIdChangeRecord | null>(null);
  // 聚合邮件分页-参数
  const [threadPageConfig, setThreadPageConfig] = useState<TreadMailPageConfig>({ ...DefaultThreadPageConfig });
  const threadPageConfigRef = useStateRef(threadPageConfig);
  // 邮件内容所处的状态 加载成功|失败|loading|空
  const [loadStatus, setLoadStatus] = useState<MAIL_LOAD_STATUS>(MAIL_LOAD_STATUS.EMPTY);
  // 邮件请求失败的错误
  const [loadFailError, setLoadFailErr] = useState<string>();
  const mailActions = useActions(MailActions);
  const fnUniqWarp = requestUniqWrap || useGetUniqReqWrap();
  const cancelContent = fnUniqWarp(() => Promise.resolve('')) as (...params: any) => Promise<any>;
  // 包装聚合邮件详情接口
  const doGetThreadMailContent = fnUniqWarp(MailApi.doGetThreadMailContent.bind(MailApi)) as (...params: any) => Promise<any>;
  // 从本地数据库中获取聚合邮件详情
  // const doGetThreadMailContentFromDb = MailApi.doGetThreadMailContentFromDb;
  // 包装邮件详情
  const doGetMailContent = fnUniqWarp(getSignMailContent ? getSignMailContent : MailApi.doGetMailContent.bind(MailApi)) as (...params: any) => Promise<any>;
  // 外部是否传入了请求接口
  const isCustomRequest = useStateRef(!!getSignMailContent);
  // 是否是聚合邮件
  const [isThreadMail, setIsThreadMail] = useState<boolean>();
  // 翻译状态
  const [translateInfoMidMap, setTranslateInfoMidMap] = useState<{ [key: string]: TranslatStatusInfo }>({});
  const translateInfoMidMapRef = useStateRef(translateInfoMidMap);
  // 聚合邮件子邮件idList
  const [threadMailIds, setThreadMailIds] = useState<string[]>([]);

  // 聚合邮件的排序状态
  const [mergeMailOrderDesc, setMergeMailOrderDesc] = useState2RM('mergeMailOrderDesc');
  const mergeMailOrderDescRef = useStateRef(mergeMailOrderDesc);
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  // todo: 任务邮件-走redux有问题
  const taskStatus = useAppSelector(state => state.readMailReducer.taskDetail.status); // 任务状态
  // 用户引导页
  const guidePage = useAppSelector(state => state.mailReducer.onGuidePage);
  const requestReadReceiptLocal = useAppSelector(state => state.mailReducer.mailEntities[id]?.entry?.requestReadReceiptLocal);
  const { sendingMails } = useAppSelector(state => state.mailReducer);
  const dispatch = useAppDispatch();
  const reducer = useActions(MailActions);
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();
  const [searchInputVisible, setSearchInputVisible] = useState(false);

  const [vScrolling, setVScrolling] = useState(false);

  const inWindows = useMemo(() => systemIsWindow(), []);

  const mailAccountRef = useStateRef(mailAccount);

  /**
   * 获取横向虚拟滚动条相关包装组件
   * 状态机操作方法
   */
  const {
    /**
     * 最外层测量
     */
    WrapCompenent,
    /**
     * 垂直滚动监测容器
     */
    VrticalScrollWrapComponent,
    /**
     * 水平滚动监测容器
     */
    HorizontalScrollWrapComponent,
    /**
     * 正文变化监测
     */
    ContentMeasurement,
    handleVScrollOnScroll,
    setContentWidth,
    vScrollBarShow,
    vScrollBarLeft,
    vScrollBarWidth,
  } = useFixedScroolBar({
    contentRectBottomOffset: -6,
  });

  // 有其他变化的时候用于强制触发渲染
  const [forceUpdate, setForceUpdate] = useState(0);

  // 邮件状态变化的时候触发强制渲染
  // const stateForceUpdate = useMailStateChange([content])
  // useWhyDidYouUpdate('ReadMail', { ...props, mailId, featureConfig, content, modalVisible, readStatus, activeKey, mailList, updated, threadPageConfig, loadStatus, loadFailError, isThreadMail, translateInfoMidMap, threadMailIds, });

  // 聚合邮件子邮件的idlist
  const mailIdList = useMemo(() => {
    if (mailList && mailList.length) {
      let res = '';
      return mailList.forEach(item => {
        res += item?.id;
      });
      return res;
    }
    return '';
  }, [mailList]);

  useEffect(() => {
    setForceUpdate(count => count + 1);
  }, [requestReadReceiptLocal]);

  // 当前邮件内容属于的语言
  useEffect(() => {
    if (content?.entry?.langListMap?.originLang) {
      setForceUpdate(count => count + 1);
    }
  }, [content?.entry?.langListMap?.originLang]);

  /**
   * 用于在聚合邮件-收到新邮件的额时候，重新请求一下新的邮件
   */
  const preContentId = useRef<string | undefined>('');
  useEffect(() => {
    if (content?.isThread && content.id === preContentId.current && threadPageConfigRef.current.current == 1) {
      let requestParam = {
        desc: mergeMailOrderDescRef.current,
        start: 0,
        limit: threadPageConfigRef.current.pageSize,
      };
      let noCache = true;
      getThreadMailContent(requestParam, noCache);
    }
    preContentId.current = content?.id;
  }, [content?.isThread, content?.entry?.threadMessageCount, content?.id]);

  // 来源类型
  const fromType = useMemo(() => {
    let type: '' | 'push' | 'inner' | 'window' = '';
    if (id) {
      type = 'inner';
      if (openInNewWindow) {
        type = getParameterByName('push', window.location.search) === '1' || from === 'push' ? 'push' : 'window';
      }
    }
    return type;
  }, [id, openInNewWindow]);

  // 根据版本获取阅读状态
  // const formatReadStatusByProduct = (list: MailDeliverStatusItem[]) => {
  //   const listData = formatReadStatus(list);
  //   const versionId = productAuthApi.doGetProductVersionId();
  //   // 尊享版
  //   if (versionId === 'sirius') {
  //     const stateTrack = storeApi.getSync('stateTrack').data;
  //     // 域外追踪如果关闭 域外的阅读状态视为未知
  //     if (stateTrack === 'OFF') {
  //       // 内域列表
  //       const domainList = lodashGet(systemApi.getCurrentUser(), 'prop.domainList', []) as string[];
  //       listData.data = (listData.data || []).map((listItem: MailItemStatus) => {
  //         const item = { ...listItem };
  //         const { email } = item;
  //         if (email) {
  //           const suffix = email.split('@')[1];
  //           // 外域
  //           if (suffix && !domainList.includes(suffix)) {
  //             item.status = 'outdomain';
  //             item.text = getIn18Text('EMAIL_READ_STATUS_SERVER_RECEIVE');
  //             item.color = '';
  //           }
  //         }
  //         return item;
  //       });
  //     }
  //     return listData;
  //   }
  //   if (versionId === 'free') {
  //     if (listData.data) {
  //       listData.data.forEach(item => {
  //         item.status = 'unkown';
  //         if (item.result === 109) {
  //           item.text = getIn18Text('EMAIL_READ_STATUS_SERVER_RECEIVE');
  //         }
  //         item.color = '';
  //       });
  //     }
  //   } else {
  //     if (listData.data) {
  //       listData.data.forEach(item => {
  //         if (!item?.inner) {
  //           item.status = 'unkown';
  //           if (item.result === 109) {
  //             item.text = getIn18Text('EMAIL_READ_STATUS_SERVER_RECEIVE');
  //           }
  //           item.color = '';
  //         }
  //       });
  //     }
  //   }
  //   return listData;
  // };

  // const getMailReadCount = async (content: MailEntryModel) => {
  //   const { id, entry, sender } = content;
  //   const { tid } = entry;
  //   try {
  //     // setCurrentAccount(mailAccount);
  //     const res = await MailApi.doGetMailReadCount({
  //       mid: id,
  //       tid,
  //       fromEmail: sender.contact.contact.accountName,
  //       _account: mailAccountRef.current,
  //     });
  //     console.log('getMailReadCount', res);
  //     const { code, data, message } = res;
  //     if (code === 0) {
  //       if (data.count === 1) {
  //         getMailReadDetail(content);
  //       } else {
  //         setOpenRecordData({
  //           count: data.count || 0,
  //           records: [],
  //         });
  //       }
  //       return;
  //     }
  //     console.log('doGetMailReadCount fail', message);
  //     setOpenRecordData({ count: 0, records: [] });
  //   } catch (error) {
  //     console.log('doGetMailReadCount error', error);
  //     setOpenRecordData({ count: 0, records: [] });
  //   }
  // };

  // const getMailReadDetail = async (content: MailEntryModel) => {
  //   const { id, entry, sender } = content;
  //   const { tid } = entry;
  //   try {
  //     // setCurrentAccount(mailAccount);
  //     const res = await MailApi.doGetMailReadDetail({
  //       mid: id,
  //       tid,
  //       fromEmail: sender.contact.contact.accountName,
  //       _account: mailAccountRef.current,
  //     });
  //     console.log('getMailReadDetail', res);
  //     const { code, data, message } = res;
  //     if (code === 0) {
  //       const systemTimeZone = systemApi.getSystemTimeZone();
  //       if (systemTimeZone) {
  //         const records = data.readList || [];
  //         const dealedRecords: OpenRecord[] = [];
  //         const now = moment();
  //         records.forEach((item: OpenRecord) => {
  //           let settingTime = '';
  //           if (item.currentLocalTime) {
  //             const settingMoment = systemApi.timeZoneTrans(item.currentLocalTime, 8, systemTimeZone.key);
  //             // 同一年展示月日
  //             if (now.year() === settingMoment?.year()) {
  //               settingTime = settingMoment?.format('MM-DD HH:mm') || '';
  //               // 远端时间一起改
  //               item.remoteLocalTime = item.remoteLocalTime ? moment(item.remoteLocalTime).format('MM-DD HH:mm') || '' : '';
  //             } else {
  //               // 跨年 展示年月日
  //               settingTime = settingMoment?.format('YYYY-MM-DD HH:mm') || '';
  //             }
  //           }
  //           dealedRecords.push({
  //             ...item,
  //             settingTime,
  //             settingTimeZone: systemTimeZone?.value,
  //           });
  //         });
  //         setOpenRecordData({
  //           count: dealedRecords.length,
  //           records: dealedRecords,
  //         });
  //         return;
  //       }
  //     }
  //     console.log('doGetMailReadDetail fail', message);
  //     setOpenRecordData({ count: 0, records: [] });
  //   } catch (error) {
  //     console.log('doGetMailReadDetail error', error);
  //     setOpenRecordData({ count: 0, records: [] });
  //   }
  // };

  // const getReadStatus = async (mailEntry: MailEntryModel) => {
  //   try {
  //     // 获取当前用户账户别名
  //     const currentUser = systemApi.getCurrentUser(mailEntry?._account);
  //     const accountAlias = currentUser?.prop?.accountAlias || [];
  //     const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];

  //     // 检查邮件是否由当前用户发送
  //     const sender = mailEntry?.sender;
  //     const isMySend = accountAliasArray.some(item => {
  //       return accountApi.getIsSameSubAccountSync(item, sender?.contact?.contact?.accountName);
  //     });

  //     // 确定用于检查阅读状态的电子邮件 ID
  //     let emailId = mailEntry.id;
  //     if (isMySend) {
  //       emailId = mailEntry?.entry?.sentMailId || mailEntry.id;
  //     }

  //     // 获取阅读状态信息
  //     const readStatusData = await MailApi.doCheckReadStatus(emailId, mailAccountRef.current);
  //     const formattedReadStatus = formatReadStatusByProduct(readStatusData.detail);
  //     setReadStatus(formattedReadStatus);
  //   } catch (error) {
  //     console.error(`获取邮件阅读状态失败：${error}`);
  //   }
  // };

  // const getStatusOrDetail = (content: MailEntryModel | null) => {
  //   if (!content) return;
  //   const { isTpMail, authAccountType } = content;
  //   // 发信箱(只要是发件即可) 非Tp
  //   const accountAlias = systemApi.getCurrentUser(content?._account)?.prop?.accountAlias || [];
  //   const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];
  //   const senderEmail = content?.sender?.contact?.contact?.accountName || '';
  //   // 在发件箱 || 别名邮箱里面包含发件人 || 发件人 == 归属账号， 认为是自己发出的
  //   const isSend =
  //     content?.entry?.folder === FLOLDER.SENT ||
  //     accountAliasArray.some(account => accountApi.getIsSameSubAccountSync(account, senderEmail)) ||
  //     accountApi.getIsSameSubAccountSync(senderEmail, content._account);
  //   if (isSend && !isTpMail) {
  //     // 非正式
  //     if (authAccountType && authAccountType !== '0') {
  //       getMailReadCount(content);
  //       return;
  //     }
  //     // 其他
  //     getReadStatus(content);
  //   }
  // };

  // const debounceGetStatusOrDetail = debounce((content: MailEntryModel | null) => {
  //   if (!content) return;
  //   getStatusOrDetail(content);
  // }, 500);

  // useEffect(() => {
  //   setOpenRecordData({ count: 0, records: [] });
  //   debounceGetStatusOrDetail(content);
  // }, [content?.id]);

  // 设置邮件正文状态
  const setData = useCreateCallbackForEvent((_content: MailEntryModel, recordPerf = false) => {
    setContent(_content);
    setLoadStatus(MAIL_LOAD_STATUS.SUCCESS);
    if (recordPerf && fromType) {
      mailPerfTool.mailContent(fromType, 'end', {
        mid: _content.id.split('--')[0],
        isThread: fromType === 'push' ? false : !!_content?.isThread,
        folder: _content?.entry.folder || undefined,
        read: fromType !== 'push' && _content?.entry?.readStatus === 'read',
      });
    }
  });

  // 请求聚合邮件内容
  const getThreadMailContent = useCallback(
    (requestParam: ThreadContentReqParams, noCache: boolean) => {
      if (!id) {
        setLoadStatus(MAIL_LOAD_STATUS.SUCCESS);
        return;
      }
      const isThread = idIsTreadMail(id);
      // setCurrentAccount(mailAccount);
      doGetThreadMailContent(id, requestParam, noCache, threadMailIds, mailAccount)
        .then((res: MailEntryModel[]) => {
          if (!res || !res.length) {
            setLoadStatus(MAIL_LOAD_STATUS.SUCCESS);
            return;
          }
          if (res.length === 1) {
            // 请求聚合邮件内容
            // setCurrentAccount(mailAccount);
            doGetMailContent(res[0].id, false, false, undefined, { _account: mailAccount })
              .then((_content: MailEntryModel) => {
                // 过滤系统级标签
                const noSysTagContent = filterSysMailTag(_content);
                res[0] = noSysTagContent;
                if (isCorpMail) {
                  noSysTagContent.isThread = isThread;
                  setData(noSysTagContent, true);
                }
                setMailList(res);
                // 只有一封邮件时：默认展开自动标记已读
                setActiveKey([_content?.entry?.id]);
                shouldAutoReadMail && _content?.entry?.readStatus === 'unread' && handleRemark(true, _content?.id, 'read', true);
              })
              .catch((err: string) => {
                if (err !== ERROR_REQUEST_CANCLE) {
                  // setMailDetailIsError(true);
                  setLoadStatus(MAIL_LOAD_STATUS.FAIL);
                  setLoadFailErr(err);
                  trackApi.track('pc_readmail_content_load_failed', {
                    error: err,
                    from: 'doGetThreadMailContent-doGetMailContent',
                    isCustomRequest: isCustomRequest,
                  });
                }
              });
          } else {
            if (isCorpMail) {
              setData(res[0], true);
            }
            setMailList(res);
          }
          setLoadStatus(MAIL_LOAD_STATUS.SUCCESS);
        })
        .catch((err: string) => {
          if (err !== ERROR_REQUEST_CANCLE) {
            trackApi.track('pc_readmail_content_load_failed', {
              error: err,
              from: 'doGetThreadMailContent-doGetThreadMailContent',
            });
          }
        });
    },
    [id, threadMailIds]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setThreadPageConfig({
        ...threadPageConfig,
        current: page,
      });
      const pageSize = threadPageConfig.pageSize || THREAD_MAIL_PAGE_SIZE;
      let requestParam = {
        desc: mergeMailOrderDescRef.current,
        start: pageSize * (page - 1 > 0 ? page - 1 : 0),
        limit: pageSize,
      };
      let noCache = false;
      if (isCorpMail) {
        noCache = true;
      }
      setActiveKey([]);
      getThreadMailContent(requestParam, noCache);
    },
    [threadPageConfig, getThreadMailContent]
  );

  // 根据初始content 来设置对应的 TranslateInfo
  const handleTranslateInfo = useCallback(
    (content: MailEntryModel) => {
      if (content?.entry?.langType && content?.entry?.langType !== 'origin') {
        setTranslateInfoMidMap({
          ...translateInfoMidMapRef.current,
          [content?.entry?.id]: {
            status: 'success',
            code: 0,
            from: 'auto',
            to: content?.entry?.langType,
          },
        });
      }
    },
    [content]
  );

  /**
   * 判断id是否属于当前邮件
   */
  const idIsBelongCurMail = useCallback(
    (mid: string): boolean => {
      return mid == content?.entry?.id || (content?.isThread && mailList && mailList.length ? mailList.some(item => item?.entry?.id == mid) : false);
    },
    [content, mailIdList]
  );

  /**
   * 处理邮件翻译数据变更
   */
  const handleTranslateData = useCallback(
    async (transMailId: string, toLang?: string) => {
      // 用主账号翻译
      if (content?.entry?.id == transMailId) {
        // setCurrentAccount();
        const newContent = await getTranslateContent(transMailId, toLang);
        if (newContent) {
          setData(newContent);
        }
      } else if (content?.isThread && mailListRef.current && mailListRef.current.length && mailListRef.current.some(item => item?.entry?.id == transMailId)) {
        // 如果属于某个聚合邮件的子邮件
        const index = mailListRef.current.findIndex(item => item?.entry?.id == transMailId);
        if (index > -1) {
          // setCurrentAccount();
          const newContent = await getTranslateContent(transMailId, toLang);
          if (newContent) {
            const list = [...mailListRef.current];
            list[index] = newContent;
            setMailList(list);
          }
        }
      }
    },
    [content?.id]
  );

  // /**
  //  *
  //  */
  // const changeContentByLocal = useCallback((toLang: string, comContent: string, newContent: MailEntryModel): MailEntryModel => {
  //   if (Object.getOwnPropertyNames(newContent.entry.langListMap).length === 0) {
  //     newContent.entry.langListMap = {
  //       origin: combineContent(newContent.entry.title, newContent.entry.content.content)
  //     };
  //   }
  //   const [titleStr, contentStr] = splitContent(comContent);
  //   if(titleStr != null){
  //     newContent.entry.title = titleStr;
  //   }
  //   if(contentStr != null){
  //     newContent.entry.content.content = contentStr;
  //   }

  //   newContent.entry.langType = toLang;
  //   if (newContent.entry.langListMap && !newContent.entry.langListMap[toLang]) {
  //     newContent.entry.langListMap[toLang] = comContent;
  //   }
  //   return newContent;
  // },[]);

  // 根据邮件翻译设置，组装content
  const transMailContnet = useMemo(() => {
    if (content && content.entry.langType && content.entry.langListMap) {
      const langListMap = content.entry.langListMap;
      const langType = content.entry.langType;
      const result = langListMap[langType];
      if (result) {
        return changeContentByLocal(langType, result, content);
      }
    }
    return content;
  }, [content, content?.entry?.content?.content, content?.entry?.langType, content?.isDecrypted]);

  // 返回原文，则不能走数据库的通用逻辑，直接修改本地的content，
  const handleTranslateByLocal = useCallback(
    (transMailId: string, toLang: string) => {
      if (content?.entry?.id == transMailId && !idIsTreadMail(content?.entry?.id)) {
        const mergeContent = content.entry.langListMap ? content.entry.langListMap[toLang] : '';
        const newContent = changeContentByLocal(toLang, mergeContent, content);
        if (newContent) {
          setData(newContent);
          setTranslateInfoMidMap({
            ...translateInfoMidMapRef.current,
            [transMailId]: {
              status: '',
            },
          });
        }
      } else if (content?.isThread && mailListRef.current && mailListRef.current.length && mailListRef.current.some(item => item?.entry?.id == transMailId)) {
        const index = mailListRef.current.findIndex(item => item?.entry?.id == transMailId);
        if (index > -1) {
          const _content = mailListRef.current[index];
          const mergeContent = _content.entry.langListMap ? _content.entry.langListMap[toLang] : '';
          const newContent = changeContentByLocal(toLang, mergeContent, _content);
          if (newContent) {
            const list = [...mailListRef.current];
            list[index] = newContent;
            setMailList(list);
            setTranslateInfoMidMap({
              ...translateInfoMidMapRef.current,
              [transMailId]: {
                status: '',
              },
            });
          }
        }
      }
      // setCurrentAccount(mailAccount);
      MailApi.syncTranslateContentToDb(transMailId, toLang, undefined, mailAccount);
    },
    [transMailContnet, changeContentByLocal, mailIdList, setData]
  );

  const getFromAndToLang = useCallback((toLang?: string) => {
    // 'zh-CHS'
    let systemLang = navigator.language === 'zh-CN' ? 'zh-CHS' : navigator.language;
    // let from = productVersionId === 'free' ? 'en' : 'auto';
    let from = 'auto';
    let to = toLang || systemLang;
    return { from, to };
  }, []);

  const handleTranslateLang = useCallback(
    (transMailId: string, toLang: string) => {
      if (toLang === 'repeat') {
        handleTranslateData(transMailId, translateInfoMidMapRef.current[transMailId]?.to);
      } else if (toLang === 'origin') {
        handleTranslateByLocal(transMailId, 'origin');
      } else {
        handleTranslateData(transMailId, toLang);
      }
    },
    [handleTranslateData, handleTranslateByLocal]
  );

  const handleTranslateLangRef = useCreateCallbackForEvent(handleTranslateLang);

  const handleTranslateChanged = useCallback(
    async (e: SystemEvent) => {
      const { eventStrData, eventData } = e;
      const { id: transMailId } = eventData;
      if (idIsBelongCurMail(transMailId)) {
        if (eventStrData === 'translate') {
          handleTranslateData(transMailId);
        }
        if (eventStrData === 'cancelTranslate') {
          handleTranslateByLocal(transMailId, 'origin');
        }
      }
    },
    [handleTranslateData, handleTranslateByLocal]
  );

  // const combineContent = useCallback((title: string, content: string) => {
  //   return title + '<headm></headm>' + content;
  // },[]);

  const doTranslateContentByNet = useCallback(
    async (content: MailEntryModel, from: string, to: string): Promise<MailEntryModel | void> => {
      // 用原始去翻译，如果数据被删除后，可以用当前的content
      // const combineTitleAndContent = content.entry?.langListMap?.origin || combineContent(content.entry.title, content.entry.content.content)
      // 原文中的\n在翻译时被服务端丢弃，导致原文用\n换行的文本会变成一行 SIRIUS-2130
      // SIRIUS-2130 这个邮件特殊因为设置了 white-space: pre; 如果没有设置这个直接把\n换成br又会造成本来没有空行多出很多空行 SIRIUS-3501
      // 所以用<br data="n">替换\n，翻译后再把<br data="n">替换回\n
      let contentC = content?.entry?.content?.content;
      // 先把标签内部的换行符去掉，以免后续给替换成br标签导致嵌套错乱
      contentC = contentC.replace(/<[^>]*>/g, m => m.replaceAll('\n', ''));
      contentC = contentC.replaceAll('\n', '<br data="n">');
      let combineTitleAndContent = combineContent(content.entry.title, contentC);
      let newContent = cloneDeep(content);
      // setCurrentAccount(mailAccount);
      await MailApi.getTranslateContent(combineTitleAndContent, from, to, mailAccount)
        .then(res => {
          // 埋点
          trackApi.track('pcmail_readmail_translate', {
            result: res.code === 0,
            version: productVersionId,
          });
          if (res.code === 0) {
            let translation: string = res.data?.translation[0] || '';
            translation = translation.replaceAll('<br data="n">', '\n');
            newContent = changeContentByLocal(to, translation, newContent);
            if (newContent.entry.langListMap) {
              newContent.entry.langListMap[to] = translation;
            }
            setTranslateInfoMidMap({
              ...translateInfoMidMapRef.current,
              [content?.entry?.id]: {
                status: 'success',
                code: res.code,
                from,
                to,
              },
            });
            // setCurrentAccount(mailAccount);
            // 保存到数据库中
            MailApi.syncTranslateContentToDb(content.id, to, translation, mailAccount);
            return;
          }
          setTranslateInfoMidMap({
            ...translateInfoMidMapRef.current,
            [content?.entry?.id]: {
              status: 'error',
              errorMessage: res.message,
              code: res.code,
              from,
              to,
            },
          });
        })
        .catch(err => {
          // 超时的话，直接翻译失败
          setTranslateInfoMidMap({
            ...translateInfoMidMapRef.current,
            [content?.entry?.id]: {
              status: 'error',
              errorMessage: '30',
              code: 500,
              from,
              to,
            },
          });
        });
      return newContent;
    },
    [mailAccount]
  );

  const getTranslateContent = useCreateCallbackForEvent(async (transMailId: string, toLang?: string): Promise<MailEntryModel | null> => {
    setTranslateInfoMidMap({
      ...translateInfoMidMapRef.current,
      [transMailId]: {
        status: 'process',
      },
    });
    const { from, to } = getFromAndToLang(toLang);
    // const {langListMap} = await MailApi.getMailContentTableInDb(content.id);
    const _content = transMailId == transMailContnet?.entry?.id ? transMailContnet : mailListRef.current?.find(item => item?.entry?.id == transMailId);
    if (!_content) {
      return null;
    }
    const langListMap = _content.entry.langListMap;
    let newContent;
    // 先走数据库，如果失败，则走net
    if (langListMap && langListMap[to]) {
      // 这地方 主要是更改 title、content、langtype， 并不修改langListMap
      // setCurrentAccount(mailAccount);
      await MailApi.syncTranslateContentToDb(transMailId, to, undefined, mailAccount)
        .then(async res => {
          if (!res) {
            newContent = await doTranslateContentByNet(_content, from, to);
            return;
          }
          setTranslateInfoMidMap({
            ...translateInfoMidMapRef.current,
            [transMailId]: {
              status: 'success',
              code: 0,
              from,
              to,
            },
          });
          if (_content) {
            newContent = changeContentByLocal(to || 'origin', langListMap[to], _content);
          }
        })
        .catch(async err => {
          newContent = await doTranslateContentByNet(_content, from, to);
        });
    } else {
      newContent = await doTranslateContentByNet(_content, from, to);
    }
    return newContent as MailEntryModel;
  });

  // 检测到id变更后的操作
  const handleIdChange = useCallback(async () => {
    // 上报打点信息-查看绑定账号的邮件
    try {
      trackApi.track('pcMail_view_mailDetailPage_agent', {
        mailId: typeof mailId === 'string' ? mailId : mailId?.id,
        account: typeof mailId === 'string' ? '' : mailId?.account,
      });
    } catch (e) {
      console.error('[readmail track error]:', e);
    }
    // 清除邮件已读状态
    setReadStatus(undefined);
    if (!id) {
      setLoadStatus(MAIL_LOAD_STATUS.EMPTY);
      cancelContent();
      setContent(null);
      contentRef.current = null;
      setThreadMailIds([]);
      setMailList([]);
      return;
    }
    const isThread = idIsTreadMail(id);
    setIsThreadMail(isThread);
    // 清除翻译状态
    setTranslateInfoMidMap(map => {
      if (isEmpty(map)) {
        return map;
      }
      return {};
    }); // 翻译状态
    if (!isEmpty(mailList)) {
      setMailList([]);
    }
    // 窗口内单击打开邮件详情都在此记录起始时间
    if (fromType === 'inner') {
      mailPerfTool.mailContent(fromType, 'start', { isThread: isThread });
    }
    if (id && contentRef.current == null) {
      // setDetailLoading(true);
      setLoadStatus(MAIL_LOAD_STATUS.LOADING);
    }
    if (isThread) {
      // 清空聚合邮件分页参数
      setThreadPageConfig({ ...DefaultThreadPageConfig });
      setActiveKey(list => {
        if (isEmpty(list)) {
          return list;
        }
        return [];
      });
      // setMailList([]);
      // 请求聚合邮件的实体
      if (!isCorpMail) {
        const account = typeof mailId === 'string' ? '' : mailId?.account;
        // setCurrentAccount(account || mailAccount);
        /**
         * 先从DB请求聚合邮件基本信息，快速显示，再请求具体的内容
         */
        MailApi.doGetThreadMailById(id, account || mailAccount).then(_content => {
          if (_content && _content.id === id) {
            setData(filterSysMailTag(_content), true);
            // 设置分页总数
            setThreadPageConfig({
              ...DefaultThreadPageConfig,
              total: _content?.entry?.threadMessageCount,
            });
            let requestParam = {
              desc: mergeMailOrderDescRef.current,
              start: 0,
              limit: threadPageConfig.pageSize,
            };
            let noCache = false;
            if (isCorpMail) {
              noCache = true;
              requestParam = {
                desc: mergeMailOrderDescRef.current,
                start: 0,
                limit: threadPageConfig.pageSize,
              };
            }
            getThreadMailContent(requestParam, noCache);
          }
        });
      } else {
        // 请求聚合邮件内容列表
        // corp邮箱不支持聚合邮件分页
        getThreadMailContent(
          {
            desc: mergeMailOrderDescRef.current,
          },
          true
        );
      }
    } else {
      const account = typeof mailId === 'string' ? '' : mailId?.account;

      const isMarkedRead = tempContent?.entry?.readStatus === 'read';
      const needMarkRead = (!tempContent?.localFilePath && !id.startsWith('eml-')) || tempContent?.entry?.readStatus === 'unread';
      console.log('doMarkMail in Readmail start', isMarkedRead, needMarkRead);
      if (needMarkRead && !isMarkedRead) {
        try {
          if (shouldAutoReadMail) {
            // setCurrentAccount(account || mailAccount);
            handleRemark(true, id, 'read', true);
          }
          if (process.env.BUILD_ISEDM) {
            contactType && trackApi.track('waimao_mail_viewUnread_mailDetailPage', { cardType: contactType });
          }
        } catch (e) {
          console.error('error when read and mark', e);
        }
      } else {
        // 如果是已读，则只记录状态'
        if (shouldAutoReadMail) {
          recordMailRead(id);
        }
      }
      // const handleRemarkFn = needMarkRead ? () => handleRemark(true, id, 'read', true) : () => Promise.resolve('not called');
      // console.log('zzzzzzzh needMarkRead', needMarkRead);
      // setCurrentAccount(account);
      // Promise.allSettled([
      //   doGetMailContent(id, false, updated, undefined, { noContactRace: !!tempContent?.entry?.content?.content, _account: account }),
      //   handleRemarkFn(),
      // ]).then(([res1]) => {
      //   if (res1.status === 'fulfilled') {
      //     const _content = (res1 as PromiseFulfilledResult<MailEntryModel>).value;
      //     const noSysTagContent = filterSysMailTag(_content);
      //     const readContent: MailEntryModel = {
      //       ...noSysTagContent,
      //       entry: {
      //         ...noSysTagContent.entry,
      //         readStatus: 'read',
      //       }
      //     }
      //     setData(readContent, true);
      //     setMailList([readContent]);
      //     handleTranslateInfo(readContent);
      //   } else {
      //     const err = (res1 as PromiseRejectedResult).reason;
      //     console.error('error', err);
      //     if (err !== ERROR_REQUEST_CANCLE) {
      //       setLoadStatus(MAIL_LOAD_STATUS.FAIL);
      //       setLoadFailErr(err);
      //       trackApi.track('pc_readmail_content_load_failed', {
      //         error: err,
      //         from: 'handleIdChange-doGetMailContent',
      //         isCustomRequest: isCustomRequest,
      //       });
      //     }
      //   }
      // });
      // setCurrentAccount(account || mailAccount);
      doGetMailContent(id, false, false, undefined, { noContactRace: !!tempContent?.entry?.content?.content, _account: account || mailAccount })
        .then((_content: MailEntryModel) => {
          reducer.doUpdateShowGlobalLoading(false);
          const noSysTagContent = filterSysMailTag(_content);
          const noSysTagContentEntry = noSysTagContent?.entry || {};
          const readContent: MailEntryModel = {
            ...noSysTagContent,
            entry: {
              ...noSysTagContentEntry,
              ...(shouldAutoReadMail && !_content.isTpMail ? { readStatus: 'read' } : {}),
            },
          };
          setData(readContent, true);
          setMailList([readContent]);
          handleTranslateInfo(readContent);
        })
        .catch((err: string) => {
          console.error('error in read content', err);
          if (err !== ERROR_REQUEST_CANCLE) {
            setLoadStatus(MAIL_LOAD_STATUS.FAIL);
            setLoadFailErr(err);
            trackApi.track('pc_readmail_content_load_failed', {
              error: err,
              from: 'handleIdChange-doGetMailContent',
              isCustomRequest: isCustomRequest,
            });
          }
        });
    }
    // setUpdated(false);
  }, [id, tempContent, mailList, mailAccount]);

  // 处理邮件的编码改变事件
  const handleMailEncodingChange = useCallback(
    (e: SystemEvent) => {
      if (e && e.eventStrData && e.eventStrData === 'mailEncoding') {
        const { mid, encoding, account } = e.eventData;
        if (isThreadMail) {
          // 在本地替换掉content
          if (mailListRef.current && mailListRef.current.length) {
            const localMailList = [...mailListRef.current];
            const index = localMailList.findIndex(item => item?.entry?.id === mid);
            if (index >= 0) {
              // setCurrentAccount(account);
              MailApi.doChangeMailEncoding(mid, encoding, { _account: account }).then(newContent => {
                const noSysTagContent = filterSysMailTag(newContent);
                localMailList.splice(index, 1, noSysTagContent);
                _setMailList(localMailList);
                setForceUpdate(count => count + 1);
              });
            }
          }
        } else {
          // 替换掉redux中的content
          // setCurrentAccount(account);
          MailApi.doChangeMailEncoding(mid, encoding, { _account: account }).then(newContent => {
            const noSysTagContent = filterSysMailTag(newContent);
            setContent(noSysTagContent);
            setForceUpdate(count => count + 1);
          });
        }
      }
    },
    [isThreadMail, mailIdList, mergeMailOrderDesc]
  );

  // const handleMailTagChanged = (e: SystemEvent, _content: any, _mailList: any) => {
  //   const { eventData, eventStrData } = e;
  //   const { tagNames = [], oldTag, updateTag } = eventData;
  //   const tags = _content?.tags || [];
  //   // 邮件标签操作只支持主账号
  //   if (_mailList && _mailList.length && isMainAccount(mailAccount)) {
  //     const list = [..._mailList];
  //     if (eventStrData === 'cleartag') {
  //       // 清楚所有邮件的该标签而不发送请求
  //       list.forEach(item => {
  //         if (item.tags) {
  //           item.tags = item.tags.filter((_item: string) => !tagNames.includes(_item));
  //         }
  //       });
  //       setMailList(list);
  //       setContent({
  //         ..._content,
  //         tags: tags?.filter((inneritem: string) => !tagNames.includes(inneritem))
  //       });
  //     } else if (eventStrData === 'updateTag') {
  //       list.forEach(item => {
  //         if (item.tags) {
  //           item.tags = item.tags.map((_item: string) => {
  //             if (_item === oldTag) {
  //               return updateTag;
  //             }
  //             return _item;
  //           });
  //         }
  //       });
  //       setMailList(list);
  //       setContent({
  //         ..._content,
  //         tags: tags.map((item: string) => {
  //           if (item === oldTag) {
  //             return updateTag;
  //           }
  //           return item;
  //         })
  //       });
  //     }
  //   }
  // };

  // 邮件标签改变的时候
  // useMsgRenderCallback('mailTagChanged', e => {
  //   handleMailTagChanged(e, cloneDeep(content), cloneDeep(mailList));
  // });

  // 邮件切换
  // useMsgRenderCallback('mailChanged', ev => {
  //   // corpMail不用处理此事件
  //   if (isCorpMail) return;
  //   const { _account } = ev;
  //   const { threadId } = ev.eventData || {};
  //   // 聚合邮件有时候回来的 id 会带着 --1 的后缀，这个需要去掉再比较
  //   let _threadId = threadId instanceof Set ? new Set() : '';
  //   if (threadId instanceof Set) {
  //     threadId.forEach((_: string) => {
  //       (_threadId as Set<string>).add(_.split('--')[0]);
  //     });
  //   } else if (typeof threadId === 'string') {
  //     _threadId = (threadId as string).split('--')[0];
  //   }
  //   const _id = id ? id.split('--')[0] : id;
  //   if (ev.eventStrData === 'refreshThreadContent' && _account === mailAccount) {
  //     const needRefresh = threadId && threadId instanceof Set ? (_threadId as Set<string>).has(String(_id)) : _threadId === _id;
  //     // 刷新详情页数据
  //     if (needRefresh && id) {
  //       const { desc, limit, start } = ev.eventData;
  //       const reqParams = desc || limit || start ? { desc, start, limit } : undefined;
  //       setCurrentAccount(_account);
  //       MailApi.doGetThreadMailContentFromDb(id, reqParams).then((res: MailEntryModel[]) => {
  //         if (!res || !res.length) {
  //           return;
  //         }
  //         const _res = res.map((item: MailEntryModel) => filterSysMailTag(item));
  //         if (res.length === 1) {
  //           setCurrentAccount(_account);
  //           doGetMailContent(_res[0].id, false, updated, undefined, { _account })
  //             .then((_content: MailEntryModel) => {
  //               // setActiveKey([_content.entry.id]);
  //               const noSysTagContent = filterSysMailTag(_content);
  //               // setData(noSysTagContent);
  //               _res[0] = noSysTagContent;
  //               setMailList(_res);
  //               // 默认展开自动标记已读
  //               setActiveKey([_content.entry.id]);
  //               _content.entry.readStatus === 'unread' && handleRemark(true, _content.id, 'read', true);
  //             })
  //             .catch((err: string) => {
  //               if (err !== ERROR_REQUEST_CANCLE) {
  //                 trackApi.track('pc_readmail_content_load_failed', {
  //                   error: err,
  //                   from: 'mailChanged-evnet',
  //                   isCustomRequest: isCustomRequest,
  //                 });
  //               }
  //             });
  //         } else {
  //           setMailList(_res);
  //         }
  //       });
  //     }
  //   }
  // });

  // 监听邮件的状态变化
  // useMsgRenderCallback('mailStatesChanged', handleRedFlagChanged);
  // useMsgRenderCallback('mailOperation', handleStatusChanged);
  // useMsgRenderCallback('mailOperationWeb', handleStatusChanged);
  // 监听邮件翻译变化==入口
  useMsgRenderCallback('mailTranslateChanged', handleTranslateChanged);

  // 监听邮件编码状态的而变化
  useMsgRenderCallback('mailMenuOper', handleMailEncodingChange);

  // // 刷新阅读、撤回列表
  // const refreshData = useCallback(() => {
  //   const id = contentRef?.current?.id;
  //   if (!id) return;
  //   getStatusOrDetail(contentRef?.current);
  // }, []);

  const onDelete = useCallback(
    (_id: string | string[] | undefined, params: any) => {
      dispatch(
        Thunks.deleteMail({
          id: _id,
          showLoading: params?.showLoading ? (params?.showGlobalLoading ? 'global' : true) : true,
          isScheduleSend: params?.isScheduleSend,
          detail: params?.detail,
        })
      )
        .unwrap()
        .then((res: any) => {
          const { payload } = res;
          if (payload?.succ) {
            if (openInNewWindow) {
              if (systemApi.isElectron()) {
                setTimeout(() => {
                  systemApi.closeWindow();
                }, 300);
              } else {
                window.close();
              }
            }
          }
        });
    },
    [openInNewWindow]
  );

  const onMark = useCallback(
    (_mark: boolean, _id: string | [string] | string[], type: MailOperationType, hideMessage?: boolean) => {
      let messageType = '';
      if (type === 'read') {
        messageType = _mark ? 'read' : 'unread';
      } else if (type === 'redFlag') {
        messageType = _mark ? 'mark' : 'unmark';
      }
      eventApi.sendSysEvent({
        eventName: 'mailStatesChanged',
        eventData: {
          mark: _mark,
          id: _id,
          type,
          hideMessage,
          ids: threadMailIds,
        },
        _account: mailAccount,
        eventStrData: messageType,
      });
    },
    [mailAccount, threadMailIds]
  );

  // 标记邮件
  const handleRemark = useCallback(
    (_mark: boolean, mid: string | [string], type: MailOperationType, hideMessage?: boolean) => {
      if (type === 'redFlag' && taskStatus === TASK_MAIL_STATUS.PROCESSING && !isThreadMail) {
        // 未完成的置顶任务不能标红旗
        Toast.info({ content: getIn18Text('WEIWANCHENGDEREN') });
        return;
      }
      // 只读模式不支持标记已读未读
      if (readOnly) {
        return;
      }
      if (onMark) {
        // setUpdated(true);
        // hideMessage为isThread
        // const isThread = hideMessage;
        if (isCorpMail && isThreadMail && threadMailIds && threadMailIds.length) {
          onMark(_mark, threadMailIds, type, hideMessage);
        } else {
          onMark(_mark, mid, type, hideMessage);
        }
      }
    },
    [taskStatus, isThreadMail, readOnly, onMark, isCorpMail, threadMailIds]
  );

  // 记录邮件阅读次数 - 不走邮件状态的本地同步逻辑
  const recordMailRead = useCreateCallbackForEvent((id: string) => {
    const account = typeof mailId === 'string' ? '' : mailId?.account;
    // setCurrentAccount(account);
    MailApi.recordMailRead(id, account);
  });

  const handleRemarkRef = useCreateCallbackForEvent(handleRemark);

  // 删除邮件
  const handleDelete = useCallback(
    (mid: string | undefined, isThread?: boolean, params?: object) => {
      if (taskStatus === TASK_MAIL_STATUS.PROCESSING && !isThreadMail) {
        // 未完成的置顶任务不能删除
        Toast.info({ content: getIn18Text('WEIWANCHENGDEREN') });
        return;
      }
      if (onDelete) {
        let mids: string | string[] | undefined = mid;
        if (isCorpMail && isThread && threadMailIds && threadMailIds.length) {
          mids = threadMailIds;
        }
        onDelete(mids, {
          isScheduleSend: content?.entry?.isScheduleSend,
          ...params,
        });
      }
    },
    [taskStatus, isThreadMail, onDelete, isCorpMail, threadMailIds, content?.id]
  );
  const handleDeleteRef = useCreateCallbackForEvent(handleDelete);

  // 查看状态
  // const doCheckList = useCallback(
  //   (_id: string, _account?: string) => {
  //     MailApi.doCheckReadStatus(_id, _account).then(data => {
  //       if (data.detail.length) {
  //         // const list = formatReadStatus(data.detail);
  //         const list = formatReadStatusByProduct(data.detail);
  //         const sucList = list.data?.filter(item => item.status === 'suc');
  //         setReadStatus(list);
  //         if (sucList?.length === list.data?.length) {
  //           message.success({ content: getIn18Text('QUANBUCHEHUICHENG'), duration: 2 });
  //         } else {
  //           // setModalVisible(true);
  //           eventApi.sendSysEvent({
  //             eventName: 'mailMenuOper',
  //             eventData: { mailData: content },
  //             eventStrData: 'showMailReadState',
  //             _account,
  //           });

  //         }
  //       } else {
  //         message.warn({ content: getIn18Text('QUANBUCHEHUISHI'), duration: 2 });
  //       }
  //     });
  //   },
  //   [content]
  // );

  // 撤回邮件
  // todo: 拆解，撤回与查看撤回接过不要耦合在一起
  // const handleWithDraw = useCallback(
  //   (mid: any, showRes: boolean, account?: string) => {
  //     // 可撤销期内 不可撤回
  //     const findRes = sendingMails.find(item => item.id === mid);
  //     if (findRes) {
  //       message.warn({ content: getIn18Text('FASONGZHONGBUKECHEHUI') });
  //       return;
  //     }
  //     // 邮件撤回只支持主账号，所以此处不考虑多账号的情况
  //     const accountAlias = systemApi.getCurrentUser()?.prop?.accountAlias || [];
  //     const currentUser = content?.sender?.contact?.contact?.accountName as string;
  //     if (!accountAlias?.includes(currentUser)) {
  //       const _all = Alert.warn({
  //         title: getIn18Text('CHEHUISHIBAI'),
  //         content: getIn18Text('CIYOUJIANFAJIAN'),
  //         funcBtns: [
  //           {
  //             text: getIn18Text('QUEDING'),
  //             type: 'primary',
  //             onClick: () => {
  //               _all.destroy();
  //             },
  //           },
  //         ],
  //       });
  //       return;
  //     }
  //     if (content?.entry?.sendTime && new Date().getTime() - new Date(content?.entry?.sendTime).getTime() > 1296000000) {
  //       const _al1 = Alert.warn({
  //         title: getIn18Text('CHEHUISHIBAI'),
  //         content: getIn18Text('CIYOUJIANJUFA'),
  //         funcBtns: [
  //           {
  //             text: getIn18Text('QUEDING'),
  //             type: 'primary',
  //             onClick: () => {
  //               _al1.destroy();
  //             },
  //           },
  //         ],
  //       });
  //       return;
  //     }
  //     if (showRes) {
  //       // setCurrentAccount(account);
  //       // MailApi.doCheckReadStatus(mid, account).then(data => {
  //       //   if (data.detail.length) {
  //       //     // const list = formatReadStatus(data.detail);
  //       //     const list = formatReadStatusByProduct(data.detail);
  //       //     setReadStatus(list);
  //       //     // setModalVisible(true);
  //       //     eventApi.sendSysEvent({
  //       //       eventName: 'mailMenuOper',
  //       //       eventData: { mailData: content },
  //       //       eventStrData: 'showMailReadState',
  //       //       _account: content?._account,
  //       //     });
  //       //   }
  //       // });
  //       eventApi.sendSysEvent({
  //         eventName: 'mailMenuOper',
  //         eventData: { mailData: content },
  //         eventStrData: 'showMailReadState',
  //         _account: content?._account,
  //       });
  //     } else {
  //       if (localStorage.getItem('backNmr') === 'true') {
  //         const key = 'withdraw....';
  //         message.loading({ content: getIn18Text('ZHENGZAICHEHUIYOU'), key });
  //         // setCurrentAccount(account);
  //         MailApi.doWithdrawMail(mid, readStatus?.tid, account).then(() => {
  //           message.destroy(key);
  //           // setCurrentAccount(account);
  //           doCheckList(mid, account);
  //         });
  //         return;
  //       }
  //       const al = Alert.warn({
  //         title: getIn18Text('QUEDINGYAOCHEHUI'),
  //         content: getIn18Text('CHEHUICHENGGONGHOU'),
  //         nmrText: getIn18Text('BUZAITIXING'),
  //         funcBtns: [
  //           {
  //             text: getIn18Text('QUXIAO'),
  //             onClick: () => al.destroy(),
  //           },
  //           {
  //             text: getIn18Text('CHEHUI'),
  //             type: 'primary',
  //             nmr: !0,
  //             onClick: (event, nmrChecked) => {
  //               if (nmrChecked) {
  //                 localStorage.setItem('backNmr', 'true');
  //               }
  //               const key = 'withdraw....';
  //               message.loading({ content: getIn18Text('ZHENGZAICHEHUIYOU'), key });
  //               // setCurrentAccount(account);
  //               MailApi.doWithdrawMail(mid, readStatus?.tid, account)
  //                 .then(() => {
  //                   message.destroy(key);
  //                   al.destroy();
  //                   doCheckList(mid);
  //                 })
  //                 .catch(err => {
  //                   message.destroy(key);
  //                 });
  //             },
  //           },
  //         ],
  //       });
  //     }
  //   },
  //   [content, sendingMails]
  // );
  // const handleWithDrawRef = useCreateCallbackForEvent(handleWithDraw);
  // 切换邮件
  const onChangeMail = useCallback(
    (_keyList: string | string[]) => {
      let keyList: string[] = [];
      if (typeof _keyList === 'string') {
        keyList = [_keyList];
      } else {
        keyList = _keyList;
      }
      if (keyList.length > activeKey.length) {
        const key = keyList[keyList.length - 1];
        const item = mailListRef.current.find(_ => _.entry.id === key);
        const index = mailListRef.current.findIndex(_ => _.entry.id === key);
        if (item && !item.entry.content.content) {
          // setCurrentAccount(mailAccount);
          MailApi.doGetMailContent(item?.id, undefined, undefined, undefined, { _account: mailAccount }).then((_content: MailEntryModel) => {
            const list = [...mailListRef.current];
            list[index] = _content;
            setMailList(list);
            setActiveKey(keyList);
            // 标记已读就会记录一次阅读记录
            if (_content?.entry.readStatus === 'unread') {
              if (shouldAutoReadMail) {
                handleRemark(true, _content.id, 'read', true);
              }
              if (process.env.BUILD_ISEDM) {
                contactType && trackApi.track('waimao_mail_viewUnread_mailDetailPage', { cardType: contactType });
              }
            } else {
              // 如果是已读，则只记录状态
              if (shouldAutoReadMail) {
                recordMailRead(_content.id);
              }
            }
          });
        } else {
          setActiveKey(keyList);
          if (item?.entry.readStatus === 'unread') {
            shouldAutoReadMail && handleRemark(true, item?.id, 'read', true);
          } else {
            // 如果是已读，则只记录状态
            shouldAutoReadMail && recordMailRead(item?.id);
          }
        }
      } else {
        setActiveKey(keyList);
      }
    },
    [mailIdList, mailAccount, handleRemark]
  );
  const onChangeMailRef = useCreateCallbackForEvent(onChangeMail);

  // 邮件失败重新加载
  const handleMailDetailRetry = () => {
    // setDetailLoading(true);
    // setMailDetailIsError(false);
    setLoadStatus(MAIL_LOAD_STATUS.LOADING);
    handleIdChange();
  };

  // 聚合邮件-排序模式切换
  const handleMergeMailOrderChange = (key: string) => {
    setMergeMailOrderDesc(key == 'desc');
    mailConfApi.doGetUserAttr([MailSettingKeys.nForward]).then(res => {
      if (res?.ntes_option) {
        const orderKey = res.ntes_option.split('');
        orderKey[15] = key == 'desc' ? '0' : '1';
        mailConfApi.setMailDefaultEncoding(orderKey.join(''));
      }
    });
  };

  // 用于参数的函数引用
  const refReloadMailContent = useCreateCallbackForEvent(handleMailDetailRetry);
  // todo: 重构，不使用ref
  const handleIdChangeRef = useCreateCallbackForEvent(handleIdChange);
  const debouceMailIdChange = useCallback(
    debounce(handleIdChangeRef, 500, {
      leading: true,
      trailing: true,
    }),
    []
  );

  // 单封模式 解锁邮件
  const singleUnlockMail = (unlockCont: MailEntryModel) => {
    const noSysTagContent = filterSysMailTag(unlockCont);
    setContent(noSysTagContent);
  };

  // 聚合模式 解锁邮件
  const mergeUnlockMail = (unlockCont: MailEntryModel) => {
    const noSysTagContent = filterSysMailTag(unlockCont);
    let newMailList: MailEntryModel[] = [];
    (mailList || []).forEach(item => {
      if (item.id === noSysTagContent.id) {
        newMailList.push(noSysTagContent);
      } else {
        newMailList.push(item);
      }
    });
    setMailList(newMailList);
    setContent(noSysTagContent);
  };

  // todo: 邮件的状态变更逻辑需要重新设计
  useEffect(() => {
    if (tempContent) {
      if (!(content && tempContent.entry.id == content?.entry?.id) || content == null) {
        setIsThreadMail(idIsTreadMail(id));
        setThreadMailIds(tempContent.entry.threadMessageIds || []);
        setData(filterSysMailTag(cloneDeep(tempContent)), true);
        setMailList([]);
      }
    }
  }, [tempContent?.entry?.id]);

  useEffect(() => {
    mailIdChangeRecord.current = {
      id: id,
      time: new Date().getTime(),
    };
    debouceMailIdChange();
  }, [id, mergeMailOrderDesc]);

  // useEffect(() => {
  //   const mailSwitchId = eventApi.registerSysEventObserver('mailSwitch', (ev: SystemEvent) => {
  //     if (ev.eventData === 'Start') {
  //       mailActions.doMailEditShow(true);
  //     }
  //     if (ev.eventData === 'End') {
  //       mailActions.doMailEditShow(false);
  //     }
  //   });
  //   return () => {
  //     eventApi.unregisterSysEventObserver('mailSwitch', mailSwitchId);
  //   };
  // }, []);

  const MergeMailElement = useMemo(
    () =>
      content ? (
        <MergeMail
          id={id}
          searchInputVisible={searchInputVisible}
          setSearchInputVisible={setSearchInputVisible}
          activeKey={activeKey}
          content={content}
          // groupTags={groupTags}
          // listData={readStatus}
          mailList={mailList}
          handleDelete={handleDeleteRef}
          handleRemark={handleRemarkRef}
          // handleWithDraw={handleWithDrawRef}
          onChangeMail={onChangeMailRef}
          readOnly={readOnly}
          handleTranslateLang={handleTranslateLangRef}
          translateInfoMidMap={translateInfoMidMap}
          threadPageConfig={threadPageConfig}
          onPageChange={handlePageChange}
          featureConfig={localFeatureConfig}
          // refreshData={refreshData}
          isUpDown={isUpDown}
          forceUpdate={forceUpdate}
          ContentMeasurement={ContentMeasurement}
          // @ts-ignore
          VrticalScrollWrapComponent={VrticalScrollWrapComponent}
          HorizontalScrollWrapComponent={HorizontalScrollWrapComponent}
          setContentWidth={setContentWidth}
          vScrolling={vScrolling}
          unlockMail={mergeUnlockMail}
          onOrderChange={handleMergeMailOrderChange}
          mergeMailOrderDesc={mergeMailOrderDesc}
        />
      ) : (
        <></>
      ),
    [
      activeKey,
      translateInfoMidMap,
      content?.id,
      // readStatus,
      threadPageConfig,
      readOnly,
      mailList,
      handlePageChange,
      searchInputVisible,
      setSearchInputVisible,
      forceUpdate,
      vScrolling,
      mergeMailOrderDesc,
    ]
  );

  const handleTranslateLangSignleMail = useCallback(
    (value: string) => {
      handleTranslateLangRef(content?.entry?.id, value);
    },
    [content?.entry?.id]
  );
  const handleTranslateLangSignleMailRef = useCreateCallbackForEvent(handleTranslateLangSignleMail);

  // 单封读信页 content
  const SingleMailElement = useMemo(
    () =>
      transMailContnet ? (
        <SingleMail
          searchInputVisible={searchInputVisible}
          setSearchInputVisible={setSearchInputVisible}
          sliceId={sliceId}
          content={transMailContnet}
          // listData={readStatus}
          openRecordData={openRecordData}
          // getMailReadDetail={getMailReadDetail}
          // handleWithDraw={handleWithDrawRef}
          // refreshData={refreshData}
          readOnly={readOnly}
          mailIdChangeRecord={mailIdChangeRecord}
          translateInfo={translateInfoMidMap[id]}
          handleTranslateLang={handleTranslateLangSignleMailRef}
          featureConfig={localFeatureConfig}
          isUpDown={isUpDown}
          forceUpdate={forceUpdate}
          unlockMail={singleUnlockMail}
          source={props.source}
        />
      ) : (
        <></>
      ),
    [
      // readStatus,
      // refreshData,
      openRecordData,
      sliceId,
      readOnly,
      translateInfoMidMap,
      localFeatureConfig,
      searchInputVisible,
      setSearchInputVisible,
      forceUpdate,
      transMailContnet,
    ]
  );

  // 聚合样式的单封读信页 - 勿删，待上线
  // const SingleCardMailElement = useMemo(
  //   () => (
  //     <SingleCardMail
  //       searchInputVisible={searchInputVisible}
  //       setSearchInputVisible={setSearchInputVisible}
  //       readOnly={readOnly}
  //       isUpDown={isUpDown}
  //       translateInfo={translateInfoMidMap[id]}
  //       sliceId={sliceId}
  //       content={content}
  //       refreshData={refreshData}
  //       featureConfig={localFeatureConfig}
  //       handleRemark={handleRemarkRef}
  //       listData={readStatus}
  //       handleTranslateLang={handleTranslateLangSignleMailRef}
  //       mailIdChangeRecord={mailIdChangeRecord}
  //       handleWithDraw={handleWithDrawRef}
  //     />
  //   ),
  //   [content, readStatus, refreshData, isUpDown, sliceId, readOnly, translateInfoMidMap, localFeatureConfig]
  // );

  // 默认的空状态为用户引导页，后期如果有改变直接替换
  const DefaultEmptyElement = useMemo(
    () => (
      <div className="u-message-empty no-select dark-img-invert-grayscale">
        <img src={guidePage.imgUrl} alt="empty" />
        <div className="u-empty-title">{guidePage.title}</div>
        <div className="u-empty-text">{guidePage.desc}</div>
        {guidePage.btn && <div className="u-empty-btn">{guidePage.btn.txt}</div>}
      </div>
    ),
    [guidePage, openInNewWindow]
  );

  // 默认的错误提示
  const DefaultErrorElement = useMemo(
    () => (
      <div className="mail-detail-error-warp">
        <div className="sirius-empty sirius-empty-doc" />
        <div className="md-error-tip">{getIn18Text('JIAZAISHIBAI')}</div>
        <div className="md-btn-warp">
          <Button type="link" onClick={handleMailDetailRetry}>
            {getIn18Text('ZHONGSHI')}
          </Button>
        </div>
      </div>
    ),
    [handleMailDetailRetry]
  );

  const emptyRenderRef = useStateRef(emptyRender);
  // 空状态
  const EmptyElement = useMemo(() => {
    if (emptyRenderRef.current) {
      if (typeof emptyRenderRef.current === 'function') {
        const element = (emptyRender as Function)();
        if (element) {
          return element;
        } else {
          return DefaultEmptyElement;
        }
      } else {
        return emptyRenderRef.current;
      }
    }
    return DefaultEmptyElement;
  }, [DefaultEmptyElement]);

  const failRenderRef = useStateRef(failRender);
  // 错误状态
  const ErrorElement = useMemo(() => {
    if (failRenderRef.current) {
      if (typeof failRenderRef.current === 'function') {
        // todo： 传入失败的错误信息
        return failRenderRef.current({
          error: loadFailError,
          retry: refReloadMailContent,
        });
      } else {
        return failRenderRef.current;
      }
    }
    return DefaultErrorElement;
  }, [DefaultErrorElement, loadFailError, refReloadMailContent]);

  // 最终展示的loading
  const LoadingElement = useMemo(() => {
    if (loadingRender) {
      if (typeof loadingRender === 'function') {
        // todo： 传入失败的错误信息
        const res = loadingRender();
        if (res) {
          return res;
        } else {
          return <MailDetailLoading />;
        }
      } else {
        return loadingRender;
      }
    }
    return <MailDetailLoading />;
  }, [loadingRender]);

  // 读信页监听CommandF的处理
  const handleHKCommandF = useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault();
      if (content?.isEncryptedMail) {
        Toast.info({ content: '加密邮件暂不支持正文搜索' });
        return;
      }
      setSearchInputVisible(true);
    },
    [content?.isEncryptedMail]
  );

  useEffect(() => {
    if (inWindow()) {
      // 读信内部command+f 显示输入框
      // @ts-ignore
      if (!window.readMail) window.readMail = {};
      // @ts-ignore
      window.readMail.keyEvent = e => {
        if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
          // e.preventDefault();
          if (content?.isEncryptedMail) {
            Toast.info({ content: '加密邮件暂不支持正文搜索' });
            return;
          }
          setSearchInputVisible(true);
        }
      };
    }
  }, [setSearchInputVisible, content?.isEncryptedMail]);

  const handleHKCommandFRef = useCreateCallbackForEvent(handleHKCommandF);

  const listHotKeyHandler = useMemo(() => {
    return {
      [ListHotKey.COMMAND_F]: handleHKCommandFRef,
    };
  }, []);

  return (
    // @ts-ignore
    <HotKeys keyMap={keyMap} handlers={listHotKeyHandler} style={{ width: '100%', height: '100%' }}>
      <WrapCompenent
        className={'u-read-wrapper ' + (isThreadMail && mailList.length ? 'thread' : 'single')}
        style={{
          height: '100%',
          // backgroundColor: isThreadMail && mailList.length ? '#f4f4f5' : '#FFF',
        }}
      >
        {loadStatus == MAIL_LOAD_STATUS.SUCCESS ? isThreadMail ? MergeMailElement : SingleMailElement : <></>}

        {loadStatus == MAIL_LOAD_STATUS.EMPTY ? EmptyElement : <></>}

        {loadStatus == MAIL_LOAD_STATUS.FAIL ? ErrorElement : <></>}

        {loadStatus == MAIL_LOAD_STATUS.LOADING ? LoadingElement : <></>}

        <AttachmentPreview />
        {/* {modalVisible && !readOnly ? (
          <StatusModal tid={content?.entry?.tid} readListData={readStatus} onClose={() => setModalVisible(false)} visible={modalVisible} refreshData={refreshData} />
        ) : null} */}
        {/* 聚合邮件下-虚拟的横向滚动条 */}
        {isThreadMail ? (
          <div style={{ position: 'absolute', width: '100%', bottom: '2px', zIndex: 100 }}>
            <HorizontalScrollBar
              scrollWidth={vScrollBarWidth}
              scrollLeft={vScrollBarLeft}
              onScroll={handleVScrollOnScroll}
              show={vScrollBarShow}
              horizontalPadding={32}
              inWindows={inWindows}
              onScrollChange={state => {
                setVScrolling(state);
              }}
            />
          </div>
        ) : (
          <></>
        )}
      </WrapCompenent>
    </HotKeys>
  );
};
export default ReadMail;
