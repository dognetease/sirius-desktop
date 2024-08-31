import { AIModifyParam, AIResults, EdmContentInfo, EdmSendBoxApi, HostingInfo, HostingMailInfo, Plan, SaveHostingReq, apiHolder, apis } from 'api';
import { BasicInput } from '../AiHostingEdit';
import lodashGet from 'lodash/get';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export interface ValueMap {
  placeholder?: string;
  aiSentence?: string;
}

export interface Result {
  indexMatrix?: Array<Array<number>>;
  valueMatrix?: Array<Array<ValueMap>>;
}

export const buildBasicInputBy = (resp: SaveHostingReq) => {
  let input: BasicInput = {
    req: {
      first: false,
      company: resp.company,
      industry: resp.industry,
      companyIntro: resp.companyIntro,
      productIntros: resp.productIntros,
      language: resp.language,
    },
    name: resp.name,
    createTime: resp.createTime,
    planMode: resp.planMode,
    senderEmail: lodashGet(resp, 'multiHostingInfos.0.mailInfos.0.sendSettingInfo.senderEmail', '') || resp.senderEmail,
    senderEmails: lodashGet(resp, 'multiHostingInfos.0.mailInfos.0.sendSettingInfo.senderEmails', '') || resp.senderEmails,
    setting: {
      sender: lodashGet(resp, 'multiHostingInfos.0.mailInfos.0.sendSettingInfo.sender', '') || resp.sender,
      replyEmail: lodashGet(resp, 'multiHostingInfos.0.mailInfos.0.sendSettingInfo.replyEmail', '') || resp.replyEmail,
    },
    autoRecInfo: lodashGet(resp, 'multiHostingInfos.0.planInfo.autoRecInfo', {}),
    ruleInfo: resp.ruleInfo,
  };

  if (input.ruleInfo && resp.autoMaxSendLimit) {
    input.ruleInfo.autoMaxSendLimit = resp.autoMaxSendLimit;
  }
  if (input.ruleInfo && resp.manualMaxSendLimit) {
    input.ruleInfo.manualMaxSendLimit = resp.manualMaxSendLimit;
  }
  return input;
};

export const buildAiResultMatrix = (aiResult?: AIResults): Result => {
  if (!aiResult || aiResult.modify.length === 0) {
    return {} as Result;
  }

  let indexMatrix = new Array<Array<number>>();
  let valueMatrix = new Array<Array<ValueMap>>();

  aiResult?.modify.forEach(item => {
    let innerIndexArray = new Array<number>();
    let innerValueArray = new Array<ValueMap>();
    // 先把原始内容本身加进去
    innerIndexArray.push(0);
    innerValueArray.push({
      placeholder: item.placeholder,
      aiSentence: item.originalSentence,
    });
    item.use &&
      item.aiSentenceList?.forEach((innerItem, innerIndex) => {
        if (!innerItem.unSelected) {
          innerIndexArray.push(innerIndex + 1);
          innerValueArray.push({
            placeholder: item.placeholder,
            aiSentence: innerItem.aiSentence,
          });
        }
      });
    indexMatrix.push(innerIndexArray);
    valueMatrix.push(innerValueArray);
  });
  return {
    indexMatrix: buildIndex(indexMatrix),
    valueMatrix: valueMatrix,
  };
};

const buildIndex = (arr: Array<Array<number>>) => {
  var ans = new Array();
  dfs(arr.length, 0, arr, new Array(), ans);
  console.log('hanxu buildIndex: ' + ans);
  return ans;
};

const dfs = (n, row, arr, selected, ans) => {
  if (row == n) {
    ans.push([...selected]);
    return;
  }
  for (const value of arr[row]) {
    selected.push(value);
    dfs(n, row + 1, arr, selected, ans);
    selected.pop();
  }
};

export const getVars = (content?: string) => {
  if (!content) {
    return [];
  }
  const doc = new DOMParser().parseFromString(content, 'text/html');
  const ret: { [key: string]: number } = {};
  if (doc.body) {
    Array.from(doc.body.querySelectorAll('span.mce-lx-var'))
      .map(span => span.textContent)
      .forEach(s => {
        if (s && s.length > 2) {
          if (s.startsWith('#{') && s.endsWith('}')) {
            ret[s.substring(2, s.length - 1)] = 1;
          }
        }
      });
  }
  return Object.keys(ret);
};

export const combineMailinfoAndAiModify = (mailInfo: HostingMailInfo, basicInput?: BasicInput, modify?: Map<number, AIModifyParam>): HostingMailInfo => {
  let info = mailInfo.contentEditInfo;
  if (!info) {
    return {};
  }

  if (!info.templateParams) {
    // 生成的营销信正文可能携带变量，需要提取出来
    info.templateParams = getVars(info.emailContent).join(',');
  }
  delete info.content;

  let roundInfo: HostingMailInfo = {
    edmRoundId: undefined, // 目前没有做回显的逻辑, 所以这个id暂时不需要, 后续做回显的话, 需要从服务端拉这个字段和内容
    sendSettingInfo: {
      emailSubjects: [
        {
          subject: info.subject || '',
        },
      ],
      senderEmail: basicInput?.senderEmail,
      senderEmails: basicInput?.senderEmails,
      ...basicInput?.setting,
    },
    contentEditInfo: {
      ...info,
    },
    multipleContentInfo: modify?.get(mailInfo.roundIndex || 1) || mailInfo.multipleContentInfo,
    syncSendEmail: true,

    plan: mailInfo.plan,
  };
  return roundInfo;
};

export const uploadToNos = async (data: SaveHostingReq, deleteSource?: boolean) => {
  console.log('hanxu- uploadToNos');
  await upload(data.hostingInfo, deleteSource);
};

export const upload = async (info?: HostingInfo, deleteSource?: boolean) => {
  if (!info) {
    return;
  }
  let infos = new Array<Partial<EdmContentInfo>>();
  for (let item of info.mailInfos || []) {
    if (deleteSource) {
      item.plan = undefined;
    }
    if (item.contentEditInfo) {
      infos.push(item.contentEditInfo);
    }
    if ((item.expandHostingMailInfos?.length || 0) > 0) {
      let temp = item.expandHostingMailInfos![0].contentEditInfo;
      if (temp && (temp.emailContent?.length || 0) > 0) {
        infos.push(temp);
      }
    }
  }
  await uploadBasicMailInfoToNos(infos, deleteSource);
};

export const uploadBasicMailInfoToNos = async (infos: Array<Partial<EdmContentInfo>>, deleteSource?: boolean) => {
  for (let item of infos) {
    const resp = await edmApi.emailContentUpload({
      emailContent: item.emailContent || '',
      emailContentId: '',
    });
    item.originalEmailContentId = resp.emailContentId;
    if (deleteSource) {
      item.emailContent = undefined;
      item.content = undefined;
    }
  }
  console.log('hanxu- upload over');
};

export const isAiOn = (plan?: Plan): boolean => {
  if (!plan) {
    return false;
  }
  if (plan.aiOn) {
    return true;
  }
  return false;
};

export const hasAiModifyContent = (plan?: Plan): boolean => {
  if (plan?.aiResult) {
    return true;
  }
  return false;
};
