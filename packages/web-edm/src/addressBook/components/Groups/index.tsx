import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apis, apiHolder, AddressBookApi, AddressBookNewApi, AddressBookGroupType, AddressBookGroupsParams, MarktingContactGroup } from 'api';
import moment from 'moment';
import classnames from 'classnames';
import { Button, Table, Space, Menu, Dropdown, Input, Tooltip } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import DownOutlined from '@ant-design/icons/DownOutlined';
import useEdmSendCount from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import { AddGroup } from './addGroup';
import { getBodyFixHeight } from '@web-common/utils/constant';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { useAppSelector } from '@web-common/state/createStore';
import { ReactComponent as SearchIcon } from '@/images/icons/edm/addressBook/search-icon.svg';
import { ReactComponent as EditIcon } from '@/images/icons/edm/addressBook/edit-icon.svg';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import addressBookStyle from '../../addressBook.module.scss';
import style from './index.module.scss';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';
import { MarktingGroupConfig } from './marktingConfigModal';
import { AddGroup2GroupModal } from './addGroup2GroupModal';
// import debounce from 'lodash/debounce';
import { getSendCount } from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import { jumpToAddressListContactList, convertGroup2Filter, recordDataTracker } from '../../utils';
import qs from 'querystring';
import { useRequest } from 'ahooks';

const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;
const defaultPagination = {
  page: 1,
  pageSize: 20,
};
interface MarketItem {
  contactName: string;
  contactEmail: string;
}
interface GroupsProps {}
const Groups: React.FC<GroupsProps> = props => {
  const hasOp = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CHANNEL', 'OP'));
  const hasDelete = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CHANNEL', 'DELETE'));
  const [params, setParams] = useState<AddressBookGroupsParams>({
    groupName: '',
    ...defaultPagination,
  });
  const query = useMemo(() => {
    return qs.parse(location.hash.split('?')[1]);
  }, [location.hash]);
  const [data, setData] = useState<MarktingContactGroup[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  // 创建分组
  const [createGroupVisible, setcreateGroupVisible] = useState<boolean>(false);
  // 添加至分组
  const [addToGroupVisible, setAddToGroupVisible] = useState<boolean>(false);
  const [groupItem4Group2Group, setGroupItem4Group2Group] = useState<MarktingContactGroup | null>(null);
  const [editGroupId, setEditGroupId] = useState(0);

  // 配置营销
  const [marktingConfigVisible, setMarktingConfigVisible] = useState<boolean>(false);
  const [groupItem4MarktingConfig, setGroupItem4marktingConfig] = useState<MarktingContactGroup | null>(null);

  useEdmSendCount([], undefined, undefined, undefined, undefined, 'addressBook');

  useEffect(() => {
    recordDataTracker('pc_marketing_contactBook_group', {
      action: 'group',
    });
  }, []);

  // 如果修改自动营销托管
  useEffect(() => {
    if (!query?.refreshkey || !(query?.refreshkey as string)?.startsWith('groups')) {
      return;
    }
    triggerFetch();
  }, [query?.refreshkey]);

  // 手动触发过滤器更新;
  const triggerFetch = () => setParams({ ...params });
  // 手动触发过滤器更新 (回到第 1 页);
  const triggerFetchFirstPage = () => setParams({ ...params, ...defaultPagination });
  const handleDetailNavigate = (group: MarktingContactGroup) => {
    // navigate(`#edm?page=addressBookGroupDetail&groupId=${group.groupId}&groupType=${group.groupType}`);
    // message.success('todo:需要跳转到主页');
    jumpToAddressListContactList({
      filter: convertGroup2Filter(group),
      backUrl: '#edm?page=addressBookIndex',
      backName: getIn18Text('YINGXIAOLIANXIREN'),
      listName: group?.group_name,
      // target: 'overview',
    });
  };

  // 新建分组
  const createGroupDone = (hasNewGroup?: boolean) => {
    setcreateGroupVisible(false);
    if (hasNewGroup) {
      recordDataTracker('pc_marketing_contactBook_group', { action: 'create' });
      triggerFetch();
      Message.success({ content: getIn18Text('XINJIANCHENGGONG') });
    }
  };

  // 一键营销
  const handleMarket = async (group: MarktingContactGroup) => {
    if (!group.count) {
      Message.info({ content: getIn18Text('DANGQIANFENZUZANWULIANXIREN') });
      return;
    }

    const groupedFilter = convertGroup2Filter(group);

    const list = await addressBookNewApi.getMarktingFiltedEmails({ groupedFilter });

    recordDataTracker('pc_marketing_contactBook_group', { action: 'edm' });

    getSendCount({
      emailList: list.map(item => {
        return {
          contactEmail: item.email,
          contactName: item.contact_name,
          sourceName: item.source_name,
        };
      }),
      from: 'addressBook',
    });
  };

  // 添加到分组
  const handleAddToGroup = (group: MarktingContactGroup) => {
    setAddToGroupVisible(true);
    recordDataTracker('pc_marketing_contactBook_group', { action: 'addGroup' });
    setGroupItem4Group2Group(group);
  };

  const handleGroupDelete = (group: MarktingContactGroup) => {
    Modal.confirm({
      title: `确定删除[${group.group_name}]分组？`,
      content: '删除分组后，若该分组的联系人无其他分组，则自动进入 [未分组] 中',
      async onOk() {
        await addressBookNewApi.deleteGroup(group.id);
        recordDataTracker('pc_marketing_contactBook_group', { action: 'delete' });
        triggerFetchFirstPage();
        Message.success({ content: getIn18Text('SHANCHUCHENGGONG') });
      },
    });
  };

  const handleGroupNameSubmit = async (groupName: string, group: MarktingContactGroup) => {
    if (!groupName.trim()) {
      Message.error({ content: getIn18Text('QINGSHURUFENZUMINGCHENG') });
      return;
    } else if (groupName.length > 20) {
      Message.error({ content: getIn18Text('FENZUMINGCHENGZUIDUOSHURU20GEZI') });
      return;
    } else if (groupName === group.group_name) {
      setEditGroupId(0);
      return;
    }

    await addressBookNewApi.updateGroup(group.id, groupName);
    recordDataTracker('pc_marketing_contactBook_group', { action: 'edit' });
    setEditGroupId(0);
    triggerFetch();
    Message.success({ content: getIn18Text('GENGXINCHENGGONG') });
  };

  const { run: fetchGroupsListData } = useRequest(
    async (params: AddressBookGroupsParams, config: { didCancel: boolean }) => {
      const { content, total_page, total_size } = await addressBookNewApi.getGroupListWithPage({
        page: params.page,
        page_size: params.pageSize,
        group_name_fuzzy: params.groupName,
      });
      if (!config.didCancel) {
        setData(content);
        setTotal(total_size);
      }
    },
    {
      onBefore() {
        setLoading(true);
      },
      onFinally() {
        setLoading(false);
      },
      manual: true,
    }
  );

  const { run: debounceSearchTrigger } = useRequest(
    async (keyword: string) => {
      setParams(params => {
        return {
          ...params,
          groupName: keyword,
        };
      });

      recordDataTracker('pc_marketing_contactBook_group', { action: 'search' });
    },
    {
      debounceMaxWait: 300,
      manual: true,
    }
  );

  useEffect(() => {
    console.log('xxxxxx', data);
  }, [data.length]);

  useEffect(() => {
    let config = {
      didCancel: false,
    };
    fetchGroupsListData(params, config);
    return () => {
      config.didCancel = true;
    };
  }, [params]);

  // 展示赢下配置
  const showMarktingConfig = (item: MarktingContactGroup) => {
    setMarktingConfigVisible(true);

    recordDataTracker('pc_marketing_contactBook_group', { action: item.edm_plan_id?.length ? 'host' : 'noHost' });

    setGroupItem4marktingConfig(item);
  };

  const columns: ColumnsType<any> = [
    {
      title: getIn18Text('FENZUMINGCHENG'),
      className: style.maxWidthCell,
      dataIndex: 'group_name',
      render: (text: string, item: MarktingContactGroup) => {
        return (
          <div className={style.groupNameCell}>
            {editGroupId !== item.id ? (
              <EllipsisTooltip>
                <a onClick={() => handleDetailNavigate(item)}>{text}</a>
              </EllipsisTooltip>
            ) : null}
            {editGroupId !== item.id && item.group_type === 1 ? (
              <PrivilegeCheck accessLabel="OP" resourceLabel="CHANNEL">
                <Tooltip title={getIn18Text('BIANJI')}>
                  <span className={style.groupNameEditWrapper} onClick={() => setEditGroupId(item.id)}>
                    <EditIcon className={style.groupNameEdit} />
                  </span>
                </Tooltip>
              </PrivilegeCheck>
            ) : null}
            {editGroupId === item.id ? (
              <Input
                className={style.groupNameInput}
                autoFocus
                maxLength={20}
                placeholder={getIn18Text('QINGSHURUFENZUMINGCHENG')}
                defaultValue={text}
                onPressEnter={event => handleGroupNameSubmit(event.currentTarget.value, item)}
                onBlur={event => handleGroupNameSubmit(event.target.value, item)}
              />
            ) : null}
          </div>
        );
      },
    },
    {
      title: getIn18Text('FENZUCHUANGJIANSHIJIAN'),
      dataIndex: 'create_time',
      render: (timestamp: number, rowData) => {
        // console.log('createTime', timestamp, rowData);
        return timestamp ? moment(timestamp).format('YYYY-MM-DD HH:mm') : '-';
      },
    },
    {
      title: getIn18Text('LIANXIRENSHU'),
      dataIndex: 'count',
      key: 'id',
      className: style.minWidthCell,
      render(count) {
        // console.log('createTime111', count);
        return count;
      },
    },
    {
      title: '营销托管',
      // className: style.minWidthCell,
      dataIndex: 'edm_plan_id',
      key: 'id',
      width: 105,
      render(edmPlanId: string, item: MarktingContactGroup) {
        if (edmPlanId && edmPlanId.length) {
          return (
            <div
              onClick={() => {
                showMarktingConfig(item);
              }}
              className={classnames(style.state, style.successState)}
            >
              {getTransText('YIPEIZHI')}
            </div>
          );
        }
        return (
          <div
            onClick={() => {
              showMarktingConfig(item);
            }}
            className={classnames(style.state, style.errorState)}
          >
            {getTransText('WEIPEIZHI')}
          </div>
        );
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 180,
      fixed: 'right',
      dataIndex: 'operations',
      render: (text: string, item: MarktingContactGroup) => {
        const enableOp = !!item.count && hasOp;
        const enableDelete = hasDelete && item.group_type !== AddressBookGroupType.SYSTEM;
        return (
          <Space size={20}>
            <a
              onClick={() => {
                handleMarket(item);
              }}
            >
              {getIn18Text('YIJIANYINGXIAO')}
            </a>

            {(enableOp || enableDelete) && (
              <Dropdown
                overlay={
                  <Menu>
                    {/* <PrivilegeCheck accessLabel="OP" resourceLabel="ADDRESS_BOOK"></PrivilegeCheck> */}
                    {enableOp && (
                      <Menu.Item
                        onClick={() => {
                          handleAddToGroup(item);
                        }}
                      >
                        {getIn18Text('TIANJIAZHIFENZU')}
                      </Menu.Item>
                    )}
                    {enableDelete && (
                      <Menu.Item
                        onClick={() => {
                          handleGroupDelete(item);
                        }}
                      >
                        {getIn18Text('SHANCHUFENZU')}
                      </Menu.Item>
                    )}
                  </Menu>
                }
                placement="bottomRight"
              >
                <a onClick={e => e.preventDefault()}>
                  {getIn18Text('GENGDUO')}
                  <DownOutlined style={{ marginLeft: 2 }} />
                </a>
              </Dropdown>
            )}
          </Space>
        );
      },
    },
  ];
  return (
    <div className={style.groups}>
      <div className={style.content}>
        <div className={style.titleAndFilter}>
          <div className={style.title}>{getIn18Text('QUANBUFENZU')}</div>
          <div className={style.filter}>
            <Input
              style={{ width: 296 }}
              placeholder="搜索分组"
              className={style.searchInput}
              onChange={event => {
                debounceSearchTrigger(event.target.value);
              }}
              allowClear
              prefix={<SearchIcon />}
            />
            <PrivilegeCheck accessLabel="OP" resourceLabel="CHANNEL">
              <Button
                type="primary"
                onClick={() => {
                  setcreateGroupVisible(true);
                }}
              >
                {getIn18Text('XINJIANFENZU')}
              </Button>
            </PrivilegeCheck>
          </div>
        </div>
        <Table<MarktingContactGroup>
          className={classnames(addressBookStyle.table, addressBookStyle.tableDeepHead)}
          rowKey={row => {
            return `${row['id']}`;
          }}
          scroll={{ x: 'max-content', y: `calc(100vh - ${getBodyFixHeight(true) ? 396 : 428}px)` }}
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{
            className: 'pagination-wrap',
            size: 'small',
            total,
            current: params.page,
            pageSize: params.pageSize,
            pageSizeOptions: ['20', '50', '100'],
            showSizeChanger: true,
            showTotal(total: number) {
              return (
                <span style={{ position: 'absolute', left: 0 }}>
                  {getIn18Text('GONG')}
                  {total}
                  {getIn18Text('GEFENZU')}
                </span>
              );
            },
          }}
          onChange={pagination => {
            setParams(previous => ({
              ...previous,
              pageSize: pagination.pageSize as number,
              page: pagination.pageSize === previous.pageSize ? (pagination.current as number) : 1,
            }));
          }}
        />
      </div>
      {createGroupVisible && <AddGroup onclose={createGroupDone} />}

      {addToGroupVisible && groupItem4Group2Group && (
        <AddGroup2GroupModal
          groupItem={groupItem4Group2Group}
          onclose={flag => {
            setAddToGroupVisible(false);
            flag && triggerFetch();
          }}
          visible={addToGroupVisible}
        />
      )}

      {marktingConfigVisible && groupItem4MarktingConfig ? (
        <MarktingGroupConfig
          groupItem={groupItem4MarktingConfig}
          visible={marktingConfigVisible}
          onclose={flag => {
            setMarktingConfigVisible(false);
            flag && triggerFetch();
          }}
        />
      ) : null}
    </div>
  );
};
export default Groups;
