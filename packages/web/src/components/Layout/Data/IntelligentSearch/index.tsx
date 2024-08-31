import React, { useReducer, useRef, useState, useMemo, useEffect, FC } from 'react';
import classnames from 'classnames';
import { Space, Breadcrumb } from 'antd';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { useMemoizedFn } from 'ahooks';
import { openBatchCreateLeadsModal } from '@lxunit/app-l2c-crm';
import {
  apiHolder,
  urlStore,
  WhatsAppAiSearchResult,
  WhatsAppAiSearchTaskStatus,
  WhatsAppAiSearchExportParams,
  DataStoreApi,
  api,
  getIn18Text,
  ListWaPageSearchItem,
  CustomerLabelByEmailItem,
} from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
import AiMarketingEnter from '@web-edm/components/AiMarketingEnter/aiMarketingEnter';
import { downloadFile } from '@web-common/components/util/file';
import { getTransText } from '@/components/util/translate';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import { useResponsiveTable } from '@/hooks/useResponsiveTable';
import useEdmSendCount, { IEdmEmailList } from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import { Search } from './components/search';
import { SearchPage } from './components/searchPage';
import { SearchProgress } from './components/searchProgress';
import { IntelligentSearchContext, initialState, reducer, SearchParams, IntelligentSearchType } from './context';
import style from './style.module.scss';
import getPageRouterWithoutHash from '../../globalSearch/hook/getPageRouterWithoutHash';
import { getEmailColumns, getGroupColumns, phoneColumns } from './data';
import { globalSearchApi } from '../../globalSearch/constants';
import { useLeadsAdd } from '../../globalSearch/hook/useLeadsAdd';
import useWaLogin from '../../SNS/MultiAccount/components/waLogin';
import useWASend from '../../SNS/MultiAccount/hooks/useWASend';

const SEARCH_INTERVAL = 5000;
const httpApi = apiHolder.api.getDataTransApi();
const dataStoreApi = api.getDataStoreApi() as DataStoreApi;
const INTELLI_GENT_LIST = 'INTELLI_GENT_LIST';
// inWa: 嵌入whatsApp菜单中
const IntelligentSearch: FC<{ title?: string; inWa?: boolean }> = ({ title, inWa }) => {
  const [isManualStop, setIsManualStop] = useState(false);
  const [total, setTotal] = useState<number>(0);
  const [params, setParams] = useState<SearchParams | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [taskStatus, setTaskStatus] = useState<WhatsAppAiSearchTaskStatus>(WhatsAppAiSearchTaskStatus.STOP);
  const [visible, setVisible] = useState<boolean>(false);
  const [minimize, setMinimize] = useState(false);
  const [resultExporting, setResultExporting] = useState(false);
  const [tableData, setTableData] = useState<Array<WhatsAppAiSearchResult | ListWaPageSearchItem>>([]);
  const [emailMap, setEmailMap] = useState<Record<string, CustomerLabelByEmailItem[]>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const { layout, growRef } = useResponsiveTable();
  const [showIndexSearch, setShowIndexSearch] = useState(true);
  const [emailList, setEmailList] = useState<Array<IEdmEmailList>>([]);
  const [state, dispatch] = useReducer(reducer, { ...initialState, title, inWa });
  const isManualStopRef = useRef(isManualStop);
  const intervalRef = useRef<any>();

  useEdmSendCount(emailList, undefined, undefined, undefined, 'aiSearch', 'aisearch', getPageRouterWithoutHash());
  const { addGroup } = useWaLogin();
  const { waBulkSend } = useWASend();

  function doSearch() {
    if (params) {
      setLoading(true);
      globalSearchApi
        .listWaPage(params)
        .then(data => {
          setTotal(+data.total);
          setTableData(data.list);
          setTaskStatus(data.taskStatus);

          if (data.taskStatus === WhatsAppAiSearchTaskStatus.SEARCHING && !isManualStopRef.current) {
            setVisible(true);

            intervalRef.current = setInterval(() => {
              globalSearchApi.listWaPage(params).then(newData => {
                if (!isManualStopRef.current) {
                  setTotal(+newData.total);
                  setTableData(newData.list);
                  setTaskStatus(newData.taskStatus);

                  if (newData.taskStatus === WhatsAppAiSearchTaskStatus.STOP) {
                    clearInterval(intervalRef.current);
                  }
                } else {
                  clearInterval(intervalRef.current);
                }
              });
            }, SEARCH_INTERVAL);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }

  const initData = () => {
    setTotal(0);
    setTableData([]);
    setMinimize(false);
    setIsManualStop(false);
    setSelectedRowKeys([]);
    clearInterval(intervalRef.current);
  };

  const onSearch = (hideToast?: boolean) => {
    initData();
    const value = String(state.content).trim();
    if (value.length < 2) {
      if (!hideToast) {
        Toast.error({ content: getTransText('AtLeast2Characters') || '' });
      }
      return;
    }

    if (value.length > 100) {
      if (!hideToast) {
        Toast.error({ content: getTransText('NoMoreThan100Characters') || '' });
      }
      return;
    }
    setParams({
      ...state,
      page: 1,
      pageSize: Number((dataStoreApi.getSync(INTELLI_GENT_LIST).data as unknown as number) ?? 20),
    });
  };

  const onSearchPageTrigger = () => {
    setShowIndexSearch(false);
    onSearch();
  };

  const handleSearchStop = () => {
    setVisible(false);
    setIsManualStop(true);
    setTaskStatus(WhatsAppAiSearchTaskStatus.STOP);

    if (total === 0) {
      Toast.error({
        content: `${getTransText('StopAISearchPrefix') || ''} 
          0 ${getTransText('StopAISearchSuffix') || ''}`,
      });
    } else {
      Toast.success({
        content: `${getTransText('StopAISearchPrefix') || ''} 
        ${total} ${getTransText('StopAISearchSuffix') || ''}`,
      });
    }
  };

  const handleSearchFinish = () => {
    setVisible(false);
    Toast.success({
      content: `${getTransText('FinishAISearchPrefix') || ''} 
      ${total} ${getTransText('FinishAISearchSuffix') || ''}`,
    });
  };

  useEffect(() => {
    isManualStopRef.current = isManualStop;
  }, [isManualStop]);

  useEffect(() => {
    doSearch();
  }, [params]);

  const addGroupHandler = useMemoizedFn((waGroup: string) => {
    addGroup([waGroup], params?.content ?? '');
  });

  const columns = useMemo(
    () =>
      state?.type
        ? {
            [IntelligentSearchType.Email]: getEmailColumns(emailMap),
            [IntelligentSearchType.Phone]: phoneColumns,
            [IntelligentSearchType.Group]: getGroupColumns(addGroupHandler),
          }[state.type]
        : [],
    [state?.type, addGroupHandler, emailMap]
  );

  const rowKey = useMemo(
    () =>
      ({
        [IntelligentSearchType.Email]: 'email',
        [IntelligentSearchType.Phone]: 'phoneNumber',
        [IntelligentSearchType.Group]: 'id',
      }[state.type]),
    [state.type]
  );

  const handleResultExport = () => {
    if (params) {
      setResultExporting(true);
      const exportUrl = urlStore.get('exportWhatsAppPhone') as string;
      const exportParams: { idList: string[] } = {
        idList: selectedRows.map(item => item.id),
      };
      httpApi
        .post(exportUrl, exportParams, {
          responseType: 'blob',
          contentType: 'json',
        })
        .then(res => {
          const blob = res.rawData;
          const fileName = `智能引擎搜索_${params.type === IntelligentSearchType.Email ? '邮箱' : 'WhatsApp'}_${new Date().toLocaleString()}.xlsx`;
          downloadFile(blob, fileName);
        })
        .finally(() => {
          setResultExporting(false);
        });
    }
  };
  useEffect(() => {
    if (!tableData.length || params?.type !== IntelligentSearchType.Email) return;
    globalSearchApi
      .getCustomerLabelByEmailNew({
        email_list: tableData.map((item: any) => item.email),
      })
      .then(result => {
        if (result?.length > 0) {
          const resultMap: Record<string, CustomerLabelByEmailItem[]> = {};
          result.forEach(item => {
            if (item?.contact_email) {
              if (resultMap[item.contact_email]) {
                resultMap[item.contact_email].push(item);
              } else {
                resultMap[item.contact_email] = [item];
              }
            }
          });
          setEmailMap(resultMap);
        }
      });
  }, [tableData, params]);
  const onEmailLeadsPost = useMemoizedFn((extraParams: any) =>
    globalSearchApi.batchAddEmailLeads({
      ...extraParams,
      globalInfoVOList: selectedRowKeys.map(item => ({
        id: item,
      })),
      sourceType: 5,
    })
  );
  const {
    handleAddLeads: hookHandleAddLeads,
    leadsAddLoading,
    noLeadsWarning,
  } = useLeadsAdd({
    onFetch: onEmailLeadsPost,
    refresh: doSearch,
  });
  const handleAddLeads = useMemoizedFn(() => {
    if (selectedRowKeys.length <= 0) {
      noLeadsWarning();
      return;
    }
    openBatchCreateLeadsModal({
      submit: ({ groupIds, isAddToGroup }) =>
        hookHandleAddLeads({
          extraFetchParams: { leadsGroupIdList: groupIds, isAddToGroup },
          selectedNum: selectedRowKeys.length,
          asyncTaskTitle: '条联系人信息',
        }),
    });
  });

  const handleGroupSend = useMemoizedFn(() => {
    waBulkSend(selectedRowKeys.map(item => item.replace(/[+\s]/g, '')));
  });

  const handleGroupAdd = useMemoizedFn(() => {
    addGroup(
      selectedRows.map(row => row.waGroup),
      params?.content ?? ''
    );
  });

  return (
    <IntelligentSearchContext.Provider value={{ state, dispatch }}>
      <div className={style.wrapper}>
        <div className={style.bread}>
          <Breadcrumb separator={<SeparatorSvg />}>
            <Breadcrumb.Item>
              <span className={style.breadLink} onClick={() => !visible && setShowIndexSearch(true)}>
                {getTransText('CustomerAcquisitionByData')}
              </span>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{state.title || getTransText('IntelligentSearch')}</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        {showIndexSearch ? (
          <div className={style.copverPage}>
            <SearchPage onSearch={onSearchPageTrigger} />
          </div>
        ) : (
          ''
        )}
        <div className={style.search}>
          <Search onSearch={onSearch} disable={visible} />
        </div>
        <div className={classnames(style.table, layout.grow)} ref={growRef}>
          <div className={style.operate}>
            <div className={style.operateLeft}>
              {Boolean(selectedRowKeys.length) && <span style={{ marginRight: '8px' }}>已选{selectedRowKeys.length}条数据</span>}
              {params?.type === IntelligentSearchType.Email && (
                <Space size={16}>
                  <AiMarketingEnter
                    btnType="primary"
                    text={getIn18Text('YIJIANYINGXIAO')}
                    needDisable={!selectedRowKeys.length}
                    handleType="assembly"
                    from="intelligent"
                    afterClickType="sync"
                    afterClick={() => {
                      setEmailList(selectedRowKeys.map(email => ({ contactEmail: email, contactName: '', sourceName: '智能引擎搜索', increaseSourceName: 'aisearch' })));
                    }}
                  />
                  <Button disabled={!selectedRowKeys.length} onClick={handleAddLeads} loading={leadsAddLoading}>
                    {getTransText('LURUXIANSUO')}
                  </Button>
                  {/* <Button loading={resultExporting} disabled={!selectedRowKeys.length} onClick={handleResultExport}>
                    {getTransText('QUANBUDAOCHU')}
                  </Button> */}
                </Space>
              )}
              {params?.type === IntelligentSearchType.Phone && (
                <Space size={16}>
                  <PrivilegeCheck accessLabel="GROUP_SEND" resourceLabel="WHATSAPP_GROUP_SEND">
                    <Button btnType="primary" disabled={!selectedRowKeys.length} onClick={handleGroupSend}>
                      {'WA个人号群发'}
                    </Button>
                  </PrivilegeCheck>
                  <Button loading={resultExporting} disabled={!selectedRowKeys.length} onClick={handleResultExport}>
                    {getTransText('QUANBUDAOCHU')}
                  </Button>
                </Space>
              )}
              {params?.type === IntelligentSearchType.Group && (
                <Space size={16}>
                  <Button btnType="primary" disabled={!selectedRowKeys.length || selectedRowKeys.length > 1000} onClick={handleGroupAdd}>
                    加入群组
                  </Button>
                </Space>
              )}
            </div>
            <div>
              {Number(total) > 0 && (
                <SiriusPagination
                  className={style.pageTop}
                  disabled={visible}
                  onChange={(page, pageSize) => {
                    if (!state.content) {
                      initData();
                      return;
                    }
                    if (params) {
                      setParams(previous => ({
                        ...params,
                        pageSize: pageSize as number,
                        page: pageSize === previous?.pageSize ? (page as number) : 1,
                      }));
                      try {
                        if (typeof pageSize === 'number') {
                          dataStoreApi.putSync(INTELLI_GENT_LIST, JSON.stringify(pageSize), {
                            noneUserRelated: false,
                          });
                        }
                      } catch (error) {}
                    }
                  }}
                  simple
                  pageSize={params?.pageSize ?? 20}
                  current={params?.page ?? 1}
                  defaultCurrent={1}
                  total={total}
                />
              )}
            </div>
          </div>
          <SiriusTable
            columns={columns}
            rowKey={rowKey}
            loading={loading}
            dataSource={tableData}
            rowSelection={{
              fixed: true,
              selectedRowKeys,
              preserveSelectedRowKeys: true,
              onChange: (keys, rows) => {
                setSelectedRowKeys(keys as string[]);
                setSelectedRows(rows);
              },
            }}
            pagination={false}
          />
          <SiriusPagination
            className={style.pagination}
            onChange={(pg, ps) => {
              if (!state.content) {
                initData();
                return;
              }
              if (params) {
                setParams(previous => ({
                  ...params,
                  pageSize: ps as number,
                  page: ps === previous?.pageSize ? (pg as number) : 1,
                }));
                try {
                  if (typeof ps === 'number') {
                    dataStoreApi.putSync(INTELLI_GENT_LIST, JSON.stringify(ps), {
                      noneUserRelated: false,
                    });
                  }
                } catch (error) {}
              }
            }}
            {...{
              total,
              disabled: visible,
              current: params?.page || 1,
              pageSize: params?.pageSize || 10,
              pageSizeOptions: ['10', '20', '50'],
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (_total: number) => (
                <span>
                  {getTransText('TotalDataPart1') || ''}
                  {Number(_total).toLocaleString()}
                  {getTransText('TotalDataPart2') || ''}
                </span>
              ),
            }}
          />
        </div>
      </div>

      <SearchProgress
        visible={visible}
        total={total}
        minimize={minimize}
        taskStatus={taskStatus}
        isManualStop={isManualStop}
        onMinimizeChange={setMinimize}
        onStop={handleSearchStop}
        onFinish={handleSearchFinish}
      />
    </IntelligentSearchContext.Provider>
  );
};

export default IntelligentSearch;
