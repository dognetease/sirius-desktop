/*
 * @Author: wangzhijie02
 * @Date: 2022-06-27 17:47:46
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-06-28 14:17:30
 * @Description: file content
 */
import { apis, apiHolder, DataTrackerApi } from 'api';
import { BlankFileTemplateUseDataTrackParams } from './components/Unitable/bridge';
const dataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
type FileType = 'doc' | 'excel' | 'unitable';

type Space = 'home' | 'personal' | 'company' | 'detail';
type Pointer = 'banner' | 'fileClick' | 'templateClick' | 'blankDir';

export interface DataTrackerTypes {
  /**空白文件详情页应用模板，这个数据埋点最终是在cospread上报的 */
  blank_file_temple_use: BlankFileTemplateUseDataTrackParams;
  /** 新建空白Base */
  creat_base: {
    /**
        home_banner	首页banner
        home_fileClick	首页新建下拉具体文档类型选项
        home_templateClick	首页新建下拉模板选项
        personal_fileClick	个人空间新建下拉具体文档类型选项
        personal_templateClick	个人空间新建下拉模板选项
        personal_blankDir	个人空间空白目录缺省组件具体文档类型
        company_fileClick	企业空间新建下拉具体文档类型选项
        company_templateClick	企业空间新建下拉模板选项
        company_blankDir	企业空间空白目录缺省组件具体文档类型
        detail_fileClick	详情页新建下拉具体文档类型选项
        detail_templateClick	详情页新建下拉模板选项
    */
    creat_type: `${Space}_${Pointer}`;
    type: FileType;
  };
}
/**
 * 埋点释义参考：
 * https://docs.popo.netease.com/lingxi/f8e78c1a81c84a5abccb64407acd8326?tab=0&popo_locale=zh-CN
 */
export function diskDataTrackerApi<T extends keyof DataTrackerTypes>(eventId: T, payload: DataTrackerTypes[T]) {
  return dataTrackerApi.track(eventId, {
    ...payload,
  });
}
