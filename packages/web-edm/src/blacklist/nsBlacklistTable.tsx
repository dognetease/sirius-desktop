import React, { useState, useEffect, forwardRef } from 'react';
import { Input, Table, Button, Space } from 'antd';
import { apiHolder, apis, EdmNSBlacklistItem, RequestEdmBlacklist, urlStore, AddressBookApi } from 'api';
import moment from 'moment';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import DomainModal from './domainModal';
import { ReactComponent as SearchIcon } from '@/images/icons/edm/search.svg';
import useDownLoad from '@/components/Layout/Customer/components/hooks/useDownLoad';
import { getBodyFixHeight } from '@web-common/utils/constant';
import { getTransText } from '@/components/util/translate';
import edmStyle from '../edm.module.scss';
import style from './blacklistTable.module.scss';
import { getIn18Text } from 'api';

// const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;

export interface BlacklistRef {
  openContactPicker: () => void;
}

export interface DomainBlacklistTableProps {
  isEnterprise?: boolean;
}

const DomainBlacklistTable = forwardRef<BlacklistRef, DomainBlacklistTableProps>((props, ref) => {
  const { isEnterprise } = props;
  const [inputValue, setInputValue] = useState<string>('');
  const [chosen, setChosen] = useState<string[]>([]);
  const [data, setData] = useState<EdmNSBlacklistItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [fetching, setFetching] = useState<boolean>(false);
  const [adding, setAdding] = useState<boolean>(false);
  const [contactPickerVisible, setContactPickerVisible] = useState(false);
  const { downLoadTableExcel } = useDownLoad();

  const [params, setParams] = useState<RequestEdmBlacklist>({
    key: '',
    page: 1,
    page_size: 20,
  });

  useEffect(() => {
    setFetching(true);

    addressBookApi
      .getEdmNSBlacklist({
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

  const handleAddBlacklist = (domainList: string) => {
    setAdding(true);

    addressBookApi
      .addEdmNSBlacklist({ domainList, isEnterprise })
      .then(() => {
        setParams({ ...params });
        setContactPickerVisible(false);
        Toast.success({ content: getIn18Text('TIANJIACHENGGONG') });
      })
      .finally(() => {
        setAdding(false);
      });
  };

  const columns = [
    {
      title: getIn18Text('YUMING'),
      dataIndex: 'domain',
      width: '29%',
      ellipsis: true,
    },
    {
      title: getIn18Text('TIANJIAREN'),
      dataIndex: 'createAccNickname',
      width: '29%',
      ellipsis: true,
    },

    {
      title: getIn18Text('TIANJIASHIJIAN'),
      dataIndex: 'createAt',
      width: '29%',
      ellipsis: true,
      render: (text: string) => moment(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: getIn18Text('CAOZUO'),
      dataIndex: 'options',
      width: '10%',
      render: (text: string, record: EdmNSBlacklistItem) => (
        <PrivilegeCheck accessLabel="DELETE" resourceLabel={isEnterprise ? 'EP_MARKET_BLACKLIST' : 'EDM'}>
          <span className={style.highlight} onClick={() => handleBlacklistRemove([record.domain])}>
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

  const handleBlacklistRemove = (domainList: string[]) => {
    Modal.confirm({
      title: getIn18Text('QUEDINGCONGHEIMINGDANZHONGYICHU\uFF1F'),
      content: null,
      okText: getIn18Text('YICHU'),
      okButtonProps: { type: 'default', danger: true },
      onOk: () => {
        addressBookApi.removeEdmNSBlacklist({ domainList, isEnterprise }).then(() => {
          setParams({ ...params });
          Toast.success({ content: getIn18Text('YICHUCHENGGONG') });
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
        addressBookApi.removeEdmNSBlacklist({ domainList: chosen, isEnterprise }).then(() => {
          setParams({ ...params });
          setChosen([]);
          Toast.success({ content: getIn18Text('YICHUCHENGGONG') });
        });
      },
    });
  };

  // rowSelection object indicates the need for row selection
  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: EdmNSBlacklistItem[]) => {
      setChosen(selectedRowKeys as string[]);
    },
    selectedRowKeys: chosen,
  };

  const handleExport = () => {
    const fileName = isEnterprise ? getTransText('QIYEYUMINGHEIMINGDAN') : getTransText('GERENYUMINGHEIMINGDAN');

    downLoadTableExcel(urlStore.get('addressBookExportNSBlacklist') as string, fileName, { isEnterprise });
  };

  return (
    <div className={style.blacklistTable}>
      <Input
        className={style.inputFilter}
        style={{ width: 328 }}
        placeholder={getIn18Text('QINGSHURUYUMING')}
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
                  {getIn18Text('PILIANGSHANCHU')}
                </Button>
              </PrivilegeCheck>
            </Space>
          </>
        )}
        <Space>
          <PrivilegeCheck accessLabel={isEnterprise ? 'EXPORT' : 'OP'} resourceLabel={isEnterprise ? 'EP_MARKET_BLACKLIST' : 'EDM'}>
            <Button
              style={{ float: 'right' }}
              onClick={() => {
                handleExport();
              }}
            >
              {getIn18Text('QUANBUDAOCHU')}
            </Button>
          </PrivilegeCheck>
          <PrivilegeCheck accessLabel="OP" resourceLabel={isEnterprise ? 'EP_MARKET_BLACKLIST' : 'EDM'}>
            <Button style={{ float: 'right' }} type="primary" onClick={() => setContactPickerVisible(true)}>
              {getTransText('AddDomainBlacklist')}
            </Button>
          </PrivilegeCheck>
        </Space>
      </div>

      <Table
        className={edmStyle.contactTable}
        columns={columns}
        dataSource={data}
        rowSelection={{
          type: 'checkbox',
          ...rowSelection,
        }}
        rowKey="domain"
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
      <DomainModal visible={contactPickerVisible} adding={adding} onCancel={() => setContactPickerVisible(false)} onOk={handleAddBlacklist} />
    </div>
  );
});

export default DomainBlacklistTable;
