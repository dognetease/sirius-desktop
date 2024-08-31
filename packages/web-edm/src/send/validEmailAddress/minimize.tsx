import React from 'react';
import { Button, Progress } from 'antd';
import style from './validEmailAddress.module.scss';
import { MaximizeIcon } from './util';
import gif from '@/images/edm_validating_email_1.gif';
import successPng from '@/images/edm_validating_email_2.png';
import Draggable from 'react-draggable';
import { getIn18Text } from 'api';

interface MinimizeProps {
  checkedCount?: number;
  percent?: number;
  closeMinimize: () => void;
}

const dragHandlers = { onStart: () => {}, onStop: () => {} };

const Minimize = (props: MinimizeProps) => {
  const { checkedCount, percent, closeMinimize } = props;
  return (
    <Draggable axis="y" {...dragHandlers} bounds={{ top: 0 }}>
      <div id="dragMinimizeModal" className={style.minimizeModal}>
        <img style={{ marginRight: '12px' }} src={percent === 100 ? successPng : gif} alt="" width="98" height="98" />
        <div className={style.minimizeContent}>
          <div className={style.percentInfo}>
            {getIn18Text('YIGUOLV')}
            <span className={style.color}>{checkedCount}</span>
            {getIn18Text('TIAOSHUJU')}
            {percent === 100 ? '' : '...'}&nbsp;
            <span>({percent}%)</span>
          </div>
          <div className={style.tipsInfo}>{percent === 100 ? getIn18Text('QINGXUANZEYICHANGDEZHI') : getIn18Text('GUOLVXUYAOYIDINGDE')}</div>

          {percent === 100 ? (
            <Button onClick={closeMinimize}>立即处理</Button>
          ) : (
            <Progress strokeColor="#4C6AFF" className={style.progress} percent={percent} showInfo={false} />
          )}
        </div>
        <div className={style.maximize} onClick={closeMinimize}>
          <MaximizeIcon />
        </div>
      </div>
    </Draggable>
  );
};

export default Minimize;
