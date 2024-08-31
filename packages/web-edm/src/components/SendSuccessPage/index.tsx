import { getIn18Text } from 'api';
import React, { FC, useEffect, useCallback, useState, useMemo } from 'react';
import { apiHolder, apis, EdmSendBoxApi, SendBoxConfRes, TaskChannel } from 'api';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import WikiIcon from '@/images/icons/edm/send/wiki.png';
import SendSuccessIcon from '@/images/icons/edm/send/send-success.png';
import BgIcon from '@/images/icons/edm/send/background.png';
import AiHostingIcon from '@/images/icons/edm/send/ai-hosting.png';
import { ReactComponent as VideoIcon } from '@/images/icons/edm/video.svg';
import { ReactComponent as VideoRightIcon } from '@/images/icons/edm/video-right.svg';
import { navigate } from '@reach/router';
import { edmDataTracker } from '../../tracker/tracker';
import { ConfigActions, useActions } from '@web-common/state/createStore';

import styles from './SendSuccessPage.module.scss';
import { guardString } from '../../utils';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

const videoDrawerConfig = { videoId: 'V10', source: 'kehukaifa', scene: 'kehukaifa_2' };

export interface SuccessPageBtn {
  text: string;
  style?: React.CSSProperties;
  type?: 'minorLine' | 'primary';
  onclick(): void;
}

export const SendSuccessPage: FC<{
  edmSubject: string;
  // channel?: TaskChannel;
  sendCount: number;
  // toDetailPage: () => void;
  // backToSource: () => void;
  // backString: string;
  // openAiHosting(): void;
  btns: SuccessPageBtn[];
}> = props => {
  const { edmSubject, sendCount, btns } = props;
  const [conf, setConf] = useState<SendBoxConfRes>();
  const { showVideoDrawer } = useActions(ConfigActions);
  const openHelpCenter = useOpenHelpCenter();

  const query = useCallback(async () => {
    try {
      const result = await edmApi.getSendBoxConf({ type: 0 });
      setConf(result);
    } catch (err) {}
  }, [setConf]);

  useEffect(() => {
    query();
    edmDataTracker.successPage({
      show: getIn18Text('ZHANSHI'),
    });
  }, []);

  useEffect(() => {
    if (conf != null) {
      edmDataTracker.successPageAiHosting({
        show: getIn18Text('ZHANXIAN'),
      });
    }
  }, [conf]);

  const renderAiHosting = () => {
    if (conf == null) {
      return null;
    }
    let info = '';
    let btnStr = '';
    let href = '#edm?page=aiHosting';
    if (conf.edmHostingState === 0) {
      info = '全自动多轮智能营销，回复率提高一倍';
      href = '#edm?page=aiHosting&pageTo=new';
      btnStr = '去开启';
    } else if (conf.edmHostingState === 1) {
      href = '#edm?page=aiHosting&pageTo=addContact';
      info = '添加联系人启动多轮营销，回复率提高一倍';
      btnStr = '添加联系人';
    } else if (conf.edmHostingState === 2) {
      return null;
    }

    return (
      <div className={styles.aiHosting}>
        <img src={AiHostingIcon} className={styles.leftIcon} alt="" />
        <div className={styles.infoContent}>
          <div className={styles.infoTitle}>{getIn18Text('YINGXIAOTUOGUAN')}</div>
          <div className={styles.infoInfo}>{info}</div>
        </div>
        <Button
          btnType="minorLine"
          onClick={() => {
            navigate(href);
            edmDataTracker.successPageAiHosting({
              show: getIn18Text('ANNIUDIANJI'),
            });
          }}
        >
          {btnStr}
        </Button>
        <div className={styles.recommendTag}>{getIn18Text('TUIJIANSHIYONG')}</div>
      </div>
    );
  };

  useEffect(() => {
    if (conf != null && conf.items != null && conf.items.length > 0) {
      edmDataTracker.successPageWiki({
        show: getIn18Text('ZHANXIAN'),
      });
    }
  }, [conf]);

  const renderWiki = () => (
    <>
      {conf != null && conf.items != null && conf.items.length > 0 && (
        <div className={styles.wikiInfo}>
          <div className={styles.leftWrap}>
            <img src={WikiIcon} className={styles.leftIcon} alt="" />
          </div>
          <div className={styles.wikiWrap}>
            <div className={styles.wikiWrapTop}>
              <div className={styles.infoContent}>
                <div className={styles.infoTitle}>{getIn18Text('XUEXITUIJIAN')}</div>
                <div className={styles.infoInfo}>{getIn18Text('ZUIXINDEYOUJIANYINGXIAO')}</div>
              </div>
              <Button
                onClick={() => {
                  openHelpCenter('/c/1598628693143560194.html');
                  // window.open('https://waimao.163.com/knowledgeCenter#/c/1598628693143560194.html');
                  edmDataTracker.successPageWikiItemAction({
                    more: 'more',
                  });
                }}
                btnType="minorLine"
              >
                {getIn18Text('CHAKANGENGDUO')}
              </Button>
            </div>
            <div className={styles.wikiList}>
              {conf.items.map((item, index) => (
                <div key={index} className={styles.wikiItem}>
                  <div className={styles.wikiItemIcon}></div>
                  <a
                    target="_blank"
                    href=""
                    onClick={e => {
                      openHelpCenter(item.jumpUrl);
                      edmDataTracker.successPageWikiItemAction({
                        title: item.desc,
                      });
                      e.preventDefault();
                    }}
                    className={styles.wikiItemInfo}
                  >
                    {item.desc}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.content}>
        <div className={styles.sendSuccess}>
          <img src={SendSuccessIcon} className={styles.successIcon} alt="" />
          <div className={styles.successContent}>
            <div className={styles.successTitle}>{getIn18Text('FAJIANRENWUSHEZHICHENG')}</div>
            <div className={styles.successSubTitle}>{getIn18Text('NIKEYIFANHUILIEBIAO')}</div>
            <div className={styles.successInfo}>
              <div className={styles.edmTitle}>
                {getIn18Text('YOUJIANMINGCHENG：')}
                {edmSubject}
              </div>
              <div className={styles.edmCount}>
                {getIn18Text('FAJIANLIANG：')}
                {sendCount}
              </div>
            </div>
            <div className={styles.btns}>
              {btns.map(item => {
                return (
                  <Button btnType={item.type || 'minorLine'} onClick={item.onclick} style={item.style}>
                    {item.text}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
        <p className={styles.videoTip} onClick={() => showVideoDrawer(videoDrawerConfig)}>
          <VideoIcon /> <span>想要提升回复量？试试多轮营销</span>
          <VideoRightIcon />
        </p>
        {renderAiHosting()}
        {renderWiki()}
      </div>
    </div>
  );
};
