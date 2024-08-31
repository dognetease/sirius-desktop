import React, { useEffect, useState, MouseEvent } from 'react';
import styles from './aiHostingIntroduce.module.scss';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import IconCard from '@web-common/components/UI/IconCard/index';
import { edmDataTracker } from '../../tracker/tracker';
import hostingBg from '@/images/icons/edm/yingxiao/hosting.png';
import { ReactComponent as PieIcon } from '@/images/icons/edm/yingxiao/pie.svg';
import { ReactComponent as FilterIcon } from '@/images/icons/edm/yingxiao/filter.svg';
import { ReactComponent as PersonIcon } from '@/images/icons/edm/yingxiao/person.svg';
import { ReactComponent as AiIcon } from '@/images/icons/edm/yingxiao/ai.svg';
import { ReactComponent as AiHostingVideo } from '@/images/icons/edm/yingxiao/ai-hosting-video.svg';
import { ReactComponent as HandbookIcon } from '@/images/icons/edm/yingxiao/handbook.svg';
import { ReactComponent as PracticeIcon } from '@/images/icons/edm/yingxiao/practice.svg';
import { ReactComponent as ArrowIcon } from '@/images/icons/edm/yingxiao/arrow.svg';
import { ReactComponent as EditIcon } from '@/images/icons/edm/yingxiao/edit.svg';
import { ReactComponent as PeopleIcon } from '@/images/icons/edm/yingxiao/people.svg';
import { SEND_MAIL_VIDEO } from '../../send/SelectTask/selectTask';
import { getIn18Text, apiHolder, DataStoreApi, ProductAuthApi, apis, DataTrackerApi } from 'api';
import { useOpenHelpCenter } from '@web-common/utils/utils';
import { openWebUrlWithLoginCode } from '@web-common/utils/utils';
import { FloatVideo, PlayState } from '@web-common/components/UI/Video';
import { ConfigActions, useActions } from '@web-common/state/createStore';

const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const productApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface AiHostingIntroduceProps {
  onCreate: () => void;
}

const videoDrawerConfig = { videoId: 'V11', source: 'kehukaifa', scene: 'kehukaifa_3' };

const AiHostingIntroduce: React.FC<AiHostingIntroduceProps> = props => {
  const { onCreate } = props;
  const [floatVideoVisible, setFloatVideoVisible] = useState(false);
  const [floatVideoUrl, setFloatVideoUrl] = useState('');
  const [floatVideoTitle, setFloatVideoTitle] = useState('');
  const { showVideoDrawer } = useActions(ConfigActions);
  const openHelpCenter = useOpenHelpCenter();

  useEffect(() => {
    const { data, suc } = dataStoreApi.getSync(SEND_MAIL_VIDEO);
    if (suc && data === 'true') {
      setFloatVideoVisible(false);
    } else {
      getProductVideos();
    }
  }, []);

  // 引导页埋点
  useEffect(() => {
    edmDataTracker.track('pc_marketing_edm_host_homepage', { visit: '' });
  }, []);

  const getProductVideos = async () => {
    try {
      const res = await productApi.doGetProductVideos(videoDrawerConfig.videoId);
      if (res && res?.videoUrl) {
        setFloatVideoUrl(res.videoUrl);
        setFloatVideoTitle(res.title || '');
        setFloatVideoVisible(true);
      } else {
        setFloatVideoVisible(false);
      }
    } catch (err) {
      setFloatVideoVisible(false);
    }
  };

  // 按钮埋点
  const handleTrack = (action: string) => {
    edmDataTracker.track('pc_marketing_edm_host_homepage', { action });
  };

  // 立即使用
  const handleCreate = () => {
    onCreate();
    edmDataTracker.track('pc_marketing_edm_host_homepage', { action: 'create' });
  };

  const onKnowledgeCenterClick = (e: MouseEvent, url: string) => {
    openHelpCenter(url);
    e.preventDefault();
  };

  const onLearnMore = (e: MouseEvent) => {
    onKnowledgeCenterClick(e, '/d/1641339855990423553.html');
    handleTrack('learnMore');
  };

  const closeFloatVideo = (playState?: PlayState) => {
    if (playState) {
      const { playRate } = playState;
      trackerApi.track('unified_event_tracking_video_catalogs_rate', {
        source: videoDrawerConfig.source,
        scene: videoDrawerConfig.scene,
        mainvideo: videoDrawerConfig.videoId,
        mainvideorate: playRate,
      });
    }
    setFloatVideoVisible(false);
    dataStoreApi.put(SEND_MAIL_VIDEO, 'true');
  };

  return (
    <>
      <div className={styles.aiHostingIntroduce}>
        <div className={styles.box}>
          <div className={styles.info}>
            <p className={styles.title}>
              {getIn18Text('YINGXIAOTUOGUAN')}
              {/* 自动获客 */}
            </p>
            <p className={styles.desc}>
              {getIn18Text('BUYONGCAOXINDEZHINENG')}
              {/* 自动获客营销的智能业务员 */}
            </p>
            <p className={styles.content}>
              {getIn18Text('JIEHEAIHEWANGYI')}
              {/* 基于网易强大的数据挖掘能力和AI算法模型，结合企业邮多年的技术沉淀，为您进行自动挖掘客户、自动挑选联系人、自动完成多轮营销，真正实现全自动获客。您只需关注有效线索，全面解放外贸业务员。 */}
              <a onClick={e => onLearnMore(e)} target="_blank" href="">
                {getIn18Text('LIAOJIEGENGDUO')}
                <IconCard type="tongyong_jiantou_you" fill="#4C6AFF" />
              </a>
            </p>
            <div className={styles.steps}>
              <div className={styles.stepItem}>
                <div className={styles.stepItemIcon}>
                  <PieIcon />
                  {/* <FilterIcon /> */}
                </div>
                <p className={styles.stepTitle}>
                  {getIn18Text('QUANZIDONGYINGXIAOZHIJIE')}
                  {/* 海量企业自动挖掘和筛选 */}
                </p>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemIcon}>
                  <PeopleIcon />
                  {/* <PersonIcon /> */}
                </div>
                <p className={styles.stepTitle}>
                  {getIn18Text('DUOCHANGJINGFUGAIXINKE')}
                  {/* 高度智能匹配目标企业和联系人 */}
                </p>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemIcon}>
                  <EditIcon />
                  {/* <PieIcon /> */}
                </div>
                <p className={styles.stepTitle}>{getIn18Text('DUONIANJINGYANCHENDIANZUI')}</p>
              </div>
              {/* <div className={styles.stepItem}>
              <div className={styles.stepItemIcon}>
                <AiIcon />
              </div>
              <p className={styles.stepTitle}>AI助力全自动邮件营销</p>
            </div> */}
            </div>
            <div className={styles.btns}>
              <Button btnType="primary" onClick={handleCreate}>
                {getIn18Text('XINJIANRENWU')}
              </Button>
              <Button btnType="minorLine" className={`${styles.btn} ${styles.videoBtn}`} onClick={() => showVideoDrawer(videoDrawerConfig)}>
                <AiHostingVideo />
                {getIn18Text('CHANPINXUEYUAN')}
                <span className={styles.btnIcon}>
                  <ArrowIcon />
                </span>
              </Button>
              <Button onClick={() => handleTrack('instruction')} btnType="minorLine" className={styles.btn}>
                <a className={styles.btnContent} onClick={e => onKnowledgeCenterClick(e, '/d/1641339855990423553.html')}>
                  <HandbookIcon />
                  {getIn18Text('CAOZUOSHOUCE')}
                  <span className={styles.btnIcon}>
                    <ArrowIcon />
                  </span>
                </a>
              </Button>
              <Button onClick={() => handleTrack('showCase')} btnType="minorLine" className={styles.btn}>
                <a className={styles.btnContent} onClick={e => onKnowledgeCenterClick(e, '/d/1663094862923243522.html')}>
                  <PracticeIcon />
                  {getIn18Text('ZUIJIASHIJIAN')}
                  <span className={styles.btnIcon}>
                    <ArrowIcon />
                  </span>
                </a>
              </Button>
            </div>
          </div>
          <img className={styles.bg} src={hostingBg} />
        </div>
        <FloatVideo
          url={floatVideoUrl}
          title={floatVideoTitle}
          visible={floatVideoVisible}
          hiddenClassName="aiHostingHidden"
          onClose={closeFloatVideo}
          fullScreenConfig={videoDrawerConfig}
        />
      </div>
    </>
  );
};

export default AiHostingIntroduce;
