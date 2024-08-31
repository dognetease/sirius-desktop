import React from 'react';
import { AddressBookContact, IAddressBookContactListItem, api, MarktingContactGroup, AddressBookNewApi, apis, LoggerApi } from 'api';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { getIn18Text } from 'api';
import { generateLeadsContactSubFilter, SpecialFieldType, ConditionMethod, SubFilter, GroupedFilter, CommonFieldType, FieldFilter } from '@lxunit/app-l2c-crm';
import { navigate } from '@reach/router';
import qs from 'querystring';
import cloneDeep from 'lodash/cloneDeep';
import moment, { Moment } from 'moment';
import { iteratorSymbol } from 'immer/dist/internal';

const dataTrackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as LoggerApi;
const storeApi = api.getDataStoreApi();
const addressBookNewApi = api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;
const systemApi = api.getSystemApi();
const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';

// 获取地址簿批量操作联系人名称
export const getBatchOperateName = (contacts: AddressBookContact[]) => {
  if (!Array.isArray(contacts) || !contacts.length) return '';

  if (contacts.length === 1) {
    return contacts[0].addressInfo.contactAddressInfo;
  } else {
    return `${contacts.length}${getIn18Text('GELIANXIREN')}`;
  }
};

// 获取地址簿批量操作联系人名称
export const getBatchOperateNameNew = (contacts: IAddressBookContactListItem[]) => {
  if (!Array.isArray(contacts) || !contacts.length) return '';

  if (contacts.length === 1) {
    return contacts[0].email;
  } else {
    return `${contacts.length}${getIn18Text('GELIANXIREN')}`;
  }
};

// 地址簿联系人转客户联系人
export const convertToCustomerContact = (contact: AddressBookContact) => {
  const { contactInfo, addressInfo } = contact;

  const customerContact = {
    condition: 'company',
    contact_name: contactInfo.contactName,
    main_contact: false,
    email: addressInfo.contactAddressInfo,
    telephones: contactInfo.tels || [],
    social_platform: (contactInfo.snsInfos || []).map(item => ({
      type: item.type as unknown as string,
      number: item.value,
    })),
    remark: contactInfo.remark,
  };

  return customerContact;
};

// 根据地址簿联系人初始化新建客户数据
export const convertToCustomer = (contact: AddressBookContact) => {
  const { contactInfo } = contact;

  const customer = {
    name: contactInfo.companyName,
    company_name: contactInfo.companyName,
    company_domain: contactInfo.companySite,
    area: [contactInfo.continent || '', contactInfo.country || '', contactInfo.province || '', contactInfo.city || ''],
    contact_list: [convertToCustomerContact(contact)],
  };

  return customer;
};

// 根据地址簿联系人公司、官网渲染单元格
export const renderCompanyAndSiteCell = (companyName: string, companySite: string) => {
  const companySiteValid = companySite && (companySite.startsWith('https://') || companySite.startsWith('http://'));

  if (companySiteValid) {
    const text = companyName || companySite;

    return (
      <a href={companySite} target="_blank">
        <EllipsisTooltip>{text}</EllipsisTooltip>
      </a>
    );
  } else {
    return companyName ? <EllipsisTooltip>{companyName}</EllipsisTooltip> : '-';
  }
};

export const getEmailStatusText = (status: number) => {
  if (status === -1) {
    return getIn18Text('YICHANG(WEIJIANCE)');
  } else if (status === 0) {
    return getIn18Text('YICHANG(WUXIAO)');
  } else if (status === 1) {
    return getIn18Text('ZHENGCHANG');
  } else if (status === 2) {
    return getIn18Text('YICHANG(WEIZHI)');
  } else if (status === 3) {
    return getIn18Text('YICHANG(YUMINGCUOWU)');
  }
  return '-';
};

export const lastExportTimeKey = 'AddressBookLastExportTime';

export const exportDisabledFrequent = 5000;

export const setLastExportTime = (ts: number = Date.now()) => {
  storeApi.putSync(lastExportTimeKey, ts.toString());
};

export const getExportDisabledRemainTime = () => {
  let lastExportTime = storeApi.getSync(lastExportTimeKey).data;

  if (!lastExportTime) return 0;

  const remainTime = exportDisabledFrequent - (Date.now() - +lastExportTime);

  return Math.max(remainTime, 0);
};

export const addProtocol = (str: string) => {
  const hasProtocol = str.startsWith('http://') || str.startsWith('https://');

  return hasProtocol ? str : `http://${str}`;
};

export const getLinkFromStr: (str: string) => string | null = str => {
  const regex = /^(http:\/\/|https:\/\/)([a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}|[0-9]{1,3}(\.[0-9]{1,3}){3})(:[0-9]{1,5})?(\/.*)?$/;
  const link = addProtocol(str);

  return regex.test(link) ? link : null;
};

export interface IAddressBookContactsSearchParams {
  rule?: 'LIKE' | 'NOT_LIKE'; // LIKE: 包含, NOT_LIKE: 不包含
  field:
    | 'email' // 邮箱
    | 'contact_name' // 姓名
    | 'location' // 国家地区
    | 'leads_company_name' // 公司名称
    | 'contact_job' // 职位
    | 'groupName' // 分组
    | 'createSource' // 创建方式
    | 'leads_name' // 所属线索
    | 'create_time_range' // 创建时间
    | 'latest_send_time' // 营销发信状态
    | 'latest_open_time' // 营销信打开状态
    | 'latest_reply_time' // 营销信回复状态
    | 'latest_unsubscribe_time'; // 退订状态
  continent?: string; //洲
  country?: string; //国家
  groupId?: number | Array<number>; // 选择分组的id
  groupObj?: object & { group_name: string }; // 分组id对应的后端传的group对象，直接传就行
  createTypeId?: string | Array<string>; // 创建方式
  onlyNormalAddress?: boolean; // 是否过滤异常地址
  // 营销状态的筛选时间
  marketTimeFilter?:
    | 'ONE_WEEK' // 近7天
    | 'TWO_WEEK' // 近14天
    | 'ONE_MONTH' // 近30天
    | 'THREE_MONTH' // 近90天
    | 'HALF_YEAR' // 近半年
    | 'ALL'; // 全部时间
  marketStatusFilter?: string; // 已经废弃，只在【自定义快捷营销】弹窗中使用
  marketStatusYesnoFilter?: 0 | 1; // 0 未发送，未打开，未回复，未退订 1 发送过，打开过，回复过，退订过
  searchKeys?: string[] | string; // 搜索关键字
  createTimeValue?: [Moment | number, Moment | number]; // 创建时间
}

export interface ContactFilterForm {
  subs: IAddressBookContactsSearchParams[];
}

export interface ContactFilterValues {
  subs: IAddressBookContactsSearchParams[];
  relation: string;
}

export const generateAddressBookContactSearchParamsNew = (values: ContactFilterValues, filterKey: 'quickFilter' | 'grouped_filter' = 'quickFilter') => {
  const searchItems: any[] = [];

  values.subs.forEach((item: IAddressBookContactsSearchParams) => {
    const field = item.field as string;
    const containMethod = item.rule === 'LIKE' ? 'CONTAIN' : 'NOT_CONTAIN';
    if (item.searchKeys && item.searchKeys.length && field) {
      searchItems.push({
        fieldId: field,
        filter: {
          value: item.searchKeys,
          method: containMethod,
        },
      });
    }
    if (field === 'location') {
      const continent = item.continent;
      const country = item.country;
      if (continent && continent.length) {
        searchItems.push({
          fieldId: 'area',
          filter: {
            value: `${continent}/${country || ''}`,
            method: containMethod,
          },
        });
      }
    }
    if (field === 'groupName') {
      const groupId = item.groupId;
      const groupObj = item.groupObj;
      if (groupId && groupObj) {
        searchItems.push({
          fieldId: 'groups',
          filter: {
            value: [groupObj],
            method: containMethod,
          },
        });
      }
    }
    if (field === 'createSource') {
      const createTypeId = item.createTypeId;
      if (createTypeId) {
        searchItems.push({
          fieldId: 'create_type',
          filter: {
            value: [createTypeId],
            method: containMethod,
          },
        });
      }
    }
    if (['latest_send_time', 'latest_open_time', 'latest_reply_time', 'latest_unsubscribe_time'].includes(field)) {
      // 营销发信状态、营销信打开状态、营销信回复状态、退订状态
      searchItems.push({
        fieldId: 'marketing_status_time',
        filter: {
          status: field,
          value: !!item.marketStatusYesnoFilter,
          type: item.marketTimeFilter,
        },
      });
    }
    if (field === 'create_time_range' && item.createTimeValue) {
      searchItems.push({
        fieldId: field,
        filter: {
          value: `${moment(moment(item.createTimeValue[0]).format('YYYY-MM-DD')).valueOf()},${moment(moment(item.createTimeValue[1]).format('YYYY-MM-DD'))
            .endOf('day')
            .valueOf()}`,
        },
      });
    }
  });
  //@ts-ignore
  const result = generateLeadsContactSubFilter(searchItems);
  const resFilter = {
    [filterKey]: {
      relation: values.relation,
      subs: result,
    },
  };
  return resFilter;
};

export const generateAddressBookVerifyStatusParams = () => {
  const searchItems: any[] = [];
  searchItems.push({
    fieldId: 'verify_status',
    filter: {
      value: true,
    },
  });
  const result = generateLeadsContactSubFilter(searchItems);
  return result;
};

export const generateAddressBookContactTodayParams = () => {
  const searchItems: any[] = [];
  searchItems.push({
    fieldId: 'contact_today',
  });
  const result = generateLeadsContactSubFilter(searchItems);
  return result;
};

export const generateAddressBookContactSearchParams = (values: IAddressBookContactsSearchParams, filterKey: 'quickFilter' | 'grouped_filter' = 'quickFilter') => {
  const searchItems = [];

  const field = values.field as string;
  const containMethod = values.rule === 'LIKE' ? 'CONTAIN' : 'NOT_CONTAIN';

  if (values.searchKeys && values.searchKeys.length) {
    const filedMap: { [key: string]: string } = {
      contactAddressInfo: 'email',
      contactName: 'contact_name',
      companyName: 'leads_company_name',
      jobTitle: 'contact_job',
      businessClue: 'leads_name',
    };
    if (filedMap[field]) {
      searchItems.push({
        fieldId: filedMap[field],
        filter: {
          value: values.searchKeys,
          method: containMethod,
        },
      });
    }
  }

  if (field === 'location') {
    const continent = values.continent;
    const country = values.country;

    if (continent && continent.length) {
      searchItems.push({
        fieldId: 'area',
        filter: {
          value: `${continent}/${country || ''}`,
          method: containMethod,
        },
      });
    }
  }

  if (field === 'groupName') {
    const groupId = values.groupId;
    const groupObj = values.groupObj;
    if (groupId && groupObj) {
      searchItems.push({
        fieldId: 'groups',
        filter: {
          value: [groupObj],
          method: containMethod,
        },
      });
    }
  }

  if (field === 'createSource') {
    const createTypeId = values.createTypeId;
    if (createTypeId) {
      searchItems.push({
        fieldId: 'create_type',
        filter: {
          value: [createTypeId],
          method: containMethod,
        },
      });
    }
  }

  if (values.onlyNormalAddress) {
    searchItems.push({
      fieldId: 'verify_status',
      filter: {
        value: true,
      },
    });
  }

  if (typeof values.marketStatusYesnoFilter !== 'undefined' && typeof values.marketStatusFilter !== 'undefined' && typeof values.marketTimeFilter !== 'undefined') {
    searchItems.push({
      fieldId: 'marketing_status_time',
      filter: {
        status: values.marketStatusFilter,
        value: !!values.marketStatusYesnoFilter,
        type: values.marketTimeFilter,
      },
    });
  }
  //@ts-ignore
  const result = generateLeadsContactSubFilter(searchItems);
  const resFilter = {
    [filterKey]: {
      relation: 'AND',
      subs: result,
    },
  };
  return resFilter;
};

interface MarketItem {
  contactName: string;
  contactEmail: string;
}

export const getEmailMarketList = (list: Array<IAddressBookContactListItem>) => {
  let res: Array<MarketItem> = [];
  if (!list || !list.length) return res;
  const uniqueSet = new Set();
  list.forEach(item => {
    if (!uniqueSet.has(item.email)) {
      uniqueSet.add(item.email);
      res.push({
        contactName: item.contactName,
        contactEmail: item.email,
        sourceName: item.source_name,
      });
    }
  });
  return res;
};

export interface IJumpToAddressListOption {
  filter?: any;
  target?: 'overview' | 'detail';
  backUrl?: string;
  backName?: string;
  listName?: string;
  groupIds?: string[];
}

export const jumpToAddressListContactList = async (optionsIn: IJumpToAddressListOption) => {
  const options = cloneDeep(optionsIn);
  const { target = 'detail', groupIds } = options;
  let groupFilters: { subs: Array<SubFilter>; relation: 'AND' | 'OR' } = { subs: [], relation: 'AND' as const };
  if (groupIds && groupIds.length) {
    try {
      const groupList = await addressBookNewApi.getAllContactGroupList();
      const targetGroupList: Array<MarktingContactGroup> = [];
      groupIds.forEach(groupdId => {
        const targetGroup = groupList.find(group => String(group.id) === groupdId.toString());
        if (targetGroup) {
          targetGroupList.push(targetGroup);
        }
      });
      if (targetGroupList && targetGroupList.length) {
        const searchFilter = generateLeadsContactSubFilter([
          {
            fieldId: 'groups' as SpecialFieldType.Groups,
            filter: {
              value: [...targetGroupList],
              method: 'CONTAIN' as unknown as ConditionMethod,
            },
          },
        ]);
        groupFilters.subs = searchFilter;
      }
    } catch (ex) {
      console.error('getAllContactGroupList error', ex);
    }
  }
  if (groupFilters && groupFilters.subs && groupFilters.subs.length) {
    if (!options.filter) {
      options.filter = groupFilters;
    } else {
      options.filter.subs.push(...groupFilters.subs);
    }
  }
  const keyName = 'addressContactList-' + new Date().getTime();
  localStorage.setItem(keyName, JSON.stringify(options));
  const targetPage = target === 'detail' ? 'addressContactList' : 'addressBookIndex';
  navigate(`${routerWord}?page=${targetPage}&keyName=${keyName}`);
};

export const convertGroup2Filter = (group: MarktingContactGroup | undefined, restFilter?: GroupedFilter | undefined, excludeEmptyEmail?: boolean) => {
  const groupedFilter = restFilter ? cloneDeep(restFilter) : { relation: 'AND', subs: [] as SubFilter[] };

  if (group) {
    const filterArr: FieldFilter[] = [
      {
        fieldId: 'groups' as SpecialFieldType.Groups,
        filter: {
          value: [group],
          method: 'CONTAIN' as unknown as ConditionMethod,
        },
      },
    ];
    excludeEmptyEmail &&
      filterArr.push({
        fieldId: 'email' as CommonFieldType.Email,
        filter: {
          value: '',
          method: 'IS_NOT_EMPTY' as ConditionMethod,
        },
      });
    const subFilter = generateLeadsContactSubFilter(filterArr);
    groupedFilter.subs.push(...subFilter);
  }

  return groupedFilter as GroupedFilter;
};

export const recordDataTracker = (eventName: string, attrs?: Record<string, unknown>) => {
  dataTrackerApi.track(eventName, attrs);
};

export const setRefreshParams = (type: 'markting' | 'contact' | 'groups') => {
  const [page, queryString] = location.hash.split('?');

  const newQuery = { ...qs.parse(queryString), refreshkey: `${type}-${Date.now()}` };
  navigate(`${page}?${qs.stringify(newQuery)}`);
};
