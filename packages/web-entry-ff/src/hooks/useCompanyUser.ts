import { useEffect, useState, useCallback } from 'react';
import { apiHolder, ContactApi, EntityContact } from 'api';
import { useAppSelector } from '@web-common/state/createStore';

interface States {
  contactList: EntityContact[];
}

const contactApi = apiHolder.api.requireLogicalApi('contactApi') as ContactApi;
export function useCompanyUser(): States {
  const resourceLabel = 'SUBSCRIBE_CUSTOMER_LIST';
  const [contactList, setContactList] = useState<EntityContact[]>([]);
  const moduleAccessIds = useAppSelector(state => state.privilegeReducer.moduleAccessIds);
  const contactIds = moduleAccessIds?.[resourceLabel] || [];

  const fetchContactDetail = useCallback(async () => {
    if (!contactIds?.length) {
      return;
    }

    const res = await contactApi.doGetContactById(contactIds);
    setContactList((res || []).map(item => item.contact));
  }, [contactIds]);

  useEffect(() => {
    fetchContactDetail();
  }, [fetchContactDetail]);

  return { contactList };
}
