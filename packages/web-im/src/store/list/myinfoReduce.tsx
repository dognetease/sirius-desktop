/**
 * 数据处理 & 初始化数据
 */

import { IMUser } from 'api';

export const reduce = (state, action) => {
  const { type, payload } = action;
  return { ...state, ...payload };
};

export interface MyinfoApi extends Partial<IMUser> {
  isMe: boolean;
}

export const initState: MyinfoApi = {
  isMe: true,
  nick: '',
  email: '',
  gender: '',
  account: '',
  color: '',
  pinyinname: '',
};
