import React, { useState, useEffect } from 'react';
import { useForm } from 'antd/es/form/Form';
import style from './feedbackModal.module.scss';
import classNames from 'classnames';
import { Button, Checkbox, Form, Input, Select } from 'antd';
import Modal from '@/components/Layout/components/Modal/modal';
// test config
export interface GlobalFeedbackType {
  errorTypes: Array<string>;
  remark: string;
}

interface feedbackModalProps {
  visible: boolean;
  setVisible: () => void;
  feedbackList: Array<{
    errorName: string;
    errorType: string;
  }>;
  submitReport: (params: GlobalFeedbackType) => void;
}

interface formData {
  errorTypes: string[];
  remark: string;
}

export const FeedbackModal: React.FC<feedbackModalProps> = props => {
  const { visible, setVisible, feedbackList, submitReport } = props;
  const [form] = useForm<formData>();
  return (
    <Modal
      visible={visible}
      // footer={null}
      title={'选择错误原因'}
      className={style.feedback}
      // closable={false}
      width={480}
      headerBottomLine={false}
      footerTopLine={false}
      okText="提交"
      onCancel={() => {
        form.resetFields();
        setVisible();
      }}
      onOk={async () => {
        const fieldsValue = await form.validateFields();
        // console.log(fieldsValue, '今晚打老虎')
        const { errorTypes, remark } = form.getFieldsValue();
        // console.log(errorTypes, remark, '表单信息')
        submitReport({
          errorTypes,
          remark,
        });
        form.resetFields();
        setVisible();
      }}
      bodyStyle={{ padding: '8px 24px' }}
    >
      <Form layout="horizontal" colon={false} form={form}>
        <Form.Item
          name="errorTypes"
          style={{ marginBottom: '16px' }}
          rules={[
            {
              required: true,
              message: '至少选择一个错误原因',
            },
          ]}
        >
          {/* <Checkbox.Group options={mockData}   /> */}
          <Checkbox.Group style={{ width: '100%' }}>
            {feedbackList &&
              feedbackList.map(item => (
                <Checkbox key={item.errorType} style={{ width: '140px', marginLeft: 0, marginBottom: '4px' }} value={item.errorType}>
                  {item.errorName}
                </Checkbox>
              ))}
          </Checkbox.Group>
        </Form.Item>
        <Form.Item name="remark" style={{ marginBottom: 0 }}>
          <Input.TextArea
            showCount
            maxLength={500}
            placeholder="错误描述，最多可输入500字..."
            style={{ position: 'relative' }}
            // style={{ minHeight: 120 }}
            // onChange={onChange}
            // placeholder="can resize"
          ></Input.TextArea>
        </Form.Item>
      </Form>
    </Modal>
  );
};
