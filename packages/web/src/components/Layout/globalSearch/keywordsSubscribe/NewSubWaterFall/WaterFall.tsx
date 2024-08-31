import { ICompanySubFallItem, api } from 'api';
import React, { useEffect, useState } from 'react';
import CompanyCard from './CompanyCard';
import styles from './newsubwaterfall.module.scss';
import { useIntersection } from 'react-use';
import classNames from 'classnames';
import { ReactComponent as Loading } from './asset/loading.svg';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { CompanyDetail } from '../../detail/CompanyDetail';
import { globalSearchDataTracker } from '../../tracker';

const dataStoreApi = api.getDataStoreApi();

const KEY_WORD_SUB_VIEW_WATER_FALL_ITEM_KEY = 'KEY_WORD_SUB_VIEW_WATER_FALL_ITEM_KEY';

interface WaterFallProps {
  list: ICompanySubFallItem[];
  ignoredSet: Set<string>;
  currentLoaded: ICompanySubFallItem[] | null;
  loading: boolean;
  loadMore?(): void;
  onToggleIgnore?(params: { id: string; ignore: boolean }): void;
  onRecordSuccess?(id: string): void;
}

const WaterFall: React.FC<WaterFallProps> = ({ list, loadMore, onToggleIgnore, loading, currentLoaded, ignoredSet, onRecordSuccess }) => {
  const [colSize, setColSize] = useState<number>(3);
  const [columns, setColumns] = useState<Array<ICompanySubFallItem[]>>(new Array(colSize).fill([]));
  const loadMoreCount = React.useRef<number>(0);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const loadMoreIntersection = useIntersection(loadMoreRef, {
    root: null,
    rootMargin: '0px',
    threshold: 1,
  });
  const [map, setMap] = useState<
    Map<
      number,
      {
        height: number;
        id: string | number;
        index: number;
        item: ICompanySubFallItem;
      }
    >
  >(new Map());

  const [detailState, setDetailState] = useState<{
    visible: boolean;
    id?: string;
  }>({
    visible: false,
  });

  const handleVirtualComputed = (params: { height: number; id: string | number; index: number; item: ICompanySubFallItem }) => {
    const { index } = params;
    const newMap = new Map(map);
    if (!newMap.has(index)) {
      newMap.set(index, params);
    }
    setMap(newMap);
  };
  useEffect(() => {
    if (map.size !== list.length) {
      return;
    }
    const tmepList: {
      height: number;
      id: string | number;
      index: number;
      item: ICompanySubFallItem;
    }[] = [];
    map.forEach((value, key) => {
      tmepList[key] = value;
    });
    const tmepColumns: Array<ICompanySubFallItem[]> = new Array(colSize).fill([]);
    const tempColumnsHeights: Array<number> = new Array(colSize).fill(0);
    for (let index = 0; index < tmepList.length; index++) {
      const { height, item } = tmepList[index];
      let minIndex = 0;
      let minHeight = tempColumnsHeights[minIndex];
      for (let jndex = 0; jndex < tempColumnsHeights.length; jndex++) {
        const curHeight = tempColumnsHeights[jndex];
        if (curHeight < minHeight) {
          minIndex = jndex;
          minHeight = curHeight;
        }
      }
      tempColumnsHeights[minIndex] = tempColumnsHeights[minIndex] + height;
      tmepColumns[minIndex] = tmepColumns[minIndex].concat(item);
    }
    setColumns(tmepColumns);
  }, [map.size, list.length, colSize]);

  useEffect(() => {
    if (loadMoreIntersection && loadMoreIntersection.intersectionRatio >= 1) {
      loadMoreCount.current > 0 && loadMore?.();
      loadMoreCount.current += 1;
    }
  }, [loadMoreIntersection, loadMoreIntersection?.intersectionRatio]);

  const handleInterSection = (item: ICompanySubFallItem) => {
    dataStoreApi.get(KEY_WORD_SUB_VIEW_WATER_FALL_ITEM_KEY).then(({ data = '[]' }) => {
      try {
        const parsed: string[] = JSON.parse(data);
        const newSet = new Set(parsed);
        newSet.add(item.id);
        dataStoreApi.put(KEY_WORD_SUB_VIEW_WATER_FALL_ITEM_KEY, JSON.stringify(Array.from(newSet)));
      } catch (error) {}
    });
  };

  useEffect(() => {
    const { data = '[]' } = dataStoreApi.getSync(KEY_WORD_SUB_VIEW_WATER_FALL_ITEM_KEY);
    try {
      const parsed: string[] = JSON.parse(data);
      parsed.length > 0 &&
        globalSearchDataTracker.trackWaterFallViewCount({
          count: parsed.length,
        });
    } catch (error) {}
    dataStoreApi.put(KEY_WORD_SUB_VIEW_WATER_FALL_ITEM_KEY, '[]');
    return () => {};
  }, []);

  return (
    <>
      <div className={styles.waterFallWrapper}>
        <div className={styles.ghostList}>
          {new Array(colSize).fill(null).map((_, index) => {
            return (
              <div
                key={index}
                className={styles.ghostCol}
                style={
                  index === 0
                    ? {
                        position: 'relative',
                      }
                    : undefined
                }
              >
                {index === 0 &&
                  list.map((item, index) => (
                    <CompanyCard
                      style={{ position: 'absolute', left: 0, right: 0 }}
                      key={item.id}
                      data={item}
                      onComputeCompelte={params => {
                        handleVirtualComputed({
                          index,
                          item,
                          ...params,
                        });
                      }}
                    />
                  ))}
              </div>
            );
          })}
        </div>
        <div className={styles.waterFallList}>
          {columns.map((el, i) => (
            <div key={i} className={styles.waterFallCol}>
              {el.map(item => (
                <CompanyCard
                  onViewDetail={() => {
                    setDetailState({
                      visible: true,
                      id: item.id,
                    });
                  }}
                  ignore={ignoredSet.has(item.id)}
                  onToggleIgnore={onToggleIgnore}
                  onRecordSuccess={onRecordSuccess}
                  onInterSection={() => handleInterSection(item)}
                  key={item.id}
                  data={item}
                />
              ))}
            </div>
          ))}
        </div>
        <div
          ref={loadMoreRef}
          className={classNames(styles.loadMore, {
            [styles.loadMoreLoading]: loading || (currentLoaded && currentLoaded.length === 0),
          })}
        >
          {loading ? (
            <>
              <span className={styles.loadingIcon}>
                <Loading />
              </span>
              <span>加载中</span>
            </>
          ) : (
            <span>到底啦</span>
          )}
        </div>
      </div>
      <Drawer
        visible={detailState.visible}
        onClose={() => {
          setDetailState({
            visible: false,
          });
        }}
        width={872}
        zIndex={1031}
      >
        {!!detailState.id && detailState.visible ? (
          <CompanyDetail
            productSubPage
            onIgnoreCompany={() => {
              detailState.id &&
                onToggleIgnore?.({
                  id: detailState.id,
                  ignore: false,
                });
              setDetailState({
                visible: false,
              });
            }}
            showSubscribe={false}
            id={detailState.id}
            reloadToken={0}
            scene="keywords"
          />
        ) : null}
      </Drawer>
    </>
  );
};

export default WaterFall;
