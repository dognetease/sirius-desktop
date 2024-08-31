import { MeetingRoomListModel, MeetingRoomOccupy } from 'api';

/** 邀请状态 */
export enum PartStatus {
  /** 需要操作 */
  EVENT_NEEDS_ACTION = 1,
  /** 接受 */
  EVENT_ACCEPTED = 2,
  /** 拒绝 */
  EVENT_DECLINED = 3,
  /** 待定 */
  EVENT_TENTATIVE = 4,
  /** 委派 */
  EVENT_DELEGATED = 5,
}

/** 邀请类型 */
export enum InviteType {
  ORGANIZER = 1,
  INVITEE = 2,
}

/** 时间单位枚举 */
export enum TimeUnit {
  MIN = 1,
  HOUR = 2,
  DAY = 3,
  WEEK = 4,
}

export type PartActionType = 'NEEDS_ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE' | 'DELEGATED';

/** 日程操作范围 一般是1 或者 3 当前 THIS(1), 此及以后  THIS_AND_FUTURE(2),全部  ALL(3); */
export type ScheduleOpRangeType = 1 | 2 | 3;
export enum EnumRange {
  THIS = 1,
  THIS_AND_FUTURE = 2,
  ALL = 3,
}

export enum ScheduleSendMailEnum {
  SEND = 1,
  NOT_SEND = 2,
}

/**
 * 日历权限
 */
export enum CatalogPrivilege {
  RESERVE,
  // 没有权限
  NONE,
  // 只可见忙闲
  BUSY,
  // 查看权限
  VIEW,
  // 操作权限
  OPREATE,
}

export enum ScheduleClazz {
  // 默认权限，遵循所属日历权限
  DEFAULT,
  // 公开
  PUBLIC,
  // 私人
  PRIVATE,
  // 机密
  CONFIDENTIAL,
}

export interface MeetingRoomDetailListModel extends MeetingRoomListModel {
  occupy_list?: MeetingRoomOccupy[];
}

/**
 * 在触发syncSchedule事件时，需要指定是哪个二级模块
 * 避免不同模块在监听到事件后做重复的动作（例如弹起全局toast）
 */
export enum ScheduleSyncObInitiator {
  MAIN_MODULE = 'MAIN_MODULE',
  MODAL_MODULE = 'MODAL_MODULE',
  IM_MODULE = 'IM_MODULE',
  INDEPENDED_MODULE = 'INDEPENDED_MODULE',
  MAIL_MODULE = 'MAIL_MODULE',
}
