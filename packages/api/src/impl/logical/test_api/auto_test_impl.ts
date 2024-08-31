import { apis } from '../../../config';
import { api } from '../../../api/api';
// import { ApiRequestConfig } from '../../../api/data/http';
import { Api } from '@/api/_base/api';

export class AutoTestApi implements Api {
  name = apis.autoTestApi;

  init() {
    return this.name;
  }

  afterLoadFinish() {
    if (window.Cypress) {
      setTimeout(() => {
        window.appReady = true;
      }, 3000);
    }
    return this.name;
  }
}

const siteApiImpl = new AutoTestApi();
api.registerLogicalApi(siteApiImpl);
export default siteApiImpl;
