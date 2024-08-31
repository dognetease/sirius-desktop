export default {
  getCustomerList: '/mail-plus/api/biz/company/v2/load',
  getClueList: '/customer/api/biz/clue/v2/load', // 已废弃
  getColleagueList: '/mail-plus/api/biz/email/colleagueList',
  getCustomerListPage: '/mail-plus/api/biz/company/email/page',
  getCustomerDetailBatch: '/mail-plus/api/biz/company/email/batchDetail',
  getOpenSeaCustomerDetailBatch: '/customer/api/biz/customer/open_sea/batch_detail',
  getCompanyCustomerList: '/customer/api/biz/contact/new/list_contact',
  getCompanyDetailById: '/customer/api/biz/customer/detail/get_customer',
  getOpenSeaCustomerList: '/customer/api/biz/customer/open_sea/contact/page',
  getCustomerListByMangerId: '/customer/api/biz/customer/list/get_customers',
  getClueDetailById: '/customer/api/biz/leads/get_leads', // 获取我的线索，同事线索详情
  getOpenSeaClueDetailById: '/customer/api/biz/leads/open_sea/detail', // 根据线索ID查询公海详情
  getClueContactList: '/customer/api/biz/leads/contact/list_contact', // 获取线索下的联系人
  getSubMailNew: '/mail-plus/api/biz/email/buildNew', // 下属邮件，回复，回复全部，带附件回复，带附件回复全部，转发，作为附件转发，接口
  // 营销联系人相关接口
  addMarktingGroup: '/customer/api/biz/leads/contact/group/add',
  addMarktingContact2Group: '/customer/api/biz/leads/contact/group/add_to_groups',
  associateEdm: '/customer/api/biz/leads/contact/group/associate_edm',
  deleteMarktingGroup: '/customer/api/biz/leads/contact/group/delete',
  editMarktingGroup: '/customer/api/biz/leads/contact/group/edit',
  addMarktingGroup2Group: '/customer/api/biz/leads/contact/group/group_add_to_groups',
  getMarktingGroupList: '/customer/api/biz/leads/contact/group/list',
  getMarktingGroupListWithPage: '/customer/api/biz/leads/contact/group/page',
  transferMarktingContact2Groups: '/customer/api/biz/leads/contact/group/transfer_to_groups',
  cancelGroupEdm: '/customer/api/biz/leads/contact/group/cancel_edm',
  getGroupCountByFilter: '/customer/api/biz/group/get_group_count_by_filter',

  // 营销引导相关接口
  getQuickMarktingList: '/customer/api/biz/contact/marketing/quick_marketing_list',
  getQuickMarktingGuide: '/customer/api/biz/contact/marketing/get_quick_marketing_guide',
  getQuickMarktingGroupCount: '/customer/api/biz/contact/marketing/get_quick_marketing_group_count',
  createQuickMarktingGroup: '/customer/api/biz/contact/marketing/create_quick_marketing_group',
  deleteQuickMarktingGroup: '/customer/api/biz/contact/marketing/delete_quick_marketing_group',
  getEdmContactList: '/customer/api/biz/contact/marketing/edm_list',
};
