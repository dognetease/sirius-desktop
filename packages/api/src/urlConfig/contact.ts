import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class ContactUrl {
  getEnterpriseContactList: string = (host + config('getEnterpriseContactList')) as string;

  // 新全量通讯录接口(1.19上线)
  getFullEnterpriseContactList: string = (host + config('getFullEnterpriseContactList')) as string;

  // 核心通讯录接口(1.20版本上线)
  coreEnterpriseContactList: string = (host + config('coreEnterpriseContactList')) as string;

  coreEnterpriseOrgList: string = (host + config('coreEnterpriseOrgList')) as string;

  deleteContact: string = (host + config('deleteContact')) as string;

  insertContact: string = (host + config('insertContact')) as string;

  updateContact: string = (host + config('updateContact')) as string;

  getPersonContactList: string = (host + config('getPersonContactList')) as string;

  getPersonalOrgList: string = (host + config('getPersonalOrgList')) as string;

  insertContactBatch: string = (host + config('insertContactBatch')) as string;

  insertPersonalOrg: string = (host + config('insertPersonalOrg')) as string;

  updatePersonalOrg: string = (host + config('updatePersonalOrg')) as string;

  deletePersonalOrg: string = (host + config('deletePersonalOrg')) as string;

  addPersonToPersonalOrg: string = (host + config('addPersonToPersonalOrg')) as string;

  getOrgList: string = (host + config('getOrgList')) as string;

  reviseEnterContact: string = (host + config('reviseEnterContact')) as string;

  reviseUnit: string = (host + config('reviseUnit')) as string;

  uploadIcon: string = (host + config('uploadIcon')) as string;

  deleteAvatarIcon: string = (host + config('deleteAvatarIcon')) as string;

  addPersonalMark: string = (host + config('addPersonalMark')) as string;

  getContactByYunxin: string = (host + config('getContactByYunxin')) as string;

  getRecentContactList: string = (host + config('getRecentContactList')) as string;

  addRecentContact: string = (host + config('addRecentContact')) as string;

  getDomainListByOrg: string = (host + config('getDomainListByOrg')) as string;

  searchContact: string = (host + config('searchContact')) as string;

  getContactByUnitId: string = (host + config('getContactByUnitId')) as string;

  getContactByQiyeAccountId: string = (host + config('getContactByQiyeAccountId')) as string;

  operateMailList: string = (host + config('operateMailList')) as string;

  personContactImport: string = (host + config('personContactImport')) as string;

  personContactExport: string = (host + config('personContactExport')) as string;

  personContactExportTemplate: string = (host + config('personContactExportTemplate')) as string;
}
export type ContactUrlKeys = keyof ContactUrl;
const urlConfig = new ContactUrl();
const urlsMap = new Map<ContactUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as ContactUrlKeys, urlConfig[item as ContactUrlKeys]);
});
export default urlsMap;
