import React, { useCallback, MouseEvent } from 'react';
import classnames from 'classnames';
import List from 'antd/lib/list';
import Checkbox, { AbstractCheckboxProps, CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox';
import { apiHolder, apis, MailApi } from 'api';
import { Tooltip } from 'antd';
import styles from './searchContactItem.module.scss';
import { SendEmailIcon } from '@web-common/components/UI/Icons/icons';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { contactApi } from '@web-contact/_mock_';
import { ContactItem, getDisplayEmailInfo } from '@web-common/utils/contact_util';

const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;

export const itemHeight = 70;
export const itemDepartmentHeight = 114 - itemHeight;
export const contactHeaderheight = 44;

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // $&表示整个被匹配的字符串
};
const splitSearchHit = (hit: string, text: string) => {
  const searchText = escapeRegExp(hit.slice());
  const reg = new RegExp(searchText, 'i');
  const result = reg.exec(text.slice());
  if (!result) {
    return null;
  }
  const head = text.substring(0, result.index);
  const target = text.substring(result.index, result.index + hit.length);
  const tail = text.substring(result.index + hit.length);

  return {
    head,
    target,
    tail,
  };
};

interface ItemProps<T> extends RenderProps<T> {
  item: T;
}

export interface RenderProps<T> {
  onCheck?(checked: boolean, id: string, item: T): void;

  onSelect?(item: T): void;

  currentSelectedId?: string | number;
  showTag?: boolean;
  checkedContacts?: Map<number | string, ContactItem>;
  search?: string; // 是否是搜索列表的item 如果是则需要高亮某些字段
  ref?: any;
  im?: boolean;
  index?: number;
  customClassnames?: string;
  // total?: number;
}

const ItemAvatar: React.FC<{
  item: ContactItem;
  search?: boolean;
  checked?: boolean;
  checkedContacts?: Map<number | string, ContactItem>;
  testId?: string;
  onChange?: AbstractCheckboxProps<CheckboxChangeEvent>['onChange'];
}> = ({ item, checked, onChange, search, checkedContacts, testId = '' }) => {
  const avatarUrl = item.avatar;
  const showPendant = item.type === 'enterprise';

  return (
    <>
      {!search && (
        <Checkbox
          onClick={e => e.stopPropagation()}
          checked={checked}
          onChange={onChange}
          className={classnames(styles.itemAvatarCheckbox, {
            [styles.allCheckboxShow]: (checkedContacts && checkedContacts?.size > 0) || false,
          })}
        />
      )}
      <AvatarTag
        size={32}
        testId={testId}
        className={classnames([
          styles.itemAvatar,
          {
            [styles.allCheckboxHidden]: (checkedContacts && checkedContacts?.size > 0) || false,
          },
        ])}
        contactId={item.id}
        showPendant={showPendant}
        propEmail={item.email}
        user={{
          name: item.contactName || item.name,
          avatar: avatarUrl,
          color: item.color,
        }}
      />
    </>
  );
};

const MutiMailTag: React.FC<{}> = ({ children }) => <span className={styles.tag}>{children}</span>;

export const Item = React.forwardRef<any, ItemProps<ContactItem>>(
  (
    {
      item,
      onCheck,
      onSelect,
      currentSelectedId,
      showTag,
      checkedContacts,
      search,
      im = false,
      index,
      customClassnames,
      // total
    },
    _ref
  ) => {
    const contactName = item.name || item.contactName;
    const { id, hitQuery, position, type, labelPoint, contactLabel, contactInfo } = item;
    const accountName = contactApi.doGetModelDisplayEmail(item as ContactItem) || item.email;
    const handleChange = (e: CheckboxChangeEvent) => {
      if (onCheck) {
        onCheck(e.target.checked, id, item);
      }
    };
    const handleSelect = () => {
      if (onSelect) {
        onSelect(item);
      }
    };
    const handleSend = (e: MouseEvent) => {
      e.stopPropagation();
      mailApi.doWriteMailToContact([accountName]);
    };
    const checked = checkedContacts?.has(id);
    const renderTitle = useCallback(() => {
      const hit = hitQuery && (hitQuery.includes('contactName') || hitQuery.includes('contactPYName'));
      if (!search || !hit) {
        return contactName;
      }
      const result = splitSearchHit(search, contactName);
      if (!result) {
        return contactName;
      }
      const { head, target, tail } = result;
      // const match = `<b class="${styles.hitText}">$1</b>`;
      // const htmlName = contactName.replace(reg, match)
      return (
        <>
          {head}
          <b className={styles.hitText}>{target}</b>
          {tail}
        </>
      );
    }, [search, contactName, hitQuery]);
    const renderEmail = useCallback(() => {
      const hits = contactInfo?.filter(e => e.hitQuery && e.contactItemType === 'EMAIL' && e.hitQuery.includes('contactItemVal'));

      if (hits && hits.length > 0 && search && accountName) {
        const result = splitSearchHit(search, accountName);
        if (!result) {
          return accountName;
        }
        const { head, target, tail } = result;
        // const match = `<b class="${styles.hitText}">$1</b>`;
        // const htmlName = contactName.replace(reg, match)
        return (
          <>
            {head}
            <b className={styles.hitText}>{target}</b>
            {tail}
          </>
        );
      }
      return accountName;
    }, [contactInfo, accountName, search]);
    const renderEmailCountTag = useCallback(() => {
      const emailList = contactInfo ? getDisplayEmailInfo(contactInfo) : [];
      const more = emailList.length - 1;
      if (more < 1) {
        return null;
      }
      return <MutiMailTag>{`+${more > 99 ? 99 : more}`}</MutiMailTag>;
    }, [contactInfo]);

    // const tailOrHeadElement = (index !== undefined && total === index) || index === 0
    return (
      <>
        {showTag && labelPoint && (
          <div className={styles.itemHeader} style={{ height: contactHeaderheight }}>
            {fixContactLabel(contactLabel)}
          </div>
        )}
        <List.Item
          onClick={handleSelect}
          // style={{
          //     margin: `${!showTag && tailOrHeadElement ? '12px' : 0} 12px`,
          // }}
          className={classnames([styles.item], customClassnames, {
            [styles.itemIm]: im,
            [styles.itemSearch]: !!search,
            [styles.itemChecked]: checked,
            [styles.itemSelected]: currentSelectedId === id,
            [styles.itemDepartment]: type !== 'personal' && position && position.length,
          })}
        >
          <List.Item.Meta
            avatar={
              <ItemAvatar
                testId="im_seach_modal_contact_avatar"
                search={!!search}
                checked={checked}
                onChange={handleChange}
                item={item}
                checkedContacts={checkedContacts}
              />
            }
            title={
              <Tooltip placement={index === 0 ? 'bottom' : 'top'} overlayClassName={styles.tooltipOverlay} title={contactName}>
                <span data-test-id="im_search_contact_name">{renderTitle()}</span>
              </Tooltip>
            }
            description={
              <>
                <Tooltip placement={index === 0 ? 'bottom' : 'top'} overlayClassName={styles.tooltipOverlay} title={accountName}>
                  <span
                    data-test-id="im_search_contact_email"
                    className={classnames(styles.emailList, {
                      [styles.emailListTag]: contactInfo && contactInfo.filter(e => e.contactItemType === 'EMAIL').length > 1,
                    })}
                  >
                    {renderEmail()}
                  </span>
                </Tooltip>
                {renderEmailCountTag()}
                {Array.isArray(position) && !!search && (
                  <Tooltip overlayClassName={styles.tooltipOverlay} title={position.map(e => (Array.isArray(e) ? e.join('-') : e)).join('\n')}>
                    <div data-test-id="im_search_contact_department" className={styles.position}>
                      {position.map(p => {
                        const department = Array.isArray(p) ? p.join('-') : p;
                        return <p key={department}>{department}</p>;
                      })}
                    </div>
                  </Tooltip>
                )}
                <SendEmailIcon onClick={handleSend} className={styles.sendIcon} />
              </>
            }
          />
        </List.Item>
      </>
    );
  }
);
