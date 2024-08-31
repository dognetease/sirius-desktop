/*
 * @Author: zhangqingsong
 * @Description: 管理联系人页面
 */
import React, { useImperativeHandle, useState, useCallback, useEffect, useRef } from 'react';
import classnames from 'classnames';
import debounce from 'lodash/debounce';
import lodashGet from 'lodash/get';
import moment from 'moment';
import { Switch, message, Dropdown, Menu } from 'antd';
import { useAppSelector, AiWriteMailReducer, useActions } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
// import SiriusTable from '@web-common/components/UI/Table';
// import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import Table from '@/components/Layout/Customer/components/UI/Table/table';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import Breadcrumb from '@lingxi-common-component/sirius-ui/Breadcrumb';
import {
  AiHostingApi,
  apiHolder,
  apis,
  DataTrackerApi,
  ContactStatus,
  ContactListReq,
  HostingContactItem,
  EdmSendBoxApi,
  ContactSource,
  RequestOperateListV2,
  ResponseCustomerNewLabelByEmail,
} from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { getBodyFixHeight } from '@web-common/utils/constant';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import SchemeInputBox, { SchemeInputValue } from '../components/SchemeInputBox/SchemeInputBox';
import GroupInputBox, { GroupInputValue } from '../components/GroupInputBox/GroupInputBox';
import { exportExcel, ReceiversToContacts, judgeCustomer, judgeClue } from '../../utils';
import styles from './manageContacts.module.scss';
import { AddContact } from '../Receiver/index';
import { SechemeAndGroupBoxModal } from '../components/SechemeAndGroupBox/index';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
import cloneDeep from 'lodash/cloneDeep';
import { ReplyListModal } from '../ReplyContact/ReplyListModal';
import { SiriusCustomerTagByEmail, findTopPriorityLabel } from '@lxunit/app-l2c-crm';
import { ReactComponent as DownIcon } from '@/images/icons/edm/downOutlined.svg';
import CustomerClue, { opType, customerClueContact, HOSTING_CUSTOMER_CLUE_KEY } from '../../detail/CustomerClue/customerClue';
import { DetailTabOption } from '../../detail/detailEnums';

const aiHostingApi = apiHolder.api.requireLogicalApi(apis.aiHostingApiImpl) as AiHostingApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

type operationType = 'start' | 'stop' | 'remove' | 'export' | 'scheme' | 'group' | 'add';

type confirmTextConfigType = {
  key: operationType;
  value: string;
  desc?: string;
};
const noBatchBtnList = ['scheme', 'group', 'add'];
// 按钮配置
let defaultConfirmTextConfig: confirmTextConfigType[] = [
  {
    key: 'start',
    value: getIn18Text('QIDONG'),
    desc: getIn18Text('ZHONGXINKAIQIYINGXIAOTUO'),
  },
  {
    key: 'stop',
    value: getIn18Text('ZANTING'),
    desc: getIn18Text('ZANTINGYINGXIAOTUOGUANHOU'),
  },
  {
    key: 'remove',
    value: getIn18Text('YICHU'),
    desc: getIn18Text('QUEDINGYICHULIANXIREN'),
  },
  {
    key: 'export',
    value: getIn18Text('DAOCHU'),
  },
  {
    key: 'scheme',
    value: getIn18Text('XIUGAIYINGXIAORENWU'),
  },
  {
    key: 'group',
    value: getIn18Text('XIUGAIFENZU'),
  },
  {
    key: 'add',
    value: getIn18Text('TIANJIALIANXIREN'),
  },
];
// 开关状态
const openFilterConfig = [
  {
    status: -1,
    desc: getIn18Text('QUANBU'),
  },
  {
    status: 1,
    desc: getIn18Text('KAIQI'),
  },
  {
    status: 0,
    desc: getIn18Text('CLOSE_TXT'),
  },
];
// 营销轮次
const roundFilterConfig = [
  {
    status: -1,
    desc: getIn18Text('QUANBU'),
  },
  {
    status: 1,
    desc: '第一轮待发送',
  },
  {
    status: 2,
    desc: '已完成第一轮',
  },
  {
    status: 3,
    desc: '已完成第二轮',
  },
  {
    status: 4,
    desc: '已完成第三轮',
  },
  {
    status: 5,
    desc: '已完成第四轮及以上',
  },
];
// 营销状态
const marketingFilterConfig = [
  {
    status: -1,
    desc: getIn18Text('QUANBU'),
  },
  {
    status: 0,
    desc: '未发送',
  },
  {
    status: 1,
    desc: '已发送',
  },
  {
    status: 2,
    desc: '未送达',
  },
  {
    status: 3,
    desc: '已送达',
  },
  {
    status: 4,
    desc: '未打开',
  },
  {
    status: 5,
    desc: '已打开',
  },
  {
    status: 6,
    desc: '未回复',
  },
  {
    status: 7,
    desc: '已回复',
  },
];
// 联系人来源
const sourceFilterConfig = [
  {
    status: -1,
    desc: getIn18Text('QUANBU'),
  },
  {
    status: 1,
    desc: getIn18Text('ZIDONGWAJUE'),
  },
  {
    status: 0,
    desc: getIn18Text('SHOUDONGTIANJIA'),
  },
];

// 关闭状态的UI类名
const renderGrayClass = (item: HostingContactItem) => {
  return item.userTaskStatus === 1 ? {} : styles.tableGray;
};

export interface Props {
  taskId: string;
  defaultContactVisible?: boolean;
  // 点击列表项详情
  onClickDetail: (email: string) => void;
  // 返回上一页
  goBackAi?: () => void;
  hasValidateModal?: boolean;
  source?: ContactSource;
  planId?: string;
  // 创建营销任务
  onCreate?: () => void;
}

export interface Interface {
  onAddContact: () => void;
}

interface pageInfoModel {
  current: number;
  pageSize: number;
}

interface FilterObj {
  contactState?: number;
  contactGroup?: string;
  contactScheme?: string;
  contactSource?: number;
  openState?: number;
  marketingRound?: number;
  marketingState?: number;
  contactInput?: string;
}

export const ManageContacts = React.forwardRef<Interface, Props>((props, ref) => {
  const { taskId, defaultContactVisible, onClickDetail, goBackAi, hasValidateModal, source = 'manage', planId, onCreate } = props;

  const { changeAiHostingInitObj } = useActions(AiWriteMailReducer);

  // 客户和线索的查看和编辑权限
  const hasCheckCustomerPrivilege = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CONTACT', 'VIEW'));
  const hasCheckCluePrivilege = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CHANNEL', 'VIEW'));
  const hasEditCustomerPrivilege = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CONTACT', 'OP'));
  const hasEditCluePrivilege = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CHANNEL', 'OP'));

  const isFromManage = source === 'manage';
  const ifFromSingleTask = ['autoTask', 'handTask'].includes(source);

  // 列表表头配置
  const columns = [
    {
      title: getIn18Text('YOUJIANDEZHI'),
      fixed: 'left',
      width: 220,
      ellipsis: true,
      dataIndex: 'email',
      render: (value: string) => (
        <span>
          {value || '-'}&nbsp;
          <SiriusCustomerTagByEmail email={value} labelInfos={identityMap[value] || []} />
        </span>
      ),
    },
    {
      title: getIn18Text('KAIQIZHUANGTAI'),
      width: 120,
      dataIndex: 'userTaskStatus',
      render: (value: number, item: HostingContactItem) => (
        <div className={styles.tableFlex}>
          <span className={styles.tableFlexNoWrap}>{value === 1 ? getIn18Text('KAIQI') : getIn18Text('CLOSE_TXT')}</span>
          <Switch size="small" checked={value === 1} onChange={() => handleOperation(value === 1 ? 'stop' : 'start', [item.email])} />
        </div>
      ),
    },
    {
      title: getIn18Text('LIANXIRENXINGMING'),
      width: 120,
      ellipsis: true,
      dataIndex: 'name',
      render: (value: string, item: HostingContactItem) => <span className={renderGrayClass(item)}>{value || '-'}</span>,
    },
    {
      title: getIn18Text('YINGXIAORENWU'),
      width: 100,
      dataIndex: 'displayPlanName',
      render: (value: string, item: HostingContactItem) => <span className={renderGrayClass(item)}>{value || '-'}</span>,
    },
    {
      title: getIn18Text('FAJIANYOUXIANG'),
      width: 220,
      ellipsis: true,
      dataIndex: 'assignEmail',
      render: (value: string) => <span>{value || '-'}</span>,
    },
    {
      title: getIn18Text('LIANXIRENLAIYUAN'),
      width: 120,
      ellipsis: true,
      dataIndex: 'userSource',
      render: (value: number, item: HostingContactItem) => (
        <span className={renderGrayClass(item)}>{sourceFilterConfig.find(source => source.status === value)?.desc || '-'}</span>
      ),
    },
    {
      title: getIn18Text('TUIJIANLIYOU'),
      width: 120,
      dataIndex: 'recReason',
      hideColumn: source !== 'autoTask',
      ignoreExport: source !== 'autoTask',
      render: (value: string, item: HostingContactItem) => <span className={renderGrayClass(item)}>{value || '-'}</span>,
    },
    {
      title: getIn18Text('YINGXIAOZHUANGTAI'),
      width: 120,
      dataIndex: 'displayStatusDesc',
      render: (value: string, item: HostingContactItem) => <span className={renderGrayClass(item)}>{value || '-'}</span>,
    },
    {
      title: getIn18Text('YINGXIAOLUNCI'),
      width: 120,
      dataIndex: 'displayRoundStatusDesc',
      render: (value: string, item: HostingContactItem) => <span className={renderGrayClass(item)}>{value || '-'}</span>,
    },
    {
      title: getIn18Text('FENZU'),
      width: 120,
      dataIndex: 'groupName',
      render: (value: string, item: HostingContactItem) => <span className={renderGrayClass(item)}>{value || '-'}</span>,
    },
    {
      title: source === 'autoTask' ? getIn18Text('WAJUESHIJIAN') : getIn18Text('TIANJIASHIJIAN'),
      width: 120,
      dataIndex: 'createTime',
      render: (value: number, item: HostingContactItem) => <span className={renderGrayClass(item)}>{value ? moment(value).format('YYYY-MM-DD') : '-'}</span>,
    },
    {
      title: getIn18Text('ZUIJINFAXINSHIJIAN'),
      width: 120,
      dataIndex: 'recentSendTime',
      render: (value: number, item: HostingContactItem) => <span className={renderGrayClass(item)}>{value ? moment(value).format('YYYY-MM-DD') : '-'}</span>,
    },
    {
      title: getIn18Text('XIACIYUGUFAXINSHI'),
      width: 160,
      dataIndex: 'nextSendTime',
      render: (value: number, item: HostingContactItem) => <span className={renderGrayClass(item)}>{value ? `${moment(value).format('YYYY-MM-DD')}之后` : '-'}</span>,
    },
    {
      title: getIn18Text('FASONGCISHU'),
      width: 88,
      dataIndex: 'sendNum',
      render: (value: number, item: HostingContactItem) => <span className={renderGrayClass(item)}>{value}</span>,
    },
    {
      title: getIn18Text('SONGDACISHU'),
      width: 88,
      dataIndex: 'arriveNum',
      render: (value: number, item: HostingContactItem) => <span className={renderGrayClass(item)}>{value}</span>,
    },
    {
      title: getIn18Text('DAKAISHU'),
      width: 88,
      dataIndex: 'readNum',
      render: (value: number, item: HostingContactItem) => <span className={renderGrayClass(item)}>{value}</span>,
    },
    {
      title: getIn18Text('SHIFOUHUIFU'),
      width: 88,
      dataIndex: 'reply',
      render: (value: number, item: HostingContactItem) => (
        <span
          onClick={() => {
            if (value === 1) {
              setReplyOperates({
                // edmEmailIds: item.edmEmailIds,
                contactEmail: item.email,
                taskId,
              });
              setReplyListVisible(true);
            }
          }}
          className={`${renderGrayClass(item)} ${value === 1 ? styles.replyed : ''}`}
        >
          {value === 1 ? getIn18Text('SHI') : getIn18Text('FOU')}
        </span>
      ),
    },
    {
      title: getIn18Text('SHIFOUTUIDING'),
      width: 88,
      dataIndex: 'unsubscribe',
      render: (value: number, item: HostingContactItem) => <span className={renderGrayClass(item)}>{value === 1 ? getIn18Text('SHI') : getIn18Text('FOU')}</span>,
    },
    {
      title: getIn18Text('CAOZUO'),
      fixed: 'right',
      dataIndex: '',
      ignoreExport: true,
      render: (item: HostingContactItem) => {
        const idValue = identityMap[item.email] ? findTopPriorityLabel(identityMap[item.email])?.email_label : 0;
        const isCustomer = judgeCustomer(idValue);
        const isClue = judgeClue(idValue);
        const notCustomerClue = !isCustomer && !isClue;
        // 展示新建客户
        const showCreateCustomer = notCustomerClue && hasEditCustomerPrivilege;
        // 展示新建线索
        const showCreateClue = notCustomerClue && hasEditCluePrivilege;
        // 展示查看客户
        const showCheckCustomer = isCustomer && hasCheckCustomerPrivilege;
        // 展示查看线索
        const showCheckClue = isClue && hasCheckCluePrivilege;
        return (
          <div className={styles.operation}>
            <span className={styles.operationItem} onClick={() => handleDetail(item.email)}>
              {getIn18Text('XIANGQING')}
            </span>
            <span className={styles.operationItem} onClick={() => handleOperation('remove', [item.email])}>
              {getIn18Text('YICHU')}
            </span>
            {customerClueLoading ? (
              <></>
            ) : (
              <>
                {showCreateCustomer ? (
                  <div className={styles.operateRecord}>
                    <a className={styles.operateRecordLeft} onClick={() => handleCustomerClue(opType.addCustomer, item?.email)}>
                      录入客户
                    </a>
                    <Dropdown
                      trigger={['click']}
                      placement="bottomCenter"
                      overlay={
                        <Menu>
                          <Menu.Item>
                            <a onClick={() => handleCustomerClue(opType.existCustomer, item?.email)}>添加至已有客户</a>
                          </Menu.Item>
                        </Menu>
                      }
                    >
                      <div className={styles.operateRecordRight}>
                        <DownIcon />
                      </div>
                    </Dropdown>
                  </div>
                ) : (
                  <></>
                )}
                {showCreateClue ? (
                  <div className={styles.operateRecord}>
                    <a className={styles.operateRecordLeft} onClick={() => handleCustomerClue(opType.addClue, item?.email)}>
                      录入线索
                    </a>
                    <Dropdown
                      trigger={['click']}
                      placement="bottomCenter"
                      overlay={
                        <Menu>
                          <Menu.Item>
                            <a onClick={() => handleCustomerClue(opType.existClue, item?.email)}>添加至已有线索</a>
                          </Menu.Item>
                        </Menu>
                      }
                    >
                      <div className={styles.operateRecordRight}>
                        <DownIcon />
                      </div>
                    </Dropdown>
                  </div>
                ) : (
                  <></>
                )}
                {showCheckCustomer ? <a onClick={() => handleCustomerClue(opType.customer, item?.email)}>查看客户</a> : <></>}
                {showCheckClue ? <a onClick={() => handleCustomerClue(opType.clue, item?.email)}>查看线索</a> : <></>}
              </>
            )}
          </div>
        );
      },
    },
  ];
  const [contactVisible, setContactVisible] = useState<boolean>(!!defaultContactVisible);
  // 筛选状态列表
  const [stateFilterConfig, setStateFilterConfig] = useState<ContactStatus[]>([]);
  // 下拉筛选
  const [filterObj, setFilterObj] = useState<FilterObj>({ contactScheme: planId });
  // 筛选邮件地址
  const [contactInput, setContactInput] = useState<string>();
  // 修改营销任务选中
  const [newScheme, setNewScheme] = useState<string>();
  // 修改分组选中
  const [newGroup, setNewGroup] = useState<GroupInputValue>();
  // 列表选中项
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  // 列表分页配置
  const [pageInfo, setPageInfo] = useState<pageInfoModel>({ current: 1, pageSize: 20 });
  // 列表数据总数
  const [pageTotal, setPageTotal] = useState<number>(0);
  // 列表数据加载状态
  const [loading, setLoading] = useState<boolean>(false);
  // 所有已加载去重数据，用于导出
  const [totalData, setTotalData] = useState<HostingContactItem[]>([]);
  // 列表展示数据
  const [tableData, setTableData] = useState<HostingContactItem[]>([]);
  // 营销任务修改弹窗
  const [schemeModalVisible, setSchemeModalVisible] = useState<boolean>(false);
  // 分组修改弹窗
  const [groupModalVisible, setGroupModalVisible] = useState<boolean>(false);
  // 修改营销任务及分组弹窗
  const [schemeAndgroupModalVisible, setSchemeAndgroupModalVisible] = useState<boolean>(false);
  // 分组未选择提示
  const [replaceGroupError, setReplaceGroupError] = useState<string>('');
  // 任务未选择提示
  const [replaceSchemeError, setReplaceSchemeError] = useState<string>('');
  // 回复列表显示
  const [replyListVisible, setReplyListVisible] = useState<boolean>(false);
  // 当前展示联系人的身份信息
  const [identityMap, setIdentityMap] = useState<Record<string, ResponseCustomerNewLabelByEmail[]>>({});
  // 批量新建线索弹窗
  const [customerClueType, setCustomerClueType] = useState<opType | ''>('');
  // 客户、线索操作的联系人
  const [customerClueContacts, setCustomerClueContacts] = useState<Record<string, customerClueContact[]>>({});
  // 查询客户线索信息中，未查询到不展示客户线索信息及操作
  const [customerClueLoading, setCustomerClueLoading] = useState<boolean>(true);

  const [replyOperates, setReplyOperates] = useState<RequestOperateListV2>();
  const [confirmTextConfig, setConfirmTextConfig] = useState<confirmTextConfigType[]>(cloneDeep(defaultConfirmTextConfig));

  const [containerHeight, setContainerHeight] = useState<number>(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const groupInputRef = useRef();
  const contactsRef = useRef<any>({});

  // 多选配置
  const rowSelection = {
    fixed: true,
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (newSelectedRowKeys: string[]) => {
      if (newSelectedRowKeys.length <= 5000) {
        setSelectedRowKeys(newSelectedRowKeys);
      }
    },
  };

  const handleDetail = (email: string) => {
    onClickDetail(email);
    trackApi.track('pc_marketing_edm_host_contacts', { action: 'detail' });
  };

  useImperativeHandle(ref, () => ({
    onAddContact() {
      handleBtnClick('add');
    },
  }));

  const handleList = (list: HostingContactItem[], filter: boolean) => {
    if (!list || list.length <= 0) {
      return [];
    }
    if (filter) {
      return list
        .map(item => ({ email: item.email, contact_name: item.name, source_name: item.sourceName, planId: item.planId, planName: item.displayPlanName }))
        .filter(item => {
          const idValue = identityMap[item.email] ? findTopPriorityLabel(identityMap[item.email])?.email_label : 0;
          return !judgeCustomer(idValue) && !judgeClue(idValue);
        });
    }
    return list.map(item => ({ email: item.email, contact_name: item.name, source_name: item.sourceName, planId: item.planId, planName: item.displayPlanName }));
  };

  // 统一准备客户、线索组件需要的数据
  const handleCustomerClue = (type: opType, email?: string) => {
    // 添加到已有客户、线索时需要过滤掉已是客户和线索的邮箱
    const isAddExist = [opType.existCustomer, opType.existClue].includes(type);
    // 批量录入线索是录入选中的
    const isBatch = type === opType.batchClue;
    if (isBatch && selectedRowKeys.length <= 0) {
      message.warn(getIn18Text('QINGXIANGOUXUANLIANXIREN'));
      return;
    }
    const list = [...(isBatch ? totalData.filter(item => selectedRowKeys.includes(item.email)) : tableData)];
    if (email) {
      const selectIndex = list.findIndex(item => item.email === email);
      const selectItem = list.find(item => item.email === email) as HostingContactItem;
      list.splice(selectIndex, 1);
      list.unshift(selectItem);
    }
    const contactObj = { [HOSTING_CUSTOMER_CLUE_KEY]: handleList(list, isAddExist) };
    setCustomerClueContacts(contactObj);
    setCustomerClueType(type);
  };

  // 客户、线索相关弹窗或抽屉关闭
  const handleCustomerClueClose = (refresh?: boolean) => {
    // 是否刷新列表
    if (refresh) {
      getTableData();
      setSelectedRowKeys([]);
    }
    setCustomerClueType('');
  };

  const updateFilterObj = (updateData: FilterObj) => {
    setFilterObj({ ...filterObj, ...updateData });
  };
  // 邮件地址/联系人姓名筛选变化 缓存函数使debounce生效
  const updateContactInput = useCallback(
    debounce(val => {
      setContactInput(val);
    }, 300),
    []
  );
  const handleInput = e => {
    const val = e?.target?.value || '';
    updateContactInput(val);
  };
  // 列表营销状态开关 单个、批量
  const handleSwitch = async (value: boolean, emailList: string[]) => {
    if (loading) {
      return;
    }
    setLoading(true);
    const params = {
      taskId,
      emailList,
      status: value ? 1 : 0,
    };
    await aiHostingApi.switchAiHostingContact(params);
    setLoading(false);
    // 重置选中数据
    setSelectedRowKeys([]);
    getTableData();
  };
  // 列表项移除 单个、批量
  const handleRemove = async (emailList: string[]) => {
    if (loading) {
      return;
    }
    setLoading(true);
    const params = {
      taskId,
      emailList,
    };
    await aiHostingApi.deleteAiHostingContact(params);
    setLoading(false);
    // 重置选中数据
    setSelectedRowKeys([]);
    getTableData();
  };
  // 批量/单个开启、暂停、移除、修改任务、修改分组的前置逻辑
  const handleOperation = (type: operationType, selectedList?: string[]) => {
    const selectedRows = [...(selectedList || selectedRowKeys)];
    if (selectedRows.length > 100) {
      message.warn(getIn18Text('ZUIDUOKEPILIANGCAOZUO'));
      return;
    }
    if (type === 'scheme') {
      setSchemeModalVisible(true);
      trackApi.track('pc_marketing_edm_host_contacts', { action: 'changeStrategy' });
      return;
    } else if (type === 'group') {
      setGroupModalVisible(true);
      trackApi.track('pc_marketing_edm_host_contacts', { action: 'changeGroup' });
      return;
    }
    if (selectedList) {
      if (['start', 'stop'].includes(type)) {
        trackApi.track('pc_marketing_edm_host_contacts', { action: 'switch' });
      } else if (type === 'remove') trackApi.track('pc_marketing_edm_host_contacts', { action: 'remove' });
    } else {
      if (type === 'start') {
        trackApi.track('pc_marketing_edm_host_contacts', { action: 'batchStart' });
      } else if (type === 'stop') {
        trackApi.track('pc_marketing_edm_host_contacts', { action: 'batchSuspend' });
      } else if (type === 'remove') {
        trackApi.track('pc_marketing_edm_host_contacts', { action: 'batchRemove' });
      }
    }
    const item = confirmTextConfig.find(item => item.key === type) as confirmTextConfigType;
    // 批量开启、暂停、移除
    Modal.confirm({
      title: item.desc,
      okText: item.value,
      onOk: () => {
        if (['start', 'stop'].includes(type)) {
          handleSwitch(type === 'start', selectedRows);
        } else if (type === 'remove') {
          handleRemove(selectedRows);
        }
      },
    });
  };
  // 按钮点击
  const handleBtnClick = (type: operationType) => {
    // 添加联系人
    if (type === 'add') {
      if (hasValidateModal) return;
      setContactVisible(true);
      trackApi.track('pc_marketing_edm_host_contacts', { action: 'addContacts' });
      return;
    }
    // 其他统一需要多选校验
    if (selectedRowKeys.length <= 0) {
      message.warn(getIn18Text('QINGXIANGOUXUANLIANXIREN'));
      return;
    }
    // 批量导出
    if (type === 'export') {
      const fieldLabels = columns.filter(item => !item.ignoreExport).map(item => item.title);
      const fieldKeys = columns.filter(item => !item.ignoreExport).map(item => item.dataIndex);
      exportExcel(
        totalData
          .filter(item => selectedRowKeys.includes(item.email))
          .map(item => ({
            ...item,
            userTaskStatus: item.userTaskStatus === 1 ? getIn18Text('KAIQI') : getIn18Text('CLOSE_TXT'),
            userSource: sourceFilterConfig.find(source => source.status === item.userSource)?.desc || '-',
            createTime: item.createTime ? moment(item.createTime).format('YYYY-MM-DD') : '-',
            nextSendTime: item.nextSendTime ? moment(item.nextSendTime).format('YYYY-MM-DD') : '-',
            recentSendTime: item.recentSendTime ? moment(item.recentSendTime).format('YYYY-MM-DD') : '-',
            reply: item.reply === 1 ? getIn18Text('SHI') : getIn18Text('FOU'),
            unsubscribe: item.unsubscribe === 1 ? getIn18Text('SHI') : getIn18Text('FOU'),
          })),
        fieldLabels,
        fieldKeys,
        `${getIn18Text('LIANXIRENLIEBIAO')}_${moment().format('YYYY-MM-DD')}.csv`
      );
      // 重置选中数据
      setSelectedRowKeys([]);
      trackApi.track('pc_marketing_edm_host_contacts', { action: 'batchDownload' });
      return;
    }
    handleOperation(type);
  };

  // 查询展示数据的身份信息
  const getTableDataLabel = (data: HostingContactItem[]) => {
    edmApi
      .getCustomerNewLabelByEmail({
        email_list: data.map(item => item.email),
      })
      .then(result => {
        if (result?.length > 0) {
          const resultMap: Record<string, ResponseCustomerNewLabelByEmail[]> = {};
          result.forEach(item => {
            if (item?.contact_email) {
              if (resultMap[item.contact_email]) {
                resultMap[item.contact_email].push(item);
              } else {
                resultMap[item.contact_email] = [item];
              }
            }
          });
          setIdentityMap(resultMap);
        }
        setCustomerClueLoading(false);
      });
  };

  // 获取联系人列表数据
  const getTableData = async (pInfo?: pageInfoModel) => {
    // 可连续触发搜索，不判断loading
    setLoading(true);
    const params: ContactListReq = {
      taskId,
      page: pInfo?.current || pageInfo.current,
      pageSize: pInfo?.pageSize || pageInfo.pageSize,
    };
    if (filterObj.contactState !== -1) {
      params.displayStatus = filterObj.contactState;
    }
    if (filterObj.contactGroup !== '-1') {
      params.groupId = filterObj.contactGroup;
    }
    if (filterObj.contactScheme !== '-1') {
      params.planId = filterObj.contactScheme;
    }
    if (filterObj.contactSource !== -1) {
      params.userSource = filterObj.contactSource;
    }
    if (filterObj.openState !== -1) {
      params.taskStatus = filterObj.openState;
    }
    if (filterObj.marketingRound !== -1) {
      params.taskRound = filterObj.marketingRound;
    }
    if (filterObj.marketingState !== -1) {
      params.userEmailStatus = filterObj.marketingState;
    }
    if (contactInput) {
      params.email = contactInput.trim();
    }
    const result = await aiHostingApi.getAiHostingContactList(params);
    const updateDataList = result?.userList ? [...result.userList] : [];
    setTableData(updateDataList);
    // 获取展示数据身份
    getTableDataLabel(updateDataList);
    // 更新总数据
    const incrementalData = [...totalData];
    updateDataList.forEach(item => {
      const curIndex = incrementalData.findIndex(itm => itm.email === item.email);
      if (curIndex === -1) {
        // 完全新加载的数据需要存入totalData
        incrementalData.push(item);
      } else {
        // totalData已有但有更新 需要更新为最新
        incrementalData.splice(curIndex, 1, item);
      }
    });
    setTotalData(incrementalData);
    setPageTotal(result?.totalSize || 0);
    setLoading(false);
  };

  // 添加联系人
  const sendReceivers = (receivers: any[], directSend?: boolean) => {
    if (receivers && receivers.length > 0) {
      const contacts = ReceiversToContacts(receivers);
      contactsRef.current = {
        contacts: contacts,
        check: !!directSend ? 0 : 1,
      };
      setContactVisible(false);
      setSchemeAndgroupModalVisible(true);
    }
    // return;
    // if (contacts && contacts.length > 0) {
    //   aiHostingApi.addAiHostingContact({contacts, taskId, check: !!directSend ? 0 : 1 }).then(res => {
    //     getTableData();
    //     setContactVisible(false);
    //   })
    // }
  };

  // 获取联系人状态下拉项
  const getContactState = async () => {
    const contactStatus = await aiHostingApi.getAiHostingContactStatus({ taskId });
    const contactStatusList = [{ status: -1, desc: getIn18Text('QUANBU') }];
    if (Array.isArray(contactStatus?.displayStatus)) {
      contactStatusList.push(...contactStatus.displayStatus);
    }
    setStateFilterConfig(contactStatusList);
  };

  // 分页器相关操作
  const updatePageInfo = (pInfo: pageInfoModel) => {
    // 当前页面无数据的情况（全选删除最后一页会出现）
    if (pInfo.pageSize * (pInfo.current - 1) >= pageTotal) {
      setPageInfo({ ...pInfo, current: pInfo.current > 1 ? pInfo.current - 1 : pInfo.current });
    } else {
      setPageInfo(pInfo);
    }
    getTableData(pInfo);
  };

  const onSechemeAndGroupCancel = () => {
    setSchemeAndgroupModalVisible(false);
    groupInputRef.current?.getContactGroup();
  };

  const onSechemeAndGroupConfirm = async (groupId: string, planId: string, groupName: string) => {
    let param = {
      taskId: taskId,
      groupId,
      planId,
      contacts: contactsRef.current.contacts,
      check: contactsRef.current.check,
      name: groupName || '',
    };
    const result = await edmApi.addContactPlan(param);

    console.log('onSechemeAndGroupConfirm=======', result);
    if (result) {
      toast.success(getIn18Text('TIANJIALIANXIRENCHENGGONG'));
      contactsRef.current = {};
      setSchemeAndgroupModalVisible(false);
      getTableData();
      trackApi.track('pc_marketing_edm_host_addSuccess', { source: 'host', from: 'newTask' });
    }
    groupInputRef.current?.getContactGroup();
  };

  useEffect(() => {
    if (ifFromSingleTask) {
      if (planId !== '') {
        updateFilterObj({ contactScheme: planId });
      }
      setConfirmTextConfig(cloneDeep(defaultConfirmTextConfig).filter(config => config.key !== 'add'));
    } else {
      setConfirmTextConfig(cloneDeep(defaultConfirmTextConfig));
    }
  }, [source, planId]);

  // 初始化获取下拉筛选项和列表数据
  useEffect(() => {
    getContactState();
    trackApi.track('pc_marketing_edm_host_contacts', { visit: '' });
    return () => {
      changeAiHostingInitObj({});
    };
  }, []);

  // 筛选变化执行列表筛选搜索
  useEffect(() => {
    setPageInfo({ ...pageInfo, current: 1 });
    getTableData({ ...pageInfo, current: 1 });
  }, [filterObj, contactInput]);

  useEffect(() => {
    if (ResizeObserver && containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
          // const { height } = entry.contentRect;
          // setContainerHeight(height);
          const dom = document.querySelector('#ai_hosting_root_node');
          if (dom && dom.clientHeight) {
            setContainerHeight(dom.clientHeight - 90 - 64);
          }

          // setContainerHeight(height - 90 - 64);
          // setContainerHeight(494)
        });
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }

    return () => {};
  }, [ResizeObserver, containerRef.current]);

  const handleReplaceScheme = async () => {
    if (!taskId) {
      return;
    }
    if (!newScheme) {
      setReplaceSchemeError(getIn18Text('QINGXUANZEYINGXIAORENWU'));
      return;
    }
    const params = {
      taskId,
      planId: newScheme,
      emailList: selectedRowKeys,
    };
    const result = await edmApi.updateContactPlan(params);
    if (result) {
      setSchemeModalVisible(false);
      getTableData();
      setSelectedRowKeys([]);
      message.success(getIn18Text('XIUGAIRENWUCHENGGONG'));
    } else {
      message.error(getIn18Text('XIUGAIRENWUSHIBAI，'));
    }
  };

  const handleReplaceGroup = async () => {
    if (!taskId) {
      return;
    }
    if (!newGroup?.groupId && !newGroup?.groupName) {
      setReplaceGroupError(getIn18Text('QINGXUANZEFENZU'));
      return;
    }
    const params = {
      taskId,
      groupId: newGroup?.groupId,
      name: newGroup?.groupName,
      emailList: selectedRowKeys,
    };
    const result = await edmApi.updateContactGroup(params);
    if (result) {
      setGroupModalVisible(false);
      getTableData();
      setSelectedRowKeys([]);
      message.success(getIn18Text('XIUGAIFENZUCHENGGONG'));
    } else {
      message.error(getIn18Text('XIUGAIFENZUSHIBAI，'));
    }
  };

  // 返回结构
  return (
    <>
      <div className={`${styles.manageContacts} ${ifFromSingleTask ? styles.manageContactTask : styles.manageContactsHeight}`} ref={containerRef}>
        {/* 面包屑区域 */}
        {isFromManage && (
          <Breadcrumb separator="">
            <Breadcrumb.Item
              className={styles.breadcrumbItem}
              onClick={() => {
                goBackAi && goBackAi();
              }}
            >
              {getIn18Text('YINGXIAOTUOGUAN')}
            </Breadcrumb.Item>
            <Breadcrumb.Separator>/</Breadcrumb.Separator>
            <Breadcrumb.Item>{getIn18Text('GUANLILIANXIREN')}</Breadcrumb.Item>
          </Breadcrumb>
        )}
        {ifFromSingleTask && <div className={styles.title}>{getIn18Text('YINGXIAOLIEBIAO')}</div>}
        <div className={styles.header}>
          <div className={styles.headerFilter}>
            <EnhanceSelect
              dropdownMatchSelectWidth={false}
              value={filterObj?.contactState}
              onChange={val => updateFilterObj({ contactState: val })}
              placeholder={getIn18Text('LIANXIRENZHUANGTAI')}
            >
              {stateFilterConfig.map(item => (
                <InSingleOption key={item.status} value={item.status}>
                  {item.desc}
                </InSingleOption>
              ))}
            </EnhanceSelect>
            <GroupInputBox
              ref={groupInputRef}
              taskId={taskId}
              showAdd={false}
              showTotal
              onChange={(val: GroupInputValue) => updateFilterObj({ contactGroup: val?.groupId })}
            />
            {isFromManage && (
              <SchemeInputBox taskId={taskId} showTag={false} showTotal onChange={(val: SchemeInputValue) => updateFilterObj({ contactScheme: val?.schemeId })} />
            )}

            {/* <EnhanceSelect value={contactSource} onChange={val => updateFilterObj({ contactSource: val })} placeholder={'联系人来源'}>
              {sourceFilterConfig.map(item => (
                <InSingleOption key={item.status} value={item.status}>
                  {item.desc}
                </InSingleOption>
              ))}
            </EnhanceSelect> */}

            <EnhanceSelect
              dropdownMatchSelectWidth={false}
              value={filterObj?.openState}
              onChange={val => updateFilterObj({ openState: val })}
              placeholder={getIn18Text('KAIQIZHUANGTAI')}
            >
              {openFilterConfig.map(item => (
                <InSingleOption key={item.status} value={item.status}>
                  {item.desc}
                </InSingleOption>
              ))}
            </EnhanceSelect>

            <EnhanceSelect
              dropdownMatchSelectWidth={false}
              value={filterObj?.marketingRound}
              onChange={val => updateFilterObj({ marketingRound: val })}
              placeholder={getIn18Text('YINGXIAOLUNCI')}
            >
              {roundFilterConfig.map(item => (
                <InSingleOption key={item.status} value={item.status}>
                  {item.desc}
                </InSingleOption>
              ))}
            </EnhanceSelect>

            <EnhanceSelect
              dropdownMatchSelectWidth={false}
              value={filterObj?.marketingState}
              onChange={val => updateFilterObj({ marketingState: val })}
              placeholder={getIn18Text('YINGXIAOZHUANGTAI')}
            >
              {marketingFilterConfig.map(item => (
                <InSingleOption key={item.status} value={item.status}>
                  {item.desc}
                </InSingleOption>
              ))}
            </EnhanceSelect>

            <Input
              className={styles.input}
              placeholder={getIn18Text('QINGSHURUYOUJIANDEZHI')}
              onChange={handleInput}
              prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
            />
          </div>
          <div className={styles.headerOperation}>
            <span className={styles.operationDesc}>
              {getIn18Text('YIXUAN')}
              {selectedRowKeys.length}
              {getIn18Text('GE')}
            </span>
            <div className={styles.operationBtns}>
              {hasEditCluePrivilege && (
                <Button btnType="minorLine" onClick={() => handleCustomerClue(opType.batchClue)}>
                  批量录入线索
                </Button>
              )}
              {confirmTextConfig.map(item => (
                <Button key={item.key} btnType={item.key === 'add' ? 'primary' : 'minorLine'} onClick={() => handleBtnClick(item.key)}>
                  {noBatchBtnList.includes(item.key) ? '' : getIn18Text('PILIANG')}
                  {item.value}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <Table
          className={styles.table}
          loading={loading}
          rowKey={item => item.email}
          rowSelection={rowSelection}
          columns={columns.filter(item => !item.hideColumn)}
          dataSource={tableData}
          scroll={{ x: 'max-content', y: `calc(100vh - ${getBodyFixHeight(true, undefined, true) + 302}px)` }}
          onChange={updatePageInfo}
          pagination={false}
        />
        {pageTotal >= 10 && (
          <div className={`${isFromManage ? styles.pagination : styles.paginationN}`}>
            <SiriusPagination
              showTotal={total => `共${total}条数据`}
              showQuickJumper
              current={pageInfo.current}
              pageSize={pageInfo.pageSize}
              total={pageTotal}
              onChange={(current: number, pageSize?: number) => updatePageInfo({ ...pageInfo, current, pageSize: pageSize || pageInfo.pageSize })}
            />
          </div>
        )}

        <Modal
          visible={schemeModalVisible}
          title={
            <>
              <p className={styles.modalTitle}>{getIn18Text('XIUGAIYINGXIAORENWU')}</p>
              <p className={styles.modalDesc}>{getIn18Text('SUOYOULIANXIRENJIANGZAI')}</p>
            </>
          }
          okText={getIn18Text('QUEREN')}
          onCancel={() => setSchemeModalVisible(false)}
          onOk={handleReplaceScheme}
        >
          <div className={styles.modalContent}>
            <span>
              {getIn18Text('JIANG')}
              {selectedRowKeys.length === 1 ? selectedRowKeys[0] : `${selectedRowKeys.length}个联系人`}
              {getIn18Text('XIUGAIYINGXIAORENWU：')}
            </span>
            <SchemeInputBox
              errorMsg={replaceSchemeError}
              taskId={taskId}
              onChange={(val: SchemeInputValue) => {
                setNewScheme(val?.schemeId);
                setReplaceSchemeError('');
              }}
            />
          </div>
        </Modal>
        <Modal
          visible={groupModalVisible}
          title={getIn18Text('XIUGAIFENZU')}
          okText={getIn18Text('QUEREN')}
          onCancel={() => setGroupModalVisible(false)}
          onOk={handleReplaceGroup}
        >
          <div className={styles.modalContent}>
            <span>
              {getIn18Text('JIANG')}
              {selectedRowKeys.length === 1 ? selectedRowKeys[0] : `${selectedRowKeys.length}个联系人`}
              {getIn18Text('XIUGAIFENZU：')}
            </span>
            <GroupInputBox
              errorMsg={replaceGroupError}
              taskId={taskId}
              onChange={(val: GroupInputValue) => {
                setNewGroup(val);
                setReplaceGroupError('');
              }}
            />
          </div>
        </Modal>
        <AddContact
          receivers={[]}
          visible={contactVisible}
          readonly={false}
          sendReceivers={sendReceivers}
          containerHeight={containerHeight}
          onClose={() => setContactVisible(false)}
          sourceFrom="hostingManage"
        />
        {schemeAndgroupModalVisible && (
          <SechemeAndGroupBoxModal
            title={`共添加${lodashGet(contactsRef, 'current.contacts.length', 0)}个联系人，请完成设置`}
            visible={schemeAndgroupModalVisible}
            onCancel={() => onSechemeAndGroupCancel()}
            onConfirm={onSechemeAndGroupConfirm}
            taskId={taskId}
            defaultPlanId={planId}
            onCreate={onCreate}
          />
        )}
      </div>
      {replyListVisible && <ReplyListModal visible={replyListVisible} replyOperates={replyOperates} onCancel={() => setReplyListVisible(false)} />}
      <CustomerClue
        contacts={customerClueContacts}
        type={customerClueType}
        onClose={handleCustomerClueClose}
        initStatus={HOSTING_CUSTOMER_CLUE_KEY}
        // todo: 这里由于营销托管没这两个概念所以传空
        // 传这两个参数有两个用途，一是新建客户和线索时的统计，二是批量添加线索时传入接口，这两个待crm前端及服务端确认
        edmEmailId={taskId}
        edmSubject={lodashGet(customerClueContacts, `${HOSTING_CUSTOMER_CLUE_KEY}.0.planName`, '') as string}
        contactsMap={identityMap}
        edmType={2}
      />
    </>
  );
});
