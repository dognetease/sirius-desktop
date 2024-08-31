// 邮箱设置，关于摘要和附件是否展示的设置
import React, { useEffect } from 'react';
import { Checkbox, Popover } from 'antd';
import { apiHolder as api, apis, MailConfApi as MailConfApiType } from 'api';
import { ReactComponent as IconWarn } from '@/images/icons/icon-warn.svg';
import styles from './MailDescAndAttachment.module.scss';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { useAppDispatch } from '@web-common/state/createStore';
import type { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { getIn18Text } from 'api';

const DescTip = () => (
  <div className={styles.popouter}>
    <div className={styles.poptitle}>{getIn18Text('XIANSHIYOUJIANZHAI')}</div>
    <div className={styles.popimg1}></div>
    <div className={styles.poptitle}>{getIn18Text('BUXIANSHIYOUJIAN')}</div>
    <div className={styles.popimg2}></div>
  </div>
);
const AttachmentTip = () => (
  <div className={styles.popouter}>
    <div className={styles.poptitle}>{getIn18Text('XIANSHIFUJIANMING')}</div>
    <div className={styles.popimg3}></div>
    <div className={styles.poptitle}>{getIn18Text('BUXIANSHIFUJIAN')}</div>
    <div className={styles.popimg4}></div>
  </div>
);
const AvatorTip = () => (
  <div className={styles.popouter}>
    <div className={styles.poptitle}>{getIn18Text('mailListAvatorShow')}</div>
    <div className={styles.popimg5}></div>
    <div className={styles.poptitle}>{getIn18Text('mailListAvatorNotShow')}</div>
    <div className={styles.popimg6}></div>
  </div>
);
const ConcreteTimeTip = () => (
  <div className={styles.popouter}>
    <div className={styles.poptitle}>{getIn18Text('concreteToMinute')}</div>
    <div className={styles.popimg7}></div>
    <div className={styles.poptitle}>{getIn18Text('notConcreteToMinute')}</div>
    <div className={styles.popimg8}></div>
  </div>
);

const RealListTip = () => (
  <div className={styles.popouter}>
    <div className={styles.poptitle}>{getIn18Text('mailListReallistShow')}</div>
    <div className={styles.showRealListImg}></div>
    <div className={styles.poptitle}>{getIn18Text('mailListReallistNoShow')}</div>
    <div className={styles.noShowRealListImg}></div>
  </div>
);

interface Props {
  isQuick?: boolean;
}
// 设置附件和摘要显示
export const MailDescAndAttachment: React.FC<Props> = props => {
  const { isQuick = false } = props;
  const [descChecked, setDescChecked] = useState2RM('configMailListShowDesc', 'doUpdateConfigMailListShowDesc');
  const [attachmentChecked, setAttachmentChecked] = useState2RM('configMailListShowAttachment', 'doUpdateConfigMailListShowAttachment');
  const [showAvator, setShowAvator] = useState2RM('configMailListShowAvator', 'doUpdateConfigMailListShowAvator');
  const [showRealList, setShowRealList] = useState2RM('useRealList', 'doUpdateUseRealList');
  const [showConcreteTime, setShowConcreteTime] = useState2RM('configMailListShowConcreteTime', 'doUpdateConfigMailListShowConcreteTime');
  const [showCustomerTab, setShowCustomerTab] = useState2RM('configMailListShowCustomerTab', 'doUpdateConfigMailListShowCustomerTab');

  const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApiType;
  // 摘要
  const onChangeDesc = (e: any) => {
    const val = e.target.checked;
    mailConfApi.setMailShowDesc(val);
    setDescChecked(val);
  };
  // 附件
  const onChangeAttachment = (e: any) => {
    const val = e.target.checked;
    mailConfApi.setMailShowAttachment(val);
    setAttachmentChecked(val);
  };
  // 头像
  const onChangeAvator = (e: any) => {
    const val = e.target.checked;
    mailConfApi.setMailShowAvator(val);
    setShowAvator(val);
  };
  const dispatch = useAppDispatch();
  const onChangeShowRealList = (e: CheckboxChangeEvent) => {
    const val = e.target.checked;
    mailConfApi.setIsUseRealList(val);
    setShowRealList(val);
    dispatch(Thunks.resetRealListStateAndLoadList({}));
  };
  // 写信具体时间
  const onChangeShowConcreteTime = (e: any) => {
    const val = e.target.checked;
    // 本地存储 + 远端同步
    mailConfApi.setShowConcreteTime(val);
    setShowConcreteTime(val);
  };
  // 支持客户邮件筛选
  const onChangeShowCustomerTab = (e: any) => {
    const val = e.target.checked;
    // 本地存储
    mailConfApi.setShowCustomerTab(val);
    setShowCustomerTab(val);
  };
  // 获取默认值
  // 不能在此处初始化
  // useEffect(() => {
  //   const desc = mailConfApi.getMailShowDesc();
  //   setDescChecked(desc);
  //   const attachment = mailConfApi.getMailShowAttachment();
  //   setAttachmentChecked(attachment);
  //   const avator = mailConfApi.getMailShowAvator();
  //   setShowAvator(avator);
  //   const showConcreteTime = mailConfApi.getShowConcreteTime();
  //   setShowConcreteTime(showConcreteTime);
  // }, []);
  return (
    <>
      <div>
        <Checkbox checked={descChecked} onChange={onChangeDesc} defaultChecked={descChecked}>
          <span style={{ display: 'flex', alignItems: 'center' }} className={styles.checkboxLabel}>
            <span>{getIn18Text('XIANSHIYOUJIANZHAI')}</span>
            {/* {!isQuick && ( */}
            <Popover overlayClassName={styles.popContent} overlayInnerStyle={{ backgroundColor: 'rgba(0,0,0,0)' }} title="" placement="rightBottom" content={<DescTip />}>
              <IconWarn style={{ cursor: 'pointer', marginLeft: '5px' }} />
            </Popover>
            {/* )} */}
          </span>
        </Checkbox>
      </div>
      <div style={{ marginTop: '6px' }}>
        <Checkbox checked={attachmentChecked} onChange={onChangeAttachment} defaultChecked={attachmentChecked}>
          <span style={{ display: 'flex', alignItems: 'center' }} className={styles.checkboxLabel}>
            <span>{getIn18Text('XIANSHIFUJIANMING')}</span>
            {/* {!isQuick && ( */}
            <Popover
              overlayClassName={styles.popContent}
              overlayInnerStyle={{ backgroundColor: 'rgba(0,0,0,0)' }}
              title=""
              placement="rightBottom"
              content={<AttachmentTip />}
            >
              <IconWarn style={{ cursor: 'pointer', marginLeft: '5px' }} />
            </Popover>
            {/* )} */}
          </span>
        </Checkbox>
      </div>
      <div style={{ marginTop: '6px' }}>
        <Checkbox checked={showAvator} onChange={onChangeAvator} defaultChecked={showAvator}>
          <span style={{ display: 'flex', alignItems: 'center' }} className={styles.checkboxLabel}>
            <span>{getIn18Text('mailListAvatorShow')}</span>
            {/* {!isQuick && ( */}
            <Popover
              overlayClassName={styles.popContent}
              overlayInnerStyle={{ backgroundColor: 'rgba(0,0,0,0)' }}
              title=""
              placement="rightBottom"
              content={<AvatorTip />}
            >
              <IconWarn style={{ cursor: 'pointer', marginLeft: '5px' }} />
            </Popover>
            {/* )} */}
          </span>
        </Checkbox>
      </div>
      {
        <div style={{ marginTop: '6px' }}>
          <Checkbox checked={showRealList} onChange={onChangeShowRealList} defaultChecked={showRealList}>
            <span style={{ display: 'flex', alignItems: 'center' }} className={styles.checkboxLabel}>
              <span>{getIn18Text('mailListReallistShow')}</span>
              {/* {!isQuick && ( */}
              <Popover
                overlayClassName={styles.popContent + ' ' + styles.autoWidth}
                overlayInnerStyle={{ backgroundColor: 'rgba(0,0,0,0)' }}
                placement="rightBottom"
                content={<RealListTip />}
              >
                <IconWarn style={{ cursor: 'pointer', marginLeft: '5px' }} />
              </Popover>
              {/* )} */}
            </span>
          </Checkbox>
        </div>
      }
      <div style={{ marginTop: '6px' }}>
        <Checkbox checked={showConcreteTime} onChange={onChangeShowConcreteTime} defaultChecked={showConcreteTime}>
          <span style={{ display: 'flex', alignItems: 'center' }} className={styles.checkboxLabel}>
            <span>{getIn18Text('concreteTimeShow')}</span>
            {/* {!isQuick && ( */}
            <Popover
              overlayClassName={styles.popContent}
              overlayInnerStyle={{ backgroundColor: 'rgba(0,0,0,0)' }}
              title=""
              placement="rightBottom"
              content={<ConcreteTimeTip />}
            ></Popover>
            {/* )} */}
          </span>
        </Checkbox>
      </div>
      {
        // 外贸通，且非快捷设置下展示
        process.env.BUILD_ISEDM && !isQuick && (
          <div style={{ marginTop: '6px' }}>
            <Checkbox checked={showCustomerTab} onChange={onChangeShowCustomerTab} defaultChecked={showCustomerTab}>
              <span style={{ display: 'flex', alignItems: 'center' }} className={styles.checkboxLabel}>
                {getIn18Text('ZHICHIKEHUYOUJSX')}
              </span>
            </Checkbox>
          </div>
        )
      }
    </>
  );
};
export default MailDescAndAttachment;
