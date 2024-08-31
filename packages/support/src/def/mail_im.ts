const MAIL_IM_TEAM_PREFIX = '/mail-im-team/api';
export default {
  getMailDiscuss: `${MAIL_IM_TEAM_PREFIX}/pub/e-share/e-teams`,
  // 创建邮件讨论组
  createDiscuss: `${MAIL_IM_TEAM_PREFIX}/pub/e-team/create`,
  // 获取讨论组邮件
  getDiscussMail: `${MAIL_IM_TEAM_PREFIX}/pub/e-team/e-msgs`,
  // 邮件消息详情
  getDiscussMailDetail: `${MAIL_IM_TEAM_PREFIX}/pub/e-team/e-msg`,
  // 解除邮件和讨论组绑定
  cancelDiscussBind: `${MAIL_IM_TEAM_PREFIX}/pub/e-share/cancel`,
  // 讨论组邮件详情下载附件
  discussMailAttach: `${MAIL_IM_TEAM_PREFIX}/pub/e-team/e-msg/attach`,
  // 邮件分享
  shareMail: `${MAIL_IM_TEAM_PREFIX}/pub/e-share/create`,
};
