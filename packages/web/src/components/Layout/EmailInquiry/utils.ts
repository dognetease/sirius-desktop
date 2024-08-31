import { apiHolder as api, MailApi, apis, ResponseMailContentEntry, MailEntryModel } from 'api';
import { getMailContentText } from '@web-edm/send/utils/getMailContentText';

const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;

export interface PraseMailContentOption {
  mid: string;
  rawContent: ResponseMailContentEntry;
}
export const handleRawMailContents = async (contents: PraseMailContentOption[]) =>
  Promise.all(contents.map(({ mid, rawContent }) => mailApi.handleRawMailContent(mid, rawContent)));

export const parseMailContent = (content: MailEntryModel) => getMailContentText(content.entry.content.content);
