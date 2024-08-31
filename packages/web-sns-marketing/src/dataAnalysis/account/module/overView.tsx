import { getIn18Text } from 'api';
import React from 'react';
import { SnsDataAnalysis } from 'api';
import { Spin } from 'antd';
import { ReactComponent as CommentIcon } from '@web-sns-marketing/images/state/comment.svg';
import { ReactComponent as FansIcon } from '@web-sns-marketing/images/state/fans.svg';
import { ReactComponent as FansGrowIcon } from '@web-sns-marketing/images/state/fans_grow.svg';
import { ReactComponent as HomeIcon } from '@web-sns-marketing/images/state/home.svg';
import { ReactComponent as PostIcon } from '@web-sns-marketing/images/state/postnum.svg';
import style from './overView.module.scss';

interface Props {
  data: SnsDataAnalysis.MediaOverviewData;
  loading?: boolean;
}

export const OverViewModule: React.FC<Props> = props => {
  const { data, loading = false } = props;

  return (
    <div className={style.wrapper}>
      <Spin spinning={loading}>
        <div className={style.state}>
          <div className={style.container}>
            {/* <div className={style.cell}>
              <div className={style.icon}>
                <HomeIcon />
              </div>
              <div className={style.info}>
                <div className={style.number}>{data?.socialMediaCount || 0}</div>
                <div className={style.label}>{getIn18Text('SHEMEIZHUYESHU')}</div>
              </div>
            </div> */}

            <div className={style.cell}>
              <div className={style.icon}>
                <FansIcon />
              </div>
              <div className={style.info}>
                <div className={style.number}>{data?.fansCount || 0}</div>
                <div className={style.label}>{getIn18Text('FENSISHU')}</div>
              </div>
            </div>

            <div className={style.cell}>
              <div className={style.icon}>
                <FansGrowIcon />
              </div>
              <div className={style.info}>
                <div className={style.number}>{data?.fansDiffCount || 0}</div>
                <div className={style.label}>{getIn18Text('FENSIZENGCHANGSHU')}</div>
              </div>
            </div>

            <div className={style.cell}>
              <div className={style.icon}>
                <PostIcon />
              </div>
              <div className={style.info}>
                <div className={style.number}>{data?.postSentCount || 0}</div>
                <div className={style.label}>{getIn18Text('FATIESHU')}</div>
              </div>
            </div>

            <div className={style.cell}>
              <div className={style.icon}>
                <CommentIcon />
              </div>
              <div className={style.info}>
                <div className={style.number}>{data?.postCommentCount || 0}</div>
                <div className={style.label}>{getIn18Text('PINGLUNSHU')}</div>
              </div>
            </div>
          </div>
        </div>
      </Spin>
    </div>
  );
};
