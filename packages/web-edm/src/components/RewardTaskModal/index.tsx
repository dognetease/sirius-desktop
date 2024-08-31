import React, { useState, useEffect } from 'react';
import style from './rewardTask.module.scss';
import { TongyongGuanbiXian } from '@sirius/icons';
import { Modal } from 'antd';
import RewardTaskBg from '@/images/icons/edm/yingxiao/rewrd-task-modal.png';
import { EdmSendBoxApi, apiHolder, apis, api, EdmRewardTaskStateResp } from 'api';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { navigate } from 'gatsby';

interface RewardTaskModalProps {
  rewardTaskStateRespFromProp?: EdmRewardTaskStateResp;
  showRewardTaskModal?: boolean;
  handleClose: (jumpOut?: boolean) => void;
}

const REWARD_TASK_RESP_CACHE = 'rewardTaskRespCache';
const storageApi = api.getDataStoreApi();
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

// state = -1，无权限（可能会从无权限变为有权限）
// state = 0，未参与
// state = 1，已参与
// state = 2，已结束 （活动结束但可能没有发奖励，此时状态为已结束，弹窗UI应该和已参与一致）
// state = 3，已奖励 （显示已奖励的恭喜弹窗3）
// state = 4，活动不可见 （任务福利入口不做显示）
export const RewardTaskModalComponent: React.FC<RewardTaskModalProps> = props => {
  const { rewardTaskStateRespFromProp, showRewardTaskModal, handleClose } = props;
  const [rewardTaskStateResp, setRewardTaskStateResp] = useState<EdmRewardTaskStateResp>();

  useEffect(() => {
    setRewardTaskStateResp(rewardTaskStateRespFromProp);
  }, [showRewardTaskModal]);

  const refreshRewardTaskLatestStatus = () => {
    edmApi.getRewardTaskState().then(data => {
      storageApi.putSync(REWARD_TASK_RESP_CACHE, JSON.stringify(data));
      setRewardTaskStateResp(data);
    });
  };

  const clickJoinReward = () => {
    edmApi
      .joinRewardTask()
      .then(data => {
        // state = 1 已参与，拉取最新数据刷新UI
        if (data.state === 1) {
          refreshRewardTaskLatestStatus();
        } else {
          message.error('领取福利失败');
        }
      })
      .catch(error => {
        message.error(error.message);
      })
      .finally(() => {});
  };

  const clickSendEmail = () => {
    handleClose();
    navigate('#edm?page=write');
  };

  const footer = () => {
    if (rewardTaskStateResp?.state === 0) {
      return (
        <div className={style.bottomContent}>
          <button style={{ cursor: 'pointer' }} className={style.normalButton} onClick={() => handleClose()}>
            放弃福利
          </button>
          <button className={style.blueButton} onClick={clickJoinReward}>
            领取福利
          </button>
        </div>
      );
    } else if (rewardTaskStateResp?.state === 1 || rewardTaskStateResp?.state === 2) {
      return (
        <div className={style.bottomLargeContent}>
          <button className={style.largeButton} onClick={() => clickSendEmail()}>
            已领取，去发信
          </button>
        </div>
      );
    } else {
      return (
        <div className={style.bottomContent}>
          <button style={{ cursor: 'pointer' }} className={style.normalButton} onClick={() => handleClose()}>
            我知道了
          </button>
        </div>
      );
    }
  };

  const centerDefaultItemDetail = () => {
    return (
      <div className={style.itemDetail}>
        网易外贸通为助力企业营销活动，针对新开客户推出营销邮件
        <span className={style.blueItemDetail}>发多少送多少</span>
        限时福利，封顶
        <span className={style.blueItemDetail}>赠送5000封</span>。
      </div>
    );
  };

  const centerNewRuleItemDetail = () => {
    return (
      <div className={style.itemDetail}>
        <div>发信量1000~1999封赠送1000封；</div>
        <div>发信量2000~2999封赠送2000封；</div>
        <div>发信量3000~3999封赠送3000封；</div>
        <div>发信量4000-4999封赠送4000封；</div>
        <div>
          发信量5000封及以上封顶<span className={style.blueItemDetail}>赠送5000封</span>。
        </div>
      </div>
    );
  };

  const centerDefaultContent = () => {
    return (
      <div className={style.centerContent}>
        <div className={style.item}>
          <span className={style.itemNumber}>1.</span>
          <span className={style.itemTitle}>福利时间：</span>
          <div className={style.itemDetail}>领取福利日起-{rewardTaskStateResp?.taskExpireTime}截止</div>
        </div>
        <div className={style.item}>
          <span className={style.itemNumber}>2.</span>
          <span className={style.itemTitle}>福利内容：</span>
          {rewardTaskStateResp?.ruleType === 0 ? centerDefaultItemDetail() : centerNewRuleItemDetail()}
        </div>
        <div className={style.item}>
          <span className={style.itemNumber}>3.</span>
          <span className={style.itemTitle}>参与条件：</span>
          <div className={style.itemDetail}>在此弹框点击【领取福利】后到截止日期前通过外贸通邮件营销模块发送的营销邮件数量，均计入赠送额度。</div>
        </div>
      </div>
    );
  };

  const joinedContent = () => {
    return (
      <div className={style.joinedContent}>
        <div className={style.joinedDivider}>
          <div className={style.leftLine}></div>
          <div className={style.round}></div>
          <div className={style.rightLine}></div>
        </div>
        {rewardTaskStateResp?.ruleType === 0 ? (
          <div className={style.emailCount}>- 当前账号营销邮件发信量：{rewardTaskStateResp?.userSendCount}封</div>
        ) : (
          <div className={style.emailCount}>
            - 当前账号/当前企业营销邮件发信量：{rewardTaskStateResp?.userSendCount}封/{rewardTaskStateResp?.orgSendCount}封
          </div>
        )}
        <div className={style.emailCount}>- 当前企业预计获赠的营销邮件量：{rewardTaskStateResp?.rewardSendCount}封</div>
        <div className={style.tips}>注：数据更新时间可能有1小时延迟</div>
      </div>
    );
  };

  const centerContent = () => {
    if (rewardTaskStateResp?.state === 0) {
      return centerDefaultContent();
    } else if (rewardTaskStateResp?.state === 1 || rewardTaskStateResp?.state === 2) {
      return centerDefaultContent();
    } else {
      return (
        <div className={style.centerContent}>
          <div className={style.endContent}>
            <div className={style.endContentTop}>
              <div className={style.divider}></div>
              <span className={style.endContentTitle}>结果公布</span>
              <div className={style.divider}></div>
            </div>
            <div className={style.endContentDetail}>
              截止{rewardTaskStateResp?.taskExpireTime}，您的企业共发送营销邮件
              <span className={style.blueEndContentDetail}>{rewardTaskStateResp?.orgSendCount}封</span>
              ，获赠营销邮件
              <span className={style.blueEndContentDetail}>{rewardTaskStateResp?.rewardSendCount}封</span>
              ，获赠的邮件数量已返充至企业账号中。
            </div>
          </div>
        </div>
      );
    }
  };

  const titleComp = () => {
    if (rewardTaskStateResp?.state === 3) {
      return <span className={style.title}>恭喜你完成外贸通助力企业营销活动</span>;
    } else {
      return (
        <span className={style.title}>
          外贸通助力企业
          <span className={style.blueTitle}>免费发送营销邮件</span>
        </span>
      );
    }
  };

  const wrapHeight = () => {
    if (rewardTaskStateResp?.ruleType === 0) {
      if (rewardTaskStateResp?.state === 0 || rewardTaskStateResp?.state === 3) {
        return 516;
      } else {
        return 600;
      }
    } else {
      if (rewardTaskStateResp?.state === 0) {
        return 586;
      } else if (rewardTaskStateResp?.state === 3) {
        return 516;
      } else {
        return 669;
      }
    }
  };

  return (
    <>
      <Modal
        title=""
        width={502}
        visible={true}
        onCancel={() => handleClose()}
        closeIcon={null}
        className={style.customModal}
        footer={null}
        maskClosable={false}
        getContainer={() => document.body}
      >
        <div className={style.wrap} style={{ height: wrapHeight() }}>
          <img src={RewardTaskBg} alt="" />
          <TongyongGuanbiXian className={style.close} onClick={() => handleClose()} />
          <div className={style.content}>
            <div className={style.topContent}>
              <div className={style.activityButton}>限时福利</div>
              {titleComp()}
              <span className={style.detail}>领取福利后，营销邮件发多少送多少，封顶赠送5000封！</span>
            </div>
            {centerContent()}
            {(rewardTaskStateResp?.state === 1 || rewardTaskStateResp?.state === 2) && joinedContent()}
          </div>
          {footer()}
        </div>
      </Modal>
    </>
  );
};
