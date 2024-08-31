import React, { useState, useEffect } from 'react';
import { apiHolder, apis, AddressBookApi, IAddressGroupListItem } from 'api';
import { Select, Tooltip } from 'antd';
// import { EnhanceSelect, InSingleOption, InMultiOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
import { SelectProps, SelectValue } from 'antd/lib/select';

interface Props extends SelectProps<SelectValue> {
  disableTip?: string;
}

const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
export const AddressGroupSelect: React.FC<Props> = props => {
  const [groupList, setGroupList] = useState<IAddressGroupListItem[]>([]);

  async function fetchGroup() {
    const res = await addressBookApi.getAddressGroupList();
    setGroupList(res || []);
  }

  useEffect(() => {
    fetchGroup();
  }, []);

  return (
    <Tooltip title={props.disabled ? props.disableTip : ''}>
      <EnhanceSelect {...props}>
        {groupList.map(group => (
          <InSingleOption value={group.groupId} key={group.groupId}>
            {group.groupName}
          </InSingleOption>
        ))}
      </EnhanceSelect>
    </Tooltip>
  );
};
