import { config } from 'env_def';
import { inWindow } from '@/config';

const contextPath = config('contextPath') as string;

export interface LocationHelper {
  /**
   * 测试路径是否匹配目标
   * @param key 要匹配的目标字符串
   * @param matchExactly 必须完全一致，传入false或不传则表示只要路径中包含该目标串即算匹配成功
   * @param location location对象，不传则适用window.location
   */
  testPathMatch(key: string, matchExactly?: boolean, location?: Location): boolean;
  buildStaticUrl(path: string, hash?: Map<string, string>, param?: Map<string, string>): string;

  isMainPage(): boolean;

  isBkPage(): boolean;

  isFrontPage(): boolean;

  isReadMail(): boolean;

  isJumpPage(): boolean;

  testHrefMatch(key: string, matchExactly?: boolean, location?: Location): boolean;

  getHost(): string;

  getHash(): string | undefined;

  getProtocol(): string;

  getParam(key: string): string | undefined;

  getSessioNameByUrl(url: string, sessionKey?: string): string;
}

class LocationHelperImpl implements LocationHelper {
  buildStaticUrl(path: string, hash?: Map<string, string>, param?: Map<string, string>): string {
    let paramStr = '';
    let hashStr = '';
    const urlPath = contextPath + path;
    if (param && param.size > 0) {
      paramStr = '?' + this.buildUrlParamFromMap(param);
    }
    if (hash && hash.size > 0) {
      hashStr = '#' + this.buildUrlParamFromMap(hash);
    }
    return urlPath + paramStr + hashStr;
  }

  testPathMatch(key: string, matchExactly?: boolean, location?: Location): boolean {
    if (!inWindow()) return false;
    const loc = location || window.location;
    const urlPath: string = loc.pathname.replace(contextPath, '').replace(/index\.html$/i, '');
    if (key === '/') {
      return urlPath === '/';
    }
    return matchExactly ? urlPath === key : urlPath.indexOf(key) >= 0;
  }

  testHrefMatch(key: string, matchExactly?: boolean, location?: Location) {
    if (!inWindow()) return false;
    const loc = location || window.location;
    return matchExactly ? loc.href === key : loc.href.indexOf(key) >= 0;
  }

  private buildUrlParamFromMap(param: Map<string, string>) {
    let result = '';
    param.forEach((k, v) => {
      result += k + '=' + encodeURIComponent(v) + '&';
    });
    return result;
  }

  getParam(key: string): string | undefined {
    if (!inWindow()) return undefined;
    const search = new URLSearchParams(window.location.search);
    return search.has(key) && search.get(key) ? (search.get(key) as string) : undefined;
  }

  getHost(): string {
    if (!inWindow()) return '';
    return window.location.host;
  }

  getHash(): string | undefined {
    if (inWindow()) {
      const routeWithoutHash = window.location.hash.replace(/^#/, '');
      if (routeWithoutHash) return window.encodeURIComponent(routeWithoutHash);
    }
    return undefined;
  }

  getSessioNameByUrl(url: string, sessionKey = '_session') {
    const DEFAULT_SESSION = '';
    try {
      if (!url || !url.length) return DEFAULT_SESSION;
      const urlObj = new URL(url);
      if (urlObj.search) {
        const params = new URLSearchParams(urlObj.search);
        if (params.has(sessionKey)) {
          return params.get(sessionKey) || DEFAULT_SESSION;
        }
      }
      return DEFAULT_SESSION;
    } catch (ex: any) {
      // this.writeLog('getSessioNameByUrl-error', { message: ex.message });
      return DEFAULT_SESSION;
    }
  }

  getProtocol(): string {
    if (!inWindow()) return '';
    return window.location.protocol + '//';
  }

  isMainPage(): boolean {
    return this.testPathMatch('/');
  }

  isBkPage(): boolean {
    return this.testPathMatch('/api_data_init');
  }

  isReadMail(): boolean {
    return this.testPathMatch('/readMail/');
  }

  isJumpPage(): boolean {
    return this.testPathMatch('/jump');
  }

  isFrontPage(): boolean {
    if (!inWindow()) {
      return false;
    }
    // return !window.isAccountBg && !window.isBridgeWorker;
    return !window.isBridgeWorker;
  }
}

export const locationHelper = new LocationHelperImpl() as LocationHelper;
