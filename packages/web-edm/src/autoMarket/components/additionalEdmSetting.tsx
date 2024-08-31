import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Button, InputNumber, Form, Space, Input } from 'antd';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import { AutoMarketTaskAction, ResponseSendBoxCopy, AutoMarketTaskDetail, AutoMarketTaskType } from 'api';
import { edmWriteContext } from '../../send/edmWriteContext';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { NewTamplateModal } from '../../mailTemplate/NewTamplateModal';
import { TemplateAddModal } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';
import { useActions, MailTemplateActions } from '@web-common/state/createStore';
import { ViewMail } from '@web-common/state/state';
import EdmEditorModal, { EdmEditorValues } from './edmEditorModal';
import EdmSendboxModal from './edmSendboxModal';
import EmailSource from './emailSource';
import { ReactComponent as AddIcon } from '@/images/icons/edm/autoMarket/add.svg';
import { ReactComponent as RemoveIcon } from '@/images/icons/edm/autoMarket/subtract.svg';
import { getPlainTextFromHtml } from '../../utils';
import { autoMarketTracker } from '../tracker';
import { EmailOpTypeSelect } from './emailOpTypeSelect';
import { getDefaultEmailVal } from '../constant';
import { SmartAssistant } from './smartAssistant';

import style from './additionalEdmSetting.module.scss';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';

interface AdditionalEdmSettingProps {
  taskDetail: AutoMarketTaskDetail;
  visible: boolean;
  values: AutoMarketTaskAction;
  resetValues: AutoMarketTaskAction;
  onSave: (values: AutoMarketTaskAction) => void;
  onClose: () => void;
}
const AdditionalEdmSetting: React.FC<AdditionalEdmSettingProps> = props => {
  const { visible, values, resetValues, onSave, onClose } = props;
  const { state, dispatch } = useContext(edmWriteContext).value;
  const [form] = Form.useForm();
  const [sendboxVisible, setSendboxVisible] = useState<boolean>(false);
  const [editorVisible, setEditorVisible] = useState<boolean>(false);
  const { changeShowTemplateList } = useActions(MailTemplateActions);
  const [editorValues, setEditorValues] = useState<EdmEditorValues>({
    emailContent: '',
    emailAttachment: '',
  });
  const subjectInputRefs = useMemo<React.RefObject<HTMLInputElement>[]>(() => {
    return Array.from({ length: 5 }).map(() => React.createRef());
  }, []);
  const [isDiabledSmart, setIsDiabledSmart] = useState<boolean>(false);
  const handleSubjectVariableChange = (value: (string | number)[], index: number) => {
    const variable = value[value.length - 1];
    const insertContent = ` #{${variable}}`;
    const inputEl = subjectInputRefs[index].current;
    const selectionStart = (inputEl as any)?.input?.selectionStart;
    const selectionEnd = (inputEl as any)?.input?.selectionEnd;
    const sendEdmEmailAction = form.getFieldValue(['actionContent', 'sendEdmEmailAction']);
    const edmEmailSubjects = sendEdmEmailAction.edmEmailSubjects;
    const edmEmailSubject = edmEmailSubjects[index] || '';
    if (typeof selectionStart === 'number' && typeof selectionEnd === 'number') {
      const nextEdmEmailSubjects = [...edmEmailSubjects];
      const nextEdmEmailSubject = edmEmailSubject.substring(0, selectionStart) + insertContent + edmEmailSubject.substring(selectionEnd);
      nextEdmEmailSubjects[index] = nextEdmEmailSubject;
      form.setFieldsValue({
        actionContent: {
          sendEdmEmailAction: {
            ...sendEdmEmailAction,
            edmEmailSubjects: nextEdmEmailSubjects,
          },
        },
      });
    }
  };
  useEffect(() => {
    form.setFieldsValue({ ...values });
    if (values.actionContent.sendEdmEmailAction) {
      setEditorValues({
        emailContent: values.actionContent.sendEdmEmailAction.emailContent,
        emailAttachment: values.actionContent.sendEdmEmailAction.emailAttachment,
      });
    }
  }, [values]);

  useEffect(() => {
    if (isDiabledSmart) {
      form.setFields([
        {
          name: ['actionContent', 'sendEdmEmailAction', 'replyEdmEmail'],
          value: false,
        },
      ]);
    }
  }, [isDiabledSmart]);

  useEffect(() => {
    if (!props.visible) {
      return;
    }
    getDefaultEmailVal(props.taskDetail).then(res => {
      const edmEmailSender = form.getFieldValue(['actionContent', 'sendEdmEmailAction', 'edmEmailSender']);
      const replyEmail = form.getFieldValue(['actionContent', 'sendEdmEmailAction', 'replyEmail']);
      const isQuote = form.getFieldValue(['triggerConditionVo', 'triggerConditionList', 0, 'conditionContent', 'emailOpType']) === 100;
      setIsDiabledSmart(isQuote);
      if (!res || (edmEmailSender && replyEmail)) {
        return;
      }

      if (!edmEmailSender) {
        form.setFields([
          {
            name: ['actionContent', 'sendEdmEmailAction', 'edmEmailSender'],
            value: res?.defaultEdmEmailSender || '',
          },
        ]);
      }

      if (!replyEmail) {
        form.setFields([
          {
            name: ['actionContent', 'sendEdmEmailAction', 'replyEmail'],
            value: res?.defaultReplyEmail || '',
          },
        ]);
      }
    });
  }, [props.taskDetail?.taskObjectInfo, props.visible]);

  const handleReset = () => {
    form.setFieldsValue({ ...resetValues });
    if (resetValues && resetValues.actionContent.sendEdmEmailAction) {
      setEditorValues({
        emailContent: resetValues.actionContent.sendEdmEmailAction.emailContent,
        emailAttachment: resetValues.actionContent.sendEdmEmailAction.emailAttachment,
      });
    }
  };
  const handleSave = () => {
    form.validateFields().then(values => {
      onSave(values);
    });
  };
  const handleEditorSave = (nextEditorValues: EdmEditorValues) => {
    nextEditorValues.emailContent = addEmailContent(nextEditorValues.emailContent);
    form.setFieldsValue({
      actionContent: {
        sendEdmEmailAction: nextEditorValues,
      },
    });
    setEditorValues({
      emailContent: nextEditorValues.emailContent,
      emailAttachment: nextEditorValues.emailAttachment,
    });
    setEditorVisible(false);
  };

  const onTemplateClick = () => {
    changeShowTemplateList({
      isShow: true,
      defaultActiveTab: 2,
    });
  };
  const addEmailContent = (htmlStr: String) => {
    if (!htmlStr) return;
    const element = document.createElement('html');
    element.innerHTML = htmlStr;
    let body = element.querySelector('body');
    body.insertAdjacentHTML('beforeend', '<div id="waimao-reply-position" style="display: none;"></div>');
    let jsonData = `<html xmlns='http://www.w3.org/1999/xhtml'>${element.innerHTML}</html>`;
    return jsonData;
  };
  const getTemplateResult = (values: ViewMail) => {
    const emailContent = addEmailContent(values?.entry?.content?.content || '');
    // emailAttachment
    form.setFieldsValue({
      actionContent: {
        sendEdmEmailAction: {
          emailContent,
          emailAttachment: '',
        },
      },
    });
    setEditorValues({
      emailContent: emailContent,
      emailAttachment: '',
    });
    changeShowTemplateList({ isShow: false });
  };

  const handleCustomSourceClick = () => {
    const payload = { emailContent: '', emailAttachment: '' };
    const handler = () => {
      form.setFieldsValue({
        actionContent: {
          sendEdmEmailAction: payload,
        },
      });
      setEditorValues(payload);
      setEditorVisible(true);
    };
    const values: AutoMarketTaskAction = form.getFieldsValue();
    const { sendEdmEmailAction } = values.actionContent;
    if (sendEdmEmailAction) {
      if (sendEdmEmailAction.emailContent) {
        Modal.confirm({
          title: getIn18Text('CAOZUOTISHI'),
          content: getIn18Text('CICAOZUOJIANGFUGAIYIBIANJIDEYOUJIANZHENGWENJIFUJIAN\uFF0CSHIFOUJIXU\uFF1F'),
          onOk: handler,
        });
      } else {
        handler();
      }
    }
    autoMarketTracker.emailContentTypeSubmit('new');
  };
  const handleEdmSourceClick = () => {
    setSendboxVisible(true);
    autoMarketTracker.emailContentTypeSubmit('select');
  };
  const handleSendboxPicked = (sendboxInfo: ResponseSendBoxCopy) => {
    const payload = {
      edmEmailSubjects: (sendboxInfo.sendSettingInfo.emailSubjects || []).map(item => item.subject),
      edmEmailSender: sendboxInfo.sendSettingInfo.sender,
      replyEmail: sendboxInfo.sendSettingInfo.replyEmail,
      emailContent: addEmailContent(sendboxInfo.contentEditInfo.emailContent),
      emailAttachment: sendboxInfo.contentEditInfo.emailAttachment || '',
    };
    const handler = () => {
      form.setFieldsValue({
        actionContent: {
          sendEdmEmailAction: payload,
        },
      });
      setEditorValues({
        emailContent: payload.emailContent,
        emailAttachment: payload.emailAttachment,
      });
      setSendboxVisible(false);
      setEditorVisible(true);
    };
    const values: AutoMarketTaskAction = form.getFieldsValue();
    const { sendEdmEmailAction } = values.actionContent;
    if (sendEdmEmailAction) {
      let shouldConfirm = false;
      if (
        sendEdmEmailAction.edmEmailSubjects.length > 1 ||
        sendEdmEmailAction.edmEmailSubjects[0] ||
        sendEdmEmailAction.edmEmailSender ||
        sendEdmEmailAction.replyEmail ||
        sendEdmEmailAction.emailContent
      ) {
        shouldConfirm = true;
      }
      if (shouldConfirm) {
        Modal.confirm({
          title: getIn18Text('CAOZUOTISHI'),
          content: getIn18Text('CICAOZUOJIANGFUGAIZHIQIANBIANJIDENEIRONG\uFF0CSHIFOUJIXU\uFF1F'),
          onOk: handler,
        });
      } else {
        handler();
      }
    }
  };
  return (
    <Drawer
      className={style.additionalEdmSetting}
      title={getIn18Text('FASONGYINGXIAOYOUJIAN')}
      contentWrapperStyle={{ width: 550 }}
      visible={visible}
      onClose={() => {
        form.setFieldsValue({ ...values });
        onClose();
      }}
      footer={
        <div className={style.additionalEdmSettingFooter}>
          <Button onClick={handleReset}>{getIn18Text('ZHONGZHI')}</Button>
          <Button type="primary" onClick={handleSave}>
            {getIn18Text('BAOCUN')}
          </Button>
        </div>
      }
    >
      <div className={style.additionalEdmSettingBody}>
        <Form className={style.form} form={form} layout="vertical">
          <div className={style.groupName}>{getIn18Text('CHUFATIAOJIAN')}</div>
          <Form.Item name="triggerConditionVo" noStyle>
            <Form.List name={['triggerConditionVo', 'triggerConditionList']}>
              {fields => (
                <>
                  {fields.map(({ key, name, fieldKey, ...restField }, index) => {
                    return (
                      <Form.Item noStyle shouldUpdate={() => true}>
                        {() => {
                          const opType = form.getFieldValue(['triggerConditionVo', 'triggerConditionList', name, 'conditionContent', 'emailOpType']);
                          const disableDays = ['0', '1', '100'].includes(String(opType));
                          return (
                            <Form.Item className={style.formItemTriggerCondition}>
                              <div className={style.triggerCondition}>
                                {disableDays ? null : (
                                  <>
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'conditionContent', 'emailOpDays']}
                                      fieldKey={[name, 'conditionContent', 'emailOpDays']}
                                      rules={[{ required: true, message: getIn18Text('QINGSHURUTIANSHU') }]}
                                    >
                                      <InputNumber precision={0} className={style.emailOpDays} placeholder={getIn18Text('SHURUTIANSHU')} min={1} />
                                    </Form.Item>
                                    <span className={style.spaceText}>{getIn18Text('TIANNEI')}</span>
                                  </>
                                )}
                                <Form.Item
                                  {...restField}
                                  name={[name, 'conditionContent', 'emailOpType']}
                                  fieldKey={[name, 'conditionContent', 'emailOpType']}
                                  rules={[{ required: true, message: getIn18Text('QINGXUANZEDONGZUO') }]}
                                >
                                  <EmailOpTypeSelect
                                    style={{ width: 130 }}
                                    onChange={type => {
                                      if (disableDays) {
                                        const formData = form.getFieldsValue();
                                        if (formData?.triggerConditionVo?.triggerConditionList?.[index]?.conditionContent) {
                                          formData.triggerConditionVo.triggerConditionList[index].conditionContent.emailOpDays = '';
                                          form.setFieldsValue({ ...formData });
                                        }
                                      }
                                      if (type === 100) {
                                        setIsDiabledSmart(true);
                                      } else {
                                        setIsDiabledSmart(false);
                                      }
                                    }}
                                  >
                                    <Select.Option value={100}>{getTransText('BUXUYAOPANDUAN')}</Select.Option>
                                  </EmailOpTypeSelect>
                                </Form.Item>
                                <span className={style.spaceText}>{getIn18Text('SHANGFENGYOUJIAN\uFF0C ZEZHIXINGYIXIADONGZUO')}</span>
                              </div>
                            </Form.Item>
                          );
                        }}
                      </Form.Item>
                    );
                  })}
                </>
              )}
            </Form.List>
          </Form.Item>
          <div className={style.groupName}>{getIn18Text('YOUJIANSHEZHI')}</div>
          <Form.List name={['actionContent', 'sendEdmEmailAction', 'edmEmailSubjects']}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, fieldKey, ...restField }, index) => {
                  return (
                    <Form.Item label={index === 0 ? getIn18Text('YOUJIANZHUTI') : ''} required key={key}>
                      <Space>
                        <Form.Item {...restField} name={name} fieldKey={name} rules={[{ required: true, message: getIn18Text('QINGSHURUYOUJIANZHUTI') }]} noStyle>
                          <Input placeholder={getIn18Text('QINGSHURUYOUJIANZHUTI')} maxLength={256} ref={subjectInputRefs[index] as React.LegacyRef<any>} />
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
              </>
            )}
          </Form.List>
          <Form.Item
            label={getIn18Text('FAJIANRENNICHENG')}
            name={['actionContent', 'sendEdmEmailAction', 'edmEmailSender']}
            rules={[{ required: true, message: getIn18Text('QINGSHURUFAJIANRENNICHENG') }]}
            required
          >
            <Input placeholder={getIn18Text('QINGSHURUFAJIANRENNICHENG')} />
          </Form.Item>
          <Form.Item
            label={getIn18Text('HUIFUYOUXIANG')}
            name={['actionContent', 'sendEdmEmailAction', 'replyEmail']}
            required
            rules={[
              { required: true, message: getIn18Text('QINGSHURUHUIFUYOUXIANG') },
              { type: 'email', message: getIn18Text('YOUXIANGGESHIBUZHENGQUE') },
            ]}
          >
            <Input placeholder={getIn18Text('QINGSHURUHUIFUYOUXIANG')} />
          </Form.Item>
          <div className={style.groupName}>{getIn18Text('YOUJIANNEIRONG')}</div>
          <Form.Item name={['actionContent', 'sendEdmEmailAction', 'emailContent']} rules={[{ required: true, message: getIn18Text('QINGSHURUYOUJIANNEIRONG') }]}>
            <Input disabled hidden />
            <Form.Item noStyle>
              <EmailSource onCustomClick={handleCustomSourceClick} onEdmClick={handleEdmSourceClick} onTemplateClick={onTemplateClick} />
              {editorValues.emailContent && (
                <div className={style.emailDraft}>
                  <div className={style.emailContent}>{editorValues.emailContent ? getPlainTextFromHtml(editorValues.emailContent) : '-'}</div>
                  <div className={style.emailEdit} onClick={() => setEditorVisible(true)}>
                    {getIn18Text('BIANJI')}
                  </div>
                </div>
              )}
            </Form.Item>
          </Form.Item>
          <Form.Item name={['actionContent', 'sendEdmEmailAction', 'emailAttachment']} noStyle>
            <Input disabled hidden />
          </Form.Item>
          <div className={style.smartName}>{getTransText('ZHINENGZHUSHOU')}</div>
          <div className={style.tip}>
            {getTransText('BUZHIDAOZENMETISHENGYINGXIAOXIAOGUO')}
            <a href="https://waimao.163.com/funpage/edm" target="_blank">
              {getTransText('LIAOJIEGENGDUO')}
            </a>
          </div>
          <Form.Item name={['actionContent', 'sendEdmEmailAction', 'replyEdmEmail']} noStyle>
            <SmartAssistant isDiabled={isDiabledSmart}></SmartAssistant>
          </Form.Item>
          <div className={style.tip}>{getIn18Text('YIZHIXINGGUOGAIDONGZUODESHUJUBUZAIZHONGFUZHIXING')}</div>
        </Form>
      </div>
      {values && (
        <EdmEditorModal
          visible={editorVisible}
          emailContent={editorValues.emailContent}
          emailAttachment={editorValues.emailAttachment}
          onCancel={() => setEditorVisible(false)}
          onSave={handleEditorSave}
        />
      )}
      <EdmSendboxModal visible={sendboxVisible} onCancel={() => setSendboxVisible(false)} onOk={handleSendboxPicked} />
      {visible ? (
        <>
          <NewTamplateModal emitResult={getTemplateResult} />
          <TemplateAddModal templateCategory="LX-WAIMAO" />
        </>
      ) : (
        ''
      )}
    </Drawer>
  );
};
export default AdditionalEdmSetting;
