import React from 'react';
import { apis, IMMessage, MailConfApi } from 'api';
import { apiHolder, SystemApi } from 'api';
import './index.scss';
import dayjs from 'dayjs';
import classnames from 'classnames/bind';
import { highlightText } from '@web-mail-write/util';
import { TeamAvatar, UserAvatar } from '../../common/imUserAvatar';
import { useYunxinAccount } from '../../common/hooks/useYunxinAccount';
import { useImTeam } from '../../common/hooks/useTeamInfo';
import { getIn18Text } from 'api';
const systemApi: SystemApi = apiHolder.api.getSystemApi();
const mailConfApi: MailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
interface Props {
  msg: IMMessage;
  keyword: string;
  customClassnames?: string;
}
const RecordItem: React.FC<Props> = ({ msg, keyword, customClassnames = '' }) => {
  const timeZone = mailConfApi.getTimezone();
  const sessionUser = useYunxinAccount(msg.sessionId.replace(/p2p-|team-/, ''), msg.scene);
  const teamInfo = useImTeam(msg.to);
  const time = dayjs(systemApi.getDateByTimeZone(msg.time, timeZone));
  const fromUser = useYunxinAccount(msg.from);

  return teamInfo?.valid === false ? null : (
    <div className={classnames('msg-item', customClassnames)}>
      {/* <div className="profile">头像</div> */}
      {msg.scene === 'p2p' && <UserAvatar testId="im_search_immsg_avatar" user={fromUser} />}
      {msg.scene === 'team' && <TeamAvatar testId="im_search_immsg_avatar" teamId={msg.to} teamInfo={teamInfo} />}

      <div className="msg-content-wrap">
        {/* <div className="msg-name">{userMap[msg.from]?.nick}</div> */}

        {msg.scene === 'p2p' && (
          <div className="msg-name" data-test-id="im_search_immsg_name">
            {sessionUser?.nick || 'default-user'}
          </div>
        )}
        {msg.scene === 'team' && (
          <div className="msg-name" data-test-id="im_search_immsg_name">
            {teamInfo?.customTeamName || 'default-team'}
          </div>
        )}
        <div
          className="msg-content"
          data-test-id="im_search_immsg_contenet"
          dangerouslySetInnerHTML={{
            __html: highlightText(`${fromUser?.nick || 'default'}：${msg.text}`, keyword, 'highlight-text'),
          }}
        />
      </div>
      <div className="msg-time" data-test-id="im_search_immsg_time">
        {time.format(getIn18Text('NIANYUERI'))}
      </div>
    </div>
  );
};
export default RecordItem;
