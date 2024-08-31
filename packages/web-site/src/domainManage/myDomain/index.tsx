import React, { useState, useEffect } from 'react';
import { Table, Spin, message } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { navigate } from '@reach/router';
import { Select } from '@/components/Layout/Customer/components/commonForm/Components';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { downloadImg } from '@web-mail/components/ReadMail/util';
import style from './style.module.scss';
import edmStyle from '@web-edm/edm.module.scss';
import { api, apis, SiteApi, apiHolder, DataTrackerApi, getIn18Text } from 'api';
import Breadcrumb from '@web-site/components/Breadcrumb';
import { ReactComponent as QuestionIcon } from '../../images/question.svg';
import { ReactComponent as EmptyIcon } from '../../images/empty-1.svg';
import { ReactComponent as InfoIcon } from '../../images/info.svg';
import { ReactComponent as DownloadIcon } from '../../images/download.svg';
import { ReactComponent as SuccessIcon } from '../../images/success-icon.svg';
// import { openKnowledgeCenter, openWebUrlWithLoginCode } from '@web-common/utils/utils';
import { CertItem, Status } from '../myCert';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { DomainNav } from '../../components/DomainNav';

interface DomainItem {
  cdnSslId: string;
  domain: string;
  registerDomain: string;
  expireTime: number;
  orgId: string;
  registerTime: number;
  siteId: string;
  siteName: string;
  status: number;
  siteBindStatus: number;
  certDomain: string;
}

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

export const MyDomain = () => {
  const columns: ColumnsType<DomainItem> = [
    {
      title: getIn18Text('YUMING'),
      dataIndex: 'domain',
      render: (value, record) => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('SITE_CHUANGJIANSHIJIAN'),
      dataIndex: 'registerTime',
      render: value => <EllipsisTooltip>{value ? dayjs(value).format('YYYY-MM-DD') : '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('DAOQISHIJIAN'),
      dataIndex: 'expireTime',
      render: value => <EllipsisTooltip>{value ? dayjs(value).format('YYYY-MM-DD') : '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('ZHUANGTAI'),
      dataIndex: 'expireTime',
      render: (value, record) => {
        const { status } = record;
        if (status === 0)
          return (
            <div className={style.checking}>
              <span />
              审核中
            </div>
          );
        if (value && Date.now() - value >= 0)
          return (
            <div className={style.expire}>
              <span />
              {getIn18Text('YIGUOQI')}
            </div>
          );
        return (
          <div className={style.valid}>
            <span />
            {getIn18Text('SHENGXIAOZHONG')}
          </div>
        );
      },
    },
    {
      title: '站点',
      dataIndex: 'siteName',
      render: (value, record) => (
        <EllipsisTooltip>
          {value ? (
            value
          ) : record.status !== 0 ? (
            <span className={record.expireTime && Date.now() - record.expireTime >= 0 ? style.expire : style.error}>未绑定</span>
          ) : (
            '-'
          )}
        </EllipsisTooltip>
      ),
    },
    {
      title: '操作',
      fixed: 'right',
      dataIndex: 'domain',
      width: 346,
      render: (value, record) => {
        const { expireTime, siteId, cdnSslId, siteBindStatus, status, registerDomain, certDomain } = record;
        let res = [];
        if (status === 0) {
          res.push(<span className={style.disableText}>-</span>);
        } else if (siteId && siteBindStatus < 7) {
          res.push(
            <div className={style.checking} style={{ marginRight: '16px' }}>
              绑定中
            </div>
          );
        } else if (siteId && siteBindStatus >= 7) {
          res.push(
            <div className={style.operator} onClick={() => goPurchaseCert(record)}>
              {getIn18Text('GOUMAISSLZHENGSHU')}
            </div>
          );
        } else if (expireTime && Date.now() - expireTime < 0) {
          if (!siteId) {
            res.push(
              <div className={style.operator} onClick={() => showModal(record)}>
                绑定站点
              </div>
            );
          }
        }
        if (siteId && siteBindStatus >= 7 && certDomain && status !== 0) {
          res.push(
            <div className={style.operator} onClick={() => checkCertList(record.domain)}>
              {getIn18Text('CHAKANSSLZHENGSHU')}
            </div>
          );
        }
        if (registerDomain && status !== 0) {
          res.push(
            <div className={style.operator} onClick={() => checkCert(record)}>
              {getIn18Text('CHAKANYUMINGZHENGSHU')}
            </div>
          );
        }
        if (registerDomain && status !== 0) {
          res.push(
            <div className={style.operator} onClick={() => resolveDomain(record)}>
              解析
            </div>
          );
        }
        if (res.length === 0) {
          res.push(<span className={style.disableText}>-</span>);
        }
        return <div style={{ display: 'flex', alignItems: 'center' }}>{res}</div>;
      },
    },
  ];

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<DomainItem[]>([]);
  const [siteOptions, setSiteOptions] = useState<{ value: string; label: string }[]>([]);
  const [siteMap, setSiteMap] = useState<{ [key: string]: string }>({});
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedHost, setSelectedHost] = useState('');
  const [checkError, setCheckError] = useState(false);
  const [submiting, setSubmiting] = useState(false);
  const [showCert, setShowCert] = useState(false);
  const [certLink, setCertLink] = useState('');
  const [certListLoading, setCertListLoading] = useState(false);
  const [certList, setCertList] = useState<CertItem[]>([]);
  const [showCertList, setShowCertList] = useState(false);
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
    } finally {
      setCertListLoading(false);
    }
  };

  const getDomainList = async () => {
    setLoading(true);
    try {
      const domainList = await siteApi.listDomain();
      setList(domainList ?? []);
    } finally {
      setLoading(false);
    }
  };

  const getAllBindSite = async () => {
    try {
      const allBindSite = await siteApi.getSiteDomainList();
      const allSiteMap: { [key: string]: string } = {};
      const options = (allBindSite ?? []).map(({ siteId, siteName }: { siteId: string; siteName: string }) => {
        allSiteMap[siteId] = siteName;
        return {
          value: siteId,
          label: siteName,
        };
      });
      setSiteOptions(options);
      setSiteMap(allSiteMap);
    } catch {}
  };

  const bindSite = async (siteId: string, domain: string) => {
    setSubmiting(true);
    try {
      const res = await siteApi.bindSite({ siteId, domain });
      return res;
    } catch {
      return false;
    } finally {
      setSubmiting(false);
    }
  };

  useEffect(() => {
    getDomainList();
    getAllBindSite();
  }, []);

  const showModal = async (val: DomainItem) => {
    const { domain, siteId } = val;
    await getAllBindSite();

    setSelectedHost(domain);
    setSelectedSiteId(siteId);
    setSelectedSiteId(siteOptions[0]?.value);
    if (siteOptions.length) {
      setShowSelectModal(true);
    } else {
      setShowInfoModal(true);
    }
  };

  const closeSelectModal = () => {
    trackApi.track('bindingsite', { click: 'cancel' });
    setCheckError(false);
    setShowSelectModal(false);
  };

  const closeInfoModal = () => {
    trackApi.track('nosite', { click: 'cancel' });
    setShowInfoModal(false);
  };

  const closeShowCert = () => {
    setShowCert(false);
    setCertLink('');
  };

  const handleSelect = (value: any) => {
    setCheckError(false);
    setSelectedSiteId(value);
  };

  const goSite = () => {
    trackApi.track('nosite', { click: 'buildsite' });
    navigate('#site?page=mySite');
  };

  const goBuy = () => {
    trackApi.track('buydomain', { from: 'manage' });
    navigate('#site?page=domainSearch');
  };

  const goDomain = async () => {
    trackApi.track('bindingsite', { click: 'sure' });
    if (!selectedSiteId) {
      setCheckError(true);
    } else {
      const res = await bindSite(selectedSiteId, selectedHost);
      if (res) {
        navigate(`#site?page=domain&siteId=${selectedSiteId}&host=${selectedHost}&siteName=${siteMap[selectedSiteId] ?? ''}`);
      }
    }
  };

  const goPurchaseCert = (val: DomainItem) => {
    trackApi.track('buycertificate1');
    const { domain, siteId } = val;
    navigate(`#site?page=purchaseCert&siteId=${siteId}&domain=${domain}`);
  };

  const checkCert = async (val: DomainItem) => {
    try {
      setShowCert(true);
      const certLink = await siteApi.getDomainCertLink({ domain: val.domain });
      setCertLink(certLink);
    } catch {}
  };

  //打开DNS解析页面（仅支持内部域名）
  const resolveDomain = async (val: DomainItem) => {
    try {
      const url = await siteApi.getDNSConfigPageLink({ domain: val.registerDomain });
      window.open(url);
    } catch {
      message.error('解析失败，请稍后再试');
    }
  };

  // const goHelpCenter = () => {
  //   // window.open('https://waimao.163.com/knowledgeCenter#/d/1649407615124459521.html');
  //   openKnowledgeCenter('/knowledgeCenter#/d/1649407615124459521.html');
  // };

  return (
    <div className={style.myDomain}>
      <div className={style.myDomainHeader}>
        <Breadcrumb>
          <Breadcrumb.Item onClick={getDomainList}>域名管理</Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <DomainNav />
      <div className={style.myDomainContent}>
        <Table
          locale={{ emptyText: <div /> }}
          className={`${edmStyle.contactTable}`}
          rowKey="contactEmail"
          loading={loading}
          columns={columns}
          dataSource={list}
          scroll={{ x: list.length ? 930 : 0 }}
          pagination={false}
        />
        {!loading && list.length === 0 && (
          <div className={style.emptyContainer}>
            <EmptyIcon />
            <span>还没域名？限免域名选购</span>
            <button onClick={goBuy}>{getIn18Text('QUGOUMAI')}</button>
          </div>
        )}
      </div>
      <Modal
        zIndex={800}
        visible={showSelectModal}
        getContainer={false}
        width={480}
        className={style.selectModal}
        title="选择站点"
        footer={null}
        maskClosable={false}
        destroyOnClose={true}
        onCancel={closeSelectModal}
        onOk={goDomain}
      >
        <div className={checkError ? style.errorSelectContainer : style.selectContainer}>
          <Select value={selectedSiteId} style={{ width: '100%' }} onChange={handleSelect} options={siteOptions} placeholder="请选择一个站点名称" />
          {checkError && <div className={style.errorTip}>请选择一个站点名称</div>}
        </div>
        <div className={style.btnGroup}>
          <button className={style.cancelBtn} onClick={closeSelectModal}>
            取消
          </button>
          <button className={submiting ? style.submitBtnDisabled : style.submitBtn} onClick={goDomain}>
            {submiting ? '提交中...' : '确定'}
          </button>
        </div>
      </Modal>
      <Modal
        zIndex={800}
        visible={showInfoModal}
        getContainer={false}
        width={400}
        className={style.selectModal}
        title={
          <div className={style.infoTitle}>
            <InfoIcon />
            提示
          </div>
        }
        maskClosable={false}
        destroyOnClose={true}
        okText="去创建"
        onCancel={closeInfoModal}
        onOk={goSite}
      >
        <div className={style.infoContent}>暂未查询到有效站点！</div>
      </Modal>
      <Modal
        zIndex={800}
        visible={showCert}
        getContainer={false}
        width={480}
        className={style.certModal}
        title="查看证书"
        maskClosable={false}
        destroyOnClose={true}
        footer={null}
        onCancel={closeShowCert}
      >
        {certLink ? (
          <div className={style.certLinkContainer}>
            <img className={style.certLink} src={certLink} />
            <button className={style.certLinkButton} onClick={() => downloadImg(certLink, '域名证书.png')}>
              <DownloadIcon />
              下载证书
            </button>
          </div>
        ) : (
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
        )}
      </Modal>
      <Modal
        zIndex={800}
        visible={showCertList}
        getContainer={false}
        width={480}
        className={style.certListModal}
        title={getIn18Text('CHAKANSSLZHENGSHU')}
        cancelButtonProps={{ style: { display: 'none' } }}
        okButtonProps={{ style: { background: '#4C6AFF' } }}
        maskClosable={false}
        destroyOnClose={true}
        okText={getIn18Text('SITE_ZHIDAOLE')}
        onOk={closeCertList}
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
          <div className={style.certList}>
            {certList.map(i => (
              <div key={i.certId} className={style.certListItem}>
                <div className={style.contentLine}>
                  <div className={style.contentLeft}>
                    <div className={style.contentLabel}>证书ID：</div>
                    <div className={style.content}>
                      {i.certId}
                      <span className={style.certType}>{['外部证书', getIn18Text('MIANFEIZHENGSHU'), '付费证书'][i.type]}</span>
                      <span className={i.domainCertId ? style.active : ''}>{i.domainCertId ? getIn18Text('YIBUSHU') : getIn18Text('WEIBUSHU')}</span>
                    </div>
                  </div>
                  <div className={style.contentRight}>{i.expired ? getIn18Text('YIGUOQI') : Status[i.certStatus]}</div>
                </div>
                <div className={style.contentLine}>
                  <div className={style.contentLeft}>
                    <div className={style.contentLabel}>{getIn18Text('SITE_YOUXIAOQI')}：</div>
                    <div className={style.content}>
                      {!i.validityPeriod ? '-' : i.validityPeriod / 12 >= 1 ? `${i.validityPeriod / 12}年` : `${i.validityPeriod}${getIn18Text('GEYUE')}`}
                    </div>
                  </div>
                </div>
                <div className={style.contentLine}>
                  <div className={style.contentLeft}>
                    <div className={style.contentLabel}>{getIn18Text('DAOQISHIJIAN')}：</div>
                    <div className={style.content}>{i.expireTime ? dayjs(i.expireTime).format('YYYY-MM-DD') : '-'}</div>
                  </div>
                  <div className={style.contentRight}>
                    {!i.domainCertId && !i.expired && i.certStatus === 1 ? (
                      <div className={style.certOperator} onClick={() => deployCert(i.certId, i.domain, i.expireTime)}>
                        部署
                      </div>
                    ) : null}
                    {!i.expired && i.certStatus === 1 && i.downloadUrl ? (
                      <div className={style.certOperator} onClick={() => downloadImg(i.downloadUrl, '证书.zip')}>
                        {getIn18Text('XIAZAI')}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
      <Modal
        zIndex={800}
        visible={showDeploySuccess}
        getContainer={false}
        width={400}
        className={style.deploySuccess}
        title=""
        footer={null}
        maskClosable={false}
        destroyOnClose={true}
        closable={false}
      >
        <div className={style.deploySuccessContainer}>
          <SuccessIcon />
          <div className={style.deploySuccessTitle}>SSL证书部署成功</div>
          <div className={style.deploySuccessInfo}>有效期至{expireTime ? dayjs(expireTime).format('YYYY年MM月DD日') : '-'}</div>
          <button
            className={style.submitBtn}
            onClick={() => {
              setShowDeploySuccess(false);
              setExpireTime(0);
            }}
          >
            {getIn18Text('SITE_ZHIDAOLE')}
          </button>
        </div>
      </Modal>
    </div>
  );
};
