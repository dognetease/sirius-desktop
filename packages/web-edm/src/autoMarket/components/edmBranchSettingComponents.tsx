import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Form, InputNumber, Space, Input, Radio, Popover, Tooltip, RadioChangeEvent, FormInstance } from 'antd';
import { RadioGroupProps } from 'antd/lib/radio';
import { GroupSelect } from './AdditionalGroupSetting';
import { AutoMarketTaskActionType, AutoMarketTaskActionTypeName, apiHolder, apis, AddressBookApi } from 'api';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import ShowConfirm from '@/components/Layout/Customer/components/confirm/makeSureConfirm';

// import { ReactComponent as QuestionIcon } from '@/images/icons/edm/autoMarket/question.svg';
import DeleteIcon from '@/images/icons/edm/autoMarket/delete.svg';
import style from './edmBranchSettingComponents.module.scss';
import classnames from 'classnames';
import { getTransText } from '@/components/util/translate';
import EmailSource from './emailSource';
import { ReactComponent as AddIcon } from '@/images/icons/edm/autoMarket/add.svg';
import { ReactComponent as RemoveIcon } from '@/images/icons/edm/autoMarket/subtract.svg';
import { getPlainTextFromHtml } from '../../utils';
import { EdmEditorValues } from './edmEditorModal';
import { MultiVersionMails } from './multiVersionMails';
import { SmartAssistant } from './smartAssistant';
import { InsertVariablModal } from './contentEditor/insertVariableModal';
// import explainImg from '@/images/icons/edm/autoMarket/explain.png';
// import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
import { SenderEmail } from '../../components/SenderEmail/senderEmail';
import { getIn18Text } from 'api';

const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;

interface MainBranchTitleProps {
  disabled: Boolean;
  showBranch: Boolean;
  addBranch: () => void;
}

export const MainBranchTitle = (props: MainBranchTitleProps) => {
  const { disabled, showBranch, addBranch } = props;

  const [showTips, setShowTips] = useState<boolean>(false);

  useEffect(() => {
    setShowTips(!disabled);
  }, [disabled]);
  return (
    <div className={style.addBranchWrap}>
      {showBranch ? (
        <div className={style.layoutLeft}>
          <span className={style.addBranch}> {getTransText('ZHUIJIADONGZUO')}1 </span>
        </div>
      ) : (
        <div></div>
      )}
      {/* <div className={style.layoutRight}>
        <HollowOutGuide
          title={getTransText('BIANYUZAIZHUIJIAGONGZUOLIANG')}
          guideId="AUTO_MARKETING_ADD_BRANCH"
          okText={getTransText('ZHIDAOLE')}
          // placement="topRight"
          enable={showTips}
          // hash="#edm"
          type="3"
        >
          <span onClick={() => !disabled && addBranch()} className={classnames(style.addBranch, disabled ? style.disabled : '')}>{`+ ${getTransText(
            'TIANJIAFENZHI'
          )}`}</span>
        </HollowOutGuide>
        <Popover overlayClassName={style.autoMarketExplain} content={<img width={414} src={explainImg}></img>}>
          <QuestionIcon />
        </Popover>
      </div> */}
    </div>
  );
};

interface ConditonBranchTitleProps {
  onDelete: () => void;
}
export const ConditonBranchTitle = (props: ConditonBranchTitleProps) => {
  const { onDelete } = props;
  return (
    <div className={`${style.addBranchWrap} ${style.addBranchWrapAdditional}`}>
      <div className={style.layoutLeft}>
        <span className={style.addBranch}> {getTransText('ZHUIJIADONGZUO')}2 </span>
      </div>
      <div className={style.layoutRight}>
        <Tooltip title={getTransText('SHANCHUFENZHI')}>
          <img className={classnames(style.addBranch, style.delete)} src={DeleteIcon} onClick={onDelete} />
        </Tooltip>
      </div>
    </div>
  );
};

interface WmRadioGroupProps extends RadioGroupProps {
  isNeedWarning: Boolean;
  addressDisabled?: Boolean;
  branchStatus?: Boolean;
  onlyAddreddGroup?: Boolean;
}
export const RadioGroup = (props: WmRadioGroupProps) => {
  const onChangeValue = (e: RadioChangeEvent) => {
    if (props.isNeedWarning && props?.branchStatus) {
      ShowConfirm({
        title: getTransText('JIANCEDAOXIUGAIZHUIJIADONGZUO'),
        content: getTransText('RUOZHUIJIADONGZUO1DECHUFATIAOJIAN'),
        type: 'danger',
        okText: getIn18Text('QUEDING'),
        cancelText: getIn18Text('setting_system_switch_cancel'),
        makeSure: () => props.onChange && props.onChange(e.target.value),
      });
    } else {
      console.log('xxxx-target-vlaue', e.target.value, props);
      props.onChange && props.onChange(e.target.value);
    }
  };
  return (
    <div className={`${style.actionTypeSelect} ${props.onlyAddreddGroup ? style.radioDisabled : ''}`}>
      <span>{getIn18Text('ZEZHIXING')}</span>
      <Radio.Group value={props.value} onChange={onChangeValue}>
        {props.onlyAddreddGroup ? (
          ''
        ) : (
          <Radio disabled={!!props.onlyAddreddGroup} value={AutoMarketTaskActionType.SEND_EDM}>
            {' '}
            {AutoMarketTaskActionTypeName.SEND_EDM}{' '}
          </Radio>
        )}
        {/* {props?.addressDisabled ? null : (
          <Radio disabled={!!props.onlyAddreddGroup} value={AutoMarketTaskActionType.UPDATE_ADDRESS_GROUP}>
            {' '}
            {AutoMarketTaskActionTypeName.UPDATE_ADDRESS_GROUP}
          </Radio>
        )} */}
      </Radio.Group>
    </div>
  );
};

// 分支-分组管理
export const ContactGroup = () => {
  let nameFieldKey = 'branchAction';
  return (
    <>
      <Form.Item name={[nameFieldKey, 'triggerConditionVo']} noStyle>
        <Form.List name={[nameFieldKey, 'triggerConditionVo', 'triggerConditionList']}>
          {fields => (
            <>
              {fields.map(({ key, name, fieldKey, ...restField }, index) => {
                return (
                  <Form.Item noStyle shouldUpdate={() => true}>
                    {() => {
                      return (
                        <Form.Item className={style.formItemTriggerCondition}>
                          <div className={style.triggerCondition}>
                            {
                              <>
                                <span className={style.spaceText}>{getTransText('MANZUTIAOJIAN')}</span>

                                <Form.Item
                                  {...restField}
                                  name={[name, 'conditionContent', 'emailOpDays']}
                                  fieldKey={[name, 'conditionContent', 'emailOpDays']}
                                  rules={[{ required: true, message: getIn18Text('QINGSHURUTIANSHU') }]}
                                >
                                  <InputNumber precision={0} disabled className={style.emailOpDays} placeholder={getIn18Text('SHURUTIANSHU')} min={1} />
                                </Form.Item>
                                <span className={style.spaceText}>{getIn18Text('TIANNEI')}</span>
                              </>
                            }
                            <Form.Item
                              {...restField}
                              name={[name, 'conditionContent', 'emailOpType']}
                              fieldKey={[name, 'conditionContent', 'emailOpType']}
                              rules={[{ required: true, message: getIn18Text('QINGXUANZEDONGZUO') }]}
                            >
                              <Select style={{ width: '100px' }} placeholder={getTransText('QINGXUANZE')} showArrow disabled>
                                <Select.Option value={1}>{getTransText('HUIFU')}</Select.Option>
                              </Select>
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
      <Form.Item name={[nameFieldKey, 'actionType']}>
        <RadioGroup isNeedWarning={false} onlyAddreddGroup={true} />
      </Form.Item>
      <Form.List name={[nameFieldKey, 'actionContent', 'updateContactGroupInfoActionList']}>
        {fields => (
          <>
            {fields.map(({ key, name }, index) => {
              return (
                <div className={style.inlineForm}>
                  <div className={style.label}>{getIn18Text('JIANGLIANXIREN')}</div>
                  <Form.Item label={null} name={[name, 'opType']}>
                    <Select style={{ width: '100px' }} placeholder={getTransText('QINGXUANZE')} showArrow>
                      <Select.Option value={0}>{getTransText('TIANJIAFENZU')}</Select.Option>
                      <Select.Option value={1}>{getTransText('ZHUANYIFENZU')}</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    label={null}
                    style={{ width: '180px' }}
                    name={[name, 'groupIds']}
                    validateTrigger="onValidate"
                    rules={[
                      { required: true, message: getTransText('QINGXUANZE'), type: 'array' },
                      {
                        validator: async (_: any, value: string[]) => {
                          const res = await addressBookApi.getAddressGroupList();
                          const hasError = value.some(val => {
                            return !res.find(group => String(group.groupId) === String(val));
                          });
                          if (hasError) {
                            return Promise.reject(getTransText('BUFENXUANXIANGYIBEISHANCHU'));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <GroupSelect />
                  </Form.Item>
                </div>
              );
            })}
          </>
        )}
      </Form.List>
    </>
  );
};

export const MainContactGroup = () => {
  return (
    <>
      <Form.List name={['truckAction', 'actionContent', 'updateContactGroupInfoActionList']}>
        {fields => (
          <>
            {fields.map(({ key, name }, index) => {
              return (
                <div className={style.inlineForm}>
                  <div className={style.label}>{getIn18Text('JIANGLIANXIREN')}</div>
                  <Form.Item label={null} name={[name, 'opType']}>
                    <Select style={{ width: '100px' }} placeholder={getTransText('QINGXUANZE')} showArrow>
                      <Select.Option value={0}>{getTransText('TIANJIAFENZU')}</Select.Option>
                      <Select.Option value={1}>{getTransText('ZHUANYIFENZU')}</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    label={null}
                    style={{ width: '180px' }}
                    name={[name, 'groupIds']}
                    validateTrigger="onValidate"
                    rules={[
                      { required: true, message: getTransText('QINGXUANZE'), type: 'array' },
                      {
                        validator: async (_: any, value: string[]) => {
                          const res = await addressBookApi.getAddressGroupList();
                          const hasError = value.some(val => {
                            return !res.find(group => String(group.groupId) === String(val));
                          });
                          if (hasError) {
                            return Promise.reject(getTransText('BUFENXUANXIANGYIBEISHANCHU'));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <GroupSelect />
                  </Form.Item>
                </div>
              );
            })}
          </>
        )}
      </Form.List>
    </>
  );
};

interface EdmMailProps {
  handleCustomSourceClick: () => void;
  handleEdmSourceClick: () => void;
  onTemplateClick: () => void;
  isDiabledSmart: Boolean;
  editorValues: EdmEditorValues;
  setEditorVisible: () => void;
  qs: Record<string, string>;
  form: FormInstance;
}
/**
 * 营销邮件
 */
export const EdmMail = React.forwardRef((props: EdmMailProps, ref) => {
  const { handleCustomSourceClick, handleEdmSourceClick, onTemplateClick, editorValues, setEditorVisible, isDiabledSmart, qs, form } = props;

  const [variableVisible, setVariableVisible] = useState(false);
  const visibleInsertVariable = useRef<boolean>(false);
  const themeIndexRef = useRef<number>(0);

  const subjectInputRefs = useMemo<React.RefObject<HTMLInputElement>[]>(() => {
    return Array.from({ length: 5 }).map(() => React.createRef());
  }, []);

  const handleSubjectVariableChange = (value: (string | number)[], index: number) => {
    const variable = value[value.length - 1];
    const insertContent = ` #{${variable}}`;
    const inputEl = subjectInputRefs[index].current;
    const selectionStart = (inputEl as any)?.input?.selectionStart;
    const selectionEnd = (inputEl as any)?.input?.selectionEnd;
    const sendEdmEmailAction = form.getFieldValue(['truckAction', 'actionContent', 'sendEdmEmailAction']);
    const edmEmailSubjects = sendEdmEmailAction.edmEmailSubjects;
    const edmEmailSubject = edmEmailSubjects[index] || '';
    if (typeof selectionStart === 'number' && typeof selectionEnd === 'number') {
      const nextEdmEmailSubjects = [...edmEmailSubjects];
      const nextEdmEmailSubject = edmEmailSubject.substring(0, selectionStart) + insertContent + edmEmailSubject.substring(selectionEnd);
      nextEdmEmailSubjects[index] = nextEdmEmailSubject;
      form.setFields([
        {
          name: ['truckAction', 'actionContent', 'sendEdmEmailAction', 'edmEmailSubjects'],
          value: nextEdmEmailSubjects,
        },
      ]);
      // form.setFieldsValue({
      //   actionContent: {
      //     sendEdmEmailAction: {
      //       ...sendEdmEmailAction,
      //       edmEmailSubjects: nextEdmEmailSubjects,
      //     },
      //   },
      // });
    }
  };

  return (
    <>
      <Form.List name={['truckAction', 'actionContent', 'sendEdmEmailAction', 'edmEmailSubjects']}>
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
      <SenderEmail form={form} name={['truckAction', 'actionContent', 'sendEdmEmailAction', 'senderEmail']} />
      <Form.Item
        label={getIn18Text('FAJIANRENNICHENG')}
        name={['truckAction', 'actionContent', 'sendEdmEmailAction', 'edmEmailSender']}
        rules={[{ required: true, message: getIn18Text('QINGSHURUFAJIANRENNICHENG') }]}
        required
      >
        <Input placeholder={getIn18Text('QINGSHURUFAJIANRENNICHENG')} />
      </Form.Item>
      <Form.Item
        label={getIn18Text('HUIFUYOUXIANG')}
        name={['truckAction', 'actionContent', 'sendEdmEmailAction', 'replyEmail']}
        required
        rules={[
          { required: true, message: getIn18Text('QINGSHURUHUIFUYOUXIANG') },
          { type: 'email', message: getIn18Text('YOUXIANGGESHIBUZHENGQUE') },
        ]}
      >
        <Input placeholder={getIn18Text('QINGSHURUHUIFUYOUXIANG')} />
      </Form.Item>
      <div className={style.groupName}>{getIn18Text('YOUJIANNEIRONG')}</div>
      <Form.Item
        name={['truckAction', 'actionContent', 'sendEdmEmailAction', 'emailContent']}
        rules={[{ required: true, message: getIn18Text('QINGSHURUYOUJIANNEIRONG') }]}
      >
        <Input disabled hidden />
        <Form.Item noStyle>
          <EmailSource onCustomClick={handleCustomSourceClick} onEdmClick={handleEdmSourceClick} onTemplateClick={onTemplateClick} />
          {editorValues.emailContent && (
            <div className={style.emailDraft}>
              <div className={style.emailContent}>{editorValues.emailContent ? getPlainTextFromHtml(editorValues.emailContent) : '-'}</div>
              <div className={style.emailEdit} onClick={() => setEditorVisible()}>
                {getIn18Text('BIANJI')}
              </div>
            </div>
          )}
        </Form.Item>
      </Form.Item>
      <div className={style.smartName}>{getTransText('ZHINENGZHUSHOU')}</div>
      <div className={style.tip}>
        {getTransText('BUZHIDAOZENMETISHENGYINGXIAOXIAOGUO')}
        <a href="https://waimao.163.com/funpage/edm" target="_blank">
          {'了解更多'}
        </a>
      </div>
      <Form.Item name={['truckAction', 'actionContent', 'sendEdmEmailAction', 'replyEdmEmail']} noStyle>
        <SmartAssistant isDiabled={isDiabledSmart}></SmartAssistant>
      </Form.Item>
      <Form.Item name={['multipleContentInfo']} noStyle>
        <MultiVersionMails
          contactSize={625}
          visible={true}
          ref={ref}
          // disabled={Boolean(qs?.taskId || qs?.copyTaskId)}
          emailContent={editorValues.emailContent}
          sendShowForm={() => {}}
        />
      </Form.Item>
      <Form.Item name={['truckAction', 'actionContent', 'sendEdmEmailAction', 'emailAttachment']} noStyle>
        <Input disabled hidden />
      </Form.Item>
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
    </>
  );
});
