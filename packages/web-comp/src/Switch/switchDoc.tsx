import React from 'react';
import { Switch } from './index';
import CompDoc from '../CompDoc/index';

const ButtonDoc: React.FC = () => {
  const describe = `## Switch 开关
    当前组件是基于antd 的 Switch 组件包装生成的，所以支持 antd Switch 组件所有API。`;

  const onChange = (checked: any) => {
    console.log(`switch to ${checked}`);
  };
  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Link href="https://3x.ant.design/components/switch-cn/">antd Switch 文档</CompDoc.Link>
        <CompDoc.Use
          npmPath="import Switch, { SwitchProps } from '@lingxi-common-component/sirius-ui/Switch';"
          path="import { Switch } from '@web-common/components/UI/Switch';"
        />
        <CompDoc.RenderCode
          customCode={`<Switch defaultChecked onChange={onChange} /><Switch defaultChecked disabled onChange={onChange} /><Switch onChange={onChange} /><Switch disabled onChange={onChange} />`}
          describe="#### 默认状态【大】"
        >
          <Switch defaultChecked onChange={onChange} />
          <Switch defaultChecked disabled onChange={onChange} />
          <Switch onChange={onChange} />
          <Switch disabled onChange={onChange} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<Switch defaultChecked size="small" onChange={onChange} /><Switch defaultChecked disabled size="small" onChange={onChange} /><Switch size="small" onChange={onChange} /><Switch disabled size="small" onChange={onChange} />`}
          describe="#### 默认状态【小】"
        >
          <Switch defaultChecked size="small" onChange={onChange} />
          <Switch defaultChecked disabled size="small" onChange={onChange} />
          <Switch size="small" onChange={onChange} />
          <Switch disabled size="small" onChange={onChange} />
        </CompDoc.RenderCode>
      </CompDoc>
    </>
  );
};

export default ButtonDoc;
