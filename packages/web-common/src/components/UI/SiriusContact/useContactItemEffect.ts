import { useState, useEffect } from 'react';
import { getContactItemKey, ContactOrgItem, isOrg } from '@web-common/components/util/contact';
import { anonymousFunction } from 'api';
import { ContactItem, OrgItem } from '@web-common/utils/contact_util';

const useContactOrgItemEffect = (params: { list: ContactOrgItem[]; callback: anonymousFunction; useContactId?: boolean }) => {
  const { list, callback, useContactId } = params;
  const [lastList, setLastList] = useState<ContactOrgItem[]>([]);
  useEffect(() => {
    const contactIdSet = new Set<string>();
    const orgIdSet = new Set<string>();
    list.forEach(item => {
      if (isOrg(item)) {
        orgIdSet.add(item.id!);
      } else {
        contactIdSet.add(getContactItemKey(item as ContactItem, useContactId));
      }
    });
    const contactLastIdSet = new Set<string>();
    const orgLastIdSet = new Set<string>();
    lastList.forEach(item => {
      if (isOrg(item)) {
        orgLastIdSet.add(item.id!);
      } else {
        contactLastIdSet.add(getContactItemKey(item as ContactItem, useContactId));
      }
    });
    if (contactIdSet.size !== contactLastIdSet.size || orgIdSet.size !== orgLastIdSet.size) {
      setLastList(list);
      callback();
    } else {
      const orgHasDiff = [...orgIdSet].some(orgId => !orgLastIdSet.has(orgId));
      if (orgHasDiff) {
        setLastList(list);
        callback();
      } else {
        const contactHasDiff = [...contactIdSet].some(orgId => !contactLastIdSet.has(orgId));
        if (contactHasDiff) {
          setLastList(list);
          callback();
        }
      }
    }
  }, [list]);
};

const useContactItemEffect = (list: ContactOrgItem[], callback: anonymousFunction, useContactId?: boolean) => {
  useContactOrgItemEffect({ list, callback, useContactId });
};

export const useOrgItemEffect = (list: OrgItem[], callback: anonymousFunction) => {
  useContactOrgItemEffect({ list, callback, useContactId: false });
};

export default useContactItemEffect;
