import React, { useEffect, useState } from 'react';
import styles from './EditContact.module.scss';
import { Button, Cascader, Form, Input } from 'antd';
import { CheckboxSelect } from '../../components/CheckboxSelect/index';
import { ModalHeader } from '../../components/ModalHeader/index';
import { useSelectCheckBox } from '../../hooks/selectCheckBoxHooks';
import { AddressBookApi, apiHolder, apis, CustomerApi } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { getIn18Text } from 'api';
import { getLinkFromStr } from '../../utils';
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
export interface IEditContactProps {
  visible: boolean;
  onClose: () => void;
  addressId: number;
  contactId: number;
  contactInfo: {
    name: string;
    groupIds: number[];
    country: string[];
    companyName: string;
    companySite: string;
    remark: string;
    mobile: string;
    jobPosition: string;
  };
  onSuccess?: () => void;
  onError?: () => void;
}
interface IAreaItem {
  label: string;
  value: string;
  children: {
    label: string;
    value: string;
  }[];
}
const formItemLayout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 19 },
};
export function EditContact(props: IEditContactProps) {
  const { visible, onClose, onSuccess, onError, contactInfo, addressId, contactId } = props;
  const [loading, setLoading] = useState(false);
  const { options, changeCheckState, unCheckAllOptions, addGroupIfNeed, addOptions, updateOptionsByIds } = useSelectCheckBox(contactInfo.groupIds);
  const [form] = Form.useForm();
  const [globalArea, setGlobalArea] = useState<IAreaItem[]>([]);
  const [formData, setFormData] = useState({
    contactName: '',
    contactMobile: '',
    companyName: '',
    companySite: '',
    remark: '',
    country: [] as string[],
    jobPosition: '',
  });
  const onEdit = async () => {
    form.validateFields().then(async formValues => {
      setLoading(true);
      try {
        await addGroupIfNeed();
      } catch {
        setLoading(false);
        return;
      }
      const { contactName, contactMobile, remark, companyName, companySite, country, jobPosition } = formValues;
      const params = {
        addressInfo: {
          id: addressId,
        },
        contactInfo: {
          companyName,
          companySite,
          contactName,
          continent: country && country[0],
          country: country && country[1],
          id: contactId,
          remark,
          tels: [contactMobile],
          jobTitle: jobPosition,
        },
        groupInfos: options
          .filter(el => el.checked)
          .map(el => ({
            groupId: el.id,
            groupName: el.label,
          })),
      };
      addressBookApi
        .addressBookUpdateContact(params)
        .then(() => {
          onSuccess && onSuccess();
        })
        .catch(() => {
          onError && onError();
        })
        .finally(() => setLoading(false));
    });
  };
  const getCountryOptions = () => {
    customerApi.getGlobalArea().then(({ area }) => {
      setGlobalArea(
        area.map(each => {
          return {
            value: each.value,
            label: each.label,
            children: each.children.map(ele => ({
              value: ele.value,
              label: ele.label,
            })),
          };
        })
      );
    });
  };
  useEffect(() => {
    getCountryOptions();
  }, []);
  useEffect(() => {
    const { name, companyName, companySite, country, groupIds, remark, mobile, jobPosition } = contactInfo;
    updateOptionsByIds(groupIds);
    setFormData({
      contactName: name,
      contactMobile: mobile,
      companyName,
      companySite,
      remark,
      country: country.filter(el => el && el.length > 0),
      jobPosition,
    });
  }, [contactInfo]);
  return (
    <Modal
      visible={visible}
      width={471}
      onCancel={onClose}
      closable={false}
      maskClosable={false}
      title={<ModalHeader title={getIn18Text('BIANJILIANXIREN')} onClick={onClose} />}
      footer={[
        <Button onClick={onClose}>{getIn18Text('QUXIAO')}</Button>,
        <Button onClick={onEdit} loading={loading} type="primary">
          {getIn18Text('QUEDING')}
        </Button>,
      ]}
      className={styles.edit}
      destroyOnClose
    >
      <Form className={styles.editName} initialValues={formData} {...formItemLayout} form={form}>
        <Form.Item label={getIn18Text('LIANXIRENXINGMING')} className={styles.editLabel} name="contactName">
          <Input />
        </Form.Item>
        <Form.Item className={styles.editGroup} label={getIn18Text('FENZUXINXI')}>
          <CheckboxSelect options={options} addGroup={addOptions} uncheckAll={unCheckAllOptions} checkOption={changeCheckState} />
        </Form.Item>
        <Form.Item label={getIn18Text('LIANXIDIANHUA')} name="contactMobile">
          <Input />
        </Form.Item>
        <Form.Item label={getIn18Text('ZHIWEI')} name="jobPosition">
          <Input />
        </Form.Item>
        <Form.Item label={getIn18Text('GUOJIA')} className={styles.editCountry} name="country">
          <Cascader options={globalArea} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label={getIn18Text('GONGSIMINGCHENG')} name="companyName">
          <Input />
        </Form.Item>
        <Form.Item
          name="companySite"
          label={getIn18Text('GONGSIGUANWANG')}
          rules={[
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();

                return getLinkFromStr(value) ? Promise.resolve() : Promise.reject(getIn18Text('QINGSHURUZHENGQUEDEWANGZHI'));
              },
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="remark" label={getIn18Text('BEIZHU')}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
