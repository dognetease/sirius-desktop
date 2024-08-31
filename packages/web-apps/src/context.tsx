/*
 * @Author: wangzhijie02
 * @Date: 2022-06-22 15:50:24
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-06-24 16:39:29
 * @Description: file content
 */
import React from 'react';
import { UserAppBasciSatetItem, UserAppBasicState } from './types';
import { pageIdDict, PageIds } from './pageMapConf';
export const AppsContext = React.createContext<{
  pageId: PageIds;
  prevPageId?: PageIds;
  userAppInfo: UserAppBasicState | undefined;
  setPageId: (pageId: PageIds) => void;
}>({
  pageId: pageIdDict.appsHome,
  prevPageId: undefined,
  userAppInfo: undefined,
  setPageId: () => {
    console.log(1);
  },
});

class AuthHelper {
  /**
   * @param userAppBasicInfo
   * @returns true 有编辑权限，false 无编辑权限
   */
  hasEdit(userAppBasicInfo: UserAppBasciSatetItem | undefined) {
    if (!userAppBasicInfo) {
      return false;
    }
    return userAppBasicInfo.permission === 'EDIT';
  }
}
/**
 * 权限认证相关判断接口
 */
export const authHelper = new AuthHelper();
