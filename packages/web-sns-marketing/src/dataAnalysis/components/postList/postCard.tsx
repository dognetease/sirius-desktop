import { getIn18Text } from 'api';
import React, { useMemo } from 'react';
import { SnsDataAnalysis } from 'api';
import { ReactComponent as GlobalIcon } from '@web-sns-marketing/images/global.svg';
import { commonDateUnitFormat } from '@web-common/utils/commonDateUnitFormat';
import Avatar from '../../../components/Avatar';
import style from './post.module.scss';

interface Props {
  data: SnsDataAnalysis.HotPost;
  onClick?: () => void;
}

export const PostCard: React.FC<Props> = props => {
  const { data, onClick = () => {} } = props;

  const sendTimestemp = +data.createTime || +data.planSendTime || Date.now();
  const sendTime = commonDateUnitFormat(sendTimestemp, 'precise') || moment(sendTimestemp).format('MM-DD HH:mm');

  const img: string = useMemo(() => {
    if (data.mediaType !== 'IMAGE') {
      return '';
    }
    const medias = data?.mediaList || [];
    return medias?.[0]?.url || '';
  }, [data]);

  return (
    <div className={style.postCard} onClick={onClick}>
      <div className={style.header}>
        <Avatar className={style.accountAvatar} size={48} platform={data.platform} avatar={data.publishedAvatar} />
        <div className={style.accountNameWrapper}>
          <div className={style.accountName}>{data?.publishedName}</div>
          <div className={style.sendTimeWrapper}>
            <div className={style.sendTime}>{sendTime}</div>
            <div className={style.dot} />
            <GlobalIcon className={style.icon} />
          </div>
        </div>
      </div>
      <div className={`${style.content} ${img ? style.hasImage : ''}`}>{data?.content || ''}</div>
      <div className={style.img}>
        <img src={img} alt="" />
      </div>
      <div className={style.state}>
        <div className={style.stateCell}>
          <div className={style.number}>{data?.impressionCount || 0}</div>
          <div className={style.label}>{getIn18Text('PUGUANGSHU')}</div>
        </div>
        <div className={style.stateCell}>
          <div className={style.number}>{data?.uniqueImpressionCount || 0}</div>
          <div className={style.label}>{getIn18Text('LIULANSHU')}</div>
        </div>
        <div className={style.stateCell}>
          <div className={style.number}>{data?.engagementCount || 0}</div>
          <div className={style.label}>{getIn18Text('HUDONGCISHU')}</div>
        </div>
        <div className={style.stateCell}>
          <div className={style.number}>{data?.commentCount || 0}</div>
          <div className={style.label}>{getIn18Text('PINGLUNSHU')}</div>
        </div>
      </div>
    </div>
  );
};
