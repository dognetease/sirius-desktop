import React, { FC, useEffect, useCallback, useState, useMemo } from 'react';
import { apiHolder, apis, EdmSendBoxApi, SendBoxConfRes, TaskChannel } from 'api';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import WikiIcon from '@/images/icons/edm/send/wiki.png';
import SendSuccessIcon from '@/images/icons/edm/send/send-success.png';
import BgIcon from '@/images/icons/edm/send/background.png';
import AiHostingIcon from '@/images/icons/edm/send/ai-hosting.png';
import { navigate } from '@reach/router';
import { edmDataTracker } from '../../tracker/tracker';

import styles from './SendSuccessPage.module.scss';
import { guardString } from '../../utils';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

/**
 *
 * @param props
 * <Button
                btnType="minorLine"
                style={{
                  marginRight: 12,
                }}
                onClick={open}
              >

              </Button>
 * @returns
 */
export const SendSuccessWithTaskPage: FC<{
  edmSubject?: string;
  taskSubject: string;
  receiveCount: number;
  planIntervalDays?: number;
  btns?: {
    text: string;
    style?: React.CSSProperties;
    type?: 'minorLine' | 'primary';
    onclick(): void;
  }[];
}> = props => {
  const { edmSubject, receiveCount, taskSubject, btns = [], planIntervalDays = 4 } = props;
  const [conf, setConf] = useState<SendBoxConfRes>();
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
      show: '展示',
    });
  }, []);

  useEffect(() => {
    if (conf != null) {
      edmDataTracker.successPageAiHosting({
        show: '展现',
      });
    }
  }, [conf]);

  useEffect(() => {
    if (conf != null && conf.items != null && conf.items.length > 0) {
      edmDataTracker.successPageWiki({
        show: '展现',
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
                <div className={styles.infoTitle}>学习推荐</div>
                <div className={styles.infoInfo}>最新的邮件营销方法，快来学一学成功案例吧</div>
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
                查看更多
              </Button>
            </div>
            <div className={styles.wikiList}>
              {conf.items.map((item, index) => (
                <div key={index} className={styles.wikiItem}>
                  <div className={styles.wikiItemIcon}></div>
                  <a
                    target="_blank"
                    href={item.jumpUrl}
                    onClick={() => {
                      edmDataTracker.successPageWikiItemAction({
                        title: item.desc,
                      });
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

  // const renderBackTitle = useMemo(() => (backString ? '返回原页面' : '返回任务列表'), []);

  return (
    <div className={styles.wrap}>
      <div className={styles.content}>
        <div className={styles.sendSuccess}>
          <img src={SendSuccessIcon} className={styles.successIcon} alt="" />
          <div className={styles.successContent}>
            <div className={styles.successTitle}>{edmSubject ? '发件任务设置成功，联系人已添加至营销托管！' : '营销托管添加联系人成功！'}</div>

            <div className={styles.successSubTitle}>
              {edmSubject ? '本次任务发送成功间隔4天后，将自动开始下一轮营销' : '系统将根据设置每日自动发送营销邮件，可以进入营销托管页面关注发件效果'}
            </div>
            <div className={styles.successInfo}>
              {edmSubject ? <div className={styles.edmTitle}>单次发信任务名称：{edmSubject}</div> : null}
              <div className={styles.edmTitle}>营销托管任务名称：{taskSubject}</div>
              <div className={styles.edmCount}>联系人数：{receiveCount}</div>
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
        {renderWiki()}
      </div>
    </div>
  );
};
