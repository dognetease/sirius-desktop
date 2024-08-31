import moment from 'moment';
import { FreeBusyModel } from 'api';
import React from 'react';
import styles from './eventCell.module.scss';
import { getWeekViewEventHeight } from '../../util';
import classnames from 'classnames';
import { isAlldayOrCrossEvent } from './util';
import { getIn18Text } from 'api';
interface EventDetailProps {
  // 日程信息
  event: FreeBusyModel['freeBusyItems'][0];
  // 每小时的高度
  hourHeight?: number;
  // 是否判断日程过期
  judgePast?: boolean;
}
const EventDetail: React.FC<EventDetailProps> = ({ event, hourHeight = 50, judgePast = true }) => {
  // 是全天或者跨天日程
  const isAllDayOrCross = isAlldayOrCrossEvent(event);
  // 展示的时间
  const timeStr = `${moment(event.start).format('HH:mm')}-${moment(event.end).format('HH:mm')}`;
  // 日程是否大于半小时
  const aboveHalfHour = moment(event.start).clone().add(30, 'minute').isBefore(moment(event.end));
  // 计算透明度
  const isPast = !moment(event.end).clone().isAfter(moment());
  // 自定义的颜色和背景色,透明度
  const styleObj = {
    color: event.textColor || '#ffffff',
    background: event.color || '#6ba9ff',
    borderColor: event.borderColor || '#6ba9ff',
  };
  // 日程title的高度
  const weekViewEventHight = getWeekViewEventHeight(moment(event.start), moment(event.end));
  return (
    <div style={{ height: '100%', width: '100%', background: '#ffffff' }}>
      <div
        className={classnames(styles.detailOuter, {
          [styles.isPast]: judgePast && isPast,
        })}
        style={styleObj}
      >
        {isAllDayOrCross ? (
          <span>{event.summary || getIn18Text('WUZHUTI')}</span>
        ) : (
          <span className={styles.detailInner}>
            <span
              style={{
                maxHeight: weekViewEventHight,
                minHeight: 20,
                display: 'inline-block',
                overflow: 'hidden',
                float: 'left',
                textDecoration: 'inherit',
              }}
            >
              {event.summary || getIn18Text('WUZHUTI')}
            </span>
            {aboveHalfHour && (
              <>
                <br />
                {timeStr}
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
};
export default EventDetail;
