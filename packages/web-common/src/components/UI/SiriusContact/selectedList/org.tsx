import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { FixedSizeList as VirtualList } from 'react-window';
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import { Button } from 'antd';
import ListItem from '../listItem/org';
import { SelectedOrgMap } from '@web-common/components/util/contact';
import styles from './index.module.scss';
import { useOrgItemEffect } from '@web-common/components/UI/SiriusContact/useContactItemEffect';
import { OrgItem } from '@web-common/utils/contact_util';
import { getIn18Text } from 'api';

interface ContactSelectListProp {
  // 是否展示部门
  useContactId?: boolean;
  selectList?: OrgItem[];
  showAvatar?: boolean;
  showCheckbox?: boolean;
  showDelete?: boolean;
  showFooter?: boolean;
  canSure?: boolean;
  needScrollBottom?: boolean;
  onDelete?(item: OrgItem[], contact: OrgItem[]): void;
  onCancel?(data: OrgItem[]): void;
  onSure?(data: OrgItem[]): void;
}
const ContactList: React.FC<ContactSelectListProp> = props => {
  const {
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
  } = props;
  const [selectMap, setSelectMap] = useState<SelectedOrgMap>(new Map());
  const listRef = useRef<VirtualList>(null);
  const selectList = useMemo(() => [...selectMap.values()], [selectMap]);
  const handleListDelete = useCallback(
    (data: OrgItem) => {
      selectMap.delete(data.id);
      setSelectMap(selectMap);
      onDelete && onDelete([...selectMap.values()], [data]);
    },
    [selectMap]
  );

  const handleListCancel = useCallback(() => {
    onCancel && onCancel(selectList);
  }, [selectList]);

  const handleListSure = useCallback(() => {
    onSure && onSure(selectList);
  }, [selectList]);

  useOrgItemEffect(defaultSelectList, () => {
    const itemMap = new Map();
    defaultSelectList.forEach(item => {
      const key = item.id;
      itemMap.set(key, item);
    });
    setSelectMap(itemMap);
  });

  useEffect(() => {
    needScrollBottom &&
      setTimeout(() => {
        listRef.current?.scrollToItem(selectMap.size);
      }, 500);
  }, [needScrollBottom, listRef]);
  const renderList = (
    <AutoSizer>
      {({ width, height }) => (
        <VirtualList ref={listRef} itemSize={52} itemCount={selectMap.size} height={height} width={width} className={styles.vScrollList}>
          {({ index, style }) => {
            const item = selectList[index];
            return (
              <div className={styles.listItem} key={item.id} style={{ ...style }}>
                <ListItem type="normal" showAvatar={showAvatar} showCheckbox={showCheckbox} showDelete={showDelete} item={item} onDelete={handleListDelete} />
              </div>
            );
          }}
        </VirtualList>
      )}
    </AutoSizer>
  );
  const chooseTitle = useMemo(() => `${getIn18Text('YIXUAN')}（${selectMap.size}）`, [selectMap]);
  return (
    <div className={styles.selectedListContainer}>
      <div className={styles.listTitle}>{chooseTitle}</div>
      <div className={styles.listWrap}>{renderList}</div>
      {showFooter && (
        <div className={styles.listFooter}>
          <Button
            type="default"
            className={styles.listFooterBtn}
            onClick={() => {
              handleListCancel();
            }}
          >
            {getIn18Text('QUXIAO')}
          </Button>
          <Button
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
