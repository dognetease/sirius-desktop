/* eslint-disable array-callback-return */
/* eslint-disable max-statements */
import React, { useCallback, useEffect, useRef, useState, useMemo, useContext } from 'react';
import { navigate } from 'gatsby';
import {
  apiHolder as api,
  apis,
  locationHelper,
  MailApi,
  MailConfApi,
  MailEntryModel,
  MailModelEntries,
  MailOperationType,
  queryMailBoxParam,
  SystemEvent,
  AccountApi,
  ProductAuthApi,
  folderId2TransMap,
  MailSettingKeys,
} from 'api';
import message from '@web-common/components/UI/Message/SiriusMessage';
import useMailStore from '@web-mail/hooks/useMailStoreRedux';
import { MailActions, useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import useMsgCallback from '@web-common/hooks/useMsgCallback';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import moment from 'moment';
import { actions as mailTabActions, MailTabModel, tabType } from '@web-common/state/reducer/mailTabReducer';
import { filterTabMap, FLOLDER, LIST_MODEL, MAIL_STORE_REDUX_STATE, MAIL_TAG_GUIDE_LOCAL_KEY } from '../../common/constant';
import { folderCanSortByTop } from '../../state/customize';
import useState2RM from '../../hooks/useState2ReduxMock';
import { getTopMailNum, isMainAccount, mailLogicStateIsMerge, setCurrentAccount, promiseIsTimeOut, getStateFromLocalStorage, getAllAccountHK } from '../../util';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { useDebounceEffect, useUpdateEffect } from 'ahooks';
import { MAIL_LIST_INIT_RANGE_COUNT, MAIL_LIST_MORE_RANGE_COUNT, MAX_MAILTOP_SUM, MAIL_TAG_HOTKEY_LOCAL_KEY } from '@web-mail/common/constant';
import useStateRef from '@web-mail/hooks/useStateRef';
import { getIn18Text } from 'api';
import { requestInQueue } from '@web-common/utils/utils';
import debounce from 'lodash/debounce';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';
import { stringMap } from '@web-mail/types';
import { MailModuleHKContent } from '@web-mail/components/ListHotKeys/moduleHotKey';

/**
 * API 相关
 */
const MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const MailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const mailManagerApi = api.api.requireLogicalApi('mailConfApiImpl') as unknown as MailConfApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const productAuthApi = api.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const queueRequest = requestInQueue();
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const eventApi = api.api.getEventApi();
const systemApi = api.api.getSystemApi();

const MailBoxEventHander: React.FC<any> = props => {
  const reducer = useActions(MailActions);
  const mailTodoModal = useNiceModal('mailTodo');
  // 红旗、已读、置顶状态修改
  // const setRemarkMail = (mark: boolean, id: string | string[], type: MailOperationType, isThread?: boolean,) => MailApi.doMarkMail(mark, id, type, isThread);
  /**
   * redux 状态
   */
  // 当前页签
  const currentTabAccountId = useAppSelector(state => state.mailTabReducer.currentTab.extra?.accountId);
  // 邮件-多账号-失效账号列表
  const [expiredAccountList, setExpiredAccountList] = useState2RM('expiredAccountList', 'doUpdateExpiredAccountList');
  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2RM('mailSearching', 'doUpdateMailSearching');
  // 邮件-搜索-是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
  // 邮件-搜索-是否是高级搜素
  const isAdvancedSearch = useMemo(() => mailSearching === 'advanced', [mailSearching]);
  // 邮件列表是否处于loading
  const [listLoading, setListLoading] = useState2RM('listLoading', 'doUpdateMailListLoading');
  const refListLoading = useRef(false);
  refListLoading.current = listLoading;
  // 搜索列表-文件夹-选中的key
  const [selectedSearchKeys, setSelectedSearchKeys] = useState2RM('selectedSearchKeys', 'doUpdateSelectedSearchKey');
  // 邮件列表-文件夹-选中的key
  const [selectedKeys, setSelectedKeys] = useState2RM('selectedKeys', 'doUpdateSelectedKey');
  // 邮件标签列表-选中的标签名称
  const [tagName, setTagName] = useState2RM('mailTagFolderActiveKey', 'doUpdateMailTagFolderActiveKey');
  // 搜索-邮件列表
  const [searchList, setSearchList] = useMailStore('searchList');
  const [mailDataList, setMailList] = useMailStore('mailDataList', { key: 'mailList', exclude: ['receiver'] });
  // 邮件-邮件列表-总数
  const [mailTotal, setMailTotal] = useState2RM('mailTotal', 'doUpdateMailTotal');
  // 邮件列表-选中的邮件idlist
  const [activeIds, setActiveIds] = useState2RM('activeIds');
  // 邮件列表-上部-二级tab选中
  const [selected, setSelected] = useState2RM('mailListStateTab', 'doUpdateMailListStateTab');
  // 邮件列表-上部-二级tab选中后的时间弹窗选中时间
  const [dateRange, setDateRange] = useState2RM('orderDateRange', 'doUpdateOrderDateRange');
  // 邮件列表宽高设置
  // const [scrollTop, setScrollTop] = useState2RM('scrollTop', 'doUpdateMailListScrollTop');
  // 搜索列表-上部-二级tab选中
  const [searchSelected, setSearchSelected] = useState2RM('searchListStateTab', 'doUpdateSearchListStateTab');
  // // 邮件列表-文件夹-树形结构-list
  // const [folderMoveId] = useState2RM('folderMoveId', 'doUpdateFolderMoveId');
  // 邮件-搜索-关键字
  const [inputValue, setInputValue] = useState2RM('mailSearchKey', 'doUpdateMailSearchKey');
  // 邮件-搜索-类别
  const [searchType, setSearchType] = useState2RM('mailSearchType', 'doUpdateMailSearchType');
  // 邮件-搜索-是否需要记录
  const [mailSearchRecord, setMailSearchRecord] = useState2RM('mailSearchRecord', 'doUpdateMailSearchRecord');
  // 邮件-搜索-选中的邮件id
  const [searchMail, setSearchMail] = useState2RM('activeSearchMailId', 'doUpdateActiveSearchMailId');
  // 当前邮件文件夹是否处于锁定
  const [authLock, setAuthLock] = useState2RM('mailFolderIsLock', 'doUpdateMailFolderIsLock');
  // 邮件-移动文件夹-是否显示
  const [isShowTreeMenu, setTreeMenu] = useState2RM('mailMoveModalVisiable', 'doUpdateMailMoveModalVisiable');
  // 邮件列表-筛选菜单
  const [condition, setCondition] = useState2RM('mailTabs', 'doUpdateMailTabs');
  // 邮件列表-当前选中的邮件id
  const [selectedMail, setSelectedMail] = useState2RM('selectedMailId', 'doUpdateSelectedMail');
  // 当前邮件目录-邮件删除后保留的天数
  // const [keepPeriod, setKeepPeroid] = useState2RM('keepPeriod', 'doUpdateKeepPeriod');

  const [listModel, setListModel] = useState2RM('defaultMailListSelectedModel', 'doUpdateMailListSelectedModel');
  // 文件夹-树-是否包含用户自定义文件夹
  // const [hasCustomFolder, setHasCustomFolder] = useState2RM('hasCustomFolder', 'doUpdateHasCustomFolder');
  // 移动邮件-弹窗-显示的真实邮件数量
  const [moveModalMailNum, setMoveModalMailNum] = useState2RM('mfModalReadMailNum', 'doUpdateMfModalReadMailNum');
  // 已读未读、红旗，标签等状态修改是否展示toast
  const [__, setHideMessage] = useState2RM('hideMessage', 'doUpdateMsgHideMessage');
  // 标签修改自定义toast文案（成功）
  const [successMsg, setSuccessMsg] = useState2RM('successMsg', 'doUpdateMsgSuccessStr');
  // 标签修改自定义toast文案（失败）
  const [failMsg, setFailMsg] = useState2RM('failMsg', 'doUpdateMsgFailStr');
  // 设置高级搜索的表单字段
  const [isSearchRecorded, setIsSearchRecorded] = useState2RM('isSearchRecorded', 'doUpdateIsSearchRecordeds');
  // 分账号存储的文件夹 map
  const [mailTreeStateMap, setTreeState] = useState2RM('mailTreeStateMap', 'doUpdateMailTreeState');
  const mailTreeStateMapRef = useStateRef(mailTreeStateMap);
  // 任务邮件相关
  // const [taskSelected, setTaskSelected] = useState2RM('taskMailListStateTab', 'doUpdateTaskMailListStateTab');
  // 邮件待办 稍后处理
  // const [deferSelected, setDeferSelected] = useState2RM('deferMailListStateTab', 'doUpdateDeferMailListStateTab');
  // redux中的maiMap
  const mailEntitiesMap = useAppSelector(state => state.mailReducer[MAIL_STORE_REDUX_STATE]);
  // 分栏通栏
  const [configMailLayout, setConfigMailLayout] = useState2RM('configMailLayout', 'doUpdateConfigMailLayout');
  // 邮件雷彪是否展示主动loading
  const [listIsRefresh, setListIsRefresh] = useState2RM('listIsRefresh');

  //快捷设置三个，摘要，附件，列表密度，会影响列表重排列
  const [descChecked, setDescChecked] = useState2RM('configMailListShowDesc', 'doUpdateConfigMailListShowDesc');
  const [attachmentChecked, setAttachmentChecked] = useState2RM('configMailListShowAttachment', 'doUpdateConfigMailListShowAttachment');
  const [mailConfigListTightness, setMailConfigListTightness] = useState2RM('configMailListTightness', 'doUpdateConfigMailListTightness');

  const isLeftRight = useMemo(() => configMailLayout === '1', [configMailLayout]);
  const [, setShowAvator] = useState2RM('', 'doUpdateConfigMailListShowAvator');
  const [, setShowRealList] = useState2RM('', 'doUpdateUseRealList');
  const [, setShowConcreteTime] = useState2RM('', 'doUpdateConfigMailListShowConcreteTime');
  const [, setShowCustomerTab] = useState2RM('configMailListShowCustomerTab', 'doUpdateConfigMailListShowCustomerTab');
  // 设置 正文-聚合邮件-的展示顺序
  const [, setMergeMailOrderDesc] = useState2RM('mergeMailOrderDesc');

  // 当前搜索任务id-相同的搜索任务id会被拦截
  // const searchId = useRef<null | number>(null);
  // const { doUpdateMailTagList, doMailEditShow } = useActions(MailActions);
  const dispatch = useAppDispatch();
  // 列表首次加载状态的监测timer
  const listInitCheckeTiemr = useRef<number | null>(null);
  // 当前选中的模块
  const curActiveKey = useAppSelector(state => state.globalReducer.activeKey);
  /**
   * 内部方法
   */
  // 获取当前列表是否处于聚合模式
  const isMerge = () => mailLogicStateIsMerge(selectedKeys.id, selectedKeys.accountId, isSearching);
  // 获取当前选中邮件中的真是邮件数目-拆解聚合邮件
  // todo-merge: 根据邮件的属性去读取邮件的聚合状态，不再依赖当前状态
  const getRealMailNum = () => {
    let realMailSum = activeIds.length;
    if (isMerge()) {
      realMailSum = 0;
      mailDataList.forEach(item => {
        if (activeIds.includes(item.entry.id)) {
          realMailSum += item?.entry?.threadMessageCount;
        }
      });
    }
    return realMailSum;
  };
  // 邮件列表回到顶部
  const handleBackToTop = () => {
    // setScrollTop(0);
    reducer.doUpdateMailListScrollTop(0);
  };
  // 刷新文件夹
  const refreshFolder = (noCache = false, from?: string) => {
    console.log('doMarkMail refreshFolder start');
    // 超时检测
    promiseIsTimeOut(
      dispatch(
        Thunks.refreshFolder({
          noCache,
          from,
        })
      ),
      'pc_refreshFolder_timeout',
      {
        from: 'mailBoxEventHander:' + from,
      }
    );
  };
  const refreshFolderDebounce = useCallback(debounce(refreshFolder, 1000), []);

  // 获取邮件请求参数
  // todo-merge: 重构-当前请求及状态扔到redux中去操作，
  const getMailListReqParams = (startIndex: number) => {
    let fid: number | undefined = selectedKeys ? +selectedKeys.id : 1;
    const setting = isMerge();
    let count = MAIL_LIST_MORE_RANGE_COUNT;
    if (startIndex == 0 || selectedKeys.id === FLOLDER.TASK) {
      count = MAIL_LIST_INIT_RANGE_COUNT;
    }
    const param: queryMailBoxParam = {
      index: startIndex,
      id: fid,
      count,
      returnModel: true,
      returnTag: true,
    };
    // 按照tag搜索不用fid
    if (selectedKeys && selectedKeys.id === FLOLDER.TAG) {
      param.id = undefined;
      fid = undefined;
    }
    if (tagName?.key) {
      param.tag = [tagName?.key];
    }
    // 智能模式下线
    // if (selected === 'PREFERRED') {
    //   param.filter = {
    //     preferred: 0
    //   };
    // } else
    if (selected === 'UNREAD') {
      param.filter = {
        flags: { read: false },
      };
    } else if (selected === 'ATTACHMENT') {
      param.filter = {
        flags: { attached: true },
      };
    } else if (selected === 'REDFLAG') {
      param.filter = { label0: 1 };
    } else if (folderCanSortByTop(fid, isCorpMail)) {
      param.topFlag = 'top';
    }
    // 任务邮件箱
    if (selectedKeys.id === FLOLDER.TASK) {
      if (selected === 'ALL') {
        param.filter = {
          taskTab: 0,
        };
      } else if (selected === 'ON') {
        param.filter = {
          taskTab: 1,
        };
      }
    }
    // 稍后处理 待办邮件箱
    if (selectedKeys.id === FLOLDER.DEFER) {
      if (selected === 'DEFER') {
        param.filter = {
          defer: `:${moment().format('YYYYMMDD')}`,
        };
      }
    }
    if (setting) {
      param.checkType = 'checkThread';
    }
    return param;
  };

  const handleSetMarkMail = ({ mark, id, type, hideMessage, key, _account }: any) =>
    MailApi.doMarkMail(mark, id, type, undefined, undefined, undefined, _account).then(res => {
      if (res && res.succ) {
        !hideMessage &&
          message.success({
            content: mark ? getIn18Text('BIAOJIYIDUCHENG') : getIn18Text('BIAOJIWEIDUCHENG'),
            duration: 1,
            key,
          });
      } else {
        !hideMessage &&
          message.error({
            content: mark ? getIn18Text('BIAOJIYIDUSHI') : getIn18Text('BIAOJIWEIDUSHI'),
            duration: 1,
            key,
          });
      }
      if (isCorpMail) {
        try {
          setTimeout(() => {
            refreshFolder(true, 'handleRedFlagRequest: isCorpMail');
          }, 1000);
        } catch (ex) {
          console.error(ex);
        }
      }
      return res;
    });

  // 请求部分已迁移到全局，此处只处理逻辑
  // 处理标签变动请求
  const handleMailTagChangeRequest = (e: SystemEvent<any>) => {
    const { eventData, eventStrData, _account } = e;
    const { mailList = [] as string[], tagNames = [], successMsg: _successMsg, failMsg: _failMsg, isNewTag } = eventData;
    // 用于回退的记录
    // const id2OldTagMap = {};
    // mailList.forEach((item: MailEntryModel) => {
    //   id2OldTagMap[item.id] = item?.tags || [];
    // });
    // const id = mailList?.map((item: MailEntryModel) => item.entry.id);
    setSuccessMsg(_successMsg);
    setFailMsg(_failMsg);
    if (eventStrData === 'tag' || eventStrData === 'untag') {
      // 判断是否要展示邮件标签快捷键的引导
      try {
        const record: boolean = !!localStorage.getItem(MAIL_TAG_GUIDE_LOCAL_KEY);
        if (!record) {
          eventApi.sendSysEvent({
            eventName: 'mailMenuOper',
            eventData: {
              visiable: true,
            },
            eventStrData: 'showMailTagGuideModal',
          });
        }
      } catch (ex) {
        console.error('[error] showMailTagGuideModal', ex);
      }

      const isAddTag = eventStrData === 'tag';
      // 发送请求
      const req = isAddTag
        ? {
            ids: mailList,
            add: tagNames,
            isNewTag,
          }
        : {
            ids: mailList,
            delete: tagNames,
          };
      const _key = tagNames?.join(',');
      // 标签现在只要主账号有
      // setCurrentAccount();
      MailApi.updateMessageTags(req, undefined, undefined, _account)
        .then(() => {
          const addTip = isNewTag ? getIn18Text('XINJIANBINGBIAOJI') : getIn18Text('DABIAOQIANCHENGGONG');
          message.success({
            content: successMsg || (eventStrData === 'tag' ? addTip : getIn18Text('QUXIAOBIAOQIANCHENG')),
            duration: 1,
            key: _key,
          });
          if (isNewTag) {
            setTimeout(() => {
              dispatch(
                Thunks.requestTaglist({
                  account: _account,
                })
              );
            }, 2000);
          }
        })
        .catch(() => {
          message.error({
            content: failMsg || (eventStrData === 'tag' ? getIn18Text('DABIAOQIANSHIBAI') : getIn18Text('QUXIAOBIAOQIANSHI')),
            duration: 1,
            key: _key,
          });
        });
    }
  };
  const handleRedFlagRequest = (e: SystemEvent<any>, _mailDataList: MailEntryModel[]) => {
    // if (window?.location?.pathname?.includes('readMail')) return false;
    const { eventData, eventStrData, _account } = e;
    const { mark, id, type, hideMessage } = eventData;
    // 有些条件下不会消息不会传递id，拦截
    if (id == null) {
      console.error('[mailStateChange ERROR]', getIn18Text('MEIYOUCHUANDIYOU'));
      return false;
    }
    const key = typeof id === 'string' || typeof id === 'number' ? id : id.join(',');
    setHideMessage(!!hideMessage);
    if (id.length <= 0) {
      // TODO: 非空处理过于简单
      console.log(getIn18Text('BIAOJISHIid'));
      return false;
    }
    if (eventStrData === 'mark' || eventStrData === 'unmark') {
      // setCurrentAccount(_account);
      return MailApi.doMarkMail(mark, id, type, undefined, undefined, undefined, _account).then(res => {
        if (res && res.succ) {
          !hideMessage &&
            message.success({
              content: mark ? getIn18Text('BIAOWEIHONGQICHENG') : getIn18Text('QUXIAOHONGQICHENG'),
              duration: 1,
              key,
            });
        } else {
          !hideMessage &&
            message.error({
              content: mark ? getIn18Text('BIAOWEIHONGQISHI') : getIn18Text('QUXIAOHONGQISHI'),
              duration: 1,
              key,
            });
        }
      });
    }
    // 邮件待办
    if (eventStrData === 'defer' || eventStrData === 'undefer') {
      if (eventStrData === 'undefer') {
        // 标记已处理
        // setCurrentAccount(_account);
        MailApi.doMarkMailDefer(id, false, undefined, undefined, _account).then(res => {
          if (res && res.succ) {
            message.success({ content: getIn18Text('YICHULI'), duration: 1, key });
          } else {
            message.error({ content: getIn18Text('CAOZUOSHIBAI\uFF0C'), duration: 1, key });
          }
          refreshFolder(true, 'handleRedFlagRequest:defer');
        });
      } else if (eventStrData === 'defer') {
        // 稍后处理
        // setCurrentAccount(_account);
        mailTodoModal.show({
          mailId: id,
          isDefer: eventData.isDefer,
          deferTime: eventData.deferTime,
          deferNotice: eventData.deferNotice,
        });
      }
    }
    // 设置优先，智能模式去掉
    // if (eventStrData === 'preferred' || eventStrData === 'unpreferred') {
    //   setCurrentAccount(_account);
    //   return setRemarkMail(mark, id, type).then(res => {
    //     if (res && res.succ) {
    //       !hideMessage
    //         && message.success({
    //           content: mark
    //             ? typeof window !== 'undefined'
    //               ? getIn18Text('KEYIZAIYOUXIAN')
    //               : ''
    //             : typeof window !== 'undefined'
    //               ? getIn18Text('YICONGYOUXIANCHU')
    //               : '',
    //           duration: 1,
    //           key
    //         });
    //     } else {
    //       !hideMessage
    //         && message.error({
    //           content: mark
    //             ? typeof window !== 'undefined'
    //               ? getIn18Text('SHEWEIYOUXIANSHI')
    //               : ''
    //             : typeof window !== 'undefined'
    //               ? getIn18Text('QUXIAOYOUXIANSHI')
    //               : '',
    //           duration: 1,
    //           key
    //         });
    //     }
    //   });
    // }
    if (eventStrData === 'read' || eventStrData === 'unread') {
      // setCurrentAccount(_account);
      // 标记已读的操作扔进一个队列里面，一个一个执行
      return queueRequest(() => handleSetMarkMail({ mark, id, hideMessage, key, type, _account }));
    }
    // 已迁移
    if (eventStrData === 'top' || eventStrData === 'unTop') {
      // if (mark && getTopMailNum(_mailDataList) >= MAX_MAILTOP_SUM) {
      //   SiriusModal.warning({
      //     content: getIn18Text('MEIGEWENJIANJIA', { count: MAX_MAILTOP_SUM }),
      //     okText: getIn18Text('ZHIDAOLE'),
      //   });
      //   return Promise.reject();
      // }
      // setCurrentAccount(_account);
      return MailApi.doMarkMail(mark, id, 'top', undefined, undefined, undefined, _account)
        .then(res => {
          if (res.succ) {
            message.success({
              content: mark ? getIn18Text('YITIANJIAZHIDING') : getIn18Text('YIQUXIAOZHIDING'),
              duration: 1,
              key,
            });
          } else {
            return Promise.reject();
          }
        })
        .catch(err => {
          if (err?.failReason?.message === 'FA_OVERFLOW') {
            SiriusModal.warning({
              content: getIn18Text('MEIGEWENJIANJIA', { count: MAX_MAILTOP_SUM }),
              okText: getIn18Text('ZHIDAOLE'),
            });
          } else {
            message.error({
              content: eventStrData === 'top' ? getIn18Text('ZHIDINGSHIBAI') : getIn18Text('QUXIAOZHIDINGSHI'),
              duration: 1,
              key,
            });
            // 刷新列表，重置状态
            loadMoreRows({ startIndex: 0, accountId: _account });
          }
        });
    }
  };
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  // 处理邮件相关的消息变化
  const handleMailChange = (ev: SystemEvent) => {
    try {
      // let ev: any = mailChangeEvent;
      const { eventData, eventStrData, _account } = ev;
      if (eventStrData === 'data') {
        if (locationHelper.testPathMatch('/')) {
          const { fid } = eventData;
          // 判断推动的邮件是否属于当前文件夹
          const isCurAccount = accountApi.getIsSameSubAccountSync(selectedKeys.accountId, _account) || isMainAccount(selectedKeys.accountId);

          // 属于统一个文件夹，属于当前账号，并且实在默认筛选下，才进入新邮件的拼接流程
          if (fid && fid?.has(selectedKeys.id) && isCurAccount && selected == 'ALL') {
            pullLateMail(ev);
          }
        }
        /**
         * 邮件未读消息-非当前文件夹-强化提醒
         * 针对非当前选中文件夹
         */
        // 1.80 由于fid中传的推送文件夹不够准确，先下掉强化逻辑了
        // if (activeFolderList && taskType === 'push') {
        //   // 如果是自定义文件夹
        //   let fidPathList:number[] = [];
        //   if (fid >= 100) {
        //     try {
        //       fidPathList = getTreeIdPathById(treeList, fid);
        //       if (fidPathList && fidPathList.length) {
        //         fidPathList = fidPathList.filter(id => {
        //           if (expandedKeys && expandedKeys.length) {
        //             return !expandedKeys.includes(id);
        //           }
        //           return true;
        //         });
        //       }
        //     } catch (e) {
        //       console.warn('handleMailChange:fidPathList Error', e);
        //     }
        //   }
        //   setActiveFolderList([...new Set([...fid, ...activeFolderList, ...fidPathList])].filter(id => id != selectedKeys.id));
        // }
      } else if (eventStrData == 'refresh') {
        refreshEmailList({ noCache: true });
        refreshFolder(true, 'handleMailChange: refresh');
      } else if (eventStrData == 'mailMergeModelChange') {
        // 当邮件的聚合模式发生切换的时候
        setSelectedMail({ id: '', accountId: '' });
        setSelected('ALL');
        refreshEmailList();
        refreshFolder(false, 'handleMailChange: mailMergeModelChange');
      } else if (eventStrData == 'refreshFolder') {
        if (locationHelper.testPathMatch('/')) {
          const { noCache } = eventData;
          console.log('doMarkMail receive refreshFolder event');
          refreshFolderDebounce(noCache, 'handleMailChange: refreshFolder');
        }
      } else if (eventStrData == 'syncFolder') {
        if (eventData) {
          // setFolderList(eventData);
          // 写入当前账号下的文件夹数据源中
          setTreeState({
            accountId: _account,
            name: 'mailFolderTreeList',
            value: eventData,
          });
        }
      } else if (eventStrData == 'syncMailTotal') {
        const { total, param } = eventData;
        if (
          param.id == selectedKeys.id ||
          (selectedKeys.id == FLOLDER.TAG &&
            param?.tag?.length > 0 &&
            param.tag[0] == tagName?.key &&
            accountApi.getIsSameSubAccountSync(tagName?.accountId || '', _account))
        ) {
          setMailTotal(total);
        }
      } else if (eventStrData == 'syncDraft') {
        const { id, closeDetail } = eventData;
        // 处理邮件发送后的草稿箱同步问题
        if ([2, 3].includes(+selectedKeys.id)) {
          syncMailDraft(_account);
          if (id && closeDetail && selectedMail.id == id) {
            setSelectedMail({ id: '', accountId: '' });
          }
        }
      } else if (eventStrData == 'intBoxChanged' || eventStrData == 'intBoxDisplayChanged') {
        // 如果邮箱设置页面，切换了，智能/聚合，默认全部/默认优先
        preferredABTEST();
      }
    } catch (e) {
      console.error(e);
    }
  };
  // 优先处理邮件列表ABTest
  const preferredABTEST = async () => {
    // 搜索模式，不展示优先tab,选中全部
    if (isSearching) {
      setSearchSelected('ALL');
      setCondition(filterTabMap.normal);
    } else if (!isMainAccount(selectedKeys.accountId)) {
      // 如果不是主账号，则默认全部,没有优先。非主账号不存在，任务，稍后文件夹
      setSelected('ALL');
      setCondition(filterTabMap.normal);
    } else {
      // 如果是收件箱/自定义文件夹，才会判断
      if (selectedKeys.id === FLOLDER.DEFAULT || selectedKeys.id >= 100) {
        // 17版本智能模式下线，不在区分是否聚合
        // 聚合模式
        // if (isMerge()) {
        //   setSelected('ALL');
        //   setCondition(filterTabMap.normal);
        // } else {
        //   // 智能模式，是否默认展示优先
        //   const temp = await MailConfApi.getIntBoxDefaultDisplayList();
        //   if (temp) {
        //     setSelected('PREFERRED');
        //     setCondition(filterTabMap.preferredFirst);
        //   } else {
        //     setSelected('ALL');
        //     setCondition(filterTabMap.allFirst);
        //   }
        // }
        setSelected('ALL');
        setCondition(filterTabMap.normal);
      } else if (selectedKeys.id === FLOLDER.TASK) {
        setSelected('ALL');
        setCondition(filterTabMap.task);
      } else if (selectedKeys.id === FLOLDER.DEFER) {
        setCondition(filterTabMap.defer);
      }
    }
  };
  // 异步加载列表数据
  const loadMoreRows = ({ startIndex, accountId, searchValue = '', advancedSearch = false, searchKeys = [-33] }, noCache: boolean = false) => {
    if (advancedSearch) {
      return dispatch(
        Thunks.loadAdvanceSearchMailList({
          startIndex,
          noCache,
          accountId,
        })
      );
    }
    if (searchValue) {
      return dispatch(
        Thunks.loadSearchMailList({
          startIndex,
          noCache,
          accountId,
        })
      );
    }
    // 正常邮件请求
    // [new redux]
    // return dispatch(
    //   mailListThunks.loadMailList({
    //     startIndex,
    //     noCache,
    //     isCorpMail
    //   })
    // )
    return dispatch(
      Thunks.loadMailList({
        startIndex,
        noCache,
        // accountId,
      })
    );
  };
  // 拉取当前文件夹最新的邮件-插入新邮件到列表头部
  const pullLateMail = ev => {
    dispatch(Thunks.pullLastMail());
  };
  // 更新同步邮件发送后的草稿箱列表
  // todo: 迁移到redux中
  const syncMailDraft = (accountId: string) => {
    const reqParams = getMailListReqParams(0);
    reqParams.count = MAIL_LIST_INIT_RANGE_COUNT;
    // setCurrentAccount(accountId);
    reqParams._account = accountId;
    MailApi.doListMailBoxEntities(reqParams, true).then((result: MailModelEntries | MailEntryModel[]) => {
      if (!result) return;
      const res = result as MailModelEntries;
      if (!res.query) return;
      if (res && res.data.length && mailDataList && mailDataList.length) {
        setMailTotal(res.total);
        setMailList(res.data as MailEntryModel[]);
      }
    });
  };

  type refreshEmailListParam = {
    noCache?: boolean;
    showLoading?: boolean;
    accountId?: string;
  };
  // 刷新邮件列表
  const refreshEmailList: (param?: refreshEmailListParam) => void = (param = {}) => {
    const { noCache = false, showLoading = true } = param;
    dispatch(
      Thunks.refreshMailList({
        noCache,
        showLoading,
        // accountId,
      })
    );
  };

  // // 刷新页面
  // const refreshPage = (showMessage = true) => {
  //   dispatch(
  //     Thunks.refreshPage({
  //       refreshPage: showMessage
  //     })
  //   );
  // };

  // useEffect(()=>{
  //   if (curActiveKey !== 'mailbox') {
  //     // 切出了额邮件模块
  //     // 刷新权限请求
  //     // productAuthApi.saveAuthConfigFromNet();
  //     // 需要使用外贸的权限机制

  //   } else {
  //     // 切回了邮件模块
  //     //
  //   }
  // },[curActiveKey]);

  /**
   * Effect
   */
  // // 初次加载
  // 初始化造成请求重
  useEffect(() => {
    refreshFolder(false, 'init');
  }, []);
  // 当移动文件的弹窗展现的时候计算一下聚合邮件的真实邮件封数
  useEffect(() => {
    if (isShowTreeMenu) {
      setMoveModalMailNum(getRealMailNum());
    }
  }, [isShowTreeMenu]);

  // 列表变化的时候，同步一下activeIds
  useEffect(() => {
    if (isSearching) {
      // TODO 搜索列表页需要
    } else {
      const res = activeIds.filter(item => !!mailDataList.find(mail => mail.entry.id == item));
      if (res.length != activeIds.length) {
        setActiveIds(res);
      }
    }
  }, [mailDataList, isSearching]);
  // 列表多选态外部打破
  useEffect(() => {
    setActiveIds([]);
    // setCanShowMultPanel(false);
    setListModel(LIST_MODEL.INIT);
  }, [isSearching, selectedKeys, selected, searchSelected, selectedSearchKeys]);

  const getMailListData = (noCache = false) => {
    if (authLock) {
      setAuthLock(false);
    }
    // 高级搜索会在 handleAdvancedSearch 中触发，普通搜索会在 input 的 onChange 中触发，so, 这里不负责触发搜索相关的请求
    if (!isSearching) {
      setMailList([]);
      setSelectedMail({ id: '', accountId: '' });
      setListLoading(true);
      loadMoreRows({ startIndex: 0, advancedSearch: isAdvancedSearch }, noCache);
    }
    handleBackToTop();
  };
  const getMailListDataRef = useCreateCallbackForEvent(getMailListData);

  // 获取api中是否展示摘要，附件，列表密度，同步到redux
  useEffect(() => {
    const desc = MailConfApi.getMailShowDesc();
    setDescChecked(desc);
    const attachment = MailConfApi.getMailShowAttachment();
    setAttachmentChecked(attachment);
    const tightness = MailConfApi.getMailListTightness();
    setMailConfigListTightness(+tightness);
    return () => {};
  }, []);

  // 当文件夹/任务文件夹发生变化的时候
  useUpdateEffect(() => {
    if (selectedKeys?.id != -199) {
      getMailListDataRef();
    }
  }, [selectedKeys, selected, isSearching, searchSelected, dateRange]);

  // 初始化首次加载列表的时候不走缓存
  useEffect(() => {
    if (selectedKeys?.id != -199) {
      getMailListDataRef(true);
    }
  }, []);

  // 解决redux增加对比后，邮件标签切换不生效的问题
  const preTagInfo = useRef<{ key?: string | null | undefined; accountId: string | null } | null>();
  useDebounceEffect(
    () => {
      if ((preTagInfo.current?.key != tagName?.key || preTagInfo.current?.accountId != tagName?.accountId) && selectedKeys?.id == -199) {
        preTagInfo.current = tagName;
        // 标签现在不走缓存，因为本地缓存存在排序不一致的问题
        getMailListDataRef(true);
      } else {
        preTagInfo.current = null;
      }
    },
    [`${tagName?.key}${tagName?.accountId}`, selectedKeys],
    { wait: 500 }
  );

  /**
   * 客户端首次打开，某些情况下，文件夹的加载可能阻塞，10s做一次检测
   */
  useEffect(() => {
    setTimeout(() => {
      try {
        if (!mailTreeStateMapRef?.current?.main?.mailFolderTreeList?.length) {
          refreshFolder(true, 'checkFolderInit');
        }
      } catch (e) {
        console.error('[Error checkFolderInit]', e);
      }
    }, 8000);
  }, []);

  // 通栏和三栏切换的时候，取消邮件列表的多选状态
  // useEffect(() => {
  //   setActiveIds([]);
  // }, [isLeftRight]);

  useEffect(() => {
    // isSearchRecorded.current = false;
    setIsSearchRecorded(false);
  }, [searchType]);

  // 初始化的收，主动触发列表的
  const listIsRefreshRef = useStateRef(listIsRefresh);
  const selectedKeyIdRef = useStateRef(selectedKeys?.id);
  const listRefreshTimeoutRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    // 只针对收件箱放开
    if (selectedKeys?.id == FLOLDER.SENT) {
      setListIsRefresh(true);
      if (listRefreshTimeoutRef.current) {
        clearTimeout(listRefreshTimeoutRef.current);
      }
      listRefreshTimeoutRef.current = setTimeout(() => {
        if (listIsRefreshRef.current && selectedKeyIdRef.current == FLOLDER.SENT) {
          setListIsRefresh(false);
        }
      }, 10000);
    } else {
      setListIsRefresh(false);
    }
  }, [selectedKeys?.id]);

  useEffect(() => {
    // 使用了 mailSearchRecord 和 isSearchRecorded 两个变量来控制是否需要记录当前搜索词
    // mailSearchRecord 表征的是，输入框的搜索类别改变，需要记录搜索结果，但是下方的搜索筛选框改变后，则不记录搜索结果
    // isSearchRecorded 表征的是，一个关键词被记录一遍后就不再记录了，除非搜索词或类别改变
    // o(╯□╰)o
    if (isSearching && !isAdvancedSearch && searchMail.id && mailSearchRecord && !isSearchRecorded) {
      // isSearchRecorded.current = true;
      setIsSearchRecorded(true);
      // setCurrentAccount();
      MailApi.doSaveMailSearchRecord({ type: searchType, content: inputValue }).then();
    }
  }, [isSearching, isAdvancedSearch, searchMail, isSearchRecorded, mailSearchRecord]);
  // 初始化邮件列表tab，搜索模式切换会改变
  useEffect(() => {
    preferredABTEST();
  }, [isSearching, selectedKeys]);
  /**
   * 全局消息处理
   */
  // 处理邮件状态对反向变化消息
  useMsgRenderCallback('mailChanged', handleMailChange);
  // 监听邮件列表消息中心
  // useMsgRenderCallback('mailMsgCenter', handleMailCenter);

  const accountCount = useMemo(() => {
    return Object.keys(mailTreeStateMap)?.length || 0;
  }, [mailTreeStateMap]);

  // 防抖请求标签
  const debouceGetTagList = useDebounceForEvent(() => dispatch(Thunks.requestTaglist({})), 1000, {
    leading: false,
    trailing: true,
  });

  // 初始化的时候请求邮件标签
  useEffect(() => {
    debouceGetTagList();
  }, [accountCount]);

  // 处理邮件标签的选中事件
  useMsgCallback('chooseMailTag', e => {
    const { eventData, _account } = e;
    setTagName({
      key: eventData[0],
      accountId: _account || '',
    });
    // todo： 现在只支持主账号有标签
    setSelectedKeys({
      id: -199,
      accountId: _account,
    });
    setSelected('ALL');
    // (new Map());setCheckedMails
    handleBackToTop();
    // 激活默认页签
    const mailTabModel: MailTabModel = {
      id: '-1',
      title: eventData[0],
      type: tabType.readMain,
      closeable: false,
      isActive: true,
    };
    dispatch(mailTabActions.doSetTab(mailTabModel));
  });
  // 处理删除邮件的消息
  // useMsgCallback('deleteMailById', ev => {
  //   // 没有发现该消息的发送源头，需要进一步明确
  //   doMailDelete(ev.eventData, false);
  // });
  // 处理邮件标签的变化
  useMsgRenderCallback('mailTagChanged', ev => {
    try {
      if (ev) {
        // setMailList(updateMailListTag(ev, mailDataList) as MailEntryModel[]);
        // setSearchList(updateMailListTag(ev, searchList) as MailEntryModel[]);
        // if (systemApi.isElectron()) {
        //   if (location.pathname && !locationHelper.testPathMatch('readMail')) {
        //     handleMailTagChangeRequest(ev);
        //   }
        // } else {
        // }
        const { eventStrData } = ev;
        // 发送请求
        if (eventStrData === 'tag' || eventStrData === 'untag') {
          handleMailTagChangeRequest(ev);
        } else {
          dispatch(Thunks.requestTaglist({ account: ev?._account }));
        }
        // else {
        //   /**
        //    * 处理状态的变更 addTag cleatTag updateTag
        //    * 这些变更不需要发送请求
        //    */
        //   // reducer.doUpdateMailTagOper(ev);
        // }
      }
    } catch (e) {
      console.error(e);
    }
  });
  // 已迁移
  // 监听红旗邮件的状态变化
  useMsgRenderCallback('mailStatesChanged', ev => {
    try {
      if (ev && !ev.isStick) {
        const { eventStrData, eventData = {} } = ev;
        const { mark, id, type, hideMessage: _hideMessage } = eventData;
        setHideMessage(!!_hideMessage);
        // tagOnly 参数已经没有实际效果了
        const { tagOnly = false } = eventData;
        if (eventStrData === 'clearCheckedMails') {
          // setCheckedMails(new Map());
          setActiveIds([]);
          return;
        }
        handleRedFlagRequest(ev, mailDataList);
      }
    } catch (e) {
      console.error(e);
    }
  });

  // 监听对页签的操作事件
  useMsgRenderCallback('tabsOperation', ev => {
    const { eventStrData, eventData = {} } = ev;
    // 设置页签
    if (eventStrData === 'doSetTab') {
      const { id } = eventData;
      const mail = mailEntitiesMap[id];
      if (mail) {
        // 获取一下title
        let title = '无主题';
        try {
          title = mail.entry.title.replace('<b>', '').replace('</b>', '') || '无主题';
        } catch (e) {
          console.error('[Error reg]', e);
        }
        const mailTabModel: MailTabModel = {
          ...eventData,
          title,
        };
        dispatch(mailTabActions.doSetTab(mailTabModel));
      } else {
        console.error('tabsOperation error');
      }
    }
  });

  useMsgCallback('todoChange', ev => {
    reducer.doTaskMailOperation(ev);
  });

  const handlerContactNotify = () => {
    refreshFolder(false, 'handlerContactNotify');
  };

  // 监听星标联系人的改变
  useMsgRenderCallback('contactPersonalMarkNotify', handlerContactNotify);

  // 获取聚合邮件-排序设置
  useEffect(() => {
    mailConfApi.doGetUserAttr([MailSettingKeys.nForward]).then(res => {
      const { ntes_option } = res;
      if (ntes_option) {
        const key = ntes_option[15];
        setMergeMailOrderDesc(!!key);
      }
    });
  }, []);

  // 初始化配置默认值
  useEffect(() => {
    const desc = mailConfApi.getMailShowDesc();
    setDescChecked(desc);
    const attachment = mailConfApi.getMailShowAttachment();
    setAttachmentChecked(attachment);
    const avator = mailConfApi.getMailShowAvator();
    setShowAvator(avator);
    const showConcreteTime = mailConfApi.getShowConcreteTime();
    setShowConcreteTime(showConcreteTime);
    // 如果是外贸通则同步下api层的配置，是否支持客户邮件筛选
    if (process.env.BUILD_ISEDM) {
      const showCustomerTab = mailConfApi.getShowCustomerTab();
      setShowCustomerTab(showCustomerTab);
    }
  }, []);

  // 获取失效账号列表，刷新mail文件夹
  const getExpiredAccountListAndRefreshFolder = async (refresh: boolean) => {
    // api更新失效账号列表
    const subAccounts = await accountApi.getSubAccounts({ expired: true });
    if (subAccounts && subAccounts.length) {
      const agentEmailList = subAccounts.filter(a => a.expired).map(a => a.agentEmail);
      setExpiredAccountList(agentEmailList);
    } else {
      setExpiredAccountList([]);
    }
    // 失效事件不需要立即刷新文件夹
    setTimeout(() => {
      if (refresh) {
        refreshFolder(true, 'getExpiredAccountListAndRefreshFolder');
      }
    }, 0);
  };
  // 账号失效弹窗
  const md = useRef<any>();
  const accountExpiredTip = () => {
    if (md.current) {
      md.current.destroy();
    }
    md.current = SiriusModal.info({
      title: getIn18Text('accountExpiredTip'),
      okCancel: !0,
      cancelText: getIn18Text('QUXIAO'),
      onCancel: () => {
        md.current.destroy();
      },
      okText: getIn18Text('recheck'),
      onOk: () => {
        navigate('/#setting', { state: { currentTab: 'mail', mailConfigTab: 'OTHER' } });
        md.current.destroy();
      },
    });
  };
  // 监听多账号添加账号,删除账号,账号失效,监听到更新redux失效账号列表，刷新mail文件夹
  useMsgRenderCallback('SubAccountWindowReady', ev => {
    try {
      getExpiredAccountListAndRefreshFolder(true);
    } catch (e) {
      console.error(e);
    }
  });
  useMsgRenderCallback('SubAccountDeleted', ev => {
    try {
      getExpiredAccountListAndRefreshFolder(true);
    } catch (e) {
      console.error(e);
    }
  });
  useMsgRenderCallback('SubAccountLoginExpired', ev => {
    try {
      getExpiredAccountListAndRefreshFolder(false);
    } catch (e) {
      console.error(e);
    }
  });
  // 监听失效账号列表，当前选中文件夹，当前活跃页签
  useEffect(() => {
    // 如果当前操作的文件夹所属账号或者活跃页签的账号，在失效账号列表里面，则提示
    if (expiredAccountList.includes(selectedKeys.accountId) || expiredAccountList.includes(currentTabAccountId)) {
      accountExpiredTip();
    }
  }, [expiredAccountList, selectedKeys, currentTabAccountId]);

  useMsgRenderCallback('mailRealListTotalChanged', ev => {
    if (ev && ev.eventData) {
      const totalCount = ev.eventData.netWorkTotal;
      setMailTotal(totalCount);
    }
  });

  const { setTagHk } = useContext(MailModuleHKContent) || {};
  const currentTabType = useAppSelector(state => state.mailTabReducer.currentTab.type);
  const currentTab = useAppSelector(state => state.mailTabReducer.currentTab);
  /**
   * 存储账号 - 快捷键 - 标签的map，用于多账号标签的快速定位
   * {
   * 'account1': {
   *  'ctrl+1':'tagName'
   * }
   */
  const [accountHKTagMap, setAccountHKTagMap] = useState<stringMap>({});
  /**
   * 处理邮件标签快捷键
   */
  const handleMailTagFromHK = useCreateCallbackForEvent((hkKey: string) => {
    try {
      if (currentTabType != tabType.read && currentTabType != tabType.readMain) {
        return;
      }
      let ids = activeIds;
      // 判断是否处于独立页签中，则操作当前页签的邮件
      if (currentTabType == tabType.read) {
        ids = [currentTab?.extra?.originMid];
      }

      // 如果是外贸的下属页签，或者列表页签，则需要更具slcieId去查找对应的状态。
      // todo: 下个版本支持外贸下的快捷键

      // 判断，是否已经全部打善恶了标记，如果是，则全部取消
      const mails = ids.map(id => mailEntitiesMap[id]);
      const mailAccount = systemApi.getCurrentUser(mails[0]?._account)?.id || '';
      const tagName = accountHKTagMap[mailAccount][hkKey];
      const isAll = mails.every(item => item.tags && item.tags.includes(tagName));

      if (mails && mails.length) {
        // mailEntitiesMap
        eventApi.sendSysEvent({
          eventName: 'mailTagChanged',
          eventData: {
            tagNames: [tagName],
            mailList: ids,
            tagIds: [tagName],
          },
          eventStrData: isAll ? 'untag' : 'tag',
          _account: mailAccount,
        });
      }
    } catch (e) {
      console.error('[error] handleMailTagFromHK', e);
    }
  });

  // 读取本地快捷键并更新注册
  const handleMailTagHK = useCreateCallbackForEvent(() => {
    const allAccountMap: stringMap = getAllAccountHK();
    const map: stringMap = {};
    const ahkTagMap: stringMap = {};
    for (let i in allAccountMap) {
      const tagHkMap = allAccountMap[i];
      ahkTagMap[i] = {};
      if (tagHkMap) {
        for (let n in tagHkMap) {
          const hkList = tagHkMap[n];
          const key = hkList.join('+');
          ahkTagMap[i][key] = n;
          map[key] = (e: SystemEvent<any>) => {
            e.preventDefault();
            handleMailTagFromHK(key);
          };
        }
      }
    }
    setAccountHKTagMap(ahkTagMap);
    setTagHk(map);
  });

  /**
   * 重载邮件标签快捷键
   */
  useMsgRenderCallback('mailMenuOper', ev => {
    const { eventStrData } = ev;
    if (eventStrData === 'reloadHotKey') {
      // 从本地读取快捷键
      handleMailTagHK();
    }
  });

  // 初始化的时候懂爱注册一次快捷键
  useEffect(() => {
    handleMailTagHK();
  }, []);

  // 获取邮件账号别名
  const debounceGetDisplayName = useDebounceForEvent(
    (accountList: string[]) => {
      if (accountList?.length) {
        dispatch(Thunks.getUserFolderAlias({ accountList }));
      }
    },
    500,
    {
      leading: false,
      trailing: true,
    }
  );

  /**
   * 获取所有当期那账号列表
   */
  const accountList = useMemo(() => {
    try {
      if (mailTreeStateMap) {
        const list = [];
        for (let i in mailTreeStateMap) {
          // 主账号没有别名
          if (i != 'main') {
            list.push(i);
          }
        }
        return list;
      }
    } catch (e) {
      console.error('accountList error', e);
    }

    return [];
  }, [mailTreeStateMap]);

  /**
   * 获取文件夹昵称
   */
  useEffect(() => {
    if (accountList.length) {
      debounceGetDisplayName(accountList);
    }
  }, [accountList.join(',')]);

  return <></>;
};
export default MailBoxEventHander;
