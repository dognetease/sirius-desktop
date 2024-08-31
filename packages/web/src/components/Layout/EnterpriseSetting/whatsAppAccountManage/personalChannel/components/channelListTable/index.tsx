import React from 'react';
import { Divider, Pagination } from 'antd';
import { ChannelBindItem, ChannelListItem, ModeType } from 'api';
import moment from 'moment';
import { TablePaginationConfig } from 'antd/lib/table/interface';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import { ColumnsType } from 'antd/lib/table';
import UserItem from '../userItem';

import styles from './style.module.scss';
import { useAppSelector } from '@web-common/state/createStore';

interface Props {
  total: number;
  distributionList: ChannelListItem[];
  pagination: TablePaginationConfig;
  onPaginationChange: (pagination: TablePaginationConfig) => void;
  onReassign: (accId: number) => void;
  onUnbind: (accId: number) => void;
  loading: boolean;
}

interface ChannelTableColumns {
  accountName: string;
  accountId: number;
  avatarUrl: string;
  bindWhatsApps: ChannelBindItem[];
  time: number;
  quota: number;
  leftQuota: number;
}

const ChannelListTable: React.FC<Props> = ({ distributionList, pagination, total, onPaginationChange, onReassign, onUnbind, loading }) => {
  const modeType = useAppSelector(state => state.globalReducer.waModeType);
  const columns: ColumnsType<ChannelTableColumns> = [
    {
      title: '业务员',
      dataIndex: 'accountName',
      width: '20%',
      render: (_, row) => (
        <UserItem user={{ accId: row.accountId, nickName: row.accountName, avatarUrl: row.avatarUrl }} style={{ width: '100%', height: 28 }} avatarSize={28} />
      ),
    },
    {
      title: 'WhatsApp号码',
      dataIndex: 'bindWhatsApps',
      width: '20%',
      render: (bindNumbers: ChannelBindItem[]) => <span className={styles.bindWhatsApps}>{bindNumbers.map(v => v.whatsAppNumber).join('/')}</span>,
    },
    {
      title: '最后添加时间',
      dataIndex: 'time',
      render: time => moment(+time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: `已绑定数${modeType !== ModeType.free ? '/可绑定总数' : ''}`,
      dataIndex: 'bindNum',
      render: (_, row) => (
        <span className={styles.bindNum}>
          {row.quota - row.leftQuota}
          {modeType !== ModeType.free ? '/' + row.leftQuota : ''}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, row) => {
        const isBind = row.quota > row.leftQuota;
        let isLeft = false;
        if (modeType !== ModeType.free) {
          isLeft = row.leftQuota > 0;
        }
        return (
          <span>
            {isBind ? (
              <span className={styles.actionBtn} onClick={() => onUnbind(row.accountId)}>
                解除绑定
              </span>
            ) : (
              <></>
            )}
            {isBind && isLeft ? <Divider className={styles.divider} type="vertical" /> : <></>}
            {isLeft ? (
              <span className={styles.actionBtn} onClick={() => onReassign(row.accountId)}>
                重新分配
              </span>
            ) : (
              <></>
            )}
          </span>
        );
      },
    },
  ];

  const onChange = (page: number, pageSize?: number) => {
    onPaginationChange({ current: page, pageSize: pageSize || 20 });
  };

  return (
    <div className={styles.tableContainer}>
      <Table className={styles.channelListTable} columns={columns} dataSource={distributionList} pagination={false} loading={loading} />
      <Pagination
        className={styles.pagination}
        showQuickJumper
        showSizeChanger
        current={pagination.current}
        pageSize={pagination.pageSize}
        total={total}
        showTotal={(all: number) => `共${all}条数据`}
        onChange={onChange}
      />
    </div>
  );
};

export default ChannelListTable;
