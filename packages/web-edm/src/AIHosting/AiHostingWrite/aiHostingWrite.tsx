import React, { useState, useReducer, useRef, useEffect } from 'react';
import { Spin, message } from 'antd';
import classnames from 'classnames';
import { navigate } from '@reach/router';
import {
  apiHolder,
  getIn18Text,
  DataStoreApi,
  apis,
  EdmSendBoxApi,
  GetPlanItemRes,
  EdmSendConcatInfo,
  AiMarketingContact,
  AddContactPlanReq,
  ReceiversSendTypeModel,
  ReceiverInfoModel,
} from 'api';
import { AiWriteMailReducer, useActions, useAppSelector } from '@web-common/state/createStore';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { ReactComponent as AddIconHover } from '@/images/icons/im/add-icon-hover.svg';
import { ReceiverSettingNew } from '../../send/ReceiverSettingDrawer/receiver';
import GroupInputBox, { GroupInputValue } from '../components/GroupInputBox/GroupInputBox';
import { edmWriteContext, EmptyContactType, IEdmWriteState, writeContextReducer } from '../../send/edmWriteContext';
import { userGuideReducer, UserGuideContext } from '../../components/UserGuide/context';
import TongyongChenggongMian from '@web-common/images/newIcon/tongyong_chenggong_mian';
import { edmDataTracker } from '../../tracker/tracker';
import style from './aiHostingWrite.module.scss';
import { EditorHelperComponent } from '../editorHelper';

const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const systemApi = apiHolder.api.getSystemApi();
const isEdmWeb = systemApi.isWebWmEntry();

const planMapList = [
  {
    label: '营销轮次：',
    key: 'maxRound',
  },
  {
    label: '创建日期：',
    key: 'createTime',
  },
  {
    label: '发件邮箱：',
    key: 'sendEmail',
  },
  {
    label: '公司名称：',
    key: 'companyName',
  },
  {
    label: '总联系人数：',
    key: 'contactCount',
  },
  {
    label: '已营销联系人数：',
    key: 'receiverCount',
  },
];

const getStorageContacts = (key?: string) => {
  if (!key) {
    return [];
  }
  try {
    // 存的时候没有使用storageApi，为避免较大改动，这里也直接取
    const storageContactsJson = localStorage.getItem(key);
    if (storageContactsJson) {
      return JSON.parse(storageContactsJson);
    }
    return [];
  } catch {
    return [];
  }
};

export interface AiHostingWriteInitData {
  initPlanId?: string;
  initReceivers?: AiMarketingContact[];
  initGroupId?: string;
}

interface AiHostingWriteProp {
  // 创建成功，需要告知方案名称
  handleSuccess: (data: Record<string, any>) => void;
  // 新建营销托管
  handleCreate: (data: AiHostingWriteInitData) => void;
  // 返回上一个页面
  handleBack: (remind: boolean) => void;
  // 接收传入的数据
  initData?: {
    initPlanId?: string;
    initReceivers?: AiMarketingContact[];
    initGroupId?: string;
  };
}

export const AiHostingWrite = (props: AiHostingWriteProp) => {
  const { handleSuccess, handleCreate, handleBack, initData, qs } = props;
  const { changeAiHostingInitObj } = useActions(AiWriteMailReducer);
  const aiHostingInitObj = useAppSelector(state => state.aiWriteMailReducer.aiHostingInitObj);
  const searchParams = new URLSearchParams(location.href);
  const stepsInfo = (searchParams.get('sendType') ? { receiversSendType: searchParams.get('sendType') as ReceiversSendTypeModel } : undefined) as ReceiverInfoModel;
  // 接收传入的receivers，用于各种入口带入联系人后回填到联系人抽屉
  // 三种方式：新建营销托管任务成功会重新初始化数据，例如新建营销托管任务入口操作新建后返回；使用营销托管入口组件的会通过redux传递，例如全球搜；不使用的会通过localStorage传递，例如crm
  // 以上优先级依次降低
  const [initReceivers, setInitReceivers] = useState<AiMarketingContact[]>();
  // 页面整体loading
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  // 提交按钮loading
  const [loading, setLoading] = useState<boolean>(false);
  const receiverRef = useRef<null>();
  // 分组选择信息
  const [groupObj, setGroupObj] = useState<GroupInputValue>();
  // 任务id
  const [taskId, setTaskId] = useState<string>('');
  // 方案列表
  const [plans, setPlans] = useState<GetPlanItemRes[]>();
  // 选中方案id
  const [checkPlanId, setCheckPlanId] = useState<string>(initData?.initPlanId || '');
  const containerRef = useRef<HTMLDivElement>(null);
  // 联系人选择抽屉中列表内容高度
  const [containerHeight, setContainerHeight] = useState<number>(800);

  const [userGuideState, userGuideDispatch] = useReducer(userGuideReducer, { currentStep: -1, shouldShow: false, hasOperate: false, guideState: 'unknow' });
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

  const getDraftId = async () => {
    const draftId = await edmApi.createDraft();
    dispatch({
      type: 'setState',
      payload: { draftId },
    });
  };

  const getTaskInfo = async () => {
    if (pageLoading) {
      return;
    }
    setPageLoading(true);
    const result = await edmApi.getSendBoxConf({ type: 2 });
    const taskId = result.hostingTaskId || '';
    if (taskId) {
      setTaskId(taskId);
      const taskRes = await edmApi.getPlanList({ taskId });
      const taskList = (taskRes?.planList || []).filter(item => item.planMode !== 1);
      setPlans(taskList);
    }
    setPageLoading(false);
  };

  useEffect(() => {
    getTaskInfo();
    getDraftId();
    let initReceivers: AiMarketingContact[] = [];
    if (initData?.initReceivers) {
      initReceivers = initData?.initReceivers || [];
    }
    if (aiHostingInitObj.type === 'write' && initReceivers.length <= 0) {
      initReceivers = aiHostingInitObj?.contacts || [];
    }
    if (initReceivers.length <= 0 && qs?.key) {
      initReceivers = getStorageContacts(qs.key);
      localStorage.removeItem(qs.key);
    }
    if (initReceivers?.length) {
      setInitReceivers(initReceivers);
    }
    return () => {
      changeAiHostingInitObj({});
    };
  }, []);

  useEffect(() => {
    if (ResizeObserver && containerRef.current) {
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
  }, [ResizeObserver, containerRef.current]);

  const handleSetGroup = (data: GroupInputValue) => {
    setGroupObj(data);
    edmDataTracker.track('pc_marketing_edm_hostTask', { type: 'group' });
  };

  const handleSetPlan = (planId: string) => {
    setCheckPlanId(planId);
    edmDataTracker.track('pc_marketing_edm_hostTask', { type: 'task' });
  };

  const handleCancel = () => {
    handleBack(true);
    edmDataTracker.track('pc_marketing_edm_hostTask', { type: 'cancel' });
  };

  const handleConfirm = async () => {
    if (loading) {
      return;
    }
    const receivers = receiverRef.current?.getReceivers() || [];
    if (!receivers.length) {
      receiverRef.current?.showReceiverModal();
    } else if (!checkPlanId) {
      message.warn('请选择营销托管任务');
    } else {
      setLoading(true);
      const contacts = receivers.map(item => ({ ...item, email: item.contactEmail, name: item.contactName, increaseSourceName: item.increaseSourceName || '新建任务' }));
      const receiverType = receiverRef.current?.getReceiverType();
      let param: AddContactPlanReq = {
        taskId,
        groupId: groupObj?.groupId || '',
        planId: checkPlanId,
        contacts,
        check: receiverType === 1 ? 1 : 0,
        name: groupObj?.groupName || '',
        syncCrm: receiverRef.current?.getStoreClueValue() || false,
      };
      const result = await edmApi.addContactPlan(param);
      setLoading(false);
      if (result) {
        message.success(getIn18Text('TIANJIALIANXIRENCHENGGONG'));
        const taskSubject = plans?.find(item => item.planId === checkPlanId)?.name || '';
        handleSuccess({
          taskSubject,
          receiveCount: receivers.length,
          btns: [
            {
              text: '查看任务详情',
              type: 'primary',
              style: { marginRight: 12 },
              onclick() {
                navigate(`#${isEdmWeb ? 'intelliMarketing' : 'edm'}?page=aiHosting&planId=${checkPlanId}`);
              },
            },
            {
              text: '返回任务列表',
              type: 'minorLine',
              onclick() {
                navigate(`#${isEdmWeb ? 'intelliMarketing' : 'edm'}?page=index`);
              },
            },
          ],
        });
        edmDataTracker.track('pc_marketing_edm_host_addSuccess', { source: aiHostingInitObj?.trackFrom || 'host', from: 'hostTask' });
        changeAiHostingInitObj({});
      } else {
        message.error('添加联系人失败，请稍后重试');
      }
    }
    edmDataTracker.track('pc_marketing_edm_hostTask', { type: 'confirm' });
  };

  const handleCreateBefore = () => {
    const receivers = receiverRef.current?.getReceivers() || [];
    handleCreate({ initGroupId: groupObj?.groupId || '', initReceivers: receivers });
    edmDataTracker.track('pc_marketing_edm_hostTask', { type: 'newTask' });
  };

  return (
    <div className={style.aiHostingWrite}>
      <div className={style.wrapper} id="edm-write-root">
        <PermissionCheckPage
          resourceLabel="EDM"
          accessLabel="OP"
          menu="EDM_SENDBOX"
          customContent={
            <Button btnType="minorLine" onClick={() => handleBack(false)}>
              {getIn18Text('FANHUI')}
            </Button>
          }
        >
          <UserGuideContext.Provider value={{ state: userGuideState, dispatch: userGuideDispatch }}>
            <edmWriteContext.Provider value={{ value: { state, dispatch } }}>
              <div className={style.container}>
                <div className={style.content} ref={containerRef}>
                  <ReceiverSettingNew
                    ref={receiverRef}
                    // qs={props.qs}
                    hasVariable={false}
                    readonly={false}
                    visible={true}
                    containerHeight={containerHeight}
                    capacity={1000}
                    receivers={initReceivers as EdmSendConcatInfo[]}
                    saveDraft={async () => false}
                    needSystemRecommend={false}
                    smartMarketingVisible={false}
                    sendFilterCapacity={() => {}}
                    baseSecondSendInfo={{}}
                    needCheckAllLogic={false}
                    initShowPrompt={false}
                    ignoreIncreaseSourceName={true}
                    initShowClueTips={true}
                    stepsInfo={stepsInfo}
                    addContactClickCb={() => edmDataTracker.track('pc_marketing_edm_hostTask', { type: 'multipleAddContact' })}
                  />
                  <div className={style.group}>
                    <p className={style.title}>选择分组</p>
                    {taskId ? <GroupInputBox initGroup initGroupId={initData?.initGroupId || ''} taskId={taskId} onChange={handleSetGroup} /> : <></>}
                  </div>
                  <div className={style.plans}>
                    <p className={style.title}>
                      <span className={style.titleLeft}>选择已有任务</span>
                      <span className={style.titleRight} onClick={handleCreateBefore}>
                        <AddIconHover />
                        &nbsp;新增营销托管任务
                      </span>
                    </p>
                    <div className={style.planList}>
                      {plans?.map(item => (
                        <div className={classnames(style.planItem, item.planId === checkPlanId ? style.planItemCheck : {})} onClick={() => handleSetPlan(item.planId)}>
                          <div className={style.planItemHead}>
                            <span>
                              <span className={classnames(style.planItemTag, item.status === 1 ? style.planItemRun : {})}>{item.status === 1 ? '运行中' : '已停止'}</span>
                              <span className={style.planItemName}>{item.name}</span>
                            </span>
                            {item.planId !== checkPlanId ? <span className={style.planItemIcon} /> : <></>}
                            {item.planId === checkPlanId ? <TongyongChenggongMian className={style.planItemCheckIcon} /> : <></>}
                          </div>
                          <div className={style.planItemDetail}>
                            {planMapList.map(itm => (
                              <span className={style.planDetailName}>
                                {itm.label}
                                <span>{item[itm.key]}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={style.footer}>
                  <Button btnType="minorLine" onClick={handleCancel}>
                    {getIn18Text('QUXIAO')}
                  </Button>
                  <Button btnType="primary" onClick={() => handleConfirm()}>
                    确定添加
                  </Button>
                </div>
              </div>
              <EditorHelperComponent />
            </edmWriteContext.Provider>
          </UserGuideContext.Provider>
          {pageLoading ? (
            <div className={style.pageLoading}>
              <Spin tip={getIn18Text('ZHENGZAIJIAZAIZHONG...')} indicator={<LoadingIcon />} />
            </div>
          ) : (
            <></>
          )}
        </PermissionCheckPage>
      </div>
    </div>
  );
};
const LoadingIcon = () => (
  <div className="sirius-spin">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        opacity="0.27"
        d="M20.8884 11.9998C20.8884 7.09059 16.9087 3.11089 11.9995 3.11089C7.09029 3.11089 3.1106 7.09059 3.1106 11.9998C3.1106 16.909 7.09029 20.8887 11.9995 20.8887C16.9087 20.8887 20.8884 16.909 20.8884 11.9998Z"
        stroke="#386EE7"
        strokeWidth="3"
      />
      <path
        d="M3.11133 12.0005C3.11133 7.09129 7.09102 3.1116 12.0002 3.1116C14.993 3.1116 17.6403 4.59063 19.2512 6.85763"
        stroke="#386EE7"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

export default AiHostingWrite;
