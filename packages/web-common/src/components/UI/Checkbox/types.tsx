interface AbstractCheckboxProps<T> {
  prefixCls?: string;
  className?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  style?: React.CSSProperties;
  disabled?: boolean;
  onChange?: (e: T) => void;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
  onKeyPress?: React.KeyboardEventHandler<HTMLElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
  value?: any;
  tabIndex?: number;
  name?: string;
  children?: React.ReactNode;
  id?: string;
  autoFocus?: boolean;
  type?: string;
  skipGroup?: boolean;
}
interface CheckboxChangeEventTarget extends CheckboxProps {
  checked: boolean;
}
interface CheckboxChangeEvent {
  target: CheckboxChangeEventTarget;
  stopPropagation: () => void;
  preventDefault: () => void;
  nativeEvent: MouseEvent;
}
export interface CheckboxProps extends AbstractCheckboxProps<CheckboxChangeEvent> {
  indeterminate?: boolean;
}
export declare type CheckboxValueType = string | number | boolean;
export interface CheckboxOptionType {
  label: React.ReactNode;
  value: CheckboxValueType;
  style?: React.CSSProperties;
  disabled?: boolean;
  onChange?: (e: CheckboxChangeEvent) => void;
}
interface AbstractCheckboxGroupProps {
  prefixCls?: string;
  className?: string;
  options?: Array<CheckboxOptionType | string>;
  disabled?: boolean;
  style?: React.CSSProperties;
}
export interface CheckboxGroupProps extends AbstractCheckboxGroupProps {
  name?: string;
  defaultValue?: Array<CheckboxValueType>;
  value?: Array<CheckboxValueType>;
  onChange?: (checkedValue: Array<CheckboxValueType>) => void;
  children?: React.ReactNode;
}
