import { getIn18Text } from 'api';
import React from 'react';
import { Popover } from 'antd';
import { ReactComponent as TipIcon } from '@web-sns-marketing/images/tip.svg';
import CommerceImg from '@web-sns-marketing/images/commerce.png';
import FreshImg from '@web-sns-marketing/images/fresh.png';
import WarmImg from '@web-sns-marketing/images/warm.png';
import style from './ReplaceImagePopover.module.scss';

interface ReplaceImagePopoverProps {
  className?: string;
}

const ReplaceImagePopover: React.FC<ReplaceImagePopoverProps> = props => {
  const { className } = props;

  return (
    <Popover
      overlayClassName={style.replaceImagePopover}
      title={null}
      placement="bottomLeft"
      content={
        <div className={style.list}>
          <div className={style.item}>
            <div className={style.header}>{getIn18Text('SHANGWUFENG')}</div>
            <div className={style.body}>
              <div className={style.content}>{getIn18Text('JIAOWEIZHENGSHI、ZHUANYE')}</div>
              <img className={style.img} src={CommerceImg} />
            </div>
          </div>
          <div className={style.item}>
            <div className={style.header}>{getIn18Text('QINGXINFENG')}</div>
            <div className={style.body}>
              <div className={style.content}>{getIn18Text('YOUQINGSONGGAN，KENENG')}</div>
              <img className={style.img} src={FreshImg} />
            </div>
          </div>
          <div className={style.item}>
            <div className={style.header}>{getIn18Text('QINHEFENG')}</div>
            <div className={style.body}>
              <div className={style.content}>{getIn18Text('JIAOWEIYOUHAO、QINQIE')}</div>
              <img className={style.img} src={WarmImg} />
            </div>
          </div>
        </div>
      }
    >
      <TipIcon className={className} />
    </Popover>
  );
};

export default ReplaceImagePopover;
