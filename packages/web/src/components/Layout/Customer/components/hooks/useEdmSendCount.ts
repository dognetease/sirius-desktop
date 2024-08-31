import { useEffect } from 'react';
import { navigate } from '@reach/router';
import { apiHolder, apis, EdmSendBoxApi, PrevScene, SourceNameType, TaskChannel, getIn18Text, environment } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import Confirm from '../confirm/confirm';
import { guardString } from '../../../../../../../web-edm/src/utils';

export const env = typeof environment === 'string' ? environment : 'local';
export const isDev = !['prod', 'prev'].includes(env);

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export const getSendCount = async (params: {
  emailList: IEdmEmailList[];
  sendType?: 'filter' | 'normal';
  businessType?: string;
  draftId?: string;
  sourcePage?: string;
  from?: PrevScene;
  back?: string;
  channel?: TaskChannel;
}) => {
  const { emailList, sendType, businessType, draftId, sourcePage, from, back, channel } = params;

  edmApi.getSendCount().then(data => {
    if (isDev && (!from || from === 'default')) {
      throw new Error('请明确业务来源(from)字段, 不接受 default 来源');
    }
    if (data.availableSendCount >= emailList.length && data.singleSendCount >= emailList.length) {
      localStorage.setItem('customerMarketingEmails', JSON.stringify(emailList));

      let path = '#edm?page=write';

      path += '&key=customerMarketingEmails';

      const fromPage = from || 'customer';
      if (guardString(fromPage)) {
        path += `&from=${fromPage}`;
      }
      if (guardString(businessType)) {
        path += `&businessType=${businessType}`;
      }
      if (guardString(sendType)) {
        path += `&sendType=${sendType}`;
      }
      if (guardString(draftId)) {
        path += `&draftId=${draftId}`;
      }
      if (guardString(back)) {
        path += `&back=${back}`;
      }
      if (guardString(sourcePage)) {
        path += `&sourcePage=${sourcePage}`;
      }
      if (channel) {
        path += `&channel=${channel}`;
      }
      path += `&_t=${new Date().getTime()}`;

      navigate(path);
    } else {
      console.log('data-count', data);
      if (emailList.length > data.availableSendCount) {
        Confirm({ title: `发件数超过限额，当前剩余${data.availableSendCount}条` });
      } else {
        Confirm({ title: `发件数超过单次限额，单次限额${data.singleSendCount}条` });
      }
    }
  });
};

export interface IEdmEmailList {
  contactName: string;
  contactEmail: string;
  sourceName?: SourceNameType;
  increaseSourceName?: PrevScene;
  contactStatusList?: number[];
  verifyStatusList?: number[];
  verifyStatus?: number;
}

export const useEdmSendCountV2 = (params: {
  emailList: IEdmEmailList[];
  sendType?: 'filter' | 'normal';
  businessType?: string;
  draftId?: string;
  sourcePage?: string;
  from?: PrevScene;
  back?: string;
  channel?: TaskChannel;
  /** crm 触发来源 */
  tableId?: 'customer' | 'leads';
}) => {
  const { emailList, sendType, businessType, draftId, sourcePage, from, back, channel, tableId } = params;
  useEffect(() => {
    console.log('一键营销-hooks', emailList);
    if (emailList.length) {
      if (emailList.length === 1 && emailList[0].contactEmail === 'noEmials') {
        const content = tableId === 'leads' ? '所选线索暂无邮箱' : getIn18Text('SUOXUANKEHUZANWUYOUXIANG');
        SiriusMessage.warning({
          content,
        });
      } else {
        getSendCount({ emailList, sendType, businessType, draftId, sourcePage, from, back, channel });
      }
    }
  }, [emailList]);
};
export default (
  emailList: IEdmEmailList[],
  sendType?: 'filter' | 'normal',
  businessType?: string,
  draftId?: string,
  sourcePage?: string,
  from?: PrevScene,
  back?: string,
  channel?: TaskChannel
) => {
  useEdmSendCountV2({
    emailList,
    sendType,
    businessType,
    draftId,
    sourcePage,
    from,
    back,
    channel,
  });
};
