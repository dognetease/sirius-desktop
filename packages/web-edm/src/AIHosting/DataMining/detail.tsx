import React, { useState, useEffect, useCallback, useRef } from 'react';
import style from './detail.module.scss';
import { EdmSendBoxApi, FetchHostingInfoReq, HostingContentReq, HostingInfo, TaskPlanSwitchReq, apiHolder, apis, getIn18Text, PrevScene, BreadcrumbMap } from 'api';
import SiriusModal from '@web-common/components/UI/SiriusModal';

import { Skeleton, message } from 'antd';
// import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import Breadcrumb from '@lingxi-common-component/sirius-ui/Breadcrumb';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import { TaskDetaiLHeader } from './header';
import { TaskDetailBasicInfo } from './basic';
import { BasicInput } from '../AiHostingEdit';
import { buildBasicInputBy } from '../MarketingPlan/utils';
import { ManageContacts, Interface } from '../ManageContacts/manageContacts';
import { Action } from '../DataView/Header';
import { edmDataTracker } from '../../tracker/tracker';
import { ReactComponent as VideoIcon } from '@/images/icons/edm/video.svg';
import { ConfigActions, useActions } from '@web-common/state/createStore';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

const videoDrawerConfig = { videoId: 'V13', source: 'kehukaifa', scene: 'kehukaifa_5' };
export interface Props {
  planId?: string;
  taskId?: string;
  defaultContactVisible?: boolean;

  onBack?: () => void;
  onModify?: (action: Action) => void;
  onClickDetail?: (email: string) => void;
  planMode?: 0 | 1 | undefined;
  onCreate?: () => void;
  openReplayPage: (planId: string) => void;
}

export const TaskDetail = (props: Props) => {
  const { planId, taskId, defaultContactVisible, onBack, onModify, onClickDetail, planMode = 0, onCreate, openReplayPage } = props;
  const [basic, setBasic] = useState<BasicInput>();
  const [planInfo, setPlanInfo] = useState<HostingInfo>();

  const contactListRef = useRef<Interface>();

  const [loading, setLoading] = useState(false);

  const [refreshKey, setRefreshKey] = useState(false);

  const prevScene = (new URLSearchParams(location.href).get('from') as PrevScene) || '';

  const { showVideoDrawer } = useActions(ConfigActions);

  const refresh = () => {
    setRefreshKey(!refreshKey);
  };

  useEffect(() => {
    setLoading(true);
    fetchTaskInfo();
  }, []);

  const fetchTaskInfo = async () => {
    if (!taskId) {
      return;
    }
    let req: FetchHostingInfoReq = {
      taskId: taskId,
      planId: planId,
    };
    try {
      const resp = await edmApi.fetchHostingInfo(req);
      let a = resp.multiHostingInfos && resp.multiHostingInfos[0];
      setPlanInfo(a);

      let input = buildBasicInputBy(resp);
      setBasic(input);
    } catch (err: any) {
      message.error(err?.message || '获取营销托管任务信息出错');
    }
    setLoading(false);
  };

  const changeState = async (open: boolean) => {
    let t: TaskPlanSwitchReq = {
      taskId: taskId || '',
      planId: planId || '',
      loopStatus: planInfo?.planInfo?.loopStatus === 1 ? 1 : 0,
      planStatus: open ? 1 : 0,
    };
    edmDataTracker.track('pc_marketing_edm_host_taskDetail', {
      action: open ? 'start' : 'stop',
    });
    switchQuery(t);
  };

  const switchQuery = async (req: TaskPlanSwitchReq) => {
    try {
      await edmApi.taskPlanSwitch(req);
      if (planInfo?.planInfo) {
        planInfo.planInfo.status = req.planStatus === 0 ? 0 : 1;
        refresh();
      }
    } catch (err: any) {
      message.error(err?.msg || err?.message || '修改失败，请重试');
    }
  };

  // 头部组件
  const renderTopInfo = () => {
    if (!basic) {
      return undefined;
    }
    return <TaskDetaiLHeader taskId={taskId} planId={planId} info={basic} openReplayPage={openReplayPage} />;
  };

  const SectionGapComp = () => {
    return <div style={{ height: '12px' }}></div>;
  };

  const handleModify = (action: Action) => {
    let newAction: Action = {
      type: action.type,
      planId: planId || '',
      taskId: taskId || '',
      operateType: action.operateType,
      planMode: action.planMode,
    };
    onModify && onModify(newAction);
  };

  const handleDelete = async () => {
    SiriusModal.info({
      title: '请确认是否删除该任务？',
      content: '删除后将不再继续给联系人自动发信，联系人也将会被移除。如果想继续给部分联系人发信，建议先将联系人修改其他任务后再删除该任务',
      okCancel: true,
      cancelText: '确认删除',
      okText: '取消',
      onOk(...args) {},
      onCancel(...args) {
        deleteConfirm();
      },
      maskClosable: false,
    });
  };
  const deleteConfirm = async () => {
    if (taskId && planId) {
      try {
        let _ = await edmApi.deleteHostingPlan({
          taskId: taskId,
          planId: planId,
        });
        message.success({ content: '删除成功' });
        onBack && onBack();
      } catch (e) {
        message.error({ content: '删除失败，请重试' });
      }
    }
  };

  const renderBasicInfo = () => {
    if (!basic) {
      return undefined;
    }
    return (
      <TaskDetailBasicInfo
        info={basic}
        planInfo={planInfo}
        onClose={() => {
          onBack && onBack();
        }}
        onChangeState={open => {
          changeState(open);
        }}
        onAddContact={() => {
          contactListRef?.current?.onAddContact();
        }}
        onModify={action => {
          handleModify(action);
        }}
        onDelete={() => {
          handleDelete();
        }}
      />
    );
  };

  // 面包屑区域,任务通知开关
  const renderBreadCrumb = () => {
    return (
      <div className={style.breadCrumb}>
        <Breadcrumb separator={<SeparatorSvg />}>
          <Breadcrumb.Item
            className={style.breadCrumbItem}
            onClick={() => {
              onBack && onBack();
            }}
          >
            {BreadcrumbMap[prevScene] || getIn18Text('YINGXIAOTUOGUAN')}
          </Breadcrumb.Item>
          <Breadcrumb.Item>{getIn18Text('YINGXIAORENWUXIANGQING')}</Breadcrumb.Item>
        </Breadcrumb>
        <p className={style.videoTip} onClick={() => showVideoDrawer(videoDrawerConfig)}>
          <VideoIcon /> <span>想要提升回复量？试试多轮营销</span>
        </p>
      </div>
    );
  };

  const ContactListComp = () => {
    return (
      <ManageContacts
        taskId={taskId || ''}
        defaultContactVisible={!!defaultContactVisible}
        ref={contactListRef}
        planId={planId}
        source={basic?.planMode === 1 ? 'autoTask' : 'handTask'}
        onClickDetail={(email: string) => {
          onClickDetail && onClickDetail(email);
        }}
        planMode={planMode}
        onCreate={onCreate}
      />
    );
  };

  return (
    <div className={style.container} style={{ paddingRight: '0px', paddingBottom: 20, paddingTop: 20 }}>
      {renderBreadCrumb()}
      <Skeleton loading={loading} active>
        <div className={`${style.detailContainer} ${style.detailCommonContainer}`} onScroll={() => {}} style={{ paddingRight: '24px' }}>
          {renderTopInfo()}
          {SectionGapComp()}
          {renderBasicInfo()}
          {SectionGapComp()}
          {ContactListComp()}
        </div>
      </Skeleton>
    </div>
  );
};
