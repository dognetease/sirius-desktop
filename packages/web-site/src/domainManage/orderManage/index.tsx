import React, { useState, useEffect, useRef } from 'react';
import { Table, Tooltip } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { navigate } from '@reach/router';
import dayjs from 'dayjs';
import { api, apis, SiteApi, apiHolder, DataTrackerApi, DomainOrderItem, getIn18Text } from 'api';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import style from './style.module.scss';
import edmStyle from '@web-edm/edm.module.scss';
import Breadcrumb from '@web-site/components/Breadcrumb';
import { ReactComponent as QuestionIcon } from '../../images/question.svg';
import { ReactComponent as EmptyIcon } from '../../images/empty-1.svg';
import { getPayUrl } from '../../mySite/utils';
import { useOpenHelpCenter } from '@web-common/utils/utils';
import { DomainNav } from '../../components/DomainNav';

interface CountDownProps {
  total: number;
  refresh: () => void;
}

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const CountDown = (props: CountDownProps) => {
  const { total, refresh } = props;
  const [totalSecond, setTotalSecond] = useState(Math.floor(total / 1000));
  const timer = useRef<any>();

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setTotalSecond(count => {
        const next = count - 1;
        if (next <= 0) {
          clearInterval(timer.current);
          timer.current = null;
          refresh();
          return 0;
        } else {
          return count - 1;
        }
      });
    }, 1000);
  }, [total]);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    []
  );

  const getHour = () => {
    return Math.floor(totalSecond / 3600 > 1 ? totalSecond / 3600 : 0);
  };

  const getMinutes = () => {
    const minute = totalSecond % 3600;
    return Math.floor(minute / 60 > 1 ? minute / 60 : 0);
  };

  const getSeconds = () => {
    return Math.floor(totalSecond % 60 > 1 ? totalSecond % 60 : 0);
  };

  return (
    <>
      {getHour() > 0 && <span>{getHour()}:</span>}
      <span>{`0${getMinutes()}`.slice(-2)}:</span>
      <span>{`0${getSeconds()}`.slice(-2)}</span>
    </>
  );
};

export const OrderManage = () => {
  const columns: ColumnsType<DomainOrderItem> = [
    {
      title: '订单ID',
      dataIndex: 'orderId',
      width: '25%',
      ellipsis: true,
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: '商品类型',
      dataIndex: 'productType',
      render: value => <EllipsisTooltip>{[0, 2].includes(value) ? getIn18Text('YUMING') : getIn18Text('ZHENGSHU')}</EllipsisTooltip>,
    },
    {
      title: '商品详情',
      dataIndex: 'orderDetail',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    // {
    //     title: '下单时间',
    //     dataIndex: 'orderTime',
    //     render: value => <EllipsisTooltip>{dayjs(value).format('YYYY-MM-DD')}</EllipsisTooltip>
    // },
    {
      title: '付款时间',
      dataIndex: 'payTime',
      render: value => <EllipsisTooltip>{value ? dayjs(value).format('YYYY-MM-DD') : '-'}</EllipsisTooltip>,
    },
    {
      title: '价格',
      dataIndex: 'actualPrice',
      width: '120px',
      render: (value, record) => (
        <div className={style.price}>
          {value}元{record.actualPrice !== record.underlinePrice && <span>{record.underlinePrice}元</span>}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: '120px',
      render: (value, record) => {
        const { currentTime = Date.now(), orderTime = Date.now(), platform } = record;
        const countDown = platform === 3 ? 60 * 60 * 48 * 1000 : 0.5 * 60 * 60 * 1000;
        const total = orderTime + countDown - currentTime;
        return (
          <>
            {value === 0 && (
              <div className={style.status0}>
                <span />
                {getIn18Text('GOUMAISHIBAI')}
              </div>
            )}
            {value === 1 && total > 0 && (
              <div className={style.status1}>
                <span />
                待支付
              </div>
            )}
            {value === 6 && total > 0 && (
              <div className={style.status1}>
                <span />
                待确认
              </div>
            )}
            {value === 2 && (
              <div className={style.status2}>
                <span />
                购买中
              </div>
            )}
            {value === 3 && (
              <div className={style.status2}>
                <span />
                已退款
              </div>
            )}
            {(value === 4 || ((value === 1 || value === 6) && total <= 0)) && (
              <div className={style.status4}>
                <span />
                已失效
              </div>
            )}
            {value === 5 && (
              <div className={style.status5}>
                <span />
                购买成功
              </div>
            )}
          </>
        );
      },
    },
    {
      title: '操作',
      width: '180px',
      dataIndex: 'domain',
      render: (value, record) => {
        const { currentTime = Date.now(), orderTime = Date.now(), platform } = record;
        const countDown = platform === 3 ? 60 * 60 * 48 * 1000 : 0.5 * 60 * 60 * 1000;
        const total = orderTime + countDown - currentTime;
        return (
          <>
            {record.status === 0 && record.actualPrice != 0 ? (
              <span className={style.link} onClick={openRefundModal}>
                {getIn18Text('SHENQINGTUIKUAN')}
              </span>
            ) : (record.status === 1 || record.status === 6) && total > 0 ? (
              <div className={style.link} onClick={() => goPay(record)}>
                去付款
                <span>
                  （<CountDown total={total} refresh={getOrderList} />）
                </span>
              </div>
            ) : (
              '-'
            )}
          </>
        );
      },
    },
  ];

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<DomainOrderItem[]>([]);
  const openHelpCenter = useOpenHelpCenter();

  const goMyDomain = () => {
    navigate('#site?page=myDomain');
  };

  const goBuy = () => {
    trackApi.track('buydomain', { from: 'order' });
    navigate('#site?page=domainSearch');
  };

  const goPurchasePay = (
    state:
      | {
          domain: string;
          name_cn: string;
          actualPrice: number;
          underlinePrice: number;
          templateId: string;
          orderId: string;
          platform: number;
        }
      | {
          domain: string;
          category: string;
          brand: string;
          actualPrice: number;
          underlinePrice: number;
          years: number;
          brandCode: string;
          orderId: string;
          platform: number;
        },
    product?: string
  ) => {
    navigate(`#site?page=domainPurchasePay${product ? `&product=${product}` : ''}`, { state });
  };

  const goPay = async (record: DomainOrderItem) => {
    const { platform, templateId, orderId, productType } = record;
    if (platform === 3) {
      if ([0, 2].includes(productType)) {
        const data = await getTemplateData(templateId);
        if (data) {
          const { fullName, firstName, lastName } = data;
          goPurchasePay({
            domain: record.domain,
            actualPrice: record.actualPrice,
            underlinePrice: record.originalPrice,
            platform,
            orderId: record.orderId,
            templateId: record.templateId,
            name_cn: fullName ? fullName : lastName + firstName,
          });
        }
      } else {
        goPurchasePay(
          {
            domain: record.domain,
            actualPrice: record.actualPrice,
            underlinePrice: record.originalPrice,
            platform,
            orderId: record.orderId,
            category: 'DV',
            brand: 'sslTrus',
            brandCode: 'ssltrus-dv-ssl',
            years: record.validityPeriod,
          },
          'cert'
        );
      }
    } else {
      getPayUrl(orderId, platform);
    }
  };

  const getOrderList = async () => {
    setLoading(true);
    try {
      const orderList = await siteApi.domainOrderList();
      setList(orderList ?? []);
    } finally {
      setLoading(false);
    }
  };

  const getTemplateData = async (templateId: string) => {
    try {
      const res = await siteApi.getDomainTemplate({ templateId });
      return res;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    getOrderList();
  }, []);

  const goHelpCenter = () => {
    // window.open('https://waimao.163.com/knowledgeCenter#/d/1649407615124459521.html');
    openHelpCenter('/d/1649407615124459521.html');
  };

  const openRefundModal = () => {
    Modal.success({
      title: '请联系客户经理退款',
      content: <span className={style.refundModalText}>客户经理可在您的专属企业微信群中找到</span>,
      className: style.refundModal,
      okText: getIn18Text('SITE_ZHIDAOLE'),
      width: 400,
      hideCancel: true,
      icon: false,
    });
  };

  return (
    <div className={style.orderManage}>
      <div className={style.orderManageHeader}>
        <Breadcrumb>
          <Breadcrumb.Item onClick={goMyDomain}>域名管理</Breadcrumb.Item>
          <Breadcrumb.Item>域名订单</Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <DomainNav />
      <div className={style.orderManageContent}>
        <Table
          locale={{ emptyText: <div /> }}
          className={`${edmStyle.contactTable}`}
          rowKey="contactEmail"
          loading={loading}
          columns={columns}
          dataSource={list}
          scroll={{ x: list.length ? 910 : 0 }}
          pagination={false}
        />
        {!loading && list.length === 0 && (
          <div className={style.emptyContainer}>
            <EmptyIcon />
            <span>暂未查询到订单</span>
            <button onClick={goBuy}>{getIn18Text('QUGOUMAI')}</button>
          </div>
        )}
      </div>
    </div>
  );
};
