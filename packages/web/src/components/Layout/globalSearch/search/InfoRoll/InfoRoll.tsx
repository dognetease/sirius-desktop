import classNames from 'classnames';
import React, { useRef, useState } from 'react';
import Slider, { Settings } from 'react-slick';
import 'slick-carousel/slick/slick.css';
import styles from './inforoll.module.scss';
import ResizeObserver from 'rc-resize-observer';

interface InfoRollProps {
  infos?: string[];
  slikOptions?: Settings;
  className?: string;
}

const InfoRoll: React.FC<InfoRollProps> = ({ infos, slikOptions, className }) => {
  const ref = useRef<Slider>(null);
  const settings: Settings = {
    dots: false,
    infinite: true,
    slidesToShow: 2,
    slidesToScroll: 1,
    vertical: true,
    autoplaySpeed: 3000,
    autoplay: true,
    prevArrow: <span></span>,
    nextArrow: <span></span>,
    className: classNames(styles.wrapper, className),
    ...slikOptions,
  };
  return (
    <ResizeObserver
      onResize={({ offsetHeight }) => {
        if (offsetHeight === 0) {
          ref.current?.slickPause();
        } else {
          ref.current?.slickPlay();
        }
      }}
    >
      <Slider ref={ref} {...settings}>
        {infos?.map(e => (
          <div className={styles.item} key={e}>
            {e}
          </div>
        ))}
      </Slider>
    </ResizeObserver>
  );
};

export default InfoRoll;
