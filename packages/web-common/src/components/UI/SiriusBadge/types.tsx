declare const PresetStatusColorTypes: ['success', 'processing', 'error', 'default', 'warning'];
declare const PresetColorTypes: ['pink', 'red', 'yellow', 'orange', 'cyan', 'green', 'blue', 'purple', 'geekblue', 'magenta', 'volcano', 'gold', 'lime'];
declare type ElementOf<T> = T extends (infer E)[] ? E : T extends readonly (infer F)[] ? F : never;
declare type LiteralUnion<T extends U, U> = T | (U & {});
declare type PresetColorType = ElementOf<typeof PresetColorTypes>;
declare type PresetStatusColorType = ElementOf<typeof PresetStatusColorTypes>;
export interface BadgeProps {
  /** Number to show in badge */
  count?: React.ReactNode;
  showZero?: boolean;
  /** Max count to show */
  overflowCount?: number;
  /** Whether to show red dot without number */
  dot?: boolean;
  style?: React.CSSProperties;
  prefixCls?: string;
  scrollNumberPrefixCls?: string;
  className?: string;
  status?: PresetStatusColorType;
  color?: LiteralUnion<PresetColorType, string>;
  text?: React.ReactNode;
  size?: 'default' | 'small';
  offset?: [number | string, number | string];
  title?: string;
}
