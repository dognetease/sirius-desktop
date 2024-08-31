import { FreeBusyModel } from '@/index';
import { Api, intBool } from '../_base/api';
import { ContactSimpleInfo, ScheduleMeetingInfo, RecurrenceRuleParam, AccountAttachmentParam } from './catalog';

interface RecurInfo extends RecurrenceRuleParam {
  excludes: Array<number>; // 排除的时间列表
  wkst: number; // Week start
}

export interface IcsInvitee {
  // 邀请者状态
  cuType: string;
  // 邀请者邮箱
  email: string;
  // 别名
  nickname: string;
  // 状态
  partStat: string;
  // 角色
  role: string;
}

export interface IcsEvent {
  // 主题
  summary: string;
  // 地点或会议室
  location: string;
  // 访问类型 默认0，公开1，私人2，机密3
  clazz: number;
  // 是否忙闲 忙闲0 空闲1
  transp: intBool;
  // 冲突日程
  conflict: FreeBusyModel['freeBusyItems'];
  // 描述
  description?: string;
  // 日程操作
  partStat?: string;
  // 排序
  sequence: number;
  // 日程状态
  status: string;
  // 日程uid
  uid: string;
  // 0-非全天日程，1-全天日程',
  allDay: intBool;
  // 开始时间
  startTime: number;
  // 开始时区
  startZoneId: string;
  // 结束时间
  endTime: number;
  // 结束时区
  endZoneId: string;
  // 全局zoneId
  totalZoneId: string;
  // 创建时间
  createdTime: number;
  // 更新时间
  lastModified: number;
  recurrenceId?: number;
  // 循环规则描述
  recurInfo?: string;
  recur?: RecurInfo;
  organizer: ContactSimpleInfo;
  invitees: IcsInvitee[];
  meetingInfo?: ScheduleMeetingInfo;
  attachments?: Array<AccountAttachmentParam>;
}

export interface IcsModel {
  // 当前邀请是否取消
  cancel: intBool;
  // 当前邀请是否已经修改
  change: intBool;
  // 当前邀请是否已经过期;
  expired: intBool;
  // 当前系统是否支持
  support: intBool;
  // 日程信息
  event: IcsEvent;

  // fix http://jira.netease.com/browse/SIRIUS-4181?filter=-1
  // 判断 /organizer/info, /organizer/resp, /attendee/info三个接口相应的结果是否包含event字端
  hasEvent?: boolean;

  method?: string;
}

export interface requestIcsInfo {
  // 发送者的email
  attendee: string;
  // 当前用户的sid
  sid: string;
  // 邮件id
  mid: string;
  // attachments Id
  partId: number;
  // corp使用这个字段
  part?: number;
  // 邮箱地址
  domain: string;
  // 当前时间戳
  _: number;
  // 账号
  _account?: string;
}

export interface requestIcsOperate {
  // 日程id
  uid: string;
  // 日程版本
  sequence: number;
  // 日程最后修改时间
  lastModified: number;
  // 组织者邮件地址
  organizer: string;
  // 被邀请者邮件地址
  attendee: string;
  // 参与类型
  partStat: string;
  // 循环ID（可选）
  recurrenceId?: number;
  // 账号
  _account?: string;
}

export interface IcsApi extends Api {
  doGetIcsInfo(config: requestIcsInfo): Promise<IcsModel>;

  doOperateIcs(config: requestIcsOperate): Promise<IcsModel>;
}
