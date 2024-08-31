import lodashGet from 'lodash/get';

const md = require('markdown-it')({
  html: true,
  breaks: true,
});
// 转图片消息
// 必须要支持的消息
interface BasicModule {
  order: number;
}
interface ContentAltApi {
  header: string;
  body: string;
  footer?: string;
}

interface ActionUrls {
  pc_url: string;
  url_type: 'INVOKE' | 'LINK' | 'DISABLE';
  // 如果是url_type='invoke' value是入参
  value: string;
}

interface TextModule extends BasicModule {
  module_type: 'TEXT';
  content: string;
  action_url: ActionUrls;
}

export interface IMGModule extends BasicModule {
  module_type: 'IMG';
  img_url: Record<'origin' | 'thumb', string>;
  width: number;
  height: number;
  action: 'URL' | 'VIEW' | 'DISABLE';
  action_url: ActionUrls;
  hover_tips: string;
}

export interface ButtonItemApi {
  button_order: number;
  content: string;
  style: string;
  action_url: ActionUrls;
}

export interface ButtonFrameApi {
  status: string;
  direction: {
    pc_direction: 'HORIZONTAL' | 'VERTICAL';
  };
  buttons: ButtonItemApi[];
}

export interface ButtonModule extends BasicModule {
  module_type: 'BUTTON';
  // 是否需要通过服务接口去拿状态
  interactive: boolean;
  status_url: string;
  status_field: string;

  elements: ButtonFrameApi[];
}

interface HRModule extends BasicModule {
  module_type: 'HR';
}

interface FooterModule extends BasicModule {
  module_type: 'FOOTER';
  content: string;
}
export type Modules = (IMGModule | TextModule | ButtonModule | HRModule | FooterModule)[];

export interface ContentRawApiV2 {
  header: {
    content: string;
    bg_color: string;
  };
  modules: Modules;
}
export interface ContentServerFields {
  necessary: string[];
  alt: ContentAltApi;
  data: ContentRawApiV2;
}

export const supportList = ['TEXT', 'IMG', 'BUTTON', 'HR', 'FOOTER'];

// 将markdown拆分成非自定义标签和自定义标签
export interface CustomTagVars {
  tagName: string;
  attrs: Record<string, string>;
  textContent: string;
}

export const getTextFromMarkdown = (content: string) => {
  const htmlStr = md.render(content) as string;

  const startTagReg = /<[\w\d]+[^>]*>/g;
  const endTagReg = /<\/[\w\d]+>/g;

  return htmlStr
    .replace(startTagReg, '')
    .replace(endTagReg, '')
    .replace(/\\n|\\r/g, '')
    .trim();
};

export const splitMarkdown: (markdownStr: string) => (CustomTagVars | string)[] = (markdownStr: string) => {
  const results: (CustomTagVars | string)[] = [];
  const startOpenTag = /<lxdiv/;
  const endTag = /<\/lxdiv>/;
  const contentTag = /[^<>]{0,}(?=<\/lxdiv)/;
  const attributeReg = /^\s*(?<attrName>[^\s"'<>\/=]+)(?:\s*(=)\s*)(?:["'`]*)?(?<attrValue>[^\s"'=<>`]+)(?:["'`]*)?/;
  while (startOpenTag.test(markdownStr) || markdownStr.length > 0) {
    // 如果(开头/结尾匹配)都匹配不上
    if (!startOpenTag.test(markdownStr) || !endTag.test(markdownStr)) {
      results.push(markdownStr);
      markdownStr = '';
      continue;
    }

    const startOpenIndex = markdownStr.match(startOpenTag)!.index;
    const endResult = markdownStr.match(endTag) as RegExpMatchArray;
    const endCloseIndex = (endResult!.index as number) + endResult[0].length;
    // 如果匹配到之前有普通字符串 push到results中去
    if (startOpenIndex !== 0) {
      results.push(markdownStr.slice(0, startOpenIndex));
    }
    // 去除头
    let subStr = markdownStr.slice(startOpenIndex, endCloseIndex).replace(startOpenTag, '');
    const attrs: Record<string, string> = {};
    // 获取所有的属性
    while (attributeReg.test(subStr)) {
      const result = subStr.match(attributeReg) as RegExpMatchArray;
      const groups = result!.groups as Record<'attrName' | 'attrValue', ''>;
      attrs[groups.attrName] = groups.attrValue;
      subStr = subStr.slice((result!.index as number) + result[0].length);
    }
    const customTagContent = (subStr.match(contentTag) as RegExpMatchArray)[0];

    // 如果是at 那么就拆分出来 作为组件处理。否则转成HTMLFragment 交给markdown-it处理
    if (lodashGet(attrs, 'action', '') === 'at') {
      results.push({
        tagName: 'lxdiv',
        attrs,
        textContent: customTagContent,
      });
    } else {
      const color = lodashGet(attrs, 'color', 'initial');
      results.push(`<span style="color:${color}">${customTagContent}</span>`);
    }

    markdownStr = markdownStr.slice(endCloseIndex);
  }

  return results.reduce((total, current) => {
    if (typeof total[total.length - 1] === 'string' && typeof current === 'string') {
      (total[total.length - 1] as string) += current;
    } else {
      total.push(current);
    }
    return total;
  }, [] as (CustomTagVars | string)[]);
};

// 将占位符替换成真实的内容
export const switchPlaceholder2Var = (tpl: string, vars: ActionUrls) => {
  // 获取到所有的变量
  const reg = /#\{[\w\d_]+\}/g;
  const totalVars = tpl.match(reg) || [];
  return totalVars.reduce((total, current) => {
    const varName = current.replace(/#\{([\w\d_]+)\}/, '$1');
    const varValue = lodashGet(vars, `${varName}.pc_url`, current) as string;
    return total.replace(current, varValue);
  }, tpl);
};
export const convertCustomizeTplV3 = (content: ContentServerFields): ContentRawApiV2 | ContentAltApi => {
  // 如果necessary中包含当前版本不支持的模块 使用备用信息
  if (Array.isArray(content.necessary) && content.necessary.length > 0 && content.necessary.some(item => !supportList.includes(item))) {
    return content.alt;
  }

  return typeof content.data === 'string' ? JSON.parse(content.data) : content.data;
};

export const sortModuleByOrder: (modules: Modules) => Modules = (modules: Modules) => {
  const sortedModules: Modules[] = [];

  // order相同按照顺序排序
  modules.forEach(item => {
    if (Array.isArray(sortedModules[item.order])) {
      sortedModules[item.order].push(item);
    } else {
      sortedModules[item.order] = [item];
    }
  });

  return sortedModules.filter(item => Array.isArray(item)).reduce((total, current) => [...total, ...current], [] as Modules);
};
