import { List, Tooltip } from 'antd';
import React from 'react';
import classnames from 'classnames';
import { CustomerOrgType } from 'api';
import { splitSearchHit } from '@web-contact/util';
import styles from './index.module.scss';
import Checkbox from '../Checkbox';
import { ContactOrgItem, isOrg } from '@web-common/components/util/contact';
import { ContactOrgAvatar } from '@web-common/components/UI/Avatar/contactOrgAvatar';
import { contactApi, ContactItem, OrgItem } from '@web-common/utils/contact_util';

import { Space } from 'antd';
import { transTreeName } from '../tree/data';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import { getIn18Text } from 'api';
import { CustomerLabelByRole } from '@web-mail/components/ReadMail/component/CustomerLabel';

export interface ListItemProps {
  testId?: string;
  isLeaf?: boolean;
  type: 'normal' | 'search';
  showAvatar?: boolean;
  showPosition?: boolean;
  showCheckbox?: boolean;
  showDelete?: boolean;
  showMailListIcon?: boolean;
  checked?: boolean;
  disableCheck?: boolean;
  selected?: boolean;
  item: ContactOrgItem;

  onSelect?(): void;
  onSelectMailListIcon?(c: ContactItem): void;

  onDelete?(c: ContactItem): void;

  searchText?: string;
  className?: string;
  style?: React.CSSProperties;
}

const ListItem: React.FC<ListItemProps> = props => {
  const {
    testId,
    isLeaf = true,
    showPosition,
    showAvatar,
    item,
    onSelect,
    onDelete,
    searchText,
    checked,
    disableCheck,
    selected,
    showCheckbox,
    showDelete,
    showMailListIcon,
    onSelectMailListIcon,
    className,
    style,
    type,
  } = props;
  const renderHighLight = (text: string) => {
    if (!searchText) {
      return text;
    }
    const result = splitSearchHit(searchText, text);
    if (!result) {
      return text;
    }
    return (
      <>
        {result.head}
        <b className={styles.hitText}>{result.target}</b>
        {result.tail}
      </>
    );
  };
  const renderDepartment = (position: ContactItem['position']) => {
    if (position === undefined) {
      return '';
    }
    return position.map(de => de.join('/')).join('-');
  };

  const renderDelete = () => {
    return (
      <div
        className={`dark-invert ${styles.itemDelete}`}
        onClick={() => {
          onDelete && onDelete(item as ContactItem);
        }}
      />
    );
  };
  let subtitle;
  let title;
  let titleTip;
  let department = <></>;
  let titleLabelRole; // 渲染lable需要的EmailRole
  let isContact; // 是客户联系人还是客户
  let isMailList = false;
  const _isOrg = !isLeaf || isOrg(item);
  if (_isOrg) {
    const org = item as OrgItem;
    const isTeam = org.type === 2000;
    if (item.type === 2002 || item.type === 2003) {
      titleLabelRole = org.customerRole;
    }
    title = renderHighLight(org.orgName);
    titleTip = org.orgName;
    title = (
      <>
        {title}
        {isTeam && org.memberNum !== undefined ? `（${org.memberNum}${getIn18Text('REN')}）` : ''}
      </>
    );
  } else {
    const contact = item as ContactItem;
    // isCustomer = contact.type === 'customer';
    title = renderHighLight(contact.name || contact.email);
    titleTip = contact.name || contact.email;
    // titleLabel改为使用组件实现
    titleLabelRole = contact.customerRole;
    isContact = true;

    subtitle = renderHighLight(contact.email);
    if (showPosition && contact.position) {
      department = <p className={styles.subtitle}>{renderDepartment(contact.position)}</p>;
    }
    isMailList = Boolean(contact.accountType !== undefined && contactApi.isMailListByAccountType(contact.accountType));
  }
  return (
    <List.Item
      data-test-id={testId}
      style={style}
      onClick={() => {
        onSelect && onSelect();
      }}
      className={classnames(styles.item, styles[type], className, {
        [styles.itemSelect]: selected,
        [styles.itemSelectDisable]: disableCheck,
      })}
    >
      <div
        className={classnames(styles.itemWrap, {
          [styles.itemWrapPaddingRight]: showDelete && type === 'normal',
        })}
      >
        <div className={styles.itemAvatar}>
          <div className={styles.itemAvatarContainer}>
            {showCheckbox ? (
              <div className={styles.itemAvatarCheckbox}>
                <Checkbox checked={checked} disabled={disableCheck} />
              </div>
            ) : null}
            {showAvatar ? (
              <div className={styles.itemAvatarWrap}>
                <ContactOrgAvatar item={item} />
              </div>
            ) : null}
          </div>
        </div>
        <div className={styles.itemContent}>
          <div className={styles.titleWrap}>
            <Tooltip title={titleTip} mouseEnterDelay={1}>
              <i className={classnames(styles.titleName, disableCheck && styles.disableName)}>{title}</i>
            </Tooltip>
            {/* {titleLabel && (
              <span
                className={classnames(styles.titleLabel, {
                  [styles.isMy]: isCustomer,
                })}
              >
                {titleLabel}
              </span>
            )} */}
            {titleLabelRole && <CustomerLabelByRole role={titleLabelRole} isContact={isContact} style={{ marginLeft: 8 }} />}
            {showMailListIcon && isMailList && (
              <b
                className={styles.mailListIcon}
                onClick={e => {
                  e.stopPropagation();
                  if (item) {
                    onSelectMailListIcon && onSelectMailListIcon(item as ContactItem);
                  }
                }}
              >
                <Tooltip title={transTreeName('memberList')}>
                  <Space>
                    <EyeOutlined />
                  </Space>
                </Tooltip>
              </b>
            )}
          </div>
          {subtitle && (
            <div className={styles.descWrap}>
              <Tooltip title={isLeaf ? subtitle : ''} mouseEnterDelay={1}>
                <p className={styles.subtitle}>{subtitle}</p>
              </Tooltip>
              {department}
            </div>
          )}
        </div>
        {showDelete && type === 'normal' ? renderDelete() : null}
      </div>
    </List.Item>
  );
};
export default ListItem;
