import React, { useState, useEffect } from 'react';
import { SelectProps, TagProps, Form } from 'antd';
import { throttle, debounce, divide } from 'lodash';
import { apiHolder, apis, MailEntryModel, CustomerApi, SystemApi, ContactApi, MailConfApi, ContactModel, MailApi } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import removeIcon from '@/images/icons/close_modal.svg';
const RemoveIcon = ({ size = 8 }) => <img src={removeIcon} width={size} height={size} />;
import Select from '../../UI/Select/customerSelect';
interface ComsProps {
  // onChange: (param: string[]) => void;
  // labelType: number
  props: any;
}
const ClientSelect: React.FC<any> = ({ item }) => {
  console.log('item-client-options', item);
  const [options, setOptions] = useState<any>([]);
  const formItemLayout = item => {
    let layout = {};
    Object.keys(item).forEach(key => {
      layout[key] = item[key];
    });
    layout['rules'] = [{ required: item.required, message: item.message }];
    return layout;
  };
  /**
   * 更改和添加tag相关操作
   */
  const handleTagsSearch = key => {
    console.log('搜素key', key);
    getClientList(key);
  };
  const getClientList = (key?: string) => {
    const param = {
      name: key,
      id: '',
      page: 1,
      page_size: 50,
    };
    clientApi.companySimpleList(param).then(res => {
      console.log('simple-list-inner', res);
      let option = res.content.map(item => {
        return {
          value: Number(item.company_id),
          label: item.company_name,
        };
      });
      setOptions(option);
      console.log('res-client', option);
    });
  };
  useEffect(() => {
    if (!item.options.length) {
      // getClientList();
    } else {
      setOptions(item.options);
    }
    console.log('inner-select', item.options);
    setOptions(item.options);
  }, [item.options]);
  return (
    <Form.Item key={item.name} className={`form-item-${item.name}`} {...formItemLayout(item)}>
      <Select
        placeholder={item.placeholder}
        filterOption={false}
        showSearch={true}
        options={options}
        disabled={item.disabled}
        onSearch={debounce(handleTagsSearch, 1000)}
      ></Select>
    </Form.Item>
  );
};
export default ClientSelect;
