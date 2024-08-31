import { getIn18Text } from 'api';
import React from 'react';
import { SnsMarketingPost, SnsPostStatus } from 'api';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import SiriusButton from '@web-common/components/UI/Button';
import { TongyongChenggongMian } from '@sirius/icons';

import CreatingPostPng from '../../images/post-creating.png';
import style from './modals.module.scss';

export interface CreatingPostModalProps {
  posts?: SnsMarketingPost[];
  visible: boolean;
  onOk?: () => void;
}

export const CreatingPostModal = (props: CreatingPostModalProps) => {
  const { posts, visible, onOk } = props;
  const progress = posts ? posts.filter(post => post.postStatus !== SnsPostStatus.GENERATING).length / posts.length : 0;
  return (
    <SiriusModal className={style.creatingPostModal} visible={visible} footer={null} width={384} closable={false}>
      <div className={style.creatingPostModalBody}>
        <img src={CreatingPostPng} width={110} height={110} alt="" />
        <div className={style.progress}>
          <div className={style.progressInner} style={{ width: progress * 100 + '%' }} />
        </div>
        <div className={style.modalTitle}>{getIn18Text('TIEZIZHINENGSHENGCHENGZHONG')}</div>
        <div className={style.tipContent}>
          {getIn18Text('ZHINENGSHENGCHENGYUJIHAO')}
          <br />
          {getIn18Text('SHENGCHENGWANCHENGHOUXITONG')}
        </div>
        <div className={style.buttons}>
          <SiriusButton btnType="primary" onClick={onOk}>
            {getIn18Text('ZHIDAOLE')}
          </SiriusButton>
        </div>
      </div>
    </SiriusModal>
  );
};

export interface CheckPostModalProps {
  visible: boolean;
  onOk?: () => void;
}

export const CheckPostModal = (props: CheckPostModalProps) => {
  const { visible, onOk } = props;

  return (
    <SiriusModal className={style.creatingPostModal} visible={visible} footer={null} width={364} closable={false}>
      <div className={style.creatingPostModalBody}>
        <div style={{ margin: '20px auto 16px' }} className={style.successIcon}>
          <TongyongChenggongMian style={{ fontSize: '42px', color: '#0FD683' }} />
        </div>
        <div className={style.modalTitle}>{getIn18Text('TIEZISHENGCHENGWANCHENG，')}</div>
        <div className={style.tipContent}>{getIn18Text('QINGJIANCETIEZINEIRONG')}</div>
        <div className={style.buttons}>
          <SiriusButton btnType="primary" onClick={onOk}>
            {getIn18Text('JIANCHATIEZINEIRONG')}
          </SiriusButton>
        </div>
      </div>
    </SiriusModal>
  );
};
