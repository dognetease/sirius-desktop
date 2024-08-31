import React, { useState, useCallback, useEffect } from 'react';
import { Table, Tooltip } from 'antd';
import { ResponseTraceLinkItem, traceLogItem } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './modal.module.scss';
import { getIn18Text } from 'api';
export interface ClicksActionProps {
  data?: Array<traceLogItem>;
  visible: boolean;
  onCancel: () => void;
}
export const ClickModal = (props: ClicksActionProps) => {
  const { visible, onCancel, data } = props;
  const [list, setList] = useState<traceLogItem[]>();
  useEffect(() => {
    setList(data);
  }, [visible]);
  const trackColumns = [
    {
      title: getIn18Text('SHOUJIANREN'),
      dataIndex: 'contactEmail',
      ellipsis: true,
      render: (text: string) => <Tooltip title={text}>{text}</Tooltip>,
    },
    {
      title: getIn18Text('FANGWENLIANJIE'),
      dataIndex: 'traceUrl',
      ellipsis: true,
      render: (text: string) => <Tooltip title={text}>{text}</Tooltip>,
    },
    {
      title: getIn18Text('CAOZUOSHIJIAN'),
      dataIndex: 'operateTime',
      width: 160,
      ellipsis: true,
    },
    {
      title: getIn18Text('DANGDESHIQU'),
      dataIndex: 'timeZone',
      width: 150,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: getIn18Text('DEQU'),
      dataIndex: 'city',
      ellipsis: true,
      render: (_: any, item: ResponseTraceLinkItem) => {
        const str = [item.country, item.province, item.city].filter(text => !!text).join('-');
        return <Tooltip title={str}>{str}</Tooltip>;
      },
    },
  ];
  return (
    <Modal title={getIn18Text('DAKAILIEBIAO')} className={style.historyActionModal} visible={visible} footer={null} width={600} onCancel={onCancel}>
      <Table columns={trackColumns} dataSource={list} pagination={false} scroll={{ y: 406 }} rowKey="id" />
    </Modal>
  );
};
