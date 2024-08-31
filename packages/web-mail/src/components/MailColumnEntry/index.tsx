import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { Spin, Tooltip } from 'antd';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import classnames from 'classnames';
import {
  apiHolder as api,
  apis,
  MailApi,
  MailConfApi,
  MailEntryModel,
  SystemApi,
  HtmlApi,
  mailPerfTool,
  // StrangerModel,
  // MailStrangerApi,
  inWindow,
  AutoReplyApi,
  DataTrackerApi,
  PerformanceApi,
  platform,
  // queryMailBoxParam,
  ContactAndOrgApi,
  AccountApi,
} from 'api';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { BackToTopNewIcon } from '@web-common/components/UI/Icons/icons';
import '../../mailBox.scss';
import '../MailList/index.scss';
import MailList from '../MailList/MailList';
import MailListLong from '../MailList/MailListLong';
import MailWrap from './mailListWrap';
import useState2RM from '../../hooks/useState2ReduxMock';
import useMailStore from '../../hooks/useMailStoreRedux';
import {
  getTopMailSumHeight,
  mailLogicStateIsMerge,
  getTreeStatesByAccount,
  // setCurrentAccount,
  folderIdIsContact,
  importMails,
  getEmlFileFromDragTrans,
  // isMainAccount,
  dragTransFileHasEml,
  promiseIsTimeOut,
  // aggregateFolderIds,
  getMainAccount,
} from '../../util';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { MailActions, useActions, useAppDispatch, useAppSelector, AutoReplyActions } from '@web-common/state/createStore';
import { FLOLDER, TASK_MAIL_STATUS } from '../../common/constant';
import FilterTab from './filterElement';
// import BlankImg from '../../../../web/src/images/blank.png';
// import Stranger from '@web-mail/components/Stranger/stranger';
import { stringMap, MailCardComProps } from 'types';
// import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
// import SmartMailboxTip from './SmartMailboxTip';
// import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { actions as mailTabActions, MailTabModel, MailTabThunks, ReadTabModel, tabType } from '@web-common/state/reducer/mailTabReducer';
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import useThrottleForEvent from '../../hooks/useThrottleForEvent';
const MailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const systemApi: SystemApi = api.api.getSystemApi();
// const eventApi = api.api.getEventApi();
const htmlApi = api.api.requireLogicalApi(apis.htmlApi) as HtmlApi;
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
// const storeApi = api.api.getDataStoreApi();
// const autoReplyApi = api.api.requireLogicalApi(apis.autoReplyApiImpl) as AutoReplyApi;
// import { useWhyDidYouUpdate } from 'ahooks';
// const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
// import {getCardHeight} from "@web-mail/utils/mailCardUtil";
// import { getCardHeight as getLongCardHeight } from '../../common/components/vlistCards/MailCard/MailCardLong';
import useShouldUseRealList from '../../hooks/useShouldUseRealList';
// import throttle from 'lodash/throttle';
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const performance = api.api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
const performanceApi = api.api.requireLogicalApi(apis.performanceImpl) as unknown as PerformanceApi;
import useListDiffFouceRender from './useListDiffFouceRender';
import StarFolderEmptyContent from '@web-mail/components/StarContact/EmptyContact';
import MailListPager from './realListPager';
import variables from '@web-common/styles/export.module.scss';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';
import useCreateCallbackForEvent from '@web-mail/hooks/useCreateCallbackForEvent';
import { getIn18Text } from 'api';
import useStateRef from '@web-mail/hooks/useStateRef';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
// import { SubFolderSender } from '@web-mail/common/components/vlistCards/MailCard/defaultComs';
import MailListTips from '@web-mail/components/MailListTips/MailListTips';
// import { useContactModelList } from '@web-common/hooks/useContactModel';
// import CustomerLabel from '@web-mail/components/ReadMail/component/CustomerLabel';
import { createAccountEmailKey } from '@web-common/components/util/contact';
import { refreshContactDataByEmails } from '@web-common/state/reducer/contactReducer';

const goWebmail = () => {
  const module = 'welcome.CorpWelcomeModule';
  const url = MailConfApi.getSettingUrl(module);
  systemApi.openNewWindow(url, true);
};

// 文件夹锁定
const safetyLockEl = (
  <>
    <div className="m-auth">
      <div className="m-auth-lock">
        <ReadListIcons.LockSvg />
      </div>
      <div className="m-auth-text">{getIn18Text('GAIWENJIANJIAYI')}</div>
      <div className="m-auth-text">{getIn18Text('DANGQIANBANBENZAN')}</div>
      <div className="m-auth-note">
        {getIn18Text('KEQIANWANGJIUBAN')}
        <span className="link" onClick={() => goWebmail()}>
          qiye.163.com
        </span>
      </div>
    </div>
  </>
);
interface ListFailProps {
  loading: boolean;
  onRefresh: () => void;
}
// 列表加载失败的展示
const ListFail = (props: ListFailProps) => {
  const { loading = false, onRefresh = () => {} } = props;
  return (
    <div className="m-list">
      <div className="m-list-empty">
        <div className="empty">{getIn18Text('JIAZAISHIBAI')}</div>
        {loading ? (
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        ) : (
          <div className="refresh" onClick={onRefresh}>
            {getIn18Text('ZHONGXINJIAZAI')}
          </div>
        )}
      </div>
    </div>
  );
};
interface ListEmptyProps {
  name: string;
  onRefresh: () => void;
  selected?: string;
  showLogo?: boolean;
  btnRender?: () => React.ReactElement;
}

// 发件箱及子文件夹，外贸通标签
// const CustomerLabelAfterCom = (props: MailCardComProps) => {
//   const { data } = props;
//   const { receiver, _account, isThread = false } = data;
//   const { threadMessageCount } = data.entry || {};
//   const isSent = useMemo(() => {
//     if (data) {
//       const accountAlias = systemApi.getCurrentUser(data?._account)?.prop?.accountAlias || [];
//       const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];
//       const senderEmail = contactApi.doGetModelDisplayEmail(data?.sender?.contact);
//       return (
//         accountAliasArray.some(account => accountApi.getIsSameSubAccountSync(account, senderEmail)) || accountApi.getIsSameSubAccountSync(senderEmail, data._account)
//       );
//     } else {
//       return false; // 如果当前邮件是空，则不是我发出的
//     }
//   }, [data]);
//   // 发信的标签判断仅仅基于收信
//   const emails = receiver?.filter(item => item.mailMemberType === 'to')?.map(item => contactApi.doGetModelDisplayEmail(item.contact));
//   const receiversContactModels = useContactModelList(emails, _account);
//   // 我的客户
//   const myCustomer = useMemo(() => receiversContactModels.find(item => item?.customerOrgModel?.role === 'myCustomer'), [receiversContactModels]);
//   // 同事客户
//   const colleagueCustomer = useMemo(
//     () => receiversContactModels.find(item => item?.customerOrgModel?.role === 'colleagueCustomer' || item?.customerOrgModel?.role === 'colleagueCustomerNoAuth'),
//     [receiversContactModels]
//   );
//   // 公海客户
//   const openSeaCustomer = useMemo(() => receiversContactModels.find(item => item?.customerOrgModel?.role === 'openSeaCustomer'), [receiversContactModels]);
//   // 我的线索
//   const myClue = useMemo(() => receiversContactModels.find(item => item?.customerOrgModel?.role === 'myClue'), [receiversContactModels]);
//   // 同事线索
//   const colleagueClue = useMemo(
//     () => receiversContactModels.find(item => item?.customerOrgModel?.role === 'colleagueClue' || item?.customerOrgModel?.role === 'colleagueClueNoAuth'),
//     [receiversContactModels]
//   );
//   // 公海线索
//   const openSeaClue = useMemo(() => receiversContactModels.find(item => item?.customerOrgModel?.role === 'openSeaClue'), [receiversContactModels]);
//   // 最终展示的联系人
//   const contactModel = useMemo(() => myCustomer || myClue || colleagueCustomer || colleagueClue || openSeaCustomer || openSeaClue || null, [receiversContactModels]);
//   const marginLeft = isThread && threadMessageCount > 1 ? '-4px' : '4px';
//   const style = {
//     marginRight: '6px',
//     marginLeft,
//     whiteSpace: 'nowrap',
//     overflow: 'hidden',
//     textOverflow: 'ellipsis',
//   };
//   return isSent && contactModel ? <CustomerLabel style={style} contact={contactModel} curAccount={_account} /> : null;
// };

// 邮件列表为空提示
const ListEmpty = (props: ListEmptyProps) => {
  const { name = '', onRefresh = () => {}, showLogo = true, btnRender } = props;

  const Btn = useMemo(() => {
    if (typeof btnRender === 'function') {
      return btnRender();
    } else {
      return <>{getIn18Text('SHUAXIN')}</>;
    }
  }, [btnRender]);

  return (
    <div className="m-list">
      <div className="m-list-empty">
        {showLogo && <div className="sirius-empty sirius-empty-doc" style={{ marginBottom: '20px' }}></div>}
        <div className="empty">{name}</div>
        <div className="refresh" onClick={onRefresh}>
          {Btn}
        </div>
      </div>
    </div>
  );
};
// 列表-回到顶部
const ListBackTop = (props: any) => {
  const { style, onClick } = props;
  return (
    <div style={style} className={classnames(['back-top-wrapper'])}>
      <Tooltip title={getIn18Text('HUIDAODINGBU')} mouseEnterDelay={1} mouseLeaveDelay={0.15}>
        <BackToTopNewIcon onClick={onClick} style={{ cursor: 'pointer' }} />
      </Tooltip>
    </div>
  );
};
type MailDelete = {
  realDeleteNum?: number;
  isThreadSign?: boolean;
  detail?: boolean;
  threadId?: string;
  showLoading?: boolean;
  showGlobalLoading?: boolean;
  isScheduleSend?: boolean;
};
// const renderTitle = (mail: MailEntryModel, selectedKeys: number) => {
//   const { receiver } = mail;
//   const titleArray: string[] = [];
//   receiver.map(item => {
//     const _contact = item?.contact?.contact;
//     if (_contact) {
//       const itemTitleOrigin = systemApi.getCurrentUser()?.id === _contact?.accountName ? getIn18Text('WO') : _contact?.contactName || _contact?.accountName;
//       const itemTitle = htmlApi.encodeHtml(itemTitleOrigin);
//       if (!titleArray.includes(itemTitle)) {
//         // 去重
//         titleArray.push(itemTitle);
//       }
//     }
//   });
//   return `${
//     selectedKeys == 3 && receiver && receiver[0] && receiver[0].contact?.contact?.accountName && (!mail?.entry?.threadMessageCount || mail?.entry?.threadMessageCount < 2)
//       ? getIn18Text('ZHI\uFF1A')
//       : ''
//   }${titleArray.join('、')}`;
// };

// 邮件列表包裹组件
const MailListWrap = React.forwardRef((props, ref) => {
  const { isLeftRight } = props;
  const listRef = useRef();
  useImperativeHandle(ref, () => listRef.current, []);
  const innerProps = useMemo(() => {
    return { ...props, ref: undefined };
  }, [props]);

  return isLeftRight ? <MailList {...innerProps} ref={listRef} /> : <MailListLong {...innerProps} ref={listRef} />;
});
// const keepPeriod = 30;
// 是否点击关闭了，邮件列表智能提示，存储key
// const ReadSmartMailTipKey = 'mail_read_smart_mailbox_tip';
// 距离顶部多远的时候，显示回到顶部按钮
const topCalculated = 300;

// 收信箱邮件列表入口
const MailColumnEntry = (props, ref) => {
  // const [mailDataList, setMailList] = useMailStore('mailDataList' ,{ key: 'mailList', exclude: ['entry.attachment','taskInfo','entry.taskTop'] });
  const [mailDataList] = useMailStore('mailDataList', { key: 'mailList', exclude: ['receiver'] });
  const [searchList] = useMailStore('searchList', { key: 'search', exclude: ['entry.title', 'receiver', 'entry.brief'] });
  // 快捷设置三个，摘要，附件，列表密度，会影响列表重排列
  // const [descChecked, setDescChecked] = useState2RM('configMailListShowDesc', 'doUpdateConfigMailListShowDesc');
  // const [attachmentChecked, setAttachmentChecked] = useState2RM('configMailListShowAttachment', 'doUpdateConfigMailListShowAttachment');
  // const [mailConfigListTightness, setMailConfigListTightness] = useState2RM('configMailListTightness', 'doUpdateConfigMailListTightness');
  // const [showAvator] = useState2RM('configMailListShowAvator', 'doUpdateConfigMailListShowAvator');

  const { isLeftRight } = props;
  const [configMailLayout] = useState2RM('configMailLayout', 'doUpdateConfigMailLayout');
  const isUpDown = useMemo(() => configMailLayout === '3', [configMailLayout]);
  const isColumn = useMemo(() => configMailLayout === '2', [configMailLayout]);
  // const DEFAULT_LIST_WIDTH = 324;
  // const DEFAULT_LIST_MIN_WIDTH = 310;
  // const MailColumnRef = useRef<any>(null);
  // const size = useWindowSize(true);
  // const [listWidth, setListWidth] = useState(DEFAULT_LIST_WIDTH);
  const dispatch = useAppDispatch();
  // const [listHeight, setListHeight] = useState<number>(0);
  // const [keepPeriod, setKeepPeroid] = useState<number>(30);
  const [notice, setNotice] = useState<boolean>(systemApi.isSysNotificationAvailable() !== 'granted');
  const [curMenuMailId, setCurMenuMailId] = useState<any[]>();
  const [selectedKeys, setSelectedKeys] = useState2RM('selectedKeys', 'doUpdateSelectedKey');
  const [searchResultObj, setSearchResultObj] = useState2RM('searchResultObj', 'doUpdateSearchResultObj');
  // 搜索-邮件列表
  // const [searchList, setSearchList] = useState2RM('searchList', 'doUpdateSeatchList');
  // 邮件-邮件列表
  // const [mailDataList, setMailList] = useState2RM('mailDataList', 'doUpdateMailDataList');
  // 邮件列表是否处于loading
  const [listLoading, setListLoading] = useState2RM('listLoading', 'doUpdateMailListLoading');
  // 邮件-搜索-搜索类型
  const [mailSearching, doUpdateMailSearching] = useState2RM('mailSearching', 'doUpdateMailSearching');
  // 邮件-搜索-是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
  // 邮件-搜索-是否是高级搜素
  const isAdvancedSearch = useMemo(() => mailSearching === 'advanced', [mailSearching]);
  // 邮件列表宽高设置
  const [scrollTop, setScrollTop] = useState2RM('scrollTop', 'doUpdateMailListScrollTop');
  // 新邮件提醒
  const [isNoticeNum, setIsNoticeNum] = useState2RM('noticeNum', 'doUpdateNoticeNum');
  // 邮件列表-选中的邮件idlist
  const [activeIds, setActiveIds] = useState2RM('activeIds');
  // 邮件列表-右键菜单-是否显示
  const [mailListMenuVisiable, setMailListMenuVisiable] = useState2RM('mailListMenuVisiable', 'doUpdateMailListMenuVisiable');
  // // 是否展示聚合邮件-构建中-tip
  // const [showThreadBuildingTip] = useState2RM('showThreadBuildingTip', 'doUpdateShowTbTip');
  // // 是否展示性白哦联系人是否在构建中-tip
  // const [showStarContactBuildingTip] = useState2RM('showStarContactBuildingTip');
  // 邮件列表-上部-二级tab选中
  const [selected, setSelected] = useState2RM('mailListStateTab', 'doUpdateMailListStateTab');
  // 邮件-刷新按钮-是否处于loading状态
  const [refreshLoading, setFreshLoading] = useState2RM('refreshLoading', 'doUpdateRefreshLoading');
  // 当前邮件文件夹是否处于锁定
  const [authLock, setAuthLock] = useState2RM('mailFolderIsLock', 'doUpdateMailFolderIsLock');
  // 搜索列表-上部-二级tab选中
  const [searchSelected] = useState2RM('searchListStateTab', 'doUpdateSearchListStateTab');
  // 邮件列表-当前选中的邮件id
  const [selectedMail, setSelectedMail] = useState2RM('selectedMailId', 'doUpdateSelectedMail');
  // 邮件-搜索-选中的邮件id
  const [searchMail, setSearchMail] = useState2RM('activeSearchMailId', 'doUpdateActiveSearchMailId');
  // 邮件文件夹相关状态map
  const [mailTreeStateMap, setTreeState] = useState2RM('mailTreeStateMap', 'doUpdateMailTreeState');
  const mailTreeStateMapRef = useStateRef(mailTreeStateMap);
  // 邮件标签列表-选中的标签名称
  const [tagName] = useState2RM('mailTagFolderActiveKey');
  // 邮件-邮件列表-总数
  const [mailTotal, setMailTotal] = useState2RM('mailTotal', 'doUpdateMailTotal');
  // 邮件列表-首次加载-是否失败
  const [listLoadIsFail, setListLoadIsFail] = useState2RM('mailListInitIsFailed', 'doUpdateMailListInitIsFailed');

  const [listModel, setListModel] = useState2RM('defaultMailListSelectedModel');

  // const [_, doUpdateTaskMailListStateTab] = useState2RM('taskMailListStateTab');

  const [listIsRefresh] = useState2RM('listIsRefresh');

  const [isDragModel] = useState2RM('isDragModel');

  // 屏蔽eml文件over太多次触发
  const emlOverLock = useRef(true);

  // 是否显示列表的遮罩
  const [showMailListDropPanel, setShowMailListDropPanel] = useState(false);

  // 是否使用实体列表
  const shouldUseRealList = useShouldUseRealList();

  // 智能收件箱相关,17版本下线
  // const [isSmartMailBoxMode, setIsSmartMailBoxMode] = useState<boolean>(false);
  // const [recentStrangers, setRecentStrangers] = useState<StrangerModel[]>([]);
  // const [strangerCount, setStrangerCount] = useState<number>(0);
  // 智能收件箱提示，控制
  // const [showSmartMailboxTip, setShowSmartMailboxTip] = useState2RM('showSmartMailboxTip', 'doUpdateShowSmartMailboxTip');
  // const [autoReplyTip, setAutoReplyTip] = useState<boolean>(false); // 已读提醒新功能tip
  // const mailTagListStore = useAppSelector(state => state.mailReducer.mailTagList);
  const currentTabId: string = useAppSelector(state => state.mailTabReducer.currentTab.id);
  const reducer = useActions(MailActions);
  // const MailFolderTreeMap = useAppSelector(state => state.mailReducer.mailTreeStateMap?.main?.MailFolderTreeMap);
  const mailTagListStore = useMemo(() => {
    const folderState = getTreeStatesByAccount(mailTreeStateMap, selectedKeys?.accountId || '');
    if (folderState && folderState?.mailTagList) {
      return folderState?.mailTagList;
    }
    return [];
  }, [mailTreeStateMap, selectedKeys?.accountId]);

  // 当前邮件的id 拼接成的key，用于屏蔽列表的无效渲染
  const mailIdList: string = useMemo(() => {
    const list = isSearching ? searchList : mailDataList;
    return (list as MailEntryModel[])?.map(item => item?.id)?.join(',');
  }, [mailDataList, searchList, isSearching]);

  const readTabMailList: { id: string; title: string }[] = useMemo(() => {
    const list = isSearching ? searchList : mailDataList;
    // const readTabList:{[key: string]: string}  = {};

    return (list as MailEntryModel[])?.map(item => {
      let title = getIn18Text('WUZHUTI');
      try {
        title = item?.entry?.title.replace(/<b>/g, '').replace(/<\/b>/g, '') || getIn18Text('WUZHUTI');
      } catch (e) {
        console.error('[Error reg]', e);
      }
      return {
        id: item?.id,
        title: title,
      };
    });
    // return readTabList;
  }, [mailDataList, searchList, isSearching]);
  /**
   * 检测列表高度是否发生变化，如果变化则强制列表进行渲染同步，只在列表长度没有发生变化的时候进行检测
   * 列表长度变化则有id的变化去触发列表的渲染
   */
  // const listPreConfigRef = useRef<{
  //   // 上一次检测的列表长度
  //   listPreLength: number;
  //   // 上一次检测的列表高度
  //   listPreHeight: number;
  //   // 是否是初始化
  //   isInit: boolean;
  //   // 上次对比的列表id
  //   preIds: string,
  // }>({
  //   listPreLength: 0,
  //   listPreHeight: 0,
  //   isInit: true,
  //   preIds: ''
  // });

  // const MailListHeightChange = useMemo(() => {
  //   const { listPreLength, listPreHeight, isInit, preIds } = listPreConfigRef.current;
  //   // 只在列表id没变，但是数据源却发生了变化的时候，进行高度对比检测。
  //   const list = ((isSearching ? searchList : mailDataList) as MailEntryModel[]) || [];
  //   try{
  //     if (listPreLength === list?.length && mailIdList == preIds && !isInit) {
  //       let sum = 0;
  //       if (isLeftRight) {
  //         list?.forEach(item => {
  //           sum += getCardHeight(item);
  //         });
  //       } else {
  //         // const list = ((isSearching ? searchList : mailDataList) as MailEntryModel[]) || [];
  //         list?.forEach(item => {
  //           sum += getLongCardHeight(item);
  //         });
  //       }
  //       listPreConfigRef.current.listPreHeight = sum;
  //       listPreConfigRef.current.preIds = mailIdList;
  //       listPreConfigRef.current.listPreLength = list.length;
  //       return sum;
  //     } else {
  //       // 只有列表长度变化一次后，才开启对比
  //       listPreConfigRef.current.isInit = false;
  //       listPreConfigRef.current.preIds = mailIdList;
  //       listPreConfigRef.current.listPreLength = list.length;
  //       // 直接返回上次的值，防止触发渲染
  //       return listPreHeight;
  //     }
  //   } catch(e){
  //     console.log('[MailListHeightChange Error]', e)
  //   }
  //   return listPreHeight;
  // }, [mailDataList, searchList]);

  // 列表强制重渲染
  // 业务：在邮件快捷键切换后，立即重算虚拟列表的位置
  // 在检测到列表高度有异常变化的时候
  // todo: 抽离到独立的hook中
  // const frCount = useRef(0);
  // const listFouceRender = useMemo(()=>{
  //   frCount.current++
  //   return frCount.current;
  // },[mailConfigListTightness, descChecked, attachmentChecked, MailListHeightChange]);

  const listFouceRender = useListDiffFouceRender(mailDataList, searchList, isSearching, isLeftRight);

  //useWhyDidYouUpdate('MailColumnEntry', { ...props, mailDataList,searchList,descChecked,attachmentChecked,mailConfigListTightness,dispatch,notice,curMenuData,selectedKeys,searchResultObj,listLoading,mailSearchStateMap,isSearching,isAdvancedSearch,scrollTop,isNoticeNum,activeIds,mailListMenuVisiable,showThreadBuildingTip,selected,refreshLoading,authLock,searchSelected,selectedMail,searchMail,mailTreeStateMap,tagName,mailTotal,listLoadIsFail,autoReplyTip,mailTagListStore,currentTab, });
  // 获取陌生人
  // const getRecentStrangers = async () => {
  //   // 只有主账号才有该功能
  //   setCurrentAccount();
  //   // 从db获取陌生人
  //   const res = await MailApi.doGetRecent3Strangers();
  //   const { recent3Strangers, strangerCount } = res;
  //   setRecentStrangers(recent3Strangers);
  //   setStrangerCount(strangerCount);
  //   // setRecentStrangers([recent3Strangers[0]]);
  //   // setStrangerCount(1);
  // };
  // 初始化获取下，是否点击了关闭智能提示，或者设置了优先级
  // useEffect(() => {
  //   setCurrentAccount();
  //   const store = storeApi.getSync(ReadSmartMailTipKey);
  //   if (store.data == 'true') {
  //     setShowSmartMailboxTip(false);
  //   }
  //   return () => { };
  // }, []);
  // // 获取api中是否展示摘要，附件，列表密度，同步到redux
  // useEffect(() => {
  //   const desc = MailConfApi.getMailShowDesc();
  //   setDescChecked(desc);
  //   const attachment = MailConfApi.getMailShowAttachment();
  //   setAttachmentChecked(attachment);
  //   const tightness = MailConfApi.getMailListTightness();
  //   setMailConfigListTightness(+tightness);
  //   return () => { };
  // }, []);

  // 只要变化了，直接设置为true，之后不再展示提示
  // useEffect(() => {
  //   setCurrentAccount();
  //   storeApi.putSync(ReadSmartMailTipKey, 'true');
  // }, [showSmartMailboxTip]);
  // 点击关闭了，智能提示
  // const setVisible = (visible: boolean) => {
  //   setShowSmartMailboxTip(visible);
  // };
  // 移除陌生人入口
  // const removeStrangerEntry = () => {
  //   setRecentStrangers([]);
  //   setStrangerCount(0);
  // };
  // 17版本智能模式下线，topExtraData直接成[]空数组了
  // const topExtraData: any[] = [];
  // const topExtraData = useMemo(() => {
  //   // 智能模式下
  //   // 当前处于全部, 优先邮件列表时
  //   // 智能收件箱 或 个人文件夹
  //   const topExtraDataArray = [];
  //   // 全部tab下，提示优先邮件功能
  //   if (!!isSmartMailBoxMode && selected == 'ALL' && selectedKeys.id && (selectedKeys.id === 1 || selectedKeys.id >= 100)) {
  //     topExtraDataArray.push({
  //       element: <SmartMailboxTip visible={showSmartMailboxTip} setVisible={setVisible} />,
  //       height: showSmartMailboxTip ? (isLeftRight ? 60 : 36) : 0
  //     });
  //   }
  //   // 陌生人来信
  //   // 高度计算：一个陌生人120 + 8，多个陌生人64 + 8,通栏只影响一个人的样式和高度
  //   const strangerHeight = strangerCount === 0 ? 0 : strangerCount == 1 ? (isLeftRight ? 128 : 102) : 72;
  //   if (!!isSmartMailBoxMode && ['ALL', 'PREFERRED'].includes(selected) && selectedKeys.id && (selectedKeys.id === 1 || selectedKeys.id >= 100)) {
  //     topExtraDataArray.push({
  //       element: (
  //         <Stranger
  //           isLeftRight={isLeftRight}
  //           recentStrangers={recentStrangers}
  //           strangerCount={strangerCount}
  //           removeStrangerEntry={removeStrangerEntry}
  //         />
  //       ),
  //       height: strangerHeight
  //     });
  //   }
  //   return topExtraDataArray;
  // }, [isSmartMailBoxMode, strangerCount, recentStrangers, selected, selectedKeys, showSmartMailboxTip, isLeftRight]);

  // 自动回复相关
  // const autoReplyDetail = useAppSelector(state => state.autoReplyReducer.autoReplyDetail);
  // const { updateAutoReplyDetail } = useActions(AutoReplyActions);
  // 当前正在显示的列表
  const mailList = useMemo(() => {
    return isSearching ? searchList : mailDataList;
  }, [isSearching, searchList, mailDataList]);
  // 列表是否有内容
  const havingContent = useMemo(() => {
    return (mailList && mailList.length > 0) || listLoading;
  }, [mailList, listLoading]);
  // 是否显示文件夹锁定
  const showLock = useMemo(() => {
    return authLock && !isSearching;
  }, [authLock, isSearching]);
  // 邮件列表-是否显示回到顶部按钮
  const showListBackTop = useMemo(() => {
    return scrollTop > topCalculated && !authLock;
  }, [authLock, scrollTop]);
  // 邮件列表ref
  const mailListRef = useRef();

  // 通栏下-初始化邮件列表选中状态
  useEffect(() => {
    if (!isLeftRight && !isUpDown && activeIds && activeIds.length == 0) {
      if (isSearching) {
        if (searchList?.length) {
          setActiveIds([searchList[0]?.id]);
        }
      } else {
        if (mailDataList?.length) {
          setActiveIds([mailDataList[0]?.id]);
        }
      }
    }
  }, [isLeftRight, isUpDown, activeIds, mailDataList, isSearching]);

  // 获取当前选中的文件夹名称
  const curFolderName = useMemo(() => {
    if (selectedKeys) {
      const treeMap = getTreeStatesByAccount(mailTreeStateMap, selectedKeys.accountId)?.MailFolderTreeMap;
      if (selectedKeys.id && treeMap && treeMap[selectedKeys.id]?.entry.mailBoxName) {
        return treeMap[selectedKeys.id]?.entry?.mailBoxName;
      }
    }
    return '';
  }, [selectedKeys, mailTreeStateMap]);

  // 计算当前发件箱下面所有的文件夹id
  // const senderFolderIds = useMemo(() => {
  //   const treeMap = getTreeStatesByAccount(mailTreeStateMap, selectedKeys.accountId)?.MailFolderTreeMap;
  //   if (selectedKeys.id && treeMap && treeMap[FLOLDER.SENT]) {
  //     return aggregateFolderIds(treeMap[FLOLDER.SENT]);
  //   }
  //   return [];
  // }, [selectedKeys, mailTreeStateMap]);

  // 计算当前文件夹是否是发件箱子文件夹
  // const isSubSenderFolder = useMemo(
  //   () => selectedKeys?.id && selectedKeys?.id !== FLOLDER.SENT && senderFolderIds.includes(selectedKeys?.id as number),
  //   [senderFolderIds]
  // );

  // 在邮件激活的时候打性能起始点
  const trackMailActiveStart = useCallback((id: 'string' | number) => {
    // 现在性能打点携带的参数无效，所以先简单测量，不添加附带参数
    try {
      performanceApi.time({
        statKey: `mail_listclick_content_load_time`,
        statSubKey: id + '',
      });
    } catch (e) {
      console.error(e);
    }
  }, []);
  const trackMailActiveStartRef = useCreateCallbackForEvent(trackMailActiveStart);
  // 有客户权限
  const hasCustomerAuth: boolean = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CONTACT', 'VIEW'));

  // 文件夹为空-显示的提示名称
  let empryFolderTip = useMemo(() => {
    let res = getIn18Text('WENJIANJIA');
    if (isSearching) {
      return getIn18Text('SOUSUOJIEGUO') + getIn18Text('MAIL_FOLDER_EMPTY_TIP');
    }
    if (tagName?.key) {
      res = tagName?.key;
    }
    if (selected === 'UNREAD' || selected === 'REDFLAG' || selected === 'MY_CUSTOMER') {
      if (selected == 'UNREAD') {
        return '暂无未读邮件';
      }
      if (selected === 'REDFLAG') {
        return '暂无红旗邮件';
      }
      if (selected === 'MY_CUSTOMER') {
        if (!hasCustomerAuth) {
          return '无客户列表的查看权限，请联系管理员';
        } else {
          return '我的客户邮件列表为空';
        }
      }
    }
    if (selectedKeys.id == FLOLDER.STAR) {
      return getIn18Text('noMarkContact');
    }
    if (folderIdIsContact(selectedKeys?.id)) {
      return '无往来邮件';
    }
    if (curFolderName) {
      res = curFolderName;
    }
    return res + getIn18Text('MAIL_FOLDER_EMPTY_TIP');
  }, [isSearching, `${tagName?.key}${tagName?.accountId}`, curFolderName, selectedKeys, selected, hasCustomerAuth]);

  // 获取文件夹的删除期限
  // 从当前选中的文件夹中id读取。
  // const getKeepPeriodByFolderId = useCallback(
  //   (folderId: number): number => {
  //     const treeMap = getTreeStatesByAccount(mailTreeStateMap, selectedKeys.accountId)?.MailFolderTreeMap;
  //     if (treeMap) {
  //       const folderItem = treeMap[folderId + ''];
  //       const folderKeepPeriod = folderItem?.entry?.keepPeriod;
  //       if (!folderKeepPeriod) {
  //         return keepPeriod;
  //       }
  //       return folderKeepPeriod;
  //     }
  //     return keepPeriod;
  //   },
  //   [mailTreeStateMap]
  // );

  // 邮件删除
  const handleMailDelete = useCallback((id?: string | string[], isThread?: boolean, params?: MailDelete) => {
    dispatch(
      Thunks.deleteMail({
        id,
        showLoading: params?.showLoading ? (params?.showGlobalLoading ? 'global' : true) : false,
        isScheduleSend: params?.isScheduleSend,
        detail: params?.detail,
      })
    );
  }, []);

  // 刷新页面
  const refreshPage = useCallback((showMessage = true) => {
    // 操作超时打点上报
    return promiseIsTimeOut(
      dispatch(
        Thunks.refreshPage({
          refreshPage: showMessage,
        })
      ),
      'pc_refreshPage_timeout',
      {
        from: 'mailColumnEntry',
        showMessage: showMessage,
      }
    );
  }, []);

  // const goTaskMailBox = useCallback(() => {
  //   trackApi.track('pcMail_click_moreTaskMail_mailListPage');
  //   setSelectedKeys({
  //     id: -9
  //   });
  //   doUpdateTaskMailListStateTab(getIn18Text('JINXINGZHONG'));
  // },[]);

  // 处理列表ListModal的变更
  const onListModelChange = useCallback(model => {
    setListModel(model);
  }, []);

  // 右键中的移动邮件按钮事件
  const handleMailMove = useCallback((mid: string | string[], folder: number) => {
    reducer.showMailMoveModal({
      mailId: mid,
      folderId: folder,
    });
  }, []);

  // 判断是否属于逻辑聚合模式
  // const isMerge = useCallback(() => mailLogicStateIsMerge(selectedKeys.id, selectedKeys.accountId, isSearching), [selectedKeys, isSearching]);

  // 记录列表的loading状态
  const searchListLoadLoading = useRef(false);
  // 文件夹切换的时候，重置列表loading
  useEffect(() => {
    searchListLoadLoading.current = false;
  }, [selectedKeys?.id, selectedKeys?.accountId, isSearching, isAdvancedSearch, searchSelected, searchResultObj?.fid, mailIdList]);

  // 请求搜索列表数据
  const loadSearchListData = useCallback(
    ({ startIndex }, noCache: boolean = false) => {
      if (!searchListLoadLoading.current) {
        searchListLoadLoading.current = true;
        if (isAdvancedSearch) {
          return dispatch(
            Thunks.loadAdvanceSearchMailList({
              startIndex,
              noCache,
            })
          ).finally(() => {
            searchListLoadLoading.current = false;
          });
        }
        return dispatch(
          Thunks.loadSearchMailList({
            startIndex,
            noCache,
          })
        ).finally(() => {
          searchListLoadLoading.current = false;
        });
      }
    },
    [isAdvancedSearch]
  );

  // 记录列表的loading状态
  const listLoadLoading = useRef(false);
  // 文件夹切换的时候，重置列表loading
  useEffect(() => {
    listLoadLoading.current = false;
  }, [selectedKeys?.id, selectedKeys?.accountId, mailIdList]);

  // 请求邮件列表数据
  const loadMailListData = useCallback(({ startIndex }, noCache: boolean = false) => {
    if (!listLoadLoading.current) {
      listLoadLoading.current = true;
      return dispatch(
        Thunks.loadMailList({
          startIndex,
          noCache,
        })
      ).finally(() => {
        listLoadLoading.current = false;
      });
    }
  }, []);

  // 新窗口打开
  const openNewWindow = useCallback((ids: string[]) => {
    if (ids && ids.length) {
      dispatch(Thunks.openMailInNewWindow(ids[0]));
    }
  }, []);

  // 处理邮件的激活
  const handleMailActive = useCallback(
    (id: string, index: number, data: MailEntryModel) => {
      trackMailActiveStartRef(id);
      const item = data;
      if (item && item.entry && item.entry.id) {
        if (isSearching) {
          setSearchMail({
            id: id,
            accountId: '',
          });
        } else {
          setSelectedMail({
            id: id,
            accountId: '',
          });
        }
      }
    },
    [isSearching, isLeftRight, isUpDown]
  );

  // const [currentPage, setCurrentPage] = useState2RM('realListCurrentPage', 'doUpdateRealListPage');
  // // 点击新邮件提示bar
  // const handleNewMailBarClick = useCallback(() => {
  //   setIsNoticeNum(0);
  //   // 列表st因为性能优化不再受控，只接受为0的回到顶部操作
  //   // 滑动到制定邮件下方
  //   // const topHeight = getTopMailSumHeight(mailList);
  //   if (!shouldUseRealList || (shouldUseRealList && currentPage === 1)) {
  //     setScrollTop(0);
  //   }
  //   if (shouldUseRealList && currentPage > 1) {
  //     //@ts-ignore
  //     setCurrentPage({ page: 1 });
  //   }
  // }, []);

  // 邮件双击
  const handleMailDoubleClick = useCallback((mail: MailEntryModel) => {
    const { isThread, _account, isTpMail, owner } = mail;
    mailPerfTool.mailContent('window', 'start', { isThread: !!isThread });
    if (systemApi.isElectron()) {
      if (mail.entry.folder === FLOLDER.DRAFT) {
        // setCurrentAccount(mail?._account);
        // 草稿箱双击--再次编辑
        MailApi.doEditMail(mail.id, { draft: true, _account: mail?._account });
      } else {
        // 其他文件夹双击--打开单独窗口读信
        systemApi.createWindowWithInitData(
          { type: 'readMail', additionalParams: { account: _account } },
          { eventName: 'initPage', eventData: { id: mail?.id, accountId: _account, isTpMail, owner }, eventStrData: isThread ? 'isthread' : '' }
        );
      }
    } else {
      window.open(
        `${systemApi.getContextPath()}/readMail/?id=${mail?.id}${_account ? '&account=' + _account : ''}${isThread ? '&isthread=1' : ''}${isTpMail ? '&isTpMail=1' : ''}${
          owner ? '&owner=' + owner : ''
        }`,
        'readMail',
        'menubar=0,scrollbars=1,resizable=1,width=800,height=600'
      );
    }
  }, []);

  const debouceHandleMailDoubleClick = useDebounceForEvent(handleMailDoubleClick, 400, {
    leading: true,
    trailing: false,
  });

  // 未读文件夹下混合文件夹数据 - 三栏
  const mailCardSummary = useCallback((props: MailCardComProps) => {
    const { data } = props;
    const { _account } = data;
    const { title } = data.entry || {};
    let folderTreeMap = {};
    if (_account && mailTreeStateMapRef.current) {
      let TreeMap = getTreeStatesByAccount(mailTreeStateMapRef.current, _account);
      if (TreeMap) {
        folderTreeMap = TreeMap.MailFolderTreeMap;
      }
    }
    return (
      <div
        style={{
          width: '100%',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {title ? (
          <span
            dangerouslySetInnerHTML={{ __html: title }}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          />
        ) : (
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {(typeof window !== 'undefined' ? window : (global as any)).getLocalLabel('WUZHUTI')}
          </span>
        )}
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            paddingLeft: '5px',
            color: `${variables.text3}`,
            display: 'flex',
            flexBasis: '100px',
            flex: '1 0 auto',
            // width: '100px',
            maxWidth: '50%',
          }}
        >
          [
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: `${variables.text3}`,
              display: 'block;',
            }}
          >
            {folderTreeMap ? folderTreeMap[data?.entry?.folder]?.entry?.mailBoxName : ''}
          </span>
          ]
        </span>
      </div>
    );
  }, []);

  // 未读文件夹下混合文件夹数据 - 通栏 通栏的所属文件名称，混合在详情之后
  const mailLongCardDesc = useCallback((props: MailCardComProps) => {
    const { data } = props;
    let brief = '';
    const { _account } = data;
    const entryBrief = data.entry.brief || '';
    try {
      const emptyBriefReg = /^\s*$/;
      if (!entryBrief || emptyBriefReg.test(entryBrief)) {
        // brief = ((typeof window !== "undefined" ? window : global as any).getLocalLabel("\uFF08WUWENZINEI"));
        // 改成一个空格，是因为服务端目前无法配合提供摘要生成中的状态，所以暂时展示这个，让用户体验好一点 SIRIUS-2571
        brief = ' ';
      } else {
        brief = entryBrief;
      }
    } catch (e) {
      console.error('[Error ]mailLongCardDesc error', e);
    }
    let folderTreeMap = {};
    if (_account && mailTreeStateMapRef.current) {
      let TreeMap = getTreeStatesByAccount(mailTreeStateMapRef.current, _account);
      if (TreeMap) {
        folderTreeMap = TreeMap.MailFolderTreeMap;
      }
    }
    return (
      <>
        <span
          dangerouslySetInnerHTML={{ __html: brief }}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        />
        <span style={{ margin: '0px 10px', color: `${variables.text3}`, flexShrink: 0 }}>
          [{folderTreeMap ? folderTreeMap[data?.entry?.folder]?.entry?.mailBoxName : ''}]
        </span>
      </>
    );
  }, []);

  // 普通邮件列表公用属性
  const listCommonAttr = useMemo(() => {
    const summary = (selectedKeys?.id == FLOLDER.UNREAD || isSearching) && !isUpDown ? mailCardSummary : null;
    const desc = (selectedKeys?.id == FLOLDER.UNREAD || isSearching) && isUpDown ? mailLongCardDesc : null;
    return {
      isLeftRight,
      isUpDown,
      activeId: activeIds,
      refreshPage,
      isSearching,
      onDoubleClick: debouceHandleMailDoubleClick,
      onActiveInWindow: openNewWindow,
      listLoading,
      hkDisabled: currentTabId !== '-1' && currentTabId !== '-1/-1',
      mailCardSummary: summary,
      mailCardDesc: desc,
      // onScroll: (param: { scrollTop: number }) => {
      //   // setScrollTop(param.scrollTop);
      // },
      // 用于在onSelect触发前，干预选中的邮件id。并且会保持快捷键model的正确变更
      beforeSelected: (ids: string[], activeIds: string[], curId: string): string[] => {
        const isTask: stringMap = {};
        if (!isSearching) {
          mailDataList.forEach((item: MailEntryModel) => {
            isTask[item.id + ''] = item?.taskInfo?.status === TASK_MAIL_STATUS.PROCESSING;
          });
        } else {
          searchList.forEach((item: MailEntryModel) => {
            isTask[item.id + ''] = item?.taskInfo?.status === TASK_MAIL_STATUS.PROCESSING;
          });
        }
        if (activeIds.length == 1) {
          return activeIds;
        }
        return activeIds.filter(item => !isTask[item]);
      },
      onSelect: (ids: string[], activeIds: string[], curId: string) => {
        setActiveIds(activeIds);
      },
      onUnSelect: (ids: string[], activeIds: string[], curId: string) => {
        setActiveIds(activeIds);
      },
      onActive: handleMailActive,
      // onListModelChange: model => setCanShowMultPanel(model == 'MULTIPE'),
      onContextMenu: (key, data, index, event) => {
        setMailListMenuVisiable(true);
        if (Array.isArray(data)) {
          setCurMenuMailId(data?.map(item => item?.id));
        } else {
          setCurMenuMailId([data?.id]);
        }
      },
    };
  }, [activeIds, isSearching, selectedKeys?.id, isSearching, listLoading, handleMailActive, isLeftRight, isUpDown, currentTabId]);

  // 通栏邮件列表公用属性
  const longListCommonAttr = useMemo(() => {
    const desc = selectedKeys?.id == FLOLDER.UNREAD || isSearching ? mailLongCardDesc : null;
    return {
      isLeftRight,
      isUpDown,
      activeId: activeIds,
      // mailDataList: mailList,
      // isRowLoaded,
      refreshPage,
      // rowCount: listTotal,
      isSearching,
      onDoubleClick: debouceHandleMailDoubleClick,
      onActiveInWindow: openNewWindow,
      // scrollTop,
      listLoading,
      hkDisabled: currentTabId !== '-1' && currentTabId !== '-1/-1',
      mailCardDesc: desc,
      // onScroll: (param: { scrollTop: number }) => {
      //   // setScrollTop(param.scrollTop);
      // },
      // 用于在onSelect触发前，干预选中的邮件id。并且会保持快捷键model的正确变更
      beforeSelected: (ids: string[], activeIds: string[], curId: string): string[] => {
        const isTask: stringMap = {};
        if (!isSearching) {
          mailDataList.forEach((item: MailEntryModel) => {
            isTask[item.id + ''] = item?.taskInfo?.status === TASK_MAIL_STATUS.PROCESSING;
          });
        } else {
          searchList.forEach((item: MailEntryModel) => {
            isTask[item.id + ''] = item?.taskInfo?.status === TASK_MAIL_STATUS.PROCESSING;
          });
        }
        if (activeIds.length == 1) {
          return activeIds;
        }
        return activeIds.filter(item => !isTask[item]);
      },
      onSelect: (ids: string[], activeIds: string[], curId: string) => {
        setActiveIds(activeIds);
      },
      onUnSelect: (ids: string[], activeIds: string[], curId: string) => {
        setActiveIds(activeIds);
      },
      onActive: (id: string, index: number, data: MailEntryModel) => {
        trackMailActiveStartRef(id);
        setActiveIds([id]);
        const tabId = `${id}_${Date.now()}`;
        let title = getIn18Text('WUZHUTI');
        try {
          title = data?.entry?.title.replace(/<b>/g, '').replace(/<\/b>/g, '') || getIn18Text('WUZHUTI');
        } catch (e) {
          console.error('[Error reg]', e);
        }
        const mailTabModel: MailTabModel = {
          id: isColumn ? tabId : id,
          title,
          type: tabType.read,
          closeable: true,
          isActive: true,
          extra: {
            accountId: '',
            originMid: id,
          },
        };
        // 如果是通栏则新开页签
        if (isColumn) {
          dispatch(MailTabThunks.getReadMailTabIdByMid({ mid: id })).then(res => {
            if (res.payload) {
              dispatch(mailTabActions.doChangeCurrentTab(res.payload));
            } else {
              dispatch(Thunks.getMailListRequestParams({ id: id }))
                .then(res => {
                  // console.log('aaaa', res.payload)
                  const readTab: ReadTabModel = {
                    id: tabId,
                    currentMid: id,
                    query: res.payload as any,
                    isThread: res?.payload?.isThread,
                    midList: res?.payload?.midList || [],
                    isSearching,
                    total: isSearching ? searchResultObj.total : mailTotal,
                  };
                  dispatch(mailTabActions.doSetReadTab(readTab));
                  dispatch(mailTabActions.doSetReadTabMidList({ id: tabId, midList: res?.payload?.midList || [] }));
                  dispatch(mailTabActions.doSetReadTabMailList([...readTabMailList]));
                })
                .finally(() => {
                  dispatch(mailTabActions.doSetTab(mailTabModel));
                });
            }
          });
        } else {
          dispatch(mailTabActions.doSetTab(mailTabModel));
        }
      },
      // onListModelChange: model => setCanShowMultPanel(model == 'MULTIPE'),
      onContextMenu: (key, data, index, event) => {
        setMailListMenuVisiable(true);
        if (Array.isArray(data)) {
          setCurMenuMailId(data?.map(item => item?.id));
        } else {
          setCurMenuMailId([data?.id]);
        }
      },
    };
  }, [activeIds, isSearching, listLoading, isLeftRight, isUpDown, currentTabId, isSearching]);

  // 处理列表高度不足的情况
  // 当列表应为高度变化导致内容不足的情况下，主动发起一次请求
  const handleSearchInsufficientHeight = useDebounceForEvent(() => {
    if (searchResultObj?.total && searchList.length < searchResultObj?.total && !shouldUseRealList) {
      loadSearchListData({
        startIndex: searchList.length,
      });
    }
  }, 800);

  // 搜索邮件列表，分栏模式
  const searchMailListElement = useCallback(
    (config: { width: number; height: number }) => {
      const { height = 0, width = 0 } = config || {};
      const commonAttr = isLeftRight || isUpDown ? listCommonAttr : longListCommonAttr;
      return (
        <MailListWrap
          ref={mailListRef}
          {...commonAttr}
          forceShowAttachment={true}
          onScroll={throttleOnScroll}
          scrollTop={scrollTop}
          listHeight={height}
          listWidth={width}
          data={searchList}
          rowCount={searchResultObj.total}
          loadMoreRows={loadSearchListData}
          selectedKeys={searchSelected}
          // 搜索列表-无聚合邮件及相关操作
          isMerging={false}
          listFouceRender={listFouceRender}
          selected={selected}
          listModel={listModel}
          onDelete={handleMailListDelete}
          onListModelChange={onListModelChange}
          useLeftRightHotKey={isUpDown}
          onContentInsufficientHeight={handleSearchInsufficientHeight}
          MailMergeConfig={{ key: 'search', exclude: ['entry.title', 'receiver', 'entry.brief'] }}
        />
      );
    },
    [
      listCommonAttr,
      scrollTop,
      searchList,
      searchResultObj,
      loadSearchListData,
      searchSelected,
      isLeftRight,
      isUpDown,
      longListCommonAttr,
      listFouceRender,
      listModel,
      selected,
    ]
  );

  // todo: 邮件列表-scrolltop问题
  // 处于草稿箱和收件箱的收件人特殊渲染规则
  // const cardFromTitle = useMemo(() => {
  //   return selectedKeys.id == FLOLDER.DRAFT || selectedKeys.id == FLOLDER.SENT
  //     ? ({ data }: { data: MailEntryModel }) => {
  //         return data?.receiver ? <span dangerouslySetInnerHTML={{ __html: renderTitle(data, selectedKeys.id) }} /> : getIn18Text('WUSHOUJIANREN');
  //       }
  //     : null;
  // }, [selectedKeys.id]);

  // 子发件箱的特殊染规则，不再区分发件箱，只区分是否是自己发出的
  // const cardFromTitle = useMemo(() => {
  //   return isSubSenderFolder
  //     ? (props: MailCardComProps) => {
  //         return <SubFolderSender {...props} />;
  //       }
  //     : null;
  // }, [isSubSenderFolder]);

  // 外贸通下发件箱及子文件夹客户标签
  // const customerLabelAfter = useMemo(() => {
  //   // 是外贸通下的发件箱或者子文件夹
  //   if (process.env.BUILD_ISEDM) {
  //     return (props: MailCardComProps) => {
  //       return <CustomerLabelAfterCom {...props} />;
  //     };
  //   } else {
  //     return null;
  //   }
  // }, []);
  // 外贸通环境下，发件箱及子文件夹，需要主动获取一下邮件列表的的收件人的信息
  const emailIdMap = useAppSelector(state => state.contactReducer.emailIdMap);
  const contactMap = useAppSelector(state => state.contactReducer.contactMap);
  const customerMap = useAppSelector(state => state.contactReducer.customerMap);
  useEffect(() => {
    // 仅在，外贸通 && 请求是我发出的邮件的收件人的信息
    if (process.env.BUILD_ISEDM) {
      const requestEmails: string[] = [];
      mailDataList.forEach(m => {
        const { receiver, _account = getMainAccount() } = m || {};
        const accountAlias = systemApi.getCurrentUser(m?._account)?.prop?.accountAlias || [];
        const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];
        const senderEmail = contactApi.doGetModelDisplayEmail(m?.sender?.contact);
        const isSend = m
          ? accountAliasArray.some(account => accountApi.getIsSameSubAccountSync(account, senderEmail)) || accountApi.getIsSameSubAccountSync(senderEmail, m._account)
          : false;
        // 获取是自己发信的收件人的邮箱
        if (isSend) {
          const emails = receiver?.map(item => contactApi.doGetModelDisplayEmail(item.contact)).filter(Boolean);
          if (emails && emails.length) {
            emails.forEach(email => {
              const accountEmailKey = createAccountEmailKey(email, _account);
              const contactId = emailIdMap[accountEmailKey];
              if (contactId) {
                const contactModel = contactMap[contactId];
                const customerModel = customerMap[contactId];
                // 如果灵犀联系人和客户联系人都没有，则请求
                if (!contactModel && !customerModel) {
                  requestEmails.push(email);
                }
              } else {
                requestEmails.push(email);
              }
            });
          }
        }
      });
      if (!!requestEmails.length) {
        const account = mailDataList[0]?._account || getMainAccount();
        refreshContactDataByEmails({ [account]: [...new Set(requestEmails)] }, new Map());
      }
    }
  }, [mailIdList]);

  const mailIdKey = useMemo(() => {
    try {
      if (mailDataList && mailDataList.length) {
        return mailDataList?.map(item => item?.id).join(',');
      }
    } catch (e) {
      console.error(e);
    }
    return '';
  }, [mailDataList]);

  useEffect(() => {
    try {
      if (mailIdKey) {
        performance.timeEnd({
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
  }, [mailIdKey]);

  const throttleOnScroll = useThrottleForEvent(
    (param: { scrollTop: number }) => {
      setScrollTop(param.scrollTop);
      // 距离顶部10px的时候，收起新邮件提醒
      if (param.scrollTop <= getTopMailSumHeight(mailDataList) && isNoticeNum != 0) {
        setIsNoticeNum(0);
      }
    },
    400,
    {
      leading: true,
      trailing: true,
    }
  );

  // 处理邮件列表开始拖拽
  const handleMailListDragStart = useCallback((e, mail: MailEntryModel) => {
    reducer.doMailDragStart({
      mailId: mail.entry.id,
      accountId: mail?._account || '',
      folderId: mail.entry.folder,
    });
  }, []);

  // 处理邮件列表拖拽结束
  const handleMailListDragEnd = useCallback((e, mail: MailEntryModel) => {
    reducer.doMailDragEnd(null);
  }, []);

  // 处理邮件列表的删除事件
  const handleMailListDelete = useCallback((idList: string[]) => {
    if (idList && idList.length) {
      dispatch(Thunks.deleteMailFromHotKey(idList.length === 1 ? idList[0] : idList));
    }
  }, []);

  // 处理列表高度不足的情况
  // 当列表应为高度变化导致内容不足的情况下，主动发起一次请求
  const handleListInsufficientHeight = useDebounceForEvent(() => {
    if (mailDataList.length < mailTotal && !shouldUseRealList) {
      loadMailListData({
        startIndex: mailDataList.length,
      });
    }
  }, 800);

  const defaultListnoMore = useCallback(
    () => (
      <div className="mail-list-topline">
        <span>{getIn18Text('JINZHANSHIZUIJINFHFJDYJ', { count: 3000 })}</span>
      </div>
    ),
    []
  );

  // 邮件列表，分栏模式
  const mailListElement = useCallback(
    (config: { width: number; height: number }) => {
      const { height = 0, width = 0 } = config || {};
      const commonAttr = isLeftRight || isUpDown ? listCommonAttr : longListCommonAttr;
      return (
        <MailListWrap
          ref={mailListRef}
          {...commonAttr}
          useRealList={shouldUseRealList}
          realListClassName="mail-real-list"
          onRealListScroll={(scrollTop: number) => {
            handleRealListScroll(scrollTop);
          }}
          realListPager={
            !isUpDown &&
            !isLeftRight && (
              <div className="mail-long-list-page-wrapper">
                {' '}
                <MailListPager hideOnSinglePage={true} hideQuickJumper={true} showCustomPageSelect={true} />
              </div>
            )
          }
          // cardFromTitle={cardFromTitle}
          // customerLabelAfter={customerLabelAfter}
          scrollTop={scrollTop}
          listHeight={height}
          listWidth={width}
          data={mailDataList}
          rowCount={mailTotal}
          loadMoreRows={loadMailListData}
          notice={notice}
          selectedKeys={selectedKeys}
          selected={selected}
          // isMerging={mailList.length ? mailList[0]?.isThread : false}
          tagName={tagName?.key}
          onScroll={throttleOnScroll}
          listFouceRender={listFouceRender}
          onDragStart={handleMailListDragStart}
          onDragEnd={handleMailListDragEnd}
          onDelete={handleMailListDelete}
          // topExtraData={topExtraData}
          listModel={listModel}
          onListModelChange={onListModelChange}
          // goTaskMailBox={goTaskMailBox}
          useLeftRightHotKey={isUpDown}
          isRefresh={listIsRefresh}
          onContentInsufficientHeight={handleListInsufficientHeight}
          noMoreRender={selected == 'ATTACHMENT' ? defaultListnoMore : undefined}
        />
      );
    },
    [
      scrollTop,
      listCommonAttr,
      mailIdList,
      mailTotal,
      loadMailListData,
      notice,
      selectedKeys,
      `${tagName?.key}${tagName?.accountId}`,
      // topExtraData,
      isLeftRight,
      isUpDown,
      longListCommonAttr,
      mailTagListStore,
      selected,
      // descChecked,
      // attachmentChecked,
      // mailConfigListTightness,
      listFouceRender,
      listModel,
      listIsRefresh,
      shouldUseRealList,
      // cardFromTitle,
      // customerLabelAfter,
    ]
  );

  // 初始化
  useEffect(() => {
    const showNotice: boolean = systemApi.isSysNotificationAvailable() == 'default';
    setNotice(showNotice);
    // 判断是否为智能收件箱模式
    // MailConfApi.isShowAIMailBox()
    //   .then(res => {
    //     if (res === true) {
    //       setIsSmartMailBoxMode(true);
    //       getRecentStrangers();
    //       return;
    //     }
    //     setIsSmartMailBoxMode(false);
    //   })
    //   .catch(err => {
    //     console.log(getIn18Text('HUOQUZHINENGMO'), err);
    //   });
  }, []);

  // 邮件切换
  // useMsgRenderCallback('mailChanged', ev => {
  //   const { eventStrData, eventData } = ev;
  //   if (eventStrData === 'intBoxChanged') {
  //     if (eventData === true) {
  //       setIsSmartMailBoxMode(true);
  //       return;
  //     }
  //     setIsSmartMailBoxMode(false);
  //   }
  // });
  // 陌生人列表发生改变时
  // useEffect(() => {
  //   const id = eventApi.registerSysEventObserver('emailListChange', ev => {
  //     console.log('emailListChange', ev);
  //     getRecentStrangers();
  //   });
  //   return () => {
  //     eventApi.unregisterSysEventObserver('emailListChange', id);
  //   };
  // }, []);
  // const wordSeparator = inWindow() && window?.systemLang === 'en' ? ' ' : '';
  // 列表失败展示
  const ListFailCom = useMemo(
    () => (
      <ListFail
        loading={refreshLoading}
        onRefresh={() => {
          setListLoadIsFail(false);
          setListLoading(true);
          refreshPage(false);
        }}
      />
    ),
    [refreshLoading]
  );

  const ThirdPartyEmptyContent = useMemo(() => {
    return (
      <ListEmpty
        name={getIn18Text('XITONGZHENGZAITONGBYJ，QNSD')}
        showLogo={!isLeftRight && !isUpDown}
        onRefresh={() => {
          refreshPage(false);
        }}
        btnRender={() => {
          return (
            <Button btnType="primary" style={{ marginTop: '8px' }}>
              刷新
            </Button>
          );
        }}
      />
    );
  }, [selectedKeys?.id, isLeftRight, isUpDown]);

  // 列表为空展示
  const ListEmptCom = useMemo(
    () => {
      // 如果是星标联系人，展示对应的空态
      if (!isLeftRight && !isUpDown && selectedKeys?.id == FLOLDER.STAR && !isSearching) {
        return <StarFolderEmptyContent />;
      }
      // 如果当前文件夹类型为三方挂载邮箱，展示对应的空态
      if (selectedKeys.authAccountType != null && selectedKeys?.authAccountType != '0' && !isSearching) {
        return ThirdPartyEmptyContent;
      }

      return (
        <ListEmpty
          name={empryFolderTip}
          selected={selected}
          showLogo={!isLeftRight && !isUpDown}
          onRefresh={() => {
            // if (selected === 'PREFERRED') {
            //   setSelected('ALL');
            // } else {
            //   setFreshLoading(true);
            //   refreshPage(false);
            // }
            setFreshLoading(true);
            refreshPage(false);
          }}
        />
      );
    },
    // [empryFolderName, selected, isLeftRight]
    [empryFolderTip, isLeftRight, selectedKeys?.id, selected, isUpDown, isSearching]
  );

  const ListTipCom = useMemo(() => (listLoadIsFail ? ListFailCom : ListEmptCom), [listLoadIsFail, ListFailCom, ListEmptCom]);

  const MailListCom = useCallback(
    (config: { height: number; width: number }) => (
      //@ts-ignore
      <div className="m-list" style={process.env.BUILD_ISELECTRON && shouldUseRealList ? { '-webkit-app-region': 'unset' } : {}}>
        <MailWrap
          visible={mailListMenuVisiable}
          setVisible={setMailListMenuVisiable}
          selectedKeys={selectedKeys}
          selected={selected}
          isAdvancedSearch={isAdvancedSearch}
          isSearching={isSearching}
          onMove={handleMailMove}
          onDelete={handleMailDelete}
          activeMailId={curMenuMailId}
          openNewWindow={openNewWindow}
        >
          {isSearching ? searchMailListElement(config) : mailListElement(config)}
        </MailWrap>
      </div>
    ),
    [isSearching, searchMailListElement, mailListElement, mailListMenuVisiable, selectedKeys, selected, isAdvancedSearch, curMenuMailId, shouldUseRealList]
  );

  // const closeAutoReplyTips = useCallback((e: any) => {
  //   setAutoReplyTip(false);
  //   inWindow() && window.localStorage.setItem('autoReplyTip', '1');
  //   e.stopPropagation();
  // }, []);

  // const closeAutoReply = useCallback(() => {
  //   // setCurrentAccount();
  //   autoReplyApi
  //     .updateMailRulesByAutoReply({
  //       ...autoReplyDetail,
  //       disabled: true,
  //     })
  //     .then(suc => {
  //       if (suc) {
  //         // 仅仅临时关闭
  //         setAutoReplyTip(false);
  //         updateAutoReplyDetail({
  //           ...autoReplyDetail,
  //           disabled: true,
  //         });
  //         SiriusMessage.success({
  //           content: getIn18Text('YIGUANBIZIDONG'),
  //         });
  //       }
  //     })
  //     .catch(() => {
  //       SiriusMessage.error({
  //         content: getIn18Text('GUANBIZIDONGHUI11'),
  //       });
  //     });
  // }, [autoReplyDetail]);

  // const AutoReplyMailListTip = useMemo(() => {
  //   // console.log('autoReplyDetail=======', autoReplyDetail);
  //   const tips = inWindow() && window.localStorage.getItem('autoReplyTip');
  //   if (Object.keys(autoReplyDetail).length > 0 && !autoReplyDetail.disabled && !tips) {
  //     // setAutoReplyTip(true);
  //     return (
  //       <div className="u-auto">
  //         <div className="u-auto-title">{getIn18Text('DANGQIANYIQIYONG')}</div>
  //         <div style={{ display: 'flex' }}>
  //           <span className="u-auto-text" onClick={closeAutoReply}>
  //             {getIn18Text('GUANBIZIDONGHUI')}
  //           </span>
  //           <div className="u-auto-btn" onClick={closeAutoReplyTips}></div>
  //         </div>
  //       </div>
  //     );
  //   }
  //   // setAutoReplyTip(false);
  //   return <></>;
  // }, [autoReplyDetail, closeAutoReply]);

  // useEffect(() => {
  //   const tips = inWindow() && window.localStorage.getItem('autoReplyTip');
  //   if (Object.keys(autoReplyDetail).length > 0 && !autoReplyDetail.disabled && !tips) {
  //     setAutoReplyTip(true);
  //   } else {
  //     setAutoReplyTip(false);
  //   }
  // }, [autoReplyDetail]);

  // const DeleteFolderTip = useMemo(() => {
  //   return (
  //     <div className="u-alert">
  //       {getIn18Text('YISHANCHUYOUJIAN')}
  //       {wordSeparator}
  //       {getKeepPeriodByFolderId(4)}
  //       {wordSeparator}
  //       {getIn18Text('TIANHOUZIDONGCHE')}
  //     </div>
  //   );
  // }, [getKeepPeriodByFolderId]);

  // const SpamFolderTip = useMemo(() => {
  //   return (
  //     <div className="u-alert">
  //       {getIn18Text('LAJIYOUJIAN')}
  //       {wordSeparator}
  //       {getKeepPeriodByFolderId(5)}
  //       {wordSeparator}
  //       {getIn18Text('TIANHOUZIDONGSHAN')}
  //     </div>
  //   );
  // }, [getKeepPeriodByFolderId]);

  // const AdFolderTip = useMemo(() => {
  //   return inWindow() ? (
  //     <div className="u-alert">
  //       {getIn18Text('GUANGGAOYOUJIAN')}
  //       {wordSeparator}
  //       {getKeepPeriodByFolderId(7)}
  //       {wordSeparator}
  //       {getIn18Text('TIANHOUZIDONGSHAN')}
  //     </div>
  //   ) : null;
  // }, [getKeepPeriodByFolderId]);

  // // 聚合邮件构建中tip
  // const ThreadMailBuildingTip = useMemo(() => {
  //   return <div className="u-alert">{getIn18Text('JUHEYOUJIANSHU')}</div>;
  // }, []);

  // 星标联系人构建中tip
  // const StarContactBuildingTip = useMemo(() => {
  //   return <div className="u-alert">{getIn18Text('WANGLAIYOUJIANBUILDTIP')}</div>;
  // }, []);

  const realListRef = useRef<HTMLDivElement>(null);
  const getRealListScrollEl = () => {
    if (realListRef && realListRef.current) {
      return realListRef.current;
    }
    return null;
  };

  const handleRealListScrollChange = useThrottleForEvent(
    (_: React.UIEvent<HTMLDivElement, UIEvent>) => {
      if (!shouldUseRealList) return;
      const el = getRealListScrollEl();
      if (el) {
        let currentScrollTop = el.scrollTop;
        setScrollTop(currentScrollTop);
      }
    },
    500,
    { trailing: true }
  ) as unknown as React.UIEventHandler<HTMLDivElement>;

  useEffect(() => {
    if (!shouldUseRealList) return;
    if (scrollTop === 0) {
      handleRealListScroll();
    }
  }, [scrollTop]);

  const handleRealListScroll = (scrollTop?: number) => {
    if (!shouldUseRealList) return;
    const el = getRealListScrollEl();
    if (el) {
      el.scrollTop = scrollTop || 0;
    }
  };

  const autoSizeElement = useMemo(() => {
    return (
      <div style={{ width: '100%', flex: '1', minHeight: 0 }} onScroll={handleRealListScrollChange}>
        <AutoSizer style={{ width: '100%', height: '100%' }}>
          {({ height, width }) => {
            // 如果无法检测到窗体内容的高度，则默认给1000保证展示
            let max = 1000;
            try {
              max = window?.innerHeight || 1000;
            } catch (e) {
              console.log('[ window.innerHeight Error]', e);
            }
            const resHeight = height > max ? max : height;
            const listElement = havingContent ? MailListCom({ width, height: resHeight }) : ListTipCom;
            // 实体列表，也需要测量宽度了
            return shouldUseRealList ? (
              <div className={'m-list-wrapper' + `${platform.os === 'windows' ? ' win' : ''}`} ref={realListRef} style={{ height: '100%', overflow: 'auto' }}>
                {listElement}
              </div>
            ) : (
              listElement
            );
          }}
        </AutoSizer>
      </div>
    );
  }, [havingContent, MailListCom, ListTipCom, shouldUseRealList]);

  const handleEmlDrop = useCallback(
    event => {
      event.preventDefault();
      const uploadFileList = getEmlFileFromDragTrans(event);
      if (uploadFileList.length) {
        importMails({ fid: Number(selectedKeys.id), fileList: uploadFileList, _account: selectedKeys.accountId }, true).then(() => {
          // 刷新当前邮件列表
          setTimeout(() => {
            dispatch(
              Thunks.refreshMailList({
                noCache: true,
                showLoading: false,
                // accountId: selectedKeys?.accountId,
              })
            );
          }, 1500);
        });
      }
      reducer.updateOuterFileDragLeave({});
    },
    [importMails, selectedKeys]
  );

  /**
   * 只有主账号-才显示对应的拖放界面
   */
  const mailListDropPanel = useMemo(() => {
    return isDragModel == 'eml' && showMailListDropPanel ? (
      <div className="mailList-eml-dp-wrap" onDrop={handleEmlDrop}>
        <div className="eml-dp-border">
          <span>
            {getIn18Text('SONGKAIDAORUDAO')}
            {curFolderName}
          </span>
        </div>
      </div>
    ) : (
      <></>
    );
  }, [isDragModel, curFolderName, selectedKeys?.accountId, showMailListDropPanel]);

  // 防抖延迟关闭eml拖拽模式 - 后触发
  const debounceCloseEmlDragModel = useDebounceForEvent(
    () => {
      emlOverLock.current = true;
      setShowMailListDropPanel(false);
    },
    200,
    {
      leading: false,
    }
  );

  /**
   * 处理eml文件dragover
   * 当eml文件处于列表的时候才展示蒙层
   */
  const handleOuterDragOver = useCallback((event: React.DragEvent) => {
    // 非拖拽模式中才触发
    if (isDragModel !== 'eml' && emlOverLock.current) {
      // 检测到包含eml文件才可以上传
      let couldDrop = dragTransFileHasEml(event);
      // 在此处开启遮罩状态
      if (couldDrop) {
        emlOverLock.current = false;
        setShowMailListDropPanel(true);
      }
    }
    // debouce关闭状态
    debounceCloseEmlDragModel();
  }, []);

  const throttleHandleOuterDragOver = useThrottleForEvent(handleOuterDragOver, 100);

  const FilterTabElement = useMemo(() => {
    return <FilterTab />;
  }, []);

  // const logicshowStarContactBuildingTip = useMemo(() => {
  //   return showStarContactBuildingTip && folderIdIsContact(selectedKeys?.id) && !isSearching;
  // }, [showStarContactBuildingTip, selectedKeys?.id, isSearching]);

  return (
    <>
      {showLock ? (
        safetyLockEl
      ) : (
        <div
          className="m-list-container ant-allow-dark"
          style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          onDragOverCapture={event => {
            event.persist();
            throttleHandleOuterDragOver(event);
          }}
        >
          {/* 顶部tab切换抽离出去 */}
          {FilterTabElement}
          {/* todo: 下面的tips需要抽离到一个单独的组件中 */}
          {/* {!isSearching && autoReplyTip ? AutoReplyMailListTip : ''} */}
          {/* {!isSearching && selectedKeys && selectedKeys.id == FLOLDER.DELETED ? DeleteFolderTip : ''} */}
          {/* {!isSearching && selectedKeys && selectedKeys.id == FLOLDER.SPAM ? SpamFolderTip : ''} */}
          {/* {!isSearching && selectedKeys && selectedKeys.id == FLOLDER.ADVITISE ? AdFolderTip : ''} */}
          {/* {isMerge() && showThreadBuildingTip ? ThreadMailBuildingTip : ''} */}
          {/* {logicshowStarContactBuildingTip ? StarContactBuildingTip : <></>} */}
          {/* 邮件列表顶部提示业务容器 */}
          <MailListTips />
          {/* 虚拟列表 */}
          {autoSizeElement}
          {/* 实体分页列表 */}
          {shouldUseRealList && isLeftRight && (
            <div className="mail-left-right-list-page-wrapper">
              <MailListPager
                showLessItems={true}
                simple={true}
                showCustomPageSizeSelect={true}
                hidePaginationItem={true}
                showCustomPageSelect={true}
                style={{ padding: '4px 12px' }}
              />
            </div>
          )}
          {/* eml拖拽上传容器 */}
          {mailListDropPanel}
        </div>
      )}
      {showListBackTop && (
        <ListBackTop
          style={{ bottom: shouldUseRealList ? '100px' : '' }}
          onClick={() => {
            handleRealListScroll();
            setScrollTop(0);
          }}
        />
      )}
    </>
  );
};
export default MailColumnEntry;
