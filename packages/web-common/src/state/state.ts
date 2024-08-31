import {
  ContactModel,
  MailEntryModel,
  MailFileAttachModel,
  ScheduleModel,
  EntityCatalog,
  WriteLetterPropType,
  MailAliasAccountModel,
  ResponseSignature,
  MailStatus,
  day,
  ReminderParam,
  ZoneItem,
} from 'api';
import moment, { Moment } from 'moment';
import { PageName } from '@/components/Layout/model';
import { EnmuRecurrenceRule, EnmuReminders } from '@web-schedule/components/CreateBox/util';
import { ScheduleSyncEvent } from './reducer/scheduleReducer';
import { MeetingRoomTipType } from '@web-schedule/components/CreateBox/MeetingRoomUntilTip';

// 附件状态
// before 等待中
// uploading 上传中
// download 转发/回复 带来
// success 成功
// fail 失败
export type AttachmentViewStatuses = 'uploading' | 'fail' | 'success' | 'downloading' | 'before' | 'download' | 'deleting';

export type MailEditStatus = 'editting' | 'saving' | 'delivering' | 'reGenerating' | 'reUploading';

// ui层的附件 扩展api层
export interface AttachmentView extends MailFileAttachModel {
  mailId: string; // 来源邮件id
  status?: AttachmentViewStatuses; // 当前状态
  process?: number; // 上传下载进度
  abortDownload?: () => void;
  attType?: '0' | '1'; // 1 是代表发信普通附件上传， 0是其他
  flag: { usingCloud: boolean }; // 本地添加时 是否添加为云附件
  forwardWithout?: boolean; // 转发时删除附件
  size: number; // 所属邮件大小(byte)
}

export type Attachment = AttachmentView;

// export interface MailStatus {
//   cc?: boolean;
//   bcc?: boolean;
//   userBusyFreeShow?:boolean; // 是否显示忙闲
//   showContact?: boolean;
//   keyword: string;
//   init: boolean;
//   conferenceSetting: boolean;
//   conferenceShow: boolean;
//   praiseMailShow: boolean;
//   praiseMailSetting: boolean;
//   taskMailShow: boolean;
//   puretext: boolean;
//   taskMailSetting: boolean;
// }

// ui层的mail
export interface ViewMail extends MailEntryModel {
  focusTitle: boolean; // 是否聚焦到title
  status?: MailStatus; // 邮件在编辑过程中的临时值 例如输入框的value
  conference?: ConferenceType;
  writeType?: WriteLetterPropType; // 写信类型
  praiseMail?: PraiseMailType;
  taskMail?: TaskMailType;
  unfinishImgCount?: number;
  resetCont?: boolean;
  noPrompt?: boolean;
  optSender?: null | MailAliasAccountModel; // 当前账号信息 主账号 挂载账号 等 左下角
  defaultSign?: ResponseSignature; // 默认签名
  initSenderStr: string; // 创建邮件时的sender
  optSenderMainEmail: string; // 当前选择的发件人，如果是别名邮箱则取别名邮箱的主账号
  subAccountExpired?: boolean; // 子账号过期
  mailEditStatus?: MailEditStatus; // 邮件编辑状态 （用于状态互斥）
}

export interface AttachmentsPreview {
  visible?: boolean;
  attType?: string;
  downloadContentId?: string | null;
  downloadId?: string | null;
  attachments?: Attachment[];
}
export interface MailState {
  showWebWriteLetter: boolean;
  mails: ViewMail[] | any;
  currentMail: ViewMail | {};
  receivers?: any;
  subject?: string;
  attachments: Attachment[];
  attachmentsPreview: AttachmentsPreview;
  selector: {
    focused: string;
    add: boolean;
    pendingItem?: any; // UIContactModel
  };
}

export interface ModuleUnreadState {
  unreadCount: {
    [key in PageName]?: number;
  };
}

export interface ContactState {
  contact: {
    external?: ContactModel;
    createFlag?: string;
  };
}

export interface EditorTooltipType {
  top: number;
  left: number;
  title: string;
}

export interface EditUIState {
  // mailEditShow: boolean;
}

export interface MailTagState {
  mailTagList: string[];
}
export interface ConferenceType {
  moments: {
    startDate: Moment;
    endDate: Moment;
    startTime?: Moment;
    endTime?: Moment;
  };
  time: {
    allDay: boolean;
  };
  enmuReminders?: EnmuReminders;
  reminders?: ReminderParam;
  enmuRecurrenceRule?: EnmuRecurrenceRule | string;
  location?: string | null;
  meetingOrderParam?: any;
  rruleUntil?: Moment;
  meetingTipType?: MeetingRoomTipType;
  count?: number; // 日程重复规则次数
  interval?: number; // 日程重复规则,间隔
  byDay?: { [key: number]: day[] }; // 重复为每周的周几
  byMonthDay?: number[]; // 每月日期列表。有效值为1到31。
  byMonth?: number[]; // 一年中的月份列表。 有效值为1到12。
  bySetPos?: number[]; // 重复实例集中的第n个事件。有效值为1到366或-366到-1。
}

// 任务邮件
export interface TaskMailType {
  endDate: Moment;
  endTime?: Moment;
  nonEndDate: boolean;
  nonEndTime: boolean;
  enmuReminders?: EnmuReminders;
  expireRemindEveryday: boolean;
}

// 表扬信
export interface PraiseMailType {
  winners: ContactModel[];
  medalId: number;
  presentationWords: string;
  presenter: string;
}

export interface ScheduleState {
  scheduleEventList: ScheduleModel[];
  // 同步日程的标记
  scheduleSync: ScheduleSyncEvent | null | undefined;
  // 当前正在编辑的日程实例
  scheduleEvent: ScheduleModel | null | undefined;
  // 当前日历列表
  catalogList: EntityCatalog[];
  // 当前未选中的日历ID
  unSelectedCatalogIds: string[];
  // 日历简图选中的日期
  miniSelectedDay: Moment;
  // 直接创建日程的开始时间
  creatDirectStartTime?: Moment;
  // 直接创建日程的开始时间
  creatDirectEndTime?: Moment;
  // 日历中包含日程的时间列表 格式为YYYY-MM-DD
  scheduledDate: string[];
  // 每周第一天
  weekFirstDay: number;
  // 日历是否显示周数
  weekNumbersVisible: boolean;
  // 当前月日历展示的第一个时间
  activeStartDate: Date;
  // 当前月日历展示的最后一个时间
  activeEndDate: Date;
  // 日程提醒列表最后更新时间
  scheduleNoticeLastUpdateTime: Date;
  // 其他时区列表
  settingZoneList: number[];
  // 是否展示其他时区
  showSecondaryZone: boolean;
  // 编辑来源入口，区分邮件编辑循环日程保存时只支持更新全部日程，目前只有mail或者空字符串
  scheduleEditFrom: string;
  // 最后选择的日历zone ,settingZoneList中的value
  lastSelectTimezone: ZoneItem | null | undefined;
}

export type SiriusState = ScheduleState &
  ModuleUnreadState &
  MailState &
  ContactState & { editorTooltip: EditorTooltipType } & EditUIState &
  // { curAccount: null | MailAliasAccountModel } &
  MailTagState;

const initState: SiriusState = {
  //  creatDirectEndTime: undefined, creatDirectStartTime: undefined,
  scheduleSync: null,
  scheduleEvent: null,
  catalogList: [],
  unSelectedCatalogIds: [],
  miniSelectedDay: moment(),
  scheduledDate: [],
  showWebWriteLetter: true,
  selector: {
    focused: '',
    add: false,
    pendingItem: null,
  },
  mails: [],
  attachments: [],
  currentMail: {},
  unreadCount: {},
  attachmentsPreview: {
    visible: false,
    attType: undefined,
    downloadContentId: null,
    downloadId: null,
  },
  contact: {},
  editorTooltip: {
    top: -999,
    left: 0,
    title: '',
  },
  // mailEditShow: false,
  mailTagList: [],
  scheduleEventList: [],
  weekFirstDay: 0,
  weekNumbersVisible: false,
  activeStartDate: new Date(),
  activeEndDate: new Date(),
  // 初试时间为一小时以前，方便立即更新
  scheduleNoticeLastUpdateTime: new Date(Date.now() - 60 * 60 * 1000),
  // curAccount: null, // 当前账号信息 主账号 挂载账号 等
  showSecondaryZone: false,
  settingZoneList: [],
  scheduleEditFrom: '',
  lastSelectTimezone: null,
};

export default initState;
