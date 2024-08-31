import { AirlineItem, ForwarderSearchTop, ForwarderType, customsTimeFilterType } from 'api';
import React, { useCallback, useMemo } from 'react';
import styles from './historytaglist.module.scss';
import { ForwarderFormType } from '../../ForwarderSearch';
import { timeRangeOptions } from '../../../search/constant';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';

export interface HistoryTagListProps {
  onChose?(item: Pick<Partial<ForwarderFormType>, 'portOfLadings' | 'portOfUnLadings' | 'airlines' | 'timeFilter' | 'updateTime' | 'queryType'>): void;
  list?: ForwarderSearchTop[];
}

const getValidTimeFilterAndUpdateTime = (timeCond: string = '') => {
  const [tf, upt = ''] = timeCond.split('#');
  const defaultTimeFilterOption = timeRangeOptions[0];
  const timeFilter = timeRangeOptions.find(e => e.value === tf) || defaultTimeFilterOption;
  return {
    timeFilter,
    updateTime: upt,
  };
};

const HistoryTagList: React.FC<HistoryTagListProps> = ({ onChose, list: searchHistoryList }) => {
  const processedList = useMemo(() => {
    if (!searchHistoryList) {
      return [];
    }
    return searchHistoryList.map(e => ({
      ...e,
      timeCond: getValidTimeFilterAndUpdateTime(e.timeCond),
    }));
  }, [searchHistoryList]);

  const getText = useCallback((it: (typeof processedList)[number]) => {
    let text = '';
    const joinText = '/';
    const joinItem = (items: AirlineItem[]) => {
      return items
        .map(item => {
          return item.nameCn || item.name;
        })
        .join(joinText);
    };
    if (it.airlines && it.airlines.length > 0) {
      text += joinItem(it.airlines);
    } else if (it.portOfLadings && it.portOfUnLadings) {
      text += joinItem(it.portOfLadings);
      text += ' - ';
      text += joinItem(it.portOfUnLadings);
    }
    // 处理时间
    text += '(';
    if (it.timeCond.updateTime) {
      text += it.timeCond.updateTime;
    } else {
      text += it.timeCond.timeFilter.label;
    }
    text += ')';
    return text;
  }, []);

  const handleClick = (item: (typeof processedList)[number]) => {
    const { timeCond } = item;
    onChose?.({
      airlines: item.airlines?.map(e => ({
        value: e.name,
        label: e.nameCn,
      })),
      portOfUnLadings: item.portOfUnLadings?.map(e => ({
        value: e.name,
        label: e.nameCn,
      })),
      portOfLadings: item.portOfLadings?.map(e => ({
        value: e.name,
        label: e.nameCn,
      })),
      timeFilter: timeCond.timeFilter.value,
      updateTime: timeCond.updateTime,
      queryType: item.airlines && item.airlines.length > 0 ? ForwarderType.AirLine : ForwarderType.Port,
    });
  };
  return (
    <div className={styles.tagList}>
      {processedList.map((hl, index) => (
        <div className={styles.tag} key={index} onClick={() => handleClick(hl)}>
          <EllipsisTooltip>{getText(hl)}</EllipsisTooltip>
        </div>
      ))}
    </div>
  );
};

export default HistoryTagList;
