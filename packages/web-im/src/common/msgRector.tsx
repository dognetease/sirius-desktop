import React, { useEffect, useState } from 'react';
import classnames from 'classnames/bind';
import { apiHolder } from 'api';
import { Progress, Tooltip } from 'antd';
import { read } from '@popperjs/core';
import { MessageFlagReaded } from './icon/messageFlag';
import style from './msgRector.module.scss';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
type MsgRectorApi = Record<'readed' | 'unread', number | string>;
const inElectron = apiHolder.api.getSystemApi().isElectron();
const isMacElectron = inElectron && window.electronLib.env.isMac;
const COEFFICIENT = isMacElectron ? 0.96 : 0.88;
const MsgRector: React.FC<MsgRectorApi> = props => {
  const { readed, unread } = props;
  const [percent, setPercent] = useState(0);
  useEffect(() => {
    const formatReaded = typeof readed === 'number' ? readed : Number(readed);
    const formatUnread = typeof unread === 'number' ? unread : Number(unread);
    // 因为进行了缩放在显示会有视觉误差，误差比例大致是0.88，也就是precent为50*0.88时展示效果与50*相同，precent为100*0.88时展示效果与100相同
    const scope = (formatReaded * 100) / (formatReaded + formatUnread);
    setPercent(scope * COEFFICIENT);
  }, [readed, unread]);
  // 如果没有人读 或者全部已读 不需要展示toolTip
  if (Number(unread) === 0 || Number(read) === 0) {
    return (
      <>
        {Number(unread) === 0 && <MessageFlagReaded classnames={realStyle('readedIcon', 'allReaded')} />}
        {Number(unread) !== 0 && (
          <div className={realStyle('msgRectorWrapper')}>
            <Progress showInfo={false} trailColor="#fff" strokeLinecap="butt" strokeColor="#5FC475" type="circle" percent={percent} width={90} strokeWidth={50} />
          </div>
        )}
      </>
    );
  }
  const readText = () => {
    if (readed === 0) {
      return getIn18Text('QUANBUWEIDU');
    }
    if (unread === 0) {
      return getIn18Text('QUANBUYIDU');
    }
    return `${readed}人已读，${unread}人未读`;
  };
  return (
    <Tooltip title={readText()} trigger={['hover']}>
      <div className={realStyle('msgRectorWrapper')}>
        <Progress showInfo={false} trailColor="#fff" strokeLinecap="butt" strokeColor="#5FC475" type="circle" percent={percent} width={90} strokeWidth={50} />
      </div>
    </Tooltip>
  );
};
export default MsgRector;
