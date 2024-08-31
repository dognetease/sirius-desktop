/*
 * @Author: wangzhijie02
 * @Date: 2022-06-10 15:38:53
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-06-27 17:17:46
 * @Description: file content
 */
import { ReportType } from './api';

/**日报应用id */
export const dailyReportAppId = '53uisQND7LgXzp1Rag5pvp';
/**周报应用id */
export const weeklyReportAppId = '5RVZFWHyawOVnJenCGdunq';
/**汇报应用id */
export const reportAppId = '4XaFk5aegubgH3iN0Wi6ul';

export type AppIdTypes = typeof dailyReportAppId | typeof weeklyReportAppId | typeof reportAppId;
export const AppIdArray = [dailyReportAppId, weeklyReportAppId, reportAppId] as const;

export const pageIdDict = {
  /**应用中心 */
  appsHome: 'appsHome',
  /**日报填写页 */
  appsDailyReport: 'appsDailyReport',
  appsDailyReportFromFillTab: 'appsDailyReportFromFillTab',
  /**日报编辑页 */
  appsDailyReportTemplateEdit: 'appsDailyReportTemplateEdit',
  /**周报填写页 */
  appsWeeklyReport: 'appsWeeklyReport',
  appsWeeklyReportFromFillTab: 'appsWeeklyReportFromFillTab',
  /**周报编辑页 */
  appsWeeklyReportTemplateEdit: 'appsWeeklyReportTemplateEdit',
  /**汇报查看页 */
  appsDailyReportDetail: 'appsDailyReportDetail',
  appsWeeklyReportDetail: 'appsWeeklyReportDetail',
  /**汇报填写页 */
  appsReportFill: 'appsReportFill',
  /**汇报管理页 */
  appsReportManage: 'appsReportManage',
} as const;
type PageDictKeys = keyof typeof pageIdDict;
export type PageIds = (typeof pageIdDict)[PageDictKeys];
interface PageConf {
  name: string;
  locationList: PageIds[];
  appId: AppIdTypes | undefined;

  /**公用Header ，右侧按钮组的状态配置 */
  header?: {
    btnGroupVisable: boolean;
    reportType: ReportType;
  };
}

export const appsPagesConf: {
  [key in PageIds]: PageConf;
} = {
  appsHome: {
    name: '应用中心',
    locationList: ['appsHome'],
    appId: undefined,
  },
  appsDailyReport: {
    name: '日报',
    locationList: ['appsHome', 'appsDailyReport'],
    appId: dailyReportAppId,
    header: {
      btnGroupVisable: true,
      reportType: 'daily',
    },
  },
  appsDailyReportFromFillTab: {
    name: '日报',
    locationList: ['appsHome', 'appsReportFill', 'appsDailyReport'],
    appId: dailyReportAppId,
    header: {
      btnGroupVisable: true,
      reportType: 'daily',
    },
  },
  appsDailyReportTemplateEdit: {
    name: '修改模板',
    locationList: ['appsHome', 'appsDailyReport', 'appsDailyReportTemplateEdit'],
    appId: dailyReportAppId,
    header: {
      btnGroupVisable: true,
      reportType: 'daily',
    },
  },
  appsWeeklyReport: {
    name: '周报',
    locationList: ['appsHome', 'appsWeeklyReport'],
    appId: weeklyReportAppId,
    header: {
      btnGroupVisable: true,
      reportType: 'weekly',
    },
  },
  appsWeeklyReportFromFillTab: {
    name: '周报',
    locationList: ['appsHome', 'appsReportFill', 'appsWeeklyReport'],
    appId: weeklyReportAppId,
    header: {
      btnGroupVisable: true,
      reportType: 'weekly',
    },
  },
  appsWeeklyReportTemplateEdit: {
    name: '修改模板',
    locationList: ['appsHome', 'appsWeeklyReport', 'appsWeeklyReportTemplateEdit'],
    appId: weeklyReportAppId,
    header: {
      btnGroupVisable: true,
      reportType: 'weekly',
    },
  },
  appsDailyReportDetail: {
    // 汇报日报查看
    name: '汇报',
    locationList: ['appsHome', 'appsDailyReportDetail'],
    appId: reportAppId,
  },
  appsWeeklyReportDetail: {
    // 汇报周报查看
    name: '汇报',
    locationList: ['appsHome', 'appsWeeklyReportDetail'],
    appId: reportAppId,
  },
  appsReportFill: {
    // 汇报填写
    name: '汇报',
    locationList: ['appsHome', 'appsReportFill'],
    appId: reportAppId,
  },
  appsReportManage: {
    // 汇报管理
    name: '汇报',
    locationList: ['appsHome', 'appsReportManage'],
    appId: reportAppId,
  },
};

export const getLocationBarVals = (list?: PageIds[]) => {
  if (list && list.length) {
    return list.map(flag => {
      const conf = appsPagesConf[flag];
      return {
        id: flag as unknown as number,
        name: conf.name,
      };
    });
  }
  return undefined;
};

export interface PageBaseProps {
  pageId: PageIds;
}

export type ReportPageBaseProps = PageBaseProps & {
  appId: typeof dailyReportAppId | typeof weeklyReportAppId;
};
