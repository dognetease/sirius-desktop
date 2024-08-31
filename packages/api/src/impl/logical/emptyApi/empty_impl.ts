import { apis } from '../../../config';
import { api } from '../../../api/api';
import { Api } from '@/index';

class EmptyApiImpl implements Api {
  name: string;

  constructor() {
    this.name = apis.emptyApiImpl;
  }
  init() {
    return this.name;
  }
}

const emptyApi: Api = new EmptyApiImpl();

api.registerLogicalApi(emptyApi);

export default emptyApi;
