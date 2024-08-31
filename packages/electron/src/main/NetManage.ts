import { BrowserWindow /* , OnBeforeRequestListenerDetails */ } from 'electron';
// import { callRuleConfig, MyRule, regRuleConfig } from '../declare/InterceptManage';
import path from 'path';
import { webMailBJHost, webMailHZHost, attaPreviewHost, domesticHost, docHost } from 'envDef';
import { AbstractManager } from './abstractManager';
import { fsManage } from './fsManage';
import { CookieStore } from '../declare/AppManage';
import { downloadManage } from './downloadManage';

// import * as fs from 'fs';
const debugNetHandler = true;
const blockWAHeaders = [
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
  'x-content-type-options',
  'x-xss-protection',
  'x-download-options',
  'x-permitted-cross-domain-policies',
  'x-webkit-csp',
  'frame-options',
  'cross-origin',
  'cache-control',
  'pragma',
  'expires',
  'expect-ct',
  'referrer-policy',
];

class NetManage extends AbstractManager {
  // readonly myRule: MyRule = {};

  static readonly filePrefixForWindows = new RegExp('^/?[A-Z]:', 'i');

  readonly urlRegexp: RegExp = /sirius:\/\/sirius.page\/([a-zA-Z0-9_\-/]*).*#([0-9a-z_\-]*)/i;

  webMailHost: string[] = [webMailHZHost + '/*', webMailBJHost + '/*'];

  windowNameSet: Set<string>;

  constructor() {
    super();
    this.windowNameSet = new Set<string>();
    Object.keys(this.winTypeMap).forEach(k => {
      this.windowNameSet.add('/' + k);
      this.windowNameSet.add('/' + k + '/');
    });
    this.windowNameSet.add('/imgPreview/imgPreviewPage');
    this.windowNameSet.add('/imgPreview/imgPreviewPage/');
    if (debugNetHandler) console.log('[net] url map ', this.windowNameSet);
  }

  // regRule(config: regRuleConfig) {
  //   let scheme = config.scheme;
  //   let ruleList = this.myRule[scheme] || [];
  //   if (config.place === 'start') {
  //     let startRule = ruleList.find(item => item.place === 'end');
  //     if (startRule) {
  //       throw new Error(`注册失败！当前${config.scheme}协议，最前部的规则已经注册了!ruleName:${startRule.ruleName}`);
  //     } else {
  //       ruleList.push(config);
  //     }
  //     ruleList.unshift(config);
  //   } else if (config.place === 'end') {
  //     let endRule = ruleList.find(item => item.place === 'end');
  //     if (endRule) {
  //       throw new Error(`注册失败！当前${config.scheme}协议最尾部的规则已经注册了!ruleName:${endRule.ruleName}`);
  //     } else {
  //       ruleList.push(config);
  //     }
  //   } else {
  //     config.place = 'normal';
  //     ruleList.splice(1, 0, config);
  //   }
  //   this.myRule[scheme] = ruleList;
  // }
  //
  // callRule(config: callRuleConfig) {
  //   let scheme = config.scheme;
  //   let ruleList = this.myRule[scheme];
  //   return ruleList.reduce((
  //     url,
  //     ruleConfig,
  //   ) => {
  //     url = ruleConfig.rule(url);
  //     return url;
  //   }, config.url);
  // }

  fileHandler = (request: Electron.ProtocolRequest, callback: (response: string | Electron.ProtocolResponse) => void) => {
    const url = new URL(request.url);
    if (debugNetHandler) console.log('[net] cache protocol used:', request.url);
    if (url.pathname && url.host === 'sirius.page') {
      let visitPath = url.pathname;
      if (!visitPath || !visitPath.trim() || visitPath.trim() === '/') {
        visitPath = '/index.html';
      } else if (this.windowNameSet.has(visitPath)) {
        visitPath += visitPath.endsWith('/') ? 'index.html' : '/index.html';
      }
      // `${__dirname}web/${visitPath}`
      const finalPath = path.normalize(path.join(__dirname, '/web', visitPath));
      if (debugNetHandler) console.log('visit ' + url.pathname, ' to ' + finalPath);
      callback({ path: finalPath });
      return;
    }
    if (url.pathname && url.host === 'sirius.file') {
      console.log('[net] visit ' + url.pathname + ' from file system');
      let visitPath: string;
      try {
        visitPath = decodeURIComponent(url.pathname);
      } catch (ex) {
        visitPath = url.pathname;
      }
      if (NetManage.filePrefixForWindows.test(visitPath)) {
        visitPath = visitPath.replace(/^\//, '');
        // console.log('after trim first path', visitPath);
      }
      visitPath = path.normalize(visitPath);
      if (fsManage.isExist(visitPath)) {
        callback({ path: visitPath });
        return;
      }
      fsManage.writeLog('cacheProtocolFileLoadFailed', { request, visitPath }).then();
    }
    callback({
      path: `${__dirname}/not_found.txt`,
    });
  };

  async getCookieStore(domain?: string, sessionName?: string): Promise<CookieStore[]> {
    const cookieJar = this.getSession(sessionName).cookies;
    const cookieStores = await this.getCookieFromCookieJar(cookieJar, domain);
    // console.log('[electron] get cookies:', cookieStores);
    return cookieStores;
  }

  async setCookieStore(cookies: CookieStore[]): Promise<void> {
    const cookieJar = this.getSession().cookies;
    return this.setCookieToCookieJar({ cookies, cookieJar, url: this.host });
  }

  initNetHandler(sn?: string) {
    const sessionName = sn;
    // const { net } = require('electron')
    if (debugNetHandler) console.log('add electron header interception ' + this.host);
    const filter = {
      urls: [
        this.host + '/*',
        'https://sentry.lx.netease.com/*',
        webMailHZHost + '/*',
        webMailBJHost + '/*',
        attaPreviewHost + '*',
        'https://web.whatsapp.com/*',
        'https://api.whatsapp.com/*',
      ],
    };
    if (this.domesticHost) {
      filter.urls.push(this.domesticHost + '/*');
    }
    // const localRequestFilter = {
    //   urls: [this.host + '/preload.js'],
    // };
    const receiveFilter = {
      urls: ['https://www.gaoding.com/*', ...filter.urls],
    };
    // const webMailRequestFilter = {
    //   urls: ['https://mailhz.qiye.163.com/*', 'https://mail.qiye.163.com/*'],
    // };
    // console.log('--- intercept web mail filter ', this.webMailHost);
    // const defaultSession = session.defaultSession;
    const defaultSession = this.getSession(sessionName);
    const { webRequest } = defaultSession;
    // electron.session.fromPartition()
    // webRequest.onBeforeSendHeaders(webMailRequestFilter, (
    //   details,
    //   callback,
    // ) => {
    //   // if (this.debug) {
    //   console.log('intercept callback ', details);
    //   // }
    // });
    // webRequest.onHeadersReceived(
    //   filter,
    //   (
    //     details,
    //     callback,
    //   ) => {
    //     console.log('intercept callback on header received ', details.url, details.responseHeaders);
    //     callback(details);
    //   },
    // );
    webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      // if (this.debug) {
      // console.log('intercept callback before header send ', details.url);
      // }
      // const requestHeader = details.requestHeaders['Referer'];
      const host = this.domesticHost && details.url.startsWith(this.domesticHost) ? this.domesticHost : this.host;
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        const url = focusedWindow.webContents.getURL();
        const exec = this.urlRegexp.exec(url);
        if (this.debug && exec) {
          // console.log('current page url :', url, exec);
        }
        // if (!requestHeader || requestHeader.startsWith('file://')) {
        if (exec) {
          details.requestHeaders.Referer = host + (exec[1] ? '/' + exec[1] : '') + (exec[2] ? '#' + exec[2] : '');
        } else {
          details.requestHeaders.Referer = host;
        }
        details.requestHeaders.Origin = host;
        // details.requestHeaders['Host'] = this.domain;
        // if (this.debug && debugNetHandler) {
        //   console.log('rewrite referer cookie ', details);
        // }
        // }
      }
      let realSession: string | undefined;
      const requestUrl = details.url;
      const whiteHost = [host, webMailHZHost, webMailBJHost, domesticHost, docHost, attaPreviewHost];
      const isWhiteHost = whiteHost.some(host => requestUrl.startsWith(host));
      if (!isWhiteHost) {
        const UAHeaderName = 'User-Agent';
        const UAStr = details.requestHeaders[UAHeaderName];
        if (UAStr) {
          // 避免iframe嵌入的页面通过UA识别客户端
          const newUAStr = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36';
          details.requestHeaders[UAHeaderName] = newUAStr;
        }
      }

      if (details.url.startsWith('https://web.whatsapp.com') || details.url.startsWith('https://api.whatsapp.com')) {
        const blockHeaders = ['referer', 'sec-fetch-dest'];
        const headers = details.requestHeaders;
        Object.keys(headers).forEach(k => {
          if (blockHeaders.indexOf(k.toLowerCase()) > -1) {
            delete headers[k];
          }
        });
        callback({ requestHeaders: headers });
      } else if (details.url.startsWith('https://sentry.lx.netease.com/')) {
        const cancel = details.url.indexOf('/store') < 0;
        callback({ cancel, requestHeaders: details.requestHeaders });
      } else {
        if (debugNetHandler) console.log('visit url:', details.url);

        realSession = this.getSessioNameByUrl(details.url);

        if (debugNetHandler) console.log('visit session:', sessionName, realSession);
        this.getCookieStore('', realSession || sessionName).then(stores => {
          let tokenCookie: string | undefined;
          let pass2fa = '';
          stores.forEach(it => {
            if (it.name.toLowerCase() === 'qiye_token') {
              tokenCookie = it.value;
            }
            if (it.name.toLowerCase() === 'pass_2fa') {
              pass2fa = it.value;
            }
          });
          if (tokenCookie) {
            // TODO 会改
            details.requestHeaders.QIYE_TOKEN = tokenCookie;
          }
          setTimeout(() => {
            if (details.url.startsWith(host) && details.url.indexOf('domain/') > 0) {
              this.writeLog('__electron_login_send_header2', {
                header: details.requestHeaders,
                url: details.url,
                pass2fa,
                token: tokenCookie,
              }).then();
            }
          }, 100);
          const urlObj = new URL(details.url);
          if (realSession && sn !== realSession) {
            if (debugNetHandler) console.log('build new cookie:', details.url);
            details.requestHeaders.Cookie = this.buildCookieHeader(stores, urlObj.hostname);
          }
          callback({ cancel: false, requestHeaders: details.requestHeaders });
        });
        // setTimeout(() => {
        //   if (details.url.startsWith(this.host) && details.url.indexOf('domain/') > 0) {
        //     this.writeLog('__electron_login_send_header', {header: details.requestHeaders, url: details.url}).then();
        //   }
        // }, 100);
        // callback({ cancel: false, requestHeaders: details.requestHeaders });
      }
    });
    webRequest.onHeadersReceived(receiveFilter, (details, callback) => {
      const curr = Date.now();
      if (details.url.startsWith('https://web.whatsapp.com') || details.url.startsWith('https://api.whatsapp.com')) {
        const headers = details.responseHeaders;
        if (headers) {
          Object.keys(headers).forEach(k => {
            if (blockWAHeaders.indexOf(k.toLowerCase()) > -1) {
              delete headers[k];
            }
          });
          callback({ responseHeaders: headers });
        }
        callback({});
      }
      // 覆盖gaodingSDK的CSP规则，以避开的CSP限制
      if (details.url.startsWith('https://www.gaoding.com')) {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'content-security-policy': [],
            'Content-Security-Policy': [],
          },
        });
      } else {
        // console.log('intercept callback on header received ', details.url, details.responseHeaders ? details.responseHeaders['set-cookie'] : '');
        /**
         * TODO: handle cookie on ourselves
         * 'set-cookie': [
         *     'MAIL_SERVER_TYPE=QIYE_MAIL; Domain=sirius-desktop-web.cowork.netease.com; Path=/; Secure; HttpOnly',
         *     'MAIL_SERVER_LOCATION=hz; Domain=sirius-desktop-web.cowork.netease.com; Path=/; Secure; HttpOnly',
         *     'bh=pre; Domain=.sirius-desktop-web.cowork.netease.com; Path=/'
         *     'ORI_QIYE_SESS=;Domain=.cowork.netease.com;Path=/;Expires=Thu, 1 Jan 1970 08:00:00 +0800',
         *     'QIYE_SESSIONID=v3ACav6KsWKD6pYEi1lGkRUjMBnne3c5;Path=/domain;HttpOnly'
         *   ],
         */
        const urlSessionName = this.getSessioNameByUrl(details.url, '_setsession');
        const setCookieUpCaseHeaderName = 'Set-Cookie';
        if (details.responseHeaders && (details.responseHeaders['set-cookie'] || details.responseHeaders[setCookieUpCaseHeaderName])) {
          const cookies = details.responseHeaders['set-cookie'] || details.responseHeaders[setCookieUpCaseHeaderName];
          const cookieSession = urlSessionName ? this.getSession(urlSessionName) : defaultSession;
          try {
            if (details.responseHeaders['set-cookie']) {
              details.responseHeaders['set-cookie'] = [];
            }
            if (details.responseHeaders[setCookieUpCaseHeaderName]) {
              details.responseHeaders[setCookieUpCaseHeaderName] = [];
            }
          } catch (ex: any) {
            this.writeLog('delete-set-cookie-catch', {
              message: ex && ex.message,
            });
          }

          this.handleSessionCookieReceived(cookieSession, cookies, details.url).then(() => {
            callback(details);
            setTimeout(() => {
              this.writeLog('__electron_set_cookie_time', { cookies, url: details.url, time: Date.now() - curr }).then();
            }, 100);
          });
        } else {
          callback(details);
        }
      }
    });
    // webRequest.onBeforeRequest(
    //   localRequestFilter,
    //   (
    //     it: OnBeforeRequestListenerDetails,
    //     callback,
    //   ) => {
    //     // console.log('before send requet:', it);
    //     callback(
    //       {
    //         redirectURL: 'file:///preload.js',
    //       });
    //   },
    // );
    // webRequest.onBeforeRequest((detail,callback)=>{
    //
    // })
    const finalSessionName = sessionName || this.defaultSessionName;
    if (!AbstractManager.downloadSessionSet.has(finalSessionName)) {
      defaultSession.on('will-download', downloadManage.listenerDownload);
      AbstractManager.downloadSessionSet.add(finalSessionName);
    }
  }

  private getSessioNameByUrl(url: string, sessionKey: string = '_session') {
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
      this.writeLog('getSessioNameByUrl-error', { message: ex.message });
      return DEFAULT_SESSION;
    }
  }

  initFileIntercept(sessionName?: string) {
    if (debugNetHandler) console.log('[protocol] add protocol for launch ');
    const defaultSession = this.getSession(sessionName);
    const { protocol } = defaultSession;
    protocol.registerFileProtocol('cache', this.fileHandler.bind(this));

    protocol.registerFileProtocol('sirius', this.fileHandler.bind(this));
    this.initNetHandler(sessionName);
    // protocol.interceptFileProtocol(
    //   'file',
    //   (
    //     request,
    //     callback,
    //   ) => {
    //     let url = request.url.substr(7)
    //       .replace(/\?.*$/, '')
    //       .replace(/#.*$/ig, '')
    //     ;
    //     url = path.join(decodeURIComponent(url)).replace(/\\/g, '/');
    //     url = this.callRule({
    //       scheme: 'file',
    //       url: url,
    //     });
    //     console.log(request.url, url);
    //     fsManage.writeLog('path_resolve', { origin: request.url, current: url }).then();
    //     callback({
    //       path: path.normalize(url),
    //     });
    //   },
    // );
  }

  private async handleSessionCookieReceived(defaultSession: Electron.Session, cookies: string[], url: string) {
    const cookieStore: CookieStore[] = this.parseCookie(cookies);
    await this.setCookieToCookieJar({
      cookies: cookieStore,
      cookieJar: defaultSession.cookies,
      url,
      noLog: !this.debug,
    });
  }

  private parseCookie(cookies: string[]) {
    const cookieStore: CookieStore[] = [];
    if (cookies && cookies.length > 0) {
      cookies.forEach(it => {
        const cookieItem = this.parseCookieItem(it);
        if (cookieItem && cookieItem.name) {
          cookieStore.push(cookieItem);
        }
      });
    }
    return cookieStore;
  }

  private parseCookieItem(it: string) {
    const ret = {
      sameSite: 'no_restriction',
      secure: true,
    } as CookieStore;
    if (it && it.length > 1) {
      const cookiePattern = /([a-z0-9A-Z_\-.$*\\%;]+)=([^;]*)(?:;|$)/gi;
      let start = 0;
      while (start < it.length) {
        // cookiePattern.lastIndex = start;
        const re = cookiePattern.exec(it);
        if (re) {
          if (start === 0) {
            ret.name = re[1];
            ret.value = re[2];
          } else {
            const k = re[1].toLowerCase();
            if (k === 'domain') {
              ret.domain = re[2];
            } else if (k === 'expires') {
              try {
                ret.expirationDate = Date.parse(re[2]);
              } catch (e) {
                console.warn('parse cookie date error ', e);
                ret.expirationStr = re[2];
              }
            } else if (k === 'path') {
              ret.path = re[2];
            }
          }
          if (re[0].length === 0) {
            break;
          }
          start = cookiePattern.lastIndex;
        } else {
          break;
        }
      }
      if (ret.name && AbstractManager.cookieNameNeedPreserve.has(ret.name.toLowerCase())) {
        if (ret.expirationDate === undefined) {
          ret.expirationDate = Math.round(Date.now() / 1000) + (AbstractManager.cookieNameNeedPreserve.get(ret.name.toLowerCase()) || this.authCookieExpiredTime);
        }
      }
      if (debugNetHandler) {
        console.log('cookie parsed:' + it, ret);
      }
    }
    return ret;
  }

  private buildCookieHeader(stores: CookieStore[], hostname: string) {
    let ret = '';
    const set: Set<string> = new Set();
    console.log('build new cookie called:', stores.length, hostname);
    stores.forEach(it => {
      if (it.domain /* && hostname.indexOf(it.domain) >= 0 */ && !set.has(it.name)) {
        ret += it.name + '=' + it.value + '; ';
        set.add(it.name);
      }
    });
    console.log('build new cookie result:', ret);
    return ret;
  }
}

export const interceptManage = new NetManage();
