import { apis, apiHolder, AddressBookApi, AddressRepeatedAction } from 'api';
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;

export const addContact2AddressBookRequest = (contacts: any, origin: number) => {
  return addressBookApi.addContact2AddressBook({
    contactAddressInfos: contacts.map((el: any) => {
      const { info, type, name, socials = [], companyName, companySite, country, phone } = el;
      return {
        addressInfos: [
          {
            contactAddressInfo: info,
            contactAddressType: type,
            contactSourceType: Number(origin),
          },
        ],
        contactInfo: {
          companyName,
          companySite,
          country,
          tels: phone,
          contactName: name,
          snsInfos: socials.filter((el: any) => el.accountId && el.accountId.length > 0),
        },
      };
    }),
  });
};

export const getContactMergeTypeByAction = (action: AddressRepeatedAction) => {
  return {
    [AddressRepeatedAction.OVERRIDE]: 0,
    [AddressRepeatedAction.DISCARD]: 2,
    [AddressRepeatedAction.APPEND]: 1,
  }[action];
};