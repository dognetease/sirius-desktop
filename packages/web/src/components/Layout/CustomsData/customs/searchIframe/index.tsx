import React, { useRef, ReactElement, useEffect, useState, useCallback } from 'react';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useMemoizedFn } from 'ahooks';
import { openBatchCreateLeadsModal } from '@lxunit/app-l2c-crm';
import { Breadcrumb, message, Affix, Form, Input, Popover, DatePicker, Skeleton } from 'antd';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import { apis, apiHolder, EdmCustomsApi, getIn18Text, UserLogItem, UserQuotaItem } from 'api';
import SearchIframeTable, { ReqRefs } from './searchIframeTable';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import SearchIframeFilter from './searchIframeFilter';
import { useLocation } from '@reach/router';
import { useLeadsAdd } from '@/components/Layout/globalSearch/hook/useLeadsAdd';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const { isMac } = apiHolder.env;
const systemApi = apiHolder.api.getSystemApi();
const isWindows = systemApi.isElectron() && !isMac;

interface Props {
  ifranmeUrlType: number;
}
export interface ITablePage {
  page: number;
  size: number;
}
export interface ISetSearchParmas {
  companyName?: string;
  startTime?: string;
  endTime?: string;
  status?: number;
}
const initSearchParmas = {
  companyName: undefined,
  startTime: undefined,
  endTime: undefined,
  status: 0,
};
const initPage = {
  size: 20,
  page: 0,
};

const SearchIframe: React.FC<Props> = ({ ifranmeUrlType }) => {
  const breadList = ifranmeUrlType === 1 ? ['工商搜索（国内）', '查询记录'] : ['智能搜索（国内）', '查询记录'];
  // layout 2层  1.镶嵌iframe的首页 2.查询记录页面
  const [layout, setLayout] = useState<string[]>(breadList.slice(0, 1));
  const [ifranmeUrl, setIfranmeUrl] = useState<string>('');
  const [userQuotaData, setUserQuotaData] = useState<UserQuotaItem>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [tatol, setTatol] = useState<number>(0);
  const [pageConfig, setPageConfig] = useState<ITablePage>(initPage);
  const [searchParmas, setSearchParmas] = useState<ISetSearchParmas>({
    ...initSearchParmas,
  });
  const [tableList, setTableList] = useState<UserLogItem[]>([]);
  const { hash } = useLocation();
  const [isclose, setIsclose] = useState<boolean>(false);
  const pcFrameRef = useRef<HTMLIFrameElement>(null);
  const childrefSearchIframeTable = useRef<ReqRefs>(null);
  const [reqCount, setReqCount] = useState<number>(0);
  useEffect(() => {
    console.log(hash, '请求url');
    setLoading(true);
    reqEdmCustomsApi();
    setLayout(breadList.slice(0, 1));
    setPageConfig(initPage);
    setSearchParmas(initSearchParmas);
  }, [hash]);
  const reqEdmCustomsApi = () => {
    edmCustomsApi
      .getIfranmeUrl({ type: ifranmeUrlType })
      .then(res => {
        setIfranmeUrl(res.linkUrl);
        setLoading(false);
        setReqCount(0);
      })
      .catch(() => {
        if (reqCount < 3) {
          // 接口调用失败后默认重新调用，次数限制为3次
          forReq();
          return;
        }
        message.error('请重新刷新');
        setLoading(false);
      });
  };
  const forReq = () => {
    setReqCount(reqCount + 1);
    reqEdmCustomsApi();
  };
  useEffect(() => {
    getInitListData();
  }, [searchParmas, pageConfig]);

  const getInitListData = useCallback(() => {
    setLoading(true);
    edmCustomsApi
      .doGetUserLog({ ...searchParmas, status: searchParmas.status || undefined, ...pageConfig })
      .then(res => {
        setTableList(res.data || []);
        setLoading(false);
        setTatol(res.total);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [searchParmas, pageConfig]);

  const getUserQuota = () => {
    edmCustomsApi
      .doGetUserQuota()
      .then(res => {
        setUserQuotaData(res);
      })
      .catch(() => {});
  };
  const onLeadsPost = useMemoizedFn((extraParams?: any) => edmCustomsApi.doGetchineseBatchAddLeads(extraParams));
  const doRefresh = useMemoizedFn(() => {
    getInitListData();
    childrefSearchIframeTable.current?.setSelectedRowKeys([]);
  });
  const { handleAddLeads, noLeadsWarning } = useLeadsAdd({
    onFetch: onLeadsPost,
    refresh: doRefresh,
  });
  const createClue = (arr: string[]) => {
    if (arr.length <= 0) {
      noLeadsWarning();
      return;
    }
    openBatchCreateLeadsModal({
      submit: ({ groupIds, isAddToGroup }) =>
        handleAddLeads({
          extraFetchParams: { ids: arr, leadsGroupIdList: groupIds, isAddToGroup },
          selectedNum: arr.length,
        }),
    });
  };

  const getLog = () => {
    setLayout(breadList);
    setPageConfig(initPage);
    setSearchParmas(initSearchParmas);
    getInitListData();
  };

  const handleSearchParmas = (val: any, nameStr: string) => {
    if (nameStr === 'searchTime') {
      const startTime = val !== null && val ? moment(val[0]).format('yyyy-MM-DD') : undefined;
      const endTime = val !== null && val ? moment(val[1]).format('yyyy-MM-DD') : undefined;
      setSearchParmas({
        ...searchParmas,
        startTime,
        endTime,
      });
    } else {
      setSearchParmas({
        ...searchParmas,
        [nameStr]: val,
      });
    }
    setPageConfig({
      ...pageConfig,
      page: 0,
    });
    childrefSearchIframeTable.current && childrefSearchIframeTable.current.setSelectedRowKeys([]);
  };

  return (
    <div
      className={classnames(styles.container, styles.searchIframeContainer, {
        [styles.searchIframeContainerInit]: layout.length < 2,
      })}
    >
      {/* 表头栏 */}
      {layout.length < 2 ? (
        <>
          <Affix offsetTop={0}>
            {/* style={{ paddingTop: isWindows ? '20px' : '' }} */}
            <div className={styles.affixBox}>
              <Button
                btnType="minorLine"
                onClick={() => {
                  getLog();
                }}
              >
                查询记录
              </Button>
              <Popover
                trigger="click"
                color="#fff"
                overlayClassName="tooltipBox"
                visible={isclose}
                placement="bottomRight"
                getPopupContainer={triggerNode => triggerNode}
                onVisibleChange={e => {
                  if (e) {
                    setIsclose(true);
                    getUserQuota();
                  } else {
                    setIsclose(false);
                  }
                }}
                content={
                  <div className={styles.tooltipBoxContent}>
                    <div className={styles.tooltipLeftBox}>
                      <div>单日企业查询额度</div>
                      <div>单日个人查询额度</div>
                    </div>
                    <div>
                      <div>
                        {userQuotaData?.dayOrgDetailQuotaTotal === -1
                          ? '不限额'
                          : `${userQuotaData?.dayOrgDetailQuotaUsed || 0}/${userQuotaData?.dayOrgDetailQuotaTotal || 0}`}
                      </div>
                      <div>
                        {userQuotaData?.dayAccountDetailQuotaTotal === -1
                          ? '不限额'
                          : `${userQuotaData?.dayAccountDetailQuotaUsed || 0}/${userQuotaData?.dayAccountDetailQuotaTotal || 0}`}
                      </div>
                    </div>
                  </div>
                }
              >
                <Button btnType="minorLine">查询额度</Button>
              </Popover>
            </div>
          </Affix>
          <Skeleton active loading={loading}>
            <div className={styles.iframeBox}>
              {/* style={isWindows ? { height: 'calc(100vh - 100px)' } : {}} */}
              <iframe ref={pcFrameRef} className={styles.iframeStyle} src={ifranmeUrl}></iframe>
            </div>
          </Skeleton>
        </>
      ) : (
        <>
          <Breadcrumb className={styles.bread} separator={<SeparatorSvg />}>
            {layout.map((e, index) => (
              <Breadcrumb.Item key={e}>
                <a
                  onClick={e => {
                    e.preventDefault();
                    setLayout(breadList.slice(0, index + 1));
                  }}
                >
                  {e}
                </a>
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
          <h3>
            已查询公司列表 <span className={styles.titleText}>{`近半年，已查询过国内联系人的企业将在此展示`}</span>
          </h3>
          <SearchIframeFilter handleSearchParmas={handleSearchParmas} />

          <div className={styles.tableBox}>
            <SearchIframeTable
              ref={childrefSearchIframeTable}
              tableList={tableList}
              setPageConfig={setPageConfig}
              loading={loading}
              createClue={createClue}
              getInitListData={getInitListData}
              searchType={searchParmas?.status}
              pagination={pageConfig}
              tatol={tatol}
            />
          </div>
        </>
      )}
    </div>
  );
};
export default SearchIframe;
