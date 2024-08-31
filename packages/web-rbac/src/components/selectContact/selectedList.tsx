import React, { useRef } from 'react';
import { FixedSizeList as VirtualList } from 'react-window';
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import { Button, List, Tooltip } from 'antd';
import '@web-common/components/UI/SiriusContact/selectedList/index.scss';
import { transContactModel2ContactItem } from '@web-common/components/util/contact';
import { ContactModel, EntityOrg } from 'api';
import ListItem from './listItem';
import styles from './index.module.scss';
import { ReactComponent as OrgIcon } from '@/images/icons/org_icon.svg';

interface ContactSelectListProp {
  // 每个list-item 所占的位置大小
  itemSize?: number;
  selectList?: Array<ContactModel | EntityOrg>;
  showAvatar?: boolean;
  showCheckbox?: boolean;
  showDelete?: boolean;
  showTitle?: boolean;
  showFooter?: boolean;
  canSure?: boolean;
  needScrollBottom?: boolean;

  onDelete?(data: ContactModel | EntityOrg): void;

  onCancel?(data: Array<ContactModel | EntityOrg>): void;

  onSure?(data: Array<ContactModel | EntityOrg>): void;
}

export const ContactList: React.FC<ContactSelectListProp> = props => {
  const {
    itemSize = 50,
    showAvatar = true,
    showCheckbox = false,
    showDelete = true,
    showFooter = true,
    showTitle = true,
    selectList = [],
    onDelete,
    onCancel,
    onSure,
    needScrollBottom = true,
    canSure = true,
  } = props;
  const listRef = useRef<VirtualList>(null);
  const handleListDelete = (data: ContactModel) => {
    onDelete && onDelete(data);
  };
  const handleListCancel = () => {
    onCancel && onCancel(selectList);
  };
  const handleListSure = () => {
    onSure && onSure(selectList);
  };
  needScrollBottom &&
    setTimeout(() => {
      listRef.current?.scrollToItem(selectList.length);
    }, 500);
  const renderList = () => (
    <AutoSizer>
      {({ width, height }) => (
        <VirtualList ref={listRef} itemSize={itemSize} itemCount={selectList.length} height={height} width={width} className="v-scroll-list">
          {({ index, style }) => {
            const item = selectList[index];
            if ('contact' in item) {
              const contactItem = transContactModel2ContactItem(item);
              return (
                <div className="contact-list-item" key={contactItem.email} style={{ ...style }}>
                  <ListItem
                    type="normal"
                    showAvatar={showAvatar}
                    showCheckbox={showCheckbox}
                    showDelete={showDelete}
                    contactItem={contactItem}
                    onDelete={() => handleListDelete(item)}
                    className={styles.listItem}
                  />
                </div>
              );
            } else {
              //
              return (
                <div className="contact-list-item" key={item.id} style={style}>
                  <List.Item className={styles.orgItem}>
                    <List.Item.Meta
                      className={'p-right'}
                      title={
                        <Tooltip title={item.orgName} mouseEnterDelay={1}>
                          <span>{item.orgName}</span>
                        </Tooltip>
                      }
                      avatar={<OrgIcon />}
                    />
                    <div
                      className={styles.itemDelete}
                      onClick={() => {
                        onDelete && onDelete(item);
                      }}
                    />
                  </List.Item>
                </div>
              );
            }
          }}
        </VirtualList>
      )}
    </AutoSizer>
  );
  return (
    <div className="sirius-contact-selected-list-container">
      {showTitle && (
        <div className="list-title">
          已选（
          {selectList.length}）
        </div>
      )}
      <div className="list-wrap">{renderList()}</div>
      {showFooter && (
        <div className="list-footer">
          <Button
            type="default"
            className="list-footer-btn"
            onClick={() => {
              handleListCancel();
            }}
          >
            取消
          </Button>
          <Button
            disabled={!canSure}
            type="primary"
            className="list-footer-btn"
            onClick={() => {
              handleListSure();
            }}
          >
            确定
          </Button>
        </div>
      )}
    </div>
  );
};
