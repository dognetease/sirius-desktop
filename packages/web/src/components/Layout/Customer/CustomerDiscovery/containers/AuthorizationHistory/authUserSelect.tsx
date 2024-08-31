import React, { useState, useEffect } from 'react';
import { apiHolder, apis, CustomerEmailAuthManager, CustomerDiscoveryApi } from 'api';
import { Select } from 'antd';
import { SelectProps, SelectValue } from 'antd/lib/select';

interface Props extends SelectProps<SelectValue> {
  disableTip?: string;
}

const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
export const AuthUserSelect: React.FC<Props> = props => {
  const [managerList, setManager] = useState<CustomerEmailAuthManager[]>([]);

  const fetchManagerList = async () => {
    if (managerList?.length) {
      return;
    }
    const managers = await customerDiscoveryApi.getAuthManagerList();
    setManager(managers);
  };

  useEffect(() => {
    fetchManagerList();
  }, []);

  return (
    <Select
      {...props} // eslint-disable-line
    >
      {managerList.map(manager => (
        <Select.Option value={manager.accId} key={manager.accId}>
          {manager.accNickname}
        </Select.Option>
      ))}
    </Select>
  );
};
