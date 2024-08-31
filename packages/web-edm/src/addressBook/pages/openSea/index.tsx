import React, { useState, useEffect, useReducer, useRef } from 'react';
import moment from 'moment';
import classnames from 'classnames';
import { ConfigProvider, Button, Dropdown, Menu, Input, message, Popover, Space, Tooltip } from 'antd';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import EllipsisOutlined from '@ant-design/icons/EllipsisOutlined';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import {
  apiHolder,
  apis,
  AddressBookApi,
  IAddressBookOpenSeaDetail,
  AddressBookContactAddressType,
  AddressBookContactSourceType,
  urlStore,
  IAddressBookOpenSeaListReq,
  IAddressBookOpenSeaListRes,
  AddressRepeatedAction,
} from 'api';
import { renderCompanyAndSiteCell } from '../../utils';
import useDownLoad from '@/components/Layout/Customer/components/hooks/useDownLoad';
import ContactsFilter from '../../components/Contacts/contactsFilter';
import DistributeClueStatusModal from '@/components/Layout/Customer/components/DistributeClueModal/distributeClueStatus';
import { AddContact } from '../../views/AddContact/index';
import { ContactDetail } from '../../views/OpenSeaContactDetail/index';
import MarketHistory from '../../components/MarketHistory';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import NationFlag from '@/components/Layout/CustomsData/components/NationalFlag/index';
import { getBodyFixHeight } from '@web-common/utils/constant';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { getModuleAccessSelector, getIsFreeVersionUser } from '@web-common/state/reducer/privilegeReducer';
import { useAppSelector } from '@web-common/state/createStore';
import { ReactComponent as ArrowDown } from '@/images/icons/edm/addressBook/arrow-down.svg';
import { ReactComponent as CompanySearchIcon } from '@/images/icons/edm/addressBook/company-search.svg';
import { ReactComponent as CustomerIcon } from '@/images/icons/edm/addressBook/customer-icon.svg';
import addressBookStyle from '../../addressBook.module.scss';
import styles from './index.module.scss';
import { navigate } from 'gatsby-link';
import '../../addressBookTableDrop.scss';
import { getEmailStatusText, exportDisabledFrequent, setLastExportTime, getExportDisabledRemainTime } from '../../utils';
import { edmDataTracker } from '../../../tracker/tracker';
import { downloadFile } from '@web-common/components/util/file';
import Table from '@/components/Layout/Customer/components/UI/Table/table';
import { BatchOperate, createMulSelectInfos } from '../../batchOperate';
import UniDrawer from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import Sorter, { SorterValue } from '../../components/Contacts/sorter';
import variables from '@web-common/styles/export.module.scss';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';
import SeaReceiveModal from '../../components/SeaReceiveModal';

const batchOp = new BatchOperate('opensea');

const httpApi = apiHolder.api.getDataTransApi();

const sendDataTracker = (action: string) => {
  edmDataTracker.track('waimao_address_book_sea_btn', {
    action,
  });
};

function formatDate(date: string, format: string = 'YYYY-MM-DD') {
  return date ? moment(date).format(format) : '';
}
const COUNTRY_MAP = require('../../views/ContactDetail/countryMap.json');
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const defaultPage = {
  current: 1,
  pageSize: 20,
  total: 0,
};
type Page = typeof defaultPage;
const defaultContact = {
  visible: false,
  id: 0,
};
type Contact = typeof defaultContact;
interface Props {
  showTitle?: boolean;
  containerStyles?: Record<string, any>;
  showActionsRightBlock?: boolean;
  showImportName?: boolean;
  scrollHeight?: string | number;
  extPaginationConfig?: TablePaginationConfig;
  fetchMemberList?: (params: IAddressBookOpenSeaListReq) => Promise<IAddressBookOpenSeaListRes>;
}
const OpenSea = (props: Props) => {
  const hasOp = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'ADDRESS_OPEN_SEA', 'OP'));
  const hasAllot = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'ADDRESS_OPEN_SEA', 'ALLOT'));
  const hasDelete = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'ADDRESS_OPEN_SEA', 'DELETE'));
  const {
    showTitle = true,
    containerStyles = {},
    showActionsRightBlock = true,
    showImportName = true,
    scrollHeight,
    extPaginationConfig = {},
    fetchMemberList = null,
  } = props;
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [assignKeys, setAssignKeys] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IAddressBookOpenSeaDetail[]>([]);
  const [page, setPage] = useReducer((state: Page, newState: Partial<Page>) => ({ ...state, ...newState }), defaultPage);
  const [searchParam, setSearchParam] = useState<any>();
  const [sort, setSort] = useState<SorterValue | undefined>(undefined);
  const [importName, setImportName] = useState<string>('');
  const [addContactVisible, setAddContactVisible] = useState(false);
  const [assignVisible, setAssignVisible] = useState(false);
  const [contact, setContact] = useReducer((state: Contact, newState: Partial<Contact>) => ({ ...state, ...newState }), defaultContact);
  const { downloadTemplate } = useDownLoad();

  const [receiveIds, setReceiveIds] = useState<number[]>([]);
  const [receiveTitle, setReceiveTitle] = useState<string>('');
  const [receiveVisible, setReceiveVisible] = useState<boolean>(false);

  const [batchLoading, setBatchLoading] = useState(false);
  const [mulSelectMenu, setMulSelectMenu] = useState<ReturnType<typeof createMulSelectInfos>>([]);
  const items = [
    {
      key: 'receive',
      label: getIn18Text('LINGQU'),
      visible: hasOp,
    },
    {
      key: 'assign',
      label: getIn18Text('FENPEI'),
      visible: hasAllot,
    },
    {
      key: 'delete',
      danger: true,
      label: getIn18Text('SHANCHULIANXIREN'),
      visible: hasDelete,
    },
  ];
  const getMenu = (id: number) => {
    const callback = ({ key }) => {
      switch (key) {
        case 'receive':
          sendDataTracker('receive');
          handleReceiveClue([id]);
          break;
        case 'assign':
          sendDataTracker('distribution');
          openAssignModal([id]);
          break;
        case 'delete':
          sendDataTracker('delete_contact');
          handleDelete([id]);
          break;
        default:
          break;
      }
    };
    return (
      <Menu onClick={callback}>
        {items
          .filter(item => item.visible)
          .map(item => (
            <Menu.Item {...item}>{item.label}</Menu.Item>
          ))}
      </Menu>
    );
  };
  const columns: ColumnsType<IAddressBookOpenSeaDetail> = [
    {
      title: getIn18Text('LIANXIFANGSHI'),
      dataIndex: 'contact',
      fixed: 'left',
      className: classnames(styles.minWidthCell, styles.maxWidthCell, styles.oneIndex),
      width: 150,
      render(value, record) {
        const countryInEnglish: string | undefined = COUNTRY_MAP[record.contactInfo.country];
        const flag = countryInEnglish && (
          <span>
            <NationFlag style={{ marginLeft: 4 }} name={countryInEnglish} showLabel={false} />
          </span>
        );
        const uniCustomerId = record.customerInfo?.uniCustomerId;
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', width: '100%' }}>
            <EllipsisTooltip>{`${record.addressInfo.contactAddressInfo}`}</EllipsisTooltip>
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
                    setUniDrawerVisible(true);
                    setUniDrawerRecordId(uniCustomerId);
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
      className: classnames(styles.minWidthCell, styles.maxWidthCell),
      width: 120,
      render: value => (
        <div style={{ display: 'inline-flex', alignItems: 'center', width: '100%' }}>
          <EllipsisTooltip>{value || '-'}</EllipsisTooltip>
        </div>
      ),
    },
    {
      title: getIn18Text('DAORUMINGDAN'),
      dataIndex: 'importName',
      width: 60,
      className: classnames(styles.minWidthCell, styles.maxWidthCell),
      render: value => (
        <div style={{ display: 'inline-flex', alignItems: 'center', width: '100%' }}>
          <EllipsisTooltip>{value || '-'}</EllipsisTooltip>
        </div>
      ),
    },
    {
      title: getIn18Text('YINGXIAOLISHI'),
      dataIndex: 'edmHistory',
      className: classnames(styles.minWidthCell, styles.maxWidthCell),
      render: (value, record) => {
        if (!record.marketingInfo) return getIn18Text('WEIFAXIN');

        return (
          <Popover
            trigger="click"
            placement="bottomLeft"
            destroyTooltipOnHide
            content={<MarketHistory style={{ width: 600, padding: 20 }} contactEmail={record.addressInfo.contactAddressInfo} />}
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
      className: classnames(styles.minWidthCell, styles.maxWidthCell, styles.companyNameCell),
      render: (text: string, item) => {
        const { companyName } = item.contactInfo;

        return companyName ? (
          <div style={{ display: 'inline-flex', maxWidth: '100%', alignItems: 'center', margin: '-3px 0' }}>
            <EllipsisTooltip>{companyName}</EllipsisTooltip>
            <Tooltip title={getIn18Text('ANGONGSIMINGCHENGSHAIXUAN')}>
              <span className={styles.companySearchIconWrapper} onClick={() => filterRef.current?.searchByCompanyName(companyName)}>
                <CompanySearchIcon className={styles.companySearchIcon} />
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
      width: 120,
      className: classnames(styles.minWidthCell, styles.maxWidthCell),
      render: (text: string, item) => {
        const { companySite } = item.contactInfo;
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
      className: classnames(styles.minWidthCell, styles.maxWidthCell, styles.companyNameCell),
      render: (text: string, item) => {
        const { jobTitle } = item.contactInfo;

        return jobTitle ? (
          <div style={{ display: 'inline-flex', maxWidth: '100%', alignItems: 'center', margin: '-3px 0' }}>
            <EllipsisTooltip>{jobTitle}</EllipsisTooltip>
            <Tooltip title={getIn18Text('ANZHIWEISHAIXUAN')}>
              <span className={styles.companySearchIconWrapper} onClick={() => filterRef.current?.searchByJobTitle(jobTitle)}>
                <CompanySearchIcon className={styles.companySearchIcon} />
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
      render(value) {
        return AddressBookContactSourceType[value];
      },
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
      width: 150,
      className: classnames(styles.minWidthCell, styles.maxWidthCell),
      render(type: number) {
        return getEmailStatusText(type);
      },
    },
    {
      title: getIn18Text('JINRUGONGHAIRIQI'),
      width: 200,
      dataIndex: ['contactInfo', 'createTime'],
      render(value) {
        return formatDate(value);
      },
    },
    {
      title: getIn18Text('ZUIJINGENGXINSHIJIAN'),
      dataIndex: ['addressInfo', 'updateTime'],
      width: 200,
      render(value) {
        return formatDate(value, 'YYYY-MM-DD HH:mm');
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      key: 'operation',
      fixed: 'right',
      className: styles.operate,
      render: (text, row) => (
        <Space size={16}>
          <a
            onClick={() => {
              sendDataTracker('detail');
              setContact({ visible: true, id: row.id });
            }}
          >
            {getIn18Text('XIANGQING')}
          </a>
          {(hasOp || hasAllot || hasDelete) && (
            <Dropdown overlayClassName="address_contact_dropdown" overlay={getMenu(row.id)} placement="bottomRight">
              <a onClick={e => e.preventDefault()}>
                {getIn18Text('GENGDUO')}
                <ArrowDown style={{ marginBottom: -3 }} />
              </a>
            </Dropdown>
          )}
        </Space>
      ),
    },
  ];
  const onSelectChange = (newSelectedRowKeys: number[]) => {
    console.log('selectedRowKeys changed: ', selectedRowKeys);
    if (newSelectedRowKeys.length <= 1000) {
      setSelectedRowKeys(newSelectedRowKeys);
    }
  };
  const rowSelection = {
    fixed: true,
    selectedRowKeys,
    onChange: onSelectChange,
    preserveSelectedRowKeys: true,
    selections: mulSelectMenu.map(ele => {
      return {
        key: ele.text,
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
            const handler = fetchMemberList || addressBookApi.addressBookOpenSeaList.bind(addressBookApi);
            handler({
              importName,
              contactAddressType: AddressBookContactAddressType.EMAIL,
              page: ele.type === 'origin' ? page.current : ele.page,
              pageSize: ele.type === 'origin' ? page.pageSize : ele.pageSize,
              searchParam: searchParam,
              sort,
            })
              .then(res => {
                batchOp.setLongList(res.list || [], res.total || 0);
                setSelectedRowKeys(batchOp.getOpenSeaIds());
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
  };
  const hasSelected = selectedRowKeys.length > 0;
  // 领取线索(批量/单个)
  const handleReceiveClue = (ids: number[]) => {
    setContact({
      visible: false,
    });
    let title = '';
    if (ids.length > 1) {
      title = `确定领取${ids.length}个联系人？`;
    } else if (ids.length === 1) {
      const [id] = ids;
      const found = data.find(item => item.id === id);
      if (found) {
        title = `确定领取${found.addressInfo.contactAddressInfo}？`;
      }
    }
    setReceiveIds(ids);
    setReceiveTitle(title);
    setReceiveVisible(true);
  };
  // 打开分配(批量/单个)弹窗
  const openAssignModal = (ids: number[]) => {
    setContact({
      visible: false,
    });
    setAssignVisible(true);
    setAssignKeys(ids);
  };
  const handleAssign = (managerId: string, action: AddressRepeatedAction) => {
    addressBookApi
      .addressBookOpenSeaAssign({
        ids: assignKeys,
        managerId,
        addressRepeatedAction: action,
      })
      .then(() => {
        setAssignKeys([]);
        removeIdsFromSelectedRowKeys(assignKeys);
        toast.success(getIn18Text('FENPEICHENGGONG'));
        setAssignVisible(false);
        query();
      });
  };
  const removeIdsFromSelectedRowKeys = (ids: number[]) => {
    setSelectedRowKeys(selectedRowKeys.filter(id => !ids.includes(id)));
  };
  // 删除(批量/单个)
  const handleDelete = (ids: number[]) => {
    setContact({
      visible: false,
    });
    let title = '';
    if (ids.length > 1) {
      title = `确定删除${ids.length}个联系人？`;
    } else if (ids.length === 1) {
      const [id] = ids;
      const found = data.find(item => item.id === id);
      if (found) {
        title = `确定删除${found.addressInfo.contactAddressInfo}？`;
      }
    }
    Modal.confirm({
      title,
      content: getIn18Text('LIANXIRENJIANGCHEDISHANCHU\uFF0CWUFAHAIYUAN'),
      okButtonProps: {
        danger: true,
      },
      okText: getIn18Text('SHANCHU'),
      onOk: () => {
        addressBookApi
          .addressBookOpenSeaDelete(ids)
          .then(isDelete => {
            if (isDelete) {
              message.success(getIn18Text('SHANCHUCHENGGONG'));
              setContact({ visible: false });
              removeIdsFromSelectedRowKeys(ids);
            } else {
              message.error(getIn18Text('SHANCHUSHIBAI'));
            }
            query();
          })
          .catch(err => console.error(err));
      },
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

  const isFreeVersionUser = useAppSelector(state => getIsFreeVersionUser(state.privilegeReducer));
  const hasExport = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'ADDRESS_OPEN_SEA', 'EXPORT'));

  const handleContactsExport = (ids: number[]) => {
    setLastExportTime();
    setExportDisabled(true);

    exportDisabledTimer.current = setTimeout(() => {
      setExportDisabled(false);
    }, exportDisabledFrequent);

    addressBookApi.exportContactsCheckOpenSea({ openSeaIds: ids }).then(({ isAsync }) => {
      if (isAsync) {
        toast.open({ content: getTransText('SHUJUZHENGZAIDAOCHU，DAOCHUWANCHENGHUIFASONGXIAOXITONGZHI') });
      } else {
        const url = urlStore.get('addressBookExportContactsUrlOpenSea') as string;

        httpApi
          .post(
            url,
            { openSeaIds: ids },
            {
              responseType: 'blob',
              contentType: 'json',
            }
          )
          .then(res => {
            const blob = res.rawData;
            const fileName = `地址簿公海导出联系人-${new Date().toLocaleString()}.xlsx`;

            downloadFile(blob, fileName);
          });
      }
    });
  };

  const query = () => {
    setLoading(true);
    const sendQuery = fetchMemberList ? fetchMemberList : addressBookApi.addressBookOpenSeaList.bind(addressBookApi);
    sendQuery({
      importName,
      contactAddressType: AddressBookContactAddressType.EMAIL,
      page: page.current,
      pageSize: page.pageSize,
      searchParam: searchParam,
      sort,
    })
      .then(res => {
        const total = res.total || 0;
        setData(res.list);
        setPage({
          total,
        });
        if (total > 0) {
          setMulSelectMenu(createMulSelectInfos(total));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(() => {
    query();
  }, [page.current, page.pageSize]);
  useEffect(() => {
    setPage({ current: 1 });
    query();
  }, [searchParam, sort]);
  const filterRef = useRef<any>(null);
  const [uniDrawerVisible, setUniDrawerVisible] = useState<boolean>(false);
  const [uniDrawerRecordId, setUniDrawerRecordId] = useState<string | undefined>(undefined);
  const resetUniDrawer = () => {
    setUniDrawerVisible(false);
    setUniDrawerRecordId(undefined);
  };
  return (
    <>
      <div className={classnames(styles.container, addressBookStyle.addressBook)} style={{ ...containerStyles }}>
        <ContactsFilter
          ref={filterRef}
          extraContent={
            showImportName && (
              <Input
                placeholder={getIn18Text('SOUSUOMINGDAN')}
                allowClear
                prefix={<SearchOutlined style={{ color: '#A9B2C2' }} />}
                style={{ width: 184, marginLeft: 24 }}
                value={importName}
                onChange={e => setImportName(e.target.value)}
                onPressEnter={query}
              />
            )
          }
          dataTrackerKey={{
            filter: 'waimao_address_book_sea_filter',
            advancedFilter: 'waimao_address_book_sea_advanced_filter',
          }}
          onChange={(type, filters) => {
            setSearchParam(filters.searchParam);
            setSort(undefined);
            setSelectedRowKeys([]);
          }}
        />
        <div
          style={{
            padding: '20px 20px 0',
            backgroundColor: '#FFF',
            border: `1px solid ${variables.line1}`,
            borderRadius: 4,
            marginTop: 12,
          }}
        >
          {showActionsRightBlock || selectedRowKeys.length > 0 ? (
            <ConfigProvider autoInsertSpaceInButton={false}>
              <div className={styles.actions}>
                <div className={styles.leftBlock}>
                  {hasSelected && (
                    <>
                      <span style={{ marginRight: 12 }}>
                        {getIn18Text('YIXUAN')}
                        {selectedRowKeys.length}
                      </span>
                      <PrivilegeCheck accessLabel="OP" resourceLabel="ADDRESS_OPEN_SEA">
                        <Button
                          type="primary"
                          onClick={() => {
                            sendDataTracker('receive');
                            handleReceiveClue(selectedRowKeys);
                          }}
                        >
                          {getIn18Text('LINGQU')}
                        </Button>
                      </PrivilegeCheck>
                      <PrivilegeCheck accessLabel="ALLOT" resourceLabel="ADDRESS_OPEN_SEA">
                        <Button
                          className={styles.gray}
                          onClick={() => {
                            sendDataTracker('distribution');
                            openAssignModal(selectedRowKeys);
                          }}
                        >
                          {getIn18Text('FENPEI')}
                        </Button>
                      </PrivilegeCheck>
                      <Dropdown
                        overlayClassName="address_contact_dropdown"
                        overlay={
                          <Menu>
                            {(isFreeVersionUser || hasExport) && (
                              <Menu.Item disabled={exportDisabled} onClick={() => handleContactsExport(selectedRowKeys)}>
                                {getIn18Text('DAOCHU')}
                              </Menu.Item>
                            )}
                            <Menu.Item
                              danger
                              onClick={() => {
                                handleDelete(selectedRowKeys);
                                sendDataTracker('delete_contact');
                              }}
                            >
                              {getIn18Text('PILIANGSHANCHU')}
                            </Menu.Item>
                          </Menu>
                        }
                      >
                        <Button style={{ minWidth: 'auto', padding: '2.4px 0' }} icon={<EllipsisOutlined />} />
                      </Dropdown>
                    </>
                  )}
                  <Sorter
                    style={{ marginLeft: hasSelected ? 12 : 0 }}
                    value={sort}
                    onChange={nextSort => {
                      batchOp.clear();
                      setSelectedRowKeys([]);
                      setSort(nextSort);
                    }}
                  />
                </div>
                {showActionsRightBlock && (
                  <div className={styles.rightBlock}>
                    <Button
                      className={styles.gray}
                      onClick={() => {
                        sendDataTracker('history_import_list');
                        navigate(`#edm?page=addressPublicHistoryIndex`);
                      }}
                    >
                      {getIn18Text('LISHIDAORUMINGDAN')}
                    </Button>
                    <PrivilegeCheck accessLabel="OP" resourceLabel="ADDRESS_OPEN_SEA">
                      <Button
                        type="primary"
                        onClick={() => {
                          sendDataTracker('new_contact');
                          setAddContactVisible(true);
                        }}
                      >
                        {getIn18Text('XINJIAN')}
                      </Button>
                    </PrivilegeCheck>
                  </div>
                )}
              </div>
            </ConfigProvider>
          ) : (
            <Sorter
              style={{ marginBottom: 12 }}
              value={sort}
              onChange={nextSort => {
                batchOp.clear();
                setSelectedRowKeys([]);
                setSort(nextSort);
              }}
            />
          )}
          <div className={styles.table}>
            <ConfigProvider prefixCls="__address_antd_dropdown ant">
              <Table
                className={addressBookStyle.table}
                loading={loading || batchLoading}
                rowKey={record => record.id}
                rowSelection={rowSelection}
                columns={columns}
                dataSource={data}
                scroll={{ x: 'max-content', y: scrollHeight || `calc(100vh - ${getBodyFixHeight(true) ? 400 : 432}px)` }}
                pagination={{
                  className: 'pagination-wrap',
                  size: 'small',
                  ...page,
                  ...extPaginationConfig,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  pageSizeOptions: ['20', '50', '100'],
                  showTotal: (total: number) => (
                    <span style={{ position: 'absolute', left: 0 }}>
                      {getIn18Text('GONGDAORU')}
                      {total}
                      {getIn18Text('GELIANXIREN')}
                    </span>
                  ),
                }}
                onChange={pagination => {
                  setPage(pagination);
                }}
              />
            </ConfigProvider>
          </div>
        </div>
        <AddContact
          visible={addContactVisible}
          id="openSeaModal"
          hideGroup={true}
          hideRepeatedAction
          title={getIn18Text('XINJIANGONGHAILIANXIREN')}
          uploadContactsByFile={(params, file) => {
            params.set('file', file);
            edmDataTracker.track('waimao_address_book_sea_new', {
              action: 'file_to_import',
            });
            return addressBookApi.addressBookOpenSeaFileImport(params);
          }}
          uploadByPaste={params => {
            edmDataTracker.track('waimao_address_book_sea_new', {
              action: 'copy_and_paste',
            });
            return addressBookApi.addressBookOpenSeaTextImport(params);
          }}
          downloadTemplate={() => downloadTemplate(urlStore.get('addressBookOpenSeaTemplate') as string, getIn18Text('DEZHIBUGONGHAIDAORUMOBAN'))}
          onSuccess={(id, res) => {
            setAddContactVisible(false);
            query();
          }}
          onError={() => {}}
          onClose={() => setAddContactVisible(false)}
        />
        <ContactDetail
          id="contactDetailModal"
          visible={contact.visible}
          contactId={contact.id}
          onSuccess={() => {
            setContact({ visible: false });
          }}
          onError={() => {}}
          onClose={() => {
            setContact({ visible: false });
          }}
          onDelete={() => {
            handleDelete([contact.id]);
          }}
          onAssign={() => {
            openAssignModal([contact.id]);
          }}
          onReceive={() => {
            handleReceiveClue([contact.id]);
          }}
        />
        {assignVisible && (
          <DistributeClueStatusModal
            visible={assignVisible}
            ids={assignKeys.map(item => String(item))}
            onCancel={() => setAssignVisible(false)}
            onSubmit={params => {
              handleAssign(params.manager_id, params.action);
            }}
            getContainer={() => document.body}
          />
        )}
        <SeaReceiveModal
          visible={receiveVisible}
          title={receiveTitle}
          onCancel={() => {
            setReceiveIds([]);
            setReceiveTitle('');
            setReceiveVisible(false);
          }}
          onSubmit={async action => {
            await addressBookApi.addressBookOpenSeaReceiveNew({ ids: receiveIds, addressRepeatedAction: action });
            toast.success(getIn18Text('LINGQUCHENGGONG'));
            removeIdsFromSelectedRowKeys(receiveIds);
            query();
            setReceiveIds([]);
            setReceiveTitle('');
            setReceiveVisible(false);
          }}
        />
        <UniDrawer
          visible={uniDrawerVisible}
          customerId={uniDrawerRecordId as any as number}
          source="addressBook"
          onClose={resetUniDrawer}
          onSuccess={() => {
            resetUniDrawer();
            query();
            toast.success(getIn18Text('BIANJICHENGGONG！'));
          }}
        />
      </div>
    </>
  );
};
export default OpenSea;
