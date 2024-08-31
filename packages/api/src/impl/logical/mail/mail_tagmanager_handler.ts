// import { ActionStore } from './mail_action_store_model';
// import { api } from '../../../api/api';
// import { MailModelHandler } from './mail_entry_handler';
// import { MailContactHandler } from './mail_obtain_contact_handler';
// import { FileApi } from '../../../api/system/fileLoader';
import { MailAbstractHandler } from './mail_abs_handler';
// import { ErrorReportApi } from '../../../api/logical/errorReport';
// import { apis } from '../../../config';
//
// /**
//  * 文件夹处理
//  */
export class MailFolderHandler extends MailAbstractHandler {
  //   fileApi: FileApi;
  //   errReportApi: ErrorReportApi;
  //   static debugMailPopWindow: boolean = false;
  //
  //   constructor(
  //     actions: ActionStore,
  //     modelHandler: MailModelHandler,
  //     contactHandler: MailContactHandler
  //   ) {
  //     super(actions, modelHandler, contactHandler);
  //     this.fileApi = api.getFileApi();
  //     this.errReportApi = (api.requireLogicalApi(
  //       apis.errorReportImpl
  //     ) as unknown) as ErrorReportApi;
  //   }
  //
  //   // 请求评论列表
  //   async requestTaglist() {
  //     const key = 'getTaglist';
  //     const url = this.buildUrl(key);
  //   }/**/
}
