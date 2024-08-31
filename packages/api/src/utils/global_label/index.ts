import { config } from 'env_def';
import { inWindowTool } from '../inWindow';
import { WaimaoLabels, Labels } from './labels';

const profile = config('profile') as string;
export const SYSTEM_LANGUAGE = 'system_language';
export const DEFAULT_LANG = 'zh';
export const LangEnum = ['en', 'zh', 'zh-trad'] as const;
export type Lang = (typeof LangEnum)[number];
export interface Locale {
  /**
   * 路径，用 : 分割
   */
  path: string;
  /**
   * 语言
   */
  lang?: Lang;
  /**
   * 类型
   * label: 普通文案
   * img: 图片。
   */
  type?: 'label' | 'img';
}

type LangConf<T> = Record<Lang, T>;

// function validValue<T = string>(value: Record<string, unknown>): value is LangConf<T> {
//   if (value == null) {
//     return false;
//   }
//   if (value.en == null && value.zh == null) {
//     return false;
//   }
//   return true;
// }

export type GetLocalLabel = (locale: Locale | string) => string;

/**
 * 获取label方法
 */
export const getLabel: GetLocalLabel = locale => {
  try {
    let path: string;
    let lang: Lang = (window && window.systemLang) || 'zh';
    if (typeof locale === 'string') {
      path = locale;
    } else {
      path = locale.path;
      lang = locale.lang || 'zh';
    }

    const conf = ((window && window.langJson) || (profile && profile.includes('edm') ? WaimaoLabels : Labels)) as
      | LangConf<Record<string, string>>
      | Record<string, string>;
    const value = conf.zh ? (conf as LangConf<Record<string, string>>)[lang][path] : (conf as Record<string, string>)[path];

    return value || '';
  } catch (e) {
    console.warn('[translation] ', e);
    return '';
  }
};

if (inWindowTool() && window) {
  // window 注册 getLocalLabel方法
  window.getLocalLabel = getLabel;
}

export const initWindowLang = (needAddClass?: boolean) => {
  if (inWindowTool()) {
    const systemApi = window.apiResposity.getSystemApi();
    const result = systemApi.getSystemLang();
    if (result) {
      window.systemLang = (result as Lang) || 'zh';
    }

    if (needAddClass) {
      if (window.document && document.body && document.body.classList) {
        document.body.classList.add(`lang-${window.systemLang}`);
      }
    }
  }
};
