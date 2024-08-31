import React, { useState, useEffect } from 'react';
import Modal from '@/components/Layout/components/Modal/modal';

interface subscribeCompanyModalProps {
  visible: boolean;
  setVisible: (bl: boolean) => void;
  selectedRowItem: any[];
  createClue: (parames: string[]) => void;
}
const entryClueModal: React.FC<subscribeCompanyModalProps> = props => {
  const { visible, setVisible, selectedRowItem, createClue } = props;
  const ids = selectedRowItem.filter(item => item.clueStatus === 1).map(item => item.id);
  const idsFilter = selectedRowItem.filter(item => item.clueStatus !== 1).map(item => item.id);
  return (
    <Modal
      visible={visible}
      title={`批量录入${idsFilter.length}条线索`}
      width={480}
      onCancel={e => {
        e.stopPropagation();
        setVisible(false);
      }}
      bodyStyle={{ padding: '8px 24px' }}
      //   okText="提交"
      onOk={() => {
        createClue(idsFilter);
        setVisible(false);
      }}
    >
      <span>{`共选择${selectedRowItem.length}条数据，其中${ids.length}条已录入线索的数据已自动过滤`}</span>
    </Modal>
  );
};
export default entryClueModal;
