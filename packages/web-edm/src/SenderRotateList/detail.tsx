import React, { useEffect, useState } from 'react';
import style from './detail.module.scss';
import { Collapse, Skeleton, message, Spin } from 'antd';
// import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import Breadcrumb from '@lingxi-common-component/sirius-ui/Breadcrumb';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import { WarmUpDetaiLHeader } from './overview';
import classnames from 'classnames';
import type { ColumnsType } from 'antd/es/table';
import { guardString } from '../utils';
import { EdmSendBoxApi, ProviderType, WarmUpDailyData, WarmUpData, WarmUpReq, WarmUpResp, apiHolder, apis, WarmUpAccountSource } from 'api';
import TongyongJiantouYou from '@web-common/images/newIcon/tongyong_jiantou_you.svg';

import LightSvg from '@/images/icons/edm/yingxiao/edm-sender-rotate-work.svg';
import { LoadingIcon } from '../send/write+';
import cloneDeep from 'lodash/cloneDeep';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

const { Panel } = Collapse;

const columns: ColumnsType<WarmUpDailyData> = [
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date',
    render: value => {
      return <div>{value}</div>;
    },
  },
  {
    title: '邮箱预热发送封数',
    dataIndex: 'sent',
    key: 'sent',
    render: value => {
      return <div>{value}</div>;
    },
  },
  {
    title: '收件箱封数',
    dataIndex: 'received',
    key: 'received',
    render: value => {
      return <div>{value}</div>;
    },
  },
  {
    title: '垃圾箱封数',
    dataIndex: 'spam',
    key: 'spam',
    render: value => {
      return <div>{value}</div>;
    },
  },
  {
    title: '其他文件夹封数',
    dataIndex: 'categories',
    key: 'categories',
    render: value => {
      return <div>{value}</div>;
    },
  },
  {
    title: '丢失封数',
    dataIndex: 'others', // 这里 others 没用错. 后端就是这么定义的 @hanxu
    key: 'others',
    render: value => {
      return <div>{value}</div>;
    },
  },
];

export const getScoreTag = (info: WarmUpData): JSX.Element | undefined => {
  switch (info.level) {
    case 0:
      return <Tag type="label-2-1">{info.levelDesc}</Tag>;
    case 1:
      return <Tag type="label-1-1">{info.levelDesc}</Tag>;
    case 2:
      return <Tag type="label-4-1">{info.levelDesc}</Tag>;
    case 3:
      return <Tag type="label-6-1">{info.levelDesc}</Tag>;
  }
  return undefined;
};

export interface Props {
  onClose?: () => void;
  singleEmail?: string;
  sources?: WarmUpAccountSource[];
  defaultDays?: number;
}
export const WarmUpDetail = (props: Props) => {
  const { onClose, singleEmail, sources = [WarmUpAccountSource.system], defaultDays = 14 } = props;
  const [skeletonLoadong, setSkeletonLoadong] = useState(false);
  const [openedEmail, setOpenedEmail] = useState<WarmUpData>();

  const [data, setData] = useState<WarmUpResp>();
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(false);
  const refresh = () => {
    setRefreshKey(!refreshKey);
  };
  useEffect(() => {
    setSkeletonLoadong(true);
    fetchWarmUpData();
  }, []);

  const fetchWarmUpData = async (info?: WarmUpData) => {
    try {
      let req: WarmUpReq = {
        days: info?.filterDate || defaultDays,
        email: info?.email,
        provider: info?.filterProvider !== ProviderType.All ? info?.filterProvider : undefined,
        sources: sources,
      };
      setLoading(true);
      let resp = await edmApi.fetchWarmUpData(req);
      handleWarmUpData(resp, info);
    } catch (e) {
      message.error({ content: '获取数据失败，请重试' });
      refresh();
    } finally {
      stopLoading();
    }
  };

  const stopLoading = () => {
    setSkeletonLoadong(false);
    setLoading(false);
  };

  const handleWarmUpData = (resp: WarmUpResp, info?: WarmUpData) => {
    stopLoading();
    if (!info || !guardString(info.email)) {
      setData(resp);
      return;
    }

    if (guardString(info?.email)) {
      let targetIndex = -1;
      data?.accountData?.forEach((item, index) => {
        if (item.email === info?.email) {
          targetIndex = index;
        }
      });
      if (targetIndex > -1 && data?.accountData && resp.accountData) {
        data.accountData[targetIndex] = resp.accountData[0];
        // 这2个字段是客户端自己的, 需要再赋值回来
        data.accountData[targetIndex].filterDate = info?.filterDate;
        data.accountData[targetIndex].filterProvider = info?.filterProvider;
        refresh();
      }
    }
  };

  const renderBreadCrumb = () => {
    return (
      <div className={style.breadCrumb}>
        <Breadcrumb separator={<SeparatorSvg />}>
          <Breadcrumb.Item
            className={style.breadCrumbItem}
            onClick={() => {
              onClose && onClose();
            }}
          >
            多域名营销
          </Breadcrumb.Item>
          <Breadcrumb.Item>预热详情</Breadcrumb.Item>
        </Breadcrumb>
      </div>
    );
  };

  function handleCollapseChange(key?: string) {
    if (!key || key === openedEmail?.email) {
      setOpenedEmail(undefined);
      return;
    }

    data?.accountData?.forEach(item => {
      if (item.email !== key) {
        return;
      }
      setOpenedEmail(item);
    });
  }
  const BodyHeaderComp = (info: WarmUpData) => {
    return (
      <div className={style.header}>
        <img src={LightSvg} />
        <div className={style.title}>{info.email}</div>
        {getScoreTag(info)}
      </div>
    );
  };

  const BodyDetailTableComp = (info: WarmUpData) => {
    return (
      <div style={{ marginTop: '16px' }}>
        <Table columns={columns} dataSource={info.dailyData || []} />
      </div>
    );
  };

  const PanelBodyComp = (info: WarmUpData) => {
    return (
      <div className={classnames(style.panelBody)}>
        <WarmUpDetaiLHeader
          info={cloneDeep(info)}
          defaultDays={defaultDays}
          onFilterChange={filterInfo => {
            fetchWarmUpData(filterInfo);
          }}
        />
        {BodyDetailTableComp(info)}
      </div>
    );
  };

  const loadingComp = () => {
    return (
      <div className={style.pageLoading}>
        <Spin indicator={<LoadingIcon />} />
      </div>
    );
  };

  const BodyComp = () => {
    return (
      <div className={style.body}>
        {data?.accountData?.map(item => {
          return (
            <Collapse
              className={style.collapse}
              bordered={false}
              accordion={true}
              activeKey={guardString(openedEmail?.email) ? openedEmail?.email : undefined}
              expandIcon={({ isActive }) => <img src={TongyongJiantouYou} style={isActive ? { transform: 'rotate(90deg)' } : {}} />}
              onChange={key => {
                handleCollapseChange(key as string);
              }}
            >
              <Panel header={BodyHeaderComp(item)} key={item.email || ''}>
                {PanelBodyComp(item)}
              </Panel>
            </Collapse>
          );
        })}
      </div>
    );
  };

  return (
    <div className={style.container}>
      {loading && loadingComp()}
      {renderBreadCrumb()}
      <Skeleton loading={skeletonLoadong} active>
        {BodyComp()}
      </Skeleton>
    </div>
  );
};
