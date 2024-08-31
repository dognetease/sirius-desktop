import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';
import { Table } from 'antd';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import type { ColumnsType } from 'antd/es/table';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { CustomerInfoModel, getIn18Text } from 'api';
import moment from 'moment';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
interface CronSendModel {
  emails: CustomerInfoModel[];
  onClose: () => any;
}
interface EmailAndTimeModel {
  email: string;
  time: string;
}

const columns: ColumnsType<EmailAndTimeModel> = [
  {
    title: '收件人',
    dataIndex: 'email',
    key: 'email',
    width: '220px',
    render: text => {
      return (
        <Tooltip placement="top" title={text} destroyTooltipOnHide={true}>
          <span className={styles.tdSpan} style={{ width: '210px' }}>
            {text}
          </span>
        </Tooltip>
      );
    },
  },
  {
    title: '当地时间',
    dataIndex: 'time',
    key: 'time',
    width: '290px',
    render: text => {
      return (
        <Tooltip placement="top" title={text} destroyTooltipOnHide={true}>
          <span className={styles.tdSpan} style={{ width: '237px' }}>
            {text}
          </span>
        </Tooltip>
      );
    },
  },
];

const defaultCurrent = 1;
const defaultPageSize = 8;

export const CronSendEmailsModal = (props: CronSendModel) => {
  const { emails, onClose } = props;
  const [infoList, setInfoList] = useState<EmailAndTimeModel[]>([]);
  const [page, setPage] = useState(defaultCurrent);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const getCNbyTimezone = (timezone: string) => {
    if (!timezone) return '东8区';
    const zone = timezone.slice(0, 1) === '+' ? '东' : '西';
    const time = Number(timezone.slice(1, 3));
    return `${zone}${time}区`;
  };

  const converseData = (originData: CustomerInfoModel[]) => {
    var now = moment().locale('zh-cn').format('YYYY-MM-DD HH:mm:ss');
    const list = originData.map(info => {
      return {
        email: `${info.name || ''} (${info.email || ''})`,
        time: `${info.country || ''} ${getCNbyTimezone(info.timezone)} ${info.localTime || now}`,
      };
    });
    return list || [];
  };

  const onPaginationChange = (page: number, pageSize: number) => {
    setPage(page);
    setPageSize(pageSize);
  };

  useEffect(() => {
    if (emails.length > 0) {
      setInfoList(converseData(emails));
    }
  }, [emails]);

  return (
    <Modal
      wrapClassName={styles.cronSendModal}
      maskStyle={{ background: 'transparent' }}
      title={getIn18Text('SHOUJIANRENDANGDISHIJIAN')}
      width={570}
      visible={true}
      footer={null}
      onCancel={onClose}
    >
      <Table
        columns={columns}
        dataSource={infoList.slice(pageSize * (page - 1), pageSize * page)}
        pagination={false}
        size="middle"
        rowClassName={(record, index) => {
          let className = '';
          if (index % 2 === 1) className = `${styles.darkRow}`;
          return className;
        }}
      />
      <SiriusPagination
        className={styles.pagination}
        size="small"
        showTotal={(total: number) => {
          return `共${total}条数据`;
        }}
        current={page}
        pageSize={pageSize}
        pageSizeOptions={['8', '20', '50', '100']}
        total={infoList.length}
        hideOnSinglePage={true}
        onChange={onPaginationChange}
      />
    </Modal>
  );
};
