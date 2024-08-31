import React, { useContext, useState } from 'react';
import lodashGet from 'lodash/get';
import { apiHolder, IMMessage, IMUser, Session, Team, NIMApi, IMDiscussApi, apis, ContactApi } from 'api';
import classnames from 'classnames/bind';
import { Checkbox, Input } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { useObservable } from 'rxjs-hooks';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './chatForward.module.scss';
import { Context as MessageContext, MessageAction } from '../store/messageProvider';
import { UserItem, TeamItem, ChatForwardP2PItem, ChatForwardTeamItem } from './chatForwardItem';
import { ChatForwardFooter } from './chatForwardFooter';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import { getIn18Text } from 'api';

const realStyle = classnames.bind(style);
const systemApi = apiHolder.api.getSystemApi();
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const discussApi = apiHolder.api.requireLogicalApi(apis.imDiscussApiImpl) as unknown as IMDiscussApi;
const contactApi = apiHolder.api.requireLogicalApi('contactApi') as ContactApi;

interface SessionExtension extends Session {
  visible?: Boolean;
  user?: IMUser;
  team?: Team;
}
interface SessionListApi {
  sessionList: SessionExtension[];
  checkedSessionMap: string[];
  onChange: (...params: any[]) => void;
}
const MODAL_TEXT = {
  sendText: {
    titleText: getIn18Text('FASONGDAO'),
    okText: getIn18Text('FASONG'),
  },
  forwardText: {
    titleText: getIn18Text('ZHUANFADAO'),
    okText: getIn18Text('ZHUANFA'),
  },
  shareText: {
    titleText: getIn18Text('FENXIANGDAO'),
    okText: getIn18Text('FENXIANG'),
  },
};
const ChatForwardSessionList: React.FC<SessionListApi> = props => {
  const { sessionList, onChange, checkedSessionMap } = props;
  const [searchKey, setSearchKey] = useState('');
  const onTextChange = e => {
    setSearchKey(e.target.value);
  };
  return (
    <div className={realStyle('column', '  operationPanel')}>
      <div className={realStyle('searchWrapper')}>
        <Input
          value={searchKey}
          onChange={onTextChange}
          placeholder={getIn18Text('SOUSUOHUIHUA')}
          prefix={<SearchIcon className="dark-invert" />}
          type="text"
          className={realStyle('search')}
        />
      </div>

      <div className={realStyle('optionsName')}>{getIn18Text('ZUIJINHUIHUA')}</div>
      <ul className={`ant-allow-dark ${realStyle('sessionList')}`}>
        {sessionList.map(item => {
          if (item.scene === 'p2p') {
            return (
              <ChatForwardP2PItem to={item.to} keyword={searchKey} onchange={onChange}>
                <Checkbox className={realStyle('checkbox')} checked={checkedSessionMap.includes(item.id)} />
              </ChatForwardP2PItem>
            );
          }
          return (
            <ChatForwardTeamItem to={item.to} keyword={searchKey} onchange={onChange}>
              <Checkbox className={realStyle('checkbox')} checked={checkedSessionMap.includes(item.id)} />
            </ChatForwardTeamItem>
          );
        })}
      </ul>
    </div>
  );
};
const CheckedSessionList: React.FC<Omit<SessionListApi, 'sessionList'>> = props => {
  const { onChange, checkedSessionMap } = props;
  return (
    <div className={realStyle('column')}>
      <p className={realStyle('checkedCount')}>
        {getIn18Text('YIXUAN\uFF1A')}
        {checkedSessionMap.length}
        /10
      </p>
      <ul className={realStyle('checkedUserWrapper')}>
        {checkedSessionMap.map(item => {
          const to = item.replace(/^p2p-|^team-/, '');
          return (
            <li key={item}>
              {/^p2p/.test(item) && <UserItem id={to} />}
              {/^team/.test(item) && <TeamItem id={to} />}
              <span
                onClick={e => {
                  onChange(item);
                }}
                className={`${realStyle('removeIcon')} remove-icon`}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};
interface ShareMsgs {
  mailMid: string;
  mailTid: string;
}
interface ChatForwardApi {
  msgs:
    | IMMessage[]
    | {
        text: string;
      }
    | ShareMsgs;
  type?: string;
  onVisibleChange: (flag: boolean) => void;
  onForwardSuccess?: () => void;
}
const ChatForward: React.FC<ChatForwardApi> = props => {
  const { msgs, type = 'forwardText', onVisibleChange, onForwardSuccess } = props;
  const { dispatch: dispatchMsg } = useContext(MessageContext);
  const { sendTextMessage } = useContext(MessageContext);
  // 会话列表 用户类表 群组列表
  const $sessionlist = useObservable(() => {
    const $sessionStream = nimApi.sessionStream.getSubject() as Observable<Session[]>;
    return $sessionStream.pipe(map(list => list.filter(item => !/lx_/.test(item.to)))).pipe(take(1));
  }, [] as Session[]);
  const [checkedSessionMap, setCheckedSession] = useState<string[]>([]);
  const onChange = id => {
    setCheckedSession(sessions => {
      const sessionSet = new Set(sessions);
      if (sessionSet.has(id)) {
        sessionSet.delete(id);
      } else if (sessionSet.size < 10) {
        sessionSet.add(id);
      }
      return [...sessionSet];
    });
  };
  const [visible, setVisible] = useState(true);
  const [confirmloading, setConfirmloading] = useState(false);
  const onCancel = () => {
    onVisibleChange(false);
  };
  // 转发消息
  const sendForwardMsg = async () => {
    if (!checkedSessionMap.length) {
      return message.error(`请选择${MODAL_TEXT[type].okText}session`);
    }
    setConfirmloading(true);
    let success = true;
    if (type === 'sendText') {
      await Promise.all(
        checkedSessionMap.map(async session => {
          const forwardedMsg = (await sendTextMessage({
            ...msgs,
            scene: /^p2p/.test(session) ? 'p2p' : 'team',
            to: session.replace(/^p2p-|^team-/, ''),
          })) as IMMessage;
          return forwardedMsg;
        })
      );
    } else if (type === 'forwardText') {
      await Promise.all(
        checkedSessionMap.map(async session => {
          await Promise.all(
            msgs.map(async (msg: IMMessage) => {
              const forwardedMsg = (await nimApi.excute('forwardMsg', {
                msg: {
                  ...msg,
                  needMsgReceipt: true,
                },
                scene: /^p2p/.test(session) ? 'p2p' : 'team',
                to: session.replace(/^p2p-|^team-/, ''),
              })) as IMMessage;
              forwardedMsg.sessionId === msg.sessionId &&
                dispatchMsg({
                  type: MessageAction.PUSH_MSG,
                  payload: {
                    msg: forwardedMsg,
                  },
                });
              return forwardedMsg;
            })
          );
        })
      );
    } else if (type === 'shareText') {
      const p2pReg = /^p2p-.*/;
      const teamReg = /^team-.*/;
      const p2pIds = checkedSessionMap.filter(item => p2pReg.test(item)).map(item => item.replace(/^p2p-|^team-/, ''));
      const teamIds = checkedSessionMap.filter(item => teamReg.test(item)).map(item => item.replace(/^p2p-|^team-/, ''));
      const currentInfo = systemApi.getCurrentUser();
      const currentContact = lodashGet(currentInfo, 'contact.contactInfo', []).find(item => item.contactItemType === 'yunxin');
      let userYunxinId = currentContact?.contactItemVal;
      if (!userYunxinId && currentInfo?.id) {
        const userInfo = await contactApi.doGetContactByItem({
          type: 'EMAIL',
          value: [currentInfo.id],
        });
        const userContact = lodashGet(userInfo, '0.contactInfo', []).find(item => item.contactItemType === 'yunxin');
        userYunxinId = userContact?.contactItemVal;
      }
      const params = {
        from: userYunxinId || '',
        tos: p2pIds,
        teamIds,
        emailTid: (msgs as ShareMsgs)?.mailTid,
        emailMid: (msgs as ShareMsgs)?.mailMid,
      };
      success = !!(await discussApi.shareMail(params))?.success;
    }
    setConfirmloading(false);
    if (!success) {
      message.error(`${MODAL_TEXT[type].okText}失败，请检查网络`);
      return;
    }
    onVisibleChange(false);
    onForwardSuccess && onForwardSuccess();
    message.success({
      content: `${MODAL_TEXT[type].okText}成功`,
    });
  };
  return (
    <Modal
      width={600}
      visible={visible}
      className={realStyle('chatForwardModal')}
      title={<p className={realStyle('headTitle')}>{MODAL_TEXT[type].titleText}</p>}
      confirmLoading={confirmloading}
      onCancel={onCancel}
      footer={
        <ChatForwardFooter
          okText={MODAL_TEXT[type].okText}
          onVisibleChange={onVisibleChange}
          sendForwardMsg={sendForwardMsg}
          loading={confirmloading}
          checkedSessionIds={checkedSessionMap}
          mailMid={(msgs as ShareMsgs)?.mailMid}
        />
      }
      closeIcon={<CloseIcon className="dark-invert" />}
      getContainer={() => document.body}
    >
      <div className={`${realStyle('modalContentWrapper')} chat-forward-modal-content-wrapper`}>
        <ChatForwardSessionList sessionList={$sessionlist} checkedSessionMap={checkedSessionMap} onChange={onChange} />
        <CheckedSessionList checkedSessionMap={checkedSessionMap} onChange={onChange} />
      </div>
    </Modal>
  );
};
export default ChatForward;
