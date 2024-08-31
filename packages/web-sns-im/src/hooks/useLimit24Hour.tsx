import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { Alert } from 'antd';
import { getTransText } from '@/components/util/translate';
import style from './useLimit24Hour.module.scss';

const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;
const ONE_SECOND = 1000;

const getRemainText = (remainTime: number) => {
  const remainHour = Math.floor(remainTime / ONE_HOUR);
  const remainMinute = Math.floor((remainTime - remainHour * ONE_HOUR) / ONE_MINUTE);
  const remainSecond = Math.floor((remainTime - remainHour * ONE_HOUR - remainMinute * ONE_MINUTE) / ONE_SECOND);
  return (
    <>
      {getTransText('li24hgoutongshixiaohaisheng')}
      <span className={style.remainingTime}>
        {`${remainHour.toString().padStart(2, '0')}h:${remainMinute.toString().padStart(2, '0')}m:${remainSecond.toString().padStart(2, '0')}s`}
      </span>
      {getTransText('ninkeyifasongrenyixiaoxichudakehu')}
    </>
  );
};

function useLimit24Hour(time: number) {
  const [exceeded, setExceeded] = useState<boolean>(false);
  const [exceededText, setExceededText] = useState<React.ReactChild>('');
  const [remainingText, setRemainingText] = useState<React.ReactChild>('');

  useEffect(() => {
    if (!time) {
      setExceeded(true);
      setExceededText(getTransText('DUIFANGHUIFUHOUCAIKEYIFASONGXIAOXI'));
      setRemainingText('');
    } else {
      const handler = () => {
        const remainTime = time + ONE_DAY - Date.now();

        if (remainTime < 0) {
          setExceeded(true);
          setExceededText(getTransText('CHAOCHU24HGOUTONGSHIXIAO'));
          setRemainingText('');
        } else {
          setExceeded(false);
          setExceededText('');
          setRemainingText(getRemainText(remainTime));
        }
      };
      handler();
      const interval = setInterval(handler, 1000);

      return () => interval && clearInterval(interval);
    }
  }, [time]);

  return {
    exceeded,
    alert: exceeded ? (
      <Alert className={classnames(style.alert, style.disabled)} message={exceededText} type="warning" showIcon />
    ) : (
      <Alert className={style.alert} message={remainingText} type="warning" showIcon />
    ),
  };
}

export { useLimit24Hour };
