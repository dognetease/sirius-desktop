import React, { useState, useCallback, useEffect } from 'react';
import { Menu, Table, Tabs, Tooltip, Dropdown } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './modal.module.scss';
import { ColumnType } from 'antd/lib/table';
// import PcIcon from '@/images/icons/edm/pcIcon.svg';
// import MobileIcon from '@/images/icons/edm/mobileIcon.svg';
import { ReactComponent as FilterIcon } from '@/images/icons/edm/filter.svg';
// import classNames from 'classnames';
import { getIn18Text } from 'api';
export type DeviceInfo = 'windows' | 'mac' | 'web' | 'iOS' | 'android';
export interface IHistoryActionData {
  edmSubject: string;
  contactEmail: string;
  operateName: string;
  operateTime: string | number;
  timeZoneOperateTime?: string | number;
  operateDevice: string;
  deviceInfo: string;
  ip: string;
  timeZone: string;
  country: string;
  continent: string;
  province: string;
  city: string;
}
export interface IHistoryActionProps {
  data: Array<IHistoryActionData>;
  visible: boolean;
  onCancel: () => void;
  onOpenMail: (emailId?: string) => void;
}
const isPc = (d: DeviceInfo) => d === 'mac' || d === 'windows' || d === 'web';
const filters = [getIn18Text('DAKAIYUEDU'), getIn18Text('HUIFU'), getIn18Text('TUIDING')];
export const HistoryActionModal = (props: IHistoryActionProps) => {
  const [activeTab, setActiveTab] = useState('0');
  const [list, setList] = useState<IHistoryActionData[]>(() => {
    return props.data.filter(item => item.operateName === filters[activeTab]);
  });
  const [timeZone, setTimeZone] = useState('local');
  const columns: ColumnType<IHistoryActionData>[] = [
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
            {getIn18Text('CAOZUOSHIJIAN')}
            <Dropdown overlay={menu} placement="bottomRight" overlayClassName="edm-filter-overlay">
              <span style={{ verticalAlign: 'middle', marginLeft: 10 }}>
                <FilterIcon />
              </span>
            </Dropdown>
          </div>
        );
      },
      dataIndex: timeZone === 'remote' ? 'timezoneOperateTime' : 'operateTime',
      width: 130,
    },
    {
      title: getIn18Text('SHIQU'),
      dataIndex: 'timeZone',
      width: 110,
      ellipsis: true,
      render(s) {
        return !s ? '-' : s;
      },
    },
    {
      title: getIn18Text('ZUIJINCAOZUODEQU'),
      width: 170,
      ellipsis: {
        showTitle: false,
      },
      render(_, item: IHistoryActionData) {
        const str = [item.country, item.province, item.city].filter(i => !!i).join('-');
        return <Tooltip title={str}>{str}</Tooltip>;
      },
    },
  ];
  const replyColumns = [
    {
      title: getIn18Text('HUIFUNEIRONG'),
      dataIndex: 'replyEmailInfo', //todo:
      ellipsis: {
        showTitle: false,
      },
      render(info) {
        return (
          <Tooltip overlay={info?.emailSubject} placement="topLeft">
            <a onClick={() => props.onOpenMail(info?.emailInnerMid)} style={{ cursor: info?.emailInnerMid ? 'pointer' : '' }}>
              {info?.emailSubject || '-'}
            </a>
          </Tooltip>
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
  const onTabChange = useCallback(
    (key: string) => {
      setActiveTab(key);
    },
    [setActiveTab]
  );
  useEffect(() => {
    setList(props.data.filter(item => item.operateName === filters[activeTab]));
  }, [props.data, setList, activeTab]);
  const { visible, onCancel } = props;
  return (
    <Modal title={getIn18Text('DAKAILIEBIAO')} className={style.historyActionModal} visible={visible} footer={null} width={600} onCancel={onCancel}>
      <Table columns={activeTab === '0' ? columns : replyColumns} dataSource={list} pagination={false} scroll={{ y: 406 }} rowKey="id" />
    </Modal>
  );
};
