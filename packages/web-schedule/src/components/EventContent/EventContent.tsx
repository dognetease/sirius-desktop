import { EventContentArg } from '@fullcalendar/core';
import { ScheduleModel } from 'api';
import classnames from 'classnames';
import React from 'react';
import { FullCalendarProps } from '../../calendar';
import { InviteType, PartStatus } from '../../data';
import { NewScheduleTempId } from '../../schedule';
import { colorGhost } from '../../util';
import styles from './eventcontent.module.scss';

type renderFunc = FullCalendarProps['eventContent'];

interface EventContentProps {
  info: EventContentArg;
}

const EventContent: React.FC<EventContentProps> = ({ info }) => {
  const {
    event: { title, extendedProps = {} },
    view: { type },
  } = info;
  const data = extendedProps.data as ScheduleModel;
  const weekViewEventHight = extendedProps.weekViewEventHight as number;
  const weekViewEventTitle = extendedProps.weekViewEventTitle as string;
  const weekViewEventDispalyTime = extendedProps.weekViewEventDispalyTime as string | null;
  const {
    scheduleInfo: { color, inviteeType, partStat, id },
  } = data;
  const isTemp = id === NewScheduleTempId;
  //  受邀且未响应日程用特殊样式
  const needAction = inviteeType === InviteType.INVITEE && partStat !== PartStatus.EVENT_ACCEPTED;
  const backgroundColor = colorGhost(needAction ? undefined : color);

  // 判断是否是周视图还是月视图，渲染内容
  const renderContent = () => {
    // 周视图
    if (type === 'timeGridWeek') {
      return (
        <span className={classnames(styles.timeEvent)}>
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
            {weekViewEventTitle}
          </span>
          {weekViewEventDispalyTime && (
            <>
              <br />
              {weekViewEventDispalyTime}
            </>
          )}
        </span>
      );
    }
    return <span>{title}</span>;
  };

  return (
    <div
      id={id}
      className={classnames([styles.eventInner, 'fc-event-custom-inner'], {
        [styles.tempEvent]: isTemp,
        [styles.siriusEventInvited]: inviteeType === InviteType.INVITEE,
        [styles.siriusEventInvitedAccept]: partStat === PartStatus.EVENT_ACCEPTED,
        [styles.siriusEventInvitedReject]: partStat === PartStatus.EVENT_DECLINED,
        [styles.siriusEventInvitedTbd]: partStat === PartStatus.EVENT_TENTATIVE,
        'fc-event-custom-inner-invited': inviteeType === InviteType.INVITEE,
        'fc-event-custom-inner-invited-accept': partStat === PartStatus.EVENT_ACCEPTED,
        'fc-event-custom-inner-invited-reject': partStat === PartStatus.EVENT_DECLINED,
        'fc-event-custom-inner-invited-tentative': partStat === PartStatus.EVENT_TENTATIVE,
      })}
      style={{
        backgroundColor,
        borderColor: backgroundColor,
      }}
    >
      {renderContent()}
    </div>
  );
};

const renderEventContent: renderFunc = info => <EventContent info={info} />;

export default renderEventContent;
