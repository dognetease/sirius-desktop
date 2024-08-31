import React, { useRef, useEffect, useState } from 'react';
import { Popover, Carousel, Space, Button } from 'antd';
import { useTipVisible } from '../../hooks/useTipVisible';
import style from './style.module.scss';
import { getIn18Text } from 'api';

interface Props {
  shouldShow?: boolean;
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  storeKey: string;
  content?: React.ReactNode;
  tips?: Array<{
    title: string;
    desc: string;
    img: string;
  }>;
  contentStyle?: React.CSSProperties;
  stepLength?: number;
  needIgnore?: boolean;
}

export const PopoverTip: React.FC<Props> = props => {
  const { storeKey, children, content, tips = [], placement, shouldShow = true, contentStyle, stepLength, needIgnore = true } = props;

  if (!shouldShow) {
    return <>{children}</>;
  }

  const { visible: syncSendEmailTipVisible, onClose: syncSendEmailTipClose } = useTipVisible(storeKey);

  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const syncSendEmailTipModal = useRef<HTMLDivElement>(null);

  let carouselRef: any;

  const onChange = (currentSlide: number) => {
    setCurrentSlide(currentSlide);
  };

  useEffect(() => {
    const handler = e => {
      if (syncSendEmailTipVisible && syncSendEmailTipModal?.current && e.path && !e.path.includes(syncSendEmailTipModal?.current)) {
        syncSendEmailTipClose();
      }
    };
    window.addEventListener('click', handler, true);
    return () => window.removeEventListener('click', handler, true);
  }, []);

  return (
    <Popover
      placement={placement}
      destroyTooltipOnHide
      content={
        <div className={style.syncSendEmailTipWrapper} ref={syncSendEmailTipModal}>
          <Carousel
            ref={dom => {
              carouselRef = dom;
            }}
            dots={false}
            autoplay={false}
            afterChange={onChange}
          >
            {content}
            {tips.map(tip => (
              <div className={`${style.syncSendEmailTip} ${contentStyle && contentStyle.height === 68 ? style.syncSendEmailTip68 : ''}`} style={contentStyle}>
                {tip.img ? <img src={tip.img} alt="" /> : ''}
                <div className={style.syncSendEmailTipTitle}>{tip.title}</div>
                <div className={style.syncSendEmailTipDesc}>{tip.desc}</div>
              </div>
            ))}
          </Carousel>
          <div className={style.syncSendEmailTipOp}>
            <Space align="end" style={{ width: 'auto' }}>
              {needIgnore && currentSlide === 1 && <Button onClick={() => syncSendEmailTipClose()}>{getIn18Text('HULVE')}</Button>}
              {currentSlide === 0 && stepLength !== 0 ? (
                <Button
                  type="primary"
                  onClick={() => {
                    carouselRef.next();
                  }}
                >
                  {getIn18Text('XIAYIGE')}
                </Button>
              ) : (
                <Button type="primary" onClick={() => syncSendEmailTipClose()}>
                  {getIn18Text('ZHIDAOLE')}
                </Button>
              )}
            </Space>
          </div>
        </div>
      }
      visible={syncSendEmailTipVisible}
      overlayClassName={style.tipPopover}
    >
      {children}
    </Popover>
  );
};
