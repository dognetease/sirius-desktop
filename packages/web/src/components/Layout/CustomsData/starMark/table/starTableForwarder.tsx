import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CompanyCollectItem, CollectLogItem, CollectLogItemTypeEnum, getIn18Text } from 'api';
import { PaginationProps, Modal, Alert } from 'antd';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import { useMemoizedFn, useRequest, useUpdateEffect } from 'ahooks';
import classNames from 'classnames';
// import Badge from '@web-common/components/UI/SiriusBadge';
import Badge from '@lingxi-common-component/sirius-ui/SiriusBadge';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { AlertErrorIcon } from '@web-common/components/UI/Icons/icons';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { EmptyList } from '@web-edm/components/empty/empty';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import LevelDrawer from '@/components/Layout/CustomsData/components/levelDrawer/levelDrawer';
import CustomsDetail from '@/components/Layout/CustomsData/customs/customsDetail/customsDetail';
import useTableHeight from '@/components/Layout/Customer/components/hooks/useTableHeight';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { CompanyDetail } from '@/components/Layout/globalSearch/detail/CompanyDetail';
import { customsDataTracker } from '../../tracker/tracker';
import { DetailLevelStatus } from '@/components/Layout/globalSearch/search/search';
import { globalSearchApi } from '@/components/Layout/globalSearch/constants';
import { StarForwarderOpBehavior, getStarForwarderColumns } from '../data';
import { showFissionRuleModal } from '../../components/FissionRuleModal';
import style from './table.module.scss';
import FissionDetail from '../../components/FissionDetail';
import { useDrawerByRecData } from '../../customs/customsDetail/hooks/useDrawerByRecData';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import SearchTab from '@/components/Layout/globalSearch/search/SearchTab';
import { StarTableTypeEnum, StarTableTypeOptions } from '../constants';
import ImportTable from './importTable';

interface Props {
  tableList: any;
  pagination: any;
  onChange: (pagination: PaginationProps, filter: any, sorter: any) => void;
  deleteStar: (ids: Array<string | number>, onSuccess?: () => void) => void;
  changeItem(id: string | number, params: any): void;
  onRefreshData?(): void;
  fissionId: number | null;
  onFissionDetail?(fissionId: number | null): void;
  loading?: boolean;
}

const defaultPagination: PaginationProps = {
  current: 1,
  defaultPageSize: 20,
  showSizeChanger: false,
  size: 'small',
  showTotal: total => `${getIn18Text('GONG')}${total}${getIn18Text('TIAO')}`,
  total: 0,
  className: 'pagination-wrap pagination-customs',
};
const detailLevels: Array<DetailLevelStatus> = new Array(3).fill({ open: false });

const StarTableForwarder: React.FC<Props> = ({
  tableList: propTableList,
  pagination,
  onChange,
  deleteStar,
  changeItem,
  onRefreshData,
  onFissionDetail,
  loading,
  fissionId,
}) => {
  const [queryType, setQueryType] = useState<StarTableTypeEnum>(StarTableTypeEnum.Subscribe);
  const { tableRef, y } = useTableHeight([], propTableList);
  const importTableRef = useRef<any>();
  const [selectedRowKeys, setSelectedKeys] = useState<string[]>([]);
  const [tableList, setTableList] = useState<CompanyCollectItem[]>(propTableList);
  const { onDrawerClose, onDrawerOpen, recData } = useDrawerByRecData();
  const [detailDrawStatus, setDetailDrawStatus] = useState<{
    visible?: boolean;
    id?: string | number;
    type?: CollectLogItemTypeEnum;
    name?: string;
  }>({});
  const [logModalStatus, setLogModalStatus] = useState<{
    visible?: boolean;
    list?: Array<{
      time: string;
      item: CollectLogItem[];
    }>;
    esid?: string | number;
    collectId?: string | number;
    companyName?: string;
  }>({});
  const [nextDetailLevels, setNextDetailLevels] = useState<DetailLevelStatus[]>(detailLevels);
  const { data: statData, run: refreshStat } = useRequest(() => globalSearchApi.getImportCompanyStat());
  useEffect(() => {
    setTableList(propTableList);
  }, [propTableList]);
  useEffect(() => {
    const hashList = window.location.hash.split('?');
    const search = new URLSearchParams(hashList[1]);
    const paramsFissionId = search.get('fissionId');
    if (!paramsFissionId) return;
    try {
      onFissionDetail?.(paramsFissionId as any);
      search.delete('fissionId');
      window.location.hash = `${hashList[0]}?${search.toString()}`;
    } catch (e) {
      // do nothing
    }
  }, [window.location.hash]);
  // 查看详情
  const handleViewCompanyDetail = useMemoizedFn((esid: number | string, collectId?: string | number, type?: CollectLogItemTypeEnum, name?: string) => {
    setDetailDrawStatus({
      id: esid,
      visible: true,
      type,
      name,
    });
    if (!collectId) return;
    changeItem(collectId, { status: 2 });
    globalSearchApi.doUpdateCollect(collectId);
  });

  const handleViewCustomsDetail = useMemoizedFn((type: 'supplier' | 'buysers', name?: string, country?: string, originName?: string) => {
    onDrawerOpen(
      {
        to: type,
        companyName: name ?? '',
        country: country ?? '未公开',
        originCompanyName: originName ?? '',
      },
      0
    );
  });

  const handleViewLog = useMemoizedFn(async (id: string | number, esId: string | number, companyName: string) => {
    const res = await globalSearchApi.doGetCollectLogList(id);
    if (res.length > 0) {
      setLogModalStatus({
        companyName,
        list: res,
        esid: esId,
        visible: true,
        collectId: id,
      });
    } else {
      SiriusMessage.info('暂无记录');
    }
  });
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedKeys(newSelectedRowKeys as string[]);
  };
  const onBatchDelete = () => {
    SiriusModal.warning({
      title: '确定要退订吗？',
      icon: <AlertErrorIcon />,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: {
        style: {
          background: '#4c6aff',
        },
      },
      onOk: async () => {
        deleteStar(selectedRowKeys, () => {
          setSelectedKeys([]);
        });
      },
    });
  };
  const modalRefreshTable = (id: number, params: any) => {
    changeItem(id, params);
  };
  const handler = useMemoizedFn((behavior: StarForwarderOpBehavior, record: CompanyCollectItem) => {
    switch (behavior) {
      case StarForwarderOpBehavior.detail:
        handleViewCompanyDetail(record.esId, record.id, undefined, record.originName || record.companyName);
        break;
      case StarForwarderOpBehavior.log:
        handleViewLog(record.id, record.esId, record.companyName);
        break;
      case StarForwarderOpBehavior.delete:
        deleteStar([record.id], () => {
          setSelectedKeys(prev => prev.filter(item => item !== record.id));
        });
        break;
      case StarForwarderOpBehavior.fission:
        showFissionRuleModal(
          {
            id: Number(record.id),
            companyName: record.companyName,
            country: record.country as string,
            type: 'subscribe',
          },
          modalRefreshTable
        );
        break;
      case StarForwarderOpBehavior.fissionDetail:
        onFissionDetail?.(record.fissionId);
        break;
      default:
        break;
    }
  });

  const onRefresh = () => {
    if (queryType === StarTableTypeEnum.Subscribe) {
      onRefreshData?.();
    } else {
      importTableRef.current?.refresh();
    }
  };
  useUpdateEffect(() => {
    onRefresh();
  }, [queryType]);

  const showOptions = useMemo(
    () =>
      StarTableTypeOptions.map(({ label, value }) => ({
        label: (
          <span>
            {label}
            {Boolean(value === StarTableTypeEnum.Import && statData?.notViewNum) && <Badge className={style.tabNum} count={statData?.notViewNum} overflowCount={999} />}
          </span>
        ),
        value,
      })),
    [statData?.notViewNum]
  );

  return (
    <div className={style.wrapper}>
      {!fissionId ? (
        <>
          <SearchTab defaultActiveKey={StarTableTypeEnum.Subscribe} tabList={showOptions} activeKey={queryType} onChange={setQueryType} />
          {queryType === StarTableTypeEnum.Subscribe ? (
            <>
              <div className={style.tableTips}>当订阅的公司有信息更新时，系统将及时通知</div>
              <div ref={tableRef} className={style.startTableBox}>
                <div className={style.customsBody}>
                  <PrivilegeCheck accessLabel="OP" resourceLabel="COMMERCIAL">
                    <div className={style.tableOps}>
                      <Button btnType="default" disabled={selectedRowKeys.length === 0} onClick={onBatchDelete}>
                        退订
                      </Button>
                    </div>
                  </PrivilegeCheck>
                  <SiriusTable
                    bordered={false}
                    loading={loading}
                    rowKey="id"
                    columns={getStarForwarderColumns({ handler })}
                    onChange={onChange}
                    scroll={{ x: 1134, y }}
                    rowSelection={{
                      type: 'checkbox',
                      selectedRowKeys,
                      onChange: onSelectChange,
                      preserveSelectedRowKeys: true,
                    }}
                    dataSource={tableList}
                    locale={{
                      emptyText: (
                        <EmptyList isCustoms>
                          <div>{getIn18Text('ZANWUSHUJU')}</div>
                        </EmptyList>
                      ),
                    }}
                    pagination={{
                      ...defaultPagination,
                      ...pagination,
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {Boolean(statData?.inMatchNum) && (
                <Alert message={`有${statData?.inMatchNum}家公司正在海关数据匹配中，预计明天上午8点可查询`} type="info" className={style.tableAlert} showIcon closable />
              )}
              <ImportTable ref={importTableRef} refreshStat={refreshStat} onFissionDetail={onFissionDetail} handleViewCustomsDetail={handleViewCustomsDetail} />
            </>
          )}
        </>
      ) : (
        <FissionDetail fissionId={fissionId} handleViewCompanyDetail={handleViewCompanyDetail} handleViewCustomsDetail={handleViewCustomsDetail} />
      )}
      <Modal
        visible={!!logModalStatus.visible}
        destroyOnClose
        title={logModalStatus.companyName}
        onCancel={() => {
          setLogModalStatus({});
        }}
      >
        <div className={classNames(style.dataLogWrapper, 'sirius-scroll')}>
          {logModalStatus.list?.map(({ time, item: logItems }) => (
            <div className={style.dataLogItem} key={time}>
              <p className={style.dataLogItemTitle}>{time}</p>
              <ul className={style.dataLogUl}>
                {logItems.map(item => (
                  <li key={`${item.type}${item.logDesc}${item.dateStr}`}>
                    <span>{item.logDesc}</span>
                    <span
                      className={style.dataLogLink}
                      onClick={() => {
                        logModalStatus.esid &&
                          logModalStatus.collectId &&
                          handleViewCompanyDetail(logModalStatus.esid, logModalStatus.collectId, item.type, logModalStatus.companyName);
                        customsDataTracker.trackCollectionDetail({ from: 'log' });
                        setLogModalStatus({});
                      }}
                    >
                      {getIn18Text('CHAKAN')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Modal>
      <LevelDrawer onCollectIdChange={onRefresh} onChangeListItem={onRefresh} recData={recData} onClose={onDrawerClose} onOpen={onDrawerOpen}>
        <CustomsDetail />
      </LevelDrawer>
      <Drawer
        visible={detailDrawStatus.visible}
        onClose={() => {
          setDetailDrawStatus({});
        }}
        width={872}
        zIndex={1000}
      >
        {detailDrawStatus.visible ? (
          <CompanyDetail
            scene="subscription"
            showSubscribe
            onToggleSub={onRefresh}
            onToggleMergeCompanySub={onRefresh}
            onChangeListItem={onRefresh}
            id={detailDrawStatus.id as string}
            anchorCustoms={detailDrawStatus.type === CollectLogItemTypeEnum.Customs}
            reloadToken={0}
            recommendShowName={detailDrawStatus.name}
            showNextDetail={id => {
              setNextDetailLevels(prev => {
                const [_first, ...rest] = prev;
                return [{ open: true, id }, ...rest];
              });
            }}
          />
        ) : null}
      </Drawer>
      {nextDetailLevels.map((level, index) => (
        <Drawer
          key={level.id}
          visible={level.open}
          zIndex={1001 + index}
          onClose={() => {
            setNextDetailLevels(prev =>
              prev.map((e, jndex) => {
                if (index === jndex) {
                  return {
                    open: false,
                  };
                }
                return e;
              })
            );
          }}
          width={872}
          destroyOnClose
        >
          {level.open && !!level.id && (
            <CompanyDetail
              showSubscribe
              id={level.id}
              onToggleSub={onRefresh}
              onToggleMergeCompanySub={onRefresh}
              onChangeListItem={onRefresh}
              reloadToken={0}
              showNextDetail={id => {
                if (index < nextDetailLevels.length - 1) {
                  setNextDetailLevels(prev =>
                    prev.map((e, jndex) => {
                      if (index + 1 === jndex) {
                        return {
                          id,
                          open: true,
                        };
                      }
                      return e;
                    })
                  );
                } else {
                  SiriusMessage.warn(`最多打开${nextDetailLevels.length}层`);
                }
              }}
            />
          )}
        </Drawer>
      ))}
    </div>
  );
};

export default StarTableForwarder;
