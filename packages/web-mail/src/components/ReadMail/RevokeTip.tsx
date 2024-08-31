import React from 'react';
import { apiHolder as api, apis, DataTrackerApi, MailApi } from 'api';
import RevokeCountDown from '@web-mail/components/RevokeCountDown/RevokeCountDown';
import { actions as mailActions, SendingMail } from '@web-common/state/reducer/mailReducer';
import { useAppDispatch } from '@web-common/state/createStore';
import { reOpenMail } from '@web-mail/util';
import { getIn18Text } from 'api';

const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface Props {
  sendingMail: SendingMail;
}

const RevokeTip: React.FC<Props> = ({ sendingMail }) => {
  const { id, createTime } = sendingMail;
  const dispatch = useAppDispatch();

  // 撤销
  const revoke = async () => {
    trackApi.track('pcMail_click_cancelSend_mailDetailPage', {});
    const { id, tid, sentTInfo } = sendingMail;
    // 清除redux
    dispatch(mailActions.doRemoveSendingMail(id));
    try {
      const cancelRes = await mailApi.doCancelDeliver({ tid, tinfo: sentTInfo, mailTrace: true });
      // 撤回失败
      if (!cancelRes.success) {
        return;
      }
      reOpenMail(sendingMail);
    } catch (error) {
      console.log('撤销失败', error);
    }
  };

  return (
    <div className="mail-revoke">
      <div className="mail-count-down">
        <RevokeCountDown
          id={id}
          createTime={createTime as number}
          attrs={{
            strokeColor: '#4C6AFF',
            strokeLinecap: 'butt',
            trailColor: '#E1E3E8',
            strokeWidth: 7.5,
            width: 21,
          }}
          leftSecStyle={{
            fontWeight: 400,
            fontSize: '12px',
            color: '#4C6AFF',
          }}
        />
      </div>
      <span className="mail-sending">{getIn18Text('FASONGZHONG..')}</span>
      <div className="mail-revoke-button" onClick={() => revoke()}>
        {getIn18Text('CHEXIAO')}
      </div>
    </div>
  );
};

export default RevokeTip;
