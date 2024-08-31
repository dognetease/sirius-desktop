import { Button, Checkbox, Form, Input, Modal, Select } from 'antd';
import React, { useState } from 'react';
import { MeetingRoomForm } from '../Schedule/components/CreateBox/MeetingRoomForm';
import { loopRules, reminderOpts } from '../Schedule/components/CreateBox/util';
import { ScheduleDatePicker, ScheduleTimeStepPicker, ScheduleLocationInput } from '../Schedule/components/FormComponents';

/**
 * ATTENTION
 * 1.name字段不要更改，会议室组件会直接更改form里相应字段的值
 * 2.重复规则和提醒规则实际上应该是一个对象，
 *   交互上只设计成一个选择框，
 *   所以这里采取用枚举去映射相应对象的方式，
 *   在提交时需要根据枚举匹配还原成对应的对象。
 * 3.日程提醒是一个枚举的数组，demo里简单处理成一个枚举值了
 * 4.这里面还有一些表单之间的联动没有做，
 *   比如选择完会议室再修改日期，要重新选择会议室
 *   比如选择全天日程，时间选择组件要disable
 */

export default () => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState<boolean>(false);
  const handleFinish = async values => {
    console.log(values);
  };

  return (
    <>
      <Form
        initialValues={{
          meetingOrderParam: undefined,
        }}
        form={form}
        onFinish={handleFinish}
      >
        <Form.Item label="开始日期" name={['moments', 'startDate']}>
          <ScheduleDatePicker />
        </Form.Item>
        <Form.Item label="开始时间" name={['moments', 'startTime']}>
          <ScheduleTimeStepPicker />
        </Form.Item>
        <Form.Item label="结束日期" name={['moments', 'endDate']}>
          <ScheduleDatePicker />
        </Form.Item>
        <Form.Item label="结束时间" name={['moments', 'endTime']}>
          <ScheduleTimeStepPicker />
        </Form.Item>
        <Form.Item label="结束时间" valuePropName="checked" name={['time', 'allDay']}>
          <Checkbox>全天</Checkbox>
        </Form.Item>
        <Form.Item label="重复规则" name="enmuRecurrenceRule">
          <Select>
            {loopRules.map(r => (
              <Select.Option key={r.value} value={r.value}>
                {r.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="日程提醒" shouldUpdate>
          {({ getFieldValue }) => (
            <Form.Item noStyle name="enmuReminders">
              <Select>
                {reminderOpts(getFieldValue(['time', 'allDay'])).map(op => (
                  <Select.Option key={op.value} value={op.value}>
                    {op.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Form.Item>
        <Form.Item label="地点" shouldUpdate>
          {({ getFieldValue }) => {
            const meetingRoomSelected = getFieldValue('meetingOrderParam');
            return (
              <Form.Item noStyle name="location">
                <ScheduleLocationInput
                  meetingRoomEnable={!0}
                  meetingRoomSelected={!!meetingRoomSelected}
                  renderSelectMeetingRoom={() => (
                    // eslint-disable-next-line jsx-a11y/anchor-is-valid
                    <a
                      onClick={e => {
                        e.preventDefault();
                        setVisible(!0);
                      }}
                    >
                      选择会议室
                    </a>
                  )}
                  meetingRoomLocationProps={{
                    onUpdate: () => {
                      setVisible(!0);
                    },
                    onCancel: () => {
                      form.setFieldsValue({
                        location: '',
                        meetingOrderParam: undefined,
                      });
                    },
                  }}
                />
              </Form.Item>
            );
          }}
        </Form.Item>
        <Form.Item noStyle hidden name="meetingOrderParam">
          <Input />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit">提交</Button>
          <Button htmlType="reset">重置</Button>
        </Form.Item>
      </Form>
      <Modal visible={visible} onCancel={() => setVisible(false)} destroyOnClose>
        <MeetingRoomForm
          disableBackIcon
          onBack={() => {
            setVisible(false);
          }}
          scheduleFormRef={{
            getFormInstance: () => form,
          }}
        />
      </Modal>
    </>
  );
};
