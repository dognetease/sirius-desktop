import React, { useMemo } from 'react';
import GuidePopover from '../guidePopover';
import HasMaskFooter from './hasMaskFooter';
import styles from './hasMaskGuide.module.scss';

export interface HasMaskGuideContentProps {
  guideId: string;
  step?: number;
  onStep: number;
  okText?: string;
  show?: boolean;
  position: any;
  showSideBar?: boolean;
  borderRadius?: number;
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  showArrow?: boolean;
  arrowDistance?: number;
  title: React.ReactNode;
  intro?: string | JSX.Element;
  renderFooter?: JSX.Element;
  onClose?: () => void;
  className?: string;
}
const HasMaskGuideContent: React.FC<HasMaskGuideContentProps> = props => {
  const {
    show,
    position,
    showSideBar = false,
    borderRadius = 6,
    placement,
    showArrow,
    arrowDistance,
    title,
    intro = '',
    renderFooter,
    guideId,
    step,
    onStep,
    okText,
    onClose,
    className,
  } = props;
  const archerStyle = useMemo(() => {
    if (!position) {
      return {};
    }
    return {
      left: showSideBar ? position.x - 68 : position.x,
      height: position.height,
      top: position.y,
      width: position.width,
      borderRadius,
    };
  }, [showSideBar, position]);
  const Content = () => {
    return (
      <div className={styles.guideBobble}>
        {title && <p className={styles.title}>{title}</p>}
        {typeof intro === 'string' ? (
          <p
            className={styles.intro}
            hidden={!intro}
            style={
              title
                ? {}
                : {
                    marginTop: 0,
                  }
            }
          >
            {intro}
          </p>
        ) : (
          intro
        )}
        {renderFooter ? renderFooter : <HasMaskFooter {...{ guideId, step, onStep, okText, onClose }} />}
      </div>
    );
  };
  return (
    <>
      {show && position && (
        <div className={`${styles.maskWrapper} global-marketing-modal ${className}`} style={{ left: showSideBar ? '68px' : 0 }} onClick={e => e.stopPropagation()}>
          <GuidePopover type="1" content={<Content />} placement={placement} visible={true} showArrow={showArrow} arrowDistance={arrowDistance}>
            <div className={styles.archerWrapper} style={archerStyle}></div>
          </GuidePopover>
        </div>
      )}
    </>
  );
};

export default HasMaskGuideContent;
