/* eslint-disable max-statements */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-use-before-define */
import loadable from '@loadable/component';
import React, { useState, useEffect, useRef, ReactNode, useMemo } from 'react';
import { ConfigProvider, Button, Checkbox } from 'antd';
import { AliveScope } from 'react-activation';
import zhCN from 'antd/lib/locale/zh_CN';
import qs from 'querystring';
// eslint-disable-next-line import/no-extraneous-dependencies
import { navigate, useLocation } from '@reach/router';
import { FIR_SIDE } from '@web-common/utils/constant';
import { useAppDispatch, useAppSelector, useActions } from '@web-common/state/createStore';
import { getMenuSettingsAsync, getModuleDataPrivilegeAsync, getPrivilegeAsync } from '@web-common/state/reducer/privilegeReducer';
import { getCompanyCheckRules } from '@web-common/state/reducer/customerReducer';
import TopNotification from '@web-common/components/TopNotification';
import { SendedMarketing } from '@web-edm/sendedMarketing';
import { TaskDiagnosisEntry } from '@web-edm/TaskDiagnosis/TaskDiagnosisEntry';
import AddressBookNewIndex from '@web-edm/addressBook/pages/index_new/index_new';
import { edmDataTracker, EDMPvType, EdmDraftListOperateType } from '@web-edm/tracker/tracker';
import { autoMarketTracker } from '@web-edm/autoMarket/tracker';
import { EDMAPI, filterTree, guardString, ShowWeeklyTaskPages } from '@web-edm/utils';
// import { MarketingModalList } from '@web-edm/components/MarketingModalList/marketingModalList';
import {
  apiHolder,
  apis,
  MailTemplateApi,
  UpdateTimeProps,
  FacebookApi,
  FbBindStatus,
  EventApi,
  SystemEvent,
  WarmUpAccountSource,
  getIn18Text,
  ErrorReportApi,
} from 'api';
import useCountDown from '@web-common/hooks/useCountDown';
import message from '@web-common/components/UI/Message/SiriusMessage';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { FacebookActions } from '@web-common/state/reducer';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import { AIHosting } from '@web-edm/AIHosting';
import style from '@web-edm/edm.module.scss';
// import MenuItem from 'antd/lib/menu/MenuItem';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import { DaohangFajian, TongyongYouxiang4, TongyongShuju, TongyongWhatsApp, TongyongWhatsAppB, TongyongShijianMianxing } from '@sirius/icons';
import { ReactComponent as AddressBook } from '@web-common/images/icons/address_book.svg';
import { ReactComponent as Email } from '@web-common/images/icons/email.svg';
import { ReactComponent as Message } from '@web-common/images/icons/message.svg';
import { ReactComponent as Facebook } from '@web-common/images/icons/facebook.svg';
import FacebookMessage from '../SNS/Facebook/message';
import snsStyle from '@/components/Layout/SNS/snsIndex.module.scss';
import { getTransText } from '@/components/util/translate';
import { FoldableMenu } from '@/components/UI/MenuIcon/FoldableMenu';
import { ExpandableSideContent } from '@/layouts/Main/expandableSideContent';
// import Extension from '@/components/Layout/Customer/Extension/Index';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import { SiriusPageProps } from '@/components/Layout/model';
import { OffsiteModal } from '../SNS/Facebook/components/offsiteModal';
import { AccManageModal } from '../SNS/Facebook/components/accManageModal';
import { usePermissionCheck, NoPermissionPage } from '@/components/UI/PrivilegeEnhance';
import { ReactComponent as Error } from '@/images/icons/alert/error.svg';
import { ReactComponent as Info } from '@/images/icons/edm/info-blue-fill.svg';
import { ReactComponent as Warning } from '@/images/icons/alert/warn.svg';
import { ReactComponent as Success } from '@/images/icons/alert/success.svg';
import { ReactComponent as IconCustomerSub } from '../../../../../web-entry-wm/src/layouts/config/svg/v2/customersub.svg';

import { ReactComponent as IconFacebook } from '../../../../../web-entry-wm/src/layouts/config/svg/facebook.svg';
import { ReactComponent as IconTools } from '../../../../../web-entry-wm/src/layouts/config/svg/tools.svg';

import CustomerManage from '../../../../../web-entry-ff/src/views/customer/customers/index';
import CustomerGradeManage from '../../../../../web-entry-ff/src/views/customer/levelAdmin';
import GlobalProvider from '../../../../../web-entry-ff/src/layouts/WmMain/globalProvider';

const Draft = loadable(() => import('@web-edm/draft/draft'));
const EdmDetail = loadable(() => import('@web-edm/detail/detailV2'));
const Contact = loadable(() => import('@web-edm/contact/contact'));
const MarketingRoot = loadable(() => import('@web-edm/send/marketingRoot'));
const AiHostingWrite = loadable(() => import('@web-edm/AIHosting/AiHostingWrite/aiHostingWrite'));
const AutoMarketTask = loadable(() => import('@web-edm/autoMarket/task'));
const AutoMarketTaskDetail = loadable(() => import('@web-edm/autoMarket/taskDetail'));
const AutoMarketTaskEdit = loadable(() => import('@web-edm/autoMarket/taskEdit'));
const MailTemplate = loadable(() => import('@web-edm/mailTemplate/indexV2'));
const TemplateAddModal = loadable(() => import('@web-edm/mailTemplate/template/index'));
const AddressBookPublicHistoryIndex = loadable(() => import('@web-edm/addressBook/pages/publicHistory'));
const AddressBookPublicHistoryDetail = loadable(() => import('@web-edm/addressBook/pages/publicHistory/detail'));
const AddressContactListPage = loadable(() => import('@web-edm/addressBook/pages/address-contact-list/index'));
const AddressBookGroupDetail = loadable(() => import('@web-edm/addressBook/pages/groupDetail'));
const AddressBookSourceDetail = loadable(() => import('@web-edm/addressBook/pages/sourceDetail'));
const AddressHistoryIndex = loadable(() => import('@web-edm/addressBook/pages/history/index'));
const AddressHistoryDetail = loadable(() => import('@web-edm/addressBook/pages/history/detail'));
const AddressBookOpenSea = loadable(() => import('@web-edm/addressBook/pages/openSea/index'));
const Blacklist = loadable(() => import('@web-edm/blacklist/blacklist'));
const Extension = loadable(() => import('@/components/Layout/Customer/Extension/Index'));
const WhatsAppAiSearch = loadable(() => import('@/components/Layout/SNS/WhatsApp/search/search'));
const WhatsAppJob = loadable(() => import('@/components/Layout/SNS/WhatsApp/job/job'));
const WhatsAppJobV2 = loadable(() => import('@/components/Layout/SNS/WhatsAppV2/job/job'));
const WhatsAppJobEdit = loadable(() => import('@/components/Layout/SNS/WhatsApp/job/jobEdit'));
const WhatsAppJobEditV2 = loadable(() => import('@/components/Layout/SNS/WhatsAppV2/job/jobEdit'));
const WhatsAppJobReport = loadable(() => import('@/components/Layout/SNS/WhatsApp/job/jobReport'));
const WhatsAppJobReportV2 = loadable(() => import('@/components/Layout/SNS/WhatsAppV2/job/jobReport'));
const WhatsAppMessage = loadable(() => import('@/components/Layout/SNS/WhatsApp/message/message'));
const WhatsAppMessageV2 = loadable(() => import('@/components/Layout/SNS/WhatsAppV2/message/message'));
const WhatsAppTemplate = loadable(() => import('@/components/Layout/SNS/WhatsApp/template/template'));
const WhatsAppTemplateV2 = loadable(() => import('@/components/Layout/SNS/WhatsAppV2/template/template'));
const WhatsAppRegisterV2 = loadable(() => import('@/components/Layout/SNS/WhatsAppV2/register/register'));
const WhatsAppStatistic = loadable(() => import('@/components/Layout/SNS/WhatsApp/statistic/index'));
const WhatsAppStatisticV2 = loadable(() => import('@/components/Layout/SNS/WhatsAppV2/statistic/index'));
const WaProviderV2 = loadable(() => import('../SNS/WhatsAppV2/context/WaContextV2'));
const WaAdContainerV1 = loadable(() => import('../SNS/BizWhatsApp/WaAdContainerV1'));
const WaAdContainerV2 = loadable(() => import('../SNS/BizWhatsApp/WaAdContainerV2'));
const WaAllotContainerV2 = loadable(() => import('../SNS/BizWhatsApp/WaAllotContainerV2'));
const BspContainer = loadable(() => import('@/components/Layout/SNS/BizWhatsApp/BspContainer'));
const PersonalWhatsapp = loadable(() => import('@/components/Layout/SNS/WhatsApp/personalJobWhatsapp/index'));
const PersonalJobWhatsApp = loadable(() => import('@/components/Layout/SNS/WhatsApp/personalJobWhatsapp'));
const PersonalJobWhatsAppDetail = loadable(() => import('@/components/Layout/SNS/WhatsApp/personalJobWhatsapp/detail'));
const MultiAccountMessage = loadable(() => import('@/components/Layout/SNS/MultiAccount/message'));
const MarketBulk = loadable(() => import('@/components/Layout/SNS/MultiAccount/marketingBulk'));
const CreateMarketBulk = loadable(() => import('@/components/Layout/SNS/MultiAccount/marketingBulk/createTask'));
const MarketBulkDetail = loadable(() => import('@/components/Layout/SNS/MultiAccount/marketingBulk/detail'));
const MarketSearchWhatsApp = loadable(() => import('@/components/Layout/SNS/MultiAccount/searchWhatsApp'));
const MarketWaGroupHistory = loadable(() => import('@/components/Layout/SNS/MultiAccount/GroupHistory'));
const JoinGroupDetail = loadable(() => import('@/components/Layout/SNS/MultiAccount/GroupHistory/JoinGroupDetail'));
// const FacebookMessage = loadable(() => import('@/components/Layout/SNS/Facebook/message'));
const FackbookPosts = loadable(() => import('@/components/Layout/SNS/Facebook/posts'));
const FacebookPages = loadable(() => import('@/components/Layout/SNS/Facebook/mainPages/mainPages'));
const DataView = loadable(() => import('@web-edm/AIHosting/DataView'));
const MarketingRecords = loadable(() => import('@web-edm/AIHosting/MarketingRecords'));
const ContactDetail = loadable(() => import('@web-edm/AIHosting/ContactDetail/contactDetail'));
const WarmUpPage = loadable(() => import('@web-edm/senderRotate/warmUpPage'));
const SenderRotateList = loadable(() => import('@web-edm/SenderRotateList'));

// eslint-disable-next-line camelcase
const last_update_template_time_for_list = 'last_update_template_time_for_list';

const templateApi = apiHolder.api.requireLogicalApi(apis.mailTemplateImplApi) as MailTemplateApi;
const storeApi = apiHolder.api.getDataStoreApi();
const facebookApi = apiHolder.api.requireLogicalApi(apis.facebookApiImpl) as unknown as FacebookApi;
const systemApi = apiHolder.api.getSystemApi();
const AuthorizeKey = `AuthorizeCode-${systemApi.getCurrentUser()?.accountName}`;
const WhatsAppAgreementCheckedKey = `WhatsAppAgreementChecked-${systemApi.getCurrentUser()?.accountName}`;
const eventApi = apiHolder.api.getEventApi() as EventApi;
const sentryReportApi = apiHolder.api.requireLogicalApi(apis.errorReportImpl) as unknown as ErrorReportApi;
const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';

interface MenuItemData {
  key: string;
  title: string;
  label: string;
  icon?: React.ReactNode;
  hidden?: boolean;
  children?: Array<MenuItemData>;
}

const WillOfflineTag = () => (
  <Tooltip title="WhatsApp个人营销功能已经搬家至WhatsApp群发（群发功能请联系销售了解），个人营销功能将于近期下线，给各位用户带来的不便敬请谅解。">
    <div className={style.willOfflineTag}>
      <TongyongShijianMianxing />
    </div>
  </Tooltip>
);
const edmMenuData = [
  {
    title: '营销联系人',
    key: 'addressBook',
    label: 'ADDRESS_BOOK',
    icon: <AddressBook />,
    children: [
      {
        title: '营销联系人',
        key: 'addressBookIndex',
        label: 'ADDRESS_BOOK_LIST',
      },
      {
        key: 'contact',
        title: getIn18Text('YINGXIAOTONGJI'),
        label: 'MARKET_DATA_STAT',
      },
    ],
  },
  {
    title: getIn18Text('YOUJIANYINGXIAO'),
    key: 'edm',
    label: 'EDM',
    icon: <Email />,
    children: [
      // {
      //   title: '多域名营销',
      //   key: 'senderRotateList',
      //   label: 'EDM_MULTI_ACCOUNT_INFO',
      // },
      {
        // title: getIn18Text('FAJIANRENWU'),
        title: <TaskDiagnosisEntry title={getIn18Text('FAJIANRENWU')} />,
        key: 'index',
        label: 'EDM_SENDBOX',
      },
      {
        key: 'drafts',
        title: getIn18Text('CAOGAOLIEBIAO'),
        label: 'EDM_DRAFT_LIST',
      },
      {
        title: getIn18Text('YOUXIANGYURE'),
        key: 'warmup',
        label: 'EDM_SENDBOX',
      },
      // {
      //   key: 'autoMarketTask',
      //   title: getIn18Text('ZIDONGHUAYINGXIAO'),
      //   label: 'EDM_SENDBOX',
      // },
      {
        key: 'mailTemplate',
        title: '内容库',
        label: 'EDM_TEMPLATE',
      },
      {
        title: getIn18Text('YINGXIAOTUOGUAN'),
        key: 'aiHosting',
        label: 'EDM_SENDBOX', // 有营销操作权限的就可以查看，添加，移除任务
        newBadge: true,
      },
    ],
  },
  {
    title: 'WhatsApp群发',
    key: 'multiAccount',
    label: 'WHATSAPP_GROUP_SEND',
    icon: <Message />,
    children: [
      {
        title: '消息',
        key: 'multiAccountMessage',
        label: 'WHATSAPP_GROUP_MSG',
        // lebel 不配置就存在，配置错误不不会展示
      },
      {
        title: '营销群发',
        key: 'marketBulk',
        label: 'WHATSAPP_MARKETING_GROUP_SEND',
      },
      {
        title: '营销搜索',
        key: 'marketSearchWhatsApp',
        label: 'WHATSAPP_MARKETING_SEARCH',
      },
      {
        title: '营销加群',
        key: 'marketWaGroupHistory',
        label: 'WHATSAPP_MARKETING_ADD_GROUP',
      },
    ],
  },
  {
    title: getTransText('WAGERENYINGXIAO'),
    key: 'personalWhatsApp',
    // label: 'PERSONALWHATSAPP',
    icon: <Message />,
    children: [
      {
        title: getTransText('WAGERENHAOXIAOXI'),
        key: 'pernsonalWhatsapp',
        // label: 'WHATSAPP_PERSONAL_MSG',
        // icon: <MenuIcons.WhatsAppMessageMenuIcon />,
        subffix: () => <WillOfflineTag />,
      },
      {
        title: getTransText('WAGERENQUNFARENWU'),
        key: 'pernsonalJobWhatsApp',
        // label: 'WHATSAPP_PERSONAL_SEND_TASK',
        // icon: <MenuIcons.SendBoxMenuIcon />,
        subffix: () => <WillOfflineTag />,
      },
    ],
  },
  {
    title: getTransText('WASHANGYEYINGXIAO'),
    key: 'whatsApp',
    label: 'WHATSAPP',
    icon: <Message />,
    children: [
      {
        title: getTransText('WASHANGYEXIAOXI'),
        key: 'whatsAppMessage',
        label: 'WHATSAPP_MSG',
      },
      // {
      //   title: getTransText('EngineSearching') || '',
      //   key: 'whatsAppAiSearch',
      //   label: 'WHATSAPP_SEND_TASK',
      //   icon: <MenuIcons.AISearchIcon />,
      //   subffix() {
      //     return <span className={style.betaIcon}>BETA</span>;
      //   }
      // },
      {
        title: getTransText('WASHANGYEQUNFARENWU'),
        key: 'whatsAppJob',
        label: 'WHATSAPP_SEND_TASK',
      },
      {
        title: getIn18Text('XIAOXIMOBAN'),
        key: 'whatsAppTemplate',
        label: 'WHATSAPP_MSG_TPL_SETTING',
      },
      {
        title: getIn18Text('SHUJUTONGJI'),
        key: 'whatsAppStatistic',
        label: 'WHATSAPP_DATA_STAT',
      },
    ],
  },
  {
    title: getTransText('FACEBOOKYINXIAO'),
    key: 'facebook',
    label: 'FACEBOOK',
    icon: <Facebook />,
    children: [
      {
        title: getTransText('wodezhuyeguanli'),
        key: 'facebookPages',
        label: 'FACEBOOK_MY_MAIN_PAGE',
      },
      {
        title: getTransText('wodetieziguanli'),
        key: 'facebookPosts',
        label: 'FACEBOOK_MY_POST',
      },
      {
        title: getTransText('facebookxiaoxi'),
        key: 'facebookMessage',
        label: 'FACEBOOK_MSG',
      },
    ],
  },
];

const getDefaultPage = (menuData: MenuItemData[]): string => {
  const menu = menuData[0];

  if (!menu) return '';

  if (menu.children?.length) {
    return getDefaultPage(menu.children);
  }
  return menu.key;
};

const edmMenuDataV2 = [
  {
    title: getIn18Text('DINGYUEGUANLI'),
    key: 'subscribe_manage',
    label: 'SUBSCRIBE_MANAGE',
    icon: <IconCustomerSub color="#6F7485" />,
    trackEventId: 'client_2_subscribe_manage',
    children: [
      {
        title: getIn18Text('DINGYUEKEHULIEBIAO'),
        key: 'customerBookList',
        label: 'SUBSCRIBE_CUSTOMER_LIST',
        trackEventId: 'client_3_subscribe_customer_list',
        subset: ['customerGrade'],
      },
    ],
  },
  {
    title: getIn18Text('ZIDONGKAIFA'),
    key: 'auto_exloit',
    label: 'AUTO_EXLOIT',
    icon: <DaohangFajian color="#6F7485" />,
    trackEventId: 'client_2_automatic_develop',
    children: [
      {
        title: getIn18Text('XINJIANYINGXIAOTUOGUAN'),
        key: 'aiHostingNew',
        label: 'NEW_MARKETING_TUTELAGE_TASK',
        trackEventId: 'client_3_add_Marketing_tasks',
      },
      {
        title: getIn18Text('YINGXIAOTUOGUANRENWU'),
        key: 'aiHosting',
        label: 'MARKETING_TUTELAGE_TASK',
        trackEventId: 'client_3_Marketing_tasks',
      },
    ],
  },
  {
    title: getIn18Text('SHOUDONGKAIFA'),
    key: 'manual_exloit',
    label: 'MANUAL_EXLOIT',
    icon: <TongyongYouxiang4 color="#6F7485" />,
    trackEventId: 'client_2_Manual_develop',
    children: [
      {
        title: getIn18Text('XINJIANFAJIANRENWU'),
        key: 'write',
        label: 'NEW_EDM_SEND_TASK',
        trackEventId: 'client_3_add_Send_task',
      },
      {
        title: <TaskDiagnosisEntry />,
        key: 'index',
        label: 'EDM_SENDBOX',
        trackEventId: 'client_3_task_list',
      },
      {
        title: getIn18Text('YOUXIANGYURE'),
        key: 'warmup',
        label: 'EDM_MULTI_ACCOUNT_WARMUP',
        trackEventId: 'client_3_Mailbox_warmup',
      },
      // {
      //   title: '多域名营销',
      //   key: 'senderRotateList',
      //   label: 'EDM_MULTI_ACCOUNT_INFO',
      //   trackEventId: 'client_3_Multi_domain_develop',
      // },
    ],
  },
  {
    title: '营销联系人',
    key: 'market_data_stat',
    label: 'MARKET_DATA_STAT',
    icon: <TongyongShuju color="#6F7485" />,
    trackEventId: 'client_2_marketing_statistics',
    children: [
      {
        title: '营销联系人',
        key: 'addressBookIndex',
        label: 'ADDRESS_BOOK',
        trackEventId: 'client_3_Marketing_address_book',
      },
      {
        title: getIn18Text('SHUJUTONGJI'),
        key: 'contact',
        label: 'EDM_DATA_STAT',
        trackEventId: 'client_3_Email_Statistics',
      },
    ],
  },
  {
    title: getIn18Text('YOUXIANGKAIFAFUZHUGONG'),
    key: 'email_aid_tool',
    label: 'EMAIL_AID_TOOL',
    icon: <IconTools />,
    trackEventId: 'client_2_Email_develop_Auxiliary_tools',
    children: [
      // {
      //   title: getIn18Text('ZIDONGHUAYINGXIAO'),
      //   key: 'autoMarketTask',
      //   label: 'AUTO_MARKETING',
      //   trackEventId: 'client_3_Automated_marketing',
      // },
      {
        title: '内容库',
        key: 'mailTemplate',
        label: 'EDM_TEMPLATE',
        trackEventId: 'client_3_Email_template',
      },
      {
        title: getIn18Text('CAOGAOLIEBIAO'),
        key: 'drafts',
        label: 'EDM_DRAFT_LIST',
        trackEventId: 'client_3_draft_list',
      },
    ],
  },
  {
    title: 'WhatsApp群发',
    key: 'multiAccount',
    label: 'WHATSAPP_GROUP_SEND',
    icon: <Message />,
    children: [
      {
        title: '消息',
        key: 'multiAccountMessage',
        label: 'WHATSAPP_GROUP_MSG',
        trackEventId: 'WA_Chats_enter_point_click',
        // lebel 不配置就存在，配置错误不不会展示
      },
      {
        title: '营销群发',
        key: 'marketBulk',
        label: 'WHATSAPP_MARKETING_GROUP_SEND',
        trackEventId: 'WA_Bulk_Sender__enter_point_click',
      },
      {
        title: '营销搜索',
        key: 'marketSearchWhatsApp',
        label: 'WHATSAPP_MARKETING_SEARCH',
        trackEventId: 'WA_Bulk_Search__enter_point_click',
      },
      {
        title: '营销加群',
        key: 'marketWaGroupHistory',
        label: 'WHATSAPP_MARKETING_ADD_GROUP',
        trackEventId: 'WA_Group_Crawler__enter_point_click',
      },
    ],
  },
  {
    title: getIn18Text('WAGERENYINGXIAO'),
    key: 'whatsapp_personal_marketing',
    label: 'WHATSAPP_PERSONAL_MARKETING',
    icon: <TongyongWhatsApp color="#6F7485" />,
    trackEventId: 'client_2_WA_personal_marketing',
    children: [
      {
        title: getIn18Text('WAGERENHAOXIAOXI'),
        key: 'pernsonalWhatsapp',
        label: 'WHATSAPP_PERSONAL_MSG',
        trackEventId: 'client_3_WA_Personal_messages',
        subffix: () => <WillOfflineTag />,
      },
      {
        title: getIn18Text('WAGERENQUNFARENWU'),
        key: 'pernsonalJobWhatsApp',
        label: 'WHATSAPP_PERSONAL_SEND_TASK',
        trackEventId: 'client_3_WA_Personal_sending_tasks',
        subffix: () => <WillOfflineTag />,
      },
    ],
  },
  {
    title: getIn18Text('WASHANGYEYINGXIAO'),
    key: 'whatsapp_business_marketing',
    label: 'WHATSAPP_BUSINESS_MARKETING',
    icon: <TongyongWhatsAppB color="#6F7485" />,
    trackEventId: 'client_2_WA_business_marketing',
    children: [
      {
        title: getIn18Text('WASHANGYEXIAOXI'),
        key: 'whatsAppMessage',
        label: 'WHATSAPP_MSG',
        trackEventId: 'client_3_WA_business_messages',
      },
      {
        title: getIn18Text('WASHANGYEQUNFARENWU'),
        key: 'whatsAppJob',
        label: 'WHATSAPP_SEND_TASK',
        trackEventId: 'client_3_WA_business_sending_tasks',
      },
      {
        title: getIn18Text('SHUJUTONGJI'),
        key: 'whatsAppStatistic',
        label: 'WHATSAPP_DATA_STAT',
        trackEventId: 'client_3_WA_Statistics',
      },
      {
        title: getIn18Text('XIAOXIMOBAN'),
        key: 'whatsAppTemplate',
        label: 'WHATSAPP_MSG_TPL_SETTING',
        trackEventId: 'client_3_WA_Message_template',
      },
    ],
  },
  {
    title: getIn18Text('FACEBOOKYINXIAO'),
    key: 'facebook',
    label: 'FACEBOOK',
    icon: <IconFacebook />,
    trackEventId: 'client_2_Facebook_marketing',
    children: [
      {
        title: getIn18Text('wodezhuyeguanli'),
        key: 'facebookPages',
        label: 'FACEBOOK_MY_MAIN_PAGE',
        trackEventId: 'client_3_Facebook_Homepage_management',
      },
      {
        title: getIn18Text('TIEZIGUANLI'),
        key: 'facebookPosts',
        label: 'FACEBOOK_MY_POST',
        trackEventId: 'client_3_Facebook_comments',
      },
      {
        title: getIn18Text('XIAOXI'),
        key: 'facebookMessage',
        label: 'FACEBOOK_MSG',
        trackEventId: 'client_3_Facebook_messages',
      },
    ],
  },
];
let tracked = false;
let timer: number | null = null;
let transId: number = 0;
const iconMap = {
  [FbBindStatus.BIND_FAILED]: <Error />,
  [FbBindStatus.USER_CANCEL]: <Warning />,
  [FbBindStatus.NO_ALL_PERMISSIONS]: <Info />,
  [FbBindStatus.NO_OPERATE]: <Info />,
  [FbBindStatus.BIND_SUCCESS]: <Success />,
};
const IntelliMarketing: React.FC<SiriusPageProps> = props => {
  const location = useLocation();
  const [page, setPage] = useState('aiHosting');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});
  const [activeMenuKey, setActiveMenuKey] = useState('sended');
  const [lastPage, setLastPage] = useState('');
  const [menuData, setMenuData] = useState<MenuItemData[]>([]);
  const [showCreateBtn, setShowCreateBtn] = useState<boolean>(false);
  const [templateId, setTemplateId] = useState<string>('');
  const menuKeys = useAppSelector(state => state.privilegeReducer.visibleMenuLabels);
  const isFoldMenu = useAppSelector(state => state.expandMenuReducer.isFold);
  const appDispatch = useAppDispatch();
  const [tempContent, setTempContent] = useState('');
  const [prevScene, setPrevScene] = useState('newCreate');
  const lastUpdateTimeFromLocal = Number(storeApi.getSync(last_update_template_time_for_list).data) || 0;
  const [shouldShowNewTag, setShouldShowNewTag] = useState<boolean>(false);
  const v1v2 = useVersionCheck();
  const selectedMenuData = useMemo(() => (v1v2 === 'v2' ? edmMenuDataV2 : edmMenuData), [v1v2]);
  let lastUpdateTimeFromServer = 0;
  const fetchNewTemplateIfNeeded = async () => {
    const updateTime = (await templateApi.fetchNewTemplateUpdateTime()) as UpdateTimeProps;
    lastUpdateTimeFromServer = updateTime?.lastAddTime || -1;
    const prevTime = lastUpdateTimeFromLocal || -1;
    if (lastUpdateTimeFromServer > prevTime) {
      setShouldShowNewTag(true);
    }
  };

  const [hasWarmUpPermission, setHasWarmUpPermission] = useState(false);
  useEffect(() => {
    fetchBindingWarmUpInfo();
  }, []);

  const fetchBindingWarmUpInfo = async () => {
    const resp = await EDMAPI().multiAccountOverview({ days: 14, sources: [WarmUpAccountSource.system, WarmUpAccountSource.custom] });
    setHasWarmUpPermission(resp.totalAccounts > 0);
  };

  useEffect(() => {
    fetchNewTemplateIfNeeded();

    // 监听打开详情事件
    eventApi.registerSysEventObserver('openMarketingDetail', {
      name: 'openMarketingDetail',
      func: async (ev: SystemEvent<any>) => {
        const data = ev.eventData;
        // ${location.origin}/#edm?page=index&detailId=${item.edmEmailId}
        if (data.detailId) {
          navigate(`/#edm?page=index&detailId=${data.detailId}&isParent=${data.isParent}`);
        }
      },
    });
  }, []);

  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    if (moduleName !== 'edm' && moduleName !== 'intelliMarketing') {
      return;
    }

    const params = qs.parse(location.hash.split('?')[1]);
    // eslint-disable-next-line @typescript-eslint/no-shadow
    // 默认跳列表页  @hanxu
    const page = (params.page as string) || 'addressBookIndex'; // getDefaultPage(menuData);
    if (page === 'write') {
      // setPrevScene(params.from as string || 'newCreate');
      if (params._t) {
        const key = `${params.from}_${params._t}`;
        setPrevScene(key);
      } else {
        setPrevScene((params.from as string) || 'newCreate');
      }
    }

    setPage(page);
    setPageParams(params);
    const matchMenu = [...menuData].some(menu => menu.children?.some(i => i.key === page));
    const getPageKey = () => {
      switch (page) {
        case 'autoMarketTask':
        case 'autoMarketTaskDetail':
        case 'autoMarketTaskEdit':
          return 'index';
        case 'templateAddModal':
          return 'mailTemplate';
        case 'addressBookGroupDetail':
        case 'addressBookSourceDetail':
        case 'addressHistoryIndex':
        case 'addressHistoryDetail':
        case 'addressPublicHistoryIndex':
        case 'addressPublicHistoryDetail':
          return 'addressBookIndex';
        case 'facebookMessage':
          return 'facebookMessage';
        case 'facebookPages':
          return 'facebookPages';
        case 'facebookPosts':
          return 'facebookPosts';
        case 'whatsAppJobReport':
        case 'whatsAppJobEdit':
          return 'whatsAppJob';
        case 'personalJobWhatsAppDetail':
          return 'pernsonalJobWhatsApp';
        case 'addressContactList':
          return 'addressContactList';
        case 'whatsAppRegister':
          return '';
        case 'multiAccountMessage':
          return 'multiAccountMessage';
        case 'createMarketBulk':
        case 'marketBulkDetail':
        case 'marketBulk':
          return 'marketBulk';
        case 'waJoinGroupDetail':
          return 'marketWaGroupHistory';
        default:
          return 'addressBookIndex';
      }
    };
    const menuKey = matchMenu ? page : getPageKey();
    setActiveMenuKey(menuKey);
    if (shouldShowNewTag && menuKey === 'mailTemplate') {
      storeApi.putSync(last_update_template_time_for_list, lastUpdateTimeFromServer.toString(), { noneUserRelated: false });
      setShouldShowNewTag(false);
    }
    // 记录返回页面
    if (page !== 'write' && page !== 'autoMarketTaskEdit') {
      if (systemApi.isWebWmEntry()) {
        location.hash.includes('#intelliMarketing') && setLastPage(location.hash);
      } else {
        setLastPage(location.hash);
      }
    }
  }, [location, menuData]);

  const handleMenuClick = (current: { key: string }) => {
    console.error('tab change', current);
    const { key } = current;

    // 个人whatsapp新窗口/新tab打开
    if (key === 'pernsonalWhatsapp') {
      if (systemApi.isElectron()) {
        systemApi.createWindowWithInitData('personalWhatsapp', { eventName: 'initPage' });
      } else {
        window.open('/personalWhatsapp/', 'personalWhatsapp');
      }
      return;
    } else if (key === 'index') {
      transId = sentryReportApi.startTransaction({ name: 'marketing_task_index_list_show', op: 'click' });
      navigate(`#${props.name}?page=${key}&transId=${transId}`);
    } else {
      navigate(`#${props.name}?page=${key}`);
    }
    if (key === 'index') {
      transId = sentryReportApi.startTransaction({ name: 'marketing_task_index_list_show', op: 'click' });
      navigate(`#${props.name}?page=${key}&transId=${transId}`);
    } else {
      navigate(`#${props.name}?page=${key}`);
    }
    if (key === 'addressBookIndex') {
      edmDataTracker.track('waimao_address_book');
    } else if (key === 'addressBookOpenSea') {
      edmDataTracker.track('waimao_address_book_sea');
    }
  };

  const getCurPageByUrl = () => {
    const params = qs.parse(location.hash.split('?')[1]);
    // eslint-disable-next-line @typescript-eslint/no-shadow
    return params.page as string;
  };

  const notExistGlobalModel = useMemo(() => {
    const data = storeApi.getSync('AIHOSTING_UPDATE');
    const curPage = getCurPageByUrl();
    if (curPage === 'aiHosting' && data && !data.suc) {
      return false;
    }
    return document.querySelectorAll('.global-marketing-modal')?.length === 0;
  }, [location.hash]);

  const renderContent = (key: string, qs: Record<string, any>) => {
    const map: Record<
      string,
      {
        component: React.ComponentType<any>;
        attr?: Record<string, any>;
        isLazy?: boolean;
      }
    > = {
      addressContactList: {
        component: AddressContactListPage,
        attr: {
          qs,
        },
        isLazy: true,
      },
      // addressContactList: <AddressContactListPage qs={qs} />,
      addressBookIndex: {
        component: AddressBookNewIndex,
      },
      // addressBookIndex: <AddressBookNewIndex />,
      addressBookGroupDetail: {
        component: AddressBookGroupDetail,
        attr: {
          qs,
        },
        isLazy: true,
      },
      // addressBookGroupDetail: <AddressBookGroupDetail qs={qs} />,
      addressBookSourceDetail: {
        component: AddressBookSourceDetail,
        attr: {
          qs,
        },
        isLazy: true,
      },
      detail: {
        component: EdmDetail,
        attr: {
          qs,
        },
        isLazy: true,
      },
      // detail: <EdmDetail qs={qs} />,
      drafts: {
        component: Draft,
        attr: {
          qs,
        },
        isLazy: true,
      },
      // drafts: <Draft qs={qs} />,
      contact: {
        component: Contact,
        attr: {
          qs,
        },
        isLazy: true,
      },
      // contact: <Contact qs={qs} />,
      write: {
        component: MarketingRoot,
        attr: {
          qs,
          back,
        },
        isLazy: true,
      },
      // write: <MarketingRoot qs={qs} back={back} key={prevScene} />,
      aiHostingWrite: {
        component: AiHostingWrite,
        attr: {
          qs,
          back,
        },
        isLazy: true,
      },
      // aiHostingWrite: <AiHostingWrite qs={qs} back={back} />,
      blacklist: {
        component: Blacklist,
        attr: {},
        isLazy: true,
      },
      // blacklist: <Blacklist />,
      autoMarketTask: {
        component: AutoMarketTask,
        isLazy: true,
      },
      // autoMarketTask: <AutoMarketTask />,
      autoMarketTaskDetail: {
        component: AutoMarketTaskDetail,
      },
      // autoMarketTaskDetail: <AutoMarketTaskDetail />,
      autoMarketTaskEdit: {
        component: AutoMarketTaskEdit,
        attr: {
          qs,
        },
        isLazy: true,
      },
      // autoMarketTaskEdit: <AutoMarketTaskEdit qs={qs} />,
      mailTemplate: {
        component: MailTemplate,
        attr: {
          goTemplateAdd,
        },
        isLazy: true,
      },
      // mailTemplate: <MailTemplate goTemplateAdd={goTemplateAdd} />,
      templateAddModal: {
        component: TemplateAddModal,
        attr: {
          templateId,
          goMailTemplate,
          content: tempContent,
        },
        isLazy: true,
      },
      // templateAddModal: <TemplateAddModal templateId={templateId} goMailTemplate={goMailTemplate} content={tempContent} />,
      addressHistoryIndex: {
        component: AddressHistoryIndex,
        attr: {
          qs,
        },
        isLazy: true,
      },
      // addressHistoryIndex: <AddressHistoryIndex qs={qs} />,
      addressBookOpenSea: {
        component: AddressBookOpenSea,
        isLazy: true,
      },
      // addressBookOpenSea: <AddressBookOpenSea />,
      addressPublicHistoryIndex: {
        component: AddressBookPublicHistoryIndex,
        isLazy: true,
      },
      // addressPublicHistoryIndex: <AddressBookPublicHistoryIndex />,
      addressPublicHistoryDetail: {
        component: AddressBookPublicHistoryDetail,
        attr: {
          qs,
        },
        isLazy: true,
      },
      // addressPublicHistoryDetail: <AddressBookPublicHistoryDetail qs={qs} />,
      addressHistoryDetail: {
        component: AddressHistoryDetail,
        attr: {
          qs,
        },
      },
      // addressHistoryDetail: <AddressHistoryDetail qs={qs} />,
      extension: {
        component: Extension,
      },
      // extension: <Extension />,
      whatsAppAiSearch: {
        component: WhatsAppAiSearch,
        isLazy: true,
      },
      // whatsAppAiSearch: <WhatsAppAiSearch />,
      customerBookList: { component: CustomerManage },
      customerGrade: { component: CustomerGradeManage },
      whatsAppJob: {
        component: BspContainer,
        attr: {
          IB:
            key === 'whatsAppJob' ? (
              <WaAdContainerV1 type="whatsAppJob">
                <WhatsAppJob />
              </WaAdContainerV1>
            ) : null,
          NX:
            key === 'whatsAppJob' ? (
              <WaProviderV2>
                <WaAdContainerV2 type="whatsAppJob">
                  <WaAllotContainerV2 key="whatsAppJob">
                    <WhatsAppJobV2 />
                  </WaAllotContainerV2>
                </WaAdContainerV2>
              </WaProviderV2>
            ) : null,
        },
        isLazy: true,
      },
      whatsAppJobEdit: {
        component: BspContainer,
        attr: {
          IB:
            key === 'whatsAppJobEdit' ? (
              <WaAdContainerV1 type="whatsAppJob">
                <WhatsAppJobEdit qs={qs} />
              </WaAdContainerV1>
            ) : null,
          NX:
            key === 'whatsAppJobEdit' ? (
              <WaProviderV2>
                <WaAdContainerV2 type="whatsAppJob">
                  <WaAllotContainerV2 key="whatsAppJobEdit">
                    <WhatsAppJobEditV2 qs={qs} />
                  </WaAllotContainerV2>
                </WaAdContainerV2>
              </WaProviderV2>
            ) : null,
        },
        isLazy: true,
      },
      whatsAppJobReport: {
        component: BspContainer,
        attr: {
          IB:
            key === 'whatsAppJobReport' ? (
              <WaAdContainerV1 type="whatsAppJob">
                <WhatsAppJobReport qs={qs} />
              </WaAdContainerV1>
            ) : null,
          NX:
            key === 'whatsAppJobReport' ? (
              <WaProviderV2>
                <WaAdContainerV2 type="whatsAppJob">
                  <WaAllotContainerV2 key="whatsAppJobReport">
                    <WhatsAppJobReportV2 qs={qs} />
                  </WaAllotContainerV2>
                </WaAdContainerV2>
              </WaProviderV2>
            ) : null,
        },
        isLazy: true,
      },
      whatsAppMessage: {
        component: BspContainer,
        attr: {
          IB:
            key === 'whatsAppMessage' ? (
              <WaAdContainerV1 type="whatsAppMessage">
                <WhatsAppMessage qs={qs} />
              </WaAdContainerV1>
            ) : null,
          NX:
            key === 'whatsAppMessage' ? (
              <WaProviderV2>
                <WaAdContainerV2 type="whatsAppMessage">
                  <WaAllotContainerV2 key="whatsAppMessage">
                    <WhatsAppMessageV2 qs={qs} />
                  </WaAllotContainerV2>
                </WaAdContainerV2>
              </WaProviderV2>
            ) : null,
        },
        isLazy: true,
      },
      whatsAppTemplate: {
        component: BspContainer,
        attr: {
          IB:
            key === 'whatsAppTemplate' ? (
              <WaAdContainerV1 type="whatsAppTemplate">
                <WhatsAppTemplate />
              </WaAdContainerV1>
            ) : null,
          NX:
            key === 'whatsAppTemplate' ? (
              <WaProviderV2>
                <WaAdContainerV2 type="whatsAppTemplate">
                  <WaAllotContainerV2 key="whatsAppTemplate">
                    <WhatsAppTemplateV2 />
                  </WaAllotContainerV2>
                </WaAdContainerV2>
              </WaProviderV2>
            ) : null,
        },
        isLazy: true,
      },
      whatsAppStatistic: {
        component: BspContainer,
        attr: {
          IB:
            key === 'whatsAppStatistic' ? (
              <WaAdContainerV1 type="whatsAppStatistic">
                <WhatsAppStatistic qs={qs} />
              </WaAdContainerV1>
            ) : null,
          NX:
            key === 'whatsAppStatistic' ? (
              <WaProviderV2>
                <WaAdContainerV2 type="whatsAppStatistic">
                  <WaAllotContainerV2 key="whatsAppStatistic">
                    <WhatsAppStatisticV2 />
                  </WaAllotContainerV2>
                </WaAdContainerV2>
              </WaProviderV2>
            ) : null,
        },
        isLazy: true,
      },
      pernsonalWhatsapp: {
        component: PersonalWhatsapp,
        attr: { qs },
        isLazy: true,
      },
      // pernsonalWhatsapp: <PersonalWhatsapp qs={qs} />,
      pernsonalJobWhatsApp: {
        component: PersonalJobWhatsApp,
        attr: { qs },
        isLazy: true,
      },
      // pernsonalJobWhatsApp: <PersonalJobWhatsApp qs={qs} />,
      personalJobWhatsAppDetail: {
        component: PersonalJobWhatsAppDetail,
        attr: { qs },
        isLazy: true,
      },
      // personalJobWhatsAppDetail: <PersonalJobWhatsAppDetail qs={qs} />,
      multiAccountMessage: {
        component: MultiAccountMessage,
        isLazy: true,
      },
      // multiAccountMessage: <MultiAccountMessage />,
      marketBulk: {
        component: MarketBulk,
        isLazy: true,
      },
      // marketBulk: <MarketBulk />,
      createMarketBulk: {
        component: CreateMarketBulk,
        isLazy: true,
      },
      // createMarketBulk: <CreateMarketBulk />,
      marketBulkDetail: {
        component: MarketBulkDetail,
        attr: { qs },
        isLazy: true,
      },
      // marketBulkDetail: <MarketBulkDetail qs={qs} />,
      marketSearchWhatsApp: {
        component: MarketSearchWhatsApp,
        attr: { qs },
        isLazy: true,
      },
      // marketSearchWhatsApp: <MarketSearchWhatsApp qs={qs} />,
      marketWaGroupHistory: {
        component: MarketWaGroupHistory,
        attr: { qs },
        isLazy: true,
      },
      // marketWaGroupHistory: <MarketWaGroupHistory qs={qs} />,
      waJoinGroupDetail: {
        component: JoinGroupDetail,
        attr: { qs },
        isLazy: true,
      },
      // waJoinGroupDetail: <JoinGroupDetail qs={qs} />,
      facebookMessage: {
        component: FacebookMessage,
        attr: { qs },
        isLazy: true,
      },
      // facebookMessage: <FacebookMessage qs={qs} />,
      facebookPages: {
        component: FacebookPages,
        attr: { qs },
        isLazy: true,
      },
      // facebookPages: <FacebookPages qs={qs} />,
      facebookPosts: {
        component: FackbookPosts,
        attr: { qs },
        isLazy: true,
      },
      // facebookPosts: <FackbookPosts qs={qs} />,
      aiDataView: {
        component: DataView,
        isLazy: true,
      },
      MarketingRecords: {
        component: MarketingRecords,
        isLazy: true,
      },
      // MarketingRecords: <MarketingRecords />,
      ContactDetail: {
        component: ContactDetail,
        isLazy: true,
      },
      // ContactDetail: <ContactDetail />,
      warmup: {
        component: WarmUpPage,
        isLazy: true,
      },
      // warmup: <WarmUpPage />,
      // 多域名营销
      // 多域名营销单独入口于1010版本下线
      senderRotateList: {
        component: SenderRotateList,
        attr: { qs },
        isLazy: true,
      },
      // senderRotateList: <SenderRotateList qs={qs} />,
    };

    if (key === undefined) {
      return React.createElement(map.addressBookIndex.component, {});
    }

    if (!Reflect.has(map, key)) {
      return null;
    }

    // return map[key];
    const curPage = getCurPageByUrl();
    // if (map[key].isLazy) {
    //   return React.createElement(
    //     React.Suspense,
    //     {
    //       fallback: <div>loading...</div>,
    //     },
    //     React.createElement(map[key]!.component, map[key].attr)
    //   );
    // }

    return React.createElement(map[key]!.component, map[key].attr);
    return (
      <>
        {map[key]}
        {/* {ShowWeeklyTaskPages.includes(curPage) && notExistGlobalModel && <MarketingWeeklyTask key={curPage} />} */}
      </>
    );
  };

  const back = () => {
    if (lastPage) {
      navigate(lastPage);
    } else {
      navigate(`${routerWord}?page=index`);
    }
  };

  // 打卡添加弹窗
  const goTemplateAdd = (templateId?: string, content?: string) => {
    setTemplateId(templateId || '');
    setTempContent(content);
    // navigate('#edm?page=templateAddModal');
    setPage('templateAddModal');
  };

  const goMailTemplate = (refresh?: boolean) => {
    // setTemplateId('');
    navigate('#edm?page=mailTemplate');
  };

  const createMailTask = () => {
    edmDataTracker.trackDraftListOperation(EdmDraftListOperateType.NewObject);
    edmDataTracker.track('pc_markting_newobject_edm_click');
    navigate('#edm?page=write');
  };

  useEffect(() => {
    setShowCreateBtn(false);
    const data = filterTree(selectedMenuData, menuKeys);
    data.forEach(item => {
      let warmupIndex = -1;
      item.children?.forEach((child, index) => {
        if (child.key === 'mailTemplate') {
          child.isNew = () => shouldShowNewTag;
        }
        if (item.key === 'edm' && child.key === 'index') {
          setShowCreateBtn(true);
        }
        if (child.key === 'warmup' && !hasWarmUpPermission) {
          warmupIndex = index;
        }
      });
      if (warmupIndex > 0) {
        item.children?.splice(warmupIndex, 1);
      }
    });
    setMenuData(data);
  }, [menuKeys, shouldShowNewTag, hasWarmUpPermission]);

  useEffect(() => {
    if (!tracked) {
      edmDataTracker.trackPv(EDMPvType.EdmModule);
      tracked = true;
    }
  }, []);
  useEffect(() => {
    if (props.active) {
      appDispatch(getPrivilegeAsync());
      appDispatch(getMenuSettingsAsync());
      appDispatch(getModuleDataPrivilegeAsync('EDM'));
      appDispatch(getCompanyCheckRules());
    }
  }, [props.active]);

  const { setFacebookModalShow, updateOAuth, freshFacebookPages } = useActions(FacebookActions);
  const { offsiteModalShow, accModalShow, source, fresh } = useAppSelector(state => state.facebookReducer);

  const fbToast = useRef<string>('');
  const [offsiteLoading, setOffsiteLoading] = useState<boolean>(false);
  // const fbPages = useRef<MainPagesRefs>(null)

  const [isStart, allOptions, setEndTime] = useCountDown({
    format: '',
    diff: 1000,
    onHand: true,
    onEnd: () => {
      window.clearInterval(timer!);
      setFacebookModalShow({ offsiteModal: false });
      updateOAuth({ authorizedLoading: false });
      setOffsiteLoading(false);
      if (fbToast.current === '') return;
      message.open({
        className: snsStyle.toast,
        icon: iconMap[fbToast.current as FbBindStatus],
        content: fbToast.current,
      });
    },
  });

  // 去 faceBook 授权
  const goAuthorize = () => {
    try {
      updateOAuth({ authorizedLoading: true });
      setOffsiteLoading(true);
      facebookApi
        .getAuthorizeUrl()
        .then(res => {
          const { loginUrl, checkCode } = res || {};
          window.open(loginUrl, '_blank');
          return checkCode;
        })
        .then(checkCode => {
          // if(source === 'accManage') {
          //     setOffsiteLoading(false)
          //     freshFacebookPages({ fresh: !fresh })
          // }
          if (source === 'authPage' || source === 'table' || source === 'accManage') {
            setEndTime(Date.now() + 60 * 1000);

            timer = window.setInterval(() => {
              facebookApi.checkBindStatus({ checkCode }).then(res => {
                const { isSuccess, bindStatus } = res;
                fbToast.current = bindStatus;
                if (isSuccess) {
                  updateOAuth({ isAuthorized: true });
                  storeApi.put(AuthorizeKey, 'true');
                }
                if (bindStatus !== FbBindStatus.NO_OPERATE) {
                  // 结束倒计时
                  setEndTime(undefined);
                  updateOAuth({ authorizedLoading: false });
                  setOffsiteLoading(false);
                  freshFacebookPages({ fresh: !fresh });
                  source === 'accManage' && setFacebookModalShow({ offsiteModal: false });
                }
              });
            }, 2000);
          }
        });
    } catch (error) {
      message.error({ content: getTransText('FACEBOOKZHANGHAOSHOUQUANSHIBAI') });
      // 结束倒计时
      setEndTime(undefined);
      updateOAuth({ authorizedLoading: false });
      setOffsiteLoading(false);
    }
  };

  const checkIsAuthorized = () => {
    try {
      facebookApi.getBondAccount({ pageNumber: 1, pageSize: 10 }).then(res => {
        const { results = [] } = res;
        updateOAuth({ isAuthorized: !!results.length });
      });
    } catch (error) {
      console.log('error', error);
    }
  };

  useEffect(() => {
    const FbPage = storeApi.getSync(AuthorizeKey);
    const { data, suc } = FbPage;
    if (suc && data === 'true') {
      updateOAuth({ isAuthorized: true });
    } else checkIsAuthorized();
  }, []);

  const handleCancel = () => {
    fbToast.current = '';
    setEndTime(undefined);
    setFacebookModalShow({ offsiteModal: false });
  };

  const [agreementVisible, setAgreementVisible] = useState<boolean>(false);
  const [agreementChecked, setAgreementChecked] = useState<boolean>(false);

  useEffect(() => {
    const isWhatsApp = activeMenuKey.toLocaleLowerCase().includes('whatsapp');
    const isFacebook = activeMenuKey.toLocaleLowerCase().includes('facebook');

    if (isWhatsApp || isFacebook) {
      if (!localStorage.getItem(WhatsAppAgreementCheckedKey)) {
        setAgreementVisible(true);
      }
    }
  }, [activeMenuKey]);

  const hasSMMessagePermission = usePermissionCheck('VIEW', 'EDM', 'EDM_SENDBOX');
  const hasWaMessagePermission = usePermissionCheck('VIEW', 'WHATSAPP', 'WHATSAPP_MSG');
  const hasFbMessagePermission = usePermissionCheck('VIEW', 'FACEBOOK', 'FACEBOOK_MSG');
  const showQuotaNotification = [
    'aiHostingNew',
    'aiHosting',
    'write',
    'index',
    'addressBookIndex',
    'addressBookDatastat',
    'autoMarketTask',
    'mailTemplate',
    'drafts',
    'warmup',
    'contact',
  ].includes(page);

  return (
    <ConfigProvider locale={zhCN}>
      <GlobalProvider>
        <PageContentLayout className={style.edm}>
          {page !== 'write' && page !== 'autoMarketTaskEdit' && page !== 'aiHostingWrite' && (
            <ExpandableSideContent borderRight minWidth={FIR_SIDE} defaultWidth={220} isFold={isFoldMenu}>
              <>
                {showCreateBtn && (
                  <div className={style.createDiv}>
                    <Button type="primary" className={style.createBtn} onClick={createMailTask}>
                      <i className={style.addIcon} />
                      {getIn18Text('XINJIANFAJIANRENWU')}
                    </Button>
                  </div>
                )}
                <FoldableMenu
                  defaultOpenKeys={selectedMenuData.map(item => item.key)}
                  isFold={false}
                  handleMenuClick={handleMenuClick}
                  menuData={menuData}
                  activeMenuKey={activeMenuKey}
                />
              </>
            </ExpandableSideContent>
          )}
          <div style={{ height: '100%' }}>
            {showQuotaNotification && <TopNotification />}
            {page !== 'whatsAppAiSearch' && page !== 'facebookMessage' && page !== 'index' && renderContent(page, pageParams)}
            <div
              style={{
                height: '100%',
                display: page !== 'index' ? 'none' : 'block',
              }}
            >
              {hasSMMessagePermission ? (
                <>
                  <SendedMarketing qs={pageParams} visiable={page === 'index'} />
                  {/* {page === 'index' && notExistGlobalModel && <MarketingWeeklyTask key="index" />} */}
                </>
              ) : (
                <NoPermissionPage />
              )}
            </div>
            {hasSMMessagePermission ? (
              <AliveScope>
                <AIHosting createMode={false} visible={page === 'aiHosting'} />
              </AliveScope>
            ) : (
              <>{page === 'aiHosting' && <NoPermissionPage />}</>
            )}
            {hasSMMessagePermission ? (
              <AliveScope>
                <AIHosting createMode visible={page === 'aiHostingNew'} />
              </AliveScope>
            ) : (
              <>{page === 'aiHostingNew' && <NoPermissionPage />}</>
            )}
            <div
              style={{
                height: '100%',
                display: page !== 'facebookMessage' ? 'none' : 'block',
              }}
            >
              {hasFbMessagePermission ? <FacebookMessage qs={pageParams} /> : <NoPermissionPage />}
            </div>
            <Modal
              className={snsStyle.agreementModal}
              visible={agreementVisible}
              title={getIn18Text('FUWUSHIYONGGUIZEJIMIANZESHENGMING')}
              width={560}
              keyboard={false}
              destroyOnClose
              maskClosable={false}
              footer={
                <div className={snsStyle.agreementModalFooter}>
                  <Checkbox style={{ fontSize: 12, flex: 1, textAlign: 'left' }} checked={agreementChecked} onChange={event => setAgreementChecked(event.target.checked)}>
                    {getIn18Text('WOYIYUEDUBINGQUEREN\u300AFUWUSHIYONGGUIZEJIMIANZESHENGMING\u300B\uFF0CBUZAITIXING')}
                  </Checkbox>
                  <Button
                    type="primary"
                    disabled={!agreementChecked}
                    onClick={() => {
                      setAgreementVisible(false);
                      localStorage.setItem(WhatsAppAgreementCheckedKey, '1');
                    }}
                  >
                    {getIn18Text('TONGYIXIEYIBINGJIXU')}
                  </Button>
                </div>
              }
            >
              <p>
                {getIn18Text(
                  'ZUNJINGDEYONGHU\uFF0CZAISHIYONGWANGYIWAIMAOTONGwhatsappYINGXIAOGONGNENG/FUWU\uFF08XIACHENG\u201CBENFUWU\u201D\uFF09QIAN\uFF0CQINGXIANYUEDU\u300AWANGYIWAIMAOTONGFUWUTIAOKUAN\u300BJIXIALIESHIYONGGUIZE\uFF0CZAIJIESHOUBINGTONGYIQUANBUNEIRONGHOUKAISHISHIYONGBENFUWU\uFF1BRUYOURENHEWEIFAN\uFF0CNINXUYAODUIZIJIDEXINGWEICHENGDANQUANBUFALVZEREN\uFF0CWOMENBUDUININDERENHEXINGWEIFUZE\uFF1A'
                )}
              </p>
              <ul>
                <li>{getIn18Text('BUDESHIYONGFEIFAWANGLUOLIANJIEFANGSHISHIYONGBENFUWU\uFF1B')}</li>
                <li>{getIn18Text('BUDEWEIFANGUOJIAFALVFAGUI\uFF0CBUDEQINFANQITAYONGHUJIRENHEDISANFANGDEHEFAQUANYI\uFF1B')}</li>
                <li>{getIn18Text('BUDESHIYONGBENFUWUFABU\u3001CHUANBO\u3001XIAOSHOUZHONGGUOFALVJIQITAKESHIYONGFALVJINZHIDENEIRONG\uFF1B')}</li>
                <li>{getIn18Text('BUDERAOGUO/POHUAIFUWUDEBAOHUHEXIANZHICUOSHISHIYONGBENFUWU\uFF1B')}</li>
                <li>{getIn18Text('BUDETONGGUOZHUANRANG\u3001CHUZU\u3001GONGXIANGDENGFANGSHIXIANGDISANFANGTIGONGBENFUWU\u3002')}</li>
              </ul>
              <p>
                {getIn18Text('RUONINWEIFAN')}
                <a href="https://qiye.163.com/sirius/agreement_waimao/index.html" target="_blank" rel="noreferrer">
                  {getIn18Text('\u300AWANGYIWAIMAOTONGFUWUTIAOKUAN\u300B')}
                </a>
                {getIn18Text(
                  'JISHANGSHUGUIZE\uFF0CWOMENYOUQUANCAIQUCUOSHI\uFF08BAOKUODANBUXIANYUZHONGZHIHUOXIANZHININDUIBENFUWUDESHIYONG\uFF09\uFF0CQIEBUTUIHAIRENHEFEIYONG\u3002YINNINDEXINGWEIZAOCHENGWOMENHUOGUANLIANGONGSISUNSHIDE\uFF0CNINYINGCHENGDANQUANBUPEICHANGZEREN\u3002'
                )}
              </p>
            </Modal>
            <OffsiteModal visible={offsiteModalShow} onCancel={handleCancel} onOk={goAuthorize} loading={offsiteLoading} />
            <AccManageModal visible={accModalShow} onCancel={() => setFacebookModalShow({ accModal: false })} />
            {/* <MarketingModalList /> */}
          </div>
        </PageContentLayout>
      </GlobalProvider>
    </ConfigProvider>
  );
};
export default IntelliMarketing;
