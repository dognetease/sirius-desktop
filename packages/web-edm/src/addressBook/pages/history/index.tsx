import React, { useEffect, useState } from 'react';
import { apiHolder, apis, AddressBookApi, ImportHistoryRow } from 'api';
import { Table, Space, Breadcrumb, Input, DatePicker } from 'antd';
import { ReactComponent as SearchIcon } from '@/images/icons/edm/search.svg';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import moment, { Moment } from 'moment';
import { debounce } from 'lodash';
import { navigate } from 'gatsby-link';
import classnames from 'classnames';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { getBodyFixHeight } from '@web-common/utils/constant';
import addressBookStyle from '../../addressBook.module.scss';
import style from './style.module.scss';
import { getIn18Text } from 'api';
interface Props {
  qs: Record<string, string>;
}
const { RangePicker } = DatePicker;
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
export const AddressHistoryIndex: React.FC<Props> = () => {
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<ImportHistoryRow[]>([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, pageSize: 20, total: 0 });
  const [search, setSearch] = useState({ importName: '', beginTime: '', endTime: '' });
  async function fetchList(reload = false) {
    try {
      setLoading(true);
      const res = await addressBookApi.getImportHistoryList({
        page: reload ? 1 : pageInfo.page,
        pageSize: pageInfo.pageSize,
        ...search,
      });
      if (res) {
        setTableData(res.list || []);
        setPageInfo(pre => ({ ...pre, total: res.total || 0 }));
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchList();
  }, [pageInfo.page, pageInfo.pageSize, search.beginTime, search.endTime, search.importName]);
  const columns = [
    {
      title: getIn18Text('DAORUMINGDANMINGCHENG'),
      dataIndex: 'importName',
      className: style.maxWidthCell,
      render: (_: string, row: ImportHistoryRow) => (
        <EllipsisTooltip>
          <span className={style.linkBtn} onClick={() => navigate(`#edm?page=addressHistoryDetail&id=${row.importId}`)}>
            {row.importName || '--'}
          </span>
        </EllipsisTooltip>
      ),
    },
    {
      title: getIn18Text('DAORURIQI'),
      width: 150,
      dataIndex: 'createTime',
      render: (createTime: string) => {
        if (+createTime) {
          return moment(+createTime).format('YYYY-MM-DD');
        }
        return '--';
      },
    },
    {
      title: getIn18Text('LIANXIRENSHU'),
      width: 100,
      dataIndex: 'addressNum',
    },
    {
      title: getIn18Text('YISHANCHURENSHU'),
      width: 110,
      dataIndex: 'deletedAddressNum',
    },
    {
      title: getIn18Text('CAOZUO'),
      fixed: 'right',
      width: 170,
      render: (_: string, row: ImportHistoryRow) => {
        return (
          <Space>
            <span
              className={style.linkBtn}
              onClick={() => {
                navigate('/#disk');
              }}
            >
              {getIn18Text('CHAKANYUNWENDANG')}
            </span>
          </Space>
        );
      },
    },
  ];
  function dateRangeChange(date: Moment[] | null) {
    let beginTime = date?.[0]?.format('YYYY-MM-DD') || '';
    let endTime = date?.[1]?.format('YYYY-MM-DD') || '';
    setSearch(pre => ({
      ...pre,
      beginTime,
      endTime,
    }));
  }
  const nameChange = debounce(function (value: string) {
    setSearch(pre => ({
      ...pre,
      importName: value,
    }));
  }, 500);
  return (
    <div className={classnames(style.container, addressBookStyle.addressBook)}>
      <div className={style.head}>
        <Breadcrumb separator=">">
          <Breadcrumb.Item onClick={() => navigate('#edm?page=addressBookIndex')}>{getIn18Text('YINGXIAOLIANXIREN')}</Breadcrumb.Item>
          <Breadcrumb.Item>{getIn18Text('LISHIDAORUMINGDAN')}</Breadcrumb.Item>
        </Breadcrumb>
        <div className={style.title}>{getIn18Text('LISHIDAORUMINGDAN')}</div>
      </div>
      <div className={style.search}>
        <div className={style.field}>
          <span className={style.label}>{getIn18Text('MINGDANMINGCHENG')}</span>
          <Input
            className={style.input}
            style={{ width: 184 }}
            placeholder={getIn18Text('QINGSHURU')}
            prefix={<SearchIcon />}
            suffix={null}
            allowClear
            onChange={({ target: { value } }) => nameChange(value)}
          />
        </div>
        <div className={style.field}>
          <span className={style.label}>{getIn18Text('DAORURIQI')}</span>
          <RangePicker
            className={style.input}
            separator={' - '}
            style={{ width: 230, verticalAlign: 'top' }}
            placeholder={[getIn18Text('KAISHIRIQI'), getIn18Text('JIESHURIQI')]}
            locale={cnlocale}
            format="yyyy-MM-DD"
            onChange={date => dateRangeChange(date as Moment[])}
            dropdownClassName="edm-date-picker-dropdown-wrap"
          />
        </div>
      </div>
      <div className={style.tableWrapper}>
        <Table
          className={classnames(addressBookStyle.table, addressBookStyle.tableDeepHead)}
          scroll={{ x: 'max-content', y: `calc(100vh - ${getBodyFixHeight(true) ? 352 : 384}px)` }}
          columns={columns}
          loading={loading}
          dataSource={tableData}
          rowKey="addressId"
          pagination={{
            className: 'pagination-wrap',
            size: 'small',
            current: pageInfo.page,
            pageSize: pageInfo.pageSize,
            pageSizeOptions: ['20', '50', '100'],
            showSizeChanger: true,
            disabled: loading,
            total: pageInfo.total,
            showTotal: (total: number) => (
              <span style={{ position: 'absolute', left: 0 }}>
                {getIn18Text('GONGDAORU')}
                {total}
                {getIn18Text('GEMINGDAN')}
              </span>
            ),
            onChange: (page, pageSize) =>
              setPageInfo(pre => ({
                ...pre,
                page,
                pageSize: pageSize as number,
              })),
          }}
        ></Table>
      </div>
    </div>
  );
};

export default AddressHistoryIndex;
