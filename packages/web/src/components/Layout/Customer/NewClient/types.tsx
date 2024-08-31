/**
 * 客户搜索条件
 */
export interface SearchConditionApi {
  create_time_start?: string | null;
  create_time_end?: string | null;
  active_time_start?: string | null;
  active_time_end?: string | null;
  search_key?: string;
}

/**
 * 客户table搜索条件
 */
export interface AllSearchCondition extends SearchConditionApi {
  page?: number;
  page_size?: number;
  type?: number;
}

interface contact_list_item {
  contact_name: string;
  email: string;
  contact_id?: string;
}
interface label_list_item {
  label_id: string;
  label_name: string;
  label_color: string;
}
/**
 *  客户详情item
 */
export interface tableListItem {
  company_name: string;
  label_list: label_list_item[];
  contact_list: contact_list_item[];
  remark: string;
  company_id: string;
  company_domain: string;
  label_name_list?: string[];
  exchange_cnt: number;
}
