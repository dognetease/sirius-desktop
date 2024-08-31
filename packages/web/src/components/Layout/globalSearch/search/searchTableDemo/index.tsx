import React, { useState, useMemo, useEffect, useCallback, MouseEvent } from 'react';
import classnames from 'classnames';
import _uniq from 'lodash/uniq';
import { Table, Tooltip, TableColumnsType, PaginationProps, Menu, Divider } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import {
  GlobalSearchItem,
  api,
  apis,
  GlobalSearchApi,
  GlobalSearchContomFairItem,
  EdmSendBoxApi,
  InvalidEmailSimpleData,
  PrevScene,
  getIn18Text,
  GloablSearchParams,
  EdmSendConcatInfo,
} from 'api';
import { TableProps } from 'antd/es/table';
import CheckCircleFilled from '@ant-design/icons/CheckCircleFilled';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { openBatchCreateLeadsModal } from '@lxunit/app-l2c-crm';
import { useMemoizedFn } from 'ahooks';
import styles from '../SearchTable/index.module.scss';
import { ITablePage } from '../search';
import useEdmSendCount, { IEdmEmailList } from '../../../Customer/components/hooks/useEdmSendCount';
import { globalSearchDataTracker, GlobalSearchTableEvent } from '../../tracker';
import DomainName from './DomainName';
import GrubContactButton from '../SearchTable/GrubContactButton';
import ShowConfirm from '@/components/Layout/Customer/components/confirm/makeSureConfirm';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { ValidEmailAddressModal } from '@web-edm/send/validEmailAddress';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { useNoviceTask } from '@/components/Layout/TaskCenter/hooks/useNoviceTask';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
import AiMarketingEnter from '@web-edm/components/AiMarketingEnter/aiMarketingEnter';
import TableItem from '@/components/Layout/CustomsData/customs/docSearch/component/TableItem';
// import { EnhanceSelect as Select, InSingleOption as Option } from '@web-common/components/UI/Select';
import { EnhanceSelect as Select, InSingleOption as Option } from '@lingxi-common-component/sirius-ui/Select';
import { getWmPageCurrUrl, getSouceTypeFromSen, aiHostingTaskAdd, generateHandleFilterReceivers, doEdmExposure } from '../../utils';
const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
const edmApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
import { SubscribeCompanyModal } from '../SubscribeCompanyModal';
import getPageRouterWithoutHash from '../../hook/getPageRouterWithoutHash';
import { useLeadsAdd } from '../../hook/useLeadsAdd';
import CollectData from '../collectDataTrack/collectDataTrack';
import { MAX_SELECT_ROWS_LEN, edmCustomsApi } from '../../constants';
import { getLimitNumRemain } from '@/components/Layout/CustomsData/customs/utils';
import { showBatchAddLeadsTips } from '../../component/BatchAddLeadsTips';
import { useIsForwarder } from '@/components/Layout/CustomsData/customs/ForwarderSearch/useHooks/useIsForwarder';
import { SearchResultTip } from '../../component/SearchResultTip';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
import { useMarketingLimit } from '../../hook/useMarketingWrapper';
import { AddContactModal } from '@web-edm/send/ReceiverSettingDrawer/addContact';
import { AddContact } from '@web-edm/AIHosting/Receiver';

const SEARCH_LIST_PAGEBTN_RUSULT_ID = 'SEARCH_LIST_PAGEBTN_RUSULT';

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
      recommendReasonV1,
      recommendReasonHighLightV1,
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
    recommendReasonV1 = recommendReasonV1 ?? '';
    recommendReasonHighLightV1 = recommendReasonHighLightV1 ?? '';
    emailCount = emailCount ?? 0;
    phoneCount = phoneCount ?? 0;
    socialCount = socialCount ?? 0;
    contactCount = contactCount ?? 0;

    let totalContactNum = emailCount + phoneCount + socialCount;
    // let emailContactNum = 0;
    // let phoneContactNum = 0;
    // let onlyMediaNum = 0
    // contactList.forEach(each => {
    //   const { contact, phone } = each;
    //   if (contact?.length) {
    //     emailContactNum += 1;
    //   }
    //   if (phone?.length) {
    //     phoneContactNum += 1;
    //   }
    //   if (each.facebookUrl || each.linkedinUrl || each.twitterUrl) {
    //     onlyMediaNum += 1
    //   }
    // });

    // const descHightLight = overviewDescriptionHighLight.length ? overviewDescriptionHighLight : overviewDescription;
    let descHightLight;
    if (overviewDescriptionHighLight.length) {
      descHightLight = overviewDescriptionHighLight.match(/<em[^>]*>([\s\S]*?)<\/em>/g)?.map(item => {
        return item.replace(/<[^>]+>/gim, '');
      });
    } else {
      descHightLight = '';
    }
    const desc = overviewDescription;
    // const displayContactList = contactList.filter(({ contact = '', phone = '' }) => contact?.length || phone?.length);
    // const displayContact = displayContactList.length ? displayContactList[0] : null;

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
      overviewDescriptionHighLight,
      recommendReason,
      recommendReasonHighLight,
      recommendReasonV1,
      recommendReasonHighLightV1,
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
interface MergeCompanyType {
  id: number;
  companyName: string;
  country: string;
}

const handleHighLight = (text: string, highText?: string) => {
  try {
    let str = '';
    if (text && highText && text.indexOf(highText)) {
      text.indexOf(highText) >= 8
        ? (str =
            '..' +
            text.slice(text.indexOf(highText) - 8, text.indexOf(highText)) +
            text.slice(text.indexOf(highText), text.indexOf(highText) + highText.length + 1) +
            text.slice(text.indexOf(highText) + highText.length + 1))
        : str;
    }
    return str ? str : text;
  } catch (error) {
    return text;
  }
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
  onGotoDetail: (id: string, form?: string, recommendShowName?: string) => void;
  query: string;
  onDeepSearch(id: string): void;
  descType?: 'normal' | 'cantonfair';
  // 是否显示订阅按钮
  showSubscribe?: boolean;
  onChangeSelect?: (value: string | undefined) => void;
  sortField?: string | undefined;
  scene?: PrevScene;
  realTotalCount?: number;
  setCollectDataList?: (value: TTableColumn, keyword?: string) => void;
  checkedRcmdList?: string[];
  hideSearchResultTips?: boolean;
  sticky?: any;
  enableMoreDataSelect?: boolean;
  searchedParams?: Partial<GloablSearchParams>;
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

export function GlobalSearchTableDefault(props: GlobalSearchTableProps) {
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
    showSubscribe,
    scene = 'globalSearch',
    realTotalCount,
    setCollectDataList,
    checkedRcmdList,
    hideSearchResultTips,
    sticky,
    enableMoreDataSelect,
    searchedParams,
    ...rest
  } = props;
  const defaultPagination: PaginationProps = {
    current: 1,
    defaultPageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50, 100] as unknown as string[],
    showTotal: () => handleTotalText(),
    showQuickJumper: true,
    total: 0,
    // hideOnSinglePage: true,
  };

  const { commit, getPopoverByStep, handling } = useNoviceTask({
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
  const [subscribeCompanyVisibl, setSubscribeCompanyVisibl] = useState<boolean>(false);
  const [mainId, setMainId] = useState<string>('');

  const initMergeCompanylist: any[] | (() => any[]) = [];

  const [mergeCompanylist, setMergeCompanylist] = useState(initMergeCompanylist);

  const directSendMail = () => {
    setSendType('normal');
    setEmails(emailRef.current.all);
  };
  // 列表中的一键营销按钮
  const setSellEmails = (contactList: TTableColumn['contactList'], id: string | null, direct?: boolean) => {
    const emails = contactList.filter(each => each.contact && each.contact.length);
    const needCheckEmailList = emails.filter(item => !item.checkStatus);
    emailRef.current = {
      needCheck: needCheckEmailList.map(e => ({ contactName: e.name, contactEmail: e.contact || '', sourceName: getSouceTypeFromSen(scene), increaseSourceName: scene })),
      all: emails.map(e => ({ contactName: e.name, contactEmail: e.contact || '', sourceName: getSouceTypeFromSen(scene), increaseSourceName: scene })),
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
          setReceivers(emailRef.current.all);
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
  const setSelectedData = useMemoizedFn((keys: string[], rows?: any[]) => {
    setSelectedRowKeys(keys);
    const newRows = rows == null ? keys.map(key => ({ id: key })) : rows;
    setSelectedRows(newRows);
  });
  const handleSubscribeCompanyVisibl = (bl: boolean, arr: any[], id: string) => {
    setMergeCompanylist(arr);
    setSubscribeCompanyVisibl(bl);
    setMainId(id);
  };

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
      title: getIn18Text('GONGSIXINXI'),
      width: '348px',
      render(value, record, index) {
        const { mergeCompanys } = record;
        const domainName = (
          <DomainName
            showSubscribe={showSubscribe}
            trackParam={[query, { page: page.current, pageSize: defaultPagination.defaultPageSize as number, index }]}
            record={record}
            onGotoDetail={(...args) => {
              onGotoDetail(...args);
              commit(2);
            }}
            scene={scene}
            query={query}
            tableType={tableType}
            handleSubscribeCompanyVisibl={handleSubscribeCompanyVisibl}
          />
        );

        return index === 0 ? <Popover2>{domainName}</Popover2> : domainName;
      },
    },
    {
      title: getIn18Text('LIANXIREN'),
      width: '190px',
      render(value, record, index) {
        const {
          emailCount,
          phoneCount,
          totalContactNum,
          id,
          browsed,
          socialCount,
          defaultEmail,
          defaultPhone,
          defaultEmailNew,
          defaultPhoneNew,
          contactCount,
          prevContactCount = contactCount,
        } = record;
        const newContactLen = contactCount - prevContactCount;
        return (
          <>
            <div
              className={classnames(styles.tableColumn, styles.tableContact, { [styles.isOpacity]: browsed })}
              onClick={() => {
                if (scene === 'br') {
                  globalSearchDataTracker.trackBrDetail(GlobalSearchTableEvent.Null, query, {
                    page: page.current,
                    pageSize: defaultPagination.defaultPageSize as number,
                    index,
                  });
                } else {
                  globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.Null, query, {
                    page: page.current,
                    pageSize: defaultPagination.defaultPageSize as number,
                    index,
                  });
                }
                onGotoDetail(id, 'contact');
              }}
            >
              <div className={classnames(styles.tableColumnNum, styles.tableColumnDemo)}>
                {prevContactCount} <span>{getIn18Text('REN')}</span> {newContactLen > 0 && <span style={{ color: '#FE5B4C' }}>{`+${newContactLen}`}</span>}
              </div>
              <div className={classnames(styles.tableContactDetail, styles.tableContactSoic)} style={{ background: 'none', marginTop: 0 }}>
                <span className={styles.tableContactDetailEmail}>{emailCount}</span>
                <span className={styles.tableContactDetailPhone}>{phoneCount}</span>
                <span className={styles.tableContactDetailMedia}>{socialCount}</span>
              </div>
            </div>
          </>
        );
      },
    },
    {
      title: getIn18Text('XIANGGUANXINXI'),
      render(value, record, index) {
        const {
          desc,
          mergeCompanys,
          highLight,
          productCategoryList,
          procurementCategorys = '',
          country,
          procurementCategorysHighLight = '',
          overviewDescriptionHighLight = '',
          recommendReason,
          id,
          descHightLight,
          recommendReasonHighLight,
          browsed,
          name,
          recommendReasonV1,
          recommendReasonHighLightV1,
        } = record;
        const displayName = highLight?.type === 'name' && highLight?.value ? highLight.value : name;
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
                className={browsed}
                maxWidth={580}
                text={descType === 'normal' ? handleHighLight(desc, (descHightLight && descHightLight[0]) || '') : handleHighLight(procurementCategorys)}
                translate
                highLightText={descType === 'normal' ? descHightLight : procurementCategorysHighLight}
                tooltip
                placement={'top'}
                toolTipText={descType === 'normal' ? desc : procurementCategorys}
                toolTipTextHeight={descType === 'normal' ? overviewDescriptionHighLight : procurementCategorysHighLight}
              />
              {tableType === 'product' && (
                <Tooltip
                  title={recommendReasonV1?.split('<br/>')?.map((item, index) => (
                    <span key={index}>{item}</span>
                  ))}
                >
                  <div
                    className={classnames(styles.tableInfoReason, {
                      [styles.tableInfoBrowsed]: browsed,
                    })}
                    dangerouslySetInnerHTML={{
                      __html: recommendReasonHighLightV1,
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
      title: typeof window !== 'undefined' ? window.getLocalLabel('CAOZUO') : '',
      width: '130px',
      render(value, record, index) {
        const { contactCount, emailCount, id, prevContactCount = contactCount } = record;
        const newContactLen = contactCount - prevContactCount;
        return (
          <>
            <div className={classnames(styles.tableColumn, styles.tableOp)}>
              <div className={styles.tableOpSell}>
                <AiMarketingEnter
                  btnType="default"
                  text={getIn18Text('YIJIANYINGXIAO')}
                  needDisable={emailCount === 0}
                  handleType="assembly"
                  btnClass={styles.rowAiHostingBtn}
                  from="default"
                  afterClickType="sync"
                  afterClick={() => {
                    if (scene === 'br') {
                      globalSearchDataTracker.trackBrDetail(GlobalSearchTableEvent.SendEmail, query, {
                        page: page.current,
                        pageSize: defaultPagination.defaultPageSize as number,
                        index,
                      });
                    } else {
                      globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.SendEmail, query, {
                        page: page.current,
                        pageSize: defaultPagination.defaultPageSize as number,
                        index,
                      });
                    }
                    handleGetContactById([id]).then((res: any) => {
                      setSellEmails(res, id);
                    });
                  }}
                  back={getWmPageCurrUrl()}
                />
              </div>
              <div className={styles.tableOpContact}>
                <GrubContactButton from={'global'} record={record} grubCount={newContactLen} onGotoDetail={onGotoDetail} onDeepSearch={onDeepSearch} />
              </div>
            </div>
          </>
        );
      },
    },
  ];

  useEdmSendCount(emails, sendType, 'global_search', draftId, 'globalSearch', 'globalSearch', getPageRouterWithoutHash());

  const marketing = async (direct?: boolean) => {
    let contactList: any = await handleGetContactById(selectedRowKeys);

    const emails = contactList
      .map((item: any) => ({
        contactName: item.name ? item.name : '',
        contactEmail: item.contact ? item.contact : '',
        sourceName: getSouceTypeFromSen(scene),
        increaseSourceName: scene,
      }))
      .filter((item: any) => item.contactEmail);
    // return
    needCheckEmailList.current = contactList
      .filter((item: any) => !item.checkStatus)
      .map((item: any) => ({
        contactName: item.name ? item.name : '',
        contactEmail: item.contact ? item.contact : '',
        sourceName: getSouceTypeFromSen(scene),
        increaseSourceName: scene,
      }))
      .filter((item: any) => item.contactEmail);

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

  const handleGetContactById = useCallback(
    (list: string[]) =>
      new Promise((reslove, reject) => {
        try {
          globalSearchApi
            .globalSearchGetContactById(list)
            .then(contactData => {
              reslove(Object.values(contactData).reduce((prev, curr) => [...prev, ...curr], []));
            })
            .catch(() => {
              reject('接口错误');
            });
        } catch (error) {
          reject(error);
        }
      }),
    []
  );

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

  const pagination = {
    ...defaultPagination,
    ...page,
  };
  const handleTotalText = (showSearchResTips?: boolean) => {
    if (tableData.length) {
      //realTotalCount 参数有值证明搜索数据真实数量大于限制的10000条
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {getIn18Text('WEININZHAODAO')}
          {showSearchResTips ? (
            <SearchResultTip searchResultNum={realTotalCount || page.total || 0} checkAiKeywords={Boolean(checkedRcmdList?.length)} query={query} />
          ) : (
            <span style={{ color: '#4C6AFF' }}>{realTotalCount || page.total || 0}</span>
          )}

          {getIn18Text('GEJIEGUO')}
        </span>
      );
    }
    return null;
  };

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
      // 24为一带一路专题
      sourceType: scene === 'br' ? 24 : 0,
    })
  );
  const [limitLen] = useMarketingLimit();
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
    if (!(selectedRowKeys.length > 0)) {
      message.error('请选择公司');
      return;
    }
    globalSearchDataTracker.trackBatchOperation('addLeads', selectedRowKeys.length);
    const doAdd = () => {
      openBatchCreateLeadsModal({
        submit: ({ groupIds, isAddToGroup }) =>
          hookHandleAddLeads({
            extraFetchParams: { leadsGroupIdList: groupIds, isAddToGroup },
            selectedNum: selectedRowKeys.length,
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
  const doAiHostingTrack = useMemoizedFn(() => {
    globalSearchDataTracker.trackBatchOperation('aiHosting', selectedRowKeys.length);
  });
  const batchOneKeyMarketing = useCallback(() => {
    if (selectedRowKeys.length > limitLen) return;
    if (!(selectedRowKeys.length > 0)) {
      message.error('请选择公司');
      return;
    }
    globalSearchDataTracker.trackBatchOperation('sendEdm', selectedRowKeys.length);
    doEdmExposure(selectedRowKeys);
    marketing(true);
  }, [marketing, selectedRowKeys, limitLen]);
  const selectCurrPage = useMemoizedFn(() => {
    if (!searchedParams) return;
    setSelectedData(
      tableData.map(item => item.id),
      tableData
    );
  });
  const selectMoreData = useMemoizedFn(() => {
    if (!searchedParams) return;
    const apiBase = scene === 'br' ? globalSearchApi.globalSearchBrGetIdList : globalSearchApi.globalSearchGetIdList;
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
        className={classnames(styles.tableHeaderOp, {
          [styles.isSticky]: Boolean(sticky),
        })}
      >
        <PrivilegeCheck accessLabel="OP" resourceLabel="COMMERCIAL">
          <span hidden={selectedRowKeys.length > 0}>{handleTotalText(tableType === 'product' && !hideSearchResultTips)}</span>
          <span hidden={selectedRowKeys.length === 0} style={{ paddingRight: 20 }}>
            {getIn18Text('YIXUAN')}
            <span style={{ color: '#386EE7' }}>{selectedRowKeys.length}</span>
            {'家企业'}
          </span>
        </PrivilegeCheck>
        <div className={styles.tools}>
          {handling && (
            <PrivilegeCheck accessLabel="OP" resourceLabel="COMMERCIAL">
              <div style={{ display: 'flex' }}>
                <AiMarketingEnter
                  btnType="primary"
                  text={getIn18Text('YIJIANYINGXIAO')}
                  handleType={selectedRowKeys.length > limitLen ? 'bigData' : 'assembly'}
                  from={scene}
                  ids={selectedRowKeys}
                  afterClickType={selectedRowKeys.length > limitLen ? 'async' : 'sync'}
                  afterClick={selectedRowKeys.length > limitLen ? doAiHostingTrack : batchOneKeyMarketing}
                  back={getWmPageCurrUrl()}
                  completeCallback={aiHostingTaskAdd(scene === 'br' ? 24 : 0)}
                />
                <Button btnType="minorLine" style={{ marginLeft: 12 }} onClick={handleAddLeads} loading={leadsAddLoading}>
                  {getIn18Text('LURUXIANSUO')}
                </Button>
              </div>
            </PrivilegeCheck>
          )}
          {!handling && (
            <HollowOutGuide
              guideId={SEARCH_LIST_PAGEBTN_RUSULT_ID}
              title="快速锁定商机"
              intro="将搜索结果「录入线索」或「一键营销」，助力高效转化"
              placement="topLeft"
              padding={[16, 12, 8, 10]}
              step={1}
            >
              <PrivilegeCheck accessLabel="OP" resourceLabel="COMMERCIAL">
                <div style={{ display: 'flex' }}>
                  <AiMarketingEnter
                    btnType="primary"
                    text={getIn18Text('YIJIANYINGXIAO')}
                    handleType={selectedRowKeys.length > limitLen ? 'bigData' : 'assembly'}
                    from={scene}
                    ids={selectedRowKeys}
                    afterClickType={selectedRowKeys.length > limitLen ? 'async' : 'sync'}
                    afterClick={selectedRowKeys.length > limitLen ? undefined : batchOneKeyMarketing}
                    back={getWmPageCurrUrl()}
                    completeCallback={aiHostingTaskAdd(scene === 'br' ? 24 : 0)}
                  />
                  <Button btnType="minorLine" style={{ marginLeft: 12 }} onClick={handleAddLeads} loading={leadsAddLoading}>
                    {getIn18Text('LURUXIANSUO')}
                  </Button>
                </div>
              </PrivilegeCheck>
            </HollowOutGuide>
          )}
          <Divider type="vertical" style={{ height: '24px' }} />
          {onChangeSelect && (
            <Select
              className={classnames(styles.tableSorter)}
              placeholder={getIn18Text('PAIXU')}
              value={sortField}
              allowClear={sortField === 'companyUpdateTime'}
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
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          )}
        </div>
        <HollowOutGuide
          guideId={SEARCH_LIST_PAGEBTN_RUSULT_ID}
          title="支持跨页选择"
          intro="勾选本页数据后，可快速翻到下一页选择更多数据。"
          placement="left"
          padding={[8, 10, 8, 10]}
          step={2}
        >
          <div className={styles.toolsPage}>
            {Number(pagination.total) > 0 && (
              <SiriusPagination
                // className={styles.pagination}
                onChange={(pg, pgsize) => {
                  onTableChange({
                    current: pg ?? 1,
                    total: pagination.total,
                    pageSize: pgsize ?? 10,
                  });
                }}
                simple
                current={page.current}
                pageSize={pagination.pageSize}
                defaultCurrent={1}
                total={pagination.total}
              />
            )}
          </div>
        </HollowOutGuide>
      </div>
      <HollowOutGuide
        guideId={SEARCH_LIST_PAGEBTN_RUSULT_ID}
        title="一次性添加更多数据"
        intro="支持快速选择10000条数据，高效转化"
        placement="topLeft"
        padding={[0, 0, 0, 0]}
        targetHeight={54}
        step={3}
      >
        <SiriusTable
          rowKey={rowKey}
          sticky={sticky}
          rowSelection={
            {
              type: 'checkbox',
              hideSelectAll: !tableData.length,
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
              preserveSelectedRowKeys: true,
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
            } as any
          }
          columns={tableColumns}
          className={styles.tableDemo}
          dataSource={tableData}
          tableLayout={tableLayout}
          pagination={false}
          {...rest}
        />
      </HollowOutGuide>

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
      <SubscribeCompanyModal
        visible={subscribeCompanyVisibl}
        companyList={mergeCompanylist}
        setVisible={bl => {
          bl && refresh();
          setSubscribeCompanyVisibl(false);
        }}
        setMergeCompanylist={setMergeCompanylist}
        mainId={mainId}
      />
    </div>
  );
}
