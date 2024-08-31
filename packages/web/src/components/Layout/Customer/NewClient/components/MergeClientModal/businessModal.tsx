/*
 * @Author: sunmingxin
 * @Date: 2021-10-08 17:59:17
 * @LastEditTime: 2021-10-25 21:56:08
 * @LastEditors: sunmingxin
 */
import React from 'react';
import { Tooltip, Popover, Button } from 'antd';
import { getIn18Text } from 'api';
interface tableListItem {
  company_name: string;
  company_id: string;
  dup_field: string;
}
export interface IHistoryActionProps {
  visible: boolean;
  onCancel: (id: string, name: string) => void;
  list: tableListItem[];
}
const MergeClientModal = (props: IHistoryActionProps) => {
  const { visible, onCancel, list } = props;
  const columns = [
    {
      title: getIn18Text('KEHUMINGCHENG'),
      dataIndex: 'company_name',
      key: 'company_name',
      width: 260,
      ellipsis: {
        showTitle: false,
      },
      render: (text, record) => (
        <Tooltip placement="topLeft" title={record.company_name || '-'}>
          {record.company_name || '-'}
        </Tooltip>
      ),
    },
    {
      title: getIn18Text('KEHUBIANHAO'),
      dataIndex: 'company_id',
      key: 'company_id',
      width: 100,
    },
    {
      title: getIn18Text('ZHONGFUZIDUAN'),
      dataIndex: 'dup_field',
      key: 'dup_field',
      width: 160,
      render: (text, record) => (
        <Tooltip placement="topLeft" title={record.dup_field || '-'}>
          {record.dup_field || '-'}
        </Tooltip>
      ),
    },
    {
      title: getIn18Text('CAOZUO'),
      key: 'action',
      render: (text, record) => <a onClick={() => getMergeClient(record?.company_id, record?.dup_field)}>{getIn18Text('HEBINGKEHU')}</a>,
    },
  ];
  /**
   * 需要合并的id
   */
  const getMergeClient = (id, dupField) => {
    onCancel(String(id), dupField);
    console.log('操作id', id);
  };
  const content = (
    <div>
      <p>Content</p>
      <p>Content</p>
    </div>
  );
  return (
    <>
      <Popover content={content} title="Title">
        <Button type="primary">Hover me</Button>
      </Popover>
      {/* <Modal
            className= {style.mergeClientWrap}
            title={<div> 客户数据存在重复信息<span className={style.num}>（{list.length})</span> </div>}
            width={654}
            bodyStyle ={{ maxHeight: '372px' }}
            visible={visible}
            destroyOnClose={true}
            closable={false}
            footer={null}
            onCancel={onCancel}
        >
            <div className={style.modalContent}> {
                <Table
                    className="edm-table"
                    scroll={{ y: 316 }}
                    columns = {columns}
                    pagination = {false}
                    dataSource = { list }
                />
            }</div>
        </Modal> */}
    </>
  );
};
export default MergeClientModal;
