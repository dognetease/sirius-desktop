import moment, { Moment } from 'moment';
import React, { useEffect, useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import SiriusSelect from '@web-common/components/UI/SiriusSelect';
import styles from './customRepeat.module.scss';
import { InputNumber, Select, Radio, Space, DatePicker, DatePickerProps, Button } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { EnmuRecurrenceRule } from './util';
import { getWeekdayWithTimeZoneOffset } from '@web-common/utils/constant';
import CustomerDatePicker from '@/components/Layout/Customer/components/UI/DatePicker/datePicker';
import { ScheduleInsertForm } from './ScheduleForm';
import { day } from 'api';
import { getIn18Text } from 'api';
// 中英文

// 弹框宽度
const MODAL_WIDTH = 400;

// 单位备选
const DATE_FORMAT = getIn18Text('YYYYNIAN11');
const OPTIONS = [
  { value: EnmuRecurrenceRule.DAYLY, label: getIn18Text('TIAN') },
  { value: EnmuRecurrenceRule.WEEKLY, label: getIn18Text('ZHOU') },
  { value: EnmuRecurrenceRule.MONTHLY, label: getIn18Text('YUE') },
  { value: EnmuRecurrenceRule.YEARLY, label: getIn18Text('NIAN') },
];
// 周按钮
const WEEK = [
  { value: 7, label: '日' },
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
];
// 获取当天是月份的第几个周几
const getWeekAndDay = (m?: Moment) => {
  const mTime = m?.clone() || moment();
  const weekday = mTime.isoWeekday();
  const month = mTime.month();
  let temp = 1;
  let prev = mTime.subtract(7, 'd');
  while (prev.month() === month) {
    temp += 1;
    prev = prev.subtract(7, 'd');
  }
  return [temp, weekday];
};
// 根据规则,重复次数，形成结束时间
const getRruleUntil = (json: pickFormData, startData: Moment): Moment => {
  const { interval, enmuRecurrenceRule, count } = json;
  let unit = '';
  if (enmuRecurrenceRule === EnmuRecurrenceRule.DAYLY) {
    unit = 'days';
  } else if (enmuRecurrenceRule === EnmuRecurrenceRule.WEEKLY) {
    unit = 'weeks';
  } else if (enmuRecurrenceRule === EnmuRecurrenceRule.MONTHLY) {
    unit = 'months';
  } else if (enmuRecurrenceRule === EnmuRecurrenceRule.YEARLY) {
    unit = 'years';
  }
  return (startData as Moment).clone().add({ [unit]: Number(interval) * Number(count) });
};
// 根据规则形成文案
export const getRecurIntro = (json: pickFormData): string => {
  let str1 = '';
  let str2 = '';
  const { interval, enmuRecurrenceRule, count, byDay, byMonthDay, bySetPos, rruleUntil } = json;
  const enmuRecurrenceRuleStr = enmuRecurrenceRule?.split('/')[0];
  if (enmuRecurrenceRuleStr === EnmuRecurrenceRule.DAYLY) {
    if (interval) {
      str1 = `每${interval === 1 ? '' : interval}天重复`;
    } else {
      str1 = `每天重复`;
    }
  } else if (enmuRecurrenceRuleStr === EnmuRecurrenceRule.WEEKLY) {
    if (byDay && byDay[0]?.length && interval) {
      if (byDay[0].slice().sort().join('') === '12345') {
        str1 = `每${interval === 1 ? '个' : interval + '周'}工作日重复`;
      } else {
        const weekStr = byDay[0]
          .sort()
          .map(num => WEEK.find(w => w.value === num)?.label)
          .map(w => `周${w}`)
          .join('、');
        str1 = `每${interval === 1 ? '' : interval + '周的'}${weekStr}重复`;
      }
    } else {
      str1 = `每周重复`;
    }
  } else if (enmuRecurrenceRuleStr === EnmuRecurrenceRule.WEEKDAY) {
    str1 = `每个工作日重复`;
  } else if (enmuRecurrenceRuleStr === EnmuRecurrenceRule.MONTHLY) {
    if (interval) {
      if (byMonthDay?.length) {
        str1 = `每${interval === 1 ? '月' : interval + '个月'}的${byMonthDay[0]}日重复`;
      } else if (bySetPos?.length && byDay && byDay[0]?.length) {
        const weekstr = WEEK.find(w => w.value === byDay[0][0])?.label;
        str1 = `每${interval === 1 ? '月' : interval + '个月'}的第${bySetPos[0]}个周${weekstr}重复`;
      } else {
        str1 = `每月重复`;
      }
    } else {
      str1 = `每月重复`;
    }
  } else if (enmuRecurrenceRuleStr === EnmuRecurrenceRule.YEARLY) {
    if (interval) {
      str1 = `每${interval === 1 ? '' : interval}年重复`;
    } else {
      str1 = `每年重复`;
    }
  }
  if (count) {
    str2 = `${count}次后结束`;
  } else if (rruleUntil) {
    str2 = `到${rruleUntil.format(DATE_FORMAT)}结束`;
  }
  return str2 ? str1 + '，' + str2 : str1;
};

// 点击确定回调的参数
type pickFormData = Partial<ScheduleInsertForm>;
// props定义
interface CustomRepeatProps {
  onOk?(formData: pickFormData): void; // 点击确定回调，传递会form数据
  onCancel?(): void;
}
// 几个默认值
const defaultInterval = 1;
const defaultFreq = EnmuRecurrenceRule.DAYLY;
const defaultRadio = 1;
const defaultWeek: day[] = [moment().isoWeekday() as day];
const defaultRruleUntil = moment();
const defaultCount = 1;
const defaultMonthSelect = 1;

const CustomRepeat = (props: CustomRepeatProps, ref: React.Ref<unknown> | undefined) => {
  const { onOk, onCancel } = props;
  const [show, setShow] = useState<boolean>(false); // 是否展示
  const [interval, setInterval] = useState<number>(defaultInterval); // 频率
  const [freq, setFreq] = useState<EnmuRecurrenceRule>(defaultFreq); // 重复单位：天，周，月，年
  const [radio, setRadio] = useState<number>(defaultRadio); // 默认不重复
  const [weekDay, setWeekDay] = useState<number[]>(defaultWeek); // 选中的周
  const [okBtnDisabled, setOkBtnDisabled] = useState<boolean>(false); // 确认按钮是否可点击
  // 外部传入
  const [startDate, setStartDate] = useState<Moment>(moment()); // 外部传入的日程开始日期
  const [endDate, setEndDate] = useState<Moment | null>(); // 外部传入的循环规则截止日期，会议是限制的，默认90天后
  // 禁用日期
  const disabledDate = useCallback(
    (current: Moment) => {
      const tooEarly = current.isBefore(startDate, 'day'); //太早
      // 如果选择了会议室，则设置为不能晚于会议室预定时间，否则为false
      const tooLate = endDate ? current.isAfter(endDate, 'day') : false;
      return !!tooEarly || !!tooLate;
    },
    [startDate, endDate]
  );

  // 结束时间
  const [rruleUntil, setRruleUntil] = useState<Moment>(defaultRruleUntil);
  // 重复次数
  const [count, setCount] = useState<number>(defaultCount);
  // 月下拉选项
  const [monthSelect, setMonthSelect] = useState<number>(defaultMonthSelect); // 1选择第几天，2，选择第几个周几
  // 展示自定义重复
  const showCustomRepeat = (startDate: Moment, endDate?: Moment) => {
    setStartDate(startDate?.clone() || moment()); // 开始时间引入,默认今天之前的不可以选择
    if (endDate) {
      setEndDate(endDate);
    } else {
      setEndDate(null);
    }
    reset();
    setRruleUntil(startDate?.clone() || moment()); // 循环结束时间，也默认为日程开始时间
    setWeekDay([startDate?.clone().isoWeekday()]); // 默认选中日程开始时间的周几
    if (endDate) {
      setRadio(2); // 设置选中日期，其他可不选
    }
    setShow(true);
  };
  // 关闭
  const hideCustomRepeat = () => {
    onCancel && onCancel();
    setShow(false);
  };
  // 导出的方法
  useImperativeHandle(ref, () => ({
    showCustomRepeat, // 显示
    reset, // 重置
  }));
  const changeInterval = (num: number) => {
    setInterval(+num);
  };

  // 修改结束时间
  const changeRadio = e => {
    const value = e.target.value;
    setRadio(+value);
  };
  // 修改结束时间
  const onChangeUntil: DatePickerProps['onChange'] = (date, dateString) => {
    setRruleUntil(moment(dateString, DATE_FORMAT));
  };
  const changeCount = (count: number) => {
    setCount(count);
  };
  // 选中周几
  const handleWeek = (week: number) => {
    if (weekDay.includes(+week)) {
      setWeekDay(weekDay.filter(d => d !== +week).sort((a, b) => a - b));
    } else {
      setWeekDay([...weekDay, +week].sort((a, b) => a - b));
    }
  };
  // 渲染周选项
  const renderWeek = () => {
    return (
      freq === EnmuRecurrenceRule.WEEKLY && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
          {WEEK.map(d => (
            <Button className={styles.btn} type={weekDay.includes(d.value) ? 'primary' : 'default'} onClick={() => handleWeek(d.value)}>
              {d.label}
            </Button>
          ))}
        </div>
      )
    );
  };
  // 渲染月下拉框
  const renderMonth = () => {
    const day = startDate.date();
    const [week] = getWeekAndDay(startDate);
    const options = [
      { value: 1, label: `第${day}天` },
      { value: 2, label: `第${week}个${getWeekdayWithTimeZoneOffset(startDate.clone())}` },
    ];
    return (
      freq === EnmuRecurrenceRule.MONTHLY && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Select style={{ width: '250px' }} options={options} value={monthSelect} onChange={val => setMonthSelect(val)} />
        </div>
      )
    );
  };

  // 确认
  const handleOk = () => {
    const json = {
      interval,
      enmuRecurrenceRule: freq,
    } as pickFormData;
    // 日和年，不需要单独处理
    // 周
    if (freq === EnmuRecurrenceRule.WEEKLY) {
      json.byDay = { 0: weekDay };
    }
    // 月
    if (freq === EnmuRecurrenceRule.MONTHLY) {
      // 第几天
      if (monthSelect === 1) {
        json.byMonthDay = [startDate.clone().date()];
      } else if (monthSelect === 2) {
        // 第几个周几
        const [week, weekDay] = getWeekAndDay(startDate.clone());
        json.bySetPos = [week];
        json.byDay = { 0: [weekDay as day] };
      }
    }
    // 如果选择结束时间，则传递时间即可，如果选择次数，截止时间需要计算一下
    if (radio === 2) {
      json.rruleUntil = rruleUntil;
    } else if (radio === 3) {
      json.count = count;
      json.rruleUntil = getRruleUntil(json, startDate);
    }
    // 形成文案
    json.recurIntro = getRecurIntro(json);
    setShow(false); // 关闭弹窗
    onOk && onOk(json);
  };
  // 重置为默认值
  const reset = () => {
    setInterval(defaultInterval);
    setFreq(defaultFreq);
    setRadio(defaultRadio);
    setRruleUntil(defaultRruleUntil);
    setCount(defaultCount);
    setWeekDay(defaultWeek);
    setMonthSelect(defaultMonthSelect);
  };

  useEffect(() => {
    // 选择周，没选择周几，确认不可点击
    const temp1 = freq === EnmuRecurrenceRule.WEEKLY && weekDay.length === 0;
    if (temp1) {
      setOkBtnDisabled(true);
    } else {
      setOkBtnDisabled(false);
    }
  }, [freq, weekDay]);

  // 修改频率单位
  const handleFreq = freq => {
    setFreq(freq);
    // if (endDate) {
    //   setRadio(2);
    // } else {
    //   setRadio(1);
    // }
  };

  return (
    <>
      <Modal
        bodyStyle={{ padding: '16px 20px 12px 20px', overflow: 'hidden' }}
        className={styles.customRepeat}
        getContainer={() => document.body}
        title={getIn18Text('customRepeat')}
        destroyOnClose
        centered
        closable
        width={MODAL_WIDTH}
        visible={show}
        onOk={handleOk}
        okButtonProps={{ disabled: okBtnDisabled }}
        onCancel={hideCustomRepeat}
      >
        <div>
          <div className={styles.line}>
            <div style={{ width: '110px' }}>重复频率：</div>
            <InputNumber style={{ width: '120px' }} max={365} min={1} onChange={changeInterval} value={interval} />
            <SiriusSelect size="middle" style={{ width: '120px', marginLeft: '8px' }} options={OPTIONS} value={freq} defaultValue={freq} onChange={handleFreq} />
          </div>
          {/* 周选项 */}
          {renderWeek()}
          {/* 月选项 */}
          {renderMonth()}
          <div style={{ marginTop: '16px' }}>
            <div>结束时间：</div>
            <div style={{ display: 'flex', marginTop: '12px' }}>
              <Radio.Group onChange={changeRadio} value={radio}>
                <Space direction="vertical" size={8}>
                  <Radio className={styles.radio} disabled={!!endDate} value={1}>
                    不结束
                  </Radio>
                  <Radio className={styles.radio} value={2}>
                    <span className={styles.label}>结束时间</span>
                  </Radio>
                  <Radio className={styles.radio} disabled={!!endDate} value={3}>
                    <span className={styles.label}>重复</span>
                  </Radio>
                </Space>
              </Radio.Group>
              <div>
                {/* 结束日期 */}
                <CustomerDatePicker
                  disabledDate={disabledDate}
                  allowClear={false}
                  value={rruleUntil}
                  format={DATE_FORMAT}
                  disabled={radio !== 2}
                  onChange={onChangeUntil}
                  placeholder=""
                  style={{ width: '100%', marginTop: '40px' }}
                />
                {/* 重复次数 */}
                <InputNumber disabled={radio !== 3} max={365} min={1} onChange={changeCount} value={count} style={{ width: '120px' }} className={styles.count} />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
export default forwardRef(CustomRepeat);
