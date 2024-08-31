import zh from './zh.json';
import en from './en.json';
import zhTrad from './zh-trad.json';
import waimaoZh from './waimao/zh.json';
import waimaoEn from './waimao/en.json';
import waimaoZhTrad from './waimao/zh-trad.json';
import apiZh from './lingxi-api/zh.json';
import apiEn from './lingxi-api/en.json';
import apiZhTrad from './lingxi-api/zh-trad.json';
import previewZh from './lingxi-preview-img/zh.json';
import previewEn from './lingxi-preview-img/en.json';
import previewZhTrad from './lingxi-preview-img/zh-trad.json';
import yingxiaoZh from './yingxiao/zh.json';
import yingxiaoEn from './yingxiao/en.json';
import yingxiaoZhTrad from './yingxiao/zh-trad.json';

export const Labels = {
  zh: { ...waimaoZh, ...zh, ...apiZh, ...previewZh },
  en: { ...waimaoEn, ...en, ...apiEn, ...previewEn },
  'zh-trad': { ...zh, ...zhTrad, ...apiZhTrad, ...previewZhTrad },
};

export const WaimaoLabels = {
  zh: { ...zh, ...waimaoZh, ...apiZh, ...previewZh, ...yingxiaoZh },
  en: { ...en, ...waimaoEn, ...previewEn, ...yingxiaoEn, ...apiEn },
  'zh-trad': { ...zh, ...waimaoZhTrad, ...previewZhTrad, ...yingxiaoZhTrad, ...apiZhTrad },
};
