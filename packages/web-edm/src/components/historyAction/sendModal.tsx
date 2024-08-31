import React from 'react';
import { Table, Tooltip } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './modal.module.scss';
import { ColumnType } from 'antd/lib/table';
import { getIn18Text } from 'api';

export interface ReadSummary {
  edmSubject: string;
  edmEmailId: string;
  readCount: number;
  recentReadAt: string;
}

interface IHistoryActionProps {
  data: Array<ReadSummary>;
  visible: boolean;
  onCancel: () => void;
}

export const SendOperateModal = (props: IHistoryActionProps) => {
  const columns: ColumnType<ReadSummary>[] = [
    {
      title: getIn18Text('RENWUZHUTI'),
      dataIndex: 'edmSubject',
      ellipsis: {
        showTitle: false,
      },
      render(title: string) {
        return (
          <Tooltip overlay={title} placement="topLeft">
            {title}
          </Tooltip>
        );
      },
    },
    {
      title: getIn18Text('RENWUCHUANGJIANSHIJIAN'),
      dataIndex: 'sendAt',
    },
    {
      title: getIn18Text('FASONGZHUANGTAI'),
      dataIndex: 'sendResult',
      render(sendResult: boolean) {
        return sendResult ? getIn18Text('CHENGGONG') : getIn18Text('SHIBAI');
      },
    },
  ];

  const { visible, onCancel } = props;

  return (
    <Modal title={getIn18Text('FAJIANLIEBIAO')} className={style.historyActionModal} visible={visible} footer={null} width={600} onCancel={onCancel}>
      <Table columns={columns} dataSource={props.data} pagination={false} scroll={{ y: 406 }} rowKey="id" />
    </Modal>
  );
};
