import moment, { Moment } from 'moment';
import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { FreeBusyModel, api } from 'api';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import classNames from 'classnames';
import styles from './right.module.scss';
import { queryFreeBusyList } from '../../service';
import MoreEvent from './MoreEvent';
import { isAlldayOrCrossEvent, sortByUser, transfer } from './util';
import EventCell from './EventCell';
import scheduleTracker from '../../tracker';
import { getIn18Text } from 'api';
const sysApi = api.getSystemApi();
const fixNumber = (num: number) => `${num < 10 ? '0' : ''}${num}:00`;
const timeLineScale = new Array(24).fill(null).map((_, index) => fixNumber(index + 1));
const timeObjState = new Array(24).fill(false);
// 表格高度
const CELL_HEIGHT = 50;
// 表格宽度
const CELL_WIDTH = 172;
// 时间列宽度
const COL_WIDTH = 60;
// 最多展示全天日程个数
const ALL_DAY_EVENTS_NUM = 3;
// 日程展示列右侧留白
const TIME_CELL_MARGIN_RIGHT = 5;
// 日程展示列左侧留白
const TIME_CELL_MARGIN_LEFT = 2;
interface RightProps {
  loading: boolean;
  setLoading(loading: boolean): void;
  selectedDay: Moment;
  setSelectedDay(selectedDay: Moment): void;
  user: string;
  addSchedule(isDirect: boolean, hour: number): void;
}
const Right = ({ loading, setLoading, user, selectedDay, setSelectedDay, addSchedule }: RightProps, ref) => {
  const [schedule, setSchedule] = useState<FreeBusyModel[]>([]);
  const scrollRef = useRef<OverlayScrollbarsComponent>(null);
  const [timeClick, setTimeClick] = useState(timeObjState);
  const [scrollFinish, setScrollFinish] = useState(false);
  const [userNameArr, setUserNameArr] = useState<string[]>(['', '']);
  // 外部获取日程
  useEffect(() => {
    loading && getSchedule();
  }, [loading]);
  // 隐藏新建
  const resetTimeClick = () => {
    setTimeClick(new Array(24).fill(false));
  };
  useImperativeHandle(ref, () => ({
    resetTimeClick,
  }));
  // 日期变化
  useEffect(() => {
    // 设置loading，触发获取日程
    setLoading(true);
    // 定时更新当前时间线
    updateNow();
    const timer = setInterval(() => {
      updateNow();
    }, 60 * 1000);
    return () => {
      clearInterval(timer);
    };
  }, [selectedDay]);
  // 进入页面直接滚动到当前时间
  useEffect(() => {
    // 滚动到当前时间
    scrollToNow();
  }, []);
  // 获取日程
  const getSchedule = () => {
    const currentUser = sysApi.getCurrentUser()?.id;
    const users = [...new Set([user, currentUser as string])];
    // 现将日程置空
    setSchedule([]);
    queryFreeBusyList({
      users,
      start: selectedDay.clone().startOf('day').toDate(),
      end: selectedDay.clone().endOf('day').toDate(),
    }).then(res => {
      setLoading(false);
      const sortEvents = sortByUser(res, users);
      const userArr = sortEvents.map(i => i?.account?.extNickname as string);
      setSchedule(sortEvents);
      setUserNameArr(userArr);
    });
  };
  // 滚动到当前时间
  const scrollToNow = () => {
    const scrollInstance = scrollRef.current?.osInstance();
    const dayStart = moment().startOf('day');
    let y = moment().diff(dayStart, 'hour', true) * CELL_HEIGHT;
    if (y < 4.5 * CELL_HEIGHT) {
      y = 0;
    } else {
      y -= 4.5 * CELL_HEIGHT;
    }
    if (scrollInstance) {
      scrollInstance.scroll({ y }, 100, undefined, () => {
        setScrollFinish(true);
      });
    }
    // 滚动结束，再显示tbody
    setTimeout(() => {
      setScrollFinish(true);
    }, 100);
  };
  // 更新时间线
  const updateNow = () => {
    const isToday = selectedDay.isSame(moment(), 'day');
    if (isToday) {
      // 更新时间线
      const dayStart = moment().startOf('day');
      const nowTop = moment().diff(dayStart, 'hour', true) * CELL_HEIGHT;
      setTimeout(() => {
        if (document.getElementById('nowRef')) {
          document.getElementById('nowRef').style.top = nowTop - 1 + 'px';
        }
        if (document.getElementById('timeRef')) {
          document.getElementById('timeRef').innerHTML = moment().format('HH:mm');
        }
      }, 0);
      // 整点附近隐藏
      const minute = moment().minute();
      if (minute > 50 || minute < 10) {
        const nearHour = moment().clone();
        nearHour.hour(minute > 50 ? moment().hour() + 1 : moment().hour());
        const timeStr = nearHour.minute(0).format('HH:mm');
        if (document.getElementById(timeStr)) {
          document.getElementById(timeStr).style.opacity = '0';
        }
      } else {
        timeLineScale.forEach(t => {
          if (document.getElementById(t)) {
            document.getElementById(t).style.opacity = '1';
          }
        });
      }
    } else {
      timeLineScale.forEach(t => {
        if (document.getElementById(t)) {
          document.getElementById(t).style.opacity = '1';
        }
      });
    }
  };
  // 点击时间区间，显示临时日程
  const handleTime = (idx: number) => {
    const newArr = new Array(24).fill(false);
    newArr[idx] = true;
    setTimeClick(newArr);
    // 触发新建日程弹窗
    addSchedule(false, idx);
    scheduleTracker.scheduleContact({
      action: 'create',
      type: 'view_zone',
    });
  };
  // 渲染操作栏
  const renderHeader = () => {
    const date = selectedDay.format(getIn18Text('NIANYUERIXINGQI'));
    const next = selectedDay.clone().add(1, 'd');
    const prev = selectedDay.clone().subtract(1, 'd');
    return (
      <div className={styles.header}>
        <button
          onClick={() => {
            !selectedDay.isSame(moment(), 'day') && setSelectedDay(moment());
          }}
          type="button"
          style={{ width: 46 }}
          className={styles.headerBtn}
        >
          {getIn18Text('JINTIAN')}
        </button>
        <button
          onClick={() => {
            setSelectedDay(prev);
          }}
          type="button"
          style={{ width: 28, marginLeft: 16 }}
          className={styles.headerBtn}
        >
          <i className={styles.left} />
        </button>
        <button
          onClick={() => {
            setSelectedDay(next);
          }}
          type="button"
          style={{ width: 28, marginLeft: 8 }}
          className={styles.headerBtn}
        >
          <i className={styles.right} />
        </button>
        <span className={styles.headerTitle}>{date}</span>
      </div>
    );
  };
  // 表头全天日程过多的展示
  const renderMoreAllDayEvent = (events: any[]) => (
    <>
      {events.map((i, idx) =>
        idx < ALL_DAY_EVENTS_NUM - 1 ? (
          <div className={styles.eventOuter} key={i.scheduleId}>
            <EventCell event={i} />
          </div>
        ) : null
      )}
      <MoreEvent num={ALL_DAY_EVENTS_NUM} events={events} />
    </>
  );
  // 渲染表头全天日程
  const renderAllDay = (events: any[]) => {
    if (!events || !events.length) {
      return null;
    }
    // 全天日程显示数量限制
    if (events.length <= ALL_DAY_EVENTS_NUM) {
      return events.map(i => (
        <div className={styles.eventOuter} key={i.scheduleId}>
          <EventCell event={i} />
        </div>
      ));
    }
    return renderMoreAllDayEvent(events);
  };
  // 渲染表头
  const renderTableHeader = () => {
    const Arr = schedule.map(i => ({
      name: i?.account?.extNickname,
      events: i?.freeBusyItems.filter(e => isAlldayOrCrossEvent(e)),
    }));
    return (
      <div className={styles.tableHeader}>
        <div className={styles.tableTh} style={{ width: COL_WIDTH, justifyContent: 'flex-end' }}>
          <span className={styles.colTh}>{getIn18Text('QUANTIAN')}</span>
        </div>
        <div className={styles.tableTh} style={{ width: CELL_WIDTH }}>
          <div className={styles.name}>{userNameArr[0] || Arr[0]?.name}</div>
          {renderAllDay(Arr[0]?.events)}
        </div>
        <div className={styles.tableTh} style={{ width: CELL_WIDTH }}>
          <div className={styles.name}>{userNameArr[1] || Arr[1]?.name}</div>
          {renderAllDay(Arr[1]?.events)}
        </div>
      </div>
    );
  };
  // 渲染表格背景
  const renderTableBody = () => {
    const isToday = selectedDay.isSame(moment(), 'day');
    const dayStart = moment().startOf('day');
    const nowTop = moment().diff(dayStart, 'hour', true) * CELL_HEIGHT;
    return (
      <OverlayScrollbarsComponent ref={scrollRef} className={classNames(styles.tableBody, { [styles.tableBodyShow]: scrollFinish })}>
        <div className={styles.tableBodyIn} style={{ height: CELL_HEIGHT * 24 }}>
          <div className={styles.timeOuter} style={{ width: COL_WIDTH }}>
            {timeLineScale.map((t, idx) => (
              <div className={styles.timeCell} key={t} style={{ width: COL_WIDTH, height: CELL_HEIGHT }}>
                <span id={t} style={{ height: idx < 23 ? 20 : 0 }} className={styles.time}>
                  {idx < 23 ? t : null}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.Tbody} style={{ width: CELL_WIDTH * 2 }}>
            {timeLineScale.map(t => (
              <div className={styles.Tr} key={t} style={{ width: CELL_WIDTH * 2, height: CELL_HEIGHT }}>
                <div className={styles.Td} style={{ width: CELL_WIDTH + 1, height: CELL_HEIGHT }} />
                <div className={styles.Td} style={{ width: CELL_WIDTH + 1, height: CELL_HEIGHT }} />
              </div>
            ))}
            {/* 非全天非跨天日程展示 */}
            {renderAllEvents()}
          </div>
          {/* 时间轴 */}
          {isToday && (
            <div id="nowRef" className={styles.now} style={{ top: nowTop - 1, width: CELL_WIDTH * 2 }}>
              <span id="timeRef" className={styles.timeNow}>
                {moment().format('HH:mm')}
              </span>
            </div>
          )}
        </div>
      </OverlayScrollbarsComponent>
    );
  };
  // 非全天非跨天日程展示
  const renderAllEvents = () => {
    let Arr: any[] = [];
    if (schedule.length) {
      Arr = schedule.map(i => i?.freeBusyItems || []);
    }
    return (
      <div className={styles.timeContent}>
        <div
          className={styles.timeContentIn}
          style={{ width: CELL_WIDTH - TIME_CELL_MARGIN_RIGHT - TIME_CELL_MARGIN_LEFT, marginRight: TIME_CELL_MARGIN_RIGHT, marginLeft: TIME_CELL_MARGIN_LEFT }}
        >
          {!!schedule.length && renderEvent(Arr[0])}
        </div>
        <div
          className={styles.timeContentIn}
          style={{ width: CELL_WIDTH - TIME_CELL_MARGIN_RIGHT - TIME_CELL_MARGIN_LEFT, marginRight: TIME_CELL_MARGIN_RIGHT, marginLeft: TIME_CELL_MARGIN_LEFT }}
        >
          {/* 创建虚拟时间区间，用于点击 */}
          {timeClick.map((t, idx) => (
            <div
              className={styles.fakeTd}
              onClick={() => handleTime(idx)}
              key={idx}
              style={{ width: CELL_WIDTH * 2, height: CELL_HEIGHT, marginLeft: -CELL_WIDTH - TIME_CELL_MARGIN_LEFT }}
            >
              {/* {
                    t ? (
                      <div className={styles.tempEvent}>
                        <span>新建日程</span><br />
                        <span>{fixNumber(idx)}-{fixNumber(idx + 1)}</span>
                      </div>
                    ) : null
                  } */}
            </div>
          ))}
          {!!schedule.length && renderEvent(Arr[1])}
        </div>
      </div>
    );
  };
  // 渲染非全天日程，非跨天日程
  const renderEvent = (events: any[]) => {
    const myEvents = transfer(events, CELL_HEIGHT);
    return (
      <>
        {myEvents.map(i => (
          <div
            className={styles.eventTimeOuter}
            key={i.scheduleId}
            style={{
              top: i.top,
              left: i.left + '%',
              right: i.right + '%',
              height: i.height,
            }}
          >
            <EventCell event={i} />
          </div>
        ))}
      </>
    );
  };
  return (
    <>
      <div className={styles.outer}>
        {renderHeader()}
        <div className={styles.table}>
          {renderTableHeader()}
          {renderTableBody()}
        </div>
      </div>
    </>
  );
};
export default forwardRef(Right);
