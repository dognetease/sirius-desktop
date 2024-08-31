import React, { forwardRef, useEffect, useState } from 'react';
import { Button, Input, Space, Table } from 'antd';
import { apiHolder, apis, CustomerApi, EdmBlacklistItem, ICustomerContactData, RequestEdmBlacklist, urlStore, AddressBookApi } from 'api';
import moment from 'moment';
// import { navigate } from '@reach/router';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { getTransText } from '@/components/util/translate';
import ContactPickerModal from './contactPickerModal';
import { ReactComponent as SearchIcon } from '@/images/icons/edm/search.svg';
import useDownLoad from '@/components/Layout/Customer/components/hooks/useDownLoad';
import { hasPrivilege } from '@/components/Layout/Customer/utils/privilegeValid';
import CustomerDetail from '@/components/Layout/Customer/NewClient/components/CustomerDetail/customerDetail';
import { getBodyFixHeight } from '@web-common/utils/constant';
import edmStyle from '../edm.module.scss';
import style from './blacklistTable.module.scss';
import { recordDataTracker } from '../addressBook/utils';
import { getIn18Text } from 'api';

// const addressBookApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;

export interface BlacklistRef {
  openContactPicker: () => void;
}

interface BlacklistTableProps {
  isEnterprise?: boolean;
}

const BlacklistTable = forwardRef<BlacklistRef, BlacklistTableProps>((props, ref) => {
  const { isEnterprise } = props;
  const [inputValue, setInputValue] = useState<string>('');
  const [chosen, setChosen] = useState<string[]>([]);
  const [data, setData] = useState<EdmBlacklistItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [fetching, setFetching] = useState<boolean>(false);
  const [adding, setAdding] = useState<boolean>(false);
  const [contactPickerVisible, setContactPickerVisible] = useState(false);
  const { downLoadTableExcel } = useDownLoad();
  const [customerDetail, setCustomerDetail] = useState({ visible: false, id: '' });

  const [params, setParams] = useState<RequestEdmBlacklist>({
    key: '',
    page: 1,
    page_size: 20,
  });

  useEffect(() => {
    setFetching(true);

    addressBookApi
      .getEdmBlacklist({
        ...params,
        isEnterprise,
      })
      .then(data => {
        setData(data.blacklists);
        setTotal(data.total_size);
      })
      .finally(() => {
        setFetching(false);
      });
  }, [params, isEnterprise]);

  const handleAddBlacklist = (contacts: ICustomerContactData[]) => {
    setAdding(true);

    const contact_list = contacts.map(contact => ({
      company_id: contact.company_id,
      company_name: contact.company_name,
      contact_id: contact.contact_id,
      contact_name: contact.contact_name,
      email: contact.email,
    })) as ICustomerContactData[];

    addressBookApi
      .addEdmBlacklist({ contact_list, isEnterprise })
      .then(() => {
        setParams({ ...params });
        setContactPickerVisible(false);
        Toast.success({ content: getIn18Text('TIANJIACHENGGONG') });
        recordDataTracker('pc_marketing_contactBook_black', {
          action: 'add',
        });
      })
      .finally(() => {
        setAdding(false);
      });
  };

  const columns = [
    {
      title: getIn18Text('YOUXIANG'),
      dataIndex: 'email',
      width: '20%',
      ellipsis: true,
    },
    {
      title: getIn18Text('LIANXIREN'),
      dataIndex: 'contact_name',
      width: '20%',
      ellipsis: true,
    },
    {
      title: getIn18Text('GONGSIMINGCHENG'),
      dataIndex: 'company_name',
      width: '30%',
      ellipsis: true,
    },
    {
      title: getIn18Text('TIANJIAREN'),
      dataIndex: 'create_acc_nickname',
      width: '20%',
      ellipsis: true,
    },
    {
      title: getIn18Text('TIANJIASHIJIAN'),
      dataIndex: 'create_at',
      width: '20%',
      ellipsis: true,
      render: (text: string) => moment(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: getIn18Text('CAOZUO'),
      dataIndex: 'options',
      width: '10%',
      render: (text: string, record: EdmBlacklistItem) => (
        <PrivilegeCheck accessLabel="DELETE" resourceLabel={isEnterprise ? 'EP_MARKET_BLACKLIST' : 'EDM'}>
          <span className={style.highlight} onClick={() => handleBlacklistRemove([record.email])}>
            {getIn18Text('YICHU')}
          </span>
        </PrivilegeCheck>
      ),
    },
  ];

  const handleSearch = (event: any) => {
    setParams({
      ...params,
      key: event.target.value,
      page: 1,
    });
  };

  const handleBlacklistRemove = (email_list: string[]) => {
    Modal.confirm({
      title: getIn18Text('QUEDINGCONGHEIMINGDANZHONGYICHU\uFF1F'),
      content: null,
      okText: getIn18Text('YICHU'),
      okButtonProps: { type: 'default', danger: true },
      onOk: () => {
        addressBookApi.removeEdmBlacklist({ email_list, isEnterprise }).then(() => {
          setParams({ ...params });
          Toast.success({ content: getIn18Text('YICHUCHENGGONG') });
          recordDataTracker('pc_marketing_contactBook_black', {
            action: 'remove',
          });
        });
      },
    });
  };

  const handleBlacklistRemoveBatch = () => {
    if (!chosen?.length) {
      Toast.error({ content: getIn18Text('QINGXUANZEYAOSHANCHUDESHUJU') });
      return;
    }
    Modal.confirm({
      title: getIn18Text('QUEDINGCONGHEIMINGDANZHONGPILIANGYICHU\uFF1F'),
      content: null,
      okText: getIn18Text('YICHU'),
      okButtonProps: { type: 'default', danger: true },
      onOk: () => {
        addressBookApi.removeEdmBlacklist({ email_list: chosen, isEnterprise }).then(() => {
          setParams({ ...params });
          setChosen([]);
          Toast.success({ content: getIn18Text('YICHUCHENGGONG') });
          recordDataTracker('pc_marketing_contactBook_black', {
            action: 'allRemove',
          });
        });
      },
    });
  };

  const handleExport = () => {
    const fileName = isEnterprise ? getTransText('QIYEYOUXIANGHEIMINGDAN') : getTransText('GERENYOUXIANGHEIMINGDAN');

    downLoadTableExcel(urlStore.get('addressBookExportBlacklist') as string, fileName, { isEnterprise });
    recordDataTracker('pc_marketing_contactBook_black', {
      action: 'download',
    });
  };

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: EdmBlacklistItem[]) => {
      setChosen(selectedRowKeys as string[]);
    },
    selectedRowKeys: chosen,
    preserveSelectedRowKeys: true,
  };

  return (
    <div className={style.blacklistTable}>
      <Input
        className={style.inputFilter}
        style={{ width: 328 }}
        placeholder={getIn18Text('QINGSHURUYOUXIANGDEZHI/LIANXIREN/GONGSIMINGCHENG')}
        prefix={<SearchIcon />}
        suffix={null}
        value={inputValue}
        allowClear
        readOnly={fetching}
        onBlur={handleSearch}
        onPressEnter={handleSearch}
        onChange={event => setInputValue(event.target.value)}
      />

      <div className={style.opWrapper}>
        {!!chosen.length && (
          <>
            <div className={style.selectTip}>
              {getTransText('YIXUANZE')} {chosen.length}
            </div>
            <Space style={{ flex: 1 }}>
              <PrivilegeCheck accessLabel="DELETE" resourceLabel={isEnterprise ? 'EP_MARKET_BLACKLIST' : 'EDM'}>
                <Button
                  type="primary"
                  style={{ border: 'none' }}
                  danger
                  onClick={() => {
                    handleBlacklistRemoveBatch();
                  }}
                >
                  {getTransText('BatchMoveout')}
                </Button>
              </PrivilegeCheck>
            </Space>
          </>
        )}
        <Space>
          <PrivilegeCheck accessLabel={isEnterprise ? 'EXPORT' : 'OP'} resourceLabel={isEnterprise ? 'EP_MARKET_BLACKLIST' : 'EDM'}>
            <Button
              onClick={() => {
                handleExport();
              }}
            >
              {getIn18Text('QUANBUDAOCHU')}
            </Button>
          </PrivilegeCheck>
          <PrivilegeCheck accessLabel="OP" resourceLabel={isEnterprise ? 'EP_MARKET_BLACKLIST' : 'EDM'}>
            <Button type="primary" onClick={() => setContactPickerVisible(true)}>
              {getTransText('AddEmailBlacklist')}
            </Button>
          </PrivilegeCheck>
        </Space>
      </div>

      <Table
        className={edmStyle.contactTable}
        columns={columns}
        dataSource={data}
        rowSelection={rowSelection}
        rowKey="email"
        pagination={{
          className: 'pagination-wrap',
          size: 'small',
          current: params.page,
          pageSize: params.page_size,
          pageSizeOptions: ['20', '50', '100'],
          showSizeChanger: true,
          disabled: fetching,
          total,
          showTotal: total => `共${total}条`,
        }}
        loading={fetching}
        onChange={pagination => {
          setParams(previous => ({
            ...params,
            page_size: pagination.pageSize as number,
            page: pagination.pageSize === previous.page_size ? (pagination.current as number) : 1,
          }));
        }}
        scroll={{ y: `calc(100vh - ${getBodyFixHeight(true) ? 438 : 470}px)` }}
      />
      <ContactPickerModal visible={contactPickerVisible} adding={adding} onCancel={() => setContactPickerVisible(false)} onOk={handleAddBlacklist} />

      <CustomerDetail
        visible={customerDetail.visible}
        companyId={customerDetail.id}
        onPrev={() => {}}
        onNext={() => {}}
        onClose={() => setCustomerDetail({ visible: false, id: '' })}
        prevDisabled={true}
        nextDisabled={true}
      />
    </div>
  );
});

export default BlacklistTable;
