import React, { useState } from 'react';
// import { navigate } from 'gatsby';
import classnames from 'classnames/bind';
import { api } from 'api';
import UniDrawerWrapper from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';

import style from '../chatItemAlt.module.scss';

const realStyle = classnames.bind(style);
const systemApi = api.getSystemApi();

const wmDataCompatibleConvert = (url: string) => {
  const currentUrl = new URL(url);

  if (currentUrl.hash.startsWith('#globalSearch')) {
    currentUrl.hash = currentUrl.hash.replace('#globalSearch', '#wmData');
  } else if (currentUrl.hash.startsWith('#customsData')) {
    currentUrl.hash = currentUrl.hash.replace('#customsData', '#wmData');
  }
  return currentUrl.href;
};

interface ItemLinkApi {
  text: string;
  url: string;
}

export const ItemLink: React.FC<ItemLinkApi> = props => {
  const [show, setShow] = useState(false);
  const [customerId, setCustomerId] = useState<number>();
  const { text, url } = props;
  const openLink = () => {
    if (!url) {
      return;
    }
    if (url.includes('#customer') && url.includes('page=customer')) {
      // 已经不存在客户模块，所有的客户模块的链接都要处理
      const search = new URLSearchParams(url);
      const id = search.get('id');
      if (!id) {
        return;
      }
      setCustomerId(+id);
      setShow(true);
    } else {
      let link = url;

      if (link.startsWith('/systemTask')) return systemApi.handleJumpUrl(0, link);

      link = wmDataCompatibleConvert(url.replace(/(http:|https:)?(\/\/)?(.+)$/, 'https://$3'));
      systemApi.handleJumpUrl(0, link);
    }
  };
  return (
    <>
      <span onClick={openLink} className={realStyle('link')}>
        {text}
      </span>
      {/* 查看客户详情的需要 */}
      <UniDrawerWrapper
        visible={show}
        source="imNotification" // 这个字段只有录入客户场景需要
        onClose={() => setShow(false)}
        onSuccess={() => setShow(false)}
        customerId={customerId}
      />
    </>
  );
};
