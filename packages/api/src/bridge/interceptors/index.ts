import { TimeoutRangeInterceptor } from './common/timeoutRangeInterceptor';
import { ForbiddenRetryInterceptor } from './common/commonRetryInterceptor';
import { DBRetryInterceptor } from './db/dexieRetryInterceptor';
import { DexieUpdateargsInterceptor } from './db/dexieUpdateaArgsInterceptor';
import { DBFrequentInvokeInterceptor } from './db/dexieFrequentInvokeInterceptor';
import { MailElectronInterceptor } from './mail/mailElectronInterceptor';
import { MailUpdateResponseInterceptor } from './mail/mailUpdateInterceptorInteceptor';
import { apis } from '@/config';

export default {
  common: [TimeoutRangeInterceptor, ForbiddenRetryInterceptor],
  [apis.dbInterfaceApiImpl]: [DBRetryInterceptor, DexieUpdateargsInterceptor, DBFrequentInvokeInterceptor],
  [apis.mailApiImpl]: [MailElectronInterceptor, MailUpdateResponseInterceptor],
  [apis.contactApiImpl]: [
    // ContactSyncReduxInterceptor
  ],
  // [apis.defaultDataStoreApiImpl]: [PreventUserPutInterceptor]
};
