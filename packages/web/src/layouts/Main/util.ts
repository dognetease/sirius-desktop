import { apiHolder, configKeyStore, DataStoreApi, inWindow, util } from 'api';
import { KeyProps, SiriusPageProps } from '@/components/Layout/model';

const inElectron = apiHolder.api.getSystemApi().isElectron;
const storeApi = apiHolder.api.getDataStoreApi();
const scheduleTabOpenInWindow = configKeyStore['scheduleTabOpenInWindow'];
const systemApi = apiHolder.api.getSystemApi();
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const webLayoutPages = ['#message', '#app', '#schedule', '#disk', '#contact', '#setting'];

export const navigateToSchedule = (frameNavCallback?: Function) => {
  const keyHolder = storeApi.getSync(scheduleTabOpenInWindow.keyStr);
  if (inElectron() && keyHolder && keyHolder.suc && keyHolder.data && keyHolder.data === 'true') {
    systemApi.createWindow('schedule');
    return true;
  }
  return frameNavCallback && frameNavCallback();
};

export const isShowWebLayout = () => {
  const hash = (inWindow() && decodeURIComponent(window.location.hash)?.split('?')[0]) || '';
  return !systemApi.isElectron() && !systemApi.inEdm() && webLayoutPages.indexOf(hash) !== -1;
};

export function sortByOrder(tabs: SiriusPageProps[], order: string[]) {
  const mapIndex: Record<string, number> = {};

  order.forEach((key, index) => {
    mapIndex[key] = index;
  });

  let copy = [...tabs].sort((a, b) => {
    const i = mapIndex[a.name];
    const j = mapIndex[b.name];
    if (i === undefined && j === undefined) {
      return 0;
    }
    if (i !== undefined && j === undefined) {
      return -1;
    }
    if (i === undefined && j !== undefined) {
      return 1;
    }
    return i - j;
  });

  if (process.env.BUILD_ISEDM) {
    copy = copy.filter(tab => !['schedule', 'disk', 'contact', 'apps', 'enterpriseSetting'].includes(tab.name));
  }
  return copy;
}

export const TAB_STORAGE_KEY = 'SIDEBAR_ORDER';

export const TAB_DEFAULT_ORDER = [
  'mailbox', // 邮箱
  'wa',
  'wmData',
  'edm',
  'unitable-crm',
  'worktable',
  'enterpriseSetting',
  'site',
  'schedule', // 日历
  'contact', // 通讯录
  'message', // 消息
  'disk', // 云文档
];

export function getTabsFromLocal(): string[] {
  try {
    const { data } = dataStoreApi.getSync(TAB_STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as string[];
    }
    return [];
  } catch (e) {
    console.error('getTabsFromLocal', e);
    return [];
  }
}

export function saveTabsToLocal(data: string[]) {
  dataStoreApi.put(TAB_STORAGE_KEY, JSON.stringify(data), {
    noneUserRelated: false,
  });
}

export function getDefaultOrderFromLocal(tabs: Array<SiriusPageProps>) {
  const tabsFromLocal = getTabsFromLocal();
  const order: string[] = tabsFromLocal.length > 0 ? tabsFromLocal : TAB_DEFAULT_ORDER;
  return sortByOrder(tabs, Array.isArray(order) ? order : TAB_DEFAULT_ORDER);
}

export const TAB_STR_SEP = '#@#';

export const recordDragList = <T>(list: T[], startIndex: number, endIndex: number) => {
  const result = [...list];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export const getKeyBoardList = (): KeyProps[] => {
  const command = util.getCommonTxt(' ');
  const separator = '';
  const base: KeyProps[] = [
    {
      id: 'setting',
      name: '设置',
      key: command + separator + '0',
      show: inElectron(),
    },
    {
      id: 'mailbox',
      name: '邮箱',
      key: command + separator + '1',
      show: true,
    },
    {
      id: 'message',
      name: '消息',
      key: command + separator + '2',
      show: inElectron(),
    },
    {
      id: 'schedule',
      name: '日历',
      key: command + separator + '3',
      show: inElectron(),
    },
    {
      id: 'disk',
      name: '云文档',
      key: command + separator + '4',
      show: inElectron(),
    },
    {
      id: 'contact',
      name: '通讯录',
      key: command + separator + '5',
      show: inElectron(),
    },
  ];

  if (process.env.BUILD_ISEDM) {
    const extra: KeyProps[] = [
      {
        id: 'edm',
        name: '营销',
        key: command + separator + '6',
        show: inElectron(),
      },
      {
        id: 'customer',
        name: '客户',
        key: command + separator + '7',
        show: inElectron(),
      },
    ];
    base.push(...extra);
  }
  return base;
};
