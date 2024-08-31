import React, { useState, useEffect, useCallback } from 'react';
import { Progress } from 'antd';
import { apiHolder, DataStoreApi } from 'api';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
import { useAppDispatch } from '@web-common/state/createStore';
const storeApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
interface Props {
  id: number | string;
  createTime: number;
  attrs?: Object;
  leftSecStyle?: Object;
}

interface ProgressTextProps {
  leftSec: number;
  style: Object;
}

const ProgressText: React.FC<ProgressTextProps> = ({ leftSec, style }) => {
  return <div style={style}>{leftSec}</div>;
};

const RevokeCountDown: React.FC<Props> = ({ id, createTime, attrs, leftSecStyle }) => {
  const [percent, setPercent] = useState<number>(0);
  const [siNo, setSiNo] = useState<number>(-1);
  const [countDownMs, setCountDownMs] = useState<number>(0);
  const dispatch = useAppDispatch();

  // 开始倒计时
  const startCountDown = () => {
    let countDownMs = 0;
    const sendRevokeInRes = storeApi.getSync('sendRevokeIn');
    if (!!sendRevokeInRes && sendRevokeInRes.data) {
      countDownMs = Number(sendRevokeInRes.data) * 1000;
      setCountDownMs(countDownMs);
    }
    if (countDownMs < 1) return;
    const now = new Date();
    const nowMS = now.getTime();
    // 剩下的毫秒
    let leftMS = createTime + countDownMs - nowMS;
    // 小于一秒没有倒计时的必要
    if (leftMS < 1000) return;

    // 计算百分比
    const calcPercent = () => {
      if (leftMS < 0) {
        clearInterval(si);
        // 清除redux
        setTimeout(() => dispatch(mailActions.doRemoveSendingMail(id as string)));
        return;
      }
      const curPercent = leftMS / countDownMs;
      setPercent(curPercent * 100);
    };
    calcPercent();

    // 开始倒计时
    const si = setInterval(() => {
      leftMS = leftMS - 1000;
      calcPercent();
    }, 1000);
    setSiNo(si as unknown as number);
  };

  const progressFormat = useCallback(
    (percent?: number) => {
      let leftSec = 0;
      if (percent && percent > 0) {
        const leftMs = (countDownMs * percent) / 100;
        // 取低
        leftSec = Math.floor(leftMs / 1000);
      }
      return <ProgressText leftSec={leftSec} style={leftSecStyle || {}} />;
    },
    [countDownMs]
  );

  useEffect(() => {
    if (id) {
      clearInterval(siNo);
      startCountDown();
    }
  }, [id]);

  return <Progress type="circle" {...attrs} percent={percent} format={progressFormat} />;
};

export default RevokeCountDown;
