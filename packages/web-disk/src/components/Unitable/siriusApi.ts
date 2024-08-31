import { platform, apiHolder, apis, conf, ContactAndOrgApi, ContactModel, DataTrackerApi, DataTransApi, NetStorageApi, NSRoleInfo, MailApi, MailConfApi } from 'api';

export const httpApi = apiHolder.api.getDataTransApi() as DataTransApi;
export const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
export const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
export const systemApi = apiHolder.api.getSystemApi();
export const eventApi = apiHolder.api.getEventApi();
export const isElectron = systemApi.isElectron();
export const forElectron = conf('build_for') === 'electron';
export const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
export const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
export const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
export const templateTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
