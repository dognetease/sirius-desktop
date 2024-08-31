import React, { useMemo } from 'react';
import { EChart } from '../../../components/EChart';

interface Props {
  type?: string;
  name: string;
  data: Array<{ dateOfDay: string; count: string }>;
  defaultXAxis?: string[];
}
interface ChartData {
  xAxis: string[];
  data: string[];
}

export const Chart: React.FC<Props> = props => {
  const { type = 'line', name, data = [], defaultXAxis = [] } = props;

  const chartData = useMemo(() => {
    const res: ChartData = {
      xAxis: defaultXAxis,
      data: [],
    };
    if (data?.length) {
      res.xAxis = [];
      data.forEach(item => {
        res.xAxis.push(item.dateOfDay);
        res.data.push(item.count);
      });
    }

    return res;
  }, [data]);

  return (
    <EChart
      options={{
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: [],
        },
        grid: {
          left: 70,
          top: 30,
          bottom: 50,
          right: 50,
        },
        toolbox: {
          feature: {},
        },
        color: ['#7088FF'],
        xAxis: {
          type: 'category',
          // boundaryGap: false,
          data: chartData.xAxis,
        },
        yAxis: chartData.data?.length
          ? {
              type: 'value',
            }
          : { data: [0, 100, 200, 300, 400, 500], type: 'category' },
        series: [
          {
            name,
            type,
            data: chartData.data,
            barMaxWidth: 50,
          },
        ],
      }}
    />
  );
};
