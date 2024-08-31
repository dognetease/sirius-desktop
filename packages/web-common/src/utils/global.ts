/**
 * 全局定义，需要ui层整体使用的定义应放置于此处维护
 */
import React from 'react';
import { ApiPolicy, ApiResposity, environment, NIMInterface, StringTypedMap, GetLocalLabel } from 'api';
import { Lib } from 'api/src/gen/bundle';
import { PageProps } from 'gatsby';
import { AppsIcon, CalenderIcon, ContactIcon, DiskTabIcon, IMIcon, MailBoxIcon } from '@web-common/components/UI/Icons/icons';
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
    __SIRIUS_DEBUG_COMPONENTS__: (params: Record<string, boolean | undefined>) => void;
    __sirius_redux_store?: any;
    emojiData: {};
    // @ts-ignore
    SDK: {
      Chatroom: any;
      NIM: NIMInterface;
      util: {
        [k: string]: any;
      };
    };
    apiPolicies: StringTypedMap<ApiPolicy>;
    getLocalLabel: GetLocalLabel;
  }
}
export const tabs: SiriusPageProps[] = [
  {
    name: 'mailbox',
    tag: '邮箱',
    icon: MailBoxIcon,
    url: '/mail/',
  },
  {
    name: 'message',
    tag: '消息',
    icon: IMIcon,
    url: '/im/',
  },
  {
    name: 'schedule',
    tag: '日历',
    icon: CalenderIcon,
    url: '/schedule/',
  },
  {
    name: 'disk',
    tag: '云文档',
    icon: DiskTabIcon,
    url: '/disk/',
  },
  {
    name: 'contact',
    tag: '通讯录',
    icon: ContactIcon,
    url: '/contact/',
  },
  {
    name: 'apps',
    tag: '应用中心',
    icon: AppsIcon,
    url: '/apps/',
  },
  {
    name: 'setting',
    tag: '设置',
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
        tag: 'Mail测试',
        icon: MailBoxIcon,
        url: '/mailboxtest/',
      } as SiriusPageProps,
      {
        name: 'icon',
        tag: 'icon示例',
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
