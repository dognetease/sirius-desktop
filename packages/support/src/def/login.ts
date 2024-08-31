export default {
  mobileVerifyCode: '/__prefix__domain/action/mobileVerifyCode',
  mobileLoginActive: '/__prefix__domain/action/mobileLoginActive',
  mobileTokenLogin: '/__prefix__domain/mobileTokenLogin',
  refreshToken: '/__prefix__domain/action/refreshToken',
  refreshTokenLogin: '/__prefix__domain/refreshLogin',
  getMobileLoginToken: '/__prefix__domain/action/getMobileLoginToken',
  getPwdRule: '/__prefix__domain/action/getPwdRule',
  updatePwd: '/__prefix__domain/action/updatePassword',
  preLogin: '/__prefix__domain/preLogin',
  mobileLogin: '/__prefix__domain/mobileLogin',
  emailLogin: '/__prefix__domain/emailLogin',
  sendCode: '/__prefix__domain/action/mobileSendCode',
  emailSendCode: '/__prefix__domain/action/emailSendCode',
  edmLoginReport: '/it-others/api/biz/account/first/login/record',
  selfUnBlocking: '/__prefix__domain/action/selfUnblocking',
  applyUnBlocking: '/__prefix__domain/action/applyUnblocking',
  login: '/__prefix__domain/domainEntLogin',
  preLoginCheck: '/edisk/api/pub/share/identify',
  newPreLoginCheck: '/config/api/pub/client/identify/domain',
  qrcodeCheck: '/miniapp/qrcode/check',
  qrCodeCreate: '/miniapp/qrcode/create',
  // preLogin: `${CORP_MAIL_LOGIN_PREFIX}/preLogin`,
  logout: '/__prefix__logout.jsp', // from=mailhz.qiye.163.com&uid=shisheng@qy.163.com&domain=qiye.163.com"
  loginDoor: '/__prefix__entry/door',
  clientEnableIM: '/im/api/biz/client/info',
  clientInfo: '/config/api/biz/client/info',
  updatePwdAfterLogin: '/__prefix__qiyeurs/passchange/updatePassword',
  getPwdRuleAfterLogin: '/__prefix__qiyeurs/passchange/getPwdRule',
  notifyLoginSuc: '/__prefix__commonweb/alert/sendSiriusWelcomeMail',
  // 获取权限
  getPrivilegeAll: '/privilege/api/biz/product/version/feature/privilege/getAll/v2',
  getPrivilege: '/privilege/api/biz/product/version/feature/privilege/get/v2',

  getProductTags: '/privilege/api/biz/product/version/tag/getAll',
  // 登录代理账号
  loginAgentEmail: '/__prefix__domain/agentAccountLogin',
  // 获取客户端配置信息
  getMailClientConfig: '/config/client/getMailClientConfig',
  // webmail活动相关
  getActivityInfo: '/lxactivity/api/biz/activity/info',
  joinActivity: '/lxactivity/api/biz/activity/join',
  invokeActivity: '/lxactivity/api/biz/activity/record',
  // 切换公共账号相关
  switchSharedAccount: '/__prefix__domain/sharedSwitchLogin',
  loginGetAccount: '/__prefix__commonweb/account/getAccountBaseInfo',
  // 外部跳转相关
  getLoginCode: '/sirius/it-others/api/biz/sirius/login/code',
  // loginJump: '/sirius/it-others/api/pub/login/jump',
  // 获取是否展示企业邮引流的入口
  getEntranceVisibleConfig: '/privilege/api/biz/account/product/privilege/entrance',
  // 引流弹窗配置
  setEntrancePopupVisible: '/privilege/api/biz/account/product/privilege/entrance/popup',
};
