import _extends from '@babel/runtime/helpers/esm/extends';

const CalendarLocale = {
  locale: 'zh_CN',
  today: '今天',
  now: '此刻',
  backToToday: '返回今天',
  ok: '确定',
  timeSelect: '选择时间',
  dateSelect: '选择日期',
  weekSelect: '选择周',
  clear: '清除',
  month: '月',
  year: '年',
  previousMonth: '上个月 (翻页上键)',
  nextMonth: '下个月 (翻页下键)',
  monthSelect: '选择月份',
  yearSelect: '选择年份',
  decadeSelect: '选择年代',
  yearFormat: 'YYYY年',
  dayFormat: 'D日',
  dateFormat: 'YYYY年M月D日',
  dateTimeFormat: 'YYYY年M月D日 HH时mm分ss秒',
  previousYear: '上一年 (Control键加左方向键)',
  nextYear: '下一年 (Control键加右方向键)',
  previousDecade: '上一年代',
  nextDecade: '下一年代',
  previousCentury: '上一世纪',
  nextCentury: '下一世纪',
};
const TimePickerLocale = {
  placeholder: '请选择时间',
  rangePlaceholder: ['开始时间', '结束时间'],
};

const locale = {
  lang: _extends(
    {
      placeholder: '请选择日期',
      yearPlaceholder: '请选择年份',
      quarterPlaceholder: '请选择季度',
      monthPlaceholder: '请选择月份',
      weekPlaceholder: '请选择周',
      rangePlaceholder: ['开始日期', '结束日期'],
      rangeYearPlaceholder: ['开始年份', '结束年份'],
      rangeMonthPlaceholder: ['开始月份', '结束月份'],
      rangeWeekPlaceholder: ['开始周', '结束周'],
      shortWeekDays: ['日', '一', '二', '三', '四', '五', '六'],
      shortMonths: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    },
    CalendarLocale
  ),
  timePickerLocale: _extends({}, TimePickerLocale),
};

locale.lang.ok = '确 定';

export default locale;
