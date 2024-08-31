export declare type Status = 'error' | 'process' | 'finish' | 'wait';
export declare type ProgressDotRender = (
  iconDot: any,
  info: {
    index: number;
    status: Status;
    title: React.ReactNode;
    description: React.ReactNode;
  }
) => React.ReactNode;
export interface StepsProps {
  type?: 'default' | 'navigation';
  className?: string;
  current?: number;
  direction?: 'horizontal' | 'vertical';
  iconPrefix?: string;
  initial?: number;
  labelPlacement?: 'horizontal' | 'vertical';
  prefixCls?: string;
  progressDot?: boolean | ProgressDotRender;
  responsive?: boolean;
  size?: 'default' | 'small';
  status?: 'wait' | 'process' | 'finish' | 'error';
  style?: React.CSSProperties;
  percent?: number;
  onChange?: (current: number) => void;
}
export interface StepProps {
  className?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLElement>;
  status?: 'wait' | 'process' | 'finish' | 'error';
  disabled?: boolean;
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  style?: React.CSSProperties;
}
