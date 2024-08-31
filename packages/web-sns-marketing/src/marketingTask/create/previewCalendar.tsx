import { getIn18Text } from 'api';
import React, { useState, useEffect } from 'react';
import FullCalendar, { EventContentArg, EventClickArg } from '@fullcalendar/react';
import moment from 'moment';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction'; // for selectable
import zhLocale from '@fullcalendar/core/locales/zh-cn';
import { api, SnsCalendarEvent, SnsMarketingApi, SnsPostStatus } from 'api';

import { SnsCalendarUiEvent, transformToUiEvent } from '../../utils/index';
import { SnsCalendarEventContent } from '../../components/calendarEventContent';
import { useAppSelector } from '@web-common/state/createStore';
import PostEditModal from '../../components/PostEditModal';

const snsMarketingApi = api.requireLogicalApi('snsMarketingApiImpl') as unknown as SnsMarketingApi;
const moreLinkContent = (args: any) => {
  return getIn18Text('HAIYOUGENGDUO') + args.num + getIn18Text('GETIEZI');
};

export const PreviewCalendar = () => {
  const [events, setEvents] = useState<SnsCalendarUiEvent[]>([]);
  const [editModal, setEditModal] = useState<{ postDbId: string }>();

  const currentTask = useAppSelector(state => state.snsMarketingTaskReducer.currentTask);
  const startDate = currentTask.plan?.startTime;

  const fetchData = () => {
    const start = moment(startDate || undefined)
      .startOf('day')
      .valueOf();
    // 默认5周长度
    const end = moment(start)
      .add(5 * 7, 'day')
      .valueOf();
    return snsMarketingApi
      .getSnsCalendar({
        taskId: currentTask.taskId,
        startDate: start,
        endDate: end,
      })
      .then(res => {
        const list = [...res.calendarList].filter(event => event.postStatus !== SnsPostStatus.DELETED);
        setEvents(transformToUiEvent(list));
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditPost = (e: SnsCalendarEvent) => {
    setEditModal({ postDbId: e.postDbId });
  };

  return (
    <div>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        viewClassNames="sns-marketing-fc-view"
        eventClassNames="fc-custom-event"
        initialView="customDayGridMonth"
        views={{
          customDayGridMonth: {
            type: 'dayGrid',
            duration: { weeks: 5 },
          },
        }}
        initialDate={startDate}
        locale={zhLocale}
        dayMaxEventRows={9}
        events={events}
        eventContent={(args: EventContentArg) =>
          SnsCalendarEventContent(args as any, {
            onEditPost: handleEditPost,
            getContainer: () => document.getElementById('sns-task-create-root')!,
          })
        }
        moreLinkContent={moreLinkContent}
        dayCellContent={args => args.dayNumberText.slice(0, -1)}
        // eventClick={handleEventClick}
      />
      <PostEditModal
        visible={editModal !== undefined}
        postDbId={editModal?.postDbId}
        onCancel={() => setEditModal(undefined)}
        onFinish={() => {
          fetchData();
          setEditModal(undefined);
        }}
      />
    </div>
  );
};
