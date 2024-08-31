/**
 *  邮件举报/信任
 *  todo: 需要迁移到外部，不再作为内部组件了
 */
import React, { useState, useEffect } from 'react';
import { Modal, Radio, Space, Checkbox, Divider, Button, Tooltip } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { MailApi, MailConfApi, apis, apiHolder } from 'api';
import { MailActions, useActions, useAppDispatch } from '@web-common/state/createStore';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { ReactComponent as ErrorIcon } from '@/images/icons/mail/error-icon.svg';
import { ReactComponent as IconClose } from '@/images/icons/mail/icon-close1.svg';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { setCurrentAccount } from '.././../util';
import styles from './MailReport.module.scss';
import { getIn18Text } from 'api';
export interface ReportButtonProps {
  mailId?: string;
  senderEmail?: string;
  hasReport?: boolean;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}
export const MailReport = (props: ReportButtonProps) => {
  const { mailId, hasReport = false, senderEmail, visible, setVisible } = props;
  // const [visible, setVisible] = useState<boolean>(false);
  const [alertModalVisible, setAlertModalVisible] = useState<boolean>(false);
  const [radioType, setRadioType] = useState<number>(-1);
  const [blockSender, setBlockSender] = useState<boolean>(false);
  const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
  const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
  const eventApi = apiHolder.api.getEventApi();
  const dispatch = useAppDispatch();
  const mailActions = useActions(MailActions);
  useEffect(() => {
    setRadioType(-1);
  }, [mailId, visible]);
  useEffect(() => {
    if (visible) {
      setBlockSender(false);
    }
  }, [visible]);
  const handleTrust = async () => {
    try {
      if (!window?.navigator?.onLine) {
        message.error(getIn18Text('WANGLUOBUKEYONG'));
        return;
      }
      let successMsg = getIn18Text('SHEWEIXINRENCHENG11');
      if (blockSender) {
        const res = await mailConfApi.setBlackListOrWhiteList(senderEmail, false);
        if (res === 'exist') {
          setAlertModalVisible(true);
          return;
        }
        successMsg = getIn18Text('SHEWEIXINRENCHENG');
      }
      // mailApi.doMoveMail(mailId, 1);
      dispatch(
        Thunks.doMoveMail({
          mailId,
          folderId: 1,
        })
      );
      // 只有主账号有举报
      // setCurrentAccount();
      await mailApi.doReportOrTrustMail(mailId, 1);
      mailActions.doDeleteMailById(mailId);
      message.success(successMsg);
    } catch (error) {
      message.info(getIn18Text('SHEWEIXINRENSHI'));
      console.log('[report error]:', error);
    } finally {
      setVisible(false);
    }
  };
  // 只有主账号有举报
  const handleReport = async () => {
    try {
      if (!window?.navigator?.onLine) {
        message.error(getIn18Text('WANGLUOBUKEYONG'));
        return;
      }
      let successMsg = getIn18Text('JUBAOCHENGGONG\uFF0C11');
      if (blockSender && senderEmail) {
        // setCurrentAccount();
        const res = await mailConfApi.setBlackListOrWhiteList(senderEmail, true);
        if (res === 'exist') {
          setAlertModalVisible(true);
          return;
        }
        successMsg = getIn18Text('JUBAOCHENGGONG\uFF0C');
      }
      // mailApi.doMoveMail(mailId, 5);
      dispatch(
        Thunks.doMoveMail({
          mailId,
          folderId: 5,
        })
      );
      // setCurrentAccount();
      await mailApi.doReportOrTrustMail(mailId, 5, radioType as any);
      eventApi.sendSysEvent({
        eventName: 'mailStatesChanged',
        eventData: {
          mark: false,
          id: mailId,
          type: 'redFlag',
          hideMessage: true,
        },
        _account: '',
        eventStrData: 'unmark',
      });
      mailActions.doDeleteMailById(mailId);
      message.success(successMsg);
    } catch (error) {
      message.info(getIn18Text('JUBAOSHIBAI'));
      console.log('[report error]:', error);
    } finally {
      setVisible(false);
    }
  };
  const renderReportModal = () => (
    <>
      <h3>{getIn18Text('QINGXUANZEJUBAO')}</h3>
      <div>
        <Radio.Group onChange={e => setRadioType(e.target.value)} value={radioType}>
          <Space direction="vertical">
            <Radio value={0}>{getIn18Text('FANGMAOYOUJIAN\uFF08')}</Radio>
            <Radio value={1}>{getIn18Text('SEQINGYOUJIAN')}</Radio>
            <Radio value={2}>{getIn18Text('DIAOYUYOUJIAN\uFF08')}</Radio>
            <Radio value={3}>{getIn18Text('WEIFAYOUJIAN')}</Radio>
          </Space>
          <Space direction="vertical">
            <Radio value={4}>{getIn18Text('DAIFAYOUJIAN')}</Radio>
            <Radio value={5}>{getIn18Text('TUIGUANGYOUJIAN')}</Radio>
            <Radio value={6}>{getIn18Text('QITAYOUJIAN')}</Radio>
          </Space>
        </Radio.Group>
      </div>
      <Divider style={{ margin: '14px 0' }} />
      <div>
        <Checkbox checked={blockSender} onChange={e => setBlockSender(e.target.checked)}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {getIn18Text('JIANGFAJIANRENJIA2')}
            <Tooltip title="加入黑名单将拒收该联系人来信，请谨慎操作">
              <QuestionCircleOutlined
                style={{
                  marginLeft: 8,
                }}
              />
            </Tooltip>
          </div>
        </Checkbox>
      </div>
    </>
  );
  const renderTrustModal = () => (
    <>
      <div>
        <h3>{getIn18Text('SHEWEIXINRENHOU')}</h3>
        <Checkbox checked={blockSender} onChange={e => setBlockSender(e.target.checked)}>
          {getIn18Text('JIANGFAJIANRENJIA')}
        </Checkbox>
      </div>
    </>
  );
  return (
    <>
      {/* <div style={{ width: '150%', padding: '8px 0px 8px 16px', margin: '-8px -16px' }} onClick={() => setVisible(true)}>{hasReport ? '信任' : '举报'}</div> */}
      <Modal
        visible={visible}
        bodyStyle={{ padding: 20 }}
        onCancel={() => setVisible(false)}
        onOk={hasReport ? handleTrust : handleReport}
        closeIcon={<IconClose />}
        destroyOnClose
        width={400}
        cancelText={getIn18Text('QUXIAO')}
        okText={getIn18Text('QUEDING')}
        okButtonProps={{ disabled: radioType === -1 && !hasReport }}
        className={styles.reportWrap}
      >
        <div className="ant-allow-dark">
          <form>{hasReport ? renderTrustModal() : renderReportModal()}</form>
        </div>
      </Modal>
      <Modal
        closable={false}
        visible={alertModalVisible}
        footer={
          <Button type="primary" onClick={() => setAlertModalVisible(false)}>
            {getIn18Text('ZHIDAOLE')}
          </Button>
        }
      >
        <div
          style={{
            fontWeight: 500,
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ErrorIcon style={{ marginRight: 8 }} />
          <span>{getIn18Text('TIANJIASHIBAI\uFF0C')}</span>
        </div>
      </Modal>
    </>
  );
};
export default MailReport;
