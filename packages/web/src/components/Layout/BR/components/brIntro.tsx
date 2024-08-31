import React from 'react';
import style from '../br.module.scss';

const BrIntro: React.FC<{ list: string[] }> = ({ list }) => {
  return (
    <div className={style.introContainer}>
      {list.map(item => {
        return <span key={item}>{item}</span>;
      })}
    </div>
  );
};

export default BrIntro;
