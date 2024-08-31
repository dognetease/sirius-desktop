import React from 'react';
import CompDoc from '../CompDoc/index';
import Input from './index';
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';

const PaginationDoc: React.FC = () => {
  const describe = `## Input 输入框
    当前组件是基于antd 的 Input 组件包装生成的，所以支持 antd Input 组件所有API。`;

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Link href="https://3x.ant.design/components/input-cn/">antd Input 文档</CompDoc.Link>
        <CompDoc.Use
          npmPath="import Input, { InputProps } from '@lingxi-common-component/sirius-ui/Input';"
          path="import { Input } from '@web-common/components/UI/Input';"
        />
        <CompDoc.RenderCode
          customCode={`<Input placeholder="请输入" style={{ width: 300 }} /><Input disabled placeholder="disabled 为 true" style={{ width: 300 }} />`}
          describe="#### 基础使用"
        >
          <Input placeholder="请输入" style={{ width: 300 }} />
          <Input disabled placeholder="disabled 为 true" style={{ width: 300 }} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<Input size="small" placeholder="请输入" style={{ width: 300 }} /><Input placeholder="请输入" style={{ width: 300 }} /><Input size="large" placeholder="请输入" style={{ width: 300 }} />`}
          describe="#### size 设置不同大小，可选 large default small，默认为 default"
        >
          <Input size="small" placeholder="请输入" style={{ width: 300 }} />
          <Input placeholder="请输入" style={{ width: 300 }} />
          <Input size="large" placeholder="请输入" style={{ width: 300 }} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<Input style={{ width: 300 }} placeholder="请输入网站地址" prefix={<UserOutlined className="site-form-item-icon" />} /><Input style={{ width: 300 }} placeholder="请输入姓名" suffix={<InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />} />`}
          describe="#### prefix 设置前缀、suffix 设置后缀"
        >
          <Input style={{ width: 300 }} placeholder="请输入网站地址" prefix={<UserOutlined className="site-form-item-icon" />} />
          <Input style={{ width: 300 }} placeholder="请输入姓名" suffix={<InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<Input.TextArea rows={3} placeholder="定高 3 行文本" style={{ width: 300, resize: 'none' }} /><Input.TextArea placeholder="可拖拉高度输入框" style={{ width: 300 }} /><Input.TextArea showCount placeholder="可拖拉高度输入框+字数限制" style={{ width: 300 }} maxLength={150} /><Input.TextArea showCount placeholder="多行文本字数限制" style={{ width: 300, resize: 'none' }} maxLength={150} /><Input.TextArea rows={3} placeholder="可清空内容输入框" maxLength={100} allowClear style={{ width: 300, resize: 'none' }} />`}
          describe="#### 文本域"
        >
          <Input.TextArea rows={3} placeholder="定高 3 行文本" style={{ width: 300, resize: 'none' }} />
          <br />
          <br />
          <Input.TextArea placeholder="可拖拉高度输入框" style={{ width: 300 }} />
          <br />
          <br />
          <Input.TextArea showCount placeholder="可拖拉高度输入框+字数限制" style={{ width: 300 }} maxLength={150} />
          <br />
          <br />
          <Input.TextArea showCount placeholder="多行文本字数限制" style={{ width: 300, resize: 'none' }} maxLength={150} />
          <br />
          <br />
          <Input.TextArea rows={3} placeholder="可清空内容输入框" maxLength={100} allowClear style={{ width: 300, resize: 'none' }} />
        </CompDoc.RenderCode>
      </CompDoc>
      <CompDoc.RenderCode customCode={`<Input.Password style={{ width: 300 }} placeholder="input password" />`} describe="#### 密码框">
        <Input.Password style={{ width: 300 }} placeholder="input password" />
      </CompDoc.RenderCode>
      {/* <CompDoc.RenderCode
        customCode={`<Input.Search placeholder="input search text" onSearch={value => console.log(value)} style={{ width: 300 }} />`}
        describe="#### 搜索框"
      >
        <Input.Search placeholder="input search text" onSearch={value => console.log(value)} style={{ width: 300 }} />
      </CompDoc.RenderCode>
      <CompDoc.RenderCode customCode={`<Input.Group><input /><input /></Input.Group>`} describe="#### Group">
        <Input.Group size="large">
          <Input />
          <Input />
        </Input.Group>
      </CompDoc.RenderCode> */}
    </>
  );
};

export default PaginationDoc;
