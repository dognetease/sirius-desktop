/*
 * @Author: zhangqingsong
 * @Description: 管理联系人页面
 */
import React, { FC, useState, useCallback, useEffect, useRef } from 'react';
import classnames from 'classnames';
import debounce from 'lodash/debounce';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import Breadcrumb from '@lingxi-common-component/sirius-ui/Breadcrumb';
import { AiHostingApi, apiHolder, apis, ReplyContactListReq, ReplyContactListItem, RequestOperateListV2 } from 'api';
import { getBodyFixHeight } from '@web-common/utils/constant';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import SchemeInputBox, { SchemeInputValue } from '../components/SchemeInputBox/SchemeInputBox';
import styles from './ReplyContact.module.scss';
import { getIn18Text } from 'api';
import { ReplyListModal } from './ReplyListModal';

const aiHostingApi = apiHolder.api.requireLogicalApi(apis.aiHostingApiImpl) as AiHostingApi;

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
const renderGrayClass = (item: ReplyContactListItem) => {
  // return item.userTaskStatus === 1 ? {} : styles.tableGray;
  return {};
};

const ReplyContact: FC<{
  taskId: string;
  // 返回上一页
  goBackAi?: () => void;
  planId?: string;
}> = props => {
  const { taskId, goBackAi, planId } = props;
  console.log('ReplyContact=====props', props);
  // 列表表头配置
  const columns = [
    {
      title: getIn18Text('YOUJIANDEZHI'),
      fixed: 'left',
      dataIndex: 'email',
      render: (value: string) => <span className={styles.tableAstrict}>{value || '-'}</span>,
    },
    {
      title: getIn18Text('LIANXIRENXINGMING'),
      width: 120,
      dataIndex: 'name',
      render: (value: string, item: ReplyContactListItem) => <span className={classnames(styles.tableAstrict, renderGrayClass(item))}>{value || '-'}</span>,
    },
    {
      title: getIn18Text('LIANXIRENLAIYUAN'),
      width: 120,
      dataIndex: 'userSource',
      render: (value: number, item: ReplyContactListItem) => (
        <span className={classnames(styles.tableAstrict, renderGrayClass(item))}>{sourceFilterConfig.find(source => source.status === value)?.desc || '-'}</span>
      ),
    },
    {
      title: getIn18Text('YINGXIAORENWU'),
      width: 100,
      dataIndex: 'edmSubject',
      render: (value: string, item: ReplyContactListItem) => <span className={renderGrayClass(item)}>{value || '-'}</span>,
    },
    {
      title: getIn18Text('HUIFUCISHU'),
      width: 100,
      dataIndex: 'replyCount',
      render: (value: string, item: ReplyContactListItem) => <span className={renderGrayClass(item)}>{value || '-'}</span>,
    },
    {
      title: getIn18Text('ZUIJINHUIFUSHIJIAN'),
      dataIndex: 'lastReplyTime',
      render: (value: string, item: ReplyContactListItem) => <span className={renderGrayClass(item)}>{value || '-'}</span>,
    },
    {
      title: getIn18Text('CAOZUO'),
      fixed: 'right',
      width: 100,
      dataIndex: '',
      ignoreExport: true,
      render: (item: ReplyContactListItem) => (
        <div className={styles.operation}>
          <span
            className={styles.operationItem}
            onClick={() => {
              openReplyModal(item);
            }}
          >
            {getIn18Text('CHAKANHUIFU')}
          </span>
        </div>
      ),
    },
  ];
  // 筛选营销任务选中
  const [contactScheme, setContactScheme] = useState<string>(planId || '');
  // 筛选邮件地址
  const [contactInput, setContactInput] = useState<string>();
  // 列表分页配置
  const [pageInfo, setPageInfo] = useState({ current: 1, pageSize: 20, total: 0 });
  // 列表数据加载状态
  const [loading, setLoading] = useState<boolean>(false);
  // 所有已加载去重数据，用于导出
  const [totalData, setTotalData] = useState<ReplyContactListItem[]>([]);
  // 回复列表显示
  const [replyListVisible, setReplyListVisible] = useState<boolean>(false);

  const [replyOperates, setReplyOperates] = useState<RequestOperateListV2>();

  const containerRef = useRef<HTMLDivElement>(null);

  // 多选配置
  // 邮件地址/联系人姓名筛选变化
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

  // 获取联系人列表数据
  const getTableData = async () => {
    // 可连续触发搜索，不判断loading
    setLoading(true);
    const params: ReplyContactListReq = {
      taskId,
    };
    if (contactScheme !== '-1') {
      params.planId = contactScheme;
    }
    if (contactInput) {
      params.contactEmail = contactInput.trim();
    }
    try {
      const result = await aiHostingApi.getAiHostingReplyContactList(params);
      setTotalData(result.replyList || []);
      updatePageInfo({ ...pageInfo, total: result?.replyList?.length || 0, current: 1 });
      setLoading(false);
    } catch (err) {
      setTotalData([]);
      // setTableData([]);
      setLoading(false);
    }
  };

  // 分页器相关操作
  const updatePageInfo = pInfo => {
    // 当前页面无数据的情况（全选删除最后一页会出现）
    if (pInfo.pageSize * (pInfo.current - 1) >= pInfo.total) {
      setPageInfo({ ...pInfo, current: pInfo.current > 1 ? pInfo.current - 1 : pInfo.current });
    } else {
      setPageInfo(pInfo);
    }
  };

  const openReplyModal = (item: ReplyContactListItem) => {
    setReplyOperates({
      taskId,
      edmEmailIds: item.edmEmailIds,
      contactEmail: item.email,
    });
    setReplyListVisible(true);
  };

  // 筛选变化执行列表筛选搜索
  useEffect(() => {
    getTableData();
  }, [contactScheme, contactInput]);

  useEffect(() => {
    if (planId !== '') {
      setContactScheme(planId);
    }
  }, [planId]);

  // 返回结构
  return (
    <>
      <div className={`${styles.manageContacts}`} ref={containerRef}>
        {/* 面包屑区域 */}
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
          <Breadcrumb.Item>{'营销回复'}</Breadcrumb.Item>
        </Breadcrumb>
        <div className={styles.header}>
          <div className={styles.headerFilter}>
            <SchemeInputBox taskId={taskId} showTag={false} showTotal onChange={(val: SchemeInputValue) => setContactScheme(val?.schemeId)} />
            <Input
              className={styles.input}
              placeholder={getIn18Text('QINGSHURUYOUJIANDEZHI')}
              onChange={handleInput}
              prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
            />
          </div>
        </div>
        <SiriusTable
          className={styles.table}
          loading={loading}
          rowKey={item => item.email}
          columns={columns}
          dataSource={totalData.slice((pageInfo.current - 1) * pageInfo.pageSize, pageInfo.current * pageInfo.pageSize)}
          scroll={{ x: 'max-content', y: `calc(100vh - ${getBodyFixHeight(true, undefined, true) + 289}px)` }}
          onChange={updatePageInfo}
          pagination={false}
        />
        {pageInfo.total >= 10 && (
          <div className={`${styles.pagination}`}>
            <SiriusPagination
              showTotal={total => `共${total}条数据`}
              showQuickJumper
              current={pageInfo.current}
              pageSize={pageInfo.pageSize}
              total={pageInfo.total}
              pageSizeOptions={['20', '50', '100']}
              onChange={(current: number, pageSize?: number) => updatePageInfo({ ...pageInfo, current, pageSize: pageSize || pageInfo.pageSize })}
            />
          </div>
        )}
      </div>
      {replyListVisible && <ReplyListModal visible={replyListVisible} replyOperates={replyOperates} onCancel={() => setReplyListVisible(false)} />}
    </>
  );
};

export default ReplyContact;
