import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { Button, InputNumber, Form } from 'antd';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import {
  AutoMarketTaskTruckAction,
  ResponseSendBoxCopy,
  AutoMarketTaskDetail,
  AutoMarketTaskObjectType,
  AutoMarketTaskActionType,
  AutoMarketTaskActionTypeName,
  AutoMarketTaskTriggerCondition,
} from 'api';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { NewTamplateModal } from '../../mailTemplate/NewTamplateModal';
import { TemplateAddModal } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';
import { useActions, MailTemplateActions } from '@web-common/state/createStore';
import { ViewMail } from '@web-common/state/state';
import EdmEditorModal, { EdmEditorValues } from './edmEditorModal';
import EdmSendboxModal from './edmSendboxModal';
import { autoMarketTracker } from '../tracker';
import { EmailOpTypeSelect } from './emailOpTypeSelect';
import { getDefaultEmailVal, FORM_INITIAL_VALUE, excludeConditionVo } from '../constant';
import { MainBranchTitle, ConditonBranchTitle, RadioGroup, ContactGroup, MainContactGroup, EdmMail } from './edmBranchSettingComponents';
import { getEdmEmailVars } from '../utils';
import style from './additionalEdmSettingNew.module.scss';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';

interface AdditionalEdmSettingProps {
  taskDetail: AutoMarketTaskDetail;
  visible: boolean;
  values: AutoMarketTaskTruckAction;
  resetValues: AutoMarketTaskTruckAction;
  currentItem: AutoMarketTaskTruckAction;
  qs: Record<string, string>;
  onSave: (values: AutoMarketTaskTruckAction) => void;
  onClose: () => void;
}
const AdditionalEdmSetting: React.FC<AdditionalEdmSettingProps> = props => {
  const { visible, values, resetValues, onSave, onClose, currentItem, qs } = props;
  const [form] = Form.useForm();
  const [sendboxVisible, setSendboxVisible] = useState<boolean>(false);
  const [editorVisible, setEditorVisible] = useState<boolean>(false);
  const { changeShowTemplateList } = useActions(MailTemplateActions);
  const [editorValues, setEditorValues] = useState<EdmEditorValues>({
    emailContent: '',
    emailAttachment: '',
  });
  const [actionType, setActionType] = useState<string>('');
  const [actionTypeField, setActionTypeField] = useState<string>('truckAction');

  const [isDiabledSmart, setIsDiabledSmart] = useState<boolean>(false);
  const [showBranch, setShowBranch] = useState<boolean>(false);
  const [isCanAddBranch, setIsCanAddBranch] = useState<boolean>(false);
  const [isPassive, setIsPassive] = useState<boolean>(false);
  const [addressDisabled, setAddressDisabled] = useState<boolean>(false);
  const aiModifyRef = useRef<any>();
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    form.setFieldsValue({ ...values });
    console.log('xxx-values-init', values, props.taskDetail.additionalActionLayerList);
    if (values?.truckAction?.actionContent?.sendEdmEmailAction) {
      setEditorValues({
        emailContent: values.truckAction.actionContent.sendEdmEmailAction.emailContent,
        emailAttachment: values.truckAction.actionContent.sendEdmEmailAction.emailAttachment,
      });
    }
    if (values?.branchAction?.actionType) {
      setShowBranch(true);
    } else {
      setShowBranch(false);
    }
    let emailOpType = values?.truckAction?.triggerConditionVo?.triggerConditionList[0]?.conditionContent as AutoMarketTaskTriggerCondition.EMAIL;
    if (emailOpType && [2, 3].includes(emailOpType.emailOpType)) {
      setIsPassive(true);
    } else {
      setIsPassive(false);
    }
    if (values?.truckAction?.actionType) {
      setActionType(values?.truckAction?.actionType);
    } else {
      setActionType(AutoMarketTaskActionType.SEND_EDM);
    }
  }, [values, props.visible]);

  useEffect(() => {
    if (actionType === AutoMarketTaskActionType.SEND_EDM && !showBranch && isPassive && !addressDisabled) {
      setIsCanAddBranch(true);
    } else {
      setIsCanAddBranch(false);
    }
  }, [showBranch, actionType, isPassive, addressDisabled]);

  useEffect(() => {
    if (isDiabledSmart) {
      form.setFields([
        {
          name: ['truckAction', 'actionContent', 'sendEdmEmailAction', 'replyEdmEmail'],
          value: false,
        },
      ]);
    }
  }, [isDiabledSmart]);

  useEffect(() => {
    if (!props.visible) {
      return;
    }
    initEmailData();
  }, [props.taskDetail?.taskObjectInfo, props.visible]);

  const initEmailData = () => {
    getDefaultEmailVal(props.taskDetail).then(res => {
      console.log('xxx-detail-data', props.taskDetail);

      // 仅有地址簿&&邮件营销任务的时候可选择
      const objectType = props.taskDetail?.taskObjectInfo?.objectType;
      setAddressDisabled(objectType !== AutoMarketTaskObjectType.ADDRESS && objectType !== AutoMarketTaskObjectType.EDM);
      const edmEmailSender = form.getFieldValue(['truckAction', 'actionContent', 'sendEdmEmailAction', 'edmEmailSender']);
      const replyEmail = form.getFieldValue(['truckAction', 'actionContent', 'sendEdmEmailAction', 'replyEmail']);
      const isQuote = form.getFieldValue(['truckAction', 'triggerConditionVo', 'triggerConditionList', 0, 'conditionContent', 'emailOpType']) === 100;
      setIsDiabledSmart(isQuote);
      if (!res || (edmEmailSender && replyEmail)) {
        return;
      }

      if (!edmEmailSender) {
        form.setFields([
          {
            name: ['truckAction', 'actionContent', 'sendEdmEmailAction', 'edmEmailSender'],
            value: res?.defaultEdmEmailSender || '',
          },
        ]);
      }

      if (!replyEmail) {
        form.setFields([
          {
            name: ['truckAction', 'actionContent', 'sendEdmEmailAction', 'replyEmail'],
            value: res?.defaultReplyEmail || '',
          },
        ]);
      }
    });
  };

  const handleReset = async () => {
    await aiModifyRef.current.stop();
    form.setFieldsValue({ ...resetValues });
    if (resetValues && resetValues.truckAction.actionContent.sendEdmEmailAction) {
      setEditorValues({
        emailContent: resetValues.truckAction.actionContent.sendEdmEmailAction.emailContent,
        emailAttachment: resetValues.truckAction.actionContent.sendEdmEmailAction.emailAttachment,
      });
    }
    showBranch && onDeleteBranch();
  };
  const handleSave = () => {
    form.validateFields().then(values => {
      // 插入变量处理
      const sendEdmEmailAction = values?.truckAction?.actionContent?.sendEdmEmailAction;
      if (sendEdmEmailAction) {
        const templateParams = getEdmEmailVars(sendEdmEmailAction?.emailContent || '', sendEdmEmailAction?.edmEmailSubjects || []);
        sendEdmEmailAction.templateParams = templateParams;
      }

      if (values?.branchAction?.actionType) {
        values.branchAction = {
          ...currentItem.branchAction,
          ...values.branchAction,
          // actionType:
          actionName: AutoMarketTaskActionTypeName[values.branchAction.actionType as AutoMarketTaskActionType],
        };
      }

      if (values.truckAction.actionType) {
        if (!values.truckAction.excludeConditionVo) {
          values.truckAction = {
            ...currentItem.truckAction,
            ...values.truckAction,
            excludeConditionVo,
            actionName: AutoMarketTaskActionTypeName[values.truckAction.actionType as AutoMarketTaskActionType],
          };
        } else {
          values.truckAction = {
            ...currentItem.truckAction,
            ...values.truckAction,
            actionName: AutoMarketTaskActionTypeName[values.truckAction.actionType as AutoMarketTaskActionType],
          };
        }
      }
      console.log('xxx-values-init-save-1', values);

      if (aiModifyRef.current) {
        // 插入AI多文本内容
        setSaveLoading(true);
        aiModifyRef.current
          ?.save()
          .then((multipleContentInfo: any) => {
            if (values.truckAction?.actionContent?.sendEdmEmailAction) {
              values.truckAction.actionContent.sendEdmEmailAction.multipleContentInfo = multipleContentInfo;
            }
            onSave(values);
          })
          .finally(() => setSaveLoading(false));
      } else {
        onSave(values);
      }
    });
  };
  const onValuesChange = (values: AutoMarketTaskTruckAction) => {
    console.log('xxx-init', values);
    // === AutoMarketTaskActionType.SEND_EDM
    if (values?.truckAction?.triggerConditionVo?.triggerConditionList[0]?.conditionContent && showBranch) {
      addBranch();
    }
    if (values?.branchAction?.actionType || values?.truckAction?.actionType) {
      setActionType(values?.branchAction?.actionType ? values?.branchAction?.actionType : values?.truckAction?.actionType);

      // 表单初始化
      if (values?.truckAction?.actionType === AutoMarketTaskActionType.SEND_EDM) {
        form.setFieldsValue({
          truckAction: {
            actionContent: FORM_INITIAL_VALUE.additionalEdmAndGroupSetting.truckAction.actionContent,
          },
        });
        setEditorValues({
          emailContent: '',
          emailAttachment: '',
        });
        initEmailData();
      } else {
        form.setFieldsValue({
          truckAction: {
            actionContent: FORM_INITIAL_VALUE.additionalEdmAndGroupSetting.branchAction.actionContent,
          },
        });
        showBranch && onDeleteBranch();
      }
    }
  };

  const addBranch = () => {
    setShowBranch(true);
    const emailOpDays = form.getFieldValue(['truckAction', 'triggerConditionVo', 'triggerConditionList', 0, 'conditionContent', 'emailOpDays']);

    form.setFieldsValue({
      branchAction: {
        actionType: AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP,
        actionContent: {
          updateContactGroupInfoActionList: [
            {
              opType: 0,
              groupIds: [],
            },
          ],
        },
      },
    });
    form.setFields([
      {
        name: ['branchAction', 'triggerConditionVo', 'triggerConditionList', 0, 'conditionContent', 'emailOpType'],
        value: 1 || '',
      },
    ]);
    // 默认输回复
    form.setFields([
      {
        name: ['branchAction', 'triggerConditionVo', 'triggerConditionList', 0, 'conditionContent', 'emailOpDays'],
        value: emailOpDays || '',
      },
    ]);
  };

  const onDeleteBranch = () => {
    setShowBranch(false);
    form.setFieldsValue({
      branchAction: {
        actionType: '',
      },
    });
  };

  useEffect(() => {
    if (actionType === AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP) {
      setActionTypeField('truckAction');
    } else {
      setActionTypeField('truckAction');
    }
  }, [actionType]);

  const handleEditorSave = (nextEditorValues: EdmEditorValues) => {
    nextEditorValues.emailContent = addEmailContent(nextEditorValues.emailContent) as string;
    form.setFieldsValue({
      truckAction: {
        actionContent: {
          sendEdmEmailAction: nextEditorValues,
        },
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
  const addEmailContent = (htmlStr: string) => {
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
      truckAction: {
        actionContent: {
          sendEdmEmailAction: {
            emailContent,
            emailAttachment: '',
          },
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
        branchAction: {
          actionContent: {
            sendEdmEmailAction: payload,
          },
        },
      });
      setEditorValues(payload);
      setEditorVisible(true);
    };
    const values: AutoMarketTaskTruckAction = form.getFieldsValue();
    const { sendEdmEmailAction } = values.truckAction.actionContent;
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
    const values: AutoMarketTaskTruckAction = form.getFieldsValue();
    const { sendEdmEmailAction } = values.truckAction.actionContent;
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

  useEffect(() => {
    if (!editorValues?.emailContent) {
      aiModifyRef.current.resetStatus();
    }
  }, [editorValues]);

  return (
    <Drawer
      className={style.additionalEdmSetting}
      title={getIn18Text('SHEZHIZHUIJIADONGZUO')}
      contentWrapperStyle={{ width: 550 }}
      visible={visible}
      onClose={async () => {
        await aiModifyRef.current?.stop();
        form.setFieldsValue({ ...values });
        onClose();
      }}
      footer={
        <div className={style.additionalEdmSettingFooter}>
          <Button onClick={handleReset}>{getIn18Text('ZHONGZHI')}</Button>
          <Button type="primary" onClick={handleSave} loading={saveLoading}>
            {getIn18Text('BAOCUN')}
          </Button>
        </div>
      }
    >
      <div className={style.additionalEdmSettingBody}>
        <MainBranchTitle disabled={!isCanAddBranch} showBranch={showBranch} addBranch={() => addBranch()} />
        <Form className={style.form} form={form} layout="vertical" onValuesChange={onValuesChange}>
          <div className={style.branchWrap}>
            <Form.Item name={[actionTypeField, 'triggerConditionVo']} noStyle>
              <Form.List name={[actionTypeField, 'triggerConditionVo', 'triggerConditionList']}>
                {fields => (
                  <>
                    {fields.map(({ key, name, fieldKey, ...restField }, index) => {
                      return (
                        <Form.Item noStyle shouldUpdate={() => true}>
                          {() => {
                            const opType = form.getFieldValue([actionTypeField, 'triggerConditionVo', 'triggerConditionList', name, 'conditionContent', 'emailOpType']);
                            const disableDays = ['0', '1'].includes(String(opType)); // 主动  2,3 是被动
                            return (
                              <Form.Item className={style.formItemTriggerCondition}>
                                <div className={style.triggerCondition}>
                                  {disableDays ? null : (
                                    <>
                                      {String(opType) !== '100' && <span className={style.spaceText}>{getTransText('MANZUTIAOJIAN')}</span>}

                                      <Form.Item
                                        {...restField}
                                        name={[name, 'conditionContent', 'emailOpDays']}
                                        fieldKey={[name, 'conditionContent', 'emailOpDays']}
                                        rules={[{ required: true, message: getIn18Text('QINGSHURUTIANSHU') }]}
                                      >
                                        <InputNumber precision={0} className={style.emailOpDays} placeholder={getIn18Text('SHURUTIANSHU')} min={1} />
                                      </Form.Item>
                                      <span className={style.spaceText}>{String(opType) !== '100' ? getTransText('TIANNEI') : getTransText('TIANHOU')}</span>
                                    </>
                                  )}
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'conditionContent', 'emailOpType']}
                                    fieldKey={[name, 'conditionContent', 'emailOpType']}
                                    rules={[{ required: true, message: getIn18Text('QINGXUANZEDONGZUO') }]}
                                  >
                                    <EmailOpTypeSelect
                                      branchStatus={showBranch}
                                      style={{ width: 130 }}
                                      onChange={type => {
                                        // 选择被动 2,3
                                        if ([2, 3].includes(type as number)) {
                                          setIsPassive(true);
                                        } else {
                                          setIsPassive(false);
                                          showBranch && onDeleteBranch();
                                        }

                                        if (![2, 3, 100].includes(type as number)) {
                                          const formData = form.getFieldsValue();
                                          if (formData?.truckAction?.triggerConditionVo?.triggerConditionList?.[index]?.conditionContent) {
                                            formData.truckAction.triggerConditionVo.triggerConditionList[index].conditionContent.emailOpDays = '';
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
                                  <span className={style.spaceText}>{getTransText('SHANGFENGYOUJIAN')}</span>
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
            <Form.Item name={['truckAction', 'actionType']}>
              <RadioGroup isNeedWarning={true} branchStatus={showBranch} addressDisabled={addressDisabled} />
            </Form.Item>
            <div className={style.edmEmailWrap}>
              {actionType !== AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP ? (
                <EdmMail
                  handleCustomSourceClick={handleCustomSourceClick}
                  handleEdmSourceClick={handleEdmSourceClick}
                  onTemplateClick={onTemplateClick}
                  editorValues={editorValues}
                  isDiabledSmart={isDiabledSmart}
                  qs={qs}
                  ref={aiModifyRef}
                  form={form}
                  setEditorVisible={() => setEditorVisible(true)}
                />
              ) : (
                <MainContactGroup />
              )}
            </div>
          </div>

          {showBranch ? (
            <>
              <ConditonBranchTitle onDelete={() => onDeleteBranch()} />
              <div className={style.branchWrap}>
                {/* <div className={style.edmEmailWrap}> */}
                <ContactGroup />
                {/* </div> */}
              </div>
            </>
          ) : null}
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
