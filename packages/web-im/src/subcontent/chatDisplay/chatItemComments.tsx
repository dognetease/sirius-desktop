import { IMMessage, IMQuickComment, apiHolder, NIMApi } from 'api';
import React, { useContext, useEffect, useRef, useState, useMemo } from 'react';
import classnames from 'classnames/bind';
import { Tooltip, Popover, Divider } from 'antd';
import lodashGet from 'lodash/get';
import { useObservable } from 'rxjs-hooks';
import { CommentsContext } from '../store/quickCommentsList';
import style from './chatItemComments.module.scss';
import { PopoverUser } from '../../common/usercard/userCard';
import { emojiSourceMap, emojiList, CommentNumberList } from '../../common/emojiList';
import { UserAvatar } from '../../common/imUserAvatar';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { useRecentEmoji, setRecentEmoji } from '../../common/hooks/useRecentEmoji';
import { useYunxinAccounts } from '../../common/hooks/useYunxinAccount';
import { judgeMsgType } from '@web-im/utils/im_team_util';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
interface CommentMenuApi {
  msg: IMMessage;
  closePop(): void;
}
interface CommentEntryApi {
  msg: IMMessage;
  classnames?: string;
  testId?: string;
}
interface CommentToolTipApi {
  item: string;
  classname: string;
  handleClick(): void;
}
export const CommentEntry: React.FC<CommentEntryApi> = React.forwardRef((props, ref: React.Ref<HTMLElement>) => {
  const { classnames = '', msg, testId = '' } = props;
  const [commentVisible, setCommentVisible] = useState(false);
  return (
    <Popover
      trigger={['hover']}
      // mouseEnterDelay={0.5}
      visible={commentVisible}
      onVisibleChange={setCommentVisible}
      overlayClassName={realStyle('commentMenuPop')}
      content={
        <CommentMenu
          msg={msg}
          closePop={() => {
            setCommentVisible(false);
          }}
        />
      }
      destroyTooltipOnHide
    >
      <span data-test-id={testId} className={classnames}>
        {getIn18Text('BIAOQING')}
      </span>
    </Popover>
  );
});
const CommentTooltip: React.FC<CommentToolTipApi> = props => {
  const { item, classname, handleClick } = props;
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  return (
    <Tooltip visible={showTooltip} title={item} key={item} overlayClassName={realStyle('commentMenuTooltip')} getPopupContainer={triggerNode => triggerNode}>
      <span key={item} className={classname} onClick={() => handleClick()} onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
        <img src={emojiSourceMap[emojiList.get(item) as string]} alt={item} />
      </span>
    </Tooltip>
  );
};
export const CommentMenu: React.FC<CommentMenuApi> = props => {
  const { msg, closePop } = props;
  const { addComment, deleteComment, commentsMap } = useContext(CommentsContext);
  const myAccount = useObservable(() => nimApi.imself.getMyField(), '');
  const recentQuickReplyList = useRecentEmoji('QuickReplyList');
  const containerRef = useRef<HTMLDivElement>(null);
  // 发表评论
  const sendComment = (comment: string) => {
    const bodyType = (comment.match(/\d{1,}(?=\.png$)/) as string[])[0];
    // if (!commentsMap[msg.idClient] || !commentsMap)
    const curComment = lodashGet(commentsMap, msg.idClient, []).find(item => item.body === Number(bodyType) && item.from === myAccount);
    if (curComment) {
      deleteComment({
        msg,
        body: Number(bodyType),
      });
    } else {
      addComment({
        msg,
        body: Number(bodyType),
      });
    }
    closePop();
  };
  const handleClick = (item: string) => {
    setRecentEmoji(recentQuickReplyList, item, 7, 'QuickReplyList');
    sendComment(emojiList.get(item) as string);
  };
  return (
    <div ref={containerRef} className={realStyle('commentMenuWrapper')}>
      {recentQuickReplyList.map(item => (
        <CommentTooltip item={item} handleClick={() => handleClick(item)} classname={realStyle('commentMenuItemRecent')} />
      ))}
      {recentQuickReplyList.length > 0 && <Divider className={realStyle('commentMenuItemLine')} />}
      {CommentNumberList.map(item => (
        <CommentTooltip item={item} handleClick={() => handleClick(item)} classname={realStyle('commentMenuItem')} />
      ))}
    </div>
  );
};
interface QuickCommentApi {
  msg: IMMessage;
  // 点赞类型
  type: number;
  // 点赞列表
  list: string[];
  chooseComment(type): void;
  bgColor?: string;
}
export const QuickComment: React.FC<QuickCommentApi> = props => {
  const { type, list, chooseComment, msg, bgColor = '#EBEBEB' } = props;
  const { addComment, deleteComment } = useContext(CommentsContext);
  const userlistState = useYunxinAccounts(list);
  const myAccount = useObservable(() => nimApi.imself.getMyField(), '');
  const recentQuickReplyList = useRecentEmoji('QuickReplyList');
  const bgClassName = useMemo(() => {
    // #f4f4f5 #E0EAFF #CEDDFD #EBEBEB
    // 暗黑主题需要处理背景色，所以讲背景色转为class
    if (bgColor === '#f4f4f5') {
      return 'grayLightBg';
    } else if (bgColor === '#E0EAFF') {
      return 'brandLightBg';
    } else if (bgColor === '#CEDDFD') {
      return 'brandBg';
    } else if (bgColor === '#EBEBEB') {
      return 'grayBg';
    } else {
      return '';
    }
  }, [bgColor]);
  const triggerComment = () => {
    if (list.includes(myAccount as string)) {
      deleteComment({
        msg,
        body: type,
      });
    } else {
      const name: string[] = CommentNumberList.filter(item => emojiList.get(item) === `emoji_png_${type}.png`);
      setRecentEmoji(recentQuickReplyList, name[0], 7, 'QuickReplyList');
      addComment({
        msg,
        body: type,
      });
    }
  };
  // 最多显示50个字符
  const MaxDisplayCharacterLen = 40;
  let visibleCount = 0;
  let displayCharacterLen = 0;
  const getCharacterLen = str => {
    const zhReg = /[\u4E00-\u9FA5]/g;
    const matchResult = str.match(zhReg);
    return matchResult ? str.length - matchResult.length + matchResult.length * 2 : str.length;
  };
  return (
    <div
      className={realStyle('commentContent', bgClassName)}
      style={
        !bgClassName
          ? {
              backgroundColor: bgColor,
            }
          : {}
      }
    >
      <span className={realStyle('commentBody')} onClick={triggerComment}>
        <img src={lodashGet(emojiSourceMap, `emoji_png_${type}.png`, 'unknown')} alt={`${type}`} />
      </span>

      <div className={realStyle('commentUsers')}>
        {list.map(account => {
          const { nick = '' } = userlistState[account] || { nick: 'default' };
          // 加一个标点符号的字符长度
          const nameLen = getCharacterLen(nick) + 2;
          if (MaxDisplayCharacterLen >= displayCharacterLen + nameLen) {
            displayCharacterLen += nameLen;
            visibleCount += 1;
          } else {
            return null;
          }
          return (
            <PopoverUser user={userlistState[account]} key={account}>
              <span className={realStyle('commentUser', 'hasDelimiter')}>{nick}</span>
            </PopoverUser>
          );
        })}
        {/* 未展示人数 */}
        {visibleCount < list.length && (
          <i
            onClick={() => {
              chooseComment(type);
            }}
            className={realStyle('commentCount')}
          >
            {['+', list.length - visibleCount, getIn18Text('REN')].join('')}
          </i>
        )}
      </div>
    </div>
  );
};
interface CommentsModalApi {
  comments: IMQuickComment[];
  currentComment: number;
}
const ModalContent: React.FC<CommentsModalApi> = props => {
  const { comments, currentComment } = props;
  const userlistState = useYunxinAccounts(comments.map(item => item.from));
  const [checkedCommentType, setCheckedCommentType] = useState(0);
  useEffect(() => {
    setCheckedCommentType(currentComment);
  }, [currentComment]);
  const [curCommentList, setCurCommentList] = useState<IMQuickComment[]>([]);
  const myAccount = useObservable(() => nimApi.imself.getMyField(), '');
  useEffect(() => {
    setCurCommentList(state => {
      const list = comments.filter(comment => comment.body === checkedCommentType);
      const index = comments.findIndex(item => item.from === myAccount);
      if (index === -1) {
        return list;
      }
      const myComment = list.splice(index, 1);
      return [...myComment, ...list];
    });
  }, [currentComment, checkedCommentType]);
  return (
    <div className={realStyle('commentModalWrapper')}>
      <div className={realStyle('header')}>
        {[...new Set(comments.map(item => item.body))].map(type => (
          <span
            className={realStyle('commentThumbItem', {
              checked: checkedCommentType === type,
            })}
            onClick={() => {
              setCheckedCommentType(type);
            }}
          >
            <img src={lodashGet(emojiSourceMap, `emoji_png_${type}.png`, 'unknown')} alt={`${type}`} />
            {comments.filter(item => item.body === type).length}
          </span>
        ))}
      </div>
      <div className={realStyle('body')}>
        <div className={realStyle('curCommentUsers')}>
          {[0, 1, 2].map(order => (
            // 分三列
            <div key={order} className={realStyle('column', `column-${order}`)}>
              {curCommentList
                .filter((item, index) => index % 3 === order)
                .map(item => (
                  <PopoverUser user={userlistState[item.from]}>
                    <div className={realStyle('commentUser')}>
                      <UserAvatar
                        style={{
                          width: '28px',
                          height: '28px',
                        }}
                        user={userlistState[item.from]}
                      />
                      <span className={realStyle('userName')}>{userlistState[item.from]?.nick}</span>
                    </div>
                  </PopoverUser>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
interface QuickCommentsApi {
  msg: IMMessage;
  [key: string]: any;
}
export const QuickComments: React.FC<QuickCommentsApi> = props => {
  const { msg, ...restProps } = props;
  const { getCommentByMsg, commentsMap } = useContext(CommentsContext);
  useEffect(() => {
    if (msg.status === 'success') {
      getCommentByMsg(msg);
    }
  }, [msg]);
  const myAccount = useObservable(() => nimApi.imself.getMyField(), '');
  const [visible, setVisible] = useState(false);
  const [checkedCommentBody, setCheckedCommentBody] = useState(0);
  const chooseComment = type => {
    setCheckedCommentBody(type);
    setVisible(true);
  };
  // 无map值或者值为空数组都直接返回
  if (!Reflect.has(commentsMap, msg.idClient) || commentsMap[msg.idClient].length <= 0) {
    return null;
  }
  // 1014消息快捷回复特殊样式
  return (
    <div className={realStyle('wrapper', judgeMsgType(msg, 'type', 1014) ? 'customWrapper' : '')}>
      <Modal
        title={getIn18Text('HUIYINGXIANGQING')}
        visible={visible}
        onOk={() => setVisible(false)}
        onCancel={() => setVisible(false)}
        width={600}
        footer={null}
        className={realStyle('commentModal')}
      >
        <ModalContent comments={commentsMap[msg.idClient]} currentComment={checkedCommentBody} />
      </Modal>

      {[...new Set(commentsMap[msg.idClient].map(item => item.body))].map(type => {
        let list = commentsMap[msg.idClient].filter(item => item.body === type).map(item => item.from);
        // 把当前用户置顶
        if (list.includes(myAccount || '')) {
          list = [...new Set([myAccount as string, ...list])];
        } else {
          list = [...new Set(list)];
        }
        return <QuickComment key={type} msg={msg} type={type} list={list} chooseComment={chooseComment} {...restProps} />;
      })}
    </div>
  );
};
