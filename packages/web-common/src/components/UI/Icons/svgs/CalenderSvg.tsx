import React, { useEffect, useState } from 'react';
import { apiHolder } from 'api';
// import { ReactComponent as IconSvg } from "../../../../images/icons/calender.svg";
// import { ReactComponent as IconSvgEnh } from "../../../../images/icons/calender_enhance.svg";
const systemApi = apiHolder.api.getSystemApi();
const Text = () => {
  const [dateDay, setDateDay] = useState<number>(new Date().getDate());
  useEffect(() => {
    const t = systemApi.intervalEvent({
      handler: () => {
        setDateDay(new Date().getDate());
      },
      eventPeriod: 'extLong',
      seq: 0,
    });
    return () => {
      if (t !== undefined) {
        systemApi.cancelEvent('extLong', t);
      }
    };
  }, []);
  return (
    <span className="time-text" style={{ userSelect: 'none' }}>
      {dateDay}
    </span>
  );
};

const CalenderSvg = () => (
  <span className="sirius-icon sirius-icon-schedule">
    <Text />
  </span>
);

CalenderSvg.Enhance = () => (
  <span className="sirius-icon sirius-icon-schedule sirius-icon-schedule-enhance">
    <Text />
  </span>
);

export default CalenderSvg;
