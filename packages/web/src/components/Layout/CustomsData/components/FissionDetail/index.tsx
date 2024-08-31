/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useMemo, useState } from 'react';
import { Radio } from 'antd';
import classNames from 'classnames';
import { CollectLogItemTypeEnum, FissionCompanyItem, getIn18Text } from 'api';
import { openBatchCreateLeadsModal } from '@lxunit/app-l2c-crm';
// import { Checkbox } from '@web-common/components/UI/Checkbox';
import Checkbox from '@lingxi-common-component/sirius-ui/Checkbox';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { useAntdTable, useMemoizedFn, useRequest, useSet, useSetState } from 'ahooks';
import useTableHeight from '@/components/Layout/Customer/components/hooks/useTableHeight';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { ReactComponent as Reset } from '@/images/icons/globalSearch/reset.svg';
import { useLeadsAdd } from '@/components/Layout/globalSearch/hook/useLeadsAdd';
import { getFissionTableColumns } from './data';
import { globalSearchApi } from '../../../globalSearch/constants';
import style from './index.module.scss';
import { showRelationDiagramModal } from '../FissionDiagram';
import FissionOverview from '../FissionOverview/FissionOverview';
import NationFlag from '../NationalFlag';

interface Props {
  fissionId: number;
  handleViewCompanyDetail?: (esid: number | string, collectId?: string | number, type?: CollectLogItemTypeEnum, name?: string) => void;
  handleViewCustomsDetail?: (type: 'supplier' | 'buysers', name?: string, country?: string, originName?: string) => void;
}

type DataListItem = Array<{ label: string; value: string | number }>;

interface FilterState {
  excludeOrgClue?: boolean;
  excludeMyClue?: boolean;
  hasEmail?: boolean;
  excludeExpressCompany?: boolean;
  excludeViewed?: boolean;
}

const fetchFissionList =
  (fissionId: number, { excludeOrgClue, excludeExpressCompany, excludeMyClue, hasEmail, excludeViewed }: FilterState) =>
  async (params: { current: number; pageSize: number; sorter?: any }) => {
    const data = await globalSearchApi.listFissionCompany({
      fissionId,
      excludeOrgClue,
      excludeExpressCompany,
      excludeMyClue,
      excludeViewed,
      hasEmail,
      page: params.current - 1,
      size: params.pageSize,
    });
    return {
      list: data.data,
      total: data.total,
    };
  };

const getRuleTypeText = (type?: number | null) => {
  if (!type) return '-';
  return type === 2 ? '一级和二级' : '一级';
};

const getCoreCompanyFissionTarget = (country?: string) => (country === 'China' ? '供应商' : '采购商');

const getCoreCompanyFissionType = (country?: string) => (country === 'China' ? 'supplier' : 'buysers');

const getSelectedCompanyFissionTarget = (country?: string) => (country !== 'China' ? '供应商' : '采购商');

const getSelectedCompanyFissionType = (country?: string) => (country !== 'China' ? 'supplier' : 'buysers');

const getFissionTarget = (companyType?: number) => {
  if (!companyType) return '-';
  return companyType === 1 ? '采购商' : '供应商';
};

const FissionDetail: React.FC<Props> = ({ fissionId, handleViewCompanyDetail, handleViewCustomsDetail }) => {
  const [filterState, setFilterState] = useSetState<FilterState>({});
  const [visitedIds, { add }] = useSet<string>([]);
  const { excludeOrgClue, excludeExpressCompany, excludeMyClue, hasEmail, excludeViewed } = filterState;
  const { data: ruleData } = useRequest(() => globalSearchApi.queryFissionRule({ fissionId }), {
    refreshDeps: [fissionId],
  });
  const { tableProps, refresh } = useAntdTable(fetchFissionList(fissionId, filterState), {
    defaultParams: [{ current: 1, pageSize: 20 }],
    defaultPageSize: 20,
    refreshDeps: [fissionId, filterState],
  });
  const { tableRef, y } = useTableHeight([]);
  const [selectedRowKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<FissionCompanyItem[]>([]);
  const onSelectChange = (newSelectedRowKeys: React.Key[], newSelectedRows: any[]) => {
    setSelectedKeys(newSelectedRowKeys as string[]);
    setSelectedRows(newSelectedRows);
  };
  const [container, setContainer] = useState<'table' | 'tree'>('table');

  const textType = useMemo(() => (ruleData?.country === 'China' ? '采购' : '供应'), [ruleData?.country]);
  const handler = (behavior: string, record: FissionCompanyItem) => {
    if (behavior === 'relation') {
      showRelationDiagramModal(record.fissionId, record.id);
    }
    if (behavior === 'globalDetail') {
      if (!record.visited) {
        add(record.id);
      }
      handleViewCompanyDetail?.(record.id, undefined, CollectLogItemTypeEnum.GlobalSearch, record.name);
    }
    if (behavior === 'customsDetail') {
      const type = record.companyType === 1 ? 'buysers' : 'supplier';
      if (!record.visited) {
        add(record.id);
      }
      handleViewCustomsDetail?.(type, record.name, record.country, record.originName);
    }
  };
  const handleCompanyDetail = () => {
    handleViewCustomsDetail?.(getCoreCompanyFissionType(ruleData?.country), ruleData?.companyName, ruleData?.country);
  };
  const handleSelectedCompanyDetail = () => {
    const middleCustomsCompany = ruleData?.middleCustomsCompanyList?.[0];
    if (!middleCustomsCompany) return;
    handleViewCustomsDetail?.(getSelectedCompanyFissionType(ruleData?.country), middleCustomsCompany.companyName, middleCustomsCompany.country);
  };
  const resetFilter = () => {
    if (Object.values(filterState).every(item => !item)) return;
    setFilterState({
      excludeExpressCompany: undefined,
      excludeMyClue: undefined,
      excludeOrgClue: undefined,
      excludeViewed: undefined,
      hasEmail: undefined,
    });
  };
  const dataList = useMemo(
    () =>
      [
        { label: '国家地区', value: (ruleData?.countryCnList ?? []).join('，') },
        { label: '潜客类型', value: getFissionTarget(ruleData?.companyType) },
        { label: '潜客范围', value: getRuleTypeText(ruleData?.type) },
      ] as DataListItem,
    [ruleData]
  );
  const TotalExtraComp = useMemo(() => {
    if (!ruleData?.oneFissionNum && !ruleData?.twoFissionNum) return '';
    const prevExtra = ruleData?.oneFissionNum ? (
      <>
        ，其中<span className={style.extraNum}>{ruleData.oneFissionNum}</span>家一级潜客
      </>
    ) : (
      ''
    );
    const afterExtra = ruleData?.twoFissionNum ? (
      <>
        ，<span className={style.extraNum}>{ruleData.twoFissionNum}</span>家二级潜客
      </>
    ) : (
      ''
    );
    return (
      <span>
        {prevExtra}
        {afterExtra}
      </span>
    );
  }, [ruleData]);
  const validLeads = useMemo(() => selectedRows.filter(item => !item.referId), [selectedRows]);
  const onLeadsPost = useCallback(
    (extraParams: any) =>
      globalSearchApi.customsBatchAddLeadsV1({
        customsInfoVOList: selectedRows.map(item => ({
          name: item.name,
          originName: item.originName,
          country: item.country,
        })),
        sourceType: 1,
        ...extraParams,
      }),
    [selectedRows]
  );
  const { handleAddLeads, leadsAddLoading, noLeadsWarning } = useLeadsAdd({
    onFetch: onLeadsPost,
    refresh,
  });
  const doAddLeads = useMemoizedFn(() => {
    if (selectedRows.length <= 0) {
      noLeadsWarning();
      return;
    }
    openBatchCreateLeadsModal({
      submit: ({ groupIds, isAddToGroup }) =>
        handleAddLeads({
          extraFetchParams: { leadsGroupIdList: groupIds, isAddToGroup },
          selectedNum: selectedRows.length,
        }),
    });
  });
  const RadioCheck = useMemo(
    () => (
      <Radio.Group
        value={container}
        onChange={e => {
          setContainer(e.target.value);
        }}
      >
        <Radio.Button value="table">表格</Radio.Button>
        <Radio.Button value="tree">裂变树</Radio.Button>
      </Radio.Group>
    ),
    [container]
  );
  const selectCompany = useMemo(() => ruleData?.middleCustomsCompanyList?.[0], [ruleData]);
  return (
    <div className={style.container}>
      <div className={style.header}>
        <div className={style.companyGroup}>
          <div className={style.companyItem}>
            <EllipsisTooltip>
              <span>
                {getCoreCompanyFissionTarget(ruleData?.country)}（核心公司）：
                <span className={style.headerCompany} onClick={handleCompanyDetail}>
                  {ruleData?.companyName || '-'}
                </span>
              </span>
            </EllipsisTooltip>
            {ruleData?.country && <NationFlag style={{ display: 'inline-flex' }} showLabel={false} name={ruleData?.country} />}
          </div>
          <div className={style.companyItem}>
            <EllipsisTooltip>
              <span>
                {getSelectedCompanyFissionTarget(ruleData?.country)}：
                <span className={style.headerCompany} onClick={handleSelectedCompanyDetail}>
                  {selectCompany?.companyName || '-'}
                </span>
              </span>
            </EllipsisTooltip>
            {selectCompany?.country && <NationFlag style={{ display: 'inline-flex' }} showLabel={false} name={selectCompany.country} />}
          </div>
          {(ruleData?.midCompanyCountryList ?? []).length > 0 && <div className={style.companyItem}>{`(锁定${textType}地区)`}</div>}
        </div>
        <div className={style.info}>
          {dataList
            .filter(item => item.value)
            .map(cItem => (
              <div className={style.group} key={cItem.label}>
                <div className={style.label} style={{ flexShrink: 0 }}>
                  {cItem.label}：
                </div>
                <div className={style.labelValue}>{cItem.value}</div>
              </div>
            ))}
        </div>
      </div>
      <div className={style.body}>
        <div className={style.tableHeader}>
          <span>
            共裂变出<span className={style.extraNum}>{ruleData?.totalFissionNum || 0}</span>家公司{TotalExtraComp}
          </span>
          {RadioCheck}
        </div>
        {container === 'table' && (
          <>
            <div className={style.filter}>
              <div className={style.filterItem}>
                <Checkbox checked={excludeViewed} onChange={() => setFilterState({ excludeViewed: !excludeViewed || undefined })}>
                  {getIn18Text('WEILIULAN')}
                </Checkbox>
              </div>
              <div className={style.filterItem}>
                <Checkbox checked={hasEmail} onChange={() => setFilterState({ hasEmail: !hasEmail || undefined })}>
                  {getIn18Text('YOUYOUXIANGDIZHI')}
                </Checkbox>
              </div>
              <div className={style.filterItem}>
                <Checkbox checked={excludeExpressCompany} onChange={() => setFilterState({ excludeExpressCompany: !excludeExpressCompany || undefined })}>
                  {getIn18Text('FEIWULIUGONGSI')}
                </Checkbox>
              </div>
              <div className={style.filterItem}>
                <Checkbox checked={excludeMyClue} onChange={() => setFilterState({ excludeMyClue: !excludeMyClue || undefined })}>
                  非我的线索
                </Checkbox>
              </div>
              <div className={style.filterItem}>
                <Checkbox checked={excludeOrgClue} onChange={() => setFilterState({ excludeOrgClue: !excludeOrgClue || undefined })}>
                  非同事线索
                </Checkbox>
              </div>
              <div className={style.resetBtn} onClick={resetFilter}>
                {getIn18Text('ZHONGZHI')}
                <span className={style.resetIcon}>
                  <Reset />
                </span>
              </div>
            </div>
            <PrivilegeCheck accessLabel="OP" resourceLabel="COMMERCIAL">
              <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
                {Boolean(selectedRowKeys.length) && <div style={{ marginRight: 12 }}>已选{selectedRowKeys.length}家公司</div>}
                <Button btnType="primary" disabled={selectedRowKeys.length === 0} onClick={doAddLeads} loading={leadsAddLoading}>
                  {getIn18Text('LURUXIANSUO')}
                </Button>
              </div>
            </PrivilegeCheck>
            <div ref={tableRef}>
              <SiriusTable
                rowKey="id"
                columns={getFissionTableColumns({ handler, visitedIds })}
                rowClassName={(record: any, index: number) => classNames(index % 2 === 1 ? 'odd' : 'even')}
                scroll={{ x: 1134, y }}
                showSorterTooltip={false}
                rowSelection={{
                  type: 'checkbox',
                  selectedRowKeys,
                  onChange: onSelectChange,
                  preserveSelectedRowKeys: true,
                }}
                {...tableProps}
              />
            </div>
          </>
        )}
        {container === 'tree' && <FissionOverview fissionId={fissionId} container={container} />}
      </div>
    </div>
  );
};
export default FissionDetail;
