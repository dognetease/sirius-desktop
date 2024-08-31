import { Api } from '../_base/api';
import { StringMap } from '../commonModel';

/**
 * 事务记录的额外参数
 */
type extraData = {
  /**
   * 事务记录的额外数据
   */
  data?: Record<string, any>;
  /**
   * 事务记录的额外标签,标签可以使用sentry界面中搜索框搜索，输入tag:<your-tag>，其中<your-tag>是你自定义的tag名称，tag需要在代码中统一定义，不可随意定义
   * @see allAllowedTags
   */
  tags?: Record<string, string | number>;
};
type TransConfItem = {
  /**
   * 事务记录的名称
   */
  name: TransName;
  /**
   * 采样率，0-1之间的小数，表示采样率，例如0.1表示10%的采样率，即每10个事务记录中只有一个会被记录
   */
  sampleRate?: number;
};
/**
 * 所有允许记录的transaction类型,以transaction的name字段区分
 */
export type TransName =
  | 'wmData_globalSearch_detail'
  | 'wmData_globalSearch_search'
  | 'wmData_customs_detail'
  | 'wmData_customs_search'
  | 'worktable_sysTasks_init'
  | 'worktable_myCustomer_init'
  | 'wmData_cantonfair_detail'
  | 'wmData_br_detail'
  | 'wmData_lbs_detail'
  | 'worktable_allCustomer_init'
  | 'worktable_rankCard_init'
  | 'marketing_task_index_list_show'
  | 'wa_manage_chat_init'
  | 'l2c-crm_customer_detail-show'
  | 'l2c-crm_customer_create'
  | 'l2c-crm_leads_detail-show'
  | 'wmData_smartrcmd_detail'
  | 'marketing_addressbookpicker_add'
  | 'wa_manage_chats_init'
  | 'l2c-crm_customer_search'
  | 'marketing_sendtask_copy'
  | 'l2c-crm_leads_switch-group'
  | 'l2c-crm_customer_switch-group'
  | 'wmData_grub_detail'
  | 'wmData_default_detail'
  | 'l2c-crm_leads_search'
  | 'wmData_crmdetail_detail'
  | 'l2c-crm_customer_detail-field-edit'
  | 'l2c-crm_customer_list-first-load'
  | 'worktable_myCustomer-refresh'
  | 'l2c-crm_leads_detail-field-edit'
  | 'l2c-crm_customer_switch-tab'
  | 'l2c-crm_leads_batch-delete'
  | 'l2c-crm_leads_create'
  | 'wa_manage_init_to_qrcode'
  | 'l2c-crm_customer-public_list-first-load'
  | 'worktable_rankCard_picker_change'
  | 'l2c-crm_leads-public_list-first-load'
  | 'l2c-crm_leads_list-first-load'
  | 'wmData_linkedin_detail'
  | 'l2c-crm_leads_switch-tab'
  | 'l2c-crm_customer_batch-edit'
  | 'worktable_myCustomer_picker_change'
  | 'l2c-crm_local-product_list-first-load'
  | 'l2c-crm_customer_batch-delete'
  | 'worktable_rankCard_member_change'
  | 'wmData_contomFair_detail'
  | 'l2c-crm_platform-product_list-first-load'
  | 'wmData_customerRcmd_detail'
  | 'worktable_allCustomer_picker_change'
  | 'wmData_subscription_detail'
  | 'l2c-crm_leads_batch-edit'
  | 'worktable_allCustomer_member_change'
  | 'worktable_allCustomer-refresh';

export const TransConf: Partial<Record<TransName, TransConfItem>> = {
  marketing_task_index_list_show: {
    name: 'marketing_task_index_list_show',
    sampleRate: 0.1,
  },
};

/**
 * 所有允许的tag
 */
export const allAllowedTags: Set<string> = new Set<string>([
  /**
   * 模块名称
   */
  'moduleName',
]);

export type StartTransactionParams = {
  /**
   * 事务名称
   */
  name: TransName;
  /**
   * 事务操作类型
   */
  op?: string;
  /**
   * 父事务id
   */
  parent?: number;
  /**
   * 不设置为top transaction
   */
  notAsTop?: boolean;
} & extraData;

export type EndTransactionParams = {
  /**
   * 事务id,由startTransaction返回
   */
  id: number;
} & extraData;

/**
 * 错误上报,sentry 相关功能包装
 */
export interface ErrorReportApi extends Api {
  /**
   * 自定义错误上传到Sentry
   * @param error  报错信息( error是一个对象,对象里有一个error参数是必传的，error可以是new Error类型，也可以是字符串 剩余的参数可以自定义)
   * @param optionalInfo context信息
   */
  doReportMessage(error: any, optionalInfo?: StringMap): void;

  /**
   * 获取当前模块的名称
   */
  getModuleName(): string;

  /**
   * 开启一个事务记录，会返回一个id，结束事务时需要传入这个id
   * 事务记录会自动事务进行中的各类信息，比如请求的url，console.log的信息等
   * @param conf 见StartTransactionParams
   */
  startTransaction(conf: StartTransactionParams): number;

  /**
   * 结束一个事务记录,需要传入startTransaction返回的id
   * @param conf 见EndTransactionParams
   */
  endTransaction(conf: EndTransactionParams): void;

  /**
   * 根据id获取事务记录
   * @param id 事务记录的id，由startTransaction返回
   */
  getTransById(id: number): any;
}
