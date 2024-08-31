import React, { useState, useEffect, useRef } from 'react';
import { apis, apiHolder as api, MailApi } from 'api';
import CloseSvg from '@web-common/components/UI/Icons/svgs/CloseSvg';
import CloseMailIcon from '@web-common/components/UI/Icons/svgs/CloseMailSvg';
import FoldIcon from '@web-common/components/UI/Icons/svgs/FoldIcon';
import ReplyIcon from '@web-common/components/UI/Icons/svgs/ReplySvg';
import ReplyAllIcon from '@web-common/components/UI/Icons/svgs/ReplyAllSvg';
import TransmitIcon from '@web-common/components/UI/Icons/svgs/TransmitSvg';
import WriteLetterIcon from '@web-common/components/UI/Icons/svgs/WriteLetterSvg';
import './Header.scss';
import NeedTempDialog from '../../../NeedTempDialog';
import { MailActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { actions } from '@web-common/state/reducer/mailReducer';
import useReupload from '@web-mail-write/components/SendMail/useReupload';
import { getIn18Text } from 'api';
const WebHeader: React.FC = () => {
  const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
  const { currentMail, mails } = useAppSelector(state => state.mailReducer);
  const currentMailId = currentMail.cid;
  const initSenderStr = currentMail.initSenderStr;
  const dispatch = useAppDispatch();
  const { doClearAllMails, doCloseMail, doChangeCurrentMail } = actions;
  const [needSaveMails, setNeedSaveMails] = useState([currentMail]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const curMails = useRef(mails);
  const [closeType, setCloseType] = useState('');
  const [closeMailcid, setCloseMailcid] = useState('');
  const { clearMidFile } = useReupload();
  const clickTab = (item: any) => {
    dispatch(doChangeCurrentMail(item.cid));
  };
  const iconMap: any = {
    reply: <ReplyIcon className="tab-icon" />,
    replyAll: <ReplyAllIcon className="tab-icon" />,
    forward: <TransmitIcon className="tab-icon" />,
    common: <WriteLetterIcon className="tab-icon" />,
  };
  useEffect(() => {
    window.onbeforeunload = () => {
      const needSave = curMails.current.filter(mail => mailApi.doNeedSaveTemp(mail));
      if (needSave.length > 0) {
        return getIn18Text('NINQUEDINGYAOLI');
      }
    };
    return () => {
      window.onbeforeunload = () => {};
    };
  }, []);
  useEffect(() => {
    curMails.current = mails;
  }, [mails]);

  // 清除服务端composeid & 清除写信本地缓存的附件
  const doCancelCompose = (cid: string) => {
    mailApi.doCancelCompose(cid, false, initSenderStr);
    clearMidFile(cid);
  };

  // 关闭/隐藏全部
  const closeMail = (type: string) => {
    if (type === 'hide') {
      dispatch(MailActions.doShowWebWrite(false));
      return;
    }
    // 关闭关闭
    if (type === 'close') {
      const needSave = mails.filter(mail => mailApi.doNeedSaveTemp(mail));
      if (needSave.length > 0) {
        setCloseType('');
        setNeedSaveMails(needSave);
        setIsModalVisible(true);
        return;
      }
      dispatch(doClearAllMails());
      mails.filter(mail => doCancelCompose(mail.cid as string));
    }
  };
  const onNotSave = () => {
    if (closeType === 'tab') {
      dispatch(doCloseMail(closeMailcid));
      doCancelCompose(closeMailcid);
      return;
    }
    dispatch(doClearAllMails());
    mails.filter(mail => doCancelCompose(mail.cid as string));
  };
  const comfirmSave = () => {};
  const closeTab = (item, e) => {
    e.stopPropagation();
    const needSave = mailApi.doNeedSaveTemp(currentMail);
    // const needSave = true;
    setCloseMailcid(item.cid);
    if (needSave) {
      setCloseType('tab');
      setNeedSaveMails([currentMail]);
      setIsModalVisible(true);
      return;
    }
    dispatch(doCloseMail(item.cid));
    // mailApi.doCancelCompose(item.cid);
    doCancelCompose(item.cid);
  };
  const onSave = saveSuccess => {
    if (closeType === 'tab') {
      dispatch(doCloseMail(closeMailcid));
      if (!saveSuccess) {
        // mailApi.doCancelCompose(closeMailcid);
        doCancelCompose(closeMailcid);
      }
      return;
    }
    if (!saveSuccess) {
      // mails.filter(mail => mailApi.doCancelCompose(mail.cid));
      mails.filter(mail => doCancelCompose(mail.cid as string)); // 清除后端session
    }
    dispatch(doClearAllMails());
  };
  return (
    <div className="header handle">
      <div className="tabs-box">
        {mails.map(item => (
          <div
            className={`tab ${item.cid === currentMailId ? 'active' : ''}`}
            key={item.cid}
            onClick={() => {
              clickTab(item);
            }}
            style={{ width: `calc((100% - 120px)/${mails.length - 1})` }}
          >
            <div className="tab-text">
              <span className="tab-item">
                {iconMap[item.entry.writeLetterProp]}
                {item.entry.title || getIn18Text('WUZHUTI')}
              </span>
            </div>
            {item.cid === currentMailId && mails.length > 1 ? (
              <div
                className="tab-close-icon"
                onClick={e => {
                  closeTab(item, e);
                }}
              >
                <CloseSvg />
              </div>
            ) : (
              ''
            )}
          </div>
        ))}
      </div>
      <div className="operate">
        <div className="handle" />
        <div className="operate-box">
          <div
            onClick={() => {
              closeMail('hide');
            }}
          >
            <FoldIcon />
          </div>
          <div
            onClick={() => {
              closeMail('close');
            }}
          >
            <CloseMailIcon />
          </div>
        </div>
      </div>
      <NeedTempDialog
        isModalVisible={isModalVisible}
        onNotSave={() => {
          onNotSave();
        }}
        onSave={saveSuccess => {
          onSave(saveSuccess);
        }}
        needSaveMails={needSaveMails}
        setIsModalVisible={val => {
          setIsModalVisible(val);
        }}
      />
    </div>
  );
};
export default WebHeader;
