declare type SwitchSize = 'small' | 'default';
declare type SwitchChangeEventHandler = (checked: boolean, event: MouseEvent) => void;
declare type SwitchClickEventHandler = SwitchChangeEventHandler;
export interface SwitchProps {
  prefixCls?: string;
  size?: SwitchSize;
  className?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: SwitchChangeEventHandler;
  onClick?: SwitchClickEventHandler;
  checkedChildren?: React.ReactNode;
  unCheckedChildren?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  autoFocus?: boolean;
  style?: React.CSSProperties;
  title?: string;
  tabIndex?: number;
}
