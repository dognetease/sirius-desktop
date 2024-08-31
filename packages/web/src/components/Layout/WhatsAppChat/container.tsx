import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { navigate, useLocation } from '@reach/router';
import qs from 'querystring';
import { SiriusPageProps } from '@/components/Layout/model';
import { filterTree, MenuItemData } from '@web-edm/utils';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import { ExpandableSideContent } from '@/layouts/Main/expandableSideContent';
import { FoldableMenu } from '@web-site/components/MenuIcon/FoldableMenu';
import { FIR_SIDE } from '@web-common/utils/constant';
import { useAppSelector } from '@web-common/state/createStore';
import { FileList as MaterielFileList } from '@web-materiel/pages/FileList';
import { ShareEdit as MaterielShareEdit } from '@web-materiel/pages/ShareEdit';
import { ShareList as MaterielShareList } from '@web-materiel/pages/ShareList';
import MaterielVisitList from '@web-materiel/pages/VisitList';
import { FileUploader as MaterielFileUploader } from '@web-materiel/components/FileUploader';
import { ReactComponent as IconWhatsapp } from '@/images/icons/whatsApp/wa-icon-outline.svg';
import { ReactComponent as IconFolder } from '@/images/icons/whatsApp/folder.svg';
import { ReactComponent as IconManagement } from '@/images/icons/whatsApp/management.svg';
import { WaOperateLog } from '@web/components/Layout/SNS/WhatsApp/waOperateLog';
import { WorkloadStats } from '@web/components/Layout/SNS/WhatsApp/workloadStats';
import WhatsAppChat from './index';

const waMenuData: MenuItemData[] = [
  {
    title: 'wa',
    key: 'wa',
    label: 'WA',
    children: [
      {
        title: '会话列表',
        key: 'waChatList',
        label: 'WA_CHAT_LIST',
        icon: <IconWhatsapp />,
      },
      {
        title: '文件管理',
        key: 'file_management',
        label: 'WA_FILE_MANAGE',
        icon: <IconFolder />,
        trackEventId: '',
        children: [
          {
            title: '分享记录',
            key: 'materielShareList',
            label: 'WA_FILE_SHARE_RECORD',
            trackEventId: '',
          },
          {
            title: '访问记录',
            key: 'materielVisitList',
            label: 'WA_FILE_ACCESS_RECORD',
            trackEventId: [],
          },
          {
            title: '文件列表',
            key: 'materielFileList',
            label: 'WA_FILE_LIST',
            trackEventId: '',
          },
        ],
      },
      {
        title: '会话管理',
        key: 'session',
        label: 'WA_CHAT_MANAGE',
        icon: <IconManagement />,
        trackEventId: '',
        children: [
          {
            title: '关注列表',
            key: 'waOperateLog',
            label: 'WA_CHAT_EMPHASIS_MANAGE_LIST',
            trackEventId: '',
          },
          {
            title: '联系人分组',
            key: 'contactGroup',
            label: 'WA_CHAT_CONTACT_GROUP',
            trackEventId: '',
          },
          {
            title: '工作量统计',
            key: 'workloadStats',
            label: 'WA_CHAT_WORKLOAD_STATS',
            trackEventId: '',
          },
        ],
      },
    ],
  },
];

const WhatsAppChatContainer: React.FC<SiriusPageProps> = props => {
  const location = useLocation();
  const isFoldMenu = useAppSelector(state => state.expandMenuReducer.isFold);
  const menuKeys = useAppSelector(s => s.privilegeReducer.visibleMenuLabels);
  const [menuData, setMenuData] = useState<MenuItemData[]>([]);
  const [activeMenuKey, setActiveMenuKey] = useState('waChatList');
  const [params, setParams] = useState<Record<string, string>>({});

  // 是否展示 iframe
  const isShowIframe = useMemo(() => {
    const menuKeysInIframe = ['waChatList', 'contactGroup'];
    return menuKeysInIframe.includes(activeMenuKey);
  }, [activeMenuKey]);

  const renderContent = () => {
    const map: Record<string, ReactNode> = {
      materielShareList: <MaterielShareList />,
      materielVisitList: <MaterielVisitList />,
      materielShareEdit: <MaterielShareEdit qs={params} />,
      materielFileList: <MaterielFileList />, // 文件管理
      waOperateLog: <WaOperateLog />,
      workloadStats: <WorkloadStats />,
    };
    return map[activeMenuKey];
  };

  useEffect(() => {
    setMenuData(filterTree(waMenuData, menuKeys));
  }, [menuKeys]);

  useEffect(() => {
    const params = qs.parse(location.hash.split('?')[1]) as Record<string, string>;
    setActiveMenuKey(params.page);
    setParams(params);
  }, [location.hash]);

  useEffect(() => {
    const params = qs.parse(location.hash.split('?')[1]);
    const page = params.page as string;
    setActiveMenuKey(page || 'waChatList');
  }, []);

  // 切换菜单
  const handleMenuClick = (current: { key: string }) => {
    const key = current.key;
    setActiveMenuKey(key);
    navigate(`#${props.name}?page=${key}`);
    // 展示联系人分组
    // 工作量统计
  };

  return (
    <PageContentLayout>
      <ExpandableSideContent borderRight minWidth={FIR_SIDE} defaultWidth={220} isFold={isFoldMenu}>
        <FoldableMenu
          defaultOpenKeys={menuData[0]?.children?.map(item => item.key)}
          isFold={false}
          handleMenuClick={handleMenuClick}
          menuData={menuData}
          activeMenuKey={activeMenuKey}
        />
      </ExpandableSideContent>
      <div style={{ width: '100%', height: '100%' }}>
        <WhatsAppChat qs={{ page: activeMenuKey, ...params }} style={{ display: isShowIframe ? 'block' : 'none' }} {...props} />
        {renderContent()}
        <MaterielFileUploader />
      </div>
    </PageContentLayout>
  );
};

export default WhatsAppChatContainer;
