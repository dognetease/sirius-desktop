import React, { useContext, useEffect, useState } from 'react';
import { Form, Space, Select } from 'antd';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
const { Option } = Select;
import { ReactComponent as AddIcon } from '@/images/icons/edm/add.svg';
import { ReactComponent as DeleteIcon } from '@/images/icons/edm/delete.svg';
import { customerContext } from '../../../customerContext';
import { ReactComponent as DwonIcon } from '@/images/icons/edm/downOutlined.svg';
import { apiHolder, DataStoreApi, BaseInfoRes as BaseSelectType } from 'api';
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const CUSTOMS_DATA_BASE_INFO = 'CUSTOMS_DATA_BASE_INFO';
import { useAppSelector } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
interface comProps {
  name: string;
  firstName: string;
  level1Index: number;
  label: string;
  selectField: string;
  item: any;
  noWrap: boolean;
}
const SocialPlatform = (props: comProps) => {
  const currentBaseSelect = useAppSelector(state => state.customerReducer.baseSelect);
  const [baseSelect, setBaseSelect] = useState<BaseSelectType | null>(null);
  const labelLayout = (key, label) => {
    if (key === 0) {
      return {
        label,
      };
    }
    return undefined;
  };
  useEffect(() => {
    const fetch = async () => {
      if (currentBaseSelect) {
        setBaseSelect(currentBaseSelect);
      } else {
        const { data } = await dataStoreApi.get(CUSTOMS_DATA_BASE_INFO);
        if (data) {
          setBaseSelect(JSON.parse(data));
        }
      }
    };
    fetch();
  }, [currentBaseSelect]);
  // 平台更改
  const onPlatefromChange = () => {};
  // 剔除汉语文案
  const normFile = e => {
    const text = e.target.value.replace(/[\u4E00-\u9FA5]/g, '');
    return text;
  };
  const formNameConfig = () => {
    // no-from => list-contact
    if (props.noWrap) {
      return {
        name: props.name,
      };
    } else {
      return {
        name: [props.firstName, props.name],
      };
    }
  };
  return (
    <Form.List {...formNameConfig()}>
      {(fields, { add, remove }) => (
        <div className={`form-item-${props.name}-box`}>
          {fields.map(({ key, name, fieldKey, ...restField }) => (
            <Space key={key} style={{ display: 'flex' }} align="end">
              <Form.Item
                {...restField}
                className={`form-item-${props.name}`}
                name={[name, 'type']}
                fieldKey={[fieldKey, 'type']}
                {...labelLayout(key, props.label)}
                rules={[{ required: false, message: getIn18Text('QINGXUANZEYIGEPINGTAI') }]}
              >
                <Select
                  placeholder={getIn18Text('QINGXUANZE')}
                  dropdownClassName="edm-selector-dropdown"
                  onChange={onPlatefromChange}
                  suffixIcon={<DwonIcon />}
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  allowClear
                  style={{ width: 106 }}
                >
                  {baseSelect &&
                    baseSelect[props.selectField] &&
                    baseSelect[props.selectField].map((el, elIndex) => {
                      return (
                        <Option key={elIndex} value={el.value}>
                          {' '}
                          {el.label}
                        </Option>
                      );
                    })}
                </Select>
              </Form.Item>
              <Form.Item
                {...restField}
                className={`form-item-${props.name}-number`}
                name={[name, 'number']}
                fieldKey={[fieldKey, 'number']}
                getValueFromEvent={normFile}
                validateTrigger={['onBlur', 'onChange']}
              >
                <Input maxLength={100} style={{ width: 182 }} placeholder={getIn18Text('QINGSHURU')} />
              </Form.Item>
              <Form.Item className={`form-item-${props.name}-handler`}>
                <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                  {key === 0 ? <AddIcon onClick={() => add(name)} /> : <DeleteIcon onClick={() => remove(name)} />}
                </div>
              </Form.Item>
            </Space>
          ))}
        </div>
      )}
    </Form.List>
  );
};
export default SocialPlatform;
