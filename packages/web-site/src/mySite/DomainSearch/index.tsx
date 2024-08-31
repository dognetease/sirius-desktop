import React, { useState } from 'react';
import { Breadcrumb } from 'antd';
import { navigate } from '@reach/router';
// import { api, apis, SiteApi, apiHolder, DataTrackerApi } from 'api';

import { ReactComponent as SeparatorIcon } from '../../images/separator.svg';
import styles from './style.module.scss';
import { DomainSearchBar } from '../components/DomainSearchBar';
import { goMySitePage } from '../utils';

// const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
// const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

interface PageQueryString {
  keyword: string;
  suffix: string;
}

interface DomainSearchProps {
  qs: PageQueryString; // url 参数
}

export default function DomainSearch(props: DomainSearchProps) {
  const { qs } = props;
  const [popoverVisible, setPopoverVisible] = useState(false);

  const onSearch = (keyword: string, suffix: string) => {
    setPopoverVisible(false);
    console.log('onSearch');
    if (!keyword) {
      return;
    }
    navigate(`#site?page=domainSearchResult&keyword=${encodeURIComponent(keyword)}&suffix=${suffix}`);
  };

  const goDomain = () => {
    navigate('#site?page=myDomain');
  };

  return (
    <div className={styles.container} onClick={() => setPopoverVisible(false)}>
      <Breadcrumb separator={<SeparatorIcon />}>
        <Breadcrumb.Item onClick={goDomain}>域名管理</Breadcrumb.Item>
        <Breadcrumb.Item>域名购买</Breadcrumb.Item>
      </Breadcrumb>

      <div className={styles.main}>
        <div className={styles.mainTitle}>域名优惠专场</div>
        <DomainSearchBar
          defaultKeyword={qs.keyword || ''}
          defaultSuffix={qs.suffix || ''}
          popoverVisible={popoverVisible}
          setPopoverVisible={setPopoverVisible}
          onSearch={onSearch}
        />
      </div>

      <div className={styles.statement}>本域名服务内容由西部数码提供</div>
    </div>
  );
}
