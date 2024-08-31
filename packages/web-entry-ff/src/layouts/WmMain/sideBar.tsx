import React, { useEffect, useState, useContext } from 'react';
import { Layout, Menu, MenuProps } from 'antd';
import { ChildrenType } from '../config/topMenu';
import { ReactComponent as LeftCollapsed } from '../../../../web-common/src/images/icons/left_collapsed.svg';
import { ReactComponent as RightCollapsed } from '../../../../web-common/src/images/icons/right_collapsed.svg';
// import { ReactComponent as Expand } from '../../assets/images/icons/expand.svg';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import { ReadCountActions } from '@web-common/state/reducer';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import classNames from 'classnames';
import { apiHolder, apis, CustomerDiscoveryApi, RegularCustomerMenuData } from 'api';

import styles from './sideBar.module.scss';
import { TopMenuType } from '@web-common/conf/waimao/constant';
import { GlobalContext } from './globalProvider';

const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
const { SubMenu } = Menu;
const { Sider } = Layout;
const eventApi = apiHolder.api.getEventApi();

const dotPath = ['application', 'message', 'autoRecommend', 'customRecommend', 'authorization'];
interface IProps {
  onMenuClick: (current: { key: string }) => void;
  sideMenuData: TopMenuType;
  sidePath: string[];
  allKeys: string[];
  moduleName: string;
}

const SideBar: React.FC<any> = (props: IProps) => {
  const { onMenuClick, sideMenuData, sidePath, allKeys, moduleName } = props;
  const [collapsed, setCollapsed] = useState(false);
  const [btnActive, setBtnActive] = useState(true);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const { children } = sideMenuData || {};
  const unreadCount = useAppSelector(state => state.readCountReducer.unreadCount);
  const [regularMenuData, setRegularMenuData] = useState<RegularCustomerMenuData>();
  const { state } = useContext(GlobalContext);

  const getRegularCustomerMenuData = async () => {
    const res = await customerDiscoveryApi.getRegularCustomerMenuData();
    setRegularMenuData(preState => ({ ...preState, ...res }));
  };

  useEffect(() => {
    getRegularCustomerMenuData();
    const id = eventApi.registerSysEventObserver('regularCustomerMenuUpdate', {
      func: event => {
        const { eventData = {} } = event;
        setRegularMenuData(preState => ({ ...preState, ...eventData }));
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('regularCustomerMenuUpdate', id);
    };
  }, []);

  const renderDot = (key: string) => {
    let num;
    if (state.hasFollow) {
      return <span className={styles.dotShow}></span>;
    }
    switch (key) {
      case 'autoRecommend':
        num = regularMenuData?.auto || 0;
        break;
      case 'customRecommend':
        num = regularMenuData?.manual || 0;
        break;
      case 'authorization':
        num = regularMenuData?.count || 0;
        break;
      case 'message':
        num = unreadCount?.message || 0;
        break;
      default:
        break;
    }
    return !!num && <span className={styles.dotShow}>{num > 99 ? '99+' : num}</span>;
  };

  const renderChildren = (c: ChildrenType, level: number) => {
    const dotShow = dotPath.includes(c.path);
    return (
      <>
        {c?.children?.length ? (
          <SubMenu key={c.path} icon={c.icon} title={c.name} popupClassName={styles.sidePopClass} className={`level-${level}`}>
            {c.children?.map(item => renderChildren(item, level + 1))}
          </SubMenu>
        ) : (
          <Menu.Item
            key={c.path}
            icon={c.icon}
            className={classNames(`level-${level}`, {
              [styles.dotMessage]: dotShow,
            })}
          >
            {c.name}
            {renderDot(c.path)}
          </Menu.Item>
        )}
      </>
    );
  };

  useEffect(() => {
    !collapsed && setOpenKeys(allKeys);
  }, [allKeys, collapsed]);

  const toggleCollapsed = () => {
    setBtnActive(collapsed);
    setCollapsed(!collapsed);
  };

  return (
    <Sider width={220} theme="light" trigger={null} collapsedWidth={48} collapsible collapsed={collapsed} className={styles.siderBar}>
      <div className={styles.menuWrap} onMouseOver={() => setCollapsed(false)} onMouseLeave={() => !btnActive && setCollapsed(true)}>
        <Menu mode="inline" onClick={onMenuClick} selectedKeys={sidePath} openKeys={openKeys} onOpenChange={setOpenKeys} inlineIndent={20}>
          {children?.[0].children?.map((c: ChildrenType) => {
            return <>{renderChildren(c, 1)}</>;
          })}
        </Menu>
      </div>
      <div className={styles.collBtn}>
        <span onClick={toggleCollapsed}>{collapsed ? <LeftCollapsed /> : <RightCollapsed />}</span>
      </div>
    </Sider>
  );
};

export default SideBar;
