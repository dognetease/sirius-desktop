import React from 'react';
import classnames, { Argument as ClassnamesType } from 'classnames';
import { api, apis, ContactEmailItem, MailApi } from 'api';
import { Tooltip } from 'antd';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import Attachments from './attachments';
import style from './email.module.scss';
import { getIn18Text } from 'api';

interface EmailDataType extends ContactEmailItem {
  isSent: boolean;
  title: string;
  time: string;
}

interface EmailProps {
  className?: ClassnamesType;
  data: EmailDataType;
  onEmailClick: () => void;
  onTitleClick: () => void;
  onAttachmentClick: () => void;
}
const mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
// 回复邮件
const handleApply = (mid: string, isAll: boolean) => {
  mailApi.doReplayMail(mid, isAll);
};
// 转发邮件
const handleReward = (mid: string) => {
  mailApi.doForwardMail(mid);
};

const Email: React.FC<EmailProps> = props => {
  const { className, data, onEmailClick, onTitleClick, onAttachmentClick } = props;

  return (
    <div className={classnames(style.email, className)} onClick={onEmailClick}>
      <div className={style.overview}>
        <div className={classnames([style.icon, data.isSent ? style.sent : style.received])} />
        <div className={style.content}>
          <div className={style.title} onClick={onTitleClick}>
            {data.title}
          </div>
          <div className={style.summary}>{data.summary || getIn18Text('CIYOUJIANWUWENZINEIRONG...')}</div>
        </div>
        <div className={style.time}>{data.time}</div>
      </div>
      <Attachments className={style.attachments} list={data.attachments} onItemClick={onAttachmentClick} />
      {data.isSelf && (
        <div className={style.actions} onClick={e => e.stopPropagation()}>
          <Tooltip placement="bottom" title={getIn18Text('HUIFU')} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
            <div className="u-tool-btn" onClick={() => handleApply(data.mail_id, false)}>
              <ReadListIcons.ReplySvg />
            </div>
          </Tooltip>
          <Tooltip placement="bottom" title={getIn18Text('HUIFUQUANBU')} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
            <div className="u-tool-btn" onClick={() => handleApply(data.mail_id, true)}>
              <ReadListIcons.ReplyAllSvg />
            </div>
          </Tooltip>
          <Tooltip placement="bottom" title={getIn18Text('ZHUANFA')} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
            <div className="u-tool-btn" onClick={() => handleReward(data.mail_id)}>
              <ReadListIcons.TransmitSvg />
            </div>
          </Tooltip>
        </div>
      )}
    </div>
  );
};
Email.defaultProps = {};
export default Email;
