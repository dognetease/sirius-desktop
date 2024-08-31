import { KeyVal, MeetingRoomListCondition } from 'api';
import { Checkbox, Form, Radio, Select, SelectProps } from 'antd';
import React, { useState } from 'react';
import styles from './extraselect.module.scss';
import { getIn18Text } from 'api';
interface Props<VT> extends SelectProps<VT> {
  capacity_list: KeyVal[];
  instruments: KeyVal[];
  onChange?(values: Pick<MeetingRoomListCondition, 'capacity_code' | 'instruments'>): void;
  getPopoverContainer?: SelectProps<any>['getPopupContainer'];
}
const ExtraSelect: React.FC<Props<any>> = ({ capacity_list, instruments, onChange, getPopoverContainer, ...rest }) => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState<boolean>(false);
  const handleFinish = (values: any) => {
    const { capacity_code, instruments } = values;
    onChange &&
      onChange({
        capacity_code,
        instruments,
      });
    setOpen(false);
  };
  return (
    <Select
      onDropdownVisibleChange={setOpen}
      open={open}
      placeholder={getIn18Text('GENGDUOSHAIXUAN')}
      defaultValue={getIn18Text('GENGDUOSHAIXUAN')}
      dropdownMatchSelectWidth={false}
      dropdownClassName={styles.dropDown}
      getPopupContainer={getPopoverContainer}
      dropdownRender={() => (
        <Form
          form={form}
          layout="vertical"
          colon={false}
          onFinish={handleFinish}
          initialValues={{
            capacity_code: capacity_list[0].code,
            instruments: [instruments[0].code],
          }}
        >
          <Form.Item name="capacity_code" label={getIn18Text('RONGNARENSHU')}>
            <Radio.Group
              className={styles.checkgroup}
              options={capacity_list.map(ca => ({
                label: ca.name,
                value: ca.code,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="instruments"
            label={getIn18Text('SHEBEI')}
            normalize={(value: string[], prevValue: string[]) => {
              if (Array.isArray(value) && Array.isArray(prevValue)) {
                const unlimitedCode = '0';
                const valueSet = new Set(value);
                const prevValueSet = new Set(prevValue);
                // “不限”和其他互斥，分两种情况
                // 1、选了其他的，则“不限”取消选中
                // 2、选了不限，则其他的都取消选中
                if (valueSet.size > 1 && prevValueSet.has(unlimitedCode)) {
                  valueSet.delete(unlimitedCode);
                }
                if (!prevValueSet.has(unlimitedCode) && valueSet.has(unlimitedCode)) {
                  valueSet.clear();
                  valueSet.add(unlimitedCode);
                }
                if (valueSet.size === 0) {
                  return prevValue;
                }
                return Array.from(valueSet);
              }
              return value;
            }}
          >
            <Checkbox.Group
              className={styles.checkgroup}
              options={instruments.map(ca => ({
                label: ca.name,
                value: ca.code,
              }))}
            />
          </Form.Item>
          <div className={styles.footer}>
            <button type="reset" className={styles.default}>
              {getIn18Text('ZHONGZHI')}
            </button>
            <button type="submit" className={styles.primary}>
              {getIn18Text('QUEDING')}
            </button>
          </div>
        </Form>
      )}
      {...rest}
    />
  );
};
export default ExtraSelect;
