/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { api, apis, MailApi, CustomerEmailItem, CustomerEmailItemHideState } from 'api';
import classnames from 'classnames';
import moment from 'moment';
import RightOutlined from '@ant-design/icons/RightOutlined';
import style from './emailList.module.scss';
import { AttachFiles } from '../attachFiles';
import { getIn18Text } from 'api';
import { BianjiHuifu, BianjiZhuanfa, TongyongHuifuquanbu } from '@sirius/icons';
import { throttle } from 'lodash';
import { Tooltip } from 'antd';

interface MailItemProps {
  email: CustomerEmailItem;
  onPreview?: (item: CustomerEmailItem) => void;
  onCreateAuth?: () => void;
  onViewAuthProgress?: () => void;
}
export enum FidType {
  Received = 1,
  Draft = 2,
  Sent = 3,
}

const mailApi = api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;

const AuthEmailContent = ({
  emailHideState,
  onCreateAuth,
  onViewAuthProgress,
}: {
  emailHideState: string;
  onCreateAuth?: () => void;
  onViewAuthProgress?: () => void;
}) => {
  const handleCreate = (e: React.MouseEvent) => {
    onCreateAuth && onCreateAuth();
    e.stopPropagation();
  };
  const handleView = (e: React.MouseEvent) => {
    onViewAuthProgress && onViewAuthProgress();
    e.stopPropagation();
  };
  return (
    <div className={style.emailContent}>
      <span>{getIn18Text('ZANWUQUANXIANCHAKAN')}</span>
      {emailHideState === CustomerEmailItemHideState.NeedAuth ? (
        <a onClick={handleCreate}>
          {getIn18Text('SHENQINGCHAKAN')}
          <RightOutlined />
        </a>
      ) : (
        <a onClick={handleView}>
          {getIn18Text('SHENQINGZHONG')}
          <RightOutlined />
        </a>
      )}
    </div>
  );
};
const year = new Date().getFullYear();
export const EmailItem = (props: MailItemProps) => {
  const { email, onCreateAuth, onPreview, onViewAuthProgress } = props;
  const parsedNames = (mailApi as any).contactHandler.parseContactStr([email.from, email.to]).parsed;
  const fromName = parsedNames[0]?.name ?? getIn18Text('WEIZHI');
  const toName = parsedNames[1]?.name ?? getIn18Text('WEIZHI');
  const emailTitle = `${fromName}向${toName}发送`;
  const date = new Date(email.sent_date);
  const dateString = date.getFullYear() < year ? moment(date).format('YYYY-MM-DD HH:mm') : moment(date).format('MM-DD HH:mm');

  // 点击回复
  const handleReply = throttle((e: any) => {
    e && e.stopPropagation();
    mailApi.doReplayMail(email.mail_id);
  }, 2000);
  // 点击回复全部
  const handleReplyAll = throttle((e: any) => {
    e && e.stopPropagation();
    mailApi.doReplayMail(email.mail_id, true);
  }, 2000);
  // 点击转发
  const handleForward = throttle((e: any) => {
    e && e.stopPropagation();
    mailApi.doForwardMail(email.mail_id);
  }, 2000);

  return (
    <div className={style.emailItem} onClick={() => onPreview && onPreview(email)}>
      <div className={classnames(style.fidType, email.fid === FidType.Sent ? style.sent : '')}>
        {/* eslint-disable-next-line no-nested-ternary */}
        {email.fid === FidType.Sent ? getIn18Text('FA') : getIn18Text('SHOU')}
      </div>
      <div className={style.emailMain}>
        <div className={style.emailHeader}>
          <span className={style.fromTo} title={emailTitle}>
            {emailTitle}
          </span>
          <span className={style.sentDate}>{dateString}</span>
        </div>
        <div className={style.emailTitle}>
          <span className={style.emailTitleContent}>{email.subject || getIn18Text('WUZHUTI')}</span>
          {!!email.isSelf && (
            <span className={style.emailTitleIcon}>
              <Tooltip title={getIn18Text('HUIFU')}>
                <BianjiHuifu onClick={handleReply} fontSize={16} />
              </Tooltip>
              <Tooltip title={getIn18Text('HUIFUQUANBU')}>
                <TongyongHuifuquanbu onClick={handleReplyAll} fontSize={16} />
              </Tooltip>
              <Tooltip title={getIn18Text('ZHUANFA')}>
                <BianjiZhuanfa onClick={handleForward} fontSize={16} />
              </Tooltip>
            </span>
          )}
        </div>
        {email.hideState === CustomerEmailItemHideState.NoNeedAuth ? (
          <div className={classnames(style.emailContent, style.emailSummary)}>
            <div>{email.summary || getIn18Text('WUWENZINEIRONG')}</div>
            <AttachFiles showNum={2} data={email.attachments.map(i => ({ ...i, name: i.file_name }))} />
          </div>
        ) : (
          <AuthEmailContent emailHideState={email.hideState} onCreateAuth={onCreateAuth} onViewAuthProgress={onViewAuthProgress} />
        )}
      </div>
    </div>
  );
};
