import React, { useMemo } from 'react';
import { Popover } from 'antd';
import './guidePopover.scss';

interface HollowOutGuideProps {
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  content: JSX.Element | string;
  visible: boolean;
  children: React.ReactNode;
  showArrow?: boolean;
  arrowDistance?: number;
  type: string; // 1 蒙层引导  2 图文气泡引导 3 气泡单行引导
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
}

const ImgBubbleGuide: React.FC<HollowOutGuideProps> = props => {
  const { placement = 'bottomLeft', children, content, visible, type, showArrow = true, arrowDistance, getPopupContainer } = props;
  const overlayClassName = useMemo(() => {
    let res = `guideBox guide${placement}`;

    if (type === '1') {
      res = res + ' maskGuide';
    } else if (type === '2') {
      res = res + ' imgGuide';
    } else if (type === '3') {
      res = res + ' tipGuide';
    }

    if (!showArrow) {
      res = res + ' hiddenArrow';
    }

    if (arrowDistance) {
      if (['top', 'bottom', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'].includes(placement)) {
        res = res + ` arrowLeftDis-${arrowDistance}`;
      } else {
        res = res + ` arrowTopDis-${arrowDistance}`;
      }
    }

    return res;
  }, [placement, type, showArrow, arrowDistance]);

  return (
    <Popover
      content={typeof content === 'string' ? content : () => content}
      placement={placement}
      visible={visible}
      autoAdjustOverflow={false}
      overlayClassName={overlayClassName}
      destroyTooltipOnHide={false}
      getPopupContainer={getPopupContainer ? getPopupContainer : trigger => trigger.parentElement || document.body}
    >
      {children}
    </Popover>
  );
};
export default ImgBubbleGuide;
