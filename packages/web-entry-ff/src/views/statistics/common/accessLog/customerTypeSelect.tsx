import React, { useState, useCallback, useEffect } from 'react';
import { Select, SelectProps } from 'antd';
import { apiHolder, apis, FFMSApi } from 'api';

interface SelectOption {
  label: string;
  value: string;
}

interface Props extends SelectProps<SelectOption> {}

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
export const CustomerTypeSelect: React.FC<Props> = props => {
  const [options, setOptions] = useState<SelectOption[]>([]);

  const getCustomerType = useCallback(async () => {
    const res = await ffmsApi.getCustomerTypeOptions();
    setOptions(
      (res?.content || []).map(item => {
        return {
          label: item?.customerTypeName,
          value: item?.customerTypeId,
          customerType: item?.customerType,
        };
      })
    );
  }, []);

  useEffect(() => {
    getCustomerType();
  }, []);

  return <Select {...props} options={options} />;
};
