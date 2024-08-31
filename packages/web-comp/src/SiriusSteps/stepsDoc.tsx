import React, { useState } from 'react';
import Steps from './index';
import CompDoc from '../CompDoc/index';

const Pic = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="&#233;&#128;&#154;&#231;&#148;&#168;_&#229;&#155;&#190;&#231;&#137;&#135;">
      <rect id="Rectangle 1346" x="3" y="3.75" width="18" height="16.5" rx="0.75" stroke="#4C6AFF" stroke-width="1.5" />
      <circle id="Ellipse 115" cx="8.25" cy="9.75" r="2.25" stroke="#4C6AFF" stroke-width="1.5" />
      <path id="Vector 69" d="M8.00652 20.0616L16.086 12.8072C16.2795 12.6335 16.5738 12.637 16.763 12.8153L20.9997 16.8076" stroke="#4C6AFF" stroke-width="1.5" />
    </g>
  </svg>
);
const Pic2 = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3.75" width="18" height="16.5" rx="0.75" stroke="#9FA2AD" stroke-width="1.5" />
    <circle cx="8.25" cy="9.75" r="2.25" stroke="#9FA2AD" stroke-width="1.5" />
    <path d="M8.00652 20.0616L16.086 12.8072C16.2795 12.6335 16.5738 12.637 16.763 12.8153L20.9997 16.8076" stroke="#9FA2AD" stroke-width="1.5" />
  </svg>
);

const StepsDoc: React.FC = () => {
  const { Step } = Steps;
  const [current, setCurrent] = React.useState(2);
  const onChange = (value: number) => {
    console.log('onChange:', current);
    setCurrent(value);
  };
  const description = '这里是提示文字';

  const describe = `## Steps 步骤条
    当前组件是基于antd 的 Steps 组件包装生成的，所以支持 antd Steps 组件所有API。`;

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Link href="https://3x.ant.design/components/steps-cn/">antd Steps 文档</CompDoc.Link>
        <CompDoc.Use
          npmPath="import Steps, { StepsProps } from '@lingxi-common-component/sirius-ui/SiriusSteps';"
          path="import { Steps } from '@web-common/components/UI/SiriusSteps';"
        />
        <CompDoc.RenderCode describe="#### 水平步骤条-带序号的步骤条">
          <Steps current={current} onChange={onChange}>
            <Step title="已完成的步骤" />
            <Step title="进行中的步骤" />
            <Step title="未进行的步骤" />
            <Step title="未进行的步骤" />
          </Steps>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 水平步骤条-带提示文字">
          <Steps current={2}>
            <Step title="已完成的步骤" description={description} />
            <Step title="进行中的步骤" description={description} />
            <Step title="未进行的步骤" description={description} />
            <Step title="未进行的步骤" description={description} />
          </Steps>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 水平步骤条-自定义图标的步骤条">
          <Steps current={2}>
            <Step icon={<Pic />} title="已完成的步骤" description={description} />
            <Step icon={<Pic />} title="进行中的步骤" description={description} />
            <Step icon={<Pic />} title="未进行的步骤" description={description} />
            <Step title="未进行的步骤" description={description} />
          </Steps>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 垂直步骤条-带序号">
          <Steps current={1} direction="vertical">
            <Step title="已完成的步骤" />
            <Step title="进行中的步骤" />
            <Step title="未进行的步骤" />
            <Step title="未进行的步骤" />
          </Steps>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 垂直步骤条-带提示文字">
          <Steps direction="vertical" current={current} onChange={onChange}>
            <Step title="已完成的步骤" description={description} />
            <Step title="进行中的步骤" description={description} />
            <Step title="未进行的步骤" description={description} />
            <Step title="未进行的步骤" description={description} />
          </Steps>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 垂直步骤条-自定义图标步骤条">
          <Steps current={1} direction="vertical">
            <Step icon={<Pic />} title="已完成的步骤" />
            <Step icon={<Pic />} title="进行中的步骤" />
            <Step icon={<Pic2 />} title="未进行的步骤" />
            <Step icon={<Pic2 />} title="未进行的步骤" description={description} />
          </Steps>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 正常流程包含3个状态：已完成、进行中、未进行">
          <Steps current={1}>
            <Step title="已完成的步骤" description={description} />
            <Step title="进行中的步骤" description={description} />
            <Step title="未进行的步骤" description={description} />
            <Step title="未进行的步骤" description={description} />
          </Steps>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 当前流程还可能出现失败或告警状态">
          <Steps current={1}>
            <Step title="已完成的步骤" description={description} />
            <Step title="进行中的步骤" status="error" description={description} />
            <Step title="未进行的步骤" description={description} />
            <Step title="未进行的步骤" description={description} />
          </Steps>
        </CompDoc.RenderCode>
      </CompDoc>
    </>
  );
};

export default StepsDoc;
