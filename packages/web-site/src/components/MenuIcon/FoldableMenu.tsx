import React, { useCallback, useMemo, useRef } from 'react';
import { Menu, Button } from 'antd';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import { apiHolder, apis, DataTrackerApi } from 'api';
import { navigate } from '@reach/router';
import HollowOutGuide, { HollowOutGuideProps } from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
import { ReactComponent as NewTagIcon } from '@/images/icons/edm/new-icon.svg';
import PinnedMenu from '@web-common/components/PinnedMenu/pinnedMenu';
import { useVersionCheck } from '@web-common/hooks/useVersion';

import style from '@/components/UI/MenuIcon/foldableMenu.module.scss';
import classNames from 'classnames';
import { useLocation } from 'react-use';
import { getTransText } from '@/components/util/translate';

export interface MenuItemData {
  key: string;
  title: React.ReactNode;
  label: string;
  icon?: React.ReactNode;
  children?: Array<MenuItemData>;
  subffix?: () => React.ReactNode;
  badge?: number;
  renPoint?: boolean;
  newBadge?: boolean;
  hollowOutOptions?: Omit<HollowOutGuideProps, 'children'>;
  trackEventId?: string;
}

interface FoldableMenuProps {
  isFold: boolean;
  menuData: Array<MenuItemData>;
  activeMenuKey: string;
  defaultOpenKeys?: string[];
  handleMenuClick: (info: any) => void | undefined;
}
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const guideList = [
  {
    id: 'whatsAppMessage',
    title: '绑定个人WhatsApp账号，一站式沟通与客户管理',
    content: (
      <>
        1. {getTransText('SHIYONGWhatsAppGOUTONGSHI')}
        <br />
        2. {getTransText('GENJUWhatsAppLIANXIREN')}
        <br />
        3. {getTransText('TONGBULIAOTIANJILUDAOXIANGQINGYE')}
      </>
    ),
  },
];

export const FoldableMenu = (props: FoldableMenuProps) => {
  const { isFold, menuData, activeMenuKey, handleMenuClick } = props;
  const location = useLocation();

  const v1v2 = useVersionCheck();

  const lastTrackEventId = useRef<string | null>(null);

  const trackEventMap = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    const loop = (menu: MenuItemData) => {
      map[menu.key] = menu.trackEventId;
      menu.children?.forEach(loop);
    };
    menuData.forEach(loop);
    return map;
  }, [menuData]);

  const handleMenuTrack = (info: { key: string }) => {
    if (v1v2 !== 'v2') return;
    const trackEventId = trackEventMap[info.key];
    if (!trackEventId) {
      lastTrackEventId.current = null;
      return;
    }
    if (trackEventId === lastTrackEventId.current) return;
    lastTrackEventId.current = trackEventId;
    trackApi.track(trackEventId, { version: 1 });
  };

  const onMenuClick = (info: any) => {
    handleMenuClick(info);
    handleMenuTrack(info);
    trackApi.track('waimao_secondary_menu_click', {
      menuKey: info.key,
      name: info.item?.elementRef?.current?.innerText,
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const renderIcons = useCallback((data: Array<MenuItemData>, activeMenuKey: string) => {
    const ret: React.ReactNode[] = [];
    data.forEach((item: MenuItemData) => {
      item.children?.forEach(i => {
        ret.push(
          <span
            className={activeMenuKey === i.key ? style.activeMenu : ''}
            onClick={() => onMenuClick({ key: i.key })}
            title={typeof i.title === 'string' ? i.title : ''}
          >
            {i.icon}
          </span>
        );
      });
    });
    return <div className={style.folded}>{...ret}</div>;
  }, []);

  const renderMenus = (menu: MenuItemData, level: number) => {
    const renderTitle = () => (
      <span className={style.menuTitle}>
        {menu.title}
        {menu.renPoint && <i className={style.menuRedPoint} />}
        {menu.newBadge && <NewTagIcon />}
      </span>
    );
    return (
      <Menu.Item className={classNames('with-hollow-item', style.menuItem, `level-${level}`)} key={menu.key} icon={menu.icon}>
        {menu.key === 'pernsonalWhatsapp' && location?.hash === '#edm' ? (
          <HollowOutGuide
            padding={[0, -20, 0, 20]}
            okText="知道了"
            guideId={guideList[0].id}
            title={guideList[0].title}
            // placement={menu.key === 'pernsonalWhatsapp' ? 'topLeft' : undefined}
            placement={'topLeft'}
            refresh={new Date().getTime()}
            intro={
              <div
                style={{
                  fontFamily: 'PingFang SC',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '20px',
                  color: '#FFFFFF',
                  whiteSpace: 'normal',
                }}
              >
                {menu.key === 'pernsonalWhatsapp' ? guideList[0].content : ''}
              </div>
            }
            enable={menu.key === 'pernsonalWhatsapp' && location?.hash === '#edm'}
            onClose={() => {
              // 把hover状态移除
              const node = document.querySelector('.ant-menu-item.ant-menu-item-active.with-hollow-item');
              if (node != null) {
                node.classList.remove('ant-menu-item-active');
              }
            }}
          >
            {renderTitle()}
          </HollowOutGuide>
        ) : menu.hollowOutOptions ? (
          <HollowOutGuide padding={[10, 104, 10, 44]} {...menu.hollowOutOptions}>
            {renderTitle()}
          </HollowOutGuide>
        ) : (
          renderTitle()
        )}

        {/* { menu.isNew && menu.isNew() ? <NewTagIcon className={style.newTagIcon} /> : null } */}
        {menu.subffix && menu.subffix()}
        {menu.badge ? <span className={style.badgeNum}>{menu.badge}</span> : ''}
      </Menu.Item>
    );
  };

  if (menuData.length === 0) {
    return <div className={style.treeContainer} />;
  }

  return (
    <div className={style.treeContainer}>
      <PinnedMenu
        style={{
          padding: '0 7px 5px 12px',
        }}
      />
      {!isFold && (
        <Menu
          expandIcon={null}
          defaultOpenKeys={props.defaultOpenKeys ?? ['edm']}
          className={`${style.edmMenu} sirius-no-drag`}
          selectedKeys={[activeMenuKey]}
          onClick={onMenuClick}
          mode="inline"
          onSelect={value => {
            const { key } = value;
            if (key != null && key === 'mailTemplate') {
              trackApi.track('pc_markting_edm_template_management_click');
            }
          }}
        >
          {menuData.length < 2
            ? menuData.map(item => {
                return item.children?.map(menu => {
                  if (menu.children?.length) {
                    return (
                      <Menu.SubMenu key={menu.key} title={menu.title} icon={menu.icon} className="level-1" onTitleClick={handleMenuTrack}>
                        {menu.children?.map(m => renderMenus(m, 2))}
                      </Menu.SubMenu>
                    );
                  }
                  return renderMenus(menu, 1);
                });
              })
            : menuData.map(item => (
                <Menu.SubMenu key={item.key} title={item.title} icon={item.icon} className="level-1" onTitleClick={handleMenuTrack}>
                  {item.children?.map(menu => renderMenus(menu, 2))}
                </Menu.SubMenu>
              ))}
        </Menu>
      )}
      {isFold && renderIcons(menuData, activeMenuKey)}
    </div>
  );
};