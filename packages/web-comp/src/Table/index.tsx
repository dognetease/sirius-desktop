import { Table, ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { TableProps, TablePaginationConfig as ITablePaginationConfig, ColumnGroupType, ColumnType, ColumnProps, ColumnsType } from 'antd/lib/table';
import React from 'react';
import './antd.scss';
import style from './index.module.scss';
import Icon from '@ant-design/icons/es/components/Icon';
import Loading2 from './loading';
import type { CustomIconComponentProps } from '@ant-design/icons/lib/components/Icon';
import classnames from 'classnames';
import ResizeTable from './ResizeTable';

const LoadingIcon = (props: Partial<CustomIconComponentProps>) => {
  let afterProps = {
    className: props.className,
  };

  return <Loading2 {...afterProps} />;
};

let loading = {
  tip: '正在加载中，请稍等...',
  indicator: <Icon rev="" spin component={LoadingIcon} />,
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
    <ConfigProvider locale={zhCN} prefixCls={process.env.BUILD_ENV === 'ui' ? 'lx-ant' : 'ant'}>
      <Table
        rowClassName={(_, index) => (index % 2 === 1 ? 'odd' : 'even')}
        {...props}
        loading={props.loading ? loading : false}
        className={classnames([style.siriusTable, props.className, headerBgColor ? style.headerBgColor : ''])}
      />
    </ConfigProvider>
  );
};

export type TableColumnsType = ColumnsType;
export type TableColumnProps<T> = ColumnProps<T>;
export type TableColumnType<T> = ColumnType<T>;
export type TableColumnGroupType<T> = ColumnGroupType<T>;
export type TablePaginationConfig = ITablePaginationConfig;
export default SiriusTable;
