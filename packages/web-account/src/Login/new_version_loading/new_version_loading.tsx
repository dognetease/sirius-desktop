import React, { FC } from 'react';
import LoadingImg from '@/images/app_bg_loading.gif';
import LoadingImgWaimao from '@/images/app_bg_loading_waimao.gif';
import style from './new_version_loading.module.scss';
import { getIn18Text } from 'api';

interface Props {
  tip?: string;
}

export const NewVersionLoading: FC<Props> = props => {
  const { tip = getIn18Text('XINBANYOUXIANGJIA') } = props;

  return (
    <div className={style.loadingWrapper}>
      <div>
        <img src={process.env.BUILD_ISEDM ? LoadingImgWaimao : LoadingImg} alt="" />
      </div>
      <div className={style.content}>{tip}</div>
    </div>
  );
};
