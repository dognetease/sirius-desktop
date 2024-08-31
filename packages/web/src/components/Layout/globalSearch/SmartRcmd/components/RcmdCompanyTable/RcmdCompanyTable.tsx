import {
  AddressBookApi,
  DataStoreApi,
  EdmSendBoxApi,
  GlobalSearchApi,
  GlobalSearchItem,
  GlobalSearchListContactItem,
  ICompanySubFallItem,
  InvalidEmailSimpleData,
  RequestBusinessaAddCompany,
  SmartRcmdItem,
  api,
  apis,
  getIn18Text,
  apiHolder,
  SystemApi,
  EdmSendConcatInfo,
  IsPageSwitchItem,
} from 'api';
import { openBatchCreateLeadsModal } from '@lxunit/app-l2c-crm';
import { useMemoizedFn } from 'ahooks';
import { Menu, Table, TableColumnsType, Tooltip, message, Skeleton } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import styles from './rcmdcompanytable.module.scss';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
import AiMarketingEnter from '@web-edm/components/AiMarketingEnter/aiMarketingEnter';
import Oprate from './Oprate';
import TableProductList from './TableProductList';
import RcmdTableCompanyName from './RcmdTableCompanyName';
import { CompanyDetail } from '../../../detail/CompanyDetail';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import ShowConfirm from '@/components/Layout/Customer/components/confirm/makeSureConfirm';
import useEdmSendCount, { IEdmEmailList } from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import { ValidEmailAddressModal } from '@web-edm/send/validEmailAddress';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import CheckCircleFilled from '@ant-design/icons/CheckCircleFilled';
import classNames from 'classnames';
import RcmdEmpty from './RcmdEmpty';
import { globalSearchDataTracker } from '../../../tracker';
import getPageRouterWithoutHash from '../../../hook/getPageRouterWithoutHash';
import { useLeadsAdd } from '../../../hook/useLeadsAdd';
import CollectData from '@/components/Layout/globalSearch/search/collectDataTrack/collectDataTrack';
import { MAX_SELECT_ROWS_LEN } from '../../../constants';
import { aiHostingTaskAdd, doEdmExposure, generateHandleFilterReceivers, getWmPageCurrUrl } from '../../../utils';
import { useMarketingLimit } from '../../../hook/useMarketingWrapper';
import { filterProps } from '../../SmartRcmd';
import AutoMarketingEnter from '@web-edm/components/AutoMarketingEnter/autoMarketingEnter';
import { AddContact } from '@web-edm/AIHosting/Receiver';

const edmApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const dataStoreApi = api.getDataStoreApi() as DataStoreApi;
const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
const RCMD_SEARCH_LIST = 'RCMD_SEARCH_LIST';
interface RcmdCompanyTableProps {
  selectedId?: number;
  filterParams?: filterProps;
  selectedItem?: SmartRcmdItem | null;
  setCollectDataList?: (value: ICompanySubFallItem, keyword?: string) => void;
  tableLoadingStatus?: (value: boolean) => void;
  setTableList?: (value: ICompanySubFallItem[]) => void;
}

const RcmdCompanyTable: React.FC<RcmdCompanyTableProps> = ({ selectedId, filterParams, selectedItem, setCollectDataList, tableLoadingStatus, setTableList }) => {
  const [list, setList] = useState<ICompanySubFallItem[]>([]);
  const [listLoading, setListLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<GlobalSearchItem[]>([]);
  const [detailState, setDetailState] = useState<{
    visible: boolean;
    id?: string;
    country?: string;
  }>({
    visible: false,
  });
  const [pageParams, setPageParams] = useState<{
    page: number;
    size: number;
  }>({
    page: 1,
    size: (dataStoreApi.getSync(RCMD_SEARCH_LIST).data as unknown as number) ?? 10,
  });

  const needCheckEmailList = React.useRef<{ contactName: string; contactEmail: string }[]>([]);
  const emailRef = React.useRef<{
    all: IEdmEmailList[];
    needCheck: IEdmEmailList[];
    id?: string | null;
  }>({
    all: [],
    needCheck: [],
    id: '',
  });
  const [receivers, setReceivers] = useState<Array<IEdmEmailList>>([]);
  const [draftId, setDraftId] = useState<string>('');
  const [showValidateEmailModal, setShowValidateEmailModal] = useState(false);
  const [sendType, setSendType] = useState<'filter' | 'normal'>('filter');
  const [emails, setEmails] = useState<IEdmEmailList[]>([]);
  const [noneInvalidMailsModal, setNoneInvalidMailsModal] = useState(false);
  const findIdInd = () => {
    return list.findIndex(item => item.id === detailState.id);
  };
  const handlePagTurn = (num: number) => {
    if ((num > 0 && findIdInd() === list.length - 1) || (num < 0 && !findIdInd())) return;
    if (num > 0) {
      setDetailState({ ...detailState, id: list[findIdInd() + 1]?.id });
    } else {
      setDetailState({ ...detailState, id: list[findIdInd() - 1]?.id });
    }
  };

  const [switchOption, setSwitchOption] = useState<IsPageSwitchItem>({
    hasLast: false,
    hasNext: false,
    onPagTurn: handlePagTurn,
  });
  const systemApi = apiHolder.api.getSystemApi() as SystemApi;
  let lang = systemApi.getSystemLang();
  const isLangZn = useMemo(() => lang === 'zh', [lang]);
  useEffect(() => {
    tableLoadingStatus && tableLoadingStatus(listLoading);
  }, [listLoading]);
  useEffect(() => {
    setSwitchOption({
      hasNext: findIdInd() < list.length - 1,
      hasLast: findIdInd() > 0,
      onPagTurn: handlePagTurn,
    });
    setList(prev =>
      prev.map(e => {
        if (e.id === detailState.id) {
          return {
            ...e,
            browsed: true,
          };
        }
        return e;
      })
    );
  }, [detailState.id]);
  useEdmSendCount(emails, sendType, 'global_search', draftId, 'smartrcmd', 'smartrcmd', getPageRouterWithoutHash());

  const handleRemove = async (item: ICompanySubFallItem, rank: number) => {
    globalSearchDataTracker.trackSmartRcmdListCompanyClick({
      rcmdType: 1,
      ruleId: selectedItem?.id,
      keyword: selectedItem?.value,
      buttonName: 'ignore',
      rank,
      id: item.id,
      companyCountry: item.country,
      companyName: item.name,
      companyId: item.companyId as string,
    });
    setSelectedRows(prev => prev.filter(row => row.id !== item.id));
    setSelectedRowKeys(prev => prev.filter(rowKey => rowKey !== item.id));
    await doGetListData();
  };

  const validateEmail = async () => {
    setReceivers(emailRef.current.all);
    const id = await edmApi.createDraft();
    setDraftId(id);
    setShowValidateEmailModal(true);
  };

  const directSendEmail = () => {
    setSendType('normal');
    setEmails(emailRef.current.all);
  };

  const Confirm = () => {
    ShowConfirm({
      title: (
        <div style={{ fontSize: '14px' }}>
          该企业下包含未经验证的邮箱地址，是否需要验证？<div style={{ fontWeight: 'normal', fontSize: '14px' }}>（不扣除邮箱验证次数）</div>
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

  const setSellEmails = (contactList: GlobalSearchListContactItem[], id: string | null, direct?: boolean) => {
    const emails = contactList.filter(each => each.contact && each.contact.length);
    const needCheckEmailList = emails.filter(item => !item.checkStatus);
    emailRef.current = {
      needCheck: needCheckEmailList.map(e => ({ contactName: '', contactEmail: e.contact || '' })),
      all: emails.map(e => ({ contactName: '', contactEmail: e.contact || '' })),
      id,
    };
    if (emailRef.current.needCheck.length > 0 && !direct) {
      ShowConfirm({
        title: (
          <div style={{ fontSize: '14px' }}>
            该企业下包含未经验证的邮箱地址，是否需要验证？<div style={{ fontWeight: 'normal', fontSize: '14px' }}>（不扣除邮箱验证次数）</div>
          </div>
        ),
        okText: '验证邮箱',
        cancelText: '直接发信',
        content: '向真实邮箱地址发信会提升您的获客成功率',
        type: 'primary',
        makeSure: async () => {
          setReceivers(
            emailRef.current.all.map(e => ({
              ...e,
              sourceName: '智能推荐',
              increaseSourceName: 'smartrcmd',
            }))
          );
          const id = await edmApi.createDraft();
          setDraftId(id);
          setShowValidateEmailModal(true);
        },
        onCancel: () => {
          setSendType('normal');
          setEmails(emailRef.current.all);
        },
      });
    } else {
      setSendType('normal');
      setEmails(emailRef.current.all);
    }
  };

  const marketing = async (direct?: boolean) => {
    let contactList: any = await handleGetContactById(selectedRowKeys);
    const emails = contactList
      .map((item: any) => {
        return {
          contactName: item.name ? item.name : '',
          contactEmail: item.contact ? item.contact : '',
          sourceName: '智能推荐',
          increaseSourceName: 'smartrcmd',
        };
      })
      .filter((item: any) => {
        return item.contactEmail;
      });
    // return
    needCheckEmailList.current = contactList
      .filter((item: any) => {
        return !item.checkStatus;
      })
      .map((item: any) => {
        return {
          contactName: item.name ? item.name : '',
          contactEmail: item.contact ? item.contact : '',
          sourceName: '智能推荐',
          increaseSourceName: 'smartrcmd',
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
      Confirm();
    } else if (emails.length > 0) {
      setSellEmails(contactList, null, direct);
    } else {
      message.warning({
        content: getIn18Text('SUOXUANSHUJUZANWUYOUXIANG'),
      });
    }
  };

  const tableColumns: TableColumnsType<ICompanySubFallItem> = [
    {
      title: '',
      width: '1px',
      render(value, record, index) {
        return (
          <CollectData
            onInterSection={() => {
              setCollectDataList && setCollectDataList(record, selectedItem?.value);
            }}
          />
        );
      },
    },
    {
      title: getIn18Text('GONGSIMINGCHENG'),
      width: '329px',
      dataIndex: 'name',
      render(_, record, index) {
        const rank = pageParams.size * (pageParams.page - 1) + (index + 1);
        return <RcmdTableCompanyName rank={rank} selectedItem={selectedItem} data={record} />;
      },
    },
    {
      title: getIn18Text('TUIJIANLIYOU'),
      dataIndex: 'recommendReason',
      width: '156px',
      render(_, record) {
        return (
          <>
            {record.recommendReasonHighLight || record.recommendReason ? (
              <Tooltip
                title={
                  <span
                    dangerouslySetInnerHTML={{
                      __html: record.recommendReasonHighLight || record.recommendReason || '-',
                    }}
                  ></span>
                }
              >
                <p
                  className={styles.overview}
                  dangerouslySetInnerHTML={{
                    __html: record.recommendReasonHighLight || record.recommendReason || '-',
                  }}
                ></p>
              </Tooltip>
            ) : (
              <p className={styles.overview}>-</p>
            )}
          </>
        );
      },
    },
    {
      title: getIn18Text('XIANGGUANXINXI'),
      render(_, record) {
        return (
          <div style={{ maxWidth: '560px' }}>
            {record.overviewDescriptionHighLight || record.overviewDescription ? (
              <Tooltip
                title={
                  <span
                    dangerouslySetInnerHTML={{
                      __html: record.overviewDescriptionHighLight || record.overviewDescription || '-',
                    }}
                  ></span>
                }
              >
                <p
                  className={styles.overview}
                  dangerouslySetInnerHTML={{
                    __html: record.overviewDescriptionHighLight || record.overviewDescription || '-',
                  }}
                ></p>
              </Tooltip>
            ) : (
              <p className={styles.overview}>-</p>
            )}
            {record.lastTransDate || record.transCount ? (
              <>
                <p className={styles.customData} hidden={!record.lastTransDate}>
                  {getIn18Text('ZUIHOUJINKOUSHIJIAN')}：{record.lastTransDate}
                </p>
                <p className={styles.customData} hidden={!record.transCount}>
                  近2年进口次数：{record.transCount}
                </p>
              </>
            ) : (
              <TableProductList item={record} />
            )}
          </div>
        );
      },
    },
    // {
    //   title: getIn18Text('CHANPIN'),
    //   width: '200px',
    //   render(_, record) {
    //     return <TableProductList item={record} />;
    //   },
    // },
    {
      title: getIn18Text('CAOZUO'),
      width: isLangZn ? '135px' : '180px',
      render(_, record, index) {
        const rank = pageParams.size * (pageParams.page - 1) + (index + 1);
        return <Oprate selectedItem={selectedItem} rank={rank} data={record} onRemove={handleRemove} refresh={doGetListData} />;
      },
    },
  ];

  const doGetListData = async () => {
    if (selectedId && pageParams) {
      setListLoading(true);
      globalSearchDataTracker.trackSmartRcmdList({
        ruleId: selectedId,
        keyword: selectedItem?.value,
      });
      try {
        const { content, totalElements } = await globalSearchApi.doGetSmartRcmdCompany({
          ...pageParams,
          page: pageParams.page - 1,
          id: selectedId,
          filterEdm: filterParams?.filterEdm,
          filterCustomer: filterParams?.filterCustomer,
        });
        console.warn({
          content,
          totalElements,
        });
        // 如果返回数据是空且页码不是第一页 自动往前翻页
        if (content.length === 0 && totalElements === 0 && pageParams.page > 1) {
          setPageParams({
            size: pageParams.size,
            page: pageParams.page - 1,
          });
        } else {
          content && setList(content);
          setTableList && setTableList(content);
          setTotal(totalElements);
          setListLoading(false);
        }
      } catch (error) {
        console.warn({
          error,
        });
      }
    }
  };

  const onChangeListItem = (id: string | number, extraData: any) => {
    setList(prev =>
      prev.map(it => {
        if (it.id === id) {
          return {
            ...it,
            ...extraData,
          };
        }
        return it;
      })
    );
  };
  const onLeadsPost = useMemoizedFn((extraParams?: any) =>
    globalSearchApi.globalBatchAddLeadsV1({
      globalInfoVOList: selectedRows.map(item => ({
        id: item.id,
      })),
      sourceType: 3,
      ...extraParams,
    })
  );

  const {
    handleAddLeads: hookHandleAddLeads,
    leadsAddLoading,
    noLeadsWarning,
  } = useLeadsAdd({
    onFetch: onLeadsPost,
    refresh: doGetListData,
  });

  const handleAddLeads = useMemoizedFn(() => {
    const validRowsLen = selectedRows.length;
    if (validRowsLen <= 0) {
      noLeadsWarning();
      return;
    }
    globalSearchDataTracker.trackSmartRcmdListBatchOprate({
      action: 'addLeads',
      count: selectedRowKeys.length,
      ruleId: selectedItem?.id,
      companyIdList: selectedRows.map(item => item.companyId),
    });
    openBatchCreateLeadsModal({
      submit: ({ groupIds, isAddToGroup }) =>
        hookHandleAddLeads({
          extraFetchParams: { leadsGroupIdList: groupIds, isAddToGroup },
          selectedNum: validRowsLen,
        }),
    });
  });

  const handleGetContactById = (list: string[]) => {
    return new Promise((reslove, reject) => {
      try {
        globalSearchApi
          .globalSearchGetContactById(list)
          .then(data => {
            let list: any = [];
            Object.values(data).forEach(item => {
              list = [...list, ...item];
            });
            reslove(list);
          })
          .catch(() => {
            reject('接口错误');
          });
      } catch (error) {
        reject(error);
      }
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
  useEffect(() => {
    doGetListData();
  }, [pageParams]);

  useEffect(() => {
    setPageParams({
      page: 1,
      size: (dataStoreApi.getSync(RCMD_SEARCH_LIST).data as unknown as number) ?? 10,
    });
    setSelectedRowKeys([]);
    setSelectedRows([]);
  }, [selectedId, filterParams]);
  const [limitLen] = useMarketingLimit();
  if (!listLoading && pageParams.page === 1 && list.length === 0) {
    return (
      <div className={classNames(styles.container, styles.containerEmpty)}>
        <RcmdEmpty />
      </div>
    );
  }
  return (
    <div className={styles.container}>
      <div className={styles.containerTopOperate}>
        <div className={styles.containerLeftOperate}>
          <PrivilegeCheck accessLabel="OP" resourceLabel="COMMERCIAL">
            <span hidden={selectedRowKeys.length > 0}>
              {getIn18Text('WEININZHAODAO')} <span style={{ color: '#4C6AFF' }}>{total}</span> {getIn18Text('GEJIEGUO')}
            </span>
            <span hidden={selectedRowKeys.length === 0} style={{ paddingRight: 20 }}>
              {getIn18Text('YIXUAN')}
              <span style={{ color: '#386EE7' }}>{selectedRowKeys.length}</span>
              {'家企业'}
            </span>
          </PrivilegeCheck>
          <div style={{ display: 'flex', marginLeft: 12 }}>
            <PrivilegeCheck accessLabel="OP" resourceLabel="COMMERCIAL">
              <div style={{ display: 'flex' }}>
                <AiMarketingEnter
                  btnType="primary"
                  text={getIn18Text('YIJIANYINGXIAO')}
                  needDisable={selectedRowKeys.length === 0}
                  handleType={selectedRowKeys.length > limitLen ? 'bigData' : 'assembly'}
                  from="smartrcmd"
                  ids={selectedRowKeys}
                  afterClickType={selectedRowKeys.length > limitLen ? 'async' : 'sync'}
                  afterClick={() => {
                    if (selectedRowKeys.length > limitLen) {
                      globalSearchDataTracker.trackSmartRcmdListBatchOprate({
                        action: 'aiHosting',
                        count: selectedRowKeys.length,
                      });
                    } else {
                      doEdmExposure(selectedRowKeys);
                      marketing(true);
                      globalSearchDataTracker.trackSmartRcmdListBatchOprate({
                        action: 'sendEdm',
                        count: selectedRowKeys.length,
                      });
                    }
                  }}
                  back={getWmPageCurrUrl()}
                  completeCallback={aiHostingTaskAdd(3)}
                />
                <Button btnType="minorLine" disabled={selectedRowKeys.length === 0} style={{ margin: '0 0 0 12px  ' }} onClick={handleAddLeads} loading={leadsAddLoading}>
                  {getIn18Text('LURUXIANSUO')}
                </Button>
              </div>
            </PrivilegeCheck>
          </div>
          <AutoMarketingEnter
            data={{
              product: selectedItem?.value ?? '',
              country: selectedItem?.country && Array.isArray(selectedItem.country) ? selectedItem.country.map(item => item).join(',') : '',
              recommendId: selectedItem?.extTaskId ?? '',
              // planId 服务端返回的新字段
              planId: selectedItem?.extPlanId ?? '',
              // ruleID 规则id
              ruleId: selectedItem?.id ?? 0,
              // 目标客户主营产品
              customerProducts: selectedItem?.customerProducts ?? '',
              from: 'smartrcmd',
              back: `#wmData?page=smartrcmd&ruleId=${selectedItem?.id}`,
              trackFrom: 'smart',
            }}
          />
        </div>
        <div className={styles.toolsPage}>
          {Number(total) > 0 && (
            <SiriusPagination
              // className={styles.pagination}
              onChange={(pg, pgsize) => {
                const newSize = pgsize ?? 10;
                dataStoreApi.putSync(RCMD_SEARCH_LIST, `${newSize}`, {
                  noneUserRelated: false,
                });
                setPageParams({
                  page: pg ?? 1,
                  size: newSize,
                });
              }}
              simple
              current={pageParams.page}
              pageSize={pageParams.size}
              defaultCurrent={1}
              total={total ?? 0}
            />
          )}
        </div>
      </div>
      <Table<ICompanySubFallItem>
        loading={listLoading}
        dataSource={list}
        rowKey="id"
        rowSelection={{
          type: 'checkbox',
          preserveSelectedRowKeys: true,
          onChange: (keys: any[], rows: any[]) => {
            if (keys.length > MAX_SELECT_ROWS_LEN) {
              message.warning({
                content: `仅可选择${MAX_SELECT_ROWS_LEN}条数据`,
              });
              return;
            }
            setSelectedRowKeys(keys);
            setSelectedRows(rows);
          },
          selectedRowKeys,
        }}
        onRow={(data, index) => {
          return {
            onClick: () => {
              globalSearchDataTracker.trackSmartRcmdListCompanyClick({
                rcmdType: 1,
                ruleId: selectedItem?.id,
                keyword: selectedItem?.value,
                buttonName: 'card',
                id: data.id,
                rank: pageParams.size * (pageParams.page - 1) + ((index ?? 0) + 1),
                companyCountry: data.country,
                companyName: data.name,
                companyId: data.companyId as string,
              });
              setDetailState({
                visible: true,
                id: data.id,
                country: data.domainCountry,
              });
              setList(prev => prev.map(it => (it.id === data.id ? { ...it, browsed: true } : it)));
            },
            className: data.browsed ? styles.rowBrowsed : undefined,
          };
        }}
        columns={tableColumns}
        locale={{
          emptyText: <RcmdEmpty />,
        }}
        tableLayout="fixed"
        pagination={false}
      />
      <SiriusPagination
        className={styles.pagination}
        onChange={(pg, pgsize) => {
          const newSize = pgsize ?? 10;
          dataStoreApi.putSync(RCMD_SEARCH_LIST, `${newSize}`, {
            noneUserRelated: false,
          });
          setPageParams({
            page: pg ?? 1,
            size: newSize,
          });
        }}
        {...{
          current: pageParams.page,
          pageSize: pageParams.size,
          showSizeChanger: true,
          showQuickJumper: true,
          total: total ?? 0,
          pageSizeOptions: [10, 20, 50] as unknown as string[],
        }}
      />
      <Drawer
        visible={detailState.visible}
        onClose={() => {
          setDetailState({
            visible: false,
          });
        }}
        width={872}
        zIndex={1031}
      >
        {detailState.visible && detailState.id ? (
          <CompanyDetail
            key={detailState.id}
            country={detailState.country}
            extraParams={{ ruleID: selectedItem?.id }}
            scene="smartrcmd"
            queryGoodsShipped={selectedItem?.value}
            showSubscribe
            origin={'global'}
            id={detailState.id}
            reloadToken={0}
            onChangeListItem={onChangeListItem}
            switchOption={switchOption}
          />
        ) : null}
      </Drawer>
      {showValidateEmailModal && draftId && (
        <AddContact
          directCheck
          visible={showValidateEmailModal}
          receivers={receivers as any}
          draftId={draftId}
          businessType={'global_search'}
          // onFilter={handleFilterAddress}
          onCancelFilterAndSend={directSendEmail}
          onSendAll={generateHandleFilterReceivers(
            emailRef.current.all,
            (newEmails, newType) => {
              setSendType(newType);
              setEmails(newEmails);
            },
            emailRef.current.id
          )}
          onClose={() => {
            setShowValidateEmailModal(false);
          }}
        />
      )}
    </div>
  );
};

export default RcmdCompanyTable;
