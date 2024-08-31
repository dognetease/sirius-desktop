import { message } from 'antd';
import { apiHolder, apis, EdmSendBoxApi, DataStoreApi, getIn18Text } from 'api';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

/**
 * 获取营销任务内容，并跳转至编辑页
 * 抛出错误，需要处理
 */
export const getTaskContent = async (edmEmailId: string) => {
  if (edmEmailId === '') {
    return message.error(getIn18Text('edmEmai'));
  }
  const { contentEditInfo } = await edmApi.copyFromSendBox({ edmEmailId });
  const content = contentEditInfo.emailContent;
  return content;
};
