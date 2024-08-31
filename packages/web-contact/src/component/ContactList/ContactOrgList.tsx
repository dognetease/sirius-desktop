import React, { useState, useCallback, useEffect } from 'react';
import { buildOrgChildrenKey, ContactOrgItem, isOrg } from '@web-common/components/util/contact';
import { ContactListProps, ContactList } from './list';
import { api, apis, ContactAndOrgApi } from 'api';
import { transContactModel2ContactItem } from '@web-common/components/util/contact';
import { ContactItem } from '@web-common/utils/contact_util';

interface ContactOrgListProps extends ContactListProps {
  onDataChange?: (data: ContactOrgItem[]) => void;
  onDecorateClick?: (item: ContactOrgItem) => void;
}

type Props = Omit<ContactOrgListProps, 'expandIds' | 'onExpand'>;

const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;

export const ContactOrgList: React.FC<Props> = (props: Props) => {
  const { data: list, _account, onSelectItem, dataChangeScrollToTop: _dataChangeScrollToTop } = props;
  const [dataList, setDataList] = useState<ContactOrgItem[]>(list);
  const [dataChangeScrollToTop, setDataChangeScrollToTop] = useState<boolean>(!!_dataChangeScrollToTop);
  // 设置展开的项目id集合
  const [expandIds, setExpandIds] = useState<Set<string>>(new Set());
  const [orgDataMap, setOrgDataMap] = useState<Map<string, ContactItem[]>>(new Map());

  useEffect(() => {
    setDataChangeScrollToTop(true);
    setDataList(list);
    setOrgDataMap(new Map());
    setExpandIds(new Set());
  }, [list]);

  const getContactDataByOrgId = useCallback(
    async (orgId: string) => {
      const contactItemList = orgDataMap.get(orgId) || [];
      if (!contactItemList.length) {
        const contactList = await contactApi.doGetContactByOrgId({ orgId, _account });
        contactList.forEach(item => {
          if (item) {
            const contactItem = transContactModel2ContactItem(item);
            contactItem.renderKey = buildOrgChildrenKey(orgId, contactItem);
            contactItem.parentId = orgId;
            contactItemList.push(contactItem);
          }
        });
        orgDataMap.set(orgId, contactItemList);
        setOrgDataMap(new Map(orgDataMap));
      }
      return contactItemList;
    },
    [_account, orgDataMap]
  );

  const handleLoadData = useCallback(async (orgId: string, loadData: boolean) => {
    const contactItemList = await getContactDataByOrgId(orgId);
    setDataChangeScrollToTop(false);
    setDataList(list => {
      const _list = [...list];
      const index = _list.findIndex(item => item.id === orgId);
      if (index > -1) {
        if (loadData) {
          _list.splice(index + 1, 0, ...contactItemList);
        } else {
          _list.splice(index + 1, contactItemList.length);
        }
      }
      return _list;
    });
  }, []);

  const handleExpand = useCallback((key: string) => {
    setExpandIds(_expandSet => {
      const expandSet = new Set([..._expandSet]);
      const expanded = expandSet.has(key);
      if (expanded) {
        expandSet.delete(key);
      } else {
        expandSet.add(key);
      }
      handleLoadData(key, !expanded);
      return expandSet;
    });
  }, []);

  const getOrgDragData = useCallback((list: ContactOrgItem[], startIndex: number) => {
    let len = 0;
    list.some((item, i) => {
      if (i > startIndex) {
        if (item.hasOwnProperty('renderKey')) {
          len++;
        } else {
          return true;
        }
      }
      return false;
    });
    return {
      len,
      data: list.slice(startIndex, startIndex + len + 1),
    };
  }, []);

  const handleSort = useCallback((currentIndex: number, dragIndex: number) => {
    setDataList(list => {
      const _list = [...list];
      const len = currentIndex - dragIndex;
      let sortArr = [];
      let startIndex;
      if (len > 0) {
        const dragItem = _list[dragIndex];
        const currentItem = _list[currentIndex] ? [_list[currentIndex]] : [];
        if (isOrg(dragItem)) {
          // 如果是组织需要把组织下的联系人对应的个数一起移到对应位置去
          const { len, data: dragItems } = getOrgDragData(_list, dragIndex);
          sortArr = _list.slice(dragIndex + len + 1, currentIndex);
          sortArr = [...sortArr, ...dragItems, ...currentItem];
        } else {
          sortArr = _list.slice(dragIndex + 1, currentIndex);
          sortArr = [...sortArr, dragItem, ...currentItem];
        }
        startIndex = dragIndex;
      } else {
        const dragItem = _list[dragIndex];
        if (isOrg(dragItem)) {
          // 如果是组织需要把组织下的联系人对应的个数一起移到对应位置去
          const { data: dragItems } = getOrgDragData(_list, dragIndex);
          sortArr = _list.slice(currentIndex, dragIndex);
          sortArr = [...dragItems, ...sortArr];
        } else {
          sortArr = _list.slice(currentIndex, dragIndex);
          sortArr = [dragItem, ...sortArr];
        }
        startIndex = currentIndex;
      }
      _list.splice(startIndex, sortArr.length, ...sortArr);
      setPersonalMarkOrg(_list);
      return _list;
    });
  }, []);

  const setPersonalMarkOrg = useCallback(async (list: ContactOrgItem[]) => {
    const needRequestList: { id: string; type: 1 | 2 }[] = [];
    list.forEach(item => {
      if (item) {
        if ('orgType' in item) {
          needRequestList.push({ id: item.id, type: 2 });
        } else {
          // 不需要标记分组下的个人联系人
          if (!item.renderKey) {
            needRequestList.push({ id: item.id!, type: 1 });
          }
        }
      }
    });
    const { success, msg } = await contactApi.doBatchOperatePersonalMark(needRequestList, 'add');
    if (!success && msg) {
      console.error('setPersonalMarkOrg error', msg);
    }
  }, []);

  const onSelect = useCallback((data: ContactOrgItem) => {
    if (data && 'orgType' in data) {
      const key = data.id;
      handleExpand(key);
    } else {
      onSelectItem && onSelectItem(data);
    }
  }, []);

  return (
    <>
      <ContactList
        {...props}
        data={dataList}
        onSelectItem={onSelect}
        dataChangeScrollToTop={dataChangeScrollToTop}
        onExpand={item => {
          if (item && 'orgType' in item) {
            handleExpand(item.id);
          }
        }}
        onSort={handleSort}
        expandIds={expandIds}
      />
    </>
  );
};
