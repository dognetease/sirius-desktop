// 群成员信息管理
import React, { useEffect, useReducer, useRef } from 'react';
import { apiHolder, apis, ContactAndOrgApi, TeamMember, Team as IMTeam, NIMApi, EntityOrgTeamContact, ContactModel } from 'api';
import lodashGet from 'lodash/get';
import { useObservable } from 'rxjs-hooks';
import { defer, from, fromEventPattern, race } from 'rxjs';
import { delay, retryWhen, switchMap, timeout, take, tap, map } from 'rxjs/operators';
import { reduce, initState, TeamMemberAction, InitStateApi, TeamMemberInfo } from './memberReduce';

interface TeamMemberContextApi {
  state: InitStateApi;
  dispatch: React.Dispatch<any>;
}

const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactAndOrgApi;

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

export { TeamMemberInfo } from './memberReduce';
export const Context = React.createContext<TeamMemberContextApi>({} as TeamMemberContextApi);

interface Props {
  sessionId: string;
  to: string;
  scene: 'p2p' | 'team';
}

interface TeamUpdateProps {
  team: IMTeam;
  accounts?: string[];
  members: TeamMember[];
}

export const Provider: React.FC<Props> = props => {
  const { sessionId, to, scene } = props;
  const [state, dispatch] = useReducer(reduce, initState);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // dispatch更新
  const handleDispatch = (members, users) => {
    if (!isMountedRef.current) return;
    dispatch({
      type: TeamMemberAction.PREPEND_TEAM_MEMBERS,
      payload: {
        members: members
          .map((item: TeamMember) => {
            item.user = users.has(item.account) ? users.get(item.account) : undefined;
            return item;
          })
          .filter(item => lodashGet(item, 'user.account.length', 0) !== 0),
      },
    });
  };

  // 根据userlist处理成map
  const getUsersMap = (resultsList: ContactModel[]) => {
    const results: [string, unknown][] = resultsList
      .filter(item => {
        return !!item.contactInfo.find(itm => itm.contactItemType === 'yunxin');
      })
      .map(item => {
        const contactInfo = item.contactInfo.find(itm => itm.contactItemType === 'yunxin')!;
        return [
          contactInfo.contactItemVal,
          {
            account: contactInfo.contactItemVal,
            email: contactApi.doGetModelDisplayEmail(item),
            nick: item.contact.contactName,
            color: item.contact.color,
            tel: '',
            avatar: item.contact.avatar,
            pinyinname: item.contact.contactPYName,
            contactId: item.contact.id,
          },
        ];
      });

    return new Map(results);
  };

  // 统一处理更新群成员信息
  const handleMembers = async (members, accounts) => {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return;
    }
    const { contactModelList, needRequestAccounts } = await contactApi.doGetContactByYunxin(accounts);
    const localUsersMap = getUsersMap(contactModelList);
    handleDispatch(members, localUsersMap);
    if (needRequestAccounts && needRequestAccounts.length) {
      const serverUserList = await contactApi.doGetServerContactByYunxin(needRequestAccounts);
      const serverUserMap = getUsersMap([...contactModelList, ...serverUserList]);
      handleDispatch(members, serverUserMap);
    }
  };

  // 加人
  const onAddTeamMembers = async (args: TeamUpdateProps) => {
    const { team, accounts, members } = args;
    if (team.teamId !== to) {
      return;
    }
    handleMembers(members, accounts);
  };
  // 踢人
  const onRemoveTeamMembers = async ({ team, accounts }: TeamUpdateProps) => {
    if (team.teamId !== to) {
      return;
    }
    dispatch({
      type: TeamMemberAction.REMOVE_MEMBER,
      payload: {
        accounts,
      },
    });
  };

  // 更新群成员信息
  const onUpdateTeamManagers = (args: TeamUpdateProps) => {
    const { team, members } = args;
    if (team.teamId !== to) {
      return;
    }
    dispatch({
      type: TeamMemberAction.UPDATE_TEAM_MEMBERS,
      payload: {
        members,
      },
    });
  };

  const onTransferTeam = (info: { team: IMTeam }) => {
    if (info.team.teamId !== to) {
      return;
    }
    dispatch({
      type: TeamMemberAction.UPDATE_OWNER,
      payload: {
        account: info.team.owner,
      },
    });
  };

  // 获取群成员方法 先尝试使用IMSDK去获取 如果失败 调用通讯录方法
  const getTeamMembers = async (teamId: string) => {
    try {
      const _request = (await nimApi.excute('getTeamMembers', {
        teamId,
      })) as Promise<{ teamId: string; members: TeamMemberInfo[] }>;
      return _request;
    } catch (ex) {
      const _requestByContact = await contactApi.doGetOrgContactListByTeamId({ idList: [`team_${teamId}`] });
      const list = (_requestByContact as EntityOrgTeamContact[]).map(item => {
        return {
          account: item.yunxinId,
          active: true,
          // id: '3888821669-f7210cf3668d57b685b7c7039a09c3a2',
          id: [item.orgId.replace('team_', ''), item.yunxinId].join('-'),
          invitorAccid: '',
          joinTime: item.joinTime,
          mute: false,
          nickInTeam: '',
          teamId: item.orgId.replace('team_', ''),
          type: item.type.replace('0', 'normal').replace('1', 'owner').replace('2', 'manager'),
          updateTime: item.joinTime,
          valid: true,
        };
      }) as unknown[] as TeamMemberInfo[];
      return {
        teamId: teamId,
        members: list,
      };
    }
  };

  const $teamMembers = useObservable(
    () => {
      const $request = defer(() => {
        return from(getTeamMembers(to)).pipe(map(item => item.members));
      });

      const $retryRequest = $request.pipe(
        timeout(2000),
        retryWhen($error => $error.pipe(delay(2000), take(10)))
      );

      const onconnect = handler => {
        nimApi.subscrible('onconnect', handler);
      };
      const offconnect = handler => {
        nimApi.unSubcrible('onconnect', handler);
      };
      const $onconnectRequest = fromEventPattern(onconnect, offconnect).pipe(
        take(1),
        switchMap(() => $request)
      );

      return race($retryRequest, $onconnectRequest).pipe(
        tap(args => {
          console.log('[members]', args);
        })
      );
    },
    [],
    []
  );

  useEffect(() => {
    handleMembers(
      $teamMembers,
      $teamMembers.map(item => item.account)
    );
  }, [$teamMembers.map(item => item.account).join('-')]);

  useEffect(() => {
    if (scene === 'p2p') {
      return;
    }
    nimApi.subscrible('onTransferTeam', onTransferTeam);
    nimApi.subscrible('onAddTeamMembers', onAddTeamMembers);
    nimApi.subscrible('onRemoveTeamMembers', onRemoveTeamMembers);
    nimApi.subscrible('onUpdateTeamManagers', onUpdateTeamManagers);
    return () => {
      nimApi.unSubcrible('onTransferTeam', onTransferTeam);
      nimApi.unSubcrible('onAddTeamMembers', onAddTeamMembers);
      nimApi.unSubcrible('onRemoveTeamMembers', onRemoveTeamMembers);
      nimApi.unSubcrible('onUpdateTeamManagers', onUpdateTeamManagers);
    };
  }, []);
  return (
    <Context.Provider
      value={{
        state,
        dispatch,
      }}
    >
      {props.children}
    </Context.Provider>
  );
};
