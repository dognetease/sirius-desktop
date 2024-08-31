/*
 * @Author: sunmingxin
 * @Date: 2021-10-11 17:20:28
 * @LastEditTime: 2021-10-20 21:02:06
 * @LastEditors: sunmingxin
 */

import { createContext, Dispatch } from 'react';
import { apiHolder, apis, CustomerApi, RequestCompanyMyList, opportunityListReq } from 'api';

/**
 * 客户列表定义的全局属性
 */
export interface businessState {
  activeTab: number;
  selectedRows: number[];
  requestParams: Partial<opportunityListReq>;
  total: number;
}

export const initBusinessState = {
  activeTab: 1,
  selectedRows: [],
  requestParams: {},
  total: 0,
};

export interface ContextProps {
  state: businessState;
  dispatch: Dispatch<{ type: string; payload: Partial<businessState> }>;
}
export const businessContext = createContext<ContextProps>({} as ContextProps);

/**
 *  全局事件整理
 *  @param setLoading  客户列表骨架屏
 *  @param  fetchTableData  客户请求参数
 *  @param  updateTableList 更新客户列表
 */

// 全局变更reducer的地方
export const reducer = (state: businessState, action: { type: string; payload: Partial<businessState> }) => {
  console.log('xxx-clue-reducer', action);
  switch (action.type) {
    case 'updateSelectedRow':
    case 'updateRequestParams':
    case 'updateActiveTab':
    case 'updateTotal':
      return { ...state, ...action.payload };

    case 'updateTableList':
      return { ...state, ...action.payload };
  }
  return state;
};
