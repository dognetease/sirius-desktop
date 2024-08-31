import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Table, Tooltip } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import cloneDeep from 'lodash/cloneDeep';
import { navigate } from '@reach/router';

import { apiHolder, apis, DataTrackerApi, EdmProductDataApi, getIn18Text, ProductViewDataItem, ResponseProductViewData, UserClickDataItem } from 'api';
import { productStayTimeFormat } from '@web-edm/detail/product';
import { ReactComponent as Help } from '@/images/icons/customs/help.svg';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import Modal from '@/components/Layout/components/Modal/modal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { LeaveMessageModal } from '@web-site/../../web-edm/src/components/leaveMessageModal/leaveMessageModal';
import { UniDrawerModuleId } from '@lxunit/app-l2c-crm';
import { showUniDrawer } from '@/components/Layout/CustomsData/components/uniDrawer';
import style from './style.module.scss';
import detailStyle from '@web-edm/detail/detail.module.scss';
import edmStyle from '@web-edm/edm.module.scss';

const edmProductApi = apiHolder.api.requireLogicalApi(apis.edmProductDataImpl) as EdmProductDataApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

// 站点潜在客户
export const SiteCustomer = () => {
  const columns: ColumnsType<UserClickDataItem> = [
    {
      title: getIn18Text('YOUXIANG'),
      dataIndex: 'contactEmail',
      width: '23%',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('LIANXIREN'),
      dataIndex: 'contactName',
      width: '16%',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('RENWUCISHU'),
      dataIndex: 'taskNum',
      width: 85,
    },
    {
      title: getIn18Text('DIANJISHANGPIN'),
      dataIndex: 'clickProductNum',
      width: 90,
      render: (value, record) => {
        return value && 'userClickDetailData' in record ? (
          <a
            onClick={() => {
              onClickClickNum(record);
            }}
          >
            {value}
          </a>
        ) : (
          '-'
        );
      },
    },
    {
      title: getIn18Text('TINGLIUSHIJIAN'),
      dataIndex: ['userBehaviorData', 'stayTime'],
      width: 140,
      render: productStayTimeFormat,
    },
    {
      title: (
        <div className={detailStyle.columnTitle}>
          <span>{getIn18Text('FANGWENWEIZHI')}</span>
          <Tooltip overlayClassName="show-arrow" arrowPointAtCenter placement="topRight" title="指客户浏览商品详情页的位置">
            <Help />
          </Tooltip>
        </div>
      ),
      dataIndex: ['userBehaviorData', 'viewPosition'],
      width: 105,
      render: value => (!value ? '-' : `${value}%`),
    },
    {
      title: (
        <div className={detailStyle.columnTitle}>
          <span>{getIn18Text('LIUZIKEHU')}</span>
          <Tooltip overlayClassName="show-arrow" arrowPointAtCenter placement="topRight" title="客户在商品详情页提交的信息">
            <Help />
          </Tooltip>
        </div>
      ),
      dataIndex: 'clueNum',
      width: 105,
      render: (value, record) => {
        if (!value || !record.clueIds?.length) return '-';
        return <a onClick={() => onClickClueNum(record.clueIds)}>{value}</a>;
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      dataIndex: 'operation',
      width: 70,
      render: (value, record) => {
        return <a onClick={() => onClickClickNum(record)}>{getIn18Text('XIANGQING')}</a>;
      },
    },
  ];

  const detailColumns: ColumnsType<ProductViewDataItem> = [
    {
      title: getIn18Text('SHANGPINMINGCHENG'),
      dataIndex: 'productName',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('SHANGPINBIANHAO'),
      dataIndex: 'productCode',
      width: 175,
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('DIANJICISHU'),
      dataIndex: ['userBehaviorData', 'clickNum'],
      width: 120,
    },
    {
      title: getIn18Text('TINGLIUSHICHANG'),
      dataIndex: ['userBehaviorData', 'stayTime'],
      width: 120,
      render: productStayTimeFormat,
    },
    {
      title: getIn18Text('ZUIDAFANGWENSHENDU'),
      dataIndex: ['userBehaviorData', 'viewPosition'],
      width: 120,
      render: value => (!value ? '-' : `${value}%`),
    },
  ];

  const [clueIds, setClueIds] = useState<string[]>([]);
  const [leaveMessageVisible, setLeaveMessageVisible] = useState(false);
  const [list, setList] = useState<Array<UserClickDataItem>>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showUserClickDetail, setShowUserClickDetail] = useState(false);
  const [userClickDetailData, setUserClickDetailData] = useState<UserClickDataItem>();
  const [productViewData, setProductViewData] = useState<ResponseProductViewData>();

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
  });

  const showDetail = (id: string) => {
    if (!id) return;
    const list = id.split('#');
    if (isNaN(Number(list[0]))) {
      Toast.error('该数据已被修改或删除，若有疑问，请联系管理员');
      return;
    }
    if (list[2] == 'lead') {
      // 打开线索表抽屉（新留资数据提交在线索表）
      showUniDrawer({
        moduleId: UniDrawerModuleId.LeadsView,
        moduleProps: {
          visible: true,
          leadsId: list[0] as any,
          onClose: () => {},
          source: 'websitePotentialCustomer',
        },
      });
    } else {
      // 打开客户表抽屉（老留资数据提交在客户表）
      showUniDrawer({
        moduleId: UniDrawerModuleId.CustomerView,
        moduleProps: {
          visible: true,
          customerId: list[0] as any,
          onClose: () => {},
        },
      });
    }

    trackApi.track('site_clue_detail'); // 点击查看客户详情
  };

  // 跳转到客户列表
  const onClickClueNum = (ids: Array<string>) => {
    if (ids.length === 0) return;
    if (ids.length === 1) {
      showDetail(ids[0]);
    }
    if (ids.length > 1) {
      setClueIds(ids);
      setLeaveMessageVisible(true);
    }
  };
  // 跳转到客户列表
  const onClickClickNum = async (data: UserClickDataItem) => {
    setUserClickDetailData(data);
    setShowUserClickDetail(true);
    setDetailLoading(true);
    const list = await edmProductApi.getProductViewData({
      contactEmail: data.contactEmail,
    });
    setDetailLoading(false);
    setProductViewData(list);
  };

  const fetchTableData = async () => {
    setLoading(true);
    try {
      const data = await edmProductApi.getAllTaskProductClickData(pagination);
      setList(data?.userClickData || []);
      setTotalRecords(data.totalSize || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTableData();
  }, [pagination]);

  useEffect(() => {
    trackApi.track('site_clue'); // 点击点击站点潜在客户入口
  }, []);

  // 总条数
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const goCustomer = () => {
    navigate('#site?page=siteCustomer');
  };

  const goStat = () => {
    navigate('#site?page=stat');
  };

  return (
    <div className={style.siteCustomer}>
      <header className={style.siteCustomerHeader}>
        <div className={style.statHeaderContainer}>
          <div onClick={goStat} className={style.statHeaderTitle}>
            站点数据
          </div>
          <div onClick={goCustomer} className={style.statHeaderTitleActive}>
            潜在客户
            <span />
          </div>
        </div>
        <p className={style.siteCustomerDesc}>{getIn18Text('TONGJIKEHUYOUJIANYINGXIAODIANJISHUJU')}</p>
      </header>
      <div className={style.siteCustomerContent}>
        <Table
          className={`${edmStyle.contactTable}`}
          rowKey="contactEmail"
          loading={loading}
          columns={columns}
          dataSource={list}
          scroll={{ x: 910, y: 600 }}
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
          }}
        />
      </div>
      <Modal
        title={getIn18Text('SHANGPINDIANJIXIANGQING')}
        className={detailStyle.productDetailModal}
        visible={showUserClickDetail}
        footer={null}
        width={816}
        onCancel={() => setShowUserClickDetail(false)}
      >
        <div className={detailStyle.productDetailModalContact}>
          <span>联系人：{userClickDetailData?.contactName}</span> <span>客户邮箱：{userClickDetailData?.contactEmail}</span>
        </div>
        <Table
          columns={detailColumns}
          dataSource={productViewData}
          loading={detailLoading}
          pagination={false}
          scroll={{ x: 660, y: 406 }}
          rowKey="productId"
          className={style.detailTable}
        />
      </Modal>

      <LeaveMessageModal visible={leaveMessageVisible} clueIds={clueIds} onClose={() => setLeaveMessageVisible(false)} showDetail={showDetail} />
    </div>
  );
};
