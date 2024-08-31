import React, { useEffect, useRef } from 'react';
import { useVirtualList } from 'ahooks';
import { GroupNunberListItem } from 'api';
import { Item } from './item';
import { CustomerItem } from './customerItem';

interface Props<T> {
  originalList: T[];
  onDelete: (id: string, name: string) => void;
  way?: 'customer';
}
// 渲染指定item 类型带优化
const VirtualList: <T>(props: Props<T>) => any = ({ originalList, onDelete, way }) => {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);

  const [list, scroll] = useVirtualList(originalList, {
    containerTarget: containerRef,
    wrapperTarget: wrapperRef,
    itemHeight: (index, data) => data.height || 44,
    // itemHeight: 44,
    overscan: 10,
  });

  useEffect(() => {
    scroll(0);
  }, [originalList]);

  return (
    <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '0 16px' }}>
      <div ref={wrapperRef}>
        {list.map(ele => {
          if (way === 'customer') {
            const data = ele.data;
            return (
              <CustomerItem
                style={{
                  marginBottom: data.height ? data.height - 22 : 0,
                }}
                key={ele.index}
                index={ele.index}
                number={data.number}
                onDelete={onDelete}
                name={data.name}
                isTitle={data.isTitle}
                companyName={data.companyName}
              />
            );
          }
          return <Item key={ele.index} index={ele.index} number={ele.data.number} sentCount={ele.data.sentCount} onDelete={onDelete} />;
        })}
      </div>
    </div>
  );
};

type CompoundedComponent = typeof VirtualList & {
  Item: typeof Item;
};

export default VirtualList as CompoundedComponent;
