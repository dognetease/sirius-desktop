/* eslint-disable react/destructuring-assignment */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import qs from 'querystring';
import { FIR_SIDE } from '@web-common/utils/constant';
import { ConfigProvider, Menu } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { navigate } from 'gatsby';
// eslint-disable-next-line import/no-extraneous-dependencies
import { useLocation } from '@reach/router';
import { TongyongXunhuan, TongyongRenyuan4, TongyongZijin, TongyongQuanbu } from '@sirius/icons';
import { RootState, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getMenuSettingsAsync, getPrivilegeAsync } from '@web-common/state/reducer/privilegeReducer';
import { getIn18Text } from 'api';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import { filterTree } from '@web-edm/utils';
import { SiriusL2cSetting as App, NoPermission } from '@lxunit/app-l2c-crm';
import { useSelector } from 'react-redux';
import { VariableSetting } from './variables/variableSetting';
import { SaleStage } from './saleStage/saleStage';
import SalesPitchPageHoc from './salesPitch';
import { WhatsAppAccountManage } from './whatsAppAccountManage';
import styles from './index.module.scss';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import { SiriusPageProps } from '@/components/Layout/model';
import { EdmQuota } from './edmQuota/EdmQuota';
import { MailTagSetting } from './mailTag/MailTagSetting';
import { CheckField } from './checkField/checkField';
import { AuthWhitelist } from '../Customer/CustomerDiscovery/containers/AuthorizationWhitelist';
import { getTransText } from '@/components/util/translate';
import { OpenSeaSetting } from './openSeaSetting/openSeaSetting';
import { NoticeSetting } from './noticeSetting/noticeSetting';
import { SystemTaskConfig } from './systemTaskConfig';
import { MarketingSetting } from './MarketingSetting';
import { WaProviderV2 } from '../SNS/WhatsAppV2/context/WaContextV2';
import { WaOperateLog } from '../SNS/WhatsApp/waOperateLog';
import { FoldableMenu, MenuItemData } from '@/components/UI/MenuIcon/FoldableMenu';
import { ExpandableSideContent } from '@/layouts/Main/expandableSideContent';

const SiriusL2cSetting = () => {
  const modulePermission = useSelector((state: RootState) => state.privilegeReducer.modules);
  const productCode = useSelector((state: RootState) => state.privilegeReducer.version);
  const loading = useSelector((state: RootState) => state.privilegeReducer.loading) || productCode === '';
  const location = useLocation();

  if (modulePermission && Object.keys(modulePermission).length > 0 && !loading) {
    const search = new URLSearchParams(location.hash.split('?')[1]);
    const settingTab = search.get('settingTab');
    const tableId = search.get('page')?.split('-setting')[0] as string;
    return <App tableId={tableId} settingTab={settingTab} />;
  }
  if (loading) {
    return null;
  }
  return <NoPermission />;
};

const AL_MENU_DATA_V1: MenuItemData[] = [
  {
    key: 'customerSetting',
    title: getIn18Text('KEHUSHEZHI'),
    label: '',
    children: [
      {
        title: getTransText('XIANSUOHEGONGHAIXIANSUO'),
        key: 'leads-setting',
        label: '',
      },
      {
        title: getTransText('KEHU') + getTransText('HE') + getTransText('GONGHAIKEHU'),
        key: 'customer-setting',
        label: '',
      },
      {
        title: getTransText('XIAOSHOUDINGDAN'),
        key: 'order-setting',
        label: '',
      },
      {
        title: getTransText('SHANGJI'),
        key: 'customer_opportunity-setting',
        label: '',
      },
      {
        title: `${getTransText('WANGLAIYOUJIAN')}-${getTransText('BAIMINGDAN')}`,
        key: 'authorizationEmail',
        label: 'ORG_SETTINGS_WHITELIST_SETTING',
      },
      {
        title: `${getTransText('HUASHUKU')}`,
        key: 'salesPitch',
        label: 'ORG_SETTINGS_WORD_ART_LIBRARY',
      },
    ],
  },
  {
    title: getIn18Text('SHANGPINGUANLISHEZHI'),
    key: 'goodSetting',
    label: '',
    children: [
      {
        title: getTransText('BENDISHANGPIN'),
        key: 'product-setting',
        label: '',
      },
      {
        title: getTransText('PINGTAISHANGPIN'),
        key: 'platform_product-setting',
        label: '',
      },
      {
        title: getTransText('GONGYINGSHANGGUANLI'),
        key: 'supplier-setting',
        label: '',
      },
      {
        title: getTransText('HUILVSHEZHI'),
        key: 'exchange_rate-setting',
        label: '',
      },
    ],
  },
  {
    key: 'edmSetting',
    title: getIn18Text('YINGXIAO'),
    label: '',
    children: [
      {
        key: 'variables',
        title: getIn18Text('YOUJIANYINGXIAOMOBANBIANLIANG'),
        label: 'ORG_SETTINGS_TMPL_VARIABLE_SETTING',
      },
      {
        key: 'quota',
        title: getIn18Text('YOUJIANYINGXIAOPEIE'),
        label: 'ORG_SETTINGS_QUOTA_SETTING',
      },
      {
        key: 'marketingSetting',
        title: getIn18Text('YOUJIANYINGXIAOFAJIANXIAN'),
        label: 'ORG_SETTINGS_EMAIL_SEND_QUOTA_SETTING',
      },
    ],
  },
  {
    key: 'otherSetting',
    title: getIn18Text('QITA'),
    label: '',
    children: [
      {
        key: 'mailTag',
        title: getIn18Text('YOUJIANZHINENGBIAOQIAN'),
        label: 'ORG_SETTINGS_AI_TAG_SETTING',
      },
      {
        key: 'noticeSetting',
        title: getIn18Text('TONGZHISHEZHI'),
        label: 'ORG_SETTINGS_NOTIFY_SETTING',
      },
      {
        key: 'systemTaskConfig',
        title: getTransText('RENWUGUIZESHEZHI'),
        label: 'ORG_SETTINGS_TASK_CENTER_RULE_SETTING',
      },
    ],
  },
];

const AL_MENU_DATA_V2: MenuItemData[] = [
  {
    key: 'customer-development',
    title: getIn18Text('KEHUKAIFA'),
    label: 'ORG_SETTINGS_CUSTOMER_EXLOIT',
    icon: <TongyongXunhuan style={{ fontSize: 16, color: '#6F7485', strokeWidth: 1.3 }} />,
    children: [
      {
        key: 'variables',
        title: getIn18Text('YOUJIANYINGXIAOMOBANBIANLIANG'),
        label: 'ORG_SETTINGS_TMPL_VARIABLE_SETTING',
      },
      {
        key: 'quota',
        title: getIn18Text('YOUJIANYINGXIAOPEIE'),
        label: 'ORG_SETTINGS_QUOTA_SETTING',
      },
      {
        key: 'marketingSetting',
        title: getIn18Text('YOUJIANYINGXIAOFAJIANXIAN'),
        label: 'ORG_SETTINGS_EMAIL_SEND_QUOTA_SETTING',
      },
      {
        key: 'insertWhatsApp',
        title: getIn18Text('WhatsAppDUIJIE'),
        label: 'ORG_SETTINGS_PEER_SETTING',
      },
    ],
  },
  {
    key: 'customer-management',
    title: getIn18Text('KEHUGUANLISHEZHI'),
    label: 'ORG_SETTINGS_CUSTOMER_MANAGE',
    icon: <TongyongRenyuan4 style={{ fontSize: 16, color: '#6F7485', strokeWidth: 1.3 }} />,
    children: [
      {
        title: getTransText('XIANSUOHEGONGHAIXIANSUO'),
        key: 'leads-setting',
        label: 'ORG_SETTINGS_CHANNEL_AND_OPEN_SEA',
      },
      {
        title: getTransText('KEHUHEGONGHAIKEHU'),
        key: 'customer-setting',
        label: 'ORG_SETTINGS_CUSTOMER_AND_OPEN_SEA',
      },
      {
        title: getTransText('SHANGJI'),
        key: 'customer_opportunity-setting',
        label: 'ORG_SETTINGS_COMMERCIAL',
      },
      {
        title: `${getTransText('WANGLAIYOUJIAN')}-${getTransText('BAIMINGDAN')}`,
        key: 'authorizationEmail',
        label: 'ORG_SETTINGS_WHITELIST_SETTING',
      },
    ],
  },
  {
    key: 'customer-fulfillment',
    title: getIn18Text('KEHULVYUE'),
    label: 'ORG_SETTINGS_PRODUCT',
    icon: <TongyongZijin style={{ fontSize: 16, color: '#6F7485', strokeWidth: 1.3 }} />,
    children: [
      {
        title: getTransText('XIAOSHOUDINGDAN'),
        key: 'order-setting',
        label: 'ORG_SETTINGS_ORDER',
      },
      {
        title: getTransText('BENDISHANGPIN'),
        key: 'product-setting',
        label: 'ORG_SETTINGS_LOCAL_PRODUCT',
      },
      {
        title: getTransText('PINGTAISHANGPIN'),
        key: 'platform_product-setting',
        label: 'ORG_SETTINGS_PLATFORM_PRODUCT',
      },
      {
        title: getTransText('GONGYINGSHANGGUANLI'),
        key: 'supplier-setting',
        label: 'ORG_SETTINGS_SUPPLIER',
      },
      {
        title: getTransText('HUILVSHEZHI'),
        key: 'exchange_rate-setting',
        label: 'ORG_SETTINGS_EXCHANGE_SETTING',
      },
    ],
  },
  {
    key: 'others',
    title: getIn18Text('QITA'),
    label: 'ORG_SETTINGS_OTHERS',
    icon: <TongyongQuanbu style={{ fontSize: 16, color: '#6F7485', strokeWidth: 1.3 }} />,
    children: [
      {
        key: 'mailTag',
        title: getIn18Text('YOUJIANZHINENGBIAOQIAN'),
        label: 'ORG_SETTINGS_AI_TAG_SETTING',
      },
      {
        title: `${getTransText('HUASHUKU')}`,
        key: 'salesPitch',
        label: 'ORG_SETTINGS_WORD_ART_LIBRARY',
      },
      {
        key: 'noticeSetting',
        title: getIn18Text('TONGZHISHEZHI'),
        label: 'ORG_SETTINGS_NOTIFY_SETTING',
      },
      {
        key: 'systemTaskConfig',
        title: getTransText('RENWUGUIZESHEZHI'),
        label: 'ORG_SETTINGS_TASK_CENTER_RULE_SETTING',
      },
    ],
  },
];

const ProductVersion = {
  FREE: 'FREE', // 体验版
  FASTMAIL: 'FASTMAIL', // 外贸版
  WEBSITE: 'WEBSITE', // 建站版
  FASTMAIL_AND_WEBSITE: 'FASTMAIL_AND_WEBSITE', // 外贸和建站版
  FASTMAIL_EXPIRED: 'FASTMAIL_EXPIRED', // 外贸过期版
};

export const EnterpriseSetting: React.FC<SiriusPageProps> = props => {
  const location = useLocation();
  const appDispatch = useAppDispatch();

  const [activeMenu, setActiveMenu] = useState('noticeSetting');
  const [menuData, setMenuData] = useState<MenuItemData[]>([]);

  const v1v2 = useVersionCheck();
  const isFoldMenu = useAppSelector(state => state.expandMenuReducer.isFold);
  const menuKeys = useAppSelector(state => state.privilegeReducer.visibleMenuLabels);
  const productCode = useAppSelector(state => state.privilegeReducer.version);

  const allMenuData = useMemo<MenuItemData[]>(() => (v1v2 === 'v2' ? AL_MENU_DATA_V2 : AL_MENU_DATA_V1), [v1v2]);
  const SalesPitchPage = useMemo(() => SalesPitchPageHoc('settingBoard'), []);

  const getWhatsAppMenuItem = useCallback((initialMenuData: MenuItemData[]) => {
    if (initialMenuData.length === 0) {
      return [];
    }
    const waChildren = [
      {
        key: 'insertWhatsApp',
        title: getIn18Text('WhatsAppDUIJIE'),
        label: 'ORG_SETTINGS_PEER_SETTING',
      },
    ].filter(childItem => {
      if (childItem.label === 'ORG_SETTINGS_WA_EMPHASIS_MANAGE_LIST') {
        return menuKeys[childItem.label];
      }
      return true;
    });
    const waMenuItem: MenuItemData = {
      key: 'whatsApp',
      title: 'WhatsApp',
      label: '',
      children: waChildren,
    };
    // 放其他上边
    const data = initialMenuData.filter(v => v.key !== 'whatsApp');
    const lastIndex = data.length - 1;
    if (data[lastIndex].key === 'otherSetting') {
      return [...data.slice(0, lastIndex), waMenuItem, ...data.slice(lastIndex)];
    }
    return [...data, waMenuItem];
  }, []);

  const handleMenuClick = (key: string) => {
    setActiveMenu(key);
    navigate(`#${props.name}?page=${key}`);
  };

  const renderPage = useCallback(menu => {
    switch (menu) {
      case 'variables':
        return <VariableSetting />;
      case 'saleStage':
        return <SaleStage />;
      case 'quota':
        return <EdmQuota />;
      case 'mailTag':
        return <MailTagSetting />;
      case 'checkField':
        return <CheckField />;
      case 'insertWhatsApp':
        return (
          <WaProviderV2>
            <WhatsAppAccountManage />
          </WaProviderV2>
        );
      case 'waOperateLog':
        return <WaOperateLog />;
      case 'authorizationEmail':
        return <AuthWhitelist />;
      case 'openSeaSetting':
        return <OpenSeaSetting />;
      case 'noticeSetting':
        return <NoticeSetting />;
      case 'systemTaskConfig':
        return <SystemTaskConfig />;
      case 'salesPitch':
        return <SalesPitchPage />;
      case 'marketingSetting':
        return <MarketingSetting />;
      case 'customer-setting':
        return <SiriusL2cSetting key="customer" />;
      case 'order-setting':
        return <SiriusL2cSetting key="order" />;
      case 'customer_opportunity-setting':
        return <SiriusL2cSetting key="customer_opportunity" />;
      case 'product-setting':
        return <SiriusL2cSetting key="product" />;
      case 'platform_product-setting':
        return <SiriusL2cSetting key="platform_product" />;
      case 'supplier-setting':
        return <SiriusL2cSetting key="supplier" />;
      case 'leads-setting':
        return <SiriusL2cSetting key="leads" />;
      case 'exchange_rate-setting':
        return <SiriusL2cSetting key="exchange_rate" />;
      default:
        return <NoticeSetting />;
    }
  }, []);

  const handleMenuDataV1 = useCallback(
    (data: MenuItemData[]) => {
      const isWebSite = productCode === ProductVersion.WEBSITE;
      const initialMenuData: MenuItemData[] = filterTree(data, menuKeys);
      let handledMenuData: MenuItemData[];
      if (isWebSite) {
        handledMenuData = initialMenuData
          .filter(i => ['customerSetting', 'goodSetting'].includes(i.key))
          .map(i => {
            if (i.key === 'customerSetting') {
              return { ...i, children: Array.isArray(i.children) ? i.children.filter(it => it.key === 'customer-setting') : [] };
            }
            if (i.key === 'goodSetting') {
              return { ...i, children: Array.isArray(i.children) ? i.children.filter(it => it.key === 'product-setting') : [] };
            }
            return i;
          });
      } else {
        handledMenuData = getWhatsAppMenuItem(initialMenuData);
      }
      console.warn('enterpriseSetting setMenuData v1 isWebSite', isWebSite);
      console.warn('enterpriseSetting setMenuData v1 initialMenuData', initialMenuData);
      console.warn('enterpriseSetting setMenuData v1 handledMenuData', handledMenuData);
      setMenuData(handledMenuData);
    },
    [menuKeys, productCode, getWhatsAppMenuItem]
  );

  const handleMenuDataV2 = useCallback(
    (data: MenuItemData[]) => {
      const visibleMenuData: MenuItemData[] = filterTree(data, menuKeys);
      console.log('enterpriseSetting setMenuData v2 origin', data);
      console.log('enterpriseSetting setMenuData v2 processed', visibleMenuData);
      setMenuData(visibleMenuData);
    },
    [menuKeys, productCode, getWhatsAppMenuItem]
  );

  // 处理菜单
  useEffect(() => {
    if (v1v2 === 'v2') {
      handleMenuDataV2(allMenuData);
    } else {
      handleMenuDataV1(allMenuData);
    }
  }, [allMenuData, v1v2, handleMenuDataV1, handleMenuDataV2]);

  // 处理选中状态
  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    if (moduleName !== props.name) {
      return;
    }
    const params = qs.parse(location.hash.split('?')[1]);
    const page = params.page as string;
    const matchMenu = menuData.some(menu => menu.children?.some(i => i.key === page));
    if (matchMenu) {
      handleMenuClick(page);
      console.log('enterpriseSetting setActiveMenu by hash', page);
    } else {
      const parent = menuData.length > 0 ? menuData[0] : undefined;
      const child = parent?.children ? parent.children[0] : undefined;
      const target = child?.key || parent?.key || '';
      handleMenuClick(target);
      console.log('enterpriseSetting setActiveMenu by menu', target);
    }
  }, [location.hash, menuData]);

  useEffect(() => {
    if (props.active) {
      appDispatch(getPrivilegeAsync());
      appDispatch(getMenuSettingsAsync());
    }
  }, [props.active]);

  if (v1v2 === 'v2') {
    return (
      <ConfigProvider locale={zhCN}>
        <PageContentLayout from="enterpriseSetting" className={styles.enterpriseSetting}>
          <ExpandableSideContent borderRight minWidth={FIR_SIDE} defaultWidth={220} isFold={isFoldMenu}>
            <FoldableMenu
              isFold={false}
              handleMenuClick={e => handleMenuClick(e.key)}
              menuData={menuData}
              activeMenuKey={activeMenu}
              defaultOpenKeys={menuData.map(item => item.key)}
            />
          </ExpandableSideContent>
          <div className={`${styles.enterpriseSettingContainer} customer-global-style`}>{location.hash ? renderPage(activeMenu) : null}</div>
        </PageContentLayout>
      </ConfigProvider>
    );
  }
  return (
    <ConfigProvider locale={zhCN}>
      <PageContentLayout>
        <SideContentLayout borderRight minWidth={FIR_SIDE} className={styles.configSettingWrap} defaultWidth={220}>
          <div className={styles.treeContainer}>
            <Menu expandIcon={null} className="edm-menu sirius-no-drag" selectedKeys={[activeMenu]} onSelect={e => handleMenuClick(e.key)}>
              {menuData.map(item => (
                <Menu.ItemGroup key={item.key} title={item.title}>
                  {item.children?.map(menu => (
                    <Menu.Item key={menu.key} icon={menu.icon}>
                      {menu.title}
                    </Menu.Item>
                  ))}
                </Menu.ItemGroup>
              ))}
            </Menu>
          </div>
        </SideContentLayout>
        {location.hash ? renderPage(activeMenu) : null}
      </PageContentLayout>
    </ConfigProvider>
  );
};
