import React, { MouseEvent } from 'react';
import { ReactComponent as RefreshIcon } from '@/images/icons/facebook/refresh.svg';
import { ReactComponent as RefreshIngIcon } from '@/images/icons/facebook/refreshIng.svg';
import { facebookTracker } from '@/components/Layout/SNS/tracker';
import style from './header.module.scss';
import { getTransText } from '@/components/util/translate';
import { useOpenHelpCenter } from '@web-common/utils/utils';

interface PostsHeader {
  onClick: () => void;
  refresh: boolean;
  title?: string;
  subTitle?: string;
}

const PostsHeader = (props: PostsHeader) => {
  const { refresh, onClick } = props;
  const openHelpCenter = useOpenHelpCenter();

  const onKnowledgeCenterClick = (e: MouseEvent) => {
    openHelpCenter('/d/1608289584087572481.html');
    e.preventDefault();
  };

  return (
    <div className={style.header}>
      <div className={style.titleBox}>
        <h2 className={style.title}>{getTransText('TIEZIGUANLI')}</h2>
        <p className={style.subTitle}>
          {getTransText('BIANJIEGUANLITIEZI')}
          <a href="" onClick={onKnowledgeCenterClick} target="_blank" rel="noreferrer" className={style.knowMore}>
            {getTransText('LIAOJIEGENGDUO')}
          </a>
        </p>
      </div>
      <div className={style.searchBox}>
        {refresh ? (
          <>
            <div className={style.iconAnimation}>
              <RefreshIngIcon />
            </div>
            <span className={style.btnColor}>{getTransText('SHUXINZHONG')}</span>
          </>
        ) : (
          <>
            <RefreshIcon />
            <span
              className={style.btnText}
              onClick={() => {
                onClick();
                facebookTracker.trackPostsAction('refresh');
              }}
            >
              {getTransText('SHUAXIN')}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default PostsHeader;
