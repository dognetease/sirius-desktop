import React, { useState, useEffect, useCallback } from 'react';
import { List, Tooltip } from 'antd';
import classnames from 'classnames';

import { UIContactModel } from '@web-contact/data';
import { highlightName, highlightText } from '@web-mail-write/util';
import { Checkbox } from '../Contact/contact';

import styles from './contactItem.module.scss';

interface ContactItemProps<T> {
  item: T;
  search?: string; // 需要高亮的字段
  chooseMember?: Function;
  chosen: boolean; // 选项是否被选中
  disabled?: boolean;
}

const ContactItem: React.FC<ContactItemProps<UIContactModel>> = props => {
  const { item, search, chooseMember, chosen, disabled = false } = props;
  const {
    contact: { contactName, hitQuery, position, defaultEmail },
  } = item;
  const [checked, setChecked] = useState<boolean>(false);

  useEffect(() => {
    setChecked(chosen);
  }, [chosen]);

  const htmlName = highlightName(contactName, hitQuery, search, styles.hitText);
  const highlightedEmail = highlightText(defaultEmail, search, styles.hitText);
  const htmlEmail = highlightedEmail ? `(${highlightedEmail})` : '';
  const pos = position ? position.map(pos => `· ${pos.join('—')}`) : [];

  const titleNode = (
    <>
      <div className={styles.mainTitle}>{contactName}</div>
      {!!defaultEmail && <div className={styles.subTitle}>{defaultEmail}</div>}
      {pos.map(item => (
        <div key={item} className={styles.subTitle}>
          {item}
        </div>
      ))}
    </>
  );

  const onSelect = () => {
    if (!disabled && chooseMember) {
      setChecked(chooseMember(item));
    }
  };

  const title = (
    <Tooltip title={titleNode} destroyTooltipOnHide={{ keepParent: false }} placement="bottomLeft" overlayClassName="member-contact-tooltip" mouseLeaveDelay={0}>
      <div className={styles.itemTitle} onClick={onSelect}>
        <Checkbox checked={checked} disabled={disabled} style={{ position: 'absolute', left: '16px', top: '6px' }} />
        <span
          className={styles.nameTitleText}
          dangerouslySetInnerHTML={{
            __html: htmlName,
          }}
        />
        {htmlEmail && (
          <span
            className={styles.emailTitleText}
            dangerouslySetInnerHTML={{
              __html: htmlEmail,
            }}
          />
        )}
      </div>
    </Tooltip>
  );

  return (
    <List.Item className={classnames([styles.item], { [styles.itemSelected]: checked })}>
      <List.Item.Meta title={title} />
    </List.Item>
  );
};

export default ContactItem;
