import { EventEmitter } from 'events';
import { Api } from '../_base/api';
import { StringMap } from '../commonModel';
import { NimInterceptorApi } from './im_plugins';
import { ImTeamManager } from '@/impl/logical/im/im_team';
import {
  CurrentSessionInterface,
  IM_STREAM,
  IMTeamInterface,
  IMUserInterface,
  MyinfoInterface,
  NotifyCountInterface,
  P2PMuteInterface,
  SessionInterface,
  SessionLaterInterface,
  IMCacheInterface,
} from './im_stream';
import { FetchAccountByEmailApiRet } from '@/api/logical/account';

export type NIMConnectStatus = 'connected' | 'unconnect';

export const emojiTypeNameMap = (function (arr: string[][]) {
  const map: StringMap = {};
  arr.forEach(it => {
    map[it[1]] = it[0];
  });
  return map;
})([
  ['[微笑]', '1'],
  ['[大笑]', '2'],
  ['[+1]', '3'],
  ['[惊讶]', '4'],
  ['[666]', '5'],
  ['[得意]', '6'],
  ['[生气]', '7'],
  ['[怕怕]', '8'],
  ['[尴尬]', '9'],
  ['[难过]', '10'],
  ['[done]', '11'],
  ['[失望]', '12'],
  ['[呲牙]', '14'],
  ['[色]', '16'],
  ['[流汗]', '17'],
  ['[痴笑]', '18'],
  ['[困]', '19'],
  ['[吐]', '20'],
  ['[疑问]', '21'],
  ['[嘘]', '22'],
  ['[敲打]', '23'],
  ['[闭嘴]', '24'],
  ['[色眯眯]', '26'],
  ['[可爱]', '28'],
  ['[耶]', '29'],
  ['[鄙视]', '31'],
  ['[晕]', '34'],
  ['[抠鼻]', '35'],
  ['[撒娇]', '36'],
  ['[鼓掌]', '37'],
  ['[害羞]', '38'],
  ['[抽烟]', '39'],
  ['[欠揍]', '40'],
  ['[飞吻]', '41'],
  ['[工作忙]', '42'],
  ['[哭泣]', '43'],
  ['[偷笑]', '44'],
  ['[送花]', '45'],
  ['[亲一个]', '46'],
  ['[再见]', '48'],
  ['[飘飘]', '49'],
  ['[秀一下]', '50'],
  ['[囧]', '52'],
  ['[抓狂]', '53'],
  ['[发怒]', '56'],
  ['[傲慢]', '57'],
  ['[玫瑰]', '60'],
  ['[爱心]', '61'],
  ['[心碎]', '62'],
  ['[嘴唇]', '63'],
  ['[踩]', '64'],
  ['[赞]', '65'],
  ['[握手]', '66'],
  ['[刀]', '70'],
  ['[炸弹]', '71'],
  ['[灵感]', '72'],
  ['[叹气]', '94'],
  ['[亲亲]', '95'],
  ['[耍酷]', '96'],
  ['[摸摸]', '97'],
  ['[睫毛弯弯]', '98'],
  ['[发呆]', '100'],
  ['[睡]', '101'],
  ['[大哭]', '102'],
  ['[吐舌]', '103'],
  ['[白眼]', '104'],
  ['[奋斗]', '105'],
  ['[咒骂]', '106'],
  ['[衰]', '107'],
  ['[骷髅]', '108'],
  ['[擦汗]', '109'],
  ['[坏笑]', '110'],
  ['[左哼哼]', '111'],
  ['[右哼哼]', '112'],
  ['[哈欠]', '113'],
  ['[委屈]', '114'],
  ['[快哭了]', '115'],
  ['[阴险]', '116'],
  ['[可怜]', '117'],
  ['[拥抱]', '118'],
  ['[蛋糕]', '119'],
  ['[猪头]', '120'],
  ['[抱拳]', '121'],
  ['[强壮]', '122'],
  ['[OK]', '123'],
  ['[生病]', '124'],
  ['[破涕为笑]', '125'],
  ['[脸红]', '126'],
  ['[恐惧]', '127'],
  ['[嘿哈]', '128'],
  ['[捂脸哭]', '129'],
  ['[奸笑]', '130'],
  ['[机智]', '131'],
  ['[皱眉]', '132'],
  ['[吃瓜]', '133'],
  ['[天啊]', '134'],
  ['[社会社会]', '135'],
  ['[旺柴]', '136'],
  ['[好的]', '137'],
  ['[打脸]', '138'],
  ['[惊喜]', '139'],
  ['[幽灵]', '140'],
  ['[合十]', '141'],
  ['[钱]', '142'],
  ['[戳脸]', '143'],
  ['[思考]', '144'],
  ['[送花花]', '145'],
  ['[yes]', '150'],
  ['[no]', '151'],
  ['[ok]', '152'],
  ['[get]', '153'],
]);

export interface NIMInitOptions {
  /**
   * 在云信管理后台查看应用的 appKey
   */
  appKey: string;
  /**
   * 账号, 应用内唯一
   */
  account: string;
  /**
   * 账号的 token, 用于建立连接
   */
  token: string;
  /**
   * 是否开启调试
   */
  debug?: boolean;
  /**
   * 是否对日志做额外的处理
   */
  logFunc?: () => void;
  /**
   * secure模式下会通过 https 协议跟服务器建立连接,
   * 非secure模式下会通过 http 协议跟服务器建立连接, 默认 true
   */
  secure?: boolean;

  /**
   * nos文件存储全局配置，存储场景，实例有效，默认im
   */
  nosScenes?: string;
  /**
   * nos文件存储全局配置，存储有效时间，实例有效，默认Infinity 不得小于一天，单位秒
   */
  nosSurvivalTime?: number;
  /**
   * 是否同步好友列表, 默认true. 如果传false就收不到onfriends回调
   */
  syncFriends?: boolean;
  /**
   * 是否同步好友对应的用户名片列表, 默认true, 如果传false就收不到onusers回调.
   */
  syncFriendUsers?: boolean;
  /**
   * 是否同步群列表
   * 默认true. 如果传false就收不到群列表, 即不会收到onteams回调, 开发者后续可以调用获取群列表来获取群列表.
   */
  syncTeams?: boolean;
  /**
   * 是否同步额外的群信息, 默认true会同步额外的群信息, 目前包括
   * 当前登录用户是否开启某个群的消息提醒 (SDK 只是存储了此信息, 具体用此信息来做什么事情完全由开发者控制)
   * 调用接口NIM#updateInfoInTeam来关闭/开启某个群的消息提醒
   * 调用接口NIM#notifyForNewTeamMsg来查询是否需要群消息通知
   */
  syncExtraTeamInfo?: boolean;
  /**
   * 是否同步群成员, 默认true.
   * 只有在syncTeams=true的时候才起作用, 如果传false就不会同步群成员,
   * 即不会收到onteammembers和onsyncteammembersdone回调, 开发者后续可以调用获取群成员来获取群成员.
   */
  syncTeamMembers?: boolean;
  /**
   * 是否同步会话的未读数, 默认不同步
   * 如果选择同步
   * 那么在一个端读过的会话在其它端也会被标记为已读
   * 在调用NIM#setCurrSession的时候 SDK 会自动同步一次未读数, 此后如果收到当前会话的消息, 需要手动调用NIM#resetSessionUnread来同步未读数
   */
  syncSessionUnread?: boolean;
  /**
   * 是否同步漫游消息, 默认true. 如果传false就收不到漫游消息, 即不会收到onroamingmsgs回调.
   */
  syncRoamingMsgs?: boolean;
  /**
   * 是否同步已读回执时间戳, 默认true. 如果传false就收不到已读回执时间戳.
   */
  syncMsgReceipts?: boolean;
  /**
   * 是否自动标记消息为已收到
   */
  autoMarkRead?: boolean;
  /**
   * 是否使用数据库
   */
  db?: boolean;
}

// 快捷回复
export interface IMQuickComment {
  from: string;
  body: number;
  time: number;
  custom: string;
  needPush: boolean;
  needBadge: boolean;
  pushTitle: string;
  apnsText: string;
  pushPayload: string;
}

export interface IMQuickComment {
  from: string;
  body: number;
  time: number;
  custom: string;
  needPush: boolean;
  needBadge: boolean;
  pushTitle: string;
  apnsText: string;
  pushPayload: string;
}

export interface NIMEventOptions {
  /**
   * 连接建立后的回调, 会传入一个对象, 包含登录的信息
   * @param loginInfo
   */
  onconnect?: (loginInfo: LoginInfo) => void;
  /**
   * 即将重连的回调
   * @param willreConnectInfo
   */
  onwillreconnect?: (willreConnectInfo?: WillreConnectInfo) => void;
  /**
   * 断开连接后的回调
   * @param error
   */
  ondisconnect?: (error?: DisconnectError) => void;
  /**
   * 发生错误的回调, 会传入错误对象
   * @param error
   */
  onerror?: (error?: Error) => void;
  /**
   * 多端登录状态变化的回调, 会收到登录端列表
   * @param loginPort
   */
  onloginportschange?: (loginPort?: LoginPort[]) => void;
  /**
   * 当前登录用户在其它端加入黑名单/从黑名单移除后的回调
   * @param syncMarkInBlacklistInfo
   */
  onsyncmarkinblacklist?: (syncMarkInBlacklistInfo?: SyncMarkInBlacklistInfo) => void;
  /**
   * 同步静音列表的回调, 会传入静音列表mutelist
   * @param mutelist
   */
  onmutelist?: (mutelist: any) => void;
  /**
   * 当前登录用户在其它端加入静音列表/从静音列表移除后的回调, 会传入一个参数, 包含两个字段
   * @param syncMarkInMutelistInfo
   */
  onsyncmarkinmutelist?: (syncMarkInMutelistInfo: SyncMarkInMutelistInfo) => void;

  /**
   * 同步好友列表的回调, 会传入好友列表
   * @param friends
   */
  onfriends?: (friends: any) => void;
  /**
   * 当前登录用户在其它端进行好友相关的操作后的回调
   * @param syncfriendActionInfo
   */
  onsyncfriendaction?: (syncfriendActionInfo: SyncfriendActionInfo) => void;
  /**
   * 同步登录用户名片的回调, 会传入用户名片
   * @param userInfo
   */
  onmyinfo?: (user: IMUser) => void;
  /**
   *  当前登录用户在其它端修改自己的个人名片之后的回调, 会传入用户名片
   * @param userInfo
   */
  onupdatemyinfo?: (user: IMUser) => void;

  /**
   * 同步好友用户名片的回调, 会传入用户名片数组
   * @param usersInfo
   */
  onusers?: (users: IMUser[]) => void;
  /**
   * 用户名片更新后的回调, 会传入用户名片
   * @param userInfo
   */
  onupdateuser?: (user: IMUser) => void;

  /**
   * 同步群列表的回调, 会传入群数组teams
   * teams的属性invalid包含退出的群
   */
  onteams?: (teams: Team[]) => void;
  /**
   * 当前登录用户在其它端创建群后的回调, 会传入群对象
   */
  onsynccreateteam?: (team: Team) => void;

  /**
   * 同步群成员的回调, 一个群对应一个回调, 会传入群成员数组
   */
  onteammembers?: (teams: Team[]) => void;
  /*
   * 当syncTeams和syncTeamMembers同时为true时, 会同步所有群的群成员,
   *  当所有群的群成员同步结束时, 会调用此回调
   */
  onsyncteammembersdone?: () => void;
  /**
   * 群成员信息更新后的回调, 会传入群成员对象,不过此时的信息是不完整的, 只会包括被更新的字段。
   * 当前登录账号在其它端修改自己在群里面的昵称时也会收到此回调。
   */
  onupdateteammember?: (teamMember: TeamMember) => void;
  /**
   * 创建群的回调, 此方法接收一个参数, 包含群信息和群主信息
   * @param team
   */
  onCreateTeam?: (team: Team) => void;
  /**
   * 更新群的回调, 此方法接收一个参数, 更新后的群信息
   * @param team
   */
  onUpdateTeam?: (team: Team) => void;
  /**
   * 新成员入群的回调, 此方法接收一个参数, 包含群信息和群成员信息
   * @param obj
   */
  onAddTeamMembers?: (obj: any) => void;
  /**
   * 有人出群的回调, 此方法接收一个参数, 包含群信息和群成员账号
   * @param obj
   */
  onRemoveTeamMembers?: (obj: any) => void;
  /**
   * 更新群管理员的回调, 此方法接收一个参数, 包含群信息和管理员信息
   * @param obj
   */
  onUpdateTeamManagers?: (obj: any) => void;
  /**
   * 解散群的回调, 此方法接收一个参数, 包含被解散的群id
   * @param obj
   */
  onDismissTeam?: (obj: any) => void;
  /**
   * 移交群的回调, 此方法接收一个参数, 包含群信息和新老群主信息
   * @param obj
   */
  onTransferTeam?: (obj: any) => void;
  /**
   * 更新群成员禁言状态的回调, 此方法接收一个参数, 包含群信息和禁言状态信息
   * @param obj
   */
  onUpdateTeamMembersMute?: (obj: any) => void;

  /**
   * 同步最近会话列表回调, 会传入会话列表, 按时间正序排列, 即最近聊过天的放在列表的最后面。
   * @param sessions
   */
  onsessions?: (sessions: Session[]) => void;
  /**
   * 更新会话的回调, 会传入会话, 以下情况会收到此回调
   * 收到消息
   * 发送消息
   * 设置当前会话
   * 重置会话未读数
   * @param sessions
   */
  onupdatesession?: (sessions: Session[]) => void;
  /**
   * 是否要忽略某条通知类消息, 该方法会接收一个消息对象, 如果该方法返回 true, 那么 SDK 将忽略此条通知类消息
   * @param message
   */
  shouldIgnoreNotification?: (message: any) => boolean;
  /**
   * 是否群通知消息记未读
   */
  shouldCountTeamNotifyUnread?: () => void;

  /**
   * 同步漫游消息的回调, 每个会话对应一个回调, 会传入消息数组
   * @param messages
   */
  onroamingmsgs?: (messages: IMMessage[]) => void;
  /**
   * 同步离线消息的回调, 每个会话对应一个回调, 会传入消息数组
   * @param messages
   */
  onofflinemsgs?: (messages: IMMessage[]) => void;
  /**
   * 收到消息的回调, 会传入消息对象
   * 当前登录账号在其它端发送消息之后也会收到此回调, 注意此时消息对象的from字段就是当前登录的账号
   * @param message
   */
  onmsg?: (message: IMMessage) => void;

  /**
   * 同步离线系统通知的回调, 会传入系统通知数组
   * @param systemMessage
   */
  onofflinesysmsgs?: (systemMessages: SystemMessage[]) => void;
  /**
   * 同步漫游系统通知的回调, 会传入系统通知数组
   * @param systemMessage
   */
  onroamingsysmsgs?: (systemMessages: SystemMessage[]) => void;
  /**
   * 收到系统通知的回调, 会传入系统通知
   * @param systemMessage
   */
  onsysmsg?: (systemMessage: SystemMessage) => void;
  /**
   * 更新系统通知后的回调, 会传入系统通知
   * 以下情况会收到此回调
   * 通过好友申请
   * 拒绝好友申请
   * 接受入群邀请
   * 拒绝入群邀请
   * 通过入群申请
   * 拒绝入群申请
   * 这些操作的发起方会收到此回调, 接收被更新的系统通知, 根据操作的类型系统通知会被更新为下面两种状态
   * 'passed': 已通过
   * 'rejected': 已拒绝
   * @param systemMessage
   */
  onupdatesysmsg?: (systemMessage: SystemMessage) => void;
  /**
   * 收到系统通知未读数的回调
   * @param unread
   */
  onsysmsgunread?: (unread: Unread) => void;
  /**
   * 更新系统通知未读数的回调
   * @param unread
   */
  onupdatesysmsgunread?: (unread: Unread) => void;
  /**
   * 同步离线自定义系统通知的回调, 会传入系统通知数组
   * @param systemMessages
   */
  onofflinecustomsysmsgs?: (systemMessages: SystemMessage[]) => void;
  /**
   * 收到自定义系统通知的回调, 会传入系统通知
   * @param systemMessage
   */
  oncustomsysmsg?: (systemMessage: SystemMessage) => void;
  /**
   * 当上面各个同步（不包括下面的同步群成员）完成后, 会调用此回调；
   * 注意, SDK保证在onsyncdone调用的时候上面的同步肯定完成了, 但是不保证各个同步回调的顺序。
   */
  onsyncdone?: () => void;

  onQuickComment?: (msg: IMMessage, comment: IMQuickComment) => void;

  onDeleteQuickComment?: (msg: IMMessage, comment: IMQuickComment) => void;
}

export interface LoginInfo {
  lastLoginDeviceId: string; // 上次登录的设备的设备号
  customTag: string; // 客户端自定义tag,登录时多端同步改字段，最大32个字符
  connectionId: string; // 本次登录的连接号
  ip: string; // 客户端IP
  port: number; // 客户端端口
  country: string; // 本次登录的国家
}

export interface LoginPort {
  type: string; // 登录的设备类型
  os: string; // 登录设备的操作系统
  mac: string; // 登录设备的 mac 地址
  deviceId: string; // 登录设备ID, uuid
  account: string; // 登录的账号
  connectionId: string; // 登录设备的连接号
  ip: string; // 登录的服务器 IP
  time: number; // 登录时间
  online: boolean; // 是否在线
}

/**
 * 重连回调信息
 */
export interface WillreConnectInfo {
  duration: number; // 距离下次重连的时间
  retryCount: number; // 重连尝试的次数
}

export interface SyncMarkInfo {
  account: string;
  isAdd: boolean;
}

export type SyncMarkInBlacklistInfo = SyncMarkInfo;

export type SyncMarkInMutelistInfo = SyncMarkInfo;

export interface DisconnectError {
  code: number | string | undefined; //  出错时的错误码, 可能为空
}

export interface Friend {
  account: string;
  alias: string;
  custom: string;
  createTime: number;
  updateTime: number;
}

export interface SyncfriendActionInfo {
  type: string;
  account?: string;
  friend?: Friend;
  ps?: string;
}

export interface IMUser {
  account: string;
  nick: string;
  avatar: string;
  sign: string;
  gender: string;
  email: string;
  birth: string;
  tel: string;
  custom: string;
  createTime: number;
  updateTime: number;
  color: string;
  pinyinname: string;
  // 使用这个字段替换通讯录返回的pinyinname
  pinyin: string;
  isMe?: boolean;
  isYunxin?: boolean;
  status?: number;
  contactId?: string;
}

export interface Team {
  teamId: string; // 群Id
  type: string; // 群类型
  name: string; // 群名字
  customTeamName: string; // 自定义群名
  avatar: string; // 群头像
  intro: string; // 群简介
  announcement: string; // 群公告
  joinMode: string; // 群加入方式, 仅限高级群
  beInviteMode: string; // 群被邀请模式, 仅限高级群
  inviteMode: string; // 群邀请模式, 仅限高级群
  updateTeamMode: string; // 群信息修改权限, 仅限高级群
  updateCustomMode: string; // 群信息自定义字段修改权限, 仅限高级群
  owner: string; // 群主
  level: number; // 群人数上限
  memberNum: number; // 群成员数量
  memberUpdateTime: number; // 群成员最后更新时间
  createTime: number; // 群创建时间
  updateTime: number; // 群最后更新时间
  custom: string; // 第三方扩展字段, 开发者可以自行扩展, 建议封装成JSON格式字符串
  serverCustom: string; // 第三方服务器扩展字段, 开发者可以自行扩展, 建议封装成JSON格式字符串
  valid: boolean; // 是否有效, 解散后该群无效
  validToCurrentUser: boolean; // 该群是否对当前用户有效, 如果无效, 那么说明被踢了
  mute: boolean; // 是否禁言, 禁言状态下普通成员不能发送消息, 创建者和管理员可以发送消息
  pushTeamName?: string;
}

export interface TeamMember {
  teamId: string; // 群ID
  account: string; // 账号
  type: 'owner' | 'manager' | 'normal' | string; // 群成员类型
  nickInTeam: string; // 在群里面的昵称
  muteTeam: boolean; // 是否关闭此群的消息提醒, true表示关闭提醒, 但是SDK仍然会收到这个群的消息, SDK只是记录这个设置, 具体根据这个设置要执行的操作由第三方APP决定
  joinTime: number; // 入群时间
  updateTime: number; // 更新时间
  active: boolean; // 普通群拉人进来的时候, 被拉的人处于未激活状态, 未激活状态下看不到这个群, 当有人说话后自动转为激活状态, 能看到该群
  mute: boolean; // 是否被禁言
  custom: string; // 第三方扩展字段
  user?: IMUser;
}

export interface Session {
  id: string; // 会话ID
  scene: string; // 场景
  to: string; // 聊天对象, 账号或群ID
  updateTime: number; // 会话更新的时间
  unread: number; // 未读数
  lastMsg: IMMessage | undefined; // 此会话的最后一条消息
  msgReceiptTime?: number; // 消息已读回执时间戳, 如果有此字段, 说明此时间戳之前的所有消息对方均已读
  localCustom: Record<string, unknown>; // 本地自定义扩展字段(之前是string 当前用JSON表示)
  toNickName?: string; // 聊天对象昵称，api层维护并缓存
}

export interface File {
  ext: string;
  h: number;
  w: number;
  size: number;
  name: string;
  url: string;
  md5: string;
}

export interface IMMsgAttach {
  accounts: string[];
  team: Record<keyof Team, any>;
  type: 'addTeamMembers' | 'transferTeam' | 'leaveTeam' | string;
  users: IMUser[];

  [key: string]: any;
}

export interface ApnsApi {
  accounts: string[];
  content: string;
  forcePush: boolean;
}

export interface IMReplyMessage {
  replyMsgFromAccount: string;
  replyMsgIdClient: string;
  replyMsgIdServer: string;
  replyMsgTime: number;
  replyMsgToAccount: string;
}

export type IMMessage = Partial<IMReplyMessage> & {
  scene: string; // 场景
  from: string; // 消息发送方, 账号
  fromNick: string; // 消息发送方的昵称
  fromClientType: string; // 发送方的设备类型
  fromDeviceId: string; // 发送端设备id
  to: string; // 消息接收方, 账号或群id
  time: number; // 时间戳
  replyMsgIdClient?: string | null; // 被引用消息IDClient
  timeTagIndex?: number; // 时间TagIndex
  userUpdateTime: number; // 发送方信息更新时间
  type: string; // 消息类型
  sessionId: string; // 消息所属的会话的ID
  target: string; // 聊天对象, 账号或者群id
  flow: string; // 消息的流向, 'in'表示此消息是收到的消息,'out'表示此消息是发出的消息
  status: string; // 消息发送状态,'sending' 发送中;'success' 发送成功;'fail' 发送失败
  text?: string; // 文本消息的文本内容, 请参考发送文本消息
  file?: Partial<File>; // 文件消息的文件对象, 具体字段请参考图片对象、音频对象、视频对象和文件对象, 请参考发送文件消息
  geo?: object; // 地理位置消息的地理位置对象, 请参考发送地理位置消息
  tip?: string; // 提醒消息的内容, 请参考发送提醒消息
  content?: string; // 自定义消息的消息内容, 开发者可以自行扩展, 建议封装成JSON格式字符串, 请参考发送自定义消息
  attach?: IMMsgAttach; // 群通知消息的附加信息,参考群通知消息的类型来查看不同类型的群通知消息对应的附加信息
  /**
   * SDK生成的消息id, 在发送消息之后会返回给开发者,
   * 开发者可以在发送消息的结果回调里面根据这个ID来判断相应消息的发送状态,到底是发送成功了还是发送失败了,
   * 然后根据此状态来更新页面的UI。如果发送失败, 那么可以重新发送此消息
   */
  idClient: string;
  /**
   * 服务器用于区分消息用的ID, 用于获取历史消息和获取包含关键词的历史消息,
   * 此字段可能没有, 所以开发者应该使用idClient来唯一标识消息
   */
  idServer?: string;
  isMuted: boolean; // 该消息在接收方是否应该被静音
  resend: boolean; // 是否是重发的消息
  custom?: string; // 扩展字段
  pushContent?: string; // 自定义推送文案
  pushPayload?: string; // 自定义的推送属性
  apns?: ApnsApi; // 特殊推送选项, 只在群会话中使用
  localCustom?: string; // 本地自定义扩展字段
  isHistoryable: boolean; // 是否存储云端历史
  isRoamingable: boolean; // 是否支持漫游
  isSyncable: boolean; // 是否支持发送者多端同步
  cc: boolean; // 是否支持抄送
  isPushable: boolean; // 是否需要推送
  isOfflinable: boolean; // 是否要存离线
  isUnreadable: boolean; // 是否计入消息未读数
  isReplyMsg: boolean; // 是否为应答消息（用于机器人等类似场景等应答消息内容）
  tempTeamMemberCount: number; // 群已读消息快照大小（即消息发送时的群人数-1）
  needPushNick: boolean; // 是否需要推送昵称
  isLocal: boolean; // 是否是本地消息, 请查阅发送文本消息
  pushTeamName?: string;
  pushTeamCustom?: string;
  /**
   * 自定义属性，用于标记被评论的用户id，快速回复推送中使用
   */
  commentTo?: string;
  comments: IMQuickComment[];
  sourceType?: 'accept' | 'pull';
  read?: number;
  unread?: number;
  threadMsgIdClient?: string;
  threadMsgFromAccount?: string;
  threadMsgToAccount?: string;
  threadMsgIdServer?: string;
  threadMsgTime?: number;
  needMsgReceipt?: boolean; // 是否需要对方发送回执
};

export interface SystemMessage {
  time: number; // 时间戳
  type?: string; // 系统通知类型
  from: string; // 系统通知的来源, 账号或者群ID
  to: string; // 系统通知的目标, 账号或者群ID
  idServer?: string; // 内建系统通知的 idServer
  read?: boolean; // 内建系统通知是否已读
  category?: string; // 内建系统通知的种类
  state?: string; // 内建系统通知的state
  error?: NIMError; // 内建系统通知的state 为 'error' 时, 此字段包含错误的信息
  localCustom?: string; // 内建系统通知的本地自定义扩展字段
  ps?: string; // 内建系统通知的附言
  attach?: IMMsgAttach; // 内建系统通知的附加信息, 参考系统通知类型来查看不同类型的系统通知对应的附加信息
  scene?: string; // 自定义系系统通知的场景, 参考消息场景
  content?: string; // 自定义系统通知的内容
  isPushable: boolean; // 是否需要推送
  apnsText?: string; // 自定义系统通知的推送文案, 仅对接收方为iOS设备有效
  pushPayload?: string; // 自定义系统通知的推送属性
  needPushNick: boolean; // 是否需要推送昵称
  /**
   * 自定义系统通知是否只发送给在线用户
   * true时只发送给在线用户, 适合发送即时通知, 比如正在输入。
   * false时假如目标用户或群不在线, 会在其上线后推送过去。
   * 该参数只对点对点自定义系统通知有效, 对群自定义系统通知无效, 群自定义系统通知只会发给在线的群成员, 不会存离线。
   */
  sendToOnlineUsersOnly?: boolean;
  cc: boolean; // 自定义系统通知是否抄送
}

export interface NIMError {
  message: string; // 错误消息
  code: number | string; // 错误码
  event: object; // 错误事件
}

export interface Unread {
  total: number; // 总共的未读数
  friend: number; // 所有跟好友相关的系统通知的未读数
  addFriend: number; // 直接加为好友的未读数
  applyFriend: number; // 申请加为好友的未读数
  passFriendApply: number; //  通过好友申请的未读数
  rejectFriendApply: number; // 拒绝好友申请的未读数
  deleteFriend: number; // 删除好友的未读数
  team: number; // 所有跟群相关的系统通知的未读数
  teamInvite: number; // 入群邀请的未读数
  rejectTeamInvite: number; // 接受入群邀请的未读数
  applyTeam: number; // 入群申请的未读数
  rejectTeamApply: number; // 拒绝入群申请的未读数
}

export interface AcceptTeamInviteOptions {
  idServer: string; // 对应的系统通知的 idServer
  teamId: string; // 群id
  from: string; // 邀请方的账号
  done: (error?: Error, team?: Team) => void; // 结果回调函数, 成功时会收到群资料
}

export interface AddFriendOptions {
  account: string; // 要直接加为好友的账号
  ps?: string; // 附言, 选填, 开发者也可以使用JSON格式的字符串来扩展此内容
  done: (error?: Error, Obj?: any) => void; // 结果回调函数
}

export interface AddTeamManagersOptions {
  teamId: string; // 群id
  accounts?: Array<string>; // 要添加的管理员账号列表
  done: (error?: Error, Obj?: IMMessage) => void; // 结果回调函数
}

export interface Relation {
  account: string;
  updateTime: number;
}

export interface unMustReqMsgOpt {
  text: string;

  // 群组消息
  done(): any;

  [key: string]: any;
}

export interface reqP2PMsgOptions extends Partial<unMustReqMsgOpt> {
  scene: 'p2p' | 'team' | 'superteam';
  to: string;
}

export interface reqTeamMsgPtions extends Partial<unMustReqMsgOpt> {
  teamId: string;
}

export type NIMSyncOperation =
  | 'connect'
  | 'cutFriendsByAccounts'
  | 'cutLoginPorts'
  | 'cutRelations'
  | 'cutTeamMembers'
  | 'cutTeamMembersByAccounts'
  | 'cutTeams'
  | 'disconnect'
  | 'findFriend'
  | 'findMsg'
  | 'findRelation'
  | 'findSession'
  | 'findSysMsg'
  | 'findTeam'
  | 'findTeamMember'
  | 'findUser'
  | 'forwardMsg'
  | 'markMsgRead'
  | 'mergeFriends'
  | 'mergeLoginPorts'
  | 'mergeMsgs'
  | 'mergeRelations'
  | 'mergeSessions'
  | 'mergeSysMsgs'
  | 'mergeTeamMembers'
  | 'mergeTeams'
  | 'mergeUsers'
  | 'resetCurrSession';

export interface NIMContructor {
  options: any;

  // 生成图片URL
  viewImageSync(params: any): string;

  /**
   * 接受入群邀请
   * 高级群的群主和管理员在邀请成员加入群（通过操作创建群或拉人入群）之后, 被邀请的人会收到一条类型为'teamInvite'的系统通知, 此类系统通知的from字段的值为邀请方的账号, to字段的值为对应的群ID, 此类系统通知的attach有一个字段team的值为被邀请进入的群, 被邀请的人可以选择接受邀请或者拒绝邀请。
   * 如果接受入群邀请, 那么该群的所有群成员会收到一条类型为'acceptTeamInvite'的群通知消息, 此类群通知消息的from字段的值为接受入群邀请的人的账号, to字段的值为对应的群ID, attach有一个字段team的值为对应的群对象, attach有一个字段members的值为接收入群邀请的群成员列表。
   * 如果拒绝入群邀请, 那么邀请你的人会收到一条类型为'rejectTeamInvite'的系统通知, 此类系统通知的from字段的值为拒绝入群邀请的人的账号, to字段的值为对应的群ID。
   * @param options
   */
  acceptTeamInvite(options: AcceptTeamInviteOptions): void;

  /**
   * 直接加为好友
   * 直接加某个用户为好友后, 对方不需要确认, 直接成为当前登录用户的好友。
   * 对方会收到一条类型为'addFriend'的系统通知, 此类系统通知的from字段的值为申请方的账号, to字段的值为接收方的账号
   * @param addFriendOptions
   */
  addFriend(addFriendOptions: AddFriendOptions): void;

  /**
   * 添加群管理员
   * 添加群管理员后, 所有群成员会收到一条类型为'addTeamManagers'的群通知消息。
   * 此类群通知消息的from字段的值为添加群管理员的人的账号, to字段的值为对应的群ID, attach有一个字段accounts的值为被加为管理员的账号列表,
   * attach有一个字段members的值为被加为管理员的群成员列表。
   * @param addTeamManagersOptions
   */
  addTeamManagers(addTeamManagersOptions: AddTeamManagersOptions): void;

  /**
   * 拉人入群
   */
  addTeamMembers(options: any): void;

  /**
   * 加入黑名单
   * @param options
   */
  addToBlacklist(options: any): void;

  /**
   * 加入静音列表
   * @param options
   */
  addToMutelist(options: any): void;

  /**
   * 申请加为好友
   * @param options
   */
  applyFriend(options: any): void;

  /**
   * 申请入群
   * @param options
   */
  applyTeam(options: any): void;

  /**
   * 将音频 url 转为 mp3
   * @param options
   */
  audioToMp3(options: any): void;

  /**
   * 音频转文字
   * @param options
   */
  audioToText(options: any): void;

  /**
   * 高斯模糊图片
   * @param options
   */
  blurImage(options: any): void;

  /**
   * 登录 SDK
   */
  connect(): void;

  /**
   * 创建群
   * @param options
   */
  createTeam(options: any): void;

  /**
   * 裁剪图片
   * @param options
   */
  cropImage(options: any): void;

  /**
   * 去除好友
   * @param options
   */
  cutFriends(options: any): Array<Friend>;

  /**
   * 去除accounts对应的好友
   * @param olds
   * @param invalids
   */
  cutFriendsByAccounts(olds: Array<Friend>, invalids: Friend | Array<Friend>): Array<Friend>;

  /**
   * 去除登录端
   * @param olds
   * @param invalids
   */
  cutLoginPorts(olds: Array<LoginPort>, invalids: LoginPort | Array<LoginPort>): Array<LoginPort>;

  /**
   * 去除关系
   * @param olds
   * @param invalids
   */
  cutRelations(olds: Array<Relation>, invalids: Relation | Array<Relation>): Array<Relation>;

  /**
   * 去除群成员
   * @param olds
   * @param invalids
   */
  cutTeamMembers(olds: Array<TeamMember>, invalids: TeamMember | Array<TeamMember>): Array<TeamMember>;

  /**
   * 去除accounts对应的群成员
   * @param olds
   * @param invalids
   */
  cutTeamMembersByAccounts(olds: Array<TeamMember>, invalids: TeamMember | Array<TeamMember>): Array<TeamMember>;

  /**
   * 去除群
   * @param olds
   * @param invalids
   */
  cutTeams(olds: Array<Team>, invalids: Team | Array<Team>): Array<Team>;

  /**
   * 删除所有本地消息
   */
  deleteAllLocalMsgs(options: any): void;

  /**
   * 删除所有本地系统通知
   */
  deleteAllLocalSysMsgs(options: any): void;

  /**
   * 删除好友
   * @param options
   */
  deleteFriend(options: any): void;

  /**
   * 删除本地消息
   * @param options
   */
  deleteLocalMsg(options: any): void;

  /**
   * 删除某个会话的本地消息
   * @param options
   */
  deleteLocalMsgsBySession(options: any): void;

  /**
   * 删除本地会话
   * @param options
   */
  deleteLocalSession(options: any): void;

  /**
   * 删除本地系统通知
   * @param options
   */
  deleteLocalSysMsg(options: any): void;

  /**
   * 删除 teamId 对应的本地群
   * @param options
   */
  deleteLocalTeam(options: any): void;

  /**
   * 撤回消息
   * @param options
   */
  deleteMsg(options: any): void;

  /**
   * 删除服务器上的会话
   * @param options
   */
  deleteSession(options: any): void;

  /**
   * 批量删除服务器上的会话
   * @param options
   */
  deleteSessions(options: any): void;

  /**
   * 登出 SDK
   */
  disconnect(): void;

  /**
   * 销毁实例
   * @param options
   */
  destroy(): void;

  /**
   * 解散群
   * @param options
   */
  dismissTeam(options: any): void;

  /**
   * 在好友数组里面根据 account 找到对应的好友
   * @param friends
   * @param account
   */
  findFriend(friends: Array<Friend>, account: string): void;

  /**
   * 在消息数组里面根据 idClient 找到对应的消息
   * @param msgs
   * @param idClient
   */
  findMsg(msgs: Array<IMMessage>, idClient: string): void;

  /**
   * 在关系数组里面根据 account 找到对应的关系
   * @param relations
   * @param account
   */
  findRelation(relations: Array<Relation>, account: string): void;

  /**
   * 在关系数组里面根据 account 找到对应的关系
   * @param sessions
   * @param sessionId
   */
  findSession(sessions: Array<Session>, sessionId: string): void;

  /**
   * 在系统通知数组里面根据 idServer 找到对应的系统通知
   * @param sysMsgs
   * @param idServer
   */
  findSysMsg(sysMsgs: Array<SystemMessage>, idServer: string): void;

  /**
   * 在群数组里面根据 teamId 找到对应的群
   * @param teams
   * @param teamId
   */
  findTeam(teams: Array<Team>, teamId: string): Team;

  /**
   * 在群成员数组里面根据 id 找到对应的群成员
   * @param sysMsgs
   * @param id
   */
  findTeamMember(sysMsgs: Array<TeamMember>, id: string): TeamMember | null;

  /**
   * 在名片数组里面根据 account 找到对应的名片
   * @param users
   * @param account
   */
  findUser(users: Array<IMUser>, account: string): IMUser;

  /**
   * 转发消息
   * @param users
   * @param account
   */
  forwardMsg(users: Array<IMUser>, account: string): void;

  /**
   * 获取聊天室服务器地址
   * @param options
   */
  getChatroomAddress(options: any): void;

  /**
   * 获取好友列表
   * @param options
   */
  getFriends(options: any): void;

  /**
   * 获取云端历史记录
   * @param options
   */
  getHistoryMsgs(options: any): void;

  /**
   * 获取 idClient 对应的本地消息
   * @param options
   */
  getLocalMsgByIdClient(options: any): void;

  /**
   * 获取本地历史记录
   * @param options
   */
  getLocalMsgs(options: any): void;

  /**
   * 获取 idClients 对应的本地消息
   * @param options
   */
  getLocalMsgsByIdClients(options: any): void;

  /**
   * 通过sessionId获取本地会话
   * @param options
   */
  getLocalSession(options: any): void;

  /**
   * 通过sessionId获取服务端会话
   * @param options
   */
  getServerSession(options: any): void;

  /**
   * 获取本地会话列表
   * @param options
   */
  getLocalSessions(options: any): void;

  /**
   * 获取本地系统通知
   * @param options
   */
  getLocalSysMsgs(options: any): void;

  /**
   * 获取teamIds对应的本地群
   * @param options
   */
  getLocalTeams(options: any): void;

  /**
   * 获取群禁言成员列表
   * @param options
   */
  getMutedTeamMembers(options: any): void;

  /**
   * 获取当前多端推送配置选项
   * @param options
   */
  getPushNotificationMultiportConfig(options: any): any;

  /**
   * 获取黑名单和静音列表
   * @param options
   */
  getRelations(options: any): void;

  /**
   * 获取群
   * @param options
   */
  getTeam(options: any): void;

  /**
   * 通过群ID及成员账号获取群成员信息
   * @param options
   */
  getTeamMemberByTeamIdAndAccount(options: any): void;

  /**
   * 获取群成员
   * @param options
   */
  getTeamMembers(options: any): void;

  /**
   * 查询群组已读、未读账号列表
   * @param options
   */
  getTeamMsgReadAccounts(options: any): void;

  /**
   * 查询群组消息已读、未读数量
   * @param options
   */
  getTeamMsgReads(options: any): void;

  /**
   * 获取群列表
   * @param options
   */
  getTeams(options: any): void;

  getTeamsById(options: any): void;

  /**
   * 获取用户名片
   * @param options
   */
  getUser(options: any): void;

  /**
   * 获取用户名片数组
   * @param options
   */
  getUsers(options: any): void;

  /**
   * 插入一条本地会话记录
   * @param options
   */
  insertLocalSession(options: any): void;

  /**
   * interlace 图片
   * @param options
   */
  interlaceImage(options: any): void;

  /**
   * 查询消息是否被对方读过了
   * @param msg
   */
  isMsgRemoteRead(msg: IMMessage): boolean;

  /**
   * 踢当前用户登录的其它端
   * @param options
   */
  kick(options: any): void;

  /**
   * 主动退群
   * @param options
   */
  leaveTeam(options: any): void;

  /**
   * 加入黑名单/从黑名单移除
   * @param options
   */
  markInBlacklist(options: any): void;

  /**
   * 加入静音列表/从静音列表移除
   * @param options
   */
  markInMutelist(options: any): void;

  /**
   * 标记消息为已收到
   * @param msgs
   */
  markMsgRead(msgs: Array<IMMessage>): void;

  /**
   * 合并好友
   * @param olds
   * @param news
   */
  mergeFriends(olds: Array<Friend>, news: Friend | Array<Friend>): Array<Friend>;

  /**
   * 合并登录端
   * @param olds
   * @param news
   */
  mergeLoginPorts(olds: Array<LoginPort>, news: LoginPort | Array<LoginPort>): Array<LoginPort>;

  /**
   * 合并消息
   * @param olds
   * @param news
   */
  mergeMsgs(olds: Array<IMMessage>, news: IMMessage | Array<IMMessage>): Array<IMMessage>;

  /**
   * 合并关系
   * @param olds
   * @param news
   */
  mergeRelations(olds: Array<Relation>, news: Relation | Array<Relation>): Array<Relation>;

  /**
   * 合并会话
   * @param olds
   * @param news
   */
  mergeSessions(olds: Array<Session>, news: Session | Array<Session>): Array<Session>;

  /**
   * 合并系统通知
   * @param olds
   * @param news
   */
  mergeSysMsgs(olds: Array<SystemMessage>, news: SystemMessage | Array<SystemMessage>): Array<SystemMessage>;

  /**
   * 合并群成员
   * @param olds
   * @param news
   */
  mergeTeamMembers(olds: Array<TeamMember>, news: TeamMember | Array<TeamMember>): Array<TeamMember>;

  /**
   * 合并群
   * @param olds
   * @param news
   */
  mergeTeams(olds: Array<Team>, news: Team | Array<Team>): Array<Team>;

  /**
   * 合并名片
   * @param olds
   * @param news
   */
  mergeUsers(olds: Array<IMUser>, news: IMUser | Array<IMUser>): Array<IMUser>;

  /**
   * 群组禁言
   * @param options
   */
  muteTeamAll(options: any): void;

  /**
   * 是否需要群消息通知
   * @param options
   */
  notifyForNewTeamMsg(options: any): void;

  /**
   * 修改图片下载的名字
   * @param options
   */
  packFileDownloadName(options: any): void;

  /**
   * 通过好友申请
   * @param options
   */
  passFriendApply(options: any): void;

  /**
   * 通过入群申请
   * @param options
   */
  passTeamApply(options: any): void;

  /**
   * 预览文件
   * @param options
   */
  previewFile(options: any): void;

  /**
   * 处理图片
   * @param options
   */
  processImage(options: any): void;

  /**
   * 修改图片质量
   * @param options
   */
  qualityImage(options: any): void;

  /**
   * 拒绝好友申请
   * @param options
   */
  rejectFriendApply(options: any): void;

  /**
   * 拒绝入群申请
   * @param options
   */
  rejectTeamApply(options: any): void;

  /**
   * 拒绝入群邀请
   * @param options
   */
  rejectTeamInvite(options: any): void;

  /**
   * 从黑名单移除
   * @param options
   */
  removeFromBlacklist(options: any): void;

  /**
   * 从静音列表移除
   * @param options
   */
  removeFromMutelist(options: any): void;

  /**
   * 移除群管理员
   * @param options
   */
  removeTeamManagers(options: any): void;

  /**
   * 踢人出群
   * @param options
   */
  removeTeamMembers(options: any): void;

  /**
   * 重发消息
   * @param options
   */
  resendMsg(options: any): void;

  /**
   * 重置当前会话
   */
  resetCurrSession(): void;

  /**
   * 重置某个会话的未读数
   * @param sessionId
   */
  resetSessionUnread(sessionId: string): void;

  /**
   * 旋转图片
   * @param options
   */
  rotateImage(options: any): void;

  /**
   * 发送自定义消息
   * @param options
   * @param apns
   */
  sendCustomMsg(options: any, apns?: any): IMMessage;

  /**
   * 发送自定义系统通知
   * @param options
   */
  sendCustomSysMsg(options: any): string;

  /**
   *  发送文件消息
   * @param options
   * @param apns
   */
  sendFile(options: any, apns?: any): void | IMMessage;

  /**
   * 发送地理位置消息
   * @param options
   * @param apns
   */
  sendGeo(options: any, apns?: any): IMMessage;

  /**
   * 发送消息已读回执
   * @param options
   */
  sendMsgReceipt(options: any): void;

  /**
   * 给机器人发送消息
   * @param options
   * @param apns
   */
  sendRobotMsg(options: any, apns?: any): IMMessage;

  /**
   * 标记群组消息已读
   * @param options
   */
  sendTeamMsgReceipt(options: any): void;

  /**
   * 发送文本消息
   * @param options
   * @param apns
   */
  sendText(options: any, apns?: any): IMMessage;

  /**
   * 转发消息
   * @param options
   */
  forwardMsg(options: any): IMMessage;

  /**
   * 发送提醒消息
   * @param options
   * @param apns
   */
  sendTipMsg(options: any, apns?: any): IMMessage;

  /**
   * 设置当前会话
   * @param sessionId
   */
  setCurrSession(sessionId: string): void;

  /**
   * 更新配置, 参数格式跟 NIM.getInstance 保持一致
   * @param options
   */
  setOptions(options: any): void;

  /**
   * 去除图片元信息
   * @param options
   */
  stripImageMeta(options: any): void;

  /**
   * 生成缩略图
   * @param options
   */
  thumbnailImage(options: any): void;

  /**
   * 转让群
   * @param options
   */
  transferTeam(options: any): void;

  /**
   * 更新好友
   * @param options
   */
  updateFriend(options: any): void;

  /**
   * 修改自己的群属性
   * @param options
   */
  updateInfoInTeam(options: any): void;

  /**
   * 更新本地消息
   * @param options
   */
  updateLocalMsg(options: any): void;

  /**
   * 更新本地会话
   * @param options
   */
  updateLocalSession(options: any): void;

  /**
   * 更新本地系统通知
   * @param options
   */
  updateLocalSysMsg(options: any): void;

  /**
   * 更新群成员禁言状态
   * @param options
   */
  updateMuteStateInTeam(options: any): void;

  /**
   * 更新我的名片
   * @param options
   */
  updateMyInfo(options: any): void;

  /**
   * 修改别人的群昵称
   * @param options
   */
  updateNickInTeam(options: any): void;

  /**
   * 更新群
   * @param options
   */
  updateTeam(options: any): void;

  /**
   * 预览去除图片元信息
   * @param options
   */
  viewImageStripMeta(options: any): void;

  /**
   * 发布事件
   * @param options
   */
  publishEvent(options: any): void;

  /**
   * 按账号获取指定事件的订阅关系
   * @param options
   */
  querySubscribeEventsByAccounts(options: any): void;

  /**
   * 查询指定事件的全部订阅关系
   * @param options
   */
  querySubscribeEventsByType(options: any): void;

  /**
   * 订阅事件
   * @param options
   */
  subscribeEvent(options: any): void;

  /**
   * 按账号取消指定事件的订阅关系
   * @param options
   */
  unSubscribeEventsByAccounts(options: any): void;

  /**
   * 取消指定事件的全部订阅关系
   * @param options
   */
  unSubscribeEventsByType(options: any): void;

  saveMsgsToLocal(options: any): void;

  getServerTime(option: { done: (error: any, time: number) => void }): void;
}

export interface NIMInterface {
  getInstance(options: NIMEventOptions & NIMInitOptions): NIMContructor;
}

export interface FetchAccountReqApi {
  domain?: string;
  emailList: string;
  account?: string;
}

export interface FetchAccountEmailListApi<T> {
  itemList: T[];
}

export interface CreateSessionApi {
  scene?: 'p2p' | 'team';
  to: string;
}

export type FetchAccountInfoType = (url: string, params: FetchAccountReqApi) => Promise<FetchAccountByEmailApiRet>;

export interface NIMApi extends Api {
  nimTempEventManager: EventEmitter;
  interceptor: NimInterceptorApi;
  teamManager: ImTeamManager;
  imnotify: Omit<IM_STREAM, 'getSubject'> & NotifyCountInterface;
  sessionStream: IM_STREAM<Session[]> & SessionInterface;
  p2pMuteStream: IM_STREAM<string[]> & P2PMuteInterface;
  teamMuteStream: IM_STREAM<string[]>;
  currentSession: IM_STREAM & CurrentSessionInterface;
  msgPushStream: Omit<IM_STREAM, 'getSubject'>;
  imusers: IM_STREAM<Record<string, IMUser>> & IMUserInterface;
  imself: IM_STREAM<IMUser> & MyinfoInterface;
  imlater: IM_STREAM<string[]> & SessionLaterInterface;
  imteamStream: IM_STREAM<Record<string, Team>> & IMTeamInterface;
  imcache: Omit<IM_STREAM, 'getSubject'> & IMCacheInterface;

  getEmailAccount(): string;

  sdkInit(account: string, token: string): void;

  // 返回实例方法
  getInstance(): NIMContructor | null;

  excuteConnect(): Promise<string>;

  /**
   * 监听sdk登录状态
   */
  onconnect(ev: any): void;

  ondisconnect(ev: any): void;

  /**
   * 调用NIM实例方法(异步方法)
   * @param command 方法名
   * @param options 方法入参
   * @param restArgs 剩余参数(具体参考文档)
   */
  excute(command: Exclude<keyof NIMContructor, NIMSyncOperation>, options: any, ...restArgs: unknown[]): Promise<any>;

  /**
   * 调用NIM实例异步方法
   * @param command 方法名
   * @param restArgs 入参
   */
  excuteSync(command: NIMSyncOperation, ...restArgs: unknown[]): Promise<any>;

  /**
   * 订阅Nim事件监听回调
   * @param event 监听函数名
   * @param callback  监听回调
   */
  subscrible(event: keyof NIMEventOptions, callback: (...params: any[]) => void): void;

  /** */
  getIMAuthConfig(): boolean;

  unSubcrible(eventName: keyof NIMEventOptions, callback?: (...params: any[]) => void): void;

  /**
   * 订阅自定义事件
   * @param eventname
   * @param callback
   */
  subCustomEvent(eventname: string, callback: (...options: any[]) => void, options: { [k: string]: any }): void;

  offCustomEvent(eventName: string, callback: (...options: any[]) => void): void;

  emitCustomEvent(eventname: string, ...args: any[]): void;

  initNIMInstance(): void;

  isImInited(): boolean;

  getTeamName(teamDetail: Record<keyof Team, any> | undefined): any;
}

export enum CustomMessageEvents {
  CREATE_P2P_SESSION = 'CREATE_P2P_SESSION',
  CREATE_TEAM_SESSION = 'CREATE_TEAM_SESSION',
}

export interface UploadFileApi {
  sn: string;
  abort: (...params: any[]) => void;
  onError: (...params: any) => void;
}
