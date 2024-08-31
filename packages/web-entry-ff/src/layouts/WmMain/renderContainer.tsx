import React, { ReactNode, useEffect, useReducer, useRef, useState, useMemo } from 'react';
import { MenuItemData } from '@/components/UI/MenuIcon/FoldableMenu';
import { useAppSelector, useAppDispatch, useActions } from '@web-common/state/createStore';
import qs from 'querystring';
import { navigate, useLocation } from '@reach/router';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import {
  getPrivilegeAsync,
  getVersionAsync,
  getMenuSettingsAsync,
  getModuleDataPrivilegeAsync,
  getIsFreeVersionUser,
  getIsSomeMenuVisbleSelector,
} from '@web-common/state/reducer/privilegeReducer';
import { SendedMarketing } from '@web-edm/sendedMarketing';
import { EdmDetail } from '@web-edm/detail/detailV2';
import { Draft } from '@web-edm/draft/draft';
import { Contact } from '@web-edm/contact/contact';
import { EdmWriteMail } from '@web-edm/send/write';
import { MarketingRoot } from '@web-edm/send/marketingRoot';
import { RoleMembers } from '@web/components/Layout/Rbac/member/member';
import { RoleManager } from '@web/components/Layout/Rbac/roleManager/roleManager';
import { RoleDetail } from '@web/components/Layout/Rbac/roleManager/roleDetail';
import { MenuManage } from '@web/components/Layout/Rbac/menuManage/menuManage';
import { MailTemplate } from '@web-edm/mailTemplate/indexV2';
import { TemplateAddModal } from '@web-edm/mailTemplate/template';
import { Contact as AddressBookDatastat } from '@web-edm/contact/contact';
import Guide from '@web-entry-ff/layouts/container/guide';

// 货代
import Statistics from '@web-entry-ff/views/statistics';
import Price from '@web-entry-ff/views/price';
import InvalidPrice from '@web-entry-ff/views/price/invalidPrice';
import UploadPirce from '@web-entry-ff/views/price/upload/index';
import AddPrice from '@web-entry-ff/views/price/upload/addIndex';
import { Order } from '@web-entry-ff/views/order';
import TerminalClient from '@web-entry-ff/views/customer/customers';
import { Freight } from '@web-entry-ff/views/freight';
import LevelAdmin from '@web-entry-ff/views/customer/levelAdmin';
import { SearchStatDetail } from '@web-entry-ff/views/statistics/detail';

import PageContentLayout from '../Main/pageContentLayout';
import style from './container.module.scss';

import { apiHolder, DataTrackerApi, inWindow, MailApi, apis, NetStorageApi, NIMApi, EdmCustomsApi, api, LoginApi } from 'api';
import { isIndirect } from '@web-common/utils/waimao';

import { getCompanyCheckRules } from '@web-common/state/reducer/customerReducer';
import { getMyRolesAsync } from '@web-common/state/reducer/privilegeReducer';
import { NoPermissionPage } from '@/components/UI/PrivilegeEnhance';
import classNames from 'classnames';

import { WebEntryWmActions } from '@web-common/state/reducer';

const systemApi = apiHolder.api.getSystemApi();
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;

let RenderContainer: React.FC<any> = props => {
  const location = useLocation();
  const [page, setPage] = useState<string>('edmIindex');
  const [lastPage, setLastPage] = useState('');
  const [menuData, setMenuData] = useState<MenuItemData[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [activeModule, setActiveModule] = useState('');
  const [tempContent, setTempContent] = useState('');
  const [prevScene, setPrevScene] = useState('newCreate');
  const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';
  const [cachedTabs, setCachedTabs] = useState<{ tab: string; page: string; query: any }[]>([]);
  // const { cachedTabs } = useAppSelector(state => state.webEntryWmReducer);
  // const { setCachedTabs } = useActions(WebEntryWmActions);
  console.log('xxx-renderContainer', cachedTabs);

  const appDispatch = useAppDispatch();

  useEffect(() => {
    window.navigate = navigate;
    const moduleName = location.hash.substring(1).split('?')[0];
    const params = qs.parse(location.hash.split('?')[1]);
    const page = params.page as string;

    setPage(page);
    setActiveModule(moduleName);
    setCachedTabs(() => [{ tab: moduleName, page, query: params }]);
    // setCachedTabs({ moduleName, page, params })
    // 记录返回页面
    if (page !== 'write' && page !== 'autoMarketTaskEdit') {
      if (systemApi.isWebWmEntry()) {
        location.hash.includes(routerWord) && setLastPage(location.hash);
      } else {
        setLastPage(location.hash);
      }
    }
  }, [location, menuData]);

  const goTemplateAdd = (templateId?: string, content?: string) => {
    setTemplateId(templateId || '');
    setTempContent(content || '');
    navigate('#edm?page=templateAddModal');
  };

  const goMailTemplate = (refresh?: boolean) => {
    // setTemplateId('');
    navigate('#edm?page=mailTemplate');
  };

  const renderContentWaimao = (key: string, qs: Record<string, any>) => {
    console.log('xxxxxkey', key, qs);
    const map: Record<string, ReactNode> = {
      validPrice: <Price />,
      invalidPrice: <InvalidPrice />,
      uploadPrice: <UploadPirce />,
      addPrice: <AddPrice />,
      terminalClient: <TerminalClient />,
      levelAdmin: <LevelAdmin />,
      application: <Order />,
      statisticsData: <Statistics />,
      SearchStatistics: <SearchStatDetail qs={qs} />,
      freightRate: <Freight />,

      // edm
      index: (
        <Guide code="edm">
          <SendedMarketing qs={qs} />
        </Guide>
      ),
      detail: <EdmDetail qs={qs} />,
      product: null,
      drafts: (
        <Guide code="edm">
          <Draft qs={qs} />
        </Guide>
      ),
      contact: <Contact qs={qs} />, // 10.31 版本隐藏
      write: <MarketingRoot qs={qs} back={back} key={prevScene} />,
      mailTemplate: (
        <Guide code="edm">
          <MailTemplate goTemplateAdd={goTemplateAdd} />
        </Guide>
      ),
      templateAddModal: <TemplateAddModal templateId={templateId} goMailTemplate={goMailTemplate} content={tempContent} />,
      addressBookDatastat: (
        <Guide code="edm">
          <AddressBookDatastat qs={qs} />
        </Guide>
      ),

      // 企业设置——权限
      members: props?.isAdmin ? <RoleMembers /> : <NoPermissionPage />,
      rolePermissions: props?.isAdmin ? <RoleManager /> : <NoPermissionPage />,
      roleDetail: <RoleDetail qs={qs} />,
      menuSetting: props?.isAdmin ? <MenuManage /> : <NoPermissionPage />,
    };
    return map[key];
  };

  useEffect(() => {
    if (props.active && isIndirect(page)) {
      appDispatch(getPrivilegeAsync());
      appDispatch(getVersionAsync());
      appDispatch(getCompanyCheckRules());

      // ?todo
      appDispatch(getModuleDataPrivilegeAsync('EDM'));
    }
    appDispatch(getMenuSettingsAsync());
    appDispatch(getMyRolesAsync());
  }, [props.active]);

  useEffect(() => {
    if (process.env.BUILD_ISEDM) {
      loginApi.reportEdmLogin();
    }
  }, []);

  // write
  const back = () => {
    if (lastPage) {
      navigate(lastPage);
    } else {
      navigate(`${routerWord}?page=index`);
    }
  };

  return (
    <>
      {isIndirect(page) ? (
        <ConfigProvider locale={zhCN}>
          <PageContentLayout className={classNames([style.renderContainer])}>
            {/* <customerContext.Provider value={{ value: { state: customerBaseState, dispatch: customerBaseDispatch, fetchTableData } }}> */}
            {cachedTabs
              .filter(tab => isIndirect(tab.page))
              .map(tab => (
                <div key={tab.tab} style={{ display: activeModule === tab.tab ? '' : 'none', width: '100%', height: '100%', position: 'relative' }}>
                  {tab.page !== 'index' && renderContentWaimao(tab.page, tab.query)}
                  <div style={tab.page === 'index' ? { display: 'inline' } : { display: 'none' }}>
                    <Guide code="edm">
                      <SendedMarketing visiable={tab.page === 'index'} qs={tab.query} />
                    </Guide>
                  </div>
                </div>
              ))}
            {/* </customerContext.Provider> */}
          </PageContentLayout>
        </ConfigProvider>
      ) : (
        <></>
      )}
    </>
  );
};

export { RenderContainer };
