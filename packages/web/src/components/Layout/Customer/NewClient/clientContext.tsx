/*
 * @Author: sunmingxin
 * @Date: 2021-10-11 17:20:28
 * @LastEditTime: 2021-10-20 21:02:06
 * @LastEditors: sunmingxin
 */

import { createContext, Dispatch } from 'react';
import { apiHolder, apis, RresponseCompanyCommonItem as listItemType, RequestCompanyMyList, RresponseCompanyMyList, ResUploadCientFile as UploadType } from 'api';
import { cloneDeep } from 'lodash';

/**
 * 客户列表定义的全局属性
 */
export interface clientState {
  pageState: string;
  uploadInfo: UploadType | null;
  requestTableParam: Partial<RequestCompanyMyList>;
  RresponseCompanyList: RresponseCompanyMyList;
  companyList: listItemType[];
  baseSelect: any;
  isLoading: boolean;
  activeTab: number;
  selectedRows: string[];
}
/**
 *  全局事件整理
 *  @param pageState tablePage emialPage
 *  @param uploadInfo  批量上传的反馈信息
 *  @param isLoading 是否有骨架屏
 *  @param activeTab  激活的tab页
 */
export const clientAllState = {
  pageState: 'tablePage',
  uploadInfo: null,
  // 客户请求参数
  requestTableParam: {
    // type: 1,
    sort: '', // 排序字段
    is_desc: '', // true //降序， 升序
    page_size: 20,
  },
  // 客户
  RresponseCompanyList: {},
  companyList: [],
  isLoading: true,
  activeTab: 1,
  selectedRows: [],
};

export interface ContextProps {
  value: {
    state: clientState;
    dispatch: Dispatch<{ type: string; payload: Partial<clientState> }>;
    fetchTableData(): void;
  };
}
export const clientContext = createContext<ContextProps>({} as ContextProps);

/**
 *  全局事件整理
 *  @param setLoading  客户列表骨架屏
 *  @param  fetchTableData  客户请求参数
 *  @param  updateTableList 更新客户列表
 */

// 全局变更reducer的地方
export const reducer = (state: any, action: { type: string; payload: Partial<clientState> }) => {
  let lastState = cloneDeep(state);
  switch (action.type) {
    case 'setState': // 更改页面
    case 'setUploadState': // 批量上传反馈信息
    case 'setLoading':
    case 'setActiveTab':
    case 'updateSelectedRow':
      return { ...state, ...action.payload };
    case 'fetchTableData':
      lastState.requestTableParam = {
        ...lastState.requestTableParam,
        ...action.payload.requestTableParam,
      };
      return lastState;
    case 'updateTableList':
      return { ...state, ...action.payload };
  }
  return state;
};
