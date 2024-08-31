import React, { useState, useEffect, useMemo, ReactNode, CSSProperties } from 'react';
import classnames from 'classnames';
import VirtualTable from '@web-common/components/UI/VirtualTable/VirtualTable';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { message, TableColumnsType } from 'antd';
// import { Tabs } from '@web-common/components/UI/Tabs';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
import { CompanyExists, MergeCompany, getIn18Text, GlobalSearchCompanyDetail } from 'api';
import { globalSearchDataTracker } from '../tracker';
import BuyersDetail from './customsBuyerDetail';
import SuppliersDetail from './customsSupplierDetail';
import style from './companyDetail.module.scss';
import { edmCustomsApi } from '../constants';
import { recData } from '../../CustomsData/utils';
import DatePicker from '@web-common/components/UI/DatePicker';
import moment from 'moment';
const { RangePicker } = DatePicker;

export enum CustomsTabKey {
  Buyers = 'buyers',
  Suppliers = 'suppliers',
}

interface Props {
  data?: GlobalSearchCompanyDetail & { sourceCountry?: string };
  headerCompanyList: Array<MergeCompany>;
  showNextDetail?(id: string, sourceData: recData['content']): void;
  queryGoodsShipped?: string;
  queryHsCode?: string;
  isPreciseSearch?: boolean;
  warnningTextShow?: boolean;
  showBuyer?: boolean;
  showSupplier?: boolean;
  defaultActiveKey?: CustomsTabKey;
  afterCompanyExistsFetch?: (res: CompanyExists) => void;
  style?: CSSProperties;
}
export const CustomsTabs: React.FC<Props> = props => {
  const {
    data,
    showNextDetail,
    queryGoodsShipped,
    queryHsCode,
    isPreciseSearch,
    warnningTextShow,
    headerCompanyList,
    showBuyer,
    showSupplier,
    defaultActiveKey,
    afterCompanyExistsFetch,
    style: innerStyle,
  } = props;
  const [mergeDmCustomVisible, setMergeDmCustomVisible] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedCompanyList, setSelectCompanyList] = useState<Array<MergeCompany>>([]);
  const [customUpdateStatus, setCustomUpdateStatus] = useState<boolean>(false);
  const [customerCompanyList, setCustomerCompanyList] = useState<Array<MergeCompany>>([]);
  const [time, setTime] = useState<string[]>([moment().add(-2, 'year').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')]);
  const [activeKey, setActiveKey] = useState<string>('');

  const buyerInfo = useMemo(
    () => ({
      companyName: data?.name || '',
      to: 'buysers',
      country: data?.country || '',
      companyList: selectedCompanyList,
    }),
    [data?.name, data?.country, selectedCompanyList]
  );

  const supplierInfo = useMemo(
    () => ({
      companyName: data?.name || '',
      to: 'supplier',
      country: data?.country || '',
      companyList: selectedCompanyList,
    }),
    [data?.name, data?.country, selectedCompanyList]
  );

  useEffect(() => {
    if (selectedCompanyList.length > 0) {
      setCustomUpdateStatus(true);
    }
  }, [selectedCompanyList]);

  useEffect(() => {
    if (headerCompanyList.length > 0) {
      setCustomUpdateStatus(true);
      edmCustomsApi
        .doGetCompanyExistsDemo({
          companyList: headerCompanyList.map(item => ({ companyName: item.name, country: item.country || '' })),
        })
        .then(res => {
          if (res.companyList && res.companyList.length > 0) {
            res.companyList.forEach((item, index) => {
              item.companyId = index + 1 + '';
              item.name = item.originCompanyName || '';
            });
            setSelectedRowKeys(res.companyList.map(item => item.companyId));
            setSelectCompanyList(res.companyList);
          }
          res.companyList ? setCustomerCompanyList(res.companyList) : setCustomerCompanyList([]);
          afterCompanyExistsFetch?.(res);
        })
        .catch(() => {});
    }
  }, [headerCompanyList]);

  useEffect(() => {
    if (showBuyer) {
      setActiveKey('buyers');
    } else {
      setActiveKey('suppliers');
    }
  }, [showBuyer]);

  const mergeDomainTableColumns: TableColumnsType<{ name: string; country?: string; location?: string }> = [
    {
      title: '公司名称',
      dataIndex: 'name',
    },
    {
      title: '国家/地址',
      dataIndex: 'country',
      render(value, record) {
        return <div>{value || record.location}</div>;
      },
    },
    {
      title: '最后进口时间',
      dataIndex: 'lastImportTime',
    },
    {
      title: '最后出口时间',
      dataIndex: 'lastExportTime',
    },
  ];

  if (!showBuyer && !showSupplier) return null;
  return (
    <div className={classnames(style.block, style.detailCustoms)} style={innerStyle}>
      <Tabs activeKey={activeKey} bgmode="white" size="small" type="capsule" onChange={setActiveKey}>
        {showBuyer && <Tabs.TabPane tab={getIn18Text('ZUOWEICAIGOUSHANG')} key={'buyers'}></Tabs.TabPane>}
        {showSupplier && <Tabs.TabPane tab={getIn18Text('ZUOWEIGONGYINGSHANG')} key={'suppliers'}></Tabs.TabPane>}
      </Tabs>
      {activeKey === 'buyers' && showBuyer && (
        <BuyersDetail
          warnningTextShow={warnningTextShow}
          checkCompanyChangeStatus={() => setCustomUpdateStatus(false)}
          checkCompanyChange={customUpdateStatus}
          queryHsCode={queryHsCode}
          queryGoodsShipped={queryGoodsShipped}
          isPreciseSearch={isPreciseSearch}
          onShowNext={showNextDetail}
          content={buyerInfo as any}
          visible={!!data}
          zIndex={0}
          time={time}
          to="buysers"
        />
      )}
      {activeKey === 'suppliers' && showSupplier && (
        <SuppliersDetail
          warnningTextShow={warnningTextShow}
          checkCompanyChangeStatus={() => setCustomUpdateStatus(false)}
          checkCompanyChange={customUpdateStatus}
          queryHsCode={queryHsCode}
          queryGoodsShipped={queryGoodsShipped}
          isPreciseSearch={isPreciseSearch}
          content={supplierInfo as any}
          onShowNext={showNextDetail}
          visible={!!data}
          zIndex={0}
          time={time}
          to="supplier"
        />
      )}
      <div className={style.mergeDomainCustomer}>
        <div className={style.dataPicker}>
          <RangePicker
            onChange={(value, dateString) => {
              setTime(dateString);
            }}
            value={[moment(time[0]), moment(time[1])]}
            allowClear={false}
            renderExtraFooter={() => {
              let rangeMonth = moment(time[1])?.diff(moment(time[0]), 'month');
              const dates = [
                {
                  label: getIn18Text('JINBANNIAN'),
                  monthCount: -6,
                },
                {
                  label: getIn18Text('JINYINIAN'),
                  monthCount: -12,
                },
                {
                  label: getIn18Text('JINLIANGNIAN'),
                  monthCount: -24,
                },
                {
                  label: getIn18Text('JINSANNIAN'),
                  monthCount: -36,
                },
                {
                  label: getIn18Text('JINWUNIAN'),
                  monthCount: -60,
                },
              ];
              return (
                <div className={style.dateSelectFoot}>
                  {dates.map(date => (
                    <div
                      key={date.label}
                      className={classnames(style.dateSelectItem, {
                        [style.dateSelectItemSelected]: rangeMonth !== undefined && Math.abs(date.monthCount) === Math.abs(rangeMonth),
                      })}
                      onClick={() => {
                        setTime([moment().add(date.monthCount, 'month').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')]);
                      }}
                    >
                      {date.label}
                    </div>
                  ))}
                </div>
              );
            }}
          />
        </div>
        <div className={style.mergeDomainCustomerDoor} hidden={customerCompanyList && customerCompanyList.length === 1}>
          已合并
          {selectedCompanyList.length}
          家相关公司的海关数据
          <Button
            className={style.mergeDomainCustomerLink}
            btnType="link"
            onClick={() => {
              setMergeDmCustomVisible(true);
            }}
          >
            切换合并公司
          </Button>
        </div>
      </div>
      <SiriusModal
        visible={mergeDmCustomVisible}
        title="相关企业"
        width={620}
        maskClosable={false}
        onCancel={() => {
          if (selectedCompanyList.length === 0) {
            setSelectedRowKeys(customerCompanyList.map(item => item.companyId));
          } else {
            setSelectedRowKeys(selectedCompanyList.map(item => item.companyId));
          }
          setMergeDmCustomVisible(false);
        }}
        onOk={() => {
          if (selectedRowKeys.length === 0) {
            message.warning({
              content: '至少选择一个公司',
            });
            return;
          }
          if (customerCompanyList) {
            setSelectCompanyList(customerCompanyList.filter(item => selectedRowKeys.includes(item.companyId)));
          }

          globalSearchDataTracker.trackMergeCompanyOk({
            companyName: data?.name || '',
            uncheck: customerCompanyList.filter(item => !selectedRowKeys.includes(item.companyId)).map(item => item.name),
          });

          setMergeDmCustomVisible(false);
          message.success({
            content: '已生效',
          });
        }}
        className={style.selectModal}
        bodyStyle={{ padding: '12px 24px 20px' }}
      >
        <div className={style.selectBody}>
          <div className={style.selectBodyIntro}>下列公司数据已合并显示，您可以通过勾选/取消勾选，来查看其中部分企业数据。</div>
          <VirtualTable
            rowKey="companyId"
            rowSelection={{
              type: 'checkbox',
              onChange: (keys: any[]) => {
                setSelectedRowKeys(keys);
              },
              selectedRowKeys,
            }}
            rowHeight={52}
            columns={mergeDomainTableColumns}
            autoSwitchRenderMode
            enableVirtualRenderCount={50}
            dataSource={customerCompanyList}
            scroll={{ y: 368 }}
            pagination={false}
          />
        </div>
      </SiriusModal>
    </div>
  );
};
