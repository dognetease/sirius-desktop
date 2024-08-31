import React, { useRef, useEffect, useState } from 'react';
import { WarmUpData } from 'api';
import * as echarts from 'echarts';
import { Carousel } from 'antd';
import { CarouselRef } from 'antd/lib/carousel';
import { ReactComponent as TipIcon } from '@/images/icons/tip.svg';
import { ReactComponent as RoundPrev } from '@/images/icons/round_prev.svg';
import { ReactComponent as RoundNext } from '@/images/icons/round_next.svg';
import style from './scoreGauge.module.scss';

export interface Props {
  info: WarmUpData;
}

const option = {
  title: {
    text: '',
    left: 'center',
    top: 'center',
    textAlign: 'auto',
    textStyle: {
      align: 'center',
      rich: {
        a: {
          color: '#272E47',
          fontSize: 40,
          fontWeight: 500,
          fontFamily: 'LX-numbers',
        },
        b: {
          color: '#747A8C',
          fontSize: 14,
          padding: [13, 0, 0, 5],
        },
        none: {
          color: '#272E47',
          fontSize: 40,
          fontWeight: 500,
        },
      },
    },
  },
  series: [
    {
      type: 'pie',
      zlevel: 100,
      radius: ['50px', '76px'],
      animation: false,
      emphasis: {
        disabled: true,
      },
      label: {
        show: false,
      },
      labelLine: {
        show: false,
      },
      markPoint: {
        symbol: 'none',
      },
      data: [
        {
          value: 100,
          itemStyle: { color: '#F2F5FF' },
        },
      ],
    },
    {
      type: 'gauge',
      radius: '80px',
      zlevel: 200,
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 100,
      pointer: {
        show: false,
      },
      progress: {
        show: true,
        overlap: false,
        roundCap: true,
        clip: false,
        itemStyle: {
          borderWidth: 0,
          color: '#4C6AFF',
        },
      },
      axisLine: {
        roundCap: true,
        lineStyle: {
          width: 16,
          color: [[1, '#EFF2FF']],
        },
      },
      splitLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        show: true,
        color: '#9FA2AD',
        distance: -25,
        formatter: function (val: any) {
          return val == 0 ? '\n\n\n0' : val === 100 ? '\n\n\n100' : '';
        },
      },
      detail: {
        show: false,
      },
      data: [] as any,
    },
  ],
};

const ScoreGauge = (props: Props) => {
  const { info } = props;
  const [scoreChart, setScoreChart] = useState<echarts.ECharts | null>(null);
  const scoreGaugeRef = useRef<HTMLDivElement>(null);
  const tipsRef = useRef<CarouselRef>(null);

  useEffect(() => {
    if (scoreGaugeRef.current) {
      const myChart = echarts.init(scoreGaugeRef.current);
      setScoreChart(myChart);
    }
  }, [scoreGaugeRef.current]);

  useEffect(() => {
    if (scoreChart && option && info) {
      const score = info.score || 0;
      if (!score) {
        // 计算中
        option.title.text = `{none|—}{b|分}`;
        option.series[1].data = [];
      } else {
        option.title.text = `{a|${score}}{b|分}`;
        option.series[1].data = [{ value: score }];
      }
      scoreChart.setOption({ ...option });
    }
  }, [scoreChart, option, info]);

  return (
    <div className={style.scoreWrap}>
      <p className={style.scoreTitle}>邮箱信誉度得分</p>
      <div className={style.scoreContainer}>
        <div className={style.scoreGauge}>
          <div className={style.Gauge} ref={scoreGaugeRef}></div>
        </div>
        <div className={style.scoreTips}>
          <Carousel ref={tipsRef}>
            <div className={style.tipsItem}>
              <p className={style.tipsIcon}>
                <TipIcon />
                <span>小提示</span>
              </p>
              <p className={style.tipsContent}>邮箱预热是像真人收发邮件一样，通过发信，回复，标记重要，移除垃圾箱等操作来提升我们邮箱地址在每家邮件服务商的信誉度。</p>
            </div>
            <div className={style.tipsItem}>
              <p className={style.tipsIcon}>
                <TipIcon />
                <span>小提示</span>
              </p>
              <p className={style.tipsContent}>
                每家邮件服务商会监控我们的发信行为，以确保我们是真人在进行邮件互动，不光是要发邮件同样需要接收邮件，因为不一致的收发行为会触发邮件服务商的反垃圾策略。
              </p>
            </div>
            <div className={style.tipsItem}>
              <p className={style.tipsIcon}>
                <TipIcon />
                <span>小提示</span>
              </p>
              <p className={style.tipsContent}>
                如果您想获得较高的信誉度分数，则应预热您的邮箱地址，邮箱预热是逐渐增加电子邮件发送量，通过真人操作以建立良好域声誉的过程。
              </p>
            </div>
          </Carousel>
          <p className={style.btnWrap}>
            <span className={style.prev} onClick={() => tipsRef.current?.prev()}>
              <RoundPrev />
            </span>
            <span className={style.next} onClick={() => tipsRef.current?.next()}>
              <RoundNext />
            </span>
          </p>
          <p className={style.bulb}></p>
        </div>
      </div>
    </div>
  );
};

export default ScoreGauge;
