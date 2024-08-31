import React, { useState } from 'react';
import { Checkbox } from './index';
import CompDoc from '../CompDoc/index';

const ButtonDoc: React.FC = () => {
  const describe = `## Checkbox 多选
    当前组件是基于antd 的 Checkbox 组件包装生成的，所以支持 antd Checkbox 组件所有API。`;
  const defaultCheckedList = ['Apple', 'Orange'];
  const plainOptions = ['Apple', 'Pear', 'Orange'];
  const [checkedList, setCheckedList] = useState(defaultCheckedList);
  const [checkAll, setCheckAll] = useState(false);
  const [indeterminate, setIndeterminate] = useState(true);
  const onChange = (e: any) => {
    console.log(`checked = ${e.target.checked}`);
  };
  const onChange2 = (checkedValues: any) => {
    console.log('checked = ', checkedValues);
  };

  const onCheckAllChange = (e: any) => {
    setCheckedList(e.target.checked ? plainOptions : []);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
  };

  const onChange3 = (list: any) => {
    setCheckedList(list);
    setIndeterminate(!!list.length && list.length < plainOptions.length);
    setCheckAll(list.length === plainOptions.length);
  };

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Link href="https://3x.ant.design/components/checkbox-cn/">antd Checkbox 文档</CompDoc.Link>
        <CompDoc.Use
          npmPath="import Checkbox, { CheckboxProps, CheckboxOptionType } from '@lingxi-common-component/sirius-ui/Checkbox';"
          path="import { Checkbox } from '@web-common/components/UI/Checkbox';"
        />
        <CompDoc.RenderCode customCode={`<Checkbox onChange={onChange}>Checkbox</Checkbox>`} describe="#### 基础多选">
          <Checkbox onChange={onChange}>Checkbox</Checkbox>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode customCode={`<Checkbox disabled onChange={onChange}>Checkbox</Checkbox>`} describe="#### disabled 禁用，失效状态">
          <Checkbox disabled onChange={onChange}>
            Checkbox
          </Checkbox>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<Checkbox indeterminate={true} checked>Checkbox</Checkbox>`}
          describe="#### indeterminate 设置 indeterminate 状态，只负责样式控制"
        >
          <Checkbox indeterminate={true} checked>
            Checkbox
          </Checkbox>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<Checkbox.Group options={plainOptions} defaultValue={['Apple']} onChange={onChange2} />`}
          describe="#### Checkbox.Group 多选选组合"
        >
          <Checkbox.Group options={plainOptions} defaultValue={['Apple']} onChange={onChange2} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>Check all</Checkbox><br /><Checkbox.Group options={plainOptions} value={checkedList} onChange={onChange3} />`}
          describe="#### 操作全选"
        >
          <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
            Check all
          </Checkbox>
          <br />
          <Checkbox.Group options={plainOptions} value={checkedList} onChange={onChange3} />
        </CompDoc.RenderCode>
      </CompDoc>
    </>
  );
};

export default ButtonDoc;
