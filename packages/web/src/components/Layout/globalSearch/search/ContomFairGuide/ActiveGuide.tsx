import React, { useContext, useReducer } from 'react';
import styles from './contomfair.module.scss';
import classNames from 'classnames';
import { navigate } from 'gatsby';
import { globalSearchDataTracker } from '../../tracker';
import { SubKeyWordContext } from '../../keywordsSubscribe/subcontext';
import { ConfigActions } from '@web-common/state/reducer';
import { useAppDispatch } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
export default () => {
  const [_, dispatch] = useContext(SubKeyWordContext);
  const dispatchShowVideo = useAppDispatch();
  const onPlayVideo = (params: { videoId: string; source: string; scene: string }) => {
    const { videoId, source, scene } = params;
    dispatchShowVideo(ConfigActions.showVideoDrawer({ videoId: videoId, source, scene }));
  };
  return (
    <>
      <div className={styles.container}>
        <p className={styles.title}>行业专题</p>
        <div className={styles.list}>
          <div
            onClick={() => {
              navigate(`#wmData?page=beltRoad`);
            }}
            className={classNames(styles.activity, styles.activityBr)}
          ></div>
          <div
            onClick={() => {
              navigate(`#wmData?page=contomfair`);
              globalSearchDataTracker.trackGotoContomFairSearch();
            }}
            className={classNames(styles.activity, styles.activityContomfair)}
          ></div>
          <div
            onClick={() => {
              globalSearchDataTracker.trackEmailGuessEntry({
                type: 'banner',
              });
              dispatch({
                type: 'EMAIL_GUESS_CHANGE_VISIBLE',
                payload: {
                  visible: true,
                },
              });
            }}
            className={classNames(styles.activity, styles.activityEmailguess)}
          ></div>
          {/* <div
          onClick={() => showVideoGuide({ url: globalSearchHomUrl1, title: '全球搜索快速上手', form: 'globalSearch_home_1' })}
          className={classNames(styles.activity, styles.activityVideo1)}
        ></div>
        <div
          onClick={() => showVideoGuide({ url: globalSearchHomUrl2, title: '正确使用全球搜索，让客户爆发式增长', form: 'globalSearch_home_2' })}
          className={classNames(styles.activity, styles.activityVideo2)}
        ></div> */}
        </div>
      </div>
      <div className={styles.container} style={{ marginTop: 12 }}>
        <p className={styles.title}>知识库</p>
        <div
          onClick={() => {
            navigate(`#wmData?page=beltRoad`);
          }}
          className={classNames(styles.activity, styles.activityEmailguess)}
        ></div>
        <div className={styles.list}>
          <div
            onClick={() => onPlayVideo({ videoId: 'V5', source: 'kehufaxian', scene: 'kehufaxian_1' })}
            className={classNames(styles.video, styles.activityVideo1)}
          ></div>
          <div
            onClick={() => onPlayVideo({ videoId: 'V25', source: 'kehufaxian', scene: 'kehufaxian_2' })}
            className={classNames(styles.video, styles.activityVideo2)}
          ></div>
          <div className={classNames(styles.video, styles.activityVideo3)}></div>
        </div>
      </div>
    </>
  );
};
