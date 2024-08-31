import { GlobalSearchItem, SmartRcmdItem, getIn18Text } from 'api';
import React, { useMemo } from 'react';
import styles from './rcmdcompanytable.module.scss';
import { ReactComponent as WebIcon } from '../../assets/common-web.svg';
import { ReactComponent as LocationIcon } from '../../assets/common-location.svg';
import { ReactComponent as MemberIcon } from '../../assets/common-member.svg';
import { Tooltip, Popover } from 'antd';
import { ReactComponent as YellowError } from '../../../../globalSearch/assets/yellow_error_icon.svg';
import FacebookLogo from '../../../assets/facebook.svg';
import InstagramLogo from '../../../assets/instagram.svg';
import TwitterLogo from '../../../assets/twitter.svg';
import YoutubeLogo from '../../../assets/youtube.svg';
import LinkedinLogo from '../../../assets/linkedin.svg';
import moment, { Moment } from 'moment';

import classNames from 'classnames';
import { globalSearchDataTracker } from '../../../tracker';
import SocailMediaLink from '../../../component/SocialMediaLink/SocialMediaLink';
import { renderDataTagList } from '@/components/Layout/utils';
import CustomerTag from '../../../component/CustomerTag';
import { getCustomerAndLeadsTagInList } from '../../../utils';

interface RcmdTableCompanyNameProps<T = GlobalSearchItem> {
  data: T;
  selectedItem?: SmartRcmdItem | null;
  rank: number;
}

type MediaKey = keyof Pick<GlobalSearchItem, 'linkedin' | 'twitter' | 'facebook' | 'youtube' | 'instagram'>;

const mediaLogoMap: Record<MediaKey, React.ReactNode> = {
  linkedin: LinkedinLogo,
  twitter: TwitterLogo,
  facebook: FacebookLogo,
  youtube: YoutubeLogo,
  instagram: InstagramLogo,
};

const RcmdTableCompanyName: React.FC<RcmdTableCompanyNameProps> = ({ data, selectedItem, rank }) => {
  const handleHubble = (buttonName: Parameters<typeof globalSearchDataTracker.trackSmartRcmdListCompanyClick>[0]['buttonName']) => {
    globalSearchDataTracker.trackSmartRcmdListCompanyClick({
      rcmdType: 1,
      ruleId: selectedItem?.id,
      keyword: selectedItem?.value,
      buttonName: buttonName,
      id: data.id,
      companyCountry: data.country,
      companyName: data.name,
      rank: rank,
      companyId: data.companyId,
    });
  };
  const customerTagContent = useMemo(() => getCustomerAndLeadsTagInList({ referId: data?.referId, customerLabelType: data.customerLabelType }), [data]);
  const displayDomain = data.domainHighlight ? data.domainHighlight : data.domain;
  return (
    <div className={styles.company}>
      <p className={styles.name}>{data.name}</p>
      <p hidden={!data.domain} className={styles.desc}>
        <span className={styles.icon}>
          <WebIcon />
        </span>
        <a
          href={data.domain}
          onClick={evt => {
            evt.stopPropagation();
            handleHubble('domain');
          }}
          target="_blank"
          className={classNames(styles.text, styles.textLink)}
        >
          {data.domain}
        </a>
        <div className={styles.domainStatus} hidden={!data.domainStatus || !displayDomain}>
          <Tooltip title="该链接可能由于域名过期、域名解析失败等原因无法打开。">
            <YellowError />
          </Tooltip>
        </div>
        <div className={styles.medias}>
          {Object.keys(mediaLogoMap).map(key => {
            const url = data[key as MediaKey];
            if (url) {
              return (
                <SocailMediaLink
                  tipType={key === 'linkedin' ? 'linkedin' : key === 'instagram' ? 'instagram' : undefined}
                  key={key}
                  style={{ width: '20px', marginLeft: '8px' }}
                  onClick={evt => {
                    evt.stopPropagation();
                    handleHubble('social_media');
                  }}
                  target="_blank"
                  href={url}
                >
                  <img src={mediaLogoMap[key as MediaKey]} alt="icon" style={{ width: '20px', height: '20px' }} />
                  {/* {mediaLogoMap[key as MediaKey]} */}
                </SocailMediaLink>
              );
            } else {
              return null;
            }
          })}
        </div>
      </p>
      <p hidden={!data.domainCountry} className={styles.desc}>
        <span className={styles.icon}>
          <LocationIcon />
        </span>
        <span className={styles.text}>{data.domainCountry}</span>
      </p>
      <p hidden={!data.contactCount} className={styles.desc}>
        <span className={styles.icon}>
          <MemberIcon />
        </span>
        <span className={styles.text}>
          {data.contactCount}
          {getIn18Text('GELIANXIREN')}
        </span>
      </p>
      {customerTagContent || data.contactStatus ? (
        <div className={styles.tagList}>
          {renderDataTagList([
            {
              content: customerTagContent ? <CustomerTag tagProps={customerTagContent} companyName={data.name} country={data.country} source="smartRcmdList" /> : null,
              style: 'green',
            },
          ])}
          {data.contactStatus && data.lastContactTime ? (
            <>
              {' '}
              <Tooltip
                placement="top"
                title={`${
                  moment(data.lastContactTime * 1)
                    .format('M-D')
                    .replace('-', '月') + '日发送过邮件'
                }`}
              >
                <span className={styles.tagNameTime}>{data.contactStatus}</span>
              </Tooltip>{' '}
            </>
          ) : (
            ''
          )}
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default RcmdTableCompanyName;
