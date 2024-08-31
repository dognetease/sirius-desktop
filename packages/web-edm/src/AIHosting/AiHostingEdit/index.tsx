import React, { useState, useEffect, useRef, useMemo, useCallback, MouseEvent } from 'react';
import KeepAlive, { useAliveController } from 'react-activation';
import { Form, Spin, message } from 'antd';
import lodashGet from 'lodash/get';
import classnames from 'classnames';
import { navigate } from '@reach/router';
import { AiWriteMailReducer, useActions, useAppSelector } from '@web-common/state/createStore';
import {
  AccountApi,
  api,
  apis,
  HostingContentReq,
  AiHostingApi,
  HostingPlanModel,
  EdmSendBoxApi,
  GPTDayLeft,
  AutoRecInfo,
  getIn18Text,
  PrevScene,
  AiMarketingContact,
  BasicRuleInfo,
  UpdateAiBaseInfoReq,
  AiBaseInfoSenderEmails,
  BreadcrumbMap,
} from 'api';
import styles from './index.module.scss';
// import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import Breadcrumb from '@lingxi-common-component/sirius-ui/Breadcrumb';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import Modal from '@web-common/components/UI/Modal/SiriusModal'; // 暂时保留，后期统一替换
// import SiriusModal from '@web-common/components/UI/SiriusModal';
import SiriusModal from '@lingxi-common-component/sirius-ui/SiriusModal';
import { edmDataTracker } from '../../tracker/tracker';
// import SiriusRadio from '@web-common/components/UI/Radio/siriusRadio';
import SiriusRadio from '@lingxi-common-component/sirius-ui/Radio';
import { usePermissionCheck } from '@/components/UI/PrivilegeEnhance';
import { Action } from '../DataView/Header';
import EditProgress from '../../components/EditProgress/editProgress';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import AiHostingPlans from '../AiHostingPlans/index';
import MarketingBaseInfo from '../../AIHosting/MarketingBaseInfo/marketingBaseInfo';
import { MarketingPlan, MarketingPlanInterface, TaskType } from '../../AIHosting/MarketingPlan/plan';
import cloneDeep from 'lodash/cloneDeep';
import { LoadingIcon } from '../MarketingPlan/planHelper';
import { buildBasicInputBy } from '../MarketingPlan/utils';
import { useNoviceTask } from '@/components/Layout/TaskCenter/hooks/useNoviceTask';
import { TaskNoviceParams } from '../utils/utils';
// import { ReactComponent as HandbookIcon } from '@/images/icons/edm/yingxiao/handbook.svg';
import { ReactComponent as VideoIcon } from '@/images/icons/edm/video.svg';
import { useOpenHelpCenter, safeDecodeURIComponent } from '@web-common/utils/utils';

const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const aiHostingApi = api.requireLogicalApi(apis.aiHostingApiImpl) as AiHostingApi;
const edmApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const systemApi = api.getSystemApi();

export interface Setting {
  sender?: string;
  replyEmail?: string;
}
export interface BasicInput {
  req?: HostingContentReq;
  createTime?: string;
  name?: string;
  planMode?: 0 | 1; // 0手动获客 1自动获客
  senderEmail: string;
  senderEmails?: AiBaseInfoSenderEmails[];
  setting?: Setting;
  autoRecInfo?: AutoRecInfo;
  ruleInfo?: BasicRuleInfo;
}

export interface IndustryItem {
  value: string;
  label: string;
}

interface AiHostingEditProps {
  taskId?: string;
  visible: boolean;
  // 进入后初始化数据
  initState?: Action;
  resetData?: () => void;
  onBack?: () => void;
  onCancel: () => void;
  onCreateSuccess: (taskId: string, addContact: boolean, needPlanId?: boolean, planInfo?: { planId: string; toDetailPage?: boolean; isAutoPlan?: boolean }) => void;
  hasReceiversData: boolean;
  // 是否是统一发信流程
  sendFlow?: boolean;
  fromType?: string;
}

const stepConfig = [
  {
    stepNum: 1,
    stepDesc: getIn18Text('XUANZEYINGXIAORENWU'),
    stepType: 'chooseScheme',
    stepHide: false,
  },
  {
    stepNum: 2,
    stepDesc: getIn18Text('SHEZHIJICHUXINXI'),
    stepType: 'baseInfo',
    stepHide: false,
  },
  {
    stepNum: 3,
    stepDesc: '编辑营销信内容',
    stepType: 'submitConfirm',
    stepHide: false,
  },
];

const CacheKeyEdit = 'AI_HOSTING_EDIT';
const CacheKeyPlan = 'AI_HOSTING_PLAN';

// 创建营销托管流程组件
const AiHostingEdit: React.FC<AiHostingEditProps> = props => {
  const { taskId, initState, visible, resetData, onBack, onCancel, sendFlow, onCreateSuccess, hasReceiversData, fromType } = props;
  // 用户主邮箱
  const mainEmail = systemApi.getCurrentUser()?.id || '';
  // 来自无营销托管的单次发信任务创建成功页，需要在面包屑区域及返回展示不同的逻辑
  const fromSuccessWithNoTask = fromType === 'singleTask';
  // 来自无营销托管的任务选择页，需要在面包屑区域及创建成功展示不同的逻辑
  const fromSendFlowWithNoTask = fromType === 'hostTask';
  // 缓存相关方法
  const { drop, clear } = useAliveController();
  // 缓存标识
  const { updateAiHostingCache, changeAiHostingInitObj } = useActions(AiWriteMailReducer);
  const aiHostingInitObj = useAppSelector(state => state.aiWriteMailReducer.aiHostingInitObj);
  const isAutoTaskEnter = aiHostingInitObj?.type === 'automatic';
  stepConfig[0].stepHide = isAutoTaskEnter;
  // 从配置中确定初始化步骤项
  const initStepItem = stepConfig.find(item => item.stepType === initState?.type);
  // 初始进入步骤二或步骤三时按钮逻辑要改变，并且不展示步骤条
  const diffLogic = initState && ['baseInfo', 'submitConfirm'].includes(initState?.type) && !isAutoTaskEnter;
  // 进入后初始化数据要修改，这里重新赋值
  const [initOwnState, setInitOwnState] = useState<Action | undefined>(initState);
  const [initialValues, setInitialValues] = useState<BasicInput>();
  const [currentStep, setCurrentStep] = useState<number>(initStepItem?.stepNum || 1);
  const [hostingPlans, setHostingPlans] = useState<HostingPlanModel[]>([]);
  // 挖掘信息是否有修改
  const [autoBaseInfoChange, setAutoBaseInfoChange] = useState<boolean>(false);
  // 基础信息是否有修改
  const [baseInfoChange, setBaseInfoChange] = useState<boolean>(false);
  // 静态信息是否有修改（不需要提示重新生成营销信的字段）
  const [staticInfoChange, setStaticInfoChange] = useState<boolean>(false);
  // 自动获客任务基础信息修改确认弹窗
  const [autoTaskModal, setAutoTaskModal] = useState<boolean>(false);
  // 自动获客任务基础信息修改选中挖掘类型
  const [excavateType, setExcavateType] = useState<'reExcavate' | 'goExcavate'>('reExcavate');
  // 右下方确认按钮执行中
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPlans, setSelectedPlans] = useState<HostingPlanModel[]>([]);
  const [form] = Form.useForm();
  const hasEdmPermission = usePermissionCheck('VIEW', 'EDM', 'EDM_SENDBOX');
  const planRef = useRef<MarketingPlanInterface>();
  const baseInfoRef = useRef();
  const aiHostingPlansRef = useRef<string>('');
  const openHelpCenter = useOpenHelpCenter();

  const { commit, getPopoverByStep } = useNoviceTask(TaskNoviceParams);

  const PopoverNodes = useMemo(() => {
    if (currentStep === 2 || currentStep === 3) {
      return getPopoverByStep(currentStep);
    }
    return (props: any) => <>{props.children}</>;
  }, [currentStep, getPopoverByStep]);

  useEffect(() => {
    if (isAutoTaskEnter && hostingPlans.length) {
      setCurrentStep(1);
      setSelectedPlans(hostingPlans.filter(item => item.planId === '4'));
      updateAiHostingCache({ cache: false });
      clear();
    } else if (aiHostingInitObj?.type) {
      setCurrentStep(1);
      updateAiHostingCache({ cache: false });
      clear();
    }
  }, [aiHostingInitObj, hostingPlans]);

  useEffect(() => {
    // v2 版本增加了自定义方案
    fetchV2Infos();
    // 销毁前将缓存标识重置
    return () => {
      updateAiHostingCache({ cache: false });
      clear();
    };
  }, []);

  useEffect(() => {
    if (!(visible && hasEdmPermission)) {
      return;
    }
    // 获取基础信息
    getBaseInfo();
  }, [visible]);

  // 营销方案点击变化后直接进入下一步
  useEffect(() => {
    if (selectedPlans.length > 0) {
      handleNext();
    }
  }, [selectedPlans]);

  // 获取基础信息
  const getBaseInfo = async () => {
    // 大盘修改基础信息、任务详情修改基础信息和步骤三的修改基础信息，获取对应方案的基础信息回填
    if (taskId && initOwnState?.planId) {
      try {
        const res = await edmApi.fetchHostingInfo({ taskId: taskId, planId: initOwnState?.planId });
        // 接口返回senderEmails为AiBaseInfoSenderEmails[]
        let values = buildBasicInputBy(res);
        setInitialValues(values);
      } catch (err: any) {
        message.error(err?.message || '获取营销托管任务信息出错');
      }
    }
    // 如果进入第一步新建，获取上一次创建任务的基础信息回填
    // 如果没有taskId，回填部分数据
    else {
      const res = await edmApi.getLastBasicInfo({ taskId: taskId || '' });
      const userAccount = systemApi.getCurrentUser()?.id;
      const accountInfo = (await accountApi.doGetAccountInfo()) || [];
      const userInfo = accountInfo.find(item => item.id === userAccount) || accountInfo[0];
      const beforeBuildBasicInput = {
        senderEmail: userInfo.id,
        replyEmail: userInfo.loginAccount,
        sender: userInfo.nickName,
        ...res,
      };
      // 接口返回senderEmails为string[]
      if (res?.senderEmails?.length) {
        beforeBuildBasicInput.senderEmails = res.senderEmails.map(item => ({ email: item as string }));
      }
      let values = buildBasicInputBy(beforeBuildBasicInput);
      if (values?.name) {
        values.name = undefined;
      }
      // 回填智能推荐传过来的参数
      if (aiHostingInitObj?.type === 'automatic') {
        values.autoRecInfo = {
          products: aiHostingInitObj?.product,
          customerLocation: aiHostingInitObj?.country,
          customerProducts: aiHostingInitObj?.customerProducts,
        };
      }
      setInitialValues(values);
    }
  };

  const fetchV2Infos = () => {
    // v2 版本增加了自定义方案
    aiHostingApi.getAiHostingPlanV2Infos({ taskId: taskId || '' }).then(res => {
      const { hostingPlans } = res;
      if (hostingPlans && hostingPlans.length > 0) {
        setHostingPlans(hostingPlans);
      }
    });
  };

  // 埋点
  const handleTrack = (kind: string) => {
    const trackParams: {
      source: string;
      type: string;
      selectAction?: string;
      infoAction?: string;
      editAction?: string;
    } = {
      source: 'create',
      type: '',
    };
    if (initState?.type === 'chooseScheme') {
      trackParams.source = 'addStrategy';
    } else if (initState?.type === 'baseInfo') {
      trackParams.source = 'editInfo';
    } else if (initState?.type === 'submitConfirm') {
      trackParams.source = 'editStrategy';
    }
    if (currentStep === 1) {
      trackParams.type = 'strategy';
      trackParams.selectAction = kind;
    } else if (currentStep === 2) {
      trackParams.type = 'information';
      trackParams.infoAction = kind;
    } else if (currentStep === 3) {
      trackParams.type = 'edit';
      trackParams.editAction = kind;
    }
    edmDataTracker.track('pc_marketing_edm_host_set', trackParams);
  };

  // 两种入口来源是否为自动获客任务
  const isAutoPlan = () => {
    return lodashGet(selectedPlans, '0.planId', 0) === '4' || initOwnState?.planMode === 1;
  };

  const renderChooseScheme = () => {
    return (
      <AiHostingPlans
        hostingPlans={hostingPlans}
        ref={aiHostingPlansRef}
        refreshPlans={fetchV2Infos}
        handleClickPlan={setSelectedPlans}
        taskId={taskId}
        sendFlow={sendFlow}
      />
    );
  };

  // 基础信息填写组件 使用独立class方便以后拆分
  const renderBaseInfo = () => {
    return (
      // <KeepAlive cacheKey={CacheKeyEdit}>
      <MarketingBaseInfo
        form={form}
        ref={baseInfoRef}
        baseInfoChange={changedValues => {
          if (changedValues.autoRecInfo) {
            setAutoBaseInfoChange(true);
          } else if (changedValues.senderEmail || changedValues.req || changedValues.setting) {
            setBaseInfoChange(true);
          } else if (changedValues.name) {
            setStaticInfoChange(true);
          }
        }}
        initialValues={initialValues}
        sourceType={initOwnState?.type}
        isAuto={isAutoPlan()}
      />
      // </KeepAlive>
    );
  };

  const renderSubmitConfirm = () => {
    return (
      <KeepAlive cacheKey={CacheKeyPlan}>
        <MarketingPlan
          ref={planRef}
          taskId={taskId}
          sendFlow={sendFlow}
          planId={initOwnState?.planId}
          operateType={initOwnState?.operateType}
          type={isAutoPlan() ? TaskType.dataMining : TaskType.normal}
          input={cloneDeep(initialValues)}
          plans={cloneDeep(selectedPlans)}
          onCreateSuccess={onCreateSuccess}
          hasReceiversData={hasReceiversData}
        />
      </KeepAlive>
    );
  };

  // 内容渲染
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderChooseScheme();
      case 2:
        return renderBaseInfo();
      case 3:
        return renderSubmitConfirm();
      default:
        return <></>;
    }
  };

  // 确认取消，判断来源决定返回营销托管介绍页还是大盘页面还是步骤三
  const handleCancel = () => {
    if (aiHostingInitObj?.back && !sendFlow) {
      let backUrl = safeDecodeURIComponent(aiHostingInitObj.back);
      // crm以npm包的形式集成进外贸通，在桌面端navigate跳转不过去
      location.hash = backUrl;
      resetData && resetData();
      navigate(backUrl);
      clear();
    } else if (initOwnState?.type === 'submitConfirm' && currentStep === 2) {
      setInitOwnState({
        ...initOwnState,
        operateType: 3,
      });
      setCurrentStep(3);
      planRef.current?.refresh();
      // 清除第二步的缓存
      drop(CacheKeyEdit);
    } else if (initOwnState) {
      onBack && onBack();
      // 清除所有缓存
      clear();
    } else {
      onCancel();
      clear();
    }
    setBaseInfoChange(false);
    setAutoBaseInfoChange(false);
    setStaticInfoChange(false);
    changeAiHostingInitObj({});
    setSelectedPlans([]);
    setCurrentStep(1);
  };

  // 点击取消 填写或修改了信息才会有挽留确认弹窗
  const confirmCancel = () => {
    if (fromSuccessWithNoTask) {
      SiriusModal.error({
        title: '配置完成即可将回复率提升50%，是否取消？',
        content: '取消后单次任务正常发送，联系人无法加入营销托管进行多轮营销',
        onOk: handleCancel,
      });
    } else if (baseInfoChange || autoBaseInfoChange || staticInfoChange) {
      SiriusModal.error({
        title: getIn18Text('QUXIAOFANGAN'),
        content: getIn18Text('QUXIAOHOUYITIANXINXI'),
        onOk: handleCancel,
      });
    } else {
      handleCancel();
    }
    changeAiHostingInitObj({});
    handleTrack('cancel');
  };

  // 第三步回退上一步二次确认
  const beforeHandlePrev = () => {
    const currentStepItem = stepConfig.find(item => item.stepNum === currentStep);
    if (currentStepItem?.stepType === 'submitConfirm') {
      SiriusModal.error({
        title: `返回后已填写或已生成的内容不会被保存，是否继续？`,
        centered: true,
        onOk: handlePrev,
      });
    } else {
      handlePrev();
    }
  };

  // 回退上一步 二次检查
  const handlePrev = () => {
    const updateStep = currentStep - 1;
    const minStep = stepConfig[0].stepNum;
    if (updateStep >= minStep) {
      setCurrentStep(updateStep);
    }
    handleTrack('back');
  };

  // 保存填写的最新基础信息
  const saveInitialValues = () => {
    const formValue = { ...form.getFieldsValue() };
    // const filterProductIntros = lodashGet(formValue, 'req.productIntros', []).filter((item: string) => item);
    // if (formValue?.req?.productIntros) {
    //   formValue.req.productIntros = filterProductIntros;
    // }
    // if (formValue?.req?.industry) {
    //   let industry = lodashGet(formValue, 'req.industry', '');
    //   let industry2 = lodashGet(formValue, 'req.industry2', '');
    //   formValue.req.industry = industry === 'other' ? industry2 : industry;
    // }
    // 用户输入与接口返回的初始数据整合
    // ruleInfo中的两个配额数据不在表单中，无法通过表单数据取回，这里要写入
    // 选中发件地址
    const senderEmails = lodashGet(formValue, 'senderEmails', []) as AiBaseInfoSenderEmails[];
    // 选中发件地址是否包含主邮箱
    const includeMainEmail = senderEmails.some(item => item.email === mainEmail);
    // 选中发件地址的第一个别名邮箱
    const aliasEmail = senderEmails.find(item => item.accType === 1)?.email || '';
    setInitialValues({
      ...formValue,
      senderEmail: includeMainEmail ? mainEmail : aliasEmail,
      req: initialValues?.req,
      ruleInfo: {
        ...initialValues?.ruleInfo,
        ...formValue.ruleInfo,
      },
      senderEmails: senderEmails.length > 0 ? senderEmails : initialValues?.senderEmails || [{ email: mainEmail }],
    });
  };

  // 点击下一步 二次检查
  const handleNext = () => {
    const updateStep = currentStep + 1;
    const maxStep = stepConfig[stepConfig.length - 1].stepNum;
    const currentStepItem = stepConfig.find(item => item.stepNum === currentStep);
    // 第一步 选择方案校验
    if (currentStepItem?.stepType === 'chooseScheme') {
      handleTrack('next');
      if (selectedPlans.length === 0) {
        toast.warning({
          content: getIn18Text('QINGXUANZEYINGXIAOFANGAN'),
        });
        return;
      }
    }
    // 第二步 表单校验
    if (currentStepItem?.stepType === 'baseInfo') {
      // validateFields无法检测手动setFields的error
      const haveError = form.getFieldsError()?.find(item => item.errors.length > 0);
      if (haveError) {
        return;
      }
      form.validateFields().then(async () => {
        // 由于步骤三form表单隐藏导致无法直接使用form收集填入数据，这里把数据存起来
        saveInitialValues();
        if (updateStep <= maxStep) {
          // 创建流程一律清除缓存
          await clear();
          setCurrentStep(updateStep);
        }
      });
      commit(2);
      handleTrack('next');
      return;
    }
    // 特殊步骤 生成营销信
    if (updateStep === maxStep + 1) {
      planRef.current?.onSaveClick();
      handleTrack('start');
      return;
    }
    if (updateStep <= maxStep) {
      commit(3);
      setCurrentStep(updateStep);
    }
  };

  // 基础信息更新
  const updateBaseInfo = async (taskType?: string) => {
    setAutoTaskModal(false);
    setLoading(true);
    const formValue = form.getFieldsValue();
    // let industry = lodashGet(formValue, 'req.industry', '');
    // let industry2 = lodashGet(formValue, 'req.industry2', '');
    // industry = industry === 'other' ? industry2 : industry;
    const autoRecInfo = lodashGet(formValue, 'autoRecInfo', undefined);
    // 选中发件地址
    const senderEmails = lodashGet(formValue, 'senderEmails', []) as AiBaseInfoSenderEmails[];
    // 选中发件地址是否包含主邮箱
    const includeMainEmail = senderEmails.some(item => item.email === mainEmail);
    // 选中发件地址的第一个别名邮箱
    const aliasEmail = senderEmails.find(item => item.accType === 1)?.email || '';
    // 接口参数
    const params: UpdateAiBaseInfoReq = {
      planId: initOwnState?.planId || '',
      removeRecUser: excavateType === 'reExcavate',
      name: lodashGet(formValue, 'name', ''),
      autoRecInfo: autoRecInfo
        ? {
            ...autoRecInfo,
            customerLocation: lodashGet(autoRecInfo, 'customerLocation', [])
              .filter((item: string[]) => item.length > 0)
              // 兜底如果国家中文没获取到的话这里只有英文即[英文]（正常是[中文, 英文]）
              .map((item: string[]) => (item.length > 1 ? item[1] : item[0]))
              .join(','),
          }
        : autoRecInfo,
      sender: lodashGet(formValue, 'setting.sender', ''),
      replyEmail: lodashGet(formValue, 'setting.replyEmail', ''),
      taskId: initOwnState?.taskId || '',
      // 选中邮箱中有主邮箱则传主邮箱，没有则传第一个选中的别名邮箱
      senderEmail: includeMainEmail ? mainEmail : aliasEmail,
      senderEmails: lodashGet(formValue, 'senderEmails', []),
      ruleInfo: lodashGet(formValue, 'ruleInfo', ''),
    };
    const result = await edmApi.updateAiBaseInfo(params);
    setLoading(false);
    if (result === 'true') {
      saveInitialValues();
      // 20231115去掉改信提示
      // if (baseInfoChange || autoBaseInfoChange) {
      //   SiriusModal.success({
      //     title: getIn18Text('XINXIXIUGAICHENGGONG'),
      //     content: getIn18Text('SHIFOUXUYAOXIUGAIYI'),
      //     cancelText: getIn18Text('BUXIUGAI'),
      //     okText: getIn18Text('XIUGAINEIRONG'),
      //     onOk: async () => {
      //       // 是否还有次数，没有直接提示并不流转
      //       const haveTimes = await validateQuery();
      //       if (!haveTimes) {
      //         return;
      //       }
      //       await clear();
      //       setBaseInfoChange(false);
      //       setAutoBaseInfoChange(false);
      //       setStaticInfoChange(false);
      //       setInitOwnState({
      //         ...initOwnState,
      //         operateType: 1,
      //       } as Action);
      //       setCurrentStep(3);
      //     },
      //     onCancel: handleCancel,
      //   });
      // } else {
      toast.success({ content: getIn18Text('XINXIXIUGAICHENGGONG') });
      handleCancel();
      // }
    }
    if (taskType === 'auto') {
      edmDataTracker.track('pc_marketing_edm_host_set', { changeAction: excavateType });
    }
  };

  // 初始进入步骤二或步骤三时，点击保存
  const handleSave = () => {
    if (loading || !initOwnState?.taskId) {
      return;
    }
    if (currentStep === 2) {
      form.validateFields().then(async () => {
        // validateFields无法检测手动setFields的error，这里需要重复校验回复邮箱的异步校验结果
        const replyEmail = form.getFieldValue(['setting', 'replyEmail']);
        const setErrorResult = await baseInfoRef.current?.handleCheckReplyEmail(replyEmail);
        if (!setErrorResult) {
          return;
        }
        // 基础信息有修改，判断是自动获客任务还是营销托管任务，展示不同的弹窗
        if (autoBaseInfoChange && isAutoPlan()) {
          setAutoTaskModal(true);
          return;
        }
        updateBaseInfo();
      });
    } else if (currentStep === 3) {
      setLoading(false);
      planRef.current?.onSaveClick();
    }
    handleTrack('save');
  };

  const loadingComp = () => {
    return loading ? (
      <div className={styles.pageLoading}>
        <Spin tip={getIn18Text('ZHENGZAIJIAZAIZHONG...')} indicator={<LoadingIcon />} />
      </div>
    ) : null;
  };

  // 面包屑一级文案根据来源变化
  const renderLevel1Breadcrumb = () => {
    return aiHostingInitObj?.from ? BreadcrumbMap[aiHostingInitObj?.from] || '上一级页面' : getIn18Text('YINGXIAOTUOGUAN');
  };

  // 面包屑二级文案根据来源变化
  const renderLevel2Breadcrumb = () => {
    if (initStepItem && currentStep === 2) {
      return <Breadcrumb.Item>{getIn18Text('XINXISHEZHI')}</Breadcrumb.Item>;
    } else if (initStepItem && currentStep === 3) {
      return <Breadcrumb.Item>{getIn18Text('BIANJIYINGXIAO')}</Breadcrumb.Item>;
    }
    return <Breadcrumb.Item>{getIn18Text('XINJIANYINGXIAO')}</Breadcrumb.Item>;
  };

  const onKnowledgeCenterClick = (e: MouseEvent) => {
    openHelpCenter('/d/1731571876884443138.html');
    e.preventDefault();
  };

  // 自动挖掘信息修改提示modal
  const autoExcavateComp = () => (
    <Modal
      title={getIn18Text('JIANCEDAONINXIUGAILE')}
      visible={autoTaskModal}
      okText={getIn18Text('QUEREN')}
      onCancel={() => setAutoTaskModal(false)}
      onOk={() => updateBaseInfo('auto')}
    >
      <div className={styles.editModal}>
        <p className={styles.editModalTitle}>{getIn18Text('QINGXUANZE：')}</p>
        <SiriusRadio.Group onChange={e => setExcavateType(e.target.value)} value={excavateType}>
          <SiriusRadio value="reExcavate">
            <p className={styles.editModalRadio}>{getIn18Text('ZHONGXINWAJUE')}</p>
            <p className={styles.editModalDesc}>{getIn18Text('YICHUGAIRENWUYIWA')}</p>
          </SiriusRadio>
          <SiriusRadio value="goExcavate">
            <p className={styles.editModalRadio}>{getIn18Text('JIXUWAJUE')}</p>
            <p className={styles.editModalDesc}>{getIn18Text('BAOLIUGAIRENWUYIWA')}</p>
          </SiriusRadio>
        </SiriusRadio.Group>
      </div>
    </Modal>
  );

  return (
    <div className={classnames(styles.aiHostingEditWrap, systemApi.isElectron() ? {} : styles.aiHostingScroll)}>
      <div className={styles.aiHostingEdit}>
        {/* 面包屑区域 */}
        {fromSuccessWithNoTask ? (
          <span className={styles.breadcrumbText}>正在升级为多轮发信，请完成后续轮次发信设置，营销效果提升50%</span>
        ) : fromSendFlowWithNoTask ? (
          <span className={styles.breadcrumbText}>新建营销托管任务</span>
        ) : (
          <div className={styles.breadcrumbFlex}>
            <Breadcrumb separator="">
              <Breadcrumb.Item className={styles.breadcrumbItem} onClick={confirmCancel}>
                {renderLevel1Breadcrumb()}
              </Breadcrumb.Item>
              <Breadcrumb.Separator>/</Breadcrumb.Separator>
              {renderLevel2Breadcrumb()}
            </Breadcrumb>
            {currentStep === 2 && isAutoPlan() ? (
              <a target="_blank" className={styles.breadcrumbIcon} onClick={onKnowledgeCenterClick} href="">
                {/* <HandbookIcon /> */}
                <VideoIcon />
                自动获客使用指南
              </a>
            ) : (
              <></>
            )}
          </div>
        )}
        {/* 内容区域 */}
        <div className={styles.editWrapper}>
          {diffLogic ? <></> : <EditProgress stepConfig={stepConfig} currentStep={currentStep} />}
          {/* 滚动区域 */}
          <div className={styles.editContent}>{renderStepContent()}</div>
          <div className={styles.editBtns}>
            <Button btnType="minorLine" onClick={confirmCancel}>
              {getIn18Text('QUXIAO')}
            </Button>
            {currentStep > stepConfig.filter(item => !item.stepHide)[0].stepNum && !diffLogic ? (
              <Button btnType="minorLine" onClick={beforeHandlePrev}>
                {getIn18Text('SHANGYIBU')}
              </Button>
            ) : (
              <></>
            )}
            {/* 第一步不展示下一步按钮，点击方案直接进入下一步 */}
            {!diffLogic && currentStep > stepConfig[0].stepNum ? (
              <PopoverNodes placement="topRight" getPopupContainer={triggerNode => triggerNode.parentNode} zIndex={10}>
                <Button btnType="primary" onClick={handleNext}>
                  {currentStep === stepConfig[stepConfig.length - 1].stepNum ? '确认提交' : getIn18Text('XIAYIBU')}
                </Button>
              </PopoverNodes>
            ) : (
              <></>
            )}
            {diffLogic ? (
              <Button btnType="primary" onClick={handleSave}>
                {getIn18Text('BAOCUN')}
              </Button>
            ) : (
              <></>
            )}
          </div>
          {autoExcavateComp()}
        </div>
        {loadingComp()}
      </div>
    </div>
  );
};

export default AiHostingEdit;
