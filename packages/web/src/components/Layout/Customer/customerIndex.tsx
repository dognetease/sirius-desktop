import React, { useState, useEffect, useReducer, ReactNode, useMemo } from 'react';
import { ConfigProvider, Menu } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { useLocation, navigate } from '@reach/router';
import qs from 'querystring';
import { FIR_SIDE } from '@web-common/utils/constant';
import { apiHolder, apis, CustomerApi, DataStoreApi, CustomerDiscoveryApi, BaseInfoRes as BaseSelectType, RegularCustomerMenuData } from 'api';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getMenuSettingsAsync, getPrivilegeAsync } from '@web-common/state/reducer/privilegeReducer';
import { actions, getCompanyCheckRules } from '@web-common/state/reducer/customerReducer';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import { SiriusPageProps } from '@/components/Layout/model';
import { LabelManager } from './label/labelManager';
import { CustomerDuplicateCheck } from './CustomerDuplicateCheck';
import Client from './NewClient/index';
import CustomerOpenSea from './CustomerOpenSea/index';
import Clue from './Clue/clue';
import SeaClue from './SeaClue/openSea';
import Business from './Business/business';
import Extension from './Extension/Index';
import AutoRecommend from './CustomerDiscovery/autoRecommend';
import ManualRecommend from './CustomerDiscovery/manualRecommend';
import RecommendOplist from './CustomerDiscovery/recommendOplist';
import { Authorization } from './CustomerDiscovery/authorization';
import './customer.antd.scss';
import style from './customer.module.scss';
import { customerContext, customerAllState, reducer } from './customerContext';
import { customerDataTracker, CustomerMenuClick } from './tracker/customerDataTracker';
import { filterTree, MenuItemData } from '@web-edm/utils';
import MenuIcons from '@/components/UI/MenuIcon';
import { ExpandableSideContent } from '@/layouts/Main/expandableSideContent';
import { FoldableMenu } from '@/components/UI/MenuIcon/FoldableMenu';
import { DataTransfer } from './DataTransfer';
import ImportRecord from './ImportRecord';
import { regularCustomerTracker, RegularCustomerMenuType } from './CustomerDiscovery/report';
import { getIn18Text } from 'api';

const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
const eventApi = apiHolder.api.getEventApi();
const customerMenuData = [
  {
    title: getIn18Text('KEHU'),
    key: 'customerRoot',
    label: 'CONTACT',
    children: [
      {
        title: getIn18Text('KEHULIEBIAO'),
        key: 'customer',
        label: 'CONTACT_LIST',
        icon: <MenuIcons.CustomerListMenuIcon />,
      },
      {
        title: getIn18Text('KEHUGONGHAI'),
        key: 'customerOpenSea',
        label: 'CONTACT_OPEN_SEA',
        icon: <MenuIcons.CustomerOpenSeaMenuIcon />,
      },
      {
        title: getIn18Text('SHANGJI'),
        key: 'business',
        label: 'CONTACT_COMMERCIAL_LIST',
        icon: <MenuIcons.BusinessListMenuIcon />,
      },
      {
        key: 'labelManager',
        title: getIn18Text('BIAOQIANGUANLI'),
        label: 'CONTACT_TAG_MANAGE',
        icon: <MenuIcons.CustomerLabelMenuIcon />,
      },
      {
        key: 'customerDuplicateCheck',
        title: getIn18Text('KEHUCHAZHONG'),
        label: 'CUSTOMER_DUPLICATE_CHECK',
        icon: <MenuIcons.CustomerDuplicateCheckIcon />,
      },
    ],
  },
  {
    title: getIn18Text('XIANSUO'),
    key: 'clue',
    label: 'CLUE',
    children: [
      {
        title: getIn18Text('XIANSUOGONGHAI'),
        key: 'seaClue',
        label: 'CHANNEL_OPEN_SEA',
        icon: <MenuIcons.OpenSeaMenuIcon />,
      },
      {
        title: getIn18Text('XIANSUOLIEBIAO'),
        key: 'clue',
        label: 'CONTACT_CHANNEL_LIST',
        icon: <MenuIcons.ClueListMenuIcon />,
      },
    ],
  },
  {
    title: getIn18Text('WANGLAIYOUJIANSHAIXUAN'),
    key: 'customerFind',
    label: 'PREVIOUS_CONTACT',
    children: [
      {
        title: getIn18Text('ZIDONGSHAIXUAN'),
        key: 'autoRecommend',
        label: 'PREVIOUS_CONTACT_AUTO_RECOMMEND',
        icon: <MenuIcons.RegularCustomerAuto />,
      },
      {
        title: getIn18Text('SHOUDONGSHAIXUAN'),
        key: 'customRecommend',
        label: 'PREVIOUS_CONTACT_CUSTOM_RECOMMEND',
        icon: <MenuIcons.RegularCustomerManual />,
      },
      {
        title: getIn18Text('SHAIXUANJILUZONGLAN'),
        key: 'recommendOperateList',
        label: 'PREVIOUS_CONTACT_OP_LIST',
        icon: <MenuIcons.RegularCustomerOp />,
      },
      {
        title: getIn18Text('SHOUQUANGUANLI'),
        key: 'authorization',
        label: 'PREVIOUS_CONTACT_GRANT_ADMIN',
        icon: <MenuIcons.RegularCustomerAuth />,
      },
    ],
  },
  {
    title: getIn18Text('WAIMAOGONGJU'),
    key: '',
    label: '',
    children: [
      {
        key: 'extension',
        title: getIn18Text('WANGYIWAIMAOTONGZHUSHOU'),
        label: 'BROWSER_EXTENSION',
        icon: <MenuIcons.ExtensionMenuIcon />,
      },
      {
        key: 'dataTransfer',
        label: 'CONTACT_DATA_MIGRATION',
        title: getIn18Text('SHUJUQIANYI'),
        icon: <MenuIcons.DataTransferMenuIcon />,
      },
      {
        key: 'importRecord',
        title: getIn18Text('DAORUJILU'),
        label: 'IMPORT_RECORD',
        icon: <MenuIcons.CustomerLabelMenuIcon />,
      },
    ],
  },
];
const CUSTOMS_DATA_BASE_INFO = 'CUSTOMS_DATA_BASE_INFO';
const Marketing: React.FC<SiriusPageProps> = props => {
  const [state, dispatch] = useReducer(reducer, customerAllState);
  const location = useLocation();
  const [page, setPage] = useState('index');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});
  const [activeMenuKey, setActiveMenuKey] = useState('sended');
  const menuKeys = useAppSelector(s => s.privilegeReducer.visibleMenuLabels);
  const isFoldMenu = useAppSelector(s => s.expandMenuReducer.isFold);
  const [menuData, setMenuData] = useState<MenuItemData[]>([]);
  const [regularMenuData, setRegularMenuData] = useState<RegularCustomerMenuData>();
  const appDispatch = useAppDispatch();
  const { setBaseSelect } = actions;

  const filteredMenuData = useMemo(() => menuData.filter(menu => Array.isArray(menu.children) && menu.children.length > 0), [menuData]);

  useEffect(() => {
    const params = qs.parse(location.hash.split('?')[1]);
    const moduleName = location.hash.substring(1).split('?')[0];
    if (moduleName !== 'customer') {
      return;
    }
    const page = params.page as string;
    console.log('page...', page, params);
    setPage(page);
    setPageParams(params);
    const matchMenu = [...customerMenuData].some(menu => menu.children?.some(i => i.key === page));
    const getPageKey = () => 'customer';
    setActiveMenuKey(matchMenu ? page : getPageKey());
  }, [location.hash]);

  useEffect(() => {
    console.log('customerMenuData', customerMenuData);
    setMenuData(filterTree(customerMenuData, menuKeys));
  }, [menuKeys]);

  const getGlobalArea = (baseSelect: BaseSelectType) => {
    if (baseSelect && baseSelect.area) {
      return;
    }
    clientApi.getGlobalArea().then(res => {
      console.log('baseSelect-area', res.area);
      dispatch({
        type: 'setBaseSelect',
        payload: {
          baseSelect: {
            ...baseSelect,
            area: res.area,
          },
        },
      });
      appDispatch(
        setBaseSelect({
          ...baseSelect,
          area: res.area,
        })
      );
      dataStoreApi.put(
        CUSTOMS_DATA_BASE_INFO,
        JSON.stringify({
          ...baseSelect,
          area: res.area,
        }),
        {
          noneUserRelated: false,
        }
      );
    });
  };

  const commonDispatch = (baseSelect: BaseSelectType) => {
    let area = [] as BaseSelectType['area'];
    if (state.baseSelect && state.baseSelect.area) {
      area = state.baseSelect.area;
    }
    dispatch({
      type: 'setBaseSelect',
      payload: {
        baseSelect: {
          ...baseSelect,
          area,
        },
      },
    });
    appDispatch(setBaseSelect(baseSelect));
    if (!area || !area.length) {
      getGlobalArea(baseSelect);
    } else {
      appDispatch(
        setBaseSelect({
          ...baseSelect,
          area,
        })
      );
    }
  };

  const getBaseInfo = () => {
    let baseSelect = {} as BaseSelectType;
    clientApi
      .getBaseInfo()
      .then(res => {
        const businessStages = res.business_stage.map(item => ({
          value: Number(item.stage),
          label: item.name,
          type: item.type,
        }));
        baseSelect = {
          ...res,
          businessStages,
        };
        dataStoreApi.put(CUSTOMS_DATA_BASE_INFO, JSON.stringify(res), {
          noneUserRelated: false,
        });
        commonDispatch(baseSelect);
      })
      .catch(async () => {
        // 没有数据
        if (!baseSelect.gender) {
          const { data } = await dataStoreApi.get(CUSTOMS_DATA_BASE_INFO);
          if (data) {
            const oldData = JSON.parse(data);
            commonDispatch(oldData);
          }
        }
      });
  };
  useEffect(() => {
    if (props.active) {
      appDispatch(getPrivilegeAsync());
      appDispatch(getMenuSettingsAsync());
      // 获取基本配置下拉数据
      getBaseInfo();
      appDispatch(getCompanyCheckRules());
    }
  }, [props.active]);

  const handleMenuClick = (current: { key: string }) => {
    const { key } = current;
    console.log('current', current.key);
    navigate(`#${props.name}?page=${key}`);
    if (key === 'customer') {
      return customerDataTracker.trackMenuClick(CustomerMenuClick.Customer);
    }
    if (key === 'labelManager') {
      return customerDataTracker.trackMenuClick(CustomerMenuClick.Label);
    }
    if (key === 'clue') {
      return customerDataTracker.trackMenuClick(CustomerMenuClick.Clue);
    }
    if (key === 'business') {
      return customerDataTracker.trackMenuClick(CustomerMenuClick.Business);
    }

    if (key === 'autoRecommend') {
      return regularCustomerTracker.trackMenuClick(RegularCustomerMenuType.auto);
    }

    if (key === 'customRecommend') {
      return regularCustomerTracker.trackMenuClick(RegularCustomerMenuType.manual);
    }

    if (key === 'recommendOperateList') {
      return regularCustomerTracker.trackMenuClick(RegularCustomerMenuType.record);
    }

    if (key === 'authorization') {
      return regularCustomerTracker.trackMenuClick(RegularCustomerMenuType.auth);
    }
  };

  const renderContent = (key: string, qs: Record<string, any>) => {
    console.log('key....', key);
    const map: Record<string, ReactNode> = {
      labelManager: <LabelManager />,
      customerDuplicateCheck: <CustomerDuplicateCheck />,
      customer: <Client />,
      customerOpenSea: <CustomerOpenSea />,
      business: <Business />,
      clue: <Clue />,
      seaClue: <SeaClue />,
      autoRecommend: <AutoRecommend />,
      customRecommend: <ManualRecommend />,
      recommendOperateList: <RecommendOplist />,
      authorization: <Authorization />,
      extension: <Extension />,
      importRecord: <ImportRecord />,
      dataTransfer: <DataTransfer updateBaseInfo={getBaseInfo} />,
    };
    return map[key] || map.customer;
  };

  // ??? 注意客户的点位
  // useEffect(() => {
  //     if (!tracked) {
  //         edmDataTracker.trackPv(EDMPvType.EdmModule);
  //         tracked = true;
  //     }
  // });
  // customerDiscoveryApi regularMenuData setRegularMenuData

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

  // 增加数量红点
  const finalMenuData = useMemo(() => {
    if (!Array.isArray(filteredMenuData)) {
      return [];
    }
    return filteredMenuData.map(item => {
      const children = (item.children || []).map(child => {
        let badge = 0;
        switch (child?.key) {
          case 'autoRecommend':
            badge = regularMenuData?.auto || 0;
            break;
          case 'customRecommend':
            badge = regularMenuData?.manual || 0;
            break;
          case 'authorization':
            badge = regularMenuData?.count || 0;
            break;
          default:
        }
        return {
          ...child,
          badge,
        };
      });

      return {
        ...item,
        children,
      };
    });
  }, [filteredMenuData, regularMenuData]);

  const fetchTableData = () => {};
  return (
    <ConfigProvider locale={zhCN}>
      <PageContentLayout className={style.customer}>
        <ExpandableSideContent borderRight minWidth={FIR_SIDE} defaultWidth={220} isFold={isFoldMenu}>
          <FoldableMenu isFold={false} handleMenuClick={handleMenuClick} menuData={finalMenuData} activeMenuKey={activeMenuKey} />
        </ExpandableSideContent>
        <div className={`${style.container} customer-global-style`}>
          <customerContext.Provider value={{ value: { state, dispatch, fetchTableData } }}>{renderContent(page, pageParams)}</customerContext.Provider>
        </div>
      </PageContentLayout>
    </ConfigProvider>
  );
};
export default Marketing;
