import { getIn18Text } from 'api';
import React, { useState, useCallback } from 'react';
import styles from './rcmdFilter.module.scss';
// import SiriusCheckbox from '@web-common/components/UI/Checkbox/siriusCheckbox';
import { Tooltip } from 'antd';
import { ReactComponent as Help } from '@/images/icons/customs/help.svg';
import SiriusCheckbox from '@lingxi-common-component/sirius-ui/Checkbox';
import { globalSearchDataTracker } from '@/components/Layout/globalSearch/tracker';
import { ReactComponent as Reset } from '@/images/icons/globalSearch/reset.svg';
import { filterProps } from '../../SmartRcmd';

interface RcmdFilterProps {
  filterParams: filterProps;
  setFilterParams: (params: filterProps) => void;
  ruleID?: number;
  keyword?: string;
}

const RcmdFilter: React.FC<RcmdFilterProps> = ({ setFilterParams, filterParams, ruleID, keyword }) => {
  const toggleFilter = (name: string, checked: boolean) => {
    globalSearchDataTracker.tractRecommendFilter({
      noEdm: filterParams?.filterEdm,
      ruleID,
      keyword,
    });
    setFilterParams({
      ...filterParams,
      [name]: checked,
    });
  };
  const boxFilter = () => {
    return (
      <div className={styles.searchInputWrapper}>
        <span className={styles.inputLabel}>{getIn18Text('SHAIXUAN')}</span>
        <span>
          <SiriusCheckbox
            checked={filterParams.filterEdm}
            onChange={e => {
              toggleFilter('filterEdm', e.target.checked);
            }}
            style={{ color: '#272E47' }}
          >
            {getIn18Text('WEIFASONGGUOYINGXIAOYOUJIAN')}
          </SiriusCheckbox>
        </span>
        <span>
          <SiriusCheckbox
            checked={filterParams.filterCustomer}
            onChange={e => {
              toggleFilter('filterCustomer', e.target.checked);
            }}
            style={{ color: '#272E47' }}
          >
            <div className={styles.filterCheckBoxFlex}>
              {'未录入线索/客户'}
              <Tooltip placement="top" title={'可过滤添加为线索/客户的公司，数据刷新可能存在一定的延迟'}>
                <Help />
              </Tooltip>
            </div>
          </SiriusCheckbox>
        </span>
        <span
          className={styles.resetBtn}
          onClick={() =>
            setFilterParams({
              filterEdm: false,
              filterCustomer: false,
            })
          }
        >
          {getIn18Text('ZHONGZHI')}
          <span className={styles.resetIcon}>
            <Reset />
          </span>
        </span>
      </div>
    );
  };
  return <>{boxFilter()}</>;
};

export default RcmdFilter;
