import { registerRouterInterceptor, ruleEngine } from 'env_def';
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { PageProps, navigate } from 'gatsby';
import { useLocation } from '@reach/router';
import { apiHolder, inWindow, isEdm, MailApi, apis, FFMSApi } from 'api';
import { Layout } from 'antd';
import { HeaderFc, SourceType } from '../layouts/WmMain/HeaderFc';
import SideBar from '@web-entry-ff/layouts/WmMain/sideBar';
import { RenderContainer } from '@web-entry-ff/layouts/WmMain/renderContainer';
import { EdmIcon } from '@web-common/components/UI/Icons/icons';
import SiriusLayout from '@web-entry-ff/layouts';
import { ChildrenType, findActiveKeys, getAllMenuKeys, packedData, topMenu } from '@web-entry-ff/layouts/config/topMenu';
import { speUrl, TopMenuPath, TopMenuType } from './../layouts/config/constant';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import { useAppSelector, useAppDispatch, useActions } from '@web-common/state/createStore';
import { filterSideTree } from '@web-entry-ff/layouts/utils/filterSideTree';
import { NoPermissionPage } from '@/components/UI/PrivilegeEnhance';
import { nanoid } from '../layouts/utils/nanoId';
import { pageTitleMap } from '@web-entry-ff/layouts/utils/pageTitleMap';
import { defaultTabList, useTabContext, ViewtabContext, ViewtabCtxProvider } from '@web-entry-ff/layouts/WmMain/viewtabContext';
import GlobalProvider from '@web-entry-ff/layouts/WmMain/globalProvider';
import { WebEntryWmActions } from '@web-common/state/reducer';
import '../styles/global.scss';

const writeToPattern = /writeMailToContact=([0-9a-zA-Z%_#@\-.]+)/i;
const systemApi = apiHolder.api.getSystemApi();
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const eventApi = apiHolder.api.getEventApi();
const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;

const pathArray = [TopMenuPath.intelliMarketing, TopMenuPath.price, TopMenuPath.order, TopMenuPath.freightRate, TopMenuPath.customerManagement, TopMenuPath.statistics];
const IndexPageWrapper: React.FC<any> = ({ children }) => <SiriusLayout.ContainerLayout isLogin={false}>{children}</SiriusLayout.ContainerLayout>;

const IndexPage: React.FC<PageProps> = ({ location }) => {
  const [sideMenuData, setSideMenuData] = useState<ChildrenType>();
  const [titlePath, setTitlePath] = useState('');
  const [sidePath, setSidePath] = useState<string[]>([]);
  const [allKeys, setAllKeys] = useState<string[]>();
  const menuKeys = useAppSelector(s => s.privilegeReducer.visibleMenuLabels);
  const isEdmAdmin = useAppSelector(state => state.privilegeReducer.roles.some(role => role.roleType === 'ADMIN'));
  const visibleWorktable = menuKeys?.['WORKBENCH'];
  const rbacVisible = useAppSelector(state => state.privilegeReducer.visibleMenuLabels['PRIVILEGE'] === true);
  const isOrg = useAppSelector(state => state.privilegeReducer.visibleMenuLabels['ORG_SETTINGS'] === true);
  const isRbac = isEdm() && isEdmAdmin && rbacVisible; // 有权限设置 权限
  const showComSetting = isRbac || isOrg;
  const locationTag = useLocation();
  const { topMenu: toMenu, posMap, lastPageInModule } = useAppSelector(state => state.webEntryWmReducer);
  const { setPageInModuleMap } = useActions(WebEntryWmActions);
  const { cachedTabs } = useAppSelector(state => state.webEntryWmReducer);
  const isOfficeDomain = systemApi.getCurrentUser()?.domain === 'office.163.com';
  const [shouldShowAppTab, setShouldShowAppTab] = useState<boolean>(false);
  const [hasFf, setFf] = useState<boolean>(false);

  useEffect(() => {
    ffmsApi.ffWhiteList().then(res => {
      setFf(res.whitelist);
    });
  }, []);

  let [tabList, setTablist] = useState(defaultTabList);

  if (inWindow()) {
    document.title = '网易外贸通';
    window.systemApi = systemApi;
    window.isEdm = isEdm;
    window.tabList = tabList;
    window.setTablist = setTablist;
  }

  useCommonErrorEvent('indexCommonErrorOb');

  const onMenuClick = (current: { key: string; keyPath: string[] }) => {
    const { key, keyPath } = current;

    setSidePath(keyPath);

    let isUniqTab = !tabList.some(e => e.path.includes(key));

    if (isUniqTab) {
      let title = pageTitleMap[key] || '默认';

      setTablist([
        ...tabList.map(e => ({ ...e, isActive: false })),
        {
          id: nanoid(),
          path: `#${titlePath}?page=${key}`,
          title,
          isActive: true,
          isCached: false,
        },
      ]);
    } else {
      let tabListNew = tabList.map(e => ({
        ...e,
        isActive: e.path.includes(key) ? true : false,
      }));
      setTablist(tabListNew);
    }
    navigate(`#${titlePath}?page=${key}`);
  };

  const onTopItem = (item: ChildrenType, source: SourceType, target: ChildrenType) => {
    console.log('xxxonTopItem', item, source, target);

    if (target.path === TopMenuPath.mailbox) {
      navigate(`#${TopMenuPath.mailbox}?page=${TopMenuPath.mailbox}`);
    } else {
      let finalPath = [`${target.parent}`];
      let finalTitlePath = item.path;
      if (target.children?.length) {
        // 有多级子菜单，默认选中第一级子菜单
        const _path = getPath(target, []);
        finalPath = [..._path, ...finalPath];
        finalTitlePath = `${target.children?.[0].path}`;
      } else {
        finalPath = [`${target.path}`, `${target.parent}`];
      }
      // 菜单高亮
      // setSidePath(finalPath)
      if (pathArray.includes(finalTitlePath as TopMenuPath)) finalTitlePath = finalPath[0]; // 点击顶部标题时默认选中第一级

      let _key = target.children?.length ? finalTitlePath : target.path;
      // lastPageInModule 缓存上次点击
      const key = source === 'mItem' ? lastPageInModule[item.path] || _key : _key;
      let isUniqTab = !tabList.some(e => e.path.includes(key));

      if (isUniqTab) {
        let title = pageTitleMap[key] || '默认';

        setTablist([
          ...tabList.map(e => ({ ...e, isActive: false })),
          {
            id: nanoid(),
            path: `#${item.path}?page=${key}`,
            title,
            isActive: true,
            isCached: false,
          },
        ]);
      } else {
        let tabListNew = tabList.map(e => ({
          ...e,
          isActive: e.path.includes(key) ? true : false,
        }));
        setTablist(tabListNew);
      }

      const curTab = cachedTabs.find(tab => tab.tab === item.path);
      const params = splitURL(curTab?.query);
      navigate(`#${item.path}?page=${key}${params}`);
    }
  };

  const splitURL = (query: any = {}) => {
    const urlHalf: any = [];
    Object.keys(query)
      .filter(q => q !== 'page')
      .forEach(key => {
        const value = query[key];
        urlHalf.push([key, encodeURIComponent(value)].join('='));
      });
    return urlHalf.length === 0 ? '' : '&' + urlHalf.join('&');
  };

  const getPath = (arg: ChildrenType, temp: string[]) => {
    temp.unshift(arg?.path || '');
    if (arg?.children?.length) {
      getPath(arg.children?.[0], temp);
    }
    return temp;
  };

  const renderContent = useMemo(() => {
    return <RenderContainer name="edm" tag="营销" active={true} icon={EdmIcon} isAdmin={isRbac} />;
  }, [titlePath, isRbac]);

  // 企业设置、IM 事件
  const handleChange = useCallback((type: string) => {
    if (type === TopMenuPath.enterpriseSetting) return;
    if (type === TopMenuPath.personal) {
      setSidePath(['security', 'accountQuery']);
    } else {
      setSidePath(['message', TopMenuPath.coop]);
    }
  }, []);

  const showSideBar = () => {
    return !speUrl.includes(titlePath as TopMenuPath) && titlePath !== '' && !!sideMenuData?.children?.[0].children.length;
  };

  useEffect(() => {
    const targetData = topMenu.find(i => i.path === titlePath);
    const keys = getAllMenuKeys(targetData!, []);
    setAllKeys(keys);
  }, [titlePath, isRbac]);

  useEffect(() => {
    const moduleName = locationTag.hash.substring(1).split('?')[0];
    const params = new URLSearchParams(location.hash.split('?')[1]);
    registerRouterInterceptor();
    const targetData = topMenu.find(i => i.path === moduleName);

    if (!topMenu.map(t => t.path).includes(moduleName)) return;

    if (!speUrl.includes(moduleName as TopMenuPath) && moduleName !== '') {
      let filterData;
      if (targetData) {
        filterData = filterSideTree(targetData, menuKeys, isRbac);
      } else {
        filterData = filterSideTree(topMenu[1], menuKeys);
      }
      const ans: any = findActiveKeys(filterData, params.get('page') as string);
      setSidePath(ans?.xPath?.split(','));
      setSideMenuData(packedData(filterData));
    }
    setTitlePath(moduleName);
    setPageInModuleMap({ mpMap: { [`${moduleName}`]: params.get('page') as string }, key: moduleName });
  }, [locationTag, menuKeys, isRbac, shouldShowAppTab]);

  useEffect(() => {
    const moduleName = locationTag.hash.substring(1).split('?')[0];
    if (moduleName === TopMenuPath.mailbox) {
      navigate(ruleEngine(locationTag.hash, null));
      return;
    }
    if (speUrl.includes(moduleName as TopMenuPath) || moduleName == '' || !topMenu.map(t => t.path).includes(moduleName)) redirectUrl();
  }, [visibleWorktable]);

  const redirectUrl = () => {
    navigate(`#${TopMenuPath.price}?page=validPrice`);
  };

  return (
    <>
      <IndexPageWrapper>
        <ViewtabContext.Provider value={{ tabList, setTablist }}>
          <GlobalProvider>
            <Layout style={{ height: '100%' }} className="web-wm-entry-container">
              <HeaderFc onTopItem={onTopItem} onChange={handleChange} moduleName={titlePath} visibleAdmin={showComSetting} />
              <Layout>
                {showSideBar() && <SideBar sideMenuData={sideMenuData} sidePath={sidePath} allKeys={allKeys} moduleName={titlePath} onMenuClick={onMenuClick} />}
                {renderContent}
              </Layout>
            </Layout>
          </GlobalProvider>
        </ViewtabContext.Provider>
      </IndexPageWrapper>
    </>
  );
};

export default IndexPage;
