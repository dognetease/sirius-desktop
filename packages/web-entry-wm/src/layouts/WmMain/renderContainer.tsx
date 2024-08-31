import React, { ReactNode, useEffect, useReducer, useRef, useState, useMemo } from 'react';
import { AliveScope } from 'react-activation';
import { useAppSelector, useAppDispatch, useActions, RootState } from '@web-common/state/createStore';
import qs from 'querystring';
import Loadable from '@loadable/component';
import { navigate, useLocation } from '@reach/router';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import {
  getPrivilegeAsync,
  getVersionAsync,
  getMenuSettingsAsync,
  getModuleDataPrivilegeAsync,
  getIsFreeVersionUser,
  getMyRolesAsync,
} from '@web-common/state/reducer/privilegeReducer';
import TopNotification from '@web-common/components/TopNotification';
const CustomerManage = Loadable(() => import(/* webpackChunkName: "web-entry-ff" */ '@web-entry-ff/views/customer/customers/index'));
const CustomerGradeManage = Loadable(() => import(/* webpackChunkName: "web-entry-ff" */ '@web-entry-ff/views/customer/levelAdmin'));
import GlobalProvider from '@web-entry-ff/layouts/WmMain/globalProvider';

const SendedMarketing = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/sendedMarketing'), {
  resolveComponent: components => components.SendedMarketing,
});
const EdmDetail = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/detail/detailV2'), {
  resolveComponent: components => components.EdmDetail,
});
const Draft = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/draft/draft'), {
  resolveComponent: components => components.Draft,
});

const Contact = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/contact/contact'), {
  resolveComponent: components => components.Contact,
});

const AddressBookDatastat = Contact;

const MarketingRoot = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/send/marketingRoot'), {
  resolveComponent: components => components.MarketingRoot,
});
const Blacklist = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/blacklist/blacklist'));
const AutoMarketTask = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/autoMarket/task'));
const AutoMarketTaskDetail = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/autoMarket/taskDetail'));
const AutoMarketTaskEdit = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/autoMarket/taskEdit'));
const WarmUpPage = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/SenderRotate/warmUpPage'), {
  resolveComponent: components => components.WarmUpPage,
});
const AddressContactListPage = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/addressBook/pages/address-contact-list/index'));
const AddressBookIndex = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/addressBook/pages/index_new/index_new'));
const AddressBookOpenSea = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/addressBook/pages/openSea/index'));
const AddressBookGroupDetail = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/addressBook/pages/groupDetail'));
const AddressBookSourceDetail = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/addressBook/pages/sourceDetail'));
const AddressHistoryIndex = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/addressBook/pages/history/index'), {
  resolveComponent: components => components.AddressHistoryIndex,
});
const AddressHistoryDetail = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/addressBook/pages/history/detail'), {
  resolveComponent: components => components.AddressHistoryDetail,
});
const TemplateAddModal = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/mailTemplate/template'), {
  resolveComponent: components => components.TemplateAddModal,
});
const MailTemplate = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/mailTemplate/indexV2'), {
  resolveComponent: components => components.MailTemplate,
});
const AddressBookPublicHistoryIndex = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/addressBook/pages/publicHistory'));
const AddressBookPublicHistoryDetail = Loadable(() => import(/* webpackChunkName: "edm-market" */ '@web-edm/addressBook/pages/publicHistory/detail'));
import { AIHosting } from '@web-edm/AIHosting';

const LabelManager = Loadable(() => import(/* webpackChunkName: "customer" */ '@web/components/Layout/Customer/label/labelManager'), {
  resolveComponent: components => components.LabelManager,
});
const CustomerDuplicateCheck = Loadable(() => import(/* webpackChunkName: "customer" */ '@web/components/Layout/Customer/CustomerDuplicateCheck'), {
  resolveComponent: components => components.CustomerDuplicateCheck,
});
const Client = Loadable(() => import(/* webpackChunkName: "customer" */ '@web/components/Layout/Customer/NewClient/index'));
const CustomerOpenSea = Loadable(() => import(/* webpackChunkName: "customer" */ '@web/components/Layout/Customer/CustomerOpenSea/index'));
const Clue = Loadable(() => import(/* webpackChunkName: "customer" */ '@web/components/Layout/Customer/Clue/clue'));
const SeaClue = Loadable(() => import(/* webpackChunkName: "customer" */ '@web/components/Layout/Customer/SeaClue/openSea'));
const Business = Loadable(() => import(/* webpackChunkName: "customer" */ '@web/components/Layout/Customer/Business/business'));
const Extension = Loadable(() => import(/* webpackChunkName: "customer" */ '@web/components/Layout/Customer/Extension/Index'));
const ImportRecord = Loadable(() => import(/* webpackChunkName: "customer" */ '@web/components/Layout/Customer/ImportRecord/'));
const DataTransfer = Loadable(() => import(/* webpackChunkName: "customer" */ '@web/components/Layout/Customer/DataTransfer'), {
  resolveComponent: components => components.DataTransfer,
});

const AutoRecommend = Loadable(() => import(/* webpackChunkName: "customerDiscovery" */ '@web/components/Layout/Customer/CustomerDiscovery/autoRecommend'));
const ManualRecommend = Loadable(() => import(/* webpackChunkName: "customerDiscovery" */ '@web/components/Layout/Customer/CustomerDiscovery/manualRecommend'));
const RecommendOplist = Loadable(() => import(/* webpackChunkName: "customerDiscovery" */ '@web/components/Layout/Customer/CustomerDiscovery/recommendOplist'));
const Authorization = Loadable(() => import(/* webpackChunkName: "customerDiscovery" */ '@web/components/Layout/Customer/CustomerDiscovery/authorization'), {
  resolveComponent: components => components.Authorization,
});
const AuthWhitelist = Loadable(
  () => import(/* webpackChunkName: "customerDiscovery" */ '@web/components/Layout/Customer/CustomerDiscovery/containers/AuthorizationWhitelist'),
  {
    resolveComponent: components => components.AuthWhitelist,
  }
);

const CustomsData = Loadable(() => import(/* webpackChunkName: "CustomsData" */ '@web/components/Layout/CustomsData/customs/customs'));
const ForwarderData = Loadable(() => import(/* webpackChunkName: "CustomsData" */ '@web/components/Layout/CustomsData/customs/ForwarderData'));
const SearchIframe = Loadable(() => import(/* webpackChunkName: "CustomsData" */ '@web/components/Layout/CustomsData/customs/searchIframe'));
const WcaSearch = Loadable(() => import(/* webpackChunkName: "CustomsData" */ '@web/components/Layout/CustomsData/customs/wca'));
const Star = Loadable(() => import(/* webpackChunkName: "CustomsData" */ '@web/components/Layout/CustomsData/starMark/star'));

const Worktable = Loadable(() => import(/* webpackChunkName: "Worktable" */ '@web/components/Layout/Worktable/workTable'), {
  resolveComponent: components => components.Worktable,
});

const TradeAnalysis = Loadable(() => import(/* webpackChunkName: "tradeAnalysis" */ '@web/components/Layout/tradeAnalysis/tradeAnalysis'));

const VariableSetting = Loadable(() => import(/* webpackChunkName: "EnterpriseSetting" */ '@web/components/Layout/EnterpriseSetting/variables/variableSetting'), {
  resolveComponent: components => components.VariableSetting,
});
const SaleStage = Loadable(() => import(/* webpackChunkName: "EnterpriseSetting" */ '@web/components/Layout/EnterpriseSetting/saleStage/saleStage'), {
  resolveComponent: components => components.SaleStage,
});
const FieldSetting = Loadable(() => import(/* webpackChunkName: "EnterpriseSetting" */ '@web/components/Layout/EnterpriseSetting/fieldSetting/fieldSetting'), {
  resolveComponent: components => components.FieldSetting,
});
const EdmQuota = Loadable(() => import(/* webpackChunkName: "EnterpriseSetting" */ '@web/components/Layout/EnterpriseSetting/edmQuota/EdmQuota'), {
  resolveComponent: components => components.EdmQuota,
});
const MailTagSetting = Loadable(() => import(/* webpackChunkName: "EnterpriseSetting" */ '@web/components/Layout/EnterpriseSetting/mailTag/MailTagSetting'), {
  resolveComponent: components => components.MailTagSetting,
});
const CheckField = Loadable(() => import(/* webpackChunkName: "EnterpriseSetting" */ '@web/components/Layout/EnterpriseSetting/checkField/checkField'), {
  resolveComponent: components => components.CheckField,
});
const OpenSeaSetting = Loadable(() => import(/* webpackChunkName: "EnterpriseSetting" */ '@web/components/Layout/EnterpriseSetting/openSeaSetting/openSeaSetting'), {
  resolveComponent: components => components.OpenSeaSetting,
});
const NoticeSetting = Loadable(() => import(/* webpackChunkName: "EnterpriseSetting" */ '@web/components/Layout/EnterpriseSetting/noticeSetting/noticeSetting'), {
  resolveComponent: components => components.NoticeSetting,
});
const InsertWhatsApp = Loadable(() => import(/* webpackChunkName: "EnterpriseSetting" */ '@web/components/Layout/EnterpriseSetting/WhatsAppAccountManage'), {
  resolveComponent: components => components.WhatsAppAccountManage,
});
const SystemTaskConfig = Loadable(() => import(/* webpackChunkName: "EnterpriseSetting" */ '@web/components/Layout/EnterpriseSetting/systemTaskConfig'), {
  resolveComponent: components => components.SystemTaskConfig,
});

const RoleMembers = Loadable(() => import(/* webpackChunkName: "Rbac" */ '@web/components/Layout/Rbac/member/member'), {
  resolveComponent: components => components.RoleMembers,
});
const RoleManager = Loadable(() => import(/* webpackChunkName: "Rbac" */ '@web/components/Layout/Rbac/roleManager/roleManager'), {
  resolveComponent: components => components.RoleManager,
});
const RoleDetail = Loadable(() => import(/* webpackChunkName: "Rbac" */ '@web/components/Layout/Rbac/roleManager/roleDetail'), {
  resolveComponent: components => components.RoleDetail,
});
const RoleDetailV2 = Loadable(() => import(/* webpackChunkName: "Rbac" */ '@web/components/Layout/Rbac/roleManager/roleDetailV2'), {
  resolveComponent: components => components.RoleDetailV2,
});
const MenuManage = Loadable(() => import(/* webpackChunkName: "Rbac" */ '@web/components/Layout/Rbac/menuManage/menuManage'), {
  resolveComponent: components => components.MenuManage,
});
const MenuManageV2 = Loadable(() => import(/* webpackChunkName: "Rbac" */ '@web/components/Layout/Rbac/menuManage/menuManageV2'), {
  resolveComponent: components => components.MenuManageV2,
});

const WaOperateLog = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsApp/waOperateLog'), {
  resolveComponent: components => components.WaOperateLog,
});
const WorkloadStats = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsApp/workloadStats'), {
  resolveComponent: components => components.WorkloadStats,
});
const WhatsAppAiSearch = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsApp/search/search'));
const WhatsAppJob = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsApp/job/job'));
const WhatsAppJobV2 = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsAppV2/job/job'));
const WhatsAppJobEdit = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsApp/job/jobEdit'));
const WhatsAppJobEditV2 = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsAppV2/job/jobEdit'));
const WhatsAppJobReport = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsApp/job/jobReport'));
const WhatsAppJobReportV2 = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsAppV2/job/jobReport'));
const WhatsAppMessage = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsApp/message/message'));
const WhatsAppMessageV2 = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsAppV2/message/message'));
const WhatsAppStatistic = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsApp/statistic/index'));
const WhatsAppStatisticV2 = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsAppV2/statistic/index'));
const WhatsAppTemplate = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsApp/template/template'));
const WhatsAppTemplateV2 = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsAppV2/template/template'));
const WhatsAppRegisterV2 = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsAppV2/register/register'));
const BspContainer = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/BizWhatsApp/BspContainer'), {
  resolveComponent: components => components.BspContainer,
});
const WaProviderV2 = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/WhatsAppV2/context/WaContextV2'), {
  resolveComponent: components => components.WaProviderV2,
});
const WaAgreementContainer = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/BizWhatsApp/WaAgreementContainer'), {
  resolveComponent: components => components.WaAgreementContainer,
});
const WaAdContainerV2 = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/BizWhatsApp/WaAdContainerV2'), {
  resolveComponent: components => components.WaAdContainerV2,
});
const WaAllotContainerV2 = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/BizWhatsApp/WaAllotContainerV2'), {
  resolveComponent: components => components.WaAllotContainerV2,
});
const ProxyCheckContainer = Loadable(() => import(/* webpackChunkName: "SNS" */ '@web/components/Layout/SNS/BizWhatsApp/ProxyCheckContainer'), {
  resolveComponent: components => components.ProxyCheckContainer,
});

const PersonalWhatsapp = Loadable(() => import(/* webpackChunkName: "whatsApps" */ '@web/components/Layout/SNS/WhatsApp/personalWhatsapp/index'), {
  resolveComponent: components => components.PersonalWhatsapp,
});
const PersonalJobWhatsApp = Loadable(() => import(/* webpackChunkName: "whatsApps" */ '@web/components/Layout/SNS/WhatsApp/personalJobWhatsapp'));
const PersonalJobWhatsAppDetail = Loadable(() => import(/* webpackChunkName: "whatsApps" */ '@web/components/Layout/SNS/WhatsApp/personalJobWhatsapp/detail'));

const AccountConfig = Loadable(() => import(/* webpackChunkName: "web-setting" */ '@web-setting/Account'));
const MailConfig = Loadable(() => import(/* webpackChunkName: "web-setting" */ '@web-setting/Mail'));
const SystemConfig = Loadable(() => import(/* webpackChunkName: "web-setting" */ '@web-setting/System/system'));
const KeyboardConfig = Loadable(() => import(/* webpackChunkName: "web-setting" */ '@web-setting/Keyboard/keyboard'));

import Guide from '@web-entry-wm/layouts/container/guide';

const MySite = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/mySite'), {
  resolveComponent: components => components.MySite,
});
const TrafficDelivery = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-entry-wm/../../web-site/src/TrafficDelivery'));
const DomainBind = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/mySite/DomainBind'));
const DomainDetail = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/mySite/DomainDetail'));
const SeoConfig = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/mySite/SeoConfig'));
const DomainSearch = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/mySite/DomainSearch'));
const DomainSearchResult = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/mySite/DomainSearchResult'));
const DomainPurchaseConfirm = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/mySite/DomainPurchaseConfirm'));
const DomainPurchasePay = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/mySite/DomainPurchasePay'));
const DomainRecord = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/mySite/DomainRecord'));
const Market = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/market'), {
  resolveComponent: components => components.Market,
});
const SiteStat = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/stat'), {
  resolveComponent: components => components.SiteStat,
});
const StatDetails = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/stat/StatDetails'), {
  resolveComponent: components => components.StatDetails,
});
const SiteCustomer = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/siteCustomer'), {
  resolveComponent: components => components.SiteCustomer,
});
const MyDomain = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/domainManage/myDomain'), {
  resolveComponent: components => components.MyDomain,
});
const OrderManage = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/domainManage/orderManage'), {
  resolveComponent: components => components.OrderManage,
});
const InfoTemplate = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/domainManage/infoTemplate'), {
  resolveComponent: components => components.InfoTemplate,
});
const CreateInfoTemplate = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/domainManage/createInfoTemplate'), {
  resolveComponent: components => components.CreateInfoTemplate,
});
const CheckInfoTemplate = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/domainManage/checkInfoTemplate'), {
  resolveComponent: components => components.CheckInfoTemplate,
});
const PurchaseCert = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/domainManage/purchaseCert'), {
  resolveComponent: components => components.PurchaseCert,
});
const MyCert = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/domainManage/myCert'), {
  resolveComponent: components => components.MyCert,
});
const ArticleList = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/articleManage/articleList'), {
  resolveComponent: components => components.ArticleList,
});
const ArticleEdit = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/articleManage/articleEdit'), {
  resolveComponent: components => components.ArticleEdit,
});
const ArticleCategory = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/articleManage/articleCategory'), {
  resolveComponent: components => components.ArticleCategory,
});
const BrandBuilding = Loadable(() => import(/* webpackChunkName: "web-site" */ '@web-site/brandBuilding'), {
  resolveComponent: components => components.BrandBuilding,
});

const MarketingTaskCreate = Loadable(() => import(/* webpackChunkName: "web-sns-marketing"*/ '@web-sns-marketing/marketingTask/create/index'), {
  resolveComponent: components => components.MarketingTaskCreate,
});
const SnsMarketingTaskList = Loadable(() => import(/* webpackChunkName: "web-sns-marketing"*/ '@web-sns-marketing/marketingTask/list/index'));
const SnsPostManage = Loadable(() => import(/* webpackChunkName: "web-sns-marketing"*/ '@web-sns-marketing/postManage/index'));
const SnsAccountBinding = Loadable(() => import(/* webpackChunkName: "web-sns-marketing"*/ '@web-sns-marketing/accountBinding/index'));
const SnsSendPost = Loadable(() => import(/* webpackChunkName: "web-sns-marketing"*/ '@web-sns-marketing/sendPost/index'));
const SnsCalendar = Loadable(() => import(/* webpackChunkName: "web-sns-marketing"*/ '@web-sns-marketing/calendar/index'));
const SnsMessage = Loadable(() => import(/* webpackChunkName: "web-sns-marketing"*/ '@web-sns-marketing/message/index'));
const SnsTaskDetail = Loadable(() => import(/* webpackChunkName: "web-sns-marketing"*/ '@web-sns-marketing/taskDetail'), {
  resolveComponent: components => components.SnsTaskDetail,
});
const SnsAccountData = Loadable(() => import(/* webpackChunkName: "web-sns-marketing"*/ '@web-sns-marketing/dataAnalysis/account'), {
  resolveComponent: components => components.SnsAccountData,
});
const SnsGlobalData = Loadable(() => import(/* webpackChunkName: "web-sns-marketing"*/ '@web-sns-marketing/dataAnalysis/global'), {
  resolveComponent: components => components.SnsGlobalData,
});

const MaterielFileList = Loadable(() => import(/* webpackChunkName:"whatsApps" */ '@web-materiel/pages/FileList'), {
  resolveComponent: components => components.FileList,
});

const MaterielShareEdit = Loadable(() => import(/* webpackChunkName:"whatsApps" */ '@web-materiel/pages/ShareEdit'), {
  resolveComponent: components => components.ShareEdit,
});

const MaterielShareList = Loadable(() => import(/* webpackChunkName:"whatsApps" */ '@web-materiel/pages/ShareList'), {
  resolveComponent: components => components.ShareList,
});
import { FileUploader as MaterielFileUploader } from '@web-materiel/components/FileUploader';
const MaterielVisitList = Loadable(() => import(/* webpackChunkName:"whatsApps" */ '@web-materiel/pages/VisitList'));

const Schedule = Loadable(() => import(/* webpackChunkName: "web-schedule" */ '@web-schedule/schedule'));
const Disk = Loadable(() => import(/* webpackChunkName: "web-disk" */ '@web-disk/index'));
// const Setting = Loadable(() => import(/* webpackChunkName: "web-setting" */ '@web-setting/index'));
const MailBox = Loadable(() => import(/* webpackChunkName: "mailbox" */ '@web-mail/mailBox'));
const LxContact = Loadable(() => import(/* webpackChunkName: "LxContact" */ '@web-contact/contact'));
// const Apps = Loadable(() => import(/* webpackChunkName: "web-apps" */ '@web-apps/apps'));
const IM = Loadable(() => import(/* webpackChunkName: "im" */ '@web-im/im'));
import { UnitableCrm } from '@web-unitable-crm/unitable-crm';
import { DiskTabIcon, IMIcon, MailBoxIcon } from '@web-common/components/UI/Icons/icons';

import { apiHolder, DataTrackerApi, inWindow, MailApi, apis, NetStorageApi, NIMApi, EdmCustomsApi, urlStore, api, ProductAuthApi, getIn18Text } from 'api';
import { isIndirect } from '@web-common/utils/waimao';
// import { MarketingWeeklyTask } from '@web-edm/send/MarketingWeeklyTask/index';
// import { MarketingModalList } from '@web-edm/components/MarketingModalList/marketingModalList';
import { customerContext } from '@web/components/Layout/Customer/customerContext';
import { useBaseInfo } from '@web/components/Layout/Customer/hooks/useBaseInfo';
import { getCompanyCheckRules } from '@web-common/state/reducer/customerReducer';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import classNames from 'classnames';
// import { GlobalSearchIndex } from '@/components/Layout/globalSearch/index';

import { WebEntryWmActions, NoviceTaskActions } from '@web-common/state/reducer';
import { TopMenuPath } from '@web-entry-wm/../../web-common/src/conf/waimao/constant';

const FacebookPages = Loadable(() => import(/* webpackChunkName: "facebook" */ '@web/components/Layout/SNS/Facebook/mainPages/mainPages'));
const FacebookPosts = Loadable(() => import(/* webpackChunkName: "facebook" */ '@web/components/Layout/SNS/Facebook/posts'));
const FacebookMessage = Loadable(() => import(/* webpackChunkName: "facebook" */ '@web/components/Layout/SNS/Facebook/message'));

const MultiAccountMessage = Loadable(() => import(/* webpackChunkName: "sns-multiAccount" */ '@web/components/Layout/SNS/MultiAccount/message'));
const MarketBulk = Loadable(() => import(/* webpackChunkName: "sns-multiAccount" */ '@web/components/Layout/SNS/MultiAccount/marketingBulk'));
const CreateMarketBulk = Loadable(() => import(/* webpackChunkName: "sns-multiAccount" */ '@web/components/Layout/SNS/MultiAccount/marketingBulk/createTask'));
const MarketBulkDetail = Loadable(() => import(/* webpackChunkName: "sns-multiAccount" */ '@web/components/Layout/SNS/MultiAccount/marketingBulk/detail'));
const MarketSearchWhatsApp = Loadable(() => import(/* webpackChunkName: "sns-multiAccount" */ '@web/components/Layout/SNS/MultiAccount/searchWhatsApp'));
const MarketWaGroupHistory = Loadable(() => import(/* webpackChunkName: "sns-multiAccount" */ '@web/components/Layout/SNS/MultiAccount/GroupHistory'));
const JoinGroupDetail = Loadable(() => import(/* webpackChunkName: "sns-multiAccount" */ '@web/components/Layout/SNS/MultiAccount/GroupHistory/JoinGroupDetail'), {
  resolveComponent: components => components.JoinGroupDetail,
});

import { GlobalAdvertNotification } from '@web/components/UI/GlobalAdvertNotification/GlobalAdvertNotification';
import Modal from '@web-common/components/UI/Modal/SiriusModal';

const SystemTask = Loadable(() => import(/* webpackChunkName: "TaskCenter" */ '@/components/Layout/TaskCenter/pages/SystemTask'));
const NoviceTask = Loadable(() => import(/* webpackChunkName: "TaskCenter" */ '@/components/Layout/TaskCenter/pages/NoviceTask'));
import EmailInquiry from '@/components/Layout/EmailInquiry';
// import NoviceTaskEntry from '@/components/Layout/TaskCenter/components/NoviceTaskEntry';
import { showNoviceTaskCloseTip } from '@/components/Layout/TaskCenter/utils';

const MarketingSetting = Loadable(() => import(/* webpackChunkName: "EnterpriseSetting" */ '@/components/Layout/EnterpriseSetting/MarketingSetting'), {
  resolveComponent: components => components.MarketingSetting,
});

import { SiriusL2cSetting as App, NoPermission } from '@lxunit/app-l2c-crm';
import { useSelector } from 'react-redux';
import { useNewSubEnable } from '@/components/Layout/globalSearch/hook/useNewSubEnableHook';

const NewKeywordsPage = Loadable(() => import(/* webpackChunkName: "globalSearch" */ '@/components/Layout/globalSearch/keywordsSubscribe/NewKeywordsPage'));

import { config } from 'env_def';
const IntelligentSearch = Loadable(() => import(/* webpackChunkName: "globalSearch" */ '@/components/Layout/Data/IntelligentSearch'));
const FaceBookSearchPage = Loadable(() => import(/* webpackChunkName: "globalSearch" */ '@/components/Layout/FacebookSearch'), {
  resolveComponent: components => components.FaceBookSearchPage,
});
const LinkedInSearchPage = Loadable(() => import(/* webpackChunkName: "globalSearch" */ '@/components/Layout/LinkedInSearch'), {
  resolveComponent: components => components.LinkedInSearchPage,
});

const LbsSearch = Loadable(() => import(/* webpackChunkName: "globalSearch" */ '@/components/Layout/globalSearch/lbsSearch/LbsSearch'));
import SalesPitchPageHoc from '@/components/Layout/EnterpriseSetting/salesPitch';

import { TabItemProps } from './viewTab';
const SmartRcmd = Loadable(() => import(/* webpackChunkName: "globalSearch" */ '@/components/Layout/globalSearch/SmartRcmd/SmartRcmd'));
const ComTomFairSearch = Loadable(() => import(/* webpackChunkName: "globalSearch" */ '@/components/Layout/globalSearch/cantonFairSearch/ContomFairSearch'), {
  resolveComponent: components => components.ComTomFairSearch,
});
const KeywordsProvider = Loadable(() => import(/* webpackChunkName: "globalSearch" */ '@/components/Layout/globalSearch/keywordsSubscribe/KeywordsProvider'));
const KeywordsSubscribe = Loadable(() => import(/* webpackChunkName: "globalSearch" */ '@/components/Layout/globalSearch/keywordsSubscribe/KeywordsSubscribe'));
const SearchPage = Loadable(() => import(/* webpackChunkName: "globalSearch" */ '@/components/Layout/globalSearch/search/search'), {
  resolveComponent: components => components.SearchPage,
});

import { NoPermissionPage, usePermissionCheck } from '@/components/UI/PrivilegeEnhance';
import { useIsForwarder } from '@/components/Layout/CustomsData/customs/ForwarderSearch/useHooks/useIsForwarder';

const WhatsAppChat = Loadable(() => import(/* webpackChunkName: "whatsApps" */ '@/components/Layout/WhatsAppChat'));

import TradeProvider from '@/components/Layout/tradeAnalysis/context/tradeProvider';
import { getMenuDataType } from '../hooks/use-l2c-crm-menu-data';
import style from './container.module.scss';
import PageContentLayout from '../Main/pageContentLayout';
import SNSContainer from '../container/SNSContainer';
import useCustomerModuleCheck from '../hooks/useCustomerModuleCheck';
import { MenuItemData } from '@/components/UI/MenuIcon/FoldableMenu';
import VideoDrawer from '@web-common/components/UI/VideoDrawer';
import UpgradeWeb from '@web-common/components/upgradeWeb';

const BR = Loadable(() => import('@web/components/Layout/BR/index'));
const SearchPeers = Loadable(() => import('@web/components/Layout/SearchPeers/index'));

//是否访问过该hash，用于外贸通懒加载
const pageVisitMap: { [key: string]: boolean } = {
  index: true,
};

const moduleVisitMap: { [key: string]: boolean } = {};

const SiriusL2cSetting = () => {
  const modulePermission = useSelector((state: RootState) => state.privilegeReducer.modules);
  const productCode = useAppSelector((state: RootState) => state.privilegeReducer.version);
  const loading = useSelector((state: RootState) => state.privilegeReducer.loading) || productCode === '';
  const location = useLocation();

  if (modulePermission && Object.keys(modulePermission).length > 0 && !loading) {
    const search = new URLSearchParams(location.hash.split('?')[1]);
    const settingTab = search.get('settingTab');
    const tableId = search.get('page')?.split('-setting')[0] as string;
    return <App settingTab={settingTab} tableId={tableId} />;
  }
  if (loading) {
    return null;
  }
  return <NoPermission />;
};

const eventApi = apiHolder.api.getEventApi();
const systemApi = apiHolder.api.getSystemApi();
const httpApi = apiHolder.api.getDataTransApi();
const storeApi = apiHolder.api.getDataStoreApi();
const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const activityPages = ['globalSearch', 'keywords', 'star', 'customs'];
const RenderContainer: React.FC<any> = props => {
  const SalesPitchPage = useMemo(() => SalesPitchPageHoc('settingBoard'), []);
  // let  [tabList, setTablist] =  useTabContext()
  // const showPersonalChannel = productApi.getABSwitchSync('ws_personal') as boolean;

  const location = useLocation();
  const queryObject = useMemo(() => qs.parse(location.hash.split('?')[1]), [location]);
  let query = '';
  let detailDrawId = '';
  let queryType: any = 'product';
  if (location.hash.startsWith('#wmData') && queryObject.page === 'globalSearch') {
    if (queryObject.type) {
      queryType = queryObject.type as any;
    }
    if (queryObject.id) {
      detailDrawId = queryObject.id as string;
    }
    if (queryObject.keywords) {
      query = queryObject.keywords as string;
    }
  }

  const { tabList = [], setTablist } = props;
  const current = (tabList as TabItemProps[]).filter((e: TabItemProps) => e.isActive)[0];

  const hasSMMessagePermission = usePermissionCheck('VIEW', 'EDM', 'EDM_SENDBOX');

  const [page, setPage] = useState<string>('index');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});
  const [activeMenuKey, setActiveMenuKey] = useState('sended');
  const [lastPage, setLastPage] = useState('');
  const [menuData, setMenuData] = useState<MenuItemData[]>([]);
  const menuKeys = useAppSelector(state => state.privilegeReducer.visibleMenuLabels);
  const modules = useAppSelector(state => state.privilegeReducer.modules);
  // 货代菜单权限
  const isForwarder = useIsForwarder();
  const isFreeVersionUser = useAppSelector(state => getIsFreeVersionUser(state.privilegeReducer));
  const { isCustomerModule, checkIsCustomerModule } = useCustomerModuleCheck();
  const isFoldMenu = useAppSelector(state => state.expandMenuReducer.isFold);
  const [templateId, setTemplateId] = useState<string>('');
  const [activeModule, setActiveModule] = useState('');
  const [tempContent, setTempContent] = useState('');
  const [prevScene, setPrevScene] = useState('newCreate');
  const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';
  const version = useAppSelector(state => state.privilegeReducer.version);

  const { cachedTabs } = useAppSelector(state => state.webEntryWmReducer);
  const { setCachedTabs } = useActions(WebEntryWmActions);

  const appDispatch = useAppDispatch();
  const [newProductSubEnable] = useNewSubEnable();

  const v1v2 = useVersionCheck();

  useEffect(() => {
    window.navigate = navigate;
    const moduleName = location.hash.substring(1).split('?')[0];
    // if (moduleName !== 'edm') {
    //   return;
    // }
    const params = qs.parse(location.hash.split('?')[1]);
    const page = (params.page as string) || 'addressBookIndex';

    if (page === 'write') {
      // setPrevScene(params.from as string || 'newCreate');
      if (params._t) {
        const key = `${params.from}_${params._t}`;
        setPrevScene(key);
      } else {
        setPrevScene((params.from as string) || 'newCreate');
      }
    }
    pageVisitMap[page] = true;
    setPage(page);
    setPageParams(params);
    moduleVisitMap[moduleName] = true;
    setActiveModule(moduleName);

    setCachedTabs({ moduleName, page, params });

    const matchMenu = [...menuData].some(menu => menu.children?.some(i => i.key === page));
    const getPageKey = () => {
      switch (page) {
        case 'autoMarketTaskDetail':
        case 'autoMarketTaskEdit':
          return 'index';
        case 'whatsAppJobReport':
        case 'whatsAppJobEdit':
          return 'whatsAppJob';
        case 'personalJobWhatsAppDetail':
          return 'pernsonalJobWhatsApp';
        case 'addressBookGroupDetail':
        case 'addressBookSourceDetail':
        case 'addressHistoryIndex':
        case 'addressHistoryDetail':
        case 'addressPublicHistoryIndex':
        case 'addressPublicHistoryDetail':
          return 'addressBookIndex';
        case 'createMarketBulk':
        case 'marketBulkDetail':
        case 'marketBulk':
          return 'marketBulk';
        case 'waJoinGroupDetail':
          return 'marketWaGroupHistory';
        default:
          return 'index';
      }
    };
    setActiveMenuKey(matchMenu ? page : getPageKey());
    // 记录返回页面

    if (page !== 'write' && page !== 'autoMarketTaskEdit') {
      if (systemApi.isWebWmEntry()) {
        location.hash.includes(routerWord) && setLastPage(location.hash);
      } else {
        setLastPage(location.hash);
      }
    }
  }, [location, menuData]);
  useEffect(() => {
    if (!location.hash && isFreeVersionUser) {
      navigate('#mailbox?page=mailbox');
    }
  }, [location, isFreeVersionUser]);

  const goTemplateAdd = (templateId?: string, content?: string) => {
    setTemplateId(templateId || '');
    setTempContent(content || '');
    navigate('#edm?page=templateAddModal');
  };

  const goMailTemplate = (refresh?: boolean) => {
    // setTemplateId('');
    navigate('#edm?page=mailTemplate');
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

  const renderContentWaimao = (key: string, qs: Record<string, any>) => {
    const map: Record<string, ReactNode> = {
      index: pageVisitMap['index'] ? (
        <Guide code="edm">
          <TopNotification />
          <SendedMarketing qs={qs} />
        </Guide>
      ) : null,
      detail: pageVisitMap['detail'] ? <EdmDetail qs={qs} /> : null,
      product: null,
      drafts: pageVisitMap['drafts'] ? (
        <Guide code="edm">
          <TopNotification />
          <Draft qs={qs} />
        </Guide>
      ) : null,
      contact: pageVisitMap['contact'] ? <Contact qs={qs} /> : null, // 10.31 版本隐藏
      write: pageVisitMap['write'] ? (
        <>
          <TopNotification />
          <MarketingRoot qs={qs} back={back} key={prevScene} />
        </>
      ) : null,
      blacklist: pageVisitMap['blacklist'] ? <Blacklist /> : null,
      autoMarketTask: pageVisitMap['autoMarketTask'] ? (
        <>
          <TopNotification />
          <AutoMarketTask />
        </>
      ) : null,
      autoMarketTaskDetail: pageVisitMap['autoMarketTaskDetail'] ? <AutoMarketTaskDetail /> : null,
      autoMarketTaskEdit: pageVisitMap['autoMarketTaskEdit'] ? <AutoMarketTaskEdit qs={qs} /> : null,
      customerBookList: pageVisitMap['customerBookList'] ? <CustomerManage /> : null,
      customerGrade: pageVisitMap['customerGrade'] ? <CustomerGradeManage /> : null,
      // aiHosting: <AIHosting />,
      // 多域名营销
      // 多域名营销单独入口于1010版本下线
      // senderRotateList: <SenderRotateList qs={qs} />,
      warmup: pageVisitMap['warmup'] ? (
        <>
          <TopNotification />
          <WarmUpPage />
        </>
      ) : null,
      addressContactList: pageVisitMap['addressContactList'] ? <AddressContactListPage qs={qs} /> : null,
      addressBookIndex: pageVisitMap['addressBookIndex'] ? (
        <>
          <TopNotification />
          <AddressBookIndex />
        </>
      ) : null,
      addressBookOpenSea: pageVisitMap['addressBookOpenSea'] ? (
        <Guide code="edm">
          <AddressBookOpenSea />
        </Guide>
      ) : null,
      addressBookDatastat: pageVisitMap['addressBookDatastat'] ? (
        <Guide code="edm">
          <TopNotification />
          <AddressBookDatastat qs={qs} />
        </Guide>
      ) : null,
      addressBookGroupDetail: pageVisitMap['addressBookGroupDetail'] ? <AddressBookGroupDetail qs={qs} /> : null,
      addressBookSourceDetail: pageVisitMap['addressBookSourceDetail'] ? <AddressBookSourceDetail qs={qs} /> : null,
      addressPublicHistoryIndex: pageVisitMap['addressPublicHistoryIndex'] ? <AddressBookPublicHistoryIndex /> : null,
      addressPublicHistoryDetail: pageVisitMap['addressPublicHistoryDetail'] ? <AddressBookPublicHistoryDetail qs={qs} /> : null,
      addressHistoryIndex: pageVisitMap['addressHistoryIndex'] ? <AddressHistoryIndex qs={qs} /> : null,
      addressHistoryDetail: pageVisitMap['addressHistoryIndex'] ? <AddressHistoryDetail qs={qs} /> : null,
      mailTemplate: pageVisitMap['mailTemplate'] ? (
        <Guide code="edm">
          <TopNotification />
          <MailTemplate goTemplateAdd={goTemplateAdd} />
        </Guide>
      ) : null,
      templateAddModal: pageVisitMap['templateAddModal'] ? <TemplateAddModal templateId={templateId} goMailTemplate={goMailTemplate} content={tempContent} /> : null,

      labelManage: pageVisitMap['labelManage'] ? <LabelManager /> : null,
      customerDuplicateCheck: pageVisitMap['customerDuplicateCheck'] ? <CustomerDuplicateCheck /> : null,
      customer: pageVisitMap['customer'] ? <Client /> : null,
      customerOpenSea: pageVisitMap['customerOpenSea'] ? <CustomerOpenSea /> : null,
      business: pageVisitMap['business'] ? <Business /> : null,
      clue: pageVisitMap['clue'] ? <Clue /> : null,
      seaClue: pageVisitMap['seaClue'] ? <SeaClue /> : null,
      autoRecommend: pageVisitMap['autoRecommend'] ? <AutoRecommend /> : null,
      customRecommend: pageVisitMap['customRecommend'] ? <ManualRecommend /> : null,
      recommendOperateList: pageVisitMap['recommendOperateList'] ? <RecommendOplist /> : null,
      authorization: pageVisitMap['authorization'] ? <Authorization /> : null,
      extension: pageVisitMap['extension'] ? <Extension /> : null,
      importRecord: pageVisitMap['importRecord'] ? <ImportRecord /> : null,
      dataTransfer: pageVisitMap['dataTransfer'] ? <DataTransfer /> : null,
      // facebook: modules?.['GLOBAL_SEARCH'] ? <FaceBookSearchPage /> : <NoPermissionPage />,

      // 企业设置
      variables: pageVisitMap['variables'] ? <VariableSetting /> : null,
      saleStage: pageVisitMap['saleStage'] ? <SaleStage /> : null,
      quota: pageVisitMap['quota'] ? <EdmQuota /> : null,
      marketingSetting: pageVisitMap['marketingSetting'] ? <MarketingSetting /> : null,
      mailTag: pageVisitMap['mailTag'] ? <MailTagSetting /> : null,
      checkField: pageVisitMap['checkField'] ? <CheckField /> : null,
      insertWhatsApp: pageVisitMap['insertWhatsApp'] ? (
        <WaProviderV2>
          <InsertWhatsApp />
        </WaProviderV2>
      ) : null,
      waOperateLog: pageVisitMap['waOperateLog'] ? <WaOperateLog /> : null,
      systemTaskConfig: pageVisitMap['systemTaskConfig'] ? <SystemTaskConfig /> : null,
      authorizationEmail: pageVisitMap['authorizationEmail'] ? <AuthWhitelist /> : null,
      salesPitch: pageVisitMap['salesPitch'] ? <SalesPitchPage /> : null,
      phase: pageVisitMap['phase'] ? <SalesPitchPage /> : null,
      openSeaSetting: pageVisitMap['openSeaSetting'] ? <OpenSeaSetting /> : null,
      noticeSetting: pageVisitMap['noticeSetting'] ? <NoticeSetting /> : null,
      fieldSetting: pageVisitMap['fieldSetting'] ? <FieldSetting /> : null,
      // 企业设置——权限
      members: pageVisitMap['members'] ? props?.isAdmin ? <RoleMembers /> : <NoPermissionPage /> : null,
      rolePermissions: pageVisitMap['rolePermissions'] ? props?.isAdmin ? <RoleManager /> : <NoPermissionPage /> : null,
      roleDetail: pageVisitMap['roleDetail'] ? v1v2 === 'v2' ? <RoleDetailV2 qs={qs} /> : <RoleDetail qs={qs} /> : null,
      menuSetting: pageVisitMap['menuSetting'] ? (
        props?.isAdmin ? (
          v1v2 === 'v2' ? (
            <MenuManageV2 />
          ) : (
            <MenuManage v1v2={v1v2 as 'NONE' | 'v1'} />
          )
        ) : (
          <NoPermissionPage />
        )
      ) : null,

      // Wa群发
      multiAccountMessage: pageVisitMap['multiAccountMessage'] ? <MultiAccountMessage /> : null,
      marketBulk: pageVisitMap['marketBulk'] ? <MarketBulk /> : null,
      createMarketBulk: pageVisitMap['createMarketBulk'] ? <CreateMarketBulk /> : null,
      marketBulkDetail: pageVisitMap['marketBulkDetail'] ? <MarketBulkDetail qs={qs} /> : null,
      marketSearchWhatsApp: pageVisitMap['marketSearchWhatsApp'] ? <MarketSearchWhatsApp qs={qs} /> : null,
      marketWaGroupHistory: pageVisitMap['marketWaGroupHistory'] ? <MarketWaGroupHistory qs={qs} /> : null,
      waJoinGroupDetail: pageVisitMap['waJoinGroupDetail'] ? <JoinGroupDetail qs={qs} /> : null,
      // WhatsApp
      whatsAppAiSearch: pageVisitMap['whatsAppAiSearch'] ? (
        <Guide code="whatsApp">
          <SNSContainer page="whatsAppAiSearch">
            <WhatsAppAiSearch />
          </SNSContainer>
        </Guide>
      ) : null,
      whatsAppJob: pageVisitMap['whatsAppJob'] ? (
        <BspContainer
          IB={
            <Guide code="whatsApp">
              <SNSContainer page="whatsAppJob">
                <WhatsAppJob />
              </SNSContainer>
            </Guide>
          }
          NX={
            <WaProviderV2>
              <Guide code="whatsApp">
                <WaAgreementContainer>
                  <WaAdContainerV2 type="whatsAppJob">
                    <WaAllotContainerV2 key="whatsAppJob">
                      <WhatsAppJobV2 />
                    </WaAllotContainerV2>
                  </WaAdContainerV2>
                </WaAgreementContainer>
              </Guide>
            </WaProviderV2>
          }
        />
      ) : null,
      whatsAppJobEdit: pageVisitMap['whatsAppJobEdit'] ? (
        <BspContainer
          IB={
            <Guide code="whatsApp">
              <SNSContainer page="whatsAppJob">
                <WhatsAppJobEdit qs={qs} />
              </SNSContainer>
            </Guide>
          }
          NX={
            <WaProviderV2>
              <Guide code="whatsApp">
                <WaAgreementContainer>
                  <WaAdContainerV2 type="whatsAppJob">
                    <WaAllotContainerV2 key="whatsAppJobEdit">
                      <WhatsAppJobEditV2 qs={qs} />
                    </WaAllotContainerV2>
                  </WaAdContainerV2>
                </WaAgreementContainer>
              </Guide>
            </WaProviderV2>
          }
        />
      ) : null,
      whatsAppJobReport: pageVisitMap['whatsAppJobReport'] ? (
        <BspContainer
          IB={
            <Guide code="whatsApp">
              <SNSContainer page="whatsAppJob">
                <WhatsAppJobReport qs={qs} />
              </SNSContainer>
            </Guide>
          }
          NX={
            <WaProviderV2>
              <Guide code="whatsApp">
                <WaAgreementContainer>
                  <WaAdContainerV2 type="whatsAppJob">
                    <WaAllotContainerV2 key="whatsAppJobReport">
                      <WhatsAppJobReportV2 qs={qs} />
                    </WaAllotContainerV2>
                  </WaAdContainerV2>
                </WaAgreementContainer>
              </Guide>
            </WaProviderV2>
          }
        />
      ) : null,
      whatsAppMessage: pageVisitMap['whatsAppMessage'] ? (
        <BspContainer
          IB={
            <Guide code="whatsApp">
              <SNSContainer page="whatsAppMessage">
                <WhatsAppMessage qs={qs} />
              </SNSContainer>
            </Guide>
          }
          NX={
            <WaProviderV2>
              <Guide code="whatsApp">
                <WaAgreementContainer>
                  <WaAdContainerV2 type="whatsAppMessage">
                    <WaAllotContainerV2 key="whatsAppMessage">
                      <WhatsAppMessageV2 qs={qs} />
                    </WaAllotContainerV2>
                  </WaAdContainerV2>
                </WaAgreementContainer>
              </Guide>
            </WaProviderV2>
          }
        />
      ) : null,
      whatsAppTemplate: pageVisitMap['whatsAppTemplate'] ? (
        <BspContainer
          IB={
            <Guide code="whatsApp">
              <SNSContainer page="whatsAppTemplate">
                <WhatsAppTemplate />
              </SNSContainer>
            </Guide>
          }
          NX={
            <WaProviderV2>
              <Guide code="whatsApp">
                <WaAgreementContainer>
                  <WaAdContainerV2 type="whatsAppTemplate">
                    <WaAllotContainerV2 key="whatsAppTemplate">
                      <WhatsAppTemplateV2 />
                    </WaAllotContainerV2>
                  </WaAdContainerV2>
                </WaAgreementContainer>
              </Guide>
            </WaProviderV2>
          }
        />
      ) : null,
      whatsAppStatistic: pageVisitMap['whatsAppStatistic'] ? (
        <BspContainer
          IB={
            <Guide code="whatsApp">
              <SNSContainer page="whatsAppStatistic">
                <WhatsAppStatistic qs={qs} />
              </SNSContainer>
            </Guide>
          }
          NX={
            <WaProviderV2>
              <Guide code="whatsApp">
                <WaAgreementContainer>
                  <WaAdContainerV2 type="whatsAppStatistic">
                    <WaAllotContainerV2 key="whatsAppStatistic">
                      <WhatsAppStatisticV2 />
                    </WaAllotContainerV2>
                  </WaAdContainerV2>
                </WaAgreementContainer>
              </Guide>
            </WaProviderV2>
          }
        />
      ) : null,
      whatsAppRegister: pageVisitMap['whatsAppRegister'] ? (
        <WaProviderV2>
          <ProxyCheckContainer resource="https://www.facebook.com/favicon.ico">
            <WhatsAppRegisterV2 qs={qs} />
          </ProxyCheckContainer>
        </WaProviderV2>
      ) : null,
      wa: pageVisitMap['wa'] ? <WhatsAppChat qs={qs} /> : null,
      waChatList: pageVisitMap['waChatList'] ? <WhatsAppChat qs={qs} /> : null,
      materielShareList: pageVisitMap['materielShareList'] ? <MaterielShareList /> : null,
      materielVisitList: pageVisitMap['materielVisitList'] ? <MaterielVisitList /> : null,
      materielShareEdit: pageVisitMap['materielShareEdit'] ? <MaterielShareEdit qs={qs} /> : null,
      materielFileList: pageVisitMap['materielFileList'] ? <MaterielFileList /> : null, // 文件管理
      contactGroup: pageVisitMap['contactGroup'] ? <WhatsAppChat qs={qs} /> : null,
      workloadStats: pageVisitMap['workloadStats'] ? <WorkloadStats /> : null,
      pernsonalWhatsapp: pageVisitMap['pernsonalWhatsapp'] ? (
        <Guide code="whatsApp">
          <SNSContainer>
            <PersonalWhatsapp qs={qs} />
          </SNSContainer>
        </Guide>
      ) : null,
      pernsonalJobWhatsApp: pageVisitMap['pernsonalJobWhatsApp'] ? (
        <Guide code="whatsApp">
          <SNSContainer>
            <PersonalJobWhatsApp qs={qs} />
          </SNSContainer>
        </Guide>
      ) : null,
      personalJobWhatsAppDetail: pageVisitMap['personalJobWhatsAppDetail'] ? (
        <Guide code="whatsApp">
          <SNSContainer>
            <PersonalJobWhatsAppDetail qs={qs} />
          </SNSContainer>
        </Guide>
      ) : null,

      // 个人设置
      security: pageVisitMap['security'] ? <AccountConfig isVisible /> : null,
      emailSetting: pageVisitMap['emailSetting'] ? <MailConfig isVisible /> : null,
      shortcutSetting: pageVisitMap['shortcutSetting'] ? <KeyboardConfig isVisible /> : null,
      sysSetting: pageVisitMap['sysSetting'] ? <SystemConfig isVisible /> : null,

      // 站点管理
      mySite: pageVisitMap['mySite'] ? (
        <Guide code="site">
          <MySite />
        </Guide>
      ) : null,
      market: pageVisitMap['market'] ? (
        <Guide code="site">
          <Market />
        </Guide>
      ) : null,
      stat: pageVisitMap['stat'] ? (
        <Guide code="site">
          <SiteStat />
        </Guide>
      ) : null,
      statDetails: pageVisitMap['statDetails'] ? (
        <Guide code="site">
          <StatDetails qs={qs} />
        </Guide>
      ) : null,
      domain: pageVisitMap['domain'] ? (
        <Guide code="site">
          <DomainBind qs={qs as any} />
        </Guide>
      ) : null,
      domainDetail: pageVisitMap['domainDetail'] ? (
        <Guide code="site">
          <DomainDetail qs={qs as any} />
        </Guide>
      ) : null,
      seo: pageVisitMap['seo'] ? (
        <Guide code="site">
          <SeoConfig qs={qs as any} />
        </Guide>
      ) : null,
      domainSearch: pageVisitMap['domainSearch'] ? (
        <Guide code="site">
          <DomainSearch qs={qs as any} />
        </Guide>
      ) : null,
      domainSearchResult: pageVisitMap['domainSearchResult'] ? (
        <Guide code="site">
          <DomainSearchResult qs={qs as any} />
        </Guide>
      ) : null,
      domainPurchaseConfirm: pageVisitMap['domainPurchaseConfirm'] ? (
        <Guide code="site">
          <DomainPurchaseConfirm qs={qs as any} />
        </Guide>
      ) : null,
      domainPurchasePay: pageVisitMap['domainPurchasePay'] ? (
        <Guide code="site">
          <DomainPurchasePay qs={qs as any} />
        </Guide>
      ) : null,
      siteCustomer: pageVisitMap['siteCustomer'] ? (
        <Guide code="site">
          <SiteCustomer />
        </Guide>
      ) : null,
      myDomain: pageVisitMap['myDomain'] ? (
        <Guide code="site">
          <MyDomain />
        </Guide>
      ) : null,
      orderManage: pageVisitMap['orderManage'] ? (
        <Guide code="site">
          <OrderManage />
        </Guide>
      ) : null,
      infoTemplate: pageVisitMap['infoTemplate'] ? (
        <Guide code="site">
          <InfoTemplate />
        </Guide>
      ) : null,
      createInfoTemplate: pageVisitMap['createInfoTemplate'] ? (
        <Guide code="site">
          <CreateInfoTemplate qs={qs as any} />
        </Guide>
      ) : null,
      checkInfoTemplate: pageVisitMap['checkInfoTemplate'] ? (
        <Guide code="site">
          <CheckInfoTemplate qs={qs as any} />
        </Guide>
      ) : null,
      purchaseCert: pageVisitMap['purchaseCert'] ? (
        <Guide code="site">
          <PurchaseCert qs={qs as any} />
        </Guide>
      ) : null,
      recordDomain: pageVisitMap['recordDomain'] ? (
        <Guide code="site">
          <DomainRecord qs={qs as any} />
        </Guide>
      ) : null,
      myCert: pageVisitMap['myCert'] ? (
        <Guide code="site">
          <MyCert />
        </Guide>
      ) : null,
      articleList: pageVisitMap['articleList'] ? (
        <Guide code="site">
          <ArticleList />
        </Guide>
      ) : null,
      articleEdit: pageVisitMap['articleEdit'] ? (
        <Guide code="site">
          <ArticleEdit qs={qs as any} />
        </Guide>
      ) : null,
      categoryList: pageVisitMap['categoryList'] ? (
        <Guide code="site">
          <ArticleCategory />
        </Guide>
      ) : null,
      brand: pageVisitMap['brand'] ? (
        <Guide code="site">
          <BrandBuilding />
        </Guide>
      ) : null,
      trafficDelivery: pageVisitMap['trafficDelivery'] ? (
        <Guide code="site">
          <TrafficDelivery />
        </Guide>
      ) : null,

      // facebook
      facebookMessage: pageVisitMap['facebookMessage'] ? (
        <SNSContainer>
          <FacebookMessage qs={qs} />
        </SNSContainer>
      ) : null,
      facebookPages: pageVisitMap['facebookPages'] ? (
        <SNSContainer>
          <FacebookPages qs={qs} />
        </SNSContainer>
      ) : null,
      facebookPosts: pageVisitMap['facebookPosts'] ? (
        <SNSContainer>
          <FacebookPosts qs={qs} />
        </SNSContainer>
      ) : null,

      // 任务中心
      systemTask: pageVisitMap['systemTask'] ? <SystemTask name="systemTask" /> : null, // 系统任务
      noviceTask: pageVisitMap['noviceTask'] ? <NoviceTask name="noviceTask" /> : null, // 新手任务
      'customer-setting': pageVisitMap['customer-setting'] ? <SiriusL2cSetting key="customer" /> : null,
      'order-setting': pageVisitMap['order-setting'] ? <SiriusL2cSetting key="order" /> : null,
      'customer_opportunity-setting': pageVisitMap['customer_opportunity-setting'] ? <SiriusL2cSetting key="customer_opportunity" /> : null,
      'leads-setting': pageVisitMap['leads-setting'] ? <SiriusL2cSetting key="leads" /> : null,
      'product-setting': pageVisitMap['product-setting'] ? <SiriusL2cSetting key="product" /> : null,
      'platform_product-setting': pageVisitMap['platform_product-setting'] ? <SiriusL2cSetting key="platform-product" /> : null,
      'supplier-setting': pageVisitMap['supplier-setting'] ? <SiriusL2cSetting key="supplier" /> : null,
      'exchange_rate-setting': pageVisitMap['exchange_rate-setting'] ? <SiriusL2cSetting key="exchange_rate" /> : null,

      // 海外社媒
      snsMarketingTaskEdit: pageVisitMap['snsMarketingTaskEdit'] ? <MarketingTaskCreate qs={qs} /> : null,
      snsMarketingTask: pageVisitMap['snsMarketingTask'] ? <SnsMarketingTaskList /> : null,
      snsPostManage: pageVisitMap['snsPostManage'] ? <SnsPostManage /> : null,
      snsAccountBinding: pageVisitMap['snsAccountBinding'] ? <SnsAccountBinding /> : null,
      snsSendPost: pageVisitMap['snsSendPost'] ? <SnsSendPost /> : null,
      snsCalendar: pageVisitMap['snsCalendar'] ? <SnsCalendar /> : null,
      snsMessage: pageVisitMap['snsMessage'] ? <SnsMessage /> : null,
      snsMarketingTaskDetail: pageVisitMap['snsMarketingTaskDetail'] ? <SnsTaskDetail qs={qs} /> : null,
      snsGlobalDataAnalysis: pageVisitMap['snsGlobalDataAnalysis'] ? <SnsGlobalData qs={qs} /> : null,
      snsAccountDataAnalysis: pageVisitMap['snsAccountDataAnalysis'] ? <SnsAccountData qs={qs} /> : null,

      // 专属邮件询盘
      emailInquiry: pageVisitMap['emailInquiry'] ? <EmailInquiry /> : null,
    };
    const wmDataRouteMap: Record<string, ReactNode> = {
      customs: pageVisitMap['customs'] ? (
        <Guide code="wmData">
          {modules?.CUSTOMS ? (
            <KeywordsProvider>
              <CustomsData
                defaultTabCompanyType={[
                  {
                    label: '采购商',
                    value: 'buysers',
                  },
                  {
                    label: '供应商',
                    value: 'suppliers',
                  },
                  {
                    value: 'customs',
                    label: '海关贸易数据',
                  },
                ]}
                defaultCustomsDataType="buysers"
                defaultContentTab={[
                  {
                    label: '按产品',
                    value: 'goodsShipped',
                  },
                  {
                    label: '按公司',
                    value: 'company',
                  },
                  {
                    value: 'hsCode',
                    label: '按HSCode',
                  },
                  {
                    value: 'port',
                    label: '按港口',
                  },
                ]}
              />
            </KeywordsProvider>
          ) : (
            <NoPermissionPage />
          )}
        </Guide>
      ) : null,
      star: pageVisitMap['star'] ? <Guide code="wmData">{modules?.CUSTOMS ? <Star /> : <NoPermissionPage />}</Guide> : null,
      forwarder: pageVisitMap['forwarder'] ? (
        isForwarder ? (
          <Guide code="wmData">
            {/* todo 这里要权限控制展示 权限名字未定 */}
            <KeywordsProvider>
              <ForwarderData />
            </KeywordsProvider>
          </Guide>
        ) : (
          <NoPermissionPage />
        )
      ) : null,
      industryCommerceSearch: pageVisitMap['industryCommerceSearch'] ? (
        isForwarder ? (
          <Guide code="wmData">
            {/* todo 这里要权限控制展示 权限名字未定 */}
            <KeywordsProvider>
              <SearchIframe ifranmeUrlType={1} key="industryCommerceSearch" />
            </KeywordsProvider>
          </Guide>
        ) : (
          <NoPermissionPage />
        )
      ) : null,
      intelligentSearch: pageVisitMap['intelligentSearch'] ? (
        isForwarder ? (
          <Guide code="wmData">
            {/* todo 这里要权限控制展示 权限名字未定 */}
            <KeywordsProvider>
              <SearchIframe ifranmeUrlType={2} key="intelligentSearch" />
            </KeywordsProvider>
          </Guide>
        ) : (
          <NoPermissionPage />
        )
      ) : null,
      globalSearch: pageVisitMap['globalSearch'] ? (
        <Guide code="wmData">
          {modules?.GLOBAL_SEARCH ? (
            <KeywordsProvider>
              <SearchPage defautQuery={query && query.length > 0 ? { query } : undefined} detailDrawId={detailDrawId} queryType={queryType} />
            </KeywordsProvider>
          ) : (
            <NoPermissionPage />
          )}
        </Guide>
      ) : null,
      keywords: pageVisitMap['keywords'] ? (
        <Guide code="wmData">
          {modules?.GLOBAL_SEARCH ? <KeywordsProvider>{newProductSubEnable ? <NewKeywordsPage /> : <KeywordsSubscribe />}</KeywordsProvider> : <NoPermissionPage />}
        </Guide>
      ) : null,
      wca: pageVisitMap['wca'] ? isForwarder ? <WcaSearch /> : <NoPermissionPage /> : null,
      contomfair: pageVisitMap['contomfair'] ? modules?.GLOBAL_SEARCH ? <ComTomFairSearch /> : <NoPermissionPage /> : null,
      lbs: pageVisitMap['lbs'] ? modules?.GLOBAL_SEARCH ? <LbsSearch /> : <NoPermissionPage /> : null,
      linkedin: pageVisitMap['linkedin'] ? modules?.GLOBAL_SEARCH ? <LinkedInSearchPage /> : <NoPermissionPage /> : null,
      facebook: pageVisitMap['facebook'] ? modules?.GLOBAL_SEARCH ? <FaceBookSearchPage /> : <NoPermissionPage /> : null,
      intelligent: pageVisitMap['intelligent'] ? modules?.GLOBAL_SEARCH ? <IntelligentSearch /> : <NoPermissionPage /> : null,
      smartrcmd: pageVisitMap['smartrcmd'] ? modules?.GLOBAL_SEARCH ? <SmartRcmd /> : <NoPermissionPage /> : null,
      tradeAnalysis: pageVisitMap['tradeAnalysis'] ? (
        modules?.GLOBAL_SEARCH ? (
          <TradeProvider>
            <TradeAnalysis />
          </TradeProvider>
        ) : (
          <NoPermissionPage />
        )
      ) : null,
      beltRoad: pageVisitMap['beltRoad'] ? (
        modules?.GLOBAL_SEARCH ? (
          <KeywordsProvider>
            <BR />
          </KeywordsProvider>
        ) : (
          <NoPermissionPage />
        )
      ) : null,
      searchPeers: pageVisitMap['searchPeers'] ? (
        isForwarder ? (
          <Guide code="wmData">
            <SearchPeers />
          </Guide>
        ) : (
          <NoPermissionPage />
        )
      ) : null,
    };
    const maps = {
      ...map,
      ...wmDataRouteMap,
    };
    const curPage = getCurPageByUrl();
    return (
      <>
        {maps[key]}
        {/* {ShowWeeklyTaskPages.includes(curPage) && notExistGlobalModel && <MarketingWeeklyTask key={curPage} />} */}
      </>
    );
  };

  const isWorktableActive = useMemo(() => {
    if (location.hash.indexOf('#worktable') > -1) {
      return true;
    }
    return false;
  }, [location]);

  const renderContentLX = (key: string) => {
    const map: Record<string, ReactNode> = {
      lxContact: pageVisitMap['lxContact'] ? <LxContact name="contact" /> : null,
      schedule: pageVisitMap['schedule'] ? <Schedule name="schedule" active /> : null,
      disk: pageVisitMap['disk'] ? <Disk name="disk" tag={getIn18Text('YUNWENDANG')} icon={DiskTabIcon} /> : null,
      // setting: moduleVisitMap['setting'] ? <Setting name="setting" /> : null,
      worktable: pageVisitMap['worktable'] ? <Worktable name="worktable" active={isWorktableActive} /> : null,
      // apps: moduleVisitMap['apps'] ? <Apps name="apps" /> : null,
    };
    return map[key];
  };

  useEffect(() => {
    if (props.active && isIndirect(page)) {
      appDispatch(getPrivilegeAsync());
      appDispatch(getVersionAsync());
      appDispatch(getCompanyCheckRules());

      // ?todo
      appDispatch(getModuleDataPrivilegeAsync('EDM'));
    }
    appDispatch(getMenuSettingsAsync());
    appDispatch(getMyRolesAsync());
  }, [props.active]);

  // let isNotified = false;
  // useEffect(() => {
  //   // checkUpgrade
  //   const upgradeWebCheckHandle = {
  //     eventPeriod: 'long',
  //     seq: 0,
  //     handler: async ev => {
  //       // if (ev.seq % 2 === 1 && ev.seq > 0) return;
  //
  //       checkVersion();
  //     },
  //     id: 'upgradeWebCheck',
  //   };
  //
  //   checkVersion();
  //   systemApi.intervalEvent(upgradeWebCheckHandle);
  // }, []);

  const UpgradeWebComp = useMemo(() => <UpgradeWeb />, []);

  // const checkVersion = async () => {
  //   const url = config('newUpgradeWeb') as string;
  //
  //   return httpApi
  //     .get(url, {
  //       appName: 'lingxibanggong-waimao',
  //       version: '1.1.1',
  //     })
  //     .then(res => res.data)
  //     .then(res => {
  //       const already = JSON.parse(localStorage.getItem('newUpgradeWeb') || '{}');
  //       if (res?.data?.version !== already?.version) {
  //         if (isNotified) {
  //           return;
  //         }
  //         isNotified = true;
  //         Modal.info({
  //           title: '外贸通更新啦~',
  //           width: 500,
  //           className: 'upgradeweb',
  //           hideCancel: true,
  //           okText: '我知道了',
  //           icon: null,
  //           // content: `This modal will be destroyed after second.`,
  //           onCancel: () => {
  //             isNotified = false;
  //           },
  //           content: res?.data?.popupDescriptionList?.map(e => <p>{e}</p>),
  //           onOk: () => {
  //             // setItem
  //             localStorage.setItem('newUpgradeWeb', JSON.stringify(res?.data));
  //             window?.location?.reload();
  //           },
  //         });
  //       }
  //     })
  //     .catch(err => {
  //       console.log(err);
  //     });
  // };

  useEffect(() => {
    checkIsCustomerModule(page);
  }, [page]);

  // write
  const back = () => {
    if (lastPage) {
      navigate(lastPage);
    } else {
      navigate(`${routerWord}?page=index`);
    }
  };

  const fetchTableData = () => {};
  const { state: customerBaseState, dispatch: customerBaseDispatch } = useBaseInfo();
  const handleSlot = () => {
    trackApi.track('waimao_exhibition_web_top', { action: 'go_to_contomfair' });
    navigate(`#${TopMenuPath.wmData}?page=contomfair`);
  };

  const noviceTaskActions = useActions(NoviceTaskActions);

  useEffect(() => {
    const id = eventApi.registerSysEventObserver('NoviceTaskRegister', {
      func: event => {
        noviceTaskActions.registerNoviceTask(event.eventData);
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('NoviceTaskRegister', id);
    };
  }, []);

  useEffect(() => {
    const id = eventApi.registerSysEventObserver('NoviceTaskFinished', {
      func: event => {
        const { taskName, shouldRemind } = event.eventData;

        if (shouldRemind) {
          Modal.success({
            title: `恭喜你完成「${taskName}」，是否继续完成其他新手引导？`,
            icon: <i className="icon success-icon" />,
            cancelText: '结束',
            okText: '继续完成',
            onCancel: showNoviceTaskCloseTip,
            onOk: () => navigate('#noviceTask?page=noviceTask'),
          });
        } else {
          Modal.success({
            title: `恭喜你完成「${taskName}」！`,
            icon: <i className="icon success-icon" />,
            hideCancel: true,
            okText: '知道了',
          });
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('NoviceTaskFinished', id);
    };
  }, []);
  const menuVersion = useVersionCheck();
  const isV2 = menuVersion === 'v2';
  const menuDataType = getMenuDataType(isV2);
  return (
    <>
      {isIndirect(page) ? (
        <ConfigProvider locale={zhCN}>
          <GlobalProvider>
            <PageContentLayout className={classNames([style.renderContainer, isCustomerModule && style.customerGlobalStyle])}>
              <customerContext.Provider value={{ value: { state: customerBaseState, dispatch: customerBaseDispatch, fetchTableData } }}>
                {/* {current?.component || renderContentWaimao(page, pageParams)} */}
                {/*  sidebarMenuVisible  false: 隐藏crm内部菜单栏 */}
                <UnitableCrm name="产品管理" hidden={!activeModule.includes('unitable-crm')} sidebarMenuVisible={!isV2} menuDataType={menuDataType} />
                {cachedTabs
                  .filter(tab => isIndirect(tab.page))
                  .map(tab => (
                    <div key={tab.tab} style={{ display: activeModule === tab.tab ? '' : 'none', width: '100%', height: '100%' }}>
                      {tab.page !== 'index' && renderContentWaimao(tab.page, tab.query)}
                      {hasSMMessagePermission ? (
                        <AliveScope>
                          {page === 'aiHosting' && <TopNotification />}
                          <AIHosting createMode={false} visible={page === 'aiHosting'} />
                        </AliveScope>
                      ) : (
                        <>{page === 'aiHosting' && <NoPermissionPage />}</>
                      )}
                      {hasSMMessagePermission ? (
                        <AliveScope>
                          {page === 'aiHostingNew' && <TopNotification />}
                          <AIHosting createMode visible={page === 'aiHostingNew'} />
                        </AliveScope>
                      ) : (
                        <>{page === 'aiHostingNew' && <NoPermissionPage />}</>
                      )}
                      <div
                        style={{
                          height: '100%',
                          display: page !== 'index' ? 'none' : 'inline',
                        }}
                      >
                        {hasSMMessagePermission ? (
                          <Guide code="edm">
                            {page === 'index' ? <TopNotification /> : <></>}
                            <SendedMarketing visiable={tab.page === 'index'} qs={tab.query} />
                            {/* {page === 'index' && notExistGlobalModel && <MarketingWeeklyTask key="index" />} */}
                          </Guide>
                        ) : (
                          <NoPermissionPage />
                        )}
                      </div>
                    </div>
                  ))}
              </customerContext.Provider>
            </PageContentLayout>
          </GlobalProvider>
        </ConfigProvider>
      ) : (
        <>
          {/* {current?.component || renderContentLX(page)} */}
          {cachedTabs
            .filter(tab => !isIndirect(tab.page))
            .map(tab => (
              <div
                key={tab.page}
                style={{
                  display: activeModule === tab.tab ? 'flex' : 'none',
                  width: tab.page !== 'message' ? '100%' : 'auto',
                  height: '100%',
                  flex: '1',
                  overflow: 'hidden',
                }}
              >
                {renderContentLX(tab.page)}
              </div>
            ))}
        </>
      )}
      <div style={{ display: page === 'mailbox' ? 'block' : 'none' }}>
        {pageVisitMap['mailbox'] && <MailBox name="mailbox" tag={getIn18Text('YOUXIANG')} icon={MailBoxIcon} />}
      </div>
      <div style={{ display: page === 'message' ? 'block' : 'none', width: '100%' }}>
        {pageVisitMap['message'] && <IM name="message" tag={getIn18Text('XIAOXI')} icon={IMIcon} />}
      </div>
      <GlobalAdvertNotification />
      {/* {version !== 'WEBSITE' && version !== 'FREE' && <NoviceTaskEntry />} */}
      {version === 'FASTMAIL_EXPIRED' && (
        <Modal
          getContainer={false}
          maskStyle={{
            top: 54,
          }}
          wrapClassName={style.expired}
          visible={
            version === 'FASTMAIL_EXPIRED' &&
            (location.hash.includes('#wmData') || location.hash.includes('#intelliMarketing') || location.hash.includes('unitable') || location.hash.includes('#site'))
          }
          title={null}
          footer={null}
          keyboard={false}
          maskClosable={false}
          closable={false}
        >
          <p>您的外贸通已过期， 该功能暂时无法使用。 续费后可以继续正常使用该功能，您可以联系您的服务专员进行续费</p>
        </Modal>
      )}
      <MaterielFileUploader />
      <VideoDrawer />
      {/* <MarketingModalList /> */}
      {UpgradeWebComp}
    </>
  );
};

export { RenderContainer };
