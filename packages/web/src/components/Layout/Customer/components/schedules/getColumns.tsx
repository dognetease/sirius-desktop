import React from 'react';
import { ColumnType } from 'antd/lib/table';
import { getIn18Text } from 'api';
const getColumns = ({ canEdit, canDelete, onEdit, onDelete, style }): ColumnType<any>[] => [
  {
    title: getIn18Text('RICHENGZHUTI'),
    dataIndex: 'subject',
  },
  {
    title: getIn18Text('JULIKAISHISHIJIAN'),
    dataIndex: 'distance_start',
  },
  {
    title: getIn18Text('RICHENGSHIJIAN'),
    dataIndex: 'schedule_time',
  },
  {
    title: getIn18Text('CHUANGJIANSHIJIAN'),
    dataIndex: 'create_time',
  },
  {
    title: getIn18Text('CAOZUO'),
    dataIndex: 'options',
    fixed: 'right',
    className: style.schedulesOptions,
    render: (text, item) => (
      <>
        {canEdit && <span onClick={() => onEdit(item.schedule_id)}>{getIn18Text('BIANJI')}</span>}
        {canDelete && <span onClick={() => onDelete(item.schedule_id)}>{getIn18Text('SHANCHU')}</span>}
      </>
    ),
  },
];
export default getColumns;
