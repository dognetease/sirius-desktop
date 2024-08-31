import { EdmCustomsApi, GlobalSearchApi, GlobalSearchContactItem, GlobalSearchListContactItem, ICompanySubFallItem, RequestBusinessaAddCompany, api, apis } from 'api';
import classNames from 'classnames';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import styles from './newsubwaterfall.module.scss';
import { Button, Tooltip } from 'antd';
import { UniDrawerModuleId } from '@lxunit/app-l2c-crm';
import { showUniDrawer } from '@/components/Layout/CustomsData/components/uniDrawer';
import { ReactComponent as FacebookLogo } from '../../assets/facebook.svg';
import { ReactComponent as InstagramLogo } from '../../assets/instagram.svg';
import { ReactComponent as TwitterLogo } from '../../assets/twitter.svg';
import { ReactComponent as YoutubeLogo } from '../../assets/youtube.svg';
import { ReactComponent as LinkedinLogo } from '../../assets/linkedin.svg';

import { ReactComponent as IconPhone } from './asset/icon-contact.svg';
import { ReactComponent as IconDomain } from './asset/icon-domain.svg';
import { ReactComponent as IconLocation } from './asset/icon-location.svg';
import { ReactComponent as IconMember } from './asset/icon-member.svg';
import { ReactComponent as IconTime } from './asset/icon-time.svg';
import DefaultLogo from './asset/default-ava.svg';
import { useIntersection, useMeasure } from 'react-use';
import { globalSearchDataTracker } from '../../tracker';
import { getIn18Text } from 'api';

const edmCustomsApi = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

type MediaKey = keyof Pick<ICompanySubFallItem, 'linkedin' | 'twitter' | 'facebook' | 'youtube' | 'instagram'>;
type BaseInfoKey = keyof Pick<ICompanySubFallItem, 'domain' | 'phone' | 'country' | 'contactCount' | 'foundedDate'>;

const mediaLogoMap: Record<MediaKey, ReactNode> = {
  linkedin: <LinkedinLogo />,
  twitter: <TwitterLogo />,
  facebook: <FacebookLogo />,
  youtube: <YoutubeLogo />,
  instagram: <InstagramLogo />,
};

const baseInfoLogoMap: Record<BaseInfoKey, ReactNode> = {
  domain: <IconDomain />,
  phone: <IconPhone />,
  country: <IconLocation />,
  contactCount: <IconMember />,
  foundedDate: <IconTime />,
};

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

interface CompanyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ICompanySubFallItem;
  onComputeCompelte?(params: { height: number; id: string | number }): void;
  onToggleIgnore?(params: { id: string; ignore: boolean }): void;
  onViewDetail?(): void;
  ignore?: boolean;
  onRecordSuccess?(id: string): void;
  onInterSection?(): void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({
  data,
  onComputeCompelte,
  onToggleIgnore,
  onRecordSuccess,
  className,
  onViewDetail,
  onInterSection,
  ignore = false,
  ...rest
}) => {
  const [ref, { height }] = useMeasure<HTMLDivElement>();
  const [customerLoading, setCustomerLoading] = useState<boolean>(false);
  const [customerLoaded, setCustomerLoaded] = useState<boolean>(!!data.customerStatus);
  const baseInfoRef = useRef<HTMLDivElement>(null);
  const baseInfoInterSection = useIntersection(baseInfoRef, {
    root: null,
    threshold: 1,
    rootMargin: '0px',
  });
  const handleTrackClick = (btn: Parameters<typeof globalSearchDataTracker.trackWaterFallViewClick>[0]['buttonName']) => {
    globalSearchDataTracker.trackWaterFallViewClick({
      keyword: data.recommendReason,
      rcmdType: 1,
      companyCountry: data.country,
      companyName: data.name,
      buttonName: btn,
    });
  };

  const handleToggleIgnore: React.MouseEventHandler<HTMLElement> = async evt => {
    evt.stopPropagation();
    onToggleIgnore?.({
      ignore,
      id: data.id,
    });
    handleTrackClick(ignore ? 'ignore' : 'remove_ignore');
  };
  const getCustomerData = (contactList: GlobalSearchListContactItem[] = []) => {
    const getCompanySocial = () => {
      if (!data) {
        return '';
      }
      return [
        [data.facebook, 'Facebook'],
        [data.linkedin, 'Linkedin'],
        [data.instagram, 'Instagram'],
        [data.twitter, 'Twitter'],
        [data.youtube, 'Youtube'],
      ]
        .filter(kv => {
          return !!kv[0];
        })
        .map(kv => {
          return kv.reverse().join(':');
        })
        .join('; ');
    };
    const getItemSocial = (item: GlobalSearchListContactItem) => {
      const platforms = [];
      if (item.linkedinUrl) {
        platforms.push(`Linkedin:${item.linkedinUrl}`);
      }
      if (item.facebookUrl) {
        platforms.push(`Facebook:${item.facebookUrl}`);
      }
      if (item.twitterUrl) {
        platforms.push(`Twitter:${item.twitterUrl}`);
      }
      if (platforms.length > 0) {
        return platforms.join('; ');
      }
      return undefined;
    };
    const customerInfo = {
      name: data.name,
      company_name: data.name,
      company_domain: data.domain,
      area: ['', data?.country || '', '', ''],
      address: data.location,
      social_media_list: getCompanySocial(),
      contact_list: contactList.map((item, index) => ({
        main_contact: index === 0,
        contact_name: item.name,
        email: item.contact,
        telephone: item.phone,
        social_platform_new: getItemSocial(item),
        job: item.jobTitle,
      })) as any,
    };
    return customerInfo;
  };
  const handleRecordCustoms: React.MouseEventHandler<HTMLElement> = async evt => {
    evt.stopPropagation();
    handleTrackClick('record_customers');
    if (!customerLoaded) {
      setCustomerLoading(true);
      const [
        contactListMap,
        {
          companyId,
          // status,
        },
      ] = await Promise.all([
        globalSearchApi.globalSearchGetContactById([data.id]),
        edmCustomsApi.getCompanyRelationStatus({ companyName: data.name, country: data.country || '' }),
      ]);
      showUniDrawer({
        moduleId: UniDrawerModuleId.CustomerDetail,
        moduleProps: {
          visible: true,
          source: 'globalSearch',
          customerId: Number(companyId) || undefined,
          customerData: getCustomerData(contactListMap[data.id]),
          onClose: () => {},
          onSuccess: () => {
            setCustomerLoaded(true);
            onRecordSuccess?.(data.id);
          },
        },
      });
      setCustomerLoading(false);
    }
  };
  const noProductIntro = data.productList?.reduce((prev, curv) => {
    return !curv.name && !curv.price && prev;
  }, true);

  useEffect(() => {
    height > 0 &&
      onComputeCompelte?.({
        height,
        id: data.id,
      });
  }, [height, data.id]);

  useEffect(() => {
    if (onInterSection && baseInfoInterSection && baseInfoInterSection.intersectionRatio >= 1) {
      onInterSection();
    }
  }, [baseInfoInterSection?.intersectionRatio, onInterSection]);

  return (
    <div ref={ref} className={classNames(styles.cardWrapper, className)} {...rest}>
      {ignore && (
        <div className={styles.cardWrapperIgnoreMask}>
          <div className={styles.cardWrapperIgnoreBlock}>
            <p>已收到你的反馈，将为你优化推荐结果</p>
            <Button type="primary" ghost onClick={handleToggleIgnore}>
              取消屏蔽
            </Button>
          </div>
        </div>
      )}
      <div
        onClick={() => {
          onViewDetail?.();
          handleTrackClick('card');
        }}
        className={classNames(styles.cardInner, {
          [styles.cardInnerIgnore]: ignore,
        })}
      >
        <div className={styles.cardHeader}>
          <span
            title={data.recommendReason}
            className={styles.headerRcmd}
            dangerouslySetInnerHTML={{
              __html: data.recommendReasonHighLight || data.recommendReason,
            }}
          ></span>
          <span className={styles.headerAction}>
            <Tooltip title={getIn18Text('BUGANXINGQU')}>
              <span className={styles.headerActionDislike} onClick={handleToggleIgnore}></span>
            </Tooltip>
            <Button disabled={customerLoaded} loading={customerLoading} size="small" style={{ width: 72, fontSize: 12 }} onClick={handleRecordCustoms} type="primary">
              {customerLoaded ? '已录入' : getIn18Text('LURUKEHU')}
            </Button>
          </span>
        </div>
        <div className={classNames(styles.infoBlock, styles.baseInfoBlock)}>
          <div className={styles.baseInfo}>
            <h2>{data.name}</h2>
            <p
              dangerouslySetInnerHTML={{
                __html: data.overviewDescriptionHighLight || data.overviewDescription,
              }}
            ></p>
            <div className={styles.medias}>
              {Object.keys(mediaLogoMap).map(key => {
                const url = data[key as MediaKey];
                if (url) {
                  return (
                    <a
                      key={key}
                      onClick={evt => {
                        evt.stopPropagation();
                        handleTrackClick('social_media');
                      }}
                      target="_blank"
                      href={url}
                    >
                      {mediaLogoMap[key as MediaKey]}
                    </a>
                  );
                } else {
                  return null;
                }
              })}
            </div>
          </div>
          <div className={styles.baseInfoImg}>
            <img className={styles.logo} src={data.logo ? data.logo : DefaultLogo} alt="logo" />
          </div>
        </div>
        <div ref={baseInfoRef} className={classNames(styles.infoBlock, styles.baseInfoDescBlock)}>
          {Object.keys(baseInfoLogoMap).map(_key => {
            const key = _key as unknown as BaseInfoKey;
            const dataValues = data[key as BaseInfoKey];
            const suffix = key === 'foundedDate' ? '成立' : '';
            if (!dataValues || (key === 'foundedDate' && dataValues === '-')) {
              return null;
            }
            return (
              <p key={key} className={styles.baseInfoDescLine}>
                <span className={styles.baseInfoDescIcon}>{baseInfoLogoMap[key as BaseInfoKey]}</span>
                {key === 'domain' ? (
                  <a
                    onClick={evt => {
                      evt.stopPropagation();
                      handleTrackClick('domain');
                    }}
                    className={styles.baseInfoDescText}
                    target="_blank"
                    href={dataValues as string}
                  >
                    {dataValues}
                  </a>
                ) : (
                  <span className={styles.baseInfoDescText}>
                    {dataValues}
                    {suffix}
                  </span>
                )}
              </p>
            );
          })}
        </div>
        {data.productList && data.productList.length > 0 && (
          <div className={classNames(styles.infoBlock, styles.productBlock)}>
            <p className={styles.productBlockTitle}>{getIn18Text('XIANGGUANCHANPIN')}</p>
            <div className={styles.productList}>
              {data.productList.map((prod, index) => (
                <div key={index} className={styles.productItem}>
                  <div
                    className={styles.productImage}
                    style={{
                      backgroundImage: `url(${prod.imgUrl})`,
                    }}
                  ></div>
                  <div
                    className={classNames(styles.productIntro, {
                      [styles.productIntroHide]: noProductIntro,
                    })}
                  >
                    <p className={styles.name}>{prod.name}</p>
                    <p className={styles.price}>{prod.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {(data.lastTransDate || !!data.transCount) && (
          <div className={classNames(styles.infoBlock, styles.customBlock)}>
            <p className={styles.customTitle}>{getIn18Text('HAIGUANSHUJU')}</p>
            <p className={styles.customData}>
              <span>
                <span className={styles.label}>近两年进口次数：</span>
                <span className={styles.text}>{data.transCount || '-'}</span>
              </span>
              <span>
                <span className={styles.label}>{getIn18Text('ZUIHOUJINKOUSHIJIAN')}：</span>
                <span className={styles.text}>{data.lastTransDate || '-'}</span>
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyCard;
