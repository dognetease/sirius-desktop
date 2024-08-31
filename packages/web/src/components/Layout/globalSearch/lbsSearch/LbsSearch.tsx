import React, { CSSProperties, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { ReactComponent as LBSEmpty } from '@/images/globalSearch/lbs_empty.svg';
import { api, apis, CompanyIdType, EdmCustomsApi, GlobalSearchApi } from 'api';
import classnames from 'classnames';
import styles from './LbsSearch.module.scss';
import _uniqBy from 'lodash/uniqBy';
import { Alert, Empty, Input, Select, Spin, Table } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import SiriusAlert from '@web-common/components/UI/Alert/Alert';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { CompanyDetail } from '../detail/CompanyDetail';
import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
import { checkIsProxy } from './util';
import LBSHistoryDropDown from './component/HistoryDropDown';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { globalSearchDataTracker } from '../tracker';
import EmptyResult from '../search/EmptyResult/EmptyResult';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { getIn18Text } from 'api';
import { useMemoizedFn } from 'ahooks';
import { openBatchCreateLeadsModal } from '@lxunit/app-l2c-crm';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import PortSelect from './component/PortSelect/PortSelect';
import { useIsForwarder } from '../../CustomsData/customs/ForwarderSearch/useHooks/useIsForwarder';
import { renderLbsTableColumns } from './columns';
import SearchTab from '../search/SearchTab';
import { LbsSearchTypeEnum, LbsSearchTypeOptions } from './constants';
import { InternalSearch } from './InternalSearch';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { MAX_SELECT_ROWS_LEN } from '../constants';
import { useLeadsAdd } from '../hook/useLeadsAdd';
import { asyncTaskMessage$ } from '../search/GrubProcess/GrubProcess';

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

const eventApi = api.getEventApi();
const storeApi = api.getDataStoreApi();

const tipEnable = !storeApi.getSync('LBS_GRUB_COMPANY_TIP').data;

const edmCustomsApi = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const LBS_USE_GUIDE_ID = 'LBS_USE_GUIDE';

// const waitForMs = (ms: number) => {
//   return new Promise((res) => {
//     setTimeout(() => {
//       res(ms)
//     }, ms);
//   })
// }

interface LbsSearchProps extends React.HTMLAttributes<HTMLDivElement> {}

interface MapSearchBoxProps extends React.HTMLAttributes<HTMLInputElement> {
  map?: google.maps.Map;
  onPlacesChange?(palces: google.maps.places.PlaceResult[]): void;
}
interface MapSearchBoxRef {
  reset(): void;
}

interface RadiusPlacesState extends google.maps.places.PlaceResult {
  customerStatus?: string;
  orgCustomerStatus?: string;
  contactStatus?: string;
  idStatus?: CompanyIdType;
  country?: string;
  referId: string | null;
  // LEADS(1, "我的线索"), ORG_LEADS(2, "同事线索"), CUSTOMER(3, "我的客户"), ORG_CUSTOMER(4, "同事客户");
  customerLabelType: 'LEADS' | 'ORG_LEADS' | 'OPEN_SEA_LEADS' | 'CUSTOMER' | 'ORG_CUSTOMER' | 'OPEN_SEA_CUSTOMER' | null;
}

interface RadiusSearchProps {
  map?: google.maps.Map;
  places?: google.maps.places.PlaceResult[];
  onPlacesChange?(palces: google.maps.places.PlaceResult[]): void;
  onAddPlaces?(palces: RadiusPlacesState[]): void;
  onChangeNextPageFunc?(fn: Function | undefined): void;
  onChangeLocalNextPageFunc?(fn: Function | undefined): void;
  onLoading?(l: boolean): void;
  onSearchKeyWord?(value?: string): void;
  onRest?(): void;
  onSearch?(): void;
}

interface MapProps extends google.maps.MapOptions {
  style: CSSProperties;
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onIdle?: (map: google.maps.Map) => void;
  children?: React.ReactNode;
}

const Marker: React.FC<google.maps.MarkerOptions> = options => {
  const [marker, setMarker] = React.useState<google.maps.Marker>();
  React.useEffect(() => {
    if (!marker) {
      setMarker(new google.maps.Marker());
    }
    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [marker]);

  React.useEffect(() => {
    if (marker) {
      marker.setOptions(options);
    }
  }, [marker, options]);
  return null;
};

const SearchBox = React.forwardRef<MapSearchBoxRef, MapSearchBoxProps>(({ map, onPlacesChange, ...props }, searchRef) => {
  const ref = useRef<HTMLInputElement>(null);
  const [searchBox, setSearchBox] = React.useState<google.maps.places.SearchBox>();
  const [searchType, setSearchType] = useState<'port' | 'region'>('region');
  const [portValue, setPortValue] = useState<string>('');
  const isForwarder = useIsForwarder();
  // console.log(`privilege: `, privilege);

  useEffect(() => {
    if (ref.current && map) {
      setSearchBox(new google.maps.places.SearchBox(ref.current));
      // map.controls[google.maps.ControlPosition.TOP_LEFT].push(ref.current);
    }
  }, [map]);

  useImperativeHandle(
    searchRef,
    () => ({
      reset() {
        if (ref.current) {
          ref.current.value = '';
        }
        setSearchType('region');
        setPortValue('');
      },
    }),
    [ref.current]
  );

  const handleProcessPlacesLocated = useCallback(
    (places: google.maps.places.PlaceResult[], theMap: google.maps.Map, change: (palces: google.maps.places.PlaceResult[]) => void) => {
      const bounds = new google.maps.LatLngBounds();
      places.forEach(place => {
        if (place.geometry?.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else if (place.geometry?.location) {
          bounds.extend(place.geometry.location);
        }
      });
      theMap.fitBounds(bounds);
      change(places);
    },
    []
  );

  useEffect(() => {
    if (map && searchBox && onPlacesChange) {
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        if (!places || places.length === 0) {
          return;
        }
        handleProcessPlacesLocated(places, map, onPlacesChange);
      });
    }
    return () => {
      searchBox && google.maps.event.clearListeners(searchBox, 'places_changed');
    };
  }, [searchBox, onPlacesChange, map, handleProcessPlacesLocated]);

  const handlePortSelectChange = (value: string) => {
    setPortValue(value);
    if (map && onPlacesChange && value) {
      const service = new google.maps.places.PlacesService(map);
      service.textSearch(
        {
          // 这里最好加上 port 后端返回的港口名称大都是简单的地名 比如天津：TIANJIN
          query: 'port ' + value,
        },
        (places, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && places) {
            handleProcessPlacesLocated(places, map, onPlacesChange);
          }
        }
      );
    }
  };

  return (
    <HollowOutGuide
      guideId={LBS_USE_GUIDE_ID}
      title="定位搜索区域"
      intro="在此输入需要查询的企业所在的国家城市、或精确的地点名称"
      placement="topLeft"
      padding={[20, 20, 20, 20]}
      step={1}
    >
      <span
        className={classnames(styles.mapSearchWrapper, {
          // todo 权限
          [styles.mapSearchWrapperCompact]: isForwarder,
        })}
      >
        {isForwarder ? (
          <EnhanceSelect className={styles.typeSelect} value={searchType} onChange={setSearchType}>
            <InSingleOption value={'region'}>{getIn18Text('CountryRegion')}</InSingleOption>
            <InSingleOption value={'port'}>{getIn18Text('GANGKOU')}</InSingleOption>
          </EnhanceSelect>
        ) : (
          <div className={styles.label}>{getIn18Text('CountryRegion')}</div>
        )}
        <input
          hidden={isForwarder ? searchType !== 'region' : false}
          className={styles.mapSearch}
          placeholder={getIn18Text('QINGSHURUGUOJIAJICHENGSHIMINGCHENG')}
          type="text"
          ref={ref}
          {...props}
        />
        <PortSelect
          className={classnames(styles.portSelect, {
            [styles.portSelectHidden]: searchType !== 'port' || !isForwarder,
          })}
          value={portValue}
          onChange={handlePortSelectChange}
          allowClear
          placeholder="请选择或输入关键词搜索港口"
        />
      </span>
    </HollowOutGuide>
  );
});

interface MapDeliverProps extends React.HTMLAttributes<HTMLDivElement> {
  map?: google.maps.Map;
}

const MapDeliver: React.FC<MapDeliverProps> = ({ map, children, ...rest }) => {
  return (
    <div {...rest}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // set the map prop on the child component
          return React.cloneElement<any>(child, { map });
        }
        return null;
      })}
    </div>
  );
};

const Map: React.FC<MapProps> = ({ onClick, onIdle, style, children, ...options }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = React.useState<google.maps.Map>();
  useEffect(() => {
    if (ref.current && !map) {
      setMap(
        new google.maps.Map(ref.current, {
          mapTypeControl: false,
          streetViewControl: false,
        })
      );
    }
  }, [ref, map]);
  useDeepCompareEffect(() => {
    if (map) {
      map.setOptions(options);
    }
  }, [map, options]);
  useEffect(() => {
    if (map) {
      ['click', 'idle'].forEach(eventName => google.maps.event.clearListeners(map, eventName));

      if (onClick) {
        map.addListener('click', onClick);
      }

      if (onIdle) {
        map.addListener('idle', () => onIdle(map));
      }
    }
  }, [map, onClick, onIdle]);
  return (
    <>
      <div ref={ref} style={style}></div>
      <MapDeliver map={map}>{children}</MapDeliver>
    </>
  );
};

interface IRadiusSearchRef {
  saveSingle(params: { place_id: string; country: string }): Promise<void>;
  handleSearch: (newKeywords?: string, targetPlace?: google.maps.places.PlaceResult) => void;
}

const RadiusSearch = React.forwardRef<IRadiusSearchRef, RadiusSearchProps>(
  ({ map, places = [], onPlacesChange, onChangeNextPageFunc, onChangeLocalNextPageFunc, onAddPlaces, onSearchKeyWord, onRest, onSearch, onLoading }, radiusSearchRef) => {
    const [firstPlace] = places;
    const [radius, setRadius] = useState<number>(5000);
    const [keyword, setKeyword] = useState<string>('');
    const [restResults, setRestResults] = useState<google.maps.places.PlaceResult[]>([]);
    const [searchedKeyword, setSearchedKeyword] = useState<string>();
    const [open, setOpen] = useState<boolean>(false);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const countryRef = useRef<string>('');

    useEffect(() => {
      let circle: google.maps.Circle;
      if (map && firstPlace && firstPlace.geometry?.location) {
        circle = new google.maps.Circle({
          strokeColor: '#DF3E31',
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: '#FF4444',
          fillOpacity: 0.1,
          map,
          center: firstPlace.geometry.location,
          radius: radius,
        });
      }

      return () => {
        circle && circle.setMap(null);
      };
    }, [map, firstPlace, radius]);

    const fetchData = useCallback(
      async (requestedResults: google.maps.places.PlaceResult[]) => {
        if (!map) {
          return;
        }
        onLoading?.(true);
        const requests = requestedResults.map(place => {
          return new Promise<google.maps.places.PlaceResult>((res, rej) => {
            const service = new google.maps.places.PlacesService(map);
            service.getDetails(
              {
                placeId: place.place_id as string,
                fields: ['name', 'formatted_phone_number', 'website', 'formatted_address'],
                language: 'en',
              },
              (detail, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && detail) {
                  res(detail);
                } else {
                  rej(status);
                }
              }
            );
          });
        });
        try {
          const detailResult = await Promise.all(requests);

          await globalSearchApi.doSaveGoogleData({
            datas: detailResult.map(e => ({
              name: e.name,
              webUrl: e.website,
              phoneNumber: e.formatted_phone_number,
              country: countryRef.current,
              address: e.formatted_address,
            })),
          });

          const [labelResult, idResult] = await Promise.all([
            globalSearchApi.globalLabelSearch({
              datas: detailResult.map(e => ({
                country: countryRef.current || '',
                name: e.name || '',
                companyId: '',
              })),
            }),
            edmCustomsApi.doGetIdsByCompanyList({
              companyList: detailResult.map(e => ({
                companyName: e.name || '',
                country: countryRef.current || '',
              })),
            }),
          ]);

          onAddPlaces?.(
            detailResult.map((e, index) => {
              const labelData = (labelResult ?? []).find(item => item.country === countryRef.current && item.name === e.name);
              return {
                ...requestedResults[index],
                ...e,
                customerStatus: labelData?.customerStatus ?? '',
                orgCustomerStatus: labelData?.orgCustomerStatus ?? '',
                contactStatus: labelData?.contactStatus ?? '',
                referId: idResult[index].referId,
                customerLabelType: idResult[index].customerLabelType,
                idStatus: idResult[index],
              };
            })
          );
        } catch (error) {
          // 重复请求进入这里，所以理论上不应该刷新列表
          const labelResult = await globalSearchApi.globalLabelSearch({
            datas: requestedResults.map(e => ({
              country: countryRef.current || '',
              name: e.name || '',
              companyId: '',
            })),
          });
          onAddPlaces?.(
            requestedResults.map(e => {
              const labelData = (labelResult ?? []).find(item => item.country === countryRef.current && item.name === e.name);
              return {
                ...e,
                customerStatus: labelData?.customerStatus ?? '',
                orgCustomerStatus: labelData?.orgCustomerStatus ?? '',
                contactStatus: labelData?.contactStatus ?? '',
              };
            })
          );
        }
        onLoading?.(false);
      },
      [map]
    );

    useEffect(() => {
      if (restResults.length > 0 && map) {
        onChangeLocalNextPageFunc?.(async () => {
          await fetchData(restResults);
          setRestResults([]);
        });
      }
      if (restResults.length === 0) {
        onChangeLocalNextPageFunc?.(undefined);
      }
      return () => {};
    }, [restResults, map]);

    useEffect(() => {
      if (firstPlace) {
        const geocoder = new google.maps.Geocoder();
        geocoder
          .geocode({
            placeId: firstPlace.place_id,
            language: 'en',
          })
          .then(({ results }) => {
            const [targetResult] = results;
            let country: string = '';
            targetResult.address_components.forEach(adr => {
              if (adr.types.includes('country')) {
                country = adr.long_name;
              }
            });
            // 保留本次搜索国家
            countryRef.current = country;
          });
      }
    }, [firstPlace]);

    const handleSearch = async (targetWord?: string, targetPlace?: google.maps.places.PlaceResult) => {
      const searchWord = targetWord || keyword;
      const currFirstPlace = targetPlace ?? firstPlace;
      if (!currFirstPlace || !map || !searchWord) {
        let message = '';
        if (!currFirstPlace) {
          message = '请输入国家或城市名称';
        } else if (!searchWord) {
          message = '请输入关键词';
        } else {
          message = '请输入国家或城市名称和关键词';
        }
        SiriusMessage.warn(message);
        return;
      }
      onPlacesChange?.([]);
      onChangeLocalNextPageFunc?.(undefined);
      onChangeNextPageFunc?.(undefined);
      onLoading?.(true);
      onSearch?.();
      const service = new google.maps.places.PlacesService(map);
      setSearchedKeyword(searchWord);
      try {
        await globalSearchApi.searchTextCheck({ text: searchWord });
      } catch {
        onLoading?.(false);
        return;
      }
      globalSearchDataTracker.trackLbsSearch({
        country: countryRef.current,
        keyword,
        radius,
      });
      service.nearbySearch(
        {
          radius,
          location: currFirstPlace.geometry?.location,
          keyword: searchWord,
          language: 'en',
        },
        async (results, status, pagination) => {
          if (status == google.maps.places.PlacesServiceStatus.OK && results) {
            const requestedResults = results.slice(0, 10);
            setRestResults(results.slice(10));
            onSearchKeyWord?.(searchWord);
            await fetchData(requestedResults);
          }
          onLoading?.(false);
          if (pagination && pagination.hasNextPage) {
            onChangeNextPageFunc?.(() => {
              pagination.nextPage();
            });
          } else {
            onChangeNextPageFunc?.(undefined);
          }
        }
      );
    };
    const handleRest = () => {
      setKeyword('');
      onSearchKeyWord?.('');
      onRest?.();
      setRadius(5000);
      onChangeNextPageFunc?.(undefined);
    };

    useEffect(() => {
      if (keyword) {
        setOpen(false);
      }
    }, [keyword]);

    useImperativeHandle(
      radiusSearchRef,
      () => ({
        async saveSingle({ place_id, country }) {
          if (!map) {
            return;
          }
          const service = new google.maps.places.PlacesService(map);
          return new Promise((res, rej) => {
            service.getDetails(
              {
                placeId: place_id as string,
                fields: ['name', 'formatted_phone_number', 'website', 'formatted_address'],
                language: 'en',
              },
              (detail, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && detail) {
                  globalSearchApi
                    .doSaveGoogleData({
                      datas: [
                        {
                          country,
                          name: detail.name,
                          webUrl: detail.website,
                          phoneNumber: detail.formatted_phone_number,
                        },
                      ],
                    })
                    .then(() => {
                      res();
                    })
                    .catch(() => {
                      rej();
                    });
                }
              }
            );
          });
        },
        handleSearch,
      }),
      [map, handleSearch]
    );

    return (
      <div className={styles.radiusSearchWrapper} ref={inputWrapperRef}>
        <HollowOutGuide
          guideId={LBS_USE_GUIDE_ID}
          title="查询附近地点"
          intro="选择查询的距离范围，并输入您想要查询的同类型地点的关键词。如：可查询5km内，与“bags”相关的地点名称。"
          placement="topLeft"
          step={2}
          padding={[20, 20, 20, 20]}
        >
          <div className={styles.label}>{getIn18Text('GUANJIANCI')}</div>
          <Input
            placeholder={getIn18Text('HANGYECI/CHANPINCI/GONGSIMINGDENG,JIANYISHIYONGBENDIYUYAN')}
            onFocus={() => {
              !keyword && setOpen(true);
            }}
            style={{
              width: 390,
              marginRight: 20,
            }}
            addonBefore={<Select onChange={setRadius} options={[5, 10, 20, 50].map(e => ({ value: e * 1000, label: `${e}${getIn18Text('GONGLI')}` }))} value={radius} />}
            value={keyword}
            onChange={e => {
              setKeyword(e.target.value);
            }}
            onPressEnter={() => handleSearch()}
          />
          <Button style={{ marginRight: 12, marginLeft: 'auto' }} btnType="primary" onClick={() => handleSearch()}>
            {getIn18Text('SOUSUO')}
          </Button>
          <Button btnType="minorLine" onClick={handleRest}>
            {getIn18Text('ZHONGZHI')}
          </Button>
        </HollowOutGuide>
        <LBSHistoryDropDown
          target={inputWrapperRef.current?.querySelector('.ant-input')}
          open={open}
          changeOpen={setOpen}
          keyword={searchedKeyword}
          historySaveKey="LBS_HISTORY_KEY"
          onClick={value => {
            setKeyword(value);
            handleSearch(value);
          }}
        />
      </div>
    );
  }
);

const MapStatusRender: React.FC<{ status: Status }> = ({ status }) => {
  const [manualCheckFail, setManualCheckFail] = useState<boolean>(false);
  const wrapperStyles: React.CSSProperties = { display: 'block', margin: '0 auto', marginTop: 100 };
  useEffect(() => {
    checkIsProxy().catch(() => {
      setManualCheckFail(true);
    });
  }, []);
  return (
    <div>
      {status === Status.LOADING ? (
        <Spin style={wrapperStyles} indicator={<LoadingOutlined style={{ fontSize: 24, marginBottom: 24 }} spin />} tip="该服务需要在海外网络连接环境下使用" />
      ) : status === Status.FAILURE || manualCheckFail ? (
        <div style={wrapperStyles}>
          <EmptyResult defaultDesc="当前网络环境无法访问此服务" />
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
};

const render = (status: Status) => {
  return <MapStatusRender status={status} />;
};

const LbsSearch: React.FC<LbsSearchProps> = ({ className, ...rest }) => {
  const [markers, setMarkers] = React.useState<google.maps.MarkerOptions[]>([]);
  const [places, setPlaces] = React.useState<google.maps.places.PlaceResult[]>([]);
  const [radiusPlaces, setRadiusPlaces] = React.useState<RadiusPlacesState[]>([]);
  const [detailId, setDetailId] = useState<string | number>();
  const [nextPage, setNextPage] = useState<Function | undefined>();
  const [nextLocalPage, setLocalNextPage] = useState<Function | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [keywords, setKeywords] = useState<string | undefined>('');
  const searchboxRef = useRef<MapSearchBoxRef>(null);
  const radiusSearchRef = useRef<IRadiusSearchRef>(null);
  const detailLoadingRef = useRef<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [queryType, setQueryType] = useState<LbsSearchTypeEnum>(LbsSearchTypeEnum.Overseas);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<RadiusPlacesState[]>([]);
  const radiusPlacesLen = radiusPlaces.length;
  useEffect(() => {
    if (radiusPlacesLen > 0) {
      setHasSearched(true);
    }
  }, [radiusPlacesLen]);

  const onPlacesChange = useCallback<Required<MapSearchBoxProps>['onPlacesChange']>(p => {
    const markersOptions: google.maps.MarkerOptions[] = [];
    p.forEach(place => {
      if (!place.geometry || !place.geometry.location) {
        console.log('Returned place contains no geometry');
        return null;
      }
      const icon = {
        url: place.icon as string,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25),
      };
      return markersOptions.push({
        icon,
        title: place.name,
        position: place.geometry.location,
      });
    });
    setPlaces(p);
    setMarkers(markersOptions);
  }, []);

  useEffect(() => {
    checkIsProxy().catch(() => {
      const al = SiriusAlert.warn({
        title: '系统检测：当前网络环境无法访问此服务',
        content: '该服务需要在外网环境下访问，请在合法的海外网络连接环境下访问此服务。',
        okText: '知道了',
        onOk() {
          al.destroy();
        },
      });
    });
  }, []);

  const handleView = async (record: RadiusPlacesState) => {
    if (detailLoadingRef.current) {
      return;
    }
    detailLoadingRef.current = true;
    if (record.idStatus?.id) {
      setDetailId(record.idStatus.id);
      detailLoadingRef.current = false;
      return;
    }
    // 地理位置服务查国家
    try {
      const geocoder = new google.maps.Geocoder();
      const { results } = await geocoder.geocode({
        placeId: record.place_id,
        language: 'en',
      });
      const [targetResult] = results;
      let country: string = '';
      targetResult.address_components.forEach(adr => {
        if (adr.types.includes('country')) {
          country = adr.long_name;
        }
      });
      if (radiusSearchRef.current && record.place_id) {
        await radiusSearchRef.current.saveSingle({
          place_id: record.place_id,
          country,
        });
      }
      // 调用查询接口
      const [{ id }] = await edmCustomsApi.doGetIdsByCompanyList({
        companyList: [
          {
            companyName: record.name!,
            country: country,
          },
        ],
      });
      setDetailId(id);
    } catch (error) {}
    detailLoadingRef.current = false;
  };

  const handleReset = () => {
    setPlaces([]);
    setMarkers([]);
    searchboxRef.current?.reset();
    setSelectedRows([]);
    setSelectedRowKeys([]);
    setRadiusPlaces([]);
  };
  const onSearch = () => {
    setSelectedRows([]);
    setSelectedRowKeys([]);
  };
  const handleGrubCompanyInfo = (id?: any, name?: string) => {
    const resultItem = radiusPlaces.find(it => it.idStatus?.id === id);
    if (resultItem) {
      setRadiusPlaces(preState =>
        preState.map(each => {
          if (each.idStatus && each.idStatus.id === id) {
            return {
              ...each,
              idStatus: {
                ...each.idStatus,
                companyGrubStatus: 'GRUBBING',
              },
            };
          }
          return each;
        })
      );
    }
    if (id && name) {
      asyncTaskMessage$.next({
        eventName: 'globalSearchGrubTaskAdd',
        eventData: {
          type: 'company',
          data: {
            id,
            name,
          },
        },
      });
    }
  };
  const validLeads = useMemo(
    () =>
      _uniqBy(
        selectedRows.map(item => ({
          id: `${item.idStatus!.id}`,
        })),
        'id'
      ),
    [selectedRows]
  );
  const onLeadsPost = useCallback(
    (extraParams?: any) =>
      globalSearchApi.globalBatchAddLeadsV1({
        ...extraParams,
        globalInfoVOList: validLeads,
        sourceType: 4,
      }),
    [validLeads]
  );
  const refresh = useCallback(() => radiusSearchRef.current?.handleSearch(keywords, places[0]), [keywords, places]);
  const { handleAddLeads, leadsAddLoading, noLeadsWarning } = useLeadsAdd({
    onFetch: onLeadsPost,
    refresh,
  });
  const doLeadsAdd = useMemoizedFn(() => {
    if (validLeads.length <= 0) {
      noLeadsWarning();
      return;
    }
    openBatchCreateLeadsModal({
      submit: ({ groupIds, isAddToGroup }) =>
        handleAddLeads({
          extraFetchParams: { leadsGroupIdList: groupIds, isAddToGroup },
          selectedNum: validLeads.length,
        }),
    });
  });
  const onChangeListItem = (id: string | number, extraData: any) => {
    const resultItem = radiusPlaces.find(it => it.idStatus?.id === id);
    if (resultItem) {
      setRadiusPlaces(preState =>
        preState.map(each => {
          if (each.idStatus && each.idStatus.id === id) {
            return {
              ...each,
              ...extraData,
            };
          }
          return each;
        })
      );
    }
  };
  const listUniqueId = radiusPlaces
    .map(e => e.idStatus?.id)
    .filter(e => !!e)
    .join('');
  useEffect(() => {
    const eventID = eventApi.registerSysEventObserver('globalSearchGrubTaskFinish', {
      func: event => {
        if (event?.eventData?.type === 'company' && event.eventData.data) {
          const { id } = event.eventData.data;
          const resultItem = radiusPlaces.find(it => it.idStatus?.id === id);
          if (resultItem) {
            setRadiusPlaces(preState =>
              preState.map(each => {
                if (each.idStatus && each.idStatus.id === id) {
                  return {
                    ...each,
                    idStatus: {
                      ...each.idStatus,
                      companyGrubStatus: 'GRUBBED',
                    },
                  };
                }
                return each;
              })
            );
          }
        }
      },
    });

    return () => {
      eventApi.unregisterSysEventObserver('globalSearchGrubTaskFinish', eventID);
    };
  }, [listUniqueId]);
  const isForwarder = useIsForwarder();
  return (
    <div {...rest} className={classnames(className, styles.container)}>
      <p className={styles.title}>{getIn18Text('LBSSOUSUO')}</p>
      {isForwarder && (
        <SearchTab
          defaultActiveKey={LbsSearchTypeEnum.Overseas}
          tabList={LbsSearchTypeOptions}
          activeKey={queryType}
          onChange={e => {
            setQueryType(e);
            setRadiusPlaces([]);
          }}
        />
      )}
      {queryType === LbsSearchTypeEnum.Overseas && (
        <>
          <Wrapper apiKey={'AIzaSyCBCYM7-W3EzohespglPtE2bmiK0sRv8-c'} render={render} language="zh-CN" libraries={['places']}>
            <div className={styles.map}>
              <Map
                center={{
                  lat: 40.7127753,
                  lng: -74.0059728,
                }}
                zoom={10}
                style={{
                  height: 389,
                  width: '100%',
                }}
              >
                <MapDeliver className={styles.inputRow}>
                  <SearchBox ref={searchboxRef} onPlacesChange={onPlacesChange} />
                  <RadiusSearch
                    ref={radiusSearchRef}
                    onRest={handleReset}
                    onSearch={onSearch}
                    onSearchKeyWord={setKeywords}
                    onAddPlaces={more => {
                      setRadiusPlaces(prev => [...prev, ...more]);
                    }}
                    onChangeNextPageFunc={fn => {
                      setNextPage(() => {
                        return fn;
                      });
                    }}
                    onChangeLocalNextPageFunc={fn => {
                      setLocalNextPage(() => {
                        return fn;
                      });
                    }}
                    onPlacesChange={setRadiusPlaces}
                    places={places}
                    onLoading={setLoading}
                  />
                </MapDeliver>
                {markers.map((m, i) => (
                  <Marker key={i} {...m} />
                ))}
              </Map>
            </div>
            <div className={styles.table}>
              {tipEnable && hasSearched && (
                <Alert
                  className={styles.tableTip}
                  afterClose={() => {
                    storeApi.putSync('LBS_GRUB_COMPANY_TIP', 'true');
                  }}
                  message="可尝试“深挖企业信息”，系统将从搜索引擎、B2B平台、展会信息等多个渠道整合企业更多信息"
                  type="info"
                  showIcon
                  closable
                />
              )}
              <PrivilegeCheck accessLabel="OP" resourceLabel="COMMERCIAL">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  {Boolean(selectedRowKeys.length) && <div style={{ marginRight: 12 }}>已选{selectedRowKeys.length}家公司</div>}
                  <Button btnType="primary" disabled={selectedRowKeys.length === 0} onClick={doLeadsAdd} loading={leadsAddLoading}>
                    {getIn18Text('LURUXIANSUO')}
                  </Button>
                </div>
              </PrivilegeCheck>
              <Table<RadiusPlacesState>
                columns={renderLbsTableColumns({ keywords, handleView, handleGrubCompanyInfo })}
                rowKey="place_id"
                rowSelection={{
                  type: 'checkbox',
                  preserveSelectedRowKeys: true,
                  onChange: (keys: any[], rows: any[]) => {
                    if (rows.length > MAX_SELECT_ROWS_LEN) {
                      SiriusMessage.warning({
                        content: `仅可选择${MAX_SELECT_ROWS_LEN}条数据`,
                      });
                      return;
                    }
                    setSelectedRowKeys(keys);
                    setSelectedRows(rows);
                  },
                  selectedRowKeys,
                }}
                dataSource={radiusPlaces}
                pagination={false}
                loading={loading}
                tableLayout="fixed"
                onRow={record => {
                  return {
                    onClick: () => {
                      handleView(record);
                    },
                  };
                }}
                footer={
                  (nextPage || nextLocalPage) && !loading
                    ? () => (
                        <div className={styles.footer}>
                          <Button
                            btnType="minorLine"
                            onClick={() => {
                              if (nextLocalPage) {
                                nextLocalPage();
                              } else if (nextPage) {
                                nextPage();
                              }
                              globalSearchDataTracker.trackLbsListMore();
                            }}
                          >
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
            {/* <GrubProcess /> */}
          </Wrapper>
          {detailId && (
            <Drawer
              visible={!!detailId}
              onClose={() => {
                setDetailId(undefined);
              }}
            >
              <CompanyDetail showSubscribe scene="lbs" origin="lbs" id={detailId as string} reloadToken={0} onChangeListItem={onChangeListItem} />
            </Drawer>
          )}
        </>
      )}
      {isForwarder && queryType === LbsSearchTypeEnum.Internal && <InternalSearch />}
    </div>
  );
};
export default LbsSearch;
