import { Api, Entity, intBool } from '../_base/api';
import { ApiResponse } from '../data/http';
import { diffRes } from '@/api/logical/contactAndOrg';
import { FileType } from '../system/fileLoader';

export type catalogTables = 'catalog' | 'schedule' | 'scheduleContact' | 'scheduleReminder';
export type CatalogSyncRes = {
  [props in catalogTables]?: {
    hasDiff?: boolean;
    diff?: Required<diffRes>;
  };
};

// test
export interface DateTime {
  y: number;
  m: number;
  d: number;
  hr: number;
  min: number;
  sec: number;
}

export interface DBScheduleReminder {
  // scheduleId_日程开始时间_提醒时间 拼接
  id: string;
  scheduleId: number;
  // 日程开始时间
  start: number;
  updateTime: number;
}

export interface ContactSimpleInfo {
  accountId?: number;
  extDesc: string;
  extNickname?: string;
}

export interface MeetingInfo {}

export interface AccountAttachmentParam {
  // 用户附件id
  accountAttachmentId: number;
  // 用户附件账号id
  accountAttachmentAccountId?: number;
  // 附件名称，大小，类型
  name?: string;
  size?: string;
  type?: string;
  attachmentId?: number;
  status?: string; // 状态，包括：uploading， done等，具体参考antd的上传状态
  belonger?: belongerType;
}

export interface ReminderInfo {
  scheduleId: number;
  title: string;
  reminder: string;
  // 提醒时间
  deadline: number;
  // 日程开始时间
  scheduleStartDate: number;
  scheduleEndDate: number;
  isAllDay: boolean;
  location: string;
  creator: string;
}

export interface DownloadReminderInfo {
  realFileName?: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  fileType?: FileType;
}

export interface ReminderListMap {
  [key: number]: ReminderInfo[];
}
export interface ReminderParam {
  // 提醒方式 语音：0，展示：1，邮件：2
  action: number;
  // 提醒方式（新） 1邮件及应用内弹窗, 2邮件提醒，3应用内弹窗，
  reminderAction?: number;
  // 间隔时间
  interval: number;
  // 间隔时间单位(分钟：1，小时：2，天：3，周：4)
  timeUnit: number;
  time?: ReminderTime;
  beforeOpt?: string;
}
export interface ReminderTime {
  hr: number;
  min: number;
  sec: number;
}
export enum ReminderAction {
  EMAIL_APP = 1,
  EMAIL = 2,
  APP = 3,
}
export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type day = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface RecurrenceRuleParam {
  frequency?: Frequency;
  freq: Frequency; // 按什么重复 （天，周，月，年）
  userFreq: Frequency; // 按什么重复 （天，周，月，年）
  interval: number; // 间隔
  until: DateTime; // 截止时间
  count: number; // 重复次数
  byDay: { [key: number]: day[] }; // 重复为每周的周几
  byMonthDay: number[]; // 每月日期列表。有效值为1到31。
  byMonth: number[]; // 一年中的月份列表。 有效值为1到12。
  bySetPos: number[]; // 重复实例集中的第n个事件。有效值为1到366或-366到-1。
  recurIntro?: string; // 重复规则描述
}

export interface catalogSync {
  success: boolean;
  data?: any;
  message?: any;
}

export interface ScheduleTime {
  // 0-非全天日程，1-全天日程',
  allDay: intBool;
  // 开始时间
  start: DateTime;
  // 结束时间
  end: DateTime;
  // 开始时区
  startZoneId: number;
  // 结束时区
  endZoneId: number;
  recurrenceRule?: RecurrenceRuleParam;
}

export interface DeleteCatalogParams {
  catalogId: number;
}

export interface DeleteThirdAccountCatalogParams {
  syncAccountId: number;
  catalogIds: number[];
}

export interface SubscribeCatalogListParams {
  // belonger 的邮箱
  owner: string;
}

export interface SubscribeCatalogParams {
  // 用户的id
  accountId: number;
  catalogId: number;
}

export interface MeetingRoomListCondition {
  // 日期字符串 eg:2021-04-14
  date: string;
  // 地址
  addr?: string;
  // 会议室对于人数的code
  capacity_code?: number;
  // 会议室设备列表对应的code
  instruments?: number[];
  // 第几页
  page?: number;
  // 每页几个
  size?: number;

  zone_id?: number;

  // 可预定会议室标尺单位分钟，支持15分钟和30分钟（默认)
  unit?: number;
}

export interface MeetingRoomListAvailableCondition {
  // 日程提交的时间格式
  time: ScheduleTime;
  // 会议室地址，传入空字符串不限制
  addr: string;
  // 会议室容量，传0不限制
  capacity_code: number;
  // 传入空列表不限制
  instruments: number[];
  page: number;
  page_size: number;
  // 订单ID 有则传
  order_id?: number;
  // 可预定会议室标尺单位分钟，支持15分钟和30分钟（默认)
  unit?: number;
}

// 获取单个会议室信息需要
export interface MeetingRoomInfoCondition {
  // 日程提交的时间格式
  time: ScheduleTime;
  // 订单ID 有则传，下划线是之前传递的格式，服务端需要驼峰，转化一下
  orderId?: number;
  order_id?: number;
  // // 会议室Id，获取单个会议室信息需要
  roomId: number;
  // 可预定会议室标尺单位分钟，支持15分钟和30分钟（默认)
  unit?: number;
}

export interface MeetingRoomDetailCondition {
  // 日期字符串 eg:2021-04-14
  date: string;
  // 会议室对应的id
  room_id: string;

  zone_id?: number;

  // 可预定会议室标尺单位分钟，支持15分钟和30分钟（默认)
  unit?: number;
}

export interface KeyVal {
  code: string;
  name: string;
  title?: string;
}

/**
 * 会议室订阅信息
 */
export interface MeetingRoomOccupy {
  // 邮箱地址用来和通讯录关联
  email: string;
  // 订单id
  order_id: number;
  // 预定时间段对应的code
  seq_no: number;
  // 预定状态
  status: number;
  // 预定时间段（7:00 - 7:30）用来直接展示
  time_name: string;
  // 预定的人的accountId
  user_id: string;
  // 预定人的姓名（用来直接展示）
  user_name: string;
}

export interface ScheduleMeetingRoomParams {
  // 开始的时间段code
  // start_seq_no: number,
  // 结束时间对应的code
  // end_seq_no: number,
  // 日期
  taken_date: string;
  // 更新类型（1：更新 2：取消）
  update_type: 1 | 2;
  // 会议室id
  room_id: string;
  // 预定的订单id
  order_id?: number;
}

/**
 * 日历关联的会议室信息
 */
export interface ScheduleMeetingInfo extends MeetingRoomModel {
  // 开始时间对应的code
  start_time: {
    seq_no: number;
    [props: string]: any;
  };
  // 结束时间对应的code
  end_time: {
    seq_no: number;
    [props: string]: any;
  };
  // 预订状态 0 禁用； 1可用 ；2删除
  status: number;
  // 预定的订单id
  order_id: number;
  // 日期
  date: string;
}

/**
 * 日历表
 */
export interface EntityCatalog extends Entity {
  // 日历id，和id一样
  catalogId: number;

  uid: string;
  // 名称
  name: string;
  // 来源 0.自建默认;1.自建; 2.共享; 3.公开
  status: number;
  // 闲忙状态
  subscribeStatus: number;
  // 序号
  seq: number;
  // 存储类型 1.event; 2.todo ; 3.journal ; 4.alarm
  type: number;
  // 是否公开
  publish: intBool;
  // 公开权限
  privilege: number;
  // 创建时间
  createTime: number;
  // 更新时间
  updateTime: number;
  // 颜色
  color: string;
  // 日历描述
  description: string;
  // 是否是我的日历
  isOwner: intBool;

  // 创建者信息
  belonger: ContactSimpleInfo;
  // 订阅者信息
  shares?: ContactSimpleInfo[];
  // 日历所属的第三方账号id，只有第三方账号才有
  syncAccountId?: number;
  // 日历所属第三方账号信息
  thirdAccount?: CatalogthirdAccountEntity;
}

// 第三方账号日历，账号信息
export interface CatalogthirdAccountEntity {
  appEmail: string;
  appType: number; // number: 1.钉钉 2.企业微信 3.飞书 100.其他应用类型,新增加了泡泡类型
  syncAccountId: number; // number
  userName: string; // string
}
/**
 * 基础日程字段
 */
export interface Schedule {
  // 所属日历
  catalogId: number;
  // 主题
  summary: string;
  // 地点或会议室
  location: string;
  // 访问类型 默认0，公开1，私人2，机密3
  clazz: number;
  // 是否忙闲 忙闲0 空闲1
  transp: intBool;
  // 描述
  description: string;
  // 颜色
  color: string;
  // 附件
  attachments: AccountAttachmentParam[];

  /*
   * 重复参数
   * */

  // 重复规则描述
  recurIntro: string;
  // 重复开始时间
  recurrenceId: number;
  // 重复提醒时间列表
  reminders: ReminderParam[];
}

/**
 * 新增日程字段
 */
export interface ScheduleInsert extends Schedule {
  // 是否发送邮件 1：是 2：否
  senderMail: number;
  time: ScheduleTime;
  // 通知人列表 必须
  required: string[];
  // 邀请人列表 可选
  optional: string[];
  // 更多邀请人 编辑时受邀人可添加更多通知人 可选
  moreInvitee: string[];
  // 预订会议室参数
  meetingOrderParam?: ScheduleMeetingRoomParams;
  uid?: string;
}

/**
 * 编辑日程字段
 */
export interface ScheduleUpdate {
  param: ScheduleInsert;
  catalogId: number;
  scheduleId: number;
  // 重复需要的字段 (当前1，从此之后2，全部3)
  range?: number;
  // 重复需要的字段
  recurrenceId?: number;
  isOrganizer?: boolean;
  // 预订会议室参数（当日程修改的时候没有修改会议室内容的时候不传此参数）
  meetingOrderParam?: ScheduleMeetingRoomParams;
}

/**
 * 删除日程字段
 */
export interface ScheduleDelete {
  catalogId: number;
  scheduleId: number;
  // 重复需要的字段 (当前1，从此之后2，全部3)
  range?: number;
  // 重复需要的字段
  recurrenceId?: number;
  // 是否需要发邮件提醒
  senderMail: intBool;
  isOrganizer?: boolean;
}

/**
 * 日程操作
 */
export interface ScheduleOperate {
  catalogId: number;
  scheduleId: number;
  partStat: number;
  // 重复需要的字段 (当前1，从此之后2，全部3)
  range?: number;
  // 重复需要的字段
  recurrenceId?: number;
}

/**
 * 日程表
 */
export interface EntitySchedule extends Entity, Schedule {
  // 日程id
  scheduleId: number;
  // 0-非全天日程，1-全天日程',
  allDay: intBool;
  // 开始时间
  start: number;
  // 结束时间
  end: number;
  // 重复规则
  recur?: RecurrenceRuleParam;
  // 日程操作
  partStat: number;
  // 日程创建者
  creator: ContactSimpleInfo;
  // 日程日历拥有者
  belonger: ContactSimpleInfo;
  // 日程组织者
  organizer: ContactSimpleInfo;
  // 创建时间
  createTime: number;
  // 更新时间
  updateTime: number;
  // 当前用户在日程中属于的状态(组织者:1，被邀请者:2)
  inviteeType: number;
  // 优先级 （0未定义，0～9,1最高）
  priority: number;
  // 日程状态1～10
  status: number;
  // 日程版本号
  sequence: number;
  // 公开权限(鸡肋没用)
  privilege: number;
  // 未知
  instanceId: number;
  // 未知
  catalogStatus: number;
  // 预订的会议室有关的参数
  meetingInfo?: ScheduleMeetingInfo;
  // 日历服务器端ID
  uid: string;
}

/**
 * 日程与联系人关联表
 */
export interface EntityScheduleAndContact extends Entity {
  // 联系人id
  contactId: string;
  // 联系人email
  email: string;
  // 日程id
  scheduleId: string;
  // 日程操作 （需要操作1，接受2，拒绝3，暂定4，已委派5）
  partStat: number;
  // 是否是拥有者
  isOwner: intBool;
  // 是否在原始数据的invitees名单中
  originInvtees?: boolean;
  // 是否是组织者
  isOrganizer: intBool;
  // 是否是创建者
  isCreator: intBool;
  // 是否是被邀请者
  isInviter: intBool;
  // 联系人简要信息
  simpleInfo: ContactSimpleInfo;
}

/**
 * 会议室基础信息
 */
export interface MeetingRoomModel {
  // 会议室名称
  name: string;
  // 会议室id
  room_id: string;
  // 会议室所在地址
  addr_name: string;
  // 会议室容纳人数
  capacity: KeyVal;
  // 会议室设备列表
  instruments: KeyVal[];
}

/**
 * 单个会议室是否可用信息
 */
export interface MeetingRoomInfo {
  // 是否可用，1: 会议室可用; 2: 该会议室不可用, 但是有其他会议室可用; 3: 没有可用会议室，
  statusCode: number;
  // 截止时间：日期字符串，年月日，类似：'2022-09-09'
  untilDate: string;
}

/**
 * 会议室列表信息
 */
export interface MeetingRoomListModel extends MeetingRoomModel {
  // 会议室时间预定信息
  roomBookInfoVO: {
    end: number; // 结束时间
    interval: number; // 间隔的时间值
    start: number; // 开始时间
    time_axis: Array<0 | 1 | 2>; // 所有时间段对应的预定状态 (0:可用，1:预订，2:过期)
  };
}

/**
 * 会议室详细信息
 */
export interface MeetingRoomDetailModel extends MeetingRoomModel {
  // 会议室订阅时间段
  occupy_list: MeetingRoomOccupy[];
}

/**
 * 会议室筛选条件列表ui层数据
 */
export interface MeetingRoomConditionModel {
  // 地址列表
  addr_list: string[];
  // 人数列表
  capacity_list: KeyVal[];
  // 设备列表
  instruments: KeyVal[];
}

/**
 * 日程ui层数据
 */
export interface ScheduleModel {
  // 日程信息
  scheduleInfo: EntitySchedule;
  // 日程所在日历的信息
  catalogInfo: EntityCatalog;
  // 日程关联的联系人信息
  contactInfo: EntityScheduleAndContact[];
}

export enum TimeUnit {
  MIN = 1,
  HOUR = 2,
  DAY = 3,
  WEEK = 4,
  SECONDS = 5,
}

/**
 * 获取某一时间段指定联系人列表忙闲状态
 */
export interface FreeBusyQueryParams {
  users: Array<string>;
  start: DateTime;
  end: DateTime;
}

// 忙闲列表详情
export type FreeBusyItem = Pick<EntitySchedule, 'allDay' | 'start' | 'end' | 'summary' | 'scheduleId' | 'instanceId' | 'recurrenceId' | 'color'> & {
  uid?: string;
  borderColor?: string;
  textColor?: string;
};

/**
 * 忙闲状态
 */
export interface FreeBusyModel {
  // 账号信息
  account: ContactSimpleInfo;
  // 忙闲列表
  freeBusyItems: Array<FreeBusyItem>;
}
export interface catalogSettingModel {
  // 每周第一天是星期几 0 - 6， 0是星期日
  wkst: number;
  commonSetting: {
    showSecondaryZone: number;
    secondaryZoneIds?: number[];
    showChineseCalendar: number;
    // 展示周数
    showWeekNumber: number;
  };
  // 周月日视图配置
  view: number;

  zoneId: number;
  // 桌面提醒通知
  reminderNotice: number;
}
export interface catelogUpdateSettingModel {
  wkst?: number;
  commonSetting?: {
    showChineseCalendar?: number;
    showWeekNumber?: number;
    showSecondaryZone?: number;
    secondaryZoneIds?: number[];
  };
  reminderNotice?: number;
}
export interface CatalogApi extends Api {
  /**
   * 获取日历列表
   */
  doGetCatalogByItem(idList?: number[], cached?: boolean): Promise<EntityCatalog[]>;

  doGetSubscribeCatalogByContact(params: SubscribeCatalogListParams): Promise<EntityCatalog[]>;

  doSubscribeCatalog(params: SubscribeCatalogParams): Promise<boolean>;

  doUnsubscribeCatalog(params: SubscribeCatalogParams): Promise<boolean>;

  doDeleteCatalog(params: DeleteCatalogParams): Promise<boolean>;

  // 删除第三方账号日历
  deleteThirdAccountCatalog(params: DeleteThirdAccountCatalogParams): Promise<boolean>;

  doDeleteMyCatalog(params: DeleteCatalogParams): Promise<[boolean, string | undefined]>;

  doActionCatalog(key: CatalogAction, onAfterClose: () => void, calendarId?: string): void;

  doGetSetting(): Promise<catalogSettingModel>;

  doUpdateSettings(params: catelogUpdateSettingModel): Promise<boolean>;

  initData: CatalogInitModel;

  initScheduleNotice(params?: CatalogNotifyInfo): void;
}

export interface ScheduleApi extends Api {
  /**
   * 通过日期获取日程
   */
  doGetScheduleByDate(catalogIds: number[], start: DateTime, end: DateTime, cached?: boolean, needCompare?: boolean, diffNotify?: boolean): Promise<ScheduleModel[]>;

  /**
   * 通过日历，日程，重复开始id获取详情
   */
  doGetScheduleDetail(catalogId: number, recurrenceId: number, scheduleId: number): Promise<ScheduleModel[]>;
  /**
   * 通过cid获取详情
   */
  doGetScheduleDetailByUid(uid: string): Promise<ScheduleModel[]>;

  /**
   * 新建日程
   */
  doInsertSchedule(config: ScheduleInsert): Promise<ApiResponse>;

  /**
   * 编辑日程
   */
  doUpdateSchedule(config: ScheduleUpdate): Promise<ApiResponse>;

  /**
   * 获取当前时区id，默认东八区290
   */
  getZoneId(): Promise<number>;

  /**
   * 删除日程
   */
  doDeleteSchedule(config: ScheduleDelete): Promise<ApiResponse>;

  /**
   * 操作日程（接受，拒绝，待定）
   * @param config
   */
  doOperateSchedule(config: ScheduleOperate): Promise<ApiResponse>;

  /**
   * 添加已提醒数据到DB
   * @param reminders ReminderInfo
   */
  doPutScheduleReminderDB(reminders?: ReminderInfo[]): Promise<void>;

  /**
   * 删除日程提醒记录
   * @param scheduleIds 需要删除的日程id数组
   */
  doDeleteScheduleReminderDB(scheduleIds: number[]): Promise<void>;

  getZoneList(noCache?: boolean): Promise<ZoneItem[]>;
}

export interface MeetingRoomApi extends Api {
  /**
   * 获取当前企业是否有会议室
   */
  doGetHasMeetingRoom(): Promise<boolean>;

  /**
   * 获取会议室筛选条件
   */
  doGetMeetingRoomCondition(): Promise<MeetingRoomConditionModel>;

  /**
   * 获取会议室列表
   */
  doGetMeetingRoomList(condition: MeetingRoomListCondition): Promise<MeetingRoomListModel[]>;

  /**
   * 获取会议室被预订详情
   */
  doGetMeetingRoomDetail(condition: MeetingRoomDetailCondition): Promise<MeetingRoomDetailModel>;

  /**
   * 获取可用会议室
   */
  doGetAvailableRoom(condition: MeetingRoomListAvailableCondition): Promise<MeetingRoomModel[]>;

  /**
   * 获取单个会议室截止时间信息
   */
  doGetOneRoomInfo(condition: MeetingRoomInfoCondition): Promise<MeetingRoomInfo>;
}

export interface FreeBusyApi extends Api {
  /**
   * 获取联系人忙闲状态列表
   */
  doGetFreeBusyList(params: FreeBusyQueryParams): Promise<FreeBusyModel[]>;
}

export interface CatalogUnionApi extends CatalogApi, ScheduleApi, MeetingRoomApi, FreeBusyApi {}

export interface CatalogInitModel {
  catalog: EntityCatalog[];
  schedule: ScheduleModel[];
  noticeObjMap: ReminderListMap;
  noticeTimeoutHandler: any[];
  enableNotice: boolean;
}

export interface CatalogNotifyInfo {
  catalogId: number;
  // 操作动作 1:新增， 2:更新, 3:删除
  operationAction: number;
  updateTime: number;
}

export type CatalogAction = 'create' | 'import' | 'subscribe' | 'config';

// 时区信息
export interface ZoneItem {
  content: string;
  id: number;
  key: string;
  offset: string;
  totalSeconds: number;
}

export const LAST_SELECT_TIMEZONE_ID = 'LAST_SELECT_TIMEZONE_ID';

interface belongerType {
  accountId?: number;
  extDesc?: string;
  extNickname?: string;
}
