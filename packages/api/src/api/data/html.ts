import { Api } from '../_base/api';
import { StringMap } from '../commonModel';

export type HtmlTransfer = (el: HTMLElement, config?: Map<string, any>) => ElementOperation;

export type HtmlOperation = 'remove' | 'replace' | 'wrapAndReplace' | 'append' | 'prepend' | 'none';

export type Protocol = 'http' | 'https' | 'file';

export type URLParsed = {
  url: string;
  protocol?: Protocol;
  domain?: string;
  port?: number;
  path: string;
  query?: string;
  parsedQuery?: Map<string, string[]>;
  hash?: string;
};

export interface ElementOperation {
  op: HtmlOperation;
  el?: Element;
  newEl?: Element[];
}

/**
 * 数据存储API
 */
export interface HtmlApi extends Api {
  transferHtml(html: string | Document | Element, transfer: HtmlTransfer, config?: Map<string, any>): string;

  parseHtml(html: string): Document;

  encodeHtml(content: string): string;

  decodeHtml(content: string): string;

  parseUrl(url: string): URLParsed | undefined;

  generateElStr(el: Document): string;

  parseUrlQuery(url: string): StringMap;

  mergeHtmlStr(prefixHtml: string, suffixHtml: string): string;
}
