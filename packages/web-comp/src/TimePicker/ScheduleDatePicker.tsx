import DatePicker, { registerLocale, setDefaultLocale, ReactDatePickerProps } from 'react-datepicker';
import React, { useState } from 'react';
import zhCN from 'date-fns/locale/zh-CN';
// import moment, { isMoment, Moment } from 'moment';
// import { Input } from 'antd';
import Input, { InputProps } from '../Input';
// import { InputProps } from 'antd/lib/input';
// import classNames from 'classnames';
// import styles from './schedule_date_picker.module.scss';
// import { getIn18Text } from 'api';

registerLocale('zhCN', zhCN);
setDefaultLocale('zhCN');

// interface ScheduleDatePickerProps {
//   onChange?(date: Moment | null): void;
//   value?: Moment;
//   style?: React.CSSProperties;
//   allowClear?: boolean;
//   className?: string;
//   disabled?: boolean;
//   placeholder?: string;
//   filterDate?: (time: Date) => boolean;
//   onKeyDown?(event: React.KeyboardEvent<HTMLDivElement>): void;
//   dateFormat?: string;
//   popperStrategy?: string;
// }

/**
 * 呈现的输入组件用antd的Input 可以在外层改写样式或者直接传入 style className
 */
export const CustomDatePickerInput = React.forwardRef<any, InputProps>((props, ref) => <Input ref={ref} {...props} />);

// const customHeader: ReactDatePickerProps<any>['renderCustomHeader'] = ({
//   date,
//   // changeYear,
//   // changeMonth,
//   decreaseMonth,
//   increaseMonth,
//   // prevMonthButtonDisabled,
//   // nextMonthButtonDisabled,
//   // decreaseYear,
//   // increaseYear
// }) => (
//   <div className={styles.header}>
//     <i onClick={decreaseMonth} className={classNames(styles.arrow, styles.left)} />
//     <span className={styles.date}>{moment(date).format(getIn18Text('yyyyNIAN'))}</span>
//     {/* <span className={styles.date}>{moment(date).format('yyyy年 MM月')}</span> */}
//     <i onClick={increaseMonth} className={classNames(styles.arrow, styles.right)} />
//   </div>
// );

// const PreSetDatePicker: React.FC<ScheduleDatePickerProps> = props => {
//   const { dateFormat = 'yyyy-MM-dd', onChange, value, style, allowClear = true, className, filterDate, onKeyDown, popperStrategy, ...rest } = props;
//   const [date, setDate] = useState<Date | undefined>(moment.isMoment(value) ? value.toDate() : undefined);
//   const dateChange = (d: Date) => {
//     if (onChange) {
//       onChange(d ? moment(d) : null);
//     }
//     setDate(d);
//   };

//   return (
//     <div className={styles.reactDatepickerWrapper}>
//       <DatePicker
//         onChange={dateChange}
//         selected={isMoment(value) ? value.toDate() : date}
//         closeOnScroll={() => true}
//         filterDate={filterDate}
//         onKeyDown={onKeyDown}
//         // eslint-disable-next-line react/jsx-props-no-spreading
//         {...rest}
//         placeholderText={rest.placeholder}
//         locale="zhCN"
//         dateFormat={dateFormat}
//         showPopperArrow={false}
//         customInput={<CustomDatePickerInput disabled={rest.disabled} className={className} style={style} />}
//         // 保证在弹窗内等元素内可视
//         popperProps={{ strategy: popperStrategy }}
//         popperModifiers={[
//           {
//             name: 'preventOverflow',
//             options: {
//               altAxis: true,
//             },
//           },
//           {
//             name: 'flip',
//             options: {
//               altBoundary: true,
//             },
//           },
//         ]}
//         isClearable={isMoment(value) && allowClear && !rest.disabled}
//         renderCustomHeader={customHeader}
//       />
//     </div>
//   );
// };

// export default PreSetDatePicker;
