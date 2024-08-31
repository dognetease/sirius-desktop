import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { ModalProps, Skeleton, Modal } from 'antd';

import React, { useEffect, useState, useMemo } from 'react';
import { renderToString } from 'react-dom/server';
import { apiHolder, apis, EdmSendBoxApi, ResponseSendBoxCopy, EdmEmailInfo, MultipleContentInfo, ResponseDetailSubject } from 'api';
import { ReactComponent as ReplyHeaderHolder } from '@/images/icons/edm/replyheader.svg';
import { timeZoneMap } from '@web-common/utils/constant';
import IconCard, { IconMapKey } from '@web-common/components/UI/IconCard';
import { formatFileSize } from '@web-common/utils/file';

import style from './detail.module.scss';
import { timeFormat } from '../utils';
import { getIn18Text } from 'api';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
interface IViewEdmContent {
  id: string;
  info?: EdmEmailInfo | null;
  subjects?: ResponseDetailSubject;
  multi?: MultipleContentInfo;
  isLoop?: boolean;
}

const MaxShowCount = 50;

const headerHolderImg = renderToString(<ReplyHeaderHolder style={{ width: '100%', marginTop: '20px' }} />);

export const DetailContent = (props: IViewEdmContent & ModalProps) => {
  const { info, isLoop = false, multi, subjects, ...config } = props;
  const [data, setData] = useState<ResponseSendBoxCopy | null>(null);
  useEffect(() => {
    if (props.id && props.visible) {
      edmApi.copyFromSendBox({ edmEmailId: props.id }).then(data => {
        setData(data);
      });
    } else {
      setData(null);
    }
  }, [props.id, props.visible]);

  function prepareAttachmentsForSend(attachmentList: any[]) {
    if (attachmentList.length === 0) {
      return '';
    }

    const head = `<div><br/>普通附件(${attachmentList.length})</div>`;
    const body = attachmentList.map(a => {
      const size = formatFileSize(a.fileSize);
      let icon;
      const extName = String(a.fileName).split('.').pop() as IconMapKey;
      if (a.type === 0) {
        icon = renderToString(<IconCard type={extName} width={24} height={24} />);
      } else {
        icon =
          '<img width="24px" height="24px" src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/06/22/ca9bd44fe5cb439f99b8507c9c0d626d.png" border="0" title="云附件" showheight="24px" showwidth="24px" style="width: 24px; height: 24px;">';
      }
      return `<div class="netease-sirius-edm-attach" style="font-size: 14px; font-style: normal; font-variant-caps: normal; font-weight: normal; letter-spacing: normal; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: auto; word-spacing: 0px; -webkit-text-size-adjust: auto; -webkit-text-stroke-width: 0px; text-decoration: none; clear: both; margin-top: 1px; margin-bottom: 1px; font-family: verdana, Arial, Helvetica, sans-serif; border: 1px solid rgb(238, 238, 239); box-shadow: rgba(203, 205, 210, 0.3) 0px 5px 15px; border-top-left-radius: 6px; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-bottom-left-radius: 6px; color: rgb(38, 42, 51);">
            <div style="background-color: rgb(255, 255, 255); padding: 0px 12px; border-top-left-radius: 12px; border-top-right-radius: 12px; border-bottom-right-radius: 12px; border-bottom-left-radius: 12px; position: relative; background-position: initial initial; background-repeat: initial initial;"><div style="width: 24px; position: absolute; height: 40px; left: 16px; top: 4px;">
                <a href="${a.downloadUrl}">
                ${icon}
                </a>
            </div>
            <div style="padding-right: 32px; margin-left: 30px; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgba(38, 42, 51, 0.08); margin-top: 16px; padding-bottom: 16px;">
                <div style="margin-left: 4px;">
                    <div style="padding: 1px; font-size: 14px; line-height: 14px;">
                    <a href="${a.downloadUrl}" target="_blank" rel="noopener" download="${a.downloadUrl}" style="text-decoration: none; color: rgb(38, 42, 51); display: block;">
                        ${a.fileName}
                    </a>
                    </div>
                    <div style="padding: 1px; color: rgb(38, 42, 51); opacity: 0.4; font-size: 12px; margin-top: 4px;">${size}</div>
                    </div>
                </div>
                <a class="divNeteaseSiriusCloudAttachItem" href="${a.downloadUrl}" download="${a.downloadUrl}" style="text-decoration: none; display: block; font-size: 12px; line-height: 12px; position: absolute; right: 16px; top: 29px; margin-top: -14px; color: rgb(56, 110, 231);">下载</a>
                </div>
            </div>
        <br class="Apple-interchange-newline">`;
    });
    return head + '<div>' + body.join('') + '</div>';
  }

  function parseAttachments(str?: string) {
    try {
      return JSON.parse(str as string);
    } catch (e) {
      return [];
    }
  }
  const srcDoc = useMemo(() => {
    const attachments = (parseAttachments(data?.contentEditInfo.emailAttachment) || []).filter(v => v.type === 0);
    const attachmentHtml = prepareAttachmentsForSend(attachments);
    if (data?.replyEdmEmailId) {
      return `${data?.contentEditInfo.emailContent || ''} ${headerHolderImg} ${attachmentHtml}`;
    }
    return `${data?.contentEditInfo.emailContent || ''} ${attachmentHtml}`;
  }, [data]);
  const modalTitle = useMemo(() => data?.sendSettingInfo.edmSubject || getIn18Text('YOUJIANXIANGQING'), [data]);

  const TaskDetailComp = () => {
    if (!info) {
      return null;
    }
    return (
      <div className={style.section}>
        <div className={style.header}>{getIn18Text('RENWUXIANGQING')}</div>
        {!isLoop && info.sendModeDesc && <div className={style.text}>{`发送模式：${info.sendModeDesc}`}</div>}
        {info.senderEmail && (
          <div className={style.text}>
            {getIn18Text('FAJIANDEZHI：')}
            {info.senderEmail}
          </div>
        )}
        {info.replyEmail && (
          <div className={style.text}>
            {getIn18Text('HUIFUYOUXIANG：')}
            {info.replyEmail}
          </div>
        )}
        {StrategyComp()}
        {TimeComp()}
      </div>
    );
  };

  const guard = (item?: any) => {
    return !(item === undefined || item === null);
  };

  const StrategyComp = () => {
    let titles = new Array<string>();

    const smartSendOn = info?.sendStrategyOn ? getIn18Text('YIKAIQI') : getIn18Text('WEIKAIQI');
    const sendStrategyTitle = `安全发送（${smartSendOn}）`;
    if (info?.sendStrategyOn) {
      titles.push(sendStrategyTitle);
    }

    const secondTraceOn = guard(data?.secondSendInfo) ? getIn18Text('YIKAIQI') : getIn18Text('WEIKAIQI');
    const arr = data?.secondSendInfo?.saveInfos.map(item => {
      return item.sendSettingInfo?.edmSubject?.replace(data.sendSettingInfo.edmSubject + '-', '');
    });
    let secondTraceTitle = `多轮营销（${secondTraceOn}`;
    if (guard(data?.secondSendInfo)) {
      secondTraceTitle = secondTraceTitle + arr?.join('，');
    }
    secondTraceTitle = secondTraceTitle + '）';
    if (data?.secondSendInfo) {
      titles.push(secondTraceTitle);
    }

    const multiOn = guard(multi) ? getIn18Text('YIKAIQI') : getIn18Text('WEIKAIQI');
    const multiTitle = `千邮千面（${multiOn}）`;
    if (guard(multi)) {
      titles.push(multiTitle);
    }
    if (titles.length === 0) {
      return null;
    }
    return (
      <div className={style.text}>
        {getIn18Text('ZHINENGYINGXIAO：')}
        {titles.join('，')}
      </div>
    );
  };

  const TimeComp = () => {
    if (!info) {
      return null;
    }

    return (
      <div className={style.text}>
        {info.createTime && (
          <span className={style.line}>
            {getIn18Text('CHUANGJIANSHIJIAN：')}
            {timeFormat(info.createTime)}
          </span>
        )}
        {[0, 1, 2].includes(info.emailStatus) && info.sendTime && (
          <span className={style.line}>
            {getIn18Text('KAISHIFASONG：')}
            {timeZoneMap[info.sendTimeZone]?.split('：')[0]} {timeFormat(info.sendTime)}
          </span>
        )}
        {[0, 1].includes(info.emailStatus) && info.expectCompleteTime && (
          <span className={style.line}>
            {getIn18Text('YUJIWANCHENG：')}
            {timeFormat(info.expectCompleteTime)}
          </span>
        )}
        {[2].includes(info.emailStatus) && info.completeTime && (
          <span className={style.line}>
            {getIn18Text('FASONGWANCHENG：')}
            {timeFormat(info.completeTime)}
          </span>
        )}
      </div>
    );
  };

  const MailDetailComp = () => {
    let titles = new Array<string>();
    subjects?.emailSubjects.forEach((item, index) => {
      let t = `${index + 1}、${item.subject}；`;
      titles.push(t);
    });

    return (
      <div className={style.section}>
        <div className={style.header}>{getIn18Text('YOUJIANXIANGQING')}</div>
        <div className={style.recvArea}>
          <div className={style.text} style={{ flexShrink: '0' }}>
            {getIn18Text('YOUJIANZHUTI：')}
          </div>
          <div className={style.text}>{titles.join(' ')}</div>
        </div>
        {info?.emailSummary && (
          <div className={style.text}>
            {getIn18Text('YOUJIANZHAIYAO：')}
            {info?.emailSummary}
          </div>
        )}
        {ReceiverComp()}
        {CCComp()}
      </div>
    );
  };

  const MailContentComp = () => {
    return (
      <div className={style.section}>
        <div className={style.header}>{getIn18Text('YOUJIANZHENGWEN')}</div>
        <div dangerouslySetInnerHTML={{ __html: srcDoc }} />
      </div>
    );
  };

  const ReceiverComp = () => {
    let receivers = data?.receiverInfo.contactInfoList;
    if (receivers && receivers?.length > MaxShowCount) {
      receivers = receivers.slice(0, MaxShowCount - 1);
    }
    let emails = new Array<string>();
    receivers?.forEach(item => {
      emails.push(item.contactEmail);
    });

    return (
      <div className={style.recvArea}>
        <div className={style.text} style={{ flexShrink: '0' }}>
          {getIn18Text('SHOUJIANREN：')}
        </div>
        <div className={style.text}>{emails.join('，')}</div>
      </div>
    );
  };

  const CCComp = () => {
    let ccs = data?.sendSettingInfo.ccInfos;
    if (!ccs || ccs.length === 0) {
      return null;
    }
    if (ccs && ccs?.length > MaxShowCount) {
      ccs = ccs.slice(0, MaxShowCount - 1);
    }
    let emails = new Array<string>();
    ccs?.forEach(item => {
      emails.push(item.email);
    });

    return (
      <div className={style.text}>
        {getIn18Text('CHAOSONGREN：')}
        {emails.join('，')}
      </div>
    );
  };

  return (
    <SiriusModal title={modalTitle} {...config} destroyOnClose width={960} footer={null} closable={true} className="sirius-no-drag" wrapClassName={style.contentWrapper}>
      <Skeleton loading={!data}>
        <div className={style.detailContent}>
          {TaskDetailComp()}
          {MailDetailComp()}
          {MailContentComp()}
        </div>
      </Skeleton>
    </SiriusModal>
  );
};
