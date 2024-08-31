export enum GrubProcessCodeEnum {
  globalBatchAddBooks = 'GLOBAL_BATCH_ADD_BOOKS',
  customBatchAddBooks = 'CUSTOM_BATCH_ADD_BOOKS',
  globalBatchAddLeads = 'GLOBAL_BATCH_ADD_LEADS',
  customBatchAddLeads = 'CUSTOM_BATCH_ADD_LEADS',
  linkedinBatchAddLeads = 'LINKEDIN_BATCH_ADD_LEADS',
  emailBatchAddLeads = 'EMAIL_BATCH_ADD_LEADS',
  globalBatchAddEdm = 'GLOBAL_BATCH_ADD_EDM',
  customBatchAddEdm = 'CUSTOM_BATCH_ADD_EDM',
  deepGrub = 'DEEP_GRUB',
  customsDeepGrubBuyers = 'CUSTOMS_DEEP_GRUB_BUYERS',
  customsDeepGrubSuppliers = 'CUSTOMS_DEEP_GRUB_SUPPLIERS',
  companyDeepGrub = 'COMPANY_DEEP_GRUB',
  companyFission = 'COMPANY_FISSION',
}
export enum GrubProcessTypeEnum {
  contact = 'contact',
  company = 'company',
  customs = 'customs',
  addressBook = 'addressBook',
  leads = 'leads',
  aiHosting = 'aiHosting',
  fission = 'fission',
}
export const grubProcessCodeTextDict = {
  [GrubProcessCodeEnum.deepGrub]: '深挖联系人',
  [GrubProcessCodeEnum.companyDeepGrub]: '深挖企业资料',
  [GrubProcessCodeEnum.customsDeepGrubBuyers]: '深挖采购商',
  [GrubProcessCodeEnum.customsDeepGrubSuppliers]: '深挖供应商',
  [GrubProcessCodeEnum.globalBatchAddBooks]: '加入营销联系人',
  [GrubProcessCodeEnum.customBatchAddBooks]: '加入营销联系人',
  [GrubProcessCodeEnum.globalBatchAddLeads]: '录入线索',
  [GrubProcessCodeEnum.customBatchAddLeads]: '录入线索',
  [GrubProcessCodeEnum.emailBatchAddLeads]: '录入线索',
  [GrubProcessCodeEnum.linkedinBatchAddLeads]: '录入线索',
  [GrubProcessCodeEnum.globalBatchAddEdm]: '加入营销托管',
  [GrubProcessCodeEnum.customBatchAddEdm]: '加入营销托管',
  [GrubProcessCodeEnum.companyFission]: '公司裂变',
};
export const GrubProcessTypeStyleDict: Record<GrubProcessTypeEnum, { color: string; backgroundColor: string }> = {
  [GrubProcessTypeEnum.addressBook]: {
    color: '#7A51CB',
    backgroundColor: '#EDE4FF',
  },
  [GrubProcessTypeEnum.leads]: {
    color: '#398E80',
    backgroundColor: '#D6F7F1',
  },
  [GrubProcessTypeEnum.fission]: {
    color: '#4759B2',
    backgroundColor: '#DEEBFD',
  },
  [GrubProcessTypeEnum.aiHosting]: {
    color: '#CC913D',
    backgroundColor: '#FFF3E2',
  },
  [GrubProcessTypeEnum.company]: {
    color: '#4759B2',
    backgroundColor: '#DEEBFD',
  },
  [GrubProcessTypeEnum.contact]: {
    color: '#4759B2',
    backgroundColor: '#DEEBFD',
  },
  [GrubProcessTypeEnum.customs]: {
    color: '#4759B2',
    backgroundColor: '#DEEBFD',
  },
};
