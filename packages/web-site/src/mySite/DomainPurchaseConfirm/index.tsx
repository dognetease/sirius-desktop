import React, { useState, useEffect, useRef } from 'react';
import { Button, message, Radio, Table, Drawer } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { navigate } from '@reach/router';
import { api, apis, SiteApi, SystemApi, apiHolder, DataTrackerApi } from 'api';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import Breadcrumb from '@web-site/components/Breadcrumb';

import { ReactComponent as EmptyIcon } from '../../images/empty-1.svg';
import styles from './style.module.scss';
import infoStyle from '../../domainManage/infoTemplate/style.module.scss';
import { CheckInfoTemplate } from '../../domainManage/checkInfoTemplate';
import { getTransText } from '@/components/util/translate';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

interface ListItem {
  name: string;
  status: number; // 审核状态，0:未实名;1:实名成功;2:注册局审核中;3:实名拒绝;4:实名拒绝;5:等待上报;
  templateId: string;
  email: string;
  type: 'I' | 'E'; // 持有者类型，I:表示个人；E:表示企业
}

export default function DomainPurchaseConfirm() {
  const [type, setType] = useState('I'); // 持有者类型
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);

  useEffect(() => {
    if (!history.state || history.state.actualPrice == null) {
      navigate('#site?page=domainSearch');
    }
  }, []);

  const onTypeChange = (e: RadioChangeEvent) => {
    // console.log('radio checked', e.target.value);
    setType(e.target.value);
    setSelectedRowKeys([]);
  };

  const columns: ColumnsType<ListItem> = [
    {
      title: '持有者姓名(中文)',
      dataIndex: 'name',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: '持有者类型',
      dataIndex: 'type',
      render: value => <EllipsisTooltip>{value === 'I' ? '个人' : '企业/组织'}</EllipsisTooltip>,
    },
    {
      title: '模板状态',
      dataIndex: 'status',
      render: value => (
        <>
          {value === 2 && (
            <div className={infoStyle.statusWarn}>
              <span />
              审核中
            </div>
          )}
          {value === 4 && (
            <div className={infoStyle.statusSuccess}>
              <span />
              审核通过
            </div>
          )}
          {value === 1 && (
            <div className={infoStyle.statusFail}>
              <span />
              信息错误
            </div>
          )}
          {value === 3 && (
            <div className={infoStyle.statusFail}>
              <span />
              审核失败
            </div>
          )}
        </>
      ),
    },
    {
      title: '操作',
      dataIndex: 'templateId',
      render: value => (
        <div className={infoStyle.operator}>
          <div
            className={infoStyle.link}
            onClick={() => {
              goCheckInfoTemplate(value);
              trackApi.track('infotempl_view');
            }}
          >
            查看
          </div>
        </div>
      ),
    },
  ];

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<ListItem[]>();
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
  });
  const [currentTemplateId, setCurrentTemplateId] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);

  const goCreateTemplate = () => {
    navigate('#site?page=createInfoTemplate');
  };

  const goCheckInfoTemplate = (id: string) => {
    setCurrentTemplateId(id);
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setCurrentTemplateId('');
    setDrawerVisible(false);
  };

  // 获取信息模板列表
  const getTemplateList = async () => {
    try {
      setLoading(true);
      const { data, total } = await siteApi.domainTemplateList({
        pageNo: pagination.page,
        pageSize: pagination.pageSize,
        type,
        status: 4, // 只展示审核通过的信息模板
      });
      setTotalRecords(total || 0);
      setList(data);
      if (data?.[0]) {
        setSelectedRowKeys([data[0].templateId]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTemplateList();
  }, [pagination, type]);

  // 点击确认按钮
  const goDomainPurchasePayPage = () => {
    trackApi.track('infotempl_sure');
    const templateId = selectedRowKeys[0];
    if (!templateId) {
      message.error('请选择一个信息模板！');
      return;
    }
    const selectRow = list?.find(row => row.templateId == templateId);
    if (!selectRow) {
      return;
    }
    navigate('#site?page=domainPurchasePay', {
      state: {
        domain: history.state.domain,
        name_cn: selectRow.name,
        actualPrice: history.state.actualPrice,
        underlinePrice: history.state.underlinePrice,
        templateId,
        keyword: history.state.keyword,
        suffix: history.state.suffix,
      },
    });
  };

  return (
    <div className={styles.purchase}>
      <Breadcrumb>
        <Breadcrumb.Item
          onClick={() => {
            navigate(`#site?page=domainSearchResult&keyword=${history.state.keyword || ''}&suffix=${history.state.suffix || ''}`);
          }}
        >
          搜索结果
        </Breadcrumb.Item>
        <Breadcrumb.Item>确认订单</Breadcrumb.Item>
      </Breadcrumb>
      <div className={styles.main}>
        <div className={styles.mainTitle}>确认订单</div>
        <div className={styles.mainDivider}></div>
        <div className={styles.mainTips}>
          <div>温馨提示</div>
          <p>
            1.按照域名注册局实名制政策，必须通过实名认证，此次交易才能成功，请选择以下已实名模板；如果没有，请立即去创建实名模板。一旦发生持有人变更，则视为域名权属转移。
          </p>
          <p>2.根据ICANN政策要求，域名注册人Email必须真实准确，为了方便日后管理使用，强烈建议您及时对信息模板中的Email邮箱进行验证。</p>
          <p>3.建议您邮箱认证完成后尽快完成实名认证，信息模板实名认证后可直接用于域名注册、过户、转移等操作，加快操作审核进程。</p>
        </div>

        <div className={styles.mainGuide}>
          以下是您创建的实名认证信息模板，您可以直接选择使用或
          <a
            className={styles.mainGuideA}
            onClick={() => {
              goCreateTemplate();
              trackApi.track('infotempl_build1');
            }}
          >
            创建信息模板
          </a>
        </div>
        <div className={styles.mainType}>
          您的域名所有者信息为：
          <Radio.Group onChange={onTypeChange} value={type}>
            <Radio value="I">个人</Radio>
            <Radio value="E">企业</Radio>
          </Radio.Group>
        </div>
        <Table
          locale={{
            emptyText: loading ? (
              <div style={{ height: '150px' }}></div>
            ) : (
              <div className={styles.emptyContainer}>
                <EmptyIcon />
                <Button
                  type="primary"
                  onClick={() => {
                    goCreateTemplate();
                    trackApi.track('infotempl_build2');
                  }}
                >
                  创建模板
                </Button>
              </div>
            ),
          }}
          className="edm-table"
          // className={styles.infoTable}
          rowKey="templateId"
          loading={loading}
          columns={columns}
          dataSource={list}
          scroll={{ x: 900, y: 460 }}
          pagination={{
            style: {
              display: 'flex',
              alignItems: 'center',
              height: 56,
              margin: 0,
            },
            className: 'pagination-wrap',
            size: 'small',
            total: totalRecords,
            pageSize: pagination.pageSize,
            pageSizeOptions: ['20', '50', '100'],
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              setPagination({
                page,
                pageSize: pageSize as number,
              });
            },
            hideOnSinglePage: true,
          }}
          rowSelection={{
            type: 'radio',
            selectedRowKeys,
            onChange: (selectedRowKeys, selectedRows) => {
              console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
              setSelectedRowKeys(selectedRowKeys);
            },
          }}
        />
        {selectedRowKeys.length ? (
          <div className={styles.mainSubmit}>
            <Button type="primary" onClick={goDomainPurchasePayPage}>
              确认
            </Button>
          </div>
        ) : null}
      </div>
      <Drawer visible={drawerVisible} width={880} mask={false} closable={false} className={styles.drawer}>
        <div className={styles.drawerContainer}>
          <div className={styles.topContainer}>
            <CheckInfoTemplate qs={{ templateId: currentTemplateId }} isComponent={true} onClose={closeDrawer} />
          </div>
          <div className={styles.bottomContainer}>
            <button className={styles.submitBtn} onClick={closeDrawer}>
              确定
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
