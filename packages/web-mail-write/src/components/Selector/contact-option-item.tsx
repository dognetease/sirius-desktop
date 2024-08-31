import React from 'react';
import { highlightName, highlightText } from '../../util';
import styles from './selector.module.scss';
import Avatar from '@web-common/components/UI/Avatar';
// import styleTitle from '@web-common/components/UI/SiriusContact/listItem/index.module.scss';
// import classnames from 'classnames';
import IconCard from '@web-common/components/UI/IconCard';
import { ContactItem } from '@web-common/utils/contact_util';
import { CustomerLabelByRole } from '@web-mail/components/ReadMail/component/CustomerLabel';

export interface OptionItemProps {
  item: ContactItem;
  search?: string;
}

const highlightEmail = (textToSearch: string = '', searchTerm: string | undefined, hitStyle: any) => {
  let html = textToSearch;
  if (searchTerm && html) {
    html = highlightText(html, searchTerm, hitStyle);
  }
  return html;
};
const OptionItem: React.FC<OptionItemProps> = props => {
  const { item, search } = props;
  if (!item) {
    return null;
  }
  const { hitQuery = [], name: contactName = '', position = [], email, type, id, avatar, remark } = item;

  const org = (position[0] || []).join('-');
  const htmlName = highlightName(contactName, hitQuery, search, styles.hitText);
  const highlightedEmail = highlightEmail(email || '', search, styles.hitText);
  const htmlEmail = htmlName ? `&lt;${highlightedEmail}&gt;` : highlightedEmail;

  const isCustomer = type === 'customer';
  let titleLabelRole;
  if (type === 'customer' || type === 'clue') {
    titleLabelRole = item.customerRole;
  }

  return (
    <div className={styles.optionItem} key={id + '_' + email}>
      <div className={styles.optionAvatarWrap}>
        {!titleLabelRole ? (
          <Avatar
            size={20}
            item={{
              contact: {
                id,
                avatar,
                contactName,
                email,
              },
            }}
          />
        ) : (
          <IconCard type={isCustomer ? 'crmClient' : 'hintClient'} />
        )}
      </div>
      <span
        className={styles.optionContactName}
        dangerouslySetInnerHTML={{
          __html: htmlName,
        }}
      />
      <span
        className={styles.optionContactName}
        dangerouslySetInnerHTML={{
          __html: htmlEmail,
        }}
      />
      <span className={styles.optionOrg}>{org}</span>
      {remark && <span className={styles.optionOrg}>备注：{remark}</span>}
      {/* {titleLabel && (
        <span
          className={classnames(styleTitle.titleLabel, {
            [styleTitle.isMy]: isCustomer,
          })}
        >
          {titleLabel}联系人
        </span>
      )} */}
      {titleLabelRole && <CustomerLabelByRole role={titleLabelRole} isContact={true} style={{ marginLeft: 8 }} />}
    </div>
  );
};

export default OptionItem;
