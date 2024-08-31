import { ReactComponent as CheckedCircleIcon } from '@/images/icons/checked_circle.svg';
import { ReactComponent as CloseCircleIcon } from '@/images/icons/close_circle.svg';
import EllipsisOutlined from '@ant-design/icons/EllipsisOutlined';
import { Dropdown, Menu, Modal } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { IMMessage, apiHolder, apis, DataTrackerApi } from 'api';
import classnames from 'classnames/bind';
import React, { useContext, useMemo, useRef, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { judgeMsgType } from '@web-im/utils/im_team_util';
import { useImTeamType } from '../../common/hooks/useTeamInfo';
import { MentionUserIdContext } from '../store/mentionUser';
import { Context as MessageContext } from '../store/messageProvider';
import { ReplyMsgContext } from '../store/replingMsg';
import ChatForward from './chatForward';
import { CommentEntry } from './chatItemComments';
import menuStyle from './chatItemMenu.module.scss';
import { getIn18Text } from 'api';
const realMenuStyle = classnames.bind(menuStyle);
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
interface SubMenuPropsApi {
  selectMenu(key: string): void;
  [key: string]: any;
  children: React.ReactNode | null;
}
const ChatItemSubMenu: React.FC<SubMenuPropsApi> = props => {
  const { selectMenu, children } = props;
  const onSelect = async ({ key }) => {
    selectMenu(key);
  };
  return (
    <Menu onClick={onSelect} className={realMenuStyle('chatItemSubMenu')}>
      {children}
    </Menu>
  );
};
interface ItemMenuApi {
  msg: IMMessage;
}
// 单个消息菜单
const ChatItemMenu: React.FC<ItemMenuApi> = props => {
  const { msg } = props;
  const isTeamDiscuss = msg.scene === 'team' ? useImTeamType(msg?.target) === 'discuss' : false;
  // 自定义消息操作白名单
  let operateWhiteList = ['EMOTION', 'REPLY', 'FORWARD', 'SELECT', 'REVOKE', 'COPY', 'DELETE'];
  try {
    const content = JSON.parse(msg.content || '{}');
    const msgType = content?.type;
    operateWhiteList = msgType === 1014 ? content?.msgOperate || [] : operateWhiteList;
  } catch (e) {}
  const isMe = msg.flow === 'out' && msg.from !== msg.to;
  const { drawMsg, deleteLocalMsg, updateSelectState } = useContext(MessageContext);
  const { setReplyMsg } = useContext(ReplyMsgContext);
  const { setMentionUserId } = useContext(MentionUserIdContext);
  // 添加回复消息
  const addToBeReply = () => {
    setReplyMsg(msg);
    if (msg.scene === 'team' && msg.flow === 'in') {
      setMentionUserId([msg.from, Date.now()].join('@'));
    }
  };
  const [visibleForward, setVisibleForward] = useState<boolean>(false);
  const toggleForwardModal = visible => {
    setVisibleForward(visible);
  };
  const containerRef = useRef(null);
  const [visibleSubmenu, setVisibleSubmenu] = useState(false);
  const triggerDraw = async (msg: IMMessage) => {
    try {
      await drawMsg(msg, isTeamDiscuss);
      judgeMsgType(msg, 'customMsgType', 2000) && trackApi.track('pc_click_mailChat_seeRecentMail');
    } catch (ex) {
      message.error(getIn18Text('XIAOXICHEHUISHI'));
    }
  };
  const onSelectSubMenu = async key => {
    switch (key) {
      case 'delete':
        await new Promise((resolve, reject) => {
          Modal.confirm({
            title: getIn18Text('QUEDINGSHANCHUXIAO'),
            okText: getIn18Text('SHANCHU'),
            cancelText: getIn18Text('QUXIAO'),
            width: '448px',
            centered: true,
            onOk(close) {
              resolve(true);
              close();
            },
            onCancel(close) {
              reject();
              close();
            },
          });
        });
        await deleteLocalMsg(msg);
        break;
      case 'withdraw':
        triggerDraw(msg);
        break;
      case 'select':
        updateSelectState(msg.idClient);
        break;
      default:
        break;
    }
    setVisibleSubmenu(false);
  };
  const isWithdrawVisible = useMemo(() => {
    const { time } = msg;
    const now = new Date().getTime();
    return now - time <= 24 * 60 * 60 * 1000;
  }, [msg]);
  const normalMenu = {
    EMOTION: <CommentEntry testId="im_session_content_single_msg_emojimenu" msg={msg} classnames={realMenuStyle('menuItem')} ref={containerRef} />,
    REPLY: (
      <span data-test-id="im_session_content_single_msg_replymenu" onClick={addToBeReply} className={realMenuStyle('menuItem')}>
        {getIn18Text('HUIFU')}
      </span>
    ),
    FORWARD: (
      <span
        data-test-id="im_session_content_single_msg_forwardmenu"
        onClick={() => {
          toggleForwardModal(true);
        }}
        className={realMenuStyle('menuItem')}
      >
        {getIn18Text('ZHUANFA')}
      </span>
    ),
  };
  const dropdownMenu = {
    SELECT: (
      <Menu.Item className={realMenuStyle('menuSubItem')} key="select">
        {getIn18Text('DUOXUAN')}
      </Menu.Item>
    ),
    REVOKE: (
      <Menu.Item className={realMenuStyle('menuSubItem', 'withdraw')} key="withdraw">
        {getIn18Text('CHEHUI')}
      </Menu.Item>
    ),
    COPY: (
      <CopyToClipboard
        text={msg.text as string}
        onCopy={(_, result) => {
          message.success({
            icon: result ? <CheckedCircleIcon /> : <CloseCircleIcon />,
            content: <span className={realMenuStyle('chatItemCopyTip')}>{result ? getIn18Text('FUZHICHENGGONG') : getIn18Text('FUZHISHIBAI')}</span>,
          });
        }}
      >
        <Menu.Item className={realMenuStyle('menuSubItem', 'copy')} key="copy">
          {getIn18Text('FUZHI')}
        </Menu.Item>
      </CopyToClipboard>
    ),
    DELETE: (
      <Menu.Item className={realMenuStyle('menuSubItem', 'delete')} key="delete">
        {getIn18Text('SHANCHU')}
      </Menu.Item>
    ),
  };
  return (
    <div ref={containerRef} data-test-id="im_session_content_single_msg_menus" className={realMenuStyle('chatOperationMenu')}>
      {/* 消息转发 */}
      {visibleForward && <ChatForward msgs={[msg]} onVisibleChange={toggleForwardModal} />}
      {visibleForward && <span className={realMenuStyle('delimiter')} />}

      {Object.keys(normalMenu).map(item => {
        return (
          <React.Fragment key={item}>
            {operateWhiteList.includes(item) ? normalMenu[item as keyof typeof normalMenu] : null}
            <span className={realMenuStyle('delimiter')} />
          </React.Fragment>
        );
      })}
      <Dropdown
        arrow={false}
        visible={visibleSubmenu}
        onVisibleChange={flag => {
          setVisibleSubmenu(flag);
        }}
        overlayStyle={{}}
        overlay={
          <ChatItemSubMenu selectMenu={onSelectSubMenu}>
            {Object.keys(dropdownMenu).map(item => {
              if ((msg.type !== 'text' && item === 'COPY') || ((!isMe || !isWithdrawVisible) && item === 'REVOKE')) {
                return null;
              }
              return <React.Fragment key={item}>{operateWhiteList.includes(item) ? dropdownMenu[item as keyof typeof dropdownMenu] : null}</React.Fragment>;
            })}
          </ChatItemSubMenu>
        }
        trigger={['click']}
        placement="bottomRight"
        getPopupContainer={() => containerRef.current as unknown as HTMLElement}
      >
        <span data-test-id="im_session_content_single_msg_moremenus" className={realMenuStyle('menuItem', 'menuItemSubEntry')}>
          <EllipsisOutlined />
        </span>
      </Dropdown>
    </div>
  );
};
export default ChatItemMenu;
