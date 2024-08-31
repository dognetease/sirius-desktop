import { StoreMailOps } from './types';

export const storeMailOps: StoreMailOps = {
  updateMailModelEntriesFromDb: params => {
    console.log('default implement updateMailModelEntriesFromDb', params);
  },
  updateMailEntities: list => {
    console.log('default implement updateMailEntities', list);
  },
  // TODO：参数需要重构，需要UI配合
  updateMailEntity: ev => {
    console.log('default implement updateMailEntity', ev);
  },
  updateMailTag: payload => {
    console.log('default implement updateMailTag', payload);
  },
  resetMailWithDraft: payload => {
    console.log('default implement resetMailWithDraft', payload);
  },
};
