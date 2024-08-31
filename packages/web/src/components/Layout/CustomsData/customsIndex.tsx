import React, { ReactNode, useEffect, useState } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { navigate, useLocation } from '@reach/router';
import qstring from 'querystring';
import { FIR_SIDE, getBodyFixHeight } from '@web-common/utils/constant';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getMenuSettingsAsync, getPrivilegeAsync } from '@web-common/state/reducer/privilegeReducer';
import { filterTree } from '@web-edm/utils';
import { getCompanyCheckRules } from '@web-common/state/reducer/customerReducer';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import { SiriusPageProps } from '@/components/Layout/model';
import CustomsData from './customs/customs';
import Star from './starMark/star';
import style from './customer.module.scss';
import '../Customer/customer.antd.scss';
import MenuIcons from '@/components/UI/MenuIcon';
import { ExpandableSideContent } from '@/layouts/Main/expandableSideContent';
import { FoldableMenu, MenuItemData } from '@/components/UI/MenuIcon/FoldableMenu';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { CustomsDataMenuClick, customsDataTracker } from './tracker/tracker';
import { apiHolder, apis, EdmCustomsApi } from 'api';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { getIn18Text } from 'api';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

const customerMenuData = [
  {
    title: getIn18Text('HAIGUANSHUJU'),
    key: 'customsData',
    label: 'CUSTOMS',
    children: [
      {
        key: 'customs',
        title: getIn18Text('SHUJUSOUSUO'),
        label: 'CUSTOMS_BIGDATA',
        icon: <MenuIcons.CustomsMenuIcon />,
      },
      {
        key: 'star',
        title: getIn18Text('SHOUCANG'),
        label: 'CUSTOMS_STAR',
        icon: <MenuIcons.CustomsFavorMenuIcon />,
      },
    ],
  },
];

// 此文件已废弃，桌面端海关入口移入 packages/web/src/components/Layout/SceneAggregation/bigData.tsx

const Marketing: React.FC<SiriusPageProps> = props => {
  const location = useLocation();
  const [page, setPage] = useState('index');
  const [activeMenuKey, setActiveMenuKey] = useState('customs');
  const menuKeys = useAppSelector(state => state.privilegeReducer.visibleMenuLabels);
  const isFoldMenu = useAppSelector(state => state.expandMenuReducer.isFold);
  const [menuData, setMenuData] = useState<MenuItemData[]>([]);
  const [showNewRecord, setShowNewRecord] = useState<boolean>();
  const keywordSubCount = useAppSelector(state => state.readCountReducer.unreadCount.customsData);
  const appDispatch = useAppDispatch();
  const locationHash = location.hash;

  useEffect(() => {
    edmCustomsApi
      .doGetEnableRecordPage()
      .then(res => setShowNewRecord(!!res))
      .catch(() => {
        setShowNewRecord(false);
      });
  }, []);

  useEffect(() => {
    const params = qstring.parse(locationHash.split('?')[1]);
    const moduleName = locationHash.substring(1).split('?')[0];
    if (moduleName !== 'customsData') {
      return;
    }
    const qsPage = (Array.isArray(params.page) ? params.page[0] : params.page) || 'customs';
    setPage(qsPage);
    const matchMenu = [...customerMenuData].some(menu => menu.children?.some(i => i.key === qsPage));
    const getPageKey = () => 'customs';
    setActiveMenuKey(matchMenu ? qsPage : getPageKey());
  }, [locationHash]);

  useEffect(() => {
    setMenuData(filterTree(customerMenuData, menuKeys));
  }, [menuKeys]);

  useEffect(() => {
    const changeSubkeywordRedPoint = (prevMenu: MenuItemData[]) => {
      console.log(prevMenu, '???_________>>>>');

      const newMenu: MenuItemData[] = prevMenu.map(e => {
        const men: MenuItemData = {
          ...e,
          children: undefined,
        };
        if (e.key === 'star') {
          men.renPoint = !!keywordSubCount;
        }
        if (e.children) {
          men.children = changeSubkeywordRedPoint(e.children);
        }
        return men;
      });
      return newMenu;
    };
    setMenuData(changeSubkeywordRedPoint(customerMenuData));
    return () => {};
  }, [keywordSubCount]);

  useEffect(() => {
    if (props.active) {
      appDispatch(getPrivilegeAsync());
      appDispatch(getMenuSettingsAsync());
      appDispatch(getCompanyCheckRules());
    }
  }, [props.active]);

  useEffect(() => {
    customsDataTracker.trackMenuClick(CustomsDataMenuClick.CustomsMenu);
  }, []);

  const handleMenuClick = (current: { key: string }) => {
    const { key } = current;
    navigate(`#${props.name}?page=${key}`);
  };
  const renderContent = (key: string) => {
    const map: Record<string, ReactNode> = {
      customs:
        showNewRecord === undefined ? null : (
          <CustomsData
            defaultTabCompanyType={
              showNewRecord
                ? [
                    {
                      value: 'customs',
                      label: getIn18Text('SOUHAIGUANMAOYISHUJU'),
                    },
                    {
                      label: getIn18Text('SOUCAIGOUSHANG'),
                      value: 'buysers',
                    },
                    {
                      label: getIn18Text('SOUGONGYINGSHANG'),
                      value: 'suppliers',
                    },
                  ]
                : [
                    {
                      label: getIn18Text('SOUCAIGOUSHANG'),
                      value: 'buysers',
                    },
                    {
                      label: getIn18Text('SOUGONGYINGSHANG'),
                      value: 'suppliers',
                    },
                  ]
            }
            defaultCustomsDataType={showNewRecord ? 'customs' : 'buysers'}
          />
        ),
      star: <Star />,
    };
    return map[key] || map.customs;
  };

  return (
    <ConfigProvider autoInsertSpaceInButton={false} locale={zhCN}>
      <PageContentLayout>
        <ExpandableSideContent borderRight minWidth={FIR_SIDE} defaultWidth={220} isFold={isFoldMenu}>
          <FoldableMenu isFold={false} handleMenuClick={handleMenuClick} menuData={menuData} activeMenuKey={activeMenuKey} />
        </ExpandableSideContent>
        <PermissionCheckPage resourceLabel="CUSTOMS" accessLabel="VIEW" menu="CUSTOMS">
          {activeMenuKey !== 'customs' ? <div style={{ height: '100%' }}>{renderContent(page)}</div> : null}
          <div style={{ display: activeMenuKey === 'customs' ? 'block' : 'none', height: '100%' }}>{renderContent('customs')}</div>
        </PermissionCheckPage>
      </PageContentLayout>
    </ConfigProvider>
  );
};

export default Marketing;
