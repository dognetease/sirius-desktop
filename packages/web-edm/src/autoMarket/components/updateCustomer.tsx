import React, { useEffect } from 'react';
import { Button, Form, Space, InputNumber } from 'antd';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import { AutoMarketTaskAction, AutoMarketCustomerUpdateField, AutoMarketTaskDetail, AutoMarketTaskActionContent, AutoMarketTaskType } from 'api';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { ReactComponent as AddIcon } from '@/images/icons/edm/add.svg';
import { ReactComponent as RemoveIcon } from '@/images/icons/edm/delete.svg';
import { EmailOpTypeSelect } from './emailOpTypeSelect';
import style from './updateCustomer.module.scss';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';

const { Option } = Select;
interface UpdateCustomerProps {
  visible: boolean;
  taskDetail: AutoMarketTaskDetail;
  values: AutoMarketTaskAction;
  resetValues: AutoMarketTaskAction;
  updateFields: AutoMarketCustomerUpdateField[];
  onSave: (values: AutoMarketTaskAction) => void;
  onClose: () => void;
}
const UpdateCustomer: React.FC<UpdateCustomerProps> = props => {
  const { visible, values, resetValues, updateFields, onSave, onClose } = props;
  const [form] = Form.useForm();
  const resetFieldsValueWithUpdateFields = (values: AutoMarketTaskAction) => {
    if (Array.isArray(updateFields) && updateFields.length) {
      const updateFieldsValue = values?.actionContent.updateCustomerInfoActionList;
      if (!Array.isArray(updateFieldsValue) || !updateFieldsValue.length) {
        form.setFieldsValue({
          ...values,
          actionContent: {
            updateCustomerInfoActionList: [updateFields[0]],
          },
        });
      } else {
        form.setFieldsValue({ ...values });
      }
    }
  };
  useEffect(() => {
    resetFieldsValueWithUpdateFields(values);
  }, [values, updateFields]);
  const handleReset = () => {
    resetFieldsValueWithUpdateFields(resetValues);
  };
  const handleSave = () => {
    form.validateFields().then(values => {
      onSave(values);
    });
  };
  return (
    <Drawer
      className={style.updateCustomer}
      title={getIn18Text('XINXIXIUGAI')}
      contentWrapperStyle={{ width: 550 }}
      visible={visible}
      onClose={() => {
        resetFieldsValueWithUpdateFields(values);
        onClose();
      }}
      footer={
        <div className={style.updateCustomerFooter}>
          <Button onClick={handleReset}>{getIn18Text('ZHONGZHI')}</Button>
          <Button type="primary" onClick={handleSave}>
            {getIn18Text('BAOCUN')}
          </Button>
        </div>
      }
    >
      <div className={style.updateCustomerBody}>
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
                                    style={{ width: 130 }}
                                    onChange={type => {
                                      if (![2, 3, 100].includes(type as number)) {
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
                    );
                  })}
                </>
              )}
            </Form.List>
          </Form.Item>
          <div className={style.groupName}>{getIn18Text('KEHUXINXIXIUGAI')}</div>
          <div className={style.customerInfo}>
            <Form.Item name="actionContent" noStyle>
              <Form.List name={['actionContent', 'updateCustomerInfoActionList']}>
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, fieldKey, ...restField }, index) => {
                      return (
                        <Form.Item key={key}>
                          <Space align="start">
                            <span>{getIn18Text('JIANG')}</span>
                            <Form.Item noStyle shouldUpdate>
                              {() => {
                                const updateCustomerInfoActionList: AutoMarketTaskActionContent.UPDATE_CUSTOMER = form.getFieldValue([
                                  'actionContent',
                                  'updateCustomerInfoActionList',
                                ]);
                                const usedFieldNames = updateCustomerInfoActionList.filter(item => item.fieldName).map(item => item.fieldName);
                                return (
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'fieldName']}
                                    fieldKey={[name, 'fieldName']}
                                    rules={[{ required: true, message: getIn18Text('QINGXUANZEZIDUAN') }]}
                                  >
                                    <Select
                                      placeholder={getIn18Text('QINGXUANZEZIDUAN')}
                                      allowClear
                                      onChange={fieldName => {
                                        const updateCustomerInfoActionList = form.getFieldValue(['actionContent', 'updateCustomerInfoActionList']);
                                        const nextList = [...updateCustomerInfoActionList];
                                        const updateField = updateFields.find(item => item.fieldName === fieldName);
                                        if (updateField) {
                                          nextList[index] = updateField;
                                          form.setFieldsValue({
                                            actionContent: {
                                              updateCustomerInfoActionList: nextList,
                                            },
                                          });
                                        }
                                      }}
                                    >
                                      {updateFields.map(updateField => (
                                        <Option key={updateField.fieldName} value={updateField.fieldName} disabled={usedFieldNames.includes(updateField.fieldName)}>
                                          {updateField.fieldShowName}
                                        </Option>
                                      ))}
                                    </Select>
                                  </Form.Item>
                                );
                              }}
                            </Form.Item>
                            <span>{getIn18Text('TIANJIA')}</span>
                            <Form.Item noStyle shouldUpdate>
                              {() => {
                                const updateCustomerInfoActionList = form.getFieldValue(['actionContent', 'updateCustomerInfoActionList']);
                                const fieldName = updateCustomerInfoActionList[index]?.fieldName;
                                if (!fieldName)
                                  return (
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'updateValue']}
                                      fieldKey={[name, 'updateValue']}
                                      rules={[{ required: true, message: getIn18Text('QINGSHURUZIDUANZHI') }]}
                                    >
                                      <Input placeholder={getIn18Text('QINGSHURUZIDUANZHI')} disabled />
                                    </Form.Item>
                                  );
                                const updateField = updateFields.find(item => item.fieldName === fieldName);
                                if (!updateField) return null;
                                const { fieldShowType, fieldValues } = updateField;
                                if (fieldShowType === 0) return null;
                                if (fieldShowType === 1) {
                                  return (
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'updateValue']}
                                      fieldKey={[name, 'updateValue']}
                                      rules={[{ required: true, message: getIn18Text('QINGSHURUZIDUANZHI') }]}
                                    >
                                      <Input placeholder={getIn18Text('QINGSHURUZIDUANZHI')} />
                                    </Form.Item>
                                  );
                                }
                                if (fieldShowType === 2) {
                                  return (
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'updateValue']}
                                      fieldKey={[name, 'updateValue']}
                                      rules={[{ required: true, message: getIn18Text('QINGXUANZEZIDUANZHI') }]}
                                    >
                                      <Select placeholder={getIn18Text('QINGXUANZEZIDUANZHI')} allowClear>
                                        {fieldValues.map(item => (
                                          <Option key={item.value} value={item.value}>
                                            {item.label}
                                          </Option>
                                        ))}
                                      </Select>
                                    </Form.Item>
                                  );
                                }
                                return null;
                              }}
                            </Form.Item>
                            <Form.Item noStyle>
                              {index === 0 ? (
                                fields.length < updateFields.length ? (
                                  <AddIcon className={style.updateFieldIcon} onClick={() => add({})} />
                                ) : (
                                  <RemoveIcon className={style.updateFieldIcon} onClick={() => remove(index)} />
                                )
                              ) : (
                                <RemoveIcon className={style.updateFieldIcon} onClick={() => remove(index)} />
                              )}
                            </Form.Item>
                          </Space>
                        </Form.Item>
                      );
                    })}
                  </>
                )}
              </Form.List>
            </Form.Item>
          </div>
          <div className={style.tip}>{getIn18Text('YIZHIXINGGUOGAIDONGZUODESHUJUBUZAIZHONGFUZHIXING')}</div>
        </Form>
      </div>
    </Drawer>
  );
};
export default UpdateCustomer;
