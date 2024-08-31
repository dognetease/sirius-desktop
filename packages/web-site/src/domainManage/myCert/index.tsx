import React, { useState, useEffect } from 'react';
import { Table, Input, message } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { navigate } from '@reach/router';
import dayjs from 'dayjs';
import { api, apis, SiteApi, apiHolder, DataTrackerApi, getIn18Text } from 'api';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import style from './style.module.scss';
import edmStyle from '@web-edm/edm.module.scss';
import Breadcrumb from '@web-site/components/Breadcrumb';
import { ReactComponent as QuestionIcon } from '../../images/question.svg';
import { ReactComponent as EmptyIcon } from '../../images/empty-1.svg';
import { ReactComponent as EditIcon } from '../../images/edit.svg';
import { ReactComponent as SuccessIcon } from '../../images/success-icon.svg';
// import { openWebUrlWithLoginCode } from '@web-common/utils/utils';
import { downloadImg } from '@web-mail/components/ReadMail/util';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { DomainNav } from '../../components/DomainNav';

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

export interface CertItem {
  certId: string;
  certName: string;
  domain: string;
  expireTime: number;
  expired: boolean;
  domainCertId: string;
  orgId: string;
  type: number;
  validityPeriod: number;
  certStatus: number;
  downloadUrl: string;
}

export const Status = [getIn18Text('QIANFAZHONG'), getIn18Text('YIQIANFA'), getIn18Text('QIANFASHIBAI'), '已取消', '未知'];

export const MyCert = () => {
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [opLoading, setOpLoading] = useState(false);

  const startEditName = (record: CertItem) => {
    if (opLoading) return;
    const { certId, certName } = record;
    setEditId(certId);
    setEditName(certName);
  };

  const saveEditName = async () => {
    setEditId('');
    setEditName('');
    setOpLoading(true);
    const hide = message.loading('加载中', 0);
    try {
      await siteApi.updateCertName({ certId: editId, certName: editName });
    } finally {
      getOrderList();
      hide();
      setOpLoading(false);
    }
  };

  const columns: ColumnsType<CertItem> = [
    {
      title: getIn18Text('SSLZHENGSHUXINXI'),
      dataIndex: 'certId',
      width: '220px',
      ellipsis: true,
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('ZHENGSHUMINGCHENG'),
      width: '150px',
      ellipsis: true,
      dataIndex: 'certName',
      render: (value, record) => {
        const { certId } = record;
        if (editId === certId) {
          return <Input autoFocus className={style.certInput} value={editName} onChange={e => setEditName(e.target.value)} onBlur={saveEditName} maxLength={20} />;
        }
        return (
          <div className={style.certName}>
            <EllipsisTooltip>{value || '未填写'}</EllipsisTooltip>
            {!opLoading && <EditIcon onClick={() => startEditName(record)} />}
          </div>
        );
      },
    },
    {
      title: '绑定域名',
      dataIndex: 'domain',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('SITE_YOUXIAOQI'),
      dataIndex: 'validityPeriod',
      render: value => <EllipsisTooltip>{!value ? '-' : value / 12 >= 1 ? `${value / 12}年` : `${value}${getIn18Text('GEYUE')}`}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('DAOQISHIJIAN'),
      dataIndex: 'expireTime',
      render: value => <EllipsisTooltip>{value ? dayjs(value).format('YYYY-MM-DD') : '-'}</EllipsisTooltip>,
    },
    {
      title: '签发状态',
      dataIndex: 'expired',
      render: (value, record) => <EllipsisTooltip>{value ? getIn18Text('YIGUOQI') : Status[record.certStatus]}</EllipsisTooltip>,
    },
    {
      title: '部署状态',
      dataIndex: 'domainCertId',
      render: value => <EllipsisTooltip>{value ? getIn18Text('YIBUSHU') : getIn18Text('WEIBUSHU')}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('CAOZUO'),
      dataIndex: 'certId',
      fixed: 'right',
      width: '150px',
      render: (value, record) => {
        const { domainCertId, certId, certStatus, expired, downloadUrl, domain } = record;
        const res = [];
        if (certStatus === 1 && !expired) {
          if (downloadUrl) {
            res.push(
              <div
                className={style.link}
                onClick={() => {
                  if (opLoading) return;
                  downloadImg(downloadUrl, '证书.zip');
                }}
              >
                {getIn18Text('XIAZAI')}
              </div>
            );
          }
          if (!domainCertId) {
            res.push(
              <div className={style.link} onClick={() => deployCert(certId, domain, record.expireTime)}>
                部署
              </div>
            );
          }
        }
        if (!res.length) res.push('-');
        return <div style={{ display: 'flex' }}>{res}</div>;
      },
    },
  ];

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<CertItem[]>([]);
  const [showDeploySuccess, setShowDeploySuccess] = useState(false);
  const [expireTime, setExpireTime] = useState(0);

  const deployCert = (certId: string, domain: string, time: number) => {
    setExpireTime(time);
    if (list.some(i => i.domain === domain && i.domainCertId && !i.expired && i.certStatus === 1)) {
      SiriusModal.confirm({
        title: '确定要部署新证书吗？',
        content: '部署新证书后，原证书将不会保留',
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          deployCertFunc(certId);
        },
      });
    } else {
      deployCertFunc(certId);
    }
  };

  const deployCertFunc = async (certId: string) => {
    if (opLoading) return;
    const hide = message.loading('加载中', 0);
    setOpLoading(true);
    try {
      const res = await siteApi.deployCert({ certId });
      hide();
      if ([30001025, 40001003, 30001022, 30001029].includes(res.code)) {
        message.error('正在部署中，请稍后再试。');
        return;
      }
      if (!res.success) {
        message.error('部署失败，请稍后再试。');
        return;
      }
      setShowDeploySuccess(true);
      getOrderList();
    } finally {
      hide();
      setOpLoading(false);
    }
  };

  const goMyDomain = () => {
    navigate('#site?page=myDomain');
  };

  const getOrderList = async () => {
    setLoading(true);
    try {
      const orderList = await siteApi.certList({});
      setList(orderList ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOrderList();
  }, []);

  // const goHelpCenter = () => {
  //   // window.open('https://waimao.163.com/knowledgeCenter#/d/1649407615124459521.html');
  //   openWebUrlWithLoginCode('https://waimao.163.com/knowledgeCenter#/d/1649407615124459521.html');
  // };

  return (
    <div className={style.myCert}>
      <div className={style.myCertHeader}>
        <Breadcrumb>
          <Breadcrumb.Item onClick={goMyDomain}>域名管理</Breadcrumb.Item>
          <Breadcrumb.Item>证书管理</Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <DomainNav />
      <div className={opLoading ? style.myCertContentLoading : style.myCertContent}>
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
          </div>
        )}
      </div>
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
