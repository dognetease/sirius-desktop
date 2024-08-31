/* eslint-disable no-nested-ternary */
import { api, apis, GlobalSearchApi, IGlobalSearchDeepGrubStat, getIn18Text, reqBuyers, apiHolder, EdmCustomsApi, GrubStatus, SystemEvent } from 'api';
import React, { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import zhCN from 'antd/lib/locale/zh_CN';
import Icon from '@ant-design/icons/es/components/Icon';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { useInterval } from 'react-use';
import { navigate } from 'gatsby';
import { Subject } from 'rxjs';
import { Empty, Progress, Tooltip, Tabs, ConfigProvider } from 'antd';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { TTableColumn } from '../SearchTable/index';
import { ReactComponent as GrubProcessSvg } from '@/images/icons/globalsearch/grub-process.svg';
import { ReactComponent as GrubDataSvg } from '@/images/icons/globalsearch/grub-data.svg';
import { ReactComponent as ArrowDownSvg } from '@/images/icons/globalsearch/arrow-down.svg';
import { ReactComponent as SuccessSvg } from '@/images/icons/globalsearch/icon-success.svg';
import styles from './index.module.scss';
import { globalSearchDataTracker } from '../../tracker';
import { CompanyDetail } from '../../detail/CompanyDetail';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { GrubNameComp } from './components/NameComp';
import { BatchAddProcessItem } from './components/BatchAddProcessItem';
import { GrubProcessCodeEnum, GrubProcessTypeEnum } from './constants';
import { batchAddSuccessMessage$ } from '../../hook/useLeadsAdd';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

const eventApi = api.getEventApi();

const sysApi = api.getSystemApi();

export type IGrubProcessItem = Pick<TTableColumn, 'name' | 'id' | 'grubStatus'> & Partial<IGlobalSearchDeepGrubStat>;

interface GrubProcessProps extends React.HTMLAttributes<HTMLDivElement> {}

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

const BATCH_ADD_FETCH_MAX_NUM = 30;

export const asyncTaskMessage$ = new Subject<SystemEvent>();

export const dynamicProcessTexts = ['正在启动...', '正在搜索引擎搜索...', '正在从全球企业名录中搜索...', '正在全球B2B平台中搜索...', '数据清洗中...', '数据整合中...'];

const batchAddCodeList: string[] = [
  GrubProcessCodeEnum.customBatchAddBooks,
  GrubProcessCodeEnum.customBatchAddLeads,
  GrubProcessCodeEnum.linkedinBatchAddLeads,
  GrubProcessCodeEnum.customBatchAddEdm,
  GrubProcessCodeEnum.globalBatchAddBooks,
  GrubProcessCodeEnum.globalBatchAddLeads,
  GrubProcessCodeEnum.emailBatchAddLeads,
  GrubProcessCodeEnum.globalBatchAddEdm,
  GrubProcessCodeEnum.companyFission,
];

const customsCodeList: string[] = [GrubProcessCodeEnum.customsDeepGrubBuyers, GrubProcessCodeEnum.customsDeepGrubSuppliers];

const contactsCodeList: string[] = [GrubProcessCodeEnum.deepGrub, GrubProcessCodeEnum.companyDeepGrub];

const batchAddTypeList: string[] = [GrubProcessTypeEnum.addressBook, GrubProcessTypeEnum.leads, GrubProcessTypeEnum.aiHosting, GrubProcessTypeEnum.fission];

const renderHeader = () => (
  <>
    <span style={{ marginRight: '6px' }} className={styles.grubLinkTextVisited}>
      已转为离线深挖{' '}
    </span>{' '}
  </>
);

const renderWarnMain = () => (
  <>
    <div className={styles.grubWarn}>未挖掘到相关信息，已自动转为离线深挖。离线深挖可能持续多天，挖掘结果将以邮件的形式通知你。</div>
  </>
);

export const DynamicProcessText: React.FC<{
  intervalTime?: number;
}> = ({ intervalTime = 1500 }) => {
  const [step, setStep] = useState(0);
  useInterval(() => {
    setStep(s => Math.min(s + 1, dynamicProcessTexts.length - 1));
  }, intervalTime);
  return <span>{dynamicProcessTexts[step] || dynamicProcessTexts[dynamicProcessTexts.length - 1]}</span>;
};

export const GrubbingComp: React.FC<{ text?: string }> = ({ text }) => (
  <span className={styles.grubText}>
    <Icon style={{ fontSize: 20, marginRight: 8, color: 'transparent' }} component={GrubProcessSvg} spin />
    {text || <DynamicProcessText />}
  </span>
);

const DynamicProgress = () => {
  const [step, setStep] = useState(0);
  useInterval(() => {
    setStep(s => Math.min(s + 1, dynamicProcessTexts.length - 1));
  }, 1500);
  const fixPercent = (step / dynamicProcessTexts.length) * 95;
  return <Progress strokeColor="#4C6AFF" strokeLinecap="square" strokeWidth={8} type="line" percent={fixPercent} showInfo={false} className={styles.progress} />;
};

const GrubProcessItem: React.FC<{
  item: IGrubProcessItem;
  onGoDetail(id: string): void;
  defaultVisited?: boolean;
}> = ({ item, onGoDetail, defaultVisited = false }) => {
  const grubCount = item.grubStatus === 'GRUBBED' ? item.grubCount ?? 0 : item.grubCount;
  const { id, grubStatus, code, name } = item;
  const [visited, setVisited] = useState<boolean>(defaultVisited);
  const type = useMemo(() => (code === GrubProcessCodeEnum.deepGrub ? GrubProcessTypeEnum.contact : GrubProcessTypeEnum.company), [code]);
  const renderGrubStatus = () => {
    if (type === GrubProcessTypeEnum.contact) {
      return (
        <>
          {grubStatus === 'GRUBBING' && <GrubbingComp />}
          {grubStatus === 'OFFLINE_GRUBBING' && <>{renderHeader()}</>}
          {(grubStatus === 'GRUBBED' || grubStatus === 'OFFLINE_GRUBBED') && !grubCount && <span className={styles.grubText}>未挖到联系人</span>}
          {(grubStatus === 'GRUBBED' || grubStatus === 'OFFLINE_GRUBBED') && typeof grubCount === 'number' && grubCount > 0 && (
            <>
              <SuccessSvg />
              <span
                onClick={() => {
                  setVisited(true);
                  onGoDetail(id);
                  globalSearchDataTracker.trackGrubListViewDetail();
                }}
                style={{ paddingLeft: 8 }}
                className={classNames(styles.grubLinkText, {
                  [styles.grubLinkTextVisited]: visited,
                })}
              >
                {`${getIn18Text('LIJICHAKAN')}(${grubCount})`}
              </span>
            </>
          )}
        </>
      );
    }
    if (type === GrubProcessTypeEnum.company) {
      return (
        <>
          {grubStatus === 'GRUBBING' && <GrubbingComp />}
          {grubStatus === 'OFFLINE_GRUBBING' && <>{renderHeader()}</>}
          {(grubStatus === 'GRUBBED' || grubStatus === 'OFFLINE_GRUBBED') && (
            <>
              <SuccessSvg />
              <span
                onClick={() => {
                  setVisited(true);
                  onGoDetail(id);
                  globalSearchDataTracker.trackGrubListViewDetail();
                }}
                style={{ paddingLeft: 8 }}
                className={classNames(styles.grubLinkText, {
                  [styles.grubLinkTextVisited]: visited,
                })}
              >
                {getIn18Text('LIJICHAKAN')}
              </span>
            </>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <div
      className={classNames(styles.grubItem, {
        [styles.grubItemGrubbing]: grubStatus === 'GRUBBING',
      })}
    >
      <div className={styles.grubItemTitle}>
        <GrubNameComp type={type} code={code} name={name} />
        <div className={styles.grubStatus}>{renderGrubStatus()}</div>
      </div>
      {grubStatus === 'GRUBBING' && <DynamicProgress />}
      {grubStatus === 'OFFLINE_GRUBBING' || grubStatus === 'NOT_GRUBBING' ? renderWarnMain() : ''}
    </div>
  );
};

const GrubProcessCustomsItem: React.FC<{
  item: IGrubProcessItem;
  defaultVisited?: boolean;
  onVisit?: (id: string) => void;
}> = ({ item, defaultVisited = false, onVisit }) => {
  const grubCount = item.grubStatus === 'GRUBBED' ? item.grubCount ?? 0 : item.grubCount;
  const [visited, setVisited] = useState<boolean>(defaultVisited);
  const handleCustomsDeep = () => {
    onVisit?.(item.id);
    navigate(`#wmData?page=customs&taskId=${encodeURIComponent(item.id)}`);
  };
  const renderCustomsStatus = () => (
    <>
      {(item.grubStatus === 'GRUBBING' || item.grubStatus === 'OFFLINE_GRUBBING' || item.grubStatus === 'NOT_GRUBBING') && renderHeader()}
      {(item.grubStatus === 'GRUBBED' || item.grubStatus === 'OFFLINE_GRUBBED') && !grubCount && <span className={styles.grubText}>未挖掘到结果</span>}
      {(item.grubStatus === 'GRUBBED' || item.grubStatus === 'OFFLINE_GRUBBED') && typeof grubCount === 'number' && grubCount > 0 && (
        <>
          <SuccessSvg />
          <span
            onClick={() => {
              setVisited(true);
              handleCustomsDeep();
            }}
            style={{ paddingLeft: 8 }}
            className={classNames(styles.grubLinkText, {
              [styles.grubLinkTextVisited]: visited,
            })}
          >
            {`${getIn18Text('LIJICHAKAN')}(${grubCount})`}
          </span>
        </>
      )}
    </>
  );
  return (
    <>
      <div className={styles.grubItem}>
        <div className={styles.grubItemTitle}>
          <GrubNameComp type={GrubProcessTypeEnum.customs} code={item.code} name={item.name} />
          <div className={styles.grubStatus}>{renderCustomsStatus()}</div>
        </div>
        {item.grubStatus === 'GRUBBING' || item.grubStatus === 'OFFLINE_GRUBBING' || item.grubStatus === 'NOT_GRUBBING' ? renderWarnMain() : ''}
      </div>
    </>
  );
};

const tabList: Array<{ key: 'ALL' | 'GRUBBING' | 'GRUBBED'; text: string }> = [
  {
    key: 'ALL',
    text: '全部',
  },
  {
    key: 'GRUBBING',
    text: '进行中',
  },
  {
    key: 'GRUBBED',
    text: '已完成',
  },
];

const { TabPane } = Tabs;

export interface GrubProcessRef {
  addProcess(item: IGrubProcessItem): void;
}
export type GrubTab = 'ALL' | 'GRUBBING' | 'GRUBBED';

const MemoedItem = React.memo(GrubProcessItem, (prevProps, nextProps) => isEqual(prevProps.item, nextProps.item));
const MemoedCustomsItem = React.memo(GrubProcessCustomsItem, (prevProps, nextProps) => isEqual(prevProps.item, nextProps.item));
const MemoedBatchAddItem = React.memo(BatchAddProcessItem, (prevProps, nextProps) => isEqual(prevProps, nextProps));

const GrubProcess: React.FC<GrubProcessProps> = ({ ...rest }) => {
  const [allProcess, setAllProcess] = useState<Array<IGrubProcessItem>>([]);
  const [visible, setVisible] = useState<boolean>(false);
  const processRef = useRef<HTMLDivElement>(null);
  const [processStyle, setProcessStyle] = useState<CSSProperties>({});
  const [hasNewContacts, setHasNewContacts] = useState<boolean>(false);
  const [failedGrubIds, setFailedGrubIds] = useState<string[]>([]);
  const [fetchNumMap, setFetchNumMap] = useState<Record<string, number>>({});
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<GrubTab>('ALL');
  const [showDetail, setShowDetail] = useState<{
    id?: string;
    visible: boolean;
  }>({
    visible: false,
  });
  const [finallyProcess, setFinallyProcess] = useState<Array<IGrubProcessItem>>([]);
  const syncGrubList = async () => {
    try {
      const contactGrubListAll = await globalSearchApi.globalSearchDeepGrubStatAllV2();
      setAllProcess(contactGrubListAll.map(e => ({ ...e, grubStatus: e.status })));
    } catch {
      // do nothing
    }
  };

  const handleGrubContactSuccess = (item: IGlobalSearchDeepGrubStat) => {
    const { grubCount, id } = item;
    setHasNewContacts(true);
    syncGrubList();
    eventApi.sendSysEvent({
      eventName: 'globalSearchGrubTaskFinish',
      eventData: {
        type: GrubProcessTypeEnum.contact,
        data: {
          ...item,
        },
      },
    });
    if (grubCount > 0) {
      SiriusMessage.success({
        content: (
          <span>
            <span>{`${getIn18Text('YIWEININWAJUEDAO')}${grubCount}${getIn18Text('GELIANXIREN')}`}</span>
            <span
              className={styles.messageLink}
              onClick={() => {
                setShowDetail({
                  visible: true,
                  id,
                });
              }}
            >
              {getIn18Text('LIJICHAKAN')}
            </span>
          </span>
        ),
        key: id,
      });
    }
  };

  const handleGrubCompanySuccess = (item: Pick<IGlobalSearchDeepGrubStat, 'name' | 'id' | 'status' | 'code'>) => {
    syncGrubList();
    eventApi.sendSysEvent({
      eventName: 'globalSearchGrubTaskFinish',
      eventData: {
        type: GrubProcessTypeEnum.company,
        data: {
          ...item,
        },
      },
    });
  };

  const handleToLongText = (param: string) => (param.length > 15 ? param.slice(0, 14) + '...' : param);

  const addContactProcess = (item: IGrubProcessItem) => {
    setVisible(true);
    setTab('ALL');
    setAllProcess(prev => [{ ...item, grubStatus: 'GRUBBING', code: GrubProcessCodeEnum.deepGrub, name: handleToLongText(item.name) + '的联系人信息' }, ...prev]);
    globalSearchApi
      .deepNewSearchContact(item.id)
      .then(res => {
        handleGrubContactSuccess({
          grubCount: res.grubEmailCount + (res.grubPhoneCount || 0),
          id: res.id,
          newEmails: res.newEmails,
          newPhones: res.newPhones,
          status: res.status,
          name: item.name,
        });
      })
      .catch(() => {
        setFailedGrubIds(prev => Array.from(new Set(prev.concat(item.id))));
      });
  };

  const addCompanyProcess = (item: IGrubProcessItem) => {
    setVisible(true);
    setTab('ALL');
    setAllProcess(prev => [{ ...item, grubStatus: 'GRUBBING', code: GrubProcessCodeEnum.companyDeepGrub, name: handleToLongText(item.name) + '的企业资料' }, ...prev]);
    globalSearchApi
      .doDeepSearchCompany(item.id)
      .then(res => {
        handleGrubCompanySuccess({
          id: res.id,
          status: item.status as GrubStatus,
          name: item.name,
        });
      })
      .catch(() => {
        setFailedGrubIds(prev => Array.from(new Set(prev.concat(item.id))));
      });
  };

  const addCustomsProcess = (item: { queryType: string; condition: reqBuyers }) => {
    setVisible(true);
    setTab('ALL');
    setAllProcess(prev => [
      {
        id: new Date().getTime() + '',
        grubStatus: 'GRUBBING',
        name:
          item.queryType === 'buysers' ? `与${handleToLongText(item.condition.queryValue)}相关的采购商` : `与${handleToLongText(item.condition.queryValue)}相关的供应商`,
        code: item.queryType === 'buysers' ? GrubProcessCodeEnum.customsDeepGrubBuyers : GrubProcessCodeEnum.customsDeepGrubSuppliers,
      },
      ...prev,
    ]);
    edmCustomsApi
      .doAddCustomsDeepTask({
        queryType: item.queryType === 'buysers' ? 'buyers' : ('suppliers' as 'suppliers' | 'buyers'),
        condition: item.condition,
      })
      .then(() => {
        syncGrubList();
      })
      .catch(() => {});
  };

  const handleDeepResult = (params: GrubTab) => {
    if (params === 'ALL') {
      setFinallyProcess(allProcess);
    } else if (params === 'GRUBBING') {
      setFinallyProcess(allProcess.filter(e => e.grubStatus === 'GRUBBING' || e.grubStatus === 'OFFLINE_GRUBBING' || e.grubStatus === 'NOT_GRUBBING'));
    } else {
      setFinallyProcess(allProcess.filter(e => e.grubStatus === 'GRUBBED' || e.grubStatus === 'OFFLINE_GRUBBED'));
    }
  };

  const onVisit = (id: string) => {
    setVisitedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleGoDetail = (id: string) => {
    setShowDetail({
      id,
      visible: true,
    });
    onVisit(id);
  };

  const getBatchAddStatus = (operateId: string) =>
    new Promise((reslove, reject) => {
      let count: number = BATCH_ADD_FETCH_MAX_NUM;
      let tm: any;
      const getDeepSearchStatus = async (deepId: string) => {
        try {
          const deepResult = await globalSearchApi.globalSearchDeepStatus(deepId);
          if (tm) {
            clearTimeout(tm);
          }
          if (deepResult.status === 'GRUBBED' || deepResult.status === 'OFFLINE_GRUBBING' || deepResult.status === 'OFFLINE_GRUBBED') {
            setFetchNumMap(prev => ({ ...prev, [operateId]: BATCH_ADD_FETCH_MAX_NUM }));
            reslove(deepResult);
            return;
          }

          if ((deepResult.status === 'GRUBBING' || deepResult.status === 'NOT_GRUBBING') && count > 0) {
            tm = setTimeout(() => {
              getDeepSearchStatus(operateId);
            }, 60000);
          } else {
            reject();
          }
          count -= 1;
          setFetchNumMap(prev => ({ ...prev, [operateId]: (prev[operateId] ?? 0) + 1 }));
        } catch (error) {
          reject(error);
        }
      };
      getDeepSearchStatus(operateId);
    });

  const doBatchAddProcess = (item: IGrubProcessItem, type: GrubProcessTypeEnum) => {
    setVisible(true);
    setTab('ALL');
    setAllProcess(prev => [{ ...item, grubStatus: 'GRUBBING', code: item.code, name: item.name, taskId: item.id }, ...prev]);
    const doFetch = () => {
      getBatchAddStatus(item.id)
        .then(() => {
          syncGrubList();
          setHasNewContacts(true);
          batchAddSuccessMessage$.next({
            eventName: 'globalSearchGrubTaskFinish',
            eventData: {
              type,
              data: item,
            },
          });
        })
        .catch(() => {
          setFailedGrubIds(prev => Array.from(new Set(prev.concat(item.id))));
        });
    };
    if (window?.requestIdleCallback) {
      window.requestIdleCallback(
        deadline => {
          if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
            doFetch();
          }
        },
        { timeout: 1000 }
      );
    } else {
      setTimeout(() => {
        doFetch();
      }, 1000);
    }
  };

  useEffect(() => {
    const r = asyncTaskMessage$.subscribe(event => {
      // 联系人深挖
      if (event?.eventData?.type === GrubProcessTypeEnum.contact && event.eventData.data) {
        addContactProcess(event.eventData.data);
      }
      // 公司深挖
      if (event?.eventData?.type === GrubProcessTypeEnum.company && event.eventData.data) {
        addCompanyProcess(event.eventData.data);
      }
      // 海关深挖
      if (event?.eventData?.type === GrubProcessTypeEnum.customs && event.eventData.data) {
        addCustomsProcess(event.eventData.data);
      }
      if (event?.eventData?.type === GrubProcessTypeEnum.customs && !event.eventData.data) {
        setVisible(true);
        setTab('GRUBBING');
        handleDeepResult('GRUBBING');
      }
      // 批量加入营销地址簿或录入线索异步任务
      if (batchAddTypeList.includes(event?.eventData?.type ?? '') && event?.eventData?.data) {
        doBatchAddProcess(event.eventData.data, event.eventData.type);
      }
    });
    return () => {
      r.unsubscribe();
    };
  }, []);
  const hasGrubbing = useMemo(() => allProcess.some(e => e.grubStatus === 'GRUBBING' || e.status === 'GRUBBING'), [allProcess]);
  const hasFailedProcess = useMemo(() => failedGrubIds.length > 0, [failedGrubIds]);
  useEffect(() => {
    let timer: any;
    if (hasGrubbing && hasFailedProcess) {
      timer = sysApi.intervalEvent({
        eventPeriod: 'mid',
        seq: 10,
        handler: () => {
          syncGrubList();
        },
      });
    }
    return () => {
      if (timer) {
        sysApi.cancelEvent('mid', timer);
      }
    };
  }, [hasGrubbing, hasFailedProcess]);

  useEffect(() => {
    syncGrubList();
  }, []);

  useEffect(() => {
    if (allProcess && allProcess.length > 0) {
      handleDeepResult(tab);
    }
  }, [allProcess]);

  useEffect(() => {
    if (visible) {
      window.requestAnimationFrame(() => {
        const rect = processRef.current?.getBoundingClientRect();
        if (!rect) return;
        if (rect.top < 0) {
          setProcessStyle({
            top: `${Math.abs(rect.top) + 60}px`,
          });
        } else if (rect.bottom > window.innerHeight) {
          setProcessStyle({
            top: 'auto',
            bottom: 0,
          });
        }
      });
    } else {
      setProcessStyle({});
    }
  }, [visible]);

  const grubbedCount = useMemo(
    () => `${allProcess.filter(e => e.grubStatus === 'GRUBBED' || e.grubStatus === 'OFFLINE_GRUBBED').length}/${allProcess.length}`,
    [allProcess]
  );

  const renderDetail = () => (
    <>
      {showDetail.id && (
        <ConfigProvider locale={zhCN}>
          <Drawer
            visible={showDetail.visible}
            onClose={() => {
              setShowDetail({
                visible: false,
              });
            }}
            width={872}
            zIndex={1000}
            getContainer={document.body}
            destroyOnClose
          >
            {showDetail ? <CompanyDetail showSubscribe reloadToken={0} id={showDetail.id} scene="grub" /> : null}
          </Drawer>
        </ConfigProvider>
      )}
    </>
  );

  if (!visible) {
    return (
      <>
        <Tooltip placement="right" title={allProcess.length === 0 ? getIn18Text('RENWUKEZAIZHELICHAKAN') : `已完成了${grubbedCount}任务`}>
          <div
            {...rest}
            className={classNames(styles.processFloat, rest.className, {
              [styles.processNew]: hasNewContacts,
            })}
            onClick={() => {
              setVisible(true);
              setHasNewContacts(false);
            }}
          >
            <span style={{ display: 'flex' }}>
              <GrubDataSvg />
            </span>
          </div>
        </Tooltip>
        {renderDetail()}
      </>
    );
  }
  return (
    <div ref={processRef} style={processStyle} className={classNames(styles.process)}>
      <div className={styles.title}>
        <Tabs
          size="small"
          tabBarGutter={20}
          activeKey={tab}
          onChange={value => {
            value === 'ALL' ? handleDeepResult('ALL') : value === 'GRUBBING' ? handleDeepResult('GRUBBING') : handleDeepResult('GRUBBED');
            setTab(value as 'ALL' | 'GRUBBING' | 'GRUBBED');
          }}
        >
          {tabList.map(item => (
            <TabPane
              tab={`${item.text}
              ${
                item.key === 'ALL'
                  ? allProcess.length
                  : item.key === 'GRUBBING'
                  ? allProcess.filter(e => e.grubStatus === 'GRUBBING' || e.grubStatus === 'OFFLINE_GRUBBING' || e.grubStatus === 'NOT_GRUBBING').length
                  : allProcess.filter(e => e.grubStatus === 'GRUBBED' || e.grubStatus === 'OFFLINE_GRUBBED').length
              }`}
              key={item.key}
            />
          ))}
        </Tabs>
        <div className={styles.opIcon}>
          <span
            className={styles.arrow}
            onClick={() => {
              setVisible(false);
            }}
          >
            <ArrowDownSvg />
          </span>
        </div>
      </div>
      <OverlayScrollbarsComponent className={styles.detailWrapper}>
        {finallyProcess.map(e => (
          <React.Fragment key={e.taskId || e.id || e.code}>
            {batchAddCodeList.includes(e.code ?? '') && (
              <MemoedBatchAddItem
                onVisit={onVisit}
                key={e.taskId}
                item={e}
                defaultVisited={visitedIds.has(e.taskId ?? '')}
                progressPercent={e.taskId && fetchNumMap[e.taskId] ? Math.floor((fetchNumMap[e.taskId] / BATCH_ADD_FETCH_MAX_NUM) * 100) : undefined}
              />
            )}
            {customsCodeList.includes(e.code ?? '') && <MemoedCustomsItem onVisit={onVisit} defaultVisited={visitedIds.has(e.id ?? '')} key={e.id} item={e} />}
            {contactsCodeList.includes(e.code ?? '') && <MemoedItem defaultVisited={visitedIds.has(e.id)} onGoDetail={handleGoDetail} key={e.id + e.code} item={e} />}
          </React.Fragment>
        ))}
        {finallyProcess.length === 0 && (
          <Empty
            className={styles.empty}
            description={
              <>
                <p className={styles.emptyTitle}>暂无任务</p>
              </>
            }
            image={<div className={styles.emptyImage} />}
          />
        )}
      </OverlayScrollbarsComponent>
      {renderDetail()}
    </div>
  );
};

export default GrubProcess;
