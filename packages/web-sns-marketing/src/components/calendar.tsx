import React from 'react';
import FullCalendar, { DatesSetArg } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import zhLocale from '@fullcalendar/core/locales/zh-cn';

export interface IMarketingCalendar {
  showHolidays?: boolean;
}

export const MarketingCalendar = () => {
  const handleDatesSet = (datesSet: DatesSetArg) => {
    console.log(datesSet.start, datesSet.end, datesSet.view, datesSet.timeZone);
  };

  return <FullCalendar plugins={[dayGridPlugin]} initialView="dayGridMonth" locale={zhLocale} datesSet={handleDatesSet} />;
};
