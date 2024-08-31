import React, { FC, useState, useEffect } from 'react';
import { Modal } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { inWindow, apiHolder, WebMailApi, apis, SystemApi } from 'api';
import moment from 'moment';
import CloseIcon from '@/images/icons/new_version_close.svg';
import style from './welcome_guide.module.scss';
import { _fGenerateSwitchNumber } from './utils';
import InfoIcon from '@/images/icons/right-arrow.svg';
import { getHistoryState } from '@/components/util/historyState';

const WELCOME_GUIDE = 'welcome_guide';
const SHOW_OLD = 'show_old';
const ACTIVITY_STAT = 'activity_stat'; // 记录活动状态，值为活动id。
const SHOW_ACTIVITY = 'show_activity'; // 显示弹窗标记
const ACTIVITY_FIRST = 'activity_first'; // 是否展示第一次弹窗
const fromWebmailPattern = /from=login/;
const storeApi = apiHolder.api.getDataStoreApi();
const FROM_LOGIN = 'from_login';
const webmailApi = apiHolder.api.requireLogicalApi(apis.webmailApiImpl) as WebMailApi;

// import { activityConf } from './activity-conf';
import { getIn18Text } from 'api';
const activityConf = webmailApi.getTimeRange();
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
// 活动相关
const { startTime, endTime } = activityConf.yun_bi_ji;
const startFormat = moment(startTime).format('YYYY/MM/DD');
const endFormat = moment(endTime).format('YYYY/MM/DD');

const firstEnter = () => getHistoryState() && getHistoryState().from && getHistoryState().from === 'login';
// // todo 删除
// const firstEnter = () => true;

const getStore = (key: string, noValue = false) => {
  const result = storeApi.getSync(key);
  if (noValue) {
    if (result.suc && result.data != null) {
      return true;
    }
  } else {
    if (result.suc && result.data === 'true') {
      return true;
    }
  }
  return false;
};
export const WelcomeModal: FC = props => {
  const [isActivity, setIsActivity] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [isKnow, setIsKnow] = useState(false);
  const [isJoin, setIsjoin] = useState(true);
  const [activityId, setActivityId] = useState(0);
  const [hasClosedActivity, setCloseActivity] = useState(true);
  useEffect(() => {
    // 设置webmail state
    const state = getHistoryState() as Record<string, string>;
    if (state[SHOW_OLD]) {
      webmailApi.setState(state);
      // 记录到localstorage
      storeApi.putSync(SHOW_OLD, state[SHOW_OLD] || '2'); // 默认展示设置中的回到旧版
    } else {
      // 如果不存在，则去localstorage中读取，默认为2
      const result = storeApi.getSync(SHOW_OLD);
      let state = '2';
      if (result.suc && result.data != null) {
        state = result.data;
      }
      webmailApi.setState({
        [SHOW_OLD]: state,
      });
    }

    systemApi.getUserConfig(['ACTIVITY_FIRST']).then(res => {
      const hasClosed = !!(res?.length && res[0].value === '1');
      setCloseActivity(hasClosed);
      if (!getStore(WELCOME_GUIDE) && !hasClosed) {
        setVisible(true);
      }
    });
    if (inWindow()) {
      // 如果在活动期内
      const time = Date.now();
      if (!getStore(WELCOME_GUIDE)) {
        if (time > startTime && time < endTime) {
          if (!getStore(ACTIVITY_STAT, true)) {
            // 没有记录
            webmailApi
              .getActivityInfo()
              .then(res => {
                console.log(res);
                const activityInfos = res.data?.activityInfos;
                if (activityInfos != null) {
                  const info = activityInfos.find(item => item.type === 'webmail_lx_note_v2');
                  if (info == null) {
                    return;
                  }
                  setActivityId(info.activityId);
                  if (info.join === 1) {
                    // 报名成功
                    setIsjoin(true);
                    storeApi.putSync(ACTIVITY_STAT, info.activityId + '');
                  } else {
                    setIsjoin(false);
                  }
                }
              })
              .catch(() => {
                message.error('获取活动详情失败，请重试');
              });
          }
        }
      }
    }
  }, []);
  const setActivityClosedOnline = () => {
    systemApi.setUserConfig([{ field: 'ACTIVITY_FIRST', value: '1' }]).then(() => {
      setCloseActivity(true);
    });
  };
  const showModal = () => {
    setVisible(true);
    setIsActivity(true);
    setIsKnow(getStore(ACTIVITY_STAT, true));
  };
  useEffect(() => {
    if (inWindow()) {
      window.addEventListener(SHOW_ACTIVITY, showModal);
    }
    return () => {
      window.removeEventListener(SHOW_ACTIVITY, showModal);
    };
  }, []);

  useEffect(() => {
    if (!isJoin) {
      // 已经打开过了，就不能自动打开
      if (!getStore(ACTIVITY_FIRST) && !hasClosedActivity) {
        setVisible(true);
        setIsActivity(true);
      }
    } else if (firstEnter() && !hasClosedActivity) {
      // 不在活动期内
      setVisible(true);
    }
  }, [isJoin, hasClosedActivity]);

  const setKnowStat = (): void => {
    // todo 发送请求
    webmailApi
      .joinActivity({ activityId })
      .then(res => {
        if (res.data) {
          setIsKnow(true);
          storeApi.putSync(ACTIVITY_STAT, activityId + '');
        }
      })
      .catch(err => {
        message.error(err?.message || '报名失败，请重试');
      });
  };

  const EntryLeftNode = (
    <div className={style.leftContent}>
      <div className={style.contentTitle}>
        {getIn18Text('QIYEYOUXIANGQUAN')}
        <br />
        {getIn18Text('HUANYINGTIYAN')}
      </div>
      <div className={style.contentInfo}>{getIn18Text('YOUXIANGANQUANGENG')}</div>
      <div
        onClick={() => {
          setVisible(false);
        }}
        className={style.contentBtn}
      >
        {getIn18Text('JINRUYOUXIANG')}
      </div>
      <div className={style.contentTips}>
        {getIn18Text('YIYOU')}
        <span className={style.tipsNumber}>{_fGenerateSwitchNumber().toLocaleString()}</span>
        {getIn18Text('RENQIANGXIANTIYAN')}
      </div>
    </div>
  );

  const ActivityLeftNode = (
    <div className={style.activityLeft}>
      <div className={style.activityTitle}>企业邮箱全新改版</div>
      <div className={style.activityInfoWrapper}>
        <div className={style.activityInfo}>
          任意<span className={style.activityInfoNumber}>2</span>天累计发信<span className={style.activityInfoNumber}>2</span>封
        </div>
        <div className={style.activityInfo}>
          即可<span className={style.activityInfoNumber}>免费领取</span>35天专属<span className={style.activityInfoNumber}>有道云笔记会员</span>
        </div>
      </div>
      <div className={style.activityTips}>邮箱安全更进一步，精准防诈骗，邮件协同效率翻倍，崭新的视觉，高效的交互体验。</div>
      <div className={style.buttonWrapper}>
        {isKnow ? (
          <div
            onClick={() => {
              // storeApi.putSync(WELCOME_GUIDE, 'true');
              storeApi.putSync(ACTIVITY_FIRST, 'true');
              setActivityClosedOnline();
              setVisible(false);
            }}
            className={style.buttonLeft}
          >
            报名成功，速去写信
          </div>
        ) : (
          <div onClick={setKnowStat} className={style.buttonLeft}>
            立即报名
          </div>
        )}
        {!isKnow && (
          <div
            onClick={() => {
              storeApi.putSync(WELCOME_GUIDE, 'true');
              setVisible(false);
            }}
            className={style.buttonRight}
          >
            放弃领取，直接体验
          </div>
        )}
      </div>
      <div className={style.activityTime}>
        <div className={style.timeRange}>活动时间：2022.11.14-2022.11.27</div>
        <div
          className={style.activityInfoBtn}
          onClick={() => {
            setShowTips(true);
          }}
        >
          活动规则详情
          <img
            style={{
              marginLeft: '8px',
              // width: 4,
              // height: 8
            }}
            src={InfoIcon}
            alt=""
          />
        </div>
      </div>
      <Modal
        visible={showTips}
        width={673}
        centered
        closeIcon={
          <img
            style={{
              width: 16,
              height: 16,
            }}
            src={CloseIcon}
          />
        }
        title={null}
        footer={null}
        className={style.modalWrapper}
        maskClosable={false}
        onCancel={() => {
          setShowTips(false);
        }}
      >
        <div className={style.activityTipsWrapper}>
          <div className={style.activityTipsTitle}>企业邮箱全新改版，限时体验领福利</div>
          <ul className={style.activityTipsContent}>
            <li>活动时间：2022/11/14-2022/11/27</li>
            <li>
              活动规则：在活动时间内，在新版累计<span className={style.infoMark}>签到2天</span>，即可获得<span className={style.infoMark}>35天有道云笔记会员</span>！
            </li>
            <li>签到规则：发送1封邮件即可完成当天签到，发信包含回复，转发和写信。活动奖品每用户限领1次。</li>
            <li>奖品发放：获得奖品资格后，我们会在2022/11/28-2022/12/4内通过邮件发放云笔记会员激活码至您的邮箱。如有疑问，可联系kf@office.163.com</li>
            <li>补充说明：本次活动奖品为企业邮用户专属会员权益，活动最终解释权归网易企业邮箱所有。</li>
          </ul>
          <div className={style.activityTipsBtn}>
            <div
              onClick={() => {
                setShowTips(false);
              }}
            >
              确定
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );

  return (
    <Modal
      centered
      width={1000}
      title={null}
      visible={visible}
      // visible
      closeIcon={
        <img
          style={{
            width: 16,
            height: 16,
          }}
          src={CloseIcon}
        />
      }
      footer={null}
      className={style.modalWrapper}
      maskClosable={false}
      onCancel={() => {
        setVisible(false);
      }}
      afterClose={() => {
        const time = Date.now();
        if (time > startTime && time < endTime) {
          storeApi.putSync(ACTIVITY_FIRST, 'true');
        } else {
          storeApi.putSync(WELCOME_GUIDE, 'true');
        }
        setActivityClosedOnline();
      }}
      mask={!showTips}
    >
      <div className={style.content}>
        {isActivity ? ActivityLeftNode : EntryLeftNode}
        <div className={style.rightContent}>
          <div className={style.contentBg}></div>
        </div>
      </div>
    </Modal>
  );
};
