/**
 * 邮件讨论-聊天框中的邮件卡片
 * warn: 无高度计算，不可用于虚拟列表
 */

import React, { useCallback } from 'react';
import { MailEntryModel } from 'api';
import '../vlistCards/MailCard/MailCard.scss';
import { defaultComAvatar, defaultDesc, defaultSender, defaultComTime, defaultComSummary } from '../vlistCards/MailCard/defaultComs';
import { defaultComAttachment } from '../vlistCards/MailCard/DefaultAttachment';
import { MailCardComProps, stringMap } from '../../../types';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';

interface props extends MailCardComProps {
  onDelete?: (data: MailEntryModel) => void;
  onClick?: (data: MailEntryModel) => void;
  needDelete?: boolean; // 是否需要删除按钮
}

const getComponent = (props: MailCardComProps, DefaultCom: React.FC<MailCardComProps> | null, Com?: React.FC<MailCardComProps> | null) =>
  Com != null ? <Com {...props} /> : DefaultCom != null ? <DefaultCom {...props} /> : null;

const MailChatCard: React.FC<props> = props => {
  const {
    data,
    className = '',
    // 自定义结构
    avatar,
    desc,
    from,
    time,
    summary,
    attachments,
    // 事件
    onDelete,
    onClick,
    needDelete = false,
  } = props;

  const comAvatar = getComponent(props, defaultComAvatar, avatar);
  const comDesc = getComponent(props, defaultDesc, desc);
  const comFrom = getComponent(props, defaultSender, from);
  const comTime = getComponent(props, defaultComTime, time);
  const comSummary = getComponent(props, defaultComSummary, summary);
  const comAttachments = getComponent(props, defaultComAttachment, attachments);

  const handleDelete = useCallback(
    (e: MouseEvent) => {
      e?.stopPropagation();
      onDelete && onDelete(data);
    },
    [data]
  );

  const handleClick = useCallback(() => {
    onClick && onClick(data);
  }, [data]);

  return (
    <div className={`mail-chat-card-warp ${className}`} onClick={handleClick}>
      <div className="summary-warp">
        <div className="summary">{comSummary}</div>
        {needDelete && (
          <div className="oper" onClick={handleDelete}>
            {' '}
            <ReadListIcons.RecycleSvg_Cof color="#A8AAAD" />{' '}
          </div>
        )}
      </div>
      <div className="card-content-warp">
        <div className="avatar">{comAvatar}</div>
        <div className="content">
          <div className="from-wrap">
            <div className="from">{comFrom}</div>
            <div className="time">{comTime}</div>
          </div>
          <div className="desc">{comDesc}</div>
          <div className="attachments-warp no-click">{comAttachments}</div>
        </div>
      </div>
    </div>
  );
};

export default MailChatCard;
