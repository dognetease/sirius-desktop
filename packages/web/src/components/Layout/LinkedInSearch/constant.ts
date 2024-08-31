import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';
export enum SearchType {
  company = 'company',
  person = 'person',
}

export const TAB_LIST = [
  {
    label: getTransText('searchEnterprise'),
    value: SearchType.company,
  },
  {
    label: getTransText('searchContacts'),
    value: SearchType.person,
  },
];

export enum PersonSearchType {
  product = 'product',
  company = 'company',
}

export const PersonSearchTypeList = [
  {
    label: getIn18Text('CHANPIN'),
    value: PersonSearchType.product,
    desc: getIn18Text('QINGSHURUCHANPINMINGCHENGHUOCHANPINMIAOSHU'),
  },
  {
    label: getIn18Text('GONGSI'),
    value: PersonSearchType.company,
    desc: getIn18Text('QINGSHURUGONGSIMINGCHENG'),
  },
];
