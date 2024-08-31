import React, { useEffect, useCallback, useRef } from 'react';
import { apiHolder, NIMApi, IMMessage } from 'api';
import { MsgSubtypes } from '@web-im/subcontent/store/msgSubtypes';
import { useLocation } from '@reach/router';
import { getIn18Text } from 'api';
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
type SysmsgProps = {
  type: 'deleteMsg' | string;
  scene: 'p2p' | 'team';
  msg: IMMessage;
  ps: string;
  apnsText: string;
  from: string;
} & Record<'scene' | 'to' | 'ps' | 'apnsText' | 'deletedIdClient' | 'deletedIdServer' | 'deletedMsgTime', string>;
// type removeTeamMemberParams=Record<'teamId'|'fromNick'|'from',string>
// & Record<'removeNicks'|'removeAccounts',string[]>

interface removeTeamMemberParams {
  yxIdToNickName: Record<string, string>;
  from: string;
  fromNick: string;
  tid: string;
  timestamp: number;
}

export const SysmsgHandler = () => {
  const handleSysMsg = (sysMsg: SysmsgProps) => {
    const { type, msg } = sysMsg;
    switch (type) {
      case 'deleteMsg':
        setTimeout(() => {
          nimApi.excute('sendTipMsg', {
            scene: msg.scene,
            to: msg.to,
            tip: getIn18Text('CHEHUILEYITIAO'),
            localFrom: msg.from,
            time: msg.time,
            idClient: msg.idClient,
            isLocal: true,
          });
        }, 50);
        break;
      default:
        break;
    }
  };
  const onsysmsg = async (sysMsg: SysmsgProps) => {
    handleSysMsg(sysMsg);
  };
  // 更新任务卡片的状态
  const updateTaskMsgStore = async (msgId: string, taskStatus: string) => {
    const { msg } = (await nimApi.excute('getLocalMsgByIdClient', {
      idClient: msgId,
    })) as {
      msg: IMMessage;
    };
    let customObj: Record<string, any> = {};
    try {
      customObj = JSON.parse(msg.localCustom as string);
    } catch (ex) {}
    // 更新本地缓存
    nimApi.excute('updateLocalMsg', {
      idClient: msgId,
      localCustom: JSON.stringify({
        ...customObj,
        taskStatus,
      }),
    });
  };

  // 移除群成员自定义消息
  const { hash: locationHash } = useLocation();

  const hashRef = useRef('');

  useEffect(() => {
    hashRef.current = locationHash;
  }, [locationHash]);

  const insertRemoveMemberMsg = (params: removeTeamMemberParams) => {
    const { from, fromNick, tid: teamId, yxIdToNickName } = typeof params === 'string' ? JSON.parse(params) : params;
    const removeNicks = Object.values(yxIdToNickName);
    const removeAccounts = Object.keys(yxIdToNickName);
    if (hashRef.current.indexOf(teamId) !== -1) {
      return;
    }
    nimApi.excute('sendTipMsg', {
      scene: 'team',
      to: teamId,
      custom: {
        from,
        removeAccounts,
        fromNick: fromNick,
        removeNicks,
      },
      isLocal: true,
      tip: `${fromNick}将${removeNicks.join('、')} 移出群组`,
      subType: MsgSubtypes.REMOVE_TEAMMEBER,
    });
  };

  const oncustomsysmsg = (sysContent: { content: string }) => {
    let subType: string = '';
    let contentData: unknown;
    try {
      const parsedContent = JSON.parse(sysContent.content as string) as {
        subType: string;
        data: string;
      };
      subType = parsedContent.subType;
      contentData = typeof parsedContent.data === 'string' ? JSON.parse(parsedContent.data) : parsedContent.data;
    } catch (ex) {}
    switch (subType) {
      case 'changeTaskStatus': {
        const _data = contentData as {
          msgId: string;
          status: string;
        };
        updateTaskMsgStore(_data.msgId, _data.status);
        break;
      }
      case 'team_kick': {
        insertRemoveMemberMsg(contentData as removeTeamMemberParams);
        break;
      }

      // case 'removeTeamMember':{
      //   const _data=contentData  as removeTeamMemberParams
      //   insertRemoveMemberMsg(_data)
      //   break
      // }

      default:
        break;
    }
  };
  useEffect(() => {
    nimApi.subscrible('onsysmsg', onsysmsg);
    nimApi.subscrible('oncustomsysmsg', oncustomsysmsg);
    return () => {
      nimApi.unSubcrible('onsysmsg', onsysmsg);
      nimApi.unSubcrible('oncustomsysmsg', oncustomsysmsg);
    };
  }, []);
  return <></>;
};
