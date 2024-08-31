/*
 * 功能：useEffect 防抖
 */
import { useEffect } from 'react';
function useDebounceForEffect(fn: () => any, delay: number, dep: any[] = []) {
  useEffect(() => {
    let timer: number;
    timer = setTimeout(fn, delay);
    return () => clearTimeout(timer);
  }, [...dep]);
}
export default useDebounceForEffect;
