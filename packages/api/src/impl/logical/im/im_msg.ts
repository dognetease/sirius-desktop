// import {
//   Observable, of, switchMap,
// } from 'rxjs';
// import { timeout } from 'rxjs/operators';
// import { NIMApi, IMMessage } from '@/api/logical/im';
// import { IM_STREAM } from '@/api/logical/im_stream';

// export class IM_MSG implements IM_STREAM {
//   getSubject(): Observable<unknown> | null {
//     throw new Error('Method not implemented.');
//   }

//   static FILE_TYPE = ['file', 'video', 'audio', 'image'];

//   private sdk: NIMApi | null;

//   private msglistFromPullObservable:Observable<IMMessage[]>|null=null

//   private msglistFromEventObservable:Observable<IMMessage[]> | null=null

//   private msglistFromSendObservable:Observable<IMMessage[]> | null=null

//   init(sdk: NIMApi): void {
//     this.sdk = sdk;
//     this.initPullMsg();
//     this.initMsgEvents();
//     this.initMsgOperation();
//   }

//   private initPullMsg() {
//     const pullMsgFrom = async (sessionId:string) => {
//       const list = await this.sdk?.excute('getLocalMsgs', {
//         sessionId,
//         limit: 30
//       });
//       return list;
//     };

//     this.sdk!.currentSession.getSubject()!.pipe(
//       switchMap(sessionId => pullMsgFrom(sessionId as string)),
//       timeout(3000)
//     );
//   }

//   private initMsgEvents() {
//     this.msglistFromEventObservable;
//   }

//   private initMsgOperation() {
//     // const sendMsgEvent=()=>{

//     // }
//     // const sendMsgEventObservable=fromEventPattern()
//   }
// }
