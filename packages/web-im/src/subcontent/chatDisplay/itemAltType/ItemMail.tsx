import React from 'react';
import classnames from 'classnames/bind';
import { apiHolder, apis, ContactApi, OrgApi } from 'api';
import style from '../chatItemAlt.module.scss';

const systemApi = apiHolder.api.getSystemApi();
const realStyle = classnames.bind(style);

export const ItemMail: React.FC<Record<'text' | 'id', string>> = props => {
  const openMail = () => {
    if (systemApi.isElectron()) {
      systemApi.createWindowWithInitData({ type: 'readMail', additionalParams: { account: '' } }, { eventName: 'initPage', eventData: props.id, _account: '' });
    } else {
      window.open(`${systemApi.getContextPath()}/readMail/?id=${props.id}`, 'readMail', 'menubar=0,scrollbars=1,resizable=1,width=800,height=600');
    }
  };
  return (
    <span className={realStyle('link')} onClick={openMail}>
      {props.text}
    </span>
  );
};
