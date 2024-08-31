import { getIn18Text } from 'api';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { SnsMarketingPost, SnsMarketingState, apis, apiHolder, SnsMarketingApi, SnsMarketingPlatform, SnsMarketingAccountType } from 'api';
import { Spin } from 'antd';
import { ReactComponent as WarningIcon } from '@web-sns-marketing/images/state/warning.svg';
import { ReactComponent as LikeIcon } from '@web-sns-marketing/images/state/like.svg';
import { ReactComponent as CoverIcon } from '@web-sns-marketing/images/state/cover.svg';
import { ReactComponent as ViewIcon } from '@web-sns-marketing/images/state/view.svg';
import { ReactComponent as MessageIcon } from '@web-sns-marketing/images/state/message.svg';
import { ReactComponent as ReplayIcon } from '@web-sns-marketing/images/state/replay.svg';
import { ReactComponent as LikeListIcon } from '@web-sns-marketing/images/state/like_icon.svg';
import { ReactComponent as FavIcon } from '@web-sns-marketing/images/state/favicon.svg';
import { ReactComponent as EmptyIcon } from '@web-sns-marketing/images/empty.svg';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { TongyongShuaxin } from '@sirius/icons';
// import { EChart } from './EChart';
import style from './PostState.module.scss';

interface Props {
  post: SnsMarketingPost | null;
}

const chartBaseOptions = {
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    data: [],
  },
  grid: {
    left: 50,
    top: 30,
    bottom: 50,
    right: 50,
  },
  toolbox: {
    feature: {},
  },
  color: ['#7088FF', '#3FDE9C', '#FE7C70', '#FFC470'],
  xAxis: {
    type: 'category',
    data: [],
  },
  yAxis: {
    type: 'value',
  },
  series: [],
};

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;
export const PostState: React.FC<Props> = props => {
  const { post } = props;
  const [postState, setPostState] = useState<SnsMarketingState.PostStateRes | null>(null);
  const [loading, setLoading] = useState(true);
  const isIns = post?.platform === SnsMarketingPlatform.INSTAGRAM;

  const fetchState = useCallback(
    async (isRealTime = false) => {
      if (!post?.postDbId) {
        setPostState(null);
        return;
      }
      setLoading(true);
      const res = await snsMarketingApi.getPostState({ isRealTime, postDbId: post.postDbId });
      setPostState(res);
      setLoading(false);
    },
    [post]
  );

  const viewData = useMemo(() => {
    return {
      ...chartBaseOptions,
      xAxis: {
        type: 'category',
        // data: ['6月26日', '6月27日', '6月28日', '6月29日', '6月30日', '6月31日'],
      },
      series: [
        {
          type: 'line',
          name: getIn18Text('ZHANSHIQUSHI'),
          data: [1, 4, 6, 8, 11, 22],
        },
      ],
    };
  }, [postState]);

  const engagementData = useMemo(() => {
    return {
      ...chartBaseOptions,
      xAxis: {
        type: 'category',
        // data: ['6月26日', '6月27日', '6月28日', '6月29日', '6月30日', '6月31日'],
      },
      legend: {
        data: [getIn18Text('HUOZANSHULIANG'), getIn18Text('PINGLUNSHULIANG'), getIn18Text('SHOUCANGCISHU'), getIn18Text('FENXIANGCISHU')],
      },
      series: [
        {
          type: 'line',
          name: getIn18Text('HUOZANSHULIANG'),
          data: [1, 4, 6, 8, 11, 22],
        },
        {
          type: 'line',
          name: getIn18Text('PINGLUNSHULIANG'),
          data: [1, 5, 22, 9, 5, 18],
        },
        {
          type: 'line',
          name: getIn18Text('SHOUCANGCISHU'),
          data: [3, 4, 7, 9, 18, 20],
        },
        {
          type: 'line',
          name: getIn18Text('FENXIANGCISHU'),
          data: [8, 14, 9, 12, 18, 15],
        },
      ],
    };
  }, [postState]);

  useEffect(() => {
    fetchState();
  }, [post]);

  const noData = useMemo(() => {
    return post?.platform === SnsMarketingPlatform.LINKEDIN && post?.accountType === SnsMarketingAccountType.PERSONAL;
  }, [post]);

  if (noData) {
    // 领英暂时无法获取数据
    return (
      <div className={style.wrapper}>
        <div className={style.warning}>
          <div>
            <WarningIcon />
          </div>
          <div className={style.text}>{getIn18Text('SHUJUZHANSHIWEIFABU')}</div>
        </div>
        <div className={style.panel}>
          <div className={style.title}>{getIn18Text('ZONGTISHUJU')}</div>
          <div className={style.noData}>
            <div className={style.noDataTip}>
              <EmptyIcon />
              <div className={style.noDataText}>{getIn18Text('LinkedinStateTip')}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={style.wrapper}>
      <Button className={style.refresh} onClick={() => fetchState(true)} size="small">
        <TongyongShuaxin />
        {getIn18Text('SHUAXIN')}
      </Button>
      <div className={style.warning}>
        <div>
          <WarningIcon />
        </div>
        <div className={style.text}>{getIn18Text('SHUJUZHANSHIWEIFABU')}</div>
      </div>
      <Spin spinning={loading}>
        <div className={style.panel}>
          <div className={style.title}>{getIn18Text('ZONGTISHUJU')}</div>
          <div className={style.flex}>
            <div className={style.cell}>
              <div className={style.icon}>
                <ViewIcon />
              </div>
              <div className={style.info}>
                <div className={style.number}>{postState?.impressionCount || 0}</div>
                <div className={style.label}>{getIn18Text('TIEZIZHANSHICISHU')}</div>
              </div>
            </div>

            <div className={style.cell}>
              <div className={style.icon}>
                <CoverIcon />
              </div>
              <div className={style.info}>
                <div className={style.number}>{postState?.uniqueImpressionCount || 0}</div>
                <div className={style.label}>{getIn18Text('TIEZIFUGAIRENSHU')}</div>
              </div>
            </div>

            <div className={style.cell}>
              <div className={style.icon}>
                <LikeIcon />
              </div>
              <div className={style.info}>
                <div className={style.number}>{postState?.engagementCount || 0}</div>
                <div className={style.label}>{getIn18Text('TIEZIHUDONGCISHU')}</div>
              </div>
            </div>
          </div>
        </div>
      </Spin>
      <Spin spinning={loading}>
        <div className={style.panel} style={{ marginTop: 16 }}>
          <div className={style.title}>{getIn18Text('HUDONGSHUJU')}</div>
          <div className={`${style.list} ${isIns ? style.gride : ''}`}>
            <div className={style.item}>
              <div className={style.label}>
                <LikeListIcon />
                <span className={style.labelText}>{getIn18Text('DIANZANSHULIANG')}</span>
              </div>
              <div className={style.number}>{postState?.likeCount || 0}</div>
            </div>

            <div className={style.item}>
              <div className={style.label}>
                <MessageIcon />
                <span className={style.labelText}>{getIn18Text('PINGLUNSHULIANG')}</span>
              </div>
              <div className={style.number}>{postState?.commentCount || 0}</div>
            </div>

            <div className={style.item}>
              <div className={style.label}>
                <ReplayIcon />
                <span className={style.labelText}>{getIn18Text('FENXIANGCISHU')}</span>
              </div>
              <div className={style.number}>{postState?.shareCount || 0}</div>
            </div>

            {isIns && (
              <div className={style.item}>
                <div className={style.label}>
                  <FavIcon />
                  <span className={style.labelText}>{getIn18Text('SHOUCANGCISHU')}</span>
                </div>
                <div className={style.number}>{postState?.savedCount || 0}</div>
              </div>
            )}
          </div>
        </div>
      </Spin>
      {/* <Spin spinning={loading}>
        <div className={style.charWrapper}>
          <div className={style.content}>
            <div className={style.title}>{getIn18Text('ZHANSHIQUSHI')}</div>
            <div className={style.desc}>{getIn18Text('TIEZIZHANSHICISHUSHU')}</div>
            <div className={style.chart}>
              <EChart options={viewData} />
            </div>
          </div>
        </div>

        <div className={style.charWrapper}>
          <div className={style.content}>
            <div className={style.title}>{getIn18Text('HUDONGQUSHI')}</div>
            <div className={style.chart}>
              <EChart options={engagementData} />
            </div>
          </div>
        </div>
      </Spin> */}
    </div>
  );
};
