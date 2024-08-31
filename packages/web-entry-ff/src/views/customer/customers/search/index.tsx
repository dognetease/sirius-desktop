import React from 'react';
import { Form } from 'antd';
import { EnhanceSelect, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
import { FormInstance } from 'antd/es/form/Form';
import { useDebounceFn } from 'ahooks';
import { FFMSRate } from 'api';
import Input from '@lingxi-common-component/sirius-ui/Input';
import style from './style.module.scss';

interface Props {
  form: FormInstance<any>;
  submit: () => void;
  options: FFMSRate.Option[];
}

const Search: React.FC<Props> = ({ form, submit, options }) => {
  const { run } = useDebounceFn(
    () => {
      submit();
    },
    {
      wait: 300,
    }
  );
  const onValuesChange = (values: FFMSRate.ListReq) => {
    console.log('onValueChange', values);
    run();
  };

  return (
    <Form form={form} onValuesChange={(_, values) => onValuesChange(values)} layout="inline" className={style.priceSearch}>
      <Form.Item name="fuzzySearch" label="筛选维度">
        <Input placeholder="搜索客户企业名称、账号" style={{ width: '100%', height: 36 }} />
      </Form.Item>
      <Form.Item name="searchLevelIds" label="客户等级">
        <EnhanceSelect mode="multiple" size="large" maxTagCount={1} showSearch optionFilterProp="label" placeholder="请选客户等级" style={{ width: '100%' }}>
          {(options || []).map(option => (
            <InMultiOption key={option.value} value={option.value}>
              {option.label}
            </InMultiOption>
          ))}
        </EnhanceSelect>
      </Form.Item>
    </Form>
  );
};

export default Search;
