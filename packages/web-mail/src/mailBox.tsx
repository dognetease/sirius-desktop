/* eslint-disable array-callback-return */
/* eslint-disable max-statements */
import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { apiHolder, SystemApi, mailPerfTool, MailApi, apis, config } from 'api';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import TabContentLayout from '@/layouts/Main/tabContentLayout';
import './mailBox.scss';
import { useAppDispatch, useAppSelector, useActions } from '@web-common/state/createStore';
import useState2RM from './hooks/useState2ReduxMock';
import FolderMoveModal from './components/FolderMoveModal/FolderMoveModal';
import ModuleHotKey from './components/ListHotKeys/moduleHotKey';
import MailBoxEventHander from './components/mailBoxEventHander/mailBoxEventHander';
import CustomerMailBoxEventHandler from '@web-mail/components/CustomerMail/customerMailBoxEventHandler';
import CustomerUIHandler from '@web-mail/components/CustomerMail/customerUIHandler';
import SubordinateUIHandler from '@web-mail/components/SubordinateMail/subordinateUIHandler';
import SubordinateMailBoxEventHandler from '@web-mail/components/SubordinateMail/subordinateMailBoxEventHandler';
import MailSyncModal from '@web-mail/components/MailSyncModal/MailSyncModal';
import { useLocation } from '@reach/router';
import TabWriteLetter from '@web-mail/components/TabWriteLetter/TabWriteLetter';
import LoadingImg from '@/images/app_bg_loading.gif';
import MailTab from './components/MailTab/MailTab';
import ReadMailPage from './readMailPage';
import { MailTabModel, tabType, WriteMailTypes, actions as mailTabActions, tabId } from '@web-common/state/reducer/mailTabReducer';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
import { FLOLDER, MAIL_STORE_REDUX_STATE } from './common/constant';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { setCurrentAccount, dragTransFileHasEml } from './util';
import QuickSetting from './components/MailColumnEntry/quickSetting';
import SurveySpace from './components/SurveySpace/SurveySpace';
import useDebounceForEvent from './hooks/useDebounceForEvent';
import useThrottleForEvent from './hooks/useThrottleForEvent';
import UrlToWriteMail from './UrlToWriteMail';
// import { useWhyDidYouUpdate } from 'ahooks';
import { getIn18Text } from 'api';
// import UniDrawerWrapper from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
// import { UniDrawerOpportunity } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer2';
// import { UniDrawerLeadsDetail, UniDrawerLeadsView } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawerLeads';
import { AddToCustomerOrClue } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawerLeads2';
import ErrorModal from '@web-mail-write/components/SendMail/ErrorModal';

const MailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const MailBox: React.FC<any> = props => {
  const systemApi = apiHolder.api.getSystemApi() as SystemApi;
  const inElectron = systemApi.isElectron();
  const MailBoxEventHandlerMemo = useMemo(() => <MailBoxEventHander />, []);
  // 屏蔽eml文件over太多次触发
  const emlOverLock = useRef(true);
  const CustomerMailBoxEventHandlerMemo = process.env.BUILD_ISEDM ? useMemo(() => <CustomerMailBoxEventHandler />, []) : null;
  const SubordinateMailBoxEventHandlerMemo = process.env.BUILD_ISEDM ? useMemo(() => <SubordinateMailBoxEventHandler />, []) : null;

  const location = useLocation();
  const reducer = useActions(mailActions);
  const { doChangeCurrentMail } = mailActions;
  // 当前路由是否邮箱模块，兼容之前的props解构active
  const [mailBoxActive, setMailBoxActive] = useState(false);
  // 当前页签
  const { currentTab, tabList } = useAppSelector(state => state.mailTabReducer);
  // uni 客户弹窗
  // const [uniCustomerParam, setUniCustomerParam] = useState2RM('uniCustomerParam');
  // uni 商机弹窗
  // const [uniOpportunityParam, setUniOpportunityParam] = useState2RM('uniOpportunityParam');
  // uni 线索弹窗（新建或者编辑）
  // const [uniClueParam, setUniClueParam] = useState2RM('uniClueParam');
  // uni 添加到原有客户弹窗，添加到原有线索
  const [uniToCustomerOrClueParam, setUniToCustomerOrClueParam] = useState2RM('uniToCustomerOrClueParam');
  // uni 添加到原有客户弹窗，查看线索
  // const [uniClueViewParam, setUniClueViewParam] = useState2RM('uniClueViewParam');

  const CustomerUIHandlerMemo = process.env.BUILD_ISEDM
    ? useMemo(() => {
        let sliceId = currentTab?.id;
        if (currentTab.type !== tabType.customer) {
          sliceId = tabId.readCustomer;
        }
        return <CustomerUIHandler sliceId={sliceId} />;
      }, [currentTab?.id])
    : null;

  const SubordinateUIHandlerMemo = process.env.BUILD_ISEDM
    ? useMemo(() => {
        let sliceId = currentTab?.id;
        if (currentTab.type !== tabType.subordinate) {
          sliceId = tabId.subordinate;
        }
        return <SubordinateUIHandler sliceId={sliceId} />;
      }, [currentTab?.id])
    : null;

  // 上一个标签
  // const [oldCurrentTab, setOldCurrentTab] = useState<MailTabModel>();

  const currentTabType = useMemo(() => currentTab.type, [currentTab]);
  const readTabList = useAppSelector(state => state.mailTabReducer.readTabList);
  // redux中的maiMap
  // todo: 对于不是强同步的场景，需要增加功能，变化的时候不渲染
  const mailEntitiesMap = useAppSelector(state => state.mailReducer[MAIL_STORE_REDUX_STATE]);
  const tooltipVisible = useAppSelector(state => state.mailReducer.tooltipVisible);
  const TabWriteLetterRef = useRef<any>(null);
  const tabListRef = useRef<MailTabModel[]>(tabList);
  tabListRef.current = tabList;
  const dispatch = useAppDispatch();
  const isEmlDragModel = useAppSelector(state => state.mailReducer.isDragModel === 'eml');

  // useWhyDidYouUpdate('MailBox', { ...props,location,reducer,currentTabType,currentTab,mailEntitiesMap,MAIL_STORE_REDUX_STATE,TabWriteLetterRef,tabListRef, });

  useEffect(() => {
    // 上一个tab存在且为写信
    // if (oldCurrentTab && WriteMailTypes.includes(oldCurrentTab.type)) {
    //   // 保存上一封写信的草稿
    //   TabWriteLetterRef?.current?.saveDraft(oldCurrentTab.id);
    // }
    // setOldCurrentTab(currentTab);
    // 写信类型 切换当前邮件
    if (WriteMailTypes.includes(currentTab.type)) {
      // 注意：邮件和tab属于两套redux 邮件用number tab用string
      try {
        dispatch(doChangeCurrentMail(currentTab.id));
      } catch (error) {
        console.error(error);
      }
    }
  }, [currentTab?.id]);

  const onBeforeClose = useCallback((ids: string[]) => {
    const closePs = TabWriteLetterRef?.current?.closeTab(ids);
    return new Promise((resolve: (value: boolean) => void) => {
      Promise.all([closePs])
        .then(values => {
          if (!values || values.length < 1) return false;
          for (let i = 0; i < values.length; i++) {
            if (!values[i]) {
              resolve(false);
              return false;
            }
          }
          resolve(true);
          return true;
        })
        .catch(error => {
          console.log(getIn18Text('GUANBIBIAOQIANSHI'), error);
          resolve(false);
          return false;
        });
    });
  }, []);

  // todo： 迁移到eventhandler里面，反正也不造成渲染。不过这个业务现在还有必要吗？
  useEffect(() => {
    try {
      // 如果是跳转到邮件模块
      if (location.hash.indexOf('#mailbox') !== -1) {
        // 列表重新渲染-以解决收到新邮件的白屏不渲染问题
        reducer.reDrawMailList();
        setMailBoxActive(true);
      } else {
        setMailBoxActive(false);
      }
    } catch (e) {
      console.error('[useEffect reDrawMailList err]', e);
    }
  }, [location.hash]);

  // 双击读信页签
  // todo: 迁移到reducer里面，可以避免mailEntitiesMap 频繁渲染导致的问题
  const dbClickReadTab = useCallback(
    (id: string | number) => {
      const readTab = readTabList.find(item => item.id === id);
      let mail;
      if (readTab) {
        mail = mailEntitiesMap[readTab.currentMid];
      } else {
        mail = mailEntitiesMap[id];
      }
      if (mail) {
        const { isThread, _account, isTpMail, owner } = mail;
        mailPerfTool.mailContent('window', 'start', { isThread: !!isThread });
        if (process.env.BUILD_ISELECTRON) {
          if (mail.entry.folder === FLOLDER.DRAFT) {
            // 草稿箱双击--再次编辑
            // setCurrentAccount(mail?._account);
            MailApi.doEditMail(mail.id, { draft: true, _account: mail?._account });
          } else {
            // 其他文件夹双击--打开单独窗口读信
            systemApi.createWindowWithInitData(
              { type: 'readMail', additionalParams: { account: _account } },
              { eventName: 'initPage', eventData: { id: mail?.id, accountId: _account, isTpMail, owner }, eventStrData: 'clickTab' }
            );
          }
        } else {
          window.open(
            `${systemApi.getContextPath()}/readMail/?id=${mail?.id}${_account ? '&account=' + _account : ''}${isThread ? '&isthread=1' : ''}${
              isTpMail ? '&isTpMail=1' : ''
            }${owner ? '&owner=' + owner : ''}`,
            'readMail',
            'menubar=0,scrollbars=1,resizable=1,width=800,height=600'
          );
        }
        setTimeout(() => {
          // 关闭当前页签
          dispatch(mailTabActions.doCloseTab(String(id)));
        }, 0);
      }
    },
    [mailEntitiesMap, readTabList]
  );

  const onTabDbClick = useCallback(
    (id: string) => {
      const curDbTab = (tabListRef.current || []).find(item => item.id === id);
      if (!curDbTab) return Promise.resolve(true);
      // 双击写信
      if (WriteMailTypes.includes(curDbTab.type)) {
        TabWriteLetterRef?.current?.doubleCkTab(id);
      }
      // 双击读信页签
      if ([tabType.read].includes(curDbTab.type)) {
        dbClickReadTab(id);
      }
      return Promise.resolve(true);
    },
    [dbClickReadTab]
  );

  const dbref = useCreateCallbackForEvent(onTabDbClick);

  // 多页签
  const mailTab = useMemo(
    () => (
      <TabContentLayout SideContentLayout style={{ height: 35, width: '100%', flex: 'none' }} className={`mail-tab-container`}>
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: 36,
          }}
        >
          <div
            style={{
              flex: 1,
              width: 0,
            }}
          >
            <MailTab onBeforeClose={onBeforeClose} onDbClick={dbref} />
          </div>
          {/* {!inElectron && <OldVersionEntry />} */}
        </div>
      </TabContentLayout>
    ),
    []
  );

  // 快捷设置useMemo
  const [configMailShow] = useState2RM('configMailShow', 'doUpdateConfigMailShow');
  const QuickSettingMemo = configMailShow ? <QuickSetting /> : <></>;

  // 外贸环境下的客户弹窗和商机弹窗
  const customerIframe = process.env.BUILD_ISEDM ? (
    <>
      {/* 客户弹窗 */}
      {/* <UniDrawerWrapper
        {...uniCustomerParam}
        onClose={() => {
          if (uniCustomerParam.onClose) {
            uniCustomerParam.onClose();
          }
          setUniCustomerParam({ visible: false, source: uniCustomerParam.source });
        }}
        onSuccess={(...arg) => {
          if (uniCustomerParam.onSuccess) {
            uniCustomerParam.onSuccess(...arg);
          }
          setUniCustomerParam({ visible: false, source: uniCustomerParam.source });
        }}
      /> */}
      {/* 商机弹窗 */}
      {/* <UniDrawerOpportunity
        {...uniOpportunityParam}
        onSuccess={() => {
          if (uniOpportunityParam.onSuccess) {
            uniOpportunityParam.onSuccess();
          }
          setUniOpportunityParam({ visible: false });
        }}
        onClose={shouleUpdate => {
          if (uniOpportunityParam.onClose) {
            uniOpportunityParam.onClose(shouleUpdate);
          }
          setUniOpportunityParam({ visible: false });
        }}
      /> */}
      {/* 线索弹窗(新建编辑) */}
      {/* <UniDrawerLeadsDetail
        {...uniClueParam}
        onSuccess={params => {
          if (uniClueParam.onSuccess) {
            uniClueParam.onSuccess(params);
          }
          setUniClueParam({ visible: false });
        }}
        onClose={() => {
          if (uniClueParam.onClose) {
            uniClueParam.onClose();
          }
          setUniClueParam({ visible: false });
        }}
      /> */}
      {/* 添加到原有客户，添加到原有线索 */}
      <AddToCustomerOrClue
        {...uniToCustomerOrClueParam}
        onOk={() => {
          if (uniToCustomerOrClueParam.onOk) {
            uniToCustomerOrClueParam.onOk();
          }
          setUniToCustomerOrClueParam({ visible: false });
        }}
        onCancel={() => {
          if (uniToCustomerOrClueParam.onCancel) {
            uniToCustomerOrClueParam.onCancel();
          }
          setUniToCustomerOrClueParam({ visible: false });
        }}
      />
      {/* 查看线索 */}
      {/* <UniDrawerLeadsView
        {...uniClueViewParam}
        onClose={shouleUpdate => {
          if (uniClueViewParam.onClose) {
            uniClueViewParam.onClose(shouleUpdate);
          }
          setUniClueViewParam({ visible: false });
        }}
      /> */}
    </>
  ) : (
    <></>
  );

  // 邮件移动-弹窗-结构
  const [folderModveModalVisiable] = useState2RM('folderModveModalVisiable', 'doUpdateFolderModveModalVisiable');
  const ComFolderMoveModal = folderModveModalVisiable ? <FolderMoveModal /> : [];

  const PageContentLayoutHeight = useMemo(() => {
    if (systemApi.isWebWmEntry()) {
      return 'calc(100vh - 54px)';
    }
    if (!process.env.BUILD_ISELECTRON) {
      return process.env.BUILD_ISEDM ? '100vh' : 'calc(100vh - 47px)';
    }
    return '100vh';
  }, []);

  // 防抖延迟关闭eml拖拽模式 - 后触发
  const debounceCloseEmlDragModel = useDebounceForEvent(
    () => {
      emlOverLock.current = true;
      reducer.updateOuterFileDragLeave({});
    },
    800,
    {
      leading: false,
    }
  );

  /**
   * 处理eml文件dragover
   */
  const handleOuterDragOver = useCallback((event: React.DragEvent) => {
    // 非拖拽模式中才触发
    if (!isEmlDragModel && emlOverLock.current) {
      // 检测到包含eml文件才可以上传
      let couldDrop = dragTransFileHasEml(event);
      // 在此处开启遮罩状态
      if (couldDrop) {
        emlOverLock.current = false;
        reducer.updateOuterFileDragEntry({});
      }
    }
    // debouce关闭状态
    debounceCloseEmlDragModel();
  }, []);

  const throttleHandleOuterDragOver = useThrottleForEvent(handleOuterDragOver, 500);

  return (
    <div
      style={{ display: 'flex', flex: '1 1 0%', overflow: 'hidden' }}
      onDragOverCapture={event => {
        event.persist();
        throttleHandleOuterDragOver(event);
      }}
    >
      <ModuleHotKey>
        <PageContentLayout
          // 作为一些浮动元素的容器 避免他们在切换tab的时候固定在body上
          id="mailboxModule"
          className={`mailtab-layout ${!inElectron ? 'mailtab-layout-web' : ''}`}
          style={{
            // height: process.env.BUILD_ISEDM ?  'calc(100vh - 54px)' : 'calc(100vh - 47px)'
            // 新版外贸通web端有个54px高的工具栏，其他web端47px工具栏，客户端统一100vh
            height: PageContentLayoutHeight,
          }}
        >
          {/**
           * 1. 显示隐藏控制在哪
           * 2. 邮件热键处理 通栏/分栏 交互不一致可能会产生bug
           */}
          {mailTab}

          {/* 多标签读信 */}
          <div
            className={`tab-read-page ${systemApi.isWebWmEntry() ? 'wm-web-tab-read-page' : ''}`}
            hidden={![tabType.read, tabType.readMain, tabType.customer, tabType.subordinate].includes(currentTabType)}
            SideContentLayout
            style={{ height: 'calc(100% - 35px)' }}
          >
            <ReadMailPage {...props} active={mailBoxActive} />
          </div>

          {/* 多标签写信 */}
          <div
            className={`tab-write-page ${systemApi.isWebWmEntry() ? 'wm-web-tab-write-page' : ''} ${!inElectron ? 'tab-write-page-web' : ''}`}
            hidden={!WriteMailTypes.includes(currentTabType)}
            SideContentLayout
          >
            <TabWriteLetter ref={TabWriteLetterRef} />
          </div>

          {/* 加载中 */}
          {
            <div className={`tab-write-page ${!process.env.BUILD_ISELECTRON ? 'tab-write-page-web' : ''}`} hidden={!(currentTabType === tabType.temp)} SideContentLayout>
              <div className="tab-loading">{currentTabType === tabType.temp ? <img className="loading-img" src={LoadingImg} /> : null}</div>
            </div>
          }
        </PageContentLayout>
        {ComFolderMoveModal}
        {MailBoxEventHandlerMemo}
        {CustomerMailBoxEventHandlerMemo}
        {CustomerUIHandlerMemo}
        {SubordinateMailBoxEventHandlerMemo}
        {SubordinateUIHandlerMemo}
        {QuickSettingMemo}
        {customerIframe}
        <MailSyncModal />
        <SurveySpace />
        <UrlToWriteMail />
        {tooltipVisible && <ErrorModal cond="mailBox" />}
      </ModuleHotKey>
    </div>
  );
};
export default MailBox;
