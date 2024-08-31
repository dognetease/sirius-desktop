import React from 'react';
import { ForwarderRecordItem, getIn18Text } from 'api';
import style from './table.module.scss';
import classNames from 'classnames';
import { Skeleton, Tooltip } from 'antd';
import Translate from '../../components/Translate/translate';

interface Prop {
  record: ForwarderRecordItem;
  text: string;
  skeletonLoading?: boolean;
  type: string;
  scence?: string;
}

export const ForwardComponent: React.FC<Prop> = ({ record, text, skeletonLoading, type, scence }) => {
  return (
    <>
      <div
        style={{ paddingTop: 4 }}
        className={classNames(style.companyNameItem, {
          [style.isOpacity]: record.visited,
        })}
      >
        {skeletonLoading ? (
          <Skeleton.Input active />
        ) : (
          <Tooltip title={record.excavatedCompanyInfo?.overviewDescription || ''}>
            <span className={classNames(style.fieldText, style.fieldText2)}>
              <span style={{ paddingRight: 10 }}>公司简介：</span>
              <span
                dangerouslySetInnerHTML={{
                  __html: record.excavatedCompanyInfo?.highLight?.value || record.excavatedCompanyInfo?.overviewDescription || '-',
                }}
              ></span>
            </span>
          </Tooltip>
        )}
      </div>
      <div
        hidden={scence !== 'peers'}
        style={{ paddingTop: 4, gap: 10, alignItems: 'flex-start' }}
        className={classNames(style.companyNameItem, {
          [style.isOpacity]: record.visited,
        })}
      >
        <span className={style.fieldLabel}>{`航线Top5：`}</span>
        {skeletonLoading ? (
          <Skeleton.Input active />
        ) : (
          <Tooltip key={record.topNRelationsCountryZhs?.join(',') ?? '-'} title={record.topNRelationsCountryZhs?.join(',') ?? '-'}>
            <span>
              {!record.topNRelationsCountryZhs
                ? '-'
                : record.topNRelationsCountryZhs?.map((t10c, index) => (
                    <>
                      {t10c}
                      {index + 1 === record.topNHuoDaiCountries?.length ? '' : ','}
                    </>
                  ))}
            </span>
          </Tooltip>
        )}
      </div>
      <div
        hidden={scence === 'peers'}
        style={{ paddingTop: 4, gap: 10, alignItems: 'flex-start' }}
        className={classNames(style.companyNameItem, {
          [style.isOpacity]: record.visited,
        })}
      >
        <span className={style.fieldLabel}>{`${type === 'buysers' ? '采购' : '供应'}地区Top10：`}</span>
        {skeletonLoading ? (
          <Skeleton.Input active />
        ) : (
          <span>
            {!record.topNHuoDaiCountries
              ? '-'
              : record.topNHuoDaiCountries?.map((t10c, index) => (
                  <>
                    <Tooltip key={t10c.countryCn} title={t10c.desc}>
                      <span
                        className={style.company}
                        style={{ fontSize: '14px', color: '#7a8599', fontWeight: 'normal' }}
                        dangerouslySetInnerHTML={{ __html: t10c.highLight || t10c.countryCn || '-' }}
                      />
                    </Tooltip>
                    {index + 1 === record.topNHuoDaiCountries?.length ? '' : ','}
                  </>
                ))}
          </span>
        )}
      </div>
    </>
  );
};

export const CustomsComponent: React.FC<Prop> = ({ record, text, skeletonLoading, type }) => {
  return (
    <>
      <div style={{ paddingTop: 4, gap: 10 }} className={classNames(style.companyNameItem)}>
        <span
          className={classNames(style.fieldLabel, {
            [style.isOpacity]: record.visited,
          })}
        >
          {getIn18Text('XIANGGUANCHANPINMIAOSHU')}：
        </span>
        {skeletonLoading ? (
          <>
            {' '}
            <div style={{ overflow: 'hidden', width: '100%' }}>
              {' '}
              <Skeleton.Input active={skeletonLoading} />{' '}
            </div>{' '}
          </>
        ) : (
          <>
            {/* <Tooltip placement="top" title={record.topProductDescStart || '-'}> */}
            <Tooltip placement="top" overlayClassName={style.scrollTooltip} title={<span dangerouslySetInnerHTML={{ __html: record.topProductDesc || '-' }}></span>}>
              <span
                className={classNames(style.fieldText, {
                  [style.visitedColor]: record.visited,
                })}
                dangerouslySetInnerHTML={{ __html: record.topProductDesc || '-' }}
              />
            </Tooltip>
            <Translate title={record.topProductDescStart} classnames={style.companyText} />
          </>
        )}
        {/* </Skeleton.Input> */}
      </div>
      <div
        style={{ paddingTop: 4 }}
        className={classNames(style.companyNameItem, {
          [style.isOpacity]: record.visited,
        })}
      >
        <span className={style.fieldLabel}>{getIn18Text('XIANGGUANHSCode')}：</span>
        {skeletonLoading ? (
          <>
            {' '}
            <div className={style.companyNameItemHscode} style={{ overflow: 'hidden', width: '100%' }}>
              {' '}
              <Skeleton.Input active={skeletonLoading} />{' '}
            </div>{' '}
          </>
        ) : (
          <>
            <Tooltip placement="top" title={record.topHsCodeStart || '-'}>
              <span className={style.fieldText} dangerouslySetInnerHTML={{ __html: record.topHsCode || '-' }} />
            </Tooltip>
          </>
        )}
      </div>
      <div style={{ paddingTop: 4 }} className={style.companyNameItem}>
        <span
          className={classNames(style.fieldLabel, {
            [style.isOpacity]: record.visited,
          })}
        >
          {getIn18Text('HScodeMIAOSHU')}：
        </span>
        {skeletonLoading ? (
          <>
            {' '}
            <div className={style.companyNameItemDesc} style={{ overflow: 'hidden', width: '100%' }}>
              {' '}
              <Skeleton.Input active={skeletonLoading} />{' '}
            </div>{' '}
          </>
        ) : (
          <>
            <Tooltip placement="top" title={record.topHsCodeDesc || '-'}>
              <span
                className={classNames(style.fieldText, {
                  [style.visitedColor]: record.visited,
                })}
                dangerouslySetInnerHTML={{ __html: record.topHsCodeDesc || '-' }}
              />
            </Tooltip>
            <Translate title={record.topHsCodeDesc} classnames={style.companyText} />
          </>
        )}
      </div>
    </>
  );
};
