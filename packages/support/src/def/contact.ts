export default {
  getEnterpriseContactList: '/cowork/api/biz/pageable/enter/enterpriseContactList',
  // 新全量接口1.19版本上线
  getFullEnterpriseContactList: '/cowork/api/biz/pageable/enter/enterpriseContactListFull',
  // 通讯录核心数据接口
  coreEnterpriseContactList: '/cowork/api/biz/enter/shortEnterpriseContactList',
  coreEnterpriseOrgList: '/cowork/api/biz/enter/shortUnitList',

  getPersonContactList: '/cowork/api/biz/person/personContactList',
  deleteContact: '/cowork/api/biz/person/deletePersonContact',
  updateContact: '/cowork/api/biz/person/updatePersonContact',
  insertContact: '/cowork/api/biz/person/addPersonContact',
  insertContactBatch: '/cowork/api/biz/person/addPersonContactBatch',
  getOrgList: '/cowork/api/biz/enter/unitList',
  getPersonalOrgList: '/cowork/api/biz/person/getContactGroups',
  insertPersonalOrg: '/cowork/api/biz/person/saveContactGroup',
  updatePersonalOrg: '/cowork/api/biz/person/updateContactGroup',
  deletePersonalOrg: '/cowork/api/biz/person/deleteContactGroups',
  addPersonToPersonalOrg: '/cowork/api/biz/person/addPersonToGroups',
  reviseUnit: '/cowork/api/biz/enter/reviseUnit',
  reviseEnterContact: '/cowork/api/biz/enter/reviseEnterContact',
  uploadIcon: '/cowork/api/biz/icon/uploadIcon',
  deleteAvatarIcon: '/cowork/api/biz/icon/deleteIcon',
  getContactByYunxin: '/cowork/api/biz/enter/getContactByYnxin',
  getDomainListByOrg: '/cowork/api/biz/enter/getDomainListByOrg',

  // 20221114新增接口.doc:https://docs.popo.netease.com/lingxi/003be794a86244c7826bcdd5bd3b940c
  searchContact: '/cowork/api/biz/enter/searchContact',
  getContactByUnitId: '/cowork/api/biz/enter/getContactByUnitId',
  getContactByQiyeAccountId: '/cowork/api/biz/enter/getContactByQiyeAccountId',

  // 20221226新增接口
  operateMailList: '/cowork/api/biz/enter/operateMailList',

  // 20230228新增接口
  addPersonalMark: '/cowork/api/biz/person/addMark',

  // 20230417新增接口
  personContactImport: '/cowork/api/biz/person/personContactImport',
  personContactExport: '/cowork/api/biz/person/personContactExport',
  personContactExportTemplate: '/cowork/api/biz/person/personContactExportTemplate',
};
