const LOG_SERVER_PREFIX = '/feedback/api';
export default {
  // 问题反馈获取nos上传凭证
  getNosToken: `${LOG_SERVER_PREFIX}/admin/upload/token`,
  // 问题反馈提交
  submitFeedback: `${LOG_SERVER_PREFIX}/admin/feedback`,
  // 获取是否需要上传日志的配置
  getLogConfig: `${LOG_SERVER_PREFIX}/admin/log/config`,
  // 日志元数据上传
  uploadLog: `${LOG_SERVER_PREFIX}/admin/log/upload-info`,
};
