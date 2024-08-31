/* eslint-disable camelcase */
import { Api } from '@/api/_base/api';
import { ApiRequestConfig } from '@/api/data/http';

interface FacebookApiRequestConfig extends ApiRequestConfig {
  toastError?: boolean;
}

export interface FacebookApi extends Api {
  getPublicPageBriefList(): Promise<{ pageId: string; pageName: string }[]>;
  getChatList(req: FacebookChatListReq): Promise<FacebookChatListRes>;
  getMessageList(req: FacebookMessageListReq): Promise<FacebookMessageListRes>;
  sendMessage(req: FacebookMessageSendReq): Promise<FacebookMessageSendRes>;
  readMessage(req: FacebookMessageReadReq): Promise<FacebookMessageReadRes>;
  getExpiresAccount(): Promise<FacebookExpiresAccount[]>;
  getAuthorizeUrl(): Promise<AuthorizeUrlRes>;
  getFacebookPagesList(req: { pageName?: string; pageNumber: number; pageSize: number }): Promise<PagesListRes>;
  getBondAccount(req: { pageNumber: number; pageSize: number; sort?: string }): Promise<BoundListRes>;
  getPagesStatistic(): Promise<PagesStatisticRes>;
  checkBindStatus(req: CheckBindStatusReq): Promise<FacebookBindStatusRes>;
  cancelBindAccount(req: FacebookAccountReq): Promise<void>;
  getFacebookPagesList(req: { pageNumber: number; pageSize: number }): Promise<PagesListRes>;
  getPagePostList(req: PagePostListReq): Promise<PagePostListRes>;
  getFbCommentList(req: FbCommentListReq): Promise<FbCommentListRes>;
  getFbChildCommmetList(req: ChildCommentListReq): Promise<ChildCommentListRes>;
  replyPostComments(config?: FacebookApiRequestConfig): Promise<string>;
  unReadCommentCount(req: UnReadCommentCountReq): Promise<string>;
}

export interface FacebookExpiresAccount {
  fbAccountId: string;
  fbAccountName: string;
}

export interface FacebookMessageReadReq {
  contactId: string;
  pageId: string;
  readCount: number;
}

export interface FacebookMessageReadRes {}

export interface FacebookMessageSendReq {
  senderId: string;
  receiverId: string;
  messageType: FacebookMessageType | any;
  messageContent: {
    messageText?: string;
    mediaUrl?: string;
  };
}

export interface FacebookMessageSendRes {
  senderId: string;
  receiverId: string;
  messageId: string;
}

export interface FacebookChatListReq {
  onlyShowUnRead: boolean;
  pageIdList: string;
}

export interface FacebookChatListRes {
  contactList: FacebookChatItem[];
  count: number;
}

export interface FacebookMessageListReq {
  contactId: string;
  latestMsgSeqNo: string;
  latestMsgId: string;
  limit: number;
  pageId: string;
  pullDirection: 'DESC' | 'ASC'; // 消息拉取方向, DESC-向上，ASC-向下
}

export interface FacebookMessageListRes {
  hasMoreMessage: boolean;
  messageList: FacebookMessage[];
}

export interface FacebookChatItem {
  contactAvatar: string;
  contactId: string;
  contactName: string;
  msgUnReadCount: number;
  pageAvatar: string;
  pageId: string;
  pageName: string;
  latestMessageInfo: FacebookMessage;
  latestReceiveMsgTime: string;
}

export enum FacebookMessageDirection {
  LX_TO_FACEBOOK = 0, // 0: 灵犀 -> 客户
  FACEBOOK_TO_LX = 1, // 1: 客户 -> 灵犀
}

export enum FacebookMessageType {
  TEXT = 1,
  AUDIO = 2,
  IMAGE = 3,
  VIDEO = 4,
  DOCUMENT = 5,
}

export enum FacebookMessageTypeName {
  '文本' = 1,
  '音频' = 2,
  '图片' = 3,
  '视频' = 4,
  '文件' = 5,
}

export enum FbBindStatus {
  NO_OPERATE = '未操作绑定',
  BIND_SUCCESS = '绑定成功',
  BIND_FAILED = '绑定失败',
  USER_CANCEL = '用户取消授权',
  NO_ALL_PERMISSIONS = '没有勾选全部权限',
}

export interface FacebookMessage {
  contactAvatar: string;
  contactId: string;
  contactName: string;
  deliveryTime: string;
  messageDeliveryStatus: 0 | 1; // 消息已读状态, 0-未触达, 1-已触达
  messageDirection: FacebookMessageDirection;
  messageId: string;
  messageMediaUrlList: string[] | null;
  messageReadStatus: 0 | 1; // 消息已读状态, 0-未读, 1-已读
  messageSeqNo: string;
  messageText: string;
  messageTime: string;
  messageType: FacebookMessageType;
  pageAvatar: string;
  pageId: string;
  pageName: string;
  quoteMessageId: string;
  readTime: string;
}

export interface AuthorizeUrlRes {
  checkCode: string;
  loginUrl: string;
}

export interface PublicPagesResults {
  belongUserAvatar: string;
  pageNameAvatar: string;
  belongUserId: string;
  belongUserName: string;
  commentsCount: number;
  contactCount: number;
  id: string;
  pageId: string;
  pageName: string;
  pageStatus: string;
  postCount: number;
  remark: string;
  size: number;
  total: number;
}

export interface BoundResults {
  bindStatus: string;
  bindTime: string;
  bindUser: string;
  faAccount: string;
  faAccountPicture: string;
  friendsCount: number;
  id: string;
  pageCount: number;
}
export interface PagesListRes {
  page: number;
  results: Array<PublicPagesResults>;
  size: number;
  total: number;
}

export interface PagesStatisticRes {
  addedContactCount: number;
  publicPageCount: number;
  totalCommentCount: number;
  totalContactCount: number;
  totalPostCount: number;
}

export interface BoundListRes {
  page: number;
  results: Array<BoundResults>;
  size: 0;
  total: 0;
}

export interface FacebookBindStatusRes {
  bindStatus: string;
  isSuccess: boolean;
}

export interface FacebookAccountReq {
  faAccountId: string;
}
export enum FacebookTestEnum {
  A = 0,
  B = 1,
}

export interface FacebookMessage {
  test?: FacebookTestEnum;
}

export interface PagePostItem {
  commentCount: number;
  latestCommentTime: string;
  mediaType: number;
  mediaUrl: string[];
  pageId: string;
  pageName: string;
  postContent: string;
  postId: string;
  createTime: string;
  unReadCommentCount: number;
  publishedName?: string;
}

export interface PagePostListRes {
  results: PagePostItem[];
  page: number;
  size: number;
  total: number;
}

export interface PagePostListReq {
  page: number;
  size: number;
  pageIdList?: string[];
  onlyShowUnreadComment?: boolean;
  postContent?: string;
  sort?: string;
}

export interface FbCommentListReq {
  page: number;
  size: number;
  postId: string;
  sort?: string;
}

export interface FbCommentListRes {
  postInfo: PostInfo;
  results: CommentItem[];
  page: number;
  size: number;
  total: number;
}

export interface PostInfo {
  commentCount: number;
  latestCommentTime: string;
  mediaType: number;
  mediaUrl: string[];
  pageId: string;
  pageName: string;
  postContent: string;
  postId: string;
  publishedName: string;
  createTime: string;
  unReadCommentCount: number;
  publishedAvatar: string;
}

export interface CommentItem {
  childCommentCount: number;
  commentContent: string;
  commentId: string;
  commentTime: string;
  commentator: string;
  commentatorId: string;
  isReply: boolean;
  mediaType: number;
  mediaUrl: string[];
  postId: string;
  parentId?: string;
  commentatorAvatar: string;
  childComments?: CommentItem[];
}

export interface ChildCommentListReq {
  page: number;
  size: number;
  commentId: string;
}

export interface ChildCommentListRes {
  results: ChildCommentItem[];
  page: number;
  size: number;
  total: number;
}

export interface ChildCommentItem {
  commentContent: string;
  commentId: string;
  commentTime: string;
  commentator: string;
  commentatorId: string;
  isReply: boolean;
  mediaType: number;
  mediaUrl: string[];
  parentId: string;
  postId: string;
  childCommentCount: number;
  commentatorAvatar: string;
}

export interface ReplyPostCommentsReq {
  commentId: string;
  mediaType?: number;
  mediaUrl?: string;
  message?: string;
}

export interface UnReadCommentCountReq {
  postId: string;
  readCount: number;
}

export interface CheckBindStatusReq {
  checkCode: string;
}

export interface MainPagesRefs {
  freshMainPages(): void;
}
