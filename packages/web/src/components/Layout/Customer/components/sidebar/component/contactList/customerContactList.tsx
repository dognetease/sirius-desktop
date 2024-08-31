import React, { useEffect, useRef } from 'react';
import { ContactDetail } from 'api';
import ContactCardDetail, { getContentByKey } from './contactCardDetail';
import style from './contactCardDetail.module.scss';
import { EmptyTips } from '../emptyTips';
import { getIn18Text } from 'api';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import InfiniteLoader from 'react-window-infinite-loader';
interface ContactListProps {
  list: ContactDetail[]; // 展示联系人数据
  totalSize: number; // 联系人总人数
  onEdit?: (id: string, email?: string) => void; // 编辑联系人
  readonly?: boolean; // 是否只读，不编辑
  loadMore: () => void; // 分页加载更多
}

export const ContactList = (props: ContactListProps) => {
  const { list, onEdit, readonly, loadMore, totalSize } = props;

  const isItemLoaded = (index: number) => index < list.length;

  // 计算卡片高度
  const getSize = (index: number) => {
    if (index >= list.length) {
      return 0;
    } else {
      let height = 0;
      // 渲染的行数
      let lineNum = 0;
      let marginTopNum = 0;
      const keyArray = ['email', 'telephones', 'whats_app', 'job', 'department', 'area', 'address', 'remark', 'social_platform', 'ext_infos'] as unknown as Array<
        keyof ContactDetail
      >;
      keyArray.forEach(key => {
        const contentArr = getContentByKey(key, list[index]);
        lineNum += contentArr.length;
        if (contentArr && contentArr.length) {
          marginTopNum += 1;
        }
      });
      height = lineNum * 22 + marginTopNum * 8;
      // 判断是否展示主联系人，性别或者生日
      const { main_contact, gender, birthday } = list[index];
      if (main_contact || gender === '1' || gender === '2' || (!!birthday && moment.isMoment(moment(+birthday)))) {
        height += 56;
      } else {
        height += 28;
      }
      // 上下内边距，卡片下边距
      height += 48;
      return height;
    }
  };
  const RowData = ({ data, index, style }: { data: ContactDetail[]; index: number; style: React.CSSProperties }) => {
    const item = data[index];
    if (index === data.length) {
      return (
        <div style={style}>
          <div style={{ textAlign: 'center', paddingTop: 15 }}>{getIn18Text('JIAZAIZHONG...')}</div>
        </div>
      );
    } else if (index > data.length) {
      return null;
    }
    return <div style={style}>{renderItem(item)}</div>;
  };
  // 渲染每个联系人
  const renderItem = (item: ContactDetail) => {
    return <ContactCardDetail key={item.contact_id} data={item} onEdit={() => onEdit && onEdit(item.contact_id, item.email)} readonly={readonly} />;
  };

  // 加载更多
  const loadMoreFn = (start: number, end: number) => {
    if (start === list.length && end <= totalSize) {
      setTimeout(() => {
        loadMore();
      }, 100);
    }
  };

  const autoSizerRef = useRef(null);

  useEffect(() => {
    if (list && list.length) {
      autoSizerRef.current?.resetAfterIndex(0, true);
    }
  }, [list]);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {list.length === 0 ? <EmptyTips className={style.emptyTip} text={getIn18Text('ZANWULIANXIREN')} /> : null}
      <div className={style.contactList}>
        <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={totalSize} loadMoreItems={loadMoreFn}>
          {({ onItemsRendered, ref }) => (
            <AutoSizer>
              {({ height, width }) => (
                <List
                  className="sirius-scroll"
                  height={height}
                  width={width}
                  itemCount={list.length}
                  itemSize={getSize}
                  estimatedItemSize={86}
                  onItemsRendered={onItemsRendered}
                  itemData={list}
                  ref={autoSizerRef}
                >
                  {RowData}
                </List>
              )}
            </AutoSizer>
          )}
        </InfiniteLoader>
      </div>
    </div>
  );
};
