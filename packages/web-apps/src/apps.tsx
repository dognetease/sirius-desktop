import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useLocation, navigate } from '@reach/router';
// 页面
import { Home } from './pages/Home/Home';
import { ReportSubmit } from './pages/ReportSubmit/ReportSubmit';
import { ReportTemplateEdit } from './pages/ReportTemplateEdit/ReportTemplateEdit';
import { ReportPage } from './pages/ReportPage';
// 组件
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import { AppsHeaderContainer } from './components/AppsHeader/AppsHeader';
// 通用
import { AppsContext } from './context';
// API
import { diskApi } from './api';
import { PageIds, pageIdDict, appsPagesConf, dailyReportAppId, weeklyReportAppId, reportAppId } from './pageMapConf';
//类型
import { SiriusPageProps } from '@/components/Layout/model';
import { ResponseGetUserApp, apiHolder, SystemApi } from 'api';
import { UserAppBasicState, UserAppBasciSatetItem } from './types';
import styles from './apps.module.scss';

const systemApi: SystemApi = apiHolder.api.getSystemApi();

export type UserAppState =
  | {
      loading: true;
    }
  | {
      loading: false;
      /**用户所有app 权限基础信息集合 */
      userAppInfo: UserAppBasicState;
    };

const isReportPage = (pageId: PageIds): boolean => {
  return (
    pageId === pageIdDict.appsReportFill ||
    pageId === pageIdDict.appsReportManage ||
    pageId === pageIdDict.appsDailyReportDetail ||
    pageId === pageIdDict.appsWeeklyReportDetail
  );
};

const getUrlSearchParams = (
  hash: string
): {
  pageId?: PageIds;
} => {
  const searchString = hash.replace(/^[^?]*\??/, '');
  const searchParams = new URLSearchParams(searchString);
  const params = {} as any;
  searchParams.forEach((val, key) => {
    params[key] = val;
  });
  return params;
};
/**
 * true pageId 正确
 * @param pageId
 * @returns
 */
const checkPageId = (pageId?: string): pageId is PageIds => {
  if (pageId) {
    return pageIdDict[pageId as unknown as PageIds] === undefined ? false : true;
  } else {
    return false;
  }
};

function handleGetUserAppRes(res: PromiseSettledResult<ResponseGetUserApp>): UserAppBasciSatetItem {
  if (res.status === 'fulfilled') {
    return {
      permission: res.value.permission,
    };
  } else {
    return {
      permission: 'VIEW',
    };
  }
}

export const Apps: React.FC<SiriusPageProps> = props => {
  const [userAppState, setUserAppInfo] = useState<UserAppState>({ loading: true });
  const [prevPageId, setPrevPageId] = useState<PageIds | undefined>(undefined);
  const location = useLocation();
  const appsHashRef = useRef<string>();
  // 路由切出去后，再回来要展示当前页面，因此需要保留离开前的路由
  if (location.hash.startsWith('#apps')) {
    appsHashRef.current = location.hash;
  }
  const hash = location.hash.startsWith('#apps') ? location.hash : appsHashRef.current;
  const hashSearchParams = getUrlSearchParams(hash ?? '');
  const pageId = checkPageId(hashSearchParams.pageId) ? hashSearchParams.pageId : pageIdDict.appsHome;

  React.useEffect(() => {
    setPrevPageId(pageId);
  }, [pageId]);

  const setPageIdCallback = useCallback((pageId: PageIds) => {
    const search = new URLSearchParams('');
    search.append('pageId', pageId);
    navigate('#apps?' + search.toString(), {
      replace: true,
    });
  }, []);

  useEffect(() => {
    Promise.allSettled([
      diskApi.getUserApp({ appId: dailyReportAppId }),
      diskApi.getUserApp({ appId: weeklyReportAppId }),
      diskApi.getUserApp({ appId: reportAppId }),
    ]).then(([dailyRes, weeklyRes, reportRes]) => {
      const userAppInfo: UserAppBasicState = {
        [dailyReportAppId]: handleGetUserAppRes(dailyRes),
        [weeklyReportAppId]: handleGetUserAppRes(weeklyRes),
        [reportAppId]: handleGetUserAppRes(reportRes),
      };
      setUserAppInfo({
        loading: false,
        userAppInfo,
      });
    });
  }, []);

  if (userAppState.loading) {
    return (
      <div style={{ width: '100%', height: '100%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* <div className='sirius-app-loading-icon' /> */}
      </div>
    );
  }

  // 判断当前page是否存在Header
  const locationList = appsPagesConf[pageId].locationList;
  const hasHeader = locationList ? locationList.length > 0 : false;
  return (
    <PageContentLayout from="apps" className={`${systemApi.isWebWmEntry() && styles.pageContentWm}`}>
      {/* 应用中心的通用状态管理：例如：当前页面 */}
      <AppsContext.Provider
        value={{
          prevPageId,
          pageId,
          setPageId: setPageIdCallback,
          userAppInfo: userAppState.userAppInfo,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            background: isReportPage(pageId) ? '#f7f7f7' : '#fff',
          }}
          className="extheme"
        >
          {/* 渲染通用Header */}
          {hasHeader && pageId !== pageIdDict.appsHome ? <AppsHeaderContainer pageId={pageId} /> : null}
          {/* 应用中心首页 */}
          {pageId === pageIdDict.appsHome ? <Home pageId={pageId} /> : null}
          {/* 日报填写页 */}
          {pageId === pageIdDict.appsDailyReport || pageId === pageIdDict.appsDailyReportFromFillTab ? <ReportSubmit pageId={pageId} appId={dailyReportAppId} /> : null}
          {/* 日报模板编辑页 */}
          {pageId === pageIdDict.appsDailyReportTemplateEdit ? <ReportTemplateEdit pageId={pageId} appId={dailyReportAppId} /> : null}
          {/* 周报填写页 */}
          {pageId === pageIdDict.appsWeeklyReport || pageId === pageIdDict.appsWeeklyReportFromFillTab ? (
            <ReportSubmit pageId={pageId} appId={weeklyReportAppId} />
          ) : null}
          {/* 周报模板编辑页 */}
          {pageId === pageIdDict.appsWeeklyReportTemplateEdit ? <ReportTemplateEdit pageId={pageId} appId={weeklyReportAppId} /> : null}
          {/* 汇报页 - 填写/查看/管理 */}
          {isReportPage(pageId) ? <ReportPage pageId={pageId} /> : null}
        </div>
      </AppsContext.Provider>
    </PageContentLayout>
  );
};

export default Apps;
