import React, { useState, useEffect, useRef } from 'react';
import { Skeleton, message } from 'antd';
import { navigate } from '@reach/router';
import lodashGet from 'lodash/get';
import { useLocation } from '@reach/router';
import { AiWriteMailReducer, useActions, useAppSelector } from '@web-common/state/createStore';
import { safeDecodeURIComponent } from '@web-common/utils/utils';
import AiHostingIntroduce from './AiHostingIntroduce/aiHostingIntroduce';
import AiHostingEdit from './AiHostingEdit/index';
import { DataView } from './DataView';
import { ManageContacts } from './ManageContacts/manageContacts';
import ContactDetail from './ContactDetail/contactDetail';
import style from './index.module.scss';
import { EdmSendBoxApi, apiHolder, apis, ContactSource, PrevScene } from 'api';
import { AddContact } from './Receiver/index';
import { ReceiversToContacts } from '../utils';
import useUnmountedRef from '@web-common/hooks/useUnmountedRef';
import qs from 'querystring';
import { Action } from './DataView/Header';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
// import { ReactComponent as WarningIcon } from '@/images/icons/edm/yingxiao/warningIcon.svg';
// import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { edmDataTracker } from '../tracker/tracker';
import { SechemeAndGroupBoxModal } from './components/SechemeAndGroupBox/index';
import { getIn18Text } from 'api';
import { TaskDetail } from './DataMining/detail';
import ReplyContact from './ReplyContact/ReplyContact';
import { buildBasicInputBy } from './MarketingPlan/utils';
import { useNoviceTask } from '@/components/Layout/TaskCenter/hooks/useNoviceTask';
import { TaskNoviceParams } from './utils/utils';
import { set } from 'immer/dist/internal';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const systemApi = apiHolder.api.getSystemApi();
const isEdmWeb = systemApi.isWebWmEntry();

export enum FlowStep {
  Introduce = 'Introduce',
  BasicInfo = 'BasicInfo',
  MailDetail = 'MailDetail',
  Overview = 'Overview',
  ManageContact = 'ManageContact',
  ManageContactDetail = 'ManageContactDetail',
  Default = 'Default',
  TaskDetail = 'TaskDetail',
  ReplyContact = 'ReplyContact',
}

const AiHostingMarketingEmails = 'aiHostingMarketingEmails';
export interface Props {
  visible?: boolean;
  createMode?: boolean;
  onCreateSuccess?: (taskId: string, planId: string) => void;
  back?: () => void;
  cancel?: () => void;
  fromType?: string;
  // 是否是统一发信流程
  sendFlow?: boolean;
}

export const AIHosting = (props: Props) => {
  const { visible = false, onCreateSuccess, back, cancel, fromType, sendFlow = false } = props;
  const [step, setStep] = useState<FlowStep>(FlowStep.Default);
  const location = useLocation();
  const url = new URLSearchParams(location.hash);
  const pageToId = url.get('pageTo');
  const planToId = url.get('planId');
  const prevBack = url.get('back') || '';
  // 来自无营销托管的单次发信任务创建成功页的创建，需要在面包屑区域及返回展示不同的逻辑，及创建成功后不同的埋点source上报
  const fromSuccessWithNoTask = fromType === 'singleTask';

  const { updateAiHostingCache, changeAiHostingInitObj } = useActions(AiWriteMailReducer);
  const aiHostingCache = useAppSelector(state => state.aiWriteMailReducer.aiHostingCache);
  const aiHostingInitObj = useAppSelector(state => state.aiWriteMailReducer.aiHostingInitObj);

  const taskIdRef = useRef<string>();
  const dataViewRef = useRef<{ refresh: () => void }>();

  const [contactDetailEmail, setContactDetailEmail] = useState<string>('');
  const [contactVisible, setContactVisible] = useState(false);

  const [containerHeight, setContainerHeight] = useState<number>(800);

  const [curPlanId, setCurPlanId] = useState<string>('');

  // 修改营销方案及分组弹窗
  const [schemeAndGroupModalVisible, setSchemeAndGroupModalVisible] = useState<boolean>(false);
  const [schemeAndGroupModalLoading, setSchemeAndGroupModalLoading] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const unmountRef = useUnmountedRef();
  const [receivers, setReceivers] = useState<any[]>([]);
  const receiversRef = useRef<any[]>([]);
  // const [tipsVisible, setTipsVisible] = useState<boolean>(false);
  const [contactDetailSource, setContactDetailSource] = useState<ContactSource>('manage');
  const addContactRef = useRef<any>();
  const contactsRef = useRef<any>({});

  // 大盘内按钮跳转到创建流程定位步骤
  const [initState, setInitState] = useState<Action>();

  const params = qs.parse(location.hash.split('?')[1]);
  const source = params.source as string;
  const _t = params._t as string;

  // 最先获取taskId，taskId需要贯穿全局，本页面内都使用taskIdRef.current获取taskId
  const getAiHostingTaskId = async () => {
    const res = await edmApi.getAiHostingTaskList();
    if (res && res.length > 0) {
      taskIdRef.current = res[res.length - 1]?.taskId;
    }
  };

  // 有营销任务跳转大盘页面，无营销任务则判断来源是自动化营销则跳转到基础信息页，否则挑转到介绍页
  const getAiHostingTaskList = async (from?: string) => {
    if (taskIdRef.current) {
      jumpToPage(FlowStep.Overview);
      if (from === 'auto_ai_edm') {
        setContactVisible(true);
      }
    } else {
      if (from === 'auto_ai_edm') {
        jumpToPage(FlowStep.BasicInfo);
        return;
      }
      jumpToPage(FlowStep.Introduce);
    }
  };

  // 新建任务
  const handleCreate = () => {
    const myAction: Action = { type: 'chooseScheme', operateType: taskIdRef.current ? 2 : 0, taskId: taskIdRef.current || '', planId: '' };
    setInitState(myAction);
    setSchemeAndGroupModalVisible(false);
    jumpToPage(FlowStep.BasicInfo);
  };

  // 新建自动获客任务
  const handleCreateAuto = () => {
    const myAction: Action = { type: 'baseInfo', operateType: taskIdRef.current ? 2 : 0, taskId: taskIdRef.current || '', planId: '' };
    setInitState(myAction);
    setSchemeAndGroupModalVisible(false);
    jumpToPage(FlowStep.BasicInfo);
  };

  // 联系人页面打开联系人弹窗
  const handleContactAdd = () => {
    jumpToPage(FlowStep.ManageContact);
  };

  // 进入页面判断跳转到哪个步骤
  const judgeJump = () => {
    if (props.createMode) {
      handleCreate();
      return;
    }

    // 必须在确定要去哪个页面后才能去请求
    const needNew = pageToId === 'new' || aiHostingInitObj?.type === 'new';
    const needAddContact = pageToId === 'addContact';
    const needAutoMatic = pageToId === 'automatic';
    const emails = JSON.parse(localStorage.getItem(AiHostingMarketingEmails) || '[]');
    // 营销托管很多个入口进入，使用redux中的aiHostingInitObj取所有参数，进行分发
    // 营销托管入口进入且非完全新建
    if (aiHostingInitObj?.type && aiHostingInitObj.type !== 'new') {
      const { contacts } = aiHostingInitObj;
      setReceivers(contacts || []);
      if (['create', 'normal'].includes(aiHostingInitObj.type)) {
        handleCreate();
      } else if (['automatic'].includes(aiHostingInitObj.type)) {
        handleCreateAuto();
      } else if (['contactAdd'].includes(aiHostingInitObj.type)) {
        handleContactAdd();
      } else if (aiHostingInitObj.type === 'filter') {
        setContactVisible(true);
        getAiHostingTaskList();
      }
      return;
    }
    // 外部控制营销托管的内部跳转，优先级最高，但需要清除缓存及标识，避免重新进入时使用缓存内容
    if (needNew) {
      handleCreate();
      // 把原来search上的数据删除，防止更换账号登刷新页面的操作导致匹配出错
      // location.hash = '#edm?page=aiHosting';
      return;
    } else if (needAddContact) {
      // 把原来search上的数据删除，防止更换账号登刷新页面的操作导致匹配出错
      // location.hash = '#edm?page=aiHosting';
      setContactVisible(true);
      return;
    } else if (needAutoMatic) {
      changeAiHostingInitObj({
        type: 'automatic',
        from: url.get('from') as PrevScene,
        back: safeDecodeURIComponent(url.get('back') || ''),
        trackFrom: url.get('trackFrom') || '',
      });
      handleCreateAuto();
    } else if (source === 'auto_ai_edm' && emails.length > 0) {
      resetAllStateFromAuto();
      addContactRef.current?.closeAllModal();
      receiversRef.current = emails;
      setTimeout(() => {
        localStorage.setItem(AiHostingMarketingEmails, '');
      }, 2000);
      setReceivers(receiversRef.current);
      // 先去判断 跳转到哪一页
      getAiHostingTaskList(source);
      return;
    } else if (planToId) {
      handleDataViewAction({ type: 'detail', operateType: taskIdRef.current ? 2 : 0, taskId: taskIdRef.current || '', planId: planToId });
      return;
    } else if (aiHostingCache) {
      return;
    }
    setReceivers([]);
    getAiHostingTaskList();
  };

  const initJump = () => {
    getAiHostingTaskId().then(() => {
      judgeJump();
    });
  };

  // 营销托管页面缓存逻辑（截止20230630版本产品需求只有AiHostingEdit需要缓存逻辑）：
  // 1.使用react-activation进行路由内的具体配置以及具体页面的缓存配置
  // 2.由于营销托管主页面的页面分发功能（下方监听visible执行的jumpToPage），导致即使使用react-activation也会执行jumpToPage跳回对应的页面，所以使用redux记录一个是否需要缓存位置的标识
  // 3.<KeepAlive />需要传children给<AliveScope />，所以真实内容的渲染会比正常情况慢
  // 初始进入
  useEffect(() => {
    initJump();
  }, []);
  // 路由上的参数变化以及初始化数据变化需要执行的逻辑
  useEffect(() => {
    if (pageToId || planToId || aiHostingInitObj?.type) {
      initJump();
    }
  }, [pageToId, planToId, aiHostingInitObj]);

  // 页面隐藏时需要执行的逻辑
  useEffect(() => {
    if (!visible) {
      updateAiHostingCache({ cache: step === FlowStep.BasicInfo });
    }
    if (props.createMode) {
      initJump();
    }
  }, [visible]);

  useEffect(() => {
    if (ResizeObserver && containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
          const { height } = entry.contentRect;
          setContainerHeight(height - 90 - 64);
        });
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }

    return () => {};
  }, [ResizeObserver, containerRef.current]);

  // 新手任务
  const { quit, start, handling } = useNoviceTask(TaskNoviceParams);
  // 开始新手任务
  useEffect(() => {
    handling && start();
  }, [handling]);

  const onSechemeAndGroupConfirm = async (groupId: string, planId: string, groupName: string, directSubmit?: boolean) => {
    if (schemeAndGroupModalLoading) {
      return;
    }
    setSchemeAndGroupModalLoading(true);
    let param = {
      taskId: taskIdRef.current as string,
      groupId,
      planId,
      contacts: contactsRef.current.contacts || receivers,
      check: contactsRef.current.check,
      name: groupName || '',
    };
    // 营销入口不需要过滤的场景下直接保存联系人任务和分组
    if (directSubmit) {
      param.contacts =
        receivers?.map(item => ({
          ...item,
          email: item.contactEmail,
        })) || [];
      param.check = 1;
    }
    const result = await edmApi.addContactPlan(param);
    if (result) {
      if (!directSubmit) {
        message.success(getIn18Text('TIANJIALIANXIRENCHENGGONG'));
        setSchemeAndGroupModalVisible(false);
        contactsRef.current = {};
        // 刷新
        if (step === FlowStep.Overview) {
          dataViewRef.current != null && dataViewRef.current.refresh();
        }
      }
      edmDataTracker.track('pc_marketing_edm_host_addSuccess', { source: aiHostingInitObj?.trackFrom || 'host', from: 'newTask' });
      resetAllStateFromAuto(true);
    }
    setSchemeAndGroupModalLoading(false);
  };

  const resetAllStateFromAuto = (resetAiHostingInitObj?: boolean) => {
    setContactVisible(false);
    // setTipsVisible(false);
    // resetAiHostingInitObj为true是关闭弹窗不继续操作，需要changeAiHostingInitObj并且重置联系人，其他情况不用
    if (resetAiHostingInitObj) {
      changeAiHostingInitObj({});
      setReceivers([]);
    }
  };

  const needUnmount = () => {
    if (step === FlowStep.BasicInfo) {
      return false;
    }
    return !visible;
  };

  const renderContent = () => {
    if (needUnmount()) {
      return null;
    }
    switch (step) {
      case FlowStep.Introduce:
        return AiHostingIntroduceComp();
      case FlowStep.BasicInfo:
        return AiHostingEditComp();
      case FlowStep.Overview:
        return OverviewComp();
      case FlowStep.ManageContact:
        return ManageContact();
      case FlowStep.ManageContactDetail:
        return ManageContactDetail();
      case FlowStep.TaskDetail:
        return TaskDetailComp();
      case FlowStep.ReplyContact:
        return ReplyContactComp();
      case FlowStep.Default:
        return (
          <div className={style.skeletonPadding}>
            <Skeleton />
          </div>
        );

      default:
        return (
          <div className={style.skeletonPadding}>
            <Skeleton />
          </div>
        );
    }
  };

  const handleDataViewAction = (action: Action) => {
    setInitState(action);
    switch (action.type) {
      case 'detail': {
        jumpToPage(FlowStep.TaskDetail);
        break;
      }
      default: {
        jumpToPage(FlowStep.BasicInfo);
        break;
      }
    }
  };

  const jumpToPage = (step: FlowStep) => {
    setStep(step);
    if (step === FlowStep.Overview && props.createMode) {
      back && back();
    }
  };

  // 初始引导页面
  const AiHostingIntroduceComp = () => {
    return (
      <AiHostingIntroduce
        onCreate={() => {
          jumpToPage(FlowStep.BasicInfo);
        }}
      />
    );
  };

  // 填写基础信息页面
  const AiHostingEditComp = () => {
    return (
      <AiHostingEdit
        taskId={taskIdRef.current}
        visible={visible}
        initState={initState}
        sendFlow={sendFlow}
        fromType={fromType}
        resetData={() => {
          setInitState(undefined);
        }}
        onBack={() => {
          setInitState(undefined);
          if (fromSuccessWithNoTask) {
            back && back();
            return;
          }
          if (sendFlow) {
            cancel && cancel();
            return;
          }
          getAiHostingTaskList();
        }}
        onCancel={() => {
          jumpToPage(FlowStep.Introduce);
          setInitState(undefined);
        }}
        key={source === 'auto_ai_edm' ? _t : 'normal'}
        onCreateSuccess={(taskId, addContact, needPlanId, planInfo) => {
          taskIdRef.current = taskId;
          if (planInfo?.isAutoPlan) {
            edmDataTracker.track('pc_markting_edm_taskCreate_autoHost', { source: aiHostingInitObj?.trackFrom || 'host' });
          } else {
            edmDataTracker.track('pc_marketing_edm_host_setSuccess', { source: aiHostingInitObj?.trackFrom || 'host', from: fromType || 'newTask' });
          }

          if (props.createMode && onCreateSuccess) {
            onCreateSuccess(taskId, planInfo?.planId || '');
            return;
          }
          if (planInfo?.toDetailPage && planInfo?.planId) {
            handleDataViewAction({
              type: 'detail',
              taskId,
              planId: planInfo.planId,
              operateType: -1,
              defaultContactVisible: true,
            });
          } else {
            jumpToPage(FlowStep.Overview);
            setContactVisible(addContact);
          }
          needPlanId && onSechemeAndGroupConfirm('0', planInfo?.planId || '', '', true);
          // 营销托管入口无需过滤时创建成功清除
          if (aiHostingInitObj?.type && !aiHostingInitObj?.filter) {
            changeAiHostingInitObj({});
          }
        }}
        hasReceiversData={receivers.length > 0 && source === 'auto_ai_edm'}
      />
    );
  };

  // 营销大盘页面
  const OverviewComp = () => {
    return (
      <DataView
        taskId={taskIdRef.current || ''}
        // 跳转编辑
        openEditPage={taskId => {
          taskIdRef.current = taskId;
          jumpToPage(FlowStep.BasicInfo);
        }}
        // 管理联系人
        openContactPage={taskId => {
          jumpToPage(FlowStep.ManageContact);
        }}
        openReplayPage={planId => {
          setCurPlanId(planId);
          jumpToPage(FlowStep.ReplyContact);
        }}
        // 点击去添加
        addContact={taskId => {
          setContactVisible(true);
        }}
        key={source === 'auto_ai_edm' ? _t : 'normal'}
        // 我的营销方案操作
        op={action => {
          handleDataViewAction(action);
        }}
        ref={dataViewRef}
      />
    );
  };

  // 管理联系人页面
  const ManageContact = () => {
    return (
      <ManageContacts
        taskId={taskIdRef.current || ''}
        hasValidateModal={addContactRef.current?.getShowValidateEmailModal()}
        onClickDetail={(email: string) => {
          // setContactDetailEmail(email);
          // jumpToPage(FlowStep.ManageContactDetail);
          jumpToContactDetail(email, 'manage');
        }}
        goBackAi={() => jumpToPage(FlowStep.Overview)}
        onCreate={handleCreate}
        defaultContactVisible={['contactAdd'].includes(aiHostingInitObj?.type || '')}
      />
    );
  };

  // 联系人详情页面
  const ManageContactDetail = () => {
    return (
      <ContactDetail
        taskId={taskIdRef.current || ''}
        email={contactDetailEmail}
        source={contactDetailSource}
        goBackAi={() => jumpToPage(FlowStep.Overview)}
        goBackManage={() => jumpToPage(FlowStep.ManageContact)}
        goTaskDetail={() => jumpToPage(FlowStep.TaskDetail)}
      />
    );
  };

  const jumpToContactDetail = (email: string, source: ContactSource) => {
    setContactDetailEmail(email);
    jumpToPage(FlowStep.ManageContactDetail);
    setContactDetailSource(source);
  };

  const TaskDetailComp = () => {
    return (
      <TaskDetail
        taskId={initState?.taskId || taskIdRef.current}
        planId={initState?.planId}
        onBack={() => {
          navigate(`#${isEdmWeb ? 'intelliMarketing' : 'edm'}?page=aiHosting`);
          jumpToPage(FlowStep.Overview);
          if (prevBack) {
            setTimeout(() => {
              navigate(safeDecodeURIComponent(prevBack));
            }, 300);
          }
        }}
        onModify={action => {
          handleDataViewAction(action);
        }}
        onClickDetail={(email: string) => {
          // setContactDetailEmail(email);
          // jumpToPage(FlowStep.ManageContactDetail);
          jumpToContactDetail(email, initState?.planMode === 1 ? 'autoTask' : 'handTask');
        }}
        planMode={initState?.planMode}
        onCreate={handleCreate}
        openReplayPage={planId => {
          setCurPlanId(planId);
          jumpToPage(FlowStep.ReplyContact);
        }}
        defaultContactVisible={initState?.defaultContactVisible}
      />
    );
  };

  const ReplyContactComp = () => {
    return <ReplyContact taskId={taskIdRef.current || ''} goBackAi={() => jumpToPage(FlowStep.Overview)} planId={curPlanId || ''} />;
  };

  const sendReceivers = async (receivers: any[], directSend?: boolean) => {
    if (receivers && receivers.length > 0) {
      const contacts = ReceiversToContacts(receivers);
      contactsRef.current = {
        contacts: contacts,
        check: !!directSend ? 0 : 1,
      };
      setContactVisible(false);
      setSchemeAndGroupModalVisible(true);
    }
  };

  const AddContactComp = () => {
    return (
      <AddContact
        receivers={receivers}
        visible={contactVisible}
        readonly={false}
        onClose={(type?: string) => {
          // type为空是关闭弹窗不继续操作
          resetAllStateFromAuto(!type);
          if (taskIdRef.current) {
            jumpToPage(FlowStep.Overview);
            if (step === FlowStep.Overview) {
              dataViewRef.current != null && dataViewRef.current.refresh();
            }
          }
        }}
        containerHeight={containerHeight}
        sendReceivers={sendReceivers}
        sourceFrom="hostingIndex"
        ref={addContactRef}
        // key={source === 'auto_ai_edm' ? _t : 'normal'}
      />
    );
  };

  // const tipsModalComp = () => {
  //   return (
  //     <Modal
  //       visible={tipsVisible}
  //       getContainer={() => {
  //         return document.body;
  //       }}
  //       width={400}
  //       closable={false}
  //       title={null}
  //       maskClosable={false}
  //       className={style.aiHostingSettingModal}
  //       destroyOnClose={true}
  //       footer={null}
  //     >
  //       <div className={style.container}>
  //         <div className={style.icon}>
  //           <WarningIcon />
  //         </div>
  //         <div className={style.content}>
  //           <div className={style.title}>{getIn18Text('QINGTIANXIEXINXISHENGCHENG')}</div>
  //           <div className={style.info}>
  //             {getIn18Text('YITIANJIALE')}
  //             {receivers.length}
  //             {getIn18Text('GELIANXIREN，PEIZHI')}
  //           </div>
  //           <div
  //             className={style.btn}
  //             onClick={() => {
  //               setTipsVisible(false);
  //             }}
  //           >
  //             {getIn18Text('ZHIDAOLE')}
  //           </div>
  //         </div>
  //       </div>
  //     </Modal>
  //   );
  // };

  return (
    <PermissionCheckPage resourceLabel="EDM" accessLabel="VIEW" menu="EDM_SENDBOX">
      <div className={style.root} id="ai_hosting_root_node" style={{ display: visible ? 'block' : 'none' }} ref={containerRef}>
        {renderContent()}
        {contactVisible && AddContactComp()}
      </div>
      {/* {tipsVisible && tipsModalComp()} */}
      {schemeAndGroupModalVisible && (
        <SechemeAndGroupBoxModal
          title={`共添加${lodashGet(contactsRef, 'current.contacts.length', 0)}个联系人，请完成设置`}
          visible={schemeAndGroupModalVisible}
          onCancel={() => {
            setSchemeAndGroupModalVisible(false);
            changeAiHostingInitObj({});
          }}
          onConfirm={onSechemeAndGroupConfirm}
          taskId={taskIdRef.current}
          onCreate={handleCreate}
          loading={schemeAndGroupModalLoading}
        />
      )}
    </PermissionCheckPage>
  );
};
