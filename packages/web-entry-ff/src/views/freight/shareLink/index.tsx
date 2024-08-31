import React, { useCallback, useState } from 'react';
import { Button, ButtonProps, message, Modal, Input, Form } from 'antd';
import { FFMSApi, apiHolder, apis, FFMSSite } from 'api';
import ShareAltOutlined from '@ant-design/icons/ShareAltOutlined';
import { useLocalStorageState } from 'ahooks';
import style from './style.module.scss';

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
export const ShareLink: React.FC<ButtonProps> = props => {
  const [siteInfo, setSiteInfo] = useState<FFMSSite.SiteInfo>({ siteId: '', domain: '', shareId: '' });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showInputTip, setShowInputTip] = useLocalStorageState('FFMS_CUSTOMERPATH_TIP', { defaultValue: true });
  const [form] = Form.useForm();

  const copyLink = useCallback((sharLink: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(sharLink);
      } else {
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.style.position = 'fixed';
        textarea.style.clip = 'rect(0 0 0 0)';
        textarea.style.top = '10px';
        textarea.value = sharLink;
        textarea.select();
        document.execCommand('copy', true);
        document.body.removeChild(textarea);
      }
      message.success('分享链接已经复制到剪切板');
    } catch {}
  }, []);

  const openShareModal = async () => {
    try {
      setLoading(true);
      const res = await ffmsApi.getOrgSite();
      setSiteInfo(res);
      setVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    try {
      setConfirmLoading(true);
      const res = await form.validateFields();
      await ffmsApi.saveSiteId(res.siteId);
      copyLink(`${siteInfo.domain}/${res.siteId}?id=${siteInfo.shareId}`);
      setVisible(false);
    } finally {
      setConfirmLoading(false);
    }
  };

  const siteIdValidator = async (_: any, value: string, callback: Function) => {
    const isValid = await ffmsApi.checkSiteId(value);
    if (!isValid) {
      return callback('该自定义路径重复，请重新输入');
    }
    callback();
  };

  return (
    <>
      <Button type="primary" className={style.shareBtn} {...props} loading={loading} onClick={openShareModal}>
        <ShareAltOutlined />
        分享
      </Button>

      <Modal title="自定义分享链接" width={800} visible={visible} onOk={onSave} confirmLoading={confirmLoading} onCancel={() => setVisible(false)} destroyOnClose>
        <Form form={form} initialValues={siteInfo}>
          <div className={style.content}>
            <span className={style.linkText}>{siteInfo.domain} / </span>
            <div className={style.inputWrapper}>
              {showInputTip && <div className={style.inputTip}>此处路径可自定义</div>}
              <Form.Item
                className={style.formItem}
                name="siteId"
                rules={[
                  { required: true, message: '请输入自定义路径' },
                  { pattern: /^[a-zA-Z0-9]*$/, message: '只能输入英文字符和数字' },
                  { max: 20, message: '最多输入20个字符' },
                  { validateTrigger: 'none', validator: siteIdValidator },
                ]}
              >
                <Input size="small" className={style.input} onChange={() => setShowInputTip(false)} />
              </Form.Item>
            </div>
            <span className={`${style.linkText} ${style.ellipsis}`}>?id={siteInfo.shareId}</span>
          </div>
        </Form>
      </Modal>
    </>
  );
};
