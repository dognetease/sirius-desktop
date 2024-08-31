/**
 * 气泡图文引导
 */
import React, { useCallback } from 'react';
import GuidePopover from '../guidePopover';
import ImgBubbleGuideContent, { ImgBubbleGuideContentProps } from './imgBubbleGuideContent';

interface HollowOutGuideProps {
  show?: boolean;
  onStep: number;
  guideId: string;
  step?: number;
  title: React.ReactNode;
  intro?: string | JSX.Element;
  renderFooter?: JSX.Element;
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  children: React.ReactNode;
  arrowDistance?: number;
  okText?: string;
  showArrow?: boolean;
  contentImg?: string;
  onClose?: () => void;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
}

const ImgBubbleGuide: React.FC<HollowOutGuideProps> = props => {
  const { show, guideId, step, onStep, title, intro, renderFooter, placement, children, okText, onClose, showArrow, arrowDistance, contentImg, getPopupContainer } =
    props;

  const Content = useCallback(() => {
    const imgProps: ImgBubbleGuideContentProps = {
      guideId,
      step,
      onStep,
      okText,
      title,
      intro,
      renderFooter,
      contentImg,
      onClose,
    };
    return <ImgBubbleGuideContent {...imgProps} />;
  }, [guideId, step, onStep, okText, title, intro, renderFooter, contentImg, onClose]);

  return (
    <GuidePopover
      type="2"
      content={<Content />}
      placement={placement}
      visible={!!show}
      showArrow={showArrow}
      arrowDistance={arrowDistance}
      getPopupContainer={getPopupContainer}
    >
      {children}
    </GuidePopover>
  );
};
export default ImgBubbleGuide;
