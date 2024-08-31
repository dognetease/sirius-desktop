import { getIn18Text } from 'api';
import { ruleEngine } from '../../../../../env/src';
import { navigate } from 'gatsby';
import { apiHolder, apis, DataTrackerApi } from '../../../../../api/src';
import { Moment } from 'moment-timezone';

const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = apiHolder.api.getSystemApi();
export interface SortableProps {
  order_by?: string;
  is_desc?: boolean;
}

export const getSortOrder = (data: SortableProps | undefined, key: string) => {
  if (!data || !data.order_by || data.order_by !== key) {
    return null;
  }
  return data.is_desc ? 'descend' : 'ascend';
};

export const isEqualOrder = (a: SortableProps, b: SortableProps) => {
  return a.order_by === b.order_by && a.is_desc === b.is_desc;
};

/**
 * 处理工作台跳转在客户端和web表现不一致的问题
 */
export const pushNavigateCrossMultiClient = (url: string) => {
  if (url === '/#wmData?page=star') {
    // 全球搜和海关数据跳转同一个页面给了两个不一样的url，问原因是要兼容老包，在这里强制统一一下
    url = '/#customsData?page=star';
  }
  if (systemApi.isWebWmEntry()) {
    // 外贸web端
    if (url.split('?')[0].indexOf('unitable-crm') > -1) {
      systemApi.openNewWindow(url);
    } else if (url.indexOf('#mailbox') > -1) {
      systemApi.openNewWindow(url);
    } else {
      systemApi.openNewWindow(ruleEngine(url, null));
    }
  } else {
    // 外贸客户端和老web端
    if (url.indexOf('#globalSearch') > -1) {
      url = url.replace('#globalSearch', '#wmData');
    }
    if (url.indexOf('#customsData') > -1) {
      url = url.replace('#customsData', '#wmData');
    }
    navigate(url);
  }
};

export const workTableTrackAction = (eventId: string, action: string) => {
  let suffix = '';
  if (systemApi.isWebWmEntry()) {
    suffix = '-web';
  } else {
    suffix = '-desktop';
  }

  trackApi.track(`${eventId}${suffix}`, {
    action: action,
  });
};

const weekDayCnNameMap: Record<string, string> = {
  '0': getIn18Text('ZHOUYI'),
  '1': getIn18Text('ZHOUER'),
  '2': getIn18Text('ZHOUSAN'),
  '3': getIn18Text('ZHOUSI'),
  '4': getIn18Text('ZHOUWU'),
  '5': getIn18Text('ZHOULIU'),
  '6': getIn18Text('ZHOURI'),
};
export const calculateTime = (data: Moment): { hours: string; date: string; week: string } => {
  return {
    hours: data.format('H:mm:ss'),
    date: data.format(getIn18Text('MMYUEDD')),
    week: weekDayCnNameMap[`${data.weekday()}`] || '--',
  };
};

export const getCityGroupName = (timeZoneName: string, cityName: string, countryName: string) => {
  return `${timeZoneName}：${cityName}，${countryName}`;
};
