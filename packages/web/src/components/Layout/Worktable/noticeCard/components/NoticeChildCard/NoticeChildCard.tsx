import { Tooltip } from 'antd';
import React, { useState } from 'react';
import ClockIcon from '../../../icons/Clock';
import CloseBtnIcon from '../../../icons/CloseBtn';
import { commonDateUnitFormat } from '@web-common/utils/commonDateUnitFormat';
import styles from './NoticeChildCard.module.scss';

export interface NoticeChildCardProps {
  info: string;
  time: string;
  id: number;
  bizId: string;
  jumpUrl: string;
  cardType: number;
  handleClick: (id: number, type: 'normal' | 'close', jumpUrl: string, cardType: number, bizId: string) => void;
  containerEle?: HTMLDivElement | null;
}

export const NoticeChildCard: React.FC<NoticeChildCardProps> = props => {
  const [closeBtnVisible, setCloseBtnVisible] = useState(false);

  return (
    <div
      className={styles.noticeChildCard}
      onClick={() => props.handleClick(props.id, 'normal', props.jumpUrl, props.cardType, props.bizId)}
      onMouseEnter={() => setCloseBtnVisible(true)}
      onMouseLeave={() => setCloseBtnVisible(false)}
    >
      <Tooltip getPopupContainer={() => props.containerEle as unknown as HTMLElement} placement="top" title={props.info}>
        <div className={styles.infoLine}>{props.info}</div>
      </Tooltip>
      <div className={styles.timeLine}>
        <ClockIcon />
        <span>{commonDateUnitFormat(new Date(props.time).getTime(), 'precise')}</span>
      </div>
      <div
        style={{
          display: closeBtnVisible ? 'block' : 'none',
        }}
        className={styles.closeBtn}
        onClick={event => {
          event.stopPropagation();
          props.handleClick(props.id, 'close', props.jumpUrl, props.cardType, props.bizId);
        }}
      >
        <CloseBtnIcon />
      </div>
    </div>
  );
};
