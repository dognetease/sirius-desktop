/* eslint-disable react/sort-comp */
import React, { useMemo } from 'react';
import ReactDom from 'react-dom';
import momentTz from 'moment-timezone';
import FullCalendar, { DateFormatter, DatesSetArg, EventInput, FormatterInput, NowIndicatorContentArg, SlotLabelContentArg, ViewMountArg } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import rrulePlugin from '@fullcalendar/rrule';
import interactionPlugin from '@fullcalendar/interaction';
import cnLocale from '@fullcalendar/core/locales/zh-cn';
import enLocale from '@fullcalendar/core/locales/en-gb';
import zhTradLocale from '@fullcalendar/core/locales/zh-tw';
import './calendar.overload.scss';
import { api, configKeyStore, inWindow, ScheduleModel, Lang, DEFAULT_LANG, ZoneItem } from 'api';
import moment, { Moment } from 'moment';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Tooltip } from 'antd';
import { navigate } from 'gatsby';
import omit from 'lodash/omit';
import useWindowSize from '@web-common/hooks/windowResize';
import renderEventContent from './components/EventContent/EventContent';
import renderDayCellContent from './components/DayCellContent/DayCellContent';
import { eventDataTransform, formatDayPopoverTitle } from './util';
import { renderMoreLinkContent } from './components/MoreLinkContent/morelinkcontent';
import { getBodyFixHeight, PAGE_MIN_HEIGHT } from '@web-common/utils/constant';
import { RootState } from '@web-common/state/createStore';
import scheduleTracker from './tracker';
import { getIn18Text } from 'api';
import ScheduleTimezoneSelect from '@web-common/components/ScheduleTimeZoneSelect/scheduleTimeZoneSelect';
const storeApi = api.getDataStoreApi();
const sysApi = api.getSystemApi();
const eventApi = api.getEventApi();

export type FullCalendarProps = FullCalendar['props'];
export interface CalendarProps extends FullCalendarProps {
  calendarRef: React.RefObject<FullCalendar>;
  size: ReturnType<typeof useWindowSize>;
  miniSelectedDay: Moment;
  weekFirstDay: number;
  weekNumbersVisible: boolean;
  showSecondaryZone: boolean;
  lastSelectTimezone: ZoneItem;
  settingClick: () => void;
}
export interface CalendarState {
  now: Moment;
  detory: boolean;
  // guideVisble: boolean;
  customBtnPortal: React.ReactPortal | null;
  customSettingBtn: React.ReactPortal | null;
  customWeekNumberBtn: React.ReactPortal | null;
  initialView: string;
}
/** 日历头部导航工具栏高度 */
const CalendarToolBarHeight = 60;
const { scheduleTabOpenInWindow } = configKeyStore;
// 打点
const hubbleEvent = (ev: MouseEvent) => {
  if (window && document && ev.target && SiriusCalendar.viewType) {
    if (document.querySelector('button.fc-prev-button')?.contains(ev.target as HTMLElement)) {
      scheduleTracker.pc_schedule_change({
        type: 'previous',
        view: SiriusCalendar.viewType,
      });
    }
    if (document.querySelector('button.fc-next-button')?.contains(ev.target as HTMLElement)) {
      scheduleTracker.pc_schedule_change({
        type: 'next',
        view: SiriusCalendar.viewType,
      });
    }
    if (document.querySelector('button.fc-today-button')?.contains(ev.target as HTMLElement)) {
      scheduleTracker.pc_schedule_change({
        type: 'today',
        view: SiriusCalendar.viewType,
      });
    }
  }
};
class SiriusCalendar extends React.PureComponent<CalendarProps, CalendarState> {
  private timer: ReturnType<typeof sysApi.intervalEvent>;
  private lang: Lang = DEFAULT_LANG;
  constructor(props: CalendarProps) {
    super(props);
    // this.eventSource = debounce(this.eventSource.bind(this), 500);
    this.updateNow = this.updateNow.bind(this);
    this.slotLabelContent = this.slotLabelContent.bind(this);
    this.lang = sysApi.getSystemLang();
    this.state = {
      now: moment(),
      detory: false,
      // 上线引导是否展示
      // guideVisble: false,
      customBtnPortal: null,
      customSettingBtn: null,
      customWeekNumberBtn: null,
      initialView: 'dayGridMonth',
    };
  }
  componentDidMount() {
    // 10分钟判断一次
    this.timer = sysApi.intervalEvent({
      eventPeriod: 'extLong',
      handler: () => {
        this.updateNow();
      },
      seq: 1,
    });
    // 前后按钮title去掉
    if (window && document) {
      document.querySelector('.fc-prev-button.fc-button.fc-button-primary')!.title = '';
      document.querySelector('.fc-next-button.fc-button.fc-button-primary')!.title = '';
    }
    this.bindHubbleEvent();
  }
  componentWillUnmount() {
    if (this.timer !== undefined) {
      sysApi.cancelEvent('extLong', this.timer);
    }
    this.unBindHubbleEvent();
  }

  getToobarWeeksNumber = () => {
    const weekNumerBtn = document.querySelector('button.fc-weekNumberTitle-button');
    const displayWeekTitle = this.props.weekNumbersVisible && this.state.initialView === 'timeGridWeek';
    if (weekNumerBtn) {
      return ReactDom.createPortal(
        <span style={{ height: '100%', width: '100%', display: displayWeekTitle ? 'block' : 'none' }}>
          {getIn18Text('DIWEEKZHOU', { week: moment(this.props.miniSelectedDay).weeks() })}
        </span>,
        weekNumerBtn
      );
    }
  };
  mountCustomBtn = () => {
    const independedBtn = document.querySelector('button.fc-independed-button');
    const dependedBtn = document.querySelector('button.fc-depended-button');
    const settingsBtn = document.querySelector('button.fc-settings-button');
    const { settingClick } = this.props;
    if (independedBtn) {
      this.setState({
        customBtnPortal: ReactDom.createPortal(
          <Tooltip title={getIn18Text('ZAIDULICHUANGKOU')} placement="bottom">
            <span
              style={{ height: '100%', width: '100%', display: 'block' }}
              onClick={() => {
                sysApi.createWindow('schedule');
                navigate('/#mailbox');
                storeApi.put(scheduleTabOpenInWindow?.keyStr || '', String(true));
              }}
            />
          </Tooltip>,
          independedBtn
        ),
      });
    }
    if (dependedBtn) {
      this.setState({
        customBtnPortal: ReactDom.createPortal(
          <Tooltip title={getIn18Text('GUANBIDULICHUANG')} placement="bottom">
            <span
              style={{ height: '100%', width: '100%', display: 'block' }}
              onClick={() => {
                eventApi.sendSysEvent({
                  eventName: 'routeChange',
                  eventData: {
                    name: 'schedule',
                  },
                });
                storeApi.put(scheduleTabOpenInWindow?.keyStr || '', String(false));
                sysApi.closeWindow(true);
              }}
            />
          </Tooltip>,
          dependedBtn
        ),
      });
    }
    if (settingsBtn) {
      this.setState({
        customSettingBtn: ReactDom.createPortal(
          <Tooltip title={getIn18Text('SHEZHI')} placement="bottom">
            <span
              style={{ height: '100%', width: '100%', display: 'block' }}
              onClick={() => {
                settingClick();
              }}
            />
          </Tooltip>,
          settingsBtn
        ),
      });
    }
  };
  // 绑定打点
  bindHubbleEvent = () => {
    if (window && document) {
      document.addEventListener('click', hubbleEvent);
    }
  };
  // 解除绑定打点
  unBindHubbleEvent = () => {
    if (window && document) {
      document.removeEventListener('click', hubbleEvent);
    }
  };
  // 添加已经过去时间的css类
  eventClasses: FullCalendarProps['eventClassNames'] = content => {
    const {
      event: {
        end,
        extendedProps: {
          data: {
            scheduleInfo: { start, end: realEnd },
          },
        },
      },
    } = content;
    const { now } = this.state;
    if (moment(end).isSameOrBefore(now.startOf('days'))) {
      return [...new Set([...content.event.classNames, 'fc-event-past'])];
    }
    if (start && realEnd && moment(start).isSame(moment(realEnd))) {
      return [...new Set([...content.event.classNames, 'fc-event-start-end-same'])];
    }
    return content.event.classNames;
  };
  // 周视图时间轴自定义
  slotLabelContent = (arg: SlotLabelContentArg) => {
    const showSecondaryZone = this.props.showSecondaryZone && this.props.lastSelectTimezone && arg.date;
    const timeDiff = showSecondaryZone ? this.props.lastSelectTimezone?.totalSeconds / 60 / 60 + new Date().getTimezoneOffset() / 60 || 0 : 0;
    const timezoneText = showSecondaryZone ? moment(arg.date).add(timeDiff, 'hour').format('HH:mm') : arg.text;
    return (
      <div className="slotLabelCustom">
        <span
          className={classNames(
            'slotLabelCustomSpan',
            {
              slotLabelCustomSpanFirst: arg.text === '24:00' || arg.text === '00:00',
            },
            { slotLabelSpanTopOffset: this.props.showSecondaryZone }
          )}
        >
          {arg.text}
        </span>
        {showSecondaryZone ? (
          <span className={classNames('slotTimeZoneLabelCustomSpan', { slotLabelCustomSpanFirst: arg.text === '24:00' || arg.text === '00:00' })}>{timezoneText}</span>
        ) : (
          <></>
        )}
      </div>
    );
  };
  renderAllDayContent = () => {
    return this.props.showSecondaryZone ? (
      <ScheduleTimezoneSelect
        durationTextLabelStyle={{ fontSize: 12 }}
        labelBreakLine={true}
        renderLabelAsGMTFormat={true}
        selectClassName={`fc-timezone-select ${process.env.BUILD_ISELECTRON ? 'fc-timezone-select-eletron' : ''}`}
        showTimeDiffLabel={true}
      />
    ) : (
      ''
    );
  };
  // 日历自定义标题;
  titleFormat = () => {
    const { miniSelectedDay } = this.props;
    return `${miniSelectedDay.year()}年${miniSelectedDay.month() + 1}月`;
  };
  // 周视图，时间线
  nowIndicatorContent = (arg: NowIndicatorContentArg) => {
    const { isAxis, date } = arg;
    this.nowIndicatorUpdate(arg);
    return isAxis ? moment(date).format('HH:mm') : null;
  };
  getCustomButton = () => {
    const customBtn: string[] = [];
    customBtn.push('settings');
    if (sysApi.isElectron()) {
      customBtn.push(sysApi.isMainWindow() ? 'independed' : 'depended');
    }
    return customBtn;
  };
  // 更新时间线
  nowIndicatorUpdate = (arg: NowIndicatorContentArg) => {
    const { isAxis } = arg;
    if (!isAxis) {
      setTimeout(() => {
        const el = document.getElementsByClassName('fc-timegrid-now-indicator-line')[0];
        const nodes = document.getElementsByClassName('fc-timegrid-now-indicator-container');
        for (let i = 1; i < nodes.length; i++) {
          const node = el && el.cloneNode(true);
          if (node instanceof Element) {
            if (node.classList.replace) {
              node.classList.replace('fc-timegrid-now-indicator-line', 'fc-timegrid-now-indicator-line-clone');
            } else {
              node.classList.remove('fc-timegrid-now-indicator-line');
              node.classList.add('fc-timegrid-now-indicator-line-clone');
            }
            const element = nodes[i];
            if (element.childElementCount === 0 || element.children[0].classList.contains('fc-timegrid-now-indicator-line-clone')) {
              element.innerHTML = '';
              element.appendChild(node);
            }
          }
        }
      }, 100);
    }
    this.hiddenTimeLabel();
  };
  // 准点附近，隐藏时间label
  hiddenTimeLabel = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    const curMin = moment().minutes();
    const nodes = document.getElementsByClassName('slotLabelCustomSpan');
    const timezoneNodes = document.getElementsByClassName('slotTimeZoneLabelCustomSpan');
    const hasTimezone = timezoneNodes.length > 0;
    const upTimeLine = hasTimezone ? 40 : 50;
    const downTimeLine = hasTimezone ? 20 : 10;
    if (curMin > upTimeLine || curMin < downTimeLine) {
      const hourNum = curMin > upTimeLine ? moment().hours() + 1 : moment().hours();
      const hourStr = (hourNum + '').padStart(2, '0') + ':00';
      for (let i = 0; i < nodes.length; i++) {
        const element = nodes[i];
        const timezoneElement = timezoneNodes[i];
        if (element instanceof HTMLElement) {
          if (element.innerHTML === hourStr) {
            element.style.display = 'none';
          } else {
            element.style.display = 'inline';
          }
          if (hasTimezone && timezoneElement instanceof HTMLElement) {
            if (element.innerHTML === hourStr) {
              timezoneElement.style.display = 'none';
            } else {
              timezoneElement.style.display = 'inline';
            }
          }
        }
      }
    } else {
      for (let i = 0; i < nodes.length; i++) {
        const element = nodes[i];
        const timezoneElement = timezoneNodes[i];
        if (element instanceof HTMLElement) {
          element.style.display = 'inline';
        }
        if (hasTimezone && timezoneElement instanceof HTMLElement) {
          timezoneElement.style.display = 'inline';
        }
      }
    }
    const { calendarRef } = this.props;
    const start = calendarRef.current?.getApi().view.currentStart;
    const end = calendarRef.current?.getApi().view.currentEnd;
    if (!moment().isBetween(moment(start), moment(end))) {
      for (let i = 0; i < nodes.length; i++) {
        const element = nodes[i];
        const timezoneElement = timezoneNodes[i];
        if (element instanceof HTMLElement) {
          element.style.display = 'inline';
        }
        if (hasTimezone && timezoneElement instanceof HTMLElement) {
          timezoneElement.style.display = 'inline';
        }
      }
    }
  };
  static viewType: string = '';
  // 主视图渲染后钩子
  viewDidMount = ({ view }: ViewMountArg) => {
    this.mountCustomBtn();
    const { type } = view;
    const trackFn = SiriusCalendar.viewType ? scheduleTracker.pc_schedule_change_view : scheduleTracker.pc_schedule_view;
    switch (type) {
      case 'dayGridMonth':
        trackFn.apply(scheduleTracker, ['month']);
        break;
      case 'timeGridWeek':
        trackFn.apply(scheduleTracker, ['week']);
        break;
      default:
        break;
    }
    SiriusCalendar.viewType = type;
    setTimeout(() => {
      type && storeApi.putSync('CALENDAR_VIEW_TYPE', type, { noneUserRelated: true });
      this.setState({ initialView: type });
    }, 1000);
  };
  // 更新今日日期
  updateNow() {
    const current = moment();
    const { now } = this.state;
    if (current.day() !== now.day()) {
      this.setState(
        {
          now: current,
          detory: true,
        },
        () => {
          this.setState({
            detory: false,
          });
        }
      );
    }
  }
  handleDates = (rangeInfo: DatesSetArg) => {
    const { datesSet } = this.props;
    datesSet && datesSet(rangeInfo);
  };
  render() {
    const { size, calendarRef, datesSet, events, select, moreLinkClick, miniSelectedDay, eventClick, weekFirstDay, weekNumbersVisible } = omit<CalendarProps>(
      this.props,
      ['miniSelectedDay', 'onGetSyncCached', 'onGetSyncNeedCompare']
    );
    // const eventlist = useMemo(() => {
    //   // some expensive computation here
    //   return scheduleEventList || [];
    // }, [scheduleEventList]);
    const { detory, now, customBtnPortal, customSettingBtn, customWeekNumberBtn, initialView } = this.state;
    const height = size && size.height > PAGE_MIN_HEIGHT ? size.height : PAGE_MIN_HEIGHT;
    const slotLabelFormat: FormatterInput = {
      hour: '2-digit',
      minute: '2-digit',
      omitZeroMinute: false,
      meridiem: false,
      hour12: false,
    };
    const language = this.lang || DEFAULT_LANG;
    const curMoment = now.hours(moment().hours()).minutes(moment().minutes());
    const storeView = inWindow() && storeApi.getSync('CALENDAR_VIEW_TYPE', { noneUserRelated: true });
    const InitView = storeView && storeView.suc ? storeView.data || initialView : initialView;
    const toolbarWeekNumberComp = this.getToobarWeeksNumber();
    // 添加日程右键触发左键
    const eventDidMount = (info: any) => {
      if (info.el) {
        info.el.addEventListener('contextmenu', (event: any) => {
          if (window && document) {
            const e = document.createEvent('MouseEvents');
            e.initEvent('click', true, true);
            info.el.dispatchEvent(e);
          }
          event.preventDefault();
          event.stopPropagation();
        });
      }
    };

    const langMap: { [key: string]: string } = {
      en: enLocale,
      zh: cnLocale,
      'zh-trad': zhTradLocale,
    };
    return (
      <>
        {toolbarWeekNumberComp}
        {customSettingBtn}
        {customBtnPortal}
        {customWeekNumberBtn}
        {/* 170版本的周视图上线引导去掉 */}
        {/* {this.renderGuide()} */}
        {/* fullcalendar/react v5版本有bug 直接设置now 并不会触发dom的重新渲染 因此只能先销毁 再重建 */}
        {/* 已向官方提issue https://github.com/fullcalendar/fullcalendar-react/issues/141 */}
        {!detory && (
          <FullCalendar
            // viewClassNames={styles.siriusCalendarView}
            now={curMoment.toDate()}
            locales={[cnLocale, enLocale, zhTradLocale]}
            locale={langMap[language]}
            selectable
            unselectAuto
            firstDay={weekFirstDay}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
            initialView={InitView}
            weekNumbers={weekNumbersVisible}
            handleWindowResize={false}
            viewDidMount={this.viewDidMount}
            weekNumberDidMount={arg => {
              return `${arg.num}${arg.text}`;
            }}
            allDayContent={this.renderAllDayContent}
            headerToolbar={{
              start: 'today prev,next',
              center: 'title weekNumberTitle',
              right: ['timeGridWeek', 'dayGridMonth'].concat(this.getCustomButton()).join(','),
            }}
            events={events}
            ref={calendarRef}
            eventClassNames={this.eventClasses}
            contentHeight={height - getBodyFixHeight() - CalendarToolBarHeight}
            eventContent={renderEventContent}
            eventDidMount={eventDidMount}
            eventOrder="highOrder,start,-duration,allDay,customOrder,title"
            eventDataTransform={eventDataTransform}
            dayCellContent={args => renderDayCellContent({ ...args, weekFirstDay, weekNumbersVisible })}
            weekNumberContent={arg => {
              return language === 'en' ? arg.text : `${arg.num}${getIn18Text('ZHOU')}`;
            }}
            slotLabelFormat={slotLabelFormat}
            titleFormat={this.titleFormat}
            slotEventOverlap={false}
            // slotDuration="01:00"
            slotLabelContent={this.slotLabelContent}
            nowIndicator
            nowIndicatorContent={this.nowIndicatorContent}
            scrollTime={moment().subtract(3, 'h').format('HH:mm')}
            scrollTimeReset={false}
            dayMaxEventRows
            views={{
              timeGrid: {
                dayMaxEventRows: 4,
              },
            }}
            dayPopoverFormat={formatDayPopoverTitle as unknown as DateFormatter}
            moreLinkContent={renderMoreLinkContent}
            // eslint-disable-next-line react/jsx-props-no-spreading
            // {...rest}
            eventClick={eventClick}
            moreLinkClick={moreLinkClick}
            select={select}
            datesSet={this.handleDates}
          />
        )}
      </>
    );
  }
}
const mapStateToProps = (state: RootState) => {
  const {
    scheduleReducer: { miniSelectedDay, weekFirstDay, weekNumbersVisible, showSecondaryZone, lastSelectTimezone },
  } = state;
  return {
    miniSelectedDay,
    weekFirstDay,
    weekNumbersVisible,
    showSecondaryZone,
    lastSelectTimezone,
  };
};

export default connect(mapStateToProps)(SiriusCalendar);
