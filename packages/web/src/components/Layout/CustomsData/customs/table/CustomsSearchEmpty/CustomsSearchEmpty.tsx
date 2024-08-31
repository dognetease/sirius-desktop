import { ImageEmptyNormal } from '@/components/Layout/globalSearch/search/EmptyResult/EmptyImge';
import { Empty, message } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { navigate } from 'gatsby';
import { Desc, DescOpButton } from '@/components/Layout/globalSearch/search/EmptyResult/AsyncHSCodeResult';
import styles from './customssearchempty.module.scss';
import { reqBuyers } from 'api';
import { CustomsSearchType } from '../../docSearch/component/SearchInput';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { globalSearchDataTracker } from '@/components/Layout/globalSearch/tracker';
import { getIn18Text } from 'api';
import { SearchType } from '../../customs';
import { api, apiHolder, apis, EdmCustomsApi } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as Warning } from '@/images/icons/globalsearch/warning_icon_deep.svg';
import { asyncTaskMessage$ } from '@/components/Layout/globalSearch/search/GrubProcess/GrubProcess';

interface CustomsSearchEmptyProps {
  params?: reqBuyers;
  hasRcmd?: boolean;
  searchTabType?: string;
  onSearch?: (params: reqBuyers) => void;
  onSwitchSearch?: (params: { type: CustomsSearchType; value: string }) => void;
  deepParams?: reqBuyers;
  originReCountry?: string[][];
  sensitive?: boolean;
}
const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const eventApi = api.getEventApi();

const CustomsSearchEmpty: React.FC<CustomsSearchEmptyProps> = ({ params, onSearch, onSwitchSearch, hasRcmd, searchTabType, deepParams, originReCountry, sensitive }) => {
  const { type: searchType, queryValue: query, timeFilter } = params || {};
  const showExpandTime = useMemo(() => {
    return timeFilter && timeFilter !== 'all';
  }, [timeFilter]);
  const handleMaximizeTimeRange = () => {
    if (query && params) {
      onSearch?.({
        ...params,
        timeFilter: 'all',
      });
    }
  };

  const handleDeepCustoms = () => {
    // navigate(`#wmData?page=globalSearch&taskId=22}`)
    // const processItem = searchResult.find(e => e.id === id && e.grubStatus === 'NOT_GRUBBING');
    edmCustomsApi
      .doGetCustomsDeepTask({ queryType: searchTabType === 'buysers' ? 'buyers' : ('suppliers' as 'suppliers' | 'buyers'), condition: deepParams })
      .then(data => {
        // console.log(data, 'taskValue');
        if (data) {
          data.status === 'NOT_GRUBBING' || data.status === 'OFFLINE_GRUBBING'
            ? message.info({
                content: (
                  <span>
                    <span>该海关数据已经在深挖中</span>
                    <span
                      style={{ color: '#4C6AFF', marginLeft: 8, cursor: 'pointer' }}
                      className={styles.messageLink}
                      onClick={() => {
                        asyncTaskMessage$.next({
                          eventName: 'globalSearchGrubTaskAdd',
                          eventData: {
                            type: 'customs',
                            data: '',
                          },
                        });
                      }}
                    >
                      {getIn18Text('LIJICHAKAN')}
                    </span>
                  </span>
                ),
                // icon: <Warning />
              })
            : message.info({
                content: '该海关数据已经深挖过，请过几日再来尝试',
                // icon: <Warning />
              });
        } else {
          asyncTaskMessage$.next({
            eventName: 'globalSearchGrubTaskAdd',
            eventData: {
              type: 'customs',
              data: {
                queryType: searchTabType,
                condition: deepParams,
              },
            },
          });
        }
      });
  };
  const getDesc = () => {
    let desc: React.ReactNode = getIn18Text('ZANWUSHUJU');
    let resultOp: React.ReactNode = null;
    // 按产品搜索
    if (query) {
      if (sensitive) {
        return {
          desc,
          resultOp,
        };
      }

      if (searchType === 'goodsShipped') {
        desc = showExpandTime ? `暂无数据，可尝试调整时间范围 或 深挖${searchTabType === 'suppliers' ? '供应商' : '采购商'}` : '暂无数据，可尝试深挖采购商';
        resultOp = (
          <div className={styles.group}>
            {showExpandTime && (
              <Button
                style={{ border: '1px solid #E1E3E8' }}
                btnType="minorWhite"
                onClick={() => {
                  globalSearchDataTracker.trackSearchEmptyClick();
                  handleMaximizeTimeRange();
                }}
              >
                扩大时间范围
              </Button>
            )}
            <Button
              btnType="minorWhite"
              style={{ border: '1px solid #E1E3E8' }}
              onClick={() => {
                // globalSearchDataTracker.trackSearchEmptyClick();
                handleDeepCustoms();
              }}
            >
              深挖{searchTabType === 'suppliers' ? '供应商' : '采购商'}
            </Button>
          </div>
        );
      } else if (searchType === 'company') {
        desc = `暂无数据，可尝试其他搜索方式 或 深挖${searchTabType === 'suppliers' ? '供应商' : '采购商'}`;
        resultOp = (
          <div className={styles.group}>
            <Button
              btnType="minorWhite"
              style={{ border: '1px solid #E1E3E8' }}
              onClick={() => {
                globalSearchDataTracker.trackSearchEmptyClick();
                navigate(`#wmData?page=globalSearch&searchType=company&q=${encodeURIComponent(query)}`);
              }}
            >
              {getIn18Text('searchCompanyInGlobal')}
            </Button>
            <Button
              btnType="minorWhite"
              style={{ border: '1px solid #E1E3E8' }}
              onClick={() => {
                handleDeepCustoms();
              }}
            >
              深挖{searchTabType === 'suppliers' ? '供应商' : '采购商'}
            </Button>
          </div>
        );
      } else if (searchType === 'hsCode') {
        desc = `暂无数据，可尝试深挖${searchTabType === 'suppliers' ? '供应商' : '采购商'}`;
        resultOp = (
          // <DescOpButton
          //   query={query}
          //   onSelectClick={param => {
          //     globalSearchDataTracker.trackSearchEmptyClick();
          //     if (params) {
          //       onSearch?.({
          //         ...params,
          //         queryValue: param,
          //       });
          //     }
          //   }}
          // />
          <div className={styles.group}>
            <Button
              btnType="minorWhite"
              style={{ border: '1px solid #E1E3E8' }}
              onClick={() => {
                handleDeepCustoms();
              }}
            >
              深挖{searchTabType === 'suppliers' ? '供应商' : '采购商'}
            </Button>
          </div>
        );
      }
    }
    return {
      desc,
      resultOp,
    };
  };
  const { desc, resultOp } = getDesc();
  return (
    <Empty className={styles.empty} description={desc} image={<ImageEmptyNormal />}>
      {resultOp}
    </Empty>
  );
};

export default CustomsSearchEmpty;
