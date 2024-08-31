import { apiHolder, apis, EdmProductDataApi, EdmSendBoxApi, MailApi, SubjectInfo, SubjectTagInfo, SubjectId } from 'api';

import toast from '@web-common/components/UI/Message/SiriusMessage';
import { DetailTabOption, getTabConfig } from './detailEnums';
import { EdmDetailOperateType, edmDataTracker } from '../tracker/tracker';
import { getIn18Text } from 'api';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const systemApi = apiHolder.api.getSystemApi();

// MARK: - Track

export const getTrackTabName = (tab: DetailTabOption) => {
  let tabName = '';
  switch (tab) {
    case DetailTabOption.Marketing:
      tabName = 'all';
      break;
    case DetailTabOption.Receiver:
      tabName = 'send';
      break;
    case DetailTabOption.Sended:
      tabName = 'arrive';
      break;
    case DetailTabOption.Open:
      tabName = 'open';
      break;
    case DetailTabOption.Reply:
      tabName = 'reply';
      break;
    case DetailTabOption.Unsub:
      tabName = 'unsubscribe';
      break;
  }
  return tabName;
};

export const trackEdmDetailOperation = (tab: DetailTabOption) => {
  edmDataTracker.trackEdmDetailOperation(EdmDetailOperateType.Tab, {
    tab: getTrackTabName(tab),
  });
};
export const traceEdmDetailOptionView = (tab: DetailTabOption) => {
  edmDataTracker.trackEdmDetailOperation(EdmDetailOperateType.View, {
    buttonname: getIn18Text('DAOCHU'),
    tab: getTrackTabName(tab),
  });
};

export const trackResend = (tab: DetailTabOption, config: any) => {
  let buttonType = 'sendagain';
  if (config.copyHeader) {
    buttonType = 'quote_header';
  } else if (config.copyContent) {
    buttonType = 'quote_content';
  }

  let key = getTabConfig(tab).detailValueKey;
  key && edmDataTracker.trackResendEdm(key, buttonType);
};

// MARK: - Helper
// 回复率 ＞ 打开率 ＞ 送达率
export const findTagToShow = (info: SubjectInfo) => {
  let resp = info.tagList?.filter(tag => tag.tagId === SubjectId.replyRate)[0];
  if (resp) {
    return resp;
  }

  resp = info.tagList?.filter(tag => tag.tagId === SubjectId.openRate)[0];
  if (resp) {
    return resp;
  }

  resp = info.tagList?.filter(tag => tag.tagId === SubjectId.sendRate)[0];
  return resp;
};

export const findThemeColor = (info: SubjectInfo) => {
  const item = findTagToShow(info);
  switch (item?.tagId) {
    case SubjectId.sendRate:
      return { titleColor: '#FFFFFF', bgColor: '#0FD683' };
    case SubjectId.openRate:
      return { titleColor: '#FFFFFF', bgColor: '#FFB54C' };
    case SubjectId.replyRate:
      return { titleColor: '#FFFFFF', bgColor: '#00C4D6' };
    default:
      return {};
  }
};

export const findTagThemeColor = (item: SubjectTagInfo) => {
  switch (item.tagId) {
    case SubjectId.sendRate:
      return { titleColor: '#478E83', bgColor: '#E7FBF3' };
    case SubjectId.openRate:
      return { titleColor: '#CC913D', bgColor: '#FFF3E2' };
    case SubjectId.replyRate:
      return { titleColor: '#1D9FAB', bgColor: '#E5F9FB' };
    default:
      return {};
  }
};

export const themeSimpleText = (tag?: SubjectTagInfo) => {
  switch (tag?.tagId) {
    case SubjectId.sendRate:
      return getIn18Text('GAOSONGDA');
    case SubjectId.openRate:
      return getIn18Text('GAODAKAI');
    case SubjectId.replyRate:
      return getIn18Text('GAOHUIFU');
    default:
      return '';
  }
};

// 退信场景需要加 isBounced 参数进行区分！
export const openMail = (emailId?: string, edmEmailId?: string, operateId?: string, bounceId?: string, isBounced: boolean = false, isPrivilege?: boolean) => {
  if (emailId) {
    edmApi.getEmailIdByInternalId(emailId).then(data => {
      if (data.code === 'S_OK' && data.var && data.var.length) {
        const { id } = data.var[0];
        if (systemApi.isElectron()) {
          systemApi.createWindowWithInitData('readMail', { eventName: 'initPage', eventData: id });
        } else {
          window.open(`/readMail/?id=${id}`, 'readMail', 'menubar=0,scrollbars=1,resizable=1,width=800,height=600');
        }
      } else if (edmEmailId && operateId) {
        // 当前账号邮箱不是回复邮箱
        if (systemApi.isElectron()) {
          systemApi.createWindowWithInitData('readMail', { eventName: 'initPage', eventData: { id: emailId, edmEmailId, operateId, isPrivilege } });
        } else {
          window.open(
            `/readMail/?edmEmailId=${edmEmailId}&operateId=${operateId}&id=${emailId}&isPrivilege=${isPrivilege}`,
            'readMail',
            'menubar=0,scrollbars=1,resizable=1,width=800,height=600'
          );
        }
      } else {
        toast.error({ content: getIn18Text('WUFATIAOZHUAN\uFF0CQINGDAOSHOUJIANXIANGZHONGCHAKAN\u3002') });
      }
    });
  } else if (edmEmailId && operateId) {
    // 当前账号邮箱不是回复邮箱
    if (systemApi.isElectron()) {
      systemApi.createWindowWithInitData('readMail', { eventName: 'initPage', eventData: { id: emailId, edmEmailId, operateId } });
    } else {
      window.open(`/readMail/?edmEmailId=${edmEmailId}&operateId=${operateId}&id=${emailId}`, 'readMail', 'menubar=0,scrollbars=1,resizable=1,width=800,height=600');
    }
  } else if (edmEmailId && bounceId) {
    // 查看营销退信
    if (systemApi.isElectron()) {
      systemApi.createWindowWithInitData('readMail', { eventName: 'initPage', eventData: { id: bounceId, edmEmailId, bounceId, isBounced } });
    } else {
      window.open(
        `/readMail/?edmEmailId=${edmEmailId}&bounceId=${bounceId}&id=${bounceId}&isBounced=${isBounced}`,
        'readMail',
        'menubar=0,scrollbars=1,resizable=1,width=800,height=600'
      );
    }
  } else {
    toast.error({ content: getIn18Text('WUFATIAOZHUAN\uFF0CQINGDAOSHOUJIANXIANGZHONGCHAKAN\u3002') });
    return;
  }
};

export function getSendStatusText(status: number): string {
  if (status === 0) {
    return getIn18Text('DAIFASONG');
  }
  if (status === 1) {
    return getIn18Text('YIFASONG');
  }
  if (status === 2) {
    return getIn18Text('YICHEHUI');
  }
  if (status === 3) {
    return getIn18Text('DEZHIBEIGUOLV');
  }
  if (status === 4) {
    return getIn18Text('FASONGSHIBAI');
  }
  return '-';
}
