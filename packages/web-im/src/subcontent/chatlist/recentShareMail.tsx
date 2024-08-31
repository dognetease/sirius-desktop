import React, { useState, useContext, useEffect } from 'react';
import classnames from 'classnames/bind';
import lodashGet from 'lodash/get';
import { apiHolder, DataStoreApi, apis, ContactApi, DataTrackerApi } from 'api';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import styles from '../imChatList.module.scss';
import { Context as MessageContext } from '../store/messageProvider';
import { openReadOnlyMailInWinow } from '@web-mail/util';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(styles);
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const DataStore = apiHolder.api.getDataStoreApi() as DataStoreApi;
interface RecentShareMailApi {
  teamId: string;
  setSpecialPadding(flag: boolean): void;
}
interface RecentMailObj {
  avatar: string;
  nickName: string;
  subject: string;
  mailMid: string;
  teamId: string;
  time: number;
  color: string;
}
export const RecentShareMail: React.FC<RecentShareMailApi> = React.forwardRef((props, ref) => {
  const { teamId, setSpecialPadding } = props;
  const { mailList = [] } = useContext(MessageContext);
  const [showRecentMailTip, setShowRecentMailTip] = useState<boolean>(false);
  const [recentMailObj, setRecentMailObj] = useState<RecentMailObj>({} as RecentMailObj);
  useEffect(() => {
    const recentMail = mailList[0];
    const storeData = DataStore.getSync(`${teamId}-recentTip`, { noneUserRelated: true });
    const storeObj = JSON.parse(storeData.data || '{}');
    // 有最新一封邮件，无store或最新邮件消息id与从store获取的对应id不相同且最新邮件消息发送时间大于从store获取的对应time时展示tip
    if (recentMail && (!storeData?.suc || (storeObj.id !== recentMail.emailMid && recentMail.createTime > storeObj.time))) {
      contactApi.doGetContactByItem({ type: 'EMAIL', value: [recentMail?.email], filterType: 'enterprise' }).then(info => {
        setRecentMailObj({
          avatar: lodashGet(info, '[0].contact.avatar', ''),
          nickName: lodashGet(info, '[0].contact.contactName', ''),
          subject: recentMail?.subject,
          mailMid: recentMail?.emailMid,
          teamId,
          time: recentMail?.createTime,
          color: lodashGet(info, '[0].contact.color', ''),
        });
        setShowRecentMailTip(true);
      });
    } else {
      setShowRecentMailTip(false);
    }
  }, [mailList.length]);
  useEffect(() => {
    setSpecialPadding(showRecentMailTip);
  }, [showRecentMailTip]);
  const closeRecentMailTip = () => {
    setShowRecentMailTip(false);
    DataStore.put(`${recentMailObj.teamId}-recentTip`, JSON.stringify({ id: recentMailObj.mailMid, time: recentMailObj.time }), { noneUserRelated: true });
  };
  const openRecentMail = () => {
    openReadOnlyMailInWinow(recentMailObj.mailMid, teamId);
    trackApi.track('pc_click_mailChat_seeRecentMail');
  };
  const handleTrack = () => {
    trackApi.track('pc_click_mailChat_closeRecentMail');
  };
  return showRecentMailTip ? (
    <div className={realStyle('recentShareMail')}>
      <AvatarTag
        className={realStyle('recentShareMailAvatar')}
        user={{
          avatar: recentMailObj.avatar,
          name: recentMailObj.nickName,
          color: recentMailObj.color,
        }}
        size={24}
      />
      <span className={realStyle('recentShareMailFrom')}>
        {recentMailObj.nickName}
        {getIn18Text('ZUIJINFENXIANGYOU')}
      </span>
      <span
        className={realStyle('recentShareMailName')}
        onClick={() => {
          openRecentMail();
          closeRecentMailTip();
        }}
      >
        {recentMailObj.subject || getIn18Text('WUZHUTI')}
      </span>
      <span
        className={realStyle('recentShareMailClose')}
        onClick={() => {
          closeRecentMailTip();
          handleTrack();
        }}
      />
    </div>
  ) : null;
});
