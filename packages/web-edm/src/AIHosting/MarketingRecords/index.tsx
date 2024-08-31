import React, { FC, useState, useEffect, useCallback } from 'react';
import { Tabs, Table, message, Pagination, Skeleton, Breadcrumb, Modal } from 'antd';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import SiriusSelect from '@web-common/components/UI/SiriusSelect';
// import type {ColumnsType} from 'antd/lib/table';
import type { ColumnsType } from 'antd/es/table';
import {
  DailyDetailSend,
  DailyDetailReplay,
  DailyDetailUnsubscribe,
  DailyDetailTabs,
  DailyDetailType,
  GetAiDailyDetailReq,
  GetAiDailyDetailRes,
  AiDetailList,
  apiHolder,
  apis,
  EdmSendBoxApi,
  GetReplayListRes,
  GetReplayListReq,
  GetReplayListItem,
} from 'api';
import classnames from 'classnames';

import { openMail } from '../../detail/detailHelper';
import { NoData } from '../DataView/Nodata';
import styles from './MarketingRecords.module.scss';
import { getIn18Text } from 'api';

const { TabPane } = Tabs;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

const TabConf = [
  {
    label: getIn18Text('FASONGXIANGQING'),
    key: DailyDetailTabs[0],
  },
  {
    label: getIn18Text('HUIFULIANXIREN'),
    key: DailyDetailTabs[1],
  },
  {
    label: getIn18Text('TUIDINGLIANXIREN'),
    key: DailyDetailTabs[2],
  },
];

interface Scroll {
  x?: string | number | true | undefined;
  y?: string | number | undefined;
}

const beforeOpenMail = (item: GetReplayListItem) => {
  if (item.edmEmailId) {
    openMail('', item.edmEmailId, '', `${item.email}|undefined`);
  } else {
    openMail(item.emailMid, item.edmEmailId, item.operateId);
  }
};

const listColumns: ColumnsType<{}> = [
  {
    title: getIn18Text('HUIFUSHIJIAN'),
    dataIndex: 'replyTime',
    key: 'replyTime',
  },
  {
    title: getIn18Text('YOUJIANXIANGQING'),
    // dataIndex: '',
    key: '',
    render: (item: GetReplayListItem) => <a onClick={() => beforeOpenMail(item)}>{getIn18Text('YOUJIANXIANGQING')}</a>,
  },
];

const scrolls = [
  {
    x: 992,
    y: 'calc(100% - 48px)',
  },
];

const getDetailKey = (type: DailyDetailType): keyof AiDetailList => {
  switch (type) {
    case 'SEND':
      return 'sendList';
    case 'REPLY':
      return 'replyList';
    case 'UNSUBSCRIBE':
      return 'unsubscribeList';
  }
};

export const MarketingRecords: FC<{
  date: string;
  goHome: () => void;
  taskId: string;
  planId: string;
}> = ({ date, goHome, taskId, planId }) => {
  const [tab, setTab] = useState<DailyDetailType>(DailyDetailTabs[0]);
  const [query, setQuery] = useState<GetAiDailyDetailReq>({
    date,
    page: 1,
    pageSize: 20,
    type: 'SEND',
    taskId,
    planId,
  });
  const [detailData, setDetailData] = useState<Partial<GetAiDailyDetailRes>>({});
  const [curReplayList, setCurReplayList] = useState<Array<GetReplayListItem>>([]);
  const [plan, setPlan] = useState<string>(planId || '');
  const [option, setOption] = useState<
    Array<{
      label: string;
      value: any;
    }>
  >();

  const getPlanName = (planId: string): string => {
    if (option == null || planId == null) {
      return '--';
    }
    const cur = option.find(item => item.value === planId);
    if (cur == null) {
      return '--';
    }
    return cur.label;
  };

  // 下面是table配置
  const columns1: ColumnsType<DailyDetailSend> = [
    {
      title: getIn18Text('FAJIANDEZHI'),
      dataIndex: 'senderEmail',
      key: 'senderEmail',
      width: 181,
    },
    {
      title: getIn18Text('YOUJIANDEZHI'),
      dataIndex: 'email',
      key: 'email',
      width: 181,
    },
    {
      title: getIn18Text('LIANXIRENXINGMING'),
      dataIndex: 'name',
      key: 'name',
      width: 95,
    },
    {
      title: getIn18Text('YINGXIAORENWU'),
      dataIndex: 'planName',
      key: 'planName',
      width: 95,
      // render: text => <span>{getPlanName(text)}</span>,
    },
    {
      title: getIn18Text('FASONGSHIJIAN'),
      dataIndex: 'sendTime',
      key: 'sendTime',
      width: 171,
    },
    {
      title: getIn18Text('SONGDAZHUANGTAI'),
      dataIndex: 'arrive',
      key: 'arrive',
      width: 93,
      render: text => <span>{text ? getIn18Text('YISONGDA') : getIn18Text('WEISONGDA')}</span>,
    },
    {
      title: getIn18Text('DAKAIZHUANGTAI'),
      dataIndex: 'read',
      key: 'read',
      width: 93,
      render: text => <span>{text ? getIn18Text('YIDAKAI') : getIn18Text('WEIDAKAI')}</span>,
    },
    {
      title: getIn18Text('HUIFUZHUANGTAI'),
      dataIndex: 'reply',
      key: 'reply',
      width: 93,
      render: text => <span>{text ? getIn18Text('YIHUIFU') : getIn18Text('WEIHUIFU')}</span>,
    },
    {
      title: getIn18Text('TUIDINGZHUANGTAI'),
      dataIndex: 'unsubscribe',
      key: 'unsubscribe',
      width: 93,
      render: text => <span>{text ? getIn18Text('YITUIDING') : getIn18Text('WEITUIDING')}</span>,
    },
    {
      title: getIn18Text('LIANJIEDIANJISHU'),
      dataIndex: 'traceClickNum',
      key: 'traceClickNum',
      width: 124,
    },
    // 本期先不加
    // {
    //   title: '商品点击数',
    //   dataIndex: '',
    //   key: '',
    //   width: 93,
    // },
    {
      title: getIn18Text('CAOZUO'),
      // dataIndex: '',
      key: '',
      width: 69,
      fixed: 'right',
      render: item => <a onClick={() => beforeOpenMail(item)}>{getIn18Text('XIANGQING')}</a>,
    },
  ];
  const columns3: ColumnsType<DailyDetailReplay> = [
    {
      title: getIn18Text('FAJIANDEZHI'),
      dataIndex: 'senderEmail',
      key: 'senderEmail',
    },
    {
      title: getIn18Text('YOUJIANDEZHI'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: getIn18Text('LIANXIRENXINGMING'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: getIn18Text('YINGXIAORENWU'),
      dataIndex: 'planId',
      key: 'planId',
      width: 95,
      render: text => <span>{getPlanName(text)}</span>,
    },
    {
      title: getIn18Text('TUIDINGSHIJIAN'),
      dataIndex: 'unsubscribeTime',
      key: 'unsubscribeTime',
    },
    {
      title: getIn18Text('CAOZUO'),
      // dataIndex: 'email',
      key: 'email',
      width: 154,
      render: item => <a onClick={() => beforeOpenMail(item)}>{getIn18Text('CHAKANYOUJIAN')}</a>,
    },
  ];

  const columns2: ColumnsType<DailyDetailReplay> = [
    {
      title: getIn18Text('FAJIANDEZHI'),
      dataIndex: 'senderEmail',
      key: 'senderEmail',
    },
    {
      title: getIn18Text('YOUJIANDEZHI'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: getIn18Text('LIANXIRENXINGMING'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: getIn18Text('YINGXIAORENWU'),
      dataIndex: 'planId',
      key: 'planId',
      width: 95,
      render: text => <span>{getPlanName(text)}</span>,
    },
    {
      title: getIn18Text('HUIFUSHIJIAN'),
      dataIndex: 'replyTime',
      key: 'replyTime',
    },
    {
      title: getIn18Text('CAOZUO'),
      // dataIndex: 'email',
      key: 'email',
      width: 154,
      render: (item: DailyDetailReplay) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <a
            onClick={() =>
              queryReplayList({
                accId: item.accId,
                edmEmailId: item.edmEmailId,
                email: item.email,
              })
            }
            style={{
              flex: 1,
            }}
          >
            {getIn18Text('CHAKANYOUJIAN')}
          </a>
          {/* <div style={{
            width: 1,
            height: 14,
            background: '#E1E3E8',
          }}></div>
          <a style={{
            flex: 1,
          }}>发邮件</a> */}
        </div>
      ),
    },
  ];

  const columnsConf = [columns1, columns2, columns3];

  // const [columns, setColumns] = useState<ColumnsType<any>>(columns1);
  const [tableConf, setTableConf] = useState<{
    columns: ColumnsType<any>;
    scroll: Scroll;
  }>({
    columns: columns1,
    scroll: scrolls[0],
  });
  // 是否显示查看邮件列表
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    const index = DailyDetailTabs.findIndex(item => tab === item);
    setTableConf({
      columns: columnsConf[index],
      scroll: scrolls[index],
    });
  }, [tab, option]);

  useEffect(() => {
    if (query && option != null) {
      setQuery({
        ...query,
        type: tab,
        planId: plan,
      });
    }
  }, [tab, option]);

  useEffect(() => {
    if (query && option != null) {
      setQuery({
        ...query,
        planId: plan,
        page: 1,
      });
    }
  }, [plan, option]);

  const queryPlanList = useCallback(async () => {
    if (taskId == null) {
      return;
    }
    try {
      const res = await edmApi.getAiHostingPlanList({ taskId: taskId });
      setOption([
        {
          label: getIn18Text('QUANBUYINGXIAORENWU'),
          value: '',
        },
        ...res.map(item => ({
          label: item.planName,
          value: item.planId,
        })),
      ]);
    } catch (err: any) {
      message.error(err?.message || err?.msg || '获取数据失败，请重试！');
    }
  }, [taskId, setOption]);

  useEffect(() => {
    queryPlanList();
  }, [taskId]);

  const queryList = useCallback(async () => {
    try {
      const res = await edmApi.getAiDailyDetail(query!);
      // const res: Partial<GetAiDailyDetailRes> = {
      //   sendList: [
      //     {
      //       "emailMid": "",
      //       "email": "",
      //       "name": "",
      //       "sendTime": "",
      //       "arrive": false,
      //       "read": false,
      //       "reply": false,
      //       "unsubscribe": false,
      //       "traceClickNum": 3,
      //     }
      //   ],
      // };
      setDetailData(res);
    } catch (err: any) {
      message.error(err?.message || err?.msg || '获取数据失败，请重试！');
    }
  }, [query]);

  const queryReplayList = useCallback(async (query: GetReplayListReq) => {
    try {
      const res = await edmApi.getReplayList(query);
      setCurReplayList(res.replyList || []);
      setShowList(true);
    } catch (err: any) {
      message.error(err?.message || err?.msg || '获取数据失败，请重试！');
    }
  }, []);

  useEffect(() => {
    queryList();
  }, [query]);

  if (query == null) {
    return <Skeleton />;
  }

  const PagingComp = () => {
    return (
      <div className={styles.paginationWrap}>
        <SiriusPagination
          size="small"
          total={detailData.totalSize || 0}
          current={query.page}
          pageSize={query.pageSize}
          pageSizeOptions={['20', '50', '100']}
          showSizeChanger
          onChange={(current, pageSize) => {
            setQuery(previous => ({
              ...query,
              page: pageSize === previous?.pageSize ? (current as number) : 1,
              pageSize: pageSize as number,
            }));
          }}
        />
      </div>
    );
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.breadcrumb}>
        <Breadcrumb>
          <Breadcrumb.Item className={styles.breadcrumbItem} onClick={goHome}>
            {getIn18Text('YINGXIAOTUOGUAN')}
          </Breadcrumb.Item>
          <Breadcrumb.Item>{getIn18Text('YINGXIAOJILUXIANGQING')}</Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <div className={styles.content}>
        <div className={styles.headerBox}>
          <Tabs className={styles.templateTabs} onChange={setTab as any} activeKey={tab}>
            {TabConf.map(tab => (
              <TabPane
                key={tab.key}
                tab={
                  <div>
                    <span className={styles.tabItem}>{tab.label}</span>
                  </div>
                }
              />
            ))}
          </Tabs>
          <SiriusSelect
            size="middle"
            style={{ width: 156 }}
            options={option || []}
            placeholder={getIn18Text('XUANZEYINGXIAORENWU')}
            value={plan}
            onChange={setPlan}
            defaultValue={plan}
          />
        </div>
        <SiriusTable
          // className={styles.tableWrap}
          className={classnames({
            [styles.tableWrap]: true,
            // [styles.tableWrapNoData]: (detailData[getDetailKey(tab)] || []).length === 0,
          })}
          columns={tableConf.columns}
          dataSource={detailData[getDetailKey(tab)] || []}
          scroll={tableConf.scroll}
          // pagination={false}
          pagination={{
            total: detailData.totalSize || 0,
            current: query.page,
            pageSize: query.pageSize,
            pageSizeOptions: ['20', '50', '100'],
            showSizeChanger: true,
            onChange(current, pageSize) {
              setQuery(previous => ({
                ...query,
                page: pageSize === previous?.pageSize ? (current as number) : 1,
                pageSize: pageSize as number,
              }));
            },
          }}
          // rowClassName={(record, index) => index % 2 === 1 ? styles.row : ''}
        />
      </div>
      {/* {
        (detailData[getDetailKey(tab)] || []).length === 0
        &&
        <NoData />
      } */}
      {/* {
        detailData != null && detailData[getDetailKey(tab)] != null && detailData[getDetailKey(tab)]!.length > 0
        // true
        &&
        <PagingComp />
      } */}
      {/* 查看邮件列表 */}
      <SiriusModal
        title={getIn18Text('YOUJIANHUIFULIEBIAO')}
        visible={showList}
        onCancel={() => setShowList(false)}
        footer={<></>}
        width={620}
        className={styles.modal}
        centered
      >
        <Table className={`${styles.tableWrap} ${styles.tableWrap2}`} pagination={false} columns={listColumns} dataSource={curReplayList} />
      </SiriusModal>
    </div>
  );
};

export default MarketingRecords;
