import React, { useEffect, useState } from 'react';
import { apiHolder, apis, AddressBookApi, RecycleRow, AddressBookNewApi, RecycleContactVO } from 'api';
import { Table, Alert, Space, Button, Modal, Popover, Dropdown, Menu, message } from 'antd';
import classnames from 'classnames';
import moment from 'moment';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as AlertIcon } from '@/images/icons/edm/addressBook/alert_icon.svg';
import { ContactDetail } from '../../views/ContactDetail';
import MarketHistory from '../MarketHistory';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { getBodyFixHeight } from '@web-common/utils/constant';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import addressBookStyle from '../../addressBook.module.scss';
import style from './style.module.scss';
import { getIn18Text } from 'api';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { useAppSelector } from '@web-common/state/createStore';
import DownOutlined from '@ant-design/icons/DownOutlined';
import { showUniDrawer } from '@/components/Layout/CustomsData/components/uniDrawer/index';
import { ExternalScene, TableId } from '@lxunit/app-l2c-crm';
import { recordDataTracker } from '../../utils';

interface Props {
  [key: string]: unknown;
}

const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.AddressBookNewApi) as unknown as AddressBookNewApi;

export const Recycle: React.FC<Props> = () => {
  const hasOp = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CHANNEL', 'OP'));
  const hasDelete = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CHANNEL', 'DELETE'));
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<RecycleContactVO[]>([]);
  const [selectedRowKey, setSelectedRowKey] = useState<React.Key[]>([]);
  const [sortInfo, setSortInfo] = useState({ order: '', asc: true });
  const defaultPageInfo = { page: 1, pageSize: 20, total: 0 };
  const [pageInfo, setPageInfo] = useState(defaultPageInfo);
  // 获取回收站数据
  async function fetchList(reload = false) {
    try {
      setLoading(true);
      const res = await addressBookNewApi.getNewAddressRecycleList({
        // addressIdList: [],
        page: reload ? 1 : pageInfo.page,
        page_size: pageInfo.pageSize,
        order_by: sortInfo.order,
        ...sortInfo,
      });
      if (res) {
        setTableData(res.content || []);
        setPageInfo(pre => ({ ...pre, total: res.total_size || 0 }));
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchList();
  }, [pageInfo.page, pageInfo.pageSize, sortInfo.asc, sortInfo.order]);

  // 展示详情
  const showDetail = async (row: RecycleContactVO) => {
    // message.info('todo:接入leads组件');
    // 获取联系人详情
    const detail = await addressBookNewApi.getRecycleDetail(row.recycle_contact_id);
    console.log('[recyle]showDetail', detail);

    recordDataTracker('pc_marketing_contactBook_recycle', { action: 'detail' });
    showUniDrawer({
      moduleId: 'contact-view',
      moduleProps: {
        visible: true,
        detail: detail,
        contactId: Number(detail.contact_id) || row.contact_id,
        leadsId: detail.leads_id,
        onclose() {},
        disabled: true,
        source: ExternalScene.RecycleBin,
        contactTableId: TableId.LeadsContact,
      },
    });
  };
  let operateLock = false;
  // 删除数据
  async function remove(row: RecycleContactVO) {
    if (operateLock) {
      return;
    }
    try {
      operateLock = true;
      await addressBookNewApi.deleteAddressRecycle([row.recycle_contact_id]);
      Toast.success(`已将${row.contact_email}移除`);
      setPageInfo(pre => ({ ...pre, page: 1 }));

      recordDataTracker('pc_marketing_contactBook_recycle', { action: 'delete', mode: 'single' });
      fetchList(true);
    } catch (e) {
      Toast.error(getIn18Text('YICHUSHIBAI\uFF0CQINGZHONGSHI'));
    } finally {
      operateLock = false;
    }
  }

  async function recoverRecycle(row: RecycleContactVO) {
    if (operateLock) {
      return;
    }
    try {
      operateLock = true;
      await addressBookNewApi.recoverAddressRecycle([row.recycle_contact_id]);
      Toast.success(`已将${row.contact_email}还原`);
      setPageInfo(pre => ({ ...pre, page: 1 }));
      recordDataTracker('pc_marketing_contactBook_recycle', { action: 'restore', mode: 'single' });
      fetchList(true);
    } catch (e) {
    } finally {
      operateLock = false;
    }
  }
  let removeLock = false;

  // 批量删除
  async function batchRemove() {
    if (!selectedRowKey.length) {
      return;
    }
    Modal.confirm({
      centered: true,
      content: getIn18Text('SHIFOUPILIANGSHANCHUSUOXUANXIANGMU\uFF1F'),
      onOk: async () => {
        if (removeLock) {
          return;
        }
        removeLock = true;
        try {
          await addressBookNewApi.deleteAddressRecycle(selectedRowKey as number[]);
          // await addressBookApi.removeRecycle({ addressIdList: selectedRowKey as number[] });
          Toast.success(getIn18Text('YICHEDIYICHUSUOXUANXIANG'));
          setSelectedRowKey([]);
          setPageInfo(pre => ({ ...pre, page: 1 }));
          recordDataTracker('pc_marketing_contactBook_recycle', { action: 'delete', mode: 'batch' });
          fetchList(true);
        } catch (e) {
          Toast.error(getIn18Text('YICHUSHIBAI\uFF0CQINGZHONGSHI'));
        } finally {
          removeLock = false;
        }
      },
    });
  }
  let reviveLock = false;

  // 批量恢复
  async function batchRecover() {
    if (!selectedRowKey.length) {
      return;
    }
    Modal.confirm({
      centered: true,
      content: getIn18Text('SHIFOUPILIANGHAIYUANSUOXUANXIANGMU\uFF1F'),
      onOk: async () => {
        if (reviveLock) {
          return;
        }
        reviveLock = true;
        try {
          await addressBookNewApi.recoverAddressRecycle(selectedRowKey as number[]);
          Toast.success(getIn18Text('YIHAIYUANSUOXUANXIANG'));
          setSelectedRowKey([]);
          setPageInfo(pre => ({ ...pre, page: 1 }));
          recordDataTracker('pc_marketing_contactBook_recycle', { action: 'restore', mode: 'batch' });
          fetchList(true);
        } catch (e) {
          // Toast.error(getIn18Text('HAIYUANSHIBAI\uFF0CQINGZHONGSHI'));
        } finally {
          reviveLock = false;
        }
      },
    });
  }

  function tableChange(pagination: any, _: any, sorter: any) {
    console.log('@@@', pagination, sorter);
    if (pagination) {
      setPageInfo(pre => ({
        ...pre,
        pageSize: pagination.pageSize as number,
        page: pre.pageSize !== pagination.pageSize ? 1 : pagination.current,
      }));
    }
    // setSortInfo
    setSortInfo({
      order: sorter.order ? sorter?.field : '',
      asc: sorter?.order === 'ascend' ? true : false,
    });
  }

  const handleDeleteAll = () => {
    try {
      Modal.confirm({
        centered: true,
        content: getIn18Text('QUEDINGSHANCHU？'),
        async onOk() {
          //强制刷新列表
          await addressBookNewApi.emptyAddressRecycle();
          Toast.success(getIn18Text('SHANCHUCHENGGONG'));
          recordDataTracker('pc_marketing_contactBook_recycle', { action: 'allDelete' });
          fetchList(true);
          // promsie
          //   .then(_ => {
          //     Toast.success(getIn18Text('SHANCHUCHENGGONG'));
          //     setPageInfo(defaultPageInfo);

          //   })
          //   .catch(err => {
          //     console.error(err);
          //     Toast.error(getIn18Text('SHANCHUSHIBAI'));
          //   });
        },
      });
    } catch (ex) {
      console.error('handleDeleteAll-error', ex);
    }
  };

  const [operationMoreIconStyle] = useState<React.CSSProperties>({
    marginLeft: 2,
  });

  const onMarktingHistoryVisibleChange = (flag: boolean) => {
    if (flag) {
      recordDataTracker('pc_marketing_contactBook_recycle', { action: 'record' });
    }
  };

  const columns = [
    // {
    //   title: 'ID',
    //   dataIndex: 'addressId',
    // },
    {
      title: '联系方式',
      dataIndex: 'contact_email',
      className: style.maxWidthCell,
      render: (text: string) => <EllipsisTooltip>{text}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('XINGMING'),
      dataIndex: 'contact_name',
      className: style.maxWidthCell,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('YINGXIAOLISHI'),
      width: 100,
      dataIndex: 'marketHistory',
      render: (_: string, row: RecycleContactVO) => {
        if (!row.contact_email || !row.contact_email.length || row.contact_email.indexOf('@') === -1) {
          return (
            <span
              onClick={() => {
                message.error('无联系方式无法查看');
              }}
              className={style.linkBtn}
            >
              {getIn18Text('CHAKAN')}
            </span>
          );
        }

        return (
          <Popover
            trigger="click"
            placement="bottomLeft"
            destroyTooltipOnHide
            onVisibleChange={onMarktingHistoryVisibleChange}
            content={<MarketHistory style={{ width: 510, padding: 20 }} contactEmail={row.contact_email} />}
          >
            <span className={style.linkBtn}>{getIn18Text('CHAKAN')}</span>
          </Popover>
        );
      },
    },
    {
      title: getIn18Text('CHUANGJIANRIQI'),
      dataIndex: 'create_time',
      sorter: true,
      render: (createTime: string) => {
        if (+createTime) {
          return moment(+createTime).format('YYYY-MM-DD HH:mm:ss');
        }
        return '-';
      },
    },
    {
      title: getIn18Text('JINRUHUISHOUZHANRIQI'),
      dataIndex: 'delete_time',
      render: (deleteTime: string, row: RecycleContactVO) => {
        return (
          <>
            {deleteTime ? moment(deleteTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
            {/* {row.remainingDay && +row.remainingDay <= 7 ? (
              <div>
                <span className={style.delTip}>
                  {row.remainingDay}
                  {getIn18Text('TIANHOUCHEDISHANCHU')}
                </span>
              </div>
            ) : (
              ''
            )} */}
          </>
        );
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      fixed: 'right' as 'right',
      render: (_: string, row: RecycleContactVO) => {
        return (
          <Space>
            <span className={style.linkBtn} onClick={() => showDetail(row)}>
              {getIn18Text('XIANGQING')}
            </span>

            {hasOp || hasDelete ? (
              <Dropdown
                overlay={
                  <Menu>
                    {hasOp ? (
                      <Menu.Item
                        onClick={() => {
                          recoverRecycle(row);
                        }}
                      >
                        {getIn18Text('HAIYUAN')}
                      </Menu.Item>
                    ) : null}
                    {hasDelete ? (
                      <Menu.Item
                        onClick={() => {
                          remove(row);
                        }}
                      >
                        {getIn18Text('CHEDISHANCHU')}
                      </Menu.Item>
                    ) : null}
                  </Menu>
                }
              >
                <a
                  onClick={e => {
                    e.stopPropagation();
                  }}
                >
                  {getIn18Text('GENGDUO')}
                  <DownOutlined style={operationMoreIconStyle} />
                </a>
              </Dropdown>
            ) : null}
          </Space>
        );
      },
    },
  ];
  return (
    <div className={style.container}>
      <PrivilegeCheck accessLabel="DELETE" resourceLabel="CHANNEL">
        <Alert
          className={style.alert}
          message={getIn18Text('Address_book_recycle_tip')}
          type="info"
          showIcon
          action={
            pageInfo &&
            pageInfo.total > 0 && (
              <span className={classnames([style.linkBtn, style.linkBtnDanger])} onClick={handleDeleteAll}>
                {/* {getIn18Text('CHEDISHANCHU')} */}
                {getIn18Text('LIJICHEDISHANC')}
              </span>
            )
          }
          closable={false}
          icon={<AlertIcon />}
        />
      </PrivilegeCheck>
      <div className={style.content}>
        {selectedRowKey.length ? (
          <div className={style.operation}>
            <div className={style.selectTip}>
              {getIn18Text('YIXUANZE')}
              {selectedRowKey.length}
            </div>
            <Space>
              <PrivilegeCheck accessLabel="OP" resourceLabel="CHANNEL">
                <Button type="primary" className={style.btn} onClick={batchRecover}>
                  {getIn18Text('HAIYUAN')}
                </Button>
              </PrivilegeCheck>
              <PrivilegeCheck accessLabel="DELETE" resourceLabel="CHANNEL">
                <Button type="primary" className={style.btn} danger onClick={batchRemove}>
                  {getIn18Text('CHEDISHANCHU')}
                </Button>
              </PrivilegeCheck>
            </Space>
          </div>
        ) : (
          ''
        )}
        <Table
          className={classnames(addressBookStyle.table)}
          scroll={{
            x: 'max-content',
            y: selectedRowKey.length ? `calc(100vh - ${getBodyFixHeight(true) ? 360 : 392}px)` : `calc(100vh - ${getBodyFixHeight(true) ? 308 : 340}px)`,
          }}
          columns={columns}
          loading={loading}
          dataSource={tableData}
          rowKey="recycle_contact_id"
          rowSelection={{
            preserveSelectedRowKeys: true,
            selectedRowKeys: selectedRowKey,
            onChange: (selectedRowKeys: React.Key[]) => {
              setSelectedRowKey(selectedRowKeys);
            },
          }}
          pagination={{
            className: 'pagination-wrap',
            size: 'small',
            current: pageInfo.page,
            pageSize: pageInfo.pageSize,
            pageSizeOptions: ['20', '50', '100'],
            showSizeChanger: true,
            disabled: loading,
            total: pageInfo.total,
          }}
          onChange={tableChange}
        ></Table>
      </div>
    </div>
  );
};
