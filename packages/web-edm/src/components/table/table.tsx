import React, { CSSProperties, ReactNode, useRef, useState } from 'react';
import { Spin, Table, TableProps } from 'antd';
import { useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { getIn18Text } from 'api';

export interface Props {
  dataLength: number;
  next: () => any;
  hasMore: boolean;
  loader?: ReactNode;
  scrollThreshold?: number | string;
  endMessage?: ReactNode;
  style?: CSSProperties;
  height?: number | string;
  scrollableTarget?: ReactNode;
  onScroll?: (e: MouseEvent) => any;
  initialScrollY?: number;
}

export const InfiniteScrollTable = (props: TableProps<any> & { scrollProps: Props }) => {
  const ref = useRef<HTMLDivElement>(null);
  const tbodyRef = useRef<HTMLElement | null>(null);
  const [hasScroll, setHasScroll] = useState(false);
  const { scrollProps, ...tableProps } = props;
  useEffect(() => {
    const tbody = ref.current?.querySelector('.ant-table-body');
    if (!tbody) return;
    tbodyRef.current = tbody as HTMLElement;
    setHasScroll(true);
  });
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <Table {...tableProps} />
      <div style={{ position: 'absolute', bottom: '0px', textAlign: 'center', width: '100%', background: 'rgba(0,0,0,.06)' }}>
        {hasScroll && (
          <InfiniteScroll
            dataLength={scrollProps.dataLength}
            next={scrollProps.next}
            hasMore={scrollProps.hasMore}
            loader={scrollProps.loader || <Spin tip={getIn18Text('JIAZAIZHONG..')} indicator={<LoadingOutlined spin style={{ fontSize: 24 }} />} />}
            scrollableTarget={tbodyRef.current}
            hasChildren={true}
          ></InfiniteScroll>
        )}
      </div>
    </div>
  );
};
