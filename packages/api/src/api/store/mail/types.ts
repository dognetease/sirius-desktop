import { MailEntryModel, TagManageOps } from '@/api/logical/mail';
import { SystemEvent } from '@/api/data/event';

export interface UpdateMailTagPayload {
  params: any;
  type: TagManageOps;
  _account?: string;
}

// 空实现，真正的实现在 UI 层，通过注入实现
export interface StoreMailOps {
  updateMailModelEntriesFromDb: (ev: SystemEvent) => void;
  updateMailEntities: (list: MailEntryModel[]) => void;
  updateMailEntity: (ev: SystemEvent) => void;
  updateMailTag: (payload: UpdateMailTagPayload) => void;
  resetMailWithDraft: (payload: { cid: string }) => void;
}
