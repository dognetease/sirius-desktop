import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { AutoMarketTaskActionContent, EdmContentInfo, EdmEmailType, ISettingData, RequestSendDraft, SecondSendStrategy, SendSettingInfo, DataStoreApi } from 'api';
import { apiHolder, apis, EdmSendBoxApi, isFFMS } from 'api';
import { Button, Form, Space, Input, Select, message, Checkbox, Tooltip } from 'antd';
// import { QuestionCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/question.svg';
import { edmWriteContext } from '../../send/edmWriteContext';
// import { InsertVariable } from '../../components/insertVariable/insertVariable';
import { InsertVariablModal } from '../../components/insertVariable/insertVariableModal';
import { uniq, debounce } from 'lodash';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { isValidEmailAddress, getEmailsFromString, encodeHTML } from '../../utils';
import { ReactComponent as AddIcon } from '@/images/icons/edm/autoMarket/add.svg';
import { ReactComponent as RemoveIcon } from '@/images/icons/edm/autoMarket/subtract.svg';
import { getPlainTextFromHtml } from '../../utils';
import style from './reMarketing.module.scss';
import AddMailIcon from '@/images/icons/edm/remark-add-mail.svg';
import CloseIcon from '@/images/icons/edm/edm-common-close.svg';
import { CCReceivers } from '../../send/setting';
import SiriusCheckbox from '@web-common/components/UI/SiriusContact/Checkbox';
import EditorModal from '../../components/edmMarketingEditorModal/index';
import CustomerDrawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { getContentWithoutSign } from '../../send/utils/getMailContentText';
import type { FormListFieldData } from 'antd/lib/form/FormList';
import { SenderEmail } from '../../components/SenderEmail/senderEmail';
import { SecondSenderEmail } from '../../components/SenderEmail/secondSenderEmail';
import classnames from 'classnames';
import { ReactComponent as LoadingIcon } from '@/images/icons/edm/yingxiao/loading.svg';
import { ReactComponent as AiAddIcon } from '@/images/icons/edm/yingxiao/ai-add.svg';
import { ReactComponent as AiChangeIcon } from '@/images/icons/edm/yingxiao/ai-change.svg';
import { aiModSubject, aiTimesSubtract } from '../utils/aiModSubject';
import { edmDataTracker } from '../../tracker/tracker';
import { getContentWithoutAttachment } from '../contentEditor';
import { getIn18Text } from 'api';

const { Option } = Select;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const VAR_EXPREG = /^#[^]+}$/;

const inFFMS = isFFMS();
interface EdmSettingProps {
  visible: boolean;
  /**
   * 默认策略
   */
  strategy?: SecondSendStrategy;
  isEditing?: boolean;
  onSave?: (data: SecondSendStrategy) => void;
  onClose?: () => void;
  needModal?: boolean;
  /**
   * 是否是二次营销，二次营销的发件地址组件不同
   */
  isSecondSend?: boolean;
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const FILTER_AUTO_REPALY = 'FILTER_AUTO_REPALY';

const ReMarketing: React.FC<EdmSettingProps> = props => {
  const user = apiHolder.api.getSystemApi().getCurrentUser();

  const editorRef = useRef<any>();

  const { visible, strategy, isEditing = true, onSave, onClose, needModal = true, isSecondSend = false } = props;
  const { state, dispatch } = useContext(edmWriteContext).value;
  const [form] = Form.useForm();
  const [editorVisible, setEditorVisible] = useState<boolean>(false);
  const [ccEmailsVisible, setCcEmailsVisible] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState<number>();
  // 过滤自动回复按钮
  const [filterChecked, setFilterChecked] = useState(true);
  const [senderType, setSenderType] = useState<0 | 1>(0);
  const [hasEdit, setHasEdit] = useState(false);

  useEffect(() => {
    if (strategy?.triggerCondition?.conditionContent.filterAutoReply == null) {
      // 读取本地内存
      const result = dataStoreApi.getSync(FILTER_AUTO_REPALY);
      if (result.suc && result.data) {
        setFilterChecked(result.data === 'true');
      }
    } else {
      setFilterChecked(strategy?.triggerCondition?.conditionContent.filterAutoReply === 1);
    }
  }, [strategy]);

  useEffect(() => {
    setFilterStatus(strategy?.triggerCondition?.conditionContent.emailOpType);
  }, [strategy]);

  // 变量弹窗
  const [variableVisible, setVariableVisible] = useState(false);
  const themeIndexRef = useRef<number>(0);
  const [editorValues, setEditorValues] = useState({
    emailContent: '',
    emailAttachment: '',
    senderEmail: '',
  });
  const subjectInputRefs = useMemo<React.RefObject<HTMLInputElement>[]>(() => {
    return Array.from({ length: 5 }).map(() => React.createRef());
  }, []);
  const handleSubjectVariableChange = (value: (string | number)[], index: number) => {
    const variable = value[value.length - 1];
    const insertContent = ` #{${variable}}`;
    const inputEl = subjectInputRefs[index].current;
    const selectionStart = (inputEl as any)?.input?.selectionStart;
    const selectionEnd = (inputEl as any)?.input?.selectionEnd;
    const edmEmailSubjects = form.getFieldValue('emailSubjects');
    const edmEmailSubject = edmEmailSubjects[index]?.subject || '';
    if (typeof selectionStart === 'number' && typeof selectionEnd === 'number') {
      const nextEdmEmailSubjects = [...edmEmailSubjects];
      const nextEdmEmailSubject = edmEmailSubject.substring(0, selectionStart) + insertContent + edmEmailSubject.substring(selectionEnd);
      nextEdmEmailSubjects[index] = { subject: nextEdmEmailSubject };
      form.setFieldsValue({
        emailSubjects: nextEdmEmailSubjects,
      });
    }
  };

  // ai改写主题loading
  const [aiLoading, setAiLoading] = useState(false);
  const [needFillPaths, setNeedFillPaths] = useState<Array<number>>([]);
  // 记录ai改写的内容，方便做下一次修改
  const [aiRewrite, setAiRewrite] = useState<Record<number, string>>({});

  const rules = {
    edmSubject: [
      { required: true, message: getIn18Text('QINGSHURURENWUZHUTI') },
      { type: 'string', max: 30, message: getIn18Text('ZUIDUOSHURU30GEZIFU') },
    ],
    trigger: [
      { required: true, message: '请输入时间' },
      {
        validator: async (_: any, value: string) => {
          if (!value) {
            return Promise.resolve();
          }
          if (Number.isInteger(Number(value))) {
            return Promise.resolve();
          }
          return Promise.reject('请输入整数数字');
        },
      },
    ],
    emailSubject: [
      { required: true, message: getIn18Text('QINGSHURUYOUJIANZHUTI') },
      { type: 'string', max: 256, message: getIn18Text('ZUIDUOSHURU256GEZIFU') },
    ],
    sender: [
      { required: true, message: getIn18Text('QINGSHURUFAJIANRENNICHENG') },
      { type: 'string', max: 256, message: getIn18Text('ZUIDUOSHURU256GEZIFU') },
    ],
    replyEmail: [
      { required: true, message: getIn18Text('QINGSHURUHUIFUYOUXIANG') },
      { type: 'email', message: getIn18Text('YOUXIANGGESHIBUZHENGQUE') },
      { type: 'string', max: 256, message: getIn18Text('ZUIDUOSHURU256GEZIFU') },
    ],
    ccEmails: [
      {
        validator: async (_: any, value: string) => {
          const emails = getEmailsFromString(value || '');
          if (emails.some(item => !isValidEmailAddress(item))) {
            return Promise.reject(getIn18Text('CUNZAIGESHIBUZHENGQUEDEYOUXIANG'));
          }
          if (emails.length !== [...new Set(emails)].length) {
            return Promise.reject(getIn18Text('CUNZAIZHONGFUDEYOUXIANG'));
          }
          if (emails.length > 3) {
            return Promise.reject(getIn18Text('CHAOSONGYOUXIANGZUIDUOZHICHI3GE'));
          }
          const error = await validateEdmCc(emails);
          if (error) {
            return Promise.reject(error);
          }
          return Promise.resolve();
        },
      },
    ],
  };

  const handleSetFieldsAndEditorValues = (strategy?: SecondSendStrategy) => {
    const values = { ...strategy?.sendSettingInfo, ...strategy?.triggerCondition?.conditionContent, ...strategy?.contentEditInfo };
    form.setFieldsValue(values);
    if (strategy?.sendSettingInfo?.emailSubjects?.length === 0) {
      form.setFieldsValue({ emailSubjects: [{ subject: '' }] });
    }
    setEditorValues({
      emailContent: getContentWithoutAttachment(strategy?.contentEditInfo?.emailContent || ''),
      emailAttachment: strategy?.contentEditInfo?.emailAttachment || '',
      senderEmail: strategy?.sendSettingInfo?.senderEmail || '',
    });
  };
  useEffect(() => {
    handleSetFieldsAndEditorValues(strategy);
    const ccInfos = strategy?.sendSettingInfo.ccInfos || [];
    if (ccInfos.length > 0) {
      setCcEmailsVisible(true);
      const ccEmails = ccInfos[0].email;
      form.setFieldsValue({ ccEmails });
    }
  }, [strategy]);

  const handleSave = () => {
    form.validateFields().then(values => {
      const settingData = { ...values } as ISettingData;
      settingData.emailAttachment = undefined;
      settingData.emailContent = undefined;
      settingData.emailOpDays = undefined;
      settingData.emailOpType = undefined;

      const ccInfos = getEmailsFromString(values.ccEmails || '').map(email => ({ email }));
      const senderEmails = form.getFieldValue('senderEmails');
      delete settingData.ccEmails;

      const sendSettingInfo = {
        ...settingData,
        ccInfos: ccInfos,
        senderEmails,
      };
      const contentEditInfo = getSendCommonParams(sendSettingInfo);

      // 内容上传
      setSaveLoading(true);
      edmApi
        .emailContentUpload({
          emailContent: contentEditInfo.emailContent,
          emailContentId: '',
        })
        .then(
          res => {
            const finalData: SecondSendStrategy = {
              sendSettingInfo: sendSettingInfo,
              contentEditInfo: {
                ...contentEditInfo,
                emailContentId: res.emailContentId,
              },
              triggerCondition: {
                conditionContent: {
                  emailOpDays: Number(values.emailOpDays),
                  emailOpType: Number(values.emailOpType || 2) as any,
                  ...([3, 4].some(item => item == filterStatus)
                    ? {
                        filterAutoReply: Number(filterChecked) as any,
                      }
                    : {}),
                },
                conditionType: 0,
                senderType,
              },
            };
            onSave && onSave(finalData);
            closeClickFunc();
          },
          err => {
            message.error('保存失败，请稍后重试');
          }
        )
        .finally(() => {
          setSaveLoading(false);
        });
    });
  };

  const getSendCommonParams = (formValues: ISettingData): EdmContentInfo => {
    const formSetting = formValues;
    const contentRef = editorRef.current.getContentReference();
    const attachmentList = contentRef.current?.getAttachmentList();
    const vars = contentRef.current?.getVars();
    const links: string[] = contentRef.current?.getLinks() || [];
    const productInfos: Array<{ productId: string; productLink: string; siteId: string }> = contentRef.current?.getProductsInfo();
    const titleVars: string[] = [];
    formSetting?.emailSubjects?.forEach(obj =>
      obj.subject.replace(/#\{(\S+)\}/g, (_: string, $1) => {
        if (titleVars.indexOf($1) === -1) {
          titleVars.push($1);
        }
        return _;
      })
    );
    // // 别名邮箱发送
    // if (sender) {
    //   formSetting.senderEmail = sender;
    // }
    const editor = contentRef.current?.getEditor();
    const editorBody = editor?.getBody();
    // if (isCopyHeader && editorBody) {
    //   const holderDiv = editorBody.querySelector('#waimao-reply-position');
    //   if (!holderDiv) {
    //     editorBody.insertAdjacentHTML('beforeend', '<div id="waimao-reply-position" style="display: none;"></div>');
    //   }
    // }
    // 邮件摘要需要添加
    if (editorBody) {
      const holderDiv: Element = editorBody.querySelector('#preheader-waimao');
      if (holderDiv) {
        holderDiv.remove();
      }
      if (formSetting?.emailSummary) {
        editorBody.insertAdjacentHTML(
          'afterbegin',
          `<span id="preheader-waimao" id="9999" style="display: none !important; font-size:0; line-height:0">${formSetting?.emailSummary}</span>`
        );
      }
    }
    // 如果没有编辑要取传入的content
    const content = hasEdit ? contentRef.current?.getContentWithAttachment() : strategy?.contentEditInfo.emailContent || '';

    // const trackImage = '<img width="0" height="0" src="#{r_host}/api/pub/edm/read?sign=#{r_p1}" />';
    let contentEditInfo: EdmContentInfo = {
      emailContent: content,
      emailAttachment: attachmentList && attachmentList.length ? JSON.stringify(attachmentList) : '',
      templateParams: uniq(titleVars.concat(vars || []).concat(state.templateParamsFromEditor)).join(','),
      traceLinks: links.map(link => ({ traceUrl: link, escapedTraceUrl: encodeHTML(link) })),
      edmSendProductInfos: productInfos,
      // emailReceipt: Number(emailReceipt)
    };
    if (contentRef.current == undefined) {
      contentEditInfo = strategy?.contentEditInfo;
    }

    if (state.templateId !== undefined) {
      contentEditInfo.templateId = state.templateId;
      contentEditInfo.emailType = EdmEmailType.USE_TEMPLATE;
    } else {
      contentEditInfo.emailType = EdmEmailType.CREATE_EMAIL;
    }
    return contentEditInfo;
  };

  const handleEditorSave = values => {
    setHasEdit(true);
    handleSetFieldsAndEditorValues({ contentEditInfo: values } as SecondSendStrategy);
    setEditorVisible(false);
  };
  const handleCustomSourceClick = () => {
    // form.setFieldsValue({ emailSubjects: [{ subject: '' }] });
    const payload = { emailContent: '', emailAttachment: '', senderEmail: form.getFieldValue('senderEmail') || '' };
    const handler = () => {
      form.setFieldsValue(payload);
      setEditorValues(payload);
      setEditorVisible(true);
    };
    const values: AutoMarketTaskActionContent.SEND_EDM = form.getFieldsValue();
    const emailContent = getEmailContent();
    if (emailContent.length > 0) {
      Modal.confirm({
        title: getIn18Text('CAOZUOTISHI'),
        content: getIn18Text('CICAOZUOJIANGFUGAIYIBIANJIDEYOUJIANZHENGWENJIFUJIAN\uFF0CSHIFOUJIXU\uFF1F'),
        onOk: handler,
      });
    } else {
      handler();
    }
  };

  const FilterReceiverComp = () => {
    return (
      <Form.Item>
        <div className={style.filterReceivers}>
          <div className={style.filterText}>用户</div>
          <Form.Item noStyle name="emailOpDays" rules={rules.trigger}>
            <Input style={{ width: '128px' }} placeholder="请输入数字"></Input>
          </Form.Item>
          <div className={style.filterText}>天内</div>
          <Form.Item noStyle name="emailOpType" rules={[{ required: false }]}>
            <Input hidden disabled />
            <Select
              onChange={item => {
                form.setFieldsValue({ emailOpType: item });
                setFilterStatus(item);
              }}
              dropdownClassName={style.dropdown}
              style={{ width: '188px', borderRadius: '4px' }}
              defaultValue={strategy?.triggerCondition?.conditionContent.emailOpType || 2}
            >
              <Option value={2}>未打开</Option>
              <Option value={3}>打开未回复</Option>
              <Option value={4}>未回复</Option>
            </Select>
          </Form.Item>
        </div>
      </Form.Item>
    );
  };

  const renderFilterAutoReplay = () => {
    if (![3, 4].some(item => item == filterStatus)) {
      return null;
    }
    return (
      <div
        style={{
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Checkbox
          checked={filterChecked}
          onChange={e => {
            setFilterChecked(e.target.checked);
            dataStoreApi.putSync(FILTER_AUTO_REPALY, e.target.checked ? 'true' : 'false');
          }}
        >
          过滤自动回复用户
        </Checkbox>
        <Tooltip title={'自动回复的用户仍视为未回复，将针对未回复或自动回复的用户进行多轮营销'}>
          <QuestionIcon className={style.isDelCheckTipIcon} />
        </Tooltip>
      </div>
    );
  };

  const MailAbstractComp = () => {
    return (
      <Form.Item label="邮件摘要" name="emailSummary">
        <Input maxLength={50} placeholder="请输入邮件摘要，未输入则使用默认摘要" />
      </Form.Item>
    );
  };

  const senderNickNameComp = () => {
    return (
      <Form.Item label={getIn18Text('FAJIANRENNICHENG')} name="sender" rules={rules.sender}>
        <Input width={360} placeholder={getIn18Text('QINGSHURUYOUJIANSONGDASHI\uFF0CXIANSHIDEFAJIANRENNICHENG')} maxLength={256} />
      </Form.Item>
    );
  };
  const addCCComp = () => {
    return (
      <Form.Item label=" " colon={false} noStyle>
        <div className={style.addCCWrap}>
          <div style={{ display: 'flex', width: '100px', height: '100%', alignItems: 'center' }} onClick={() => setCcEmailsVisible(!ccEmailsVisible)}>
            <SiriusCheckbox checked={ccEmailsVisible} styles={{ width: 16, height: 16, marginRight: 4 }} />
            <span>添加抄送人</span>
          </div>
        </div>
      </Form.Item>
    );
  };
  const validateEdmCc = async (emails: string[]) => {
    try {
      await edmApi.validateEdmCc({ ccInfos: (emails || []).map(email => ({ email })) });
      return null;
    } catch (e) {
      return (e as Error)?.message ?? getIn18Text('TONGYUFUWUQICUOWU\uFF0CQINGZHONGXINSHURU');
    }
  };
  const ccMailsComp = () => {
    return (
      <Form.Item label={getIn18Text('CHAOSONGREN')} name="ccEmails" rules={rules.ccEmails} className={style.ccEmails}>
        <Input width={360} placeholder={getIn18Text('QINGSHURUCHAOSONGYOUXIANG\uFF0CYIFENHAOFENGE')} />
      </Form.Item>
    );
  };

  const ReplyMailComp = () => {
    return (
      <Form.Item
        label={getIn18Text('HUIFUYOUXIANG')}
        name="replyEmail"
        required
        initialValue={user?.id}
        rules={[
          { required: true, message: getIn18Text('QINGSHURUHUIFUYOUXIANG') },
          { type: 'email', message: getIn18Text('YOUXIANGGESHIBUZHENGQUE') },
        ]}
      >
        <Input placeholder={getIn18Text('QINGSHURUHUIFUYOUXIANG')} />
      </Form.Item>
    );
  };

  const getEmailContent = () => {
    return getPlainTextFromHtml(getContentWithoutSign(editorValues.emailContent));
  };

  const EmailContentComp = () => {
    const text = getEmailContent();
    return (
      <Form.Item noStyle>
        {text.length > 0 && (
          <div className={style.emailDraft}>
            <div className={style.emailContent}>{getContentWithoutSign(editorValues.emailContent)}</div>
            <div className={style.emailEdit} onClick={() => setEditorVisible(true)}>
              {getIn18Text('BIANJI')}
            </div>
          </div>
        )}
        {!text && (
          <div className={style.mailContent} onClick={handleCustomSourceClick}>
            <img src={AddMailIcon} style={{ width: '32px', height: '32px' }} />
            <div className={style.title}>添加邮件内容</div>
          </div>
        )}
      </Form.Item>
    );
  };
  const ccReceiversVisible = () => {
    return (
      <Form.Item label=" " name="ccReceivers" valuePropName="checked" colon={false} noStyle>
        <CCReceivers value={} />
      </Form.Item>
    );
  };

  // ai润色
  const aiPolishThem = async (values: Array<any>, paths: Array<number>) => {
    setAiLoading(true);
    const data = form.getFieldsValue();
    try {
      const res = await aiModSubject(
        values.map(value => value.subject),
        1,
        5
      );
      // 成功之后改写
      let tempIndex = 0;
      let aiRewrite: any = {};
      const emailSubjects = data.emailSubjects?.map((item, index) => {
        if (paths.includes(index)) {
          // 需要改写
          const subject = res[tempIndex++] || '';
          aiRewrite[index] = subject;
          return {
            subject,
          };
        }
        aiRewrite[index] = item.subject;
        return item;
      });
      // 成功之后标记所有内容为ai填写
      setAiRewrite(aiRewrite);
      form.setFieldsValue({
        ...data,
        emailSubjects,
      });
      aiTimesSubtract();
    } catch (err: any) {
      message.error(err?.message || err);
      // 失败之后复原
      form.setFieldsValue(data);
    }
    setAiLoading(false);
  };

  const aiPolishThemClick = () => {
    // 埋点
    edmDataTracker.aiRewriteTheme();

    const values: Array<any> = form.getFieldValue('emailSubjects');
    if (values == null || values.some(value => value == null || !value.subject)) {
      return message.error('请输入主题内容');
    }
    const filterValues = values.filter((value, index) => !VAR_EXPREG.test(value.subject.trim()));
    if (filterValues.length === 0) {
      return message.error('仅包含变量无法进行改写');
    }

    const needFillPaths = values.reduce((pre, cur, index) => {
      if (!VAR_EXPREG.test(cur.subject.trim())) {
        return [...pre, index];
      }
      return pre;
    }, [] as Array<number>);
    setNeedFillPaths(needFillPaths);
    void aiPolishThem(values, needFillPaths);
  };

  // ai改写主题
  const aiChangeTheme = async (them: string, paths: Array<number>, values: Array<any>) => {
    setAiLoading(true);
    const data = form.getFieldsValue();
    // const aiChangeSubjects = [...values, ...Array.from({length: (5 - values.length)})];
    form.setFieldsValue({
      ...data,
      emailSubjects: values,
    });
    try {
      const res = await aiModSubject([data.emailSubjects![0]!.subject], paths.length, 3);
      // 成功之后改写
      let tempIndex = 0;
      let aiRewrite: any = {};
      const emailSubjects = values?.map((item, index) => {
        if (paths.includes(index)) {
          // 需要改写
          const subject = res[tempIndex++] || '';
          aiRewrite[index] = subject;
          return {
            subject,
          };
        }
        return item;
      });
      setAiRewrite(aiRewrite);
      form.setFieldsValue({
        ...data,
        emailSubjects,
      });
      message.success('主题生成成功');
      aiTimesSubtract();
      // return res;
    } catch (err: any) {
      message.error(err?.message || err);
      // 失败之后复原
      form.setFieldsValue(data);
    }
    setAiLoading(false);
  };

  const addAiTheme = (fields: FormListFieldData[]) => {
    // 埋点
    edmDataTracker.aiGenerateThem();

    const values: Array<any> = form.getFieldValue('emailSubjects');
    if (values == null || !values[0] || !values[0].subject) {
      return message.error('请填写邮件主题');
    }
    if (VAR_EXPREG.test(values[0].subject.trim())) {
      return message.error('仅包含变量无法生成更多主题');
    }
    const filledValues = [...values, ...Array.from({ length: 5 - values.length })];
    // 需要填充的paths。有两个条件1: 内容未填写；2. 改内容由ai填写
    const needFillPaths = filledValues.reduce((pre, cur, index) => {
      if (!cur || !cur.subject || (aiRewrite[index] && aiRewrite[index] === filledValues[index].subject)) {
        return [...pre, index];
      }
      return pre;
    }, [] as Array<any>);
    if (needFillPaths.length === 0) {
      return message.error('最多添加5个主题');
    }
    setNeedFillPaths(needFillPaths);
    // 开始请求ai改写
    aiChangeTheme('', needFillPaths, filledValues);
  };

  const renderTheme = (index: number) => {
    // ai生成主题
    if (aiLoading && needFillPaths.includes(index)) {
      const value = form.getFieldValue('emailSubjects')[index]?.subject || 'AI邮件主题正在生成中...';
      return (
        <div>
          <Input style={{ width: 379 }} value={value} suffix={<LoadingIcon className={style.loadingIcon} />} />
        </div>
      );
    }

    return (
      <Input
        placeholder={getIn18Text('QINGSHURUYOUJIANZHUTI')}
        maxLength={256}
        ref={subjectInputRefs[index] as React.LegacyRef<any>}
        suffix={
          inFFMS ? null : (
            <div
              onMouseDown={e => {
                e.stopPropagation();
              }}
              onClick={() => {
                themeIndexRef.current = index;
                setVariableVisible(true);
              }}
            >
              <div className={classnames(style.insertBtn)}>插入变量</div>
              {/* <InsertVariable
            expandPosition='leftBottom' onChange={value => handleSubjectVariableChange(value, index)}
            emptyContactType={state.emptyContactType}
          /> */}
            </div>
          )
        }
      />
    );
  };

  const FormComp = () => {
    return (
      <Form className={style.form} form={form} layout="vertical" autoComplete="off">
        {/* 筛选条件 */}
        <div className={style.groupName}>筛选条件</div>
        {FilterReceiverComp()}
        {renderFilterAutoReplay()}
        <div className={style.groupName}>{getIn18Text('YOUJIANSHEZHI')}</div>
        <Form.List name="emailSubjects" initialValue={[{ subject: '' }]}>
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map(({ key, name, fieldKey, ...restField }, index) => {
                return (
                  <Form.Item label={index === 0 ? getIn18Text('YOUJIANZHUTI') : ''} required key={key}>
                    <Space>
                      <Form.Item
                        {...restField}
                        name={[name, 'subject']}
                        fieldKey={[name, 'subject']}
                        rules={[{ required: true, message: getIn18Text('QINGSHURUYOUJIANZHUTI') }]}
                        noStyle
                      >
                        {renderTheme(index)}
                      </Form.Item>
                      <Form.Item noStyle>
                        {index === 0 ? (
                          fields.length < 5 ? (
                            <AddIcon className={style.subjectIcon} onClick={() => add()} />
                          ) : (
                            <RemoveIcon className={style.subjectIcon} onClick={() => remove(index)} />
                          )
                        ) : (
                          <RemoveIcon className={style.subjectIcon} onClick={() => remove(index)} />
                        )}
                      </Form.Item>
                    </Space>
                  </Form.Item>
                );
              })}
              {
                <Form.Item label=" " colon={false} noStyle>
                  <div className={style.addSubWrap}>
                    <div className={style.addSubLeft}>
                      <Button
                        type="link"
                        style={{
                          marginRight: 6,
                        }}
                        disabled={aiLoading}
                        onClick={() => addAiTheme(fields)}
                        className={style.btnBox}
                      >
                        <AiAddIcon className={style.addSubIcon} />
                        <span className={style.addSubTxt2}>AI生成主题</span>
                      </Button>
                      <Button type="link" disabled={aiLoading} onClick={aiPolishThemClick} className={`${style.btnBox} ${style.btnBox2}`}>
                        <AiChangeIcon className={style.addSubIcon} />
                        <span className={style.addSubTxt2}>AI润色</span>
                      </Button>
                    </div>
                  </div>
                </Form.Item>
              }
              <div style={{ position: 'relative', top: -48 }}>
                <Form.ErrorList errors={errors} />
              </div>
            </>
          )}
        </Form.List>
        {
          senderNickNameComp() // 发件人昵称
        }
        {/* 添加抄送人 */}
        {!inFFMS && addCCComp()}
        {ccEmailsVisible && (
          <>
            {ccMailsComp()}
            {ccReceiversVisible()}
          </>
        )}
        {/* 发件地址 */}
        {isSecondSend ? (
          <SecondSenderEmail
            form={form}
            isSecondSend
            initSenderEmails={strategy?.sendSettingInfo.senderEmails}
            senderType={strategy?.triggerCondition?.senderType ?? 0}
            senderTypeChange={setSenderType}
          />
        ) : (
          <SenderEmail form={form} />
        )}
        {
          ReplyMailComp() // 回复邮箱
        }
        {
          MailAbstractComp() // 邮件摘要
        }
        <div className={style.groupName}>{getIn18Text('YOUJIANNEIRONG')}</div>
        <Form.Item name="emailContent" rules={[{ required: true, message: getIn18Text('QINGSHURUYOUJIANNEIRONG') }]}>
          {EmailContentComp()}
        </Form.Item>
        <Form.Item name="emailAttachment" noStyle>
          <Input disabled hidden />
        </Form.Item>
      </Form>
    );
  };

  const closeClickFunc = () => {
    onClose && onClose();
  };

  const onCancel = () => {
    Modal.confirm({
      title: '取消后已填写内容将不会保存，确认继续？',
      // icon: <img src={WarningIcon} style={{ width: '20px', height: '24px' }} />,
      onOk: () => {
        closeClickFunc();
      },
    });
  };

  return (
    <CustomerDrawer
      className={style.edmSetting}
      zIndex={101}
      visible={visible}
      maskStyle={{ background: '#ffffff00' }}
      title={isEditing ? '编辑多轮营销' : '添加多轮营销'}
      contentWrapperStyle={{ width: '468px' }}
      destroyOnClose
      closeIcon={<img src={CloseIcon} />}
      onClose={() => {
        onCancel();
      }}
      getContainer={'#edm-write-root'}
      footer={
        <div className={style.edmSettingFooter}>
          <Button
            onClick={() => {
              onCancel();
            }}
          >
            取消
          </Button>
          <Button type="primary" disabled={aiLoading} loading={saveLoading} onClick={handleSave}>
            {getIn18Text('BAOCUN')}
          </Button>
        </div>
      }
    >
      <div className={style.edmSettingBody}>{FormComp()}</div>
      <EditorModal
        ref={editorRef}
        isReMarketing
        destroyOnClose={false}
        visible={editorVisible}
        emailContent={editorValues.emailContent}
        emailAttachment={editorValues.emailAttachment}
        emailSenderEmail={form?.getFieldValue('senderEmail') || ''}
        onCancel={() => setEditorVisible(false)}
        onSave={handleEditorSave}
        // needModal={needModal}
        needModal
        templateSource="reMarketing"
      />

      {variableVisible && (
        <InsertVariablModal
          variableVisible={variableVisible}
          onChange={value => {
            handleSubjectVariableChange(value, themeIndexRef.current);
            setVariableVisible(false);
          }}
          emptyContactType={state.emptyContactType}
          onVisible={visible => {
            !visible && setVariableVisible(false);
          }}
        />
      )}
    </CustomerDrawer>
  );
};
export default ReMarketing;
