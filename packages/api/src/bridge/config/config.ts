import lodashGet from 'lodash/get';
import { ModuleApiProxyConfig } from '../interface/apiProxyConfig';
import { api as masterApi } from '@/api/api';
import { apis } from '@/config';
import { CustomError } from './bridgeError';
import { DataTrackerApi } from '@/api/data/dataTracker';

// 某块是否支持代理
/**
 * @deprecated 没有被调用过
 * @param name
 * @returns
 */
export const supportProxy2OtherWin = (name: string) => [apis.contactApiImpl, apis.dbInterfaceApiImpl, apis.mailApiImpl].includes(name);

// 各个模块的代理配置统计配置到这里
const dbBrideProxyConfig: ModuleApiProxyConfig = {
  // target: apis.dexieDbApi,
  target: () => masterApi.requireLogicalApi(apis.dbInterfaceApiImpl),
  namespace: apis.dbInterfaceApiImpl,
  apis: [
    'close',
    'closeSpecific',
    'getByRangeCondition',
    'getByEqCondition',
    'getTableCount',
    'getById',
    'getByIds',
    'getByIndexIds',
    'deleteByByRangeCondition',
    {
      key: 'deleteById',
      priorityConfig: ['high', 3 * 60 * 1000],
    },
    'put',
    'bulkPut',
    {
      key: 'putAll',
      priorityConfig: ['high', 3 * 60 * 1000],
    },
  ],
  proxyTarget(page, isMainAccount, env) {
    if (env !== 'electron') {
      console.log('[bridge/config.mail]', isMainAccount, env);
      return null;
    }
    if (page !== 'dataBg') {
      return 'dataBg';
    }
    return null;
  },
  priorityConfig: ['high', 30 * 1000],
};

const mailBridgeProxyConfig: ModuleApiProxyConfig = {
  target: () => masterApi.requireLogicalApi(apis.mailApiImpl),
  namespace: apis.mailApiImpl,
  apis: [
    'deleteUserFolder',
    'updateMessageInfos',
    'updateUserFolder',
    'createUserFolder',
    'syncMailFolder',
    {
      key: 'doListMailBox',
      priorityConfig: ['high', 30 * 1000],
    },
    'cleanPushConfig',
    'getPushConfig',
    'setPushConfig',
    'doGetFoldersForPushConfig',
    'doListMailBoxEntities',
    'doListThreadMailBoxEntities',
    'doGetThreadMailById',
    'doGetMailContent',
    'handleSendMDN',
    'gptEmailWrite',
    'gptEmailRetouch',
    'getGPTQuota',
    'getGptConfig',
    'getGptRecord',
    'doTranslateGPTAiContent',
    'doGetMailContentIM',
    'doGetThreadMailContent',
    'doGetSearchCacheInfo',
    'doClearSearchCache',
    // 'doSearchMail',
    {
      key: 'doSearchMail',
      backup(err: CustomError) {
        const originFn = (masterApi.requireLogicalApi(apis.mailApiImpl) as any)._$doSearchMail;
        if (typeof originFn !== 'function') {
          throw err;
        }

        const msg = lodashGet(err, 'message', '');
        if (msg.indexOf('BG_WIN_NOT_EXIST') !== -1 || msg.indexOf('API_RESPONSE_TIMEOUT') !== -1) {
          const params = err.config.args;
          return originFn(...(params as [string, any, boolean, number, boolean]));
        }
        throw err;
      },
      proxyTarget(page, isMainAccount, env) {
        if (page !== 'frontPage' || env !== 'electron') {
          return null;
        }
        if (isMainAccount) {
          return 'dataBg';
        }
        return 'accountBg';
      },
    },
    'doMarkMailInfFolder',
    'doMarkMailPerferred',
    'doMarkMail',
    'recordMailRead',
    'doMarkMailDefer',
    'doMarkMailDeferAll',
    'doDeleteMail',
    'doDeleteThreadMail',
    'doMoveMail',
    'doMoveThreadMail',
    'doReportOrTrustMail',
    'doReplayMail',
    'doReplayMailWithAttach',
    'doForwardMail',
    'doForwardMailAsAttach',
    'doEditMail',
    'doNeedSaveTemp',
    'doSaveTemp',
    // 'doSendMail',
    'doUploadAttachment',
    'doGetContentFromDB',
    'doSaveContentToDB',
    // 'buildAttachmentSliceUploader',
    'doWithdrawMail',
    'doCheckReadStatus',
    'doGetMailReadCount',
    'doGetMailReadDetail',
    'getThumbUpInfo',
    'setThumbUpCreate',
    'getMailConfig',
    'setMailConfig',
    // 'doWriteMailToContact',
    // 'doWriteMailFromLink',
    'doWriteMailToServer',
    'initModel',
    // 'doBuildEmptyMailEntryModel',
    'getContractItemByEmail',
    'doCancelCompose',
    'doUpdateMailBoxStat',
    'doGetMailByReplyMId',
    'doFastSend',
    'replyExternalThumbMail',
    'doGetReplayContentModel',
    'doGetGroupMailStatus',
    'getRelatedMail',
    'getFilePreviewUrl',
    'updateMessageTags',
    'refreshDbMailsByTag',
    'doAdvanceSearchMail',
    'getMailContentInDb',
    'getMailContentTableInDb',
    'getTranslateContent',
    'getEnglishGrammar',
    'syncTranslateContentToDb',
    'getLastMailSyncTime',
    'doListMailEntitiesFromDb',
    'doGetThreadMailContentFromDb',
    'doLocalSearchMail',
    'doAddAttachment',
    'doExportMail',
    'doExportMailAsEml',
    'doExportThreadMailAsZip',
    'doGetMailTypeById',
    'doGetMailTypeByIds',
    'doSaveMailSearchRecord',
    'doGetMailSearchRecords',
    'doDeleteMailSearchRecord',
    'doGetPraiseMedals',
    // 这个方法虽然在mail.ts中定义了 但是没有人调用(耗时长)
    // 'scanMailsSetStrangers',
    'doGetAllStrangers',
    'newMailIntoStrangers',
    'newUsersIntoEmailList',
    'doGetFullTaskMailList',
    'doGetRecent3Strangers',
    'mkDownloadDir',
    'listAttachments',
    'assembleMail',
    'doParseEml',
    'doGetParsedEmlFromDb',
    'doUploadMail',
    'doChangeMailEncoding',
    'requestDelivery',
    'triggerReceive',
    'getMailDeliveryDetail',
    {
      key: 'doImportMails',
      priorityConfig: ['high', 120 * 1000],
      proxyTarget(page, isMainAccount, env) {
        // 只在前台页面设置代理
        if (page !== 'frontPage' || env !== 'electron') {
          return null;
        }
        // 如果是主账号 代理到数据后台
        if (isMainAccount) {
          return 'dataBg';
        }
        // 如果是从属账号 代理到账号后台
        return 'accountBg';
      },
    },
    // 'mailOperationEmailListChange', // 17版本智能模式下线
    // 外贸邮件新增方法(2022-08-29)
    // 'doListCustomers',
    // 'doListCustomerMailBoxEntities',
    {
      key: 'syncAllMails',
      priorityConfig: ['high', 30 * 1000],
      proxyTarget(page, isMainAccount, env) {
        // 只在前台页面设置代理
        if (page !== 'frontPage' || env !== 'electron') {
          return null;
        }
        // 如果是主账号 代理到数据后台
        if (isMainAccount) {
          return 'dataBg';
        }
        // 如果是从属账号 代理到账号后台
        return 'accountBg';
      },
    },
    {
      key: 'doAutoSaveFilesInMail',
      priorityConfig: ['low', 30 * 1000],
      proxyTarget(page, isMainAccount, env) {
        // 只在前台页面设置代理
        if (page !== 'frontPage' || env !== 'electron') {
          return null;
        }
        // 如果是主账号 代理到数据后台
        if (isMainAccount) {
          return 'dataBg';
        }
        // 如果是从属账号 代理到账号后台
        return 'accountBg';
      },
    },
    {
      key: 'saveMails',
      priorityConfig: ['low', 30 * 1000],
      proxyTarget(page, isMainAccount, env) {
        // 只在前台页面设置代理
        if (page !== 'frontPage' || env !== 'electron') {
          return null;
        }
        // 如果是主账号 代理到数据后台
        if (isMainAccount) {
          return 'dataBg';
        }
        // 如果是从属账号 代理到账号后台
        return 'accountBg';
      },
    },
    {
      key: 'clearExpiredMails',
      priorityConfig: ['low', 30 * 1000],
      proxyTarget(page, isMainAccount, env) {
        // 只在前台页面设置代理
        if (page !== 'frontPage' || env !== 'electron') {
          return null;
        }
        // 如果是主账号 代理到数据后台
        if (isMainAccount) {
          return 'dataBg';
        }
        // 如果是从属账号 代理到账号后台
        return 'accountBg';
      },
    },
  ],
  /**
   *
   * @descript: 如果是主界面下从属账, 代理到账号后台.其他场景不代理
   */
  proxyTarget(page, isMainAccount, env) {
    if (env !== 'electron') {
      return null;
    }
    if (page === 'frontPage' && !isMainAccount) {
      return 'accountBg';
    }
    return null;
  },
};

// const contactApi = (apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown) as ContactAndOrgApi;

const contactBrideProxyConfig: ModuleApiProxyConfig = {
  target() {
    return masterApi.requireLogicalApi(apis.contactApiImpl);
  },
  namespace: apis.contactApiImpl,
  apis: [
    /**
     * contactApi
     */
    'doUpdateContact',
    'doDeleteContact',
    'doInsertContact',
    'uploadIcon',
    'doInsertOrReplacePersonal',
    'doGetContactByItem',
    'doGetServerContactByYunxin',
    'doGetContactByOrgIds',
    'doGetContactByOrgId',
    'doGetPersonalContact',
    'getRecentContactList',
    'addRecentContact',
    'getMaillistMember',
    'createMaillist',
    'updateMaillist',
    'deleteMaillist',
    'listUserDomain',
    'listUserMaillist',
    'getMaillist',
    'getMaillistConfig',
    'checkMaillistAccountName',
    'doSearchTeamContact',
    'doSearchAllContact',
    'doSearchContact',
    'doGetContactById',
    'doGetOrgContactListByIM',
    'doGetOrgContactListByTeamId',
    'doUpdateContactById',
    'doUpdateContactModel',
    /**
     * orgApi
     */
    'doGetContactOrg',
    'doGetContactInMailList',
    'doGet',
    'doGetOrgList',
    'doGetTeamList',
    'getContactSyncTimes',
    'doGetAllContactList',
    'doGetAllOrgContact',
    'doGetOrgContactListByOrgId',
    'doGetPersonalOrg',
    'doDeletePersonalOrg',
    'doInsertPersonalOrg',
    'doUpdatePersonalOrg',
    'doGetPersonalOrgContactByOrgId',
    'doInsertContactByPersonalOrgId',
    {
      key: 'doGetBKContactReady',
      proxyTarget(page, isMainAccount) {
        if (page === 'frontPage') {
          return isMainAccount ? 'dataBg' : 'accountBg';
        }
        return null;
      },
    },
    {
      key: 'setEDMSync',
      proxyTarget(page) {
        if (page === 'frontPage') {
          return 'dataBg';
        }
        return null;
      },
    },
    {
      key: 'syncAll',
      proxyTarget(page, isMainAccount) {
        if (!isMainAccount) {
          return 'accountBg';
        }
        console.log('[bridge]config.syncall page:', page);
        return null;
      },
    },
    {
      key: 'doSyncCustomer',
      priorityConfig: ['high', 3 * 60 * 1000],
      proxyTarget(page) {
        if (page === 'frontPage') {
          return 'dataBg';
        }
        return null;
      },
    },
    {
      key: 'doSearchNew',
      funcname: 'doSearchInMemory',
      backup(err: CustomError) {
        // @todo
        // const _apiname = getShouldInitMemoryDBInMainPage() ? 'doSearchInMemory' : '_$doSearchNew';
        const _apiname = '_$doSearchNew';

        // eslint-disable-next-line
        // @ts-ignore
        const $tempMethod = masterApi.requireLogicalApi(apis.contactApiImpl)[_apiname];
        if (typeof $tempMethod !== 'function') {
          throw err;
        }

        const dataTrackerApi = masterApi.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;

        dataTrackerApi.track('pc_contact_search_error', {
          msg: lodashGet(err, 'message', ''),
          keyword: lodashGet(err, 'config.args[0].query', ''),
          recordSubAccount: false,
        });

        const { args } = err.config;
        // eslint-disable-next-line
        // @ts-ignore
        return masterApi.requireLogicalApi(apis.contactApiImpl)[_apiname](...args);
      },
      proxyTarget(page, isMainAccount, env) {
        if (page !== 'frontPage' || env !== 'electron') {
          return null;
        }
        console.log('[xxx]', isMainAccount, env);
        return 'dataBg';
      },
    },
    {
      key: 'doGetContactByEmail',
      funcname: 'doGetContactByEmailInMemoryMode',
      enableProxy: process.env.BUILD_ISLINGXI && !process.env.BUILD_ISWEB,
      backup(err: CustomError) {
        const _apiname = '_$doGetContactByEmail';

        // eslint-disable-next-line
        // @ts-ignore
        const $tempMethod = masterApi.requireLogicalApi(apis.contactApiImpl)[_apiname];
        if (typeof $tempMethod !== 'function') {
          throw err;
        }
        const { args } = err.config;
        // eslint-disable-next-line
        // @ts-ignore
        return masterApi.requireLogicalApi(apis.contactApiImpl)[_apiname](...args);
      },
      proxyTarget(page, isMainAccount, env) {
        if (page !== 'frontPage' || env !== 'electron') {
          return null;
        }
        if (isMainAccount) {
          return 'dataBg';
        }
        return 'accountBg';
      },
    },
  ],
  proxyTarget(page, isMainAccount, env) {
    console.log('[bridge]proxy.env:', env);
    if (env !== 'electron') {
      return null;
    }
    if (page === 'frontPage' && !isMainAccount) {
      return 'accountBg';
    }
    return null;
  },
};

const edmRoleBrideProxyConfig: ModuleApiProxyConfig = {
  target() {
    return masterApi.requireLogicalApi(apis.edmRoleApiImpl);
  },
  namespace: apis.edmRoleApiImpl,
  apis: [
    /**
     * edmRoleApi
     */
    {
      key: 'setBKEdmRoleData',
      proxyTarget(page) {
        if (page === 'frontPage') {
          return 'dataBg';
        }
        return null;
      },
    },
  ],
  proxyTarget(page, isMainAccount, env) {
    console.log('[bridge]proxy.env:', env);
    if (page === 'frontPage' && !isMainAccount) {
      return 'accountBg';
    }
    return null;
  },
};

const storeBridgeProxyConfig: ModuleApiProxyConfig = {
  target() {
    return masterApi.requireDataStoreApi(apis.defaultDataStoreApiImpl);
  },
  namespace: apis.defaultDataStoreApiImpl,
  apis: ['put', 'get', 'del', 'clear'],
  proxyTarget(page, isMainAccount, env) {
    if (env !== 'electron') {
      return null;
    }
    if (page === 'frontPage' && !isMainAccount) {
      return 'accountBg';
    }
    return null;
  },
};
const mailConfBridgeProxyConfig: ModuleApiProxyConfig = {
  target() {
    return masterApi.requireLogicalApi(apis.mailConfApiImpl);
  },
  namespace: apis.mailConfApiImpl,
  apis: ['setMailSenderName', 'getMailSenderInfo'],
  proxyTarget(page, isMainAccount, env) {
    if (env !== 'electron') {
      return null;
    }
    if (page === 'frontPage' && !isMainAccount) {
      return 'accountBg';
    }
    return null;
  },
};

const signatureBridgeProxyConfig: ModuleApiProxyConfig = {
  target() {
    return masterApi.requireLogicalApi(apis.mailSignatureImplApi);
  },
  namespace: apis.mailSignatureImplApi,
  apis: ['doGetSignList', 'doDeleteSign', 'doSetDefaultSign', 'doAddSign', 'doUpdateSign', 'doGetSignPreview', 'doGetSignTemplateAndProfile', 'doGetDefaultSign'],
  proxyTarget(page, isMainAccount, env) {
    if (env !== 'electron') {
      return null;
    }
    if (page === 'frontPage' && !isMainAccount) {
      return 'accountBg';
    }
    return null;
  },
};

const templateBridgeProxyConfig: ModuleApiProxyConfig = {
  target() {
    return masterApi.requireLogicalApi(apis.mailTemplateImplApi);
  },
  namespace: apis.mailTemplateImplApi,
  apis: ['doGetMailTemplateList', 'doDeleteMailTemplate', 'doSaveMailTemplate', 'doSaveMailTemplateUseTime', 'doGetMailTemplateDetail'],
  proxyTarget(page, isMainAccount, env) {
    if (env !== 'electron') {
      return null;
    }
    if (page === 'frontPage' && !isMainAccount) {
      return 'accountBg';
    }
    return null;
  },
};

const fileBridgeProxyConfig: ModuleApiProxyConfig = {
  target() {
    return masterApi.getFileApi();
  },
  namespace: apis.defaultFileApi,
  apis: ['download', 'saveDownload', 'saveZip', 'getFileInfo', 'testLocalFile', 'show', 'delFileInfo', 'getFsDownloadStatus'],
  proxyTarget(page, isMainAccount, env) {
    if (env !== 'electron') {
      return null;
    }
    if (page === 'frontPage' && !isMainAccount) {
      return 'accountBg';
    }
    return null;
  },
};

const taskBridgeProxyConfig: ModuleApiProxyConfig = {
  target() {
    return masterApi.requireLogicalApi(apis.taskMailImplApi);
  },
  namespace: apis.taskMailImplApi,
  apis: ['doGetTaskMailContent', 'getTaskMailInDb', 'doUrgeTask', 'doOperateTask'],
  proxyTarget(page, isMainAccount, env) {
    if (env !== 'electron') {
      return null;
    }
    if (page === 'frontPage' && !isMainAccount) {
      return 'accountBg';
    }
    return null;
  },
};

const icsBridgeProxyConfig: ModuleApiProxyConfig = {
  target() {
    return masterApi.requireLogicalApi(apis.icsApiImpl);
  },
  namespace: apis.icsApiImpl,
  apis: ['doGetIcsInfo', 'doOperateIcs'],
  proxyTarget(page, isMainAccount, env) {
    if (env !== 'electron') {
      return null;
    }
    if (page === 'frontPage' && !isMainAccount) {
      return 'accountBg';
    }
    return null;
  },
};

const res = process.env.BUILD_ISEDM
  ? [
      mailBridgeProxyConfig,
      dbBrideProxyConfig,
      contactBrideProxyConfig,
      edmRoleBrideProxyConfig,
      storeBridgeProxyConfig,
      signatureBridgeProxyConfig,
      mailConfBridgeProxyConfig,
      templateBridgeProxyConfig,
      fileBridgeProxyConfig,
      taskBridgeProxyConfig,
      icsBridgeProxyConfig,
    ]
  : [
      mailBridgeProxyConfig,
      dbBrideProxyConfig,
      contactBrideProxyConfig,
      storeBridgeProxyConfig,
      signatureBridgeProxyConfig,
      mailConfBridgeProxyConfig,
      templateBridgeProxyConfig,
      fileBridgeProxyConfig,
      taskBridgeProxyConfig,
      icsBridgeProxyConfig,
    ];

export default res;
