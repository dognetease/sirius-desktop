import { apiHolder, apis, EdmSendBoxApi, AIModifyInfo, AIResults, AIModifyParam, EmailContentUploadRes } from 'api';

import cloneDeep from 'lodash/cloneDeep';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export const buildMailContentWithPlaceholder = (result?: AIResults): string => {
  let tempMailContent = cloneDeep(result?.mailContent) || '';

  const node = document.createElement('div');
  node.innerHTML = tempMailContent;

  result?.modify.forEach(item => {
    if (!item.id) {
      return;
    }
    const hasModifyInfo =
      item.use &&
      (
        item.aiSentenceList?.filter(item => {
          return !item.unSelected;
        }) || []
      ).length > 0;
    const temp = node.querySelector(item.id) as HTMLElement;
    if (hasModifyInfo && temp && item.placeholder) {
      temp.innerText = item.placeholder;
    }
  });
  return node.outerHTML;
};

export const constructAIModifyResult = async (result?: AIResults, onlyLocal?: boolean) => {
  let aiDynamicInfos = new Array<AIModifyInfo>();
  result?.modify.forEach(item => {
    if (item.use && item.use === true) {
      const temp: AIModifyInfo = {
        originalSentence: item.originalSentence,
        placeholder: item.placeholder,
        aiSentenceList: item.aiSentenceList
          ?.filter(item => {
            return !item.unSelected;
          })
          .map(item => {
            return { aiSentence: item.aiSentence };
          }),
      };
      aiDynamicInfos.push(temp);
    }
  });
  if (aiDynamicInfos.length === 0) {
    return undefined;
  }

  let resp: EmailContentUploadRes = { emailContentId: '' };
  if (!onlyLocal) {
    resp = await edmApi.emailContentUpload({
      emailContent: buildMailContentWithPlaceholder(result),
      emailContentId: '',
    });
  }

  const param: AIModifyParam = {
    emailContentId: resp.emailContentId,
    aiDynamicInfos: aiDynamicInfos,
  };
  return param;
};
