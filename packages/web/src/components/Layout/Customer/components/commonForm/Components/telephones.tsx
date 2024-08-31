import React from 'react';
import { Form, Space } from 'antd';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import { ReactComponent as AddIcon } from '@/images/icons/edm/add.svg';
import { ReactComponent as DeleteIcon } from '@/images/icons/edm/delete.svg';
import style from './index.module.scss';
import { getIn18Text } from 'api';
interface ComProps {
  name: string;
  firstName: string;
  level1Index: number;
  label: string;
  item: any;
}
const Telephones = ({ name, label, firstName, item, level1Index }: ComProps) => {
  // 剔除汉语文案
  const normFile = e => {
    const text = e.target.value.replace(/[\u4E00-\u9FA5]/g, '');
    return text;
  };
  const labelLayout = (filed, label) => {
    console.log(filed);
    if (filed.key === 0) {
      return {
        label,
      };
    }
    return;
  };
  return (
    <Form.List name={[firstName, name]}>
      {(fields, { add, remove }) => (
        <>
          {fields.map(filed => (
            <Space key={filed.key} className={style.telephone} align="end">
              <Form.Item
                name={[filed.name, 'number']}
                className={`form-item-${name}`}
                fieldKey={[filed.fieldKey, 'number']}
                {...labelLayout(filed, label)}
                getValueFromEvent={normFile}
                validateTrigger={['onBlur', 'onChange']}
                rules={[
                  { required: item.required, message: item.message },
                  {
                    validateTrigger: 'onBlur',
                    validator: (_, value: string) => {
                      let row = level1Index;
                      let col = filed.key;
                      let isError = (item?.errArrMap || []).some(child => child.row === row && child.col === col);
                      console.log('xxxrow-col', item, row, col, isError);
                      if (item.asyncCheck) {
                        return item.asyncCheck(value, item, isError);
                      } else {
                        return Promise.resolve();
                      }
                    },
                  },
                ]}
              >
                <Input style={{ width: 296 }} maxLength={100} placeholder={getIn18Text('QINGTIANRU')} />
              </Form.Item>
              <Form.Item>
                <div style={{ marginTop: filed.key ? 0 : 26, height: 32, display: 'flex', alignItems: 'center' }}>
                  {filed.key === 0 ? <AddIcon onClick={() => add(filed.name)} /> : <DeleteIcon onClick={() => remove(filed.name)} />}
                </div>
              </Form.Item>
            </Space>
          ))}
        </>
      )}
    </Form.List>
  );
};
export default Telephones;
