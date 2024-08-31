import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useSize, useDebounceFn } from 'ahooks';

interface Props {
  options: any;
  height?: number | string;
}

export const EChart: React.FC<Props> = props => {
  const { options, height = '100%' } = props;
  const [chartInstance, setChartInstance] = useState<echarts.ECharts | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const size = useSize(container);

  useEffect(() => {
    if (!chartInstance && container.current) {
      setChartInstance(echarts.init(container.current));
    }
  }, [container.current]);

  useEffect(() => {
    if (chartInstance && options) {
      chartInstance.setOption(options);
    }
  }, [chartInstance, options]);

  const { run: resize } = useDebounceFn(
    () => {
      if (chartInstance) {
        chartInstance.resize();
      }
    },
    { wait: 500 }
  );

  useEffect(() => {
    resize();
  }, [size]);

  return <div ref={container} style={{ height }}></div>;
};
