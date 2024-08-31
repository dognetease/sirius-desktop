import React from 'react';
import { Table, Tooltip } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './modal.module.scss';
import { ColumnType } from 'antd/lib/table';
import { getIn18Text } from 'api';
export interface ArraiveList {
  edmSubject: string;
  edmEmailId: string | number;
  emailSubject: string;
  arriveAt: string;
}
interface IHistoryActionProps {
  data: Array<ArraiveList>;
  visible: boolean;
  onCancel: () => void;
}
export const ArriveModal = (props: IHistoryActionProps) => {
  const columns: ColumnType<ArraiveList>[] = [
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
      title: getIn18Text('YOUJIANZHUTI'),
      dataIndex: 'emailSubject',
    },
    {
      title: getIn18Text('FAJIANFASONGSHIJIAN'),
      dataIndex: 'arriveAt',
      width: 130,
    },
  ];
  const { visible, onCancel } = props;
  return (
    <Modal title={getIn18Text('FAJIANLIEBIAO')} className={style.historyActionModal} visible={visible} footer={null} width={600} onCancel={onCancel}>
      <Table columns={columns} dataSource={props.data} pagination={false} scroll={{ y: 406 }} rowKey="id" />
    </Modal>
  );
};
