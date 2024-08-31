/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from 'react';
import { Space, Avatar, DatePicker, Dropdown, Menu } from 'antd';
import { navigate } from 'gatsby';
// import { ColumnsType } from 'antd/lib/table';
import moment, { Moment } from 'moment';
import { useInterval, useMount } from 'ahooks';
import { RangePickerProps } from 'antd/lib/date-picker';
import { api, apis, InsertWhatsAppApi, GroupTaskListRes, GroupTaskItem } from 'api';

import classnames from 'classnames';
// import Table, { TableColumnsType } from '@web-common/components/UI/Table';
import Table, { TableColumnsType } from '@lingxi-common-component/sirius-ui/Table';
// import Breadcrumb from '@web-common/components/UI/Breadcrumb/breadcrumb';
// import BreadcrumbItem from '@web-common/components/UI/Breadcrumb/breadcrumbItem';
import Breadcrumb from '@lingxi-common-component/sirius-ui/Breadcrumb';
import TongyongShuaXin from '@web-common/images/newIcon/tongyong_shuaxin';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import style from '@web-edm/edm.module.scss';

import { PrivilegeCheck, PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import localStyle from './index.module.scss';
import useWaLogin from '../components/waLogin';
import { useTaskBulkSend } from '../hooks/useWASend';
import { ReactComponent as WaDefaultAvatar } from '@/images/icons/SNS/whatsapp-default-avatar.svg';
import DropDownIcon from '@/components/Layout/Worktable/icons/DropDown';
import { track } from '../tracker';

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

const { RangePicker } = DatePicker;

const TaskStatusMap: Record<string, string> = {
  WAIT: '未开始',
  RUNNING: '进行中',
  FINISH: '已完成',
};

const disabledDate: RangePickerProps['disabledDate'] = (current: Moment) => current && current > moment().endOf('day');

export const GroupHistory = () => {
  const [data, setData] = useState<GroupTaskListRes>();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [dateRange, setDateRange] = useState<string[]>();
  const { isLogin, login, waInfo, logout, isBind } = useWaLogin();
  const { bulkSend } = useTaskBulkSend();

  const fetchData = (p: number = 1, k?: string, range?: string[]) => {
    setLoading(true);
    whatsAppApi
      .getGroupTaskList({
        page: p,
        pageSzie: 20,
        searchKeyword: k,
        createAtEnd: range ? range[1] : undefined,
        createAtStart: range ? range[0] : undefined,
      })
      .then(res => {
        setData(res);
        setTotal(res.totalSize);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData(page);
  }, []);

  const handleKeywordChange = () => {
    track.waGroupTrack('search');
    setPage(1);
    fetchData(1, keyword, dateRange);
  };

  const handleViewDetail = (taskId: string) => {
    navigate('#edm?page=waJoinGroupDetail&taskId=' + taskId);
    track.waGroupTrack('details');
  };
  const handleCreateMultiSendTask = (item: GroupTaskItem) => {
    bulkSend(item.keyword, item.taskId, '', item.createAt);
    track.waGroupTrack('bulk_sender');
  };

  const handleRefreshData = () => {
    fetchData(page, keyword, dateRange);
  };

  // 60s 刷新一次
  useInterval(() => {
    fetchData(page);
  }, 1000 * 60);

  useMount(() => {
    track.waGroupTrack('show');
  });

  const columns: TableColumnsType<GroupTaskItem> = [
    {
      key: 'keyword',
      dataIndex: 'keyword',
      title: '搜索关键词',
      ellipsis: true,
    },
    {
      key: 'waCount',
      dataIndex: 'waCount',
      title: '已加群组whatsapp总数',
      width: 190,
    },
    {
      key: 'linkSuccessCount',
      dataIndex: 'linkSuccessCount',
      title: '加群成功数',
    },
    {
      key: 'linkFailureCount',
      dataIndex: 'linkFailureCount',
      title: '加群失败数',
    },
    {
      key: 'linkErrorCount',
      dataIndex: 'linkErrorCount',
      title: '无效链接数',
      ellipsis: true,
    },
    {
      key: 'taskStatus',
      dataIndex: 'taskStatus',
      title: '状态',
      render(taskStatus) {
        return TaskStatusMap[taskStatus] || taskStatus;
      },
    },
    {
      key: 'createAt',
      dataIndex: 'createAt',
      title: '创建时间',
    },
    {
      key: 'operate',
      title: '操作',
      render(_, item) {
        return (
          <Space>
            <a onClick={() => handleViewDetail(item.taskId)}>详情</a>
            <PrivilegeCheck accessLabel="GROUP_SEND" resourceLabel="WHATSAPP_GROUP_SEND">
              {(item.taskStatus === 'FINISH' || item.taskStatus === '已完成') && <a onClick={() => handleCreateMultiSendTask(item)}>去群发</a>}
            </PrivilegeCheck>
          </Space>
        );
      },
    },
  ];
  return (
    <PermissionCheckPage resourceLabel="WHATSAPP_GROUP_SEND" accessLabel="VIEW" menu="WHATSAPP_MARKETING_ADD_GROUP">
      <div className={classnames(style.container, localStyle.container)}>
        <Breadcrumb arrowSeparator>
          <Breadcrumb.Item>Whatsapp群发</Breadcrumb.Item>
          <Breadcrumb.Item>
            营销加群
            <span className={localStyle.refreshIcon} onClick={handleRefreshData}>
              <TongyongShuaXin />
            </span>
          </Breadcrumb.Item>
        </Breadcrumb>
        <div className={localStyle.mainContent}>
          <div className={localStyle.mainHeader}>
            <div className={localStyle.headerLeft}>
              <Space>
                <Input
                  placeholder="请输入关键词"
                  style={{ width: 165 }}
                  onChange={e => setKeyword(e.target.value)}
                  onBlur={() => handleKeywordChange()}
                  onPressEnter={() => handleKeywordChange()}
                />
                <RangePicker
                  className="edm-range-picker"
                  dropdownClassName="edm-date-picker-dropdown-wrap"
                  disabledDate={disabledDate}
                  format="YYYY-MM-DD"
                  onChange={(d, f) => {
                    track.waGroupTrack('date');
                    setDateRange(f);
                    setPage(1);
                    fetchData(1, keyword, f);
                  }}
                />
              </Space>
            </div>
            <div className={localStyle.headerRight}>
              {isLogin ? (
                <Avatar src={waInfo?.avatarUrl ? waInfo.avatarUrl : <WaDefaultAvatar />} size={24} />
              ) : (
                <div onClick={login}>
                  <Avatar src={<WaDefaultAvatar />} size={24} />
                </div>
              )}
              <span>{waInfo ? waInfo.name || waInfo.waId.split('@')[0] : '未登录'}</span>
              {isBind ? (
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item onClick={logout}>移除设备</Menu.Item>
                    </Menu>
                  }
                >
                  <span className={localStyle.dropdownTarget}>
                    <DropDownIcon />
                  </span>
                </Dropdown>
              ) : null}
            </div>
          </div>
          <div>
            <Table
              columns={columns}
              dataSource={data?.content}
              loading={loading}
              pagination={{
                showSizeChanger: false,
                current: page,
                pageSize: 20,
                total,
                hideOnSinglePage: true,
                onChange: (p: number) => {
                  setPage(p);
                  fetchData(p);
                },
              }}
            />
          </div>
        </div>
      </div>
    </PermissionCheckPage>
  );
};

export default GroupHistory;
