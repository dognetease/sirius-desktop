/**
 * 输出错误码,全局维护
 */
import { StringTypedMap } from './commonModel';
import { PopUpMessageInfo } from './_base/api';

export class ErrMsgCodeMapType {
  /*
   * 通用错误开始
   *
   */
  'NETWORK.ERR' = '网络请求失败，请稍后尝试';

  'NETWORK.ERR.TIMEOUT' = '网络请求超时未返回，请稍后尝试';

  'ERR.CANCELED.NO.AUTH' = '用户登录失效或重登中，该请求取消';

  'SERVER.ERR' = '服务器繁忙，请稍后再试';

  'ERR.PARAM' = '参数错误，请稍后重试';

  'ERR.CANCELED' = '用户取消';

  'ERR.ILLEGAL' = '系统错误';

  'LOGIN.ILLEGAL.STATE' = '登录状态不正常，请彻底退出应用再试';

  /*
   * 通用错误结束
   *
   */
  /*
   * 数据发送错误开始
   *
   */
  'SEND.MSG.EXCEPTION' = '发送数据出错';

  'RECEIVE.MSG.EXCEPTION' = '接受数据出错';

  /*
   数据发送错误结束
   */
  /*
   * 数据存储错误开始
   *
   */
  'STORAGE.SAVE.EXCEPTION' = '存入数据出错';

  'STORAGE.READ.EXCEPTION' = '读取数据出错';

  /*
   数据存储错误结束
   */
  /*
   登录部分定义开始
   */
  'ERR.LOGIN.SYSTEMUSY': '';

  'DOMAIN.NOTSTARTWITHMAIL.DOT' = '解析域名错误，域名必须以mail.开头';

  'DOMAIN.NOTEXIST' = '找不到该域名信息，请联系客服或经销商';

  'PAGE.NOTFOUND' = '您访问的页面找不到，可在这里登录邮箱';

  'PAGE.SYSTEM.ERR' = '您访问的页面发生错误，可在这里登录邮箱';

  'ERR.SYSTEM' = '系统错误，请联系客服';

  // 'ERR.PASS.REPEAT': string='密码不符合规则';
  'ERR.IM.LOGIN.IPDENY' = '登录失败，您的IP在黑名单中，请联系管理员';

  'ERR.LOGIN.IPDENY' = '登录失败，当前当前IP已被禁用。';

  'ERR.LOGINRULE.IPDENY' = '登录失败，管理员已设置当前IP无法登录，如有疑问可联系管理员。';

  'ERR.AGENT.PASSERR' = '邮箱帐号和密码不匹配（三方邮箱 ）。';

  'ERR.LDAP.NOTFOUND' = '帐号未在ldap系统中找到，请联系管理员处理。';

  'ERR.LDAP.MATCHMULTI' = '帐号在ldap系统中匹配不止一条，请联系管理员处理。';

  'ERR.LDAP.PASSERR' = 'ldap帐号密码错误';

  'ERR.LOGIN.REQCODE' = '客户端授权码错误';

  'ERR.LOGIN.DOMAINDENY' = '此邮箱暂无登录权限';

  'ERR.LOGIN.ILLEGALINPUT' = '登录失败，请输入正确的企业邮账号';

  'ERR.LOGIN.PASSERR' = '账号或密码错误，请重新输入';

  'ERR.LOGIN.ILLEGALACCOUNT' = '这是一个邮件列表，无法登录邮箱';

  'ERR.LOGIN.USERNOTEXIST' = '该账号不存在，请您确认正确的域名和账号';

  'ERR.LOGIN.SYSTEMBUSY' = '系统繁忙，请您稍候再试';

  'ERR.LOGIN.DOMAINEXPED' = '该企业邮箱已过期，请联系管理员或客服';

  'ERR.LOGIN.DOMAINSTATUS' = '该企业邮箱已被禁用，请联系客服';

  'ERR.LOGIN.DOMAINNOTEXIST' = '该域名未开通企业邮箱，请联系经销商或客服';

  'ERR.LOGIN.MLOGINSMSREQ' = '今日此手机验证码获取次数已达到20次上限';

  'ERR.ACCOUNT.CREATE.OVER' = '当前企业账号数已达上限，请联系管理员或经销商进行扩容';

  'ERR.LOGIN.SMS.IP' = '发送过于频繁，请稍后再试';

  'ERR.LOGIN.SMS.DAY' = '该手机号今日获取验证码超限';

  'ERR.LOGIN.MOBILE_NOT_BIND' = '该手机号未绑定过企业邮箱，不支持获取验证码';

  'ERR.CODE.INVALID' = '验证码不正确';

  'ERR.LOGIN.MBINDEXIST' = '此账号已经绑定手机号，无法再绑定其他手机号';

  'ERR.LOGIN.MLOGINNO' = '当前您的账号未开启手机号验证码登录方式登录系统，请联系您企业的管理员开启此功能';

  'ERR.LOGIN.SMSMOBILE' = '手机号格式错误';

  'ERR.LOGIN.EMAILSESSEXP' = '未登录或者已过期';

  'ERR.LOGIN.EMAILREQ' = '发送太频繁，1分钟内只能发1次';

  'ERR.LOGIN.EMAIL.IP' = '当前IP在1小时内发送的验证邮件数量达到100封';

  'ERR.LOGIN.EMAIL.DAY' = '当前安全邮箱在1天内发送邮件数量达到20封';

  'EMAIL.SENDCODE.FAIL' = '发送验证码失败，请稍后重试';

  'ERR.LOGIN.USERSTATUS' = '该账号已被禁用或删除，请联系管理员';

  'ERR.LOGIN.USEREXP' = '该账号已过期，请联系管理员';

  'ERR.LOGIN.PERMDENY' = '该域名没有对应产品的权限';

  'ERR.MOBILEAUTH.FORBID' = '验证码错误过于频繁，请1小时后再试';

  'ERR.MOBILEAUTH.RETRYFAILED' = '验证码失效，请重新获取';

  'ERR.LOGIN.PASSERR_TRUST' = '托管账号或密码错误，请重新输入';

  'ERR.LOGIN.SMSSESSEXP' = '未登录或者已过期';

  'ERR.LOGIN.SMSREQ' = '发送过于频繁，请稍后再试';

  'ERR.LOGIN.SMSFAIL' = '验证码发送失败';

  'MOBILE.CODE.WRONG' = '验证码不正确';

  'ERR.SESSIONNULL' = '当前会话已失效，请您重新登录';

  'ERR.REQ.VERIFYCODE' = '密码输入错误次数过多，请稍候再试';

  // "ERR.ILLEGAL": string = "非法操作";
  'EXP_AUTH_USER_STATUS_SUSPENDED' = '该账号已被禁用，请联系管理员或客服';

  'EXP_AUTH_USER_STATUS_LOCKED' = '该账号已被禁用，请联系管理员或客服';

  'EXP_AUTH_COOKIE_NOT_FOUND' = '浏览器连接异常，请更换浏览器并重新登录';

  'EXP_AUTH_COOKIE_TIMEOUT' = '登录信息超时，请重新登录';

  'EXP_AUTH_USER_NOT_FOUND' = '该账号不存在，请联系管理员或客服';

  'EXP_AUTH_USER_FORBIDDEN' = '该账号已被禁用，请联系管理员或客服';

  'EXP_AUTH_USER_STATUS_ERROR' = '该账号已被禁用，请联系管理员或客服';

  'ERR.RIGHT.DENY' = '对不起，您没有权限进行此操作';

  'ERR.LOGIN.SUPERADMINERR' = '对不起，请从主域名登录';

  'ERR.LOGIN.USERNOTEXIS' = '该账号不存在，请您确认正确的域名和账号';

  'ERR.LOGIN.USRSEXP' = '该账号已过期，请联系管理员或客服';

  'ERR.REQ.VERI' = '密码输入错误次数过多，请稍候再试';

  'LOGOOUT.FAIL' = '登录失败';

  'SYSTEM.BUSY' = '系统繁忙，请您稍候再试';

  'PRELOGIN.ERR' = '前置请求有误，请稍后再试';

  'DOMAIN.DEFAULT' = '';

  'LOGIN.PERMDENY' = '该账号无权登录Web端，请联系管理员';

  'LINGXI.LOGIN.PERMDENY' = '该账号无权登录灵犀办公客户端，请联系管理员';

  'VERIFYCODE.ERROR' = '验证码错误';

  'VERIFYCODE.REQ' = '密码输入错误次数过多，请1小时后再试';

  'ERR.PASS.REPEAT' = '新旧密码不能相同';

  'ERR.ADVANCE.PASSILLEGAL' = '密码不合法';

  'ACCOUNT.NEED2FA' = '账号需要绑定手机才允许登录';

  'ERR.PASSCHANGE' = '请使用浏览器打开邮箱修改密码后再登录';

  'GENERAL.AUTH.MAXERR' = '将军令验证错误过多，请重新登录';

  'ERR.PRODUCT.INVALID' = '登录失败，请检查产品号';

  'PRELOGIN.INVALID_UID' = '非法uid';

  'PRELOGIN.TOO_MANY_REQUESTS' = '请求过于频繁';

  'PRELOGIN.INVALID_PUBKEY' = '用户公钥无效';

  'COS_CANNOT_LOGIN' = '对不起，您没有权限进行此操作';

  'FA_NEED_AUTH2' = '需要进行二次安全验证';

  'UNKNOWN_ERR' = '未知错误';

  /*
   * 登录部分定义结束
   */
  /**
   * 邮件部分开始
   */
  'FA_COMPOSE_NOT_FOUND' = '找不到写信任务';

  'FA_COMPOSE_BODY_ERR' = '处理正文部分出错';

  'FA_ATTACH_NOT_FOUND' = '附件不存在';

  'FA_COMPOSE_PROCESSING' = '信件正在处理中';

  'FA_NO_RECEIPT' = '投信时没有收件人';

  'FA_WRONG_RECEIPT' = '收件人格式错误';

  'FA_INVALID_DATE' = '定时投递或投递可回收邮件的时间范围出错';

  'FA_NEED_VERIFY_CODE' = '需要校验码';

  'FA_INVALID_VERIFY_CODE' = '校验码错误';

  'FA_INVALID_ACCOUNT' = '发信账号错误';

  'FA_ATTACHMENT_LOST' = '无法发送，附件相关错误';

  'FA_MAIL_NOT_FOUND' = '无法发送，原邮件丢失';

  'FS_INTERNAL_ERROR' = '无法发送，系统错误';

  'FA_MTA_TOO_MANY_RCPTS' = '无法发送，发送人数超过500人';

  'FA_MTA_MULTI_ERROR' = '有多个错误';

  'FA_MTA_USER_BLACK_LIST' = 'IP地址异常，请求被拒绝！';

  'FA_MTA_REJECTED' = '发信被拒绝';

  'FA_MTA_REJECTED5510' = 'IP地址异常，请求被拒绝！';

  'FA_MTA_REJECTED5511' = '对不起，您的账号已被系统禁止发信，请在解禁后再重试！';

  'FA_MTA_REJECTED5520' = '对不起，您今天发送邮件数量超过限制，请明日再试！';

  'FA_MTA_REJECTED5521' = '短时间发信过多，请稍后再试！';

  'FA_MTA_REJECTED5522' = '操作过于频繁，请求被拒绝！';

  'FA_MTA_REJECTED5530' = '对不起，您今天发送对象过多，请明日再试！';

  'FA_MTA_REJECTED5531' = '短时间发送对象过多，请稍候尝试！';

  'FA_MTA_REJECTED5532' = '对不起，您本次群发的收件人数量超过限制，请减少后重发！';

  'FA_MTA_REJECTED5540' = '邮件或附件含敏感内容，请求被拒绝！错误码[5540]';

  'FA_MTA_REJECTED4512' = '邮件或附件含敏感内容，请求被拒绝！错误码[4512]';

  'FA_MTA_REJECTED5910' = '邮件或附件含敏感内容，请求被拒绝！错误码[5910]';

  'FA_MTA_REJECTED5911' = '对不起，您只能发送邮件给系统管理员！';

  'FS_UNKNOWN' = '未知请求错误，如无异常，请忽略';

  'FA_MTA_RETRY' = '因写信过程中账号重登录或是更换了发件人，需要重新上传附件';

  'FA_MTA_ICSRETRY' = '因写信过程中账号重登录或是更换了发件人，需要重新上传会议';

  'ERR.ANTISPAM.APPLY_SENDED' = '已向管理员发送解禁邮件申请';

  'ERR.ANTISPAM.APPLY_FREQ' = '发送太频繁';

  'ERR.ANTISPAM.UNBLOCK_FAIL' = '当前账号无法自助解禁，请联系管理员在管理后台操作解禁账号。';
  /**
   * 邮件部分结束
   */
  /**
   * Im 群组开始
   */
  '200' = '操作成功';

  '201' = '客户端版本不对，需升级sdk';

  '302' = '用户名或密码错误';

  '301' = '被封禁';

  '315' = 'IP限制';

  '403' = '非法操作或没有权限';

  '404' = '对象不存在';

  '405' = '参数长度过长';

  '406' = '对象只读';

  '408' = '客户端请求超时';

  '413' = '验证失败(短信服务)';

  '414' = '参数错误';

  '415' = '客户端网络问题';

  '416' = '频率控制';

  '417' = '重复操作';

  '418' = '通道不可用(短信服务)';

  '419' = '数量超过上限';

  '422' = '账号被禁用';

  '423' = '账号被禁言';

  '431' = 'HTTP重复请求';

  // '500': string = '服务器内部错误';
  // '503': string = '服务器繁忙';
  '508' = '消息撤回时间超限';

  '509' = '无效协议';

  '514' = '服务不可用';

  '998' = '解包错误';

  '999' = '打包错误';

  '801' = '群人数达到上限';

  '802' = '没有权限';

  '803' = '群不存在';

  '804' = '用户不在群';

  '805' = '群类型不匹配';

  '806' = '创建群数量达到限制';

  '807' = '群成员状态错误';

  '808' = '申请成功';

  '809' = '已经在群内';

  '810' = '邀请成功';

  '811' = '@账号数量超过限制';

  '812' = '群禁言，普通成员不能发送消息';

  '813' = '群拉人部分成功';

  '814' = '禁止使用群组已读服务';

  '815' = '群管理员人数超过上限';

  '30101' = '群不存在';

  '30201' = '不是群成员';

  '30202' = '不是管理员不能踢人';

  '30203' = '管理员不能踢管理员';

  '30204' = '只有群主才能解散群';

  '30205' = '只有群主才能添加管理员';

  '30206' = '只有群主才能移除管理员';

  'IM_AUTH_FAIL' = '无法初始化云信长连接，认证失败';

  /**
   * Im 群组结束
   */
  /**
   * Disk错误码开始
   */
  '10100' = '暂无权限进行此操作';

  '10101' = '授权记录不存在';

  '10102' = '无效用户信息';

  '10103' = '获取登录状态失败';

  '10104' = '文件没有权限';

  '10105' = '文件夹没有权限';

  '10106' = '抱歉，暂不支持删除及编辑本人相关权限';

  '10107' = '管理后请求参数错误';

  '10108' = '管理后台签名过期';

  '10109' = '管理后台签名解析错误';

  '10200' = '删除失败';

  '10201' = '部分文件删除失败';

  '10202' = '子文件夹不为空不允许删除';

  '10203' = '预览失败，请稍后再试';

  '10204' = '文件夹不存在';

  '10205' = '打包下载服务出错';

  '10206' = '无法打开，已设置安全锁';

  '10207' = '文件不存在';

  '10300' = '文件夹名称长度超限';

  '10301' = '您选择的文件大小超过5G上限，不能上传';

  '10302' = '无法创建文件夹,文件夹层级最多为9级';

  '10303' = '备注长度超限';

  '10304' = '您选择的文件大小超过当前文件夹可用容量,不能上传';

  '10600' = '参数错误';
  /**
   * Disk错误码结束
   */
}

export class EnErrMsgCodeMapType {
  'ERR.LOGIN.SMS.IP' = 'Too many codes send，please try again later';
  'ERR.LOGIN.SMS.DAY' = 'You have exceeded the limit to obtain your verification code today';
  'ERR.LOGIN.MOBILE_NOT_BIND' = 'The phone number has not been bound to enterprise mailbox and does not support getting verification code';
  'ERR.ACCOUNT.CREATE.OVER' = 'The number of current enterprise accounts has reached the upper limit. Please contact the enterprise administrator';
  'ERR.ANTISPAM.APPLY_SENDED' = 'An email request for unbanning has been sent to the administrator';
  'ERR.ANTISPAM.APPLY_FREQ' = 'Sent too often';
  'ERR.ANTISPAM.UNBLOCK_FAIL' = 'The current account cannot be unbanned by yourself, please contact the administrator to unban the account in the management console.';
}

const zhErrMsgCodeMap = new ErrMsgCodeMapType();

export const ErrMsgCodeMap: ErrMsgCodeMapType =
  typeof window !== 'undefined' ? (window.systemLang === 'en' ? Object.assign(zhErrMsgCodeMap, new EnErrMsgCodeMapType()) : zhErrMsgCodeMap) : zhErrMsgCodeMap;
export type ErrMsgType = keyof ErrMsgCodeMapType;
export const ErrResult: StringTypedMap<PopUpMessageInfo> = {
  'REQUEST.EXPIRED': {
    popupType: 'customer',
    popupLevel: 'error',
    title: '请求过期，无需处理',
    code: 'REQUEST.EXPIRED',
  },
  'REQUEST.ILLEGAL': {
    popupType: 'customer',
    popupLevel: 'error',
    title: '请求参数有误',
    code: 'REQUEST.ILLEGAL',
  },
  'SERVER.ERR': {
    popupType: 'toast',
    popupLevel: 'error',
    title: '未知错误发生 ',
    content: '请稍后重试',
    code: 'SERVER.ERR',
  },
  FS_UNKNOWN: {
    popupType: 'toast',
    popupLevel: 'error',
    title: '未知请求错误',
    content: '请稍后重试之前的步骤',
    code: 'FS_UNKNOWN',
  },
  FA_NEED_AUTH2: {
    popupType: 'customer',
    popupLevel: 'info',
    title: '安全锁，需要二次验证',
    code: 'FA_NEED_AUTH2',
  },
  FA_COMPOSE_NOT_FOUND: {
    popupType: 'window',
    popupLevel: 'error',
    title: '无法发送，系统错误',
    content: '找不到写信任务',
    code: 'FA_COMPOSE_NOT_FOUND',
  },
  FA_COMPOSE_BODY_ERR: {
    popupType: 'window',
    popupLevel: 'error',
    title: '无法发送，邮件编码出错',
    content: '',
    code: 'FA_COMPOSE_BODY_ERR',
  },
  FA_ATTACH_NOT_FOUND: {
    popupType: 'window',
    popupLevel: 'error',
    title: '无法发送，附件相关错误',
    content: '可尝试重新上传附件',
    code: 'FA_ATTACH_NOT_FOUND',
  },
  FA_COMPOSE_PROCESSING: {
    popupType: 'toast',
    popupLevel: 'error',
    title: '点太快啦',
    content: '',
    code: 'FA_COMPOSE_PROCESSING',
  },
  FA_NO_RECEIPT: {
    popupType: 'window',
    popupLevel: 'error',
    title: '无法发送，系统错误',
    content: '投信时没有收件人',
    code: 'FA_NO_RECEIPT',
  },
  FA_WRONG_RECEIPT: {
    popupType: 'window',
    popupLevel: 'error',
    title: '无法发送，系统错误',
    content: '收件人格式错误',
    code: 'FA_WRONG_RECEIPT',
  },
  FA_INVALID_ACCOUNT: {
    popupType: 'window',
    popupLevel: 'error',
    title: '无法发送，系统错误',
    content: '发信账号错误',
    code: 'FA_INVALID_ACCOUNT',
  },
  FA_ATTACHMENT_LOST: {
    popupType: 'window',
    popupLevel: 'error',
    title: '无法发送，附件相关错误',
    content: '可尝试重新上传附件',
    code: 'FA_ATTACHMENT_LOST',
  },
  FA_MAIL_NOT_FOUND: {
    popupType: 'window',
    popupLevel: 'error',
    title: '邮件读取错误',
    content: '原邮件丢失',
    code: 'FA_MAIL_NOT_FOUND',
  },
  FS_INTERNAL_ERROR: {
    popupType: 'toast',
    popupLevel: 'error',
    title: '请求出现未知错误,如无异常请忽略',
    code: 'FS_INTERNAL_ERROR',
  },
  FA_MTA_TOO_MANY_RCPTS: {
    popupType: 'window',
    popupLevel: 'error',
    title: '无法发送，发送人数超过限制',
    content: '减少发件人，当前发送人数为500人（收件人+抄送+密送）',
    code: 'FA_MTA_TOO_MANY_RCPTS',
  },
  FA_MTA_USER_BLACK_LIST: {
    popupType: 'window',
    popupLevel: 'error',
    title: '我在别人黑名单里，没法发',
    content: '',
    code: 'FA_MTA_USER_BLACK_LIST',
  },
  FA_MTA_REJECTED: {
    popupType: 'window',
    popupLevel: 'error',
    title: '发信被拒绝',
    content: '发信被拒绝',
    code: 'FA_MTA_REJECTED',
  },
  FA_MTA_REJECTED5510: {
    popupType: 'window',
    popupLevel: 'error',
    title: '发信被拒绝',
    content: 'IP地址异常，请求被拒绝！',
    code: 'FA_MTA_REJECTED5510',
  },
  FA_MTA_REJECTED5511: {
    popupType: 'window',
    popupLevel: 'confirm',
    title: '发信被拒绝',
    content: '对不起，您的账号已被系统禁止发信，请在解禁后再重试！',
    code: 'FA_MTA_REJECTED5511',
  },
  FA_MTA_REJECTED5520: {
    popupType: 'window',
    popupLevel: 'error',
    title: '发信被拒绝',
    content: '对不起，您今天发送邮件数量超过限制，请明日再试！',
    code: 'FA_MTA_REJECTED5520',
  },
  FA_MTA_REJECTED5521: {
    popupType: 'window',
    popupLevel: 'error',
    title: '发信被拒绝',
    content: '短时间发信过多，请稍后再试！',
    code: 'FA_MTA_REJECTED5521',
  },
  FA_MTA_REJECTED5522: {
    popupType: 'window',
    popupLevel: 'error',
    title: '发信被拒绝',
    content: '操作过于频繁，请求被拒绝！',
    code: 'FA_MTA_REJECTED5522',
  },
  FA_MTA_REJECTED5530: {
    popupType: 'window',
    popupLevel: 'error',
    title: '发信被拒绝',
    content: '对不起，您今天发送对象过多，请明日再试！',
    code: 'FA_MTA_REJECTED5530',
  },
  FA_MTA_REJECTED5531: {
    popupType: 'window',
    popupLevel: 'error',
    title: '发信被拒绝',
    content: '短时间发送对象过多，请稍候尝试！',
    code: 'FA_MTA_REJECTED5531',
  },
  FA_MTA_REJECTED5532: {
    popupType: 'window',
    popupLevel: 'error',
    title: '发信被拒绝',
    content: '对不起，您本次群发的收件人数量超过限制，请减少后重发！',
    code: 'FA_MTA_REJECTED5532',
  },
  FA_MTA_REJECTED5540: {
    popupType: 'window',
    popupLevel: 'error',
    title: '发信被拒绝',
    content: '系统检测到邮件中可能包含推广/营销性质内容，已终止邮件发送。请您注意，过多发送推广/营销性质邮件可能会影响您其他正常邮件的发送。',
    code: 'FA_MTA_REJECTED5540',
  },
  FA_MTA_REJECTED4512: {
    popupType: 'window',
    popupLevel: 'error',
    title: '发信被拒绝',
    content: '系统检测到邮件中可能包含推广/营销性质内容，已终止邮件发送。请您注意，过多发送推广/营销性质邮件可能会影响您其他正常邮件的发送。',
    code: 'FA_MTA_REJECTED4512',
  },
  FA_MTA_REJECTED5910: {
    popupType: 'window',
    popupLevel: 'error',
    title: '发信被拒绝',
    content: '系统检测到邮件中可能包含推广/营销性质内容，已终止邮件发送。请您注意，过多发送推广/营销性质邮件可能会影响您其他正常邮件的发送。',
    code: 'FA_MTA_REJECTED5910',
  },
  FA_MTA_REJECTED5911: {
    popupType: 'window',
    popupLevel: 'error',
    title: '发信被拒绝',
    content: '对不起，您只能发送邮件给系统管理员！',
    code: 'FA_MTA_REJECTED5911',
  },
  FA_MTA_MULTI_ERROR: {
    popupType: 'customer',
    popupLevel: 'error',
    title: '部分联系人发送失败',
    content: '',
    code: 'FA_MTA_MULTI_ERROR',
  },
  FA_FOLDER_NOT_FOUND: {
    popupType: 'window',
    popupLevel: 'error',
    title: '文件夹已被删除，请选择其他文件夹',
    content: '',
    code: 'FA_FOLDER_NOT_FOUND',
  },
  FA_ID_NOT_FOUND: {
    popupType: 'window',
    popupLevel: 'error',
    title: '邮件附件上传存在错误，故已经自动删除所有附件，',
    content:
      '请尝试重传附件后再发送,文中图片也属于附件，请删除后重新添加，如无附件可尝试直接重发,可能的原因：发信过程中系统因特殊原因进行了自动重新登录，导致之前上传的附件无法找回',
    code: 'FA_ID_NOT_FOUND',
  },
  FA_MAIL_REMOVE_DISABLE: {
    popupType: 'toast',
    popupLevel: 'warn',
    title: '没有删除权限，请联系管理员',
    content: '没有删除权限，请联系管理员',
    code: 'FA_MAIL_REMOVE_DISABLE',
  },
  FA_OVERFLOW: {
    popupType: 'window',
    popupLevel: 'error',
    title: '邮件大小超限，请删除部分内容或附件后重试',
    content: '',
    code: 'FA_OVERFLOW',
  },
  FA_UPLOAD_SIZE_EXCEEDED: {
    popupType: 'window',
    popupLevel: 'error',
    title: '附件大小超限',
    content: '',
    code: 'FA_UPLOAD_SIZE_EXCEEDED',
  },
  // 空间错误码开始
  10100: {
    popupType: 'window',
    popupLevel: 'error',
    title: '暂无权限进行此操作',
    content: '',
    code: '10100',
  },
  10101: {
    popupType: 'window',
    popupLevel: 'error',
    title: '授权记录不存在',
    content: '',
    code: '10101',
  },
  10102: {
    popupType: 'window',
    popupLevel: 'error',
    title: '无效用户信息',
    content: '',
    code: '10102',
  },
  10103: {
    popupType: 'window',
    popupLevel: 'error',
    title: '获取登录状态失败',
    content: '',
    code: '10103',
  },
  10104: {
    popupType: 'window',
    popupLevel: 'error',
    title: '文件没有权限',
    content: '',
    code: '10104',
  },
  10105: {
    popupType: 'window',
    popupLevel: 'error',
    title: '文件夹没有权限',
    content: '',
    code: '10105',
  },
  10106: {
    popupType: 'window',
    popupLevel: 'error',
    title: '抱歉，暂不支持删除及编辑本人相关权限',
    content: '',
    code: '10106',
  },
  10107: {
    popupType: 'window',
    popupLevel: 'error',
    title: '管理后请求参数错误',
    content: '',
    code: '10107',
  },
  10108: {
    popupType: 'window',
    popupLevel: 'error',
    title: '管理后台签名过期',
    content: '',
    code: '10108',
  },
  10109: {
    popupType: 'window',
    popupLevel: 'error',
    title: '管理后台签名解析错误',
    content: '',
    code: '10109',
  },
  10200: {
    popupType: 'window',
    popupLevel: 'error',
    title: '删除失败',
    content: '',
    code: '10200',
  },
  10201: {
    popupType: 'window',
    popupLevel: 'error',
    title: '部分文件删除失败',
    content: '',
    code: '10201',
  },
  10202: {
    popupType: 'window',
    popupLevel: 'error',
    title: '子文件夹不为空不允许删除',
    content: '',
    code: '10202',
  },
  10203: {
    popupType: 'window',
    popupLevel: 'error',
    title: '预览失败，请稍后再试',
    content: '',
    code: '10203',
  },
  10204: {
    popupType: 'window',
    popupLevel: 'error',
    title: '文件夹不存在',
    content: '',
    code: '10204',
  },
  10205: {
    popupType: 'window',
    popupLevel: 'error',
    title: '打包下载服务出错',
    content: '',
    code: '10205',
  },
  10206: {
    popupType: 'window',
    popupLevel: 'error',
    title: '无法打开，已设置安全锁',
    content: '',
    code: '10206',
  },
  10207: {
    popupType: 'window',
    popupLevel: 'error',
    title: '文件不存在',
    content: '',
    code: '10207',
  },
  10300: {
    popupType: 'window',
    popupLevel: 'error',
    title: '文件夹名称长度超限',
    content: '',
    code: '10300',
  },
  10301: {
    popupType: 'window',
    popupLevel: 'error',
    title: '您选择的文件大小超过5G上限，不能上传',
    content: '',
    code: '10301',
  },
  10302: {
    popupType: 'window',
    popupLevel: 'error',
    title: '无法创建文件夹,文件夹层级最多为9级',
    content: '',
    code: '10302',
  },
  10303: {
    popupType: 'window',
    popupLevel: 'error',
    title: '备注长度超限',
    content: '',
    code: '10303',
  },
  10304: {
    popupType: 'window',
    popupLevel: 'error',
    title: '您选择的文件大小超过当前文件夹可用容量,不能上传',
    content: '',
    code: '10304',
  },
  10600: {
    popupType: 'window',
    popupLevel: 'error',
    title: '参数错误',
    content: '',
    code: '10600',
  },
  10403: {
    popupType: 'customer',
    popupLevel: 'error',
    title: '未开通空间',
    content: '',
    code: '10403',
  },
  500: {
    popupType: 'customer',
    popupLevel: 'error',
    title: '服务器错误',
    content: '',
    code: '500',
  },
  503: {
    popupType: 'customer',
    popupLevel: 'error',
    title: '服务器繁忙',
    content: '',
    code: '503',
  },
  // 空间错误码结束
  // FA_ATTACH_NOT_FOUND:{
  //   popupType: "window",
  //   popupLevel: "error",
  //   title: "无法发送，系统错误",
  //   content: "找不到写信任务",
  //   code: "FA_COMPOSE_NOT_FOUND",
  // },
  // FA_ATTACH_NOT_FOUND:{
  //   popupType: "window",
  //   popupLevel: "error",
  //   title: "无法发送，系统错误",
  //   content: "找不到写信任务",
  //   code: "FA_COMPOSE_NOT_FOUND",
  // },
  // FA_ATTACH_NOT_FOUND:{
  //   popupType: "window",
  //   popupLevel: "error",
  //   title: "无法发送，系统错误",
  //   content: "找不到写信任务",
  //   code: "FA_COMPOSE_NOT_FOUND",
  // },
  // FA_ATTACH_NOT_FOUND:{
  //   popupType: "window",
  //   popupLevel: "error",
  //   title: "无法发送，系统错误",
  //   content: "找不到写信任务",
  //   code: "FA_COMPOSE_NOT_FOUND",
  // },
  // FA_ATTACH_NOT_FOUND:{
  //   popupType: "window",
  //   popupLevel: "error",
  //   title: "无法发送，系统错误",
  //   content: "找不到写信任务",
  //   code: "FA_COMPOSE_NOT_FOUND",
  // },
  // FA_ATTACH_NOT_FOUND:{
  //   popupType: "window",
  //   popupLevel: "error",
  //   title: "无法发送，系统错误",
  //   content: "找不到写信任务",
  //   code: "FA_COMPOSE_NOT_FOUND",
  // },
  // FA_ATTACH_NOT_FOUND:{
  //   popupType: "window",
  //   popupLevel: "error",
  //   title: "无法发送，系统错误",
  //   content: "找不到写信任务",
  //   code: "FA_COMPOSE_NOT_FOUND",
  // }
};

// FA_OVERFLOW 原因映射
export const FA_OVERFLOW_REASON_MAP = {
  pref_smtp_max_num_rcpts: '收件人个数超过限制！',
  pref_smtp_max_send_mail_size: '信件大小超过限制！',
  pref_flow_limit: '信件流量超过限制！',
  pref_quota: '存草稿或定时发信容量超过限制！',
};

export const FolderErrResult: StringTypedMap<PopUpMessageInfo> = {
  FA_OVERFLOW: {
    popupType: 'toast',
    popupLevel: 'error',
    title: '超过最大文件夹个数限制',
    content: '',
    code: 'FA_OVERFLOW',
  },
  FA_NAME_INVALID: {
    popupType: 'toast',
    popupLevel: 'error',
    title: '非法文件夹名称',
    content: '',
    code: 'FA_NAME_INVALID',
  },
  FA_FORBIDDEN: {
    popupType: 'toast',
    popupLevel: 'error',
    title: '操作不允许',
    content: '',
    code: 'FA_FORBIDDEN',
  },
  FA_HAS_CHILD: {
    popupType: 'toast',
    popupLevel: 'error',
    title: '有子文件夹，不允许删除',
    content: '',
    code: 'FA_HAS_CHILD',
  },
  FA_PARENT_NOT_FOUND: {
    popupType: 'toast',
    popupLevel: 'error',
    title: '找不到指定的父文件夹',
    content: '',
    code: 'FA_PARENT_NOT_FOUND',
  },
  FA_NAME_EXISTS: {
    popupType: 'toast',
    popupLevel: 'error',
    title: '文件夹名称重复',
    content: '',
    code: 'FA_NAME_EXISTS',
  },
  FA_ID_NOT_FOUND: {
    popupType: 'toast',
    popupLevel: 'error',
    title: '找不到指定的文件夹',
    content: '',
    code: 'FA_ID_NOT_FOUND',
  },
  FA_INVALID_PARENT: {
    popupType: 'toast',
    popupLevel: 'error',
    title: '父文件夹不合法',
    content: '',
    code: 'FA_INVALID_PARENT',
  },
};
