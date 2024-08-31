import React, { useState, useEffect, useContext } from 'react';
import classnames from 'classnames/bind';
import { Popover } from 'antd';
import { IMMessage } from 'api';
import style from '../imChatList.module.scss';
import MsgRector from '../../common/msgRector';
import { ReadContext } from '../store/readCountStore';

const realStyle = classnames.bind(style);
interface ReadedCountApi {
  msg: IMMessage;
  idServer: string;
  overlay: React.ReactNode;
}

const StatusReadedCount: React.FC<ReadedCountApi> = props => {
  const { msg, overlay, idServer } = props;
  const [readedArr, setReadedArr] = useState<number[]>([0, msg.tempTeamMemberCount || 1]);
  const { readMap, getTeamMsgReads } = useContext(ReadContext);
  // 获取已读未读人数
  useEffect(() => {
    if (Reflect.has(readMap, msg.idServer as string)) {
      const { read, unread } = readMap[msg?.idServer as string];
      setReadedArr([Number(read), Number(unread)]);
    }
  }, [readMap]);

  useEffect(() => {
    getTeamMsgReads(msg);
  }, [msg]);
  return (
    <Popover placement="left" trigger={['click']} content={overlay} destroyTooltipOnHide autoAdjustOverflow overlayClassName={realStyle('readDetailPopover')}>
      <span
        className={realStyle('teamMsgReadCount', {
          allReaded: readedArr[1] === 0,
        })}
      >
        <MsgRector readed={readedArr[0]} unread={readedArr[1]} />
      </span>
    </Popover>
  );
};

export default StatusReadedCount;
