import React, { useEffect, useState, useReducer, useRef } from 'react';
import { Skeleton } from 'antd';
import { navigate } from '@reach/router';
import style from './marketingRoot.module.scss';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
// import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import Breadcrumb from '@lingxi-common-component/sirius-ui/Breadcrumb';
// import { BreadcrumbMap } from '../utils/utils';
import { VersionSceneList } from '../utils';
import {
  DataStoreApi,
  PrevScene,
  TaskChannel,
  apiHolder,
  apis,
  getIn18Text,
  ResponseSendDraft,
  EdmSendBoxApi,
  EdmOperationTask,
  MarketingSuggestRes,
  SendBoxConfRes,
  BreadcrumbMap,
} from 'api';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import { EdmWriteMail } from './write';
import { AiHostingWrite, AiHostingWriteInitData } from '../AIHosting/AiHostingWrite/aiHostingWrite';
import { AIHosting } from '../AIHosting';
import { edmWriteContext, writeContextReducer, EmptyContactType, IEdmWriteState } from '../send/edmWriteContext';
import { SelectTaskComponent } from './SelectTask/selectTask';
import { SendSuccessPage } from '../components/SendSuccessPage';
import { SendSuccessWithTaskPage } from '../components/SendSuccessPage/successWithTask';
import { SendSuccessWithNoTaskPage } from '../components/SendSuccessPage/successWithNoTask';
import { useActions, useAppSelector, AiWriteMailReducer } from '@web-common/state/createStore';
import { edmDataTracker } from '../tracker/tracker';
import { safeDecodeURIComponent } from '@web-common/utils/utils';

export enum MarketingType {
  SingleTask = 'SingleTask',
  NewHostingTask = 'NewHostingTask',
  AddExistHosting = 'AddExistHosting',
  PickList = 'PickList',
  SuccessPage = 'SuccessPage',
  SendSuccessPage = 'SendSuccessPage',
  SendSuccessWithTaskPage = 'SendSuccessWithTaskPage',
  SendSuccessWithNoTaskPage = 'SendSuccessWithNoTaskPage',
}

export interface Props {
  qs?: Record<string, string>;
  back?: () => any;
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const systemApi = apiHolder.api.getSystemApi();
const isEdmWeb = systemApi.isWebWmEntry();

export const MarketingRoot = (props: Props) => {
  const { changeAiHostingInitObj } = useActions(AiWriteMailReducer);
  const aiHostingInitObj = useAppSelector(state => state.aiWriteMailReducer.aiHostingInitObj);
  const [curTask, setCurTask] = useState<MarketingType>(MarketingType.PickList);
  const [successData, setSuccessData] = useState<Record<string, any>>();
  // 传入营销托管页面的来源类型，用于在营销托管中展示不同的文案和逻辑
  const [fromType, setFromType] = useState<string>('');

  const prevScene = (new URLSearchParams(location.href).get('from') as PrevScene) || 'newCreate';
  const menuVersion = useVersionCheck();
  const isV2 = menuVersion === 'v2';

  // 用于创建多轮营销任务时初始化数据
  const [planData, setPlanData] = useState<AiHostingWriteInitData>();
  // 在总页面就应该知道是否存在手动营销托管
  const [manualTask, setManualTask] = useState<boolean>(false);
  const [sendBoxConfRes, setSendBoxConfRes] = useState<SendBoxConfRes>({} as SendBoxConfRes);
  const [operationTasks, setOperationTasks] = useState<EdmOperationTask[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestData, setSuggestData] = useState<MarketingSuggestRes>({} as MarketingSuggestRes);
  const [propsQs, setPropsQs] = useState(props.qs || {});

  const [state, dispatch] = useReducer(writeContextReducer, {
    currentStage: 0,
    canSend: false,
    isReady: false,
    editorCreated: false,
    draftId: undefined,
    edmEmailId: undefined,
    emptyContactType: dataStoreApi.getSync('EmptyContactSetting').data || EmptyContactType.Email,
    templateParamsFromEditor: [] as unknown,
  } as IEdmWriteState);

  const requestSendBoxConf = async () => {
    return edmApi.getSendBoxConf({ type: 2 }).then(data => {
      return data;
    });
  };

  const requestOperationTasksResp = async () => {
    return edmApi.getOperationTasksResp().then(data => {
      return data.operationTasks;
    });
  };

  const fetchMarketingSuggest = async () => {
    const suggestData = await edmApi.getMarketingSuggest();
    return suggestData;
  };

  const requestAll = async () => {
    setLoading(true);
    Promise.all([requestSendBoxConf(), requestOperationTasksResp(), fetchMarketingSuggest()])
      .then(([sendBoxConfRes, operationTasks, suggest]) => {
        setSendBoxConfRes(sendBoxConfRes);
        setOperationTasks(operationTasks || []);
        setSuggestData(suggest);
        setLoading(false);
      })
      .finally(() => setLoading(false));
  };

  // 获取请求次数
  const fetchSendCount = () => {
    return edmApi.getSendCount().then(data => {
      dispatch({
        type: 'setState',
        payload: {
          sendCapacity: data,
        },
      });
    });
  };

  // 是否是直接跳转单次发信流程页面，返回也要返回来源页面
  const directSingleTask = () => {
    let toSingleDirect: PrevScene[] = ['copyTask', 'draft', 'template', 'taskzhenduan', 'noviceTask'];
    // 如果是模板跳转过来的，需要判断是否是v2版本
    if (prevScene.includes('template') && props.qs?.back?.includes('version=v2')) {
      return false;
    }
    if (toSingleDirect.includes(prevScene)) {
      return true;
    }
    let type = props.qs?.type;
    if (type === 'cronEdit') {
      return true;
    }
    if (props.qs?.resend) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (curTask === MarketingType.PickList) {
      requestAll();
    }
  }, [curTask]);

  useEffect(() => {
    if (directSingleTask()) {
      setCurTask(MarketingType.SingleTask);
    }
    fetchSendCount();
  }, []);

  const renderBreadcrumb = () => {
    if (VersionSceneList.includes(prevScene) && isV2) {
      return '客户开发';
    }
    return BreadcrumbMap[prevScene] || '上一级菜单';
  };

  const CrumbComp = () => {
    return (
      <div className={style.crumbArea}>
        {/* 面包屑区域 */}
        <Breadcrumb separator="">
          {curTask === MarketingType.PickList ? (
            <>
              <Breadcrumb.Item className={style.breadCrumbItem} onClick={backToSource}>
                {renderBreadcrumb()}
              </Breadcrumb.Item>
              <Breadcrumb.Separator>/</Breadcrumb.Separator>
            </>
          ) : (
            <></>
          )}
          {curTask === MarketingType.AddExistHosting ? (
            <>
              <Breadcrumb.Item className={style.breadCrumbItem} onClick={() => handleAiHostingWriteBack(true)}>
                选择任务类型
              </Breadcrumb.Item>
              <Breadcrumb.Separator>/</Breadcrumb.Separator>
              <Breadcrumb.Item>多轮发信设置</Breadcrumb.Item>
            </>
          ) : (
            <Breadcrumb.Item>选择任务类型</Breadcrumb.Item>
          )}
        </Breadcrumb>
      </div>
    );
  };

  const backToSource = () => {
    const backString = new URLSearchParams(location.href).get('back');
    if (backString && backString.length > 0) {
      const back = safeDecodeURIComponent(backString);
      setTimeout(() => {
        location.hash = back;
      }, 300);
    }
    setFromType('');
    props.back && props.back();
  };

  const handleAiHostingWriteBack = (remind: boolean) => {
    if (remind) {
      SiriusModal.warning({
        title: '是否取消新建？',
        content: '已添加的内容不会被保存',
        onOk: () => {
          setCurTask(MarketingType.PickList);
          setPlanData(undefined);
        },
      });
    } else {
      backToSource();
    }
  };

  const resetData = () => {
    setPropsQs(props.qs || {});
  };

  const handleEdmWriteMailBack = () => {
    resetData();
    if (directSingleTask()) {
      backToSource();
      return;
    }
    setCurTask(MarketingType.PickList);
  };

  const BodyComp = () => {
    switch (curTask) {
      case MarketingType.PickList:
        return (
          <SelectTaskComponent
            manualTask={manualTask}
            sendBoxConfRes={sendBoxConfRes}
            clickOperateTaskWithSubject={subject => {
              const newPropsQs = { ...propsQs, emailSubject: subject };
              setPropsQs(newPropsQs);
              setCurTask(MarketingType.SingleTask);
            }}
            clickRecommandTaskWithKey={key => {
              // 写信页的业务逻辑根据router中的from来区分
              // 但在新建任务&新建发件任务进入当前页时不具备from，需要props来区分
              const newPropsQs = { ...propsQs, key: key, currentStepBatchSetting: 'currentStepBatchSetting', addContact: 'addContact' };
              setPropsQs(newPropsQs);
              setCurTask(MarketingType.SingleTask);
            }}
            clickSingleTask={() => {
              setCurTask(MarketingType.SingleTask);
            }}
            clickHostingTask={create => {
              if (create) {
                // 任务选择页除singleTask方式外的创建
                setFromType('hostTask');
                setCurTask(MarketingType.NewHostingTask);
              } else {
                setCurTask(MarketingType.AddExistHosting);
              }
            }}
            operationTasks={operationTasks}
            suggestData={suggestData}
            clickCancel={backToSource}
          />
        );
      case MarketingType.AddExistHosting:
        return (
          <AiHostingWrite
            initData={planData}
            {...props}
            handleSuccess={data => {
              setSuccessData(data);
              setCurTask(MarketingType.SendSuccessWithTaskPage);
              setPlanData(undefined);
            }}
            handleCreate={(data: AiHostingWriteInitData) => {
              // 任务选择页除sigleTask方式外的创建
              setFromType('hostTask');
              setPlanData({ ...(planData || {}), ...data });
              setCurTask(MarketingType.NewHostingTask);
            }}
            handleBack={handleAiHostingWriteBack}
          />
        );
    }
    return undefined;
  };

  const SendSuccessPageComp = () => {
    return <SendSuccessPage {...successData} />;
  };

  const SendSuccessWithTaskPageComp = () => {
    return (
      <SendSuccessWithTaskPage
        edmSubject={successData?.edmSubject || ''}
        taskSubject={successData?.taskSubject || ''}
        receiveCount={successData?.receiveCount || 0}
        btns={successData?.btns}
      />
    );
  };

  const SendSuccessWithNoTaskPageComp = () => {
    return (
      <SendSuccessWithNoTaskPage
        handleRedirect={() => {
          // 无营销托管的单次发信任务创建成功页的创建
          setFromType('singleTask');
          setCurTask(MarketingType.NewHostingTask);
        }}
      />
    );
  };

  const onSechemeAndGroupConfirm = async (taskId: string, planId: string) => {
    let param = {
      taskId,
      groupId: '0',
      planId,
      name: '',
      contacts:
        successData?.receivers?.map(item => ({
          ...item,
          email: item.contactEmail,
        })) || [],
      check: 1,
    };
    const result = await edmApi.addContactPlan(param);
    if (result) {
      const hashName = isEdmWeb ? 'intelliMarketing' : 'edm';
      SiriusModal.success({
        title: '创建成功！',
        content: '已将选中的联系人添加至该任务中，单次发送完成后会自动进行后续多轮营销',
        cancelText: '返回任务列表',
        okText: '查看营销托管任务',
        onOk(...args) {
          navigate(`#${hashName}?page=aiHosting`);
        },
        onCancel(...args) {
          successData?.channel === TaskChannel.senderRotate ? navigate(`#${hashName}?page=senderRotateList`) : navigate(`#${hashName}?page=index`);
        },
        maskClosable: false,
      });
      edmDataTracker.track('pc_marketing_edm_host_addSuccess', { source: aiHostingInitObj?.trackFrom || 'host', from: 'singleTask' });
      changeAiHostingInitObj({});
      setFromType('');
    }
  };

  const FooterComp = () => {};

  if (curTask === MarketingType.SingleTask) {
    return (
      <EdmWriteMail
        qs={propsQs || {}}
        back={handleEdmWriteMailBack}
        handleSuccess={(data: Record<string, any>, pageType: string) => {
          setSuccessData(data);
          if (pageType === 'SendSuccessPage') {
            setCurTask(MarketingType.SendSuccessPage);
          } else if (pageType === 'SendSuccessWithNoTaskPage') {
            setCurTask(MarketingType.SendSuccessWithNoTaskPage);
          } else if (pageType === 'SendSuccessWithTaskPage') {
            setCurTask(MarketingType.SendSuccessWithTaskPage);
          }
        }}
      />
    );
  }
  if (curTask === MarketingType.NewHostingTask) {
    return (
      <AIHosting
        createMode
        visible
        sendFlow
        back={backToSource}
        fromType={fromType}
        cancel={() => {
          if (manualTask) {
            setCurTask(MarketingType.AddExistHosting);
          } else {
            setCurTask(MarketingType.PickList);
          }
          setFromType('');
        }}
        onCreateSuccess={(taskId, planId) => {
          if (fromType === 'singleTask') {
            onSechemeAndGroupConfirm(taskId, planId);
          } else {
            setPlanData({ ...(planData || {}), initPlanId: planId });
            setCurTask(MarketingType.AddExistHosting);
            setFromType('');
          }
        }}
      />
    );
  }

  if (curTask === MarketingType.SendSuccessPage) {
    return SendSuccessPageComp();
  }
  if (curTask === MarketingType.SendSuccessWithTaskPage) {
    return SendSuccessWithTaskPageComp();
  }
  if (curTask === MarketingType.SendSuccessWithNoTaskPage) {
    return SendSuccessWithNoTaskPageComp();
  }

  return (
    <div className={style.rootWrapper}>
      <div className={style.root}>
        {CrumbComp()}
        <edmWriteContext.Provider value={{ value: { state, dispatch } }}>
          <Skeleton loading={loading} active>
            <div className={style.bodyWrapper}>{BodyComp()}</div>
          </Skeleton>
        </edmWriteContext.Provider>
        {FooterComp()}
      </div>
    </div>
  );
};

export default MarketingRoot;
