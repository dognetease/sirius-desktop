/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import lodashGet from 'lodash/get';
import { api, apis, MailApi, MailEntryModel } from 'api';
import classnames from 'classnames';
import moment from 'moment';
import style from './emailList.module.scss';
import { AttachFiles } from '../attachFiles';
import { getIn18Text } from 'api';

interface CommonMailItemProps {
  email: MailEntryModel;
  relatedEmail: string;
  onPreview?: (item: MailEntryModel) => void;
}
export enum FidType {
  Received = 1,
  Draft = 2,
  Sent = 3,
}
const mailApi = api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const year = new Date().getFullYear();
export const CommonEmailItem = (props: CommonMailItemProps) => {
  const { email, onPreview, relatedEmail } = props;
  const parsedNames = (mailApi as any).contactHandler.parseContactStr([
    lodashGet(email, 'sender.contact.contact.accountName', ''),
    email.receiver[0]?.contact?.contact.accountName || email._account,
  ]).parsed;
  const fromName = parsedNames[0]?.name ?? getIn18Text('WEIZHI');
  const toName = parsedNames[1]?.name ?? getIn18Text('WEIZHI');
  const emailTitle = `${fromName}向${toName}发送`;
  const date = new Date(lodashGet(email, 'entry.sendTime', moment()));
  const dateString = date.getFullYear() < year ? moment(date).format('YYYY-MM-DD HH:mm') : moment(date).format('MM-DD HH:mm');
  const sendEmail = email.sender?.contact?.contact?.displayEmail || email.sender?.contact?.contact?.accountName;
  const isReceive = relatedEmail === sendEmail; // 是对方发送的就是我的收件
  return (
    <div className={style.emailItem} onClick={() => onPreview && onPreview(email)}>
      <div className={classnames(style.fidType, !isReceive ? style.sent : '')}>{!isReceive ? getIn18Text('FA') : getIn18Text('SHOU')}</div>
      <div className={style.emailMain}>
        <div className={style.emailHeader}>
          <span className={style.fromTo} title={emailTitle}>
            {emailTitle}
          </span>
          <span className={style.sentDate}>{dateString}</span>
        </div>
        <div className={style.emailTitle}>{email?.entry?.title || getIn18Text('WUZHUTI')}</div>
        <div className={classnames(style.emailContent, style.emailSummary)}>
          <div>{email?.entry?.brief || getIn18Text('WUWENZINEIRONG')}</div>
          <AttachFiles showNum={2} data={email?.entry?.attachment?.map(i => ({ ...i, name: i.fileName })) || []} />
        </div>
      </div>
    </div>
  );
};
