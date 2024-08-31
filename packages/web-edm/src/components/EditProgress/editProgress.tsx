import React from 'react';
import classnames from 'classnames';
import { ReactComponent as SelectedRightSvg } from '@/images/icons/edm/yingxiao/selected-right2.svg';
import style from './editProgress.module.scss';

interface stepItem {
  stepNum: number;
  stepDesc: string;
  stepType: string;
  stepHide?: boolean;
}

export interface EditProgressProps {
  stepConfig: stepItem[];
  currentStep: number;
  onItemClick?: (item: stepItem) => void;
  wrapClassName?: string;
}

// 支持隐藏不同位置节点
const EditProgress = (props: EditProgressProps) => {
  const { stepConfig, currentStep, onItemClick, wrapClassName } = props;
  const stepHideNumSortList = stepConfig.filter(item => item.stepHide).map(item => item.stepNum);
  return (
    <div className={classnames(style.editProgress, wrapClassName)}>
      {stepConfig.map((item, index) => {
        // 当前节点左侧隐藏的节点数量
        const leftHideStepCount = stepHideNumSortList.filter(itm => itm < item.stepNum).length;
        // 真正在UI上展示的节点值
        const realStepNum = item.stepNum - leftHideStepCount;
        return stepHideNumSortList.includes(item.stepNum) ? (
          <></>
        ) : (
          <div
            className={classnames(
              style.progressItem,
              item.stepNum === currentStep ? style.progressSelected : {},
              item.stepNum < currentStep ? style.progressComplete : {}
            )}
            onClick={() => onItemClick && onItemClick(item)}
          >
            <span className={classnames(style.progressStep, onItemClick ? style.progressCursor : {})}>
              {item.stepNum < currentStep ? <SelectedRightSvg /> : realStepNum}
            </span>
            <span className={classnames(style.progressDesc, onItemClick ? style.progressCursor : {})}>{item.stepDesc}</span>
            {index < stepConfig.length - 1 ? <span className={style.progressLine} /> : <></>}
          </div>
        );
      })}
    </div>
  );
};

export default EditProgress;
