import { navigate } from '@reach/router';
import { useSessionStorageState } from 'ahooks';
import { api, apis, InsertWhatsAppApi } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

/**
 * @whatsAppNumbers 群发账号
 * @key session key
 */

export default (key?: string) => {
  const sessionKey = key || 'WaMarketingWhatsApp';
  const [_, setWhatsAppNumbers] = useSessionStorageState<string[]>(sessionKey, {
    defaultValue: [],
  });
  const waBulkSend = async (whatsAppNumbers: string[]) => {
    const configData = await whatsAppApi.getWaMultiSendQuota();
    if (configData.remainCount <= 0) {
      SiriusMessage.warning({
        content: '暂无发送量额度',
      });
      return;
    }
    if (whatsAppNumbers?.length) {
      setWhatsAppNumbers(whatsAppNumbers);
      let path = '#edm?page=createMarketBulk';
      path += `&key=${sessionKey}`;
      navigate(path);
    }
  };
  return { waBulkSend };
};

/**
 * 加群中间页群发通过hooks
 * @keyWord 关键词
 * @taskId 任务id
 * @groupId 群id
 * @time 加群时间 'YYYY-MM-DD';
 */
export const useTaskBulkSend = () => {
  const bulkSend = async (keyWord: string, taskId: string, groupId?: string, time?: string) => {
    const configData = await whatsAppApi.getWaMultiSendQuota();
    if (configData.remainCount <= 0) {
      SiriusMessage.warning({
        content: '暂无发送量额度',
      });
      return;
    }
    if (keyWord && (taskId || groupId)) {
      let path = '#edm?page=createMarketBulk';
      path += `&keyWord=${keyWord}&taskId=${taskId}&groupId=${groupId}&time=${time}`;
      navigate(path);
    }
  };
  return {
    bulkSend,
  };
};
