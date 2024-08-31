import React, { useState, useEffect, ReactNode } from 'react';
import { ConfigProvider, Menu } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import qs from 'querystring';
// eslint-disable-next-line import/no-extraneous-dependencies
import { useLocation, navigate } from '@reach/router';
import _ from 'lodash';
import { FIR_SIDE } from '@web-common/utils/constant';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import { SiriusPageProps } from '@/components/Layout/model';
import { MySite } from './mySite';
import { SiteStat } from './stat';
import { StatDetails } from './stat/StatDetails';
import { Market } from './market';
import { MyDomain } from './domainManage/myDomain';
import { OrderManage } from './domainManage/orderManage';
import { InfoTemplate } from './domainManage/infoTemplate';
import { CreateInfoTemplate } from './domainManage/createInfoTemplate';
import { CheckInfoTemplate } from './domainManage/checkInfoTemplate';
import { PurchaseCert } from './domainManage/purchaseCert';
import { MyCert } from './domainManage/myCert';
import DomainBind from './mySite/DomainBind';
import DomainDetail from './mySite/DomainDetail';
import { SiteCustomer } from './siteCustomer';
import SeoConfig from './mySite/SeoConfig';
import DomainSearch from './mySite/DomainSearch';
import DomainSearchResult from './mySite/DomainSearchResult';
import DomainPurchaseConfirm from './mySite/DomainPurchaseConfirm';
import DomainPurchasePay from './mySite/DomainPurchasePay';
import DomainRecord from './mySite/DomainRecord';
import { BrandBuilding } from './brandBuilding';

import style from './index.module.scss';

import { filterTree } from '@web-edm/utils';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import { ReactComponent as BrandIcon } from '../../web-common/src/images/icons/pinpaijianshe.svg';
import { ReactComponent as MySiteIcon } from '../../web-common/src/images/icons/site.svg';
import { ReactComponent as IconWodezhandian } from '../../web-entry-wm/src/layouts/config/svg/v2/wodezhandian.svg';
import { ReactComponent as SiteMarketIcon } from '../../web-common/src/images/icons/site_market.svg';
import { ReactComponent as SiteStatIcon } from '../../web-common/src/images/icons/site_stat.svg';
// import { ReactComponent as SiteCustomerIcon } from '../../web-common/src/images/icons/site_customer.svg';
import { ReactComponent as SiteDomainIcon } from '../../web-common/src/images/icons/site_domain.svg';
import { ReactComponent as IconToufangguanli } from '../../web-common/src/images/icons/toufangguanli.svg';
import { FoldableMenu } from './components/MenuIcon/FoldableMenu';
import { ExpandableSideContent } from '@/layouts/Main/expandableSideContent';
import { getIn18Text } from 'api';

import { SnsMarketingMenuData } from '@web-sns-marketing/menu';
import { MarketingTaskCreate } from '@web-sns-marketing/marketingTask/create/index';
import SnsMarketingTaskList from '@web-sns-marketing/marketingTask/list/index';

import SnsPostManage from '@web-sns-marketing/postManage/index';
import SnsAccountBinding from '@web-sns-marketing/accountBinding/index';
import SnsSendPost from '@web-sns-marketing/sendPost/index';
import SnsCalendar from '@web-sns-marketing/calendar/index';
import SnsMessage from '@web-sns-marketing/message/index';
import { SnsTaskDetail } from '@web-sns-marketing/taskDetail';
import { SnsAccountData } from '@web-sns-marketing/dataAnalysis/account';
import { SnsGlobalData } from '@web-sns-marketing/dataAnalysis/global';

import { ArticleList } from './articleManage/articleList';
import { ArticleEdit } from './articleManage/articleEdit';
import { ArticleCategory } from './articleManage/articleCategory';
import TrafficDelivery from './TrafficDelivery';

interface MenuItemData {
  key: string;
  title: string;
  label: string;
  icon?: React.ReactNode;
  children?: Array<MenuItemData>;
}
const siteMenuData = [
  {
    title: getIn18Text('ZHANDIANGUANLI'),
    key: 'site',
    label: 'WEBSITE_ADMIN',
    children: [
      {
        title: '品牌首页',
        key: 'brand',
        label: 'WEBSITE_MAIN_PAGE',
        icon: <BrandIcon />,
      },
      {
        title: '建站管理',
        key: 'siteManage',
        label: 'WEBSITE_MANAGE',
        icon: <IconWodezhandian />,
        children: [
          {
            title: getIn18Text('WODEZHANDIAN'),
            key: 'mySite',
            label: 'WEBSITE_ADMIN_MINE',
            trackEventId: 'client_2_My_Site',
          },
          {
            title: getIn18Text('YINGXIAOLUODIYE'),
            key: 'market',
            label: 'WEBSITE_ADMIN_MARKET',
            trackEventId: 'client_2_Marketing_landing_page',
          },
          {
            title: getIn18Text('ZHANDIANSHUJU'),
            key: 'stat',
            label: 'WEBSITE_ADMIN_DATA',
            trackEventId: 'client_2_Site_Data',
          },
          {
            title: getIn18Text('YUMINGGUANLI'),
            key: 'myDomain',
            label: 'DOMAIN_ADMIN',
            trackEventId: 'client_2_Domain_management',
          },
          {
            title: getIn18Text('SITE_WENZHANGGUANLI'),
            key: 'articleList',
            label: 'ARTICLE_ADMIN',
            trackEventId: 'client_2_Article_management',
          },
        ],
      },

      // 海外社媒
      ...SnsMarketingMenuData,
      {
        key: 'deliveryManage',
        title: '投放管理',
        label: 'PLACEMENT_MAMAGE',
        icon: <IconToufangguanli />,
        children: [
          {
            key: 'trafficDelivery',
            title: '流量投放',
            label: 'TRAFFIC_PLACEMENT',
          },
        ],
      },
    ],
  },
];

let tracked = false;
const Site: React.FC<SiriusPageProps> = props => {
  const location = useLocation();
  const [page, setPage] = useState('index');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});
  const [activeMenuKey, setActiveMenuKey] = useState('sended');
  // const [lastPage, setLastPage] = useState('');
  const [menuData, setMenuData] = useState<MenuItemData[]>([]);
  // const [templateId, setTemplateId] = useState<string>('');
  const menuKeys = useAppSelector(state => state.privilegeReducer.visibleMenuLabels);
  const isFoldMenu = useAppSelector(state => state.expandMenuReducer.isFold);
  const version = useAppSelector(state => state.privilegeReducer.version);
  const v1v2 = useVersionCheck();
  // const appDispatch = useAppDispatch();

  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    if (moduleName !== 'site') {
      return;
    }
    const params = qs.parse(location.hash.split('?')[1]);
    const page = params.page as string;
    setPage(page);
    setPageParams(params);
    const matchMenu = [...menuData].some(menu => {
      return menu.children?.some(i => i.key === page);
    });
    const getPageKey = () => {
      if (
        [
          'market',
          'stat',
          'statDetails',
          'domain',
          'domainDetail',
          'domainSearch',
          'domainSearchResult',
          'domainPurchaseConfirm',
          'domainPurchasePay',
          'seo',
          'siteCustomer',
          'myDomain',
          'orderManage',
          'infoTemplate',
          'createInfoTemplate',
          'checkInfoTemplate',
          'purchaseCert',
          'recordDomain',
          'myCert',
          'articleList',
          'articleEdit',
          'categoryList',
          'snsMarketingTaskEdit',
          'snsMarketingTask',
          'snsPostManage',
          'snsAccountBinding',
          'snsSendPost',
          'snsCalendar',
          'snsMessage',
          'snsGlobalDataAnalysis',
          'brand',
          'trafficDelivery',
          'mySite',
        ].includes(page)
      ) {
        return page;
      }

      if ('snsAccountDataAnalysis' === page) {
        return 'snsAccountBinding';
      }

      if ('snsMarketingTaskEdit' === page || 'snsMarketingTaskDetail' === page) {
        return 'snsMarketingTask';
      }
      return 'brand';
    };
    setActiveMenuKey(matchMenu ? page : getPageKey());
  }, [location, menuData]);

  const handleMenuClick = (current: { key: string }) => {
    const key = current.key;
    navigate(`#${props.name}?page=${key}`);
  };
  const renderContent = (key: string, qs: Record<string, any>) => {
    const map: Record<string, ReactNode> = {
      mySite: <MySite />,
      trafficDelivery: <TrafficDelivery />,
      market: <Market />,
      stat: <SiteStat />,
      index: <BrandBuilding />,
      statDetails: <StatDetails qs={qs} />,
      domain: <DomainBind qs={qs} />,
      domainDetail: <DomainDetail qs={qs} />,
      seo: <SeoConfig qs={qs} />,
      domainSearch: <DomainSearch qs={qs} />,
      domainSearchResult: <DomainSearchResult qs={qs} />,
      domainPurchaseConfirm: <DomainPurchaseConfirm qs={qs} />,
      domainPurchasePay: <DomainPurchasePay qs={qs} />,
      siteCustomer: <SiteCustomer />,
      myDomain: <MyDomain />,
      orderManage: <OrderManage />,
      infoTemplate: <InfoTemplate />,
      createInfoTemplate: <CreateInfoTemplate qs={qs} />,
      checkInfoTemplate: <CheckInfoTemplate qs={qs} />,
      purchaseCert: <PurchaseCert qs={qs} />,
      recordDomain: <DomainRecord qs={qs} />,
      snsMarketingTaskDetail: <SnsTaskDetail qs={qs} />,
      myCert: <MyCert />,
      articleList: <ArticleList />,
      articleEdit: <ArticleEdit qs={qs} />,
      categoryList: <ArticleCategory />,

      snsMarketingTaskEdit: <MarketingTaskCreate qs={qs} />,
      snsMarketingTask: <SnsMarketingTaskList />,
      snsPostManage: <SnsPostManage />,
      snsAccountBinding: <SnsAccountBinding />,
      snsSendPost: <SnsSendPost />,
      snsCalendar: <SnsCalendar />,
      snsMessage: <SnsMessage />,
      snsGlobalDataAnalysis: <SnsGlobalData qs={qs} />,
      snsAccountDataAnalysis: <SnsAccountData qs={qs} />,
      brand: <BrandBuilding />,
    };
    return map[key] || map['index'];
  };

  useEffect(() => {
    if (version === 'WEBSITE') {
      let siteMenuData2 = _.cloneDeep(siteMenuData);
      siteMenuData2[0].children = siteMenuData2[0].children.map(menuItem => ({
        ...menuItem,
        children: menuItem.children?.filter(item => item.label != 'WEBSITE_TARGET_CONTACT'),
      }));
      setMenuData(filterTree(siteMenuData2, menuKeys));
    } else {
      setMenuData(filterTree(siteMenuData, menuKeys));
    }
  }, [menuKeys, version, v1v2]);

  useEffect(() => {
    if (!tracked) {
      // edmDataTracker.trackPv(EDMPvType.EdmModule);
      tracked = true;
    }
  }, []);

  return (
    <ConfigProvider locale={zhCN}>
      <PageContentLayout className={style.edm}>
        {page !== 'snsMarketingTaskEdit' && page !== 'snsSendPost' && (
          <ExpandableSideContent borderRight minWidth={FIR_SIDE} defaultWidth={220} isFold={isFoldMenu}>
            <FoldableMenu
              defaultOpenKeys={['siteManage', 'snsMarketing', 'deliveryManage']}
              isFold={false}
              handleMenuClick={handleMenuClick}
              menuData={menuData}
              activeMenuKey={activeMenuKey}
            />
          </ExpandableSideContent>
        )}
        {renderContent(page, pageParams)}
      </PageContentLayout>
    </ConfigProvider>
  );
};
export default Site;
