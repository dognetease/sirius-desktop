const path = require('path');
const childProcess = require('child_process');

const emptyTsxPath = path.join(__dirname, 'empty.tsx');
const emptyEsPath = path.join(__dirname, 'empty-es.ts');
const pageIndex = path.resolve(__dirname, './../src/pages/index.tsx');
const wmWebPageIndex = path.join(__dirname, './../../web-entry-wm/src/layouts/WmMain/renderContainer.tsx');
const namedEmptyPath = path.join(__dirname, './named-empty.ts');
const wmWebNamedEmpty = path.join(__dirname, './wm-named-empty.ts');
const langLablePath = path.join(__dirname, './../../api/src/utils/global_label/labels.ts');
const contactDetailPath = path.join(__dirname, './../../web-contact/src/component/Detail/detail.tsx');
const emptyJsonPath = path.join(__dirname, './empty-json.json');
const emptyApiPath = path.join(__dirname, './empty-api.ts');
const emptyFunPath = path.join(__dirname, './empty-funs.ts');
const emptyMapPath = path.join(__dirname, './empty-map.ts');

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
  'impl/logical/edm/ai_hosting_impl',
  'impl/logical/facebook/facebook_impl',
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
  [mainApiEntryPath]: mainIgnoreApis.map(ignoreApiPath => {
    return {
      request: ignoreApiPath,
      emptyPath: emptyApiPath,
    };
  }),
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
      request: '/waimao/',
      emptyPath: emptyJsonPath,
    },
    {
      request: '/yingxiao/',
      emptyPath: emptyJsonPath,
    },
  ],
  [gatsbyOverWriteLoader]: gatsbyOverWriteLoaderArr,
};

function addLingXiEmptyComponents(isWeb) {
  const webPageIndex = pageIndex;
  if (!LingXiIssuerMap[webPageIndex]) {
    LingXiIssuerMap[webPageIndex] = [];
  }
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
    LingXiIssuerMap[mailColumnMailBoxPath].push(
      {
        request: '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide',
        emptyPath: emptyTsxPath,
      },
      {
        request: '@web-common/components/UI/MultAccountsLoginModal/index',
        emptyPath: emptyTsxPath,
      }
    );
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

function handleIgnoreMouldesInWeb(devIgnoreTab) {
  const imTabName = 'im';
  const scheduleTabName = 'schedule';
  const diskTabName = 'disk';
  const settingTabName = 'setting';
  const appsTabName = 'apps';
  const contactTabName = 'contact';

  const devIgnoreTabs = devIgnoreTab || [imTabName, scheduleTabName, diskTabName, settingTabName, appsTabName, contactTabName];
  let ignoreModules = [];
  devIgnoreTabs.forEach(ignoreTab => {
    switch (ignoreTab) {
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

class LingXiResolvePlugin {
  constructor(options) {
    this.stage = options.stage || '';
    this.isLingXi = options.isLingXi || true;
    this.isEdm = options.isEdm || false;
    this.isEdmWeb = options.isEdmWeb || false;
    this.isFastBuildWeb = options.isFastBuildWeb || false;
    this.isFastUni = options.isFastUni || false;
    this.isWeb = options.isWeb || false;
    if (this.isLingXi) {
      addLingXiEmptyComponents(this.isWeb);
    }
    if (this.stage === 'build-preview') {
      const urlConfigPath = path.join(__dirname, './../../api/src/urlConfig/index.ts');
      if (!LingXiIssuerMap[urlConfigPath]) {
        LingXiIssuerMap[urlConfigPath] = [];
      }
      LingXiIssuerMap[urlConfigPath].push({
        request: '@/urlConfig/edm',
        emptyPath: emptyMapPath,
      });

      const useEventObserverPath = path.join(__dirname, './../../web-common/src/hooks/useEventObserver.ts');
      if (!LingXiIssuerMap[useEventObserverPath]) {
        LingXiIssuerMap[useEventObserverPath] = [];
      }
      LingXiIssuerMap[useEventObserverPath].push({
        request: '@web-common/components/UI/Alert/Alert',
        emptyPath: emptyTsxPath,
      });

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
        },
        {
          request: '/lingxi-api/',
          emptyPath: emptyJsonPath,
        }
      );
      //
      const previewBlackApiList = [
        'api_system/keyboard/keyboard_impl',
        'api_system/task/task_impl',
        'logical/catalog/catalog_impl',
        'logical/configSetting/config_setting_impl',
        'logical/contact/contact_impl',
        'logical/convert/convert_impl',
        'logical/feedback/feedback_impl',
        'logical/ics/ics_impl',
        'logical/im/im_discuss_impl',
        'logical/im/im_impl',
        'logical/im/im_team_impl',
        'logical/kf/kf_impl',
        'logical/mail/mail_auto_reply_impl',
        'logical/mail/mail_blacklist_impl',
        'logical/mail/mail_conf_impl',
        'logical/mail/mail_draft_impl',
        'logical/mail/mail_impl',
        'logical/mail/mail_praise_impl',
        'logical/mail/mail_product_impl',
        'logical/mail/mail_signature_impl',
        'logical/mail/mail_stranger_impl',
        'logical/mail/mail_template_impl',
        'logical/net_storage/net_storage_impl',
        'logical/net_storage/net_storage_share_impl',
        'logical/product_auth/product_auth_impl',
        'logical/push/push_impl',
        'logical/register/register_impl',
        'logical/task_center/task_center_impl',
        'logical/taskmail/taskmail_impl',
        'logical/upgradeApp/upgrade_app_impl',
        'logical/webmail/webmail_impl',
        'impl/api_data/db/db_cache_impl',
        'impl/api_data/db/daxie_memory_impl',
        'impl/api_data/html/html_impl',
        'impl/api_system/error_report/error_report_impl',
      ];
      LingXiIssuerMap[mainApiEntryPath].push(
        ...previewBlackApiList.map(urlStr => {
          return {
            request: urlStr,
            emptyPath: emptyApiPath,
          };
        })
      );
      const apiCommonPath = path.join(__dirname, './../../api/src/common.ts');
      const emptyBridgeInit = path.join(__dirname, './empty-bridge-init.ts');
      LingXiIssuerMap[apiCommonPath] = [
        {
          request: './bridge/index',
          emptyPath: emptyBridgeInit,
        },
      ];
    }
    if (this.stage === 'build-ApiAlone') {
      const bkInitApiListFile = path.resolve(__dirname, './../../api/src/gen/impl_bg_list.ts');
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
      ].map(item => {
        return item.includes('/impl') ? item : '/impl/logical/' + item;
      });
      LingXiIssuerMap[bkInitApiListFile] = bkInitBlackApiList.map(item => {
        return {
          request: item,
          emptyPath: emptyApiPath,
        };
      });

      if (LingXiIssuerMap[langLablePath]) {
        LingXiIssuerMap[langLablePath].push(
          {
            request: './zh.json',
            emptyPath: emptyJsonPath,
          },
          {
            request: './en.json',
            emptyPath: emptyJsonPath,
          }
        );
      }
    }

    const isDevelop = this.stage.includes('develop');
    if (isDevelop && this.isFastBuildWeb) {
      const isDocTeam = this.isFastUni;
      const devIgnoreTab = options.devIgnoreTab;

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
        } else {
          if (isDocTeam) {
            LingXiIssuerMap[wmWebPageIndex] = [
              //Worktable
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
    }
  }
  apply(resolver) {
    const target = resolver.ensureHook('resolve');
    resolver.hooks.resolve.tapAsync('lingxi-resolve-plugin', (request, resolveContext, callback) => {
      if (this.isEdm && !this.isFastBuildWeb) {
        callback();
        return;
      }
      const requestIssuer = request && request.context && request.context.issuer ? request.context.issuer : '';
      const requestPath = request && request.request ? request.request : '';
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
