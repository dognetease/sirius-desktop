/* eslint-disable react/no-unused-prop-types */
import React, { useRef } from 'react';
import style from './download-button.module.scss';

interface IProgressButton {
  // 进度
  progress: number;
  // 进度条颜色
  progressBarColor?: string;
  // button 颜色
  buttonColor?: string;
  onClick?: () => void;
}

export const ProgressButton: React.FC<IProgressButton> = props => {
  const { buttonColor = '#386EE7', progressBarColor = '#8FB2FF', progress, onClick, children } = props;
  const progressRef = useRef<HTMLDivElement>(null);
  const handleDownload = () => {
    onClick && onClick();
  };

  return (
    <div className={style.buttonWrapper} onClick={handleDownload}>
      <div className={style.text}>{children}</div>
      <div style={{ width: `${progress}%`, background: buttonColor }} ref={progressRef} className={style.progressBar} />
      <div className={style.button} style={{ background: progress === 0 || progress === 100 ? buttonColor : progressBarColor }} />
    </div>
  );
};
