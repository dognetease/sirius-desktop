import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import lodashGet from 'lodash/get';
import { Divider, message } from 'antd';
import { apiHolder, apis, EdmSendBoxApi, HostingPlanModel } from 'api';
import IconCard from '@web-common/components/UI/IconCard/index';
import { marketingDetail } from '@web-unitable-crm/api/helper';
import { SwitchButton } from '../SwitchButton';
import { AI_AUTO_ACQUISITION_MODAL } from '../MarketingModalList/marketingModalList';
import { ReactComponent as AutoTaskLightIcon } from '@/images/icons/edm/yingxiao/auto_task_light.svg';
import styles from './autoMarketingEnter.module.scss';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const eventApi = apiHolder.api.getEventApi();

export interface CreateSuccessModel {
  planId: string;
  product: string;
  country: string;
}

export interface AiMarketingEnterModel {
  from: string;
  back: string;
  trackFrom: string;
  // 公司主营产品
  product: string;
  // 目标客户主营产品
  customerProducts: string;
  // 目标客户国家/地区
  country: string;
  // 智能推荐的任务id
  ruleId: number;
  // 营销任务id
  recommendId: string;
  // 自动获客任务id
  planId: string;
  // 创建成功回调
  onCreateSuccess?: (data: CreateSuccessModel) => void;
}

interface AiMarketingEnterProps {
  data: AiMarketingEnterModel;
}

const AutoMarketingEnter = React.forwardRef((props: AiMarketingEnterProps, ref) => {
  const { data } = props;

  const [haveAutoTask, setHaveAutoTask] = useState<boolean>(false);
  const [planInfo, setPlanInfo] = useState<HostingPlanModel>({} as HostingPlanModel);

  const openAutoTask = () => {
    marketingDetail({
      emailKey: data.planId,
      detailType: 'aiHosting',
      from: data.from,
      backUrl: data.back ? encodeURIComponent(data.back) : '',
    });
  };

  const createAutoTask = () => {
    eventApi.sendSysEvent({
      eventName: 'displayMarketingModal',
      eventData: {
        modalKey: AI_AUTO_ACQUISITION_MODAL,
        data,
      },
    });
  };

  const getPlanStatus = async () => {
    try {
      const result = await edmApi.fetchHostingInfo({
        taskId: data.recommendId,
        planId: data.planId,
      });
      setPlanInfo(lodashGet(result, 'multiHostingInfos.0.planInfo', {}));
    } catch (err: any) {
      message.error(err?.message || '获取营销托管任务信息出错');
    }
  };

  const updateRunningStatus = async (open: boolean) => {
    await edmApi.taskPlanSwitch({
      taskId: data.recommendId || '',
      planId: data.planId || '',
      loopStatus: planInfo?.loopStatus === 1 ? 1 : 0,
      planStatus: open ? 1 : 0,
    });
    getPlanStatus();
  };

  useEffect(() => {
    const hasPlan = data?.planId && data?.recommendId;
    setHaveAutoTask(!!hasPlan);
    hasPlan && getPlanStatus();
  }, []);

  return data?.ruleId ? (
    <div className={styles.autoMarketingEnter}>
      <Divider className={classnames(styles.autoMarketingDivider, haveAutoTask ? {} : styles.autoMarketingDividerMargin)} type="vertical" />
      <div className={styles.autoMarketingContent}>
        {haveAutoTask ? (
          <>
            <SwitchButton checked={planInfo.status === 1} onChange={updateRunningStatus} />
            自动获客任务，
            <span className={styles.autoMarketingBtn} onClick={openAutoTask}>
              查看详情
            </span>
            <IconCard className={styles.autoMarketingArrowIcon} type="tongyong_jiantou_you" />
          </>
        ) : (
          <>
            <AutoTaskLightIcon className={styles.autoMarketingLightIcon} />
            想高效转化客户？
            <span className={styles.autoMarketingBtn} onClick={createAutoTask}>
              尝试开启自动化营销
            </span>
            <IconCard className={styles.autoMarketingArrowIcon} type="tongyong_jiantou_you" />
          </>
        )}
      </div>
    </div>
  ) : (
    <></>
  );
});

export default AutoMarketingEnter;
