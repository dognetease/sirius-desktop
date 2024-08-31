/*
 * @Author: wangzhijie02
 * @Date: 2022-06-24 15:36:20
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-06-24 16:42:35
 * @Description: file content
 */
import { ResponseGetUserApp } from 'api';
import { AppIdTypes } from './pageMapConf';

export interface UserAppBasciSatetItem {
  permission: ResponseGetUserApp['permission'];
}
/**
 * 用户所有app的权限和基础信息集合，
 * 目前这里只做权限信息cache
 */
export type UserAppBasicState = {
  [k in AppIdTypes]: UserAppBasciSatetItem;
};
