import React, { useEffect, useState } from 'react';
import { Input, DatePicker, Table } from 'antd';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import { ReactComponent as SearchIcon } from '@/images/icons/edm/search.svg';
import { ReactComponent as RangeDate } from '@/images/icons/edm/range-date.svg';
import style from './index.module.scss';
import HistoryHeader from './historyHeader';
import { AddressBookApi, apiHolder, apis, PublicHistoryImportListResModel, PublicHistoryImportListRowModel, util } from 'api';
import { navigate } from 'gatsby-link';
import { ColumnsType } from 'antd/es/table';
import classnames from 'classnames';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { getBodyFixHeight } from '@web-common/utils/constant';
import addressBookStyle from '../../addressBook.module.scss';
import { getIn18Text } from 'api';
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const { RangePicker } = DatePicker;
const dateDisplayFormat = 'YYYY-MM-DD';
interface HistoryToolBarParams {
  name: string;
  date: [string, string];
}
const HistoryToolBar: React.FC<{
  fetching: boolean;
  emitFetch?: (params: HistoryToolBarParams) => void;
}> = props => {
  const [name, setName] = useState<HistoryToolBarParams['name']>('');
  const [rangeDate, setRangeDate] = useState<HistoryToolBarParams['date']>(['', '']);
  const sendFetch = () => {
    props.emitFetch &&
      props.emitFetch({
        name: name,
        date: rangeDate,
      });
  };
  const handleDateRangeChange = (_: any, dateString: [string, string]) => {
    setRangeDate(dateString);
  };
  useEffect(() => {
    sendFetch();
  }, [rangeDate]);
  return (
    <div className={style.toolBar}>
      <div className={style.item}>
        <label>{getIn18Text('MINGDANMINGCHENG')}</label>
        <Input
          style={{ width: 184 }}
          placeholder={getIn18Text('SOUSUO')}
          prefix={<SearchIcon />}
          value={name}
          allowClear
          readOnly={props.fetching}
          onPressEnter={() => sendFetch()}
          onBlur={() => sendFetch()}
          onChange={event => setName(event.target.value)}
        />
      </div>
      <div className={style.item}>
        <label>{getIn18Text('DAORURIQI')}</label>
        <RangePicker
          separator={' ~ '}
          style={{ width: 230 }}
          placeholder={[getIn18Text('KAISHIRIQI'), getIn18Text('JIESHURIQI')]}
          locale={cnlocale}
          format={dateDisplayFormat}
          suffixIcon={<RangeDate />}
          onChange={handleDateRangeChange}
          dropdownClassName="edm-date-picker-dropdown-wrap"
        />
      </div>
    </div>
  );
};
interface AddressBookPublicHistoryIndexProps {
  name?: string;
}
const AddressBookPublicHistoryIndex: React.FC<AddressBookPublicHistoryIndexProps> = props => {
  const [isFetching, setIsFetching] = useState(false);
  const [tableData, setTableData] = useState<PublicHistoryImportListRowModel[]>([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, pageSize: 20, total: 0 });
  const [filterParams, setFilterParams] = useState({ importName: '', beginTime: '', endTime: '' });
  const columns: ColumnsType<PublicHistoryImportListRowModel> = [
    {
      title: getIn18Text('DAORUMINGDANMINGCHENG'),
      dataIndex: 'importName',
      render(val: string, row: PublicHistoryImportListRowModel) {
        return (
          <EllipsisTooltip>
            <a
              onClick={e => {
                e.preventDefault();
                navigate(
                  `#edm?page=addressPublicHistoryDetail&importName=${val}&importId=${row.importId}&addressNum=${row.addressNum}&deletedAddressNum=${row.deletedAddressNum}`
                );
              }}
            >
              {val}
            </a>
          </EllipsisTooltip>
        );
      },
    },
    {
      title: getIn18Text('DAORURIQI'),
      dataIndex: 'createTime',
      render(val: number) {
        return util.formatDate(val);
      },
    },
    {
      title: getIn18Text('LIANXIRENSHU'),
      width: 110,
      dataIndex: 'addressNum',
    },
    {
      title: getIn18Text('YISHANCHURENSHU'),
      width: 110,
      dataIndex: 'deletedAddressNum',
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 150,
      render: (_: string, row: PublicHistoryImportListRowModel) => {
        return (
          <a
            onClick={() => {
              navigate('/#disk');
            }}
          >
            {getIn18Text('CHAKANYUNWENDANG')}
          </a>
        );
      },
    },
  ];
  const refreshTableListData = () => {
    setIsFetching(true);
    addressBookApi
      .getPublicHistoryList({
        ...filterParams,
        page: pageInfo.page,
        pageSize: pageInfo.pageSize,
      })
      .then((res: PublicHistoryImportListResModel) => {
        setTableData(res.list || []);
        setPageInfo({
          page: pageInfo.page,
          pageSize: pageInfo.pageSize,
          total: res.total,
        });
      })
      .finally(() => setIsFetching(false));
  };
  const handleToolBarFetchAction = (params: HistoryToolBarParams) => {
    setPageInfo({
      page: 1,
      pageSize: pageInfo.pageSize,
      total: 0,
    });
    setFilterParams({
      importName: params.name,
      beginTime: params.date[0],
      endTime: params.date[1],
    });
  };
  useEffect(() => {
    refreshTableListData();
  }, [filterParams, pageInfo.page, pageInfo.pageSize]);
  return (
    <div className={classnames(style.container, addressBookStyle.addressBook)}>
      <HistoryHeader
        paths={[
          { name: getIn18Text('DEZHIBUGONGHAI'), url: '#edm?page=addressBookIndex&defaultTabKey=openSea' },
          { name: getIn18Text('LISHIDAORUMINGDAN'), url: '' },
        ]}
        title={getIn18Text('LISHIDAORUMINGDAN')}
      />
      <div className={style.mainCont}>
        <HistoryToolBar fetching={isFetching} emitFetch={handleToolBarFetchAction} />

        <div className={style.tableWrapper}>
          <Table
            className={classnames(addressBookStyle.table, addressBookStyle.tableDeepHead)}
            scroll={{ y: `calc(100vh - ${getBodyFixHeight(true) ? 298 : 330}px)` }}
            columns={columns}
            loading={isFetching}
            dataSource={tableData}
            rowKey="importId"
            pagination={{
              className: 'pagination-wrap',
              size: 'small',
              current: pageInfo.page,
              pageSize: pageInfo.pageSize,
              pageSizeOptions: ['20', '50', '100'],
              showSizeChanger: true,
              disabled: isFetching,
              total: pageInfo.total,
              showTotal(total, range) {
                return (
                  <span style={{ position: 'absolute', left: 0 }}>
                    {getIn18Text('GONGDAORU')}
                    {total}
                    {getIn18Text('GEMINGDAN')}
                  </span>
                );
              },
              onChange: (page, pageSize) =>
                setPageInfo(pre => ({
                  ...pre,
                  page,
                  pageSize: pageSize as number,
                })),
            }}
          />
        </div>
      </div>
    </div>
  );
};
export default AddressBookPublicHistoryIndex;
