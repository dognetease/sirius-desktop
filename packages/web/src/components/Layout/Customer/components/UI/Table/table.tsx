import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableProps } from 'antd';
import { ColumnType } from 'antd/lib/table';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { apiHolder, DataStoreApi } from 'api';
import classnames from 'classnames';
import style from './table.module.scss';

const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

export interface DragTableProps<RecordType> extends TableProps<RecordType> {
  tableWidthKey: string;
}

const ResizableTitle = props => {
  const { onResize, width, ...restProps } = props;
  if (width === undefined) {
    return <th {...restProps} />;
  }

  return (
    <Resizable width={width} height={0} onResize={onResize}>
      <th {...restProps} />
    </Resizable>
  );
};

const CustomerTable = <T extends object = any>(props: DragTableProps<T>) => {
  const { tableWidthKey, className, columns, ...restProps } = props;
  const [tableColumns, setTableColumns] = useState<ColumnType<T>[]>([]);

  type ColumnsKeys = keyof ColumnType<T>;
  const handleResize1 = useCallback(
    column =>
      (e: any, { size }: any) => {
        setTableColumns(tableColumns => {
          const newColumns = tableColumns.map(item => {
            if (item === column && size.width > 68) {
              item.width = size.width;
            }
            return item;
          });
          setTableWidth(newColumns);
          // dataIndex
          console.log('newColumns', newColumns);
          return newColumns;
        });
      },
    []
  );

  useEffect(() => {
    if (columns) {
      const newColumns = columns.map(col => {
        col.onHeaderCell = () => ({
          width: col.width,
          onResize: handleResize1(col),
        });
        return col;
      });
      setTableColumns(newColumns);
      // 初始化表格参数
      getTableWidth(newColumns);
    }
  }, [columns]);

  const setTableWidth = (newColumns: ColumnType<T>[]) => {
    const newmap: Record<string, string | number> = {};
    (newColumns || []).forEach(item => {
      if (item.dataIndex && item.width) {
        newmap[item.dataIndex as ColumnsKeys] = item.width;
      }
    });
    dataStoreApi.putSync(tableWidthKey, JSON.stringify(newmap), {
      noneUserRelated: false,
    });
  };
  const getTableWidth = (columns: ColumnType<T>[]) => {
    const { data } = dataStoreApi.getSync(tableWidthKey);
    if (data) {
      const localData = JSON.parse(data);
      const newColumns = (columns || []).map(item => {
        if (item?.dataIndex && localData && localData[item?.dataIndex as ColumnsKeys]) {
          if (localData[item.dataIndex as ColumnsKeys] && localData[item.dataIndex as ColumnsKeys] >= 68) {
            item.width = localData[item.dataIndex as ColumnsKeys];
          }
        }
        return item;
      });
      setTableColumns(newColumns);
    }
  };

  const components = {
    header: {
      cell: ResizableTitle,
    },
  };

  return <Table {...restProps} bordered className={classnames(style.dragTableWrap, className)} columns={tableColumns} components={components} />;
};

export default CustomerTable;
