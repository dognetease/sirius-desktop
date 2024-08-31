import React, { useState } from 'react';
import { Breadcrumb, Form } from 'antd';
import { useMount } from 'ahooks';
import { navigate } from '@reach/router';
import { api, apis, InsertWhatsAppApi } from 'api';
// import { EnhanceSelect, InMultiOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import styles from './createTask.module.scss';
import { getTransText } from '@/components/util/translate';
import MessageContent, { Item as ItemProps } from './components/messageContent';
import InputName from './components/taskName';
import SelectContacts from './selectContacts/index';
import { track } from '../tracker';

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

const WaBulkCreateTask: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [senders, setSenders] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [currentMessage, setCurrentMessage] = useState<ItemProps>();

  const toListPage = () => {
    navigate('#edm?page=marketBulk');
  };

  const saveData = () => {
    track.waBlulkTrack('send');
    form.validateFields().then(res => {
      setLoading(true);
      const formData = new FormData();
      formData.append('content', res.targetContent.text);
      res.targetContent.mimetype && formData.append('mimetype', res.targetContent.mimetype);
      res.targetContent.type && formData.append('type', res.targetContent.type);
      formData.append('receivers', res.receivers.join(','));
      formData.append('senders', res.senders.join(','));
      formData.append('taskName', res.taskName);
      res.targetContent.file && formData.append('file', res.targetContent.file);
      whatsAppApi
        .addWaMarketingTask(formData)
        .then(() => {
          SiriusMessage.success('创建成功');
          toListPage();
        })
        .finally(() => setLoading(false));
    });
  };

  const getChannelList = () => {
    whatsAppApi.getMarketChannelList('MULTI_SEND').then(res => {
      const whatsApp = (res.channels || []).filter(channel => channel.bindStatus === 'bind' && channel.loginStatus === 'LOGIN')?.map(item => item.whatsAppNumber) || [];
      setSenders(whatsApp);
    });
  };

  useMount(() => {
    getChannelList();
  });

  return (
    <div className={styles.container}>
      <Breadcrumb className={styles.breadcrumb} separator=">">
        <Breadcrumb.Item>
          <span onClick={() => toListPage()}>{getTransText('RENWULIEBIAO')}</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>新建群发任务</Breadcrumb.Item>
      </Breadcrumb>
      <div className={styles.main}>
        <div className={styles.mainLeft}>
          <Form form={form} name="formData" layout="vertical" autoComplete="off">
            <Form.Item label="任务名称" name="taskName" rules={[{ required: true, message: '请输入任务名称' }]}>
              <InputName placeholder="请输入任务名称" maxLength={100} style={{ width: 600 }} />
            </Form.Item>
            <Form.Item label="群发账号" name="senders" rules={[{ required: true, message: '请选择群发账号' }]}>
              <EnhanceSelect mode="multiple" placeholder="请选择账号" style={{ width: 600 }}>
                {senders.map(sender => (
                  <InMultiOption value={sender}>{sender}</InMultiOption>
                ))}
              </EnhanceSelect>
            </Form.Item>
            <Form.Item label="目标WhatsApp号码" name="receivers" rules={[{ required: true, message: '请选择目标WhatsApp号码' }]}>
              <SelectContacts />
            </Form.Item>
            <Form.Item
              label="发送内容设置"
              name="targetContent"
              validateFirst
              rules={[
                { required: true, message: '请输入发送内容' },
                () => ({
                  validator(_, value) {
                    const hasValue = Object.values(value || '').filter(item => item)?.length;
                    if (hasValue) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('请输入发送内容'));
                  },
                }),
              ]}
            >
              <MessageContent onShow={setCurrentMessage} />
            </Form.Item>
          </Form>
        </div>
        <div className={styles.mainRight}>
          {currentMessage?.text || currentMessage?.url ? (
            <div className={styles.mediaBox}>
              {currentMessage?.mimetype?.includes('image')
                ? currentMessage?.url && <img className={styles.img} alt="发送图片" src={currentMessage?.url} />
                : currentMessage?.url && (
                    <video style={{ width: '100%', height: '100%' }} controlsList="nodownload" controls>
                      <source src={currentMessage.url}></source>
                    </video>
                  )}
              <div className={styles.text}>{currentMessage?.text}</div>
            </div>
          ) : null}
        </div>
      </div>
      <div className={styles.footer}>
        <Button onClick={() => toListPage()}> 取消</Button>
        <Button loading={loading} btnType="primary" onClick={() => saveData()}>
          保存
        </Button>
      </div>
    </div>
  );
};

export default WaBulkCreateTask;
