import React, { useEffect, useState } from 'react';
import type { RadioChangeEvent } from 'antd';
import { Space } from 'antd';
import { api, apis, InsertWhatsAppApi, EditAccConfigRequest } from 'api';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';

import { Radio } from '@web-common/components/UI/Radio';

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

interface Props {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const NoticeModal: React.FC<Props> = ({ visible, setVisible }) => {
  const [value, setValue] = useState<EditAccConfigRequest['operateNotifyType']>();
  const onChange = (e: RadioChangeEvent) => {
    setValue(e.target.value);
  };

  const onOk = () => {
    whatsAppApi
      .waAccConfigEdit({
        operateNotifyType: value,
      })
      .then(() => {
        SiriusMessage.success({ content: '设置成功' });
      })
      .finally(() => {
        setVisible(false);
      });
  };
  useEffect(() => {
    whatsAppApi.waAccConfig().then(res => {
      setValue(res?.operateNotifyType);
    });
  }, []);

  return (
    <Modal visible={visible} onCancel={() => setVisible(false)} title="设置消息通知" onOk={onOk}>
      <Radio.Group onChange={onChange} value={value}>
        <Space direction="vertical">
          <Radio value="NOT_NOTIFY">邮件和消息助手不通知</Radio>
          <Radio value="NOTIFY">邮件和消息助手逐条通知</Radio>
          <Radio value="GROUP_NOTIFY">邮件和消息助手在每日8点通知一次</Radio>
        </Space>
      </Radio.Group>
    </Modal>
  );
};
