import { select } from 'd3-selection';
import cloud from 'd3-cloud';
import React, { useCallback, useState, useEffect, useRef, useMemo, useContext } from 'react';
interface WordCloudProp {
  data: Array<{
    text: string;
    size: number;
  }>;
}

const WordCloud: React.FC<WordCloudProp> = ({ data }) => {
  const ref = useRef<HTMLDivElement>(null);
  const rgb = () => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r},${g},${b})`;
  };
  useEffect(() => {
    if (ref.current) {
      // 清除多余的数据
      select(ref.current).selectAll('*').remove();
      const layout = cloud()
        .words(data)
        .size([ref.current.offsetWidth, 276])
        // .font('PingFang SC')
        .fontSize(function (d) {
          return d.size as number;
        })
        .rotate(0)
        // .spiral('spiral')
        .padding(5)
        .random(Math.random)
        .on('end', words => {
          const texts = select(ref.current)
            .append('svg')
            .attr('width', layout.size()[0])
            .attr('height', layout.size()[1])
            .append('g')
            .attr('transform', 'translate(' + layout.size()[0] / 2 + ',' + layout.size()[1] / 2 + ')')
            .selectAll('text')
            .data(words)
            .enter()
            .append('text')
            .style('font-size', function (d) {
              return (d.size as number) - 10 + 'px';
            })
            .style('font-family', 'PingFang SC')
            .style('font-weight', (d, i) => {
              return d.size && d.size > 32 ? '600' : '400';
            })
            .style('fill', (d, i) => {
              return rgb();
            })
            .attr('text-anchor', 'middle')
            .attr('transform', function (d) {
              return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')';
            })
            .text(function (d) {
              return d.text as string;
            });
        });
      layout.start();
    }
  }, [data, ref.current, ref.current?.offsetWidth]);
  return (
    <>
      <div className="wordCloud" style={{ margin: '0 auto', display: 'flex', justifyContent: 'center' }} ref={ref}></div>
    </>
  );
};

export default WordCloud;
