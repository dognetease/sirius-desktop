/* eslint-disable max-statements */
import React, { useRef, useState, useEffect, useReducer, useMemo, useContext, useCallback, lazy, Suspense } from 'react';
import { renderToString } from 'react-dom/server';
import { Checkbox, Skeleton, Spin, Tooltip, Select, Popover, Space, Alert as AlertTip, Modal, message } from 'antd';
import { useNoviceTask } from '@/components/Layout/TaskCenter/hooks/useNoviceTask';
import { uniq, debounce, isNumber } from 'lodash';
import classnames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import { parse } from 'query-string';
// import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import Breadcrumb from '@lingxi-common-component/sirius-ui/Breadcrumb';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import Divider from '@web-common/components/UI/Divider';
// import Divider from '@lingxi-common-component/sirius-ui/Divider';
// 诊断组件
// import { ValidatorWrapper } from './validator/ValidatorWrapper';
import { ValidatorEntry } from './validator/ValidatorEntry';
import { ValidatorContext, useValidatorProvider, ValidatorResult } from './validator/validator-context';
import { useActions, useAppSelector, AiWriteMailReducer } from '@web-common/state/createStore';
import { AihostingGuideModal } from '../AIHosting/components/aiHostingGuideModal';

import {
  apiHolder,
  apis,
  EdmSendBoxApi,
  EdmSendConcatInfo,
  RequestSendDraft,
  SendSettingInfo,
  ResponseSendDraft,
  EdmContentInfo,
  MailSignatureApi,
  MailApi,
  DataStoreApi,
  CustomerApi,
  FieldSettingApi,
  EmailScoreStage,
  EdmEmailType,
  GlobalSearchApi,
  StepValueModel,
  StepsInfoModel,
  ReceiversSendTypeModel,
  ReceriverGroupModel,
  StepsModel,
  IWriteMailData,
  ISettingHandle,
  PrevScene,
  OneClickMarketingPrevScene,
  ResponseFilterCount,
  QuotaReqModel,
  GPTReport,
  BaseSendInfo,
  SecondSendInfo,
  SecondSendStrategy,
  AIResults,
  SourceNameType,
  ResponseEdmDraftInfo,
  RequestSaveDraft,
  ISettingData,
  isFFMS,
  TaskChannel,
  MailTemplateApi,
  environment,
  ErrorReportApi,
  BreadcrumbMap,
} from 'api';

import dayjs from 'dayjs';
import { EdmPageProps } from '../pageProps';
import style from './write.module.scss';
import { SendSetting } from './setting';
import { ContentEditor, ContentEditorProps, prepareAttachmentsForSend } from './contentEditor';
import { ReceiverSettingNew } from './ReceiverSettingDrawer/receiver';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import { TrySendModal } from './trySendModal';
import { CronSendModal, SendMode } from './cronSend';
import EmailScore from './emailScore';
import { navigate } from '@reach/router';
import { PreviewContent } from '../components/preview/privew';
import { edmWriteContext, EmptyContactType, IEdmWriteState, writeContextReducer } from './edmWriteContext';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import WaimaoCustomerService from '@web-common/components/UI/WaimaoCustomerService';
import WarnIcon from '@web-common/components/UI/Icons/svgs/WarnSvg';
import { ReactComponent as ReplyHeaderHolder } from '@/images/icons/edm/replyheader.svg';
import { DraftEditAdd, DraftSaveType, edmDataTracker, EDMPvType } from '../tracker/tracker';
import { encodeHTML, onHttpError, StepsMap, createBeforeReadyListener, UnsubscribeTextLan, guardString, getCurTimeStamp, VersionSceneList } from '../utils';
import Alert from '@web-common/components/UI/Alert/Alert';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import EmailScoreLoading from '@/images/icons/edm/email-score-loading.png';
import syncSendEmailTip1 from '@/images/icons/edm/syncSendEmailTip1.png';
import syncSendEmailTip2 from '@/images/icons/edm/syncSendEmailTip2.png';
import { ReactComponent as ExplanationIcon } from '@/images/icons/edm/yingxiao/explanation-gray16px.svg';
import EmailScoreFinished from '@/images/icons/edm/email-score-finished.png';
import emailScoreConverter from './emailScoreConverter';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import useLocalStorage from '@/hooks/useLocalStorage';
import { PopoverTip } from '../components/popoverTip';
import { PopoverSimpleTip } from '../components/popoverTip/simple';
import { userGuideReducer, UserGuideContext } from '../components/UserGuide/context';
import { PersonalTemplateAddModal } from './../mailTemplate/template/personalTemplate/personalTemplate';
import EditProgress from '../components/EditProgress/editProgress';
import { ReactComponent as TrySendIcon } from '@/images/icons/edm/yingxiao/try_send.svg';
import { ReactComponent as TimingSendIcon } from '@/images/icons/edm/yingxiao/timing_send.svg';
import { ReactComponent as MailUnsubscribeIcon } from '@/images/icons/edm/yingxiao/mail_unsubscribe.svg';
import { ReactComponent as MailScoreIcon } from '@/images/icons/edm/yingxiao/mail_score.svg';
import { ReactComponent as MailPreviewIcon } from '@/images/icons/edm/yingxiao/mail_preview.svg';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import { safeDecodeURIComponent } from '@web-common/utils/utils';
import useState2SalesPitchReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import { NoWorriedTips } from './NoWorriedTips';

export const env = typeof environment === 'string' ? environment : 'local';
export const isDev = !['prod', 'prev'].includes(env);

import { getIn18Text } from 'api';
import { LoadingIcon } from './write+';
import { ContentRoot, ContentRootInterface, ContentType } from './contentRoot';
import { IEdmEmailList } from '@/components/Layout/Customer/components/hooks/useEdmSendCount';

const inFFMS = isFFMS();
const systemApi = apiHolder.api.getSystemApi();
const storeApi: DataStoreApi = apiHolder.api.getDataStoreApi();
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const mailSigApi = apiHolder.api.requireLogicalApi(apis.mailSignatureImplApi) as unknown as MailSignatureApi;
const mailApi: MailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const fieldSettingApi = apiHolder.api.requireLogicalApi(apis.fieldSettingApiImpl) as FieldSettingApi;
const globalSearchApi = apiHolder.api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
const eventApi = apiHolder.api.getEventApi();
const templateApi = apiHolder.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';
const sentryReportApi = apiHolder.api.requireLogicalApi(apis.errorReportImpl) as ErrorReportApi;

let isFirstShow = true;
const { Option } = Select;
const SYNC_SCHEDULE_KEY = 'edm-sync-schedule';

const TrackSourceMap = {
  newCreate: 'new',
  copyTask: 'copy',
  draft: 'draft',
};

const taskNoviceParams = {
  moduleType: 'EDM',
  taskType: 'SEND_EDM_EMAIL',
};

let defaultStepValues: StepValueModel[] = [];
let defaultSteps: StepsModel[] = [];
for (const key in StepsMap) {
  defaultStepValues.push(key as StepValueModel);
  defaultSteps.push(StepsMap[key as StepValueModel]);
}

interface EdmWriteReceiverInfo {
  receiversSendType: ReceiversSendTypeModel;
  receriverGroup: ReceriverGroupModel;
}

const defaultMarketingSteps: StepsInfoModel = {
  steps: defaultStepValues,
  currentStep: 'SendSetting',
  receiverInfo: {
    receiversSendType: 'filter',
    receriverGroup: '1',
  },
};

const needRecord = () => {
  const [_, hash] = window.location.hash.split('#');
  const search = parse(hash);
  return ['globalSearch', 'customsData'].includes(Array.isArray(search.sourcePage) ? search.sourcePage[0] : search.sourcePage || '');
};

const defaultInitData: IWriteMailData = {
  currentStage: 0,
  sendStrategyOn: true,
  replyEdmEmailId: null,
  sendSettingInfo: {},
  contentEditInfo: {},
  receiverInfo: {},
  secondSendInfo: { saveInfos: [] },
};

export const EdmWriteMail = (props: EdmPageProps & { back?: () => any; handleSuccess?: (data: Record<string, any>, pageType: string) => void }) => {
  const { changeAiHostingInitObj } = useActions(AiWriteMailReducer);
  const aiHostingInitObj = useAppSelector(state => state.aiWriteMailReducer.aiHostingInitObj);
  const menuVersion = useVersionCheck();
  const isV2 = menuVersion === 'v2';
  const prevScene = (new URLSearchParams(location.href).get('from') as PrevScene) || 'newCreate';
  if (isDev && (!prevScene || prevScene === 'default')) {
    throw new Error('请明确业务来源(from)字段, 不接受 default 来源');
  }

  const channel = (new URLSearchParams(location.href).get('channel') as TaskChannel) || TaskChannel.normal;

  const { qs, handleSuccess } = props;
  const isCronEditWithTwoTab = useMemo(() => qs.type === 'cronEdit' && !qs.isMultiple, [qs.type, qs.isMultiple]);

  const isCronEditWithOneTab = useMemo(() => qs.type === 'cronEdit' && !!qs.isMultiple, [qs.type, qs.isMultiple]);

  const isNotCornEdit = useMemo(() => qs.type !== 'cronEdit', [qs.type]);
  // const steps = ['发件设置', '内容编辑', '收件人'];
  const [steps, setSteps] = useState<StepsModel[]>(cloneDeep(defaultSteps));
  const [stepsInfo, setStepsInfo] = useState<StepsInfoModel>(defaultMarketingSteps);
  const settingRef = useRef<ISettingHandle>();
  const contentRef = useRef<any>();
  const contentRootRef = useRef<ContentRootInterface>();
  const receiverRef = useRef<any>();
  const [showTrySendModal, setShowTrySendModal] = useState(false);
  const [personalTemplateAddModalOpen, setPersonalTemplateAddModalOpen] = useState<boolean>(false);
  const [showCronSendModal, setShowCronSendModal] = useState(false);
  const [syncSchedule, setSyncSchedule] = useState<boolean>(() => !!localStorage.getItem(SYNC_SCHEDULE_KEY));
  const [successTip, setSuccessTip] = useState<ResponseSendDraft | null>(null);
  const [loading, setLoading] = useState(false);
  // 实际发送人数限制 ===过滤数
  const [filterCapacity, setFilterCapacity] = useState<ResponseFilterCount>();
  // const [showEdmDirTip] = useState(dataStoreApi.getSync(STORE_KEY)?.data !== '1');

  const [editorReady, setEditorReady] = useState(false);

  const [aiWriteResult, setAiWriteResult] = useState<GPTReport>();
  const [aiRetouchResult, setAiRetouchResult] = useState<GPTReport>();
  const [useContentAssistant, setUseContentAssistant] = useState<string>('');

  // 当前设置表单数据
  const [curBaseSendInfo, setBaseSendInfo] = useState<BaseSendInfo | {}>({});
  // 是否展示二次营销推荐
  const [needSystemRecommend, setNeedSystemRecommend] = useState(false);

  const [smartMarketingSite, setSmartMarketingSite] = useState<StepValueModel>('BatchSetting');

  const [param, setParam] = useState<Partial<RequestSendDraft>>();

  const [writeContentType, setWriteContentType] = useState<ContentType>('template');

  // Ai可用剩余次数
  const [aiTimes, setAiTimes] = useState<number>(0);

  // 任务诊断相关
  const validatorProvider = useValidatorProvider();

  const ultimateVersion = useAppSelector(state => state.privilegeReducer.ultimateVersion);

  const [refreshKey, setRefreshKey] = useState(false);
  const refresh = () => {
    setRefreshKey(!refreshKey);
  };

  useEffect(() => {
    if (qs.from !== 'copyTask' || !qs.copyTransId) {
      return;
    }
    const hasExist = sentryReportApi.getTransById(Number(qs.copyTransId));
    if (hasExist) {
      sentryReportApi.endTransaction({
        id: Number(qs.copyTransId),
        data: {
          count: Number(qs.copyTransCount) || -1,
        },
      });
    }
  }, [qs.from, qs.copyTransId]);

  const [state, dispatch] = useReducer(writeContextReducer, {
    currentStage: 0,
    canSend: false,
    isReady: false,
    editorCreated: false,
    draftId: undefined,
    edmEmailId: undefined,
    emptyContactType: dataStoreApi.getSync('EmptyContactSetting').data || EmptyContactType.Email,
    templateParamsFromEditor: [] as unknown,
    /**
     * 邮件内容
     */
    mailContent: '',
  } as IEdmWriteState);

  useEffect(() => {
    validatorProvider.dispatch({
      type: 'sensitive:failedActionState',
      payload: () =>
        dispatch({
          type: 'setState',
          payload: {
            currentStage: StepsMap.ContentEditor.id,
          },
        }),
    });
  }, [dispatch]);

  const [data, setData] = useState<IWriteMailData>(cloneDeep(defaultInitData));

  const [canShowHistoryModal, setCanShow] = useState(!state.draftId);
  const [previewContent, setPreviewContent] = useState(['', '']);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [sendType, setSendType] = useState<number>(1); // 1 立即发送 2 定时发送
  const [exceedLimitTip, setExceedLimitTip] = useState(false);
  const [emailReceipt, setEmailReceipt] = useLocalStorage('email_receipt', true, {
    raw: false,
    serializer: (value: boolean) => Number(value).toString(),
    deserializer: (value: string) => Boolean(Number(value)),
  }); // 0 false, 1 true
  // 0415-邮件营销支持邮箱别名发送需求 去掉内容编辑步骤的发件人选择
  // const [sender, setSender] = useState<string>(''); // 发送邮件选择

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(800);
  const [hasVariable, setHasVariable] = useState<boolean>(false);

  const [curSenderEmail, setCurSenderEmail] = useState<string>('');

  const [firstSenderEmail, setFirstSenderEmail] = useState<boolean>(true);

  const initDataRef = useRef<IWriteMailData>(cloneDeep(defaultInitData));

  const renderStartTimeRef = useRef(0);

  const [cronSendParams, setCronSendParams] = useState<Partial<Record<string, unknown>>>({});
  const [showAiHostingGuide, setShowAihostingGuide] = useState(false);

  const addContactPlanRef = useRef<{
    isAddContactPlan: boolean;
    taskId: string;
    planId: string;
    planName: string;
  }>();

  // 新手任务
  const { quit, start, commit, handling, getPopoverByStep } = useNoviceTask(taskNoviceParams);
  // 新手任务提示气泡
  const Popover3 = useMemo(() => getPopoverByStep(3), [getPopoverByStep]);
  const StartPopover = useMemo(() => {
    if (state.currentStage === 0) {
      return getPopoverByStep(1);
    } else if (state.currentStage === 1) {
      return getPopoverByStep(2);
    } else {
      return (props: any) => <>{props.children}</>;
    }
  }, [state.currentStage, getPopoverByStep]);

  // 开始新手任务
  useEffect(() => {
    handling && start();
  }, [handling]);
  // 结束新手任务
  useEffect(() => {
    return quit;
  }, []);

  useEffect(() => {
    if (state.currentStage === StepsMap.ContentEditor.id && editorReady) {
      // 每次切换的时候修改一下摘要
      const editorBody = contentRef.current?.getEditor()?.getBody();
      const formSetting = settingRef.current?.getValues() || {};
      if (editorBody) {
        insertPreHeaderAndSummaryIfNeeded(editorBody, formSetting?.emailSummary);
        // 主动进行敏感词校验
        contentRef.current?.sensitiveCheck();
      }
    }
  }, [editorReady, state.currentStage]);

  const validBasicInfo = async () => {
    const { sendSettingInfo, contentEditInfo } = await getSendCommonParams();
    setBaseSendInfo({
      sendSettingInfo,
      contentEditInfo,
    });

    try {
      let data = await settingRef.current?.validateFields();
      if (data) {
        setNeedSystemRecommend(true);
      }
    } catch (e) {
      console.log('invalid sender');
    }
  };

  useEffect(() => {
    // 每次切换到第三个tab需要填写默认策略 // todo 如果该步骤在第一个则不展示
    if (state.currentStage === StepsMap.BatchSetting.id && contentRef.current && settingRef.current && receiverRef.current) {
      validBasicInfo();
    }

    setShouldShow(canShowToday());
    if (state.currentStage === StepsMap['BatchSetting'].id) {
      // 发件人，判断是否插入了变量，如果插入变量，定位到文件导入tab
      const editor = contentRef.current?.getEditor();
      let html = '';
      if (editor) {
        html = editor.__getPreviewHtml__ ? editor.__getPreviewHtml__(editor) : editor.getContent();
      }
      const formSetting = settingRef.current?.getValues() || {};
      const title = formSetting?.emailSubjects?.[0]?.subject;
      setHasVariable(`${title}${html}`.indexOf('#{') !== -1);
    }

    if (state.currentStage === StepsMap.BatchSetting.id && contentRef?.current) {
      const mailContent = contentRef?.current?.getContentWithAttachment() || '';
      // 进行内容保存
      dispatch({
        type: 'setState',
        payload: {
          mailContent,
        },
      });
    }
  }, [state.currentStage]);

  useEffect(() => {
    if (ResizeObserver && containerRef.current && state.currentStage >= 2) {
      const resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
          const { height } = entry.contentRect;
          setContainerHeight(height);
        });
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }

    return () => {};
  }, [ResizeObserver, containerRef.current, state.currentStage]);

  const [clueBatch, setClueBatch] = useState<string>('0');
  const [clueBatchOptions, setClueBatchOptions] = useState<{ label: string; value: string }[]>([]);

  // 是否是引用内容+信头的模式
  const isCopyHeader = useMemo(() => qs.cphd === '1' || Boolean(data.replyEdmEmailId), [qs.cphd, data]);

  const getFilterCount = useCallback(() => {
    edmApi.getFilterCount().then(data => {
      setFilterCapacity(data);
    });
  }, []);

  const getClueBatchOptions = useCallback(() => {
    customerApi.getBaseInfo().then(data => {
      setClueBatchOptions(data.clue_batch.filter(item => item.value !== '0'));
    });
  }, []);

  const getAiTimes = async () => {
    const { dayLeft } = await edmApi.getGPTQuota();
    setAiTimes(isNumber(dayLeft) && dayLeft > 0 ? dayLeft : 0);
  };

  useEffect(() => {
    getClueBatchOptions();
    // 获取当前filtercapcity
    getFilterCount();
    // 获取AI剩余次数
    getAiTimes();
    // 进入后 重新渲染
    // edmApi.refreshUnsubscribeUrl();
    // 监听其他位置的ai次数变化
    const eventId = eventApi.registerSysEventObserver('aiTimesUpdate', {
      func: () => {
        getAiTimes();
      },
    });
    // 获得当前时间戳
    renderStartTimeRef.current = getCurTimeStamp();
    return () => {
      eventApi.unregisterSysEventObserver('aiTimesUpdate', eventId);
    };
  }, []);

  useEffect(() => {
    const search = new URLSearchParams(location.href);
    // 埋点
    if (['newCreate', 'copyTask', 'draft'].includes(prevScene)) {
      edmDataTracker.trackMarktingEdmTaskCreate(TrackSourceMap[prevScene as 'newCreate' | 'copyTask' | 'draft']);
    }
    if (['globalSearch', 'addressBook', 'customer'].includes(prevScene)) {
      edmDataTracker.trackMarktingEdmFilterSource(prevScene);
    }

    const receiverInfo: EdmWriteReceiverInfo = {
      receiversSendType: (search.get('sendType') || 'filter') as ReceiversSendTypeModel,
      receriverGroup: (search.get('receriverGroup') || '1') as ReceriverGroupModel,
    };

    if (props.qs?.currentStepBatchSetting) {
      configStepsInfo(receiverInfo);
      return;
    }

    // 诊断与建议跳过来的
    if (prevScene === 'taskzhenduan') {
      let back = search.get('back');
      if (back != null) {
        back = decodeURIComponent(back);
        if (back.includes('zhenduan=send')) {
          setStepsInfo({
            steps: ['SendSetting', 'ContentEditor', 'BatchSetting'],
            currentStep: 'ContentEditor',
            receiverInfo,
          });
        } else {
          setStepsInfo({
            steps: ['BatchSetting', 'ContentEditor', 'SendSetting'],
            currentStep: 'BatchSetting',
            receiverInfo,
          });
        }
        return;
      }
    }

    // unTemplate 表示：uni 产品表唤起营销邮件 === 模板和产品中心
    if (prevScene === 'template' || prevScene === 'uniTemplate' || props.qs?.emailSubject) {
      setStepsInfo({
        steps: ['ContentEditor', 'SendSetting', 'BatchSetting'],
        currentStep: 'ContentEditor',
        receiverInfo,
      });
      return;
    }
    if (['copyTask', 'newCreate', 'draft'].includes(prevScene)) {
      return;
    }
    // 一键营销等
    configStepsInfo(receiverInfo);
  }, []);

  const configStepsInfo = (receiverInfo: EdmWriteReceiverInfo) => {
    setStepsInfo({
      steps: ['BatchSetting', 'ContentEditor', 'SendSetting'],
      currentStep: 'BatchSetting',
      receiverInfo: receiverInfo,
    });
    setSmartMarketingSite('SendSetting');
  };

  useEffect(() => {
    const stepsStrs = stepsInfo.steps;
    const stepsList = stepsStrs.map((step, i) => {
      const tempStep = StepsMap[step] as StepsModel;
      tempStep.checked =
        steps.filter(item => {
          return item.id === tempStep.id;
        })[0].checked || false;
      return tempStep;
    });
    setSteps(cloneDeep(stepsList));

    let firstStep = stepsInfo.steps[0];
    if (firstStep === 'BatchSetting') {
      edmDataTracker.track('pc_markting_edm_singleTask', {
        type: 'taskFirst',
      });
    }
    if (firstStep === 'ContentEditor') {
      edmDataTracker.track('pc_markting_edm_singleTask', {
        type: 'contentFirst',
      });
    }
    if (firstStep === 'SendSetting') {
      edmDataTracker.track('pc_markting_edm_singleTask', {
        type: 'sendFirst',
      });
    }
  }, [stepsInfo]);

  useEffect(() => {
    setIdByTab(0);
  }, [steps]);

  const getRefbySmartMarketingSite = smartMarketingSite === 'SendSetting' ? settingRef.current : receiverRef.current;

  const getContactStatus = async (props: any) => {
    const { receiverList, draftId, needContactStatus } = props;
    let result = receiverList.map((item: { email: string; name?: string; sourceName?: SourceNameType; verifyStatus?: number }) => {
      return {
        contactName: item.name,
        contactEmail: item.email,
        sourceName: item.sourceName,
        verifyStatus: item.verifyStatus,
      };
    });
    if (needContactStatus) {
      const res = await edmApi.getContactsStatusV2({
        contacts: receiverList || [],
        draftId,
      });
      result = res.contactInfoList.sort((a: any, b: any) => {
        return a.contactStatus !== undefined && b.contactStatus !== undefined ? b.contactStatus - a.contactStatus : 1;
      });
    }
    return result;
  };

  // 校验内容，没有内容的要填写内容
  const checkoutSecondContent = async (info: SecondSendInfo | undefined, senderEmail?: string): Promise<SecondSendInfo | undefined> => {
    if (!info || !info.saveInfos) {
      return {
        saveInfos: [],
      };
    }
    const unresolved = info.saveInfos.reduce((pre, cur, index) => {
      if (cur.contentEditInfo.emailContentId) {
        pre.push({
          id: cur.contentEditInfo.emailContentId || '',
          index,
        });
      }
      return pre;
    }, [] as Array<{ id: string; index: number }>);
    const promises = unresolved.map(item =>
      edmApi.getEmailContent(
        props.qs.edmEmailId
          ? {
              emailContentId: item.id,
              draftId: props.qs.id,
              edmEmailId: props.qs.edmEmailId,
            }
          : {
              emailContentId: item.id,
              draftId: props.qs.id,
            }
      )
    );
    const result = await Promise.all(promises); // 返回结果和unresolved index对应
    result.forEach((item, index) => {
      info.saveInfos[unresolved[index].index].contentEditInfo.emailContent = item.emailContent;
      // todo 是否需要复用id
      info.saveInfos[unresolved[index].index].contentEditInfo.emailContentId = '';
    });

    let isSelf = true;
    try {
      const initEmail = info.saveInfos[0].sendSettingInfo.senderEmail;
      const res = await edmApi.getSendBoxSenderList();
      const senderEmail = res.senderList.find(sender => sender.email === initEmail);
      isSelf = senderEmail != null;
    } catch (err) {}
    // 需要把所有的二次营销发件人替换成当前账号的主账号
    let newInfo: SecondSendInfo = info;
    if (!isSelf) {
      newInfo = {
        saveInfos: info.saveInfos.map(info => {
          info.sendSettingInfo.senderEmail = systemApi.getCurrentUser()?.id;
          return info;
        }),
      };
    }

    return newInfo;
  };

  // TODO: 这个逻辑得捋捋 @hanxu
  useEffect(() => {
    clearSuccessTipIfNeeded();

    const beforeReady = createBeforeReadyListener();
    if (props.qs.id) {
      dispatch({
        type: 'setState',
        payload: { draftId: props.qs.id },
      });
      beforeReady.add(fetchSendCount());
      // edit
      const getDraftPromimse = edmApi
        .getDraftInfo(props.qs.id)
        .then(data => {
          trackPv('stage' + (data.currentStage + 1).toString());
          handleDraftInitData(data);
          return checkoutSecondContent(data.secondSendInfo, initDataRef.current.sendSettingInfo.senderEmail).then(res => {
            if (res) {
              initDataRef.current.secondSendInfo = res;
            }
            dispatch({
              type: 'setState',
              payload: {
                sendCapacity: {
                  totalSendCount: data.totalSendCount,
                  todaySendCount: data.todaySendCount,
                  availableSendCount: data.availableSendCount,
                  singleSendCount: data.singleSendCount,
                },
              },
            });
            setExceedLimitTip(data.availableSendCount <= 0 && isFirstShow);
            setEmailReceipt(!!data.contentEditInfo.emailReceipt);
            if (data.contentEditInfo.emailAttachment) {
              try {
                const json = JSON.parse(data.contentEditInfo.emailAttachment);
                initDataRef.current.contentEditInfo.attachmentList = json.map((a: any) => {
                  return {
                    type: a.type,
                    fileName: a.fileName || a.name,
                    fileSize: a.fileSize || a.size,
                    downloadUrl: a.downloadUrl || a.url,
                    expireTime: a.expireTime,
                    identity: a.identity,
                  };
                });
              } catch (e) {
                //
              }
            }
            setData({ ...initDataRef.current });
            dispatch({ type: 'setState', payload: { currentStage: data.currentStage } });

            const { markInfo } = data;
            if (markInfo) {
              setScoreEmail(markInfo.email);
              setEmailScoreId(markInfo.id);
              setEmailScoreStage(markInfo.stage || 'PRE');
              setEmailScoreLimit(markInfo.limit || 0);

              if (markInfo.stage === 'END') {
                handleEmailScoreDetailFetch(markInfo.id as string);
              }
            }

            setPush(data.push);
            setSyncContact(data.syncContact);
            setClueBatch(String(data.clueBatch));
          });
        })
        .finally(() => {
          setReady();
        });
      beforeReady.add(getDraftPromimse);
    } else if (props.qs.edmEmailId) {
      dispatch({
        type: 'setState',
        payload: { edmEmailId: props.qs.edmEmailId },
      });
      beforeReady.add(fetchSendCount());
      const copyPromise = edmApi
        .copyFromSendBox({ edmEmailId: props.qs.edmEmailId })
        .then(data => {
          initDataRef.current.sendSettingInfo = data.sendSettingInfo;
          initDataRef.current.sendSettingInfo.cronSendType = data.cronSendType;
          initDataRef.current.sendDomainLimit = data.sendDomainLimit;
          initDataRef.current.sendStrategyOn = data.sendStrategyOn;
          initDataRef.current.cronSendType = data.cronSendType;
          if (data.sendTime) {
            Object.assign(initDataRef.current.sendSettingInfo, {
              sendTime: data.sendTime,
              sendTimeZone: data.sendTimeZone,
              sendTimeCountry: data.sendTimeCountry,
            });
          }
          initDataRef.current.contentEditInfo.emailContent = data.contentEditInfo?.emailContent;
          setCanShow(!data.contentEditInfo?.emailContent);
          initDataRef.current.receiverInfo.contactInfoList = data.receiverInfo.contactInfoList.sort((a: any, b: any) => {
            return a.contactStatus !== undefined && b.contactStatus !== undefined ? b.contactStatus - a.contactStatus : 1;
          });
          dispatch({
            type: 'setState',
            payload: {
              sendCapacity: {
                totalSendCount: data.totalSendCount,
                todaySendCount: data.todaySendCount,
                availableSendCount: data.availableSendCount,
                singleSendCount: data.singleSendCount,
              },
            },
          });
          setExceedLimitTip(data.availableSendCount <= 0 && isFirstShow);
          setEmailReceipt(!!data.contentEditInfo.emailReceipt);
          if (data.contentEditInfo.emailAttachment) {
            try {
              const json = JSON.parse(data.contentEditInfo.emailAttachment);
              initDataRef.current.contentEditInfo.attachmentList = json.map(a => {
                return {
                  type: a.type,
                  fileName: a.fileName || a.name,
                  fileSize: a.fileSize || a.size,
                  downloadUrl: a.downloadUrl || a.url,
                  expireTime: a.expireTime,
                  identity: a.identity,
                };
              });
            } catch (e) {
              //
            }
          }
          setData({ ...initDataRef.current });
          const { edmMarkInfo: markInfo } = data;

          if (markInfo) {
            setScoreEmail(markInfo.email);
            setEmailScoreId(markInfo.id);
            setEmailScoreStage(markInfo.stage || 'PRE');
            setEmailScoreLimit(markInfo.limit || 0);

            if (markInfo.stage === 'END') {
              handleEmailScoreDetailFetch(markInfo.id as string);
            }
          }

          setPush(data.push);
        })
        .catch(error => onHttpError(error))
        .finally(() => {
          setReady();
        });
      beforeReady.add(copyPromise);
    } else {
      beforeReady.add(fetchSendCount());
      beforeReady.add(getReceiversFromStorage());
      beforeReady.add(getReceiversFromQuery());
    }
    beforeReady.add(fetchDefaultSign());
    // fetchDefaultSign();

    setTimeout(() => {
      trackPv('stage' + (state.currentStage + 1).toString());
      fetchVariableList();
    }, 0);

    beforeReady
      .start()
      .then(() => {
        setReady();
      })
      .finally(() => {
        setReady();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.qs.id, props.qs.edmEmailId, props.qs.key, props.qs._t]);

  const clearSuccessTipIfNeeded = () => {
    if (successTip) {
      setSuccessTip(null);
    }
  };

  const fetchDefaultSign = async () => {
    return mailSigApi
      .doGetDefaultSign(true)
      .then(sig => {
        if (sig && sig.enable && sig.content) {
          // debugger
          let contentCombine = '';
          let unsubscribeText = ``;
          const text = contentRef.current?.getText();
          if (!text) {
            const enText = edmApi.handleUnsubscribeText(UnsubscribeTextLan.en);
            const alignMap = {
              JustifyLeft: 'left',
              JustifyCenter: 'center',
              JustifyRight: 'right',
              JustifyFull: 'justify',
            };
            let defaultFontFamily = dataStoreApi.getSync('defaultFontFamily').data;
            defaultFontFamily = defaultFontFamily || 'Source Han Sans';
            const defaultFontFamilyStyle = `font-family:${defaultFontFamily};`;
            let defaultFontSize = dataStoreApi.getSync('defaultFontSize').data || '14px';
            if (!/px$/.test(defaultFontSize)) {
              // 28修改后，defaultFontSize是数字
              defaultFontSize += 'px';
            }
            const defaultFontSizeStyle = `font-size:${defaultFontSize};`;
            const defaultFontColor = dataStoreApi.getSync('defaultColor').data;
            const defaultAlign = dataStoreApi.getSync('defaultAlign').data as keyof typeof alignMap | undefined;
            const defaultFontColorStyle = defaultFontColor ? `color:${defaultFontColor};` : '';
            const defaultAlignStyle = defaultAlign ? `text-align:${alignMap[defaultAlign]};` : '';
            let defaultLineHeight = dataStoreApi.getSync('defaultLineHeight').data;
            defaultLineHeight = defaultLineHeight || '1.5';
            const defaultLineHeightStyle = `line-height:${defaultLineHeight};`;
            const defaultStyle = `${defaultFontFamilyStyle}${defaultFontSizeStyle}${defaultLineHeightStyle}${defaultFontColorStyle}${defaultAlignStyle}`;
            unsubscribeText = `<div style='${defaultStyle}' data-mce-style='${defaultStyle}'><br/></div><div style='${defaultStyle}' data-mce-style='${defaultStyle}'><br/></div><div style='${defaultStyle}' data-mce-style='${defaultStyle}'><br/></div><div style='${defaultStyle}' data-mce-style='${defaultStyle}'><br/></div><div style='${defaultStyle}' data-mce-style='${defaultStyle}'><br/></div>${enText}`;
          }
          // 邮件本身有内容开头处加空行
          contentCombine = `${unsubscribeText}<div><br/></div><div><br/></div>${sig.content}`;
          initDataRef.current.contentEditInfo.signature = mailApi.doTransferSign(contentCombine);
        }
        setData({ ...initDataRef.current });
      })
      .catch(e => {
        console.log(e);
      });
  };

  const fetchVariableList = async () => {
    try {
      const data = await fieldSettingApi.getVariableList();
      dispatch({
        type: 'setState',
        payload: { variableList: data },
      });
    } catch (e) {}
  };

  const fetchSendCount = () => {
    return edmApi.getSendCount().then(data => {
      setExceedLimitTip(data.availableSendCount <= 0 && isFirstShow);
      dispatch({
        type: 'setState',
        payload: {
          sendCapacity: data,
        },
      });
    });
  };

  const savePersonalTemplate = (templateName: string, selectedTagIds: number[]) => {
    const editorContent = contentRef.current?.getEditor()?.getContent();
    let params = {
      templateId: '',
      templateName,
      templateCategory: 'LX-WAIMAO',
      content: editorContent || '',
      tagIdList: selectedTagIds,
    };
    templateApi.doSaveMailTemplate(params).then(res => {
      if (res.success && res.data) {
        const content1 = (
          <>
            <span>{getIn18Text('BAOCUNCHENGGONG')}</span>
          </>
        );
        message.success({
          content: content1,
        });
      } else {
        message.error({
          content: getIn18Text('BAOCUNSHIBAI\uFF01'),
        });
      }
    });
  };

  const trackPv = (stage: string) => {
    edmDataTracker.trackPv(EDMPvType.SendProcess, {
      stage: stage,
    });
  };

  const handleDraftInitData = (data: ResponseEdmDraftInfo) => {
    initDataRef.current.replyEdmEmailId = data.replyEdmEmailId;
    initDataRef.current.sendSettingInfo = data.sendSettingInfo;
    initDataRef.current.contentEditInfo.emailContent = data.contentEditInfo?.emailContent;
    initDataRef.current.sendDomainLimit = data.sendDomainLimit;
    initDataRef.current.sendStrategyOn = data.sendStrategyOn;
    setCanShow(!data.contentEditInfo?.emailContent);
    initDataRef.current.receiverInfo.contactInfoList = data.receiverInfo.contactInfoList?.sort((a: any, b: any) => {
      return a.contactStatus !== undefined && b.contactStatus !== undefined ? b.contactStatus - a.contactStatus : 1;
    });
  };

  const setReady = () => {
    dispatch({
      type: 'setState',
      payload: {
        isReady: true,
      },
    });
  };

  const getReceiversFromStorage = useCallback(async () => {
    if (!props.qs.key) {
      return;
    }
    try {
      // 从 localStorage 中获取到传过来的联系人数据
      const receivers = JSON.parse(localStorage.getItem(props.qs.key) || '') as IEdmEmailList[];
      // 及时清除 localStorage, 以避免切换登录账号场景下的收件人数据错乱
      setTimeout(() => {
        localStorage.setItem(props.qs.key, '');
      }, 2000);

      if (receivers && receivers.length) {
        var emailKV: Map<string, boolean> = new Map();
        var contactInfos: EdmSendConcatInfo[] = [];

        receivers.forEach(i => {
          if (emailKV.has(i.contactEmail)) {
            return;
          }
          emailKV.set(i.contactEmail, true);
          let info = { ...i } as EdmSendConcatInfo;
          contactInfos.push(info);
        });
        initDataRef.current.receiverInfo.contactInfoList = contactInfos;
        setIdByTab(2);

        const draftId = props.qs.draftId ? props.qs.draftId : await edmApi.createDraft();
        dispatch({
          type: 'setState',
          payload: { draftId, currentStage: 2 },
        });
        updateData();
      }
    } catch (e) {
      // warn
    }
  }, [props.qs.key]);

  const updateData = () => {
    setData({ ...initDataRef.current });
  };

  const getReceiversFromQuery = async () => {
    // 一键营销，通过 url query 传递，主要来源为外贸通助手插件
    if (props.qs.from === 'extension') {
      try {
        const receivers = JSON.parse(safeDecodeURIComponent(props.qs.emailList)) || [];
        if (receivers && receivers.length) {
          const receiverList: Array<{ email: string; name?: string }> = [];
          const hashMap: Record<string, number> = {};
          // setActiveTab(2);
          setIdByTab(2);
          // 去重
          receivers.forEach((r: string) => {
            if (hashMap[r] !== 1) {
              hashMap[r] = 1;
              receiverList.push({
                email: r,
                name: '',
              });
            }
          });

          const draftId = await edmApi.createDraft();

          dispatch({
            type: 'setState',
            payload: { draftId },
          });
          return getContactStatus({ needStatus: false, receiverList, draftId }).then(list => {
            initDataRef.current.receiverInfo.contactInfoList = list;
            dispatch({ type: 'setState', payload: { currentStage: 2 } });
          });
        }
      } catch (e) {}
    }
  };

  const handleSaveTemplate = () => {
    setPersonalTemplateAddModalOpen(true);
  };

  const handleStepChange = (type: 'prev' | 'next') => {
    let tabIndex = 0;
    for (var i = 0; i < steps.length; i++) {
      if (steps[i].id === state.currentStage) {
        tabIndex = i;
        break;
      }
    }
    let n = 0;
    if (type === 'next') {
      n = tabIndex === steps.length - 1 ? 0 : tabIndex + 1;
    }
    if (type === 'prev') {
      n = tabIndex === 0 ? 0 : tabIndex - 1;
    }

    edmDataTracker.trackNextStep(state.currentStage);
    setIdByTab(n);
    if (isNotCornEdit) {
      handleSave();
    }
  };

  const saveAndBack = async () => {
    edmDataTracker.trackSaveDraft(DraftSaveType.Back, state.currentStage);
    const success = await handleSave();
    success && toast.success({ content: getIn18Text('BAOCUNCAOGAOCHENGGONG') });
    backToSource();
  };

  const canShowToday = () => {
    const times = JSON.parse(localStorage.getItem('helpTimes') || '[]');
    if (times.length >= 2) {
      return false;
    }

    if (times.length === 1 && dayjs().isSame(times[0], 'day')) {
      return false;
    }

    return true;
  };

  let [shouldShow, setShouldShow] = useState(canShowToday());

  const handleBack = () => {
    setShowSaveConfirm(true);
  };

  const insertReplyPositionIfNeeded = (editorBody: any) => {
    if (!isCopyHeader) {
      return;
    }
    const holderDiv = editorBody.querySelector('#waimao-reply-position');
    if (!holderDiv) {
      editorBody.insertAdjacentHTML('beforeend', '<div id="waimao-reply-position" style="display: none;"></div>');
    }
  };
  const insertPreHeaderAndSummaryIfNeeded = (editorBody: any, summary?: string) => {
    const holderDiv: Element = editorBody.querySelector('#preheader-waimao');
    if (holderDiv) {
      holderDiv.remove();
    }
    if (summary && summary.length > 0) {
      editorBody.insertAdjacentHTML('afterbegin', `<span id="preheader-waimao" id="9999" style="display: none !important; font-size:0; line-height:0">${summary}</span>`);
      edmDataTracker.track('pc_markting_edm_abstract_edit', {
        abstract_content: summary,
      });
    }
  };

  const handleEditorData = (formSetting?: ISettingData, onlySave?: boolean): EdmContentInfo => {
    const editorBody = contentRef.current?.getEditor()?.getBody();
    if (editorBody) {
      insertReplyPositionIfNeeded(editorBody);
      insertPreHeaderAndSummaryIfNeeded(editorBody, formSetting?.emailSummary);
    }

    const titleVars: string[] = [];
    formSetting?.emailSubjects?.forEach(obj =>
      obj.subject.replace(/#\{(\S+)\}/g, (input: string, $1) => {
        if (titleVars.indexOf($1) === -1) {
          titleVars.push($1);
        }
        return input;
      })
    );

    const vars = contentRef.current?.getVars();
    let content = contentRef.current?.getContentWithAttachment() || '';
    if (onlySave) {
      content = contentRef.current?.getContent() || '';
    }
    const attachmentList = contentRef.current?.getAttachmentList();

    const links: string[] = contentRef.current?.getLinks() || [];
    const productInfos: Array<{ productId: string; productLink: string; siteId: string }> = contentRef.current?.getProductsInfo();

    const contentEditInfo: EdmContentInfo = {
      emailContent: content,
      emailAttachment: attachmentList?.length ? JSON.stringify(attachmentList) : '',
      templateParams: uniq(titleVars.concat(vars || []).concat(state.templateParamsFromEditor)).join(','),
      traceLinks: links.map(link => ({ traceUrl: link, escapedTraceUrl: encodeHTML(link) })),
      edmSendProductInfos: productInfos,
      emailReceipt: Number(emailReceipt),
    };

    // 线上数据这里还是有入口进来的, 没找到入口, 所以这个逻辑先不动 @hanxu 2023.12.25
    // 是 ContentEditor 通过 setState添加的, @hanxu  2024.1.5
    if (state.templateId !== undefined) {
      contentEditInfo.templateId = state.templateId;
      contentEditInfo.emailType = EdmEmailType.USE_TEMPLATE;
    } else {
      // 再加一个新流程的补偿
      let info = contentRootRef.current?.fetchTemplateInfo();
      if (info?.use && info.id) {
        contentEditInfo.templateId = info.id;
        contentEditInfo.emailType = EdmEmailType.USE_TEMPLATE;
      } else {
        contentEditInfo.emailType = EdmEmailType.CREATE_EMAIL;
      }
    }
    return contentEditInfo;
  };

  /**
   * 以下两个转换的方法都是需要兼容默认策略的场景，只是一个interceptor
   */
  // 复制别人的账号
  const transformSecondDataCopy = (secondSendInfo?: SecondSendInfo): SecondSendInfo | undefined => {
    if (secondSendInfo == null) {
      return;
    }
    const saveInfos = secondSendInfo?.saveInfos?.map(info => {
      if (info.triggerCondition != null && (info.triggerCondition?.senderType === 0 || info.triggerCondition?.senderType == null)) {
        info.triggerCondition.senderType = 0;
        const email = systemApi.getCurrentUser()?.id || '';
        info.sendSettingInfo.senderEmails = [email];
      }
      if (info.triggerCondition?.senderType === 1) {
        const formSetting = settingRef.current?.getValues() || {};
        info.sendSettingInfo.senderEmails = formSetting.senderEmails;
      }
      return info;
    });

    return {
      saveInfos,
    };
  };

  const transformSecondData = (secondSendInfo: SecondSendInfo): SecondSendInfo => {
    const saveInfos = secondSendInfo?.saveInfos?.map(info => {
      if (info.triggerCondition != null && info.triggerCondition.senderType == null) {
        info.triggerCondition.senderType = 0;
        const email = systemApi.getCurrentUser()?.id || '';
        info.sendSettingInfo.senderEmails = [email];
      }
      // 如果存在type为0，并且长度大于1的数据需要纠正
      if (
        info.triggerCondition != null &&
        info.sendSettingInfo != null &&
        info.sendSettingInfo.senderEmails != null &&
        info.triggerCondition.senderType === 0 &&
        info.sendSettingInfo.senderEmails?.length > 1
      ) {
        const email = systemApi.getCurrentUser()?.id || '';
        info.sendSettingInfo.senderEmails = [email];
      }
      if (info.triggerCondition?.senderType === 1) {
        const formSetting = settingRef.current?.getValues() || {};
        info.sendSettingInfo.senderEmails = formSetting.senderEmails;
      }
      return info;
    });

    return {
      saveInfos,
    };
  };

  const handleSecondSendInfo = async () => {
    let secondSendInfo: any = {};
    // 大发信量暂时不支持二次营销 @hanxu
    if (channel === TaskChannel.senderRotate) {
      return undefined;
    }
    try {
      setLoading(true);
      const remarketingInfo = await getRefbySmartMarketingSite?.getReMarketingInfo(true);
      // body.secondSendInfo = remarketingInfo
      // todo 没有上传内容的策略需要上传内容
      if (remarketingInfo.saveInfos && remarketingInfo.saveInfos.length > 0) {
        secondSendInfo = remarketingInfo;
      } else {
        secondSendInfo = undefined;
      }
    } catch (err) {
      setLoading(false);
    } finally {
      setLoading(false);
      return transformSecondData(secondSendInfo);
    }
  };

  const handleReceiverContacts = () => {
    const receivers = receiverRef.current?.getReceivers() as any[];
    if (!receivers || receivers.length === 0) {
      return null;
    }
    // 2023年8月30日和产品确认increaseSourceName上传逻辑修改如下：
    // 如果从右侧侧边栏添加了联系人优先显示对应的添加来源，如果没有则看是否外部有添加来源PrevScene
    let from = new URLSearchParams(location.href).get('from') as PrevScene;
    return receivers.map(i => ({
      email: i.contactEmail,
      name: i.contactName || '',
      companyName: i.companyName || '',
      continent: i.continent || '',
      country: i.country || '',
      province: i.province || '',
      city: i.city || '',
      variableMap: i.variableMap,
      sourceName: i.sourceName || '',
      increaseSourceName: guardString(i.increaseSourceName) ? i.increaseSourceName : from,
      position: i.position || '',
      remarks: i.remarks || '',
      verifyStatus: i.verifyStatus,
      verifyStatusList: i.verifyStatusList,
      contactStatus: i.contactStatus,
      contactStatusList: i.contactStatusList,
    }));
  };

  const creatDraft = async () => {
    let id = '';
    try {
      id = await edmApi.createDraft();
      setLoading(false);
      dispatch({
        type: 'setState',
        payload: { draftId: id },
      });
    } catch (err) {
      setLoading(false);
    }
    return id;
  };

  const constructTaskData = async (showLoading = true, onlySave?: boolean): Promise<Partial<RequestSaveDraft>> => {
    const defaultSetting = { edmSubject: '', sender: '', replyEmail: '' };
    const formSetting = settingRef.current?.getValues() || {};
    const contentEditInfo = handleEditorData(formSetting, onlySave);
    let id = state.draftId;
    if (!id) {
      showLoading && setLoading(true);
      id = await creatDraft();
    }

    // 二次营销
    let secondSendInfo = await handleSecondSendInfo();
    const contacts = handleReceiverContacts();

    const source = (new URLSearchParams(location.href).get('from') as PrevScene) || prevScene;
    let smartSendOpen = true;
    if (getRefbySmartMarketingSite) {
      smartSendOpen = getRefbySmartMarketingSite?.isSmartSendOpen();
    }
    let syncContactStoreClue = false;
    if (receiverRef.current?.getStoreClueValue() === true) {
      syncContactStoreClue = true;
    }
    showLoading && setLoading(true);
    const resp: Partial<RequestSaveDraft> = {
      draftId: id || '',
      currentStage: state.currentStage,
      sendSettingInfo: { ...defaultSetting, ...formSetting },
      secondSendInfo,
      contentEditInfo,
      receiverInfo: {
        contacts: (contacts as any[]) || [],
      },
      push,
      draftType: channel === TaskChannel.senderRotate ? 6 : 0, // 0:普通草稿 1:分批任务草稿 6: 大发信量
      syncContact,
      syncSendEmail,
      source,
      clueBatch: Number(clueBatch),
      sendStrategyOn: smartSendOpen,
      replyEdmEmailId: qs.replyEdmEmailId || data.replyEdmEmailId,
      syncContactStoreClue: syncContactStoreClue,
    };

    const astrictCount = getRefbySmartMarketingSite?.getAstrictCount();
    if (astrictCount) {
      resp.sendDomainLimit = astrictCount;
    }

    return resp;
  };

  const allowSend = () => {
    if (contentRootRef.current) {
      return contentRootRef.current?.fetchAllowSend();
    }
    return true;
  };

  // 保存草稿回调 ==== 先隐藏
  const handleSave = async (autoCreatDraft = true, showLoading = true) => {
    if (!allowSend()) {
      message.error(getIn18Text('YOUJIANNEIRONGZUIDUOZHI'));
      return;
    }
    if (!autoCreatDraft) {
      return;
    }

    showLoading && setLoading(true);
    try {
      const draft = await constructTaskData(showLoading, true);
      const success = await edmApi.saveDraft(draft);
      setParam(draft);
      setLoading(false);
      return success;
    } catch (err) {
      setLoading(false);
      message.error('保存草稿失败，请稍后重试！');
    }
  };

  const getFilterCapacity = (filterCapacity: ResponseFilterCount) => {
    setFilterCapacity(filterCapacity);
  };

  const showReceiverModal = () => {
    dispatch({ type: 'setState', payload: { currentStage: 2 } });
    receiverRef.current?.showReceiverModal();
  };

  const handleSaveDraft = async () => {
    edmDataTracker.trackSaveDraft(DraftSaveType.Save, state.currentStage);
    if (!isUploadCompleted()) {
      toast.error({ content: getIn18Text('FUJIANSHANGCHUANWEIWANCHENG\uFF0CQINGDENGDAISHANGCHUANWANCHENGHUOSHANCHU') });
      return;
    }
    const success = await handleSave();
    success && toast.success({ content: getIn18Text('BAOCUNCAOGAOCHENGGONG') });
  };

  const checkValid = (tab: number) => {
    if (tab === StepsMap.SendSetting.id) {
      checkStepSendSetting();
    }
    if (tab === StepsMap.ContentEditor.id) {
      checkContentEditor();
    }

    if (tab === StepsMap.BatchSetting.id) {
      checkBatchSetting();
    }
  };
  const checkStepSendSetting = async () => {
    const sendSetting = steps.filter(item => {
      return item.id === StepsMap.SendSetting.id;
    })[0];

    try {
      const data = await settingRef.current?.validateFields();
      if (sendSetting && data) {
        sendSetting.checked = true;
      }
      dispatch({ type: 'setState', payload: {} });
    } catch (e) {
      if (sendSetting) {
        sendSetting.checked = false;
      }
      dispatch({ type: 'setState', payload: {} });
    }
  };
  const checkContentEditor = () => {
    const editContent = steps.filter(item => {
      return item.id === StepsMap.ContentEditor.id;
    })[0];

    const text = contentRef.current?.getText();
    const images = contentRef.current?.getImages();
    if (text === '' && images.length === 0) {
      if (editContent) {
        editContent.checked = false;
      }
    } else {
      if (editContent) {
        editContent.checked = true;
      }
    }
  };
  const checkBatchSetting = () => {
    const battingSetting = steps.filter(item => {
      return item.id === StepsMap.BatchSetting.id;
    })[0];
    const receivers = receiverRef.current?.getReceivers() || [];
    if (receivers.length > 0) {
      if (battingSetting) {
        battingSetting.checked = true;
      }
    } else {
      if (battingSetting) {
        battingSetting.checked = false;
      }
    }
  };

  const setIdByTab = (tab: number) => {
    const id = steps[tab].id;
    if (id !== StepsMap.SendSetting.id) {
      settingRef.current?.clearHoverGuide();
    }
    if (id !== StepsMap.ContentEditor.id) [contentRef.current?.clearHoverGuide()];
    if (id === StepsMap.SendSetting.id) {
      trackSettingSubjects();
    }
    checkValid(state.currentStage);
    dispatch({ type: 'setState', payload: { currentStage: id } });
  };

  const trackSettingSubjects = () => {
    const formSetting = settingRef.current?.getValues() || {};
    const subjects = formSetting.emailSubjects?.map(item => {
      return item.subject;
    });
    edmDataTracker.track('pc_markting_edm_multi_subjects_use', {
      subject_number: formSetting.emailSubjects?.length || 0,
      subject_content: subjects?.join(',') || '',
    });
  };

  const setIdByStepValue = (step: StepValueModel) => {
    if (step === 'BatchSetting') {
      edmDataTracker.track('pc_markting_edm_singleTask', {
        page: 'task',
      });
    }
    if (step === 'ContentEditor') {
      edmDataTracker.track('pc_markting_edm_singleTask', {
        page: 'content',
      });
    }
    if (step === 'SendSetting') {
      edmDataTracker.track('pc_markting_edm_singleTask', {
        page: 'send',
      });
    }

    for (var i = 0; i < steps.length; i++) {
      if (steps[i].value === step) {
        setIdByTab(i);
        break;
      }
    }
  };

  const validateSubmit = async (autoJump?: boolean) => {
    try {
      await settingRef.current?.validateFields();
    } catch (e) {
      autoJump && setIdByStepValue('SendSetting');
      return false;
    }
    // 内容为空
    if (contentRef.current) {
      const text = contentRef.current.getText();
      const images = contentRef.current.getImages();
      if (text === '' && images.length === 0) {
        // autoJump && setActiveTab(1);
        autoJump && setIdByStepValue('ContentEditor');
        toast.error({ content: getIn18Text('YOUJIANNEIRONGBUNENGWEIKONG') });
        return false;
      }
    }

    let receivers = receiverRef.current?.getReceivers() || [];
    // 如果receiverRef 没加载时，就取原有的逻辑
    if ((isCronEditWithOneTab || isCronEditWithTwoTab) && !receiverRef.current) {
      receivers = data.receiverInfo.contactInfoList;
    }

    if (receivers?.length === 0) {
      toast.error({ content: getIn18Text('SHOUJIANRENBUNENGWEIKONG') });
      return false;
    }
    return true;
  };
  const handleTrySend = () => {
    settingRef.current?.validateFields().then(
      () => {
        setShowTrySendModal(true);
      },
      e => {
        // setActiveTab(0);
        setIdByStepValue('SendSetting');
      }
    );
  };
  // 试发回调
  const doTrySend = async (email: string) => {
    if (!isUploadCompleted()) {
      toast.error({ content: getIn18Text('FUJIANSHANGCHUANWEIWANCHENG\uFF0CQINGDENGDAISHANGCHUANWANCHENGHUOSHANCHU') });
      return false;
    }
    if (!allowSend()) {
      message.error(getIn18Text('YOUJIANNEIRONGZUIDUOZHI'));
      return;
    }
    const body = await getSendCommonParams();
    anxinfaTrakcer(edmDataTracker.trySendTask);

    if (body.receiverInfo) {
      body.receiverInfo.trySendEmail = { email };
    }
    edmDataTracker.track('pc_markting_edm_sendprocess_contact_test');

    return getSendApi(body)
      .then(data => {
        setShowTrySendModal(false);
        toast.success({ content: getIn18Text('SHIFACHENGGONG') });
        sendGPTReportIfNeeded(data.edmEmailId);
        sendContentAssistantTrackerIfNeeded();
        return true;
      })
      .catch(e => {
        onHttpError(e);
        return false;
      });
  };

  const sendGPTReportIfNeeded = async (edmEmailId: string) => {
    let result = Array<GPTReport>();
    if (aiWriteResult) {
      result.push(aiWriteResult);
    }
    if (aiRetouchResult) {
      result.push(aiRetouchResult);
    }
    if (result.length === 0) {
      return;
    }
    let req = {
      edmEmailIds: [edmEmailId],
      gptRecordInfo: result,
    };
    const _ = edmApi.reportGPTTask(req);
  };

  const sendContentAssistantTrackerIfNeeded = () => {
    if (useContentAssistant) {
      edmDataTracker.track('pc_markting_edm_contentSuccess', {
        type: useContentAssistant,
      });
    }
  };

  const shouldShowMultiVersionAlert = async () => {
    if (channel === TaskChannel.normal) {
      return false;
    }
    if (getRefbySmartMarketingSite?.getAiModifySwitchChecked()) {
      return false;
    }
    showCronSendModal && setShowCronSendModal(false);

    const userChoice = await new Promise((resolve, reject) => {
      Modal.confirm({
        title: '建议开启千邮千面。提升送达率',
        okText: '确定',
        cancelText: '继续发送',
        onOk() {
          resolve(true);
        },
        onCancel() {
          resolve(false);
        },
      });
    });

    // 用户选择了选项1，继续执行 async 流程
    if (userChoice === true) {
      setLoading(false);
      getRefbySmartMarketingSite?.openMultiVersionSwitch();
      return true;
    }
    console.log('----');
    return false;
  };

  // 判断跳转哪一个成功页面
  const judgeJumpWhichSuccessPage = (data: ResponseSendDraft) => {
    edmDataTracker.track('pc_markting_edm_singleTask', {
      page: 'success',
    });
    let pageType = '';
    let btns = [
      {
        text: '查看任务详情',
        type: 'primary',
        style: { marginRight: 12 },
        onclick() {
          toDetailPage(data);
          edmDataTracker.successPage({
            click: 'detail',
          });
        },
      },
      {
        text: new URLSearchParams(location.href).get('back') ? '返回原页面' : '返回任务列表',
        type: 'minorLine',
        onclick() {
          const backString = new URLSearchParams(location.href).get('back') || '';
          if (guardString(backString)) {
            backToSource();
          } else {
            channel === TaskChannel.senderRotate ? navigate(`${routerWord}?page=senderRotateList`) : navigate(`${routerWord}?page=index`);
          }
          const trackInfo = backString ? 'back' : 'list';
          edmDataTracker.successPage({
            click: trackInfo,
          });
        },
      },
    ];
    const addContactPlanData = addContactPlanRef.current;
    if (!addContactPlanData?.isAddContactPlan) {
      pageType = 'SendSuccessPage';
    } else if (!addContactPlanData?.taskId) {
      pageType = 'SendSuccessWithNoTaskPage';
    } else {
      pageType = 'SendSuccessWithTaskPage';
      btns = [
        {
          text: '查看单次发信任务',
          type: 'primary',
          style: { marginRight: 12 },
          onclick() {
            toDetailPage(data);
          },
        },
        {
          text: '查看营销托管任务',
          type: 'minorLine',
          style: { marginRight: 12 },
          onclick() {
            navigate(`${routerWord}?page=aiHosting&planId=${addContactPlanData?.planId}`);
          },
        },
        {
          text: '返回任务列表',
          type: 'minorLine',
          onclick() {
            const backString = new URLSearchParams(location.href).get('back') || '';
            if (guardString(backString)) {
              backToSource();
            } else {
              channel === TaskChannel.senderRotate ? navigate(`${routerWord}?page=senderRotateList`) : navigate(`${routerWord}?page=index`);
            }
            const trackInfo = backString ? 'back' : 'list';
            edmDataTracker.successPage({
              click: trackInfo,
            });
          },
        },
      ];
      edmDataTracker.track('pc_marketing_edm_host_addSuccess', { source: aiHostingInitObj?.trackFrom || 'host', from: 'singleTask' });
      changeAiHostingInitObj({});
    }
    handleSuccess &&
      handleSuccess(
        {
          ...data,
          taskSubject: addContactPlanData?.planName || '',
          receivers: receiverRef.current?.getReceivers(),
          receiveCount: receiverRef.current?.getReceivers()?.length || 0,
          channel,
          toDetailPage,
          backToSource,
          backString: new URLSearchParams(location.href).get('back') || '',
          btns,
        },
        pageType
      );
    // 任务诊断成功之后的埋点
    // validatorProvider.dispatch({
    //   type: 'setValidatorResult',
    //   payload: {
    //     id: 'ValidatorResult',
    //     edmId: data.edmEmailId,
    //   },
    // });
    taskDiagnosisTracker(data.edmEmailId);
  };

  const taskDiagnosisTracker = (edmEmailId: string) => {
    const taskDiagnosisState = validatorProvider.state.find(state => state.id === 'ValidatorResult') as ValidatorResult;
    edmDataTracker.taskDiagnosisSuccessCount({
      edmId: edmEmailId,
      type: taskDiagnosisState.type!,
      volume: (taskDiagnosisState.firstCount || 0) - (taskDiagnosisState.lastCount || 0),
    });
  };

  // 定时发送回调
  const doCronSend = async (
    params: Partial<{
      time: string;
      timeZone: string;
      sendTimeCountry: string;
      kv: Record<string, string>;
      mode: SendMode;
      hostingInfo: Record<string, string>;
    }>
  ): Promise<boolean> => {
    const { time, timeZone, sendTimeCountry, kv, mode } = params;
    const canSubmit = await validateSubmit(true);
    if (!canSubmit) {
      return false;
    }
    if (!isUploadCompleted()) {
      toast.error({ content: getIn18Text('FUJIANSHANGCHUANWEIWANCHENG\uFF0CQINGDENGDAISHANGCHUANWANCHENGHUOSHANCHU') });
      return false;
    }
    if (!allowSend()) {
      message.error(getIn18Text('YOUJIANNEIRONGZUIDUOZHI'));
      return false;
    }
    const body = await getSendCommonParams();
    body.sendType = 2;
    if (body.receiverInfo) {
      body.receiverInfo.cronTime = time;
      body.receiverInfo.cronTimeZone = timeZone;
      body.receiverInfo.syncSchedule = syncSchedule;
      body.receiverInfo.sendTimeCountry = sendTimeCountry;
      if (mode === SendMode.local) {
        body.receiverInfo.cronLocalTime = time;
      }
    }

    kv &&
      body.receiverInfo?.contacts?.forEach(item => {
        let userzone = kv[item.email] || '';
        if (userzone.length > 0) {
          item.timezone = userzone;
        }
      });

    setSendType(body.sendType);
    // 区分普通发信和精准发信
    const receiversSendType = receiverRef?.current?.getReceiverType() as number;
    anxinfaTrakcer(edmDataTracker.cronSendTask);

    body.hostingInfo = params.hostingInfo;

    try {
      const remarketingInfo = await getRefbySmartMarketingSite.getReMarketingInfo();
      // body.secondSendInfo = remarketingInfo
      // todo 没有上传内容的策略需要上传内容
      if (remarketingInfo.saveInfos && remarketingInfo.saveInfos.length > 0) {
        body.secondSendInfo = remarketingInfo;
        trackReMarketing(remarketingInfo);
      } else {
        delete body.secondSendInfo;
      }
    } catch (err) {}

    // 查看多版本ai改写状态，如果正在改写中，则弹窗提示
    // 挪走 挪到多轮营销弹窗前
    body.multipleContentInfo = await handleAiModifyInfo();

    // 埋点
    edmDataTracker.trackEdmSendType(receiversSendType === 1 ? getIn18Text('JINGZHUNFASONG') : getIn18Text('BIANJIEFASONG'));
    // 精准发送-无效地址强行发信埋点
    {
      receiversSendType === 1 && edmDataTracker.trackEdmSendInvalidContact(body?.receiverInfo?.contacts || []);
    }
    // 如果需要弹窗提示开始千邮千面, 当前流程结束, 并且开启千邮千面
    if (await shouldShowMultiVersionAlert()) {
      return false;
    }
    return getSendApi(body).then(
      data => {
        if (body.secondSendInfo) {
          data.hasRemarketing = true;
        } else {
          data.hasRemarketing = false;
        }
        dataStoreApi.put('edmDirRemind', '1');
        if (receiverRef.current) {
          dataStoreApi.put('edmUploadEdisk', (!!receiverRef.current?.getIsUploadEdisk()).toString());
        }
        sendGPTReportIfNeeded(data.edmEmailId);
        sendContentAssistantTrackerIfNeeded();
        edmDataTracker.trackSendResult('timing', {
          result: 'success',
        });
        if (['newCreate', 'copyTask', 'draft'].includes(prevScene)) {
          edmDataTracker.trackMarktingEdmTaskSuccess('timed', TrackSourceMap[prevScene as 'newCreate' | 'copyTask' | 'draft']);
        }
        setShowCronSendModal(false);
        setSuccessTip(data);
        judgeJumpWhichSuccessPage(data);
        return true;
      },
      res => {
        if (res?.code === 100) {
          Alert.error({
            className: style.receiverAlert,
            width: 400,
            centered: true,
            title: getIn18Text('FAXINLIANGXIANE'),
            content: (
              <>
                {getIn18Text('FAXINLIANGXIANE\uFF0CQINGSHANJIANHUOBAOCUNHOU')}
                <WaimaoCustomerService style={{ color: '#5383FE' }} />
              </>
            ),
            okText: getIn18Text('ZHIDAOLE'),
          });
          edmDataTracker.trackSendResult('now', {
            result: 'limit',
          });
        } else {
          onHttpError(res);
        }
        return false;
      }
    );
  };

  const handleAiModifyInfo = async () => {
    let p = {};
    try {
      const modifyInfo = await getRefbySmartMarketingSite.getAiModifyInfo();
      if (modifyInfo) {
        p = modifyInfo;
      } else {
        p = undefined;
      }
    } catch (err) {
      console.log('come here');
    }
    return p;
  };

  const trackReMarketing = (info: SecondSendInfo) => {
    const strategys = info.saveInfos;
    if (!strategys || strategys.length === 0) {
      return;
    }
    let param: string[] = [];
    strategys.forEach(item => {
      if (item.triggerCondition?.isRecommend && !item.triggerCondition.isEdited) {
        if (item.triggerCondition.conditionContent.emailOpType === 2) {
          param.push('syetemNoclick');
        }
        if (item.triggerCondition.conditionContent.emailOpType === 3) {
          param.push('syetemNoreply');
        }
      } else {
        param.push('customizedProject');
      }
    });

    edmDataTracker.track('pc_markting_edm_secondaryMarketing_cardNumber', {
      type: param.join(','),
    });
  };

  const getSendApi = async (body: RequestSendDraft) => {
    // debugger
    const receiversSendType = (receiverRef?.current?.getReceiverType() as number) || 1;
    // 发送前 统一处理
    if (body.contentEditInfo.emailContent) {
      body.contentEditInfo.emailContent = await edmApi.handleTempUnsubscribeText(body.contentEditInfo?.emailContent, body.sendSettingInfo?.senderEmail);
    }

    let info = contentRootRef.current?.fetchTemplateInfo();
    let type = info?.type;
    let id = info?.id;

    let finalType = '';
    if (prevScene === 'template') {
      finalType = 'library';
    }
    if (prevScene === 'copyTask') {
      finalType = 'copyTask';
    }

    edmDataTracker.track('pc_markting_edm_taskCreate_contentUse', {
      type: guardString(finalType) ? finalType : type,
      id: id,
      change: info?.changed,
    });

    return receiversSendType === 1 ? edmApi.sendMail(body) : edmApi.sendNormalMail(body);
  };

  // 旗舰版安心发埋点
  const anxinfaTrakcer = (api: any) => {
    const sendMails = settingRef.current?.getSenderEmails() || [];
    let type = new Set<string>();
    sendMails.forEach(mail => {
      if (mail.id === 1) {
        type.add('personal_address');
      } else if (mail.id === 2) {
        // 多域名
        type.add('multiple_domain_addresses');
      } else {
        // id = 3 是安心发
        type.add('anxin_address');
      }
    });
    api(ultimateVersion ? 'ultimate_version' : 'normal_version', [...type]);
  };

  // 发送回调
  const doSendNow = async (params?: Record<'hostingTaskId' | 'hostingPlanId' | 'userGroupId', string>) => {
    const canSubmit = await validateSubmit(true);
    if (!canSubmit) {
      return false;
    }
    if (!isUploadCompleted()) {
      toast.error({ content: getIn18Text('FUJIANSHANGCHUANWEIWANCHENG\uFF0CQINGDENGDAISHANGCHUANWANCHENGHUOSHANCHU') });
      return;
    }
    if (!allowSend()) {
      message.error(getIn18Text('YOUJIANNEIRONGZUIDUOZHI'));
      return;
    }
    const receivers = receiverRef.current?.getReceivers() || [];
    if (Array.isArray(receivers) && needRecord()) {
      globalSearchApi.doMailSaleRecord({
        emails: receivers.map(e => e.contactEmail as string),
      });
    }
    const formSetting = settingRef.current?.getValues();
    anxinfaTrakcer(edmDataTracker.sendTask);

    if (formSetting?.ccInfos?.length && formSetting?.ccReceivers && receivers?.length > 500) {
      toast.error({
        content: getIn18Text('SHOUJIANRENCHAOGUO500REN\uFF0CBUZHICHI\u201CSHOUJIANRENKEJIANCHAOSONG\u201D\uFF0CKEDAOFAJIANSHEZHIYEMIANQUXIAOGOUXUAN\u3002'),
      });
      return false;
    }
    const receiversSendType = (receiverRef?.current?.getReceiverType() as number) || 1;
    const body = await getSendCommonParams();
    body.sendType = 1;
    setSendType(body.sendType);
    // 托管任务相关参数
    body.hostingInfo = params;

    // 查看多版本ai改写状态，如果正在改写中，则弹窗提示
    // 挪到多伦营销弹窗前

    body.multipleContentInfo = await handleAiModifyInfo();
    // 埋点
    edmDataTracker.trackEdmSendType(receiversSendType === 1 ? getIn18Text('JINGZHUNFASONG') : getIn18Text('BIANJIEFASONG'));
    // 精准发送-无效地址强行发信埋点
    {
      receiversSendType === 1 && edmDataTracker.trackEdmSendInvalidContact(body?.receiverInfo?.contacts || []);
    }
    // 如果需要弹窗提示开始千邮千面, 当前流程结束, 并且开启千邮千面
    if (await shouldShowMultiVersionAlert()) {
      return;
    }
    setLoading(true);
    return getSendApi(body)
      .then(
        data => {
          if (body.secondSendInfo) {
            data.hasRemarketing = true;
          } else {
            data.hasRemarketing = false;
          }
          sendGPTReportIfNeeded(data.edmEmailId);
          sendContentAssistantTrackerIfNeeded();
          dataStoreApi.put('edmDirRemind', '1');
          if (receiverRef.current) {
            dataStoreApi.put('edmUploadEdisk', (!!receiverRef.current?.getIsUploadEdisk()).toString());
          }

          edmDataTracker.trackSendResult('now', {
            result: 'success',
          });
          if (['newCreate', 'copyTask', 'draft'].includes(prevScene)) {
            edmDataTracker.trackMarktingEdmTaskSuccess('send', TrackSourceMap[prevScene as 'newCreate' | 'copyTask' | 'draft']);
          }
          commit(3); // 新手任务第三步完成
          setSuccessTip(data);
          judgeJumpWhichSuccessPage(data);
        },
        res => {
          if (res?.code === 100) {
            Alert.error({
              className: style.receiverAlert,
              width: 400,
              centered: true,
              title: getIn18Text('FAXINLIANGXIANE'),
              content: (
                <>
                  {getIn18Text('FAXINLIANGXIANE\uFF0CQINGSHANJIANHUOBAOCUNHOU')}
                  <WaimaoCustomerService style={{ color: '#5383FE' }} />
                </>
              ),
              okText: getIn18Text('ZHIDAOLE'),
            });
            edmDataTracker.trackSendResult('now', {
              result: 'limit',
            });
          } else {
            onHttpError(res);
          }
        }
      )
      .finally(() => setLoading(false));
  };

  const checkModifySwitchCheck = async () => {
    // 查看多版本ai改写状态，如果正在改写中，则弹窗提示
    try {
      const modifyStatus = getRefbySmartMarketingSite?.getAiModifyStatus();
      const modifySwitchChecked = getRefbySmartMarketingSite?.getAiModifySwitchChecked();

      if (modifyStatus === 'inProgress' && modifySwitchChecked) {
        return new Promise((resolve, reject) => {
          const md = SiriusModal.warning({
            title: getIn18Text('NINHAIYOUZHENGZAISHENGCHENG'),
            content: '',
            okText: getIn18Text('DENGDAISHENGCHENGJIEGUO'),
            // icon: <WarningIcon />,
            // className: style.multiVersionConfirmModal,
            cancelText: getIn18Text('BUDENGLEZHIJIEFA'),
            centered: true,
            maskClosable: false,
            onCancel: () => {
              md.destroy();
              getRefbySmartMarketingSite?.closeMultiVersionSwitch(); // 关闭多版本
              resolve(true);
            },
            onOk() {
              md.destroy();
              resolve(false);
            },
          });
        });
      }
      return true;
    } catch (err) {
      console.log('获取AI改写状态失败', err);
      return true;
    }
  };

  const doSendBefore = async (
    type: 'now' | 'normal',
    normalParam?: {
      time?: string;
      timeZone?: string;
      sendTimeCountry?: string;
    },
    kv?: Record<string, string>,
    mode?: SendMode
  ): Promise<boolean | void> => {
    const receiversSendType = (receiverRef?.current?.getReceiverType() as number) || 1;
    const receivers = receiverRef.current?.getReceivers();
    // 如果是发送，则用当天剩余，如果是定时发送，则用每天的limit
    let filterCount = 0;
    if (type === 'now') {
      filterCount = filterCapacity?.dayLeft || 0;
      setSendType(1);
    } else {
      filterCount = Math.min(filterCapacity?.dayLimit || 0, filterCapacity?.totalLeft || 0);
      setSendType(2);
    }

    // 精准发送在过滤的时候已经处理过了直接return
    if (receiversSendType === 1 || receivers.length <= filterCount) {
      const canSubmit = await validateSubmit(true);
      if (!canSubmit) {
        return false;
      }

      // 跳过千人千面
      const skipSwitchCheck = await checkModifySwitchCheck();
      if (!skipSwitchCheck) {
        return false;
      }
      // type === 'now' ? doSendNow() : doCronSend(normalParam?.time, normalParam?.timeZone, normalParam?.sendTimeCountry, kv, mode);

      setCronSendParams({ time: normalParam?.time, timeZone: normalParam?.timeZone, sendTimeCountry: normalParam?.sendTimeCountry, kv, mode });
      showCronSendModal && setShowCronSendModal(false);
      setShowAihostingGuide(true);

      return;
    }

    if (receivers.length > filterCount) {
      const contacts = receivers.map(receiver => {
        return {
          email: receiver.contactEmail as string,
          sourceName: receiver.sourceName || '',
        };
      });
      let params: QuotaReqModel = {
        contacts,
      };

      if (type === 'normal' && normalParam) {
        params.timingSet = {
          cronTime: normalParam.time,
          cronTimeZone: normalParam.timeZone,
          sendTimeCountry: normalParam.sendTimeCountry,
        };
      }
      const quotaRes = await edmApi.getQuotaCheckCount(params);
      // GUOLVCISHUBUZUWUFAFASONG
      const { needQuota, orgQuotaEnough } = quotaRes;
      if (!orgQuotaEnough) {
        Modal.info({
          content: <span style={{ color: '#272E47', fontWeight: '500', fontSize: '16px' }}>{getIn18Text('GUOLVCISHUBUZUWUFAFASONG')}</span>,
        });
        return;
      }

      if (Number(needQuota) <= filterCount) {
        const canSubmit = await validateSubmit(true);
        if (!canSubmit) {
          return false;
        }

        const skipSwitchCheck = await checkModifySwitchCheck();
        if (!skipSwitchCheck) {
          return false;
        }

        // type === 'now' ? doSendNow() : doCronSend(normalParam?.time, normalParam?.timeZone, normalParam?.sendTimeCountry);
        setCronSendParams({ time: normalParam?.time, timeZone: normalParam?.timeZone, sendTimeCountry: normalParam?.sendTimeCountry });
        showCronSendModal && setShowCronSendModal(false);
        setShowAihostingGuide(true);
        return;
      } else {
        Modal.info({
          content: <span style={{ color: '#272E47', fontWeight: '500', fontSize: '16px' }}>{getIn18Text('GUOLVCISHUBUZUWUFAFASONG')}</span>,
        });
        return;
      }
    }
  };

  const isUploadCompleted = () => {
    return contentRef.current ? contentRef.current.getUnSuccessAttachments().length === 0 : true;
  };

  // 获取公共发信数据
  const getSendCommonParams = async (): Promise<RequestSendDraft> => {
    const taskData = await constructTaskData(false, false);
    const resp: RequestSendDraft = {
      draftId: state.draftId as string,
      sendType: 0,
      edmSource: taskData.source || undefined,
      sendSettingInfo: taskData.sendSettingInfo as SendSettingInfo,
      secondSendInfo: taskData.secondSendInfo as SecondSendInfo,
      contentEditInfo: taskData.contentEditInfo as EdmContentInfo,
      receiverInfo: taskData.receiverInfo,
      push,
      sendStrategyOn: taskData.sendStrategyOn,
      syncContact,
      syncSendEmail,
      clueBatch: Number(clueBatch),
      replyEdmEmailId: qs.replyEdmEmailId || data.replyEdmEmailId || '',
      sendDomainLimit: taskData.sendDomainLimit,
      syncContactStoreClue: taskData.syncContactStoreClue,
      // 复制相关信息
      ...(new URLSearchParams(location.href).get('rootCopyId') && {
        rootCopyId: new URLSearchParams(location.href).get('rootCopyId'),
        copyId: new URLSearchParams(location.href).get('copyId'),
      }),
    };
    return resp;
  };

  const handlePreview = (pageType: string, contentString?: string) => {
    if (!contentRef.current) return;
    edmDataTracker.track('pc_markting_edm_sendprocess_edit_preview', {
      preview_page: pageType,
    });
    const _receivers = receiverRef.current?.getReceivers();
    const receivers = cloneDeep(_receivers);
    let selectReceive: EdmSendConcatInfo[] = [];
    if (receivers?.length > 0) {
      for (let i = 0; i < receivers.length; i++) {
        if (receivers[i].variableMap) {
          selectReceive.push(receivers[i]);
          receivers.splice(i, 1);
          i--;
        }
        if (selectReceive.length >= 2) {
          break;
        }
      }
    }
    selectReceive.length < 2 && (selectReceive = selectReceive.concat(receivers.slice(0, 2 - selectReceive.length)));
    const editor = contentRef.current?.getEditor();
    const formSetting = settingRef.current?.getValues() || {};
    const attachmentList = contentRef.current.getAttachmentList();
    const html = editor.__getPreviewHtml__ ? editor.__getPreviewHtml__(editor) : editor.getContent();
    const attachments = prepareAttachmentsForSend(attachmentList);
    let headerHolderImg = '';
    if (isCopyHeader) {
      headerHolderImg = renderToString(<ReplyHeaderHolder style={{ width: '100%', marginTop: '20px' }} />);
    }
    let title = '';
    if (formSetting?.emailSubjects?.length) {
      title = `<h1 style="font-size: 16px; padding: 30px 0 20px; font-weight:500; margin:0">${formSetting?.emailSubjects?.[0]?.subject}</h1>`;
      title = title.replace(/(\#\{)([^}]+)(\})/g, '<span class="mce-lx-var">$1$2$3</span>');
    }
    // 变量预览动画
    let style =
      '<style>.mce-lx-var{animation: varbgpre 1.5s linear 1 0s;}@keyframes varbgpre {0% {background: #D6E6FC;}80% {background: #D6E6FC;}100% {background: transparent;}}</style>';
    const content = `${style}${title}${html}${attachments}${headerHolderImg}`;
    // TODO:预览替换变量的规则目前是前端模仿服务端逻辑做的，后期最好是接口实现，因为前端和服务端都去维护替换规则，并保证一致，是不现实的
    let previewContent: string[] = [content, content];
    if (selectReceive?.length > 0) {
      previewContent = previewContent.map((content, index) => {
        const receive = selectReceive[index] || selectReceive[0];
        const variableMap = receive.variableMap;
        if (variableMap) {
          for (let key in variableMap) {
            variableMap[key] && (content = content.replaceAll(`#{${key}}`, variableMap[key]));
          }
        }
        if (receive.contactName) {
          content = content.replace(/\#\{name_0\}|\#\{name_1\}|\#\{name_2\}/g, receive.contactName);
        } else {
          content = content.replaceAll('#{name_0}', '');
          content = content.replaceAll('#{name_1}', 'friend');
          if (receive.contactEmail && receive.contactEmail.indexOf('@') !== -1) {
            const emailPre = receive.contactEmail.slice(0, receive.contactEmail.indexOf('@'));
            content = content.replaceAll('#{name_2}', emailPre);
          }
        }
        receive.companyName && (content = content.replaceAll('#{company}', receive.companyName));
        return content;
      });
    }
    setPreviewContent(previewContent);
  };

  // const resetForm = () => {
  //   edmDataTracker.trackMarktingEdmResetClick();
  //   settingRef.current?.resetFields();
  // };

  const handleAddUnsubscribeText = async (lan: UnsubscribeTextLan) => {
    if (!contentRef.current) return;
    edmDataTracker.trackDraftEditAdd(DraftEditAdd.Unsubscribe);
    const editor = contentRef.current?.getEditor();
    await edmApi.refreshUnsubscribeUrl(curSenderEmail);

    editor.undoManager.transact(function () {
      const text = edmApi.handleUnsubscribeText(lan);
      contentRef.current?.insertContent(text);
    });
  };

  // TODO: 邮件评分 这个要拆出去 @hanxu
  const [scoreEmail, setScoreEmail] = useState<string | null>(null);
  const [scoreEmailFetching, setScoreEmailFetching] = useState<boolean>(false);
  const [scoreEmailSending, setScoreEmailSending] = useState<boolean>(false);
  const [emailScorePolling, setEmailScorePolling] = useState<boolean>(false);
  const [emailScoreId, setEmailScoreId] = useState<string | null>(null);
  const [emailScoreVisible, setEmailScoreVisible] = useState<boolean>(false);
  const [emailScoreStage, setEmailScoreStage] = useState<EmailScoreStage>('PRE');
  const [emailScoreLimit, setEmailScoreLimit] = useState<number>(0);
  const [emailScoreDetail, setEmailScoreDetail] = useState<any>(null);
  const emailScorePollingTimer = useRef<any>(null);
  const [emailScoreProgress, setEmailScoreProgress] = useState(-1);

  const lastEmailStage = useRef<EmailScoreStage>('PRE');

  const [push, setPush] = useLocalStorage<boolean>('edm_mail_push_setting', true);
  const [syncContact, setSyncContact] = useState<boolean>(false);
  const [syncSendEmail, setSyncSendEmail] = useLocalStorage('sync_send_email', true);

  const [cronEditing, setCronEditing] = useState<boolean>(false);
  const [cpHdAlertVisible, setCpHdAlertVisible] = useState(true);

  const scoreStageTimer = useRef<ReturnType<typeof setTimeout>>();
  const scoreStageTimerCount = useRef<number>(0);

  function getRandomTimeout() {
    return Math.floor((4 + 3 * Math.random()) * 1000);
  }

  function incressProgress() {
    if (scoreStageTimerCount.current < 2) {
      setEmailScoreProgress(++scoreStageTimerCount.current);
      scoreStageTimer.current = setTimeout(() => incressProgress(), getRandomTimeout());
    } else {
      clearTimeout(scoreStageTimer.current as unknown as number);
      scoreStageTimer.current = null as unknown as ReturnType<typeof setTimeout>;
    }
  }

  useEffect(() => {
    if (emailScoreStage === 'PRE') {
      setEmailScoreProgress(-1);
      scoreStageTimerCount.current = -1;
      clearInterval(scoreStageTimer.current as unknown as number);
      scoreStageTimer.current = null as unknown as ReturnType<typeof setTimeout>;
    }

    if (emailScoreStage === 'COMPOSE') {
      // 虚拟进度
      setEmailScoreProgress(0);
      scoreStageTimerCount.current = 0;
      incressProgress();
    }

    if (emailScoreStage === 'END') {
      if (scoreStageTimer.current) {
        // 如果当前有定时器 则直接置为4，然后结束
        clearInterval(scoreStageTimer.current as unknown as number);
        scoreStageTimer.current = null as unknown as ReturnType<typeof setTimeout>;
        setTimeout(() => {
          setEmailScoreProgress(2);
          setTimeout(() => {
            setEmailScoreProgress(3);
          }, getRandomTimeout());
        }, getRandomTimeout());
      } else {
        setEmailScoreProgress(-1);
      }
    }
  }, [emailScoreStage]);

  useEffect(() => {
    if (!!successTip) {
      getRefbySmartMarketingSite?.closeTipVisible();
      receiverRef.current?.closeStoreClueTips();
    }
  }, [successTip]);

  // TEST
  // useEffect(()=>{
  //   setTimeout(()=>{ setEmailScoreStage('COMPOSE'); }, 5000);
  // }, []);

  // 点击邮件评分
  const handleScoreClick = () => {
    edmDataTracker.track('pc_markting_edm_sendprocess_edit_ grade', {
      target: {
        1: 'second',
        2: 'third',
      }[state.currentStage],
    });

    if (emailScoreStage === 'PRE') {
      handleScoreEmailFetch();
    }
    if (emailScoreStage === 'COMPOSE' || emailScoreStage === 'END') {
      setEmailScoreVisible(true);
    }
  };

  // 注册检测邮件评分动作
  useEffect(() => {
    validatorProvider.dispatch({
      type: 'mailContentCheckAction',
      // 先回到第二步，然后打开弹窗
      payload: [
        () =>
          dispatch({
            type: 'setState',
            payload: {
              currentStage: StepsMap.ContentEditor.id,
            },
          }),
        handleScoreClick,
      ],
    });
  }, [emailScoreStage, state]);
  useEffect(() => {
    validatorProvider.dispatch({
      type: 'mailContentReCheck',
      // 先回到第二步，然后打开弹窗
      payload: [
        () => {
          setEmailScoreStage('PRE');
          handleScoreEmailFetch();
        },
        () => {
          setTimeout(handleScoreClick, 200);
        },
      ],
    });
  }, [state]);

  const handleScoreEmailFetch = () => {
    const draftId = state.draftId || (state.edmEmailId as string);

    if (!draftId) return toast.info({ content: getIn18Text('QINGXIANBAOCUNCAOGAO') });

    setScoreEmailFetching(true);

    edmApi
      .getScoreEmail({ draftId })
      .then(data => {
        setScoreEmail(data.email);
        setEmailScoreId(data.id);
        setEmailScoreLimit(data.limit || 0);
        setEmailScoreVisible(true);
      })
      .catch(error => {
        if (typeof error === 'string') {
          toast.error({ content: error });
        } else {
          toast.error({ content: error?.message || getIn18Text('WANGLUOCUOWU') });
        }

        setEmailScoreStage(lastEmailStage.current);
      })
      .finally(() => {
        setScoreEmailFetching(false);
      });
  };

  // 邮件评分
  const handleScoreEmailSend = async () => {
    const commonParams = await getSendCommonParams();

    const sendParams = {
      content: commonParams.contentEditInfo?.emailContent,
      id: emailScoreId as string,
      subject: commonParams.sendSettingInfo?.emailSubjects?.[0]?.subject,
      // templateParams: commonParams.contentEditInfo.templateParams as string,
    };

    if (!sendParams.subject) return toast.error({ content: getIn18Text('QINGTIANXIEYOUJIANZHUTI') });
    if (!sendParams.content) return toast.error({ content: getIn18Text('QINGTIANXIEYOUJIANNEIRONG') });

    setScoreEmailSending(true);
    setEmailScoreDetail(null);

    edmApi
      .sendScoreEmail(sendParams)
      .then(() => {
        setEmailScoreStage('COMPOSE');
      })
      .finally(() => {
        setScoreEmailSending(false);
      });
  };

  // 邮件评分
  const handleEmailScoreDetailFetch = (id: string) => {
    setEmailScorePolling(true);

    edmApi
      .getEmailScoreDetail({ id })
      .then(data => {
        const { edmMarkInfo, emailMarkResult } = data;

        // 邮件评分完成
        if (edmMarkInfo.stage === 'END') {
          setEmailScoreStage('END');
          setEmailScoreDetail(
            emailScoreConverter(emailMarkResult, result =>
              validatorProvider.dispatch({
                type: 'emailContentCheck',
                payload: result,
              })
            )
          );
        }
      })
      .finally(() => {
        setEmailScorePolling(false);
      });
  };

  const handleCronEditSave = async () => {
    const canSubmit = await validateSubmit(true);
    if (!canSubmit) {
      return false;
    }
    if (!isUploadCompleted()) {
      toast.error({ content: getIn18Text('FUJIANSHANGCHUANWEIWANCHENG\uFF0CQINGDENGDAISHANGCHUANWANCHENGHUOSHANCHU') });
      return false;
    }
    const { contentEditInfo, sendSettingInfo } = await getSendCommonParams();

    let receiverInfo = {
      cronTime: sendSettingInfo.sendTime,
      cronTimeZone: sendSettingInfo.sendTimeZone,
    };
    if (!guardString(sendSettingInfo.sendTimeZone)) {
      receiverInfo = {
        cronLocalTime: sendSettingInfo.sendTime,
      };
    }
    delete sendSettingInfo.sendTime;
    delete sendSettingInfo.sendTimeZone;

    setCronEditing(true);
    if ((isCronEditWithOneTab || isCronEditWithTwoTab) && !contentRef.current) {
      contentEditInfo.emailContent = data.contentEditInfo.emailContent || '';
    }

    return edmApi
      .cronEdit({
        contentEditInfo,
        sendSettingInfo,
        receiverInfo,
        edmEmailId: state.edmEmailId,
        push,
      })
      .then(
        () => {
          toast.success({ content: getIn18Text('DINGSHIRENWUXIUGAICHENGGONG') });
          backToSource();
        },
        res => {
          if (res.code === 100) {
            Alert.error({
              className: style.receiverAlert,
              width: 400,
              centered: true,
              title: getIn18Text('FAXINLIANGXIANE'),
              content: (
                <>
                  {getIn18Text('FAXINLIANGXIANE\uFF0CQINGSHANJIANHUOBAOCUNHOU')} <WaimaoCustomerService style={{ color: '#5383FE' }} />
                </>
              ),
              okText: getIn18Text('ZHIDAOLE'),
            });
            edmDataTracker.trackSendResult('timing', {
              result: 'limit',
            });
          } else {
            onHttpError(res);
          }
        }
      )
      .finally(() => {
        setCronEditing(false);
      });
  };

  useEffect(() => {
    if (emailScoreStage === 'COMPOSE' && emailScoreId) {
      emailScorePollingTimer.current = setInterval(() => {
        if (!emailScorePolling) {
          handleEmailScoreDetailFetch(emailScoreId as string);
        }
      }, 2000);

      return () => clearInterval(emailScorePollingTimer.current);
    }

    return () => {};
  }, [emailScoreStage, emailScoreId]);

  useEffect(() => {
    return () => {
      lastEmailStage.current = emailScoreStage;
    };
  }, [emailScoreStage]);

  // 话术库相关---------------
  // 控制话术库抽屉的visible
  const [, setEdmTemplateOuterDrawerVisible] = useState2SalesPitchReduxMock('edmTemplateOuterDrawerVisible');
  // 跟单话术库，点击使用
  const [edmTemplateSalesPitch, setEdmTemplateSalesPitch] = useState2SalesPitchReduxMock('edmTemplateSalesPitch');

  // 如果点击的话术库变化，则插入新的话术库
  useEffect(() => {
    if (edmTemplateSalesPitch && edmTemplateSalesPitch.discourseContent) {
      // 插入话术内容
      contentRef.current?.insertContent(edmTemplateSalesPitch.discourseContent || '');
      // 1秒后清除
      setTimeout(() => {
        setEdmTemplateSalesPitch(null);
      }, 1000);
    }
  }, [edmTemplateSalesPitch?.discourseContent]);
  // 话术库相关---------------

  const isFirst = steps.findIndex(item => item.id === state.currentStage) === 0;

  // state.currentStage
  const isLast = steps.findIndex(item => item.id === state.currentStage) >= steps.length - 1;

  const WrapButton = props => {
    if (!state.canSend) {
      return <Tooltip title={getIn18Text('FASONGQIANQINGWANCHENGLIANXIRENDEZHIGUOLV')}>{props.children}</Tooltip>;
    }
    return props.children;
  };
  // 不保存草稿回调
  const notSave = async () => {
    if (state.draftId) {
      try {
        await edmApi.notSaveDraft(state.draftId);
      } catch (err) {
        message.error('删除草稿失败，请稍后重试！');
        return;
      }
    }
    props.back && props.back();
    // backToSource();
    setShowSaveConfirm(false);
  };

  const backToSource = () => {
    const backString = new URLSearchParams(location.href).get('back');
    if (backString && backString.length > 0) {
      const back = safeDecodeURIComponent(backString);
      setTimeout(() => {
        location.hash = back;
      }, 300);
    }
    props.back && props.back();
  };

  const [userGuideState, userGuideDispatch] = useReducer(userGuideReducer, { currentStep: -1, shouldShow: false, hasOperate: false, guideState: 'unknow' });
  // const shouldShowUserGuide = !qs?.id && !qs?.edmEmailId && !qs?.key;

  const isShowScore = (step: StepValueModel) => {
    return steps[steps.length - 1].value === step || (step === 'ContentEditor' && steps[steps.length - 1].value !== 'ContentEditor');
  };

  const getReceivers = () => {
    return receiverRef.current?.getReceivers() || data.receiverInfo.contactInfoList;
  };

  const isShowPreview = (step: StepValueModel) => {
    return [steps[1]?.value, steps[2]?.value].includes(step) || (step === 'ContentEditor' && steps[0]?.value === 'ContentEditor');
  };

  const canSendNowTask = () => {
    if (state.sendCapacity) {
      return (receiverRef.current?.getReceivers() || []).length <= state.sendCapacity.availableSendCount;
    }
    return true;
  };

  const sendSettingComp = () => {
    return (
      <SendSetting
        qs={props.qs}
        channel={channel}
        visible={state.currentStage === 0}
        ref={settingRef}
        initValues={data.sendSettingInfo}
        ccReceiversVisible
        isCronEdit={isCronEditWithTwoTab || isCronEditWithOneTab}
        sendPush={(isIm: boolean) => {
          setPush(isIm);
        }}
        // 智能营销助手
        smartMarketingVisible={smartMarketingSite === 'SendSetting'}
        baseSecondSendInfo={curBaseSendInfo as BaseSendInfo}
        needSystemRecommend={needSystemRecommend}
        mailContent={qs.cphd === '1' ? '' : contentRef?.current?.getContentWithAttachment()}
        mailTextContent={contentRef?.current?.getText() || ''}
        astrictCountVal={data.sendDomainLimit}
        smartSendOn={data.sendStrategyOn}
        receivers={getReceivers()}
        setUseContentAssistant={setUseContentAssistant}
        onSubjectChange={() => {
          if (stepsInfo.steps[stepsInfo.steps.length - 1] === 'SendSetting') {
            handleSave(true, false);
          }
        }}
        handleReMarkingSwitchChange={checked => {
          if (checked) {
            validBasicInfo();
          }
        }}
        onSenderEmailChange={() => {
          if (stepsInfo.steps[stepsInfo.steps.length - 1] === 'SendSetting') {
            handleSave(true, false);
          }
        }}
        renderStartTime={renderStartTimeRef.current}
        containerScroll={() => {
          if (containerRef.current) {
            containerRef.current.scrollTo({
              top: 5000,
            });
          }
        }}
      />
    );
  };

  const renderNoWorredTips = () => {
    if (state.currentStage === StepsMap.ContentEditor.id) {
      return null;
    }
    return <NoWorriedTips />;
  };

  const alertNotifyComp = () => {
    return state.currentStage === 1 && isCopyHeader && cpHdAlertVisible && isEditorWriting() ? (
      <AlertTip
        className={classnames([style.emailTip])}
        message={getIn18Text(
          'BENCIRENWUSUOYINYONGDENEIRONGHUOXINTOU\uFF0CFASONGHOUHUIMORENXIANSHIZAIFAJIANNEIRONGXIAFANG\uFF0CDANGQIANYOUJIANNEIRONGBIANJISHIBUXIANSHI\u3002'
        )}
        type="warning"
        showIcon
        closable
        onClose={() => setCpHdAlertVisible(false)}
      />
    ) : null;
  };

  // 步骤组件
  const stepTabComp = () => {
    // 整理数据传入通用步骤组件
    const stepConfig = steps.map((item, index) => ({
      stepNum: index + 1,
      stepDesc: item.label,
      stepType: item.value,
    }));
    if (isCronEditWithOneTab) {
      stepConfig.splice(1, 2);
    } else if (isCronEditWithTwoTab) {
      stepConfig.splice(2, 1);
    }
    const currentStep = steps.findIndex(item => item.id === state.currentStage);
    return (
      <EditProgress
        stepConfig={stepConfig}
        currentStep={currentStep + 1}
        onItemClick={item => {
          setIdByTab(item.stepNum - 1);
          if (isNotCornEdit) {
            handleSave(true, false);
          }
        }}
      />
    );
  };

  const configEmailSubject = (content: string) => {
    settingRef?.current?.configEmailSubject(content);
  };

  const contentEditorComp = () => {
    // 第一次进来, 先不要创建 ContentEditor
    if (state.currentStage === StepsMap.SendSetting.id && !contentRef.current) {
      return null;
    }
    return (
      <ContentRoot
        onUseAi={report => {
          if (report.type === 1) {
            setAiWriteResult(report);
          }
          if (report.type === 2) {
            setAiRetouchResult(report);
          }
        }}
        onTypeChange={type => {
          setWriteContentType(type);
        }}
        qs={qs}
        isCopyHeader={isCopyHeader && cpHdAlertVisible}
        setUseContentAssistant={setUseContentAssistant}
        configEmailSubject={configEmailSubject}
        emailSubject={props.qs?.emailSubject}
        visible={state.currentStage === 1}
        ref={contentRootRef}
        editorRef={contentRef}
        attachmentList={data.contentEditInfo?.attachmentList || []}
        content={data.contentEditInfo.emailContent}
        signature={data.contentEditInfo.signature}
        canShowHistoryModal={canShowHistoryModal}
        isMarketing
        contentOnChange={content => {
          // setCurrentContent(content);
        }}
        onReady={() => {
          setTimeout(() => {
            setEditorReady(true);
          }, 1000);
        }}
        salespitchActionAction={() => {
          // 点击跟单话术库
          setEdmTemplateOuterDrawerVisible(true);
        }}
      />
    );
  };

  const batchSettingComp = () => {
    if (state.currentStage === StepsMap.SendSetting.id && !receiverRef.current) {
      return null;
    }
    return (
      <div
        onClick={() => {
          userGuideDispatch({ payload: { shouldShow: false, hasOperate: true } });
        }}
      >
        <ReceiverSettingNew
          qs={props.qs}
          hasVariable={hasVariable}
          visible={state.currentStage >= 2}
          containerHeight={containerHeight}
          initData={transformSecondDataCopy(data.secondSendInfo)?.saveInfos}
          capacity={state.sendCapacity ? state.sendCapacity.availableSendCount : 1000}
          channel={channel}
          senderEmails={settingRef?.current?.getSenderEmails()}
          receivers={data.receiverInfo.contactInfoList}
          ref={receiverRef}
          saveDraft={handleSave}
          sendFilterCapacity={getFilterCapacity}
          baseSecondSendInfo={curBaseSendInfo as BaseSendInfo}
          needSystemRecommend={needSystemRecommend}
          mailContent={qs.cphd === '1' ? '' : contentRef?.current?.getContentWithAttachment()}
          mailTextContent={contentRef?.current?.getText() || ''}
          stepsInfo={stepsInfo?.receiverInfo}
          isAddContactStep={state.currentStage === StepsMap.BatchSetting.id}
          astrictCountVal={data.sendDomainLimit}
          smartSendOn={data.sendStrategyOn}
          smartMarketingVisible={smartMarketingSite === 'BatchSetting'}
          onReceiverValueChange={() => {
            setTimeout(() => {
              handleSave(true, false);
            }, 0);
          }}
        />
      </div>
    );
  };

  const renderBreadcrumb = () => {
    if (VersionSceneList.includes(prevScene) && isNotCornEdit) {
      if (isV2) {
        return '客户开发';
      }
      return '选择任务类型';
    }
    return BreadcrumbMap[prevScene] || '上一级菜单';
  };

  const headerComp = () => {
    return (
      <div className={style.hd}>
        {/* 面包屑区域 */}
        <Breadcrumb separator="">
          <Breadcrumb.Item className={style.breadCrumbItem} onClick={isNotCornEdit ? handleBack : props.back}>
            {renderBreadcrumb()}
          </Breadcrumb.Item>
          <Breadcrumb.Separator>/</Breadcrumb.Separator>
          <Breadcrumb.Item>{isNotCornEdit ? '新建单次发信任务' : getIn18Text('XIUGAIRENWU')}</Breadcrumb.Item>
        </Breadcrumb>
        <div className={style.hdRight}>
          {state.sendCapacity ? (
            <Tooltip
              overlayClassName="show-arrow"
              visible={exceedLimitTip}
              title={
                <div>
                  {getIn18Text('FAXINLIANGXIANE\uFF0CKEXIANXINGBIANJIHOUBAOCUN\uFF0CZAITONGGUO')}
                  <WaimaoCustomerService style={{ color: '#5383FE' }} />
                  {getIn18Text('RENYUANTISHENG')}
                  <a
                    style={{ marginLeft: 8, cursor: 'pointer', color: '#5383FE', float: 'right' }}
                    onClick={() => {
                      setExceedLimitTip(false);
                      isFirstShow = false;
                    }}
                  >
                    {getIn18Text('ZHIDAOLE')}
                  </a>
                </div>
              }
              placement="bottomRight"
            >
              <span className={style.hdRightAstrict}>
                今日可发 <span className={style.hdLight}>{state.sendCapacity?.availableSendCount.toLocaleString()}</span> 封， 单次限额{' '}
                <span className={style.hdLight}>{state.sendCapacity?.singleSendCount.toLocaleString()}</span> 封，
              </span>
            </Tooltip>
          ) : (
            <></>
          )}
          <span>
            AI可用 <span className={style.hdLight}>{aiTimes}</span> 次&nbsp;
            <Tooltip title="生成主题、润色主题、写信、润色共用次数">
              <ExplanationIcon style={{ marginBottom: '-3px' }} />
            </Tooltip>
          </span>
        </div>
      </div>
    );
  };

  const isEditorWriting = () => {
    return writeContentType === 'write';
  };

  const UnSubComp = () => {
    return (
      <>
        <span className={style.otherOption}>
          <MailUnsubscribeIcon />
          <Popover
            content={
              <div className={style.popBtn}>
                <span className={style.popBtnItem} onClick={() => handleAddUnsubscribeText(UnsubscribeTextLan.en)}>
                  {getIn18Text('YINGWENWENAN')}
                </span>
                <span className={style.popBtnItem} onClick={() => handleAddUnsubscribeText(UnsubscribeTextLan.zh)}>
                  {getIn18Text('ZHONGWENWENAN')}
                </span>
              </div>
            }
          >
            添加退订文案
          </Popover>
          <Tooltip title={getIn18Text('WENMOTIANJIA') + getIn18Text('TUIDINGWENAN') + getIn18Text('\uFF0CYOUZHUYUJIANGDIBEIPANWEILAJIYOUJIANDEFENGXIAN')}>
            <ExplanationIcon />
          </Tooltip>
        </span>
        <Divider type="vertical" />
      </>
    );
  };

  const footerComp = () => {
    return !successTip ? (
      <div className={style.footer}>
        {/* 收件人左侧的 请选择线索批次 */}
        {state.currentStage >= StepsMap['BatchSetting'].id && (
          <div className={style.addUnsubscribeText}>
            {syncContact && (
              <Select
                placeholder={getIn18Text('QINGXUANZEXIANSUOPICI')}
                value={clueBatchOptions.some(item => item.value === clueBatch) ? clueBatch : undefined}
                onChange={setClueBatch}
                suffixIcon={<DownTriangle />}
                dropdownClassName="edm-selector-dropdown"
              >
                {clueBatchOptions.map(({ label, value }) => (
                  <Option key={value} value={value}>
                    {label}
                  </Option>
                ))}
              </Select>
            )}
          </div>
        )}
        {/* footer 右侧的button */}
        <div
          className={style.footerOptions}
          onClick={() => {
            userGuideDispatch({ payload: { shouldShow: false, hasOperate: true } });
          }}
        >
          {/* 同步到往来邮件 + 重置 */}
          {steps.findIndex(item => item.id === state.currentStage) === 0 && (
            <>
              {/* 同步到往来邮件 */}
              {!inFFMS && (
                <span>
                  <PopoverTip
                    // shouldShow={!shouldShowUserGuide || userGuideState?.guideState === 'finish'}
                    shouldShow={true}
                    storeKey="SyncSendEmailTipVisible"
                    tips={[
                      {
                        title: getIn18Text('GOUXUANHOU\uFF0CYINGXIAOYOUJIANKETONGBUZHI [YOUXIANG-YINGXIAOFAXINXIANG]'),
                        desc: getIn18Text('DANGQIANRENWUFASONGDEYINGXIAOYOUJIANKEZAI [YOUXIANG-YINGXIAOFAXINXIANG] ZHONGCHAZHAO'),
                        img: syncSendEmailTip1,
                      },
                      {
                        title: getIn18Text('GOUXUANHOU\uFF0CZAICIYINGXIAOSHICAIZHICHI [YINYONGNEIRONG+XINTOU]'),
                        desc: getIn18Text('RUOZAICIFAJIANXUDAIRUNEIRONGHEXINTOU\uFF0CJIANYIDANGQIANRENWUGOUXUAN [TONGBUDAOWANGLAIYOUJIAN]'),
                        img: syncSendEmailTip2,
                      },
                    ]}
                  >
                    {/* <Tooltip title="同步营销邮件到 [自定义文件夹]的邮件发件箱 ，以及[客户详情页]的往来邮件和跟进动态中">
                    </Tooltip> */}
                  </PopoverTip>
                  <Checkbox checked={syncSendEmail} onChange={e => setSyncSendEmail(e.target.checked)}>
                    {getIn18Text('TONGBUDAOWANGLAIYOUJIAN')}
                  </Checkbox>
                  <PopoverSimpleTip
                    tips={[
                      {
                        title: '勾选后营销邮件可同步到 [邮箱] 模块',
                        desc: '发送后可到 [邮箱] 的 [营销发信箱] 文件夹中查看',
                        img: syncSendEmailTip1,
                        title1: '勾选后营销邮件可同步到 [客户] 模块',
                        desc1: getIn18Text('FASONGHOUKEDAO [KEHUXIANGQINGYE-WANGLAIYOUJIAN]\u3001[KEHUXIANGQINGYE-GENJINDONGTAI] ZHONGCHAKAN'),
                      },
                    ]}
                  >
                    <ExplanationIcon style={{ marginBottom: '-3px' }} />
                  </PopoverSimpleTip>
                </span>
              )}
            </>
          )}

          {state.currentStage === StepsMap['ContentEditor'].id && (
            <>
              {/* 已读回执 */}
              {!inFFMS && (
                <>
                  <Checkbox checked={emailReceipt} onChange={e => setEmailReceipt(e.target.checked)}>
                    {getIn18Text('YIDUHUIZHI')}
                  </Checkbox>
                  <Divider type="vertical" />
                </>
              )}
              {isEditorWriting() && UnSubComp()}

              {/* 邮件评分 */}
              {isShowScore('ContentEditor') && isEditorWriting() && (
                <>
                  <span className={style.otherOption} onClick={handleScoreClick}>
                    <MailScoreIcon />
                    {emailScoreStage === 'PRE' && getIn18Text('YOUJIANPINGFEN')}
                    {emailScoreStage === 'COMPOSE' && getIn18Text('JIANCEZHONG...')}
                    {emailScoreStage === 'END' && (emailScoreDetail?.score ? `邮件评分 ${emailScoreDetail?.score}分` : `邮件评分`)}
                  </span>
                  <Divider type="vertical" />
                </>
              )}
              {/* 预览 */}
              {isShowPreview('ContentEditor') && (
                <span className={style.otherOption} onClick={() => handlePreview('邮件内容')}>
                  <MailPreviewIcon />
                  {getIn18Text('XIAOGUOYULAN')}
                </span>
              )}
            </>
          )}

          {/* 试发、 定时发送 */}
          {isLast && (
            <>
              <span className={style.otherOption} onClick={handleTrySend}>
                <TrySendIcon />
                {getIn18Text('SHIFA')}
              </span>
              <Divider type="vertical" />
              <WrapButton>
                <span
                  className={style.otherOption}
                  onClick={() => {
                    if (receiverRef?.current?.getReceiverType() === 1 && !state.canSend) {
                      showReceiverModal();
                      return;
                    }
                    setShowCronSendModal(true);
                    receiverRef.current?.closeStoreClueTips();
                  }}
                >
                  <TimingSendIcon />
                  {getIn18Text('DINGSHIFASONG')}
                </span>
              </WrapButton>
            </>
          )}

          {/* 取消 */}
          <Button btnType="minorLine" onClick={isNotCornEdit ? handleBack : props.back}>
            {getIn18Text('QUXIAO')}
          </Button>

          {/* 存草稿 === 所有均展示 */}
          {isNotCornEdit && (
            <Button btnType="minorLine" onClick={handleSaveDraft}>
              {getIn18Text('CUNCAOGAO')}
            </Button>
          )}

          {/* 保存为模板 */}
          {state.currentStage === StepsMap['ContentEditor'].id && isEditorWriting() && (
            <Button
              btnType="minorLine"
              onClick={() => {
                handleSaveTemplate();
              }}
            >
              保存为模版
            </Button>
          )}

          {/* 上一步 */}
          {!isFirst && (
            <Button
              btnType="minorLine"
              onClick={() => {
                const step = state.currentStage - 1;
                commit(step > 0 ? step : 0);
                handleStepChange('prev');
              }}
            >
              {getIn18Text('SHANGYIBU')}
            </Button>
          )}

          {/* 下一步 */}
          {(isNotCornEdit ? !isLast : isCronEditWithTwoTab && state.currentStage === StepsMap['SendSetting'].id) && (
            <StartPopover placement="topRight">
              <Button
                btnType="primary"
                onClick={() => {
                  if (state.currentStage === 0) {
                    commit(1); // 新手任务第一步完成
                  } else if (state.currentStage === 1) {
                    commit(2); // 新手任务第二步完成
                  }
                  handleStepChange('next');
                }}
              >
                {getIn18Text('XIAYIBU')}
              </Button>
            </StartPopover>
          )}
          {(steps.findIndex(item => item.id === state.currentStage) === 0 && isCronEditWithOneTab) ||
          (state.currentStage === StepsMap['ContentEditor'].id && isCronEditWithTwoTab) ? (
            <Button btnType="primary" loading={cronEditing} onClick={handleCronEditSave}>
              {getIn18Text('BAOCUN')}
            </Button>
          ) : (
            <></>
          )}

          {/*  发送 */}
          {isLast && (
            <WrapButton>
              <Popover3 placement="topRight">
                <Button
                  btnType="primary"
                  onClick={() => {
                    // 如果是精准发送 且不能发送的场景时，弹出
                    if (receiverRef?.current?.getReceiverType() === 1) {
                      if (!canSendNowTask()) {
                        // 过滤次数不足
                        Modal.info({
                          content: (
                            <span style={{ color: '#272E47', fontWeight: '500', fontSize: '16px' }}>
                              {getIn18Text('FAXINLIANGXIANE\uFF0CKEXIANXINGBIANJIHOUBAOCUN\uFF0CZAITONGGUO')}
                            </span>
                          ),
                        });
                        return;
                      }
                      if (!state.canSend) {
                        showReceiverModal();
                        return;
                      }
                    }

                    doSendBefore('now');
                  }}
                  // disabled={!(state.canSend && canSendNowTask())}
                  // className={style.longBtn}
                >
                  {getIn18Text('FASONG')}
                </Button>
              </Popover3>
            </WrapButton>
          )}
        </div>
      </div>
    ) : null;
  };

  const emailScoreFuncComp = () => {
    return state.currentStage >= StepsMap['ContentEditor'].id && !emailScoreVisible ? (
      <>
        {emailScoreStage === 'COMPOSE' && (
          <div className={style.emailScorePollingEntry} onClick={() => setEmailScoreVisible(true)}>
            <img src={EmailScoreLoading} alt="loading" />
          </div>
        )}
        {emailScoreStage === 'END' && (
          <div className={style.emailScoreFinishedEntry} onClick={() => setEmailScoreVisible(true)}>
            <img src={EmailScoreFinished} alt="finished" />
          </div>
        )}
      </>
    ) : null;
  };

  const emailScoreResultComp = () => {
    return (
      <EmailScore
        visible={emailScoreVisible}
        progress={emailScoreProgress}
        stage={emailScoreStage}
        email={scoreEmail as string}
        emailFetching={scoreEmailFetching}
        limit={emailScoreLimit}
        sending={scoreEmailSending}
        detail={emailScoreDetail}
        onSend={handleScoreEmailSend}
        onRescore={() => {
          setEmailScoreStage('PRE');
          handleScoreEmailFetch();
        }}
        onCancel={() => {
          if (emailScoreStage === 'PRE' && emailScoreDetail) {
            setEmailScoreStage('END');
          }
          setEmailScoreVisible(false);
        }}
      />
    );
  };

  const imgPreviewComp = () => {
    return <PreviewContent content={previewContent} onCancel={() => setPreviewContent(['', ''])} />;
  };

  const trySendComp = () => {
    return <TrySendModal visible={showTrySendModal} onSend={doTrySend} onCancel={() => setShowTrySendModal(false)} />;
  };
  const personalTemplateAddModelComp = () => {
    return (
      <PersonalTemplateAddModal
        onSave={(templateName: string, selectedTagIds: number[]) => {
          savePersonalTemplate(templateName, selectedTagIds);
        }}
        onCancel={() => setPersonalTemplateAddModalOpen(false)}
        personalTemplateAddModalOpen={personalTemplateAddModalOpen}
      />
    );
  };
  const cronSendComp = () => {
    return (
      <CronSendModal
        onSend={(time, timeZone, sendTimeCountry, kv, mode) => {
          doSendBefore('normal', { time, timeZone, sendTimeCountry }, kv, mode);
        }}
        visible={showCronSendModal}
        receivers={handleReceiverContacts()}
        footerContent={
          <Checkbox
            checked={syncSchedule}
            onChange={event => {
              setSyncSchedule(event.target.checked);
              localStorage.setItem(SYNC_SCHEDULE_KEY, event.target.checked ? '1' : '');
            }}
          >
            {getIn18Text('TONGBURILI')}
          </Checkbox>
        }
        onCancel={() => setShowCronSendModal(false)}
      />
    );
  };

  // const successTipComp = () => {
  //   if (!successTip) {
  //     return null;
  //   }

  //   if (!isAddContactPlan) {
  //     return (
  //       <SendSuccessPage
  //         edmSubject={successTip.edmSubject}
  //         channel={channel}
  //         sendCount={successTip.sendCount}
  //         toDetailPage={toDetailPage}
  //         backToSource={backToSource}
  //         backString={new URLSearchParams(location.href).get('back') || ''}
  //         btns={[
  //           {
  //             text: '查看任务详情',
  //             type: 'primary',
  //             style: { marginRight: 12 },
  //             onclick() {
  //               toDetailPage();
  //               edmDataTracker.successPage({
  //                 click: 'detail',
  //               });
  //             },
  //           },
  //           {
  //             text: new URLSearchParams(location.href).get('back') ? '返回原页面' : '返回任务列表',
  //             type: 'minorLine',
  //             onclick() {
  //               const backString = new URLSearchParams(location.href).get('back') || '';
  //               if (guardString(backString)) {
  //                 backToSource();
  //               } else {
  //                 channel === TaskChannel.senderRotate ? navigate('#edm?page=senderRotateList') : navigate('#edm?page=index');
  //               }
  //               const trackInfo = backString ? 'back' : 'list';
  //               edmDataTracker.successPage({
  //                 click: trackInfo,
  //               });
  //             },
  //           },
  //         ]}
  //         openAiHosting={() => {}}
  //       />
  //     );
  //   }

  //   // 设置了多轮营销但是没有营销任务
  //   if (!contactPlanParams || !contactPlanParams.taskId) {
  //     return <SendSuccessWithNoTaskPage handleRedirect={handleSuccess} />;
  //   }

  //   return (
  //     <SendSuccessWithTaskPage
  //       taskSubject={contactPlanParams.planName || ''}
  //       receiveCount={receiverRef.current?.getReceivers()?.length || 0}
  //       edmSubject={successTip.edmSubject}
  //       channel={channel}
  //       sendCount={successTip.sendCount}
  //       toDetailPage={toDetailPage}
  //       backToSource={backToSource}
  //       backString={new URLSearchParams(location.href).get('back') || ''}
  //       btns={[
  //         {
  //           text: '查看单次发信任务',
  //           type: 'primary',
  //           style: { marginRight: 12 },
  //           onclick: toDetailPage,
  //         },
  //         {
  //           text: '查看营销托管任务',
  //           type: 'minorLine',
  //           style: { marginRight: 12 },
  //           onclick() {
  //             alert(123);
  //           },
  //         },
  //         {
  //           text: '返回任务列表',
  //           type: 'minorLine',
  //           onclick() {
  //             const backString = new URLSearchParams(location.href).get('back') || '';
  //             if (guardString(backString)) {
  //               backToSource();
  //             } else {
  //               channel === TaskChannel.senderRotate ? navigate('#edm?page=senderRotateList') : navigate('#edm?page=index');
  //             }
  //             const trackInfo = backString ? 'back' : 'list';
  //             edmDataTracker.successPage({
  //               click: trackInfo,
  //             });
  //           },
  //         },
  //       ]}
  //     />
  //   );
  // };

  const toDetailPage = (data?: Record<string, any>) => {
    const detailData = data || successTip;
    let hasRemarketing = detailData?.hasRemarketing ? 'true' : 'false';
    // 大发信
    if (channel === TaskChannel.senderRotate) {
      navigate(`${routerWord}?page=senderRotateList&parent=${hasRemarketing}&owner=true&detailId=${detailData?.edmEmailId}`);
    } else {
      navigate(`${routerWord}?page=index&parent=${hasRemarketing}&owner=true&detailId=${detailData?.edmEmailId}`);
    }
  };
  const loadingComp = () => {
    return loading ? (
      <div className={style.pageLoading}>
        <Spin tip={getIn18Text('ZHENGZAIJIAZAIZHONG...')} indicator={<LoadingIcon />} />
      </div>
    ) : null;
  };

  const confirmCreateAihosting: (
    options: Record<'isSingle' | 'isNow', boolean>,
    params: { groupId: string; taskId: string; planId: string; planName: string; groupName: string }
  ) => Promise<void> = async (options, params) => {
    const { isSingle, isNow } = options;
    // 执行原有send逻辑

    const addContactPlanParams = {
      taskId: params.taskId,
      planId: params.planId,
      planName: params.planName,
    };
    addContactPlanRef.current = { ...addContactPlanParams, isAddContactPlan: !isSingle };

    if (sendType === 1) {
      (await isSingle)
        ? doSendNow()
        : doSendNow({
            hostingTaskId: params.taskId,
            userGroupId: params.groupId,
            hostingPlanId: params.planId,
          });
    } else {
      doCronSend({
        ...cronSendParams,
        hostingInfo: {
          hostingTaskId: params.taskId,
          hostingPlanId: params.planId,
          userGroupId: params.groupId,
        },
      });
    }

    setShowAihostingGuide(false);
    edmDataTracker.track('pc_markting_edm_taskCreate_host', { click_type: 'confirm' });
    const trackParams: {
      send_type: string;
      host?: string;
    } = {
      send_type: isSingle ? 'single' : 'host',
    };
    if (!isSingle) {
      trackParams.host = params.taskId ? 'select' : 'create';
    }
    edmDataTracker.track('pc_markting_edm_taskCreate_host', trackParams);
  };

  const sendConfirmComp = () => {
    return (
      <SiriusModal closable={true} width={400} visible={showSaveConfirm} footer={null} onCancel={() => setShowSaveConfirm(false)}>
        <div className={style.saveConfirmHeader}>
          <WarnIcon style={{ marginRight: 8, verticalAlign: -4 }} />
          {getIn18Text('SHIFOUBAOCUNDAOCAOGAO?')}
        </div>
        <p className={style.secondConfirm}>{getIn18Text('BUBAOCUNJIANGDIUSHIGENGGAINEIRONG')}</p>
        <div className={style.secondBtns}>
          <Button btnType="minorLine" onClick={notSave}>
            {getIn18Text('BUBAOCUN')}
          </Button>
          <Button
            onClick={() => {
              setShowSaveConfirm(false);
              saveAndBack();
            }}
            btnType="primary"
            key="save"
          >
            {getIn18Text('BAOCUN')}
          </Button>
        </div>
      </SiriusModal>
    );
  };

  return (
    <ValidatorContext.Provider value={validatorProvider}>
      <div className={style.writeWrapper}>
        <div className={style.container} id="edm-write-root">
          <PermissionCheckPage
            resourceLabel="EDM"
            accessLabel="OP"
            menu="EDM_SENDBOX"
            customContent={
              <div style={{ marginTop: 12 }}>
                <Button btnType="minorLine" onClick={props.back}>
                  {getIn18Text('FANHUI')}
                </Button>
              </div>
            }
          >
            <UserGuideContext.Provider value={{ state: userGuideState, dispatch: userGuideDispatch }}>
              <edmWriteContext.Provider value={{ value: { state, dispatch } }}>
                <div className={style.writeContent}>
                  {headerComp()}
                  <div className={style.writeBody}>
                    {stepTabComp()}
                    <Skeleton className={style.writeSkeleton} loading={!state.isReady} active>
                      <div className={style.writeMain}>
                        <div
                          id="writeStepContainer"
                          onClick={() => {
                            if (settingRef) {
                              settingRef.current?.clearVariableHoverGuide();
                            }
                          }}
                          className={classnames([
                            style.stepContainer,
                            state.currentStage === StepsMap['ContentEditor'].id ? style.stepEditContainer : '',
                            isCopyHeader && cpHdAlertVisible ? style.hasTip : '',
                            state.currentStage === StepsMap['BatchSetting'].id ? style.stepBatchSetting : '',
                          ])}
                          ref={containerRef}
                        >
                          {/* 安心发提示 */}
                          {renderNoWorredTips()}
                          {alertNotifyComp()}
                          {sendSettingComp()}
                          {contentEditorComp()}
                          {batchSettingComp()}
                        </div>
                        {/* 诊断相关 */}
                        <ValidatorEntry
                          showValidator={state.currentStage === steps[steps.length - 1].id}
                          param={param}
                          sendType={(receiverRef?.current?.getReceiverType() as number) || 1}
                          handleAddSender={() => {
                            setIdByStepValue('SendSetting');
                          }}
                          handleAddSubject={() => {
                            setIdByStepValue('SendSetting');
                            settingRef?.current?.highLightAddSubject();
                          }}
                          clearBeyondLimitEmails={() => {
                            setIdByStepValue('BatchSetting');
                            receiverRef.current.showWithMode('byDomain');
                          }}
                          clearExceptionEmail={() => {
                            setIdByStepValue('BatchSetting');
                            receiverRef.current.showValidateEmail(true, true);
                          }}
                        />
                      </div>
                    </Skeleton>
                    {footerComp()}
                  </div>
                  {emailScoreFuncComp()}
                  {trySendComp()}
                  {cronSendComp()}
                  {emailScoreResultComp()}
                  {imgPreviewComp()}
                  {personalTemplateAddModalOpen && personalTemplateAddModelComp()}
                </div>
              </edmWriteContext.Provider>
            </UserGuideContext.Provider>
            {/* {successTipComp()} */}
            {sendConfirmComp()}
            {loadingComp()}
          </PermissionCheckPage>
        </div>

        <AihostingGuideModal
          visible={showAiHostingGuide}
          isNow={sendType === 1}
          onConfirm={confirmCreateAihosting}
          onCancel={() => {
            setShowAihostingGuide(false);
            edmDataTracker.track('pc_markting_edm_taskCreate_host', { click_type: 'cancel' });
          }}
        ></AihostingGuideModal>
      </div>
    </ValidatorContext.Provider>
  );
};
