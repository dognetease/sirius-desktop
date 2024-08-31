import { AccountData } from '../SenderRotateList/AccountData';
import React, { useEffect, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import style from './warmUpPage.module.scss';
import { message, Spin } from 'antd';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import { EdmSendBoxApi, SystemApi, WarmUpAccountSource, WarmUpData, WarmUpReq, WarmUpResp, apiHolder, apis } from 'api';
import { WarmUpDetail } from './detail';
import { guardString } from '../utils';
import { LoadingIcon } from '../send/write+';

export interface Props {}
const { isMac } = apiHolder.env;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const isWindows = systemApi.isElectron() && !isMac;

let curPageSources = [WarmUpAccountSource.system, WarmUpAccountSource.custom];
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
export const WarmUpPage = (props: Props) => {
  const [showWarmUpDetail, setShowWarmUpDetail] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string>();
  const [data, setData] = useState<WarmUpResp>();
  const [loading, setLoading] = useState(false);
  const [filterDay, setFilterDay] = useState(14);

  useEffect(() => {
    fetchWarmUpData(filterDay);
  }, []);

  const fetchWarmUpData = async (day: number) => {
    try {
      let req: WarmUpReq = {
        days: day,
        sources: curPageSources,
      };
      setLoading(true);
      let resp = await edmApi.fetchWarmUpData(req);
      setData(resp);
    } catch (e) {
      message.error({ content: '获取数据失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<WarmUpData> = [
    {
      title: '邮箱账号',
      dataIndex: 'email',
      key: 'email',
      render: (value, record) => {
        return (
          <div className={style.columnsEmail}>
            <Tooltip title={value}>
              <span className={style.email}>{value}</span>
            </Tooltip>
            {record.source === 0 ? <Tag type="label-3-1">多域名营销邮箱</Tag> : record.source === 1 ? <Tag type="label-4-1">企业绑定邮箱</Tag> : <></>}
          </div>
        );
      },
    },
    // {
    //   title: '状态',
    //   dataIndex: 'date',
    //   key: 'date',
    //   render: value => {
    //     return <div>{value}</div>;
    //   },
    // },
    // {
    //   title: '等级',
    //   dataIndex: 'levelDesc',
    //   key: 'levelDesc',
    //   render: value => {
    //     return <div>{value}</div>;
    //   },
    // },
    {
      title: '信誉度得分',
      dataIndex: 'score',
      key: 'score',
      render: value => {
        return <div>{!value ? '计算中...' : value}</div>;
      },
    },
    {
      title: '邮箱预热发送封数',
      dataIndex: 'totalSent',
      key: 'totalSent',
      render: value => {
        return <div>{value}</div>;
      },
    },
    {
      title: '收到预热邮件封数',
      dataIndex: 'totalReceived',
      key: 'totalReceived',
      render: value => {
        return <div>{value}</div>;
      },
    },
    {
      title: '进垃圾箱后移除封数',
      dataIndex: 'totalSpam',
      key: 'totalSpam',
      render: value => {
        return <div>{value}</div>;
      },
    },
    {
      title: '操作',
      dataIndex: 'email',
      key: 'email',
      width: 70,
      render: value => {
        return (
          <div
            className={style.op}
            onClick={() => {
              setSelectedEmail(value);
              setShowWarmUpDetail(true);
            }}
          >
            查看
          </div>
        );
      },
    },
  ];

  useEffect(() => {}, []);

  const HeaderComp = () => {
    return <div className={style.title}>邮箱预热</div>;
  };

  const ListComp = () => {
    return (
      <div className={style.body}>
        <div className={style.title}>邮箱列表</div>
        <Table columns={columns} dataSource={data?.accountData} />
      </div>
    );
  };

  const loadingComp = () => {
    if (!loading) {
      return undefined;
    }
    return (
      <div className={style.pageLoading}>
        <Spin indicator={<LoadingIcon />} />
      </div>
    );
  };
  return (
    <div className={style.root}>
      {loadingComp()}
      {HeaderComp()}
      <AccountData
        showOpenDetail={false}
        sources={curPageSources}
        onDayChange={value => {
          setFilterDay(value);
          fetchWarmUpData(value);
        }}
      />
      {ListComp()}
      {showWarmUpDetail && guardString(selectedEmail) && (
        <div className={style.detailWrapper} style={isWindows ? { paddingTop: '32px' } : {}}>
          <WarmUpDetail
            singleEmail={selectedEmail}
            sources={curPageSources}
            defaultDays={filterDay}
            onClose={() => {
              setSelectedEmail(undefined);
              setShowWarmUpDetail(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default WarmUpPage;
