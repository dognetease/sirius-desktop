import React, { useState, useContext, useCallback, useMemo, useEffect } from 'react';
import { message, Form, Spin, Space, Menu, Divider, TabsProps, Tooltip, ConfigProvider } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { apiHolder, apis, FFMSApi, FFMSRate, FFMSLevelAdmin, FFMSCustomer, getIn18Text, MailApi } from 'api';
import { useLocalStorageState, useMount, useAntdTable } from 'ahooks';
import { TongyongTianjia } from '@sirius/icons';
import { GlobalContext } from '@web-entry-ff/layouts/WmMain/globalProvider';
import MarketHistory from '@web-edm/addressBook/components/MarketHistory';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import Drawer from '@web-common/components/UI/SiriusDrawer';
import Drawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
import Dropdown from '@web-common/components/UI/Dropdown/index';
// import Tabs from '@web-common/components/UI/Tabs';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
import { Empty } from '@web-entry-ff/components/empty';
import { navigate } from '@reach/router';
import { useFFmsPrivileges } from '@web-entry-ff/hooks/useFFmsPrivileges';
import { ContactSelect } from '@web-entry-ff/views/customer/components/contactSelect';
import { CompanyDetail } from '@/components/Layout/globalSearch/detail/CompanyDetail';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { ReactComponent as ArrowIcon } from '@/images/icons/edm/btn-white-arrow-icon.svg';
import Upload from '../components/upload';
import { CustomerTable, ViewType } from './Table/index';
import LevelModal from '../components/levelModal';
import Discount from './discount';
import FfConfirm from '../components/popconfirm';
import Search from './search';
import AddCustomer from '../components/addCustomer';
import NewCustomer from './addNewCustomer';
import { showData } from '../levelAdmin/table';
import { EdmTaskModal } from './edmTask';
import style from './style.module.scss';

enum DataRange {
  Self = 'Self',
  All = 'All',
}
const FFMS_CUSTOMER_TYPE = 'ffms-customer-first-type';
const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const CustomerManage: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [levleVisible, setLevleVisible] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [handerType, setHanderType] = useState<'new' | 'change'>('new');
  const [currentId, setCurrentId] = useState<string>('');
  const [currentRow, setCurrentRow] = useState<FFMSCustomer.ListItem>();
  const [active, setActive] = useState<string>('');
  const [totalSize, setTotal] = useState(0);
  const [customerTypeList, setCustomerTypeList] = useState<FFMSCustomer.TypeItem[]>([]);
  const [form] = Form.useForm();
  const [options, setOptions] = useState<FFMSRate.Option[]>([]);
  const [localData, setLocalData] = useLocalStorageState<string>(FFMS_CUSTOMER_TYPE);
  const [customerVisible, setCustomerVisible] = useState<boolean>(false);
  const [marketHistoryEmail, setMarketHistoryEmail] = useState<string>('');
  const [companyDetailId, setCompanyDetailId] = useState<string>('');
  const [edmTaskInfo, setEdmTaskInfo] = useState<{ edmEmailId?: string; contactEmail: string }>({ contactEmail: '' });
  const { state } = useContext(GlobalContext);
  const { hasAdminPermission, hasAllDataPermission } = useFFmsPrivileges();
  const [dataRange, setDataRange] = useState<DataRange>(DataRange.Self);
  const [currentAccId, setCurrentAccId] = useState('');

  const accountId = useMemo(() => {
    if (dataRange === DataRange.Self) {
      return '';
    }
    return currentAccId;
  }, [currentAccId, dataRange]);

  async function getCustomerList(pageInfo: { pageSize: number; current: number; sorter: { field: string; order: string } }) {
    let sort;
    if (pageInfo?.sorter && pageInfo?.sorter.field && pageInfo?.sorter.order) {
      sort = `${pageInfo?.sorter.field}:${pageInfo?.sorter.order.includes('asc') ? 'asc' : 'desc'}`;
    }
    const _currentFormData = form.getFieldsValue();
    const params = {
      pageSize: pageInfo.pageSize,
      page: pageInfo.current,
      customerTypeId: active,
      accountId,
      ..._currentFormData,
      searchLevelIds: _currentFormData?.searchLevelIds?.join(',') || undefined,
      sort,
    };
    if (!active || (!accountId && dataRange === DataRange.All)) return { list: [], total: 0 };
    const res = await ffmsApi.getFfCustomerList(params);
    // 非首页数据为空，定位到首页
    setTotal(res.totalSize || 0);
    if (res?.content.length === 0 && res.totalSize !== 0) {
      search.submit();
    }
    return {
      list: res?.content || [],
      total: res?.totalSize || 0,
    };
  }

  const { tableProps, refresh, search } = useAntdTable(getCustomerList, { form, defaultPageSize: 20, refreshDeps: [active, accountId, dataRange] });
  tableProps.pagination.showTotal = (total: number) => `共${total}条`;
  const { submit } = search;

  const handleView = useCallback((type: ViewType, row: FFMSCustomer.ListItem) => {
    if (type === ViewType.Email) {
      // 营销历史
      setMarketHistoryEmail(row.email);
      return;
    }

    if (type === ViewType.Task) {
      setEdmTaskInfo({ contactEmail: row.email, edmEmailId: row.edmEmailId });
      return;
    }

    if (type === ViewType.Company) {
      // 大数据弹窗
      setCompanyDetailId(row?.searchCompany?.id);
    }
  }, []);

  const deleteCustomer = (id: string | string[]) => {
    const params = {
      customerIdList: Array.isArray(id) ? id : [id],
      accountId,
    };

    ffmsApi.deleteFfCustomer(params).then(() => {
      message.success('删除成功');
      refresh();
      setCurrentId('');
      setSelectedRowKeys([]);
    });
  };
  const download = () => {
    ffmsApi.ffCustomerTemplate().then(res => {
      res?.url ? (window.location.href = res.url) : message.error('下载链接异常');
    });
  };

  const getCustomerType = () => {
    ffmsApi.getFfCustomerTypeList({ customerType: FFMSLevelAdmin.CUSTOMER_TYPE.TERMINAL_CLIENT, accountId }).then(res => {
      !active && setActive(res?.content[0]?.customerTypeId);
      setLocalData(res?.content[0]?.customerTypeId);
      setCustomerTypeList([...res.content]);
    });
  };

  const getLevelOption = () => {
    ffmsApi
      .getFfCustomerLevelList({
        pageSize: 26,
        page: 1,
      })
      .then(res => {
        setOptions(() =>
          res.content.map(item => ({
            label: `${item.levelName}（${showData(state?.discountType === 'PERCENT', item.advance20gp, item.advance40gp, item.advance40hc)}）`,
            value: item.levelId,
          }))
        );
      });
  };

  useMount(() => {
    // 优先请求第一个tab
    if (!active && localData) {
      setActive(localData);
    }
    // getCustomerType();
    getLevelOption();
  });

  useEffect(() => {
    getCustomerType();
  }, [accountId]);

  const renderTabBar: TabsProps['renderTabBar'] = (props, DefaultTabBar) => (
    <div className={style.tabBar}>
      <DefaultTabBar {...props} />
      {hasAdminPermission && (
        <div className={style.tabBarOp}>
          <Tooltip title="新建客户类型">
            <div
              className={style.tabBarOpAdd}
              onClick={() => {
                setHanderType('new');
                setVisible(true);
              }}
            >
              <TongyongTianjia className={style.addIcon} size={48} />
            </div>
          </Tooltip>
        </div>
      )}
    </div>
  );

  const AddCustomerButtons = useMemo(() => {
    if (dataRange !== DataRange.Self) {
      return null;
    }

    return (
      <Dropdown
        trigger={['hover']}
        placement="bottomRight"
        overlay={
          <Menu>
            <Menu.Item
              onClick={() => {
                setCurrentRow(undefined);
                setCustomerVisible(true);
              }}
            >
              直接添加
            </Menu.Item>
            <Menu.Item className={style.uploadItem}>
              <Upload onSuccess={() => refresh()}>文件导入</Upload>
            </Menu.Item>
            <Divider style={{ margin: '5px 0' }} />
            <Menu.Item onClick={download}>
              <span className={style.link}>下载导入客户模板</span>
            </Menu.Item>
          </Menu>
        }
      >
        <Button btnType="primary" className={style.arrowBtn}>
          <span>{getIn18Text('TIANJIAKEHU')}</span>
          <span className={style.iconWrapper}>
            <ArrowIcon />
          </span>
        </Button>
      </Dropdown>
    );
  }, [dataRange]);

  return (
    <PermissionCheckPage resourceLabel="SUBSCRIBE_CUSTOMER_LIST" accessLabel="VIEW" menu="SUBSCRIBE_MANAGE">
      <div className={style.ffCustomer}>
        <header className={style.ffCustomerHeader}>
          <div className={style.ffCustomerHeaderLeft}>{getIn18Text('DINGYUEKEHULIEBIAO')}</div>
          <div className={style.ffCustomerHeaderRight}>
            <Space>
              {hasAdminPermission && (
                <Button
                  btnType="minorLine"
                  className={style.gostBtn}
                  onClick={() => {
                    navigate('#edm?page=customerGrade');
                  }}
                >
                  差价管理
                </Button>
              )}
              {AddCustomerButtons}
            </Space>
          </div>
        </header>
        <div className={style.ffCustomerContent} style={{ textAlign: customerTypeList.length ? 'left' : 'center' }}>
          {hasAllDataPermission && (
            <Tabs className={style.dataRangeTab} activeKey={dataRange} onChange={key => setDataRange(key as DataRange)}>
              <Tabs.TabPane tab="我的数据" key={DataRange.Self} />
              <Tabs.TabPane tab="全部数据" key={DataRange.All} />
            </Tabs>
          )}
          <div className={style.contentBody}>
            {dataRange === DataRange.All && hasAllDataPermission && (
              <div className={style.contactSelect}>
                <span>人员选择:</span>
                <ContactSelect
                  value={currentAccId}
                  onChange={v => setCurrentAccId(v)}
                  style={{ width: 240 }}
                  onInit={val => val && !currentAccId && setCurrentAccId(val)}
                />
              </div>
            )}

            {!customerTypeList.length ? (
              <Spin />
            ) : (
              <Tabs
                activeKey={active}
                renderTabBar={renderTabBar}
                onChange={key => {
                  form.resetFields();
                  setActive(key);
                }}
              >
                {customerTypeList.map(item => (
                  <Tabs.TabPane tab={item.customerTypeName} key={item.customerTypeId}>
                    <div className={style.searchBar}>
                      <div className={style.searchDiscount}>
                        类型加价：
                        <Discount
                          customerType={FFMSLevelAdmin.CUSTOMER_TYPE.TERMINAL_CLIENT}
                          discountType={state?.discountType}
                          accountId={accountId}
                          update={() => {
                            getCustomerType();
                            refresh();
                          }}
                          data={item}
                        />
                      </div>

                      <div className={style.ffCustomerSearch}>
                        <Search form={form} options={options} submit={submit} />
                      </div>
                    </div>
                    <div className={style.operateBar}>
                      <Space>
                        <span>
                          共<span className={style.hilight}>{totalSize}</span>
                          家公司
                        </span>
                        <Button
                          className={style.gostBtn}
                          disabled={!selectedRowKeys?.length}
                          onClick={() => {
                            setVisible(true);
                            setHanderType('change');
                          }}
                          btnType="minorLine"
                        >
                          更改类型
                        </Button>
                        <Button className={style.gostBtn} onClick={() => setLevleVisible(true)} disabled={!selectedRowKeys?.length} btnType="minorLine">
                          更改等级
                        </Button>
                        <FfConfirm title="确认删除 ?" onConfirm={() => deleteCustomer(selectedRowKeys as string[])}>
                          <Button btnType="minorLine" className={style.gostBtn} disabled={!selectedRowKeys?.length}>
                            删除
                          </Button>
                        </FfConfirm>
                      </Space>
                    </div>
                    <ConfigProvider renderEmpty={() => <Empty>{AddCustomerButtons}</Empty>}>
                      <CustomerTable
                        rowKey="customerId"
                        discountType={state?.discountType}
                        onEdit={row => {
                          setCurrentRow(row);
                          setCustomerVisible(true);
                        }}
                        onDelete={deleteCustomer}
                        onView={handleView}
                        rowSelection={{
                          type: 'checkbox',
                          onChange: (_selectedRowKeys: React.Key[]) => {
                            setSelectedRowKeys(_selectedRowKeys as string[]);
                          },
                          selectedRowKeys,
                        }}
                        {...tableProps}
                      />
                    </ConfigProvider>
                  </Tabs.TabPane>
                ))}
              </Tabs>
            )}
          </div>
        </div>
        <LevelModal
          type="change"
          discountType={state?.discountType}
          visible={levleVisible}
          customerIds={currentId ? [currentId] : selectedRowKeys}
          accountId={accountId}
          onSuccess={() => {
            setLevleVisible(false);
            setCurrentId('');
            setSelectedRowKeys([]);
            refresh();
          }}
          onCancel={() => setLevleVisible(false)}
        />
        <AddCustomer
          type={handerType}
          customerType={FFMSLevelAdmin.CUSTOMER_TYPE.TERMINAL_CLIENT}
          customerTypeList={customerTypeList}
          accountId={accountId}
          customerIdList={currentId ? [currentId] : selectedRowKeys}
          visible={visible}
          setActive={setActive}
          onSuccess={type => {
            setVisible(false);
            setCurrentId('');
            setSelectedRowKeys([]);
            type === 'change' ? refresh() : getCustomerType();
          }}
          onCancel={() => setVisible(false)}
        />
        <NewCustomer
          accountId={accountId}
          visible={customerVisible}
          discountType={state?.discountType}
          row={currentRow}
          onSuccess={() => {
            setCustomerVisible(false);
            refresh();
            setCurrentRow(undefined);
          }}
          onCancel={() => {
            setCustomerVisible(false);
          }}
        />

        <Modal
          className={style.marketHistory}
          title={getIn18Text('YINGXIAOLISHI')}
          bodyStyle={{ margin: 0, padding: 0 }}
          visible={Boolean(marketHistoryEmail)}
          onCancel={() => setMarketHistoryEmail('')}
          okButtonProps={{ hidden: true }}
        >
          <div className={style.sendMailBtn}>
            <Button
              btnType="primary"
              onClick={() => {
                mailApi.doWriteMailToContact([marketHistoryEmail]);
              }}
            >
              发送邮件
            </Button>
          </div>
          <MarketHistory contactEmail={marketHistoryEmail} style={{ width: 600, padding: 20 }} />
        </Modal>

        <EdmTaskModal
          visible={Boolean(edmTaskInfo.contactEmail && edmTaskInfo.edmEmailId)}
          edmEmailId={edmTaskInfo.edmEmailId}
          contactEmail={edmTaskInfo.contactEmail}
          onCancel={() => {
            setEdmTaskInfo({ contactEmail: '', edmEmailId: '' });
          }}
        />

        <Drawer
          width="68.125%"
          title={getIn18Text('GONGSIXIANGQING')}
          bodyStyle={{ margin: 0, padding: 0, minWidth: 872 }}
          visible={Boolean(companyDetailId)}
          onClose={() => setCompanyDetailId('')}
          destroyOnClose
        >
          <CompanyDetail reloadToken={1} id={companyDetailId} />
        </Drawer>
      </div>
    </PermissionCheckPage>
  );
};
export default CustomerManage;
