import { WMDATA_ALL_SEARCH_TRACKER_KEY } from '../globalSearch/tracker';
import { DataTrackerHelper } from '../globalSearch/tracker-helper';

export const linkedInSearchTrackerHelper = new DataTrackerHelper();

export const LinkedInSearchTracker = {
  /**
   * LinkedIn搜索-搜索动作
   */
  trackSearch(keywork: string, searchType: string, hasIndustry: boolean) {
    linkedInSearchTrackerHelper.doTrack('pc_markting_linkedIn_search_do_search', {
      keywork,
      searchType,
      hasIndustry,
    });
    linkedInSearchTrackerHelper.doTrack(WMDATA_ALL_SEARCH_TRACKER_KEY);
  },
  /**
   * LinkedIn搜索结果列表点击
   */
  trackListClick(buttonName: string) {
    linkedInSearchTrackerHelper.doTrack('pc_markting_linkedIn_search_result_list', { buttonName });
  },
  /**
   * 领英搜索-搜索结果
   */
  trackListResult(hasResult: boolean, keywork: string, searchType: string, hasIndustry: boolean) {
    linkedInSearchTrackerHelper.doTrack('pc_markting_linkedIn_search_show_result', {
      hasResult,
      keywork,
      searchType,
      hasIndustry,
    });
  },
  /**
   * LinkedIn搜索-页面pv
   */
  trackMenuClick() {
    linkedInSearchTrackerHelper.doTrack('pc_leftNavigationBarTab', { tabName: 'LinkedInSearch', operate: 'click' });
  },

  // LinkedIn搜索-批量操作
  trackBatchOperation(action: 'sendEdm' | 'addContacts' | 'addLeads', count: number) {
    linkedInSearchTrackerHelper.doTrack('pc_markting_linkedIn_search_batch_operation', { action, count });
  },

  // LinkedIn搜索-加入地址簿
  trackAddressAddContacts(count: number, autoAddLeads: boolean) {
    linkedInSearchTrackerHelper.doTrack('pc_wm_data_add_contacts', { count, autoAddLeads });
  },
};
