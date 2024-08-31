/* eslint-disable react/jsx-props-no-spreading */
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import moment, { Moment } from 'moment';
import { Empty } from 'antd';
import classNames from 'classnames';
import { ImportCompanyResItem, getIn18Text } from 'api';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import { AlertErrorIcon } from '@web-common/components/UI/Icons/icons';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import DatePicker from '@web-common/components/UI/DatePicker';
import DatePicker from '@lingxi-common-component/sirius-ui/DatePicker';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
// import { Checkbox } from '@web-common/components/UI/Checkbox';
import Checkbox from '@lingxi-common-component/sirius-ui/Checkbox';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { useAntdTable, useBoolean, useLatest, useSetState } from 'ahooks';
import useTableHeight from '@/components/Layout/Customer/components/hooks/useTableHeight';
import { batchAddSuccessMessage$ } from '@/components/Layout/globalSearch/hook/useLeadsAdd';
import { GrubProcessTypeEnum } from '@/components/Layout/globalSearch/search/GrubProcess/constants';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { ReactComponent as ImportEmpty } from '@/images/globalSearch/import-empty.svg';
import { ImportCompanyOpBehavior, getImportCompanyColumns } from '../data';
import { globalSearchApi } from '../../../globalSearch/constants';
import style from './table.module.scss';
import { CompanyUploader } from '../../components/CompanyUploader/CompanyUploader';
import { MatchStatusEnumType, MatchStatusList } from '../constants';
import { showFissionRuleModal } from '../../components/FissionRuleModal';

const { RangePicker } = DatePicker;

interface Props {
  refreshStat: () => void; // 刷新未浏览及匹配中的数据状态
  onFissionDetail?(fissionId: number | null): void;
  handleViewCustomsDetail?: (type: 'supplier' | 'buysers', name?: string, country?: string, originName?: string) => void;
}

interface FilterState {
  searchValue?: string;
  dateRange?: [Moment, Moment];
  matchStatus?: string;
  notViewed?: boolean;
}

const fetchImportList =
  ({ searchValue, dateRange, matchStatus, notViewed }: FilterState) =>
  async (params: { current: number; pageSize: number; sorter?: any }) => {
    const startTime = dateRange?.length ? moment(dateRange[0]).format('YYYY-MM-DD') : undefined;
    const endTime = dateRange?.length ? moment(dateRange[1]).format('YYYY-MM-DD') : undefined;
    const status = matchStatus == null || matchStatus === MatchStatusEnumType.All ? undefined : Number(matchStatus);
    const data = await globalSearchApi.listImportCompany({
      searchValue,
      startTime,
      endTime,
      status,
      notViewed,
      page: params.current - 1,
      size: params.pageSize,
    });
    return {
      customsMatchCompanyNum: data.customsMatchCompanyNum,
      list: data.pageableResult.data,
      total: data.pageableResult.total,
    };
  };

const ImportTable = forwardRef(({ handleViewCustomsDetail, onFissionDetail, refreshStat }: Props, ref) => {
  const [filterState, setFilterState] = useSetState<FilterState>({});
  const filterStateRef = useLatest(filterState);
  const lastFilterStateRef = useRef<FilterState>({});
  const [showUploadModal, { setTrue, setFalse }] = useBoolean();
  const { searchValue, notViewed, dateRange, matchStatus } = filterState;
  const { tableProps, refresh, pagination, search, data } = useAntdTable(fetchImportList(filterStateRef.current), {
    defaultParams: [{ current: 1, pageSize: 20 }],
    defaultPageSize: 20,
  });
  const { tableRef, y } = useTableHeight([]);
  const [selectedRowKeys, setSelectedKeys] = useState<number[]>([]);
  const [selectedRows, setSelectedRows] = useState<ImportCompanyResItem[]>([]);
  const onSelectChange = (newSelectedRowKeys: React.Key[], newSelectedRows: any[]) => {
    setSelectedKeys(newSelectedRowKeys as number[]);
    setSelectedRows(newSelectedRows);
  };
  const resetSelectedData = () => {
    setSelectedKeys([]);
    setSelectedRows([]);
  };
  const run = () => {
    lastFilterStateRef.current = { ...filterState };
    search.submit();
    resetSelectedData();
  };
  const onUploadSuccess = () => {
    setFalse();
    setFilterState({});
    resetSelectedData();
    refresh();
    refreshStat();
  };
  const onSearchKeyChange = (e: any) => {
    setFilterState({ searchValue: e.target.value });
  };
  const onSearchKeyConfirm = () => {
    if (lastFilterStateRef.current.searchValue === searchValue) return;
    run();
  };
  const onRangeChange = (newRange: [Moment | null, Moment | null] | null) => {
    if (!newRange?.filter(Boolean).length) {
      setFilterState({
        dateRange: undefined,
      });
    } else {
      setFilterState({
        dateRange: newRange as [Moment, Moment],
      });
    }
    run();
  };
  const onMatchStatusChange = (value: string) => {
    setFilterState({ matchStatus: value });
    run();
  };
  const onNotViewedChange = (e: any) => {
    setFilterState({ notViewed: e.target.checked ? true : undefined });
    run();
  };
  const subscribeCompany = async (records: ImportCompanyResItem[]) => {
    const validList = records.filter(item => item.status && !item.collectId);
    if (!validList.length) {
      SiriusMessage.error({ content: '所选公司不可订阅' });
      return;
    }
    await globalSearchApi.collectImportCompany({ ids: validList.map(item => item.id) });
    SiriusMessage.success({ content: getIn18Text('DINGYUECHENGGONG') });
    resetSelectedData();
    refresh();
  };
  const unsubscribeCompany = async (record: ImportCompanyResItem) => {
    if (!record.status || !record.collectId) return;
    await globalSearchApi.doDeleteCollectById({ collectId: record.collectId });
    SiriusMessage.success({
      content: '已取消订阅，系统将不再向您推送该公司动态',
    });
    resetSelectedData();
    refresh();
  };
  const doDelete = (ids: number[]) => {
    SiriusModal.warning({
      icon: <AlertErrorIcon />,
      title: '确定要删除吗？',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: {
        style: {
          background: '#4c6aff',
        },
      },
      onOk: async () => {
        await globalSearchApi.deleteImportCompany({ ids });
        SiriusMessage.success({ content: getIn18Text('SHANCHUCHENGGONG') });
        resetSelectedData();
        refresh();
        refreshStat();
      },
    });
  };
  const onClear = () => {
    SiriusModal.warning({
      icon: <AlertErrorIcon />,
      title: '确定要清除未匹配到海关数据的全部公司吗？',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: {
        style: {
          background: '#4c6aff',
        },
      },
      onOk: async () => {
        await globalSearchApi.clearUnmatchedImportCompany();
        SiriusMessage.success({ content: '清除成功' });
        resetSelectedData();
        refresh();
        refreshStat();
      },
    });
  };
  const handler = (behavior: string, record: ImportCompanyResItem) => {
    switch (behavior) {
      case ImportCompanyOpBehavior.unsubscribe:
        unsubscribeCompany(record);
        break;
      case ImportCompanyOpBehavior.subscribe:
        subscribeCompany([record]);
        break;
      case ImportCompanyOpBehavior.detail:
        handleViewCustomsDetail?.(record.customsCompanyType === 1 ? 'buysers' : 'supplier', record.customsCompanyName, record.customsCountry, record.originCompanyName);
        if (record.notViewed) {
          globalSearchApi.viewImportCompany(record.id).then(() => {
            refreshStat();
          });
        }
        break;
      case ImportCompanyOpBehavior.delete:
        doDelete([record.id]);
        break;
      case ImportCompanyOpBehavior.fission:
        showFissionRuleModal(
          {
            id: record.id,
            country: record.customsCountry,
            companyName: record.customsCompanyName,
            type: 'import',
          },
          refresh
        );
        break;
      case ImportCompanyOpBehavior.fissionDetail:
        onFissionDetail?.(record.fissionId);
        break;
      default:
        break;
    }
  };
  useImperativeHandle(ref, () => ({
    refresh,
  }));
  useEffect(() => {
    const r = batchAddSuccessMessage$.subscribe(event => {
      if (event?.eventData?.type === GrubProcessTypeEnum.fission) {
        refresh();
      }
    });
    return () => {
      r.unsubscribe();
    };
  }, []);
  return (
    <div className={style.container}>
      <div className={style.filter}>
        <div className={style.filterItem}>
          <div className={style.filterLabel}>公司名称/域名</div>
          <Input
            placeholder="请输入公司名称/域名，按回车确认"
            onBlur={onSearchKeyConfirm}
            className={style.filterInput}
            value={searchValue}
            onChange={onSearchKeyChange}
            onPressEnter={run}
          />
        </div>
        <div className={style.filterItem}>
          <div className={style.filterLabel}>导入时间</div>
          <RangePicker
            style={{ border: '1px solid #E1E3E8' }}
            separator=" - "
            allowClear
            placeholder={['开始时间', '结束时间']}
            value={dateRange}
            disabledDate={current => current && current > moment().endOf('day')}
            onChange={onRangeChange}
          />
        </div>
        <div className={style.filterItem}>
          <div className={style.filterLabel}>匹配状态</div>
          <EnhanceSelect style={{ width: '100px' }} defaultValue={MatchStatusEnumType.All as string} value={matchStatus} onChange={onMatchStatusChange}>
            {MatchStatusList.map(({ value, label }) => (
              <InSingleOption key={label} value={value}>
                {label}
              </InSingleOption>
            ))}
          </EnhanceSelect>
        </div>
        <div className={style.filterItem}>
          <Checkbox checked={notViewed} onChange={onNotViewedChange}>
            {getIn18Text('WEILIULAN')}
          </Checkbox>
        </div>
      </div>
      <div className={style.customsBody}>
        <PrivilegeCheck accessLabel="OP" resourceLabel="COMMERCIAL">
          <div className={style.tableOps}>
            <div className={style.totalText}>
              <span>
                共导入<span className={style.extraNum}>{pagination.total}</span>条数据
              </span>
              {Boolean(data?.customsMatchCompanyNum) && (matchStatus == null || matchStatus === MatchStatusEnumType.All) && (
                <span>
                  ，其中<span className={style.extraNum}>{data?.customsMatchCompanyNum}</span>家公司匹配到相应海关数据
                </span>
              )}
              {Boolean(selectedRowKeys.length) && <span>，已选{selectedRowKeys.length}家公司</span>}
              <Button btnType="default" className={style.opBtn} disabled={selectedRows.length === 0} onClick={() => subscribeCompany(selectedRows)}>
                订阅
              </Button>
              <Button btnType="default" className={style.opBtn} disabled={selectedRowKeys.length === 0} onClick={() => doDelete(selectedRowKeys)}>
                删除
              </Button>
              <Button btnType="default" className={style.opBtn} onClick={onClear}>
                清除无海关数据的公司
              </Button>
            </div>
            <Button className={style.opBtn} btnType="primary" onClick={setTrue}>
              导入
            </Button>
          </div>
        </PrivilegeCheck>
        <div ref={tableRef}>
          <SiriusTable
            rowKey="id"
            columns={getImportCompanyColumns({ handler })}
            scroll={{ x: 1134, y }}
            showSorterTooltip={false}
            rowClassName={(record: any, index: number) =>
              classNames(
                index % 2 === 1 ? 'odd' : 'even',
                {
                  [style.isOpacity]: record.status === MatchStatusEnumType.Unmatch,
                },
                style.rowContainer
              )
            }
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys,
              onChange: onSelectChange,
              preserveSelectedRowKeys: true,
            }}
            {...tableProps}
            locale={{
              emptyText() {
                return (
                  <Empty style={{ padding: '26px 0' }} imageStyle={{ height: 'auto' }} image={<ImportEmpty />} description={false}>
                    <div style={{ color: '#272E47', fontSize: '12px', lineHeight: '20px' }}>{getIn18Text('ZANWUSHUJU')}</div>
                    <Button style={{ margin: '12px auto 0', fontSize: '12px' }} btnType="minorLine" onClick={setTrue}>
                      导入公司
                    </Button>
                  </Empty>
                );
              },
            }}
          />
        </div>
      </div>
      <CompanyUploader visible={showUploadModal} onClose={setFalse} onSuccess={onUploadSuccess} />
    </div>
  );
});
export default ImportTable;
