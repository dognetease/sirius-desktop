import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Spin, Dropdown, Menu, TreeDataNode } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import Tree from '@web-mail/common/components/VListTree/VListTree';
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import {
  api,
  apis,
  MailApi,
  getIn18Text,
  MailEntryModel,
  MailPlusCustomerApi,
  ServerCustomerContactModel,
  ServerCustomerModel,
  ICustomerManagerModel,
  MailAttrQuery,
  MailAttrQueryFilter,
  queryMailBoxParam,
  MailModelEntries,
  EdmRoleApi,
  ContactAndOrgApi,
} from 'api';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import { getMailKey } from '@web-mail/util';
import ReadMail from '@web-mail/components/ReadMail/ReadMail';
import { formateMailList } from '@web-mail/state/customize';
import MailMenuCardList from '@web-mail/common/components/vlist/MailCardList/MailMenuCardList';
import MailCard from '@web-mail/common/components/vlistCards/MailCard/MailCard';
import { CardOperRedFlag } from '@web-mail/common/components/vlistCards/MailCard/defaultComs';
import { CustomerMailListStateTabSelected, MailCardComProps } from '@web-mail/types';
import MailSyncModal from '@web-mail/components/MailSyncModal/MailSyncModal';
import MailBoxEventHander from '@web-mail/components/mailBoxEventHander/readMailEventHandler';
import useCreateCallbackForEvent from '../hooks/useCreateCallbackForEvent';
import { getCardHeight } from '@web-mail/utils/mailCardUtil';
import { useAsyncEffect } from 'ahooks';
import styles from './customer.module.scss';
import FilterTab from '@web-mail/components/MailColumnEntry/filterTab';
import { useState2CustomerSlice } from '@web-mail/hooks/useState2SliceRedux';
import CustomerIcon from '@web-common/components/UI/Icons/svgs/edm/CustomerIcon';
import CustomerContactIcon from '@web-common/components/UI/Icons/svgs/edm/CustomerContactIcon';
import { transServerCustomer2CustomerModel } from '@web-common/utils/contact_util';
import { request } from '@web-mail/state/slice/request';
import { customerTabMenuKey } from '@web-mail/state/slice/customerMailReducer/types';
// import './temp.scss';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import useMailStore from '@web-mail/hooks/useMailStoreRedux';
import useListDiffFouceRender from '@web-mail/components/MailColumnEntry/useListDiffFouceRender';
import useThrottleForEvent from '@web-mail/hooks/useThrottleForEvent';
export interface MailRelateModel {
  customerId: string;
  selectedCustomerContact: string;
  mailAccount: string;
}

interface FilterState {
  subFilter: customerTabMenuKey;
  filter: CustomerMailListStateTabSelected;
}

interface CustomerTreeDataNode extends TreeDataNode {
  managerList: ICustomerManagerModel[];
  email: string;
}
const defaultListWidth = 324;
const MailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const eventApi = api.getEventApi();
const mailPlusCustomerApi = api.requireLogicalApi(apis.mailPlusCustomerApiImpl) as MailPlusCustomerApi;
const edmRoleApi = api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const systemApi = api.getSystemApi();

const getEdmPrivilegeReady = () => {
  return !!edmRoleApi.doGetPrivilegeMap();
};
const CustomerMailRelatedBox: React.FC<MailRelateModel> = props => {
  const { mailAccount, customerId, selectedCustomerContact } = props;
  // 邮箱的其他操作
  const MailBoxEventHandlerMemo = useMemo(() => <MailBoxEventHander />, []);
  // 选择的文件信息
  const selectedFolder = useRef<{ email: string; managerList: ICustomerManagerModel[] }>({
    email: selectedCustomerContact,
    managerList: [],
  });

  // 选中的筛选条件
  const selectedFilter = useRef<FilterState>({ filter: 'ME', subFilter: 'ALL' });

  // 选中的邮件
  const [selectedMailId, setSelectedMailId] = useState<string>('');

  // 选中的邮件内容
  const [selectedMailContent, setSelectedMailContent] = useState<MailEntryModel>();

  // 外贸权限是否ready, 必须是ready才能获取到数据
  const [edmPrivilegeReady, setEdmPrivilegeReady] = useState<boolean>(getEdmPrivilegeReady());

  // 邮件列表数据
  const [mailDataList, setMailList] = useMailStore('mailDataList');

  // 设置邮件的总数
  const [mailTotal, setMailTotal] = useState<number>(20);

  // 是否处于第一次的加载状态
  const [listLoading, setListLoading] = useState<boolean>(true);

  //
  const [visibleRefresh, setVisibleRefresh] = useState<boolean>(true);

  // 当文件夹数据变化
  const onFolderChange = useCallback((data: CustomerTreeDataNode) => {
    if (data.isLeaf) {
      if (!data.email) {
        setVisibleRefresh(false);
        setMailList([]);
        setMailTotal(0);
        return;
      }
      selectedFolder.current = {
        ...selectedFolder.current,
        ...{
          email: data.email,
          managerList: data.managerList,
        },
      };
      // 重置筛选项
      selectedFilter.current = { filter: 'ME', subFilter: 'ALL' };
      onLoadListData(0, true);
    }
  }, []);

  // 当筛选条件发生变化
  const onFilterChange = useCallback(data => {
    selectedFilter.current = { ...selectedFilter.current, ...data };
    onLoadListData(0, true);
  }, []);

  // 当选择的邮件发生变化
  const onSelectMailChange = useCallback((mid: string, mailData: MailEntryModel) => {
    setSelectedMailId(mid);
    setSelectedMailContent(mailData);
  }, []);

  // 加载列表数据
  const onLoadListData = useCallback(
    async (start: number, isReset?: boolean) => {
      try {
        const index = isReset ? 0 : start;
        const lastMail = mailDataList[index - 1];
        if (isReset) {
          setListLoading(true);
        }
        const reqParams = await getEdmParams({
          to: [selectedFolder.current.email],
          startIndex: index,
          subMenuState: selectedFilter.current.subFilter,
          menuStateTab: selectedFilter.current.filter,
          lastMail,
          managerList: selectedFolder.current.managerList,
        });
        const res = (await request.doListMailBoxEntities(reqParams, true)) as MailModelEntries;
        setMailTotal(res.total || 0);
        const newList = !isReset && mailDataList.length > 0 ? mailDataList.concat(res.data) : res.data;
        setMailList(formateMailList(newList));
        setVisibleRefresh(true);
        if (isReset) {
          setListLoading(false);
        }
      } catch (error) {
        console.error('CustomerMailRelatedBox onLoadListData error', error);
      }
    },
    [mailDataList]
  );

  // 刷新页面
  const onRefresh = useCallback(async () => {
    if (!navigator.onLine) {
      message.error({
        content: getIn18Text('CAOZUOSHIBAI\uFF0C'),
      });
      return Promise.reject();
    }
    await onLoadListData(0, true);
    return Promise.resolve();
  }, []);

  // 初始化列表数据
  useAsyncEffect(async () => {
    if (edmPrivilegeReady) {
      await onLoadListData(0, true);
    }
  }, [edmPrivilegeReady]);

  const doGetTpMailContent = useCallback(
    (id, _noFlagInfo, noCache) => {
      return mailApi.doGetTpMailContent(
        {
          mid: id,
          owner: selectedMailContent?.owner,
        },
        noCache
      );
    },
    [selectedMailContent]
  );

  useMsgRenderCallback('edmPrivilegeReady', () => {
    setEdmPrivilegeReady(true);
  });

  return (
    <>
      <PageContentLayout>
        <SideContentLayout borderRight minWidth={200} defaultWidth={220}>
          <CustomerFolderList ready={edmPrivilegeReady} customerId={customerId} selectEmail={selectedCustomerContact} onSelect={onFolderChange} />
        </SideContentLayout>
        <SideContentLayout borderRight minWidth={300} defaultWidth={defaultListWidth} className={styles.mailListWrap}>
          <div className={styles.filterWrap}>
            <CustomerFilter onChange={onFilterChange} />
          </div>
          <div className={styles.listWrap}>
            <CustomerMailList
              loading={listLoading}
              data={mailDataList}
              total={mailTotal}
              onRefresh={onRefresh}
              visibleRefresh={visibleRefresh}
              onLoadData={onLoadListData}
              onSelect={onSelectMailChange}
            />
          </div>
        </SideContentLayout>
        <div className={styles.readMailWrap}>
          <ReadMail
            sliceId="-1/10"
            mailId={{
              id: selectedMailId,
              account: mailAccount || '',
            }}
            readOnly={selectedMailContent?.isTpMail}
            featureConfig={{
              mailDiscuss: false,
            }}
            getSignMailContent={selectedMailContent?.isTpMail ? doGetTpMailContent : undefined}
          />
        </div>
      </PageContentLayout>
      <MailSyncModal />
      {MailBoxEventHandlerMemo}
    </>
  );
};

const transContact = (v: ServerCustomerContactModel, parentKey: string, managerList: ICustomerManagerModel[]) => {
  return {
    title: v.contact_name || v.email,
    key: parentKey + '_' + v.contact_id,
    icon: CustomerContactIcon(),
    email: v.email,
    isLeaf: true,
    managerList,
  };
};

const transTreeData = (customerData: ServerCustomerModel, contactList: ServerCustomerContactModel[] = []) => {
  const data = transServerCustomer2CustomerModel(customerData);
  const { id, orgName, managerList } = data;
  const children = contactList.map(item => {
    return transContact(item, id, managerList);
  });
  return {
    title: orgName,
    key: id,
    icon: CustomerIcon(),
    isLeaf: false,
    nodeData: data,
    children,
    managerList,
  };
};

const CustomerLoading = () => {
  return <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />;
};

// 客户往来邮件第一栏（文件夹树）
const CustomerFolderList = (props: { customerId: string; selectEmail: string; ready: boolean; onSelect: (data: CustomerTreeDataNode) => void }) => {
  const { customerId, selectEmail: defaultEmail, onSelect, ready } = props;
  // 当前选中的联系人
  const [selectedKeys, setSelectedKeys] = useState<string>();

  const [expandedKeys, setExpandedKeys] = useState<string[]>([customerId]);

  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);

  const renderTitle = useCallback((data: TreeDataNode) => {
    const title = data.title;
    return (
      <div className={styles.treeRowTitleWrap}>
        <span className={styles.treeRowTitle}>{title}</span>
      </div>
    );
  }, []);

  const onTreeSelect = useCallback((node: CustomerTreeDataNode) => {
    setSelectedKeys(node.key as string);
    onSelect(node);
  }, []);

  // 初始化客户以及客户联系人数据
  useAsyncEffect(async () => {
    if (customerId && ready) {
      const [customerList, contactRes] = await Promise.all([
        mailPlusCustomerApi.doGetCustomerDataByIds([customerId], { [customerId]: 'myCustomer' }),
        mailPlusCustomerApi.doGetContactListByCompanyId({ id: customerId, emailRole: 'myCustomer', pageSize: 500 }),
      ]);
      let customerData, contactList;
      if (customerList?.length) {
        customerData = customerList[0];
      }
      if (contactRes.success && contactRes.data) {
        contactList = contactRes.data;
      }
      if (customerData) {
        const customerTreeData = transTreeData(customerData, contactList);
        const defaultSelected = customerTreeData.children.find(item => item.email === defaultEmail);
        if (defaultSelected) {
          onTreeSelect(defaultSelected as CustomerTreeDataNode);
        }
        setTreeData([customerTreeData]);
      }
    }
  }, [customerId, ready]);
  return (
    <div className={styles.treeWrap}>
      <div className={styles.title}>{getIn18Text('WANGLAIYOUJIAN')}</div>
      <div className={styles.content}>
        {ready ? (
          <AutoSizer>
            {({ width, height }) => {
              return (
                <Tree
                  selectedKeys={selectedKeys ? [selectedKeys] : []}
                  hasMore={false}
                  width={width}
                  height={height}
                  onSelect={(_, { node }) => {
                    onTreeSelect(node as CustomerTreeDataNode);
                  }}
                  expandedKeys={expandedKeys}
                  onExpand={(keys: string[]) => {
                    setExpandedKeys(keys);
                  }}
                  treeData={treeData}
                  titleRender={renderTitle}
                />
              );
            }}
          </AutoSizer>
        ) : (
          <CustomerLoading />
        )}
      </div>
    </div>
  );
};

const customerTabMenuMap: Record<customerTabMenuKey, string> = {
  ALL: '收发件',
  Receive: '仅收件',
  Send: '仅发件',
};
// 客户往来邮件拥有的过滤能力
const CustomerFilter = (props: { onChange: (data: Partial<FilterState>) => void }) => {
  const { onChange } = props;
  const [filter, setFilter] = useState<FilterState['filter']>('ALL');
  const [subFilter, setSubFilter] = useState<FilterState['subFilter']>('ALL');
  // 邮件列表-筛选菜单
  const [condition] = useState2CustomerSlice('mailTabs');
  // tabMenu的选择弹窗是否展开
  const [tabMenuVisible, setTabMenuVisible] = useState<boolean>(false);

  // 点击tab
  const clickTab = useCallback((item: any) => {
    setFilter(item.type);
    onChange({ filter: item.type });
  }, []);

  // 点击下拉菜单
  const clickMenu = useCallback((subFilter: customerTabMenuKey) => {
    setSubFilter(subFilter);
    setTabMenuVisible(false);
    onChange({ subFilter });
  }, []);

  return (
    <FilterTab
      list={condition}
      clickItem={clickTab}
      selectedType={filter}
      suffix={
        filter == 'ME' ? (
          <Dropdown
            trigger={['click']}
            getPopupContainer={node => (node.parentNode as HTMLElement) || document.body}
            overlayClassName={styles.dropdownWrap}
            onVisibleChange={open => setTabMenuVisible(open)}
            overlay={
              <Menu selectedKeys={[subFilter]}>
                {(Object.keys(customerTabMenuMap) as customerTabMenuKey[]).map(key => {
                  return (
                    <Menu.Item key={key} onClick={() => clickMenu(key)}>
                      {customerTabMenuMap[key]}
                    </Menu.Item>
                  );
                })}
              </Menu>
            }
          >
            <div style={{ display: 'flex' }}>
              <div style={{ marginRight: 8 }}>{customerTabMenuMap[subFilter]}</div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {tabMenuVisible ? (
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M9.07551 5.00476C9.24231 5.19936 9.10404 5.5 8.84773 5.5H1.15227C0.895961 5.5 0.757688 5.19936 0.924489 5.00476L4.77222 0.51574C4.89195 0.376056 5.10805 0.376056 5.22778 0.51574L9.07551 5.00476Z"
                      fill="#8D92A1"
                    />
                  </svg>
                ) : (
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M9.07551 0.995237C9.24231 0.800635 9.10404 0.5 8.84773 0.5L1.15227 0.5C0.895961 0.5 0.757688 0.800635 0.924489 0.995237L4.77222 5.48426C4.89195 5.62394 5.10805 5.62394 5.22778 5.48426L9.07551 0.995237Z"
                      fill="#8D92A1"
                    />
                  </svg>
                )}
              </div>
            </div>
          </Dropdown>
        ) : (
          <></>
        )
      }
    />
  );
};

// 邮件列表的空状态（初始化加载，无数据）
const MailListEmpty = (props: { isLoading: boolean; visibleRefresh?: boolean; onRefresh?: () => void }) => {
  const { isLoading, onRefresh, visibleRefresh } = props;
  if (isLoading) {
    return <CustomerLoading />;
  }
  return (
    <>
      <div className={styles.emptyText}>{getIn18Text('ZANWUYOUJIAN')}</div>
      {visibleRefresh && (
        <div className={styles.refreshBtn} onClick={onRefresh}>
          {getIn18Text('SHUAXIN')}
        </div>
      )}
    </>
  );
};
const getCurrentAccountId = () => {
  const currentUser = systemApi.getCurrentUser();
  const currentContactId = currentUser?.contact?.contact.id || (currentUser?.prop?.contactId as string);
  return currentContactId;
};

const getEdmParams = async (props: {
  // 代表当前账号和谁的邮件
  to: string[];
  // 从第几封邮件开始往下加载
  startIndex: number;
  // 最后一份邮件的详情
  lastMail?: MailEntryModel;
  // 第二个过滤器（收发件）
  subMenuState: customerTabMenuKey;
  // 第一个过滤器（同事，我，全部）
  menuStateTab: CustomerMailListStateTabSelected;
  // 客户的负责人
  managerList?: ICustomerManagerModel[];
}): Promise<queryMailBoxParam> => {
  const { startIndex, to, subMenuState, lastMail, menuStateTab, managerList = [] } = props;
  const endMid = lastMail?.id;
  const endDate = lastMail?.entry?.sendTime;
  const attrQuery: MailAttrQuery[] = [];
  if (managerList.length) {
    // 我的客户
    if (menuStateTab === 'ME' || menuStateTab === 'ALL') {
      // 不传from from取当前账号
      attrQuery.push({ to });
    }
    if (menuStateTab === 'COLLEAGUE' || menuStateTab === 'ALL') {
      const accountIds: string[] = [];
      const currentAccountId = getCurrentAccountId();
      // 因为服务端没有返回email，所以需要取通讯录换取下
      managerList.forEach(item => {
        if (item.managerId !== currentAccountId) {
          accountIds.push(item.managerId);
        }
      });
      // 通过通讯录获取负责人id对应的emails
      const contactList = await contactApi.doGetContactById(accountIds);
      const returnEmails: string[] = [];
      if (contactList?.length) {
        contactList.forEach(item => {
          const email = contactApi.doGetModelDisplayEmail(item);
          returnEmails.push(email);
          attrQuery.push({
            from: email,
            to,
          });
        });
      }
      if (accountIds.length !== returnEmails.length) {
        console.error('CustomerMailRelatedBox getEdmParams error 负责人ids信息缺失 reqIds: ', accountIds, ' resEmails: ', returnEmails);
      }
    }
  }

  // 用来过滤邮件是（收｜发）
  let attrQueryFilter: MailAttrQueryFilter = {};
  if (menuStateTab == 'ME') {
    if (subMenuState === 'Send') {
      attrQueryFilter = { type: 'send' };
    } else if (subMenuState === 'Receive') {
      attrQueryFilter = { type: 'receive' };
    }
  }

  return {
    index: startIndex,
    returnModel: true,
    returnTag: true,
    checkType: 'checkCustomerMail',
    count: endDate ? 100 : 30,
    endDate,
    endMid,
    attrQuery,
    attrQueryFilter,
    noContactRace: true,
  };
};

//  客户往来邮件列表
const CustomerMailList = (props: {
  data: MailEntryModel[];
  total: number;
  onSelect: (mid: string, mailData: MailEntryModel) => void;
  onLoadData: (start: number) => void;
  onRefresh: () => Promise<void>;
  visibleRefresh?: boolean;
  loading: boolean;
}) => {
  const { onSelect, onLoadData, total, data, onRefresh, visibleRefresh, loading } = props;
  // 邮件列表需要
  const [activeIds, setActiveIds] = useState<string[]>([]);
  // 设置邮件列表的
  const [scrollTop, setScrollTop] = useState<number | undefined>(0);
  // 是否展示邮件列表数据
  const visibleMailList = useMemo(() => data.length > 0 && !loading, [data.length, loading]);
  const handleReadFlagClick = useCallback((data: MailEntryModel) => {
    const { mark, id } = data.entry || {};
    eventApi.sendSysEvent({
      eventName: 'mailStatesChanged',
      eventData: {
        mark: mark === 'none',
        id: id,
        type: 'redFlag',
      },
      _account: data._account,
      eventStrData: mark === 'none' ? 'mark' : 'unmark',
    });
  }, []);
  const CardOperRedFlagWrap = useCallback(
    (_props: MailCardComProps) => (
      <span
        onClick={e => {
          e.stopPropagation();
          handleReadFlagClick(_props.data);
        }}
      >
        <CardOperRedFlag {..._props} />
      </span>
    ),
    [handleReadFlagClick]
  );
  // 自定义的邮件列表中卡片的展示样式
  const CustomMailCard = useCallback((_props: MailCardComProps) => {
    const isTask = _props?.data?.taskId != null;
    const VoidCom = () => <></>;
    return <MailCard {..._props} summaryExtra={!isTask ? CardOperRedFlagWrap : VoidCom} />;
  }, []);

  const throttleOnScroll = useThrottleForEvent(
    (param: { scrollTop: number }) => {
      setScrollTop(param.scrollTop);
    },
    400,
    {
      leading: true,
      trailing: true,
    }
  );

  const loadMoreRowsRef = useCreateCallbackForEvent(async (start: number) => {
    try {
      await onLoadData(start);
    } catch (error) {
      console.error('');
    }
  });

  useEffect(() => {
    if (loading) {
      setScrollTop(0);
    }
  }, [loading]);

  const listForceRender = useListDiffFouceRender(data, [], false, false);

  return (
    <>
      <div className={styles.mailList} hidden={!visibleMailList}>
        <AutoSizer>
          {({ height, width }) => {
            return (
              <MailMenuCardList
                height={height}
                card={CustomMailCard}
                rowHeight={getCardHeight}
                width={width}
                scrollTop={scrollTop}
                // onScroll={throttleOnScroll}
                onLoadMore={async (start: number) => {
                  await loadMoreRowsRef(start);
                  return;
                }}
                listFouceRender={listForceRender}
                total={total}
                batchSize={100}
                threshold={500}
                cardMargin={2}
                data={data}
                getUniqKey={getMailKey}
                onPullRefresh={onRefresh}
                activeId={activeIds}
                onSelect={(keys: string[], data: MailEntryModel) => {
                  setActiveIds(keys);
                  onSelect(keys[0], data);
                }}
              />
            );
          }}
        </AutoSizer>
      </div>
      <div className={styles.noDataWrap} hidden={visibleMailList}>
        <MailListEmpty isLoading={loading} visibleRefresh={visibleRefresh} onRefresh={onRefresh} />
      </div>
    </>
  );
};

export default CustomerMailRelatedBox;
