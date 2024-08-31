import React, { useState } from 'react';
import { Dropdown, Menu, Table, Badge } from 'antd';
import style from './modal.module.scss';
import { openMail } from '../../detail/detailHelper';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { ReactComponent as FilterIcon } from '@/images/icons/edm/filter.svg';
import { getIn18Text } from 'api';
export const MailReplyListModal = props => {
  const [timeZone, setTimeZone] = useState('local');
  const columns = [
    {
      title: getIn18Text('YOUJIANBIAOTI'),
      dataIndex: 'replyEmailInfo',
      render(info, record) {
        return (
          <>
            {info ? <a onClick={() => openMail(info.emailInnerMid, record.edmEmailId, record.id, undefined, undefined, props.isPrivilege)}>{info.emailSubject}</a> : '-'}
            {record.autoReply && <Badge className={style.autoReplyBadge} count={getIn18Text('ZIDONGHUIFU')} />}
          </>
        );
      },
    },
    {
      title: () => {
        const menu = (
          <Menu onClick={({ key }) => setTimeZone(key)} selectedKeys={[timeZone]}>
            <Menu.Item key="local">{getIn18Text('BENDESHIJIAN')}</Menu.Item>
            <Menu.Item key="remote">{getIn18Text('DUIFANGSHIJIAN')}</Menu.Item>
          </Menu>
        );
        return (
          <div>
            {getIn18Text('HUIFUSHIJIAN')}
            <Dropdown overlay={menu} placement="bottomRight" overlayClassName="edm-filter-overlay">
              <span style={{ verticalAlign: 'middle', marginLeft: 10 }}>
                <FilterIcon />
              </span>
            </Dropdown>
          </div>
        );
      },
      dataIndex: timeZone === 'remote' ? 'timezoneOperateTime' : 'operateTime',
      width: 200,
    },
  ];
  return (
    <Modal title={getIn18Text('HUIFULIEBIAO')} className={style.historyActionModal} visible={props.visible} footer={null} width={600} onCancel={props.onCancel}>
      <Table columns={columns} dataSource={props.data} pagination={false} scroll={{ y: 406 }} rowKey="id" />
    </Modal>
  );
};
