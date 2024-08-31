import { useState, useRef, useEffect } from 'react';
import moment, { Moment } from 'moment';

const useTimeRange = () => {
  const [timeRange, setTimeRange] = useState({
    sTime: '',
    eTime: '',
  });
  const currentDateRef = useRef<Moment[] | null>(null);

  /**
   * 日期变化处理函数
   * @param date moment[]
   */
  const handleDateChange = (date: any[]) => {
    const sTime = date[0].startOf('day').format('YYYY-MM-DD');
    const eTime = date[1].endOf('day').format('YYYY-MM-DD');

    currentDateRef.current = date;
    setTimeRange({
      sTime,
      eTime,
    });
  };

  useEffect(() => {
    // 默认展示最近七天的数据
    let initDate = [
      moment()
        .day(moment().day() - 6)
        .endOf('day'),
      moment().endOf('day'),
    ];
    // navigate 页面跳转参数
    const state = history.state;
    if (state?.startDate) {
      initDate = [moment(state.startDate), moment(state.endDate)];
    }

    currentDateRef.current = initDate;

    handleDateChange(currentDateRef.current);
  }, []);

  return {
    timeRange,
    currentDateRef,
    handleDateChange,
  };
};

export default useTimeRange;
