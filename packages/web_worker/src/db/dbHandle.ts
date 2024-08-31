import { apiHolder, ContactApi, OrgApi, apis, DataMsg, DataRet, ErrMsgCodeMap } from 'api';

//const ctx: SharedWorkerGlobalScope =self as SharedWorkerGlobalScope;
const ctx = self as any;

const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;

const defaultErrInfo = 'unknow error';

function getErrMsg(errMsg: string | undefined, defaultMsg: string): string {
  if (errMsg && errMsg in ErrMsgCodeMap) {
    // @ts-ignore
    return ErrMsgCodeMap[errMsg as keyof typeof ErrMsgCodeMap];
  }
  return errMsg || defaultMsg;
}

function getError(reason: any) {
  if (reason instanceof Error) return getErrMsg(reason.message, defaultErrInfo);
  else if (typeof reason === 'string') return getErrMsg(reason, defaultErrInfo);
  else {
    return defaultErrInfo;
  }
}

const commonCatch = (reason: any) => {
  console.log(reason);
  return {
    status: '500',
    msg: getError(reason),
  };
};

ctx.addEventListener('connect', function (e: MessageEvent) {
  const port = e.ports[0];

  port.addEventListener('message', function (e: MessageEvent) {
    console.log(e);
    let workerResult: Promise<DataRet> | undefined;
    const req = e.data as DataMsg;
    switch (req.methodName) {
      case 'doGet':
        workerResult = contactApi
          .doGet(req.methodArg?.orgId as string, req.methodArg?.level as number)
          .then((res: any) => {
            return {
              status: '200',
              data: res,
            };
          })
          .catch(commonCatch);
        break;
      case 'doGetContactByOrgId':
        workerResult = contactApi
          .doGetContactByOrgId(req.methodArg?.orgId as string)
          .then((res: any) => {
            return {
              status: '200',
              data: res,
            };
          })
          .catch(commonCatch);
        break;
      case 'doSearchContact':
        workerResult = contactApi
          .doSearchContact(req.methodArg?.orgId as string)
          .then((res: any) => {
            return {
              status: '200',
              data: res,
            };
          })
          .catch(commonCatch);
        break;
      case 'syncAll':
        workerResult = contactApi
          .syncAll()
          .then((res: any) => {
            return {
              status: '200',
              data: res,
            };
          })
          .catch(commonCatch);
        break;
      default:
        console.log('not available event :', req);
        workerResult = Promise.resolve({
          status: '404',
          data: req,
          msg: 'not available event',
        });
    }
    if (workerResult)
      workerResult.then(res => {
        port.postMessage(res);
      });
  });
});
