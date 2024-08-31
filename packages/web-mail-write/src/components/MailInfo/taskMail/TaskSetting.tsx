import React, { useEffect, useState } from 'react';
import { Checkbox, Form, Select } from 'antd';
import classnames from 'classnames';
import { reminderOpts, EnmuReminders, getInsertReminders } from '@web-schedule/components/CreateBox/util';
import { ScheduleDatePicker, ScheduleTimeStepPicker } from '@web-schedule/components/FormComponents';
import styles from '../mailInfo.module.scss';
import taskStyle from './taskMail.module.scss';
import IconCard from '@web-common/components/UI/IconCard/index';
import scheduleStyles from '@web-schedule/components/CreateBox/createbox.module.scss';
import meetingRoomFormStyles from '@web-schedule/components/CreateBox/meeting_room_form.module.scss';
import { MailActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { TaskMailType } from '@web-common/state/state';
import { getIn18Text } from 'api';
const datePickerStyles: React.CSSProperties = { width: 105, padding: '6px 11px' };
const timePickerStyles: React.CSSProperties = { ...datePickerStyles, width: 58 };
interface Props {
  deleteTaskMail: (e) => void;
}
const TaskMailSetting: React.FC<Props> = ({ deleteTaskMail }) => {
  const mailActions = useActions(MailActions);
  const taskMail = useAppSelector(state => state.mailReducer.currentMail.taskMail);
  const [form] = Form.useForm<TaskMailType>();
  const [nonEndTime, setNonEndTime] = useState(false);
  const asyncRecordTaskMailData = () => {
    setTimeout(() => {
      mailActions.doTaskMailChange(form.getFieldsValue(!0));
    }, 0);
  };
  const formChange = () => {
    asyncRecordTaskMailData();
  };
  useEffect(() => {
    if (taskMail) {
      form.setFieldsValue(taskMail);
      setNonEndTime(taskMail.nonEndTime);
    }
  }, [taskMail]);
  const changeNonEndTime = (val: boolean) => {
    setNonEndTime(val);
    form.setFieldsValue({
      enmuReminders: reminderOpts(val)[0].value as EnmuReminders,
      nonEndTime: val,
    });
    asyncRecordTaskMailData();
  };
  const allDayReminderOpts = reminderOpts(true).map(op => (
    <Select.Option className={styles.selectOption} key={op.value} value={op.value}>
      {op.label}
    </Select.Option>
  ));
  const nonAllDayReminderOpts = reminderOpts(false).map(op => (
    <Select.Option className={styles.selectOption} key={op.value} value={op.value}>
      {op.label}
    </Select.Option>
  ));
  return (
    <div className={meetingRoomFormStyles.body}>
      <Form<TaskMailType> form={form} onValuesChange={formChange}>
        <div className={classnames([styles.infoItem, styles.infoItemWithoutLine])}>
          <span className={styles.infoLabel}>{getIn18Text('SHIJIAN')}</span>
          <span className={styles.colonLabel}>:</span>
          <div className={classnames(styles.conferenceTime)}>
            <Form.Item className={classnames(styles.time)} dependencies={['nonEndDate']}>
              {({ getFieldValue }) => {
                const nonEndDate = getFieldValue('nonEndDate');
                return (
                  <div className={classnames(styles.detailTime)}>
                    {/* 开始日期 */}
                    <Form.Item label="" name="endDate" hidden={nonEndDate}>
                      <ScheduleDatePicker className={classnames(styles.timeInput)} popperStrategy={'fixed'} allowClear={false} style={datePickerStyles} />
                    </Form.Item>
                    <div hidden={!nonEndDate} className={taskStyle.dateDisabled}>
                      {getIn18Text('WU')}
                    </div>
                    {/* 开始时间 */}
                    <Form.Item label="" name="endTime" className={classnames(styles.marginLeft8Style)} hidden={nonEndTime || nonEndDate}>
                      <ScheduleTimeStepPicker className={classnames(styles.timeInput)} popperStrategy={'fixed'} timeIntervals={15} style={timePickerStyles} />
                    </Form.Item>
                    <div
                      className={classnames(taskStyle.addEndTime, nonEndDate && taskStyle.disabledEndTime)}
                      hidden={!nonEndTime && !nonEndDate}
                      onClick={() => nonEndDate || changeNonEndTime(false)}
                    >
                      <IconCard className="dark-invert" type="add" stroke={nonEndDate ? '#a8aaad' : '#386ee7'} />
                      {getIn18Text('TIANJIAJUTISHI')}
                    </div>
                    <span
                      className={classnames([styles.labelCloseBtn, taskStyle.closeEndTime])}
                      onClick={() => nonEndDate || changeNonEndTime(true)}
                      hidden={nonEndTime || nonEndDate}
                    >
                      <IconCard className="dark-invert" type="close" width="11" />
                    </span>
                  </div>
                );
              }}
            </Form.Item>
            {/* 全天 */}
            <Form.Item label="" valuePropName="checked" name="nonEndDate" className={classnames(styles.wholeDay)}>
              <Checkbox>
                <span className={scheduleStyles.checkboxContent}>{getIn18Text('WUJIEZHISHIJIAN')}</span>
              </Checkbox>
            </Form.Item>
          </div>
          <div className={classnames([styles.btnBox, styles.closeBtn])}>
            <span className={classnames([styles.labelBtn, styles.labelCloseBtn])} onClick={deleteTaskMail}>
              <IconCard className="dark-invert" type="close" />
            </span>
          </div>
        </div>
        <div className={classnames([styles.infoItem])}>
          <span className={styles.infoLabel}>{getIn18Text('TIXING')}</span>
          <span className={styles.colonLabel}>:</span>
          <div className={classnames(styles.conferenceTime)}>
            <Form.Item className={classnames(styles.time)} dependencies={['nonEndDate']}>
              {({ getFieldValue }) => {
                const nonEndDate = getFieldValue('nonEndDate');
                return nonEndDate ? (
                  <div className={classnames(taskStyle.reminder)}>
                    <Select
                      suffixIcon={<i className={scheduleStyles.expandIcon} />}
                      listItemHeight={30}
                      style={{ width: 105 }}
                      disabled
                      value={getIn18Text('BUTIXING')}
                    />
                    <Checkbox value={false} disabled className={classnames(styles.wholeDay)}>
                      <span className={classnames(scheduleStyles.checkboxContent)}>{getIn18Text('YUQIHOUMEITIAN')}</span>
                    </Checkbox>
                  </div>
                ) : (
                  <div className={classnames(taskStyle.reminder)}>
                    <Form.Item name="enmuReminders" noStyle>
                      <Select
                        suffixIcon={<i className={scheduleStyles.expandIcon} />}
                        dropdownClassName={styles.selectDropDown}
                        listItemHeight={30}
                        style={{ width: 105 }}
                      >
                        <Select.Option className={styles.selectOption} key="nonReminder" value="nonReminder">
                          {getIn18Text('BUTIXING')}
                        </Select.Option>
                        {nonEndTime ? allDayReminderOpts : nonAllDayReminderOpts}
                      </Select>
                    </Form.Item>
                    <Form.Item valuePropName="checked" name="expireRemindEveryday" className={classnames(styles.wholeDay)}>
                      <Checkbox>
                        <span className={scheduleStyles.checkboxContent}>{getIn18Text('YUQIHOUMEITIAN')}</span>
                      </Checkbox>
                    </Form.Item>
                  </div>
                );
              }}
            </Form.Item>
          </div>
        </div>
      </Form>
    </div>
  );
};
export default TaskMailSetting;
