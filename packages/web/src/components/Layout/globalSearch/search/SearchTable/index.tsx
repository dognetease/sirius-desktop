import React, { useState, useMemo, useEffect } from 'react';
import classnames from 'classnames';
import _uniq from 'lodash/uniq';
import { TableColumnsType, PaginationProps, Tooltip } from 'antd';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { GlobalSearchItem, api, apis, GlobalSearchApi, GlobalSearchContomFairItem, EdmSendBoxApi, getIn18Text, PrevScene, EdmSendConcatInfo } from 'api';
import { useMemoizedFn } from 'ahooks';
import { TableProps } from 'antd/es/table';
import { openBatchCreateLeadsModal } from '@lxunit/app-l2c-crm';
import CheckCircleFilled from '@ant-design/icons/CheckCircleFilled';
import message from '@web-common/components/UI/Message/SiriusMessage';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
// import { EnhanceSelect as Select, InSingleOption as Option } from '@web-common/components/UI/Select';
import { EnhanceSelect as Select, InSingleOption as Option } from '@lingxi-common-component/sirius-ui/Select';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
import { ValidEmailAddressModal } from '@web-edm/send/validEmailAddress';
import AiMarketingEnter from '@web-edm/components/AiMarketingEnter/aiMarketingEnter';
import styles from './index.module.scss';
import { ITablePage } from '../search';
import useEdmSendCount, { IEdmEmailList } from '../../../Customer/components/hooks/useEdmSendCount';
import { globalSearchDataTracker, GlobalSearchTableEvent } from '../../tracker';
import CompanyName from './CompanyName';
import GrubContactButton from './GrubContactButton';
import ShowConfirm from '@/components/Layout/Customer/components/confirm/makeSureConfirm';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { useNoviceTask } from '@/components/Layout/TaskCenter/hooks/useNoviceTask';
import TableItem from '@/components/Layout/CustomsData/customs/docSearch/component/TableItem';
import { getWmPageCurrUrl, getSouceTypeFromSen, aiHostingTaskAdd, generateHandleFilterReceivers, getTSourceByScene, doEdmExposure } from '../../utils';
import { MAX_LIST_COUNT } from './constant';
import getPageRouterWithoutHash from '../../hook/getPageRouterWithoutHash';
import CollectData from '../collectDataTrack/collectDataTrack';
import { useMarketingLimit } from '../../hook/useMarketingWrapper';
import { useIsForwarder } from '@/components/Layout/CustomsData/customs/ForwarderSearch/useHooks/useIsForwarder';
import { getLimitNumRemain } from '@/components/Layout/CustomsData/customs/utils';
import { useLeadsAdd } from '../../hook/useLeadsAdd';
import { edmCustomsApi, MAX_SELECT_ROWS_LEN } from '../../constants';
import { showBatchAddLeadsTips } from '../../component/BatchAddLeadsTips';
import { AddContact } from '@web-edm/AIHosting/Receiver';

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
const edmApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export const formatTableData = (source: Array<GlobalSearchContomFairItem & { newEmails?: string[] }> = []) =>
  source.map(row => {
    let {
      contactList,
      name,
      domain,
      facebook,
      instagram,
      linkedin,
      twitter,
      youtube,
      overviewDescriptionHighLight,
      overviewDescription,
      recommendReason,
      recommendReasonHighLight,
      country,
      customerStatus,
      orgCustomerStatus,
      contactStatus,
      emailCount,
      socialCount,
      phoneCount,
      defaultEmail,
      defaultPhone,
      defaultEmailNew,
      defaultPhoneNew,
      contactCount,
      ...rest
    } = row;
    const { new: isNew, browsed } = row;
    // 转换null值
    contactList = contactList ?? [];
    country = country ?? '';
    name = name ?? '';
    domain = domain ?? '';
    facebook = facebook ?? '';
    instagram = instagram ?? '';
    linkedin = linkedin ?? '';
    twitter = twitter ?? '';
    youtube = youtube ?? '';
    overviewDescriptionHighLight = overviewDescriptionHighLight ?? '';
    overviewDescription = overviewDescription ?? '';
    recommendReason = recommendReason ?? '';
    recommendReasonHighLight = recommendReasonHighLight ?? '';
    emailCount = emailCount ?? 0;
    phoneCount = phoneCount ?? 0;
    socialCount = socialCount ?? 0;
    contactCount = contactCount ?? 0;

    const totalContactNum = emailCount + phoneCount + socialCount;
    let descHightLight;
    if (overviewDescriptionHighLight.length) {
      descHightLight = overviewDescriptionHighLight.match(/<em[^>]*>([\s\S]*?)<\/em>/g)?.map(item => item.replace(/<[^>]+>/gim, ''));
    } else {
      descHightLight = '';
    }
    const desc = overviewDescription;
    return {
      name,
      domain,
      facebook,
      instagram,
      linkedin,
      twitter,
      youtube,
      totalContactNum,
      emailCount,
      phoneCount,
      socialCount,
      desc,
      descHightLight,
      recommendReason,
      recommendReasonHighLight,
      // displayContact,
      contactList,
      isNew,
      browsed,
      country,
      customerStatus,
      orgCustomerStatus,
      contactStatus,
      contactCount,
      defaultEmail,
      defaultPhone,
      defaultEmailNew,
      defaultPhoneNew,
      ...rest,
    };
  });

type TTableColumnList = ReturnType<typeof formatTableData>;
export type TTableColumn = TTableColumnList[number];

const defaultPagination: PaginationProps = {
  current: 1,
  defaultPageSize: 10,
  showSizeChanger: true,
  pageSizeOptions: [10, 20, 50] as unknown as string[],
  showTotal: total => {
    if (total < MAX_LIST_COUNT) {
      return `${getIn18Text('GONG')}${total}${getIn18Text('TIAO')}`;
    }
    return `搜索结果较多，为您展示前${MAX_LIST_COUNT}条数据`;
  },
  showQuickJumper: true,
  total: 0,
  // hideOnSinglePage: true,
};

const rowKey = 'id';
const tableLayout = 'fixed';

interface GlobalSearchTableProps<T = TTableColumn> extends TableProps<T> {
  data: Array<GlobalSearchItem | GlobalSearchContomFairItem>;
  onTableChange: (page: ITablePage) => void;
  tableType: 'product' | 'domain' | 'company';
  page: {
    current: number;
    total: number;
    pageSize: number;
  };
  onGotoDetail: (id: string, form?: string) => void;
  query: string;
  onDeepSearch(id: string): void;
  descType?: 'normal' | 'cantonfair' | 'wca';
  renderHeaderFilter?(): React.ReactNode;
  // 是否显示订阅按钮
  showSubscribe?: boolean;
  onChangeSelect?: (value: string | undefined) => void;
  sortField?: string | undefined;
  scene?: PrevScene;
  enableMoreDataSelect?: boolean;
  searchedParams?: any;
  setCollectDataList?: (value: TTableColumn, keyword?: string) => void;
}

const options = [
  {
    value: 'default',
    label: getIn18Text('ZONGHEPAIXU'),
  },
  {
    value: 'companyUpdateTime',
    label: getIn18Text('QIYEXINXIGENGXINSHIJIANPAIXU'),
  },
];

export function GlobalSearchTable(props: GlobalSearchTableProps) {
  const {
    data,
    onTableChange,
    tableType,
    page,
    onGotoDetail,
    query,
    onDeepSearch,
    descType = 'normal',
    sortField,
    onChangeSelect,
    renderHeaderFilter,
    showSubscribe,
    scene = 'globalSearch',
    enableMoreDataSelect,
    searchedParams,
    setCollectDataList,
    ...rest
  } = props;

  const { commit, getPopoverByStep } = useNoviceTask({
    moduleType: 'GLOBAL_SEARCH',
    taskType: 'FIND_CUSTOMER',
  });

  const Popover2 = getPopoverByStep(2);

  const [emails, setEmails] = useState<IEdmEmailList[]>([]);
  const [receivers, setReceivers] = useState<Array<IEdmEmailList>>([]);
  const [draftId, setDraftId] = useState<string>('');
  const [showValidateEmailModal, setShowValidateEmailModal] = useState(false);
  const [sendType, setSendType] = useState<'filter' | 'normal'>('filter');
  const emailRef = React.useRef<{
    all: IEdmEmailList[];
    needCheck: IEdmEmailList[];
    id?: string | null;
  }>({
    all: [],
    needCheck: [],
    id: '',
  });
  const needCheckEmailList = React.useRef<{ contactName: string; contactEmail: string }[]>([]);

  const directSendMail = () => {
    setSendType('normal');
    setEmails(emailRef.current.all);
  };
  // 列表中的一键营销按钮
  const setSellEmails = (contactList: TTableColumn['contactList'], id: string | null, direct?: boolean) => {
    const emails = contactList.filter(each => each.contact && each.contact.length);
    const needCheckEmailList = emails.filter(item => !item.checkStatus);
    const extra = {
      sourceName: getSouceTypeFromSen(scene),
      increaseSourceName: scene,
    };
    emailRef.current = {
      needCheck: needCheckEmailList.map(e => ({ contactName: '', contactEmail: e.contact || '', ...extra })),
      all: emails.map(e => ({ contactName: '', contactEmail: e.contact || '', ...extra })),
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
              sourceName: getSouceTypeFromSen(scene),
              increaseSourceName: scene,
            }))
          );
          const id = await edmApi.createDraft();
          setDraftId(id);
          setShowValidateEmailModal(true);
        },
        onCancel: directSendMail,
      });
    } else {
      directSendMail();
    }
  };

  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<GlobalSearchItem[]>([]);

  const tableColumns: TableColumnsType<TTableColumn> = [
    {
      title: '',
      width: '8px',
      render(value, record, index) {
        return (
          <CollectData
            onInterSection={() => {
              // handleCollectData(record)
              setCollectDataList && setCollectDataList(record, query);
            }}
          />
        );
      },
    },
    {
      title: '',
      width: '95px',
      render(value, record, index) {
        const { id, contactCount, prevContactCount = contactCount, browsed } = record;
        const newContactLen = contactCount - prevContactCount;
        return (
          <>
            <div
              className={classnames(styles.tableColumn, styles.tableOverview)}
              style={{ opacity: browsed ? 0.6 : 1 }}
              onClick={() => {
                onGotoDetail(id, 'contact');
                globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.Null, query, {
                  page: page.current,
                  pageSize: defaultPagination.defaultPageSize as number,
                  index,
                });
              }}
            >
              <div className={styles.tableOverviewText}>{getIn18Text('LIANXIREN')}</div>
              <div className={styles.tableOverviewNum}>
                <span>{prevContactCount}</span>
                {newContactLen > 0 && <span style={{ color: '#FE5B4C' }}>{`+${newContactLen}`}</span>}
              </div>
            </div>
          </>
        );
      },
    },
    {
      title: getIn18Text('GONGSIMINGCHENG'),
      width: '240px',
      render(value, record, index) {
        const companyName = (
          <CompanyName
            scene={scene}
            showSubscribe={showSubscribe}
            trackParam={[query, { page: page.current, pageSize: defaultPagination.defaultPageSize as number, index }]}
            record={record}
            onGotoDetail={(...args) => {
              onGotoDetail(...args);
              commit(2);
            }}
          />
        );

        return index === 0 ? <Popover2>{companyName}</Popover2> : companyName;
      },
    },
    {
      title: descType === 'wca' ? '企业简介' : getIn18Text('XIANGGUANXINXI'),
      render(value, record, index) {
        const { desc, procurementCategorys = '', recommendReason, id, descHightLight, recommendReasonHighLight, browsed } = record;
        return (
          <>
            <div
              className={classnames(styles.tableColumn, styles.tableInfo)}
              onClick={() => {
                globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.Null, query, {
                  page: page.current,
                  pageSize: defaultPagination.defaultPageSize as number,
                  index,
                });
                onGotoDetail(id, 'contact');
              }}
            >
              <TableItem
                maxWidth={500}
                className={browsed}
                text={descType !== 'cantonfair' ? desc : procurementCategorys}
                translate
                highLightText={descType !== 'cantonfair' ? descHightLight : undefined}
                tooltip
              />
              {tableType === 'product' && (
                <Tooltip title={recommendReason}>
                  <div
                    className={classnames(styles.tableInfoReason, {
                      [styles.tableInfoBrowsed]: browsed,
                    })}
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                      __html: recommendReasonHighLight,
                    }}
                  />
                </Tooltip>
              )}
            </div>
          </>
        );
      },
    },
    {
      title: getIn18Text('LIANXIREN'),
      width: '250px',
      render(value, record, index) {
        const { emailCount, phoneCount, totalContactNum, id, browsed, socialCount, defaultEmail, defaultPhone, defaultEmailNew, defaultPhoneNew } = record;
        return (
          <>
            <div
              className={classnames(styles.tableColumn, styles.tableContact)}
              onClick={() => {
                globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.Null, query, {
                  page: page.current,
                  pageSize: defaultPagination.defaultPageSize as number,
                  index,
                });
                onGotoDetail(id, 'contact');
              }}
            >
              {!defaultEmail && !defaultPhone ? (
                '-'
              ) : (
                <div className={styles.tableContactFirst}>
                  <span
                    className={classnames(styles.tableContactFirstMail, styles.textOverflow, {
                      [styles.tableContactColor]: !!browsed,
                    })}
                  >
                    {/* eslint-disable-next-line no-nested-ternary */}
                    {!!defaultEmail ? defaultEmail : defaultPhone}
                  </span>
                  {(defaultEmailNew || defaultPhoneNew) && <span className={styles.tableContactFirstIcon}>NEW</span>}
                </div>
              )}
              <div
                className={styles.tableContactText}
                onClick={e => {
                  e.stopPropagation();
                  globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.ViewMoreContacts, query, {
                    page: page.current,
                    pageSize: defaultPagination.defaultPageSize as number,
                    index,
                  });
                  onGotoDetail(id, 'contact');
                }}
              >
                查看全部联系人信息
              </div>
              <div className={styles.tableContactDetail}>
                <span className={styles.tableContactDetailMail}>{emailCount}</span>
                <span className={styles.tableContactDetailPhone}>{phoneCount}</span>
                <span className={styles.tableContactDetailMedia}>{socialCount}</span>
              </div>
            </div>
          </>
        );
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      width: '130px',
      render(value, record, index) {
        const { contactCount, emailCount, id, prevContactCount = contactCount } = record;
        const newContactLen = contactCount - prevContactCount;
        return (
          <>
            <div className={classnames(styles.tableColumn, styles.tableOp)}>
              <div className={styles.tableOpContact} style={{ marginBottom: '12px' }}>
                <GrubContactButton record={record} grubCount={newContactLen} onGotoDetail={onGotoDetail} onDeepSearch={onDeepSearch} />
              </div>
              <div className={styles.tableOpSell}>
                <AiMarketingEnter
                  btnType="default"
                  text={getIn18Text('YIJIANYINGXIAO')}
                  needDisable={emailCount === 0}
                  handleType="assembly"
                  btnClass={styles.rowAiHostingBtn}
                  from={scene}
                  afterClickType="sync"
                  afterClick={() => {
                    globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.SendEmail, query, {
                      page: page.current,
                      pageSize: defaultPagination.defaultPageSize as number,
                      index,
                    });
                    handleGetContactById([id]).then((res: any) => {
                      setSellEmails(res, id);
                    });
                  }}
                  back={getWmPageCurrUrl()}
                />
              </div>
            </div>
          </>
        );
      },
    },
  ];

  useEdmSendCount(emails, sendType, 'global_search', draftId, 'globalSearch', scene, getPageRouterWithoutHash());

  const marketing = async (direct?: boolean) => {
    let contactList: any = await handleGetContactById(selectedRowKeys);
    // let contactList: TTableColumn['contactList'] = [];
    // debugger
    let emails;
    emails = contactList
      .map((item: any) => {
        return {
          contactName: item.name ? item.name : '',
          contactEmail: item.contact ? item.contact : '',
          sourceName: getSouceTypeFromSen(scene),
          increaseSourceName: scene,
        };
      })
      .filter((item: any) => {
        return item.contactEmail;
      });
    console.log(contactList, 'marketing', 22222);
    // return
    needCheckEmailList.current = contactList
      .filter((item: any) => {
        return !item.checkStatus;
      })
      .map((item: any) => {
        return {
          contactName: item.name ? item.name : '',
          contactEmail: item.contact ? item.contact : '',
          sourceName: getSouceTypeFromSen(scene),
          increaseSourceName: scene,
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
        content: typeof window !== 'undefined' ? window.getLocalLabel('SUOXUANSHUJUZANWUYOUXIANG') : '',
      });
    }
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
  const tableData = useMemo(() => formatTableData(data), [data]);

  const pagination = useMemo(
    () => ({
      ...defaultPagination,
      ...page,
    }),
    [page]
  );
  const [limitLen] = useMarketingLimit();
  const onLeadsPost = useMemoizedFn((extraParams?: any) =>
    globalSearchApi.globalBatchAddLeadsV1({
      ...extraParams,
      globalInfoVOList: selectedRows.map(item => ({
        id: item.id,
        ...(item.chineseCompanyId
          ? {
              chineseCompanyId: item.chineseCompanyId,
            }
          : {}),
      })),
      sourceType: getTSourceByScene(descType as PrevScene),
    })
  );
  const isForWarder = useIsForwarder();
  const refresh = useMemoizedFn(() => {
    onTableChange({
      current: pagination.current,
      total: pagination.total,
      pageSize: pagination.pageSize,
    });
  });
  const {
    handleAddLeads: hookHandleAddLeads,
    leadsAddLoading,
    noLeadsWarning,
  } = useLeadsAdd({
    onFetch: onLeadsPost,
    refresh,
  });
  const handleAddLeads = useMemoizedFn(async () => {
    const validRowsLen = selectedRows.length;
    const doAdd = () => {
      if (validRowsLen <= 0) {
        noLeadsWarning();
        return;
      }
      openBatchCreateLeadsModal({
        submit: ({ groupIds, isAddToGroup }) =>
          hookHandleAddLeads({
            extraFetchParams: { leadsGroupIdList: groupIds, isAddToGroup },
            selectedNum: validRowsLen,
          }),
      });
    };
    const canExcavatList = selectedRows.filter(item => !item.referId && item.excavateCnCompanyStatus === 0);
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
  const setSelectedData = useMemoizedFn((keys: string[], rows?: any[]) => {
    setSelectedRowKeys(keys);
    const newRows = rows == null ? keys.map(key => ({ id: key })) : rows;
    setSelectedRows(newRows);
  });
  const selectCurrPage = useMemoizedFn(() => {
    setSelectedData(
      tableData.map(item => item.id),
      tableData
    );
  });
  const selectMoreData = useMemoizedFn(() => {
    const apiBase = scene === 'contomFair' || scene === 'cantonfair' ? globalSearchApi.globalSearchCantonfairGetIdList : globalSearchApi.globalSearchGetIdList;
    apiBase
      .bind(globalSearchApi)(searchedParams as any)
      .then(res => {
        const newSelectedKeys = _uniq([...(res.idList ?? []), ...selectedRowKeys]);
        setSelectedData(newSelectedKeys.slice(0, MAX_SELECT_ROWS_LEN));
      });
  });
  return (
    <div className={styles.table}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <PrivilegeCheck accessLabel="OP" resourceLabel="COMMERCIAL">
          <span hidden={selectedRowKeys.length > 0}>
            {pagination.total < MAX_LIST_COUNT ? (
              <span style={{ marginRight: '8px' }}>
                {getIn18Text('WEININZHAODAO')} <span style={{ color: '#4C6AFF' }}>{pagination.total}</span> {getIn18Text('GESOUSUOJIEGUO')}
              </span>
            ) : (
              <span style={{ marginRight: '8px' }}>
                搜索结果较多，为您展示前<span style={{ color: '#4C6AFF' }}>{MAX_LIST_COUNT}</span>条数据
              </span>
            )}
          </span>
          <span hidden={selectedRowKeys.length === 0} style={{ paddingRight: 20 }}>
            {getIn18Text('YIXUAN')}
            <span style={{ color: '#386EE7' }}>{selectedRowKeys.length}</span>
            {'家企业'}
          </span>
        </PrivilegeCheck>
        <div style={{ display: 'flex' }}>
          {onChangeSelect && (
            <Select
              className={classnames(styles.tableSorter)}
              placeholder={getIn18Text('PAIXU')}
              value={sortField}
              allowClear={sortField === 'companyUpdateTime' ? true : false}
              dropdownMatchSelectWidth={false}
              onChange={nextField => {
                // setSortField(nextField)
                if (!nextField) {
                  onChangeSelect && onChangeSelect('default');
                } else {
                  onChangeSelect && onChangeSelect(nextField);
                }
              }}
            >
              {options.map(option => (
                <Option value={option.value}>{option.label}</Option>
              ))}
            </Select>
          )}
          <PrivilegeCheck accessLabel="OP" resourceLabel="COMMERCIAL">
            <div style={{ display: 'flex' }}>
              <AiMarketingEnter
                btnType="primary"
                text={getIn18Text('YIJIANYINGXIAO')}
                needDisable={selectedRowKeys.length === 0}
                handleType={selectedRowKeys.length > limitLen ? 'bigData' : 'assembly'}
                afterClickType={selectedRowKeys.length > limitLen ? 'async' : 'sync'}
                from="default"
                ids={selectedRowKeys}
                afterClick={() => {
                  if (selectedRowKeys.length > limitLen) {
                    globalSearchDataTracker.trackBatchOperation('aiHosting', selectedRowKeys.length);
                  } else {
                    globalSearchDataTracker.trackBatchOperation('sendEdm', selectedRowKeys.length);
                    doEdmExposure(selectedRowKeys);
                    marketing(true);
                  }
                }}
                back={getWmPageCurrUrl()}
                completeCallback={aiHostingTaskAdd(0)}
              />
              <Button disabled={selectedRowKeys.length === 0} btnType="minorLine" style={{ marginLeft: 12 }} onClick={handleAddLeads} loading={leadsAddLoading}>
                {getIn18Text('LURUXIANSUO')}
              </Button>
            </div>
          </PrivilegeCheck>
        </div>
        <div className={styles.headerPage}>
          {Number(pagination.total) > 0 && (
            <SiriusPagination
              pageSize={pagination.pageSize}
              current={pagination.current}
              onChange={(pg, pgsize) => {
                onTableChange({
                  current: pg ?? 1,
                  total: pagination.total,
                  pageSize: pgsize ?? 10,
                });
              }}
              simple
              defaultCurrent={1}
              total={pagination.total}
            />
          )}
        </div>
      </div>
      <SiriusTable
        rowKey={rowKey}
        rowSelection={{
          type: 'checkbox',
          hideSelectAll: !tableData.length,
          preserveSelectedRowKeys: true,
          selections: enableMoreDataSelect
            ? [
                {
                  key: 'currPage',
                  text: '全选此页',
                  onSelect: selectCurrPage,
                },
                {
                  key: 'allData',
                  text: '选择10000条数据',
                  onSelect: selectMoreData,
                },
              ]
            : undefined,
          onChange: (keys: any[], rows: any[]) => {
            if (keys.length > MAX_SELECT_ROWS_LEN) {
              message.warning({
                content: `仅可选择${MAX_SELECT_ROWS_LEN}条数据`,
              });
              return;
            }
            setSelectedData(keys, rows);
          },
          selectedRowKeys,
        }}
        columns={tableColumns}
        dataSource={tableData}
        tableLayout={tableLayout}
        pagination={false}
        {...rest}
      />
      <SiriusPagination
        className={styles.pagination}
        onChange={(pg, pgsize) => {
          onTableChange({
            current: pg ?? 1,
            total: pagination.total,
            pageSize: pgsize ?? 10,
          });
        }}
        {...pagination}
      />
      {showValidateEmailModal && draftId && (
        <AddContact
          directCheck
          visible={showValidateEmailModal}
          receivers={receivers}
          draftId={draftId}
          businessType={'global_search'}
          // onFilter={handleFilterAddress}
          onCancelFilterAndSend={directSendMail}
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
}
