import { Button, Checkbox, Skeleton, Table } from 'antd';
import { ColumnType } from 'antd/lib/table';
import moment from 'moment';
import { apiHolder, CustomerApi, LabelModel } from 'api';
import React from 'react';
import { EmptyList } from '@web-edm/components/empty/empty';
import { EditLabelModal } from './editLabelModal';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import style from './labelManager.module.scss';
import { customerDataTracker, LabelListAction } from '../tracker/customerDataTracker';
import { AlertErrorIcon } from '@web-common/components/UI/Icons/icons';
import classnames from 'classnames';
import systemApi from '@/../../api/src/impl/api_system/system_impl';
import { getBodyFixHeight } from '@web-common/utils/constant';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { getIn18Text } from 'api';
interface LabelManagerProps {}
interface LabelManagerState {
  loading: boolean;
  labelList: LabelModel[];
  selectedKeys: string[];
  activeTab: number;
  labelModal: {
    visible: boolean;
    label?: LabelModel;
    type?: number;
    selected?: string[];
  };
  current?: number;
  pageSize?: number;
  total: number;
  isShowSkeleton: boolean;
}
const customerApi = apiHolder.api.requireLogicalApi('customerApiImpl') as CustomerApi;
export class LabelManager extends React.Component<LabelManagerProps, LabelManagerState> {
  constructor(props: LabelManagerProps) {
    super(props);
    this.state = {
      loading: false,
      labelList: [],
      selectedKeys: [],
      labelModal: {
        visible: false,
      },
      activeTab: 0,
      current: 1,
      pageSize: 20,
      total: 0,
      isShowSkeleton: true,
    };
  }
  componentDidMount() {
    this.fetchData();
  }
  handleAdd = () => {
    this.setState({
      labelModal: {
        visible: true,
        type: this.state.activeTab,
      },
    });
  };
  handleEdit = (label: LabelModel) => {
    if (label.label_type === 0) {
      customerApi.getCustomerByLabel(label.label_id).then(arr => {
        this.setState({
          labelModal: {
            visible: true,
            label,
            selected: arr.map(i => i.company_id),
          },
        });
      });
    } else {
      customerApi.getContactByLabel(label.label_id).then(arr => {
        this.setState({
          labelModal: {
            visible: true,
            label,
            selected: arr.map(i => i.contact_id),
          },
        });
      });
    }
  };
  handleDel = (label: LabelModel) => {
    SiriusModal.confirm({
      title: getIn18Text('YAOSHANCHUBIAOQIAN?'),
      className: 'no-content-confirm',
      icon: <AlertErrorIcon />,
      content: <span>{getIn18Text('SHANCHUXUANZHONGBIAOQIANHOU\uFF0CDUIYINGBIAOQIANJIANGCONGSUOYOUKEHUHUOLIANXIRENSHANGXIAOSHIQIEBUNENGHUIFU!')}</span>,
      okType: 'danger',
      onOk: () => {
        customerApi.delLabel([label.label_id]).then(() => {
          customerDataTracker.trackLabelListAction(LabelListAction.Del, {
            labID: label.label_id,
            number: label.label_company_count,
          });
          this.fetchData();
        });
      },
    });
  };
  handleBatchDelete = () => {
    const { selectedKeys } = this.state;
    SiriusModal.confirm({
      title: getIn18Text('YAOSHANCHUBIAOQIAN?'),
      icon: <AlertErrorIcon />,
      className: 'no-content-confirm',
      okText: getIn18Text('SHANCHU'),
      cancelText: getIn18Text('QUXIAO'),
      content: <span>{getIn18Text('SHANCHUXUANZHONGBIAOQIANHOU\uFF0CDUIYINGBIAOQIANJIANGCONGSUOYOUKEHUHUOLIANXIRENSHANGXIAOSHIQIEBUNENGHUIFU!')}</span>,
      okType: 'danger',
      onOk: () => {
        customerApi.delLabel(selectedKeys).then(() => {
          this.setState({ selectedKeys: [] });
          this.fetchData();
          customerDataTracker.trackLabelListAction(LabelListAction.BatchDel, {
            number: selectedKeys.length,
          });
        });
      },
    });
  };
  fetchData() {
    this.setState({
      loading: true,
    });
    let param = {
      page: this.state.current,
      page_size: this.state.pageSize,
      key: '',
      label_type: this.state.activeTab,
    };
    customerApi
      .getLabelListByPage(param)
      .then(data => {
        console.log('data-label', data);
        const { content, total_size } = data;
        this.setState({
          loading: false,
          labelList: content,
          total: total_size,
          // selectedKeys: [],
          isShowSkeleton: false,
        });
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }
  tabChange(tab: number) {
    this.setState({ activeTab: tab, isShowSkeleton: true, current: 1, selectedKeys: [] }, () => {
      this.fetchData();
    });
  }
  onTableEventChange(page?: number, pageSize?: number) {
    console.log('page-callback', page, pageSize);
    this.setState(
      {
        current: page,
        pageSize,
      },
      () => {
        this.fetchData();
      }
    );
  }
  render() {
    const { labelModal, labelList, selectedKeys, loading, activeTab, current, pageSize, total, isShowSkeleton } = this.state;
    const labelItemCountKey = activeTab === 0 ? 'label_company_count' : 'label_contact_count';
    const columns: ColumnType<LabelModel>[] = [
      {
        title: getIn18Text('BIAOQIAN'),
        key: 'label_name',
        dataIndex: 'label_name',
        ellipsis: true,
      },
      {
        title: getIn18Text('TIANJIASHIJIAN'),
        key: 'label_create_time',
        dataIndex: 'label_create_time',
        width: 164,
        render(timestamp) {
          return moment(timestamp).format('yyyy-MM-DD HH:mm:ss');
        },
        sorter: (a, b) => a.label_create_time! - b.label_create_time!,
        sortDirections: ['descend', 'ascend'],
      },
      {
        title: activeTab === 0 ? getIn18Text('KEHU') : getIn18Text('LIANXIREN'),
        key: labelItemCountKey,
        width: 121,
        dataIndex: labelItemCountKey,
        sorter: (a: LabelModel, b: LabelModel) => a[labelItemCountKey] - b[labelItemCountKey],
        sortDirections: ['descend', 'ascend'],
      },
      {
        title: getIn18Text('CAOZUO'),
        width: 170,
        render: (_, item: LabelModel) => (
          <>
            <PrivilegeCheck resourceLabel="CONTACT" accessLabel="OP">
              <span onClick={() => this.handleEdit(item)} className={style.tableAction}>
                {getIn18Text('BIANJI')}
              </span>
            </PrivilegeCheck>
            <PrivilegeCheck resourceLabel="CONTACT" accessLabel="DELETE">
              <span onClick={() => this.handleDel(item)} className={style.tableAction} style={{ marginLeft: 24 }}>
                {getIn18Text('SHANCHU')}
              </span>
            </PrivilegeCheck>
          </>
        ),
      },
    ];
    // const pageSize = 20;
    // const showPagination = labelList.length > pageSize;
    let otherHeight = selectedKeys.length ? 224 : 186;
    if (true) otherHeight += 56;
    const y = `calc(100vh - ${otherHeight + getBodyFixHeight(true)}px)`;
    const showTotal = total => {
      return (
        <span style={{ color: '#7d8085' }}>
          {getIn18Text('GONG')}
          {Math.ceil(total / pageSize)}
          {getIn18Text('YE')}
        </span>
      );
    };
    return (
      <PermissionCheckPage resourceLabel="CONTACT" accessLabel="VIEW" menu="CONTACT_TAG_MANAGE">
        <div className={style.customerPageContainer}>
          <div className={style.pageHeader}>
            <PrivilegeCheck resourceLabel="CONTACT" accessLabel="OP">
              <Button type="primary" className="ant-btn-wide sirius-no-drag" style={{ float: 'right' }} onClick={this.handleAdd}>
                {getIn18Text('XINJIANBIAOQIAN')}
              </Button>
            </PrivilegeCheck>
            <div>
              <span className={style.pageTitle}>{getIn18Text('BIAOQIANGUANLI')}</span>
              {/* <span className={style.subTitle}>
共
<span className={style.numText}>{labelList.length}</span>
个标签
</span> */}
            </div>
          </div>
          <div className={style.pageContent}>
            <div className={style.tabs}>
              <div className={classnames([style.tabItem, { [style.active]: activeTab === 0 }])} onClick={() => this.tabChange(0)}>
                {getIn18Text('KEHUBIAOQIAN')}
              </div>
              <div className={classnames([style.tabItem, { [style.active]: activeTab === 1 }])} onClick={() => this.tabChange(1)}>
                {getIn18Text('LIANXIRENBIAOQIAN')}
              </div>
            </div>
            <Skeleton active loading={isShowSkeleton} avatar paragraph={{ rows: 4 }}>
              {total === 0 && (
                <EmptyList bodyClassName={style.emptyListBody} style={{ position: 'absolute', inset: '110px 0', height: 'auto' }}>
                  <div>{getIn18Text('NINMEIYOUSHEZHIBIAOQIANGUANLI\uFF0CDIANJIYOUSHANGJIAO\u201CXINJIANBIAOQIAN\u201DJINXINGBIAOQIANGUANLI')}</div>
                </EmptyList>
              )}
              {total > 0 && (
                <Table
                  columns={columns}
                  dataSource={labelList}
                  loading={loading}
                  rowKey="label_id"
                  pagination={{
                    showSizeChanger: true,
                    defaultPageSize: 20,
                    // pageSize: defaultPageSize,
                    size: 'small',
                    showTotal: total => `共${total}条`,
                    total,
                    pageSizeOptions: ['20', '50', '100'],
                    className: 'pagination-wrap',
                    current: current,
                    defaultCurrent: 1,
                    onChange: (page, pageSize) => this.onTableEventChange(page, pageSize),
                  }}
                  // pagination={{
                  //     hideOnSinglePage: true,
                  //     showTotal,
                  //     showSizeChanger: false,
                  //     pageSize,
                  //     size: "small",
                  //     total: labelList.length,
                  //     className: "pagination-wrap",
                  // }}
                  className="edm-table"
                  scroll={{ y }}
                  rowSelection={{
                    selectedRowKeys: selectedKeys,
                    preserveSelectedRowKeys: true,
                    onChange: keys => this.setState({ selectedKeys: keys as string[] }),
                  }}
                />
              )}
              {selectedKeys.length > 0 && (
                <div className={style.tableFooter}>
                  {getIn18Text('YIXUAN')}
                  <span className={style.mainColor}>{selectedKeys.length}</span>
                  {getIn18Text('GEBIAOQIAN')}
                  <div style={{ float: 'right' }}>
                    <Button onClick={() => this.setState({ selectedKeys: [] })}>{getIn18Text('QUXIAO')}</Button>
                    <PrivilegeCheck resourceLabel="CONTACT" accessLabel="DELETE">
                      <Button type="primary" danger style={{ marginLeft: 16 }} onClick={() => this.handleBatchDelete()}>
                        {getIn18Text('SHANCHU')}
                      </Button>
                    </PrivilegeCheck>
                  </div>
                </div>
              )}
            </Skeleton>
          </div>
          {labelModal.visible ? (
            <EditLabelModal
              visible={labelModal.visible}
              label={labelModal.label}
              selected={labelModal.selected}
              type={labelModal.type}
              onCancel={() => this.setState({ labelModal: { visible: false } })}
              onOk={() => {
                this.setState({ labelModal: { visible: false } });
                this.fetchData();
              }}
            />
          ) : null}
        </div>
      </PermissionCheckPage>
    );
  }
}
