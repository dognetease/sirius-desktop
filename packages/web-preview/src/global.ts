/**
 * 全局定义，需要ui层整体使用的定义应放置于此处维护
 */
import React from 'react';
import { ApiPolicy, ApiResposity, environment, NIMInterface, StringTypedMap } from 'api';
import { Lib } from 'env_def';
import { PageProps } from 'gatsby';
import { CalenderIcon, ContactIcon, AppsIcon, DiskTabIcon, IMIcon, MailBoxIcon } from '@web-common/components/UI/Icons/icons';
import { getIn18Text } from 'api';
// @ts-ignore
declare module '*.css';
// @ts-ignore
declare module '*.less';
// @ts-ignore
declare module '*.scss';
// @ts-ignore
declare module '*.sass';
// @ts-ignore
declare module '*.svg';
// @ts-ignore
declare module '*.png';
// @ts-ignore
declare module '*.jpg';
// @ts-ignore
declare module '*.jpeg';
// @ts-ignore
declare module '*.gif';
// @ts-ignore
declare module '*.bmp';
// @ts-ignore
declare module '*.tiff';
// @ts-ignore
declare module 'quill-image-drop-module';
export type PageName = 'mailbox' | 'contact' | 'message' | 'schedule' | 'disk' | 'apps' | 'mailboxtest' | 'icon' | 'setting' | 'index';
export interface SiriusPageProps {
  pageProps?: PageProps;
  name: PageName;
  hideSideBar?: boolean;
  tag?: React.ReactNode | string;
  icon?: any;
  active?: boolean;
  reshow?: boolean;
  hidden?: boolean;
  hideInTab?: boolean;
  url?: string;
}
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BUILD_ISEDM: boolean;
      BUILD_ISLINGXI: boolean;
      BUILD_ISWEB: boolean;
      BUILD_ISELECTRON: boolean;
    }
  }
  interface Window {
    api: ApiResposity;
    siriusVersion: string;
    electronLib: Lib;
    SDK: {
      Chatroom: any;
      NIM: NIMInterface;
      util: {
        [k: string]: any;
      };
    };
    apiPolicies: StringTypedMap<ApiPolicy>;
    // 控制云文档运营通知/nps推荐的冲突
    showDiskNps: boolean;
  }
}
export const tabs: SiriusPageProps[] = [
  {
    name: 'mailbox',
    tag: getIn18Text('YOUXIANG'),
    icon: MailBoxIcon,
    url: '/mail/',
  },
  {
    name: 'message',
    tag: getIn18Text('XIAOXI'),
    icon: IMIcon,
    url: '/im/',
  },
  {
    name: 'schedule',
    tag: getIn18Text('RILI'),
    icon: CalenderIcon,
    url: '/schedule/',
  },
  {
    name: 'disk',
    tag: getIn18Text('YUNWENDANG'),
    icon: DiskTabIcon,
    url: '/disk/',
  },
  {
    name: 'contact',
    tag: getIn18Text('TONGXUNLU'),
    icon: ContactIcon,
    url: '/contact/',
  },
  {
    name: 'apps',
    tag: getIn18Text('YINGYONGZHONGXIN'),
    icon: AppsIcon,
    url: '/apps/',
  },
  {
    name: 'setting',
    tag: getIn18Text('SHEZHI'),
    icon: ContactIcon,
    hidden: true,
    url: '/setting/',
  },
];
if (environment === 'local') {
  tabs.push(
    ...[
      {
        name: 'mailboxtest',
        tag: getIn18Text('MailCE'),
        icon: MailBoxIcon,
        url: '/mailboxtest/',
      } as SiriusPageProps,
      {
        name: 'icon',
        tag: getIn18Text('iconSHI'),
        icon: DiskTabIcon,
        url: '/icon/',
      } as SiriusPageProps,
    ]
  );
}
const tsMap: StringTypedMap<SiriusPageProps> = {};
tabs.forEach(it => {
  tsMap[it.name] = it;
});
export const tabsMap: StringTypedMap<SiriusPageProps> = tsMap;
