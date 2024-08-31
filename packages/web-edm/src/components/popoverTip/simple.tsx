import React from 'react';
import { Popover } from 'antd';
import style from './style.module.scss';

interface Props {
  shouldShow?: boolean;
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  content?: React.ReactNode;
  tips?: Array<{
    title: string;
    desc: string;
    img: string;
    title1: string;
    desc1: string;
  }>;
}

export const PopoverSimpleTip: React.FC<Props> = props => {
  const { children, tips = [], placement } = props;
  return (
    <Popover
      placement={placement}
      content={
        <div className={style.syncSendEmailTipWrapper} style={{ paddingRight: '17px' }}>
          {tips.map(tip => (
            <div className={style.syncSendEmailTip} style={{ height: 'auto' }}>
              <div className={style.syncSendEmailTipTitle} style={{ paddingTop: '0px' }}>
                {tip.title}
              </div>
              <div className={style.syncSendEmailTipDesc}>{tip.desc}</div>
              {tip.img ? <img src={tip.img} alt="" className={style.syncSendEmailTipImg} /> : ''}
              <div className={style.syncSendEmailTipTitle} style={{ paddingTop: '0px' }}>
                {tip.title1}
              </div>
              <div className={style.syncSendEmailTipDesc}>{tip.desc1}</div>
            </div>
          ))}
        </div>
      }
      overlayClassName={style.tipPopover}
    >
      {children}
    </Popover>
  );
};
