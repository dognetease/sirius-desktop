import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import classnames from 'classnames';
import style from './tradeEchars.module.scss';

interface MarketPartProp {
  title: string;
  list: Array<{
    label: string;
    value: string;
  }>;
}

const MarketPart: React.FC<MarketPartProp> = ({ title, list }) => {
  return (
    <div className={style.market}>
      <header>{title}</header>
      <div className={style.marketContent}>
        {list.map(item => {
          return (
            <div className={style.marketPart}>
              <div className={style.marketMain} key={item.label}>
                <p>{item.value}</p>
                <span>{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketPart;
