import React, { useState } from 'react';
import Styles from './prev-next-mail.module.scss';
interface IProps {
  prevDisable?: boolean;
  nextDisable?: boolean;
  prevTitle?: string;
  nextTitle?: string;
  onPrev: () => void;
  onNext: () => void;
  bgColor?: string;
}

const PrevNextMail: React.FC<IProps> = (props: IProps) => {
  const { prevDisable = false, nextDisable = false, prevTitle = '', nextTitle = '', onPrev, onNext, bgColor = '' } = props;
  const [isHoverPrev, setHoverPrev] = useState<boolean>(false);
  const [isHoverNext, setHoverNext] = useState<boolean>(false);

  return (
    <div
      className={Styles.prevNextMailContainer}
      style={{
        backgroundColor: bgColor ? bgColor : '',
      }}
    >
      <div
        onMouseOver={() => {
          setHoverPrev(true);
        }}
        onMouseOut={() => {
          setHoverPrev(false);
        }}
        onClick={() => {
          if (prevDisable) {
            return;
          }
          onPrev && onPrev();
        }}
        className={`${Styles.prev}${prevDisable ? ' ' + Styles.disable : ''}${isHoverPrev && !prevDisable ? ' ' + Styles.hover : ''}`}
        title={prevTitle ? '上一封：' + prevTitle : ''}
      >
        <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M5.35355 0.646447C5.15829 0.451184 4.84171 0.451184 4.64645 0.646447L0.646447 4.64645C0.451184 4.84171 0.451184 5.15829 0.646447 5.35355L4.64645 9.35355C4.84171 9.54882 5.15829 9.54882 5.35355 9.35355C5.54882 9.15829 5.54882 8.84171 5.35355 8.64645L1.70711 5L5.35355 1.35355C5.54882 1.15829 5.54882 0.841709 5.35355 0.646447Z"
            fill={!prevDisable && isHoverPrev ? '#4C6AFF' : '#6F7485'}
          />
        </svg>
      </div>
      <div className={Styles.splitLine}></div>
      <div
        onMouseOver={() => {
          setHoverNext(true);
        }}
        onMouseOut={() => {
          setHoverNext(false);
        }}
        onClick={() => {
          if (nextDisable) {
            return;
          }
          onNext && onNext();
        }}
        className={Styles.next + `${nextDisable ? ' ' + Styles.disable : ''}${isHoverNext && !nextDisable ? ' ' + Styles.hover : ''}`}
        title={nextTitle ? '下一封：' + nextTitle : ''}
      >
        <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M0.646447 0.646447C0.841709 0.451184 1.15829 0.451184 1.35355 0.646447L5.35355 4.64645C5.54882 4.84171 5.54882 5.15829 5.35355 5.35355L1.35355 9.35355C1.15829 9.54882 0.841709 9.54882 0.646447 9.35355C0.451184 9.15829 0.451184 8.84171 0.646447 8.64645L4.29289 5L0.646447 1.35355C0.451184 1.15829 0.451184 0.841709 0.646447 0.646447Z"
            fill={!nextDisable && isHoverNext ? '#4C6AFF' : '#6F7485'}
          />
        </svg>
      </div>
    </div>
  );
};

export default PrevNextMail;
