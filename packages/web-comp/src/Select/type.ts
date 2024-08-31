export interface BaseOptionProps {
  value: string | number;
  children: React.ReactNode;
  iconName?: string;
  disabled?: boolean;
  className?: string;
  checked?: boolean;
}

export const prefixCls = 'sirius-select-ui';
