import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { Input, Select, Table } from 'antd';
import { getIn18Text, apiHolder, apis, WhatsAppApi, WhatsAppStatisticItemV2, WhatsAppStatisticReqV2 } from 'api';
import { ColumnsType } from 'antd/lib/table/interface';
import { RefreshSvg } from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { EmptyList } from '@web-edm/components/empty/empty';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import Notice from '../components/notice/notice';
import UniDrawer from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import CustomerTabs from '@/components/Layout/Customer/components/Tabs/tabs';
import { useAppSelector } from '@web-common/state/createStore';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { useResponsiveTable } from '@/hooks/useResponsiveTable';
import { useWaContextV2 } from '../context/WaContextV2';
import edmStyle from '@web-edm/edm.module.scss';
import style from './index.module.scss';

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

const { Option } = Select;

const countValidator = (value: string) => {
  if (!value) return Promise.resolve(value);

  return /^\d*$/.test(value || '') ? Promise.resolve(value) : Promise.reject();
};

const contactTypeNameMap = {
  CUSTOMER: getIn18Text('KEHU'),
  CLUE: getIn18Text('XIANSUO'),
  UNKNOWN: '-',
};

const WhatsAppStatistic = () => {
  const { refreshOrgStatus, refreshAllotPhones } = useWaContextV2();
  const [params, setParams] = useState<WhatsAppStatisticReqV2>({
    type: 'WhatsApp',
    page: 1,
    pageSize: 20,
  });
  const [data, setData] = useState<WhatsAppStatisticItemV2[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [uniDetailVisible, setUniDetailVisible] = useState(false);
  const [uniDetailCustomerId, setUniDetailCustomerId] = useState<string | undefined>(undefined);
  const { layout, growRef, scrollY } = useResponsiveTable();

  const handleCustomerDetailClick = (customerId: string) => {
    setUniDetailVisible(true);
    setUniDetailCustomerId(customerId);
  };

  useEffect(() => {
    refreshAllotPhones();
  }, []);

  useEffect(() => {
    setLoading(true);
    whatsAppApi
      .getStatisticV2({ ...params, page: params.page - 1 })
      .then(res => {
        setData(res.detail || []);
        setTotal(res.pageInfo.totalSize);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params]);

  const columns: ColumnsType<WhatsAppStatisticItemV2> = [
    {
      title: 'WhatsApp',
      ellipsis: true,
      width: 216,
      fixed: 'left',
      dataIndex: 'contactPhone',
    },
    {
      title: getIn18Text('LIANXIREN'),
      width: 116,
      ellipsis: true,
      dataIndex: 'contactName',
    },
    {
      title: getIn18Text('CHUDACISHU'),
      width: 110,
      dataIndex: 'deliveryCount',
    },
    {
      title: getIn18Text('DUQUCISHU'),
      width: 110,
      ellipsis: true,
      dataIndex: 'readCount',
    },
    {
      title: getIn18Text('HUIFUCISHU'),
      width: 110,
      dataIndex: 'replyCount',
    },
    {
      title: getIn18Text('LEIXING'),
      width: 90,
      dataIndex: 'contactType',
      render(contactType: keyof typeof contactTypeNameMap) {
        return contactTypeNameMap[contactType] || '-';
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 90,
      fixed: 'right',
      dataIndex: 'contactId',
      render(id: string, record) {
        return id && record.contactType === 'CUSTOMER' ? (
          <PrivilegeCheck accessLabel="VIEW" resourceLabel="CONTACT">
            <a onClick={() => handleCustomerDetailClick(record.contactId)}>{getIn18Text('CHAKAN')}</a>
          </PrivilegeCheck>
        ) : (
          '-'
        );
      },
    },
  ];
  const tabs = [getIn18Text('WODESHUJU')];

  return (
    <PermissionCheckPage resourceLabel="WHATSAPP" accessLabel="VIEW" menu="WHATSAPP_DATA_STAT">
      <div className={classnames(edmStyle.container, style.statistic, layout.container)}>
        <div className={layout.static}>
          <div className={edmStyle.pageHeader}>
            <span className={edmStyle.title}>{getIn18Text('WhatsApp SHUJUTONGJI')}</span>
            {data.length > 0 && (
              <span className={edmStyle.subTitle}>
                {getIn18Text('GONG')}
                <em className={edmStyle.num}>{total}</em>
                {getIn18Text('GELIANXIREN')}
              </span>
            )}
            <a
              className="edm-page-refresh sirius-no-drag"
              onClick={() => {
                setParams({ ...params });
                refreshOrgStatus();
                refreshAllotPhones();
              }}
            >
              <RefreshSvg />
            </a>
          </div>
          <Notice className={style.notice} type="info">
            {getIn18Text('TONGJIXIANSHISUOYOU WhatsApp YINGXIAOCHUDAYONGHUDUQUQINGKUANG\uFF0CFANGBIANQIYECHAZHAOGAOYIXIANGKEHU\uFF0CJINXINGJINGXIHUAYUNYING')}
          </Notice>
          <CustomerTabs className={style.tabs} tabNameList={tabs} defaultActiveKey="1" onChange={() => {}} />
          <div className={style.filter}>
            <Input
              style={{ width: 176, fontSize: 12 }}
              prefix={<SearchIcon />}
              allowClear
              placeholder={getIn18Text('QINGSHURULIANXIRENXINGMING')}
              onChange={e =>
                setParams({
                  ...params,
                  contactName: e.target.value,
                  page: 1,
                })
              }
            />
            <Input
              style={{ width: 176, marginLeft: 8, fontSize: 12 }}
              suffix={getIn18Text('YISHANG')}
              allowClear
              placeholder={getIn18Text('TIANXIECHUDACISHU')}
              onChange={event =>
                countValidator(event.target.value).then(value =>
                  setParams({
                    ...params,
                    deliveryCountGt: value,
                    page: 1,
                  })
                )
              }
            />
            <Input
              style={{ width: 176, marginLeft: 8, fontSize: 12 }}
              suffix={getIn18Text('YISHANG')}
              allowClear
              placeholder={getIn18Text('TIANXIEDUQUCISHU')}
              onChange={event =>
                countValidator(event.target.value).then(value =>
                  setParams({
                    ...params,
                    readCountGt: value,
                    page: 1,
                  })
                )
              }
            />
            <Input
              style={{ width: 176, marginLeft: 8, fontSize: 12 }}
              suffix={getIn18Text('YISHANG')}
              allowClear
              placeholder={getIn18Text('TIANXIEHUIFUCISHU')}
              onChange={event =>
                countValidator(event.target.value).then(value =>
                  setParams({
                    ...params,
                    replyCountGt: value,
                    page: 1,
                  })
                )
              }
            />
            <Select
              className="no-border-select"
              dropdownClassName="edm-selector-dropdown"
              style={{ width: 200, marginLeft: 8, fontSize: 12 }}
              allowClear
              suffixIcon={<DownTriangle />}
              placeholder={getIn18Text('SHIFOUWEIKEHU')}
              optionFilterProp="children"
              options={[
                { label: getIn18Text('SHI'), value: 1 },
                { label: getIn18Text('FOU'), value: 0 },
              ]}
              onChange={value =>
                setParams({
                  ...params,
                  isCustomer: typeof value === 'number' ? !!value : undefined,
                  page: 1,
                })
              }
            />
          </div>
        </div>
        {!!data.length && (
          <div className={layout.grow} ref={growRef}>
            <Table
              className={`${edmStyle.contactTable}`}
              loading={loading}
              columns={columns}
              dataSource={data}
              pagination={{
                className: 'pagination-wrap',
                size: 'small',
                total,
                current: params.page,
                pageSize: params.pageSize,
                pageSizeOptions: ['20', '50', '100'],
                showSizeChanger: true,
              }}
              onChange={pagination => {
                setParams({
                  ...params,
                  pageSize: pagination.pageSize as number,
                  page: pagination.pageSize === params.pageSize ? (pagination.current as number) : 1,
                });
              }}
            />
          </div>
        )}
        {data.length === 0 && (
          <EmptyList>
            <p>{getIn18Text('DANGQIANMEIYOURENHELIANXIREN')}</p>
          </EmptyList>
        )}
        <UniDrawer
          visible={uniDetailVisible}
          source="waStats"
          customerId={uniDetailCustomerId as unknown as number}
          onClose={() => {
            setUniDetailVisible(false);
            setUniDetailCustomerId(undefined);
          }}
          onSuccess={() => {}}
        />
      </div>
    </PermissionCheckPage>
  );
};

export default WhatsAppStatistic;
