import { apiHolder, apis, CustomerApi, EdmSendBoxApi, newMyClueListReq } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import Toast from '@web-common/components/UI/Message/SiriusMessage';

export const hasPrivilege = (id: string, type: 'clue' | 'company' | 'opportunity' | 'open_sea' | 'customer_open_sea', callback: (param: boolean) => void) => {
  if (type === 'open_sea') {
    clientApi
      .openSeaValid(id)
      .then(res => {
        callback(true);
      })
      .catch(res => {
        Toast.error({
          content: res,
        });
        callback(false);
      });
  }
  if (type === 'clue') {
    clientApi
      .clueValid(id)
      .then(res => {
        callback(true);
      })
      .catch(res => {
        Toast.error({
          content: res,
        });
        callback(false);
      });
  }
  if (type === 'company') {
    clientApi
      .companyValid(id)
      .then(res => {
        callback(true);
      })
      .catch(res => {
        Toast.error({
          content: res,
        });
        callback(false);
      });
  }
  if (type === 'opportunity') {
    clientApi
      .opportunityValid(id)
      .then(res => {
        callback(true);
      })
      .catch(res => {
        Toast.error({
          content: res,
        });
        callback(false);
      });
  }
  if (type === 'customer_open_sea') {
    clientApi
      .openSeaCustomerValid(id)
      .then(res => {
        callback(true);
      })
      .catch(res => {
        Toast.error({
          content: res,
        });
        callback(false);
      });
  }
};
