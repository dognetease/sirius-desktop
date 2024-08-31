import React, { useState, useEffect } from 'react';
import { Form } from 'antd';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import { api, apis, EdmVariableItem, FieldSettingApi } from 'api';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { getIn18Text } from 'api';
const fieldSettingApi = api.requireLogicalApi(apis.fieldSettingApiImpl) as FieldSettingApi;
export interface EditVariableModalProps {
  visible: boolean;
  item?: EdmVariableItem;
  onClose?: () => void;
  onOk?: () => void;
  checkConflict?: (name: string) => boolean;
}
export const EditVariableModal = (props: EditVariableModalProps) => {
  const { visible, item } = props;
  const [form] = Form.useForm();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setName(item ? item.variableName : '');
  }, [item, visible]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  const handleOk = () => {
    form
      .validateFields()
      .then(() => {
        setLoading(true);
        if (item) {
          return fieldSettingApi.editVariable(item.variableId, name);
        } else {
          return fieldSettingApi.addVariable(name);
        }
      })
      .then(() => {
        props.onOk && props.onOk();
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const label = item ? getIn18Text('BIANJI') : getIn18Text('XINZENG');
  return (
    <SiriusModal visible={visible} title={getIn18Text('MOBANBIANLIANG')} onCancel={props.onClose} onOk={handleOk} confirmLoading={loading}>
      <Form form={form}>
        <Form.Item
          label={label}
          rules={[
            {
              required: true,
              message: getIn18Text('QINGSHURUMOBANMINGCHENG'),
            },
            {
              validator(_, name: string) {
                if (props.checkConflict) {
                  const isDuplicate = props.checkConflict(name);
                  if (isDuplicate) {
                    return Promise.reject(`变量名称"${name}"已被使用`);
                  } else {
                    return Promise.resolve();
                  }
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder={getIn18Text('QINGSHURU')} value={name} onChange={handleInputChange} maxLength={20} />
        </Form.Item>
      </Form>
    </SiriusModal>
  );
};
