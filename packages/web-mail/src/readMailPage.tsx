/* eslint-disable array-callback-return */
/* eslint-disable max-statements */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Axis } from 'react-resizable';
import { apiHolder as api, apis, MailConfApi, SystemApi, MailApi, EventApi, PerformanceApi } from 'api';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { navigate } from 'gatsby';
import { actions as mailTabActions, MailTabModel, tabId, tabType } from '@web-common/state/reducer/mailTabReducer';
import { actions as mailActions, SendingMail } from '@web-common/state/reducer/mailReducer';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import './mailBox.scss';
// import MainReadMail from './components/MainReadMail/MainReadMail';
import MailColumnEntry from './components/MailColumnEntry';
import ColumnMailBox from './components/ColumnMailBox';
import RevokeToasts from './components/RevokeToasts/RevokeToasts';
import useState2RM from './hooks/useState2ReduxMock';
import { getTreeStatesByAccount } from './util';
import { FLOLDER } from './common/constant';
// import { FLOLDER, DEFAULT_LIST_WIDTH, DEFAULT_LIST_MIN_WIDTH } from './common/constant';
import useGetUniqReqWrap from '@web-common/hooks/useGetUniqReqWrap';
import { getValidStoreWidth } from '@web-common/utils/utils';
import { getMainContOffsetTopHeight } from '@web-common/utils/waimao';
// import UniDrawerWrapper from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
// import { UniDrawerOpportunity } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer2';
import CustomerMailContainer from '@web-mail/components/CustomerMail';
import SubordinateMailContainer from '@web-mail/components/SubordinateMail';
import ColumnMailBoxContainer from '@web-mail/components/ReadMailPageContainer/ColumnMailBoxContainer';
import MailColumnEntryContainer from '@web-mail/components/ReadMailPageContainer/MailColumnEntryContainer';
import { useState2CustomerSlice, useState2SubordinateSlice, ctSliceContext, SdSliceContext } from '@web-mail/hooks/useState2SliceRedux';
import MainReadMailWrap from './readMailAndSider';
import useAppScale from '@web-mail/hooks/useAppScale';
import EmptyContact from '@web-mail/components/StarContact/EmptyContact';
import CustomerEmptyDetail from '@web-mail/components/CustomerMail/CustomerEmpty/detail';
import { getIn18Text } from 'api';
import useStateRef from '@web-mail/hooks/useStateRef';

const systemApi = api.api.getSystemApi() as SystemApi;
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const storeApi = api.api.getDataStoreApi();
const eventApi: EventApi = api.api.getEventApi();
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const performance = api.api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;

const height = systemApi.isWebWmEntry() ? `calc(100vh - 48px - ${getMainContOffsetTopHeight()}px)` : '100%';
const inElectron = systemApi.isElectron();

// const MainReadMailWrap: React.FC<any> = props => {
//   const { showReadMail } = props || {};
//   const style = useMemo<React.CSSProperties>(() => {
//     return {
//       height,
//       flex: 1,
//       position: 'relative',
//       overflow: 'hidden',
//       display: showReadMail ? 'block' : 'none'
//     };
//   }, [showReadMail]);
//   return (
//     <div style={style}>
//       <ErrorBoundary>{showReadMail ? <MainReadMail {...props} /> : <></>}</ErrorBoundary>
//     </div>
//   );
// };

// TODO 从storage取邮件文件夹列表宽度
// const STORE_MAIL_FOLDER_WIDTH = 'STORE_MAIL_FOLDER_WIDTH';
// const STORE_MAIL_LIST_WIDTH = 'STORE_MAIL_LIST_WIDTH';
const STORE_MAIL_LIST_HEIGHT = 'STORE_MAIL_LIST_HEIGHT';

const ReadMailPage: React.FC<any> = props => {
  const { openInNewWindow = false, mailId = '', from = '', active } = props;

  const dispatch = useAppDispatch();

  // 当前页签
  const currentTab = useAppSelector(state => state.mailTabReducer.currentTab);
  const currentTabType = useAppSelector(state => state.mailTabReducer.currentTab.type);
  // 监听页签唯一id即可
  const currentTabId = useAppSelector(state => state.mailTabReducer.currentTab.id);

  // 『客户』Tab
  const isCustomerTab = process.env.BUILD_ISLINGXI
    ? false
    : useMemo(() => currentTabId === tabId.readCustomer || currentTabType === tabType.customer, [currentTabId, currentTabType]);
  // 下属-tab
  const isSubordinateTab = process.env.BUILD_ISLINGXI
    ? false
    : useMemo(() => currentTabId === tabId.subordinate || currentTabType === tabType.subordinate, [currentTabId, currentTabType]);
  // 是否由『客户邮件列表』打开的 Tab
  const isTabOpenedByCustomer = process.env.BUILD_ISLINGXI ? false : useMemo(() => currentTab.extra?.from === tabId.readCustomer, [currentTabId]);
  // 是否由『下属邮件列表』打开的 Tab
  const isTabOpenedBySubordinate = process.env.BUILD_ISLINGXI ? false : useMemo(() => currentTab.extra?.from === tabId.subordinate, [currentTabId]);

  const sliceIdCm = useMemo(() => {
    let id = currentTabId;
    if (currentTabType !== tabType.customer) {
      id = tabId.readCustomer;
    }
    return id;
  }, [currentTabId, currentTabType]);

  const sliceIdSd = useMemo(() => {
    let id = currentTabId;
    if (currentTabType !== tabType.subordinate) {
      id = tabId.subordinate;
    }
    return id;
  }, [currentTabId, currentTabType]);

  // redux
  // 邮件-搜索-搜索类型-主邮件
  const [mailSearching_main] = useState2RM('mailSearching');
  // 获取客户的读信
  const [mailSearching_cm] = useState2CustomerSlice('mailSearching', undefined, sliceIdCm);

  // 邮件搜索sliceId
  // 是否处于搜索的判断，根据所处页签的类型，判断选择那个搜索判断条件
  const mailSearching = useMemo(() => {
    if (currentTabType == tabType.customer) {
      return mailSearching_cm;
    }
    if (currentTabType == tabType.subordinate) {
      // 客户邮件没有搜索状态
      return false;
    }
    // 返回主邮件模块的搜索状态
    return mailSearching_main;
  }, [currentTabType, mailSearching_main, mailSearching_cm]);
  // 是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
  // 搜索列表-文件夹-选中的key
  const [selectedSearchKeys] = useState2RM('selectedSearchKeys');
  // 邮件-搜索-选中的邮件id
  const [searchMail, setSearchMail] = useState2RM('activeSearchMailId');
  // 邮件列表-当前选中的邮件id
  const [selectedMail, setSelectedMail] = useState2RM('selectedMailId');
  // 获取客户的读信
  const [selectedMailCm] = useState2CustomerSlice('selectedMailId', undefined, sliceIdCm);
  // 获取下属的读信
  const [selectedMailSd] = useState2SubordinateSlice('selectedMailId', undefined, sliceIdSd);
  // 读信页-是否处于拖动状态
  const [, setMailListResizeProcessing] = useState2RM('mailListResizeProcessing');
  // 邮件列表-文件夹-选中的key
  const [selectedKeys] = useState2RM('selectedKeys');
  // 邮件列表-选中的邮件id list
  // const [, setActiveIds] = useState2RM('activeIds',);

  // 分栏通栏
  const [configMailLayout, setConfigMailLayout] = useState2RM('configMailLayout', 'doUpdateConfigMailLayout');
  const isLeftRight = useMemo(() => configMailLayout === '1', [configMailLayout]);
  const isUpDown = useMemo(() => configMailLayout === '3', [configMailLayout]);
  const isColumn = useMemo(() => configMailLayout === '2', [configMailLayout]);

  // 邮箱快捷设置
  const [, setQuickSettingVisible] = useState2RM('configMailShow', 'doUpdateConfigMailShow');

  const [mailEntities] = useState2RM('mailEntities');

  // 分账号存储的文件夹 map
  const [mailTreeStateMap] = useState2RM('mailTreeStateMap', 'doUpdateMailTreeState');
  // 邮件标签列表-选中的标签名称
  const [tagName] = useState2RM('mailTagFolderActiveKey');

  // 文件夹宽度
  // const [defaultWidth, setDefaultWidth] = useState<number>(process.env.BUILD_ISEDM ? 200 : 220);
  // 列表宽度
  // const [defaultListWidth, setDefaultListWidth] = useState<number>(DEFAULT_LIST_WIDTH);

  const [eventID, setEventID] = useState<number | null>(null);

  // 是否展示读信
  const showReadMail = useMemo(() => isLeftRight || isUpDown || (!isLeftRight && currentTabType == tabType.read), [isLeftRight, currentTabType, isUpDown]);

  /**
   * 邮件切换打点
   * useMemo 在渲染
   */
  useMemo(() => {
    try {
      if (selectedMail?.id != null) {
        performance.time({
          statKey: 'mail_readmail_switch',
          statSubKey: '',
          params: {
            mailId: selectedMail?.id,
            accountId: selectedMail?.accountId + '',
          },
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [selectedMail?.id + '' + selectedMail?.accountId]);

  /**
   * 邮件切换打点
   * useMemo 在渲染
   */
  useMemo(() => {
    try {
      if (selectedMail?.id != null) {
        performance.time({
          statKey: 'mail_folder_switch',
          statSubKey: '',
          params: {
            folderId: selectedKeys?.id,
            accountId: selectedMail?.accountId + '',
          },
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [selectedKeys?.id + '' + selectedKeys?.accountId]);

  // 『默认』Tab
  const isMainTab = useMemo(() => {
    if (currentTabId?.includes('/')) {
      return currentTabId.split('/')[0] === tabId.readMain;
    }
    return currentTabId === tabId.readMain;
  }, [currentTabId]);

  // 是否展示邮件列表
  const showMailColumn = useMemo(() => isMainTab || isCustomerTab || isSubordinateTab, [isMainTab, isCustomerTab, isSubordinateTab, isUpDown]);

  // 生成跨业务的读信页请求包装器 - 返回的函数是引用稳定的
  const readMailUniqWarp = useGetUniqReqWrap();

  // 切换页签处理邮件激活
  useEffect(() => {
    // 如果当前页签id发生变换，且type为read，则设置激活邮件id
    if (currentTabType == tabType.read) {
      // 由于页签要展示多个相同的读信详情，考虑页签唯一性，读信页签id 改为读信‘mid_时间戳’格式，
      let mid = currentTabId;
      if (currentTab.type === tabType.read && currentTabId?.includes('_')) {
        mid = currentTab.extra?.originMid || currentTabId.split('_')[0];
      }
      if (isSearching) {
        setSearchMail({
          id: mid,
          accountId: currentTab?.extra?.accountId,
        });
      } else {
        setSelectedMail({
          id: mid,
          accountId: currentTab?.extra?.accountId,
        });
      }
    }
  }, [currentTabId]);

  // todo： 迁移走，进reducer
  // 设置页签,isActive：是否设置页签选中
  const setTab = (isActive = false) => {
    if (!isMainTab) {
      return;
    }
    let title;
    // 搜索邮件中，跳转到第一个页签，并修改title
    if (isSearching) {
      title = getIn18Text('SOUSUOYOUJIAN');
    } else {
      // 是标签
      if (selectedKeys.id == FLOLDER.TAG) {
        title = tagName?.key;
      } else {
        const curTreeMap = getTreeStatesByAccount(mailTreeStateMap, selectedKeys.accountId || '')?.MailFolderTreeMap;
        title = (curTreeMap && curTreeMap[selectedKeys.id]?.entry.mailBoxName) || getIn18Text('SHOUJIANXIANG');
        // 17版本智能模式下线
        // if (title) {
        //   // 判断是否添加展示:'智能'，要求：主账号，且不是聚合，且是收件箱
        //   const isThread = mailConfigStateIsMerge();
        //   const showAIName = isMainAccount(selectedKeys.accountId) && !isThread && selectedKeys.id == FLOLDER.DEFAULT;
        //   if (showAIName) {
        //     title = (getIn18Text('ZHINENG')) + title;
        //   }
        // } else {
        //   title = getIn18Text('WEIDINGYIYEQIAN');
        // }
      }
    }
    if (!title) {
      title = getIn18Text('WEIDINGYIYEQIAN');
    }
    const mailTabModel: MailTabModel = {
      id: '-1',
      title,
      type: tabType.readMain,
      closeable: false,
      isActive,
    };
    dispatch(
      mailTabActions.doChangeTabById({
        id: '-1',
        tabModel: mailTabModel,
        // setCurrent: isActive
      })
    );
  };

  // 搜索邮件，或者切换标签时触发
  useEffect(() => {
    setTab();
  }, [isSearching, `${tagName?.key}${tagName?.accountId}`]);

  // 文件夹map变化，触发title修改，但是不active
  useEffect(() => {
    setTab();
  }, [mailTreeStateMap]);

  // 搜索文件夹选中发生改变，切换页签但是不修改title
  useEffect(() => {
    if (isSearching) {
      if (!isCustomerTab && !isSubordinateTab && !isTabOpenedByCustomer) {
        dispatch(mailTabActions.doChangeCurrentTab('-1/-1'));
      }
    }
  }, [selectedSearchKeys, isCustomerTab, isSubordinateTab]);

  // 邮箱路由展示时，获取布局
  useEffect(() => {
    if (active) {
      const val = mailConfApi.getMailPageLayout();
      // val: String 1：分栏布局 2：通栏布局 3：上下布局
      setConfigMailLayout(val);
      // 点击除了邮箱外的其他tab关闭抽屉
      setQuickSettingVisible(false);
    }
  }, [active]);

  // 如果是分栏，且当前页签类型是read，需要切换到readMain
  useEffect(() => {
    if (isLeftRight && currentTabType === tabType.read) {
      dispatch(mailTabActions.doChangeCurrentTab('-1/-1'));
    }
  }, [isLeftRight]);

  const registeSendingMail = async () => {
    if (inElectron) {
      const curWinInfo = await systemApi.getCurrentWinInfo();
      if (curWinInfo.type === 'main') {
        const eventID = eventApi.registerSysEventObserver('sendingMail', {
          func: event => {
            if (event && event.eventData) {
              // 前往邮箱
              navigate('/#mailbox');
              // 前往主标签
              dispatch(mailTabActions.doChangeCurrentTab('-1'));
              dispatch(mailActions.doAddSendingMails(event.eventData as SendingMail));
            }
          },
        });
        setEventID(eventID);
      }
    }
  };

  useEffect(() => {
    registeSendingMail();
    return () => {
      eventID && eventApi.unregisterSysEventObserver('sendingMail', eventID);
    };
  }, []);

  // 监听窗口缩放，调整分栏大小
  const appColumnSize = useAppScale();

  const folderListWidthRef = useStateRef(appColumnSize.folderListWidth);
  const folderListMaxConstraintsRef = useStateRef(appColumnSize.folderListMaxConstraints);
  const mailListWidthRef = useStateRef(appColumnSize.mailListWidth);
  const mailListMaxConstraintsRef = useStateRef(appColumnSize.mailListMaxConstraints);

  // useEffect(() => {
  //   const storeFolderWidth = getValidStoreWidth(
  //     storeApi.getSync(STORE_MAIL_FOLDER_WIDTH, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' })
  //   );
  //   if (storeFolderWidth > 0 && !process.env.BUILD_ISEDM) {
  //     setDefaultWidth(storeFolderWidth);
  //   }
  //   const storeListWidth = getValidStoreWidth(
  //     storeApi.getSync(STORE_MAIL_LIST_WIDTH, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' })
  //   );
  //   if (storeListWidth > DEFAULT_LIST_MIN_WIDTH && isLeftRight) {
  //     setDefaultListWidth(storeListWidth);
  //   }
  // }, []);
  // 邮件-文件夹结构
  const columnMailBox = useMemo(() => {
    return (
      <ColumnMailBoxContainer
        isLeftRight={isLeftRight}
        height={height}
        isMainTab={isMainTab}
        // defaultWidth={defaultWidth}
        defaultWidth={folderListWidthRef.current}
        openInNewWindow={openInNewWindow}
        maxWidth={folderListMaxConstraintsRef.current}
        setMailListResizeProcessing={setMailListResizeProcessing}
        SideContentLayout
      >
        <ColumnMailBox />
      </ColumnMailBoxContainer>
    );
    // }, [isLeftRight, isMainTab, defaultWidth, openInNewWindow, appColumnSize.folderListWidth]);
  }, [isLeftRight, isMainTab, openInNewWindow, appColumnSize.folderListMaxConstraints]);

  // 邮件列表-结构
  const mailColumnEntry = useMemo(() => {
    let outerProps = {};
    if ((isLeftRight || isUpDown) && showMailColumn) {
      let upDownProps: {
        axis?: Axis | undefined;
        height?: number;
        defaultWidth?: number | string;
        defaultheight?: number | string;
        maxWidth?: number;
        minHeight?: number;
        minConstraints?: number[];
        maxConstraints?: number[];
      } = {
        defaultWidth: appColumnSize.mailListWidth,
        defaultheight: '100%',
      };
      if (isUpDown) {
        const storeListWidth = getValidStoreWidth(storeApi.getSync(STORE_MAIL_LIST_HEIGHT, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' }));
        const overHeight = document.body.clientHeight - 35;
        const height = overHeight / 2;
        upDownProps = {
          axis: 'y',
          height: storeListWidth || height,
          defaultWidth: '100%',
          defaultheight: storeListWidth || height,
          minConstraints: [Infinity, 192],
          maxConstraints: [Infinity, overHeight - 176],
          maxWidth: Infinity,
        };
      }
      outerProps = upDownProps;
    }
    return (
      <MailColumnEntryContainer
        height={height}
        showMailColumn={showMailColumn}
        isLeftRight={isLeftRight}
        isUpDown={isUpDown}
        upDownProps={outerProps}
        // defaultListWidth={defaultListWidth}
        defaultListWidth={mailListWidthRef.current}
        openInNewWindow={openInNewWindow}
        maxWidth={mailListMaxConstraintsRef.current}
        setMailListResizeProcessing={setMailListResizeProcessing}
        SideContentLayout
      >
        <MailColumnEntry isLeftRight={isLeftRight} style={isLeftRight && showMailColumn ? undefined : { position: 'relative' }} />
      </MailColumnEntryContainer>
    );
  }, [isLeftRight, isUpDown, showMailColumn, openInNewWindow]);

  // 获取当期那邮件
  const CurMailContent = useMemo(() => {
    if (currentTabType == tabType.customer) {
      return mailEntities[selectedMailCm?.id];
    }
    if (currentTabType == tabType.subordinate) {
      return mailEntities[selectedMailSd?.id];
    }
    return mailEntities[openInNewWindow ? mailId : isSearching ? searchMail.id : selectedMail.id];
  }, [mailEntities, openInNewWindow, mailId, isSearching, searchMail.id, selectedMail.id, currentTabType, selectedMailCm?.id, selectedMailSd?.id]);

  const doGetTpMailContent = useCallback(
    (id, _noFlagInfo, noCache) => {
      return mailApi.doGetTpMailContent(
        {
          mid: id,
          owner: CurMailContent?.owner,
        },
        noCache
      );
    },
    [CurMailContent]
  );

  const currentMailId = useMemo(() => {
    if (openInNewWindow) {
      return mailId;
    }
    // 如果是外贸客户
    if (currentTabType == tabType.customer) {
      return selectedMailCm?.id || '';
    }
    //如果是外贸下属
    if (currentTabType == tabType.subordinate) {
      return selectedMailSd?.id || '';
    }
    if (isSearching) {
      return searchMail?.id || '';
    }
    return selectedMail.id || '';
  }, [openInNewWindow, mailId, searchMail?.id, selectedMail.id, sliceIdCm, sliceIdSd, currentTabType, selectedMailCm?.id, selectedMailSd?.id, isSearching]);

  const emptyRender = useCallback(() => {
    if (currentTabType == tabType.customer) {
      return <CustomerEmptyDetail />;
    }
    if (selectedKeys?.id == FLOLDER.STAR) {
      return <EmptyContact showLogo={!isUpDown} />;
    }
    return null;
  }, [selectedKeys?.id, isUpDown, currentTabType]);

  // 读信组件
  const readMail = useMemo(() => {
    return (
      <MainReadMailWrap
        SideContentLayout
        showReadMail={showReadMail}
        id={currentMailId}
        height={height}
        isUpDown={isUpDown}
        from={from}
        openInNewWindow={openInNewWindow}
        tempContent={CurMailContent}
        requestUniqWrap={readMailUniqWarp}
        readOnly={CurMailContent && CurMailContent?.isTpMail}
        getSignMailContent={CurMailContent && CurMailContent?.isTpMail ? doGetTpMailContent : null}
        emptyRender={emptyRender}
      />
    );
  }, [showReadMail, openInNewWindow, currentMailId, doGetTpMailContent, CurMailContent?.id, emptyRender]);

  const [style] = useState({ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' });

  const listAndContent = useMemo(() => {
    return isUpDown ? (
      <div className="listAndContent" data-sidecontent>
        {/* 当前页签是readMain类型才展示邮件列表，具体通栏还是分栏内部区分 */}
        {!openInNewWindow && mailColumnEntry}
        {/* 分栏模式 || 通栏，读信页签，展示读信组件 */}
        {readMail}
      </div>
    ) : (
      <>
        {/* 当前页签是readMain类型才展示邮件列表，具体通栏还是分栏内部区分 */}
        {mailColumnEntry}
        {/* 分栏模式 || 通栏，读信页签，展示读信组件 */}
        {readMail}
      </>
    );
  }, [isUpDown, openInNewWindow, mailColumnEntry, readMail]);

  // todo： 2023.11.14 没有用useMemo处理，可能存在性能问题 appColumnSize.folderListWidth的debounce会导致拖不动
  if (isCustomerTab || isTabOpenedByCustomer) {
    return (
      <ctSliceContext.Provider value={sliceIdCm}>
        <CustomerMailContainer
          style={style}
          isLeftRight={isLeftRight}
          openInNewWindow={openInNewWindow}
          defaultWidth={appColumnSize.folderListWidth}
          height={height}
          showMailColumn={showMailColumn}
          defaultListWidth={appColumnSize.mailListWidth}
          setMailListResizeProcessing={setMailListResizeProcessing}
          folderMaxWidth={appColumnSize.folderListMaxConstraints}
          listMaxWidth={appColumnSize.mailListMaxConstraints}
        >
          {readMail}
        </CustomerMailContainer>
        {/* {customerIframe} */}
      </ctSliceContext.Provider>
    );
  }

  // todo： 2023.11.14 没有用useMemo处理，可能存在性能问题 appColumnSize.folderListWidth的debounce会导致拖不动
  if (isSubordinateTab || isTabOpenedBySubordinate) {
    return (
      <SdSliceContext.Provider value={sliceIdSd}>
        <SubordinateMailContainer
          style={style}
          isLeftRight={isLeftRight}
          openInNewWindow={openInNewWindow}
          defaultWidth={appColumnSize.folderListWidth}
          height={height}
          showMailColumn={showMailColumn}
          defaultListWidth={appColumnSize.mailListWidth}
          setMailListResizeProcessing={setMailListResizeProcessing}
          folderMaxWidth={appColumnSize.folderListMaxConstraints}
          listMaxWidth={appColumnSize.mailListMaxConstraints}
        >
          {readMail}
        </SubordinateMailContainer>
        {/* {customerIframe} */}
      </SdSliceContext.Provider>
    );
  }

  return (
    <>
      {!openInNewWindow && <RevokeToasts />}
      <PageContentLayout style={style}>
        {columnMailBox}
        {listAndContent}
      </PageContentLayout>
      {/* {customerIframe} */}
    </>
  );
};
export default ReadMailPage;
