/* eslint-disable camelcase */
import { Api } from '@/api/_base/api';
import { ApiRequestConfig } from '@/api/data/http';

export enum SnsMarketingMediaType {
  AUDIO = 'AUDIO',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  FILE = 'FILE',
  GIF = 'GIF',
}

export interface SnsMarketingMedia {
  url: string;
}

export enum SnsMarketingPlatform {
  FACEBOOK = 'FACEBOOK',
  LINKEDIN = 'LINKEDIN',
  INSTAGRAM = 'INSTAGRAM',
}

export const SnsPlatformName: Record<SnsMarketingPlatform, string> = {
  [SnsMarketingPlatform.FACEBOOK]: 'Facebook',
  [SnsMarketingPlatform.LINKEDIN]: 'LinkedIn',
  [SnsMarketingPlatform.INSTAGRAM]: 'Instagram',
};

export enum SnsMarketingAccountType {
  PERSONAL = 'PERSONAL', // 个人账号
  PAGE = 'PAGE', // 主页账号
}

export enum SnsMarketingAuthorizeType {
  PRIVATE = 'PRIVATE', // 用户的个人账号
  ALLOCATION = 'ALLOCATION', // 外贸通分配的账号
}

export interface SnsMarketingAccount {
  id: string;
  accountId: string;
  accountName: string;
  accountType: SnsMarketingAccountType;
  accountAvatar: string;
  accountStatus: SnsAccountAuthorizedStatus;
  authorizeType: SnsMarketingAuthorizeType;
  platform: SnsMarketingPlatform;
  commentCount: number;
  contactCount: number;
  postCount: number;
  oauthTime: string;
  oauthAccountId: string;
  oauthAccountName: string;
}

export enum SnsPostType {
  COMPANY_INFO = 'COMPANY_INFO', // 公司介绍
  PRODUCT_INFO = 'PRODUCT_INFO', // 商品介绍
  INDUSTRY = 'INDUSTRY', // 行业资讯
  CUSTOM = 'CUSTOM', // 自定义
}

export const getSnsPostTypeName: () => Record<SnsPostType, string> = () => {
  return {
    [SnsPostType.COMPANY_INFO]: '公司介绍',
    [SnsPostType.PRODUCT_INFO]: '商品介绍',
    [SnsPostType.INDUSTRY]: '行业资讯',
    [SnsPostType.CUSTOM]: '自定义',
  };
};

export enum SnsPostCreateType {
  AI_TASK = 'AI_TASK', // AI自动化托管任务
  AI_INSTANT = 'AI_INSTANT', // AI立即发送
  AI_CRON = 'AI_CRON', // AI定时发送
  MANUAL_INSTANT = 'MANUAL_INSTANT', // 手动立即发送
  MANUAL_CRON = 'MANUAL_CRON', // 手动定时发送
}

export enum SnsMarketingAiPicStyle {
  commerce = 'commerce',
  fresh = 'fresh',
  warm = 'warm',
}

export const getSnsMarketingAiPicStyleName: () => Record<SnsMarketingAiPicStyle, string> = () => {
  return {
    commerce: '商务风',
    fresh: '清新风',
    warm: '亲和风',
  };
};

export interface SnsMarketingPost {
  postId: string;
  postDbId: string;
  postStatus: SnsPostStatus;
  platform: SnsMarketingPlatform;
  accountId: string;
  accountType: SnsMarketingAccountType;
  authorizeType: SnsMarketingAuthorizeType;
  publishedName: string;
  publishedAvatar: string;
  commentCount: number;
  unReadCommentCount: number;
  createTime: string;
  createType: SnsPostCreateType;
  planSendTime: string;
  type: SnsPostType;
  latestCommentTime: string;
  content: string;
  mediaType?: SnsMarketingMediaType;
  mediaList?: SnsMarketingMedia[];
  failedReason: string;
  aiGenerateParam?: {
    pictureStyle: SnsMarketingAiPicStyle;
    pictureDesc: string;
  };
  translating?: boolean;
  translateResult?: string;
  translateChecked?: boolean;
}

export interface SnsEditPostPayload {
  content?: string;
  cronSend?: boolean;
  mediaType?: SnsMarketingMediaType;
  mediaList?: SnsMarketingMedia[];
  accounts?: (SnsMarketingAccount & { cronTime?: number })[];
}

export enum SnsAccountAuthorizedStatus {
  AUTHORIZED = 'AUTHORIZED', // 已授权
  EXPIRES = 'EXPIRES', // 授权失效
}

export const getSnsAccountAuthorizedStatusName: () => Record<SnsAccountAuthorizedStatus, string> = () => {
  return {
    AUTHORIZED: '已授权',
    EXPIRES: '授权失效',
  };
};

export enum SnsAccountBindingStatus {
  NO_OPERATE = 'NO_OPERATE', // 用户未操作绑定
  BIND_SUCCESS = 'BIND_SUCCESS', // 绑定成功
  BIND_FAILED = 'BIND_FAILED', // 绑定失败
  NO_ALL_PERMISSIONS = 'NO_ALL_PERMISSIONS', // 没有勾选全部权限
  REPEAT_BIND = 'REPEAT_BIND', // 社媒账号已经被其他外贸通账户绑定
  USER_CANCEL = 'USER_CANCEL', // 用户取消绑定
}

export const getSnsAccountBindingStatusName: () => Record<SnsAccountBindingStatus, string> = () => {
  return {
    NO_OPERATE: '用户未操作绑定',
    BIND_SUCCESS: '绑定成功',
    BIND_FAILED: '绑定失败',
    NO_ALL_PERMISSIONS: '没有勾选全部权限',
    REPEAT_BIND: '社媒账号已经被其他外贸通账户绑定',
    USER_CANCEL: '用户取消绑定',
  };
};

export interface SnsBindingAccountsReq {
  order: 'ASC' | 'DESC';
  page: number;
  size: number;
  sortBy?: string;
  status?: string;
  pageName: string;
  platform?: SnsMarketingPlatform;
}

export interface SnsBindingAccountsRes {
  results: SnsMarketingAccount[];
  total: number;
}

export interface SnsBindingAccountsAllReq {
  accountType?: SnsMarketingAccountType;
  pageName?: string;
  platform?: SnsMarketingPlatform;
  status?: SnsAccountAuthorizedStatus;
}

export interface SnsBindingAccountsAllRes {
  accountList: SnsMarketingAccount[];
}

export interface SnsBindingThridLinkReq {
  platform: SnsMarketingPlatform;
  accountType: SnsMarketingAccountType;
}

export interface SnsBindingThridLinkRes {
  checkCode: string;
  loginUrl: string;
}

export interface SnsBindingAccountStatusReq {
  checkCode: string;
}

export interface SnsBindingAccountStatusRes {
  checkCode: string;
  bindStatus: SnsAccountBindingStatus;
}

export interface SnsBindingAccountDetailReq {
  checkCode: string;
  platform: SnsMarketingPlatform;
  accountType: SnsMarketingAccountType;
}

export interface SnsBindingAddAccountReq {
  accountInfos: {
    id: string;
    select: boolean;
    platform: SnsMarketingPlatform;
  }[];
}

export interface SnsBindingDailyQuota {
  dateOfDay: string;
  remainQuota: number;
  totalQuota: number;
}

export interface SnsMarketingUploadInfo {
  bucketName: string;
  context: string;
  fileId: number;
  new: boolean;
  nosKey: string;
  token: string;
}
export interface SnsTaskAiQuota {
  dateOfDay: string;
  remainQuota: number;
  totalQuota: number;
}
export interface SnsMarketingPlan {
  postSendCount: number;
  sendPostPeriod: string;
  startTime: string;
  sendPostRates: Array<{
    desc: string;
    sendPostRate: string;
    platform: SnsMarketingPlatform;
    item: {
      week: number;
      time: string;
    };
  }>;
}
export interface AiOption {
  label: string;
  value: string;
}
export interface AiDefaultParam {
  companyName: string;
  goods: { id: string; name: string }[];
  goodsCount: number;
  industries: Array<AiOption>;
  languages: Array<AiOption>;
  tones: Array<AiOption>;
  companyUrls: string[];
  companyVideoUrls?: string[];
  wordsUpperLimit?: number;
}

export interface SnsAccountInfoShort {
  accountId: string;
  // accountName: string;
  accountType?: SnsMarketingAccountType;
  authorizeType?: SnsMarketingAuthorizeType;
  platform: SnsMarketingPlatform;
  avatar?: string;
}
export interface SnsTaskModel {
  taskId: string;
  taskName: string;
  status: string;
  firstSendTime: number;
  startTime: number;
  endTime: number;
  stage: number;
  createTime: number;
  createById?: string;
  createByName: string;
  accounts: Array<SnsAccountInfoShort>;
  commentCount: number;
  sendPostCount: number;
  alreadySendPostCount: number;
  failedGenPostCount: number;
}

export interface SnsTaskListReq {
  page: number;
  size: number;
  sorts?: Array<{ order: string; sortBy: string }>;
  status?: string;
  taskName?: string;
}

export interface SnsTaskListRes {
  page: number;
  size: number;
  total: number;
  results: SnsTaskModel[];
}

export interface SnsTaskAIParam {
  companyName: string;
  companyProfile: string;
  goods: Array<{ id: string; name: string }>;
  industry: string;
  language: string;
  tone: string;
  companyUrls: string[];
}
export interface SnsTaskCompleteReq {
  taskId: string;
  taskName: string;
  aiGeneratePostParam: SnsTaskAIParam;
  stage: number;
  taskExecPlan: {
    accounts: SnsAccountInfoShort[];
  };
}

export interface SnsSendAiPostReq {
  batchId: string;
  cronSend: boolean;
  cronTime: number;
}

export interface SnsTaskDraft {
  taskId: string;
  taskName: string;
  status: SnsTaskStatus;
  stage: number;
  createTime: number;
  aiGeneratePostParam: SnsTaskAIParam;
  accounts: SnsAccountInfoShort[];
  taskExecPlan: SnsMarketingPlan;
}

export enum SnsTaskStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  FINISH_GENERATE = 'FINISH_GENERATE',
  START = 'START',
  RUNNING = 'RUNNING',
  PAUSE = 'PAUSE',
  FINISH = 'FINISH',
}

export const PostCreateTypeOptions = [
  {
    label: '营销任务',
    value: SnsPostCreateType.AI_TASK,
  },
  // {
  //   label: 'AI立即发送',
  //   value: SnsPostCreateType.AI_INSTANT,
  // },
  // {
  //   label: 'AI定时发送',
  //   value: SnsPostCreateType.AI_CRON,
  // },
  // {
  //   label: '手动立即发送',
  //   value: SnsPostCreateType.MANUAL_INSTANT,
  // },
  // {
  //   label: '手动定时发送',
  //   value: SnsPostCreateType.MANUAL_CRON,
  // },
  {
    label: '手动发帖',
    value: [SnsPostCreateType.AI_INSTANT, SnsPostCreateType.AI_CRON, SnsPostCreateType.MANUAL_INSTANT, SnsPostCreateType.MANUAL_CRON].join(','),
  },
];

export const SnsTaskStatusOptions = [
  {
    value: SnsTaskStatus.DRAFT,
    label: '草稿',
  },
  {
    value: SnsTaskStatus.GENERATING,
    label: '帖子生成中',
  },
  {
    value: SnsTaskStatus.FINISH_GENERATE,
    label: '帖子生成完成',
  },
  // {
  //   value: SnsTaskStatus.START,
  //   label: '任务启动'
  // },
  {
    value: SnsTaskStatus.RUNNING + ',' + SnsTaskStatus.START,
    label: '进行中',
  },
  {
    value: SnsTaskStatus.PAUSE,
    label: '已暂停',
  },
  {
    value: SnsTaskStatus.FINISH,
    label: '已完成',
  },
];
export interface SnsCalendarEvent extends SnsMarketingAccount {
  date: number;
  postDbId: string;
  postContent: string;
  postStatus: SnsPostStatus;
  taskId?: string;
  taskName?: string;
  creator: string;
}

export interface SnsCalendarReq {
  startDate?: number;
  endDate?: number;
  hideStopSendPost?: boolean;
  postCreateType?: SnsPostCreateType;
  taskId?: string;
  accounts?: SnsAccountInfoShort[];
}

export interface SnsCalendarRes {
  taskId?: string;
  taskName?: string;
  calendarList: Array<
    SnsMarketingAccount & {
      creator: string;
      mediaList?: Array<{ url: string }>;
      mediaType: string;
      platform: SnsMarketingPlatform;
      postContent: string;
      postDbId: string;
      postStatus: SnsPostStatus;
      date: number;
      taskId?: string;
      taskName?: string;
    }
  >;
}

export enum SnsPostStatus {
  GENERATING = 'GENERATING', // 'AI生成中',
  FINISH_GENERATE = 'FINISH_GENERATE', // 'AI生成完成',
  FAILED_GENERATE = 'FAILED_GENERATE', // 'AI生成失败',
  WAITING = 'WAITING', // '待发送',
  PENDING = 'PENDING', // '发送中',
  SUCCEED = 'SUCCEED', // '发送成功',
  FAILED = 'FAILED', // '发送失败',
  PAUSE = 'PAUSE', // '暂停发送',
  EXPIRES = 'EXPIRES', // '已过期',
  DELETED = 'DELETED', // '已删除',
}

export const getSnsPostStatusName: () => Record<SnsPostStatus, string> = () => {
  return {
    [SnsPostStatus.GENERATING]: 'AI生成中',
    [SnsPostStatus.FINISH_GENERATE]: 'AI生成完成',
    [SnsPostStatus.FAILED_GENERATE]: 'AI生成失败',
    [SnsPostStatus.WAITING]: '待发送',
    [SnsPostStatus.PENDING]: '发送中',
    [SnsPostStatus.SUCCEED]: '发送成功',
    [SnsPostStatus.FAILED]: '发送失败',
    [SnsPostStatus.PAUSE]: '暂停发送',
    [SnsPostStatus.EXPIRES]: '已过期',
    [SnsPostStatus.DELETED]: '已删除',
  };
};

export interface SnsPostPageListReq {
  accounts: SnsMarketingAccount[];
  page: number;
  size: number;
  order: 'ASC' | 'DESC';
  sortBy: string;
  postContent?: string;
  postStatus?: SnsPostStatus;
  onlyShowUnreadComment: boolean;
}

export interface SnsPostPageListRes {
  results: SnsMarketingPost[];
  total: number;
}

export interface SnsPostComment {
  commentDbId: string;
  commentId: string;
  commentator: string;
  commentatorId: string;
  commentatorAvatar: string;
  commentContent: string;
  createTime: string;
  isReply: boolean;
  mediaList: SnsMarketingMedia[];
  mediaType: SnsMarketingMediaType;
  postId: string;
}

export type SnsPostCommentType = 'parent' | 'child';

export interface SnsPostChildComment extends SnsPostComment {
  parentId: string;
}

export interface SnsPostParentComment extends SnsPostComment {
  childCommentCount: number;
  childComments: SnsPostChildComment[];
  originCommentId: string;
}

export interface SnsPostCommentsReq {
  page: number;
  size: number;
  postId: string;
  order: 'ASC' | 'DESC' | '';
  sortBy: string;
  platform: SnsMarketingPlatform;
}

export interface SnsPostCommentsRes {
  postInfo: SnsMarketingPost;
  results: SnsPostParentComment[];
  total: number;
}

export interface SnsPostChildCommentsReq {
  commentId: string;
  postId: string;
  page: number;
  size: number;
  order: 'ASC' | 'DESC' | '';
  sortBy: string;
}

export interface SnsPostChildCommentsRes {
  results: SnsPostChildComment[];
  total: number;
}

export interface SnsSendPostCommentReq {
  postId: string;
  postDbId: string;
  accountId: string;
  accountType: SnsMarketingAccountType;
  authorizeType: SnsMarketingAuthorizeType;
  platform: SnsMarketingPlatform;
  commentId: string;
  originCommentId: string;
  content: string;
  mediaList: SnsMarketingMedia[];
  mediaType?: SnsMarketingMediaType;
}

export interface SnsUpdateCommentUnReadCountReq {
  platform: SnsMarketingPlatform;
  postId: string;
  readCount: number;
}
export interface SnsTaskPreSendReq {
  accounts: SnsAccountInfoShort[];
  companyName: string;
  companyProfile: string;
  industry: string;
  language: string;
  tone: string;
  taskId: string;
  goods: Array<{
    id: string;
    name: string;
  }>;
  wordsUpperLimit?: number;
  companyUrls: string[];
  companyVideoUrls: string[];
}

export type SnsTaskRetryMessageType = 'PRE_HOSTING' | 'HOSTING' | 'DIRECT_GENERATE';

export interface SnsRetryAiPostTaskReq {
  taskId: string;
  messageType: SnsTaskRetryMessageType;
}

export interface SnsMarketingChatListReq {
  accounts: SnsAccountInfoShort[];
  dialogId?: string;
  limit: number;
  onlyShowUnRead: boolean;
  pullDirection: 'EARLIER' | 'NEWER';
}

export interface SnsMarketingChat {
  dialogId: string;
  accountAvatar: string;
  accountId: string;
  accountName: string;
  accountType: SnsMarketingAccountType;
  contactAvatar: string;
  contactId: string;
  contactName: string;
  latestMsgInfo: SnsMarketingMessage;
  latestMsgTime: number;
  latestReceiveMsgTime: number;
  msgUnReadCount: 0;
  platform: SnsMarketingPlatform;
}

export interface SnsMarketingChatListRes {
  contactList: SnsMarketingChat[];
  count: number;
  hasMoreDialog: boolean;
  unReadMsgCount: number;
}

export enum SnsMarketingMessageDirection {
  OUT = 'OUT',
  IN = 'IN',
}

export interface SnsMarketingMessage {
  dialogId: string;
  direction: SnsMarketingMessageDirection;
  messageId: string;
  messageDbId: string;
  messageSeqNo: string;
  messageText: string;
  messageTime: number;
  messageRead: true;
  messageDelivery: true;
  mediaType: SnsMarketingMediaType;
  mediaList: SnsMarketingMedia[];
  readTime: number;
  deliveryTime: number;
  quoteMessageId: string;
}

export interface SnsMarketingMessageListReq {
  dialogId: string;
  limit: number;
  pullDirection: 'EARLIER' | 'NEWER';
  latestMsgId: string;
  latestMsgSeqNo: string;
}

export interface SnsMarketingMessageListRes {
  messageList: SnsMarketingMessage[];
  hasMoreMessage: boolean;
}

export interface SnsMarketingSendMessageReq {
  dialogId: string;
  content?: string;
  mediaType?: SnsMarketingMediaType;
  mediaUrls?: string[];
  platform: SnsMarketingPlatform;
  senderId: string;
  senderAccountType: SnsMarketingAccountType;
  receiverId: string;
}

export interface SnsMarketingSendMessageRes {
  messageId: string;
  senderId: string;
  receiverId: string;
}

export interface SnsMarketingReadMessageReq {
  dialogId: string;
  readMsgCount: number;
}

export interface SnsMarketingChatListByIdsReq {
  dialogIds: string[];
  accounts: SnsMarketingAccount[];
  onlyShowUnRead: boolean;
}

export interface SnsMarketingChatListByIdsRes {
  contactList: SnsMarketingChat[];
  count: number;
  hasMoreDialog: boolean;
  unReadMsgCount: number;
}

export interface SnsMarketingReplaceImageReq {
  postDbId: string;
  content?: string;
  picGenerateReq: {
    pictureStyle: SnsMarketingAiPicStyle;
    pictureDesc: string;
  };
}

export interface SnsRefineContentReq {
  original: string;
  tone: string;
  language: string;
}

export interface SnsHelpDocsRes {
  helpDocs: {
    type: string;
    url: string;
  }[];
}

export namespace SnsMarketingState {
  export interface TaskPostStateReq {
    order: string;
    page: number;
    size: number;
    sortBy: string;
    taskId: string;
  }

  export interface TaskPostStateItem {
    accountId: string;
    accountType: SnsMarketingAccountType;
    aiGenerateParam: any;
    authorizeType: SnsMarketingAuthorizeType;
    commentCount: string;
    content: string;
    createTime: string;
    createType: SnsPostCreateType;
    engagementCount: string;
    failedReason: string;
    impressionCount: string;
    latestCommentTime: string;
    likeCount: string;
    mediaList: Array<{ fileName: string; fileSize: string; url: string }>;
    mediaType: string;
    planSendTime: string;
    platform: SnsMarketingPlatform;
    postDbId: string;
    postId: string;
    postStatus: SnsPostStatus;
    publishedAvatar: string;
    publishedName: string;
    shareCount: string;
    type: SnsPostType;
    unReadCommentCount: number;
    uniqueImpressionCount: string;
    wmCreator: string;
  }

  export interface TaskPostStateRes {
    results: TaskPostStateItem[];
    total: number;
  }

  export interface TaskStateRes {
    accounts: Array<{
      accountId: string;
      accountType: SnsMarketingAccountType;
      authorizeType: SnsMarketingAuthorizeType;
      avatar: string;
      platform: SnsMarketingPlatform;
    }>;
    commentCount: string;
    companyProfile: string;
    createTime: string;
    creatorName: string;
    endTime: string;
    engagementCount: string;
    firstSendPostTime: string;
    goods: Array<{ id: string; name: string }>;
    impressionCount: string;
    industry: string;
    likeCount: string;
    planSendPostCount: string;
    sendPostCount: string;
    shareCount: string;
    startTime: string;
    status: SnsTaskStatus;
    taskId: string;
    taskName: string;
    uniqueImpressionCount: string;
  }

  export interface PostStateReq {
    isRealTime: boolean;
    postDbId: string;
  }

  export interface PostStateRes {
    commentCount: number;
    engagementCount: number;
    impressionCount: number;
    likeCount: number;
    postDbId: number;
    postId: number;
    shareCount: number;
    uniqueImpressionCount: number;
    savedCount: number;
  }
}

export namespace SnsDataAnalysis {
  export interface AllBindingAccountReq {
    accountType?: SnsMarketingAccountType;
    pageName?: string;
    platform?: SnsMarketingPlatform;
    status?: SnsAccountAuthorizedStatus;
  }

  export interface AllBindingAccountRes {
    accountList: SnsMarketingAccount[];
  }

  export interface HotPostReq {
    accountId?: string;
    accountType?: SnsMarketingAccountType;
    authorizeType?: SnsMarketingAuthorizeType;
    endTime?: string;
    platform?: SnsMarketingPlatform;
    sortField?: string;
    startTime?: string;
  }

  export interface HotPost {
    accountId: string;
    accountType: SnsMarketingAccountType;
    aiGenerateParam: any;
    authorizeType: SnsMarketingAuthorizeType;
    commentCount: string;
    content: string;
    createTime: string;
    createType: SnsPostCreateType;
    engagementCount: string;
    failedReason: string;
    impressionCount: string;
    latestCommentTime: string;
    likeCount: string;
    mediaList: Array<{ fileName: string; fileSize: string; url: string }>;
    mediaType: string;
    planSendTime: string;
    platform: SnsMarketingPlatform;
    postDbId: string;
    postId: string;
    postStatus: SnsPostStatus;
    publishedAvatar: string;
    publishedName: string;
    shareCount: string;
    type: SnsPostType;
    unReadCommentCount: number;
    uniqueImpressionCount: string;
    wmCreator: string;
  }

  export interface HotPostRes {
    hotPosts: HotPost[];
  }

  export interface MediaStateReq {
    accountId?: string;
    accountType?: SnsMarketingAccountType;
    authorizeType?: SnsMarketingAuthorizeType;
    endTime?: string;
    platform?: SnsMarketingPlatform;
    startTime?: string;
  }

  export interface MediaOverviewData {
    fansCount: string;
    fansDiffCount: string;
    postCommentCount: string;
    postSentCount: string;
    socialMediaCount: string;
  }

  export interface ChartData {
    dateOfDay: string;
    count: string;
  }

  export interface MediaStateRes {
    dataScreen: MediaOverviewData;
    fansCountTrends: ChartData[];
    fansDiffCountTrends: ChartData[];
    postCommentCountTrends: ChartData[];
    postSendCountTrends: ChartData[];
  }
}

export interface SnsMarketingApi extends Api {
  getSnsBindingAccounts(req: SnsBindingAccountsReq): Promise<SnsBindingAccountsRes>;
  getSnsBindingAccountsAll(req: SnsBindingAccountsAllReq): Promise<SnsBindingAccountsAllRes>;
  getSnsBindingThridLink(req: SnsBindingThridLinkReq): Promise<SnsBindingThridLinkRes>;
  getSnsBindingAccountStatus(req: SnsBindingAccountStatusReq): Promise<SnsBindingAccountStatusRes>;
  getSnsBindingAccountDetail(req: SnsBindingAccountDetailReq): Promise<SnsMarketingAccount[]>;
  addSnsBindingAccount(req: SnsBindingAddAccountReq): Promise<void>;
  cancelSnsBindingAccount(req: { id: string }): Promise<void>;
  deleteSnsBindingAccount(req: { id: string }): Promise<void>;
  getUploadToken(req: { fileName: string }): Promise<SnsMarketingUploadInfo>;
  getDownloadUrl(req: { fileName: string; nosKey: string }): Promise<string>;
  createAiPostTask(req: Record<string, any>): Promise<{ batchId: string }>;
  retryAiPostTask(req: SnsRetryAiPostTaskReq): Promise<void>;
  getAiTaskPosts(req: { taskId: string }): Promise<SnsMarketingPost[]>;
  sendAiPost(req: SnsSendAiPostReq): Promise<void>;
  sendManualPost(req: SnsEditPostPayload): Promise<void>;
  getSnsPost(req: { postDbId: string }): Promise<SnsMarketingPost>;
  updateSnsPost(req: SnsMarketingPost): Promise<void>;
  getSnsPostPageList(req: SnsPostPageListReq): Promise<SnsPostPageListRes>;
  getSnsPostComments(req: SnsPostCommentsReq): Promise<SnsPostCommentsRes>;
  getSnsPostChildComments(req: SnsPostChildCommentsReq): Promise<SnsPostChildCommentsRes>;
  sendSnsPostComment(req: SnsSendPostCommentReq): Promise<void>;
  updateCommentUnReadCount(req: SnsUpdateCommentUnReadCountReq): Promise<void>;
  deleteSnsPost(req: { postDbId: string }): Promise<void>;
  getReplaceContent(req: { postDbId: string }, config?: ApiRequestConfig): Promise<{ contents: string[] }>;
  getRefineContent(req: SnsRefineContentReq, config?: ApiRequestConfig): Promise<{ contents: string[] }>;
  getReplaceImage(req: SnsMarketingReplaceImageReq, config?: ApiRequestConfig): Promise<{ mediaList: SnsMarketingMedia[] }>;
  getChatList(req: SnsMarketingChatListReq): Promise<SnsMarketingChatListRes>;
  getMessageList(req: SnsMarketingMessageListReq): Promise<SnsMarketingMessageListRes>;
  sendMessage(req: SnsMarketingSendMessageReq): Promise<SnsMarketingSendMessageRes>;
  readMessage(req: SnsMarketingReadMessageReq): Promise<void>;
  getChatListByIds(req: SnsMarketingChatListByIdsReq): Promise<SnsMarketingChatListByIdsRes>;
  getSnsHelpDocs(req: { platform: SnsMarketingPlatform }): Promise<SnsHelpDocsRes>;

  getSnsBindingDailyQuota(): Promise<SnsBindingDailyQuota>;
  getSnsTaskQuota(): Promise<SnsTaskAiQuota>;
  getSnsTaskAiParam(): Promise<AiDefaultParam>;
  createSnsTask(): Promise<{ taskId: string; taskName: string }>;
  completeSnsTask(req: SnsTaskCompleteReq): Promise<{ taskId: string; taskName: string }>;
  getDefaultPlan(req: { accounts: Array<Partial<SnsMarketingAccount>> }): Promise<SnsMarketingPlan>;
  getSnsTaskList(req: SnsTaskListReq): Promise<SnsTaskListRes>;
  getSnsCalendar(req: SnsCalendarReq): Promise<SnsCalendarRes>;

  getSnsTaskDetail(id: string): Promise<SnsTaskDraft>;
  saveSnsTask(req: Partial<SnsTaskCompleteReq>): Promise<boolean>;
  tryCreatePostForSnsTask(req: SnsTaskPreSendReq): Promise<{ batchId: string }>;
  createPostsForSnsTask(req: SnsTaskPreSendReq): Promise<{ batchId: string }>;
  enableSnsTask(taskId: string): Promise<boolean>;
  delSnsTask(taskId: string): Promise<boolean>;
  pauseSnsTask(taskId: string): Promise<boolean>;
  copySnsTask(req: { taskId: string }): Promise<SnsTaskDraft>;

  getTaskState(taskId: string): Promise<SnsMarketingState.TaskStateRes>;
  getTaskPostState(req: SnsMarketingState.TaskPostStateReq): Promise<SnsMarketingState.TaskPostStateRes>;
  getPostState(req: SnsMarketingState.PostStateReq): Promise<SnsMarketingState.PostStateRes>;

  getAllBindingAccount(req: SnsDataAnalysis.AllBindingAccountReq): Promise<SnsDataAnalysis.AllBindingAccountRes>;
  getHotPosts(req: SnsDataAnalysis.HotPostReq): Promise<SnsDataAnalysis.HotPostRes>;
  getMediaState(req: SnsDataAnalysis.MediaStateReq): Promise<SnsDataAnalysis.MediaStateRes>;
}
