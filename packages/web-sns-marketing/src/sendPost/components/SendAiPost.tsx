import { SnsMarketingAccount, SnsMarketingPlatform, getIn18Text } from 'api';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import { Form, Switch, Button } from 'antd';
import {
  apiHolder,
  apis,
  SnsMarketingApi,
  SnsMarketingPost,
  SnsPostType,
  SnsPostStatus,
  getSnsPostTypeName,
  SnsMarketingAiPicStyle,
  getSnsMarketingAiPicStyleName,
  SnsMarketingMediaType,
} from 'api';
import qs from 'querystring';
import { navigate, useLocation } from '@reach/router';
import { CronSendModal, CronSendModalMethods } from '@web-edm/send/cronSend';
import PostPreview, { translateHandler } from '../../components/PostPreview';
import AccountsSelect from '../../components/AccountsSelect';
import PostEditModal from '../../components/PostEditModal';
import MediaList from '../../components/MediaList';
import GenerateTip from '../../components/GenerateTip';
import MediaTooltip from '../../components/MediaTooltip';
import ReplaceImagePopover from '../../components/ReplaceImagePopover';
import useAiQuota from '../../components/useAiQuota';
import { getPostEditable, getPostsMapFromList } from '../../utils';
import { ReactComponent as ArrowRight } from '@web-sns-marketing/images/arrow-right.svg';
import { ReactComponent as EmptyIcon } from '@web-sns-marketing/images/empty.svg';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import { Radio } from '@web-common/components/UI/Radio';
import Radio from '@lingxi-common-component/sirius-ui/Radio';
// import { EnhanceSelect as Select, InSingleOption as Option } from '@web-common/components/UI/Select';
import { EnhanceSelect as Select, InSingleOption as Option } from '@lingxi-common-component/sirius-ui/Select';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './SendAiPost.module.scss';

const { TextArea } = Input;

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;
const SnsPostTypeName = getSnsPostTypeName();
const SnsMarketingAiPicStyleName = getSnsMarketingAiPicStyleName();

const POLLING_DELAY = 3000;
const INPUT_MAX_COUNT = 50;
const TEXTAREA_MAX_COUNT = 500;

const PAGE_NAME_MAP: Record<string, string> = {
  snsPostManage: getIn18Text('TIEZIGUANLIv16'),
  snsCalendar: getIn18Text('YINGXIAORILI'),
};

const showCountHandler = {
  formatter: (info: { count: number }) => `${TEXTAREA_MAX_COUNT - info.count}`,
};

interface SendAiPostProps {
  className?: string;
  visible?: boolean;
  tabs?: React.ReactElement;
}

interface CronSendConfig {
  time: string;
  timeZone: string;
  country: string;
}

type TaskStatus = 'initial' | 'creating' | 'retrying' | 'generating' | 'success' | 'error';

const SendAiPost: React.FC<SendAiPostProps> = props => {
  const { className, visible, tabs } = props;
  const location = useLocation();
  const [fromPage, setFromPage] = useState<string>('snsPostManage');
  const [fromPageName, setFromPageName] = useState<string>(getIn18Text('TIEZIGUANLIv16'));
  const { AiQuota, refreshAiQuota } = useAiQuota();
  const hasChangedRef = useRef(false);
  const [industries, setIndustries] = useState<{ label: string; value: string }[]>([]);
  const [languages, setLanguages] = useState<{ label: string; value: string }[]>([]);
  const [tones, setTones] = useState<{ label: string; value: string }[]>([]);
  const [form] = Form.useForm();
  const [posts, setPosts] = useState<SnsMarketingPost[]>([]);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('initial');
  const generatingCount = posts.filter(item => item.postStatus === SnsPostStatus.GENERATING).length;
  const finishCount = posts.filter(item => item.postStatus === SnsPostStatus.FINISH_GENERATE).length;
  const failedCount = posts.filter(item => item.postStatus === SnsPostStatus.FAILED_GENERATE).length;
  const [postSending, setPostSending] = useState<boolean>(false);
  const postSendable = taskStatus === 'success' || (taskStatus === 'error' && finishCount > 0);
  const batchIdRef = useRef<string>();
  const [postEditVisible, setPostEditVisible] = useState<boolean>(false);
  const [editingPostDbId, setEditingPostDbId] = useState<string | null>(null);

  // 和实际帖子发送的有关
  const cronSend = Boolean(form.getFieldValue('cronSend'));
  const cronTime = form.getFieldValue('cronTime') as number;

  // 只用于维护定时弹窗状态、及定时配置回显
  const [cronSendVisible, setCronSendVisible] = useState<boolean>(false);
  const [cronSendConfig, setCronSendConfig] = useState<CronSendConfig | null>(null);
  const cronSendModalRef = useRef<CronSendModalMethods>(null);
  const cronTimeText = cronSendConfig ? `${cronSendConfig.country} ${cronSendConfig.timeZone} ${cronSendConfig.time}` : '';

  // 选择了 ins 账号, 图片必填
  const [pictureRequired, setPictureRequired] = useState<boolean>(false);
  const [pictureUploaded, setPictureUploaded] = useState<boolean>(false);
  const [videoUploaded, setVideoUploaded] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    snsMarketingApi.getSnsTaskAiParam().then(res => {
      setIndustries(res.industries);
      setLanguages(res.languages);
      setTones(res.tones);
      form.setFieldsValue({
        companyName: res.companyName,
        tone: res.tones[0]?.value,
        language: res.languages[0]?.value,
      });
    });
  }, []);

  const pollingTimer = useRef<NodeJS.Timer | null>(null);

  const handleTimerClear = () => {
    pollingTimer.current && clearInterval(pollingTimer.current);
  };

  useEffect(() => handleTimerClear, []);

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

  const handleAiTaskCreate = (allValues: any) => {
    if (allValues.picGenerateReq) {
      if (allValues.picGenerateReq?.pictureStyle === -1) {
        delete allValues.picGenerateReq;
      }
    }

    allValues.discardBatchId = batchIdRef.current;
    allValues.wordsUpperLimit = allValues.wordsUpperLimit === 0 ? undefined : allValues.wordsUpperLimit;

    setPosts([]);
    setTaskStatus('creating');

    snsMarketingApi
      .createAiPostTask(allValues)
      .then(res => {
        setTaskStatus('generating');
        handleTimerClear();
        handleTaskPolling(res.batchId);
        batchIdRef.current = res.batchId;
      })
      .catch(() => {
        setTaskStatus('initial');
      });
  };

  const handleTaskPolling = (taskId: string) => {
    const handler = () => {
      snsMarketingApi.getAiTaskPosts({ taskId }).then(nextPosts => {
        const postsAllSettled = nextPosts.every(item => item.postStatus !== SnsPostStatus.GENERATING);
        const postsAllSuccess = nextPosts.every(item => item.postStatus === SnsPostStatus.FINISH_GENERATE);

        if (postsAllSettled) {
          handleTimerClear();
          setTaskStatus(postsAllSuccess ? 'success' : 'error');
        }
        setPosts(posts => {
          const postsMap = getPostsMapFromList(posts);

          // 为保持翻译结果, 需要更新时留存旧字段
          return nextPosts.map(item => ({
            ...postsMap[item.postDbId],
            ...item,
          }));
        });
        refreshAiQuota();
      });
    };
    handler();
    pollingTimer.current = setInterval(handler, POLLING_DELAY);
  };

  const handlePostSend = () => {
    if (cronSend && cronTime < Date.now()) {
      return Message.error(getIn18Text('DINGSHIFABUSHIJIANBU'));
    }

    if (batchIdRef.current) {
      setPostSending(true);

      snsMarketingApi
        .sendAiPost({
          batchId: batchIdRef.current,
          cronSend,
          cronTime,
        })
        .then(() => {
          Message.success(getIn18Text('FASONGCHENGGONG'));
          navigate(`#site?page=${fromPage}`);
        })
        .finally(() => {
          setPostSending(false);
        });
    }
  };

  const handleBack = () => {
    const backHandler = () => {
      navigate(`#site?page=${fromPage}`);
    };

    if (hasChangedRef.current) {
      Modal.confirm({
        title: getIn18Text('TUICHUAIXIETIE？'),
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

  const updatePost = (postDbId: string, payload: Partial<SnsMarketingPost>) => {
    setPosts(posts => posts.map(item => (item.postDbId === postDbId ? { ...item, ...payload } : item)));
  };

  const companyNameFormItem = (
    <Form.Item label={getIn18Text('GONGSIMINGCHENG')} name="companyName" rules={[{ required: true, max: INPUT_MAX_COUNT }]} required>
      <Input size="middle" placeholder={getIn18Text('QINGTIANXIEGONGSIMINGCHENG')} />
    </Form.Item>
  );

  const industryFormItem = (
    <Form.Item label={getIn18Text('SUOSHUXINGYE')} name="industry" rules={[{ required: true }]} required>
      <Select size="large" placeholder={getIn18Text('QINGXUANZESUOSHUXINGYE')} options={industries} />
    </Form.Item>
  );

  const companyProfileFormItem = (
    <Form.Item label={getIn18Text('GONGSIJIESHAO')} name="companyProfile" rules={[{ required: true, max: TEXTAREA_MAX_COUNT }]} required>
      <TextArea placeholder={getIn18Text('QINGJIANDANJIESHAONINDE')} rows={4} showCount={showCountHandler} />
    </Form.Item>
  );

  const companySiteFormItem = (
    <Form.Item label={getIn18Text('GONGSIGUANWANG')} name="companySite" rules={[{ max: INPUT_MAX_COUNT }]}>
      <Input size="middle" placeholder={getIn18Text('KETIANXIEGONGSIGUANWANG')} />
    </Form.Item>
  );

  const pictureRequiredFormItem = (
    <Form.Item label=" " className={style.pictureRequiredFormItem}>
      <div className={style.pictureRequiredTip}>{getIn18Text('YIXUANZEInst')}</div>
    </Form.Item>
  );

  const companyUrlsFormItem = (
    <Form.Item
      label={
        <div className={style.labelWrapper}>
          <div className={style.label}>{getIn18Text('GONGSITUPIAN')}</div>
          <MediaTooltip className={style.extra} />
        </div>
      }
      name="companyUrls"
      getValueProps={(companyUrls: string[]) => ({ mediaList: (companyUrls || []).map(item => ({ url: item })) })}
      getValueFromEvent={(mediaList: { url: string }[]) => (mediaList || []).map(item => item.url)}
      initialValue={[]}
      rules={[{ required: pictureRequired && !videoUploaded, message: getIn18Text('QINGSHANGCHUANGONGSITUPIAN') }]}
      required={pictureRequired && !videoUploaded}
    >
      <MediaList disabled={videoUploaded || uploading} deletable uploadable onUploading={setUploading} />
    </Form.Item>
  );

  const companyVideoFormItem = (
    <Form.Item
      label={
        <div className={style.labelWrapper}>
          <div className={style.label}>公司视频</div>
          <MediaTooltip className={style.extra} mediaType={SnsMarketingMediaType.VIDEO} />
        </div>
      }
      name="companyVideoUrls"
      getValueProps={(companyUrls: string[]) => ({ mediaList: (companyUrls || []).map(item => ({ url: item })) })}
      getValueFromEvent={(mediaList: { url: string }[]) => (mediaList || []).map(item => item.url)}
      initialValue={[]}
      rules={[{ required: pictureRequired && !pictureUploaded, message: '' }]}
      required={pictureRequired && !pictureUploaded}
    >
      <MediaList disabled={pictureUploaded || uploading} deletable uploadable mediaType={SnsMarketingMediaType.VIDEO} onUploading={setUploading} />
    </Form.Item>
  );

  const toneLanguageFormItem = (
    <Form.Item label={getIn18Text('YUQIYUZHONG')} required>
      <div className={style.toneLanguage}>
        <Form.Item name="tone" noStyle>
          <Select style={{ width: '50%' }} size="large" placeholder={getIn18Text('QINGXUANZEYUQI')} options={tones} />
        </Form.Item>
        <Form.Item name="language" noStyle>
          <Select style={{ width: '50%' }} size="large" placeholder={getIn18Text('QINGXUANZEYUZHONG')} options={languages} />
        </Form.Item>
      </div>
    </Form.Item>
  );

  const aiGeneratePicFormItem = (
    <Form.Item label={getIn18Text('AISHENGCHENGTUPIAN')} name="generatePic" initialValue={true} valuePropName="checked">
      <Switch />
    </Form.Item>
  );

  const productNameFormItem = (
    <Form.Item label={getIn18Text('SHANGPINMINGCHENG')} name="productName" rules={[{ required: true, max: INPUT_MAX_COUNT }]} required>
      <Input size="middle" placeholder={getIn18Text('QINGTIANXIESHANGPINMINGCHENG')} />
    </Form.Item>
  );

  const productDescFormItem = (
    <Form.Item label={getIn18Text('SHANGPINMIAOSHU')} name="productDesc" rules={[{ required: true, max: TEXTAREA_MAX_COUNT }]} required>
      <TextArea placeholder={getIn18Text('QINGMIAOSHUNINDEZHUYING')} rows={4} showCount={showCountHandler} />
    </Form.Item>
  );

  const productUrlsFormItem = (
    <>
      <Form.Item
        label={
          <div className={style.labelWrapper}>
            <div className={style.label}>{getIn18Text('SHANGPINTUPIAN')}</div>
            <MediaTooltip className={style.extra} />
          </div>
        }
        name="productUrls"
        getValueProps={(productUrls: string[]) => ({ mediaList: (productUrls || []).map(item => ({ url: item })) })}
        getValueFromEvent={(mediaList: { url: string }[]) => (mediaList || []).map(item => item.url)}
        initialValue={[]}
        rules={[{ required: pictureRequired, message: getIn18Text('QINGSHANGCHUANSHANGPINTUPIAN') }]}
        required={pictureRequired}
      >
        <MediaList deletable uploadable />
      </Form.Item>
      {pictureRequired && !pictureUploaded && pictureRequiredFormItem}
    </>
  );

  const productSiteFormItem = (
    <Form.Item label={getIn18Text('SHANGPINWANGZHI')} name="productSite" rules={[{ max: INPUT_MAX_COUNT }]}>
      <Input size="middle" placeholder={getIn18Text('KETIANXIEXIANGQINGYEWANG')} />
    </Form.Item>
  );

  const customFormItem = (
    <Form.Item label={getIn18Text('NEIRONGSUQIU')} name="custom" rules={[{ required: true, max: TEXTAREA_MAX_COUNT }]} required>
      <TextArea placeholder={getIn18Text('XIEXIAXIANGYAODETIEZI')} rows={4} showCount={showCountHandler} />
    </Form.Item>
  );

  const aiPictureStyleFormItem = (
    <Form.Item
      className={style.radioFormItem}
      label={
        <div className={style.labelWrapper}>
          <div className={style.label}>{getIn18Text('PEITUSHEZHI')}</div>
          <MediaTooltip className={style.extra} />
        </div>
      }
      name={['picGenerateReq', 'pictureStyle']}
      initialValue={SnsMarketingAiPicStyle.commerce}
      getValueFromEvent={event => event.target.value}
      required={pictureRequired}
    >
      <Radio.Group>
        <Radio value={SnsMarketingAiPicStyle.commerce}>{SnsMarketingAiPicStyleName[SnsMarketingAiPicStyle.commerce]}</Radio>
        <Radio value={SnsMarketingAiPicStyle.fresh}>{SnsMarketingAiPicStyleName[SnsMarketingAiPicStyle.fresh]}</Radio>
        <Radio value={SnsMarketingAiPicStyle.warm}>{SnsMarketingAiPicStyleName[SnsMarketingAiPicStyle.warm]}</Radio>
        <Radio value={-1} disabled={pictureRequired}>
          {getIn18Text('WU')}
        </Radio>
      </Radio.Group>
    </Form.Item>
  );

  const aiPictureDescFormItem = (
    <>
      <Form.Item
        className={style.aiPictureDescFormItem}
        name={['picGenerateReq', 'pictureDesc']}
        rules={[
          { required: true, message: getIn18Text('QINGSHURUPEITUMIAOSHU') },
          { max: 200, message: getIn18Text('ZUIDUO 200 ') },
        ]}
        label=" "
        required={false}
      >
        <TextArea placeholder={getIn18Text('XIEXIAXIANGYAODETUPIAN')} rows={4} showCount={{ formatter: (info: { count: number }) => `${200 - info.count}` }} />
      </Form.Item>
      {pictureRequired && !pictureUploaded && pictureRequiredFormItem}
    </>
  );

  if (!visible) return null;

  return (
    <div className={classnames(style.sendAiPost, className)}>
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
            onFinish={handleAiTaskCreate}
            onValuesChange={(_, allValues: any) => {
              const nextPictureRequired = (allValues.accounts || []).some((item: SnsMarketingAccount) => item.platform === SnsMarketingPlatform.INSTAGRAM);
              const nonGeneratePicture = allValues.picGenerateReq?.pictureStyle === -1;
              let nextPictureUploaded = false;
              let nextVideoUploaded = false;

              if (allValues.type === SnsPostType.COMPANY_INFO) {
                nextPictureUploaded = !!(allValues.companyUrls || []).length;
                nextVideoUploaded = !!(allValues.companyVideoUrls || []).length;
              } else if (allValues.type === SnsPostType.PRODUCT_INFO) {
                nextPictureUploaded = !!(allValues.productUrls || []).length;
              } else if (allValues.type === SnsPostType.CUSTOM) {
                nextPictureUploaded = !!(allValues.picGenerateReq?.pictureDesc || []).length;
              }

              setPictureRequired(nextPictureRequired);
              setPictureUploaded(nextPictureUploaded);
              setVideoUploaded(nextVideoUploaded);
              hasChangedRef.current = true;

              if (nextPictureRequired && nonGeneratePicture) {
                form.setFieldsValue({
                  picGenerateReq: {
                    pictureStyle: SnsMarketingAiPicStyle.commerce,
                  },
                });
              }

              if (!nextPictureRequired) {
                let fields = [];
                if (allValues.type === SnsPostType.COMPANY_INFO) {
                  if (!nextPictureUploaded) fields.push('companyUrls');
                  if (!nextVideoUploaded) fields.push('companyVideoUrls');
                } else if (allValues.type === SnsPostType.PRODUCT_INFO) {
                  if (!nextPictureUploaded) fields.push('productUrls');
                }
                if (fields.length) form.resetFields(fields);
              }

              if (nextPictureRequired) {
                if (allValues.type === SnsPostType.COMPANY_INFO) {
                  if (!nextPictureUploaded && nextVideoUploaded) {
                    form.resetFields(['companyUrls']);
                  }
                  if (nextPictureUploaded && !nextVideoUploaded) {
                    form.resetFields(['companyVideoUrls']);
                  }
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
              className={style.radioFormItem}
              label={getIn18Text('TIEZILEIXING')}
              name="type"
              initialValue={SnsPostType.COMPANY_INFO}
              getValueFromEvent={event => event.target.value}
              rules={[{ required: true }]}
              required
            >
              <Radio.Group>
                <Radio value={SnsPostType.COMPANY_INFO}>{SnsPostTypeName[SnsPostType.COMPANY_INFO]}</Radio>
                <Radio value={SnsPostType.PRODUCT_INFO}>{SnsPostTypeName[SnsPostType.PRODUCT_INFO]}</Radio>
                <Radio value={SnsPostType.CUSTOM}>{SnsPostTypeName[SnsPostType.CUSTOM]}</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item shouldUpdate noStyle>
              {() => {
                const type = form.getFieldValue('type');

                if (type === SnsPostType.COMPANY_INFO) {
                  return (
                    <>
                      {companyNameFormItem}
                      {industryFormItem}
                      {companyProfileFormItem}
                      {companySiteFormItem}
                      {companyUrlsFormItem}
                      {companyVideoFormItem}
                      {pictureRequired && !pictureUploaded && !videoUploaded && (
                        <Form.Item label=" " className={style.pictureRequiredFormItem}>
                          <div className={style.pictureRequiredTip}>已选择Instagram社媒，必须上传图片或视频才可发帖</div>
                        </Form.Item>
                      )}
                      {toneLanguageFormItem}
                    </>
                  );
                }

                if (type === SnsPostType.PRODUCT_INFO) {
                  return (
                    <>
                      {companyNameFormItem}
                      {productNameFormItem}
                      {productDescFormItem}
                      {productUrlsFormItem}
                      {productSiteFormItem}
                      {toneLanguageFormItem}
                    </>
                  );
                }

                if (type === SnsPostType.CUSTOM) {
                  const aiPictureDescVisible = form.getFieldValue(['picGenerateReq', 'pictureStyle']) !== -1;

                  return (
                    <>
                      {customFormItem}
                      {toneLanguageFormItem}
                      {aiPictureStyleFormItem}
                      {aiPictureDescVisible && aiPictureDescFormItem}
                    </>
                  );
                }

                return null;
              }}
            </Form.Item>
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
            <Form.Item
              className={style.radioFormLimitItem}
              label="输出字数"
              name="wordsUpperLimit"
              initialValue={0}
              getValueFromEvent={event => event.target.value}
              rules={[{ required: true }]}
              required
            >
              <Radio.Group>
                <Radio style={{ width: 'calc(50% - 8px)' }} value={0}>
                  不限字数
                </Radio>
                <Radio style={{ width: 'calc(50% - 8px)' }} value={50}>
                  50字（词）以内
                </Radio>
                <Radio style={{ width: 'calc(50% - 8px)' }} value={100}>
                  100字（词）以内
                </Radio>
                <Radio style={{ width: 'calc(50% - 8px)' }} value={200}>
                  200字（词）以内
                </Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="cronTime" noStyle />
            {cronTimeText && (
              <Form.Item label=" ">
                <Input size="middle" readOnly value={cronTimeText} onClick={handleCronSendOpen} />
              </Form.Item>
            )}
            <Form.Item label=" ">
              <Button type="primary" loading={['creating', 'generating'].includes(taskStatus)} htmlType="submit">
                {['creating', 'generating'].includes(taskStatus)
                  ? ''
                  : ['success', 'error'].includes(taskStatus)
                  ? getIn18Text('CHONGXINSHENGCHENG')
                  : getIn18Text('AIXIETIE')}
              </Button>
            </Form.Item>
          </Form>
        </div>
        <div className={style.preview}>
          {taskStatus === 'generating' && <GenerateTip className={style.generateTip} status="generating" content={`正在生成 ${generatingCount} 篇帖子`} showCarousel />}
          {taskStatus === 'success' && (
            <GenerateTip
              className={style.generateTip}
              status="success"
              content={`系统已生成 ${posts.length} 篇帖子 ，若不满足发帖要求，可重新生成或点击[编辑]修改单篇帖子内容`}
            />
          )}
          {taskStatus === 'error' && (
            <GenerateTip
              className={style.generateTip}
              status="error"
              content={`共需生成 ${posts.length} 篇帖子，其中 ${failedCount} 篇帖子生成失败`}
              retryContent={`重新生成 ${failedCount} 篇帖子`}
              onRetry={() => {
                setTaskStatus('retrying');

                snsMarketingApi
                  .retryAiPostTask({
                    taskId: batchIdRef.current!,
                    messageType: 'DIRECT_GENERATE',
                  })
                  .then(() => {
                    setTaskStatus('generating');
                    handleTimerClear();
                    handleTaskPolling(batchIdRef.current!);
                  })
                  .catch(() => {
                    setTaskStatus('error');
                  });
              }}
            />
          )}
          <div className={style.posts}>
            {posts.map(post => (
              <PostPreview
                className={style.postPreview}
                key={post.postDbId}
                post={post}
                editable={getPostEditable(post.postStatus)}
                translatable
                onEdit={() => {
                  setEditingPostDbId(post.postDbId);
                  setPostEditVisible(true);
                }}
                onTranslate={(checked, contentHTML) => {
                  if (!checked) {
                    return updatePost(post.postDbId, { translateChecked: false });
                  }

                  if (post.translateResult || post.translating) {
                    return updatePost(post.postDbId, { translateChecked: true });
                  }

                  updatePost(post.postDbId, {
                    translating: true,
                    translateChecked: true,
                  });

                  translateHandler(contentHTML)
                    .then(translateHTML => {
                      updatePost(post.postDbId, {
                        translating: false,
                        translateResult: translateHTML,
                      });
                    })
                    .catch((error: Error) => {
                      updatePost(post.postDbId, {
                        translating: false,
                        translateResult: '',
                        translateChecked: false,
                      });
                      Message.error(error.message);
                    });
                }}
              />
            ))}
            {!posts.length && (
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
      </div>
      <div className={style.footer}>
        <Button onClick={handleBack}>{getIn18Text('CLOSE_TXT')}</Button>
        <Button type="primary" loading={postSending} disabled={!postSendable} onClick={handlePostSend}>
          {getIn18Text('FABU')}
        </Button>
      </div>
      <CronSendModal ref={cronSendModalRef} visible={cronSendVisible} sendModeVisible={false} onSend={handleCronSendOk} onCancel={handleCronSendCancel} />
      <PostEditModal
        visible={postEditVisible}
        postDbId={editingPostDbId}
        onCancel={() => {
          setPostEditVisible(false);
          setEditingPostDbId(null);
        }}
        onFinish={editedPost => {
          Message.success(getIn18Text('BIANJIWANCHENG'));
          setPostEditVisible(false);
          setEditingPostDbId(null);
          setPosts(
            posts.map(post => {
              if (post.postDbId === editedPost.postDbId) {
                return editedPost;
              }
              return post;
            })
          );
        }}
      />
    </div>
  );
};

export default SendAiPost;
