import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableProps, Tag, Button } from 'antd';
import { FFMSOverView } from 'api';
import { DetailModal } from './detailModal';
import style from './style.module.scss';

interface Props extends TableProps<FFMSOverView.ListRow> {
  isFavList?: boolean; // 是否是收藏列表
}

const TagMap = {
  [FFMSOverView.FreightTag.FASTEST]: '最快',
  [FFMSOverView.FreightTag.AVAILABLE_BOOKING]: '现舱',
  [FFMSOverView.FreightTag.CHEAPEST]: '低价',
  [FFMSOverView.FreightTag.EARLIEST]: '最早',
};

export const FreightTable: React.FC<Props> = props => {
  const { dataSource = [], isFavList = false, ...restProps } = props;

  const [tableData, setTableData] = useState(dataSource);
  const [fixedRows, setFixedRows] = useState<FFMSOverView.ListRow[]>([]);
  const [detailModal, setDetailModal] = useState<{ open: boolean; row?: FFMSOverView.ListRow }>({ open: false });

  useEffect(() => {
    setTableData(dataSource);
  }, [dataSource]);

  const fixedRow = async (row: FFMSOverView.ListRow, isFixed: boolean, e?: React.MouseEvent) => {
    if (!isFixed) {
      // 取消置顶
      const index = fixedRows.findIndex(item => item.freightId === row.freightId);
      if (index > -1) {
        fixedRows.splice(index, 1);
        setFixedRows(fixedRows.slice());
      }
    } else {
      // 设置为置顶
      // const btnElement = e?.nativeEvent?.target as HTMLElement;
      // const trElement = btnElement?.parentNode?.parentNode?.parentNode as HTMLElement;
      fixedRows.push({
        ...row,
        isFixed: true,
        // rowHeight: trElement?.offsetHeight
      });
    }

    // 重置fixedIndex
    fixedRows.forEach((row, index) => (row.fixedIndex = index));
    setFixedRows(fixedRows.slice());
  };

  const getRowClass = (row: FFMSOverView.ListRow) => {
    const classList = [];
    if (row.isFixed) {
      classList.push(style.sticky);
      classList.push(style[`sticky_${row.fixedIndex}`]);
    }

    if (row.owner) {
      classList.push(style.owner);
    }

    return classList.join(' ');
  };

  const tableDataComputed = useMemo(() => {
    const newData = tableData.filter(row => !fixedRows.find(item => item.freightId === row.freightId));
    return [...fixedRows, ...newData];
  }, [tableData, fixedRows]);

  const columns = [
    {
      title: '时间',
      width: 280,
      render(_: string, row: FFMSOverView.ListRow) {
        const sailingDate = String(row.sailingDate).split('/').slice(1).join('/');
        const arriveDate = String(row.arriveDate).split('/').slice(1).join('/');
        return (
          <div className={style.cellContent}>
            {/* {row.owner && <div className={style.owner}>我创建的</div>} */}
            <div className={style.date}>
              <div className={style.dateNum}>{sailingDate}</div>
              <div className={style.dateDur}>
                <div>{row.voyage}天</div>
              </div>
              <div className={style.dateNum}>{arriveDate}</div>
            </div>
            <div className={style.limitDate}>截止时间：{row.expiryDate}</div>
            <div className={style.tags}>
              {row.tagList.map(tag => (
                <Tag className={`${style[tag]}`}>{TagMap[tag]}</Tag>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      title: '船司',
      dataIndex: 'carrier',
      render(carrier: string, row: FFMSOverView.ListRow) {
        return (
          <div className={style.cellContent}>
            <p title={carrier}>
              {row?.freightCarrier?.carrier} {row?.freightCarrier?.cnName}
            </p>
          </div>
        );
      },
    },
    {
      title: '船只',
      dataIndex: 'vessel',
      render(vessel: string) {
        return (
          <div className={style.cellContent}>
            <p title={vessel}>{vessel}</p>
          </div>
        );
      },
    },
    {
      title: '航线',
      dataIndex: 'route',
      render(route: string) {
        return (
          <div className={style.cellContent}>
            <p title={route}>{route}</p>
          </div>
        );
      },
    },
    {
      title: '20GP',
      dataIndex: 'price20GP',
      render(price20GP: string) {
        return (
          <div className={`${style.money}  ${style.cellContent}`}>
            <p>{price20GP}</p>
          </div>
        );
      },
    },
    {
      title: '40GP',
      dataIndex: 'price40GP',
      render(price40GP: string) {
        return (
          <div className={`${style.money}  ${style.cellContent}`}>
            <p>{price40GP}</p>
          </div>
        );
      },
    },
    {
      title: '40HQ',
      dataIndex: 'price40HC',
      render(price40HC: string) {
        return (
          <div className={`${style.money}  ${style.cellContent}`}>
            <p>{price40HC}</p>
          </div>
        );
      },
    },
    {
      title: '操作',
      width: 130,
      render(_: string, row: FFMSOverView.ListRow) {
        return (
          <>
            {fixedRows?.length < 3 && !row.isFixed && !isFavList && (
              <div>
                <Button type="link" onClick={e => fixedRow(row, true, e)}>
                  {/* <PushpinOutlined /> */}
                  <span>置顶</span>
                </Button>
              </div>
            )}
            {row.isFixed && !isFavList && (
              <div>
                <Button type="link" onClick={() => fixedRow(row, false)}>
                  {/* <ArrowUpOutlined style={{ marginRight: 4 }} /> */}
                  <span>取消置顶</span>
                </Button>
              </div>
            )}
            <div>
              <Button
                type="link"
                onClick={() => {
                  setDetailModal({ open: true, row });
                }}
              >
                详情
              </Button>
            </div>
          </>
        );
      },
    },
  ];

  return (
    <>
      <Table rowKey="id" sticky rowClassName={getRowClass} columns={columns} dataSource={tableDataComputed} {...restProps}></Table>

      <DetailModal open={detailModal.open} row={detailModal.row} onCancel={() => setDetailModal({ open: false })} onSuccess={() => setDetailModal({ open: false })} />
    </>
  );
};
