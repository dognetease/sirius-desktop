import React, { useState, useEffect } from 'react';
import { Button, Radio, Form, RadioChangeEvent } from 'antd';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import {
  apis,
  apiHolder,
  CustomerApi,
  AutoMarketCustomerTagOpType,
  AutoMarketCustomerTagOpTypeName,
  AutoMarketContactType,
  AutoMarketContactTypeName,
  AutoMarketTaskObjectType,
} from 'api';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import style from './customerPicker.module.scss';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';
const CUSTOMER_TAG_OP_TYPE_OPTIONS = Object.values(AutoMarketCustomerTagOpType)
  .filter(value => typeof value === 'number')
  .map(value => ({
    label: AutoMarketCustomerTagOpTypeName[value as AutoMarketCustomerTagOpType],
    value,
  }));
const CONTACT_TYPE_OPTIONS = Object.values(AutoMarketContactType)
  .filter(value => typeof value === 'number')
  .map(value => ({
    label: AutoMarketContactTypeName[value as AutoMarketContactType],
    value,
  }));
type Option = AutoMarketTaskObjectType;

const { Option } = Select;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
interface CustomerPickerProps {
  visible: boolean;
  values: Record<string, any>;
  resetValues: Record<string, any>;
  objectType: AutoMarketTaskObjectType;
  onSave: (values: Record<string, any>, objectType: Option | null) => void;
  onClose: () => void;
}
interface CascaderType {
  label: string;
  value: string;
  children: CascaderType[];
}
const CustomerPicker: React.FC<CustomerPickerProps> = props => {
  const { visible, values, resetValues, onSave, onClose, objectType } = props;
  const [form] = Form.useForm();
  const [tags, setTags] = useState<string[]>([]);
  const [continents, setContinents] = useState<CascaderType[]>([]);
  const [customerType, setCustomerType] = useState<string>('CUSTOMER');

  useEffect(() => {
    form.setFieldsValue({ ...values });
  }, [values]);

  useEffect(() => {
    setCustomerType(objectType ? objectType : 'CUSTOMER');
  }, [objectType]);

  const handleTagsFetch = () => {
    const param = { key: '', label_type: 0 };
    customerApi.getLabelList(param).then(res => {
      setTags(res.map(item => item.label_name));
    });
  };
  const handleContinentsFetch = () => {
    customerApi.getGlobalArea().then(res => {
      setContinents(res.area.reduce<CascaderType[]>((accumulator, areaItem) => [...accumulator, areaItem], []));
    });
  };
  const handleReset = () => {
    form.setFieldsValue({ ...resetValues });
  };
  const handleSave = () => {
    if (customerType === 'CUSTOMER') {
      form.validateFields().then(values => {
        onSave(values, customerType);
      });
    }
    if (customerType === 'WEBSITE') {
      onSave({ ...resetValues }, customerType);
    }
  };

  const onChangeCustomerType = (e: RadioChangeEvent) => {
    setCustomerType(e.target.value);
    e.target.value === 'WEBSITE' && handleReset();
  };
  useEffect(() => {
    handleTagsFetch();
    handleContinentsFetch();
  }, []);
  return (
    <Drawer
      className={style.customerPicker}
      title={getIn18Text('KEHULIEBIAO')}
      contentWrapperStyle={{ width: 468 }}
      visible={visible}
      onClose={() => {
        form.setFieldsValue({ ...values });
        onClose();
      }}
      footer={
        <div className={style.customerPickerFooter}>
          <Button onClick={handleReset}>{getIn18Text('ZHONGZHI')}</Button>
          <Button type="primary" onClick={handleSave}>
            {getIn18Text('BAOCUN')}
          </Button>
        </div>
      }
    >
      <div className={style.customerType}>
        <Radio.Group className={style.radioGroup} onChange={onChangeCustomerType} value={customerType}>
          <Radio.Button value="CUSTOMER">{getIn18Text('WODEKEHU')}</Radio.Button>
          <Radio.Button value="WEBSITE">{getTransText('XUNPANKEHU')}</Radio.Button>
        </Radio.Group>
      </div>
      {customerType === 'CUSTOMER' ? (
        <div className={style.customerPickerBody}>
          <div className={style.subTitle}>{getIn18Text('QINGXUANZEYIXIAZIDUANJINXINGSHAIXUAN\uFF0CZHISHAOGOUXUANYIGE')}</div>
          <Form className={style.form} form={form} layout="vertical">
            <Form.Item label={getIn18Text('KEHUBIAOQIAN')}>
              <div className={style.formItemRow}>
                <Form.Item className={style.customerTagOpType} name="customerTagOpType">
                  <Select placeholder={getIn18Text('BAOHANGUANXI')}>
                    {CUSTOMER_TAG_OP_TYPE_OPTIONS.map(item => (
                      <Option value={item.value}>{item.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="customerTags">
                  <Select placeholder={getIn18Text('QINGXUANZEKEHUBIAOQIAN')} mode="multiple" allowClear showArrow>
                    {tags.map(tag => (
                      <Option key={tag} value={tag}>
                        {tag}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </Form.Item>
            <Form.Item label={getIn18Text('ZHOUJI/GUOJIA')}>
              <div className={style.formItemRow}>
                <Form.Item name="continent">
                  <Select
                    placeholder={getIn18Text('QINGXUANZEZHOUJI')}
                    onChange={() => {
                      form.setFields([
                        {
                          name: 'country',
                          value: undefined,
                          errors: [],
                        },
                      ]);
                    }}
                    allowClear
                  >
                    {continents.map(continent => (
                      <Option value={continent.value}>{continent.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item shouldUpdate noStyle>
                  {() => {
                    const continent = form.getFieldValue('continent');
                    const countries = continents.find(item => item.value === continent)?.children || [];
                    return (
                      <Form.Item name="country">
                        <Select placeholder={getIn18Text('QINGXUANZEGUOJIA')} allowClear>
                          {countries.map(country => (
                            <Option value={country.value}>{country.label}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    );
                  }}
                </Form.Item>
              </div>
            </Form.Item>
            <Form.Item name="contactType" label={getIn18Text('LIANXIREN')} rules={[{ required: true, message: getIn18Text('QINGXUANZELIANXIRENLEIXING') }]}>
              <Radio.Group>
                {CONTACT_TYPE_OPTIONS.map(item => (
                  <Radio value={item.value}>{item.label}</Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          </Form>
        </div>
      ) : (
        <div className={`${style.customerPickerBody} ${style.website}`}>{getTransText('XUNPANKEHUTISHIXINXI')}</div>
      )}
    </Drawer>
  );
};
export default CustomerPicker;
