import { getIn18Text } from 'api';
import * as React from 'react';
import { SnsMarketingState } from 'api';
import { ReactComponent as LikeIcon } from '@web-sns-marketing/images/state/like.svg';
import { ReactComponent as CommentIcon } from '@web-sns-marketing/images/state/comment.svg';
import { ReactComponent as CoverIcon } from '@web-sns-marketing/images/state/cover.svg';
import { ReactComponent as SendIcon } from '@web-sns-marketing/images/state/send.svg';
import { ReactComponent as ShareIcon } from '@web-sns-marketing/images/state/share.svg';
import { ReactComponent as ViewIcon } from '@web-sns-marketing/images/state/view.svg';
import style from './style.module.scss';

interface Props {
  data: SnsMarketingState.TaskStateRes;
}

export const TaskState: React.FC<Props> = props => {
  const { data } = props;

  return (
    <div className={style.wrapper}>
      <div className={style.container}>
        <div className={style.cell}>
          <div className={style.icon}>
            <SendIcon />
          </div>
          <div className={style.info}>
            <div className={style.number}>
              {data.sendPostCount}/{data.planSendPostCount}
            </div>
            <div className={style.label}>{getIn18Text('FATIESHU(SHIJI/')}</div>
          </div>
        </div>

        <div className={style.cell}>
          <div className={style.icon}>
            <ViewIcon />
          </div>
          <div className={style.info}>
            <div className={style.number}>{data.impressionCount}</div>
            <div className={style.label}>{getIn18Text('TIEZIZHANSHICISHU')}</div>
          </div>
        </div>

        <div className={style.cell}>
          <div className={style.icon}>
            <CoverIcon />
          </div>
          <div className={style.info}>
            <div className={style.number}>{data.uniqueImpressionCount}</div>
            <div className={style.label}>{getIn18Text('TIEZIFUGAIRENSHU')}</div>
          </div>
        </div>

        <div className={style.cell}>
          <div className={style.icon}>
            <LikeIcon />
          </div>
          <div className={style.info}>
            <div className={style.number}>{data.likeCount}</div>
            <div className={style.label}>{getIn18Text('DIANZANSHU')}</div>
          </div>
        </div>

        <div className={style.cell}>
          <div className={style.icon}>
            <CommentIcon />
          </div>
          <div className={style.info}>
            <div className={style.number}>{data.commentCount}</div>
            <div className={style.label}>{getIn18Text('ZONGPINGLUNSHU')}</div>
          </div>
        </div>

        <div className={style.cell}>
          <div className={style.icon}>
            <ShareIcon />
          </div>
          <div className={style.info}>
            <div className={style.number}>{data.shareCount}</div>
            <div className={style.label}>{getIn18Text('ZHUANFASHU')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
