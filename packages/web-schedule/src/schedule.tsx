import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
// import { Helmet } from 'react-helmet'
import FullCalendar from '@fullcalendar/react';

import { api, apis, catalogSettingModel, CatalogSyncRes, inWindow, ObHandler, PerformanceApi, ScheduleModel, SystemEventTypeNames, ZoneItem } from 'api';
import debounce from 'lodash/debounce';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import moment from 'moment';
import classnames from 'classnames';
import { SiriusPageProps } from '@/components/Layout/model';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import NetWatcher from '@web-common/components/UI/NetWatcher';
import SiriusCalendar, { CalendarProps } from './calendar';
import EventsGroups from './eventsgroups';
import CreateScheduleBox from './components/CreateBox/CreateBox';
import useWindowSize from '@web-common/hooks/windowResize';
import { FIR_SIDE, getBodyFixHeight } from '@web-common/utils/constant';
import scheduleTracker from './tracker';
import { ScheduleActions, useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { SchedulePageEventData } from './components/CreateBox/EventBody';
import { EventDetailPopover, EventDetailPopoverProps } from './components/EventContent/EventDetail';
import { ScheduleInsertForm } from './components/CreateBox/ScheduleForm';
import { createFakeScheduleEventData, getDateTimeByForm, getRawTime, getWeekViewEventDisplayTime, isCrossDay } from './util';
import { EnumRange, ScheduleSyncObInitiator } from './data';
import { initDefaultMoment } from './components/CreateBox/util';
import { isShowWebLayout } from '@/layouts/Main/util';
import styles from './schedule.module.scss';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { getValidStoreWidth } from '@web-common/utils/utils';
import { useLocation } from '@reach/router';
import qs from 'querystring';
import { getEvents, syncPreNextEventsToDB, getSetting, getZoneList } from './service';
import { ScheduleThunks } from '@web-common/state/reducer/scheduleReducer';
import useDebounceForEvent from '@web-common/hooks/useDebounceForEvent';
import { getIn18Text } from 'api';
import SettingDrawer from './settingDrawer';

const sysApi = api.getSystemApi();
const eventApi = api.getEventApi();
const storeApi = api.getDataStoreApi();
const performanceApi = api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
export type DateInfo = Parameters<Required<CalendarProps>['datesSet']>[0];
export interface SelectDate {
  start: Date;
  end: Date;
  allDay: boolean;
  view: {
    type: string;
  };
}
let oldUnSelectedCatalogIds: any[] = []; // 保存一下旧的未选中日历id数组,不参与渲染
export const NewScheduleTempId = 'NEW_SCHEDULE_TEMP_ID';
const STORE_SCHEDULE_WIDTH = 'STORE_SCHEDULE_WIDTH';
const tag = '[schedule]';
const Schedule: React.FC<SiriusPageProps> = () => {
  // 使用location.href来替代之前props中的active
  const location = useLocation();
  const [active, setActive] = useState(false);
  const {
    unSelectedCatalogIds,
    catalogList,
    miniSelectedDay,
    scheduleSync,
    scheduleEvent: event,
    scheduleEventList,
    weekFirstDay,
    weekNumbersVisible,
    activeStartDate,
    activeEndDate,
  } = useAppSelector(state => state.scheduleReducer);
  const [createVisible, setCreateVisible] = useState<boolean>(false);
  const [selectDate, setSelectDate] = useState<SelectDate>();
  const [settingOpen, setSettingOpen] = useState<boolean>(false);
  const [storageEvents, setStorageEvents] = useState<Map<number | string, ScheduleModel>>(new Map());
  // const [lstFetchTime, setlstFetchTime] = useState<number>(activeStartDate && activeStartDate.getTime() || Date.now());
  const dispatch = useAppDispatch();
  const size = useWindowSize(true);

  const scheduleActions = useActions(ScheduleActions);
  const [schduleLoading, setSchduleLoading] = useState<boolean>(false);
  const [eventDetailProps, setEventDetailProps] = useState<EventDetailPopoverProps | null>(null);
  const [createPosition, setCreatePosition] = useState<object>({});
  const [zoneList, setZoneList] = useState<ZoneItem[]>([]);
  const cRef = useRef<FullCalendar>(null);

  // 监听到日程变化消息通知后，直接获取本地库，不在和服务端比较
  // const syncCachedNeedCompare = useRef<boolean>(true);

  const [defaultWidth, setDefaultWidth] = useState<number>(220);
  // 跳转参数
  const stateTime = inWindow() ? history?.state?.time : undefined;
  const stateType = inWindow() ? history?.state?.type : undefined;
  const selectedCatalogList = useMemo(() => {
    return catalogList.filter(e => !unSelectedCatalogIds.includes(e.id));
  }, [catalogList, unSelectedCatalogIds]);

  // 数据缓存范围为：【今天】和【当前】月视图及他们前后的视图，最多6个视图
  // 月视图总计6周，即数据缓存最多缓存6*6 = 36周
  // 假如每周有100条数据，数据总量在 1800～3600之间，计算密集程度基本可控
  const updateStorageEvents = (
    events: ScheduleModel[],
    date: {
      start: Date;
      end: Date;
    }
  ) => {
    const { start, end } = date;
    const todayStart = moment().startOf('month').startOf('day');
    const prefixDayLoss = todayStart.isoWeekday() % 7;
    todayStart.subtract(prefixDayLoss, 'day').subtract(6, 'week');
    const todayEnd = todayStart.clone().add(6 * 3, 'week');
    const currentRangeEvents: Map<string | number, ScheduleModel> = new Map();
    // 数据被增/改
    events.forEach(e => {
      storageEvents.set(e.scheduleInfo.id, e);
      currentRangeEvents.set(e.scheduleInfo.id, e);
    });
    storageEvents.forEach((e, id, m) => {
      const eventStart = moment(e.scheduleInfo.start);
      const eventEnd = moment(e.scheduleInfo.end);
      const eventInCurrentDateRange = eventStart.isBetween(start, end) || eventEnd.isBetween(start, end);
      const eventOverlapLimitedRange = eventStart.isBetween(todayStart, todayEnd) || eventEnd.isBetween(todayStart, todayEnd);
      if (!(eventInCurrentDateRange || eventOverlapLimitedRange) || (eventInCurrentDateRange && !currentRangeEvents.has(id))) {
        m.delete(id);
      }
    });
    setStorageEvents(() => {
      return storageEvents;
    });
    return Array.from(storageEvents.values());
  };
  /** 调整日历视图大小以适应容器 */
  const updateCalendarSize = useCallback(
    debounce((_, data) => {
      const {
        size: { width },
      } = data;
      cRef.current?.getApi().updateSize();
      // TODO 调整左侧宽度，保存width into storage
      storeApi.putSync(STORE_SCHEDULE_WIDTH, width, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' });
    }, 60),
    [cRef]
  );

  const updateEvents = (events: ScheduleModel[], requestParams: { start: Date; end: Date }, isAsyncData?: boolean) => {
    const storedEvents = updateStorageEvents(events, {
      start: requestParams.start,
      end: requestParams.end,
    });
    dispatch(ScheduleThunks.updateSchduleList({ data: storedEvents, requestParams: { start: requestParams.start, end: requestParams.end }, isAsyncData }));
    console.log(tag, 'updateMiniCalendarMap updateEvents', unSelectedCatalogIds);
    // debouncedUpdateMiniCalendarMap();
    return storedEvents;
  };
  const scheduleEventTaskExecuter = (options: { fetchParams: Parameters<typeof getEvents> }) => {
    performanceApi.time({
      statKey: 'schedule_data_render',
    });
    // const { onSyncing, eventsCallback, calendarRef } = this.props;
    const { fetchParams } = options;
    let storedEvents: ScheduleModel[] = [];
    const startTime = moment(fetchParams[0].start);
    const endTime = moment(fetchParams[0].end);
    startTime.subtract(6, 'week');
    endTime.add(6, 'week');
    // onSyncing(true);
    setSchduleLoading(true);
    // this.scheduleSyncing = true;
    getEvents(...fetchParams)
      .then(events => {
        if (Array.isArray(events)) {
          storedEvents = updateEvents(events, { start: startTime.toDate(), end: endTime.toDate() }, true);
          setTimeout(() => {
            performanceApi.timeEnd({
              statKey: 'schedule_data_render',
              params: {
                event_count: events.length,
              },
            });
          }, 0);
        }
      })
      .finally(() => {
        setSchduleLoading(false);
        try {
          // 月视图正常备份， 周视图情况下当前周内日期不跨月不请求异步更新db
          syncPreNextEventsToDB(...fetchParams).then(res => {
            updateEvents([...storedEvents, ...res], { start: startTime.toDate(), end: endTime.toDate() }, true);
          });
        } catch (error) {
          console.warn('calendar sync db error:', error);
        }
      });
  };
  useEffect(() => {
    const storedWidth = getValidStoreWidth(storeApi.getSync(STORE_SCHEDULE_WIDTH, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' }));
    if (storedWidth > 0) {
      setDefaultWidth(storedWidth);
    }
    if (stateType) {
      cRef.current?.getApi().changeView(stateType);
    }
    if (stateTime) {
      // scheduleActions.setMiniSelectedDay(moment(+stateTime));
      cRef.current?.getApi().gotoDate(new Date(+stateTime));
    }
    getZoneList().then((res: ZoneItem[]) => {
      setZoneList(res);
    });
  }, []);

  // 监听路由变化
  useEffect(() => {
    try {
      const params = qs.parse(location.hash.split('?')[1]);
      const page = params.page as string;
      // 如果是跳转到邮件模块
      if (location.hash === '#schedule' || page === 'schedule') {
        setActive(true);
      } else {
        setActive(false);
      }
    } catch (e) {
      console.error('[schedule useEffect location.hash err]', e);
    }
  }, [location.hash]);

  useEffect(() => {
    if (selectedCatalogList.length) {
      console.log(tag, 'selectedCatalogList change');
      debouncedFetchEventList();
    }
  }, [selectedCatalogList]);

  /**
   * scheduleSync 日程同步标记
   * catalogList 日历列表
   * 以上 任一发生变化 则重新获取数据
   */
  useEffect(() => {
    const createTempId = Date.now();
    try {
      // 在新建或删除日程时，先插入（一个假的）或直接删除数据，再同步服务端，加快反应速度
      // todo update类型的时候能够更新数据（可能造成视图层和数据层 数据不一致？）
      if (scheduleSync?.type === 'add' && scheduleSync.data) {
        const { data } = scheduleSync as {
          data: ScheduleInsertForm;
        };
        const tempData = createFakeScheduleEventData(data, createTempId);
        cRef.current?.getApi().addEvent(tempData);
      } else if (scheduleSync?.type === 'delete' && scheduleSync.data) {
        const { data } = scheduleSync as {
          data: ScheduleModel;
        };
        const deletedUid = data.scheduleInfo.uid;
        cRef.current?.getApi().batchRendering(() => {
          cRef.current?.getApi().getEventById(data.scheduleInfo.id)?.remove();
          if (scheduleSync.opRange === EnumRange.ALL) {
            cRef.current
              ?.getApi()
              .getEvents()
              .forEach(e => {
                if (e.extendedProps?.data?.scheduleInfo?.uid === deletedUid) {
                  e.remove();
                }
              });
          }
          if (scheduleSync.opRange === EnumRange.THIS_AND_FUTURE) {
            cRef.current
              ?.getApi()
              .getEvents()
              .forEach(e => {
                if (e.extendedProps?.data?.scheduleInfo?.uid === deletedUid && e.start && e.start.getTime() > data.scheduleInfo.start) {
                  e.remove();
                }
              });
          }
        });
      }
    } catch (error) {
      console.warn('Handle Temp Schedule Error');
    }
    // 手动发起的refetch 均认为不是切换视图时间的操作
    // 比如上述代码的增加、删除、更新*等
    // 要求即时获取数据，而不是走事件通知机制
    // 因为事件通知机制会先返回DB里的数据，这个时候数据还和服务端同步
    // syncCachedDataFirst.current = false;
    // cRef.current?.getApi().refetchEvents();
    debouncedFetchEventList(false, true);
    // syncCachedDataFirst.current = true;
    // 移除临时加入的数据
    cRef.current?.getApi().getEventById(createTempId.toString())?.remove();
  }, [scheduleSync]);

  const removeEventsByCatalogId = () => {
    if (oldUnSelectedCatalogIds.length < unSelectedCatalogIds.length) {
      setSchduleLoading(true);
      const unSelectedId = unSelectedCatalogIds.filter(i => !oldUnSelectedCatalogIds.includes(i))[0];
      if (unSelectedId) {
        const allevents = cRef.current?.getApi().getEvents();
        // const start = cRef.current?.getApi().view.currentStart;
        // const end = cRef.current?.getApi().view.currentEnd;
        cRef.current?.getApi().batchRendering(() => {
          allevents &&
            allevents.forEach(e => {
              const catlogId = e.extendedProps?.data?.scheduleInfo?.catalogId;
              if (catlogId === unSelectedId) {
                e.remove();
              }
            });
        });
        // scheduleActions.updateScheduledDatelist
        dispatch(ScheduleThunks.updateScheduledDateList({}));
      }
      // 兼容不变化的问题
      setTimeout(() => {
        setSchduleLoading(false);
      }, 0);
    }
    oldUnSelectedCatalogIds = unSelectedCatalogIds;
  };
  useEffect(() => {
    if (unSelectedCatalogIds.length < oldUnSelectedCatalogIds.length) {
      cRef.current?.getApi().refetchEvents();
    }
    removeEventsByCatalogId();
  }, [unSelectedCatalogIds]);
  // 监听跳转参数发生变化
  // useEffect(() => {
  //   if (stateType) {
  //     cRef.current?.getApi().changeView(stateType);
  //   }
  // }, [stateType]);
  // useEffect(() => {
  //   if (stateTime) {
  //     // cRef.current?.getApi().gotoDate(moment(+stateTime).toDate());
  //     scheduleActions.setMiniSelectedDay(moment(+stateTime));
  //   }
  // }, [stateTime]);

  // 如果是日历取消选中，则先移除当前日历的日程
  // 日历简图变化监听，同步主视图
  useEffect(() => {
    // 如果不在当前主视图显示范围内，控制跳转
    const start = cRef.current?.getApi().view.currentStart;
    const end = cRef.current?.getApi().view.currentEnd;
    if (!miniSelectedDay.isBetween(moment(start), moment(end), 'day', '[)')) {
      cRef.current?.getApi().gotoDate(miniSelectedDay.toDate());
    }
    syncCalendarActiveDateRange();
    debouncedFetchEventList();
  }, [miniSelectedDay]);
  const calcMonthRangeByWeekView = (start: Moment, end: Moment) => {
    // 周视图下，日历简图的日程信息不完整，日程获取前后扩充到小视图显示的月份
    let startTime = moment(start);
    let endTime = moment(end);
    // 如果是日历主视图发起的日期切换，则此时小视图选择的当前时间还未切换，需要兼容这种情况
    startTime = (miniSelectedDay.isBetween(startTime, endTime) ? miniSelectedDay : startTime).clone().startOf('month').startOf('week');
    // const prefixDayLoss = startTime.day() % 7;
    // startTime.subtract(prefixDayLoss, 'day');
    endTime = startTime.clone().add(6, 'week');
    return { start: startTime, end: endTime };
  };
  // 日程信息回调
  // const eventsCallback = evts => {
  //   setEventsExistMap(evts);
  // };
  const fetchEventList = (cached = true, needCompare = true) => {
    const start = cRef.current?.getApi().view.activeStart; //  rangeInfo.start; //
    const end = cRef.current?.getApi().view.activeEnd;
    console.log(tag, 'fetchEventList inside', start, end, selectedCatalogList);
    if (selectedCatalogList?.length && miniSelectedDay.isBetween(moment(start), moment(end), 'day', '[)')) {
      // if(lstFetchTime === start?.getTime()){
      //   return;
      // }
      // start && setlstFetchTime(start?.getTime())
      const catalogIds = selectedCatalogList.map(e => Number(e.id));
      const weekView = cRef.current?.getApi().view.type === 'timeGridWeek';
      // 周视图下，日历简图的日程信息不完整，日程获取前后扩充到小视图显示的月份
      let startTime = moment(start);
      let endTime = moment(end);
      if (weekView) {
        const { start: _start, end: _end } = calcMonthRangeByWeekView(startTime, endTime);
        startTime = _start;
        endTime = _end;
      }
      // startTime.subtract(6, 'week');
      // endTime.add(6, 'week');
      scheduleEventTaskExecuter({
        fetchParams: [
          {
            start: startTime.toDate(),
            end: endTime.toDate(),
            catalogIds,
          },
          cached,
          needCompare,
        ],
      });
    }
  };

  const syncCalendarActiveDateRange = () => {
    let start = cRef.current?.getApi().view.activeStart; //  rangeInfo.start; //
    let end = cRef.current?.getApi().view.activeEnd;
    const momStart = moment(start);
    const momEnd = moment(end);
    const weekView = cRef.current?.getApi().view.type === 'timeGridWeek';
    if (start && end && miniSelectedDay.isBetween(momStart, momEnd, 'day', '[)')) {
      if (weekView) {
        const { start: _start, end: _end } = calcMonthRangeByWeekView(momStart, momEnd);
        start = _start.toDate();
        end = _end.toDate();
      }
      if (start !== activeStartDate) {
        scheduleActions.setActiveStartDate(start);
      }
      if (end !== activeEndDate) {
        scheduleActions.setActiveEndDate(end);
      }
    }
  };

  const debouncedFetchEventList = useDebounceForEvent(fetchEventList, 500, { leading: false });
  // 日历主视图，日期变化回调
  const onDatesSetCallBack = useCallback(() => {
    // 如果不在当前主视图显示范围内，控制跳转
    const start = cRef.current?.getApi().view.currentStart; //  rangeInfo.start; //
    const end = cRef.current?.getApi().view.currentEnd; // rangeInfo.end; //
    console.log(tag, '[schedule] onDatesSetCallBack', start, end);
    if (start && end && !miniSelectedDay.isBetween(moment(start), moment(end), 'day', '[)')) {
      if (moment().isBetween(moment(start), moment(end), 'day', '[)')) {
        scheduleActions.setMiniSelectedDay(moment());
      } else {
        scheduleActions.setMiniSelectedDay(moment(start));
      }
    }
  }, [miniSelectedDay, selectedCatalogList]);

  useEffect(() => {
    const scheduleListeners: Array<{
      eventId?: number;
      eventName: SystemEventTypeNames;
      eventHandler: ObHandler;
    }> = [
      {
        eventName: 'syncSchedule',
        eventHandler: e => {
          if (e.eventStrData === ScheduleSyncObInitiator.MAIN_MODULE) {
            e.eventData && SiriusMessage.success({ content: e.eventData.msg });
            scheduleActions.syncSchedule();
          }
        },
      },
      {
        eventName: 'catalogNotify',
        eventHandler: e => {
          const b = Object.entries(e.eventData as CatalogSyncRes).some(([key, value]) => {
            if (key === 'schedule' || key === 'scheduleContact') {
              return value.hasDiff;
            }
            return false;
          });
          if (b) {
            // syncCachedNeedCompare.current = false;
            // todo 更新redux
            // cRef.current?.getApi().refetchEvents();
            debouncedFetchEventList(true, false);
            // syncCachedNeedCompare.current = true;
          }
        },
      },
    ];
    if (active) {
      scheduleListeners.forEach(e => {
        e.eventId = eventApi.registerSysEventObserver(e.eventName, { func: e.eventHandler });
      });
    }
    return () => {
      scheduleListeners.forEach(({ eventName, eventId }) => {
        if (eventId !== undefined) {
          eventApi.unregisterSysEventObserver(eventName, eventId);
        }
      });
    };
  }, [active]);
  // 监听跨窗口redux修改事件
  useMsgRenderCallback('syncScheduleState', e => {
    const { reducerName, newState } = e.eventData || {};
    if (reducerName && (scheduleActions as any)[reducerName]) {
      (scheduleActions as any)[reducerName](newState);
    }
  });
  // 创建临时event
  const createTempEvent = useCallback<Exclude<CalendarProps['select'], undefined>>(date => {
    if (cRef.current?.getApi().getEventById(NewScheduleTempId) === null) {
      const monthView = date.view.type === 'dayGridMonth';
      cRef.current?.getApi().addEvent({
        start: !monthView ? date.start : moment(date.start).startOf('day').toDate(),
        end: !monthView ? date.end : moment(date.end).endOf('day').toDate(),
        allDay: monthView ? !0 : date.allDay,
        id: NewScheduleTempId,
        title: getIn18Text('XINJIANRICHENG'),
        display: !monthView && !date.allDay ? 'background' : undefined,
        classNames: classnames('fc-temp-event', {
          // 'fc-temp-event-monthview': monthView,
          'fc-temp-event-weekview-allday': !monthView && date.allDay,
          'fc-temp-event-weekview': !monthView,
        }),
        extendedProps: {
          highOrder: -1,
          customOrder: -2,
          weekViewEventTitle: getIn18Text('XINJIANRICHENG'),
          weekViewEventDispalyTime: getWeekViewEventDisplayTime(moment(date.start), moment(date.end), date.allDay),
          data: {
            scheduleInfo: {
              id: NewScheduleTempId,
            },
          },
        },
      });
    }
  }, []);
  /** 周视图 时间联动 */
  const handleTimeRelatedValuesChange = (values: ScheduleInsertForm) => {
    const newEventTempEvent = cRef.current?.getApi().getEventById(NewScheduleTempId);
    if (!newEventTempEvent || cRef.current?.getApi().view.type !== 'timeGridWeek') {
      return;
    }
    const {
      moments: { startDate, startTime, endDate, endTime },
      time: { allDay },
    } = values;
    if (!startDate || !endDate || !startTime || !endTime) {
      return;
    }
    const start = moment(getRawTime(getDateTimeByForm(startDate, startTime, !!allDay)));
    const end = moment(getRawTime(getDateTimeByForm(endDate, endTime, !!allDay)));
    if (allDay) {
      end.add(1, 'day');
    }
    const isEndDateStartOfDay = end.isSame(end.clone().startOf('day'));
    const behaviorAsAllday = isCrossDay(start, isEndDateStartOfDay ? end.clone().subtract(1, 'day') : end);
    if (end.isSameOrBefore(start)) {
      return;
    }
    const displayTime = getWeekViewEventDisplayTime(start, end, behaviorAsAllday);
    cRef.current.getApi().batchRendering(() => {
      newEventTempEvent.setExtendedProp('weekViewEventDispalyTime', displayTime);
      newEventTempEvent.setProp(
        'classNames',
        classnames('fc-temp-event', {
          'fc-temp-event-weekview': !0,
          'fc-temp-event-weekview-allday': behaviorAsAllday || allDay,
        })
      );
      newEventTempEvent.setProp('display', behaviorAsAllday || allDay ? undefined : 'background');
      newEventTempEvent.setDates(start.toDate(), behaviorAsAllday && !allDay && !isEndDateStartOfDay ? end.clone().add(1, 'day').toDate() : end.toDate(), {
        allDay: behaviorAsAllday || !!allDay,
      });
    });
    if (!(behaviorAsAllday || allDay)) {
      const gridLiquid = document.querySelector('.fc-scroller.fc-scroller-liquid-absolute');
      if (gridLiquid) {
        const gridLiquidHeight = gridLiquid.scrollHeight;
        gridLiquid.scrollTo(0, gridLiquidHeight * (start.hour() / 24));
      }
    }
    setCreatePosition({});
  };
  // 处理选中日期
  const handleSelectDate = useCallback<Exclude<CalendarProps['select'], undefined>>(
    date => {
      if (eventDetailProps) {
        setEventDetailProps(null);
        return;
      }
      const realDate = { ...date };
      // 如果是周视图，则处理一下结束时间
      if (cRef.current?.getApi().view.type === 'timeGridWeek') {
        realDate.end = moment(date.end).clone().add(30, 'minute').toDate();
        realDate.endStr = moment(date.end).clone().add(30, 'minute').toDate().toString();
      }
      setTimeout(() => {
        createTempEvent(realDate);
        setSelectDate(realDate);
        setCreateVisible(!0);
        scheduleTracker.pc_schedule_detail_show('blank');
      }, 200);
    },
    [eventDetailProps]
  );
  const handleSettingClick = useCallback(() => {
    setSettingOpen(true);
  }, []);
  const handleSettingClose = useCallback(
    (_weekFirstDay: number, _weekNumbersVisible: boolean, settingZoneList: number[], showSecondaryZone: boolean) => {
      if (_weekFirstDay !== weekFirstDay) {
        scheduleActions.setWeekFirstDay(_weekFirstDay);
      }
      scheduleActions.setSettingZoneList(settingZoneList);
      scheduleActions.setShowSecondaryZone(showSecondaryZone);
      if (_weekNumbersVisible !== weekNumbersVisible) {
        scheduleActions.setWeekNumbersVisible(_weekNumbersVisible);
      }
      setSettingOpen(false);
    },
    [weekFirstDay, weekNumbersVisible]
  );
  // 创建日程窗口关闭
  const handelCreateCancel = () => {
    setCreateVisible(false);
    setSelectDate(undefined);
    // cRef.current?.getApi().getEventById(NewScheduleTempId)?.remove();
    scheduleActions.changeScheduleEvent(null);
    scheduleActions.setScheduleEditFrom('');
  };
  const handleEventClick: CalendarProps['eventClick'] = ({ event: clickEvent, el, jsEvent }) => {
    jsEvent.stopPropagation();
    if (clickEvent.extendedProps.fake) {
      return;
    }
    const rect = el.getBoundingClientRect();
    scheduleTracker.pc_schedule_detail();
    // 重置内容
    if (eventDetailProps) {
      setEventDetailProps(null);
    }
    setEventDetailProps({
      onDelete: () => {},
      onAction: () => {},
      virtualReference: {
        getBoundingClientRect: () => ({
          x: rect.x,
          y: rect.y,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          toJSON: () => rect.toJSON(),
        }),
      },
      initEventData: clickEvent.extendedProps.data,
    });
  };
  // 去掉临时event
  const showBox = !!event || createVisible;
  useEffect(() => {
    if (!showBox) {
      cRef.current?.getApi().getEventById(NewScheduleTempId)?.remove();
    }
  }, [showBox]);
  const syncCancel = () => {
    cRef.current?.getApi().getEventById(NewScheduleTempId)?.remove();
  };
  // 点击左侧新建日程，直接弹出创建窗口
  const handleCreateDirect = () => {
    const curHour = moment().hour();
    const curMinute = moment().minute();
    const defaultMoment = initDefaultMoment(miniSelectedDay.clone().hour(curHour).minutes(curMinute));
    const creatDirectStartTime = defaultMoment.startTime;
    const creatDirectEndTime = defaultMoment.endTime;
    if (sysApi.isElectron()) {
      const initData: SchedulePageEventData = {
        catalogList,
        unSelectedCatalogIds,
        creatDirectStartTimeStr: creatDirectStartTime.format('YYYY-MM-DD HH:mm'),
        creatDirectEndTimeStr: creatDirectEndTime.format('YYYY-MM-DD HH:mm'),
      };
      sysApi.createWindowWithInitData('scheduleOpPage', { eventName: 'initPage', eventData: initData });
    } else {
      scheduleActions.setCreatDirectStartTime(creatDirectStartTime);
      scheduleActions.setCreatDirectEndTime(creatDirectEndTime);
      setCreateVisible(!0);
    }
  };
  // 修正more event popover 的位置问题
  const moreLinkClick = useCallback(() => {
    setTimeout(() => {
      const fcPopoverDom = document.querySelector<HTMLDivElement>('.fc-popover.fc-more-popover');
      if (fcPopoverDom) {
        const fcPopoverParent = fcPopoverDom.parentElement as HTMLDivElement;
        try {
          if (fcPopoverDom.offsetHeight + fcPopoverDom.offsetTop > fcPopoverParent.offsetHeight) {
            fcPopoverDom.style.bottom = '0px';
            fcPopoverDom.style.top = 'auto';
          }
        } catch (error) {
          throw new Error('Calendar:Position Auto Fit Failed');
        }
      }
    }, 0);
  }, []);

  useEffect(() => {
    getSetting().then((res: catalogSettingModel) => {
      const weekFirstNumber = res.wkst === 7 ? 0 : res.wkst;
      handleSettingClose(weekFirstNumber, !!res?.commonSetting?.showWeekNumber, res?.commonSetting?.secondaryZoneIds || [], !!res?.commonSetting?.showSecondaryZone);
    });
    const fn = () => {
      setEventDetailProps(null);
    };
    // console.log(tag, '[schedule] fetchEventList')
    // fetchEventList();
    window.addEventListener('click', fn);
    return () => window.removeEventListener('click', fn);
  }, []);

  return (
    <>
      {showBox && (
        <CreateScheduleBox
          updatePostion={createPosition}
          onTimeRelatedValuesChange={handleTimeRelatedValuesChange}
          selectDate={selectDate}
          onSyncCancel={syncCancel}
          onCancel={handelCreateCancel}
          getReferenceElement={() => document.getElementById(event?.scheduleInfo.id || NewScheduleTempId)}
        />
      )}
      {eventDetailProps && <EventDetailPopover onClose={() => setEventDetailProps(null)} {...eventDetailProps} />}
      <PageContentLayout allowDark id="schduleModule" className={`${sysApi.isWebWmEntry() && styles.pageContentWm}`}>
        {/* 日历列表工具栏 */}
        <SideContentLayout
          className={isShowWebLayout() ? 'web-layout-border' : ''}
          borderRight
          minWidth={FIR_SIDE}
          defaultWidth={defaultWidth}
          onResize={updateCalendarSize}
        >
          {/* 提高到上层组件 */}
          {/* <Helmet >
                <title>{`网易灵犀办公-${tag}`}</title>
            </Helmet> */}
          <NetWatcher />
          <EventsGroups
            active={active}
            schduleLoading={schduleLoading}
            onCreate={handleCreateDirect}
            onGotoDate={d => {
              cRef.current?.getApi().gotoDate(d);
            }}
          />
        </SideContentLayout>
        {/* 日历组件 */}
        <OverlayScrollbarsComponent
          options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 0 } }}
          style={{
            // minWidth: 692,
            minWidth: 537,
            position: 'absolute',
            left: 0,
            right: 0,
            top: getBodyFixHeight(true),
            bottom: 0,
          }}
          className="dark-white-bg"
        >
          <SiriusCalendar
            size={size}
            calendarRef={cRef}
            select={handleSelectDate}
            settingClick={handleSettingClick}
            datesSet={onDatesSetCallBack}
            eventClick={handleEventClick}
            moreLinkClick={moreLinkClick}
            events={scheduleEventList}
          />
          <SettingDrawer visible={settingOpen} handleClose={handleSettingClose} />
        </OverlayScrollbarsComponent>
      </PageContentLayout>
    </>
  );
};
export default Schedule;
