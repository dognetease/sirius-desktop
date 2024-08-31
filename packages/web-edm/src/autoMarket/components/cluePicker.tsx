import React, { useState, useEffect } from 'react';
import { Button, InputNumber, Form } from 'antd';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import { apis, apiHolder, CustomerApi } from 'api';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import style from './cluePicker.module.scss';
import { getIn18Text } from 'api';
const { Option } = Select;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
interface CluePickerProps {
  visible: boolean;
  values: Record<string, any>;
  resetValues: Record<string, any>;
  clueStatuses: LabelType[];
  onSave: (values: Record<string, any>) => void;
  onClose: () => void;
}
interface CascaderType {
  label: string;
  value: string;
  children: CascaderType[];
}
interface LabelType {
  label: string;
  value: string | number;
}
const CluePicker: React.FC<CluePickerProps> = props => {
  const { visible, values, resetValues, clueStatuses, onSave, onClose } = props;
  const [form] = Form.useForm();
  const [continents, setContinents] = useState<CascaderType[]>([]);
  useEffect(() => {
    form.setFieldsValue({ ...values });
  }, [values]);
  const handleContinentsFetch = () => {
    customerApi.getGlobalArea().then(res => {
      setContinents(res.area.reduce<CascaderType[]>((accumulator, areaItem) => [...accumulator, areaItem], []));
    });
  };
  const handleReset = () => {
    form.setFieldsValue({ ...resetValues });
  };
  const formValidator = () =>
    new Promise<any>((resolve, reject) => {
      form
        .validateFields()
        .then(values => {
          const filtered = Object.values(values).some(value => {
            return Array.isArray(value) ? !!value.length : value !== null && value !== undefined;
          });
          if (!filtered) {
            Toast.error({ content: getIn18Text('QINGZHISHAOGOUXUANYIGESHAIXUANZIDUAN') });
            reject();
          } else {
            resolve(values);
          }
        })
        .catch(() => {
          reject();
        });
    });
  const handleSave = () => {
    formValidator().then(values => {
      onSave(values);
    });
  };
  useEffect(() => {
    handleContinentsFetch();
  }, []);

  // 线索状态 转成 客户跟进动态  未处理 =>  新建  无效，关闭 => 未跟进  跟进中 =>  跟进中  转客户  => 不迁移 ？？ qianzaikehu
  return (
    <Drawer
      className={style.cluePicker}
      title={getIn18Text('QIANZAIKEHU')}
      contentWrapperStyle={{ width: 468 }}
      visible={visible}
      onClose={() => {
        form.setFieldsValue({ ...values });
        onClose();
      }}
      footer={
        <div className={style.cluePickerFooter}>
          <Button onClick={handleReset}>{getIn18Text('ZHONGZHI')}</Button>
          <Button type="primary" onClick={handleSave}>
            {getIn18Text('BAOCUN')}
          </Button>
        </div>
      }
    >
      <div className={style.cluePickerBody}>
        <div className={style.subTitle}>{getIn18Text('QINGXUANZEYIXIAZIDUANJINXINGSHAIXUAN\uFF0CZHISHAOGOUXUANYIGE')}</div>
        <Form className={style.form} form={form} layout="vertical">
          <Form.Item label={getIn18Text('KEHUGENJINZHUANGTAI')} name="followStatus">
            <Select placeholder={getIn18Text('XUANZEKEHUGENJINZHUANGTAI')} mode="multiple" allowClear showArrow>
              {clueStatuses.map(status => (
                <Option key={status.value} value={status.value}>
                  {status.label}
                </Option>
              ))}
            </Select>
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
        </Form>
      </div>
    </Drawer>
  );
};
export default CluePicker;
