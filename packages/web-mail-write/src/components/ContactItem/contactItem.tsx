import React, { useCallback } from 'react';
import { List, Tooltip } from 'antd';
import { useDispatch } from 'react-redux';
import throttle from 'lodash/throttle';

import { UIContactModel } from '@web-contact/data';
import { highlightName, highlightEmail } from '../../util';
import { ADD_ITEM_TO_SELECTOR } from '@web-common/state/action';

import styles from './contactItem.module.scss';
import { AppActions, useActions, useAppDispatch } from '@web-common/state/createStore';
import { apiHolder, apis, ContactAndOrgApi } from 'api';

const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;

interface ContactItemProps<T> {
  item: T;
  search?: string; // 是否是搜索列表的item 如果是则需要高亮某些字段
}

const ContactItem: React.FC<ContactItemProps<UIContactModel>> = ({ item, search }) => {
  const {
    contact: { contactName, hitQuery, position },
    contactInfo,
  } = item;
  const appActions = useActions(AppActions);
  const dispatchPendingItem = useCallback(
    throttle(
      item => {
        appActions.doAddItemToSelector({
          add: true,
          pendingItem: item,
        });
      },
      1500,
      { trailing: false }
    ),
    []
  );

  const htmlName = highlightName(contactName, hitQuery, search, styles.hitText);
  const highlightedEmail = highlightEmail(contactApi.findContactInfoVal(contactInfo, 'EMAIL'), contactInfo, search, styles.hitText);
  const htmlEmail = highlightedEmail ? `(${highlightedEmail})` : '';

  const pos = position ? position.map(pos => `· ${pos.join('—')}`) : [];
  const titleNode = (
    <div>
      <div>
        {contactName}({contactApi.findContactInfoVal(contactInfo, 'EMAIL')})
      </div>
      {pos.length === 0 ? null : <br />}
      {pos.map(item => (
        <div key={item}>{item}</div>
      ))}
    </div>
  );
  const title = (
    <Tooltip title={titleNode} destroyTooltipOnHide={{ keepParent: false }} placement="bottomLeft" overlayClassName="contact-tooltip" mouseLeaveDelay={0}>
      <div onClick={() => dispatchPendingItem(item)}>
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
      {/* <button className={styles.contactBtn} onClick={() => dispatchPendingItem(item)}>
                填入
            </button> */}
    </Tooltip>
  );

  return (
    <List.Item className={styles.item}>
      <List.Item.Meta title={title} />
    </List.Item>
  );
};

export default ContactItem;
