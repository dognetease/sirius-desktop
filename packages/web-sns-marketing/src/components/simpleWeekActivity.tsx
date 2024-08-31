import { getIn18Text } from 'api';
import React, { useRef, useEffect } from 'react';

export interface IActivity {
  x: number;
  y: number;
  color?: string;
}

export interface ISimpleWeekActivity {
  width: string;
  height: string;
  options?: {
    defaultColor: string;
    borderRadius: number;
    font?: string;
  };
  dataSource: IActivity[];
}

export const SimpleWeekActivity = React.memo((props: ISimpleWeekActivity) => {
  const { width, height, dataSource, options } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    renderActivity(canvasRef.current!, dataSource, options);
  }, []);

  return <canvas ref={canvasRef} style={{ width, height }} />;
});

function getPixelRatio() {
  const ratio = window.devicePixelRatio || 1;
  const x = ratio * 20;
  const rx = Math.round(x);
  return rx - x > 0.82 ? rx / 20 : Math.round(ratio * 100) / 100;
}

export interface RenderActivityOpt {
  defaultColor: string;
  borderRadius: number;
  font?: string;
}

const defaultOpt = {
  defaultColor: '#386EE7',
  borderRadius: 4,
  font: '10px system-ui, Avenir, Helvetica, Arial, sans-serif',
};

export function renderActivity(canvas: HTMLCanvasElement, activitys: IActivity[], opt: RenderActivityOpt = defaultOpt) {
  console.time('renderActivity');
  const { offsetWidth, offsetHeight } = canvas;
  const { defaultColor, borderRadius, font } = opt;
  const colCount = 7;
  const rowCount = 5;
  const weekDayShort = [getIn18Text('ri'), getIn18Text('YIv16'), getIn18Text('ER'), getIn18Text('SAN'), getIn18Text('SI'), getIn18Text('WUv16'), getIn18Text('LIU')];

  const gridWidth = (offsetWidth - colCount - 1) / colCount;
  const gridHeight = (offsetHeight - rowCount - 1) / rowCount;

  const ctx = canvas.getContext('2d')!;

  const dpi = getPixelRatio();
  console.log('canvas adjustPixelRatio', dpi, gridWidth, gridHeight);
  canvas.width = offsetWidth * dpi;
  canvas.height = offsetHeight * dpi;

  ctx?.scale(dpi, dpi);
  ctx.strokeStyle = '#e3e3e3';

  // 线
  ctx.beginPath();
  ctx.moveTo(0.5 + borderRadius, 0.5);
  ctx.lineTo(offsetWidth - 0.5 - borderRadius, 0.5);
  ctx.arcTo(offsetWidth - 0.5, 0.5, offsetWidth - 0.5, borderRadius + 0.5, borderRadius);

  ctx.lineTo(offsetWidth - 0.5, offsetHeight - 0.5 - borderRadius);
  ctx.arcTo(offsetWidth - 0.5, offsetHeight - 0.5, offsetWidth - 0.5 - borderRadius, offsetHeight - 0.5, borderRadius);

  ctx.lineTo(0.5 + borderRadius, offsetHeight - 0.5);
  ctx.arcTo(0.5, offsetHeight - 0.5, 0.5, offsetHeight - 0.5 - borderRadius, borderRadius);

  ctx.lineTo(0.5, borderRadius);
  ctx.arcTo(0.5, 0.5, 0.5 + borderRadius, 0.5, borderRadius);

  let i = 0;
  for (i = 0; i < rowCount - 1; i++) {
    const y = (gridHeight + 1) * (i + 1) + 0.5;
    ctx.moveTo(0, y);
    ctx.lineTo(offsetWidth, y);
  }

  for (i = 0; i < colCount - 1; i++) {
    const x = (gridWidth + 1) * (i + 1) + 0.5;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, offsetHeight);
  }
  ctx.closePath();
  ctx.stroke();

  // 日期
  ctx.font = font || defaultOpt.font;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  for (i = 0; i < weekDayShort.length; i++) {
    const x = (gridWidth + 1) * i + 0.5 + gridWidth / 2;
    const y = gridHeight / 2;
    ctx.fillText(weekDayShort[i], x, y);
  }

  // 格子高亮
  for (const { x, y, color } of activitys) {
    ctx.fillStyle = color || defaultColor;
    ctx.fillRect(x * (gridWidth + 1) + 1, y * (gridHeight + 1) + 1, gridWidth, gridHeight);
  }

  console.timeEnd('renderActivity');
}
