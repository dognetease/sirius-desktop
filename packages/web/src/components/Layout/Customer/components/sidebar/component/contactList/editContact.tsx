import React, { useEffect, useState } from 'react';
import { Button, Drawer, Form, Input, Space } from 'antd';
import { api, apis, CustomerApi } from 'api';
import { useState2CustomerSlice } from '@web-mail/hooks/useState2SliceRedux';
import { useAppSelector } from '@web-common/state/createStore';

import { emailPattern } from '@web-common/utils/constant';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import { getIn18Text } from 'api';

const customerApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

export interface EditContactInfoProps {
  visible: boolean;
  resourceId: string;
  contactId: string;
  contactType: string; // 'clue' 'company'
  initValues?: Record<string, any>;
  onFormChange?: (changedValue: any, values: any) => void;
  onClose?: (succ?: boolean, email?: string) => void;
}

export const EditContactInfo = ({ visible, onClose, onFormChange, initValues, resourceId, contactId, contactType }: EditContactInfoProps) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const baseSelect = useAppSelector(state => state.customerReducer.baseSelect);
  const [customerAsideDetailData, setCustomerAsideDetailData] = useState2CustomerSlice('customerAsideDetail');

  useEffect(() => {
    if (visible) {
      if (initValues) {
        form.setFieldsValue(initValues);
      } else {
        // form.setFieldsValue(mapCustomerDetailToFormValues(detail));
      }
    }
  }, [initValues, visible]);

  useEffect(() => {
    if (contactId && resourceId) {
      customerApi
        .contactDetail({
          condition: contactType === 'clue' ? 'clue' : 'company',
          [contactType === 'clue' ? 'clue_id' : 'company_id']: resourceId,
          contact_id: contactId,
        } as any)
        .then(res => {
          if (!initValues) {
            if (res?.telephones.length === 0) {
              res.telephones = [''];
            }
            form.setFieldsValue(res);
          }
        });
    }
  }, [resourceId, contactId]);

  const handleSave = () => {
    form.validateFields().then(values => {
      console.log(values);
      const params = {
        ...values,
        contact_id: contactId,
        // [contactType === 'clue' ? 'clue_id' : 'company_id']: resourceId,
        // condition: contactType,
      };
      // if (params.telephone) {
      //   params.telephones = [params.telephone];
      //   delete params.telephone;
      // }
      setLoading(true);
      customerApi
        .updatePartialContact(params)
        .then(() => {
          // 先同步下边栏的email，防止修改了邮箱，导致联系人列表空白
          setCustomerAsideDetailData({
            ...customerAsideDetailData,
            email: params.email,
          });
          onClose && onClose(true, params.email);
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };

  return (
    <Drawer
      width="100%"
      placement="right"
      closable
      getContainer={false}
      visible={visible}
      onClose={() => onClose && onClose()}
      style={{ position: 'absolute' }}
      title={getIn18Text('BIANJILIANXIREN')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ overflow: 'hidden auto', flex: '1' }}>
          <Form form={form} layout="vertical" onValuesChange={onFormChange}>
            <Form.Item label={getIn18Text('LIANXIRENXINGMING')} name="contact_name">
              <Input placeholder={getIn18Text('QINGSHURUYOUXIANGDEZHI')} />
            </Form.Item>
            <Form.Item
              label={getIn18Text('YOUXIANGDEZHI')}
              name="email"
              required
              rules={[
                { required: true, message: getIn18Text('QINGSHURUYOUXIANGDEZHI') },
                { pattern: emailPattern, message: getIn18Text('QINGSHURUZHENGQUEYOUXIANGDEZHI') },
              ]}
            >
              <Input placeholder={getIn18Text('QINGSHURUYOUXIANGDEZHI')} />
            </Form.Item>
            {/*
            <Form.Item label="电话" name="telephones">
              <Input placeholder="请输入电话" />
            </Form.Item>
            */}
            <Form.List name="telephones">
              {fields => (
                <>
                  {fields.map((field, index) => (
                    <Form.Item
                      // eslint-disable-next-line react/jsx-props-no-spreading
                      {...field}
                      label={index === 0 ? getIn18Text('DIANHUA') : ''}
                    >
                      <Input maxLength={100} placeholder={getIn18Text('QINGTIANRU')} />
                    </Form.Item>
                  ))}
                </>
              )}
            </Form.List>
            <Form.Item label={getIn18Text('XINGBIE')} name="gender">
              <Select placeholder={getIn18Text('QINGXUANZE')}>
                {baseSelect?.gender?.map(item => (
                  <Select.Option key={item.value} value={item.value}>
                    {' '}
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label={getIn18Text('BEIZHU')} name="remark">
              <Input.TextArea placeholder={getIn18Text('QINGSHURUNEIRONG')} />
            </Form.Item>
          </Form>
        </div>
        <div className="footer" style={{ flex: 'none', display: 'flex', justifyContent: 'flex-end' }}>
          <Space size={[16, 16]}>
            <Button onClick={() => onClose && onClose(false, customerAsideDetailData.email)}>{getIn18Text('QUXIAO')}</Button>
            <Button type="primary" onClick={handleSave} loading={loading}>
              {getIn18Text('BAOCUN')}
            </Button>
          </Space>
        </div>
      </div>
    </Drawer>
  );
};
