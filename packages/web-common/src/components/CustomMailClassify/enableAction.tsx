import React, { useEffect, useState } from 'react';
import { Checkbox, Form, FormInstance } from 'antd';
import styles from './enableAction.module.scss';
import { getIn18Text } from 'api';

interface enableActionProps {
  enable: string[];
  form: FormInstance<any>;
  isDisable: boolean;
}

interface Options {
  label: string;
  value: string;
  disabled?: boolean;
}
/**
 * 是否立即启用
 */
export const EnableAction: React.FC<enableActionProps> = props => {
  const { enable, form, isDisable } = props;
  const [options, setOptions] = useState<Options[]>([]);
  // 编辑进入初始化数据
  useEffect(() => {
    form.setFieldsValue({ enable });
  }, [enable.length]);
  useEffect(() => {
    setOptions([
      {
        label: getIn18Text('GUIZELIJIQI'),
        value: 'effectMail',
      },
      {
        label: getIn18Text('QIYONGQIEBAOCUN'),
        value: 'effectHistoryMail',
        disabled: isDisable,
      },
    ]);
    const enableList = form.getFieldValue('enable');
    if (isDisable && enableList.includes('effectHistoryMail')) {
      const pos = enableList.indexOf('effectHistoryMail');
      enableList.splice(pos, 1);
      form.setFieldsValue({ enable: enableList });
    }
  }, [isDisable]);
  return (
    <Form.Item name="enable" className={`ant-allow-dark ${styles.classifyEnable}`}>
      <Checkbox.Group options={options} />
    </Form.Item>
  );
};
