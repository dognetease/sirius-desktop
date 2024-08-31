import React, { useState, useEffect } from 'react';
import { Select, Tooltip } from 'antd';
import { SelectProps, SelectValue } from 'antd/lib/select';
// import { EnhanceSelect, InSingleOption, InMultiOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
import { debounce } from 'lodash';
import { apiHolder, apis, AddressBookApi, IImportSelectListItem } from 'api';

interface Props extends SelectProps<SelectValue> {
  disableTip?: string;
  maxOptionLength?: number;
}

const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
export const ImportListSelect: React.FC<Props> = props => {
  const [importList, setImportList] = useState<IImportSelectListItem[]>([]);

  async function fetchGroup(importId: string = '', importName: string = '') {
    const res = await addressBookApi.getImportSelectList({
      page: 1,
      pageSize: props.maxOptionLength || 500,
      importId,
      importName,
    });
    setImportList(res?.list || []);
  }

  useEffect(() => {
    fetchGroup((props.defaultValue as string) || '', '');
  }, [props.defaultValue]);

  const onSearch = debounce(function (importName: string) {
    fetchGroup('', importName);
  }, 600);

  return (
    <Tooltip title={props.disabled ? props.disableTip : ''}>
      <EnhanceSelect {...props} showSearch onSearch={onSearch} filterOption={false}>
        {importList.map(group => (
          <InSingleOption value={group.importId} key={group.importId}>
            {group.importName}
          </InSingleOption>
        ))}
      </EnhanceSelect>
    </Tooltip>
  );
};
