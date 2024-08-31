// eslint-disable-next-line no-use-before-define
import React, { useState, useEffect } from 'react';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { apiHolder as api, getIn18Text } from 'api';

const systemApi = api.api.getSystemApi();
const timeZoneTrans = systemApi.timeZoneTrans;
interface Props {
  content: any;
}

const TimeText: React.FC<Props> = ({ content }) => {
  const {
    entry: { sendTime },
    scheduleDateTimeZone,
  } = content;
  if (!sendTime) return <></>;
  const systemTimeZone = systemApi.getSystemTimeZone();
  if (!systemTimeZone) return <></>;
  // 只有时间，没有时区
  if (sendTime && !scheduleDateTimeZone) {
    return <span className="blue">{systemTimeZone.value + ' ' + timeZoneTrans(sendTime, 8, systemTimeZone.key)?.format('YYYY-MM-DD HH:mm')}</span>;
  }

  // 并存
  if (sendTime && scheduleDateTimeZone) {
    // 相同
    if (String(systemTimeZone.key) === String(scheduleDateTimeZone)) {
      return <span className="blue">{systemTimeZone.value + ' ' + timeZoneTrans(sendTime, 8, systemTimeZone.key)?.format('YYYY-MM-DD HH:mm')}</span>;
    }
    // 不同
    const timeZoneList = systemApi.getTimeZoneList();
    const findTimeZone = timeZoneList.find(item => item.key === scheduleDateTimeZone);
    return (
      <>
        <span className="blue">{findTimeZone?.value + ' ' + timeZoneTrans(sendTime, 8, scheduleDateTimeZone)?.format('YYYY-MM-DD HH:mm')}</span>
        <span>&nbsp;({systemTimeZone.value + ' ' + timeZoneTrans(sendTime, 8, systemTimeZone.key)?.format('YYYY-MM-DD HH:mm')})</span>
      </>
    );
  }
  return <></>;
};

const ScheduleDate: React.FC<Props> = ({ content }) => {
  const [isSchedule, setIsSchedule] = useState<boolean>(false);

  useEffect(() => {
    if (content?.entry?.isScheduleSend) {
      setIsSchedule(true);
    } else {
      setIsSchedule(false);
    }
  }, [content]);

  return isSchedule ? (
    <div className="mail-schedule">
      <span className="clock-container">
        <ReadListIcons.ScheduleSvgCof fill="#0FD683" color="#0FD683" clockwiseColor="#FFF" />
      </span>
      {getIn18Text('ZHEFENGYOUJIANJIANG')}&nbsp;
      <TimeText content={content} />
      &nbsp;{getIn18Text('TOUDIDAODUIFANG')}
    </div>
  ) : (
    <></>
  );
};
export default ScheduleDate;
