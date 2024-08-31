// @ts-nocheck
import { TooltipProps } from './tooltip';
import { CheckboxProps } from './checkbox';
import { PaginationProps } from './pagination';
export interface ColumnGroupType<RecordType> extends Omit<ColumnType<RecordType>, 'dataIndex'> {
  children: ColumnsType<RecordType>;
}
export declare type ColumnsType<RecordType = unknown> = (ColumnGroupType<RecordType> | ColumnType<RecordType>)[];
export declare type SizeType = 'small' | 'middle' | 'large' | undefined;
export declare type SpinIndicator = React.ReactElement<HTMLElement>;
declare type TablePaginationPosition = 'topLeft' | 'topCenter' | 'topRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight';

export interface TablePaginationConfig extends PaginationProps {
  position?: TablePaginationPosition[];
}
declare const SpinSizes: ['small', 'default', 'large'];
export declare type SpinSize = (typeof SpinSizes)[number];
export interface TableLocale {
  filterTitle?: string;
  filterConfirm?: React.ReactNode;
  filterReset?: React.ReactNode;
  filterEmptyText?: React.ReactNode;
  emptyText?: React.ReactNode | (() => React.ReactNode);
  selectAll?: React.ReactNode;
  selectNone?: React.ReactNode;
  selectInvert?: React.ReactNode;
  selectionAll?: React.ReactNode;
  sortTitle?: string;
  expand?: string;
  collapse?: string;
  triggerDesc?: string;
  triggerAsc?: string;
  cancelSort?: string;
}
export interface SpinProps {
  prefixCls?: string;
  className?: string;
  spinning?: boolean;
  style?: React.CSSProperties;
  size?: SpinSize;
  tip?: string;
  delay?: number;
  wrapperClassName?: string;
  indicator?: SpinIndicator;
}
export interface LegacyExpandableProps<RecordType> {
  /** @deprecated Use `expandable.expandedRowKeys` instead */
  expandedRowKeys?: Key[];
  /** @deprecated Use `expandable.defaultExpandedRowKeys` instead */
  defaultExpandedRowKeys?: Key[];
  /** @deprecated Use `expandable.expandedRowRender` instead */
  expandedRowRender?: ExpandedRowRender<RecordType>;
  /** @deprecated Use `expandable.expandRowByClick` instead */
  expandRowByClick?: boolean;
  /** @deprecated Use `expandable.expandIcon` instead */
  expandIcon?: RenderExpandIcon<RecordType>;
  /** @deprecated Use `expandable.onExpand` instead */
  onExpand?: (expanded: boolean, record: RecordType) => void;
  /** @deprecated Use `expandable.onExpandedRowsChange` instead */
  onExpandedRowsChange?: (expandedKeys: Key[]) => void;
  /** @deprecated Use `expandable.defaultExpandAllRows` instead */
  defaultExpandAllRows?: boolean;
  /** @deprecated Use `expandable.indentSize` instead */
  indentSize?: number;
  /** @deprecated Use `expandable.expandIconColumnIndex` instead */
  expandIconColumnIndex?: number;
  /** @deprecated Use `expandable.expandedRowClassName` instead */
  expandedRowClassName?: RowClassName<RecordType>;
  /** @deprecated Use `expandable.childrenColumnName` instead */
  childrenColumnName?: string;
}
export declare type TriggerEventHandler<RecordType> = (record: RecordType, event: React.MouseEvent<HTMLElement>) => void;
export interface RenderExpandIconProps<RecordType> {
  prefixCls: string;
  expanded: boolean;
  record: RecordType;
  expandable: boolean;
  onExpand: TriggerEventHandler<RecordType>;
}
export declare type TableLayout = 'auto' | 'fixed';
export declare type ExpandedRowRender<ValueType> = (record: ValueType, index: number, indent: number, expanded: boolean) => React.ReactNode;
export declare type RenderExpandIcon<RecordType> = (props: RenderExpandIconProps<RecordType>) => React.ReactNode;

export interface ExpandableConfig<RecordType> {
  expandedRowKeys?: readonly Key[];
  defaultExpandedRowKeys?: readonly Key[];
  expandedRowRender?: ExpandedRowRender<RecordType>;
  expandRowByClick?: boolean;
  expandIcon?: RenderExpandIcon<RecordType>;
  onExpand?: (expanded: boolean, record: RecordType) => void;
  onExpandedRowsChange?: (expandedKeys: readonly Key[]) => void;
  defaultExpandAllRows?: boolean;
  indentSize?: number;
  expandIconColumnIndex?: number;
  expandedRowClassName?: RowClassName<RecordType>;
  childrenColumnName?: string;
  rowExpandable?: (record: RecordType) => boolean;
  columnWidth?: number | string;
  fixed?: FixedType;
}
export declare type GetRowKey<RecordType> = (record: RecordType, index?: number) => Key;
export declare type RowClassName<RecordType> = (record: RecordType, index: number, indent: number) => string;
export declare type PanelRender<RecordType> = (data: readonly RecordType[]) => React.ReactNode;
declare type Component<P> = React.ComponentType<P> | React.ForwardRefExoticComponent<P> | React.FC<P> | keyof React.ReactHTML;
export declare type CustomizeComponent = Component<any>;
export declare type CustomizeScrollBody<RecordType> = (
  data: readonly RecordType[],
  info: {
    scrollbarSize: number;
    ref: React.Ref<{
      scrollLeft: number;
    }>;
    onScroll: (info: { currentTarget?: HTMLElement; scrollLeft?: number }) => void;
  }
) => React.ReactNode;
export interface TableComponents<RecordType> {
  table?: CustomizeComponent;
  header?: {
    wrapper?: CustomizeComponent;
    row?: CustomizeComponent;
    cell?: CustomizeComponent;
  };
  body?:
    | CustomizeScrollBody<RecordType>
    | {
        wrapper?: CustomizeComponent;
        row?: CustomizeComponent;
        cell?: CustomizeComponent;
      };
}
export interface TableSticky {
  offsetHeader?: number;
  offsetSummary?: number;
  offsetScroll?: number;
  getContainer?: () => Window | HTMLElement;
}
export interface RcTableProps<RecordType = unknown> extends LegacyExpandableProps<RecordType> {
  prefixCls?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  data?: readonly RecordType[];
  columns?: ColumnsType<RecordType>;
  rowKey?: string | GetRowKey<RecordType>;
  tableLayout?: TableLayout;
  scroll?: {
    x?: number | true | string;
    y?: number | string;
  };
  /** Config expand rows */
  expandable?: ExpandableConfig<RecordType>;
  indentSize?: number;
  rowClassName?: string | RowClassName<RecordType>;
  title?: PanelRender<RecordType>;
  footer?: PanelRender<RecordType>;
  summary?: (data: readonly RecordType[]) => React.ReactNode;
  id?: string;
  showHeader?: boolean;
  components?: TableComponents<RecordType>;
  onRow?: GetComponentProps<RecordType>;
  onHeaderRow?: GetComponentProps<readonly ColumnType<RecordType>[]>;
  emptyText?: React.ReactNode | (() => React.ReactNode);
  direction?: 'ltr' | 'rtl';
  /**
   * @private Internal usage, may remove by refactor. Should always use `columns` instead.
   *
   * !!! DO NOT USE IN PRODUCTION ENVIRONMENT !!!
   */
  internalHooks?: string;
  /**
   * @private Internal usage, may remove by refactor. Should always use `columns` instead.
   *
   * !!! DO NOT USE IN PRODUCTION ENVIRONMENT !!!
   */
  transformColumns?: (columns: ColumnsType<RecordType>) => ColumnsType<RecordType>;
  /**
   * @private Internal usage, may remove by refactor.
   *
   * !!! DO NOT USE IN PRODUCTION ENVIRONMENT !!!
   */
  internalRefs?: {
    body: React.MutableRefObject<HTMLDivElement>;
  };
  sticky?: boolean | TableSticky;
}
export declare type RowSelectionType = 'checkbox' | 'radio';
export declare type SelectionSelectFn<T> = (record: T, selected: boolean, selectedRows: T[], nativeEvent: Event) => void;
export declare const SELECTION_ALL: 'SELECT_ALL';
export declare const SELECTION_INVERT: 'SELECT_INVERT';
export declare const SELECTION_NONE: 'SELECT_NONE';
export declare type SelectionItemSelectFn = (currentRowKeys: Key[]) => void;
export interface SelectionItem {
  key: string;
  text: React.ReactNode;
  onSelect?: SelectionItemSelectFn;
}
export declare type INTERNAL_SELECTION_ITEM = SelectionItem | typeof SELECTION_ALL | typeof SELECTION_INVERT | typeof SELECTION_NONE;
export interface RcRenderedCell<RecordType> {
  props?: CellType<RecordType>;
  children?: React.ReactNode;
}
export interface TableRowSelection<T> {
  /** Keep the selection keys in list even the key not exist in `dataSource` anymore */
  preserveSelectedRowKeys?: boolean;
  type?: RowSelectionType;
  selectedRowKeys?: Key[];
  defaultSelectedRowKeys?: Key[];
  onChange?: (selectedRowKeys: Key[], selectedRows: T[]) => void;
  getCheckboxProps?: (record: T) => Partial<Omit<CheckboxProps, 'checked' | 'defaultChecked'>>;
  onSelect?: SelectionSelectFn<T>;
  onSelectMultiple?: (selected: boolean, selectedRows: T[], changeRows: T[]) => void;
  /** @deprecated This function is meaningless and should use `onChange` instead */
  onSelectAll?: (selected: boolean, selectedRows: T[], changeRows: T[]) => void;
  /** @deprecated This function is meaningless and should use `onChange` instead */
  onSelectInvert?: (selectedRowKeys: Key[]) => void;
  onSelectNone?: () => void;
  selections?: INTERNAL_SELECTION_ITEM[] | boolean;
  hideSelectAll?: boolean;
  fixed?: boolean;
  columnWidth?: string | number;
  columnTitle?: string | React.ReactNode;
  checkStrictly?: boolean;
  renderCell?: (value: boolean, record: T, index: number, originNode: React.ReactNode) => React.ReactNode | RcRenderedCell<T>;
}
export declare type GetPopupContainer = (triggerNode: HTMLElement) => HTMLElement;
export declare type FilterValue = (Key | boolean)[];
export declare type DataIndex = string | number | readonly (string | number)[];
export declare type FixedType = 'left' | 'right' | boolean;
export declare type CellEllipsisType =
  | {
      showTitle?: boolean;
    }
  | boolean;
export declare type AlignType = 'left' | 'center' | 'right';
export interface CellType<RecordType> {
  key?: Key;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  column?: ColumnsType<RecordType>[number];
  colSpan?: number;
  rowSpan?: number;
  /** Only used for table header */
  hasSubColumns?: boolean;
  colStart?: number;
  colEnd?: number;
}
export interface RenderedCell<RecordType> {
  props?: CellType<RecordType>;
  children?: React.ReactNode;
}
interface ColumnSharedType<RecordType> {
  title?: React.ReactNode;
  key?: Key;
  className?: string;
  fixed?: FixedType;
  onHeaderCell?: GetComponentProps<ColumnsType<RecordType>[number]>;
  ellipsis?: CellEllipsisType;
  align?: AlignType;
}
export declare type GetComponentProps<DataType> = (data: DataType, index?: number) => React.HTMLAttributes<HTMLElement>;
export interface RcColumnType<RecordType> extends ColumnSharedType<RecordType> {
  colSpan?: number;
  dataIndex?: DataIndex;
  render?: (value: any, record: RecordType, index: number) => React.ReactNode | RenderedCell<RecordType>;
  shouldCellUpdate?: (record: RecordType, prevRecord: RecordType) => boolean;
  rowSpan?: number;
  width?: number | string;
  onCell?: GetComponentProps<RecordType>;
  /** @deprecated Please use `onCell` instead */
  onCellClick?: (record: RecordType, e: React.MouseEvent<HTMLElement>) => void;
}
export interface ColumnTitleProps<RecordType> {
  /** @deprecated Please use `sorterColumns` instead. */
  sortOrder?: SortOrder;
  /** @deprecated Please use `sorterColumns` instead. */
  sortColumn?: ColumnType<RecordType>;
  sortColumns?: {
    column: ColumnType<RecordType>;
    order: SortOrder;
  }[];
  filters?: Record<string, string[]>;
}
export declare type ColumnTitle<RecordType> = React.ReactNode | ((props: ColumnTitleProps<RecordType>) => React.ReactNode);
export declare type CompareFn<T> = (a: T, b: T, sortOrder?: SortOrder) => number;
export interface ColumnFilterItem {
  text: React.ReactNode;
  value: string | number | boolean;
  children?: ColumnFilterItem[];
}
export interface FilterConfirmProps {
  closeDropdown: boolean;
}
export interface FilterDropdownProps {
  prefixCls: string;
  setSelectedKeys: (selectedKeys: React.Key[]) => void;
  selectedKeys: React.Key[];
  confirm: (param?: FilterConfirmProps) => void;
  clearFilters?: () => void;
  filters?: ColumnFilterItem[];
  visible: boolean;
}
export declare type Breakpoint = 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';
export interface ColumnType<RecordType> extends RcColumnType<RecordType> {
  title?: ColumnTitle<RecordType>;
  sorter?:
    | boolean
    | CompareFn<RecordType>
    | {
        compare?: CompareFn<RecordType>;
        /** Config multiple sorter order priority */
        multiple?: number;
      };
  sortOrder?: SortOrder;
  defaultSortOrder?: SortOrder;
  sortDirections?: SortOrder[];
  showSorterTooltip?: boolean | TooltipProps;
  filtered?: boolean;
  filters?: ColumnFilterItem[];
  filterDropdown?: React.ReactNode | ((props: FilterDropdownProps) => React.ReactNode);
  filterMultiple?: boolean;
  filteredValue?: FilterValue | null;
  defaultFilteredValue?: FilterValue | null;
  filterIcon?: React.ReactNode | ((filtered: boolean) => React.ReactNode);
  onFilter?: (value: string | number | boolean, record: RecordType) => boolean;
  filterDropdownVisible?: boolean;
  onFilterDropdownVisibleChange?: (visible: boolean) => void;
  responsive?: Breakpoint[];
}
export declare type Key = React.Key;
export interface SorterResult<RecordType> {
  column?: ColumnType<RecordType>;
  order?: SortOrder;
  field?: Key | readonly Key[];
  columnKey?: Key;
}
declare const TableActions: ['paginate', 'sort', 'filter'];
export declare type TableAction = (typeof TableActions)[number];
export interface TableCurrentDataSource<RecordType> {
  currentDataSource: RecordType[];
  action: TableAction;
}
export declare type SortOrder = 'descend' | 'ascend' | null;
export interface TableProps<RecordType>
  extends Omit<RcTableProps<RecordType>, 'transformColumns' | 'internalHooks' | 'internalRefs' | 'data' | 'columns' | 'scroll' | 'emptyText'> {
  dropdownPrefixCls?: string;
  dataSource?: RcTableProps<RecordType>['data'];
  columns?: ColumnsType<RecordType>;
  pagination?: false | TablePaginationConfig;
  loading?: boolean | SpinProps;
  size?: SizeType;
  bordered?: boolean;
  locale?: TableLocale;
  onChange?: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<RecordType> | SorterResult<RecordType>[],
    extra: TableCurrentDataSource<RecordType>
  ) => void;
  rowSelection?: TableRowSelection<RecordType>;
  getPopupContainer?: GetPopupContainer;
  scroll?: RcTableProps<RecordType>['scroll'] & {
    scrollToFirstRowOnChange?: boolean;
  };
  sortDirections?: SortOrder[];
  showSorterTooltip?: boolean | TooltipProps;
}
export interface ColumnProps<RecordType> extends ColumnType<RecordType> {
  children?: null;
}
