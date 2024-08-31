import React, { useState, useEffect, useMemo, useContext, useRef } from 'react';
import { Tabs, Button, message, Dropdown, Menu } from 'antd';
// import Lxbutton from '@web-common/components/UI/Button';
import Lxbutton from '@lingxi-common-component/sirius-ui/Button';
import lodashGet from 'lodash/get';
import {
  apiHolder,
  apis,
  SystemApi,
  ContactModel,
  EventApi,
  DataTrackerApi,
  NIMApi,
  CustomerApi,
  SuggestionGlobalAi,
  ContactAddReq,
  getIn18Text,
  inWindow,
  SocialPlatform,
} from 'api';
import classnames from 'classnames';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import CreateScheduleBox from '@web-schedule/components/CreateBox/CreateBox';
import { initDefaultMoment, getContanctObjs } from '@web-schedule/components/CreateBox/util';
import { ScheduleSyncObInitiator } from '@web-schedule/data';
import { SchedulePageEventData } from '@web-schedule/components/CreateBox/EventBody';
import { useAppSelector, ScheduleActions, useActions, ContactActions } from '@web-common/state/createStore';
import SendMailPop from '@web-contact/component/Detail/SendMailPop';
import { openSession } from '@web-im/common/navigate';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { useContactModel } from '@web-common/hooks/useContactModel';
import { ReactComponent as CaretDownOutlined } from '@/images/icons/arrow-down.svg';
import { PersonalModal } from '@web-common/components/UI/SiriusContact/personal/personalModal';
import { getMainAccount, transContactModel2ContactItem } from '@web-common/components/util/contact';
import { DEFAULT_CUSTOMER_WIDTH } from '@web-mail/hooks/useAppScale';
import { refreshContactDataByEmails } from '@web-common/state/reducer/contactReducer';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { CommonEmailList } from './component/emailList/commonList';
// import { addToExistedCustomerModal } from '@/components/Layout/Customer/NewClient/components/CreateNewClientModal/addToExistedCustomerModal';
import { PageLoading } from '@/components/UI/Loading';
import outerStyle from './index.module.scss';
import style from './header.module.scss';
import { CreateCustomerIcon, JoinCustomerIcon, AddContactIcon, SendMailIcon, SendImIcon, CreateScheduleIcon } from './component/icons';
// import { HelpInfo } from '@/components/Layout/Customer/components/sidebar/helpInfo';
import SalesPitchPageHoc from '@/components/Layout/EnterpriseSetting/salesPitch';
// import SalesPitchGuideHoc from '@/components/Layout/EnterpriseSetting/salesPitch/components/salesPitchGuide';
import { salesPitchManageTrack } from '@/components/Layout/EnterpriseSetting/salesPitch/utils/util';
// import { PrivilegeCheckForMailPlus } from '@/components/UI/PrivilegeEnhance';
import { ReactComponent as RefreshIcon } from '@/images/mailCustomerCard/refresh.svg';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { scenes } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawerLeads2';
import { SocialMedia } from './component/clueBaseInfo';
import EllipsisTooltip from '../ellipsisTooltip/ellipsisTooltip';
import { SocialPlatformType } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import { PublicMailDomainList } from '@web-edm/utils/utils';
import { UniDrawerModuleId, showUniDrawer } from '@lxunit/app-l2c-crm';
import { BusinessContactVO } from '@lxunit/app-l2c-crm/models';
import { getMailContentText } from '@web-edm/send/utils/getMailContentText';
import { CurrentMailIdContext } from '@web-mail/rightSidebar';

const { TabPane } = Tabs;

interface CommonSidebarProps {
  email: string;
  name: string;
  replyToMail?: string; // 邮件hander中真实需要回复的邮箱地址
  // visible: boolean; // 不再使用
  onClickHelp?: () => void;
  _account?: string; // 当前账号信息
  setLoading: (isLoading: boolean) => void;
  noBorder?: boolean;
}

interface Suggests {
  key: string;
  title: string;
  valKey?: string | string[];
  default?: string | any[];
}

interface displayObj {
  title: string;
  actions: Array<{
    key: string;
    label: string;
    menuKey?: string; // 下拉的key，目前就一个，有多个在拓展成数组
    menuLabel?: string; // 下拉的lebel，目前就一个，有多个在拓展成数组
    icon?: React.ReactNode;
    permisson?: {
      accessLabel: string;
      resourceLabel: string;
    };
  }>;
  suggests: Array<Suggests>;
  suggestTabName?: string;
  button?: boolean;
}

// 公海客户、陌生人、个人联系人、同事配置
// 公海客户按陌生人显示, 0715版本公海客户判断为客户,在客户组件内判断
type QueryData = Array<Suggests>;
// 默认的客户权限
const defaultPermission = {
  accessLabel: 'OP',
  resourceLabel: 'CONTACT',
};
// 默认的线索权限
const defaultCluePermission = {
  accessLabel: 'OP',
  resourceLabel: 'CHANNEL',
};

const displayActions: Record<string, displayObj> = {
  customer: {
    title: getIn18Text('GONGHAIKEHUXIANG'),
    actions: [
      {
        key: 'create_customer',
        label: getIn18Text('XINJIANKEHU'),
        icon: <CreateCustomerIcon />,
        permisson: defaultPermission,
      },
      {
        key: 'join_customer',
        label: getIn18Text('TIANJIADAOYIYOUKEHU'),
        icon: <JoinCustomerIcon />,
        permisson: defaultPermission,
      },
      {
        key: 'add_contact',
        label: getIn18Text('TIANJIATONGXUNLU'),
        icon: <AddContactIcon />,
      },
    ],
    suggests: [
      {
        key: 'external_suggests_state',
        title: getIn18Text('KEHUGENJINZHUANGTAI'),
        valKey: '',
        default: getIn18Text('XINJIAN'),
      },
      {
        key: 'external_suggests_stage',
        title: getIn18Text('KEHUJIEDUAN'),
        valKey: '',
        default: getIn18Text('QIANZAIKEHU'),
      },
      {
        key: 'external_suggests_name',
        title: getIn18Text('LIANXIRENXINGMING'),
        valKey: 'name',
      },
      {
        key: 'external_suggests_email',
        title: getIn18Text('LIANXIRENYOUXIANG'),
        valKey: ['email', 'replyToMail'],
      },
    ],
    button: true,
    suggestTabName: getIn18Text('JIANDANGJIANYI'),
  },
  external: {
    title: getIn18Text('MOSHENGRENXIANGQING'),
    actions: [
      {
        key: 'create_customer',
        label: getIn18Text('XINJIANKEHU'),
        menuKey: 'join_customer',
        menuLabel: getIn18Text('TIANJIADAOYIYOUKEHU'),
        icon: <CreateCustomerIcon />,
        permisson: defaultPermission,
      },
      {
        key: 'join_customer',
        label: getIn18Text('TIANJIADAOYIYOUKEHU'),
        icon: <JoinCustomerIcon />,
        permisson: defaultPermission,
      },
      {
        key: 'create_clue',
        label: getIn18Text('XINJIANXIANSUO'),
        menuKey: 'join_clue',
        menuLabel: getIn18Text('TIANJIADAOYIYOUXS'),
        permisson: defaultCluePermission,
      },
      {
        key: 'join_clue',
        label: getIn18Text('TIANJIADAOYIYOUXS'),
        permisson: defaultCluePermission,
      },
      {
        key: 'add_contact',
        label: getIn18Text('TIANJIATONGXUNLU'),
        icon: <AddContactIcon />,
      },
    ],
    suggests: [
      // {
      //   key: 'external_suggests_state',
      //   title: getIn18Text('KEHUGENJINZHUANGTAI'),
      //   valKey: '',
      //   default: getIn18Text('XINJIAN'),
      // },
      // {
      //   key: 'external_suggests_stage',
      //   title: getIn18Text('KEHUJIEDUAN'),
      //   valKey: '',
      //   default: getIn18Text('QIANZAIKEHU'),
      // },
      {
        key: 'external_suggests_name',
        title: getIn18Text('LIANXIRENXINGMING'),
        valKey: 'name',
      },
      {
        key: 'external_suggests_email',
        title: getIn18Text('LIANXIRENYOUXIANG'),
        valKey: ['email', 'replyToMail'],
      },
    ],
    button: true,
    suggestTabName: getIn18Text('JIANDANGJIANYI'),
  },
  personal: {
    title: getIn18Text('LIANXIRENXIANGQING'),
    actions: [
      {
        key: 'create_customer',
        label: getIn18Text('XINJIANKEHU'),
        menuKey: 'join_customer',
        menuLabel: getIn18Text('TIANJIADAOYIYOUKEHU'),
        icon: <CreateCustomerIcon />,
        permisson: defaultPermission,
      },
      {
        key: 'join_customer',
        label: getIn18Text('TIANJIADAOYIYOUKEHU'),
        icon: <JoinCustomerIcon />,
        permisson: defaultPermission,
      },
      {
        key: 'create_clue',
        label: getIn18Text('XINJIANXIANSUO'),
        menuKey: 'join_clue',
        menuLabel: getIn18Text('TIANJIADAOYIYOUXS'),
        permisson: defaultCluePermission,
      },
      {
        key: 'join_clue',
        label: getIn18Text('TIANJIADAOYIYOUXS'),
        permisson: defaultCluePermission,
      },
    ],
    suggests: [
      // {
      //   key: 'personal_suggests_state',
      //   title: getIn18Text('KEHUGENJINZHUANGTAI'),
      //   valKey: '',
      //   default: getIn18Text('XINJIAN'),
      // },
      // {
      //   key: 'personal_suggests_stage',
      //   title: getIn18Text('KEHUJIEDUAN'),
      //   valKey: '',
      //   default: getIn18Text('QIANZAIKEHU'),
      // },
      {
        key: 'personal_suggests_name',
        title: getIn18Text('LIANXIRENXINGMING'),
        valKey: 'name',
      },
      {
        key: 'personal_suggests_email',
        title: getIn18Text('LIANXIRENYOUXIANG'),
        valKey: ['email', 'replyToMail'],
      },
    ],
    button: true,
    suggestTabName: getIn18Text('JIANDANGJIANYI'),
  },
  enterprise: {
    title: getIn18Text('LIANXIRENXIANGQING'),
    actions: [
      {
        key: 'send_mail',
        label: getIn18Text('FAYOUJIAN'),
        icon: <SendMailIcon />,
      },
      {
        key: 'send_im',
        label: getIn18Text('FAXIAOXI'),
        icon: <SendImIcon />,
      },
      {
        key: 'create_schedule',
        label: getIn18Text('XINJIANRICHENG'),
        icon: <CreateScheduleIcon />,
        // permisson: defaultPermission, // 同事创建日程，应该是不需要权限限制的
      },
    ],
    suggests: [
      {
        key: 'enterprise_suggests_tel',
        title: getIn18Text('DIANHUA'),
        valKey: 'tel',
        default: '-',
      },
      {
        key: 'enterprise_suggests_org',
        title: getIn18Text('BUMEN'),
        valKey: 'org',
        default: '-',
      },
    ],
    suggestTabName: getIn18Text('JIBENXINXI'),
  },
};

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const eventApi = apiHolder.api.getEventApi() as EventApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const nimApi = apiHolder.api.requireLogicalApi('NIM') as NIMApi;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

export const CommonSidebar = ({ email, name, onClickHelp, _account = getMainAccount(), replyToMail, setLoading, noBorder }: CommonSidebarProps) => {
  const SalesPitchPage = useMemo(() => SalesPitchPageHoc('readMailAside'), []);
  // const SalesPitchGuide = useMemo(() => SalesPitchGuideHoc('1'), []);
  const visibleIM = nimApi.getIMAuthConfig();
  const scheduleActions = useActions(ScheduleActions);
  const contactActions = useActions(ContactActions);
  const contactModel = useContactModel({ email, _account, name, needFull: true, needCompleteContact: true });

  const { catalogList, unSelectedCatalogIds } = useAppSelector(state => state.scheduleReducer);
  // 权限
  const privilege = useAppSelector(state => state.privilegeReducer);
  // 有操作客户的权限
  const hasCustomerPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CONTACT', 'OP'));
  // 有操作线索的权限
  const hasCluePermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CHANNEL', 'OP'));

  // 非客户侧边栏详情
  const [commonAsideDetail, updateCommonAsideDetail] = useState2RM('commonAsideDetail', 'updateCommonAsideDetail');
  // uni客户弹窗
  // const [, setUniCustomerParam] = useState2RM('uniCustomerParam');
  // uni线索弹窗
  // const [, setUniClueParam] = useState2RM('uniClueParam');
  // uni添加到原有线索弹窗
  const [, setUniToCustomerOrClueParam] = useState2RM('uniToCustomerOrClueParam');
  // 全球搜/AI查询结果信息
  const [queryData, setQueryData] = useState<QueryData>([]);
  // 全球搜是否获取到了全部数据
  const [globalAllData, setGlobalAllData] = useState(false);
  // 是否展示的是AI挖掘的结果
  const [resultUseAi, setResultUseAi] = useState(false);
  // AI挖掘中
  const [loadingType, setLoadingType] = useState<'global' | 'ai' | ''>('');
  // AI挖掘剩余次数
  const [aiCount, setAiCount] = useState<number>(50);
  // web是否新建日程
  const [showBox, setShowbox] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [personalModalVisible, setPersonalModalVisible] = useState<boolean>(false);
  // 点击刷新
  // const [loading, setLoading] = useState(false);
  // // 更新redux联系人数据
  // useUpdateContactModel({ email, name, model: contactModel });

  const contact = contactModel ? transContactModel2ContactItem(contactModel) : undefined;
  const contactType = contact?.type || '';
  const showIntelligentSuggest = ['external', 'personal'].includes(contactType);
  // 当前在读邮件的id
  const currentMailId = useContext(CurrentMailIdContext);
  const [mailEntities] = useState2RM('mailEntities');
  const currentMail = mailEntities[currentMailId];

  // 当前在读邮件的正文和签名，去除标签
  const currentMailContentWithSign = useMemo(() => {
    if (currentMailId) {
      if (currentMail) {
        const content = currentMail?.entry?.content?.content ? getMailContentText(currentMail?.entry?.content?.content, true, true) : '';
        return content;
      }
      return '';
    }
    return '';
  }, [currentMail?.entry?.content?.content]);

  // 查询智能建议信息
  // const getInformation = async (type?: 'global' | 'ai') => {
  //   if (!showIntelligentSuggest || loadingType) {
  //     return;
  //   }
  //   const fromType = type || 'global';
  //   if (fromType === 'ai' && aiCount <= 0) {
  //     message.warn(getIn18Text('JINRIAICHA'));
  //     return;
  //   }
  //   setLoadingType(fromType);
  //   let result = {} as SuggestionGlobalAi;
  //   // 如果存在该邮箱的智能建议信息，直接使用
  //   if (commonAsideDetail.aiDetailMap[email]) {
  //     result = commonAsideDetail.aiDetailMap[email];
  //   } else {
  //     // 全球搜查询，有结果直接使用，不展示AI查询按钮，无结果展示AI查询按钮
  //     const params = { email, from: fromType };
  //     result = await customerApi.getSuggestionGlobalAi(params);
  //     // 通过全球搜查询到的智能建议信息，清除commonAsideDetail的aiDetailMap
  //     if (fromType === 'global') {
  //       updateCommonAsideDetail({ aiDetailMap: {} });
  //     }
  //   }
  //   if (result?.companyName || result?.area || result?.location || result?.webapp || result?.socialMediaList) {
  //     const companyName = result?.companyName;
  //     const area = result?.area;
  //     const location = result?.location;
  //     const webapp = result?.webapp;
  //     const socialMediaList =
  //       (result?.socialMediaList
  //         ?.filter(i => !!i.desc && !!i.name)
  //         ?.map(i => ({ type: SocialPlatformType[i.name.toLocaleUpperCase()] || '0', name: i.name || '-', number: i.desc || '-' })) as SocialPlatform[]) || [];

  //     const suggests = [
  //       {
  //         key: 'companyName',
  //         title: getIn18Text('GONGSIMINGCHENG'),
  //         default: companyName,
  //       },
  //       {
  //         key: 'area',
  //         title: getIn18Text('GUOJIADEQU'),
  //         default: area,
  //       },
  //       {
  //         key: 'webapp',
  //         title: getIn18Text('GONGSIGUANWANG'),
  //         default: webapp,
  //       },
  //       {
  //         key: 'socialMediaList',
  //         title: getIn18Text('GONGSISHEMEI'),
  //         default: socialMediaList,
  //       },
  //       {
  //         key: 'location',
  //         title: getIn18Text('GONGSIDIZHI'),
  //         default: location,
  //       },
  //     ];
  //     setQueryData(suggests);
  //     setLoadingType('');
  //     // 通过AI查询到的智能建议信息，存入redux下次创建直接使用（只存入一份数据，下次直接覆盖）
  //     if (fromType === 'ai') {
  //       updateCommonAsideDetail({ aiDetailMap: { [email]: { companyName, area, webapp, socialMediaList, location } } });
  //     }
  //     return;
  //   }
  //   if (result?.aiFail) {
  //     message.warn(getIn18Text('CHAXUNSHIBAIKE'));
  //   } else if (fromType === 'ai') {
  //     message.warn(getIn18Text('WEICHAXUNDAODUI'));
  //   }
  //   setLoadingType('');
  //   // AI查询剩余次数
  //   const res = await customerApi.getSuggestionAICount();
  //   setAiCount(res?.countLeft || 0);
  // };

  // 全球搜
  const getInformationGlobal = async () => {
    if (!showIntelligentSuggest || loadingType) {
      return;
    }
    const fromType = 'global';
    setLoadingType(fromType);
    let result = {} as SuggestionGlobalAi;
    // 如果存在该邮箱的智能建议信息，直接使用
    if (currentMailId && commonAsideDetail.aiDetailMap[currentMailId]) {
      result = commonAsideDetail.aiDetailMap[currentMailId];
      setResultUseAi(true); // 使用了AI挖掘结果的缓存
    } else {
      // 全球搜查询，有结果直接使用，不展示AI查询按钮，无结果展示AI查询按钮
      const params = { email, from: fromType as any };
      result = await customerApi.getSuggestionGlobalAi(params);
      // 通过全球搜查询到的智能建议信息，清除commonAsideDetail的aiDetailMap
      // updateCommonAsideDetail({ aiDetailMap: {}, aiMidMap: {} });
      // 判断全球搜是否获取到了全部数据
      if (result?.companyName && result?.area && result?.location && result?.webapp && result?.socialMediaList?.some(m => !!((m.desc || m.number) && m.name))) {
        setGlobalAllData(true);
      }
    }
    if (result?.companyName || result?.area || result?.location || result?.webapp || result?.socialMediaList) {
      setResultData(result);
      return;
    }
    setLoadingType('');
    // 获取ai剩余次数
    const res = await customerApi.getSuggestionAICount();
    setAiCount(res?.countLeft || 0);
  };

  // Ai挖掘，包含之前的域名挖掘和邮件正文分析
  const getInformationAI = async () => {
    if (!showIntelligentSuggest || loadingType) {
      return;
    }
    const fromType = 'ai';
    if (aiCount <= 0) {
      message.warn(getIn18Text('JINRIAICHA'));
      return;
    }
    setLoadingType(fromType);
    // 发起请求，获得一个轮询id
    const params = { email, content: currentMailContentWithSign };
    const result = await customerApi.getSuggestionGlobalAiGenerate(params);
    if (result.genId) {
      // 开始轮询
      pollingById(result.genId);
      // mid到genId的映射关系
      updateCommonAsideDetail({ aiDetailMap: {}, aiMidMap: { [currentMailId]: result.genId } });
      return;
    }
    // 错误提示
    if (result?.aiFail) {
      message.warn(getIn18Text('CHAXUNSHIBAIKE'));
    }
    setLoadingType('');
    // 获取ai剩余次数
    const res = await customerApi.getSuggestionAICount();
    setAiCount(res?.countLeft || 0);
  };
  const pollingTimer = useRef<any>();
  const pollingTimer2 = useRef<any>();
  // 根据genId轮询ai挖掘的结果
  const pollingById = (genId: string) => {
    if (genId) {
      pollingTimer.current = setInterval(async () => {
        const result = await customerApi.getSuggestionGlobalAiQuery({ genId });
        // 如果code不是50002，则表示不是正在生成中，可以停止轮询
        if (result?.code !== 50002) {
          clearInterval(pollingTimer.current);
        }
        // 如果有结果
        if (result?.companyName || result?.area || result?.location || result?.webapp || result?.socialMediaList) {
          // 设置显示ai挖掘结果
          setResultData(result, true);
          setResultUseAi(true);
          return;
        }
        if (result?.aiFail) {
          // 提示
          message.warn(getIn18Text('CHAXUNSHIBAIKE'));
          // 请求失败了，也需要停止轮询
          clearInterval(pollingTimer.current);
          setLoadingType('');
        } else {
          // message.warn(getIn18Text('WEICHAXUNDAODUI'));
        }
      }, 2000);
      // 最长三分钟，没结果也结束轮询
      clearTimeout(pollingTimer2.current); // 结束之前定义的定时关闭
      pollingTimer2.current = setTimeout(async () => {
        clearInterval(pollingTimer.current);
        setLoadingType('');
        // 获取ai剩余次数
        const res = await customerApi.getSuggestionAICount();
        setAiCount(res?.countLeft || 0);
      }, 3 * 60 * 1000);
    }
  };
  // 同步全球搜/ai挖掘的结果
  const setResultData = (result: SuggestionGlobalAi, isAi?: boolean) => {
    let companyName = result?.companyName;
    let area = result?.area;
    let location = result?.location || '';
    let webapp = result?.webapp || '';
    let socialMediaList =
      (result?.socialMediaList
        ?.filter(i => (i.desc || i?.number) && i.name)
        ?.map(i => ({ type: SocialPlatformType[i.name.toLocaleUpperCase()] || '0', name: i.name || '-', number: i.number || i.desc || '-' })) as SocialPlatform[]) || [];
    // 如果是ai挖掘结果，需要融合一下
    if (isAi) {
      companyName = (queryData.find(m => m.key === 'companyName')?.default as string) || companyName;
      area = (queryData.find(m => m.key === 'area')?.default as string) || area;
      location = (queryData.find(m => m.key === 'location')?.default as string) || location;
      webapp = (queryData.find(m => m.key === 'webapp')?.default as string) || webapp;
      const socialMediaListOld = queryData.find(m => m.key === 'socialMediaList')?.default as SocialPlatform[];
      socialMediaList = socialMediaListOld && socialMediaListOld?.some(m => m.number && m.name) ? socialMediaListOld : socialMediaList;
      // 缓存融合后的结果,并且清除对应的genId，下次进来不再去轮询
      updateCommonAsideDetail({ aiDetailMap: { [currentMailId]: { companyName, area, webapp, socialMediaList, location } }, aiMidMap: { [currentMailId]: '' } });
    }
    const suggests = [
      {
        key: 'companyName',
        title: getIn18Text('GONGSIMINGCHENG'),
        default: companyName,
      },
      {
        key: 'area',
        title: getIn18Text('GUOJIADEQU'),
        default: area,
      },
      {
        key: 'webapp',
        title: getIn18Text('GONGSIGUANWANG'),
        default: webapp,
      },
      {
        key: 'socialMediaList',
        title: getIn18Text('GONGSISHEMEI'),
        default: socialMediaList,
      },
      {
        key: 'location',
        title: getIn18Text('GONGSIDIZHI'),
        default: location,
      },
    ];
    setQueryData(suggests);
    setLoadingType('');
  };

  const org = contact && Array.isArray(lodashGet(contact, 'position[0]', undefined)) ? lodashGet(contact, 'position[0]', []).join('/') : '';
  const tel = contactModel?.contactInfo?.filter(e => e.contactItemType === 'MOBILE' || e.contactItemType === 'TEL').map(e => e.contactItemVal)[0];

  // 为方便统一获取需要的内容，填充了电话和部门，仅在UI取值使用，其他整个结构的传参仍然使用contact
  const contactUi = {
    ...contact,
    tel,
    org,
    replyToMail: replyToMail && replyToMail !== contact?.email ? replyToMail : undefined,
  };

  // 发消息
  const createSession = () => {
    const yunxinAccount = lodashGet(contactModel, 'contactInfo', []).find(item => item.contactItemType === 'yunxin')?.contactItemVal || '';
    yunxinAccount &&
      openSession(
        {
          sessionId: `p2p-${yunxinAccount}`,
          mode: 'normal',
        },
        {
          createSession: true,
          validateTeam: false,
        }
      );
  };

  // 新建日程
  const createSchedule = async () => {
    const defaultMoment = initDefaultMoment();
    const creatDirectStartTime = defaultMoment.startTime;
    const creatDirectEndTime = defaultMoment.endTime;
    // 默认联系人
    const currentUser = systemApi.getCurrentUser()?.id;
    const users = [...new Set([email, currentUser as string])];
    const ContactList = await getContanctObjs(users);
    // 获取日历
    if (systemApi.isElectron()) {
      const initData: SchedulePageEventData = {
        catalogList,
        unSelectedCatalogIds,
        creatDirectStartTimeStr: creatDirectStartTime.format('YYYY-MM-DD HH:mm'),
        creatDirectEndTimeStr: creatDirectEndTime.format('YYYY-MM-DD HH:mm'),
        defaultContactList: ContactList,
        source: ScheduleSyncObInitiator.MAIL_MODULE,
      };
      systemApi.createWindowWithInitData('scheduleOpPage', { eventName: 'initPage', eventData: initData });
      return;
    }
    scheduleActions.setCreatDirectStartTime(creatDirectStartTime);
    scheduleActions.setCreatDirectEndTime(creatDirectEndTime);
    setShowbox(true);
  };

  // 新建客户
  const handleAddCustomer = (adoptAi: boolean = true) => {
    // 初始化参数
    let companyName = '';
    const area = [];
    let webapp = '';
    let location = '';
    let socialMediaList: SocialPlatform[] = [];
    // 采纳智能建议新建客户
    if (adoptAi) {
      companyName = (queryData.find(item => item.key === 'companyName')?.default as string) || '';
      webapp = (queryData.find(item => item.key === 'webapp')?.default as string) || '';
      location = (queryData.find(item => item.key === 'location')?.default as string) || '';
      socialMediaList = (queryData.find(item => item.key === 'socialMediaList')?.default as SocialPlatform[]) || [];
      const region = queryData.find(item => item.key === 'area')?.default as string;
      region && area.push(region);
    } else {
      trackApi.track('waimao_mail_sidebar_addCustomer_noAdopt', { cardType: contactType });
    }
    const contactList = [
      {
        condition: 'company',
        contact_name: contactUi?.name,
        email: contactUi?.email,
      },
    ] as unknown as BusinessContactVO[];
    if (contactUi.replyToMail) {
      contactList.push({
        condition: 'company',
        contact_name: contactUi?.name,
        email: contactUi?.replyToMail,
      } as unknown as BusinessContactVO);
    }
    // 不采纳，官网直接就是空，使用邮箱后缀，采纳如果取值是空，也使用邮箱后缀
    if (!webapp) {
      // 如果邮箱后缀是公共邮箱，则传递空，否则直接传入即可
      const emailDomain = contact?.email?.split('@')[1] || '';
      webapp = PublicMailDomainList.includes(emailDomain) ? '' : emailDomain;
    }
    showUniDrawer({
      moduleId: UniDrawerModuleId.CustomerDetail,
      moduleProps: {
        visible: true,
        onClose: () => {},
        onSuccess: (id?: number, data?: any) => {
          // 请求成功后会返回新客户的id
          refreshContactDataByEmails(
            {
              [_account]: [email],
            },
            new Map([[email, name]])
          );
        },
        customerData: {
          company_name: companyName,
          area,
          contact_list: contactList,
          website: webapp,
          address: location,
          social_media: socialMediaList,
        },
        source: 'mailListStrangerSideBar',
      },
    });
    trackApi.track('waimao_mail_sidebar_addCustomer', { cardType: contactType });
  };

  // 添加到已有的客户
  const addToExistedCustomers = () => {
    // addToExistedCustomerModal(contactModel as ContactModel, undefined, 'sidebar', _account);
    const { contact: contactObj } = contactModel as ContactModel;
    const { contactName, accountName, displayEmail } = contactObj;
    const email = displayEmail || accountName;
    setUniToCustomerOrClueParam({
      visible: true,
      type: 'customer',
      way: scenes.Email_stranger_sidebar,
      contacts: [
        {
          email,
          contact_name: contactName || email,
        },
      ],
      onOk: () => {
        refreshContactDataByEmails(
          {
            [_account]: [email],
          },
          new Map([[email, contactName]])
        );
      },
    });
  };

  // 新建线索
  const handleAddClue = (adoptAi: boolean = true) => {
    let companyName = '';
    const area = [];
    let webapp = '';
    let location = '';
    let socialMediaList: SocialPlatform[] = [];
    // 采纳智能建议新建客户
    if (adoptAi) {
      companyName = (queryData.find(item => item.key === 'companyName')?.default as string) || '';
      const region = queryData.find(item => item.key === 'area')?.default as string;
      webapp = (queryData.find(item => item.key === 'webapp')?.default as string) || '';
      location = (queryData.find(item => item.key === 'location')?.default as string) || '';
      socialMediaList = (queryData.find(item => item.key === 'socialMediaList')?.default as SocialPlatform[]) || [];
      region && area.push(region);
    }
    const contactList = [
      {
        condition: 'clue' as 'clue',
        contact_name: contactUi?.name,
        email: contactUi?.email,
      },
    ];
    if (contactUi.replyToMail) {
      contactList.push({
        condition: 'clue' as 'clue',
        contact_name: contactUi?.name,
        email: contactUi?.replyToMail,
      });
    }
    // 不采纳，官网直接就是空，使用邮箱后缀，采纳如果取值是空，也使用邮箱后缀
    if (!webapp) {
      // 如果邮箱后缀是公共邮箱，则传递空，否则直接传入即可
      const emailDomain = contact?.email?.split('@')[1] || '';
      webapp = PublicMailDomainList.includes(emailDomain) ? '' : emailDomain;
    }
    showUniDrawer({
      moduleId: UniDrawerModuleId.LeadsDetail,
      moduleProps: {
        visible: true,
        contactList: contactList, // Partial<ExternalContact>[];
        source: 'mailListStrangerSideBar',
        detailData: {
          company_name: companyName,
          area,
          website: webapp,
          address: location,
          social_media: socialMediaList,
        }, // Partial<LeadsVO_2>;
        onSuccess: () => {
          refreshContactDataByEmails(
            {
              [_account]: [email],
            },
            new Map([[email, name]])
          );
        },
        onClose: () => {},
      },
    });
  };

  // 添加到已有的线索
  const addToExistedClue = () => {
    console.log('添加到已有的线索');
    const contactName = contactUi?.name || email;
    setUniToCustomerOrClueParam({
      visible: true,
      type: 'clue',
      way: scenes.Email_stranger_sidebar,
      contacts: [
        {
          email,
          contact_name: contactName,
        },
      ],
      onOk: () => {
        refreshContactDataByEmails(
          {
            [_account]: [email],
          },
          new Map([[email, contactName]])
        );
      },
    });
  };

  // 添加通讯录
  const handleAddContact = () => {
    setPersonalModalVisible(true);
    contactActions.doCreateFormExternal(contact);
  };

  // 处理点击操作
  const handleActionClick = (key: string) => {
    switch (key) {
      case 'send_im':
        createSession();
        break;
      case 'create_schedule':
        createSchedule();
        break;
      case 'create_customer':
        handleAddCustomer();
        break;
      case 'join_customer':
        addToExistedCustomers();
        break;
      case 'create_clue':
        handleAddClue();
        break;
      case 'join_clue':
        addToExistedClue();
        break;
      case 'add_contact':
        handleAddContact();
        break;
      default:
        break;
    }
  };

  // const alesPitchTabTitle = useMemo(
  //   () => (
  //     <SalesPitchGuide>
  //       <span>{getIn18Text('HUASHUKU')}</span>
  //     </SalesPitchGuide>
  //   ),
  //   []
  // );
  const alesPitchTabTitle = getIn18Text('HUASHUKU');

  // 处理ai按钮点击操作
  const handleAiClick = useCreateCallbackForEvent(() => {
    if (queryData.length > 0 && resultUseAi) {
      if (hasCustomerPermisson) {
        handleAddCustomer(false);
      } else {
        handleAddClue(false);
      }
    } else {
      getInformationAI();
    }
  });

  // 话术库展示打点
  useEffect(() => {
    if (activeTab === '3') {
      salesPitchManageTrack({ opera: 'SHOW' });
    }
  }, [activeTab]);

  // 陌生人及个人联系人获取智能建议信息
  // useEffect(() => {
  //   if (!email) {
  //     return;
  //   }
  //   setQueryData([]);
  //   // 默认执行一次全球搜
  //   getInformationGlobal();
  // }, [email]);

  // 如果是在读信场景下，则先看是否有缓存的genId
  useEffect(() => {
    setQueryData([]); // 读信改变，清空结果
    setResultUseAi(false); // 读信改变，设置没有使用ai结果
    setGlobalAllData(false); // 读信改变，设置没有使用ai结果
    setLoadingType('');
    // 默认执行一次全球搜
    if (email) {
      // 先进行全球搜，返回后再看是否之前有轮询
      getInformationGlobal().finally(() => {
        if (currentMailId) {
          const genId = commonAsideDetail.aiMidMap[currentMailId];
          // 进入如果发现之前有缓存的genId，则拿着继续轮询
          if (genId) {
            setLoadingType('ai');
            pollingById(genId);
          }
        }
      });
    }

    return () => {
      clearInterval(pollingTimer.current);
      clearTimeout(pollingTimer2.current);
    };
  }, [currentMailId, email]);

  // 监听日程独立窗口创建日程成功
  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('syncSchedule', {
      func: e => {
        if (e.eventStrData === ScheduleSyncObInitiator.MAIL_MODULE) {
          e.eventData && SiriusMessage.success({ content: e.eventData.msg });
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('syncSchedule', eid);
    };
  }, []);

  useEffect(() => {
    if (contactModel?.isFull) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [contactModel?.isFull]);

  // 需要展示的操作
  const displayActionsByContactType = useMemo(() => {
    const actions = displayActions[contactType]?.actions || [];
    const isMainAccount = systemApi.getCurrentUser()?.id === _account;
    const inMainPage = inWindow() && window.location.pathname === '/';
    const notAllow = new Set();
    if (!inMainPage) {
      // 如果不是主窗口，不展示发消息
      notAllow.add('send_im');
    }
    // 如果不是主账号，则不展示：发消息，新建日程两个操作
    if (!isMainAccount) {
      notAllow.add('send_im');
      notAllow.add('create_schedule');
    }
    return actions.filter(action => !notAllow.has(action.key));
  }, [contactType, _account]);

  const ButtonCom = useMemo(() => {
    let res = <></>;
    if (loadingType) {
      res = <>{getIn18Text('AIWAJUEZHONG')}</>;
    } else if (queryData.length > 0 && resultUseAi) {
      res = <>{hasCustomerPermisson ? getIn18Text('BUCAINAZHINENG') : getIn18Text('BUCAINAZHINENGJYXJXS')}</>;
    } else {
      res = (
        <>
          {getIn18Text('SHIYONGAIWA')}
          <span className={style.createAiCustomerTip}>
            ({getIn18Text('SHENGYU')}
            &nbsp;
            {aiCount}
            &nbsp;
            {getIn18Text('CI')})
          </span>
        </>
      );
    }
    const BtnCom = (
      <Button onClick={handleAiClick} className={style.createAiCustomer} loading={loadingType === 'ai'}>
        {res}
      </Button>
    );
    // if (loadingType === '' && queryData.length > 0) {
    //   return (
    //     <PrivilegeCheckForMailPlus resourceLabel={defaultPermission.resourceLabel} accessLabel={defaultPermission.accessLabel}>
    //       {BtnCom}
    //     </PrivilegeCheckForMailPlus>
    //   );
    // }
    return BtnCom;
  }, [loadingType, queryData.length, aiCount, hasCustomerPermisson, hasCluePermisson, resultUseAi]);

  // 如果不可见或未查询到contactModel信息或是不支持的类型返回loading
  if (!contactModel || !displayActions[contactType]) {
    return <PageLoading />;
  }

  // 点击刷新按钮，根据email刷新数据
  const refreshDetail = async () => {
    setLoading(true);
    await refreshContactDataByEmails(
      {
        [_account]: [email],
      },
      new Map([[email, name]])
    );
    setLoading(false);
  };

  // 新建客户，新建线索，添加到客户，添加到线索渲染单独处理
  const renderCustomerOrClueBtn = (item: {
    key: string;
    label: string;
    menuLabel?: string;
    menuKey?: string;
    permisson?: { accessLabel: string; resourceLabel: string } | undefined;
  }) => {
    const { key, label, permisson } = item;
    const hasPermisson = permisson ? getModuleAccessSelector(privilege, permisson?.resourceLabel, permisson?.accessLabel) : false;
    // 如果两个权限都有，需要下拉按钮，添加按钮作为下拉
    if (hasCustomerPermisson && hasCluePermisson) {
      if (key === 'create_customer' || key === 'create_clue') {
        return (
          <Dropdown.Button
            className={style.actionbtnDropdown}
            onClick={() => handleActionClick(key)}
            icon={
              <span style={{ display: 'inline-flex' }}>
                <CaretDownOutlined />
              </span>
            }
            trigger={['click']}
            overlay={
              <Menu>
                <Menu.Item key={item.menuKey} onClick={() => handleActionClick(item.menuKey as string)}>
                  {item.menuLabel}
                </Menu.Item>
              </Menu>
            }
          >
            {label}
          </Dropdown.Button>
        );
      } else {
        return <></>;
      }
    }
    // 如果只有客户或者线索的权限，则根据权限正常展示即可
    if (hasCustomerPermisson || hasCluePermisson) {
      return hasPermisson ? (
        <Lxbutton key={key} onClick={() => handleActionClick(key)} className={style.actionbtnDropdown} btnType="minorGray" inline>
          {label}
        </Lxbutton>
      ) : (
        <></>
      );
    }
    // 如果都没有权限，这四个按钮返回空
    return <></>;
  };

  // 返回结构
  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        background: '#fff',
        width: `${DEFAULT_CUSTOMER_WIDTH}px`,
      }}
      className={classnames(style.rightSiderStyle, {
        [style.noBorder]: noBorder,
      })}
    >
      <div className={classnames(outerStyle.columnFlexContainer, outerStyle.commonSideBar)}>
        {/* 顶部内容 */}
        <div className={outerStyle.topBanner}>
          <span className={outerStyle.cardType}>{displayActions[contactType]?.title}</span>
          <div>
            <RefreshIcon
              className={classnames(outerStyle.topBannerIcon, {
                // 'sirius-spin': loading,
              })}
              onClick={() => {
                refreshDetail();
              }}
            />
            {/* 邮件+231222版本去掉引导 */}
            {/* <HelpInfo onClickHelp={onClickHelp} /> */}
          </div>
        </div>
        <div className={classnames(style.infoContainer, outerStyle.columnFlexContainer, style.scrollContainer)}>
          <div className={style.header}>
            <div className={style.headerInfo}>
              <div className={style.headerInfoMain}>
                <div className={style.flexRow}>
                  <span className={style.companyName} title={contactUi?.name}>
                    {contactUi?.name}
                  </span>
                </div>
                <div className={style.row} style={{ marginTop: 8 }}>
                  <span>{getIn18Text('YOUXIANG') + ''}</span>
                  <span>{contactUi?.email}</span>
                </div>
              </div>
            </div>
            <div className={style.actions}>
              {displayActionsByContactType.map(i => {
                const { key, permisson } = i;
                if (key === 'send_mail') {
                  return (
                    <div key={i.key} className={style.actionbtn} style={{ marginRight: 8 }}>
                      <SendMailPop mailList={contactUi?.email ? [contactUi?.email] : []}>
                        <Lxbutton className={style.actionbtn} key={i.key} btnType="minorGray" inline>
                          {i.label}
                        </Lxbutton>
                      </SendMailPop>
                    </div>
                  );
                }
                // 是im，且（无im权限 或 不可展示im)
                if (key === 'send_im' && (!visibleIM || !lodashGet(contactModel, 'contact.enableIM', false))) {
                  return <></>;
                }
                // 新建客户，添加到已有客户，新建线索，添加到已有线索，单独处理下
                if (['create_customer', 'create_clue', 'join_customer', 'join_clue'].includes(key)) {
                  return renderCustomerOrClueBtn(i);
                }
                return (
                  <Lxbutton key={i.key} onClick={() => handleActionClick(i.key)} className={style.actionbtnDropdown} btnType="minorGray" inline>
                    {i.label}
                  </Lxbutton>
                );
              })}
            </div>
          </div>
          <div className={style.body}>
            <Tabs className={classnames('waimao-tabs', style.tabs)} activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab={displayActions[contactType]?.suggestTabName || ''} key="1">
                <div className={style.suggest}>
                  {queryData.length > 0 ? <div className={style.suggestHead}>{getIn18Text('KEHUJICHUXIN')}</div> : ''}
                  {displayActions[contactType]?.suggests?.map(item => {
                    let valueList: Array<string | undefined> = [];
                    if (item.valKey) {
                      valueList = Array.isArray(item.valKey)
                        ? item.valKey.map(k => lodashGet(contactUi, k, '') || item.default)
                        : [lodashGet(contactUi, item.valKey, '') || item.default];
                    } else {
                      valueList = [item.default || ''];
                    }
                    return (
                      <div key={item.key} className={style.suggestItem}>
                        <p className={style.suggestTitle}>{item.title}</p>
                        {valueList.map(v => {
                          if (v !== undefined) {
                            return <p className={style.suggestValue}>{v}</p>;
                          }
                          return <></>;
                        })}
                      </div>
                    );
                  })}
                  {queryData.length > 0 ? (
                    <>
                      <span className={style.suggestDashed} />
                      <div className={style.suggestHead}>{getIn18Text('ZHINENGJIANYIXIN')}</div>
                    </>
                  ) : (
                    ''
                  )}
                  {queryData.map(item => (
                    <div key={item.key} className={style.suggestItem}>
                      <p className={style.suggestTitle}>{item.title}</p>
                      <div className={style.suggestValue}>
                        {item.key !== 'socialMediaList' ? (
                          <EllipsisTooltip>{(item.default as string) || '-'}</EllipsisTooltip>
                        ) : (
                          <SocialMedia socialMediaList={item.default as SocialPlatform[]} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {displayActions[contactType]?.button && (hasCustomerPermisson || hasCluePermisson) ? (
                  <>
                    <Button
                      onClick={() => {
                        if (hasCustomerPermisson) {
                          handleAddCustomer();
                        } else {
                          handleAddClue();
                        }
                      }}
                      className={style.createCustomer}
                      type="primary"
                    >
                      {hasCustomerPermisson ? getIn18Text('XINJIANKEHU') : getIn18Text('XINJIANXIANSUO')}
                    </Button>
                    {showIntelligentSuggest && loadingType !== 'global' && !globalAllData ? <>{ButtonCom}</> : <></>}
                  </>
                ) : (
                  <></>
                )}
              </TabPane>
              <TabPane tab={alesPitchTabTitle} key="3">
                <SalesPitchPage />
              </TabPane>
              <TabPane tab={getIn18Text('WANGLAIYOUJIAN')} key="2">
                <CommonEmailList relatedEmail={contact?.email || ''} />
              </TabPane>
            </Tabs>
          </div>
        </div>
      </div>
      {showBox && (
        <div className={style.schedule}>
          <CreateScheduleBox
            source={ScheduleSyncObInitiator.MAIL_MODULE}
            defaultContactList={contact ? [contact] : []}
            onCancel={() => setShowbox(false)}
            getReferenceElement={() => null}
          />
        </div>
      )}
      {personalModalVisible && (
        <PersonalModal
          contactId={contactUi?.id}
          contact={contactModel}
          onCancel={() => setPersonalModalVisible(false)}
          onSuccess={() => setPersonalModalVisible(false)}
          _account={_account}
        />
      )}
    </div>
  );
};
