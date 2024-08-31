/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import {
  CatalogApi,
  EntityCatalog,
  MeetingRoomApi,
  MeetingRoomDetailCondition,
  MeetingRoomListCondition,
  RecurrenceRuleParam,
  ReminderParam,
  ScheduleApi,
  ScheduleInsert,
  ScheduleModel,
  api,
  FreeBusyApi,
  FreeBusyQueryParams,
  FreeBusyModel,
  CatalogAction,
  apiHolder,
  apis,
  MeetingRoomListAvailableCondition,
  MeetingRoomInfoCondition,
  catalogSettingModel,
  catelogUpdateSettingModel,
  ReminderAction,
} from 'api';
import omit from 'lodash/omit';
// import isEqual from 'lodash/isEqual';
// import lPick from 'lodash/pick';
import { EnumRange, InviteType, MeetingRoomDetailListModel, PartStatus, ScheduleSendMailEnum } from './data';
import { getDateTime, getDateTimeByForm } from './util';
import { FormSubmitConditon, ScheduleInsertForm } from './components/CreateBox/ScheduleForm';
import { EnmuRecurrenceRule, SCHEDULE_REMINDER_ACTION, getInsertRecurrenceRule, getInsertReminders } from './components/CreateBox/util';
import { MatchedRoomInfoType } from './components/CreateBox/MeetingRoomForm';
import { getIn18Text } from 'api';
const storeApi = api.getDataStoreApi();
const catalogApi = apiHolder.api.requireLogicalApi(apis.catalogApiImpl) as unknown as ScheduleApi & CatalogApi & MeetingRoomApi & FreeBusyApi;
const filterSelfCatalog = (list: EntityCatalog[]) => list.filter(e => e.isOwner);

/** 获取日历列表 */
export const getCatalogList = async (mine: boolean = false) => {
  const res = await catalogApi.doGetCatalogByItem(undefined, true);
  if (mine) {
    return filterSelfCatalog(res);
  }
  return res;
};
/** 获取日程列表 */
export const getEvents = async (
  option: {
    catalogIds: number[];
    start: Date;
    end: Date;
  },
  cached: boolean = true,
  needCompare?: boolean
) => {
  const { catalogIds, start, end } = option;
  // 日历id过滤一下，没传递或者去空后为空数组，直接返回[]
  if (!catalogIds) {
    return [];
  }
  const ids = catalogIds.filter(i => !!i);
  if (ids && ids.length === 0) {
    return [];
  }
  let res: ScheduleModel[] = [];
  try {
    res = await catalogApi.doGetScheduleByDate(ids, getDateTime(start), getDateTime(end), cached, needCompare);
  } catch (error) {
    throw new Error(getIn18Text('TONGBURICHENGCHU'));
  }
  return res;
};
export const syncPreNextEventsToDB = async (
  option: {
    catalogIds: number[];
    start: Date;
    end: Date;
  },
  _cached: boolean = true,
  _needCompare: boolean = false
): Promise<ScheduleModel[]> => {
  const { catalogIds, start, end } = option;
  const startTime = moment(start);
  const endTime = moment(end);
  startTime.subtract(6, 'week');
  endTime.add(6, 'week');
  let res: ScheduleModel[] = [];
  // 日历id过滤一下，没传递或者去空后为空数组，直接返回[]
  if (!catalogIds) {
    return [];
  }
  const ids = catalogIds.filter(i => !!i);
  if (ids && ids.length === 0) {
    return [];
  }
  // let res: ScheduleModel[] = [];
  try {
    const promises = await Promise.allSettled([
      catalogApi.doGetScheduleByDate(ids, getDateTime(startTime.toDate()), getDateTime(start), true, true, false),
      catalogApi.doGetScheduleByDate(ids, getDateTime(end), getDateTime(endTime.toDate()), true, true, false),
    ]);
    promises.forEach(prmsRes => {
      if (prmsRes.status === 'fulfilled') {
        res = res.concat([...prmsRes.value]);
      }
    });
  } catch (error) {
    throw new Error(getIn18Text('TONGBURICHENGCHU'));
  }
  return res;
};
/** 获取日程详情 */
export const getEventDetail = async (item: ScheduleModel) => {
  const res = await catalogApi.doGetScheduleDetail(item.scheduleInfo.catalogId, item.scheduleInfo.recurrenceId, item.scheduleInfo.scheduleId);
  res[0].scheduleInfo.description = res[0].scheduleInfo.description === '<p></p>' ? '' : res[0].scheduleInfo.description;
  return res;
};

export const getEventDetailByUid = async (uid: string) => {
  const res = await catalogApi.doGetScheduleDetailByUid(uid);
  res[0].scheduleInfo.description = res[0].scheduleInfo.description === '<p></p>' ? '' : res[0].scheduleInfo.description;
  return res;
};
/** 日程操作 */
/** 删除 */
export const deleteEvent = async (item: ScheduleModel, range: number = EnumRange.THIS) =>
  catalogApi.doDeleteSchedule({
    catalogId: item.scheduleInfo.catalogId,
    scheduleId: item.scheduleInfo.scheduleId,
    range,
    recurrenceId: item.scheduleInfo.recurrenceId,
    senderMail: ScheduleSendMailEnum.SEND,
    isOrganizer: item.scheduleInfo.inviteeType === InviteType.ORGANIZER,
  });
/** 新增 */
export const addEvent = async (form: ScheduleInsertForm, condition?: FormSubmitConditon) => {
  const {
    moments: { startDate, endDate, startTime, endTime },
    time: { allDay },
    // enmuReminders,
    reminders,
    enmuRecurrenceRule,
    rruleUntil,
    attachments,
    count,
  } = form;
  // const reminders: Array<ReminderParam> = [];
  // if (enmuReminders) {
  //   enmuReminders.forEach(e => {
  //     const rObj = getInsertReminders(e);
  //     if (rObj) {
  //       reminders.push(rObj);
  //     }
  //   });
  // }
  const zoneId = await catalogApi.getZoneId();
  const attachmentsCp =
    (attachments &&
      attachments.map(f => ({
        accountAttachmentId: f.accountAttachmentId,
        accountAttachmentAccountId: f.accountAttachmentAccountId || f.belonger?.accountId,
      }))) ||
    [];
  const insert: Omit<ScheduleInsert, 'recurIntro' | 'recurrenceId'> = {
    // 默认传过去的字段
    optional: [],
    attachments: attachmentsCp,
    senderMail: condition?.get('senderMail') || ScheduleSendMailEnum.NOT_SEND,
    // 表单里简单字段
    required: form.required,
    catalogId: form.catalogId,
    summary: form.summary,
    location: form.location,
    clazz: form.clazz,
    transp: form.transp,
    description: form.description,
    color: form.color,
    uid: form.uid,
    meetingOrderParam: form.meetingOrderParam,
    reminders,
    time: {
      allDay: allDay ? 1 : 0,
      start: getDateTimeByForm(startDate!, startTime!, !!allDay),
      end: getDateTimeByForm(allDay ? endDate!.clone().add(1, 'days') : endDate!, endTime!, !!allDay),
      // 默认时区 暂时不支持变化
      endZoneId: zoneId,
      startZoneId: zoneId,
    },
    moreInvitee: [],
  };
  if (enmuRecurrenceRule !== undefined && enmuRecurrenceRule !== EnmuRecurrenceRule.NONE) {
    insert.time.recurrenceRule = getInsertRecurrenceRule(form, !!condition?.get('autoPrev')) as RecurrenceRuleParam;
    // 优先使用重复次数
    if (count) {
      insert.time.recurrenceRule.count = count;
    } else if (rruleUntil) {
      insert.time.recurrenceRule.until = getDateTime(rruleUntil.toDate());
    }
  }
  if (reminders?.length > 0) {
    const lastReminder = reminders[reminders.length - 1];
    storeApi.putSync(SCHEDULE_REMINDER_ACTION, String(lastReminder?.reminderAction || ReminderAction.EMAIL_APP));
  }

  return catalogApi.doInsertSchedule(insert as unknown as ScheduleInsert);
};
/** 修改 */
export const editEvent = async (form: ScheduleInsertForm, item: ScheduleModel, condition: FormSubmitConditon = new Map()) => {
  const {
    /** 这3个是特殊定义的字段 需要做转化 */
    enmuReminders,
    enmuRecurrenceRule,
    moments: { startDate, endDate, startTime, endTime },
    /** 时间字段虽然符合表单插入定义 但是也要单独做额外处理 主要是类型的转换 */
    time: { allDay },
    rruleUntil,
    attachments,
    count,
    required,
    moreInvitee,
    reminders,
    ...rest
  } = form;
  const zoneId = await catalogApi.getZoneId();
  const attachmentsCp =
    (attachments &&
      attachments.map(f => ({
        accountAttachmentId: f.accountAttachmentId,
        accountAttachmentAccountId: f.accountAttachmentAccountId || f.belonger?.accountId,
      }))) ||
    [];
  let mergedInvitees: string[];
  if (moreInvitee && moreInvitee.length) {
    mergedInvitees = [...new Set([...required, ...moreInvitee])];
  } else {
    mergedInvitees = [...required];
  }
  const insert: Partial<ScheduleInsert> = {
    ...rest,
    required: mergedInvitees,
    attachments: attachmentsCp,
    optional: [],
    reminders,
    senderMail: condition.get('senderMail') || ScheduleSendMailEnum.NOT_SEND,
    time: {
      allDay: allDay ? 1 : 0,
      start: getDateTimeByForm(startDate!, startTime!, !!allDay),
      end: getDateTimeByForm(allDay ? endDate!.clone().add(1, 'days') : endDate!, endTime!, !!allDay),
      // 默认时区北京，id290，支持获取当前时区
      endZoneId: zoneId,
      startZoneId: zoneId,
    },
  };
  // 提醒规则
  // if (enmuReminders?.length) {
  //   enmuReminders.forEach(e => {
  //     const r = getInsertReminders(e);
  //     if (r) {
  //       insert.reminders!.push(r);
  //     } else {
  //       // 原来的对象怎么传回去
  //       try {
  //         const rObj = JSON.parse(e as unknown as string);
  //         insert.reminders!.push(rObj);
  //       } catch (error) {
  //         throw new Error(getIn18Text('TIXINGGUIZEJIE'));
  //       }
  //     }
  //   });
  // }
  // 循环规则 具体的循环规则对象要从详情接口先获取 如果没有更改就原样传回去
  if (enmuRecurrenceRule !== undefined && enmuRecurrenceRule !== EnmuRecurrenceRule.NONE) {
    const rrule = getInsertRecurrenceRule(form, !!condition?.get('autoPrev')) || {
      ...omit(item.scheduleInfo.recur, 'recurIntro'),
      freq: item.scheduleInfo.recur?.freq || (item.scheduleInfo.recur as any).frequency,
      userFreq: item.scheduleInfo.recur?.userFreq || (item.scheduleInfo.recur as any).userFrequency,
    };
    if (rrule && insert?.time) {
      insert.time.recurrenceRule = rrule as RecurrenceRuleParam;
      // 优先使用重复次数
      if (count) {
        insert.time.recurrenceRule.count = count;
      } else if (rruleUntil) {
        insert.time.recurrenceRule.until = getDateTime(rruleUntil.toDate());
      }
    }
  }
  if (reminders?.length > 0) {
    const lastReminder = reminders[reminders.length - 1];
    storeApi.putSync(SCHEDULE_REMINDER_ACTION, String(lastReminder?.reminderAction || ReminderAction.EMAIL_APP));
  }
  return catalogApi.doUpdateSchedule({
    // 范围字段比较复杂 某些修改联动逻辑在表单内实现
    range: condition.get('range') || EnumRange.THIS,
    catalogId: item.scheduleInfo.catalogId,
    scheduleId: item.scheduleInfo.scheduleId,
    recurrenceId: item.scheduleInfo.recurrenceId,
    isOrganizer: item.scheduleInfo.inviteeType === InviteType.ORGANIZER,
    param: {
      ...(insert as any),
    },
  });
};
/** 日程邀请操作  */
export const reactionEvent = async (t: PartStatus, item: ScheduleModel, range: EnumRange = EnumRange.ALL) => {
  const res = await catalogApi.doOperateSchedule({
    catalogId: item.scheduleInfo.catalogId,
    scheduleId: item.scheduleInfo.scheduleId,
    partStat: t,
    // 非循环日程默认全部  循环日程根据选择来
    range,
    recurrenceId: item.scheduleInfo.recurrenceId,
  });
  // 更新本地日程提醒列表
  setTimeout(() => {
    catalogApi.initScheduleNotice();
  }, 2000);
  return res;
};
/**
 * 退订日历
 * @param catalog 日历
 */
export const unsubscribeCatalog = async (catalog: EntityCatalog) => {
  const success = await catalogApi.doUnsubscribeCatalog({
    accountId: catalog.belonger.accountId as number,
    catalogId: catalog.id as unknown as number,
  });
  return success;
};

export const getZoneId = async () => {
  const zoneId = await catalogApi.getZoneId();
  return zoneId;
};
/**
 * 删除日历（我的）
 * @param catalog
 * @returns
 */
export const delelteMyCatalog = async (catalog: EntityCatalog) => {
  const rs = await catalogApi.doDeleteMyCatalog({
    catalogId: catalog.id as unknown as number,
  });
  return rs;
};
/**
 * 退订日历 从我的日历列表里发起
 * @param catalog 日历
 */
export const unsubscribeCatalogFromSelfList = async (catalog: EntityCatalog) => {
  const success = await catalogApi.doDeleteCatalog({
    catalogId: catalog.id as unknown as number,
  });
  return success;
};

/**
 * 删除第三方账号日历
 * @param catalog[] 日历数组
 */
export const deleteThirdAccountCatalog = async (catalogArr: EntityCatalog[]) => {
  const catalogIds = catalogArr.map(c => Number(c.id));
  const syncAccountId = Number(catalogArr[0].syncAccountId);
  const success = await catalogApi.deleteThirdAccountCatalog({ catalogIds, syncAccountId });
  return success;
};

/**
 * 获取日历设置
 * @returns
 */
export const getSetting = async () => {
  const res = await catalogApi.doGetSetting();
  return res;
};

export const getZoneList = async () => {
  const res = await catalogApi.getZoneList();
  return res;
};
export const updateSetting = async (params: catelogUpdateSettingModel) => {
  const res = await catalogApi.doUpdateSettings(params);
  return res;
};
/**
 * 订阅日历
 * @param catalog 日历
 */
export const subscribeCatalog = async (catalog: EntityCatalog) => {
  const success = await catalogApi.doSubscribeCatalog({
    accountId: catalog.belonger.accountId as unknown as number,
    catalogId: catalog.id as unknown as number,
  });
  return success;
};
/**
 * 通过联系人查询日历
 */
export const queryContactCatalog = async (email: string) => {
  const res = await catalogApi.doGetSubscribeCatalogByContact({
    owner: email,
  });
  return res;
};
export const getMeetingRoomOccupied = async (params: MeetingRoomDetailCondition) => {
  const occupied = await catalogApi.doGetMeetingRoomDetail(params);
  return occupied;
};
export const getMeetingRoomList = async (params: MeetingRoomListCondition, orderId?: number) => {
  const roomList = await catalogApi.doGetMeetingRoomList(params);
  const fetchDetailPromises = roomList.map(room => {
    if (room.roomBookInfoVO.time_axis.some(stauts => stauts === 1)) {
      return new Promise<MeetingRoomDetailListModel>(resovle => {
        getMeetingRoomOccupied({
          room_id: room.room_id,
          date: params.date,
        })
          .then(detail_list => {
            const occupy_list = detail_list.occupy_list.map((e, index) => {
              // 过滤本日程的会议订单
              if (e.order_id && e.order_id === orderId) {
                // eslint-disable-next-line no-param-reassign
                room.roomBookInfoVO.time_axis[index] = 0;
                return {
                  ...e,
                  status: 0,
                };
              }
              return e;
            });
            resovle({
              ...room,
              occupy_list,
            });
          })
          .catch(() => {
            resovle({
              ...room,
            });
          });
      });
    }
    return {
      ...room,
    };
  });
  const res = await Promise.all(fetchDetailPromises);
  return res;
};
// 获取可用会议室
export const getMeetingRoomAvailabelList = async (params: MeetingRoomListAvailableCondition) => {
  const res = await catalogApi.doGetAvailableRoom(params);
  // todo seq_no自己计算还是后端返回？ 自己计算的话此时interval不确定 无法计算
  const formatRes: MatchedRoomInfoType[] = res.map(e => ({
    roomInfo: e,
  }));
  return formatRes;
};

// 获取单个会议室信息
export const getOneMeetingRoomInfo = async (params: MeetingRoomInfoCondition) => {
  const param = { ...params, orderId: params.order_id };
  const res = await catalogApi.doGetOneRoomInfo(param);
  return res;
};

export const checkMeettingRoomExsit = async () => {
  const exsit = await catalogApi.doGetHasMeetingRoom();
  return exsit;
};
export const getMeetingRoomSearchCondition = async () => {
  const conditions = await catalogApi.doGetMeetingRoomCondition();
  return conditions;
};
export const getCatalogUnChecked = () => {
  const data = storeApi.getSync('CATALOG_UNCHEDCKED_ID');
  if (data.data === undefined) {
    return [];
  }
  try {
    const res = JSON.parse(data.data);
    if (Array.isArray(res)) {
      return res as string[];
    }
    return [];
  } catch (error) {
    return [];
  }
};
export const saveCatalogUnChecked = async (ids: string[]) => {
  const data = await storeApi.put('CATALOG_UNCHEDCKED_ID', JSON.stringify(ids));
  return data;
};
export const actionCatalog = (key: CatalogAction, afterClose: () => void) => {
  catalogApi.doActionCatalog(key, afterClose);
};
export const actionSetting = (afterClose: () => void, calendarId: string) => {
  catalogApi.doActionCatalog('config', afterClose, calendarId);
};
const filterCurrent = (list: FreeBusyModel[], uid?: string) => {
  if (!uid) {
    return list;
  }
  return list.map(fb => {
    if (uid) {
      return {
        ...fb,
        freeBusyItems: fb.freeBusyItems.filter(it => it.uid !== uid),
      };
    }
    return fb;
  });
};
export const queryFreeBusyList = async (
  params: Omit<FreeBusyQueryParams, 'start' | 'end'> & {
    start: Date;
    end: Date;
    uid?: string;
  }
) => {
  if (params?.users?.length === 0) {
    return [];
  }
  if (params?.start === null || params?.start === undefined) {
    params.start = new Date();
  }
  if (params?.end === null || params?.end === undefined) {
    params.end = new Date();
  }
  const list = await catalogApi
    .doGetFreeBusyList({
      start: getDateTime(params.start),
      end: getDateTime(params.end),
      users: Array.from(params.users),
    })
    .then();
  return filterCurrent(list, params.uid);
};
export const getInitEvents = () => catalogApi.initData.schedule;
