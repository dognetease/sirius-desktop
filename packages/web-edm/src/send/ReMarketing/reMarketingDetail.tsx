import React, { useRef, useEffect } from 'react';
import { SecondSendStrategy } from 'api';
import { Button } from 'antd';
import style from './reMarketing.module.scss';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { contentWithoutEmpty } from '../../send/utils/getMailContentText';
import { getIn18Text } from 'api';

export interface Props {
  visiable: boolean;
  strategy: SecondSendStrategy;
  onEdit: (strategy: SecondSendStrategy) => void;
  onClose: () => void;
}

export const ReMakretingDetail: React.FC<Props> = props => {
  const { visiable, strategy, onEdit, onClose } = props;
  const contentRef = useRef<HTMLDivElement | null>(null);

  const ContentComp = (title: string, value: string | Array<string>) => {
    return (
      <div className={style.contentArea}>
        <div className={style.title}>{title}</div>
        {Array.isArray(value) ? (
          <div className={style.content}>
            {value.map((item, index) => (
              <div key={item} className={style.contentItem}>
                {item}
                {index !== value.length - 1 && '、'}
              </div>
            ))}
          </div>
        ) : (
          <div className={style.content}>{value}</div>
        )}
      </div>
    );
  };

  const FilterComp = () => {
    const type = strategy.triggerCondition?.conditionContent?.emailOpType === 2 ? getIn18Text('WEIDAKAI') : getIn18Text('DAKAIWEIHUIFUv16');
    const value = `用户${strategy.triggerCondition?.conditionContent?.emailOpDays}日${type}, 系统自动发送以下邮件`;
    return ContentComp(getIn18Text('SHAIXUANTIAOJIAN'), value);
  };

  const MailSubjectsComp = () => {
    if (strategy.sendSettingInfo?.emailSubjects?.length === 0) {
      return null;
    }
    return (
      <div className={style.contentArea}>
        <div className={style.title}>{'邮件主题'}</div>
        {strategy.sendSettingInfo.emailSubjects?.map((item, index) => {
          const prefix = `主题${index + 1}：`;
          return (
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <div className={style.content} style={{ flexShrink: '0' }}>
                {prefix}
              </div>
              <div className={style.content}>{item.subject}</div>
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    if (strategy.contentEditInfo.emailContent && contentRef.current) {
      contentRef.current.innerHTML = strategy.contentEditInfo.emailContent;
    }
  }, [strategy.contentEditInfo.emailContent]);

  const MailContentComp = () => {
    return (
      <div className={style.contentArea}>
        <div className={style.title}>{'邮件内容'}</div>
        {/* <div className={style.content} style={{ display: 'inline-block' }} dangerouslySetInnerHTML={{ __html: getMailContentText(strategy.contentEditInfo.emailContent || '') }} /> */}
        <div className={style.content} ref={contentRef} style={{ display: 'inline-block' }}></div>
      </div>
    );
  };

  return (
    <Drawer
      zIndex={9999}
      visible={visiable}
      onClose={onClose}
      destroyOnClose
      contentWrapperStyle={{ width: '468px' }}
      className={style.edmSetting}
      title={'营销详情'}
      footer={
        <div className={style.edmSettingFooter}>
          <Button
            onClick={() => {
              onEdit(strategy);
            }}
          >
            编辑
          </Button>
          <Button
            type="primary"
            onClick={() => {
              onClose();
            }}
          >
            关闭
          </Button>
        </div>
      }
    >
      <div className={style.detailContent}>
        {FilterComp()}
        {MailSubjectsComp()}
        {strategy.sendSettingInfo.sender && ContentComp(getIn18Text('FAJIANRENNICHENG'), strategy.sendSettingInfo.sender)}
        {strategy.sendSettingInfo.ccInfos &&
          strategy.sendSettingInfo.ccInfos?.length > 0 &&
          ContentComp(getIn18Text('CHAOSONGREN'), strategy.sendSettingInfo.ccInfos[0].email)}
        {strategy.sendSettingInfo.senderEmails && ContentComp(getIn18Text('FAJIANDEZHI'), strategy.sendSettingInfo.senderEmails)}
        {strategy.sendSettingInfo.replyEmail && ContentComp(getIn18Text('HUIFUYOUXIANG'), strategy.sendSettingInfo.replyEmail)}
        {ContentComp(getIn18Text('YOUJIANZHAIYAO'), strategy.sendSettingInfo.emailSummary || '--')}
        {MailContentComp()}
      </div>
    </Drawer>
  );
};
