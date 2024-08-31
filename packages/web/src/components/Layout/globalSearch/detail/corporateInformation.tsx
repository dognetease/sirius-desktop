import React, { useState, useEffect } from 'react';
import style from './companyDetail.module.scss';
import { ReactComponent as Deminter } from '../assets/demo_inter.svg';
import { ReactComponent as NiversalDate } from '../assets/niversal_date.svg';
export interface CorporateInformationProps {
  newsList?: newsListArr[];
  htmlChild?: React.ReactNode;
}
export interface newsListArr {
  content?: string;
  date?: string;
  domain?: string;
  title?: string;
  url?: string;
}
export const CorporateInformation: React.FC<CorporateInformationProps> = props => {
  const { newsList, htmlChild } = props;
  return (
    <div className={style.block}>
      {htmlChild}
      {newsList?.map(item => {
        return (
          <div className={style.informationBox}>
            <a
              className={style.informationTitle}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              onClick={e => {
                e.stopPropagation();
              }}
            >
              {item?.title || '-'}
            </a>
            <div className={style.informatioFlexbox}>
              <div className={style.informatioContent}>{item.content}</div>
              <div className={style.informatioRight}>
                <div className={style.informatioSvg}>
                  <NiversalDate />
                  <span className={style.informatioDate}>
                    {item?.date ? new Date(item?.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                  </span>
                </div>
                <div className={style.informatioSvg}>
                  <Deminter />
                  <a
                    className={style.informatioDomain}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => {
                      e.stopPropagation();
                    }}
                  >
                    {item.domain || '-'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
