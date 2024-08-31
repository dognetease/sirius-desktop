export const SUB_ACCOUNT_TYPES = {
  NETEASE_QIYE_MAIL: 'NeteaseQiYeMail',
  QQ_MAIL: 'QQMail',
  MAIL_163: '163Mail',
  OTHERS: 'Others',
};

export const DEFAULT_API_ERROR = '系统错误，请稍后重试';

export const DEFAULT_BIND_ACCOUNT_ERR = '绑定账号失败';

export const SUB_ACCOUNT_ERRCODE_MAPS: { [key: string]: string } = {
  'ACCOUNT.LOGINREF.CREATE.OVERFLOW': '关联账号超过限制',
  'ACCOUNT.LOGINREF.CREATE.EXIST': '已绑定该账号',
  'AGENTACCOUNT.PASSWORD.ERROR': '账号或授权码错误',
  'AGENTACCOUNT.CREATE.BIND.OVERFLOW': '绑定达到最大数量',
  'AGENTACCOUNT.AGENTEMAIL.EXIST': '已绑定相同账号',
  'AGENTACCOUNT.CREATE.DOMAINTYPE.ERR': '仅支持绑定域名的账号',
  'AGENTACCOUNT.CREATE.BIND.FORBIT': '不允许绑定网易企业邮箱账号',
  'MAILACCOUNT.NAMEEXIST': '已绑定相同账号',
  'ERR.APIRESULT.NULL': '系统繁忙，请稍后再试',
};

export const SEND_CODE_DEFAULT_ERROR = `发送失败，请稍后再试`;

export const SELF_UNBLOCK_DEFAULT_ERROR = `解锁失败，请重试`;
