export default {
  mailOperation: '/__prefix__js6/s',
  mailProxyOperation: '/__prefix__commonweb/proxy/js6/s', // 单独附件下载走这个
  mailDownloadProxy: '/__prefix__commonweb/proxy/js6/read/readdata.jsp',
  mailDownload: '/__prefix__js6/read/readdata.jsp', // 单独下载邮件
  mailPreview: '/__prefix__preview/preview.do',
  filePreview: '/mailpreview/api/pub/preview',
  mailTraceStatus: '/__prefix__rdmailquery/mail/getMailStatus',
  mailReadList: '/__prefix__rdmailquery/mail/queryReadRecordDetail',
  mailsReadStatus: '/__prefix__rdmailquery/mail/batchQueryMailRcptStatus',
  entSignatureForMail: '/__prefix__commonweb/account/getLetterAngle',
  getRiskReminderStatus: '/__prefix__commonweb/alert/getSetting',

  updateRiskReminderStatus: '/__prefix__commonweb/alert/updateSetting',
  readPack: '/__prefix__js6/read/readpack.jsp', // 打包附件下载
  readPackProxy: '/__prefix__commonweb/proxy/js6/read/readpack.jsp', // 打包附件下载
  getFjFile: '/__prefix__js6/fj/getFile.jsp', // 往来附件下载
  genMailOnlineJumpURL: '/cowork/api/biz/redirect/gen_url',
  getRelatedMail: '/customer/api/biz/exchange/email_list',
  mailAttachmentUploadHost: 'https://wanproxy-web.127.net/',
  getMaillistMember: '/__prefix__commonweb/maillist/getMaillistMember', // 查看邮件列表成员
  createMaillist: '/__prefix__commonweb/maillist/createMaillist', // 创建邮件列表成员
  updateMaillist: '/__prefix__commonweb/maillist/updateMaillist', // 编辑邮件列表成员
  deleteMaillist: '/__prefix__commonweb/maillist/deleteMaillist', // 删除邮件列表成员
  listUserDomain: '/__prefix__commonweb/domain/listUserDomain', // 获取域名列表
  listUserMaillist: '/__prefix__commonweb/maillist/listUserMaillist', // 我管理的邮件列表
  getMaillist: '/__prefix__commonweb/maillist/getMaillist', // 查看邮件列表详情
  getMaillistConfig: '/__prefix__commonweb/account/getMaillistConfig', // 获取用户基本信息
  checkMaillistAccountName: '/__prefix__commonweb/maillist/checkMaillistAccountName', // 校验邮箱列表账号
  getThumbUpInfo: '/mail-enhance/api/biz/emoticon/info', // 查询详情页点赞信息
  getMailGPTQuote: '/mail-enhance/api/biz/mail/gpt/quota', // 办公AI写信 润色剩余次数
  getMailGPTConfig: '/mail-enhance/api/biz/mail/gpt/config', // 办公AI写信 润色语言设置
  getMailGPTHistory: '/mail-enhance/api/biz/mail/gpt/history', // 办公AI写信 润色历史记录
  doTranslateGPTAiContent: '/others/api/mail/cloud-translate/multi-html', // 办公AI写信 润色 翻译
  getMailGPTWrite: '/mail-enhance/api/biz/mail/gpt/email-write', // 办公AI写信
  getMailGPTPolish: '/mail-enhance/api/biz/mail/gpt/email-polish', // 办公AI润色
  setThumbUpCreate: '/mail-enhance/api/biz/emoticon/create', // 点赞/取消点赞
  getTranslateContentByText: '/others/api/mail/cloud-translate/text', // 翻译文本
  getTranslateContentByHtml: '/others/api/mail/cloud-translate/html', // 翻译富文本
  detectMailContentLang: '/others/api/mail/cloud-translate/detect-lang', // 翻译文本语言探测
  getEnglishGrammar: '/others/api/mail/cloud-correct/en-text', // 语法纠错
  getCustomerMail: '/mail-plus/api/biz/email/list', // 客户邮件列表
  getSubordinateMail: '/mail-plus/api/biz/email/search', // 下属邮件列表
  getMailConfig: '/mail-enhance/api/biz/setting/shortcut/detail', // 获取邮箱快捷设置
  setMailConfig: '/mail-enhance/api/biz/setting/shortcut/upload', // 设置邮箱快捷设置
  getDefaultCCBCC: '/mail-enhance/api/biz/setting/cc_bcc/detail', // 获取邮箱快捷设置
  setDefaultCCBCC: '/mail-enhance/api/biz/setting/cc_bcc/upload', // 设置邮箱快捷设置
  triggerReceive: '/sirius/mail-agent-api/api/biz/mail-agent/trigger-receive', // 三方邮箱-收信插队
  getCustomerMailUnread: '/mail-plus/api/biz/email/v2/unreadNum',
  checkTpMailExist: '/mail-plus/api/biz/email/getMessageInfos',
  readTpMessage: '/mail-plus/api/biz/email/readMessage',
  getTpMailPart: '/mail-plus/api/biz/email/getMessageData',
  getTpMailPreview: '/mail-plus/api/biz/email/attach/preview',
  getDeliveryDetail: '/mail-plus/api/biz/email/distribution/detail', // 获取单封邮件分发的详情
  guessUserSetting: '/sirius/mail-agent-api/api/biz/mail-agent/guess-user-setting', // 三方登录猜测邮箱的配置
  getAuthCodeDesc: '/sirius/mail-agent-api/api/biz/mail-agent/auth-code-des', // 获取三方登录授权码说明
  transferAttachment: '/mail-plus/api/biz/email/transfer/attachment', // 附件重传
  updateDisplayEmail: '/sirius/mail-agent-api/api/biz/mail-agent/update-display-email', // 更新三方邮箱的示昵称
  getDisplayName: '/sirius/mail-agent-api/api/biz/mail-agent/get-display-email', // 获取三方邮箱显示昵称
};
