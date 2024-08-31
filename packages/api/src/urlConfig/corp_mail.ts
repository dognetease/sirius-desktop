import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class CorpMailUrl {
  // #region corp邮箱相关接口

  corpMailGetAllFolders: string = host + config('corpMailGetAllFolders');

  corpMailListMessages: string = host + config('corpMailListMessages');

  corpMailReadMessage: string = host + config('corpMailReadMessage');

  corpMailComponse: string = host + config('corpMailComponse');

  corpMailCancel: string = host + config('corpMailCancel');

  corpMailImmediateDeliver: string = host + config('corpMailImmediateDeliver');

  corpMailDeleteMail: string = host + config('corpMailDeleteMail');

  corpMailReplyMail: string = host + config('corpMailReplyMail');

  corpMailForwardMessages: string = host + config('corpMailForwardMessages');

  corpMailSearchMessages: string = host + config('corpMailSearchMessages');

  corpMailUpdateMessageInfos: string = host + config('corpMailUpdateMessageInfos');

  corpMailListThreads: string = host + config('corpMailListThreads');

  corpMailGetThreadMessageInfos: string = host + config('corpMailGetThreadMessageInfos');

  corpMailMarkSeen: string = host + config('corpMailMarkSeen');

  corpMailCreateSign: string = host + config('corpMailCreateSign');

  corpMailDeleteSign: string = host + config('corpMailDeleteSign');

  corpMailUpdateSign: string = host + config('corpMailUpdateSign');

  corpMailGetSign: string = host + config('corpMailGetSign');

  corpMailGetUserAttrs: string = host + config('corpMailGetUserAttrs');

  corpMailUploadPrepare: string = host + config('corpMailUploadPrepare');

  corpMailUpload: string = host + config('corpMailUpload');

  corpMailListDeliverHistory: string = host + config('corpMailListDeliverHistory');

  corpMailRecallMessage: string = host + config('corpMailRecallMessage');

  corpMailEmptyFolder: string = host + config('corpMailEmptyFolder');

  corpMailListTags: string = host + config('corpMailListTags');

  corpMailManageTags: string = host + config('corpMailManageTags');

  corpMailUpdateMessageTags: string = host + config('corpMailUpdateMessageTags');

  corpMailUpdateThreadTags: string = host + config('corpMailUpdateThreadTags');

  corpMailCancelDeliver: string = host + config('corpMailCancelDeliver');

  corpMailGetMessageIfnos: string = host + config('corpMailGetMessageIfnos');

  corpMailSetUserAttrs: string = host + config('corpMailSetUserAttrs');

  corpMailRestoreDraft: string = host + config('corpMailRestoreDraft');

  corpMailEditMessage: string = host + config('corpMailEditMessage');

  corpMailUserAuth2: string = host + config('corpMailUserAuth2');

  corpMailGetAlias: string = host + config('corpMailGetAlias');

  corpMailGetComposeInfo: string = host + config('corpMailGetComposeInfo');

  corpMailGetMessageData: string = host + config('corpMailGetMessageData');

  corpMailGetTmpAttachment: string = host + config('corpMailGetTmpAttachment');

  corpMailCancelCompose: string = host + config('corpMailCancelCompose');

  corpMailGetPackData: string = host + config('corpMailGetPackData');

  corpCreateUserFolder: string = host + config('corpCreateUserFolder');

  corpUpdateUserFolder: string = host + config('corpUpdateUserFolder');

  corpDeleteUserFolder: string = host + config('corpDeleteUserFolder');

  corpStatsFolder: string = host + config('corpStatFolders');

  corpParseIcsFile: string = host + config('corpIcsParse');

  corpExchangeMails: string = host + config('corpExchangeMails');

  // #endregion
}
export type CorpMailUrlKeys = keyof CorpMailUrl;
const urlConfig = new CorpMailUrl();
const urlsMap = new Map<CorpMailUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as CorpMailUrlKeys, urlConfig[item as CorpMailUrlKeys]);
});
export default urlsMap;
