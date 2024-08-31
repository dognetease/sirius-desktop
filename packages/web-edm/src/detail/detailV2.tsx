/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable indent */
/* eslint-disable max-statements */
import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import lodashGet from 'lodash/get';
import {
  apiHolder,
  apis,
  ContatInfoForDetail,
  EdmEmailInfo,
  EdmProductDataApi,
  EdmSendBoxApi,
  ResponseProductClickData,
  ResponseSendBoxDetail,
  ResponseTraceLinkItem,
  traceLogItem,
  ResponseDetailSubject,
  SubjectInfo,
  RequsetAddBlackList,
  SubjectAnalysisRes,
  AiMarketingContact,
  ResponseCustomerNewLabelByEmail,
  SenderListV2Resp,
} from 'api';
import Dialog from '@web-common/components/UI/Dialog/dialog';
import { Skeleton, Tooltip, Dropdown, Menu, message, Alert, Divider } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import Breadcrumb from '@lingxi-common-component/sirius-ui/Breadcrumb';
// import { Switch } from '@web-common/components/UI/Switch';
import Switch from '@lingxi-common-component/sirius-ui/Switch';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import moment from 'moment';
import { navigate } from 'gatsby';
import classnames from 'classnames';
// import ArrowRight from '@web-common/components/UI/Icons/svgs/disk/ArrowRight';
import { RefreshSvg } from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { useAppSelector, ConfigActions, useActions } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { HistoryActionModal, IHistoryActionData } from '../components/historyAction/modal';
import style from '../edm.module.scss';
import detailStyle from './detail.module.scss';
import { EdmPageProps } from '../pageProps';
import { ReactComponent as CardHelpIcon } from '@/images/mailCustomerCard/help.svg';
import { exportExcel, onHttpError, polyfitDataByContact, polyfitDataByUrl, judgeCustomer, judgeClue } from '../utils';
import { DetailContent } from './detailContent';
import { edmDataTracker, EdmDetailOperateType, EDMPvType, HistoryActionTrigger } from '../tracker/tracker';
import { LinkTrackModal } from '../components/linkTrackModal/linkTrackModal';
import { MailReplyListModal } from '../components/historyAction/replyModal';
import { ArriveModal } from '../components/historyAction/arriveModal';
import { ClickModal } from '../components/historyAction/clickModal';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { ProductDataDatail } from './product';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import { ReactComponent as WarningIcon } from '@/images/icons/edm/yingxiao/warningIcon.svg';
import { ReactComponent as CloseIcon } from '@/images/icons/close_icon.svg';
import { ReactComponent as AnxinfaIcon } from '@/images/icons/edm/yingxiao/anxinfa.svg';
import debounce from 'lodash/debounce';
import { AutoMarketTemplateEntry } from './autoMarketTemplateEntry';
import RemarketingDrawer, { getRemarketingStorageData, setRemarketingStorageData, remarketingType } from '../components/RemarketingDrawer/remarketingDrawer';
import RemarketingDropdown from '../components/RemarketingDropdown/remarketingDropdown';
import AiMarketingEnter from '../components/AiMarketingEnter/aiMarketingEnter';
import { findTopPriorityLabel, SiriusCustomerTagByEmail } from '@lxunit/app-l2c-crm';
import { ReactComponent as ExplanationIcon } from '@/images/icons/edm/yingxiao/explanation-gray16px.svg';
import {
  findTagThemeColor,
  findTagToShow,
  findThemeColor,
  getSendStatusText,
  openMail,
  themeSimpleText,
  traceEdmDetailOptionView,
  trackEdmDetailOperation,
  trackResend,
} from './detailHelper';
import { DetailHeader } from './detailHeader';
import { DetailModalInfo, DetailTabConfig, DetailTabOption, MarketingCountEnum, ReplyTypeEnum, SendedTypeEnum, getTabConfig } from './detailEnums';
import { RenderMailto } from './detailComponent';
import { handleCopyDraft } from '../sendedMarketing';
import { getIn18Text } from 'api';
import { DetailTopHeader } from './detailTopHeader';
import { DetailUserInfo } from '../components/DetailUserInfo';
import { SubjectsEffect } from './subjectsEffect';
import { AutoMarketRelation } from './autoMarketRelation';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import CustomerClue, { opType, customerClueContact } from './CustomerClue/customerClue';
import { ReactComponent as DownIcon } from '@/images/icons/edm/downOutlined.svg';
import { ReactComponent as VideoIcon } from '@/images/icons/edm/video.svg';

const systemApi = apiHolder.api.getSystemApi();
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const edmProductApi = apiHolder.api.requireLogicalApi(apis.edmProductDataImpl) as EdmProductDataApi;

const videoDrawerConfig = { videoId: 'V15', source: 'kehukaifa', scene: 'kehukaifa_7' };

const tabLevel2: Record<number, string[]> = {
  2: [getIn18Text('YISONGDA'), getIn18Text('WEISONGDA')],
  3: [getIn18Text('YIDAKAI'), getIn18Text('WEIDAKAI'), '多次打开', '订阅'],
  4: [getIn18Text('YIHUIFU'), getIn18Text('WEIHUIFU')],
  6: [getIn18Text('SHOUJIANREN'), getIn18Text('LIANJIE')],
};

export type ContactInfoModel = ContatInfoForDetail & { maskedEmail: string } & { combineTableData: traceLogItem[] } & { companyId?: string };
const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';

interface DetailTableSource {
  contactEmail: string;
  contactName?: string;
  date?: string | number;
}
const columnsByIndex = [
  ['收件邮箱', '联系人'],
  ['收件邮箱', '发件地址', '发送时间'],
  ['收件邮箱', '发件地址', '送达次数', '最新送达时间'],
  ['coverEmail', '联系人', '打开次数', '最近操作地区', '最近操作时间'],
  ['replyEmail', '回复次数', '最新回复标题', '最新回复时间'],
  ['收件邮箱', '退订时间'],
  ['访问链接', '收件人', '点击次数', '最近操作时间'],
];

const dateColumn = {
  title: getIn18Text('ZUIXINDONGTAISHIJIAN'),
  dataIndex: 'time',
  render(time?: string) {
    return time ? time : '-';
  },
};

// sendList -> unSendList
// arriveList -> unArriveList
const getReversedTabKey = (tabKey: string) => {
  const fieldMap: { [key: string]: string } = {
    readList: 'unreadList',
  };

  return fieldMap[tabKey] || `un${tabKey.slice(0, 1).toUpperCase()}${tabKey.slice(1)}`;
};

interface FromType {
  // 来源页面；list 是任务列表页；templateList 是模板列表页
  from?: 'list' | 'templateList';
  goBack?: () => void;
  // 预览回调
  preview?: boolean;
  // 预览关闭回调
  onPreviewClose?: () => void;
}

export const EdmDetail: React.FC<EdmPageProps & { goBack?: () => any } & FromType> = memo(props => {
  const { from = 'list', preview, onPreviewClose } = props;
  // 是可操作列表, 还是只读列表
  const needShowOperation = from === 'list';
  const fromTemplateList = from === 'templateList';

  // 客户和线索的查看和编辑权限
  const hasCheckCustomerPrivilege = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CONTACT', 'VIEW'));
  const hasCheckCluePrivilege = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CHANNEL', 'VIEW'));
  const hasEditCustomerPrivilege = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CONTACT', 'OP'));
  const hasEditCluePrivilege = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CHANNEL', 'OP'));

  const [tabConfig, setTabConfig] = useState<DetailTabConfig[]>([]);
  const [curTab, setCurTab] = useState<DetailTabOption>(props?.target || DetailTabOption.Marketing);

  const [modalData, setModalData] = useState<Array<IHistoryActionData>>([]);
  const [info, setInfo] = useState<EdmEmailInfo | null>(null);
  const [originListData, setOriginListData] = useState<ResponseSendBoxDetail>();
  const [listData, setListData] = useState<Array<DetailTableSource>>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  // const tableScrollParentRef = useRef<HTMLDivElement>(null);
  // const targetRef = useRef<HTMLDivElement>(null);
  // const currentRef = useRef<HTMLDivElement>(null);
  // const [scrollHeight, setScrollHeight] = useState(266);
  // 首次渲染标识
  const isFirstRender = useRef(true);
  // 用于商品点击次数数据导出时调导出方法
  const productDataDatailRef = useRef(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [showRowSelection, setShowRowSelection] = useState(false);
  const [reverse, setReverse] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<ResponseDetailSubject>();
  const [selectedSubject, setSelectedSubject] = useState<SubjectInfo>();
  const [showTraceModal, setShowTraceModal] = useState(false);

  const [replyType, setReplyType] = useState<ReplyTypeEnum>(ReplyTypeEnum.All);
  const [marketingType, setMarketingType] = useState<MarketingCountEnum>(MarketingCountEnum.All);
  const [sendedSubType, setSendedSubType] = useState<SendedTypeEnum>(SendedTypeEnum.All);

  const currentUser = systemApi.getCurrentUser();
  const currentAccId = currentUser?.prop?.contactId;
  const [showBlackListAlert, setShowBlackListAlert] = useState<boolean>(false);

  const [replyModal, setReplyModal] = useState<DetailModalInfo>({ visible: false });
  const [arriveModal, setArriveModal] = useState<DetailModalInfo>({ visible: false });

  const [clickModal, setClickModal] = useState<{
    data?: traceLogItem[];
    visible: boolean;
  }>({
    visible: false,
  });
  const hasEditPermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'EDM', 'OP'));
  const [productClickData, setProductClickData] = useState<ResponseProductClickData>();

  const isParent = useMemo(() => props.qs.parent === 'true' || props.qs.isParent === '1', [props]);
  const isCircle = useMemo(() => props.qs.circle === 'true', [props]); // 列表页 tab === '分批任务' && 是分批tab下的子任务
  const isLoop = useMemo(() => props.qs.loop === 'true', [props]); // 列表页 tab === '分批任务' 才会传这个 isLoop
  const isOwner = useMemo(() => props.qs.owner, [props.qs]);
  const level: number = useMemo(() => Number(props.qs.level || 1), [props.qs]); // 1代表顶级列表
  // const [isTopFixed, setIsTopFixed] = useState<boolean>(false);
  // 是否展示二次营销alert
  const [showRemarketingAlert, setShowRemarketingAlert] = useState<boolean>(false);
  // 是否展示二次营销抽屉
  const [showMarketingDrawer, setShowMarketingDrawer] = useState<boolean>(false);
  // 详情列表每页数据个数
  const [detailListPageSize, setDetailListPageSize] = useState<number>(10);

  // 用户分布数据
  const [analysisData, setAnalysisData] = useState<SubjectAnalysisRes>();

  // 批量新建线索弹窗
  const [customerClueType, setCustomerClueType] = useState<opType | ''>('');
  // 客户、线索操作的联系人
  const [customerClueContacts, setCustomerClueContacts] = useState<Record<string, customerClueContact[]>>({});
  // 标签及当前显示联系人的身份信息
  const [currentIdentityMap, setCurrentIdentityMap] = useState<Record<string, ResponseCustomerNewLabelByEmail[]>>({});
  // 需要获取联系人的身份信息的列表
  const [identityListData, setIdentityListData] = useState<DetailTableSource[]>([]);

  const { showVideoDrawer } = useActions(ConfigActions);

  // 安心发账号
  const [anxinfaEmail, setAnxinfaEmail] = useState('');

  // const curTabRef = useRef(curTab);
  // useEffect(() => {
  //   curTabRef.current = curTab;
  // }, [curTab]);

  // 根据接口返回结果在 送达人数、打开人数、回复人数、链接点击人数-收件人 下增加录入客户/添加至已有客、录入线索/添加至已有线索下拉按钮，或查看客户、查看线索按钮
  const getCustomerClueScene = () => {
    return [DetailTabOption.Sended, DetailTabOption.Open, DetailTabOption.Reply].includes(curTab) || (DetailTabOption.Link === curTab && !reverse);
  };

  const constructTabList = (subject?: SubjectInfo) => {
    let tabConfigs = new Array<DetailTabConfig>();

    for (let tab in DetailTabOption) {
      if (!isNaN(Number(tab))) {
        continue;
      }

      // 多主题的情况下, 不展示营销人数
      if (subject && subject.subject.length > 0 && tab === DetailTabOption.Marketing) {
        if (curTab === tab) {
          setCurTab(DetailTabOption.Receiver);
        }
        continue;
      }

      let config = getTabConfig(tab as DetailTabOption);
      tabConfigs.push(config);
    }
    tabConfigs.sort((a, b) => {
      return a.tabIndex - b.tabIndex;
    });
    setTabConfig(tabConfigs);
  };

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const fetchData = useCallback(
    (subject?: SubjectInfo, showLoading = true) => {
      showLoading && setLoading(true);
      fetchSubjects();

      const promise = isParent
        ? edmApi.getParentDetail({
            edmEmailId: props.qs.id || props.qs.detailId,
            subject: subject?.subject || undefined,
            hideAutoReply: false, // 数据都拿回来, 端上自己做过滤
          })
        : isCircle
        ? edmApi.getCircleSendBoxDetail({
            batchId: props.qs.id || props.qs.detailId,
            subject: subject?.subject || undefined,
            hideAutoReply: false,
          })
        : edmApi.getSendBoxDetail({
            edmEmailId: props.qs.id || props.qs.detailId,
            subject: subject?.subject || undefined,
            hideAutoReply: false,
          });

      edmProductApi
        .getEdmTaskClickData({
          edmEmailId: props.qs.id || props.qs.detailId,
          subject: subject?.subject || undefined,
        })
        .then(productData => {
          setProductClickData(productData);
        })
        .catch(e => {
          console.log(e);
        })
        .finally(() => {});
      Promise.all([promise])
        .then(([data]) => {
          showLoading && setLoading(false);
          const sliceData = data;
          // sliceData = transformData(sliceData);
          setInfo(sliceData.edmSendboxEmailInfo);
          constructTabList(subject);
          setOriginListData(sliceData);
          if (sliceData) {
            if (Array.isArray(sliceData.readList)) {
              sliceData.readList = sliceData.readList.sort((prev, next) => {
                return moment(next.time).unix() - moment(prev.time).unix();
              });
            }
            if (Array.isArray(sliceData.replyList)) {
              sliceData.replyList = sliceData.replyList.sort((prev, next) => {
                return moment(next.time).unix() - moment(prev.time).unix();
              });
            }
            handleTabClick(curTab, 0, sliceData);
          }
        })
        .catch(e => {
          onHttpError(e);
        })
        .finally(() => {
          showLoading && setLoading(false);
        });
    },
    [reverse, curTab, setOriginListData, selectedSubject, tabConfig, setInfo, props.qs.id, replyType]
  );

  // 获取多域名信息
  const fetchMultiDomainList = async () => {
    try {
      const res: SenderListV2Resp = await edmApi.fetchSenderListV2();
      const anxinfaItem = res.assignSenders?.find(item => item.userType === 1);
      if (anxinfaItem) {
        setAnxinfaEmail(anxinfaItem.email);
      }
    } catch (err) {}
  };

  const fetchLinkDataByTab = (tab: DetailTabOption, list: any, reverse: number = 0) => {
    if (tab !== DetailTabOption.Link) {
      return null;
    }
    if (!!reverse) {
      return polyfitDataByUrl(list);
    } else {
      return polyfitDataByContact(list);
    }
  };

  const fetchSubjects = async () => {
    const edmEmailId = props.qs.id;
    const subjects = isCircle ? await edmApi.getCycleDetailSubject({ batchId: edmEmailId }) : await edmApi.getDetailSubject({ edmEmailId });
    setSubjects(subjects);
  };

  // const onscroll = debounce(async e => {
  //   const targetNode = targetRef.current as unknown as HTMLElement;
  //   const currentNode = currentRef.current as unknown as HTMLElement;
  //   if (!targetNode || !currentNode) {
  //     return;
  //   }
  //   const { top } = targetNode.getBoundingClientRect();
  //   if (top <= 20) {
  //     setIsTopFixed(true);
  //   } else {
  //     setIsTopFixed(false);
  //   }
  // }, 20);

  // 父组件控制预览显示隐藏
  useEffect(() => {
    if (preview != null) {
      setShowPreviewModal(preview);
    }
  }, [preview]);

  useEffect(() => {
    fetchMultiDomainList();
  }, []);

  useEffect(() => {
    if (!showPreviewModal) {
      onPreviewClose && onPreviewClose();
    }
  }, [showPreviewModal]);

  // 获取当前展示页面的联系人身份
  const getCurrentIdentity = () => {
    if (!identityListData || identityListData.length <= 0 || !needShowOperation) {
      return;
    }
    edmApi.getCustomerNewLabelByEmail({ email_list: identityListData.map(item => item.contactEmail) }).then(result => {
      if (result?.length > 0) {
        const resultMap: Record<string, ResponseCustomerNewLabelByEmail[]> = {};
        result.forEach(item => {
          if (item?.contact_email) {
            if (resultMap[item.contact_email]) {
              resultMap[item.contact_email].push(item);
            } else {
              resultMap[item.contact_email] = [item];
            }
          }
        });
        setCurrentIdentityMap(resultMap);
      }
    });
  };

  useEffect(() => {
    getCurrentIdentity();
  }, [JSON.stringify(identityListData)]);

  // listData改变取第一页的标签信息（由于每次切换table上方tab都会回到第一页，所以后续如果做记忆功能这里也要改）
  const updateIdentityListData = (list: DetailTableSource[]) => {
    if (needShowOperation) {
      setIdentityListData(list);
    }
  };
  useEffect(() => {
    updateIdentityListData(listData.slice(0, detailListPageSize));
  }, [listData]);

  // 转换数据：将未发件数据统计到未送达中
  // const transformData = (data: ResponseSendBoxDetail): ResponseSendBoxDetail => {
  //   // unArriveList 不再包含 unSendList   @冠嵩 2023.06.21
  //   // data.unArriveList = [...(data.unArriveList ?? []), ...(data.unSendList ?? [])];
  //   return data;
  // };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    handleTabClick(curTab, 0);
  }, [replyType, marketingType, sendedSubType]);

  useEffect(() => {
    if (props.qs.id || props.qs.detailId) {
      setSelectedSubject(undefined);
      fetchData(undefined);
    }
    edmDataTracker.trackPv(EDMPvType.EdmDetail);
  }, [props.qs.id, props.qs.detailId]);

  const queryUserInfo = useCallback(() => {
    if (!guard(props.qs.edmEmailId) && !guard(props.qs.id) && !guard(props.qs.detailId)) {
      return;
    }

    edmApi
      .sendboxAnalysis({
        batchId: props.qs.batchId,
        edmEmailId: props.qs.edmEmailId || props.qs.id || props.qs.detailId,
        parent: props.qs.parent === 'true',
      })
      .then(res => {
        setAnalysisData(res);
      })
      .catch(err => {
        message.error(err?.msg || err?.message || '未知原因');
      });
  }, [props.qs.edmEmailId, props.qs.id, props.qs.detailId, setAnalysisData]);

  function guard(text?: string): boolean {
    if (text && text.length > 0) {
      return true;
    }
    return false;
  }

  const needShowSameOriginProxy = (contact: ContactInfoModel) => {
    if (contact.verifyStatus !== 5) {
      return false;
    }
    return [DetailTabOption.Receiver, DetailTabOption.Sended, DetailTabOption.Open, DetailTabOption.Reply].includes(curTab);
  };

  // 请求用户分析数据
  useEffect(() => {
    if (guard(props.qs.edmEmailId) || guard(props.qs.id) || guard(props.qs.detailId)) {
      queryUserInfo();
    }
  }, [props.qs.edmEmailId, props.qs.id, props.qs.detailId]);

  const renderSiriusCustomerTag = useCallback(
    (email: string) => {
      if (needShowOperation && currentIdentityMap[email]) {
        return <SiriusCustomerTagByEmail email={email} labelInfos={currentIdentityMap[email]} />;
      }
      return <></>;
    },
    [currentIdentityMap]
  );

  const handleList = (list, filter: boolean) => {
    if (!list || list.length <= 0) {
      return [];
    }
    if (filter) {
      return list
        .map(item => ({ email: item.contactEmail, contact_name: item.contactName, source_name: item.sourceName }))
        .filter(item => {
          const idValue = currentIdentityMap[item.contactEmail] ? findTopPriorityLabel(currentIdentityMap[item.contactEmail])?.email_label : 0;
          return !judgeCustomer(idValue) && !judgeClue(idValue);
        });
    }
    return list.map(item => ({ email: item.contactEmail, contact_name: item.contactName, source_name: item.sourceName }));
  };

  // 统一准备客户、线索组件需要的数据
  const handleCustomerClue = useCallback(
    (type: opType, email?: string) => {
      const detailKey = getTabConfig(DetailTabOption.Link).detailValueKey;
      if (!originListData || !detailKey || !type) {
        return;
      }
      // 添加到已有客户、线索时需要过滤掉已是客户和线索的邮箱
      const isAddExist = [opType.existCustomer, opType.existClue].includes(type);
      // 批量录入线索 需要把各个状态下的联系人数据整理一下传入组件
      const listData = fetchLinkDataByTab(DetailTabOption.Link, originListData[detailKey], reverse);
      const contactObj = {
        [`${DetailTabOption.Sended}_1`]: handleList(originListData?.arriveList, isAddExist),
        [`${DetailTabOption.Sended}_0`]: handleList(originListData?.unArriveList, isAddExist),
        [`${DetailTabOption.Open}_1`]: handleList(originListData?.readList, isAddExist),
        [`${DetailTabOption.Open}_0`]: handleList(originListData?.unreadList, isAddExist),
        [`${DetailTabOption.Open}_3`]: handleList(originListData?.subscribeList, isAddExist),
        [`${DetailTabOption.Reply}_1`]: handleList(originListData?.replyList, isAddExist),
        [`${DetailTabOption.Reply}_0`]: handleList(originListData?.unReplyList, isAddExist),
        [`${DetailTabOption.Link}_1`]: handleList(listData, isAddExist),
      };
      // 单个录入客户/线索和添加至已有客户/线索 需要检索当前选中状态下的列表中是否有相同域名邮件数据
      // 所以要把当前选中状态下的联系人数据整理一下传入组件 把选中邮箱移动到第一个位置
      // 查看客户/线索 也复用这个逻辑，只不过contactObj只有一项即点击项
      let number = [0, 2].includes(reverse) ? 1 : 0;
      // 订阅的特殊逻辑, 先这么写着
      if (curTab === DetailTabOption.Open && reverse === 3) {
        number = 3;
      }

      const curTabItemKey = `${curTab}_${number}`;
      if (contactObj[curTabItemKey] && email) {
        const selectIndex = contactObj[curTabItemKey].findIndex(item => item.email === email);
        const selectItem = contactObj[curTabItemKey].find(item => item.email === email);
        contactObj[curTabItemKey].splice(selectIndex, 1);
        contactObj[curTabItemKey].unshift(selectItem);
      }
      setCustomerClueContacts(contactObj);
      setCustomerClueType(type);
      // 埋点
      switch (type) {
        case opType.batchClue:
          edmDataTracker.track('pc_markting_edm_taskDetail_leadsBatch');
          break;
        case opType.addCustomer:
          edmDataTracker.track('pc_markting_edm_taskDetail_customerCreate');
          break;
        case opType.addClue:
          edmDataTracker.track('pc_markting_edm_taskDetail_leadsCreate');
          break;
        case opType.customer:
          edmDataTracker.track('pc_markting_edm_taskDetail_customerDetail');
          break;
        case opType.clue:
          edmDataTracker.track('pc_markting_edm_taskDetail_leadsDetail');
          break;
        case opType.existCustomer:
          edmDataTracker.track('pc_markting_edm_taskDetail_customerAdd');
          break;
        case opType.existClue:
          edmDataTracker.track('pc_markting_edm_taskDetail_leadsAdd');
          break;
        default:
          break;
      }
    },
    [originListData, reverse, curTab]
  );

  const columns = {
    收件邮箱: {
      title: '收件邮箱',
      dataIndex: 'contactEmail',
      fixed: 'left',
      render: (text: string, item: ContactInfoModel) => {
        return (
          <RenderMailto
            mail={text}
            companyId={item.companyId}
            needOp={needShowOperation}
            sameOriginProxy={needShowSameOriginProxy(item)}
            mailInfoMap={currentIdentityMap}
          />
        );
      },
    },
    replyEmail: {
      title: '收件邮箱',
      dataIndex: 'contactEmail',
      fixed: 'left',
      render: (text: string, item: ContactInfoModel) => (
        <RenderMailto
          mail={text}
          companyId={item.companyId}
          needOp={needShowOperation}
          sameOriginProxy={needShowSameOriginProxy(item)}
          mailInfoMap={currentIdentityMap}
        />
      ),
    },
    coverEmail: {
      title: '收件邮箱',
      dataIndex: 'coverEmail',
      fixed: 'left',
      render: (text: string, item: ContactInfoModel) => (
        <RenderMailto
          mail={text}
          companyId={item.companyId}
          needDecrypt
          decryptEmail={item.contactEmail}
          needOp={needShowOperation}
          sameOriginProxy={needShowSameOriginProxy(item)}
          mailInfoMap={currentIdentityMap}
        />
      ),
    },
    联系人: {
      title: getIn18Text('LIANXIREN'),
      dataIndex: 'contactName',
    },
    发件地址: {
      title: '发件地址',
      dataIndex: 'assignEmail',
      width: 200,
      render: (text: string, item: ContactInfoModel) => {
        return (
          <div className={detailStyle.tableItem}>
            <div className={detailStyle.emailText}>{text || info?.senderEmail}</div>
            {/* 展示安心发icon */}
            {text === anxinfaEmail && <AnxinfaIcon className={detailStyle.anxinfaIcon} />}
          </div>
        );
      },
    },
    打开次数: {
      title: '打开次数',
      dataIndex: 'readCount',
      width: 110,
      render(i, item) {
        return i > 0 ? <a onClick={() => openMenuFor(item, HistoryActionTrigger.ReadCount)}>{i}</a> : '-';
      },
      sorter(a, b) {
        return a.readCount - b.readCount;
      },
    },
    操作: {
      title: '操作',
      ignoreExport: true,
      dataIndex: 'snapshot',
      fixed: 'right',
      render(i, item) {
        // 只有送达人数已送达和送达人数被退信展示邮件详情按钮
        // 20230831暂增需求：多域名任务-不展示邮件详情按钮
        // todo多发件不展示邮件详情按钮
        const showMailDetailBtn = info?.sendboxType !== 6 && curTab === DetailTabOption.Sended && !reverse;
        // 普通任务-送达人数-被退信 以及 多域名任务-送达人数，30天以上不可点击邮件详情并提示
        const specialScene =
          (info?.sendboxType !== 6 && curTab === DetailTabOption.Sended && !reverse && sendedSubType === SendedTypeEnum.Bounced) ||
          (info?.sendboxType === 6 && curTab === DetailTabOption.Sended);
        const currentDate = new Date().getTime();
        const expired = specialScene && currentDate - (item?.date || currentDate) > 30 * 24 * 60 * 60 * 1000;
        const isShowCustomerClueScene = getCustomerClueScene();
        const idValue = currentIdentityMap[item.contactEmail] ? findTopPriorityLabel(currentIdentityMap[item.contactEmail])?.email_label : 0;
        const isCustomer = judgeCustomer(idValue);
        const isClue = judgeClue(idValue);
        const notCustomerClue = !isCustomer && !isClue;
        // 展示新建客户
        const showCreateCustomer = needShowOperation && isShowCustomerClueScene && notCustomerClue && hasEditCustomerPrivilege;
        // 展示新建线索
        const showCreateClue = needShowOperation && isShowCustomerClueScene && notCustomerClue && hasEditCluePrivilege;
        // 展示查看客户
        const showCheckCustomer = needShowOperation && isShowCustomerClueScene && isCustomer && hasCheckCustomerPrivilege;
        // 展示查看线索
        const showCheckClue = needShowOperation && isShowCustomerClueScene && isClue && hasCheckCluePrivilege;
        // 展示-
        const showDefault = !showMailDetailBtn && !showCreateCustomer && !showCreateClue && !showCheckCustomer && !showCheckClue;

        const openMailDetail = item => {
          // 送达人数统一用春贺提供的新接口进行邮件内容查看
          if (sendedSubType === SendedTypeEnum.Bounced && !reverse) {
            // openMail('', props.qs.edmEmailId || props.qs.id || props.qs.detailId, '', `${item.contactEmail}|${item.tid}`);
            openMail('', props.qs.edmEmailId || props.qs.id || props.qs.detailId, '', `${item.contactEmail}|${item.tid}`, true);
          } else if (sendedSubType === SendedTypeEnum.All) {
            openMail('', props.qs.edmEmailId || props.qs.id || props.qs.detailId, '', `${item.contactEmail}|${item.tid}`);
          } else {
            openMail(item.mid);
          }
        };

        return (
          <div className={detailStyle.operate}>
            {showDefault ? <>-</> : <></>}
            {showMailDetailBtn ? (
              <>
                {expired ? (
                  <Tooltip title="支持查看30天内的退信详情">
                    <span className={detailStyle.unOperate}>{getIn18Text('YOUJIANXIANGQING')}</span>
                  </Tooltip>
                ) : (
                  <a onClick={() => openMailDetail(item)}>{getIn18Text('YOUJIANXIANGQING')}</a>
                )}
              </>
            ) : (
              <></>
            )}
            {showCreateCustomer ? (
              <div className={detailStyle.operateRecord}>
                <a className={detailStyle.operateRecordLeft} onClick={() => handleCustomerClue(opType.addCustomer, item?.contactEmail)}>
                  录入客户
                </a>
                <Dropdown
                  trigger={['click']}
                  placement="bottomCenter"
                  overlay={
                    <Menu>
                      <Menu.Item>
                        <a onClick={() => handleCustomerClue(opType.existCustomer, item?.contactEmail)}>添加至已有客户</a>
                      </Menu.Item>
                    </Menu>
                  }
                >
                  <div className={detailStyle.operateRecordRight}>
                    <DownIcon />
                  </div>
                </Dropdown>
              </div>
            ) : (
              <></>
            )}
            {showCreateClue ? (
              <div className={detailStyle.operateRecord}>
                <a className={detailStyle.operateRecordLeft} onClick={() => handleCustomerClue(opType.addClue, item?.contactEmail)}>
                  录入线索
                </a>
                <Dropdown
                  trigger={['click']}
                  placement="bottomCenter"
                  overlay={
                    <Menu>
                      <Menu.Item>
                        <a onClick={() => handleCustomerClue(opType.existClue, item?.contactEmail)}>添加至已有线索</a>
                      </Menu.Item>
                    </Menu>
                  }
                >
                  <div className={detailStyle.operateRecordRight}>
                    <DownIcon />
                  </div>
                </Dropdown>
              </div>
            ) : (
              <></>
            )}
            {showCheckCustomer ? <a onClick={() => handleCustomerClue(opType.customer, item?.contactEmail)}>查看客户</a> : <></>}
            {showCheckClue ? <a onClick={() => handleCustomerClue(opType.clue, item?.contactEmail)}>查看线索</a> : <></>}
          </div>
        );
      },
    },
    最新回复标题: {
      title: getIn18Text('ZUIXINHUIFUBIAOTI'),
      dataIndex: 'replySubject',
      render(text: string) {
        return <Tooltip title={text}>{text}</Tooltip>;
      },
    },
    回复次数: {
      title: '回复次数',
      dataIndex: 'replyCount',
      width: 110,
      render(i, item) {
        return i > 0 ? <a onClick={() => openReplyModal(item)}>{i}</a> : '-';
      },
      sorter(a, b) {
        return a.replyCount - b.replyCount;
      },
    },
    回复邮件: {
      title: getIn18Text('HUIFUYOUJIAN'),
      dataIndex: 'replyCount',
      // sorter: (a, b) => a.replyCount - b.replyCount,
      render(i, item: ContactInfoModel) {
        return <a onClick={() => openReplyModal(item)}>查看</a>;
      },
    },
    退订: {
      title: getIn18Text('SHIFOUTUIDING'),
      dataIndex: 'unsubscribeCount',
      render(i, item) {
        return i > 0 ? <a onClick={() => openMenuFor(item, HistoryActionTrigger.Unsubscribe)}>{getIn18Text('SHI')}</a> : '-';
      },
    },
    客户资料: {
      title: '',
      dataIndex: 'companyId',
      render(companyId: string) {
        return companyId ? <a onClick={() => navigate(`${routerWord}?page=customer&id=${companyId}`)}>{getIn18Text('KEHUZILIAO')}</a> : '-';
      },
    },
    最近操作时间: {
      ...dateColumn,
      title: curTab === DetailTabOption.Open && [0, 2].includes(reverse) ? getIn18Text('ZUIJINDAKAISHIJIAN') : dateColumn.title,
      render: (time?: string) => {
        return time ? time : '-';
      },
    },
    发送时间: { ...dateColumn, title: getIn18Text('FASONGSHIJIAN') },
    最新送达时间: { ...dateColumn, title: '最新送达时间' },
    最新回复时间: { ...dateColumn, title: getIn18Text('ZUIXINHUIFUSHIJIAN') },
    退订时间: { ...dateColumn, title: getIn18Text('TUIDINGSHIJIAN') },
    收件人: {
      title: getIn18Text('SHOUJIANREN'),
      dataIndex: 'contactEmail',
      fixed: 'left',
      render: (text: string, item: ContactInfoModel) => {
        // 链接点击tab下展示邮箱以及发信入口
        const needSendEnterTab = curTab === DetailTabOption.Link;
        return needSendEnterTab ? (
          <RenderMailto mail={text} companyId={item.companyId} needOp={needShowOperation} mailInfoMap={currentIdentityMap} />
        ) : (
          <>
            <Tooltip title={text}>{text}</Tooltip>&nbsp;
            {renderSiriusCustomerTag(text)}
          </>
        );
      },
    },
    访问链接: {
      title: getIn18Text('FANGWENLIANJIE'),
      dataIndex: 'traceUrl',
      render: (text: string) => <Tooltip title={text}>{text}</Tooltip>,
    },
    操作时间: {
      title: getIn18Text('CAOZUOSHIJIAN'),
      dataIndex: 'operateTime',
    },
    送达次数: {
      title: '送达次数',
      dataIndex: isParent ? 'parentArriveCount' : 'arriveCount',
      width: 110,
      render(i, item) {
        // 父任务的送达次数
        if (item.parentArriveCount != null && item.parentArriveCount > 0) {
          return <a onClick={() => openArriveModal(item)}>{item.parentArriveCount}</a>;
        }
        return item.arriveCount > 0 ? <a onClick={() => openArriveModal(item)}>{item.arriveCount}</a> : '-'; // TODO: 点击之后的操作
      },
    },
    点击人数: {
      title: getIn18Text('DIANJIRENSHU'),
      dataIndex: 'clickCount',
      width: 100,
      render: (text: string) => text || '-',
    },
    点击次数: {
      title: getIn18Text('DIANJICISHU'),
      dataIndex: 'clickNums',
      width: 100,
      render(i, item) {
        return i > 0 ? <a onClick={() => openMenuFor(item, HistoryActionTrigger.ReadCount)}>{i}</a> : '-';
      },
    },
    被退信原因: {
      title: '被退信原因',
      dataIndex: 'bounceReason',
      render: (text: string) => text || '-',
    },
    当地时区: {
      title: getIn18Text('DANGDESHIQU'),
      dataIndex: 'timeZone',
      render: (text: string) => text || '-',
    },
    最近操作地区: {
      title: '最近操作地区',
      dataIndex: 'country+province+city',
      render: (_: any, item: ResponseTraceLinkItem) => {
        const str = [item.country, item.province, item.city].filter(text => !!text).join('-');
        return <Tooltip title={str}>{str}</Tooltip>;
      },
    },
    订阅时间: {
      title: '订阅时间',
      dataIndex: 'time',
      render: (text: string) => text || '-',
    },
    未送达原因: {
      title: getIn18Text('WEISONGDAYUANYIN'),
      dataIndex: 'failReason',
      render: (text: string) => text || '-',
    },
    无效原因: {
      title: '无效原因',
      dataIndex: 'failReason+realFailReason',
      render: (_: any, item: any) => {
        let titles = new Array<string>();
        if (item.failReason?.length > 0) {
          titles.push(item.failReason);
        }
        if (item.realFailReason?.length > 0) {
          titles.push(item.realFailReason);
        }
        return <div>{titles.join('-')}</div>;
      },
    },
    发送状态: {
      title: '发送状态',
      dataIndex: 'sendStatusText',
      render: (status: number, item: any) => {
        let title = getSendStatusText(item.sendStatus);
        item.sendStatusText = title;
        return <div>{title}</div>;
      },
    },
    地区: {
      title: getIn18Text('DEQU'),
      dataIndex: 'country+province+city',
      render: (_: any, item: ResponseTraceLinkItem) => {
        const str = [item.country, item.province, item.city].filter(text => !!text).join('-');

        return <Tooltip title={str}>{str}</Tooltip>;
      },
    },
    邮件主题: {
      title: '邮件主题',
      dataIndex: 'subject',
      render: (text: string) => {
        return <Tooltip title={text}>{text}</Tooltip>;
      },
    },
  };

  const columnsSimple = [
    {
      title: '收件邮箱',
      dataIndex: 'contactEmail',
      fixed: 'left',
      render: (text: string, item: ContactInfoModel) => (
        <RenderMailto mail={text} companyId={item.companyId} needOp={needShowOperation} mailInfoMap={currentIdentityMap} />
      ),
    },
    {
      title: getIn18Text('LIANXIREN'),
      dataIndex: 'contactName',
    },
  ];

  const getReadOperateList = useCallback(
    (email: string) => {
      const api = props.qs.owner === 'true' ? edmApi.getReadOperateList.bind(edmApi) : edmApi.getReadOperateListAll.bind(edmApi);
      return api({
        edmEmailId: props.qs.edmEmailId || props.qs.id || props.qs.detailId,
        contactEmail: email,
        parent: isParent,
        batchId: props.qs.batchId,
      }).then(data => data.operateInfoList);
    },
    [props.qs.id, props.qs.owner, props.qs.edmEmailId]
  );

  const getArriveOperateList = useCallback(
    (email: string) => {
      const api = props.qs.owner === 'true' ? edmApi.getArriveOperates.bind(edmApi) : edmApi.getArriveOperatesAll.bind(edmApi);
      return api({
        edmEmailId: props.qs.edmEmailId || props.qs.id || props.qs.detailId,
        contactEmail: email,
        parent: isParent,
        batchId: props.qs.batchId,
      }).then(data => data.arriveInfoList);
    },
    [props.qs.id, replyType, props.qs.owner, props.qs.edmEmailId]
  );

  const getReplyOperateList = useCallback(
    (email: string) => {
      const api = props.qs.owner === 'true' ? edmApi.getReplyOperateList.bind(edmApi) : edmApi.getReplyOperateListAll.bind(edmApi);
      return api({
        edmEmailId: props.qs.edmEmailId || props.qs.id || props.qs.detailId,
        contactEmail: email,
        hideAutoReply: replyType === ReplyTypeEnum.Available,
        parent: isParent,
        batchId: props.qs.batchId,
      }).then(data => data.operateInfoList);
    },
    [props.qs.id, replyType, props.qs.owner, props.qs.edmEmailId]
  );

  const openMenuFor = (detail: ContactInfoModel, from: HistoryActionTrigger) => {
    edmDataTracker.trackHistoryAction('detail', from);
    if (curTab === DetailTabOption.Link) {
      setClickModal({
        visible: true,
        data: detail.combineTableData,
      });
      return;
    }
    getReadOperateList(detail.contactEmail).then(list => {
      setModalData(list as any);
    });
  };
  const openReplyModal = (detail: ContactInfoModel) => {
    getReplyOperateList(detail.contactEmail).then(data => {
      setReplyModal({
        visible: true,
        data,
      });
    });
  };

  const openArriveModal = (detail: ContactInfoModel) => {
    getArriveOperateList(detail.contactEmail).then(data => {
      setArriveModal({ visible: true, data });
    });
  };

  const handleTabClick = (tab: DetailTabOption, level2Type: number = 0, data?: ResponseSendBoxDetail) => {
    const tempData = data || originListData;
    if (curTab !== tab) {
      setCurTab(tab);
    }
    if (tab === DetailTabOption.Prod) {
      return;
    }
    trackEdmDetailOperation(tab);

    setReverse(level2Type);
    setShowRowSelection(false);
    setSelectedRowKeys([]);

    let detailKey = getTabConfig(tab).detailValueKey;
    if (!detailKey || !tempData) {
      return;
    }

    const list = tempData[detailKey] as ContatInfoForDetail[];
    if (tab === DetailTabOption.Link) {
      let listData = fetchLinkDataByTab(tab, list, level2Type);
      setListData(listData);
      return;
    }

    if (level2Type === 1) {
      const reversedTabKey = getReversedTabKey(detailKey);
      setListData([...(tempData[reversedTabKey] || [])]);
      return;
    }
    // 多次打开默认打开次数降序排列
    if (tab === DetailTabOption.Open && level2Type === 2) {
      const updateList = list.filter(item => (item?.readCount || 0) > 1).sort((prev, next) => next?.readCount - prev?.readCount);
      setListData(updateList);
      return;
    }
    // 订阅
    if (tab === DetailTabOption.Open && level2Type === 3) {
      setListData(tempData.subscribeList || []);
      return;
    }
    if (tab === DetailTabOption.Sended && sendedSubType === SendedTypeEnum.Bounced) {
      setListData(tempData.bounceList || []);
      return;
    }
    if (tab === DetailTabOption.Reply) {
      setListData(
        list.filter(item => {
          if (replyType === ReplyTypeEnum.All) {
            return true;
          }
          return replyType === ReplyTypeEnum.Auto ? item.autoReply : !item.autoReply;
        })
      );
      return;
    }
    if (tab === DetailTabOption.Marketing && marketingType === MarketingCountEnum.Filtered) {
      setListData(
        list.filter(item => {
          return item.arriveStatus === 22;
        })
      );
      return;
    }
    setListData([...list]);
  };

  useEffect(() => {
    if (originListData) {
      handleTabClick(curTab, 0);
    }
  }, [originListData]);

  useEffect(() => {
    if (props.target) {
      handleTabClick(props.target, 0);
      return;
    }
    if (props.index) {
      for (let tab in DetailTabOption) {
        if (!isNaN(Number(tab))) {
          continue;
        }
        if (getTabConfig(tab as DetailTabOption).tabIndex === props.index) {
          handleTabClick(tab as DetailTabOption, 0);
          return;
        }
      }
    }
  }, [props.index, props.target]);

  const handleReSendEdm = useCallback(
    async (config = {}) => {
      const isDrawer = Array.isArray(config?.propList) && config?.propList?.length > 0;
      let contacts = isDrawer ? config.propList : listData;
      if (curTab === DetailTabOption.Open && [0, 2].includes(reverse)) {
        // 打开标签，邮件为加密的，需要先解密
        const encryptEmails = contacts.map(i => i.contactEmail).join(',');
        const data = await edmApi.getDecryptEmail({ contactEmails: encryptEmails });
        if (data.length !== contacts.length) {
          // 解密失败
          // toast.error({ content: '解析' });
          // return;
        }
        contacts = data.map((s: string, index) => ({
          ...contacts[index],
          contactEmail: s,
        }));
      }
      let emailContent = '';
      // 再次发件时候，邮件内容部分可以带着上一次营销邮件的内容
      if (config.copyContent || config.copyHeader) {
        const data = await edmApi.copyFromSendBox({ edmEmailId: props.qs.id });
        if (data?.contentEditInfo?.emailContent) {
          emailContent = data.contentEditInfo.emailContent;
        }
      }
      const body = await edmApi.copyFromSendBox({ edmEmailId: props.qs.id });
      const id = await edmApi.createDraft();
      await edmApi.saveDraft({
        draftId: id,
        draftType: body.sendboxType,
        currentStage: 0,
        contentEditInfo: {
          emailContent,
          emailAttachment: '',
        },
        // 传递数据
        sendSettingInfo: body.sendSettingInfo,
        receiverInfo: {
          contacts: contacts.map(i => ({ name: i.contactName || '', email: i.contactEmail })),
        },
      });

      !isDrawer && trackResend(curTab, config);
      setShowMarketingDrawer(false);
      let typeStr = body.sendboxType === 6 ? '&channel=senderRotate' : '';
      navigate(`${routerWord}?page=write${typeStr}&resend=1&id=${id}${config.copyHeader ? `&cphd=1&replyEdmEmailId=${props.qs.id}` : ''}`);
    },
    [listData, curTab, selectedRowKeys]
  );

  const handlePushUpdate = (nextPush: boolean) => {
    edmApi
      .updateEdmEmailPush({
        edmEmailId: props.qs.id || props.qs.detailId,
        push: nextPush,
      })
      .then(() => {
        info && setInfo({ ...info, push: nextPush });
      })
      .finally(() => {});
  };

  const handleViewContent = () => {
    setShowPreviewModal(!showPreviewModal);

    edmDataTracker.trackEdmDetailOperation(EdmDetailOperateType.View, {
      buttonname: '查看',
    });
  };

  const handleReuse = () => {
    if (isCircle) {
      navigate(`${routerWord}?page=write`);
      return;
    }
    if (!info?.edmEmailId) {
      return;
    }
    edmDataTracker.trackEdmDetailOperation(EdmDetailOperateType.Reuse, {
      buttonname: '复制任务',
    });
    handleCopyDraft(info.edmEmailId, info);
  };
  // 头部组件
  const renderTopInfo = (info: EdmEmailInfo | null) => {
    if (!info) {
      return null;
    }
    return <DetailTopHeader tabConfig={tabConfig} info={info} />;
  };
  // 主题效果对比
  const renderSubjects = () => {
    if (!analysisData || (analysisData?.subjectAnalysisList || []).length < 1) {
      return null;
    }
    return <SubjectsEffect data={analysisData.subjectAnalysisList} />;
  };

  const renderBasicInfo = (info: EdmEmailInfo | null) => {
    if (!info) {
      return null;
    }
    return (
      <DetailHeader
        goBack={props.goBack}
        isCircle={isCircle}
        isLoop={isLoop}
        handleViewContent={handleViewContent}
        qs={props.qs}
        source={from}
        info={info}
        level={level}
        handleReuse={handleReuse}
        handlePushUpdate={handlePushUpdate}
        detail={originListData}
        from={from}
      />
    );
  };

  useEffect(() => {
    setShowRowSelection(selectedRowKeys.length > 0);
  }, [selectedRowKeys]);

  const rowSelection = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (rowKeys: string[]) => setSelectedRowKeys(rowKeys),
  };
  const canShowRowSelection = curTab !== DetailTabOption.Prod && listData.length > 0 && hasEditPermission;

  let tabIndex = getTabConfig(curTab).tabIndex;
  const tabText = tabLevel2[tabIndex]; // TODO: 枚举 @hanxu
  if (curTab === DetailTabOption.Link && !!reverse) {
    columnsByIndex[tabIndex] = ['访问链接', '点击人数', '点击次数', '最近操作时间']; // TODO: 数组干掉
  } else if (curTab === DetailTabOption.Link && !reverse) {
    columnsByIndex[tabIndex] = ['收件人', '访问链接', '点击次数', '最近操作时间', '操作'];
  }
  // if (curTab === DetailTabOption.Receiver && info?.sendboxType !== 6) {
  //   columnsByIndex[tabIndex] = ['收件邮箱', '发送时间'];
  // }

  let tableColumns =
    curTab === DetailTabOption.Prod
      ? []
      : !!reverse && ![DetailTabOption.Open, DetailTabOption.Reply, DetailTabOption.Link].includes(curTab)
      ? columnsSimple
      : columnsByIndex[tabIndex].map(key => columns[key]).filter(i => !!i);

  if (curTab === DetailTabOption.Open) {
    if (reverse === 1) {
      tableColumns = [columns['收件邮箱']];
    } else {
      // 多主题
      if (subjects && subjects.emailSubjects.length > 1 && selectedSubject === undefined) {
        tableColumns.splice(1, 0, columns['邮件主题']);
      }
    }
    tableColumns.push(columns['操作']);
  }
  if (curTab === DetailTabOption.Receiver && info?.sendboxType !== 6) {
    tableColumns = [columns['收件邮箱'], columns['发送时间']];
  }
  if (curTab === DetailTabOption.Sended) {
    if (!!reverse) {
      tableColumns = [columns['收件邮箱'], columns['发件地址'], columns['联系人']];
    } else {
      tableColumns = [columns['收件邮箱'], columns['发件地址'], columns['联系人'], columns['送达次数'], columns['最新送达时间']];
    }
  }

  if (curTab === DetailTabOption.Reply) {
    if (!!reverse) {
      tableColumns = [columns['收件邮箱']];
    }
    tableColumns.push(columns['操作']);
  }
  // 送达人数 -> 未送达
  if (curTab === DetailTabOption.Sended && !!reverse) {
    tableColumns.push(columns['未送达原因']);
    tableColumns.push(columns['操作']);
    // tableColumns.forEach(item => (item.width = item.width || 'auto'));
  }
  // 送达人数 -> 已送达
  if (curTab === DetailTabOption.Sended && !reverse) {
    if (sendedSubType === SendedTypeEnum.Bounced) {
      tableColumns = tableColumns.filter(item => {
        return item.dataIndex !== 'time' && item.dataIndex !== 'parentArriveCount' && item.dataIndex !== 'arriveCount';
      });
      tableColumns.push(columns['联系人']);
      tableColumns.push(columns['被退信原因']);
    }
    tableColumns.push(columns['操作']);
  }
  if (curTab === DetailTabOption.Marketing) {
    marketingType === MarketingCountEnum.All && tableColumns.push(columns['发送状态']);
    marketingType === MarketingCountEnum.Filtered && tableColumns.push(columns['无效原因']);
  }
  // 订阅
  if (curTab === DetailTabOption.Open && reverse === 3) {
    tableColumns = [columns['收件邮箱'], columns['联系人'], columns['订阅时间'], columns['操作']];
  }

  // 返回列表，如果非弹窗模式则用navigate
  const goBack = () => {
    edmDataTracker.trackEdmDetailOperation(EdmDetailOperateType.Tab, {
      buttonname: '返回',
    });
    if (typeof props.goBack === 'function') {
      props.goBack();
      return;
    }
    // web端返回
    navigate(`${routerWord}?page=index`);
  };

  // 导出统计数据列表
  const handleStatExport = useCallback(
    (data: any[]) => {
      if (curTab === DetailTabOption.Prod) {
        productDataDatailRef?.current?.handleExport();
        return;
      }

      if (data?.length <= 0) {
        message.warn('暂无可导出数据');
        return;
      }

      // sendStatusText 是客户端计算属性
      if (curTab === DetailTabOption.Marketing && marketingType === MarketingCountEnum.All) {
        data.forEach(item => {
          item.sendStatusText = getSendStatusText(item.sendStatus);
        });
      }

      const taskName = originListData?.edmSendboxEmailInfo.edmSubject;
      let tabName = getTabConfig(curTab).title;
      let secondTabName = '';

      let index = getTabConfig(curTab).tabIndex;
      if (tabLevel2[index]) {
        secondTabName = tabLevel2[index][reverse];
      }

      let names = new Array<string>();
      taskName && taskName.length > 0 && names.push(taskName);
      tabName && tabName.length > 0 && names.push(tabName);
      secondTabName && secondTabName.length > 0 && names.push(secondTabName);
      let time = moment().format('YYYY-MM-DD');
      time && time.length > 0 && names.push(time);
      let fileName = `${names.join('_')}.csv`;
      const fieldLabels = tableColumns.filter(item => !item.ignoreExport).map(item => item.title);
      const fieldKeys = tableColumns.filter(item => !item.ignoreExport).map(item => item.dataIndex);
      if (curTab === DetailTabOption.Link) {
        if (!!reverse) {
          data = polyfitDataByUrl(data);
        } else {
          data = polyfitDataByContact(data);
        }
      }
      exportExcel(data, fieldLabels, fieldKeys, fileName);
    },
    [originListData, reverse, curTab, tableColumns]
  );

  // 面包屑区域,任务通知开关
  const renderBreadCrumb = () => {
    if (fromTemplateList) {
      return <></>;
    }
    return (
      <div className={style.breadCrumb}>
        <Breadcrumb separator={<SeparatorSvg />}>
          <Breadcrumb.Item className={style.breadCrumbItem} onClick={goBack}>
            {getIn18Text('RENWULIEBIAO')}
          </Breadcrumb.Item>
          <Breadcrumb.Item>{getIn18Text('RENWUXIANGQING')}</Breadcrumb.Item>
        </Breadcrumb>
        {/* <div className={classnames([style.breadCrumbItem, style.clickableCrumb])} onClick={goBack}>
          {getIn18Text('RENWULIEBIAO')}
        </div>
        <ArrowRight stroke="#51555C" />
        <div className={classnames([style.breadCrumbItem, style.breadCrumbActive])}>{getIn18Text('RENWUXIANGQING')}</div> */}
        <a
          onClick={() => {
            fetchData(selectedSubject);
            queryUserInfo();
          }}
          className="edm-page-refresh"
          style={{ display: 'flex' }}
        >
          <RefreshSvg />
        </a>
        <div className={detailStyle.infoOptions}>
          <p className={detailStyle.videoTip} onClick={() => showVideoDrawer(videoDrawerConfig)}>
            <VideoIcon /> <span>快速了解邮件营销如何提升送达效果</span>
          </p>
          <Divider type="vertical" style={{ height: 20, margin: '0 15px' }} />
          {/* 任务通知开关 */}
          {needShowOperation && !isCircle && (
            <div className={detailStyle.push}>
              <span>{getIn18Text('RENWUTONGZHI')}</span>
              <Switch checked={info?.push} onChange={handlePushUpdate} />
            </div>
          )}
        </div>
      </div>
    );
  };

  // const themeComp = () => {
  //   if (subjects === undefined || subjects.emailSubjects.length <= 1) {
  //     return null;
  //   }

  //   edmDataTracker.track('pc_markting_edm__taskdetail_multi_subjects_view');

  //   return (
  //     <div className={detailStyle.themeArea}>
  //       <div
  //         className={selectedSubject ? detailStyle.themeButton : detailStyle.themeButtonSelected}
  //         onClick={() => {
  //           setSelectedSubject(undefined);
  //           fetchData(undefined, false);
  //         }}
  //       >
  //         {getIn18Text('QUANBU')}
  //       </div>
  //       {subjects &&
  //         subjects.emailSubjects.map((item, index) => {
  //           const title = '主题' + (index + 1).toString();
  //           return (
  //             <div style={{ position: 'relative' }}>
  //               <div
  //                 className={item.subject === selectedSubject?.subject && index === selectedSubject.index ? detailStyle.themeButtonSelected : detailStyle.themeButton}
  //                 onClick={() => {
  //                   edmDataTracker.track('pc_markting_edm__taskdetail_multi_subjects_click', {
  //                     tag_content: themeSimpleText(findTagToShow(item)),
  //                   });
  //                   item.index = index;
  //                   setSelectedSubject(item);
  //                   fetchData(item, false);
  //                 }}
  //               >
  //                 {title}
  //               </div>
  //               <div style={{ background: findThemeColor(item).bgColor }} className={detailStyle.themeTag}>
  //                 {themeSimpleText(findTagToShow(item))}
  //               </div>
  //             </div>
  //           );
  //         })}
  //     </div>
  //   );
  // };

  const SelectedThemeComp = () => {
    if (!selectedSubject) {
      return null;
    }

    let targetIndex = selectedSubject.index;
    return (
      <div className={detailStyle.themeDetail}>
        {targetIndex !== undefined && targetIndex >= 0 && (
          <div style={{ flexShrink: '0' }}>
            {getIn18Text('ZHUTI')}
            {targetIndex + 1}：
          </div>
        )}
        <div className={detailStyle.ellipsis}>{selectedSubject.subject}</div>
        {selectedSubject.tagList &&
          selectedSubject.tagList.length > 0 &&
          selectedSubject.tagList.map(item => {
            return (
              <div className={detailStyle.themeTagSelected} style={{ background: findTagThemeColor(item)?.bgColor, color: findTagThemeColor(item)?.titleColor }}>
                {item.tagDesc}
              </div>
            );
          })}
      </div>
    );
  };

  const DetailHeaderComp = () => {
    return (
      <div className={detailStyle.hd}>
        <div
          className={detailStyle.title}
          // ref={targetRef}
        >
          营销列表
        </div>
        {/* <div className={`${detailStyle.productDetailBtn} ${isTopFixed ? detailStyle.productDetailBtnFixed : ''}`} ref={currentRef}>
          {themeComp()}
        </div> */}
      </div>
    );
  };

  const HistoryActionComp = () => {
    if (modalData.length <= 0) {
      return null;
    }
    return <HistoryActionModal visible={modalData.length > 0} data={modalData} onCancel={() => setModalData([])} onOpenMail={openMail} />;
  };
  const ViewEdmContentComp = () => {
    if (!showPreviewModal) {
      return null;
    }

    return (
      <DetailContent
        visible={showPreviewModal}
        info={info}
        subjects={subjects}
        multi={originListData?.multipleContentInfo}
        isLoop={isLoop}
        onCancel={() => {
          console.log('come herr');
          setShowPreviewModal(false);
        }}
        destroyOnClose
        id={props.qs.edmEmailId ?? props.qs.id}
      />
    );
  };
  const LinkTrackComp = () => {
    if (!showTraceModal) {
      return;
    }
    return <LinkTrackModal edmEmailId={props.qs.id} visible={showTraceModal} onCancel={() => setShowTraceModal(false)} />;
  };
  const MailReplyListComp = () => {
    if (!replyModal.visible) {
      return;
    }
    return (
      <MailReplyListModal
        onCancel={() => setReplyModal({ visible: false })}
        data={replyModal.data}
        visible={replyModal.visible}
        isPrivilege={props.qs.owner !== 'true'}
      />
    );
  };
  const ArriveListComp = () => {
    if (!arriveModal.visible) {
      return;
    }
    return <ArriveModal onCancel={() => setArriveModal({ visible: false })} data={arriveModal.data} visible={arriveModal.visible} />;
  };
  const ClickModalComp = () => {
    if (!clickModal.visible) {
      return;
    }
    return (
      <ClickModal
        data={clickModal.data}
        visible={clickModal.visible}
        onCancel={() => {
          setClickModal({ visible: false });
        }}
      />
    );
  };

  const RemarketingDrawerComp = () => {
    if (!showMarketingDrawer) {
      return;
    }
    return (
      <RemarketingDrawer
        visible={showMarketingDrawer}
        info={info as EdmEmailInfo}
        listData={originListData as ResponseSendBoxDetail}
        handleClick={(type?: remarketingType, key?: string) => {
          setShowMarketingDrawer(false);
          handleDropdownReWriteClick(type, key);
        }}
        onCancel={() => setShowMarketingDrawer(false)}
        needDropdown
      />
    );
  };

  const CustomerClueComp = () => {
    if (!customerClueType) {
      return;
    }

    let number = [0, 2].includes(reverse) ? 1 : 0;
    // 订阅的特殊逻辑, 先这么写着
    if (curTab === DetailTabOption.Open && reverse === 3) {
      number = 3;
    }

    return (
      <CustomerClue
        contacts={customerClueContacts}
        type={customerClueType}
        onClose={handleCustomerClueClose}
        initStatus={`${curTab}_${number}`}
        edmEmailId={props.qs.edmEmailId || props.qs.id || props.qs.detailId}
        edmSubject={info?.edmSubject || ''}
        contactsMap={currentIdentityMap}
      />
    );
  };

  // 再次营销按钮包括下拉
  const handleDropdownReWriteClick = (propType?: remarketingType, key?: string) => {
    const propList = propType ? lodashGet(originListData, propType, []) : undefined;
    if (isCircle) {
      return;
    }

    if (key) {
      handleReSendEdm({ [key]: true, propList });
    } else {
      handleReSendEdm({ propList });
    }

    if (propType) {
      edmDataTracker.track('pc_markting_edm_taskdetail_remarkting_card_click', { click_type: propType });
    }
  };

  const AddBlackListSecondryConfigmComp = () => {
    if (!showBlackListAlert) {
      return;
    }
    return (
      <Dialog
        isModalVisible={showBlackListAlert}
        isCancel
        okText={'确定'}
        title={'确定加入黑名单吗'}
        content={getIn18Text('SHIFOUJIANGXUANZHONGYOUJIAN')}
        onCancel={() => {
          setShowBlackListAlert(false);
        }}
        onOk={() => {
          const doAddAction = async () => {
            const list = selectedRowKeys.map(item => {
              return { email: item };
            });
            const req: RequsetAddBlackList = { contactList: list };
            try {
              const _ = await edmApi.addToBlackList(req);
              setShowBlackListAlert(false);
              message.success(getIn18Text('CHENGGONGJIARUHEIMINGDAN'));
              edmDataTracker.track('pc_markting_taskdetail_nondelivery_add_in_blacklist');
            } catch (error) {
              const err = error as { message: string };
              message.error(err.message);
              setShowBlackListAlert(false);
            }
          };
          doAddAction();
        }}
      />
    );
  };

  const handleAddBlackList = () => {
    if (listData.length === 0) {
      message.error(getIn18Text('ZANWUSHUJU'));
      return;
    }

    if (selectedRowKeys.length === 0) {
      message.error(getIn18Text('QINGGOUXUANJIARUHEIMING'));
      return;
    }
    setShowBlackListAlert(true);
  };

  const handleBatchExport = () => {
    edmDataTracker.track('pc_markting_taskdetail_export_part');
    if (listData.length > 0 && selectedRowKeys.length === 0) {
      message.error(getIn18Text('QINGXIANGOUXUANDAOCHUSHU'));
      return;
    }

    let key = getTabConfig(curTab).detailValueKey;
    if ([1].includes(reverse) && key) {
      key = getReversedTabKey(key);
    }
    if (curTab === DetailTabOption.Open && reverse === 3) {
      key = 'subscribeList';
    }
    let currentListData: [{ contactEmail: string; coverEmail: string }] = originListData ? (originListData as any)[key] : [];

    let finalData: any[] = [];
    selectedRowKeys.forEach(email => {
      currentListData.forEach(data => {
        if (curTab === DetailTabOption.Link && email === data.id) {
          finalData.push(data);
          return;
        }
        if (email === data.contactEmail || email === data.coverEmail) {
          finalData.push(data);
          return;
        }
      });
    });

    console.log('');
    handleStatExport(finalData);
  };
  const handleExportAll = () => {
    edmDataTracker.track('pc_markting_taskdetail_export_all');
    traceEdmDetailOptionView(curTab);
    handleStatExport(listData);
  };

  const FilterLevel2Comp = () => {
    if (!tabText) {
      return null;
    }
    return (
      <div className={detailStyle.capsule}>
        {tabText.map((item, index) => (
          <div className={classnames([detailStyle.capsuleItem, { active: reverse === index }])} onClick={() => handleTabClick(curTab, index)}>
            {item}
          </div>
        ))}
      </div>
    );
  };

  const FilterLevel3Comp = () => {
    const needShowMarketingOption = !isLoop && curTab === DetailTabOption.Marketing && info?.sendModeDesc === '便捷发送';
    const needShowSendedOption = !isLoop && curTab === DetailTabOption.Sended && !reverse;

    // 是否显示回复 Tab 的二次筛选
    const needShowReplyOption = curTab === DetailTabOption.Reply && !reverse;

    // 是否显示操作已选 x 个的提示
    const needShowPickCount = needShowOperation && !needShowReplyOption && !needShowMarketingOption && !needShowSendedOption;

    const leftPartHasButtons = needShowReplyOption || needShowOperation || needShowMarketingOption || needShowSendedOption;

    if (!leftPartHasButtons) {
      return null;
    }

    const ReplyOptionComp = () => {
      const ReplyOptionList = [
        {
          key: ReplyTypeEnum.All,
          value: getIn18Text('QUANBU'),
        },
        {
          key: ReplyTypeEnum.Available,
          value: getIn18Text('SHOUDONGHUIFU'),
          tip: '不是自动回复的回复邮件，则认为是用户手动回复的邮件',
        },
        {
          key: ReplyTypeEnum.Auto,
          value: getIn18Text('ZIDONGHUIFU'),
          tip: '【已回复】的邮箱中，若每次回复邮件都被认定是自动回复，则此邮箱将被标记为“自动回复”',
        },
      ];
      const setReplyAction = (type: ReplyTypeEnum) => {
        if (type === ReplyTypeEnum.Auto) {
          edmDataTracker.track('pc_markting_taskdetai_reply_click', {
            click_content: getIn18Text('ZIDONGHUIFU'),
          });
        }
        if (type === ReplyTypeEnum.Available) {
          edmDataTracker.track('pc_markting_taskdetai_reply_click', {
            click_content: getIn18Text('YOUXIAOHUIFU'),
          });
        }
        setReplyType(type);
      };
      return tabText ? (
        <EnhanceSelect dropdownMatchSelectWidth={150} bordered={false} value={replyType} onChange={setReplyAction}>
          {ReplyOptionList.map(item => (
            <InSingleOption key={item.key} value={item.key}>
              <div className={detailStyle.selectItem}>
                {item.value}
                {item.tip ? (
                  <Tooltip title={item.tip}>
                    <CardHelpIcon />
                  </Tooltip>
                ) : (
                  <></>
                )}
              </div>
            </InSingleOption>
          ))}
        </EnhanceSelect>
      ) : (
        <div className={detailStyle.capsule}>
          {ReplyOptionList.map(item => (
            <div key={item.key} className={classnames([detailStyle.capsuleItem, { active: replyType === item.key }])} onClick={() => setReplyAction(item.key)}>
              {item.value}
              {item.tip ? (
                <Tooltip title={item.tip}>
                  <CardHelpIcon />
                </Tooltip>
              ) : (
                <></>
              )}
            </div>
          ))}
        </div>
      );
    };

    const SendedOptionComp = () => {
      const SendedOptionList = [
        {
          key: SendedTypeEnum.All,
          value: getIn18Text('QUANBU'),
        },
        {
          key: SendedTypeEnum.Bounced,
          value: getIn18Text('BEITUIXIN'),
          tip: '发信方送达后，被收信方退信的邮件地址',
        },
      ];

      const setSendedSubAction = (type: SendedTypeEnum) => {
        setSendedSubType(type);
      };

      return tabText ? (
        <EnhanceSelect dropdownMatchSelectWidth={150} bordered={false} value={sendedSubType} onChange={setSendedSubAction}>
          {SendedOptionList.map(item => (
            <InSingleOption key={item.key} value={item.key}>
              <div className={detailStyle.selectItem}>
                {item.value}
                {item.tip ? (
                  <Tooltip title={item.tip}>
                    <CardHelpIcon />
                  </Tooltip>
                ) : (
                  <></>
                )}
              </div>
            </InSingleOption>
          ))}
        </EnhanceSelect>
      ) : (
        <div className={detailStyle.capsule}>
          {SendedOptionList.map(item => (
            <div key={item.key} className={classnames([detailStyle.capsuleItem, { active: sendedSubType === item.key }])} onClick={() => setSendedSubAction(item.key)}>
              {item.value}
              {item.tip ? (
                <Tooltip title={item.tip}>
                  <CardHelpIcon />
                </Tooltip>
              ) : (
                <></>
              )}
            </div>
          ))}
        </div>
      );
    };

    const MarketingOptionComp = () => {
      const MarketingOptionList = [
        {
          key: MarketingCountEnum.All,
          value: getIn18Text('QUANBU'),
        },
        {
          key: MarketingCountEnum.Filtered,
          value: getIn18Text('YICHANG(WUXIAO)'),
          tip: '系统在便捷任务实际发送前过滤出的无效地址，无效地址不发送营销邮件',
        },
      ];

      const setMarketingAction = (type: MarketingCountEnum) => {
        setMarketingType(type);
      };

      return tabText ? (
        <EnhanceSelect dropdownMatchSelectWidth={150} bordered={false} value={marketingType} onChange={setMarketingAction}>
          {MarketingOptionList.map(item => (
            <InSingleOption key={item.key} value={item.key}>
              <div className={detailStyle.selectItem}>
                {item.value}
                {item.tip ? (
                  <Tooltip title={item.tip}>
                    <ExplanationIcon />
                  </Tooltip>
                ) : (
                  <></>
                )}
              </div>
            </InSingleOption>
          ))}
        </EnhanceSelect>
      ) : (
        <div className={detailStyle.capsule}>
          {MarketingOptionList.map(item => (
            <div key={item.key} className={classnames([detailStyle.capsuleItem, { active: marketingType === item.key }])} onClick={() => setMarketingAction(item.key)}>
              {item.value}
              {item.tip ? (
                <Tooltip title={item.tip}>
                  <ExplanationIcon />
                </Tooltip>
              ) : (
                <></>
              )}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className={detailStyle.filter}>
        {needShowPickCount && (
          <div>
            {getIn18Text('YIXUAN')}
            {selectedRowKeys.length}
            {getIn18Text('GE')}
          </div>
        )}
        {needShowReplyOption && ReplyOptionComp()}
        {needShowMarketingOption && MarketingOptionComp()}
        {needShowSendedOption && SendedOptionComp()}
      </div>
    );
  };

  const ActionRightComp = () => {
    const needShowMarketingOption = !isLoop && curTab === DetailTabOption.Marketing && info?.sendModeDesc === '便捷发送';
    const needShowSendedOption = !isLoop && curTab === DetailTabOption.Sended && !reverse;
    // 是否有 导出 / 再次营销权限
    const hasRightToReUse = isOwner && needShowOperation;

    // 是否要展示 再次营销
    const isReWriteScene =
      hasRightToReUse &&
      ((curTab === DetailTabOption.Sended && sendedSubType !== SendedTypeEnum.Bounced) ||
        curTab === DetailTabOption.Open ||
        (curTab === DetailTabOption.Reply && !!reverse));
    const canAddBlackList =
      (curTab === DetailTabOption.Sended && !!reverse) || (needShowMarketingOption && marketingType === MarketingCountEnum.Filtered) || needShowSendedOption;

    var isRecordClueScene = [DetailTabOption.Sended, DetailTabOption.Open, DetailTabOption.Reply, DetailTabOption.Link].includes(curTab);
    if (curTab === DetailTabOption.Open && reverse === 3) {
      isRecordClueScene = false;
    }

    // 是否要展示 营销托管
    // 非普通任务子任务、送达、打开tab下、非分批任务子任务
    const isAiHostingScene = +props.qs.level !== 2 && (curTab === DetailTabOption.Sended || curTab === DetailTabOption.Open) && !(isLoop && !props.qs.batchId);

    const rightPartHasButtons = hasRightToReUse || isReWriteScene || canAddBlackList;

    if (!needShowOperation || !rightPartHasButtons) {
      return null;
    }

    const aiHostingSceneList: AiMarketingContact[] = [];
    if (originListData && isAiHostingScene) {
      let key = getTabConfig(curTab).detailValueKey;
      if ([1].includes(reverse) && key) {
        key = getReversedTabKey(key);
      }
      if (curTab === DetailTabOption.Open && reverse === 3) {
        key = 'subscribeList';
      }
      originListData[key]
        ?.filter(item => selectedRowKeys.includes(item.contactEmail))
        ?.forEach(item => {
          aiHostingSceneList.push({
            contactName: item.contactName,
            contactEmail: item.contactEmail,
          });
        });
    }

    return (
      <div className={detailStyle.rightPart}>
        {isRecordClueScene && hasEditCluePrivilege && (
          <Button btnType="minorLine" onClick={() => handleCustomerClue(opType.batchClue)} className={detailStyle.actionButton}>
            全部录入线索
          </Button>
        )}
        {isOwner && (
          <Button
            btnType="minorLine"
            onClick={() => {
              handleBatchExport();
            }}
            className={detailStyle.actionButton}
          >
            {getIn18Text('PILIANGDAOCHU')}
          </Button>
        )}
        {canAddBlackList && (
          <Button
            btnType="minorLine"
            onClick={() => {
              handleAddBlackList();
            }}
            className={detailStyle.actionButton}
          >
            {getIn18Text('PILIANGJIAHEIMINGDAN')}
          </Button>
        )}
        {isOwner && (
          <Button
            btnType="minorLine"
            onClick={() => {
              handleExportAll();
            }}
            className={detailStyle.actionButton}
          >
            {getIn18Text('QUANBUDAOCHU')}
          </Button>
        )}
        {/* 再次营销 */}
        {isReWriteScene && !isCircle && <RemarketingDropdown info={info as EdmEmailInfo} handleClick={handleDropdownReWriteClick} needDropdown />}
        {/* 营销托管入口 */}
        {isAiHostingScene && <AiMarketingEnter contacts={aiHostingSceneList} guideKey="taskDetailListHosting" trackFrom="detail" />}
      </div>
    );
  };

  const SectionGapComp = () => {
    return <div className={detailStyle.sectionGap}></div>;
  };

  const getIfExistCard = () => {
    let storageData = getRemarketingStorageData(info?.edmEmailId || '');
    const arriveUnOpen = lodashGet(originListData, 'unreadList.length', 0);
    const openUnReply = lodashGet(originListData, 'unReplyList.length', 0);
    const unReply = lodashGet(originListData, 'arriveUnReplyList.length', 0);
    const multipleRead = lodashGet(originListData, 'multipleReadList.length', 0);
    // 用户点击过关闭
    if (storageData?.remarketingAlert) {
      return false;
    }
    // 未缓存，剩余四个为0
    if (!arriveUnOpen && !openUnReply && !unReply && !multipleRead) {
      return false;
    }
    return true;
  };

  // 决定是否展示二次营销alert
  // 下列情况才展示操作引导条：
  // 从正常列表入口进入
  // 且非二次营销父任务!(+props.qs.level === 1 && props.qs.parent === 'true')
  // 且非二次营销子任务 !(+props.qs.level === 2 && 为二次营销)
  // 且非分批任务（!isLoop）
  // 且任务已经发送完成（info?.emailStatus === 2）
  // 且并存在已送达未打开（originListData.unreadList） 或 已打开未回复（originListData.unReplyList） 或 未回复的用户（originListData.arriveUnReplyList） 或 多次打开的用户（originListData.multipleReadList）
  // 且用户未点击过关闭（按任务维度info.edmEmailId记在本地）
  // 0915去除此逻辑：且侧边栏里的存在可展示的策略卡片（这个是因为点击过哪个卡片，哪个卡片就不再展示了）（按任务维度info.edmEmailId记在本地）
  useEffect(() => {
    const isShow = needShowOperation && +props.qs.level === 1 && props.qs.parent !== 'true' && !isLoop && info?.emailStatus === 2 && getIfExistCard();
    setShowRemarketingAlert(!!isShow);
  }, [props.qs, props.qs, isLoop, info, originListData, from]);

  // 二次营销引导条
  const RemarketingComp = () => {
    const storageData = getRemarketingStorageData(info?.edmEmailId || '');

    const closeAlert = () => {
      setShowRemarketingAlert(false);
      setRemarketingStorageData(info?.edmEmailId || '', { remarketingAlert: true });
      edmDataTracker.track('pc_markting_edm_taskdetail_remarkting_lead_close');
    };

    const openDrawer = () => {
      setShowMarketingDrawer(true);
      edmDataTracker.track('pc_markting_edm_taskdetail_remarkting_lead_click');
    };

    return (
      <Alert
        className={detailStyle.remarketingAlert}
        message={
          <span className={detailStyle.marketingInfo}>
            <WarningIcon />
            {/* 不存在未打开或已点击过未打开二次营销，展示不同文案 */}
            {lodashGet(originListData, 'unreadList.length', 0) === 0 || storageData?.unreadList
              ? '针对未回复的用户进行再次营销，能显著提升打开率及回复率'
              : '针对未打开或未回复的用户进行再次营销，能显著提升打开率及回复率'}
            <span onClick={openDrawer} className={detailStyle.marketingAgain}>
              再次营销
            </span>
          </span>
        }
        type="info"
        action={<CloseIcon onClick={closeAlert} className={detailStyle.marketingClose} />}
      />
    );
  };

  const TabComp = () => {
    return <ul className={`${detailStyle.tabList} ${needShowOperation ? style.templateTabList : ''}`}>{TabListComp()}</ul>;
  };

  const TabListComp = () => {
    return tabConfig.map(config => {
      if (config.hide) {
        return null;
      }
      let num = info[config.valueKey];
      if (num === undefined) {
        num = '0';
      }
      return (
        <li
          className={`${detailStyle.tabItem} ${curTab === config.configEnum ? 'active' : ''}`}
          key={config.tabIndex}
          style={config.tabIndex === 0 ? { borderLeft: '1px solid #EAEAEB' } : {}}
          onClick={() => handleTabClick(config.configEnum!)}
        >
          <div className={detailStyle.tabItemHeader}>
            {/* <i className={`${detailStyle.tabItemIcon} ${detailStyle['statisticsIcon' + config.tabIndex]}`} /> */}
            <div className={detailStyle.tabItemTitle}>{config.title}</div>
          </div>
          <div className={detailStyle.tabItemNum}>{info?.emailStatus === 0 && config.configEnum !== DetailTabOption.Marketing ? '--' : num}</div>
          {/* {config.subTitle && (
            <div className={detailStyle.edmDetailSubTitle}>
              {config.subTitle}
              {info[config.subValueKey]}
            </div>
          )} */}
        </li>
      );
    });
  };

  const AutoMarketingTemplateComp = () => {
    if (!originListData) {
      return null;
    }
    if (!isCircle && currentAccId === info?.accId) {
      return <AutoMarketTemplateEntry sendBoxInfo={originListData} onSuccess={() => fetchData()} />;
    }
    return null;
  };

  const DetailListComp = () => {
    if (curTab === DetailTabOption.Prod) {
      return <ProductDataDatail productClickData={productClickData} rowSelection={rowSelection} showRowSelection={showRowSelection} ref={productDataDatailRef} />;
    }

    return (
      <>
        <div className={detailStyle.actionPart}>
          <div className={detailStyle.leftPart}>
            {FilterLevel2Comp()}
            {FilterLevel3Comp()}
          </div>
          {ActionRightComp()}
        </div>
        <div
          className={classnames([
            style.detailTableWrapper,
            { [style.detailTableWrapper2]: fromTemplateList },
            { [style.hasDetailTableFooter]: canShowRowSelection },
            { [detailStyle.hasToggleTab]: tabText !== undefined },
          ])}
          // ref={tableScrollParentRef}
        >
          <SiriusTable
            key={'' + curTab + reverse}
            rowClassName={detailStyle.rowWrapper}
            columns={tableColumns}
            dataSource={listData}
            pagination={{
              showTotal: () => `共${listData.length}条数据`,
              hideOnSinglePage: true,
              showQuickJumper: true,
              showSizeChanger: true,
              locale: { jump_to: '前往' },
            }}
            sortDirections={['descend', 'ascend']}
            scroll={{ x: 'max-content', y: Infinity }}
            rowKey={curTab !== DetailTabOption.Link ? 'contactEmail' : 'id'}
            rowSelection={needShowOperation && canShowRowSelection ? rowSelection : undefined}
            onChange={(pagination, filters, sorter, extra) => {
              setDetailListPageSize(pagination.pageSize);
              updateIdentityListData(extra.currentDataSource.slice(pagination.pageSize * (pagination.current - 1), pagination.pageSize * pagination.current));
            }}
          />
        </div>
      </>
    );
  };

  // 客户、线索相关弹窗或抽屉关闭
  const handleCustomerClueClose = (refresh?: boolean) => {
    // 是否刷新列表
    if (refresh) {
      getCurrentIdentity();
    }
    setCustomerClueType('');
  };

  return (
    <PermissionCheckPage resourceLabel="EDM" accessLabel="VIEW" menu="EDM_SENDBOX">
      <div className={style.container} style={{ paddingRight: '0px', paddingBottom: 20, paddingTop: 20 }}>
        {renderBreadCrumb()}
        <Skeleton loading={loading} active>
          <div
            className={`${style.detailContainer} ${needShowOperation ? style.detailListContainer : style.detailCommonContainer}`}
            // onScroll={onscroll}
            style={{ paddingRight: '24px' }}
          >
            {renderTopInfo(info)}
            {SectionGapComp()}
            {renderBasicInfo(info)}
            {AutoMarketingTemplateComp()}
            {SectionGapComp()}
            {/* 任务统计模块变为营销列表模块的改造 */}
            <div className={detailStyle.mailDetail}>
              {DetailHeaderComp()}
              {SelectedThemeComp()}
              <div className={`${style.tab} ${fromTemplateList ? style.tab2 : ''}`}>
                {showRemarketingAlert ? RemarketingComp() : <></>}
                {TabComp()}
                {DetailListComp()}
              </div>
            </div>
            {/* 主题效果对比 */}
            {renderSubjects()}
            <DetailUserInfo data={analysisData?.contactInfoAnalysisList || []} />
          </div>
        </Skeleton>
        {HistoryActionComp()}
        {ViewEdmContentComp()}
        {AddBlackListSecondryConfigmComp()}
        {LinkTrackComp()}
        {MailReplyListComp()}
        {ArriveListComp()}
        {ClickModalComp()}
        {RemarketingDrawerComp()}
        {CustomerClueComp()}
      </div>
    </PermissionCheckPage>
  );
});

export default EdmDetail;
