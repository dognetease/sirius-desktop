import React, { useState, useEffect } from 'react';
import { Select, Checkbox, Form, FormInstance } from 'antd';
import TriangleDownIcon from '@web-common/components/UI/Icons/svgs/TriangleDown';
import TagCloseIcon from '@web-common/components/UI/Icons/svgs/TagCloseSvg';
import styles from './applyAction.module.scss';
import { getIn18Text } from 'api';
const CheckboxGroup = Checkbox.Group;
interface applyActionProps {
  operand: string[];
  optionsList: string[];
  form: FormInstance<any>;
}
export const ApplyAction: React.FC<applyActionProps> = props => {
  const { form, operand, optionsList } = props;
  const [selectOpen, setSelectOpen] = useState<boolean>(false);
  const [checkAll, setCheckAll] = useState<boolean>(false);
  const [defaultOperand, setDefaultOperand] = useState<string[]>([]);
  const [indeterminate, setIndeterminate] = useState<boolean>(true);
  useEffect(() => {
    // 如果新建或者编辑选了所有地址的规则，全选为true
    if (operand.length === 0 || operand.length === optionsList.length) {
      setCheckAll(true);
      setDefaultOperand(optionsList);
      form.setFieldsValue({ accounts: optionsList });
    } else {
      setDefaultOperand(operand);
      form.setFieldsValue({ accounts: operand });
    }
  }, [operand]);
  const onChange = list => {
    setDefaultOperand(list);
    setIndeterminate(!!list.length && list.length < optionsList.length);
    form.setFieldsValue({ accounts: list });
    setCheckAll(list.length === optionsList.length);
  };
  const onCheck = e => {
    const { checked } = e.target;
    setCheckAll(checked);
    setIndeterminate(false);
    setDefaultOperand(checked ? optionsList : []);
    form.setFieldsValue({
      accounts: checked ? optionsList : [],
    });
  };
  return (
    <div className={styles.classifyApply}>
      <span className={styles.classifyApplyTitle}>{getIn18Text('GUIZESHIYONGZHANG')}</span>
      <Form.Item name="accounts" initialValue={defaultOperand} rules={[{ required: true, message: getIn18Text('QINGXUANZE') }]}>
        <Select
          placeholder={getIn18Text('XUANZEGUIZESHI')}
          className={styles.classifyApplySelect}
          style={{ width: '100%' }}
          open={selectOpen}
          mode="multiple"
          allowClear
          onDropdownVisibleChange={setSelectOpen}
          maxTagCount={'responsive'}
          showArrow={true}
          suffixIcon={<TriangleDownIcon className="dark-invert" />}
          removeIcon={<TagCloseIcon className="dark-invert" />}
          onChange={onChange}
          dropdownRender={menu => (
            <>
              <Checkbox className={styles.classifyApplyCheckbox} {...(!checkAll && { indeterminate })} onChange={onCheck} checked={checkAll}>
                {defaultOperand.length === 0 ? getIn18Text('QUANXUAN') : `已选(${defaultOperand.length})`}
              </Checkbox>
              <CheckboxGroup className={styles.classifyApplyCheckGroup} options={optionsList} value={defaultOperand} onChange={onChange} />
            </>
          )}
          getPopupContainer={node => node.parentElement}
        />
      </Form.Item>
    </div>
  );
};
