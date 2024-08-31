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
interface RadioChangeEventTarget extends RadioProps {
  checked: boolean;
}
export interface RadioChangeEvent {
  target: RadioChangeEventTarget;
  stopPropagation: () => void;
  preventDefault: () => void;
  nativeEvent: MouseEvent;
}
export declare type RadioProps = AbstractCheckboxProps<RadioChangeEvent>;

interface CheckboxChangeEventTarget extends CheckboxProps {
  checked: boolean;
}
interface CheckboxChangeEvent {
  target: CheckboxChangeEventTarget;
  stopPropagation: () => void;
  preventDefault: () => void;
  nativeEvent: MouseEvent;
}
interface CheckboxProps extends AbstractCheckboxProps<CheckboxChangeEvent> {
  indeterminate?: boolean;
}
declare type CheckboxValueType = string | number | boolean;
interface CheckboxOptionType {
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

declare type SizeType = 'small' | 'middle' | 'large' | undefined;
declare type RadioGroupButtonStyle = 'outline' | 'solid';
declare type RadioGroupOptionType = 'default' | 'button';
export interface RadioGroupProps extends AbstractCheckboxGroupProps {
  defaultValue?: any;
  value?: any;
  onChange?: (e: RadioChangeEvent) => void;
  size?: SizeType;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
  name?: string;
  children?: React.ReactNode;
  id?: string;
  optionType?: RadioGroupOptionType;
  buttonStyle?: RadioGroupButtonStyle;
}
declare const Group: React.MemoExoticComponent<React.ForwardRefExoticComponent<RadioGroupProps & React.RefAttributes<HTMLDivElement>>>;
export declare type RadioButtonProps = AbstractCheckboxProps<RadioChangeEvent>;
declare const Button: React.ForwardRefExoticComponent<RadioButtonProps & React.RefAttributes<any>>;
