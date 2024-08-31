import React, { useEffect, useState, useRef } from 'react';
import { Button, Space, Divider } from 'antd';
import classnames from 'classnames';
import { apiHolder, apis, EdmSendBoxApi, EdmEmailInfo } from 'api';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { getTransText } from '@/components/util/translate';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import moment, { Moment } from 'moment';
import { ViewEdmContent } from '../../../components/viewContent/viewContent';
import { getEdmSendTime } from '../../constant';
import { EdmTaskSelectModal } from './edmTaskSelect';
import { ContactList, ContactItem } from '../contactList';
import style from './edmEmailPicker.module.scss';
import { getIn18Text } from 'api';

interface Props {
  visible: boolean;
  values: Record<string, any>;
  resetValues: Record<string, any>;
  onSave: (values: Record<string, any>) => void;
  onClose: () => void;
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
export const EdmEmailPicker: React.FC<Props> = props => {
  const { visible, values, onSave, onClose } = props;
  const [pickerValue, setPickerValue] = useState<Record<string, any>>({});
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const edmTaskSelector = useRef<any>();

  useEffect(() => {
    setPickerValue(values);
  }, [values]);

  const handleReset = () => {
    setPickerValue({
      edmEmailId: '',
      edmTaskName: '',
      edmSendTime: '',
      contactInfos: [],
      edmEmailSendTime: '',
    });
    edmTaskSelector?.current?.resetSelection();
  };

  const handleSave = () => {
    if (!pickerValue.edmEmailId) {
      return Toast.error({ content: getTransText('QINGXIANXUANZEYINGXIAOYOUJIAN') });
    }

    if (!pickerValue?.contactInfos?.length) {
      return Toast.error({ content: getTransText('LIANXIRENLIEBIAOBUNENGWEIKONG') });
    }
    if (onSave) {
      return onSave(pickerValue);
    }
  };

  const edmTaskChange = (edmEmailInfo: EdmEmailInfo) => {
    setPickerValue({
      ...pickerValue,
      edmEmailId: edmEmailInfo.edmEmailId,
      edmTaskName: edmEmailInfo.edmSubject,
      edmSendTime: getEdmSendTime(edmEmailInfo.sendTime, edmEmailInfo.sendTimeZone),
      edmEmailSendTime: getLocalTime(edmEmailInfo.sendTime, edmEmailInfo.sendTimeZone),
    });
  };

  const getLocalTime = (sendTime: string, cronTimeZone: string) => {
    if (sendTime && cronTimeZone) {
      const date = moment(`${sendTime}${cronTimeZone}`);
      return date.utcOffset(8).format('YYYY-MM-DD HH:mm:ss');
    }
    return '-';
  };

  async function fetchContactList() {
    const res = await edmApi.getSendBoxDetail({
      edmEmailId: pickerValue.edmEmailId,
    });
    setPickerValue({
      ...pickerValue,
      contactInfos: res?.receiverList || [],
    });
  }

  function onContactDelete(item: ContactItem) {
    setPickerValue({
      ...pickerValue,
      contactInfos: (pickerValue?.contactInfos || []).filter((contact: ContactItem) => {
        return contact.contactEmail !== item.contactEmail;
      }),
    });
  }

  useEffect(() => {
    pickerValue.edmEmailId && fetchContactList();
  }, [pickerValue.edmEmailId]);

  return (
    <Drawer
      className={style.cluePicker}
      title={'选择营销任务'}
      contentWrapperStyle={{ width: 500 }}
      visible={visible}
      onClose={() => {
        // handleReset();
        onClose();
      }}
      footer={
        <div className={style.cluePickerFooter}>
          <Button onClick={handleReset}>{getTransText('ZHONGZHI')}</Button>
          <Button type="primary" onClick={handleSave}>
            {getTransText('BAOCUN')}
          </Button>
        </div>
      }
    >
      <div className={style.edmPicker}>
        <div className={style.edmInfo}>
          {pickerValue?.edmEmailId ? (
            <div className={style.edmEmail}>
              <div className={style.taskInfo}>
                <div className={style.taskName}>{pickerValue.edmTaskName}</div>
                <div>
                  {getTransText('FASONGSHIJIAN\uFF1A')}
                  {pickerValue.edmSendTime}
                </div>
              </div>
              <div className={style.taskOp}>
                <Space split={<Divider type="vertical" />}>
                  <span className={style.linkBtn} onClick={() => setShowPreviewModal(true)}>
                    {getIn18Text('CHAKAN')}
                  </span>
                  <span className={style.linkBtn} onClick={() => setTaskModalVisible(true)}>
                    {getIn18Text('ZHONGXINXUANZE')}
                  </span>
                </Space>
              </div>
            </div>
          ) : (
            <div className={style.edmEmailSelect} onClick={() => setTaskModalVisible(true)}>
              {getIn18Text('DIANJIXUANZEYINGXIAOREN')}
            </div>
          )}
        </div>
        <div className={classnames(style.title)}>{getIn18Text('LIANXIRENLIEBIAO')}</div>
        <div className={style.contactInfo}>
          <ContactList className={style.contactList} data={pickerValue.contactInfos} onDelete={onContactDelete} />
        </div>

        <EdmTaskSelectModal visible={taskModalVisible} ref={edmTaskSelector} onCancel={() => setTaskModalVisible(false)} onOk={edmTaskChange} />

        <ViewEdmContent visible={showPreviewModal} onCancel={() => setShowPreviewModal(false)} destroyOnClose id={pickerValue?.edmEmailId} />
      </div>
    </Drawer>
  );
};
