const path = require('path');
const childProcess = require('child_process');
const ssrRemoveUtils = require('./ssr-remove/add-ssr-remove.js');

const emptyTsxPath = path.join(__dirname, 'empty.tsx');
const emptyEsPath = path.join(__dirname, 'empty-es.ts');
const pageIndex = path.resolve(__dirname, './../src/pages/index.tsx');
const wmWebPageIndex = path.join(__dirname, './../../web-entry-wm/src/layouts/WmMain/renderContainer.tsx');
const namedEmptyPath = path.join(__dirname, './named-empty.ts');
const wmWebNamedEmpty = path.join(__dirname, './wm-named-empty.ts');
const emptyDefaultTsx = path.join(__dirname, './empty-func-tsx.ts');
const langLablePath = path.join(__dirname, './../../api/src/utils/global_label/labels.ts');
const contactDetailPath = path.join(__dirname, './../../web-contact/src/component/Detail/detail.tsx');
const webSettingIndex = path.join(__dirname, './../../web-setting/src/index.tsx');
const emptyJsonPath = path.join(__dirname, './empty-json.json');
const emptyApiPath = path.join(__dirname, './empty-api.ts');
const emptyFunPath = path.join(__dirname, './empty-funs.ts');
const globalLabelIndex = path.join(__dirname, './../../api/src/utils/global_label/index.ts');
const mailWriteWritePageIndex = path.join(__dirname, './../../web-mail-write/src/WritePage.tsx');

const webBaseLayout = path.join(__dirname, './../src/layouts/Main/baseLayout.tsx');
const webSideBarWaimao = path.join(__dirname, './../src/layouts/Main/sideBarWaimao.tsx');
const webReadMailPage = path.join(__dirname, './../src/pages/readMail.tsx');
const mockL2cPath = path.join(__dirname, './l2c-crm/mock-l2c-crm.ts');
const webWriteMailPage = path.join(__dirname, './../src/pages/writeMail.tsx');
const mailContentWrapperContent = path.join(__dirname, './../../web-mail-write/src/components/MailContent/WrappedContent.tsx');
const webMailWriteWrireSide = path.join(__dirname, './../../web-mail-write/src/components/WriteContact/writeSide.tsx');
const webMailRightSideBar = path.join(__dirname, './../../web-mail/src/rightSidebar.tsx');
const webMailContentTips = path.join(__dirname, './../../web-mail/src/components/ReadMail/ContentTips.tsx');
const webMailSingleMail = path.join(__dirname, './../../web-mail/src/components/ReadMail/SingleMail.tsx');
const webMailReadMailHeader = path.join(__dirname, './../../web-mail/src/components/ReadMail/Header.tsx');
const webMailWriteMainInfo = path.join(__dirname, './../../web-mail-write/src/components/MailInfo/mailInfo.tsx');
const webContactDetail = path.join(__dirname, './../../web-contact/src/component/Detail/detail.tsx');
const webMailRiskReminder = path.join(__dirname, './../../web-mail/src/components/RiskReminder/risk-reminder.tsx');
const webIMItemLink = path.join(__dirname, './../../web-im/src/subcontent/chatDisplay/itemAltType/ItemLink.tsx');

const gatsbyCachePath = path.join(__dirname, './../.cache');
const gatsbyOverWriteLoader = path.join(__dirname, './../gatsby-overwrite/loader.js');

const mainApiEntryPath = path.join(__dirname, './../../api/src/gen/impl_list.ts');
const mainIgnoreApis = [
  '/impl/logical/account/insertWhatsApp_impl',
  '/impl/logical/address_book/address_book_impl',
  'impl/logical/customer/customerDiscovery_impl',
  'impl/logical/customer/customer_impl',
  'impl/logical/customer/fieldSetting_impl',
  'impl/logical/customer/saleStage_impl',
  'impl/logical/edm/customs_impl',
  'impl/logical/edm/edm_notify_impl',
  'impl/logical/edm/global_search_impl',
  'impl/logical/edm/product_data_impl',
  'impl/logical/edm/role_impl',
  'impl/logical/edm/sendbox_impl',
  'impl/logical/whatsApp/whatsApp_impl',
  'impl/logical/worktable/worktable_impl',
  'impl/advert/advert_impl',
  'impl/logical/auto_market/auto_market_impl',
  'impl/logical/site/site_impl',
];

const gatsbyOverWriteLoaderArr = [
  {
    request: './prefetch',
    emptyPath: path.join(gatsbyCachePath, './prefetch.js'),
  },
  {
    request: './emitter',
    emptyPath: path.join(gatsbyCachePath, './emitter.js'),
  },
  {
    request: './find-path',
    emptyPath: path.join(gatsbyCachePath, './find-path.js'),
  },
];

let LingXiIssuerMap = {
  [mainApiEntryPath]: mainIgnoreApis.map(ignoreApiPath => ({
    request: ignoreApiPath,
    emptyPath: emptyApiPath,
  })),
  [contactDetailPath]: [
    {
      request: './detail_edm',
      emptyPath: emptyTsxPath,
    },
  ],
  [pageIndex]: [
    {
      request: '@web-site/index',
      emptyPath: emptyTsxPath,
    },
    {
      request: '@web-edm/edmIndex',
      emptyPath: emptyTsxPath,
    },
    {
      request: '/components/Layout/Customer/customerIndex',
      emptyPath: emptyTsxPath,
    },
    {
      request: '/components/Layout/CustomsData/customsIndex',
      emptyPath: emptyTsxPath,
    },
    {
      request: '/components/Layout/SNS/snsIndex',
      emptyPath: emptyTsxPath,
    },
    {
      request: '@/components/Layout/Worktable/workTable',
      emptyPath: namedEmptyPath,
    },
    {
      request: '@/components/Layout/globalSearch',
      emptyPath: namedEmptyPath,
    },
    {
      request: '@/components/Layout/EnterpriseSetting',
      emptyPath: namedEmptyPath,
    },
    {
      request: '@web-unitable-crm/unitable-crm',
      emptyPath: namedEmptyPath,
    },
    {
      request: '@/components/Layout/SceneAggregation/intelliMarketing',
      emptyPath: emptyTsxPath,
    },
    {
      request: 'components/Layout/SceneAggregation/bigData',
      emptyPath: emptyTsxPath,
    },
    {
      request: '@/components/Layout/Rbac/rbac',
      emptyPath: emptyTsxPath,
    },
    {
      request: '@/components/UI/WmEntryNotification',
      emptyPath: emptyTsxPath,
    },
  ],
  [langLablePath]: [
    {
      request: '/waimao/zh.json',
      emptyPath: emptyJsonPath,
    },
    {
      request: '/waimao/en.json',
      emptyPath: emptyJsonPath,
    },
    {
      request: '/waimao/zh-trad.json',
      emptyPath: emptyJsonPath,
    },
    {
      request: '/yingxiao/zh.json',
      emptyPath: emptyJsonPath,
    },
    {
      request: '/yingxiao/en.json',
      emptyPath: emptyJsonPath,
    },
    {
      request: '/yingxiao/zh-trad.json',
      emptyPath: emptyJsonPath,
    },
  ],
  [mailWriteWritePageIndex]: [
    {
      request: '@web-edm/mailTemplate/NewTamplateModal',
      emptyPath: namedEmptyPath,
    },
  ],
  [gatsbyOverWriteLoader]: gatsbyOverWriteLoaderArr,
};

function addLingXiEmptyComponents(isWeb) {
  const webPageIndex = pageIndex;
  if (!LingXiIssuerMap[webSettingIndex]) {
    LingXiIssuerMap[webSettingIndex] = [];
  }
  if (!LingXiIssuerMap[webPageIndex]) {
    LingXiIssuerMap[webPageIndex] = [];
  }
  if (!LingXiIssuerMap[webReadMailPage]) {
    LingXiIssuerMap[webReadMailPage] = [];
  }
  if (!LingXiIssuerMap[webWriteMailPage]) {
    LingXiIssuerMap[webWriteMailPage] = [];
  }
  if (!LingXiIssuerMap[webSideBarWaimao]) {
    LingXiIssuerMap[webSideBarWaimao] = [];
  }
  if (!LingXiIssuerMap[webBaseLayout]) {
    LingXiIssuerMap[webBaseLayout] = [];
  }
  if (!LingXiIssuerMap[mailContentWrapperContent]) {
    LingXiIssuerMap[mailContentWrapperContent] = [];
  }
  if (!LingXiIssuerMap[webMailWriteWrireSide]) {
    LingXiIssuerMap[webMailWriteWrireSide] = [];
  }
  if (!LingXiIssuerMap[webMailRightSideBar]) {
    LingXiIssuerMap[webMailRightSideBar] = [];
  }
  if (!LingXiIssuerMap[webMailContentTips]) {
    LingXiIssuerMap[webMailContentTips] = [];
  }
  if (!LingXiIssuerMap[webMailSingleMail]) {
    LingXiIssuerMap[webMailSingleMail] = [];
  }
  if (!LingXiIssuerMap[webMailReadMailHeader]) {
    LingXiIssuerMap[webMailReadMailHeader] = [];
  }
  if (!LingXiIssuerMap[webMailWriteMainInfo]) {
    LingXiIssuerMap[webMailWriteMainInfo] = [];
  }
  if (!LingXiIssuerMap[webContactDetail]) {
    LingXiIssuerMap[webContactDetail] = [];
  }
  if (!LingXiIssuerMap[webMailRiskReminder]) {
    LingXiIssuerMap[webMailRiskReminder] = [];
  }
  if (!LingXiIssuerMap[webIMItemLink]) {
    LingXiIssuerMap[webIMItemLink] = [];
  }
  LingXiIssuerMap[webIMItemLink].push({
    request: '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer',
    emptyPath: emptyTsxPath,
  });
  LingXiIssuerMap[webMailRiskReminder].push(
    {
      request: '@lxunit/app-l2c-crm',
      emptyPath: mockL2cPath,
    },
    {
      request: '@/components/Layout/CustomsData/components/uniDrawer/uniDrawerLeads2',
      emptyPath: mockL2cPath,
    }
  );
  LingXiIssuerMap[webContactDetail].push(
    {
      request: '@lxunit/app-l2c-crm',
      emptyPath: mockL2cPath,
    },
    {
      request: '@/components/Layout/CustomsData/components/uniDrawer/uniDrawerLeads2',
      emptyPath: mockL2cPath,
    }
  );
  LingXiIssuerMap[webMailWriteMainInfo].push({
    request: '@web-mail/components/ReadMail/component/TimeZone/TimeZoneWriteMail',
    emptyPath: emptyTsxPath,
  });
  LingXiIssuerMap[webMailReadMailHeader].push({
    request: './component/TimeZone',
    emptyPath: emptyTsxPath,
  });
  LingXiIssuerMap[webMailSingleMail].push({
    request: './EdmReplyMark',
    emptyPath: emptyTsxPath,
  });
  LingXiIssuerMap[webMailContentTips].push({
    request: './EdmReplyMark',
    emptyPath: emptyTsxPath,
  });
  LingXiIssuerMap[webMailRightSideBar].push(
    {
      request: '@/components/Layout/Customer/components/sidebar',
      emptyPath: namedEmptyPath,
    },
    {
      request: '@/components/Layout/Customer/components/sidebar/clueSidebar',
      emptyPath: namedEmptyPath,
    },
    {
      request: '@/components/Layout/Customer/components/sidebar/commonSidebar',
      emptyPath: namedEmptyPath,
    }
  );
  LingXiIssuerMap[webMailWriteWrireSide].push({
    request: '@web-mail/rightSidebar',
    emptyPath: emptyTsxPath,
  });
  LingXiIssuerMap[mailContentWrapperContent].push({
    request: '@web-edm/components/productSettingModal/productSettingModal',
    emptyPath: namedEmptyPath,
  });
  LingXiIssuerMap[webPageIndex].push(
    {
      request: 'web-entry-wm/src/layouts/hooks/use-l2c-crm-menu-data',
      emptyPath: mockL2cPath,
    },
    {
      request: '@web-unitable-crm/api/helper',
      emptyPath: mockL2cPath,
    },
    {
      request: '@/components/Layout/SceneAggregation/coop',
      emptyPath: emptyTsxPath,
    },
    {
      request: '@/components/Layout/WhatsAppChat/container',
      emptyPath: emptyTsxPath,
    }
  );
  LingXiIssuerMap[webBaseLayout].push(
    {
      request: 'web-entry-wm/src/layouts/hooks/use-l2c-crm-menu-data',
      emptyPath: mockL2cPath,
    },
    {
      request: '@web-unitable-crm/api/helper',
      emptyPath: mockL2cPath,
    }
  );
  LingXiIssuerMap[webSideBarWaimao].push(
    {
      request: 'web-entry-wm/src/layouts/hooks/use-l2c-crm-menu-data',
      emptyPath: mockL2cPath,
    },
    {
      request: '@web-common/components/UsageGuide',
      emptyPath: namedEmptyPath,
    }
  );
  LingXiIssuerMap[webWriteMailPage].push({
    request: '@web-unitable-crm/penpal-bridge/l2c-bridge',
    emptyPath: mockL2cPath,
  });
  LingXiIssuerMap[webReadMailPage].push({
    request: '@web-unitable-crm/penpal-bridge/l2c-bridge',
    emptyPath: mockL2cPath,
  });
  LingXiIssuerMap[webSettingIndex].push(
    {
      request: './comp_preview',
      emptyPath: emptyTsxPath,
    },
    {
      request: '@web-mail/test/pages/mailCards',
      emptyPath: emptyTsxPath,
    }
  );
  LingXiIssuerMap[webPageIndex].push(
    {
      request: '@web-common/components/FloatToolButton',
      emptyPath: namedEmptyPath,
    },
    {
      request: '@/components/Layout/helpCenter/index',
      emptyPath: namedEmptyPath,
    },
    {
      request: '@/components/UI/Notice/notice',
      emptyPath: namedEmptyPath,
    },
    {
      request: '@web-common/state/reducer/privilegeReducer',
      emptyPath: emptyFunPath,
    },
    {
      request: '@/components/UI/GlobalAdvertNotification/GlobalAdvertNotification',
      emptyPath: namedEmptyPath,
    },
    {
      request: '@/components/Npsmeter',
      emptyPath: namedEmptyPath,
    },
    {
      request: '@/components/Layout/TaskCenter/pages/SystemTask',
      emptyPath: emptyTsxPath,
    },
    {
      request: '@/components/Layout/TaskCenter/pages/NoviceTask',
      emptyPath: emptyTsxPath,
    },
    {
      request: '@/components/Layout/TaskCenter/components/NoviceTaskEntry',
      emptyPath: emptyTsxPath,
    },
    {
      request: '@/components/Layout/TaskCenter/utils',
      emptyPath: emptyFunPath,
    }
  );

  const mailBoxPath = path.resolve(__dirname, './../../web-mail/src/mailBox.tsx');
  LingXiIssuerMap[mailBoxPath] = [
    {
      request: '@web-mail/components/CustomerMail/customerMailBoxEventHandler',
      emptyPath: emptyTsxPath,
    },
    {
      request: '@/components/Layout/CustomsData/components/uniDrawer/uniDrawerLeads2',
      emptyPath: namedEmptyPath,
    },
    {
      request: '@web-mail/components/CustomerMail/customerUIHandler',
      emptyPath: emptyTsxPath,
    },
    {
      request: '@web-mail/components/SubordinateMail/subordinateUIHandler',
      emptyPath: emptyTsxPath,
    },
    {
      request: '@web-mail/components/SubordinateMail/subordinateMailBoxEventHandler',
      emptyPath: emptyTsxPath,
    },
  ];

  const mailSyncModalPath = path.resolve(__dirname, './../../web-mail/src/components/MailSyncModal/MailSyncModal.tsx');
  LingXiIssuerMap[mailSyncModalPath] = [
    {
      request: '@web-mail/components/MailSyncModal/MailSyncModal',
      emptyPath: emptyTsxPath,
    },
  ];
  const mailColumnMailBoxPath = path.resolve(__dirname, './../../web-mail/src/components/ColumnMailBox/index.tsx');
  LingXiIssuerMap[mailColumnMailBoxPath] = [
    {
      request: './MailSubTab',
      emptyPath: emptyTsxPath,
    },
  ];

  const readMailPagePath = path.resolve(__dirname, './../../web-mail/src/readMailPage.tsx');
  LingXiIssuerMap[readMailPagePath] = [
    {
      request: '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer',
      emptyPath: emptyTsxPath,
    },
    {
      request: '@web-mail/components/CustomerMail',
      emptyPath: emptyTsxPath,
    },
    {
      request: '@web-mail/components/SubordinateMail',
      emptyPath: emptyTsxPath,
    },
  ];

  const readMailAndSiderPath = path.resolve(__dirname, './../../web-mail/src/readMailAndSider.tsx');
  LingXiIssuerMap[readMailAndSiderPath] = [
    {
      request: '@/components/Layout/Customer/components/sidebar',
      emptyPath: namedEmptyPath,
    },
    {
      request: '@/components/Layout/Customer/components/sidebar/commonSidebar',
      emptyPath: namedEmptyPath,
    },
  ];

  const mailReadMailPath = path.resolve(__dirname, './../../web-mail/src/components/MainReadMail/MainReadMail.tsx');
  LingXiIssuerMap[mailReadMailPath] = [
    {
      request: '../CustomerMail/ColumnCustomerMailList/CustomerMailMultOperPanel',
      emptyPath: emptyTsxPath,
    },
    {
      request: '../SubordinateMail/ColumnSubordinateMailList/SubordinateMailMultOperPanel',
      emptyPath: emptyTsxPath,
    },
  ];

  const webWrapPath = path.resolve(__dirname, './../src/layouts/container/wrap.tsx');
  if (isWeb) {
    LingXiIssuerMap[webPageIndex].push({
      request: '@/components/Electron/Upgrade',
      emptyPath: emptyTsxPath,
    });
    // LingXiIssuerMap[mailColumnMailBoxPath].push(
    //   {
    //     request: '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide',
    //     emptyPath: emptyTsxPath,
    //   },
    //   {
    //     request: '@web-common/components/UI/MultAccountsLoginModal/index',
    //     emptyPath: emptyTsxPath,
    //   }
    // );
    LingXiIssuerMap[webWrapPath] = [
      {
        request: '@/components/Electron/TitleBar',
        emptyPath: emptyTsxPath,
      },
    ];
  }

  if (!isWeb) {
    LingXiIssuerMap[webWrapPath] = [
      {
        request: '@/layouts/Main/webToolbar',
        emptyPath: emptyTsxPath,
      },
    ];
  }
}

const overwriteArr = [
  {
    issuer: gatsbyCachePath,
    request: './loader',
    overwitePath: gatsbyOverWriteLoader,
  },
];

function getCurrentUserEmail() {
  try {
    const currentUser = childProcess
      .execSync('git config user.email')
      .toString()
      .split('\n')
      .filter(line => line);
    return currentUser.join('');
  } catch (ex) {
    console.error(ex);
    return null;
  }
}

function handleIgnoreMouldesInWeb(devIgnoreTab) {
  const imTabName = 'im';
  const scheduleTabName = 'schedule';
  const diskTabName = 'disk';
  const settingTabName = 'setting';
  const appsTabName = 'apps';
  const contactTabName = 'contact';
  const mailBoxTabName = 'mailbox';

  const devIgnoreTabs = devIgnoreTab || [imTabName, scheduleTabName, diskTabName, appsTabName, contactTabName];
  const ignoreModules = [];
  devIgnoreTabs.forEach(ignoreTab => {
    switch (ignoreTab) {
      case mailBoxTabName:
        ignoreModules.push({
          request: '@web-mail/mailBox',
          emptyPath: emptyTsxPath,
        });
        break;
      case imTabName:
        ignoreModules.push({
          request: '@web-im/im',
          emptyPath: emptyTsxPath,
        });
        break;
      case scheduleTabName:
        ignoreModules.push({
          request: '@web-schedule/schedule',
          emptyPath: emptyTsxPath,
        });
        break;
      case diskTabName:
        ignoreModules.push({
          request: '@web-disk/index',
          emptyPath: emptyTsxPath,
        });
        break;
      case settingTabName:
        ignoreModules.push({
          request: '@web-setting/index',
          emptyPath: emptyTsxPath,
        });
        break;
      case appsTabName:
        ignoreModules.push({
          request: '@web-apps/apps',
          emptyPath: namedEmptyPath,
        });
        break;
      case contactTabName:
        ignoreModules.push({
          request: '@web-contact/contact',
          emptyPath: emptyTsxPath,
        });
        break;
      default:
        throw new Error('not support ignore this module');
    }
  });
  if (ignoreModules && ignoreModules.length) {
    LingXiIssuerMap[pageIndex].push(...ignoreModules);
  }
}

let LingXiRequirePaths = null;

function addSSRIgnoreMap(isWaimaoWeb) {
  // LingXiRequirePaths = [
  //   {
  //     test: /\/web\/pages\/.+\.tsx$/,
  //     emptyPath: emptyTsxPath,
  //   },
  // ];
  const rootComponentPath = isWaimaoWeb ? path.join(__dirname, './../../web-entry-wm/wrap-with-provider.js') : path.join(__dirname, './../wrap-with-provider.js');
  const ignoreMap = ssrRemoveUtils.getSSRIgnoreMap(rootComponentPath);
  Object.keys(ignoreMap).forEach(ignoreKey => {
    LingXiIssuerMap[ignoreKey] = ignoreMap[ignoreKey];
  });
}

class LingXiResolvePlugin {
  constructor(options) {
    this.stage = options.stage || '';
    this.isLingXi = typeof options.isLingXi !== undefined ? options.isLingXi : true;
    this.isEdm = options.isEdm || false;
    this.isEdmWeb = options.isEdmWeb || false;
    this.isFastBuildWeb = options.isFastBuildWeb || false;
    this.isFastUni = options.isFastUni || false;
    this.isWeb = options.isWeb || false;
    this.isDevelop = this.stage.includes('develop');
    this.isFastBuildEdmMail = options.isFastBuildEdmMail || false;
    this.isFastBuildEdmData = options.isFastBuildEdmData || false;
    this.isFastBuildEdmYingXiao = options.isFastBuildEdmYingXiao || false;
    const isBuildHtml = this.stage.includes('-html');
    this.isBuildProdHTML = this.stage === 'build-html';
    this.isBuildHtml = isBuildHtml;
    if (this.isEdm && this.isBuildProdHTML) {
      LingXiIssuerMap = {
        [globalLabelIndex]: [],
        [gatsbyOverWriteLoader]: gatsbyOverWriteLoaderArr,
      };
      return;
    }
    if (this.isEdm && this.isEdmWeb && !this.isDevelop) {
      LingXiIssuerMap = {
        [globalLabelIndex]: [],
        [gatsbyOverWriteLoader]: gatsbyOverWriteLoaderArr,
      };
      LingXiIssuerMap[globalLabelIndex].push({
        request: './labels',
        emptyPath: namedEmptyPath,
      });
      console.log('Build for edm web...');
      return;
    }
    if (this.isLingXi) {
      addLingXiEmptyComponents(this.isWeb);
    }
    if (this.isEdm && this.isDevelop && this.isFastBuildWeb && this.isFastBuildEdmYingXiao) {
      LingXiIssuerMap = {
        [gatsbyOverWriteLoader]: gatsbyOverWriteLoaderArr,
        [pageIndex]: [
          {
            request: '@web-site/index',
            emptyPath: emptyTsxPath,
          },
          {
            request: '@web-edm/edmIndex',
            emptyPath: emptyTsxPath,
          },
          {
            request: '/components/Layout/Customer/customerIndex',
            emptyPath: emptyTsxPath,
          },
          {
            request: '/components/Layout/CustomsData/customsIndex',
            emptyPath: emptyTsxPath,
          },
          {
            request: '/components/Layout/SNS/snsIndex',
            emptyPath: emptyTsxPath,
          },
          {
            request: '@/components/Layout/Worktable/workTable',
            emptyPath: namedEmptyPath,
          },
          {
            request: '@/components/Layout/globalSearch',
            emptyPath: namedEmptyPath,
          },
          {
            request: '@/components/Layout/EnterpriseSetting/salesPitch',
            emptyPath: emptyDefaultTsx,
          },
          {
            request: '@/components/Layout/EnterpriseSetting',
            emptyPath: namedEmptyPath,
          },
          {
            request: '@/components/Layout/SceneAggregation/coop',
            emptyPath: emptyTsxPath,
          },
          {
            request: 'components/Layout/SceneAggregation/bigData',
            emptyPath: emptyTsxPath,
          },
          {
            request: '@/components/Layout/Rbac/rbac',
            emptyPath: emptyTsxPath,
          },
          {
            request: '@/components/UI/WmEntryNotification',
            emptyPath: emptyTsxPath,
          },
          {
            request: '@web-mail/mailBox',
            emptyPath: emptyTsxPath,
          },
          {
            request: '@web-im/im',
            emptyPath: emptyTsxPath,
          },
          {
            request: '@web-schedule/schedule',
            emptyPath: emptyTsxPath,
          },
          {
            request: '@web-disk/index',
            emptyPath: emptyTsxPath,
          },
          {
            request: '@web-setting/index',
            emptyPath: emptyTsxPath,
          },
          {
            request: '@web-apps/apps',
            emptyPath: namedEmptyPath,
          },
          {
            request: '@web-contact/contact',
            emptyPath: emptyTsxPath,
          },
        ],
      };
      return;
    }
    if (this.isEdm && !this.isEdmWeb && !this.isDevelop && !this.isFastBuildWeb && this.stage !== 'build-ApiAlone') {
      LingXiIssuerMap = {
        [globalLabelIndex]: [],
        [gatsbyOverWriteLoader]: gatsbyOverWriteLoaderArr,
      };
      LingXiIssuerMap[globalLabelIndex].push({
        request: './labels',
        emptyPath: namedEmptyPath,
      });
      console.log(LingXiIssuerMap);
      // throw new Error('test-code');
      return;
    }
    if (!this.isDevelop && this.stage !== 'build-ApiAlone') {
      if (!LingXiIssuerMap[globalLabelIndex]) {
        LingXiIssuerMap[globalLabelIndex] = [];
      }
      LingXiIssuerMap[globalLabelIndex].push({
        request: './labels',
        emptyPath: namedEmptyPath,
      });
    }

    if (this.stage === 'build-ApiAlone') {
      const bkInitApiListFile = path.resolve(__dirname, './../../api/src/gen/impl_bg_list.ts');
      const accountBgApiListFile = path.resolve(__dirname, './../../api/src/gen/impl_account_bg_list.ts');

      const bkInitBlackApiList = [
        'worktable/worktable_impl',
        'windowHooks/window_hooks_impl',
        'whatsApp/whatsApp_impl',
        'webmail/webmail_impl',
        'upgradeApp/upgrade_app_impl',
        'site/site_impl',
        'register/register_impl',
        'push/push_impl',
        'net_storage/net_storage_share_impl',
        'net_storage/net_storage_impl',
        'mail/mail_template_impl',
        'mail/mail_stranger_impl',
        'mail/mail_product_impl',
        'kf/kf_impl',
        'im/im_team_impl',
        'im/im_impl',
        'im_discuss_impl',
        'ics/ics_impl',
        'feedback/feedback_impl',
        'facebook/facebook_impl',
        'edm/sendbox_impl',
        'edm/role_impl',
        'edm/product_data_impl',
        'edm/global_search_impl',
        'edm/edm_notify_impl',
        'edm/customs_impl',
        'customer/saleStage_impl',
        'customer/fieldSetting_impl',
        'customer/customer_impl',
        'customer/customerDiscovery_impl',
        'convert/convert_impl',
        'configSetting/config_setting_impl',
        'catalog/catalog_impl',
        'auto_market/auto_market_impl',
        'advert/advert_impl',
        'address_book/address_book_impl',
        'account/insertWhatsApp_impl',
        '/impl/api_system/keyboard/keyboard_impl',
        'impl/logical/site/site_impl',
      ].map(item => (item.includes('/impl') ? item : '/impl/logical/' + item));
      LingXiIssuerMap[bkInitApiListFile] = bkInitBlackApiList.map(item => ({
        request: item,
        emptyPath: emptyApiPath,
      }));
      LingXiIssuerMap[accountBgApiListFile] = bkInitBlackApiList
        .filter(item => !item.includes('mail_template_impl') && !item.includes('ics_impl') && !item.includes('push_impl'))
        .map(item => ({
          request: item,
          emptyPath: emptyApiPath,
        }));

      if (LingXiIssuerMap[langLablePath]) {
        LingXiIssuerMap[langLablePath].push(
          {
            request: './zh.json',
            emptyPath: emptyJsonPath,
          },
          {
            request: './en.json',
            emptyPath: emptyJsonPath,
          },
          {
            request: './zh-trad.json',
            emptyPath: emptyJsonPath,
          }
        );
      }
    }

    const isEdmMail = this.isFastBuildEdmMail;
    const isEdmData = this.isFastBuildEdmData;

    const isDevelop = this.stage.includes('develop');
    if (isDevelop && this.isFastBuildWeb) {
      const isDocTeam = this.isFastUni;
      const { devIgnoreTab } = options;

      if (this.isEdm) {
        LingXiIssuerMap = {
          [pageIndex]: [],
          [gatsbyOverWriteLoader]: gatsbyOverWriteLoaderArr,
        };
        if (!this.isEdmWeb) {
          if (isDocTeam) {
            LingXiIssuerMap[pageIndex] = [
              {
                request: '@/components/Layout/SceneAggregation/intelliMarketing',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@/components/Layout/Worktable/workTable',
                emptyPath: namedEmptyPath,
              },
              {
                request: '@/components/Layout/SceneAggregation/bigData',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-site/index',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@/components/Layout/EnterpriseSetting',
                emptyPath: namedEmptyPath,
              },
              {
                request: '@/components/Layout/Rbac/rbac',
                emptyPath: emptyTsxPath,
              },
              // 邮箱模块
              // {
              //   request: '@web-mail/mailBox',
              //   emptyPath: emptyTsxPath
              // }
            ];
          }
          if (isEdmMail) {
            handleIgnoreMouldesInWeb(devIgnoreTab);
            LingXiIssuerMap[pageIndex].push(
              {
                request: '@web-site/index',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-edm/edmIndex',
                emptyPath: emptyTsxPath,
              },
              {
                request: '/components/Layout/Customer/customerIndex',
                emptyPath: emptyTsxPath,
              },
              {
                request: '/components/Layout/CustomsData/customsIndex',
                emptyPath: emptyTsxPath,
              },
              {
                request: '/components/Layout/SNS/snsIndex',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@/components/Layout/Worktable/workTable',
                emptyPath: namedEmptyPath,
              },
              {
                request: '@/components/Layout/globalSearch',
                emptyPath: namedEmptyPath,
              },
              {
                request: '@/components/Layout/EnterpriseSetting',
                emptyPath: namedEmptyPath,
              },
              {
                request: '@/components/Layout/SceneAggregation/intelliMarketing',
                emptyPath: emptyTsxPath,
              },
              {
                request: 'components/Layout/SceneAggregation/bigData',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@/components/Layout/Rbac/rbac',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@/components/UI/WmEntryNotification',
                emptyPath: emptyTsxPath,
              }
            );
          }
          if (isEdmData) {
            LingXiIssuerMap[pageIndex] = [
              {
                request: '@/components/Layout/TaskCenter/pages/SystemTask',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@/components/Layout/TaskCenter/pages/NoviceTask',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@/components/Layout/Rbac/rbac',
                emptyPath: emptyTsxPath,
              },
              // {
              //   request: '@/components/Layout/EnterpriseSetting',
              //   emptyPath: namedEmptyPath,
              // },
              {
                request: '@/components/Layout/Worktable/workTable',
                emptyPath: namedEmptyPath,
              },
              {
                request: '@/components/Layout/helpCenter/index',
                emptyPath: namedEmptyPath,
              },
              {
                request: '@/components/Layout/SceneAggregation/intelliMarketing',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-edm/edmIndex',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-site/index',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-mail/mailBox',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/Worktable/workTable',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@/components/Layout/globalSearch/search/search',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-edm/addressBook/pages/index',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-site/mySite',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-im/im',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-schedule/schedule',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-disk/index',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-setting/index',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-contact/contact',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-apps/apps',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@/components/Layout/globalSearch/keywordsSubscribe/KeywordsSubscribe',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@/components/Layout/globalSearch/keywordsSubscribe/KeywordsProvider',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-edm/addressBook/pages/openSea/index',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-edm/contact/contact',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-edm/sendedMarketing',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-edm/draft/draft',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-edm/autoMarket/task',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-edm/autoMarket/taskDetail',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-edm/autoMarket/taskEdit',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-edm/mailTemplate/index',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-edm/AIHosting',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/personalJobWhatsapp',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/personalJobWhatsapp/detail',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/message/message',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/job/job',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/job/jobEdit',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/job/jobReport',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/message/message',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/statistic/index',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/template/template',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/Facebook/mainPages/mainPages',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/Facebook/posts',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/Facebook/message',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-site/market',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/stat',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/stat/StatDetails',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/siteCustomer',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/domainManage/myDomain',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/domainManage/orderManage',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/domainManage/infoTemplate',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/domainManage/createInfoTemplate',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/domainManage/checkInfoTemplate',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/domainManage/purchaseCert',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/domainManage/myCert',
                emptyPath: wmWebNamedEmpty,
              },
            ];
          }
        } else {
          if (isDocTeam) {
            LingXiIssuerMap[wmWebPageIndex] = [
              // Worktable
              {
                request: '@web/components/Layout/Worktable/workTable',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@/components/Layout/globalSearch/search/search',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-edm/addressBook/pages/index',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-site/mySite',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-im/im',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-schedule/schedule',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-disk/index',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-setting/index',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-contact/contact',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-apps/apps',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/CustomsData/customs/customs',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@/components/Layout/globalSearch/lbsSearch/LbsSearch',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@/components/Layout/Data/IntelligentSearch',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@/components/Layout/LinkedInSearch',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/CustomsData/starMark/star',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@/components/Layout/globalSearch/keywordsSubscribe/KeywordsSubscribe',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@/components/Layout/globalSearch/keywordsSubscribe/KeywordsProvider',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-edm/addressBook/pages/openSea/index',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-edm/contact/contact',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-edm/sendedMarketing',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-edm/draft/draft',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-edm/autoMarket/task',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-edm/autoMarket/taskDetail',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-edm/autoMarket/taskEdit',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-edm/mailTemplate/index',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-edm/AIHosting',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/personalJobWhatsapp',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/personalJobWhatsapp/detail',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/message/message',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/job/job',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/job/jobEdit',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/job/jobReport',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/message/message',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/statistic/index',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/WhatsApp/template/template',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/Facebook/mainPages/mainPages',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/Facebook/posts',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web/components/Layout/SNS/Facebook/message',
                emptyPath: emptyTsxPath,
              },
              {
                request: '@web-site/market',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/stat',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/stat/StatDetails',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/siteCustomer',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/domainManage/myDomain',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/domainManage/orderManage',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/domainManage/infoTemplate',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/domainManage/createInfoTemplate',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/domainManage/checkInfoTemplate',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/domainManage/purchaseCert',
                emptyPath: wmWebNamedEmpty,
              },
              {
                request: '@web-site/domainManage/myCert',
                emptyPath: wmWebNamedEmpty,
              },
            ];
          }
          handleIgnoreMouldesInWeb(devIgnoreTab);
        }
      } else {
        handleIgnoreMouldesInWeb(devIgnoreTab);
      }

      LingXiIssuerMap[pageIndex].push(
        {
          request: '@web-setting/Keyboard/keyboard',
          emptyPath: namedEmptyPath,
        },
        // {
        //   request: '@web-common/components/UI/Icons/icons',
        //   emptyPath: namedEmptyPath
        // },
        {
          request: '/components/Electron/Upgrade',
          emptyPath: emptyTsxPath,
        },
        {
          request: '@/components/UI/Notice/notice',
          emptyPath: namedEmptyPath,
        },
        {
          request: '@/components/UI/GlobalAdvertNotification/GlobalAdvertNotification',
          emptyPath: namedEmptyPath,
        },
        {
          request: '@/components/Npsmeter',
          emptyPath: namedEmptyPath,
        }
      );

      // LingXiIssuerMap[mainApiEntryPath].push({
      //   request: 'api_system/keyboard/keyboard_impl',
      //   emptyPath: emptyApiPath
      // }, {
      //   request: '/impl/api_system/performance/performance_impl',
      //   emptyPath: emptyApiPath
      // }, {
      //   request: '/impl/logical/catalog/catalog_impl',
      //   emptyPath: emptyApiPath
      // }, {
      //   emptyPath: '/impl/logical/configSetting/config_setting_impl',
      //   emptyPath: emptyApiPath
      // }, {
      //   emptyPath: '/impl/logical/convert/convert_impl',
      //   emptyPath: emptyApiPath
      // }, {
      //   emptyPath: '/impl/logical/im/im_discuss_impl',
      //   emptyPath: emptyApiPath
      // }, {
      //   emptyPath: '/impl/logical/im/im_team_impl',
      //   emptyPath: emptyApiPath
      // }, {
      //   emptyPath: '/impl/logical/kf/kf_impl',
      //   emptyPath: emptyApiPath
      // }, {
      //   emptyPath: '/impl/logical/register/register_impl',
      //   emptyPath: emptyApiPath
      // }, {
      //   request: '/impl/logical/upgradeApp/upgrade_app_impl',
      //   emptyPath: emptyApiPath
      // }, {
      //   request: '/impl/logical/windowHooks/window_hooks_impl',
      //   emptyPath: emptyApiPath
      // }, {
      //   request: '/impl/logical/im/im_impl',
      //   emptyPath: emptyApiPath
      // });
    }
    // console.error(LingXiIssuerMap);
    // throw new Error('test')
  }
  apply(resolver) {
    if (this.isBuildProdHTML) {
      addSSRIgnoreMap(this.isEdmWeb);
    }
    const target = resolver.ensureHook('resolve');
    resolver.hooks.resolve.tapAsync('lingxi-resolve-plugin', (request, resolveContext, callback) => {
      if (this.isEdm && this.isDevelop && !this.isFastBuildWeb && !this.isBuildProdHTML) {
        callback();
        return;
      }
      const requestIssuer = request && request.context && request.context.issuer ? request.context.issuer : '';
      const requestPath = request && request.request ? request.request : '';
      if (LingXiRequirePaths && LingXiRequirePaths.length) {
        const targetRequirePath = LingXiRequirePaths.find(item => item.test.test(requestPath));
        if (targetRequirePath) {
          console.error('targetRequirePath', targetRequirePath);
          request.request = targetRequirePath.emptyPath;
          resolver.doResolve(target, request, `request change to ${targetRequirePath.emptyPath}`, resolveContext, callback);
          callback();
          return;
        }
      }
      const ignoreList = LingXiIssuerMap[requestIssuer];

      if (!requestIssuer || !requestPath || !ignoreList) {
        if (requestIssuer && requestPath && !ignoreList) {
          const overwiteItem = overwriteArr.find(item => {
            if (requestIssuer.includes(item.issuer) && requestPath.includes(item.request)) {
              return true;
            }
            return false;
          });
          if (overwiteItem) {
            request.request = overwiteItem.overwitePath;
            resolver.doResolve(target, request, `request change to ${overwiteItem.overwitePath}`, resolveContext, callback);
            return;
          }
        }

        callback();
        return;
      }

      for (let i = 0; i < ignoreList.length; ++i) {
        const ignoreItem = ignoreList[i];
        if (requestPath.includes(ignoreItem.request)) {
          request.request = ignoreItem.emptyPath;
          if (requestIssuer.includes('impl_bg_list')) {
            console.error(`${requestPath} request change to ${ignoreItem.emptyPath}`);
          }
          resolver.doResolve(target, request, `request change to ${ignoreItem.emptyPath}`, resolveContext, callback);
          return;
        }
      }

      callback();
    });
  }
}

module.exports = {
  LingXiResolvePlugin,
};
