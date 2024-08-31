import React, { useMemo, useState } from 'react';
import { Input, Skeleton, Empty, Spin } from 'antd';
import List from 'react-virtualized/dist/es/List';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import { getTransText } from '@/components/util/translate';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { useContainerHeight } from '@/components/Layout/Customer/CustomerDiscovery/hooks/useContainerHeight';
import classnames from 'classnames';
import { ReactComponent as SearchIcon } from '@/images/icons/edm/autoMarket/searchIcon.svg';
import { ReactComponent as CloseIcon } from '@/images/icons/edm/autoMarket/close.svg';
import style from './contactList.module.scss';

interface Props {
  className?: string;
  data: ContactItem[];
  onDelete?: (item: ContactItem) => void;
  loading?: boolean;
}

interface VirtualListProp {
  data: ContactItem[];
  height: number;
  onDelete?: (item: ContactItem) => void;
}

interface ContactRowProp {
  data: ContactItem;
  onDelete?: (item: ContactItem) => void;
}

export interface ContactItem {
  contactEmail: string;
  contactName: string;
}

const ContactRow: React.FC<ContactRowProp> = ({ data, onDelete }) => {
  return (
    <div className={style.concatRow}>
      <AvatarTag
        size={32}
        user={{
          name: data.contactName,
          email: data.contactEmail,
        }}
        className={style.receiverAvatar}
      />

      <div className={style.content}>
        <div className={style.contactName}>{data.contactName}</div>
        <div className={style.contactEmail}>{data.contactEmail}</div>
      </div>

      <div
        className={style.operate}
        onClick={() => {
          if (onDelete) {
            onDelete(data);
          }
        }}
      >
        <CloseIcon />
      </div>
    </div>
  );
};

const VirtualList: React.FC<VirtualListProp> = ({ data, height, onDelete }) => {
  const rowRender = ({ index, isScrolling, key, style }: any) => {
    if (isScrolling) {
      return (
        <div key={key} style={style}>
          <Skeleton></Skeleton>
        </div>
      );
    }

    return (
      <div style={style} key={key}>
        <ContactRow data={data[index]} onDelete={onDelete}></ContactRow>
      </div>
    );
  };

  return (
    <AutoSizer disableHeight>
      {({ width }) => <List className={style.receiverList} width={width} height={height} rowCount={data.length} rowHeight={73} rowRenderer={rowRender} />}
    </AutoSizer>
  );
};

export const ContactList: React.FC<Props> = props => {
  const { containerHeight, containerRef } = useContainerHeight(300);
  const [searchVal, setSearchVal] = useState('');

  function searchChange(value: string) {
    setSearchVal(value);
  }

  const listData = useMemo(() => {
    if (!props.data?.length) {
      return [];
    }

    if (!searchVal) {
      return props.data.slice();
    }

    return props.data.filter(item => {
      return String(item.contactEmail).includes(searchVal) || String(item.contactName).includes(searchVal);
    });
  }, [searchVal, props.data]);

  return (
    <div className={classnames(style.wrapper, props?.className || '')}>
      <div className={style.input}>
        <Input
          prefix={<SearchIcon />}
          placeholder={getTransText('QINGSHURUYOUXIANGDEZHIHUOLIANXIRENXINGMING')}
          onChange={({ target: { value } }) => searchChange(value)}
        />
      </div>
      <div className={style.list} ref={containerRef}>
        {props.loading ? (
          <div className={style.loading}>
            <Spin></Spin>
          </div>
        ) : (
          ''
        )}

        {!listData.length ? (
          <div className={style.empty}>
            <Empty></Empty>
          </div>
        ) : listData.length > 1000 ? (
          <VirtualList height={containerHeight} data={listData} onDelete={props.onDelete}></VirtualList>
        ) : (
          <div className={style.scrollCon} style={{ height: containerHeight }}>
            {listData.slice(0, 100).map(item => (
              <ContactRow data={item} onDelete={props.onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
