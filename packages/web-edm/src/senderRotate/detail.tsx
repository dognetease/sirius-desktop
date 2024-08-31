import React, { useEffect, useState } from 'react';
import style from './detail.module.scss';
import { Skeleton, message, Spin } from 'antd';
// import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import Breadcrumb from '@lingxi-common-component/sirius-ui/Breadcrumb';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import { WarmUpDetaiLHeader } from './overview';
import DetailFilter from './detailFilter';
import ScoreGauge from './scoreGauge';
import FolderData from './folderData';
import Receive from './receive';
import classnames from 'classnames';
import { guardString } from '../utils';
import { EdmSendBoxApi, ProviderType, WarmUpData, WarmUpReq, WarmUpResp, apiHolder, apis, WarmUpAccountSource } from 'api';

import { LoadingIcon } from '../send/write+';
import cloneDeep from 'lodash/cloneDeep';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

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
      if (guardString(singleEmail)) {
        req.email = singleEmail;
      }
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
      let respTargetIndex = -1;
      resp.accountData?.forEach((item, index) => {
        if (item.email === info?.email) {
          respTargetIndex = index;
        }
      });
      if (targetIndex > -1 && respTargetIndex > -1 && data?.accountData && resp.accountData) {
        data.accountData[targetIndex] = resp.accountData[respTargetIndex];
        // 这2个字段是客户端自己的, 需要再赋值回来
        data.accountData[targetIndex].filterDate = info?.filterDate;
        data.accountData[targetIndex].filterProvider = info?.filterProvider;
        refresh();
      }
    }
  };

  const RenderBreadCrumb = () => {
    return (
      <div className={style.breadCrumb}>
        <Breadcrumb separator={<SeparatorSvg />}>
          <Breadcrumb.Item
            className={style.breadCrumbItem}
            onClick={() => {
              onClose && onClose();
            }}
          >
            邮箱预热
          </Breadcrumb.Item>
          <Breadcrumb.Item className={style.breadCrumbItemLast}>预热详情{singleEmail ? <span style={{ fontWeight: 400 }}>（{singleEmail}）</span> : ''}</Breadcrumb.Item>
        </Breadcrumb>
      </div>
    );
  };

  const PanelBodyComp = ({ info }: { info: WarmUpData }) => {
    return (
      <div className={classnames(style.panelBody)}>
        <div className={style.filterWrap}>
          <DetailFilter
            info={cloneDeep(info)}
            defaultDays={info.filterDate || defaultDays}
            defaultProvider={info.filterProvider}
            onFilterChange={filterInfo => {
              fetchWarmUpData(filterInfo);
            }}
          />
        </div>
        <ScoreGauge info={cloneDeep(info)} />
        <WarmUpDetaiLHeader info={cloneDeep(info)} defaultDays={defaultDays} />
        <FolderData info={cloneDeep(info)} />
        <Receive info={cloneDeep(info)} />
      </div>
    );
  };

  const LoadingComp = () => {
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
          return singleEmail === item.email ? <PanelBodyComp info={item} /> : undefined;
        })}
      </div>
    );
  };

  return (
    <div className={style.container}>
      {loading && <LoadingComp />}
      <RenderBreadCrumb />
      <Skeleton loading={skeletonLoadong} active>
        <BodyComp />
      </Skeleton>
    </div>
  );
};
