import React, { useEffect } from 'react';
import { Button, Form } from 'antd';
import { AddressBookApi, apiHolder, apis } from 'api';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { getTransText } from '@/components/util/translate';
import { AddressGroupSelect } from '../../contact/components/AddressGroupSelect';
import { ImportListSelect } from '../../contact/components/ImportListSelect';
import style from './cluePicker.module.scss';
import { apiHolder, AddressBookApi, apis } from 'api';

interface Props {
  visible: boolean;
  values: Record<string, any>;
  resetValues: Record<string, any>;
  onSave: (values: Record<string, any>) => void;
  onClose: () => void;
}

// groupIdList  importIdList
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const AddressPicker: React.FC<Props> = props => {
  const { visible, values, onSave, onClose } = props;
  const [form] = Form.useForm();

  useEffect(() => {
    let selectType;
    let selectValue = [];
    const groupIdList = values?.groupIdList || [];
    const importIdList = values?.importIdList || [];
    if (groupIdList.length) {
      selectType = 'group';
      selectValue = groupIdList;
    } else if (importIdList.length) {
      selectType = 'list';
      selectValue = importIdList;
    } else {
      return;
    }
    form.setFieldsValue({
      selectValue,
      selectType,
    });
  }, [values]);

  const handleReset = () => {
    form.setFieldsValue({ selectType: 'group', selectValue: [] });
  };

  const formValidator = () =>
    new Promise<any>((resolve, reject) => {
      form
        .validateFields()
        .then(values => {
          resolve(values);
        })
        .catch(() => {
          reject();
        });
    });

  const handleSave = () => {
    formValidator().then(values => {
      let content;
      if (values?.selectType === 'group') {
        content = {
          groupIdList: values?.selectValue || [],
        };
      } else {
        content = {
          importIdList: values?.selectValue || [],
        };
      }
      onSave(content);
    });
  };

  return (
    <Drawer
      className={style.cluePicker}
      title={getTransText('YINGXIAOLIANXIREN')}
      contentWrapperStyle={{ width: 468 }}
      visible={visible}
      onClose={() => {
        // handleReset();
        onClose();
      }}
      footer={
        <div className={style.cluePickerFooter}>
          <Button onClick={handleReset}>{getTransText('ZHONGZHI')}</Button>
          <Button type="primary" onClick={handleSave}>
            {getTransText('BAOCUN')}
          </Button>
        </div>
      }
    >
      <div className={style.cluePickerBody}>
        <div className={style.subTitle}>{getTransText('AutoTaskAddressPickerTip')}</div>
        <Form className={style.form} form={form} layout="inline" initialValues={{ selectType: 'group' }}>
          <Form.Item label={null} name="selectType">
            <Select style={{ width: '100px' }} placeholder={getTransText('QINGXUANZE')} onChange={() => form.setFieldsValue({ selectValue: [] })} showArrow>
              <Select.Option value="group">{getTransText('SelectByGroup')}</Select.Option>
              <Select.Option value="list">{getTransText('SelectByList')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={() => true}>
            {() => {
              const selectType = form.getFieldValue('selectType');
              return (
                <Form.Item
                  label={null}
                  name="selectValue"
                  rules={[
                    { required: true, message: getTransText('QINGXUANZE'), type: 'array' },
                    {
                      validator: async (_: any, value: string[]) => {
                        if (selectType === 'group') {
                          //
                          const res = await addressBookApi.getAddressGroupList();
                          const hasError = value?.some(val => {
                            return !res.find(group => String(group.groupId) === String(val));
                          });
                          if (hasError) {
                            return Promise.reject(getTransText('BUFENXUANXIANGYIBEISHANCHU'));
                          }
                          return Promise.resolve();
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  {selectType === 'group' ? (
                    <AddressGroupSelect
                      style={{ width: '280px' }}
                      placeholder={getTransText('QINGXUANZE')}
                      mode="multiple"
                      allowClear
                      showArrow
                      optionFilterProp="children"
                    ></AddressGroupSelect>
                  ) : (
                    <ImportListSelect
                      style={{ width: '280px' }}
                      placeholder={getTransText('QINGXUANZE')}
                      mode="multiple"
                      allowClear
                      showArrow
                      maxOptionLength={10000}
                    ></ImportListSelect>
                  )}
                </Form.Item>
              );
            }}
          </Form.Item>
        </Form>
      </div>
    </Drawer>
  );
};
export default AddressPicker;
