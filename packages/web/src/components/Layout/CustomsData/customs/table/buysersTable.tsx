import React, { useCallback, useEffect, useState, useRef, useContext, useMemo, MouseEvent } from 'react';
import { Divider, Dropdown, Menu, Tooltip, PaginationProps, Table, Skeleton, Pagination, Select } from 'antd';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import { useMemoizedFn } from 'ahooks';
import { openBatchCreateLeadsModal } from '@lxunit/app-l2c-crm';
import {
  apiHolder,
  apis,
  ForwarderRecordItem as tableListItem,
  EdmCustomsApi,
  ListModalType,
  GlobalSearchApi,
  api,
  EdmSendBoxApi,
  InvalidEmailSimpleData,
  UserQuotaItem,
  PrevScene,
  EdmSendConcatInfo,
} from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import AiMarketingEnter from '@web-edm/components/AiMarketingEnter/aiMarketingEnter';
import classNames from 'classnames';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import style from './table.module.scss';
import ListModal from '../listModal/listModal';
import { customsDataTracker, CustomsDataTableListClick, CustomsDetailViewAction } from '../../tracker/tracker';
import Translate from '../../components/Translate/translate';
import LevelDrawer from '../../components/levelDrawer/levelDrawer';
import CustomsDetail from '../customsDetail/customsDetail';
import { onDrawerClose, onDrawerOpen as onDrawerOpenLy } from '@/components/Layout/CustomsData/utils';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { WmBigDataPageLayoutContext } from '@/components/Layout/globalSearch/keywordsSubscribe/KeywordsProvider';
import useEdmSendCount, { IEdmEmailList } from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import useTableHeight from '@/components/Layout/Customer/components/hooks/useTableHeight';
import { ReactComponent as Help } from '@/images/icons/customs/help.svg';
import './scroll.scss';
import { TableLocale, TableRowSelection } from 'antd/lib/table/interface';
import { renderDataTagList } from '@/components/Layout/utils';
import { getTransText } from '@/components/util/translate';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
import { useLeadsAdd } from '@/components/Layout/globalSearch/hook/useLeadsAdd';
const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
const edmApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
import ShowConfirm from '@/components/Layout/Customer/components/confirm/makeSureConfirm';
import { ValidEmailAddressModal } from '@web-edm/send/validEmailAddress';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import CheckCircleFilled from '@ant-design/icons/CheckCircleFilled';
import { getIn18Text } from 'api';
import getPageRouterWithoutHash from '@/components/Layout/globalSearch/hook/getPageRouterWithoutHash';
import IconCard from '@web-common/components/UI/IconCard/index';
import { smailPageText } from '../search/constant';
import {
  getWmPageCurrUrl,
  getCustomerAndLeadsTagInList,
  aiHostingTaskAdd,
  doValidEmailsConfirm,
  generateHandleFilterReceivers,
  doEdmExposure,
} from '@/components/Layout/globalSearch/utils';
import CustomerTag from '@/components/Layout/globalSearch/component/CustomerTag';
import CollectData from '@/components/Layout/globalSearch/search/collectDataTrack/collectDataTrack';
// import Tag from '@web-common/components/UI/Tag';
import ZnCompanyDetail from '../customsDetail/components/znCompanyDetail';
import { getLimitNumRemain } from '../utils';
import { showBatchAddLeadsTips } from '@/components/Layout/globalSearch/component/BatchAddLeadsTips';
import { useIsForwarder } from '../ForwarderSearch/useHooks/useIsForwarder';
import { MAX_SELECT_ROWS_LEN } from '@/components/Layout/globalSearch/constants';
import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
import { useMarketingLimit } from '@/components/Layout/globalSearch/hook/useMarketingWrapper';
import PeersName from '@/components/Layout/SearchPeers/components/peersName';
import { ForwardComponent, CustomsComponent } from './component';
import { AddContact } from '@web-edm/AIHosting/Receiver';

const { Option } = Select;
const SEARCH_LIST_PAGEBTN_RUSULT_ID = 'SEARCH_LIST_PAGEBTN_RUSULT';
export type SearchPropType = 'company' | 'goodsShipped' | 'hsCode' | 'forwarder' | 'port' | 'peers';

interface Props {
  tableList: tableListItem[];
  pagination: any;
  onChange: (pagination: PaginationProps, filter?: any, sorter?: any) => void;
  onDrawerOpen: (param: any, layer: number, origin?: string) => void;
  sortOrderParam: { sortBy: string; order: string };
  onChangeTable: (param: tableListItem[]) => void;
  type: string;
  isMorePage?: boolean;
  tableLoading?: boolean;
  searchType?: SearchPropType;
  query?: string;
  locale?: TableLocale;
  skeletonLoading?: boolean;
  realTotalCount?: number;
  excludeViewed?: boolean;
  hasEmail?: boolean;
  setExcludeViewedObj?: (param: any) => void;
  onSamilPageChange?: () => void;
  excludeViewedObj?: {
    excludeViewedIndex: number;
    excludeViewedList: number[];
    startFrom: number;
  };
  refresh: () => void | Promise<void>;
  setCollectDataList?: (value: tableListItem, keyword?: string) => void;
  sticky?: any;
  scence?: PrevScene;
  hideSubBtn?: boolean;
}

const content = '当搜索HScode/产品时，返回关联HScode/产品的交易数据的最新交易时间';
type ContactEmail = {
  contactName: string;
  contactEmail: string;
};

const BuysersTable: React.FC<Props> = ({
  tableList,
  pagination,
  onChange,
  onDrawerOpen,
  onChangeTable,
  type,
  sortOrderParam,
  tableLoading,
  searchType,
  query,
  locale,
  skeletonLoading,
  realTotalCount,
  excludeViewed,
  hasEmail,
  excludeViewedObj,
  setExcludeViewedObj,
  onSamilPageChange,
  refresh,
  setCollectDataList,
  sticky,
  scence,
  hideSubBtn,
}) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<tableListItem[]>([]);
  const { tableRef, y } = useTableHeight([], tableList);
  const [curForwarderComState, setCurForwarderComState] = useState<{
    id: string;
    companyName: string;
  } | null>(null);
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
  const title = useRef<HTMLDivElement>(null);
  const [emailList, setEmailList] = useState<IEdmEmailList[]>([]);

  const seeList = ({ companyName, country }: tableListItem) => {
    setCompanyName(companyName);
    setCountry(country);
    setVisible(true);
    if (searchType === 'forwarder') {
      customsDataTracker.trackForwarderTableListClick(CustomsDataTableListClick.View);
    } else {
      customsDataTracker.trackTableListClick(CustomsDataTableListClick.View);
    }
  };
  const defaultPagination: PaginationProps = {
    current: 1,
    defaultPageSize: 20,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50] as any,
    showQuickJumper: true,
    showTotal: total => {
      return handleTotalText();
    },
    total: 0,
  };

  const changStarMark = (id: string | number, collectId: string | number | undefined | null) => {
    const currentTable = [...tableList].map(item => {
      if (item.id === id) {
        item.collectId = collectId;
      }
      return item;
    });
    onChangeTable(currentTable);
  };
  const seeDetail = ({ companyName, country, visited, originCompanyName, ...datas }: tableListItem) => {
    if (searchType === 'forwarder') {
      customsDataTracker.trackForwarderTableListClick(CustomsDataTableListClick.Company);
    } else {
      customsDataTracker.trackTableListClick(CustomsDataTableListClick.Company);
    }
    onDrawerOpen({ ...datas, to: type === 'suppliers' ? 'supplier' : type, companyName, country, visited, originCompanyName }, 0, 'forward');
  };
  const renderStatus = (record: tableListItem) => {
    const { hasContact, referId, customerLabelType, canExcavate, hasExcavated, contactStatus = '', originCompanyName, country } = record;
    const customerTagContent = getCustomerAndLeadsTagInList({ referId, customerLabelType });
    return (
      <>
        {renderDataTagList([
          {
            content: hasContact ? getTransText('LIANXIREN') : '',
          },
          {
            content: customerTagContent ? <CustomerTag tagProps={customerTagContent} companyName={originCompanyName} country={country} source="customs" /> : null,
            priority: true,
            style: 'green',
          },
          {
            content: contactStatus,
            style: 'blue',
          },
          {
            content: canExcavate ? getTransText('KEWAJUE') : '',
          },
          {
            content: hasExcavated ? getTransText('YIWAJUE') : '',
          },
          {
            content: searchType === 'forwarder' && record.viewCountDesc ? record.viewCountDesc : '',
            style: 'green',
          },
          {
            content: record.fromWca ? 'WCA成员' : '',
            style: 'blue',
          },
        ])}
      </>
    );
  };

  const handleOpenCnCompany = (item: tableListItem) => {
    if (item.chineseCompanyId) {
      setCurForwarderComState({
        id: item.chineseCompanyId,
        companyName: item.companyName,
      });
    }
  };

  const columns = [
    {
      title: '',
      width: '1px',
      render(value: string, record: tableListItem) {
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
      title: getIn18Text('GONGSIMINGCHENG'),
      dataIndex: 'name',
      key: 'name',
      className: 'company-name-cell',
      textWrap: 'word-break',
      render: (text: string, record: tableListItem) => (
        <div ref={title}>
          <PeersName value={text} record={record} hideSubBtn={hideSubBtn} changStarMark={changStarMark} searchType={searchType} />
          <div
            style={{ paddingTop: 4 }}
            className={classNames({
              [style.isOpacity]: record.visited,
            })}
          >
            {renderStatus(record)}
          </div>
          {/* 货代版本 显示新的数据 */}
          {searchType === 'forwarder' && <ForwardComponent record={record} type={type} text={text} scence={scence} skeletonLoading={skeletonLoading} />}
          {searchType !== 'forwarder' && <CustomsComponent record={record} type={type} text={text} skeletonLoading={skeletonLoading} />}

          {record.companyCnName && isForWarder && (
            <div
              style={{ paddingTop: 4, gap: 10 }}
              className={classNames(style.companyNameItem, {
                [style.isOpacity]: record.visited,
              })}
            >
              <span className={style.fieldLabel}>相似国内公司：</span>
              <span className={classNames(style.fieldText, style.fieldTextGray, style.fieldLink)}>
                {record.companyCnName}
                {Number(record.chineseCompanyCount) > 1 && <span>{` 等${record.chineseCompanyCount}家企业`}</span>}
              </span>
              <span hidden={record.excavateCnCompanyStatus === 0} className={style.constantCount}>
                {record.chineseCompanyContactCount ? record.chineseCompanyContactCount + `${Number(record.chineseCompanyCount) > 1 ? '+' : ''}` : 0}个联系人
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: searchType === 'forwarder' ? (scence === 'peers' ? '匹配运输次数' : '匹配交易数') : getIn18Text('PIPEIJIAOYIZONGSHU'),
      dataIndex: 'totalTransactions',
      key: 'totalTransactions',
      width: 210,
      sorter: searchType !== 'forwarder',
      sortDirections: ['descend', 'ascend'],
      sortOrder: sortOrderParam.sortBy === 'totalTransactions' && sortOrderParam.order,
      render: (text: string, record: tableListItem) => (
        <>
          <div className={classNames(style.mateAllNum, style.mateAllNumHscode, { [style.isOpacity]: record.visited })}>
            <Skeleton
              active={skeletonLoading}
              loading={skeletonLoading}
              paragraph={{
                rows: 1,
              }}
            >
              <EllipsisTooltip>{(text || '-') + (searchType === 'forwarder' ? '/' : '')}</EllipsisTooltip>
              {searchType === 'forwarder' ? <span>{record.companyAllTransactions || '-'}</span> : ''}
              {text !== '未公开' && record?.transactionsPercentage && (
                <div className={classNames(style.bili, { [style.isOpacity]: record.visited })}>{`${getIn18Text('ZHANZONGBILI')}${record.transactionsPercentage}`}</div>
              )}
            </Skeleton>
          </div>
        </>
      ),
    },
    {
      title: searchType === 'forwarder' ? '匹配交易额（美元）' : getIn18Text('PIPEIJIAOYIZONGE(MEIYUAN)'),
      dataIndex: 'valueOfGoodsUSD',
      key: 'valueOfGoodsUSD',
      width: 200,
      sorter: searchType !== 'forwarder',
      sortDirections: ['descend', 'ascend'],
      sortOrder: sortOrderParam.sortBy === 'valueOfGoodsUSD' && sortOrderParam.order,
      render: (text: string, record: tableListItem) => (
        <>
          <div className={classNames(style.mateAllNum, { [style.isOpacity]: record.visited })}>
            <Skeleton
              active={skeletonLoading}
              loading={skeletonLoading}
              paragraph={{
                rows: 1,
              }}
            >
              <EllipsisTooltip>{text || '-'}</EllipsisTooltip>
              {text !== '未公开' && record?.valueOfGoodsUsdPercentage && (
                <div className={classNames(style.bili, { [style.isOpacity]: record.visited })}>{`${getIn18Text('ZHANZONGBILI')}${record.valueOfGoodsUsdPercentage}`}</div>
              )}
            </Skeleton>
          </div>
        </>
      ),
    },
    {
      title: (
        <div className={style.titleTime}>
          <span>{scence === 'peers' ? '匹配最近运输时间' : getIn18Text('PIPEIJIAOYISHIJIAN')}</span>
          {scence === 'peers' ? (
            ''
          ) : (
            <Tooltip placement="bottomLeft" title={content}>
              <Help />
            </Tooltip>
          )}
        </div>
      ),
      dataIndex: 'lastTransactionDate',
      key: 'lastTransactionDate',
      width: 200,
      sorter: searchType !== 'forwarder',
      sortDirections: ['descend', 'ascend'],
      sortOrder: sortOrderParam.sortBy === 'lastTransactionDate' && sortOrderParam.order,
      render: (text: string, record: tableListItem) => (
        <>
          <div className={classNames(style.mateAllNum, { [style.isOpacity]: record.visited })}>
            <Skeleton
              active={skeletonLoading}
              loading={skeletonLoading}
              paragraph={{
                rows: 1,
              }}
            >
              <EllipsisTooltip>{text || '-'}</EllipsisTooltip>
            </Skeleton>
          </div>
        </>
      ),
    },
    {
      // ${type === 'buysers' ? getIn18Text('GONGYINGSHANG') : getIn18Text('CAIGOUSHANG')}列表
      title: getIn18Text('CAOZUO'),
      className: 'custom-column',
      fixed: 'right',
      width: 110,
      render: (text: string, record: tableListItem) => (
        <div className={classNames(style.operate)}>
          <a
            onClick={e => {
              e.stopPropagation();
              seeList(record);
            }}
            style={{ marginBottom: '8px' }}
          >
            {type === 'buysers' ? '查看供应商' : '查看采购商'}
          </a>
          <a
            hidden={searchType !== 'forwarder'}
            onClick={e => {
              e.stopPropagation();
              if (record.excavateCnCompanyStatus) {
                handleOpenCnCompany(record);
              } else {
                seeDetail(record);
              }
            }}
          >
            查看联系人
          </a>
        </div>
      ),
    },
  ] as any[];

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

  const handleCollectIdChange = (params: { collectId?: string | number | null; country?: string; companyName?: string }) => {
    const targetItem = tableList.find(it => it.country === params.country && it.companyName === params.companyName);
    if (targetItem) {
      changStarMark(targetItem.id, params.collectId);
    }
  };

  const onCustomerDrawerClose = (index: number) => {
    const data = onDrawerClose(recData, index);
    setRecData({ ...data });
    setVisible(true);
  };

  const triggerCustomsDetail = (listItem: ListModalType) => {
    const data = onDrawerOpenLy(
      recData,
      {
        to: type === 'buysers' ? 'supplier' : 'buysers',
        companyName: listItem.companyName,
        country: listItem.country,
      },
      0
    );
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

  const onChangeListItem = (params: { extraData?: any; country?: string; companyName?: string }) => {
    const targetItem = tableList.find(it => it.country === params.country && it.companyName === params.companyName);
    if (!targetItem) return;
    onChangeTable(
      tableList.map(e => {
        if (e.id === targetItem.id) {
          return {
            ...e,
            ...(params.extraData || {}),
          };
        }
        return e;
      })
    );
  };

  useEdmSendCount(emailList, sendType, undefined, draftId, 'customsData', 'customs', getPageRouterWithoutHash());

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

  const marketing = () => {
    const keyList = selectedRows.filter(item => item.excavatedCompanyInfo?.id).map(item => item.excavatedCompanyInfo.id);
    handleGetContactById(keyList)
      .then((res: any) => {
        let emails;
        emails = res
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
        // return
        needCheckEmailList.current = res
          .filter((item: any) => {
            return !item.checkStatus;
          })
          .map((item: any) => {
            return {
              contactName: item.name ? item.name : '',
              contactEmail: item.contact ? item.contact : '',
              sourceName: '海关数据',
              increaseSourceName: 'customs',
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
          doValidEmailsConfirm(validateEmail, directSendEmail, '直接发信');
        } else {
          emails.length > 0 ? setEmailList(emails) : setEmailList([{ contactEmail: 'noEmials', contactName: '' }]);
        }
      })
      .catch(() => {
        setEmailList([{ contactEmail: 'noEmials', contactName: '' }]);
      });
  };

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

  const changeExcludeViewedPage = (num: number) => {
    if (!excludeViewedObj) {
      return;
    }
    const { excludeViewedIndex, excludeViewedList, startFrom } = excludeViewedObj;
    let startFromPage = startFrom;
    let arr: any[] = excludeViewedList;
    if (num < 0 && !excludeViewedIndex) return; // 通过excludeViewedIndex初试值为0判断是否是初始页，初始页禁止前翻
    if (num > 0 && startFrom === pagination.total) return; // 通过startFrom === pagination.total判断是否是末页，末页禁止后翻
    if (num > 0) {
      arr.push(startFrom);
    } else {
      arr.pop();
      startFromPage = excludeViewedList[excludeViewedIndex - 1];
    }
    const paramObj = {
      excludeViewedIndex: excludeViewedIndex + num,
      excludeViewedList: arr,
      startFrom: startFromPage,
    };
    setExcludeViewedObj?.(paramObj);
    onSamilPageChange?.();
  };

  const handleTotalText = () => {
    if (excludeViewed || hasEmail) {
      return <span>筛选后的结果如下</span>;
    } else {
      return (
        <span>
          {getIn18Text('WEININZHAODAO')} <span style={{ color: '#4C6AFF' }}>{realTotalCount || pagination.total}</span> {getIn18Text('GEJIEGUO')}
        </span>
      );
    }
  };

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
    refresh,
  });
  const handleAddLeads = useMemoizedFn(async () => {
    if (!(selectedRowKeys.length > 0)) {
      Toast.error('请选择公司');
      return;
    }
    if (searchType === 'forwarder') {
      customsDataTracker.trackForwarderBatchOpList(CustomsDetailViewAction.AddLeads, selectedRowKeys.length);
    } else {
      customsDataTracker.trackCustomBatchOpList(CustomsDetailViewAction.AddLeads, selectedRowKeys.length);
    }
    const doAdd = () => {
      openBatchCreateLeadsModal({
        submit: ({ groupIds, isAddToGroup }) =>
          hookHandleAddLeads({
            extraFetchParams: { leadsGroupIdList: groupIds, isAddToGroup },
            selectedNum: selectedRows.length,
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

  const batchOneKeyMarketing = useCallback(() => {
    if (!(selectedRowKeys.length > 0)) {
      Toast.error('请选择公司');
      return;
    }
    doEdmExposure(aiHostingIds);
    marketing();
    if (searchType === 'forwarder') {
      customsDataTracker.trackForwarderBatchOpList(CustomsDetailViewAction.SendEdm, aiHostingIds.length);
    } else {
      customsDataTracker.trackCustomBatchOpList(CustomsDetailViewAction.SendEdm, aiHostingIds.length);
    }
  }, [aiHostingIds, marketing, searchType]);

  const handleColumns = useCallback(
    (param: []) => {
      if (scence === 'peers') {
        param.splice(3, 1);
        param.splice(4, 1);
        return param;
      } else {
        return param;
      }
    },
    [scence]
  );

  const [limitLen] = useMarketingLimit();

  useEffect(() => {
    // 表格数据被外层清空之后，清空选择项
    if (tableList.length) return;
    setSelectedRowKeys([]);
    setSelectedRows([]);
  }, [tableList]);

  return (
    <div
      ref={tableRef}
      className={classNames(style.customsTableBox, {
        [style.peesTableBox]: scence === 'peers',
      })}
    >
      {showValidateEmailModal && draftId && (
        <AddContact
          directCheck
          visible={showValidateEmailModal}
          receivers={receivers}
          draftId={draftId}
          businessType={'global_search'}
          onCancelFilterAndSend={directSendEmail}
          onSendAll={generateHandleFilterReceivers(
            emailRef.current.all,
            (newEmails, newType) => {
              setEmailList(newEmails);
              setSendType(newType);
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
          <span hidden={selectedRowKeys.length === 0}>
            {getIn18Text('YIXUAN')}
            <span style={{ color: '#386EE7' }}>{selectedRowKeys.length}</span>
            {getIn18Text('GESHUJU')}
          </span>
          <div hidden={selectedRowKeys.length !== 0}>{handleTotalText()}</div>
          {(realTotalCount || pagination.total) && (
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
                  btnType="primary"
                  text={getIn18Text('YIJIANYINGXIAO')}
                  handleType={aiHostingIds.length > limitLen ? 'bigData' : 'assembly'}
                  afterClickType={aiHostingIds.length > limitLen ? 'async' : 'sync'}
                  from={scence}
                  ids={aiHostingIds}
                  afterClick={aiHostingIds.length > limitLen ? undefined : batchOneKeyMarketing}
                  back={getWmPageCurrUrl()}
                  completeCallback={aiHostingTaskAdd(1)}
                />
                <Button btnType="minorLine" style={{ marginLeft: 12 }} onClick={handleAddLeads} loading={leadsAddLoading}>
                  {getIn18Text('LURUXIANSUO')}
                </Button>
              </div>
            </HollowOutGuide>
          )}
          {!excludeViewed && !hasEmail && (
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
      <SiriusTable<tableListItem>
        sticky={sticky}
        onRow={(record: tableListItem) => ({
          onClick: () => {
            onChangeTable(
              tableList.map(e => {
                if (e.id === record.id) {
                  return {
                    ...e,
                    visited: true,
                  };
                }
                return e;
              })
            );
            seeDetail(record);
          },
        })}
        className="edm-table-customs customs-scroll"
        rowKey="id"
        rowSelection={rowSelection}
        columns={handleColumns(columns)}
        onChange={(tableGagination: PaginationProps, filter: any, sorter: any) => {
          setSelectedRows([]);
          setSelectedRowKeys([]);
          onChange(tableGagination, filter, sorter);
        }}
        scroll={type !== 'peers' ? { x: 1134 + (searchType === 'forwarder' ? 190 : 0) } : { x: 0 }}
        dataSource={tableList}
        locale={locale}
        pagination={false}
        loading={tableLoading}
      />
      {excludeViewed || hasEmail ? ( // 未浏览 和 有邮箱情况下的特殊分页
        <div className={style.excludeViewedPageStyle}>
          <span
            className={excludeViewedObj?.excludeViewedIndex === 0 ? style.disableExcludeViewedPageSpan : style.excludeViewedPageSpan}
            onClick={() => {
              changeExcludeViewedPage(-1);
            }}
          >
            <IconCard style={{ pointerEvents: 'none' }} type="tongyong_jiantou_zuo" />
          </span>
          <span
            className={excludeViewedObj?.startFrom === pagination.total ? style.disableExcludeViewedPageSpan : style.excludeViewedPageSpan}
            onClick={() => {
              changeExcludeViewedPage(1);
            }}
          >
            <IconCard style={{ pointerEvents: 'none' }} type="tongyong_jiantou_you" />
          </span>
          <Select
            value={pagination.pageSize}
            style={{ width: 110 }}
            onChange={e => {
              setExcludeViewedObj?.({
                excludeViewedIndex: 0,
                excludeViewedList: [0],
                startFrom: 0,
              });
              onChange({
                pageSize: e,
              });
            }}
          >
            <Option value={10}>10 条/页</Option>
            <Option value={20}>20 条/页</Option>
            <Option value={50}>50 条/页</Option>
          </Select>
          <span style={{ lineHeight: '36px', marginLeft: 6 }}>
            <Tooltip placement="topLeft" title={smailPageText}>
              <Help />
            </Tooltip>
          </span>
        </div>
      ) : (
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
      )}

      {visible && (
        <ListModal
          visible={visible}
          companyName={companyName}
          country={country}
          type={type as 'buysers' | 'appliers'}
          onCancel={() => {
            setVisible(false);
          }}
          setDrawer={triggerCustomsDetail}
        />
      )}
      <LevelDrawer
        onChangeListItem={onChangeListItem}
        recData={recData}
        onClose={onCustomerDrawerClose}
        onOpen={handleCustomsDetail}
        onCollectIdChange={handleCollectIdChange}
        getContainer={detailRootDom || undefined}
        type={searchType}
      >
        <CustomsDetail />
      </LevelDrawer>
      {curForwarderComState?.id && (
        <ZnCompanyDetail
          changeVisible={visible => {
            if (!visible) {
              setCurForwarderComState(null);
            }
          }}
          detailId={curForwarderComState.id}
          visible={true}
          companyName={curForwarderComState.companyName}
        />
      )}
    </div>
  );
};

export default BuysersTable;
