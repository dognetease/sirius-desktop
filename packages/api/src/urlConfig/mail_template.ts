import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class MailTemplateUrl {
  /**
   * 邮件模板
   */
  getMailTemplateList: string = (host + config('getMailTemplateList')) as string;

  getMailTemplateDetail: string = (host + config('getMailTemplateDetail')) as string;

  saveMailTemplate: string = (host + config('saveMailTemplate')) as string;

  deleteMailTemplate: string = (host + config('deleteMailTemplate')) as string;

  saveMailTemplateUseTime: string = (host + config('saveMailTemplateUseTime')) as string;

  getWaimaoRecommendTemplateTagList: string = (host + config('getWaimaoRecommendTemplateTagList')) as string;

  getWaimaoRecommendTemplateList: string = (host + config('getWaimaoRecommendTemplateList')) as string;

  getTemplateTagList: string = (host + config('getTemplateTagList')) as string;

  deleteTemplateTags: string = (host + config('deleteTemplateTags')) as string;

  saveOrUpdateTemplateTag: string = (host + config('saveOrUpdateTemplateTag')) as string;

  getQueryCondition: string = (host + config('getQueryCondition')) as string;

  fetchSuggestTemplates: string = (host + config('fetchSuggestTemplates')) as string;

  fetchNewTemplateUpdateTime: string = (host + config('fetchNewTemplateUpdateTime')) as string;

  getTemplateDetail: string = (host + config('getTemplateDetail')) as string;

  getTemplateList: string = (host + config('getTemplateList')) as string;

  getTemplateTop: string = (host + config('getTemplateTop')) as string;

  templateSearch: string = (host + config('templateSearch')) as string;

  templateQueryLimit: string = (host + config('templateQueryLimit')) as string;
}
export type MailTemplateUrlKeys = keyof MailTemplateUrl;
const urlConfig = new MailTemplateUrl();
const urlsMap = new Map<MailTemplateUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as MailTemplateUrlKeys, urlConfig[item as MailTemplateUrlKeys]);
});
export default urlsMap;
