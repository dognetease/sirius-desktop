import React, { useState, useRef, useMemo, useEffect, useImperativeHandle, CompositionEvent, useCallback } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';
import { Button, Menu, Dropdown, Tooltip } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apis, apiHolder as api, MailApi, MailEntryModel, SystemApi, MailEmoticonInfoModel, inWindow, DataTrackerApi, util } from 'api';
import classnames from 'classnames';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { getPositionForTextArea, setCursorPosition, setCurrentAccount, isMainAccount } from '../../util';
import SendErrorContect from '@web-mail-write/components/SendMail/SendErrorContect';
import './index.scss';
import { MailActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { joinWebmailActivity } from '@web-common/components/util/webmail-util';
import InputContextMenu from '@web-common/components/UI/InputContextMenu/InputContextMenu';

import NoticeModal from '../ThumbUp/NoticeModal';
import { getIn18Text } from 'api';
interface Props {
  mid: string;
  mailContent: MailEntryModel;
  emoticonInfo: MailEmoticonInfoModel | undefined;
  handleEmoticon(data: MailEmoticonInfoModel, mid: string): void;
}
interface PriorityPhase {
  text: string;
  priority: number;
}
const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const QuickRespondPhraseKey = 'QuickRespondPhraseKey';
const SpecialChar = ['?', '？', ',', '，', '!', '！', ';', '；', '.', '。', ''];
const Reply: React.FC<Props> = React.forwardRef(({ mid, mailContent, emoticonInfo, handleEmoticon }: Props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<any>();
  // const replyText = [
  //   '好的',
  //   '收到',
  //   '太棒了',
  //   '谢谢',
  // ];
  const DefaultInputText: PriorityPhase[] = [
    {
      text: getIn18Text('HAODE'),
      priority: 100,
    },
    {
      text: getIn18Text('SHOUDAO'),
      priority: 99,
    },
    {
      text: getIn18Text('TAIBANGLE'),
      priority: 98,
    },
    {
      text: getIn18Text('XIEXIE'),
      priority: 97,
    },
    {
      text: 'OK',
      priority: 96,
    },
    {
      text: getIn18Text('XINKULE'),
      priority: 95,
    },
    {
      text: getIn18Text('HEZUOYUKUAI'),
      priority: 94,
    },
    {
      text: getIn18Text('TONGYI'),
      priority: 93,
    },
  ];
  // const inputText = ['好的', '收到', '太棒了', '谢谢', 'OK', '辛苦了', '合作愉快', '没问题', '同意', '嗯嗯'];
  const [inputText, setInputText] = useState<PriorityPhase[]>([]);
  const [startCursor, setStartCursor] = useState<number>(0); // textarea的值set之后会设置光标
  const [content, setContent] = useState<string>('');
  const [currentMail, setCurrentMail] = useState<any>();
  const { doReplyChangeExpanded: setIsExpandId } = useActions(MailActions);
  const replyExpandedId = useAppSelector(state => state.mailReducer.replyExpandedId);
  // const [isExpand, setIsExpandId] = useState<boolean>(false);
  const [isReplyAll, setIsReplyAll] = useState<boolean>(true);
  const [contactText, setContactText] = useState<string>('');
  const [receiverNum, setReceiverNum] = useState<number>();
  const systemApi = api.api.getSystemApi() as SystemApi;
  const [replyBtnLoading, setReplyBtnLoading] = useState(false);
  // 错误弹框
  const [visibleErrorContect, setVisibleErrorContect] = useState(false);
  const [errorMsg, setErrorMsg] = useState({});
  const receiverMemo = useMemo(() => mailContent?.receiver, [visibleErrorContect]);
  const currentUser = systemApi.getCurrentUser();
  const [isHasThumbUp, setIsHasThumbUp] = useState<boolean>(false);
  // 当前请求回复的id
  const [locakReplyMailId, setLockReplyMailId] = useState<string>('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  // thumbUpNotice默认为 true， thumbUpSend默认为false
  const [thumbUpNotice, setThumbUpNotice] = useState<boolean>(!(inWindow() && window.localStorage.getItem('thumbUpNotice'))); // 已读提醒新功能tip
  const [thumbUpSend, setThumbUpSend] = useState<boolean>(inWindow() && window.localStorage.getItem('thumbUpSend') === '1'); // 已读提醒新功能tip
  // const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  const isMainAcc = useMemo(() => {
    return isMainAccount(mailContent?._account);
  }, [mailContent]);
  // 处在拼音输入法的输入中
  const isComposition = useRef(false);

  /**
   *
   */
  useEffect(() => {
    try {
      const _inputTextString = window.localStorage.getItem(QuickRespondPhraseKey);
      const _inputText = JSON.parse(_inputTextString);
      if (Array.isArray(_inputText)) {
        setInputText(_inputText);
      } else {
        setInputText(DefaultInputText);
        window.localStorage.setItem(QuickRespondPhraseKey, JSON.stringify(DefaultInputText));
      }
    } catch (error) {
      setInputText(DefaultInputText);
    }
  }, [mid]);
  useEffect(() => {
    try {
      const hasThumbUp = emoticonInfo?.involvedRecords?.filter(item => item.acc_email === currentUser?.id);
      setIsHasThumbUp(hasThumbUp && hasThumbUp.length > 0 ? true : false);
    } catch (error) {
      console.log('error');
    }
  }, [emoticonInfo]);
  useImperativeHandle(ref, () => ({
    update: () => {
      setIsExpandId('');
    },
  }));
  const changeReplyAll = isAll => {
    message.success({
      content: `已切为“回复${isAll ? getIn18Text('QUANBU') : ''}”`,
    });
    setIsReplyAll(isAll);
  };
  const getRenderDom = React.useCallback(() => containerRef.current || document.body, [containerRef.current]);
  const menu = () => (
    <Menu selectedKeys={[isReplyAll ? '2' : '1']} className="u-reply-tooltip-menu">
      <Menu.Item
        key="1"
        onClick={() => {
          changeReplyAll(false);
        }}
      >
        <span className="u-reply">
          <ReadListIcons.ReplySvgCof color={isReplyAll ? '#262A33' : '#386EE7'} />
        </span>
        <span className="u-status-menu-text menu" style={{ color: isReplyAll ? '#262A33' : '#386EE7' }}>
          {getIn18Text('HUIFU')}
        </span>
      </Menu.Item>
      <Menu.Item key="2" onClick={() => changeReplyAll(true)}>
        <span className="u-reply">
          <ReadListIcons.ReplyAllSvgCof color={isReplyAll ? '#386EE7' : '#262A33'} />
        </span>
        <span className="u-status-menu-text menu" style={{ color: isReplyAll ? '#386EE7' : '#262A33' }}>
          {getIn18Text('HUIFUQUANBU')}
        </span>
      </Menu.Item>
    </Menu>
  );
  const onInputChange = e => {
    const position = getPositionForTextArea(textRef.current);
    setStartCursor(position.start);
    if (!isComposition.current) {
      setContent(e.target.value);
    }
  };
  const onInputText = (item: string) => {
    const position = getPositionForTextArea(textRef.current);
    const cursorBeforeChar = content[position.start - 1] || '';
    const _item = SpecialChar.includes(cursorBeforeChar) ? item : `，${item}`;
    // eslint-disable-next-line max-len
    const str = content?.substring(0, position.start) + _item + content?.substring(position.start, content.length);
    setContent(str);
    // setStartCursor(position.start + item.length);
    setStartCursor(str?.length);
    setIsExpandId(mid);
  };
  const handlePriorityChange = (text: string) => {
    try {
      const phrasesString = window.localStorage.getItem(QuickRespondPhraseKey);
      const phrases = JSON.parse(phrasesString);
      const targetIndex = phrases.findIndex(item => item.text === text);
      phrases[targetIndex].priority = Date.now();
      window.localStorage.setItem(QuickRespondPhraseKey, JSON.stringify(phrases));
    } catch (error) {
      //
    }
  };
  const saveTempText = () => {
    // setCurrentAccount(mailContent?._account);
    mailApi.doSaveMailInitParamLocal({ ...currentMail, originContent: content, _account: mailContent?._account });
  };
  const onInputBlur = () => {
    saveTempText();
  };
  const replyMail = async () => {
    setReplyBtnLoading(true);
    // setCurrentAccount(mailContent?._account);
    const param = await mailApi.doReplayMail(mid, isReplyAll, true, content, mailContent?._account);
    // setCurrentAccount(mailContent?._account);
    mailApi
      .doFastSend(param)
      .then(({ errMsg, entry }) => {
        if (errMsg) {
          setErrorMsg(errMsg);
          setVisibleErrorContect(true);
          return;
        }
        // 快捷回复成功
        // 信件发送成功后，校验活动
        const { tid = '' } = entry;
        joinWebmailActivity(tid);
        message.success({
          content: getIn18Text('FASONGCHENGGONG'),
        });
        setContent('');
        setIsExpandId('');
      })
      .finally(() => {
        setTimeout(() => {
          setReplyBtnLoading(false);
        }, 1000);
      });
  };
  // 转发邮件
  const handleReward = () => {
    // setCurrentAccount(mailContent?._account); 发信统一处理
    mailApi.doForwardMail(mid, { _account: mailContent?._account });
    // mailApi.doForwardMail(mid).then(param => mailApi.callWriteLetterFunc(param));
  };
  const closeSendMailModal = async (isNotice: boolean, isSend: boolean) => {
    setNoticeVisible(false);
    if (isNotice) {
      setThumbUpNotice(false);
      inWindow() && window.localStorage.setItem('thumbUpNotice', '1');
      setThumbUpSend(isSend);
      inWindow() && window.localStorage.setItem('thumbUpSend', isSend ? '1' : '0');
    }
    if (isSend) {
      replyExternalMail();
    }
  };
  const replyExternalMail = async () => {
    // setCurrentAccount(mailContent?._account);
    const { errMsg } = await mailApi.replyExternalThumbMail(mid, false, true, mailContent?._account);
    if (errMsg) {
      return;
    }
    message.success({
      content: getIn18Text('DIANZANYOUJIANYI'),
    });
  };
  const changeThumbState = () => {
    let params = {
      email_tid: mailContent?.entry?.tid || '',
      // email_tid: '',
      email_mid: mailContent?.id,
      type: 1,
      participated: !emoticonInfo?.participated,
      email_title: mailContent?.entry?.title || getIn18Text('WUZHUTI'),
      sender_email: mailContent?.sender?.contact?.contact?.accountName,
      sender_mid: mailContent?.entry?.sentMailId,
      _account: mailContent?._account,
    };
    // 点赞和取消点赞
    !emoticonInfo?.participated ? trackApi.track('pcMail_click_likeMail') : trackApi.track('pcMail_click_cancelLikeMail');
    // setCurrentAccount(mailContent?._account);
    mailApi.setThumbUpCreate(params).then(data => {
      handleEmoticon(data, params.email_mid);
      // sender_is_internal
      if (data && !data.sender_is_internal && data?.participated && data?.first_participated) {
        // 默认是true
        if (thumbUpNotice) {
          setNoticeVisible(true);
        }
        // 默认是不发送 /false
        if (thumbUpSend) {
          replyExternalMail();
        }
      }
    });
  };
  const handleToWrite = async () => {
    setIsExpandId('');
    // setCurrentAccount(mailContent?._account);
    const param = await mailApi.doReplayMail(mid, isReplyAll, true, content, mailContent?._account);
    mailApi.callWriteLetterFunc(param);
  };
  // 缺少第二次发送的逻辑
  const errorContectResend = errorMsg => {
    console.log('errorMsg', errorMsg);
  };
  // const addEvent = (el: MouseEvent) => {
  //   // 单击菜单
  //   if (menuRef && menuRef.current && findDOMNode(menuRef.current).contains(el.target)) {
  //     return;
  //   }
  //   // 聚合邮件会重复渲染多个快捷回复组件，必须遍历判断
  //   const inReply = Array.prototype.some.call(document.getElementsByClassName('m-reply'), element => element.contains(el.target));
  //   if (!inReply) {
  //     setIsExpandId(false);
  //   }
  // };
  // useEffect(() => {
  //   setCursorPosition(textRef.current, startCursor);
  // }, [content]);
  useEffect(() => {
    if (mid && replyExpandedId == mid && textRef.current) {
      textRef.current.focus();
      setCursorPosition(textRef.current, content.length);
    }
  }, [replyExpandedId, mid]);
  const handleMailReply = async () => {
    // setCurrentAccount(mailContent?._account);
    // todo-zpy: 不确认这块有什么问题
    let mail = mailApi.doLoadMailInitParamLocal(mid);
    if (!mail) {
      // setCurrentAccount(mailContent?._account);
      mail = await mailApi.doReplayMail(mid, isReplyAll, true, '', mailContent?._account);
    }
    setCurrentMail(mail);
    setContent(mail.originContent || '');
    // setCurrentAccount(mailContent?._account);
    mailApi.doGetReplayContentModel(mail).then(data => {
      const _id = mailContent?._account;
      // systemApi.getCurrentUser()?.id;
      const str: string[] = [];
      if (data.receiver) {
        data.receiver.forEach(item => {
          // str.push((item.contact.contact.accountName === _id) ? '我' : item.contact.contact.contactName);
          if (item?.contact?.contact?.accountName !== _id) {
            // 过滤掉自己
            str.push(item?.contact?.contact?.contactName);
          }
        });
        setContactText(str.join('、'));
        setReceiverNum(data?.receiver.filter(item => item?.contact?.contact?.accountName !== _id).length);
        if (data.receiver.length <= 1) {
          setIsReplyAll(false);
        }
      }
    });
  };
  // useEffect(() => {
  //   if (mid && !util.extractPathFromCid(mid)) {
  //     handleMailReply();
  //   }
  // }, [mid]);
  useEffect(() => {
    if (mid != locakReplyMailId) {
      setLockReplyMailId('');
    }
  }, [mid]);
  const loadMailReply = () => {
    if (mid && mid != locakReplyMailId && !util.extractPathFromCid(mid)) {
      setLockReplyMailId(mid);
      handleMailReply();
    }
  };
  // const onCompositionStart = () => {
  //   isComposition.current = true;
  // };
  // const onCompositionEnd = (e: CompositionEvent<HTMLTextAreaElement>) => {
  //   isComposition.current = false;
  //   setContent((e.target as HTMLTextAreaElement).value);
  // };
  // 监听快捷回复的区域点击，并打点
  const handleReplyPanelClick = useCallback(() => {
    trackApi.track('pcMail_click_quickReplyInputBox_mailDetailPage');
  }, []);
  // useEffect(() => {
  //   // document.documentElement.addEventListener('click', addEvent);
  //   // return () => {
  //   //   document.documentElement.removeEventListener('click', addEvent);
  //   // };
  // }, []);
  return (
    <OutsideClickHandler
      useCapture
      onOutsideClick={e => {
        const targetText = e.target?.innerText;
        const ignoreList = [getIn18Text('FUZHI'), getIn18Text('JIANQIE'), getIn18Text('ZHANTIE')];
        if (replyExpandedId === mid && !ignoreList.includes(targetText)) {
          setIsExpandId('');
        }
      }}
    >
      <div className="m-reply" ref={containerRef} data-test-id="quick-reply-wrap">
        <div className="u-reply-text" hidden={replyExpandedId != mid}>
          {inputText.length > 0 &&
            inputText
              .sort((a, b) => b.priority - a.priority)
              .map(({ text }) => (
                <span
                  onClick={() => {
                    handlePriorityChange(text);
                    onInputText(text);
                  }}
                  key={text}
                  className="text"
                >
                  {text}
                </span>
              ))}
        </div>
        <div className="u-reply-textarea" hidden={replyExpandedId != mid}>
          {/* <textarea className="textarea" ref={textRef} onCompositionStart={onCompositionStart} onCompositionEnd={onCompositionEnd} onChange={onInputChange} onBlur={onInputBlur} defaultValue={content} /> */}
          <InputContextMenu inputOutRef={textRef} changeVal={setContent}>
            <textarea className="textarea" ref={textRef} onChange={onInputChange} onBlur={onInputBlur} value={content} />
          </InputContextMenu>
          <Tooltip getPopupContainer={getRenderDom} title={getIn18Text('DAKAIWANZHENGHUI')} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
            <div className="u-reply-expand" onClick={() => handleToWrite()}>
              <ReadListIcons.EditorSvg />
            </div>
          </Tooltip>
        </div>
        <div className="u-reply">
          <div
            className={classnames(['u-reply-input', replyExpandedId === mid ? 'expand' : ''])}
            // eslint-disable-next-line no-nested-ternary
            // corp无点赞按钮，需要减去48px
            style={{
              maxWidth:
                replyExpandedId != mid
                  ? `calc(100% - ${96 - (isCorpMail ? 48 : 0)}px)`
                  : isReplyAll
                  ? `calc(100% - ${128 - (isCorpMail ? 48 : 0)}px)`
                  : `calc(100% - ${106 - (isCorpMail ? 48 : 0)}px)`,
            }}
          >
            <Dropdown getPopupContainer={getRenderDom} overlayClassName="u-tree-dropmenu" overlay={menu} trigger={['contextMenu', 'click']}>
              <Tooltip
                getPopupContainer={getRenderDom}
                title={isReplyAll ? getIn18Text('HUIFUQUANBU') : getIn18Text('HUIFU')}
                mouseLeaveDelay={0.15}
                trigger={['hover', 'click']}
              >
                <div className="u-reply-menu">
                  <span className="dark-svg-invert u-reply-menu-reply">{isReplyAll ? <ReadListIcons.ReplyAllSvgCof /> : <ReadListIcons.ReplySvgCof />}</span>
                  <span className="dark-svg-invert u-reply-menu-xiala">
                    <ReadListIcons.XialaSvg />
                  </span>
                </div>
              </Tooltip>
            </Dropdown>
            <div
              className="u-reply-content"
              onClick={() => {
                setIsExpandId(mid);
                loadMailReply();
                handleReplyPanelClick();
              }}
            >
              <div className="u-reply-content-name">
                {content && replyExpandedId != mid
                  ? content
                  : `${getIn18Text('KUAIJIEHUIFU')}${isReplyAll ? getIn18Text('QUANBU') : ''}${
                      isReplyAll && replyExpandedId != mid ? '' : `：${isReplyAll ? contactText : mailContent?.sender?.contact?.contact?.contactName || ''}`
                    }`}
              </div>
              <div className="u-reply-content-more" hidden={receiverNum === undefined || receiverNum === 1 || replyExpandedId != mid || !isReplyAll}>
                {`${getIn18Text('GONG')}${receiverNum}${getIn18Text('REN&nbs')}`}
              </div>
            </div>
            <div className="u-reply-text u-reply-text-fast" hidden={replyExpandedId == mid || !!content}>
              {inputText.slice(0, 4).map(({ text }) => (
                <span
                  onClick={() => {
                    handlePriorityChange(text);
                    onInputText(text);
                    // const position = getPositionForTextArea(textRef.current);
                    // console.log('position', position);
                    // setStartCursor(100);
                  }}
                  key={text}
                  className="text"
                >
                  {text}
                </span>
              ))}
            </div>
          </div>
          <div className="u-reply-btn" hidden={replyExpandedId == mid} onClick={handleReward}>
            {getIn18Text('ZHUANFA')}
          </div>
          {!isCorpMail && isMainAcc ? (
            <div
              className="dark-svg-invert u-reply-btn u-reply-btn-svg"
              data-test-id="mail-quick-reply-like-btn"
              hidden={replyExpandedId == mid}
              onClick={changeThumbState}
            >
              {isHasThumbUp ? <ReadListIcons.hasThumbUpSvg /> : <ReadListIcons.unThumbUpSvg />}
            </div>
          ) : (
            <></>
          )}
          {!isCorpMail && isMainAcc ? (
            <div className="dark-svg-invert u-reply-btn-fast" data-test-id="mail-quick-reply-like-btn" onClick={changeThumbState} hidden={replyExpandedId != mid}>
              {isHasThumbUp ? <ReadListIcons.hasThumbUpSvg /> : <ReadListIcons.unThumbUpSvg />}
            </div>
          ) : (
            <></>
          )}
          <Button
            data-test-id="mail-quick-reply-btn"
            type="primary"
            className="u-send-btn"
            loading={replyBtnLoading}
            onClick={replyMail}
            hidden={replyExpandedId != mid}
            disabled={!content || replyBtnLoading}
            style={{ width: isReplyAll ? '80px' : '68px' }}
          >
            {isReplyAll ? getIn18Text('HUIFUQUANBU') : getIn18Text('HUIFU')}
          </Button>
        </div>
      </div>
      {visibleErrorContect && (
        <SendErrorContect
          visible={visibleErrorContect}
          setVisible={setVisibleErrorContect}
          receiver={receiverMemo}
          errorMsg={errorMsg}
          confirm={errorContectResend}
          hideReSend
        />
      )}

      {noticeVisible ? <NoticeModal visible={noticeVisible} onClose={(isNotice, isSend) => closeSendMailModal(isNotice, isSend)} /> : null}
    </OutsideClickHandler>
  );
});
export default Reply;
