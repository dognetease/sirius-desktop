import React from 'react';
import classnames from 'classnames/bind';
import { apiHolder } from 'api';
import style from '../chatItemAlt.module.scss';

const systemApi = apiHolder.api.getSystemApi();
const realStyle = classnames.bind(style);

interface ItemLinkApi {
  text: string;
  url: string;
}

export const ItemH5Link: React.FC<ItemLinkApi> = props => {
  const { text, url } = props;
  const openLink = () => {
    if (!url) {
      return;
    }
    const _url = url.replace(/(http:|https:)?(\/\/)?(.+)$/, 'https://$3');
    // @ts-ignore
    systemApi.handleJumpUrl(`${Math.random()}`.replace('.', ''), _url);
  };
  return (
    <span className={realStyle('link')} onClick={openLink}>
      {text}
    </span>
  );
};
