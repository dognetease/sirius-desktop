import React, { useRef, useEffect, useState } from 'react';
import { VariableSizeList as VirtualList } from 'react-window';
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import { Button } from 'antd';
import ListItem from '../listItem';
import { ContactOrgItem, getContactItemKey, isOrg, SelectedContactOrgMap } from '@web-common/components/util/contact';
import styles from './index.module.scss';
import useContactItemEffect from '@web-common/components/UI/SiriusContact/useContactItemEffect';
import { ContactItem } from '@web-common/utils/contact_util';
import { getIn18Text } from 'api';

interface ContactSelectListProp {
  // 使用联系人id作为最小key
  useContactId?: boolean;
  // 组织是否可以当作一个最小单位选中
  useOrgUnit?: boolean;
  // 是否展示部门
  showPosition?: boolean;
  // 默认选中的联系人列表
  selectList?: ContactOrgItem[];
  // 是否展示头像
  showAvatar?: boolean;
  // 是否展示选中框
  showCheckbox?: boolean;
  // 是否展示删除按钮
  showDelete?: boolean;
  // 是否展示底部2个按钮
  showFooter?: boolean;
  // 是否可以点击确认
  canSure?: boolean;
  // 是否需要滚动到底部
  needScrollBottom?: boolean;
  // 点击删除的回调
  onDelete?(item: ContactOrgItem[], contact: ContactOrgItem[]): void;
  // 点击取消的回调
  onCancel?(data: ContactOrgItem[]): void;
  // 点击确定的回调
  onSure?(data: ContactOrgItem[]): void;
  // 不可以删除的联系人邮箱地址？？
  firstPositionNotDelEmail?: string;
}
const ContactList: React.FC<ContactSelectListProp> = props => {
  const {
    useContactId,
    showPosition,
    showAvatar = true,
    showCheckbox = false,
    showDelete = true,
    showFooter = true,
    selectList: defaultSelectList = [],
    onDelete,
    onCancel,
    onSure,
    needScrollBottom = true,
    canSure = true,
    firstPositionNotDelEmail,
  } = props;
  const [selectMap, setSelectMap] = useState<SelectedContactOrgMap>(new Map());
  const listRef = useRef<VirtualList>(null);
  const getSelectList = () => {
    return [...selectMap.values()];
  };
  const handleListDelete = (data: ContactItem) => {
    selectMap.delete(getContactItemKey(data, useContactId));
    setSelectMap(selectMap);
    onDelete && onDelete(getSelectList(), [data]);
  };
  const handleListCancel = () => {
    onCancel && onCancel(getSelectList());
  };
  const handleListSure = () => {
    onSure && onSure(getSelectList());
  };
  useContactItemEffect(
    defaultSelectList,
    () => {
      const itemMap = new Map();
      defaultSelectList.forEach(item => {
        const key = isOrg(item) ? item.id : getContactItemKey(item as ContactItem, useContactId);
        itemMap.set(key, item);
      });
      listRef.current?.resetAfterIndex(0);
      setSelectMap(itemMap);
    },
    useContactId
  );
  useEffect(() => {
    needScrollBottom &&
      setTimeout(() => {
        listRef.current?.scrollToItem(selectMap.size);
      }, 500);
  }, [needScrollBottom, listRef]);
  const selectList = getSelectList();

  const renderList = () => {
    if (selectList.length) {
      return (
        <AutoSizer>
          {({ width, height }) => (
            <VirtualList
              ref={listRef}
              itemSize={index => {
                const _item = selectList[index];
                if (isOrg(_item)) {
                  return 52;
                } else {
                  const item = _item as ContactItem;
                  return showPosition && item?.position?.length ? 72 : 52;
                }
              }}
              itemCount={selectMap.size}
              height={height}
              width={width}
              className={styles.vScrollList}
            >
              {({ index, style }) => {
                const item = selectList[index];
                const isOrgItem = isOrg(item);
                const key = isOrgItem ? item.id : getContactItemKey(item as ContactItem, useContactId);
                const _showDelete = showDelete && (isOrgItem || firstPositionNotDelEmail !== (item as ContactItem).email);
                return (
                  <div className={styles.listItem} key={key} style={{ ...style }}>
                    <ListItem
                      testId="contact_selectedList_item"
                      type="normal"
                      showPosition={showPosition && !isOrgItem}
                      showAvatar={showAvatar}
                      showCheckbox={showCheckbox}
                      showDelete={_showDelete}
                      item={item}
                      isLeaf={!isOrgItem}
                      onDelete={handleListDelete}
                    />
                  </div>
                );
              }}
            </VirtualList>
          )}
        </AutoSizer>
      );
    } else {
      return null;
    }
  };
  return (
    <div className={styles.selectedListContainer} data-test-id="contact_selectedList">
      <div className={styles.listTitle}>
        {getIn18Text('YIXUAN')}（<span data-test-id="contact_selectedList_count">{selectMap.size}</span> ）
      </div>
      <div className={styles.listWrap}>{renderList()}</div>
      {showFooter && (
        <div className={styles.listFooter}>
          <Button
            data-test-id="contact_selectedList_btn_cancel"
            type="default"
            className={styles.listFooterBtn}
            onClick={() => {
              handleListCancel();
            }}
          >
            {getIn18Text('QUXIAO')}
          </Button>
          <Button
            data-test-id="contact_selectedList_btn_save"
            disabled={!canSure}
            type="primary"
            className={styles.listFooterBtn}
            onClick={() => {
              handleListSure();
            }}
          >
            {getIn18Text('QUEDING')}
          </Button>
        </div>
      )}
    </div>
  );
};
export default ContactList;
