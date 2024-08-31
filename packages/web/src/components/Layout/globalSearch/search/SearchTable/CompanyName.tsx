import classnames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { formatTableData } from './index';
import styles from './index.module.scss';
import FacebookIcon from '../../assets/facebook.svg';
import TwitterIcon from '../../assets/twitter.svg';
import LinkedinIcon from '../../assets/linkedin.svg';
import YoutubeIcon from '../../assets/youtube.svg';
import InstagramIcon from '../../assets/instagram.svg';
import { globalSearchDataTracker, GlobalSearchTableEvent } from '../../tracker';
import { renderDataTagList } from '@/components/Layout/utils';
import { ReactComponent as StarIcon } from '@/images/icons/customs/star.svg';
import { ReactComponent as StarHoverIcon } from '@/images/icons/customs/star-selected.svg';
import { Tooltip } from 'antd';
import { api, apis, GlobalSearchApi, getIn18Text, PrevScene } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import moment, { Moment } from 'moment';
import { getCustomerAndLeadsTagInList, getUniSourceTypeFromScene } from '../../utils';
import CustomerTag from '../../component/CustomerTag';
import { ReactComponent as YellowError } from '../../assets/yellow_error_icon.svg';

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

export default (props: {
  record: ReturnType<typeof formatTableData>[number];
  onGotoDetail: (id: string, form?: string) => void;
  trackParam: [
    query: string,
    page: {
      page: number;
      pageSize: number;
      index: number;
    }
  ];
  showSubscribe?: boolean;
  scene?: PrevScene;
}) => {
  const { record, onGotoDetail, trackParam, showSubscribe, scene } = props;
  const {
    highLight,
    country,
    name,
    domain,
    facebook,
    instagram,
    linkedin,
    youtube,
    twitter,
    id,
    browsed,
    isNew,
    contactStatus = '',
    collectId: defaultCollectId,
    companyId,
    lastContactTime,
    referId,
    customerLabelType,
  } = record;
  const [collectId, setCollectId] = useState<string | number | undefined | null>(defaultCollectId);
  const [viewed, setViewed] = useState(browsed);
  const valiteSchemeDomain = useMemo<string>(() => {
    if (!domain || domain.startsWith('http')) {
      return domain;
    }
    return 'https://' + domain;
  }, [domain]);

  useEffect(() => {
    setCollectId(defaultCollectId);
  }, [defaultCollectId]);

  const socialMedia = useMemo<
    Array<{
      href: string;
      className: string;
      icon: any;
    }>
  >(
    () =>
      [
        {
          href: facebook,
          className: styles.facebook,
          icon: FacebookIcon,
        },
        {
          href: twitter,
          className: styles.twitter,
          icon: TwitterIcon,
        },
        {
          href: instagram,
          className: styles.instagram,
          icon: InstagramIcon,
        },
        {
          href: linkedin,
          className: styles.linkedin,
          icon: LinkedinIcon,
        },
        {
          href: youtube,
          className: styles.youtube,
          icon: YoutubeIcon,
        },
      ].filter(e => !!e.href),
    [facebook, instagram, linkedin, youtube, twitter]
  );
  const displayName = highLight?.type === 'name' && highLight?.value ? highLight.value : name;
  const deleteStar = async () => {
    if (!collectId) {
      return;
    }
    await globalSearchApi.doDeleteCollectById({ collectId });
    SiriusMessage.success({
      content: '已取消订阅，系统将不再向您推送该公司动态',
    });
    setCollectId(null);
    globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.UnSubscribe);
  };
  const addStar = async () => {
    const currentCollectId = await globalSearchApi.doCreateCollectByCompanyId(companyId);
    setCollectId(currentCollectId);
    SiriusMessage.success({
      content: '公司订阅成功，系统将为您及时推送该公司动态',
    });
    globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.Subscribe);
  };
  const customerTagContent = useMemo(() => getCustomerAndLeadsTagInList({ referId, customerLabelType }), [referId, customerLabelType]);
  return (
    <div
      className={classnames(styles.tableColumn, styles.tableCompany)}
      onClick={() => {
        setViewed(true);
        onGotoDetail(id, 'contact');
        globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.Null, ...trackParam);
      }}
    >
      <div
        className={classnames(styles.tableCompanyName, {
          [styles.tableCompanyNameBrowserd]: viewed || browsed,
        })}
      >
        <span
          style={{ paddingRight: isNew ? 8 : 0 }}
          dangerouslySetInnerHTML={{
            __html: displayName,
          }}
        ></span>
        {showSubscribe &&
          (!!collectId ? (
            <Tooltip placement="top" title={getIn18Text('QUXIAODINGYUE')}>
              <a
                className={classnames(styles.tableCompanyNameStar, styles.tableCompanyNameStarSelected)}
                onClick={e => {
                  e.stopPropagation();
                  deleteStar();
                }}
              >
                <StarHoverIcon />
              </a>
            </Tooltip>
          ) : (
            <Tooltip placement="top" title={getIn18Text('DINGYUEGONGSI')}>
              <a
                className={styles.tableCompanyNameStar}
                onClick={e => {
                  e.stopPropagation();
                  addStar();
                }}
              >
                <StarIcon />
              </a>
            </Tooltip>
          ))}
        {isNew && <span className={styles.tableCompanyNameIsNew}>新增企业</span>}
      </div>
      {customerTagContent || contactStatus ? (
        <div style={{ margin: '4px 0px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          {renderDataTagList([
            {
              content: customerTagContent ? (
                <CustomerTag tagProps={customerTagContent} companyName={name} country={country} source={getUniSourceTypeFromScene(scene)} />
              ) : null,
              priority: true,
              style: 'green',
            },
          ])}
          {contactStatus && lastContactTime ? (
            <>
              {' '}
              <Tooltip
                placement="top"
                title={`${
                  moment(lastContactTime * 1)
                    .format('M-D')
                    .replace('-', '月') + '日发送过邮件'
                }`}
              >
                <span className={styles.tagNameTime}>{contactStatus}</span>
              </Tooltip>{' '}
            </>
          ) : (
            ''
          )}
        </div>
      ) : null}
      <div className={classnames(styles.tableCompanyDomain)}>
        <a
          className={classnames(
            {
              [styles.blue]: domain.length > 0,
            },
            styles.textOverflow
          )}
          href={valiteSchemeDomain}
          target="_blank"
          onClick={e => {
            globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.Company, ...trackParam);
            e.stopPropagation();
            if (!domain.length) {
              e.preventDefault();
            }
          }}
          rel="noreferrer"
        >
          {domain.length ? domain : '-'}
        </a>
        <span className={styles.domainStatus} hidden={!record.domainStatus || !domain}>
          <Tooltip title="该链接可能由于域名过期、域名解析失败等原因无法打开。">
            <YellowError />
          </Tooltip>
        </span>
      </div>
      <div className={classnames(styles.tableCompanyLoc)}>
        <span
          className={classnames(styles.textOverflow, {
            [styles.tableCompanyNameBrowserd]: browsed,
          })}
        >
          {country}
        </span>
      </div>
      <div className={styles.tableCompanySocial} onClick={e => e.stopPropagation()}>
        {socialMedia.map(e => (
          <a
            key={e.href}
            href={e.href}
            target="_blank"
            className={classnames(styles.tableCompanySocialIcon, e.className)}
            onClick={ev => {
              ev.stopPropagation();
              globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.Logo, ...trackParam);
            }}
            rel="noreferrer"
          >
            <img src={e.icon} alt="icon" />
          </a>
        ))}
      </div>
    </div>
  );
};
