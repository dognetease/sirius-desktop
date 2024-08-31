import { apiHolder, SystemApi, inWindow, locationHelper, emailPattern as emailPatternApi } from 'api';
import { Moment } from 'moment';
import { getMainContOffsetTopHeight } from './waimao';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;

const isElectron = apiHolder.env.forElectron;
/**
 * 客户端顶部功能栏高度
 * $electron-title-bar-height:32px;
 */
export const ELECTRON_TITLE_FIX_HEIGHT = 32;

export const WEB_TITLE_FIX_HEIGHT = 46;

/**
 * 客户端侧边栏宽度
 * $side-bar-width:68px;
 */
export const SIDE_BAR_WIDTH = 68;

export const TOOL_BAR_HEIGHT = 47;

export const isImageWindow = () => {
  if (inWindow()) {
    return locationHelper.testPathMatch('imgPreviewPage');
  }
  return false;
};

export const isTabWindow = () => {
  if (inWindow()) {
    // const { pathname } = window.location;
    return locationHelper.testPathMatch('resources') || locationHelper.testPathMatch('attachment_preview');
  }
  return false;
};

export const isMainWindow = () => {
  if (inWindow()) {
    // return window.location.pathname === '/' || window.location.pathname === '/index' || window.location.pathname === '/index.html' || isImageWindow() || isTabWindow();
    return locationHelper.isMainPage() || isImageWindow() || isTabWindow();
  }
  return false;
};
/**
 * iframe方式访问云文档url情况下：
 * 需要对url 进行统一处理新增参数如下：
 * * sirius 版本号
 * @param url 完整的url路径
 */
export const getDocURL = (url: string) => {
  return new UrlProcessor(url).use(addSiriusVersion).use(addHomeUrl).getUrl();
};

class UrlProcessor {
  url: string;
  constructor(url: string) {
    this.url = url;
  }
  public use(processor: (url: string) => string) {
    this.url = processor(this.url);
    return this;
  }
  public getUrl() {
    return this.url;
  }
}

// 增加 homeUrl 参数。即 sirius host
export const addHomeUrl = (url: string) => {
  try {
    if (inWindow()) {
      const homeUrl = window.location.origin;
      const urlObj = new URL(url);
      urlObj.searchParams.set('homeUrl', homeUrl);
      return urlObj.toString();
    }
  } catch (e) {
    console.debug('addHomeUrl error', e);
  }
  return url;
};

// 增加sirius版本号
export const addSiriusVersion = (url: string) => {
  if (inWindow()) {
    const urlObj = new URL(url);
    /**
     * 假设正式版本：1.9.0
     * 测试包的版本号为 0.19.0-1644560454769
     * 因此需要将 0.19.0-1644560454769 转为 1.9.0-1644560454769
     * **目前仅支持大版本号为1位数字**。
     */
    let siriusVersion = window.siriusVersion.replace(/^0\.(\d)/, '$1.');

    // 外贸版灵犀办公 版本获取
    if (process.env.BUILD_ISEDM) {
      /**
       * 如果办公正式版本号是 1.9.0
       * 则外贸邮正式版本号是 0.190.x
       * 注意：大版本号 中版本号 默认是1位数字，如果是2+位数字，这里处理将会失效
       */
      const matcher = window.siriusVersion.match(/^\d\.(\d+)/);
      if (matcher) {
        const version = matcher[1];
        siriusVersion = version.replace(/^(\d)(\d)(\d*)/, '$1.$2.$3');
      } else {
        siriusVersion = '0.0.0';
      }
    }

    urlObj.searchParams.set('siriusVersion', siriusVersion);
    return urlObj.toString();
  }
  return url;
};

export const isWebPage = () => {
  if (inWindow()) {
    return locationHelper.testPathMatch('/share/');
  }
  return false;
};

/**
 * 获取需要兼容的高度
 * @returns number
 */
export const getBodyFixHeight = (electronNeedFixHeight?: boolean, webNeedFixHeight?: boolean, webWmNeedFixHeight?: boolean) => {
  if (systemApi.isElectron()) {
    // electron 有titlebar的窗口
    if (isMainWindow()) {
      // electron 多页签窗口
      if (isTabWindow()) {
        return 0;
      }
      const isWin = !window.electronLib.env.isMac;
      return electronNeedFixHeight && isWin ? ELECTRON_TITLE_FIX_HEIGHT : 0;
    }
    // electron 其他窗口 ?? 逻辑可能有问题，需重新判断其他窗口调用这个方法时需要什么值
    return electronNeedFixHeight ? 0 : ELECTRON_TITLE_FIX_HEIGHT;
  }
  if (systemApi.isWebWmEntry()) {
    return webWmNeedFixHeight && systemApi.isMainPage() ? getMainContOffsetTopHeight() : 0;
  }
  // web 主页面
  if (systemApi.isMainPage()) {
    return webNeedFixHeight && !process.env.BUILD_ISEDM ? WEB_TITLE_FIX_HEIGHT : 0;
  }
  // web 其他窗口
  return 0;
};

export const getModalWrapperFixedClassName = () => (isElectron ? 'sirius-modal-wrapper' : '');

export const PAGE_MIN_HEIGHT = 608 - getBodyFixHeight(false, true);

export const SIDE_LAYOUT_WIDTHS = [60, 200, 264, 500];

export const [SIDE_BAR, FIR_SIDE, SEC_SIDE, REST_SIDE] = SIDE_LAYOUT_WIDTHS;

export const timeZoneMap: Record<string, string> = {
  '+00:00': '零时区：伦敦',
  '+01:00': '东一区：罗马，巴黎',
  '+02:00': '东二区：雅典、以色列',
  '+03:00': '东三区：莫斯科，科威特',
  '+04:00': '东四区：喀布尔',
  '+05:00': '东五区：伊斯兰堡，卡拉奇',
  '+06:00': '东六区：阿拉木图，科伦坡',
  '+07:00': '东七区：曼谷，雅加达',
  '+08:00': '东八区：北京，香港，台湾',
  '+09:00': '东九区：东京',
  '+10:00': '东十区：悉尼',
  '+11:00': '东十一区：霍尼亚拉，马加丹',
  '+12:00': '东西十二区：奥克兰',
  '-01:00': '西一区：佛得角群岛',
  '-02:00': '西二区：协调世界时',
  '-03:00': '西三区：巴西利亚',
  '-04:00': '西四区：加拿大，加拉加斯',
  '-05:00': '西五区：纽约，华盛顿，波士顿',
  '-06:00': '西六区：芝加哥，休斯顿，亚特兰大',
  '-07:00': '西七区：盐湖城、丹佛、凤凰城',
  '-08:00': '西八区：洛杉矶，旧金山',
  '-09:00': '西九区：阿拉斯加',
  '-10:00': '西十区：夏威夷',
  '-11:00': '西十一区：帕果帕果，阿洛菲',
};

const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export const getWeekdayWithTimeZoneOffset = (date: Moment, offset?: string) => {
  const dayIndex = date.utcOffset(offset || '+08:00').weekday();

  return dayNames[dayIndex];
};

export const ProductProtocols = {
  agreement: `https://qiye.163.com/sirius/agreement${process.env.BUILD_ISEDM ? '_waimao' : ''}/index.html`,
  privacy: `https://qiye.163.com/sirius/privacy${process.env.BUILD_ISEDM ? '_waimao' : ''}/index.html`,
  ICP: 'https://beian.miit.gov.cn/',
};

// 邮箱格式检测正则
export const emailPattern = emailPatternApi;

export const getSideBarWidth = () => {
  return systemApi.isWebWmEntry() ? 0 : SIDE_BAR_WIDTH;
};
