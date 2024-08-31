import React, { useState, useEffect } from 'react';
import style from './index.module.scss';
import classnames from 'classnames';
import { apis, apiHolder as api, MailApi as MailApiType, DataStoreApi, DataTrackerApi } from 'api';
import { MailActions, useActions } from '@web-common/state/createStore';
import message from '@web-common/components/UI/Message/SiriusMessage';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import IconCard from '@web-common/components/UI/IconCard';
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApiType;
const storeApi: DataStoreApi = api.api.getDataStoreApi();
interface Props {
  id: string;
  account?: string;
}
const RequestReadReceipt: React.FC<Props> = ({ id, account }) => {
  const sendMDN = () => {
    trackApi.track('pcMail_click_button_readReceipt_mailDetailPage', { buttonName: '发送已读回执' });
    MailApi.handleSendMDN(id, account)
      .then(() => {
        MailApi.doMarkMail(false, id, 'requestReadReceiptLocal', undefined, undefined, undefined, account);
        message.success('回执发送成功');
        storeApi.get('receiptDoneIds').then(res => {
          storeApi.put('receiptDoneIds', res.data + id);
        });
      })
      .catch(() => {
        message.success('回执发送失败，请重试');
      });
  };

  const notSendMDN = () => {
    trackApi.track('pcMail_click_button_readReceipt_mailDetailPage', { buttonName: '不发送已读回执' });
    MailApi.doMarkMail(false, id, 'requestReadReceiptLocal', undefined, undefined, undefined, account);
    storeApi.get('receiptDoneIds').then(res => {
      storeApi.put('receiptDoneIds', res.data + id);
    });
  };

  useEffect(() => {
    trackApi.track('pcMail_show_readReceipt_mailDetailPage');
  }, []);

  return (
    <>
      <div className={style.wrapper}>
        <div className={style.desc}>
          <IconCard type="tongyong_youxiang4" className="dark-invert" />
          <span className={style.descText}>发件人希望得到你收到邮件的回执，是否发送？</span>
        </div>

        <div>
          <span className={classnames(style.btn)} onClick={sendMDN}>
            发送
          </span>
          <span className={classnames(style.btn, style.nosend)} onClick={notSendMDN}>
            不发送
          </span>
        </div>
      </div>
    </>
  );
};
export default RequestReadReceipt;
