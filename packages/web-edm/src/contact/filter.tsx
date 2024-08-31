import React, { useState } from 'react';
import { Space, Button } from 'antd';
// import { Switch } from '@web-common/components/UI/Switch';
import Switch from '@lingxi-common-component/sirius-ui/Switch';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import MinusOutlined from '@ant-design/icons/MinusOutlined';
import classnames from 'classnames';
import style from './style.module.scss';
import { getIn18Text } from 'api';

interface Props {
  clearFilters?: () => any;
  confirm: (arg: { closeDropdown: boolean }) => any;
  showSwitch?: boolean;
  switchLabel?: string;
  inputLabel?: string;
  onChange?: (value: string, isChecked?: boolean) => any;
}

export const TableFilter: React.FC<Props> = ({ clearFilters, confirm, showSwitch = false, switchLabel, inputLabel, onChange }) => {
  const [inputVal, setInputVal] = useState('');
  const [switchVal, setSwitchVal] = useState(false);

  function inputChange(value: string) {
    const number = parseInt(value, 10);
    if (Number.isNaN(number)) {
      setInputVal('');
    } else {
      setInputVal(String(number));
    }
  }

  function reset() {
    setSwitchVal(false);
    clearFilters && clearFilters();
    setInputVal('');
    if (onChange) {
      onChange('', false);
    }
  }

  function onFilter() {
    if (onChange) {
      onChange(inputVal, switchVal);
    }
    confirm({ closeDropdown: true });
  }

  function addNum(num: number) {
    const number = parseInt(inputVal, 10) || 0;
    setInputVal(String(number + num));
  }

  return (
    <div className={style.container}>
      {showSwitch ? (
        <div className={classnames(style.field, style.flex)}>
          <div className={style.label}>{switchLabel}</div>
          <div className={style.item}>
            <Switch checked={switchVal} onChange={checked => setSwitchVal(checked)} />
          </div>
        </div>
      ) : (
        ''
      )}
      <div className={classnames(style.field, style.flex)}>
        <div className={style.label}>{inputLabel}</div>
        <div className={style.item}>
          <Input
            style={{ width: '132px' }}
            value={inputVal}
            onChange={({ target: { value } }) => inputChange(value)}
            addonBefore={
              <div className={style.addBtn} onClick={() => addNum(-1)}>
                <MinusOutlined />
              </div>
            }
            addonAfter={
              <div className={style.addBtn} onClick={() => addNum(1)}>
                <PlusOutlined />
              </div>
            }
          />
        </div>
      </div>
      <div className={style.operate}>
        <Space>
          <Button className={style.btnSecond} onClick={reset}>
            {getIn18Text('ZHONGZHI')}
          </Button>
          <Button type="primary" className={style.btn} onClick={onFilter}>
            {getIn18Text('QUEDING')}
          </Button>
        </Space>
      </div>
    </div>
  );
};
