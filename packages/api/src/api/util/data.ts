import { Moment } from 'moment';

export type TimeRange = Moment[];

export interface TimeLinePickerProps {
  /**
   * 已经被占据的时间
   */
  occupied?: TimeRange[];
  /**
   * 禁止使用的时间
   */
  forbidden?: TimeRange[];

  /**
   * 改变时间回调
   * @param range 时间范围
   */
  onChange?(range: TimeRange, uniqueInfo?: any): void;

  /**
   * 选中时间回调
   * @param range 时间范围
   */
  onOk?(range: TimeRange): void;

  /**
   * 值，以支持表单
   */
  value?: TimeRange;
  /**
   * 默认值
   */
  defaultValue?: TimeRange;
  /**
   * 日期
   */
  date?: Moment;
  /**
   * 时间轴开始时间，默认为7
   */
  startHour?: number;
  /**
   * 时间轴开始时间，默认为23
   */
  endHour?: number;
  /**
   * 每小时分成多少个时段，默认为2。
   * 需为60的因数，下面分别代表每隔30｜15｜10｜5分钟为一个时段
   */
  pieceOfHour?: 2 | 4 | 6 | 12 | number;
  /**
   * 类样式
   */
  className?: string;
}

export interface TimeLinePickerContextValue {
  /**
   * 透传属性
   */
  props?: TimeLinePickerProps;

  onIdChange?(id: any): void;

  uniqueId?: any;
}
