import React, { FC, PropsWithChildren, useContext, useEffect, useState, useMemo } from 'react';
import { apiHolder, apis, EdmSendBoxApi, GetDiagnosisDetailRes } from 'api';
import classnames from 'classnames';
import IconCard from '@web-common/components/UI/IconCard';
import { CollapsibleList } from '@web-common/components/UI/CollapsibleList';
import { ReactComponent as ZhenduanBgIcon } from '@/images/icons/edm/bg-zhenduan.svg';

import { edmDataTracker } from '../../tracker/tracker';
import styles from './validator.module.scss';
import { useValidatorProvider, ValidatorContext, FailedState } from './validator-context';
import { Recommend } from './Recommend';

// let oldNum = 0;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export const ValidatorWrapper: FC<
  PropsWithChildren<{
    data?: GetDiagnosisDetailRes;
    showRecommend: boolean;
  }>
> = props => {
  const { children, data, showRecommend } = props;
  const provider = useContext(ValidatorContext);
  const failedState = provider?.state.find(item => item.id === 'failedState') as FailedState;
  const [count, setCount] = useState(0);
  const [showAction, setShowAction] = useState(false);

  // useEffect(() => {
  //   let targetNum = failedState?.count || 0;
  //   let curCount = count;
  //   if (targetNum > curCount) {
  //     curCount++;
  //     setTimeout(() => {
  //       setCount(curCount);
  //     }, 50);
  //   } else if (targetNum < curCount) {
  //     curCount--;
  //     setTimeout(() => {
  //       setCount(curCount);
  //     }, 50);
  //   }
  // }, [failedState?.count, count]);

  useEffect(() => {
    // 设置旧值
    setCount(failedState?.data?.count || 0);
  }, [failedState?.data?.count]);
  useEffect(() => {
    setTimeout(() => {
      setShowAction(true);
    }, 500);
  }, []);

  const renderNumberChange = useMemo(() => {
    let targetNum = failedState?.data?.count || 0;
    let oldNum = failedState?.data?.old || 0;
    let range = targetNum - oldNum;
    let length = Math.abs(range) + 1;
    return (
      <div className={classnames(styles.headerCount)}>
        {/* 这个只是用来占位的，css baseline规则 */}
        <div style={{ visibility: 'hidden' }}>0</div>
        <div className={classnames(styles.countLine, showAction && length > 1 ? styles.countScroll : '')}>
          {Array.from({ length }).map((item, index) => {
            const curCount = range > 0 ? oldNum + index : oldNum - index;
            return (
              <div className={curCount > 0 ? styles.headerCountWarning : styles.headerCountSuccess} key={index}>
                {curCount}
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [failedState?.data?.count, showAction]);

  return (
    <CollapsibleList
      placement="right"
      title=""
      needBtn
      style={{
        width: 288,
        flexShrink: 0,
      }}
      onOpen={() => edmDataTracker.taskDiagnosisCollapseOpen('open')}
      onClose={() => edmDataTracker.taskDiagnosisCollapseOpen('close')}
    >
      <div className={styles.wrapper}>
        {data != null && showRecommend && <Recommend data={data} />}
        <div className={styles.validator}>
          <div className={classnames(styles.header, showRecommend ? styles.header2 : '')}>
            {!showRecommend && <ZhenduanBgIcon className={styles.bgIcon} />}
            <div className={styles.headerTitle}>任务诊断</div>
            <div className={styles.headerCountWrap}>
              {/* <div className={classnames(styles.headerCount, count > 0 ? '' : styles.headerCountSuccess)}>{count}</div> */}
              {renderNumberChange}
              <span className={styles.headerLabel}>项</span>
              <span className={styles.headerInfo1}>待修复问题</span>
            </div>
            <div className={styles.headerInfo2}>修复以下问题，将有效提升送达效果，同时我们会根据您过往的发信数据优化诊断策略</div>
          </div>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </CollapsibleList>
  );
};
