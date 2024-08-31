export type edmToEdmAction = 'customsDetail' | 'readEmailDetail' | 'replyEmail' | 'transEmail' | 'createAuthorization' | 'showAuthInfo' | 'showAppendix' | 'previewImage';
export interface edmToReadDetail {
  snapshotId: string;
  condition: string;
  mainResourceId: string;
}
export interface edmToReplyEmail {
  mail_id: string;
  isAll: boolean;
}

// { snapshotId: string; condition: string; mainResourceId: string; } |  {mail_id: string, isAll: boolean }
export interface edmToEdmApiCustomEventHandle {
  action: edmToEdmAction;
  payload: any;
}
