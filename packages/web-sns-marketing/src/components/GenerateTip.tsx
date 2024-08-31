import { getIn18Text } from 'api';
import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import { ReactComponent as GeneratingIcon } from '@web-sns-marketing/images/generate-generating.svg';
import { ReactComponent as SuccessIcon } from '@web-sns-marketing/images/generate-success.svg';
import { ReactComponent as ErrorIcon } from '@web-sns-marketing/images/generate-error.svg';
import { ReactComponent as WarnIcon } from '@web-sns-marketing/images/generate-warn.svg';
import style from './GenerateTip.module.scss';

export type GenerateStatus = 'generating' | 'success' | 'error' | 'warn';

interface GenerateTipProps {
  className?: string;
  style?: React.CSSProperties;
  status: GenerateStatus;
  content: React.ReactChild; // 内容文本
  showCarousel?: boolean; // 是否展示轮播状态
  retryContent?: React.ReactChild; // 重试内容文本
  onRetry?: () => void;
}

const IconMap: Record<GenerateStatus, React.ReactElement> = {
  generating: <GeneratingIcon />,
  success: <SuccessIcon />,
  error: <ErrorIcon />,
  warn: <WarnIcon />,
};

const carousels = [
  getIn18Text('ZHENGZAIJIANSUOSHEMEIPING'),
  getIn18Text('ZHENGZAIFENXIYINGXIAOTIE'),
  getIn18Text('ZHENGZAIFENXISHEMEIGAO'),
  getIn18Text('ZHENGZAISHENGCHENGTIEZINEI'),
  getIn18Text('ZHENGZAISHENGCHENGHESHIDE'),
];

const GenerateTip: React.FC<GenerateTipProps> = props => {
  const { className, style: styleFromProps, status, content, showCarousel, retryContent, onRetry } = props;

  const carouselTimer = useRef<NodeJS.Timer | null>(null);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);

  const handleTimerClear = () => {
    carouselTimer.current && clearInterval(carouselTimer.current);
  };

  useEffect(() => {
    if (status === 'generating' && showCarousel) {
      carouselTimer.current = setInterval(() => {
        setCarouselIndex(index => (index + 1) % carousels.length);
      }, 3000);
    }

    return handleTimerClear;
  }, [status, showCarousel]);

  useEffect(() => handleTimerClear, []);

  return (
    <div
      className={classnames(style.generateTip, className, {
        [style.generating]: status === 'generating',
        [style.success]: status === 'success',
        [style.error]: status === 'error',
        [style.warn]: status === 'warn',
      })}
      style={styleFromProps}
    >
      {React.cloneElement(IconMap[status], {
        className: style.icon,
      })}
      <div className={style.content}>{content}</div>
      {status === 'generating' && showCarousel && <div className={style.carousel}>{carousels[carouselIndex]}</div>}
      {status === 'error' && (
        <div className={style.retry} onClick={onRetry}>
          {retryContent}
        </div>
      )}
    </div>
  );
};

export default GenerateTip;
