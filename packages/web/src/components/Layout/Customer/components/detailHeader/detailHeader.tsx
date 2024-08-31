import React from 'react';
import classnames, { Argument as ClassnamesTypes } from 'classnames';
import EllipsisTooltip from '../ellipsisTooltip/ellipsisTooltip';
import style from './detailHeader.module.scss';
import { getIn18Text, apiHolder } from 'api';
const { isMac } = apiHolder.env;
const systemApi = apiHolder.api.getSystemApi();
const isWindows = systemApi.isElectron() && !isMac;
interface DetailHeaderProps {
  detailType?: 'supplier' | 'buysers' | 'peers';
  className?: ClassnamesTypes;
  logo?: string;
  defaultLogo: string;
  title: string;
  titleId?: string;
  content: React.ReactNode;
  options: React.ReactNode;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  isCanToggle?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  mergeCompanys?: string[];
  selectCompanys?: () => void;
  selectedCompanyList?: string[];
}
const DetailHeader: React.FC<DetailHeaderProps> = props => {
  const {
    className,
    logo,
    defaultLogo,
    title,
    titleId,
    isCanToggle,
    content,
    options,
    prevDisabled,
    nextDisabled,
    onPrev,
    onNext,
    mergeCompanys,
    selectCompanys,
    selectedCompanyList,
    detailType = 'buysers',
  } = props;

  return (
    <div className={classnames([style.detailHeader, className])}>
      <div className={style.header}>
        <span style={{ maxWidth: '360px' }}>
          <EllipsisTooltip className={style.title}>{title}</EllipsisTooltip>
          {titleId && (
            <div className={style.titleId}>
              {getIn18Text('BIANHAO\uFF1A')}
              {titleId}
            </div>
          )}
          {isCanToggle && (
            <>
              <div
                className={classnames(style.prev, {
                  [style.prevDisabled]: prevDisabled,
                })}
                onClick={() => !prevDisabled && onPrev && onPrev()}
              />
              <div
                className={classnames(style.next, {
                  [style.nextDisabled]: nextDisabled,
                })}
                onClick={() => !nextDisabled && onNext && onNext()}
              />
            </>
          )}
        </span>
      </div>
      <div
        hidden={!mergeCompanys}
        className={classnames([
          style.content,
          {
            [style.mergeCompanyInfo]: mergeCompanys && mergeCompanys.length > 0,
          },
        ])}
      >
        <div className={style.mergeCompany}>
          {selectedCompanyList && selectedCompanyList.length > 0
            ? `已自动合并已选择的${selectedCompanyList.length}家公司的${detailType === 'peers' ? '货运数据' : '海关数据'}`
            : `${getIn18Text('YIZIDONGHEBING')}${mergeCompanys?.length}家公司名称相似的${detailType === 'peers' ? '货运数据' : '海关数据'}`}{' '}
          <span
            className={style.mergeCompanyQuery}
            onClick={() => {
              selectCompanys && selectCompanys();
            }}
          >
            {getIn18Text('CHAKANHEBINGGONGSI')}
          </span>
        </div>
        {content}
      </div>
      <div hidden={!!mergeCompanys} className={style.content}>
        {content}
      </div>
      <div
        style={{ right: '71px' }}
        className={classnames([
          style.options,
          {
            [style.mergeCompanyOption]: mergeCompanys && mergeCompanys.length > 0,
          },
        ])}
      >
        {options}
      </div>
    </div>
  );
};
export default DetailHeader;
DetailHeader.defaultProps = {
  isCanToggle: true,
};
