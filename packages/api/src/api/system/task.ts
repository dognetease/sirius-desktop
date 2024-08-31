import { Api, resultObject } from '../_base/api';

export interface TaskEntity {
  id?: number;
  account: string;
  action: 'AfterLogin';
  from: 'mail_push' | 'im_push';
  to: 'mail' | 'im';
  expired?: number;
  createTime?: number;
  content: resultObject;
}

export interface ContactSyncTaskEntity {
  from: string;
  domain: string;
  account: string;
  source: 'lingxi' | 'qiye' | 'unknown';
  expiredTime: number;
  // pageSize:number,
  pageIndex?: number;
  totalPage?: number;
  isAll?: boolean;
  lastMaxId?: string;
  step?: 'core' | 'all' | 'increase';
  done?: boolean;
  // 增量更新重试次数
  retryTimes?: number;
  coreCount?: number;
}

export interface TaskApi extends Api {
  doCreateTask(params: TaskEntity): Promise<any>;
  doUpdateContactSyncTask(params: Omit<ContactSyncTaskEntity, 'expiredTime'>): Promise<ContactSyncTaskEntity>;

  doDeleteContactSyncTask(params: Pick<ContactSyncTaskEntity, 'account' | 'domain' | 'from' | 'isAll'>): Promise<void>;

  getContactSyncTask(params: Pick<ContactSyncTaskEntity, 'account' | 'domain' | 'from'>): Promise<ContactSyncTaskEntity>;

  getContactDoneStep(param: ContactSyncTaskEntity | undefined): 'none' | 'core' | 'all' | 'increase';
}
