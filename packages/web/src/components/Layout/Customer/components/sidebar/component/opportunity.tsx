import React, { useEffect, useState, useRef, useImperativeHandle } from 'react';
import classnames from 'classnames';
import { Tooltip } from 'antd';
import { api, apis, MailPlusCustomerApi, OpportunityBaseInfo, getIn18Text } from 'api';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import InfiniteLoader from 'react-window-infinite-loader';
// import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { CURRENCY_MAP } from '@web-edm/components/editor/template';
// import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import style from './opportunity.module.scss';
import { EmptyTips } from './emptyTips';
import { PrivilegeCheckForMailPlus } from '@/components/UI/PrivilegeEnhance';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import { UniDrawerModuleId, showUniDrawer } from '@lxunit/app-l2c-crm';

const mailPlusCustomerApi = api.requireLogicalApi(apis.mailPlusCustomerApiImpl) as MailPlusCustomerApi;

export interface Props {
  resourceId: string;
  isOpenSea: boolean;
  onAddOpportunity: () => void; // 点击新建商机
  hideAddBtn?: boolean; // 是否隐藏新建商机
}
// 商机tab组件
export const Opportunity = React.forwardRef((props: Props, ref) => {
  const { resourceId, onAddOpportunity, isOpenSea = false, hideAddBtn = false } = props;
  // const [loading, setLoading] = useState(false);
  const listRef = useRef<OpportunityBaseInfo[]>([]);
  // const [, setUniOpportunityParam] = useState2RM('uniOpportunityParam');
  const [statusObj, setStatusObj] = useState<Record<number, string>>(); // 状态映射
  const [settlementCurrency, setSettlementCurrency] = useState<Record<number, string>>(); // 货币映射
  useEffect(() => {
    mailPlusCustomerApi.doGetOpportunityStatus().then(res => {
      const objStatus: Record<number, string> = {};
      const ObjSettlementCurrency: Record<number, string> = {};
      res.status.forEach(i => {
        objStatus[i.id] = i.label;
      });
      res.settlement_currency.forEach(i => {
        ObjSettlementCurrency[i.id] = i.label;
      });
      setStatusObj(objStatus);
      setSettlementCurrency(ObjSettlementCurrency);
    });
  }, []);

  const [searchParams, setSearchParams] = useState({
    page: 1,
    size: 20,
    status: undefined,
  });
  const [pagination, setPagination] = useState({
    pageSize: 20,
    current: 1,
    total: 0,
  });
  // 暴露给外部，用来刷新数据
  useImperativeHandle(ref, () => ({
    refreshOpportunity,
  }));

  // 刷新数据，设置一下入参，会自动请求
  const refreshOpportunity = () => {
    setSearchParams({ page: 1, size: 20, status: undefined });
  };

  const fetchData = async () => {
    try {
      const { page } = searchParams;
      const res = await mailPlusCustomerApi.doGetOpportunityByCompany(searchParams.page, searchParams.size, resourceId, searchParams.status);
      const { data, totalSize } = res;
      listRef.current = page === 1 ? data : [...listRef.current, ...data];
      setPagination({ ...pagination, total: totalSize || 0 });
    } finally {
    }
  };

  useEffect(() => {
    refreshOpportunity();
  }, [resourceId]);

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  // 点击展示商机详情
  const showDetail = (detail: OpportunityBaseInfo) => {
    // setUniOpportunityParam({
    //   visible: true,
    //   type: 'detail',
    //   detail,
    //   onClose: showUpdate => {
    //     if (showUpdate) {
    //       refreshOpportunity();
    //     }
    //   },
    // });
    const detailData = {
      ...detail,
      opportunity_id: +detail.opportunity_id,
    };
    showUniDrawer({
      moduleId: UniDrawerModuleId.BusinessDetail,
      moduleProps: {
        visible: true,
        detail: detailData, // Pick<CustomerOpportunityVO_2, 'opportunity_id' | 'name' | 'total_amount' | 'status' | 'settlement_currency'>;
        onClose: (shouleUpdate?: boolean) => {
          if (shouleUpdate) {
            refreshOpportunity();
          }
        },
      },
    });
  };

  const isItemLoaded = (index: number) => index < listRef.current.length;
  const loadMore = () => {
    setSearchParams(prev => ({
      ...prev,
      page: prev.page + 1,
    }));
  };
  const getSize = (index: number) => 46;
  const RowData = ({ data, index, style: styleObj }: { data: OpportunityBaseInfo[]; index: number; style: React.CSSProperties }) => {
    const item = data[index];
    if (index >= data.length) {
      return (
        <div style={styleObj} className={style.item}>
          {getIn18Text('JIAZAIZHONG...')}
        </div>
      );
    }
    return <div style={styleObj}>{renderItem(item, index)}</div>;
  };
  // 渲染每一行
  const renderItem = (item: OpportunityBaseInfo, index: number) => {
    const { status, name, total_amount, settlement_currency } = item;
    // 商机状态 1-询盘, 2-方案报价，3-谈判，4-赢单，5-输单，6-无效, 服务端会加接口，返回映射关系
    const statusText = (statusObj && statusObj[status]) || status;
    const currency = (settlementCurrency && settlementCurrency[settlement_currency] && CURRENCY_MAP[settlementCurrency[settlement_currency]]) || '￥';
    return (
      <div
        className={classnames(style.item, {
          [style.item2]: index % 2,
        })}
        onClick={() => {
          showDetail(item);
        }}
      >
        <div className={style.name}>
          <Tooltip placement="top" title={name}>
            <span>{name}</span>
          </Tooltip>
        </div>
        <div className={style.status}>
          <span className={style.label}>{statusText}</span>
        </div>
        <div className={style.amount}>
          {currency} {total_amount}
        </div>
      </div>
    );
  };

  // 选择商机状态
  const onSelectStatus = (value: any) => {
    setSearchParams(prev => ({
      ...prev,
      page: 1,
      status: value,
    }));
  };

  return (
    <div className={style.emailList}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <EnhanceSelect
          maxTagCount="responsive"
          maxTagPlaceholder={more => <span>{more.length ? `+${more.length}` : ''}</span>}
          value={searchParams.status}
          onChange={onSelectStatus}
          mode="multiple"
          allowClear
          placeholder={getIn18Text(['SHAIXUAN', 'SHANGJIZHUANGTAI'])}
          style={{ width: 204 }}
        >
          {statusObj && Object.keys(statusObj)?.map(key => <InSingleOption value={key}>{statusObj[+key]}</InSingleOption>)}
        </EnhanceSelect>
        {!isOpenSea && !hideAddBtn && (
          <PrivilegeCheckForMailPlus resourceLabel="COMMERCIAL" accessLabel="OP">
            <Button
              btnType="primary"
              inline
              onClick={() => {
                onAddOpportunity && onAddOpportunity();
              }}
            >
              {getIn18Text('XINJIANSHANGJI')}
            </Button>
          </PrivilegeCheckForMailPlus>
        )}
      </div>
      <div className={style.emailListOuter}>
        <div className={classnames(style.item, style.item2)}>
          <div className={style.name}>{getIn18Text('SHANGJIMINGCHENG')}</div>
          <div className={style.status}>{getIn18Text('SHANGJIZHUANGTAI')}</div>
          <div className={style.amount}>{getIn18Text('SHANGJIZONGJINE')}</div>
        </div>
        {listRef.current.length === 0 ? <EmptyTips className={style.emptyTip} text={getIn18Text('ZANWUSHANGJI')} /> : null}
        <div className={style.emailListScroller}>
          <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={pagination.total} loadMoreItems={loadMore}>
            {({ onItemsRendered, ref }) => (
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    className={classnames(style.list, 'sirius-scroll')}
                    height={height}
                    width={width}
                    itemCount={listRef.current.length}
                    itemSize={getSize}
                    estimatedItemSize={46}
                    onItemsRendered={onItemsRendered}
                    itemData={listRef.current}
                    ref={ref}
                  >
                    {RowData}
                  </List>
                )}
              </AutoSizer>
            )}
          </InfiniteLoader>
        </div>
      </div>
    </div>
  );
});
