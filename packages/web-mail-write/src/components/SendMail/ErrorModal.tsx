/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
import React, { useMemo } from 'react';
import { Button } from 'antd';
import style from './index.module.scss';
import WarnIcon from '@web-common/components/UI/Icons/svgs/WarnSvg';
import { apiHolder as api, getIn18Text } from 'api';
import { useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import { actions as mailTabActions } from '@web-common/state/reducer/mailTabReducer';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
const eventApi = api.api.getEventApi();

/* tslint-disable */
interface Props {
  cond?: string;
}
// eslint-disable-next-line max-statements
const ErrorModal: React.FC<Props> = (props: Props) => {
  const { cond } = props;
  const errModalData = useAppSelector(state => state.mailReducer.errModalData);
  const currentTabId = useAppSelector(state => state.mailTabReducer.currentTab.id);
  const mails = useAppSelector(state => state.mailReducer.mails);
  const currentMail = useAppSelector(state => state.mailReducer.currentMail);
  const tabList = useAppSelector(state => state.mailTabReducer.tabList);
  const dispatch = useAppDispatch();
  const isCurMail = useMemo(() => {
    if (!errModalData?.errModalMailId) return true;
    if ('innerWeb' === cond) {
      return errModalData?.errModalMailId === currentMail?.cid;
    }
    if ('mailBox' === cond) {
      return errModalData?.errModalMailId === currentTabId;
    }
    return true;
  }, [cond, currentMail, errModalData, currentTabId]);

  // 去查看邮件
  const toCheckMail = (checkMailId?: string) => {
    if (!checkMailId) return;
    dispatch(mailActions.doSetTooltipVisible(false));
    if ('mailBox' === cond) {
      if (mails.find(mail => mail.cid === checkMailId) && tabList.find(tab => tab.id === checkMailId)) {
        dispatch(mailTabActions.doChangeCurrentTab(checkMailId));
        dispatch(mailActions.doChangeCurrentMail(checkMailId));
      }
    }
    if ('innerWeb' === cond) {
      if (mails.find(mail => mail.cid === checkMailId)) {
        dispatch(mailActions.doChangeCurrentMail(checkMailId));
      }
    }
  };

  // 继续发送
  const continueSend = () => {
    eventApi.sendSysEvent({
      eventName: 'toSendMail',
      eventStrData: '',
      eventData: { sendMailId: errModalData?.errModalMailId, cond: 'continueSend' },
    });
  };

  return (
    <div
      className={`${style.modalBg}`}
      onClick={() => {
        dispatch(mailActions.doSetTooltipVisible(false));
      }}
    >
      <div
        className={`${style.modalContent}`}
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <div className={`${style.modalIcon}`}>
          <WarnIcon />
        </div>
        <div className={`${style.modalText}`}>
          <div className={`${style.title}`}>{errModalData?.errorText || ''}</div>
          <div className={`${style.errorDoc}`}>{errModalData?.errorDoc || ''}</div>
          <div className={`${style.btns}`}>
            <div />
            {/* only多标签下, 以及内联web场景内下，支持非当前邮件弹窗下的特殊提示 */}
            {!isCurMail ? (
              <div>
                <Button
                  className={`${style.cancel}`}
                  size="small"
                  onClick={() => {
                    dispatch(mailActions.doSetTooltipVisible(false));
                  }}
                >
                  {getIn18Text('ZHIDAOLE')}
                </Button>
                <Button className={`${style.save}`} size="small" onClick={() => toCheckMail && toCheckMail(errModalData?.errModalMailId)}>
                  {getIn18Text('QUCHAKAN')}
                </Button>
              </div>
            ) : (
              // 当前邮件弹窗
              <>
                {/* 简化模式 我知道了 */}
                {errModalData?.isSimpleTooltip ? (
                  <div>
                    <Button
                      className={`${style.save}`}
                      size="small"
                      onClick={() => {
                        dispatch(mailActions.doSetTooltipVisible(false));
                      }}
                    >
                      {getIn18Text('ZHIDAOLE')}
                    </Button>
                  </div>
                ) : (
                  // 复杂模式
                  <div>
                    <Button
                      className={`${style.cancel}`}
                      size="small"
                      onClick={() => {
                        dispatch(mailActions.doSetTooltipVisible(false));
                      }}
                    >
                      {getIn18Text('QUXIAO')}
                    </Button>
                    <Button
                      className={`${style.save}`}
                      size="small"
                      onClick={e => {
                        e.stopPropagation();
                        continueSend();
                      }}
                    >
                      {getIn18Text('JIXUFASONG')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="" />
      </div>
    </div>
  );
};
export default ErrorModal;
