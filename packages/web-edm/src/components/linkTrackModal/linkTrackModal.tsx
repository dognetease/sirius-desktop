import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Tooltip } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './modal.module.scss';
import { ColumnType } from 'antd/lib/table';
import { apiHolder, apis, EdmSendBoxApi, RequestTraceLinkList, ResponseTraceLinkItem } from 'api';
import { getIn18Text } from 'api';
export interface ILinkTrackModalProps {
  edmEmailId: string;
  visible: boolean;
  onCancel: () => void;
}
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
export const LinkTrackModal = (props: ILinkTrackModalProps) => {
  const [data, setData] = useState<Array<ResponseTraceLinkItem>>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const scrollHeight = 406;
  const pageSize = 10;
  const fetchData = useCallback(
    (isLoadMore?: boolean) => {
      if (isLoadMore && !hasMore) return;
      const params: RequestTraceLinkList = {
        edmEmailId: props.edmEmailId,
        pageSize: 100,
      };
      if (isLoadMore) {
        params.id = data[data.length - 1]?.id || '';
      }
      setLoading(true);
      edmApi
        .getTraceLinkList(params)
        .then(res => {
          // res = res.concat(res, res, res, res);
          if (isLoadMore) {
            setData(data.concat(res));
          } else {
            setData(res);
          }
          setHasMore(res.length >= pageSize);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [hasMore, setHasMore, data, setData, setLoading]
  );
  useEffect(() => {
    if (props.visible) {
      fetchData();
    } else {
      setLoading(false);
      setData([]);
      setHasMore(true);
    }
  }, [props.visible]);
  useEffect(() => {
    const scroller = tableRef.current?.querySelector('.ant-table-body');
    const onScroll = () => {
      if (!scroller) return;
      const y = scroller.scrollTop;
      const h = scroller.scrollHeight;
      if (h - y - scrollHeight < 96) {
        fetchData(true);
      }
    };
    scroller?.addEventListener('scroll', onScroll);
    return () => {
      scroller?.removeEventListener('scroll', onScroll);
    };
  }, [fetchData]);
  const { visible, onCancel } = props;
  const columns: ColumnType<ResponseTraceLinkItem>[] = [
    {
      title: getIn18Text('SHOUJIANREN'),
      dataIndex: 'contactEmail',
      width: 150,
    },
    {
      title: getIn18Text('FANGWENLIANJIE'),
      dataIndex: 'traceUrl',
      ellipsis: {
        showTitle: false,
      },
      render(title: string) {
        return (
          <Tooltip overlay={title} placement="topLeft">
            {title}
          </Tooltip>
        );
      },
    },
    {
      title: getIn18Text('CAOZUOSHIJIAN'),
      dataIndex: 'operateTime',
      width: 134,
    },
    {
      title: getIn18Text('DANGDESHIQU'),
      dataIndex: 'timeZone',
      width: 120,
      ellipsis: true,
      render(s) {
        return !s ? '-' : s;
      },
    },
    {
      title: getIn18Text('DEQU'),
      dataIndex: 'city',
      width: 140,
      ellipsis: {
        showTitle: false,
      },
      render(_, item: ResponseTraceLinkItem) {
        const str = [item.country, item.province, item.city].filter(i => !!i).join('-');
        return <Tooltip title={str}>{str}</Tooltip>;
      },
    },
  ];
  return (
    <Modal title={getIn18Text('FANGWENTONGJI')} className={style.historyActionModal} visible={visible} footer={null} width={800} onCancel={onCancel}>
      <div ref={tableRef}>
        <Table loading={loading} columns={columns} dataSource={data} pagination={false} scroll={{ y: scrollHeight }} rowKey="id" />
      </div>
    </Modal>
  );
};
