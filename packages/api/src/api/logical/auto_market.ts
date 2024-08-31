import { Api } from '@/api/_base/api';

export enum AutoMarketTaskObjectType {
  CUSTOMER = 'CUSTOMER',
  CLUE = 'CLUE',
  ADDRESS = 'ADDRESS',
  EDM = 'EDM',
  WEBSITE = 'WEBSITE',
  UNI_CLUE = 'UNI_CLUE',
}

export enum AutoMarketTaskObjectTypeName {
  CUSTOMER = '客户列表',
  CLUE = '线索列表',
  ADDRESS = '营销联系人',
  EDM = '邮件营销任务',
  WEBSITE = '询盘客户',
  UNI_CLUE = '潜在客户',
}

export enum AutoMarketTaskTriggerConditionType {
  NO = 'NO',
  DATE = 'DATE',
  EMAIL = 'EMAIL',
}

export enum AutoMarketTaskTriggerConditionTypeName {
  NO = '立即',
  DATE = '日期',
  EMAIL = '邮件行为',
}

export enum AutoMarketTaskExcludeConditionType {
  EDM = 'EDM',
  REPEAT = 'REPEAT',
}

export enum AutoMarketTaskExcludeConditionTypeName {
  EDM = '默认必选',
  REPEAT = '是否重复',
}

export enum AutoMarketTaskActionType {
  SEND_EDM = 'SEND_EDM',
  UPDATE_CUSTOMER = 'UPDATE_CUSTOMER',
  UPDATE_CLUE = 'UPDATE_CLUE',
  UPDATE_ADDRESS_GROUP = 'UPDATE_ADDRESS_GROUP',
}

export enum AutoMarketTaskActionTypeName {
  SEND_EDM = '发送营销邮件',
  UPDATE_CUSTOMER = '更新客户信息',
  UPDATE_CLUE = '更新线索信息',
  UPDATE_ADDRESS_GROUP = '管理分组',
}

export enum AutoMarketTaskType {
  HOLIDAY_GREETING = 'HOLIDAY_GREETING',
  PREVIOUS_CONTACT = 'PREVIOUS_CONTACT',
  POTENTIAL_CONTACT = 'POTENTIAL_CONTACT',
  FIXED_CONTACT = 'FIXED_CONTACT',
}

export enum AutoMarketTaskTypeName {
  HOLIDAY_GREETING = '节日问候',
  PREVIOUS_CONTACT = '老客户订阅营销',
  POTENTIAL_CONTACT = '邮件互动营销',
  FIXED_CONTACT = '固定名单营销 ',
}

export enum AutoMarketOpenStatus {
  OPEN = 'OPEN',
  NEW = 'NEW',
  CLOSED = 'CLOSED',
  DEAD = 'DEAD',
}

export enum AutoMarketOpenStatusName {
  OPEN = '已启动',
  NEW = '未完成',
  CLOSED = '未启动',
  DEAD = '已完成',
}

export enum AutoMarketCustomerTagOpType {
  SOME = 0,
  EVERY = 1,
}

export enum AutoMarketCustomerTagOpTypeName {
  '包含任意' = 0,
  '包含全部' = 1,
}

export enum AutoMarketContactType {
  MAIN = 0,
  ALL = 1,
}

export enum AutoMarketContactTypeName {
  '主联系人' = 0,
  '全部联系人' = 1,
}

export enum AutoMarketEmailOpType {
  OPEN = 0,
  REPLY = 1,
  NOT_OPEN = 2,
  NOT_REPLY = 3,
  NO_CONDICTION = 100,
}

export enum AutoMarketEmailOpTypeName {
  '打开' = 0,
  '回复' = 1,
  '未打开' = 2,
  '未回复' = 3,
  '不需要判断' = 100,
}

export enum AutoMarketObjectEmailType {
  AUTO_MARKET = 0,
  EDM = 1,
}

export enum AutoMarketObjectEmailTypeName {
  '自动营销邮件' = 0,
  '普通营销邮件' = 1,
}

export namespace AutoMarketTaskObjectContent {
  export interface Customer {
    customerTagOpType?: AutoMarketCustomerTagOpType;
    customerTags?: string[];
    continent?: string;
    country?: string;
    contactType?: AutoMarketContactType;
  }

  export interface Clue {
    recentlyRelationEmailDays?: number;
    recentlyRelationEmailType?: number; // 0-无联系，1-有联系
    clueStatus?: number[];
    clueSources?: string[];
    continent?: string;
    country?: string;
  }

  export interface UNI_CLUE {
    followStatus?: number[];
    continent?: string;
    country?: string;
  }

  export interface Address {
    groupIdList?: number[];
    importIdList?: number[];
    addressType?: number;
    contactInfos?: Array<{ contactEmail: string; contactName: string }>;
  }

  export interface Edm {
    edmEmailId: string;
    edmTaskName: string;
    edmSendTime: string;
    edmEmailSendTime: string;
    contactInfos: Array<{
      contactEmail: string;
      contactName: string;
    }>;
  }
}

export namespace AutoMarketTaskActionContent {
  export interface SEND_EDM {
    edmEmailSubjects: string[];
    edmEmailSender: string;
    replyEmail: string;
    emailContent: string;
    emailAttachment: string;
    multipleContentInfo?: any;
    replyEdmEmail?: boolean;
    senderEmail?: string;
  }

  export type UPDATE_CUSTOMER = {
    fieldName: string;
    fieldType: number;
    fieldShowType: number;
    updateValue: string;
  }[];

  export type UPDATE_CLUE = {
    fieldName: string;
    fieldType: number;
    fieldShowType: number;
    updateValue: string;
  }[];

  export type UPDATE_ADDRESS_GROUP = {
    opType: number;
    groupId?: number | string;
    groupName?: string;
    selectValue?: number | string;
    groupIds?: (number | string)[];
  }[];
}
export const CustomerTagOpType = ['包含任意', '包含全部'];
export const PeriodicityType = ['一次性', '每年重复'];
export const ObjectEmailTypeList = ['自动营销邮件', '普通营销邮件'];
export const EmailOpTypeList = ['打开', '回复', '未打开', '未回复'];
export namespace AutoMarketTaskTriggerCondition {
  export interface NO {
    conditionId?: string;
    conditionName: AutoMarketTaskTriggerConditionTypeName;
  }

  export interface DATE {
    conditionId?: string;
    conditionName: AutoMarketTaskTriggerConditionTypeName;
    triggerTime: string;
    triggerTimes: string[];
    periodicityType: number; // 0-一次性，1-每年重复
  }

  export interface EMAIL {
    conditionId?: string;
    conditionName: AutoMarketTaskTriggerConditionTypeName;
    objectEmailType: AutoMarketObjectEmailType;
    emailOpDays: number;
    emailOpType: AutoMarketEmailOpType;
  }
}

export namespace AutoMarketTaskExcludeCondition {
  export interface EDM {
    conditionId?: string;
    conditionName: AutoMarketTaskExcludeConditionTypeName;
    inBlacklist: boolean;
    inUnsubscribeList: boolean;
    invalidList: boolean;
  }

  export interface REPEAT {
    conditionId?: string;
    conditionName: AutoMarketTaskExcludeConditionTypeName;
    repeat: boolean;
  }
}

export interface AutoMarketTaskCondition {
  conditionType: AutoMarketTaskTriggerConditionType | AutoMarketTaskExcludeConditionType;
  conditionContent:
    | AutoMarketTaskTriggerCondition.NO
    | AutoMarketTaskTriggerCondition.DATE
    | AutoMarketTaskTriggerCondition.EMAIL
    | AutoMarketTaskExcludeCondition.EDM
    | AutoMarketTaskExcludeCondition.REPEAT;
}

export interface AutoMarketTaskAction {
  triggerConditionVo: {
    triggerConditionList: AutoMarketTaskCondition[];
  };
  actionName: AutoMarketTaskActionTypeName;
  actionType: AutoMarketTaskActionType;
  actionContent: {
    sendEdmEmailAction?: AutoMarketTaskActionContent.SEND_EDM;
    updateCustomerInfoActionList?: AutoMarketTaskActionContent.UPDATE_CUSTOMER;
    updateClueInfoActionList?: AutoMarketTaskActionContent.UPDATE_CLUE;
    updateContactGroupInfoActionList?: AutoMarketTaskActionContent.UPDATE_ADDRESS_GROUP;
  };
  excludeConditionVo?: {
    excludeConditionList: AutoMarketTaskCondition[];
  };
}

export interface AutoMarketTaskTruckAction {
  truckAction: AutoMarketTaskAction;
  branchAction: AutoMarketTaskAction | null;
}

export interface AutoMarketTaskDetail {
  taskId?: string;
  taskName: string;
  taskDesc: string;
  taskType: AutoMarketTaskType;
  taskStatus: AutoMarketOpenStatus;
  taskNotifyStatus: AutoMarketOpenStatus;
  taskObjectInfo: {
    objectType: AutoMarketTaskObjectType;
    objectName: AutoMarketTaskObjectTypeName;
    objectContent:
      | AutoMarketTaskObjectContent.Customer
      | AutoMarketTaskObjectContent.Clue
      | AutoMarketTaskObjectContent.UNI_CLUE
      | AutoMarketTaskObjectContent.Address
      | AutoMarketTaskObjectContent.Edm;
  };
  execAction: AutoMarketTaskAction;
  additionalActionLayerList: AutoMarketTaskTruckAction[];
  recentlyUpdateTime?: string;
  template?: boolean;
  additionalActionList?: [];
}
export interface AutoMarketTask {
  taskId: string;
  taskName: string;
  taskType: AutoMarketTaskType;
  taskStatus: AutoMarketOpenStatus;
  objectType: AutoMarketTaskObjectType;
  objectName: AutoMarketTaskObjectTypeName;
  triggerCount: number;
  execCount: number;
  recentlyUpdateTime: string;
  loading?: boolean;
  template: boolean;
  edmTemplate?: boolean;
  addressTemplate?: boolean;
}

export interface AutoMarketApi extends Api {
  editTask(req: AutoMarketTaskDetail): Promise<{ taskId: string }>;
  getCustomerUpdateFields(): Promise<ResponseAutoMarketCustomerUpdateFields>;
  getTaskList(req: RequestAutoMarketTaskList): Promise<ResponseAutoMarketTaskList>;
  getTaskDetail(req: { taskId: string }): Promise<AutoMarketTaskDetail>;
  getTaskStats(req: RequestAutoMarketTaskStats): Promise<any>;
  deleteTaskDetail(req: { taskId: string }): Promise<any>;
  updateTaskStatus(req: RequestUpdateAutoMarketTaskStatus): Promise<any>;
  getAutoMarketTaskByGroup(groupId: string): Promise<GroupAutoMarketTaskRes>;
  getAutoMarketHolidayInfo(): Promise<AutoMarketHolidayInfo>;
  getAutoMarketEdmTask(edmEmailId: string | number): Promise<AutoMarketEdmTaskList>;
  getAddressContactForAutomarket(keyIds: string[], addressListType: string): Promise<AddressContactRes>;
  getUniCustomerFollowStatus(): Promise<UniCustomerFollowStatusRes>;
  setTaskTemplateStatus(taskId: string, template: boolean): Promise<void>;
  saveByTemplate(templateTaskId: string, taskObjectInfo: any, objectRealName: string): Promise<{ taskId: string }>;
  getAutomarketTemplateList(req: RequestAutoMarketTaskList): Promise<ResponseAutoMarketTaskList>;
}

export interface AddressContactItem {
  addressId: number;
  contactId: number;
  contactName: string;
  contactAddressInfo: string;
}

export interface AddressContactRes {
  addressList: AddressContactItem[];
}

export interface AutoMarketEdmTaskItem {
  taskId: string;
  taskName: string;
  taskStatus: AutoMarketOpenStatus;
  taskType: AutoMarketTaskType;
  triggerCount: number;
  execCount: number;
  recentlyUpdateTime: string;
}

export interface AutoMarketEdmTaskList {
  autoMarketTasks: AutoMarketEdmTaskItem[];
}

export interface RequestAutoMarketTaskList {
  page: number;
  pageSize: number;
  sort?: string;
  taskName?: string;
  taskStatus?: AutoMarketOpenStatus;
  taskType?: string;
  template?: boolean;
}
export interface RequestAutoMarketTaskStats {
  taskId: string;
  actionId: string;
}
export interface ResponseAutoMarketTaskList {
  autoMarketTasks: AutoMarketTask[];
  totalSize: number;
}

export interface AutoMarketCustomerUpdateField {
  fieldShowName: string;
  fieldName: string;
  fieldShowType: number; // 0-无，1-文本框，2-下拉框
  fieldType: number; // 0-更新客户标签，1-更新客户星级，2-更新客户分级，3-更新联系人
  fieldValues: { label: string; value: string }[]; // 下拉框可选值
}

export interface ResponseAutoMarketCustomerUpdateFields {
  customerUpdateActionItems: AutoMarketCustomerUpdateField[];
}
export interface RequestUpdateAutoMarketTaskStatus {
  taskId: string;
  taskStatus: AutoMarketOpenStatus;
}

export interface GroupAutoMarketTask {
  taskId: string;
  taskName: string;
  taskStatus: AutoMarketOpenStatus;
  taskType: AutoMarketTaskType;
  triggerCount: number;
  execCount: number;
  recentlyUpdateTime: string;
}

export interface GroupAutoMarketTaskRes {
  autoMarketTasks: GroupAutoMarketTask[];
}

export interface AutoMarketHolidayItem {
  countryEnglishName: string;
  countryName: string;
  holidayList: AutoMarketHolidayMap[];
}

export interface AutoMarketHolidayMap {
  date: string;
  holidayName: string;
}

export interface AutoMarketHolidayInfo {
  countryHolidayList: AutoMarketHolidayItem[];
}

export interface UniCustomerFollowStatusRes {
  followStatusList: {
    followStatusName: string;
    followStatus: string;
  }[];
}
