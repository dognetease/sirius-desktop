import React from 'react';
import { TongyongGuanbiXian } from '@sirius/icons';

interface ItemProps {
  number: string;
  sentCount: number;
  index: number;
  onDelete: () => void;
}

export const Item: React.FC<ItemProps> = ({ index, number, sentCount, onDelete }) => {
  return (
    <div
      style={{
        height: 44,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 16px',
      }}
      key={index}
    >
      <div>
        <span>{number}</span>
      </div>
      <div>
        {sentCount ? (
          <span
            style={{
              padding: '0px 4px',
              fontWeight: 400,
              fontSize: '12px',
              color: '#747A8C',
              marginRight: '40px',
            }}
          >
            营销
            <span
              style={{
                color: '#4C6AFF',
                fontWeight: 500,
              }}
            >
              {sentCount}
            </span>
            次
          </span>
        ) : null}
        <TongyongGuanbiXian
          style={{
            cursor: 'pointer',
          }}
          onClick={() => {
            onDelete(number);
          }}
        />
      </div>
    </div>
  );
};
