import React from 'react';
import { apiHolder as api, SystemApi } from 'api';
import WriteLetterWeb from './WriteLetterWeb/WriteLetterWeb';

const WriteLetter: React.FC<{}> = (props: any) => {
  const systemApi = api.api.getSystemApi() as SystemApi;
  const inElectron = systemApi.isElectron();
  let res = <div />;
  if (!inElectron) {
    res = <WriteLetterWeb />;
  }
  return res;
};

export default WriteLetter;
