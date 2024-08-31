/* eslint-disable jsx-a11y/anchor-is-valid */
import { ColumnsType } from 'antd/lib/table';
import React, { useEffect, useState } from 'react';
import { GroupTaskDetail, GroupTaskItem, api, apis, InsertWhatsAppApi, JoinGroupResult } from 'api';
import classnames from 'classnames';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
// import Breadcrumb from '@web-common/components/UI/Breadcrumb/breadcrumb';
// import BreadcrumbItem from '@web-common/components/UI/Breadcrumb/breadcrumbItem';
import Breadcrumb from '@lingxi-common-component/sirius-ui/Breadcrumb';
import TongyongShuaXin from '@web-common/images/newIcon/tongyong_shuaxin';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { useTaskBulkSend } from '../hooks/useWASend';
// eslint-disable-next-line import/order
import style from '@web-edm/edm.module.scss';
import localStyle from './index.module.scss';

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
const routerWord = api.getSystemApi().isWebWmEntry() ? 'intelliMarketing' : 'edm';

export const JoinGroupDetail = ({ qs }: { qs: Record<string, string> }) => {
  const [data, setData] = useState<GroupTaskDetail>();
  const [summary, setSummary] = useState<GroupTaskItem>();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { bulkSend } = useTaskBulkSend();
  const { taskId } = qs;

  const fetchSummary = () => {
    whatsAppApi.getGroupTaskSummary(taskId).then(res => setSummary(res));
  };
  const fetchData = (p: number = 1) => {
    setLoading(true);
    whatsAppApi
      .getGroupTaskDetail({
        taskId,
        page: p,
        pageSize: 20,
      })
      .then(res => {
        setTotal(res.totalSize);
        setData(res);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleRefreshData = () => {
    fetchSummary();
    fetchData(page);
  };

  useEffect(() => {
    fetchSummary();
    fetchData();
  }, []);

  const handleCheckResult = (link: string) => {
    // 重新加群接口
    whatsAppApi
      .checkJoinGroupResult({
        link,
        taskId,
      })
      .then(res => {
        if (res.linkStatus !== 'FAILURE') {
          handleRefreshData();
        }
      });
  };

  const handleCreateMultiSendTask = (item: { groupName: string; groupId: string; link: string; linkStatus: string; waCount: number }) => {
    if (!summary) return;
    bulkSend(summary.keyword, taskId, item.groupId || '', summary.createAt);
  };

  const columns: ColumnsType<JoinGroupResult> = [
    {
      key: 'groupName',
      dataIndex: 'groupName',
      title: '群名称',
      ellipsis: true,
    },
    {
      key: 'link',
      dataIndex: 'link',
      title: '群链接',
      ellipsis: true,
      render(link) {
        return (
          <a href={link} target="_blank" rel="noreferrer">
            {link}
          </a>
        );
      },
    },
    {
      key: 'linkStatus',
      title: '链接状态',
      dataIndex: 'linkStatus',
      render(linkStatus, item) {
        if (linkStatus === 'ERROR') {
          return '无效链接';
        }
        if (linkStatus === 'FAILURE') {
          return '加群失败';
        }
        return '已加成员 ' + item.waCount;
      },
    },
    {
      key: 'operate',
      title: '操作',
      render(_, item) {
        return (
          <>
            {item.linkStatus === 'FAILURE' && <a onClick={() => handleCheckResult(item.link)}>重新加入</a>}
            <PrivilegeCheck accessLabel="GROUP_SEND" resourceLabel="WHATSAPP_GROUP_SEND">
              {item.linkStatus === 'SUCCESS' && <a onClick={() => handleCreateMultiSendTask(item)}>去群发</a>}
            </PrivilegeCheck>
          </>
        );
      },
    },
  ];

  const summaryText = summary
    ? `通过“${summary?.keyword}”关键词查询，已选 ${summary?.linkCount}个群组加入，成功 ${summary?.linkSuccessCount} 个，失败 ${summary?.linkFailureCount} 个，无效链接${summary.linkErrorCount}个`
    : undefined;
  return (
    <div className={classnames(style.container, localStyle.container)}>
      <Breadcrumb arrowSeparator>
        <Breadcrumb.Item>Whatsapp群发</Breadcrumb.Item>
        <Breadcrumb.Item href={`#${routerWord}?page=marketWaGroupHistory`}>营销加群</Breadcrumb.Item>
        <Breadcrumb.Item>
          详情
          <span className={localStyle.refreshIcon} onClick={handleRefreshData}>
            <TongyongShuaXin />
          </span>
        </Breadcrumb.Item>
      </Breadcrumb>
      <div className={localStyle.mainContent}>
        <div className={localStyle.mainHeader}>{summaryText}</div>
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
  );
};

export default JoinGroupDetail;
