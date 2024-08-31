import React, { useState, useEffect } from 'react';
import { Select, Form, FormInstance, Space } from 'antd';
import MinusCircleFilled from '@ant-design/icons/MinusCircleFilled';
import PlusCircleFilled from '@ant-design/icons/PlusCircleFilled';
import classnames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import { debounce, isObject } from 'lodash';
import { AccountApi, apiHolder, apis, ContactApi, MailClassifyRuleCondition } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import TagCloseIcon from '@web-common/components/UI/Icons/svgs/TagCloseSvg';
import ContactScheduleModal from '@web-common/components/UI/SiriusContact/scheduleModal';
import TriangleDownIcon from '@web-common/components/UI/Icons/svgs/TriangleDown';
import { ContactItem } from '@web-common/utils/contact_util';
import styles from './conditionAction.module.scss';
import variables from '@web-common/styles/export.module.scss';
import { getIn18Text } from 'api';

const { Option } = Select;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
interface conditionActionProps {
  operator: string;
  rules: MailClassifyRuleCondition[];
  form: FormInstance<any>;
  isEntrance: boolean;
}
const defaultCondition = {
  field: 'from',
  ignoreCase: false,
  operator: 'contains',
  operand: [],
};
const filterRules = (rules: MailClassifyRuleCondition[], isEntrance: boolean) =>
  rules.map(item => {
    if (item.field === 'subject' && isEntrance) {
      return {
        ...item,
        operand: [],
      };
    }
    return item;
  });
const convert2ContactItem = (operand: any = []) => {
  if (operand?.length) {
    return operand.map((item: any) => (typeof item === 'string' ? ({ email: item, name: item } as unknown as ContactItem) : item)) as ContactItem[];
  }
  return operand;
};
const NON_MAIL_OPTION = ['subject', 'attachmentName', 'accounts'];

/**
 * 条件规则
 */
export const ConditionAction: React.FC<conditionActionProps> = props => {
  const { operator = 'and', rules = [], form, isEntrance } = props;
  const [conditionRules, setConditionRules] = useState<MailClassifyRuleCondition[]>(rules.length > 0 ? filterRules(rules, isEntrance) : [defaultCondition]);
  // 用于控制新增规则
  const [adding, setAdding] = useState<boolean>(false);
  const [connectText, setConnectText] = useState<string>(operator === 'and' ? getIn18Text('QIE') : getIn18Text('HUO'));
  // 入口进入且回显主题的情况下，展示主题可编辑状态
  const [searchValue, setSearchValue] = useState<string>(isEntrance ? rules.find(item => item.field === 'subject')?.operand[0] || '' : '');
  const [subjectEditState, setSubjectEditState] = useState<boolean>(!!(isEntrance && rules.some(item => item.field === 'subject')));
  const [currentIndex, setCurrentIndex] = useState<number>(
    subjectEditState
      ? Math.max(
          rules.findIndex(item => item.field === 'subject'),
          0
        )
      : 0
  );
  const handleSearch = (str: string) => {
    setSearchValue(str);
  };
  const updateFields = (rules: MailClassifyRuleCondition[]) => {
    form.setFieldsValue({ condictions: rules });
  };
  useEffect(() => {
    if (rules.length <= 0) {
      return;
    }
    // 将rules中邮件地址相关的operand的结构统一，用于回显邮件对应的用户昵称
    Promise.all(
      rules.map(async item => {
        if (!NON_MAIL_OPTION.includes(item?.field as string)) {
          // 可以查询到的内部联系人（doGetContactByItem方法只能返回可以查询到的联系人的结果）
          const uniqueOperand = Array.isArray(item.operand) ? Array.from(new Set(item.operand)) : item.operand;
          const internalContact = (
            await contactApi.doGetContactByItem({
              type: 'EMAIL',
              value: uniqueOperand,
              filterType: 'enterprise',
              _account: accountApi.getCurrentAccount().email,
            })
          ).map(itm => ({
            name: itm?.contact?.contactName,
            email: itm?.contact?.accountName,
          }));
          // 查询不到的外部联系人（通过过滤internalContact筛选出来）
          const externalContact = item.operand.filter(itm => !internalContact.map(itm => itm.email).includes(itm));
          // 更新operand
          item.operand = [...internalContact, ...externalContact.map(itm => ({ name: itm, email: itm }))];
        }
        return item;
      })
    ).then(res => {
      // 入口进入且回显主题的情况下，取消主题胶囊的展示，只展示主题可编辑状态
      const updateRules = filterRules(res, isEntrance);
      updateFields(updateRules);
      setConditionRules(updateRules);
      setCurrentIndex(-1);
    });
  }, [rules.length]);
  useEffect(() => {
    form.setFieldsValue({ operator });
  }, [operator]);
  useEffect(
    () => () => {
      form.setFieldsValue({
        operator: 'and',
        condictions: [defaultCondition],
      });
    },
    []
  );
  const isNonMailOption = (index: number) => NON_MAIL_OPTION.includes(form.getFieldValue('condictions')[index]?.field || '');
  // 校验规则
  const validatorRule = (_, value) => {
    const trimValueList = value?.filter((item: string | ContactItem) => (isObject(item) ? item?.email?.trim() : item?.trim()));
    const character1 = trimValueList?.find((item: string | ContactItem) => (isObject(item) ? item?.email?.indexOf('\\') > -1 : item?.indexOf('\\') > -1)) ? '\\' : '';
    const character2 = trimValueList?.find((item: string | ContactItem) => (isObject(item) ? item?.email?.indexOf('"') > -1 : item?.indexOf('"') > -1)) ? '"' : '';
    if (character1 && character2) {
      return Promise.reject(new Error(`不支持保存特殊字符${character1}和${character2}，请修改`));
    }
    if (character1 || character2) {
      return Promise.reject(new Error(`不支持保存特殊字符${character1 || character2}，请修改`));
    }
    const max = isObject(value[0]) ? 30 : 3;
    if (trimValueList?.length > max) {
      return Promise.reject(new Error(getIn18Text(`NEIRONGBUDECHAO${max}`)));
    }
    return Promise.resolve();
  };
  // 警告提示
  const warnMessage = () => {
    SiriusMessage.warn({ content: getIn18Text('YIYOUZHONGFUNEI') });
  };
  const handleSelectChange = (value: string, index: number) => {
    const fieldType: string = form.getFieldValue('condictions')[index]?.field || '';
    const specialType = NON_MAIL_OPTION.includes(fieldType);
    const rules = cloneDeep(form.getFieldValue('condictions'));
    // 如果主题还在可编辑状态，更新为胶囊
    if (searchValue) {
      const subjectIndex = rules.findLastIndex((item: MailClassifyRuleCondition) => item.field === 'subject');
      if (subjectIndex > -1) {
        rules.splice(subjectIndex, 1, {
          ...defaultCondition,
          operand: [searchValue],
          field: 'subject',
        });
        handleSearch('');
      }
    }
    rules.splice(index, 1, {
      ...defaultCondition,
      operand: specialType ? [] : rules[index].operand,
      field: value,
    });
    updateFields(rules);
    setSubjectEditState(false);
  };
  // 过滤一下选中内容
  const filterValueForm = (valList, type: 'mail' | 'other') => {
    if (type === 'mail') {
      return valList.filter((item: ContactItem) => item.email.trim());
    }
    const trimList = valList?.map((item: string) => item?.trim())?.filter((item: string) => item);
    const noRepeatList = Array.from(new Set(trimList));
    // 针对有前后空格的重复内容
    if (trimList.length !== noRepeatList.length) {
      warnMessage();
    }
    return noRepeatList.filter(item => item);
  };
  // 针对无前后空格的重复内容
  const handleSelect = debounce((value, option) => {
    if (value === option.value) {
      warnMessage();
    }
  }, 300);
  // 增加规则
  const handleAdd = (fields, add: Function, index: number) => {
    if (fields.length >= 10 || adding) {
      return;
    }
    setAdding(true);
    const newIndex = index + 1;
    add(defaultCondition, newIndex);
    updateFields(form.getFieldValue('condictions'));
    setSubjectEditState(false);
    setCurrentIndex(newIndex);
    const timer = setTimeout(() => {
      setAdding(false);
      clearTimeout(timer);
    }, 300);
  };
  // 删除规则
  const handleDelete = (fields, remove: Function, index: number) => {
    if (fields.length > 1) {
      remove(index);
      updateFields(form.getFieldValue('condictions'));
      setConditionRules(form.getFieldValue('condictions'));
    }
  };
  return (
    <div className={styles.classifyCondition}>
      <div className={styles.classifyConditionHead}>
        <span className={styles.classifyConditionTitle}>{getIn18Text('SHOUDAOXINYOUJIAN')}</span>
        <Form.Item name="operator" initialValue={operator}>
          <Select
            getPopupContainer={node => node.parentElement}
            style={{ width: 128 }}
            suffixIcon={<TriangleDownIcon />}
            onChange={val => setConnectText(val === 'and' ? getIn18Text('QIE') : getIn18Text('HUO'))}
          >
            <Option value="and">{getIn18Text('SUOYOUTIAOJIAN')}</Option>
            <Option value="or">{getIn18Text('RENYITIAOJIAN')}</Option>
          </Select>
        </Form.Item>
      </div>
      <div className={styles.classifyConditionContent}>
        <Form.List name="condictions" initialValue={conditionRules}>
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Space key={field.key} align="baseline">
                  <div className={classnames(styles.classifyConditionItem, form.getFieldValue('condictions').length <= 1 ? styles.classifyConditionItemRadius : {})}>
                    <span className={styles.classifyConditionItemConnect}>{connectText}</span>
                    <Form.Item className={styles.classifyConditionItemOption} {...field} name={[field.name, 'field']}>
                      <Select
                        getPopupContainer={node => node.parentElement}
                        style={{ width: index === 0 ? 144 : 128 }}
                        suffixIcon={<TriangleDownIcon />}
                        onChange={(value: string) => handleSelectChange(value, index)}
                      >
                        <Option value="from">{getIn18Text('FAJIANREN')}</Option>
                        <Option value="to">{getIn18Text('SHOUJIANREN')}</Option>
                        <Option value="cc">{getIn18Text('CHAOSONGREN')}</Option>
                        <Option value="recipients">{getIn18Text('SHOUJIANRENHUOCHAO')}</Option>
                        <Option value="subject">{getIn18Text('ZHUTI')}</Option>
                        <Option value="attachmentName">{getIn18Text('FUJIANMINGCHENG')}</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'operator']}>
                      <Select getPopupContainer={node => node.parentElement} style={{ width: 84 }} suffixIcon={<TriangleDownIcon />}>
                        <Option value="contains">{getIn18Text('BAOHAN')}</Option>
                        <Option value="excludes">{getIn18Text('BUBAOHAN')}</Option>
                      </Select>
                    </Form.Item>
                    <div className={classnames(styles.classifyConditionItemInput, isNonMailOption(index) ? '' : styles.classifyConditionItemInputMail)}>
                      {isNonMailOption(index) ? (
                        <Form.Item
                          {...field}
                          name={[field.name, 'operand']}
                          rules={[{ required: true, message: getIn18Text('QINGSHURUNEIRONG') }, { validator: validatorRule }]}
                          // 过滤选中的内容
                          getValueFromEvent={valList => filterValueForm(valList, 'other')}
                        >
                          <Select
                            {...(subjectEditState ? { searchValue } : {})}
                            onSearch={handleSearch}
                            allowClear
                            suffixIcon={<TriangleDownIcon />}
                            removeIcon={<TagCloseIcon />}
                            placeholder={`可输入多个${
                              form.getFieldValue('condictions')[index]?.field === 'subject' ? getIn18Text('ZHUTI') : getIn18Text('FUJIANMINGCHENG')
                            }，按回车确认`}
                            mode="tags"
                            maxTagTextLength={200}
                            style={{ width: '100%' }}
                            open={false}
                            autoFocus={index === currentIndex}
                            className={styles.classifyTagSelect}
                            onChange={() => handleSearch('')}
                            // 设置open={false}后选中一项目会多次触发onSelect事件，官网不会，暂未找到原因，先用debounce
                            onSelect={handleSelect}
                          />
                        </Form.Item>
                      ) : (
                        <Form.Item
                          {...field}
                          name={[field.name, 'operand']}
                          rules={[{ required: true, message: getIn18Text('QINGSHURUNEIRONG') }, { validator: validatorRule }]}
                          // 过滤选中的内容
                          getValueFromEvent={valList => filterValueForm(valList, 'mail')}
                          className={styles.classifyConditionItemMail}
                        >
                          <ContactScheduleModal
                            includeSelf
                            hideAvatar
                            unSelect
                            multiRow
                            allowClear
                            repeatToast
                            ceiling={30}
                            autoFocus={index === currentIndex}
                            defaultSelectList={convert2ContactItem(conditionRules[index]?.operand)}
                            placeholder={getIn18Text('KESHURUYOUXIANG')}
                            style={{ minHeight: 32 }}
                            onMouseLeave={() => setCurrentIndex(-1)}
                            characterLimit={50}
                          />
                        </Form.Item>
                      )}
                    </div>
                    <div className={styles.classifyConditionDelete} onClick={() => handleDelete(fields, remove, index)}>
                      <MinusCircleFilled style={{ color: fields.length <= 1 ? 'rgba(163, 164, 169, .5)' : `${variables.text2}` }} />
                    </div>
                    <div className={styles.classifyConditionAdd} onClick={() => handleAdd(fields, add, index)}>
                      <PlusCircleFilled style={{ color: fields.length >= 10 ? 'rgba(56, 110, 231, .5)' : `${variables.text2}` }} />
                    </div>
                  </div>
                </Space>
              ))}
            </>
          )}
        </Form.List>
      </div>
    </div>
  );
};
