import React from 'react';
import { Tooltip } from 'antd';
import { ContactModel, ContactAndOrgApi, apiHolder, api, apis } from 'api';
import classnames from 'classnames';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import DeleteTag from '@web-common/components/UI/Icons/svgs/DeleteTagSvg';

import { verifyEmail } from '../../../util';
import styles from '../../Selector/selector.module.scss';
import praiseStyles from './praiseMail.module.scss';

const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;

export interface IContactChipProps {
  value: string;
  item: ContactModel;
  onClose?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const ContactChip: React.FC<IContactChipProps> = props => {
  const { value, item, onClose } = props;
  const email = contactApi.findContactInfoVal(item.contactInfo || []) || value;

  const truncateValue = email?.length > 20 ? `${email.slice(0, 18)}...` : email;
  const correctEmail = verifyEmail(email?.trim());

  let children;
  // 错误邮箱地址
  if (!correctEmail) {
    children = (
      <div
        className={classnames(styles.capsuleTag, {
          [styles.capsuleTagWrong]: true,
          // 'tag-chosen': isChosen,
          'contact-tag': true,
        })}
      >
        <span className={classnames([styles.charAvatar, styles.charAvatarWrong])}>!</span>
        <span className={classnames([styles.label, styles.labelWrong])}>{truncateValue}</span>
      </div>
    );
  } else if (!item) {
    children = (
      <div
        className={classnames(styles.capsuleTag, {
          // 'tag-chosen': isChosen,
          'contact-tag': true,
        })}
      >
        <AvatarTag
          style={{ display: 'inline-block' }}
          size={20}
          propEmail={email}
          user={{
            name: value,
            color: '#ffaa00',
          }}
        />
        <span className={styles.label}>{truncateValue}</span>
      </div>
    );
  } else {
    const {
      contact: { contactName, avatar, color, id },
    } = item;
    const truncateName = contactName?.length > 20 ? `${contactName.slice(0, 18)}...` : contactName;
    children = (
      <div data={email} className={classnames(styles.capsuleTag, { 'contact-tag': true })}>
        <AvatarTag
          size={20}
          contactId={id}
          propEmail={email}
          user={{
            name: contactName,
            avatar,
            color,
          }}
        />
        <span className={styles.label}>{truncateName}</span>
      </div>
    );
  }

  return (
    <Tooltip
      title={correctEmail ? email : `${email}（邮箱格式错误）`}
      destroyTooltipOnHide
      // destroyTooltipOnHide={{ keepParent: false, }}
      placement="bottomLeft"
      overlayClassName="selector-tag-tooltip"
    >
      <div className={praiseStyles.tagWrapper}>
        <div className={praiseStyles.tagCloseBtn} onClick={onClose}>
          <DeleteTag />
        </div>
        {children}
      </div>
    </Tooltip>
  );
};

export default ContactChip;
