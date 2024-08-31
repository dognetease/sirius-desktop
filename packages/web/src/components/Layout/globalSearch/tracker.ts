import { DataTrackerHelper } from './tracker-helper';
import { SuggestOrigin } from 'api';

export type jopType = 'ALL' | 'MANAGER' | 'SALE' | 'COMMON';
export const globalSearchTrackerHelper = new DataTrackerHelper();
export const WMDATA_ALL_SEARCH_TRACKER_KEY = 'pc_markting_all_search_do_search';
export const globalSearchDataTracker = {
  trackDoSearch(keyword: string, searchType: string, precise: boolean) {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_do_search', {
      keyword,
      searchType,
      precise,
    });
    globalSearchTrackerHelper.doTrack(WMDATA_ALL_SEARCH_TRACKER_KEY);
  },
  trackSearchResult(hasResult: boolean, keyword: string) {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_show_result', {
      hasResult,
      keyword,
    });
  },
  trackTableListClick(type: GlobalSearchTableEvent, keyword?: string, postion?: { page: number; index: number; pageSize: number }, buttonName?: string) {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_result_list', {
      type: 'click',
      keyword,
      buttonname: type,
      postion,
    });
  },
  trackSearchDetail(params: { companyId: string; id: string; name: string; from: string; country?: string }) {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_detail', {
      params,
    });
  },
  trackDetailClick(type: GlobalSearchDetailEvent, from: string, companyID?: number | string, id?: string, extraParams?: any) {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_detail_click', {
      buttonName: type,
      from,
      companyID,
      id,
      ...(extraParams ?? {}),
    });
  },
  tractCheckEmail(filter?: { hasEmail?: boolean; hasViewed?: boolean; noLogistics?: boolean; hasCustomData?: boolean; hasWebsite?: boolean; noEdm?: boolean }) {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_check_email', {
      ...filter,
    });
  },
  tractRecommendFilter(filter?: { noEdm?: boolean; ruleID?: number; keyword?: string }) {
    globalSearchTrackerHelper.doTrack('pc_markting_recommend_filter', {
      ...filter,
    });
  },
  tractVideoPlay(from?: string) {
    globalSearchTrackerHelper.doTrack('pc_markting_video_play', {
      from,
    });
  },
  tractVideoFinish(filter?: { time?: number; ratio?: string; form?: string }) {
    globalSearchTrackerHelper.doTrack('pc_markting_video_finish', {
      ...filter,
    });
  },
  trackDeepSearchContact(from: string) {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_deep_search_contact', {
      from,
    });
  },
  trackEmailSort(from: string) {
    globalSearchTrackerHelper.doTrack('pc_wm_data_global_sort', {
      from,
    });
  },
  trackKeywordSubCreate(from: 'record' | 'list' | 'noResult') {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_keyword_sub_create', {
      from,
    });
  },
  trackKeywordSubDetail(type: string) {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_keyword_sub_detail', {
      type,
    });
  },
  trackKeywordSubCreateOverflow() {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_keyword_sub_overflow');
  },
  trackPageChange(page: 'keywords' | 'globalSearch' | 'star', param?: { from?: 'tab' | 'im' }) {
    if (page === 'globalSearch') {
      globalSearchTrackerHelper.doTrack('pc_markting_global_search_search_page');
    } else if (page === 'keywords') {
      globalSearchTrackerHelper.doTrack('pc_markting_global_search_keyword_page', param);
    } else if (page === 'star') {
      globalSearchTrackerHelper.doTrack('pc_markting_wmdata_star_page', param);
    }
  },
  trackJobtitleFilter(type: jopType) {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_jobtitle_filter', { type });
  },
  trackBatchOperation(action: 'sendEdm' | 'addContacts' | 'aiHosting' | 'addLeads' | 'sendEmail', count: number) {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_batch_operation', { action, count });
  },
  // 批量加入地址簿
  trackAddressAddContacts(count: number, autoAddLeads: boolean) {
    globalSearchTrackerHelper.doTrack('pc_wm_data_add_contacts', { count, autoAddLeads });
  },
  trackEmailVerify(from: 'sendEdm' | 'addContacts', option: 'add' | 'verify', jobTitle: jopType) {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_email_verify', { from, option, jobTitle });
  },
  trackBrDoSearch(keyword: string, searchType: string, precise: boolean) {
    globalSearchTrackerHelper.doTrack('pc_markting_yidaiyilu_do_search', {
      keyword,
      searchType,
      precise,
    });
    globalSearchTrackerHelper.doTrack(WMDATA_ALL_SEARCH_TRACKER_KEY);
  },
  trackBrCountry(country: string) {
    globalSearchTrackerHelper.doTrack('pc_markting_yidaiyilu_countrydata', {
      country,
    });
  },
  trackBrDetail(type: GlobalSearchTableEvent, keyword?: string, postion?: { page: number; index: number; pageSize: number }, buttonName?: string) {
    globalSearchTrackerHelper.doTrack('pc_markting_yidaiyilu_result_list', {
      type: 'click',
      keyword,
      buttonname: type,
      postion,
    });
  },
  // 1130版本埋点
  /**
   * 全球搜- 查看深挖结果
   */
  trackGrubListViewDetail() {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_deepgrub_list_detail');
  },
  /**
   * 广交会活动专题页pv
   * @param from 来源
   */
  trackGotoContomFairSearch(from: 'index_banner' | 'top_banner' = 'index_banner') {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_activity_page', {
      from,
    });
  },
  /**
   * 广交会搜索次数
   * @param param
   */
  trackDoContomFairSearch(param: { keyword?: string; searchType?: 'company' | 'domain' | 'product' }) {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_activity_page_do_search', {
      ...param,
    });
  },
  /**
   * 广交会搜索结果筛选
   * @param param 隐藏无邮箱：hasEmail
                  过滤已浏览：hasViewed
                  参展时间：yearList
   */
  trackDoContomFairSearchFilter(param: { hasEmail?: boolean; hasViewed?: boolean; yearList?: number[] }) {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_activity_page_filter', {
      ...param,
    });
  },
  /**
   * 广交会活动页搜索结果点击
   * @param buttonName 按钮名称
   */
  trackContomFairDetailClick(
    buttonName: 'linkedin' | 'twitter' | 'facebook' | 'domain' | 'location' | 'sendMail' | 'importClue' | 'importCustomer' | 'sendEdm' | 'productImg'
  ) {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_activity_page_detail_click', {
      buttonName,
    });
  },
  /**
   * 全球搜-通过单据查看公司
   */
  trackViewRecordDetail() {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_view_record_detail');
  },
  /**
   * LBS搜索 点击附近搜索
   */
  trackLbsSearch(param: { country?: string; keyword?: string; radius?: number }) {
    globalSearchTrackerHelper.doTrack('pc_lbs_search_do_nearby_search', {
      ...param,
    });
    globalSearchTrackerHelper.doTrack(WMDATA_ALL_SEARCH_TRACKER_KEY);
  },
  /**
   * LBS国内搜索 点击附近搜索
   */
  trackLbsInternalSearch(param: { country?: string; keyword?: string; radius?: number }) {
    globalSearchTrackerHelper.doTrack('pc_lbs_internal_search_do_nearby_search', {
      ...param,
    });
    globalSearchTrackerHelper.doTrack(WMDATA_ALL_SEARCH_TRACKER_KEY);
  },
  /**
   * LBS搜索
   */
  trackLbsListView(buttonName: 'website' | 'viewDetail') {
    globalSearchTrackerHelper.doTrack('pc_lbs_search_do_list_view', {
      buttonName,
    });
  },
  /**
   * LBS国内搜索
   */
  trackLbsInternalListView(buttonName: 'website' | 'viewDetail') {
    globalSearchTrackerHelper.doTrack('pc_lbs_internal_search_do_list_view', {
      buttonName,
    });
  },
  /**
   * LBS搜索-点击“查看更多”
   */
  trackLbsListMore() {
    globalSearchTrackerHelper.doTrack('pc_lbs_search_do_list_more');
  },

  /**
   * LBS国内搜索-点击“查看更多”
   */
  trackLbsInternalListMore() {
    globalSearchTrackerHelper.doTrack('pc_lbs_internal_search_do_list_more');
  },

  trackSuggestClick(params: { from: SuggestOrigin; searchType?: number }) {
    globalSearchTrackerHelper.doTrack('pc_wm_data_suggest_click', params);
  },

  trackSearchEmptyClick() {
    globalSearchTrackerHelper.doTrack('pc_wm_data_search_empty_click');
  },

  trackEmailGuessEntry(params: { type: 'banner' | 'detail' }) {
    globalSearchTrackerHelper.doTrack('pc_wm_data_emailguess_entry', params);
  },

  trackEmailGuessCheckClick(params: { from: 'mannual' | 'auto' }) {
    globalSearchTrackerHelper.doTrack('pc_wm_data_emailguess_check', params);
  },
  trackEmailGuessResultOp(params: { buttonName: 'sendEdm' | 'addContacts' }) {
    globalSearchTrackerHelper.doTrack('pc_wm_data_emailguess_result_op', params);
  },

  trackWaterFallViewCount(params: { count: number }) {
    globalSearchTrackerHelper.doTrack('pc_wm_data_keyword_subscribe_company_list_view', params);
  },

  trackMergeCompanyOk(params: { companyName: string; uncheck: string[] }) {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_check_customs_data', params);
  },

  trackWaterFallViewClick(params: {
    keyword: string;
    rcmdType: 1;
    companyName: string;
    buttonName: 'ignore' | 'remove_ignore' | 'record_customers' | 'domain' | 'social_media' | 'card';
    companyCountry?: string;
  }) {
    globalSearchTrackerHelper.doTrack('pc_wm_data_keyword_subscribe_company_list_click', params);
  },
  trackSmartRcmdList(params: { keyword?: string; ruleId?: string | number; from?: string }) {
    globalSearchTrackerHelper.doTrack('pc_markting_recommend_loading', params);
  },
  trackSmartRcmdListCompanyClick(params: {
    id?: number | string;
    ruleId?: number | string;
    keyword?: string;
    rcmdType: 1;
    rank: number;
    companyName?: string;
    companyCountry?: string;
    buttonName?: 'ignore' | 'record_customers' | 'domain' | 'social_media' | 'card' | 'record_clue';
    companyId?: string;
  }) {
    globalSearchTrackerHelper.doTrack('pc_markting_recommend_list_click', params);
  },
  trackSmartRcmdListBatchOprate(params: { action: 'sendEdm' | 'addContacts' | 'aiHosting' | 'addLeads'; count: number; ruleId?: number; companyIdList?: string[] }) {
    globalSearchTrackerHelper.doTrack('pc_markting_recommend_batch_operation', params);
  },
  trackCollectData(params: {
    origin: string;
    keywords?: string;
    info: Array<{
      name: string;
      country: string;
      id?: string | number;
    }>;
    count: number;
    searchType?: string;
  }) {
    globalSearchTrackerHelper.doTrack('pc_markting_data_exposure', params);
  },
  trackSearchTips(param: { from: string }) {
    globalSearchTrackerHelper.doTrack('pc_markting_global_search_tips', param);
  },
};

export enum GlobalSearchTableEvent {
  Null = 'NULL',
  Logo = 'logo',
  Company = 'company',
  ExpandContact = 'expandContact',
  CopyContact = 'copyContact',
  ViewMoreContacts = 'viewMoreContacts',
  SendEmail = 'sendEmail',
  Subscribe = 'subscribe',
  UnSubscribe = 'unsubscribe',
  relatedCompany = 'relatedCompany',
}

export enum GlobalSearchDetailEvent {
  LinkedIn = 'linkedin',
  Twitter = 'twitter',
  Facebook = 'facebook',
  Domain = 'domain',
  Location = 'location',
  CopyContact = 'copyContact',
  SendEmail = 'sendEmail',
  SendEdm = 'sendEdm',
  ImportClue = 'importClue',
  ImportCustomer = 'importCustomer',
  ProductImgDetail = 'productImg',
  AddContactsAdress = 'addContacts',
  CommonMailFilter = 'mailFilter',
  Subscribe = 'subscribe',
  Unsubscribe = 'unsbscribe',
}
