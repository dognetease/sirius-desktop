import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useMemoizedFn } from 'ahooks';
import { ExcavateCompanyItem, getIn18Text, ExcavateCompanyDetail, apiHolder, EdmCustomsApi, apis, ExcavateContactList } from 'api';
import { Alert, Skeleton, TableColumnsType, Button, message } from 'antd';
import { openBatchCreateLeadsModal } from '@lxunit/app-l2c-crm';
import IconCard from '@web-common/components/UI/IconCard/index';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
// import { Tabs } from '@web-common/components/UI/Tabs';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
import { getCustomerAndLeadsTagInDetail } from '@/components/Layout/globalSearch/utils';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { renderDataTagList } from '@/components/Layout/utils';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import CustomerTag from '@/components/Layout/globalSearch/component/CustomerTag';
import CustomsDetail from '@/components/Layout/CustomsData/customs/customsDetail/customsDetail';
import LevelDrawer from '@/components/Layout/CustomsData/components/levelDrawer/levelDrawer';
import { onDrawerClose, onDrawerOpen } from '@/components/Layout/CustomsData/utils';
import { useLeadsAdd } from '@/components/Layout/globalSearch/hook/useLeadsAdd';
import style from './index.module.scss';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
interface ZnCompanyDetailProps {
  companyList?: ExcavateCompanyItem[];
  detailId: string;
  companyListIndex?: number;
  visible: boolean;
  changeVisible: (params: boolean) => void;
  companyName: string;
  setZnID?: (params: string) => void;
  changeIndex?: (params: number) => void;
  getZnCompanyRelationList?: () => void;
  onExcavated?(item: ExcavateCompanyItem): void;
  sourcName?: string;
  logId?: number;
  refreshListData?: () => void;
  bringIntoData?: any; // 外层带入的数据
}
export interface ITablePage {
  current: number;
  total: number;
  pageSize: number;
}
export interface ITabOption {
  label: string;
  value: string;
}
interface recData {
  visible: boolean;
  zIndex: number;
  to: 'buysers' | 'supplier';
  content: {
    country: string;
    to: 'buysers' | 'supplier';
    companyName: string;
    tabOneValue?: string;
    queryValue?: string;
    originCompanyName?: string;
  };
  children?: recData;
}
const initSearchTypeOptions: ITabOption[] = [
  {
    label: '全部',
    value: '0',
  },
  {
    label: '手机',
    value: '1',
  },
  {
    label: '固话',
    value: '2',
  },
  {
    label: '邮箱',
    value: '3',
  },
  {
    label: '传真',
    value: '4',
  },
  {
    label: 'QQ',
    value: '5',
  },
  {
    label: '其他',
    value: '6',
  },
  {
    label: '微信',
    value: '7',
  },
];

export default (props: ZnCompanyDetailProps) => {
  const {
    companyList,
    detailId,
    companyListIndex = 0,
    visible,
    changeVisible,
    companyName,
    setZnID,
    changeIndex,
    getZnCompanyRelationList,
    onExcavated,
    sourcName,
    logId,
    refreshListData,
    bringIntoData,
  } = props;
  const [companyRelationState, setCompanyRelationState] = useState<{
    companyId: string;
    status: string;
    leadsId: string;
  }>({ companyId: '', status: '', leadsId: '' });
  const [searchType, handleTypeChange] = useState<string>('0');
  const [SearchTypeOptions, countSearchTypeOptions] = useState<ITabOption[]>(initSearchTypeOptions);
  const [detailData, setDetaildata] = useState<ExcavateCompanyDetail>();
  const [contactList, setContactList] = useState<ExcavateContactList[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [recData, setRecData] = useState<recData>({
    visible: false,
    to: 'buysers',
    zIndex: 0,
    content: {
      country: '',
      to: 'buysers',
      companyName: '',
      originCompanyName: '',
    },
  });
  const [pageConfig, setPageConfig] = useState<ITablePage>({
    current: 1,
    total: 0,
    pageSize: 10,
  });
  const getCompanyRelationState = useCallback(async () => {
    const { companyNameId, countryId } = detailData || {};
    if (!companyNameId) return;
    try {
      const res = await edmCustomsApi.getCompanyRelationStatus({ companyNameId, countryId });
      setCompanyRelationState(res);
    } catch (e) {
      // do nothing
    }
  }, [detailData]);
  useEffect(() => {
    getInitData();
  }, [detailId]);

  useEffect(() => {
    getCompanyRelationState();
  }, [detailData]);

  const getInitData = useCallback(() => {
    setLoading(true);
    const ApiUrl = sourcName === 'searchIframe' ? edmCustomsApi.doGetDetailUseLog : edmCustomsApi.doGetExcavateCompanyDetail;
    const id = sourcName === 'searchIframe' ? logId : detailId;
    ApiUrl.bind(edmCustomsApi)(id as never)
      .then(res => {
        setDetaildata(res);
        setContactList(res?.contactList || []);
        handleCountSearchTypeOptions(res?.contactList || []);
        setLoading(false);
        onExcavated?.(res);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [detailId]);

  const handleCountSearchTypeOptions = (arr: ExcavateContactList[]) => {
    let newOptionsArr = initSearchTypeOptions.map(item => {
      const count = item.value === '0' ? arr.length : arr.filter(i => i?.contactType === item.value).length;
      item.label = item.label.slice(0, 2) + `(${count})`;
      return item;
    });
    countSearchTypeOptions(newOptionsArr);
  };
  const changeExcludeViewedPage = (req: number) => {
    if (req < 0 && companyListIndex === 0) return;
    if (req > 0 && companyListIndex === Number(companyList?.length) - 1) return;
    const companyIdArr = companyList?.map(item => item.id) || [];
    const companyId = companyIdArr[companyListIndex + req];
    changeIndex && changeIndex(companyListIndex + req);
    setZnID && setZnID(companyId);
  };
  const chineseCompanyColumns: TableColumnsType<{ person?: string; contactInfo?: string; position?: string }> = [
    {
      title: getIn18Text('XINGMING'),
      dataIndex: 'person',
      render(value, record, index) {
        return (
          <>
            <span>
              {record?.person} {record?.position && <span className={style.tagPosition}>{record?.position}</span>}
            </span>
          </>
        );
      },
    },
    {
      title: getIn18Text('LIANXIFANGSHI'),
      dataIndex: 'contactInfo',
    },
  ];
  const onTableChange = (tablePage: ITablePage) => {
    setPageConfig({
      current: tablePage.current || 1,
      total: tablePage.total,
      pageSize: tablePage.pageSize,
    });
  };
  const handleToggle = (value: string) => {
    handleTypeChange(value);
    handleList(value);
  };
  const handleList = (value: string) => {
    let newArrLength = 0;
    if (value === '0') {
      setContactList(detailData?.contactList || []);
      newArrLength = detailData?.contactList?.length || 0;
    } else {
      const newArr = detailData?.contactList?.filter(item => Number(item?.contactType) === Number(value)) || [];
      newArrLength = newArr.length;
      setContactList(newArr);
    }

    setPageConfig({
      current: 1,
      total: newArrLength,
      pageSize: 10,
    });
  };

  const openHelpCenter = (url: string) => {
    if (!url) return;
    return url.indexOf('//') !== -1 ? url : 'https://' + url;
  };
  const onClose = useMemoizedFn(() => {
    changeVisible(false);
    getZnCompanyRelationList?.();
  });
  const onLeadsPost = useMemoizedFn((extraParams?: any) => edmCustomsApi.doGetchineseBatchAddLeads({ ids: [detailId], ...extraParams }));
  const doRefresh = useMemoizedFn(() => {
    getInitData();
    refreshListData?.();
  });
  const { handleAddLeads, leadsAddLoading } = useLeadsAdd({
    onFetch: onLeadsPost,
    refresh: doRefresh,
    onNavigate: onClose,
  });
  const createClue = () => {
    openBatchCreateLeadsModal({
      submit: ({ groupIds, isAddToGroup }) => handleAddLeads({ extraFetchParams: { leadsGroupIdList: groupIds, isAddToGroup } }),
    });
  };
  const customerTagContent = useMemo(() => getCustomerAndLeadsTagInDetail(companyRelationState), [companyRelationState]);
  const renderStatus = useMemo(
    () =>
      renderDataTagList([
        {
          content: customerTagContent ? (
            <CustomerTag tagProps={customerTagContent} companyName={detailData?.chineseName || ''} country="" refresh={() => getCompanyRelationState()} />
          ) : null,
          priority: true,
          style: 'green',
        },
        {
          content: detailData?.recommendLabel,
          style: 'blue',
        },
      ]),
    [detailData, customerTagContent, getCompanyRelationState]
  );
  const handleCustomsDetail = (customsCompanyType: string, companyName: string, country: string) => {
    const data = onDrawerOpen(recData, { to: customsCompanyType === 'import' ? 'buysers' : 'supplier', companyName, country }, 0);
    setRecData({ ...data });
  };
  const onDrawerOpenBefore = (content: recData, zindex: number) => {
    const data = onDrawerOpen(recData, { ...content }, zindex);
    setRecData({ ...data });
  };
  const onCustomerDrawerClose = (index: number) => {
    const data = onDrawerClose(recData, index);
    setRecData({ ...data });
  };
  return (
    <>
      <Drawer
        title={
          <div className={style.titleStyle}>
            <div>
              {sourcName === 'searchIframe'
                ? `海关数据中可能匹配的公司 `
                : `与“${companyName}”关联的公司${companyList?.length ? '（' + companyList?.length + '）' : ''} `}
              {sourcName === 'searchIframe' && bringIntoData?.customsCompanyName && (
                <span
                  onClick={() =>
                    handleCustomsDetail(bringIntoData?.customsCompanyType || '', bringIntoData?.customsCompanyName || '', bringIntoData?.customsCountry || '')
                  }
                  className={style.urlLink}
                >
                  {bringIntoData?.customsCompanyName}
                </span>
              )}
            </div>
            {(sourcName === 'searchIframe' || sourcName === 'lbs') && companyRelationState?.status === 'ADDABLE' && (
              <Button type="primary" loading={leadsAddLoading} disabled={loading} onClick={createClue} style={{ marginRight: '40px' }}>
                录入线索
              </Button>
            )}
          </div>
        }
        width={872}
        onClose={onClose}
        visible={visible}
        destroyOnClose={Boolean(true)}
        getContainer={document.body}
        zIndex={15}
      >
        <div className={style.detailBox}>
          <Skeleton active loading={loading}>
            {sourcName !== 'searchIframe' && Number(companyList?.length) > 1 && (
              <Alert
                message="若该企业不匹配，可进行切换查看其他相似公司信息。"
                type="info"
                showIcon
                closable
                closeText={<span className={style.iconCloseText}>关闭</span>}
              />
            )}
            {sourcName !== 'searchIframe' && (
              <div className={style.detailTitle}>
                <span
                  className={companyListIndex === 0 ? style.disablePageSpan : style.excludePageSpan}
                  onClick={() => {
                    changeExcludeViewedPage(-1);
                  }}
                  style={{ marginRight: '16px' }}
                  hidden={Boolean(!companyList)}
                >
                  <IconCard style={{ pointerEvents: 'none' }} type="tongyong_jiantou_zuo" />
                </span>
                <span className={style.itemCompanyDetailName}>{detailData?.chineseName || '-'}</span>
                <span
                  className={companyListIndex + 1 === companyList?.length ? style.disablePageSpan : style.excludePageSpan}
                  onClick={() => {
                    changeExcludeViewedPage(1);
                  }}
                  hidden={Boolean(!companyList)}
                >
                  <IconCard style={{ pointerEvents: 'none' }} type="tongyong_jiantou_you" />
                </span>
              </div>
            )}
            <div className={style.detailInfoBox}>
              {detailData?.chineseName && <div className={style.detailLogo}>{detailData?.chineseName?.slice(0, 4)}</div>}
              <div className={style.detailInfo}>
                <div className={style.detailInfoName}>
                  <span style={{ marginRight: '4px' }}>{detailData?.chineseName || '-'}</span>
                  {renderStatus}
                </div>
                <div className={style.detailInfoItem}>
                  <div>
                    <EllipsisTooltip>
                      <span>公司规模：{detailData?.staffSize || '-'}</span>
                    </EllipsisTooltip>
                  </div>
                  <div>
                    <EllipsisTooltip>
                      <span>国家地区：{detailData?.countryRegion || '-'}</span>
                    </EllipsisTooltip>
                  </div>
                  <div>
                    官网地址：
                    {detailData?.website ? (
                      <a className={style.btnContent} href={openHelpCenter(detailData?.website || '')} target="_blank">
                        {detailData?.website || '-'}
                      </a>
                    ) : (
                      '-'
                    )}
                  </div>
                  <div>
                    <EllipsisTooltip>
                      <span>所属行业：{detailData?.industry || '-'}</span>
                    </EllipsisTooltip>
                  </div>
                  <div>
                    <EllipsisTooltip>
                      <span>经营范围：{detailData?.businessScope || '-'}</span>
                    </EllipsisTooltip>
                  </div>
                  <div>
                    <EllipsisTooltip>
                      <span>注册资本：{detailData?.registeredCapital || '-'}</span>
                    </EllipsisTooltip>
                  </div>
                </div>
              </div>
            </div>
            <div className={style.detailListBox}>
              <div className={style.detailListTop}>
                <div>联系方式</div>
                <Tabs type="capsule" size="small" bgmode="gray" defaultActiveKey="0" activeKey={searchType} onChange={e => handleToggle(e)}>
                  {SearchTypeOptions?.map(item => (
                    <Tabs.TabPane tab={item.label} key={item.value} />
                  ))}
                </Tabs>
              </div>
              <SiriusTable
                columns={chineseCompanyColumns}
                dataSource={contactList}
                pagination={{
                  total: contactList.length,
                  current: pageConfig.current,
                  pageSize: pageConfig.pageSize,
                  pageSizeOptions: ['20', '50', '100'],
                  showSizeChanger: true,
                }}
                onChange={(pageConfig: any) => {
                  onTableChange({
                    current: pageConfig.current ?? 1,
                    total: pageConfig.total,
                    pageSize: pageConfig.pageSize ?? 10,
                  });
                }}
              />
            </div>
          </Skeleton>
        </div>
      </Drawer>
      <LevelDrawer key={'searchiFrameDetail'} recData={recData} onClose={onCustomerDrawerClose} onOpen={onDrawerOpenBefore} zIndex={1040}>
        <CustomsDetail />
      </LevelDrawer>
    </>
  );
};
