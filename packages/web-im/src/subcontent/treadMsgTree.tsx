import React, { useContext, useEffect, useRef } from 'react';
import { Drawer } from 'antd';
import classnames from 'classnames/bind';
import { SystemApi, apiHolder, IMMessage, NIMApi } from 'api';
import { judgeMsgType, getDistanceFromTop } from '@web-im/utils/im_team_util';
import { Context, Actions } from './store/treadDrawerVisbleProvider';
import styles from './treadMsgTree.module.scss';
import { ChatTreadItem } from './chatDisplay/chatTreadItem';
import { Context as MaxsizeContext } from './store/maxsizeProvider';
import ChatTimeline from './chatDisplay/chatTimeline';

const realStyle = classnames.bind(styles);

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const inElectron = systemApi.isElectron();

interface TreadMsgTreeProps {
  treadHeadMsg: IMMessage | null;
  treadMsgs: IMMessage[];
}
export const TreadMsgTree: React.FC<TreadMsgTreeProps> = props => {
  const { treadHeadMsg, treadMsgs } = props;

  const { compute } = useContext(MaxsizeContext);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = wrapperRef!.current as unknown as HTMLDivElement;
    compute(node, node, number => Math.max(number - 138, 0));
  }, []);

  return (
    <div className={realStyle('treadWrapper')} ref={wrapperRef}>
      {treadHeadMsg ? (
        <ChatTreadItem
          displayNick
          timeTag={<ChatTimeline time={treadHeadMsg.time} classnames={realStyle('headMsgTime')} alias={{}} />}
          msg={treadHeadMsg}
          wrapperClassname={realStyle('treadMsgItem', 'head')}
          quickCommentsBg={judgeMsgType(treadHeadMsg, 'type', 1014) ? '#f4f4f5' : '#E0EAFF'}
        />
      ) : null}
      {treadMsgs
        .filter(item => Reflect.has(item, 'type'))
        .map(item => {
          const isMe = item.flow === 'out' || item.from === item.to;
          return (
            <ChatTreadItem
              key={item.idClient}
              displayNick={item.scene === 'team' && item.flow === 'in'}
              msg={item}
              wrapperClassname={realStyle('treadMsgItem', isMe ? 'my' : 'other')}
              quickCommentsBg={judgeMsgType(item, 'type', 1014) ? '#f4f4f5' : isMe ? '#CEDDFD' : ''}
            />
          );
        })}
    </div>
  );
};

export const TreadMsgTreeContainer: React.FC<any> = () => {
  const { state: treadState, dispatch: dispatchVisible } = useContext(Context);

  const topDis = getDistanceFromTop();

  const closeTeamSetting = () => {
    dispatchVisible({
      action: Actions.CLOSE_TREAD_TREE,
    });
  };

  useEffect(() => {
    nimApi.subCustomEvent('MESSAGE_SHORTCUTS_SEARCH', closeTeamSetting, {});
    return () => {
      nimApi.offCustomEvent('MESSAGE_SHORTCUTS_SEARCH', closeTeamSetting);
    };
  }, []);

  return (
    <Drawer
      width={456}
      className={realStyle('treadTreeDrawer')}
      placement="right"
      closable={false}
      onClose={closeTeamSetting}
      visible={treadState.visible}
      mask
      maskStyle={{
        backgroundColor: 'transparent',
        top: `-${topDis}px`,
        height: `calc(100% + ${topDis}px)`,
      }}
      contentWrapperStyle={{
        position: inElectron ? 'absolute' : 'fixed',
        top: `${topDis}px`,
        height: `calc(100% - ${topDis}px)`,
      }}
      destroyOnClose
    >
      {treadState.treadMsg ? <TreadMsgTree treadHeadMsg={treadState.treadMsg} treadMsgs={treadState.msgs} /> : null}
    </Drawer>
  );
};
