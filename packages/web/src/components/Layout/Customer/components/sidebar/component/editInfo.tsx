import React, { useEffect, useState } from 'react';
import { getIn18Text } from 'api';
import { Button, Drawer, Form, Input, Space } from 'antd';
import { api, apis, CustomerApi, CustomerDetail, DataTrackerApi } from 'api';
import { useAppSelector } from '@web-common/state/createStore';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import { Tags } from '../../commonForm/Components';
import AreaSelect from './areaSelect';
import './editInfo.scss';

const customerApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
export interface EditCustomerProps {
  visible: boolean;
  id: string;
  initValues?: Record<string, any>;
  onFormChange?: (changedValue: any, values: any) => void;
  onClose?: (succ?: boolean) => void;
}
export const mapCustomerDetailToFormValues = (detail?: CustomerDetail) => ({
  company_name: detail?.company_name,
  short_name: detail?.short_name,
  telephone: detail?.telephone,
  company_level: detail?.company_level ? detail?.company_level + '' : undefined,
  company_source: detail?.source ? detail?.source + '' : undefined,
  area: detail?.area.filter(s => !!s),
  company_domain: detail?.company_domain,
  website: detail?.website,
  label_list: detail?.label_list.map(i => i.label_name),
});
export const EditInfo = ({ visible, onClose, onFormChange, initValues, id }: EditCustomerProps) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const baseSelect = useAppSelector(state => state.customerReducer.baseSelect);
  useEffect(() => {
    if (visible) {
      if (initValues) {
        console.log('yao_initValues', initValues);
        form.setFieldsValue(initValues);
      } else {
        // form.setFieldsValue(mapCustomerDetailToFormValues(detail));
      }
    }
  }, [initValues, visible]);
  useEffect(() => {
    if (id) {
      customerApi.getCompanyDetail(id).then(res => {
        if (!initValues) {
          form.setFieldsValue(mapCustomerDetailToFormValues(res));
        }
      });
    }
  }, [id]);
  const handleSave = () => {
    form.validateFields().then(values => {
      console.log(values);
      const [continent, country, province, city] = values.area;
      const params = {
        ...values,
        company_id: id,
        continent,
        country,
        province,
        city,
      };
      delete params.area;
      setLoading(true);
      customerApi
        .updatePartialCompany(params)
        .then(() => {
          onClose && onClose(true);
          trackApi.track('waimao_mail_sidebar_updateCustomer');
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
      title={getIn18Text('BIANJIKEHUZILIAO')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ overflow: 'hidden auto', flex: '1' }}>
          <Form form={form} layout="vertical" onValuesChange={onFormChange}>
            <Form.Item
              label={getIn18Text('GONGSIMINGCHENG')}
              name="company_name"
              required
              rules={[{ required: true, message: getIn18Text('QINGTIANXIEGONGSIMINGCHENG') }]}
            >
              <Input placeholder={getIn18Text('QINGSHURU')} />
            </Form.Item>
            <Form.Item label={getIn18Text('GONGSIJIANCHENG')} name="short_name">
              <Input placeholder={getIn18Text('QINGSHURU')} />
            </Form.Item>
            <Form.Item label={getIn18Text('KEHUBIAOQIAN')} name="label_list">
              <Tags labeltype={0} onChange={e => console.log(e)} />
            </Form.Item>
            <Form.Item label={getIn18Text('GUOJIADEQU')} name="area">
              {baseSelect && (
                <AreaSelect value={form.getFieldValue('area') || []} dataSource={baseSelect.area} updateFields={(values: any) => form.setFieldsValue(values)} />
              )}
            </Form.Item>
            <Form.Item label={getIn18Text('WANGZHI')} name="website">
              <Input placeholder={getIn18Text('QINGSHURU')} />
            </Form.Item>
            <Form.Item label={getIn18Text('ZUOJIDIANHUA')} name="telephone">
              <Input placeholder={getIn18Text('QINGSHURU')} />
            </Form.Item>
            <Form.Item label={getIn18Text('KEHUFENJI')} name="company_level">
              <Select placeholder={getIn18Text('QINGXUANZE')}>
                {baseSelect.company_level.map(item => (
                  <Select.Option key={item.value} value={item.value}>
                    {' '}
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label={getIn18Text('KEHULAIYUAN')} name="company_source">
              <Select placeholder={getIn18Text('QINGXUANZE')}>
                {baseSelect.company_source.map(item => (
                  <Select.Option key={item.value} value={item.value}>
                    {' '}
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </div>
        <div className="footer" style={{ flex: 'none', display: 'flex', justifyContent: 'flex-end' }}>
          <Space size={[16, 16]}>
            <Button onClick={() => onClose && onClose()}>{getIn18Text('QUXIAO')}</Button>
            <Button type="primary" onClick={handleSave} loading={loading}>
              {getIn18Text('BAOCUN')}
            </Button>
          </Space>
        </div>
      </div>
    </Drawer>
  );
};
