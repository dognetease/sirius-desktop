import React from 'react';
import { Button } from 'antd';
import { FacebookActions } from '@web-common/state/reducer';
import { useActions } from '@web-common/state/createStore';
import { facebookTracker } from '@/components/Layout/SNS/tracker';
import { getTransText } from '@/components/util/translate';
import fbAuthorize from '@/images/icons/edm/fb-authorize.png';
import { ReactComponent as FbDot } from '@/images/icons/edm/fb-dot.svg';

import styles from './index.module.scss';

const intro = [
  {
    title: getTransText('DUOZANGHAOGUANLI'),
    desc: getTransText('WUXUFANFUQIEHUANJIKE'),
  },
  {
    title: getTransText('KUAISUZHANGWOZHANGHU'),
    desc: getTransText('DIYISHIJIANZHIXIAO'),
  },
  {
    title: getTransText('GAOXIAOZAIXIAN'),
    desc: getTransText('WUXUDAKA'),
  },
];

interface IProps {
  loading: boolean;
  trackType: 'pages' | 'post' | 'message';
}

export const Authorize: React.FC<IProps> = props => {
  const { setFacebookModalShow } = useActions(FacebookActions);
  const { loading, trackType } = props;
  const handleBtn = () => {
    facebookTracker.trackPagesBindingPage(trackType);
    setFacebookModalShow({ offsiteModal: true });
  };
  return (
    <div className={styles.authorize}>
      <div className={styles.info}>
        <p>{getTransText('FACEBOOKYINXIAO')}</p>
        <div className={styles.main}>
          {intro.map(item => (
            <div className={styles.item}>
              <span className={styles.title}>
                <FbDot />
                {item.title}
              </span>
              <span className={styles.desc}>{item.desc}</span>
            </div>
          ))}
        </div>
        <Button className={styles.btn} loading={loading} type="primary" onClick={handleBtn}>
          {getTransText('BANGDINGFACEBOOKZHANGHAO')}
        </Button>
      </div>
      <div className={styles.thumbnail}>
        <img alt="" src={fbAuthorize} />
      </div>
    </div>
  );
};
