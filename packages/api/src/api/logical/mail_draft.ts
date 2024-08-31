import { Api } from '../_base/api';
import { MailEntryModel } from './mail';

export interface DeleteDraftMailByCidRes {
  success: boolean;
  data?: number;
  message?: string;
}

export interface ReplaceDraftMailByCidRes {
  success: boolean;
  data?: MailEntryModel[];
  message?: string;
}

export interface ClearDraftMailRes {
  success: boolean;
  data?: number;
  message?: string;
}

export interface GetLatestedDraftByCidRes {
  success: boolean;
  data?: MailEntryModel;
  message?: string;
}

export interface MailDraftApi extends Api {
  getDraftMailCount(): Promise<number>;
  getAllDraftMail(): Promise<Map<number, MailEntryModel[]>>;
  deleteDraftMailByCid(cid: string | string[]): Promise<DeleteDraftMailByCidRes>;
  replaceDraftMailByCid(cid: string, replaceCid: string): Promise<ReplaceDraftMailByCidRes>;
  clearDraftMail(): Promise<ClearDraftMailRes>;
  recoverDraft(draft: MailEntryModel): Promise<void>;
  getLatestedDraftByCid(cid: string): Promise<GetLatestedDraftByCidRes>;
}
