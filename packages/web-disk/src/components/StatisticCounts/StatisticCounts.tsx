import React, { useState, useCallback } from 'react';
import { ResponseExternalShareStatistic } from 'api';
import { DiskPage } from '../../disk';
import SiriusSelect from '@web-common/components/UI/SiriusSelect';
import StatGroupSkeleton from './statGroupSkeleton';
import { Banner } from '../Banner';
import style from './StatisticCounts.module.scss';
import { getIn18Text } from 'api';
export interface Props {
  curDirId: number;
  externalStatisticTimeLoading?: boolean;
  externalShareStatisticCounts?: Partial<ResponseExternalShareStatistic>;
  getCurrentList: ({ init: boolean }) => void;
  setCurrentPage?: (val: DiskPage) => void;
  changeExternalStatisticTime?: (val: any) => void;
  templateModalShow?: (eventFrom: 'Banner' | 'List') => void;
}
const StatisticCounts: React.FC<Props> = props => {
  const {
    curDirId,
    externalStatisticTimeLoading,
    externalShareStatisticCounts = {},
    getCurrentList,
    setCurrentPage,
    changeExternalStatisticTime,
    templateModalShow,
  } = props;
  const [externalStatisticTime, setExternalStatisticTime] = useState<number>(-1);
  const statisticCounts = [
    {
      key: 'share_count',
      name: getIn18Text('FENXIANGLIANJIESHU'),
      count: externalShareStatisticCounts.shareUrlCounts || 0,
    },
    {
      key: 'read_count',
      name: getIn18Text('YUEDUCISHU'),
      count: externalShareStatisticCounts.readCounts || 0,
    },
    {
      key: 'download_count',
      name: getIn18Text('XIAZAICISHU'),
      count: externalShareStatisticCounts.downloadCounts || 0,
    },
  ];
  const staticTimeOptions = [
    {
      label: getIn18Text('QUANBU'),
      value: -1,
    },
    {
      label: getIn18Text('ZUIJIN7TIAN'),
      value: 7,
    },
    {
      label: getIn18Text('ZUIJIN1GEYUE'),
      value: 30,
    },
    {
      label: getIn18Text('ZUIJIN3GEYUE'),
      value: 90,
    },
  ];
  const onSelectChange = val => {
    setExternalStatisticTime(val);
    // 搜索
    changeExternalStatisticTime && changeExternalStatisticTime(val);
  };
  const toShareStaticPage = () => {
    setCurrentPage && setCurrentPage('static');
  };
  // 展示banner详情
  const onBannerScreenClickHandle = useCallback(() => {
    templateModalShow && templateModalShow('Banner');
  }, []);
  const shareUrlCounts = externalShareStatisticCounts.shareUrlCounts || 0;
  return (
    <div className={style.statisticCounts}>
      <Banner
        dirId={curDirId}
        onScreenClick={onBannerScreenClickHandle}
        onCreateSuccess={() => {
          getCurrentList({ init: true });
        }}
      />
      {externalStatisticTimeLoading && shareUrlCounts === 0 && <StatGroupSkeleton />}
      {
        // 只要有数据就展示
        !(shareUrlCounts === 0 && externalStatisticTime === -1) && (
          <div className={style.staticContent}>
            <SiriusSelect
              defaultValue={externalStatisticTime}
              onChange={onSelectChange}
              labelClass={style.staticTitle}
              label={getIn18Text('HUDONGTONGJI')}
              options={staticTimeOptions}
            />
            {/* 分享链接数数、阅读次数、下载次数... */}
            <div className={style.staticBoxGroup}>
              {statisticCounts.map(item => (
                <div key={item.key} className={style.staticBox} data-test-id={`disk_statistic_${item.key}_btn`} onClick={toShareStaticPage}>
                  <div className={style.boxIcon} />
                  <span>{item.name}</span>
                  <div className={style.boxLabel}>{getIn18Text('WAIBU')}</div>
                  <div className={style.boxCount}>{item.count}</div>
                </div>
              ))}
            </div>
          </div>
        )
      }
    </div>
  );
};
export default StatisticCounts;
