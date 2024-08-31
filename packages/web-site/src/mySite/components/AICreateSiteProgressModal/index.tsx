import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { ModalProps } from 'antd';
import React, { useState, useEffect, useRef } from 'react';
import styles from './index.module.scss';
import lottie from 'lottie-web';
import CreateSiteSuccessAnimData from './createSiteSuccess.json';
import ScatterFlowersAnimData from './scatterFlowers.json';
import ShalouAnimData from './shalou.json';
import { getIn18Text } from 'api';

export interface AICreateSiteProgressModalProps extends ModalProps {
  isSuccess?: boolean;
  isGateTimeout?: boolean;
  onClose?: () => void;
  onJumpButtonClick?: () => void;
  onCollapse: () => void;
}

const AICreateSiteProgressModal: React.FC<AICreateSiteProgressModalProps> = props => {
  const { isSuccess = false, onJumpButtonClick = () => {}, isGateTimeout = false, onClose = () => {}, onCollapse, ...modalProps } = props;
  const [currText, setCurrText] = useState('');
  const waitingTextGroup = ['正在搭建站点框架...', '正在生成视觉图片...', '正在润色内容文案...'];

  const currTextIndex = useRef(0);
  const timer = useRef<any>(null);
  const changeProgressText = () => {
    clearTimeout(timer.current);
    const nextText = waitingTextGroup[currTextIndex.current];
    if (nextText) {
      setCurrText(nextText);
    }

    if (currTextIndex.current + 1 < waitingTextGroup.length) {
      // 未展示完，8s后切换下个文案
      currTextIndex.current += 1;
      timer.current = setTimeout(() => {
        changeProgressText();
      }, 8000);
    }
  };

  const completeIconAnimContainer = useRef<any>(null);
  const scatterFlowersContainer = useRef<any>(null);

  useEffect(() => {
    if (props.isSuccess) {
      if (completeIconAnimContainer.current) {
        const completeAnim = lottie.loadAnimation({
          container: completeIconAnimContainer.current,
          animationData: CreateSiteSuccessAnimData,
          autoplay: true,
          loop: false,
          renderer: 'svg',
        });

        completeAnim.addEventListener('complete', () => {
          if (scatterFlowersContainer.current) {
            lottie.loadAnimation({
              container: scatterFlowersContainer.current,
              animationData: ScatterFlowersAnimData,
              autoplay: true,
              loop: false,
              renderer: 'svg',
            });
          }
        });
      }
    }
  }, [props.isSuccess]);

  useEffect(() => {
    if (isGateTimeout) {
      if (completeIconAnimContainer.current) {
        lottie.loadAnimation({
          container: completeIconAnimContainer.current,
          animationData: ShalouAnimData,
          autoplay: true,
          loop: true,
          renderer: 'svg',
        });
      }
    }
  }, [isGateTimeout]);

  useEffect(() => {
    if (props.visible) {
      currTextIndex.current = 0;
      setCurrText('');
      changeProgressText();
    } else {
      clearTimeout(timer.current);
    }
  }, [props.visible]);

  return (
    <SiriusModal
      width={400}
      style={{
        height: 290,
      }}
      footer={null}
      closable={false}
      maskClosable={false}
      className={styles.aICreateSiteProgressModal}
      {...modalProps}
    >
      <div className={styles.collapse} onClick={onCollapse}>
        {getIn18Text('SHOUQITANCHUANG')}
      </div>
      <div
        className={styles.progressContent}
        style={{
          display: isSuccess || isGateTimeout ? 'none' : 'flex',
        }}
      >
        <div className={styles.progrssIcon}></div>
        <div className={styles.text}>{currText}</div>
      </div>
      <div
        className={styles.successContent}
        style={{
          display: isSuccess || isGateTimeout ? 'flex' : 'none',
        }}
      >
        <div className={styles.completeIcon} ref={completeIconAnimContainer}></div>
        <div className={styles.completeText}>{isGateTimeout ? '网站生成中，请稍后查看' : '站点创建成功!'}</div>
        <div className={styles.scatterFlowersContainer} ref={scatterFlowersContainer}></div>
        <div className={styles.jumpButton} onClick={isGateTimeout ? onClose : onJumpButtonClick}>
          {isGateTimeout ? getIn18Text('SITE_ZHIDAOLE') : getIn18Text('LIJICHAKAN')}
        </div>
      </div>
    </SiriusModal>
  );
};

export default AICreateSiteProgressModal;
