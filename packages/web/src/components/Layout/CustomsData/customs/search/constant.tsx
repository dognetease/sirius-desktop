import React from 'react';
import { customsTimeFilterType, getIn18Text } from 'api';

export const timeRangeOptions: Array<{ value: customsTimeFilterType; label: string; monthCount?: number | null }> = [
  {
    value: 'all',
    label: getIn18Text('SUOYOU'),
    monthCount: null,
  },
  {
    value: 'last_five_year',
    label: getIn18Text('JINWUNIAN'),
    monthCount: -60,
  },
  {
    value: 'last_three_year',
    label: getIn18Text('JINSANNIAN'),
    monthCount: -36,
  },
  {
    value: 'last_two_year',
    label: getIn18Text('JINLIANGNIAN'),
    monthCount: -24,
  },
  {
    value: 'last_one_year',
    label: getIn18Text('JINYINIAN'),
    monthCount: -12,
  },
  {
    value: 'last_half_year',
    label: getIn18Text('JINBANNIAN'),
    monthCount: -6,
  },
  {
    value: 'recent_quarter',
    label: getIn18Text('JINYIGEJIDU'),
    monthCount: -3,
  },
];

export const containsExpressTipContent = (
  <span>
    <>{getIn18Text('HUIGUOLVGONGSIMINGCHENGHANGUANJIANCI\uFF1AExpress\u3001UPS\u3001')}</>
    <>Fedex、DHL、Maersk、logistics、cargo、</>
    <>Expeditors、Panalpina、shipping、forwarding、consolidation、express</>
  </span>
);

export const smailPageText = <span>查看未浏览数据时，仅可通过上一页/下一页的方式查看数据。</span>;
