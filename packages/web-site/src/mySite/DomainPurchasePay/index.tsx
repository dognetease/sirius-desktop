import React, { useState, useEffect, useRef } from 'react';
import { Button, Form, Input, message, Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { navigate } from '@reach/router';
import { api, apis, SiteApi, SystemApi, apiHolder, DataTrackerApi, DomainOrderConfirmReq, getIn18Text } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Breadcrumb from '@web-site/components/Breadcrumb';

import { ReactComponent as AlipayIcon } from '../../images/platform/alipay.svg';
import { ReactComponent as OnlineIcon } from '../../images/platform/online.svg';
import { ReactComponent as OfflineIcon } from '../../images/platform/offline.svg';
import { ReactComponent as InfoIcon } from '../../images/jichu_cuowutishi_mian.svg';
import { ReactComponent as SuccessIcon } from '../../images/success-icon.svg';
import styles from './style.module.scss';
import { goMySitePage, goOrderManage } from '../utils';
import TransferModal from './TransferModal';
import { getPayUrl } from '../utils';
import { getTransText } from '@/components/util/translate';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

interface PageQueryString {
  keyword: string;
  suffix: string;
  product?: string;
}

interface DomainPurchasePayProps {
  qs: PageQueryString; // url 参数
}

export default function DomainPurchasePay(props: DomainPurchasePayProps) {
  const { qs } = props;
  const [curentPaltform, setCurrentPaltform] = useState(0); // 默认支付方式选择支付宝
  const [data, setData] = useState<any>([{}]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  // 线下转账-汇款信息 弹窗
  const [transferInfoVisible, setTransferInfoVisible] = useState(false);
  const orderIdRef = useRef('');
  const transformInfoListRef = useRef<Array<{ name: string; value: string }>>([]);

  const goDomainSearchResult = () => {
    navigate(`#site?page=domainSearchResult&keyword=${history.state.keyword || ''}&suffix=${history.state.suffix || ''}`);
  };

  const goDomainPurchaseConfirm = () => {
    navigate(`#site?page=domainPurchaseConfirm`, {
      state: {
        domain: history.state.domain,
        underlinePrice: history.state.underlinePrice,
        actualPrice: history.state.actualPrice,
        keyword: history.state.keyword || '',
        suffix: history.state.suffix || '',
      },
    });
  };

  const goMyDomain = () => {
    navigate('#site?page=myDomain');
  };

  const goPurchaseCert = () => {
    const { domain } = history.state ?? {};
    navigate(`#site?page=purchaseCert&domain=${domain}`);
  };

  const fetchPayAccount = async () => {
    let data;
    try {
      data = await siteApi.getDomainPayAccount();
    } catch {}
    if (!data || !data.receivedPayBank) {
      message.error('获取汇款信息失败!');
      return Promise.reject([]);
    }
    const transformInfoList = [
      {
        name: '收款户名',
        value: data.accountName,
      },
      {
        name: '收款银行',
        value: data.bankAccount,
      },
      {
        name: '银行账号',
        value: data.receivedPayBank,
      },
    ];
    return transformInfoList;
  };

  useEffect(() => {
    if (!history.state || history.state.actualPrice == null || (!history.state.templateId && !history.state.brandCode)) {
      navigate(`#site?page=${qs.product === 'cert' ? 'myDomain' : 'domainSearchResult'}`);
    }
    if (history.state.orderId) {
      // 从订单列表的线下转账订单”去付款“跳转支付页面
      setCurrentPaltform(2);
      setLoading(true);
      fetchPayAccount()
        .then(list => {
          setLoading(false);
          transformInfoListRef.current = list;
          setTransferInfoVisible(true);
        })
        .catch(() => setLoading(false));
    }
    setData([
      {
        ...history.state,
        expire_time: '1年',
      },
    ]);
  }, []);

  const columns: ColumnsType<any> = [
    {
      title: '购买域名',
      dataIndex: 'domain',
    },
    {
      title: '持有者姓名(中文)',
      dataIndex: 'name_cn',
      // render: (value, record) => <EllipsisTooltip>{`${name_cn}`}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('SITE_YOUXIAOQI'),
      dataIndex: 'expire_time',
    },
    {
      title: '价格',
      dataIndex: 'price',
      render: (value, record) => (
        <span>
          <span className={styles.actualPrice}>{record.actualPrice}元</span>
          {record.actualPrice != record.underlinePrice ? <span className={styles.underlinePrice}>{record.underlinePrice}元</span> : null}
        </span>
      ),
    },
  ];

  const certColumns: ColumnsType<any> = [
    {
      title: '绑定域名',
      dataIndex: 'domain',
    },
    {
      title: getIn18Text('ZHENGSHULEIXING'),
      dataIndex: 'category',
    },
    {
      title: getIn18Text('ZHENGSHUPINPAI'),
      dataIndex: 'brand',
    },
    {
      title: getIn18Text('FUWUSHICHANG'),
      dataIndex: 'years',
      render: value => <span>{value / 12}年</span>,
    },
    {
      title: '价格',
      dataIndex: 'price',
      render: (value, record) => (
        <span>
          <span className={styles.actualPrice}>{record.actualPrice}元</span>
          {record.actualPrice != record.underlinePrice ? <span className={styles.underlinePrice}>{record.underlinePrice}元</span> : null}
        </span>
      ),
    },
  ];

  const platforms = [
    {
      icon: <AlipayIcon />,
      name: getIn18Text('ZHIFUBAO'),
      key: 'alipay', // 埋点参数
    },
    {
      icon: <OnlineIcon />,
      name: getIn18Text('WANGYINZHIFU'),
      key: 'online',
    },
    {
      icon: <OfflineIcon />,
      name: getIn18Text('XIANXIAZHUANZHANG'),
      key: 'offline',
    },
  ];

  // 提交订单
  const handleSubmit = async () => {
    trackApi.track('domain_submit', { from: platforms[curentPaltform].key });
    // console.log('curentPaltform', curentPaltform);

    // 提交订单
    setLoading(true);
    let submitRes;
    if (qs.product === 'cert') {
      submitRes = await siteApi.submitCertOrder({
        domain: history.state.domain,
        certProductCode: history.state.brandCode,
        serviceTime: history.state.years,
        platForm: curentPaltform + 1,
      });
    } else {
      submitRes = await siteApi.domainOrderSubmit({
        domain: history.state.domain,
        templateId: history.state.templateId,
        platForm: curentPaltform + 1,
      });
    }
    setLoading(false);

    // 同一个组织下只能有一个未支付订单
    if (submitRes.code == 50001007) {
      message.error('请先处理待支付订单');
      return;
    }
    if (submitRes.code == 50001008) {
      message.error('存在未完成的订单');
      return;
    }

    const { data: submitData } = submitRes;
    if (!submitData || !submitRes.success) {
      message.error('订单创建失败');
      return;
    }

    if (submitData.status == 2 || submitData.status == 5) {
      setSuccess(true);
      return;
    }

    orderIdRef.current = submitData.orderId;

    if (curentPaltform == 0 || curentPaltform == 1) {
      // 支付宝或网银支付
      await getPayUrl(submitData.orderId, submitData.platform);
      Modal.confirm({
        title: '是否完成支付？',
        okText: '支付完成',
        cancelText: '暂未支付',
        maskClosable: false,
        width: 400,
        centered: true,
        icon: <InfoIcon />,
        className: styles.payModal,
        maskStyle: {
          left: 0,
        },
        onOk: async () => {
          // 确认支付
          const confirmRes = await siteApi.domainOrderConfirm({
            orderId: submitData.orderId,
            platForm: curentPaltform + 1,
          });
          if (confirmRes.status == 2 || confirmRes.status == 5) {
            setSuccess(true);
            return;
          }
          goOrderManage();
        },
        onCancel: () => {
          goOrderManage();
        },
      });
    } else {
      // 线下转账
      setLoading(true);
      transformInfoListRef.current = await fetchPayAccount();
      setLoading(false);
      setTransferInfoVisible(true);
    }
  };

  // 线下转账-提交付款凭证
  const onTransferSubmit = async (params: Omit<DomainOrderConfirmReq, 'orderId'>) => {
    const res = await siteApi.domainOrderConfirm({
      ...params,
      orderId: history.state.orderId || orderIdRef.current,
    });
    goOrderManage();
  };

  if (success) {
    return <SuccessComp domain={history.state?.domain} isCert={qs.product === 'cert'} />;
  }

  return (
    <div className={styles.purchase}>
      <Breadcrumb>
        <Breadcrumb.Item onClick={qs.product === 'cert' ? goMyDomain : goDomainSearchResult}>
          {qs.product === 'cert' ? getIn18Text('WODEYUMING') : '搜索结果'}
        </Breadcrumb.Item>
        <Breadcrumb.Item onClick={qs.product === 'cert' ? goPurchaseCert : goDomainPurchaseConfirm}>{qs.product === 'cert' ? '购买证书' : '确认订单'}</Breadcrumb.Item>
        <Breadcrumb.Item>{getIn18Text('DINGDANXIANGQING')}</Breadcrumb.Item>
      </Breadcrumb>
      <div className={styles.main}>
        <div className={styles.mainTitle}>{getIn18Text('DINGDANXIANGQING')}</div>
        <div className={styles.mainDivider}></div>
        <Table
          className="edm-table"
          // className={styles.infoTable}
          rowKey="domain"
          columns={qs.product === 'cert' ? certColumns : columns}
          dataSource={data}
          pagination={false}
        />
        <div style={{ marginTop: '32px' }}>{getIn18Text('ZHIFUFANGSHI')}</div>
        <div className={styles.mainPlatform}>
          {platforms.map((item, index) => (
            <div
              key={item.name}
              className={styles.mainPlatformItem + (curentPaltform == index ? ' selected' : '')}
              onClick={() => {
                setCurrentPaltform(index);
              }}
            >
              {item.icon} {item.name}
            </div>
          ))}
        </div>
        <TransferModal
          transferInfoVisible={transferInfoVisible}
          onTransferInfoClose={() => {
            setTransferInfoVisible(false);
          }}
          price={history.state?.actualPrice || 0}
          onSubmit={onTransferSubmit}
          transformInfoList={transformInfoListRef.current}
        />

        <div className={styles.mainSubmit}>
          <div className={styles.mainPrice}>
            <span>应付款：</span>
            <span>¥</span>
            <span>{history.state?.actualPrice}</span>
          </div>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {getIn18Text('TIJIAODINGDAN')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SuccessComp(props: { domain: string; isCert: boolean }) {
  return (
    <div className={styles.success}>
      <div className={styles.successMain}>
        <div className={styles.successContent}>
          <SuccessIcon />
          <div className={styles.successTitle}>{getIn18Text('ZHIFUCHENGGONG')}!</div>
          {props.isCert && <div className={styles.successInfoM}>{getIn18Text('ZHENGSHUXUYAOBUSHUHOUCAINENGSHENGXIAO')}</div>}
          <div className={styles.successInfo}>
            {props.isCert ? '域名：' : '订单信息：'}
            {props.domain}
          </div>
          <div className={styles.successButtons}>
            <Button
              onClick={() => {
                goMySitePage();
                trackApi.track('domain_submit', { click: 'knew' });
              }}
            >
              {props.isCert ? '返回' : getIn18Text('SITE_ZHIDAOLE')}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                navigate(props.isCert ? '#site?page=myCert' : '#site?page=myDomain');
                trackApi.track('domain_submit', { click: 'domain_manage' });
              }}
            >
              {props.isCert ? getIn18Text('QUBUSHU') : '域名管理'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
