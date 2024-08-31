import React, { useCallback } from 'react';
import VirtualList from 'react-virtualized/dist/commonjs/List';
import { ContactModel } from 'api';
import { Item } from '@web-contact/component/ListItem/item';
import './index.scss';
import { openSession } from '../../common/navigate';

const ContactList: React.FC<{
  contactData: ContactModel[];
  closeModal: () => void;
  width: number;
  height: number;
  rowCount: number;
  marginTop?: string;
  searchKey?: string;
}> = ({ contactData, searchKey, width, height, marginTop, rowCount, closeModal }) => {
  const itemHeight = 64;
  const itemDepartmentHeight = 18;
  const getRowHeight = useCallback(
    ({ index }) => {
      const item = contactData[index];
      const positionCount = item.contact?.position?.length || 0;
      return item.contact.type === 'personal' ? itemHeight : itemDepartmentHeight * positionCount + itemHeight;
    },
    [contactData, searchKey]
  );

  // 发起会话
  const createSession = async item => {
    const account = item.contactInfo.find(item => item.contactItemType === 'yunxin')?.contactItemVal || '';

    // 发起会话
    openSession(
      {
        mode: 'normal',
        sessionId: `p2p-${account}`,
      },
      {
        createSession: true,
      }
    );

    closeModal();
  };

  return (
    <>
      <VirtualList
        className="sirius-scroll-hide"
        containerStyle={{
          marginTop,
        }}
        height={height}
        rowCount={rowCount}
        rowHeight={getRowHeight}
        width={width}
        rowRenderer={({ index, key, style }) => {
          const item = contactData[index];
          return (
            <div className="search-item" key={key} style={style}>
              <Item im item={item} search={searchKey} onSelect={createSession} />
            </div>
          );
        }}
      />
    </>
  );
};

export default ContactList;
