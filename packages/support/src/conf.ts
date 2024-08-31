export type dataStore = { [k: string]: string | string[] | BlackUrlList };
export type envType =
  | 'dev'
  | 'test'
  | 'test1'
  | 'test2'
  | 'test_prod'
  | 'prod'
  | 'prod_portal'
  | 'prev'
  | 'local'
  | 'edm_test'
  | 'edm_test1'
  | 'edm_prod'
  | 'edm_dev'
  | 'edm_prev'
  | 'local2'
  | 'webmail_test'
  | 'webmail_prod'
  | 'edm_test_prod'
  | 'webedm_test'
  | 'webedm_prod'
  | 'webedm_dev'
  | 'webedm_pre'
  | 'ffmsedm_test'
  | 'ffmsedm_prod'
  | 'ffmsedm_pre';

export interface BlackUrlList {
  [key: string]: boolean;
}
export type EnvDefItem =
  | {
      /**
       * 默认访问的host
       */
      host: string;
      domesticHost?: string;
      /**
       * 云文档的host,会额外set cookie
       */
      diskHost: string;
      domesticDiskHost?: string;
      docHost: string;
      domesticDocHost?: string;
      attaPreviewHost: string;
      domesticAttaPreviewHost?: string;
      // 帮助中心host
      helpCenterHost?: string;
      // 官网 host
      officialWebsiteHost?: string;
      /**
       * 默认host的domain,设置cookie时使用
       */
      domain: string;
      /**
       * 云信im id
       */
      NIMSID: string;
      /**
       * 哈勃打点平台所需的windows的appKey
       */
      HubbleWinKey: string;
      /**
       * 哈勃打点平台所需的mac的appKey
       */
      HubbleMacKey: string;
      /**
       * 哈勃打点平台所需的web平台的appKey
       */
      HubbleWebKey: string;
      /**
       * 哈勃打点平台所需的windows的appKey
       */
      OxpeckerWinKey: string;
      /**
       * 哈勃打点平台所需的mac的appKey
       */
      OxpeckerMacKey: string;
      /**
       * 哈勃打点平台所需的web平台的appKey
       */
      OxpeckerWebKey: string;

      script: (dt: dataStore) => string[];
      /**
       * 版本号
       */
      version?: string;
      /**
       * 是否启动调试，true将自动打开调试窗口
       */
      debug: string;
      /**
       * 调试环境取消重登录机制
       */
      disableReLogin: string;
      /**
       * 构建用参数，true表示打包windows的免安装版本
       */
      electronWinPortal?: string;
      /**
       * 当前profile的场景, 用于区分应用行为，local是本地环境，dev是测试环境，test是测试环境，prev是预发环境，prod是线上环境
       */
      stage: 'local' | 'dev' | 'test' | 'prev' | 'prod' | 'test_prod';
      webMailHZUrl: string;
      webMailHZHost: string;
      webMailBJUrl: string;
      webMailBJHost: string;
      /**
       * 应用的前置路径，访问静态资源需添加
       */
      contextPath?: string;
      /**
       * 接口请求的前置路径，类似contextPath，部署时可设置此属性，以便于区分于既有服务
       */
      apiContextPath?: string;

      loginPage?: string;
      mloginPage?: string;
      loginPageExt?: string;
      // getVersion :()=>string;
      productName?: string;
      // https://lingxi.office.163.com/doc/#id=19000003516951&from=QIYE&parentResourceId=19000002334006&spaceId=3993514&ref=515262669
      lxTrafficLabel?: string;
      reportSecretKey?: string;
    }
  | Record<string, string>;

const replacerUpper = (_: string, p1: string) => p1.toUpperCase();
export const pascalToCamel = (str: string) => str.replace(/_([a-zA-Z0-9])/g, replacerUpper);
const replacerLower = (match: string) => '_' + match.toLowerCase();
export const camelToPascal = (str: string) => str.replace(/[A-Z]/g, replacerLower);
export type EnvDef = Record<envType, EnvDefItem>;
