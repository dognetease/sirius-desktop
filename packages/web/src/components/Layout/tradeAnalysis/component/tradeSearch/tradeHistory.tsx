import React, { useRef, useState, useCallback, useEffect } from 'react';
import style from './tradeSearch.module.scss';
import { useMeasure } from 'react-use';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import VirtualTable from '../../../../../../../web-common/src/components/UI/VirtualTable/VirtualTable';
export interface HistoryItem {
  type: number;
  value: string;
  watchTime: string;
  country?: string;
  recordType?: 'import' | 'export';
}
export interface Prop {
  list: Array<HistoryItem>;
  onSearch: (value: HistoryItem) => void;
}
const LIMITED_TAG_WIDTH = 46;
const TAG_LIST_COL_GAP = 12;

const HistoryTag: React.FC<{
  onComputeWidth?(width: number): void;
}> = ({ onComputeWidth, children }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current?.offsetWidth) {
      onComputeWidth?.(ref.current.offsetWidth);
    }
  }, [ref.current?.offsetWidth]);
  return (
    <span
      className={style.tag}
      ref={ref}
      style={{
        opacity: 0,
        pointerEvents: 'none',
      }}
    >
      <span>{children}</span>
    </span>
  );
};

const TradeHistory: React.FC<Prop> = ({ list, onSearch }) => {
  const [showList, setShowList] = useState<HistoryItem[]>([]);
  const [tagWidthMap, setTagWidthMap] = useState<Map<number, number>>(new Map());
  const [computeFinish, setComputeFinish] = useState<boolean>(false);
  const [ref, { width: containerWidth }] = useMeasure<HTMLDivElement>();
  const [visible, setVisible] = useState<boolean>(false);
  const handleCompute = (index: number, width: number) => {
    setTagWidthMap(prev => {
      return new Map(prev.set(index, width));
    });
  };

  const tableColumns = [
    {
      title: '报告关键词',
      dataIndex: 'value',
      render: (value: any, record: any) => {
        return value + '-' + (record.country ?? '未公开');
      },
    },
    {
      title: '报告类型',
      dataIndex: 'type',
      render: (value: any) => {
        return value === 1 ? '按产品搜索' : value === 2 ? '按hscode查询' : '按公司查询';
      },
    },
    {
      title: '查询时间',
      dataIndex: 'watchTime',
    },
  ];

  useEffect(() => {
    setComputeFinish(false);
    setTagWidthMap(new Map());
  }, [list]);

  useEffect(() => {
    if (tagWidthMap.size === list.length) {
      // todo for rest elment
      const limitedWidth = containerWidth - LIMITED_TAG_WIDTH;
      const arr: number[] = [];
      tagWidthMap.forEach((value, index) => {
        arr[index] = value;
      });
      let totalLen = 0;
      const nextShowList = [];
      for (let jndex = 0; jndex < arr.length; jndex++) {
        const elementWidth = arr[jndex];
        totalLen += elementWidth;
        totalLen += TAG_LIST_COL_GAP;
        if (totalLen > limitedWidth) {
          break;
        } else {
          nextShowList.push(list[jndex]);
        }
      }
      setShowList(nextShowList);
      setComputeFinish(true);
    }
  }, [tagWidthMap, list, containerWidth]);
  return (
    <div className={style.history}>
      <div className={style.historyText}>查询历史</div>
      <div className={style.historyContent} style={{ columnGap: TAG_LIST_COL_GAP }} ref={ref}>
        {!computeFinish &&
          list.map((e, index) => (
            <HistoryTag
              onComputeWidth={width => {
                handleCompute(index, width);
              }}
              key={e.value + e.watchTime + Math.random()}
            >
              {e.value + '-' + e.country}
            </HistoryTag>
          ))}
        {showList.map(e => (
          <span
            className={style.tag}
            key={e.value + e.watchTime + Math.random()}
            onClick={() => {
              onSearch(e);
            }}
          >
            {e.value + '-' + e.country}
          </span>
        ))}
        {computeFinish && showList.length !== list.length && (
          <span className={style.tag} onClick={() => setVisible(true)}>
            全部
          </span>
        )}
      </div>
      <Modal
        title="查询历史"
        className="history"
        visible={visible}
        onCancel={() => {
          setVisible(false);
        }}
        footer={null}
        headerBottomLine={false}
        footerTopLine={false}
        isGlobal
        width={640}
      >
        <VirtualTable
          onRow={(row: HistoryItem) => {
            return {
              onClick: () => {
                onSearch(row);
              },
            };
          }}
          className={style.historyTable}
          rowHeight={46}
          columns={tableColumns}
          autoSwitchRenderMode
          enableVirtualRenderCount={50}
          dataSource={list}
          scroll={{ y: 368 }}
          pagination={false}
        />
      </Modal>
    </div>
  );
};

export default TradeHistory;
