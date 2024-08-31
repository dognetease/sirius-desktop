import React, { useState, useEffect } from 'react';
import { apiHolder, apis, AddressBookApi, IAddressOriginListItem } from 'api';
import { Select, Tooltip } from 'antd';
// import { EnhanceSelect, InSingleOption, InMultiOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
import { SelectProps, SelectValue } from 'antd/lib/select';

interface Props extends SelectProps<SelectValue> {
  disableTip?: string;
}

const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
export const AddressOriginSelect: React.FC<Props> = props => {
  const [groupList, setGroupList] = useState<IAddressOriginListItem[]>([]);

  async function fetchOrigin() {
    const res = await addressBookApi.getAddressOriginList();
    setGroupList(res || []);
  }

  useEffect(() => {
    fetchOrigin();
  }, []);

  return (
    <Tooltip title={props.disabled ? props.disableTip : ''}>
      <EnhanceSelect {...props}>
        {groupList.map(group => (
          <InSingleOption value={group.sourceType} key={group.sourceType}>
            {group.sourceName}
          </InSingleOption>
        ))}
      </EnhanceSelect>
    </Tooltip>
  );
};
