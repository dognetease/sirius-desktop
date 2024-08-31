import React, { FC, useCallback, useEffect, useMemo } from 'react';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import { GlobalSearchCompanyDetail, MergeCompany, PrevScene, getIn18Text } from 'api';
import { ReactComponent as YellowError } from '../assets/yellow_error_icon.svg';
import style from './companyDetail.module.scss';
import { InfoField } from './InfoField';
import { GlobalSearchDetailEvent, globalSearchDataTracker } from '../tracker';
import { MergeCompanyTable } from './MergeCompanyTable';
import { logoMap, mediasTipType, socialMedias } from '../constants';
import SocailMediaLink from '../component/SocialMediaLink/SocialMediaLink';
import NationFlag from '../../CustomsData/components/NationalFlag';

export const InfoList: FC<{
  data?: GlobalSearchCompanyDetail;
  scene: PrevScene;
  headerCompanyList: Array<MergeCompany>;
  extraParams?: any;
}> = ({ data, scene, headerCompanyList, extraParams }) => {
  const onSocialMediaLinkClick = useCallback(
    (i: any) => () => {
      globalSearchDataTracker.trackDetailClick(i, scene, data?.companyId, data?.id, extraParams);
      if (scene === 'cantonfair') {
        globalSearchDataTracker.trackContomFairDetailClick(i);
      }
    },
    [scene]
  );

  const shownList = useMemo(
    () => [
      {
        label: getIn18Text('GUOJIADEQU'),
        key: 'country',
        renderComp: data?.domainCountry ? (
          <span className={style.domainCountryStyle}>
            <NationFlag showLabel name={data.domainCountry} />
            {data.origin === 'HG' ? (
              <Tooltip title="国家和地址信息来自海关交易单据解析，由于不同国家报关标准不同，可能会有匹配错误的情况。" key="domainCountry">
                <span className={style.errorIconWrapper}>
                  <YellowError />
                </span>
              </Tooltip>
            ) : null}
          </span>
        ) : null,
      },
      {
        label: getIn18Text('SUOSHUXINGYE'),
        key: 'industries',
      },
      {
        label: getIn18Text('GONGSIDEZHI'),
        key: 'location',
        getHerf(s: string) {
          return `https://maps.google.com?q=${encodeURIComponent(s)}&mrt=loc`;
        },
        popover: headerCompanyList && headerCompanyList.length > 1 ? <MergeCompanyTable list={headerCompanyList} rowKey="id" /> : null,
      },
      {
        label: getIn18Text('GONGSIGUANWANG'),
        key: 'domain',
        getHerf(domain: string) {
          if (!domain || domain.startsWith('http')) {
            return domain;
          }
          return 'https://' + domain;
        },
        suffix:
          data?.domain && data.domainStatus ? (
            <Tooltip title="该链接可能由于域名过期、域名解析失败等原因无法打开。" key="doaminStatus">
              <span className={style.errorIconWrapper}>
                <YellowError />
              </span>
            </Tooltip>
          ) : (
            ''
          ),
      },
      {
        label: getIn18Text('GONGSIDIANHUA'),
        key: 'phone',
      },
      {
        label: getIn18Text('CHENGLINIANFEN'),
        key: 'foundedDate',
      },
      {
        label: '公司收入',
        key: 'revenue',
        renderComp: <span>{`${data?.revenue ? '$' : ''}${(Number(data?.revenue) * 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}</span>,
      },
      {
        label: getIn18Text('YUANGONGSHU'),
        key: 'staff',
      },
      {
        label: 'SIC Code',
        key: 'sic',
        renderComp: <span>{(data?.sic || []).join(',')}</span>,
      },
      {
        label: 'NAICS Code',
        key: 'naics',
        renderComp: <span>{(data?.naics || []).join(',')}</span>,
      },
      {
        label: getIn18Text('SHEMEI'),
        key: 'socialMedia',
        renderComp:
          data && socialMedias.filter(i => (data as any)[i]).length ? (
            <span className={style.socialMedias}>
              {socialMedias
                .filter(i => (data as any)[i])
                .map(i => (
                  <SocailMediaLink
                    href={(data as any)[i]}
                    tipType={mediasTipType.includes(i) ? (i as any) : undefined}
                    key={i}
                    target="_blank"
                    rel="noreferrer"
                    onClick={onSocialMediaLinkClick(i)}
                  >
                    {logoMap[i]}
                  </SocailMediaLink>
                ))}
            </span>
          ) : null,
      },
    ],
    [headerCompanyList, data]
  );
  const handleItemClick = useCallback(
    (i: any) => () => {
      globalSearchDataTracker.trackDetailClick(i.key as GlobalSearchDetailEvent, scene, data?.companyId, data?.id, extraParams);
      if (scene === 'cantonfair') {
        globalSearchDataTracker.trackContomFairDetailClick(i.key as any);
      }
    },
    [scene]
  );
  return (
    <div className={style.infos}>
      {shownList.map(i => {
        if (['revenue', 'sic', 'naics'].includes(i.key)) {
          if (!data?.revenue) return null;
          if (!data?.sic) return null;
          if (!data?.naics) return null;
        }
        return (
          <div className={style.infoItem} key={i.key}>
            <label htmlFor="info-item">{`${i.label}：`}</label>
            {i.renderComp ? (
              i.renderComp
            ) : (
              <InfoField info={(data as any)?.[i.key]} getHerf={i.getHerf} onClick={handleItemClick(i)} popover={i.popover} suffix={i.suffix} />
            )}
          </div>
        );
      })}
    </div>
  );
};
