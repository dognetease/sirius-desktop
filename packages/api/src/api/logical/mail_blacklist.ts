import { Api } from '../_base/api';

export interface MailBlacklistApi extends Api {
  setBlacklist(): Promise<string>;
  addBlacklist(email: string): Promise<boolean>;
}
