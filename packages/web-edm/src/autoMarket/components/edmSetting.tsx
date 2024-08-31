import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { AutoMarketTaskActionContent, ResponseSendBoxCopy, AutoMarketTaskDetail } from 'api';
import { Button, Form, Space, Input } from 'antd';
import { edmWriteContext } from '../../send/edmWriteContext';
import { InsertVariable } from '../../components/insertVariable/insertVariable';
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
import { CronSendInfo } from './cronSendInfo';
import { getDefaultEmailVal } from '../constant';
import { MultiVersionMails } from './multiVersionMails';
import { getEdmEmailVars } from '../utils';
import { InsertVariablModal } from './contentEditor/insertVariableModal';
import { SenderEmail } from '../../components/SenderEmail/senderEmail';
import { getTransText } from '@/components/util/translate';

import style from './edmSetting.module.scss';
import { getIn18Text } from 'api';

interface EdmSettingProps {
  visible: boolean;
  qs?: Record<string, string>;
  taskDetail: AutoMarketTaskDetail;
  values: AutoMarketTaskActionContent.SEND_EDM;
  resetValues: AutoMarketTaskActionContent.SEND_EDM;
  onSave: (values: AutoMarketTaskActionContent.SEND_EDM) => void;
  onClose: () => void;
}

const EdmSetting: React.FC<EdmSettingProps> = props => {
  const { visible, values, resetValues, onSave, onClose, qs } = props;
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
  const aiModifyRef = useRef<any>();
  const [saveLoading, setSaveLoading] = useState(false);
  const [variableVisible, setVariableVisible] = useState(false);
  const visibleInsertVariable = useRef<boolean>(false);
  const themeIndexRef = useRef<number>(0);

  const handleSubjectVariableChange = (value: (string | number)[], index: number) => {
    const variable = value[value.length - 1];
    const insertContent = ` #{${variable}}`;
    const inputEl = subjectInputRefs[index].current;
    const selectionStart = (inputEl as any)?.input?.selectionStart;
    const selectionEnd = (inputEl as any)?.input?.selectionEnd;
    const edmEmailSubjects = form.getFieldValue('edmEmailSubjects');
    const edmEmailSubject = edmEmailSubjects[index] || '';
    if (typeof selectionStart === 'number' && typeof selectionEnd === 'number') {
      const nextEdmEmailSubjects = [...edmEmailSubjects];
      const nextEdmEmailSubject = edmEmailSubject.substring(0, selectionStart) + insertContent + edmEmailSubject.substring(selectionEnd);
      nextEdmEmailSubjects[index] = nextEdmEmailSubject;
      form.setFieldsValue({
        edmEmailSubjects: nextEdmEmailSubjects,
      });
    }
  };

  const handleSetFieldsAndEditorValues = (values: AutoMarketTaskActionContent.SEND_EDM) => {
    form.setFieldsValue({ ...values });
    setEditorValues({
      emailContent: values.emailContent,
      emailAttachment: values.emailAttachment,
    });
  };
  useEffect(() => {
    handleSetFieldsAndEditorValues(values);
  }, [values]);

  useEffect(() => {
    if (!props.visible) {
      return;
    }
    getDefaultEmailVal(props.taskDetail).then(res => {
      const edmEmailSender = form.getFieldValue('edmEmailSender');
      const replyEmail = form.getFieldValue('replyEmail');
      if (!res || (edmEmailSender && replyEmail)) {
        return;
      }

      if (!edmEmailSender) {
        form.setFields([{ name: 'edmEmailSender', value: res?.defaultEdmEmailSender || '' }]);
      }

      if (!replyEmail) {
        form.setFields([{ name: 'replyEmail', value: res?.defaultReplyEmail || '' }]);
      }
    });
  }, [props.taskDetail?.taskObjectInfo, props.visible]);

  const handleReset = async () => {
    await aiModifyRef.current.stop();
    handleSetFieldsAndEditorValues(resetValues);
  };

  const handleSave = async () => {
    form.validateFields().then(values => {
      // 插入变量处理
      const templateParams = getEdmEmailVars(values?.emailContent || '', values?.edmEmailSubjects || []);
      values.templateParams = templateParams;
      setSaveLoading(true);
      aiModifyRef.current
        .save()
        .then((multipleContentInfo: any) => {
          values.multipleContentInfo = multipleContentInfo;
          onSave(values);
        })
        .finally(() => setSaveLoading(false));
    });
  };
  const handleEditorSave = (nextEditorValues: EdmEditorValues) => {
    handleSetFieldsAndEditorValues(nextEditorValues as AutoMarketTaskActionContent.SEND_EDM);
    setEditorVisible(false);
  };
  const handleCustomSourceClick = () => {
    const payload = { emailContent: '', emailAttachment: '' };
    const handler = () => {
      form.setFieldsValue(payload);
      setEditorValues(payload);
      setEditorVisible(true);
    };
    const values: AutoMarketTaskActionContent.SEND_EDM = form.getFieldsValue();
    if (values.emailContent) {
      Modal.confirm({
        title: getIn18Text('CAOZUOTISHI'),
        content: getIn18Text('CICAOZUOJIANGFUGAIYIBIANJIDEYOUJIANZHENGWENJIFUJIAN\uFF0CSHIFOUJIXU\uFF1F'),
        onOk: handler,
      });
    } else {
      handler();
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
      emailContent: sendboxInfo.contentEditInfo.emailContent,
      emailAttachment: sendboxInfo.contentEditInfo.emailAttachment || '',
    };
    const handler = () => {
      form.setFieldsValue(payload);
      setEditorValues({
        emailContent: payload.emailContent,
        emailAttachment: payload.emailAttachment,
      });
      setSendboxVisible(false);
      setEditorVisible(true);
    };
    const values: AutoMarketTaskActionContent.SEND_EDM = form.getFieldsValue();
    let shouldConfirm = false;
    if (values.edmEmailSubjects.length > 1 || values.edmEmailSubjects[0] || values.edmEmailSender || values.replyEmail || values.emailContent) {
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
  };

  const onTemplateClick = () => {
    changeShowTemplateList({
      isShow: true,
      defaultActiveTab: 2,
    });
  };

  const getTemplateResult = (values: ViewMail) => {
    const emailContent = values?.entry?.content?.content || '';
    // emailAttachment
    handleSetFieldsAndEditorValues({ emailContent, emailAttachment: '' } as AutoMarketTaskActionContent.SEND_EDM);
    changeShowTemplateList({ isShow: false, defaultActiveTab: 1 });
  };

  useEffect(() => {
    if (!editorValues?.emailContent) {
      aiModifyRef.current.resetStatus();
    }
  }, [editorValues]);

  return (
    <Drawer
      className={style.edmSetting}
      title={getIn18Text('FASONGYINGXIAOYOUJIAN')}
      contentWrapperStyle={{ width: 550 }}
      visible={visible}
      onClose={async () => {
        await aiModifyRef.current.stop();
        handleSetFieldsAndEditorValues(values);
        onClose();
      }}
      footer={
        <div className={style.edmSettingFooter}>
          <Button onClick={handleReset}>{getIn18Text('ZHONGZHI')}</Button>
          <Button type="primary" loading={saveLoading} onClick={handleSave}>
            {getIn18Text('BAOCUN')}
          </Button>
        </div>
      }
    >
      <div className={style.edmSettingBody}>
        <Form className={style.form} form={form} layout="vertical" autoComplete="off">
          <div className={style.groupName}>{getIn18Text('YOUJIANSHEZHI')}</div>
          <Form.List name="edmEmailSubjects">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, fieldKey, ...restField }, index) => {
                  return (
                    <Form.Item label={index === 0 ? getIn18Text('YOUJIANZHUTI') : ''} required key={key}>
                      <Space>
                        <Form.Item {...restField} name={name} fieldKey={name} rules={[{ required: true, message: getIn18Text('QINGSHURUYOUJIANZHUTI') }]} noStyle>
                          <Input
                            placeholder={getIn18Text('QINGSHURUYOUJIANZHUTI')}
                            maxLength={256}
                            ref={subjectInputRefs[index] as React.LegacyRef<any>}
                            suffix={
                              <div
                                onMouseDown={e => {
                                  e.stopPropagation();
                                }}
                                onClick={() => {
                                  themeIndexRef.current = index;
                                  setVariableVisible(true);
                                }}
                              >
                                <div className={style.insertBtn}>{getTransText('CHARUBIANLIANG')}</div>
                              </div>
                            }
                          />
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
          <SenderEmail form={form} />
          <Form.Item
            label={getIn18Text('FAJIANRENNICHENG')}
            name="edmEmailSender"
            required
            rules={[{ required: true, message: getIn18Text('QINGSHURUFAJIANRENNICHENG') }]}
          >
            <Input placeholder={getIn18Text('QINGSHURUFAJIANRENNICHENG')} />
          </Form.Item>
          <Form.Item
            label={getIn18Text('HUIFUYOUXIANG')}
            name="replyEmail"
            required
            rules={[
              { required: true, message: getIn18Text('QINGSHURUHUIFUYOUXIANG') },
              { type: 'email', message: getIn18Text('YOUXIANGGESHIBUZHENGQUE') },
            ]}
          >
            <Input placeholder={getIn18Text('QINGSHURUHUIFUYOUXIANG')} />
          </Form.Item>
          <div className={style.groupName}>{getIn18Text('YOUJIANNEIRONG')}</div>
          <Form.Item name="emailContent" rules={[{ required: true, message: getIn18Text('QINGSHURUYOUJIANNEIRONG') }]}>
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
          <Form.Item name="emailAttachment" noStyle>
            <Input disabled hidden />
          </Form.Item>
          <div className={style.smartName}>{getTransText('ZHINENGZHUSHOU')}</div>
          <div className={style.tip}>
            {getTransText('BUZHIDAOZENMETISHENGYINGXIAOXIAOGUO')}
            <a href="https://waimao.163.com/funpage/edm" target="_blank">
              {getTransText('LIAOJIEGENGDUO')}
            </a>
          </div>
          <Form.Item name={['multipleContentInfo']} noStyle>
            <MultiVersionMails
              contactSize={625}
              visible={true}
              ref={aiModifyRef}
              // disabled={Boolean(qs?.taskId || qs?.copyTaskId)}
              emailContent={editorValues.emailContent}
              sendShowForm={() => {}}
            />
          </Form.Item>
          <div className={style.tip}>
            {getIn18Text('QIZHONGTUIDING/HEIMINGDANYONGHU\u3001GUOLVWEIWUXIAOYIJIYIJINGFASONGGUODEDUIXIANG\uFF0CZAIZHIXINGDONGZUOSHIPAICHU')}
          </div>
          <Form.Item name="cronSendInfo" noStyle>
            <CronSendInfo form={form}></CronSendInfo>
          </Form.Item>
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
      <InsertVariablModal
        variableVisible={variableVisible}
        onChange={v => {
          handleSubjectVariableChange(v as string[], themeIndexRef.current);
          setVariableVisible(false);
        }}
        onVisible={visible => {
          !visible && setVariableVisible(false);
          visibleInsertVariable.current = visible;
        }}
      />
    </Drawer>
  );
};
export default EdmSetting;
