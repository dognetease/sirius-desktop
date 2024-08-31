import { LoadOperation } from 'api';
import { useEffect, useRef } from 'react';

const noop = function () {};
type CancelCaller = (k: LoadOperation) => void;
export const useCancelToken = () => {
  const axiosSource = useRef<CancelCaller>(noop);

  const newCancelToken = () => {
    return (handler: CancelCaller) => {
      axiosSource.current = handler;
    };
  };

  useEffect(
    () => () => {
      if (axiosSource.current) axiosSource.current('abort');
    },
    []
  );

  return newCancelToken;
};
