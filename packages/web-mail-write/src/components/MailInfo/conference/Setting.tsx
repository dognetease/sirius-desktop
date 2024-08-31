import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Checkbox, Form, Modal, Select, Input, InputNumber } from 'antd';
import { isMoment, Moment } from 'moment';
import classnames from 'classnames';
// import lGet from 'lodash/get';
import lValues from 'lodash/values';
import lIsEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import { NamePath } from 'antd/lib/form/interface';
import { MeetingRoomForm } from '@web-schedule/components/CreateBox/MeetingRoomForm';
import { genMaxLenValue } from '@web-schedule/components/CreateBox/ScheduleForm';
import {
  loopRules as baseLoopRules,
  reminderOpts,
  EnmuRecurrenceRule,
  EnmuReminders,
  constructAvailableMeetingRoomParam,
  isWeekday,
  reminderTimeUnitOpts,
  reminderActionOpts,
  DEFAULT_REMINDER_ALL_DAY,
  DEFAULT_REMINDER,
  getReminderByDefaultReminderAction,
  ReminderTimeUnit,
} from '@web-schedule/components/CreateBox/util';
import { ScheduleDatePicker, ScheduleTimeStepPicker, ScheduleLocationInput } from '@web-schedule/components/FormComponents';
import styles from '../mailInfo.module.scss';
import IconCard from '@web-common/components/UI/IconCard/index';
import { checkMeettingRoomExsit, getMeetingRoomAvailabelList, getOneMeetingRoomInfo } from '@web-schedule/service';
import eventcontentStyles from '@web-schedule/components/EventContent/eventcontent.module.scss';
import scheduleStyles from '@web-schedule/components/CreateBox/createbox.module.scss';
import meetingRoomFormStyles from '@web-schedule/components/CreateBox/meeting_room_form.module.scss';
import { MailActions, useActions, useAppSelector } from '@web-common/state/createStore';
import UserBusyFreeIndicatorItem from './UserBusyFreeIndicatorItem';
import { ConferenceType } from '@web-common/state/state';
import MeetingRoomUntilTip, { MeetingRoomTipType } from '@web-schedule/components/CreateBox/MeetingRoomUntilTip';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { conferenceWrapClassName } from './Conference';
import { RecurrenceRuleParam, ReminderAction, api } from 'api';
import CustomRepeat, { getRecurIntro } from '@web-schedule/components/CreateBox/customRepeat';
import { getIn18Text } from 'api';
import ScheduleTimezoneSelect from '@web-common/components/ScheduleTimeZoneSelect/scheduleTimeZoneSelect';
import { getDateByForm } from '@web-schedule/util';
const datePickerStyles: React.CSSProperties = { width: 105, padding: '6px 11px' };
const timePickerStyles: React.CSSProperties = { ...datePickerStyles, width: 58 };
const storeApi = api.getDataStoreApi();
interface Props {
  deleteConf: (e) => void;
  setVisible: (val) => void;
  visible: boolean;
}
const ConferenceSetting: React.FC<Props> = ({ deleteConf, setVisible, visible }) => {
  const mailActions = useActions(MailActions);
  const conference = useAppSelector(state => state.mailReducer.currentMail.conference);
  const id = useAppSelector(state => state.mailReducer.currentMail.id);
  const [form] = Form.useForm<ConferenceType>();
  const [meetingRoomExist, setMeetingRoomExist] = useState(false);
  const [meetingTipType, setMeetingTipType] = useState<MeetingRoomTipType>();
  const [untilDateTimeTemp, setUntilDateTimeTemp] = useState<Moment>();
  const [loopRules, setLoopRules] = useState<typeof baseLoopRules>(baseLoopRules);
  const asyncRecordConferenceData = () => {
    setTimeout(() => {
      mailActions.doConferenceChange({
        ...form.getFieldsValue(!0),
        meetingTipType,
      });
    }, 0);
  };
  useEffect(() => {
    asyncRecordConferenceData();
  }, [meetingTipType]);
  /** 开始日期变化，联动结束日期 */
  const handleStartDateChange = (startDate: Moment | null) => {
    if (startDate) {
      const moments = form.getFieldValue(['moments']);
      const endDate = startDate.clone();
      form.setFieldsValue({
        moments: {
          ...moments,
          endDate,
        },
      });
    }
  };
  /** 开始时刻变化，联动结束时刻 */
  const handleStartTimeChange = (startTime: Moment | null) => {
    if (startTime) {
      const moments = form.getFieldValue(['moments']);
      const endTime = startTime.clone().subtract(-1, 'hours');
      if (startTime.hours() >= 23) {
        endTime.hours(23).minutes(45);
      }
      form.setFieldsValue({
        moments: {
          ...moments,
          endTime,
        },
      });
    }
  };
  const getMeetingCondition = () => {
    const meetingOrderParam = form.getFieldValue('meetingOrderParam');
    return meetingRoomExist && meetingOrderParam !== undefined;
  };
  const clearMeetingRoomParams = () => {
    form.setFieldsValue({
      location: '',
      meetingOrderParam: undefined,
      rruleUntil: undefined,
    });
    setMeetingTipType(undefined);
  };
  const handleAllDayChange = (checked: boolean) => {
    const reminders = getReminderByDefaultReminderAction(checked);
    form.setFieldsValue({
      // enmuReminders: reminderOpts(checked)[0].value as EnmuReminders,
      reminders,
    });
  };
  const handleCancelMeetingRoom = () => {
    clearMeetingRoomParams();
  };
  const handleReselectRoom = () => {
    form.setFieldsValue({ rruleUntil: undefined });
    setMeetingTipType(undefined);
    setVisible(true);
  };
  const handleValuesChange = (changedValues: Partial<ConferenceType>) => {
    if (changedValues.enmuRecurrenceRule === EnmuRecurrenceRule.NONE) {
      setMeetingTipType(undefined);
    }
    if (changedValues.time && 'allDay' in changedValues.time) {
      handleAllDayChange(changedValues.time.allDay);
    }
    asyncRecordConferenceData();
    if (
      ['enmuRecurrenceRule', 'meetingOrderParam', 'moments', 'rruleUntil'].filter(key => changedValues[key as keyof ConferenceType]).length === 0 ||
      (changedValues.moments && !lValues(changedValues.moments).every(isMoment))
    ) {
      return;
    }
    if (changedValues.enmuRecurrenceRule === EnmuRecurrenceRule.CUSTOM) {
      return;
    }
    setTimeout(async () => {
      const allValues = form.getFieldsValue(!0);
      const { enmuRecurrenceRule, meetingOrderParam, moments, rruleUntil } = allValues;
      const condition = await constructAvailableMeetingRoomParam(allValues as any);
      const curRoomId = meetingOrderParam?.room_id;
      const willBeRecEvent = enmuRecurrenceRule !== EnmuRecurrenceRule.NONE;
      // 有选中会议室
      if (getMeetingCondition() && condition && curRoomId) {
        if (willBeRecEvent) {
          // setUntilDateTimeTemp(allValues.moments.startDate!.clone().add(1, 'month'));
          // setMeetingTipType('until_error');
          // return;
          const params = { ...condition, roomId: curRoomId as unknown as number };
          const res = await getOneMeetingRoomInfo(params);
          const { statusCode, untilDate } = res;
          // statusCode,1: 会议室可用; 2: 该会议室不可用, 但是有其他会议室可用; 3: 没有可用会议室，12合并处理
          if (statusCode === 1 || statusCode === 2) {
            // 当前会议室可用，则判断是否超过截止时间
            const untilDateMoment = untilDate ? moment(untilDate) : moments.startDate!.clone().add(3, 'month'); // 服务端没返回则，默认三个月
            if (untilDateMoment.isBefore(rruleUntil) || rruleUntil === undefined) {
              setUntilDateTimeTemp(untilDateMoment);
              setMeetingTipType('until_error');
            }
          }
          // else if (statusCode === 2) {
          //   setMeetingTipType('cur_room_invalid');
          // }
          else if (statusCode === 3) {
            setMeetingTipType('all_room_invalid');
          }
        }
        // 时间相关的表单项发生变化
        if (changedValues.moments || changedValues.time?.allDay || changedValues.enmuRecurrenceRule) {
          getMeetingRoomAvailabelList(condition)
            .then(list => {
              // 无可用会议室
              if (list.length === 0) {
                setMeetingTipType('all_room_invalid');
                return;
              }
              // 当前会议室不在可用列表中
              if (!list.some(e => e.roomInfo.room_id + '' === curRoomId + '')) {
                setMeetingTipType('cur_room_invalid');
              }
            })
            .catch(() => {
              setMeetingTipType('all_room_invalid');
            });
        }
      }
    }, 1);
  };
  const handleIntervalChange = useCallback(
    item => {
      const reminders = form.getFieldValue('reminders');
      let val = item;
      let isValid = true;
      if (!reminders) {
        return;
      }
      const timeUnit = reminders.timeUnit;
      const reminderAction = reminders.reminderAction;
      let maxLength = ReminderTimeUnit.DAY === timeUnit ? 7 : ReminderTimeUnit.HOUR === timeUnit ? 24 : 60;
      if (!Number.isInteger(val)) {
        val = Math.floor(val);
        isValid = false;
      }
      if (val === 0) {
        val = 1;
        isValid = false;
      } else if (val > maxLength) {
        val = maxLength;
        isValid = false;
      }
      if (!isValid) {
        reminders.interval = val;
        const newReminders = Object.assign({}, reminders);
        form.setFieldsValue({ reminders: newReminders });
      }
      if (reminderAction !== ReminderAction.EMAIL && ReminderTimeUnit.WEEK === timeUnit && val > 4) {
        reminders.reminderAction = ReminderAction.EMAIL;
        form.setFieldsValue({ reminders });
      }
    },
    [form]
  );
  // 自定义规则组件ref
  const customRepeatRef = useRef(null);
  // 自定义规则修改完毕
  const handleCustomRepeatOk = (obj: Partial<ConferenceType>) => {
    const { rruleUntil, interval, enmuRecurrenceRule, count, byDay, byMonth, byMonthDay, bySetPos, recurIntro } = obj;
    const changedValues: Partial<ConferenceType> = {
      interval,
      enmuRecurrenceRule: `${enmuRecurrenceRule}/${EnmuRecurrenceRule.TEMP_INSERT}`,
    };
    if (count) {
      changedValues.count = count;
    }
    if (rruleUntil) {
      changedValues.rruleUntil = rruleUntil;
    }
    if (byDay) {
      changedValues.byDay = byDay;
    }
    if (byMonth) {
      changedValues.byMonth = byMonth;
    }
    if (byMonthDay) {
      changedValues.byMonthDay = byMonthDay;
    }
    if (bySetPos) {
      changedValues.bySetPos = bySetPos;
    }
    form.setFieldsValue(changedValues);
    const actRules = baseLoopRules.slice();
    actRules.push({
      value: `${enmuRecurrenceRule}/${EnmuRecurrenceRule.TEMP_INSERT}`,
      label: recurIntro,
    });
    setLoopRules(actRules);
    handleValuesChange(changedValues);
  };
  // 自定义规则点击去掉，或者关闭，重置为不重复
  const handleCustomRepeatCancel = () => {
    form.setFieldsValue({ enmuRecurrenceRule: EnmuRecurrenceRule.NONE });
  };
  // 修改重复规则
  const handleRuleChange = async (value: EnmuRecurrenceRule) => {
    setLoopRules(baseLoopRules);
    if (value === EnmuRecurrenceRule.CUSTOM) {
      const allValues = form.getFieldsValue(true);
      const { meetingOrderParam, moments } = allValues;
      const condtion = await constructAvailableMeetingRoomParam(allValues);
      const curRoomId = meetingOrderParam?.room_id;
      // 有选中会议室
      if (getMeetingCondition() && condtion && curRoomId) {
        // 自定义规则的请求入参，使用一下每天重复的入参
        const recurrenceRule = { freq: 'DAILY', userFreq: 'DAILY', interval: 1 } as RecurrenceRuleParam;
        const params = { ...condtion, roomId: curRoomId as unknown as number, time: { ...condtion.time, recurrenceRule } };
        const res = await getOneMeetingRoomInfo(params);
        const { statusCode, untilDate } = res;
        // statusCode,1: 会议室可用; 2: 该会议室不可用, 但是有其他会议室可用; 3: 没有可用会议室， 12可以合并处理
        if (statusCode === 1) {
          const endDate = untilDate ? moment(untilDate) : moments.startDate!.clone().add(3, 'month');
          // 有会议室,则传递自定义规则的截止日期
          customRepeatRef.current?.showCustomRepeat(moments.startDate!.clone(), endDate);
        }
      } else {
        // 没有会议室,则不传递自定义规则的截止日期
        customRepeatRef.current?.showCustomRepeat(moments.startDate!.clone());
      }
    }
    if (value && value !== EnmuRecurrenceRule.NONE && value !== EnmuRecurrenceRule.CUSTOM) {
      form.setFieldsValue({ interval: undefined });
    }
  };

  const handleRruleUntil = async () => {
    const allValues = form.getFieldsValue(!0);
    const { enmuRecurrenceRule, meetingOrderParam, moments, rruleUntil } = allValues;
    const curRoomId = meetingOrderParam?.room_id;
    const willBeRecEvent = enmuRecurrenceRule !== EnmuRecurrenceRule.NONE;
    // 原逻辑去掉，改为服务端判断
    // if (curRoomId
    //   && (rruleUntil === undefined || (moments && rruleUntil.diff(moments.startDate, 'month') > 1))
    //   && willBeRecEvent) {
    //   setUntilDateTimeTemp(allValues.moments.startDate!.clone().add(1, 'month'));
    //   setMeetingTipType('until_error');
    // }
    const condtion = await constructAvailableMeetingRoomParam(allValues);
    if (getMeetingCondition() && curRoomId && willBeRecEvent && condtion) {
      const params = { ...condtion, roomId: curRoomId as unknown as number };
      getOneMeetingRoomInfo(params)
        .then(res => {
          const { statusCode, untilDate } = res;
          // statusCode,1: 会议室可用; 2: 该会议室不可用, 但是有其他会议室可用; 3: 没有可用会议室，12合并处理
          if (statusCode === 1 || statusCode === 2) {
            // 当前会议室可用，则判断是否超过截止时间
            const untilDateMoment = untilDate ? moment(untilDate) : moments.startDate!.clone().add(3, 'month'); // 服务端没返回则，默认三个月
            if (untilDateMoment.isBefore(rruleUntil) || rruleUntil === undefined) {
              setUntilDateTimeTemp(untilDateMoment);
              setMeetingTipType('until_error');
            }
          }
          // else if (statusCode === 2) {
          //   setMeetingTipType('cur_room_invalid');
          // }
          else if (statusCode === 3) {
            setMeetingTipType('all_room_invalid');
          }
        })
        .catch(() => {
          setMeetingTipType('all_room_invalid');
        });
    }
  };
  const afterMeetingRoomClose = () => {
    if (meetingTipType && meetingTipType !== 'until_error') {
      form.setFieldsValue({
        location: '',
        meetingOrderParam: undefined,
      });
    }
  };
  const rruleNormalize = (v: any) => {
    form.setFieldsValue({ rruleUntil: undefined });
    return v;
  };
  const timeNormalize = (name: NamePath) => (v: any, prev: any) => {
    const isStartTime = lIsEqual(name, ['moments', 'startTime']);
    const isEndTime = lIsEqual(name, ['moments', 'endTime']);
    if ((isStartTime || isEndTime) && getMeetingCondition() && isMoment(v) && v.minutes() % 15 !== 0) {
      SiriusMessage.info({ content: getIn18Text('HUIYISHISHIJIAN') });
      return prev;
    }
    if (isStartTime) {
      handleStartTimeChange(v);
    }
    return v;
  };
  const handleBeforeOptChange = useCallback(
    item => {
      const reminders = form.getFieldValue('reminders');
      if (reminders) {
        if (item === 'current') {
          reminders.interval = 0;
        } else if (reminders?.interval === 0) {
          reminders.interval = 1;
        }
      }
    },
    [form]
  );
  const getFormElementId = (type: keyof ConferenceType) => `write-mail-conference-${type}-${id}`;
  useEffect(() => {
    checkMeettingRoomExsit().then(setMeetingRoomExist);
  }, []);
  // useEffect(() => {
  //   if (conference) {
  //     form.setFieldsValue(conference);
  //   }
  // }, [conference]);
  return (
    <div className={meetingRoomFormStyles.body}>
      <Form<ConferenceType> form={form} initialValues={conference} onValuesChange={handleValuesChange}>
        <div className={classnames([styles.infoItem, styles.infoItemWithoutLine])}>
          <span className={styles.infoLabel}>{getIn18Text('SHIJIAN')}</span>
          <span className={styles.colonLabel}>:</span>
          <div className={classnames(styles.conferenceTime)}>
            <Form.Item dependencies={[['time', 'allDay']]} className={classnames(styles.time)}>
              {({ getFieldValue }) => {
                const allDay = getFieldValue(['time', 'allDay']);
                return (
                  <div className={classnames(styles.detailTime)}>
                    {/* 开始日期 */}
                    <Form.Item label="" name={['moments', 'startDate']}>
                      <ScheduleDatePicker
                        popperStrategy={'fixed'}
                        className={classnames(styles.timeInput)}
                        onChange={handleStartDateChange}
                        allowClear={false}
                        style={datePickerStyles}
                      />
                    </Form.Item>
                    {/* 开始时间 */}
                    <Form.Item
                      label=""
                      name={['moments', 'startTime']}
                      className={classnames(styles.marginLeft8Style)}
                      hidden={allDay}
                      normalize={timeNormalize(['moments', 'startTime'])}
                    >
                      <ScheduleTimeStepPicker
                        // onChange={handleStartTimeChange}
                        popperStrategy={'fixed'}
                        style={timePickerStyles}
                        className={classnames(styles.timeInput)}
                      />
                    </Form.Item>
                    <div className={classnames(styles.timeLine)} />
                    {/* 结束日期 */}
                    <Form.Item label="" name={['moments', 'endDate']}>
                      <ScheduleDatePicker popperStrategy={'fixed'} className={classnames(styles.timeInput)} allowClear={false} style={datePickerStyles} />
                    </Form.Item>
                    {/* 结束时间 */}
                    <Form.Item
                      label=""
                      hidden={allDay}
                      name={['moments', 'endTime']}
                      normalize={timeNormalize(['moments', 'endTime'])}
                      className={classnames(styles.marginLeft8Style)}
                    >
                      <ScheduleTimeStepPicker popperStrategy={'fixed'} className={classnames(styles.timeInput)} style={timePickerStyles} />
                    </Form.Item>
                  </div>
                );
              }}
            </Form.Item>

            {/* 全天 */}
            <Form.Item label="" valuePropName="checked" name={['time', 'allDay']} className={classnames(styles.wholeDay)}>
              <Checkbox>
                <span className={scheduleStyles.checkboxContent}>{getIn18Text('QUANTIAN')}</span>
              </Checkbox>
            </Form.Item>
            {/* 重复规则 */}
            <Form.Item
              className={classnames(styles.recurrence)}
              name="enmuRecurrenceRule"
              dependencies={[['moment', 'startDate'], ['rruleUntil']]}
              normalize={rruleNormalize}
            >
              <Select
                id={getFormElementId('enmuRecurrenceRule')}
                dropdownClassName={styles.selectDropDown}
                suffixIcon={<i className={scheduleStyles.expandIcon} />}
                style={{ minWidth: 135, marginRight: 12 }}
                onChange={handleRuleChange}
              >
                {loopRules.map(r => (
                  <Select.Option className={styles.selectOption} key={r.value} value={r.value}>
                    {r.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div className={classnames([styles.btnBox, styles.closeBtn])}>
            <span className={classnames([styles.labelBtn, styles.labelCloseBtn])} onClick={deleteConf}>
              <IconCard className="dark-invert" type="close" />
            </span>
          </div>
        </div>
        <div className={styles.infoItem}>
          <Form.Item dependencies={[['time', 'allDay']]} noStyle>
            {({ getFieldValue }) => {
              const allDay = getFieldValue(['time', 'allDay']);
              const _startDate = getFieldValue(['moments', 'startDate']) || moment();
              const _startTime = getFieldValue(['moments', 'startTime']) || moment();
              const _endDate = getFieldValue(['moments', 'endDate']) || moment();
              const _endTime = getFieldValue(['moments', 'endTime']) || moment();
              const start = getDateByForm(_startDate, _startTime, allDay);
              const end = getDateByForm(_endDate, _endTime, allDay);
              return (
                <div className={styles.timezoneSelect}>
                  <ScheduleTimezoneSelect bordered={false} showTimeDiffLabel={true} localZoneStartTime={start} localZoneEndTime={end} allDay={allDay} />
                </div>
              );
            }}
          </Form.Item>
        </div>
        <UserBusyFreeIndicatorItem />
        <div className={classnames([styles.infoItem, styles.infoItemWithoutLine])}>
          <span className={styles.infoLabel}>{getIn18Text('DEDIAN')}</span>
          <span className={styles.colonLabel}>:</span>
          <div className={classnames(styles.conferenceTime)}>
            {/* 地点 */}
            <Form.Item label="" shouldUpdate>
              {({ getFieldValue }) => {
                const meetingRoomSelected = getFieldValue('meetingOrderParam');
                return (
                  <Form.Item noStyle getValueFromEvent={genMaxLenValue({ max: 60, name: getIn18Text('RICHENGDEDIAN') })} name="location">
                    <ScheduleLocationInput
                      id={getFormElementId('location')}
                      placeholder={getIn18Text('SHURUHUIYIDE')}
                      allowClear
                      style={{ width: '392px' }}
                      meetingRoomEnable={meetingRoomExist}
                      meetingRoomSelected={!!meetingRoomSelected}
                      renderSelectMeetingRoom={() => (
                        // eslint-disable-next-line jsx-a11y/anchor-is-valid
                        <a
                          onClick={e => {
                            e.preventDefault();
                            setVisible(true);
                          }}
                        >
                          {getIn18Text('HUIYISHI')}
                        </a>
                      )}
                      meetingRoomLocationProps={{
                        onUpdate: () => {
                          setVisible(!0);
                        },
                        onCancel: clearMeetingRoomParams,
                      }}
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>
          </div>
        </div>
        <div className={classnames([styles.infoItem])}>
          <span className={styles.infoLabel}>{getIn18Text('TIXING')}</span>
          <span className={styles.colonLabel}>:</span>
          <div className={classnames(styles.conferenceTime)}>
            {/* 日程提醒 */}
            <Form.Item dependencies={[['time', 'allDay']]}>
              {({ getFieldValue }) => (
                <>
                  {getFieldValue(['time', 'allDay']) ? (
                    <Form.Item name={['reminders', 'beforeOpt']} noStyle>
                      <Select
                        dropdownClassName={styles.selectDropDown}
                        onChange={v => handleBeforeOptChange(v)}
                        className={styles.selectLabel}
                        style={{ width: 55, padding: 0, borderColor: 'transparent !important' }}
                        suffixIcon={<i className={`dark-invert ${styles.expandIcon}`} />}
                        bordered={false}
                      >
                        <Select.Option className={styles.selectOption} key={'before'} value={'before'}>
                          {getIn18Text('TIQIAN')}
                        </Select.Option>
                        <Select.Option className={styles.selectOption} key={'current'} value={'current'}>
                          {getIn18Text('DANG1')}
                        </Select.Option>
                      </Select>
                    </Form.Item>
                  ) : (
                    <span style={{ width: 55, marginRight: 12 }}>{getIn18Text('TIQIAN')}</span>
                  )}
                  <Form.Item dependencies={[['reminders', 'beforeOpt']]} noStyle>
                    {() => {
                      const isCurrent = getFieldValue(['reminders', 'beforeOpt']) === 'current';
                      const timeUnit = getFieldValue(['reminders', 'timeUnit']);
                      let maxLength = ReminderTimeUnit.DAY === timeUnit ? 7 : ReminderTimeUnit.HOUR === timeUnit ? 24 : 60;

                      if (!isCurrent) {
                        return (
                          <>
                            <Form.Item name={['reminders', 'interval']} initialValue={1} noStyle>
                              <InputNumber
                                min={1}
                                max={maxLength}
                                required
                                onChange={v => handleIntervalChange(v)}
                                controls={{
                                  upIcon: <i className={`dark-invert ${styles.expandIcon}`} />,
                                  downIcon: <i className={`dark-invert ${styles.expandIcon}`} />,
                                }}
                                style={{ borderRadius: 4, width: 80, marginRight: 12 }}
                              />
                            </Form.Item>
                            <Form.Item name={['reminders', 'timeUnit']} noStyle>
                              <Select
                                // getPopupContainer={formElement}
                                dropdownClassName={styles.selectDropDown}
                                listItemHeight={30}
                                // defaultValue={backfillReminder(editingEvent?.scheduleInfo?.reminders[i], getFieldValue(['time', 'allDay']))}
                                suffixIcon={<i className={`dark-invert ${styles.expandIcon}`} />}
                                style={{ width: 80, marginRight: 12 }}
                                onChange={v => handleIntervalChange(getFieldValue(['reminders', 'interval']))}
                              >
                                {reminderTimeUnitOpts(getFieldValue(['time', 'allDay'])).map(op => (
                                  <Select.Option
                                    // default={backfillReminder(editingEvent?.scheduleInfo?.reminders[i], getFieldValue(['time', 'allDay'])) == op.value}
                                    className={styles.selectOption}
                                    key={op.value}
                                    value={op.value}
                                  >
                                    {op.label}
                                  </Select.Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </>
                        );
                      } else {
                        return null;
                      }
                    }}
                  </Form.Item>

                  {getFieldValue(['time', 'allDay']) ? (
                    <Form.Item initialValue={8} name={['reminders', 'time', 'hr']} noStyle>
                      <Select
                        dropdownClassName={styles.selectDropDown}
                        style={{ width: 80, marginRight: 12, padding: 0 }}
                        suffixIcon={<i className={`dark-invert ${styles.expandIcon}`} />}
                      >
                        {Array.from({ length: 24 }, (_, index) => index.toString().padStart(2, '0')).map((e, i) => (
                          <Select.Option className={styles.selectOption} key={i} value={i}>
                            {`${e}:00`}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  ) : null}

                  <Form.Item dependencies={[['reminders', 'timeUnit']]} noStyle>
                    {() => {
                      const interval = getFieldValue(['reminders', 'interval']);
                      const timeUnit = getFieldValue(['reminders', 'timeUnit']);
                      const disableAppReminder = ReminderTimeUnit.WEEK === timeUnit && interval > 4;
                      return (
                        <Form.Item name={['reminders', 'reminderAction']} initialValue={ReminderAction.EMAIL_APP} noStyle>
                          <Select
                            dropdownClassName={styles.selectDropDown}
                            listItemHeight={30}
                            // disabled={editingEvent?.scheduleInfo.inviteeType === InviteType.INVITEE}
                            // defaultValue={backfillReminder(editingEvent?.scheduleInfo?.reminders[i], getFieldValue(['time', 'allDay']))}
                            style={{ width: 160, marginRight: 12 }}
                          >
                            {reminderActionOpts().map(op => (
                              <Select.Option
                                // default={backfillReminder(editingEvent?.scheduleInfo?.reminders[i], getFieldValue(['time', 'allDay'])) == op.value}
                                className={styles.selectOption}
                                key={op.value}
                                value={op.value}
                                disabled={op.value !== ReminderAction.EMAIL && disableAppReminder}
                              >
                                {op.label}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      );
                    }}
                  </Form.Item>
                </>
              )}
            </Form.Item>
          </div>
        </div>
        <Form.Item noStyle hidden name="count">
          <Input />
        </Form.Item>
        <Form.Item noStyle hidden name="interval">
          <Input />
        </Form.Item>
        <Form.Item noStyle hidden name="byDay">
          <Input />
        </Form.Item>
        <Form.Item noStyle hidden name="byMonthDay">
          <Input />
        </Form.Item>
        <Form.Item noStyle hidden name="byMonth">
          <Input />
        </Form.Item>
        <Form.Item noStyle hidden name="bySetPos">
          <Input />
        </Form.Item>
      </Form>
      <MeetingRoomUntilTip
        getBoundaryElment={() => {
          const boundary = document.getElementsByClassName(conferenceWrapClassName);
          if (boundary.length > 0) {
            return boundary[0];
          }
          return undefined;
        }}
        type={meetingTipType}
        onReselectDateTime={handleCancelMeetingRoom}
        onReselectMeetingRoom={handleReselectRoom}
        untilDateTime={untilDateTimeTemp}
        offset={meetingTipType === 'until_error' ? undefined : [0, 5]}
        getReferenceElement={() => {
          if (meetingTipType === 'until_error') {
            return document.getElementById(getFormElementId('enmuRecurrenceRule'));
          }
          return document.getElementById(getFormElementId('location'));
        }}
        onOk={until => {
          if (until) {
            const [prevRule] = (form.getFieldValue('enmuRecurrenceRule') as string).split('/');
            const changedValues: Partial<ConferenceType> = {
              rruleUntil: until,
              enmuRecurrenceRule: `${prevRule}/${EnmuRecurrenceRule.TEMP_INSERT}`,
            };
            form.setFieldsValue(changedValues);
            const actRules = baseLoopRules.slice();
            const allValues = {
              ...form.getFieldsValue(),
              ...changedValues,
            };
            const { count, ...rest } = cloneDeep(allValues);
            const label = getRecurIntro(rest as any);
            actRules.push({
              value: `${prevRule}/${EnmuRecurrenceRule.TEMP_INSERT}`,
              label,
            });
            setLoopRules(actRules);
            setMeetingTipType(undefined);
            handleValuesChange(changedValues);
          }
        }}
      />
      {/* 选择会议室弹窗 */}
      <Modal
        visible={visible}
        className={classnames(eventcontentStyles.modal)}
        bodyStyle={{ padding: 0 }}
        onCancel={() => setVisible(false)}
        footer={null}
        centered
        width="680px"
        afterClose={afterMeetingRoomClose}
        destroyOnClose
      >
        <MeetingRoomForm
          style={{
            height: 542,
            width: 680,
          }}
          disableBackIcon
          locationChange={asyncRecordConferenceData}
          onBack={ok => {
            setVisible(false);
            if (ok) {
              handleRruleUntil();
            }
          }}
          scheduleFormRef={{
            getFormInstance: () => form as any,
          }}
        />
      </Modal>
      {/* 自定义循环规则 */}
      <CustomRepeat onOk={handleCustomRepeatOk} onCancel={handleCustomRepeatCancel} ref={customRepeatRef} />
    </div>
  );
};
export default ConferenceSetting;
