import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

interface Props {
  options: any;
  height?: number;
}

export const Chart: React.FC<Props> = props => {
  const { options, height = 300 } = props;
  const [chartInstance, setChartInstance] = useState<echarts.ECharts | null>(null);
  const container = useRef<HTMLDivElement>(null);

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

  return <div ref={container} style={{ height }}></div>;
};
