import React from 'react';
import { useActions, useAppSelector, HollowOutGuideAction } from '@web-common/state/createStore';
import styles from './hasMaskGuide.module.scss';
import { getIn18Text } from 'api';
interface HasMaskFooterProps {
  guideId: string;
  step?: number;
  onStep: number;
  okText?: string;
  onClose?: () => void;
}
const HasMaskFooter: React.FC<HasMaskFooterProps> = props => {
  const { guideId, step, onStep, okText = getIn18Text('ZHIDAOLE'), onClose } = props;
  const onGuide = useAppSelector(state => state.hollowOutGuideReducer.guideQueue[0]);
  const { doNextStep, doSkip } = useActions(HollowOutGuideAction);
  // 下一步
  const handleNext = () => {
    // 最后一步 点击 我知道了
    doNextStep({ step: onStep, guideId });
    onClose && onClose();
  };
  // 跳过
  const handleSkip = () => {
    doSkip({ guideId });
    onClose && onClose();
  };
  return (
    <div className={styles.footer}>
      {step ? (
        <span>
          {onStep}/{onGuide?.steps.length}
        </span>
      ) : (
        <span></span>
      )}
      <div className={styles.footerRight}>
        {onGuide?.steps.length > 2 && (
          <span className={styles.skip} onClick={handleSkip}>
            {getIn18Text('TIAOGUO')}
          </span>
        )}
        <button className={styles.butt} onClick={handleNext}>
          {onStep >= onGuide?.steps.length ? okText : getIn18Text('XIAYIBU')}
        </button>
      </div>
    </div>
  );
};

export default HasMaskFooter;
