import React from 'react';
import { TongyongGuanbiXian } from '@sirius/icons';
import style from './customerItem.module.scss';

interface ItemProps {
  number: string;
  name: string;
  index: number;
  companyName: string;
  onDelete: (id: string, name?: string) => void;
  isTitle?: boolean;
  style: React.CSSProperties;
}

export const CustomerItem: React.FC<ItemProps> = ({ index, number, onDelete, isTitle, name, companyName, style: topStyle }) => (
  <div className={style.item} key={index} style={topStyle}>
    <div>
      {isTitle ? (
        <span className={style.subText}>{name}</span>
      ) : (
        <>
          <span className={style.mainText}>{number}</span>
          {name ? <span className={style.subText}>{`（${name}）`}</span> : null}
        </>
      )}
    </div>
    <div>
      <TongyongGuanbiXian
        style={{
          cursor: 'pointer',
        }}
        onClick={() => {
          onDelete(number, companyName);
        }}
      />
    </div>
  </div>
);
