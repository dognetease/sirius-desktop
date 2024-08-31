// // 屏蔽IM功能
// import lodashGet from 'lodash/get';
// import { api as masterApi } from '@/api/api';
// import { apis, isElectron } from '@/config';
// import { MailApi } from '@/api/logical/mail';
// import {
//   BRIDGE_RESPONSE_CODE,
//   BRIDGE_RESPONSE_TYPE,
// } from '../../interface/common';
// import {
//   AppendInterceptorApi, InterceptorApi, InterceptorRequestConfig, InterceptorResponseConfig
// } from '../../interface/interceptor';
// import { DispatchTaskRequestContent as TaskConfig } from '../../interface/proxy';
// import { CustomError } from '../../config/bridgeError';

// // mail的代理方法只能在electron中执行
// export class ContactBlockIMInterceptor implements AppendInterceptorApi {
//   /**
//    * @param interceptors {Interceptor[]} request拦截器实例 & repsonse拦截器
//    * @param target
//    */

//   constructor(interceptors: [InterceptorApi<InterceptorRequestConfig>, InterceptorApi<InterceptorResponseConfig>]) {
//     const [, responseInterceptor] = interceptors;

//     responseInterceptor.use({
//       namespace: apis.contactApiImpl,
//       async resolve(res) {
//         const namespace = lodashGet(res, 'config.namespace', '');
//         const dbName = lodashGet(res, 'config.args[0].dbName', '');
//         const tableName = lodashGet(res, 'config.args[0].tableName', '');
//         const apiname=lodashGet(res,'config.apiname','')
//         const disableBlockIM=[()=>{
//           return namespace!=='contactApiImpl'
//         },()=>{
//           return dbName !== 'contact_dexie'
//         },()=>{
//           return tableName !== 'contact'
//         },()=>{
//           return !['getByRangeCondition'].includes(apiname)
//         },()=>{
//           // 返回结果中包含IM相关字段
//           const disableAccount=
//         },()=>{
//           return namespace!=='contactApiImpl'
//         },()=>{
//           return namespace!=='contactApiImpl'
//         }].some((call)=>{
//           return call()
//         })
//         if (namespace !== 'contactApiImpl' || dbName !== 'contact_dexie' || tableName !== 'contact') { return res; }

//         return res;
//       }
//     });
//   }

//   eject() {}
// }
// /** ***********DB操作相关拦截器end*********** */
