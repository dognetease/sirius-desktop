import { MD5 } from 'crypto-js';
import isEmpty from 'lodash/isEmpty';
import { API_FETCH_SIGN_SECRET } from './secretHelper';

export const getSignByApiParams = (params: any) => {
  const timestamp = Date.now();
  const newParams = {
    ...params,
    timestamp,
  };
  const keys = Object.keys(newParams);
  const list = keys.sort();
  const resultStr = list.reduce((prev, curr) => {
    if (newParams[curr] == null || newParams[curr] === '' || (typeof newParams[curr] === 'object' && isEmpty(newParams[curr]))) return prev;
    return `${prev}${curr}=${typeof newParams[curr] === 'object' ? JSON.stringify(newParams[curr]) : newParams[curr]}`;
  }, API_FETCH_SIGN_SECRET);
  const sign = MD5(`${resultStr}${API_FETCH_SIGN_SECRET}`).toString().toUpperCase();
  return {
    sign,
    timestamp,
  };
};
