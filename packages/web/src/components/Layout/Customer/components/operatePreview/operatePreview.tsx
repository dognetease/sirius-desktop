import React, { useState, useEffect } from 'react';
import classnames, { Argument as ClassnamesType } from 'classnames';
import { Table, Tooltip } from 'antd';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './operatePreview.module.scss';
import { getIn18Text } from 'api';
interface OperatePreviewProps {
  className?: ClassnamesType;
  visible?: boolean;
  data?: any;
  onCancel?: () => void;
}
const OperatePreview: React.FC<OperatePreviewProps> = props => {
  const { className, visible, data, onCancel } = props;
  const [title, setTitle] = useState<React.ReactElement | string>('');
  const [time, setTime] = useState<string>('');
  const [dataSource, setDataSource] = useState([]);
  const [columns, setColumns] = useState([]);
  const getNumber = text => {
    if (!isNaN(Number(text)) && typeof Number(text) === 'number') {
      return Number(text).toLocaleString();
    }
    return text;
  };
  useEffect(() => {
    if (data !== null) {
      const { change_info, table_name, data: table_data } = data;
      let _table_data = table_data.map(item => {
        if (item.field_name === getIn18Text('CHENGJIAOE') || item.field_name === getIn18Text('YUGUSHANGJIJINE')) {
          if (item.new_value) {
            item.new_value = getNumber(item.new_value);
          }
          if (item.old_value) {
            item.old_value = getNumber(item.old_value);
          }
          if (item.field_value) {
            item.field_value = getNumber(item.field_value);
          }
        }
        return item;
      });
      const titleText = `${change_info.oper_name} ${change_info.oper_desc}`;
      const render = text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>;
      setTitle(<>{titleText}</>);
      setTime(change_info.time);
      setColumns(
        table_name.map((item, index) =>
          index === 0
            ? { title: item.label, dataIndex: item.value, render, ellipsis: true, fixed: 'left' }
            : { title: item.label, dataIndex: item.value, render, ellipsis: true }
        )
      );
      setDataSource(_table_data);
    } else {
      setTitle(<></>);
      setTime('');
      setColumns([]);
      setDataSource([]);
    }
  }, [data]);
  return (
    <Modal className={classnames(style.operatePreview, className)} title={title} visible={visible} width={476} footer={null} onCancel={onCancel}>
      <div className={style.operateTime}>{time}</div>
      <Table size="small" columns={columns} scroll={{ y: 220 }} loading={!dataSource.length} dataSource={dataSource} pagination={false} rowKey="field_name" />
    </Modal>
  );
};
OperatePreview.defaultProps = {
  data: null,
  onCancel: () => {},
};
export default OperatePreview;
