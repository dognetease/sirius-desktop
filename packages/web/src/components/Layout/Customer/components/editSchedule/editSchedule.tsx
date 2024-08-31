import React, { useEffect } from 'react';
import classnames from 'classnames';
import moment, { Moment } from 'moment';
import { Form, Button } from 'antd';
import ReactDOM from 'react-dom';
import { api, apis, CustomerApi, CustomerScheduleEditParams, getIn18Text } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import ScheduleDatePicker from '@web-schedule/components/FormComponents/ScheduleDatePicker';
import TimeStepPicker from '@web-schedule/components/TimeStepPicker/TimeStepPicker';
import iconStyle from '@web-schedule/components/EventContent/eventcontent.module.scss';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import style from './editSchedule.module.scss';

const customerApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
export type ScheduleData = {
  subject: string;
  schedule_time: string;
};
export type ScheduleSubmitData = {
  start: string;
  subject: string;
};
interface EditScheduleProps {
  visible: boolean;
  title: React.ReactNode;
  data: ScheduleData | null;
  onOpen?: (start: string) => void;
  onSubmit: (data: ScheduleSubmitData) => void;
  onCancel: () => void;
  getContainer?: string | (() => HTMLElement) | HTMLElement;
}
// get last moment of time interval. eg: 09:02 -> 09:15
const getIntervalLastMoment = (interval: number, current: Moment = moment()) => {
  const value = current.valueOf();
  const backDiff = value % interval;
  const frontDiff = interval - backDiff;
  const nextMoment = moment(value + frontDiff);
  return nextMoment;
};
const EditSchedule: React.FC<EditScheduleProps> = props => {
  const { visible, title, data, onOpen, onSubmit, onCancel, getContainer } = props;
  const [form] = Form.useForm();
  useEffect(() => {
    if (visible) {
      if (data !== null) {
        const { schedule_time, subject } = data;
        const [date, time] = schedule_time.split(' ');
        onOpen && onOpen(schedule_time);
        form.setFieldsValue({
          subject,
          date: moment(date, 'YYYY-MM-DD'),
          time: moment(time, 'HH:mm:ss'),
        });
      } else {
        const intervalTime = 15 * 60 * 1000; // 15 mins
        const nextMoment = getIntervalLastMoment(intervalTime);
        onOpen && onOpen(nextMoment.format('YYYY-MM-DD HH:mm:ss'));
        form.setFieldsValue({
          subject: '',
          date: nextMoment,
          time: nextMoment,
        });
      }
    }
  }, [data, visible]);
  const handleSave = () => {
    const { subject, date, time } = form.getFieldsValue(true);
    if (subject.length > 60) return Toast.error({ content: getIn18Text('RICHENGZHUTIZUIDUOWEI 60 ZI') });
    if (subject.length === 0) return Toast.error({ content: getIn18Text('QINGSHURURICHENGZHUTI') });
    if (date === null) return Toast.error({ content: getIn18Text('QINGXUANZERIQI') });
    if (time === null) return Toast.error({ content: getIn18Text('QINGXUANZESHIJIAN') });
    const start = `${date.format('YYYY-MM-DD')} ${time.format('HH:mm:ss')}`;
    return onSubmit({ ...data, subject, start });
  };
  return (
    <Modal className={style.editSchedule} title={title} visible={visible} width={358} footer={null} onCancel={onCancel} getContainer={getContainer}>
      <Form form={form} colon={false}>
        <Form.Item name="subject" label={<i className={classnames([[iconStyle.icon, iconStyle.summry]])} />}>
          <Input placeholder={getIn18Text('TIANJIARICHENGZHUTI')} />
        </Form.Item>
        <Form.Item className={style.dateTime} label={<i className={classnames([[iconStyle.icon, iconStyle.clock]])} />}>
          <Input.Group compact>
            <Form.Item name="date">
              <ScheduleDatePicker
                // @ts-ignore: component doesn't set pass-through props
                placeholderText={getIn18Text('QINGXUANZERIQI')}
                onChange={date => form.setFieldsValue({ date })}
              />
            </Form.Item>
            <Form.Item name="time">
              <TimeStepPicker className={style.timeStepPicker} onChange={time => form.setFieldsValue({ time })} autoSelect={false} />
            </Form.Item>
          </Input.Group>
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSave}>
            {getIn18Text('BAOCUN')}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
EditSchedule.defaultProps = {
  visible: false,
  title: '',
  data: null,
  onSubmit: () => {},
  onCancel: () => {},
};
export default EditSchedule;
export const createNewScheduleModal = (
  props: {
    id: string;
    type: 'clue' | 'customer';
    onCancel: (isSubmited: boolean) => void;
  },
  container?: HTMLElement
) => {
  const div = document.createElement('div');
  const parent = container || document.body;
  const destroy = () => {
    ReactDOM.unmountComponentAtNode(div);
    parent.removeChild(div);
  };
  const options: EditScheduleProps = {
    title: getIn18Text('XINJIANRICHENG'),
    data: null,
    visible: true,
    onSubmit(data: ScheduleSubmitData) {
      const params: CustomerScheduleEditParams = { ...data };
      if (props.type === 'customer') {
        params.company_id = props.id;
      } else {
        params.clue_id = props.id;
      }
      customerApi.createCustomerSchedule(params).then(() => {
        props.onCancel(true);
        destroy();
      });
    },
    onCancel() {
      props.onCancel(false);
      destroy();
    },
  };
  parent.appendChild(div);
  // eslint-disable-next-line react/jsx-props-no-spreading
  ReactDOM.render(<EditSchedule {...options} />, div);
  return destroy;
};
