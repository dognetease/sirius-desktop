import React, { useCallback, MouseEvent, useMemo, useRef, useState } from 'react';
import classnames from 'classnames';
import { apiHolder, apis, ContactItem, MailApi } from 'api';
import { Tooltip, Checkbox } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import styles from './item.module.scss';
import { fixContactLabel, splitSearchHit } from '../../util';
import { SendEmailIcon } from '@web-common/components/UI/Icons/icons';
import detailStyles from '../Detail/detail.module.scss';
import CaretDownOutlined from '@ant-design/icons/CaretDownOutlined';
import CaretRightOutlined from '@ant-design/icons/CaretRightOutlined';
import { ContactOrgItem } from '@web-common/components/util/contact';
import { ContactOrgAvatar } from '@web-common/components/UI/Avatar/contactOrgAvatar';
import { OrgItem } from '@web-common/utils/contact_util';
import PersonalMark from '@web-common/components/UI/SiriusContact/personalMark/mark';

import lodashGet from 'lodash/get';
import { getIn18Text } from 'api';

const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;

export const itemHeight = 70;
export const itemDepartmentHeight = 114 - itemHeight;
export const contactHeaderheight = 44;

interface ItemProps<T> extends RenderProps {
  item: T;
}

export interface RenderProps {
  onCheck?(): void;
  onExpand?(): void;
  onSelect?(): void;
  onMarked?(marked: boolean): void;
  onSort?(currentIndex: number, dragIndex: number): void;
  onDragStart?(e: React.DragEvent): void;
  onDragLeave?(e: React.DragEvent): void;
  onDragEnter?(e: React.DragEvent): void;
  onDragOver?(e: React.DragEvent): void;
  onDragEnd?(e: React.DragEvent): void;
  onDrop?(e: React.DragEvent): void;
  dragActive?: boolean;
  showTag?: boolean;
  index: number;
  searchValue?: string; // 是否是搜索列表的item 如果是则需要高亮某些字段
  checked?: boolean;
  selected?: boolean;
  disabled?: boolean;
  showCheckbox?: boolean;
  visibleExpandIcon?: boolean;
  visibleMarked?: boolean;
  visibleDrag?: boolean;
  expanded?: boolean;
  isOrgchildren?: boolean;
}

const ItemAvatar: React.FC<{
  item: ContactOrgItem;
  visibleCheckbox?: boolean;
  visibleExpandIcon?: boolean;
  checked?: boolean;
  expanded?: boolean;
  onCheck?: () => void;
  onExpand?: () => void;
}> = ({ item, checked, onCheck, onExpand, visibleCheckbox, expanded, visibleExpandIcon }) => {
  const expandIcon = expanded ? <CaretDownOutlined className={styles.expandIcon} /> : <CaretRightOutlined className={styles.expandIcon} />;
  return (
    <>
      {visibleExpandIcon && (
        <span
          className={styles.expandWrap}
          onClick={e => {
            e.stopPropagation();
            onExpand && onExpand();
          }}
        >
          {expandIcon}
        </span>
      )}
      {visibleCheckbox && (
        <Checkbox
          data-test-id="contact_list_item_checkbox"
          data-test-checked={checked}
          onClick={e => e.stopPropagation()}
          checked={checked}
          onChange={() => {
            onCheck && onCheck();
          }}
          className={classnames(styles.itemAvatarCheckbox, {
            [styles.allCheckboxShow]: visibleCheckbox,
          })}
        />
      )}

      <ContactOrgAvatar item={item} className={classnames(styles.itemAvatar, visibleCheckbox && styles.allCheckboxHidden)} />
    </>
  );
};

const MutiMailTag: React.FC<{}> = ({ children }) => <span className={styles.tag}>{children}</span>;

const renderTitle = (_text: string, search?: string, enableCut = false) => {
  let text = _text;
  if (_text.indexOf('@') !== -1 && enableCut) {
    text = lodashGet(_text.split('@'), '[0]', _text);
  }

  if (!search || !text) {
    return text;
  }
  const result = splitSearchHit(search, text);
  if (!result) {
    return text;
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
};

export const CItem: React.FC<ItemProps<ContactItem>> = props => {
  const {
    item,
    onCheck,
    onSelect,
    isOrgchildren,
    selected,
    visibleMarked,
    visibleDrag,
    showTag,
    searchValue,
    checked,
    showCheckbox,
    index,
    dragActive,
    onMarked,
    onDragStart,
    onDragEnd,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
  } = props;
  const { id, name: contactName, position = [], labelPoint, emailCount = 0, email } = item;
  const handleSend = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      mailApi.doWriteMailToContact([email]);
    },
    [email]
  );

  const renderEmailCountTag = useMemo(() => {
    const more = emailCount - 1;
    if (more < 1) {
      return null;
    }
    return <MutiMailTag>{`+${more > 99 ? 99 : more}`}</MutiMailTag>;
  }, [emailCount]);

  const showPosition = useMemo(() => position?.length > 0 && !!searchValue, [position, searchValue]);

  const isSearchMode = useMemo(() => !!searchValue, [searchValue]);

  return (
    <div className={styles.itemWrap}>
      <div className={styles.itemDragWrap} onDragOver={onDragOver} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDrop={onDrop}>
        {showTag && labelPoint && (
          <div className={styles.itemHeader} style={{ height: contactHeaderheight }}>
            {fixContactLabel(labelPoint)}
          </div>
        )}
        <div className={styles.dragLine} hidden={!dragActive}>
          <div className={styles.circle}></div>
          <div className={styles.line}></div>
        </div>
        <div
          data-test-id="contact_list_item"
          onClick={onSelect}
          className={classnames([styles.item], {
            [styles.selected]: selected,
            [styles.dragActive]: dragActive,
          })}
        >
          <div className={classnames(styles.itemAvatarWrap, isOrgchildren && styles.paddingLeft)}>
            <ItemAvatar visibleCheckbox={!isSearchMode && showCheckbox} checked={checked} onCheck={onCheck} item={item} />
          </div>
          <div className={styles.itemContent}>
            <div className={styles.titleWrap}>
              <Tooltip placement={index === 0 ? 'bottom' : 'top'} overlayClassName={detailStyles.tooltipOverlay} title={contactName}>
                <span className={styles.titleTxt} data-test-id="contact_list_item_name">
                  {renderTitle(contactName || email, searchValue, true)}
                </span>
              </Tooltip>
              {visibleMarked && (
                <PersonalMark
                  useId
                  testId="contact_list_item_mark"
                  onMarked={onMarked}
                  style={{ marginLeft: 6 }}
                  email={email}
                  contactId={id}
                  canOperate
                  visibleHover
                  cancelToast
                />
              )}
            </div>
            <div className={styles.descWrap}>
              <div className={styles.emailWrap}>
                <Tooltip placement={index === 0 ? 'bottom' : 'top'} overlayClassName={detailStyles.tooltipOverlay} title={email}>
                  <span className={styles.emailTxtWrap} data-test-id="contact_list_item_email">
                    {renderTitle(email, searchValue)}
                  </span>
                </Tooltip>
                {renderEmailCountTag}
              </div>
              {showPosition && (
                <Tooltip
                  overlayClassName={detailStyles.tooltipOverlay}
                  title={position?.map(p => {
                    const department = Array.isArray(p) ? p.join('/') : p;
                    return (
                      <p style={{ padding: 0, margin: 0, lineHeight: 1.2, textAlign: 'left' }} key={department}>
                        {department}
                      </p>
                    );
                  })}
                >
                  <div className={styles.position}>
                    {position?.map(p => {
                      const department = Array.isArray(p) ? p.join('/') : p;
                      return <p key={department}>{department}</p>;
                    })}
                  </div>
                </Tooltip>
              )}
            </div>
          </div>
          {!visibleDrag && <SendEmailIcon onClick={handleSend} className={styles.sendIcon} />}
          {visibleDrag && <div className={styles.dragBtn} draggable={true} onDragStart={onDragStart} onDragEnd={onDragEnd} />}
        </div>
      </div>
    </div>
  );
};

export const OItem: React.FC<ItemProps<OrgItem>> = props => {
  const {
    item,
    onCheck,
    onSelect,
    onExpand,
    selected,
    searchValue,
    checked,
    showCheckbox,
    index,
    visibleExpandIcon,
    visibleDrag,
    visibleMarked,
    expanded,
    dragActive,
    onMarked,
    onDragEnd,
    onDragStart,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
  } = props;
  const { id, orgName: title } = item;

  const isSearchMode = useMemo(() => !!searchValue, [searchValue]);

  return (
    <div className={styles.itemWrap}>
      <div className={styles.itemDragWrap} onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        <div className={styles.dragLine} hidden={!dragActive}>
          <div className={styles.circle}></div>
          <div className={styles.line}></div>
        </div>
        <div
          data-test-id="contact_list_item"
          onClick={onSelect}
          className={classnames([styles.item], {
            [styles.selected]: selected,
            [styles.dragActive]: dragActive,
          })}
        >
          <div className={classnames(styles.itemAvatarWrap)}>
            <ItemAvatar
              expanded={expanded}
              visibleExpandIcon={visibleExpandIcon}
              visibleCheckbox={!isSearchMode && showCheckbox}
              checked={checked}
              onCheck={onCheck}
              onExpand={onExpand}
              item={item}
            />
          </div>
          <div className={classnames(styles.itemContent, styles.isOrg)}>
            <div className={styles.titleWrap}>
              <Tooltip placement={index === 0 ? 'bottom' : 'top'} overlayClassName={detailStyles.tooltipOverlay} title={title}>
                <span className={styles.titleTxt} data-test-id="contact_list_item_name">
                  {renderTitle(title, searchValue)}
                </span>
              </Tooltip>
              {visibleMarked && (
                <PersonalMark testId="contact_list_item_mark" onMarked={onMarked} orgId={id} style={{ marginLeft: 6 }} canOperate visibleHover cancelToast />
              )}
            </div>
          </div>
          {visibleDrag && <div className={styles.dragBtn} draggable={true} onDragStart={onDragStart} onDragEnd={onDragEnd} />}
        </div>
      </div>
    </div>
  );
};

export const Item: React.FC<ItemProps<ContactOrgItem>> = props => {
  const { item, index, onSort, isOrgchildren } = props;
  const dragdingRef = useRef<any>();
  const [dragActive, setDragActive] = useState<boolean>(false);
  if (!item) {
    return null;
  }
  const handleDragStart = (e: React.DragEvent) => {
    // e.dataTransfer.dropEffect = 'move';
    console.log('handleDragStart', e.target);
    if (e.target) {
      e.dataTransfer.effectAllowed = 'move';
      const currentElement = (e.target as HTMLElement)?.closest(`.${styles.item}`) as HTMLElement;
      const parentWrap = document.querySelector('#contact-drag-item') as HTMLElement;
      console.log('handleDragStart parent', currentElement);
      if (currentElement && parentWrap) {
        const width = currentElement.offsetWidth;
        const height = currentElement.offsetHeight;
        const image = currentElement.cloneNode(true);
        parentWrap.style.width = width + 'px';
        parentWrap.style.height = height + 'px';
        // div.style.zIndex = '100';
        parentWrap.innerHTML = '';
        parentWrap.appendChild(image);
        console.log('handleDragStart parent wrap', parentWrap);
        e.dataTransfer.setDragImage(parentWrap, width, height);
        const dragIndex = index.toString();
        e.dataTransfer.setData('drag_index_' + dragIndex, dragIndex);
        e.dataTransfer.setData('index', dragIndex);
        e.dataTransfer.setData('text/plain', '');
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragdingRef.current = e.target;
    const findItem = e.dataTransfer.types.find(item => item.includes('drag_index_'));
    if (findItem) {
      const _index = findItem.split('drag_index_')[1];
      if (Number(_index) !== index && !isOrgchildren) {
        console.log('handleDragEnter', index, _index, item.id);
        setDragActive(true);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragdingRef.current === e.target) {
      // console.log('handleDragLeave', e.target, item.id);
      setDragActive(false);
      dragdingRef.current = undefined;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // console.log('handleDragOver', e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dragIndex = e.dataTransfer.getData('index');
    console.log('handleDrop', index, dragIndex, item.id);
    if (isOrgchildren) {
      message.error(getIn18Text('sortMessage'));
    }
    if (index !== Number(dragIndex) && !isOrgchildren) {
      onSort && onSort(index, Number(dragIndex));
      cleanData();
    }
  };

  const cleanData = () => {
    const parentWrap = document.querySelector('#contact-drag-item') as HTMLElement;
    if (parentWrap) {
      parentWrap.innerHTML = '';
    }
  };

  const handleDragEnd = () => {
    console.log('handleDragEnd');
    cleanData();
  };
  if ('orgType' in item) {
    return (
      <OItem
        {...props}
        item={item}
        dragActive={dragActive}
        onDrop={handleDrop}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragLeave={handleDragLeave}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
      />
    );
  }
  return (
    <CItem
      {...props}
      item={item}
      dragActive={dragActive}
      onDrop={handleDrop}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragLeave={handleDragLeave}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
    />
  );
};
