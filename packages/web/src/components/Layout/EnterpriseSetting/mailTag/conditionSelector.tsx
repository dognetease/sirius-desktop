import React, { useState, useEffect } from 'react';
import { Select, Form, FormInstance, Space } from 'antd';
import MinusCircleOutlined from '@ant-design/icons/MinusCircleOutlined';
import PlusCircleOutlined from '@ant-design/icons/PlusCircleOutlined';
import classnames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import { MailClassifyRuleCondition } from 'api';
import TagCloseIcon from '@web-common/components/UI/Icons/svgs/TagCloseSvg';
import CommaIcon from '@web-common/components/UI/Icons/svgs/CommaSvg';
import ContactScheduleModal from '@web-common/components/UI/SiriusContact/scheduleModal';
import TriangleDownIcon from '@web-common/components/UI/Icons/svgs/TriangleDown';
import styles from '@web-common/components/CustomMailClassify/conditionAction.module.scss';
import { getIn18Text } from 'api';
const { Option } = Select;
interface conditionActionProps {
  operator: string;
  rules: MailClassifyRuleCondition[];
  form: FormInstance<any>;
}
const defaultCondition = {
  field: 'subject',
  ignoreCase: false,
  operator: 'contains',
  operand: [],
};
/**
 * 条件规则
 */
export const ConditionSelector: React.FC<conditionActionProps> = props => {
  const { operator = 'and', rules, form } = props;
  const [conditionRules, setConditionRules] = useState<MailClassifyRuleCondition[]>(rules.length > 0 ? rules : [defaultCondition]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  // 用于控制新增规则
  const [adding, setAdding] = useState<boolean>(false);
  const updateFields = (rules: MailClassifyRuleCondition[]) => {
    form.setFieldsValue({
      condictions: rules,
    });
    setConditionRules(rules);
  };
  useEffect(() => {
    if (rules.length <= 0) {
      return;
    }
    updateFields(rules);
    setCurrentIndex(-1);
  }, [rules.length]);
  useEffect(() => {
    form.setFieldsValue({ operator });
  }, [operator]);
  useEffect(() => {
    return () => {
      form.setFieldsValue({
        operator: 'and',
        condictions: [defaultCondition],
      });
    };
  }, []);
  return (
    <div className={styles.classifyCondition}>
      <div className={styles.classifyConditionHead}>
        <span className={styles.classifyConditionTitle}>{getIn18Text('SHOUDAOXINYOUJIANSHI\uFF0CMANZUYIXIA')}</span>
        <Form.Item name="operator" initialValue={operator}>
          <Select getPopupContainer={node => node.parentElement} style={{ width: 128 }} suffixIcon={<TriangleDownIcon />}>
            <Option value="and">{getIn18Text('SUOYOUTIAOJIAN')}</Option>
            <Option value="or">{getIn18Text('RENYITIAOJIAN')}</Option>
          </Select>
        </Form.Item>
      </div>
      <div className={styles.classifyConditionContent}>
        <Form.List name="condictions" initialValue={conditionRules}>
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => {
                const list =
                  conditionRules[index]?.operand?.map((itm: string) => ({
                    name: itm,
                    email: itm,
                  })) || [];
                return (
                  <Space key={field.key} align="baseline">
                    <div className={classnames(styles.classifyConditionItem, form.getFieldValue('condictions').length <= 1 ? styles.classifyConditionItemRadius : {})}>
                      <Form.Item {...field} name={[field.name, 'field']}>
                        <Select
                          getPopupContainer={node => node.parentElement}
                          style={{ width: 128 }}
                          suffixIcon={<TriangleDownIcon />}
                          onChange={(value: string) => {
                            const rules = cloneDeep(form.getFieldValue('condictions'));
                            rules.splice(index, 1, {
                              ...defaultCondition,
                              operand: value === 'subject' ? [] : rules[index].operand,
                              field: value,
                            });
                            updateFields(rules);
                          }}
                        >
                          {/* <Option value="from">发件人</Option>
<Option value="to">收件人</Option>
<Option value="cc">抄送人</Option>
<Option value="recipients">收件人或抄送人</Option> */}
                          <Option value="subject">{getIn18Text('ZHUTI')}</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, 'operator']}>
                        <Select getPopupContainer={node => node.parentElement} style={{ width: 84 }} suffixIcon={<TriangleDownIcon />}>
                          <Option value="contains">{getIn18Text('BAOHAN')}</Option>
                          {/* <Option value="excludes">不包含</Option> */}
                        </Select>
                      </Form.Item>
                      <div
                        className={classnames(
                          styles.classifyConditionItemInput,
                          form.getFieldValue('condictions')[index].field === 'subject' ? '' : styles.classifyConditionItemInputMail
                        )}
                      >
                        {form.getFieldValue('condictions')[index].field === 'subject' ? (
                          <Form.Item
                            {...field}
                            name={[field.name, 'operand']}
                            rules={[
                              { required: true, message: getIn18Text('QINGSHURUNEIRONG') },
                              {
                                validator: (_, value) => {
                                  if (value instanceof Array && value.length > 5) {
                                    return Promise.reject(new Error(getIn18Text('NEIRONGBUDECHAOGUO5XIANG')));
                                  }
                                  return Promise.resolve();
                                },
                              },
                            ]}
                            getValueFromEvent={valList => {
                              return valList.map((item: string) => item.trim());
                            }}
                          >
                            <Select
                              suffixIcon={<TriangleDownIcon />}
                              placeholder={getIn18Text('KESHURUDUOGEZHUTI\uFF0CANHUICHEQUEREN')}
                              mode="tags"
                              maxTagTextLength={200}
                              style={{ width: '100%' }}
                              open={false}
                              className={styles.classifyTagSelect}
                            />
                          </Form.Item>
                        ) : (
                          <Form.Item
                            {...field}
                            name={[field.name, 'operand']}
                            rules={[
                              { required: true, message: getIn18Text('QINGSHURUNEIRONG') },
                              {
                                validator: (_, value) => {
                                  if (value instanceof Array && value.length > 10) {
                                    return Promise.reject(new Error(getIn18Text('NEIRONGBUDECHAOGUO10XIANG')));
                                  }
                                  return Promise.resolve();
                                },
                              },
                            ]}
                            className={styles.classifyConditionItemMail}
                          >
                            <ContactScheduleModal
                              includeSelf
                              autoFocus={index === currentIndex}
                              defaultSelectList={list}
                              placeholder={getIn18Text('KESHURUYOUXIANGDEZHIHUOCONGTONGXUNLUZHONGXUANZE')}
                              style={{ minHeight: 32 }}
                              onMouseLeave={() => setCurrentIndex(-1)}
                              hideAvatar
                              characterLimit={50}
                            />
                          </Form.Item>
                        )}
                      </div>
                      <div
                        className={styles.classifyConditionDelete}
                        onClick={() => {
                          fields.length > 1 && remove(index);
                        }}
                      >
                        <MinusCircleOutlined style={{ color: fields.length <= 1 ? '#CBCBCE' : '#7D8085' }} />
                      </div>
                      <div
                        className={styles.classifyConditionAdd}
                        onClick={() => {
                          if (fields.length >= 10 || adding) {
                            return;
                          }
                          setAdding(true);
                          const newIndex = index + 1;
                          add(defaultCondition, newIndex);
                          updateFields(form.getFieldValue('condictions'));
                          setCurrentIndex(newIndex);
                          const timer = setTimeout(() => {
                            setAdding(false);
                            clearTimeout(timer);
                          }, 300);
                        }}
                      >
                        <PlusCircleOutlined style={{ color: fields.length >= 10 ? '#CBCBCE' : '#7D8085' }} />
                      </div>
                    </div>
                  </Space>
                );
              })}
            </>
          )}
        </Form.List>
      </div>
    </div>
  );
};
