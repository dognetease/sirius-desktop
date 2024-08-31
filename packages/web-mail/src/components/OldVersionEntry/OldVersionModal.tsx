import React, { FC, useState, useEffect } from 'react';
import { Modal, Checkbox, Input, Form } from 'antd';
import { apiHolder, apis, DataTrackerApi, SystemApi, api, conf, inWindow, WebMailApi } from 'api';
import CloseIcon from '@/images/icons/modal-close-btn.svg';
import ActivityIcon from '@/images/icons/activity-icon.svg';
import { getShowOld } from '@web-common/components/util/webmail-util';
import style from './OldVersionEntry.module.scss';
import { getIn18Text } from 'api';

const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = api.getSystemApi();
const webmailApi = apiHolder.api.requireLogicalApi(apis.webmailApiImpl) as WebMailApi;

const { TextArea } = Input;
const CloseLabel = {
  '0': getIn18Text('GUANBI'),
  '1': getIn18Text('HUIDAOJIUBAN'),
  '2': getIn18Text('JIXUSHIYONG'),
} as const;

export const OldVersionModal: FC<{
  defaultVisible: boolean;
  title?: string;
  closeModal: () => void;
}> = props => {
  const { defaultVisible, title, closeModal } = props;
  const [visible, setVisible] = useState(false);
  const [optionValue, setOptionValue] = useState<Array<string>>([]);
  const [closeReason, setCloseReason] = useState('');
  const [content, setContent] = useState('');
  const options = [
    { label: getIn18Text('ZHAOBUDAOGONGNENG'), value: 'optionOne' },
    { label: getIn18Text('YEMIANKADUN'), value: 'optionTwo' },
    { label: getIn18Text('YEMIANBUJUSHI'), value: 'optionThree' },
  ];
  const handleClose = () => {
    let option: Record<string, unknown>;
    let reasonLabel = CloseLabel[closeReason as keyof typeof CloseLabel];
    switch (closeReason as keyof typeof CloseLabel) {
      case '0':
        option = {
          buttonName: reasonLabel,
        };
        break;
      case '2':
        option = {
          buttonName: reasonLabel,
        };
        break;
      case '1':
        if (content.length > 200) {
          // 超过200不能提交
          return;
        }
        option = {
          buttonName: reasonLabel,
          optionOne: optionValue.includes('optionOne'),
          optionTwo: optionValue.includes('optionTwo'),
          optionThree: optionValue.includes('optionThree'),
          content,
        };
        break;
    }
    // 重置数据
    setOptionValue([]);
    setContent('');
    option.source = title;
    trackApi.track('click_button_backWebmailPage_lingx', option);
    if (closeReason === '1') {
      let sid = systemApi.getCurrentUser()?.sessionId || '';

      // 获取 show_old
      const SHOW_OLD = getShowOld();
      location.assign('/js6/upgrade.jsp?style=12&sid=' + sid + '&show_old=' + SHOW_OLD);
    }
  };

  useEffect(() => {
    setVisible(defaultVisible);
  }, [defaultVisible]);

  return (
    <Modal
      destroyOnClose
      width={480}
      visible={visible}
      title={<div className={style.modalTitle}>{getIn18Text('SHISHENMEYUANYIN')}</div>}
      closeIcon={
        <img
          style={{
            width: '16px',
            height: '16px',
          }}
          src={CloseIcon}
        />
      }
      className={`extheme ${style.oldEntryModal}`}
      okText={CloseLabel['1']}
      cancelText={CloseLabel['2']}
      onOk={() => {
        setCloseReason('1');
        if (content.length > 200) {
          // 超过200不能提交
          return;
        }
        closeModal();
      }}
      onCancel={() => {
        setCloseReason('0');
        closeModal();
      }}
      maskClosable={false}
      afterClose={handleClose}
      cancelButtonProps={{
        onClick() {
          setCloseReason('2');
          closeModal();
        },
      }}
    >
      <Form>
        <Checkbox.Group
          options={options}
          value={optionValue}
          onChange={value => {
            setOptionValue(value as Array<string>);
          }}
        />
        <Form.Item
          name="input"
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (value && value.length > 200) {
                  return Promise.reject(new Error(getIn18Text('QINGSHURU20')));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <TextArea className={style.oldEntryFeedback} value={content} onChange={e => setContent(e.target.value)} placeholder={getIn18Text('QINGSHURU20')} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
