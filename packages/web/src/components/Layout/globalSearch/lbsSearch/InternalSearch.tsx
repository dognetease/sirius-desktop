import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { CompanyIdType, GlobalLabelSearchResItem, getIn18Text, util } from 'api';
import { useMemoizedFn } from 'ahooks';
import { Empty, Input, Select, Table } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as LBSEmpty } from '@/images/globalSearch/lbs_empty.svg';
import styles from './LbsSearch.module.scss';
import LBSHistoryDropDown from './component/HistoryDropDown';
import { renderLbsTableColumns } from './columns';
import { globalSearchDataTracker } from '../tracker';
import { edmCustomsApi, globalSearchApi } from '../constants';
import ZnCompanyDetail from '../../CustomsData/customs/customsDetail/components/znCompanyDetail';

interface GaoDeMapResultItem {
  name: string;
  website: string;
  tel: string;
  address: string;
}

interface RadiusPlacesState extends GaoDeMapResultItem {
  customerStatus?: string;
  orgCustomerStatus?: string;
  contactStatus?: string;
  idStatus?: CompanyIdType;
  country?: string;
  referId?: string | null;
  customerLabelType?: 'LEADS' | 'ORG_LEADS' | 'OPEN_SEA_LEADS' | 'CUSTOMER' | 'ORG_CUSTOMER' | 'OPEN_SEA_CUSTOMER' | null;
}

type MapStatus = 'complete' | 'error' | 'no_data';

const INTERNAL_COUNTRY = 'China';
const COMPANY_SEARCH_TYPE = '170000';
const MAP_CONTAINER_ID = 'search-lbs-mapcontainer';
const AREA_INPUT_ID = 'areainput';
const DEFAULT_RADIUS = 5000;
const SEARCH_PAGE_SIZE = 25;
const HISTORY_SAVE_KEY = 'LBS_INTERNAL_HISTORY_KEY';
const INIT_LOCATION = [105.602725, 37.076636];

export const InternalSearch: FC = () => {
  const mapRef = useRef<any>({});
  const placeSearchRef = useRef<any>({});
  const geocoderRef = useRef<any>(null);
  const locationRef = useRef<number[]>(INIT_LOCATION);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const detailLoadingRef = useRef<boolean>(false);
  // 实际搜索的公里
  const radiusRef = useRef<number>(DEFAULT_RADIUS);
  const pageIndexRef = useRef<number>(1);
  const [radiusPlaces, setRadiusPlaces] = React.useState<RadiusPlacesState[]>([]);
  const [detailRecord, setDetailRecord] = useState<RadiusPlacesState | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  // 选择的公里
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS);
  const [area, setArea] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [searchedKeyword, setSearchedKeyword] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const fetchData = useMemoizedFn(async (requestedResults: GaoDeMapResultItem[]) => {
    setLoading(true);
    try {
      await globalSearchApi.saveLbsChineseData({
        datas: requestedResults.map(e => ({
          name: e.name,
          webUrl: e.website,
          phoneNumber: e.tel,
          country: INTERNAL_COUNTRY,
          address: e.address,
        })),
      });
      const [labelResult, idResult] = await Promise.all([
        globalSearchApi.globalLabelSearch({
          datas: requestedResults.map(e => ({
            country: INTERNAL_COUNTRY,
            name: e.name || '',
            companyId: '',
          })),
        }),
        edmCustomsApi.getChineseCompanyIdsByCompanyList({
          companyList: requestedResults.map(e => ({
            companyName: e.name || '',
            country: INTERNAL_COUNTRY,
          })),
        }),
      ]);

      const labelResultMap = (labelResult ?? []).reduce((prev, curr) => ({ ...prev, [curr.name]: curr }), {} as Record<string, GlobalLabelSearchResItem>);
      const newList = requestedResults.map((e, index) => {
        const labelData = labelResultMap[e.name];
        return {
          ...requestedResults[index],
          ...e,
          ...labelData,
          formatted_address: e.address,
          formatted_phone_number: e.tel,
          idStatus: idResult[index],
        };
      });
      setRadiusPlaces(prev => [...prev, ...newList]);
    } catch (error) {
      // 重复请求进入这里，所以理论上不应该刷新列表
      const labelResult = await globalSearchApi.globalLabelSearch({
        datas: requestedResults.map(e => ({
          country: INTERNAL_COUNTRY,
          name: e.name || '',
          companyId: '',
        })),
      });
      const labelResultMap = (labelResult ?? []).reduce((prev, curr) => ({ ...prev, [curr.name]: curr }), {} as Record<string, GlobalLabelSearchResItem>);
      const newList = requestedResults.map(e => {
        const labelData = labelResultMap[e.name];
        return {
          ...e,
          ...labelData,
          formatted_address: e.address,
          formatted_phone_number: e.tel,
        };
      });
      setRadiusPlaces(prev => [...prev, ...newList]);
    }
    setLoading(false);
  });
  const handleReset = useMemoizedFn(() => {
    setKeyword('');
    setArea('');
    placeSearchRef.current.search('');
    setRadius(DEFAULT_RADIUS);
    setSearchedKeyword('');
    setTotal(0);
    setRadiusPlaces([]);
    radiusRef.current = DEFAULT_RADIUS;
    pageIndexRef.current = 1;
  });
  const handleView = useMemoizedFn(async (record: RadiusPlacesState) => {
    if (detailLoadingRef.current) {
      return;
    }
    detailLoadingRef.current = true;
    if (record.idStatus?.id) {
      setDetailRecord(record);
      detailLoadingRef.current = false;
      return;
    }
    // 地理位置服务查国家
    try {
      // 调用查询接口
      const [{ id }] = await edmCustomsApi.getChineseCompanyIdsByCompanyList({
        companyList: [
          {
            companyName: record.name,
            country: INTERNAL_COUNTRY,
          },
        ],
      });
      if (!id) {
        detailLoadingRef.current = false;
        SiriusMessage.warning({ content: '暂无匹配的国内公司' });
        return;
      }
      setDetailRecord({
        ...record,
        idStatus: {
          ...(record.idStatus ?? ({} as CompanyIdType)),
          id,
        },
      });
    } catch (error) {
      // do nothing
    }
    detailLoadingRef.current = false;
  });
  const doNearBySearch = useMemoizedFn((currSearchWord: string) => {
    placeSearchRef.current.setPageIndex(pageIndexRef.current);
    placeSearchRef.current.searchNearBy(
      `${currSearchWord}|${util.toPinyin(currSearchWord)}`,
      locationRef.current,
      radiusRef.current,
      (status: MapStatus, results: any) => {
        if (status !== 'complete' || !results?.poiList?.pois?.length) {
          setLoading(false);
          return;
        }
        setSearchedKeyword(currSearchWord);
        fetchData(results.poiList.pois);
        if (results.poiList.pois.length < SEARCH_PAGE_SIZE) {
          setTotal(radiusPlaces.length + results.poiList.pois.length);
        } else {
          setTotal(results.poiList.count);
        }
      }
    );
  });
  const loadMore = useMemoizedFn(() => {
    globalSearchDataTracker.trackLbsInternalListMore();
    pageIndexRef.current += 1;
    doNearBySearch(searchedKeyword);
  });
  const handleSearch = useMemoizedFn(async (targetWord?: string) => {
    const searchWord = targetWord || keyword;
    if (!area) {
      SiriusMessage.warn('请输入省份地区或街道名称');
      return;
    }
    if (!searchWord) {
      SiriusMessage.warn('请输入关键词');
      return;
    }
    setLoading(true);
    setRadiusPlaces([]);
    setTotal(0);
    setSearchedKeyword(searchWord);
    try {
      await globalSearchApi.searchTextCheck({ text: searchWord });
    } catch {
      setLoading(false);
      return;
    }
    globalSearchDataTracker.trackLbsInternalSearch({
      country: area,
      keyword: searchWord,
      radius,
    });
    radiusRef.current = radius;
    pageIndexRef.current = 1;
    doNearBySearch(searchWord);
  });

  const changeVisible = useMemoizedFn((visible: boolean) => {
    if (visible) return;
    setDetailRecord(null);
  });

  useEffect(() => {
    (window as any)._AMapSecurityConfig = {
      securityJsCode: '1384b8d2b135f115d27b7adb597bc7f3',
    };
    (window as any).onLbsLoad = () => {
      const { AMap } = window as any;
      if (!document.getElementById(MAP_CONTAINER_ID)) return;
      mapRef.current = new AMap.Map(MAP_CONTAINER_ID, {
        zoom: 5, // 初始化地图级别
        center: INIT_LOCATION, // 初始化地图中心点位置
      });
      AMap.plugin(['AMap.PlaceSearch', 'AMap.AutoComplete', 'AMap.Geocoder'], () => {
        const auto = new AMap.AutoComplete({
          input: AREA_INPUT_ID,
        });
        placeSearchRef.current = new AMap.PlaceSearch({
          map: mapRef.current,
          type: COMPANY_SEARCH_TYPE, // 兴趣点类别
          pageSize: SEARCH_PAGE_SIZE, // 单页显示结果条数
          pageIndex: 1, // 页码
          citylimit: true,
          autoFitView: true, // 是否自动调整地图视野使绘制的 Marker点都处于视口的可见范围
        });
        geocoderRef.current = new AMap.Geocoder({
          extensions: 'all',
        });
        auto.on('select', (e: any) => {
          placeSearchRef.current.setCity(e.poi.adcode);
          placeSearchRef.current.search(e.poi.name);
          setArea(e.poi.name);
        });
      });
    };
    const url = 'https://webapi.amap.com/maps?v=2.0&key=912fc981f56fe7c2609658754b30abf9&callback=onLbsLoad';
    const jsapi = document.createElement('script');
    jsapi.src = url;
    document.head.appendChild(jsapi);
  }, []);
  useEffect(() => {
    if (keyword) {
      setOpen(false);
    }
  }, [keyword]);
  useEffect(() => {
    if (!area || !geocoderRef.current) return;
    geocoderRef.current.getLocation(area, (status: MapStatus, result: any) => {
      if (status !== 'complete' || !result?.geocodes?.length) return;
      try {
        const locationObj = result.geocodes[0].location;
        locationRef.current = [Number(locationObj.lng), Number(locationObj.lat)];
      } catch (e) {
        // do nothing
      }
    });
  }, [area]);
  const hasMore = useMemo(() => radiusPlaces.length < total, [radiusPlaces, total]);
  return (
    <>
      <div className={styles.map}>
        <div id={MAP_CONTAINER_ID} style={{ height: '389px', width: '100%' }} />
        <div className={styles.inputRow}>
          <div className={styles.mapSearchWrapper}>
            <div className={styles.label}>省份地区</div>
            <Input
              placeholder="请输入省份地区或街道名称"
              className={styles.mapSearch}
              value={area}
              onChange={e => {
                setArea(e.target.value);
              }}
              id={AREA_INPUT_ID}
              onPressEnter={() => handleSearch()}
            />
          </div>
          <div className={styles.radiusSearchWrapper} ref={inputWrapperRef}>
            <div className={styles.label}>{getIn18Text('GUANJIANCI')}</div>
            <Input
              placeholder="行业词/产品词/公司名等"
              onFocus={() => {
                !keyword && setOpen(true);
              }}
              style={{
                width: 390,
                marginRight: 20,
              }}
              addonBefore={
                <Select onChange={setRadius} options={[5, 10, 20, 50].map(e => ({ value: e * 1000, label: `${e}${getIn18Text('GONGLI')}` }))} value={radius} />
              }
              value={keyword}
              onChange={e => {
                setKeyword(e.target.value);
              }}
              onPressEnter={() => handleSearch()}
            />
            <Button style={{ marginRight: 12, marginLeft: 'auto' }} btnType="primary" onClick={() => handleSearch()}>
              {getIn18Text('SOUSUO')}
            </Button>
            <Button btnType="minorLine" onClick={handleReset}>
              {getIn18Text('ZHONGZHI')}
            </Button>
            <LBSHistoryDropDown
              target={inputWrapperRef.current?.querySelector('.ant-input')}
              open={open}
              changeOpen={setOpen}
              keyword={searchedKeyword}
              historySaveKey={HISTORY_SAVE_KEY}
              onClick={value => {
                setKeyword(value);
                handleSearch(value);
              }}
            />
          </div>
        </div>
      </div>
      <div className={styles.table}>
        <Table<RadiusPlacesState>
          columns={renderLbsTableColumns({ keywords: searchedKeyword, handleView, internal: true })}
          rowKey="id"
          dataSource={radiusPlaces}
          pagination={false}
          loading={loading}
          tableLayout="fixed"
          onRow={record => ({
            onClick: () => {
              handleView(record);
            },
          })}
          footer={
            hasMore && !loading
              ? () => (
                  <div className={styles.footer}>
                    <Button btnType="minorLine" onClick={loadMore}>
                      {getIn18Text('CHAKANGENGDUO')}
                    </Button>
                  </div>
                )
              : undefined
          }
          locale={{
            emptyText() {
              return loading ? null : <Empty image={<LBSEmpty />} description={getIn18Text('ZANWUSHUJU')} />;
            },
          }}
        />
      </div>
      {detailRecord && (
        <ZnCompanyDetail
          detailId={`${detailRecord.idStatus?.id ?? ''}`}
          visible={!!detailRecord}
          changeVisible={changeVisible}
          companyName={detailRecord.name}
          sourcName="lbs"
        />
      )}
    </>
  );
};
