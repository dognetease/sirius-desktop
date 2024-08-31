import React, { FC, useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import * as echarts from 'echarts';
import { QueryReport } from 'api';
import _debounce from 'lodash/debounce';

export type EcahrtOption = echarts.EChartsCoreOption;

/**
 * echarts 包裹组件
 */
export const EchartWrap = forwardRef<
  {
    echarts: echarts.ECharts | null;
  },
  {
    className?: string;
    echartOption: echarts.EChartsCoreOption;
  }
>(({ className, echartOption }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [myChart, setMyChart] = useState<echarts.ECharts | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const myChart = echarts.init(containerRef.current);
      setMyChart(myChart);
    }
  }, [containerRef.current]);

  const resize = useCallback(
    _debounce(() => {
      if (myChart) {
        myChart.resize();
      }
    }, 300),
    [myChart]
  );

  useEffect(() => {
    _debounce;
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [myChart]);

  useImperativeHandle(ref, () => ({
    echarts: myChart,
  }));

  useEffect(() => {
    if (myChart != null && echartOption != null) {
      myChart.setOption(echartOption);
    }
  }, [myChart, echartOption]);

  return <div className={className} ref={containerRef}></div>;
});
