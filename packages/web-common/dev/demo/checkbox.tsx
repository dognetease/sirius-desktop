import React from 'react';
import { Divider, Space, Switch } from 'antd';
import { Checkbox } from '@web-common/components/UI/Checkbox';

const CheckboxGroup = Checkbox.Group;
console.log('CheckboxGroup: ', CheckboxGroup);

const plainOptions = ['Apple', 'Pear', 'Orange'];
const defaultCheckedList = ['Apple', 'Orange'];
const options = [
  { label: 'Apple', value: 'Apple' },
  { label: 'Pear', value: 'Pear' },
  { label: 'Orange', value: 'Orange' },
];
const optionsWithDisabled = [
  { label: 'Apple', value: 'Apple' },
  { label: 'Pear', value: 'Pear' },
  { label: 'Orange', value: 'Orange', disabled: false },
];

export const CheckboxComponent = () => {
  const [checkedList, setCheckedList] = React.useState(defaultCheckedList);
  const [indeterminate, setIndeterminate] = React.useState(true);
  const [checkAll, setCheckAll] = React.useState(false);
  const [isDisabled, setIsDisabled] = React.useState(false);
  const onChange = e => {
    console.log(`checked = ${e.target.checked}`);
  };
  const onChange2 = checkedValues => {
    console.log('checked = ', checkedValues);
  };

  const onChange3 = list => {
    setCheckedList(list);
    setIndeterminate(!!list.length && list.length < plainOptions.length);
    setCheckAll(list.length === plainOptions.length);
  };

  const onCheckAllChange = e => {
    setCheckedList(e.target.checked ? plainOptions : []);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
  };

  return (
    <>
      {/* <Divider type="horizontal" >未选中</Divider>
    <Checkbox />
    <Divider type="horizontal" >hover</Divider>
    <Checkbox />
    <Divider type="horizontal" >选中</Divider>
    <Checkbox checked />
    <Divider type="horizontal" >禁止退选</Divider>
    <Checkbox checked disabled />
    <Divider type="horizontal" >禁止选中</Divider>
    <Checkbox disabled />
    <Divider type="horizontal" >部分选中</Divider>
    <Checkbox indeterminate={true} checked /> */}

      <Divider type="horizontal">单选</Divider>
      <Space>
        <Checkbox onChange={onChange}>Checkbox</Checkbox>
        <Checkbox disabled onChange={onChange}>
          Checkbox
        </Checkbox>
        <Checkbox indeterminate={true} checked>
          Checkbox
        </Checkbox>
      </Space>
      <br />
      <Space style={{ marginTop: 10 }}>
        <Checkbox checked onChange={onChange}>
          Checkbox
        </Checkbox>
        <Checkbox checked disabled onChange={onChange}>
          Checkbox
        </Checkbox>
      </Space>
      <Divider type="horizontal">多选</Divider>
      <Checkbox.Group options={plainOptions} defaultValue={['Apple']} onChange={onChange2} />
      <br />
      <br />
      <Checkbox.Group options={options} defaultValue={['Pear']} onChange={onChange2} />
      <br />
      <br />
      <Checkbox.Group options={optionsWithDisabled} disabled defaultValue={['Apple']} onChange={onChange2} />
      <Divider type="horizontal">操作全选</Divider>
      <Space>
        <Checkbox disabled={isDisabled} indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
          Check all
        </Checkbox>
        <Switch size={'small'} onChange={setIsDisabled} />
      </Space>
      <br />
      <br />
      <CheckboxGroup options={plainOptions} value={checkedList} onChange={onChange3} />
    </>
  );
};
