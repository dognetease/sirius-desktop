import { ForwarderType, OptionValueType, customsDataType } from 'api';
import { DataTrackerHelper } from '../../globalSearch/tracker-helper';
import { WMDATA_ALL_SEARCH_TRACKER_KEY } from '../../globalSearch/tracker';

export const customsDataTrackerHelper = new DataTrackerHelper();

export const customsDataTracker = {
  trackMenuClick(type: CustomsDataMenuClick) {
    customsDataTrackerHelper.doTrack(type);
  },
  trackSelectClick(type: CustomsDataSelectClick, searchtype?: any) {
    if (searchtype) {
      customsDataTrackerHelper.doTrack('pc_markting_customs_data_tab', {
        type: type,
        searchtype,
      });
    } else {
      customsDataTrackerHelper.doTrack('pc_markting_customs_data_tab', {
        type: type,
      });
    }
  },
  trackTableListClick(
    type: CustomsDataTableListClick,
    param?: {
      searchType?: string;
      searchValue?: string;
    }
  ) {
    customsDataTrackerHelper.doTrack('pc_markting_customs_data_list', {
      buttonname: type,
      ...param,
    });
  },
  trackForwarderTableListClick(
    type: CustomsDataTableListClick,
    param?: {
      searchType: string;
      searchValue: string;
    }
  ) {
    customsDataTrackerHelper.doTrack('pc_markting_forwarder_data_list', {
      buttonname: type,
      ...param,
    });
  },
  trackDetailtClick(
    type: CustomsDataDetailClick,
    params?: {
      country?: string;
      name?: string;
    }
  ) {
    customsDataTrackerHelper.doTrack('pc_markting_customs_data_detail_tab', {
      buttonname: type,
      ...params,
    });
  },
  trackDetailTopbarClick(type: CustomsDataDetailTopbarClick) {
    customsDataTrackerHelper.doTrack('pc_markting_customs_data_detail_topbar', {
      buttonName: type,
    });
  },
  trackDetailMergedOkClick(params: { companyName: string; uncheck: string }) {
    customsDataTrackerHelper.doTrack('pc_wm_data_detail_merged_company_ok', {
      ...params,
    });
  },
  // 1130版本埋点
  /**
   * 海关数据-点击搜索
   * 通过海关搜索进行搜索的次数。（翻页、筛选不计数）
   */
  trackCustomsSearchManaul(params?: { keyword?: string; searchType?: string; isFuzzySearch?: boolean; dataType?: 'tradeData' | 'buyer' | 'supplier' }) {
    customsDataTrackerHelper.doTrack('pc_markting_customs_data_do_search', {
      ...params,
    });
    customsDataTrackerHelper.doTrack(WMDATA_ALL_SEARCH_TRACKER_KEY);
  },
  /**
   * 港口搜索-点击搜索
   * 通过港口搜索进行搜索的次数。（翻页、筛选不计数）
   */
  trackForwarderSearchManaul(params?: {
    keywords?: string[];
    forwarderType?: ForwarderType;
    dataType?: 'buyer' | 'supplier';
    // 入口港
    portOfLadings?: OptionValueType[];
    // 出口港
    portOfUnLadings?: OptionValueType[];
    airlines?: OptionValueType[];
    exactlySearch?: boolean;
  }) {
    customsDataTrackerHelper.doTrack('pc_markting_forwarder_data_do_search', {
      ...params,
    });
    customsDataTrackerHelper.doTrack(WMDATA_ALL_SEARCH_TRACKER_KEY);
  },
  /**
   * 海关数据-详情页点击事件
   */
  trackCustomsDetailView(buttonName: CustomsDetailViewAction) {
    customsDataTrackerHelper.doTrack('pc_markting_customs_data_detail_click', {
      buttonName,
    });
  },
  /**
   * 海关数据-批量操作搜索结果
   */
  trackCustomBatchOpList(action: CustomsDetailViewAction, count: number) {
    customsDataTrackerHelper.doTrack('pc_markting_customs_data_batch_operation', {
      action,
      count,
    });
  },
  /**
   * 港口搜索-批量操作搜索结果
   */
  trackForwarderBatchOpList(action: CustomsDetailViewAction, count: number) {
    customsDataTrackerHelper.doTrack('pc_markting_forwarder_data_batch_operation', {
      action,
      count,
    });
  },
  // 批量加入地址簿
  trackAddressAddContacts(count: number, autoAddLeads: boolean) {
    customsDataTrackerHelper.doTrack('pc_wm_data_add_contacts', { count, autoAddLeads });
  },
  /**
   * 海关数据-点击“数据更新记录”
   */
  trackCustomClickDataUpdateRecord(from: string) {
    customsDataTrackerHelper.doTrack('pc_markting_customs_data_click_update_record', {
      from,
    });
  },
  /**
   * 海关数据-通过单据查看公司
   */
  trackCustomClickTicketViewCompany() {
    customsDataTrackerHelper.doTrack('pc_markting_customs_data_view_company_from_ticket');
  },
  /**
   * 公司收藏
   * 公司名称 companyName
   * 更新日志 log
   * 查看详情按钮 detail
   */
  trackCollectionDetail(params: { from: 'companyName' | 'log' | 'detail' }) {
    customsDataTrackerHelper.doTrack('pc_marketing_compnay_collection_detail', params);
  },
  trackCustomsSearchResult(params: { hasResult: boolean; keyword: string; searchType?: customsDataType | 'port'; dataType?: 'tradeData' | 'buyer' | 'supplier' }) {
    customsDataTrackerHelper.doTrack('pc_markting_markting_customs_data_show_result', params);
  },
  trackTradeReport(params: { searchType: 'product' | 'hscode' | 'company' | 'rankingList'; keyword: string }) {
    customsDataTrackerHelper.doTrack('pc_markting_trading_analysis', params);
    customsDataTrackerHelper.doTrack(WMDATA_ALL_SEARCH_TRACKER_KEY);
  },
};

export enum CustomsDetailViewAction {
  Domain = 'domain',
  Location = 'location',
  SendMail = 'sendMail',
  ImportClue = 'importClue',
  ImportCustomer = 'importCustomer',
  SendEdm = 'sendEdm',
  ProductImg = 'productImg',
  AddContacts = 'addContacts',
  AddLeads = 'addLeads',
}

export enum CustomsDataMenuClick {
  CustomsMenu = 'pc_markting_customs_data_click',
}

export enum CustomsDataTableListClick {
  Unfold = 'unfold',
  Star = 'star',
  unStar = 'unstar',
  View = 'view',
  Company = 'company',
}

export enum CustomsDataSelectClick {
  company = 'company',
  product = 'product',
  hscode = 'hscode',
  precise = 'precise',
  nation = 'nation',
  supplierNation = 'supplierNation',
  buyerNation = 'buyerNation',
  time = 'time',
  logistics = 'logistics',
  language = 'language',
}

export enum CustomsDataDetailClick {
  clickBasicTab = 'clickBasicTab',
  clickBuyingRecordTab = 'clickBuyingRecordTab',
  clickSupplierTab = 'clickSupplierTab',
  clickFreightInfoTab = 'clickFreightInfoTab',
  clickExportTab = 'clickExportTab',
  clickBuyerTab = 'clickBuyerTab',
  clickContactTab = 'clickContactTab',
  detailShow = 'detailShow',
  purchaseChain = 'purchaseChain',
}

export enum CustomsDataDetailTopbarClick {
  entryLeads = 'entryLeads',
  entryCustomer = 'entryCustomer',
}
