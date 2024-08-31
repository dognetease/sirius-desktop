import React from 'react';
import { CURRENCY_MAP, getTextContent } from '../editor/template';
import style from './style.module.scss';

const getColumns = (columns: string[], fieldsMap: any, callback: Function) => {
  setTimeout(() => {
    callback();
  }, 0);
  return columns.map(key => ({
    title: fieldsMap[key]?.label,
    width: 130,
    key,
    dataIndex: key,
    ellipsis: {
      showTitle: false,
    },
    render: (text: string, record: any) => {
      // 富文本字段转换为纯文本
      if (key == 'product_description_en') {
        text = getTextContent(text);
      } else if (key === 'price') {
        text = record['priceRange'] || text; // 优先展示价格区间
        if (text) {
          const currency: keyof typeof CURRENCY_MAP = record['price_currency'];
          const currencyIcon = currency ? CURRENCY_MAP[currency] || '$' : '$';
          text = currencyIcon + text;
        }
      }
      return <span className={style.tdSpan}>{text || '-'}</span>;
    },
  }));
};

export { getColumns };
