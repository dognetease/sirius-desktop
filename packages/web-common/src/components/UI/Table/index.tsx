import { Table } from 'antd';
import { TableProps, TablePaginationConfig, ColumnGroupType, ColumnType, ColumnProps, ColumnsType } from 'antd/lib/table';
// import { TableProps, TablePaginationConfig, ColumnGroupType, ColumnType, ColumnProps, ColumnsType } from './types';
import React from 'react';
import style from './index.module.scss';
import Icon from '@ant-design/icons/es/components/Icon';
import Loading2 from './loading';
import type { CustomIconComponentProps } from '@ant-design/icons/lib/components/Icon';
import classnames from 'classnames/bind';
import ResizeTable from './ResizeTable';

const LoadingIcon = (props: Partial<CustomIconComponentProps>) => {
  let afterProps = {
    className: props.className,
  };

  return <Loading2 {...afterProps} />;
};

let loading = {
  tip: '正在加载中，请稍等...',
  indicator: <Icon spin component={LoadingIcon} />,
};

export interface SiriusTableProp extends TableProps<object> {
  resizable?: boolean;
  headerBgColor?: boolean;
}

let SiriusTable = (props: SiriusTableProp) => {
  let { resizable = false, headerBgColor = true } = props;

  if (resizable) {
    return (
      <ResizeTable
        {...props}
        loading={props.loading ? loading : false}
        rowClassName={(_, index: number) => (index % 2 === 1 ? 'odd' : 'even')}
        className={classnames([style.siriusTable, props.className])}
      />
    );
  }

  return (
    <Table
      rowClassName={(_, index) => (index % 2 === 1 ? 'odd' : 'even')}
      {...props}
      loading={props.loading ? loading : false}
      className={classnames([style.siriusTable, props.className, headerBgColor ? style.headerBgColor : ''])}
    />
  );
};

export {
  TablePaginationConfig,
  ColumnGroupType as TableColumnGroupType,
  ColumnType as TableColumnType,
  ColumnProps as TableColumnProps,
  ColumnsType as TableColumnsType,
};
export default SiriusTable;
