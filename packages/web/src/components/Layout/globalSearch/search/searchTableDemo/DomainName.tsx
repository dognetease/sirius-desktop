import classnames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { formatTableData } from './index';
import styles from '../SearchTable/index.module.scss';
import FacebookIcon from '../../assets/facebook.svg';
import TwitterIcon from '../../assets/twitter.svg';
import LinkedinIcon from '../../assets/linkedin.svg';
import YoutubeIcon from '../../assets/youtube.svg';
import InstagramIcon from '../../assets/instagram.svg';
import { globalSearchDataTracker, GlobalSearchTableEvent } from '../../tracker';
import { renderDataTagList } from '@/components/Layout/utils';
import { ReactComponent as StarIcon } from '@/images/icons/customs/star.svg';
import { ReactComponent as StarHoverIcon } from '@/images/icons/customs/star-selected.svg';
import { Tooltip, Popover } from 'antd';
import { api, apis, GlobalSearchApi, getIn18Text, PrevScene } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import moment, { Moment } from 'moment';
import VirtualTable from '@web-common/components/UI/VirtualTable/VirtualTable';
import { ReactComponent as CloseIcon } from '@/images/icons/regularcustomer/close.svg';
import SocailMediaLink from '../../component/SocialMediaLink/SocialMediaLink';
import { getCustomerAndLeadsTagInList, getUniSourceTypeFromScene } from '../../utils';
import CustomerTag from '../../component/CustomerTag';
import { ReactComponent as YellowError } from '../../assets/yellow_error_icon.svg';
import { useMemoizedFn } from 'ahooks';
import { showStar } from '../../utils';

import { useIsForwarder } from '../../../CustomsData/customs/ForwarderSearch/useHooks/useIsForwarder';

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

export default (props: {
  record: ReturnType<typeof formatTableData>[number];
  onGotoDetail: (id: string, form?: string, recommendShowName?: string) => void;
  handleSubscribeCompanyVisibl: (bl: boolean, arr: any[], id: string) => void;
  trackParam: [
    query: string,
    page: {
      page: number;
      pageSize: number;
      index: number;
    }
  ];
  scene?: PrevScene;
  showSubscribe?: boolean;
  tableType?: string;
  query?: string;
  mergeCompanys?: {
    name: string;
    country: string;
    location: string;
    companyId: string;
    collectId: number;
  }[];
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
    customerStatus = '',
    orgCustomerStatus = '',
    contactStatus = '',
    collectId: defaultCollectId,
    companyId,
    lastContactTime,
    emailCount,
    phoneCount,
    socialCount,
    contactCount,
    customsTransactionLabel,
    businessProductLabel,
    domainHighlight,
    domainTitle,
    domainTitleHighLight,
    mergeCompanys,
    recommendShowName,
    recommendShowNameHighLight,
    referId,
    customerLabelType,
  } = record;
  const [collectId, setCollectId] = useState<string | number | undefined | null>(defaultCollectId);
  const [viewed, setViewed] = useState(browsed);
  const isForWarder = useIsForwarder();
  const valiteSchemeDomain = useMemo<string>(() => {
    if (!domain || domain.startsWith('http')) {
      return domain;
    }
    return 'https://' + domain;
  }, [domain]);

  useEffect(() => {
    setCollectId(defaultCollectId);
  }, [defaultCollectId]);
  const customerTagContent = useMemo(() => getCustomerAndLeadsTagInList({ referId, customerLabelType }), [referId, customerLabelType]);
  const domainRowKey = 'id';

  const mergeDomainTableColumns = [
    {
      title: '公司名称',
      dataIndex: 'name',
    },
    {
      title: '国家',
      dataIndex: 'country',
    },
  ];

  const mergeCompanyTable = (
    list: {
      name: string;
      country: string;
      location?: string;
      companyId: string;
    }[]
  ) => {
    return (
      <>
        <div className={styles.virtualTable}>
          <div className={styles.virtualTableHeader}>
            <div className={styles.virtualTableHeaderTitle}>
              <span>全部相关公司</span>
            </div>
            <div className={styles.virtualTableHeaderIntro}>以下公司由于官网一致，系统已对下列公司的介绍、联系人合并展示。</div>
          </div>
          <VirtualTable
            rowKey={domainRowKey}
            rowHeight={46}
            columns={mergeDomainTableColumns}
            dataSource={list}
            autoSwitchRenderMode={true}
            enableVirtualRenderCount={50}
            scroll={{ y: 368 }}
            // tableLayout={'fixed'}
            pagination={false}
          />
        </div>
      </>
    );
  };

  const socialMedia = useMemo<
    Array<{
      href: string;
      className: string;
      icon: any;
      type: string;
    }>
  >(
    () =>
      [
        {
          href: facebook,
          className: styles.facebook,
          icon: FacebookIcon,
          type: 'facebook',
        },
        {
          href: twitter,
          className: styles.twitter,
          icon: TwitterIcon,
          type: 'twitter',
        },
        {
          href: instagram,
          className: styles.instagram,
          icon: InstagramIcon,
          type: 'instagram',
        },
        {
          href: linkedin,
          className: styles.linkedin,
          icon: LinkedinIcon,
          type: 'linkedin',
        },
        {
          href: youtube,
          className: styles.youtube,
          icon: YoutubeIcon,
          type: 'youtube',
        },
      ].filter(e => !!e.href),
    [facebook, instagram, linkedin, youtube, twitter]
  );
  // const displayName = (highLight?.type === 'domainTitle' && highLight?.value) ? highLight.value : domainTitleHighLight? domainTitleHighLight : domainTitle;
  const displayRecommendShowName = recommendShowName && recommendShowNameHighLight ? recommendShowNameHighLight : recommendShowName;
  const displayName = displayRecommendShowName ? displayRecommendShowName : highLight?.type === 'name' && highLight?.value ? highLight.value : name;
  const displayDomain = domainHighlight ? domainHighlight : domain;
  const deleteStar = async () => {
    const { handleSubscribeCompanyVisibl } = props;
    if (mergeCompanylist.length > 1) {
      handleSubscribeCompanyVisibl(true, mergeCompanylist, record.companyId);
      return;
    }
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
  const mergeCompanylist = [
    {
      country: record.country,
      name: record.name,
      companyId: record.companyId,
      collectId: record.collectId,
    },
    ...(mergeCompanys || []),
  ];
  const addStar = async () => {
    const { handleSubscribeCompanyVisibl } = props;
    if (mergeCompanylist.length > 1) {
      handleSubscribeCompanyVisibl(true, mergeCompanylist, record.companyId);
      return;
    }
    const currentCollectId = await globalSearchApi.doCreateCollectByCompanyId(companyId);
    setCollectId(currentCollectId);
    SiriusMessage.success({
      content: '公司订阅成功，系统将为您及时推送该公司动态',
    });
    globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.Subscribe);
  };
  return (
    <div
      className={classnames(styles.tableColumn, styles.tableCompany, { [styles.isOpacity]: viewed || browsed })}
      onClick={event => {
        setViewed(true);
        onGotoDetail(id, 'contact', recommendShowName);
        globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.Null, ...trackParam);
      }}
    >
      <div className={classnames(styles.tableCompanyName, styles.tableDomainName)}>
        <div>
          <span
            dangerouslySetInnerHTML={{
              __html: displayName,
            }}
          ></span>{' '}
          {mergeCompanys && mergeCompanys.length > 0 ? (
            <>
              {' '}
              等{mergeCompanys.length + 1}家公司
              <span className={classnames(styles.companyList)}>相关公司列表</span>
              <Popover
                placement="rightTop"
                content={mergeCompanyTable([
                  ...mergeCompanys,
                  {
                    country: record.country,
                    name: record.name,
                    location: record.location,
                    companyId: record.companyId,
                  },
                ])}
                trigger="hover"
              >
                <a
                  href="javascript:;"
                  onClick={event => {
                    event.stopPropagation();
                  }}
                  style={{ display: 'inline-block' }}
                  onMouseEnter={() => {
                    globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.relatedCompany, trackParam[0], trackParam[1]);
                  }}
                  className={styles.queryCompanyList}
                >
                  {getIn18Text('CHAKAN')}
                </a>
              </Popover>
            </>
          ) : (
            ''
          )}
          {showSubscribe &&
            (showStar(collectId, mergeCompanylist) ? (
              <Tooltip placement="top" title={getIn18Text('QUXIAODINGYUE')}>
                <a
                  className={classnames(styles.tableCompanyNameStar)}
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
                  className={classnames(styles.tableCompanyNameStar, styles.tableCompanyNameSelected)}
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
      </div>
      <div className={classnames(styles.tableCompanyDomain)}>
        <span
          className={classnames(styles.urlLink, styles.urlEllipsis)}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            if (record.domain && typeof window !== undefined) {
              window.open(valiteSchemeDomain, '_blank');
            }
          }}
          style={{
            maxWidth: `${
              socialMedia.length === 5 ? '128px' : socialMedia.length === 4 ? '164px' : socialMedia.length === 3 ? '192px' : socialMedia.length === 2 ? '219px' : 'auto'
            }`,
          }}
          dangerouslySetInnerHTML={{ __html: displayDomain }}
        ></span>
        <span className={styles.domainStatus} hidden={!record.domainStatus || !displayDomain}>
          <Tooltip title="该链接可能由于域名过期、域名解析失败等原因无法打开。">
            <YellowError />
          </Tooltip>
        </span>
        {socialMedia.map(e => (
          <SocailMediaLink
            tipType={e.type === 'instagram' ? 'instagram' : e.type === 'linkedin' ? 'linkedin' : undefined}
            key={e.href}
            href={e.href}
            target="_blank"
            style={{ width: '20px', marginLeft: '8px' }}
            className={classnames(styles.tableCompanySocialIcon, e.className)}
            onClick={ev => {
              ev.stopPropagation();
              globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.Logo, ...trackParam);
            }}
            rel="noreferrer"
          >
            <img src={e.icon} alt="icon" style={{ width: '20px', height: '20px' }} />
          </SocailMediaLink>
        ))}
      </div>
      <div className={classnames(styles.tableCompanyLoc)} style={{ marginBottom: '4px', height: '22px' }}>
        <span className={classnames(styles.textOverflow)}>{record.domainCountry}</span>
      </div>
      {record.chineseCompanyName && isForWarder && (
        <div className={styles.tableCompanyZncompany}>
          <span className={styles.tableCompanyZncompanyIcon} />
          <span className={styles.fieldLabel}>相似国内公司：</span>
          <span className={classnames(styles.fieldText)}> {record.chineseCompanyName}</span>
          {Number(record.chineseCompanyCount) > 1 && <span className={classnames(styles.fieldTextCount)}> {`等${record.chineseCompanyCount}家企业`}</span>}
          <span hidden={record.excavateCnCompanyStatus === 0} className={styles.constantCount}>
            {record.chineseCompanyContactCount ? '，' + record.chineseCompanyContactCount + `${Number(record.chineseCompanyCount) > 1 ? '+' : ''}` : 0}个联系人
          </span>
        </div>
      )}
      {customerTagContent || contactStatus || record.fromWca ? (
        <div style={{ margin: '4px 0px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          {renderDataTagList([
            {
              content: customerTagContent ? (
                <CustomerTag tagProps={customerTagContent} companyName={record.name} country={record.country} source={getUniSourceTypeFromScene(scene)} />
              ) : null,
              style: 'green',
            },
            {
              content: record.fromWca ? 'WCA成员' : '',
              style: 'blue',
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
    </div>
  );
};
