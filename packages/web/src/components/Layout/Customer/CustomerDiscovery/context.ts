import { createContext, Dispatch } from 'react';
import { CustomerAutoTaskRow, CustomerManualTaskRow, CustomerRow, apiHolder, SystemApi } from 'api';
import { getIn18Text } from 'api';
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
const isInWindows = inElectron && /windows/i.test(navigator.userAgent);
export const drawerClassName = `customer-recommend-drawer ${isInWindows ? 'drawer-is-in-windows' : ''}`;
/**
 * 自动任务规则总览（一期暂不做）
 */
interface OverView {}
/**
 * 老客列表类型（不同列表展示和操作略有不同）
 */
export enum CustomerRecommendType {
  Auto = 'autoRecommend',
  Manual = 'manulRecommend',
}
/**
 * 自动/定制任务状态
 */
export enum TaskStatus {
  preparation = 'preparation',
  doing = 'doing',
  done = 'done',
  undo = 'undo',
  suspend = 'suspend',
}
export const TaskStatusList = [
  { label: getIn18Text('SHUJUZHUNBEIZHONG'), value: TaskStatus.preparation },
  { label: getIn18Text('BIAOJIZHONG'), value: TaskStatus.doing },
  { label: getIn18Text('YIWANCHENG'), value: TaskStatus.done },
  { label: getIn18Text('WEICAOZUO'), value: TaskStatus.undo },
  { label: getIn18Text('YIZANTING'), value: TaskStatus.suspend },
];
export const AutoTaskStatusList = [
  { label: getIn18Text('BIAOJIZHONG'), value: TaskStatus.doing },
  { label: getIn18Text('YIWANCHENG'), value: TaskStatus.done },
  { label: getIn18Text('WEICAOZUO'), value: TaskStatus.undo },
];
export const TaskStatusMap = TaskStatusList.reduce(
  (map: Record<string, string>, cur) => ({
    ...map,
    [cur.value]: cur.label,
  }),
  {}
);
/**
 * 同步操作类型
 */
export enum CustomerSyncType {
  OpenSea = 'open_sea',
  Clue = 'clue',
  Company = 'company',
  OtherClue = 'other_clue',
  CompanySea = 'company_sea',
  NotSync = 'not_sync',
}
export enum ValidFlag {
  Nomark = 'no_mark',
  Valid = 'valid',
  Invalid = 'invalid',
  Pending = 'pending',
}
/**
 * 同步操作类型--文案
 */
export const CustomerSyncTypeMap = {
  [CustomerSyncType.OpenSea]: getIn18Text('TONGBUZHIGONGHAI'),
  [CustomerSyncType.Clue]: getIn18Text('YITONGBUZHIXIANSUO'),
  [CustomerSyncType.Company]: getIn18Text('YITONGBUZHIKEHU'),
  [CustomerSyncType.OtherClue]: getIn18Text('YIFENPEIZHIDINGREN'),
  [CustomerSyncType.NotSync]: getIn18Text('WEIFENPEI'),
  [CustomerSyncType.CompanySea]: getIn18Text('YITONGBUKEHUGONGHAI'),
};
/** 任务规则表达式 */
export const TaskRuleExpList = [
  { value: 'lt', label: getIn18Text('XIAOYU') },
  { value: 'le', label: getIn18Text('XIAOYUDENGYU') },
  { value: 'gt', label: getIn18Text('DAYU') },
  { value: 'ge', label: getIn18Text('DAYUDENGYU') },
];
/** 任务规则表达式文案 */
export const TaskRuleExpMap = TaskRuleExpList.reduce(
  (map: Record<string, string>, cur) => ({
    ...map,
    [cur.value]: cur.label,
  }),
  { contain: getIn18Text('BAOHAN') }
);
/**
 * 任务规则字段枚举
 */
export enum TaskRuleField {
  SendCount = 'sendCount',
  RecCount = 'recCount',
  EmailSubject = 'emailSubject',
  AttachName = 'attachName',
}
/**
 * 任务规则字段列表
 */
export const TaskRuleFieldList = [
  { label: getIn18Text('FAJIANSHU'), value: TaskRuleField.SendCount },
  { label: getIn18Text('SHOUJIANSHU'), value: TaskRuleField.RecCount },
  { label: getIn18Text('YOUJIANBIAOTI'), value: TaskRuleField.EmailSubject },
  { label: getIn18Text('FUJIANMINGCHENG'), value: TaskRuleField.AttachName },
];
/**
 * 任务规则字段文案
 */
export const TaskRuleFieldMap = TaskRuleFieldList.reduce(
  (map: Record<string, string>, cur) => ({
    ...map,
    [cur.value]: cur.label,
  }),
  {}
);
/**
 * 授权状态
 */
export enum GrantStatus {
  Reject = 'reject',
  Pass = 'pass',
  Checking = 'checking',
  Unauthorized = 'unauthorized',
}
interface AutoRecommendAction {
  type: ActionType;
  payload:
    | Partial<OverView>
    | Partial<CustomerAutoTaskRow>
    | Array<CustomerAutoTaskRow>
    | Partial<CustomerRow>
    | Array<CustomerRow>
    | Partial<CustomerManualTaskRow>
    | Array<CustomerManualTaskRow>;
}
interface CustomerDiscoveryState {
  overView: OverView; // 总览数据，本期不做
  autoTaskTable: Array<CustomerAutoTaskRow>; // 自动任务列表
  customerTable: Array<CustomerRow>; // 老客列表
  manualTaskTable: Array<CustomerManualTaskRow>; // 手动筛选任务列表
}
interface ContextProps {
  state: CustomerDiscoveryState;
  dispatch: Dispatch<AutoRecommendAction>;
}
export const CustomerDiscoveryContext = createContext<ContextProps>({} as ContextProps);
export enum ActionType {
  UpdateAutoTaskTable = 'UpdateAutoTaskTable',
  UpdateAutoTaskTableRow = 'UpdateAutoTaskTableRow',
  UpdateManualTaskTable = 'UpdateManualTaskTable',
  UpdateManualTaskTableRow = 'UpdateManualTaskTableRow',
  UpdateOverview = 'UpdateOverview',
  UpdateCustomerTable = 'UpdateCustomerTable',
  UpdateCustomerTableRow = 'UpdateCustomerTableRow',
}
export const initialState: CustomerDiscoveryState = {
  overView: {},
  autoTaskTable: [],
  customerTable: [],
  manualTaskTable: [],
};
/**
 * 更新表格数据
 * @param talbe 表格
 * @param newRow rowdata
 * @param rowKey rowKey
 * @returns Array<TableRow>
 */
function updateTableRow<T>(talbe: Array<T> = [], newRow: T, rowKey: keyof T): Array<T> {
  const currentRow = talbe.find(item => item[rowKey] === newRow[rowKey]);
  if (!currentRow) {
    return talbe;
  }
  Object.assign(currentRow, newRow);
  return talbe.slice();
}
export function reducer(state: CustomerDiscoveryState, action: AutoRecommendAction): CustomerDiscoveryState {
  switch (action.type) {
    case ActionType.UpdateAutoTaskTable:
      return { ...state, autoTaskTable: action.payload as CustomerAutoTaskRow[] };
    case ActionType.UpdateManualTaskTable:
      return { ...state, manualTaskTable: action.payload as CustomerManualTaskRow[] };
    case ActionType.UpdateOverview:
      return { ...state, overView: { ...state.overView, ...action.payload } };
    case ActionType.UpdateAutoTaskTableRow:
      const autoTaskTable = updateTableRow<CustomerAutoTaskRow>(state.autoTaskTable, action.payload as CustomerAutoTaskRow, 'taskId');
      return { ...state, autoTaskTable };
    case ActionType.UpdateManualTaskTableRow:
      const manualTaskTable = updateTableRow<CustomerManualTaskRow>(state.manualTaskTable, action.payload as CustomerManualTaskRow, 'taskId');
      return { ...state, manualTaskTable };
    case ActionType.UpdateCustomerTable:
      return { ...state, customerTable: action.payload as CustomerRow[] };
    case ActionType.UpdateCustomerTableRow:
      const customerTable = updateTableRow<CustomerRow>(state.customerTable, action.payload as CustomerRow, 'regularCustomerId');
      return { ...state, customerTable };
    default:
      return state;
  }
}
