import React, { FC, useEffect, useState } from 'react';
import classnames from 'classnames/bind';
import { Modal } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder, apis, api, MailItemRes, IMDiscussApi, ContactAndOrgApi, ContactModel, MailApi, MailEntryModel, DataTrackerApi } from 'api';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import MailChatCard from '@web-mail/common/components/MailChatCard/MailChatCard';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import { openReadOnlyMailInWinow } from '@web-mail/util';
import ChatTimeline from '../chatDisplay/chatTimeline';
import styles from './teamInternalMails.module.scss';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(styles);
const discussApi = apiHolder.api.requireLogicalApi(apis.imDiscussApiImpl) as IMDiscussApi;
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const { confirm } = Modal;
export const MailListItem: FC<{
  item: MailItemRes;
  teamId: string;
  needDelete: boolean;
}> = props => {
  const { item, teamId, needDelete } = props;
  const [contact, setContact] = useState<ContactModel>();
  const [data, setData] = useState<MailEntryModel>();
  const showConfirm = () => {
    confirm({
      title: getIn18Text('QUEDINGYAOSHANCHU'),
      icon: <ExclamationCircleOutlined />,
      content: getIn18Text('SHANCHUHOU\uFF0CQUN'),
      okText: getIn18Text('QUEDING'),
      cancelText: getIn18Text('QUXIAO'),
      mask: true,
      centered: true,
      onOk: async () => {
        try {
          const res = await discussApi.cancelDiscussBind({
            msgId: item.msgId,
            teamId,
          });
          if (res && res.success) {
            return message.success(getIn18Text('SHANCHUCHENGGONG'));
          }
          message.error(getIn18Text('SHANCHUSHIBAI\uFF0C'));
        } catch (err) {
          message.error(getIn18Text('SHANCHUSHIBAI\uFF0C'));
        }
      },
    });
    trackApi.track('pc_click_mailChat_mailListBox_deleteMail');
  };
  useEffect(() => {
    // 获取分享用户信息
    contactApi.doGetContactByItem({ type: 'EMAIL', value: [item.email], filterType: 'enterprise' }).then(res => {
      setContact(res[0]);
    });
    mailApi.assembleMail(item).then(res => {
      setData(res);
    });
  }, [item]);
  const openMail = () => {
    if (data && data.entry) {
      openReadOnlyMailInWinow(data?.entry.id, teamId);
      trackApi.track('pc_click_mailChat_mailListBox_seeMailDetail');
    }
  };
  if (contact == null) {
    return <></>;
  }
  return (
    <div className={realStyle('teamMailListItem')}>
      <div className={realStyle('teamMailListItemHeader')}>
        <div className={realStyle('teamMailListItemHeaderLeft')}>
          <AvatarTag
            className={realStyle('userAvatar')}
            user={{
              avatar: contact.contact.avatar,
              name: contact.contact.contactName,
              color: contact.contact.color,
            }}
            size={24}
          />
          <div className={realStyle('username')}>{contact.contact.contactName}</div>
          <div className={realStyle('userOperator')}>{getIn18Text('FENXIANG')}</div>
        </div>
        <ChatTimeline time={item.createTime} classnames={realStyle('teamMailListItemHeaderRight')} />
      </div>
      {data != null && <MailChatCard onDelete={showConfirm} onClick={openMail} data={data} needDelete={needDelete} />}
    </div>
  );
};
