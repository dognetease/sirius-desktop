import React from 'react';
import classnames, { Argument as ClassnamesType } from 'classnames';
import { CustomerSchedule as CustomerScheduleType } from 'api';
import { Table, Button, TablePaginationConfig } from 'antd';
import getColumns from './getColumns';
import style from './schedules.module.scss';
import { getIn18Text } from 'api';
interface SchedulesProps {
  className?: ClassnamesType;
  data: CustomerScheduleType[];
  pagination: TablePaginationConfig;
  canEdit?: boolean;
  canDelete?: boolean;
  onChange: (pagination: TablePaginationConfig) => void;
  onCreate: () => void;
  onEdit: (schedule_id: number) => void;
  onDelete: (schedule_id: number) => void;
}
const Schedules: React.FC<SchedulesProps> = props => {
  const { className, data, pagination, canDelete, canEdit, onChange, onCreate, onEdit, onDelete } = props;
  return (
    <div className={classnames([style.schedules, className])}>
      {canEdit && (
        <div className={style.filter}>
          <Button className={style.createSchedule} onClick={onCreate}>
            {getIn18Text('XINJIANRICHENG')}
          </Button>
        </div>
      )}
      <Table
        rowKey="schedule_id"
        size="small"
        scroll={{ x: 'max-content' }}
        columns={getColumns({ canDelete, canEdit, onEdit, onDelete, style })}
        dataSource={data}
        pagination={Array.isArray(data) && !!data.length ? { className: 'pagination-wrap', ...pagination } : false}
        onChange={onChange}
      />
    </div>
  );
};
Schedules.defaultProps = {
  canEdit: true,
  canDelete: true,
  onChange: () => {},
  onCreate: () => {},
  onEdit: () => {},
  onDelete: () => {},
};
export default Schedules;
