import { Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { api, WorktableApi } from 'api';
import { WorktableCard } from '../card';
import styles from './TimeZoneWithRateCard.module.scss';
import { getTransText } from '@/components/util/translate';
import { getCityGroupName } from '../worktableUtils';
import HelpIcon from '../icons/Help';
import TimeZoneWorld from './components/TimeZoneWorld/TimeZoneWorld';
import RateTransfer from './components/RateTransfer/RateTransfer';
import { useRateTransfer } from './hooks/useRateTransfer';
import { useTimeZone } from './hooks/useTimeZone';
const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;

const TimeZoneWithRateCard: React.FC<{
  type: 'time' | 'rate';
}> = props => {
  const { type } = props;
  const [isLoading, setIsLoading] = useState(false);
  const { currencyList, rateTime, rateVal, currencyValue, fetchCurrencyList, fetchRateValByCode, handleCurrencyChange } = useRateTransfer();

  const { timeZoneList, currTime, currTimeZone, fetchCityInfoById, fetchCityList, handleCurrTimeZoneChange } = useTimeZone();

  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * 处理再未关闭上一个下拉列表时就直接点击另一个下拉列表的问题
   * 处理下拉列表层级被遮挡的问题
   */
  const prevContainerZIndex = useRef('-1');
  const visibleCount = useRef(0);
  const handleDropDownVisibleChange = (open: boolean) => {
    if (
      !containerRef.current ||
      !containerRef.current.parentElement ||
      !containerRef.current.parentElement.parentElement ||
      !containerRef.current.parentElement.parentElement.parentElement
    )
      return;
    if (open) {
      visibleCount.current += 1;
      prevContainerZIndex.current === '-1' && (prevContainerZIndex.current = containerRef.current.parentElement.parentElement.parentElement.style.zIndex);
      containerRef.current.parentElement.parentElement.parentElement.style.zIndex = '20';
    } else {
      visibleCount.current -= 1;
      if (visibleCount.current > 0) return;
      window.setTimeout(() => {
        if (
          !containerRef.current ||
          !containerRef.current.parentElement ||
          !containerRef.current.parentElement.parentElement ||
          !containerRef.current.parentElement.parentElement.parentElement
        )
          return;
        containerRef.current.parentElement.parentElement.parentElement.style.zIndex = prevContainerZIndex.current;
      }, 150);
    }
  };

  const handleRefresh = () => {
    if (isLoading) return;
    // 刷新值，不刷列表
    setIsLoading(true);
    if (type === 'rate') {
      fetchRateValByCode().finally(() => setIsLoading(false));
    } else if (type === 'time') {
      fetchCityInfoById().finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    // 初始化列表数据
    setIsLoading(true);
    if (type === 'rate') {
      fetchCurrencyList().finally(() => setIsLoading(false));
    }
    if (type === 'time') {
      fetchCityList().finally(() => setIsLoading(false));
    }
  }, []);

  useEffect(() => {
    if (currencyValue.currencyCode === '') return;
    // 变化时请求对应汇率信息
    fetchRateValByCode();
  }, [currencyValue]);

  return (
    <WorktableCard
      title={
        type === 'time' ? (
          getTransText('SHIJIESHIJIAN')
        ) : (
          <div className={styles.rateTitleGroup}>
            <span style={{ marginRight: 4 }}>{getTransText('WAIHUIPAIJIA')}</span>
            <Tooltip
              trigger={'hover'}
              placement="top"
              title={
                <>
                  <div className={styles.tipArrow} />
                  {getTransText('WAIHUIPAIJIALAIYUAN')} {rateTime} {getTransText('SHUJUJINGONGCANKAO')}
                </>
              }
            >
              <div style={{ display: 'flex' }}>
                <HelpIcon />
              </div>
            </Tooltip>
          </div>
        )
      }
      titleStyles={{
        fontSize: 16,
      }}
      headerToolsConfig={[
        {
          refreshIconStyles: {
            transform: 'scale(0.8)',
            marginLeft: -2,
          },
          onRefresh: handleRefresh,
        },
      ]}
      loading={isLoading}
      wrapStyles={{ padding: '18px 18px 0px 18px' }}
    >
      <div className={styles.timeZoneWithRateCardCont} ref={containerRef}>
        {type === 'time' && (
          <TimeZoneWorld
            handleDropDownVisibleChange={handleDropDownVisibleChange}
            timeZoneList={timeZoneList}
            currTime={currTime}
            currTimeZone={currTimeZone}
            handleTimeZoneChange={handleCurrTimeZoneChange}
          />
        )}
        {type === 'rate' && (
          <RateTransfer
            rateTime={rateTime}
            rate={rateVal}
            currencyValue={currencyValue}
            currencyList={currencyList}
            handleCurrencyChange={handleCurrencyChange}
            handleDropDownVisibleChange={handleDropDownVisibleChange}
          />
        )}
      </div>
    </WorktableCard>
  );
};

export default TimeZoneWithRateCard;
