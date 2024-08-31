import React from 'react';
import { Modal, Descriptions } from 'antd';
import { FFMSOverView } from 'api';
import style from './style.module.scss';

interface Props {
  row?: FFMSOverView.ListRow;
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export const DetailModal: React.FC<Props> = props => {
  const { row, open, onCancel, onSuccess } = props;

  return (
    <Modal visible={open} width={800} onCancel={onCancel} onOk={onSuccess} centered destroyOnClose footer={null} title="运价详情">
      <Descriptions bordered size="small">
        <Descriptions.Item label="起运港">
          {row?.departurePort?.cnName} {row?.departurePort?.enName}
        </Descriptions.Item>
        <Descriptions.Item label="目的港">
          {row?.destinationPort?.cnName} {row?.destinationPort?.enName}
        </Descriptions.Item>
        <Descriptions.Item label="开航日">{row?.sailingDate || '--'} </Descriptions.Item>
        <Descriptions.Item label="参考到港日">{row?.arriveDate || '--'}</Descriptions.Item>
        <Descriptions.Item label="航程">{row?.voyage || '--'}天</Descriptions.Item>
        <Descriptions.Item label="截止日">{row?.expiryDate || '--'}</Descriptions.Item>
        <Descriptions.Item label="船司">
          {row?.freightCarrier?.carrier} {row?.freightCarrier?.cnName}
        </Descriptions.Item>
        <Descriptions.Item label="航线">{row?.route || '--'}</Descriptions.Item>
        <Descriptions.Item label="船只">{row?.vessel || '--'}</Descriptions.Item>
        <Descriptions.Item label="20GP价格">${row?.price20GP || '--'}</Descriptions.Item>
        <Descriptions.Item label="40GP价格">${row?.price40GP || '--'}</Descriptions.Item>
        <Descriptions.Item label="40HQ价格">${row?.price40HC || '--'}</Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};
