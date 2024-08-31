import React from 'react';
import classnames from 'classnames/bind';
import style from '../imChatList.module.scss';
import { formatTime, addHHM, isToday } from '../../common/timeline';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
interface TimelineApi {
  time: number;
  classnames?: string;
  format?: 'hh:mm' | 'HH:mm';
  alias?: Record<number, string>;
  testId?: string;
  [key: string]: any;
}
const ChatTimeline: React.FC<TimelineApi> = props => {
  const {
    time,
    classnames = realStyle('timeLine'),
    format = 'HH:mm',
    alias = {
      [5 * 60 * 1000]: getIn18Text('GANGGANG'),
    },
    testId = '',
  } = props;
  if (isToday(time)) {
    return (
      <p className={classnames} data-test-id={testId}>
        {addHHM(time, {
          format,
          ...alias,
        })}
      </p>
    );
  }
  return (
    <p data-test-id={testId} className={classnames}>
      {[
        formatTime(time),
        addHHM(time, {
          format,
          ...alias,
        }),
      ].join(' ')}
    </p>
  );
};
export default ChatTimeline;
