import { Table, Checkbox } from 'antd';
import type { TableProps } from 'antd';
import classNames from 'classnames';
import ResizeObserver from 'rc-resize-observer';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import debounce from 'lodash/debounce';

import styles from './virtualTable.module.scss';

export const VirtualTable = <RecordType extends object>(props: TableProps<RecordType>) => {
  const { columns, scroll, rowSelection, dataSource } = props; // todo 直接像 table 一样使用
  const [tableWidth, setTableWidth] = useState(0);
  const [mergedColumns, setMergedColumns] = useState<Array<any>>([]);
  const [show, setShow] = useState(false);
  const tableRef: any = useRef<any>(null);

  useEffect(() => {
    const widthColumnCount = columns!.filter(({ width }) => width == null || width === 'auto').length;
    const mergedColumns = columns!.map(column => {
      // return column;
      if (column.width && column.width != 'auto') {
        return column;
      }

      return {
        ...column,
        width: Math.floor(tableWidth / widthColumnCount),
      };
    });
    setMergedColumns([...mergedColumns]);
  }, [columns]);

  const gridRef = useRef<any>();
  const [connectObject] = useState<any>(() => {
    const obj = {};
    Object.defineProperty(obj, 'scrollLeft', {
      get: () => {
        if (gridRef.current) {
          return gridRef.current?.state?.scrollLeft;
        }
        return null;
      },
      set: (scrollLeft: number) => {
        if (gridRef.current) {
          gridRef.current.scrollTo({ scrollLeft });
        }
      },
    });

    return obj;
  });

  // 设置头部样式
  const setHeader = () => {
    const node = document.querySelector('.edm-virtual-table');
    console.log(node);
    if (node != null) {
      const th = node.querySelectorAll('th');
      if (th != null) {
        Array.from(th).forEach((item, index) => {
          if (mergedColumns[index]) {
            item.style.width = mergedColumns[index].width;
          }
        });
      }
    }
  };

  const resetVirtualGrid = () => {
    gridRef.current?.resetAfterIndices({
      columnIndex: 0,
      shouldForceUpdate: true,
    });
    // setHeader();
  };

  useEffect(() => resetVirtualGrid, [tableWidth, columns, mergedColumns.length]);

  const renderRow = useCallback((rawData: Array<object>, rowIndex: number, mergedColumns: any, columnIndex: number) => {
    if (mergedColumns[columnIndex] == null) {
      return '';
    }
    if (mergedColumns[columnIndex].render) {
      return (mergedColumns as any)[columnIndex].render((rawData[rowIndex] as any)[(mergedColumns as any)[columnIndex].dataIndex], rawData[rowIndex] as any);
    }

    return (rawData[rowIndex] as any)[(mergedColumns as any)[columnIndex].dataIndex];
  }, []);

  const renderVirtualList = (rawData: object[], data: any) => {
    const { scrollbarSize, ref, onScroll } = data;
    ref.current = connectObject;
    const totalHeight = rawData.length * 54;

    const getColumnWidth = (index: number) => {
      if (mergedColumns == null || mergedColumns[index] == null) {
        return 0;
      }
      const { width } = mergedColumns[index];
      return totalHeight > scroll!.y! && index === mergedColumns.length - 1 ? (width as number) - scrollbarSize - 1 : (width as number);
    };

    const getLeft = (left: string | number) => {
      if (typeof left === 'number') {
        return left;
      }
      const number = left.replace('%', '');
      if (number.length > 2) {
        let right = left.replace('%', '').slice(-2) + '%';
        // if ((columns![0] as any).dataIndex === 'selection') {
        //   return `calc(40px + ${right})`;
        // }
        return right;
      }
      return left;
    };

    // const scrollDebounce = useCallback(debounce((scrollLeft) => {
    //   onScroll({ scrollLeft });
    // }, 200), [onScroll]);

    return (
      <Grid
        ref={gridRef}
        className={(columns![0] as any).dataIndex === 'selection' ? styles.virtualGrid : ''}
        columnCount={mergedColumns.length}
        columnWidth={getColumnWidth}
        height={scroll!.y as number}
        rowCount={rawData.length}
        rowHeight={() => 54}
        width={tableWidth}
        onScroll={({ scrollLeft }: { scrollLeft: number }) => {
          // scrollDebounce({ scrollLeft });
          onScroll({ scrollLeft });
        }}
        // overscanColumnsCount={5}
        // overscanRowCount={5}
        // overscanCount={5}
        // overscanColumnCount={5}
      >
        {({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => (
          <div
            className={classNames(styles.virtualTableCell, {
              virtualTableCellLast: columnIndex === mergedColumns.length - 1,
            })}
            style={{
              ...(style ?? {}),
              left: getLeft(style.left ?? ''),
            }}
          >
            {/* {(rawData[rowIndex] as any)[(mergedColumns as any)[columnIndex].dataIndex]} */}
            {renderRow(rawData, rowIndex, mergedColumns, columnIndex)}
          </div>
        )}
      </Grid>
    );
  };

  const renderHeader = (...data: any) => {
    console.log(data);
    const column = data[0];
    const index = mergedColumns.findIndex(item => item.title === column?.title ?? '');
    if (index > -1) {
      <div
        className={styles.theader}
        style={{
          width: mergedColumns[index].width,
        }}
      >
        {column.title}
      </div>;
    }
    return <></>;
  };

  // useEffect(() => {
  //   setTimeout(() => {
  //     setHeader();
  //   }, 0);
  // }, [columns]);
  const resizeDebounce = useCallback(
    debounce(width => {
      setTableWidth(width);
    }, 300),
    [setTableWidth]
  );

  return (
    <ResizeObserver
      onResize={({ width }) => {
        resizeDebounce(width);
      }}
    >
      <Table
        {...props}
        className={styles.virtualTable + (props.className ? ` ${props.className}` : '') + ` ${dataSource && dataSource!.length > 0 ? styles.edmVirtualTable : ''}`}
        columns={mergedColumns}
        pagination={false}
        dataSource={[]}
      />
      {columns!.length > 0 && (
        <Table
          {...props}
          className={styles.virtualTable + (props.className ? ` ${props.className}` : '')}
          columns={mergedColumns}
          pagination={false}
          components={{
            body: renderVirtualList as any,
          }}
          showHeader={false}
        />
      )}
    </ResizeObserver>
  );
};
