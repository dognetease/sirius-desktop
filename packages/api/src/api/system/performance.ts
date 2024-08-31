/*
 * @Author: your name
 * @Date: 2022-02-11 11:03:40
 * @LastEditTime: 2022-03-11 16:40:25
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/api/src/api/system/performance.ts
 */

import { Api } from '../_base/api';

export interface PerformanceTypeDef {
  key: string;
  desc: string;
  crossWindow?: boolean;
  ttl?: number;
  checkFn?: (param: PointParams) => boolean;
  /**
   * 是否为增量记录点，增量记录点上报前会用当前值减去前值作为上报的value
   */
  increasingRecord?: boolean;
  /**
   * 类型
   */
  type?: 'number' | 'timer' | 'count';
}

export const AllStatType: Record<string, PerformanceTypeDef> = {
  stat_illegal_count: {
    key: 'stat_illegal_count',
    desc: '',
  },
  electron_init_time: {
    key: 'electron_init_time',
    desc: '',
  },
  electron_create_window_time: {
    key: 'electron_create_window_time',
    desc: '',
    // 该值是基于本地的绝对时间的计算出来的，猜测如果客户电脑主板电池没电，在某些情况下会产生比较大的值
    checkFn: params => params.value < 1000 * 60 * 10,
  },
  dom_all_time: {
    key: 'dom_all_time',
    desc: '',
  },
  long_task_record_duration: {
    key: 'long_task_record_duration',
    desc: '',
    checkFn: params => params.value < 1000 * 300,
  },
  long_task_record_count: {
    key: 'long_time_task_count',
    desc: '',
    checkFn: params => params.value < 10000,
    type: 'count',
  },
  pr_blink_mem: {
    key: 'pr_blink_mem',
    desc: '',
  },
  pr_heap_mem: {
    key: 'pr_heap_mem',
    desc: '',
  },
  pr_proc_mem: {
    key: 'pr_proc_mem',
    desc: '',
  },
  pr_cpu_rate: {
    key: 'pr_cpu_rate',
    desc: '',
  },
  pr_io_counts: {
    key: 'pr_io_counts',
    desc: '',
    increasingRecord: true,
  },
  web_memory: {
    key: 'web_memory',
    desc: '',
  },
  dom_interactive: {
    key: 'dom_interactive',
    desc: '',
  },
  dom_load_event: {
    key: 'dom_load_event',
    desc: '',
  },
  page_remove_loading: {
    key: 'page_remove_loading',
    desc: '',
  },
  mail_attachment_upload_speed: {
    key: 'mail_attachment_upload_speed',
    desc: '',
  },
  mail_attachment_download_speed: {
    key: 'mail_attachment_download_speed',
    desc: '',
  },
  mail_attachment_upload_time: {
    key: 'mail_attachment_upload_time',
    desc: '',
  },
  mail_attachment_upload_times: {
    key: 'mail_attachment_upload_times',
    desc: '',
  },
  mail_attachment_uploading: {
    key: 'mail_attachment_uploading',
    desc: '',
  },
  mail_attachment_download_time: {
    key: 'mail_attachment_download_time',
    desc: '',
  },
  mail_search_load_time: {
    key: 'mail_search_load_time',
    desc: '',
  },
  mail_write_load_time: {
    key: 'mail_write_load_time',
    desc: '',
    crossWindow: true,
  },
  mail_content_inner_load_time: {
    key: 'mail_content_inner_load_time',
    desc: '',
  },
  mail_content_window_load_time: {
    key: 'mail_content_window_load_time',
    desc: '',
    crossWindow: true,
  },
  mail_content_push_load_time: {
    key: 'mail_content_push_load_time',
    desc: '',
    crossWindow: true,
  },
  mail_list_load_time: {
    key: 'mail_list_load_time',
    desc: '',
  },
  schedule_data_handle: {
    key: 'schedule_data_handle',
    desc: '',
  },
  schedule_data_render: {
    key: 'schedule_data_render',
    desc: '日历加载时长',
  },
  mail_listclick_content_load_time: {
    key: 'mail_listclick_content_load_time',
    desc: '邮件列表从点击-到正文加载完成的时间',
  },
  // api_contact_get_contact_by_email: {
  //   key: 'api_contact_get_contact_by_email',
  //   desc: '',
  // },
  // api_contact_get_item: {
  //   key: 'api_contact_get_item',
  //   desc: '',
  // },
  // api_contact_get_contact_by_org: {
  //   key: 'api_contact_get_contact_by_org',
  //   desc: '',
  // },
  // api_contact_get_org: {
  //   key: 'api_contact_get_org',
  //   desc: '',
  // },
  // api_contact_search: {
  //   key: 'api_contact_search',
  //   desc: '',
  // },
  // api_contact_get_personal: {
  //   key: 'api_contact_get_personal',
  //   desc: '',
  // },
  contact_search_time: {
    key: 'contact_search_time',
    desc: '',
  },
  contact_load_time: {
    key: 'contact_load_time',
    desc: '',
  },
  // disk_recently_load_time: {
  //   key: 'disk_recently_load_time',
  //   desc: '',
  // },
  // disk_private_load_time: {
  //   key: 'disk_private_load_time',
  //   desc: '',
  // },
  // disk_public_load_time: {
  //   key: 'disk_public_load_time',
  //   desc: '',
  // },
  // disk_share_load_time: {
  //   key: 'disk_share_load_time',
  //   desc: '',
  // },
  // disk_recycle_load_time: {
  //   key: 'disk_recycle_load_time',
  //   desc: '',
  // },
  // disk_cloudAtt_load_time: {
  //   key: 'disk_cloudAtt_load_time',
  //   desc: '',
  // },
  // disk_favorites_load_time: {
  //   key: 'disk_favorites_load_time',
  //   desc: '',
  // },
  // im_will_connect: {
  //   key: 'im_will_connect',
  //   desc: 'im模块重连打点',
  // },
  // im_load_session: {
  //   key: 'im_load_session',
  //   desc: 'im模块打点',
  // },
  // im_init_session_list: {
  //   key: 'im_init_session_list',
  //   desc: 'im模块打点',
  // },
  // im_load_session_bysearch: {
  //   key: 'im_load_session_bysearch',
  //   desc: 'im模块打点',
  // },
  // im_load_session_result: {
  //   key: 'im_load_session_result',
  //   desc: 'im模块打点',
  // },
  // im: {
  //   key: 'im',
  //   desc: 'im模块打点',
  // },
  // bridge: {
  //   key: 'bridge',
  //   desc: '跨窗口bridge打点',
  // },
  // contact_cross_win: {
  //   key: 'contact_cross_win',
  //   desc: '跨窗口通讯录性能打点',
  // },
  fs_download: {
    key: 'fs_download',
    desc: '文件下载',
  },
  login: {
    key: 'login',
    desc: '登录耗时相关打点',
  },
  login_ev: {
    key: 'login_ev',
    desc: '登录错误相关打点',
  },
  re_login: {
    key: 're_login',
    desc: '自动重登录耗时相关打点',
  },
  re_login_ev: {
    key: 're_login_ev',
    desc: '自动重登录错误相关打点',
  },
  mail_ui_content_load_time: {
    key: 'mail_ui_content_load_time',
    desc: '普通邮件从收到id到正文展示花费的时间',
  },
  mail_list_load_timeout: {
    key: 'mail_list_load_timeout',
    desc: '邮件列表的加载超时，包含正常列表，搜索，聚合列表，高级搜索，从db加载等所有影响列表加载的请求',
  },
  total_process_memory_used: {
    key: 'total_process_memory_used',
    desc: '所有进程的内存使用量',
  },
  gpu_process_memory_used: {
    key: 'gpu_process_memory_used',
    desc: 'GPU进程的内存使用量',
  },
  main_process_memory_used: {
    key: 'main_process_memory_used',
    desc: '主进程的内存使用量',
  },
  utility_process_memory_used: {
    key: 'utility_process_memory_used',
    desc: '服务进程的内存使用量',
  },
  render_process_count: {
    key: 'render_process_count',
    desc: '渲染器进程的数量',
  },
  main_process_cpu_used: {
    key: 'main_process_cpu_used',
    desc: '自上次上报依赖主进程的CPU累计使用量',
  },
  gpu_process_cpu_used: {
    key: 'gpu_process_cpu_used',
    desc: '自上次上报依赖GPU进程的CPU累计使用量',
  },
  utility_process_cpu_used: {
    key: 'utility_process_cpu_used',
    desc: '自上次上报依赖服务进程的CPU累计使用量',
  },
  mail_list_request_load_time: {
    key: 'mail_list_request_load_time',
    desc: '邮件列表的加载时间，包含正常列表，搜索，聚合列表，高级搜索，从db加载等所有影响列表加载的请求',
  },
  update_refreshToken: {
    key: 'update_refreshToken',
    desc: 'refreshToken过期3天内更新refreshToken的结果',
  },
  jump_page_err_showed: {
    key: 'jump_page_err_showed',
    desc: 'webmail登陆失败',
  },
  jump_page_bt_clicked: {
    key: 'jump_page_bt_clicked',
    desc: 'webmail登陆失败按钮',
  },
  jump_page_stay_span: {
    key: 'jump_page_stay_span',
    desc: 'webmail跳转页停留时长',
  },
  write_mail_load: {
    key: 'write_mail_load',
    desc: '打点时长记录',
  },
  side_bar_click_time: {
    key: 'side_bar_click_time',
    desc: '侧边栏切换模块响应速度',
  },
  mail_readmail_switch: {
    key: 'mail_readmail_switch',
    desc: '切换邮件时长',
  },
  mail_folder_switch_start: {
    key: 'mail_folder_switch_start',
    desc: '切换邮件列表时长',
  },
  write_mail_search_contact: {
    key: 'write_mail_search_contact',
    desc: '通讯录搜索',
  },
};

export type StatKeyType = keyof typeof AllStatType;

export interface PerformanceCommonType {
  start: number;
  statKey: string | StatKeyType;
  statSubKey?: string;
  params?: { [key: string]: string | number | boolean };
  dirty?: boolean; // 这条数据是否是无效的脏数据;
  value: number;
}

export interface PerformanceCountType extends PerformanceCommonType {
  // value: number;
  valueType: 4;
  countLog: Array<[number, number]>; // [[打点时间, 距离上次打点时间ms]]
  type: 'count';
}

export interface PerformanceTimerType extends PerformanceCommonType {
  // start: number;
  log: Array<[number, number]>; // [[log时间, log - start]]
  end: number;
  recording: boolean;
  // statKey: string;
  valueType: 1; // 耗时，表示被统计操作从开始到结果所用的时间，毫秒值
  // statSubKey?: string;
  type: 'timer';
  // params?: { [key: string]: string | number | boolean };
}

export interface PerformancePointType extends PerformanceCommonType {
  // start: number;
  // statKey: string;
  // value: number;
  valueType: 1 | 2 | 3 | 4 | 5;
  type: 'point';
  // statSubKey?: string;
  // params?: { [key: string]: string | number | boolean };
}

export type PerformanceLogType = PerformanceTimerType | PerformanceCountType | PerformancePointType;

export interface PerformanceType {
  [key: string]: PerformanceLogType[];
}

interface BaseParams {
  statKey: string; // 统计指标的键
  statSubKey?: string; // 统计指标的子键
  flushAndReportImmediate?: boolean; // 立刻上报
}

export interface TimerParams extends BaseParams {
  params?: { [key: string]: string | number | boolean }; // 统计指标相关参数
  enableRecordSubAccount?: boolean; // 是否可以记录子账号打点
  _account?: string; // 账号
}

export interface PointParams extends TimerParams {
  value: number; // 25% 传25就行
  // 1: 耗时，表示被统计操作从开始到结果所用的时间，毫秒值
  // 2：当前值，例如当前内存占用等信息；单位：内存占用：Byte
  // 3、百分比，例如cpu占用等信息
  // 4: 次数
  // 5、速度值，例如 kb/s等值
  valueType: 1 | 2 | 3 | 4 | 5;
}

export type TimerLogger = { [key: string]: PerformanceLogType[] } | Array<PerformanceLogType> | null;

export interface PerformanceApi extends Api {
  // defaultTimerName: string;

  time(params: TimerParams): Promise<void>;

  timeLog(params?: TimerParams): Promise<void>;

  timeEnd(params: TimerParams, noReport?: boolean): Promise<void>;

  point(params: PointParams | PointParams[]): Promise<void>;

  count(params: PointParams | PointParams[]): Promise<void>;

  getTimerLog(params: TimerParams): Promise<TimerLogger | undefined>;

  handleWebMemory(): void;

  handleProcessInfo(): Promise<void>;

  /**
   * @description: 上传记录
   * @param {*}
   * @return {*}
   */
  uploadLog(): void;

  saveLog(): Promise<void>;
}

/**
 *
 */
export interface IProcessMemoryInfo {
  type: string;
  memoryUsed: number;
  name?: string;
  serviceName?: string;
}
