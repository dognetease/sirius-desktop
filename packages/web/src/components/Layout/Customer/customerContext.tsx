/*
 * @Author: sunmingxin
 * @Date: 2021-10-11 17:20:28
 * @LastEditTime: 2021-10-20 21:02:06
 * @LastEditors: sunmingxin
 */

import { createContext, Dispatch } from 'react';
import { BaseInfoRes as BaseSelectType } from 'api';

/**
 * 客户列表定义的全局属性
 */
export interface customerState {
  customerPage: string;
  baseSelect: BaseSelectType;
}
/**
 *  全局事件整理
 *  @param pageState tablePage emialPage
 *  @param uploadInfo  批量上传的反馈信息
 *  @param isLoading 是否有骨架屏
 */
export const customerAllState = {
  pageState: 'tablePage',
};

export interface ContextProps {
  value: {
    state: customerState;
    dispatch: Dispatch<{ type: string; payload: Partial<customerState> }>;
    fetchTableData(): void;
  };
}
export const customerContext = createContext<ContextProps>({} as ContextProps);

/**
 *  全局事件整理
 *  @param setBaseSelect 获取添加客户下拉配置
 *  @param setLoading  客户列表骨架屏
 *  @param  fetchTableData  客户请求参数
 *  @param  updateTableList 更新客户列表
 */

// 全局变更reducer的地方
export const reducer = (state: any, action: { type: string; payload: Partial<customerState> }) => {
  switch (action.type) {
    case 'setState':
    case 'setBaseSelect':
      return { ...state, ...action.payload };
  }
  return state;
};
