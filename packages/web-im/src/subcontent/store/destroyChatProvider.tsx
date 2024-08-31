import { apiHolder, IMMessage, NIMApi } from 'api';
import React, { useEffect, useRef } from 'react';
import { Modal } from 'antd';
import { useLocation } from '@reach/router';
import { useObservable } from 'rxjs-hooks';
import { closeSession } from '../../common/navigate';
import { getIn18Text } from 'api';
// @ts-ignore
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const DestoryContext = React.createContext(null);
// 处理所有的退出群逻辑
export const DestoryTeamSessionProvider: React.FC<any> = props => {
  const location = useLocation();

  const locationhash = useRef(location.hash);

  const myAccount = useObservable(() => nimApi.imself.getMyField(), '');
  const onleaveteam = (msg: IMMessage) => {
    // 非通知类消息||非当前会话消息
    const _hash = locationhash.current || '';
    if (msg.type !== 'notification' || _hash.indexOf(msg.sessionId) === -1) {
      return;
    }
    // 涉及群成员
    const accounts = msg.attach?.accounts || [];
    // 解散群(自己解散的直接消失 别人解散的弹出一个提示然后消失)
    if (msg.attach?.type === 'dismissTeam') {
      msg.flow === 'in' &&
        Modal.warn({
          title: getIn18Text('DANGQIANQUNYIJING'),
          okText: getIn18Text('QUEDING'),
          width: '448px',
          centered: true,
          afterClose: closeSession,
        });
      msg.flow === 'out' && closeSession();
    }
    // 离开群聊 && 并且消息流向是out(表示是自己主动退出群聊)
    if (msg.attach?.type === 'leaveTeam' && msg.flow === 'out') {
      closeSession();
    }
    // 被移除群聊(小丑竟是我自己...)
    if (msg.attach?.type === 'removeTeamMembers' && accounts.includes(myAccount)) {
      Modal.warn({
        title: getIn18Text('NIYIJINGBEIYI'),
        afterClose: closeSession,
      });
    }
  };
  // 当前会话被删除(群主解散/被踢/主动退出)
  useEffect(() => {
    nimApi.subscrible('onmsg', onleaveteam);
    return () => {
      nimApi.unSubcrible('onmsg', onleaveteam);
    };
  }, []);
  return <DestoryContext.Provider value={null}>{props.children}</DestoryContext.Provider>;
};
