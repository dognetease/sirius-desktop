import React, { useMemo } from 'react';
import classnames from 'classnames/bind';
import { IMMessage, IMUser } from 'api';
import lodashGet from 'lodash/get';
import style from '../imChatList.module.scss';
import { useYunxinAccounts } from '../../common/hooks/useYunxinAccount';
import { AddTeamMembers } from './sysItem/addTeamMembers';
import { UpdateTeamInfo } from './sysItem/updateTeamInfo';
import { BasicSysTpl } from './sysItem/basicSysTpl';
import { TransferTeam } from './sysItem/transferTeam';
import { getIn18Text } from 'api';

const realStyle = classnames.bind(style);
interface PopoverUserApi {
  user: IMUser | undefined;
}
// 系统消息
interface ChatTypeSysApi {
  msg: IMMessage;
  SubComponent?: any;
  className?: string;
  type: string;
  subClassname?: string;
  [key: string]: any;
}
export const DefaultMsgUser: React.FC<PopoverUserApi> = props => {
  const { user } = props;
  return <span className={realStyle('defaultUserName')}>{user?.nick || user?.account || 'default'}</span>;
};
export const ChatTypeSys: React.FC<ChatTypeSysApi> = props => {
  const { msg, SubComponent = DefaultMsgUser, className = realStyle('teamSysMsgWrapper'), type, subClassname = '', ...restProps } = props;
  // 这块逻辑有死循环
  // const restUsers = {};
  const restUsers = useYunxinAccounts([msg.from, msg.attach?.account || '', ...(msg.attach?.accounts || [])]);
  const subContent = useMemo(() => {
    const accounts = lodashGet(msg, 'attach.accounts', []);
    const owner = lodashGet(msg, 'attach.account', '');
    switch (msg.attach?.type) {
      case 'addTeamMembers':
        return (
          <AddTeamMembers fromAccount={msg.from} accounts={accounts}>
            {account => <SubComponent key={account} user={restUsers[account]} {...restProps} />}
          </AddTeamMembers>
        );
      case 'updateTeam':
        return (
          <UpdateTeamInfo team={msg.attach.team} fromAccount={msg.from} enableClick={type !== 'summary'}>
            {account => <SubComponent key={account} user={restUsers[account]} {...restProps} />}
          </UpdateTeamInfo>
        );
      case 'transferTeam':
        return (
          <TransferTeam fromAccount={msg.from} toAccount={owner}>
            {account => <SubComponent key={account} user={restUsers[account]} {...restProps} />}
          </TransferTeam>
        );
      case 'removeTeamMembers':
        return (
          <BasicSysTpl fromAccount={msg.from} accounts={accounts} desc={getIn18Text('YICHUQUNZU')}>
            {account => <SubComponent key={account} user={restUsers[account]} {...restProps} />}
          </BasicSysTpl>
        );
      case 'addTeamManagers':
        return (
          <BasicSysTpl fromAccount={msg.from} accounts={accounts} desc={getIn18Text('TIANJIAWEIQUNGUAN')}>
            {account => <SubComponent key={account} user={restUsers[account]} {...restProps} />}
          </BasicSysTpl>
        );
      case 'removeTeamManagers':
        return (
          <BasicSysTpl fromAccount={msg.from} accounts={accounts} desc={getIn18Text('CONGQUNGUANLIYUAN')}>
            {account => <SubComponent key={account} user={restUsers[account]} {...restProps} />}
          </BasicSysTpl>
        );
      case 'leaveTeam':
        return (
          <BasicSysTpl fromAccount={msg.from} accounts={accounts} desc={getIn18Text('TUICHULEQUNZU')}>
            {account => <SubComponent key={account} user={restUsers[account]} {...restProps} />}
          </BasicSysTpl>
        );
      case 'dismissTeam':
        return (
          <BasicSysTpl fromAccount={msg.from} accounts={[]} desc={getIn18Text('JIESANLEQUNZU')}>
            {account => <SubComponent key={account} user={restUsers[account]} {...restProps} />}
          </BasicSysTpl>
        );
      case 'passTeamApply':
        return (
          <BasicSysTpl fromAccount={msg.from} accounts={[]} desc={getIn18Text('TONGGUOSOUSUOQUN')}>
            {account => <SubComponent key={account} user={restUsers[account]} {...restProps} />}
          </BasicSysTpl>
        );
      default:
        return <>{getIn18Text('[DANGQIANBANBEN')}</>;
    }
  }, [msg.idClient, Object.keys(restUsers).join('-')]);
  return (
    <div className={className}>
      <p className={realStyle('teamSysMsg', subClassname)} data-test-id={'im_session_msgs_sysmsg_' + (msg.attach?.type || '').toLowerCase()}>
        {subContent}
      </p>
    </div>
  );
};
