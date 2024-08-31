// 通过链接直接进入写信页，并将数据填充到收信人
/* eslint-disable array-callback-return */
/* eslint-disable max-statements */
import React, { useState, useEffect } from 'react';
import { api, apis, EventApi, MailApi } from 'api';
import { useLocation, navigate } from '@reach/router';

const eventApi: EventApi = api.getEventApi();
const mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;

const UrlToWriteMail = () => {
  const locationHref = useLocation().href;
  useEffect(() => {
    if (!locationHref) return;
    const mailListString = locationHref.split('mailList=')[1];
    if (mailListString) {
      const mailList = mailListString.split('&')[0].split(',');
      mailApi.doWriteMailToContact([...mailList]);
    }
    console.log('location111 @qq.com', locationHref);
  }, [locationHref]);

  return <></>;
};

export default UrlToWriteMail;
