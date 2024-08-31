// @ts-nocheck
export declare type Mode = 'multiple' | 'tags' | 'combobox';
export declare type FilterFunc<OptionType> = (inputValue: string, option?: OptionType) => boolean;
export declare type OnClear = () => void;
export declare type RenderNode = React.ReactNode | ((props: any) => React.ReactNode);
export declare type RenderDOMFunc = (props: any) => HTMLElement;
export declare type CustomTagProps = {
  label: React.ReactNode;
  value: DefaultValueType;
  disabled: boolean;
  onClose: (event?: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  closable: boolean;
};
export declare type SingleType<MixType> = MixType extends (infer Single)[] ? Single : MixType;
export declare type SelectSource = 'option' | 'selection' | 'input';
export interface OrgSelectProps<OptionsType extends object[], ValueType> extends React.AriaAttributes {
  prefixCls?: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  options?: OptionsType;
  children?: React.ReactNode;
  mode?: Mode;
  value?: ValueType;
  defaultValue?: ValueType;
  labelInValue?: boolean;
  /** Config max length of input. This is only work when `mode` is `combobox` */
  maxLength?: number;
  inputValue?: string;
  searchValue?: string;
  optionFilterProp?: string;
  /**
   * In Select, `false` means do nothing.
   * In TreeSelect, `false` will highlight match item.
   * It's by design.
   */
  filterOption?: boolean | FilterFunc<OptionsType[number]>;
  filterSort?: (optionA: OptionsType[number], optionB: OptionsType[number]) => number;
  showSearch?: boolean;
  autoClearSearchValue?: boolean;
  onSearch?: (value: string) => void;
  onClear?: OnClear;
  allowClear?: boolean;
  clearIcon?: React.ReactNode;
  showArrow?: boolean;
  inputIcon?: RenderNode;
  removeIcon?: React.ReactNode;
  menuItemSelectedIcon?: RenderNode;
  open?: boolean;
  defaultOpen?: boolean;
  listHeight?: number;
  listItemHeight?: number;
  dropdownStyle?: React.CSSProperties;
  dropdownClassName?: string;
  dropdownMatchSelectWidth?: boolean | number;
  virtual?: boolean;
  dropdownRender?: (menu: React.ReactElement) => React.ReactElement;
  dropdownAlign?: any;
  animation?: string;
  transitionName?: string;
  getPopupContainer?: RenderDOMFunc;
  direction?: string;
  disabled?: boolean;
  loading?: boolean;
  autoFocus?: boolean;
  defaultActiveFirstOption?: boolean;
  notFoundContent?: React.ReactNode;
  placeholder?: React.ReactNode;
  backfill?: boolean;
  /** @private Internal usage. Do not use in your production. */
  getInputElement?: () => JSX.Element;
  /** @private Internal usage. Do not use in your production. */
  getRawInputElement?: () => JSX.Element;
  optionLabelProp?: string;
  maxTagTextLength?: number;
  maxTagCount?: number | 'responsive';
  maxTagPlaceholder?: React.ReactNode | ((omittedValues: LabelValueType[]) => React.ReactNode);
  tokenSeparators?: string[];
  tagRender?: (props: CustomTagProps) => React.ReactElement;
  showAction?: ('focus' | 'click')[];
  tabIndex?: number;
  onKeyUp?: React.KeyboardEventHandler<HTMLDivElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  onPopupScroll?: React.UIEventHandler<HTMLDivElement>;
  onDropdownVisibleChange?: (open: boolean) => void;
  onSelect?: (value: SingleType<ValueType>, option: OptionsType[number]) => void;
  onDeselect?: (value: SingleType<ValueType>, option: OptionsType[number]) => void;
  onInputKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onClick?: React.MouseEventHandler;
  onChange?: (value: ValueType, option: OptionsType[number] | OptionsType) => void;
  onBlur?: React.FocusEventHandler<HTMLElement>;
  onFocus?: React.FocusEventHandler<HTMLElement>;
  onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
  choiceTransitionName?: string;
  /**
   * Only used in current version for internal event process.
   * Do not use in production environment.
   */
  internalProps?: {
    mark?: string;
    onClear?: OnClear;
    skipTriggerChange?: boolean;
    skipTriggerSelect?: boolean;
    onRawSelect?: (value: RawValueType, option: OptionsType[number], source: SelectSource) => void;
    onRawDeselect?: (value: RawValueType, option: OptionsType[number], source: SelectSource) => void;
  };
}
export declare type RawValueType = string | number;
export declare type Key = string | number;
export interface LabelValueType {
  key?: Key;
  value?: RawValueType;
  label?: React.ReactNode;
  isCacheable?: boolean;
}
export interface OptionCoreData {
  key?: Key;
  disabled?: boolean;
  value: Key;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  label?: React.ReactNode;
  /** @deprecated Only works when use `children` as option data */
  children?: React.ReactNode;
}
export interface OptionData extends OptionCoreData {
  /** Save for customize data */
  [prop: string]: any;
}
export interface OptionGroupData {
  key?: Key;
  label?: React.ReactNode;
  options: OptionData[];
  className?: string;
  style?: React.CSSProperties;
  /** Save for customize data */
  [prop: string]: any;
}
export declare type SizeType = 'small' | 'middle' | 'large' | undefined;
export declare type SelectOptionsType = (OptionData | OptionGroupData)[];
export declare type DefaultValueType = RawValueType | RawValueType[] | LabelValueType | LabelValueType[];
export declare type RcSelectProps<ValueType extends DefaultValueType = DefaultValueType> = OrgSelectProps<SelectOptionsType, ValueType>;
export interface InternalSelectProps<VT> extends Omit<RcSelectProps<VT>, 'mode'> {
  suffixIcon?: React.ReactNode;
  size?: SizeType;
  mode?: 'multiple' | 'tags' | 'SECRET_COMBOBOX_MODE_DO_NOT_USE';
  bordered?: boolean;
}
export interface SelectProps<VT> extends Omit<InternalSelectProps<VT>, 'inputIcon' | 'mode' | 'getInputElement' | 'getRawInputElement' | 'backfill'> {
  mode?: 'multiple' | 'tags';
}
declare type RawValue = string | number;
export interface LabeledValue {
  key?: string;
  value: RawValue;
  label: React.ReactNode;
}
export declare type SelectValue = RawValue | RawValue[] | LabeledValue | LabeledValue[] | undefined;
export interface RefSelectProps {
  focus: () => void;
  blur: () => void;
}
export interface OptionProps extends Omit<OptionCoreData, 'label'> {
  children: React.ReactNode;
  /** Save for customize data */
  [prop: string]: any;
}
