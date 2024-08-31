import React, { useEffect, useState } from 'react';
import { Layout, Menu, MenuProps, Button } from 'antd';
import { ChildrenType } from '../config/topMenu';
import { ReactComponent as LeftCollapsed } from '../../../../web-common/src/images/icons/left_collapsed.svg';
import { ReactComponent as RightCollapsed } from '../../../../web-common/src/images/icons/right_collapsed.svg';
// import { ReactComponent as Expand } from '../../assets/images/icons/expand.svg';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import { ReadCountActions } from '@web-common/state/reducer';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import PinnedMenu from '@web-common/components/PinnedMenu/pinnedMenu';
import classNames from 'classnames';
import { TongyongShouqiXian } from '@sirius/icons';
import { apiHolder, apis, CustomerDiscoveryApi, getIn18Text, RegularCustomerMenuData } from 'api';

import styles from './sideBar.module.scss';
import { TopMenuType } from '@web-common/conf/waimao/constant';

import { edmDataTracker, EdmDraftListOperateType } from '../../../../web-edm/src/tracker/tracker';
import { navigate } from '@reach/router';
import { useL2cCrmUnreadCount } from '@lxunit/app-l2c-crm';
import { ReactComponent as UsefulMenuIcon } from './assets/usefulMenuIcon.svg';
import { useVersionCheck } from '@web-common/hooks/useVersion';

const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
const { SubMenu } = Menu;
const { Sider } = Layout;
const eventApi = apiHolder.api.getEventApi();

const dotPath = ['message', 'autoRecommend', 'customRecommend', 'authorization', '/lead/list', '/recommend/list', 'wa'];

/**
 * onMenuClick ：菜单点击事件
 * sideMenuData：菜单数据
 * sidePath：当前菜单active路径
 * allKeys：当前展开的 SubMenu 菜单项 key 数组
 * moduleName：模块名称(一级菜单hash前缀， eg: intelliMarketing)
 */
interface IProps {
  onMenuClick: (current: { key: string }) => void;
  onSubMenuClick?: (current: { key: string }) => void;
  sideMenuData: TopMenuType;
  sidePath: string[];
  allKeys: string[];
  moduleName: string;
}

const config = new Map();
config.set('collapsed', false);

const SideBar: React.FC<any> = (props: IProps) => {
  let collapsedCache = localStorage.getItem('sidebar_collapsed');

  if (!collapsedCache) {
    localStorage.setItem('sidebar_collapsed', 'false');
  }

  collapsedCache = localStorage.getItem('sidebar_collapsed');

  let initialCollapsed = JSON.parse(collapsedCache!);

  const { onMenuClick, onSubMenuClick, sideMenuData, sidePath, allKeys, moduleName } = props;
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [btnActive, setBtnActive] = useState(!initialCollapsed);
  const [showCreateBtn, setShowCreateBtn] = useState<boolean>(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const { children } = sideMenuData || {};
  const unreadCount = useAppSelector(state => state.readCountReducer.unreadCount);
  // const unReadCountActions = useActions(ReadCountActions);
  const [regularMenuData, setRegularMenuData] = useState<RegularCustomerMenuData>();
  let v1v2 = useVersionCheck();

  // const [isNewVersion, setIsNewVersion] = useState(useVersionCheck() === 'v2');
  let unReadCrm = useL2cCrmUnreadCount();

  // useEventObserver('notificationChange', {
  //   name: 'navbarNotificationChangeOb',
  //   func: ev => {
  //     if (ev.eventStrData) {
  //       if (ev.eventStrData === 'mail') {
  //         unReadCountActions.updateMailboxUnreadCount(ev.eventData);
  //       }
  //       if (ev.eventStrData === 'im') {
  //         unReadCountActions.updateIMUnreadCount(ev.eventData);
  //       }
  //     }
  //   },
  // });

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

  useEffect(() => {
    setShowCreateBtn(false);
    sideMenuData?.children?.forEach(item => {
      let edm = item?.children?.filter(i => i.path === 'edm');
      if (edm && edm.length > 0) {
        edm?.forEach(item => {
          if (item?.children?.filter(i => i.path === 'index').length > 0) {
            setShowCreateBtn(true);
          }
        });
      }
    });
  }, [sideMenuData]);

  const renderDot = (key: string) => {
    let num;
    switch (key) {
      case '/lead/list':
        num = unReadCrm?.['/lead/list'] || 0;
        break;
      case '/recommend/list':
        num = unReadCrm?.['/recommend/list'] || 0;
        break;
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
          <SubMenu
            key={c.path}
            icon={c.icon}
            title={c.name}
            popupClassName={styles.sidePopClass}
            className={`level-${level}`}
            data-key={c.path}
            onTitleClick={onSubMenuClick}
          >
            {c.children?.map(item => renderChildren(item, level + 1))}
          </SubMenu>
        ) : (
          <Menu.Item
            key={c.path}
            icon={c.icon}
            className={classNames(`level-${level}`, {
              [styles.dotMessage]: dotShow,
              [styles.newBadge]: c.showNewBadge,
              [styles.menuSuffix]: Boolean(c.suffix),
            })}
          >
            {c.name}
            {renderDot(c.path)}
            {c.suffix}
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
    // config.set('collapsed', !collapsed);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(!collapsed));
  };

  const createMailTask = () => {
    edmDataTracker.trackDraftListOperation(EdmDraftListOperateType.NewObject);
    edmDataTracker.track('pc_markting_newobject_edm_click');
    navigate('#edm?page=write');
  };

  const onOpenChange: MenuProps['onOpenChange'] = keys => {
    const latestOpenKey = keys.find(key => openKeys.indexOf(key) === -1);
    if (allKeys.indexOf(latestOpenKey!) === -1) {
      setOpenKeys(keys);
    } else {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
    }
  };

  return (
    <Sider width={220} theme="light" trigger={null} collapsedWidth={48} collapsible collapsed={collapsed} className={styles.siderBar}>
      {showCreateBtn && (
        <div className={styles.createDiv} style={{ visibility: collapsed ? 'hidden' : 'visible' }}>
          <Button type="primary" className={styles.createBtn} onClick={createMailTask}>
            <i className={styles.addIcon} />
            {getIn18Text('XINJIANFAJIANRENWU')}
          </Button>
        </div>
      )}
      {!collapsed && (
        <PinnedMenu
          style={{
            padding: '0 16px 5px 22px',
          }}
        />
      )}

      <div className={styles.menuWrap} onMouseOver={() => setCollapsed(false)} onMouseLeave={() => !btnActive && setCollapsed(true)}>
        <Menu mode="inline" onClick={onMenuClick} selectedKeys={sidePath} openKeys={openKeys} onOpenChange={setOpenKeys} inlineIndent={20}>
          {collapsed && v1v2 === 'v2' && (
            <Menu.Item key="usefulMenuIcon" className={styles['level-1']} icon={<UsefulMenuIcon />}>
              常用菜单
            </Menu.Item>
          )}
          {children?.[0].children?.map((c: ChildrenType) => {
            return <>{renderChildren(c, 1)}</>;
          })}
        </Menu>
      </div>
      <div className={styles.collBtn}>
        <span onClick={toggleCollapsed}>
          {collapsed ? (
            <TongyongShouqiXian wrapClassName="wmzz" className={classNames(styles.trans, styles.expandsIcons)} />
          ) : (
            <TongyongShouqiXian wrapClassName="wmzz" className={styles.expandsIcons} />
          )}
        </span>
      </div>
    </Sider>
  );
};

export default SideBar;
