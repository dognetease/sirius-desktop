import { inWindow } from '@/config';

enum Browser {
  SAFARI = 'safari',
  CHROME = 'chrome',
  FIREFOX = 'firefox',
  EDGE = 'edge',
  OPERA = 'opera',
  IE = 'ie',
  POPO = 'popo',
  WEIXIN = 'micromessenger',
  MAIL_MASTER = 'MailMaster',
  SIRIUS = 'sirius',
}

enum OS {
  ANDROID = 'android',
  IOS = 'ios',
  MAC_OS = 'macos',
  WINDOWS = 'windows',
  FIREFOX_OS = 'firefoxos',
}

/**
 * Browser matching rules
 * @type {Array}
 */
const BROWSER_RULES = [
  [Browser.POPO, /Mobile.*\/.*POPO/],
  [Browser.WEIXIN, /Mobile.*\/.*MicroMessenger/],
  [Browser.MAIL_MASTER, /Mobile.*\/.*MailMaster/],
  [Browser.SIRIUS, /Mobile.*\/.*Sirius/],
  [Browser.EDGE, /Edge\/([0-9._]+)/],
  [Browser.CHROME, /(?!Chrom.*OPR)(Chrom(?:e|ium)|CriOS)\/([0-9.]+)(:?\s|$)/],
  [Browser.FIREFOX, /Firefox\/([0-9.]+)(?:\s|$)/],
  [Browser.OPERA, /Opera\/([0-9.]+)(?:\s|$)/],
  [Browser.OPERA, /OPR\/([0-9.]+)(:?\s|$)$/],
  [Browser.IE, /Trident\/7\.0.*rv:([0-9.]+)\).*Gecko$/],
  [Browser.IE, /MSIE\s([0-9.]+);.*Trident\/[4-7].0/],
  [Browser.IE, /MSIE\s(7\.0)/],
  [Browser.SAFARI, /Version\/([0-9._]+).*Safari/],
];
/**
 * Operating system matching rules.
 * @type {Array}
 */
const OS_RULES = [
  [OS.IOS, /os ([._\d]+) like mac os/i],
  [OS.MAC_OS, /mac os x/i],
  [OS.ANDROID, /android/i],
  [OS.FIREFOX_OS, /mozilla\/[a-z._\d]+ \((?:mobile)|(?:tablet)/i],
  [OS.WINDOWS, /windows\s*(?:nt)?\s*[._\d]*/i],
];

class Platform {
  browser?: string;

  os?: string;

  constructor() {
    if (inWindow()) {
      this.browser = this._browser;
      this.os = this._os;
    }
  }

  private get _browser() {
    return this.getBrowserName();
  }

  private get _os() {
    return this.getOSName();
  }

  public getBrowserName(): Browser | undefined {
    for (const [name, regexp] of BROWSER_RULES) {
      if ((regexp as RegExp).test(window.navigator.userAgent)) {
        return name as Browser;
      }
    }
    return undefined;
  }

  public getOSName(): OS | undefined {
    for (const [name, regexp] of OS_RULES) {
      if ((regexp as RegExp).test(window.navigator.userAgent)) {
        return name as OS;
      }
    }
    return undefined;
  }

  public isSafari() {
    return this.browser === Browser.SAFARI;
  }

  public isChrome() {
    return this.browser === Browser.CHROME;
  }

  public isAndroid() {
    return this.os === OS.ANDROID;
  }

  public isIOS() {
    return this.os === OS.IOS;
  }

  public isMac() {
    return this.os === OS.MAC_OS;
  }

  public isWindows() {
    return this.os === OS.WINDOWS;
  }

  public isMobile() {
    return this.isAndroid() || this.isIOS();
  }

  public isPOPO() {
    return this.browser === Browser.POPO;
  }

  public isWeixin() {
    return this.browser === Browser.WEIXIN;
  }

  public isMailMaster() {
    return this.browser === Browser.MAIL_MASTER;
  }

  public isElectron() {
    return /electron/i.test(window.navigator.userAgent);
  }

  public getMobileApp(): string {
    const app = [Browser.POPO, Browser.WEIXIN, Browser.SIRIUS, Browser.CHROME, Browser.SAFARI].find(browser => this.browser === browser);
    return app === Browser.WEIXIN ? 'weixin' : app ?? 'other';
  }

  public isIPhoneX() {
    return navigator.userAgent.toLowerCase().indexOf('iphone') > -1 && window.screen.height >= 812 && window.devicePixelRatio >= 2;
  }

  public isSirius() {
    return this.browser === Browser.SIRIUS;
  }

  public isSiriusMobile() {
    if (this.isSirius()) {
      return true;
    }

    if (this.isSafari() || this.isChrome() || this.isWeixin() || this.isMailMaster()) {
      return false;
    }
    return true;
  }
}

const platform = new Platform();

export { platform, Platform };
