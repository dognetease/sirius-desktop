import { ConferenceType, ViewMail } from '@web-common/state/state';
import { ScheduleSendMailEnum } from '@web-schedule/data';
import { getDateTimeByForm } from '@web-schedule/util';
import ics, { randomString } from '@web-common/components/util/ics';
import { apiHolder as api, apis, DateTime, MailApi, AccountApi } from 'api';
import { clazzMap, busyStatus, valiteMoment } from '@web-schedule/components/CreateBox/util';
import lOmit from 'lodash/omit';
import lCloneDeep from 'lodash/cloneDeep';
import { addEvent as calanderAddEvent } from '@web-schedule/service';
import { valitedMeetingError } from '@web-schedule/components/CreateBox/ScheduleForm';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const formatCalDate = (param: DateTime) => {
  const { y, m, d, hr, min, sec } = param;
  const val = `${y}/${m}/${d} ${hr}:${min}:${sec}`;
  return new Date(val).getTime();
};
const icsCreateUpload = async (uid: string, currentMail: ViewMail) => {
  const currentMailId = currentMail.cid;
  const conference = currentMail.conference as ConferenceType;
  const summary = currentMail?.entry?.title;
  const {
    location,
    enmuRecurrenceRule,
    moments: { startDate, startTime, endDate, endTime },
    time: { allDay },
  } = conference;
  const locationRes = location || getIn18Text('DEDIANDAIDING');
  const start = getDateTimeByForm(startDate, startTime, !!allDay);
  const end = getDateTimeByForm(allDay ? endDate.clone().add(1, 'days') : endDate, endTime, !!allDay);
  const icsFile = ics({
    start: formatCalDate(start),
    end: formatCalDate(end),
    receiver: currentMail.receiver,
    rruleVal: enmuRecurrenceRule,
    organizer: currentMail?.sender?.contact?.contact,
    location: locationRes,
    uid,
    summary,
  });
  const accounts = await accountApi.getMainAndSubAccounts();
  const mainAccount = accounts[0].mainAccount;
  const flag: any = {};
  const senderEmail = currentMail?.initSenderStr || '';
  if (mainAccount !== senderEmail) {
    flag._account = senderEmail;
  }
  await mailApi.doUploadAttachment({
    cid: currentMailId as string,
    attach: icsFile,
    uploader: {},
    flag,
    _account: flag._account,
  });
};
const validataCalendar = (currentMail: ViewMail) => {
  const { conference } = currentMail;
  const { moments } = conference || {};
  return moments && valiteMoment(moments, getIn18Text('HUIYIJIESHUSHI'));
};
const calendarSubmit = async (params: { currentMail: ViewMail; setVisibleConf: React.Dispatch<React.SetStateAction<boolean>>; isSendCurrentMail?: boolean }) => {
  const { currentMail, setVisibleConf, isSendCurrentMail } = params;
  const valid = validataCalendar(currentMail);
  if (!valid) {
    return true;
  }
  const conference = lOmit(lCloneDeep(currentMail.conference as ConferenceType), 'meetingTipType');
  if (currentMail.conference?.meetingTipType) {
    conference.meetingOrderParam = undefined;
    conference.location = '';
  }
  const condition = new Map();
  condition.set('senderMail', ScheduleSendMailEnum.NOT_SEND);
  condition.set('autoPrev', false);
  const required = currentMail?.receiver?.map(i => i?.contact?.contact?.accountName);
  const value = {
    ...conference,
    enmuReminders: [conference?.enmuReminders],
    reminders: [conference?.reminders],
    summary: currentMail?.entry?.title,
    transp: busyStatus[0].value,
    clazz: clazzMap[0].value,
    required,
  };
  const uid = randomString();
  const cal = await calanderAddEvent(
    {
      ...value,
      uid,
      senderMail: condition.get('senderMail'),
    } as any,
    condition
  );
  const code = Number(cal.data?.code);
  // 添加会议失败
  if (code !== 200) {
    // 非当前邮件直接报错
    if (!isSendCurrentMail) {
      SiriusMessage.error({
        content: cal.data?.err_msg || getIn18Text('RICHENGBAOCUNSHI'),
      });
      return true;
    }
    if (
      // 当前邮件 校验会议 唤起选择会议室弹窗（老逻辑）
      !valitedMeetingError(code, () => {
        setVisibleConf(true);
      })
    ) {
      // 日程保存失败
      SiriusMessage.error({
        content: cal.data?.err_msg || getIn18Text('RICHENGBAOCUNSHI'),
      });
    }
    return true;
  }
  await icsCreateUpload(uid, currentMail);
  return false;
};
export default calendarSubmit;
