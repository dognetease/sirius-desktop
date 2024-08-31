/*
 * @Author: wangzhijie02
 * @Date: 2021-11-24 15:39:30
 * @LastEditTime: 2022-06-07 11:37:42
 * @LastEditors: wangzhijie02
 * @Description:
 */
import { SvgIconCooperative, SvgIconDaily, SvgIconHr, SvgIconLearn, SvgIconLife, SvgIconOwn, SvgIconPopular, SvgIconProject, SvgIconProps } from './components/SvgIcon';
import { getIn18Text } from 'api';
// 变量
export const DOC_TYPES = [
  { value: 'all', label: getIn18Text('QUANBU') },
  { value: 'excel', label: getIn18Text('XIETONGBIAOGE') },
  { value: 'doc', label: getIn18Text('XIETONGWENDANG') },
  { value: 'unitable', label: 'Unitable' },
] as const;
// ts 类型
type O = typeof DOC_TYPES;
export type DOC_VALUES = {
  [value in keyof O]: O[value] extends {
    label: any;
    value: any;
  }
    ? O[value]['value']
    : never;
}[keyof O];
export type DOC_TYPE = Exclude<DOC_VALUES, 'all'>;
export enum TemplateKind {
  My = 'My',
  Recommend = 'Recommend',
}
/**
 * 模板库-模板类型定义
 */
export interface Template {
  id: number;
  docType: DOC_TYPE;
  title: string;
  previewImageUrl: string;
}
export interface CommendTemplate {
  categoryCode: number;
  categoryName: string;
  templates: Template[];
}
export enum TemplateCategoryEnum {
  /**我的模板 */
  own = 1001,
  /**热门 */
  hot = 1010,
  /**项目 */
  project = 1,
  /**办公 */
  office = 2,
  /**日常 */
  daily = 3,
  /**人力资源 */
  hr = 4,
  /**学习 */
  learn = 5,
  /**生活 */
  life = 6,
}
export interface TemplateCategoryDesc {
  type: TemplateCategoryEnum;
  title: string;
  Icon: React.ComponentType<SvgIconProps>;
}
/**
 * 模板分类以及对应的icon和名称
 */
export const templateCategorys = new Map<TemplateCategoryEnum, TemplateCategoryDesc>([
  [
    TemplateCategoryEnum.own,
    {
      type: TemplateCategoryEnum.own,
      Icon: SvgIconOwn,
      title: getIn18Text('WODEMOBAN'),
    },
  ],
  [
    TemplateCategoryEnum.hot,
    {
      type: TemplateCategoryEnum.hot,
      Icon: SvgIconPopular,
      title: getIn18Text('REMENTUIJIAN'),
    },
  ],
  [
    TemplateCategoryEnum.project,
    {
      type: TemplateCategoryEnum.project,
      Icon: SvgIconProject,
      title: getIn18Text('XIANGMUGUANLI'),
    },
  ],
  [
    TemplateCategoryEnum.office,
    {
      type: TemplateCategoryEnum.office,
      Icon: SvgIconCooperative,
      title: getIn18Text('BANGONGXIEZUO'),
    },
  ],
  [
    TemplateCategoryEnum.daily,
    {
      type: TemplateCategoryEnum.daily,
      Icon: SvgIconDaily,
      title: getIn18Text('RICHANGGONGZUO'),
    },
  ],
  [
    TemplateCategoryEnum.hr,
    {
      type: TemplateCategoryEnum.hr,
      Icon: SvgIconHr,
      title: getIn18Text('RENLIZIYUAN'),
    },
  ],
  [
    TemplateCategoryEnum.learn,
    {
      type: TemplateCategoryEnum.learn,
      Icon: SvgIconLearn,
      title: getIn18Text('GAOXIAOXUEXI'),
    },
  ],
  [
    TemplateCategoryEnum.life,
    {
      type: TemplateCategoryEnum.life,
      Icon: SvgIconLife,
      title: getIn18Text('SHENGHUOGUANLI'),
    },
  ],
]);
