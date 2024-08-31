import {
  apiHolder,
  apis,
  AddressBookApi,
  IAddressBookOpenSeaDetail,
  AddressBookContact,
  AddressBookContactSourceType,
  IAddressBookContactListItem,
  AddressBookNewApi,
} from 'api';
import { getIn18Text } from 'api';
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.AddressBookNewApi) as unknown as AddressBookNewApi;

export class BatchOperate {
  private type: 'opensea' | 'address';
  private dataList: IAddressBookOpenSeaDetail[] = [];
  private total = 0;
  constructor(type: 'opensea' | 'address') {
    this.type = type;
  }

  private getAddressBookList(params: any) {
    return addressBookApi.getContacts(params).then(res => {
      this.total = res.total ?? 0;
      this.dataList = res.list ?? [];
    });
  }

  private getOpenSeaList(params: any) {
    return addressBookApi.addressBookOpenSeaList(params).then(res => {
      this.total = res.total ?? 0;
      this.dataList = res.list ?? [];
    });
  }

  getLongList(params: any) {
    if (this.type === 'opensea') {
      return this.getOpenSeaList(params);
    } else {
      return this.getAddressBookList(params);
    }
  }

  setLongList(dataList: any[], total: number) {
    this.dataList = dataList;
    this.total = total;
  }

  getOpenSeaIds() {
    if (this.type === 'opensea') {
      return this.dataList.map(each => each.id);
    }
    return [];
  }

  getAddressIds() {
    return this.dataList.map(obj => obj.addressInfo.id);
  }

  filterContacts(ids: number[]) {
    const idSets = new Set(ids);
    return this.dataList.filter(ele => {
      return idSets.has(ele.addressInfo.id);
    });
  }

  isEmpty() {
    return this.dataList.length === 0;
  }

  getContactInfos(selected: number[]) {
    const idSets = new Set(selected);
    return this.dataList
      .filter(el => {
        const { addressInfo } = el;
        if (idSets.has(addressInfo?.id)) {
          return true;
        }
        return false;
      })
      .map(el => {
        const { addressInfo, contactInfo } = el;
        return {
          ...contactInfo,
          contactName: contactInfo.contactName,
          contactEmail: addressInfo.contactAddressInfo,
          sourceName: AddressBookContactSourceType[addressInfo.contactSourceType],
        };
      });
  }

  getGroupIds(selected: number[]) {
    if (this.type === 'address') {
      return this.dataList.map(obj => obj.groupInfos).flat();
    }
    return [];
  }

  getTotal() {
    return this.total;
  }

  clear() {
    this.dataList = [];
    this.total = 0;
  }
}

export class BatchOperateNew {
  private type: 'address';
  private dataList: IAddressBookContactListItem[] = [];
  private total = 0;
  constructor(type: 'address') {
    this.type = type;
  }

  private getAddressBookList(params: any) {
    return addressBookNewApi.searchContactList(params).then(res => {
      this.total = res.totalCount ?? 0;
      this.dataList = res.list ?? [];
    });
  }

  getLongList(params: any) {
    return this.getAddressBookList(params);
  }

  setLongList(dataList: any[], total: number) {
    this.dataList = dataList;
    this.total = total;
  }

  getOpenSeaIds() {
    return [];
  }

  getAddressIds() {
    return this.dataList.map(obj => Number(obj.contactId));
  }

  filterContacts(ids: number[]) {
    const idSets = new Set(ids);
    return this.dataList.filter(ele => {
      return idSets.has(Number(ele.contactId));
    });
  }

  isEmpty() {
    return this.dataList.length === 0;
  }

  getContactInfos(selected: number[]) {
    const idSets = new Set(selected);
    return this.dataList
      .filter(el => {
        const { contactId } = el;
        if (idSets.has(Number(contactId))) {
          return true;
        }
        return false;
      })
      .map(el => {
        return {
          contactName: el.contactName,
          contactEmail: el.email,
          sourceName: el.createTypeName,
        };
      });
  }

  getGroupIds() {
    if (this.type === 'address') {
      return this.dataList.map(obj => obj.groupNames).flat();
    }
    return [];
  }

  getTotal() {
    return this.total;
  }

  clear() {
    this.dataList = [];
    this.total = 0;
  }
}

export const createMulSelectInfos = (_total: number, maxLimit?: number) => {
  let infos = [
    {
      page: 1,
      pageSize: -1,
      text: getIn18Text('currentPage'),
      type: 'origin',
      checked: false,
    },
  ];

  let index = 1;
  let total = typeof maxLimit === 'number' ? Math.min(_total, maxLimit) : _total;
  while (total > 1000) {
    infos.push({
      page: index,
      pageSize: 1000,
      text: `${getIn18Text('DI')}${(index - 1) * 1000 + 1}-${(index - 1) * 1000 + 1000}${getIn18Text('TIAO')}`,
      type: 'multi',
      checked: false,
    });
    index++;
    total = total - 1000;
  }
  if (total > 0) {
    infos.push({
      page: index,
      pageSize: 1000,
      text: `${getIn18Text('DI')}${(index - 1) * 1000 + 1}-${(index - 1) * 1000 + total}${getIn18Text('TIAO')}`,
      type: 'multi',
      checked: false,
    });
  }

  return infos;
};

export const mergeObjectByKeys = (source: AddressBookContact[], target: AddressBookContact[]) => {
  const keys = new Set(source.map(ele => ele.addressInfo.id));
  return target.reduce(
    (acc, cur) => {
      const addressId = cur?.addressInfo?.id;
      if (!keys.has(addressId)) {
        acc.push(cur);
      }
      return acc;
    },
    [...source]
  );
};

export const mergeObjectByKeysNew = (source: IAddressBookContactListItem[], target: IAddressBookContactListItem[]) => {
  const keys = new Set(source.map(ele => ele.email));
  return target.reduce(
    (acc, cur) => {
      const addressId = cur.email;
      if (!keys.has(addressId)) {
        acc.push(cur);
      }
      return acc;
    },
    [...source]
  );
};
