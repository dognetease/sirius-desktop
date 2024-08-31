/**
 * 气泡单行引导
 */
import React from 'react';
import GuidePopover from '../guidePopover';
import { useActions, HollowOutGuideAction } from '@web-common/state/createStore';
import styles from './tipGuide.module.scss';

interface TipGuideProps {
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  show?: boolean;
  title?: React.ReactNode;
  onStep: number;
  guideId: string;
  onClose?: () => void;
  children: React.ReactNode;
}

const TipGuide: React.FC<TipGuideProps> = props => {
  const { placement = 'bottomLeft', show, guideId, onStep, title, children, onClose } = props;
  const { doNextStep } = useActions(HollowOutGuideAction);
  const handleNext = () => {
    // 最后一步 点击 我知道了
    doNextStep({ step: onStep, guideId });
    onClose && onClose();
  };
  const ContentTitle = () => {
    return (
      <p className={styles.contentBox}>
        <span className={styles.contentTitle}>{title}</span>
        <span className={styles.contentCloakingBtn}></span>
        <span className={styles.contentBtn} onClick={handleNext}>
          知道了
        </span>
      </p>
    );
  };

  return (
    <GuidePopover type="3" content={<ContentTitle />} visible={!!show} placement={placement}>
      {children}
    </GuidePopover>
  );
};
export default TipGuide;
