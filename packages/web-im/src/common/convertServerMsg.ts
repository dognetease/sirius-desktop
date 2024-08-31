import lodashGet from 'lodash/get';
import { getIn18Text } from 'api';
// 将消息类型转换成统一数据格式
export type CustomBasicContentApi = Record<'header' | 'body' | 'footer', string>;
const EntityTypes = ['LINK', 'HIGHLIGHT', 'ACCOUNT', 'H5LINK'];
// 转换自定义模板
type CustomTplLinkApi = {
  type: 'LINK';
  text: string;
  param: {
    pc_url: string;
  };
};
type CustomTplH5LinkApi = {
  type: 'H5LINK';
  text: string;
  param: {
    pc_url: string;
    url?: string;
  };
};
type CustomTplHighlightApi = {
  type: 'HIGHLIGHT';
  text: string;
};
type CustomTplAccountApi = {
  type: 'ACCOUNT';
  text: string;
  param: {
    id: string;
  };
};
type CustomTplUnitApi = {
  type: 'UNIT';
  text: string;
  param: {
    id: string;
  };
};
type CustomTplTextApi = {
  type: 'TEXT';
  text: string;
};
type CustomTplMailApi = {
  type: 'MAIL';
  text: string;
  param: {
    id: string;
  };
};
interface CustomTplApi extends CustomBasicContentApi {
  var: Record<string, CustomTplLinkApi | CustomTplH5LinkApi | CustomTplHighlightApi | CustomTplAccountApi | CustomTplUnitApi | CustomTplMailApi | CustomTplTextApi>;
  footer_action: unknown;
}
interface CustomTplApi2 extends CustomTplApi {
  footer_support: string[];
  body_support: string[];
}
export type ContentEntityApi =
  | CustomTplLinkApi
  | CustomTplH5LinkApi
  | CustomTplHighlightApi
  | CustomTplAccountApi
  | CustomTplUnitApi
  | CustomTplMailApi
  | CustomTplTextApi;
interface ContentBlockApi {
  text: string;
  entityRanges: Record<'key' | 'length' | 'offset', number>[];
  inlineStyleRanges: any[];
  key?: string;
}
export const convertAlt = (bakContent: string): null | ContentRawApi => {
  if (typeof bakContent !== 'string') {
    return null;
  }
  const bakData = JSON.parse(bakContent) as CustomBasicContentApi;
  if (lodashGet(bakData, 'header.length', 0) === 0) {
    return null;
  }
  return {
    header: bakData.header,
    body: {
      block: {
        text: bakData.body,
        entityRanges: [],
        key: `${Math.random()}`.replace('.', ''),
        inlineStyleRanges: [],
      },
      // @ts-ignore
      entityMap: [],
    },
    footer: bakData.footer,
  };
};
export interface ContentRawApi {
  header: string;
  body: {
    block: ContentBlockApi;
    entityMap: ContentEntityApi[];
  };
  footer?: string;
  footer_action?: Footer_Action;
}
const convertCustomizeTpl = (content: string): ContentRawApi => {
  const data = JSON.parse(content) as CustomTplApi;
  // 获取到所有的变量
  const reg = /#\{[\w_]+\}/g;
  const totalVars = data.body.match(reg) || [];
  const varKeys = Object.keys(data.var);
  const entityRanges: Record<'key' | 'length' | 'offset', number>[] = [];
  const entityMap = varKeys.map(key => data.var[key]);
  const text = totalVars.reduce((total, cur) => {
    const key = cur.replace(/#\{([\w_]+)\}/, '$1');
    // 如果在var中找不到定义 直接忽略
    if (lodashGet(data, `var.${key}`, false) === false) {
      return total;
    }
    const { text } = data.var[key];
    entityRanges.push({
      key: varKeys.indexOf(key),
      offset: total.split(cur)[0].length,
      length: text.length,
    });
    return total.replace(cur, text);
  }, data.body);
  return {
    header: data.header,
    body: {
      block: {
        text,
        entityRanges,
        key: `${Math.random()}`.replace('.', ''),
        inlineStyleRanges: [],
      },
      // @ts-ignore
      entityMap,
    },
    footer: data.footer,
    footer_action: data.footer_action,
  };
};
export interface ContentenRawApiV2 extends ContentRawApi {
  footer_support: string[];
  body_support: string[];
}
const FootActionSupport = ['button', 'text'];
const BodySupport = ['LINK', 'H5LINK', 'ACCOUNT', 'HIGHLIGHT'];
const convertCustomizeTplV2 = (content: string, bakContent: string): ContentRawApi | null => {
  const data = JSON.parse(content) as ContentenRawApiV2;
  const isFooterSupport = (data.footer_support || []).every(type => FootActionSupport.includes(type));
  const isBodySupport = (data.body_support || []).every(type => BodySupport.includes(type));
  if (isFooterSupport && isBodySupport) {
    return convertCustomizeTpl(content);
  }
  return convertAlt(bakContent);
};
// 转换代办数据
interface CustomTodoApi {}
const convertTodo = (content: string, bakContent: string): ContentRawApi | null => {
  const data = JSON.parse(content) as CustomTodoApi;
  const bakData = bakContent ? (JSON.parse(bakContent) as CustomBasicContentApi) : null;
  if (lodashGet(bakData, 'header.length', 0) === 0) {
    return null;
  }
  return {
    header: bakData!.header,
    body: {
      block: {
        text: bakData!.body,
        entityRanges: [],
        key: `${Math.random()}`.replace('.', ''),
        inlineStyleRanges: [],
      },
      entityMap: [],
    },
    footer: bakData!.footer,
  };
};
// 转换通知数据
const convertNotify = (content: string, bakContent: string): ContentRawApi | null => {
  const data = (typeof content === 'string' ? JSON.parse(content) : content) as CustomBasicContentApi;
  if (lodashGet(data, 'header.length', 0) === 0) {
    return null;
  }
  return {
    header: data.header,
    body: {
      block: {
        text: data.body,
        entityRanges: [],
        key: `${Math.random()}`.replace('.', ''),
        inlineStyleRanges: [],
      },
      entityMap: [],
    },
    footer: data.footer,
  };
};
// 转换网盘权限变更
interface CloudAuthorityDataApi {
  from: string;
  to: string;
  to_type: 'UNIT' | 'PERSON';
  target: {
    type: 'file' | 'dir';
    id: string;
    url: string;
    action_url: string;
    name: string;
    ext: string;
  };
  privilege: string[];
}
const convertAuthority = (content: string, bakContent: string): ContentRawApi => {
  const data = JSON.parse(content) as CloudAuthorityDataApi;
  const vars = {
    from: {
      type: 'ACCOUNT',
      text: 'ACCOUNT',
      param: {
        id: data.from,
      },
    },
    to_person: {
      type: 'ACCOUNT',
      text: 'ACCOUNT',
      param: {
        id: data.to,
      },
    },
    to_unit: {
      type: 'UNIT',
      text: 'UNIT',
      param: {
        id: data.to,
      },
    },
    link: {
      type: 'H5LINK',
      text: data.target.name,
      param: {
        pc_url: data.target.url,
        url: data.target.url,
      },
    },
  };
  const tplText = `#{from}给#{${data.to_type === 'UNIT' ? 'to_unit' : 'to_person'}}开通了 ${
    lodashGet(data, 'target.url.length', 0) !== 0 ? '#{link}' : data.target.name
  } 的${data.privilege.join('/')}权限`;
  // 获取到所有的变量
  const reg = /#\{[\w_]+\}/g;
  const totalVars = tplText.match(reg) || [];
  const varKeys = Object.keys(vars);
  const entityRanges: Record<'key' | 'length' | 'offset', number>[] = [];
  const entityMap = varKeys.map(key => vars[key]);
  const text = totalVars.reduce((total, cur) => {
    const key = cur.replace(/#\{([\w_]+)\}/, '$1');
    const { text } = vars[key];
    entityRanges.push({
      key: varKeys.indexOf(key),
      offset: total.split(cur)[0].length,
      length: text.length,
    });
    return total.replace(cur, text);
  }, tplText);
  return {
    header: getIn18Text('QUANXIANBIANGENG'),
    body: {
      block: {
        text,
        entityRanges,
        key: `${Math.random()}`.replace('.', ''),
        inlineStyleRanges: [],
      },
      entityMap,
    },
  };
};
interface MailCardDataApi {
  emoticon_acc_id: string;
  emoticon_name: string;
  email_title: string;
  email_id: string;
  sender_mid: string;
}
const convertMail = (content: string, bakContent: string): ContentRawApi | null => {
  const data = JSON.parse(content) as MailCardDataApi;
  const accountText = 'ACCOUNT';
  const tplText = `${accountText}给你的邮件 ${data.email_title} 点了赞`;
  const entityRanges: Record<'key' | 'length' | 'offset', number>[] = [
    {
      key: 0,
      offset: 0,
      length: accountText.length,
    },
    {
      key: 1,
      offset: tplText.indexOf(data.email_title),
      length: data.email_title.length,
    },
  ];
  const entityMap: ContentEntityApi[] = [
    {
      type: 'ACCOUNT',
      text: 'ACCOUNT',
      param: {
        id: data.emoticon_acc_id,
      },
    },
    {
      type: 'MAIL',
      text: data.email_title,
      param: {
        id: data.sender_mid,
      },
    },
  ];
  return {
    header: getIn18Text('DIANZANTONGZHI'),
    body: {
      block: {
        text: tplText,
        entityRanges,
        key: `${Math.random()}`.replace('.', ''),
        inlineStyleRanges: [],
      },
      entityMap,
    },
  };
};
export const covert = (content: string, bakContent: string, msgType: number) => {
  console.log('[custom]1', content, msgType);
  let convertedContent: ContentRawApi | null = null;
  switch (msgType) {
    // 通知助手(通用文本消息)
    case 1000:
      convertedContent = convertNotify(content, bakContent);
      break;
    // 权限变更
    case 1010:
      convertedContent = convertAuthority(content, bakContent);
      break;
    // 邮件点赞
    case 1001:
      convertedContent = convertMail(content, bakContent);
      break;
    // 代办
    case 1011:
      convertedContent = convertTodo(content, bakContent);
      break;
    // 自定义模板(之后新消息模板都会在这个里面定义)
    case 1012:
      convertedContent = convertCustomizeTpl(content, bakContent);
      break;
    case 1013:
      convertedContent = convertCustomizeTplV2(content, bakContent);
      break;
    default:
      convertedContent = convertAlt(bakContent);
      break;
  }
  return convertedContent;
};
