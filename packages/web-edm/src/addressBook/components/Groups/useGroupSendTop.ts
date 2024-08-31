import { AddressBookApi, AddressBookGroupTopParams, apiHolder, apis } from 'api';
import { useState } from 'react';

const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;

function useGroupSendTop() {
  const [isToping, setIsToping] = useState(false);
  const postGroupTop = async (params: AddressBookGroupTopParams) => {
    setIsToping(true);
    try {
      const result = await addressBookApi.postAddressBookGroupTop(params);
      setIsToping(false);
      return result;
    } catch (error) {
      setIsToping(false);
      return false;
    }
  };

  return {
    isToping,
    postGroupTop,
  };
}

export default useGroupSendTop;
