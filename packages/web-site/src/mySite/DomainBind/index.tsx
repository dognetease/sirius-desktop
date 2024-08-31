import React, { useState, useEffect, useRef } from 'react';
import { Spin, message } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { navigate } from '@reach/router';
import { AddDomainCertReq, api, apis, SiteApi, SystemApi, apiHolder, DataTrackerApi, getIn18Text } from 'api';

import Toast from '@web-common/components/UI/Message/SiriusMessage';
import Breadcrumb from '@web-site/components/Breadcrumb';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { downloadImg } from '@web-mail/components/ReadMail/util';
import { useOpenHelpCenter } from '@web-common/utils/utils';
import { ReactComponent as QuestionIcon } from '../../images/question.svg';
import { ReactComponent as SuccessIcon } from '../../images/success-icon.svg';
import { ReactComponent as AddIcon } from '../../images/add.svg';
import { ReactComponent as EmptyIcon } from '../../images/empty-1.svg';
import styles from './style.module.scss';
import HttpsModal from '../components/HttpsModal';
import { DOMAIN_STATUS } from '../constants';
import { goMySitePage, isValidDomain } from '../utils';
import { CertItem, Status } from '@web-site/domainManage/myCert';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

interface DomainInfo {
  domain: string; // 域名
  orgId: string; // 组织ID
  recorded: boolean; // 是否备案
  siteId: string; // 站点ID
  status: DOMAIN_STATUS; // 域名状态
  recordNo: string; // 网安备案号
  icpCode: string; // icp备案号
}

interface PageQueryString {
  siteId: string;
  host: string; // 默认域名
  siteName: string;
}
interface DomainBindProps {
  qs: PageQueryString; // url 参数
}

export default function DomainBind(props: DomainBindProps) {
  const { siteId, host, siteName } = props.qs;
  // 刚进入页面getDomainList接口loading
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<Array<DomainInfo>>([]);
  const [httpsModelVisible, setHttpsModelVisible] = useState(false);
  const certInfoRef = useRef();
  const currentDomainInfo = useRef<DomainInfo>();
  const openHelpCenter = useOpenHelpCenter();

  // 部署证书弹窗
  const [showCertList, setShowCertList] = useState(false);
  const [certListLoading, setCertListLoading] = useState(false);
  const [certList, setCertList] = useState<CertItem[]>([]);
  const [showDeploySuccess, setShowDeploySuccess] = useState(false);
  const [expireTime, setExpireTime] = useState(0);

  const checkCertList = async (domain: string) => {
    setShowCertList(true);
    setCertListLoading(true);
    try {
      const certList = await siteApi.certList({ domain });
      setCertList(certList ?? []);
    } finally {
      setCertListLoading(false);
    }
  };

  const closeCertList = () => {
    setShowCertList(false);
    setCertList([]);
  };

  const deployCert = (certId: string, domain: string, time: number) => {
    setExpireTime(time);
    if (certList.some(i => i.domain === domain && i.domainCertId && !i.expired && i.certStatus === 1)) {
      SiriusModal.confirm({
        title: '确定要部署新证书吗？',
        content: '部署新证书后，原证书将不会保留',
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          deployCertFunc(certId, domain);
        },
      });
    } else {
      deployCertFunc(certId, domain);
    }
  };

  const deployCertFunc = async (certId: string, domain: string) => {
    setCertListLoading(true);
    try {
      const res = await siteApi.deployCert({ certId });
      if ([30001025, 40001003, 30001022, 30001029].includes(res.code)) {
        message.error('正在部署中，请稍后再试。');
        return;
      }
      if (!res.success) {
        message.error('部署失败，请稍后再试。');
        return;
      }
      setCertListLoading(false);
      setShowCertList(false);
      setShowDeploySuccess(true);

      fetchDomainListData(); // 刷新表格数据
    } finally {
      setCertListLoading(false);
    }
  };

  useEffect(() => {
    if (!siteId || !host) {
      // 页面 url 参数错误
      goMySitePage();
    }
    getDomainList();
    trackApi.track('site_changedomain_uv');
  }, []);

  const goHelpCenter = () => {
    // window.open('https://waimao.163.com/knowledgeCenter#/d/1649407615124459521.html');
    openHelpCenter('/d/1649407615124459521.html');
  };

  /**
   * 获取绑定域名列表(带Loading)
   */
  const getDomainList = async () => {
    setLoading(true);
    await fetchDomainListData();
    setLoading(false);
  };

  /**
   * 获取绑定域名列表(不带loading)
   */
  const fetchDomainListData = async () => {
    try {
      const data = await siteApi.getDomainList({ siteId });
      // console.log('getDomainList', data);
      if (Array.isArray(data)) {
        setDataSource(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 删除域名（解绑域名）
  const deleteRecord = (siteId: string, domain: string) => {
    SiriusModal.confirm({
      title: getIn18Text('SITE_YUMING_SHANCHU_TITLE'),
      content: getIn18Text('SITE_YUMING_SHANCHU_CONTENT'),
      okText: getIn18Text('QUEDING'),
      cancelText: getIn18Text('QUXIAO'),
      okType: 'primary',
      okButtonProps: {
        style: {
          background: '#FE5B4C',
        },
        danger: true,
      },
      onOk: async () => {
        // 修改了域名，解绑修改前的域名
        await siteApi.unBindDomain({ siteId, domain });
        await fetchDomainListData();
      },
    });
  };

  const addDomain = () => {
    navigate(`#site?page=domainDetail&siteId=${siteId}&host=${host}&siteName=${encodeURIComponent(siteName)}`);
  };

  const goDomainDetail = (record: DomainInfo) => {
    navigate(`#site?page=domainDetail&siteId=${siteId}&host=${host}&siteName=${encodeURIComponent(siteName)}&domain=${record.domain}`);
  };

  const openHttpsModal = async () => {
    if ((currentDomainInfo.current?.status as number) >= 7) {
      const data = await siteApi.getDomainCertInfo({ domain: currentDomainInfo.current!.domain });
      certInfoRef.current = data;
      setHttpsModelVisible(true);
    } else {
      Toast.error('域名生效后才能配置HTTPS');
    }
  };

  const addDomainCert = async (params: AddDomainCertReq) => {
    let res;
    try {
      res = await siteApi.addDomainCert(params);
    } catch (error) {
      Toast.error('添加 HTTPS 证书失败');
    }
    if (res.code == 40001009) {
      Toast.error('证书信息未发生变更！');
    } else if (res.code == 30001025) {
      Toast.success('添加证书失败，正在部署中，请稍后再试');
    } else if (res.code === 20001009) {
      Toast.error('域名正在备案中');
    } else if (res.data) {
      Toast.success('HTTPS 证书添加成功');
      setHttpsModelVisible(false);
      getDomainList();
    } else {
      Toast.error('添加 HTTPS 证书失败');
    }
  };

  const goPurchaseCert = () => {
    const { domain } = currentDomainInfo.current ?? {};
    navigate(`#site?page=purchaseCert&domain=${domain}`);
  };

  const columns: ColumnsType<DomainInfo> = [
    {
      title: getIn18Text('YUMING'),
      dataIndex: 'domain',
      width: '25%',
      ellipsis: true,
      render: (value, record) => {
        const schema = record.status >= 15 ? 'https://' : 'http://';
        const href = schema + value;
        return record.status >= 7 ? (
          <a href={href} target="_blank">
            {value}
          </a>
        ) : (
          <span>{value}</span>
        );
      },
    },
    {
      title: '绑定状态',
      dataIndex: 'domain',
      width: '25%',
      ellipsis: true,
      render: (value, record) => {
        const { status } = record;
        if (status < 3) {
          return (
            <span className={styles.status1}>
              <span></span>
              {getIn18Text('JIANCEZHONG')}
            </span>
          );
        }
        if (status < 7) {
          return (
            <span className={styles.status2}>
              <span></span>
              {getIn18Text('PEIZHIZHONG')}
            </span>
          );
        }
        return (
          <span className={styles.status3}>
            <span></span>
            {getIn18Text('BANGDINGCHENGGONG')}
          </span>
        );
      },
    },
    {
      title: '操作',
      dataIndex: 'domain',
      width: '25%',
      ellipsis: true,
      render: (value, record) => {
        return (
          <div className={styles.operation}>
            <a onClick={() => goDomainDetail(record)}>{getIn18Text('CHAKANJINDU')}</a>
            <div className={styles.operationDivider}></div>
            {record.status >= 7 ? (
              <>
                <a
                  onClick={() => {
                    currentDomainInfo.current = record;
                    checkCertList(record.domain);
                  }}
                >
                  部署证书
                </a>
                <div className={styles.operationDivider}></div>
              </>
            ) : null}
            <a onClick={() => deleteRecord(record.siteId, record.domain)}>删除</a>
          </div>
        );
      },
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Breadcrumb>
          <Breadcrumb.Item onClick={goMySitePage}>{getIn18Text('WODEZHANDIAN')}</Breadcrumb.Item>
          <Breadcrumb.Item>绑定域名</Breadcrumb.Item>
        </Breadcrumb>
        <div className={styles.headerRight}>
          <QuestionIcon />
          <span>域名管理常见问题</span>
          <div onClick={goHelpCenter}>点击了解</div>
          <Button btnType="primary" type="button" onClick={addDomain}>
            {getIn18Text('XINZENGYUMING')}
          </Button>
        </div>
      </div>
      <div className={styles.main}>
        <SiriusTable className={styles.detailTable} columns={columns} dataSource={dataSource} pagination={false} rowKey="domain" loading={loading} />
      </div>

      <Modal
        zIndex={800}
        visible={showCertList}
        getContainer={false}
        width={480}
        className={styles.certListModal}
        title={getIn18Text('BUSHUZHENGSHU')}
        cancelButtonProps={{ style: { display: 'none' } }}
        maskClosable={false}
        destroyOnClose={true}
        footer={null}
        onCancel={closeCertList}
      >
        {certListLoading ? (
          <div
            style={{
              width: '100%',
              height: '300px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Spin />
          </div>
        ) : (
          <div className={styles.certList}>
            {certList.map(i => (
              <div key={i.certId} className={styles.certListItem}>
                <div className={styles.contentLine}>
                  <div className={styles.contentLeft}>
                    <div className={styles.contentLabel}>证书ID：</div>
                    <div className={styles.content}>
                      {i.certId}
                      <span className={styles.certType}>{['外部证书', getIn18Text('MIANFEIZHENGSHU'), '付费证书'][i.type]}</span>
                      <span className={i.domainCertId ? styles.active : ''}>{i.domainCertId ? getIn18Text('YIBUSHU') : getIn18Text('WEIBUSHU')}</span>
                    </div>
                  </div>
                  <div className={styles.contentRight}>{i.expired ? getIn18Text('YIGUOQI') : Status[i.certStatus]}</div>
                </div>
                <div className={styles.contentLine}>
                  <div className={styles.contentLeft}>
                    <div className={styles.contentLabel}>{getIn18Text('SITE_YOUXIAOQI')}：</div>
                    <div className={styles.content}>
                      {!i.validityPeriod ? '-' : i.validityPeriod / 12 >= 1 ? `${i.validityPeriod / 12}年` : `${i.validityPeriod}${getIn18Text('GEYUE')}`}
                    </div>
                  </div>
                </div>
                <div className={styles.contentLine}>
                  <div className={styles.contentLeft}>
                    <div className={styles.contentLabel}>{getIn18Text('DAOQISHIJIAN')}：</div>
                    <div className={styles.content}>{i.expireTime ? dayjs(i.expireTime).format('YYYY-MM-DD') : '-'}</div>
                  </div>
                  <div className={styles.contentRight}>
                    {!i.domainCertId && !i.expired && i.certStatus === 1 ? (
                      <div className={styles.certOperator} onClick={() => deployCert(i.certId, i.domain, i.expireTime)}>
                        部署
                      </div>
                    ) : null}
                    {!i.expired && i.certStatus === 1 && i.downloadUrl ? (
                      <div className={styles.certOperator} onClick={() => downloadImg(i.downloadUrl, '证书.zip')}>
                        {getIn18Text('XIAZAI')}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {certList.length == 0 ? (
              <div className={styles.emptyContainer}>
                <EmptyIcon />
                <span>{getIn18Text('ZANWUSHUJU')}</span>
              </div>
            ) : null}
          </div>
        )}
        <div className={styles.footer}>
          <div className={styles.footerBtn} onClick={openHttpsModal}>
            <AddIcon /> {getIn18Text('SHOUDONGTIANJIAHTTPS')}
          </div>
          {currentDomainInfo.current?.status === DOMAIN_STATUS.SECURED && <div className={styles.footerTag}>已添加</div>}
          <div className={styles.operationDivider}></div>
          <div onClick={goPurchaseCert} className={styles.footerBtn}>
            购买证书
          </div>
          <Button btnType="primary" type="button" onClick={closeCertList}>
            {getIn18Text('SITE_ZHIDAOLE')}
          </Button>
        </div>
      </Modal>

      <Modal
        zIndex={800}
        visible={showDeploySuccess}
        getContainer={false}
        width={400}
        className={styles.deploySuccess}
        title=""
        footer={null}
        maskClosable={false}
        destroyOnClose={true}
        closable={false}
      >
        <div className={styles.deploySuccessContainer}>
          <SuccessIcon />
          <div className={styles.deploySuccessTitle}>SSL证书部署成功</div>
          <div className={styles.deploySuccessInfo}>有效期至{expireTime ? dayjs(expireTime).format('YYYY年MM月DD日') : '-'}</div>
          <button
            className={styles.submitBtn}
            onClick={() => {
              setShowDeploySuccess(false);
              setExpireTime(0);
            }}
          >
            {getIn18Text('SITE_ZHIDAOLE')}
          </button>
        </div>
      </Modal>

      <HttpsModal
        visible={httpsModelVisible}
        onClose={() => setHttpsModelVisible(false)}
        onOk={addDomainCert}
        domain={currentDomainInfo.current?.domain as string}
        initData={certInfoRef.current}
        siteId={siteId}
      />
    </div>
  );
}
