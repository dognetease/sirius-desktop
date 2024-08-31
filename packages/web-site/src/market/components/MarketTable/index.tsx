import React from 'react';
import { Divider, Dropdown, Menu, Space, Table } from 'antd';

import { api, apis, SiteApi, apiHolder, DataTrackerApi, DeleteMarketReq, MarketPageItem, getIn18Text } from 'api';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { STATUS_ENUM } from '@web-site/mySite/constants';
import StatusTag from '@web-site/mySite/components/StatusTag';
import { ReactComponent as ArrowDown } from '../../../images/arrow-down.svg';
import styles from './style.module.scss';
import { navigateToEditor } from '../../utils';
import TableImpty from '../../../images/table-empty.png';

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface MarketTableProps {
  showUpdateModal: (data: any) => void;
  loading: boolean;
  dataSource: Array<MarketPageItem>;
  getMarketList: () => Promise<any>;
  openCreateMarket: () => void;
}

/**
 * 营销落地页列表
 */
const MarketTable = (props: MarketTableProps) => {
  const { loading, dataSource, getMarketList } = props;

  // 弹窗确认是否删除营销落地页
  const handleDelete = (params: DeleteMarketReq) => {
    trackApi.track('marketing_delete_winshow'); // 点击删除，弹窗出现

    SiriusModal.confirm({
      title: '确定要删除吗？',
      content: '删除后该营销落地页将无法访问',
      okText: '确定',
      cancelText: '取消',
      className: styles.confirm,
      okButtonProps: {
        style: {
          background: '#4c6aff',
        },
      },
      onOk: async () => {
        try {
          await siteApi.deleteMarket(params);
          Toast.success({ content: '删除营销落地页成功！' });
          getMarketList();
          trackApi.track('marketing_delete_winsucc'); // 删除成功（点击确定）
        } catch (e) {
          Toast.error({ content: '删除站点失败！' });
        }
      },
    });
  };

  // 打开编辑弹窗
  const openUpdate = (record: MarketPageItem) => {
    props.showUpdateModal(record);
  };

  const columns = [
    {
      title: getIn18Text('LUODIYE'),
      dataIndex: 'page',
      width: '39%',
      ellipsis: true,
      render: (text: undefined, record: any) => {
        // let customDomain = record.siteBindDomainList?.[0];
        // let domainStatus = customDomain?.domainStatus as number;
        // let indexUrl = domainStatus >= 7 ? customDomain?.customIndexUrl : record.indexUrl;

        const domainList = record.siteBindDomainList?.filter((d: any) => d.domainStatus > 3); // 已生效的域名
        const customDomain = domainList?.[0];
        const indexUrl = customDomain ? customDomain.customIndexUrl : record.indexUrl;

        return (
          <div className={styles.page}>
            <img src={record.thumbnail} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className={styles.title}>
                <EllipsisTooltip>{record.pageName}</EllipsisTooltip>
              </div>
              <a className={styles.url} href={indexUrl} target="_blank">
                <EllipsisTooltip>{indexUrl}</EllipsisTooltip>
              </a>
            </div>
          </div>
        );
      },
    },
    {
      title: getIn18Text('ZHUANGTAI'),
      dataIndex: 'status',
      render(text: STATUS_ENUM) {
        return <StatusTag status={text} />;
      },
    },
    {
      title: getIn18Text('JINRILIULAN'),
      dataIndex: 'viewNum',
      render(text: string) {
        return <span>{text || '-'}</span>;
      },
    },
    {
      title: getIn18Text('JINRILIUZI'),
      dataIndex: 'clueNum',
      render(text: string) {
        return <span>{text || '-'}</span>;
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      dataIndex: 'operate',
      width: '20%',
      render: (text: undefined, record: any) => {
        return (
          <Space className={styles.operate} size={2}>
            <a
              onClick={() => {
                navigateToEditor(record.siteId, record.pageId);
                trackApi.track('marketing_list_edit');
              }}
            >
              {getIn18Text('ZHUANGXIU')}
            </a>
            <Divider type="vertical" style={{ marginLeft: '15px' }} />
            <Dropdown
              overlay={
                <Menu className={styles.optMenu}>
                  <Menu.Item
                    onClick={() => {
                      openUpdate(record);
                      trackApi.track('marketing_list_change');
                    }}
                  >
                    {getIn18Text('BIANJI')}
                  </Menu.Item>
                  <Menu.Item onClick={() => handleDelete({ siteId: record.siteId, id: record.id, pageId: record.pageId, code: record.code })}>
                    {getIn18Text('SHANCHU')}
                  </Menu.Item>
                </Menu>
              }
            >
              <a>
                {getIn18Text('GENGDUO')} <ArrowDown style={{ marginBottom: -3 }} />
              </a>
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  // 空白页点击立即新建
  const handleNullClick = () => {
    props.openCreateMarket();
    trackApi.track('marketing_null_click');
  };

  const locale = {
    emptyText: loading ? (
      <div style={{ height: '98px' }}></div>
    ) : (
      <div className={styles.empty}>
        <div style={{ flex: 2 }}></div>
        <div className={styles.center}>
          <img src={TableImpty} />
          <div className={styles.title}>{getIn18Text('YINGXIAOLUODIYE')}</div>
          <p>可介绍公司或特色商品，快速拿到留资线索</p>
          <button className={styles.button} onClick={handleNullClick}>
            立即新建
          </button>
        </div>
        <div style={{ flex: 3 }}></div>
      </div>
    ),
  };

  return (
    <div className={styles.box}>
      <Table columns={columns} dataSource={dataSource} pagination={false} loading={loading} locale={locale} />
    </div>
  );
};

export default MarketTable;
