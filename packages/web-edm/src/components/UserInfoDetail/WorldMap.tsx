import React, { FC, useState, useEffect } from 'react';
import { Skeleton } from 'antd';
import { SubjectAnalysisRes } from 'api';
import * as echarts from 'echarts';

import { WorldZhMap } from '../../utils/Country-code';
import { EchartWrap, EcahrtOption } from '../EchartWrap';
import styles from './UserInfoDetail.module.scss';

// 世界地图配置cdn地址
const WorldMapConfPath = 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2023/06/15/40ff0c2605cf4b4aba0759904d3baa38.json';

const Colors = ['#7088FF', '#4759B2', '#00C4D6', '#FE6C5E', '#FE9D94', '#FFB54C'] as const;

export const WorldMap: FC<{
  data: SubjectAnalysisRes['contactInfoAnalysisList'][0]['analysisDetailList'];
}> = ({ data }) => {
  const [conf, setConf] = useState<any>();
  const [option, setOption] = useState<EcahrtOption>();

  useEffect(() => {
    fetch(WorldMapConfPath)
      .then(res => res.json())
      .then(res => {
        setConf(res);
      });
  }, []);

  useEffect(() => {
    if (conf) {
      echarts.registerMap('world', conf);
      const curData = data.map((item, index) => {
        const name = WorldZhMap.find(map => map.cn === item.desc)?.en || item.desc;
        // const name = item.desc;
        return {
          name,
          value: item.count,
          itemStyle: {
            areaColor: Colors[index],
            color: Colors[index],
          },
          // 设置hover颜色
          // emphasis: {
          //   itemStyle: {
          //       color: '#000',
          //       areaColor: '#000'
          //   }
          // }
        };
      });
      const nameMap: any = {};
      WorldZhMap.forEach(item => {
        nameMap[item.en] = item.cn;
      });
      console.log();
      setOption({
        roam: false,
        geo: {
          map: 'world',
          roam: false,
          itemStyle: {
            areaColor: '#C9CBD6',
            // borderColor: '#000',
            borderWidth: 0,
          },
          emphasis: {
            // itemStyle: {
            //   color: '',
            // },
          },
        },
        visualMap: {
          // min: 800,
          // max: 50000,
          show: false,
          text: ['High', 'Low'],
          realtime: false,
          calculable: true,
          inRange: {
            color: Colors,
          },
        },
        tooltip: {
          trigger: 'item',
          showDelay: 0,
          transitionDuration: 0.2,
          formatter: (params: any) => {
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-optional-chain
            if (params.data && params.data.value && params.data.name) {
              // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
              const name = nameMap[params.data.name] || params.data.name;
              return `${name}:${params.data.value}`;
            }
            return '';
          },
        },
        legend: {
          top: '0',
          left: '1%',
          icon: 'circle',
        },
        series: [
          {
            // name: '世界地图',
            type: 'map',
            geoIndex: 0,
            data: curData,
            roam: false,
            // 名称映射
            // nameMap,
          },
        ],
      });
    }
  }, [conf, data]);

  if (option == null) {
    return (
      <div
        className={styles.chartsWrap}
        style={{
          padding: 12,
        }}
      >
        <Skeleton active />
      </div>
    );
  }

  return <EchartWrap className={styles.chartsWrap} echartOption={option} />;
};
