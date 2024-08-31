import { apis } from '@/config';
import { AppendInterceptorApi, InterceptorApi, InterceptorRequestConfig, InterceptorResponseConfig } from '../../interface/interceptor';
// import { MailEntryModel, MailModelEntries } from '@/api/logical/mail';

// const isTopTaskMail = (mail?: MailEntryModel) => mail && mail.taskId && mail.entry.taskTop;
//
// const delTaskMails = (models: MailEntryModel[]): {delCount: number, list: MailEntryModel[]} => {
//   let delCount = 0;
//   const MAX = 2;
//   while (delCount < MAX) {
//     const needDel = isTopTaskMail(models[0]);
//     if (needDel) {
//       delCount += 1;
//       models.shift();
//     } else {
//       return { list: models, delCount };
//     }
//   }
//   return { list: models, delCount };
// };
//
// const filterMailListRes = (res?: MailEntryModel[] | MailModelEntries) => {
//   if (!res) {
//     return res;
//   }
//   if (Array.isArray(res)) {
//     const listRes = delTaskMails(res as MailEntryModel[]).list;
//     return listRes;
//   }
//   const modelRes = res as MailModelEntries;
//   const delData = delTaskMails(modelRes.data);
//   modelRes.data = delData.list;
//   modelRes.total -= delData.delCount;
//   modelRes.count -= delData.delCount;
//   return modelRes;
// };

// 修改邮件
export class MailUpdateResponseInterceptor implements AppendInterceptorApi {
  /**
   * @param interceptors {Interceptor[]} request拦截器实例 & repsonse拦截器
   */
  constructor(interceptors: [InterceptorApi<InterceptorRequestConfig>, InterceptorApi<InterceptorResponseConfig>]) {
    const [, responseInterceptor] = interceptors;

    // 如果调用的服务是
    responseInterceptor.use({
      namespace: apis.mailApiImpl,
      async resolve(res) {
        const { apiname, namespace } = res.config;
        if (namespace !== apis.mailApiImpl) {
          return res;
        }
        const { data: mailResponseData } = res;
        // 修改数据结果
        if (apiname === 'doListMailBoxEntities') {
          console.log('[bridge.interceptor]mail.doListMailBoxEntities', mailResponseData);
          // res.data = filterMailListRes(res.data as (MailEntryModel[] | MailModelEntries));
        } else if (apiname === 'doListMailEntitiesFromDb') {
          console.log('[bridge.interceptor]mail.doListMailEntitiesFromDb', mailResponseData);
          // res.data = filterMailListRes(res.data as (MailModelEntries | undefined));
        } else if (apiname === 'doListMailBox') {
          console.log('[bridge.interceptor]mail.doListMailBox', mailResponseData);
          // 测试代码
          // (mailResponseData as unknown[]).splice(0, 10);
        }
        return res;
      },
    });
  }

  eject() {
    console.log('eject');
  }
}
/** ***********DB操作相关拦截器end*********** */
