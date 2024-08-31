import React, { useState, useEffect } from 'react';
import { Modal, Form, Radio, DatePicker, Popover, Space } from 'antd';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import { Moment } from 'moment';
import { CustomerManualTask, apiHolder, apis, CustomerDiscoveryApi, RuleViewPermissionData } from 'api';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import { RuleEditor } from './ruleEditor';
import style from './style.module.scss';
import { getIn18Text } from 'api';
export interface Props {
  onSubmit: (form: CustomerManualTask) => void | Promise<void>;
  onCancel: () => void;
  visible: boolean;
}
type RangeValue = [Moment | null, Moment | null] | null;
const { RangePicker } = DatePicker;
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
export const AddTaskModal: React.FC<Props> = props => {
  const { visible, onSubmit, onCancel } = props;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState<RangeValue>(null);
  const [viewPermissionContact, setViewPermissionContact] = useState<RuleViewPermissionData[]>([]);
  const onModalCancel = () => {
    form.resetFields();
    onCancel && onCancel();
  };
  const onConfirm = async () => {
    const res = await form.validateFields();
    res.startDate = res?.date?.[0]?.startOf('day')?.valueOf() ?? '';
    res.endDate = res?.date?.[1]?.endOf('day')?.valueOf() ?? '';
    if (onSubmit) {
      setLoading(true);
      await Promise.resolve(onSubmit(res));
      setLoading(false);
      onModalCancel();
    }
  };
  const onOpenChange = (open: boolean) => {
    if (open) {
      form.setFields([{ name: 'date', value: undefined }]);
      setDates([null, null]);
    }
  };
  const disabledDate = (current: Moment) => {
    if (!dates) {
      return false;
    }
    const tooLate = dates[0] && current.diff(dates[0], 'days') > 90;
    const tooEarly = dates[1] && dates[1].diff(current, 'days') > 90;
    return !!tooEarly || !!tooLate;
  };
  async function fetchKeywords() {
    const res = await customerDiscoveryApi.getRuleViewPermissionList(1);
    setViewPermissionContact(res || []);
  }
  useEffect(() => {
    fetchKeywords();
  }, []);
  return (
    <Modal
      title={getIn18Text('XINJIANDINGZHIRENWU')}
      wrapClassName={style.modalWrapper}
      width={635}
      visible={visible}
      onCancel={onModalCancel}
      bodyStyle={{
        paddingBottom: '0',
        maxHeight: '481px',
        overflowY: 'auto',
      }}
      maskClosable={false}
      destroyOnClose
      centered
      onOk={onConfirm}
      okButtonProps={{ loading }}
    >
      <Form
        form={form}
        name="basic"
        className={style.form}
        // wrapperCol={{ span: 16 }}
        layout="vertical"
        initialValues={{ taskName: '', dataRange: 'personal' }}
        autoComplete="off"
      >
        <Form.Item label={getIn18Text('RENWUMINGCHENG')} name="taskName" rules={[{ required: true, message: getIn18Text('QINGSHURURENWUMINGCHENG') }]}>
          <Input style={{ width: 255 }} maxLength={40} placeholder={getIn18Text('QINGSHURURENWUMINGCHENG')} />
        </Form.Item>

        <Form.Item noStyle shouldUpdate={() => true}>
          {() => {
            const dataRange = form.getFieldValue('dataRange');
            return (
              <Form.Item label={getIn18Text('SHUJUFANWEI')} name="dataRange" rules={[{ required: true, message: getIn18Text('QINGXUANZESHUJUFANWEI') }]}>
                <Radio.Group>
                  <Radio value="personal">{getIn18Text('GERENYOUJIAN')}</Radio>
                  <Radio value="all">
                    <Space>
                      {getIn18Text('QIYEYOUJIAN')}
                      {dataRange === 'all' ? (
                        <Popover
                          // getPopupContainer={trigger => trigger}
                          content={
                            <div className={style.viewPermissions}>
                              <div className={style.viewPermissionsTitle}>{getIn18Text('JIANGCONGYIXIARENYUANFANWEINEI\uFF0CSHAIXUANWANGLAIYOUJIAN')}</div>
                              <div className={style.viewPermissionsTip}>{getIn18Text('GUANLIYUANKEDUIWANGLAIYOUJIANSHAIXUANDERENYUANMINGDANJINXINGGUANLI')}</div>
                              <div className={style.viewPermissionsContent}>
                                <div className={style.viewPermissionsList}>
                                  {viewPermissionContact.map(contact => (
                                    <div>{contact.accEmail}</div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          }
                          trigger="hover"
                          placement="rightTop"
                        >
                          <span className={style.linkBtn}>{getIn18Text('CHAKAN')}</span>
                        </Popover>
                      ) : (
                        ''
                      )}
                    </Space>
                  </Radio>
                </Radio.Group>
              </Form.Item>
            );
          }}
        </Form.Item>

        <Form.Item label={getIn18Text('SHAIXUANSHIJIANFANWEI')} name="date" rules={[{ required: true, message: getIn18Text('QINGXUANZERIQIFANWEI') }]}>
          <RangePicker
            separator=" - "
            placeholder={[getIn18Text('KAISHISHIJIAN'), getIn18Text('JIESHUSHIJIAN')]}
            locale={cnlocale}
            onOpenChange={onOpenChange}
            disabledDate={disabledDate}
            onCalendarChange={val => setDates(val)}
            format="YYYY/MM/DD"
          />
        </Form.Item>

        <Form.Item label={getIn18Text('SHAIXUANTIAOJIAN')} required>
          <RuleEditor form={form} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
