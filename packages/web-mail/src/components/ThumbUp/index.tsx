import React, { useState, useEffect } from 'react';
import './index.scss';
import { apis, apiHolder as api, MailApi as MailApiType, MailEmoticonInfoModel, MailEntryModel, inWindow, InvolvedRecordsModel, DataTrackerApi } from 'api';
import ThumbUpModal from '../ThumbUpModal';
import NoticeModal from './NoticeModal';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApiType;
interface Props {
  mid: string;
  emoticonInfo: MailEmoticonInfoModel;
  content: MailEntryModel;
  handleEmoticon(data: MailEmoticonInfoModel, mid: string): void;
}
const ThumbUp: React.FC<Props> = ({ mid, content, emoticonInfo, handleEmoticon }) => {
  const [visible, setVisible] = useState(false);
  const [noticeVisible, setNoticeVisible] = useState(false);
  // thumbUpNotice默认为 true， thumbUpSend默认为false
  // todo: storage没有走多用户机制
  const [thumbUpNotice, setThumbUpNotice] = useState<boolean>(!(inWindow() && window.localStorage.getItem('thumbUpNotice'))); // 已读提醒新功能tip
  const [thumbUpSend, setThumbUpSend] = useState<boolean>(inWindow() && window.localStorage.getItem('thumbUpSend') === '1'); // 已读提醒新功能tip
  const [showNickNames, setShowNickNames] = useState<InvolvedRecordsModel[]>([]);
  const [hideCount, setHideCount] = useState<number>(0);
  const changeThumbState = () => {
    // 第三方 且是点赞 且不是第一次
    let params = {
      email_tid: content?.entry?.tid || '',
      email_mid: content.id,
      type: 1,
      participated: !emoticonInfo?.participated,
      email_title: content?.entry?.title,
      sender_email: content?.sender?.contact?.contact?.accountName,
      sender_mid: content?.entry?.sentMailId,
      _account: content?._account,
    };
    !emoticonInfo?.participated ? trackApi.track('pcMail_click_likeMail') : trackApi.track('pcMail_click_cancelLikeMail');
    MailApi.setThumbUpCreate(params).then(data => {
      handleEmoticon(data, params.email_mid);
      if (data && !data.sender_is_internal && data?.participated && data?.first_participated) {
        if (thumbUpNotice) {
          setNoticeVisible(true);
        }
        if (thumbUpSend && emoticonInfo.first_participated) {
          replyMail();
        }
      }
    });
  };
  const replyMail = async () => {
    const { errMsg } = await MailApi.replyExternalThumbMail(mid, false, true);
    if (errMsg) {
      return;
    }
    message.success({
      content: getIn18Text('DIANZANYOUJIANYI'),
    });
  };
  const setInfoModal = () => {
    trackApi.track('pcMail_click_likeMailDetail');
    setVisible(true);
  };
  const closeSendMailModal = (isNotice: boolean, isSend: boolean) => {
    setNoticeVisible(false);
    if (isNotice) {
      setThumbUpNotice(false);
      inWindow() && window.localStorage.setItem('thumbUpNotice', '1');
      setThumbUpSend(isSend);
      inWindow() && window.localStorage.setItem('thumbUpSend', isSend ? '1' : '0');
    }
    if (isSend) {
      replyMail();
    }
  };
  const getTextWidth = (fontSize: string, fontFamily: string, text: string) => {
    var span = document.createElement('span');
    var result = { width: 0 };
    result.width = span.offsetWidth;
    span.style.visibility = 'hidden';
    span.style.fontSize = fontSize;
    span.style.fontFamily = fontFamily;
    span.style.fontStyle = 'normal';
    span.style.display = 'inline-block';
    document.body.appendChild(span);
    if (typeof span.textContent != 'undefined') {
      span.textContent = text;
    } else {
      span.innerText = text;
    }
    result.width = parseInt(window.getComputedStyle(span).width) - result.width;
    span.remove();
    return result;
  };
  const renderNames = (showNickNames: InvolvedRecordsModel[]) => {
    return (
      <>
        {showNickNames &&
          showNickNames.map((record, i, arr) => {
            if (arr.length - 1 === i) {
              return <span key={record.acc_id}>{record.nick_name_slice || record.nick_name || record.acc_email}</span>;
            } else {
              return (
                <>
                  <span key={record.acc_id}>{record.nick_name_slice || record.nick_name || record.acc_email}</span> <span>、</span>
                </>
              );
            }
          })}
      </>
    );
  };
  useEffect(() => {
    if (emoticonInfo?.involvedRecords && emoticonInfo?.involvedRecords.length > 0) {
      let personWidth: number = 0;
      if (document.querySelector('.u-read-wrapper')) {
        // personWidth = document.querySelector('.thumb-up')?.clientWidth as number;
        personWidth = document.querySelector('.u-read-wrapper')?.clientWidth as number;
        personWidth = personWidth - 16 * 4;
      }
      let showNames: InvolvedRecordsModel[] = [];
      let totalWidth = 0;
      emoticonInfo?.involvedRecords.map((record, i) => {
        if (record.nick_name.length > 10) {
          record.nick_name_slice = record.nick_name.slice(0, 10) + '...';
        }
        const textAttr = getTextWidth('12px', 'PingFang SC', record.nick_name_slice || record.nick_name || record.acc_email);
        // 12为、的宽度， 3 为名字多余的宽度
        totalWidth = totalWidth + textAttr.width + 12 + 3;
        // console.log('thumb-up=====', personWidth, textAttr.width, i, totalWidth);
        if (totalWidth < personWidth - 100) {
          showNames.push(record);
        }
      });
      setShowNickNames(showNames);
      // 总数-展示的数目
      setHideCount(emoticonInfo.count - showNames.length);
      // setHideCount(emoticonInfo.involvedRecords.length - showNames.length)
    }
  }, [emoticonInfo]);
  return (
    <>
      <div className="thumb-up">
        <div
          className="thumb-up-icon"
          onClick={e => {
            e.stopPropagation();
            changeThumbState();
          }}
        ></div>

        <div
          className="thumb-up-person"
          onClick={e => {
            e.stopPropagation();
            setInfoModal();
          }}
        >
          {
            <>
              <span>{renderNames(showNickNames)}</span>
              <span className="thumb-up-person-more" hidden={hideCount === 0}>
                +{hideCount}
                {getIn18Text('REN')}
              </span>
            </>
          }
        </div>
      </div>
      {visible ? (
        <ThumbUpModal
          onClose={() => setVisible(false)}
          visible={visible}
          content={content}
          involvedRecords={emoticonInfo?.involvedRecords || []}
          count={emoticonInfo.count}
        />
      ) : null}
      {noticeVisible ? <NoticeModal visible={noticeVisible} onClose={(isNotice, isSend) => closeSendMailModal(isNotice, isSend)} /> : null}
    </>
  );
};
export default ThumbUp;
