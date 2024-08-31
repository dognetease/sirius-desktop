import React from 'react';
import classnames from 'classnames';
import { api, apis, ContactDetail, MailApi, getIn18Text } from 'api';
import { message, Tooltip } from 'antd';
import CopyToClipboard from 'react-copy-to-clipboard';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { ReactComponent as CheckedCircleIcon } from '@/images/icons/checked_circle.svg';
import { ReactComponent as CloseCircleIcon } from '@/images/icons/close_circle.svg';
import { ReactComponent as CopyIcon } from '@/images/mailCustomerCard/clipboard-copy.svg';
import style from './contactCard.module.scss';
import defaultUserIcon from '@/images/icons/customerDetail/default-user.png';
import { PrivilegeCheckForMailPlus } from '@/components/UI/PrivilegeEnhance';

interface ContactCardProps {
  className?: string;
  data: ContactDetail;
  onWriteMail?: (email: string) => void;
  onEdit?: (contactId: string) => void;
  readonly?: boolean;
}
const mailApi = api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
function handleWriteMail(emailAddress: string) {
  mailApi.doWriteMailToContact([emailAddress]);
}
const ContactCard: React.FC<ContactCardProps> = props => {
  const { className, data, onWriteMail = handleWriteMail, onEdit, readonly } = props;
  const telephones = Array.isArray(data?.telephones) ? data.telephones.filter(t => !!t) : [];
  // const telephone = Array.isArray(data?.telephones) ? data?.telephones[0] : undefined;
  return (
    <div className={classnames([style.contactCard, className])}>
      <div className={style.simple}>
        <div className={style.icon}>
          <AvatarTag
            innerStyle={{ border: 'none' }}
            size={32}
            user={{
              name: data.contact_name,
              avatar: data.contact_icon || (data.contact_name ? undefined : defaultUserIcon),
              email: data.email || '123@163.com',
            }}
          />
        </div>
        <div className={style.content}>
          <div className={style.contactRow}>
            <div className={classnames(style.rowContent, style.contactName)} title={data.contact_name}>
              <div style={{ display: 'flex' }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.contact_name || data.email || '-'}</span>
                {data.main_contact && <span className={style.mainContactTag}>{getIn18Text('ZHULIANXIREN')}</span>}
              </div>
            </div>
            {!readonly && (
              <Tooltip title={getIn18Text('BIANJILIANXIREN')}>
                <PrivilegeCheckForMailPlus accessLabel="OP" resourceLabel="CONTACT">
                  <div className={classnames(style.editTrigger, style.rowIcon)} onClick={() => onEdit && onEdit(data.contact_id)} />
                </PrivilegeCheckForMailPlus>
              </Tooltip>
            )}
          </div>
          <div className={style.contactRow}>
            <div className={style.rowContent} title={data.email}>
              {data.email || getIn18Text(['ZANWU', 'LIANXIRENYOUXIANG'])}
            </div>
            {data.email && (
              <Tooltip title={getIn18Text('FAYOUJIAN')}>
                <div className={classnames(style.emailTrigger, style.rowIcon)} onClick={() => onWriteMail && onWriteMail(data.email)} />
              </Tooltip>
            )}
          </div>
          {telephones.map((telephone, idx) => (
            <div key={idx} className={style.contactRow}>
              <div className={style.rowContent} title={telephone}>
                {telephone}
              </div>
              <CopyToClipboard
                onCopy={(_, result) => {
                  message.success({
                    icon: result ? <CheckedCircleIcon /> : <CloseCircleIcon />,
                    content: <span style={{ marginLeft: 8 }}>{result ? getIn18Text('FUZHICHENGGONG') : getIn18Text('FUZHISHIBAI')}</span>,
                  });
                }}
                text={telephone}
              >
                <CopyIcon className={style.rowIcon} />
              </CopyToClipboard>
            </div>
          ))}
          <div className={style.contactRow}>
            <div className={style.rowContent} title={data.whats_app}>
              WhatsApp: {data.whats_app}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ContactCard;
