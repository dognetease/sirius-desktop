/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
import React, { useState, useEffect } from 'react';
import { Tooltip, Checkbox } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
import style from './index.module.scss';
import { ReactComponent as IconWarn } from '@/images/icons/icon-warn.svg';
import { useAppDispatch } from '@web-common/state/createStore';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import { useAppSelector } from '@web-common/state/createStore';
import { apiHolder, NIMApi, apis, inWindow } from 'api';
import { getIn18Text } from 'api';

const nimApi = apiHolder.api.requireLogicalApi(apis.imApiImpl) as unknown as NIMApi;

/* tslint-disable */
interface Props {}
// eslint-disable-next-line max-statements
const ReadRemindComp: React.FC<Props> = (props: Props) => {
  let {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();
  const curAccount = useAppSelector(state => state.mailReducer.currentMail?.optSender);
  const readRemind = useAppSelector(state => state.mailReducer.currentMail.senderReceivers);
  const isMainAccount = curAccount?.isMainAccount; // 是主账号还是挂载账号
  const dispatch = useAppDispatch();
  const [titleRender, setTitleRender] = useState('');
  useEffect(() => {
    if (!inWindow()) {
      return;
    }

    if (!nimApi.getIMAuthConfig()) {
      setTitleRender(getIn18Text('GOUXUANCIGONGNENG_NOIM'));
      return;
    }

    if (productVersionId !== 'sirius') {
      setTitleRender(getIn18Text('GOUXUANCIGONGNENG'));
      return;
    }

    setTitleRender(getIn18Text('GOUXUANCIGONGNENG11'));
  }, [productVersionId]);
  // 开启/关闭 已读提醒
  // 免费版删除文字、尊享版全部展示，其余版本只展示域内
  const readRemindChange = () => {
    if (!nimApi.getIMAuthConfig()) {
      dispatch(mailActions.doChangeMailReadRemind(!readRemind));
      return;
    }
    if (!readRemind) {
      // @ts-ignore
      // const content = productVersionId === 'sirius' ? '已开启，对方读信后您将收到消息提醒' : '已开启，对方读信后您将收到消息提醒(仅域内)'
      message.success({
        content: productVersionId === 'sirius' ? getIn18Text('YIKAIQI\uFF0CDUI11') : getIn18Text('YIKAIQI\uFF0CDUI'),
      });
      // 已读提醒 和 定时发送 是互斥的
      // setScheduledSent(false);
    } else {
      // @ts-ignore
      message.success({
        content: getIn18Text('YIGUANBI\uFF0CDUI'),
      });
    }
    dispatch(mailActions.doChangeMailReadRemind(!readRemind));
  };
  return (
    <div className={`${style.readRemind}`}>
      <Checkbox checked={readRemind} disabled={!isMainAccount} onClick={readRemindChange}>
        {getIn18Text('YIDUTIXING')}
      </Checkbox>
      <Tooltip arrowPointAtCenter getPopupContainer={() => document.getElementById('sendfooter') || document.body} placement="topLeft" title={titleRender}>
        <IconWarn />
      </Tooltip>
    </div>
  );
};
export default ReadRemindComp;
