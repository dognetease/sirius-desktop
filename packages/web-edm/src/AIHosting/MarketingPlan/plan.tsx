import { Button, Modal, Skeleton, Spin, message, Progress, Tabs } from 'antd';
import {
  EdmContentInfo,
  FetchHostingInfoReq,
  GPTDayLeft,
  HostingContentInfo,
  HostingContentReq,
  HostingContentResp,
  HostingInfo,
  HostingMailInfo,
  HostingPlanModel,
  HostingSendLimit,
  MailSelectType,
  Plan,
  PlanAiContents,
  SaveHostingReq,
  Words,
  BreadcrumbMap,
} from 'api';
import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import { navigate } from '@reach/router';
import { MailBasicInfo, MailBasicInterface } from './mailBasicInfo';
import style from './plan.module.scss';
import lodashGet from 'lodash/get';
import { useAppSelector } from '@web-common/state/createStore';
import { MultiVersionImplInterface } from './multiVersion';
import { apiHolder, apis, EdmSendBoxApi, MailSignatureApi } from 'api';
// import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
// import SiriusModal from '@web-common/components/UI/SiriusModal';
import SiriusModal from '@lingxi-common-component/sirius-ui/SiriusModal';
import gif from '@/images/icons/edm/yingxiao/load-more.gif';
import aiIcon from '@/images/icons/edm/yingxiao/hosting-mail-ai-icon.svg';

import cloneDeep from 'lodash/cloneDeep';
import noDataPng from '@/images/icons/edm/yingxiao/noData.png';
import { BasicInput } from '../../AIHosting/AiHostingEdit';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import debounce from 'lodash/debounce';
import { addSignTdAfterContent } from '../../send/utils/pickFullWords';
import { FlowStep } from '../../AIHosting';
import { edmDataTracker } from '../../tracker/tracker';
import { buildBasicInputBy, combineMailinfoAndAiModify, uploadToNos } from './utils';
import { getIn18Text } from 'api';
import { LoadingIcon } from './planHelper';
import { MarketingAIInfoModal } from '../../AIHosting/MarketingAIInfoModal/marketingAIInfoModal';
import { guardString } from '../../utils';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const signatureApi = apiHolder.api.requireLogicalApi(apis.mailSignatureImplApi) as MailSignatureApi;

export enum TaskType {
  normal = 'normal',
  dataMining = 'dataMining',
}

const padding = 20;
export interface Props {
  input?: BasicInput;
  operateType?: number; //0-新建、1-重建、2-新增计划、3-修改计划
  plans?: HostingPlanModel[];
  planId?: string;
  taskId?: string;
  onCreateSuccess: (taskId: string, addContact: boolean, needPlanId?: boolean, planInfo?: { planId: string; toDetailPage?: boolean; isAutoPlan?: boolean }) => void;
  hasReceiversData?: boolean;
  type?: TaskType;
  sendFlow?: boolean;
}

export interface PlanStrategy {
  title?: string;
}

export interface MarketingPlans {
  title?: string;
  cycleMarketingOn?: boolean; // 开启循环营销
  plans?: Array<Plan>;
}

export interface MarketingPlanInterface {
  onSaveClick: () => void;
  refresh: () => void;
}

export const MarketingPlan = React.forwardRef<MarketingPlanInterface, Props>((props: Props, ref) => {
  const { planId, operateType = 0, taskId = undefined, onCreateSuccess, hasReceiversData, type = TaskType.normal } = props;
  const aiHostingInitObj = useAppSelector(state => state.aiWriteMailReducer.aiHostingInitObj);
  const [data, setData] = useState<SaveHostingReq>({ hostingInfo: {} } as SaveHostingReq);

  const [innerPlan, setInnerPlan] = useState<HostingPlanModel | undefined>(props.plans![0]);
  const [innerInput, setInnerInput] = useState<BasicInput | undefined>(props.input);
  const [showAiWriteMail, setShowAiWriteMail] = useState(false);

  const [status, setStatus] = useState<'inStart' | 'inProgress' | 'complete' | 'netError'>('inStart');
  const [percent, _setPercent] = useState<number>(0);
  const [quota, setQuota] = useState<GPTDayLeft>();

  const timer = useRef<null | NodeJS.Timeout | number>(null);

  const basicInfoRef = useRef<MailBasicInterface>();
  const multiVersionRef = useRef<MultiVersionImplInterface>();
  const percentRef = useRef<number>(0);
  const [loading, setLoading] = useState(false);

  const [loadingHost, setLoadingHost] = useState<HostingInfo>();
  const [maxWidth, setMaxWidth] = useState(0);

  const [useAiType, setUseAiType] = useState('');

  let isDataMiningMode = type === TaskType.dataMining || data.planMode === 1;

  useImperativeHandle(ref, () => ({
    onSaveClick: () => {
      if (isCreate()) {
        onUserCreate();
      }
      if (isModify()) {
        onUserModify();
      }
    },
    refresh: () => fetchTaskInfo(),
  }));

  const fetchSendLimit = async () => {
    let defaultConf: HostingSendLimit = {
      autoSendLimit: 300,
      manualSendLimit: 500,
    };
    if (!taskId) {
      return defaultConf;
    }
    try {
      let req = {
        taskId: taskId,
      };
      let limit = await edmApi.fetchSendLimit(req);
      return limit;
    } catch (e) {
      return defaultConf;
    }
  };

  const constructData = (info: HostingContentResp) => {
    let hostingInfo = constructHostingData(info);
    let req: SaveHostingReq = {
      ...data,

      taskId: taskId,
      name: innerInput?.name,
      sender: innerInput?.setting?.sender,
      senderEmail: innerInput?.senderEmail,
      senderEmails: innerInput?.senderEmails,
      company: innerInput?.req?.company,
      industry: innerInput?.req?.industry,
      companyIntro: innerInput?.req?.companyIntro,
      productIntros: innerInput?.req?.productIntros,

      hostingInfo: hostingInfo,
      language: innerInput?.req?.language,

      ruleInfo: innerInput?.ruleInfo,
    };
    setData(req);
  };

  const constructHostingData = (info: HostingContentResp): HostingInfo => {
    let item = info.planAiContents![0];

    let serverMailInfos = new Array<HostingMailInfo>();
    // 第一轮先把基础信构建好
    item?.aiContentInfos?.forEach(innerItem => {
      if (innerItem.mailType === 1) {
        return;
      }
      let mailInfo: HostingMailInfo = {
        contentEditInfo: { ...innerItem },
      };
      let t = combineMailinfoAndAiModify(mailInfo, innerInput, undefined);
      t.roundIndex = innerItem.round;
      t.mailType = 0;
      serverMailInfos.push(t);
    });
    // 第二轮 构建拓展信
    item?.aiContentInfos?.forEach(innerItem => {
      if (innerItem.mailType === 0) {
        return;
      }
      let mailInfo: HostingMailInfo = {
        contentEditInfo: { ...innerItem },
      };
      let t = combineMailinfoAndAiModify(mailInfo, innerInput, undefined);
      t.roundIndex = innerItem.round;
      t.mailType = 1;
      serverMailInfos.push(t);
    });

    if (item) {
      item.planInfo = innerPlan;
    }

    if (isDataMiningMode && item?.planInfo) {
      let location = lodashGet(innerInput, 'autoRecInfo.customerLocation', []);
      if (Array.isArray(location)) {
        location = location
          .filter((item: string[]) => item.length > 0)
          // 兜底如果国家中文没获取到的话这里只有英文即[英文]（正常是[中文, 英文]）
          .map((item: string[]) => (item.length > 1 ? item[1] : item[0]))
          .join(',');
      }
      item.planInfo.autoRecInfo = {
        ...innerInput?.autoRecInfo,
        customerLocation: location,
      };
    }

    let oriMailInfos = data.hostingInfo?.mailInfos || [];
    let finalMails = new Array<HostingMailInfo>();

    oriMailInfos.forEach(oriMail => {
      let found = false;

      let mainEmail: HostingMailInfo = {};
      serverMailInfos.forEach(serverMail => {
        if (oriMail.roundIndex === serverMail.roundIndex && serverMail.mailType === 0) {
          mainEmail = serverMail;
          found = true;
        }
      });
      if (!found) {
        mainEmail = oriMail;
      }

      // 如果有拓展
      let expandFound = false;
      let expandEmail: HostingMailInfo = {};
      if ((oriMail.expandHostingMailInfos?.length || 0) > 0) {
        serverMailInfos.forEach(serverMail => {
          if (oriMail.roundIndex === serverMail.roundIndex && serverMail.mailType === 1) {
            expandEmail = serverMail;
            expandFound = true;
          }
        });
        if (!expandFound) {
          expandEmail = oriMail.expandHostingMailInfos![0];
        }
        mainEmail.expandHostingMailInfos = [expandEmail];
      }

      finalMails.push(mainEmail);
    });

    let hostingInfo: HostingInfo = {
      planInfo: item?.planInfo,
      mailInfos: finalMails,
      syncSendEmail: true,
    };
    return hostingInfo;
  };

  const setPercent = (v: number) => {
    _setPercent(v);
  };
  const resetPercent = (percent: number) => {
    setPercent(percent);
    percentRef.current = percent;
  };

  useEffect(() => {
    // 监听
    window.addEventListener('resize', forceUpdate);
    // 销毁
    return () => window.removeEventListener('resize', forceUpdate);
  }, []);

  const forceUpdate = debounce(() => {
    update();
  }, 100);

  const isCreate = (): boolean => {
    return operateType === 0 || operateType === 2;
  };
  const isModify = (): boolean => {
    return operateType === 1 || operateType === 3;
  };

  const update = () => {
    const elementWidth = document.getElementById('hosting_plan_root_view')?.getBoundingClientRect().width || 0;
    setMaxWidth(Math.min(elementWidth, 1280) - 2 * padding);
  };

  const fetchEmailFromNos = async (mail: HostingMailInfo) => {
    console.log('hanxu- fetchEmailFromNos');

    let nosId = mail.contentEditInfo?.originalEmailContentId;
    if (!nosId) {
      return;
    }
    let mailInfo = await edmApi.getEmailContent({ emailContentId: nosId });
    if (mail.contentEditInfo) {
      mail.contentEditInfo.emailContent = mailInfo.emailContent;
    } else {
      mail.contentEditInfo = mailInfo;
    }
    if (!mail.multipleContentInfo?.emailContentId || mail.multipleContentInfo?.emailContentId.length === 0) {
      mail.multipleContentInfo = undefined;
    }
    if (!mail.contentEditInfo.subject || mail.contentEditInfo.subject.length === 0) {
      mail.contentEditInfo.subject = lodashGet(mail, 'sendSettingInfo.emailSubjects.0.subject');
    }
  };

  const fetchTaskInfo = async () => {
    setLoading(true);
    if (!taskId) {
      return;
    }
    let req: FetchHostingInfoReq = {
      taskId: taskId,
      planId: planId,
    };
    let resp: SaveHostingReq;
    try {
      resp = await edmApi.fetchHostingInfo(req);
    } catch (err: any) {
      message.error(err?.message || '获取营销托管任务信息出错');
      return;
    }
    resp.hostingInfo = resp.multiHostingInfos && resp.multiHostingInfos[0];
    let item = resp.hostingInfo;
    let index = 0;
    for (let mail of item?.mailInfos || []) {
      index += 1;
      mail.roundIndex = index;
      await fetchEmailFromNos(mail);
      if (mail.expandHostingMailInfos && mail.expandHostingMailInfos.length > 0) {
        let tempMail = mail.expandHostingMailInfos[0];
        tempMail.roundIndex = index;
        await fetchEmailFromNos(tempMail);
      }
    }

    if (!innerInput) {
      let input = buildBasicInputBy(resp);
      setInnerInput(input);
    }

    let plans = resp.hostingInfo?.planInfo;

    setInnerPlan(plans as HostingPlanModel);

    setData(resp);
    onFinish();
  };

  const [refreshKey, setRefreshKey] = useState(false);
  const refresh = () => {
    setRefreshKey(!refreshKey);
  };

  const constructInitData = () => {
    let plan = innerPlan;

    const getDefault = (index: number) => {
      let temp = {
        index: index,
        content: '',
        subject: '',
        mailType: 0,
        round: index + 1,
      };
      return temp;
    };

    let contentInfos: Array<HostingContentInfo & Partial<EdmContentInfo>> = [];
    let mailInfos: HostingMailInfo[] = [];

    plan?.mailInfos.forEach((i, index) => {
      let d = getDefault(index);
      let info: HostingMailInfo = {
        contentEditInfo: d,
        roundIndex: d.round,
        mailType: d.mailType,
      };
      mailInfos.push(info);
      contentInfos.push(d);

      if (i.expandMailInfos && i.expandMailInfos.length > 0) {
        let d2 = getDefault(index);
        d2.mailType = 1;
        let info2: HostingMailInfo = {
          contentEditInfo: d2,
          roundIndex: d2.round,
          mailType: d2.mailType,
        };
        info.expandHostingMailInfos = [info2];
        contentInfos.push(d2);
      }
    });

    if (data.hostingInfo) {
      data.hostingInfo.mailInfos = mailInfos;
    }

    let aiContent: PlanAiContents = {
      planInfo: plan,
      aiContentInfos: contentInfos,
    };
    constructData({
      finishState: 1,
      planAiContents: [aiContent],
    });

    onFinish();
    // refresh();
  };

  useEffect(() => {
    if (operateType === 0 || operateType === 2) {
      if (innerInput && innerPlan) {
        constructInitData();
      } else {
        console.log('has no input or plans');
      }
    }
    if (operateType === 1 || operateType === 3) {
      fetchTaskInfo();
    }
  }, []);

  useEffect(() => {
    if ((data.hostingInfo?.mailInfos?.length || 0) > 0) {
      onFinish();
    }
  }, [data]);

  useEffect(() => {
    return () => {
      clearTimer();
      timer.current = -1 as unknown as NodeJS.Timeout;
    };
  }, []);

  const fetchQuota = async () => {
    const quota = (await edmApi.getGPTQuota()) as GPTDayLeft;
    setQuota(quota);
    return quota;
  };

  const serverReGeneralMailContent = (isFirst: boolean, repeatCount: number, aiTaskId?: string) => {
    timer.current = setTimeout(() => {
      reGeneralMailContent(isFirst, repeatCount, aiTaskId);
    }, 10000);
  };

  const clearTimer = () => {
    timer.current && clearTimeout(Number(timer.current));
  };

  const onFinish = () => {
    setLoadingHost(undefined);
    setLoading(false);
    fetchQuota();
    setStatus('complete');
    forceUpdate();
    setPercent(100);
  };

  const getUnsubscribeText = async (senderEmail: string) => {
    await edmApi.refreshUnsubscribeUrl(senderEmail);
    return edmApi.handleUnsubscribeText('en');
  };

  const reGeneralMailContent = async (isFirst: boolean, repeatCount: number, aiTaskId?: string) => {
    multiVersionRef.current?.clearData();
    setStatus('inProgress');
    const tempReq = cloneDeep(innerInput?.req) || ({} as HostingContentReq);
    tempReq.sender = innerInput?.setting?.sender;
    tempReq.aiTaskId = aiTaskId;
    tempReq.first = isFirst;
    tempReq.senderEmail = innerInput?.senderEmail;
    tempReq.senderEmails = innerInput?.senderEmails;
    let mailSelects: MailSelectType[] = [];
    if ((innerInput?.req?.planInfos?.length || 0) > 0) {
      mailSelects = innerInput!.req!.planInfos![0].mailSelects || [];
    }
    tempReq.planInfos = [{ planId: innerPlan?.planId, emailSize: innerPlan?.mailInfos.length, mailSelects: mailSelects }];

    timer.current = null;

    try {
      let resp = await edmApi.generalHostingContent(tempReq);
      clearTimer();

      if (resp.finishState === 0 && timer.current !== -1) {
        serverReGeneralMailContent(false, repeatCount, resp.aiTaskId);
        percentRef.current = percentRef.current + Math.round(Math.random() * (3 - 1) + 1);
        if (percentRef.current < 100) {
          setPercent(percentRef.current);
        }
      }
      if (resp.finishState === 1 && resp.planAiContents) {
        resp.planAiContents[0]?.aiContentInfos?.sort((a, b) => {
          return (a.index || 0) - (b.index || 0);
        });
        // 添加签名和退订文案
        let signHtml = '';
        try {
          const res = await signatureApi.doGetSignList({});
          if (res?.success && res.data) {
            const sign = res.data.find(sign => sign.signInfoDTO.defaultItem.compose);
            if (sign) {
              signHtml = `<div class="mail-signature">${sign.divContent}</div>`;
            }
          }
        } catch (err) {}
        const text = await getUnsubscribeText(tempReq?.senderEmail || '');
        resp.planAiContents[0]?.aiContentInfos?.forEach(item => {
          item.emailContent = addSignTdAfterContent(item.content || '', signHtml, text); // 服务端字段跟客户端字段名字不一样, 重新赋值一下
        });

        constructData(resp);
        onFinish();
      }
      if (resp.finishState === 2) {
        setStatus('netError');
      }
    } catch (err: any) {
      console.log('hanxu_+', err);
      clearTimer();
      if (!aiTaskId) {
        err && err.message && message.error(err?.message);
        return;
      }
      if (repeatCount > 0) {
        reGeneralMailContent(false, --repeatCount, aiTaskId);
      } else {
        setStatus('netError');
        err && err.message && message.error(err?.message);
      }
    }
  };

  const uploadAllBasicMailInfoToNos = async (data: SaveHostingReq, deleteSource?: boolean) => {
    try {
      await uploadToNos(data, deleteSource);
    } catch {
      message.error(getIn18Text('CHUANGJIANSHIBAI，QINGSHAO'));
      setLoading(false);
    }
  };

  const validateQuery = async () => {
    try {
      const quota = await fetchQuota();
      if (!quota || quota.dayLeft <= 0) {
        toast.error({ content: getIn18Text('JINRIKEYONGCISHUBU') });
        return false;
      }
    } catch (e) {
      return false;
    }
    return true;
  };

  const getTrackSource = () => {
    let trackName = '';
    if (operateType === 0) {
      trackName = 'create';
    }
    if (operateType === 1 || operateType === 3) {
      trackName = 'editStrategy';
    }
    if (operateType === 2) {
      trackName = 'addStrategy';
    }
    return trackName;
  };

  const startAIWriteMail = (input: BasicInput) => {
    if (innerInput) {
      if (!innerInput.req) {
        innerInput.req = { first: true };
      }
      innerInput.req.productIntros = input.req?.productIntros;
      innerInput.req.industry = input.req?.industry;
      innerInput.req.companyIntro = input.req?.companyIntro;
      innerInput.req.company = input.req?.company;
      innerInput.req.language = input.req?.language;
      if ((input.req?.planInfos?.length || 0) > 0) {
        let mailSelects = input.req!.planInfos![0].mailSelects;
        innerInput.req.planInfos = [{ mailSelects: mailSelects }];
      } else {
        innerInput.req.planInfos = undefined;
      }
      aiGeneralContent(true);
    }
  };

  const aiGeneralContent = async (firstTime?: boolean) => {
    edmDataTracker.track('pc_marketing_edm_host_set', {
      editAction: 'rebuild',
      type: 'edit',
      source: getTrackSource(),
    });
    setLoading(true);
    resetPercent(0);
    const canRegeneral = await validateQuery();
    if (canRegeneral) {
      multiVersionRef.current?.clearData();
      reGeneralMailContent(true, 3, undefined);
    } else {
      setLoading(false);
    }
  };

  const BaickInfoByTypeComp = () => {
    return <div className={style.body}>{data.hostingInfo && <div>{BasicInfoComp(data.hostingInfo)}</div>}</div>;
  };

  const BasicInfoComp = (hosting: HostingInfo) => {
    return (
      <MailBasicInfo
        mailInfos={hosting}
        operationType={operateType}
        onCycleMarketingChanged={isOn => {
          edmDataTracker.track('pc_marketing_edm_host_set', {
            editAction: 'cycle',
            type: 'edit',
            source: getTrackSource(),
          });
          if (hosting.planInfo) {
            hosting.planInfo.loopStatus = isOn ? 1 : 0;
          }
        }}
        basicInput={innerInput}
        ref={basicInfoRef}
        quota={quota}
        maxWidth={maxWidth}
        handleEditorSave={handleEditorSave}
      />
    );
  };

  const onUserModify = () => {
    if (!validateInput()) {
      return;
    }
    onCreate();
  };

  const onUserCreate = () => {
    if (!validateInput()) {
      return;
    }
    if (!isDataMiningMode) {
      SiriusModal.info({
        title: getIn18Text('QINGQUERENYINGXIAOXINNEI'),
        okCancel: true,
        cancelText: getIn18Text('setting_system_switch_cancel'),
        okText: getIn18Text('QUEDING'),
        onOk(...args) {
          onCreate();
        },
        onCancel(...args) {},
        maskClosable: false,
      });
    }
    if (isDataMiningMode) {
      onCreate();
    }
  };

  const createSuccessAlert = async (taskId: string, planId: string) => {
    let limit: HostingSendLimit = {};
    if (isDataMiningMode) {
      setLoading(true);
      limit = await fetchSendLimit();
      setLoading(false);
    }
    let title = getIn18Text('CHUANGJIANCHENGGONG');
    let content = getIn18Text('ZAITIANJIALIANXIRENHOU');
    let okText = getIn18Text('TIANJIALIANXIREN');
    let cancelText = getIn18Text('ZANBUTIANJIA');

    let needPlanId = false;
    // 营销托管入口进入且非完全新建
    const notEnterNew = aiHostingInitObj?.type && aiHostingInitObj?.type !== 'new';
    const isBigData = aiHostingInitObj?.handleType === 'bigData';
    const isAutomatic = aiHostingInitObj?.type === 'automatic';
    const isAiRecommend = isAutomatic && aiHostingInitObj?.ruleId;
    if (notEnterNew) {
      // 全球搜大数据量场景下创建营销托管成功弹窗
      if (isBigData) {
        title = '营销托管任务创建成功！';
        content = '正在将选中的企业联系人添加至任务中';
        okText = '进入营销托管页';
        cancelText = aiHostingInitObj?.from && BreadcrumbMap[aiHostingInitObj?.from] ? `返回${BreadcrumbMap[aiHostingInitObj?.from]}` : getIn18Text('FANHUI');
        if (aiHostingInitObj?.completeCallback) {
          aiHostingInitObj?.completeCallback(planId || '', '0', '', aiHostingInitObj?.ids, true);
        }
      } else if (isAutomatic && aiHostingInitObj?.onCreateSuccess) {
        aiHostingInitObj?.onCreateSuccess({
          planId,
          product: aiHostingInitObj.product || '',
          country: aiHostingInitObj.country || '',
        });
      } else if (aiHostingInitObj?.filter) {
        onCreateSuccess && onCreateSuccess(taskId, true);
        return;
      } else {
        title = '创建成功！';
        content = `已添加${aiHostingInitObj?.contacts?.length}个联系人，将按配置的营销信自助进行多轮营销，会正常扣减邮件营销的额度`;
        okText = '知道了';
        needPlanId = true;
      }
    }

    if (isDataMiningMode) {
      content = `系统将开始进行客户挖掘，预计明天会开始进行目标客户营销`;
      okText = '知道了';
    }

    if (props.sendFlow) {
      onCreateSuccess && onCreateSuccess(taskId, !(isDataMiningMode || !aiHostingInitObj?.filter || isBigData), !!planId, { planId: planId });
      return;
    }

    const toDetailPage = !(isDataMiningMode || notEnterNew || props.sendFlow);

    SiriusModal.success({
      title,
      content: content,
      okCancel: isDataMiningMode || (notEnterNew && !isBigData) ? false : true,
      cancelText,
      okText,
      onOk(...args) {
        // 大数据量录入或者智能推荐，返回原来的页面
        // 自动获客任务、统一入口进入不需要多虑、全球搜大数据录入这三种情况下不弹出联系人弹窗
        if (isAiRecommend && aiHostingInitObj?.back) {
          navigate(aiHostingInitObj?.back).then(() => {
            onCreateSuccess &&
              onCreateSuccess(taskId, !(isDataMiningMode || !aiHostingInitObj?.filter || isBigData), needPlanId, {
                planId: planId,
                toDetailPage: toDetailPage,
                isAutoPlan: isDataMiningMode,
              });
          });
        } else {
          onCreateSuccess &&
            onCreateSuccess(taskId, !(isDataMiningMode || !aiHostingInitObj?.filter || isBigData), needPlanId, {
              planId: planId,
              toDetailPage: toDetailPage,
              isAutoPlan: isDataMiningMode,
            });
        }
      },
      onCancel(...args) {
        // 大数据量录入或者智能推荐，返回原来的页面
        if ((isBigData || isAiRecommend) && aiHostingInitObj?.back) {
          navigate(aiHostingInitObj?.back).then(() => {
            onCreateSuccess && onCreateSuccess(taskId, false);
          });
        } else {
          onCreateSuccess && onCreateSuccess(taskId, false);
        }
      },
      maskClosable: false,
    });
  };
  const modifySuccessAlert = (taskId: string) => {
    SiriusModal.success({
      title: getIn18Text('YINGXIAOXINXIUGAICHENGGONG'),
      // content: '在添加联系人后，将按配置的营销信自动进行多轮营销，会正常扣减邮件营销的额度',
      okCancel: false,
      okText: getIn18Text('ZHIDAOLE'),
      onOk(...args) {
        onCreateSuccess && onCreateSuccess(taskId, false);
      },
      maskClosable: false,
    });
  };

  const validateInput = (): boolean => {
    let pass = true;
    data.hostingInfo?.mailInfos?.forEach(i => {
      if (!i.contentEditInfo?.emailContent) {
        pass = false;
      }
    });
    if (!pass) {
      toast.error({ content: '请编辑所有邮件内容后启用' });
    }
    return pass;
  };

  const onJump = (taskId: string, planId: string) => {
    if (!!hasReceiversData) {
      onCreateSuccess && onCreateSuccess(taskId, true);
      return;
    }
    if (isCreate()) {
      createSuccessAlert(taskId, planId);
      return;
    }
    if (isModify()) {
      modifySuccessAlert(taskId);
      return;
    }
  };

  const onCreate = async () => {
    // setLoading
    setLoading(true);
    edmDataTracker.track('pc_marketing_edm_entrust_edit', {
      action: 'start',
    });

    let aiType = 'handWrite';
    if (useAiType === 'all') {
      aiType = 'aiWrite';
    }
    if (useAiType === 'part') {
      aiType = 'mix';
    }

    edmDataTracker.track('pc_marketing_edm_host_emailType', {
      type: useAiType === aiType,
    });

    let req: SaveHostingReq = cloneDeep(data);

    if (!guardString(req.taskId) && guardString(taskId)) {
      edmDataTracker.track('hosting_has_no_taskId');
      req.taskId = taskId;
    }
    if (req.hostingInfo?.planInfo) {
      req.hostingInfo.planInfo.tmplPlanId = req.hostingInfo?.planInfo?.planId;
    }

    if (req.hostingInfo?.mailInfos) {
      req.hostingInfo.mailInfos.forEach(i => {
        if (i.plan && !i.plan.aiOn) {
          i.multipleContentInfo = undefined;
        }
        i.plan = undefined;
        if (i.expandHostingMailInfos) {
          if (i.expandHostingMailInfos[0].plan && !i.expandHostingMailInfos[0].plan.aiOn) {
            i.expandHostingMailInfos[0].multipleContentInfo = undefined;
          }
          i.expandHostingMailInfos[0].plan = undefined;
        }
      });
    }

    req.operateType = operateType;
    // 方案改成了模板了. 就没有1的场景了.  @hanxu 2023.07.24
    if (operateType === 1) {
      req.operateType = 3;
    }

    // 智能推荐
    if (aiHostingInitObj?.ruleId) {
      req.relatedInfo = {
        relatedId: aiHostingInitObj.ruleId,
        bindState: 1,
      };
    }

    await uploadAllBasicMailInfoToNos(req, true);

    try {
      req.multiHostingInfos = undefined;
      const resp = await edmApi.saveHosting(req);
      setLoading(false);
      if (resp.taskId && resp.taskId.length > 0) {
        // 保存成功
        onJump(resp.taskId, resp.planId);
      } else {
        message.error(isModify() ? getIn18Text('XIUGAISHIBAI，QINGZHONG') : getIn18Text('CHUANGJIANSHIBAI，QINGZHONG'));
      }
    } catch (err: any) {
      err && err.message && message.error(err?.message);
      setLoading(false);
    }
  };

  const handleEditorSave = (info: HostingInfo) => {
    let tempData = cloneDeep(data);
    tempData.hostingInfo = info;
    setData(tempData);
  };

  const CreateLoadingComp = () => {
    return loading ? (
      <div className={style.pageLoading}>
        <Spin indicator={<LoadingIcon />} />
      </div>
    ) : null;
  };

  const LoadingComp = () => {
    let title = getIn18Text('ZHENGZAISHENGCHENGDUOLUNYING');
    if (loadingHost) {
      title = `正在重新生成${loadingHost.planInfo?.planName}...(`;
    }

    if (status === 'inProgress') {
      return (
        <div className={style.progressWrapper}>
          <img style={{ marginTop: '20px' }} src={gif} alt="" width="130" height="130" />
          <div className={style.percent}>
            {title}
            {percent}%）
          </div>
          <div className={style.info}>{getIn18Text('MEIFENGYINGXIAOXINZHENDUI')}</div>
          <Progress strokeColor="#4C6AFF" percent={percent} showInfo={false} />
        </div>
      );
    }
    if (status === 'netError') {
      return (
        <div className={style.progressWrapper}>
          <img style={{ marginTop: '20px' }} src={noDataPng} alt="" width="130" height="130" />
          <div className={style.info}>{'不好意思，使用人数太多啦，请点击重试'}</div>
          <Button
            type="primary"
            onClick={() => {
              aiGeneralContent();
            }}
          >
            {getIn18Text('ZHONG SHI')}
          </Button>
        </div>
      );
    }
    return null;
  };

  const HeaderComp = () => {
    return (
      <div className={style.header}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={style.title}>{'编辑营销信'}</span>
          <span className={style.desc}>{getIn18Text('TONGGUODUOLUNYINGXIAOJIN')}</span>
        </div>
        <div
          className={style.ai}
          onClick={() => {
            setShowAiWriteMail(true);
          }}
        >
          <img src={aiIcon} style={{ width: '16px', height: '16px' }} />
          <div className={style.title}>一键AI写信</div>
        </div>
      </div>
    );
  };

  const AiInfoModalComp = () => {
    return (
      <MarketingAIInfoModal
        initialValues={innerInput}
        plan={innerPlan}
        showMarketingAIInfoModal={showAiWriteMail}
        setShowMarketingAIInfoModal={setShowAiWriteMail}
        clickCreatedEmail={(item, type) => {
          setUseAiType(type);
          startAIWriteMail(item);
        }}
      />
    );
  };

  if (isCreate() && status === 'inStart') {
    return <Skeleton />;
  }

  return (
    <div id={'hosting_plan_root_view'} className={style.bg}>
      <div className={style.root}>
        {HeaderComp()}
        {BaickInfoByTypeComp()}
        <div>
          {LoadingComp()}
          {CreateLoadingComp()}
          {showAiWriteMail && AiInfoModalComp()}
        </div>
      </div>
    </div>
  );
});
