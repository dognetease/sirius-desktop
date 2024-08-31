import { getIn18Text } from 'api';
import React, { useState, useEffect, useRef } from 'react';
import { apis, apiHolder, SnsMarketingApi, LoadOperation, SnsRefineContentReq } from 'api';
import { Form, Radio, Button, Skeleton } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import GenerateTip from './GenerateTip';
import useAiQuota from './useAiQuota';
import ContentEditor from './ContentEditor';
import { POST_RULE } from '../utils/rules';
import { ReactComponent as EmptyIcon } from '@web-sns-marketing/images/empty.svg';
// import { EnhanceSelect as Select, InSingleOption as Option } from '@web-common/components/UI/Select';
import { EnhanceSelect as Select, InSingleOption as Option } from '@lingxi-common-component/sirius-ui/Select';
import style from './PostContentRefine.module.scss';

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;

interface PostContentRefineProps {
  visible: boolean;
  content: string;
  onRefine: (content: string) => void;
  onCancel: () => void;
}

type OperatorHandler = (operation: LoadOperation) => void;

type GenerateStatus = 'initial' | 'generating' | 'success' | 'error';

const PostContentRefine: React.FC<PostContentRefineProps> = props => {
  const { visible, content, onRefine, onCancel } = props;
  const { AiQuota, refreshAiQuota } = useAiQuota({ mode: 'brief' });
  const [status, setStatus] = useState<GenerateStatus>('initial');
  const refineHandler = useRef<OperatorHandler | null>(null);
  const [form] = Form.useForm();
  const [params, setParams] = useState<SnsRefineContentReq | null>(null);
  const [refineContent, setRefineContent] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]);
  const [languages, setLanguages] = useState<{ label: string; value: string }[]>([]);
  const [tones, setTones] = useState<{ label: string; value: string }[]>([]);

  const handleContentRefine = (params: SnsRefineContentReq) => {
    setStatus('generating');

    snsMarketingApi
      .getRefineContent(params, {
        timeout: 2 * 60 * 1000,
        operator: (handler: OperatorHandler) => {
          refineHandler.current = handler;
        },
      })
      .then(res => {
        setStatus('success');
        setOptions(res.contents);
        refreshAiQuota();
        Message.success(getIn18Text('YISHENGCHENG，QINGXUANZE'));
      })
      .catch(() => {
        setStatus('error');
      });
  };

  useEffect(() => {
    if (!visible) {
      setRefineContent('');
      setOptions([]);
      refreshAiQuota();
      setStatus('initial');
      refineHandler.current?.('abort');
      form.setFieldsValue({
        original: '',
        tone: tones[0]?.value,
        language: languages[0]?.value,
      });
    }
  }, [visible, tones, languages]);

  useEffect(() => {
    if (content) {
      form.setFieldsValue({
        original: content,
      });
    }
  }, [content]);

  useEffect(() => {
    snsMarketingApi.getSnsTaskAiParam().then(res => {
      setLanguages(res.languages);
      setTones(res.tones);
      form.setFieldsValue({
        companyName: res.companyName,
        tone: res.tones[0]?.value,
        language: res.languages[0]?.value,
      });
    });
  }, []);

  return (
    <Modal
      className={style.postContentRefine}
      visible={visible}
      title={
        <div className={style.title}>
          <span>{getIn18Text('RUNSETIEZINEIRONG')}</span>
          <AiQuota className={style.aiQuota} />
        </div>
      }
      width={1107}
      keyboard={false}
      maskClosable={false}
      okText={getIn18Text('SHIYONGXUANDINGDEJIEGUO')}
      okButtonProps={{ disabled: !refineContent }}
      onOk={() => refineContent && onRefine(refineContent)}
      onCancel={onCancel}
    >
      <div className={style.body}>
        <div className={style.origin}>
          <Form
            className={style.form}
            form={form}
            layout="vertical"
            onFinish={params => {
              setRefineContent('');
              setOptions([]);
              setParams(params);
              handleContentRefine(params);
            }}
          >
            <Form.Item
              label={getIn18Text('TIEZINEIRONG')}
              name="original"
              valuePropName="content"
              initialValue=""
              rules={[{ required: true }, { max: POST_RULE.textMaxLength }]}
              required
            >
              <ContentEditor disabled={status === 'generating'} />
            </Form.Item>
            <Form.Item label={getIn18Text('YUQIYUZHONG')} required>
              <div className={style.toneLanguage}>
                <Form.Item name="tone" noStyle>
                  <Select style={{ width: '50%' }} size="large" disabled={status === 'generating'} placeholder={getIn18Text('QINGXUANZEYUQI')} options={tones} />
                </Form.Item>
                <Form.Item name="language" noStyle>
                  <Select style={{ width: '50%' }} size="large" disabled={status === 'generating'} placeholder={getIn18Text('QINGXUANZEYUZHONG')} options={languages} />
                </Form.Item>
              </div>
            </Form.Item>
            <Button type="primary" loading={status === 'generating'} htmlType="submit">
              {status === 'generating' ? '' : getIn18Text('KAISHIRUNSE')}
            </Button>
          </Form>
        </div>
        <div className={style.result}>
          {status === 'initial' && (
            <div className={style.empty}>
              <EmptyIcon className={style.emptyIcon} />
              <div className={style.emptyTip}>{getIn18Text('ZUOCESHURUTIEZINEI')}</div>
            </div>
          )}
          {status === 'error' && (
            <div className={style.empty}>
              <EmptyIcon className={style.emptyIcon} />
              <div className={style.emptyTip}>
                {getIn18Text('SHENGCHENGGUOCHENGCHUCUO，')}
                <a onClick={() => params && handleContentRefine(params)}>{getIn18Text('DIANJIZHONGSHI')}</a>
              </div>
            </div>
          )}
          {status === 'generating' && (
            <>
              <div className={style.title}>{getIn18Text('RUNSEJIEGUO')}</div>
              <GenerateTip className={style.generateTip} status="generating" content={getIn18Text('ZHENGZAISHENGCHENG4GENEI')} />
              <div className={style.options}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <div className={style.placeholder} key={index}>
                    <Skeleton active title={false} paragraph={{ rows: 3 }} />
                  </div>
                ))}
              </div>
            </>
          )}
          {status === 'success' && (
            <>
              <div className={style.title}>{getIn18Text('RUNSEJIEGUO')}</div>
              <div className={style.options}>
                {options.map((option, index) => (
                  <div
                    className={style.option}
                    key={index}
                    onClick={() => {
                      if (option !== refineContent) {
                        setRefineContent(option);
                      }
                    }}
                  >
                    <Radio checked={option === refineContent} className={style.radio} />
                    <div className={style.content}>{option}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PostContentRefine;
