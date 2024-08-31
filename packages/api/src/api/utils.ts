import { MailEntryModel, MailModelEntries } from '@/api/logical/mail';

// 邮箱格式检测正则
export const emailPattern = /^([^@]+)@([a-zA-Z0-9_\-.]+\.[a-zA-Z0-9]{2,})$/;

// 中文正则
export const zhPattern = /[\u4e00-\u9fa5]/;

/**
 * 多语言翻译
 * 支持模板化
 * ex：getIn18Text('WOJINTIANCHILEFAN',{count:1000})
 * zh.json  { "WOJINTIANCHILEFAN": "我今天吃了{count}碗饭" }
 * en.json  { "WOJINTIANCHILEFAN": "I ate {count} bowls of rice today" }
 * 渲染为： '我今天吃了1000碗饭' | I ate 1000 bowls of rice today.
 */
export const getIn18Text = (key: string | string[], values?: Record<string, string | number>) => {
  let text = '';
  if (typeof key === 'string') {
    text = typeof window !== 'undefined' ? window.getLocalLabel(key) : '';
  } else if (Array.isArray(key)) {
    text = key.map(v => (typeof window !== 'undefined' ? window.getLocalLabel(v) : '')).join('');
  }
  try {
    if (values && /\{[^{}]+\}/.test(text)) {
      const pattern = /\{([^{}]+)\}/g;
      text = text.replace(pattern, (match, p1) => {
        if (p1) {
          // 兼容模板两端的空白
          const jsonKey = p1.trim();
          if (jsonKey && values[jsonKey] !== undefined) {
            return values[jsonKey] + '';
          }
        }
        return match;
      });
    }
  } catch (e) {
    console.error('[Error getIn18Text]', e);
  }
  return text;
};

/**
 * 为MailEntryModel 添加 附件数据来源
 * 注意：会修改原数据
 */
export const setMailAttSource = <T extends MailEntryModel | MailEntryModel[]>(res: T, from?: 'list' | 'content'): T => {
  try {
    if (res) {
      if (Array.isArray(res)) {
        res.forEach(v => {
          v.entry.attSource = from;
        });
      } else if (res?.entry) {
        res.entry.attSource = from;
      }
    }
  } catch (e) {
    console.error('[attSource Error]', e);
  }
  return res;
};

export const setMailListAttSource = <T extends MailModelEntries | MailEntryModel[]>(res: T, from?: 'list' | 'content'): T => {
  try {
    if (res) {
      if (Array.isArray(res)) {
        res.forEach(v => {
          v.entry.attSource = from;
        });
      } else if (res?.data && Array.isArray(res.data)) {
        res.data.forEach(item => {
          if (item && !item?.entry?.attSource) {
            item.entry.attSource = from;
          }
        });
      }
    }
  } catch (e) {
    console.error('[attSource Error]', e);
  }
  return res;
};
