import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { setChartsOption } from '../../utils';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { ReactComponent as RightArrowIcon } from '../../../images/right-arrow.svg';
import styles from '../StatLineChart/style.module.scss';
import { getIn18Text } from 'api';

interface StatBarChart {
  productName: string;
  data: any;
  title: string;
  goDetails: () => void;
  width: number; // 外层容器宽度
}

export default function StatBarChart(props: StatBarChart) {
  const { productName, data, title, goDetails, width } = props;
  // echarts dom容器
  const domRef = useRef(null);
  // echarts 实例
  const chartRef = useRef<echarts.EChartsType>();

  // 整体访问客户数
  useEffect(() => {
    if (productName && domRef.current) {
      chartRef.current = echarts.init(domRef.current, {}, { renderer: 'svg' });
      setChartsOption({ chart: chartRef.current, data, seriesType: 'bar' });
    }
  }, [productName, data]);

  // 窗口变化时自适应图表宽度
  useEffect(() => {
    chartRef.current?.resize();
  }, [width]);

  if (!productName) {
    return null;
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>{title}</div>
        <div onClick={goDetails} className={styles.headerDetails}>
          {getIn18Text('XIANGQING')}
          <RightArrowIcon />
        </div>
      </div>
      <div className={styles.productName}>
        <EllipsisTooltip>{productName}</EllipsisTooltip>
      </div>
      <div className={styles.barChart} ref={domRef}></div>
    </div>
  );
}
