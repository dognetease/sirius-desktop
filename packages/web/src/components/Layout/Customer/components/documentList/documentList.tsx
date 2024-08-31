import React, { useState } from 'react';
import { CustomerConditionType, DocumentItem, ReqDocumentList, ResDocumentList } from 'api';
import moment from 'moment';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import { Select, DatePicker, Table } from 'antd';
import { ColumnsType, TablePaginationConfig } from 'antd/lib/table';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { formatFileSize } from '@web-common/utils/file';
import IconCard from '@web-common/components/UI/IconCard';
import { previewNosFile, syncDocument } from '../moments/upload';
import { readEmail } from '../contactEmails/contactEmails';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import style from './documentList.module.scss';
import { getIn18Text } from 'api';

export type DocumentListFilter = Omit<ReqDocumentList, 'condition' | 'condition_id'>;
export interface DocumentListProps {
  type: CustomerConditionType;
  sourceId: string;
  data?: ResDocumentList;
  startDate?: string;
  endDate?: string;
  onFilterChange?: (filter: DocumentListFilter) => void;
  onTitleClick?: (item: DocumentItem) => void;
  query?: string;
  source?: string;
  start_date?: string;
  end_date?: string;
  pagination?: {
    pageSize: number;
    current: number;
  };
  dataTracker: {
    trackDocOperation: (buttonname: string) => void;
    trackeDocFilter: (type: string) => void;
  };
}
const { RangePicker } = DatePicker;
const DOCUMENT_SOURCE_OPTIONS = [
  {
    value: 'follow',
    label: getIn18Text('GENJIN'),
  },
  {
    value: 'email_send',
    label: getIn18Text('FASONGYOUJIAN'),
  },
  {
    value: 'email_recv',
    label: getIn18Text('JIESHOUYOUJIAN'),
  },
];
const defaultPagination = {
  current: 1,
  pageSize: 20,
  pageSizeOptions: ['20', '50', '100'],
  showSizeChanger: true,
  className: 'pagination-wrap',
  locale: {
    items_per_page: getIn18Text('TIAO/YE'),
  },
};
export const DocumentList: React.FC<DocumentListProps> = props => {
  const { type, sourceId, data, startDate, endDate, source, query, pagination } = props;
  const [fileName, setFileName] = useState<string | undefined>(query);
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(e.target.value);
    if (fileName !== '' && e.target.value === '') {
      handleSearch(e.target.value);
    }
  };
  const handleSearch = (name?: string) => {
    props.onFilterChange &&
      props.onFilterChange({
        file_name: name === undefined ? fileName : '',
      });
    props.dataTracker?.trackeDocFilter('docSearch');
  };
  const handleSourceChange = (value: string) => {
    props.onFilterChange &&
      props.onFilterChange({
        source: value,
      });
    props.dataTracker?.trackeDocFilter('docType');
  };
  const handleTableChange = (pagination: TablePaginationConfig) => {
    props.onFilterChange &&
      props.onFilterChange({
        page: pagination.current,
        page_size: pagination.pageSize,
      });
  };
  const handleDateChange = (_: any, value: [string, string]) => {
    // const newFilter = {
    //   ...filters,
    //   start_time: value[0],
    //   end_time: value[1]
    // };
    // setFilters(newFilter);
    props.onFilterChange &&
      props.onFilterChange({
        start_time: value[0],
        end_time: value[1],
      });
    props.dataTracker?.trackeDocFilter('uploadTime');
  };
  const handleTitleClick = (item: DocumentItem) => {
    if (item.status !== 0) {
      previewNosFile(item.id, type, sourceId);
    } else {
      toast.warn({ content: getIn18Text('WENJIANZHENGZAITONGBUZHONG\uFF0CQINGSHAOHOUYULAN') });
      syncDocument(item.id, type);
    }
    props.dataTracker?.trackDocOperation('clickDocTitle');
  };
  const columns: ColumnsType<DocumentItem> = [
    {
      title: getIn18Text('WENDANGMINGCHENG'),
      dataIndex: 'file_name',
      render(title, item) {
        return (
          <div onClick={() => handleTitleClick(item)} style={{ cursor: 'pointer' }}>
            <IconCard type={item.file_type as any} width="20" height="20" style={{ marginRight: 8, verticalAlign: '-5px' }} />
            {title}
          </div>
        );
      },
    },
    {
      title: getIn18Text('DAXIAO'),
      dataIndex: 'size',
      render(size, item) {
        return formatFileSize(+item.size);
      },
    },
    {
      title: getIn18Text('YOUJIANMINGCHENG'),
      dataIndex: 'email_subject',
      onCellClick: item => {
        const params = {
          condition: type,
          [type + '_id']: sourceId,
          mailSnapshotId: item.email_snapshot_id,
        };
        readEmail(params as any);
      },
    },
    {
      title: getIn18Text('SHANGCHUANSHIJIAN'),
      dataIndex: 'create_time',
    },
  ];
  const paging = {
    ...defaultPagination,
    total: data?.total_size,
    ...pagination,
  };
  return (
    <div className={style.documentListWrap}>
      <div className={style.filters}>
        <div>
          <Input
            allowClear
            prefix={<SearchIcon />}
            placeholder={getIn18Text('QINGSHURUWENDANGMINGCHENG')}
            style={{ width: 190 }}
            value={fileName}
            onChange={handleQueryChange}
            // onClear={handleSearch}
            addonAfter={null}
            onPressEnter={() => handleSearch()}
            onBlur={() => handleSearch()}
          />
          <Select
            allowClear
            dropdownClassName="edm-selector-dropdown"
            placeholder={getIn18Text('QUANBULEIXING')}
            style={{ marginLeft: 8 }}
            options={DOCUMENT_SOURCE_OPTIONS}
            value={source}
            onChange={handleSourceChange}
          />
        </div>
        <RangePicker
          // separator={' - '}
          placeholder={[getIn18Text('KAISHISHIJIAN'), getIn18Text('JIESHUSHIJIAN')]}
          style={{ width: 230 }}
          format="YYYY-MM-DD"
          allowClear
          value={[startDate ? moment(startDate) : null, endDate ? moment(endDate) : null]}
          onChange={handleDateChange}
        />
      </div>
      <div>
        <Table
          size="small"
          columns={columns}
          dataSource={data ? data.content : []}
          scroll={{ x: 'max-content' }}
          pagination={data ? paging : false}
          onChange={handleTableChange}
          rowKey="id"
        />
      </div>
    </div>
  );
};
