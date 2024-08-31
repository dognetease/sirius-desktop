import React, { useState, useEffect } from 'react';
import { ConfigProvider } from 'antd';
import qs from 'querystring';
import zhCN from 'antd/lib/locale/zh_CN';
import { navigate, useLocation } from '@reach/router';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import { SiriusPageProps } from '@/components/Layout/model';
import { ExpandableSideContent } from '@/layouts/Main/expandableSideContent';
import { FoldableMenu } from '@/components/UI/MenuIcon/FoldableMenu';
import { getIn18Text } from 'api';
import { FIR_SIDE } from '@web-common/utils/constant';
import { useAppSelector } from '@web-common/state/createStore';
import IM from '@web-im/im';
import Schedule from '@web-schedule/schedule';
import Disk from '@web-disk/index';
import Contact from '@web-contact/contact';
import { IMIcon, CalenderIcon, DiskTabIcon, ContactIcon } from '@web-common/components/UI/Icons/icons';
import { ReactComponent as Computer } from '@web-common/images/icons/computer.svg';
import { shallowEqual } from 'react-redux';
import { MenuItemData } from '@/components/UI/MenuIcon/FoldableMenu';
import _ from 'lodash';

const menuData: MenuItemData[] = [
  {
    title: getIn18Text('XIETONGBANGONG'),
    key: 'coop',
    label: '',
    icon: <Computer />,
    children: [
      {
        title: getIn18Text('XIAOXI'),
        key: 'message',
        label: '',
        trackEventId: 'client_2_Message_notification',
      },
      {
        key: 'schedule',
        title: getIn18Text('RILI'),
        label: '',
        trackEventId: 'client_2_calendar',
      },
      {
        key: 'disk',
        title: getIn18Text('YUNWENDANG'),
        label: '',
        trackEventId: 'client_2_Cloud_Document',
      },
      {
        key: 'contact',
        title: getIn18Text('TONGXUNLU'),
        label: '',
        trackEventId: 'client_2_Contacts',
      },
    ],
  },
];

interface CoopProps extends SiriusPageProps {}

const Coop: React.FC<CoopProps> = () => {
  const location = useLocation();
  const isFoldMenu = useAppSelector(state => state.expandMenuReducer.isFold);
  const [activeMenuKey, setActiveMenuKey] = useState('');
  const unreadCount = useAppSelector(state => state.readCountReducer.unreadCount, shallowEqual);
  let [menu, setMenu] = useState(menuData);

  useEffect(() => {
    let newMenu = _.cloneDeep(menuData);

    if (unreadCount.message! > 0) {
      // if(typeof unreadCount.message === 'number' && unreadCount.message > 0) {
      newMenu[0].children![0].badge = unreadCount.message;
      setMenu(newMenu);
    } else {
      setMenu(menuData);
    }
  }, [unreadCount]);

  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    const params = qs.parse(location.hash.split('?')[1]) as Record<string, string>;

    if (moduleName !== 'coop') return;

    if (!params.page) {
      navigate('#coop?page=message');
    } else {
      setActiveMenuKey(params.page);
    }
  }, [location.hash]);

  const handleMenuClick = (current: { key: string }) => {
    const { key } = current;

    navigate(`#coop?page=${key}`);
    setActiveMenuKey(key);
  };

  const contentMap: Record<string, React.ReactElement> = {
    message: <IM name="message" tag={getIn18Text('XIAOXI')} icon={IMIcon} />,
    schedule: <Schedule name="schedule" tag={getIn18Text('RILI')} icon={CalenderIcon} />,
    disk: <Disk name="disk" tag={getIn18Text('YUNWENDANG')} icon={DiskTabIcon} />,
    contact: <Contact name="contact" tag={getIn18Text('TONGXUNLU')} icon={ContactIcon} />,
  };

  return (
    <ConfigProvider locale={zhCN}>
      <PageContentLayout from="coop">
        <ExpandableSideContent borderRight minWidth={FIR_SIDE} defaultWidth={220} isFold={isFoldMenu}>
          <FoldableMenu
            isFold={false}
            handleMenuClick={handleMenuClick}
            menuData={menu}
            activeMenuKey={activeMenuKey}
            defaultOpenKeys={menu.map(item => item.key)}
            showParentMenuWhenSingle
          />
        </ExpandableSideContent>
        <div style={{ height: '100%' }}>{contentMap[activeMenuKey] || null}</div>
      </PageContentLayout>
    </ConfigProvider>
  );
};

export default Coop;
