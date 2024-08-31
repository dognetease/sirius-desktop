import { getIn18Text } from 'api';
import React, { useContext, useCallback, useState, useEffect } from 'react';
import { Space, Spin } from 'antd';
import { apiHolder, apis, SnsMarketingApi, SnsDataAnalysis } from 'api';
import { ReactComponent as TipIcon } from '@web-sns-marketing/images/tip_blue.svg';
import { ReactComponent as EmptyIcon } from '@web-sns-marketing/images/empty.svg';
// import { EnhanceSelect as Select, InSingleOption as Option } from '@web-common/components/UI/Select';
import { EnhanceSelect as Select, InSingleOption as Option } from '@lingxi-common-component/sirius-ui/Select';
import { PostList } from '../../components/postList';
import { StateContext, State } from '../stateProvider';
import style from './hotPosts.module.scss';

interface Props {}

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;
export const HotPostsModule: React.FC<Props> = () => {
  const search = useContext(StateContext);
  const [hotPosts, setHotPosts] = useState<SnsDataAnalysis.HotPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('impression_count');

  const fetchHotPost = useCallback(async (search: State) => {
    setLoading(true);
    const params = {
      ...search,
      startTime: search.startTime ? +search.startTime : '',
      endTime: search.endTime ? +search.endTime : '',
    };
    const res = await snsMarketingApi.getHotPosts(params as SnsDataAnalysis.HotPostReq);
    setHotPosts(res?.hotPosts || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    search.accountId && fetchHotPost({ ...search, sortField });
  }, [search, sortField]);

  return (
    <div className={style.wrapper}>
      <div className={style.title}>{getIn18Text('REMENTIEZI')}</div>
      <div className={style.tips}>
        <Space>
          <TipIcon />
          <span>
            <span>{moment(+search.startTime).format('YYYY-MM-DD')} </span>~<span> {moment(+search.endTime).format('YYYY-MM-DD')} </span>
            {getIn18Text('SHIJIANDUANNEIFABUTIE')}
          </span>
        </Space>

        {/* <span className={style.close}>
          <TongyongGuanbiXian size={20} />
        </span> */}
      </div>
      <div className={style.op}>
        <Select style={{ width: 180 }} value={sortField} onChange={val => setSortField(val)}>
          <Option value="impression_count">{getIn18Text('ANZHAOPUGUANGSHUCONGGAO')}</Option>
          <Option value="unique_impression_count">{getIn18Text('ANZHAOLIULANSHUCONGGAO')}</Option>
          <Option value="engagement_count">{getIn18Text('ANZHAOHUDONGCISHUCONG')}</Option>
          <Option value="comment_count">{getIn18Text('ANZHAOPINGLUNSHUCONGGAO')}</Option>
        </Select>
      </div>
      <div className={style.postList}>
        <Spin spinning={loading}>
          {hotPosts.length > 0 ? (
            <PostList data={hotPosts} />
          ) : (
            <div className={style.empty}>
              <EmptyIcon />
              <div className={style.emptyTip}>{getIn18Text('ZANWUREMENTIEZI')}</div>
            </div>
          )}
        </Spin>
      </div>
    </div>
  );
};
