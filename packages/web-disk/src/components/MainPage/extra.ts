/*
 * @Author: wangzhijie02
 * @Date: 2021-11-30 17:40:59
 * @LastEditTime: 2022-06-28 14:18:50
 * @LastEditors: wangzhijie02
 * @Description: 模板库相关 埋点代码
 */
import { apis, apiHolder, environment, DataTrackerApi } from 'api';
import { DataTrackerTypes } from '../../dataTracker';
/**
 * 展示模板库 埋点
 */
interface TemplateTrackShowEvent {
  operaType: 'show';
  way: 'List' | 'Banner' | 'filePage-new';
}
/**
 * Recommend
My

 * 通过模板创建文档/创建文档成功 埋点
 */
interface TemplateTrackUseCreatedEvent {
  operaType: 'use' | 'create';
  way: 'List' | 'Banner' | 'BannerQuick' | 'filePage-new';
  type: 'doc' | 'excel';
  kind: 'Recommend' | 'My';
  title: string;
}
const templateTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
/**
 * 用于事件埋点 前置变量缓存
 */
export const trackerTransitionCached: Partial<TemplateTrackShowEvent> | Partial<TemplateTrackUseCreatedEvent> = {
  way: 'Banner',
};
export const trackerCreateBaseCached: Partial<Pick<DataTrackerTypes['creat_base'], 'creat_type'>> = {
  creat_type: undefined,
};
/**
 * 灵犀办公-云文档-模板 相关埋点统一入口函数
 * @param attr
 */
export const templateTrack = function (attr: TemplateTrackShowEvent | TemplateTrackUseCreatedEvent) {
  // 方便开发验证
  if (environment === 'local') {
    console.log('%c埋点-' + 'pcDisk_temple:' + JSON.stringify(attr), 'color:purple');
  }
  templateTrackerApi.track('pcDisk_temple', {
    ...attr,
  });
};
