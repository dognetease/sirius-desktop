import { SnsMarketingPlatform, getIn18Text } from 'api';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  apis,
  apiHolder,
  SnsMarketingApi,
  SnsMarketingPost,
  SnsMarketingMedia,
  SnsMarketingMediaType,
  SnsPostType,
  LoadOperation,
  DataStoreApi,
  DataTrackerApi,
} from 'api';
import { Form, Tooltip } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import PostPreview, { translateHandler } from './PostPreview';
import ContentEditor from './ContentEditor';
import MediaList from './MediaList';
import GenerateTip from './GenerateTip';
import PostImageReplace from './PostImageReplace';
import MediaTooltip from './MediaTooltip';
import useAiQuota from './useAiQuota';
import { POST_RULE } from '../utils/rules';
import { getPostEditable, getPostCreatedByAi } from '../utils';
import style from './PostEditModal.module.scss';

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const IMAGE_TOOLTIP_CLOSED = 'IMAGE_TOOLTIP_CLOSED';

interface PostEditModalProps {
  visible?: boolean;
  postDbId?: string | null;
  onFinish?: (post: SnsMarketingPost) => void;
  onCancel?: () => void;
}

type OperatorHandler = (operation: LoadOperation) => void;

const PostEditModal: React.FC<PostEditModalProps> = props => {
  const { visible, postDbId, onFinish, onCancel } = props;

  const postEditRef = useRef<HTMLDivElement>(null);
  const { AiQuota, refreshAiQuota } = useAiQuota({ mode: 'brief' });
  const [form] = Form.useForm();
  const [post, setPost] = useState<SnsMarketingPost | null>(null);
  const [fetching, setFetching] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [contentReplacing, setContentReplacing] = useState<boolean>(false);
  const [imageReplaceContent, setImageReplaceContent] = useState<string>('');
  const [imageReplaceVisible, setImageReplaceVisible] = useState<boolean>(false);
  const [imageReplaceIndex, setImageReplaceIndex] = useState<number>(-1);
  const [imageOriginUrl, setImageOriginUrl] = useState<string | null>(null);
  const [imageTooltipClosed, setImageTooltipClosed] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  // AI 生成的帖子, 支持文本换一换
  const contentReplaceable = !!post && getPostCreatedByAi(post.createType);

  // AI 生成的帖子, 且帖子类型为 "行业资讯", "自定义", 支持 AI 换图
  const mediaReplaceable = !!post && getPostCreatedByAi(post.createType) && [SnsPostType.INDUSTRY, SnsPostType.CUSTOM].includes(post.type);

  // 如果是 ins 平台, 图片必填
  const pictureRequired = !!post && post.platform === SnsMarketingPlatform.INSTAGRAM;
  const pictureUploaded = !!post && post.mediaType === SnsMarketingMediaType.IMAGE && !!post.mediaList?.length;
  const videoUploaded = !!post && post.mediaType === SnsMarketingMediaType.VIDEO && !!post.mediaList?.length;

  const contentHandler = useRef<OperatorHandler | null>(null);

  const handlePostUpdate = (allValues: Record<string, any>) => {
    const content = (allValues.content || '') as string;
    const mediaList = (allValues.mediaList || []) as SnsMarketingMedia[];
    const videoList = (allValues.videoList || []) as SnsMarketingMedia[];
    const mediaType = videoList.length ? SnsMarketingMediaType.VIDEO : mediaList.length ? SnsMarketingMediaType.IMAGE : undefined;

    if (pictureRequired) {
      if (post.type === SnsPostType.COMPANY_INFO) {
        if (mediaList.length && !videoList.length) {
          form.resetFields(['videoList']);
        }
        if (!mediaList.length && videoList.length) {
          form.resetFields(['mediaList']);
        }
      }
    }

    setPost(post => {
      const translatePayload: Partial<SnsMarketingPost> =
        content !== post!.content
          ? {
              translateChecked: false,
              translateResult: '',
            }
          : {};

      return {
        ...post!,
        content,
        mediaList: mediaType === SnsMarketingMediaType.VIDEO ? videoList : mediaList,
        mediaType,
        ...translatePayload,
      };
    });
  };

  const handleContentReplace = () => {
    setPost({
      ...post!,
      translateChecked: false,
      translateResult: '',
    });
    setContentReplacing(true);

    snsMarketingApi
      .getReplaceContent(
        {
          postDbId: post!.postDbId,
        },
        {
          timeout: 2 * 60 * 1000,
          operator: (handler: OperatorHandler) => {
            contentHandler.current = handler;
          },
        }
      )
      .then(res => {
        if (res.contents.length) {
          const nextContent = res.contents[0];

          form.setFieldsValue({ content: nextContent });
          setPost(post => ({
            ...post!,
            content: nextContent,
          }));
          Message.success(getIn18Text('YIGENGHUANWEIXINDETIE'));
          refreshAiQuota();
        }
      })
      .finally(() => {
        setContentReplacing(false);
      });

    trackerApi.track('waimao_SoMediaOperation_postedit_action', {
      type: 'changeword',
    });
  };

  const handleImageReplaceReset = () => {
    setImageReplaceContent('');
    setImageReplaceVisible(false);
    setImageReplaceIndex(-1);
    setImageOriginUrl(null);
  };

  const handleImageReplace = (nextImageUrl: string) => {
    if (post) {
      const mediaList: SnsMarketingMedia[] = form.getFieldValue('mediaList') || [];
      const nextMediaList = mediaList.map((item, index) => {
        if (index === imageReplaceIndex)
          return {
            ...item,
            url: nextImageUrl,
          };
        return item;
      });

      form.setFieldsValue({ mediaList: nextMediaList });
      setPost(post => ({
        ...post!,
        mediaList: nextMediaList,
      }));
      Message.success(getIn18Text('YIGENGHUANWEIXINDETU'));
      handleImageReplaceReset();
    }
  };

  const handleSubmit = () => {
    if (post) {
      form.validateFields().then(allValues => {
        const mediaList = (allValues.mediaList || []) as SnsMarketingMedia[];
        const videoList = (allValues.videoList || []) as SnsMarketingMedia[];
        const mediaType = videoList.length ? SnsMarketingMediaType.VIDEO : mediaList.length ? SnsMarketingMediaType.IMAGE : undefined;

        const submitPost = {
          ...post,
          ...allValues,
          mediaList: mediaType === SnsMarketingMediaType.VIDEO ? videoList : mediaList,
          mediaType,
        };

        setSubmitting(true);
        snsMarketingApi
          .updateSnsPost(submitPost)
          .then(() => {
            onFinish && onFinish(submitPost);
          })
          .finally(() => {
            setSubmitting(false);
          });
      });
    }
  };

  useEffect(() => {
    if (visible && postDbId) {
      setFetching(true);

      snsMarketingApi
        .getSnsPost({ postDbId })
        .then(nextPost => {
          setPost(nextPost);
          form.setFieldsValue({
            content: nextPost.content || '',
            mediaList: nextPost.mediaType === SnsMarketingMediaType.VIDEO ? [] : nextPost.mediaList || [],
            videoList: nextPost.mediaType === SnsMarketingMediaType.VIDEO ? nextPost.mediaList || [] : [],
          });
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [visible, postDbId]);

  useEffect(() => {
    if (visible) {
      setImageTooltipClosed(!!dataStoreApi.getSync(IMAGE_TOOLTIP_CLOSED).data);
    } else {
      setPost(null);
      form.resetFields();
      refreshAiQuota();
      contentHandler.current?.('abort');
    }
  }, [visible]);

  const disabled = useMemo(() => {
    if (!post) return true;
    if (!getPostEditable(post.postStatus)) return true;
    if (contentReplacing) return true;

    return false;
  }, [post, contentReplacing]);

  return (
    <>
      <Modal
        className={style.postEditModal}
        width={1107}
        title={
          <div className={style.title}>
            <span>{getIn18Text('BIANJITIEZI')}</span>
            <AiQuota className={style.aiQuota} />
          </div>
        }
        visible={visible && !imageReplaceVisible}
        keyboard={false}
        maskClosable={false}
        okButtonProps={{
          loading: submitting,
          disabled,
        }}
        onOk={handleSubmit}
        onCancel={onCancel}
      >
        <div className={style.postEdit} ref={postEditRef}>
          <div className={style.config}>
            <Form
              className={style.form}
              form={form}
              layout="vertical"
              onValuesChange={(_, allValues) => {
                handlePostUpdate(allValues);
              }}
            >
              <Form.Item
                label={getIn18Text('TIEZINEIRONG')}
                name="content"
                valuePropName="content"
                initialValue=""
                rules={[{ required: true }, { max: POST_RULE.textMaxLength }]}
                required
              >
                <ContentEditor disabled={disabled} aiReplaceable={contentReplaceable} onAiReplaceClick={handleContentReplace} />
              </Form.Item>
              <Form.Item
                label={
                  <div className={style.mediaListLabel}>
                    <div className={style.label}>{getIn18Text('SHANGCHUANTUPIAN')}</div>
                    <MediaTooltip className={style.mediaTooltip} />
                    {!mediaReplaceable && <div className={style.unsupportText}>{getIn18Text('(JINXINGYEZIXUNLEI')}</div>}
                    {mediaReplaceable && (
                      <Tooltip
                        getPopupContainer={() => postEditRef.current || document.body}
                        overlayClassName={style.imageReplaceTooltip}
                        placement="topLeft"
                        visible={!imageTooltipClosed}
                        title={
                          <>
                            {getIn18Text('DUIAIZIDONGSHENGCHENG')}
                            <a
                              onClick={() => {
                                setImageTooltipClosed(true);
                                dataStoreApi.putSync(IMAGE_TOOLTIP_CLOSED, '1');
                              }}
                            >
                              {getIn18Text('ZHIDAOLE')}
                            </a>
                          </>
                        }
                      >
                        <div className={style.imageReplaceTooltipTrigger} />
                      </Tooltip>
                    )}
                  </div>
                }
                name="mediaList"
                valuePropName="mediaList"
                initialValue={[]}
                rules={[{ required: pictureRequired && !videoUploaded, message: '' }]}
                required={pictureRequired && !videoUploaded}
              >
                <MediaList
                  disabled={disabled || videoUploaded || uploading}
                  deletable
                  uploadable
                  aiReplaceable={mediaReplaceable}
                  onAiReplaceClick={index => {
                    const mediaList: SnsMarketingMedia[] = form.getFieldValue('mediaList') || [];
                    const content: string = form.getFieldValue('content') || '';

                    setImageReplaceContent(content);
                    setImageReplaceVisible(true);
                    setImageReplaceIndex(index);
                    setImageOriginUrl(mediaList[index].url);
                    trackerApi.track('waimao_SoMediaOperation_postedit_action', {
                      type: 'changepicture',
                    });
                  }}
                  onUploading={setUploading}
                />
              </Form.Item>
              {post?.type === ('' as any) || post?.type === SnsPostType.COMPANY_INFO ? (
                <Form.Item
                  label={
                    <div className={style.mediaListLabel}>
                      <div className={style.label}>上传视频</div>
                      <MediaTooltip className={style.mediaTooltip} mediaType={SnsMarketingMediaType.VIDEO} />
                    </div>
                  }
                  name="videoList"
                  valuePropName="mediaList"
                  initialValue={[]}
                  rules={[{ required: pictureRequired && !pictureUploaded, message: '' }]}
                  required={pictureRequired && !pictureUploaded}
                >
                  <MediaList
                    disabled={disabled || pictureUploaded || uploading}
                    deletable
                    uploadable
                    mediaType={SnsMarketingMediaType.VIDEO}
                    onUploading={setUploading}
                  />
                </Form.Item>
              ) : null}
              {pictureRequired && !pictureUploaded && !videoUploaded && (
                <Form.Item className={style.pictureRequiredFormItem}>
                  <div className={style.pictureRequiredTip}>已选择Instagram社媒，必须上传图片或视频才可发帖</div>
                </Form.Item>
              )}
            </Form>
          </div>
          <div className={style.preview}>
            {contentReplacing && <GenerateTip className={style.generateTip} status="generating" content={getIn18Text('ZHENGZAIGENGHUANTIEZINEI')} />}
            <div className={style.post}>
              <PostPreview
                className={style.postPreview}
                post={post}
                contentGenerating={contentReplacing}
                translatable
                onTranslate={(checked, contentHTML) => {
                  if (post) {
                    if (!checked) {
                      return setPost({
                        ...post,
                        translateChecked: false,
                      });
                    }

                    if (post.translateResult || post.translating) {
                      return setPost({
                        ...post,
                        translateChecked: true,
                      });
                    }

                    setPost({
                      ...post,
                      translating: true,
                      translateChecked: true,
                    });

                    translateHandler(contentHTML)
                      .then(translateHTML => {
                        setPost(post =>
                          post
                            ? {
                                ...post,
                                translating: false,
                                translateResult: translateHTML,
                              }
                            : post
                        );
                      })
                      .catch((error: Error) => {
                        setPost(post =>
                          post
                            ? {
                                ...post,
                                translating: false,
                                translateResult: '',
                                translateChecked: false,
                              }
                            : post
                        );
                        Message.error(error.message);
                      });
                  }
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
      <PostImageReplace visible={imageReplaceVisible} post={post} originUrl={imageOriginUrl} onReplace={handleImageReplace} onCancel={handleImageReplaceReset} />
    </>
  );
};

export default PostEditModal;
