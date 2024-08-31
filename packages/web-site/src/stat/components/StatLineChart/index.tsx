import React, { useEffect, useRef, useState, MouseEvent } from 'react';
import * as echarts from 'echarts';
import { setChartsOption } from '../../utils';
import { EmptyDataContent } from '@web-site/components/EmptyDataContent';
import { ReactComponent as RightArrowIcon } from '../../../images/right-arrow.svg';
import styles from './style.module.scss';
import { getIn18Text } from 'api';

interface StatLineChart {
  count: number;
  data: any;
  title: string;
  goDetails?: (e: MouseEvent<HTMLDivElement>) => void;
  width: number; // 外层容器宽度
  initHideStatus: boolean;
  unit?: string;
  enableDetail?: boolean;
  showCount?: boolean;
  cardClassName?: string;
}

export default function StatLineChart(props: StatLineChart) {
  const { count, data, title, goDetails = () => {}, width, initHideStatus, unit = '人', enableDetail = true, showCount = true, cardClassName = '' } = props;
  // echarts dom容器
  const domRef = useRef(null);
  // echarts 实例
  const chartRef = useRef<echarts.EChartsType>();

  // 整体访问客户数
  useEffect(() => {
    if (count > 0 && domRef.current) {
      chartRef.current = echarts.init(domRef.current, {}, { renderer: 'svg' });
      setChartsOption({ chart: chartRef.current, data, unit: unit });
    }
  }, [data]);

  // 窗口变化时自适应图表宽度
  useEffect(() => {
    chartRef.current?.resize();
  }, [width]);

  return (
    <div className={`${styles.card} ${cardClassName}`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>{title}</div>
        {enableDetail ? (
          <div onClick={goDetails} className={styles.headerDetails}>
            {getIn18Text('XIANGQING')}
            <RightArrowIcon />
          </div>
        ) : null}
      </div>
      {/* 设置初始化隐藏状态，等第一次请求数据之后再由请求数据情况决定展示数据，还是暂无数据 */}
      {initHideStatus ? null : count ? (
        <>
          {showCount ? <div className={styles.count}>{count}</div> : null}
          <div className={styles.lineChart} ref={domRef}></div>
        </>
      ) : (
        <EmptyDataContent />
      )}
    </div>
  );
}
