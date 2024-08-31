import { ErrorReportApi, apis, apiHolder, PrevScene } from 'api';

export const errorReportApi: ErrorReportApi = apiHolder.api.requireLogicalApi(apis.errorReportImpl) as unknown as ErrorReportApi;

export const getWmDataSentryKeyPrefix = (scene: PrevScene) => `wmData_${scene}_`;

export enum WmDataSentryKey {
  Search = 'search',
  Detail = 'detail',
}

export enum WmDataSentryOp {
  Search = 'search',
  Click = 'click',
  Loaded = 'loaded',
}
