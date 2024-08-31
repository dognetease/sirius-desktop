import { mailListStateTabs, stringMap } from '../types';
import { MailEncodings } from 'api';
import { getIn18Text } from 'api';
/**
 * 文件夹枚举
 */

// todo: 收件箱的名称需要替换
export enum FLOLDER {
  /**
   * 收件箱
   */
  DEFAULT = 1,
  /**
   * 发件箱
   */
  SENT = 3,
  /**
   * 草稿箱
   */
  DRAFT = 2,
  /**
   * 未审核文件夹
   */
  WAITINGISSUE = 17,
  /**
   * 已审核文件夹
   */
  READYISSUE = 19,
  /**
   * 广告
   */
  ADVITISE = 7,
  /**
   * 垃圾邮件
   */
  SPAM = 5,
  /**
   * 病毒
   */
  VIRUS = 6,
  /**
   * 已删除
   */
  DELETED = 4,
  /**
   * 订阅邮件
   */
  SUBSCRIPTION = 18,
  /**
   * 隔离邮件
   */
  ISOLATION = 89,
  /**
   * 红旗邮件
   */
  REDFLAG = -1,
  /**
   * 任务邮件
   */
  TASK = -9,
  /**
   * 未读文件夹
   */
  UNREAD = -4,
  /**
   * 星标联系人
   */
  STAR = -5,
  /**
   * 其他, 更多文件夹
   */
  OTHERS = -2,
  /**
   * 稍后处理
   */
  DEFER = -3,
  /**
   * 标签 非后台约定，制作前端tag区分
   */
  TAG = -199,
  /**
   * 搜索-全部结果
   */
  SEARCH_ALL_RESULT = -33,
  // >= 100 则为用户自定义文件夹
}
/**
 * 文件夹ID 到名称的Map
 */
export const FolderId2NameMap: {
  [key: string]: string;
} = {
  '1': getIn18Text('SHOUJIANXIANG'),
  '3': getIn18Text('FAJIANXIANG'),
  '2': getIn18Text('CAOGAOXIANG'),
  '17': getIn18Text('WEISHENHEWENJIAN'),
  '19': getIn18Text('YISHENHEWENJIAN'),
  '7': getIn18Text('GUANGGAOWENJIANJIA'),
  '5': getIn18Text('LAJIYOUJIAN1'),
  '6': getIn18Text('BINGDUWENJIAN'),
  '4': getIn18Text('YISHANCHUWENJIAN'),
  '18': getIn18Text('DINGYUEYOUJIAN'),
  '89': getIn18Text('GELIYOUJIAN'),
  '-1': getIn18Text('HONGQIYOUJIAN'),
  '-9': getIn18Text('RENWUYOUJIAN'),
  '-2': getIn18Text('QITAYOUJIAN'),
  '-3': getIn18Text('SHAOHOUCHULI'),
  '-199': getIn18Text('BIAOQIAN'),
};

/**
 * 文件夹ID 到名称的中文Map，用于埋点上报，不做中英文替换！！！
 */
export const FolderId2NameChineseMap: {
  [key: string]: string;
} = {
  '1': '收件箱',
  '3': '发件箱',
  '2': '草稿箱',
  '17': '待审核',
  '19': '已审核',
  '7': '广告邮件',
  '5': '垃圾邮件',
  '6': '病毒邮件',
  '4': '已删除',
  '18': '订阅邮件',
  '89': '隔离邮件',
  '-1': '红旗邮件',
  '-9': '任务邮件',
  '-2': '其他邮件',
  '-3': '稍后处理',
  '-199': '标签',
};

/**
 *  当邮件列表少于某个数量后触发后续请求填补
 *  由于列表首次加载20，该数量设置为15可以防止移动1条后立即开始抖动
 */
export const MAIL_FILL_RANG_NUM = 15;
// 邮件列表-上方-提示bar的高度
export const MAIL_NOTICE_BAR_HEIGHT = 100;
// 邮件列表-置顶邮件的最大数量
export const MAX_MAILTOP_SUM = 20;
// 邮件卡片-基本信息高度
export const MAIL_CARD_BASE_HEIGHT = 63;
// 邮件卡片-附件-高度
export const MAIL_CARD_ATTACH_HEIGHT = 32;
// 文件夹操作检测-最大文件夹数量限制 - 前端不在做限制
export const FOLDER_TREE_MAX_COUNT = +Infinity;
// 文件夹操作检测-最大深度限制
export const FOLDER_TREE_MAX_DEEP = 12;
// 邮件操作邮件菜单的枚举
export enum MAIL_MENU_ITEM {
  /**
   * 返回
   */
  BACK = 'BACK',
  /**
   * 再次编辑
   */
  RE_EDIT = 'RE_EDIT',
  /**
   * 回复
   */
  REPLAY = 'REPLAY',
  /**
   * 回复全部
   */
  REPLAY_ALL = 'REPLAY_ALL',
  /**
   * 邮件备注
   */
  COMMENT = 'COMMENT',
  /**
   * 转发
   */
  FORWARD = 'FORWARD',
  /**
   * 分发（外贸文案：分发，办公文案：原信转发）
   */
  DELIVERY = 'DELIVERY',
  /**
   * 作为附件转发
   */
  FORWARD_BY_ATTACH = 'FORWARD_BY_ATTACH',
  /**
   * 设置优先
   */
  // PREFERRED = 'PREFERRED',
  /**
   * 邮件待办
   */
  DEFER = 'DEFER',
  /**
   * 红旗标记
   */
  RED_FLAG = 'RED_FLAG',
  /**
   * 已读未读
   */
  READ = 'READ',
  /**
   * 打标签
   */
  TAG = 'TAG',
  /**
   *
   */
  TOP = 'TOP',
  /**
   * 移动
   */
  MOVE = 'MOVE',
  /**
   * 举报
   */
  REPORT = 'REPORT',
  /**
   * 信任
   */
  REPORT_TRUST = 'REPORT_TRUST',
  /**
   * 删除
   */
  DELETE = 'DELETE',
  // 分享
  SHARE = 'SHARE',
  /**
   * 一键翻译
   */
  TRANSLATE = 'TRANSLATE',
  /**
   * 新窗体打开
   */
  OPEN_IN_WINDOW = 'OPEN_IN_WINDOW',
  /**
   * 邮件内容搜索
   */
  SEARCH_IN_CONTENT = 'SEARCH_IN_CONTENT',
  /**
   * 设置来信分类
   */
  SET_FROM_GROUP = 'SET_FROM_GROUP',
  /**
   * 到处邮件/导出聚合邮件
   */
  EXPORT = 'EXPORT',
  /**
   * 选择编码
   */
  ENCODING = 'ENCODING',
  /**
   * 带附件回复
   */
  REPLAY_ATTACH = 'REPLAY_ATTACH',
  /**
   * 带附件回复全部
   */
  REPLAY_ATTACH_ALL = 'REPLAY_ATTACH_ALL',
  /**
   * 撤回
   */
  MAIL_WITHDRAW = 'MAIL_WITHDRAW',
  /**
   * 查看撤回结果
   */
  MAIL_WITHDRAW_RES = 'MAIL_WITHDRAW_RES',
  /**
   * 打印邮件
   */
  PRINT_MAIL = 'PRINT_MAIL',
  /**
   * 打印邮件预览
   */
  PRINT_MAIL_PREVIEW = 'PRINT_MAIL_PREVIEW',
  /**
   * 本地邮件导入
   */
  LOCAL_MAIL_IMPORT = 'LOCAL_MAIL_IMPORT',
  /**
   * 标记为
   */
  MARK = 'MARK',
  /**
   * 新建个人分组
   */
  CREATE_PERSONAL_GROUP = 'CREATE_PERSONAL_GROUP',
  /**
   * 邮件讨论
   */
  DISCUSSION = 'DISCUSSION',
  /**
   * 查看信头
   */
  EMAIL_HEADER = 'EMAIL_HEADER',
}

// 邮件操作排序枚举
export enum MAIL_SORT_ITEM {
  // 仅红旗
  REDFLAG = 'REDFLAG',
  // 仅未读
  UNREAD = 'UNREAD',
  // 仅我的客户（只有外贸环境有）
  MY_CUSTOMER = 'MY_CUSTOMER',
  // 时间由近到远（默认）
  ORDER_BY_DATE_DESC = 'ALL',
  // 时间由远到近
  ORDER_BY_DATE_ASC = 'ORDER_BY_DATE_ASC',
  // 发件人首字母 Z→A
  ORDER_BY_SENDER_CAPITAL_DESC = 'ORDER_BY_SENDER_CAPITAL_DESC',
  // 发件人首字母 A→Z
  ORDER_BY_SENDER_CAPITAL_ASC = 'ORDER_BY_SENDER_CAPITAL_ASC',
  // 收件人首字母 Z→A
  ORDER_BY_RECEIVER_CAPITAL_DESC = 'ORDER_BY_RECEIVER_CAPITAL_DESC',
  // 收件人首字母 A→Z
  ORDER_BY_RECEIVER_CAPITAL_ASC = 'ORDER_BY_RECEIVER_CAPITAL_ASC',
  // 主题首字母 Z→A
  ORDER_BY_SUBJECT_CAPITAL_DESC = 'ORDER_BY_SUBJECT_CAPITAL_DESC',
  // 主题首字母 A→Z
  ORDER_BY_SUBJECT_CAPITAL_ASC = 'ORDER_BY_SUBJECT_CAPITAL_ASC',
  // 邮件由大到小
  ORDER_BY_SIZE_DESC = 'ORDER_BY_SIZE_DESC',
  // 邮件由小到大
  ORDER_BY_SIZE_ASC = 'ORDER_BY_SIZE_ASC',
  // 已逾期/今天
  DEFER = 'DEFER',
  // 进行中
  ON = 'ON',
  // 我发出的
  SENT = 'SENT',
  // 我收到的
  RECEIVED = 'RECEIVED',
  // 含附件
  ATTACHMENT = 'ATTACHMENT',
}

/**
 * 邮件讨论-不显示的文件夹
 */
export const MAIL_DISCUSS_EXCLUDE_FOLDERS = [FLOLDER.SPAM, FLOLDER.ADVITISE, FLOLDER.DRAFT, FLOLDER.DELETED];
/**
 * redux-邮件仓库key
 */
export const MAIL_STORE_REDUX_STATE = 'mailEntities';
/**
 * 邮件快捷键-选中状态
 */
export enum LIST_MODEL {
  INIT = 'INIT',
  SINGLE = 'SINGLE',
  MULTIPLE = 'MULTIPE',
}
/*
 * 任务邮件的任务状态
 */
export enum TASK_MAIL_STATUS {
  /**
   * 进行中
   */
  PROCESSING = 0,
  /**
   * 已完成
   */
  COMPLETED = 1,
  /**
   * 已结束
   */
  END = 2,
}

/**
 *  文件夹操作的错误map
 *  todo: 现在是从api层复制过来的，需要做合并处理
 */
// export const CORP_FOLDER_ERRCODE_MAP: stringMap = {
//   FA_FORBIDDEN: getIn18Text('FA_FORBIDDEN'),
//   FA_HAS_CHILD: getIn18Text('FA_HAS_CHILD'),
//   FA_OVERFLOW: getIn18Text('FA_OVERFLOW'),
//   FA_PARENT_NOT_FOUND: getIn18Text('FA_PARENT_NOT_FOUND'),
//   FA_NAME_EXISTS: getIn18Text('FA_NAME_EXISTS'),
//   FA_NAME_INVALID: getIn18Text('FA_NAME_INVALID'),
//   FA_ID_NOT_FOUND: getIn18Text('FA_ID_NOT_FOUND'),
//   FA_INVALID_PARENT: getIn18Text('FA_INVALID_PARENT'),
// };

// 邮件列表顶部tab文案
export const allStr = getIn18Text('QUANBU');
export const preferredStr = getIn18Text('YOUXIAN');
export const redFlagStr = getIn18Text('JINHONGQI');
export const unReadStr = getIn18Text('JINWEIDU');
export const attachmentStr = getIn18Text('HANFUJIAN');
export const myCustomerStr = getIn18Text('JINWODEKEHU');
export const onStr = getIn18Text('JINXINGZHONG');
export const deferStr = getIn18Text('YIYUQI/JIN');
export const sendStr = getIn18Text('FAJIAN');
export const receiveStr = getIn18Text('SHOUJIAN');
export const colleagueStr = getIn18Text('colleague');
export const orderBySenderCapDescStr = getIn18Text('ORDER_BY_SENDER_CAPITAL_DESC');
export const orderBySenderCapAscStr = getIn18Text('ORDER_BY_SENDER_CAPITAL_ASC');
export const orderByReceiverCapDescStr = getIn18Text('ORDER_BY_RECEIVER_CAPITAL_DESC');
export const orderByReceiverCapAscStr = getIn18Text('ORDER_BY_RECEIVER_CAPITAL_ASC');
export const orderBySubjectCapDescStr = getIn18Text('ORDER_BY_SUBJECT_CAPITAL_DESC');
export const orderBySubjectCapAscStr = getIn18Text('ORDER_BY_SUBJECT_CAPITAL_ASC');
export const orderBySizeCapDescStr = getIn18Text('ORDER_BY_SIZE_DESC');
export const orderBySizeCapAscStr = getIn18Text('ORDER_BY_SIZE_ASC');
export const orderByDateAscStr = getIn18Text('ORDER_BY_DATE_ASC');
export const orderByDateDescStr = getIn18Text('ORDER_BY_DATE_DESC');
// 邮件列表顶部tab的三种状态,（不包含任务邮件,稍后处理）
export const filterTabMap: Record<string, mailListStateTabs[]> = {
  // 聚合模式下，没有优先tab
  normal: [
    // 全部(时间降序)，红旗，未读
    { type: 'ALL', title: orderByDateDescStr },
    { type: 'REDFLAG', title: redFlagStr },
    { type: 'UNREAD', title: unReadStr },
    { type: 'ORDER_BY_DATE_ASC', title: orderByDateAscStr },
    { type: 'ORDER_BY_SENDER_CAPITAL_DESC', title: orderBySenderCapDescStr },
    { type: 'ORDER_BY_SENDER_CAPITAL_ASC', title: orderBySenderCapAscStr },
    { type: 'ORDER_BY_RECEIVER_CAPITAL_DESC', title: orderByReceiverCapDescStr },
    { type: 'ORDER_BY_RECEIVER_CAPITAL_ASC', title: orderByReceiverCapAscStr },
    { type: 'ORDER_BY_SUBJECT_CAPITAL_DESC', title: orderBySubjectCapDescStr },
    { type: 'ORDER_BY_SUBJECT_CAPITAL_ASC', title: orderBySubjectCapAscStr },
    { type: 'ORDER_BY_SIZE_DESC', title: orderBySizeCapDescStr },
    { type: 'ORDER_BY_SIZE_ASC', title: orderBySizeCapAscStr },
  ],

  // 17版本智能模式下线，preferredFirst，allFirst不存在了，统一为normal
  // 智能模式，默认优先
  // preferredFirst: [
  //   // 优先, 全部，红旗，未读
  //   { type: 'PREFERRED', title: preferredStr },
  //   { type: 'ALL', title: allStr },
  //   { type: 'REDFLAG', title: redFlagStr },
  //   { type: 'UNREAD', title: unReadStr },
  // ],
  // 智能模式，默认全部
  // allFirst: [
  //   //  全部，优先，红旗，未读
  //   { type: 'ALL', title: allStr },
  //   { type: 'PREFERRED', title: preferredStr },
  //   { type: 'REDFLAG', title: redFlagStr },
  //   { type: 'UNREAD', title: unReadStr },
  // ],
  // 任务邮件
  task: [
    //  全部，进行中
    { type: 'ALL', title: allStr },
    { type: 'ON', title: onStr },
  ],
  // 待处理
  defer: [
    //  全部，已逾期
    { type: 'ALL', title: allStr },
    { type: 'DEFER', title: deferStr },
  ],
  // 客户邮件
  customer: [
    //  全部，收件，发件
    { type: 'ALL', title: allStr },
    // { type: 'SEND', title: sendStr },
    // { type: 'RECEIVE', title: receiveStr },
    { type: 'ME', title: '与我' },
    { type: 'COLLEAGUE', title: '与同事' },
  ],
  // 下属邮件
  subordinate: [
    //  全部，收件，发件
    { type: 'ALL', title: allStr },
    { type: 'SEND', title: sendStr },
    { type: 'RECEIVE', title: receiveStr },
  ],
  // 已删除
  deleted: [
    { type: 'ALL', title: orderByDateDescStr },
    { type: 'ORDER_BY_DATE_ASC', title: orderByDateAscStr },
    { type: 'ORDER_BY_SENDER_CAPITAL_DESC', title: orderBySenderCapDescStr },
    { type: 'ORDER_BY_SENDER_CAPITAL_ASC', title: orderBySenderCapAscStr },
    { type: 'ORDER_BY_RECEIVER_CAPITAL_DESC', title: orderByReceiverCapDescStr },
    { type: 'ORDER_BY_RECEIVER_CAPITAL_ASC', title: orderByReceiverCapAscStr },
    { type: 'ORDER_BY_SUBJECT_CAPITAL_DESC', title: orderBySubjectCapDescStr },
    { type: 'ORDER_BY_SUBJECT_CAPITAL_ASC', title: orderBySubjectCapAscStr },
    { type: 'ORDER_BY_SIZE_DESC', title: orderBySizeCapDescStr },
    { type: 'ORDER_BY_SIZE_ASC', title: orderBySizeCapAscStr },
  ],
  // 垃圾邮件
  spam: [
    { type: 'ALL', title: orderByDateDescStr },
    { type: 'ORDER_BY_DATE_ASC', title: orderByDateAscStr },
    { type: 'ORDER_BY_SENDER_CAPITAL_DESC', title: orderBySenderCapDescStr },
    { type: 'ORDER_BY_SENDER_CAPITAL_ASC', title: orderBySenderCapAscStr },
    { type: 'ORDER_BY_RECEIVER_CAPITAL_DESC', title: orderByReceiverCapDescStr },
    { type: 'ORDER_BY_RECEIVER_CAPITAL_ASC', title: orderByReceiverCapAscStr },
    { type: 'ORDER_BY_SUBJECT_CAPITAL_DESC', title: orderBySubjectCapDescStr },
    { type: 'ORDER_BY_SUBJECT_CAPITAL_ASC', title: orderBySubjectCapAscStr },
    { type: 'ORDER_BY_SIZE_DESC', title: orderBySizeCapDescStr },
    { type: 'ORDER_BY_SIZE_ASC', title: orderBySizeCapAscStr },
  ],
  // 待审核
  waittingIssue: [
    { type: 'ALL', title: orderByDateDescStr },
    { type: 'ORDER_BY_DATE_ASC', title: orderByDateAscStr },
    { type: 'ORDER_BY_SENDER_CAPITAL_DESC', title: orderBySenderCapDescStr },
    { type: 'ORDER_BY_SENDER_CAPITAL_ASC', title: orderBySenderCapAscStr },
    { type: 'ORDER_BY_RECEIVER_CAPITAL_DESC', title: orderByReceiverCapDescStr },
    { type: 'ORDER_BY_RECEIVER_CAPITAL_ASC', title: orderByReceiverCapAscStr },
    { type: 'ORDER_BY_SUBJECT_CAPITAL_DESC', title: orderBySubjectCapDescStr },
    { type: 'ORDER_BY_SUBJECT_CAPITAL_ASC', title: orderBySubjectCapAscStr },
    { type: 'ORDER_BY_SIZE_DESC', title: orderBySizeCapDescStr },
    { type: 'ORDER_BY_SIZE_ASC', title: orderBySizeCapAscStr },
  ],
  // 已审核
  readyIssue: [
    { type: 'ALL', title: orderByDateDescStr },
    { type: 'ORDER_BY_DATE_ASC', title: orderByDateAscStr },
    { type: 'ORDER_BY_SENDER_CAPITAL_DESC', title: orderBySenderCapDescStr },
    { type: 'ORDER_BY_SENDER_CAPITAL_ASC', title: orderBySenderCapAscStr },
    { type: 'ORDER_BY_RECEIVER_CAPITAL_DESC', title: orderByReceiverCapDescStr },
    { type: 'ORDER_BY_RECEIVER_CAPITAL_ASC', title: orderByReceiverCapAscStr },
    { type: 'ORDER_BY_SUBJECT_CAPITAL_DESC', title: orderBySubjectCapDescStr },
    { type: 'ORDER_BY_SUBJECT_CAPITAL_ASC', title: orderBySubjectCapAscStr },
    { type: 'ORDER_BY_SIZE_DESC', title: orderBySizeCapDescStr },
    { type: 'ORDER_BY_SIZE_ASC', title: orderBySizeCapAscStr },
  ],
  // 广告
  advitise: [
    { type: 'ALL', title: orderByDateDescStr },
    { type: 'ORDER_BY_DATE_ASC', title: orderByDateAscStr },
    { type: 'ORDER_BY_SENDER_CAPITAL_DESC', title: orderBySenderCapDescStr },
    { type: 'ORDER_BY_SENDER_CAPITAL_ASC', title: orderBySenderCapAscStr },
    { type: 'ORDER_BY_RECEIVER_CAPITAL_DESC', title: orderByReceiverCapDescStr },
    { type: 'ORDER_BY_RECEIVER_CAPITAL_ASC', title: orderByReceiverCapAscStr },
    { type: 'ORDER_BY_SUBJECT_CAPITAL_DESC', title: orderBySubjectCapDescStr },
    { type: 'ORDER_BY_SUBJECT_CAPITAL_ASC', title: orderBySubjectCapAscStr },
    { type: 'ORDER_BY_SIZE_DESC', title: orderBySizeCapDescStr },
    { type: 'ORDER_BY_SIZE_ASC', title: orderBySizeCapAscStr },
  ],
};

// 邮件搜索结果筛选器
export enum MAIL_SEARCH_FILTER {
  'folder' = '文件夹',
  'from' = '发件人',
  'sentDate' = '时间范围',
  'attached' = '有无附件',
  'read' = '阅读状态',
}

// 邮件列表的默认宽度
// export const DEFAULT_LIST_WIDTH = 324;
// 邮件列表的最小宽度
// export const DEFAULT_LIST_MIN_WIDTH = 310;

// 初始化页面链接参数的key - 普通参数
export const INIT_TASK_KEY = 'initTask';
export const INIT_TASK_TIME_KEY = 'initTaskTime';
// 初始化页面链接参数的key - 任务参数
export const INIT_STATE_KEY = 'initState';

// 邮件列表的首次加载数量
export const MAIL_LIST_INIT_RANGE_COUNT = 30;

// 邮件列表的第后续加载数量
export const MAIL_LIST_MORE_RANGE_COUNT = 100;

// 星标联系人文件夹-是否展开-localStroage key
// export const STAR_FOLDER_IS_EXPAND = 'STAR_FOLDER_IS_EXPAND';

/**
 * 本地分账号文件夹-是否展开-localStroage key
 */
export const FOLDER_EXPAND_ACCOUNT = 'FOLDER_ACCOUNT_EXPAND';

// 请求取消的通用错误
export const ERROR_REQUEST_CANCLE = 'ERROR_REQUEST_CANCLE';

/**
 * 邮件读信页-编码
 */
export const ENCODING_MAP: Record<MailEncodings, string> = {
  default: getIn18Text('MORENBIANMA'),
  GB2312: getIn18Text('GB2312'),
  Big5: getIn18Text('BIG5'),
  'UTF-8': getIn18Text('UTF-8'),
  'ISO-8859-1': getIn18Text('ISO-8859-1'),
  'EUC-JP': getIn18Text('EUC-JP'),
  Shift_JIS: getIn18Text('Shift-JIS'),
  'ISO-2022-KR': getIn18Text('IOS-2022-KR'),
};

/**
 * 邮件列表-邮件选择-下拉选择类型枚举
 */
export enum MAIL_LIST_CHOOSE_TYPE {
  ALL = 'ALL',
  EMPTY = 'EMPTY',
  UNREAD = 'UNREAD',
  READ = 'READ',
}

export const IMG_TYPES = ['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG', 'svg', 'SVG', 'gif', 'GIF'];

/**
 * 聚合邮件分页-默认每页数量
 */
export const THREAD_MAIL_PAGE_SIZE = 50;

/**
 * 邮件删除期限
 */
export const KEEP_PERIOS = 30;

/**
 * 邮件标签-快捷键对照Key
 */
export const MAIL_TAG_HOTKEY_LOCAL_KEY = 'MAIL_TAG_HOTKEY_LOCAL_KEY';

/**
 * 邮件标签-新功能tag-是否展示本地存储key
 */
export const MAIL_TAG_GUIDE_LOCAL_KEY = 'MAIL_TAG_GUIDE_LOCAL_KEY';

/**
 * 邮件-写信页-是否展示快捷键引导提示弹窗-本地记录key
 */
export const MAIL_WRITE_GUIDE_LOCAL_KEY = 'MAIL_WRITE_GUIDE_LOCAL_KEY';

/**
 * 邮件-发信-快捷键是否开启-本地key
 */
export const MAIL_WRITE_HOTKEY_LOCAL_KEY = 'MAIL_WRITE_HOTKEY_LOCAL_KEY';
