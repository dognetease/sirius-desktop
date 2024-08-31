/**
 * 初始化一个空的react 函数式组件
 */

import { Popconfirm } from 'antd';

import React, { useState, useMemo } from 'react';
import { apiHolder as api, EventApi, getIn18Text } from 'api';
import classnames from 'classnames/bind';
import style from './TagGuide.module.scss';
import mailtagGuideImage from '@/images/icons/mail/mailtagguide.png';
import { MAIL_TAG_GUIDE_LOCAL_KEY } from '@web-mail/common/constant';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';

const realStyle = classnames.bind(style);
const eventApi: EventApi = api.api.getEventApi() as unknown as EventApi;

interface TagGuideProps {}

/**
 * 弹窗内容组件
 * 废弃，无使用
 */

export const TagGuideContent: React.FC<TagGuideProps> = () => {
  return (
    <div className={realStyle('mailTagGuide')} onClick={e => e.stopPropagation()}>
      {/* <div > */}
      <img src={mailtagGuideImage} alt="" className={realStyle('guidImg')} />
      {/* </div> */}
      <div className={realStyle('tagGuidTitle')}>{getIn18Text('DABIAOQIANKESHEZKJJL！')}</div>
      <div className={realStyle('tagGuidSubTitle')}>{getIn18Text('XINJIANHEXIUGAIBQSKYZDYBQKJJ。')}</div>
    </div>
  );
};

/**
 * 弹窗
 */

interface TagGuideModalProps {
  visiable: boolean;
  onClose?: () => void;
}

export const TagGuideModal: React.FC<TagGuideModalProps> = props => {
  const { visiable, onClose } = props;

  const handleVisiable = (visiable: boolean) => {
    if (!visiable) {
      onClose && onClose();
      localStorage.setItem(MAIL_TAG_GUIDE_LOCAL_KEY, 'true');
    }
  };

  const handleOk = e => {
    onClose && onClose();
    localStorage.setItem(MAIL_TAG_GUIDE_LOCAL_KEY, 'true');
    eventApi.sendSysEvent({
      eventName: 'mailMenuOper',
      eventData: {},
      eventStrData: 'mailTagGuideModalClose',
    });
  };

  return visiable ? (
    <SiriusModal
      visible={visiable}
      onOk={handleOk}
      wrapClassName={realStyle('tagGuideModalWrap')}
      onVisiable={handleVisiable}
      width={320}
      cancelButtonProps={{ style: { display: 'none' } }}
      closable={false}
      maskClosable={true}
      onCancel={handleOk}
    >
      <TagGuideContent />
    </SiriusModal>
  ) : (
    <></>
  );
};

/**
 * tag guide 包裹组件
 */
const TagGuide: React.FC<TagGuideProps> = props => {
  const localShow = useMemo(() => {
    try {
      return !localStorage.getItem(MAIL_TAG_GUIDE_LOCAL_KEY);
    } catch (e) {
      return false;
    }
  }, []);
  const [visible, setVisible] = useState(localShow);

  const handleOk = e => {
    e.stopPropagation();
    localStorage.setItem(MAIL_TAG_GUIDE_LOCAL_KEY, 'true');
    setVisible(false);
  };

  useMsgRenderCallback('mailMenuOper', ev => {
    if (ev?.eventStrData === 'mailTagGuideModalClose') {
      setVisible(false);
    }
  });

  return visible ? (
    <Popconfirm
      title={<TagGuideContent />}
      icon={<></>}
      placement="top"
      onOpenChange={e => e.stopPropagation()}
      overlayClassName={realStyle('tagGuideTitleWrap')}
      showCancel={false}
      cancelButtonProps={{ style: { display: 'none' } }}
      onConfirm={handleOk}
    >
      {props.children}
    </Popconfirm>
  ) : (
    <></>
  );
};

export default TagGuide;
