import React from 'react';
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/question.svg';
import style from './button.module.scss';
import { Popover } from 'antd';
import { getIn18Text } from 'api';
interface ComsProps {
  text: string;
  className?: string;
  onClick: () => void;
}
const content = (
  <div style={{ width: 336, borderRadius: 6, padding: 16, border: '0.5px solid rgba(38, 42, 51, 0.2)' }}>
    {getIn18Text('CONGQUANQIUZHULIUSOUSUOYINQINGHESHEJIAOMEITIZHONG\uFF0CWAJUEGONGSIHELIANXIRENSHUJU')}
  </div>
);
const MarketButton = (props: ComsProps) => {
  const { text, className, onClick } = props;
  return (
    <div className={`${style.customerButton} ${className}`} onClick={onClick}>
      <span className={style.text}>{text}</span>
      <Popover placement="bottomRight" content={content} trigger="hover">
        <QuestionIcon />
      </Popover>
    </div>
  );
};
export default MarketButton;
