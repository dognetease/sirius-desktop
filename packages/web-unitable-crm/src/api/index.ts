/*
 * @Author: wangzhijie02
 * @Date: 2022-06-13 14:03:45
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-07-08 14:35:18
 * @Description: file content
 */
import {
  apiHolder,
  apis,
  MailApi,
  MailTemplateApi,
  MailProductApi,
  // MailApi,
  NetStorageApi,
  CustomerDiscoveryApi,
  ContactAndOrgApi,
  DataTrackerApi,
  EdmRoleApi,
  ErrorReportApi,
  MailConfApi,
  ProductAuthApi,
} from 'api';
import { config } from 'env_def';
export const stage = config('stage');
const isWeb = config('build_for') === 'web';
export const host: string = isWeb ? '' : (config('host') as string);

//    const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
export const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
export const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
export const templateApi = apiHolder.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
export const systemApi = apiHolder.api.getSystemApi();
export const docHost = config('docHost') as string;
export const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
export const loggerApi = apiHolder.api.requireLogicalApi(apis.loggerApiImpl) as DataTrackerApi;

export const productApi = apiHolder.api.requireLogicalApi(apis.mailProductImplApi) as unknown as MailProductApi;
export const eventApi = apiHolder.api.getEventApi();
export const customerDiscoveryApi = process.env.BUILD_ISEDM ? (apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi) : null;
export const roleApi = process.env.BUILD_ISEDM ? (apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi) : null;
export const dataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
export const errorReportApi = apiHolder.api.requireLogicalApi(apis.errorReportImpl) as unknown as ErrorReportApi;
export const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
export const productAuthApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
