import React, { useCallback, useEffect, useState, useContext, useMemo } from 'react';
import { PaginationProps } from 'antd';
import { ColumnsType } from 'antd/es/table';
import moment from 'moment';
import { get, uniqBy } from 'lodash';
import { useMemoizedFn } from 'ahooks';
import { openBatchCreateLeadsModal } from '@lxunit/app-l2c-crm';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import { ValidEmailAddressModal } from '@web-edm/send/validEmailAddress';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import CheckCircleFilled from '@ant-design/icons/CheckCircleFilled';
import { TableLocale, TableRowSelection } from 'antd/lib/table/interface';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
import {
  getIn18Text,
  apiHolder,
  apis,
  ForwarderRecordItem as tableListItem,
  EdmCustomsApi,
  GlobalSearchApi,
  api,
  EdmSendBoxApi,
  InvalidEmailSimpleData,
  CustomsRecord,
  EdmSendConcatInfo,
} from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import AiMarketingEnter from '@web-edm/components/AiMarketingEnter/aiMarketingEnter';
import classNames from 'classnames';
import { customsDataTracker, CustomsDetailViewAction } from '../../tracker/tracker';
import LevelDrawer from '../../components/levelDrawer/levelDrawer';
import CustomsDetail from '../customsDetail/customsDetail';
import { onDrawerClose, onDrawerOpen as onDrawerOpenLy } from '@/components/Layout/CustomsData/utils';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { WmBigDataPageLayoutContext } from '@/components/Layout/globalSearch/keywordsSubscribe/KeywordsProvider';
import useEdmSendCount, { IEdmEmailList } from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import useTableHeight from '@/components/Layout/Customer/components/hooks/useTableHeight';
import { useLeadsAdd } from '@/components/Layout/globalSearch/hook/useLeadsAdd';
import ShowConfirm from '@/components/Layout/Customer/components/confirm/makeSureConfirm';
import getPageRouterWithoutHash from '@/components/Layout/globalSearch/hook/getPageRouterWithoutHash';
import { getWmPageCurrUrl, aiHostingTaskAdd, generateHandleFilterReceivers, doEdmExposure } from '@/components/Layout/globalSearch/utils';
import { getLimitNumRemain } from '../utils';
import { showBatchAddLeadsTips } from '@/components/Layout/globalSearch/component/BatchAddLeadsTips';
import { useIsForwarder } from '../ForwarderSearch/useHooks/useIsForwarder';
import { MAX_SELECT_ROWS_LEN } from '@/components/Layout/globalSearch/constants';
import { useMarketingLimit } from '@/components/Layout/globalSearch/hook/useMarketingWrapper';
import TableItem from '../docSearch/component/TableItem';
import ListModal from '../customsDetail/components/blDialog/blModal';
import './scroll.scss';
import style from './table.module.scss';
import EmptyResult from '@/components/Layout/globalSearch/search/EmptyResult/EmptyResult';
import { AddContact } from '@web-edm/AIHosting/Receiver';

const SEARCH_LIST_PAGEBTN_RUSULT_ID = 'SEARCH_LIST_PAGEBTN_RUSULT';
const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
const edmApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

interface Props {
  tableList: CustomsRecord[];
  pagination: any;
  onChange: (pagination: PaginationProps, filter?: any, sorter?: any) => void;
  onDrawerOpen: (param: any, layer: number, origin?: string) => void;
  onChangeTable?: (param: CustomsRecord[]) => void;
  type: string;
  tableLoading?: boolean;
  searchType?: 'company' | 'goodsShipped' | 'hsCode' | 'forwarder' | 'port';
  query?: string;
  locale?: TableLocale;
  skeletonLoading?: boolean;
  realTotalCount?: number;
  excludeViewed?: boolean;
  setExcludeViewedObj?: (param: any) => void;
  onSamilPageChange?: () => void;
  excludeViewedObj?: {
    excludeViewedIndex: number;
    excludeViewedList: number[];
    startFrom: number;
  };
  sticky?: any;
  queryKey?: string[];
}

type ContactEmail = {
  contactName: string;
  contactEmail: string;
};

const ForwardTable: React.FC<Props> = ({
  tableList,
  pagination,
  onChange,
  onDrawerOpen,
  type,
  tableLoading,
  searchType,
  query,
  locale,
  skeletonLoading,
  realTotalCount,
  excludeViewed,
  sticky,
  queryKey,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<tableListItem[]>([]);
  const { tableRef, y } = useTableHeight([], tableList);
  const { detailRootDom } = useContext(WmBigDataPageLayoutContext);
  const needCheckEmailList = React.useRef<{ contactName: string; contactEmail: string }[]>([]);
  const emailRef = React.useRef<{
    all: ContactEmail[];
    needCheck: ContactEmail[];
    id?: string | null;
  }>({
    all: [],
    needCheck: [],
    id: '',
  });
  const [receivers, setReceivers] = useState<Array<ContactEmail>>([]);
  const [draftId, setDraftId] = useState<string>('');
  const [showValidateEmailModal, setShowValidateEmailModal] = useState(false);
  const [sendType, setSendType] = useState<'filter' | 'normal'>('filter');
  const [exporting, setExporting] = useState<boolean>(false);
  const [visible, setVisable] = useState<boolean>(false);
  const [recordId, setRecordId] = useState<string>('');
  const defaultPagination: PaginationProps = {
    current: 1,
    defaultPageSize: 20,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50] as any,
    showQuickJumper: true,
    showTotal: () => handleTotalText(),
    total: 0,
  };
  const seeDetail = ({ companyName, standardCountry, ...datas }: CustomsRecord) => {
    onDrawerOpen({ ...datas, to: type === 'suppliers' ? 'supplier' : type, companyName, country: standardCountry }, 0, 'forward');
  };
  const highLightHscode = useMemo(() => {
    if (queryKey && queryKey.length > 0) {
      const list = queryKey.filter(item => /^\d+$/g.test(item));
      return list;
    } else {
      return [];
    }
  }, [queryKey]);
  const colums: ColumnsType<CustomsRecord> = [
    {
      dataIndex: 'shpmtDate',
      title: getIn18Text('RIQI'),
      width: 117,
      render(value) {
        return <div className={style.dateWrapper}>{moment(value).format('YYYY-MM-DD')}</div>;
      },
    },
    {
      dataIndex: 'companyName',
      width: 152,
      title: type === 'buysers' ? getIn18Text('CAIGOUSHANG') : getIn18Text('GONGYINGSHANG'),
      render(value, record) {
        return (
          <TableItem
            onSearchCompany={() => {
              seeDetail(record);
            }}
            text={value}
            tag={record.country}
            // highLightText={requestedReq.queryCompany}
            copy
            tooltip
          />
        );
      },
    },
    {
      dataIndex: 'hsCode',
      title: 'HSCode',
      width: 132,
      render(value) {
        return <TableItem text={value} highLightText={highLightHscode} />;
      },
    },
    {
      dataIndex: 'goodsShpd',
      width: 212,
      title: getIn18Text('SHANGPINMIAOSHU'),
      render(value) {
        return <TableItem text={value || '-'} translate copy tooltip placement="top" minWidth={150} />;
      },
    },
    {
      title: '出发港',
      width: 142,
      dataIndex: 'portOfLadingStandardCn',
      render(value) {
        return <span className={style.company} dangerouslySetInnerHTML={{ __html: value || '-' }} />;
      },
    },
    {
      title: getIn18Text('MUDIGANG'),
      width: 142,
      dataIndex: 'portOfUnLadingStandardCn',
      render(value) {
        return <span className={style.company} dangerouslySetInnerHTML={{ __html: value || '-' }} />;
      },
    },
    {
      title: getIn18Text('SHULIANG'),
      width: 88,
      dataIndex: 'itemQuantity',
      render(value, record) {
        return <TableItem text={Number(value) === 0 ? null : `${value}${record.itemUnit ?? ''}`} noneText={getIn18Text('WEIGONGKAI')} />;
      },
    },
    {
      title: getIn18Text('JINE（MEIYUAN）'),
      width: 116,
      dataIndex: 'valueOfGoodsUSD',
      render(value) {
        return <TableItem text={Number(value) === 0 ? null : value} noneText={getIn18Text('WEIGONGKAI')} />;
      },
    },
    {
      title: '重量（公斤）',
      dataIndex: 'weightKg',
      width: 120,
    },
    {
      title: getIn18Text('CAOZUO'),
      fixed: 'right',
      width: 70,
      render(_, record) {
        return (
          <span
            style={{ color: '#4C6AFF', cursor: 'pointer' }}
            className={style.opBtn}
            onClick={() => {
              setRecordId(record.recordId ?? '');
              setVisable(true);
            }}
          >
            {getIn18Text('CHAKAN')}
          </span>
        );
      },
    },
  ];

  const [recData, setRecData] = useState<any>({
    visible: false,
    to: type === 'buysers' ? 'supplier' : 'buysers',
    zIndex: 0,
    content: {
      country: '',
      to: type === 'buysers' ? 'supplier' : 'buysers',
      companyName: '',
      tabOneValue: '',
      queryValue: '',
    },
  });

  const handleCustomsDetail = (content: any, zindex: number) => {
    const data = onDrawerOpenLy(recData, { ...content }, zindex);
    setRecData({ ...data });
  };

  const onCustomerDrawerClose = (index: number) => {
    const data = onDrawerClose(recData, index);
    setRecData({ ...data });
  };

  const rowSelection: TableRowSelection<tableListItem> = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange(rowKeys, rows) {
      if (rows.length > MAX_SELECT_ROWS_LEN) {
        Toast.warning({
          content: `仅可选择${MAX_SELECT_ROWS_LEN}条数据`,
        });
        return;
      }
      setSelectedRows(rows);
      setSelectedRowKeys(rowKeys as string[]);
    },
  };
  const [emailList, setEmailList] = useState<IEdmEmailList[]>([]);

  useEdmSendCount(emailList, sendType, undefined, draftId, 'customsData', 'customs', getPageRouterWithoutHash());

  const marketing = () => {
    const keyList = selectedRows.filter(item => item.excavatedCompanyInfo?.id).map(item => item.excavatedCompanyInfo.id);
    handleGetContactById(keyList)
      .then((res: any) => {
        let emails;
        emails = res.list
          .map((item: any) => {
            return {
              contactName: item.name ? item.name : '',
              contactEmail: item.contact ? item.contact : '',
              sourceName: getIn18Text('HAIGUANSHUJU'),
              increaseSourceName: 'customs',
            };
          })
          .filter((item: any) => {
            return item.contactEmail;
          });
        needCheckEmailList.current = res.list
          .filter((item: any) => {
            return !item.checkStatus;
          })
          .map((item: any) => {
            return {
              contactName: item.name ? item.name : '',
              contactEmail: item.contact ? item.contact : '',
            };
          })
          .filter((item: any) => {
            return item.contactEmail;
          });
        if (emails && emails?.length) {
          emailRef.current.all = emails;
        } else {
          emailRef.current.all = [];
        }
        if (needCheckEmailList.current.length) {
          Confirm(res.length);
        } else {
          emails.length > 0 ? setEmailList(emails) : setEmailList([{ contactEmail: 'noEmials', contactName: '' }]);
        }
      })
      .catch(() => {
        setEmailList([{ contactEmail: 'noEmials', contactName: '' }]);
      });
  };

  const Confirm = (length?: number) => {
    ShowConfirm({
      title: (
        <div style={{ fontSize: '14px' }}>
          共{selectedRowKeys.length}条单据，对应 {length ?? 0} 家企业
          <div style={{ fontWeight: 'normal', fontSize: '14px' }}>其中包含未经验证的邮箱地址，是否需要验证？（不扣除邮箱验证次数）</div>
        </div>
      ),
      okText: '验证邮箱',
      cancelText: '直接发信',
      content: '向真实邮箱地址发信会提升您的获客成功率',
      type: 'primary',
      makeSure: validateEmail,
      onCancel: directSendEmail,
    });
  };

  const validateEmail = async () => {
    setReceivers(emailRef.current.all);
    const id = await edmApi.createDraft();
    setDraftId(id);
    setShowValidateEmailModal(true);
  };

  const directSendEmail = () => {
    setSendType('normal');
    setEmailList(emailRef.current.all.map(e => ({ ...e })));
  };

  const handleGetContactById = (list: string[]) => {
    return new Promise((reslove, reject) => {
      try {
        globalSearchApi
          .globalSearchGetContactById(list)
          .then(data => {
            let list: any = [];
            console.log(list, '22222xxxxsxsxsxs');
            Object.values(data).forEach(item => {
              list = [...list, ...item];
            });
            reslove({
              list,
              length: Object.keys(data).length,
            });
          })
          .catch(() => {
            reject('接口错误');
          });
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleExport = (contacts: InvalidEmailSimpleData[]) => {
    setExporting(true);
    const invalidContactList = contacts.map(item => {
      return {
        contactEmail: item.contactEmail,
        reason: item.reason,
      };
    });
    edmApi
      .exportValidFailedContactsV2({ invalidContactList })
      .then(data => {
        window.location.href = data.download_url;
      })
      .finally(() => {
        setExporting(false);
      });
  };
  const checkCallback = () => {
    if (emailRef.current.id) {
      let emailCheckResult: { key: string; value: string[] }[] = [];
      let validEmails = emailRef.current.all.map(item => item.contactEmail);
      emailCheckResult.push({
        key: 'valid',
        value: validEmails,
      });
      globalSearchApi.globalEmailCheckCallback({
        id: emailRef.current.id,
        emailCheckResult,
      });
    }
  };
  const handleTotalText = () => {
    if (excludeViewed) {
      return <span>以下仅展示未浏览的数据</span>;
    } else {
      return (
        <span>
          {getIn18Text('WEININZHAODAO')} <span style={{ color: '#4C6AFF' }}>{realTotalCount || pagination.total}</span> {getIn18Text('GEJIEGUO')}
        </span>
      );
    }
  };
  const uniqSelectRows = useMemo(() => uniqBy(selectedRows, row => get(row, 'excavatedCompanyInfo.id')), [selectedRows]);
  const onLeadsPost = useMemoizedFn((extraParams?: any) =>
    globalSearchApi.customsBatchAddLeadsV1({
      customsInfoVOList: selectedRows.map(item => ({
        name: item.companyName,
        originName: item.originCompanyName,
        country: item.country,
        ...(item.chineseCompanyId
          ? {
              chineseCompanyId: item.chineseCompanyId,
            }
          : {}),
      })),
      sourceType: 1,
      ...extraParams,
    })
  );
  const isForWarder = useIsForwarder();
  const aiHostingIds = useMemo(() => selectedRows.filter(item => item.excavatedCompanyInfo?.id).map(item => item.excavatedCompanyInfo.id), [selectedRows]);
  const {
    handleAddLeads: hookHandleAddLeads,
    leadsAddLoading,
    noLeadsWarning,
  } = useLeadsAdd({
    onFetch: onLeadsPost,
  });
  const handleAddLeads = useMemoizedFn(async () => {
    const doAdd = () => {
      if (selectedRows.length <= 0) {
        noLeadsWarning();
        return;
      }
      openBatchCreateLeadsModal({
        submit: ({ groupIds, isAddToGroup }) =>
          hookHandleAddLeads({
            extraFetchParams: { leadsGroupIdList: groupIds, isAddToGroup },
            selectedNum: selectedRows.length,
          }),
      });
    };
    const canExcavatList = selectedRows.filter(item => item.excavateCnCompanyStatus === 0);
    if (isForWarder && canExcavatList.length) {
      const res = await edmCustomsApi.doGetUserQuota();
      if (getLimitNumRemain(res) < canExcavatList.length) {
        showBatchAddLeadsTips({
          userQuota: res,
          onOk: doAdd,
          selectedRows,
        });
        return;
      }
    }
    doAdd();
  });

  const batchOneKeyMarketing = useCallback(() => {
    doEdmExposure(aiHostingIds);
    marketing();
    if (searchType === 'forwarder') {
      customsDataTracker.trackForwarderBatchOpList(CustomsDetailViewAction.SendEdm, aiHostingIds.length);
    } else {
      customsDataTracker.trackCustomBatchOpList(CustomsDetailViewAction.SendEdm, aiHostingIds.length);
    }
  }, [aiHostingIds, marketing, searchType]);

  const [limitLen] = useMarketingLimit();

  useEffect(() => {
    // 表格数据被外层清空之后，清空选择项
    if (tableList.length) return;
    setSelectedRowKeys([]);
    setSelectedRows([]);
  }, [tableList]);

  return (
    <div ref={tableRef} className={style.customsTableBox}>
      {showValidateEmailModal && draftId && (
        <AddContact
          directCheck
          visible={showValidateEmailModal}
          receivers={receivers}
          exporting={exporting}
          onExport={handleExport}
          draftId={draftId}
          businessType={'global_search'}
          // onFilter={handleFilterAddress}
          onCancelFilterAndSend={directSendEmail}
          onSendAll={generateHandleFilterReceivers(
            emailRef.current.all,
            (newEmails, newType) => {
              setSendType(newType);
              setEmailList(newEmails);
            },
            emailRef.current.id
          )}
          onClose={() => {
            setShowValidateEmailModal(false);
          }}
        />
      )}
      <PrivilegeCheck accessLabel="OP" resourceLabel="COMMERCIAL">
        <div
          className={classNames(style.tableHeaderOp, {
            [style.isSticky]: Boolean(sticky),
          })}
        >
          {selectedRowKeys.length > 0 && (
            <span>
              {getIn18Text('YIXUAN')}
              <span style={{ color: '#386EE7' }}>{selectedRowKeys.length}</span>
              {getIn18Text('GESHUJU')}
            </span>
          )}
          <div hidden={selectedRowKeys.length !== 0 || skeletonLoading}>{handleTotalText()}</div>
          <HollowOutGuide
            guideId={SEARCH_LIST_PAGEBTN_RUSULT_ID}
            title="快速锁定商机"
            intro="将搜索结果「录入线索」或「一键营销」，助力高效转化"
            placement="topLeft"
            padding={[8, 10, 8, 10]}
            step={1}
          >
            <div className={style.tools}>
              <AiMarketingEnter
                needDisable={aiHostingIds.length === 0}
                btnType="primary"
                text={getIn18Text('YIJIANYINGXIAO')}
                handleType={aiHostingIds.length > limitLen ? 'bigData' : 'assembly'}
                afterClickType={aiHostingIds.length > limitLen ? 'async' : 'sync'}
                from="default"
                ids={aiHostingIds}
                afterClick={aiHostingIds.length > limitLen ? undefined : batchOneKeyMarketing}
                back={getWmPageCurrUrl()}
                completeCallback={aiHostingTaskAdd(1)}
              />
              <Button
                disabled={selectedRowKeys.length === 0}
                btnType="minorLine"
                style={{ marginLeft: 12 }}
                onClick={() => {
                  if (searchType === 'forwarder') {
                    customsDataTracker.trackForwarderBatchOpList(CustomsDetailViewAction.AddLeads, selectedRowKeys.length);
                  } else {
                    customsDataTracker.trackCustomBatchOpList(CustomsDetailViewAction.AddLeads, selectedRowKeys.length);
                  }
                  handleAddLeads();
                }}
                loading={leadsAddLoading}
              >
                {getIn18Text('LURUXIANSUO')}
              </Button>
            </div>
          </HollowOutGuide>
          {!excludeViewed && (
            <HollowOutGuide
              guideId={SEARCH_LIST_PAGEBTN_RUSULT_ID}
              title="支持跨页选择"
              intro="勾选本页数据后，可快速翻到下一页选择更多数据。"
              placement="left"
              padding={[8, 10, 8, 10]}
              step={2}
            >
              <div className={style.toolsPage}>
                {Number(pagination.total) > 0 && (
                  <SiriusPagination
                    onChange={(nPage, nPageSize) => {
                      onChange({
                        pageSize: nPageSize,
                        current: nPage,
                      });
                    }}
                    simple
                    pageSize={pagination.pageSize}
                    current={pagination.from}
                    defaultCurrent={1}
                    total={pagination.total}
                  />
                )}
              </div>
            </HollowOutGuide>
          )}
        </div>
      </PrivilegeCheck>
      <SiriusTable
        sticky={sticky}
        className="edm-table-customs customs-scroll"
        rowKey="recordId"
        rowSelection={rowSelection}
        columns={colums}
        onChange={(tableGagination: PaginationProps, filter: any, sorter: any) => {
          setSelectedRows([]);
          setSelectedRowKeys([]);
          onChange(tableGagination, filter, sorter);
        }}
        scroll={{ x: 1134 + (searchType === 'forwarder' ? 190 : 0) }}
        dataSource={tableList}
        pagination={false}
        loading={tableLoading}
        locale={{
          emptyText: () => <EmptyResult query={undefined} defaultDesc={'暂无数据'} />,
        }}
      />
      <SiriusPagination
        className={style.pagination}
        onChange={(nPage, nPageSize) => {
          onChange({
            pageSize: nPageSize,
            current: nPage,
          });
        }}
        {...{
          ...defaultPagination,
          ...pagination,
          current: pagination.from,
        }}
      />
      <LevelDrawer recData={recData} onClose={onCustomerDrawerClose} onOpen={handleCustomsDetail} getContainer={detailRootDom || undefined} type={searchType}>
        <CustomsDetail />
      </LevelDrawer>
      <ListModal visible={visible} onCancel={() => setVisable(false)} recordId={recordId} />
    </div>
  );
};

export default ForwardTable;
