import React, { useState, useEffect } from 'react';
import { apiHolder, apis, EdmSendBoxApi } from 'api';
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
import { urlStore } from 'api';
import useDownLoad from '../hooks/useDownLoad';
import { getIn18Text } from 'api';
const ReceiverTemplate = () => {
  const { downloadTemplate } = useDownLoad();
  const handleDownload = () => {
    downloadTemplate(urlStore.get('getReceiverTemplate') as string, getIn18Text('YINGXIAOSHOUJIANRENDAORUMOBAN'));
  };
  return <a onClick={handleDownload}>{getIn18Text('XIAZAIMOBAN')}</a>;
};
export default ReceiverTemplate;
