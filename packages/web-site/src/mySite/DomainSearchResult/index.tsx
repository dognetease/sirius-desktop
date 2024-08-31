import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'antd';
import { navigate } from '@reach/router';
import { api, apis, SiteApi, SystemApi, apiHolder, DataTrackerApi, ListDomainPriceRes, getIn18Text } from 'api';

import Breadcrumb from '@web-site/components/Breadcrumb';
import Loading from '@web-site/components/Loading';
import { ReactComponent as InfoIcon } from '../../images/jichu_cuowutishi_mian.svg';
import { DomainSearchBar } from '../components/DomainSearchBar';
import styles from './style.module.scss';
import { goMySitePage } from '../utils';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

interface PageQueryString {
  keyword: string;
  suffix: string;
}
interface DomainSearchProps {
  qs: PageQueryString; // url 参数
}

export default function DomainSearchResult(props: DomainSearchProps) {
  const { qs } = props;
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [result, setResult] = useState<ListDomainPriceRes>([]); // 搜索结果
  const [loading, setLoading] = useState(false);
  const searchParamRef = useRef({
    keyword: '',
    suffix: '.com',
  });

  const onSearch = async (keyword: string, suffix: string) => {
    setPopoverVisible(false);
    setLoading(true);
    searchParamRef.current = { keyword, suffix };
    console.log('onSearch', keyword, suffix);
    let data: ListDomainPriceRes = [];
    try {
      data = (await siteApi.listDomainPrice({ domainPrefix: keyword, suffixList: [suffix.slice(1)] })) || [];
    } catch {}
    // 判断域名是否含有中文
    const reg = /[\u4e00-\u9fa5]+/;
    // 中文域名会绑定站点失败，搜索结果不展示
    data = data.filter(item => item && item.avail != -1 && !reg.test(item.name));
    data = data.map(item => ({
      ...item,
      underlinePrice: item.underlinePrice || 0,
      actualPrice: item.actualPrice || 0,
    }));
    setResult(data);
    setLoading(false);
    var searchParams = new URLSearchParams(location.hash.split('?')[1]);
    if (searchParams.get('page') == 'domainSearchResult') {
      navigate(`#site?page=domainSearchResult&keyword=${encodeURIComponent(keyword)}&suffix=${suffix}`, { replace: true });
    }
  };

  const handlePurchase = (name: string, actualPrice: number, underlinePrice: number) => {
    // Modal.info({
    //   title: '提示',
    //   content: '该账户已使用过限免购买域名权益！',
    //   okText: '确定',
    //   width: 400,
    //   centered: true,
    //   icon: <InfoIcon />,
    //   className: styles.purchaseModal,
    //   maskStyle: {
    //     left: 0
    //   }
    // });
    navigate('#site?page=domainPurchaseConfirm', {
      state: {
        underlinePrice,
        actualPrice,
        domain: name,
        keyword: searchParamRef.current.keyword,
        suffix: searchParamRef.current.suffix,
      },
    });
  };

  useEffect(() => {
    if (qs.keyword && qs.suffix) {
      onSearch(qs.keyword, qs.suffix);
    }
  }, []);

  return (
    <div className={styles.result} onClick={() => setPopoverVisible(false)}>
      <Breadcrumb>
        <Breadcrumb.Item onClick={goMySitePage}>{getIn18Text('WODEZHANDIAN')}</Breadcrumb.Item>
        <Breadcrumb.Item
          onClick={() => {
            navigate(`#site?page=domainSearch&keyword=${encodeURIComponent(qs.keyword || '')}&suffix=${qs.suffix || ''}`);
          }}
        >
          {getIn18Text('YUMINGGOUMAI')}
        </Breadcrumb.Item>
        <Breadcrumb.Item>搜索结果</Breadcrumb.Item>
      </Breadcrumb>

      <div className={styles.resultMain}>
        <DomainSearchBar
          defaultKeyword={qs.keyword}
          defaultSuffix={qs.suffix}
          popoverVisible={popoverVisible}
          setPopoverVisible={setPopoverVisible}
          onSearch={onSearch}
        />

        <div className={styles.resultMainTitle}>
          <div className={styles.resultMainTitleBorder}></div>
          <span>搜索结果</span>
          {loading ? null : <span className={styles.resultMainTitleCount}>({result.length})</span>}
        </div>
        {loading ? (
          <Loading />
        ) : result.length > 0 ? (
          <div className={styles.resultMainList}>
            {result.map(domainItem => (
              <div className={styles.resultMainListItem}>
                <div className={domainItem.avail == 0 ? styles.resultMainListItemDisabled : ''}>
                  <div>
                    <span className={styles.resultMainListItemName}>{domainItem.name}</span>
                    {domainItem.actualPrice == 0 && domainItem.avail != 0 ? <span className={styles.resultMainListItemFree}>限时免费</span> : null}
                  </div>
                  {domainItem.avail == 0 ? <div style={{ fontSize: '12px', marginTop: '6px' }}>该域名已被注册</div> : null}
                </div>
                <div className={styles.resultMainListItemRight}>
                  {domainItem.avail != 0 ? (
                    <>
                      <span className={styles.resultMainListItemPrice}>
                        <span className={styles.resultMainListItemPriceActual} style={{ fontSize: domainItem.actualPrice == 0 ? '22px' : '14px' }}>
                          {domainItem.actualPrice}
                        </span>
                        <span className={styles.resultMainListItemPriceUnit}>元/年</span>
                        {domainItem.actualPrice != domainItem.underlinePrice ? (
                          <div className={styles.resultMainListItemPriceOriginal}>{domainItem.underlinePrice}元/年</div>
                        ) : null}
                      </span>
                      <Button type="primary" ghost onClick={() => handlePurchase(domainItem.name, domainItem.actualPrice, domainItem.underlinePrice)}>
                        立即购买
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
