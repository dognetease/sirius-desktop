import React, { useState, useEffect } from 'react';
import { apiHolder, apis, MaterielApi, MaterielBusinessCard, InsertWhatsAppApi, WaMgmtChannel } from 'api';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import { Form, AutoComplete } from 'antd';
import Input from '@lingxi-common-component/sirius-ui/Input';
import Checkbox from '@lingxi-common-component/sirius-ui/Checkbox';
import { uploadEmitter, UploadTrigger, CompleteEventArgs } from '@web-materiel/components/FileUploader';
import style from './BusinessCardEdit.module.scss';

const materielApi = apiHolder.api.requireLogicalApi(apis.materielApiImpl) as unknown as MaterielApi;
const insertWhatsAppApi = apiHolder.api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
const AvatarUploadKey = 'MaterielBusinessCardAvatarUpload';

interface BusinessCardEditProps {
  visible: boolean;
  businessCardId?: string;
  editable: boolean;
  onCancel: () => void;
  onFinish: (card: MaterielBusinessCard) => void;
}

export const BusinessCardEdit: React.FC<BusinessCardEditProps> = props => {
  const { visible, businessCardId, editable, onCancel, onFinish } = props;
  const [form] = Form.useForm();
  const [avatar, setAvatar] = useState<{ fileLink: string } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [channelList, setChannelList] = useState<WaMgmtChannel[]>([]);

  const handleSubmit = () => {
    form.validateFields().then(values => {
      setSubmitting(true);
      materielApi
        .editBusinessCard(values)
        .then(businessCard => {
          onFinish(businessCard);
        })
        .finally(() => {
          setSubmitting(false);
        });
    });
  };

  useEffect(() => {
    if (visible) {
      materielApi.getBusinessCard({ businessCardId }).then(businessCard => {
        if (businessCard.businessCardId) {
          form.setFieldsValue({ ...businessCard });
          if (businessCard.avatarLink) {
            setAvatar({ fileLink: businessCard.avatarLink });
          }
        }
      });
    } else {
      form.resetFields();
      setAvatar(null);
    }
  }, [visible, businessCardId]);

  useEffect(() => {
    uploadEmitter.on('complete', ({ file, uploadKey, downloadUrl }: CompleteEventArgs) => {
      if (uploadKey === AvatarUploadKey) {
        setAvatar({ fileLink: downloadUrl });
        form.setFieldsValue({ avatarLink: downloadUrl });
      }
    });
  }, [uploadEmitter]);

  useEffect(() => {
    insertWhatsAppApi.getMgmtChannelList().then(res => {
      setChannelList(res.channels || []);
    });
  }, []);

  const whatsAppValidator = (_: any, value: string) => {
    return /^\d+$/.test(value || '') ? Promise.resolve() : Promise.reject('请输入以区号开头的纯数字手机号\n例如: 8613000000000');
  };

  return (
    <Modal
      className={style.businessCardEdit}
      title="名片设置"
      width={420}
      visible={visible}
      footerTopLine
      onCancel={onCancel}
      onOk={handleSubmit}
      okButtonProps={{
        disabled: !editable,
        loading: submitting,
      }}
    >
      <Form className={style.form} form={form} layout="vertical">
        <Form.Item className={style.row} label="头像" name="avatarLink">
          <Input hidden />
          {avatar ? <img className={style.avatarImg} src={avatar.fileLink} /> : <div className={style.avatarEmpty} />}
          {editable && (
            <UploadTrigger uploadKey={AvatarUploadKey} types={['jpg', 'jpeg', 'png']}>
              <a>本地文件</a>
            </UploadTrigger>
          )}
        </Form.Item>
        <Form.Item label="英文名" name="englishName" rules={[{ required: true, max: 120 }]} required>
          <Input placeholder="请输入英文名" disabled={!editable} />
        </Form.Item>
        <Form.Item label="手机号" name="mobile">
          <Input placeholder="请输入手机号" disabled={!editable} />
        </Form.Item>
        <Form.Item label="公司名称" name="companyName" rules={[{ required: true, max: 120 }]} required>
          <Input placeholder="请输入公司名称" disabled={!editable} />
        </Form.Item>
        <Form.Item label="职位" name="job">
          <Input placeholder="请输入职位" disabled={!editable} />
        </Form.Item>
        <Form.Item label="电子邮箱" name="email" rules={[{ required: true, max: 120 }]} required>
          <Input placeholder="请输入电子邮箱" disabled={!editable} />
        </Form.Item>
        <Form.Item shouldUpdate noStyle>
          {() => {
            const whatsappQrVisible = form.getFieldValue('whatsappQrVisible');

            return (
              <Form.Item
                label="WhatsApp"
                name="whatsapp"
                rules={whatsappQrVisible ? [{ required: true, max: 120, validator: whatsAppValidator }] : undefined}
                required={whatsappQrVisible}
              >
                <AutoComplete
                  placeholder="请输入 WhatsApp"
                  disabled={!editable}
                  options={channelList.map(item => ({
                    label: item.whatsAppNumber,
                    value: item.whatsAppNumber,
                  }))}
                />
              </Form.Item>
            );
          }}
        </Form.Item>
        <Form.Item className={style.row} label="公司地址" name="companyAddress">
          <Input placeholder="请输入公司地址" disabled={!editable} />
        </Form.Item>
        <Form.Item name="whatsappQrVisible" valuePropName="checked">
          <Checkbox className={style.checkbox} disabled={!editable}>
            WhatsApp 二维码
          </Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};
