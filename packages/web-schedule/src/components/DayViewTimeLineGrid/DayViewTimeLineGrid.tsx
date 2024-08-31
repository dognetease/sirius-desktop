import React, { useEffect, useMemo, useRef, useState } from 'react';
import classnames from 'classnames';
import moment, { Moment } from 'moment';
import { FreeBusyModel, api, FreeBusyItem } from 'api';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useResizeDetector } from 'react-resize-detector';
import styles from './dayviewtimelinegrid.module.scss';
import { DayViewTimeLineGridProps } from './data';
import { queryFreeBusyList } from '../../service';
import DateSwitch from './DateSwitch';
import { fixNumber, sortByFreeBusy } from './util';
import { rangeInteract } from '../TimeLinePicker/util';
import GridHeader from './GridHeader';
import { useAppSelector } from '@web-common/state/createStore';
import { isAlldayOrCrossEvent, sortByUser, transfer } from '../ScheduleModal/util';
import EventCell from '../ScheduleModal/EventCell';
import { getIn18Text } from 'api';
const sysApi = api.getSystemApi();
const timeLineScale = new Array(24).fill(null).map((_, index) => fixNumber(index + 1));
const DEFAULT_SIZE_OPTIONS = {
  // 控制栏高度
  DATE_SWTICH_HEIGHT: 60,
  // 最小宽高
  MIN_GRID_CONTAINER_HEIGHT: 502,
  MIN_GRID_CONTAINER_WIDTH: 380,
  // 右侧边距
  GRID_CONTAINER_MARGIN_RIGHT: 16,
  GRID_CONTAINER_MARGIN_BOTTOM: 0,
  GRID_COL_HEADER_WIDTH: 60,
  GRID_CELL_HEIGHT: 50,
  TIME_CELL_MARGIN_RIGHT: 5,
  TIME_CELL_MARGIN_LEFT: 2,
};
// 默认用户
const defaultUsers: string[] | undefined = [];

const DayViewTimeLineGrid: React.FC<DayViewTimeLineGridProps> = ({ startDate, endDate, startTime, endTime, users = defaultUsers, allDay = 0, sizeOptions, onClose }) => {
  const {
    DATE_SWTICH_HEIGHT,
    MIN_GRID_CONTAINER_HEIGHT,
    MIN_GRID_CONTAINER_WIDTH,
    GRID_CONTAINER_MARGIN_RIGHT,
    GRID_CONTAINER_MARGIN_BOTTOM,
    GRID_COL_HEADER_WIDTH,
    GRID_CELL_HEIGHT,
    TIME_CELL_MARGIN_RIGHT,
    TIME_CELL_MARGIN_LEFT,
  } = { ...DEFAULT_SIZE_OPTIONS, ...sizeOptions };
  const { scheduleEvent: editingEvent } = useAppSelector(state => state.scheduleReducer);
  const uid = editingEvent?.scheduleInfo.uid;
  const currentMoment = moment();
  const getInitFreeBusyList: () => FreeBusyModel[] = () => {
    const organizer = editingEvent?.scheduleInfo.organizer;
    const currentUser = sysApi.getCurrentUser();
    if (organizer) {
      return [
        {
          account: { ...organizer },
          freeBusyItems: [],
        },
      ];
    }
    if (currentUser) {
      return [
        {
          account: {
            accountId: currentUser.id as unknown as number,
            extDesc: currentUser.id,
            extNickname: currentUser.nickName,
          },
          freeBusyItems: [],
        },
      ];
    }
    return [];
  };
  const [currentDate, setCurrentDate] = useState<Moment | null>(startDate);
  const [userFreeBusy, setUserFreeBusy] = useState<FreeBusyModel[]>(getInitFreeBusyList());
  // const [userFreeBusyNotSort, setUserFreeBusyNotSort] = useState<FreeBusyModel[]>(getInitFreeBusyList());
  const [scrollOffset, setScrollOffset] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const scrollRef = useRef<OverlayScrollbarsComponent>(null);
  const { ref: sizeRef, width: containerWidth = MIN_GRID_CONTAINER_WIDTH, height: containerHeight = MIN_GRID_CONTAINER_HEIGHT } = useResizeDetector();
  const criticalCellWidth = useRef<number>(0);
  const GRID_WIDTH = containerWidth - GRID_COL_HEADER_WIDTH - GRID_CONTAINER_MARGIN_RIGHT;
  const GRID_CONTAINER_HEIGHT = containerHeight - DATE_SWTICH_HEIGHT;
  const formStart = useMemo(() => {
    const _startDate = startDate;
    const _startTime = startTime;
    if (_startDate && _startTime) {
      return allDay
        ? _startDate.clone().startOf('day')
        : _startDate.clone().set({
            hour: _startTime.hours(),
            minute: _startTime.minute(),
            second: 0,
            millisecond: 0,
          });
    }
    return null;
  }, [allDay, startDate, startTime]);
  const formEnd = useMemo(() => {
    const _endDate = endDate;
    const _endTime = endTime;
    if (_endDate && _endTime) {
      return allDay
        ? _endDate.clone().endOf('day')
        : _endDate.clone().set({
            hour: _endTime.hours(),
            minute: _endTime.minute(),
            second: 0,
            millisecond: 0,
          });
    }
    return null;
  }, [allDay, endDate, endTime]);
  /**
   * 滚动事件处理器 改变rowheader 和 colheader的位置
   * 动态设置顶部和左侧的相对位置模拟吸边效果
   */
  const handleGridCellScroll = (e: any) => {
    setScrollOffset({
      x: e.target.scrollLeft,
      y: e.target.scrollTop,
    });
  };
  // 表格头部高度
  const GRID_HEADER_HEIGHT = useMemo(() => {
    const height = GRID_CELL_HEIGHT;
    let maxEventsNum = 0;
    userFreeBusy.forEach(i => {
      // const allDayAndCrossEvents = i.freeBusyItems.filter(c => c.allDay || !moment(c.start).isSame(moment(c.end), 'day'));
      const allDayAndCrossEvents = i.freeBusyItems.filter(c => isAlldayOrCrossEvent(c));
      maxEventsNum = Math.max(maxEventsNum, allDayAndCrossEvents.length);
    });
    const num = maxEventsNum > 4 ? 4 : maxEventsNum;
    return num ? 45 + num * 20 : height;
  }, [userFreeBusy]);
  const GRID_CELL_WIDTH =
    useMemo(() => {
      // 自适应宽度
      // 3个人及以下 取总宽的算数平均 临界值设为0
      // 4个人 取总宽的 1/3.5 即总宽容纳3.5个联系人 取此时的宽度为临界值
      // 4个人以上 取临界值和总宽算数平均的最大值 保证铺满屏幕
      let CW = GRID_WIDTH / (userFreeBusy.length || 1);
      if (userFreeBusy.length < 3) {
        criticalCellWidth.current = 0;
      } else {
        if (criticalCellWidth.current === 0) {
          criticalCellWidth.current = GRID_WIDTH / 2.5;
        }
        CW = Math.max(criticalCellWidth.current, CW);
      }
      return Math.ceil(CW);
    }, [GRID_WIDTH, userFreeBusy.length]) - 2;
  /**
   * 时间指示器显示的时间范围
   * 当前时间和表单开始结束时间的交集
   */
  const indicatorRange = useMemo(
    () =>
      rangeInteract(
        [(formStart || currentMoment).clone(), (formEnd || currentMoment).clone()],
        [(currentDate || currentMoment).clone().startOf('day'), (currentDate || currentMoment).clone().endOf('day')]
      ),
    [currentDate, formStart, formEnd]
  );
  /**
   * 联系人忙状态实际忙闲状态（关联开始结束时间）
   */
  const userBusyStatusArray = useMemo(
    () =>
      userFreeBusy.map(item => {
        let busy = false;
        if (formStart && formEnd) {
          for (let i = 0; i < item.freeBusyItems.length; i++) {
            const element = item.freeBusyItems[i];
            busy = rangeInteract([moment(element.start), moment(element.end)], [formStart, formEnd]) !== null;
            if (busy) {
              break;
            }
          }
        }
        return busy;
      }),
    [formStart, formEnd, userFreeBusy]
  );
  /**
   * 渲染时间指示器
   * 相对-绝对定位
   */
  const renderIndicator = () => {
    if (indicatorRange === null) {
      return null;
    }
    return (
      <div
        style={{
          position: 'absolute',
          zIndex: 99,
          padding: 2,
          width: GRID_CELL_WIDTH * userFreeBusy.length,
          height: indicatorRange[1].diff(indicatorRange[0].clone(), 'hours', !0) * GRID_CELL_HEIGHT,
          top: indicatorRange[0].diff(indicatorRange[0].clone().startOf('day'), 'hours', !0) * GRID_CELL_HEIGHT,
        }}
      >
        <div
          className={classnames(styles.indicator, {
            [styles.indicatorBusy]: userBusyStatusArray.reduce((prev, busy) => prev || busy, false),
          })}
        />
      </div>
    );
  };
  // 是否是忙碌的日程
  const isBusyEvent = (event: FreeBusyItem) => {
    if (indicatorRange === null) {
      return false;
    }
    return rangeInteract([moment(event.start), moment(event.end)], indicatorRange) !== null;
  };
  // 渲染非全天日程，非跨天日程
  const renderEvent = (allEvents: FreeBusyItem[]) => {
    // const events = allEvents.filter(e => !+e.allDay && moment(e.start).isSame(moment(e.end), 'day'));
    const events = allEvents.filter(e => !isAlldayOrCrossEvent(e));
    const myEvents = transfer(events, GRID_CELL_HEIGHT).map(i => {
      const isBusy = isBusyEvent(i);
      return {
        ...i,
        textColor: isBusy ? '#51555c' : '#a8aaad',
        color: isBusy ? 'rgba(247, 79, 79, 0.2)' : 'rgba(232, 232, 232, 0.6)',
      };
    });
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
            <EventCell event={i} judgePast={false} />
          </div>
        ))}
      </>
    );
  };
  /**
   * 渲染忙碌的单元格
   * 相对-绝对定位
   */
  const renderBusyCell = () => (
    <>
      <div
        className={styles.timeContent}
        style={{
          width: GRID_CELL_WIDTH * userFreeBusy.length,
          height: GRID_CELL_HEIGHT * timeLineScale.length,
        }}
      >
        {userFreeBusy.map(usr => (
          <div
            key={usr.account.accountId}
            className={styles.timeContentIn}
            style={{
              width: GRID_CELL_WIDTH - TIME_CELL_MARGIN_RIGHT - TIME_CELL_MARGIN_LEFT,
              marginRight: TIME_CELL_MARGIN_RIGHT,
              marginLeft: TIME_CELL_MARGIN_LEFT,
            }}
          >
            {renderEvent(usr.freeBusyItems)}
          </div>
        ))}
      </div>
    </>
  );
  /**
   * 渲染表格头部（受邀人员）
   * 相对-绝对定位
   * 吸顶效果
   */
  const renderGridRowHeader = () => (
    <div
      className={styles.gridRowHeaderContainer}
      style={{
        position: 'absolute',
        height: GRID_HEADER_HEIGHT,
        width: userFreeBusy.length * GRID_CELL_WIDTH + GRID_COL_HEADER_WIDTH,
        left: -scrollOffset.x,
      }}
    >
      <div
        className={styles.gridRowHeader}
        style={{
          position: 'absolute',
          left: GRID_COL_HEADER_WIDTH,
          height: GRID_HEADER_HEIGHT,
          width: GRID_CELL_WIDTH * userFreeBusy.length,
        }}
      >
        {userFreeBusy.map((item, index) => (
          <div
            key={item.account.accountId}
            className={styles.gridRowHeaderCell}
            style={{
              position: 'absolute',
              left: index * GRID_CELL_WIDTH,
              height: GRID_HEADER_HEIGHT,
              width: GRID_CELL_WIDTH,
            }}
          >
            <GridHeader
              indicatorRange={indicatorRange}
              events={item.freeBusyItems}
              busy={userBusyStatusArray[index]}
              text={item.account.extNickname || item.account.extDesc}
            />
          </div>
        ))}
      </div>
    </div>
  );
  /**
   * 渲染表格左侧边（时间轴）
   * 相对-绝对定位
   * 吸边效果
   */
  const renderGirdColHeader = () => {
    const isToday = moment().isSame(currentDate, 'day');
    const dayStart = moment().startOf('day');
    const nowTop = moment().diff(dayStart, 'hour', true) * GRID_CELL_HEIGHT;
    return (
      <div
        className={styles.gridColHaederContainer}
        style={{
          position: 'absolute',
          top: -scrollOffset.y,
          width: GRID_COL_HEADER_WIDTH,
          height: timeLineScale.length * GRID_CELL_HEIGHT + GRID_HEADER_HEIGHT + GRID_CONTAINER_MARGIN_BOTTOM,
        }}
      >
        <div
          className={styles.gridColHaeder}
          style={{
            position: 'absolute',
            top: GRID_HEADER_HEIGHT,
            width: GRID_COL_HEADER_WIDTH,
            height: timeLineScale.length * GRID_CELL_HEIGHT,
          }}
        >
          {timeLineScale.map((unit, index, arr) => (
            <div
              key={unit}
              id={'time' + unit}
              className={styles.gridColHaederCell}
              style={{
                width: GRID_COL_HEADER_WIDTH,
                position: 'absolute',
                height: GRID_CELL_HEIGHT,
                textAlign: 'center',
                top: index * GRID_CELL_HEIGHT,
              }}
            >
              <span>{index < arr.length - 1 && unit}</span>
            </div>
          ))}
        </div>
        {isToday && (
          <div id="nowTitle" className={styles.nowTitle} style={{ top: nowTop + GRID_HEADER_HEIGHT - 10, width: GRID_COL_HEADER_WIDTH }}>
            {moment().format('HH:mm')}
          </div>
        )}
      </div>
    );
  };
  /**
   * 渲染单元格
   * grid布局
   * 模拟表格
   */
  const renderGridCell = () => {
    const isToday = moment().isSame(currentDate, 'day');
    const dayStart = moment().startOf('day');
    const nowTop = moment().diff(dayStart, 'hour', true) * GRID_CELL_HEIGHT;
    return (
      <>
        <div
          className={styles.grid}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${userFreeBusy.length},${GRID_CELL_WIDTH}px)`,
            gridTemplateRows: `repeat(24,${GRID_CELL_HEIGHT}px)`,
          }}
        >
          {timeLineScale.map(key => (
            <React.Fragment key={key}>
              {userFreeBusy.map(item => (
                <div key={item.account.accountId} className={classnames(styles.cell)} />
              ))}
            </React.Fragment>
          ))}
        </div>
        {isToday && <div id="nowLine" className={styles.nowLine} style={{ top: nowTop - 1, width: userFreeBusy.length * GRID_CELL_WIDTH }} />}
      </>
    );
  };
  /**
   * 渲染左上角
   * 相对-绝对定位
   */
  const renderGridCorner = () => (
    <div
      className={styles.gridCorner}
      style={{
        position: 'absolute',
        width: GRID_COL_HEADER_WIDTH,
        height: GRID_HEADER_HEIGHT,
        // background: '#FFF',
      }}
    >
      <span>{getIn18Text('QUANTIAN')}</span>
    </div>
  );
  // 更新当前时间线
  const updateNow = () => {
    const cur = currentDate || startDate || moment();
    const isToday = cur.isSame(moment(), 'day');
    if (isToday) {
      // 更新时间线
      const dayStart = moment().startOf('day');
      const nowTop = moment().diff(dayStart, 'hour', true) * GRID_CELL_HEIGHT;
      setTimeout(() => {
        if (document.getElementById('nowLine')) {
          document.getElementById('nowLine')!.style.top = nowTop - 1 + 'px';
        }
        if (document.getElementById('nowTitle')) {
          document.getElementById('nowTitle')!.style.top = nowTop + GRID_HEADER_HEIGHT - 10 + 'px';
        }
        if (document.getElementById('nowTitle')) {
          document.getElementById('nowTitle')!.innerHTML = moment().format('HH:mm');
        }
      }, 0);
      // 整点附近隐藏
      const minute = moment().minute();
      if (minute > 50 || minute < 10) {
        const nearHour = moment().clone();
        nearHour.hour(minute > 50 ? moment().hour() + 1 : moment().hour());
        const timeStr = 'time' + nearHour.minute(0).format('HH:mm');
        const timeEl = document.getElementById(timeStr);
        if (timeEl) {
          timeEl.style.opacity = '0';
        }
      } else {
        timeLineScale.forEach(t => {
          document.getElementById('time' + t)!.style.opacity = '1';
        });
      }
    } else {
      timeLineScale.forEach(t => {
        document.getElementById('time' + t)!.style.opacity = '1';
      });
    }
  };
  /**
   * 将prop的开始日期转换成当前日期维护在组件内部
   * 除了props的开始日期变化会导致组件内当前日期变化
   * 用户的切换操作也会改变组件内当前日期
   */
  useEffect(() => {
    if (startDate) {
      setCurrentDate(startDate);
    }
  }, [startDate]);
  /**
   * 当前日期发生变化
   * 重新触发获取逻辑
   * 内部日期发生变化的时候
   */
  useEffect(() => {
    // 表格第一列展示的人员
    // 有组织者，展示组织者
    // 否则展示自己
    if (!currentDate) {
      return;
    }
    const eventOrganizer = editingEvent?.scheduleInfo.organizer.extDesc;
    const currentUser = sysApi.getCurrentUser()?.id;
    const userList = users.slice();
    if (eventOrganizer) {
      userList.unshift(eventOrganizer);
    } else if (currentUser) {
      userList.unshift(currentUser);
    }
    queryFreeBusyList({
      users: Array.from(new Set(userList)),
      start: currentDate.clone().startOf('day').toDate(),
      end: currentDate.clone().endOf('day').toDate(),
      uid,
    }).then(res => {
      // 先根据请求的入参顺序排序一次
      // setUserFreeBusyNotSort(sortByUser(res, [...new Set(userList)]));
      setUserFreeBusy(sortByUser(res, [...new Set(userList)]));
    });
  }, [currentDate?.valueOf(), users]);
  /**
   * 当时间指示器位置发生变化
   * 滚动到可视位置
   */
  useEffect(() => {
    const scrollInstance = scrollRef.current?.osInstance();
    let y = 0;
    if (indicatorRange) {
      const [indicatorStart] = indicatorRange;
      const dayStart = (currentDate || currentMoment).clone().startOf('day');
      const distance = indicatorStart.diff(dayStart, 'hour', !0) * GRID_CELL_HEIGHT;
      y = distance;
    }
    if (scrollInstance) {
      scrollInstance.scroll({
        x: 0,
        y,
      });
    }
  }, [indicatorRange, currentDate]);
  // 更新时间线
  useEffect(() => {
    // 定时更新当前时间线
    updateNow();
    const timer = setInterval(() => {
      updateNow();
    }, 60 * 1000);
    return () => {
      clearInterval(timer);
    };
  }, [currentDate, GRID_HEADER_HEIGHT]);
  // 根据忙闲状态，进行排序，此逻辑因效果不好，先隐藏
  // useEffect(() => {
  //   setUserFreeBusy(sortByFreeBusy(formStart, formEnd, userFreeBusyNotSort));
  // }, [formStart, formEnd, userFreeBusyNotSort]);
  return (
    <div ref={sizeRef} className={`${styles.container} dayviewtimelinegrid-container`}>
      <DateSwitch date={currentDate || currentMoment} onChange={setCurrentDate} onClose={onClose} />
      <div
        className={styles.gridContainer}
        style={{
          width: `calc(100% - ${GRID_CONTAINER_MARGIN_RIGHT}px)`,
          position: 'relative',
          overflow: 'hidden',
          paddingBottom: GRID_CONTAINER_MARGIN_BOTTOM,
          marginRight: GRID_CONTAINER_MARGIN_RIGHT,
        }}
      >
        {renderGridRowHeader()}
        {renderGirdColHeader()}
        {renderGridCorner()}
        <OverlayScrollbarsComponent
          ref={scrollRef}
          options={{
            callbacks: {
              onScroll: handleGridCellScroll,
            },
          }}
          style={{
            height: GRID_CONTAINER_HEIGHT - GRID_CONTAINER_MARGIN_BOTTOM - GRID_HEADER_HEIGHT,
            width: containerWidth - GRID_CONTAINER_MARGIN_RIGHT - GRID_COL_HEADER_WIDTH,
            left: GRID_COL_HEADER_WIDTH,
            top: GRID_HEADER_HEIGHT,
            position: 'absolute',
          }}
        >
          {renderIndicator()}
          {renderBusyCell()}
          {renderGridCell()}
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
};
export default DayViewTimeLineGrid;
