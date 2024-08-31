/**
 * 自动回复提示
 *
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useActions, useAppSelector, AutoReplyActions } from '@web-common/state/createStore';

import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { getIn18Text, inWindow, AutoReplyApi, apiHolder as api, apis } from 'api';
const autoReplyApi = api.api.requireLogicalApi(apis.autoReplyApiImpl) as AutoReplyApi;
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';

interface props {}

const AutoReplyTips: React.FC<props> = (props: props) => {
  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2RM('mailSearching');
  // 邮件-搜索-是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);

  // 是否展示星标联系人是否在构建中-tip
  const [autoReplyTip, setAutoReplyTip] = useState<boolean>(false); // 已读提醒新功能tip

  const { updateAutoReplyDetail } = useActions(AutoReplyActions);

  const autoReplyDetail = useAppSelector(state => state.autoReplyReducer.autoReplyDetail);

  const closeAutoReplyTips = useCallback((e: any) => {
    setAutoReplyTip(false);
    inWindow() && window.localStorage.setItem('autoReplyTip', '1');
    e.stopPropagation();
  }, []);

  const closeAutoReply = useDebounceForEvent(() => {
    // setCurrentAccount();
    autoReplyApi
      .updateMailRulesByAutoReply({
        ...autoReplyDetail,
        disabled: true,
      })
      .then(suc => {
        if (suc) {
          // 仅仅临时关闭
          setAutoReplyTip(false);
          updateAutoReplyDetail({
            ...autoReplyDetail,
            disabled: true,
          });
          SiriusMessage.success({
            content: getIn18Text('YIGUANBIZIDONG'),
          });
        }
      })
      .catch(() => {
        SiriusMessage.error({
          content: getIn18Text('GUANBIZIDONGHUI11'),
        });
      });
  });

  useEffect(() => {
    const tips = inWindow() && window.localStorage.getItem('autoReplyTip');
    if (Object.keys(autoReplyDetail).length > 0 && !autoReplyDetail.disabled && !tips) {
      setAutoReplyTip(true);
    } else {
      setAutoReplyTip(false);
    }
  }, [autoReplyDetail]);

  /**
   * 自动回复提示
   */
  const AutoReplyMailListTip = useMemo(() => {
    const tips = inWindow() && window.localStorage.getItem('autoReplyTip');
    if (Object.keys(autoReplyDetail).length > 0 && !autoReplyDetail.disabled && !tips && !isSearching && autoReplyTip) {
      return (
        <div className="u-auto">
          <div className="u-auto-title">{getIn18Text('DANGQIANYIQIYONG')}</div>
          <div style={{ display: 'flex' }}>
            <span className="u-auto-text" onClick={closeAutoReply}>
              {getIn18Text('GUANBIZIDONGHUI')}
            </span>
            <div className="u-auto-btn" onClick={closeAutoReplyTips}></div>
          </div>
        </div>
      );
    }
    return <></>;
  }, [autoReplyDetail, isSearching, autoReplyTip]);

  return AutoReplyMailListTip;
};

export default AutoReplyTips;
