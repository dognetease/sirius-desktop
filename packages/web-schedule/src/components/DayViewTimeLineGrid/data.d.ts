import { Moment } from 'moment';
import { FreeBusyModel } from 'api';

export interface DayViewTimeLineGridSizeOptions {
  // 顶部控制栏高度
  DATE_SWTICH_HEIGHT: number;
  // 最小宽高
  MIN_GRID_CONTAINER_HEIGHT: number;
  MIN_GRID_CONTAINER_WIDTH: number;
  // 容器右侧边距
  GRID_CONTAINER_MARGIN_RIGHT: number;
  // 容器底部边距
  GRID_CONTAINER_MARGIN_BOTTOM: number;
  // 表格单元宽度
  GRID_COL_HEADER_WIDTH: number;
  // 表格单元高度
  GRID_CELL_HEIGHT: number;
  // 单元左右边距
  TIME_CELL_MARGIN_RIGHT: number;
  TIME_CELL_MARGIN_LEFT: number;
}
export interface DayViewTimeLineGridProps {
  startDate: Moment | null;
  endDate: Moment | null;
  startTime: Moment | null;
  endTime: Moment | null;
  users?: string[];
  allDay?: 0 | 1 | boolean;
  sizeOptions?: Partial<DayViewTimeLineGridSizeOptions>;
  onClose?(): void;
}

export interface DateSwitchProps extends React.HTMLAttributes<HTMLDivElement> {
  onChange(value: Moment): void;
  date: Moment;
  onClose?(): void;
}

export interface GridHeaderProps extends React.HTMLAttributes<HTMLSpanElement> {
  events: FreeBusyModel.freeBusyItems;
  busy?: boolean;
  text?: string;
  indicatorRange?: Moment[] | null;
}
