import React, { useState, useEffect } from 'react';
import { Table, ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import type { ColumnsType } from 'antd/es/table';
import type { ResizeCallbackData } from 'react-resizable';
import { Resizable } from 'react-resizable';
import type { SiriusTableProp } from './index';
import './antd.scss';

const ResizableTitle = (
  props: React.HTMLAttributes<any> & {
    onResize: (e: React.SyntheticEvent<Element>, data: ResizeCallbackData) => void;
    width: number;
  }
) => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={e => {
            e.stopPropagation();
          }}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

const ResizeTable = (props: SiriusTableProp) => {
  let originColumns = props.columns ?? [];

  // @ts-ignore
  const [columns, setColumns] = useState<ColumnsType<object>>(originColumns);

  useEffect(() => {
    setColumns(originColumns);
  }, [originColumns]);

  const handleResize: Function =
    (index: number) =>
    (_: React.SyntheticEvent<Element>, { size }: ResizeCallbackData) => {
      const newColumns = [...columns];
      newColumns[index] = {
        ...newColumns[index],
        width: size.width,
      };
      setColumns(newColumns);
    };

  const tableColumns: any[] = columns.map((col, index) => ({
    ...col,
    onHeaderCell: (column: ColumnsType<object>[number]) => ({
      width: column.width,
      onResize: handleResize(index) as React.ReactEventHandler<any>,
    }),
  }));

  return (
    <ConfigProvider locale={zhCN} prefixCls={process.env.BUILD_ENV === 'ui' ? 'lx-ant' : 'ant'}>
      <Table
        {...props}
        components={{
          header: {
            cell: ResizableTitle,
          },
        }}
        columns={tableColumns}
      />
    </ConfigProvider>
  );
};

export default ResizeTable;
