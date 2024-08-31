import { Moment } from 'moment';
declare type AlignPoint = string;
interface AlignType {
  /**
   * move point of source node to align with point of target node.
   * Such as ['tr','cc'], align top right point of source node with center point of target node.
   * Point can be 't'(top), 'b'(bottom), 'c'(center), 'l'(left), 'r'(right) */
  points?: AlignPoint[];
  /**
   * offset source node by offset[0] in x and offset[1] in y.
   * If offset contains percentage string value, it is relative to sourceNode region.
   */
  offset?: number[];
  /**
   * offset target node by offset[0] in x and offset[1] in y.
   * If targetOffset contains percentage string value, it is relative to targetNode region.
   */
  targetOffset?: number[];
  /**
   * If adjustX field is true, will adjust source node in x direction if source node is invisible.
   * If adjustY field is true, will adjust source node in y direction if source node is invisible.
   */
  overflow?: {
    adjustX?: boolean | number;
    adjustY?: boolean | number;
  };
  /**
   * Whether use css right instead of left to position
   */
  useCssRight?: boolean;
  /**
   * Whether use css bottom instead of top to position
   */
  useCssBottom?: boolean;
  /**
   * Whether use css transform instead of left/top/right/bottom to position if browser supports.
   * Defaults to false.
   */
  useCssTransform?: boolean;
  ignoreShake?: boolean;
}
declare type Locale = {
  locale: string;
  /** Display month before year in date panel header */
  monthBeforeYear?: boolean;
  yearFormat: string;
  monthFormat?: string;
  quarterFormat?: string;
  today: string;
  now: string;
  backToToday: string;
  ok: string;
  timeSelect: string;
  dateSelect: string;
  weekSelect?: string;
  clear: string;
  month: string;
  year: string;
  previousMonth: string;
  nextMonth: string;
  monthSelect: string;
  yearSelect: string;
  decadeSelect: string;
  dayFormat: string;
  dateFormat: string;
  dateTimeFormat: string;
  previousYear: string;
  nextYear: string;
  previousDecade: string;
  nextDecade: string;
  previousCentury: string;
  nextCentury: string;
  shortWeekDays?: string[];
  shortMonths?: string[];
};
declare type RcPickerLocale = {
  locale: string;
  /** Display month before year in date panel header */
  monthBeforeYear?: boolean;
  yearFormat: string;
  monthFormat?: string;
  quarterFormat?: string;
  today: string;
  now: string;
  backToToday: string;
  ok: string;
  timeSelect: string;
  dateSelect: string;
  weekSelect?: string;
  clear: string;
  month: string;
  year: string;
  previousMonth: string;
  nextMonth: string;
  monthSelect: string;
  yearSelect: string;
  decadeSelect: string;
  dayFormat: string;
  dateFormat: string;
  dateTimeFormat: string;
  previousYear: string;
  nextYear: string;
  previousDecade: string;
  nextDecade: string;
  previousCentury: string;
  nextCentury: string;
  shortWeekDays?: string[];
  shortMonths?: string[];
};
declare type Components = {
  button?: React.ComponentType | string;
  rangeItem?: React.ComponentType | string;
};
declare type PickerRefConfig = {
  focus: () => void;
  blur: () => void;
};
declare type AdditionalPickerLocaleLangProps = {
  placeholder: string;
  yearPlaceholder?: string;
  quarterPlaceholder?: string;
  monthPlaceholder?: string;
  weekPlaceholder?: string;
  rangeYearPlaceholder?: [string, string];
  rangeMonthPlaceholder?: [string, string];
  rangeWeekPlaceholder?: [string, string];
  rangePlaceholder?: [string, string];
};
interface TimePickerLocale {
  placeholder?: string;
  rangePlaceholder?: [string, string];
}
declare type AdditionalPickerLocaleProps = {
  dateFormat?: string;
  dateTimeFormat?: string;
  weekFormat?: string;
  monthFormat?: string;
};
declare type PickerLocale = {
  lang: RcPickerLocale & AdditionalPickerLocaleLangProps;
  timePickerLocale: TimePickerLocale;
} & AdditionalPickerLocaleProps;
declare type PanelMode = 'time' | 'date' | 'week' | 'month' | 'quarter' | 'year' | 'decade';
declare type SizeType = 'small' | 'middle' | 'large' | undefined;
declare type MonthCellRender<DateType> = (currentDate: DateType, locale: Locale) => React.ReactNode;
declare type OnPanelChange<DateType> = (value: DateType, mode: PanelMode) => void;
declare type DisabledTime<DateType> = (date: DateType | null) => DisabledTimes;
declare type PickerMode = Exclude<PanelMode, 'datetime' | 'decade'>;
declare type CustomFormat<DateType> = (value: DateType) => string;
declare type GenerateConfig<DateType> = {
  getWeekDay: (value: DateType) => number;
  getSecond: (value: DateType) => number;
  getMinute: (value: DateType) => number;
  getHour: (value: DateType) => number;
  getDate: (value: DateType) => number;
  getMonth: (value: DateType) => number;
  getYear: (value: DateType) => number;
  getNow: () => DateType;
  getFixedDate: (fixed: string) => DateType;
  getEndDate: (value: DateType) => DateType;
  addYear: (value: DateType, diff: number) => DateType;
  addMonth: (value: DateType, diff: number) => DateType;
  addDate: (value: DateType, diff: number) => DateType;
  setYear: (value: DateType, year: number) => DateType;
  setMonth: (value: DateType, month: number) => DateType;
  setDate: (value: DateType, date: number) => DateType;
  setHour: (value: DateType, hour: number) => DateType;
  setMinute: (value: DateType, minute: number) => DateType;
  setSecond: (value: DateType, second: number) => DateType;
  isAfter: (date1: DateType, date2: DateType) => boolean;
  isValidate: (date: DateType) => boolean;
  locale: {
    getWeekFirstDay: (locale: string) => number;
    getWeekFirstDate: (locale: string, value: DateType) => DateType;
    getWeek: (locale: string, value: DateType) => number;
    format: (locale: string, date: DateType, format: string) => string;
    /** Should only return validate date instance */
    parse: (locale: string, text: string, formats: string[]) => DateType | null;
    /** A proxy for getting locale with moment or other locale library */
    getShortWeekDays?: (locale: string) => string[];
    /** A proxy for getting locale with moment or other locale library */
    getShortMonths?: (locale: string) => string[];
  };
};
declare type DisabledTimes = {
  disabledHours?: () => number[];
  disabledMinutes?: (hour: number) => number[];
  disabledSeconds?: (hour: number, minute: number) => number[];
};
declare type DateRender<DateType> = (currentDate: DateType, today: DateType) => React.ReactNode;
declare type SharedTimeProps<DateType> = {
  format?: string;
  showNow?: boolean;
  showHour?: boolean;
  showMinute?: boolean;
  showSecond?: boolean;
  use12Hours?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  hideDisabledOptions?: boolean;
  defaultValue?: DateType;
} & DisabledTimes;
declare type PickerPanelSharedProps<DateType> = {
  prefixCls?: string;
  className?: string;
  style?: React.CSSProperties;
  /** @deprecated Will be removed in next big version. Please use `mode` instead */
  mode?: PanelMode;
  tabIndex?: number;
  locale: Locale;
  generateConfig: GenerateConfig<DateType>;
  value?: DateType | null;
  defaultValue?: DateType;
  /** [Legacy] Set default display picker view date */
  pickerValue?: DateType;
  /** [Legacy] Set default display picker view date */
  defaultPickerValue?: DateType;
  disabledDate?: (date: DateType) => boolean;
  dateRender?: DateRender<DateType>;
  monthCellRender?: MonthCellRender<DateType>;
  renderExtraFooter?: (mode: PanelMode) => React.ReactNode;
  onSelect?: (value: DateType) => void;
  onChange?: (value: DateType) => void;
  onPanelChange?: OnPanelChange<DateType>;
  onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
  onOk?: (date: DateType) => void;
  direction?: 'ltr' | 'rtl';
  /** @private This is internal usage. Do not use in your production env */
  hideHeader?: boolean;
  /** @private This is internal usage. Do not use in your production env */
  onPickerValueChange?: (date: DateType) => void;
  /** @private Internal usage. Do not use in your production env */
  components?: Components;
};
declare type PickerPanelTimeProps<DateType> = {
  picker: 'time';
} & PickerPanelSharedProps<DateType> &
  SharedTimeProps<DateType>;
declare type PickerPanelDateProps<DateType> = {
  picker?: 'date';
  showToday?: boolean;
  showNow?: boolean;
  showTime?: boolean | SharedTimeProps<DateType>;
  disabledTime?: DisabledTime<DateType>;
} & PickerPanelSharedProps<DateType>;
declare type PickerPanelBaseProps<DateType> = {
  picker: Exclude<PickerMode, 'date' | 'time'>;
} & PickerPanelSharedProps<DateType>;
declare type PickerSharedProps<DateType> = {
  dropdownClassName?: string;
  dropdownAlign?: AlignType;
  popupStyle?: React.CSSProperties;
  transitionName?: string;
  placeholder?: string;
  allowClear?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  tabIndex?: number;
  open?: boolean;
  defaultOpen?: boolean;
  /** Make input readOnly to avoid popup keyboard in mobile */
  inputReadOnly?: boolean;
  id?: string;
  format?: string | CustomFormat<DateType> | (string | CustomFormat<DateType>)[];
  suffixIcon?: React.ReactNode;
  clearIcon?: React.ReactNode;
  prevIcon?: React.ReactNode;
  nextIcon?: React.ReactNode;
  superPrevIcon?: React.ReactNode;
  superNextIcon?: React.ReactNode;
  getPopupContainer?: (node: HTMLElement) => HTMLElement;
  panelRender?: (originPanel: React.ReactNode) => React.ReactNode;
  onChange?: (value: DateType | null, dateString: string) => void;
  onOpenChange?: (open: boolean) => void;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
  onMouseUp?: React.MouseEventHandler<HTMLDivElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>, preventDefault: () => void) => void;
  /** @private Internal usage, do not use in production mode!!! */
  pickerRef?: React.MutableRefObject<PickerRefConfig>;
  role?: string;
  name?: string;
  autoComplete?: string;
  direction?: 'ltr' | 'rtl';
} & React.AriaAttributes;
declare type InjectDefaultProps<Props> = Omit<
  Props,
  'locale' | 'generateConfig' | 'prevIcon' | 'nextIcon' | 'superPrevIcon' | 'superNextIcon' | 'hideHeader' | 'components'
> & {
  locale?: PickerLocale;
  size?: SizeType;
  bordered?: boolean;
};
declare type OmitPanelProps<Props> = Omit<Props, 'onChange' | 'hideHeader' | 'pickerValue' | 'onPickerValueChange'>;
declare type RCPickerBaseProps<DateType> = {} & PickerSharedProps<DateType> & OmitPanelProps<PickerPanelBaseProps<DateType>>;
declare type RCPickerDateProps<DateType> = {} & PickerSharedProps<DateType> & OmitPanelProps<PickerPanelDateProps<DateType>>;
declare type RCPickerTimeProps<DateType> = {
  picker: 'time';
  /**
   * @deprecated Please use `defaultValue` directly instead
   * since `defaultOpenValue` will confuse user of current value status
   */
  defaultOpenValue?: DateType;
} & PickerSharedProps<DateType> &
  Omit<OmitPanelProps<PickerPanelTimeProps<DateType>>, 'format'>;
declare type PickerBaseProps<DateType> = InjectDefaultProps<RCPickerBaseProps<DateType>>;
declare type PickerDateProps<DateType> = InjectDefaultProps<RCPickerDateProps<DateType>>;
declare type PickerTimeProps<DateType> = InjectDefaultProps<RCPickerTimeProps<DateType>>;
declare type PickerProps<DateType> = PickerBaseProps<DateType> | PickerDateProps<DateType> | PickerTimeProps<DateType>;
export type DatePickerProps = PickerProps<Moment>;

declare type RangeType = 'start' | 'end';
declare type RangeInfo = {
  range: RangeType;
};
declare type EventValue<DateType> = DateType | null;
declare type RangeValue<DateType> = [EventValue<DateType>, EventValue<DateType>] | null;
declare type RangeDateRender<DateType> = (currentDate: DateType, today: DateType, info: RangeInfo) => React.ReactNode;
declare type RangePickerSharedProps<DateType> = {
  id?: string;
  value?: RangeValue<DateType>;
  defaultValue?: RangeValue<DateType>;
  defaultPickerValue?: [DateType, DateType];
  placeholder?: [string, string];
  disabled?: boolean | [boolean, boolean];
  disabledTime?: (date: EventValue<DateType>, type: RangeType) => DisabledTimes;
  ranges?: Record<string, Exclude<RangeValue<DateType>, null> | (() => Exclude<RangeValue<DateType>, null>)>;
  separator?: React.ReactNode;
  allowEmpty?: [boolean, boolean];
  mode?: [PanelMode, PanelMode];
  onChange?: (values: RangeValue<DateType>, formatString: [string, string]) => void;
  onCalendarChange?: (values: RangeValue<DateType>, formatString: [string, string], info: RangeInfo) => void;
  onPanelChange?: (values: RangeValue<DateType>, modes: [PanelMode, PanelMode]) => void;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
  onOk?: (dates: RangeValue<DateType>) => void;
  direction?: 'ltr' | 'rtl';
  autoComplete?: string;
  /** @private Internal control of active picker. Do not use since it's private usage */
  activePickerIndex?: 0 | 1;
  dateRender?: RangeDateRender<DateType>;
  panelRender?: (originPanel: React.ReactNode) => React.ReactNode;
};
declare type OmitPickerProps<Props> = Omit<
  Props,
  | 'value'
  | 'defaultValue'
  | 'defaultPickerValue'
  | 'placeholder'
  | 'disabled'
  | 'disabledTime'
  | 'showToday'
  | 'showTime'
  | 'mode'
  | 'onChange'
  | 'onSelect'
  | 'onPanelChange'
  | 'pickerValue'
  | 'onPickerValueChange'
  | 'onOk'
  | 'dateRender'
>;
declare type RCRangePickerBaseProps<DateType> = {} & RangePickerSharedProps<DateType> & OmitPickerProps<PickerBaseProps<DateType>>;
declare type RangeShowTimeObject<DateType> = Omit<SharedTimeProps<DateType>, 'defaultValue'> & {
  defaultValue?: DateType[];
};
declare type RCRangePickerDateProps<DateType> = {
  showTime?: boolean | RangeShowTimeObject<DateType>;
} & RangePickerSharedProps<DateType> &
  OmitPickerProps<PickerDateProps<DateType>>;
declare type RCRangePickerTimeProps<DateType> = {
  order?: boolean;
} & RangePickerSharedProps<DateType> &
  OmitPickerProps<PickerTimeProps<DateType>>;
declare type RangePickerBaseProps<DateType> = InjectDefaultProps<RCRangePickerBaseProps<DateType>>;
declare type RangePickerDateProps<DateType> = InjectDefaultProps<RCRangePickerDateProps<DateType>>;
declare type RangePickerTimeProps<DateType> = InjectDefaultProps<RCRangePickerTimeProps<DateType>>;
declare type BaseRangePickerProps<DateType> = RangePickerBaseProps<DateType> | RangePickerDateProps<DateType> | RangePickerTimeProps<DateType>;
export declare type RangePickerProps = BaseRangePickerProps<Moment>;
