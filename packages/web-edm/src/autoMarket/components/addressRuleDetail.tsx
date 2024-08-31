import React, { useMemo, useState, useEffect } from 'react';
import { apiHolder, AddressBookApi, apis, IAddressGroupListItem, IImportSelectListItem } from 'api';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';

interface Props {
  type: string;
  ids: number[];
}

// groupIdList  importIdList
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
export const AddressRuleDetail: React.FC<Props> = props => {
  const { type, ids } = props;
  const [loading, setLoading] = useState(true);
  const [groupList, setGroup] = useState<Array<IAddressGroupListItem>>([]);
  const [importList, setList] = useState<Array<IImportSelectListItem>>([]);

  async function fetchGroup() {
    const res = await addressBookApi.getAddressGroupList();
    setGroup(res || []);
    setLoading(false);
  }

  async function fetchList() {
    const res = await addressBookApi.getImportSelectList({
      page: 1,
      pageSize: 10000,
      importIdList: ids,
    });
    setList(res?.list || []);
    setLoading(false);
  }

  useEffect(() => {
    if (type === 'group') {
      fetchGroup();
      return;
    }

    if (type === 'list') {
      fetchList();
    }
  }, [type]);

  const text = useMemo(() => {
    if (loading) {
      return getIn18Text('JIAZAIZHONG..');
    }
    let names: (string | undefined)[] = [];
    if (type === 'group') {
      names = ids.map(id => {
        const group = groupList.find(group => String(group.groupId) === String(id));
        return group?.groupName;
      });
    }

    if (type === 'list') {
      names = ids.map(id => {
        const importItem = importList.find(data => String(data.importId) === String(id));
        return importItem?.importName;
      });
    }

    let textList = names?.filter(Boolean) ?? [];
    if (!textList.length) {
      return `【${getTransText('FENZUBUCUNZAIHUOYISHANCHU')}】`;
    }

    return textList.join('，');
  }, [type, ids, groupList, importList, loading]);

  return <div>{text}</div>;
};
