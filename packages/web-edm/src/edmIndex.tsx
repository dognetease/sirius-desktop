import React, { useState, useEffect, ReactNode } from 'react';
import { ConfigProvider, Menu } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import qs from 'querystring';
// eslint-disable-next-line import/no-extraneous-dependencies
import { useLocation, navigate } from '@reach/router';
import { FIR_SIDE } from '@web-common/utils/constant';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getMenuSettingsAsync, getModuleDataPrivilegeAsync, getPrivilegeAsync } from '@web-common/state/reducer/privilegeReducer';
import { getCompanyCheckRules } from '@web-common/state/reducer/customerReducer';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import { SiriusPageProps } from '@/components/Layout/model';
import { SendedMarketing } from './sendedMarketing';
import { EdmDetail } from './detail/detailV2';
import { Draft } from './draft/draft';
import { Contact } from './contact/contact';
import { EdmWriteMail } from './send/write';
import Blacklist from './blacklist/blacklist';
import { MailTemplate } from './mailTemplate';
import { TemplateAddModal } from './mailTemplate/template/index';

import AddressBookIndex from './addressBook/pages/index';
import AddressBookGroupDetail from './addressBook/pages/groupDetail';
import AddressBookSourceDetail from './addressBook/pages/sourceDetail';
import AutoMarketTask from './autoMarket/task';
import AutoMarketTaskDetail from './autoMarket/taskDetail';
import AutoMarketTaskEdit from './autoMarket/taskEdit';
import { AddressHistoryIndex } from './addressBook/pages/history/index';
import { AddressHistoryDetail } from './addressBook/pages/history/detail';
import AddressBookPublicHistoryIndex from './addressBook/pages/publicHistory';
import AddressBookPublicHistoryDetail from './addressBook/pages/publicHistory/detail';
import AddressBookOpenSea from './addressBook/pages/openSea/index';

import style from './edm.module.scss';
import { edmDataTracker, EDMPvType } from './tracker/tracker';
import { autoMarketTracker } from './autoMarket/tracker';

import { filterTree } from './utils';
import MenuIcons from '@/components/UI/MenuIcon';
import { FoldableMenu } from '@/components/UI/MenuIcon/FoldableMenu';
import { ExpandableSideContent } from '@/layouts/Main/expandableSideContent';

interface MenuItemData {
  key: string;
  title: string;
  label: string;
  icon?: React.ReactNode;
  children?: Array<MenuItemData>;
}
const edmMenuData = [
  {
    title: '营销联系人',
    key: 'addressBook',
    label: 'ADDRESS_BOOK',
    children: [
      {
        title: '营销联系人',
        key: 'addressBookIndex',
        label: 'ADDRESS_BOOK_LIST',
        icon: <MenuIcons.AddressMenuIcon />,
      },
      {
        key: 'addressBookOpenSea',
        title: '地址簿公海',
        label: 'ADDRESS_OPEN_SEA',
        icon: <MenuIcons.DraftMenuIcon />,
      },
      {
        key: 'contact',
        title: '营销统计',
        label: 'MARKET_DATA_STAT',
        icon: <MenuIcons.EdmStatMenuIcon />,
      },
    ],
  },
  {
    title: typeof window !== 'undefined' ? window.getLocalLabel('YOUJIANYINGXIAO') : '',
    key: 'edm',
    label: 'EDM',
    children: [
      {
        title: typeof window !== 'undefined' ? window.getLocalLabel('FAJIANRENWU') : '',
        key: 'index',
        label: 'EDM_SENDBOX',
        icon: <MenuIcons.SendBoxMenuIcon />,
      },
      {
        key: 'drafts',
        title: typeof window !== 'undefined' ? window.getLocalLabel('CAOGAOLIEBIAO') : '',
        label: 'EDM_DRAFT_LIST',
        icon: <MenuIcons.DraftMenuIcon />,
      },
      // {
      //     key: 'contact',
      //     title: '数据统计',
      //     label: 'EDM_DATA_STAT',
      //     icon: <MenuIcons.EdmStatMenuIcon />
      // },
      // {
      //     key: 'blacklist',
      //     title: '营销黑名单',
      //     label: 'EDM_BLACKLIST',
      //     icon: <MenuIcons.EdmBlackListMenuIcon />
      // },
      // {
      //   key: 'autoMarketTask',
      //   title: typeof window !== 'undefined' ? window.getLocalLabel('ZIDONGHUAYINGXIAO') : '',
      //   label: 'EDM_SENDBOX',
      //   icon: <MenuIcons.EdmAutoMarketIcon />,
      // },
      {
        key: 'mailTemplate',
        title: typeof window !== 'undefined' ? window.getLocalLabel('YOUJIANMOBAN') : '',
        label: 'EDM_TEMPLATE',
        icon: <MenuIcons.MailTemplateIcon />,
      },
    ],
  },
];

let tracked = false;
const Marketing: React.FC<SiriusPageProps> = props => {
  const location = useLocation();
  const [page, setPage] = useState('index');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});
  const [activeMenuKey, setActiveMenuKey] = useState('sended');
  const [lastPage, setLastPage] = useState('');
  const [menuData, setMenuData] = useState<MenuItemData[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const menuKeys = useAppSelector(state => state.privilegeReducer.visibleMenuLabels);
  const isFoldMenu = useAppSelector(state => state.expandMenuReducer.isFold);
  const appDispatch = useAppDispatch();

  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    if (moduleName !== 'edm') {
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
      switch (page) {
        case 'autoMarketTaskDetail':
        case 'autoMarketTaskEdit':
          return 'index';
        case 'templateAddModal':
          return 'mailTemplate';
        case 'addressBookGroupDetail':
        case 'addressBookSourceDetail':
        case 'addressHistoryIndex':
        case 'addressHistoryDetail':
          return 'addressBookIndex';
        case 'addressPublicHistoryIndex':
        case 'addressPublicHistoryDetail':
          return 'addressBookOpenSea';
        default:
          return 'index';
      }
    };
    setActiveMenuKey(matchMenu ? page : getPageKey());
    // 记录返回页面
    if (page !== 'write' && page !== 'batchWrite' && page !== 'autoMarketTaskEdit') {
      setLastPage(location.hash);
    }
  }, [location, menuData]);

  const handleMenuClick = (current: { key: string }) => {
    console.error('tab change', current);
    const key = current.key;
    navigate(`#${props.name}?page=${key}`);
    if (key === 'addressBookIndex') {
      edmDataTracker.track('waimao_address_book');
    } else if (key === 'addressBookOpenSea') {
      edmDataTracker.track('waimao_address_book_sea');
    }
  };
  const renderContent = (key: string, qs: Record<string, any>) => {
    const map: Record<string, ReactNode> = {
      addressBookIndex: <AddressBookIndex />,
      addressBookGroupDetail: <AddressBookGroupDetail qs={qs} />,
      addressBookSourceDetail: <AddressBookSourceDetail qs={qs} />,
      index: <SendedMarketing qs={qs} />,
      detail: <EdmDetail qs={qs} />,
      drafts: <Draft qs={qs} />,
      contact: <Contact qs={qs} />,
      write: <EdmWriteMail qs={qs} back={back} />,
      blacklist: <Blacklist />,
      autoMarketTask: <AutoMarketTask />,
      autoMarketTaskDetail: <AutoMarketTaskDetail />,
      autoMarketTaskEdit: <AutoMarketTaskEdit qs={qs} />,
      mailTemplate: <MailTemplate goTemplateAdd={goTemplateAdd} />,
      templateAddModal: <TemplateAddModal templateId={templateId} goMailTemplate={goMailTemplate} />,
      addressHistoryIndex: <AddressHistoryIndex qs={qs} />,
      addressBookOpenSea: <AddressBookOpenSea />,
      addressPublicHistoryIndex: <AddressBookPublicHistoryIndex />,
      addressPublicHistoryDetail: <AddressBookPublicHistoryDetail qs={qs} />,
      addressHistoryDetail: <AddressHistoryDetail qs={qs} />,
    };
    return map[key] || map['index'];
  };
  const back = () => {
    if (lastPage) {
      navigate(lastPage);
    } else {
      navigate('#edm?page=index');
    }
  };

  const goTemplateAdd = (templateId?: string) => {
    setTemplateId(templateId || '');
    navigate('#edm?page=templateAddModal');
  };

  const goMailTemplate = (refresh?: boolean) => {
    // setTemplateId('');
    navigate('#edm?page=mailTemplate');
  };

  useEffect(() => {
    // console.log('filterTree(edmMenuData, menuKeys)', menuKeys, filterTree(edmMenuData, menuKeys))
    setMenuData(filterTree(edmMenuData, menuKeys));
  }, [menuKeys]);

  useEffect(() => {
    if (!tracked) {
      edmDataTracker.trackPv(EDMPvType.EdmModule);
      tracked = true;
    }
  }, []);
  useEffect(() => {
    if (props.active) {
      appDispatch(getPrivilegeAsync());
      appDispatch(getMenuSettingsAsync());
      appDispatch(getModuleDataPrivilegeAsync('EDM'));
      appDispatch(getCompanyCheckRules());
    }
  }, [props.active]);

  return (
    <ConfigProvider locale={zhCN}>
      <PageContentLayout className={style.edm}>
        {page !== 'write' && page !== 'batchWrite' && page !== 'autoMarketTaskEdit' && (
          <ExpandableSideContent borderRight minWidth={FIR_SIDE} defaultWidth={220} isFold={isFoldMenu}>
            <FoldableMenu isFold={false} handleMenuClick={handleMenuClick} menuData={menuData} activeMenuKey={activeMenuKey} />
          </ExpandableSideContent>
        )}
        <div>{renderContent(page, pageParams)}</div>
      </PageContentLayout>
    </ConfigProvider>
  );
};
export default Marketing;
