export default {
  getBindInfo: '/__prefix__commonweb/mobile/getBindInfo',
  // 获取手机号绑定及邮件转发权限信息
  getBindAndForwardInfo: '/__prefix__commonweb/filterfw/getMobileServiceNo.do',
  // 发送手机验证码，用于来信分类
  sendVerificationCode: '/__prefix__commonweb/filterfw/vsmspush.do',
  // 验证手机验证码，用于来信分类
  checkVerificationCode: '/__prefix__commonweb/filterfw/vsmsverify.do',
  getIsAdmin: '/__prefix__commonweb/account/isAdmin',
  getIsNewAccount: '/it-others/api/biz/account/new/get',
  getBindAccountList: '/commonweb/account/getBindAccountList',
  getBJBindAccountList: '/bjcommonweb/account/getBindAccountList',
  getVerifyCode: '/__prefix__commonweb/mobile/getCode',
  getCancelVerifyCode: '/__prefix__commonweb/mobile/getCancelCode',
  bindMobile: '/__prefix__commonweb/mobile/addBindInfo',
  updateBindMobile: '/__prefix__commonweb/mobile/updateBindInfo',
  unbindMobile: '/__prefix__commonweb/mobile/cancelMobile',
  // 登录设备配置设置
  getDeviceList: '/__prefix__commonweb/logindevice/list',
  deleteDevice: '/__prefix__commonweb/logindevice/del',
  // 登录设备绑定
  bindAccountDevice: '/device/api/biz/device/bind/account',
  // 多账号相关接口
  addQiyeMailSubAccount: '/__prefix__commonweb/accountloginref/saveReference',
  createPersonalSubAccount: '/__prefix__commonweb/agentaccount/createAccount',
  getBindPersonalSubAccounts: '/__prefix__commonweb/agentaccount/getAccountList',
  getQiyeMailBindSubAccounts: '/__prefix__commonweb/accountloginref/getReferenceList',
  deletePersonalSubAccount: '/__prefix__commonweb/agentaccount/deleteAccount',
  deleteQiyeMailSubAccount: '/__prefix__commonweb/accountloginref/deleteReference',
  editPersonalSubAccount: '/__prefix__commonweb/agentaccount/updateAccount',
  // 公共账号
  getSharedAccounts: '/__prefix__commonweb/account/getAccountRelation',
  setUserConfig: '/mail-enhance/api/biz/account/setting/upload-attrs', // 设置用户配置 晓波接口
  getUserConfig: '/mail-enhance/api/biz/account/setting/get-attrs', // 获取用户配置
  sendCosUpgrade: '/commonweb/notice/sendCosUpgrade', // 发送升级邮箱版本通知信
  accountGetToken: '/commonweb/token/getToken', // 获取子邮箱token

  // 获取管理后台设置面面&管理后台云附件权限
  getAccountRight: '/commonweb/account/getAccountRight',
};
