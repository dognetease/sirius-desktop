import { getIn18Text } from 'api';
import React, { useState, useEffect, useRef } from 'react';
import {
  apis,
  apiHolder,
  SnsMarketingApi,
  SnsMarketingMedia,
  LoadOperation,
  SnsMarketingAiPicStyle,
  getSnsMarketingAiPicStyleName,
  SnsMarketingPost,
  SnsMarketingReplaceImageReq,
} from 'api';
import classnames from 'classnames';
import { Form, Button } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Message from '@web-common/components/UI/Message/SiriusMessage';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import { Radio } from '@web-common/components/UI/Radio';
import Radio from '@lingxi-common-component/sirius-ui/Radio';
import GenerateTip from './GenerateTip';
import useAiQuota from './useAiQuota';
import ReplaceImagePopover from './ReplaceImagePopover';
import { ReactComponent as RefreshImageIcon } from '@web-sns-marketing/images/refresh-image.svg';
import { ReactComponent as CheckboxIcon } from '@web-sns-marketing/images/checkbox.svg';
import { ReactComponent as EmptyIcon } from '@web-sns-marketing/images/empty.svg';
import style from './PostImageReplace.module.scss';

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;
const SnsMarketingAiPicStyleName = getSnsMarketingAiPicStyleName();
const { TextArea } = Input;

interface PostImageReplaceProps {
  visible: boolean;
  post: SnsMarketingPost | null;
  originUrl: string | null;
  onReplace: (replaceUrl: string) => void;
  onCancel: () => void;
}

type OperatorHandler = (operation: LoadOperation) => void;

type GenerateStatus = 'initial' | 'generating' | 'success' | 'error';

const PostImageReplace: React.FC<PostImageReplaceProps> = props => {
  const { visible, post, originUrl, onReplace, onCancel } = props;
  const { AiQuota, refreshAiQuota } = useAiQuota({ mode: 'brief' });
  const [status, setStatus] = useState<GenerateStatus>('initial');
  const [replaceUrl, setReplaceUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<SnsMarketingMedia[]>([]);
  const imageHandler = useRef<OperatorHandler | null>(null);
  const [form] = Form.useForm();
  const [params, setParams] = useState<SnsMarketingReplaceImageReq | null>(null);

  const handleImageGenerate = (params: SnsMarketingReplaceImageReq) => {
    if (!post) return;

    setStatus('generating');

    snsMarketingApi
      .getReplaceImage(params, {
        timeout: 2 * 60 * 1000,
        operator: (handler: OperatorHandler) => {
          imageHandler.current = handler;
        },
      })
      .then(res => {
        setStatus('success');
        setOptions(res.mediaList);
        refreshAiQuota();
        Message.success(`已生成 ${res.mediaList.length} 张图片，请选择其中一张图片去使用`);
      })
      .catch(() => {
        setStatus('error');
      });
  };

  useEffect(() => {
    if (!visible) {
      setReplaceUrl(null);
      setOptions([]);
      refreshAiQuota();
      setParams(null);
      setStatus('initial');
      imageHandler.current?.('abort');
      form.resetFields();
    }
  }, [visible]);

  useEffect(() => {
    if (post && post.aiGenerateParam && post.aiGenerateParam.pictureStyle) {
      form.setFieldsValue({
        picGenerateReq: post.aiGenerateParam,
      });
    }
  }, [post]);

  return (
    <Modal
      className={style.postImageReplace}
      visible={visible}
      title={
        <div className={style.title}>
          <span>{getIn18Text('TUPIANHUANYIHUAN')}</span>
          <AiQuota className={style.aiQuota} />
        </div>
      }
      width={942}
      keyboard={false}
      maskClosable={false}
      cancelText={getIn18Text('FANGQIHUANTU')}
      okText={getIn18Text('SHIYONGTUPIAN')}
      okButtonProps={{ disabled: !replaceUrl }}
      onOk={() => replaceUrl && onReplace(replaceUrl)}
      onCancel={onCancel}
    >
      <div className={style.body}>
        <div className={style.origin}>
          <div className={style.header}>
            <div className={style.title}>{getIn18Text('YUANTU')}</div>
          </div>
          {originUrl && (
            <div className={style.option}>
              <img className={style.image} src={originUrl} />
            </div>
          )}
          <Form
            className={style.form}
            form={form}
            layout="vertical"
            onFinish={allValues => {
              if (post) {
                const nextParams = {
                  postDbId: post.postDbId,
                  content: post.content,
                  picGenerateReq: allValues.picGenerateReq,
                };
                setReplaceUrl(null);
                setOptions([]);
                setParams(nextParams);
                handleImageGenerate(nextParams);
              }
            }}
          >
            <Form.Item
              className={style.radioFormItem}
              label={
                <div className={style.replaceStyleLabel}>
                  <div className={style.label}>{getIn18Text('PEITUSHEZHI')}</div>
                  <ReplaceImagePopover className={style.replaceStyleTooltip} />
                </div>
              }
              name={['picGenerateReq', 'pictureStyle']}
              initialValue={SnsMarketingAiPicStyle.commerce}
              getValueFromEvent={event => event.target.value}
            >
              <Radio.Group disabled={status === 'generating'}>
                <Radio value={SnsMarketingAiPicStyle.commerce}>{SnsMarketingAiPicStyleName[SnsMarketingAiPicStyle.commerce]}</Radio>
                <Radio value={SnsMarketingAiPicStyle.fresh}>{SnsMarketingAiPicStyleName[SnsMarketingAiPicStyle.fresh]}</Radio>
                <Radio value={SnsMarketingAiPicStyle.warm}>{SnsMarketingAiPicStyleName[SnsMarketingAiPicStyle.warm]}</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              name={['picGenerateReq', 'pictureDesc']}
              rules={[
                { required: true, message: getIn18Text('QINGSHURUPEITUMIAOSHU') },
                { max: 200, message: getIn18Text('ZUIDUO 200 ') },
              ]}
            >
              <TextArea
                disabled={status === 'generating'}
                placeholder={getIn18Text('XIEXIAXIANGYAODETUPIAN')}
                rows={3}
                showCount={{ formatter: (info: { count: number }) => `${200 - info.count}` }}
              />
            </Form.Item>
            <Button type="primary" loading={status === 'generating'} htmlType="submit">
              {status === 'generating' ? '' : getIn18Text('SHENGCHENGXINTU')}
            </Button>
          </Form>
        </div>
        <div className={style.result}>
          <div className={style.header}>
            <div className={style.title}>{getIn18Text('AIHUANTUJIEGUO')}</div>
          </div>
          {status === 'generating' && <GenerateTip className={style.generateTip} status="generating" content={getIn18Text('ZHENGZAISHENGCHENGXINDE ')} />}
          <div className={style.options}>
            {status === 'success' &&
              options.map((item, index) => {
                const isActive = item.url === replaceUrl;

                return (
                  <div
                    className={classnames(style.option, {
                      [style.active]: isActive,
                    })}
                  >
                    <img className={style.image} key={index} src={item.url} onClick={() => setReplaceUrl(item.url)} />
                    {isActive && <CheckboxIcon className={style.checkbox} />}
                  </div>
                );
              })}
            {status === 'generating' && Array.from({ length: 4 }).map((_, index) => <div className={style.placeholder} key={index} />)}
            {status === 'initial' && (
              <div className={style.empty}>
                <EmptyIcon className={style.emptyIcon} />
                <div className={style.emptyTip}>{getIn18Text('ZUOCESHEZHITUPIANFENG')}</div>
              </div>
            )}
            {status === 'error' && (
              <div className={style.empty}>
                <EmptyIcon className={style.emptyIcon} />
                <div className={style.emptyTip}>
                  {getIn18Text('BAOQIAN，SHENGCHENGGUOCHENG')}
                  <a onClick={() => params && handleImageGenerate(params)}>{getIn18Text('DIANJIZHONGSHI')}</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PostImageReplace;
