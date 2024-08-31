import React, { useEffect } from 'react';
import { Button, InputNumber, Form } from 'antd';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import { AutoMarketTaskAction, apiHolder, apis, AddressBookApi, AutoMarketTaskDetail, AutoMarketTaskType } from 'api';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { getTransText } from '@/components/util/translate';
import { CheckboxSelect } from '../../addressBook/components/CheckboxSelect';
import { useSelectCheckBox } from '../../addressBook/hooks/selectCheckBoxHooks';
import { EmailOpTypeSelect } from './emailOpTypeSelect';
import style from './AdditionalGroupSetting.module.scss';
import { getIn18Text } from 'api';

interface AdditionalEdmSettingProps {
  visible: boolean;
  taskDetail: AutoMarketTaskDetail;
  values: AutoMarketTaskAction;
  resetValues: AutoMarketTaskAction;
  onSave: (values: AutoMarketTaskAction) => void;
  onClose: () => void;
  noTrigger?: boolean;
}

interface GroupSelectProps {
  value?: number[];
  onChange?: (ids: number[]) => void;
  onValidate?: () => void;
}

export const GroupSelect: React.FC<GroupSelectProps> = props => {
  const { options, changeCheckState, unCheckAllOptions, addOptions, addGroupIfNeed } = useSelectCheckBox(props?.value || []);

  useEffect(() => {
    optionChange();
  }, [options]);

  async function optionChange() {
    const selected = options.filter(item => item.checked && item.id).map(item => item.id);
    await addGroupIfNeed();
    props.onChange && props.onChange(selected);
    if (selected?.length) {
      props.onValidate && props.onValidate();
    }
  }

  return (
    <div style={{ marginLeft: 8 }}>
      <CheckboxSelect
        placeholder={getIn18Text('QINGXUANZEFENZU')}
        options={options}
        addGroup={addOptions}
        checkOption={changeCheckState}
        uncheckAll={unCheckAllOptions}
        dropdownClassName={style.checkboxSelect}
      />
    </div>
  );
};

const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
export const AdditionalGroupSetting: React.FC<AdditionalEdmSettingProps> = props => {
  const { visible, values, resetValues, onSave, onClose } = props;
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({ ...values });
  }, [values]);

  const handleReset = () => {
    form.setFieldsValue({ ...resetValues });
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      onSave(values);
    });
  };

  return (
    <Drawer
      className={style.additionalEdmSetting}
      title={getIn18Text('FASONGYINGXIAOYOUJIAN')}
      contentWrapperStyle={{ width: 550 }}
      visible={visible}
      onClose={() => {
        // form.setFieldsValue({ ...values });
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
          {!props.noTrigger ? (
            <Form.Item name="triggerConditionVo" noStyle>
              <Form.List name={['triggerConditionVo', 'triggerConditionList']}>
                {fields => (
                  <>
                    {fields.map(({ key, name, fieldKey, ...restField }, index) => (
                      <Form.Item noStyle shouldUpdate={() => true}>
                        {() => {
                          const opType = form.getFieldValue(['triggerConditionVo', 'triggerConditionList', name, 'conditionContent', 'emailOpType']);
                          const disableDays = ['0', '1'].includes(String(opType));
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
                                    <span className={style.spaceText}>{String(opType) !== '100' ? getIn18Text('TIANNEI') : getIn18Text('TIANHOU')}</span>
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
                                    onChange={() => {
                                      if (disableDays) {
                                        const formData = form.getFieldsValue();
                                        if (formData?.triggerConditionVo?.triggerConditionList?.[index]?.conditionContent) {
                                          formData.triggerConditionVo.triggerConditionList[index].conditionContent.emailOpDays = '';
                                          form.setFieldsValue({ ...formData });
                                        }
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
                    ))}
                  </>
                )}
              </Form.List>
            </Form.Item>
          ) : (
            ''
          )}

          <Form.List name={['actionContent', 'updateContactGroupInfoActionList']}>
            {fields => (
              <>
                {fields.map(({ key, name }, index) => {
                  return (
                    <div className={style.inlineForm}>
                      <div className={style.label}>{getTransText('YINGXIAODIZHIBUZHONG')}</div>
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
                      {/* 
                          <Form.Item noStyle shouldUpdate={() => true}>
                            {
                              () => {
                                const opType = form.getFieldValue(['actionContent', 'updateContactGroupInfoActionList', name, 'opType']);
                                return (
                                  <Form.Item
                                    label={null}
                                    name={[name, 'selectValue']}
                                    rules={[
                                      { required: true, message: String(opType) === '1' ? getTransText("QINGXUANZE") : getTransText("QINGTIANXIENEIRONG") },
                                      {
                                        validator: async (_: any, value: string[]) => {
                                          if (String(opType) === '1') {
                                            const res = await addressBookApi.getAddressGroupList();
                                            const hasError = !(res.find(group => String(group.groupId) === String(value)));
                                            if (hasError) {
                                              return Promise.reject('分组已被删除，请重新选择')
                                            }
                                            return Promise.resolve();
                                          }
                                          return Promise.resolve();
                                        }
                                      }
                                    ]}
                                  >
                                    {
                                      String(opType) === '1' ?
                                        <AddressGroupSelect
                                          style={{ width: '160px', marginLeft: 10 }}
                                          placeholder={getTransText("QINGXUANZE")}
                                          allowClear
                                          showArrow
                                          optionFilterProp="children"
                                        >
                                        </AddressGroupSelect>
                                        :
                                        <Input style={{ width: '160px', marginLeft: 10 }} placeholder={getTransText("QINGTIANXIENEIRONG")}></Input>
                                    }
                                  </Form.Item>
                                )
                              }
                            }
                          </Form.Item> */}
                    </div>
                  );
                })}
              </>
            )}
          </Form.List>
        </Form>
      </div>
    </Drawer>
  );
};
