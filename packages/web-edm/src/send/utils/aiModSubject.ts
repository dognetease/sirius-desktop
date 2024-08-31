import { apiHolder, apis, EdmSendBoxApi, MailSignatureApi, GptAiContentRefreshReq, GPTAiContentRefreshRes } from 'api';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const eventApi = apiHolder.api.getEventApi();

let taskId: string;
const query = async (req: GptAiContentRefreshReq) => {
  const res = await edmApi.getGPTAiContentRefresh(req);
  taskId = res.taskId;
  if (res.finishState === 0) {
    return await new Promise<GPTAiContentRefreshRes>((resolve, reject) => {
      try {
        setTimeout(async () => {
          const res = await query({
            ...req,
            taskId,
            first: false,
          });
          resolve(res);
        }, 1500);
      } catch (error) {
        reject(error);
      }
    });
  } else if (res.finishState === 1) {
    return res;
  } else {
    throw new Error('生成失败，请重试！');
  }

  // 失败了就不管了
  // catch(err) {
  //   query({
  //     ...req,
  //     taskId,
  //     first: taskId == null,
  //   });
  // }
};

// ai修改主题请求，抛出余额不足或者服务端错误
export const aiModSubject = async (theme: Array<string>, size: number, type: 3 | 5) => {
  if (size < 1 || size > 5) {
    return theme;
  }
  const { dayLeft } = await edmApi.getGPTQuota();
  if (dayLeft < 1) {
    throw new Error('今日剩余次数不足');
  }
  // 调用ai改写
  // const res = await new Promise((res, rej) => {
  //   setTimeout(() => {
  //     res('new theme');
  //   }, 1000);
  // });
  const res = await query({
    size,
    contentList: theme.map(item => ({ content: item })),
    type,
    first: true,
  });

  if (res.aiContentInfos == null) {
    // throw new Error('生成失败，请重试！');
    return theme;
  }

  if (type === 3) {
    return res.aiContentInfos[0].aiContentList.map(info => info.aiContent.trim() || theme[0]);
  }
  return theme.map(item => {
    let info = res.aiContentInfos!.find(info => info.content === item);
    return info?.aiContentList ? info?.aiContentList[0].aiContent : item;
  });
};

// ai次数减一的事件通知统一方法
export const aiTimesSubtract = () => {
  try {
    eventApi.sendSysEvent({ eventName: 'aiTimesUpdate' });
  } catch (err) {
    // 报错捕获后静默失败
  }
};
