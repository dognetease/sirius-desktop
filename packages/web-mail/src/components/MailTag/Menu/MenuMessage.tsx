import React, { useState, useRef, useEffect } from 'react';
import { apiHolder, MailConfApi, EventApi } from 'api';
import Menu from './Menu';
import { setCurrentAccount } from '../../../util';

const eventApi = apiHolder.api.getEventApi();
const mailManagerApi = apiHolder.api.requireLogicalApi('mailConfApiImpl') as unknown as MailConfApi;

interface Props {
  mailList: [];
  Close?(): void;
}

const MenuMessage: React.FC<Props> = props => {
  const [tagList, setTaglist] = useState([]);

  useEffect(() => {
    // setCurrentAccount();
    // mailManagerApi.requestTaglist();
    // const id = eventApi.registerSysEventObserver('onMailTagList', (e) => {
    //   const { eventData } = e;
    //   setTaglist(eventData);
    // });
    // return () => {
    //   eventApi.unregisterSysEventObserver('onMailTagList', id);
    // };
  }, []);

  return <Menu {...props} mailTagList={tagList} />;
};

export default MenuMessage;
