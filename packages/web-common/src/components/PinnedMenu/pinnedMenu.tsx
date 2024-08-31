import { getIn18Text } from 'api';
import React, { useState, useEffect } from 'react';
import styles from './pinnedMenu.module.scss';
import classnames from 'classnames';
import { apiHolder, apis, EdmMenusApi, IAllMenu, DataTrackerApi } from 'api';
import { ReactComponent as SettingIcon } from './icons/settings.svg';
import { ReactComponent as ArrowIcon } from './icons/arrow.svg';
import PinnedMenuDrawer from './components/pinnedMenuDrawer/pinnedMenuDrawer';
// import Divider from '@web-common/components/UI/Divider/index';
import Divider from '@lingxi-common-component/sirius-ui/Divider';
import { map } from 'lodash';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import { navigate } from 'gatsby';
import { MenuPermissionV2 as menuRouteMap } from '@web-common/conf/waimao/permission';
import { isMatchUnitableCrmHash } from '@web-unitable-crm/api/helper';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import { WebEntryWmActions } from '@web-common/state/reducer';
const systemApi = apiHolder.api.getSystemApi();
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const edmMenuApi = apiHolder.api.requireLogicalApi(apis.edmMenusApiImpl) as unknown as EdmMenusApi;
const productInfo = {
  productId: 'fastmail',
  productVersionId: 'professional',
};
const isElectron = systemApi.isElectron();

export interface IPinnedMenu {
  style?: React.CSSProperties;
}

export interface IMenu {
  label: string;
  value: string;
}

export interface IMenuTotalItem {
  label: string;
  value: string;
  subItems?: IMenuTotalItem[];
}

export default (props: IPinnedMenu) => {
  const { style = {} } = props;
  const { pinnedMenus: menus } = useAppSelector(state => state.webEntryWmReducer);
  const { updatePinnedMenus } = useActions(WebEntryWmActions);
  const getMenus = () => {
    edmMenuApi.getPinnedMenus(productInfo).then(data => {
      updatePinnedMenus({
        menus: data.map(each => ({
          label: each.menuName,
          value: each.menuLabel,
        })),
      });
    });
  };

  const [allMenus, setAllMenus] = useState<IMenuTotalItem[]>([]);
  let v1v2 = useVersionCheck();
  // const [isNewVersion, setIsNewVersion] = useState(useVersionCheck() === 'v2');
  const formatAllMenus: any = (list: IAllMenu[]) => {
    if (list === null || list.length === 0) {
      return [];
    }
    return map(list, (each: IAllMenu) => {
      return {
        label: each.menuName,
        value: each.menuLabel,
        subItems: formatAllMenus(each.subMenuItems),
      };
    });
  };
  const getAllMenus = () => {
    edmMenuApi.getAllPinnedMenus(productInfo).then(data => {
      const format = formatAllMenus(data);
      setAllMenus(format);
    });
  };
  useEffect(() => {
    if (v1v2 === 'v2') {
      getMenus();
      getAllMenus();
    }
  }, []);

  // const [activeMenu, setActiveMenu] = useState('');
  const onMenuClick = (menu: IMenu) => {
    const key = menu.value;
    const path = menuRouteMap[key];
    if (key === 'WHATSAPP_PERSONAL_MSG' && path && path.length > 0) {
      if (systemApi.isElectron()) {
        systemApi.createWindowWithInitData('personalWhatsapp', { eventName: 'initPage' });
      } else {
        window.open(path, '_blank');
      }
      return;
    }
    if (path && path.length > 0) {
      const isUniHash = isMatchUnitableCrmHash(path);
      if (isUniHash) {
        window.location.hash = path;
      } else {
        navigate(path);
      }
    }
  };
  const menuJSX = menus.map(m => {
    return (
      <div
        className={styles.each}
        onClick={() => {
          onMenuClick(m);
          if (isElectron) {
            trackApi.track('client_2_Common_Functions', { version: 1 });
          } else {
            trackApi.track('web_2_Common_Functions', { version: 1 });
          }
        }}
      >
        {m.label}
      </div>
    );
  });

  const [showMenu, setShowMenu] = useState(true);
  const toggleMenu = () => {
    setShowMenu(pre => !pre);
  };

  const [visible, setVisible] = useState(false);
  const updateMenu = (selectedMenus: IMenu[]) => {
    updatePinnedMenus({
      menus: selectedMenus,
    });
  };

  if (v1v2 === 'v2') {
    return (
      <div className={styles.pinned} style={style}>
        <div className={styles.title}>
          <span className={styles.text}>{getIn18Text('usefulMenu')}</span>
          <div className={styles.icons}>
            <div
              className={styles.set}
              onClick={() => {
                setVisible(true);
                if (isElectron) {
                  trackApi.track('client_2_Common_Functions_Setup', { version: 1 });
                } else {
                  trackApi.track('web_2_Common_Functions_Setup', { version: 1 });
                }
              }}
            >
              <SettingIcon />
            </div>
            <div
              className={classnames(styles.toggle, {
                [styles.reverse]: !showMenu,
              })}
              onClick={toggleMenu}
            >
              <ArrowIcon />
            </div>
          </div>
        </div>
        {showMenu && <div className={styles.content}>{menuJSX}</div>}
        {visible && (
          <PinnedMenuDrawer productInfo={productInfo} visible={visible} menus={menus} allMenus={allMenus} onUpdateMenu={updateMenu} onClose={() => setVisible(false)} />
        )}
        <div
          style={{
            paddingTop: 15,
            paddingRight: 10,
          }}
        >
          <Divider color="#F0F1F5" margin={0} />
        </div>
      </div>
    );
  } else {
    return null;
  }
};
