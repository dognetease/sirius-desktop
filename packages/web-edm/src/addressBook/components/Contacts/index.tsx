import React, { useState, useEffect, useRef, forwardRef, useReducer } from 'react';
import classnames from 'classnames';
import { Button, Space, Menu, Dropdown, Divider, Popover, Tooltip, ConfigProvider } from 'antd';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { ColumnsType } from 'antd/lib/table';
import { SorterResult } from 'antd/lib/table/interface';
import EllipsisOutlined from '@ant-design/icons/EllipsisOutlined';
import { navigate } from '@reach/router';
import moment from 'moment';
import {
  apis,
  apiHolder,
  MailApi,
  CustomerApi,
  ICustomerContactData,
  AddressBookApi,
  AddressBookGroup,
  AddressBookFilterType,
  AddressBookContact,
  AddressBookContactAddressType,
  AddressBookContactsParams,
  AddressBookContactSourceType,
  RequestBusinessaAddCompany as CustomerType,
  SystemApi,
  urlStore,
} from 'api';
import ContactsFilter from './contactsFilter';
import EditNewClientModal from '@/components/Layout/Customer/NewClient/components/CreateNewClientModal/createNewClientModal';
import useEdmSendCount from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import CustomerPicker from '../../components/CustomerPicker';
import { TransferGroup } from '../../views/TransferGroup';
import ReturnToOpenSea from '../../components/ReturnToOpenSea';
import { ContactDetail } from '../../views/ContactDetail';
import MarketHistory from '../MarketHistory';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import EllipsisLabels from '@/components/Layout/Customer/components/ellipsisLabels/ellipsisLabels';
import NationFlag from '@/components/Layout/CustomsData/components/NationalFlag/index';
import { getBatchOperateName, convertToCustomerContact, convertToCustomer, renderCompanyAndSiteCell } from '../../utils';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { getModuleAccessSelector, getIsFreeVersionUser } from '@web-common/state/reducer/privilegeReducer';
import { useAppSelector } from '@web-common/state/createStore';
import { ReactComponent as ArrowDown } from '@/images/icons/edm/addressBook/arrow-down.svg';
import { ReactComponent as CompanySearchIcon } from '@/images/icons/edm/addressBook/company-search.svg';
import { ReactComponent as CustomerIcon } from '@/images/icons/edm/addressBook/customer-icon.svg';
import addressBookStyle from '../../addressBook.module.scss';
import style from './index.module.scss';
import { ReactComponent as EmailIcon } from '../../assets/emailIcon.svg';
import { getEmailStatusText, exportDisabledFrequent, setLastExportTime, getExportDisabledRemainTime } from '../../utils';
import UniDrawer from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import { edmDataTracker } from '../../../tracker/tracker';
import { downloadFile } from '@web-common/components/util/file';
import Table from '@/components/Layout/Customer/components/UI/Table/table';
import { BatchOperate, createMulSelectInfos, mergeObjectByKeys } from '../../batchOperate';
import '../../addressBookTableDrop.scss';
import Sorter from './sorter';
import isEqual from 'lodash/isEqual';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';
import AiMarketingEnter from '../../../components/AiMarketingEnter/aiMarketingEnter';
const batchOp = new BatchOperate('address');

const COUNTRY_MAP = require('../../views/ContactDetail/countryMap.json');
const httpApi = apiHolder.api.getDataTransApi();
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const isEdmWeb = systemApi.isWebWmEntry();
interface ContactsProps {
  data: AddressBookContact[];
  total: number;
  loading?: boolean;
  groupId?: number;
  isSystemGroup?: boolean;
  scrollHeight?: string | number;
  showSizeChanger?: boolean;
  onFetch: (type: AddressBookFilterType, params: AddressBookContactsParams) => void;
  onFetchBatchDataList: (params: AddressBookContactsParams) => Promise<{ dataList: any[]; total: number }>;
  children: (filter: React.ReactElement, operations: React.ReactElement, table: React.ReactElement) => React.ReactElement;
}
interface MarketItem {
  contactName: string;
  contactEmail: string;
}
type AddressSortValue = 'ASC' | 'DESC';
type AntdSortValue = 'ascend' | 'descend';
const ADDRESS_SORT_MAP: Record<AntdSortValue, AddressSortValue> = {
  ascend: 'ASC',
  descend: 'DESC',
};
const ANTD_SORT_MAP: Record<AddressSortValue, AntdSortValue> = {
  ASC: 'ascend',
  DESC: 'descend',
};
const defaultPagination = {
  page: 1,
  pageSize: 20,
};

// uni客户相关
type TUniDrawerState = {
  visible: boolean;
  customerType: 'addressBookNewCustomer' | 'addressBookExistedCustomer' | 'addressBookCustomerDetail';
  customerData?: CustomerType;
  customerId?: number;
  uniRecordId?: string;
};

const uniReducer = (
  state: TUniDrawerState,
  action: {
    type: 'new_customer' | 'add_customer' | 'customer_detail' | 'reset';
    payload: Partial<TUniDrawerState>;
  }
): TUniDrawerState => {
  const { type, payload = {} } = action;
  switch (type) {
    case 'add_customer':
      return {
        ...state,
        visible: true,
        customerType: 'addressBookExistedCustomer',
        customerData: payload.customerData ?? state.customerData,
        customerId: payload.customerId,
        uniRecordId: undefined,
      };
    case 'new_customer':
      return {
        ...state,
        visible: true,
        customerType: 'addressBookNewCustomer',
        customerData: payload.customerData ?? state.customerData,
        customerId: undefined,
        uniRecordId: undefined,
      };
    case 'customer_detail':
      return {
        ...state,
        visible: true,
        customerType: 'addressBookCustomerDetail',
        customerData: undefined,
        customerId: payload.customerId,
        uniRecordId: payload.uniRecordId,
      };
    case 'reset':
      return {
        ...state,
        visible: false,
        customerType: 'addressBookNewCustomer',
        customerData: undefined,
        customerId: undefined,
        uniRecordId: undefined,
      };
  }
};
const uniInitState: TUniDrawerState = {
  visible: false,
  customerType: 'addressBookNewCustomer',
};

const covert2CustomerData = (contacts: AddressBookContact[]): CustomerType => {
  const contact = contacts[0];
  const { contactInfo } = contact;
  const socialMediaMap: any = {
    2: 'Facebook',
    3: 'LinkedIn',
    4: 'Youtube',
    5: 'Twitter',
    6: 'Instagram',
  };
  console.error(contacts, 'kkk');
  const customer: CustomerType = {
    company_name: contactInfo.companyName,
    company_domain: contactInfo.companySite,
    area: [contactInfo.continent || '', contactInfo.country || '', contactInfo.province || '', contactInfo.city || ''],
    contact_list: contacts.map(ele => {
      const { contactInfo, addressInfo } = ele;
      return {
        condition: 'company',
        contact_name: contactInfo.contactName,
        main_contact: false,
        email: addressInfo.contactAddressInfo,
        telephones: contactInfo.tels || [],
        social_platform_new: (contactInfo.snsInfos || [])
          .map(item => {
            const { type, accountId } = item;
            return socialMediaMap[type] + ':' + accountId;
          })
          .join(';'),
        remark: contactInfo.remark,
      };
    }),
  };
  return customer;
};

const getNextSort = (sorter: SorterResult<AddressBookContact> | SorterResult<AddressBookContact>[]) => {
  if (!Array.isArray(sorter)) {
    const { field, order } = sorter;
    if (order) {
      let nextSort = {
        direction: '',
        field: '',
      };
      nextSort.direction = ADDRESS_SORT_MAP[order];
      if (typeof field === 'string') {
        nextSort.field = field;
      }
      if (Array.isArray(field) && field.length > 0) {
        nextSort.field = field[field.length - 1];
      }
      if (nextSort.direction && nextSort.field) {
        return nextSort;
      }
    }
  }
  return undefined;
};
const Contacts = forwardRef((props: ContactsProps, refFromProps) => {
  const { data, total, loading, groupId, isSystemGroup, scrollHeight, showSizeChanger = true, onFetch, onFetchBatchDataList, children } = props;
  const hasOp = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'ADDRESS_BOOK', 'OP'));
  const hasDelete = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'ADDRESS_BOOK', 'DELETE'));
  const [params, setParams] = useState<AddressBookContactsParams>({
    contactAddressType: AddressBookContactAddressType.EMAIL,
    ...defaultPagination,
    sort: undefined,
    searchParam: undefined,
  });
  // 手动触发过滤器更新;
  const triggerFetch = () => setParams({ ...params });
  // 手动触发过滤器更新 (回到第 1 页);
  const triggerFetchFirstPage = () => setParams({ ...params, ...{ page: 1 } });
  const contactsRef = useRef<any>(null);
  const ref = (refFromProps || contactsRef) as React.RefObject<any>;
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [marketList, setMarketList] = useState<MarketItem[]>([]);
  const [aiMarketingContacts, setAiMarketingContacts] = useState<MarketItem[]>([]);
  useEdmSendCount(marketList, undefined, undefined, undefined, undefined, 'addressBook');
  const cachedData = useRef<Record<number, AddressBookContact>>({});
  const hasSelectedRowKeys = !!selectedRowKeys.length;
  const selectedContacts = selectedRowKeys.map(key => cachedData.current[key]).filter(item => item);
  // const [createCustomerVisible, setCreateCustomerVisible] = useState<boolean>(false);
  // const [createCustomerData, setCreateCustomerData] = useState<CustomerType | null>(null);
  const [customerPickerVisible, setCustomerPickerVisible] = useState<boolean>(false);
  const [addToCustomerVisible, setAddToCustomerVisible] = useState<boolean>(false);
  const [addToCustomerCompanyId, setAddToCustomerCompanyId] = useState<string>('');
  const [addToCustomerContacts, setAddToCustomerContacts] = useState<AddressBookContact[]>([]);
  const [addToGroupVisible, setAddToGroupVisible] = useState<boolean>(false);
  const [addToGroupContacts, setAddToGroupContacts] = useState<AddressBookContact[]>([]);
  const [addToGroupAddressIds, setAddToGroupAddressIds] = useState<number[]>([]);
  const [addToGroupOriginGroups, setAddToGroupOriginGroups] = useState<string[]>([]);
  const [transToGroupVisible, setTransToGroupVisible] = useState<boolean>(false);
  const [transToGroupContacts, setTransToGroupContacts] = useState<AddressBookContact[]>([]);
  const [transToGroupAddressIds, setTransToGroupAddressIds] = useState<number[]>([]);
  const [transToGroupOriginGroups, setTransToGroupOriginGroups] = useState<string[]>([]);
  const [returnToOpenSeaVisible, setReturnToOpenSeaVisible] = useState<boolean>(false);
  const [returnToOpenSeaContacts, setReturnToOpenSeaContacts] = useState<AddressBookContact[]>([]);
  const [returnToOpenSeaAddressIds, setReturnToOpenSeaAddressIds] = useState<number[]>([]);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [detailContactId, setDetailContactId] = useState<number | null>(null);
  const [detailAddressId, setDetailAddressId] = useState<number | null>(null);

  const [uniDrawerState, uniDrawerDispatch] = useReducer(uniReducer, uniInitState);

  const [batchLoading, setBatchLoading] = useState(false);
  const [mulSelectMenu, setMulSelectMenu] = useState<ReturnType<typeof createMulSelectInfos>>([]);
  const [isBatchOp, setIsBatchOp] = useState(false);

  const resetUniDrawer = () => {
    uniDrawerDispatch({
      type: 'reset',
      payload: {
        visible: false,
      },
    });
  };
  const sendTrackerData = (action: string) => {
    edmDataTracker.track('waimao_address_book_contacts', {
      action,
    });
  };

  const [exportDisabled, setExportDisabled] = useState(false);

  const exportDisabledTimer = useRef<null | NodeJS.Timer>(null);

  useEffect(() => {
    const exportDisabledRemainTime = getExportDisabledRemainTime();

    if (exportDisabledRemainTime) {
      setExportDisabled(true);

      exportDisabledTimer.current = setTimeout(() => {
        setExportDisabled(false);
      }, exportDisabledRemainTime);
    }

    return () => {
      exportDisabledTimer.current && clearTimeout(exportDisabledTimer.current);
    };
  }, []);

  useEffect(() => {
    const nextMarketList = filterSelectedContacts();
    setAiMarketingContacts(nextMarketList);
  }, [selectedRowKeys]);

  useEffect(() => {
    data.forEach(item => {
      cachedData.current[item.addressInfo.id] = item;
    });
  }, [data]);

  useEffect(() => {
    const r = createMulSelectInfos(total);
    setMulSelectMenu(r);
  }, [total, data]);
  const handleDetailNavigate = (item: AddressBookContact) => {
    setDetailContactId(item.contactInfo.id);
    setDetailAddressId(item.addressInfo.id);
    setDetailVisible(true);
  };
  const filterSelectedContacts = () => {
    const nextMarketList = selectedContacts.map(contact => {
      const { contactInfo, addressInfo } = contact;
      return {
        ...contactInfo,
        contactName: contactInfo.contactName,
        contactEmail: addressInfo.contactAddressInfo,
        sourceName: AddressBookContactSourceType[addressInfo.contactSourceType],
      };
    });
    let marketList: any[] = [];
    if (batchOp.isEmpty()) {
      marketList = nextMarketList;
    } else {
      const uniqueSet = new Set();
      nextMarketList.forEach(item => {
        uniqueSet.add(item.contactEmail);
        marketList.push(item);
      });
      batchOp.getContactInfos(selectedRowKeys).forEach(item => {
        if (!uniqueSet.has(item.contactEmail)) {
          marketList.push(item);
        }
      });
    }
    return marketList as MarketItem[];
  };
  const handleMarket = () => {
    const nextMarketList = filterSelectedContacts();
    setMarketList(nextMarketList);
  };
  const handleCreateToCustomer = (contacts: AddressBookContact[]) => {
    const contactsNotInCustomer = contacts.filter(item => !item.customerInfo?.uniCustomerId);

    if (contactsNotInCustomer.length) {
      const filteredCount = contacts.length - contactsNotInCustomer.length;
      if (filteredCount) {
        Message.info({ content: `已过滤${filteredCount}个已关联客户的联系人` });
      }
      // 基于邮箱去重
      const emailSets = new Set<string>();
      let uniqueContacts: AddressBookContact[] = [];
      for (const ele of contactsNotInCustomer) {
        const { addressInfo } = ele;
        const email = addressInfo.contactAddressInfo;
        if (!emailSets.has(email)) {
          emailSets.add(email);
          if (ele.contactInfo === undefined) {
            ele.contactInfo = {};
          }
          uniqueContacts.push(ele);
        }
      }
      // 如果新建到客户的数量高于200则展示toast
      if (uniqueContacts.length > 200) {
        Message.warn(getTransText('ZUIDUOZHICHITONGSHI'));
        uniqueContacts = uniqueContacts.slice(0, 200);
      }
      uniDrawerDispatch({
        type: 'new_customer',
        payload: {
          customerId: undefined,
          customerData: covert2CustomerData(uniqueContacts),
        },
      });
    } else {
      Message.success({ content: getTransText('SUOXUANLIANXIRENJUNYIGUANLIANGUOKEHU') });
    }

    // const customerData = covert2CustomerData(contacts) as CustomerType;
    // uniDrawerDispatch({
    //   type: 'new_customer',
    //   payload: {
    //     customerData
    //   }
    // });
  };
  const handleAddToCustomer = (contacts: AddressBookContact[]) => {
    const contactsNotInCustomer = contacts.filter(item => !item.customerInfo?.uniCustomerId);

    if (contactsNotInCustomer.length) {
      const filteredCount = contacts.length - contactsNotInCustomer.length;
      if (filteredCount) {
        Message.info({ content: `已过滤${filteredCount}个已关联客户的联系人` });
      }
      setCustomerPickerVisible(true);
      setAddToCustomerContacts(contactsNotInCustomer);
    } else {
      Message.success({ content: getTransText('SUOXUANLIANXIRENJUNYIGUANLIANGUOKEHU') });
    }
  };
  const handleAddToGroup = (contacts: AddressBookContact[]) => {
    // const originGroupsMap = contacts.reduce<Record<string, 1>>((accumulator, contact) => {
    //     contact.groupInfos.forEach(({ groupName }) => {
    //         accumulator[groupName] = 1;
    //     });
    //     return accumulator;
    // }, {});
    // const originGroups = Object.keys(originGroupsMap);
    setAddToGroupVisible(true);
    setAddToGroupContacts(contacts);
    setAddToGroupAddressIds(contacts.map(item => item.addressInfo.id));
    // setAddToGroupOriginGroups(originGroups);
  };
  const handleTransToGroup = (contacts: AddressBookContact[]) => {
    const originGroupsMap = contacts.reduce<Record<string, 1>>((accumulator, contact) => {
      contact.groupInfos.forEach(({ groupName }) => {
        accumulator[groupName] = 1;
      });
      return accumulator;
    }, {});
    const originGroups = Object.keys(originGroupsMap);
    setTransToGroupVisible(true);
    setTransToGroupContacts(contacts);
    setTransToGroupAddressIds(contacts.map(item => item.addressInfo.id));
    setTransToGroupOriginGroups(originGroups);
  };
  const removeIdsFromSelectedRowKeys = (ids: number[]) => {
    setSelectedRowKeys(selectedRowKeys.filter(id => !ids.includes(id)));
  };
  const handleContactsDelete = (contacts: AddressBookContact[]) => {
    const addressIds = contacts.map(contact => contact.addressInfo.id);
    const batchOperateName = getBatchOperateName(contacts);
    Modal.confirm({
      title: `确定删除${batchOperateName}到 [回收站] ？`,
      content: '可至 [回收站] 可还原已删除联系人，进入 [回收站] 超过30天，将彻底清除无法还原',
      onOk: () =>
        addressBookApi.deleteContacts({ ids: addressIds }).then(() => {
          triggerFetchFirstPage();
          removeIdsFromSelectedRowKeys(addressIds);
          Message.success({ content: `已删除${batchOperateName}到 [回收站]` });
        }),
    });
  };
  const handleReturnToOpenSea = (contacts: AddressBookContact[]) => {
    const addressIds = contacts.map(contact => contact.addressInfo.id);
    setReturnToOpenSeaVisible(true);
    setReturnToOpenSeaContacts(contacts);
    setReturnToOpenSeaAddressIds(addressIds);
  };
  const handleRemoveFromGroup = (contacts: AddressBookContact[]) => {
    const addressIds = contacts.map(contact => contact.addressInfo.id);
    if (!groupId) {
      Message.error({ content: getIn18Text('DANGQIANYEMIANBUCUNZAISHANGCENGFENZU') });
    } else {
      Modal.confirm({
        title: `确定将 [${getBatchOperateName(contacts)}] 移出分组？`,
        content: '若联系人无其他分组，则自动进入 [未分组] 中',
        onOk: () =>
          addressBookApi
            .removeContactsFromGroup({
              groupIds: [groupId],
              addressIds,
            })
            .then(() => {
              triggerFetchFirstPage();
              removeIdsFromSelectedRowKeys(addressIds);
              Message.success({ content: getIn18Text('YICHUCHENGGONG2') });
            }),
      });
    }
  };
  const handleMoveToBlacklist = (contacts: AddressBookContact[]) => {
    const addressIds = contacts.map(contact => contact.addressInfo.id);
    const contact_list = contacts.map(contact => ({
      contact_name: contact.contactInfo.contactName,
      company_name: contact.contactInfo.companyName,
      email: contact.addressInfo.contactAddressInfo,
    })) as ICustomerContactData[];
    Modal.confirm({
      title: `确定转移${getBatchOperateName(contacts)}至黑名单？`,
      content: getIn18Text('LIANXIRENJIANGZHUANYIZHIHEIMINGDAN'),
      onOk: () =>
        addressBookApi
          .addEdmBlacklist({ contact_list })
          .then(() => addressBookApi.deleteContacts({ ids: addressIds }))
          .then(() => {
            const content = (
              <>
                {getIn18Text('YIJIANG')}
                {getBatchOperateName(contacts)}转移至[黑名单]
                <a
                  style={{ marginLeft: 74 }}
                  onClick={() => {
                    navigate('#edm?page=addressBookIndex&defaultTabKey=blacklist');
                    Message.destroy();
                  }}
                >
                  {getIn18Text('CHAKANHEIMINGDAN')}
                </a>
              </>
            );
            triggerFetchFirstPage();
            removeIdsFromSelectedRowKeys(addressIds);
            Message.success({ content, duration: 5 });
          }),
    });
  };
  const isFreeVersionUser = useAppSelector(state => getIsFreeVersionUser(state.privilegeReducer));
  const hasExport = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'ADDRESS_BOOK', 'EXPORT'));
  const handleContactsExport = (addressIds: number[]) => {
    setLastExportTime();
    setExportDisabled(true);

    exportDisabledTimer.current = setTimeout(() => {
      setExportDisabled(false);
    }, exportDisabledFrequent);

    addressBookApi.exportContactsCheck({ addressIds }).then(({ isAsync }) => {
      if (isAsync) {
        Message.open({ content: getTransText('SHUJUZHENGZAIDAOCHU，DAOCHUWANCHENGHUIFASONGXIAOXITONGZHI') });
      } else {
        const url = urlStore.get('addressBookExportContactsUrl') as string;

        httpApi
          .post(
            url,
            { addressIds },
            {
              responseType: 'blob',
              contentType: 'json',
            }
          )
          .then(res => {
            const blob = res.rawData;
            const fileName = `地址簿导出联系人-${new Date().toLocaleString()}.xlsx`;

            downloadFile(blob, fileName);
          });
      }
    });
  };
  useEffect(() => {
    onFetch(filterTypeRef.current, params);
  }, [params]);
  const columns: ColumnsType<AddressBookContact> = [
    {
      title: getIn18Text('LIANXIFANGSHI'),
      fixed: 'left',
      width: 150,
      dataIndex: ['addressInfo', 'contactAddressInfo'],
      className: classnames(style.minWidthCell, style.maxWidthCell, style.oneIndex),
      render: (text: string, item: AddressBookContact) => {
        const countryInEnglish: string | undefined = COUNTRY_MAP[item?.contactInfo?.country];
        const flag = countryInEnglish && (
          <span>
            <NationFlag style={{ marginLeft: 4, flexShrink: 0 }} name={countryInEnglish} showLabel={false} />
          </span>
        );
        const uniCustomerId = item.customerInfo?.uniCustomerId;
        return (
          <div
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <EllipsisTooltip>
              <a
                onClick={() => {
                  handleDetailNavigate(item);
                  sendTrackerData('detail');
                }}
              >
                {text}
              </a>
            </EllipsisTooltip>
            {flag}
            {uniCustomerId && (
              <Tooltip title={getIn18Text('CHAKANKEHU')}>
                <CustomerIcon
                  style={{
                    flexShrink: 0,
                    marginLeft: 4,
                    marginTop: 1,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    uniDrawerDispatch({
                      type: 'customer_detail',
                      payload: {
                        customerId: uniCustomerId as any as number,
                      },
                    });
                  }}
                />
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: getIn18Text('XINGMING'),
      dataIndex: ['contactInfo', 'contactName'],
      width: 150,
      className: classnames(style.minWidthCell, style.maxWidthCell),
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('SUOSHUFENZU'),
      dataIndex: 'groupInfos',
      width: 120,
      className: style.minWidthCell,
      render: (groupInfos: AddressBookGroup[]) => {
        if (!Array.isArray(groupInfos) || !groupInfos.length) return '-';
        return (
          <EllipsisLabels
            list={groupInfos.map(
              item =>
                ({
                  label_id: item.groupId,
                  label_name: item.groupName,
                } as any)
            )}
            // randomColor
            labelMaxWidth={70}
            renderEllipsisByLabel
            clickable
            onClickLabel={groupId => {
              const group = groupInfos.find(item => item.groupId === +groupId);

              if (group) {
                navigate(`#edm?page=addressBookGroupDetail&groupId=${groupId}&groupType=${group.groupType}`);
              }
            }}
          />
        );
      },
    },
    {
      title: getIn18Text('YINGXIAOLISHI'),
      width: 120,
      dataIndex: 'marketingInfo',
      render: (text: string, item: AddressBookContact) => {
        if (!item.marketingInfo) return getIn18Text('WEIFAXIN');
        return (
          <Popover
            trigger="click"
            placement="bottomLeft"
            destroyTooltipOnHide
            content={<MarketHistory style={{ width: 600, padding: 20 }} contactEmail={item.addressInfo.contactAddressInfo} />}
          >
            <a>{getIn18Text('CHAKAN')}</a>
          </Popover>
        );
      },
    },
    {
      title: getIn18Text('GONGSI'),
      dataIndex: 'companyName',
      width: 200,
      className: classnames(style.minWidthCell, style.maxWidthCell, style.companyNameCell),
      render: (text: string, item: AddressBookContact) => {
        const { companyName } = item.contactInfo ?? {};

        return companyName ? (
          <div style={{ display: 'inline-flex', maxWidth: '100%', alignItems: 'center', margin: '-3px 0' }}>
            <EllipsisTooltip>{companyName}</EllipsisTooltip>
            <Tooltip title={getIn18Text('ANGONGSIMINGCHENGSHAIXUAN')}>
              <span className={style.companySearchIconWrapper} onClick={() => ref.current?.searchByCompanyName(companyName)}>
                <CompanySearchIcon className={style.companySearchIcon} />
              </span>
            </Tooltip>
          </div>
        ) : (
          '-'
        );
      },
    },
    {
      title: getIn18Text('GUANWANG'),
      dataIndex: 'companySite',
      width: 100,
      className: classnames(style.minWidthCell, style.maxWidthCell),
      render: (text: string, item: AddressBookContact) => {
        const { companySite } = item.contactInfo ?? {};
        const companySiteValid = companySite && (companySite.startsWith('https://') || companySite.startsWith('http://'));

        return companySiteValid ? (
          <a href={companySite} target="_blank">
            <EllipsisTooltip>{companySite}</EllipsisTooltip>
          </a>
        ) : companySite ? (
          <EllipsisTooltip>{companySite}</EllipsisTooltip>
        ) : (
          '-'
        );
      },
    },
    {
      title: getIn18Text('ZHIWEI'),
      dataIndex: 'jobTitle',
      width: 200,
      className: classnames(style.minWidthCell, style.maxWidthCell, style.companyNameCell),
      render: (text: string, item: AddressBookContact) => {
        const { jobTitle } = item.contactInfo ?? {};

        return jobTitle ? (
          <div style={{ display: 'inline-flex', maxWidth: '100%', alignItems: 'center', margin: '-3px 0' }}>
            <EllipsisTooltip>{jobTitle}</EllipsisTooltip>
            <Tooltip title={getIn18Text('ANZHIWEISHAIXUAN')}>
              <span className={style.companySearchIconWrapper} onClick={() => ref.current?.searchByJobTitle(jobTitle)}>
                <CompanySearchIcon className={style.companySearchIcon} />
              </span>
            </Tooltip>
          </div>
        ) : (
          '-'
        );
      },
    },
    {
      title: getIn18Text('CHUANGJIANFANGSHI'),
      dataIndex: ['addressInfo', 'contactSourceType'],
      width: 150,
      render: (value: number) => AddressBookContactSourceType[value] || '-',
    },
    {
      title: (
        <div>
          <span>{getIn18Text('YOUXIANGZHUANGTAI')}</span>
          <Tooltip placement="top" title={getIn18Text('addressBookEmialStatusTip')}>
            <QuestionCircleOutlined />
          </Tooltip>
        </div>
      ),
      dataIndex: ['addressInfo', 'verifyStatus'],
      className: classnames(style.minWidthCell, style.maxWidthCell),
      width: 150,
      render(type: number) {
        return getEmailStatusText(type);
      },
    },
    {
      title: getIn18Text('CHUANGJIANRIQI'),
      sorter: false,
      sortOrder: params.sort?.field === 'createTime' ? ANTD_SORT_MAP[params.sort?.direction as AddressSortValue] : undefined,
      dataIndex: ['addressInfo', 'createTime'],
      width: 200,
      render: (timestamp: number) => (timestamp ? moment(timestamp).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: getIn18Text('ZUIHOUFASONGSHIJIAN'),
      sorter: false,
      sortOrder: params.sort?.field === 'latestSendTime' ? ANTD_SORT_MAP[params.sort?.direction as AddressSortValue] : undefined,
      width: 200,
      dataIndex: ['marketingInfo', 'latestSendTime'],
      // render: (timestamp: number) => timestamp ? moment(timestamp).format('YYYY-MM-DD HH:mm:ss') : '-',
      render: (_, record) => {
        const marketInfo = record.marketingInfo ?? {
          latestSendTime: null,
        };
        const timestamp = marketInfo.latestSendTime;
        return timestamp ? moment(timestamp).format('YYYY-MM-DD HH:mm') : '-';
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      fixed: 'right',
      dataIndex: 'operations',
      className: style.operate,
      render: (text: string, item: AddressBookContact) => {
        const notInCustomer = !item.customerInfo?.uniCustomerId;
        return (
          <Space size={16}>
            <a onClick={() => handleDetailNavigate(item)}>{getIn18Text('XIANGQING')}</a>
            {(hasOp || hasDelete) && (
              <Dropdown
                overlayClassName="address_contact_dropdown"
                overlay={
                  <Menu>
                    <PrivilegeCheck accessLabel="OP" resourceLabel="CHANNEL">
                      <Menu.Item onClick={() => mailApi.doWriteMailToContact([item.addressInfo.contactAddressInfo])}>{getIn18Text('XIEXIN')}</Menu.Item>
                      <Divider style={{ margin: 4, width: 'auto', minWidth: 'auto' }} />
                      {/* uni邀测修改 */}
                      {notInCustomer && (
                        <>
                          <Menu.Item
                            onClick={() => {
                              handleCreateToCustomer([item]);
                              sendTrackerData('new_customer');
                            }}
                          >
                            {getIn18Text('XINJIANKEHU')}
                          </Menu.Item>
                          {/* uni邀测修改 */}
                          <Menu.Item
                            onClick={() => {
                              handleAddToCustomer([item]);
                              setIsBatchOp(false);
                              sendTrackerData('addto_customer');
                            }}
                          >
                            {getIn18Text('TIANJIAZHIXIANYOUKEHU')}
                          </Menu.Item>
                        </>
                      )}
                      <Menu.Item
                        onClick={() => {
                          handleReturnToOpenSea([item]);
                          setIsBatchOp(false);
                          sendTrackerData('backto_sea');
                        }}
                      >
                        {getIn18Text('TUIHUIGONGHAI')}
                      </Menu.Item>
                      <Divider style={{ margin: 4, width: 'auto', minWidth: 'auto' }} />
                      {groupId && !isSystemGroup && <Menu.Item onClick={() => handleRemoveFromGroup([item])}>{getIn18Text('YICHUFENZU')}</Menu.Item>}
                      <Menu.Item
                        onClick={() => {
                          sendTrackerData('addto_group');
                          setIsBatchOp(false);
                          handleAddToGroup([item]);
                        }}
                      >
                        {getIn18Text('TIANJIAZHIFENZU')}
                      </Menu.Item>
                      <Menu.Item
                        onClick={() => {
                          sendTrackerData('transferto_group');
                          setIsBatchOp(false);
                          handleTransToGroup([item]);
                        }}
                      >
                        {getIn18Text('ZHUANYIZHIFENZU')}
                      </Menu.Item>
                    </PrivilegeCheck>
                    <PrivilegeCheck accessLabel="DELETE" resourceLabel="CHANNEL">
                      <Menu.Item
                        onClick={() => {
                          sendTrackerData('transferto_blacklist');
                          setIsBatchOp(false);
                          handleMoveToBlacklist([item]);
                        }}
                      >
                        {getIn18Text('ZHUANYIZHIHEIMINGDAN')}
                      </Menu.Item>
                      <Menu.Item
                        danger
                        onClick={() => {
                          sendTrackerData('delete_contact');
                          setIsBatchOp(false);
                          handleContactsDelete([item]);
                        }}
                      >
                        {getIn18Text('SHANCHULIANXIREN')}
                      </Menu.Item>
                    </PrivilegeCheck>
                  </Menu>
                }
                placement="bottomRight"
              >
                <a onClick={e => e.preventDefault()}>
                  {getIn18Text('GENGDUO')}
                  <ArrowDown style={{ marginBottom: -3 }} />
                </a>
              </Dropdown>
            )}
          </Space>
        );
      },
    },
  ];
  columns.forEach(item => {
    item.shouldCellUpdate = (record, prevRecord) => {
      if (item.fixed === 'left') return true;

      return !isEqual(record, prevRecord);
    };
  });
  const filterTypeRef = useRef<AddressBookFilterType>('ordinary');
  const filter = (
    <ContactsFilter
      ref={ref}
      dataTrackerKey={{
        filter: 'waimao_address_book_filter',
        advancedFilter: 'waimao_address_book_advanced_filter',
      }}
      enableFilterAbnormalEmailBox={true}
      onChange={(type: AddressBookFilterType, filters: Omit<AddressBookContactsParams, 'contactAddressType' | 'page' | 'pageSize'>) => {
        filterTypeRef.current = type;
        setParams({
          ...params,
          ...defaultPagination,
          sort: undefined,
          ...filters,
        });
      }}
    />
  );
  const operations = (
    <Space className={style.operations}>
      {hasSelectedRowKeys && (
        <span>
          {getIn18Text('YIXUAN')}
          {selectedRowKeys.length}
        </span>
      )}
      <AiMarketingEnter
        btnType="menu"
        contacts={aiMarketingContacts}
        needDisable={!hasSelectedRowKeys}
        dropdownClick={handleMarket}
        from="addressBook"
        back={isEdmWeb ? '#intelliMarketing?page=addressBookIndex' : '#edm?page=addressBookIndex'}
        needFilter={true}
        trackFrom="addressHost"
      />
      {hasSelectedRowKeys && (
        <>
          <PrivilegeCheck accessLabel="OP" resourceLabel="ADDRESS_BOOK">
            <Button
              onClick={() => {
                const contacts = batchOp.filterContacts(selectedRowKeys);
                setIsBatchOp(true);
                handleAddToGroup(mergeObjectByKeys(contacts, selectedContacts));
              }}
            >
              {getIn18Text('TIANJIAZHIFENZU')}
            </Button>
          </PrivilegeCheck>
          {(hasOp || hasDelete) && (
            <Dropdown
              overlayClassName="address_contact_dropdown"
              overlay={
                <Menu>
                  <PrivilegeCheck accessLabel="OP" resourceLabel="ADDRESS_BOOK">
                    {/* uni邀测修改 */}
                    <Menu.Item
                      onClick={() => {
                        const contacts = batchOp.filterContacts(selectedRowKeys);
                        setIsBatchOp(true);
                        handleCreateToCustomer(mergeObjectByKeys(contacts, selectedContacts));
                      }}
                    >
                      {getIn18Text('XINJIANKEHU')}
                    </Menu.Item>
                    <Menu.Item
                      onClick={() => {
                        const contacts = batchOp.filterContacts(selectedRowKeys);
                        setIsBatchOp(true);
                        handleAddToCustomer(mergeObjectByKeys(contacts, selectedContacts));
                      }}
                    >
                      {getIn18Text('TIANJIAZHIXIANYOUKEHU')}
                    </Menu.Item>
                    <Menu.Item
                      onClick={() => {
                        const contacts = batchOp.filterContacts(selectedRowKeys);
                        setIsBatchOp(true);
                        handleReturnToOpenSea(mergeObjectByKeys(contacts, selectedContacts));
                      }}
                    >
                      {getIn18Text('TUIHUIGONGHAI')}
                    </Menu.Item>
                    <Divider style={{ margin: 4, width: 'auto', minWidth: 'auto' }} />
                    {groupId && !isSystemGroup && <Menu.Item onClick={() => handleRemoveFromGroup(selectedContacts)}>{getIn18Text('YICHUFENZU')}</Menu.Item>}
                    <Menu.Item
                      onClick={() => {
                        const contacts = batchOp.filterContacts(selectedRowKeys);
                        setIsBatchOp(true);
                        handleTransToGroup(mergeObjectByKeys(contacts, selectedContacts));
                      }}
                    >
                      {getIn18Text('ZHUANYIZHIFENZU')}
                    </Menu.Item>
                  </PrivilegeCheck>
                  <PrivilegeCheck accessLabel="DELETE" resourceLabel="ADDRESS_BOOK">
                    <Menu.Item
                      onClick={() => {
                        const contacts = batchOp.filterContacts(selectedRowKeys);
                        setIsBatchOp(true);
                        handleMoveToBlacklist(mergeObjectByKeys(contacts, selectedContacts));
                      }}
                    >
                      {getIn18Text('ZHUANYIZHIHEIMINGDAN')}
                    </Menu.Item>
                  </PrivilegeCheck>
                  {(isFreeVersionUser || hasExport) && (
                    <Menu.Item disabled={exportDisabled} onClick={() => handleContactsExport(selectedRowKeys)}>
                      {getIn18Text('DAOCHU')}
                    </Menu.Item>
                  )}
                  <PrivilegeCheck accessLabel="DELETE" resourceLabel="ADDRESS_BOOK">
                    <Menu.Item
                      danger
                      onClick={() => {
                        const contacts = batchOp.filterContacts(selectedRowKeys);
                        setIsBatchOp(true);
                        handleContactsDelete(mergeObjectByKeys(contacts, selectedContacts));
                      }}
                    >
                      {getIn18Text('PILIANGSHANCHU')}
                    </Menu.Item>
                  </PrivilegeCheck>
                </Menu>
              }
            >
              <Button style={{ minWidth: 'auto', padding: '2.4px 0' }} icon={<EllipsisOutlined />} />
            </Dropdown>
          )}
        </>
      )}
      <Sorter
        value={params.sort}
        onChange={nextSort => {
          batchOp.clear();
          setSelectedRowKeys([]);
          setParams({
            ...params,
            sort: nextSort,
            page: 1,
          });
        }}
      />
    </Space>
  );
  const table = (
    <ConfigProvider prefixCls="__address_antd_dropdown ant">
      <Table<AddressBookContact>
        className={classnames(style.table, addressBookStyle.table)}
        scroll={{ x: 'max-content', y: scrollHeight }}
        columns={columns}
        loading={loading || batchLoading}
        dataSource={data}
        pagination={{
          className: 'pagination-wrap',
          size: 'small',
          total,
          current: params.page,
          pageSize: params.pageSize,
          pageSizeOptions: ['20', '50', '100'],
          showSizeChanger,
          showQuickJumper: true,
          showTotal: (total: number) => (
            <span style={{ position: 'absolute', left: 0 }}>
              {getIn18Text('GONG')}
              {total}
              {getIn18Text('GELIANXIREN')}
            </span>
          ),
        }}
        onChange={(pagination, _: any, sorter: SorterResult<AddressBookContact> | SorterResult<AddressBookContact>[]) => {
          // const nextSort = getNextSort(sorter);
          setParams(previous => ({
            ...previous,
            pageSize: pagination.pageSize as number,
            page: pagination.pageSize === previous.pageSize ? (pagination.current as number) : 1,
            // sort: nextSort,
          }));
        }}
        rowKey={item => item.addressInfo.id}
        rowSelection={{
          fixed: true,
          selectedRowKeys,
          preserveSelectedRowKeys: true,
          selections: mulSelectMenu.map((ele, index) => {
            return {
              key: ele.text,
              // text: (<div style={{
              //   background: ele.checked ? '#F2F5FF' : index % 2 === 0 ? '#fff' : '#F6F7FA'
              // }}>
              //   {ele.text}
              // </div>),
              text: ele.text,
              onSelect: (changableRows: number[]) => {
                // 清空
                if (ele.checked) {
                  batchOp.clear();
                  setSelectedRowKeys([]);
                  setMulSelectMenu(pre => {
                    return pre.map(each => {
                      if (ele.text === each.text) {
                        return {
                          ...each,
                          checked: !each.checked,
                        };
                      }
                      return {
                        ...each,
                        checked: false,
                      };
                    });
                  });
                } else {
                  setBatchLoading(true);
                  onFetchBatchDataList({
                    ...params,
                    page: ele.type === 'origin' ? params.page : ele.page,
                    pageSize: ele.type === 'origin' ? params.pageSize : ele.pageSize,
                  })
                    .then(({ dataList, total }) => {
                      batchOp.setLongList(dataList, total);
                      setSelectedRowKeys(batchOp.getAddressIds());
                      setMulSelectMenu(pre => {
                        return pre.map(each => {
                          if (ele.text === each.text) {
                            return {
                              ...each,
                              checked: !each.checked,
                            };
                          }
                          return {
                            ...each,
                            checked: false,
                          };
                        });
                      });
                    })
                    .finally(() => {
                      setBatchLoading(false);
                    });
                }
              },
            };
          }),
          onChange: keys => {
            if (keys.length > 1000) {
              return;
            }
            setSelectedRowKeys(keys as number[]);
          },
        }}
      />
    </ConfigProvider>
  );
  return (
    <div
      className={classnames(style.contacts, {
        [style.hasSelectedRowKeys]: hasSelectedRowKeys,
      })}
    >
      {children(filter, operations, table)}
      {/* {createCustomerVisible && createCustomerData && (<CreateNewClientModal visible={createCustomerVisible} pageType="new" from="addressBook" customerData={createCustomerData} onCancel={() => {
                setCreateCustomerVisible(false);
                setCreateCustomerData(null);
            }}/>)} */}
      {addToCustomerVisible && addToCustomerContacts && addToCustomerCompanyId && (
        <EditNewClientModal
          visible={addToCustomerVisible}
          pageType="edit"
          companyId={addToCustomerCompanyId}
          afterCompanyDetailFetched={detail => {
            detail.contact_list = [...(detail.contact_list || []), ...addToCustomerContacts.map(convertToCustomerContact)] as any;
            return detail;
          }}
          onCancel={success => {
            if (success) {
            }
            setAddToCustomerVisible(false);
            setAddToCustomerCompanyId('');
            setAddToCustomerContacts([]);
          }}
        />
      )}
      <CustomerPicker
        title={`将${getBatchOperateName(addToCustomerContacts)}添加至现有客户`}
        visible={customerPickerVisible}
        onCancel={() => {
          setCustomerPickerVisible(false);
          setAddToCustomerContacts([]);
        }}
        onOk={(companyId: string) => {
          setCustomerPickerVisible(false);
          const contacts = addToCustomerContacts;

          // 基于邮箱去重
          const emailSets = new Set<string>();
          let uniqueContacts: AddressBookContact[] = [];
          for (const ele of contacts) {
            const { addressInfo } = ele;
            const email = addressInfo.contactAddressInfo;
            if (!emailSets.has(email)) {
              emailSets.add(email);
              if (ele.contactInfo === undefined) {
                ele.contactInfo = {};
              }
              uniqueContacts.push(ele);
            }
          }
          // 如果添加到客户的数量高于200则展示toast
          if (uniqueContacts.length > 200) {
            Message.warn(getTransText('ZUIDUOZHICHITONGSHIXIANYOU'));
            uniqueContacts = uniqueContacts.slice(0, 200);
          }
          // debugger;
          uniDrawerDispatch({
            type: 'add_customer',
            payload: {
              customerId: +companyId,
              customerData: covert2CustomerData(uniqueContacts),
            },
          });
        }}
      />
      <TransferGroup
        id={1}
        title={`将${getBatchOperateName(addToGroupContacts)}添加至分组`}
        visible={addToGroupVisible}
        isTransfer={false}
        addressIds={addToGroupAddressIds}
        sourceGroup={addToGroupOriginGroups}
        onSuccess={() => {
          setAddToGroupVisible(false);
          setAddToGroupContacts([]);
          setAddToGroupAddressIds([]);
          setAddToGroupOriginGroups([]);
          triggerFetch();
          if (isBatchOp) {
            setSelectedRowKeys([]);
          }
        }}
        onClose={() => {
          setAddToGroupVisible(false);
          setAddToGroupContacts([]);
          setAddToGroupAddressIds([]);
          setAddToGroupOriginGroups([]);
        }}
      />
      <TransferGroup
        id={1}
        title={`将${getBatchOperateName(transToGroupContacts)}转移至分组`}
        visible={transToGroupVisible}
        isTransfer
        addressIds={transToGroupAddressIds}
        sourceGroup={transToGroupOriginGroups}
        onSuccess={() => {
          setTransToGroupVisible(false);
          setTransToGroupContacts([]);
          setTransToGroupAddressIds([]);
          setTransToGroupOriginGroups([]);
          triggerFetchFirstPage();
          if (isBatchOp) {
            setSelectedRowKeys([]);
          }
        }}
        onError={() => {}}
        onClose={() => {
          setTransToGroupVisible(false);
          setTransToGroupContacts([]);
          setTransToGroupAddressIds([]);
          setTransToGroupOriginGroups([]);
        }}
      />
      <ReturnToOpenSea
        title={`将${getBatchOperateName(returnToOpenSeaContacts)}退回公海`}
        visible={returnToOpenSeaVisible}
        ids={returnToOpenSeaAddressIds}
        onSuccess={(ids: number[]) => {
          setReturnToOpenSeaVisible(false);
          setReturnToOpenSeaContacts([]);
          setReturnToOpenSeaAddressIds([]);
          removeIdsFromSelectedRowKeys(ids);
          triggerFetchFirstPage();
          if (isBatchOp) {
            setSelectedRowKeys([]);
          }
          Message.success({ content: getIn18Text('TUIHUICHENGGONG') });
        }}
        onError={(error: Error) => {
          Message.error({ content: error?.message || getIn18Text('TUIHUISHIBAI') });
        }}
        onClose={() => {
          setReturnToOpenSeaVisible(false);
          setReturnToOpenSeaContacts([]);
          setReturnToOpenSeaAddressIds([]);
        }}
      />
      {detailVisible && detailContactId && detailAddressId && (
        <ContactDetail
          id={1}
          visible={detailVisible}
          contactId={detailContactId}
          addressId={detailAddressId}
          onSuccess={() => {}}
          onError={() => {}}
          onClose={() => {
            setDetailContactId(null);
            setDetailAddressId(null);
            setDetailVisible(false);
            triggerFetch();
          }}
        />
      )}

      <UniDrawer
        visible={uniDrawerState.visible}
        customerId={uniDrawerState.customerId}
        onClose={resetUniDrawer}
        onSuccess={() => {
          const contentMap = {
            addressBookNewCustomer: getIn18Text('XINJIANCHENGGONG！'),
            addressBookExistedCustomer: getIn18Text('BIANJICHENGGONG！'),
            addressBookCustomerDetail: getIn18Text('BIANJICHENGGONG！'),
          };
          const content = contentMap[uniDrawerState.customerType] || getIn18Text('BIANJICHENGGONG！');
          // Message.success(content);
          triggerFetch();
          if (uniDrawerState.customerId) {
            setAddToCustomerContacts([]);
          }
          resetUniDrawer();
          if (isBatchOp) {
            setSelectedRowKeys([]);
          }
        }}
        source="addressBook"
        customerData={uniDrawerState.customerData}
      />
    </div>
  );
});
export default Contacts;
