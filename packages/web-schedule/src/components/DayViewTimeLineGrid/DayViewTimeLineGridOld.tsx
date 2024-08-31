import React, { useEffect, useMemo, useRef, useState } from 'react';
import classnames from 'classnames';
import moment, { Moment } from 'moment';
import { FreeBusyModel, api } from 'api';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useResizeDetector } from 'react-resize-detector';
import styles from './dayviewtimelinegrid.module.scss';
import { DayViewTimeLineGridProps } from './data';
import { queryFreeBusyList } from '../../service';
import DateSwitch from './DateSwitch';
import { fixNumber } from './util';
import { rangeInteract } from '../TimeLinePicker/util';
import GridHeader from './GridHeader';
import { useAppSelector } from '@web-common/state/createStore';

const sysApi = api.getSystemApi();

const timeLineScale = new Array(24).fill(null).map((_, index) => fixNumber(index + 1));

const DATE_SWTICH_HEIGHT = 44 + 16 + 8; // height + margin + padding
const MIN_GRID_CONTAINER_HEIGHT = 502; // 440 + 88 - (44 + 16 + 8)
const MIN_GRID_CONTAINER_WIDTH = 380;
const GRID_CONTAINER_MARGIN_RIGHT = 16;
const GRID_CONTAINER_MARGIN_BOTTOM = 0;
const GRID_COL_HEADER_WIDTH = 60;
const GRID_CELL_HEIGHT = 48;

const DayViewTimeLineGrid: React.FC<DayViewTimeLineGridProps> = ({ startDate, endDate, startTime, endTime, users = [], allDay = 0 }) => {
  const [currentDate, setCurrentDate] = useState<Moment>(startDate || moment().startOf('day'));
  const [userFreeBusy, setUserFreeBusy] = useState<FreeBusyModel[]>([]);
  // const [userFreeBusy, setUserFreeBusy] = useState<FreeBusyModel[]>([]);
  const [scrollOffset, setScrollOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const scrollRef = useRef<OverlayScrollbarsComponent>(null);
  const { ref: sizeRef, width: containerWidth = MIN_GRID_CONTAINER_WIDTH, height: containerHeight = MIN_GRID_CONTAINER_HEIGHT } = useResizeDetector();
  const criticalCellWidth = useRef<number>(0);
  const GRID_WIDTH = containerWidth - GRID_COL_HEADER_WIDTH;
  const GRID_CONTAINER_HEIGHT = containerHeight - DATE_SWTICH_HEIGHT;
  const { scheduleEvent: editingEvent } = useAppSelector(state => state.scheduleReducer);
  const uid = editingEvent?.scheduleInfo.uid;

  const formStart = useMemo(() => {
    const _startDate = startDate || moment().startOf('day');
    const _startTime = startTime || moment().startOf('day');
    return allDay
      ? _startDate.clone().startOf('day')
      : _startDate.clone().set({
          hour: _startTime.hours(),
          minute: _startTime.minute(),
          second: 0,
          millisecond: 0,
        });
  }, [allDay, startDate, startTime]);

  const formEnd = useMemo(() => {
    const _endDate = endDate || moment().endOf('day');
    const _endTime = endTime || moment().endOf('day');
    return allDay
      ? _endDate.clone().endOf('day')
      : _endDate.clone().set({
          hour: _endTime.hours(),
          minute: _endTime.minute(),
          second: 0,
          millisecond: 0,
        });
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

  const GRID_CELL_WIDTH =
    useMemo(() => {
      // 自适应宽度
      // 3个人及以下 取总宽的算数平均 临界值设为0
      // 4个人 取总宽的 1/3.5 即总宽容纳3.5个联系人 取此时的宽度为临界值
      // 4个人以上 取临界值和总宽算数平均的最大值 保证铺满屏幕
      let CW = GRID_WIDTH / (userFreeBusy.length || 1);
      if (userFreeBusy.length < 4) {
        criticalCellWidth.current = 0;
      } else {
        if (criticalCellWidth.current === 0) {
          criticalCellWidth.current = GRID_WIDTH / 3.5;
        }
        CW = Math.max(criticalCellWidth.current, CW);
      }
      return CW;
    }, [GRID_WIDTH, userFreeBusy.length]) - GRID_CONTAINER_MARGIN_RIGHT;

  /**
   * 时间指示器显示的时间范围
   * 当前时间和表单开始结束时间的交集
   */
  const indicatorRange = useMemo(
    () => rangeInteract([formStart.clone(), formEnd.clone()], [currentDate.clone().startOf('day'), currentDate.clone().endOf('day')]),
    [currentDate, formStart, formEnd]
  );
  /**
   * 联系人忙状态实际忙闲状态（关联开始结束时间）
   */
  const userBusyStatusArray = useMemo(
    () =>
      userFreeBusy.map(item => {
        let busy = false;
        for (let i = 0; i < item.freeBusyItems.length; i++) {
          const element = item.freeBusyItems[i];
          busy = rangeInteract([moment(element.start), moment(element.end)], [formStart, formEnd]) !== null;
          if (busy) {
            break;
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
    // const indicatorInteract = indicatorRange
    if (indicatorRange === null) {
      return null;
    }

    return (
      <div
        className={classnames(styles.indicator, {
          [styles.indicatorBusy]: userBusyStatusArray.reduce((prev, busy) => prev || busy, false),
        })}
        style={{
          position: 'absolute',
          // left: GRID_COL_HEADER_WIDTH,
          width: GRID_CELL_WIDTH * userFreeBusy.length,
          height: indicatorRange[1].diff(indicatorRange[0].clone(), 'hours', !0) * GRID_CELL_HEIGHT,
          top: indicatorRange[0].diff(indicatorRange[0].clone().startOf('day'), 'hours', !0) * GRID_CELL_HEIGHT,
        }}
      />
    );
  };
  /**
   * 渲染忙碌的单元格
   * 相对-绝对定位
   */
  const renderBusyCell = () => (
    <>
      {userFreeBusy.map((usr, rowIndex) => (
        <React.Fragment key={usr.account.accountId}>
          {usr.freeBusyItems.map(item => {
            const start = moment(item.start);
            const end = moment(item.end);
            const interact = rangeInteract([start, end], [currentDate.clone().startOf('day'), currentDate.clone().endOf('day')]);
            if (interact) {
              const [rangeStart, rangeEnd] = interact;
              const height = rangeEnd.diff(rangeStart, 'hours', !0) * GRID_CELL_HEIGHT;
              return (
                <div
                  key={item.scheduleId}
                  style={{
                    position: 'absolute',
                    left: GRID_CELL_WIDTH * rowIndex,
                    width: GRID_CELL_WIDTH,
                    height,
                    top: rangeStart.diff(rangeStart.clone().startOf('day'), 'hours', !0) * GRID_CELL_HEIGHT,
                    background: 'rgba(38, 42, 51, 0.1)',
                    textAlign: 'center',
                    lineHeight: `${height}px`,
                    fontSize: 12,
                    color: 'rgba(38, 42, 51, 0.9)',
                    zIndex: 1,
                  }}
                >
                  {item.summary}
                </div>
              );
            }
            return null;
          })}
        </React.Fragment>
      ))}
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
        height: GRID_CELL_HEIGHT,
        width: userFreeBusy.length * GRID_CELL_WIDTH + GRID_COL_HEADER_WIDTH,
        left: -scrollOffset.x,
      }}
    >
      <div
        className={styles.gridRowHeader}
        style={{
          position: 'absolute',
          left: GRID_COL_HEADER_WIDTH,
          height: GRID_CELL_HEIGHT,
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
              height: GRID_CELL_HEIGHT,
              width: GRID_CELL_WIDTH,
            }}
          >
            <GridHeader busy={userBusyStatusArray[index]} text={item.account.extNickname || item.account.extDesc} />
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
  const renderGirdColHeader = () => (
    <div
      className={styles.gridColHaederContainer}
      style={{
        position: 'absolute',
        top: -scrollOffset.y,
        width: GRID_COL_HEADER_WIDTH,
        height: timeLineScale.length * GRID_CELL_HEIGHT + GRID_CELL_HEIGHT + GRID_CONTAINER_MARGIN_BOTTOM,
      }}
    >
      <div
        className={styles.gridColHaeder}
        style={{
          position: 'absolute',
          top: GRID_CELL_HEIGHT,
          width: GRID_COL_HEADER_WIDTH,
          height: timeLineScale.length * GRID_CELL_HEIGHT,
        }}
      >
        {timeLineScale.map((unit, index, arr) => (
          <div
            key={unit}
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
    </div>
  );
  /**
   * 渲染单元格
   * grid布局
   * 模拟表格
   */
  const renderGridCell = () => (
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
  );
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
        height: GRID_CELL_HEIGHT,
        // background: '#FFF',
      }}
    >
      <span>GMT+8</span>
    </div>
  );

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
    }).then(setUserFreeBusy);
  }, [currentDate, users]);
  /**
   * 当时间指示器位置发生变化
   * 滚动到可视位置
   */
  useEffect(() => {
    const scrollInstance = scrollRef.current?.osInstance();
    let y = 0;
    if (indicatorRange) {
      const [indicatorStart] = indicatorRange;
      const dayStart = currentDate.clone().startOf('day');
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
  return (
    <div ref={sizeRef} className={styles.container}>
      <DateSwitch date={currentDate} onChange={setCurrentDate} />
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
            height: GRID_CONTAINER_HEIGHT - GRID_CONTAINER_MARGIN_BOTTOM - GRID_CELL_HEIGHT,
            width: containerWidth - GRID_CONTAINER_MARGIN_RIGHT - GRID_COL_HEADER_WIDTH,
            left: GRID_COL_HEADER_WIDTH,
            top: GRID_CELL_HEIGHT,
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
