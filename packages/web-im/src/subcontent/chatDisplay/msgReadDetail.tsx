import React, { useState, useEffect, useContext } from 'react';
// import { IMMessage } from 'api/src/api/logical/im';
import classnames from 'classnames/bind';
import { apiHolder, IMMessage, NIMApi } from 'api';
import style from '../imChatList.module.scss';
import { UserAvatar } from '../../common/imUserAvatar';
import { useYunxinAccount } from '../../common/hooks/useYunxinAccount';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
interface ReadedDetailApi {
  msg: IMMessage;
}
const UserItem: React.FC<{
  id: string;
}> = ({ id }) => {
  const user = useYunxinAccount(id);
  return (
    <li key={id}>
      <UserAvatar user={user} />
      <span className={realStyle('name')}>{user?.nick || ''}</span>
    </li>
  );
};
const StatusReadedDetail: React.FC<ReadedDetailApi> = props => {
  const { msg } = props;
  const [readUsers, setReadUsers] = useState<string[]>([]);
  const [unreadUsers, setUnReadUsers] = useState<string[]>([]);
  const getTeamAccounts = async () => {
    const results = (await new Promise((resolve, reject) => {
      const done = (error, obj, content) => {
        if (Object.is(error, null)) {
          resolve(content);
        } else {
          reject('excute[getTeamMsgReadAccounts]failed');
        }
      };
      nimApi.excute('getTeamMsgReadAccounts', {
        needReturn: true,
        teamMsgReceipt: {
          idServer: msg.idServer,
          teamId: msg.to,
        },
        done,
      });
    })) as Record<'readAccounts' | 'unreadAccounts', string[]>;
    setReadUsers(results.readAccounts);
    setUnReadUsers(results.unreadAccounts);
  };
  useEffect(() => {
    getTeamAccounts();
  }, []);
  return (
    <div className={realStyle('statusReadedDetailWrapper')}>
      <div className={realStyle('head')}>
        <p className={realStyle('readCount')}>
          <strong>{readUsers.length}</strong>
          {getIn18Text('RENYIDU')}
        </p>
        <p className={realStyle('readCount')}>
          <strong>{unreadUsers.length}</strong>
          {getIn18Text('RENWEIDU')}
        </p>
      </div>
      <div className={realStyle('statusReadedDetailContent')}>
        {/* 已读 */}
        <ul className={realStyle('userList')}>
          {readUsers.map(id => (
            <UserItem key={id} id={id} />
          ))}
        </ul>
        {/* 未读 */}
        <ul className={realStyle('userList')}>
          {unreadUsers.map(id => (
            <UserItem key={id} id={id} />
          ))}
        </ul>
      </div>
    </div>
  );
};
export default StatusReadedDetail;
