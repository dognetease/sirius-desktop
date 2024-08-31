import { Pagination } from 'antd';
import { PaginationProps as SiriusAntdPaginationProps } from 'antd/lib/pagination';
// import { SiriusAntdPaginationProps } from './types';
import * as React from 'react';
import style from './index.module.scss';
import classnames from 'classnames';
import zhCN from './locale/index';

export interface SiriusPaginationProps {
  className?: string;
  /**
   * 默认的当前页数
   * @default 1
   */
  defaultCurrent?: number;
  /**
   * 当前页数
   * @default 1
   */
  current?: number;
  /**
   * 默认的每页条数
   * @default 10
   */
  defaultPageSize?: number;
  /**
   * 禁用分页
   */
  disabled?: boolean;
  /**
   * 只有一页时是否隐藏分页器
   * @default false
   */
  hideOnSinglePage?: boolean;
  /**
   * 用于自定义页码的结构，可用于优化 SEO
   */
  itemRender?: (page: number, type: 'page' | 'prev' | 'next', originalElement: React.ReactNode) => React.ReactNode;
  /**
   * 每页条数
   */
  pageSize?: number;
  /**
   * 指定每页可以显示多少条
   * @default [10, 20, 50, 100]
   */
  pageSizeOptions?: string[];
  /**
   * 当 size 未指定时，根据屏幕宽度自动调整尺寸
   */
  responsive?: boolean;
  /**
   * 是否显示较少页面内容
   * @default false
   */
  showLessItems?: boolean;
  /**
   * 是否可以快速跳转至某页
   * @default false
   */
  showQuickJumper?: boolean | { goButton: React.ReactNode };
  /**
   * 是否展示 pageSize 切换器，当 total 大于 50 时默认为 true
   */
  showSizeChanger?: boolean;
  /**
   * 是否显示原生 tooltip 页码提示
   * @default true
   */
  showTitle?: boolean;
  /**
   * 用于显示数据总量和当前数据顺序
   */
  showTotal?: (total: number, range: [number, number]) => React.ReactNode;
  /**
   * 当添加该属性时，显示为简单分页
   */
  simple?: boolean;
  /**
   * 当为 small 时，是小尺寸分页
   * @default 'default'
   */
  size?: 'default' | 'small';
  /**
   * 数据总数
   * @default 0
   */
  total?: number;
  /**
   * 页码或 pageSize 改变的回调，参数是改变后的页码及每页条数
   */
  onChange?: (page: number, pageSize: number) => void;
  /**
   * pageSize 变化的回调
   */
  onShowSizeChange?: (current: number, size: number) => void;
}

export type PaginationProps = SiriusPaginationProps & SiriusAntdPaginationProps;

let SiriusPagination = (props: PaginationProps) => {
  return <Pagination {...props} locale={zhCN} className={classnames([style.siriusPagination, props.className])} />;
};

export default SiriusPagination;
