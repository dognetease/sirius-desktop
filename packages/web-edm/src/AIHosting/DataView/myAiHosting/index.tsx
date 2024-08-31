import { getIn18Text } from 'api';
import React, { FC, useEffect, useCallback, useState } from 'react';
import { apiHolder, apis, EdmSendBoxApi, GetAiHostingPlansRes2 } from 'api';
import { Skeleton } from 'antd';
import AddIcon from '@/images/icons/edm/yingxiao/common-add-icon.svg';
import EditorIcon from '@/images/icons/edm/yingxiao/editor-icon.svg';
import picture1 from '@/images/icons/edm/yingxiao/regular-xinke.png';
import styles from '../Header/Header.module.scss';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

import type { Action } from '../Header';

export const MyAiHosting: FC<{
  taskId: string;
  op: (action: Action) => void;
  actionTrace: (action: string) => void;
}> = props => {
  const [plans, setPlans] = useState<GetAiHostingPlansRes2>();

  const fetchData = useCallback(async () => {
    try {
      const res = await edmApi.getAiHostingPlans({
        taskId: props.taskId,
      });
      setPlans(res);
    } catch (err) {}
  }, [props.taskId]);

  useEffect(() => {
    if (props.taskId) {
      fetchData();
    }
  }, [props.taskId]);

  if (plans == null) {
    return (
      <div
        className={styles.strategyList}
        style={{
          padding: 12,
        }}
      >
        <Skeleton active />
      </div>
    );
  }

  const renderMyStrategyList = () => (
    <>
      {plans.map((plan, index) => (
        <div className={styles.item} key={plan.planId}>
          <div className={styles.itemHeader}>
            <div className={styles.itemHeaderLeft}>
              <img src={plan.planIconUrl || picture1} className={styles.leftIcon} alt="" />
              <div className={styles.leftTitle}>{plan.planName}</div>
            </div>
            <div
              className={styles.itemHeaderRight}
              onClick={() => {
                props.op({
                  type: 'submitConfirm',
                  planId: plan.planId,
                  taskId: props.taskId,
                  operateType: 3,
                });
                props.actionTrace('edit');
              }}
            >
              <img src={EditorIcon} />
              <span>{getIn18Text('BIANJI')}</span>
            </div>
          </div>
          <div className={styles.itemData}>
            <div className={styles.itemDataItem}>
              <div className={styles.itemDataItemNum}>{plan.receiverCount}</div>
              <div className={styles.itemDataItemTitle}>{getIn18Text('LIANXIRENSHU')}</div>
            </div>
            <div className={styles.splitLine}></div>
            <div className={`${styles.itemDataItem} ${styles.itemDataItem2}`}>
              <div className={styles.itemDataItemNum}>{plan.sendNum}</div>
              <div className={styles.itemDataItemTitle}>{getIn18Text('FAXINFENGSHU')}</div>
            </div>
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className={styles.strategyList}>
      <div className={styles.strategyListHeader}>
        <div className={styles.strategyListTitle}>{getIn18Text('WODEYINGXIAOFANGAN')}</div>
        <a
          onClick={() => {
            props.op({
              type: 'chooseScheme',
              taskId: props.taskId,
              planId: '',
              operateType: 2,
            });
            props.actionTrace('addStrategy');
          }}
        >
          <img src={AddIcon} alt="" />
          {getIn18Text('XINZENGYINGXIAO')}
        </a>
      </div>
      <div className={styles.list}>{renderMyStrategyList()}</div>
    </div>
  );
};
