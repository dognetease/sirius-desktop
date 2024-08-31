const CORP_MAIL_LOGIN_PREFIX = '/corp-mail/auth';
export default {
  // 新的预登录，兼容corpMail和hMail，不用考虑节点
  corpPreLogin: `${CORP_MAIL_LOGIN_PREFIX}/preLogin`,
  // #region corpMail设备配置相关
  corpGetDeviceList: `${CORP_MAIL_LOGIN_PREFIX}/devices`,
  corpDeleteDevice: `${CORP_MAIL_LOGIN_PREFIX}/removeDevice`,
  corpMailGetVerifyCode: `${CORP_MAIL_LOGIN_PREFIX}/getVerifyCode`, // 图形验证码地址
  corpMailPwdLogin: `${CORP_MAIL_LOGIN_PREFIX}/login`, // 邮箱密码登录
  coreMailSendPhoneCode: `${CORP_MAIL_LOGIN_PREFIX}/sendMobileCode`, // 发送手机验证码
  corpMailPhoneCodeLogin: `${CORP_MAIL_LOGIN_PREFIX}/mobileLogin`, // 手机验证码登录
  corpMailRenewSid: `${CORP_MAIL_LOGIN_PREFIX}/renew`, // 刷新sid
};
