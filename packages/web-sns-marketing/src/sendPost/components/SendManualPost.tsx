import { getIn18Text } from 'api';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import qs from 'querystring';
import classnames from 'classnames';
import moment from 'moment';
import { apiHolder, apis, SnsMarketingApi, SnsMarketingPost, SnsMarketingAccount, SnsMarketingMedia, SnsMarketingMediaType, SnsMarketingPlatform } from 'api';
import { navigate, useLocation } from '@reach/router';
import { Button, Form } from 'antd';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import { Radio } from '@web-common/components/UI/Radio';
import Radio from '@lingxi-common-component/sirius-ui/Radio';
import ContentEditor from '../../components/ContentEditor';
import MediaList from '../../components/MediaList';
import AccountsSelect from '../../components/AccountsSelect';
import PostPreview, { translateHandler } from '../../components/PostPreview';
import useAiQuota from '../../components/useAiQuota';
import MediaTooltip from '../../components/MediaTooltip';
import { CronSendModal, CronSendModalMethods } from '@web-edm/send/cronSend';
import { POST_RULE } from '../../utils/rules';
import PostContentRefine from '../../components/PostContentRefine';
import { ReactComponent as ArrowRight } from '@web-sns-marketing/images/arrow-right.svg';
import { ReactComponent as EmptyIcon } from '@web-sns-marketing/images/empty.svg';
import style from './SendManualPost.module.scss';

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;

const PAGE_NAME_MAP: Record<string, string> = {
  snsPostManage: getIn18Text('TIEZIGUANLIv16'),
  snsCalendar: getIn18Text('YINGXIAORILI'),
};

interface SendManualPostProps {
  className?: string;
  visible: boolean;
  tabs: React.ReactElement;
}

interface CronSendConfig {
  time: string;
  timeZone: string;
  country: string;
}

const SendManualPost: React.FC<SendManualPostProps> = props => {
  const { className, visible, tabs } = props;
  const location = useLocation();
  const [fromPage, setFromPage] = useState<string>('snsPostManage');
  const [fromPageName, setFromPageName] = useState<string>(getIn18Text('TIEZIGUANLIv16'));
  const { AiQuota } = useAiQuota();
  const hasChangedRef = useRef(false);
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);
  const [previewPosts, setPreviewPosts] = useState<(SnsMarketingPost & { key: number })[]>([]);

  // 和实际帖子发送的有关
  const cronSend = Boolean(form.getFieldValue('cronSend'));
  const cronTime = form.getFieldValue('cronTime') as number;

  // 只用于维护定时弹窗状态、及定时配置回显
  const [cronSendVisible, setCronSendVisible] = useState<boolean>(false);
  const [cronSendConfig, setCronSendConfig] = useState<CronSendConfig | null>(null);
  const cronSendModalRef = useRef<CronSendModalMethods>(null);
  const cronTimeText = cronSendConfig ? `${cronSendConfig.country} ${cronSendConfig.timeZone} ${cronSendConfig.time}` : '';

  const [refineVisible, setRefineVisible] = useState<boolean>(false);
  const [refineContent, setRefineContent] = useState<string>('');

  // 选择了 ins 账号, 图片必填
  const [pictureRequired, setPictureRequired] = useState<boolean>(false);
  const [pictureUploaded, setPictureUploaded] = useState<boolean>(false);
  const [videoUploaded, setVideoUploaded] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    const queryString = location.hash.substring(1).split('?')[1];

    if (queryString) {
      const query = qs.parse(queryString);
      const from = query.from as string;
      const cronTime = +((query.cronTime as string) || '');

      if (from) {
        setFromPage(from);
        setFromPageName(PAGE_NAME_MAP[from]);
      }

      if (cronTime) {
        form.setFieldsValue({
          cronSend: 1,
          cronTime,
        });

        const nextCronSendConfig: CronSendConfig = {
          time: moment(cronTime).format('YYYY-MM-DD HH:mm:ss'),
          timeZone: '+08:00',
          country: getIn18Text('ZHONGGUO'),
        };

        setCronSendConfig(nextCronSendConfig);
        handleCronSendConfigSync(nextCronSendConfig);
      }
    }
  }, [location.hash]);

  const handlePreviewUpdate = (allValues: Record<string, any>) => {
    const accounts = (allValues.accounts || []) as SnsMarketingAccount[];
    const content = (allValues.content || '') as string;
    const mediaList = (allValues.mediaList || []) as SnsMarketingMedia[];
    const videoList = (allValues.videoList || []) as SnsMarketingMedia[];
    const mediaType = videoList.length ? SnsMarketingMediaType.VIDEO : mediaList.length ? SnsMarketingMediaType.IMAGE : undefined;
    const now = Date.now();

    setPreviewPosts(
      accounts.map(
        (account, index) =>
          ({
            key: now + index,
            content,
            mediaList: mediaType === SnsMarketingMediaType.VIDEO ? videoList : mediaList,
            mediaType,
            platform: account.platform,
            publishedName: account.accountName,
            publishedAvatar: account.accountAvatar,
          } as SnsMarketingPost & { key: number })
      )
    );
  };

  const handlePostSend = () => {
    if (cronSend && cronTime < Date.now()) {
      return Message.error(getIn18Text('DINGSHIFABUSHIJIANBU'));
    }

    form.validateFields().then(values => {
      const mediaList = (values.mediaList || []) as SnsMarketingMedia[];
      const videoList = (values.videoList || []) as SnsMarketingMedia[];
      const mediaType = videoList.length ? SnsMarketingMediaType.VIDEO : mediaList.length ? SnsMarketingMediaType.IMAGE : undefined;

      const accounts = values.cronSend ? values.accounts.map((item: SnsMarketingAccount) => ({ ...item, cronTime: values.cronTime })) : values.accounts;

      if (mediaType === SnsMarketingMediaType.VIDEO) {
        values.mediaList = values.videoList;
      }
      delete values.videoList;

      setSending(true);
      snsMarketingApi
        .sendManualPost({
          ...values,
          accounts,
          mediaType,
        })
        .then(() => {
          Message.success(getIn18Text('FASONGCHENGGONG'));
          navigate(`#site?page=${fromPage}`);
        })
        .finally(() => {
          setSending(false);
        });
    });
  };

  const handleBack = () => {
    const backHandler = () => {
      navigate(`#site?page=${fromPage}`);
    };

    if (hasChangedRef.current) {
      Modal.confirm({
        title: getIn18Text('TUICHUSHOUDONGXIETIE？'),
        content: getIn18Text('TIEZIHAIWEIFABU，'),
        onOk: backHandler,
      });
    } else {
      backHandler();
    }
  };

  const handleCronSendOk = (time: string, timeZone: string, country: string) => {
    const [dateString, timeString] = time.split(' ');
    const date = moment(`${dateString}T${timeString}${timeZone}`);
    const nextCronTime = date.utcOffset(timeZone).valueOf();

    form.setFieldsValue({ cronTime: nextCronTime, cronSend: 1 });
    setCronSendConfig({ time, timeZone, country });
    setCronSendVisible(false);
    return Promise.resolve(true);
  };

  const handleCronSendCancel = () => {
    if (!cronTime) {
      form.setFieldsValue({ cronSend: 0 });
    }
    setCronSendVisible(false);
  };

  const handleCronSendConfigSync = (config: CronSendConfig | null = cronSendConfig) => {
    if (config) {
      const { time, timeZone, country } = config;

      cronSendModalRef.current?.setCronSendTime(time, timeZone, country);
    }
  };

  const handleCronSendOpen = () => {
    setCronSendVisible(true);
    handleCronSendConfigSync();
  };

  const updatePost = (key: number, payload: Partial<SnsMarketingPost>) => {
    setPreviewPosts(posts => posts.map(item => (item.key === key ? { ...item, ...payload } : item)));
  };

  if (!visible) return null;

  return (
    <div className={classnames(style.sendManualPost, className)}>
      <div className={style.header}>
        <div className={classnames(style.headerContent, 'sirius-no-drag')}>
          <div className={style.from} onClick={handleBack}>
            {fromPageName}
          </div>
          <ArrowRight className={style.arrow} />
          <div className={style.title}>{getIn18Text('FABUTIEZI')}</div>
          <AiQuota className={style.aiQuota} />
        </div>
      </div>
      <div className={style.body}>
        <div className={style.config}>
          <div className={style.tabs}>{tabs}</div>
          <Form
            className={style.form}
            form={form}
            labelAlign="left"
            labelCol={{ flex: '80px' }}
            wrapperCol={{ flex: 1 }}
            onValuesChange={(_, allValues: any) => {
              const nextPictureRequired = (allValues.accounts || []).some((item: SnsMarketingAccount) => item.platform === SnsMarketingPlatform.INSTAGRAM);
              const nextPictureUploaded = !!(allValues.mediaList || []).length;
              const nextVideoUploaded = !!(allValues.videoList || []).length;

              setPictureRequired(nextPictureRequired);
              setPictureUploaded(nextPictureUploaded);
              setVideoUploaded(nextVideoUploaded);
              handlePreviewUpdate(allValues);
              hasChangedRef.current = true;

              if (!nextPictureRequired) {
                let fields = [];
                if (!nextPictureUploaded) fields.push('mediaList');
                if (!nextVideoUploaded) fields.push('videoList');
                if (fields.length) form.resetFields(fields);
              }

              if (nextPictureRequired) {
                if (!nextPictureUploaded && nextVideoUploaded) {
                  form.resetFields(['mediaList']);
                }
                if (nextPictureUploaded && !nextVideoUploaded) {
                  form.resetFields(['videoList']);
                }
              }
            }}
          >
            <Form.Item
              label={getIn18Text('SHEMEIZHUYE')}
              name="accounts"
              valuePropName="accounts"
              initialValue={[]}
              rules={[{ required: true, message: getIn18Text('QINGXUANZESHEMEIZHUYE') }]}
              required
            >
              <AccountsSelect maxTagCount="responsive" />
            </Form.Item>
            <Form.Item
              label={getIn18Text('TIEZINEIRONG')}
              name="content"
              valuePropName="content"
              initialValue=""
              rules={[{ required: true }, { max: POST_RULE.textMaxLength }]}
              required
            >
              <ContentEditor
                aiRefinable
                onAiRefineClick={text => {
                  setRefineVisible(true);
                  setRefineContent(text);
                }}
              />
            </Form.Item>
            <Form.Item
              label={
                <div className={style.labelWrapper}>
                  <div className={style.label}>{getIn18Text('SHANGCHUANTUPIAN')}</div>
                  <MediaTooltip className={style.extra} />
                </div>
              }
              name="mediaList"
              valuePropName="mediaList"
              initialValue={[]}
              rules={[{ required: pictureRequired && !videoUploaded, message: '' }]}
              required={pictureRequired && !videoUploaded}
            >
              <MediaList disabled={videoUploaded || uploading} deletable uploadable onUploading={setUploading} />
            </Form.Item>
            <Form.Item
              label={
                <div className={style.labelWrapper}>
                  <div className={style.label}>上传视频</div>
                  <MediaTooltip className={style.extra} mediaType={SnsMarketingMediaType.VIDEO} />
                </div>
              }
              name="videoList"
              valuePropName="videoList"
              initialValue={[]}
              rules={[{ required: pictureRequired && !pictureUploaded, message: '' }]}
              required={pictureRequired && !pictureUploaded}
            >
              <MediaList disabled={pictureUploaded || uploading} deletable uploadable mediaType={SnsMarketingMediaType.VIDEO} onUploading={setUploading} />
            </Form.Item>
            {pictureRequired && !pictureUploaded && !videoUploaded && (
              <Form.Item label=" " className={style.pictureRequiredFormItem}>
                <div className={style.pictureRequiredTip}>已选择Instagram社媒，必须上传图片或视频才可发帖</div>
              </Form.Item>
            )}
            <Form.Item
              className={style.radioFormItem}
              label={getIn18Text('FABUSHIJIAN')}
              name="cronSend"
              initialValue={0}
              getValueFromEvent={event => event.target.value}
              rules={[{ required: true }]}
              required
            >
              <Radio.Group>
                <Radio
                  value={0}
                  onClick={() => {
                    form.setFieldsValue({ cronTime: undefined });
                    setCronSendConfig(null);
                  }}
                >
                  {getIn18Text('LIJIFABU')}
                </Radio>
                <Radio value={1} onClick={handleCronSendOpen}>
                  {getIn18Text('DINGSHIFABU')}
                </Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="cronTime" noStyle />
            {cronTimeText && (
              <Form.Item label=" ">
                <Input size="middle" readOnly value={cronTimeText} onClick={handleCronSendOpen} />
              </Form.Item>
            )}
          </Form>
        </div>
        <div className={style.preview}>
          {previewPosts.map(post => (
            <PostPreview
              className={style.postPreview}
              key={post.key}
              post={post}
              translatable
              onTranslate={(checked, contentHTML) => {
                if (!checked) {
                  return updatePost(post.key, { translateChecked: false });
                }

                if (post.translateResult || post.translating) {
                  return updatePost(post.key, { translateChecked: true });
                }

                updatePost(post.key, {
                  translating: true,
                  translateChecked: true,
                });

                translateHandler(contentHTML)
                  .then(translateHTML => {
                    updatePost(post.key, {
                      translating: false,
                      translateResult: translateHTML,
                    });
                  })
                  .catch((error: Error) => {
                    updatePost(post.key, {
                      translating: false,
                      translateResult: '',
                      translateChecked: false,
                    });
                    Message.error(error.message);
                  });
              }}
            />
          ))}
          {!previewPosts.length && (
            <div className={style.empty}>
              <EmptyIcon className={style.emptyIcon} />
              <div className={style.emptyTip}>
                {getIn18Text('ZANWUXIANGGUANDETIEZI')}
                <br />
                {getIn18Text('ZAIZUOCESHURUTIEZI')}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={style.footer}>
        <Button onClick={handleBack}>{getIn18Text('CLOSE_TXT')}</Button>
        <Button type="primary" loading={sending} onClick={handlePostSend}>
          {getIn18Text('FABU')}
        </Button>
      </div>
      <CronSendModal visible={cronSendVisible} sendModeVisible={false} onSend={handleCronSendOk} onCancel={handleCronSendCancel} />
      <PostContentRefine
        visible={refineVisible}
        content={refineContent}
        onCancel={() => {
          setRefineVisible(false);
          setRefineContent('');
        }}
        onRefine={content => {
          setRefineVisible(false);
          setRefineContent('');
          form.setFieldsValue({
            content: content,
          });
          handlePreviewUpdate(form.getFieldsValue());
        }}
      />
    </div>
  );
};

export default SendManualPost;
