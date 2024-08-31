/*
 * 功能：将一个state值转为ref,并且在渲染中保持同步
 */
import { useRef } from 'react';

const useStateRef = <T>(state: T) => {
  const ref = useRef<T>(state);
  ref.current = state;
  return ref;
};

export default useStateRef;
