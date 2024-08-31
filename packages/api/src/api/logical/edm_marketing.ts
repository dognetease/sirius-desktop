import { Moment } from 'moment';

import { EdmSendConcatInfo, BatchSendSetting, EdmContentInfo, AutoRecInfo, WarmUpAccountSource, CheckEmailAddressInfo } from '@/api/logical/edm';
// edm 营销
export type StepValueModel = 'SendSetting' | 'ContentEditor' | 'BatchSetting';

export type ReceiversSendTypeModel = 'filter' | 'normal';

export type ReceriverGroupModel = '1' | '2' | '3' | '4' | '5';

// 各种入口跳转至目标页后的上一级页面面包屑文案
export const BreadcrumbMap: Record<PrevScene, string> = {
  customer: '客户和业务',
  globalSearch: '全球搜索',
  addressBook: '营销联系人',
  customs: '海关数据',
  aisearch: '智能引擎搜索',
  linkedin: 'LinkedIn获客',
  cantonfair: '展会数据',
  lbs: 'LBS搜索',
  extension: '插件获客',
  ffms: '运价页面统计',
  template: '内容库',
  draft: '草稿列表',
  copyTask: '邮件任务列表',
  uniTemplate: '商品列表',
  br: '一带一路专题',
  // 默认值
  newCreate: '智能营销',
  // 以下入口产品未明确，使用兜底值
  smartrcmd: '智能推荐',
  facebook: '上一级页面',
  customerRcmd: '上一级页面',
  default: '上一级页面',
  personalOrg: '通讯录',
  marketingModal: '智能营销',
  forwarder: '上一级页面',
  intelligent: '上一级页面',
  keywords: '上一级页面',
  innerContent: '智能营销',
  grub: '上一级页面',
  taskzhenduan: '诊断与建议',
  templateV2: '内容库',
  noviceTask: '新手任务',
  contomFair: '展会买家',
};

// 前置场景, 用户从什么场景跳入到营销发信流程
// template: 模板
// customer: 海关(一键营销)
// copyTask: 复制任务
// newCreate: 新建
// globalSearch: 全球搜
// addressBook: 地址簿
// uniTemplate: 产品中心
// draft: 草稿
// customs: 海关
// forwarder: 港口搜索
// intelligent 智能引擎搜索
// aisearch: 智能搜索引擎
// subscription: 公司订阅
// linkedin: 领英搜索
// cantonfair: 广交会
// 'facebook': facebook搜索
// 'lbs' : lbs搜索
// 'extension' : 外贸通助手
// 'personalOrg': 个人通讯录分组
// taskzhenduan 诊断
// br 一带一路 belt & road
// templateV2 内容库
// eslint-disable-next-line max-len

// ---------------------------------------- Warning!!! ----------------------------------------
// --------------------------------------------------------------------------------------------
// ------ 添加 PrevScene 的时候, 请一并添加 BreadcrumbMap 的对应关系, 用来展示一键营销页面的面包屑 ------
// --------------------------------------------------------------------------------------------
// ---------------------------------------- Warning!!! ----------------------------------------
export type OneClickMarketingPrevScene =
  | 'customer'
  | 'globalSearch'
  | 'smartrcmd'
  | 'addressBook'
  | 'customs'
  | 'forwarder'
  | 'intelligent'
  | 'aisearch'
  | 'linkedin'
  | 'cantonfair'
  | 'facebook'
  | 'lbs'
  | 'extension'
  | 'ffms'
  | 'keywords'
  | 'personalOrg'
  | 'grub'
  | 'subscription'
  | 'taskzhenduan'
  | 'peers'
  | 'contomFair'
  | 'br'
  | 'templateV2'
  | 'crmdetail';

export type OtherPrevScene =
  | 'template'
  | 'copyTask'
  | 'newCreate'
  | 'uniTemplate'
  | 'draft'
  | 'customerRcmd'
  | 'default'
  | 'marketingModal'
  | 'innerContent'
  | 'noviceTask';

export type PrevScene = OneClickMarketingPrevScene | OtherPrevScene;

export type SourceNameType =
  | '复制粘贴'
  | '文件导入'
  | '个人通讯录'
  | '外贸通助手'
  | '全球搜索'
  | '智能推荐'
  | '海关数据'
  | '客户管理同步'
  | '邮件营销导入'
  | '智能引擎搜索'
  | '营销托管'
  | '领英搜索'
  | '客户管理选择'
  | '手动添加'
  | 'LBS搜索'
  | '广交会搜索'
  | 'Facebook搜索'
  | '货代平台数据统计'
  | '客户和业务' /** facebook为未上线预留字段 */
  | '展会买家'
  | '一带一路'
  | '货代同行'
  | 'crm详情页';

export interface ReceiverInfoModel {
  receiversSendType: ReceiversSendTypeModel;
  receriverGroup: ReceriverGroupModel;
  notification?: string;
}

export interface Plan {
  title?: string;
  round?: number;
  mailInfo?: Partial<EdmContentInfo>;
  aiOn?: boolean;
  aiResult?: AIResults;
  pickResult?: { words: Words; text: string };
  multiContentId?: string;
}

export interface StepsInfoModel {
  steps: StepValueModel[];
  currentStep: StepValueModel;
  receiverInfo: ReceiverInfoModel;
}
export interface StepsModel {
  label: string;
  value: string;
  id: number;
  checked: boolean;
}

// 发件设置
export interface AttachmentInfo {
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  expireTime?: number;
  identity?: string;
  type: number; // 0 普通附件 1 云附件
}

export enum TaskChannel {
  normal = 'normal',
  senderRotate = 'senderRotate',
}

export interface ISettingData {
  edmSubject?: string;
  emailSubject?: string;
  emailSubjects?: Array<{ subject: string }>;
  sender?: string;
  replyEmail?: string;
  ccInfos?: { email: string }[];
  ccEmails?: string;
  ccReceivers?: boolean;
  sendTime?: string;
  sendTimeZone?: string;
  senderEmail?: string;
  sendTimeCountry?: string;
  emailCategory?: string | number;
  emailSummary?: string;
  cronSendType?: number; // 0 统一发送时间 1 当地发送时间
  senderEmails?: string[];
}
export interface ISettingHandle {
  validateFields(): Promise<ISettingData>;
  getValues(): ISettingData;
  resetFields(): void;
  clearHoverGuide(): void;
  clearVariableHoverGuide(): void;
  getSenderEmails(): CheckEmailAddressInfo[];
  highLightAddSubject(): void;
  configEmailSubject(content: string): void;
}
export interface IWriteMailData {
  currentStage: number;
  sendSettingInfo: ISettingData;
  replyEdmEmailId: null | string;
  sendStrategyOn?: boolean;
  contentEditInfo: {
    emailContent?: string;
    attachmentList?: AttachmentInfo[];
    signature?: string;
  };
  secondSendInfo: {
    saveInfos: Array<SecondSendStrategy>;
  };
  receiverInfo: {
    contactInfoList?: EdmSendConcatInfo[];
    sendTime?: string;
    sendTimeZone?: string;
  };
  sendDomainLimit?: number;
  cronSendType?: number; // 0 统一发送时间 1 当地发送时间
}

export interface BatchIWriteMailData {
  batchSendSetting: BatchSendSetting;
  currentStage: number;
  sendSettingInfo: ISettingData;
  contentEditInfo: {
    emailContent?: string;
    attachmentList?: AttachmentInfo[];
    signature?: string;
  };
  receiverInfo: {
    contacts?: any[];
  };
}

export interface BaseSendInfo {
  sendSettingInfo: ISettingData;
  /**
   * 0：不一致，1：一致
   */
  // sameFirstSender?: 0 | 1;
  contentEditInfo: {
    emailContent?: string;
    emailAttachment?: string;
    attachmentList?: AttachmentInfo[];
    signature?: string;
    emailContentId?: string;
  };
}

export type SecondSendStrategy = {
  defaultTemplate?: 1 | 2;
  triggerCondition?: {
    conditionType: number;
    conditionContent: {
      emailOpDays: number;
      /**
       * 邮件动作,0-打开，1-回复，2-未打开，3-打开未回复，100-无条件
       */
      emailOpType: 0 | 1 | 2 | 3 | 4 | 100;
      filterAutoReply?: 0 | 1;
    };
    isRecommend?: boolean;
    // 是否发生了编辑
    isEdited?: boolean;
    /**
     * 是否选中
     */
    isSelected?: boolean;
    /**
     * 是否ai重写
     */
    isAiWrite?: boolean;
    /**
     * 二次营销发信账号选择
     */
    senderType?: 0 | 1 | null;
  };
  selected?: 0 | 1;
  strategyId?: 1 | 2;
} & BaseSendInfo;
export interface SecondSendInfo {
  saveInfos: Array<SecondSendStrategy>;
}

export interface SendStepProps {
  readonly: boolean;
  visible: boolean;
  channel?: TaskChannel;
}

// 营销不同路径跳转相关 ==end

// ai写信 - start
export interface AiWriteMailModel {
  type: string; // 类型，(1：开发信，2：产品介绍，3：节日祝福，0：其他)
  tone: string | null; // 语气
  otherTone?: string; // 其他语气
  language: string; // 语言
  company: string; // 公司名称
  product: string; // 产品名称
  mustContains: string; // 必须包含的语句
  extraDesc: string; // 额外描述
  originalContent?: string; // 原文内容
  wordCountLevel?: number; // 限制字数
  first?: boolean | undefined; // 是否是首次请求
  taskId?: string; // 任务ID
  date?: string; // 日期
  time?: string; // 时间
  requiredList?: string[]; // 必须包含的语句
  moments?: {
    // 时间
    startDate: Moment;
    endDate: Moment;
    startTime?: Moment;
    endTime?: Moment;
  };
}

export interface AiWriteMailResModel {
  prompt: string;
  text: string;
  gptRecordId: string;
}
// ai写信-end

// -----数据报告-----
export interface GenerateReportReq {
  edmEmailIds: Array<string>;
}
export interface GenerateReportRes {
  dataReportId: string;
}

export interface QueryReportReq {
  dataReportId: string;
}
export interface QueryReport {
  dataReportId: string;
  status: number;
  overviewStat: {
    sendEdmCount: number;
    sendCount: number;
    arriveCount: number;
    arriveRatio: null;
    readCount: number;
    readRatio: null;
    readNum: number;
    replyCount: number;
    replyRatio: null;
    unsubscribeCount: number;
    sendEmailCount?: number;
    accEmailList: Array<string>;
  };
  compareStat: {
    systemData: {
      arriveRatio: string;
      readRatio: string;
      replyRatio: string;
    };
    userData: {
      arriveRatio: string;
      readRatio: string;
      replyRatio: string;
    };
  };
  readStat: {
    readList: {
      edmSubject: string;
      emailSubjects: string[];
      arriveCount: number;
      readCount: number;
      readRatio: string;
      edmMode: 0 | 1;
    }[];
    countryList: {
      country: string;
      readCount: number;
      readRatio: string;
    }[];
    platFormList: {
      platForm: string;
      readCount: number;
      readNum: number;
    }[];
    timeList: {
      time: string;
      count: number;
    }[];
  };
  replyStat: {
    replyList: {
      edmSubject: string;
      arriveCount: number;
      readCount: number;
      replyCount: number;
      replyRatio: string;
      edmMode: 0 | 1;
    }[];
    timeList: {
      time: string;
      count: number;
    }[];
  };
  unsubscribeStat: {
    unsubscribeList: {
      edmSubject: string;
      arriveCount: number;
      readCount: number;
      unsubscribeCount: number;
      edmMode: 0 | 1;
    }[];
  };
  traceStat: {
    traceList: {
      traceUrl: string;
      clickCount: number;
      clickNum: number;
    }[];
  };
  analysis: {
    edmEmailSendCount: number;
    arriveRatioCompare: string;
    arriveCount: number;
    readRatioCompare: string;
    readCount: number;
    countryList: string[];
    readHighestTime: number;
    replyHighestTime: number;
    unsubscribeCount: number;
    traceHighestUrl: string;
    clickHighestCount: number;
    clickHighestNum: number;
    sendCount: number;
    platFormList: string[];
    platFormName: string;
  };
}
export type QueryReportRes = Partial<QueryReport>;
// ----------

// --- 写信内容上传 ---
export interface EmailContentUploadReq {
  emailContent: string;
  emailContentId: string;
  draftId?: number;
}
export interface EmailContentUploadRes {
  emailContentId: string;
}

export interface GetEmailContentReq {
  emailContentId: string;
  edmEmailId?: number | string;
  draftId?: string;
}
export interface GetEmailContentRes {
  emailContent: string;
}

export interface GptRecordReq {
  gptType: 0 | 1;
}

export interface GptRecordRes {
  companys: string[];
  products: string[];
  keywords: string[];
  intro: string[];
  festival: string[];
  otherDesc: string[];
}

// 主题改写
export interface ContentPolishReq {
  language?: string;
  originalContent: string;
}
export interface ContentPolishRes {
  text: string;
}

export interface AIModifyInfo {
  id?: string;
  use?: boolean;
  originalSentence?: string;
  aiSentenceList?: Array<{
    aiSentence: string;
    unSelected?: boolean;
  }>;
  placeholder?: string;
}

export interface AIResults {
  title?: string;
  mailContent: string;
  modify: Array<AIModifyInfo>;
}
// ----------

export interface SentenceModel {
  sentence: string;
}

interface AiSentenceModel {
  aiSentence: string;
}

interface AiDynamicInfoModel {
  originalSentence: string;
  placeholder: string;
  aiSentenceList: AiSentenceModel[];
}
interface AiContentRefreshInfos {
  content: string;
  aiContentList: { aiContent: string }[];
}

// ai内容生成接口
export interface GptAiContentReq {
  contactSize: number;
  first: boolean;
  taskId: string | null;
  sentenceList: SentenceModel[];
  /**
   * 千邮千面是否限制语言执行，默认0无限制，1：有限制
   */
  languageLimit?: 0 | 1;
}

export interface GptAiContentRefreshReq {
  size: number;
  contentList: { content: string }[];
  type: 3 | 4 | 5; // 改写类型，3：主题改写，4：多版本句子更换
  first: boolean;
  taskId?: string;
}

export interface GPTAiContentRes {
  taskId: string | null;
  finishState: 0 | 1 | 2 | 3;
  aiDynamicInfos?: AiDynamicInfoModel[];
}

export interface GPTAiContentRefreshRes {
  taskId: string;
  finishState: 0 | 1 | 2; // 0表示处理中，1标识处理完成，2标识处理失败
  aiContentInfos?: AiContentRefreshInfos[];
}

export interface GptAiContentTranslateReq {
  htmlList: string[];
  from: string;
  to: string;
}
export interface GPTAiContentTranslateRes {
  data: { translations: string[] };
  code: number;
  success: boolean;
  message: string;
  token: number;
}

// ---- ai重写动态配置 ----
export interface AIRewriteConfRes {
  sentenceCount: number;
  maximumBytes: number;
  minimumBytes: number;
  /**
   * 关键字黑名单
   */
  wordsBlackList: Array<string>;
  hostingMaxVersion?: number;
}

export const defaultConfig: AIRewriteConfRes = {
  maximumBytes: 300,
  minimumBytes: 30,
  sentenceCount: 4,
  wordsBlackList: [],
  hostingMaxVersion: 125,
};
export type Words = Array<{
  /**
   * 元素选择器
   */
  id: string;
  /**
   * 句子
   */
  word: string;
}>;
// ---------

// ai托管
export const DailyDetailTabs = ['SEND', 'REPLY', 'UNSUBSCRIBE'] as const;
export type DailyDetailType = (typeof DailyDetailTabs)[number];

export interface DailyDetailSend {
  emailMid: string;
  email: string;
  name: string;
  sendTime: string;
  arrive: boolean;
  read: boolean;
  reply: boolean;
  unsubscribe: boolean;
  traceClickNum: number;
}

export interface DailyDetailReplay {
  // emailMid: string;
  accId: number;
  edmEmailId: string;
  email: string;
  name: string;
  replyTime: string;
  // replyEmail: string;
}

export interface DailyDetailUnsubscribe {
  emailMid: string;
  email: string;
  name: string;
  unsubscribeTime: string;
}

export interface GetAiOverviewReq {
  taskId: string;
}

export interface GetAiOverviewRes {
  hostingSwitch: boolean;
  hostingTime: string;
  totalReadCount: number;
  totalReplyCount: number;
  totalReceiverCount: number;
  /**
   * 运行中任务数
   */
  totalPlanCount: number;
  hostingCreateTime: number;
  // 0 正常，1 日发送额不足，2 域发送额度不足
  execTaskStatus: 0 | 1 | 2;
  roundReplyCounts: number[];
  hasContact: boolean;
}

export interface GetAiDailyStatsReq {
  taskId: string;
  searchDate: string;
  planId?: string;
}

export interface GetAiDailyStatsRes {
  receiverCount: number;
  contactCount: number;
  sendNum: number;
  arriveNum: number;
  readNum: number;
  replyCount: number;
  arriveRatio: string;
  readRatio: string;
  readCount: number;
  dailyStats: Array<{
    date: number;
    receiverCount: number;
    sendNum: number;
    arriveNum: number;
    arriveRatio: string;
    readNum: number;
    readCount: number;
    readRatio: string;
    replyCount: number;
    replyRatio: string;
    unsubscribeNum: number;
    rounds: Array<{
      round: number;
      receiverCount: number;
      sendNum: number;
      arriveNum: number;
      readNum: number;
      replyCount: number;
    }>;
  }>;
}

export interface GetAiDailyDetailReq {
  date: string;
  page: number;
  pageSize: number;
  type: DailyDetailType;
  taskId: string;
  planId: string;
}

export interface AiDetailList {
  sendList: Array<DailyDetailSend>;
  replyList: Array<DailyDetailReplay>;
  unsubscribeList: Array<DailyDetailUnsubscribe>;
}
export type GetAiDailyDetailRes = {
  totalPage: number;
  totalSize: number;
  page: number;
  pageSize: number;
} & AiDetailList;

// export interface SaveAiHostingTaskReq {
//   sendSettingInfo: {
//     sender: string;
//     replyEmail: string;
//   };
//   company: string;
//   industry: string;
//   productIntro: string;
//   companyIntro: string;
//   taskId: string;
// }

// export interface SaveAiHostingTaskRes {
//   taskId: string;
// }

// export interface GetAiHostingTaskInfoReq {
//   taskId: string;
// }

// export interface GetAiHostingTaskInfoRes {
//   sendSettingInfo: {
//     sender: string;
//     replyEmail: string;
//   };
//   company: string;
//   industry: string;
//   productIntro: string;
//   companyIntro: string;
//   taskId: string;
// }

/**
 * ai营销托管开关
 */
export interface AiTaskSwitch {
  taskId: string;
  status: 1 | 0;
}

export interface AiBaseInfoSenderEmails {
  email: string;
  accType?: number;
  state?: number;
}

export interface UpdateAiBaseInfoReq {
  planId: string;
  removeRecUser: boolean;
  name: string;
  autoRecInfo: AutoRecInfo;
  sender: string;
  company: string;
  industry: string;
  companyIntro: string;
  productIntros: string[];
  replyEmail: string;
  taskId: string;
  senderEmail: string;
  senderEmails: AiBaseInfoSenderEmails[];
  language: string;
  ruleInfo?: BasicRuleInfo;
}
export interface BasicRuleInfo {
  // 这个是实际的用户填写的
  sendLimit: number;
  positionInfos: PositionObj[];
  sendingDate: Array<number>;
  timeDuration?: {
    from: number;
    to: number;
  };
  // 这俩是配额
  autoMaxSendLimit?: number;
  manualMaxSendLimit?: number;
}

export interface GetAiIndustryItemRes {
  name: string;
}

export interface GetAiIndustryListRes {
  industries: GetAiIndustryItemRes[];
}

export interface GetReplayListReq {
  accId: number;
  edmEmailId: string;
  email: string;
}
export interface GetReplayListItem {
  edmEmailId: string;
  accId: number;
  accEmail: string;
  email: string;
  emailTid: string;
  emailMid: string;
  replySubject: string;
  replayEmail: string;
  replyTime: string;
  operateId: string;
}
export interface GetReplayListRes {
  replyList: Array<GetReplayListItem>;
}

export type GetAiHostingTaskListRes = Array<{
  /**
   * 营销托管任务id
   */
  taskId: string;
}>;

// 企业发信限制
export interface StrategySaveReq {
  edmSendStrategy: {
    dayLimit: number;
    state: number;
    type: number;
  }[];
}

export interface StrategyInfoRes {
  edmSendStrategy: {
    taskName: string;
    taskDesc: string;
    dayLimit: number;
    state: number;
    type: number;
  }[];
}

export interface SmartMarketingProps {
  initData?: Array<SecondSendStrategy>;
  baseSecondSendInfo: BaseSendInfo;
  mailContent?: string;
  /**
   * 是否需要系统推荐的二次营销策略
   */
  needSystemRecommend: boolean;
  mailTextContent?: string;
  astrictCountVal?: number;
  smartSendOn?: boolean;
  smartMarketingVisible: boolean;
  receivers?: EdmSendConcatInfo[];
  handleReMarkingSwitchChange?: (checked: boolean) => void;
}
export interface GetAiHostingPlansReq {
  taskId: string;
  filterAuto?: boolean;
}

export interface createAiHostingGroupReq {
  taskId: string;
  name: string;
}

export interface createAiHostingGroupRes {
  groupId: string;
}

export interface UpdateContactPlanReq {
  taskId: string;
  planId: string;
  emailList: string[];
}

export interface GetAiHostingGroupItemRes {
  id: string;
  name: string;
  createTime?: number;
}

export interface GetAiHostingGroupListRes {
  groupList: GetAiHostingGroupItemRes[];
}

export interface UpdateContactGroupReq {
  taskId: string;
  groupId?: string;
  planId?: string;
  name?: string;
  emailList: string[];
}

export interface AddContactPlanReq {
  name: string;
  taskId: string;
  groupId: string;
  planId: string;
  check?: number;
  // contacts结构尚未确定，先这样定义
  contacts: Record<string, any>[];
  syncCrm?: boolean;
}

export type GetAiHostingPlansRes = Array<{
  planId: string;
  planName: string;
  interval: number;
  intervalUnit: 'DAY' | 'HOUR';
  rounds: number;
  planIconUrl?: string;
}>;

export type GetAiHostingPlansRes2 = Array<{
  planId: string;
  planName: string;
  planIconUrl: string;
  receiverCount: number;
  sendNum: number;
}>;

export interface HostingPlanTagModel {
  tagName: string;
}

export interface HostingRuleModel {
  timeInterval: number[];
  timeUnit: number;
  timeBetweenLoops: number;
}

export interface HostingMailInfoReqModel {
  mailTemplateId: number;
  emailName: string;
  emailDesc: string;
  emailPurpose?: string;
  mailType?: number; // 邮件类型, 1: 打开未回复
  expandMailInfos?: Array<HostingMailInfoReqModel>;
}

export interface ExpandMailInfos {
  mailTemplateId?: number;
  emailPurpose: string;
  emailName: string;
  emailDesc: string;
  mailType: number;
}

export interface HostingMailInfoModel extends HostingMailInfoReqModel {
  sendDay?: string;
}

export interface HostingPlanModel {
  autoRecInfo?: AutoRecInfo;
  planId: string;
  planName: string;
  planTags: HostingPlanTagModel[];
  rule: HostingRuleModel;
  tmplPlanId?: string; // 模板id, 创建的时候必传
  mailInfos: HostingMailInfoModel[];
  status: number;
  loopStatus?: number; // 循环营销 0:关 1:开
  type: 0 | 1; // 0系统计划 1自定义计划
}

export type PlanInfoModel = Pick<HostingPlanModel, 'planId' | 'planName' | 'planTags' | 'rule' | 'mailInfos'>;

export type DelPlanReqModel = Pick<GetAiDailyStatsReq, 'taskId' | 'planId'>;

export interface SavePlanReqModel {
  taskId?: string;
  planInfo: PlanInfoModel;
}

export interface HostingPlanListModel {
  hostingPlans: HostingPlanModel[];
}

export interface EmailTemplateModel {
  templateId: number;
  templateDesc: string;
  emailName?: string;
  emailDesc?: string;
}

export interface EmailTemplatesResModel {
  emailTemplates: EmailTemplateModel[];
}

export interface SubjectAnalysisReq {
  batchId: number | string;
  edmEmailId: number | string;
  parent: boolean;
}

export interface EdmSettingInputRecReq {
  type: number;
  content: string;
}

interface AnalysisDataItem {
  desc: string;
  count: number;
  num: number;
}

export interface SubjectAnalysisRes {
  subjectAnalysisList: {
    subject: string;
    sendCount: number;
    arriveCount: number;
    readCount: number;
    replyCount: number;
    arriveRatio: string;
    readRatio: string;
    replyRatio: string;
  }[];
  contactInfoAnalysisList: {
    /**
     * 0：地区，1：时间，2：设备
     */
    analysisType: 0 | 1 | 2;
    /**
     * 0:回复，1：打开
     */
    emailOpType: 0 | 1;
    analysisDetailList: Array<
      AnalysisDataItem & {
        subList?: Array<AnalysisDataItem>;
      }
    >;
  }[];
}

export interface SendBoxConfReq {
  // 入参：type（0：营销发信成功页，1：营销发信列表页）+公参，新增type=2 （托管营销入口类型）
  type: 0 | 1 | 2 | 3;
}

export interface SendBoxConfRes {
  edmHostingState: number;
  items: {
    desc: string;
    jumpUrl: string;
  }[];
  hostingTaskId: string;
  manualPlan: 0 | 1;
  autoPlanCount?: number; // 用户已有的自动营销托管计划数量
  autoPlanLimit?: number; // 用户允许创建的自动化营销托管计划上限
}

export interface UnsubscribeUrlRes {
  englishUnsubscribeUrl: string;
  chineseUnsubscribeUrl: string;
  subscribeUrl?: string;
}

export interface UnsubscribeUrlModel {
  zh: string;
  en: string;
}
// --- 营销托管任务列表 ---
export interface GetPlanListReq {
  taskId: string;
}

export interface PositionObj {
  positionName: string;
  positionType: number;
}

export interface GetPlanItemRes {
  name: string;
  planId: string;
  receiverCount: number;
  arriveNum: number;
  readNum: number;
  readCount: number;
  replyCount: number;
  contactCount: number;
  /**
   * 0 托管营销，1 自动获客
   */
  planMode: 0 | 1;
  products: string;
  customerLocation: string;
  customerProducts: string;
  status: 0 | 1;
  loopStatus: 0 | 1;
}

export interface GetPlanListRes {
  autoSendLimit: number;
  manualSendLimit: number;
  /**
   * 自动获客白名单
   */
  autoRecAvailable: boolean;
  planList: GetPlanItemRes[];
  positionInfos: PositionObj[];
  sendingDate?: Array<number>;
  timeDuration?: {
    from: number;
    to: number;
  };
}

// --- 发信限制配置 ---
export interface SetTaskSendLimitReq {
  taskId: string;
  autoSendLimit: number;
  manualSendLimit: number;
  positionInfos: PositionObj[];
  sendingDate: Array<number>;
  timeDuration: {
    from: number;
    to: number;
  };
}

// --- 计划开关接口
export interface TaskPlanSwitchReq {
  taskId: string;
  planId: string;
  loopStatus: 1 | 0;
  planStatus: 1 | 0;
}

// --- 多域名营销相关
export interface GetMultiAccountRes {
  accounts: Array<{
    email: string;
    level: number;
    levelDesc: string;
  }>;
}

export interface MultiAccountOverviewReq {
  days: number;
  sources?: WarmUpAccountSource[]; // 0：系统账号 1：客户账号 非必需(不传的话返回所有账号)
}

export interface MultiAccountOverviewRes {
  totalAccounts: number;
  totalSent: number;
  totalReceived: number;
  totalSpam: number;
  totalConversation: number;
}

export interface RewardTaskPopupInfoCount {
  edmDays: number; // 上个任务周期营销天数
  totalSendCount: number; // 上个任务周期发信量
  rewardSendCount: number; // 奖励发送量
}
export interface RewardTaskPopupInfoRes extends RewardTaskPopupInfoCount {
  needPopup: 0 | 1; // 是否要执行弹窗操作，1-是，0-否
  popupType: 0 | 1; // 弹窗类型：0-新任务弹窗，1-奖励达成弹窗
  taskType: string; // 任务类型，对应管理后台
  taskId: string; // 任务中心任务id
  bizTaskId: string; // 业务方任务唯一id
}

// 营销邮件诊断
export interface GetDiagnosisDetailRes {
  diagnosisList: {
    level: 0 | 1;
    problem: string;
    solution: string;
    jumpText: string;
    jumpUrl: string;
  }[];
  singleSubjectSendCountLimit?: number;
  singleEmailSendCountLimit?: number;
  sameDomainLimit?: number;
  suggestSendCount?: number;
  lastPeriodSendCount?: number;
  lastPeriodAccSendCount?: number;
}

export interface GetSummaryInfoResOrigin {
  /**
   * 总览数据和每日数据
   */
  stats: {
    sendCount: number;
    arriveCount: number;
    readCount: number;
    replyCount: number;
    arriveRate: string;
    readRate: string;
    days?: {
      sendCount: number;
      arriveCount: number;
      readCount: number;
      replyCount: number;
      days: null;
    }[];
  };
  /**
   * 营销地址来源
   */
  sourceStats: {
    globalSearchCount: number;
    customsCount: number;
    importCount: number;
    manualCount: number;
  };
  /**
   * 发件地址
   */
  emailStats?: {
    sendCount: number;
    email: string;
    averageSendCount: number;
    maxSendCount: number;
  }[];
  /**
   * 收信相关
   */
  domainStats?: {
    sendCount: number;
    domain: string;
    averageSendCount: number;
    maxSendCount: number;
    sameDomainOverSendTaskCount: number;
  }[];
  /**
   * 内容情况
   */
  taskContentStats?: {
    totalTaskCount: number;
    dynamicTaskCount: number;
    safeTaskCount: number;
    moreThanTenTaskCount: number;
    copyTaskStats: {
      rootEdmEmailId: string;
      subject: string;
      taskCount: number;
      sendCount: number;
    }[];
    templateTaskStats: {
      templateId: string;
      templateName: string;
      taskCount: number;
      sendCount: number;
    }[];
  };
  /**
   * 退信原因占比
   */
  bounceStats?: {
    reason: string;
    count: number;
  }[];
  /**
   * 拒信原因占比
   */
  rejectStats?: {
    reason: string;
    count: number;
  }[];
  /**
   * 域名状态
   */
  domainVerifyStatusList?: {
    domain: string;
    verify: {
      key: string;
      record: string;
      recordType: string;
      verifyStatus: number;
      priority: number;
      realConfig: string;
      recommendConfig: string;
      mx_status: number;
    }[];
  }[];
}

export type GetSummaryDomainRes = {
  domain: string;
  verify: {
    key: string;
    record: string;
    recordType: string;
    verifyStatus: number;
    priority: number;
    realConfig: string;
    recommendConfig: string;
    mx_status: number;
  }[];
}[];

/**
 * 最近任务列表
 */
export interface GetTaskBriefReq {
  /**
   * 最后一次id
   */
  cursor?: string;
  size?: number;
}

export interface GetTaskBriefRes {
  tasks: {
    id: string;
    edmEmailId: string;
    edmSubject: string;
    createTime: string;
    thumbnail: string;
    readRatio?: string;
    replyRatio?: string;
  }[];
}

export type GetSummaryInfoRes = Partial<GetSummaryInfoResOrigin>;

export interface AddHostingClueContactsReq {
  taskId: string;
  crmGroupIds: string[];
  addExistedIntoGroup: boolean;
  contacts: {
    name: string;
    email: string;
    planId: string;
    sourceName: string;
  }[];
}
