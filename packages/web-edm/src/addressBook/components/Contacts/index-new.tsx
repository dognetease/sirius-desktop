import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import classnames from 'classnames';
import qs from 'querystring';
import { Button, Space, Menu, Dropdown, Divider, ConfigProvider, Popover, PaginationProps } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import EllipsisOutlined from '@ant-design/icons/EllipsisOutlined';
import { navigate } from '@reach/router';
import {
  apis,
  apiHolder,
  MailApi,
  CustomerApi,
  ICustomerContactData,
  AddressBookApi,
  AddressBookGroup,
  AddressBookFilterType,
  AddressBookContactsParams,
  AddressBookNewApi,
  IAddressBookContactListItem,
  ProductAuthApi,
  conf,
} from 'api';
import ContactsFilter from './contactFilter-new';
import useEdmSendCount from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import { TransferGroup } from '../../views/TransferGroupNew';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import { getBatchOperateNameNew, setRefreshParams } from '../../utils';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { useAppSelector } from '@web-common/state/createStore';
import { ReactComponent as ArrowDown } from '@/images/icons/edm/addressBook/arrow-down.svg';
import addressBookStyle from '../../addressBook.module.scss';
import style from './index.module.scss';
import { getEmailMarketList, generateAddressBookVerifyStatusParams, generateAddressBookContactTodayParams } from '../../utils';
import { edmDataTracker, contactBookActionTrackKey } from '../../../tracker/tracker';
import Table from '@/components/Layout/Customer/components/UI/Table/table';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import Badge from '@lingxi-common-component/sirius-ui/SiriusBadge';
import Checkbox from '@lingxi-common-component/sirius-ui/Checkbox';
// import SiriusTable from '@web-common/components/UI/Table';
import { BatchOperateNew, createMulSelectInfos, mergeObjectByKeysNew } from '../../batchOperate';
import '../../addressBookTableDrop.scss';
import Sorter from './sorter';
import isEqual from 'lodash/isEqual';
import { getIn18Text } from 'api';
const batchOp = new BatchOperateNew('address');
import { UniDrawerContactView, UniDrawerLeadsView, MarketingStatistics } from '@/components/Layout/CustomsData/components/uniDrawer/index';
import { ContactScene } from '@lxunit/app-l2c-crm';
import { useRequest } from 'ahooks';
import moment from 'moment';
import lodashGet from 'lodash/get';

const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.AddressBookNewApi) as unknown as AddressBookNewApi;
const productAuthApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as unknown as ProductAuthApi;
const systemApi = apiHolder.api.getSystemApi();
const datastoreApi = apiHolder.api.getDataStoreApi();

interface ContactsProps {
  data: IAddressBookContactListItem[];
  total: number;
  loading?: boolean;
  groupId?: number;
  filterClassName?: string;
  isOverview?: boolean;
  isSystemGroup?: boolean;
  scrollHeight?: string | number;
  showSizeChanger?: boolean;
  onFetch: (type: AddressBookFilterType, params: AddressBookContactsParams) => void;
  onFetchBatchDataList: (params: AddressBookContactsParams) => Promise<{ dataList: any[]; total: number }>;
  children: (filter: React.ReactElement, operations: React.ReactElement, table: React.ReactElement) => React.ReactElement;
  initParam?: AddressBookContactsParams;
  initGroupId?: string;
  resetFormParams?: () => void;
  tabScrollY?: number;
  startFilterFixedHeight?: number;
}
interface MarketItem {
  contactName: string;
  contactEmail: string;
}

const defaultPagination = {
  page: 1,
  page_size: 20,
};

const mailMarketHistoryStatusMap = {
  success: (
    <svg
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      stroke="currentColor"
      stroke-width="1"
      color="var(--success-6, #0fd683)"
    >
      <circle cx="8" cy="8" r="7" fill="currentColor" stroke="none"></circle>
      <path stroke="white" stroke-linecap="round" stroke-linejoin="round" d="m5.3 8 2.121 2.121 3.89-3.889"></path>
    </svg>
  ),
  warn: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#FE5B4C" />
      <path d="M8 4.7002V9.00018" stroke="white" stroke-linecap="round" />
      <path
        d="M8.60002 11.1C8.60002 11.4314 8.3314 11.7 8.00002 11.7C7.66865 11.7 7.40002 11.4314 7.40002 11.1C7.40002 10.7686 7.66865 10.5 8.00002 10.5C8.3314 10.5 8.60002 10.7686 8.60002 11.1Z"
        fill="white"
      />
    </svg>
  ),
};

const QuestionIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 14.5C9.79493 14.5 11.4199 13.7725 12.5962 12.5962C13.7725 11.4199 14.5 9.79493 14.5 8C14.5 6.20507 13.7725 4.58007 12.5962 3.40381C11.4199 2.22754 9.79493 1.5 8 1.5C6.20507 1.5 4.58007 2.22754 3.40381 3.40381C2.22754 4.58007 1.5 6.20507 1.5 8C1.5 9.79493 2.22754 11.4199 3.40381 12.5962C4.58007 13.7725 6.20507 14.5 8 14.5Z"
        stroke="#3F465C"
        stroke-linejoin="round"
      />
      <path
        d="M8.00019 9.40628V9.08115C8.00019 8.63932 8.37776 8.29739 8.77071 8.0954C9.31533 7.81544 9.68789 7.24795 9.68789 6.59346C9.68789 5.66137 8.93228 4.90576 8.00019 4.90576C7.06811 4.90576 6.3125 5.66137 6.3125 6.59346"
        stroke="#3F465C"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M8.00005 11.9977C8.38625 11.9977 8.69932 11.6846 8.69932 11.2984C8.69932 10.9122 8.38625 10.5991 8.00005 10.5991C7.61386 10.5991 7.30078 10.9122 7.30078 11.2984C7.30078 11.6846 7.61386 11.9977 8.00005 11.9977Z"
        fill="#3F465C"
      />
    </svg>
  );
};

const Contacts = forwardRef((props: ContactsProps, refFromProps) => {
  const {
    data,
    total,
    loading,
    groupId,
    isSystemGroup,
    showSizeChanger = true,
    onFetch,
    onFetchBatchDataList,
    initParam,
    initGroupId,
    children,
    isOverview = false,
    tabScrollY,
    startFilterFixedHeight,
  } = props;
  const hasOp = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'ADDRESS_BOOK', 'OP'));
  const hasDelete = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'ADDRESS_BOOK', 'DELETE'));

  const [hasTransferDone] = useState(productAuthApi.getABSwitchSync('address_transfer2_crm_done'));
  const [params, setParams] = useState<AddressBookContactsParams>({
    ...defaultPagination,
    sort: undefined,
  });

  const getSearchContactCount = () => {
    const getTodayCountParams = generateAddressBookContactTodayParams();
    addressBookNewApi.searchContactCount(getTodayCountParams).then(res => {
      setTodayCount(res || 0); // 获取今日新增数
    });
  };

  useEffect(() => {
    // 获取一些初始化数据
    getSearchContactCount();
    const isOnlyNormalAddress = datastoreApi.getSync('onlyNormalAddress')?.data === 'true'; // 获取用户上次【过滤异常地址】checkbox 选中状态
    setOnlyNormalAddress(isOnlyNormalAddress);
    setShowTodayCount(datastoreApi.getSync('onlyTodaBadge')?.data !== moment().format('YYYY-MM-DD')); // 今日新增 checkbox 点击过后，不在展示今日数目徽标
    let filter = {};
    if (isOnlyNormalAddress) {
      const subs = generateAddressBookVerifyStatusParams();
      filter = {
        filter: {
          relation: 'AND',
          subs: subs,
        },
      };
    }
    setParams({
      ...defaultPagination,
      sort: undefined,
      ...(initParam || {}),
      ...filter,
    });
  }, [initParam]);

  useImperativeHandle(refFromProps, () => ({
    refreshByParams: (fnParams?: AddressBookContactsParams) => {
      const groupFilter = fnParams && fnParams.groupFilter === null ? undefined : fnParams.groupFilter;
      const shouldResetForm = fnParams && fnParams.resetFormFilter === true;
      if (shouldResetForm) {
        filterRef && filterRef.current && filterRef.current.reset();
      }
      const formParams = shouldResetForm ? { filter: params.filter || { relation: 'AND', subs: [] } } : params || {};
      setParams({
        ...defaultPagination,
        ...formParams,
        ...{ groupFilter: groupFilter },
      });
    },
    refreshSearchContactCount: getSearchContactCount,
  }));

  // 手动触发过滤器更新;
  const triggerFetch = () => setParams({ ...params });
  // 手动触发过滤器更新 (回到第 1 页);
  const triggerFetchFirstPage = () => setParams({ ...params, ...{ page: 1 } });
  const filterRef = useRef<any>(null);

  const query = useMemo(() => qs.parse(location.hash.split('?')[1]), [location]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [marketList, setMarketList] = useState<MarketItem[]>([]);

  // useEffect(()=>{},[marketList.length,lodashGet(marketList,'[0].contactEmail','')])

  useEdmSendCount(marketList, undefined, undefined, undefined, undefined, 'addressBook');
  const cachedData = useRef<Record<number, IAddressBookContactListItem>>({});
  const hasSelectedRowKeys = !!selectedRowKeys.length;
  const selectedContacts = selectedRowKeys.map(key => cachedData.current[key]).filter(item => item);

  const [addToGroupVisible, setAddToGroupVisible] = useState<boolean>(false);
  const [addToGroupContacts, setAddToGroupContacts] = useState<IAddressBookContactListItem[]>([]);
  const [addToGroupAddressIds, setAddToGroupAddressIds] = useState<number[]>([]);
  const [addToGroupOriginGroups, setAddToGroupOriginGroups] = useState<string[]>([]);
  const [transToGroupVisible, setTransToGroupVisible] = useState<boolean>(false);
  const [transToGroupContacts, setTransToGroupContacts] = useState<IAddressBookContactListItem[]>([]);
  const [transToGroupAddressIds, setTransToGroupAddressIds] = useState<number[]>([]);
  const [transToGroupOriginGroups, setTransToGroupOriginGroups] = useState<string[]>([]);

  const [batchLoading, setBatchLoading] = useState(false);
  const [mulSelectMenu, setMulSelectMenu] = useState<ReturnType<typeof createMulSelectInfos>>([]);
  const [isBatchOp, setIsBatchOp] = useState(false);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [showTodayCount, setShowTodayCount] = useState<boolean>(false);

  const sendActionTrackData = (action: string) => {
    if (!action) return;
    edmDataTracker.track(contactBookActionTrackKey, { action });
  };

  useEffect(() => {
    data.forEach(item => {
      cachedData.current[Number(item.contactId)] = item;
    });
  }, [data]);

  useEffect(() => {
    const maxSize = conf('stage') === 'prod' ? 10000 : 3000;
    const r = createMulSelectInfos(total, maxSize);
    setMulSelectMenu(r);
  }, [total, data]);

  const handleAddToGroup = (contacts: IAddressBookContactListItem[]) => {
    setAddToGroupVisible(true);
    setAddToGroupContacts(contacts);
    setAddToGroupAddressIds(contacts.map(item => Number(item.contactId)));
  };

  const handleTransToGroup = (contacts: IAddressBookContactListItem[]) => {
    const originGroupsMap = contacts.reduce<Record<string, 1>>((accumulator, contact) => {
      contact.groupNames.forEach(({ groupName }) => {
        accumulator[groupName] = 1;
      });
      return accumulator;
    }, {});
    const originGroups = Object.keys(originGroupsMap);
    setTransToGroupVisible(true);
    setTransToGroupContacts(contacts);
    setTransToGroupAddressIds(contacts.map(item => Number(item.contactId)));
    setTransToGroupOriginGroups(originGroups);
  };

  const removeIdsFromSelectedRowKeys = (ids: number[]) => {
    setSelectedRowKeys(selectedRowKeys.filter(id => !ids.includes(id)));
  };

  const { run: handleContactsDelete, loading: batchDeleteLoading } = useRequest(
    async (contacts: IAddressBookContactListItem[]) => {
      const addressIds = contacts.map(contact => Number(contact.contactId));
      const batchOperateName = getBatchOperateNameNew(contacts);
      const batchDelete = contacts && contacts.length > 1 ? true : false;
      await new Promise(resolve => {
        Modal.confirm({
          title: `确定删除${batchOperateName}到 [回收站] ？`,
          content: '可至 [回收站] 可还原已删除联系人，进入 [回收站] 超过30天，将彻底清除无法还原',
          async onOk() {
            if (batchDelete) {
              await addressBookNewApi.batchDeleteContacts({
                deleteList: contacts.map(item => {
                  return {
                    contact_id: Number(item.contactId),
                    leads_id: Number(item.leadsId),
                  };
                }),
              });
            } else {
              await addressBookNewApi.deleteContacts({ contact_ids: addressIds, leads_id: Number(contacts[0].leadsId) });
            }
            resolve(true);
          },
        });
      });

      return {
        addressIds,
        batchOperateName,
      };
    },
    {
      onSuccess({ addressIds, batchOperateName }) {
        triggerFetchFirstPage();
        removeIdsFromSelectedRowKeys(addressIds);
        setRefreshParams('markting');
        Message.success({ content: `已删除${batchOperateName}到 [回收站]` });
      },
      onError(error) {
        console.error('[contacts/index-new.tsx]deleteContact.error', error);
      },
      manual: true,
    }
  );
  const [leadDetailVisible, setLeadDetailVisible] = useState<boolean>(false);
  const [leadDetailId, setLeadDetailId] = useState<number>(0);
  const showContactItemLeadDetail = (item: IAddressBookContactListItem) => {
    setLeadDetailVisible(true);
    setLeadDetailId(Number(item.leadsId));
  };

  const handleRemoveFromGroup = (contacts: IAddressBookContactListItem[]) => {
    const addressIds = contacts.map(contact => contact.contactId);
    if (!groupId) {
      Message.error({ content: getIn18Text('DANGQIANYEMIANBUCUNZAISHANGCENGFENZU') });
    } else {
      Modal.confirm({
        title: `确定将 [${getBatchOperateNameNew(contacts)}] 移出分组？`,
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

  const { run: handleMoveToBlacklist } = useRequest(
    async (contacts: IAddressBookContactListItem[]) => {
      const addressIds = contacts.map(contact => Number(contact.contactId));
      const contact_list = contacts.map(contact => ({
        contact_name: contact.contactName,
        company_name: contact.companyName,
        email: contact.email,
      })) as ICustomerContactData[];
      await new Promise(resolve => {
        Modal.confirm({
          title: `确定转移${getBatchOperateNameNew(contacts)}至黑名单？`,
          content: getIn18Text('LIANXIRENJIANGZHUANYIZHIHEIMINGDAN'),
          async onOk() {
            await customerApi.addEdmBlacklist({ contact_list });
            addressBookNewApi.deleteContacts({ contact_ids: addressIds, leads_id: Number(contacts[0].leadsId) });
            resolve(true);
          },
        });
      });
      return { contacts, addressIds };
    },
    {
      manual: true,
      onSuccess({ contacts, addressIds }) {
        setRefreshParams('markting');
        const content = (
          <>
            {getIn18Text('YIJIANG')}
            {getBatchOperateNameNew(contacts)}转移至[黑名单]
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
      },
    }
  );

  const [contactDetailVisible, setContactDetailVisible] = useState<boolean>(false);
  const [contactDetailLeadId, setContactDetailLeadId] = useState<number>(0);
  const [contactDetailContactId, setContactDetailContactId] = useState<number>(0);
  const [onlyNormalAddress, setOnlyNormalAddress] = useState<boolean>(false);
  const [onlyTodayAddress, setOnlyTodayAddress] = useState<boolean>(false);

  const showContactDetailModal = (item: IAddressBookContactListItem) => {
    setContactDetailLeadId(Number(item.leadsId));
    setContactDetailContactId(Number(item.contactId));
    setContactDetailVisible(true);
  };

  const onlyTodayAddressOnChange = (e: any) => {
    setOnlyTodayAddress(e.target.checked);
    datastoreApi.put('onlyTodaBadge', moment().format('YYYY-MM-DD'));
    let filterItems: any[] = [];
    if (e.target.checked) {
      const todayParams = generateAddressBookContactTodayParams();
      filterItems = filterItems.concat(todayParams);
    }
    if (onlyNormalAddress) {
      const verifyStatusParams = generateAddressBookVerifyStatusParams();
      filterItems = filterItems.concat(verifyStatusParams);
    }
    setParams({
      ...params,
      ...defaultPagination,
      filter: {
        relation: 'AND',
        subs: filterItems,
      },
    });
    edmDataTracker.track(contactBookActionTrackKey, { action: 'todayNew' });
  };
  const onlyNormalAddressOnChange = (e: any) => {
    setOnlyNormalAddress(e.target.checked);
    datastoreApi.put('onlyNormalAddress', e.target.checked.toString());
    let filterItems: any[] = [];
    if (e.target.checked) {
      const verifyStatusParams = generateAddressBookVerifyStatusParams();
      filterItems = filterItems.concat(verifyStatusParams);
    }
    if (onlyTodayAddress) {
      const todayParams = generateAddressBookContactTodayParams();
      filterItems = filterItems.concat(todayParams);
    }
    setParams({
      ...params,
      ...defaultPagination,
      filter: {
        relation: 'AND',
        subs: filterItems,
      },
    });
  };

  useEffect(() => {
    onFetch('ordinary', params);
  }, [params]);
  const columns: ColumnsType<IAddressBookContactListItem> = [
    {
      title: getIn18Text('YOUXIANG'),
      fixed: 'left',
      width: 250,
      dataIndex: 'email',
      className: classnames(style.minWidthCell, style.maxWidthCell, style.oneIndex),
      ellipsis: true,
      render: (_: string, item: IAddressBookContactListItem) => {
        const maxEmailLen = item.valid ? 24 : 18;
        let emailStr = item.email || '--';
        return item.email ? (
          <Space className={classnames(style.emailCell)}>
            <a
              className={style.emailDetail}
              onClick={() => {
                showContactDetailModal(item);
                sendActionTrackData('detail');
              }}
              title={item.email}
            >{`${emailStr}`}</a>
            {!item.valid && <span className={style.invalidTag}>{getIn18Text('WUXIAO')}</span>}
          </Space>
        ) : (
          '--'
        );
      },
    },
    {
      title: getIn18Text('XINGMING'),
      width: 150,
      dataIndex: 'contactName',
      className: classnames(style.minWidthCell, style.maxWidthCell),
      render: (text: string) => `${text}`,
    },
    {
      title: getIn18Text('LIANXIRENFENZU'),
      dataIndex: 'groupNames',
      width: 160,
      className: style.minWidthCell,
      render: (groupInfos: AddressBookGroup[]) => {
        if (!Array.isArray(groupInfos) || !groupInfos.length) return '-';
        const firstGroup = groupInfos[0];
        const otherGroups = groupInfos && groupInfos.length > 1 ? groupInfos.filter(item => item.groupId !== firstGroup.groupId) : [];
        return (
          <>
            <div className={style.groupNamesWrapper}>
              <div className={style.groupNameLabel} title={firstGroup.groupName}>
                {firstGroup.groupName}
              </div>
              {otherGroups && otherGroups.length ? (
                <Popover
                  content={
                    <div className={style.otherGroupNameModal}>
                      {otherGroups.map(item => {
                        return (
                          <div style={{ maxWidth: '200px' }} className={style.groupNameLabel} title={item.groupName}>
                            {item.groupName}
                          </div>
                        );
                      })}
                    </div>
                  }
                >
                  <div className={style.groupNameLabel}>...</div>
                </Popover>
              ) : null}
            </div>
          </>
        );
      },
    },
    {
      title: getIn18Text('YINGXIAOLISHI'),
      width: 200,
      dataIndex: 'mailMarketingHistory',
      render: (text: string, item: IAddressBookContactListItem) => {
        if (!hasTransferDone) {
          return '--';
        }

        let historyStatus = item.mailMarketHistoryStatus;
        const emailStr = text || '--';
        return (
          <Space size={2}>
            <div style={{ display: 'flex' }}>
              {historyStatus === 'success' ? (
                <Popover
                  mouseEnterDelay={0.3}
                  content={
                    <div className={style.markhistoryModal}>
                      <MarketingStatistics contactEmail={item.email}></MarketingStatistics>
                    </div>
                  }
                >
                  {historyStatus && <span className={style.marketHistoryIcon}>{mailMarketHistoryStatusMap[historyStatus]}</span>}
                  <span style={{ lineHeight: '22px' }}>{emailStr}</span>
                </Popover>
              ) : (
                emailStr
              )}
            </div>
          </Space>
        );
      },
    },
    {
      title: getIn18Text('GUOJIADEQU'),
      dataIndex: 'area',
      width: 100,
      className: classnames(style.minWidthCell, style.maxWidthCell, style.companyNameCell),
      render: (text: string) => {
        return text || '--';
      },
    },
    {
      title: getIn18Text('GONGSIMINGCHENG'),
      dataIndex: 'companyName',
      width: 200,
      className: classnames(style.minWidthCell, style.maxWidthCell),
      render(text: string, item: IAddressBookContactListItem) {
        return text ? (
          <Space size={16}>
            <a
              onClick={() => {
                showContactItemLeadDetail(item);
                sendActionTrackData('clue');
              }}
            >
              {text}
            </a>
          </Space>
        ) : (
          '--'
        );
      },
    },
    {
      title: getIn18Text('ZHIWEI'),
      dataIndex: 'job',
      width: 200,
      className: classnames(style.minWidthCell, style.maxWidthCell, style.companyNameCell),
      render: (text: string) => {
        return text || '--';
      },
    },
    {
      title: getIn18Text('CHUANGJIANFANGSHI'),
      dataIndex: 'createTypeName',
      width: 150,
      render: (text: string) => {
        return text || '--';
      },
    },
    {
      title: getIn18Text('CHUANGJIANRIQI'),
      dataIndex: 'createTime',
      className: classnames(style.minWidthCell, style.maxWidthCell),
      width: 150,
      render(text: number) {
        return text || '--';
      },
    },
    {
      title: getIn18Text('RECENT_SEND_MAIL_TIME'),
      dataIndex: 'lastSendTime',
      width: 200,
      render(text: number) {
        return text || '--';
      },
    },
    {
      title: getIn18Text('FROM_CLUE'),
      width: 200,
      dataIndex: 'leadsName',
      render(text: number, item: IAddressBookContactListItem) {
        return text ? (
          <Space size={16}>
            <a
              onClick={() => {
                showContactItemLeadDetail(item);
                sendActionTrackData('clue');
              }}
            >
              {text}
            </a>
          </Space>
        ) : (
          '--'
        );
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      fixed: 'right',
      dataIndex: 'operations',
      className: style.operate,
      render: (_: string, item: IAddressBookContactListItem) => {
        return (
          <Space size={16}>
            <a onClick={() => showContactDetailModal(item)}>{getIn18Text('XIANGQING')}</a>
            {(hasOp || hasDelete) && (
              <Dropdown
                overlayClassName="address_contact_dropdown"
                overlay={
                  <Menu>
                    <PrivilegeCheck accessLabel="OP" resourceLabel="CHANNEL">
                      <Menu.Item onClick={() => mailApi.doWriteMailToContact([item.email])}>{getIn18Text('XIEXIN')}</Menu.Item>
                      <Divider style={{ margin: 4, width: 'auto', minWidth: 'auto' }} />
                      <Menu.Item
                        onClick={() => {
                          const markerList = getEmailMarketList([item]);
                          setMarketList(markerList);
                          sendActionTrackData('edm');
                        }}
                      >
                        {getIn18Text('YIJIANYINGXIAO')}
                      </Menu.Item>
                      <Divider style={{ margin: 4, width: 'auto', minWidth: 'auto' }} />
                      <Menu.Item
                        onClick={() => {
                          handleAddToGroup([item]);
                          sendActionTrackData('addGroup');
                        }}
                      >
                        {getIn18Text('TIANJIAZHIFENZU')}
                      </Menu.Item>
                      <Menu.Item
                        onClick={() => {
                          handleTransToGroup([item]);
                          sendActionTrackData('changeGroup');
                        }}
                      >
                        {getIn18Text('ZHUANYIZHIFENZU')}
                      </Menu.Item>
                    </PrivilegeCheck>
                    <PrivilegeCheck accessLabel="OP" resourceLabel="CHANNEL">
                      <Menu.Item
                        onClick={() => {
                          setIsBatchOp(false);
                          handleMoveToBlacklist([item]);
                          sendActionTrackData('black');
                        }}
                      >
                        {getIn18Text('ZHUANYIZHIHEIMINGDAN')}
                      </Menu.Item>
                    </PrivilegeCheck>
                    <PrivilegeCheck accessLabel="DELETE" resourceLabel="CHANNEL">
                      <Menu.Item
                        danger
                        onClick={() => {
                          setIsBatchOp(false);
                          handleContactsDelete([item]);
                          sendActionTrackData('delete');
                        }}
                      >
                        {getIn18Text('SHANCHU')}
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
  const filter = (
    <ContactsFilter
      ref={filterRef}
      initGroupId={initGroupId}
      tabScrollY={tabScrollY}
      startFilterFixedHeight={startFilterFixedHeight}
      classnames={isOverview ? style.overviewFilter : ''}
      onChange={(type: AddressBookFilterType, filters: Omit<AddressBookContactsParams, 'contactAddressType' | 'page' | 'page_size'>) => {
        console.log(type);
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
      <Button
        type="primary"
        disabled={!hasSelectedRowKeys}
        onClick={() => {
          const contacts = batchOp.filterContacts(selectedRowKeys);
          setIsBatchOp(true);
          const contactsMerged = mergeObjectByKeysNew(contacts, selectedContacts);
          const markerList = getEmailMarketList(contactsMerged);
          setMarketList(markerList);
          sendActionTrackData('allEdm');
        }}
      >
        {getIn18Text('YIJIANYINGXIAO')}
      </Button>
      {hasSelectedRowKeys && (
        <>
          <PrivilegeCheck accessLabel="OP" resourceLabel="CHANNEL">
            <Button
              onClick={() => {
                const contacts = batchOp.filterContacts(selectedRowKeys);
                setIsBatchOp(true);
                handleAddToGroup(mergeObjectByKeysNew(contacts, selectedContacts));
                sendActionTrackData('allAddgroup');
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
                  <PrivilegeCheck accessLabel="OP" resourceLabel="CHANNEL">
                    {groupId && !isSystemGroup && <Menu.Item onClick={() => handleRemoveFromGroup(selectedContacts)}>{getIn18Text('YICHUFENZU')}</Menu.Item>}
                    <Menu.Item
                      onClick={() => {
                        const contacts = batchOp.filterContacts(selectedRowKeys);
                        setIsBatchOp(true);
                        handleTransToGroup(mergeObjectByKeysNew(contacts, selectedContacts));
                        sendActionTrackData('allChangegroup');
                      }}
                    >
                      {getIn18Text('ZHUANYIZHIFENZU')}
                    </Menu.Item>
                  </PrivilegeCheck>
                  <PrivilegeCheck accessLabel="OP" resourceLabel="CHANNEL">
                    <Menu.Item
                      onClick={() => {
                        const contacts = batchOp.filterContacts(selectedRowKeys);
                        setIsBatchOp(true);
                        handleMoveToBlacklist(mergeObjectByKeysNew(contacts, selectedContacts));
                        sendActionTrackData('allBlack');
                      }}
                    >
                      {getIn18Text('ZHUANYIZHIHEIMINGDAN')}
                    </Menu.Item>
                  </PrivilegeCheck>
                  <PrivilegeCheck accessLabel="DELETE" resourceLabel="CHANNEL">
                    <Menu.Item
                      danger
                      onClick={() => {
                        const contacts = batchOp.filterContacts(selectedRowKeys);
                        setIsBatchOp(true);
                        handleContactsDelete(mergeObjectByKeysNew(contacts, selectedContacts));
                        sendActionTrackData('allDelete');
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
          const sortKeyMap = {
            createTime: 'contact_id',
            contactEmailSuffix: 'email_domain',
            contactCompanyName: 'leads_company_name',
          };
          //@ts-ignore
          const filedId = sortKeyMap[nextSort?.field || ''] as string;
          batchOp.clear();
          setSelectedRowKeys([]);
          setParams({
            ...params,
            sort: nextSort
              ? {
                  //@ts-ignore
                  field_id: filedId,
                  reverse: true,
                }
              : undefined,
            page: 1,
          });
          if (nextSort?.field) {
            const trackMap: { [key: string]: string } = {
              createTime: 'timeOrder',
              contactEmailSuffix: 'emailOrder',
              contactCompanyName: 'companyOrder',
            };
            sendActionTrackData(trackMap[(nextSort.field as string) || ''] as string);
          }
        }}
      />
      <Checkbox checked={onlyNormalAddress} onChange={onlyNormalAddressOnChange}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          {getIn18Text('GUOLVYICHANGDIZHI')}
          <Tooltip title={getIn18Text('GUOLVYICHANGDIZHITIP')}>
            <span style={{ marginLeft: 4, display: 'flex' }}>
              <QuestionIcon />
            </span>
          </Tooltip>
        </span>
      </Checkbox>
      {todayCount > 0 ? (
        <Checkbox checked={onlyTodayAddress} onChange={onlyTodayAddressOnChange}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            {getIn18Text('ZHIKANJINRIXINZENGLIANXIREN')}
            {showTodayCount ? <Badge overflowCount={100000000} count={todayCount} style={{ marginLeft: '2px' }} /> : null}
          </span>
        </Checkbox>
      ) : null}
    </Space>
  );

  // const onPaginationChange = (page:) => { }

  const table = (
    <ConfigProvider prefixCls="__address_antd_dropdown ant">
      <Table<IAddressBookContactListItem>
        className={classnames(style.table, addressBookStyle.table)}
        scroll={{ x: 'max-content' }}
        columns={columns}
        loading={loading || batchLoading}
        dataSource={data}
        pagination={{
          className: 'pagination-wrap',
          size: 'small',
          total,
          current: params.page,
          pageSize: params.page_size,
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
        // tableWidthKey="addressBookTable"
        onChange={(pagination, _: any) => {
          // 超过1W条数据只能依次翻页
          const maxSize = conf('stage') === 'prod' ? 10000 : 3000;
          if (total > maxSize && pagination.current && params.page && Math.abs(pagination.current - params.page) > 1) {
            Message.error('1W条以上数据只能依次翻页');
            return;
          }
          setParams(previous => ({
            ...previous,
            page_size: pagination.pageSize as number,
            page: pagination.pageSize === previous.page_size ? (pagination.current as number) : 1,
          }));
        }}
        rowKey={item => item.contactId}
        rowSelection={{
          fixed: true,
          selectedRowKeys,
          preserveSelectedRowKeys: true,
          selections: mulSelectMenu.map(ele => {
            return {
              key: ele.text,
              text: ele.text,
              onSelect: (_: number[]) => {
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
                    page_size: ele.type === 'origin' ? params.page_size : ele.pageSize,
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
            setSelectedRowKeys((keys || []).map(key => Number(key)));
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
      {contactDetailVisible && (
        <UniDrawerContactView
          visible={contactDetailVisible}
          onClose={() => {
            setContactDetailVisible(false);
          }}
          leadsId={contactDetailLeadId}
          contactId={contactDetailContactId}
          source={ContactScene.MarketingContact}
        ></UniDrawerContactView>
      )}
      {leadDetailVisible && (
        <UniDrawerLeadsView
          visible={true}
          onClose={() => {
            setLeadDetailVisible(false);
          }}
          leadsId={leadDetailId}
        ></UniDrawerLeadsView>
      )}
      {addToGroupVisible && (
        <TransferGroup
          id={1}
          title={`将${getBatchOperateNameNew(addToGroupContacts)}添加至分组`}
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
          onError={(_, error: any) => {
            Message.error({ content: error?.message || getIn18Text('TIANJIASHIBAI') });
          }}
          onClose={() => {
            setAddToGroupVisible(false);
            setAddToGroupContacts([]);
            setAddToGroupAddressIds([]);
            setAddToGroupOriginGroups([]);
          }}
        />
      )}
      {transToGroupVisible && (
        <TransferGroup
          id={1}
          title={`将${getBatchOperateNameNew(transToGroupContacts)}转移至分组`}
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
      )}
    </div>
  );
});
export default Contacts;
