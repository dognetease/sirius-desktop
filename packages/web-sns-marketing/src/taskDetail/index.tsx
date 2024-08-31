import { getIn18Text } from 'api';
import React, { useState, useEffect, useCallback } from 'react';
import { apis, apiHolder, SnsMarketingApi, SnsMarketingState } from 'api';
import { Breadcrumb, Spin } from 'antd';
import { navigate } from '@reach/router';
import { BaseInfo } from './baseInfo';
import { PostList } from './postList';
import { TaskState } from './taskState';
import style from './style.module.scss';

interface Props {
  qs: Record<string, string>;
}

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;

export const SnsTaskDetail: React.FC<Props> = props => {
  const { qs } = props;
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<SnsMarketingState.TaskStateRes>({} as SnsMarketingState.TaskStateRes);

  const fetchDetail = useCallback(async () => {
    if (!qs.id) {
      return;
    }
    // setDetail(detailData as unknown as SnsMarketingState.TaskStateRes);
    // return;
    const res = await snsMarketingApi.getTaskState(qs.id);
    setDetail(res);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDetail();
  }, []);

  if (loading) {
    return (
      <div className={style.wrapper}>
        <div className={style.loading}>
          <Spin></Spin>
        </div>
      </div>
    );
  }

  return (
    <div className={style.wrapper}>
      <Breadcrumb className={style.breadWrap}>
        <Breadcrumb.Item onClick={() => navigate('#site?page=snsMarketingTask')}>
          <span className={style.breadcrumb}>{getIn18Text('YINGXIAORENWU')}</span>{' '}
        </Breadcrumb.Item>
        <Breadcrumb.Item>{getIn18Text('RENWUXIANGQING')}</Breadcrumb.Item>
      </Breadcrumb>
      <div className={style.panel}>
        <BaseInfo data={detail}></BaseInfo>
      </div>
      <div className={style.panel}>
        <TaskState data={detail}></TaskState>
      </div>
      <div className={style.panel}>
        <PostList id={qs.id}></PostList>
      </div>
    </div>
  );
};
