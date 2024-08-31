import { decode, encode } from 'html-entities';
import { config } from 'env_def';
import { apis } from '../../../config';
import { api } from '../../../api/api';
import { SystemApi } from '../../../api/system/system';
import { DataStoreApi } from '../../../api/data/store';
import { ElementOperation, HtmlApi, HtmlTransfer, URLParsed } from '../../../api/data/html';
import { StringMap } from '../../../api/commonModel';

interface extendElement extends Element {
  innerText: string;
}

// type TransferHandler

class HtmlImplApi implements HtmlApi {
  name: string;

  systemApi: SystemApi;

  storeApi: DataStoreApi;

  readonly currentURL = new URL(config('host') as string);

  static readonly UrlPattern = /^((?:https?)|(?:file)|(?:mailto)):\/\/([a-z0-9_\-.]{0,256})(:[0-9]{2,5})?\/([a-z0-9_\-.\/]*)(?:\?([^#?\\\/]+))?(?:#([^\s]*))?$/i;

  // const parseQuery(query:string):{}{
  //
  // }

  constructor() {
    this.name = apis.htmlApi;
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
  }

  // eslint-disable-next-line class-methods-use-this
  private getNodesAttributes(node: Element) {
    try {
      const attrubutes = Array.from(node.attributes).reduce((acc, attribute) => {
        acc[attribute.name] = attribute.value;
        return acc;
      }, {} as { [key: string]: string });
      return JSON.stringify(attrubutes);
    } catch (error) {
      return '';
    }
  }

  /**
   * 删除 类链表节点中的重复节点
   * head -> 1 -> 1 -> 1 -> 1 -> multiNode
   * head -> multiNode
   * @param head
   * @returns
   */
  private removeRepeatedNode(head: Element): void {
    try {
      if (head === undefined || head.children.length !== 1) return;
      let curNode = head;
      while (curNode !== undefined && curNode.children.length === 1) {
        const nextNode = curNode.children[0];
        if (this.getNodesAttributes(curNode) === this.getNodesAttributes(nextNode)) {
          curNode = curNode.children[0];
        } else {
          break;
        }
      }
      if (head !== curNode) head.replaceChildren(curNode);
    } catch (error) {
      console.log('removeRepeatedNode', error);
    }
  }

  /**
   *  bfs 处理每个元素
   * @param root
   * @returns
   */
  removeDummyNodes(root: Element): void {
    try {
      const queue = [root];
      while (queue.length > 0) {
        const node = queue.shift();
        if (node === undefined) break;
        this.removeRepeatedNode(node);
        // eslint-disable-next-line
        for (const child of Array.from(node.children)) {
          queue.push(child);
        }
      }
    } catch (error) {
      console.log('bfs parse error:', error);
    }
  }

  parseUrl(url: string): URLParsed | undefined {
    const exec = HtmlImplApi.UrlPattern.exec(url);
    if (exec) {
      const [whole, protocol, domain, port, path, query, hash] = exec;
      return {
        url: whole,
        protocol,
        domain,
        port: Number(port),
        path,
        query,
        hash,
      } as URLParsed;
    }
    return undefined;
  }

  init(): string {
    return this.name;
  }

  encodeHtml(content: string): string {
    return encode(content, { level: 'html5' });
  }

  decodeHtml(content: string): string {
    return decode(content, { level: 'html5' });
  }

  parseHtml(html: string): Document {
    const a = Date.now();
    console.time(`parseHtml.${a} duration`);
    const parser: DOMParser = new DOMParser();
    const result = parser.parseFromString(html, 'text/html');
    console.timeEnd(`parseHtml.${a} duration`);
    return result;
  }

  /**
   * html字符串合并
   * @param prefixHtml 前置html
   * @param suffixHtml 后置html
   * @returns
   */
  mergeHtmlStr(prefixHtml: string, suffixHtml: string): string {
    if (!/\<\s*\/\s*body\s*\>|\<\s*\/\s*html\s*\>/gi.test(prefixHtml + suffixHtml)) {
      // 两个html都没有body或者html包裹时，直接拼接
      return prefixHtml + suffixHtml;
    }
    const originDom = this.parseHtml(prefixHtml);
    const appendDom = this.parseHtml(suffixHtml);
    const originBody = originDom.body;
    const appendBody = appendDom.body;
    const fragment = document.createDocumentFragment();
    if (prefixHtml) {
      // 为了防止在编辑器里面莫名其妙多一个空行，就做一个判断。其他都是lujiajian 代码，有事找他
      fragment.appendChild(document.createElement('div')); // 分割两个html，防止样式重叠
    }
    Array.prototype.slice.call(appendBody.childNodes).forEach(_ => {
      fragment.appendChild(_);
    });
    originBody.appendChild(fragment);
    const resultDomStr = originDom.documentElement.outerHTML;
    return resultDomStr;
  }

  transferHtml(html: string | Document | Element, transfer: HtmlTransfer, config?: Map<string, any>): string {
    let element;
    if (typeof html === 'string') {
      const document = this.parseHtml(html);
      element = document.documentElement;
    } else if (typeof html === 'object' && html instanceof Document) {
      element = html.documentElement;
    } else if (typeof html === 'object' && html instanceof Element) {
      element = html;
    }
    if (!element) return '';
    // 删除嵌套重复节点
    // this.removeDummyNodes(element);
    this.walkElementTree(element, transfer, config);
    return element.innerHTML;
  }
  private walkElementTree(parent: Element, transfer: HtmlTransfer, config?: Map<string, any>, depth = 0) {
    if (parent.children && parent.childElementCount > 0) {
      const childrenArr = Array.from(parent.children || []);
      // 只遍历前5000个
      Object.keys(childrenArr.splice(0, 5000)).forEach(k => {
        const idOfC = Number(k);
        if (Object.prototype.hasOwnProperty.apply(parent.children, [idOfC]) && parent.children[idOfC]) {
          let el: HTMLElement | undefined = parent.children[idOfC] as HTMLElement;
          // 当 DOM 树的深度大于 1280，就舍弃它吧，因为过深的层级，会导致 windows 系统下，应用直接 crash
          if (depth > 1280) {
            const { ownerDocument } = parent;
            if (ownerDocument) {
              const newEl = ownerDocument.createElement('div');
              newEl.insertAdjacentText('afterbegin', el.innerText);
              parent.replaceChild(newEl, el);
            } else {
              parent.removeChild(el);
              el = undefined;
            }
            return;
          }
          let operation: ElementOperation | null = null;
          try {
            operation = transfer(el, config);
          } catch (e) {
            console.error('[html transfer error]', e);
          }
          if (operation) {
            if (operation.op === 'remove') {
              // parent.replaceChild(operation.el, el);
              parent.removeChild(el);
              el = undefined;
            }
            if (operation.op === 'replace' && operation.el && el) {
              parent.replaceChild(operation.el, el);
              // parent.removeChild(el);
              el = undefined;
            } else if (operation.op === 'wrapAndReplace' && operation.el && el) {
              operation.el.append(el);
              parent.replaceChild(operation.el, el);
              el = operation.el as HTMLElement;
            } else if (el && (operation.op === 'append' || operation.op === 'prepend') && operation.newEl && operation.newEl.length > 0) {
              operation.newEl.forEach(it => {
                if (operation) {
                  if (operation.op === 'append') {
                    el!.append(it);
                  } else {
                    el!.prepend(it);
                  }
                }
              });
            }
          }
          if (el) {
            this.walkElementTree(el, transfer, config, depth + 1);
          }
        }
      });
    }
  }

  // 生成元素字符串
  generateElStr(doc: Document): string {
    let str = '';
    // 被跳过/过滤的id
    const filteredIds = ['lingxi-signature-block'];

    function loopEl(el: Element) {
      const { localName, attributes, innerText, children, id } = el as extendElement;
      if (filteredIds.includes(id)) return;
      // body 清除空格
      const text = ['body'].includes(localName) ? innerText.replace(/\n/g, '') : innerText;
      str += ` tag:${localName} innerText:${text}`;
      // 被过滤的属性
      const filteredAttrs = ['style'];
      attributes &&
        Array.from(attributes).forEach(attr => {
          if (!filteredAttrs.includes(attr.name)) {
            str += ` ${attr.name}:${attr.value}`;
          }
        });
      children &&
        Array.from(children).forEach(child => {
          loopEl(child);
        });
    }

    loopEl(doc.body);
    return str;
  }

  // concatHtml(html:string,addition:string){
  //   const document = this.parseHtml(html);
  //   document.querySelector('body');
  // }

  parseUrlQuery(urlInput: string): StringMap {
    let url = urlInput;
    const ret: StringMap = {};
    try {
      if (url && url.length > 2) {
        if (url.startsWith('//')) {
          url = this.currentURL.protocol + url;
        } else if (url.startsWith('/')) {
          url = this.currentURL.origin + url;
        }
        const urlLower = url.toLowerCase();
        if (urlLower.startsWith('http')) {
          const parsedUrl = new URL(url);
          const { search } = parsedUrl;
          const searchParams = new URLSearchParams(search);
          searchParams.forEach((v, k) => {
            ret[k] = v;
          });
        }
        // const pattern = /([a-z0-9A-Z_\-%:]+)=([^&=]*)/ig;
        // // let start=0;
        // let exec;
        // while ((exec = pattern.exec(url))) {
        //   if (exec[1]) {
        //     ret[exec[1]] = exec[2];
        //   }
        // }
      }
      return ret;
    } catch (e) {
      console.error('[parseUrlQuery error]', e);
      return ret;
    }
  }
}

const htmlApi: HtmlImplApi = new HtmlImplApi();

api.registerLogicalApi(htmlApi);

export default htmlApi;
