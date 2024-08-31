import React, { useEffect, useState } from 'react';
import { Button, Drawer, Form, Input, Space } from 'antd';
import { api, apis, ClueDetail, CustomerApi } from 'api';
import { useAppSelector } from '@web-common/state/createStore';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import AreaSelect from './areaSelect';
import { getIn18Text } from 'api';
const customerApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const CLUE_STATUS = [
  { value: '1', label: getIn18Text('WEICHULI') },
  { value: '2', label: getIn18Text('WUXIAO') },
  { value: '3', label: getIn18Text('GENJINZHONG') },
  // { value: '4', label: '转客户' },
  { value: '5', label: getIn18Text('GUANBI') },
];
export interface EditCustomerProps {
  visible: boolean;
  id: string;
  initValues?: Record<string, any>;
  onFormChange?: (changedValue: any, values: any) => void;
  onClose?: (succ?: boolean) => void;
}
export const mapClueDetailToFormValues = (detail: ClueDetail) => ({
  name: detail.name,
  status: detail.status,
  clue_batch: detail.clue_batch,
  clue_source: detail.source,
  area: detail.area.filter(s => !!s),
  remark: detail.remark,
  company_name: detail.company_name,
  company_domain: detail.company_domain,
});
export const ClueEditInfo = ({ visible, onClose, onFormChange, initValues, id }: EditCustomerProps) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const baseSelect = useAppSelector(state => state.customerReducer.baseSelect);
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
    if (id) {
      customerApi.getClueDetail({ id }).then(res => {
        if (!initValues) {
          form.setFieldsValue(mapClueDetailToFormValues(res));
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
        clue_id: id,
        continent,
        country,
        province,
        city,
      };
      delete params.area;
      setLoading(true);
      customerApi
        .updatePartialClue(params)
        .then(() => {
          onClose && onClose(true);
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
      title={getIn18Text('BIANJIXIANSUO')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ overflow: 'hidden auto', flex: '1' }}>
          <Form form={form} layout="vertical" onValuesChange={onFormChange}>
            <Form.Item label={getIn18Text('XIANSUOMINGCHENG')} name="name" required rules={[{ required: true, message: getIn18Text('QINGTIANXIEXIANSUOMINGCHENG') }]}>
              <Input maxLength={100} placeholder={getIn18Text('QINGSHURUXIANSUOMINGCHENG')} />
            </Form.Item>
            <Form.Item label={getIn18Text('XIANSUOZHUANGTAI')} name="status">
              <Select options={CLUE_STATUS} placeholder={getIn18Text('QINGXUANZE')} />
            </Form.Item>
            <Form.Item label={getIn18Text('XIANSUOLAIYUAN')} name="clue_source">
              <Select placeholder={getIn18Text('QINGXUANZE')}>
                {baseSelect.clue_source.map(item => (
                  <Select.Option key={item.value} value={item.value}>
                    {' '}
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label={getIn18Text('XIANSUOPICI')} name="clue_batch">
              <Select placeholder={getIn18Text('QINGXUANZE')}>
                {baseSelect.clue_batch.map(item => (
                  <Select.Option key={item.value} value={item.value}>
                    {' '}
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label={getIn18Text('XIANSUOBEIZHU')} name="remark">
              <Input.TextArea placeholder={getIn18Text('TIANJIAXIANSUOBEIZHU')} maxLength={2000} />
            </Form.Item>
            <Form.Item
              label={getIn18Text('GONGSIMINGCHENG')}
              name="company_name"
              required
              rules={[{ required: true, message: getIn18Text('QINGTIANXIEGONGSIMINGCHENG') }]}
            >
              <Input placeholder={getIn18Text('QINGSHURUGONGSIMINGCHENG')} maxLength={100} />
            </Form.Item>
            <Form.Item label={getIn18Text('GONGSIYUMING')} name="company_domain" required rules={[{ required: true, message: getIn18Text('QINGTIANXIEGONGSIYUMING') }]}>
              <Input placeholder={getIn18Text('QINGSHURUGONGSIYUMING')} maxLength={100} />
            </Form.Item>
            <Form.Item label={getIn18Text('GUOJIADEQU')} name="area">
              {/* baseSelect.area && <Cascader options={baseSelect.area} showSearch changeOnSelect /> */}
              {baseSelect && (
                <AreaSelect value={form.getFieldValue('area') || []} dataSource={baseSelect.area} updateFields={(values: any) => form.setFieldsValue(values)} />
              )}
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
