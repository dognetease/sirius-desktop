import { useState, useEffect, useRef } from 'react';

export interface PromiseResult {
  finishState: number; //0表示处理中，1标识处理完成，2标识处理失败，当出现2时，前端中断轮询
  taskId: string;
}

export interface Props {
  promise: Promise<PromiseResult>;
}

export const AsyncNetwork = async (props: Props) => {
  const { promise } = props;
  const timer = useRef<null | NodeJS.Timeout | number>(null);

  useEffect(() => {
    fetch(true, null, 3);
    return () => {
      clearAndStopTime();
    };
  }, []);

  const stratTimeAndFetch = (first: boolean, taskId: string | null, reqCount: number) => {
    timer.current = setTimeout(() => {
      fetch(first, taskId, reqCount);
    }, 10000);
  };

  const fetch = (first: boolean, taskId: string | null, reqCount: number) => {
    timer.current = null;
    promise
      .then(item => {
        if (item.finishState === 2) {
          // onError
          console.log('here');
        }
        if (item.finishState === 1) {
          // onSuccess
          console.log('here');
        }

        if (item.finishState === 0 && timer.current !== -1) {
          const newTaskid = item.taskId;
          stratTimeAndFetch(false, newTaskid, reqCount);
        }
      })
      .catch(e => {
        clearTimer();
        if (reqCount > 0) {
          stratTimeAndFetch(!taskId, taskId, --reqCount);
        } else {
          // onError
        }
      });
  };

  const clearTimer = () => {
    timer.current && clearTimeout(Number(timer.current));
  };

  const clearAndStopTime = () => {
    clearTimer();
    timer.current = -1 as unknown as NodeJS.Timeout;
  };
};
