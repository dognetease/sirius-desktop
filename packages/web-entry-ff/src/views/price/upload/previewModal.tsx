import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Select, Upload, message, Button, Alert, Spin, Tooltip } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { FFMSRate } from 'api';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import style from './preview.module.scss';
import { ColumnsType } from 'antd/es/table';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  standardField: FFMSRate.StandardField[];
  analyzeImageData?: FFMSRate.PricePicRes;
}

const Preview: React.FC<Props> = ({ visible, onCancel, onSuccess, standardField, analyzeImageData }) => {
  const [columns, setColumns] = useState<ColumnsType<Record<string, string>>>();
  const [dataSource, setDataSource] = useState<Record<string, string>[]>([]);

  const initTableData = () => {
    let columns: ColumnsType<Record<string, string>> = [];
    (standardField || []).forEach(item => {
      columns.push({
        title: () => <span className={item.required ? style.tableTitleRequired : null}>{item.label}</span>,
        dataIndex: `columns${item.codeIndex}`,
      });
    });
    setColumns(columns);

    (analyzeImageData?.data || []).forEach((row, index) => {
      const rowData = row.reduce((accumulator, currentValue, index) => ({ ...accumulator, [`columns${index}`]: currentValue }), {});
      if (index !== 0) {
        dataSource.push(rowData);
      }
    });
    setDataSource(dataSource);
  };

  useEffect(() => {
    if (visible) {
      initTableData();
    } else {
      setColumns([]);
      setDataSource([]);
    }
  }, [visible]);

  return (
    <Modal
      title="上传报价"
      visible={visible}
      onCancel={onCancel}
      bodyStyle={{
        minHeight: 200,
        maxHeight: 500,
        overflow: 'auto',
      }}
      width={1000}
      footer={null}
    >
      <div className={style.upload}>
        <Table scroll={{ x: 'max-content' }} pagination={false} columns={columns} dataSource={dataSource} />
      </div>
    </Modal>
  );
};
export default Preview;
