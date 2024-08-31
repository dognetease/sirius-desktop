import React, { useMemo } from 'react';
import { apiHolder, NIMApi } from 'api';
import classnames from 'classnames/bind';
import { useObservable } from 'rxjs-hooks';
import { map } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import pinyin from 'tiny-pinyin';
import style from './chatForward.module.scss';
import { UserAvatar, TeamAvatar } from '../../common/imUserAvatar';
import { useYunxinAccount } from '../../common/hooks/useYunxinAccount';
import { useImTeam } from '../../common/hooks/useTeamInfo';

const realStyle = classnames.bind(style);

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

export const UserItem: React.FC<{ id: string }> = props => {
  const { id } = props;
  const user = useYunxinAccount(id);
  return (
    <>
      <UserAvatar user={user} />
      <p className={realStyle('sessionName')}>{user?.nick || ''}</p>
    </>
  );
};

export const TeamItem: React.FC<{ id: string }> = props => {
  const { id } = props;
  const team = useImTeam(id);
  return (
    <>
      <TeamAvatar teamId={team?.teamId || ''} teamInfo={team} />
      <p className={realStyle('sessionName')}>{team?.customTeamName || ''}</p>
    </>
  );
};

export const ChatForwardP2PItem: React.FC<{
  keyword: string;
  to: string;
  children: React.ReactNode;
  onchange(id: string): void;
}> = props => {
  const { to, keyword, children, onchange } = props;

  const username = useObservable(
    (_, $props) => {
      const $to = $props.pipe(map(([id]) => id));
      const name = nimApi.imusers.getUserProp($to, of('nick')) as Observable<string>;
      return name.pipe(map(val => [val, pinyin.convertToPinyin(val).toLowerCase()]));
    },
    ['', ''],
    [to]
  );

  const visible = useMemo(() => username.some(item => item.indexOf(keyword.toLocaleLowerCase()) !== -1), [keyword]);

  return (
    <li
      onClick={() => {
        onchange('p2p-' + to);
      }}
      className={realStyle('sessionItem', visible ? 'visible' : 'hidden')}
    >
      {children}
      <UserItem id={to} />
    </li>
  );
};

export const ChatForwardTeamItem: React.FC<{
  keyword: string;
  to: string;
  children: React.ReactNode;
  onchange(id: string): void;
}> = props => {
  const { to, keyword, children, onchange } = props;

  const teamname = useObservable(
    (_, $props) => {
      const $to = $props.pipe(map(([id]) => [id, 'customTeamName']));

      const $name = nimApi.imteamStream.getTeamField($to) as Observable<string>;
      return $name.pipe(map(val => [val, pinyin.convertToPinyin(val).toLowerCase()]));
    },
    ['', ''],
    [to]
  );
  const visible = useMemo(() => teamname.some(item => item?.toLowerCase().indexOf(keyword.toLocaleLowerCase()) !== -1), [keyword]);

  return (
    <li
      onClick={() => {
        onchange('team-' + to);
      }}
      className={realStyle('sessionItem', visible ? 'visible' : 'hidden')}
    >
      {children}
      <TeamItem id={to} />
    </li>
  );
};
