import React, { useState } from 'react';
import { Radio } from './index';
import CompDoc from '../CompDoc/index';

const RadioDoc: React.FC = () => {
  const describe = `## Radio 单选
    当前组件是基于antd 的 Radio 组件包装生成的，所以支持 antd Radio 组件所有API。`;
  const [value, setValue] = useState(1);
  const onChange = (e: any) => {
    console.log('radio checked', e.target.value);
    setValue(e.target.value);
  };

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Link href="https://3x.ant.design/components/radio-cn/">antd Radio 文档</CompDoc.Link>
        <CompDoc.Use
          npmPath="import Radio, { RadioProps, RadioChangeEvent, RadioGroupProps } from '@lingxi-common-component/sirius-ui/Radio';"
          path="import { Radio } from '@web-common/components/UI/Radio';"
        />
        <CompDoc.RenderCode customCode={`<Radio>Radio</Radio> <Radio checked>Radio</Radio>`} describe="#### 基础单选">
          <Radio>Radio</Radio> <Radio checked>Radio</Radio>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode customCode={`<Radio disabled>Radio</Radio><Radio disabled checked>Radio</Radio>`} describe="#### disabled 禁用">
          <Radio disabled>Radio</Radio>
          <Radio disabled checked>
            Radio
          </Radio>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<Radio.Group onChange={onChange} value={value}><Radio value={1}>A</Radio><Radio value={2}>B</Radio><Radio value={3}>C</Radio><Radio value={4}>D</Radio></Radio.Group>`}
          describe="#### Radio.Group 单选组合"
        >
          <Radio.Group onChange={onChange} value={value}>
            <Radio value={1}>A</Radio>
            <Radio value={2}>B</Radio>
            <Radio value={3}>C</Radio>
            <Radio value={4}>D</Radio>
          </Radio.Group>
        </CompDoc.RenderCode>
      </CompDoc>
    </>
  );
};

export default RadioDoc;
