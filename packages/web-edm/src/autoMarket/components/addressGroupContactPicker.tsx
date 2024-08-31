import React, { useEffect, useState } from 'react';
import { Button, Form } from 'antd';
import { apiHolder, apis, AddressBookApi, AutoMarketApi } from 'api';
import classnames from 'classnames';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { getTransText } from '@/components/util/translate';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { AddressGroupSelect } from '../../contact/components/AddressGroupSelect';
import { ImportListSelect } from '../../contact/components/ImportListSelect';
import { ContactList, ContactItem } from './contactList';
import style from './addressGroupContactPicker.module.scss';
import { getIn18Text } from 'api';

interface Props {
  visible: boolean;
  values: Record<string, any>;
  resetValues: Record<string, any>;
  onSave: (values: Record<string, any>) => void;
  onClose: () => void;
}

// groupIdList  importIdList getAddressContactForAutomarket
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const autoMarketApi = apiHolder.api.requireLogicalApi(apis.autoMarketApiImpl) as unknown as AutoMarketApi;
export const AddressGroupContactPicker: React.FC<Props> = props => {
  const { visible, values, onSave, onClose } = props;
  const [contactInfos, setContactInfos] = useState<ContactItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
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
    setContactInfos(values?.contactInfos || []);
  }, [values]);

  const handleReset = () => {
    form.setFieldsValue({ selectType: 'group', selectValue: [] });
    setContactInfos([]);
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
      if (!contactInfos?.length) {
        Toast.error({ content: getTransText('LIANXIRENLIEBIAOBUNENGWEIKONG') });
        return;
      }

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
      onSave({
        ...content,
        contactInfos,
      });
    });
  };

  function onContactDelete(item: ContactItem) {
    setContactInfos(
      (contactInfos || []).filter((contact: ContactItem) => {
        return contact.contactEmail !== item.contactEmail;
      })
    );
  }

  async function fetchContactList(ids: string[], type: string) {
    if (!ids.length || !type) {
      return setContactInfos([]);
    }

    try {
      setListLoading(true);
      setContactInfos([]);
      const res = await autoMarketApi.getAddressContactForAutomarket(ids, type);
      setContactInfos(
        res?.addressList?.map(item => {
          return {
            contactEmail: item.contactAddressInfo,
            contactName: item.contactName,
          };
        }) || []
      );
    } finally {
      setListLoading(false);
    }
  }

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
      <div className={classnames(style.cluePickerBody, style.flexCol)}>
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
                      maxTagCount={3}
                      optionFilterProp="children"
                      onChange={v => fetchContactList(v as string[], 'GROUP')}
                    ></AddressGroupSelect>
                  ) : (
                    <ImportListSelect
                      style={{ width: '280px' }}
                      placeholder={getTransText('QINGXUANZE')}
                      mode="multiple"
                      allowClear
                      showArrow
                      maxTagCount={3}
                      maxOptionLength={10000}
                      onChange={v => fetchContactList(v as string[], 'IMPORT')}
                    ></ImportListSelect>
                  )}
                </Form.Item>
              );
            }}
          </Form.Item>
        </Form>

        <div className={style.title}>{getIn18Text('LIANXIRENLIEBIAO')}</div>
        <div className={style.contactInfo}>
          <ContactList className={style.contactList} data={contactInfos} onDelete={onContactDelete} loading={listLoading} />
        </div>
      </div>
    </Drawer>
  );
};
