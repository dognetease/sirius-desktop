import React from 'react';
import style from './style.module.scss';

interface Props {
  onAllot: () => void;
}

const ChannelEmpty: React.FC<Props> = ({ onAllot }) => {
  return (
    <div className={style.emptyContainer}>
      <div className={style.emptyBox}>
        <div className={style.emptyImage} />
        <p className={style.emptyTitle}>暂无内容</p>
        <p className={style.emptyText}>
          <span>您还没有添加成员，</span>
          <span className={style.emptyLink} onClick={() => onAllot()}>
            点击这里
          </span>
          <span>快去添加吧</span>
        </p>
      </div>
    </div>
  );
};

export default ChannelEmpty;
