import React from 'react';
import classnames, { Argument as ClassnamesType } from 'classnames';
import { CustomerOperateHistoryItem } from 'api';
import { Empty, Timeline, Pagination } from 'antd';
import { UserCardPopover } from '@web-disk/components/UserCard';
import style from './operateHistory.module.scss';
import { getIn18Text } from 'api';
interface OperateHistoryProps {
  className?: ClassnamesType;
  list: CustomerOperateHistoryItem[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger: boolean;
  };
  onChange: (page: number, pageSize?: number) => void;
  onPreview: (id: string) => void;
  onOperateNameClick: () => void;
}
const OperateHistory: React.FC<OperateHistoryProps> = props => {
  const { className, list, pagination, onChange, onPreview, onOperateNameClick } = props;
  if (!(Array.isArray(list) && !!list.length)) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }
  return (
    <div className={classnames([style.operateHistory, className])}>
      <Timeline>
        {list.map(item => (
          <Timeline.Item key={item.id}>
            <div className={style.operateTime}>{item.oper_time}</div>
            <div className={style.operateContent}>
              <div className={style.operateText}>
                {!item.is_sys ? (
                  <UserCardPopover userId={item.oper_id}>
                    <div className={style.operateName} onClick={onOperateNameClick}>
                      {item.oper_name}
                    </div>
                  </UserCardPopover>
                ) : (
                  item.oper_name
                )}
                <div className={style.operateDesc}>{item.oper_desc}</div>
              </div>
              <div className={style.operateDetail} onClick={() => onPreview(item.id)}>
                {getIn18Text('BIANGENGNEIRONG')}
              </div>
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
      <div className={style.pagination}>
        <Pagination className="pagination-wrap" size="small" {...pagination} onChange={onChange} />
      </div>
    </div>
  );
};
OperateHistory.defaultProps = {};
export default OperateHistory;
