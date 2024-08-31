import { SnsMarketingMediaType, SnsMarketingPlatform, getIn18Text } from 'api';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Button, Form, Select, Tooltip } from 'antd';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import { Radio } from '@web-common/components/UI/Radio';
import Radio from '@lingxi-common-component/sirius-ui/Radio';
import { api, apis, DataTrackerApi, SnsMarketingApi, SnsMarketingPost, SnsPostStatus, SnsPostType, SnsTaskPreSendReq, SnsTaskStatus } from 'api';
import classnames from 'classnames';
import { useOpenHelpCenter } from '@web-common/utils/utils';

import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { snsMarketingTaskActions } from '@web-common/state/reducer';
import { ProductSelectModal } from '../../components/productSelectModal';
import style from './prompt.module.scss';
import { ReactComponent as TipIcon } from '@web-sns-marketing/images/tip.svg';
import { TongyongYiwenMian, TongyongShuaxin } from '@sirius/icons';
import PostPreview, { translateHandler } from '../../components/PostPreview';
import PostEditModal from '../../components/PostEditModal';
import Message from '@web-common/components/UI/Message/SiriusMessage';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { isEmpty } from '../../utils/index';
import emptyListPng from '../../images/empty-list.png';
import { CreatingPostModal } from './modals';
import GenerateTip from '../../components/GenerateTip';
import MediaTooltip from '../../components/MediaTooltip';
import MediaList from '../../components/MediaList';
import { ReactComponent as IconCompany } from '../../images/icon-company.svg';
import { ReactComponent as IconProduct } from '../../images/icon-product.svg';
import { ReactComponent as IconNews } from '../../images/icon-news.svg';

const snsMarketingApi = api.requireLogicalApi('snsMarketingApiImpl') as unknown as SnsMarketingApi;
const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
interface Option {
  value: string | number;
  label: string | number;
}

export interface SnsMarketingConst {
  languageList: Option[];
  toneList: Option[];
  industryList: Option[];
}

export interface MarketingPromptProps {
  checkPostAsync: (action: 'try' | 'createAll' | 'retry' | 'retryCreateAll') => Promise<SnsMarketingPost[]>;
  saveDraft: () => Promise<boolean>;
}

export const MarketingPrompt = (props: MarketingPromptProps) => {
  const { checkPostAsync, saveDraft } = props;
  const [options, setOptions] = useState<SnsMarketingConst>();
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [isSaveDraft, setIsSaveDraft] = useState(false);
  const [formRef] = Form.useForm();
  const appDispatch = useAppDispatch();
  const currentTask = useAppSelector(state => state.snsMarketingTaskReducer.currentTask);
  const taskStatus = useAppSelector(state => state.snsMarketingTaskReducer.currentTaskStatus);
  const readonly = taskStatus !== SnsTaskStatus.DRAFT;
  const currentPosts = useAppSelector(state => state.snsMarketingTaskReducer.currentPosts);
  const postPreviewData = currentPosts.posts;
  const postPreviewDataRef = useRef<SnsMarketingPost[]>([]);
  postPreviewDataRef.current = postPreviewData;
  const isTryPost = isSaveDraft || (currentPosts.action === 'try' && currentPosts.loading);
  const isRetryPost = currentPosts.action === 'retry' && currentPosts.loading;
  const [postEditVisible, setPostEditVisible] = useState<boolean>(false);
  const [editingPostDbId, setEditingPostDbId] = useState<string | null>(null);
  const [showCreatingTip, setShowCreatingTip] = useState(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const openHelpCenter = useOpenHelpCenter();

  const [productOptions, setProductOptions] = useState<{ label: string; value: string }[]>(() => {
    if (!currentTask.aiGeneratePostParam || !currentTask.aiGeneratePostParam.goods) {
      return [];
    }
    return currentTask.aiGeneratePostParam?.goods.map(item => ({
      label: item.name,
      value: item.id,
    }));
  });

  useEffect(() => {
    snsMarketingApi.getSnsTaskAiParam().then(res => {
      const option = {
        languageList: res.languages,
        toneList: res.tones,
        industryList: res.industries,
      };
      setOptions(option);

      if (!isEmpty(currentTask.aiGeneratePostParam)) {
        // const initialValue: Record<string, any> = { ...currentTask.aiGeneratePostParam };
        // formRef.setFieldsValue(initialValue);
      } else {
        const initialValue = {
          companyName: res.companyName,
          language: res.languages.length ? res.languages[0].value : undefined,
          tone: res.tones.length ? res.tones[0].value : undefined,
          industry: undefined,
          companyUrls: res.companyUrls || [],
          companyVideoUrls: res.companyVideoUrls || [],
          wordsUpperLimit: res.wordsUpperLimit ?? 0,
        };
        formRef.setFieldsValue(initialValue);
        appDispatch(
          snsMarketingTaskActions.setAiParam({
            ...initialValue,
          })
        );
      }
    });
  }, []);

  const handleProductSelect = (_: string[], goods: Array<{ id: string; name: string }>) => {
    const options = goods.map(item => ({
      label: item.name,
      value: item.id,
    }));
    setProductOptions(options);
    appDispatch(
      snsMarketingTaskActions.setAiParam({
        goods,
      })
    );
  };

  const handleValueChange = (changedValues: any, allValues: any) => {
    const nextPictureRequired = currentTask.accounts.some(item => item.platform === SnsMarketingPlatform.INSTAGRAM);
    const nextPictureUploaded = !!(allValues.companyUrls || []).length;
    const nextVideoUploaded = !!(allValues.companyVideoUrls || []).length;

    if (nextPictureRequired) {
      if (!nextPictureUploaded && nextVideoUploaded) {
        formRef.resetFields(['companyUrls']);
      }
      if (nextPictureUploaded && !nextVideoUploaded) {
        formRef.resetFields(['companyVideoUrls']);
      }
    }
    appDispatch(snsMarketingTaskActions.setAiParam(changedValues));
  };

  const handleTryPost = () => {
    const values = formRef.getFieldsValue();
    formRef.validateFields().then(() => {
      setIsSaveDraft(true);
      const req: SnsTaskPreSendReq = {
        accounts: currentTask.accounts,
        ...currentTask.aiGeneratePostParam!,
        ...values,
        taskId: currentTask.taskId,
        wordsUpperLimit: values.wordsUpperLimit === 0 ? undefined : values.wordsUpperLimit,
      };
      saveDraft()
        .then(succ => {
          if (succ) {
            return snsMarketingApi.tryCreatePostForSnsTask(req).then(res => {
              console.log(res.batchId);
              return checkPostAsync('try');
            });
          }
        })
        .finally(() => setIsSaveDraft(false));
    });
    trackerApi.track('waimao_createtask_action', {
      type: 'tasks_test',
    });
  };
  const [previewType, setPreviewType] = useState<SnsPostType>(SnsPostType.COMPANY_INFO);

  const handleCreatePost = () => {
    const values = formRef.getFieldsValue();
    const doCreatePost = () => {
      const req: SnsTaskPreSendReq = {
        accounts: currentTask.accounts,
        ...currentTask.aiGeneratePostParam!,
        ...values,
        taskId: currentTask.taskId,
        wordsUpperLimit: values.wordsUpperLimit === 0 ? undefined : values.wordsUpperLimit,
      };
      saveDraft()
        .then(succ => {
          if (succ) {
            snsMarketingApi.createPostsForSnsTask(req).then(res => {
              appDispatch(snsMarketingTaskActions.setTaskStatus(SnsTaskStatus.GENERATING));
              setShowCreatingTip(true);
              return checkPostAsync('createAll').then(() => {
                appDispatch(snsMarketingTaskActions.setTaskStatus(SnsTaskStatus.FINISH_GENERATE));
              });
            });
          }
        })
        .catch(e => {
          // appDispatch(snsMarketingActions.setTaskStatus())
        });
    };
    formRef.validateFields().then(() => {
      SiriusModal.warning({
        title: getIn18Text('SHENGCHENGQUANBUTIEZIHOU'),
        content: getIn18Text('XITONGANZHAOTIEZISU'),
        cancelText: getIn18Text('setting_system_switch_cancel'),
        okText: getIn18Text('ZHIJIESHENGCHENGQUANBUTIE'),
        onOk() {
          doCreatePost();
        },
      });
    });
    trackerApi.track('waimao_createtask_action', {
      type: 'create_all',
    });
  };

  const handleRetryPost = () => {
    snsMarketingApi
      .retryAiPostTask({
        taskId: currentTask.taskId,
        messageType: 'HOSTING',
      })
      .then(() => {
        const isCreateAll = currentPosts.action === 'retryCreateAll' || currentPosts.action === 'createAll';
        if (isCreateAll) {
          appDispatch(snsMarketingTaskActions.setTaskStatus(SnsTaskStatus.GENERATING));
        }
        return checkPostAsync(isCreateAll ? 'retryCreateAll' : 'retry').then(() => {
          if (isCreateAll) {
            appDispatch(snsMarketingTaskActions.setTaskStatus(SnsTaskStatus.FINISH_GENERATE));
          }
        });
      });
  };

  const generateTipData = useMemo(() => {
    if (currentPosts.posts.length === 0 && currentPosts.loading === false) {
      return null;
    }
    const status = currentPosts.loading ? 'generating' : currentPosts.hasError ? 'error' : currentPosts.action === 'try' ? 'success' : 'warn';

    let content = '';
    let errorPostCount = 0;
    switch (status) {
      case 'generating':
        content =
          currentPosts.action === 'createAll'
            ? `正在生成篇${currentPosts.posts.length}帖子，生成过程仍可预览发帖日历...`
            : `正在试生成篇${currentPosts.posts.length}帖子`;
        break;
      case 'error':
        errorPostCount = currentPosts.posts.filter(post => post.postStatus === SnsPostStatus.FAILED_GENERATE).length;
        content = `共需生成${currentPosts.posts.length}篇帖子，其中${errorPostCount}篇帖子生成失败`;
        break;
      case 'success':
        content =
          currentPosts.action === 'try'
            ? `以下是系统为您试生成的${currentPosts.posts.length}篇帖子，若符合您的发帖要求，您可以生成全部帖子`
            : `以下是系统为您生成的${currentPosts.posts.length}篇帖子`;
        break;
      case 'warn':
        content = `已生成${currentPosts.posts.length}篇帖子，建议您点击 [下一步] 查看发帖日历，再检查并启用任务`;
        break;
    }

    return {
      status,
      content,
      retryContent: status === 'error' ? `重新生成${errorPostCount}篇帖子` : undefined,
    };
  }, [currentPosts.posts, currentPosts.loading, currentPosts.action]);

  const productValue = productOptions.map(i => i.value);

  const updatePost = (postDbId: string, payload: Partial<SnsMarketingPost>) => {
    const nextPosts = postPreviewDataRef.current.map(item => (item.postDbId === postDbId ? { ...item, ...payload } : item));

    appDispatch(
      snsMarketingTaskActions.setCurrentPosts({
        posts: nextPosts,
      })
    );
  };

  const pictureRequired = currentTask.accounts.some(item => item.platform === SnsMarketingPlatform.INSTAGRAM);
  const pictureUploaded = !!(currentTask.aiGeneratePostParam?.companyUrls || []).length;
  const videoUploaded = !!(currentTask.aiGeneratePostParam?.companyVideoUrls || []).length;

  const onKnowledgeCenterClick = (e: MouseEvent) => {
    openHelpCenter('/d/1665713091087720450.html');
    e.preventDefault();
  };

  return (
    <div className={style.prompt}>
      <div className={style.left}>
        <h4>{getIn18Text('AIXIETIE')}</h4>
        <div className={style.tip}>
          {getIn18Text('QINGTIANXIEGONGSIJICHU')}
          <a onClick={onKnowledgeCenterClick}>
            <TongyongYiwenMian />
            {getIn18Text('RUHESHIYONG?')}
          </a>
        </div>
        <Form
          labelAlign="left"
          labelCol={{ flex: '80px' }}
          wrapperCol={{ flex: 1 }}
          colon={false}
          className={style.promptForm}
          form={formRef}
          initialValues={{ ...currentTask.aiGeneratePostParam, products: productValue, wordsUpperLimit: currentTask.aiGeneratePostParam?.wordsUpperLimit ?? 0 }}
          onValuesChange={handleValueChange}
        >
          <Form.Item label={getIn18Text('GONGSIMINGCHENG')} required name="companyName" rules={[{ required: true, message: getIn18Text('QINGSHURUGONGSIMINGCHENG') }]}>
            <Input placeholder={getIn18Text('QINGSHURUGONGSIMINGCHENG')} disabled={readonly} maxLength={50} />
          </Form.Item>
          <Form.Item label={getIn18Text('SUOSHUXINGYE')} name="industry" rules={[{ required: true }]}>
            <EnhanceSelect options={options?.industryList} disabled={readonly} placeholder={getIn18Text('QINGXUANZESUOSHUXINGYE')} />
          </Form.Item>
          <Form.Item label={getIn18Text('GONGSIJIESHAO')} name="companyProfile" rules={[{ required: true, message: getIn18Text('QINGTIANXIEGONGSIJIESHAO') }]}>
            <Input.TextArea disabled={readonly} rows={5} maxLength={500} placeholder={getIn18Text('QINGJIANDANJIESHAONINDE')} />
          </Form.Item>
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
            <MediaList disabled={isTryPost || isRetryPost || readonly || videoUploaded || uploading} deletable uploadable onUploading={setUploading} />
          </Form.Item>
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
            rules={[{ required: pictureRequired && !pictureUploaded, message: getIn18Text('QINGSHANGCHUANGONGSITUPIAN') }]}
            required={pictureRequired && !pictureUploaded}
          >
            <MediaList
              disabled={isTryPost || isRetryPost || readonly || pictureUploaded || uploading}
              deletable
              uploadable
              mediaType={SnsMarketingMediaType.VIDEO}
              onUploading={setUploading}
            />
          </Form.Item>
          {pictureRequired && !pictureUploaded && !videoUploaded && (
            <Form.Item label=" " className={style.pictureRequiredFormItem}>
              <div className={style.pictureRequiredTip}>已选择Instagram社媒，必须上传图片或视频才可发帖</div>
            </Form.Item>
          )}
          <Form.Item
            rules={[
              {
                validator: _ => {
                  if (productValue.length <= 0) {
                    return Promise.reject(new Error('请选择商品信息'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
            label={
              <div className={style.labelWrapper}>
                <div className={style.label}>{getIn18Text('SHANGPINXINXI')}</div>
                <Tooltip title={getIn18Text('QINGJIANGSHANGPINXINXISHANG')}>
                  <TipIcon className={style.extra} />
                </Tooltip>
              </div>
            }
          >
            <EnhanceSelect
              placeholder={getIn18Text('WEILEGENGHAODEYINGXIAO')}
              mode="multiple"
              maxTagCount="responsive"
              removeIcon={null}
              open={false}
              value={productValue}
              options={productOptions}
              onClick={() => !readonly && setShowProductSelector(true)}
              disabled={readonly}
              showArrow={false}
            />
          </Form.Item>
          <Form.Item label={getIn18Text('YUQIYUZHONG')} style={{ marginBottom: 0 }}>
            <Form.Item name="tone" rules={[{ required: true, message: getIn18Text('QINGXUANZEYUQI') }]} style={{ display: 'inline-block', width: 'calc(50% - 6px)' }}>
              <EnhanceSelect options={options?.toneList} disabled={readonly} />
            </Form.Item>
            <Form.Item
              name="language"
              rules={[{ required: true, message: getIn18Text('QINGXUANZEYUZHONG') }]}
              style={{ display: 'inline-block', width: 'calc(50% - 6px)', marginLeft: '12px' }}
            >
              <EnhanceSelect options={options?.languageList} disabled={readonly} />
            </Form.Item>
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
            <Radio.Group disabled={isTryPost || isRetryPost || readonly}>
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
          <Form.Item label=" " style={{ whiteSpace: 'nowrap' }}>
            <Button onClick={handleTryPost} type="primary" loading={isTryPost} disabled={isRetryPost || readonly}>
              {getIn18Text('SHIXIETIE')}
            </Button>
            <Button
              onClick={handleCreatePost}
              disabled={isTryPost || isRetryPost || readonly}
              loading={currentPosts.loading && currentPosts.action === 'createAll'}
              style={{ marginLeft: 12 }}
            >
              {getIn18Text('ZHIJIESHENGCHENGQUANBUTIE')}
            </Button>
          </Form.Item>
        </Form>
      </div>
      <div className={style.right}>
        {generateTipData && (
          <GenerateTip
            className={style.generateTip}
            status={generateTipData.status as any}
            content={generateTipData.content}
            retryContent={generateTipData.retryContent}
            showCarousel={true}
            onRetry={handleRetryPost}
          />
        )}
        <div className={style.postTypeTabWrapper}>
          <PostTypeTab onChange={v => setPreviewType(v)} posts={currentPosts.posts} />
        </div>
        <div className={style.postPreviewContainer}>
          {!postPreviewData ||
            (postPreviewData.length === 0 && (
              <div className={style.emptyPost}>
                <div>
                  <img src={emptyListPng} width="56" height="63" alt="" />
                  <div>
                    {getIn18Text('ZANWUXIANGGUANDETIEZI')}
                    <br />
                    {getIn18Text('ZAIZUOCETIGONGSHANGPIN')}
                  </div>
                </div>
              </div>
            ))}
          {postPreviewData
            .filter(post => post.type === previewType)
            .map(post => (
              <PostPreview
                className={style.postPreview}
                post={post}
                key={post.postDbId}
                editable
                translatable
                onEdit={postDbId => {
                  setPostEditVisible(true);
                  setEditingPostDbId(postDbId);
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
        </div>
      </div>
      <ProductSelectModal
        container="#sns-task-create-root"
        visible={showProductSelector}
        defaultValue={productValue}
        defaultProductMap={currentTask.aiGeneratePostParam?.goods}
        pictureRequired={pictureRequired}
        onClose={() => setShowProductSelector(false)}
        onOk={handleProductSelect}
      />
      <PostEditModal
        visible={postEditVisible}
        postDbId={editingPostDbId}
        onCancel={() => {
          setPostEditVisible(false);
          setEditingPostDbId(null);
        }}
        onFinish={post => {
          const nextPosts = currentPosts.posts.map(item => {
            return item.postDbId === editingPostDbId ? post : item;
          });
          const hasError = nextPosts.some(item => item.postStatus === SnsPostStatus.FAILED_GENERATE);

          appDispatch(
            snsMarketingTaskActions.setCurrentPosts({
              posts: nextPosts,
              hasError,
            })
          );
          Message.success(getIn18Text('BIANJIWANCHENG'));
          setPostEditVisible(false);
          setEditingPostDbId(null);
        }}
      />
      <CreatingPostModal visible={showCreatingTip} posts={currentPosts.posts} onOk={() => setShowCreatingTip(false)} />
    </div>
  );
};

const tabs = [
  {
    key: SnsPostType.COMPANY_INFO,
    title: getIn18Text('GONGSIJIESHAO'),
    icon: <IconCompany />,
  },
  {
    key: SnsPostType.PRODUCT_INFO,
    title: getIn18Text('SHANGPINJIESHAO'),
    icon: <IconProduct />,
  },
  {
    key: SnsPostType.INDUSTRY,
    title: getIn18Text('XINGYEZIXUN'),
    icon: <IconNews />,
  },
];

const PostTypeTab = ({ onChange, posts }: { posts: SnsMarketingPost[]; onChange: (key: SnsPostType, oldKey: SnsPostType) => void }) => {
  const [key, setKey] = useState(SnsPostType.COMPANY_INFO);

  const handleClick = (clickKey: SnsPostType) => {
    if (clickKey !== key) {
      onChange(clickKey, key);
    }
    setKey(clickKey);
  };
  const postCountGroupByType = useMemo(() => {
    const map: Record<string, number> = {};
    if (posts && posts.length) {
      posts.forEach(post => {
        map[post.type] = (map[post.type] || 0) + 1;
      });
    }
    return map;
  }, [posts]);

  return (
    <div className={style.postTypeTab}>
      {tabs.map(item => (
        <div className={classnames(style.postTypeTabItem, key === item.key ? style.activeTab : '')} key={item.key} onClick={() => handleClick(item.key)}>
          <span className={style.typeIcon}>{item.icon}</span>
          <span>
            {item.title}
            {posts ? '(' + (postCountGroupByType[item.key] || 0) + ')' : ''}
          </span>
        </div>
      ))}
    </div>
  );
};
