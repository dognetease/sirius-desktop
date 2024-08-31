import React, { useEffect, useState, useRef, useImperativeHandle, useMemo, useContext } from 'react';
import { EdmSendConcatInfo, SecondSendStrategy, BaseSendInfo, TaskChannel } from 'api';
import { edmDataTracker } from '../../tracker/tracker';

import { SmartSend } from '../SmartSend/smartSend';
import { DoubleTrack } from '../../components/doubleTrack';
import { MultiVersionMails } from '../../components/multiVersionMails';
import { ValidatorContext } from '../validator/validator-context';

import style from './index.module.scss';
import { ReactComponent as RightArrow } from '@/images/icons/edm/yingxiao/right-arrow.svg';
import { getTransText } from '@/components/util/translate';
import { useOpenHelpCenter } from '@web-common/utils/utils';
interface SmartMarketingAssistantProps {
  visible: boolean;
  smartSendOn?: boolean;
  newReceivers: EdmSendConcatInfo[];
  astrictCountVal?: number;
  initData?: Array<SecondSendStrategy>;
  baseSecondSendInfo: BaseSendInfo;
  needSystemRecommend: boolean;
  mailTextContent?: string;
  mailContent?: string;
  handleSwitchChange?: (checked: boolean) => void;
  channel?: TaskChannel;
}

export const SmartMarketingAssistant = React.forwardRef((props: SmartMarketingAssistantProps, ref) => {
  const { visible, newReceivers = [], astrictCountVal, mailContent, mailTextContent, smartSendOn = true, handleSwitchChange, channel } = props;
  console.log('SmartMarketingAssistant=====props', props);
  const initSecondSendData = props.initData;

  const [smartSendOpen, setSmartSendOpen] = useState(smartSendOn);
  const [astrictCount, setAstrictCount] = useState(astrictCountVal || 0);
  const [showForm, setShowForm] = useState(false);
  // 任务诊断相关
  const validatorProvider = useContext(ValidatorContext);

  const openHelpCenter = useOpenHelpCenter();

  useEffect(() => {
    if (validatorProvider) {
      validatorProvider.dispatch({
        type: 'smartSend',
        payload: smartSendOpen,
      });
    }
  }, [smartSendOpen]);

  const reMarketingRef = useRef<HTMLDivElement>(null);
  const multiVersionRef = useRef<HTMLDivElement>(null);

  const emailContentRef = useRef<any>('');
  emailContentRef.current = {
    mailContent: mailContent,
    contactSize: newReceivers?.length || 0,
    mailTextContent: mailTextContent,
  };

  const MultiVersionMailsComp = useMemo(() => {
    return (
      <MultiVersionMails
        ref={multiVersionRef}
        emailContentRef={emailContentRef}
        sendShowForm={showForm => setShowForm(showForm)}
        emailContent={mailContent || ''}
        visible={visible}
      />
    );
    // visible
  }, [showForm, visible, newReceivers]);

  useEffect(() => {
    // if (newReceivers.length >= 50 && mailTextContent && mailTextContent.length > 0) {
    //   multiVersionRef.current?.openMultiVersionSwitch();
    // }
  }, [newReceivers]);

  useEffect(() => {
    if (!visible) {
      multiVersionRef.current?.closeTipVisible();
    }
  }, [visible]);

  useImperativeHandle(ref, () => ({
    isSmartSendOpen() {
      return smartSendOpen;
    },
    getAstrictCount() {
      return astrictCount;
    },
    async getAiModifyInfo() {
      console.log('come here');
      const info = await multiVersionRef.current?.getAiModifyInfo();
      return info;
    },
    getReMarketingInfo(noSync?: boolean) {
      return reMarketingRef.current?.getReMarketingInfo(noSync);
    },

    closeTipVisible() {
      multiVersionRef.current?.closeTipVisible();
      return;
    },
    getAiModifyStatus() {
      return multiVersionRef.current?.getAiModifyStatus();
    },
    getAiModifySwitchChecked() {
      return multiVersionRef.current?.getAiModifySwitchChecked();
    },
    closeMultiVersionSwitch() {
      multiVersionRef.current?.closeMultiVersionSwitch();
      return;
    },
    openMultiVersionSwitch() {
      multiVersionRef.current?.openMultiVersionSwitch();
    },
  }));

  return (
    <div className={style.intellect}>
      <div className={style.intellectTitle}>{getTransText('ZHINENGYINGXIAOZHUSHOU')}</div>
      <div className={style.intellectContent}>
        <div className={style.intellectInfo}>
          {getTransText('BUZHIDAOZENMETISHENGYINGXIAOXIAOGUO')}
          <div
            className={style.intellectInfoMore}
            onClick={() => {
              edmDataTracker.taskIntellectTrack('learnMore');
              openHelpCenter('/c/1648874683870826497.html');
              // window.open('https://waimao.163.com/helpCenter/c/1648874683870826497.html');
            }}
          >
            {getTransText('LIAOJIEGENGDUO')}
            <RightArrow />
          </div>
          {/* <a href="http://waimao.163.com/knowledge/article/48" target="_blank" onClick={() => edmDataTracker.clickSecondSendInfo()}>
            了解更多<RightArrow style={{ marginLeft: 2 }} />
          </a> */}
        </div>
        <SmartSend
          defaultOpen={smartSendOn}
          // forceOpen={channel === TaskChannel.senderRotate}
          openStatusChange={open => {
            setSmartSendOpen(open);
          }}
          receivers={newReceivers}
          astrictCountChange={(count: number) => setAstrictCount(count)}
          initAstrictCount={astrictCountVal}
        />
        {MultiVersionMailsComp}
        {channel !== TaskChannel.senderRotate && (
          <DoubleTrack
            initStrategys={initSecondSendData}
            baseSecondSendInfo={props.baseSecondSendInfo}
            handleSwitchChange={checked => {
              handleSwitchChange && handleSwitchChange(checked);
            }}
            needSystemRecommend={props.needSystemRecommend && !(initSecondSendData && initSecondSendData?.length > 0)}
            ref={reMarketingRef}
          />
        )}
      </div>
    </div>
  );
});
