import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import { TongyongJiantou1Zuo } from '@sirius/icons';
import { apiHolder, apis, MaterielApi, MaterielShare, MaterielFile, MaterielBusinessCard } from 'api';
import { Form, Spin } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import { Checkbox } from '@web-common/components/UI/Checkbox';
import Checkbox from '@lingxi-common-component/sirius-ui/Checkbox';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import { uploadEmitter, UploadTrigger, MaterielAddedEventArgs, CompleteEventArgs } from '@web-materiel/components/FileUploader';
import { BusinessCardEdit } from '@web-materiel/components/BusinessCardEdit';
import { navigate } from '@reach/router';
import { FileCard } from '@web-materiel/components/FileCard';
import { FilePicker } from '@web-materiel/components/FilePicker';
import style from './index.module.scss';

const materielApi = apiHolder.api.requireLogicalApi(apis.materielApiImpl) as unknown as MaterielApi;
const DEFAULT_COVER = 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/11/15/9b34d98d51194b36ab6e5e164d8919fe.png';

const { TextArea } = Input;
const FileUploadKey = 'MaterielBusinessShareEditFileUpload';
const CoverUploadKey = 'MaterielBusinesShareEditCoverUpload';

interface ShareEditProps {
  qs: Record<string, string>;
}

interface PreviewData {
  title?: string;
  description?: string;
  coverLink?: string;
}

export const ShareEdit: React.FC<ShareEditProps> = props => {
  const { qs } = props;
  const contentTitle = qs.shareId ? '编辑' : '新建';
  const [form] = Form.useForm();
  const [file, setFile] = useState<Partial<MaterielFile> | null>(null);
  const [cover, setCover] = useState<{ fileLink: string } | null>(null);
  const [share, setShare] = useState<MaterielShare | null>(null);
  const [shareFetching, setShareFetching] = useState<boolean>(false);
  const [pickerVisible, setPickerVisible] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [businessCard, setBusinessCard] = useState<MaterielBusinessCard | null>(null);
  const [businessCardUsed, setBusinessCardUsed] = useState<boolean>(false);
  const [businessCardVisible, setBusinessCardVisible] = useState<boolean>(false);
  const [businessCardFetching, setBusinessCardFetching] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<PreviewData>({});
  const intendToUseCardRef = useRef<boolean>(false);
  const mergedBusinessCardId = share?.businessCardId || (share?.createdByCurAcc && businessCard?.businessCardId) || undefined;
  const businessCardEditable = !share || share.createdByCurAcc;

  useEffect(() => {
    if (qs.shareId) {
      setShareFetching(true);
      materielApi
        .getSharePreview({ shareId: qs.shareId })
        .then(share => {
          form.setFieldsValue({
            title: share.title,
            description: share.description,
            fileId: share.fileId,
            coverLink: share.coverLink,
            businessCardId: share.businessCardId,
          });
          setFile({
            fileId: share.fileId,
            fileName: share.fileName,
            fileLink: share.fileLink,
            fileSize: share.fileSize,
          });
          setCover({
            fileLink: share.coverLink || DEFAULT_COVER,
          });
          setShare(share);
          setBusinessCardUsed(!!share.businessCardId);
          setPreviewData({
            title: share.title,
            description: share.description,
            coverLink: share.coverLink,
          });
        })
        .finally(() => {
          setShareFetching(false);
        });
    } else {
      setCover({ fileLink: DEFAULT_COVER });
    }
  }, [qs.shareId]);

  useEffect(() => {
    setBusinessCardFetching(true);
    materielApi
      .getBusinessCard()
      .then(businessCard => {
        if (businessCard.businessCardId) {
          setBusinessCard(businessCard);
        }
      })
      .finally(() => {
        setBusinessCardFetching(false);
      });
  }, []);

  useEffect(() => {
    uploadEmitter.on('added', ({ file, uploadKey }: MaterielAddedEventArgs) => {
      if (uploadKey === FileUploadKey) {
        setFile(file);
        form.setFieldsValue({ fileId: file!.fileId });
      }
    });
    uploadEmitter.on('complete', ({ file, uploadKey, downloadUrl }: CompleteEventArgs) => {
      if (uploadKey === CoverUploadKey) {
        setCover({ fileLink: downloadUrl });
        form.setFieldsValue({ coverLink: downloadUrl });
      }
    });
  }, [uploadEmitter]);

  useEffect(() => {
    if (file && !form.getFieldValue('title')) {
      const title = file.fileName || '';
      form.setFieldsValue({ title });
      setPreviewData(previewData => ({ ...previewData, title }));
    }
  }, [file]);

  useEffect(() => {
    setPreviewData(previewData => ({
      ...previewData,
      coverLink: cover ? cover.fileLink : undefined,
    }));
  }, [cover]);

  const handleWithCardChange = (checked: boolean) => {
    if (!checked) {
      form.setFieldsValue({ businessCardId: '' });
      setBusinessCardUsed(false);
    } else {
      if (mergedBusinessCardId) {
        form.setFieldsValue({ businessCardId: mergedBusinessCardId });
        setBusinessCardUsed(true);
      } else {
        setBusinessCardVisible(true);
        intendToUseCardRef.current = true;
      }
    }
  };

  const handleBack = () => {
    navigate('#wa?page=materielShareList');
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      setSubmitting(true);
      materielApi
        .editShare({
          shareId: qs.shareId,
          title: values.title,
          description: values.description,
          fileId: values.fileId,
          coverLink: values.coverLink,
          businessCardId: values.businessCardId,
        })
        .then(() => {
          handleBack();
        })
        .finally(() => {
          setSubmitting(false);
        });
    });
  };

  if (shareFetching || businessCardFetching)
    return (
      <div className={style.shareEdit}>
        <div className={style.shareIniting}>
          <Spin />
        </div>
      </div>
    );

  return (
    <div className={style.shareEdit}>
      <div className={style.header}>
        <div className={classnames('sirius-no-drag', style.title)} onClick={handleBack}>
          <TongyongJiantou1Zuo wrapClassName={style.back} />
          <div className={style.text}>返回</div>
        </div>
      </div>
      <div className={style.body}>
        <div className={style.content}>
          <div className={style.contentHeader}>{contentTitle}</div>
          <div className={style.contentBody}>
            <div className={style.config}>
              <Form
                className={style.form}
                form={form}
                labelAlign="left"
                labelCol={{ flex: '64px' }}
                wrapperCol={{ flex: 1 }}
                onValuesChange={(_, values) => {
                  setPreviewData({
                    ...previewData,
                    title: values.title,
                    description: values.description,
                  });
                }}
              >
                <Form.Item label="文件" name="fileId" rules={[{ required: true }]} required>
                  <Input hidden />
                  {file && file.fileName && (
                    <FileCard
                      className={style.fileCard}
                      file={file as MaterielFile}
                      closable
                      showTime
                      showSize
                      onClose={() => {
                        setFile(null);
                        form.setFieldsValue({ fileId: undefined });
                      }}
                    />
                  )}
                  <div className={classnames(style.fileTrigger)}>
                    <a className={style.fileList} onClick={() => setPickerVisible(true)}>
                      文件列表
                    </a>
                    <UploadTrigger className={style.uploadTrigger} uploadKey={FileUploadKey} addToMateriel>
                      <a>本地文件</a>
                    </UploadTrigger>
                  </div>
                </Form.Item>
                <Form.Item label="标题" name="title" rules={[{ required: true, max: 120 }]} required>
                  <Input placeholder="请输入标题" />
                </Form.Item>
                <Form.Item label="描述" name="description" rules={[{ required: true, max: 120 }]} required>
                  <TextArea placeholder="请输入描述" />
                </Form.Item>
                <Form.Item className={style.formItemCover} label="封面" name="coverLink" rules={[{ required: true }]} required>
                  <Input hidden />
                  {cover && <img className={style.coverImg} src={cover.fileLink} />}
                  <div className={style.coverTrigger}>
                    <UploadTrigger uploadKey={CoverUploadKey} types={['jpg', 'jpeg', 'png']} maxSize={10 * 1024 * 1024}>
                      <a>本地文件</a>
                    </UploadTrigger>
                  </div>
                </Form.Item>
                <Form.Item label=" " name="businessCardId">
                  <Input hidden />
                  <Checkbox className={style.withBusinessCard} checked={businessCardUsed} onChange={e => handleWithCardChange(e.target.checked)}>
                    附带名片
                  </Checkbox>
                  <span
                    className={style.businessCardSetting}
                    onClick={() => {
                      setBusinessCardVisible(true);
                      intendToUseCardRef.current = false;
                    }}
                  >
                    设置名片
                  </span>
                </Form.Item>
                <Form.Item label=" ">
                  <div className={style.buttons}>
                    <Button btnType="primary" loading={submitting} onClick={handleSubmit}>
                      保存
                    </Button>
                    <Button btnType="minorLine" onClick={handleBack}>
                      取消
                    </Button>
                  </div>
                </Form.Item>
              </Form>
            </div>
            <div className={style.preview}>
              <div className={style.previewHeader}>分享示意图</div>
              <div className={style.previewMessage}>
                <img className={style.previewCover} src={previewData.coverLink || DEFAULT_COVER} />
                <div className={style.previewTitle}>{previewData.title || '分享标题'}</div>
                <div className={style.previewDescription}>{previewData.description || '分享内容描述展示'}</div>
                <a className={style.previewLink}>[分享链接]</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FilePicker
        visible={pickerVisible}
        onOk={file => {
          setFile(file);
          setPickerVisible(false);
          form.setFieldsValue({ fileId: file.fileId });
        }}
        onCancel={() => setPickerVisible(false)}
      />
      <BusinessCardEdit
        visible={businessCardVisible}
        businessCardId={mergedBusinessCardId}
        editable={businessCardEditable}
        onCancel={() => setBusinessCardVisible(false)}
        onFinish={businessCard => {
          setBusinessCard(businessCard);
          setBusinessCardVisible(false);
          if (intendToUseCardRef.current) {
            form.setFieldsValue({ businessCardId: businessCard.businessCardId });
            setBusinessCardUsed(true);
            intendToUseCardRef.current = false;
          }
        }}
      />
    </div>
  );
};
